import {
  COLLECTIBLE_TYPE,
  GAMEPLAY_UNIT_IN_LANE_GAPS,
  LANE_COUNT,
  LANE_ENTITY_KIND,
} from "../shared/contracts.js";

const SPEED_BOOST_GHOST_DURATION_SECONDS = 0.6;
const STANDARD_ITEM_TYPES = [
  COLLECTIBLE_TYPE.BARRIER,
  COLLECTIBLE_TYPE.SCORE_UP,
  COLLECTIBLE_TYPE.OBSTACLE_BREAKER,
  COLLECTIBLE_TYPE.COIN_MAGNET,
];

// Add an entry here when a new item type becomes available for spawning.
export const ITEM_DEFINITIONS = [
  {
    kind: LANE_ENTITY_KIND.ITEM,
    type: COLLECTIBLE_TYPE.SPEED_UP,
    widthRatio: 0.44,
    heightRatio: 0.5,
    bottomOffsetRatio: 0,
    affectsAllLanes: true,
    warningOffsetUnitCount: 3,
    persistAfterTrigger: true,
    triggerAnimationDuration: SPEED_BOOST_GHOST_DURATION_SECONDS,
  },
  ...STANDARD_ITEM_TYPES.map((type) => ({
    kind: LANE_ENTITY_KIND.ITEM,
    type,
    widthRatio: 0.22,
    heightRatio: 0.22,
    bottomOffsetRatio: 0.1,
    triggerAnimationDuration: 0,
  })),
];

const ITEM_DEFINITIONS_BY_TYPE = new Map(
  ITEM_DEFINITIONS.map((definition) => [definition.type, definition]),
);

export function createItemManager() {
  const activeItems = new Map();
  let nextId = 1;

  function addItem({ x, lane, type = COLLECTIBLE_TYPE.SPEED_UP } = {}) {
    const definition = ITEM_DEFINITIONS_BY_TYPE.get(type);

    if (!definition) {
      throw new Error(`Unknown item type: ${type}`);
    }

    if (!Number.isFinite(x)) {
      throw new Error("Item x must be a finite number.");
    }

    if (
      !definition.affectsAllLanes &&
      (!Number.isInteger(lane) || lane < 0 || lane >= LANE_COUNT)
    ) {
      throw new Error(`Item lane must be between 0 and ${LANE_COUNT - 1}.`);
    }

    const item = {
      ...definition,
      id: `item-${nextId}`,
      x,
      lane: definition.affectsAllLanes ? null : lane,
      triggerLane: null,
      isTriggered: false,
      triggerElapsedSeconds: 0,
    };

    nextId += 1;
    activeItems.set(item.id, item);
    return item.id;
  }

  function updateItems(deltaX, deltaSeconds) {
    const safeDeltaX = Number.isFinite(deltaX) ? deltaX : 0;
    const safeDeltaSeconds = Number.isFinite(deltaSeconds)
      ? Math.max(0, deltaSeconds)
      : 0;

    activeItems.forEach((item) => {
      item.x += safeDeltaX;

      if (!item.isTriggered) {
        return;
      }

      item.triggerElapsedSeconds += safeDeltaSeconds;

      if (
        !item.persistAfterTrigger &&
        item.triggerElapsedSeconds >= item.triggerAnimationDuration
      ) {
        activeItems.delete(item.id);
      }
    });
  }

  function triggerItem(id, lanePosition = null) {
    const item = activeItems.get(id);

    if (!item || item.isTriggered) {
      return null;
    }

    item.isTriggered = true;
    item.triggerLane = item.affectsAllLanes
      ? clampLanePosition(lanePosition)
      : item.lane;
    item.triggerElapsedSeconds = 0;
    return { ...item };
  }

  function removeItem(id) {
    return activeItems.delete(id);
  }

  function getSnapshot() {
    return Array.from(activeItems.values(), (item) => ({ ...item }));
  }

  function reset() {
    activeItems.clear();
  }

  return {
    addItem,
    getSnapshot,
    removeItem,
    reset,
    triggerItem,
    updateItems,
  };
}

export function getItemBounds(item, lanes) {
  const laneGap = lanes.getLaneGap();
  const width = laneGap * item.widthRatio;
  const height = laneGap * item.heightRatio;
  const lane = item.triggerLane ?? item.lane;
  const bottom = lanes.getLaneY(lane) - laneGap * item.bottomOffsetRatio;

  return {
    left: item.x - width / 2,
    right: item.x + width / 2,
    top: bottom - height,
    bottom,
    width,
    height,
  };
}

export function getItemWarningX(item, laneGap) {
  const warningOffsetUnitCount = Number.isFinite(item.warningOffsetUnitCount)
    ? Math.max(0, item.warningOffsetUnitCount)
    : 0;

  return (
    item.x -
    laneGap * GAMEPLAY_UNIT_IN_LANE_GAPS * warningOffsetUnitCount
  );
}

function clampLanePosition(lanePosition) {
  const safeLanePosition = Number.isFinite(lanePosition) ? lanePosition : 0;
  return Math.min(LANE_COUNT - 1, Math.max(0, Math.round(safeLanePosition)));
}
