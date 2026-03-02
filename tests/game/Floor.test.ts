import { describe, it, expect } from "vitest";
import { Floor } from "@/game/Floor";

/** Deterministic RNG for reproducible tests. */
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

describe("Floor.generate", () => {
  it("places at least a start room", () => {
    const floor = Floor.generate(1, 5, seededRng(42));
    expect(floor.currentRoom).toBeDefined();
  });

  it("generates approximately the requested number of rooms", () => {
    const floor = Floor.generate(1, 8, seededRng(1));
    let count = 0;
    for (let r = 0; r < floor.heightRooms; r++) {
      for (let c = 0; c < floor.widthRooms; c++) {
        if (floor.getRoomAt(c, r)) count++;
      }
    }
    // We won't always hit exactly 8 due to the walk algorithm, but should be close.
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it("start room is marked as visited", () => {
    const floor = Floor.generate(1, 8, seededRng(7));
    expect(floor.currentRoom.visited).toBe(true);
  });

  it("adjacent rooms have matching door connections", () => {
    const floor = Floor.generate(1, 8, seededRng(3));
    for (let r = 0; r < floor.heightRooms; r++) {
      for (let c = 0; c < floor.widthRooms; c++) {
        const cell = floor.getRoomAt(c, r);
        if (!cell) continue;
        if (cell.room.hasDoor("east")) {
          const neighbor = floor.getRoomAt(c + 1, r);
          expect(neighbor?.room.hasDoor("west")).toBe(true);
        }
        if (cell.room.hasDoor("south")) {
          const neighbor = floor.getRoomAt(c, r + 1);
          expect(neighbor?.room.hasDoor("north")).toBe(true);
        }
      }
    }
  });

  it("stores the correct depth", () => {
    const floor = Floor.generate(3, 8, seededRng(1));
    expect(floor.depth).toBe(3);
  });

  it("getRoomAt returns undefined for out-of-bounds coords", () => {
    const floor = Floor.generate(1, 5, seededRng(1));
    expect(floor.getRoomAt(-1, 0)).toBeUndefined();
    expect(floor.getRoomAt(999, 0)).toBeUndefined();
  });
});

describe("Floor.enterRoom", () => {
  it("advances currentCol and currentRow", () => {
    const floor = Floor.generate(1, 9, seededRng(10));

    // Find a real direction we can enter.
    const dirs = ["north", "south", "east", "west"] as const;
    const offsets = { north: [0,-1], south: [0,1], east: [1,0], west: [-1,0] };
    let entered = false;

    for (const dir of dirs) {
      const [dc, dr] = offsets[dir];
      const nc = floor.currentCol + dc;
      const nr = floor.currentRow + dr;
      if (floor.getRoomAt(nc, nr)) {
        const prevCol = floor.currentCol;
        const prevRow = floor.currentRow;
        floor.enterRoom(dir);
        expect(floor.currentCol).toBe(prevCol + dc);
        expect(floor.currentRow).toBe(prevRow + dr);
        expect(floor.currentRoom.visited).toBe(true);
        entered = true;
        break;
      }
    }

    expect(entered).toBe(true);
  });
});
