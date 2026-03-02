import { describe, it, expect, vi } from "vitest";
import {
  MultiplayerSystem,
  type SerializedGameState,
  type PlayerState,
  type EnemyState,
  type TearState,
  type ItemState,
} from "@/systems/MultiplayerSystem";
import type { WSClient } from "@/lib/ws";
import { Player } from "@/entities/Player";
import { Pebble } from "@/entities/Pebble";
import { Boss } from "@/entities/Boss";
import { Tear } from "@/entities/Tear";
import { Item } from "@/entities/Item";
import { WS_EVENT } from "@/constants";

function makeWS(): WSClient {
  return {
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    close: vi.fn(),
  };
}

function makeState(): SerializedGameState {
  return {
    players: [],
    enemies: [],
    tears: [],
    items: [],
    roomCleared: false,
  };
}

describe("MultiplayerSystem", () => {
  it("exposes role, localPlayerId, and sessionCode", () => {
    const mp = new MultiplayerSystem(makeWS(), "host", "player1", "ABCD");
    expect(mp.role).toBe("host");
    expect(mp.localPlayerId).toBe("player1");
    expect(mp.sessionCode).toBe("ABCD");
  });

  it("broadcastState() sends the game-state event", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "host", "player1", "ABCD");
    const state = makeState();
    mp.broadcastState(state);
    expect(ws.send).toHaveBeenCalledWith(WS_EVENT.GAME_STATE, state);
  });

  it("sendInput() sends the player-input event with playerId and input", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "client", "player2", "ABCD");
    const input = { moveX: 1, moveY: 0, shootX: 0, shootY: 0 };
    mp.sendInput("player2", input);
    expect(ws.send).toHaveBeenCalledWith(WS_EVENT.PLAYER_INPUT, { playerId: "player2", input });
  });

  it("onState() registers a listener for the game-state event", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "client", "player2", "ABCD");
    const cb = vi.fn();
    mp.onState(cb);
    expect(ws.on).toHaveBeenCalledWith(WS_EVENT.GAME_STATE, expect.any(Function));
  });

  it("onState() callback is called with the received state", () => {
    const ws = makeWS();
    let capturedCallback: ((data: unknown) => void) | null = null;
    (ws.on as ReturnType<typeof vi.fn>).mockImplementation((_event: string, cb: (data: unknown) => void) => {
      capturedCallback = cb;
    });
    const mp = new MultiplayerSystem(ws, "client", "player2", "ABCD");
    const cb = vi.fn();
    mp.onState(cb);
    const state = makeState();
    capturedCallback!(state);
    expect(cb).toHaveBeenCalledWith(state);
  });

  it("onInput() registers a listener for the player-input event", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "host", "player1", "ABCD");
    const cb = vi.fn();
    mp.onInput(cb);
    expect(ws.on).toHaveBeenCalledWith(WS_EVENT.PLAYER_INPUT, expect.any(Function));
  });

  it("onInput() callback is called with playerId and input", () => {
    const ws = makeWS();
    let capturedCallback: ((data: unknown) => void) | null = null;
    (ws.on as ReturnType<typeof vi.fn>).mockImplementation((_event: string, cb: (data: unknown) => void) => {
      capturedCallback = cb;
    });
    const mp = new MultiplayerSystem(ws, "host", "player1", "ABCD");
    const cb = vi.fn();
    mp.onInput(cb);
    const input = { moveX: 0, moveY: 1, shootX: 0, shootY: 0 };
    capturedCallback!({ playerId: "player2", input });
    expect(cb).toHaveBeenCalledWith("player2", input);
  });

  it("close() calls ws.close()", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "spectator", "", "ABCD");
    mp.close();
    expect(ws.close).toHaveBeenCalled();
  });

  describe("serializeGameState()", () => {
    it("serializes players correctly", () => {
      const p = new Player(10, 20, "p1");
      const state = MultiplayerSystem.serializeGameState([p], [], [], [], false);
      const ps = state.players[0];
      expect(ps.id).toBe("p1");
      expect(ps.x).toBe(10);
      expect(ps.y).toBe(20);
      expect(ps.alive).toBe(true);
      expect(ps.health).toBe(p.health);
      expect(ps.coins).toBe(0);
      expect(ps.keys).toBe(0);
    });

    it("serializes enemies correctly", () => {
      const e = new Pebble(5, 5);
      const state = MultiplayerSystem.serializeGameState([], [e], [], [], false);
      const es = state.enemies[0];
      expect(es.entityType).toBe("pebble");
      expect(es.x).toBe(5);
      expect(es.alive).toBe(true);
    });

    it("serializes tears correctly", () => {
      const t = new Tear(100, 100, 1, 0, 3.5, "p1");
      const state = MultiplayerSystem.serializeGameState([], [], [t], [], false);
      const ts = state.tears[0];
      expect(ts.dirX).toBeCloseTo(1);
      expect(ts.ownerId).toBe("p1");
    });

    it("serializes items correctly", () => {
      const i = new Item(50, 50, "Coin", { type: "addCoin", amount: 1 });
      const state = MultiplayerSystem.serializeGameState([], [], [], [i], false);
      const is = state.items[0];
      expect(is.name).toBe("Coin");
      expect(is.alive).toBe(true);
    });

    it("serializes roomCleared flag", () => {
      const state = MultiplayerSystem.serializeGameState([], [], [], [], true);
      expect(state.roomCleared).toBe(true);
    });
  });

  describe("applyPlayerState()", () => {
    it("updates player position and stats", () => {
      const p = new Player(0, 0, "p1");
      const ps: PlayerState = {
        id: "p1", x: 50, y: 60, health: 4, maxHealth: 6,
        coins: 3, keys: 1, alive: true, speed: 5, damage: 4, fireDelayMs: 200,
      };
      MultiplayerSystem.applyPlayerState(p, ps);
      expect(p.x).toBe(50);
      expect(p.y).toBe(60);
      expect(p.health).toBe(4);
      expect(p.coins).toBe(3);
      expect(p.keys).toBe(1);
      expect(p.speed).toBe(5);
      expect(p.alive).toBe(true);
    });

    it("destroys the player when alive is false", () => {
      const p = new Player(0, 0, "p1");
      const ps: PlayerState = {
        id: "p1", x: 0, y: 0, health: 0, maxHealth: 6,
        coins: 0, keys: 0, alive: false, speed: 3, damage: 3.5, fireDelayMs: 300,
      };
      MultiplayerSystem.applyPlayerState(p, ps);
      expect(p.alive).toBe(false);
    });
  });

  describe("deserializeEnemies()", () => {
    it("creates a Boss for entityType 'boss'", () => {
      const states: EnemyState[] = [{
        id: "boss1", entityType: "boss", x: 100, y: 100,
        width: 64, height: 64, health: 30, maxHealth: 60, alive: true,
      }];
      const enemies = MultiplayerSystem.deserializeEnemies(states);
      expect(enemies[0]).toBeInstanceOf(Boss);
      expect(enemies[0].alive).toBe(true);
      expect(enemies[0].health).toBe(30);
    });

    it("creates a Pebble for any other entityType", () => {
      const states: EnemyState[] = [{
        id: "pebble1", entityType: "pebble", x: 50, y: 50,
        width: 24, height: 24, health: 3, maxHealth: 6, alive: true,
      }];
      const enemies = MultiplayerSystem.deserializeEnemies(states);
      expect(enemies[0]).toBeInstanceOf(Pebble);
      expect(enemies[0].health).toBe(3);
    });

    it("destroys enemies where alive is false", () => {
      const states: EnemyState[] = [{
        id: "dead1", entityType: "pebble", x: 0, y: 0,
        width: 24, height: 24, health: 0, maxHealth: 6, alive: false,
      }];
      const enemies = MultiplayerSystem.deserializeEnemies(states);
      expect(enemies[0].alive).toBe(false);
    });
  });

  describe("deserializeTears()", () => {
    it("creates Tear instances from state", () => {
      const states: TearState[] = [{
        id: "t1", x: 90, y: 90, width: 11, height: 11,
        dirX: 1, dirY: 0, speed: 7, damage: 3.5, ownerId: "p1", alive: true,
      }];
      const tears = MultiplayerSystem.deserializeTears(states);
      expect(tears).toHaveLength(1);
      expect(tears[0].alive).toBe(true);
      expect(tears[0].ownerId).toBe("p1");
    });

    it("destroys tears where alive is false", () => {
      const states: TearState[] = [{
        id: "t2", x: 0, y: 0, width: 11, height: 11,
        dirX: 0, dirY: 1, speed: 7, damage: 3.5, ownerId: "p1", alive: false,
      }];
      const tears = MultiplayerSystem.deserializeTears(states);
      expect(tears[0].alive).toBe(false);
    });
  });

  describe("deserializeItems()", () => {
    it("creates Item instances from state", () => {
      const states: ItemState[] = [{
        id: "i1", x: 200, y: 200, name: "Heart",
        effect: { type: "heal", amount: 2 }, alive: true,
      }];
      const items = MultiplayerSystem.deserializeItems(states);
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Heart");
      expect(items[0].alive).toBe(true);
    });

    it("destroys items where alive is false", () => {
      const states: ItemState[] = [{
        id: "i2", x: 0, y: 0, name: "Key",
        effect: { type: "addKey", amount: 1 }, alive: false,
      }];
      const items = MultiplayerSystem.deserializeItems(states);
      expect(items[0].alive).toBe(false);
    });
  });
});
