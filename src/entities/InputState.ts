/**
 * A snapshot of player input for one frame.
 * Using a plain data object (not raw keyboard events) keeps Player
 * testable and makes it easy to feed remote input in multiplayer.
 */
export interface InputState {
  /** Movement axes. Values are -1, 0, or 1. */
  moveX: number;
  moveY: number;

  /** Shooting direction. Values are -1, 0, or 1. Zero means not shooting. */
  shootX: number;
  shootY: number;
}

/** An InputState with all axes zeroed out. */
export const EMPTY_INPUT: InputState = {
  moveX: 0,
  moveY: 0,
  shootX: 0,
  shootY: 0,
};

/**
 * Reads the current keyboard state and returns an InputState.
 * WASD / arrow keys for movement; IJKL / arrow keys for shooting.
 *
 * This is a factory function, not a class, because it just reads
 * from a held-keys set and produces a plain value.
 */
export function readInputState(heldKeys: ReadonlySet<string>): InputState {
  const moveX =
    (heldKeys.has("ArrowLeft") || heldKeys.has("a") || heldKeys.has("A") ? -1 : 0) +
    (heldKeys.has("ArrowRight") || heldKeys.has("d") || heldKeys.has("D") ? 1 : 0);

  const moveY =
    (heldKeys.has("ArrowUp") || heldKeys.has("w") || heldKeys.has("W") ? -1 : 0) +
    (heldKeys.has("ArrowDown") || heldKeys.has("s") || heldKeys.has("S") ? 1 : 0);

  const shootX =
    (heldKeys.has("j") || heldKeys.has("J") ? -1 : 0) +
    (heldKeys.has("l") || heldKeys.has("L") ? 1 : 0);

  const shootY =
    (heldKeys.has("i") || heldKeys.has("I") ? -1 : 0) +
    (heldKeys.has("k") || heldKeys.has("K") ? 1 : 0);

  return { moveX, moveY, shootX, shootY };
}
