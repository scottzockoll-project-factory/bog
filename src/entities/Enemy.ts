import { TILE_SIZE } from "@/constants";
import { Entity } from "@/entities/Entity";
import type { Player } from "@/entities/Player";
import type { Tear } from "@/entities/Tear";

/**
 * Base class for all enemies.
 *
 * Subclasses implement update() to define their movement and attack patterns.
 * Enemy logic is pure (no canvas calls), so it is easily unit-tested.
 */
export abstract class Enemy extends Entity {
  health: number;
  readonly maxHealth: number;
  readonly speed: number;
  readonly contactDamage: number;

  /** String tag used to identify the enemy type in serialized multiplayer state. */
  abstract readonly entityType: string;

  constructor(
    x: number,
    y: number,
    size: number = TILE_SIZE,
    health: number = 10,
    speed: number = 1.5,
    contactDamage: number = 1,
    id?: string
  ) {
    super(x, y, size, size, id);
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.contactDamage = contactDamage;
  }

  /**
   * Advances this enemy's state by one frame.
   * Returns any new tears spawned by the enemy this frame.
   *
   * @param players  - All living players in the current room.
   * @param deltaMs  - Milliseconds since the last frame.
   */
  abstract update(players: Player[], deltaMs: number): Tear[];

  /**
   * Applies damage to this enemy.
   * Destroys it when health reaches zero.
   */
  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) this.destroy();
  }

  /** Health as a 0–1 fraction, useful for rendering health bars. */
  get healthFraction(): number {
    return this.health / this.maxHealth;
  }
}
