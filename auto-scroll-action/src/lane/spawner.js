import {
  COLLECTIBLE_TYPE,
  LANE_ENTITY_KIND,
} from "../shared/contracts.js";
import { COIN_DEFINITIONS } from "./coins.js";
import { ITEM_DEFINITIONS } from "./items.js";
import { OBSTACLE_DEFINITIONS } from "./obstacles.js";
import {
  choosePlacementPattern,
  getInitialSpawnDistance,
  getPatternSpacing,
  PLACEMENT_PATTERNS,
} from "./patterns.js";

export { PLACEMENT_PATTERNS };

// 各種類の定義を一覧で参照したいときに使います。
export const SPAWN_POOLS = {
  [LANE_ENTITY_KIND.OBSTACLE]: OBSTACLE_DEFINITIONS,
  [LANE_ENTITY_KIND.COIN]: COIN_DEFINITIONS,
  [LANE_ENTITY_KIND.ITEM]: ITEM_DEFINITIONS,
};

export const INTER_PATTERN_ITEM_RULES = Object.freeze({
  speedBoostChance: 0.25,
});

export function createObstacleSpawner(
  obstacleManager,
  coinManager,
  itemManager = null,
  random = Math.random,
) {
  let nextSpawnDistance = null;
  let previousPatternId = null;

  function update(traveledDistance, viewportWidth, laneGap) {
    if (
      !Number.isFinite(traveledDistance) ||
      !Number.isFinite(viewportWidth) ||
      viewportWidth <= 0 ||
      !Number.isFinite(laneGap) ||
      laneGap <= 0
    ) {
      return;
    }

    if (nextSpawnDistance === null) {
      nextSpawnDistance = getInitialSpawnDistance(traveledDistance, viewportWidth);
    }

    while (nextSpawnDistance <= traveledDistance + viewportWidth) {
      const x = viewportWidth + nextSpawnDistance - traveledDistance;
      const pattern = choosePlacementPattern(previousPatternId, random);
      previousPatternId = pattern.id;
      pattern.objects.forEach((object) => {
        const objectX = x + object.distanceRatio * laneGap;

        if (object.kind === LANE_ENTITY_KIND.OBSTACLE) {
          obstacleManager.addObstacle({ x: objectX, lane: object.lane, type: object.type });
        } else if (object.kind === LANE_ENTITY_KIND.COIN) {
          coinManager.addCoin({ x: objectX, lane: object.lane, type: object.type });
        }
      });
      const patternSpacing = getPatternSpacing(pattern, viewportWidth, laneGap);

      if (itemManager && random() < INTER_PATTERN_ITEM_RULES.speedBoostChance) {
        const patternEndX = x + pattern.lengthRatio * laneGap;
        const nextPatternStartX = x + patternSpacing;

        itemManager.addItem({
          x: (patternEndX + nextPatternStartX) / 2,
          type: COLLECTIBLE_TYPE.SPEED_UP,
        });
      }

      nextSpawnDistance += patternSpacing;
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
    itemManager?.getSnapshot().forEach((item) => {
      if (item.x < -laneGap) {
        itemManager.removeItem(item.id);
      }
    });
  }

  function reset() {
    nextSpawnDistance = null;
    previousPatternId = null;
    obstacleManager.reset();
    coinManager.reset();
    itemManager?.reset();
  }

  return { reset, update };
}
