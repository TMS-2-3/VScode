"use strict";

const assert = require("node:assert/strict");
const wallSpace = require("./dungeonWallSpace.js");
const tiles = require("./dungeonTiles.js");
const profiles = require("./dungeonProfiles.js");
const generator = require("./dungeonGenerator.js").create(require("../../rot.js-master/dist/rot.js"));

testEveryColumnPattern();
testConnectionsAndMarkers();
testGeneratedMaps();
console.log("dungeonWallSpace tests passed");

function testEveryColumnPattern() {
  const height = 7;
  for (let pattern = 0; pattern < 2 ** height; pattern += 1) {
    for (const wallHeight of [0, 1, 2, 3, 10, 500]) {
      const before = Array.from({ length: height }, (_, y) => pattern & (1 << y) ? (y % 2 ? 0 : 2) : 1);
      const layout = { cells: before.slice(), rooms: [] };
      const config = { width: 1, height, tiles: { wallHeight } };
      const spacing = wallSpace.reserve(layout, config);
      before.forEach((cell, y) => assert.equal(layout.cells[spacing.rows[y]], cell, "every original cell, including each door, must survive the spacing change"));
      assert.equal(componentCount(layout.cells, 1, spacing.height), componentCount(before, 1, height), "spacing must not merge or split disconnected floors");
      assertFullWalls({ ...layout, width: 1, height: spacing.height, config });
      if (wallHeight === 0) assert.deepEqual(layout.cells, before, "wall height zero must not enlarge the map");
    }
  }
  const spaced = { cells: [0, 1, 1, 1, 0], rooms: [] };
  assert.equal(wallSpace.reserve(spaced, { width: 1, height: 5, tiles: { wallHeight: 2 } }).addedRows, 0, "sufficient existing space must not expand");
}

function testConnectionsAndMarkers() {
  const width = 4;
  const height = 5;
  const cells = [
    0, 1, 1, 1,
    0, 2, 0, 0,
    0, 1, 1, 0,
    0, 0, 0, 0,
    1, 1, 1, 0,
  ];
  const center = { x: 1, y: 3 };
  const room = { id: "room", left: 0, top: 3, right: 3, bottom: 3, center, doors: [center], roundedCorners: [] };
  const entrance = { x: 0, y: 0 };
  const exit = { x: 3, y: 4 };
  const path = [{ x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 3 }, exit];
  const approach = { end: exit, door: path[0], interior: center, path, length: 3 };
  const road = { path: path.slice(), targetWidths: [1, 1.5, 2, 1], addedCells: [], roundedCorners: [] };
  const layout = { cells: cells.slice(), rooms: [room], corridors: [{ kind: "exit", start: path[0], end: exit }] };
  const config = { width, height, tiles: { wallHeight: 3 } };
  const spacing = wallSpace.reserve(layout, config, { entrance, exit, exitApproach: approach, corridorShapes: [road] });
  assert.equal(componentCount(layout.cells, width, spacing.height), 1);
  assert.equal(center.y, spacing.rows[3], "shared marker objects must be moved exactly once");
  assert.deepEqual(approach.path[0], approach.door);
  assert.deepEqual(approach.path.at(-1), exit);
  assert.equal(approach.length, approach.path.length - 1);
  assert.equal(approach.baseLength, 3);
  assert.equal(layout.corridors[0].length, approach.length);
  assert.equal(road.targetWidths.length, road.path.length);
  assertConnectedPath(approach.path, layout.cells, width);
  assertConnectedPath(road.path, layout.cells, width);
  assert.equal(room.area, room.floorCells.length);
  assert.equal(room.height, room.bottom - room.top + 1);
  assert.ok(room.floorCells.every(({ x, y }) => layout.cells[y * width + x] !== 1));
  assertFullWalls({ ...layout, width, height: spacing.height, config });
}

function testGeneratedMaps() {
  for (const scale of [1, 3, 10]) {
    for (const wallHeight of [0, 1, 2, 3, 5]) {
      for (const danger of [1, 10]) {
        for (let seed = 1; seed <= 6; seed += 1) {
          const config = { ...profiles.standard, scale, danger, tiles: { ...profiles.standard.tiles, wallHeight } };
          const before = JSON.stringify(config);
          const result = generator.generate(config, { seed: `wall-space-${seed}`, maxAttempts: 200 });
          assert.equal(result.ok, true, `scale ${scale}, danger ${danger}, wall height ${wallHeight}, seed ${seed}`);
          assert.equal(JSON.stringify(config), before, "generation must not save expanded dimensions into the profile");
          assert.equal(result.config.tiles.wallHeight, wallHeight);
          assert.equal(result.height, result.wallSpacing.baseHeight + result.wallSpacing.addedRows);
          assert.equal(result.cells.length, result.width * result.height);
          assert.equal(componentCount(result.cells, result.width, result.height), 1);
          assertFullWalls(result);
          assertConnectedPath(result.mainPath, result.cells, result.width);
          for (const approach of [result.entranceApproach, result.exitApproach]) {
            assertConnectedPath(approach.path, result.cells, result.width);
            assert.equal(approach.length, approach.path.length - 1);
          }
          for (const road of result.corridorShapes) {
            assertConnectedPath(road.path, result.cells, result.width);
            assert.equal(road.targetWidths.length, road.path.length);
            assert.ok(road.addedCells.every(({ x, y }) => result.cells[y * result.width + x] !== 1));
          }
          for (const room of result.rooms) {
            assert.equal(room.area, room.floorCells.length);
            assert.notEqual(result.cells[room.center.y * result.width + room.center.x], 1);
            assert.ok(room.doors.every(({ x, y }) => result.cells[y * result.width + x] === 2));
          }
          Object.values(result.placements).filter(Array.isArray).flat().forEach((item) => {
            if (!Number.isInteger(item.x) || !Number.isInteger(item.y)) return;
            for (let dy = 0; dy < (item.height || 1); dy += 1) {
              for (let dx = 0; dx < (item.width || 1); dx += 1) assert.notEqual(result.cells[(item.y + dy) * result.width + item.x + dx], 1);
            }
          });
        }
      }
    }
  }
  const config = { ...profiles.standard, tiles: { wallHeight: 3 } };
  assert.deepEqual(generator.generate(config, { seed: "wall-replay" }), generator.generate(config, { seed: "wall-replay" }));
}

function assertFullWalls(dungeon) {
  const { width, height, cells, config } = dungeon;
  const regions = tiles.classifyCells(dungeon);
  for (let y = 1; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (cells[index] === 1 || cells[index - width] !== 1 || !config.tiles.wallHeight) continue;
      assert.ok(y > config.tiles.wallHeight, "the top map edge must have room for the entire wall plus its margin");
      for (let offset = 1; offset <= config.tiles.wallHeight; offset += 1) {
        assert.ok(regions[index - offset * width].endsWith("Wall"), "walls must retain the full configured height");
      }
      assert.equal(regions[index - (config.tiles.wallHeight + 1) * width], "margin", "the cell immediately above the full wall must be margin");
    }
  }
  if (dungeon.tileRegions) assert.deepEqual(dungeon.tileRegions, regions);
}

function assertConnectedPath(path, cells, width) {
  path.forEach((cell, index) => {
    assert.notEqual(cells[cell.y * width + cell.x], 1);
    if (index) assert.equal(Math.abs(cell.x - path[index - 1].x) + Math.abs(cell.y - path[index - 1].y), 1, "paths must include the newly inserted cells");
  });
}

function componentCount(cells, width, height) {
  const visited = new Set();
  let count = 0;
  cells.forEach((cell, index) => {
    if (cell === 1 || visited.has(index)) return;
    count += 1;
    const queue = [index];
    visited.add(index);
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      const x = current % width;
      const y = Math.floor(current / width);
      const neighbors = [x ? current - 1 : -1, x + 1 < width ? current + 1 : -1, y ? current - width : -1, y + 1 < height ? current + width : -1];
      neighbors.forEach((next) => {
        if (next < 0 || cells[next] === 1 || visited.has(next)) return;
        visited.add(next);
        queue.push(next);
      });
    }
  });
  return count;
}
