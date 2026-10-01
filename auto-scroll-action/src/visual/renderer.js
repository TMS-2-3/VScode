// Set an image path here when artwork is ready. A null value uses the fallback drawing.
const ASSET_PATHS = Object.freeze({
  player: null,
});

export function createRenderer(canvas, lanes) {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D context を作成できません。");
  }

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
    drawLanes();
    drawPlayer(player);
  }

  function drawBackground() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#b8e8ef";
    context.fillRect(0, 0, width, height);
  }

  function drawLanes() {
    const laneData = lanes.getSnapshot();

    for (const lane of laneData) {
      context.strokeStyle = "#dc853d";
      context.lineWidth = Math.max(3, height * 0.005);
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(lane.startX, lane.y);
      context.lineTo(lane.endX, lane.y);
      context.stroke();
    }
  }

  function drawPlayer(player) {
    const footX = width * 0.26;
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
