import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { KeyboardInput } from "@/game/KeyboardInput";

function fireKey(type: "keydown" | "keyup", key: string) {
  window.dispatchEvent(new KeyboardEvent(type, { key }));
}

describe("KeyboardInput", () => {
  let input: KeyboardInput;

  beforeEach(() => {
    input = new KeyboardInput();
  });

  afterEach(() => {
    input.destroy();
  });

  it("returns zero axes when no keys are held", () => {
    expect(input.snapshot()).toEqual({ moveX: 0, moveY: 0, shootX: 0, shootY: 0 });
  });

  it("reports movement when a key is held", () => {
    fireKey("keydown", "d");
    expect(input.snapshot().moveX).toBe(1);
    fireKey("keyup", "d");
  });

  it("clears movement when the key is released", () => {
    fireKey("keydown", "d");
    fireKey("keyup", "d");
    expect(input.snapshot().moveX).toBe(0);
  });

  it("destroy stops listening to key events", () => {
    input.destroy();
    fireKey("keydown", "d");
    expect(input.snapshot().moveX).toBe(0);
  });
});
