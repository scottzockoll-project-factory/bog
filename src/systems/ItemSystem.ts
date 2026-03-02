import { Item } from "@/entities/Item";
import type { Player } from "@/entities/Player";

/**
 * Manages item pickup side-effects beyond the basic stat changes in Item.apply().
 *
 * For now this is a thin wrapper, but it's the right place to add:
 * - item synergy logic
 * - pickup sound triggers
 * - achievement tracking
 */
export class ItemSystem {
  /**
   * Applies an item to a player.
   * Delegates to item.apply() and marks the item as consumed.
   */
  pickup(player: Player, item: Item): void {
    item.apply(player);
  }

  /**
   * Creates a set of standard floor pickups at the given positions.
   */
  static makeBasicPickups(
    positions: Array<{ x: number; y: number; type: "heart" | "coin" | "key" }>
  ): Item[] {
    return positions.map(({ x, y, type }) => {
      switch (type) {
        case "heart":
          return new Item(x, y, "Heart", { type: "heal", amount: 2 });
        case "coin":
          return new Item(x, y, "Coin", { type: "addCoin", amount: 1 });
        case "key":
          return new Item(x, y, "Key", { type: "addKey", amount: 1 });
      }
    });
  }
}
