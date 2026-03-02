import { Enemy } from "@/entities/Enemy";
import type { Player } from "@/entities/Player";
import type { Tear } from "@/entities/Tear";

/**
 * The Pebble — the most basic enemy.
 *
 * It walks directly toward the nearest player and deals contact damage.
 * No ranged attack. Perfect for testing the full combat loop.
 */
export class Pebble extends Enemy {
  readonly entityType = "pebble" as const;

  constructor(x: number, y: number) {
    super(
      x,
      y,
      24,  // size (px) — a bit smaller than a tile
      6,   // health
      1.2, // speed
      0.5  // contactDamage (half a heart)
    );
  }

  /**
   * Moves toward the nearest player every frame.
   * Pebbles do not shoot, so this always returns an empty array.
   */
  update(players: Player[], _deltaMs: number): Tear[] {
    const target = this.findNearestPlayer(players);
    if (!target) return [];

    const dx = target.centerX - this.centerX;
    const dy = target.centerY - this.centerY;
    const len = Math.sqrt(dx ** 2 + dy ** 2) || 1;

    this.x += (dx / len) * this.speed;
    this.y += (dy / len) * this.speed;

    return [];
  }

  private findNearestPlayer(players: Player[]): Player | null {
    let nearest: Player | null = null;
    let nearestDist = Infinity;

    for (const player of players) {
      if (!player.alive) continue;
      const dist = Math.hypot(player.centerX - this.centerX, player.centerY - this.centerY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = player;
      }
    }

    return nearest;
  }
}
