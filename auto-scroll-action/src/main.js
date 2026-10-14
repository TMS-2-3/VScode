import { createAudioController } from "./core/audio-controller.js";
import { createCollisionSystem } from "./core/collision-system.js";
import { createGameController } from "./core/game-controller.js";
import { createInputController } from "./core/input-controller.js";
import { createPlayerController } from "./core/player-controller.js";
import { createProgression } from "./core/progression.js";
import { createPumpkinBarrier } from "./core/pumpkin-barrier.js";
import { createCandyLauncherManager } from "./lane/candy-launcher.js";
import { createCandyPartyManager } from "./lane/candy-party.js";
import { createCoinManager } from "./lane/coins.js";
import { createItemManager } from "./lane/items.js";
import { createLaneManager } from "./lane/lane-manager.js";
import { createObstacleManager } from "./lane/obstacles.js";
import { createObstacleSpawner } from "./lane/spawner.js";
import {
  createSupplyStationManager,
  SUPPLY_ITEM_EFFECT_TYPE,
} from "./lane/supply-stations.js";
import { COLLECTIBLE_TYPE, PLAYER_ACTION } from "./shared/contracts.js";
import { createHud } from "./visual/hud.js";
import { createRenderer } from "./visual/renderer.js";
import { createSupplyRoulette } from "./visual/supply-roulette.js";

const canvas = document.querySelector("#game-canvas");
const hudRoot = document.querySelector("#game-hud");
const titleScreen = document.querySelector("#title-screen");
const startButton = document.querySelector("#start-button");
const runIntro = document.querySelector("#run-intro");
const gameOverScreen = document.querySelector("#game-over-screen");
const gameOverCandyCount = document.querySelector("#game-over-candy-count");
const returnButton = document.querySelector("#return-button");
const supplyRouletteRoot = document.querySelector("#supply-roulette");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("#game-canvas が見つかりません。");
}

if (
  !(hudRoot instanceof HTMLElement) ||
  !(titleScreen instanceof HTMLElement) ||
  !(startButton instanceof HTMLButtonElement) ||
  !(runIntro instanceof HTMLElement) ||
  !(gameOverScreen instanceof HTMLElement) ||
  !(gameOverCandyCount instanceof HTMLOutputElement) ||
  !(returnButton instanceof HTMLButtonElement) ||
  !(supplyRouletteRoot instanceof HTMLElement)
) {
  throw new Error("ゲーム画面のUI要素が見つかりません。");
}

const audio = createAudioController();
const game = createGameController();
const lanes = createLaneManager();
const player = createPlayerController(lanes);
const coins = createCoinManager();
const candyLauncher = createCandyLauncherManager();
const candyParty = createCandyPartyManager({ coinManager: coins });
const items = createItemManager();
const progression = createProgression();
const pumpkinBarrier = createPumpkinBarrier();
const hud = createHud(hudRoot);
const supplyStations = createSupplyStationManager({
  isItemSelectable: isSupplyItemSelectable,
  onUseItem(item) {
    if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.SPEED_BOOST) {
      progression.activateTimedSpeedBoost(item.effect);
      return;
    }

    if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.CANDY_BONUS) {
      coins.addCandy(item.effect.amount);
      hud.setCandyCount(coins.getCollectedCandyValue());
      audio.playCandyCollect();
      return;
    }

    if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.PUMPKIN_BARRIER) {
      pumpkinBarrier.activate(item.effect.durationSeconds);
      return;
    }

    if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.CANDY_LAUNCHER) {
      candyLauncher.activate();
      return;
    }

    if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.CANDY_PARTY) {
      const viewportBounds = canvas.getBoundingClientRect();
      candyParty.activate({
        durationSeconds: item.effect.durationSeconds,
        laneGap: lanes.getLaneGap(),
        viewportHeight: viewportBounds.height,
        viewportWidth: viewportBounds.width,
      });
    }
  },
});

function isSupplyItemSelectable(item) {
  if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.CANDY_LAUNCHER) {
    return !candyLauncher.getSnapshot().isActive;
  }

  if (!Number.isFinite(item.effect?.durationSeconds)) {
    return true;
  }

  if (item.effect.type === SUPPLY_ITEM_EFFECT_TYPE.CANDY_PARTY) {
    return !candyParty.getSnapshot().isActive;
  }

  if (item.effect.type === SUPPLY_ITEM_EFFECT_TYPE.PUMPKIN_BARRIER) {
    return !pumpkinBarrier.getSnapshot().isActive;
  }

  if (item.effect.type === SUPPLY_ITEM_EFFECT_TYPE.SPEED_BOOST) {
    return progression.getSnapshot().timedSpeedBoostRemainingSeconds <= 0;
  }

  return true;
}
const obstacles = createObstacleManager();
const obstacleSpawner = createObstacleSpawner(
  obstacles,
  coins,
  items,
  supplyStations,
);
const collisions = createCollisionSystem(lanes);
const renderer = createRenderer(canvas, lanes);
const supplyRoulette = createSupplyRoulette(supplyRouletteRoot);
let input = null;
let animationFrameId = null;
let introTimeoutId = null;
let previousTime = performance.now();

function resizeGame() {
  renderer.resize();
  renderer.render(player.getSnapshot(), {
    candyLauncher: candyLauncher.getSnapshot(),
    coins: coins.getSnapshot(),
    candyParty: candyParty.getSnapshot(),
    items: items.getSnapshot(),
    obstacles: obstacles.getSnapshot(),
    pumpkinBarrier: pumpkinBarrier.getSnapshot(),
    supplyStations: supplyStations.getSnapshot(),
  });
}

window.addEventListener("resize", resizeGame);
resizeGame();

function startGame() {
  if (game.isPlaying() || game.isSupplyPaused() || introTimeoutId !== null) {
    return;
  }

  player.reset();
  progression.reset();
  pumpkinBarrier.reset();
  candyLauncher.reset();
  candyParty.reset();
  obstacleSpawner.reset();
  hud.setCandyCount(0);
  gameOverCandyCount.value = "0";
  renderer.setBackgroundOffset(0);
  renderer.render(player.getSnapshot(), {
    candyLauncher: candyLauncher.getSnapshot(),
    coins: coins.getSnapshot(),
    candyParty: candyParty.getSnapshot(),
    items: items.getSnapshot(),
    obstacles: obstacles.getSnapshot(),
    pumpkinBarrier: pumpkinBarrier.getSnapshot(),
    supplyStations: supplyStations.getSnapshot(),
  });
  supplyRoulette.reset();
  titleScreen.hidden = true;
  gameOverScreen.hidden = true;
  runIntro.hidden = false;
  audio.unlock();

  introTimeoutId = window.setTimeout(() => {
    introTimeoutId = null;
    runIntro.hidden = true;
    game.startRun();
    enableInput();
    previousTime = performance.now();
    canvas.focus();
    animationFrameId = requestAnimationFrame(frame);
  }, 2600);
}

function enableInput() {
  input?.destroy();
  input = createInputController((action, isActive) => {
    const wasAccepted = player.handleAction(action, isActive);

    if (wasAccepted && action === PLAYER_ACTION.JUMP) {
      audio.playJump();
    }
  });
}

function disableInput() {
  player.handleAction(PLAYER_ACTION.DUCK, false);
  input?.destroy();
  input = null;
}

function returnToTitle() {
  disableInput();
  game.returnToReady();
  supplyRoulette.reset();
  runIntro.hidden = true;
  gameOverScreen.hidden = true;
  titleScreen.hidden = false;
  startButton.focus();
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
  pumpkinBarrier.update(deltaSeconds);
  player.update(
    deltaSeconds,
    movement.jumpTimeScale,
    movement.speedRatio,
  );
  coins.moveCoins(-movement.frameDistance);
  items.updateItems(-movement.frameDistance, deltaSeconds);
  supplyStations.moveStations(-movement.frameDistance);
  obstacles.moveObstacles(-movement.frameDistance);
  const viewportBounds = canvas.getBoundingClientRect();
  const viewportWidth = viewportBounds.width;
  candyParty.update(deltaSeconds, {
    laneGap: lanes.getLaneGap(),
    viewportHeight: viewportBounds.height,
    viewportWidth,
  });
  obstacleSpawner.update(movement.traveledDistance, viewportWidth, lanes.getLaneGap());
  renderer.setBackgroundOffset(movement.traveledDistance);

  const playerSnapshot = player.getSnapshot();
  const launcherResult = candyLauncher.update(deltaSeconds, {
    laneGap: lanes.getLaneGap(),
    obstacles: obstacles.getSnapshot(),
    playerFootY:
      lanes.getLaneY(playerSnapshot.lanePosition) - playerSnapshot.elevation,
    playerLanePosition: playerSnapshot.lanePosition,
    scrollSpeed: movement.scrollSpeed,
    viewportWidth,
  });

  if (launcherResult.destroyedObstacleId) {
    obstacles.removeObstacle(launcherResult.destroyedObstacleId);
    launcherResult.candyDrops.forEach((drop) => coins.addCoin(drop));
  }

  let coinSnapshot = coins.getSnapshot();
  let candyPartySnapshot = candyParty.getSnapshot();
  let itemSnapshot = items.getSnapshot();
  const supplyStationSnapshot = supplyStations.getSnapshot();
  let obstacleSnapshot = obstacles.getSnapshot();
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
  const collectedPartyCandyIds = collisions.findCollectedPartyCandyIds(
    playerSnapshot,
    candyPartySnapshot.candies,
    viewportWidth,
  );
  const triggeredItemIds = collisions.findTriggeredItemIds(
    playerSnapshot,
    itemSnapshot,
    viewportWidth,
  );
  const reachedSupplyStationIds = collisions.findReachedSupplyStationIds(
    supplyStationSnapshot,
    viewportWidth,
  );
  let unprotectedHitObstacleIds = hitObstacleIds;

  if (hitObstacleIds.length > 0 && pumpkinBarrier.consume()) {
    hitObstacleIds.forEach((id) => obstacles.removeObstacle(id));
    obstacleSnapshot = obstacles.getSnapshot();
    unprotectedHitObstacleIds = [];
  }

  if (collectedCoinIds.length > 0) {
    collectedCoinIds.forEach((id) => coins.collectCoin(id));
    hud.setCandyCount(coins.getCollectedCandyValue());
    audio.playCandyCollect();
    coinSnapshot = coins.getSnapshot();
  }

  if (collectedPartyCandyIds.length > 0) {
    const collectedValue = collectedPartyCandyIds.reduce(
      (total, id) => total + candyParty.collectCandy(id),
      0,
    );
    coins.addCandy(collectedValue);
    hud.setCandyCount(coins.getCollectedCandyValue());
    audio.playCandyCollect();
    candyPartySnapshot = candyParty.getSnapshot();
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
    candyLauncher: candyLauncher.getSnapshot(),
    coins: coinSnapshot,
    candyParty: candyPartySnapshot,
    items: itemSnapshot,
    obstacles: obstacleSnapshot,
    pumpkinBarrier: pumpkinBarrier.getSnapshot(),
    supplyStations: supplyStationSnapshot,
    hitObstacleIds: unprotectedHitObstacleIds,
  });

  if (game.tryGameOverFromObstacle(unprotectedHitObstacleIds.length > 0)) {
    disableInput();
    animationFrameId = null;
    gameOverCandyCount.value = String(coins.getCollectedCandyValue());
    gameOverScreen.hidden = false;
    returnButton.focus();
    return;
  }

  let supplyDraw = null;

  reachedSupplyStationIds.some((id) => {
    supplyDraw = supplyStations.openStation(id);
    return supplyDraw !== null;
  });

  if (supplyDraw && game.pauseForSupply()) {
    disableInput();
    animationFrameId = null;
    supplyRoulette.start(supplyDraw, {
      onReveal: () => {
        supplyStations.claimItem();
      },
      onGo: () => {
        if (!game.resumeFromSupply()) {
          return;
        }

        enableInput();
        previousTime = performance.now();
        canvas.focus();
        animationFrameId = requestAnimationFrame(frame);
      },
    });
    return;
  }

  animationFrameId = requestAnimationFrame(frame);
}

startButton.addEventListener("click", startGame);
returnButton.addEventListener("click", returnToTitle);

window.addEventListener("beforeunload", () => {
  disableInput();
  supplyRoulette.reset();

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  if (introTimeoutId !== null) {
    clearTimeout(introTimeoutId);
  }
});
