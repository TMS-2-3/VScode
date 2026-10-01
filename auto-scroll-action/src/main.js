import { createInputController } from "./core/input-controller.js";
import { createPlayerController } from "./core/player-controller.js";
import { createLaneManager } from "./lane/lane-manager.js";
import { createRenderer } from "./visual/renderer.js";

const canvas = document.querySelector("#game-canvas");
const titleScreen = document.querySelector("#title-screen");
const startButton = document.querySelector("#start-button");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("#game-canvas が見つかりません。");
}

if (!(titleScreen instanceof HTMLElement) || !(startButton instanceof HTMLButtonElement)) {
  throw new Error("タイトル画面の要素が見つかりません。");
}

const lanes = createLaneManager();
const player = createPlayerController(lanes);
const renderer = createRenderer(canvas, lanes);
let input = null;
let animationFrameId = null;
let isStarted = false;
let previousTime = performance.now();

function resizeGame() {
  renderer.resize();
  renderer.render(player.getSnapshot());
}

window.addEventListener("resize", resizeGame);
resizeGame();

function startGame() {
  if (isStarted) {
    return;
  }

  isStarted = true;
  titleScreen.hidden = true;
  input = createInputController((action, isActive) => {
    player.handleAction(action, isActive);
  });
  previousTime = performance.now();
  canvas.focus();
  animationFrameId = requestAnimationFrame(frame);
}

function frame(currentTime) {
  const deltaSeconds = Math.min((currentTime - previousTime) / 1000, 0.05);
  previousTime = currentTime;

  player.update(deltaSeconds);
  renderer.render(player.getSnapshot());
  animationFrameId = requestAnimationFrame(frame);
}

startButton.addEventListener("click", startGame);

window.addEventListener("beforeunload", () => {
  input?.destroy();

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});
