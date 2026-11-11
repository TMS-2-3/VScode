"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class TestImage {
  constructor() {
    this.complete = true;
    this.naturalWidth = 48;
    this.naturalHeight = 48;
  }
}

class TestCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.context = {
      draws: [],
      drawImage(...args) { this.draws.push(args); },
      save() {}, restore() {}, translate() {}, rotate() {}, fillRect() {}, strokeRect() {},
    };
  }
  getContext() { return this.context; }
}

const sandbox = { window: {}, Image: TestImage, OffscreenCanvas: TestCanvas };
for (const file of ["../map/tile.js", "tileMapSystem.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, file), "utf8"), sandbox, { filename: file });
}
const defs = {
  ...sandbox.window.HEALER_TILE_DEFS,
  floor: { image: "floor.png", passable: true },
  road: { image: "road.png", passable: true },
  block: { image: "block.png", passable: false },
  markerObject: { image: "object.png", passable: false, onInspect: { action: "testInspect" } },
};
const system = sandbox.window.createHealerTileMapSystem({ tileDefs: defs });
const plain = (value) => JSON.parse(JSON.stringify(value));

function makeMap(width = 5, height = 5) {
  return {
    id: "copy_test", width, height, defaultTile: "floor",
    marginTiles: { ground: "floor", object: "block", event: null },
    layers: ["ground", "terrain", "object", "event"].map((id) => ({
      id, tiles: Array(width * height).fill(id === "ground" ? "floor" : null),
    })),
    events: [],
  };
}

function put(map, layerId, col, row, entry) {
  map.layers.find((layer) => layer.id === layerId).tiles[row * map.width + col] = entry;
}

function marginAt(map, col, row, options = {}) {
  const found = [];
  system.forEachMarginTileEntry(map, (entry) => {
    if (entry.col === col && entry.row === row) found.push([entry.layer.id, plain(entry.tileEntry)]);
  }, { viewport: { x: col * 48, y: row * 48, w: 48, h: 48 }, ...options });
  return found;
}

for (const [suffix, dx, dy] of [["Down", 0, 1], ["Up", 0, -1], ["Left", -1, 0], ["Right", 1, 0]]) {
  const map = makeMap();
  put(map, "ground", 2, 2, { tileId: "road", rotate: 90 });
  put(map, "event", 2, 2, `lineCopy${suffix}`);
  put(map, "terrain", 2 + dx, 2 + dy, "block");
  put(map, "object", 2 + dx, 2 + dy, "block");
  const before = JSON.stringify(map);
  assert.equal(system.getLineCopySources(map).length, 1);
  assert.equal(system.getTileIdAt(map, 2 + dx, 2 + dy), "road");
  assert.equal(system.isTileCoordPassable(map, 2 + dx, 2 + dy), true);
  assert.deepEqual(plain(system.getTileStackAt(map, 2 + dx, 2 + dy)), ["floor", "road"]);
  const entries = [];
  system.forEachMapTileEntry(map, (entry) => entries.push(entry));
  assert.ok(entries.every((entry) => !entry.tileId.startsWith("lineCopy")));
  assert.deepEqual(plain(entries.find((entry) => entry.col === 2 + dx && entry.row === 2 + dy).tileEntry), { tileId: "road", rotate: 90 });
  const outsideCol = 2 + dx * 20;
  const outsideRow = 2 + dy * 20;
  assert.deepEqual(marginAt(map, outsideCol, outsideRow), [["ground", { tileId: "road", rotate: 90 }]]);
  assert.equal(system.isTileCoordPassable(map, outsideCol, outsideRow), false);
  assert.equal(system.isWorldCirclePassable(map, outsideCol * 48 + 24, outsideRow * 48 + 24, 5), false);
  assert.deepEqual(plain(system.getEventsAtTile(map, outsideCol, outsideRow)), []);
  assert.deepEqual(marginAt(map, 2 - dx * 20, 2 - dy * 20), [["ground", "floor"], ["object", "block"]]);
  assert.equal(JSON.stringify(map), before, "rendering and collision queries must not rewrite saved layers");
}

{
  const map = makeMap();
  put(map, "ground", 1, 2, "road");
  put(map, "object", 1, 2, "markerObject");
  put(map, "event", 1, 2, "lineCopyRight");
  map.events.push({ x: 1, y: 2, trigger: "inspect", action: "mapTransfer", payload: { targetMap: "other" } });
  assert.equal(system.isTileCoordPassable(map, 4, 2), false);
  assert.deepEqual(plain(system.getEventsAtTile(map, 4, 2, "inspect")).map((entry) => entry.action), ["testInspect"]);
  assert.deepEqual(plain(system.getEventsAtTile(map, 1, 2, "inspect")).map((entry) => entry.action), ["testInspect", "mapTransfer"]);
  assert.deepEqual(marginAt(map, 8, 2), [["ground", "road"], ["object", "markerObject"]]);
  assert.deepEqual(marginAt(map, 8, 2, { layerIds: ["ground"] }), [["ground", "road"]]);
  assert.deepEqual(marginAt(map, 8, 2, { excludeLayerIds: ["ground"] }), [["object", "markerObject"]]);
  assert.deepEqual(plain(system.getEventsAtTile(map, 8, 2)), []);
  const scene = new TestCanvas(100, 100).context;
  system.drawTileMap(scene, map, { drawDefaultTile: false });
  assert.ok(scene.draws.some(([image, x, y]) => image.src === "object.png" && x === 4 * 48 && y === 2 * 48));
  const outsideOptions = { viewport: { x: 8 * 48, y: 2 * 48, w: 48, h: 48 }, layerIds: ["ground"] };
  const direct = new TestCanvas(100, 100).context;
  system.drawMarginTile(direct, map, { ...outsideOptions, useCache: false });
  assert.ok(direct.draws.some(([image, x, y]) => image.src === "road.png" && x === 8 * 48 && y === 2 * 48));
  assert.ok(!direct.draws.some(([image, x, y]) => image.src === "floor.png" && x === 8 * 48 && y === 2 * 48));
  const cached = new TestCanvas(100, 100).context;
  system.drawMarginTile(cached, map, outsideOptions);
  assert.equal(cached.draws.length, 1);
  const cacheCanvas = cached.draws[0][0];
  assert.ok(cacheCanvas.context.draws.some(([image]) => image.src === "road.png"));
  system.drawMarginTile(cached, map, outsideOptions);
  assert.equal(cached.draws[1][0], cacheCanvas, "unchanged margin should reuse its canvas");
  assert.ok(system.preloadTileImages(map).some((image) => image.src === "object.png"));
}

{
  const map = makeMap();
  put(map, "ground", 2, 1, "block");
  put(map, "event", 2, 1, "lineCopyDown");
  put(map, "ground", 1, 2, "road");
  put(map, "event", 1, 2, "lineCopyRight");
  assert.equal(system.getTileIdAt(map, 2, 2), "road", "intersections use the later row-major source");
  assert.equal(system.getTileIdAt(map, 2, 1), "block", "source cells keep their own tiles");
  put(map, "event", 2, 3, "lineCopyRight");
  put(map, "ground", 2, 3, "floor");
  system.clearLineCopyCache(map);
  assert.equal(system.getTileIdAt(map, 2, 3), "floor");
  assert.equal(system.getTileIdAt(map, 4, 3), "floor", "a source is never copied from an earlier ray");
}

{
  const map = makeMap();
  put(map, "ground", 2, 2, "road");
  put(map, "event", 2, 2, { tileId: "lineCopyDown", rotate: 90 });
  assert.equal(system.getLineCopySources(map)[0].direction, "left");
  assert.equal(system.getTileIdAt(map, 1, 2), "road");
  assert.equal(system.getTileIdAt(map, 2, 3), "floor");
  put(map, "ground", 2, 2, "block");
  system.clearLineCopyCache(map);
  assert.equal(system.getTileIdAt(map, 1, 2), "block");
  assert.deepEqual(marginAt(map, -2, 2), [["ground", "block"]]);
  put(map, "event", 2, 2, null);
  system.clearLineCopyCache(map);
  assert.equal(system.getTileIdAt(map, 1, 2), "floor");
  assert.deepEqual(marginAt(map, -2, 2), [["ground", "floor"], ["object", "block"]]);
}

{
  const map = makeMap();
  map.marginTiles = {};
  put(map, "ground", 0, 1, null);
  put(map, "event", 0, 1, "lineCopyLeft");
  assert.deepEqual(marginAt(map, -2, 1), [["ground", "floor"]], "source uses the default ground even without a margin tile");
  put(map, "event", 0, 1, null);
  system.clearLineCopyCache(map);
  delete map.marginTiles;
  map.marginTile = "block";
  assert.deepEqual(marginAt(map, -2, 1), [["ground", "block"]], "legacy margin tiles remain supported");
  const context = new TestCanvas(48, 48).context;
  system.drawTile(context, "lineCopyLeft", 0, 0, 48);
  assert.equal(context.draws.length, 0, "control tiles must not be drawn in-game");
}

{
  const map = makeMap();
  map.layers.find((layer) => layer.id === "ground").tiles = [
    "floor floor floor floor floor", "floor floor road floor floor",
    "floor floor floor floor floor", "floor floor floor floor floor", "floor floor floor floor floor",
  ];
  map.layers.find((layer) => layer.id === "event").tiles = { "2,1": "lineCopyDown" };
  assert.equal(system.getTileIdAt(map, 2, 4), "road", "row-string and sparse layers must support copies");
  system.clearLineCopyCache();
  assert.equal(system.getTileIdAt(map, 2, 4), "road");
}

console.log("tileMapSystem tests passed");
