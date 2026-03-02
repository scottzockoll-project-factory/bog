import { Floor } from "@/game/Floor";

/**
 * A full run — a sequence of floors the player descends through.
 * Tracks run-wide stats and generates new floors on demand.
 */
export class Dungeon {
  private floors: Floor[];
  private currentFloorIndex: number;

  /** Total enemies killed across all floors. */
  enemiesKilled: number = 0;

  /** Total items collected across all floors. */
  itemsCollected: number = 0;

  constructor(firstFloor: Floor) {
    this.floors = [firstFloor];
    this.currentFloorIndex = 0;
  }

  /** The floor the player is currently on. */
  get currentFloor(): Floor {
    return this.floors[this.currentFloorIndex];
  }

  /** The 1-based floor number (depth). */
  get depth(): number {
    return this.currentFloorIndex + 1;
  }

  /**
   * Generates the next floor and advances to it.
   * Call this when the player steps through the boss room exit.
   *
   * @param rng - Injectable random function for testing.
   */
  descend(rng: () => number = Math.random): void {
    const nextDepth = this.depth + 1;
    const roomCount = Math.min(8 + nextDepth, 16); // more rooms on deeper floors
    const floor = Floor.generate(nextDepth, roomCount, rng);
    this.floors.push(floor);
    this.currentFloorIndex++;
  }
}
