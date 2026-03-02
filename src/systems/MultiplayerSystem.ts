import { WS_EVENT } from "@/constants";
import type { WSClient } from "@/lib/ws";
import type { InputState } from "@/entities/InputState";
import { Player } from "@/entities/Player";
import { Pebble } from "@/entities/Pebble";
import { Boss } from "@/entities/Boss";
import { Tear } from "@/entities/Tear";
import { Item } from "@/entities/Item";
import type { ItemEffect } from "@/entities/Item";
import type { Enemy } from "@/entities/Enemy";

/** The role this client plays in a multiplayer session. */
export type SessionRole = "solo" | "host" | "client" | "spectator";

/** Serialized snapshot of a player for network sync. */
export interface PlayerState {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  coins: number;
  keys: number;
  alive: boolean;
  speed: number;
  damage: number;
  fireDelayMs: number;
}

/** Serialized snapshot of an enemy for network sync. */
export interface EnemyState {
  id: string;
  entityType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  alive: boolean;
}

/** Serialized snapshot of a tear for network sync. */
export interface TearState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dirX: number;
  dirY: number;
  speed: number;
  damage: number;
  ownerId: string;
  alive: boolean;
}

/** Serialized snapshot of an item for network sync. */
export interface ItemState {
  id: string;
  x: number;
  y: number;
  name: string;
  effect: ItemEffect;
  alive: boolean;
}

/** The full game state broadcast over the network each frame by the host. */
export interface SerializedGameState {
  players: PlayerState[];
  enemies: EnemyState[];
  tears: TearState[];
  items: ItemState[];
  roomCleared: boolean;
}

/**
 * Manages WebSocket communication for co-op and spectate sessions.
 *
 * The host runs the full game simulation and calls broadcastState() each frame.
 * Clients call sendInput() each frame and receive state via onState().
 * Spectators receive state only.
 */
export class MultiplayerSystem {
  /** The role this client is playing in the session. */
  readonly role: SessionRole;

  /** The id of the player controlled by this client. Empty string for spectators. */
  readonly localPlayerId: string;

  /** The session code used as the WebSocket room key. */
  readonly sessionCode: string;

  private ws: WSClient;

  constructor(ws: WSClient, role: SessionRole, localPlayerId: string, sessionCode: string) {
    this.ws = ws;
    this.role = role;
    this.localPlayerId = localPlayerId;
    this.sessionCode = sessionCode;
  }

  /**
   * Host-only: broadcasts the serialized game state to all peers.
   */
  broadcastState(state: SerializedGameState): void {
    this.ws.send(WS_EVENT.GAME_STATE, state);
  }

  /**
   * Client-only: sends the local player's current input to the host.
   */
  sendInput(playerId: string, input: InputState): void {
    this.ws.send(WS_EVENT.PLAYER_INPUT, { playerId, input });
  }

  /**
   * Registers a callback that fires when a SerializedGameState arrives.
   * Used by clients and spectators to apply the authoritative simulation state.
   */
  onState(cb: (state: SerializedGameState) => void): void {
    this.ws.on(WS_EVENT.GAME_STATE, (data) => cb(data as SerializedGameState));
  }

  /**
   * Registers a callback that fires when a player-input message arrives.
   * Used by the host to apply a remote client's input to the simulation.
   */
  onInput(cb: (playerId: string, input: InputState) => void): void {
    this.ws.on(WS_EVENT.PLAYER_INPUT, (data) => {
      const msg = data as { playerId: string; input: InputState };
      cb(msg.playerId, msg.input);
    });
  }

  /** Closes the underlying WebSocket connection. */
  close(): void {
    this.ws.close();
  }

  /**
   * Serializes the current game state into a plain object safe to send over JSON.
   * Called by the host before each broadcastState().
   */
  static serializeGameState(
    players: Player[],
    enemies: Enemy[],
    tears: Tear[],
    items: Item[],
    roomCleared: boolean
  ): SerializedGameState {
    return {
      players: players.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        health: p.health,
        maxHealth: p.maxHealth,
        coins: p.coins,
        keys: p.keys,
        alive: p.alive,
        speed: p.speed,
        damage: p.damage,
        fireDelayMs: p.fireDelayMs,
      })),
      enemies: enemies.map((e) => ({
        id: e.id,
        entityType: e.entityType,
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
        health: e.health,
        maxHealth: e.maxHealth,
        alive: e.alive,
      })),
      tears: tears.map((t) => ({
        id: t.id,
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        dirX: t.dirX,
        dirY: t.dirY,
        speed: t.speed,
        damage: t.damage,
        ownerId: t.ownerId,
        alive: t.alive,
      })),
      items: items.map((i) => ({
        id: i.id,
        x: i.x,
        y: i.y,
        name: i.name,
        effect: i.effect,
        alive: i.alive,
      })),
      roomCleared,
    };
  }

  /**
   * Applies a serialized PlayerState onto an existing Player instance.
   * Called by clients and spectators when state arrives from the host.
   */
  static applyPlayerState(player: Player, state: PlayerState): void {
    player.x = state.x;
    player.y = state.y;
    player.health = state.health;
    player.maxHealth = state.maxHealth;
    player.coins = state.coins;
    player.keys = state.keys;
    player.speed = state.speed;
    player.damage = state.damage;
    player.fireDelayMs = state.fireDelayMs;
    if (!state.alive) player.destroy();
  }

  /**
   * Reconstructs the enemies array from serialized enemy states.
   * Boss entities are re-created as Boss; everything else becomes a Pebble.
   */
  static deserializeEnemies(states: EnemyState[]): Enemy[] {
    return states.map((es) => {
      const enemy: Enemy = es.entityType === "boss"
        ? new Boss(es.x, es.y, es.id)
        : new Pebble(es.x, es.y);
      enemy.health = es.health;
      if (!es.alive) enemy.destroy();
      return enemy;
    });
  }

  /**
   * Reconstructs the tears array from serialized tear states.
   */
  static deserializeTears(states: TearState[]): Tear[] {
    return states.map((ts) => {
      const cx = ts.x + ts.width / 2;
      const cy = ts.y + ts.height / 2;
      const tear = new Tear(cx, cy, ts.dirX, ts.dirY, ts.damage, ts.ownerId, ts.speed);
      if (!ts.alive) tear.destroy();
      return tear;
    });
  }

  /**
   * Reconstructs the items array from serialized item states.
   */
  static deserializeItems(states: ItemState[]): Item[] {
    return states.map((is) => {
      const item = new Item(is.x, is.y, is.name, is.effect);
      if (!is.alive) item.destroy();
      return item;
    });
  }
}
