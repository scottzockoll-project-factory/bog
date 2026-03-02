import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Game } from "@/game/Game";
import { Scene } from "@/scenes/Scene";

/** Minimal mock canvas/context. */
function makeCanvas() {
  const ctx = {
    canvas: { width: 960, height: 540 },
    clearRect: vi.fn(),
    fillStyle: "",
    fillRect: vi.fn(),
    font: "",
    textAlign: "",
    textBaseline: "",
    fillText: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  const canvas = {
    width: 960,
    height: 540,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;

  return { canvas, ctx };
}

class MockScene extends Scene {
  updateCalled = 0;
  renderCalled = 0;
  destroyCalled = 0;

  update(_deltaMs: number): void { this.updateCalled++; }
  render(_ctx: CanvasRenderingContext2D): void { this.renderCalled++; }
  override destroy(): void { this.destroyCalled++; }
}

describe("Game", () => {
  let rafCallbacks: Array<(ts: number) => void>;
  let rafId: number;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    vi.stubGlobal("requestAnimationFrame", (cb: (ts: number) => void) => {
      rafCallbacks.push(cb);
      return ++rafId;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exposes canvas width and height", () => {
    const { canvas, ctx } = makeCanvas();
    const game = new Game(canvas, ctx);
    expect(game.width).toBe(960);
    expect(game.height).toBe(540);
  });

  it("start schedules a requestAnimationFrame", () => {
    const { canvas, ctx } = makeCanvas();
    const game = new Game(canvas, ctx);
    game.start();
    expect(rafCallbacks).toHaveLength(1);
    game.stop();
  });

  it("stop cancels the animation frame", () => {
    const { canvas, ctx } = makeCanvas();
    const game = new Game(canvas, ctx);
    game.start();
    game.stop();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("transitionTo destroys the old scene and switches to the new one", () => {
    const { canvas, ctx } = makeCanvas();
    const game = new Game(canvas, ctx);

    const newScene = new MockScene(game);
    // Inject a mock starting scene by transitioning to it.
    const mock1 = new MockScene(game);
    game.transitionTo(mock1);
    game.transitionTo(newScene);

    expect(mock1.destroyCalled).toBe(1);
  });

  it("loop calls update and render when a full frame has elapsed", () => {
    const { canvas, ctx } = makeCanvas();
    const game = new Game(canvas, ctx);
    const scene = new MockScene(game);
    game.transitionTo(scene);
    game.start();

    // Simulate first tick (sets lastTimestamp), then a second tick 17ms later.
    rafCallbacks[0](0);
    rafCallbacks[1](17);

    expect(scene.updateCalled).toBeGreaterThan(0);
    game.stop();
  });

  it("loop exits early when game is not running", () => {
    const { canvas, ctx } = makeCanvas();
    const game = new Game(canvas, ctx);
    const scene = new MockScene(game);
    game.transitionTo(scene);

    // Call the loop directly without calling start() — running=false.
    // Access the private loop via cast.
    const loop = (game as unknown as { loop: (ts: number) => void }).loop;
    loop(0);

    expect(scene.updateCalled).toBe(0);
  });
});
