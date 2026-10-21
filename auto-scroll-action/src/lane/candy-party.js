import { COIN_DEFINITIONS } from "./coins.js";

export const CANDY_PARTY_DURATION_SECONDS = 10;

const PARTY_CANDY_TYPES = COIN_DEFINITIONS
  .filter((definition) => definition.value === 1)
  .map((definition) => definition.type);
const CANDY_BURST_TIMES_SECONDS = [3, 6, 10];
const CANDIES_PER_BURST = 14;
const BURST_TIME_EPSILON_SECONDS = 0.000001;
const DUPLICATE_OFFSET_IN_LANE_GAPS = 0.1;
const CANDY_SIZE_RATIOS = [0.105, 0.125, 0.145];
const FOUNTAIN_SOURCE_X_RATIO = 0.5;
const FOUNTAIN_SOURCE_JITTER_IN_LANE_GAPS = 0.08;
const FOUNTAIN_MAX_HORIZONTAL_SPEED_IN_LANE_GAPS = 1.1;
const FOUNTAIN_MIN_VERTICAL_SPEED_IN_LANE_GAPS = 3.4;
const FOUNTAIN_VERTICAL_SPEED_RANGE_IN_LANE_GAPS = 0.8;

export function createCandyPartyManager({
  coinManager,
  candyTypes = PARTY_CANDY_TYPES,
  random = Math.random,
} = {}) {
  if (!coinManager) {
    throw new Error("Candy party requires a coin manager.");
  }

  const activeCandies = new Map();
  const availableCandyTypes = candyTypes.filter(Boolean);
  let remainingSeconds = 0;
  let effectElapsedSeconds = 0;
  let nextBurstIndex = 0;
  let nextId = 1;
  let lastViewportWidth = 0;
  let lastViewportHeight = 0;
  let lastLaneGap = 0;

  function activate({
    durationSeconds = CANDY_PARTY_DURATION_SECONDS,
    laneGap,
    viewportHeight,
    viewportWidth,
  } = {}) {
    remainingSeconds = Number.isFinite(durationSeconds)
      ? Math.max(0, durationSeconds)
      : 0;
    updateDimensions(viewportWidth, viewportHeight, laneGap);

    if (remainingSeconds <= 0) {
      coinManager.disableSpawnDuplication();
      effectElapsedSeconds = 0;
      nextBurstIndex = 0;
      return;
    }

    effectElapsedSeconds = 0;
    nextBurstIndex = 0;
    coinManager.enableSpawnDuplication(
      lastLaneGap * DUPLICATE_OFFSET_IN_LANE_GAPS,
    );
  }

  function update(deltaSeconds, { laneGap, viewportHeight, viewportWidth } = {}) {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds)
      ? Math.max(0, deltaSeconds)
      : 0;
    updateDimensions(viewportWidth, viewportHeight, laneGap);

    const gravity = lastLaneGap * 1.9;
    activeCandies.forEach((candy, id) => {
      candy.velocityY += gravity * safeDeltaSeconds;
      candy.x += candy.velocityX * safeDeltaSeconds;
      candy.y += candy.velocityY * safeDeltaSeconds;
      candy.rotation += candy.rotationSpeed * safeDeltaSeconds;

      const outsideHorizontally =
        candy.x < -lastLaneGap || candy.x > lastViewportWidth + lastLaneGap;
      const belowScreen = candy.y > lastViewportHeight + candy.radius * 3;

      if (outsideHorizontally || belowScreen) {
        activeCandies.delete(id);
      }
    });

    if (remainingSeconds > 0) {
      const activeDeltaSeconds = Math.min(safeDeltaSeconds, remainingSeconds);
      remainingSeconds = Math.max(0, remainingSeconds - safeDeltaSeconds);
      effectElapsedSeconds += activeDeltaSeconds;

      while (
        nextBurstIndex < CANDY_BURST_TIMES_SECONDS.length &&
        effectElapsedSeconds + BURST_TIME_EPSILON_SECONDS >=
          CANDY_BURST_TIMES_SECONDS[nextBurstIndex]
      ) {
        spawnBurst();
        nextBurstIndex += 1;
      }

      if (remainingSeconds === 0) {
        coinManager.disableSpawnDuplication();
      }
    }
  }

  function spawnBurst() {
    for (let index = 0; index < CANDIES_PER_BURST; index += 1) {
      const horizontalBias = CANDIES_PER_BURST === 1
        ? 0.5
        : index / (CANDIES_PER_BURST - 1);
      spawnCandy(horizontalBias);
    }
  }

  function spawnCandy(horizontalBias = random()) {
    if (
      availableCandyTypes.length === 0 ||
      lastViewportWidth <= 0 ||
      lastViewportHeight <= 0 ||
      lastLaneGap <= 0
    ) {
      return null;
    }

    const safeBias = Number.isFinite(horizontalBias)
      ? Math.min(1, Math.max(0, horizontalBias))
      : random();
    const typeIndex = Math.min(
      availableCandyTypes.length - 1,
      Math.floor(random() * availableCandyTypes.length),
    );
    const sizeRatioIndex = Math.min(
      CANDY_SIZE_RATIOS.length - 1,
      Math.floor(random() * CANDY_SIZE_RATIOS.length),
    );
    const size = lastLaneGap * CANDY_SIZE_RATIOS[sizeRatioIndex];
    const horizontalDirection = safeBias * 2 - 1;
    const candy = {
      id: `party-candy-${nextId}`,
      type: availableCandyTypes[typeIndex],
      x:
        lastViewportWidth * FOUNTAIN_SOURCE_X_RATIO +
        (random() - 0.5) *
          lastLaneGap *
          FOUNTAIN_SOURCE_JITTER_IN_LANE_GAPS,
      y: lastViewportHeight + size * 0.45,
      radius: size * 0.46,
      size,
      rotation: random() * Math.PI * 2,
      rotationSpeed: (random() - 0.5) * 5,
      velocityX:
        horizontalDirection *
        lastLaneGap *
        FOUNTAIN_MAX_HORIZONTAL_SPEED_IN_LANE_GAPS,
      velocityY:
        -lastLaneGap *
        (FOUNTAIN_MIN_VERTICAL_SPEED_IN_LANE_GAPS +
          random() * FOUNTAIN_VERTICAL_SPEED_RANGE_IN_LANE_GAPS),
    };

    nextId += 1;
    activeCandies.set(candy.id, candy);
    return candy.id;
  }

  function collectCandy(id) {
    if (!activeCandies.delete(id)) {
      return 0;
    }

    return 1;
  }

  function getSnapshot() {
    return {
      candies: Array.from(activeCandies.values(), (candy) => ({ ...candy })),
      isActive: remainingSeconds > 0,
      remainingSeconds,
    };
  }

  function reset() {
    coinManager.disableSpawnDuplication();
    activeCandies.clear();
    remainingSeconds = 0;
    effectElapsedSeconds = 0;
    nextBurstIndex = 0;
  }

  function updateDimensions(viewportWidth, viewportHeight, laneGap) {
    if (Number.isFinite(viewportWidth) && viewportWidth > 0) {
      lastViewportWidth = viewportWidth;
    }

    if (Number.isFinite(viewportHeight) && viewportHeight > 0) {
      lastViewportHeight = viewportHeight;
    }

    if (Number.isFinite(laneGap) && laneGap > 0) {
      lastLaneGap = laneGap;
    }
  }

  return {
    activate,
    collectCandy,
    getSnapshot,
    reset,
    update,
  };
}
