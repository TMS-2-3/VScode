(() => {
  "use strict";

  window.createHealerEnemySpriteSystem = function createHealerEnemySpriteSystem(context = {}) {
    const { ENEMY_DEFS = {} } = context;
    const baseImageCache = new Map();
    const renderImageCache = new Map();

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
      const sourceWidth = image.naturalWidth || image.width || 1;
      const sourceHeight = image.naturalHeight || image.height || 1;
      const width = Math.max(1, Math.round(height * sourceWidth / Math.max(1, sourceHeight)));
      const cacheKey = `${path}|${normalizeFacing(facing)}|${width}x${height}`;
      const cached = renderImageCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      const canvas = createCanvas(width, height);
      const ctx = canvas && canvas.getContext && canvas.getContext("2d");
      if (!ctx) {
        return image;
      }
      const previousSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
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
