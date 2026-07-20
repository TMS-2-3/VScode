(() => {
  "use strict";

  window.createHealerTileMapSystem = function createHealerTileMapSystem(options = {}) {
    const tileDefs = options.tileDefs || window.HEALER_TILE_DEFS || {};
    const tileMaps = options.tileMaps || window.HEALER_TILE_MAPS || {};
    const imageCache = new Map();

    function getMap(mapOrId) {
      if (!mapOrId) {
        return null;
      }
      if (typeof mapOrId === "string") {
        return tileMaps[mapOrId] || null;
      }
      return mapOrId;
    }

    function getTileDef(tileId) {
      return tileDefs[tileId] || null;
    }

    function getTileSize(mapOrId) {
      const map = getMap(mapOrId);
      return Math.max(1, Math.floor(Number(map && map.tileSize) || 48));
    }

    function getMapPixelSize(mapOrId) {
      const map = getMap(mapOrId);
      const tileSize = getTileSize(map);
      return {
        w: Math.max(0, Math.floor(Number(map && map.width) || 0)) * tileSize,
        h: Math.max(0, Math.floor(Number(map && map.height) || 0)) * tileSize,
      };
    }

    function worldToTile(mapOrId, x, y) {
      const tileSize = getTileSize(mapOrId);
      return {
        col: Math.floor(Number(x) / tileSize),
        row: Math.floor(Number(y) / tileSize),
      };
    }

    function tileToWorldRect(mapOrId, col, row) {
      const tileSize = getTileSize(mapOrId);
      return {
        x: col * tileSize,
        y: row * tileSize,
        w: tileSize,
        h: tileSize,
      };
    }

    function isInsideMap(mapOrId, col, row) {
      const map = getMap(mapOrId);
      if (!map) {
        return false;
      }
      return col >= 0
        && row >= 0
        && col < Math.floor(Number(map.width) || 0)
        && row < Math.floor(Number(map.height) || 0);
    }

    function getTileIdAt(mapOrId, col, row, layerId = null) {
      const map = getMap(mapOrId);
      if (!map || !isInsideMap(map, col, row)) {
        return null;
      }
      const layers = getVisibleLayers(map)
        .filter((layer) => !layerId || layer.id === layerId);
      for (let i = layers.length - 1; i >= 0; i -= 1) {
        const tileId = getLayerTileId(map, layers[i], col, row);
        if (tileId) {
          return tileId;
        }
      }
      return normalizeTileId(map.defaultTile);
    }

    function getTileStackAt(mapOrId, col, row) {
      const map = getMap(mapOrId);
      if (!map || !isInsideMap(map, col, row)) {
        return [];
      }
      const stack = [];
      const defaultTile = normalizeTileId(map.defaultTile);
      if (defaultTile) {
        stack.push(defaultTile);
      }
      for (const layer of getVisibleLayers(map)) {
        const tileId = getLayerTileId(map, layer, col, row);
        if (tileId) {
          stack.push(tileId);
        }
      }
      return stack;
    }

    function getVisibleLayers(map) {
      return Array.isArray(map && map.layers)
        ? map.layers.filter((layer) => layer && layer.visible !== false)
        : [];
    }

    function getLayerTileId(map, layer, col, row) {
      return normalizeTileId(getLayerTileEntry(map, layer, col, row));
    }

    function getLayerTileEntry(map, layer, col, row) {
      if (!layer || !layer.tiles) {
        return null;
      }
      const tiles = layer.tiles;
      if (Array.isArray(tiles)) {
        const width = Math.floor(Number(map.width) || 0);
        const height = Math.floor(Number(map.height) || 0);
        const rowData = tiles[row];
        if (Array.isArray(rowData)) {
          return rowData[col];
        }
        if (typeof rowData === "string" && tiles.length <= height) {
          return rowData.trim().split(/\s+/)[col];
        }
        return tiles[row * width + col];
      }
      if (typeof tiles === "object") {
        return tiles[`${col},${row}`] || tiles[`${row}:${col}`] || null;
      }
      return null;
    }

    function normalizeTileId(value) {
      if (value && typeof value === "object") {
        return normalizeTileId(value.tileId ?? value.id ?? value.key ?? null);
      }
      if (value === null || value === undefined || value === "" || value === "." || value === false) {
        return null;
      }
      return String(value);
    }

    function getTileRotation(value) {
      if (!value || typeof value !== "object") {
        return 0;
      }
      const rotation = Number(value.rotate ?? value.rotation ?? value.angle ?? 0);
      return Number.isFinite(rotation) ? rotation : 0;
    }

    function getMapMarginTileEntry(map) {
      if (!map) {
        return null;
      }
      return Object.prototype.hasOwnProperty.call(map, "marginTile") ? map.marginTile : map.defaultTile;
    }

    function getMapMarginTileEntries(map) {
      if (!map) {
        return [];
      }
      const marginTiles = map.marginTiles;
      if (marginTiles && typeof marginTiles === "object" && !Array.isArray(marginTiles)) {
        const entries = [];
        const usedLayerIds = new Set();
        for (const layer of getVisibleLayers(map)) {
          if (!layer || !layer.id || !Object.prototype.hasOwnProperty.call(marginTiles, layer.id)) {
            continue;
          }
          usedLayerIds.add(layer.id);
          const tileEntry = marginTiles[layer.id];
          if (normalizeTileId(tileEntry)) {
            entries.push(tileEntry);
          }
        }
        Object.keys(marginTiles).forEach((layerId) => {
          if (usedLayerIds.has(layerId)) {
            return;
          }
          const tileEntry = marginTiles[layerId];
          if (normalizeTileId(tileEntry)) {
            entries.push(tileEntry);
          }
        });
        return entries;
      }
      const legacyTileEntry = getMapMarginTileEntry(map);
      return normalizeTileId(legacyTileEntry) ? [legacyTileEntry] : [];
    }

    function isTilePassable(tileId) {
      const tile = getTileDef(tileId);
      if (!tile) {
        return true;
      }
      return tile.passable !== false && tile.blocksMovement !== true && tile.collision !== true;
    }

    function isTileCoordPassable(mapOrId, col, row, options = {}) {
      const map = getMap(mapOrId);
      if (!map || !isInsideMap(map, col, row)) {
        return options.outOfBoundsPassable === true;
      }
      return getTileStackAt(map, col, row).every(isTilePassable);
    }

    function isWorldPointPassable(mapOrId, x, y, options = {}) {
      const tile = worldToTile(mapOrId, x, y);
      return isTileCoordPassable(mapOrId, tile.col, tile.row, options);
    }

    function isWorldCirclePassable(mapOrId, x, y, radius, options = {}) {
      const tileSize = getTileSize(mapOrId);
      const safeRadius = Math.max(0, Number(radius) || 0);
      const minCol = Math.floor((x - safeRadius) / tileSize);
      const maxCol = Math.floor((x + safeRadius) / tileSize);
      const minRow = Math.floor((y - safeRadius) / tileSize);
      const maxRow = Math.floor((y + safeRadius) / tileSize);
      for (let row = minRow; row <= maxRow; row += 1) {
        for (let col = minCol; col <= maxCol; col += 1) {
          if (!isTileCoordPassable(mapOrId, col, row, options)) {
            return false;
          }
        }
      }
      return true;
    }

    function getEventsAtTile(mapOrId, col, row, trigger = null) {
      const map = getMap(mapOrId);
      if (!map || !isInsideMap(map, col, row)) {
        return [];
      }
      const events = [];
      for (const tileId of getTileStackAt(map, col, row)) {
        addTileEvents(events, tileId, trigger, col, row);
      }
      for (const event of Array.isArray(map.events) ? map.events : []) {
        if (eventMatchesTile(event, col, row, trigger)) {
          events.push(normalizeEvent(event, col, row));
        }
      }
      return events;
    }

    function getStepEvents(mapOrId, x, y) {
      const tile = worldToTile(mapOrId, x, y);
      return getEventsAtTile(mapOrId, tile.col, tile.row, "step");
    }

    function getInspectEvents(mapOrId, x, y, facing = "down", reach = 1) {
      const tile = worldToTile(mapOrId, x, y);
      const dir = getFacingDelta(facing);
      const targetCol = tile.col + dir.x * Math.max(1, Math.floor(reach || 1));
      const targetRow = tile.row + dir.y * Math.max(1, Math.floor(reach || 1));
      return getEventsAtTile(mapOrId, targetCol, targetRow, "inspect");
    }

    function addTileEvents(events, tileId, trigger, col, row) {
      const tile = getTileDef(tileId);
      if (!tile) {
        return;
      }
      const candidates = [];
      if (!trigger || trigger === "step") candidates.push(tile.onStep);
      if (!trigger || trigger === "inspect") candidates.push(tile.onInspect);
      if (Array.isArray(tile.events)) {
        candidates.push(...tile.events);
      }
      for (const event of candidates) {
        if (!event) {
          continue;
        }
        const normalized = typeof event === "string" ? { action: event } : event;
        if (!trigger || !normalized.trigger || normalized.trigger === trigger) {
          events.push(normalizeEvent({ ...normalized, tileId }, col, row));
        }
      }
    }

    function eventMatchesTile(event, col, row, trigger) {
      if (!event || event.enabled === false) {
        return false;
      }
      if (trigger && event.trigger && event.trigger !== trigger) {
        return false;
      }
      const eventCol = Math.floor(Number(event.col ?? event.x) || 0);
      const eventRow = Math.floor(Number(event.row ?? event.y) || 0);
      const width = Math.max(1, Math.floor(Number(event.w ?? event.width) || 1));
      const height = Math.max(1, Math.floor(Number(event.h ?? event.height) || 1));
      return col >= eventCol && row >= eventRow && col < eventCol + width && row < eventRow + height;
    }

    function normalizeEvent(event, col, row) {
      return {
        id: event.id || null,
        trigger: event.trigger || null,
        action: event.action || event.type || "custom",
        payload: event.payload || {},
        onceKey: event.onceKey || null,
        tileId: event.tileId || null,
        col,
        row,
        raw: event,
      };
    }

    function getFacingDelta(facing) {
      if (facing === "left") return { x: -1, y: 0 };
      if (facing === "right") return { x: 1, y: 0 };
      if (facing === "up") return { x: 0, y: -1 };
      return { x: 0, y: 1 };
    }

    function getColumnLabel(col) {
      let index = Math.max(0, Math.floor(Number(col) || 0));
      let label = "";
      do {
        label = String.fromCharCode(65 + (index % 26)) + label;
        index = Math.floor(index / 26) - 1;
      } while (index >= 0);
      return label;
    }

    function getTileCoordLabel(col, row) {
      return `${getColumnLabel(col)}${Math.max(0, Math.floor(Number(row) || 0)) + 1}`;
    }

    function getTileImage(tileId) {
      const tile = getTileDef(tileId);
      const src = tile && (tile.image || tile.src);
      if (!src || typeof Image === "undefined") {
        return null;
      }
      if (imageCache.has(src)) {
        return imageCache.get(src);
      }
      const image = new Image();
      image.src = src;
      imageCache.set(src, image);
      return image;
    }

    function preloadTileImages(mapOrId = null) {
      const ids = new Set();
      if (mapOrId) {
        const map = getMap(mapOrId);
        if (map) {
          forEachMapTile(map, (tileId) => ids.add(tileId));
          for (const marginTileEntry of getMapMarginTileEntries(map)) {
            const marginTileId = normalizeTileId(marginTileEntry);
            if (marginTileId) {
              ids.add(marginTileId);
            }
          }
        }
      } else {
        Object.keys(tileDefs).forEach((tileId) => ids.add(tileId));
      }
      return [...ids].map(getTileImage).filter(Boolean);
    }

    function forEachMapTile(mapOrId, callback) {
      const map = getMap(mapOrId);
      if (!map || typeof callback !== "function") {
        return;
      }
      for (let row = 0; row < Math.floor(Number(map.height) || 0); row += 1) {
        for (let col = 0; col < Math.floor(Number(map.width) || 0); col += 1) {
          for (const tileId of getTileStackAt(map, col, row)) {
            callback(tileId, col, row, map);
          }
        }
      }
    }

    function drawTileMap(ctx, mapOrId, options = {}) {
      const map = getMap(mapOrId);
      if (!ctx || !map) {
        return false;
      }
      const tileSize = getTileSize(map);
      const viewport = options.viewport || { x: 0, y: 0, w: getMapPixelSize(map).w, h: getMapPixelSize(map).h };
      const drawPadding = Math.max(1, Math.floor(Number(options.drawPadding) || 3));
      const minCol = Math.max(0, Math.floor((viewport.x || 0) / tileSize) - drawPadding);
      const minRow = Math.max(0, Math.floor((viewport.y || 0) / tileSize) - drawPadding);
      const maxCol = Math.min(Math.floor(Number(map.width) || 0) - 1, Math.ceil(((viewport.x || 0) + (viewport.w || 0)) / tileSize) + drawPadding);
      const maxRow = Math.min(Math.floor(Number(map.height) || 0) - 1, Math.ceil(((viewport.y || 0) + (viewport.h || 0)) / tileSize) + drawPadding);
      const defaultTile = normalizeTileId(map.defaultTile);
      if (defaultTile) {
        for (let row = minRow; row <= maxRow; row += 1) {
          for (let col = minCol; col <= maxCol; col += 1) {
            drawTile(ctx, defaultTile, col * tileSize, row * tileSize, tileSize, options);
          }
        }
      }
      for (const layer of getVisibleLayers(map)) {
        if (layer.draw === false) {
          continue;
        }
        for (let row = minRow; row <= maxRow; row += 1) {
          for (let col = minCol; col <= maxCol; col += 1) {
            const tileEntry = getLayerTileEntry(map, layer, col, row);
            const tileId = normalizeTileId(tileEntry);
            if (tileId) {
              drawTile(ctx, tileEntry, col * tileSize, row * tileSize, tileSize, options);
            }
          }
        }
      }
      return true;
    }

    function drawMarginTile(ctx, mapOrId, options = {}) {
      const map = getMap(mapOrId);
      if (!ctx || !map) {
        return false;
      }
      const tileEntries = getMapMarginTileEntries(map);
      if (!tileEntries.length) {
        return false;
      }
      const tileSize = getTileSize(map);
      const viewport = options.viewport || { x: 0, y: 0, w: getMapPixelSize(map).w, h: getMapPixelSize(map).h };
      const viewX = Number(viewport.x) || 0;
      const viewY = Number(viewport.y) || 0;
      const viewW = Math.max(0, Number(viewport.w) || 0);
      const viewH = Math.max(0, Number(viewport.h) || 0);
      const minCol = Math.floor(viewX / tileSize) - 1;
      const minRow = Math.floor(viewY / tileSize) - 1;
      const maxCol = Math.ceil((viewX + viewW) / tileSize) + 1;
      const maxRow = Math.ceil((viewY + viewH) / tileSize) + 1;
      for (let row = minRow; row <= maxRow; row += 1) {
        for (let col = minCol; col <= maxCol; col += 1) {
          for (const tileEntry of tileEntries) {
            drawTile(ctx, tileEntry, col * tileSize, row * tileSize, tileSize, options);
          }
        }
      }
      return true;
    }

    function drawTile(ctx, tileEntry, x, y, size, options = {}) {
      const tileId = normalizeTileId(tileEntry);
      const tile = getTileDef(tileId);
      const image = getTileImage(tileId);
      if (image && image.complete && image.naturalWidth > 0) {
        const drawWidth = Math.max(1, Number(tile && tile.drawWidth) || size);
        const drawHeight = Math.max(1, Number(tile && tile.drawHeight) || size);
        const drawOffsetX = Number.isFinite(tile && tile.drawOffsetX) ? tile.drawOffsetX : 0;
        const drawOffsetY = Number.isFinite(tile && tile.drawOffsetY) ? tile.drawOffsetY : 0;
        const rotation = getTileRotation(tileEntry);
        if (rotation) {
          ctx.save();
          ctx.translate(x + drawOffsetX + drawWidth / 2, y + drawOffsetY + drawHeight / 2);
          ctx.rotate(rotation * Math.PI / 180);
          ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          ctx.restore();
        } else {
          ctx.drawImage(image, x + drawOffsetX, y + drawOffsetY, drawWidth, drawHeight);
        }
        return;
      }
      if (options.drawFallback === false) {
        return;
      }
      ctx.fillStyle = tile && tile.passable === false ? "rgba(75,75,75,0.45)" : "rgba(130,170,105,0.45)";
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.strokeRect(x, y, size, size);
    }

    function drawDebugGrid(ctx, mapOrId, options = {}) {
      const map = getMap(mapOrId);
      if (!ctx || !map) {
        return false;
      }
      const tileSize = getTileSize(map);
      const width = Math.floor(Number(map.width) || 0);
      const height = Math.floor(Number(map.height) || 0);
      if (width <= 0 || height <= 0) {
        return false;
      }
      const mapSize = getMapPixelSize(map);
      const viewport = options.viewport || { x: 0, y: 0, w: mapSize.w, h: mapSize.h };
      const minCol = Math.max(0, Math.floor((viewport.x || 0) / tileSize));
      const minRow = Math.max(0, Math.floor((viewport.y || 0) / tileSize));
      const maxCol = Math.min(width - 1, Math.ceil(((viewport.x || 0) + (viewport.w || mapSize.w)) / tileSize));
      const maxRow = Math.min(height - 1, Math.ceil(((viewport.y || 0) + (viewport.h || mapSize.h)) / tileSize));

      ctx.save();
      ctx.strokeStyle = options.gridColor || "rgba(255,255,255,0.46)";
      ctx.lineWidth = Number.isFinite(options.lineWidth) ? options.lineWidth : 1;
      ctx.beginPath();
      for (let col = minCol; col <= maxCol + 1; col += 1) {
        const x = col * tileSize;
        ctx.moveTo(x, minRow * tileSize);
        ctx.lineTo(x, Math.min(mapSize.h, (maxRow + 1) * tileSize));
      }
      for (let row = minRow; row <= maxRow + 1; row += 1) {
        const y = row * tileSize;
        ctx.moveTo(minCol * tileSize, y);
        ctx.lineTo(Math.min(mapSize.w, (maxCol + 1) * tileSize), y);
      }
      ctx.stroke();

      if (options.labels !== false) {
        const fontSize = Math.max(8, Math.min(13, tileSize * 0.24));
        ctx.font = `800 ${fontSize}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        for (let row = minRow; row <= maxRow; row += 1) {
          for (let col = minCol; col <= maxCol; col += 1) {
            const x = col * tileSize + 4;
            const y = row * tileSize + 3;
            const label = getTileCoordLabel(col, row);
            const metrics = ctx.measureText(label);
            ctx.fillStyle = options.labelBackColor || "rgba(0,0,0,0.46)";
            ctx.fillRect(x - 2, y - 1, metrics.width + 4, fontSize + 3);
            ctx.fillStyle = options.labelColor || "#ffffff";
            ctx.fillText(label, x, y);
          }
        }
      }
      ctx.restore();
      return true;
    }

    return {
      getMap,
      getTileDef,
      getTileSize,
      getMapPixelSize,
      worldToTile,
      tileToWorldRect,
      isInsideMap,
      getTileIdAt,
      getTileStackAt,
      isTilePassable,
      isTileCoordPassable,
      isWorldPointPassable,
      isWorldCirclePassable,
      getEventsAtTile,
      getStepEvents,
      getInspectEvents,
      getColumnLabel,
      getTileCoordLabel,
      getTileImage,
      preloadTileImages,
      forEachMapTile,
      drawTileMap,
      drawMarginTile,
      drawDebugGrid,
    };
  };
})();
