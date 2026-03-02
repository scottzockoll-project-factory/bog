import { TILE_SIZE } from "@/constants";
import { Camera } from "@/rendering/Camera";
import { AssetLoader } from "@/rendering/AssetLoader";
import { drawPlaceholder } from "@/rendering/SpriteSheet";
import type { Entity } from "@/entities/Entity";
import type { Room } from "@/game/Room";
import type { Player } from "@/entities/Player";

/**
 * The only class that writes to the canvas.
 * Everything else in the game is pure logic — this class translates
 * that logic into pixels.
 *
 * When an AssetLoader is provided and has a loaded image for a given type,
 * drawImage is used. Otherwise drawPlaceholder is the fallback.
 *
 * Draw order each frame:
 *   1. Room tiles (floor, walls)
 *   2. Items and doors
 *   3. Enemies and tears
 *   4. Player(s)
 *   5. HUD (drawn without camera offset — always in screen space)
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  readonly camera: Camera;
  private assets: AssetLoader | null;

  constructor(ctx: CanvasRenderingContext2D, camera: Camera, assets: AssetLoader | null = null) {
    this.ctx = ctx;
    this.camera = camera;
    this.assets = assets;
  }

  /** Clears the entire canvas to a solid background color. */
  clear(color: string = "#1a1a2e"): void {
    const canvas = this.ctx.canvas;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /** Draws all tiles in the room. */
  drawRoom(room: Room): void {
    for (let row = 0; row < room.heightTiles; row++) {
      for (let col = 0; col < room.widthTiles; col++) {
        const tile = room.getTile(col, row);
        const screenX = this.camera.toScreenX(col * TILE_SIZE);
        const screenY = this.camera.toScreenY(row * TILE_SIZE);

        if (!this.camera.isVisible(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE)) {
          continue;
        }

        const img = this.assets?.get(tile);
        if (img) {
          this.ctx.drawImage(img, screenX, screenY, TILE_SIZE, TILE_SIZE);
        } else {
          drawPlaceholder(this.ctx, tile, screenX, screenY, TILE_SIZE);
        }
      }
    }
  }

  /** Draws a single entity, using an SVG image if loaded or a placeholder otherwise. */
  drawEntity(entity: Entity, typeName: string): void {
    if (!entity.alive) return;
    const screenX = this.camera.toScreenX(entity.x);
    const screenY = this.camera.toScreenY(entity.y);

    if (!this.camera.isVisible(entity.x, entity.y, entity.width, entity.height)) {
      return;
    }

    const img = this.assets?.get(typeName);
    if (img) {
      this.ctx.drawImage(img, screenX, screenY, entity.width, entity.height);
    } else {
      drawPlaceholder(this.ctx, typeName, screenX, screenY, entity.width);
    }
  }

  /** Draws a player, including a small health indicator above them. */
  drawPlayer(player: Player): void {
    this.drawEntity(player, "player");

    // Draw a tiny red health bar above the sprite.
    const screenX = this.camera.toScreenX(player.x);
    const screenY = this.camera.toScreenY(player.y);
    const barWidth = player.width;
    const barHeight = 4;
    const healthFraction = player.health / player.maxHealth;

    this.ctx.fillStyle = "#444";
    this.ctx.fillRect(screenX, screenY - 6, barWidth, barHeight);

    this.ctx.fillStyle = "#e84393";
    this.ctx.fillRect(screenX, screenY - 6, barWidth * healthFraction, barHeight);
  }

  /**
   * Draws a centered text message on screen (not in world space).
   * Used for "Room Clear!", "Press E to pick up", etc.
   */
  drawScreenText(text: string, y: number, color: string = "#ffffff", size: number = 20): void {
    const canvas = this.ctx.canvas;
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px monospace`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "alphabetic";
    this.ctx.fillText(text, canvas.width / 2, y);
  }
}
