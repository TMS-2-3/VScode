import { COLLECTIBLE_TYPE, LANE_COUNT, LANE_ENTITY_KIND } from "../shared/contracts.js";
import { chooseCandyAppearance } from "../shared/candy-appearances.js";

const NORMAL_COIN_PROPERTIES = {
  kind: LANE_ENTITY_KIND.COIN,
  value: 1,
  widthRatio: 0.16,
  heightRatio: 0.16,
  pickupRadiusRatio: 0.05,
};

// elevationRatioはレーン面からコイン中心までの高さ、pickupRadiusRatioは取得半径です。
// どちらも現在のレーン間隔を1とした割合で指定します。
// Add an entry here when a new coin type becomes available for spawning.
export const COIN_DEFINITIONS = [
  {
    ...NORMAL_COIN_PROPERTIES,
    type: COLLECTIBLE_TYPE.COIN_HIGH,
    elevationRatio: 0.7,
  },
  {
    ...NORMAL_COIN_PROPERTIES,
    type: COLLECTIBLE_TYPE.COIN_MIDDLE,
    elevationRatio: 0.39,
  },
  {
    ...NORMAL_COIN_PROPERTIES,
    type: COLLECTIBLE_TYPE.COIN_LOW,
    elevationRatio: 0.1,
  },
  {
    kind: LANE_ENTITY_KIND.COIN,
    type: COLLECTIBLE_TYPE.SPECIAL_COIN,
    value: 30,
    widthRatio: 0.26,
    heightRatio: 0.3,
    elevationRatio: 0.23,
    pickupRadiusRatio: 0.13,
  },
];

const COIN_DEFINITIONS_BY_TYPE = new Map(
  COIN_DEFINITIONS.map((definition) => [definition.type, definition]),
);

export function createCoinManager({ random = Math.random } = {}) {
  const activeCoins = new Map();
  let nextId = 1;
  let collectedCandyValue = 0;
  let spawnDuplicateOffsetX = 0;

  function createCoin({ x, lane, definition }) {
    const coin = {
      ...definition,
      id: `coin-${nextId}`,
      x,
      lane,
      appearance:
        definition.type === COLLECTIBLE_TYPE.SPECIAL_COIN
          ? null
          : chooseCandyAppearance(random),
    };

    nextId += 1;
    activeCoins.set(coin.id, coin);
    return coin;
  }

  function addCoin({ x, lane, type = COLLECTIBLE_TYPE.COIN_LOW } = {}) {
    const definition = COIN_DEFINITIONS_BY_TYPE.get(type);

    if (!definition) {
      throw new Error(`Unknown coin type: ${type}`);
    }

    if (!Number.isFinite(x)) {
      throw new Error("Coin x must be a finite number.");
    }

    if (!Number.isInteger(lane) || lane < 0 || lane >= LANE_COUNT) {
      throw new Error(`Coin lane must be between 0 and ${LANE_COUNT - 1}.`);
    }

    const coin = createCoin({ x, lane, definition });

    if (spawnDuplicateOffsetX > 0) {
      createCoin({
        x: x + spawnDuplicateOffsetX,
        lane,
        definition,
      });
    }

    return coin.id;
  }

  function enableSpawnDuplication(offsetX) {
    const safeOffsetX = Number.isFinite(offsetX) ? Math.max(0, offsetX) : 0;

    if (safeOffsetX <= 0) {
      return 0;
    }

    if (spawnDuplicateOffsetX > 0) {
      spawnDuplicateOffsetX = safeOffsetX;
      return 0;
    }

    const existingCoins = Array.from(activeCoins.values());
    spawnDuplicateOffsetX = safeOffsetX;
    existingCoins.forEach((coin) => {
      const definition = COIN_DEFINITIONS_BY_TYPE.get(coin.type);

      if (definition) {
        createCoin({
          x: coin.x + spawnDuplicateOffsetX,
          lane: coin.lane,
          definition,
        });
      }
    });
    return existingCoins.length;
  }

  function disableSpawnDuplication() {
    spawnDuplicateOffsetX = 0;
  }

  function moveCoins(deltaX) {
    if (!Number.isFinite(deltaX)) {
      return;
    }

    activeCoins.forEach((coin) => {
      coin.x += deltaX;
    });
  }

  function updateVacuumAttraction({
    deltaSeconds,
    getLaneY,
    isActive = false,
    laneGap,
    playerLanePosition,
    playerX,
    playerY,
    pullStrength = 12,
    rangeInLaneGaps = 1.75,
    releaseStrength = 8,
    rotationSpeed = 18,
  } = {}) {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds)
      ? Math.max(0, deltaSeconds)
      : 0;
    const safeLaneGap = Number.isFinite(laneGap) ? Math.max(0, laneGap) : 0;
    const canAttract =
      isActive &&
      safeDeltaSeconds > 0 &&
      safeLaneGap > 0 &&
      Number.isFinite(playerX) &&
      Number.isFinite(playerY) &&
      Number.isFinite(playerLanePosition) &&
      typeof getLaneY === "function";
    const playerLane = canAttract
      ? Math.min(LANE_COUNT - 1, Math.max(0, Math.round(playerLanePosition)))
      : null;
    const attractionRange = safeLaneGap * Math.max(0, rangeInLaneGaps);
    const pullRatio = canAttract
      ? 1 - Math.exp(-Math.max(0, pullStrength) * safeDeltaSeconds)
      : 0;
    const releaseRatio =
      1 - Math.exp(-Math.max(0, releaseStrength) * safeDeltaSeconds);
    let attractedCount = 0;

    activeCoins.forEach((coin) => {
      const offsetX = Number.isFinite(coin.vacuumOffsetX)
        ? coin.vacuumOffsetX
        : 0;
      const offsetY = Number.isFinite(coin.vacuumOffsetY)
        ? coin.vacuumOffsetY
        : 0;
      const actualX = coin.x + offsetX;
      const isOrbiting =
        Number.isFinite(coin.vacuumAngle) &&
        Number.isFinite(coin.vacuumRadius);

      if (
        canAttract &&
        Math.abs(coin.lane - playerLane) <= 1 &&
        (isOrbiting || Math.abs(actualX - playerX) <= attractionRange)
      ) {
        attractedCount += 1;
        const baseY =
          getLaneY(coin.lane) - safeLaneGap * coin.elevationRatio;
        const actualY = baseY + offsetY;
        const startDistanceX = actualX - playerX;
        const startDistanceY = actualY - playerY;

        if (!isOrbiting) {
          coin.vacuumAngle = Math.atan2(startDistanceY, startDistanceX);
          coin.vacuumRadius = Math.hypot(startDistanceX, startDistanceY);
        }

        coin.vacuumAngle += Math.max(0, rotationSpeed) * safeDeltaSeconds;
        coin.vacuumRadius *= 1 - pullRatio;

        const attractedX =
          playerX + Math.cos(coin.vacuumAngle) * coin.vacuumRadius;
        const attractedY =
          playerY + Math.sin(coin.vacuumAngle) * coin.vacuumRadius;

        coin.vacuumOffsetX = attractedX - coin.x;
        coin.vacuumOffsetY = attractedY - baseY;
        return;
      }

      coin.vacuumAngle = null;
      coin.vacuumRadius = null;
      coin.vacuumOffsetX = approachZero(offsetX, releaseRatio);
      coin.vacuumOffsetY = approachZero(offsetY, releaseRatio);
    });

    return attractedCount;
  }

  function resetVacuumAttraction() {
    activeCoins.forEach((coin) => {
      coin.vacuumOffsetX = 0;
      coin.vacuumOffsetY = 0;
      coin.vacuumAngle = null;
      coin.vacuumRadius = null;
    });
  }

  function discardVacuumingCoins() {
    let discardedCount = 0;

    activeCoins.forEach((coin, id) => {
      if (
        !Number.isFinite(coin.vacuumAngle) ||
        !Number.isFinite(coin.vacuumRadius)
      ) {
        return;
      }

      activeCoins.delete(id);
      discardedCount += 1;
    });

    return discardedCount;
  }

  function collectCoin(id) {
    const coin = activeCoins.get(id);

    if (!coin) {
      return 0;
    }

    activeCoins.delete(id);
    collectedCandyValue += coin.value;
    return coin.value;
  }

  function addCandy(value) {
    const safeValue = Number.isFinite(value)
      ? Math.max(0, Math.floor(value))
      : 0;
    collectedCandyValue += safeValue;
    return safeValue;
  }

  function removeCoin(id) {
    return activeCoins.delete(id);
  }

  function getSnapshot() {
    return Array.from(activeCoins.values(), (coin) => ({ ...coin }));
  }

  function reset() {
    activeCoins.clear();
    collectedCandyValue = 0;
    spawnDuplicateOffsetX = 0;
  }

  return {
    addCandy,
    addCoin,
    collectCoin,
    discardVacuumingCoins,
    disableSpawnDuplication,
    enableSpawnDuplication,
    getCollectedCandyValue: () => collectedCandyValue,
    getSnapshot,
    moveCoins,
    removeCoin,
    reset,
    resetVacuumAttraction,
    updateVacuumAttraction,
  };
}

function approachZero(value, ratio) {
  const nextValue = value * (1 - ratio);
  return Math.abs(nextValue) < 0.01 ? 0 : nextValue;
}
