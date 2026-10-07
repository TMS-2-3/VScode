import {
  COLLECTIBLE_TYPE,
  OBSTACLE_TYPE,
  PLAYER_SCREEN_X_RATIO,
} from "../shared/contracts.js";
import { getObstacleBounds } from "../lane/obstacles.js";

const BACKGROUND_SOURCE_GUIDES = [0, 0.335, 0.55, 0.8, 1];
const BACKGROUND_TARGET_GUIDES = [0, 0.35, 0.6, 0.85, 1];

// Set image paths here when artwork is ready. A null value uses the fallback drawing.
const ASSET_PATHS = Object.freeze({
  background: "./img/halloween-town-background-v9.png",
  coin: null,
  player: null,
  specialCoin: null,
});

export function createRenderer(canvas, lanes) {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context を作成できません。");
  }

  const backgroundImage = loadImage(ASSET_PATHS.background);
  const coinImage = loadImage(ASSET_PATHS.coin);
  const playerImage = loadImage(ASSET_PATHS.player);
  const specialCoinImage = loadImage(ASSET_PATHS.specialCoin);
  let backgroundTravelX = 0;
  let width = 0;
  let height = 0;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    lanes.resize(width, height);
  }

  function render(player, { coins = [], obstacles = [], hitObstacleIds = [] } = {}) {
    drawBackground();
    drawObstacles(obstacles, hitObstacleIds);
    drawCoins(coins);
    drawPlayer(player);
  }

  function drawBackground() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#b8e8ef";
    context.fillRect(0, 0, width, height);

    if (backgroundImage?.complete && backgroundImage.naturalWidth > 0) {
      drawAlignedBackground();
    }
  }

  function drawAlignedBackground() {
    const sourceViewportWidth = Math.min(
      backgroundImage.naturalWidth,
      backgroundImage.naturalHeight * (width / height),
    );
    const sourcePixelsPerCanvasPixel = sourceViewportWidth / width;
    const sourceStartX = normalizeOffset(
      backgroundTravelX * sourcePixelsPerCanvasPixel,
      backgroundImage.naturalWidth,
    );

    for (let index = 0; index < BACKGROUND_SOURCE_GUIDES.length - 1; index += 1) {
      const sourceY = Math.round(backgroundImage.naturalHeight * BACKGROUND_SOURCE_GUIDES[index]);
      const sourceBottom = Math.round(
        backgroundImage.naturalHeight * BACKGROUND_SOURCE_GUIDES[index + 1],
      );
      const targetY = Math.round(height * BACKGROUND_TARGET_GUIDES[index]);
      const targetBottom = Math.round(height * BACKGROUND_TARGET_GUIDES[index + 1]);

      drawWrappedBackgroundBand(
        sourceStartX,
        sourceY,
        sourceViewportWidth,
        sourceBottom - sourceY,
        targetY,
        targetBottom - targetY,
      );
    }
  }

  function drawWrappedBackgroundBand(
    sourceStartX,
    sourceY,
    sourceViewportWidth,
    sourceHeight,
    targetY,
    targetHeight,
  ) {
    let sourceX = sourceStartX;
    let remainingSourceWidth = sourceViewportWidth;
    let targetX = 0;

    while (remainingSourceWidth > 0) {
      const sourceChunkWidth = Math.min(
        remainingSourceWidth,
        backgroundImage.naturalWidth - sourceX,
      );
      const targetChunkWidth =
        sourceChunkWidth >= remainingSourceWidth
          ? width - targetX
          : (width * sourceChunkWidth) / sourceViewportWidth;

      context.drawImage(
        backgroundImage,
        sourceX,
        sourceY,
        sourceChunkWidth,
        sourceHeight,
        targetX,
        targetY,
        targetChunkWidth,
        targetHeight,
      );

      remainingSourceWidth -= sourceChunkWidth;
      targetX += targetChunkWidth;
      sourceX = 0;
    }
  }

  function setBackgroundOffset(offsetX) {
    backgroundTravelX = Number.isFinite(offsetX) ? offsetX : 0;
  }

  function drawPlayer(player) {
    const footX = width * PLAYER_SCREEN_X_RATIO;
    const footY = lanes.getLaneY(player.lanePosition) - player.elevation;

    if (playerImage?.complete && playerImage.naturalWidth > 0) {
      context.drawImage(
        playerImage,
        footX - player.hitbox.width / 2,
        footY - player.hitbox.height,
        player.hitbox.width,
        player.hitbox.height,
      );
      return;
    }

    drawFallbackPlayer(footX, footY, player.hitbox);
  }

  function drawFallbackPlayer(footX, footY, hitbox) {
    context.fillStyle = "#56b6a7";
    context.fillRect(footX - hitbox.width / 2, footY - hitbox.height, hitbox.width, hitbox.height);
  }

  function drawObstacles(obstacles, hitObstacleIds) {
    const hitIds = new Set(hitObstacleIds);

    obstacles.forEach((obstacle) => {
      const bounds = getObstacleBounds(obstacle, lanes);

      context.fillStyle = getFallbackObstacleColor(obstacle.type);
      context.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
      context.lineWidth = Math.max(2, lanes.getLaneGap() * 0.012);
      context.strokeStyle = hitIds.has(obstacle.id) ? "#fff4a8" : "#2b1835";
      context.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);
    });
  }

  function drawCoins(coins) {
    const laneGap = lanes.getLaneGap();

    coins.forEach((coin) => {
      const coinWidth = laneGap * coin.widthRatio;
      const coinHeight = laneGap * coin.heightRatio;
      const bottomY = lanes.getLaneY(coin.lane) - laneGap * coin.bottomOffsetRatio;
      const centerY = bottomY - coinHeight / 2;
      const isSpecialCoin = coin.type === COLLECTIBLE_TYPE.SPECIAL_COIN;
      const coinArtwork = isSpecialCoin ? specialCoinImage : coinImage;

      if (coinArtwork?.complete && coinArtwork.naturalWidth > 0) {
        context.drawImage(
          coinArtwork,
          coin.x - coinWidth / 2,
          centerY - coinHeight / 2,
          coinWidth,
          coinHeight,
        );
        return;
      }

      if (isSpecialCoin) {
        drawFallbackCandyBag(coin.x, centerY, coinWidth, coinHeight);
        return;
      }

      drawFallbackCandy(coin.x, centerY, coinWidth, coinHeight);
    });
  }

  function drawFallbackCandy(centerX, centerY, candyWidth, candyHeight) {
    const bodyHalfWidth = candyWidth * 0.28;
    const bodyHalfHeight = candyHeight * 0.32;
    const outlineWidth = Math.max(1, candyHeight * 0.06);

    context.save();
    context.translate(centerX, centerY);
    context.rotate(-Math.PI / 18);
    context.lineJoin = "round";
    context.lineWidth = outlineWidth;
    context.strokeStyle = "#4b2740";
    context.fillStyle = "#ff9b55";

    context.beginPath();
    context.moveTo(-bodyHalfWidth, -bodyHalfHeight * 0.72);
    context.lineTo(-candyWidth / 2, -candyHeight * 0.34);
    context.lineTo(-candyWidth * 0.44, candyHeight * 0.35);
    context.lineTo(-bodyHalfWidth, bodyHalfHeight * 0.72);
    context.closePath();
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(bodyHalfWidth, -bodyHalfHeight * 0.72);
    context.lineTo(candyWidth / 2, -candyHeight * 0.34);
    context.lineTo(candyWidth * 0.44, candyHeight * 0.35);
    context.lineTo(bodyHalfWidth, bodyHalfHeight * 0.72);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = "#ee5f72";
    context.beginPath();
    context.ellipse(0, 0, bodyHalfWidth, bodyHalfHeight, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "rgba(255, 244, 210, 0.82)";
    context.beginPath();
    context.ellipse(
      -bodyHalfWidth * 0.3,
      -bodyHalfHeight * 0.3,
      bodyHalfWidth * 0.2,
      bodyHalfHeight * 0.18,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.restore();
  }

  function drawFallbackCandyBag(centerX, centerY, bagWidth, bagHeight) {
    const outlineWidth = Math.max(1, bagHeight * 0.05);

    context.save();
    context.translate(centerX, centerY);
    context.rotate(Math.PI / 40);
    context.lineJoin = "round";
    context.lineWidth = outlineWidth;
    context.strokeStyle = "#3f2444";
    context.fillStyle = "#7652a8";

    context.beginPath();
    context.moveTo(-bagWidth * 0.18, -bagHeight * 0.48);
    context.lineTo(bagWidth * 0.18, -bagHeight * 0.48);
    context.lineTo(bagWidth * 0.12, -bagHeight * 0.32);
    context.quadraticCurveTo(bagWidth * 0.4, -bagHeight * 0.2, bagWidth * 0.4, bagHeight * 0.3);
    context.quadraticCurveTo(bagWidth * 0.34, bagHeight * 0.48, 0, bagHeight * 0.48);
    context.quadraticCurveTo(-bagWidth * 0.34, bagHeight * 0.48, -bagWidth * 0.4, bagHeight * 0.3);
    context.quadraticCurveTo(-bagWidth * 0.4, -bagHeight * 0.2, -bagWidth * 0.12, -bagHeight * 0.32);
    context.closePath();
    context.fill();
    context.stroke();

    const candies = [
      { x: -0.2, y: 0.03, color: "#ff765f" },
      { x: 0.16, y: -0.02, color: "#ffd45c" },
      { x: -0.08, y: 0.27, color: "#59c7bd" },
      { x: 0.23, y: 0.25, color: "#f28ac4" },
    ];

    candies.forEach((candy) => {
      context.fillStyle = candy.color;
      context.beginPath();
      context.arc(
        bagWidth * candy.x,
        bagHeight * candy.y,
        bagWidth * 0.09,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.stroke();
    });

    context.fillStyle = "#f3a447";
    context.beginPath();
    context.ellipse(-bagWidth * 0.1, -bagHeight * 0.34, bagWidth * 0.12, bagHeight * 0.07, -0.35, 0, Math.PI * 2);
    context.ellipse(bagWidth * 0.1, -bagHeight * 0.34, bagWidth * 0.12, bagHeight * 0.07, 0.35, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "#ffd16e";
    context.beginPath();
    context.arc(0, -bagHeight * 0.34, bagWidth * 0.06, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.fillStyle = "rgba(255, 255, 255, 0.22)";
    context.beginPath();
    context.ellipse(-bagWidth * 0.22, bagHeight * 0.05, bagWidth * 0.06, bagHeight * 0.2, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  return {
    render,
    resize,
    setBackgroundOffset,
  };
}

function normalizeOffset(offset, period) {
  return ((offset % period) + period) % period;
}

function getFallbackObstacleColor(type) {
  if (type === OBSTACLE_TYPE.JUMP) {
    return "rgba(239, 147, 53, 0.82)";
  }

  if (type === OBSTACLE_TYPE.DUCK) {
    return "rgba(112, 88, 181, 0.82)";
  }

  return "rgba(190, 61, 76, 0.82)";
}

function loadImage(path) {
  if (!path) {
    return null;
  }

  const image = new Image();
  image.src = path;
  return image;
}
