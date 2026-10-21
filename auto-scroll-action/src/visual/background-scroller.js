import {
  paintTownBackground,
  TOWN_BACKGROUND_ASPECT_RATIO,
} from "./town-background.js";

const BACKGROUND_SOURCE_GUIDES = [0, 0.335, 0.567, 0.824, 1];
const BACKGROUND_TARGET_GUIDES = [0, 0.35, 0.6, 0.85, 1];
const BACKGROUND_IMAGE_PATH = "./img/back/halloween-town-background-v9.png";
const USE_DRAWN_BACKGROUND = false;

export function createBackgroundScroller(root) {
  const track = root.querySelector(".game-background-track");
  const tiles = [...root.querySelectorAll(".game-background-tile")];

  if (!(track instanceof HTMLElement) || tiles.length !== 2) {
    throw new Error("Background scroll elements are missing.");
  }

  const backgroundImage = USE_DRAWN_BACKGROUND ? null : new Image();
  let width = 1;
  let height = 1;
  let tileWidth = 1;
  let travelX = 0;

  if (backgroundImage) {
    backgroundImage.addEventListener("load", rebuildTiles);
    backgroundImage.src = BACKGROUND_IMAGE_PATH;
  }

  function resize(nextWidth, nextHeight) {
    width = Math.max(1, Math.round(nextWidth));
    height = Math.max(1, Math.round(nextHeight));
    root.style.width = `${width}px`;
    root.style.height = `${height}px`;
    rebuildTiles();
  }

  function rebuildTiles() {
    if (!USE_DRAWN_BACKGROUND && !isImageReady(backgroundImage)) {
      return;
    }

    tileWidth = USE_DRAWN_BACKGROUND
      ? Math.max(1, Math.round(height * TOWN_BACKGROUND_ASPECT_RATIO))
      : calculateImageTileWidth(backgroundImage, width, height);

    track.style.width = `${tileWidth * tiles.length}px`;
    track.style.height = `${height}px`;

    tiles.forEach((tile, index) => {
      if (!(tile instanceof HTMLCanvasElement)) {
        return;
      }

      tile.width = tileWidth;
      tile.height = height;
      tile.style.left = `${index * tileWidth}px`;
      tile.style.width = `${tileWidth}px`;
      tile.style.height = `${height}px`;
      paintTile(tile);
    });

    applyOffset();
  }

  function paintTile(tile) {
    const tileContext = tile.getContext("2d", { alpha: false });

    if (!tileContext) {
      return;
    }

    tileContext.imageSmoothingEnabled = true;
    tileContext.imageSmoothingQuality = "high";

    if (USE_DRAWN_BACKGROUND) {
      paintTownBackground(tileContext, tileWidth, height);
      return;
    }

    for (let index = 0; index < BACKGROUND_SOURCE_GUIDES.length - 1; index += 1) {
      const sourceY = Math.round(
        backgroundImage.naturalHeight * BACKGROUND_SOURCE_GUIDES[index],
      );
      const sourceBottom = Math.round(
        backgroundImage.naturalHeight * BACKGROUND_SOURCE_GUIDES[index + 1],
      );
      const targetY = Math.round(height * BACKGROUND_TARGET_GUIDES[index]);
      const targetBottom = Math.round(
        height * BACKGROUND_TARGET_GUIDES[index + 1],
      );

      tileContext.drawImage(
        backgroundImage,
        0,
        sourceY,
        backgroundImage.naturalWidth,
        sourceBottom - sourceY,
        0,
        targetY,
        tileWidth,
        targetBottom - targetY,
      );
    }
  }

  function setOffset(offsetX) {
    travelX = Number.isFinite(offsetX) ? offsetX : 0;
    applyOffset();
  }

  function setCamera({ scale = 1, originX = width / 2, originY = height / 2 } = {}) {
    const safeScale = Number.isFinite(scale) ? Math.max(1, scale) : 1;
    const safeOriginX = Number.isFinite(originX) ? originX : width / 2;
    const safeOriginY = Number.isFinite(originY) ? originY : height / 2;

    root.style.transformOrigin = `${safeOriginX}px ${safeOriginY}px`;
    root.style.transform = safeScale > 1.0001 ? `scale(${safeScale})` : "";
  }

  function applyOffset() {
    const offset = normalizeOffset(travelX, tileWidth);
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  }

  return {
    resize,
    setCamera,
    setOffset,
  };
}

function calculateImageTileWidth(image, viewportWidth, viewportHeight) {
  const sourceViewportWidth = Math.min(
    image.naturalWidth,
    image.naturalHeight * (viewportWidth / viewportHeight),
  );
  const sourcePixelsPerCanvasPixel = sourceViewportWidth / viewportWidth;

  return Math.max(
    viewportWidth,
    Math.ceil(image.naturalWidth / sourcePixelsPerCanvasPixel),
  );
}

function isImageReady(image) {
  return image?.complete && image.naturalWidth > 0;
}

function normalizeOffset(offset, period) {
  return ((offset % period) + period) % period;
}
