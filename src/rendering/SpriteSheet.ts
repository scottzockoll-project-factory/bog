/**
 * Loads a sprite sheet image and slices it into named frames.
 * Each frame is a square tile at a grid position.
 *
 * While real SVGs are pending, call SpriteSheet.placeholder() instead —
 * it draws a colored rectangle with a label directly to the canvas.
 */
export class SpriteSheet {
  private image: HTMLImageElement;
  private tileSize: number;

  /** Frames loaded from this sheet, indexed by name. */
  private frames: Map<string, { col: number; row: number }> = new Map();

  constructor(image: HTMLImageElement, tileSize: number) {
    this.image = image;
    this.tileSize = tileSize;
  }

  /**
   * Registers a named frame at a grid position (col, row).
   * Returns `this` for chaining.
   */
  define(name: string, col: number, row: number): this {
    this.frames.set(name, { col, row });
    return this;
  }

  /**
   * Draws the named frame at (x, y) on the canvas.
   * Throws if the frame name was not registered.
   */
  draw(ctx: CanvasRenderingContext2D, name: string, x: number, y: number): void {
    const frame = this.frames.get(name);
    if (!frame) throw new Error(`SpriteSheet: unknown frame "${name}"`);

    ctx.drawImage(
      this.image,
      frame.col * this.tileSize,
      frame.row * this.tileSize,
      this.tileSize,
      this.tileSize,
      x,
      y,
      this.tileSize,
      this.tileSize
    );
  }

  /**
   * Loads an image from a URL and resolves once it is ready.
   */
  static load(src: string, tileSize: number): Promise<SpriteSheet> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(new SpriteSheet(img, tileSize));
      img.onerror = () => reject(new Error(`SpriteSheet: failed to load "${src}"`));
      img.src = src;
    });
  }
}

/**
 * Placeholder colors used while real SVGs are not yet available.
 * Each key matches an entity/tile type name.
 */
export const PLACEHOLDER_COLORS: Record<string, string> = {
  player: "#f7a8c4",   // pink
  enemy: "#ff6b6b",    // red
  boss: "#c0392b",     // dark red
  tear: "#74b9ff",     // blue
  item: "#ffd700",     // gold
  door: "#a29bfe",     // purple
  wall: "#636e72",     // gray
  floor: "#dfe6e9",    // light gray
  void: "#1a1a2e",     // dark navy
  heart: "#e84393",    // hot pink
  coin: "#f9ca24",     // yellow
  key: "#badc58",      // green
};

/**
 * Draws a colored square placeholder at (x, y) with a centered label.
 * Used in place of a real sprite until SVGs are provided.
 */
export function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  size: number
): void {
  const color = PLACEHOLDER_COLORS[type] ?? "#b2bec3";

  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.font = `${Math.max(8, size * 0.22)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(type, x + size / 2, y + size / 2);
}
