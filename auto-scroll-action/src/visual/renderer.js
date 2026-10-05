const BACKGROUND_SOURCE_GUIDES = [0, 0.315, 0.545, 0.8, 1];
const BACKGROUND_TARGET_GUIDES = [0, 0.35, 0.6, 0.85, 1];

// Set image paths here when artwork is ready. A null value uses the fallback drawing.
const ASSET_PATHS = Object.freeze({
  background: "./img/halloween-town-background-v6.png",
  player: null,
});

export function createRenderer(canvas, lanes) {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context を作成できません。");
  }

  const backgroundImage = loadImage(ASSET_PATHS.background);
  const playerImage = loadImage(ASSET_PATHS.player);
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

  function render(player) {
    drawBackground();
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
    for (let index = 0; index < BACKGROUND_SOURCE_GUIDES.length - 1; index += 1) {
      const sourceY = Math.round(backgroundImage.naturalHeight * BACKGROUND_SOURCE_GUIDES[index]);
      const sourceBottom = Math.round(
        backgroundImage.naturalHeight * BACKGROUND_SOURCE_GUIDES[index + 1],
      );
      const targetY = Math.round(height * BACKGROUND_TARGET_GUIDES[index]);
      const targetBottom = Math.round(height * BACKGROUND_TARGET_GUIDES[index + 1]);

      context.drawImage(
        backgroundImage,
        0,
        sourceY,
        backgroundImage.naturalWidth,
        sourceBottom - sourceY,
        0,
        targetY,
        width,
        targetBottom - targetY,
      );
    }
  }

  function drawPlayer(player) {
    const footX = width * 0.2;
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

  return {
    render,
    resize,
  };
}

function loadImage(path) {
  if (!path) {
    return null;
  }

  const image = new Image();
  image.src = path;
  return image;
}
