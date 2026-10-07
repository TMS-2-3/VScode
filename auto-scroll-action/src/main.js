import { createAudioController } from "./core/audio-controller.js";
import { createCollisionSystem } from "./core/collision-system.js";
import { createGameController } from "./core/game-controller.js";
import { createInputController } from "./core/input-controller.js";
import { createPlayerController } from "./core/player-controller.js";
import { createProgression } from "./core/progression.js";
import { createCoinManager } from "./lane/coins.js";
import { createItemManager } from "./lane/items.js";
import { createLaneManager } from "./lane/lane-manager.js";
import { createObstacleManager } from "./lane/obstacles.js";
import { createObstacleSpawner } from "./lane/spawner.js";
import { COLLECTIBLE_TYPE, PLAYER_ACTION } from "./shared/contracts.js";
import { createHud } from "./visual/hud.js";
import { createRenderer } from "./visual/renderer.js";

const canvas = document.querySelector("#game-canvas");
const hudRoot = document.querySelector("#game-hud");
const titleScreen = document.querySelector("#title-screen");
const startButton = document.querySelector("#start-button");
const gameOverScreen = document.querySelector("#game-over-screen");
const restartButton = document.querySelector("#restart-button");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("#game-canvas が見つかりません。");
}

if (
  !(hudRoot instanceof HTMLElement) ||
  !(titleScreen instanceof HTMLElement) ||
  !(startButton instanceof HTMLButtonElement) ||
  !(gameOverScreen instanceof HTMLElement) ||
  !(restartButton instanceof HTMLButtonElement)
) {
  throw new Error("ゲーム画面のUI要素が見つかりません。");
}

const audio = createAudioController();
const game = createGameController();
const lanes = createLaneManager();
const player = createPlayerController(lanes);
const coins = createCoinManager();
const items = createItemManager();
const obstacles = createObstacleManager();
const obstacleSpawner = createObstacleSpawner(obstacles, coins, items);
const collisions = createCollisionSystem(lanes);
const progression = createProgression();
const hud = createHud(hudRoot);
const renderer = createRenderer(canvas, lanes);
let input = null;
let animationFrameId = null;
let previousTime = performance.now();

function resizeGame() {
  renderer.resize();
  renderer.render(player.getSnapshot(), {
    coins: coins.getSnapshot(),
    items: items.getSnapshot(),
    obstacles: obstacles.getSnapshot(),
  });
}

window.addEventListener("resize", resizeGame);
resizeGame();

function startGame() {
  if (game.isPlaying()) {
    return;
  }

  game.startRun();
  player.reset();
  progression.reset();
  obstacleSpawner.reset();
  hud.setCandyCount(0);
  renderer.setBackgroundOffset(0);
  titleScreen.hidden = true;
  gameOverScreen.hidden = true;
  input?.destroy();
  input = createInputController((action, isActive) => {
    const wasAccepted = player.handleAction(action, isActive);

    if (wasAccepted && action === PLAYER_ACTION.JUMP) {
      audio.playJump();
    }
  });
  audio.unlock();
  previousTime = performance.now();
  canvas.focus();
  animationFrameId = requestAnimationFrame(frame);
}

function frame(currentTime) {
  if (!game.isPlaying()) {
    animationFrameId = null;
    return;
  }

  const deltaSeconds = Math.min((currentTime - previousTime) / 1000, 0.05);
  previousTime = currentTime;

  const movement = progression.update(
    deltaSeconds,
    coins.getCollectedCandyValue(),
    lanes.getLaneGap(),
  );
  player.update(
    deltaSeconds,
    movement.jumpTimeScale,
    movement.speedRatio,
  );
  coins.moveCoins(-movement.frameDistance);
  items.updateItems(-movement.frameDistance, deltaSeconds);
  obstacles.moveObstacles(-movement.frameDistance);
  const viewportWidth = canvas.getBoundingClientRect().width;
  obstacleSpawner.update(movement.traveledDistance, viewportWidth, lanes.getLaneGap());
  renderer.setBackgroundOffset(movement.traveledDistance);

  const playerSnapshot = player.getSnapshot();
  let coinSnapshot = coins.getSnapshot();
  let itemSnapshot = items.getSnapshot();
  const obstacleSnapshot = obstacles.getSnapshot();
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
  const triggeredItemIds = collisions.findTriggeredItemIds(
    playerSnapshot,
    itemSnapshot,
    viewportWidth,
  );

  if (collectedCoinIds.length > 0) {
    collectedCoinIds.forEach((id) => coins.collectCoin(id));
    hud.setCandyCount(coins.getCollectedCandyValue());
    audio.playCandyCollect();
    coinSnapshot = coins.getSnapshot();
  }

  if (triggeredItemIds.length > 0) {
    triggeredItemIds.forEach((id) => {
      const triggeredItem = items.triggerItem(id, playerSnapshot.lanePosition);

      if (triggeredItem?.type === COLLECTIBLE_TYPE.SPEED_UP) {
        progression.activateSpeedBoost();
      }
    });
    itemSnapshot = items.getSnapshot();
  }

  renderer.render(playerSnapshot, {
    coins: coinSnapshot,
    items: itemSnapshot,
    obstacles: obstacleSnapshot,
    hitObstacleIds,
  });

  if (game.tryGameOverFromObstacle(hitObstacleIds.length > 0)) {
    input?.destroy();
    input = null;
    animationFrameId = null;
    gameOverScreen.hidden = false;
    restartButton.focus();
    return;
  }

  animationFrameId = requestAnimationFrame(frame);
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

window.addEventListener("beforeunload", () => {
  input?.destroy();

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});
