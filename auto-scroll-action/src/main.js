import { createAudioController } from "./core/audio-controller.js";
import { createCameraPrank } from "./core/camera-prank.js";
import { createCollisionSystem } from "./core/collision-system.js";
import { createGameController } from "./core/game-controller.js";
import { createInputController } from "./core/input-controller.js";
import { createPlayerController } from "./core/player-controller.js";
import { createProgression } from "./core/progression.js";
import { createPumpkinBarrier } from "./core/pumpkin-barrier.js";
import { createScaryCostume } from "./core/scary-costume.js";
import { createStampCollection } from "./core/stamp-collection.js";
import { createCandyLauncherManager } from "./lane/candy-launcher.js";
import { createCandyPartyManager } from "./lane/candy-party.js";
import { createCandyVacuumManager } from "./lane/candy-vacuum.js";
import { createCoinManager } from "./lane/coins.js";
import { createItemManager } from "./lane/items.js";
import { createLaneManager } from "./lane/lane-manager.js";
import { createObstacleManager } from "./lane/obstacles.js";
import { createObstacleSpawner } from "./lane/spawner.js";
import {
  createSupplyStationManager,
  SUPPLY_ITEM_EFFECT_TYPE,
} from "./lane/supply-stations.js";
import {
  COLLECTIBLE_TYPE,
  PLAYER_ACTION,
  PLAYER_SCREEN_X_RATIO,
} from "./shared/contracts.js";
import { createBackgroundScroller } from "./visual/background-scroller.js";
import { createCharacterSelector } from "./visual/character-selector.js";
import { createHud } from "./visual/hud.js";
import { createRenderer } from "./visual/renderer.js";
import { PLAYER_DEFEAT_DURATION_SECONDS } from "./visual/player-defeat.js";
import { createSettingsPanel } from "./visual/settings-panel.js";
import { createSupplyRoulette } from "./visual/supply-roulette.js";
import { paintStampArtwork } from "./visual/stamp-art.js";

const canvas = document.querySelector("#game-canvas");
const backgroundRoot = document.querySelector("#game-background");
const hudRoot = document.querySelector("#game-hud");
const titleScreen = document.querySelector("#title-screen");
const startButton = document.querySelector("#start-button");
const runIntro = document.querySelector("#run-intro");
const gameOverScreen = document.querySelector("#game-over-screen");
const gameOverCandyCount = document.querySelector("#game-over-candy-count");
const gameOverStamp = document.querySelector("#game-over-stamp");
const returnButton = document.querySelector("#return-button");
const supplyRouletteRoot = document.querySelector("#supply-roulette");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("#game-canvas が見つかりません。");
}

if (
  !(backgroundRoot instanceof HTMLElement) ||
  !(hudRoot instanceof HTMLElement) ||
  !(titleScreen instanceof HTMLElement) ||
  !(startButton instanceof HTMLButtonElement) ||
  !(runIntro instanceof HTMLElement) ||
  !(gameOverScreen instanceof HTMLElement) ||
  !(gameOverCandyCount instanceof HTMLOutputElement) ||
  !(gameOverStamp instanceof HTMLElement) ||
  !(returnButton instanceof HTMLButtonElement) ||
  !(supplyRouletteRoot instanceof HTMLElement)
) {
  throw new Error("ゲーム画面のUI要素が見つかりません。");
}

const audio = createAudioController();
const stampCollection = createStampCollection();
const settingsPanel = createSettingsPanel(
  document.querySelector("#settings-button"),
  document.querySelector("#settings-dialog"),
  audio,
  { getStampLog: stampCollection.getLatestLog },
);
document.querySelectorAll("canvas[data-stamp-icon]").forEach((icon) => {
  const iconContext = icon.getContext("2d");
  if (iconContext) {
    paintStampArtwork(iconContext, icon.width, icon.height);
  }
});
audio.setBackgroundMusicMode("title", { restart: true });
window.addEventListener("pointerdown", audio.unlock, { once: true });
window.addEventListener("keydown", audio.unlock, { once: true });
const game = createGameController();
const lanes = createLaneManager();
const player = createPlayerController(lanes);
const coins = createCoinManager();
const candyLauncher = createCandyLauncherManager();
const candyParty = createCandyPartyManager({ coinManager: coins });
const candyVacuum = createCandyVacuumManager({ coinManager: coins });
const cameraPrank = createCameraPrank();
const items = createItemManager();
const progression = createProgression();
const pumpkinBarrier = createPumpkinBarrier();
const scaryCostume = createScaryCostume();
const hud = createHud(hudRoot);
const supplyStations = createSupplyStationManager({
  isItemSelectable: isSupplyItemSelectable,
  getCandyCount: () => coins.getCollectedCandyValue(),
  onUseItem(item) {
    if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.STAMP) {
      stampCollection.collect();
      return;
    }

    if (
      item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.SPEED_BOOST ||
      item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.MAGIC_CLOCK
    ) {
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
      const viewportBounds = renderer.getViewportSize();
      candyParty.activate({
        durationSeconds: item.effect.durationSeconds,
        laneGap: lanes.getLaneGap(),
        viewportHeight: viewportBounds.height,
        viewportWidth: viewportBounds.width,
      });
      return;
    }

    if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.CANDY_VACUUM) {
      candyVacuum.activate(item.effect.durationSeconds);
      return;
    }

    if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.SCARY_COSTUME) {
      scaryCostume.activate();
    }
  },
});

function isSupplyItemSelectable(item) {
  if (
    item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.SPEED_BOOST ||
    item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.MAGIC_CLOCK
  ) {
    return progression.getSnapshot().timedSpeedBoostRemainingSeconds <= 0;
  }

  if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.SCARY_COSTUME) {
    return !scaryCostume.getSnapshot().isActive;
  }

  if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.CANDY_LAUNCHER) {
    return !candyLauncher.getSnapshot().isActive;
  }

  if (!Number.isFinite(item.effect?.durationSeconds)) {
    return true;
  }

  if (item.effect.type === SUPPLY_ITEM_EFFECT_TYPE.CANDY_PARTY) {
    return !candyParty.getSnapshot().isActive;
  }

  if (item.effect.type === SUPPLY_ITEM_EFFECT_TYPE.CANDY_VACUUM) {
    return !candyVacuum.getSnapshot().isActive;
  }

  if (item.effect.type === SUPPLY_ITEM_EFFECT_TYPE.PUMPKIN_BARRIER) {
    return !pumpkinBarrier.getSnapshot().isActive;
  }

  return true;
}
const obstacles = createObstacleManager();
const obstacleSpawner = createObstacleSpawner(
  obstacles,
  coins,
  items,
  supplyStations,
  Math.random,
  {
    canSpawnCameraPrank: () => cameraPrank.canSpawn(),
  },
);
const collisions = createCollisionSystem(lanes);
const renderer = createRenderer(canvas, lanes);
const backgroundScroller = createBackgroundScroller(backgroundRoot);
const supplyRoulette = createSupplyRoulette(supplyRouletteRoot);
const characterSelector = createCharacterSelector(
  document.querySelector("#character-selector"),
  (character) => {
    renderer.setPlayerCharacter(character);
    resizeGame();
  },
);
renderer.setPlayerCharacter(characterSelector.getSelectedCharacter());
let input = null;
let animationFrameId = null;
let introTimeoutId = null;
let defeatAnimation = null;
let previousTime = performance.now();

function resetFrameTiming() {
  previousTime = performance.now();
}

function applyCameraView(playerSnapshot, cameraPrankSnapshot) {
  const viewportBounds = renderer.getViewportSize();
  const originX = viewportBounds.width * PLAYER_SCREEN_X_RATIO;
  const originY =
    lanes.getLaneY(playerSnapshot.lanePosition) -
    playerSnapshot.elevation -
    playerSnapshot.hitbox.height * 0.5;

  backgroundScroller.setCamera({
    originX,
    originY,
    scale: cameraPrankSnapshot?.scale ?? 1,
  });
}

function resizeGame() {
  renderer.resize();
  const viewportBounds = renderer.getViewportSize();
  backgroundScroller.resize(viewportBounds.width, viewportBounds.height);

  if (defeatAnimation) {
    renderDefeatScene();
    return;
  }

  const playerSnapshot = player.getSnapshot();
  const cameraPrankSnapshot = cameraPrank.getSnapshot();
  applyCameraView(playerSnapshot, cameraPrankSnapshot);
  renderer.render(playerSnapshot, {
    candyLauncher: candyLauncher.getSnapshot(),
    cameraPrank: cameraPrankSnapshot,
    coins: coins.getSnapshot(),
    candyParty: candyParty.getSnapshot(),
    candyVacuum: candyVacuum.getSnapshot(),
    scaryCostume: scaryCostume.getSnapshot(),
    items: items.getSnapshot(),
    obstacles: obstacles.getSnapshot(),
    pumpkinBarrier: pumpkinBarrier.getSnapshot(),
    supplyStations: supplyStations.getSnapshot(),
  });
}

window.addEventListener("resize", resizeGame);
resizeGame();

function startGame() {
  if (
    game.isPlaying() ||
    game.isSupplyPaused() ||
    game.isDefeated() ||
    introTimeoutId !== null ||
    settingsPanel.isOpen()
  ) {
    return;
  }

  defeatAnimation = null;
  stampCollection.reset();
  gameOverStamp.hidden = true;
  gameOverScreen.classList.remove("has-stamp");
  player.reset();
  audio.setCandyVacuumState();
  progression.reset();
  pumpkinBarrier.reset();
  candyLauncher.reset();
  candyParty.reset();
  candyVacuum.reset();
  cameraPrank.reset();
  scaryCostume.reset();
  obstacleSpawner.reset();
  hud.setCandyCount(0);
  gameOverCandyCount.value = "0";
  backgroundScroller.setOffset(0);
  const playerSnapshot = player.getSnapshot();
  const cameraPrankSnapshot = cameraPrank.getSnapshot();
  applyCameraView(playerSnapshot, cameraPrankSnapshot);
  renderer.render(playerSnapshot, {
    candyLauncher: candyLauncher.getSnapshot(),
    cameraPrank: cameraPrankSnapshot,
    coins: coins.getSnapshot(),
    candyParty: candyParty.getSnapshot(),
    candyVacuum: candyVacuum.getSnapshot(),
    scaryCostume: scaryCostume.getSnapshot(),
    items: items.getSnapshot(),
    obstacles: obstacles.getSnapshot(),
    pumpkinBarrier: pumpkinBarrier.getSnapshot(),
    supplyStations: supplyStations.getSnapshot(),
  });
  supplyRoulette.reset();
  titleScreen.hidden = true;
  gameOverScreen.hidden = true;
  runIntro.hidden = false;
  audio.setBackgroundMusicMode("off");
  audio.unlock();
  audio.playRunIntro();

  introTimeoutId = window.setTimeout(() => {
    introTimeoutId = null;
    runIntro.hidden = true;
    game.startRun();
    audio.setBackgroundMusicMode("playing", { restart: true });
    enableInput();
    resetFrameTiming();
    canvas.focus();
    animationFrameId = requestAnimationFrame(frame);
  }, 2600);
}

function enableInput() {
  input?.destroy();
  input = createInputController((action, isActive) => {
    const wasAccepted = player.handleAction(action, isActive);

    if (wasAccepted && action === PLAYER_ACTION.JUMP) {
      audio.playJump(player.getSnapshot().jumpCount);
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
  audio.setCandyVacuumState();
  cameraPrank.reset();
  defeatAnimation = null;
  resizeGame();
  game.returnToReady();
  supplyRoulette.reset();
  runIntro.hidden = true;
  gameOverScreen.hidden = true;
  titleScreen.hidden = false;
  audio.setBackgroundMusicMode("title", { restart: true });
  startButton.focus();
}

function renderDefeatScene() {
  backgroundScroller.setCamera();
  renderer.render(defeatAnimation.player, {
    ...defeatAnimation.scene,
    cameraPrank: null,
    playerDefeat: {
      elapsedSeconds: defeatAnimation.elapsedSeconds,
      landingLane: defeatAnimation.landingLane,
      originElevationRatio: defeatAnimation.originElevationRatio,
    },
  });
}

function frame(currentTime) {
  const deltaSeconds = Math.max(0, (currentTime - previousTime) / 1000);
  previousTime = currentTime;

  if (game.isDefeated()) {
    defeatAnimation.elapsedSeconds = Math.min(
      PLAYER_DEFEAT_DURATION_SECONDS,
      defeatAnimation.elapsedSeconds + deltaSeconds,
    );
    renderDefeatScene();

    if (defeatAnimation.elapsedSeconds >= PLAYER_DEFEAT_DURATION_SECONDS) {
      game.finishGameOver();
      stampCollection.finishRun();
      gameOverStamp.hidden = !stampCollection.hasStamp();
      gameOverScreen.classList.toggle("has-stamp", stampCollection.hasStamp());
      animationFrameId = null;
      gameOverScreen.hidden = false;
      audio.playGameOver();
      returnButton.focus();
      return;
    }

    animationFrameId = requestAnimationFrame(frame);
    return;
  }

  if (!game.isPlaying()) {
    animationFrameId = null;
    return;
  }

  const movement = progression.update(
    deltaSeconds,
    coins.getCollectedCandyValue(),
    lanes.getLaneGap(),
    deltaSeconds,
  );
  audio.setBackgroundMusicSpeed(movement.speedRatio);
  pumpkinBarrier.update(deltaSeconds);
  const cameraPrankResult = cameraPrank.update(deltaSeconds);
  let cameraPrankSnapshot = cameraPrankResult;

  if (
    cameraPrankResult.didLookAtPlayer &&
    scaryCostume.getSnapshot().isActive
  ) {
    const candyReward = scaryCostume.repelNextGhost();

    if (cameraPrank.repel(candyReward)) {
      audio.playGhostFlee();
      cameraPrankSnapshot = cameraPrank.getSnapshot();
    }
  }

  if (cameraPrankResult.repelledCandyCollected > 0) {
    coins.addCandy(cameraPrankResult.repelledCandyCollected);
    hud.setCandyCount(coins.getCollectedCandyValue());
    audio.playCandyCollect();
  }
  player.update(
    deltaSeconds,
    movement.jumpTimeScale,
    movement.speedRatio,
  );
  coins.moveCoins(-movement.frameDistance);
  const itemUpdateResult = items.updateItems(
    -movement.frameDistance,
    deltaSeconds,
  );

  if (itemUpdateResult.repelledCandyCollected > 0) {
    coins.addCandy(itemUpdateResult.repelledCandyCollected);
    hud.setCandyCount(coins.getCollectedCandyValue());
    audio.playCandyCollect();
  }
  supplyStations.moveStations(-movement.frameDistance);
  obstacles.moveObstacles(-movement.frameDistance);
  const viewportBounds = renderer.getViewportSize();
  const viewportWidth = viewportBounds.width;
  const playerSnapshot = player.getSnapshot();
  const candyVacuumResult = candyVacuum.update(deltaSeconds, {
    getLaneY: lanes.getLaneY,
    laneGap: lanes.getLaneGap(),
    playerLanePosition: playerSnapshot.lanePosition,
    playerX: viewportWidth * PLAYER_SCREEN_X_RATIO,
    playerY:
      lanes.getLaneY(playerSnapshot.lanePosition) -
      playerSnapshot.elevation -
      playerSnapshot.hitbox.height / 2,
  });
  audio.setCandyVacuumState(candyVacuumResult);
  const candyPartyResult = candyParty.update(deltaSeconds, {
    laneGap: lanes.getLaneGap(),
    viewportHeight: viewportBounds.height,
    viewportWidth,
  });

  for (let index = 0; index < candyPartyResult.burstCount; index += 1) {
    audio.playCandyPartyBurst();
  }
  obstacleSpawner.update(movement.traveledDistance, viewportWidth, lanes.getLaneGap());
  backgroundScroller.setOffset(movement.traveledDistance);

  const launcherResult = candyLauncher.update(deltaSeconds, {
    laneGap: lanes.getLaneGap(),
    obstacles: obstacles.getSnapshot(),
    playerFootY:
      lanes.getLaneY(playerSnapshot.lanePosition) - playerSnapshot.elevation,
    playerLanePosition: playerSnapshot.lanePosition,
    scrollSpeed: movement.scrollSpeed,
    viewportWidth,
  });

  if (launcherResult.countdownCue !== null) {
    audio.playLauncherCountdown(launcherResult.countdownCue);
  }

  if (launcherResult.didFire) {
    audio.playLauncherFire();
  }

  if (launcherResult.destroyedObstacleId) {
    audio.playLauncherExplosion();
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
    audio.playPumpkinCrush();
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
        if (scaryCostume.getSnapshot().isActive) {
          const candyReward = scaryCostume.repelNextGhost();
          items.repelTriggeredGhost(id, candyReward);
          audio.playGhostFlee();
        } else {
          progression.activateSpeedBoost();
          audio.playGhostScare();
        }
      }

      if (triggeredItem?.type === COLLECTIBLE_TYPE.CAMERA_PRANK) {
        if (cameraPrank.activate()) {
          items.getSnapshot().forEach((item) => {
            if (
              item.id !== id &&
              item.type === COLLECTIBLE_TYPE.CAMERA_PRANK
            ) {
              items.removeItem(item.id);
            }
          });
          cameraPrankSnapshot = cameraPrank.getSnapshot();
        }
      }
    });
    itemSnapshot = items.getSnapshot();
  }

  applyCameraView(playerSnapshot, cameraPrankSnapshot);

  const scene = {
    candyLauncher: candyLauncher.getSnapshot(),
    cameraPrank: cameraPrankSnapshot,
    coins: coinSnapshot,
    candyParty: candyPartySnapshot,
    candyVacuum: candyVacuum.getSnapshot(),
    scaryCostume: scaryCostume.getSnapshot(),
    items: itemSnapshot,
    obstacles: obstacleSnapshot,
    pumpkinBarrier: pumpkinBarrier.getSnapshot(),
    supplyStations: supplyStationSnapshot,
    hitObstacleIds: unprotectedHitObstacleIds,
  };
  renderer.render(playerSnapshot, scene);

  if (game.tryDefeatFromObstacle(unprotectedHitObstacleIds.length > 0)) {
    audio.setBackgroundMusicMode("off");
    audio.playObstacleHit();
    const hitObstacle = obstacleSnapshot.find((obstacle) =>
      unprotectedHitObstacleIds.includes(obstacle.id),
    );
    // Keep the world and score frozen while only the defeated character animates.
    defeatAnimation = {
      elapsedSeconds: 0,
      player: playerSnapshot,
      scene,
      landingLane: hitObstacle.lane,
      originElevationRatio: playerSnapshot.elevation / lanes.getLaneGap(),
    };
    disableInput();
    audio.setCandyVacuumState();
    gameOverCandyCount.value = String(coins.getCollectedCandyValue());
    renderDefeatScene();
    animationFrameId = requestAnimationFrame(frame);
    return;
  }

  let supplyDraw = null;

  reachedSupplyStationIds.some((id) => {
    supplyDraw = supplyStations.openStation(id, {
      repelTheft: scaryCostume.getSnapshot().isActive,
    });
    return supplyDraw !== null;
  });

  if (supplyDraw && game.pauseForSupply()) {
    const repelledTheftCount = supplyDraw.slots.filter(
      (slot) => slot.isTheftRepelled,
    ).length;
    // Consume only the costume that was active before this draw started.
    const repelledTheftRewards = scaryCostume.repelGhostGroup(
      repelledTheftCount,
    );
    disableInput();
    audio.setBackgroundMusicMode("supply");
    audio.setCandyVacuumState();
    animationFrameId = null;
    supplyRoulette.start(supplyDraw, {
      onSpinTick: (step) => {
        audio.playSupplyRouletteTick(step);
      },
      onSpinComplete: () => {
        if (supplyDraw.slots.some((slot) => slot.item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.STAMP)) {
          audio.playStampFanfare();
        } else {
          audio.playSupplyRouletteResult();
        }
      },
      onTheftEscape: () => {
        audio.playSupplyTheftVoice();
      },
      onTheftRepelled: () => {
        audio.playGhostFlee();
        return repelledTheftRewards.shift() ?? 0;
      },
      onRepelledCandyCollected: (candyCount) => {
        coins.addCandy(candyCount);
        hud.setCandyCount(coins.getCollectedCandyValue());
        audio.playCandyCollect();
      },
      onReveal: (_item, slotIndex = 0) => {
        supplyStations.claimItem(slotIndex);
      },
      onGo: () => {
        if (!game.resumeFromSupply()) {
          return;
        }

        audio.playSupplyGo();
        audio.setBackgroundMusicMode("playing");
        enableInput();
        resetFrameTiming();
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

window.addEventListener("keydown", (event) => {
  if (
    event.code !== "Space" ||
    event.repeat ||
    titleScreen.hidden ||
    settingsPanel.isOpen() ||
    (event.target.closest?.("button, input, select, textarea") &&
      !event.target.matches?.('#character-selector input:checked'))
  ) {
    return;
  }

  event.preventDefault();
  startGame();
});

window.addEventListener("beforeunload", () => {
  disableInput();
  audio.setBackgroundMusicMode("off");
  audio.setCandyVacuumState();
  supplyRoulette.reset();

  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  if (introTimeoutId !== null) {
    clearTimeout(introTimeoutId);
  }
});
