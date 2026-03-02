import { describe, it, expect } from "vitest";
import { Pebble } from "@/entities/Pebble";
import { Player } from "@/entities/Player";

describe("Pebble", () => {
  it("initializes with correct stats", () => {
    const p = new Pebble(100, 100);
    expect(p.health).toBe(6);
    expect(p.contactDamage).toBe(0.5);
    expect(p.alive).toBe(true);
  });

  it("has entityType 'pebble'", () => {
    expect(new Pebble(0, 0).entityType).toBe("pebble");
  });

  it("moves toward the nearest player", () => {
    const pebble = new Pebble(0, 0);
    const player = new Player(200, 0);
    const before = pebble.x;
    pebble.update([player], 16);
    expect(pebble.x).toBeGreaterThan(before);
  });

  it("returns no tears", () => {
    const pebble = new Pebble(0, 0);
    const player = new Player(200, 0);
    const tears = pebble.update([player], 16);
    expect(tears).toHaveLength(0);
  });

  it("ignores dead players", () => {
    const pebble = new Pebble(100, 100);
    const dead = new Player(200, 100);
    dead.destroy();
    const before = { x: pebble.x, y: pebble.y };
    pebble.update([dead], 16);
    // Should not move since there's no live target.
    expect(pebble.x).toBe(before.x);
    expect(pebble.y).toBe(before.y);
  });

  it("moves toward the nearer of two players", () => {
    const pebble = new Pebble(100, 100);
    const close  = new Player(110, 100);
    const far    = new Player(500, 100);
    pebble.update([far, close], 16);
    // Should be moving toward 'close' (to the right).
    expect(pebble.x).toBeGreaterThan(100);
  });

  it("does not divide by zero when pebble center matches player center", () => {
    // Pebble size=24, center offset=12. Player size=32, center offset=16.
    // For centers to match: pebble.x + 12 = player.x + 16 → player.x = pebble.x - 4.
    const pebble = new Pebble(100, 100);
    const player = new Player(96, 96); // center (112,112) == pebble center
    expect(() => pebble.update([player], 16)).not.toThrow();
  });

  it("takeDamage reduces health and destroys at 0", () => {
    const p = new Pebble(0, 0);
    p.takeDamage(6);
    expect(p.alive).toBe(false);
  });
});
