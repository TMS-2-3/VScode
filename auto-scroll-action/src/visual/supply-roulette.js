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
    if (item.artwork === "candyBag") {
      paintCandyAssortment(artworkContext, size);
      return;
    }

    if (item.artwork === "pumpkinBarrier") {
      paintPumpkinBarrierItem(artworkContext, size);
      return;
    }

    if (item.artwork === "candyParty") {
      paintCandyPartyItem(artworkContext, size);
      return;
    }

    if (item.artwork === "candyLauncher") {
      paintCandyLauncherItem(artworkContext, size);
      return;
    }

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

  function paintPumpkinBarrierItem(artworkContext, size) {
    const centerX = size / 2;
    const centerY = size / 2;

    artworkContext.save();
    artworkContext.translate(centerX, centerY);
    artworkContext.lineJoin = "round";
    artworkContext.lineCap = "round";

    artworkContext.fillStyle = "rgba(255, 191, 74, 0.2)";
    artworkContext.strokeStyle = "#ffd45c";
    artworkContext.lineWidth = size * 0.045;
    artworkContext.beginPath();
    artworkContext.arc(0, 0, size * 0.4, 0, Math.PI * 2);
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.strokeStyle = "rgba(242, 138, 50, 0.72)";
    artworkContext.lineWidth = size * 0.025;
    artworkContext.beginPath();
    artworkContext.arc(0, 0, size * 0.32, 0, Math.PI * 2);
    artworkContext.stroke();

    artworkContext.fillStyle = "#5d8e3e";
    artworkContext.strokeStyle = "#30283a";
    artworkContext.lineWidth = size * 0.035;
    artworkContext.beginPath();
    artworkContext.roundRect(
      -size * 0.055,
      -size * 0.32,
      size * 0.11,
      size * 0.14,
      size * 0.025,
    );
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#f28a32";
    [-0.14, 0, 0.14].forEach((xRatio) => {
      artworkContext.beginPath();
      artworkContext.ellipse(
        size * xRatio,
        size * 0.02,
        size * 0.19,
        size * 0.25,
        0,
        0,
        Math.PI * 2,
      );
      artworkContext.fill();
      artworkContext.stroke();
    });

    artworkContext.fillStyle = "#4a273f";
    artworkContext.beginPath();
    artworkContext.moveTo(-size * 0.17, -size * 0.01);
    artworkContext.lineTo(-size * 0.06, -size * 0.07);
    artworkContext.lineTo(-size * 0.08, size * 0.04);
    artworkContext.closePath();
    artworkContext.moveTo(size * 0.17, -size * 0.01);
    artworkContext.lineTo(size * 0.06, -size * 0.07);
    artworkContext.lineTo(size * 0.08, size * 0.04);
    artworkContext.closePath();
    artworkContext.fill();

    artworkContext.strokeStyle = "#4a273f";
    artworkContext.lineWidth = size * 0.035;
    artworkContext.beginPath();
    artworkContext.arc(0, size * 0.06, size * 0.13, 0.12, Math.PI - 0.12);
    artworkContext.stroke();
    artworkContext.restore();
  }

  function paintCandyPartyItem(artworkContext, size) {
    const centerX = size / 2;
    const centerY = size / 2;

    artworkContext.save();
    artworkContext.translate(centerX, centerY);
    artworkContext.lineJoin = "round";
    artworkContext.lineCap = "round";
    artworkContext.strokeStyle = "#30283a";
    artworkContext.lineWidth = size * 0.028;

    const confetti = [
      [-0.32, -0.3, -0.2, "#69d0c5"],
      [-0.18, -0.43, 0.35, "#ffd45c"],
      [0.05, -0.4, -0.4, "#ef8d45"],
      [0.27, -0.34, 0.3, "#cf62b8"],
      [0.36, -0.14, -0.25, "#69d0c5"],
    ];

    confetti.forEach(([xRatio, yRatio, rotation, color]) => {
      artworkContext.save();
      artworkContext.translate(size * xRatio, size * yRatio);
      artworkContext.rotate(rotation);
      artworkContext.fillStyle = color;
      artworkContext.fillRect(
        -size * 0.018,
        -size * 0.055,
        size * 0.036,
        size * 0.11,
      );
      artworkContext.restore();
    });

    const candies = [
      [-0.27, -0.16, "#ffd45c", -0.35],
      [-0.08, -0.31, "#ef8d45", 0.2],
      [0.15, -0.25, "#cf62b8", -0.15],
      [0.31, -0.08, "#69d0c5", 0.4],
    ];

    candies.forEach(([xRatio, yRatio, color, rotation]) => {
      artworkContext.save();
      artworkContext.translate(size * xRatio, size * yRatio);
      artworkContext.rotate(rotation);
      artworkContext.fillStyle = color;
      artworkContext.beginPath();
      artworkContext.moveTo(-size * 0.07, 0);
      artworkContext.lineTo(-size * 0.13, -size * 0.055);
      artworkContext.lineTo(-size * 0.13, size * 0.055);
      artworkContext.closePath();
      artworkContext.moveTo(size * 0.07, 0);
      artworkContext.lineTo(size * 0.13, -size * 0.055);
      artworkContext.lineTo(size * 0.13, size * 0.055);
      artworkContext.closePath();
      artworkContext.fill();
      artworkContext.stroke();
      artworkContext.beginPath();
      artworkContext.arc(0, 0, size * 0.075, 0, Math.PI * 2);
      artworkContext.fill();
      artworkContext.stroke();
      artworkContext.restore();
    });

    const boxGradient = artworkContext.createLinearGradient(
      0,
      size * 0.05,
      0,
      size * 0.42,
    );
    boxGradient.addColorStop(0, "#9b55aa");
    boxGradient.addColorStop(1, "#633a78");
    artworkContext.fillStyle = boxGradient;
    artworkContext.beginPath();
    artworkContext.moveTo(-size * 0.34, size * 0.08);
    artworkContext.lineTo(size * 0.34, size * 0.08);
    artworkContext.lineTo(size * 0.26, size * 0.4);
    artworkContext.lineTo(-size * 0.26, size * 0.4);
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#f0a44b";
    artworkContext.fillRect(
      -size * 0.04,
      size * 0.09,
      size * 0.08,
      size * 0.3,
    );
    artworkContext.strokeRect(
      -size * 0.04,
      size * 0.09,
      size * 0.08,
      size * 0.3,
    );

    artworkContext.fillStyle = "#ffd45c";
    artworkContext.beginPath();
    for (let pointIndex = 0; pointIndex < 10; pointIndex += 1) {
      const radius = size * (pointIndex % 2 === 0 ? 0.09 : 0.04);
      const angle = -Math.PI / 2 + pointIndex * Math.PI / 5;
      const pointX = Math.cos(angle) * radius;
      const pointY = size * 0.24 + Math.sin(angle) * radius;

      if (pointIndex === 0) {
        artworkContext.moveTo(pointX, pointY);
      } else {
        artworkContext.lineTo(pointX, pointY);
      }
    }
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.stroke();
    artworkContext.restore();
  }

  function paintCandyLauncherItem(artworkContext, size) {
    artworkContext.save();
    artworkContext.translate(size * 0.48, size * 0.52);
    artworkContext.rotate(-0.13);
    artworkContext.lineJoin = "round";
    artworkContext.lineCap = "round";
    artworkContext.lineWidth = size * 0.035;
    artworkContext.strokeStyle = "#30243d";

    const bodyGradient = artworkContext.createLinearGradient(
      -size * 0.3,
      0,
      size * 0.28,
      0,
    );
    bodyGradient.addColorStop(0, "#8453a8");
    bodyGradient.addColorStop(0.55, "#cf62a5");
    bodyGradient.addColorStop(1, "#5cc7bd");
    artworkContext.fillStyle = bodyGradient;
    artworkContext.beginPath();
    artworkContext.roundRect(
      -size * 0.31,
      -size * 0.13,
      size * 0.55,
      size * 0.27,
      size * 0.075,
    );
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#f4a34d";
    artworkContext.beginPath();
    artworkContext.moveTo(size * 0.18, -size * 0.18);
    artworkContext.lineTo(size * 0.34, -size * 0.24);
    artworkContext.lineTo(size * 0.34, size * 0.24);
    artworkContext.lineTo(size * 0.18, size * 0.18);
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#5b3b72";
    artworkContext.beginPath();
    artworkContext.roundRect(
      -size * 0.09,
      size * 0.1,
      size * 0.13,
      size * 0.25,
      size * 0.04,
    );
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#ffd45c";
    artworkContext.beginPath();
    artworkContext.arc(-size * 0.22, 0, size * 0.075, 0, Math.PI * 2);
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.strokeStyle = "rgba(255, 244, 210, 0.82)";
    artworkContext.lineWidth = size * 0.018;
    [-0.12, 0, 0.12].forEach((xRatio) => {
      artworkContext.beginPath();
      artworkContext.moveTo(size * xRatio, -size * 0.11);
      artworkContext.lineTo(size * (xRatio + 0.08), size * 0.11);
      artworkContext.stroke();
    });

    const projectileGradient = artworkContext.createRadialGradient(
      size * 0.48,
      -size * 0.05,
      0,
      size * 0.52,
      0,
      size * 0.17,
    );
    projectileGradient.addColorStop(0, "#fff0a2");
    projectileGradient.addColorStop(0.5, "#f49b4d");
    projectileGradient.addColorStop(1, "#cf62a5");
    artworkContext.fillStyle = projectileGradient;
    artworkContext.strokeStyle = "#30243d";
    artworkContext.lineWidth = size * 0.028;
    artworkContext.beginPath();
    artworkContext.arc(size * 0.52, 0, size * 0.14, 0, Math.PI * 2);
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#5cc7bd";
    artworkContext.beginPath();
    artworkContext.ellipse(
      size * 0.48,
      -size * 0.035,
      size * 0.045,
      size * 0.03,
      -0.4,
      0,
      Math.PI * 2,
    );
    artworkContext.fill();
    artworkContext.stroke();
    artworkContext.restore();
  }

  function paintCandyAssortment(artworkContext, size) {
    const centerX = size / 2;
    const centerY = size / 2;
    const outlineWidth = size * 0.035;

    artworkContext.save();
    artworkContext.translate(centerX, centerY);
    artworkContext.lineJoin = "round";
    artworkContext.lineCap = "round";
    artworkContext.lineWidth = outlineWidth;
    artworkContext.strokeStyle = "#30283a";

    const candies = [
      { x: -size * 0.2, y: -size * 0.21, color: "#ffd45c" },
      { x: 0, y: -size * 0.27, color: "#ef8d45" },
      { x: size * 0.2, y: -size * 0.2, color: "#cf62b8" },
    ];

    candies.forEach((candy) => {
      artworkContext.fillStyle = candy.color;
      artworkContext.beginPath();
      artworkContext.arc(candy.x, candy.y, size * 0.11, 0, Math.PI * 2);
      artworkContext.fill();
      artworkContext.stroke();
    });

    artworkContext.fillStyle = "#77458f";
    artworkContext.beginPath();
    artworkContext.moveTo(-size * 0.31, -size * 0.13);
    artworkContext.quadraticCurveTo(
      -size * 0.39,
      size * 0.04,
      -size * 0.29,
      size * 0.34,
    );
    artworkContext.quadraticCurveTo(
      0,
      size * 0.45,
      size * 0.29,
      size * 0.34,
    );
    artworkContext.quadraticCurveTo(
      size * 0.39,
      size * 0.04,
      size * 0.31,
      -size * 0.13,
    );
    artworkContext.quadraticCurveTo(0, -size * 0.02, -size * 0.31, -size * 0.13);
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#f0a44b";
    artworkContext.beginPath();
    artworkContext.roundRect(
      -size * 0.27,
      -size * 0.09,
      size * 0.54,
      size * 0.075,
      size * 0.025,
    );
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#fff4d2";
    artworkContext.beginPath();
    artworkContext.arc(0, size * 0.18, size * 0.17, 0, Math.PI * 2);
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#ef8d45";
    artworkContext.beginPath();
    for (let pointIndex = 0; pointIndex < 10; pointIndex += 1) {
      const radius = size * (pointIndex % 2 === 0 ? 0.105 : 0.047);
      const angle = -Math.PI / 2 + pointIndex * Math.PI / 5;
      const pointX = Math.cos(angle) * radius;
      const pointY = size * 0.18 + Math.sin(angle) * radius;

      if (pointIndex === 0) {
        artworkContext.moveTo(pointX, pointY);
      } else {
        artworkContext.lineTo(pointX, pointY);
      }
    }
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
