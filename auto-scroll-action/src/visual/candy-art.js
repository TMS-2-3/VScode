import {
  CANDY_APPEARANCE,
  normalizeCandyAppearance,
} from "../shared/candy-appearances.js";

const CANDY_OUTLINE_COLOR = "rgba(255, 255, 255, 0.98)";
const CANDY_OUTLINE_SIZE_RATIO = 0.055;
const CANDY_GLOW_COLOR = "rgba(255, 238, 164, 0.82)";
const CANDY_GLOW_SIZE_RATIO = 0.09;
const CANDY_ARTWORK_RESOLUTION_SCALE = 2;
const MAX_CACHED_ARTWORK_COUNT = 80;
const outlinedArtworkCache = new Map();

export function paintCandyArtwork(context, appearance, width, height) {
  const normalizedAppearance = normalizeCandyAppearance(appearance);
  const artwork = getOutlinedCandyArtwork(
    context,
    normalizedAppearance,
    width,
    height,
  );

  if (artwork) {
    context.save();
    context.shadowColor = CANDY_GLOW_COLOR;
    context.shadowBlur = Math.max(
      2,
      Math.min(width, height) * CANDY_GLOW_SIZE_RATIO,
    );
    context.drawImage(artwork, 0, 0, width, height);
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.drawImage(artwork, 0, 0, width, height);
    context.restore();
    return;
  }

  getCandyPainter(normalizedAppearance)(context, width, height);
}

function getCandyPainter(appearance) {
  const painters = {
    [CANDY_APPEARANCE.WRAPPED]: paintWrappedCandy,
    [CANDY_APPEARANCE.CHOCOLATE]: paintChocolate,
    [CANDY_APPEARANCE.COOKIE]: paintCookie,
    [CANDY_APPEARANCE.CUPCAKE]: paintCupcake,
    [CANDY_APPEARANCE.LOLLIPOP]: paintLollipop,
  };

  return painters[appearance];
}

function getOutlinedCandyArtwork(context, appearance, width, height) {
  const canvasWidth = Math.max(1, Math.ceil(width));
  const canvasHeight = Math.max(1, Math.ceil(height));
  const cacheKey = `${appearance}:${canvasWidth}x${canvasHeight}`;
  const cachedArtwork = outlinedArtworkCache.get(cacheKey);

  if (cachedArtwork) {
    return cachedArtwork;
  }

  const scaledCanvasWidth = canvasWidth * CANDY_ARTWORK_RESOLUTION_SCALE;
  const scaledCanvasHeight = canvasHeight * CANDY_ARTWORK_RESOLUTION_SCALE;
  const artwork = createScratchCanvas(
    context,
    scaledCanvasWidth,
    scaledCanvasHeight,
  );
  const outlinedArtwork = createScratchCanvas(
    context,
    scaledCanvasWidth,
    scaledCanvasHeight,
  );
  const artworkContext = artwork?.getContext("2d");
  const outlinedContext = outlinedArtwork?.getContext("2d");

  if (!artwork || !outlinedArtwork || !artworkContext || !outlinedContext) {
    return null;
  }

  artworkContext.setTransform(
    CANDY_ARTWORK_RESOLUTION_SCALE,
    0,
    0,
    CANDY_ARTWORK_RESOLUTION_SCALE,
    0,
    0,
  );
  artworkContext.imageSmoothingEnabled = true;
  artworkContext.imageSmoothingQuality = "high";
  outlinedContext.imageSmoothingEnabled = true;
  outlinedContext.imageSmoothingQuality = "high";

  const outlineSize = Math.max(
    1,
    Math.min(canvasWidth, canvasHeight) * CANDY_OUTLINE_SIZE_RATIO,
  );
  const padding = Math.ceil(outlineSize);
  const contentWidth = Math.max(1, canvasWidth - padding * 2);
  const contentHeight = Math.max(1, canvasHeight - padding * 2);

  artworkContext.translate(padding, padding);
  getCandyPainter(appearance)(artworkContext, contentWidth, contentHeight);

  const directionCount = 16;
  const scaledOutlineSize = outlineSize * CANDY_ARTWORK_RESOLUTION_SCALE;
  for (let direction = 0; direction < directionCount; direction += 1) {
    const angle = direction / directionCount * Math.PI * 2;
    outlinedContext.drawImage(
      artwork,
      Math.cos(angle) * scaledOutlineSize,
      Math.sin(angle) * scaledOutlineSize,
    );
  }
  outlinedContext.drawImage(artwork, 0, 0);
  outlinedContext.globalCompositeOperation = "source-in";
  outlinedContext.fillStyle = CANDY_OUTLINE_COLOR;
  outlinedContext.fillRect(0, 0, scaledCanvasWidth, scaledCanvasHeight);
  outlinedContext.globalCompositeOperation = "source-over";
  outlinedContext.drawImage(artwork, 0, 0);

  if (outlinedArtworkCache.size >= MAX_CACHED_ARTWORK_COUNT) {
    outlinedArtworkCache.delete(outlinedArtworkCache.keys().next().value);
  }
  outlinedArtworkCache.set(cacheKey, outlinedArtwork);
  return outlinedArtwork;
}

function createScratchCanvas(context, width, height) {
  if (typeof OffscreenCanvas === "function") {
    return new OffscreenCanvas(width, height);
  }

  const ownerDocument =
    context.canvas?.ownerDocument ??
    (typeof document === "undefined" ? null : document);
  const canvas = ownerDocument?.createElement?.("canvas");

  if (!canvas) {
    return null;
  }

  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function paintWrappedCandy(context, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const bodyHalfWidth = width * 0.28;
  const bodyHalfHeight = height * 0.32;
  const outlineWidth = Math.max(1, height * 0.06);

  context.save();
  context.translate(centerX, centerY);
  context.rotate(-Math.PI / 18);
  context.lineJoin = "round";
  context.lineWidth = outlineWidth;
  context.strokeStyle = "#4b2740";
  context.fillStyle = "#ff9b55";

  context.beginPath();
  context.moveTo(-bodyHalfWidth, -bodyHalfHeight * 0.72);
  context.lineTo(-width / 2, -height * 0.34);
  context.lineTo(-width * 0.44, height * 0.35);
  context.lineTo(-bodyHalfWidth, bodyHalfHeight * 0.72);
  context.closePath();
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(bodyHalfWidth, -bodyHalfHeight * 0.72);
  context.lineTo(width / 2, -height * 0.34);
  context.lineTo(width * 0.44, height * 0.35);
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

function paintChocolate(context, width, height) {
  const outlineWidth = Math.max(1, height * 0.055);
  const barWidth = width * 0.66;
  const barHeight = height * 0.84;

  context.save();
  context.translate(width / 2, height / 2);
  context.rotate(-0.12);
  context.lineJoin = "round";
  context.lineWidth = outlineWidth;
  context.strokeStyle = "#3b2530";
  context.fillStyle = "#75402f";
  context.beginPath();
  context.roundRect(-barWidth / 2, -barHeight / 2, barWidth, barHeight, height * 0.08);
  context.fill();
  context.stroke();

  const segmentWidth = barWidth * 0.25;
  const segmentHeight = barHeight * 0.22;
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const x = (column - 0.5) * barWidth * 0.34;
      const y = (row - 1) * barHeight * 0.27;
      context.fillStyle = column === 0 ? "#9a5b3d" : "#874a34";
      context.beginPath();
      context.roundRect(
        x - segmentWidth / 2,
        y - segmentHeight / 2,
        segmentWidth,
        segmentHeight,
        height * 0.025,
      );
      context.fill();
      context.stroke();
      context.fillStyle = "rgba(255, 210, 160, 0.24)";
      context.fillRect(
        x - segmentWidth * 0.3,
        y - segmentHeight * 0.3,
        segmentWidth * 0.42,
        Math.max(1, height * 0.025),
      );
    }
  }
  context.restore();
}

function paintCookie(context, width, height) {
  const radius = Math.min(width, height) * 0.4;
  const centerX = width / 2;
  const centerY = height / 2;
  const outlineWidth = Math.max(1, height * 0.055);

  context.save();
  context.lineWidth = outlineWidth;
  context.strokeStyle = "#5a3431";
  context.fillStyle = "#d8954f";
  context.beginPath();
  for (let index = 0; index < 20; index += 1) {
    const angle = index * Math.PI / 10;
    const edgeRadius = radius * (index % 2 === 0 ? 1 : 0.96);
    const x = centerX + Math.cos(angle) * edgeRadius;
    const y = centerY + Math.sin(angle) * edgeRadius;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.closePath();
  context.fill();
  context.stroke();

  const chips = [
    [-0.2, -0.2, 0.09], [0.23, -0.18, 0.075], [0.05, 0.08, 0.09],
    [-0.24, 0.22, 0.065], [0.25, 0.25, 0.06],
  ];
  chips.forEach(([xRatio, yRatio, sizeRatio]) => {
    context.fillStyle = "#5b332e";
    context.beginPath();
    context.arc(
      centerX + width * xRatio,
      centerY + height * yRatio,
      width * sizeRatio,
      0,
      Math.PI * 2,
    );
    context.fill();
  });
  context.fillStyle = "rgba(255, 224, 169, 0.42)";
  context.beginPath();
  context.ellipse(
    centerX - radius * 0.25,
    centerY - radius * 0.38,
    radius * 0.25,
    radius * 0.12,
    -0.45,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.restore();
}

function paintCupcake(context, width, height) {
  const outlineWidth = Math.max(1, height * 0.052);
  const centerX = width / 2;

  context.save();
  context.lineJoin = "round";
  context.lineCap = "round";
  context.lineWidth = outlineWidth;
  context.strokeStyle = "#4d2d47";

  context.fillStyle = "#62b8ad";
  context.beginPath();
  context.moveTo(width * 0.23, height * 0.53);
  context.lineTo(width * 0.77, height * 0.53);
  context.lineTo(width * 0.69, height * 0.91);
  context.lineTo(width * 0.31, height * 0.91);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = "rgba(40, 74, 85, 0.55)";
  context.lineWidth = Math.max(1, outlineWidth * 0.55);
  for (const xRatio of [0.38, 0.5, 0.62]) {
    context.beginPath();
    context.moveTo(width * xRatio, height * 0.58);
    context.lineTo(centerX + (xRatio - 0.5) * width * 0.7, height * 0.85);
    context.stroke();
  }

  context.strokeStyle = "#4d2d47";
  context.lineWidth = outlineWidth;
  context.fillStyle = "#f58ab6";
  context.beginPath();
  context.moveTo(width * 0.2, height * 0.57);
  context.bezierCurveTo(width * 0.18, height * 0.43, width * 0.32, height * 0.39, width * 0.37, height * 0.4);
  context.bezierCurveTo(width * 0.32, height * 0.27, width * 0.44, height * 0.22, width * 0.5, height * 0.25);
  context.bezierCurveTo(width * 0.51, height * 0.12, width * 0.68, height * 0.15, width * 0.65, height * 0.31);
  context.bezierCurveTo(width * 0.79, height * 0.31, width * 0.83, height * 0.45, width * 0.77, height * 0.57);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(255, 240, 245, 0.64)";
  context.beginPath();
  context.ellipse(width * 0.45, height * 0.31, width * 0.09, height * 0.055, -0.45, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function paintLollipop(context, width, height) {
  const outlineWidth = Math.max(1, height * 0.05);
  const candyRadius = Math.min(width, height) * 0.29;
  const candyX = width * 0.43;
  const candyY = height * 0.36;

  context.save();
  context.translate(width / 2, height / 2);
  context.rotate(-0.22);
  context.translate(-width / 2, -height / 2);
  context.lineCap = "round";
  context.strokeStyle = "#4b3049";
  context.lineWidth = outlineWidth * 1.7;
  context.beginPath();
  context.moveTo(candyX + candyRadius * 0.35, candyY + candyRadius * 0.65);
  context.lineTo(width * 0.75, height * 0.91);
  context.stroke();
  context.strokeStyle = "#fff0cb";
  context.lineWidth = outlineWidth * 0.75;
  context.stroke();

  context.lineWidth = outlineWidth;
  context.strokeStyle = "#4b2740";
  context.fillStyle = "#f0649e";
  context.beginPath();
  context.arc(candyX, candyY, candyRadius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = "#ffd76a";
  context.lineWidth = Math.max(1, outlineWidth * 0.75);
  context.beginPath();
  for (let step = 0; step <= 30; step += 1) {
    const progress = step / 30;
    const angle = progress * Math.PI * 4.3;
    const radius = candyRadius * progress * 0.78;
    const x = candyX + Math.cos(angle) * radius;
    const y = candyY + Math.sin(angle) * radius;
    if (step === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.stroke();
  context.fillStyle = "rgba(255, 255, 255, 0.55)";
  context.beginPath();
  context.ellipse(
    candyX - candyRadius * 0.3,
    candyY - candyRadius * 0.32,
    candyRadius * 0.16,
    candyRadius * 0.1,
    -0.5,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.restore();
}
