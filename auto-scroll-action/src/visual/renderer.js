// Set an image path here when artwork is ready. Null values use the fallback drawings.
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
      const imageHeight = height * 0.09;
      const imageWidth = imageHeight * (playerImage.naturalWidth / playerImage.naturalHeight);
      context.drawImage(playerImage, footX - imageWidth / 2, footY - imageHeight, imageWidth, imageHeight);
      return;
    }

    drawFallbackPlayer(footX, footY, player.isDucking);
  }

  function drawFallbackPlayer(footX, footY, isDucking) {
    const characterHeight = height * (isDucking ? 0.045 : 0.09);
    const characterWidth = height * (isDucking ? 0.065 : 0.042);
    const bodyTop = footY - characterHeight;

    context.fillStyle = "#56b6a7";
    context.fillRect(footX - characterWidth / 2, bodyTop + characterHeight * 0.38, characterWidth, characterHeight * 0.62);

    context.fillStyle = "#f18a4b";
    context.beginPath();
    context.arc(footX, bodyTop + characterHeight * 0.23, characterWidth * 0.48, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#312337";
    context.fillRect(footX - characterWidth * 0.2, bodyTop + characterHeight * 0.2, characterWidth * 0.1, characterWidth * 0.1);
    context.fillRect(footX + characterWidth * 0.1, bodyTop + characterHeight * 0.2, characterWidth * 0.1, characterWidth * 0.1);
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
