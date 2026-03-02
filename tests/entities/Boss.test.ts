import { describe, it, expect } from "vitest";
import { Boss } from "@/entities/Boss";
import { Player } from "@/entities/Player";

describe("Boss", () => {
  it("initializes in phase 1", () => {
    expect(new Boss(0, 0).currentPhase).toBe(1);
  });

  it("accepts a custom id", () => {
    expect(new Boss(0, 0, "big-goofe").id).toBe("big-goofe");
  });

  it("has entityType 'boss'", () => {
    expect(new Boss(0, 0).entityType).toBe("boss");
  });

  it("moves toward the nearest player in phase 1", () => {
    const boss = new Boss(0, 0);
    const player = new Player(200, 0);
    const before = boss.x;
    boss.update([player], 16);
    expect(boss.x).toBeGreaterThan(before);
  });

  it("returns no tears in phase 1 even when attack cooldown expires", () => {
    const boss = new Boss(0, 0);
    const player = new Player(200, 0);
    // Provide a very large deltaMs — boss is still in phase 1.
    const tears = boss.update([player], 99999);
    expect(tears).toHaveLength(0);
  });

  it("transitions to phase 2 at 50% health", () => {
    const boss = new Boss(0, 0);
    boss.takeDamage(30); // 50% of 60
    boss.update([new Player(200, 0)], 16);
    expect(boss.currentPhase).toBe(2);
  });

  it("fires a 5-tear spread in phase 2 when cooldown expires", () => {
    const boss = new Boss(0, 0);
    boss.takeDamage(31); // trigger phase 2
    const player = new Player(200, 0);
    // First update triggers phase transition.
    boss.update([player], 16);
    // Large delta to expire cooldown.
    const tears = boss.update([player], 99999);
    expect(tears).toHaveLength(5);
  });

  it("does not fire in phase 2 before cooldown expires", () => {
    const boss = new Boss(0, 0);
    boss.takeDamage(31);
    const player = new Player(200, 0);
    boss.update([player], 16); // transition
    const tears = boss.update([player], 16); // too soon
    expect(tears).toHaveLength(0);
  });

  it("returns no tears when there are no players", () => {
    const boss = new Boss(0, 0);
    expect(boss.update([], 16)).toHaveLength(0);
  });

  it("ignores dead players", () => {
    const boss = new Boss(100, 100);
    const dead = new Player(200, 100);
    dead.destroy();
    const before = { x: boss.x, y: boss.y };
    boss.update([dead], 16);
    expect(boss.x).toBe(before.x);
    expect(boss.y).toBe(before.y);
  });

  it("does not divide by zero when boss center matches player center", () => {
    // Boss size=64, center offset=32. Player size=32, center offset=16.
    // For centers to match: boss.x + 32 = player.x + 16 → player.x = boss.x + 16.
    const boss = new Boss(100, 100);
    const player = new Player(116, 116); // center (148,148) == boss center
    expect(() => boss.update([player], 16)).not.toThrow();
  });

  it("takeDamage destroys boss at 0 health", () => {
    const boss = new Boss(0, 0);
    boss.takeDamage(60);
    expect(boss.alive).toBe(false);
  });

  it("healthFraction is 1 when full health", () => {
    expect(new Boss(0, 0).healthFraction).toBe(1);
  });
});
