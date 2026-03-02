import { Pebble } from "@/entities/Pebble";
import { Item } from "@/entities/Item";
import type { Enemy } from "@/entities/Enemy";
import type { RoomRole } from "@/game/Floor";
import { TILE_SIZE, ROOM_WIDTH, ROOM_HEIGHT } from "@/constants";

/** Everything that gets spawned into a room when it is first entered. */
export interface SpawnResult {
  enemies: Enemy[];
  items: Item[];
}

/**
 * Populates a room with enemies and items based on the room's role and floor depth.
 *
 * All spawn positions are chosen in world space (pixels).
 * The system never touches the canvas or game state directly.
 */
export class SpawnSystem {
  /**
   * Generates the initial contents for a room.
   *
   * @param role   - The room's role (normal, boss, treasure, etc.)
   * @param depth  - The current floor depth (1 = first floor).
   * @param rng    - Injectable random function for deterministic tests.
   */
  spawn(role: RoomRole, depth: number, rng: () => number = Math.random): SpawnResult {
    switch (role) {
      case "start":
        return { enemies: [], items: [] };

      case "normal":
        return this.spawnNormalRoom(depth, rng);

      case "treasure":
        return this.spawnTreasureRoom(rng);

      case "shop":
        return this.spawnShopRoom(rng);

      case "boss":
        return this.spawnBossRoom(depth, rng);
    }
  }

  private spawnNormalRoom(depth: number, rng: () => number): SpawnResult {
    const enemyCount = Math.min(2 + depth, 6);
    const enemies: Enemy[] = [];

    for (let i = 0; i < enemyCount; i++) {
      const { x, y } = this.randomFloorPosition(rng);
      enemies.push(new Pebble(x, y));
    }

    // Small chance of a coin or heart dropping in a normal room.
    const items: Item[] = [];
    if (rng() < 0.3) {
      const { x, y } = this.randomFloorPosition(rng);
      items.push(new Item(x, y, "Coin", { type: "addCoin", amount: 1 }));
    }

    return { enemies, items };
  }

  private spawnTreasureRoom(_rng: () => number): SpawnResult {
    const x = ROOM_WIDTH  / 2 - TILE_SIZE / 2;
    const y = ROOM_HEIGHT / 2 - TILE_SIZE / 2;
    const item = new Item(x, y, "Speed Up", { type: "statBoost", stat: "speed", amount: 0.5 });
    return { enemies: [], items: [item] };
  }

  private spawnShopRoom(rng: () => number): SpawnResult {
    // Three items spaced evenly across the room center row.
    const shopItems: Item[] = [
      new Item(
        ROOM_WIDTH * 0.25, ROOM_HEIGHT / 2,
        "Heart",   { type: "heal", amount: 2 }
      ),
      new Item(
        ROOM_WIDTH * 0.5 - TILE_SIZE / 2, ROOM_HEIGHT / 2,
        "Damage Up", { type: "statBoost", stat: "damage", amount: 1 }
      ),
      new Item(
        ROOM_WIDTH * 0.75, ROOM_HEIGHT / 2,
        "Key",   { type: "addKey", amount: 1 }
      ),
    ];
    void rng; // reserved for randomising shop stock in the future
    return { enemies: [], items: shopItems };
  }

  private spawnBossRoom(depth: number, rng: () => number): SpawnResult {
    // Boss is spawned directly by GameScene (it needs special handling).
    // We return a heart drop at the center for after the boss dies.
    void depth;
    void rng;
    return { enemies: [], items: [] };
  }

  /**
   * Returns a random position on the walkable floor of the room.
   * Avoids the wall border (1 tile inset).
   */
  private randomFloorPosition(rng: () => number): { x: number; y: number } {
    const minX = TILE_SIZE * 2;
    const minY = TILE_SIZE * 2;
    const maxX = ROOM_WIDTH  - TILE_SIZE * 3;
    const maxY = ROOM_HEIGHT - TILE_SIZE * 3;

    return {
      x: minX + rng() * (maxX - minX),
      y: minY + rng() * (maxY - minY),
    };
  }
}
