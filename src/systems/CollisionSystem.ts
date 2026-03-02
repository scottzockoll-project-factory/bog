import type { Player } from "@/entities/Player";
import type { Enemy } from "@/entities/Enemy";
import type { Tear } from "@/entities/Tear";
import type { Item } from "@/entities/Item";
import type { Room } from "@/game/Room";
import { TILE_SIZE } from "@/constants";

/** All collision events produced in a single frame. */
export interface CollisionResult {
  /** Each entry: a tear that hit an enemy, and which enemy it hit. */
  tearHitEnemy: Array<{ tear: Tear; enemy: Enemy }>;

  /** Each entry: a player that touched an enemy. */
  playerHitEnemy: Array<{ player: Player; enemy: Enemy }>;

  /** Each entry: a player that walked onto an item. */
  playerPickedUpItem: Array<{ player: Player; item: Item }>;

  /** Each entry: a player whose center is in a door tile — and which direction. */
  playerAtDoor: Array<{ player: Player; direction: "north" | "south" | "east" | "west" }>;
}

/**
 * Detects all collisions for one frame and returns structured results.
 *
 * This class never mutates game state — it only reports what collided.
 * The caller (GameScene) decides how to respond (deal damage, remove items, etc.)
 */
export class CollisionSystem {
  /**
   * Runs all collision checks for the current frame.
   *
   * @param players  - All players currently in the room.
   * @param enemies  - All enemies currently in the room.
   * @param tears    - All active tears.
   * @param items    - All items currently on the floor.
   * @param room     - The current room (used for wall and door checks).
   */
  check(
    players: Player[],
    enemies: Enemy[],
    tears: Tear[],
    items: Item[],
    room: Room
  ): CollisionResult {
    const result: CollisionResult = {
      tearHitEnemy: [],
      playerHitEnemy: [],
      playerPickedUpItem: [],
      playerAtDoor: [],
    };

    this.checkTearVsEnemy(tears, enemies, result);
    this.checkTearVsWall(tears, room);
    this.checkPlayerVsEnemy(players, enemies, result);
    this.checkPlayerVsItem(players, items, result);
    this.checkPlayerVsDoor(players, room, result);

    return result;
  }

  private checkTearVsEnemy(tears: Tear[], enemies: Enemy[], result: CollisionResult): void {
    for (const tear of tears) {
      if (!tear.alive) continue;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (tear.overlaps(enemy)) {
          result.tearHitEnemy.push({ tear, enemy });
          tear.destroy(); // each tear can only hit one target
          break;
        }
      }
    }
  }

  private checkTearVsWall(tears: Tear[], room: Room): void {
    for (const tear of tears) {
      if (!tear.alive) continue;
      const col = Math.floor(tear.centerX / TILE_SIZE);
      const row = Math.floor(tear.centerY / TILE_SIZE);
      if (room.getTile(col, row) === "wall") {
        tear.destroy();
      }
    }
  }

  private checkPlayerVsEnemy(players: Player[], enemies: Enemy[], result: CollisionResult): void {
    for (const player of players) {
      if (!player.alive) continue;
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (player.overlaps(enemy)) {
          result.playerHitEnemy.push({ player, enemy });
        }
      }
    }
  }

  private checkPlayerVsItem(players: Player[], items: Item[], result: CollisionResult): void {
    for (const player of players) {
      if (!player.alive) continue;
      for (const item of items) {
        if (!item.alive) continue;
        if (player.overlaps(item)) {
          result.playerPickedUpItem.push({ player, item });
        }
      }
    }
  }

  private checkPlayerVsDoor(
    players: Player[],
    room: Room,
    result: CollisionResult
  ): void {
    const midCol = Math.floor(room.widthTiles / 2);
    const midRow = Math.floor(room.heightTiles / 2);

    const doorTiles = {
      north: { col: midCol, row: 0 },
      south: { col: midCol, row: room.heightTiles - 1 },
      west:  { col: 0, row: midRow },
      east:  { col: room.widthTiles - 1, row: midRow },
    } as const;

    for (const player of players) {
      if (!player.alive) continue;

      const playerCol = Math.floor(player.centerX / TILE_SIZE);
      const playerRow = Math.floor(player.centerY / TILE_SIZE);

      for (const [dir, tile] of Object.entries(doorTiles) as Array<[
        "north" | "south" | "east" | "west",
        { col: number; row: number }
      ]>) {
        if (room.hasDoor(dir) && playerCol === tile.col && playerRow === tile.row) {
          result.playerAtDoor.push({ player, direction: dir });
        }
      }
    }
  }
}
