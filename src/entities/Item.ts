import { TILE_SIZE } from "@/constants";
import { Entity } from "@/entities/Entity";
import type { Player } from "@/entities/Player";

/** What an item does when picked up. */
export type ItemEffect =
  | { type: "heal"; amount: number }
  | { type: "addCoin"; amount: number }
  | { type: "addKey"; amount: number }
  | { type: "statBoost"; stat: "speed" | "damage" | "fireRate"; amount: number };

/**
 * A pickup that sits on the floor until a player walks over it.
 *
 * Items are passive — they don't move or act. GameScene watches for
 * player-item overlaps via CollisionSystem and then calls item.apply().
 */
export class Item extends Entity {
  readonly name: string;
  readonly effect: ItemEffect;

  constructor(x: number, y: number, name: string, effect: ItemEffect) {
    super(x, y, TILE_SIZE, TILE_SIZE);
    this.name = name;
    this.effect = effect;
  }

  /**
   * Applies this item's effect to the given player and marks it as consumed.
   */
  apply(player: Player): void {
    switch (this.effect.type) {
      case "heal":
        player.heal(this.effect.amount);
        break;
      case "addCoin":
        player.coins += this.effect.amount;
        break;
      case "addKey":
        player.keys += this.effect.amount;
        break;
      case "statBoost":
        switch (this.effect.stat) {
          case "speed":
            player.speed += this.effect.amount;
            break;
          case "damage":
            player.damage += this.effect.amount;
            break;
          case "fireRate":
            player.fireDelayMs = Math.max(50, player.fireDelayMs - this.effect.amount);
            break;
        }
        break;
    }
    this.destroy();
  }
}
