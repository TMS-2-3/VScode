import { COLLECTIBLE_TYPE, LANE_COUNT, LANE_ENTITY_KIND } from "../shared/contracts.js";

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

export function createCoinManager() {
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
    disableSpawnDuplication,
    enableSpawnDuplication,
    getCollectedCandyValue: () => collectedCandyValue,
    getSnapshot,
    moveCoins,
    removeCoin,
    reset,
  };
}
