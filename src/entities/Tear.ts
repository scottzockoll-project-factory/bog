import { TEAR_SPEED, TEAR_RANGE, TILE_SIZE } from "@/constants";
import { Entity } from "@/entities/Entity";

/**
 * A tear (projectile) fired by a player or enemy.
 *
 * Tears travel in a fixed direction and destroy themselves when they
 * hit a wall, exceed their range, or hit a valid target.
 */
export class Tear extends Entity {
  /** Normalized direction X component. */
  readonly dirX: number;

  /** Normalized direction Y component. */
  readonly dirY: number;

  readonly speed: number;
  readonly damage: number;

  /** ID of the entity that fired this tear — used to skip self-collision. */
  readonly ownerId: string;

  /** Total pixels traveled so far. */
  private distanceTraveled: number = 0;
  private readonly maxRange: number;

  constructor(
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    damage: number,
    ownerId: string,
    speed: number = TEAR_SPEED,
    maxRange: number = TEAR_RANGE
  ) {
    const size = Math.floor(TILE_SIZE * 0.35);
    super(x - size / 2, y - size / 2, size, size);

    // Normalize the direction vector.
    const len = Math.sqrt(dirX ** 2 + dirY ** 2) || 1;
    this.dirX = dirX / len;
    this.dirY = dirY / len;

    this.speed = speed;
    this.damage = damage;
    this.ownerId = ownerId;
    this.maxRange = maxRange;
  }

  /**
   * Moves the tear forward one frame.
   * Destroys the tear if it has exceeded its maximum range.
   */
  update(): void {
    const dx = this.dirX * this.speed;
    const dy = this.dirY * this.speed;

    this.x += dx;
    this.y += dy;
    this.distanceTraveled += Math.sqrt(dx ** 2 + dy ** 2);

    if (this.distanceTraveled >= this.maxRange) {
      this.destroy();
    }
  }

  /** How far this tear has traveled so far, in pixels. */
  get traveled(): number {
    return this.distanceTraveled;
  }
}
