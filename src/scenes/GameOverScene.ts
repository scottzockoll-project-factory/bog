import type { Game } from "@/game/Game";
import { Scene } from "@/scenes/Scene";
import { TitleScene } from "@/scenes/TitleScene";

/** Stats from the run, shown on the game over screen. */
export interface RunStats {
  floorsCleared: number;
  enemiesKilled: number;
  itemsCollected: number;
}

/**
 * Shown when the player dies.
 * Displays run stats and lets the player restart or quit.
 */
export class GameOverScene extends Scene {
  private stats: RunStats;
  private ctx: CanvasRenderingContext2D;
  private selectedOption: number = 0; // 0 = Play Again, 1 = Quit

  constructor(game: Game, ctx: CanvasRenderingContext2D, stats: RunStats) {
    super(game);
    this.ctx = ctx;
    this.stats = stats;
    window.addEventListener("keydown", this.onKeyDown);
  }

  update(_deltaMs: number): void {
    // Input handled in onKeyDown.
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    // Title.
    ctx.fillStyle = "#ff6b6b";
    ctx.font = "bold 56px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("You Died", this.game.width / 2, 120);

    // Stats.
    ctx.fillStyle = "#dfe6e9";
    ctx.font = "22px monospace";
    const lines = [
      `Floors cleared:   ${this.stats.floorsCleared}`,
      `Enemies killed:   ${this.stats.enemiesKilled}`,
      `Items collected:  ${this.stats.itemsCollected}`,
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, this.game.width / 2, 230 + i * 40);
    });

    // Menu options.
    const options = ["Play Again", "Quit"];
    options.forEach((label, i) => {
      ctx.fillStyle = i === this.selectedOption ? "#f7d6e0" : "#636e72";
      ctx.font = i === this.selectedOption ? "bold 28px monospace" : "28px monospace";
      ctx.fillText(label, this.game.width / 2, 380 + i * 50);
    });
  }

  override destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
      this.selectedOption = Math.max(0, this.selectedOption - 1);
    } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
      this.selectedOption = Math.min(1, this.selectedOption + 1);
    } else if (e.key === "Enter" || e.key === " ") {
      this.confirm();
    }
  };

  private confirm(): void {
    if (this.selectedOption === 0) {
      this.game.transitionTo(new TitleScene(this.game, this.ctx));
    } else {
      // "Quit" — just go back to the title screen for now.
      this.game.transitionTo(new TitleScene(this.game, this.ctx));
    }
  }
}
