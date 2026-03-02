import { describe, it, expect } from "vitest";
import { Item } from "@/entities/Item";
import { Player } from "@/entities/Player";
import { PLAYER_MAX_HEALTH, PLAYER_FIRE_DELAY_MS } from "@/constants";

describe("Item", () => {
  it("stores name and effect", () => {
    const item = new Item(0, 0, "Heart", { type: "heal", amount: 2 });
    expect(item.name).toBe("Heart");
    expect(item.effect).toEqual({ type: "heal", amount: 2 });
  });

  it("heal effect restores player health", () => {
    const p = new Player(0, 0);
    p.takeDamage(4);
    const item = new Item(0, 0, "Heart", { type: "heal", amount: 2 });
    item.apply(p);
    expect(p.health).toBe(PLAYER_MAX_HEALTH - 2);
  });

  it("addCoin effect increments player coins", () => {
    const p = new Player(0, 0);
    const item = new Item(0, 0, "Coin", { type: "addCoin", amount: 3 });
    item.apply(p);
    expect(p.coins).toBe(3);
  });

  it("addKey effect increments player keys", () => {
    const p = new Player(0, 0);
    const item = new Item(0, 0, "Key", { type: "addKey", amount: 1 });
    item.apply(p);
    expect(p.keys).toBe(1);
  });

  it("statBoost speed increases player speed", () => {
    const p = new Player(0, 0);
    const before = p.speed;
    new Item(0, 0, "Speed Up", { type: "statBoost", stat: "speed", amount: 1 }).apply(p);
    expect(p.speed).toBe(before + 1);
  });

  it("statBoost damage increases player damage", () => {
    const p = new Player(0, 0);
    const before = p.damage;
    new Item(0, 0, "Damage Up", { type: "statBoost", stat: "damage", amount: 2 }).apply(p);
    expect(p.damage).toBe(before + 2);
  });

  it("statBoost fireRate decreases fire delay", () => {
    const p = new Player(0, 0);
    new Item(0, 0, "Fire Rate Up", { type: "statBoost", stat: "fireRate", amount: 50 }).apply(p);
    expect(p.fireDelayMs).toBe(PLAYER_FIRE_DELAY_MS - 50);
  });

  it("statBoost fireRate clamps to minimum 50ms", () => {
    const p = new Player(0, 0);
    new Item(0, 0, "Fire Rate++", { type: "statBoost", stat: "fireRate", amount: 9999 }).apply(p);
    expect(p.fireDelayMs).toBe(50);
  });

  it("apply destroys the item", () => {
    const item = new Item(0, 0, "Heart", { type: "heal", amount: 2 });
    item.apply(new Player(0, 0));
    expect(item.alive).toBe(false);
  });
});
