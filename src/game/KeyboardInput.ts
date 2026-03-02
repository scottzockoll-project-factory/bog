import { readInputState } from "@/entities/InputState";
import type { InputState } from "@/entities/InputState";

/**
 * Tracks which keys are currently held down.
 * Attach it once to window and call snapshot() each frame.
 */
export class KeyboardInput {
  private heldKeys: Set<string> = new Set();

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  /** Returns the current input state as a plain snapshot. */
  snapshot(): InputState {
    return readInputState(this.heldKeys);
  }

  /** Detaches event listeners. Call this when done with this input manager. */
  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.heldKeys.add(e.key);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.key);
  };
}
