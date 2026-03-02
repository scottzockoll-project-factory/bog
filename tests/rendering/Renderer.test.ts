import { describe, it, expect, vi } from "vitest";
import { Renderer } from "@/rendering/Renderer";
import { Camera } from "@/rendering/Camera";
import { AssetLoader } from "@/rendering/AssetLoader";
import { Room } from "@/game/Room";
import { Player } from "@/entities/Player";
import { Pebble } from "@/entities/Pebble";

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
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("Renderer", () => {
  it("clear fills the canvas", () => {
    const ctx = makeCtx();
    const renderer = new Renderer(ctx, new Camera());
    renderer.clear();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("clear accepts a custom color", () => {
    const ctx = makeCtx();
    const renderer = new Renderer(ctx, new Camera());
    renderer.clear("#ff0000");
    expect(ctx.fillStyle).toBe("#ff0000");
  });

  it("drawRoom calls fillRect for visible tiles", () => {
    const ctx = makeCtx();
    const renderer = new Renderer(ctx, new Camera(960, 540));
    const room = new Room(5, 5);
    renderer.drawRoom(room);
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("drawEntity draws a living entity", () => {
    const ctx = makeCtx();
    const renderer = new Renderer(ctx, new Camera());
    const enemy = new Pebble(50, 50);
    renderer.drawEntity(enemy, "enemy");
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("drawEntity skips dead entities", () => {
    const ctx = makeCtx();
    const renderer = new Renderer(ctx, new Camera());
    const enemy = new Pebble(50, 50);
    enemy.destroy();
    renderer.drawEntity(enemy, "enemy");
    // fillRect will have been called by clear, but not for the entity.
    // We check fillText was NOT called (placeholder draws both).
    // Reset mocks and test in isolation.
    (ctx.fillRect as ReturnType<typeof vi.fn>).mockClear();
    (ctx.fillText as ReturnType<typeof vi.fn>).mockClear();
    renderer.drawEntity(enemy, "enemy");
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it("drawPlayer draws a living player with health bar", () => {
    const ctx = makeCtx();
    const renderer = new Renderer(ctx, new Camera());
    const player = new Player(100, 100);
    renderer.drawPlayer(player);
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it("drawScreenText renders centered text", () => {
    const ctx = makeCtx();
    const renderer = new Renderer(ctx, new Camera());
    renderer.drawScreenText("Room Clear!", 200);
    expect(ctx.fillText).toHaveBeenCalledWith("Room Clear!", expect.any(Number), 200);
  });

  it("drawScreenText accepts custom color and size", () => {
    const ctx = makeCtx();
    const renderer = new Renderer(ctx, new Camera());
    renderer.drawScreenText("Hello", 100, "#f00", 32);
    expect(ctx.fillStyle).toBe("#f00");
  });

  it("drawRoom skips tiles that are off-screen", () => {
    const ctx = makeCtx();
    // A tiny camera viewport (1x1) offset far away so all tiles are off-screen.
    const camera = new Camera(1, 1);
    camera.follow(99999, 99999, 200000, 200000);
    const renderer = new Renderer(ctx, camera);
    const room = new Room(5, 5);
    (ctx.fillRect as ReturnType<typeof vi.fn>).mockClear();
    renderer.drawRoom(room);
    // No tile fillRect calls — all skipped by isVisible culling.
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("drawEntity skips off-screen entities", () => {
    const ctx = makeCtx();
    const camera = new Camera(1, 1);
    camera.follow(99999, 99999, 200000, 200000);
    const renderer = new Renderer(ctx, camera);
    const enemy = new Pebble(50, 50); // on-screen in world, but off camera
    (ctx.fillText as ReturnType<typeof vi.fn>).mockClear();
    renderer.drawEntity(enemy, "enemy");
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it("exposes the camera", () => {
    const camera = new Camera();
    const ctx = makeCtx();
    const renderer = new Renderer(ctx, camera);
    expect(renderer.camera).toBe(camera);
  });

  it("drawEntity uses drawImage when AssetLoader has the image", () => {
    const ctx = makeCtx();
    const assets = new AssetLoader();
    // Manually plant a fake image for "enemy".
    const fakeImg = {} as HTMLImageElement;
    (assets as unknown as { images: Map<string, HTMLImageElement> }).images.set("enemy", fakeImg);
    const renderer = new Renderer(ctx, new Camera(), assets);
    const enemy = new Pebble(50, 50);
    renderer.drawEntity(enemy, "enemy");
    expect(ctx.drawImage).toHaveBeenCalledWith(fakeImg, expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number));
  });

  it("drawRoom uses drawImage when AssetLoader has the tile image", () => {
    const ctx = makeCtx();
    const assets = new AssetLoader();
    const fakeImg = {} as HTMLImageElement;
    // Plant images for all tile types so we cover the drawImage path.
    (assets as unknown as { images: Map<string, HTMLImageElement> }).images.set("floor", fakeImg);
    (assets as unknown as { images: Map<string, HTMLImageElement> }).images.set("wall", fakeImg);
    const renderer = new Renderer(ctx, new Camera(960, 540), assets);
    const room = new Room(5, 5);
    (ctx.drawImage as ReturnType<typeof vi.fn>).mockClear();
    renderer.drawRoom(room);
    expect(ctx.drawImage).toHaveBeenCalled();
  });
});
