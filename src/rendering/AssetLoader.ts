/**
 * Loads sprite images from the public/sprites/ directory and makes them
 * available to the Renderer by type name.
 *
 * The Renderer uses loaded images when available and falls back to
 * drawPlaceholder when an image hasn't loaded yet.
 */
export class AssetLoader {
  private images: Map<string, HTMLImageElement> = new Map();

  /** Sprite type names that have corresponding SVG files. */
  static readonly SPRITE_KEYS = [
    "player", "enemy", "boss", "tear",
    "item", "heart", "coin", "key",
    "wall", "floor", "door",
  ] as const;

  /**
   * Returns a loaded image for the given type name, or undefined if not loaded.
   */
  get(typeName: string): HTMLImageElement | undefined {
    return this.images.get(typeName);
  }

  /**
   * Preloads all known sprites from /sprites/<name>.svg.
   * Resolves once all images have either loaded or errored.
   * Images that fail to load are silently skipped (placeholder will be used).
   */
  preload(): Promise<void> {
    const promises = AssetLoader.SPRITE_KEYS.map((key) =>
      this.loadOne(key, `/sprites/${key}.svg`)
    );
    return Promise.allSettled(promises).then(() => undefined);
  }

  /**
   * Loads a single image and registers it under the given key.
   */
  loadOne(key: string, src: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(key, img);
        resolve();
      };
      img.onerror = () => resolve(); // fail silently — placeholder will be used
      img.src = src;
    });
  }
}
