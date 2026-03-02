import { describe, it, expect } from "vitest";
import { Camera } from "@/rendering/Camera";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/constants";

describe("Camera", () => {
  it("initializes at (0, 0)", () => {
    const c = new Camera();
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
  });

  it("follow centers on the target", () => {
    const c = new Camera(100, 100);
    c.follow(200, 200, 1000, 1000);
    expect(c.x).toBe(150); // 200 - 100/2
    expect(c.y).toBe(150);
  });

  it("follow clamps to the left/top boundary", () => {
    const c = new Camera(200, 200);
    c.follow(0, 0, 1000, 1000);
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
  });

  it("follow clamps to the right/bottom boundary", () => {
    const c = new Camera(200, 200);
    c.follow(9999, 9999, 500, 500);
    expect(c.x).toBe(300); // 500 - 200
    expect(c.y).toBe(300);
  });

  it("toScreenX converts world to screen", () => {
    const c = new Camera();
    c.follow(200, 0, 2000, 2000);
    const screenX = c.toScreenX(200);
    expect(screenX).toBe(200 - c.x);
  });

  it("toScreenY converts world to screen", () => {
    const c = new Camera();
    c.follow(0, 200, 2000, 2000);
    expect(c.toScreenY(200)).toBe(200 - c.y);
  });

  it("isVisible returns true for an on-screen entity", () => {
    const c = new Camera(CANVAS_WIDTH, CANVAS_HEIGHT);
    expect(c.isVisible(0, 0, 32, 32)).toBe(true);
  });

  it("isVisible returns false for an off-screen entity", () => {
    const c = new Camera(100, 100);
    c.follow(500, 500, 2000, 2000);
    expect(c.isVisible(0, 0, 10, 10)).toBe(false);
  });

  it("accepts custom view dimensions", () => {
    const c = new Camera(800, 600);
    c.follow(400, 300, 2000, 2000);
    expect(c.x).toBe(0); // 400 - 800/2 = 0
  });
});
