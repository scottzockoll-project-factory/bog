import { describe, it, expect, vi } from "vitest";
import { SpriteSheet, drawPlaceholder, PLACEHOLDER_COLORS } from "@/rendering/SpriteSheet";

/** Minimal mock of CanvasRenderingContext2D for drawing tests. */
function makeCtx() {
  return {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "",
    textBaseline: "",
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("PLACEHOLDER_COLORS", () => {
  it("has a color for player, enemy, tear", () => {
    expect(PLACEHOLDER_COLORS["player"]).toBeDefined();
    expect(PLACEHOLDER_COLORS["enemy"]).toBeDefined();
    expect(PLACEHOLDER_COLORS["tear"]).toBeDefined();
  });
});

describe("drawPlaceholder", () => {
  it("calls fillRect and fillText", () => {
    const ctx = makeCtx();
    drawPlaceholder(ctx, "player", 10, 20, 32);
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it("uses a fallback color for unknown types", () => {
    const ctx = makeCtx();
    expect(() => drawPlaceholder(ctx, "unknown_type", 0, 0, 32)).not.toThrow();
  });
});

describe("SpriteSheet", () => {
  it("draw throws for an unknown frame name", () => {
    const fakeImg = {} as HTMLImageElement;
    const sheet = new SpriteSheet(fakeImg, 32);
    const ctx = makeCtx();
    expect(() => sheet.draw(ctx, "missing", 0, 0)).toThrow(/unknown frame/);
  });

  it("define registers a frame and draw calls drawImage", () => {
    const fakeImg = {} as HTMLImageElement;
    const sheet = new SpriteSheet(fakeImg, 32);
    sheet.define("player", 0, 0);
    const ctx = makeCtx();
    sheet.draw(ctx, "player", 0, 0);
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it("define returns this for chaining", () => {
    const sheet = new SpriteSheet({} as HTMLImageElement, 32);
    expect(sheet.define("a", 0, 0)).toBe(sheet);
  });

  it("SpriteSheet.load resolves when onload fires", async () => {
    const OriginalImage = globalThis.Image;
    class FakeImageLoad {
      set src(_v: string) {
        queueMicrotask(() => { if (this.onload) (this as unknown as HTMLImageElement).onload(new Event("load")); });
      }
      onload: ((e: Event) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
    }
    globalThis.Image = FakeImageLoad as unknown as typeof Image;
    const sheet = await SpriteSheet.load("good.svg", 32);
    expect(sheet).toBeInstanceOf(SpriteSheet);
    globalThis.Image = OriginalImage;
  });

  it("SpriteSheet.load rejects when onerror fires", async () => {
    // jsdom doesn't actually load images, so we stub Image to immediately call onerror.
    const OriginalImage = globalThis.Image;
    class FakeImage {
      set src(_v: string) {
        // Call onerror on the next tick so the assignment completes first.
        queueMicrotask(() => { if (this.onerror) (this as unknown as HTMLImageElement).onerror(new Event("error")); });
      }
      onload: (() => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
    }
    globalThis.Image = FakeImage as unknown as typeof Image;
    await expect(SpriteSheet.load("bad.png", 32)).rejects.toThrow(/failed to load/);
    globalThis.Image = OriginalImage;
  });
});
