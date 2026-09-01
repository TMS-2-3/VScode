(() => {
  "use strict";

  window.createHealerEnemySpriteSystem = function createHealerEnemySpriteSystem(context = {}) {
    const { ENEMY_DEFS = {} } = context;
    const baseImageCache = new Map();
    const renderImageCache = new Map();
    const alphaBoundsCache = typeof WeakMap !== "undefined" ? new WeakMap() : null;

    function normalizePath(path) {
      const text = typeof path === "string" ? path.trim() : "";
      return text || null;
    }

    function normalizeFacing(facing) {
      return facing === "right" ? "right" : "left";
    }

    function getEnemyRole(source) {
      if (typeof source === "string") {
        return source;
      }
      if (!source || typeof source !== "object") {
        return null;
      }
      return source.role || source.enemyRole || source.enemyId || source.enemyType || source.type || null;
    }

    function getEnemyDef(source) {
      const role = getEnemyRole(source);
      return role && ENEMY_DEFS ? ENEMY_DEFS[role] || null : null;
    }

    function getSpriteObjectPath(sprite, usage) {
      if (!sprite || typeof sprite !== "object") {
        return null;
      }
      if (usage === "map") {
        return normalizePath(sprite.mapImagePath || sprite.mapSpritePath || sprite.map || sprite.imagePath || sprite.path || sprite.left);
      }
      if (usage === "battle") {
        return normalizePath(sprite.battleImagePath || sprite.battleSpritePath || sprite.battle || sprite.imagePath || sprite.path || sprite.left);
      }
      return normalizePath(sprite.imagePath || sprite.path || sprite.left || sprite.mapImagePath || sprite.battleImagePath);
    }

    function getDirectSpritePath(source, usage = "battle") {
      if (!source || typeof source !== "object") {
        return null;
      }
      if (usage === "map") {
        return normalizePath(source.mapImagePath || source.mapSpritePath || source.mapImage || source.imagePath || source.spritePath)
          || getSpriteObjectPath(source.sprite || source.enemySprite, "map");
      }
      if (usage === "battle") {
        return normalizePath(source.battleImagePath || source.battleSpritePath || source.battleImage || source.imagePath || source.spritePath)
          || getSpriteObjectPath(source.sprite || source.enemySprite, "battle");
      }
      return normalizePath(source.imagePath || source.spritePath || source.mapImagePath || source.battleImagePath)
        || getSpriteObjectPath(source.sprite || source.enemySprite, usage);
    }

    function getEnemySpritePath(source, usage = "battle") {
      const direct = getDirectSpritePath(source, usage);
      if (direct) {
        return direct;
      }
      return getDirectSpritePath(getEnemyDef(source), usage);
    }

    function createCanvas(width, height) {
      const safeWidth = Math.max(1, Math.ceil(Number(width) || 1));
      const safeHeight = Math.max(1, Math.ceil(Number(height) || 1));
      if (typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(safeWidth, safeHeight);
      }
      if (typeof document !== "undefined" && document.createElement) {
        const canvas = document.createElement("canvas");
        canvas.width = safeWidth;
        canvas.height = safeHeight;
        return canvas;
      }
      return null;
    }

    function makeRightFacingCanvas(image) {
      const width = image && (image.naturalWidth || image.width) || 0;
      const height = image && (image.naturalHeight || image.height) || 0;
      if (width <= 0 || height <= 0) {
        return null;
      }
      const canvas = createCanvas(width, height);
      const ctx = canvas && canvas.getContext && canvas.getContext("2d");
      if (!ctx) {
        return null;
      }
      const previousSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(image, 0, 0, width, height);
      ctx.imageSmoothingEnabled = previousSmoothing;
      return canvas;
    }

    function getImageDimensions(image) {
      return {
        width: image && (image.naturalWidth || image.width) || 0,
        height: image && (image.naturalHeight || image.height) || 0,
      };
    }

    function getImageAlphaBounds(image) {
      const size = getImageDimensions(image);
      const width = Math.floor(size.width);
      const height = Math.floor(size.height);
      if (width <= 0 || height <= 0) {
        return null;
      }
      if (alphaBoundsCache && alphaBoundsCache.has(image)) {
        return alphaBoundsCache.get(image);
      }
      let bounds = null;
      try {
        const canvas = createCanvas(width, height);
        const ctx = canvas && canvas.getContext && canvas.getContext("2d");
        if (!ctx) {
          return null;
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);
        const pixels = ctx.getImageData(0, 0, width, height).data;
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;
        for (let i = 3; i < pixels.length; i += 4) {
          if (pixels[i] <= 8) {
            continue;
          }
          const index = (i - 3) / 4;
          const x = index % width;
          const y = Math.floor(index / width);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
        if (maxX >= minX && maxY >= minY) {
          const padding = 1;
          minX = Math.max(0, minX - padding);
          minY = Math.max(0, minY - padding);
          maxX = Math.min(width - 1, maxX + padding);
          maxY = Math.min(height - 1, maxY + padding);
          bounds = {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
          };
        }
      } catch (error) {
        bounds = null;
      }
      if (alphaBoundsCache) {
        alphaBoundsCache.set(image, bounds);
      }
      return bounds;
    }

    function getEnemySpriteRenderSourceRect(image, usage) {
      const size = getImageDimensions(image);
      const width = Math.max(1, Math.floor(size.width) || 1);
      const height = Math.max(1, Math.floor(size.height) || 1);
      if (usage === "raw") {
        return { x: 0, y: 0, width, height };
      }
      const bounds = getImageAlphaBounds(image);
      return bounds && bounds.width > 0 && bounds.height > 0
        ? bounds
        : { x: 0, y: 0, width, height };
    }

    function loadSpritePath(path) {
      const normalizedPath = normalizePath(path);
      if (!normalizedPath || typeof Image !== "function") {
        return null;
      }
      let record = baseImageCache.get(normalizedPath);
      if (record) {
        return record;
      }
      const image = new Image();
      image.decoding = "async";
      record = {
        path: normalizedPath,
        image,
        rightImage: null,
        status: "loading",
        promise: null,
      };
      record.promise = new Promise((resolve) => {
        image.onload = () => {
          record.status = "ready";
          record.rightImage = makeRightFacingCanvas(image);
          resolve(record);
        };
        image.onerror = () => {
          record.status = "error";
          resolve(record);
        };
      });
      baseImageCache.set(normalizedPath, record);
      image.src = normalizedPath;
      return record;
    }

    function preloadEnemySpritesForSources(sources, usage = "battle") {
      const paths = new Set();
      for (const source of Array.isArray(sources) ? sources : [sources]) {
        const path = getEnemySpritePath(source, usage);
        if (path) {
          paths.add(path);
        }
      }
      const promises = Array.from(paths)
        .map((path) => loadSpritePath(path))
        .filter((record) => record && record.promise)
        .map((record) => record.promise);
      return Promise.all(promises);
    }

    function preloadEnemySpritesForRoles(roles, usage = "battle") {
      return preloadEnemySpritesForSources((Array.isArray(roles) ? roles : [roles]).filter(Boolean), usage);
    }

    function preloadBattleEnemySprites(units) {
      return preloadEnemySpritesForSources(units, "battle");
    }

    function preloadMapEnemySprites(sources) {
      return preloadEnemySpritesForSources(sources, "map");
    }

    function getBaseImageRecord(source, usage = "battle") {
      const path = getEnemySpritePath(source, usage);
      if (!path) {
        return null;
      }
      return loadSpritePath(path);
    }

    function isEnemySpriteReady(source, usage = "battle") {
      const record = getBaseImageRecord(source, usage);
      return Boolean(record && record.status === "ready" && record.image && record.image.naturalWidth > 0 && record.image.naturalHeight > 0);
    }

    function getEnemySpriteImage(source, facing = "left", usage = "battle") {
      const record = getBaseImageRecord(source, usage);
      if (!record || record.status !== "ready") {
        return null;
      }
      if (normalizeFacing(facing) === "right") {
        return record.rightImage || record.image;
      }
      return record.image;
    }

    function getEnemySpriteRenderImage(source, facing = "left", usage = "battle", targetHeight = 0) {
      const image = getEnemySpriteImage(source, facing, usage);
      if (!image) {
        return null;
      }
      const path = getEnemySpritePath(source, usage);
      const rawHeight = Number(targetHeight);
      if (!Number.isFinite(rawHeight) || rawHeight <= 0) {
        return image;
      }
      const height = Math.max(1, Math.round(rawHeight));
      const sourceSize = getImageDimensions(image);
      const sourceHeight = Math.max(1, Math.floor(sourceSize.height) || 1);
      const sourceRect = getEnemySpriteRenderSourceRect(image, usage);
      const scale = height / sourceHeight;
      const width = Math.max(1, Math.round(sourceRect.width * scale));
      const drawHeight = Math.max(1, Math.round(sourceRect.height * scale));
      const cacheKey = `${path}|${usage}|${normalizeFacing(facing)}|${width}x${drawHeight}|${sourceRect.x},${sourceRect.y},${sourceRect.width},${sourceRect.height}`;
      const cached = renderImageCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      const canvas = createCanvas(width, drawHeight);
      const ctx = canvas && canvas.getContext && canvas.getContext("2d");
      if (!ctx) {
        return image;
      }
      const previousSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, drawHeight);
      ctx.drawImage(
        image,
        sourceRect.x,
        sourceRect.y,
        sourceRect.width,
        sourceRect.height,
        0,
        0,
        width,
        drawHeight,
      );
      ctx.imageSmoothingEnabled = previousSmoothing;
      renderImageCache.set(cacheKey, canvas);
      return canvas;
    }

    return {
      getEnemySpritePath,
      isEnemySpriteReady,
      preloadEnemySpritesForSources,
      preloadEnemySpritesForRoles,
      preloadBattleEnemySprites,
      preloadMapEnemySprites,
      getEnemySpriteImage,
      getEnemySpriteRenderImage,
    };
  };
})();
