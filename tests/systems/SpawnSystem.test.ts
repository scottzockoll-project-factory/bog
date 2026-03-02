import { describe, it, expect } from "vitest";
import { SpawnSystem } from "@/systems/SpawnSystem";

const rng = () => 0.5; // deterministic

describe("SpawnSystem", () => {
  const sys = new SpawnSystem();

  it("start room spawns nothing", () => {
    const result = sys.spawn("start", 1, rng);
    expect(result.enemies).toHaveLength(0);
    expect(result.items).toHaveLength(0);
  });

  it("normal room spawns enemies", () => {
    const result = sys.spawn("normal", 1, rng);
    expect(result.enemies.length).toBeGreaterThan(0);
  });

  it("normal room enemy count scales with depth", () => {
    const shallow = sys.spawn("normal", 1, rng).enemies.length;
    const deep    = sys.spawn("normal", 4, rng).enemies.length;
    expect(deep).toBeGreaterThanOrEqual(shallow);
  });

  it("normal room enemy count is capped at 6", () => {
    const result = sys.spawn("normal", 999, rng);
    expect(result.enemies.length).toBeLessThanOrEqual(6);
  });

  it("normal room may spawn a coin (rng=0.1 < 0.3 threshold)", () => {
    const result = sys.spawn("normal", 1, () => 0.1);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
  });

  it("normal room skips coin drop when rng >= 0.3", () => {
    const result = sys.spawn("normal", 1, () => 0.9);
    expect(result.items).toHaveLength(0);
  });

  it("treasure room spawns no enemies and one item", () => {
    const result = sys.spawn("treasure", 1, rng);
    expect(result.enemies).toHaveLength(0);
    expect(result.items).toHaveLength(1);
  });

  it("shop room spawns no enemies and three items", () => {
    const result = sys.spawn("shop", 1, rng);
    expect(result.enemies).toHaveLength(0);
    expect(result.items).toHaveLength(3);
  });

  it("boss room returns empty spawn result (boss handled by GameScene)", () => {
    const result = sys.spawn("boss", 1, rng);
    expect(result.enemies).toHaveLength(0);
    expect(result.items).toHaveLength(0);
  });
});
