import { createInputController } from "./core/input-controller.js";
import { createPlayerController } from "./core/player-controller.js";
import { createLaneManager } from "./lane/lane-manager.js";
import { createRenderer } from "./visual/renderer.js";

const canvas = document.querySelector("#game-canvas");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("#game-canvas が見つかりません。");
}

const lanes = createLaneManager();
const player = createPlayerController();
const renderer = createRenderer(canvas, lanes);

function resizeGame() {
  renderer.resize();
}

const input = createInputController((action, isActive) => {
  player.handleAction(action, isActive);
});

window.addEventListener("resize", resizeGame);
resizeGame();

let previousTime = performance.now();

function frame(currentTime) {
  const deltaSeconds = Math.min((currentTime - previousTime) / 1000, 0.05);
  previousTime = currentTime;

  player.update(deltaSeconds);
  renderer.render(player.getSnapshot());
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

window.addEventListener("beforeunload", () => {
  input.destroy();
});
