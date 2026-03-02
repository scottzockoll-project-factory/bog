import { describe, it, expect } from "vitest";
import { Scene } from "@/scenes/Scene";
import type { Game } from "@/game/Game";

class ConcreteScene extends Scene {
  update(_deltaMs: number): void {}
  render(_ctx: CanvasRenderingContext2D): void {}
}

describe("Scene", () => {
  it("stores game reference", () => {
    const fakeGame = {} as Game;
    const scene = new ConcreteScene(fakeGame);
    // Access via the protected property through a cast.
    expect((scene as unknown as { game: Game }).game).toBe(fakeGame);
  });

  it("destroy() does not throw by default", () => {
    const scene = new ConcreteScene({} as Game);
    expect(() => scene.destroy()).not.toThrow();
  });
});
