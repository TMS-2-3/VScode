import { CANDY_APPEARANCES } from "../shared/candy-appearances.js";
import { paintCandyArtwork } from "./candy-art.js";
import { paintStampArtwork } from "./stamp-art.js";
import { createStampCelebration } from "./stamp-celebration.js";

const ROULETTE_DURATION_MS = 3200;
const REDUCED_MOTION_DURATION_MS = 900;
const MINIMUM_REEL_STEPS = 12;
const REEL_CYCLES = 6;
const THEFT_ANIMATION_DURATION_MS = 2200;
const REDUCED_MOTION_THEFT_DURATION_MS = 1000;
const THEFT_MOVEMENT_SPEED_RATIO = 0.7;
const THEFT_GRAB_PROGRESS = 0.3;
const THEFT_ESCAPE_PROGRESS = 0.44;
const THEFT_REPEL_APPROACH_RATIO = 0.6;
const THEFT_REPEL_PROGRESS = THEFT_GRAB_PROGRESS * THEFT_REPEL_APPROACH_RATIO;

export function createSupplyRoulette(root) {
  const status = root.querySelector("#supply-roulette-status");
  const theftCanvas = root.querySelector("#supply-theft-canvas");
  const celebrationCanvas = root.querySelector("#stamp-celebration-canvas");
  const result = root.querySelector("#supply-result");
  const goButton = root.querySelector("#supply-go-button");
  const slotViews = [
    {
      container: root.querySelector("#supply-slot-left"),
      canvas: root.querySelector("#supply-item-canvas"),
      name: root.querySelector("#supply-item-name"),
      description: root.querySelector("#supply-item-description"),
    },
    {
      container: root.querySelector("#supply-slot-right"),
      canvas: root.querySelector("#supply-item-canvas-right"),
      name: root.querySelector("#supply-item-name-right"),
      description: root.querySelector("#supply-item-description-right"),
    },
  ];

  if (
    !(status instanceof HTMLElement) ||
    !(theftCanvas instanceof HTMLCanvasElement) ||
    !(celebrationCanvas instanceof HTMLCanvasElement) ||
    !(result instanceof HTMLElement) ||
    !(goButton instanceof HTMLButtonElement) ||
    slotViews.some(
      (view) =>
        !(view.container instanceof HTMLElement) ||
        !(view.canvas instanceof HTMLCanvasElement) ||
        !(view.name instanceof HTMLElement) ||
        !(view.description instanceof HTMLElement),
    )
  ) {
    throw new Error("補給所ルーレットのUI要素が見つかりません。");
  }

  const theftContext = theftCanvas.getContext("2d");
  slotViews.forEach((view) => {
    view.context = view.canvas.getContext("2d");
    view.width = 120;
    view.height = 120;
  });

  if (!theftContext || slotViews.some((view) => !view.context)) {
    throw new Error("補給所ルーレットのCanvasを作成できません。");
  }

  const artworkCache = new Map();
  const stampCelebration = createStampCelebration(celebrationCanvas);
  let animationFrameId = null;
  let pendingGo = null;
  let pendingReveal = null;
  let activeSlots = [];
  let theftCanvasWidth = 1;
  let theftCanvasHeight = 1;
  let pixelRatio = 1;

  function start(
    draw,
    {
      onReveal,
      onGo,
      onSpinTick,
      onSpinComplete,
      onTheftEscape,
      onTheftRepelled,
      onRepelledCandyCollected,
    } = {},
  ) {
    cancelAnimation();
    stampCelebration.reset();
    pendingReveal = typeof onReveal === "function" ? onReveal : null;
    pendingGo = typeof onGo === "function" ? onGo : null;
    activeSlots = normalizeDrawSlots(draw);
    const isLarge = draw.isLarge && activeSlots.length === 2;
    root.hidden = false;
    root.classList.toggle("is-large", isLarge);
    root.setAttribute("aria-busy", "true");
    status.textContent = "抽選中...";
    result.hidden = true;
    goButton.hidden = true;
    theftCanvas.hidden = true;
    slotViews.forEach((view, slotIndex) => {
      view.container.hidden = slotIndex >= activeSlots.length;
      view.name.textContent = "";
      view.description.textContent = "";
      view.description.hidden = false;
    });
    resizeCanvases();

    const reels = activeSlots.map(createReel);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion
      ? REDUCED_MOTION_DURATION_MS
      : ROULETTE_DURATION_MS;
    let startTime = null;
    let previousReelStep = -1;

    function animate(currentTime) {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = 1 - (1 - progress) ** 3;
      reels.forEach((reel, slotIndex) => {
        drawReel(
          slotIndex,
          reel.candidates,
          reel.finalPosition * easedProgress,
        );
      });

      const reelStep = Math.floor(reels[0].finalPosition * easedProgress);

      if (progress < 1 && reelStep !== previousReelStep) {
        previousReelStep = reelStep;
        onSpinTick?.(reelStep);
      }

      if (progress >= 1) {
        onSpinComplete?.();
        finish(reels, {
          onRepelledCandyCollected,
          onTheftEscape,
          onTheftRepelled,
        });
        return;
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  function createReel(slot) {
    const baseCandidates = slot.candidates.length > 0
      ? slot.candidates
      : [slot.item];
    const candidates = baseCandidates.map((candidate) =>
      candidate.type === slot.item.type ? slot.item : candidate,
    );
    const selectedIndex = Math.max(
      0,
      candidates.findIndex((item) => item.type === slot.item.type),
    );
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const minimumCycles = reducedMotion ? 2 : REEL_CYCLES;
    const cycleCount = Math.max(
      minimumCycles,
      Math.ceil(MINIMUM_REEL_STEPS / candidates.length),
    );

    return {
      candidates,
      finalPosition: cycleCount * candidates.length + selectedIndex,
    };
  }

  function finish(reels, callbacks) {
    animationFrameId = null;
    reels.forEach((reel, slotIndex) => {
      drawReel(slotIndex, reel.candidates, reel.finalPosition);
    });
    if (activeSlots.some((slot) => slot.item.artwork === "stamp" && !slot.isStolen)) {
      stampCelebration.start();
    }
    resolveSlot(0, callbacks);
  }

  function resolveSlot(slotIndex, callbacks) {
    if (slotIndex >= activeSlots.length) {
      root.setAttribute("aria-busy", "false");
      status.textContent = "アイテム決定";
      result.hidden = false;
      goButton.hidden = false;
      goButton.focus();
      return;
    }

    const slot = activeSlots[slotIndex];
    pendingReveal?.(slot.item, slotIndex);

    if (slot.isStolen) {
      startTheftAnimation(slotIndex, slot.item, {
        ...callbacks,
        isTheftRepelled: slot.isTheftRepelled,
        onComplete: () => resolveSlot(slotIndex + 1, callbacks),
      });
      return;
    }

    showItemName(slot.item, slotIndex);
    slotViews[slotIndex].description.textContent = slot.item.description;
    resolveSlot(slotIndex + 1, callbacks);
  }

  function startTheftAnimation(
    slotIndex,
    item,
    {
      isTheftRepelled = false,
      onComplete,
      onRepelledCandyCollected,
      onTheftEscape,
      onTheftRepelled,
    } = {},
  ) {
    const view = slotViews[slotIndex];
    root.setAttribute("aria-busy", "true");
    status.textContent = "";
    view.name.textContent = "";
    view.description.textContent = "";
    view.description.hidden = true;
    result.hidden = true;
    goButton.hidden = true;
    view.context.clearRect(0, 0, view.width, view.height);
    drawItemArtworkOn(
      view.context,
      item,
      view.width / 2,
      view.height / 2,
      Math.min(view.width, view.height) * 0.72,
      1,
    );
    resizeTheftCanvas();
    theftCanvas.hidden = false;
    const rootBounds = root.getBoundingClientRect();
    const itemBounds = view.canvas.getBoundingClientRect();
    const targetX = itemBounds.left - rootBounds.left + itemBounds.width / 2;
    const targetY = itemBounds.top - rootBounds.top + itemBounds.height / 2;
    const ghostSize = Math.min(
      150,
      Math.max(88, Math.min(theftCanvasWidth, theftCanvasHeight) * 0.16),
    );
    const route = createTheftRoute(targetX, targetY, ghostSize);
    const candyTarget = getCandyCounterTarget(rootBounds);
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const baseDuration = reducedMotion
      ? REDUCED_MOTION_THEFT_DURATION_MS
      : THEFT_ANIMATION_DURATION_MS;
    const duration = baseDuration / THEFT_MOVEMENT_SPEED_RATIO;
    let startTime = null;
    let hasStartedEscape = false;
    let hasRepelledGhost = false;
    let repelledCandyCount = 0;
    let repelledCandies = [];

    function animateTheft(currentTime) {
      if (startTime === null) {
        startTime = currentTime;
      }

      const progress = Math.min(1, (currentTime - startTime) / duration);

      if (
        isTheftRepelled &&
        !hasRepelledGhost &&
        progress >= THEFT_REPEL_PROGRESS
      ) {
        hasRepelledGhost = true;
        const reward = onTheftRepelled?.();
        repelledCandyCount = Number.isFinite(reward)
          ? Math.max(0, Math.floor(reward))
          : 0;
        repelledCandies = createRepelledCandyTrail(repelledCandyCount);
      }

      drawTheftScene(item, progress, route, {
        candyTarget,
        isTheftRepelled,
        repelledCandies,
        slotIndex,
      });

      if (
        !isTheftRepelled &&
        !hasStartedEscape &&
        progress >= THEFT_ESCAPE_PROGRESS
      ) {
        hasStartedEscape = true;
        onTheftEscape?.();
      }

      if (progress >= 1) {
        animationFrameId = null;
        theftContext.clearRect(0, 0, theftCanvasWidth, theftCanvasHeight);
        theftCanvas.hidden = true;
        status.textContent = isTheftRepelled
          ? "おばけを追い返した！"
          : "おばけに盗まれた！";
        if (isTheftRepelled) {
          showItemName(item, slotIndex);
          view.description.textContent = item.description;
          view.description.hidden = false;
          onRepelledCandyCollected?.(repelledCandyCount);
        } else {
          view.name.textContent = "盗まれた！";
        }
        onComplete?.();
        return;
      }

      animationFrameId = requestAnimationFrame(animateTheft);
    }

    animationFrameId = requestAnimationFrame(animateTheft);
  }

  function resizeCanvases() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    slotViews.forEach((view) => {
      const bounds = view.canvas.getBoundingClientRect();
      view.width = Math.max(1, Math.round(bounds.width || 120));
      view.height = Math.max(1, Math.round(bounds.height || 120));
      view.canvas.width = Math.round(view.width * pixelRatio);
      view.canvas.height = Math.round(view.height * pixelRatio);
      view.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      view.context.imageSmoothingEnabled = true;
      view.context.imageSmoothingQuality = "high";
    });
    artworkCache.clear();
  }

  function resizeTheftCanvas() {
    const bounds = root.getBoundingClientRect();
    theftCanvasWidth = Math.max(1, Math.round(bounds.width || window.innerWidth));
    theftCanvasHeight = Math.max(
      1,
      Math.round(bounds.height || window.innerHeight),
    );
    theftCanvas.width = Math.round(theftCanvasWidth * pixelRatio);
    theftCanvas.height = Math.round(theftCanvasHeight * pixelRatio);
    theftContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    theftContext.imageSmoothingEnabled = true;
    theftContext.imageSmoothingQuality = "high";
  }

  function drawReel(slotIndex, candidates, reelPosition) {
    const view = slotViews[slotIndex];
    view.context.clearRect(0, 0, view.width, view.height);
    const baseIndex = Math.floor(reelPosition);
    const fraction = reelPosition - baseIndex;
    const spacing = view.height * 0.78;
    const artworkSize = Math.min(view.width, view.height) * 0.72;

    for (let offset = -2; offset <= 2; offset += 1) {
      const itemIndex = normalizeIndex(baseIndex + offset, candidates.length);
      const item = candidates[itemIndex];
      const centerY = view.height / 2 + (offset - fraction) * spacing;
      const distanceRatio = Math.min(
        1,
        Math.abs(centerY - view.height / 2) / spacing,
      );
      const opacity = 1 - distanceRatio * 0.72;
      const scale = 1 - distanceRatio * 0.2;
      const artworkScale = item.artwork === "magicClock" ? 1.16 : 1;
      drawItemArtworkOn(
        view.context,
        item,
        view.width / 2,
        centerY,
        artworkSize * scale * artworkScale,
        opacity,
      );
    }

  }

  function drawItemArtworkOn(
    targetContext,
    item,
    centerX,
    centerY,
    size,
    opacity,
  ) {
    const artwork = getCachedArtwork(item);

    if (!artwork) {
      return;
    }

    targetContext.save();
    targetContext.globalAlpha = opacity;
    targetContext.drawImage(
      artwork,
      centerX - size / 2,
      centerY - size / 2,
      size,
      size,
    );
    targetContext.restore();
  }

  function drawTheftScene(
    item,
    progress,
    route,
    {
      candyTarget,
      isTheftRepelled = false,
      repelledCandies = [],
      slotIndex = 0,
    } = {},
  ) {
    theftContext.clearRect(0, 0, theftCanvasWidth, theftCanvasHeight);
    const ghostSize = route.ghostSize;
    const isFleeingFromCostume =
      isTheftRepelled && progress >= THEFT_REPEL_PROGRESS;
    const ghostArtwork = getCachedTheftGhost(isFleeingFromCostume);
    const isCarryingItem =
      !isTheftRepelled && progress >= THEFT_GRAB_PROGRESS;
    let ghostX;
    let ghostY;
    let rotation = 0;

    if (isTheftRepelled) {
      if (!isFleeingFromCostume) {
        const approachProgress = easeOutCubic(
          progress / THEFT_GRAB_PROGRESS,
        );
        ghostX = lerp(route.start.x, route.grab.x, approachProgress);
        ghostY = lerp(route.start.y, route.grab.y, approachProgress);
      } else {
        const fleeProgress = Math.min(
          1,
          (progress - THEFT_REPEL_PROGRESS) /
            (1 - THEFT_REPEL_PROGRESS),
        );
        const easedFleeProgress = easeInCubic(fleeProgress);
        ghostX = lerp(route.repel.x, route.start.x, easedFleeProgress);
        ghostY = lerp(route.repel.y, route.start.y, easedFleeProgress);
        rotation = -route.exitRotation * easedFleeProgress;
      }
    } else if (!isCarryingItem) {
      const approachProgress = easeOutCubic(
        progress / THEFT_GRAB_PROGRESS,
      );
      ghostX = lerp(route.start.x, route.grab.x, approachProgress);
      ghostY = lerp(route.start.y, route.grab.y, approachProgress);
    } else {
      const view = slotViews[slotIndex];
      view.context.clearRect(0, 0, view.width, view.height);
      const escapeProgress = easeInCubic(
        Math.max(
          0,
          (progress - THEFT_ESCAPE_PROGRESS) /
            (1 - THEFT_ESCAPE_PROGRESS),
        ),
      );
      ghostX = lerp(route.grab.x, route.exit.x, escapeProgress);
      ghostY = lerp(route.grab.y, route.exit.y, escapeProgress);
      rotation = route.exitRotation * escapeProgress;
    }

    if (ghostArtwork) {
      theftContext.save();
      theftContext.translate(ghostX, ghostY);
      theftContext.rotate(rotation);
      theftContext.drawImage(
        ghostArtwork,
        -ghostSize / 2,
        -ghostSize / 2,
        ghostSize,
        ghostSize,
      );
      theftContext.restore();
    }

    if (isCarryingItem) {
      const itemX = ghostX - ghostSize * 0.3;
      const itemY = ghostY + ghostSize * 0.06;
      const itemSize = ghostSize * 0.52;
      drawItemArtworkOn(
        theftContext,
        item,
        itemX,
        itemY,
        itemSize,
        1,
      );
    }

    if (isTheftRepelled && isFleeingFromCostume) {
      drawRepelledTheftCandies(
        progress,
        route,
        candyTarget,
        repelledCandies,
      );
    }
  }

  function createTheftRoute(targetX, targetY, ghostSize) {
    const startEdge = Math.floor(Math.random() * 4);
    const exitEdge = (startEdge + 1 + Math.floor(Math.random() * 3)) % 4;
    const margin = ghostSize * 0.8;

    const start = getRandomOutsidePoint(startEdge, margin);
    const grab = {
      x: targetX + ghostSize * 0.3,
      y: targetY - ghostSize * 0.06,
    };

    return {
      exit: getRandomOutsidePoint(exitEdge, margin),
      exitRotation: (Math.random() - 0.5) * 0.7,
      ghostSize,
      grab,
      repel: {
        x: lerp(start.x, grab.x, THEFT_REPEL_APPROACH_RATIO),
        y: lerp(start.y, grab.y, THEFT_REPEL_APPROACH_RATIO),
      },
      start,
    };
  }

  function getCandyCounterTarget(rootBounds) {
    const candyCounter = root.ownerDocument?.querySelector("#candy-counter");
    const counterBounds = candyCounter?.getBoundingClientRect();

    if (counterBounds) {
      return {
        x: counterBounds.left - rootBounds.left + counterBounds.width / 2,
        y: counterBounds.top - rootBounds.top + counterBounds.height / 2,
      };
    }

    return {
      x: theftCanvasWidth - 70,
      y: theftCanvasHeight - 55,
    };
  }

  function createRepelledCandyTrail(candyCount) {
    return Array.from({ length: candyCount }, (_, index) => ({
      appearance: CANDY_APPEARANCES[index % CANDY_APPEARANCES.length],
      arcOffset: (Math.random() - 0.5) * 130,
      delay: index * 0.045,
      rotation: Math.random() * Math.PI * 2,
    }));
  }

  function drawRepelledTheftCandies(
    progress,
    route,
    candyTarget,
    repelledCandies,
  ) {
    if (!candyTarget) {
      return;
    }

    const baseProgress = Math.min(
      1,
      (progress - THEFT_REPEL_PROGRESS) / (1 - THEFT_REPEL_PROGRESS),
    );
    const candySize = route.ghostSize * 0.28;

    repelledCandies.forEach((candy, index) => {
      const candyProgress = Math.min(
        1,
        Math.max(0, (baseProgress - candy.delay) / (1 - candy.delay)),
      );

      if (candyProgress <= 0 || candyProgress >= 1) {
        return;
      }

      const easedProgress = easeInCubic(candyProgress);
      const candyX = quadraticBezier(
        route.repel.x,
        route.repel.x + route.ghostSize * 0.8,
        candyTarget.x,
        easedProgress,
      );
      const candyY = quadraticBezier(
        route.repel.y,
        route.repel.y - route.ghostSize * 0.9 + candy.arcOffset,
        candyTarget.y,
        easedProgress,
      );
      const artwork = getCachedTheftCandy(candy.appearance);

      if (!artwork) {
        return;
      }

      theftContext.save();
      theftContext.translate(candyX, candyY);
      theftContext.rotate(candy.rotation + candyProgress * 6 + index * 0.3);
      theftContext.drawImage(
        artwork,
        -candySize / 2,
        -candySize / 2,
        candySize,
        candySize,
      );
      theftContext.restore();
    });
  }

  function getRandomOutsidePoint(edge, margin) {
    const horizontalPosition = theftCanvasWidth * (0.08 + Math.random() * 0.84);
    const verticalPosition = theftCanvasHeight * (0.08 + Math.random() * 0.84);

    if (edge === 0) {
      return { x: horizontalPosition, y: -margin };
    }

    if (edge === 1) {
      return { x: theftCanvasWidth + margin, y: verticalPosition };
    }

    if (edge === 2) {
      return { x: horizontalPosition, y: theftCanvasHeight + margin };
    }

    return { x: -margin, y: verticalPosition };
  }

  function getCachedArtwork(item) {
    const effectCacheKey = item.artwork === "magicClock"
      ? `:${item.effect?.speedChangePercent ?? "unset"}:${item.effect?.durationSeconds ?? "unset"}`
      : "";
    const cacheKey = `${item.type}${effectCacheKey}:${pixelRatio}`;
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

  function getCachedTheftGhost(isFrightened = false) {
    const mood = isFrightened ? "frightened" : "mischievous";
    const cacheKey = `supply-thief-ghost:${mood}:${pixelRatio}`;
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
    paintTheftGhost(artworkContext, logicalSize, isFrightened);
    artworkCache.set(cacheKey, artwork);
    return artwork;
  }

  function getCachedTheftCandy(appearance) {
    const cacheKey = `theft-candy:${appearance}:${pixelRatio}`;
    const cachedArtwork = artworkCache.get(cacheKey);

    if (cachedArtwork) {
      return cachedArtwork;
    }

    const logicalSize = 48;
    const artwork = createCacheCanvas(
      Math.round(logicalSize * pixelRatio),
      Math.round(logicalSize * pixelRatio),
    );
    const artworkContext = artwork?.getContext("2d");

    if (!artwork || !artworkContext) {
      return null;
    }

    artworkContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    paintCandyArtwork(artworkContext, appearance, logicalSize, logicalSize);
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
    if (item.artwork === "stamp") {
      paintStampArtwork(artworkContext, size, size);
      return;
    }
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

    if (item.artwork === "candyVacuum") {
      paintCandyVacuumItem(artworkContext, size);
      return;
    }

    if (item.artwork === "scaryCostume") {
      paintScaryCostumeItem(artworkContext, size);
      return;
    }

    if (item.artwork === "magicClock") {
      paintMagicClockItem(artworkContext, item, size);
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

  function paintScaryCostumeItem(artworkContext, size) {
    artworkContext.save();
    artworkContext.translate(size / 2, size * 0.52);
    artworkContext.lineJoin = "round";
    artworkContext.lineCap = "round";
    artworkContext.lineWidth = size * 0.035;
    artworkContext.strokeStyle = "#352943";
    const gradient = artworkContext.createLinearGradient(
      0,
      -size * 0.4,
      0,
      size * 0.4,
    );
    gradient.addColorStop(0, "#f7f1ff");
    gradient.addColorStop(1, "#a98dc8");
    artworkContext.fillStyle = gradient;
    artworkContext.shadowColor = "rgba(166, 119, 203, 0.55)";
    artworkContext.shadowBlur = size * 0.09;
    artworkContext.beginPath();
    artworkContext.moveTo(-size * 0.34, size * 0.36);
    artworkContext.lineTo(-size * 0.34, -size * 0.05);
    artworkContext.bezierCurveTo(
      -size * 0.34,
      -size * 0.46,
      size * 0.34,
      -size * 0.46,
      size * 0.34,
      -size * 0.05,
    );
    artworkContext.lineTo(size * 0.34, size * 0.36);
    artworkContext.quadraticCurveTo(
      size * 0.23,
      size * 0.18,
      size * 0.11,
      size * 0.37,
    );
    artworkContext.quadraticCurveTo(0, size * 0.18, -size * 0.11, size * 0.37);
    artworkContext.quadraticCurveTo(
      -size * 0.23,
      size * 0.18,
      -size * 0.34,
      size * 0.36,
    );
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.stroke();
    artworkContext.shadowBlur = 0;

    artworkContext.fillStyle = "#49335b";
    artworkContext.beginPath();
    artworkContext.moveTo(-size * 0.22, -size * 0.09);
    artworkContext.lineTo(-size * 0.06, -size * 0.01);
    artworkContext.lineTo(-size * 0.2, size * 0.06);
    artworkContext.closePath();
    artworkContext.moveTo(size * 0.22, -size * 0.09);
    artworkContext.lineTo(size * 0.06, -size * 0.01);
    artworkContext.lineTo(size * 0.2, size * 0.06);
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.strokeStyle = "#49335b";
    artworkContext.beginPath();
    artworkContext.arc(0, size * 0.12, size * 0.14, 0.12, Math.PI - 0.12);
    artworkContext.stroke();

    artworkContext.fillStyle = "#f5a34b";
    artworkContext.beginPath();
    artworkContext.moveTo(size * 0.25, -size * 0.3);
    artworkContext.lineTo(size * 0.37, -size * 0.39);
    artworkContext.lineTo(size * 0.34, -size * 0.23);
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.stroke();
    artworkContext.restore();
  }

  function paintMagicClockItem(artworkContext, item, size) {
    const rawSpeedPercent = item.effect?.speedChangePercent;
    const speedPercent = Number.isFinite(rawSpeedPercent)
      ? Math.min(50, Math.max(-50, rawSpeedPercent))
      : 0;
    const durationSeconds = Number.isFinite(item.effect?.durationSeconds)
      ? Math.round(item.effect.durationSeconds)
      : null;
    const needleAngle = Math.PI + ((speedPercent + 50) / 100) * Math.PI;

    artworkContext.save();
    artworkContext.translate(size / 2, size / 2);
    artworkContext.lineJoin = "round";
    artworkContext.lineCap = "round";
    artworkContext.strokeStyle = "#30243d";
    artworkContext.lineWidth = size * 0.03;
    artworkContext.shadowColor = "rgba(92, 215, 207, 0.42)";
    artworkContext.shadowBlur = size * 0.08;

    const caseGradient = artworkContext.createLinearGradient(
      -size * 0.4,
      -size * 0.35,
      size * 0.42,
      size * 0.38,
    );
    caseGradient.addColorStop(0, "#6f4c91");
    caseGradient.addColorStop(0.5, "#493868");
    caseGradient.addColorStop(1, "#2e6f78");
    artworkContext.fillStyle = caseGradient;
    artworkContext.beginPath();
    artworkContext.roundRect(
      -size * 0.43,
      -size * 0.39,
      size * 0.86,
      size * 0.78,
      size * 0.15,
    );
    artworkContext.fill();
    artworkContext.stroke();
    artworkContext.shadowBlur = 0;

    artworkContext.fillStyle = "#fff2cf";
    artworkContext.beginPath();
    artworkContext.roundRect(
      -size * 0.36,
      -size * 0.3,
      size * 0.72,
      size * 0.59,
      size * 0.12,
    );
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.lineWidth = size * 0.06;
    artworkContext.strokeStyle = "#cf6687";
    artworkContext.beginPath();
    artworkContext.arc(0, size * 0.05, size * 0.29, Math.PI, Math.PI * 1.5);
    artworkContext.stroke();
    artworkContext.strokeStyle = "#59bfb5";
    artworkContext.beginPath();
    artworkContext.arc(0, size * 0.05, size * 0.29, Math.PI * 1.5, Math.PI * 2);
    artworkContext.stroke();

    artworkContext.strokeStyle = "#594662";
    artworkContext.lineWidth = size * 0.016;
    for (let tick = 0; tick <= 10; tick += 1) {
      const angle = Math.PI + tick / 10 * Math.PI;
      const innerRadius = size * (tick % 5 === 0 ? 0.23 : 0.25);
      const outerRadius = size * 0.32;
      artworkContext.beginPath();
      artworkContext.moveTo(
        Math.cos(angle) * innerRadius,
        size * 0.05 + Math.sin(angle) * innerRadius,
      );
      artworkContext.lineTo(
        Math.cos(angle) * outerRadius,
        size * 0.05 + Math.sin(angle) * outerRadius,
      );
      artworkContext.stroke();
    }

    artworkContext.font = `700 ${size * 0.105}px sans-serif`;
    artworkContext.textAlign = "center";
    artworkContext.textBaseline = "middle";
    artworkContext.fillStyle = "#8e3f62";
    artworkContext.fillText("-50", -size * 0.27, size * 0.1);
    artworkContext.fillStyle = "#267b78";
    artworkContext.fillText("+50", size * 0.27, size * 0.1);

    artworkContext.save();
    artworkContext.translate(0, size * 0.05);
    artworkContext.rotate(needleAngle);
    artworkContext.strokeStyle = speedPercent < 0 ? "#b94571" : "#238f8a";
    artworkContext.lineWidth = size * 0.028;
    artworkContext.beginPath();
    artworkContext.moveTo(-size * 0.035, 0);
    artworkContext.lineTo(size * 0.245, 0);
    artworkContext.stroke();
    artworkContext.restore();

    artworkContext.fillStyle = "#f0a44b";
    artworkContext.strokeStyle = "#30243d";
    artworkContext.lineWidth = size * 0.022;
    artworkContext.beginPath();
    artworkContext.arc(0, size * 0.05, size * 0.045, 0, Math.PI * 2);
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.font = `800 ${size * 0.13}px sans-serif`;
    artworkContext.fillStyle = speedPercent < 0 ? "#a83c65" : "#247d79";
    artworkContext.fillText(
      `${speedPercent > 0 ? "+" : ""}${speedPercent}%`,
      0,
      -size * 0.055,
    );
    artworkContext.font = `800 ${size * 0.13}px sans-serif`;
    artworkContext.fillStyle = "#4c3c5b";
    artworkContext.fillText(
      durationSeconds === null ? "--s" : `${durationSeconds}s`,
      0,
      size * 0.22,
    );

    artworkContext.fillStyle = "#f0a44b";
    artworkContext.strokeStyle = "#30243d";
    artworkContext.beginPath();
    artworkContext.arc(-size * 0.3, -size * 0.35, size * 0.065, 0, Math.PI * 2);
    artworkContext.arc(size * 0.3, -size * 0.35, size * 0.065, 0, Math.PI * 2);
    artworkContext.fill();
    artworkContext.stroke();
    artworkContext.restore();
  }

  function paintTheftGhost(artworkContext, size, isFrightened = false) {
    const centerX = size / 2;
    const centerY = size * 0.52;

    artworkContext.save();
    artworkContext.translate(centerX, centerY);
    artworkContext.lineJoin = "round";
    artworkContext.lineCap = "round";
    artworkContext.lineWidth = size * 0.038;
    artworkContext.strokeStyle = "#342744";
    artworkContext.fillStyle = "rgba(222, 220, 245, 0.96)";
    artworkContext.shadowColor = "rgba(142, 104, 181, 0.5)";
    artworkContext.shadowBlur = size * 0.08;
    artworkContext.beginPath();
    artworkContext.moveTo(-size * 0.36, size * 0.36);
    artworkContext.lineTo(-size * 0.36, -size * 0.03);
    artworkContext.bezierCurveTo(
      -size * 0.36,
      -size * 0.43,
      size * 0.36,
      -size * 0.43,
      size * 0.36,
      -size * 0.03,
    );
    artworkContext.lineTo(size * 0.36, size * 0.36);
    artworkContext.quadraticCurveTo(
      size * 0.25,
      size * 0.19,
      size * 0.12,
      size * 0.36,
    );
    artworkContext.quadraticCurveTo(
      0,
      size * 0.18,
      -size * 0.12,
      size * 0.36,
    );
    artworkContext.quadraticCurveTo(
      -size * 0.25,
      size * 0.19,
      -size * 0.36,
      size * 0.36,
    );
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.stroke();
    artworkContext.shadowBlur = 0;

    artworkContext.fillStyle = "#f3b648";
    artworkContext.beginPath();
    artworkContext.moveTo(-size * 0.24, -size * 0.08);
    artworkContext.lineTo(-size * 0.06, -size * 0.01);
    artworkContext.lineTo(-size * 0.22, size * 0.05);
    artworkContext.closePath();
    artworkContext.moveTo(size * 0.24, -size * 0.08);
    artworkContext.lineTo(size * 0.06, -size * 0.01);
    artworkContext.lineTo(size * 0.22, size * 0.05);
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.strokeStyle = "#513154";
    artworkContext.lineWidth = size * 0.045;
    artworkContext.beginPath();
    artworkContext.moveTo(-size * 0.27, -size * 0.16);
    artworkContext.lineTo(-size * 0.06, -size * 0.08);
    artworkContext.moveTo(size * 0.27, -size * 0.16);
    artworkContext.lineTo(size * 0.06, -size * 0.08);
    artworkContext.stroke();

    artworkContext.fillStyle = "#63345f";
    artworkContext.beginPath();
    artworkContext.arc(0, size * 0.14, size * 0.17, 0.08, Math.PI - 0.08);
    artworkContext.quadraticCurveTo(0, size * 0.3, -size * 0.17, size * 0.14);
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#fff6dc";
    [-0.08, 0.08].forEach((x) => {
      artworkContext.beginPath();
      artworkContext.moveTo(size * x - size * 0.035, size * 0.15);
      artworkContext.lineTo(size * x, size * 0.23);
      artworkContext.lineTo(size * x + size * 0.035, size * 0.15);
      artworkContext.closePath();
      artworkContext.fill();
    });

    if (isFrightened) {
      artworkContext.fillStyle = "rgba(222, 220, 245, 0.98)";
      artworkContext.beginPath();
      artworkContext.ellipse(
        0,
        size * 0.02,
        size * 0.29,
        size * 0.25,
        0,
        0,
        Math.PI * 2,
      );
      artworkContext.fill();
      artworkContext.fillStyle = "#513154";
      artworkContext.beginPath();
      artworkContext.ellipse(-size * 0.13, -size * 0.04, size * 0.06, size * 0.09, 0, 0, Math.PI * 2);
      artworkContext.ellipse(size * 0.13, -size * 0.04, size * 0.06, size * 0.09, 0, 0, Math.PI * 2);
      artworkContext.ellipse(0, size * 0.15, size * 0.075, size * 0.1, 0, 0, Math.PI * 2);
      artworkContext.fill();
    }
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

  function paintCandyVacuumItem(artworkContext, size) {
    artworkContext.save();
    artworkContext.translate(size * 0.5, size * 0.52);
    artworkContext.lineJoin = "round";
    artworkContext.lineCap = "round";
    artworkContext.strokeStyle = "#30243d";

    const suctionGradient = artworkContext.createLinearGradient(
      -size * 0.42,
      0,
      -size * 0.02,
      0,
    );
    suctionGradient.addColorStop(0, "rgba(109, 224, 215, 0.1)");
    suctionGradient.addColorStop(1, "rgba(109, 224, 215, 0.78)");
    artworkContext.strokeStyle = suctionGradient;
    artworkContext.lineWidth = size * 0.045;
    [-0.16, 0, 0.16].forEach((yRatio, index) => {
      artworkContext.beginPath();
      artworkContext.moveTo(-size * 0.43, size * yRatio);
      artworkContext.bezierCurveTo(
        -size * 0.3,
        size * (yRatio + (index - 1) * 0.08),
        -size * 0.2,
        size * (0.03 - yRatio * 0.25),
        -size * 0.08,
        size * 0.03,
      );
      artworkContext.stroke();
    });

    const candies = [
      [-0.36, -0.24, "#f4a34d", -0.25],
      [-0.43, 0.06, "#cf62b8", 0.3],
      [-0.31, 0.26, "#ffd45c", -0.4],
    ];
    candies.forEach(([xRatio, yRatio, color, rotation]) => {
      artworkContext.save();
      artworkContext.translate(size * xRatio, size * yRatio);
      artworkContext.rotate(rotation);
      artworkContext.fillStyle = color;
      artworkContext.strokeStyle = "#30243d";
      artworkContext.lineWidth = size * 0.022;
      artworkContext.beginPath();
      artworkContext.moveTo(-size * 0.045, 0);
      artworkContext.lineTo(-size * 0.09, -size * 0.04);
      artworkContext.lineTo(-size * 0.09, size * 0.04);
      artworkContext.closePath();
      artworkContext.moveTo(size * 0.045, 0);
      artworkContext.lineTo(size * 0.09, -size * 0.04);
      artworkContext.lineTo(size * 0.09, size * 0.04);
      artworkContext.closePath();
      artworkContext.fill();
      artworkContext.stroke();
      artworkContext.beginPath();
      artworkContext.arc(0, 0, size * 0.05, 0, Math.PI * 2);
      artworkContext.fill();
      artworkContext.stroke();
      artworkContext.restore();
    });

    artworkContext.strokeStyle = "#30243d";
    artworkContext.lineWidth = size * 0.032;
    artworkContext.fillStyle = "#4e8293";
    artworkContext.beginPath();
    artworkContext.moveTo(-size * 0.13, -size * 0.11);
    artworkContext.lineTo(size * 0.02, -size * 0.08);
    artworkContext.lineTo(size * 0.02, size * 0.11);
    artworkContext.lineTo(-size * 0.13, size * 0.14);
    artworkContext.closePath();
    artworkContext.fill();
    artworkContext.stroke();

    const bodyGradient = artworkContext.createLinearGradient(
      0,
      -size * 0.28,
      size * 0.42,
      size * 0.3,
    );
    bodyGradient.addColorStop(0, "#75e3d7");
    bodyGradient.addColorStop(0.55, "#58b9ba");
    bodyGradient.addColorStop(1, "#6d4e91");
    artworkContext.fillStyle = bodyGradient;
    artworkContext.beginPath();
    artworkContext.roundRect(
      0,
      -size * 0.25,
      size * 0.4,
      size * 0.5,
      size * 0.13,
    );
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#433052";
    artworkContext.beginPath();
    artworkContext.roundRect(
      size * 0.1,
      -size * 0.37,
      size * 0.22,
      size * 0.13,
      size * 0.045,
    );
    artworkContext.fill();
    artworkContext.stroke();

    artworkContext.fillStyle = "#fff4d2";
    artworkContext.beginPath();
    artworkContext.arc(size * 0.2, 0, size * 0.115, 0, Math.PI * 2);
    artworkContext.fill();
    artworkContext.stroke();
    artworkContext.strokeStyle = "#58b9ba";
    artworkContext.lineWidth = size * 0.025;
    artworkContext.beginPath();
    artworkContext.arc(size * 0.2, 0, size * 0.065, 0, Math.PI * 1.55);
    artworkContext.stroke();

    artworkContext.fillStyle = "#f4a34d";
    artworkContext.strokeStyle = "#30243d";
    artworkContext.lineWidth = size * 0.026;
    [0.08, 0.32].forEach((xRatio) => {
      artworkContext.beginPath();
      artworkContext.arc(size * xRatio, size * 0.26, size * 0.065, 0, Math.PI * 2);
      artworkContext.fill();
      artworkContext.stroke();
    });
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

  function showItemName(item, slotIndex) {
    const view = slotViews[slotIndex];
    view.container.style.setProperty("--supply-item-accent", item.accentColor);
    view.name.textContent = item.name;
  }

  function cancelAnimation() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function reset() {
    cancelAnimation();
    stampCelebration.reset();
    activeSlots = [];
    pendingGo = null;
    pendingReveal = null;
    root.hidden = true;
    root.classList.remove("is-large");
    root.setAttribute("aria-busy", "false");
    result.hidden = true;
    goButton.hidden = true;
    slotViews.forEach((view, slotIndex) => {
      view.container.hidden = slotIndex > 0;
      view.name.textContent = "";
      view.description.textContent = "";
      view.description.hidden = false;
      view.context.clearRect(0, 0, view.width, view.height);
    });
    theftContext.clearRect(0, 0, theftCanvasWidth, theftCanvasHeight);
    theftCanvas.hidden = true;
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

function normalizeDrawSlots(draw) {
  if (Array.isArray(draw?.slots)) {
    return draw.slots.filter((slot) => slot?.item).slice(0, 2);
  }

  return draw?.item ? [draw] : [];
}

function normalizeIndex(index, length) {
  return ((index % length) + length) % length;
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function quadraticBezier(start, control, end, progress) {
  const inverseProgress = 1 - progress;
  return (
    inverseProgress ** 2 * start +
    2 * inverseProgress * progress * control +
    progress ** 2 * end
  );
}

function easeOutCubic(progress) {
  const safeProgress = Math.min(1, Math.max(0, progress));
  return 1 - (1 - safeProgress) ** 3;
}

function easeInCubic(progress) {
  const safeProgress = Math.min(1, Math.max(0, progress));
  return safeProgress ** 3;
}
