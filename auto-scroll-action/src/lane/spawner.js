import {
  COLLECTIBLE_TYPE,
  LANE_COUNT,
  LANE_ENTITY_KIND,
  OBSTACLE_TYPE,
} from "../shared/contracts.js";
import { COIN_DEFINITIONS } from "./coins.js";
import { ITEM_DEFINITIONS } from "./items.js";
import { OBSTACLE_DEFINITIONS } from "./obstacles.js";

export { PLACEMENT_PATTERNS } from "./patterns.js";

// A future spawn system can select definitions from these arrays.
export const SPAWN_POOLS = {
  [LANE_ENTITY_KIND.OBSTACLE]: OBSTACLE_DEFINITIONS,
  [LANE_ENTITY_KIND.COIN]: COIN_DEFINITIONS,
  [LANE_ENTITY_KIND.ITEM]: ITEM_DEFINITIONS,
};

export const OBSTACLE_PATTERNS = Object.freeze([
  Object.freeze([0, 2]),
  Object.freeze([0, 1]),
  Object.freeze([1, 2]),
  Object.freeze([0]),
  Object.freeze([1]),
  Object.freeze([2]),
]);

const PATTERN_SPACING_RATIO = 0.36;
const INITIAL_PATTERN_OFFSET_RATIO = 0.56;

export function createObstacleSpawner(obstacleManager, coinManager) {
  let nextSpawnDistance = null;
  let previousPatternIndex = -1;
  let patternCount = 0;

  function choosePatternIndex() {
    const candidates = OBSTACLE_PATTERNS.map((_, index) => index)
      .filter((index) => index !== previousPatternIndex);
    const selectedIndex = candidates[Math.floor(Math.random() * candidates.length)];
    previousPatternIndex = selectedIndex;
    return selectedIndex;
  }

  function update(traveledDistance, viewportWidth, laneGap) {
    if (
      !Number.isFinite(traveledDistance) ||
      !Number.isFinite(viewportWidth) ||
      viewportWidth <= 0
    ) {
      return;
    }

    if (nextSpawnDistance === null) {
      nextSpawnDistance = traveledDistance - viewportWidth * INITIAL_PATTERN_OFFSET_RATIO;
    }

    const spacing = Math.max(viewportWidth * PATTERN_SPACING_RATIO, laneGap * 0.72);
    while (nextSpawnDistance <= traveledDistance + viewportWidth) {
      const x = viewportWidth + nextSpawnDistance - traveledDistance;
      const patternIndex = choosePatternIndex();
      const pattern = OBSTACLE_PATTERNS[patternIndex];
      pattern.forEach((lane) => {
        obstacleManager.addObstacle({ x, lane, type: OBSTACLE_TYPE.LANE_BLOCKER });
      });
      patternCount += 1;

      if (patternCount % 2 === 0) {
        const openLanes = Array.from({ length: LANE_COUNT }, (_, lane) => lane)
          .filter((lane) => !pattern.includes(lane));
        const lane = openLanes[Math.floor(Math.random() * openLanes.length)];
        coinManager.addCoin({ x, lane, type: COLLECTIBLE_TYPE.COIN });
      }

      nextSpawnDistance += spacing;
    }

    obstacleManager.getSnapshot().forEach((obstacle) => {
      if (obstacle.x < -laneGap) {
        obstacleManager.removeObstacle(obstacle.id);
      }
    });
    coinManager.getSnapshot().forEach((coin) => {
      if (coin.x < -laneGap) {
        coinManager.removeCoin(coin.id);
      }
    });
  }

  function reset() {
    nextSpawnDistance = null;
    previousPatternIndex = -1;
    patternCount = 0;
    obstacleManager.reset();
    coinManager.reset();
  }

  return { reset, update };
}
