/** Canvas dimensions */
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

/** Tile size in pixels */
export const TILE_SIZE = 32;

/** Room dimensions in tiles */
export const ROOM_WIDTH_TILES = 26;
export const ROOM_HEIGHT_TILES = 14;

/** Room dimensions in pixels */
export const ROOM_WIDTH = ROOM_WIDTH_TILES * TILE_SIZE;
export const ROOM_HEIGHT = ROOM_HEIGHT_TILES * TILE_SIZE;

/** Player defaults */
export const PLAYER_SPEED = 3;
export const PLAYER_MAX_HEALTH = 6; // 3 full hearts
export const PLAYER_FIRE_DELAY_MS = 300;

/** Tear (projectile) defaults */
export const TEAR_SPEED = 7;
export const TEAR_DAMAGE = 3.5;
export const TEAR_RANGE = 250; // pixels before disappearing

/** Target frames per second */
export const TARGET_FPS = 60;
export const FRAME_DURATION_MS = 1000 / TARGET_FPS;

/** WebSocket event names */
export const WS_EVENT = {
  PLAYER_INPUT: "player-input",
  GAME_STATE: "game-state",
  ROOM_TRANSITION: "room-transition",
  SPECTATE_JOIN: "spectate-join",
} as const;
