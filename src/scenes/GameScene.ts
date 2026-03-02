import type { Game } from "@/game/Game";
import { Scene } from "@/scenes/Scene";
import { Room } from "@/game/Room";
import { KeyboardInput } from "@/game/KeyboardInput";
import { Player } from "@/entities/Player";
import { Pebble } from "@/entities/Pebble";
import { CollisionSystem } from "@/systems/CollisionSystem";
import { MultiplayerSystem } from "@/systems/MultiplayerSystem";
import type { SerializedGameState } from "@/systems/MultiplayerSystem";
import { Camera } from "@/rendering/Camera";
import { AssetLoader } from "@/rendering/AssetLoader";
import { Renderer } from "@/rendering/Renderer";
import { EMPTY_INPUT } from "@/entities/InputState";
import type { InputState } from "@/entities/InputState";
import type { Enemy } from "@/entities/Enemy";
import type { Tear } from "@/entities/Tear";
import type { Item } from "@/entities/Item";
import { TILE_SIZE } from "@/constants";

/**
 * The active gameplay scene.
 *
 * Supports four modes driven by the optional MultiplayerSystem:
 *   - Solo (null): one player, fully local.
 *   - Host: runs full simulation; broadcasts state; receives remote inputs.
 *   - Client: sends local input; applies authoritative state from host.
 *   - Spectator: applies authoritative state; sends nothing.
 */
export class GameScene extends Scene {
  private players: Player[];
  private localPlayerId: string;
  private enemies: Enemy[];
  private tears: Tear[];
  private items: Item[];
  private keyboard: KeyboardInput | null;
  private collision: CollisionSystem;
  private camera: Camera;
  private renderer: Renderer;
  private multiplayer: MultiplayerSystem | null;

  /** Latest received inputs per player id — used by the host to drive remote players. */
  private remoteInputs: Map<string, InputState> = new Map();

  /** Frames left for the "Room Clear!" banner. */
  private roomClearBannerFrames: number = 0;

  private room: Room;

  constructor(
    game: Game,
    ctx: CanvasRenderingContext2D,
    multiplayer: MultiplayerSystem | null
  ) {
    super(game);
    this.multiplayer = multiplayer;
    this.room = this.buildStartingRoom();
    this.camera = new Camera(game.width, game.height);

    const assets = new AssetLoader();
    assets.preload(); // fire-and-forget; Renderer falls back to placeholders until loaded

    this.renderer = new Renderer(ctx, this.camera, assets);
    this.collision = new CollisionSystem();

    const role = multiplayer?.role ?? "solo";

    if (role === "client" || role === "spectator") {
      // Client/spectator: state is populated entirely from the host via onState().
      this.localPlayerId = multiplayer!.localPlayerId;
      this.keyboard = role === "client" ? new KeyboardInput() : null;
      this.players = [];
      this.enemies = [];
      this.tears = [];
      this.items = [];
      this.registerStateListener();
    } else {
      // Solo or host: run full simulation locally.
      this.localPlayerId = multiplayer?.localPlayerId ?? "player1";
      this.players = [
        new Player(this.room.pixelWidth / 2, this.room.pixelHeight / 2, this.localPlayerId),
      ];

      if (role === "host") {
        // Reserve a slot for the joining client; updated when they send inputs.
        this.players.push(
          new Player(this.room.pixelWidth / 4, this.room.pixelHeight / 2, "player2")
        );
        this.registerInputListener();
      }

      this.enemies = [
        new Pebble(100, 100),
        new Pebble(600, 100),
        new Pebble(100, 300),
      ];
      this.tears = [];
      this.items = [];
      this.keyboard = new KeyboardInput();
    }
  }

  /** The player controlled by this client, or undefined for spectators. */
  get localPlayer(): Player | undefined {
    return this.players.find((p) => p.id === this.localPlayerId);
  }

  update(deltaMs: number): void {
    const role = this.multiplayer?.role ?? "solo";

    if (role === "client") {
      // Send local input to host; state is applied asynchronously via onState.
      if (this.keyboard) {
        this.multiplayer!.sendInput(this.localPlayerId, this.keyboard.snapshot());
      }
      return;
    }

    if (role === "spectator") {
      return; // State applied asynchronously via onState.
    }

    // Solo or host: run full local simulation.
    const lp = this.localPlayer;
    if (lp) {
      const input = this.keyboard!.snapshot();
      const newTears = lp.update(
        input,
        deltaMs,
        TILE_SIZE,
        TILE_SIZE,
        this.room.pixelWidth - TILE_SIZE,
        this.room.pixelHeight - TILE_SIZE
      );
      this.tears.push(...newTears);
    }

    // Host: also update remote players with the latest received inputs.
    if (role === "host") {
      for (const player of this.players) {
        if (player.id === this.localPlayerId) continue;
        const remoteInput = this.remoteInputs.get(player.id) ?? EMPTY_INPUT;
        const newTears = player.update(
          remoteInput,
          deltaMs,
          TILE_SIZE,
          TILE_SIZE,
          this.room.pixelWidth - TILE_SIZE,
          this.room.pixelHeight - TILE_SIZE
        );
        this.tears.push(...newTears);
      }
    }

    // Update enemies.
    const livePlayers = this.players.filter((p) => p.alive);
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      this.tears.push(...enemy.update(livePlayers, deltaMs));
    }

    // Update tears.
    for (const tear of this.tears) {
      if (tear.alive) tear.update();
    }

    // Collision detection.
    const liveEnemies = this.enemies.filter((e) => e.alive);
    const liveTears = this.tears.filter((t) => t.alive);
    const liveItems = this.items.filter((i) => i.alive);
    const hits = this.collision.check(livePlayers, liveEnemies, liveTears, liveItems, this.room);

    for (const { tear, enemy } of hits.tearHitEnemy) enemy.takeDamage(tear.damage);
    for (const { player, enemy } of hits.playerHitEnemy) player.takeDamage(enemy.contactDamage);
    for (const { player, item } of hits.playerPickedUpItem) item.apply(player);

    // Room clear.
    if (!this.room.cleared && this.enemies.every((e) => !e.alive)) {
      this.room.clear();
      this.roomClearBannerFrames = 120;
    }
    if (this.roomClearBannerFrames > 0) this.roomClearBannerFrames--;

    // Prune dead entities.
    this.tears = this.tears.filter((t) => t.alive);
    this.enemies = this.enemies.filter((e) => e.alive);
    this.items = this.items.filter((i) => i.alive);

    // Camera follows local player.
    if (lp) {
      this.camera.follow(lp.centerX, lp.centerY, this.room.pixelWidth, this.room.pixelHeight);
    }

    // Host: broadcast authoritative state to all peers.
    if (role === "host") {
      this.multiplayer!.broadcastState(
        MultiplayerSystem.serializeGameState(
          this.players,
          this.enemies,
          this.tears,
          this.items,
          this.room.cleared
        )
      );
    }
  }

  render(_ctx: CanvasRenderingContext2D): void {
    this.renderer.clear();
    this.renderer.drawRoom(this.room);

    for (const item of this.items) this.renderer.drawEntity(item, "item");
    for (const enemy of this.enemies) this.renderer.drawEntity(enemy, "enemy");
    for (const tear of this.tears) this.renderer.drawEntity(tear, "tear");
    for (const player of this.players) this.renderer.drawPlayer(player);

    if (this.roomClearBannerFrames > 0) {
      this.renderer.drawScreenText("Room Clear!", this.game.height / 2, "#b5ead7", 28);
    }

    const lp = this.localPlayer;
    if (lp && !lp.alive) {
      this.renderer.drawScreenText("You Died", this.game.height / 2, "#ff6b6b", 40);
    }
  }

  override destroy(): void {
    this.keyboard?.destroy();
    this.multiplayer?.close();
  }

  /** Builds the initial single-room layout with north and east doors. */
  private buildStartingRoom(): Room {
    const room = new Room();
    room.addDoor("north");
    room.addDoor("east");
    return room;
  }

  /** Called when remote state arrives (client/spectator). Rebuilds entity lists. */
  private applyState(state: SerializedGameState): void {
    this.players = state.players.map((ps) => {
      const player = new Player(ps.x, ps.y, ps.id);
      MultiplayerSystem.applyPlayerState(player, ps);
      return player;
    });

    this.enemies = MultiplayerSystem.deserializeEnemies(state.enemies);
    this.tears = MultiplayerSystem.deserializeTears(state.tears);
    this.items = MultiplayerSystem.deserializeItems(state.items);

    if (state.roomCleared && !this.room.cleared) {
      this.room.clear();
      this.roomClearBannerFrames = 120;
    }

    // Camera follows local player; spectators follow first player in state.
    const lp = this.localPlayer;
    if (lp) {
      this.camera.follow(lp.centerX, lp.centerY, this.room.pixelWidth, this.room.pixelHeight);
    } else if (this.players.length > 0) {
      const first = this.players[0];
      this.camera.follow(first.centerX, first.centerY, this.room.pixelWidth, this.room.pixelHeight);
    }
  }

  private registerStateListener(): void {
    this.multiplayer!.onState((state) => this.applyState(state));
  }

  private registerInputListener(): void {
    this.multiplayer!.onInput((playerId, input) => {
      this.remoteInputs.set(playerId, input);
    });
  }
}
