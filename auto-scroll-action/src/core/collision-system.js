import {
  COLLECTIBLE_TYPE,
  PLAYER_SCREEN_X_RATIO,
} from "../shared/contracts.js";
import { getItemBounds } from "../lane/items.js";
import { getObstacleBounds } from "../lane/obstacles.js";

export function createCollisionSystem(lanes) {
  function findCollectedCoinIds(player, coins, viewportWidth) {
    const playerBounds = getPlayerBounds(player, lanes, viewportWidth);

    return coins
      .filter((coin) => circleOverlapsRectangle(getCoinCircle(coin, lanes), playerBounds))
      .map((coin) => coin.id);
  }

  function findHitObstacleIds(player, obstacles, viewportWidth) {
    const playerBounds = getPlayerBounds(player, lanes, viewportWidth);

    return obstacles
      .filter((obstacle) => rectanglesOverlap(playerBounds, getObstacleBounds(obstacle, lanes)))
      .map((obstacle) => obstacle.id);
  }

  function findTriggeredItemIds(player, items, viewportWidth) {
    const playerBounds = getPlayerBounds(player, lanes, viewportWidth);
    const playerX = viewportWidth * PLAYER_SCREEN_X_RATIO;

    return items
      .filter(
        (item) =>
          !item.isTriggered &&
          (item.type === COLLECTIBLE_TYPE.SPEED_UP
            ? item.x <= playerX
            : rectanglesOverlap(playerBounds, getItemBounds(item, lanes))),
      )
      .map((item) => item.id);
  }

  return {
    findCollectedCoinIds,
    findHitObstacleIds,
    findTriggeredItemIds,
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

function getCoinCircle(coin, lanes) {
  const laneGap = lanes.getLaneGap();

  return {
    x: coin.x,
    y: lanes.getLaneY(coin.lane) - laneGap * coin.elevationRatio,
    radius: laneGap * coin.pickupRadiusRatio,
  };
}

function circleOverlapsRectangle(circle, rectangle) {
  const closestX = Math.max(rectangle.left, Math.min(circle.x, rectangle.right));
  const closestY = Math.max(rectangle.top, Math.min(circle.y, rectangle.bottom));
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;

  return distanceX * distanceX + distanceY * distanceY < circle.radius * circle.radius;
}

function rectanglesOverlap(first, second) {
  return (
    first.left < second.right &&
    first.right > second.left &&
    first.top < second.bottom &&
    first.bottom > second.top
  );
}
