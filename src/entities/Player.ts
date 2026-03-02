import { PLAYER_SPEED, PLAYER_MAX_HEALTH, PLAYER_FIRE_DELAY_MS, TILE_SIZE } from "@/constants";
import { Entity } from "@/entities/Entity";
import type { InputState } from "@/entities/InputState";
import { Tear } from "@/entities/Tear";

/**
 * The player character — Goofe!
 *
 * Movement and shooting are driven by an InputState so the same
 * class works for local play, remote clients, and tests.
 */
export class Player extends Entity {
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  fireDelayMs: number;

  /** Milliseconds since the last tear was fired. */
  private timeSinceLastShot: number;

  /** Coins collected this run. */
  coins: number;

  /** Keys collected this run. */
  keys: number;

  constructor(x: number, y: number, id: string = "player1") {
    super(x, y, TILE_SIZE, TILE_SIZE, id);
    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.speed = PLAYER_SPEED;
    this.damage = 3.5;
    this.fireDelayMs = PLAYER_FIRE_DELAY_MS;
    this.timeSinceLastShot = this.fireDelayMs; // ready to shoot immediately
    this.coins = 0;
    this.keys = 0;
  }

  /**
   * Advances the player's state by one frame.
   * Returns any new tears that should be added to the room.
   *
   * @param input      - The current frame's input snapshot.
   * @param deltaMs    - Milliseconds since the last frame.
   * @param roomLeft   - Left boundary of the walkable area (pixels).
   * @param roomTop    - Top boundary of the walkable area (pixels).
   * @param roomRight  - Right boundary (pixels).
   * @param roomBottom - Bottom boundary (pixels).
   */
  update(
    input: InputState,
    deltaMs: number,
    roomLeft: number,
    roomTop: number,
    roomRight: number,
    roomBottom: number
  ): Tear[] {
    this.move(input, roomLeft, roomTop, roomRight, roomBottom);
    this.timeSinceLastShot += deltaMs;
    return this.tryShoot(input);
  }

  /**
   * Applies damage to the player.
   * Destroys the player if health reaches zero.
   */
  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) this.destroy();
  }

  /** Heals the player, clamped to maxHealth. */
  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  private move(
    input: InputState,
    roomLeft: number,
    roomTop: number,
    roomRight: number,
    roomBottom: number
  ): void {
    // Normalize diagonal movement so it isn't faster than cardinal movement.
    const len = Math.sqrt(input.moveX ** 2 + input.moveY ** 2) || 1;
    const nx = input.moveX === 0 && input.moveY === 0 ? 0 : input.moveX / len;
    const ny = input.moveX === 0 && input.moveY === 0 ? 0 : input.moveY / len;

    this.x = Math.max(roomLeft, Math.min(roomRight - this.width, this.x + nx * this.speed));
    this.y = Math.max(roomTop, Math.min(roomBottom - this.height, this.y + ny * this.speed));
  }

  private tryShoot(input: InputState): Tear[] {
    const isShooting = input.shootX !== 0 || input.shootY !== 0;
    if (!isShooting || this.timeSinceLastShot < this.fireDelayMs) return [];

    this.timeSinceLastShot = 0;
    return [new Tear(this.centerX, this.centerY, input.shootX, input.shootY, this.damage, this.id)];
  }
}
