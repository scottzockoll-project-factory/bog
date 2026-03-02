import { describe, it, expect } from "vitest";
import { Entity } from "@/entities/Entity";

class TestEntity extends Entity {}

describe("Entity", () => {
  it("stores position and size", () => {
    const e = new TestEntity(10, 20, 30, 40);
    expect(e.x).toBe(10);
    expect(e.y).toBe(20);
    expect(e.width).toBe(30);
    expect(e.height).toBe(40);
  });

  it("starts alive", () => {
    expect(new TestEntity(0, 0, 10, 10).alive).toBe(true);
  });

  it("auto-generates an id when none is provided", () => {
    const e = new TestEntity(0, 0, 10, 10);
    expect(typeof e.id).toBe("string");
    expect(e.id.length).toBeGreaterThan(0);
  });

  it("uses the provided id when given", () => {
    const e = new TestEntity(0, 0, 10, 10, "my-id");
    expect(e.id).toBe("my-id");
  });

  it("two entities with no id get unique ids", () => {
    const a = new TestEntity(0, 0, 10, 10);
    const b = new TestEntity(0, 0, 10, 10);
    expect(a.id).not.toBe(b.id);
  });

  it("computes centerX and centerY", () => {
    const e = new TestEntity(10, 20, 30, 40);
    expect(e.centerX).toBe(25);
    expect(e.centerY).toBe(40);
  });

  it("destroy marks alive=false", () => {
    const e = new TestEntity(0, 0, 10, 10);
    e.destroy();
    expect(e.alive).toBe(false);
  });

  describe("overlaps", () => {
    it("returns true for overlapping entities", () => {
      const a = new TestEntity(0, 0, 10, 10);
      const b = new TestEntity(5, 5, 10, 10);
      expect(a.overlaps(b)).toBe(true);
    });

    it("returns false for non-overlapping entities", () => {
      const a = new TestEntity(0, 0, 10, 10);
      const b = new TestEntity(20, 20, 10, 10);
      expect(a.overlaps(b)).toBe(false);
    });

    it("returns false for entities touching only at the edge", () => {
      const a = new TestEntity(0, 0, 10, 10);
      const b = new TestEntity(10, 0, 10, 10);
      expect(a.overlaps(b)).toBe(false);
    });
  });
});
