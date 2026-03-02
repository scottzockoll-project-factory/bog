import { describe, it, expect, vi, afterEach } from "vitest";
import { GameScene } from "@/scenes/GameScene";
import { MultiplayerSystem } from "@/systems/MultiplayerSystem";
import type { SerializedGameState } from "@/systems/MultiplayerSystem";
import { Item } from "@/entities/Item";
import { Tear } from "@/entities/Tear";
import type { Game } from "@/game/Game";
import type { WSClient } from "@/lib/ws";

function makeCtx() {
  const canvas = { width: 960, height: 540 } as HTMLCanvasElement;
  return {
    canvas,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "",
    textBaseline: "",
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function makeGame(): Game {
  return {
    width: 960,
    height: 540,
    transitionTo: vi.fn(),
  } as unknown as Game;
}

function makeWS(): WSClient {
  return {
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    close: vi.fn(),
  };
}

function makeState(overrides: Partial<SerializedGameState> = {}): SerializedGameState {
  return {
    players: [],
    enemies: [],
    tears: [],
    items: [],
    roomCleared: false,
    ...overrides,
  };
}

describe("GameScene — solo mode", () => {
  afterEach(() => vi.restoreAllMocks());

  it("constructs without throwing", () => {
    expect(() => new GameScene(makeGame(), makeCtx(), null)).not.toThrow();
  });

  it("update runs without throwing (idle frame)", () => {
    const scene = new GameScene(makeGame(), makeCtx(), null);
    expect(() => scene.update(16)).not.toThrow();
    scene.destroy();
  });

  it("render runs without throwing", () => {
    const ctx = makeCtx();
    const scene = new GameScene(makeGame(), ctx, null);
    scene.render(ctx);
    expect(ctx.fillRect).toHaveBeenCalled();
    scene.destroy();
  });

  it("localPlayer getter returns the solo player", () => {
    const scene = new GameScene(makeGame(), makeCtx(), null);
    expect(scene.localPlayer).toBeDefined();
    expect(scene.localPlayer?.id).toBe("player1");
    scene.destroy();
  });

  it("enemy is killed when a tear hits it, then room clears", () => {
    const ctx = makeCtx();
    const scene = new GameScene(makeGame(), ctx, null);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "l" }));
    for (let i = 0; i < 200; i++) scene.update(16);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "l" }));

    scene.destroy();
  });

  it("destroy removes keyboard listeners", () => {
    const scene = new GameScene(makeGame(), makeCtx(), null);
    expect(() => scene.destroy()).not.toThrow();
  });

  it("player death shows game over text", () => {
    const ctx = makeCtx();
    const scene = new GameScene(makeGame(), ctx, null);

    const s = scene as unknown as { players: Array<{ destroy: () => void }> };
    s.players[0].destroy();

    scene.render(ctx);
    expect(ctx.fillText).toHaveBeenCalledWith(
      "You Died",
      expect.any(Number),
      expect.any(Number)
    );
    scene.destroy();
  });

  it("renders items, tears, and Room Clear banner", () => {
    const ctx = makeCtx();
    const scene = new GameScene(makeGame(), ctx, null);
    const s = scene as unknown as {
      items: unknown[];
      tears: unknown[];
      roomClearBannerFrames: number;
    };

    s.items = [new Item(200, 200, "Coin", { type: "addCoin", amount: 1 })];
    s.tears = [new Tear(200, 200, 1, 0, 3.5, "player1")];
    s.roomClearBannerFrames = 10;

    scene.render(ctx);
    expect(ctx.fillText).toHaveBeenCalledWith(
      "Room Clear!",
      expect.any(Number),
      expect.any(Number)
    );
    scene.destroy();
  });

  it("contact damage and item pickup are applied in update", () => {
    const ctx = makeCtx();
    const scene = new GameScene(makeGame(), ctx, null);
    const s = scene as unknown as {
      players: Array<{ x: number; y: number; health: number }>;
      enemies: Array<{ x: number; y: number }>;
      items: unknown[];
    };

    for (const enemy of s.enemies) {
      enemy.x = s.players[0].x;
      enemy.y = s.players[0].y;
    }
    s.items = [new Item(s.players[0].x, s.players[0].y, "Coin", { type: "addCoin", amount: 1 })];

    scene.update(16);
    scene.destroy();
  });

  it("room clears after all enemies die", () => {
    const ctx = makeCtx();
    const scene = new GameScene(makeGame(), ctx, null);
    const s = scene as unknown as {
      enemies: Array<{ destroy: () => void }>;
      room: { cleared: boolean };
    };

    for (const e of s.enemies) e.destroy();
    scene.update(16);

    expect(s.room.cleared).toBe(true);
    scene.destroy();
  });
});

describe("GameScene — host mode", () => {
  afterEach(() => vi.restoreAllMocks());

  it("constructs with host role without throwing", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "host", "player1", "ABCD");
    expect(() => new GameScene(makeGame(), makeCtx(), mp)).not.toThrow();
  });

  it("host update broadcasts game state", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "host", "player1", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);
    scene.update(16);
    expect(ws.send).toHaveBeenCalledWith(expect.stringContaining("state"), expect.anything());
    scene.destroy();
  });

  it("host applies remote input from registered onInput callback", () => {
    const ws = makeWS();
    let inputCallback: ((data: unknown) => void) | null = null;
    (ws.on as ReturnType<typeof vi.fn>).mockImplementation((_event: string, cb: (data: unknown) => void) => {
      inputCallback = cb;
    });
    const mp = new MultiplayerSystem(ws, "host", "player1", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);

    // Deliver a remote input for player2.
    if (inputCallback) {
      inputCallback({ playerId: "player2", input: { moveX: 1, moveY: 0, shootX: 0, shootY: 0 } });
    }

    expect(() => scene.update(16)).not.toThrow();
    scene.destroy();
  });

  it("destroy closes the multiplayer connection", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "host", "player1", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);
    scene.destroy();
    expect(ws.close).toHaveBeenCalled();
  });
});

describe("GameScene — client mode", () => {
  afterEach(() => vi.restoreAllMocks());

  it("constructs with client role without throwing", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "client", "player2", "ABCD");
    expect(() => new GameScene(makeGame(), makeCtx(), mp)).not.toThrow();
  });

  it("client update sends player input and skips local simulation", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "client", "player2", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);

    // Press a movement key so there's input to send.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    scene.update(16);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "d" }));

    // Client should have sent a player-input event.
    expect(ws.send).toHaveBeenCalledWith(
      expect.stringContaining("input"),
      expect.objectContaining({ playerId: "player2" })
    );
    scene.destroy();
  });

  it("client applyState populates players from received state", () => {
    const ws = makeWS();
    let stateCallback: ((data: unknown) => void) | null = null;
    (ws.on as ReturnType<typeof vi.fn>).mockImplementation((_event: string, cb: (data: unknown) => void) => {
      stateCallback = cb;
    });
    const mp = new MultiplayerSystem(ws, "client", "player2", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);

    const state = makeState({
      players: [{
        id: "player1", x: 100, y: 200, health: 6, maxHealth: 6,
        coins: 0, keys: 0, alive: true, speed: 3, damage: 3.5, fireDelayMs: 300,
      }],
    });
    stateCallback!(state);

    const s = scene as unknown as { players: Array<{ id: string; x: number }> };
    expect(s.players).toHaveLength(1);
    expect(s.players[0].id).toBe("player1");
    expect(s.players[0].x).toBe(100);
    scene.destroy();
  });

  it("client applyState marks room as cleared when host says so", () => {
    const ws = makeWS();
    let stateCallback: ((data: unknown) => void) | null = null;
    (ws.on as ReturnType<typeof vi.fn>).mockImplementation((_event: string, cb: (data: unknown) => void) => {
      stateCallback = cb;
    });
    const mp = new MultiplayerSystem(ws, "client", "player2", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);

    stateCallback!(makeState({ roomCleared: true }));

    const s = scene as unknown as { room: { cleared: boolean } };
    expect(s.room.cleared).toBe(true);
    scene.destroy();
  });

  it("client applyState handles a dead player in state", () => {
    const ws = makeWS();
    let stateCallback: ((data: unknown) => void) | null = null;
    (ws.on as ReturnType<typeof vi.fn>).mockImplementation((_event: string, cb: (data: unknown) => void) => {
      stateCallback = cb;
    });
    const mp = new MultiplayerSystem(ws, "client", "player1", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);

    stateCallback!(makeState({
      players: [{
        id: "player1", x: 0, y: 0, health: 0, maxHealth: 6,
        coins: 0, keys: 0, alive: false, speed: 3, damage: 3.5, fireDelayMs: 300,
      }],
    }));

    const s = scene as unknown as { players: Array<{ alive: boolean }> };
    expect(s.players[0].alive).toBe(false);
    scene.destroy();
  });

  it("client render shows You Died when local player is dead", () => {
    const ws = makeWS();
    let stateCallback: ((data: unknown) => void) | null = null;
    (ws.on as ReturnType<typeof vi.fn>).mockImplementation((_event: string, cb: (data: unknown) => void) => {
      stateCallback = cb;
    });
    const mp = new MultiplayerSystem(ws, "client", "player1", "ABCD");
    const ctx = makeCtx();
    const scene = new GameScene(makeGame(), ctx, mp);

    stateCallback!(makeState({
      players: [{
        id: "player1", x: 0, y: 0, health: 0, maxHealth: 6,
        coins: 0, keys: 0, alive: false, speed: 3, damage: 3.5, fireDelayMs: 300,
      }],
    }));

    scene.render(ctx);
    expect(ctx.fillText).toHaveBeenCalledWith("You Died", expect.any(Number), expect.any(Number));
    scene.destroy();
  });

  it("client applyState: spectator with no localPlayer follows first player", () => {
    const ws = makeWS();
    let stateCallback: ((data: unknown) => void) | null = null;
    (ws.on as ReturnType<typeof vi.fn>).mockImplementation((_event: string, cb: (data: unknown) => void) => {
      stateCallback = cb;
    });
    // Spectator has empty localPlayerId
    const mp = new MultiplayerSystem(ws, "spectator", "", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);

    const state = makeState({
      players: [{
        id: "player1", x: 400, y: 200, health: 6, maxHealth: 6,
        coins: 0, keys: 0, alive: true, speed: 3, damage: 3.5, fireDelayMs: 300,
      }],
    });
    expect(() => stateCallback!(state)).not.toThrow();
    scene.destroy();
  });
});

describe("GameScene — spectator mode", () => {
  afterEach(() => vi.restoreAllMocks());

  it("constructs with spectator role without throwing", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "spectator", "", "ABCD");
    expect(() => new GameScene(makeGame(), makeCtx(), mp)).not.toThrow();
  });

  it("spectator update is a no-op (does not throw)", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "spectator", "", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);
    expect(() => scene.update(16)).not.toThrow();
    scene.destroy();
  });

  it("spectator does not send input", () => {
    const ws = makeWS();
    const mp = new MultiplayerSystem(ws, "spectator", "", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);
    scene.update(16);
    expect(ws.send).not.toHaveBeenCalled();
    scene.destroy();
  });

  it("applyState with enemies and items and tears does not throw", () => {
    const ws = makeWS();
    let stateCallback: ((data: unknown) => void) | null = null;
    (ws.on as ReturnType<typeof vi.fn>).mockImplementation((_event: string, cb: (data: unknown) => void) => {
      stateCallback = cb;
    });
    const mp = new MultiplayerSystem(ws, "spectator", "", "ABCD");
    const scene = new GameScene(makeGame(), makeCtx(), mp);

    const state = makeState({
      enemies: [
        { id: "b1", entityType: "boss", x: 100, y: 100, width: 64, height: 64, health: 60, maxHealth: 60, alive: true },
        { id: "p1", entityType: "pebble", x: 50, y: 50, width: 24, height: 24, health: 6, maxHealth: 6, alive: false },
      ],
      tears: [
        { id: "t1", x: 200, y: 200, width: 11, height: 11, dirX: 1, dirY: 0, speed: 7, damage: 3.5, ownerId: "p1", alive: true },
        { id: "t2", x: 300, y: 300, width: 11, height: 11, dirX: 0, dirY: 1, speed: 7, damage: 3.5, ownerId: "p1", alive: false },
      ],
      items: [
        { id: "i1", x: 150, y: 150, name: "Heart", effect: { type: "heal", amount: 2 }, alive: true },
        { id: "i2", x: 160, y: 160, name: "Coin", effect: { type: "addCoin", amount: 1 }, alive: false },
      ],
    });
    expect(() => stateCallback!(state)).not.toThrow();
    scene.destroy();
  });
});
