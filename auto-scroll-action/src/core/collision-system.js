import { PLAYER_SCREEN_X_RATIO } from "../shared/contracts.js";
import { getObstacleBounds } from "../lane/obstacles.js";

export function createCollisionSystem(lanes) {
  function findCollectedCoinIds(player, coins, viewportWidth) {
    const playerBounds = getPlayerBounds(player, lanes, viewportWidth);

    return coins
      .filter((coin) => rectanglesOverlap(playerBounds, getCoinBounds(coin, lanes)))
      .map((coin) => coin.id);
  }

  function findHitObstacleIds(player, obstacles, viewportWidth) {
    const playerBounds = getPlayerBounds(player, lanes, viewportWidth);

    return obstacles
      .filter((obstacle) => rectanglesOverlap(playerBounds, getObstacleBounds(obstacle, lanes)))
      .map((obstacle) => obstacle.id);
  }

  return {
    findCollectedCoinIds,
    findHitObstacleIds,
  };
}

function getPlayerBounds(player, lanes, viewportWidth) {
  const footX = viewportWidth * PLAYER_SCREEN_X_RATIO;
  const footY = lanes.getLaneY(player.lanePosition) - player.elevation;

  return {
    left: footX - player.hitbox.width / 2,
    right: footX + player.hitbox.width / 2,
    top: footY - player.hitbox.height,
    bottom: footY,
  };
}

function getCoinBounds(coin, lanes) {
  const laneGap = lanes.getLaneGap();
  const width = laneGap * coin.widthRatio;
  const height = laneGap * coin.heightRatio;
  const bottom = lanes.getLaneY(coin.lane) - laneGap * coin.bottomOffsetRatio;

  return {
    left: coin.x - width / 2,
    right: coin.x + width / 2,
    top: bottom - height,
    bottom,
  };
}

function rectanglesOverlap(first, second) {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}
