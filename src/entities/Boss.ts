import { TILE_SIZE, TEAR_DAMAGE } from "@/constants";
import { Enemy } from "@/entities/Enemy";
import { Tear } from "@/entities/Tear";
import type { Player } from "@/entities/Player";

/** How long to wait between spread-shot attacks (ms). */
const ATTACK_COOLDOWN_MS = 2000;

/** At what health fraction phase 2 begins. */
const PHASE_2_THRESHOLD = 0.5;

/**
 * Big Goofe — the first floor boss.
 *
 * Phase 1: Charges toward the nearest player.
 * Phase 2 (≤50% HP): Faster charges + fires a spread of tears on each charge.
 */
export class Boss extends Enemy {
  private phase: 1 | 2 = 1;
  private timeSinceAttack: number = ATTACK_COOLDOWN_MS;

  readonly entityType = "boss" as const;

  constructor(x: number, y: number, id: string = "boss") {
    super(
      x,
      y,
      TILE_SIZE * 2,  // twice the size of a normal enemy
      60,             // health
      1.0,            // speed (phase 1)
      1.0,            // contactDamage (one full heart)
      id
    );
  }

  /**
   * Charges toward the nearest player and, in phase 2, also fires a
   * 5-way spread of tears when the attack cooldown expires.
   */
  update(players: Player[], deltaMs: number): Tear[] {
    this.checkPhaseTransition();

    const target = this.findNearestPlayer(players);
    if (!target) return [];

    this.chargeAtTarget(target);

    this.timeSinceAttack += deltaMs;
    if (this.phase === 2 && this.timeSinceAttack >= ATTACK_COOLDOWN_MS) {
      this.timeSinceAttack = 0;
      return this.fireSpread(target);
    }

    return [];
  }

  private checkPhaseTransition(): void {
    if (this.phase === 1 && this.healthFraction <= PHASE_2_THRESHOLD) {
      this.phase = 2;
      // Speed boost on phase transition.
      (this as { speed: number }).speed = 1.8;
    }
  }

  private chargeAtTarget(target: Player): void {
    const dx = target.centerX - this.centerX;
    const dy = target.centerY - this.centerY;
    const len = Math.sqrt(dx ** 2 + dy ** 2) || 1;

    this.x += (dx / len) * this.speed;
    this.y += (dy / len) * this.speed;
  }

  /**
   * Fires 5 tears in a spread centered on the target direction.
   * Spread angle is 60° total (±30° from center).
   */
  private fireSpread(target: Player): Tear[] {
    const dx = target.centerX - this.centerX;
    const dy = target.centerY - this.centerY;
    const baseAngle = Math.atan2(dy, dx);

    const spreadAngles = [-0.52, -0.26, 0, 0.26, 0.52]; // ~±30° in radians

    return spreadAngles.map((offset) => {
      const angle = baseAngle + offset;
      return new Tear(
        this.centerX,
        this.centerY,
        Math.cos(angle),
        Math.sin(angle),
        TEAR_DAMAGE * 0.7, // boss tears deal slightly less than player tears
        this.id
      );
    });
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

  /** Which phase the boss is currently in. */
  get currentPhase(): 1 | 2 {
    return this.phase;
  }
}
