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

    const coin = {
      ...definition,
      id: `coin-${nextId}`,
      x,
      lane,
    };

    nextId += 1;
    activeCoins.set(coin.id, coin);
    return coin.id;
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

  function removeCoin(id) {
    return activeCoins.delete(id);
  }

  function getSnapshot() {
    return Array.from(activeCoins.values(), (coin) => ({ ...coin }));
  }

  function reset() {
    activeCoins.clear();
    collectedCandyValue = 0;
  }

  return {
    addCoin,
    collectCoin,
    getCollectedCandyValue: () => collectedCandyValue,
    getSnapshot,
    moveCoins,
    removeCoin,
    reset,
  };
}
