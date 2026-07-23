(() => {
  "use strict";

  window.createHealerTileMapSystem = function createHealerTileMapSystem(options = {}) {
    const tileDefs = options.tileDefs || window.HEALER_TILE_DEFS || {};
    const tileMaps = options.tileMaps || window.HEALER_TILE_MAPS || {};
    const imageCache = new Map();
    const marginTileCache = new Map();

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

    function createLayerIdSet(value) {
      if (Array.isArray(value)) {
        return new Set(value.map((entry) => String(entry)));
      }
      if (typeof value === "string") {
        return new Set([value]);
      }
      return null;
    }

    function shouldUseLayer(layer, includeLayerIds, excludeLayerIds) {
      if (!layer || layer.draw === false) {
        return false;
      }
      const layerId = String(layer.id || "");
      if (includeLayerIds && !includeLayerIds.has(layerId)) {
        return false;
      }
      if (excludeLayerIds && excludeLayerIds.has(layerId)) {
        return false;
      }
      return true;
    }

    function getViewportTileBounds(map, viewport, drawPadding) {
      const tileSize = getTileSize(map);
      const mapSize = getMapPixelSize(map);
      const safeViewport = viewport || { x: 0, y: 0, w: mapSize.w, h: mapSize.h };
      const padding = Math.max(1, Math.floor(Number(drawPadding) || 3));
      return {
        tileSize,
        minCol: Math.max(0, Math.floor((safeViewport.x || 0) / tileSize) - padding),
        minRow: Math.max(0, Math.floor((safeViewport.y || 0) / tileSize) - padding),
        maxCol: Math.min(Math.floor(Number(map.width) || 0) - 1, Math.ceil(((safeViewport.x || 0) + (safeViewport.w || 0)) / tileSize) + padding),
        maxRow: Math.min(Math.floor(Number(map.height) || 0) - 1, Math.ceil(((safeViewport.y || 0) + (safeViewport.h || 0)) / tileSize) + padding),
      };
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

    function readPositiveTileSpan(tile, keys) {
      if (!tile) {
        return 1;
      }
      for (const key of keys) {
        const value = Math.floor(Number(tile[key]) || 0);
        if (value > 0) {
          return value;
        }
      }
      return 1;
    }

    function getTileFootprint(tileEntry) {
      const tileId = normalizeTileId(tileEntry);
      const tile = getTileDef(tileId);
      let width = readPositiveTileSpan(tile, ["footprintWidth", "footprintW", "tileWidth", "widthTiles", "collisionWidth"]);
      let height = readPositiveTileSpan(tile, ["footprintHeight", "footprintH", "tileHeight", "heightTiles", "collisionHeight"]);
      const rotation = Math.abs(getTileRotation(tileEntry)) % 180;
      if (rotation === 90) {
        [width, height] = [height, width];
      }
      return { width, height };
    }

    function getMaxTileFootprint() {
      let width = 1;
      let height = 1;
      Object.keys(tileDefs).forEach((tileId) => {
        const footprint = getTileFootprint(tileId);
        width = Math.max(width, footprint.width);
        height = Math.max(height, footprint.height);
      });
      return { width, height };
    }

    function tilePlacementCoversCoord(originCol, originRow, tileEntry, col, row) {
      const footprint = getTileFootprint(tileEntry);
      return col >= originCol
        && row >= originRow
        && col < originCol + footprint.width
        && row < originRow + footprint.height;
    }

    function forEachTilePlacementCoveringCoord(mapOrId, col, row, callback) {
      const map = getMap(mapOrId);
      if (!map || !isInsideMap(map, col, row) || typeof callback !== "function") {
        return false;
      }
      const maxFootprint = getMaxTileFootprint();
      const minOriginCol = Math.max(0, col - maxFootprint.width + 1);
      const minOriginRow = Math.max(0, row - maxFootprint.height + 1);
      for (const layer of getVisibleLayers(map)) {
        for (let originRow = minOriginRow; originRow <= row; originRow += 1) {
          for (let originCol = minOriginCol; originCol <= col; originCol += 1) {
            const tileEntry = getLayerTileEntry(map, layer, originCol, originRow);
            const tileId = normalizeTileId(tileEntry);
            if (!tileId || !tilePlacementCoversCoord(originCol, originRow, tileEntry, col, row)) {
              continue;
            }
            callback({
              tileEntry,
              tileId,
              layer,
              col: originCol,
              row: originRow,
              footprint: getTileFootprint(tileEntry),
            });
          }
        }
      }
      return true;
    }

    function getMapMarginTileEntry(map) {
      if (!map) {
        return null;
      }
      return Object.prototype.hasOwnProperty.call(map, "marginTile") ? map.marginTile : map.defaultTile;
    }

    function shouldUseMarginLayerId(layerId, includeLayerIds, excludeLayerIds) {
      const safeLayerId = String(layerId || "");
      if (includeLayerIds && !includeLayerIds.has(safeLayerId)) {
        return false;
      }
      if (excludeLayerIds && excludeLayerIds.has(safeLayerId)) {
        return false;
      }
      return true;
    }

    function getMapMarginTileEntries(map, options = {}) {
      if (!map) {
        return [];
      }
      const includeLayerIds = createLayerIdSet(options.layerIds || options.includeLayerIds);
      const excludeLayerIds = createLayerIdSet(options.excludeLayerIds);
      const marginTiles = map.marginTiles;
      if (marginTiles && typeof marginTiles === "object" && !Array.isArray(marginTiles)) {
        const entries = [];
        const usedLayerIds = new Set();
        for (const layer of getVisibleLayers(map)) {
          if (!layer || !layer.id || !Object.prototype.hasOwnProperty.call(marginTiles, layer.id)) {
            continue;
          }
          if (!shouldUseLayer(layer, includeLayerIds, excludeLayerIds)) {
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
          if (!shouldUseMarginLayerId(layerId, includeLayerIds, excludeLayerIds)) {
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
      if (includeLayerIds
        && !includeLayerIds.has("default")
        && !includeLayerIds.has("defaultTile")
        && !includeLayerIds.has("ground")
        && !includeLayerIds.has("margin")) {
        return [];
      }
      if (excludeLayerIds
        && (excludeLayerIds.has("default")
          || excludeLayerIds.has("defaultTile")
          || excludeLayerIds.has("ground")
          || excludeLayerIds.has("margin"))) {
        return [];
      }
      return normalizeTileId(legacyTileEntry) ? [legacyTileEntry] : [];
    }

    function getMarginTileBounds(map, viewport, drawPadding) {
      const tileSize = getTileSize(map);
      const mapSize = getMapPixelSize(map);
      const safeViewport = viewport || { x: 0, y: 0, w: mapSize.w, h: mapSize.h };
      const padding = Math.max(1, Math.floor(Number(drawPadding) || 1));
      const viewX = Number(safeViewport.x) || 0;
      const viewY = Number(safeViewport.y) || 0;
      const viewW = Math.max(0, Number(safeViewport.w) || 0);
      const viewH = Math.max(0, Number(safeViewport.h) || 0);
      return {
        tileSize,
        minCol: Math.floor(viewX / tileSize) - padding,
        minRow: Math.floor(viewY / tileSize) - padding,
        maxCol: Math.ceil((viewX + viewW) / tileSize) + padding,
        maxRow: Math.ceil((viewY + viewH) / tileSize) + padding,
        mapWidth: Math.floor(Number(map.width) || 0),
        mapHeight: Math.floor(Number(map.height) || 0),
      };
    }

    function isMarginBoundsInsideMap(bounds) {
      return bounds.minCol >= 0
        && bounds.minRow >= 0
        && bounds.maxCol < bounds.mapWidth
        && bounds.maxRow < bounds.mapHeight;
    }

    function getMapCacheId(map) {
      return String((map && (map.id || map.name)) || "map");
    }

    function createRenderCanvas(width, height) {
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

    function getTileDrawOverflow(tileEntries, tileSize) {
      const overflow = { left: 0, top: 0, right: 0, bottom: 0 };
      for (const tileEntry of tileEntries) {
        const { drawWidth, drawHeight, drawOffsetX, drawOffsetY } = getTileDrawMetrics(tileEntry, tileSize);
        overflow.left = Math.max(overflow.left, Math.ceil(Math.max(0, -drawOffsetX)));
        overflow.top = Math.max(overflow.top, Math.ceil(Math.max(0, -drawOffsetY)));
        overflow.right = Math.max(overflow.right, Math.ceil(Math.max(0, drawOffsetX + drawWidth - tileSize)));
        overflow.bottom = Math.max(overflow.bottom, Math.ceil(Math.max(0, drawOffsetY + drawHeight - tileSize)));
      }
      return overflow;
    }

    function canCacheMarginTiles(tileEntries) {
      return tileEntries.every((tileEntry) => {
        const tileId = normalizeTileId(tileEntry);
        const tile = getTileDef(tileId);
        const src = tile && (tile.image || tile.src);
        if (!src) {
          return true;
        }
        const image = getTileImage(tileId);
        return image && image.complete && image.naturalWidth > 0;
      });
    }

    function clearMarginTileCache(mapOrId = null) {
      if (!mapOrId) {
        marginTileCache.clear();
        return;
      }
      const map = getMap(mapOrId) || mapOrId;
      const prefix = `${getMapCacheId(map)}|`;
      for (const key of [...marginTileCache.keys()]) {
        if (key.startsWith(prefix)) {
          marginTileCache.delete(key);
        }
      }
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
      const defaultTile = normalizeTileId(map.defaultTile);
      if (defaultTile && !isTilePassable(defaultTile)) {
        return false;
      }
      let passable = true;
      forEachTilePlacementCoveringCoord(map, col, row, (placement) => {
        if (!isTilePassable(placement.tileId)) {
          passable = false;
        }
      });
      return passable;
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
      forEachTilePlacementCoveringCoord(map, col, row, (placement) => {
        addTileEvents(events, placement.tileId, trigger, col, row);
      });
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

    function forEachMapTileEntry(mapOrId, callback, options = {}) {
      const map = getMap(mapOrId);
      if (!map || typeof callback !== "function") {
        return false;
      }
      const includeLayerIds = createLayerIdSet(options.layerIds || options.includeLayerIds);
      const excludeLayerIds = createLayerIdSet(options.excludeLayerIds);
      const bounds = getViewportTileBounds(map, options.viewport, options.drawPadding);
      for (const layer of getVisibleLayers(map)) {
        if (!shouldUseLayer(layer, includeLayerIds, excludeLayerIds)) {
          continue;
        }
        for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
          for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
            const tileEntry = getLayerTileEntry(map, layer, col, row);
            const tileId = normalizeTileId(tileEntry);
            if (tileId) {
              const metrics = getTileDrawMetrics(tileEntry, bounds.tileSize);
              callback({
                tileEntry,
                tileId,
                layer,
                col,
                row,
                x: col * bounds.tileSize,
                y: row * bounds.tileSize,
                tileSize: bounds.tileSize,
                drawWidth: metrics.drawWidth,
                drawHeight: metrics.drawHeight,
                drawOffsetX: metrics.drawOffsetX,
                drawOffsetY: metrics.drawOffsetY,
                drawBottomY: row * bounds.tileSize + metrics.drawOffsetY + metrics.drawHeight,
              });
            }
          }
        }
      }
      return true;
    }

    function forEachMarginTileEntry(mapOrId, callback, options = {}) {
      const map = getMap(mapOrId);
      if (!map || typeof callback !== "function") {
        return false;
      }
      const tileEntries = getMapMarginTileEntries(map, options);
      if (!tileEntries.length) {
        return false;
      }
      const bounds = getMarginTileBounds(map, options.viewport, options.drawPadding);
      if (isMarginBoundsInsideMap(bounds)) {
        return false;
      }
      for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
        for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
          if (isInsideMap(map, col, row)) {
            continue;
          }
          for (const tileEntry of tileEntries) {
            const tileId = normalizeTileId(tileEntry);
            if (!tileId) {
              continue;
            }
            const metrics = getTileDrawMetrics(tileEntry, bounds.tileSize);
            callback({
              tileEntry,
              tileId,
              col,
              row,
              x: col * bounds.tileSize,
              y: row * bounds.tileSize,
              tileSize: bounds.tileSize,
              drawWidth: metrics.drawWidth,
              drawHeight: metrics.drawHeight,
              drawOffsetX: metrics.drawOffsetX,
              drawOffsetY: metrics.drawOffsetY,
              drawBottomY: row * bounds.tileSize + metrics.drawOffsetY + metrics.drawHeight,
            });
          }
        }
      }
      return true;
    }

    function drawTileMap(ctx, mapOrId, options = {}) {
      const map = getMap(mapOrId);
      if (!ctx || !map) {
        return false;
      }
      const bounds = getViewportTileBounds(map, options.viewport, options.drawPadding);
      const defaultTile = normalizeTileId(map.defaultTile);
      const includeLayerIds = createLayerIdSet(options.layerIds || options.includeLayerIds);
      const excludeLayerIds = createLayerIdSet(options.excludeLayerIds);
      const shouldDrawDefaultTile = options.drawDefaultTile !== false
        && (!includeLayerIds
          || options.includeDefaultTile === true
          || includeLayerIds.has("default")
          || includeLayerIds.has("defaultTile"));
      if (defaultTile && shouldDrawDefaultTile) {
        for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
          for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
            drawTile(ctx, defaultTile, col * bounds.tileSize, row * bounds.tileSize, bounds.tileSize, options);
          }
        }
      }
      for (const layer of getVisibleLayers(map)) {
        if (!shouldUseLayer(layer, includeLayerIds, excludeLayerIds)) {
          continue;
        }
        for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
          for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
            const tileEntry = getLayerTileEntry(map, layer, col, row);
            const tileId = normalizeTileId(tileEntry);
            if (tileId) {
              drawTile(ctx, tileEntry, col * bounds.tileSize, row * bounds.tileSize, bounds.tileSize, options);
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
      const tileEntries = getMapMarginTileEntries(map, options);
      if (!tileEntries.length) {
        return false;
      }
      const bounds = getMarginTileBounds(map, options.viewport, options.drawPadding);
      if (isMarginBoundsInsideMap(bounds)) {
        return false;
      }
      if (options.useCache !== false && canCacheMarginTiles(tileEntries)) {
        const overflow = getTileDrawOverflow(tileEntries, bounds.tileSize);
        const cacheKey = [
          getMapCacheId(map),
          bounds.tileSize,
          bounds.minCol,
          bounds.minRow,
          bounds.maxCol,
          bounds.maxRow,
          JSON.stringify(tileEntries),
          options.drawFallback === false ? "nofallback" : "fallback",
        ].join("|");
        let cached = marginTileCache.get(cacheKey);
        if (!cached) {
          const cols = Math.max(1, bounds.maxCol - bounds.minCol + 1);
          const rows = Math.max(1, bounds.maxRow - bounds.minRow + 1);
          const canvas = createRenderCanvas(cols * bounds.tileSize + overflow.left + overflow.right, rows * bounds.tileSize + overflow.top + overflow.bottom);
          const cacheCtx = canvas && canvas.getContext && canvas.getContext("2d");
          if (cacheCtx) {
            for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
              for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
                if (isInsideMap(map, col, row)) {
                  continue;
                }
                for (const tileEntry of tileEntries) {
                  drawTile(cacheCtx, tileEntry, (col - bounds.minCol) * bounds.tileSize + overflow.left, (row - bounds.minRow) * bounds.tileSize + overflow.top, bounds.tileSize, options);
                }
              }
            }
            cached = {
              canvas,
              x: bounds.minCol * bounds.tileSize - overflow.left,
              y: bounds.minRow * bounds.tileSize - overflow.top,
            };
            marginTileCache.set(cacheKey, cached);
          }
        }
        if (cached) {
          ctx.drawImage(cached.canvas, cached.x, cached.y);
          return true;
        }
      }
      for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {
        for (let col = bounds.minCol; col <= bounds.maxCol; col += 1) {
          if (isInsideMap(map, col, row)) {
            continue;
          }
          for (const tileEntry of tileEntries) {
            drawTile(ctx, tileEntry, col * bounds.tileSize, row * bounds.tileSize, bounds.tileSize, options);
          }
        }
      }
      return true;
    }

    function getTileDrawMetrics(tileEntry, size) {
      const tileId = normalizeTileId(tileEntry);
      const tile = getTileDef(tileId);
      const fallbackSize = Math.max(1, Number(size) || 1);
      return {
        drawWidth: Math.max(1, Number(tile && tile.drawWidth) || fallbackSize),
        drawHeight: Math.max(1, Number(tile && tile.drawHeight) || fallbackSize),
        drawOffsetX: Number.isFinite(tile && tile.drawOffsetX) ? tile.drawOffsetX : 0,
        drawOffsetY: Number.isFinite(tile && tile.drawOffsetY) ? tile.drawOffsetY : 0,
      };
    }

    function drawTile(ctx, tileEntry, x, y, size, options = {}) {
      const tileId = normalizeTileId(tileEntry);
      const tile = getTileDef(tileId);
      const image = getTileImage(tileId);
      if (image && image.complete && image.naturalWidth > 0) {
        const { drawWidth, drawHeight, drawOffsetX, drawOffsetY } = getTileDrawMetrics(tileEntry, size);
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
      getTileFootprint,
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
      forEachMapTileEntry,
      forEachMarginTileEntry,
      drawTileMap,
      drawTile,
      drawMarginTile,
      clearMarginTileCache,
      drawDebugGrid,
    };
  };
})();
