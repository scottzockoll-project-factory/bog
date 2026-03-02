import { describe, it, expect, vi, afterEach } from "vitest";
import { GameOverScene } from "@/scenes/GameOverScene";
import type { Game } from "@/game/Game";

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
  return { width: 960, height: 540, transitionTo: vi.fn() } as unknown as Game;
}

const STATS = { floorsCleared: 2, enemiesKilled: 10, itemsCollected: 3 };

describe("GameOverScene", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders without throwing", () => {
    const ctx = makeCtx();
    const scene = new GameOverScene(makeGame(), ctx, STATS);
    expect(() => scene.render(ctx)).not.toThrow();
    scene.destroy();
  });

  it("update does not throw", () => {
    const ctx = makeCtx();
    const scene = new GameOverScene(makeGame(), ctx, STATS);
    expect(() => scene.update(16)).not.toThrow();
    scene.destroy();
  });

  it("ArrowDown moves selection to Quit", () => {
    const ctx = makeCtx();
    const game = makeGame();
    const scene = new GameOverScene(game, ctx, STATS);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(game.transitionTo).toHaveBeenCalled();
    scene.destroy();
  });

  it("ArrowUp does not go below option 0", () => {
    const ctx = makeCtx();
    const game = makeGame();
    const scene = new GameOverScene(game, ctx, STATS);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(game.transitionTo).toHaveBeenCalled();
    scene.destroy();
  });

  it("Enter on Play Again transitions to title", () => {
    const ctx = makeCtx();
    const game = makeGame();
    const scene = new GameOverScene(game, ctx, STATS);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(game.transitionTo).toHaveBeenCalledOnce();
    scene.destroy();
  });

  it("Space also confirms selection", () => {
    const ctx = makeCtx();
    const game = makeGame();
    const scene = new GameOverScene(game, ctx, STATS);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

    expect(game.transitionTo).toHaveBeenCalled();
    scene.destroy();
  });

  it("w/s keys move the selection", () => {
    const ctx = makeCtx();
    const game = makeGame();
    const scene = new GameOverScene(game, ctx, STATS);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(game.transitionTo).toHaveBeenCalled();
    scene.destroy();
  });

  it("destroy removes the keydown listener", () => {
    const ctx = makeCtx();
    const game = makeGame();
    const scene = new GameOverScene(game, ctx, STATS);
    scene.destroy();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(game.transitionTo).not.toHaveBeenCalled();
  });
});
