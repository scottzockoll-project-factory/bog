import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/constants";
import { Game } from "@/game/Game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Could not get 2D rendering context");

const game = new Game(canvas, ctx);
game.start();
