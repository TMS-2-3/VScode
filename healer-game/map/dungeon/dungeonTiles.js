(function initDungeonTiles(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HEALER_DUNGEON_TILES = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonTiles() {
  "use strict";

  const GROUPS = Object.freeze([
    Object.freeze({ id: "path", name: "道の床" }),
    Object.freeze({ id: "room", name: "部屋の床" }),
    Object.freeze({ id: "pathWall", name: "道の壁" }),
    Object.freeze({ id: "roomWall", name: "部屋の壁" }),
    Object.freeze({ id: "margin", name: "余白" }),
  ]);

  function normalize(value = {}) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("タイル設定が不正です。");
    const allowed = new Set(["floorTileId", "wallTileId", "wall", "wallHeight", ...GROUPS.map((group) => group.id)]);
    Object.keys(value).forEach((key) => {
      if (!allowed.has(key)) throw new Error(`未対応のタイル設定です: ${key}`);
    });
    const floor = legacyId(value.floorTileId, "caveFloor01");
    const wall = legacyId(value.wallTileId, "caveWall01");
    const wallHeight = value.wallHeight === undefined ? 1 : value.wallHeight;
    if (!Number.isInteger(wallHeight) || wallHeight < 0 || wallHeight > 500) throw new Error("壁の高さは0～500マスの整数にしてください。");
    const result = {};
    GROUPS.forEach(({ id }) => {
      const fallback = id === "path" || id === "room" ? floor : id === "margin" ? wall : value.wall === undefined ? wall : value.wall;
      const source = value[id] === undefined ? fallback : value[id];
      const layers = source === null ? [] : typeof source === "string" ? [source] : source;
      if (!Array.isArray(layers) || layers.some((tileId) => typeof tileId !== "string" || !tileId.trim())) {
        throw new Error(`${id}の重ねタイルが不正です。`);
      }
      result[id] = layers.map((tileId) => tileId.trim());
    });
    // Keep old consumers readable while the ordered layer arrays are authoritative.
    return { floorTileId: result.path[0] || null, wallTileId: result.pathWall[0] || null, wall: result.pathWall.slice(), wallHeight, ...result };
  }

  function legacyId(value, fallback) {
    if (value === undefined) return fallback;
    if (value === null) return null;
    if (typeof value !== "string" || !value.trim()) throw new Error("タイルIDが不正です。");
    return value.trim();
  }

  function classifyCells(dungeon) {
    const { width, height, cells } = dungeon;
    const wallHeight = normalize(dungeon.config?.tiles).wallHeight;
    const regions = cells.map((cell) => cell === 1 ? "margin" : "path");
    (dungeon.rooms || []).forEach((room) => {
      for (let y = Math.max(0, room.top); y <= Math.min(height - 1, room.bottom); y += 1) {
        for (let x = Math.max(0, room.left); x <= Math.min(width - 1, room.right); x += 1) {
          if (cells[y * width + x] !== 1) regions[y * width + x] = "room";
        }
      }
    });
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (cells[y * width + x] === 1) continue;
        const wallRegion = regions[y * width + x] === "room" ? "roomWall" : "pathWall";
        for (let offset = 1; offset <= wallHeight && y - offset >= 0; offset += 1) {
          const index = (y - offset) * width + x;
          if (cells[index] !== 1) break;
          regions[index] = wallRegion;
        }
      }
    }
    return regions;
  }

  function createEndpointLineCopies(dungeon) {
    if (dungeon.config?.endpointLineCopy !== true) return [];
    const opposite = { up: "down", down: "up", left: "right", right: "left" };
    const tileIds = { up: "lineCopyUp", down: "lineCopyDown", left: "lineCopyLeft", right: "lineCopyRight" };
    const path = dungeon.mainPath || [];
    const pathDirection = (from, to) => {
      if (!from || !to) return null;
      if (from.x !== to.x) return to.x > from.x ? "right" : "left";
      if (from.y !== to.y) return to.y > from.y ? "down" : "up";
      return null;
    };
    const entranceDirection = dungeon.entranceApproach?.startDirection || pathDirection(path[0], path[1]);
    const exitDirection = dungeon.exitApproach?.endDirection || pathDirection(path[path.length - 2], path[path.length - 1]);
    return [
      { endpoint: "entrance", point: dungeon.entrance, direction: opposite[entranceDirection] },
      { endpoint: "exit", point: dungeon.exit, direction: exitDirection },
    ].filter((entry) => entry.point && tileIds[entry.direction]).map(({ endpoint, point, direction }) => ({
      id: `${endpoint}_line_copy`, endpoint, x: point.x, y: point.y, direction, tileId: tileIds[direction],
    })).sort((a, b) => a.y - b.y || a.x - b.x);
  }

  function rawRegionAt(dungeon, x, y) {
    if (x < 0 || y < 0 || x >= dungeon.width || y >= dungeon.height) return "margin";
    const region = dungeon.tileRegions[y * dungeon.width + x];
    return region === "wall" ? "pathWall" : region;
  }

  function regionAt(dungeon, x, y) {
    const copies = dungeon.lineCopies || [];
    if (!copies.some((entry) => entry.x === x && entry.y === y)) {
      for (let index = copies.length - 1; index >= 0; index -= 1) {
        const source = copies[index];
        if (source.direction === "down" && x === source.x && y > source.y
          || source.direction === "up" && x === source.x && y < source.y
          || source.direction === "left" && y === source.y && x < source.x
          || source.direction === "right" && y === source.y && x > source.x) {
          return rawRegionAt(dungeon, source.x, source.y);
        }
      }
    }
    return rawRegionAt(dungeon, x, y);
  }

  function drawingBounds(definition = {}, sourceTileSize = 48) {
    const footprintWidth = Math.max(1, Math.floor(Number(definition.footprintWidth) || 1));
    const footprintHeight = Math.max(1, Math.floor(Number(definition.footprintHeight) || 1));
    const bottomCenter = definition.placementAnchor === "bottomCenter";
    const anchorX = Number.isFinite(definition.placementAnchorX) ? definition.placementAnchorX : bottomCenter ? Math.floor(footprintWidth / 2) : 0;
    const anchorY = Number.isFinite(definition.placementAnchorY) ? definition.placementAnchorY : bottomCenter ? footprintHeight - 1 : 0;
    return {
      x: (Number(definition.drawOffsetX) || 0) / sourceTileSize - anchorX,
      y: (Number(definition.drawOffsetY) || 0) / sourceTileSize - anchorY,
      width: (Number(definition.drawWidth) || sourceTileSize) / sourceTileSize,
      height: (Number(definition.drawHeight) || sourceTileSize) / sourceTileSize,
    };
  }

  function draw(context, dungeon, options) {
    const { originX, originY, cellSize, width, height, getDefinition, getImage } = options;
    const settings = normalize(dungeon.config.tiles);
    const sourceTileSize = options.sourceTileSize || 48;
    const prepared = {};
    let overscan = 1;
    let layerCount = 0;
    if (options.showImages !== false) GROUPS.forEach(({ id }) => {
      prepared[id] = settings[id].map((tileId) => {
        const bounds = drawingBounds(getDefinition(tileId) || {}, sourceTileSize);
        overscan = Math.max(overscan, Math.ceil(Math.max(Math.abs(bounds.x), Math.abs(bounds.y), bounds.x + bounds.width, bounds.y + bounds.height)));
        return { image: getImage(tileId), bounds };
      });
      layerCount = Math.max(layerCount, prepared[id].length);
    });
    const left = Math.floor(-originX / cellSize) - overscan;
    const top = Math.floor(-originY / cellSize) - overscan;
    const right = Math.ceil((width - originX) / cellSize) + overscan;
    const bottom = Math.ceil((height - originY) / cellSize) + overscan;
    const colors = { path: "#d7d2bc", room: "#d7d2bc", pathWall: "#26312d", roomWall: "#26312d", margin: "#1d2822", ...options.colors };
    context.save();
    context.imageSmoothingEnabled = false;
    for (let y = top; y < bottom; y += 1) {
      for (let x = left; x < right; x += 1) {
        context.fillStyle = colors[regionAt(dungeon, x, y)];
        context.fillRect(originX + x * cellSize, originY + y * cellSize, Math.ceil(cellSize), Math.ceil(cellSize));
      }
    }
    // Finish each lower layer everywhere before drawing overlays, then sort rows back-to-front.
    for (let layer = 0; layer < layerCount; layer += 1) {
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const entry = prepared[regionAt(dungeon, x, y)][layer];
          if (!entry || !entry.image || !entry.image.complete || entry.image.naturalWidth <= 0) continue;
          const bounds = entry.bounds;
          context.drawImage(entry.image,
            originX + (x + bounds.x) * cellSize, originY + (y + bounds.y) * cellSize,
            Math.ceil(bounds.width * cellSize), Math.ceil(bounds.height * cellSize));
        }
      }
    }
    context.restore();
  }

  return Object.freeze({ GROUPS, normalize, classifyCells, createEndpointLineCopies, regionAt, drawingBounds, draw });
});
