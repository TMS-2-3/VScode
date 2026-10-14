const ROULETTE_DURATION_MS = 3200;
const REDUCED_MOTION_DURATION_MS = 900;
const MINIMUM_REEL_STEPS = 12;
const REEL_CYCLES = 6;

export function createSupplyRoulette(root) {
  const status = root.querySelector("#supply-roulette-status");
  const itemCanvas = root.querySelector("#supply-item-canvas");
  const itemName = root.querySelector("#supply-item-name");
  const result = root.querySelector("#supply-result");
  const description = root.querySelector("#supply-item-description");
  const goButton = root.querySelector("#supply-go-button");

  if (
    !(status instanceof HTMLElement) ||
    !(itemCanvas instanceof HTMLCanvasElement) ||
    !(itemName instanceof HTMLElement) ||
    !(result instanceof HTMLElement) ||
    !(description instanceof HTMLElement) ||
    !(goButton instanceof HTMLButtonElement)
  ) {
    throw new Error("補給所ルーレットのUI要素が見つかりません。");
  }

  const context = itemCanvas.getContext("2d");

  if (!context) {
    throw new Error("補給所ルーレットのCanvasを作成できません。");
  }

  const artworkCache = new Map();
  let animationFrameId = null;
  let pendingGo = null;
  let pendingReveal = null;
  let activeDraw = null;
  let canvasWidth = 120;
  let canvasHeight = 120;
  let pixelRatio = 1;

  function start(draw, { onReveal, onGo } = {}) {
    cancelAnimation();
    activeDraw = draw;
    pendingReveal = typeof onReveal === "function" ? onReveal : null;
    pendingGo = typeof onGo === "function" ? onGo : null;
    root.hidden = false;
    root.setAttribute("aria-busy", "true");
    status.textContent = "抽選中...";
    itemName.textContent = "";
    result.hidden = true;
    goButton.hidden = true;
    resizeCanvas();

    const candidates = draw.candidates.length > 0
      ? draw.candidates
      : [draw.item];
    const selectedIndex = Math.max(
      0,
      candidates.findIndex((item) => item.type === draw.item.type),
    );
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion
      ? REDUCED_MOTION_DURATION_MS
      : ROULETTE_DURATION_MS;
    const minimumCycles = reducedMotion ? 2 : REEL_CYCLES;
    const cycleCount = Math.max(
      minimumCycles,
      Math.ceil(MINIMUM_REEL_STEPS / candidates.length),
    );
    const finalReelPosition = cycleCount * candidates.length + selectedIndex;
    let startTime = null;

    function animate(currentTime) {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = 1 - (1 - progress) ** 3;
      const reelPosition = finalReelPosition * easedProgress;
      drawReel(candidates, reelPosition);

      if (progress >= 1) {
        finish(candidates, finalReelPosition);
        return;
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  function finish(candidates, finalReelPosition) {
    animationFrameId = null;
    drawReel(candidates, finalReelPosition);
    showItemName(activeDraw.item);
    root.setAttribute("aria-busy", "false");
    status.textContent = "アイテム決定";
    description.textContent = activeDraw.item.description;
    result.hidden = false;
    goButton.hidden = false;
    pendingReveal?.(activeDraw.item);
    goButton.focus();
  }

  function resizeCanvas() {
    const bounds = itemCanvas.getBoundingClientRect();
    canvasWidth = Math.max(1, Math.round(bounds.width || 120));
    canvasHeight = Math.max(1, Math.round(bounds.height || 120));
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    itemCanvas.width = Math.round(canvasWidth * pixelRatio);
    itemCanvas.height = Math.round(canvasHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    artworkCache.clear();
  }

  function drawReel(candidates, reelPosition) {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    const baseIndex = Math.floor(reelPosition);
    const fraction = reelPosition - baseIndex;
    const spacing = canvasHeight * 0.78;
    const artworkSize = Math.min(canvasWidth, canvasHeight) * 0.72;

    for (let offset = -2; offset <= 2; offset += 1) {
      const itemIndex = normalizeIndex(baseIndex + offset, candidates.length);
      const item = candidates[itemIndex];
      const centerY = canvasHeight / 2 + (offset - fraction) * spacing;
      const distanceRatio = Math.min(
        1,
        Math.abs(centerY - canvasHeight / 2) / spacing,
      );
      const opacity = 1 - distanceRatio * 0.72;
      const scale = 1 - distanceRatio * 0.2;
      drawItemArtwork(
        item,
        canvasWidth / 2,
        centerY,
        artworkSize * scale,
        opacity,
      );
    }

  }

  function drawItemArtwork(item, centerX, centerY, size, opacity) {
    const artwork = getCachedArtwork(item);

    if (!artwork) {
      return;
    }

    context.save();
    context.globalAlpha = opacity;
    context.drawImage(
      artwork,
      centerX - size / 2,
      centerY - size / 2,
      size,
      size,
    );
    context.restore();
  }

  function getCachedArtwork(item) {
    const cacheKey = `${item.type}:${pixelRatio}`;
    const cachedArtwork = artworkCache.get(cacheKey);

    if (cachedArtwork) {
      return cachedArtwork;
    }

    const logicalSize = 120;
    const artwork = createCacheCanvas(
      Math.round(logicalSize * pixelRatio),
      Math.round(logicalSize * pixelRatio),
    );
    const artworkContext = artwork?.getContext("2d");

    if (!artwork || !artworkContext) {
      return null;
    }

    artworkContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    paintTemporaryItem(artworkContext, item, logicalSize);
    artworkCache.set(cacheKey, artwork);
    return artwork;
  }

  function createCacheCanvas(cacheWidth, cacheHeight) {
    if (typeof OffscreenCanvas === "function") {
      return new OffscreenCanvas(cacheWidth, cacheHeight);
    }

    const cache = root.ownerDocument?.createElement("canvas");

    if (!cache) {
      return null;
    }

    cache.width = cacheWidth;
    cache.height = cacheHeight;
    return cache;
  }

  function paintTemporaryItem(artworkContext, item, size) {
    const centerX = size / 2;
    const centerY = size / 2;
    const bottleWidth = size * 0.46;
    const bottleHeight = size * 0.62;

    artworkContext.save();
    artworkContext.translate(centerX, centerY);
    artworkContext.lineJoin = "round";
    artworkContext.lineWidth = size * 0.035;
    artworkContext.strokeStyle = "#30283a";
    artworkContext.fillStyle = item.accentColor;
    artworkContext.beginPath();
    artworkContext.roundRect(
      -bottleWidth / 2,
      -bottleHeight * 0.38,
      bottleWidth,
      bottleHeight * 0.78,
      size * 0.09,
    );
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#f6e5bc";
    artworkContext.fillRect(
      -bottleWidth * 0.22,
      -bottleHeight * 0.55,
      bottleWidth * 0.44,
      bottleHeight * 0.17,
    );
    artworkContext.strokeRect(
      -bottleWidth * 0.22,
      -bottleHeight * 0.55,
      bottleWidth * 0.44,
      bottleHeight * 0.17,
    );

    artworkContext.fillStyle = "#fff8df";
    artworkContext.beginPath();
    artworkContext.arc(0, bottleHeight * 0.02, size * 0.18, 0, Math.PI * 2);
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#ef8d45";
    artworkContext.beginPath();
    artworkContext.moveTo(size * 0.04, -size * 0.14);
    artworkContext.lineTo(-size * 0.11, size * 0.03);
    artworkContext.lineTo(-size * 0.01, size * 0.03);
    artworkContext.lineTo(-size * 0.06, size * 0.19);
    artworkContext.lineTo(size * 0.12, -size * 0.02);
    artworkContext.lineTo(size * 0.02, -size * 0.02);
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.restore();
  }

  function showItemName(item) {
    root.style.setProperty("--supply-item-accent", item.accentColor);
    itemName.textContent = item.name;
  }

  function cancelAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function reset() {
    cancelAnimation();
    activeDraw = null;
    pendingGo = null;
    pendingReveal = null;
    root.hidden = true;
    root.setAttribute("aria-busy", "false");
    result.hidden = true;
    goButton.hidden = true;
    itemName.textContent = "";
    context.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  function onShortcutKeyDown(event) {
    if (
      event.code !== "Space" ||
      event.repeat ||
      root.hidden ||
      goButton.hidden
    ) {
      return;
    }

    event.preventDefault();
    goButton.click();
  }

  goButton.addEventListener("click", () => {
    const onGo = pendingGo;
    reset();
    onGo?.();
  });
  window.addEventListener("keydown", onShortcutKeyDown);

  reset();

  return {
    reset,
    start,
  };
}

function normalizeIndex(index, length) {
  return ((index % length) + length) % length;
}
