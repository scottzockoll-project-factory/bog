import { describe, it, expect, afterEach } from "vitest";
import { AssetLoader } from "@/rendering/AssetLoader";

/** FakeImage that fires onload synchronously (via queueMicrotask). */
class FakeImageLoad {
  onload: ((e: Event) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  set src(_v: string) {
    queueMicrotask(() => {
      if (this.onload) (this as unknown as HTMLImageElement).onload(new Event("load"));
    });
  }
}

/** FakeImage that fires onerror synchronously (via queueMicrotask). */
class FakeImageError {
  onload: ((e: Event) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  set src(_v: string) {
    queueMicrotask(() => {
      if (this.onerror) (this as unknown as HTMLImageElement).onerror(new Event("error"));
    });
  }
}

describe("AssetLoader", () => {
  const OriginalImage = globalThis.Image;
  afterEach(() => {
    globalThis.Image = OriginalImage;
  });

  it("get() returns undefined before any image is loaded", () => {
    const loader = new AssetLoader();
    expect(loader.get("player")).toBeUndefined();
  });

  it("get() returns undefined for an unknown key after preload", async () => {
    globalThis.Image = FakeImageLoad as unknown as typeof Image;
    const loader = new AssetLoader();
    await loader.preload();
    expect(loader.get("not-a-real-sprite")).toBeUndefined();
  });

  it("loadOne() resolves and registers the image on success", async () => {
    globalThis.Image = FakeImageLoad as unknown as typeof Image;
    const loader = new AssetLoader();
    await loader.loadOne("player", "/sprites/player.svg");
    expect(loader.get("player")).toBeDefined();
  });

  it("loadOne() resolves silently on error (no image stored)", async () => {
    globalThis.Image = FakeImageError as unknown as typeof Image;
    const loader = new AssetLoader();
    await loader.loadOne("player", "/sprites/player.svg");
    expect(loader.get("player")).toBeUndefined();
  });

  it("preload() resolves after all images load (or fail)", async () => {
    globalThis.Image = FakeImageLoad as unknown as typeof Image;
    const loader = new AssetLoader();
    await expect(loader.preload()).resolves.toBeUndefined();
    // All SPRITE_KEYS should now be registered.
    for (const key of AssetLoader.SPRITE_KEYS) {
      expect(loader.get(key)).toBeDefined();
    }
  });

  it("preload() resolves even when all images error", async () => {
    globalThis.Image = FakeImageError as unknown as typeof Image;
    const loader = new AssetLoader();
    await expect(loader.preload()).resolves.toBeUndefined();
    // No images should have been stored.
    for (const key of AssetLoader.SPRITE_KEYS) {
      expect(loader.get(key)).toBeUndefined();
    }
  });

  it("SPRITE_KEYS includes expected keys", () => {
    expect(AssetLoader.SPRITE_KEYS).toContain("player");
    expect(AssetLoader.SPRITE_KEYS).toContain("enemy");
    expect(AssetLoader.SPRITE_KEYS).toContain("boss");
    expect(AssetLoader.SPRITE_KEYS).toContain("wall");
    expect(AssetLoader.SPRITE_KEYS).toContain("floor");
    expect(AssetLoader.SPRITE_KEYS).toContain("door");
  });
});
