import { describe, it, expect } from "vitest";
import { Tear } from "@/entities/Tear";
import { TEAR_RANGE, TEAR_SPEED } from "@/constants";

describe("Tear", () => {
  it("normalizes the direction vector", () => {
    const t = new Tear(0, 0, 3, 4, 1, "player1");
    expect(t.dirX).toBeCloseTo(0.6);
    expect(t.dirY).toBeCloseTo(0.8);
  });

  it("handles a zero direction vector gracefully", () => {
    const t = new Tear(0, 0, 0, 0, 1, "player1");
    expect(t.dirX).toBe(0);
    expect(t.dirY).toBe(0);
  });

  it("starts with traveled = 0", () => {
    expect(new Tear(0, 0, 1, 0, 1, "p").traveled).toBe(0);
  });

  it("moves on update", () => {
    const t = new Tear(100, 100, 1, 0, 1, "p");
    const before = t.x;
    t.update();
    expect(t.x).toBeGreaterThan(before);
  });

  it("increases traveled distance on update", () => {
    const t = new Tear(0, 0, 1, 0, 1, "p");
    t.update();
    expect(t.traveled).toBeCloseTo(TEAR_SPEED);
  });

  it("destroys itself when it exceeds max range", () => {
    const t = new Tear(0, 0, 1, 0, 1, "p", TEAR_SPEED, 10);
    for (let i = 0; i < 5; i++) t.update(); // each step = TEAR_SPEED pixels
    expect(t.alive).toBe(false);
  });

  it("stores damage and ownerId", () => {
    const t = new Tear(0, 0, 0, 1, 5, "boss");
    expect(t.damage).toBe(5);
    expect(t.ownerId).toBe("boss");
  });

  it("uses custom speed and range", () => {
    const t = new Tear(0, 0, 1, 0, 1, "p", 2, 4);
    expect(t.speed).toBe(2);
    t.update(); t.update();
    expect(t.alive).toBe(false);
  });
});
