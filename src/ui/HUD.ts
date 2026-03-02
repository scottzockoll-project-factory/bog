import type { Player } from "@/entities/Player";
import type { Floor } from "@/game/Floor";

/** Pixel dimensions for a single heart icon. */
const HEART_SIZE = 20;
const HEART_GAP = 4;
const HUD_PADDING = 12;

/**
 * Draws the in-game heads-up display onto the canvas.
 *
 * The HUD renders in screen space (no camera offset).
 * It reads state from Player and Floor but never modifies them.
 */
export class HUD {
  /**
   * Draws the full HUD for the given player and floor.
   *
   * @param ctx    - The canvas rendering context.
   * @param player - The local player whose stats to display.
   * @param floor  - The current floor, used for the minimap.
   */
  draw(ctx: CanvasRenderingContext2D, player: Player, floor: Floor): void {
    this.drawHearts(ctx, player);
    this.drawCoinCount(ctx, player);
    this.drawKeyCount(ctx, player);
    this.drawMinimap(ctx, floor, player);
  }

  private drawHearts(ctx: CanvasRenderingContext2D, player: Player): void {
    const totalContainers = Math.ceil(player.maxHealth / 2);
    const filledHalves = player.health;

    for (let i = 0; i < totalContainers; i++) {
      const x = HUD_PADDING + i * (HEART_SIZE + HEART_GAP);
      const y = HUD_PADDING;

      const filled = filledHalves - i * 2;
      this.drawHeartIcon(ctx, x, y, filled);
    }
  }

  /**
   * Draws a single heart icon.
   * filled = 2 → full heart, 1 → half heart, 0 → empty container.
   */
  private drawHeartIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    filled: number
  ): void {
    // Empty container (dark outline).
    ctx.fillStyle = "#444";
    ctx.fillRect(x, y, HEART_SIZE, HEART_SIZE);

    if (filled >= 2) {
      // Full heart.
      ctx.fillStyle = "#e84393";
      ctx.fillRect(x, y, HEART_SIZE, HEART_SIZE);
    } else if (filled === 1) {
      // Half heart — fill the left side only.
      ctx.fillStyle = "#e84393";
      ctx.fillRect(x, y, HEART_SIZE / 2, HEART_SIZE);
    }

    // Border.
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, HEART_SIZE, HEART_SIZE);
  }

  private drawCoinCount(ctx: CanvasRenderingContext2D, player: Player): void {
    const y = HUD_PADDING + HEART_SIZE + 10;

    ctx.fillStyle = "#f9ca24";
    ctx.fillRect(HUD_PADDING, y, 14, 14);

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`x${player.coins}`, HUD_PADDING + 18, y);
  }

  private drawKeyCount(ctx: CanvasRenderingContext2D, player: Player): void {
    const y = HUD_PADDING + HEART_SIZE + 30;

    ctx.fillStyle = "#badc58";
    ctx.fillRect(HUD_PADDING, y, 14, 14);

    ctx.fillStyle = "#ffffff";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`x${player.keys}`, HUD_PADDING + 18, y);
  }

  private drawMinimap(
    ctx: CanvasRenderingContext2D,
    floor: Floor,
    _player: Player
  ): void {
    const cellSize = 10;
    const gap = 2;
    const mapCols = floor.widthRooms;
    const mapRows = floor.heightRooms;
    const mapPixelWidth  = mapCols * (cellSize + gap);
    const mapPixelHeight = mapRows * (cellSize + gap);

    const canvas = ctx.canvas;
    const originX = canvas.width  - mapPixelWidth  - HUD_PADDING;
    const originY = canvas.height - mapPixelHeight - HUD_PADDING;

    for (let row = 0; row < mapRows; row++) {
      for (let col = 0; col < mapCols; col++) {
        const room = floor.getRoomAt(col, row);
        if (!room) continue;

        const x = originX + col * (cellSize + gap);
        const y = originY + row * (cellSize + gap);

        const isCurrentRoom =
          floor.currentCol === col && floor.currentRow === row;

        if (isCurrentRoom) {
          ctx.fillStyle = "#f7d6e0"; // pink = current room
        } else if (room.room.cleared) {
          ctx.fillStyle = "#b5ead7"; // green = cleared
        } else if (room.room.visited) {
          ctx.fillStyle = "#636e72"; // gray = visited but not cleared
        } else {
          continue; // don't show unvisited rooms
        }

        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    // Player dot in current room cell.
    const dotX = originX + floor.currentCol * (cellSize + gap) + cellSize / 2;
    const dotY = originY + floor.currentRow * (cellSize + gap) + cellSize / 2;
    ctx.fillStyle = "#e84393";
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

