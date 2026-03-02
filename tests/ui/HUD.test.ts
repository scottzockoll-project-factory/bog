import { describe, it, expect, vi } from "vitest";
import { HUD } from "@/ui/HUD";
import { Player } from "@/entities/Player";
import { Floor } from "@/game/Floor";

function seededRng(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

function makeCtx(width = 960, height = 540) {
  const canvas = { width, height } as HTMLCanvasElement;
  return {
    canvas,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "",
    textBaseline: "",
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("HUD", () => {
  it("draw does not throw", () => {
    const hud = new HUD();
    const ctx = makeCtx();
    const player = new Player(0, 0);
    const floor = Floor.generate(1, 8, seededRng(1));
    expect(() => hud.draw(ctx, player, floor)).not.toThrow();
  });

  it("draws heart containers", () => {
    const hud = new HUD();
    const ctx = makeCtx();
    const player = new Player(0, 0);
    const floor = Floor.generate(1, 8, seededRng(1));
    hud.draw(ctx, player, floor);
    // Should call fillRect for each heart container.
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("draws half hearts when player has odd health", () => {
    const hud = new HUD();
    const ctx = makeCtx();
    const player = new Player(0, 0);
    player.takeDamage(1); // now has an odd number of health halves
    const floor = Floor.generate(1, 8, seededRng(1));
    expect(() => hud.draw(ctx, player, floor)).not.toThrow();
  });

  it("draws empty hearts when health is 0", () => {
    const hud = new HUD();
    const ctx = makeCtx();
    const player = new Player(0, 0);
    player.takeDamage(player.maxHealth);
    const floor = Floor.generate(1, 8, seededRng(1));
    expect(() => hud.draw(ctx, player, floor)).not.toThrow();
  });

  it("draws cleared rooms in the minimap", () => {
    const hud = new HUD();
    const ctx = makeCtx();
    const player = new Player(0, 0);
    const floor = Floor.generate(1, 8, seededRng(3));
    // Mark a non-current room as cleared so we hit the cleared branch.
    for (let r = 0; r < floor.heightRooms; r++) {
      for (let c = 0; c < floor.widthRooms; c++) {
        const cell = floor.getRoomAt(c, r);
        if (cell && !(floor.currentCol === c && floor.currentRow === r)) {
          cell.room.cleared = true;
        }
      }
    }
    expect(() => hud.draw(ctx, player, floor)).not.toThrow();
  });

  it("draws visited-but-not-cleared rooms in the minimap", () => {
    const hud = new HUD();
    const ctx = makeCtx();
    const player = new Player(0, 0);
    const floor = Floor.generate(1, 8, seededRng(3));
    // Mark a non-current room as visited (but not cleared).
    for (let r = 0; r < floor.heightRooms; r++) {
      for (let c = 0; c < floor.widthRooms; c++) {
        const cell = floor.getRoomAt(c, r);
        if (cell && !(floor.currentCol === c && floor.currentRow === r)) {
          cell.room.visited = true;
        }
      }
    }
    expect(() => hud.draw(ctx, player, floor)).not.toThrow();
  });
});
