import type { Game } from "@/game/Game";
import { Scene } from "@/scenes/Scene";
import { LobbyScene } from "@/scenes/LobbyScene";

/**
 * The title / main menu scene.
 * Displays the game name and waits for the player to press a key to start.
 */
export class TitleScene extends Scene {
  private pressedStart: boolean = false;
  private ctx: CanvasRenderingContext2D;

  constructor(game: Game, ctx: CanvasRenderingContext2D) {
    super(game);
    this.ctx = ctx;
    window.addEventListener("keydown", this.onKeyDown);
  }

  update(_deltaMs: number): void {
    // Scene transitions happen in the key handler — nothing to do here yet.
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    ctx.fillStyle = "#f7d6e0";
    ctx.font = "bold 64px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Binding of Goofe", this.game.width / 2, this.game.height / 2 - 40);

    ctx.fillStyle = "#b5ead7";
    ctx.font = "24px monospace";
    ctx.fillText(
      this.pressedStart ? "Loading..." : "Press any key to start",
      this.game.width / 2,
      this.game.height / 2 + 40
    );
  }

  override destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private onKeyDown = (): void => {
    if (this.pressedStart) return;
    this.pressedStart = true;
    this.game.transitionTo(new LobbyScene(this.game, this.ctx));
  };
}
