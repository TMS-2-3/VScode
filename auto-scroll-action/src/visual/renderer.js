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
    { coins = [], items = [], obstacles = [], hitObstacleIds = [] } = {},
  ) {
    drawBackground();
    drawItemWarnings(items);
    drawObstacles(obstacles, hitObstacleIds);
    drawCoins(coins);
    drawPlayer(player);
    drawItems(items);
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

    drawCachedSpriteCentered(sprite, centerX, centerY);
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

    drawCachedSpriteCentered(sprite, centerX, centerY);
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
