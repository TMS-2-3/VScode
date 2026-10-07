import { LANE_ENTITY_KIND } from "../shared/contracts.js";
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

export function createObstacleSpawner(obstacleManager, coinManager) {
  let nextSpawnDistance = null;
  let previousPatternId = null;

  function update(traveledDistance, viewportWidth, laneGap) {
    if (
      !Number.isFinite(traveledDistance) ||
      !Number.isFinite(viewportWidth) ||
      viewportWidth <= 0
    ) {
      return;
    }

    if (nextSpawnDistance === null) {
      nextSpawnDistance = getInitialSpawnDistance(traveledDistance, viewportWidth);
    }

    while (nextSpawnDistance <= traveledDistance + viewportWidth) {
      const x = viewportWidth + nextSpawnDistance - traveledDistance;
      const pattern = choosePlacementPattern(previousPatternId);
      previousPatternId = pattern.id;
      pattern.objects.forEach((object) => {
        const objectX = x + object.distanceRatio * laneGap;

        if (object.kind === LANE_ENTITY_KIND.OBSTACLE) {
          obstacleManager.addObstacle({ x: objectX, lane: object.lane, type: object.type });
        } else if (object.kind === LANE_ENTITY_KIND.COIN) {
          coinManager.addCoin({ x: objectX, lane: object.lane, type: object.type });
        }
      });
      nextSpawnDistance += getPatternSpacing(pattern, viewportWidth, laneGap);
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
    previousPatternId = null;
    obstacleManager.reset();
    coinManager.reset();
  }

  return { reset, update };
}
