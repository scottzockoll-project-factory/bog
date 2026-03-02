import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TitleScene } from "@/scenes/TitleScene";
import type { Game } from "@/game/Game";

// Prevent LobbyScene from attaching its own keydown listener during TitleScene tests.
vi.mock("@/scenes/LobbyScene", () => ({
  LobbyScene: vi.fn().mockImplementation(() => ({})),
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

function makeGame(ctx: CanvasRenderingContext2D) {
  return {
    width: 960,
    height: 540,
    transitionTo: vi.fn(),
  } as unknown as Game;
}

describe("TitleScene", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders without throwing", () => {
    const ctx = makeCtx();
    const game = makeGame(ctx);
    const scene = new TitleScene(game, ctx);
    expect(() => scene.render(ctx)).not.toThrow();
    scene.destroy();
  });

  it("update does not throw", () => {
    const ctx = makeCtx();
    const scene = new TitleScene(makeGame(ctx), ctx);
    expect(() => scene.update(16)).not.toThrow();
    scene.destroy();
  });

  it("pressing a key triggers a scene transition", () => {
    const ctx = makeCtx();
    const game = makeGame(ctx);
    const scene = new TitleScene(game, ctx);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(game.transitionTo).toHaveBeenCalledOnce();
    scene.destroy();
  });

  it("pressing a key twice only transitions once", () => {
    const ctx = makeCtx();
    const game = makeGame(ctx);
    const scene = new TitleScene(game, ctx);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(game.transitionTo).toHaveBeenCalledOnce();
    scene.destroy();
  });

  it("renders 'Loading...' after start is pressed", () => {
    const ctx = makeCtx();
    const game = makeGame(ctx);
    const scene = new TitleScene(game, ctx);

    // Press a key to trigger pressedStart = true.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    // Render again — should now show "Loading...".
    expect(() => scene.render(ctx)).not.toThrow();
    scene.destroy();
  });

  it("destroy removes the keydown listener", () => {
    const ctx = makeCtx();
    const game = makeGame(ctx);
    const scene = new TitleScene(game, ctx);
    scene.destroy();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(game.transitionTo).not.toHaveBeenCalled();
  });
});
