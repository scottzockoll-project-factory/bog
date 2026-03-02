import { Room } from "@/game/Room";

/** Possible special room roles. Normal rooms have no role. */
export type RoomRole = "normal" | "boss" | "treasure" | "shop" | "start";

/** A room plus its position on the floor grid and its role. */
export interface RoomCell {
  room: Room;
  role: RoomRole;
  col: number;
  row: number;
}

/**
 * A floor is a 2D grid of connected rooms.
 *
 * Generation uses a simple random walk from the center:
 * - Walk N steps, placing rooms.
 * - Wire up door connections between adjacent rooms.
 * - Assign special roles (boss, treasure, shop) to terminal rooms.
 *
 * The floor tracks the player's current room position.
 */
export class Floor {
  readonly widthRooms: number;
  readonly heightRooms: number;
  readonly depth: number;

  /** Grid of room cells; undefined = empty cell. */
  private grid: Array<RoomCell | undefined>;

  currentCol: number;
  currentRow: number;

  private constructor(
    widthRooms: number,
    heightRooms: number,
    depth: number,
    grid: Array<RoomCell | undefined>,
    startCol: number,
    startRow: number
  ) {
    this.widthRooms = widthRooms;
    this.heightRooms = heightRooms;
    this.depth = depth;
    this.grid = grid;
    this.currentCol = startCol;
    this.currentRow = startRow;
  }

  /** Returns the RoomCell at grid position (col, row), or undefined if empty. */
  getRoomAt(col: number, row: number): RoomCell | undefined {
    if (col < 0 || col >= this.widthRooms || row < 0 || row >= this.heightRooms) {
      return undefined;
    }
    return this.grid[row * this.widthRooms + col];
  }

  /** The currently active room. */
  get currentRoom(): Room {
    return this.getRoomAt(this.currentCol, this.currentRow)!.room;
  }

  /**
   * Moves the active room one step in the given direction.
   * Marks the new room as visited.
   */
  enterRoom(direction: "north" | "south" | "east" | "west"): void {
    const offsets = {
      north: { dc: 0,  dr: -1 },
      south: { dc: 0,  dr:  1 },
      east:  { dc: 1,  dr:  0 },
      west:  { dc: -1, dr:  0 },
    };
    const { dc, dr } = offsets[direction];
    this.currentCol += dc;
    this.currentRow += dr;
    this.currentRoom.visited = true;
  }

  /**
   * Generates a new floor using a random walk algorithm.
   *
   * @param depth        - Floor number (1 = first floor). Used for difficulty scaling.
   * @param roomCount    - How many rooms to generate (including start).
   * @param rng          - A random function (defaults to Math.random, injectable for tests).
   */
  static generate(
    depth: number = 1,
    roomCount: number = 8,
    rng: () => number = Math.random
  ): Floor {
    const WIDTH  = 9;
    const HEIGHT = 9;
    const startCol = Math.floor(WIDTH  / 2);
    const startRow = Math.floor(HEIGHT / 2);

    const grid: Array<RoomCell | undefined> = new Array(WIDTH * HEIGHT).fill(undefined);
    const placed: Array<{ col: number; row: number }> = [];

    const place = (col: number, row: number, role: RoomRole) => {
      const room = new Room();
      room.visited = role === "start";
      grid[row * WIDTH + col] = { room, role, col, row };
      placed.push({ col, row });
    };

    place(startCol, startRow, "start");

    const directions = [
      { dc: 0, dr: -1, door: "north" as const, opposite: "south" as const },
      { dc: 0, dr:  1, door: "south" as const, opposite: "north" as const },
      { dc: 1, dr:  0, door: "east"  as const, opposite: "west"  as const },
      { dc:-1, dr:  0, door: "west"  as const, opposite: "east"  as const },
    ];

    let col = startCol;
    let row = startRow;
    let attempts = 0;

    while (placed.length < roomCount && attempts < roomCount * 20) {
      attempts++;
      const dir = directions[Math.floor(rng() * directions.length)];
      const nc = col + dir.dc;
      const nr = row + dir.dr;

      if (nc < 0 || nc >= WIDTH || nr < 0 || nr >= HEIGHT) continue;
      if (grid[nr * WIDTH + nc] !== undefined) continue;

      place(nc, nr, "normal");
      col = nc;
      row = nr;
    }

    // Wire up doors between all adjacent placed rooms.
    for (const { col: c, row: r } of placed) {
      const cell = grid[r * WIDTH + c]!;
      for (const dir of directions) {
        const nc = c + dir.dc;
        const nr = r + dir.dr;
        const neighbor = grid[nr * WIDTH + nc];
        if (neighbor) {
          cell.room.addDoor(dir.door);
        }
      }
    }

    // Assign special roles. Terminal rooms (only one door) are candidates.
    const terminals = placed.filter(({ col: c, row: r }) => {
      const cell = grid[r * WIDTH + c]!;
      return cell.role === "normal" && cell.room.getDoors().size === 1;
    });

    Floor.assignSpecialRoles(terminals, grid, WIDTH, rng);

    return new Floor(WIDTH, HEIGHT, depth, grid, startCol, startRow);
  }

  private static assignSpecialRoles(
    terminals: Array<{ col: number; row: number }>,
    grid: Array<RoomCell | undefined>,
    width: number,
    rng: () => number
  ): void {
    const roles: RoomRole[] = ["boss", "treasure", "shop"];
    const shuffled = [...terminals].sort(() => rng() - 0.5);

    for (let i = 0; i < roles.length && i < shuffled.length; i++) {
      const { col, row } = shuffled[i];
      grid[row * width + col]!.role = roles[i];
    }
  }
}
