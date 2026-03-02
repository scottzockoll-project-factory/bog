/**
 * Base class for every object that exists in the game world.
 * Holds position, size, and alive state.
 */
export class Entity {
  /** Unique identifier — auto-generated if not provided. */
  readonly id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;

  constructor(x: number, y: number, width: number, height: number, id: string = crypto.randomUUID()) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.alive = true;
  }

  /** The center X coordinate of this entity. */
  get centerX(): number {
    return this.x + this.width / 2;
  }

  /** The center Y coordinate of this entity. */
  get centerY(): number {
    return this.y + this.height / 2;
  }

  /** Marks this entity as dead so it can be removed from the world. */
  destroy(): void {
    this.alive = false;
  }

  /**
   * Returns true if this entity's bounding box overlaps with another entity's.
   * Uses simple AABB (axis-aligned bounding box) collision.
   */
  overlaps(other: Entity): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}
