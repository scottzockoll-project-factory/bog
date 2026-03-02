import type { Game } from "@/game/Game";
import { Scene } from "@/scenes/Scene";
import { GameScene } from "@/scenes/GameScene";
import { MultiplayerSystem } from "@/systems/MultiplayerSystem";
import type { SessionRole } from "@/systems/MultiplayerSystem";
import { createWSClient } from "@/lib/ws";

type LobbyMode = "menu" | "enterCode";

const MENU_OPTIONS = ["Solo Play", "Host Game", "Join Game", "Spectate"] as const;
type MenuOption = (typeof MENU_OPTIONS)[number];

/**
 * The multiplayer lobby scene.
 *
 * Lets the player choose how to play: solo, as a host, as a joining client,
 * or as a spectator. Host/join/spectate modes establish a WebSocket session.
 *
 * Navigation: ↑/↓ (or W/S) to move, Enter to confirm.
 * For join/spectate, a code-entry sub-screen is shown first.
 */
export class LobbyScene extends Scene {
  private ctx: CanvasRenderingContext2D;
  private mode: LobbyMode = "menu";
  private selectedIndex: number = 0;
  private code: string = "";
  private pendingRole: "client" | "spectator" = "client";

  constructor(game: Game, ctx: CanvasRenderingContext2D) {
    super(game);
    this.ctx = ctx;
    window.addEventListener("keydown", this.onKeyDown);
  }

  update(_deltaMs: number): void {
    // Input-driven — nothing to compute each frame.
  }

  render(_ctx: CanvasRenderingContext2D): void {
    const { width, height } = this.game;

    this.ctx.fillStyle = "#1a1a2e";
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    this.ctx.fillStyle = "#f7d6e0";
    this.ctx.font = "bold 48px monospace";
    this.ctx.fillText("Binding of Goofe", width / 2, height / 4);

    if (this.mode === "menu") {
      this.renderMenu();
    } else {
      this.renderCodeInput();
    }
  }

  override destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  /** Returns the current session code entered by the user (used in tests). */
  get enteredCode(): string {
    return this.code;
  }

  private renderMenu(): void {
    const { width, height } = this.game;
    const startY = height / 2 - 60;
    const spacing = 50;

    for (let i = 0; i < MENU_OPTIONS.length; i++) {
      const y = startY + i * spacing;
      const isSelected = i === this.selectedIndex;
      this.ctx.fillStyle = isSelected ? "#b5ead7" : "#888";
      this.ctx.font = `${isSelected ? "bold " : ""}24px monospace`;
      this.ctx.fillText(
        isSelected ? `>  ${MENU_OPTIONS[i]}` : MENU_OPTIONS[i],
        width / 2,
        y
      );
    }

    this.ctx.fillStyle = "#555";
    this.ctx.font = "16px monospace";
    this.ctx.fillText("Up/Down to select, Enter to confirm", width / 2, height - 60);
  }

  private renderCodeInput(): void {
    const { width, height } = this.game;
    const label = this.pendingRole === "spectator" ? "Spectate session:" : "Join session:";

    this.ctx.fillStyle = "#b5ead7";
    this.ctx.font = "24px monospace";
    this.ctx.fillText(label, width / 2, height / 2 - 40);

    this.ctx.fillStyle = "#f7d6e0";
    this.ctx.font = "bold 36px monospace";
    this.ctx.fillText(this.code || "_", width / 2, height / 2 + 10);

    this.ctx.fillStyle = "#555";
    this.ctx.font = "16px monospace";
    this.ctx.fillText("Type session code, Enter to join, Esc to cancel", width / 2, height / 2 + 70);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.mode === "menu") {
      this.handleMenuKey(e.key);
    } else {
      this.handleCodeKey(e.key);
    }
  };

  private handleMenuKey(key: string): void {
    if (key === "ArrowUp" || key === "w") {
      this.selectedIndex = (this.selectedIndex - 1 + MENU_OPTIONS.length) % MENU_OPTIONS.length;
    } else if (key === "ArrowDown" || key === "s") {
      this.selectedIndex = (this.selectedIndex + 1) % MENU_OPTIONS.length;
    } else if (key === "Enter" || key === " ") {
      this.confirmMenuSelection();
    }
  }

  private confirmMenuSelection(): void {
    const option: MenuOption = MENU_OPTIONS[this.selectedIndex];
    switch (option) {
      case "Solo Play":
        this.startSolo();
        break;
      case "Host Game":
        this.startHost();
        break;
      case "Join Game":
        this.pendingRole = "client";
        this.code = "";
        this.mode = "enterCode";
        break;
      case "Spectate":
        this.pendingRole = "spectator";
        this.code = "";
        this.mode = "enterCode";
        break;
    }
  }

  private handleCodeKey(key: string): void {
    if (key === "Escape") {
      this.mode = "menu";
      this.code = "";
    } else if (key === "Enter" && this.code.length > 0) {
      this.startWithCode(this.pendingRole, this.code.toUpperCase());
    } else if (key === "Backspace") {
      this.code = this.code.slice(0, -1);
    } else if (key.length === 1 && this.code.length < 6) {
      this.code += key.toUpperCase();
    }
  }

  private startSolo(): void {
    this.game.transitionTo(new GameScene(this.game, this.ctx, null));
  }

  private startHost(): void {
    const sessionCode = this.generateCode();
    const ws = createWSClient(sessionCode);
    const mp = new MultiplayerSystem(ws, "host", "player1", sessionCode);
    this.game.transitionTo(new GameScene(this.game, this.ctx, mp));
  }

  private startWithCode(role: "client" | "spectator", code: string): void {
    const localId: string = role === "spectator"
      ? ""
      : `player-${Math.random().toString(36).slice(2, 8)}`;
    const ws = createWSClient(code);
    const mp = new MultiplayerSystem(ws, role as SessionRole, localId, code);
    this.game.transitionTo(new GameScene(this.game, this.ctx, mp));
  }

  /**
   * Generates a random 4-character uppercase alphanumeric session code.
   * Characters that are easy to read and type are chosen (no 0/O, 1/I/L).
   */
  generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}
