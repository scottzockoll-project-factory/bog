import { describe, it, expect, vi, afterEach } from "vitest";
import { LobbyScene } from "@/scenes/LobbyScene";
import type { Game } from "@/game/Game";

// Mock createWSClient so LobbyScene tests never open a real WebSocket.
vi.mock("@/lib/ws", () => ({
  createWSClient: vi.fn(() => ({
    send: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    close: vi.fn(),
  })),
}));

function makeCtx() {
  return {
    canvas: { width: 960, height: 540 },
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    fillRect: vi.fn(),
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function makeGame() {
  return {
    width: 960,
    height: 540,
    transitionTo: vi.fn(),
  } as unknown as Game;
}

describe("LobbyScene", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders without throwing (menu mode)", () => {
    const ctx = makeCtx();
    const scene = new LobbyScene(makeGame(), ctx);
    expect(() => scene.render(ctx)).not.toThrow();
    scene.destroy();
  });

  it("update does not throw", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    expect(() => scene.update(16)).not.toThrow();
    scene.destroy();
  });

  it("ArrowDown moves selection down", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const s = scene as unknown as { selectedIndex: number };
    expect(s.selectedIndex).toBe(0);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(s.selectedIndex).toBe(1);
    scene.destroy();
  });

  it("ArrowUp moves selection up (wraps around)", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const s = scene as unknown as { selectedIndex: number };
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(s.selectedIndex).toBe(3); // wraps from 0 to last
    scene.destroy();
  });

  it("s key moves selection down", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const s = scene as unknown as { selectedIndex: number };
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(s.selectedIndex).toBe(1);
    scene.destroy();
  });

  it("w key moves selection up", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const s = scene as unknown as { selectedIndex: number };
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
    expect(s.selectedIndex).toBe(3);
    scene.destroy();
  });

  it("Enter on Solo Play transitions to GameScene", () => {
    const game = makeGame();
    const scene = new LobbyScene(game, makeCtx());
    // selectedIndex=0 is "Solo Play"
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(game.transitionTo).toHaveBeenCalledOnce();
    scene.destroy();
  });

  it("Space also confirms selection", () => {
    const game = makeGame();
    const scene = new LobbyScene(game, makeCtx());
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(game.transitionTo).toHaveBeenCalledOnce();
    scene.destroy();
  });

  it("Enter on Host Game creates WS and transitions", () => {
    const game = makeGame();
    const scene = new LobbyScene(game, makeCtx());
    // Navigate to "Host Game" (index 1)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(game.transitionTo).toHaveBeenCalledOnce();
    scene.destroy();
  });

  it("Enter on Join Game switches to code-entry mode", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const s = scene as unknown as { mode: string };
    // Navigate to "Join Game" (index 2)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(s.mode).toBe("enterCode");
    scene.destroy();
  });

  it("Enter on Spectate switches to code-entry mode with spectator role", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const s = scene as unknown as { mode: string; pendingRole: string };
    // Navigate to "Spectate" (index 3)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(s.mode).toBe("enterCode");
    expect(s.pendingRole).toBe("spectator");
    scene.destroy();
  });

  it("renders code-entry screen without throwing", () => {
    const ctx = makeCtx();
    const scene = new LobbyScene(makeGame(), ctx);
    const s = scene as unknown as { mode: string };
    s.mode = "enterCode";
    expect(() => scene.render(ctx)).not.toThrow();
    scene.destroy();
  });

  it("renders spectator code-entry label", () => {
    const ctx = makeCtx();
    const scene = new LobbyScene(makeGame(), ctx);
    const s = scene as unknown as { mode: string; pendingRole: string };
    s.mode = "enterCode";
    s.pendingRole = "spectator";
    scene.render(ctx);
    expect(ctx.fillText).toHaveBeenCalledWith(
      expect.stringContaining("Spectate"),
      expect.any(Number),
      expect.any(Number)
    );
    scene.destroy();
  });

  it("typing characters appends to code (uppercased)", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const s = scene as unknown as { mode: string };
    s.mode = "enterCode";
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
    expect(scene.enteredCode).toBe("AB");
    scene.destroy();
  });

  it("typing beyond 6 characters is ignored", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const s = scene as unknown as { mode: string };
    s.mode = "enterCode";
    for (const ch of "ABCDEF") {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: ch }));
    }
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "G" }));
    expect(scene.enteredCode).toBe("ABCDEF");
    scene.destroy();
  });

  it("Backspace removes last character", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const s = scene as unknown as { mode: string };
    s.mode = "enterCode";
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "B" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }));
    expect(scene.enteredCode).toBe("A");
    scene.destroy();
  });

  it("Escape in code-entry returns to menu and clears code", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const s = scene as unknown as { mode: string };
    s.mode = "enterCode";
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(s.mode).toBe("menu");
    expect(scene.enteredCode).toBe("");
    scene.destroy();
  });

  it("Enter with code connects and transitions (client mode)", () => {
    const game = makeGame();
    const scene = new LobbyScene(game, makeCtx());
    const s = scene as unknown as { mode: string; pendingRole: string };
    s.mode = "enterCode";
    s.pendingRole = "client";
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "A" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "B" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "C" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "D" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(game.transitionTo).toHaveBeenCalledOnce();
    scene.destroy();
  });

  it("Enter with code connects and transitions (spectator mode)", () => {
    const game = makeGame();
    const scene = new LobbyScene(game, makeCtx());
    const s = scene as unknown as { mode: string; pendingRole: string };
    s.mode = "enterCode";
    s.pendingRole = "spectator";
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "X" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(game.transitionTo).toHaveBeenCalledOnce();
    scene.destroy();
  });

  it("Enter with empty code does nothing", () => {
    const game = makeGame();
    const scene = new LobbyScene(game, makeCtx());
    const s = scene as unknown as { mode: string };
    s.mode = "enterCode";
    // No characters typed — code is empty.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(game.transitionTo).not.toHaveBeenCalled();
    scene.destroy();
  });

  it("generateCode returns a 4-character uppercase string", () => {
    const scene = new LobbyScene(makeGame(), makeCtx());
    const code = scene.generateCode();
    expect(code).toHaveLength(4);
    expect(code).toMatch(/^[A-Z2-9]+$/);
    scene.destroy();
  });

  it("destroy removes the keydown listener", () => {
    const game = makeGame();
    const scene = new LobbyScene(game, makeCtx());
    scene.destroy();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(game.transitionTo).not.toHaveBeenCalled();
  });
});
