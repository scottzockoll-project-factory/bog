import { describe, it, expect } from "vitest";
import { ItemSystem } from "@/systems/ItemSystem";
import { Item } from "@/entities/Item";
import { Player } from "@/entities/Player";

describe("ItemSystem", () => {
  it("pickup applies the item to the player and destroys it", () => {
    const sys = new ItemSystem();
    const p = new Player(0, 0);
    p.takeDamage(4);
    const item = new Item(0, 0, "Heart", { type: "heal", amount: 2 });
    sys.pickup(p, item);
    expect(p.health).toBeGreaterThan(2);
    expect(item.alive).toBe(false);
  });

  describe("makeBasicPickups", () => {
    it("creates a heart", () => {
      const items = ItemSystem.makeBasicPickups([{ x: 0, y: 0, type: "heart" }]);
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe("Heart");
    });

    it("creates a coin", () => {
      const items = ItemSystem.makeBasicPickups([{ x: 0, y: 0, type: "coin" }]);
      expect(items[0].name).toBe("Coin");
    });

    it("creates a key", () => {
      const items = ItemSystem.makeBasicPickups([{ x: 0, y: 0, type: "key" }]);
      expect(items[0].name).toBe("Key");
    });

    it("creates multiple items", () => {
      const items = ItemSystem.makeBasicPickups([
        { x: 0, y: 0, type: "heart" },
        { x: 32, y: 0, type: "coin" },
      ]);
      expect(items).toHaveLength(2);
    });
  });
});
