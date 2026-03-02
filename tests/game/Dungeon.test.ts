import { describe, it, expect } from "vitest";
import { Dungeon } from "@/game/Dungeon";
import { Floor } from "@/game/Floor";

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

describe("Dungeon", () => {
  it("starts at depth 1", () => {
    const d = new Dungeon(Floor.generate(1, 5, seededRng(1)));
    expect(d.depth).toBe(1);
  });

  it("exposes the current floor", () => {
    const floor = Floor.generate(1, 5, seededRng(1));
    const d = new Dungeon(floor);
    expect(d.currentFloor).toBe(floor);
  });

  it("descend generates a new floor and increments depth", () => {
    const d = new Dungeon(Floor.generate(1, 5, seededRng(1)));
    d.descend(seededRng(2));
    expect(d.depth).toBe(2);
    expect(d.currentFloor.depth).toBe(2);
  });

  it("tracks enemiesKilled and itemsCollected", () => {
    const d = new Dungeon(Floor.generate(1, 5, seededRng(1)));
    d.enemiesKilled = 5;
    d.itemsCollected = 3;
    expect(d.enemiesKilled).toBe(5);
    expect(d.itemsCollected).toBe(3);
  });
});
