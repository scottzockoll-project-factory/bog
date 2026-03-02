import { describe, it, expect } from "vitest";
import { Room } from "@/game/Room";
import { ROOM_WIDTH_TILES, ROOM_HEIGHT_TILES, TILE_SIZE } from "@/constants";

describe("Room", () => {
  it("defaults to the standard tile dimensions", () => {
    const r = new Room();
    expect(r.widthTiles).toBe(ROOM_WIDTH_TILES);
    expect(r.heightTiles).toBe(ROOM_HEIGHT_TILES);
  });

  it("accepts custom dimensions", () => {
    const r = new Room(10, 8);
    expect(r.widthTiles).toBe(10);
    expect(r.heightTiles).toBe(8);
  });

  it("border tiles are walls", () => {
    const r = new Room(5, 5);
    expect(r.getTile(0, 0)).toBe("wall");
    expect(r.getTile(4, 4)).toBe("wall");
    expect(r.getTile(2, 0)).toBe("wall");
    expect(r.getTile(0, 2)).toBe("wall");
  });

  it("interior tiles are floor", () => {
    const r = new Room(5, 5);
    expect(r.getTile(1, 1)).toBe("floor");
    expect(r.getTile(2, 2)).toBe("floor");
  });

  it("out-of-bounds getTile returns void", () => {
    const r = new Room(5, 5);
    expect(r.getTile(-1, 0)).toBe("void");
    expect(r.getTile(99, 0)).toBe("void");
  });

  it("setTile changes a tile", () => {
    const r = new Room(5, 5);
    r.setTile(2, 2, "wall");
    expect(r.getTile(2, 2)).toBe("wall");
  });

  it("setTile ignores out-of-bounds", () => {
    const r = new Room(5, 5);
    expect(() => r.setTile(-1, -1, "wall")).not.toThrow();
  });

  it("addDoor and hasDoor work correctly", () => {
    const r = new Room();
    expect(r.hasDoor("north")).toBe(false);
    r.addDoor("north");
    expect(r.hasDoor("north")).toBe(true);
  });

  it("getDoors returns the full set", () => {
    const r = new Room();
    r.addDoor("north");
    r.addDoor("east");
    expect(r.getDoors().size).toBe(2);
  });

  it("pixelWidth and pixelHeight are correct", () => {
    const r = new Room(10, 8);
    expect(r.pixelWidth).toBe(10 * TILE_SIZE);
    expect(r.pixelHeight).toBe(8 * TILE_SIZE);
  });

  it("starts not cleared and not visited", () => {
    const r = new Room();
    expect(r.cleared).toBe(false);
    expect(r.visited).toBe(false);
  });

  it("clear() sets cleared=true", () => {
    const r = new Room();
    r.clear();
    expect(r.cleared).toBe(true);
  });
});
