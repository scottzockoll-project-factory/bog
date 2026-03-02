import { FRAME_DURATION_MS } from "@/constants";
import { Scene } from "@/scenes/Scene";
import { TitleScene } from "@/scenes/TitleScene";

/**
 * The top-level Game class.
 * Owns the main loop and manages scene transitions.
 */
export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentScene: Scene;
  private lastTimestamp: number = 0;
  private running: boolean = false;
  private animationFrameId: number = 0;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.currentScene = new TitleScene(this, ctx);
  }

  /** Starts the game loop. */
  start(): void {
    this.running = true;
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  /** Stops the game loop. */
  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  /**
   * Transitions to a new scene, destroying the current one.
   * Called by scenes when they need to hand off control.
   */
  transitionTo(scene: Scene): void {
    this.currentScene.destroy();
    this.currentScene = scene;
  }

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return;

    const elapsed = timestamp - this.lastTimestamp;

    // Only step the simulation if at least one frame has passed.
    // This keeps physics consistent regardless of monitor refresh rate.
    if (elapsed >= FRAME_DURATION_MS) {
      this.lastTimestamp = timestamp;
      this.currentScene.update(elapsed);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.currentScene.render(this.ctx);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };
}
