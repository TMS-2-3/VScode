import {
  COLLECTIBLE_TYPE,
  LANE_COUNT,
  OBSTACLE_TYPE,
  PLAYER_SCREEN_X_RATIO,
} from "../shared/contracts.js";
import { getItemBounds, getItemWarningX } from "../lane/items.js";
import { getObstacleBounds } from "../lane/obstacles.js";

const BACKGROUND_SOURCE_GUIDES = [0, 0.335, 0.55, 0.8, 1];
const BACKGROUND_TARGET_GUIDES = [0, 0.35, 0.6, 0.85, 1];

// Set image paths here when artwork is ready. A null value uses the fallback drawing.
const ASSET_PATHS = Object.freeze({
  background: "./img/back/halloween-town-background-v9.png",
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
  let backgroundCache = null;
  let backgroundCacheLogicalWidth = 0;
  let pixelRatio = 1;
  let width = 0;
  let height = 0;
  const spriteCache = new Map();

  backgroundImage?.addEventListener?.("load", rebuildBackgroundCache);

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    lanes.resize(width, height);
    spriteCache.clear();
    rebuildBackgroundCache();
  }

  function render(
    player,
    {
      candyLauncher = null,
      candyParty = null,
      coins = [],
      items = [],
      obstacles = [],
      pumpkinBarrier = null,
      supplyStations = [],
      hitObstacleIds = [],
    } = {},
  ) {
    drawBackground();
    drawSupplyStations(supplyStations);
    drawItemWarnings(items);
    drawObstacles(obstacles, hitObstacleIds);
    drawCoins(coins);
    drawCandyParty(candyParty);
    drawCandyLauncherWorld(candyLauncher);
    drawPlayer(player);
    drawPumpkinBarrierShell(player, pumpkinBarrier);
    drawPumpkinBarrierTimer(player, pumpkinBarrier);
    drawCandyLauncherHeld(candyLauncher, player);
    drawItems(items);
    drawCandyLauncherCountdown(candyLauncher);
  }

  function drawBackground() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#b8e8ef";
    context.fillRect(0, 0, width, height);

    if (backgroundImage?.complete && backgroundImage.naturalWidth > 0) {
      if (!backgroundCache) {
        rebuildBackgroundCache();
      }

      if (backgroundCache) {
        drawCachedBackground();
      } else {
        drawUncachedAlignedBackground();
      }
    }
  }

  function rebuildBackgroundCache() {
    backgroundCache = null;
    backgroundCacheLogicalWidth = 0;

    if (
      !backgroundImage?.complete ||
      backgroundImage.naturalWidth <= 0 ||
      width <= 0 ||
      height <= 0
    ) {
      return;
    }

    const sourceViewportWidth = Math.min(
      backgroundImage.naturalWidth,
      backgroundImage.naturalHeight * (width / height),
    );
    const sourcePixelsPerCanvasPixel = sourceViewportWidth / width;
    const requestedLogicalWidth =
      backgroundImage.naturalWidth / sourcePixelsPerCanvasPixel;
    const cache = createCacheCanvas(
      Math.max(1, Math.ceil(requestedLogicalWidth * pixelRatio)),
      Math.max(1, Math.ceil(height * pixelRatio)),
    );
    const cacheContext = cache?.getContext("2d");

    if (!cache || !cacheContext) {
      return;
    }

    backgroundCacheLogicalWidth = cache.width / pixelRatio;
    cacheContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    cacheContext.imageSmoothingEnabled = true;
    cacheContext.imageSmoothingQuality = "high";

    for (let index = 0; index < BACKGROUND_SOURCE_GUIDES.length - 1; index += 1) {
      const sourceY = Math.round(backgroundImage.naturalHeight * BACKGROUND_SOURCE_GUIDES[index]);
      const sourceBottom = Math.round(
        backgroundImage.naturalHeight * BACKGROUND_SOURCE_GUIDES[index + 1],
      );
      const targetY = Math.round(height * BACKGROUND_TARGET_GUIDES[index]);
      const targetBottom = Math.round(height * BACKGROUND_TARGET_GUIDES[index + 1]);

      cacheContext.drawImage(
        backgroundImage,
        0,
        sourceY,
        backgroundImage.naturalWidth,
        sourceBottom - sourceY,
        0,
        targetY,
        backgroundCacheLogicalWidth,
        targetBottom - targetY,
      );
    }

    backgroundCache = cache;
  }

  function drawCachedBackground() {
    const offsetX = normalizeOffset(
      backgroundTravelX,
      backgroundCacheLogicalWidth,
    );

    for (
      let targetX = -offsetX;
      targetX < width;
      targetX += backgroundCacheLogicalWidth
    ) {
      context.drawImage(
        backgroundCache,
        targetX,
        0,
        backgroundCacheLogicalWidth,
        height,
      );
    }
  }

  function drawUncachedAlignedBackground() {
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

  function createCacheCanvas(cacheWidth, cacheHeight) {
    if (typeof OffscreenCanvas === "function") {
      return new OffscreenCanvas(cacheWidth, cacheHeight);
    }

    const ownerDocument =
      canvas.ownerDocument ??
      (typeof document === "undefined" ? null : document);
    const cache = ownerDocument?.createElement?.("canvas");

    if (!cache) {
      return null;
    }

    cache.width = cacheWidth;
    cache.height = cacheHeight;
    return cache;
  }

  function getCachedSprite(key, contentWidth, contentHeight, padding, paint) {
    const cachedSprite = spriteCache.get(key);

    if (cachedSprite) {
      return cachedSprite;
    }

    const safePadding = Math.max(0, padding);
    const cache = createCacheCanvas(
      Math.max(1, Math.ceil((contentWidth + safePadding * 2) * pixelRatio)),
      Math.max(1, Math.ceil((contentHeight + safePadding * 2) * pixelRatio)),
    );
    const cacheContext = cache?.getContext("2d");

    if (!cache || !cacheContext) {
      return null;
    }

    cacheContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    cacheContext.imageSmoothingEnabled = true;
    cacheContext.imageSmoothingQuality = "high";
    cacheContext.translate(safePadding, safePadding);
    paint(cacheContext, contentWidth, contentHeight);

    const sprite = {
      canvas: cache,
      contentHeight,
      contentWidth,
      logicalHeight: cache.height / pixelRatio,
      logicalWidth: cache.width / pixelRatio,
      padding: safePadding,
    };
    spriteCache.set(key, sprite);
    return sprite;
  }

  function drawCachedSprite(
    sprite,
    contentLeft,
    contentTop,
    targetContentWidth = sprite?.contentWidth,
    targetContentHeight = sprite?.contentHeight,
  ) {
    if (!sprite || targetContentWidth <= 0 || targetContentHeight <= 0) {
      return;
    }

    const scaleX = targetContentWidth / sprite.contentWidth;
    const scaleY = targetContentHeight / sprite.contentHeight;

    context.drawImage(
      sprite.canvas,
      contentLeft - sprite.padding * scaleX,
      contentTop - sprite.padding * scaleY,
      sprite.logicalWidth * scaleX,
      sprite.logicalHeight * scaleY,
    );
  }

  function drawCachedSpriteCentered(
    sprite,
    centerX,
    centerY,
    targetContentWidth = sprite?.contentWidth,
    targetContentHeight = sprite?.contentHeight,
  ) {
    drawCachedSprite(
      sprite,
      centerX - targetContentWidth / 2,
      centerY - targetContentHeight / 2,
      targetContentWidth,
      targetContentHeight,
    );
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

  function drawPumpkinBarrierShell(player, barrier) {
    if (!barrier?.isActive) {
      return;
    }

    const laneGap = lanes.getLaneGap();
    const footX = width * PLAYER_SCREEN_X_RATIO;
    const footY = lanes.getLaneY(player.lanePosition) - player.elevation;
    const animationTime = performance.now() / 1000;
    const pulse = 1 + Math.sin(animationTime * 4.5) * 0.015;
    const shellWidth = laneGap * 0.54;
    const shellHeight = laneGap * 0.66;
    const centerY = footY - shellHeight * 0.43;
    const shellSprite = getCachedSprite(
      "pumpkin-barrier-shell-detailed",
      shellWidth,
      shellHeight,
      laneGap * 0.055,
      paintPumpkinBarrierShell,
    );

    context.save();
    context.globalAlpha = 0.96;
    drawCachedSpriteCentered(
      shellSprite,
      footX,
      centerY,
      shellWidth * pulse,
      shellHeight * pulse,
    );
    context.restore();
  }

  function paintPumpkinBarrierShell(
    spriteContext,
    shellWidth,
    shellHeight,
  ) {
    const centerX = shellWidth / 2;
    const centerY = shellHeight * 0.57;
    const bodyWidth = shellWidth * 0.9;
    const bodyHeight = shellHeight * 0.72;
    const topY = centerY - bodyHeight / 2;
    const bottomY = centerY + bodyHeight / 2;
    const darkOutline = Math.max(2, shellWidth * 0.055);

    spriteContext.save();
    spriteContext.lineJoin = "round";
    spriteContext.lineCap = "round";

    const stemGradient = spriteContext.createLinearGradient(
      centerX - shellWidth * 0.08,
      topY,
      centerX + shellWidth * 0.09,
      topY,
    );
    stemGradient.addColorStop(0, "#36542d");
    stemGradient.addColorStop(0.5, "#739c45");
    stemGradient.addColorStop(1, "#293d2b");
    spriteContext.fillStyle = stemGradient;
    spriteContext.strokeStyle = "#30283a";
    spriteContext.lineWidth = darkOutline * 0.7;
    spriteContext.beginPath();
    spriteContext.moveTo(centerX - shellWidth * 0.06, topY + shellHeight * 0.04);
    spriteContext.bezierCurveTo(
      centerX - shellWidth * 0.09,
      topY - shellHeight * 0.12,
      centerX + shellWidth * 0.08,
      topY - shellHeight * 0.2,
      centerX + shellWidth * 0.05,
      topY + shellHeight * 0.035,
    );
    spriteContext.closePath();
    spriteContext.fill();
    spriteContext.stroke();

    spriteContext.fillStyle = "rgba(104, 150, 60, 0.88)";
    spriteContext.beginPath();
    spriteContext.moveTo(centerX + shellWidth * 0.02, topY - shellHeight * 0.06);
    spriteContext.quadraticCurveTo(
      centerX + shellWidth * 0.2,
      topY - shellHeight * 0.17,
      centerX + shellWidth * 0.25,
      topY - shellHeight * 0.02,
    );
    spriteContext.quadraticCurveTo(
      centerX + shellWidth * 0.13,
      topY + shellHeight * 0.01,
      centerX + shellWidth * 0.02,
      topY - shellHeight * 0.06,
    );
    spriteContext.fill();
    spriteContext.stroke();

    spriteContext.strokeStyle = "rgba(91, 139, 59, 0.9)";
    spriteContext.lineWidth = Math.max(1.5, shellWidth * 0.025);
    spriteContext.beginPath();
    spriteContext.moveTo(centerX + shellWidth * 0.06, topY - shellHeight * 0.07);
    spriteContext.bezierCurveTo(
      centerX + shellWidth * 0.3,
      topY - shellHeight * 0.22,
      centerX + shellWidth * 0.36,
      topY + shellHeight * 0.05,
      centerX + shellWidth * 0.27,
      topY + shellHeight * 0.04,
    );
    spriteContext.stroke();

    const bodyGradient = spriteContext.createRadialGradient(
      centerX - bodyWidth * 0.2,
      centerY - bodyHeight * 0.24,
      0,
      centerX,
      centerY,
      bodyWidth * 0.62,
    );
    bodyGradient.addColorStop(0, "rgba(255, 197, 74, 0.48)");
    bodyGradient.addColorStop(0.48, "rgba(244, 126, 34, 0.33)");
    bodyGradient.addColorStop(1, "rgba(126, 55, 104, 0.28)");
    spriteContext.fillStyle = bodyGradient;
    spriteContext.strokeStyle = "rgba(55, 31, 55, 0.94)";
    spriteContext.lineWidth = darkOutline;
    spriteContext.shadowColor = "rgba(255, 173, 54, 0.52)";
    spriteContext.shadowBlur = shellWidth * 0.08;
    spriteContext.beginPath();
    spriteContext.moveTo(centerX, topY);
    spriteContext.bezierCurveTo(
      centerX - bodyWidth * 0.2,
      topY - bodyHeight * 0.09,
      centerX - bodyWidth * 0.52,
      topY + bodyHeight * 0.16,
      centerX - bodyWidth / 2,
      centerY,
    );
    spriteContext.bezierCurveTo(
      centerX - bodyWidth * 0.5,
      bottomY - bodyHeight * 0.15,
      centerX - bodyWidth * 0.19,
      bottomY + bodyHeight * 0.08,
      centerX,
      bottomY,
    );
    spriteContext.bezierCurveTo(
      centerX + bodyWidth * 0.19,
      bottomY + bodyHeight * 0.08,
      centerX + bodyWidth * 0.5,
      bottomY - bodyHeight * 0.15,
      centerX + bodyWidth / 2,
      centerY,
    );
    spriteContext.bezierCurveTo(
      centerX + bodyWidth * 0.52,
      topY + bodyHeight * 0.16,
      centerX + bodyWidth * 0.2,
      topY - bodyHeight * 0.09,
      centerX,
      topY,
    );
    spriteContext.closePath();
    spriteContext.fill();
    spriteContext.stroke();
    spriteContext.shadowBlur = 0;

    spriteContext.strokeStyle = "rgba(255, 214, 105, 0.92)";
    spriteContext.lineWidth = Math.max(1.5, shellWidth * 0.02);
    spriteContext.stroke();

    [-0.3, -0.15, 0.15, 0.3].forEach((ribRatio) => {
      const ribX = bodyWidth * ribRatio;
      spriteContext.strokeStyle = "rgba(105, 45, 82, 0.58)";
      spriteContext.lineWidth = Math.max(1, shellWidth * 0.018);
      spriteContext.beginPath();
      spriteContext.moveTo(centerX + ribX * 0.25, topY + bodyHeight * 0.03);
      spriteContext.bezierCurveTo(
        centerX + ribX * 1.22,
        centerY - bodyHeight * 0.28,
        centerX + ribX * 1.18,
        centerY + bodyHeight * 0.3,
        centerX + ribX * 0.3,
        bottomY - bodyHeight * 0.02,
      );
      spriteContext.stroke();

      spriteContext.strokeStyle = "rgba(255, 205, 91, 0.34)";
      spriteContext.lineWidth = Math.max(1, shellWidth * 0.009);
      spriteContext.beginPath();
      spriteContext.moveTo(
        centerX + ribX * 0.25 - shellWidth * 0.008,
        topY + bodyHeight * 0.04,
      );
      spriteContext.bezierCurveTo(
        centerX + ribX * 1.18 - shellWidth * 0.008,
        centerY - bodyHeight * 0.26,
        centerX + ribX * 1.14 - shellWidth * 0.008,
        centerY + bodyHeight * 0.28,
        centerX + ribX * 0.3 - shellWidth * 0.008,
        bottomY - bodyHeight * 0.03,
      );
      spriteContext.stroke();
    });

    spriteContext.fillStyle = "rgba(255, 247, 190, 0.24)";
    spriteContext.beginPath();
    spriteContext.ellipse(
      centerX - bodyWidth * 0.26,
      centerY - bodyHeight * 0.22,
      bodyWidth * 0.07,
      bodyHeight * 0.18,
      -0.35,
      0,
      Math.PI * 2,
    );
    spriteContext.fill();

    spriteContext.fillStyle = "rgba(58, 29, 53, 0.5)";
    spriteContext.strokeStyle = "rgba(255, 218, 105, 0.58)";
    spriteContext.lineWidth = Math.max(1, shellWidth * 0.012);
    spriteContext.shadowColor = "rgba(255, 192, 64, 0.65)";
    spriteContext.shadowBlur = shellWidth * 0.035;
    spriteContext.beginPath();
    spriteContext.moveTo(centerX - bodyWidth * 0.31, centerY - bodyHeight * 0.09);
    spriteContext.lineTo(centerX - bodyWidth * 0.14, centerY - bodyHeight * 0.16);
    spriteContext.lineTo(centerX - bodyWidth * 0.18, centerY + bodyHeight * 0.01);
    spriteContext.closePath();
    spriteContext.moveTo(centerX + bodyWidth * 0.31, centerY - bodyHeight * 0.09);
    spriteContext.lineTo(centerX + bodyWidth * 0.14, centerY - bodyHeight * 0.16);
    spriteContext.lineTo(centerX + bodyWidth * 0.18, centerY + bodyHeight * 0.01);
    spriteContext.closePath();
    spriteContext.fill();
    spriteContext.stroke();

    spriteContext.beginPath();
    spriteContext.moveTo(centerX - bodyWidth * 0.27, centerY + bodyHeight * 0.14);
    spriteContext.lineTo(centerX - bodyWidth * 0.14, centerY + bodyHeight * 0.2);
    spriteContext.lineTo(centerX - bodyWidth * 0.04, centerY + bodyHeight * 0.15);
    spriteContext.lineTo(centerX + bodyWidth * 0.05, centerY + bodyHeight * 0.21);
    spriteContext.lineTo(centerX + bodyWidth * 0.15, centerY + bodyHeight * 0.15);
    spriteContext.lineTo(centerX + bodyWidth * 0.27, centerY + bodyHeight * 0.14);
    spriteContext.quadraticCurveTo(
      centerX,
      centerY + bodyHeight * 0.36,
      centerX - bodyWidth * 0.27,
      centerY + bodyHeight * 0.14,
    );
    spriteContext.closePath();
    spriteContext.fill();
    spriteContext.stroke();
    spriteContext.shadowBlur = 0;

    const textureMarks = [
      [-0.36, -0.02, 0.018],
      [-0.24, 0.28, 0.014],
      [0.33, 0.18, 0.018],
      [0.39, -0.13, 0.012],
    ];
    spriteContext.fillStyle = "rgba(255, 220, 122, 0.46)";
    textureMarks.forEach(([xRatio, yRatio, radiusRatio]) => {
      spriteContext.beginPath();
      spriteContext.arc(
        centerX + bodyWidth * xRatio,
        centerY + bodyHeight * yRatio,
        shellWidth * radiusRatio,
        0,
        Math.PI * 2,
      );
      spriteContext.fill();
    });

    spriteContext.restore();
  }

  function drawPumpkinBarrierTimer(player, barrier) {
    if (!barrier?.isActive) {
      return;
    }

    const laneGap = lanes.getLaneGap();
    const footX = width * PLAYER_SCREEN_X_RATIO;
    const footY = lanes.getLaneY(player.lanePosition) - player.elevation;
    const timerWidth = laneGap * 0.34;
    const timerHeight = laneGap * 0.15;
    const timerLeft = footX + laneGap * 0.24;
    const timerTop =
      footY - Math.max(player.hitbox.height, laneGap * 0.64) - timerHeight * 0.3;
    const fontSize = Math.max(12, laneGap * 0.075);
    const timerText = `${Math.max(0, barrier.remainingSeconds).toFixed(1)}s`;

    context.save();
    context.fillStyle = "rgba(52, 31, 55, 0.9)";
    context.strokeStyle = "#f28a32";
    context.lineWidth = Math.max(1.5, laneGap * 0.01);
    context.beginPath();
    context.roundRect(
      timerLeft,
      timerTop,
      timerWidth,
      timerHeight,
      Math.min(6, timerHeight * 0.24),
    );
    context.fill();
    context.stroke();
    context.fillStyle = "#fff4d2";
    context.font = `900 ${fontSize}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
      timerText,
      timerLeft + timerWidth / 2,
      timerTop + timerHeight / 2,
    );
    context.restore();
  }

  function drawFallbackPlayer(footX, footY, hitbox) {
    const sprite = getCachedSprite(
      `player:${hitbox.width}:${hitbox.height}`,
      hitbox.width,
      hitbox.height,
      0,
      (spriteContext, spriteWidth, spriteHeight) => {
        spriteContext.fillStyle = "#56b6a7";
        spriteContext.fillRect(0, 0, spriteWidth, spriteHeight);
      },
    );

    drawCachedSprite(
      sprite,
      footX - hitbox.width / 2,
      footY - hitbox.height,
    );
  }

  function drawObstacles(obstacles, hitObstacleIds) {
    const hitIds = new Set(hitObstacleIds);

    obstacles.forEach((obstacle) => {
      const bounds = getObstacleBounds(obstacle, lanes);
      const isHit = hitIds.has(obstacle.id);
      const lineWidth = Math.max(2, lanes.getLaneGap() * 0.012);
      const sprite = getCachedSprite(
        `obstacle:${obstacle.type}:${isHit}`,
        bounds.width,
        bounds.height,
        lineWidth,
        (spriteContext, spriteWidth, spriteHeight) => {
          spriteContext.fillStyle = getFallbackObstacleColor(obstacle.type);
          spriteContext.fillRect(0, 0, spriteWidth, spriteHeight);
          spriteContext.lineWidth = lineWidth;
          spriteContext.strokeStyle = isHit ? "#fff4a8" : "#2b1835";
          spriteContext.strokeRect(0, 0, spriteWidth, spriteHeight);
        },
      );

      drawCachedSprite(sprite, bounds.left, bounds.top);
    });
  }

  function drawItems(items) {
    items.forEach((item) => {
      if (item.type === COLLECTIBLE_TYPE.SPEED_UP) {
        if (item.isTriggered) {
          drawFallbackSpeedBoost(item, getItemBounds(item, lanes));
        }
        return;
      }

      const bounds = getItemBounds(item, lanes);
      const sprite = getCachedSprite(
        `item:${item.type}`,
        bounds.width,
        bounds.height,
        0,
        (spriteContext, spriteWidth, spriteHeight) => {
          spriteContext.fillStyle = "rgba(89, 199, 189, 0.72)";
          spriteContext.fillRect(0, 0, spriteWidth, spriteHeight);
        },
      );

      drawCachedSprite(sprite, bounds.left, bounds.top);
    });
  }

  function drawItemWarnings(items) {
    items.forEach((item) => {
      if (item.type !== COLLECTIBLE_TYPE.SPEED_UP) {
        return;
      }

      drawGhostWarningSign(getItemWarningX(item, lanes.getLaneGap()));
    });
  }

  function drawSupplyStations(stations) {
    if (stations.length === 0) {
      return;
    }

    const laneGap = lanes.getLaneGap();
    const stationWidth = laneGap * 0.92;
    const stationHeight = laneGap * 0.72;
    const roadBottom = Math.min(
      height - laneGap * 0.02,
      lanes.getLaneY(LANE_COUNT - 1) + laneGap * 0.58,
    );
    const sprite = getCachedSprite(
      "supply-station",
      stationWidth,
      stationHeight,
      Math.max(2, laneGap * 0.02),
      (spriteContext, spriteWidth, spriteHeight) => {
        paintSupplyStation(spriteContext, spriteWidth, spriteHeight, laneGap);
      },
    );

    stations.forEach((station) => {
      drawCachedSprite(
        sprite,
        station.x - stationWidth / 2,
        roadBottom - stationHeight,
      );
    });
  }

  function paintSupplyStation(context, stationWidth, stationHeight, laneGap) {
    const canopyTop = stationHeight * 0.05;
    const canopyHeight = stationHeight * 0.24;
    const postWidth = laneGap * 0.035;
    const tableTopY = stationHeight * 0.58;
    const tableHeight = stationHeight * 0.17;
    const tableLeft = stationWidth * 0.08;
    const tableWidth = stationWidth * 0.84;

    context.fillStyle = "#43323e";
    context.fillRect(stationWidth * 0.13, canopyTop + canopyHeight, postWidth, tableTopY - canopyTop);
    context.fillRect(stationWidth * 0.87 - postWidth, canopyTop + canopyHeight, postWidth, tableTopY - canopyTop);

    context.fillStyle = "#f6e5bc";
    context.strokeStyle = "#3b2939";
    context.lineWidth = Math.max(1.5, laneGap * 0.012);
    context.beginPath();
    context.roundRect(
      stationWidth * 0.06,
      canopyTop,
      stationWidth * 0.88,
      canopyHeight,
      laneGap * 0.035,
    );
    context.fill();
    context.stroke();

    const stripeWidth = stationWidth * 0.88 / 5;
    context.save();
    context.beginPath();
    context.roundRect(
      stationWidth * 0.06,
      canopyTop,
      stationWidth * 0.88,
      canopyHeight,
      laneGap * 0.035,
    );
    context.clip();
    [0, 2, 4].forEach((index) => {
      context.fillStyle = index === 2 ? "#59c7bd" : "#ef8d45";
      context.fillRect(
        stationWidth * 0.06 + stripeWidth * index,
        canopyTop,
        stripeWidth,
        canopyHeight,
      );
    });
    context.restore();

    context.fillStyle = "#775039";
    context.strokeStyle = "#35252d";
    context.lineWidth = Math.max(1.5, laneGap * 0.011);
    context.fillRect(tableLeft, tableTopY, tableWidth, tableHeight);
    context.strokeRect(tableLeft, tableTopY, tableWidth, tableHeight);
    context.fillStyle = "#51372f";
    context.fillRect(stationWidth * 0.18, tableTopY + tableHeight, laneGap * 0.05, stationHeight * 0.23);
    context.fillRect(stationWidth * 0.77, tableTopY + tableHeight, laneGap * 0.05, stationHeight * 0.23);

    const itemBaseY = tableTopY;
    context.strokeStyle = "#3b2939";
    context.lineWidth = Math.max(1, laneGap * 0.008);

    // Potion bottle
    const bottleX = stationWidth * 0.23;
    const bottleWidth = laneGap * 0.08;
    const bottleHeight = laneGap * 0.13;
    context.fillStyle = "#69d0c5";
    context.beginPath();
    context.roundRect(
      bottleX - bottleWidth / 2,
      itemBaseY - bottleHeight,
      bottleWidth,
      bottleHeight,
      laneGap * 0.018,
    );
    context.fill();
    context.stroke();
    context.fillStyle = "#f6e5bc";
    context.fillRect(
      bottleX - bottleWidth * 0.22,
      itemBaseY - bottleHeight - laneGap * 0.025,
      bottleWidth * 0.44,
      laneGap * 0.03,
    );
    context.strokeRect(
      bottleX - bottleWidth * 0.22,
      itemBaseY - bottleHeight - laneGap * 0.025,
      bottleWidth * 0.44,
      laneGap * 0.03,
    );

    // Wrapped candy
    const candyX = stationWidth * 0.42;
    const candyY = itemBaseY - laneGap * 0.06;
    const candyRadius = laneGap * 0.045;
    context.fillStyle = "#ef8d45";
    context.beginPath();
    context.moveTo(candyX - candyRadius, candyY);
    context.lineTo(candyX - candyRadius * 1.8, candyY - candyRadius * 0.72);
    context.lineTo(candyX - candyRadius * 1.8, candyY + candyRadius * 0.72);
    context.closePath();
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(candyX + candyRadius, candyY);
    context.lineTo(candyX + candyRadius * 1.8, candyY - candyRadius * 0.72);
    context.lineTo(candyX + candyRadius * 1.8, candyY + candyRadius * 0.72);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = "#ffd45c";
    context.beginPath();
    context.arc(candyX, candyY, candyRadius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // Item pouch
    const pouchX = stationWidth * 0.61;
    const pouchWidth = laneGap * 0.11;
    const pouchHeight = laneGap * 0.12;
    context.fillStyle = "#9a6b45";
    context.beginPath();
    context.roundRect(
      pouchX - pouchWidth / 2,
      itemBaseY - pouchHeight,
      pouchWidth,
      pouchHeight,
      laneGap * 0.028,
    );
    context.fill();
    context.stroke();
    context.fillStyle = "#f0b85d";
    context.fillRect(
      pouchX - pouchWidth * 0.42,
      itemBaseY - pouchHeight * 0.8,
      pouchWidth * 0.84,
      laneGap * 0.018,
    );

    // Rolled map
    const scrollX = stationWidth * 0.79;
    const scrollWidth = laneGap * 0.12;
    const scrollHeight = laneGap * 0.085;
    context.fillStyle = "#f6e5bc";
    context.fillRect(
      scrollX - scrollWidth / 2,
      itemBaseY - scrollHeight,
      scrollWidth,
      scrollHeight,
    );
    context.strokeRect(
      scrollX - scrollWidth / 2,
      itemBaseY - scrollHeight,
      scrollWidth,
      scrollHeight,
    );
    context.fillStyle = "#d79a51";
    context.beginPath();
    context.arc(
      scrollX - scrollWidth / 2,
      itemBaseY - scrollHeight / 2,
      scrollHeight * 0.3,
      0,
      Math.PI * 2,
    );
    context.arc(
      scrollX + scrollWidth / 2,
      itemBaseY - scrollHeight / 2,
      scrollHeight * 0.3,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.stroke();

    const signCenterX = stationWidth / 2;
    const signCenterY = canopyTop + canopyHeight / 2;
    context.fillStyle = "#fff4d2";
    context.beginPath();
    context.arc(signCenterX, signCenterY, laneGap * 0.065, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#41313e";
    context.stroke();
    context.fillStyle = "#ef8d45";
    context.beginPath();
    for (let pointIndex = 0; pointIndex < 10; pointIndex += 1) {
      const radius = laneGap * (pointIndex % 2 === 0 ? 0.047 : 0.021);
      const angle = -Math.PI / 2 + pointIndex * Math.PI / 5;
      const pointX = signCenterX + Math.cos(angle) * radius;
      const pointY = signCenterY + Math.sin(angle) * radius;

      if (pointIndex === 0) {
        context.moveTo(pointX, pointY);
      } else {
        context.lineTo(pointX, pointY);
      }
    }
    context.closePath();
    context.fill();
    context.stroke();
  }

  function drawGhostWarningSign(signX) {
    const laneGap = lanes.getLaneGap();
    const roadBottom = Math.min(
      height - laneGap * 0.02,
      lanes.getLaneY(LANE_COUNT - 1) + laneGap * 0.58,
    );
    const signWidth = laneGap * 0.31;
    const signHeight = laneGap * 0.58;
    const padding = Math.max(2, laneGap * 0.02);
    const sprite = getCachedSprite(
      "speed-boost-warning",
      signWidth,
      signHeight,
      padding,
      (spriteContext, spriteWidth, spriteHeight) => {
        paintGhostWarningSign(
          spriteContext,
          spriteWidth,
          spriteHeight,
          laneGap,
        );
      },
    );

    drawCachedSprite(
      sprite,
      signX - signWidth / 2,
      roadBottom - signHeight,
    );
  }

  function paintGhostWarningSign(
    spriteContext,
    signWidth,
    signHeight,
    laneGap,
  ) {
    const boardWidth = signWidth;
    const boardHeight = laneGap * 0.27;
    const boardCenterY = signHeight - laneGap * 0.44;
    const postWidth = laneGap * 0.045;

    spriteContext.fillStyle = "#50362b";
    spriteContext.fillRect(
      (signWidth - postWidth) / 2,
      boardCenterY,
      postWidth,
      signHeight - boardCenterY,
    );
    spriteContext.strokeStyle = "#2e2023";
    spriteContext.lineWidth = Math.max(1.5, laneGap * 0.012);
    spriteContext.strokeRect(
      (signWidth - postWidth) / 2,
      boardCenterY,
      postWidth,
      signHeight - boardCenterY,
    );

    spriteContext.save();
    spriteContext.translate(signWidth / 2, boardCenterY);
    spriteContext.fillStyle = "#f2a943";
    spriteContext.strokeStyle = "#3a2532";
    spriteContext.lineWidth = Math.max(2, laneGap * 0.018);
    spriteContext.beginPath();
    spriteContext.roundRect(
      -boardWidth / 2,
      -boardHeight / 2,
      boardWidth,
      boardHeight,
      laneGap * 0.025,
    );
    spriteContext.fill();
    spriteContext.stroke();

    const ghostWidth = boardWidth * 0.42;
    const ghostHeight = boardHeight * 0.54;
    spriteContext.fillStyle = "#f8edcf";
    spriteContext.strokeStyle = "#463043";
    spriteContext.lineWidth = Math.max(1, laneGap * 0.009);
    spriteContext.beginPath();
    spriteContext.moveTo(-ghostWidth / 2, ghostHeight * 0.42);
    spriteContext.lineTo(-ghostWidth / 2, -ghostHeight * 0.06);
    spriteContext.bezierCurveTo(
      -ghostWidth / 2,
      -ghostHeight * 0.58,
      ghostWidth / 2,
      -ghostHeight * 0.58,
      ghostWidth / 2,
      -ghostHeight * 0.06,
    );
    spriteContext.lineTo(ghostWidth / 2, ghostHeight * 0.42);
    spriteContext.lineTo(ghostWidth * 0.18, ghostHeight * 0.22);
    spriteContext.lineTo(0, ghostHeight * 0.42);
    spriteContext.lineTo(-ghostWidth * 0.18, ghostHeight * 0.22);
    spriteContext.closePath();
    spriteContext.fill();
    spriteContext.stroke();

    spriteContext.fillStyle = "#463043";
    spriteContext.beginPath();
    spriteContext.arc(
      -ghostWidth * 0.17,
      -ghostHeight * 0.08,
      laneGap * 0.018,
      0,
      Math.PI * 2,
    );
    spriteContext.arc(
      ghostWidth * 0.17,
      -ghostHeight * 0.08,
      laneGap * 0.018,
      0,
      Math.PI * 2,
    );
    spriteContext.fill();
    spriteContext.restore();
  }

  function drawFallbackSpeedBoost(item, bounds) {
    const laneGap = lanes.getLaneGap();
    const animationDuration = Math.max(0.001, item.triggerAnimationDuration);
    const triggerProgress = item.isTriggered
      ? Math.min(1, item.triggerElapsedSeconds / animationDuration)
      : 0;
    const ghostScale = 1 + triggerProgress * 0.45;
    const ghostX = item.x + laneGap * 0.38 * triggerProgress;
    const ghostY =
      bounds.top + bounds.height * 0.38 - laneGap * 0.48 * triggerProgress;
    const baseGhostWidth = bounds.width * 0.44;
    const baseGhostHeight = bounds.height * 0.62;
    const ghostWidth = baseGhostWidth * ghostScale;
    const ghostHeight = baseGhostHeight * ghostScale;
    const fadeInProgress = Math.min(1, triggerProgress / 0.15);
    const opacity = 0.88 * fadeInProgress * (1 - triggerProgress);
    const sprite = getCachedSprite(
      "speed-boost-ghost",
      baseGhostWidth,
      baseGhostHeight,
      Math.max(2, laneGap * 0.04),
      (spriteContext, spriteWidth, spriteHeight) => {
        paintSpeedBoostGhost(
          spriteContext,
          spriteWidth,
          spriteHeight,
          laneGap,
        );
      },
    );

    context.save();
    context.globalAlpha = Math.max(0, opacity);
    drawCachedSpriteCentered(
      sprite,
      ghostX,
      ghostY,
      ghostWidth,
      ghostHeight,
    );
    context.restore();
  }

  function paintSpeedBoostGhost(
    spriteContext,
    ghostWidth,
    ghostHeight,
    laneGap,
  ) {
    spriteContext.save();
    spriteContext.translate(ghostWidth / 2, ghostHeight / 2);
    spriteContext.lineJoin = "round";
    spriteContext.lineCap = "round";
    spriteContext.lineWidth = Math.max(1.5, laneGap * 0.012);
    spriteContext.strokeStyle = "rgba(52, 38, 72, 0.9)";
    spriteContext.fillStyle = "rgba(238, 239, 255, 0.88)";
    spriteContext.beginPath();
    spriteContext.moveTo(-ghostWidth / 2, ghostHeight * 0.42);
    spriteContext.lineTo(-ghostWidth / 2, -ghostHeight * 0.05);
    spriteContext.bezierCurveTo(
      -ghostWidth / 2,
      -ghostHeight * 0.58,
      ghostWidth / 2,
      -ghostHeight * 0.58,
      ghostWidth / 2,
      -ghostHeight * 0.05,
    );
    spriteContext.lineTo(ghostWidth / 2, ghostHeight * 0.42);
    spriteContext.quadraticCurveTo(
      ghostWidth * 0.32,
      ghostHeight * 0.18,
      ghostWidth * 0.16,
      ghostHeight * 0.42,
    );
    spriteContext.quadraticCurveTo(
      0,
      ghostHeight * 0.18,
      -ghostWidth * 0.16,
      ghostHeight * 0.42,
    );
    spriteContext.quadraticCurveTo(
      -ghostWidth * 0.32,
      ghostHeight * 0.18,
      -ghostWidth / 2,
      ghostHeight * 0.42,
    );
    spriteContext.closePath();
    spriteContext.fill();
    spriteContext.stroke();

    spriteContext.fillStyle = "#30243d";
    spriteContext.beginPath();
    spriteContext.ellipse(
      -ghostWidth * 0.17,
      -ghostHeight * 0.08,
      ghostWidth * 0.055,
      ghostHeight * 0.1,
      0,
      0,
      Math.PI * 2,
    );
    spriteContext.ellipse(
      ghostWidth * 0.17,
      -ghostHeight * 0.08,
      ghostWidth * 0.055,
      ghostHeight * 0.1,
      0,
      0,
      Math.PI * 2,
    );
    spriteContext.fill();

    spriteContext.beginPath();
    spriteContext.ellipse(
      0,
      ghostHeight * 0.16,
      ghostWidth * 0.09,
      ghostHeight * 0.09,
      0,
      0,
      Math.PI * 2,
    );
    spriteContext.fill();
    spriteContext.restore();
  }

  function drawCoins(coins) {
    const laneGap = lanes.getLaneGap();

    coins.forEach((coin) => {
      const coinWidth = laneGap * coin.widthRatio;
      const coinHeight = laneGap * coin.heightRatio;
      const centerY = lanes.getLaneY(coin.lane) - laneGap * coin.elevationRatio;
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

  function drawCandyParty(candyParty) {
    candyParty?.candies?.forEach((candy) => {
      context.save();
      context.translate(candy.x, candy.y);
      context.rotate(candy.rotation);

      if (candy.type === COLLECTIBLE_TYPE.SPECIAL_COIN) {
        drawFallbackCandyBag(0, 0, candy.size * 1.08, candy.size);
      } else {
        drawFallbackCandy(0, 0, candy.size, candy.size);
      }

      context.restore();
    });
  }

  function drawCandyLauncherWorld(candyLauncher) {
    if (!candyLauncher) {
      return;
    }

    const laneGap = lanes.getLaneGap();
    const smokeSprite = getCachedSprite(
      "candy-launcher-smoke",
      laneGap * 0.14,
      laneGap * 0.14,
      laneGap * 0.03,
      paintCandyLauncherSmoke,
    );

    candyLauncher.smokePuffs?.forEach((puff) => {
      const progress = Math.min(1, puff.ageSeconds / puff.lifetimeSeconds);
      const puffSize = puff.size * (0.8 + progress * 0.65);

      context.save();
      context.globalAlpha = Math.max(0, 0.72 * (1 - progress));
      drawCachedSpriteCentered(
        smokeSprite,
        puff.x + puff.driftX * progress,
        puff.y + puff.driftY * progress,
        puffSize,
        puffSize,
      );
      context.restore();
    });

    if (candyLauncher.projectile) {
      const projectile = candyLauncher.projectile;
      const projectileSize = projectile.radius * 2;
      const projectileY =
        lanes.getLaneY(projectile.lane) - laneGap * 0.5;
      const projectileSprite = getCachedSprite(
        "candy-launcher-projectile",
        laneGap * 0.25,
        laneGap * 0.25,
        laneGap * 0.035,
        paintCandyLauncherProjectile,
      );

      context.save();
      context.translate(projectile.x, projectileY);
      context.rotate(projectile.rotation);
      drawCachedSpriteCentered(
        projectileSprite,
        0,
        0,
        projectileSize,
        projectileSize,
      );
      context.restore();
    }

    if (candyLauncher.explosion) {
      const explosion = candyLauncher.explosion;
      const progress = Math.min(1, Math.max(0, explosion.progress));
      const explosionSize = laneGap * (0.72 + progress * 0.72);
      const explosionY = lanes.getLaneY(explosion.lane) - laneGap * 0.48;
      const explosionSprite = getCachedSprite(
        "candy-launcher-explosion",
        laneGap * 0.9,
        laneGap * 0.9,
        laneGap * 0.05,
        paintCandyLauncherExplosion,
      );

      context.save();
      context.globalAlpha = Math.max(0, 1 - progress * 0.78);
      context.translate(explosion.x, explosionY);
      context.rotate(progress * 0.18);
      drawCachedSpriteCentered(
        explosionSprite,
        0,
        0,
        explosionSize,
        explosionSize,
      );
      context.restore();

      const boomWidth = laneGap * 0.58;
      const boomHeight = laneGap * 0.24;
      const boomSprite = getCachedSprite(
        "candy-launcher-boom",
        boomWidth,
        boomHeight,
        laneGap * 0.035,
        paintCandyLauncherBoom,
      );

      context.save();
      context.globalAlpha = Math.max(0, 1 - progress * 0.65);
      context.translate(
        explosion.x + explosionSize * 0.28,
        explosionY - explosionSize * 0.28,
      );
      context.rotate(-0.14);
      drawCachedSpriteCentered(
        boomSprite,
        0,
        0,
        boomWidth,
        boomHeight,
      );
      context.restore();
    }
  }

  function drawCandyLauncherHeld(candyLauncher, player) {
    if (candyLauncher?.phase !== "countdown") {
      return;
    }

    const laneGap = lanes.getLaneGap();
    const launcherWidth = laneGap * 0.5;
    const launcherHeight = laneGap * 0.22;
    const footX = width * PLAYER_SCREEN_X_RATIO;
    const footY = lanes.getLaneY(player.lanePosition) - player.elevation;
    const pulse = Math.sin(performance.now() / 110) * laneGap * 0.006;
    const launcherSprite = getCachedSprite(
      "candy-launcher-held",
      launcherWidth,
      launcherHeight,
      laneGap * 0.035,
      paintCandyLauncherHeld,
    );

    drawCachedSpriteCentered(
      launcherSprite,
      footX + laneGap * 0.19,
      footY - laneGap * 0.22 + pulse,
      launcherWidth,
      launcherHeight,
    );
  }

  function drawCandyLauncherCountdown(candyLauncher) {
    if (!Number.isInteger(candyLauncher?.countdownValue)) {
      return;
    }

    const laneGap = lanes.getLaneGap();
    const countdownSize = Math.min(54, Math.max(30, laneGap * 0.27));
    const sprite = getCachedSprite(
      `candy-launcher-countdown:${candyLauncher.countdownValue}`,
      countdownSize,
      countdownSize,
      countdownSize * 0.16,
      (spriteContext, spriteWidth, spriteHeight) => {
        paintCandyLauncherCountdown(
          spriteContext,
          spriteWidth,
          spriteHeight,
          candyLauncher.countdownValue,
        );
      },
    );

    context.save();
    context.globalAlpha = 0.92;
    drawCachedSpriteCentered(sprite, width * 0.5, height * 0.46);
    context.restore();
  }

  function paintCandyLauncherSmoke(
    spriteContext,
    smokeWidth,
    smokeHeight,
  ) {
    const gradient = spriteContext.createRadialGradient(
      smokeWidth * 0.42,
      smokeHeight * 0.38,
      0,
      smokeWidth * 0.5,
      smokeHeight * 0.5,
      smokeWidth * 0.48,
    );
    gradient.addColorStop(0, "rgba(255, 250, 226, 0.96)");
    gradient.addColorStop(0.62, "rgba(202, 211, 219, 0.82)");
    gradient.addColorStop(1, "rgba(112, 101, 130, 0)");
    spriteContext.fillStyle = gradient;
    spriteContext.beginPath();
    spriteContext.arc(
      smokeWidth * 0.5,
      smokeHeight * 0.5,
      smokeWidth * 0.48,
      0,
      Math.PI * 2,
    );
    spriteContext.fill();
  }

  function paintCandyLauncherHeld(
    spriteContext,
    launcherWidth,
    launcherHeight,
  ) {
    const outlineWidth = Math.max(1.5, launcherHeight * 0.08);
    const bodyGradient = spriteContext.createLinearGradient(
      0,
      0,
      launcherWidth,
      launcherHeight,
    );
    bodyGradient.addColorStop(0, "#8453a8");
    bodyGradient.addColorStop(0.55, "#cf62a5");
    bodyGradient.addColorStop(1, "#5cc7bd");

    spriteContext.save();
    spriteContext.lineJoin = "round";
    spriteContext.lineCap = "round";
    spriteContext.lineWidth = outlineWidth;
    spriteContext.strokeStyle = "#30243d";
    spriteContext.fillStyle = bodyGradient;
    spriteContext.beginPath();
    spriteContext.roundRect(
      launcherWidth * 0.08,
      launcherHeight * 0.18,
      launcherWidth * 0.76,
      launcherHeight * 0.5,
      launcherHeight * 0.16,
    );
    spriteContext.fill();
    spriteContext.stroke();

    spriteContext.fillStyle = "#f4a34d";
    spriteContext.beginPath();
    spriteContext.moveTo(launcherWidth * 0.77, launcherHeight * 0.12);
    spriteContext.lineTo(launcherWidth * 0.96, launcherHeight * 0.04);
    spriteContext.lineTo(launcherWidth * 0.96, launcherHeight * 0.82);
    spriteContext.lineTo(launcherWidth * 0.77, launcherHeight * 0.72);
    spriteContext.closePath();
    spriteContext.fill();
    spriteContext.stroke();

    spriteContext.fillStyle = "#ffd45c";
    spriteContext.beginPath();
    spriteContext.arc(
      launcherWidth * 0.2,
      launcherHeight * 0.43,
      launcherHeight * 0.18,
      0,
      Math.PI * 2,
    );
    spriteContext.fill();
    spriteContext.stroke();

    spriteContext.fillStyle = "#5b3b72";
    spriteContext.beginPath();
    spriteContext.roundRect(
      launcherWidth * 0.37,
      launcherHeight * 0.58,
      launcherWidth * 0.14,
      launcherHeight * 0.34,
      launcherHeight * 0.06,
    );
    spriteContext.fill();
    spriteContext.stroke();

    spriteContext.strokeStyle = "rgba(255, 244, 210, 0.72)";
    spriteContext.lineWidth = Math.max(1, outlineWidth * 0.55);
    [0.36, 0.5, 0.64].forEach((xRatio) => {
      spriteContext.beginPath();
      spriteContext.moveTo(
        launcherWidth * xRatio,
        launcherHeight * 0.22,
      );
      spriteContext.lineTo(
        launcherWidth * (xRatio + 0.08),
        launcherHeight * 0.64,
      );
      spriteContext.stroke();
    });
    spriteContext.restore();
  }

  function paintCandyLauncherProjectile(
    spriteContext,
    projectileWidth,
    projectileHeight,
  ) {
    const centerX = projectileWidth / 2;
    const centerY = projectileHeight / 2;
    const radius = projectileWidth * 0.43;
    const gradient = spriteContext.createRadialGradient(
      centerX - radius * 0.3,
      centerY - radius * 0.35,
      radius * 0.08,
      centerX,
      centerY,
      radius,
    );
    gradient.addColorStop(0, "#fff0a2");
    gradient.addColorStop(0.34, "#f49b4d");
    gradient.addColorStop(0.72, "#d85f91");
    gradient.addColorStop(1, "#6b3b82");

    spriteContext.save();
    spriteContext.lineJoin = "round";
    spriteContext.lineWidth = Math.max(1.5, projectileWidth * 0.07);
    spriteContext.strokeStyle = "#30243d";
    spriteContext.fillStyle = gradient;
    spriteContext.beginPath();
    spriteContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    spriteContext.fill();
    spriteContext.stroke();

    const candyMarks = [
      [-0.2, -0.13, "#5cc7bd"],
      [0.2, -0.08, "#ffd45c"],
      [-0.02, 0.22, "#ff7584"],
    ];
    candyMarks.forEach(([xRatio, yRatio, color]) => {
      spriteContext.fillStyle = color;
      spriteContext.beginPath();
      spriteContext.ellipse(
        centerX + projectileWidth * xRatio,
        centerY + projectileHeight * yRatio,
        projectileWidth * 0.11,
        projectileHeight * 0.075,
        xRatio * 2,
        0,
        Math.PI * 2,
      );
      spriteContext.fill();
      spriteContext.stroke();
    });
    spriteContext.restore();
  }

  function paintCandyLauncherExplosion(
    spriteContext,
    explosionWidth,
    explosionHeight,
  ) {
    const centerX = explosionWidth / 2;
    const centerY = explosionHeight / 2;

    spriteContext.save();
    spriteContext.translate(centerX, centerY);
    spriteContext.lineJoin = "round";
    spriteContext.strokeStyle = "#63345f";
    spriteContext.lineWidth = Math.max(2, explosionWidth * 0.035);
    spriteContext.fillStyle = "#f07058";
    spriteContext.beginPath();

    for (let pointIndex = 0; pointIndex < 24; pointIndex += 1) {
      const radius = explosionWidth * (pointIndex % 2 === 0 ? 0.46 : 0.25);
      const angle = -Math.PI / 2 + pointIndex * Math.PI / 12;
      const pointX = Math.cos(angle) * radius;
      const pointY = Math.sin(angle) * radius;

      if (pointIndex === 0) {
        spriteContext.moveTo(pointX, pointY);
      } else {
        spriteContext.lineTo(pointX, pointY);
      }
    }

    spriteContext.closePath();
    spriteContext.fill();
    spriteContext.stroke();
    spriteContext.fillStyle = "#ffd45c";
    spriteContext.beginPath();
    spriteContext.arc(0, 0, explosionWidth * 0.24, 0, Math.PI * 2);
    spriteContext.fill();
    spriteContext.stroke();
    spriteContext.fillStyle = "#fff4d2";
    spriteContext.beginPath();
    spriteContext.arc(
      -explosionWidth * 0.06,
      -explosionHeight * 0.07,
      explosionWidth * 0.08,
      0,
      Math.PI * 2,
    );
    spriteContext.fill();
    spriteContext.restore();
  }

  function paintCandyLauncherCountdown(
    spriteContext,
    countdownWidth,
    countdownHeight,
    countdownValue,
  ) {
    const fontSize = countdownHeight * 0.78;

    spriteContext.save();
    spriteContext.font = `900 ${fontSize}px "Arial Rounded MT Bold", sans-serif`;
    spriteContext.textAlign = "center";
    spriteContext.textBaseline = "middle";
    spriteContext.lineJoin = "round";
    spriteContext.lineWidth = Math.max(2, countdownWidth * 0.1);
    spriteContext.strokeStyle = "rgba(48, 36, 61, 0.9)";
    spriteContext.fillStyle = "#fff4d2";
    spriteContext.strokeText(
      String(countdownValue),
      countdownWidth / 2,
      countdownHeight * 0.54,
    );
    spriteContext.fillText(
      String(countdownValue),
      countdownWidth / 2,
      countdownHeight * 0.54,
    );
    spriteContext.restore();
  }

  function paintCandyLauncherBoom(
    spriteContext,
    boomWidth,
    boomHeight,
  ) {
    const fontSize = boomHeight * 0.72;

    spriteContext.save();
    spriteContext.font = `italic 900 ${fontSize}px "Arial Black", sans-serif`;
    spriteContext.textAlign = "center";
    spriteContext.textBaseline = "middle";
    spriteContext.lineJoin = "round";
    spriteContext.lineWidth = Math.max(2, boomHeight * 0.13);
    spriteContext.strokeStyle = "#542d58";
    spriteContext.fillStyle = "#fff1a6";
    spriteContext.strokeText("BOOM!", boomWidth / 2, boomHeight * 0.52);
    spriteContext.fillText("BOOM!", boomWidth / 2, boomHeight * 0.52);
    spriteContext.restore();
  }

  function drawFallbackCandy(centerX, centerY, candyWidth, candyHeight) {
    const sprite = getCachedSprite(
      "normal-candy",
      candyWidth,
      candyHeight,
      Math.max(2, candyWidth * 0.12),
      (spriteContext, spriteWidth, spriteHeight) => {
        paintFallbackCandy(spriteContext, spriteWidth, spriteHeight);
      },
    );

    drawCachedSpriteCentered(sprite, centerX, centerY, candyWidth, candyHeight);
  }

  function paintFallbackCandy(context, candyWidth, candyHeight) {
    const centerX = candyWidth / 2;
    const centerY = candyHeight / 2;
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
    const sprite = getCachedSprite(
      "special-candy-bag",
      bagWidth,
      bagHeight,
      Math.max(2, bagWidth * 0.08),
      (spriteContext, spriteWidth, spriteHeight) => {
        paintFallbackCandyBag(spriteContext, spriteWidth, spriteHeight);
      },
    );

    drawCachedSpriteCentered(sprite, centerX, centerY, bagWidth, bagHeight);
  }

  function paintFallbackCandyBag(context, bagWidth, bagHeight) {
    const centerX = bagWidth / 2;
    const centerY = bagHeight / 2;
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
