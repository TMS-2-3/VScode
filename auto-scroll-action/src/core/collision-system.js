import {
  COLLECTIBLE_TYPE,
  PLAYER_SCREEN_X_RATIO,
} from "../shared/contracts.js";
import { getItemBounds, getItemWarningX } from "../lane/items.js";
import { getObstacleBounds } from "../lane/obstacles.js";

export function createCollisionSystem(lanes) {
  function findCollectedCoinIds(player, coins, viewportWidth) {
    const playerBounds = getPlayerBounds(player, lanes, viewportWidth);

    return coins
      .filter((coin) => circleOverlapsRectangle(getCoinCircle(coin, lanes), playerBounds))
      .map((coin) => coin.id);
  }

  function findCollectedPartyCandyIds(player, candies, viewportWidth) {
    const playerBounds = getPlayerBounds(player, lanes, viewportWidth);

    return candies
      .filter((candy) => circleOverlapsRectangle(candy, playerBounds))
      .map((candy) => candy.id);
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
          (item.type === COLLECTIBLE_TYPE.CAMERA_PRANK
            ? getItemWarningX(item, lanes.getLaneGap()) <= playerX
            : item.affectsAllLanes
            ? item.x <= playerX
            : rectanglesOverlap(playerBounds, getItemBounds(item, lanes))),
      )
      .map((item) => item.id);
  }

  function findReachedSupplyStationIds(stations, viewportWidth) {
    const playerX = viewportWidth * PLAYER_SCREEN_X_RATIO;

    return stations
      .filter((station) => !station.isTriggered && station.x <= playerX)
      .map((station) => station.id);
  }

  return {
    findCollectedCoinIds,
    findCollectedPartyCandyIds,
    findHitObstacleIds,
    findReachedSupplyStationIds,
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
  const offsetX = Number.isFinite(coin.vacuumOffsetX) ? coin.vacuumOffsetX : 0;
  const offsetY = Number.isFinite(coin.vacuumOffsetY) ? coin.vacuumOffsetY : 0;

  return {
    x: coin.x + offsetX,
    y: lanes.getLaneY(coin.lane) - laneGap * coin.elevationRatio + offsetY,
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
