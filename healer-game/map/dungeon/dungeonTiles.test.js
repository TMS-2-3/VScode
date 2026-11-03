"use strict";

const assert = require("node:assert/strict");
const tiles = require("./dungeonTiles.js");
const profiles = require("./dungeonProfiles.js");
const generator = require("./dungeonGenerator.js").create(require("../../rot.js-master/dist/rot.js"));

testLegacyAndLayerSettings();
testRegionClassification();
testDrawOrderAndDimensions();
testPersistenceAndGeometry();
console.log("dungeonTiles tests passed");

function testLegacyAndLayerSettings() {
  const legacy = tiles.normalize({ floorTileId: "old_floor", wallTileId: "old_wall" });
  assert.deepEqual(legacy.path, ["old_floor"]);
  assert.deepEqual(legacy.room, ["old_floor"]);
  assert.deepEqual(legacy.wall, ["old_wall"]);
  assert.deepEqual(legacy.pathWall, ["old_wall"]);
  assert.deepEqual(legacy.roomWall, ["old_wall"]);
  assert.equal(legacy.wallHeight, 1);
  assert.deepEqual(legacy.margin, ["old_wall"]);
  const layered = tiles.normalize({ path: ["wall_image"], room: ["room_image"], wall: ["grass", "tree"], margin: [] });
  assert.equal(layered.floorTileId, "wall_image");
  assert.equal(layered.wallTileId, "grass");
  assert.deepEqual(tiles.normalize(layered), layered);
  assert.deepEqual(tiles.normalize({ floorTileId: null }).path, []);
  assert.deepEqual(tiles.normalize({ wall: [] }).wall, []);
  assert.throws(() => tiles.normalize({ path: [""] }), /重ねタイル/);
  assert.throws(() => tiles.normalize({ path: [null] }), /重ねタイル/);
  assert.throws(() => tiles.normalize({ wall: { tileId: "grass" } }), /重ねタイル/);
  assert.throws(() => tiles.normalize({ unknown: [] }), /未対応/);
  assert.throws(() => tiles.normalize(null), /不正/);
  [-1, 0.5, 501, NaN].forEach((wallHeight) => assert.throws(() => tiles.normalize({ wallHeight }), /壁の高さ/));
}

function fixture() {
  const dungeon = {
    width: 9, height: 9,
    cells: Array(81).fill(1),
    rooms: [{ left: 2, top: 2, right: 4, bottom: 4 }],
    config: { tiles: { wallHeight: 2 } },
  };
  for (let y = 2; y <= 4; y += 1) {
    for (let x = 2; x <= 4; x += 1) dungeon.cells[y * 9 + x] = 0;
  }
  for (let x = 5; x <= 7; x += 1) dungeon.cells[3 * 9 + x] = x === 5 ? 2 : 0;
  dungeon.tileRegions = tiles.classifyCells(dungeon);
  return dungeon;
}

function testRegionClassification() {
  const dungeon = fixture();
  assert.equal(tiles.regionAt(dungeon, 3, 3), "room");
  assert.equal(tiles.regionAt(dungeon, 5, 3), "path", "doors outside the room are path cells");
  assert.equal(tiles.regionAt(dungeon, 7, 3), "path");
  assert.equal(tiles.regionAt(dungeon, 3, 1), "roomWall");
  assert.equal(tiles.regionAt(dungeon, 3, 0), "roomWall", "room walls extend upward for the configured height");
  assert.equal(tiles.regionAt(dungeon, 7, 2), "pathWall");
  assert.equal(tiles.regionAt(dungeon, 7, 1), "pathWall");
  assert.equal(tiles.regionAt(dungeon, 7, 0), "margin", "walls stop at exactly the configured height");
  assert.equal(tiles.regionAt(dungeon, 1, 1), "margin", "walls are not projected diagonally");
  assert.equal(tiles.regionAt(dungeon, 8, 3), "margin", "walls are not projected sideways");
  assert.equal(tiles.regionAt(dungeon, 3, 5), "margin", "walls are not projected downward");
  assert.equal(tiles.regionAt(dungeon, 0, 0), "margin");
  assert.equal(tiles.regionAt(dungeon, 8, 8), "margin");
  assert.equal(tiles.regionAt(dungeon, -1, 3), "margin");
  assert.equal(tiles.regionAt(dungeon, 9, 3), "margin");
  dungeon.cells.forEach((cell, index) => {
    assert.ok((cell === 1 ? ["pathWall", "roomWall", "margin"] : ["path", "room"]).includes(dungeon.tileRegions[index]));
  });
  assert.ok(!tiles.classifyCells({ ...dungeon, config: { tiles: { wallHeight: 0 } } }).some((region) => region.endsWith("Wall")));
  const stackedFloors = {
    width: 1, height: 7, cells: [1, 0, 1, 1, 0, 1, 1],
    rooms: [{ left: 0, right: 0, top: 4, bottom: 4 }], config: { tiles: { wallHeight: 5 } },
  };
  assert.deepEqual(tiles.classifyCells(stackedFloors), ["pathWall", "path", "roomWall", "roomWall", "room", "margin", "margin"], "classifying raw geometry must never paint over floors");
}

function testDrawOrderAndDimensions() {
  const dungeon = fixture();
  dungeon.config = { tiles: { path: ["grass"], room: ["stone"], wall: ["grass", "tree"], margin: ["grass", "tree"], wallHeight: 2 } };
  const definitions = {
    grass: { passable: true },
    stone: { passable: false },
    tree: { passable: false, drawWidth: 96, drawHeight: 96, drawOffsetX: -24, drawOffsetY: -48 },
  };
  const images = Object.fromEntries(Object.keys(definitions).map((id) => [id, { id, complete: true, naturalWidth: 48 }]));
  const commands = [];
  const context = {
    save() {}, restore() {}, fillRect() {},
    drawImage(image, x, y, width, height) { commands.push({ id: image.id, x, y, width, height }); },
  };
  const before = dungeon.cells.slice();
  tiles.draw(context, dungeon, {
    originX: 10, originY: 10, cellSize: 10, width: 120, height: 120,
    getDefinition: (id) => definitions[id], getImage: (id) => images[id],
  });
  assert.deepEqual(dungeon.cells, before, "visual passability must never change dungeon collision cells");
  const firstOverlay = commands.findIndex((command) => command.id === "tree");
  const lastGround = commands.findLastIndex((command) => command.id !== "tree");
  assert.ok(firstOverlay > lastGround, "all ground layers must finish before any tree overlay");
  const trees = commands.filter((command) => command.id === "tree");
  assert.ok(trees.every((command) => command.width === 20 && command.height === 20));
  assert.ok(trees.some((command) => command.x < 0 || command.y < 0), "margin tiles must extend outside the map");
  assert.ok(trees.every((command, index) => index === 0 || command.y >= trees[index - 1].y), "overlays must be drawn in row order");
  assert.deepEqual(tiles.drawingBounds(definitions.tree), { x: -0.5, y: -1, width: 2, height: 2 });
  assert.deepEqual(tiles.drawingBounds({ drawWidth: 144, drawHeight: 96, footprintWidth: 3, footprintHeight: 2, placementAnchor: "bottomCenter" }), { x: -1, y: -1, width: 3, height: 2 });
}

function testPersistenceAndGeometry() {
  const settings = { path: ["wall_as_floor"], room: ["room_floor"], pathWall: ["grass", "tree"], roomWall: ["stone"], margin: ["soil", "tree"], wallHeight: 3 };
  const record = profiles.createRecord({ ...profiles.standard, tiles: settings }, { id: "layered_forest", name: "重ねタイルの森" });
  const restored = profiles.parse(profiles.serialize([record]))[0];
  assert.deepEqual(restored.config.tiles.wall, ["grass", "tree"]);
  assert.deepEqual(restored.config.tiles.roomWall, ["stone"]);
  assert.equal(restored.config.tiles.wallHeight, 3);
  assert.deepEqual(restored.config.tiles.margin, ["soil", "tree"]);
  assert.deepEqual(restored, record);
  const empty = profiles.createRecord({ ...profiles.standard, tiles: { path: [], room: [], wall: [], margin: [] } }, { id: "empty", name: "画像なし" });
  assert.equal(profiles.parse(profiles.serialize([empty]))[0].config.tiles.floorTileId, null);
  const first = generator.generate({ ...profiles.standard, tiles: { ...profiles.standard.tiles, wallHeight: 3 } }, { seed: "tile-geometry", maxAttempts: 200 });
  const second = generator.generate(restored.config, { seed: "tile-geometry", maxAttempts: 200 });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(second.cells, first.cells);
  assert.deepEqual(second.rooms, first.rooms);
  assert.deepEqual(second.placements, first.placements);
  assert.deepEqual(second.tileRegions, tiles.classifyCells(second));
}
