import { createCollisionSystem } from "./core/collision-system.js";
import { createInputController } from "./core/input-controller.js";
import { createPlayerController } from "./core/player-controller.js";
import { createProgression } from "./core/progression.js";
import { createCoinManager } from "./lane/coins.js";
import { createLaneManager } from "./lane/lane-manager.js";
import { createObstacleManager } from "./lane/obstacles.js";
import { createHud } from "./visual/hud.js";
import { createRenderer } from "./visual/renderer.js";

const canvas = document.querySelector("#game-canvas");
const hudRoot = document.querySelector("#game-hud");
const titleScreen = document.querySelector("#title-screen");
const startButton = document.querySelector("#start-button");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("#game-canvas が見つかりません。");
}

if (
  !(hudRoot instanceof HTMLElement) ||
  !(titleScreen instanceof HTMLElement) ||
  !(startButton instanceof HTMLButtonElement)
) {
  throw new Error("タイトル画面の要素が見つかりません。");
}

const lanes = createLaneManager();
const player = createPlayerController(lanes);
const coins = createCoinManager();
const obstacles = createObstacleManager();
const collisions = createCollisionSystem(lanes);
const progression = createProgression();
const hud = createHud(hudRoot);
const renderer = createRenderer(canvas, lanes);
let input = null;
let animationFrameId = null;
let isStarted = false;
let previousTime = performance.now();

function resizeGame() {
  renderer.resize();
  renderer.render(player.getSnapshot(), {
    coins: coins.getSnapshot(),
    obstacles: obstacles.getSnapshot(),
  });
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
  const movement = progression.update(
    deltaSeconds,
    coins.getCollectedCandyValue(),
    lanes.getLaneGap(),
  );
  coins.moveCoins(-movement.frameDistance);
  obstacles.moveObstacles(-movement.frameDistance);
  renderer.setBackgroundOffset(movement.traveledDistance);

  const playerSnapshot = player.getSnapshot();
  let coinSnapshot = coins.getSnapshot();
  const obstacleSnapshot = obstacles.getSnapshot();
  const viewportWidth = canvas.getBoundingClientRect().width;
  const collectedCoinIds = collisions.findCollectedCoinIds(
    playerSnapshot,
    coinSnapshot,
    viewportWidth,
  );
  const hitObstacleIds = collisions.findHitObstacleIds(
    playerSnapshot,
    obstacleSnapshot,
    viewportWidth,
  );

  if (collectedCoinIds.length > 0) {
    collectedCoinIds.forEach((id) => coins.collectCoin(id));
    hud.setCandyCount(coins.getCollectedCandyValue());
    coinSnapshot = coins.getSnapshot();
  }

  renderer.render(playerSnapshot, {
    coins: coinSnapshot,
    obstacles: obstacleSnapshot,
    hitObstacleIds,
  });
  animationFrameId = requestAnimationFrame(frame);
}

startButton.addEventListener("click", startGame);

window.addEventListener("beforeunload", () => {
  input?.destroy();

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});
