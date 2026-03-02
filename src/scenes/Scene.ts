import type { Game } from "@/game/Game";

/**
 * Base class for all game scenes (Title, Gameplay, Game Over, Lobby).
 * Each scene controls what gets updated and rendered each frame.
 */
export abstract class Scene {
  protected game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  /** Called every frame with the elapsed time in milliseconds. */
  abstract update(deltaMs: number): void;

  /** Called every frame to draw to the canvas. */
  abstract render(ctx: CanvasRenderingContext2D): void;

  /** Called when the scene is being replaced. Clean up event listeners here. */
  destroy(): void {
    // Override in subclasses if cleanup is needed.
  }
}
