import { ROOM_WIDTH_TILES, ROOM_HEIGHT_TILES, TILE_SIZE } from "@/constants";

/** The four directions a door can face. */
export type Direction = "north" | "south" | "east" | "west";

/** Valid tile type names — must match PLACEHOLDER_COLORS keys. */
export type TileType = "wall" | "floor" | "void";

/**
 * A single room in the dungeon.
 *
 * Rooms are a grid of tiles. They have up to four doors (N/S/E/W).
 * Doors lock when the room is entered and enemies are present.
 * The room is "cleared" when all enemies are dead.
 */
export class Room {
  readonly widthTiles: number;
  readonly heightTiles: number;

  /** Flat tile array, row-major: index = row * widthTiles + col */
  private tiles: TileType[];

  /** Which directions have an open door slot. */
  private doors: Set<Direction>;

  /** Whether every enemy in this room has been defeated. */
  cleared: boolean;

  /** Whether the player has visited this room (for the minimap). */
  visited: boolean;

  constructor(
    widthTiles: number = ROOM_WIDTH_TILES,
    heightTiles: number = ROOM_HEIGHT_TILES
  ) {
    this.widthTiles = widthTiles;
    this.heightTiles = heightTiles;
    this.cleared = false;
    this.visited = false;
    this.doors = new Set();
    this.tiles = this.buildDefaultTiles();
  }

  /** Returns the tile type at grid position (col, row). */
  getTile(col: number, row: number): TileType {
    if (col < 0 || col >= this.widthTiles || row < 0 || row >= this.heightTiles) {
      return "void";
    }
    return this.tiles[row * this.widthTiles + col];
  }

  /** Sets the tile type at grid position (col, row). */
  setTile(col: number, row: number, type: TileType): void {
    if (col < 0 || col >= this.widthTiles || row < 0 || row >= this.heightTiles) return;
    this.tiles[row * this.widthTiles + col] = type;
  }

  /** Adds a door in the given direction. */
  addDoor(direction: Direction): void {
    this.doors.add(direction);
  }

  /** Returns true if this room has a door in the given direction. */
  hasDoor(direction: Direction): boolean {
    return this.doors.has(direction);
  }

  /** Returns the set of all directions that have doors. */
  getDoors(): ReadonlySet<Direction> {
    return this.doors;
  }

  /** The pixel width of this room. */
  get pixelWidth(): number {
    return this.widthTiles * TILE_SIZE;
  }

  /** The pixel height of this room. */
  get pixelHeight(): number {
    return this.heightTiles * TILE_SIZE;
  }

  /**
   * Marks the room as cleared and unlocks its doors.
   * Called by GameScene when the last enemy dies.
   */
  clear(): void {
    this.cleared = true;
  }

  /**
   * Builds the default tile layout: floor everywhere, walls on the border.
   */
  private buildDefaultTiles(): TileType[] {
    const tiles: TileType[] = [];

    for (let row = 0; row < this.heightTiles; row++) {
      for (let col = 0; col < this.widthTiles; col++) {
        const isEdge =
          row === 0 ||
          row === this.heightTiles - 1 ||
          col === 0 ||
          col === this.widthTiles - 1;
        tiles.push(isEdge ? "wall" : "floor");
      }
    }

    return tiles;
  }
}
