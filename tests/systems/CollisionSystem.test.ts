import { describe, it, expect } from "vitest";
import { CollisionSystem } from "@/systems/CollisionSystem";
import { Player } from "@/entities/Player";
import { Pebble } from "@/entities/Pebble";
import { Tear } from "@/entities/Tear";
import { Item } from "@/entities/Item";
import { Room } from "@/game/Room";
import { TILE_SIZE } from "@/constants";

function makeSystem() {
  return new CollisionSystem();
}

function makeRoom() {
  return new Room(10, 10);
}

describe("CollisionSystem", () => {
  describe("tear vs enemy", () => {
    it("detects a tear hitting an enemy", () => {
      const sys = makeSystem();
      const room = makeRoom();
      const player = new Player(400, 300);
      const enemy = new Pebble(100, 100);
      const tear = new Tear(100 + TILE_SIZE / 2, 100 + TILE_SIZE / 2, 1, 0, 3.5, "player1");

      const result = sys.check([player], [enemy], [tear], [], room);
      expect(result.tearHitEnemy).toHaveLength(1);
      expect(result.tearHitEnemy[0].enemy).toBe(enemy);
      expect(result.tearHitEnemy[0].tear).toBe(tear);
    });

    it("destroys the tear on hit", () => {
      const sys = makeSystem();
      const room = makeRoom();
      const enemy = new Pebble(100, 100);
      const tear = new Tear(100 + TILE_SIZE / 2, 100 + TILE_SIZE / 2, 1, 0, 3.5, "player1");
      sys.check([new Player(400, 300)], [enemy], [tear], [], room);
      expect(tear.alive).toBe(false);
    });

    it("skips dead tears", () => {
      const sys = makeSystem();
      const room = makeRoom();
      const enemy = new Pebble(100, 100);
      const tear = new Tear(100 + TILE_SIZE / 2, 100 + TILE_SIZE / 2, 1, 0, 3.5, "player1");
      tear.destroy();
      const result = sys.check([new Player(400, 300)], [enemy], [tear], [], room);
      expect(result.tearHitEnemy).toHaveLength(0);
    });

    it("skips dead enemies", () => {
      const sys = makeSystem();
      const room = makeRoom();
      const enemy = new Pebble(100, 100);
      enemy.destroy();
      const tear = new Tear(100, 100, 1, 0, 3.5, "player1");
      const result = sys.check([new Player(400, 300)], [enemy], [tear], [], room);
      expect(result.tearHitEnemy).toHaveLength(0);
    });
  });

  describe("tear vs wall", () => {
    it("destroys a tear that is inside a wall tile", () => {
      const sys = makeSystem();
      const room = makeRoom();
      // Top-left corner of the room is always a wall tile.
      const tear = new Tear(TILE_SIZE / 2, TILE_SIZE / 2, 1, 0, 3.5, "player1");
      sys.check([new Player(400, 300)], [], [tear], [], room);
      expect(tear.alive).toBe(false);
    });

    it("does not destroy a tear on a floor tile", () => {
      const sys = makeSystem();
      const room = makeRoom();
      // Center of the room is floor.
      const tear = new Tear(5 * TILE_SIZE, 5 * TILE_SIZE, 1, 0, 3.5, "player1");
      sys.check([new Player(400, 300)], [], [tear], [], room);
      expect(tear.alive).toBe(true);
    });
  });

  describe("player vs enemy", () => {
    it("detects player overlapping enemy", () => {
      const sys = makeSystem();
      const room = makeRoom();
      const player = new Player(100, 100);
      const enemy = new Pebble(100, 100);
      const result = sys.check([player], [enemy], [], [], room);
      expect(result.playerHitEnemy).toHaveLength(1);
    });

    it("skips dead players", () => {
      const sys = makeSystem();
      const room = makeRoom();
      const player = new Player(100, 100);
      player.destroy();
      const enemy = new Pebble(100, 100);
      const result = sys.check([player], [enemy], [], [], room);
      expect(result.playerHitEnemy).toHaveLength(0);
    });
  });

  describe("player vs item", () => {
    it("detects player overlapping item", () => {
      const sys = makeSystem();
      const room = makeRoom();
      const player = new Player(100, 100);
      const item = new Item(100, 100, "Coin", { type: "addCoin", amount: 1 });
      const result = sys.check([player], [], [], [item], room);
      expect(result.playerPickedUpItem).toHaveLength(1);
    });

    it("skips dead items", () => {
      const sys = makeSystem();
      const room = makeRoom();
      const player = new Player(100, 100);
      const item = new Item(100, 100, "Coin", { type: "addCoin", amount: 1 });
      item.destroy();
      const result = sys.check([player], [], [], [item], room);
      expect(result.playerPickedUpItem).toHaveLength(0);
    });
  });

  describe("player at door", () => {
    it("detects player at a north door tile", () => {
      const sys = makeSystem();
      const room = makeRoom();
      room.addDoor("north");
      const midCol = Math.floor(room.widthTiles / 2);
      // Place player center at the door tile.
      const player = new Player(
        midCol * TILE_SIZE,
        0 * TILE_SIZE
      );
      const result = sys.check([player], [], [], [], room);
      expect(result.playerAtDoor.some(e => e.direction === "north")).toBe(true);
    });

    it("does not report a door that does not exist", () => {
      const sys = makeSystem();
      const room = makeRoom(); // no doors added
      const midCol = Math.floor(room.widthTiles / 2);
      const player = new Player(midCol * TILE_SIZE, 0);
      const result = sys.check([player], [], [], [], room);
      expect(result.playerAtDoor).toHaveLength(0);
    });

    it("detects player at a south door", () => {
      const sys = makeSystem();
      const room = makeRoom();
      room.addDoor("south");
      const midCol = Math.floor(room.widthTiles / 2);
      const lastRow = room.heightTiles - 1;
      const player = new Player(midCol * TILE_SIZE, lastRow * TILE_SIZE);
      const result = sys.check([player], [], [], [], room);
      expect(result.playerAtDoor.some(e => e.direction === "south")).toBe(true);
    });

    it("detects player at an east door", () => {
      const sys = makeSystem();
      const room = makeRoom();
      room.addDoor("east");
      const lastCol = room.widthTiles - 1;
      const midRow = Math.floor(room.heightTiles / 2);
      const player = new Player(lastCol * TILE_SIZE, midRow * TILE_SIZE);
      const result = sys.check([player], [], [], [], room);
      expect(result.playerAtDoor.some(e => e.direction === "east")).toBe(true);
    });

    it("detects player at a west door", () => {
      const sys = makeSystem();
      const room = makeRoom();
      room.addDoor("west");
      const midRow = Math.floor(room.heightTiles / 2);
      const player = new Player(0, midRow * TILE_SIZE);
      const result = sys.check([player], [], [], [], room);
      expect(result.playerAtDoor.some(e => e.direction === "west")).toBe(true);
    });
  });
});
