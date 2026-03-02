import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/constants";

/**
 * Tracks a viewport that follows a target position.
 * Converts world coordinates to screen coordinates for the Renderer.
 */
export class Camera {
  x: number = 0;
  y: number = 0;

  private readonly viewWidth: number;
  private readonly viewHeight: number;

  constructor(viewWidth: number = CANVAS_WIDTH, viewHeight: number = CANVAS_HEIGHT) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }

  /**
   * Centers the camera on a world-space point,
   * clamped so it never shows outside the world bounds.
   */
  follow(
    targetX: number,
    targetY: number,
    worldWidth: number,
    worldHeight: number
  ): void {
    this.x = targetX - this.viewWidth / 2;
    this.y = targetY - this.viewHeight / 2;

    this.x = Math.max(0, Math.min(this.x, worldWidth - this.viewWidth));
    this.y = Math.max(0, Math.min(this.y, worldHeight - this.viewHeight));
  }

  /** Converts a world X coordinate to a screen X coordinate. */
  toScreenX(worldX: number): number {
    return worldX - this.x;
  }

  /** Converts a world Y coordinate to a screen Y coordinate. */
  toScreenY(worldY: number): number {
    return worldY - this.y;
  }

  /** Returns true if the given world-space rect is visible on screen. */
  isVisible(worldX: number, worldY: number, width: number, height: number): boolean {
    return (
      worldX + width > this.x &&
      worldX < this.x + this.viewWidth &&
      worldY + height > this.y &&
      worldY < this.y + this.viewHeight
    );
  }
}
