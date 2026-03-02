import { describe, it, expect } from "vitest";
import { Player } from "@/entities/Player";
import { EMPTY_INPUT } from "@/entities/InputState";
import { PLAYER_MAX_HEALTH, PLAYER_FIRE_DELAY_MS } from "@/constants";

const BOUNDS = { left: 0, top: 0, right: 800, bottom: 600 };
const bound = (p: Player) => p.update(EMPTY_INPUT, 16, BOUNDS.left, BOUNDS.top, BOUNDS.right, BOUNDS.bottom);

describe("Player", () => {
  it("initializes with correct defaults", () => {
    const p = new Player(100, 100);
    expect(p.health).toBe(PLAYER_MAX_HEALTH);
    expect(p.maxHealth).toBe(PLAYER_MAX_HEALTH);
    expect(p.coins).toBe(0);
    expect(p.keys).toBe(0);
    expect(p.alive).toBe(true);
    expect(p.id).toBe("player1");
  });

  it("accepts a custom id", () => {
    expect(new Player(0, 0, "player2").id).toBe("player2");
  });

  it("moves right when moveX=1", () => {
    const p = new Player(100, 100);
    const before = p.x;
    p.update({ moveX: 1, moveY: 0, shootX: 0, shootY: 0 }, 16, 0, 0, 800, 600);
    expect(p.x).toBeGreaterThan(before);
  });

  it("moves left when moveX=-1", () => {
    const p = new Player(100, 100);
    const before = p.x;
    p.update({ moveX: -1, moveY: 0, shootX: 0, shootY: 0 }, 16, 0, 0, 800, 600);
    expect(p.x).toBeLessThan(before);
  });

  it("clamps to room bounds", () => {
    const p = new Player(0, 0);
    p.update({ moveX: -1, moveY: -1, shootX: 0, shootY: 0 }, 16, 50, 50, 200, 200);
    expect(p.x).toBe(50);
    expect(p.y).toBe(50);
  });

  it("does not move when input is zero", () => {
    const p = new Player(100, 100);
    const before = { x: p.x, y: p.y };
    bound(p);
    expect(p.x).toBe(before.x);
    expect(p.y).toBe(before.y);
  });

  it("fires a tear when shoot keys are pressed and cooldown has expired", () => {
    const p = new Player(100, 100);
    const tears = p.update({ moveX: 0, moveY: 0, shootX: 1, shootY: 0 }, 16, 0, 0, 800, 600);
    expect(tears).toHaveLength(1);
    expect(tears[0].ownerId).toBe("player1");
  });

  it("respects the fire delay cooldown", () => {
    const p = new Player(100, 100);
    // First shot fires immediately.
    p.update({ moveX: 0, moveY: 0, shootX: 1, shootY: 0 }, 16, 0, 0, 800, 600);
    // Second call before delay expires should produce no tears.
    const tears = p.update({ moveX: 0, moveY: 0, shootX: 1, shootY: 0 }, 16, 0, 0, 800, 600);
    expect(tears).toHaveLength(0);
  });

  it("fires again after the delay expires", () => {
    const p = new Player(100, 100);
    p.update({ moveX: 0, moveY: 0, shootX: 1, shootY: 0 }, 16, 0, 0, 800, 600);
    const tears = p.update({ moveX: 0, moveY: 0, shootX: 1, shootY: 0 }, PLAYER_FIRE_DELAY_MS, 0, 0, 800, 600);
    expect(tears).toHaveLength(1);
  });

  it("takeDamage reduces health", () => {
    const p = new Player(0, 0);
    p.takeDamage(2);
    expect(p.health).toBe(PLAYER_MAX_HEALTH - 2);
  });

  it("takeDamage destroys the player at 0 health", () => {
    const p = new Player(0, 0);
    p.takeDamage(PLAYER_MAX_HEALTH);
    expect(p.alive).toBe(false);
  });

  it("takeDamage does not go below 0", () => {
    const p = new Player(0, 0);
    p.takeDamage(999);
    expect(p.health).toBe(0);
  });

  it("heal increases health up to maxHealth", () => {
    const p = new Player(0, 0);
    p.takeDamage(4);
    p.heal(2);
    expect(p.health).toBe(PLAYER_MAX_HEALTH - 2);
    p.heal(999);
    expect(p.health).toBe(PLAYER_MAX_HEALTH);
  });
});
