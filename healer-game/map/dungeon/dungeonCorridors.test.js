"use strict";

const assert = require("node:assert/strict");
const corridors = require("./dungeonCorridors.js");
const profiles = require("./dungeonProfiles.js");
const generator = require("./dungeonGenerator.js").create(require("../../rot.js-master/dist/rot.js"));

testRouteTracing();
testWideningAndRounding();
testSeparateRoutesRemainSeparate();
testScaleAndRoomInfluence();
testGenerationAcrossScales();
console.log("dungeonCorridors tests passed");

function random(seed) {
  let state = seed || 1;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function fixture() {
  const width = 30;
  const height = 24;
  const rooms = [
    { id: "a", left: 2, top: 2, right: 6, bottom: 6, area: 25 },
    { id: "b", left: 22, top: 16, right: 26, bottom: 20, area: 25 },
  ];
  const cells = Array(width * height).fill(1);
  rooms.forEach((room) => {
    for (let y = room.top; y <= room.bottom; y += 1) {
      for (let x = room.left; x <= room.right; x += 1) cells[y * width + x] = 0;
    }
  });
  for (let x = 7; x <= 24; x += 1) cells[4 * width + x] = 0;
  for (let y = 5; y <= 15; y += 1) cells[y * width + 24] = 0;
  const config = {
    width, height, scale: 3,
    generator: { corridorShape: { enabled: true, minWidth: 1, maxWidth: 5, bulgeChance: 1, roundingChance: 1 } },
  };
  return { layout: { cells, rooms }, config };
}

function testRouteTracing() {
  const mask = Array(144).fill(false);
  for (let x = 3; x <= 8; x += 1) mask[3 * 12 + x] = mask[8 * 12 + x] = true;
  for (let y = 3; y <= 8; y += 1) mask[y * 12 + 3] = mask[y * 12 + 8] = true;
  const routes = corridors.traceRoutes(mask, 12, 12);
  assert.equal(routes.length, 1, "closed loops must be traced once and terminate");
  assert.equal(routes[0][0], routes[0][routes[0].length - 1]);
  assert.equal(routes[0].length - 1, mask.filter(Boolean).length);
}

function testWideningAndRounding() {
  let roundingCount = 0;
  let swellingCount = 0;
  for (let seed = 1; seed <= 50; seed += 1) {
    const { layout, config } = fixture();
    const before = layout.cells.slice();
    const roads = corridors.shape(layout, config, random(seed * 971));
    assert.equal(roads.length, 1);
    assert.ok(roads[0].addedCells.length > 0);
    assert.ok(new Set(roads[0].actualWidths).size > 1, "width should vary along a road");
    assert.deepEqual(new Set(roads[0].roomIds), new Set(["a", "b"]));
    roundingCount += roads[0].roundedCorners.length;
    const widths = roads[0].targetWidths;
    if (Math.max(...widths.slice(1, -1)) > Math.max(widths[0], widths[widths.length - 1])) swellingCount += 1;
    before.forEach((cell, index) => {
      if (cell !== 1) assert.equal(layout.cells[index], cell, "original floors and doors must remain intact");
      const x = index % config.width;
      const y = Math.floor(index / config.width);
      const protectedCell = x === 0 || y === 0 || x === config.width - 1 || y === config.height - 1
        || layout.rooms.some((room) => x >= room.left - 1 && x <= room.right + 1 && y >= room.top - 1 && y <= room.bottom + 1);
      if (protectedCell) assert.equal(layout.cells[index], cell, "rooms, their entrance walls and the map border must not change");
    });
    assert.equal(componentCount(layout.cells, config.width, config.height), 1, "every added floor must remain connected");
    const repeat = fixture();
    assert.deepEqual(corridors.shape(repeat.layout, repeat.config, random(seed * 971)), roads);
    assert.deepEqual(repeat.layout.cells, layout.cells);
  }
  assert.ok(roundingCount > 0, "some corners should gain rounded, stepped outlines");
  assert.ok(swellingCount > 30, "most sampled roads should include a wider middle section");
  const disabled = fixture();
  disabled.config.generator.corridorShape.enabled = false;
  const before = disabled.layout.cells.slice();
  assert.deepEqual(corridors.shape(disabled.layout, disabled.config, random(7)), []);
  assert.deepEqual(disabled.layout.cells, before);
}

function testSeparateRoutesRemainSeparate() {
  for (let seed = 1; seed <= 20; seed += 1) {
    const { config } = fixture();
    const layout = { rooms: [], cells: Array(config.width * config.height).fill(1) };
    for (let x = 2; x < 28; x += 1) layout.cells[5 * config.width + x] = layout.cells[10 * config.width + x] = 0;
    config.generator.corridorShape.minWidth = 4;
    corridors.shape(layout, config, random(seed * 71));
    assert.equal(componentCount(layout.cells, config.width, config.height), 2, "nearby independent roads must not accidentally join");
    const junctionLayout = { rooms: [], cells: Array(config.width * config.height).fill(1) };
    for (let x = 2; x <= 20; x += 1) junctionLayout.cells[6 * config.width + x] = 0;
    for (let y = 2; y <= 6; y += 1) junctionLayout.cells[y * config.width + 12] = 0;
    for (let x = 14; x <= 24; x += 1) junctionLayout.cells[8 * config.width + x] = 0;
    corridors.shape(junctionLayout, config, random(seed * 191));
    assert.equal(componentCount(junctionLayout.cells, config.width, config.height), 2, "a nearby junction must not allow a shortcut into an unrelated road");
  }
}

function testScaleAndRoomInfluence() {
  let lowTotal = 0;
  let highTotal = 0;
  for (const scale of [1, 10]) {
    for (let seed = 1; seed <= 20; seed += 1) {
      const { layout, config } = fixture();
      config.scale = scale;
      const [road] = corridors.shape(layout, config, random(seed * 17));
      const average = road.targetWidths.reduce((sum, value) => sum + value, 0) / road.targetWidths.length;
      if (scale === 1) lowTotal += average;
      else highTotal += average;
    }
  }
  assert.ok(highTotal > lowTotal, "larger scale should bias corridors wider without making width uniform");
  const small = fixture();
  const large = fixture();
  small.layout.rooms[1].area = 4;
  large.layout.rooms[1].area = 100;
  const [smallRoad] = corridors.shape(small.layout, small.config, random(1001));
  const [largeRoad] = corridors.shape(large.layout, large.config, random(1001));
  assert.ok(largeRoad.targetWidths.at(-1) > smallRoad.targetWidths.at(-1));
}

function testGenerationAcrossScales() {
  for (let scale = 1; scale <= 10; scale += 1) {
    for (let seed = 1; seed <= 15; seed += 1) {
      const result = generator.generate({ ...profiles.standard, scale }, { seed: `corridor-${seed}`, maxAttempts: 200 });
      assert.equal(result.ok, true, `scale ${scale}, seed ${seed}`);
      assert.equal(componentCount(result.cells, result.width, result.height), 1);
      assert.ok(result.corridorShapes.length > 0);
      assert.ok(result.metrics.corridorAddedCells > 0);
      for (const approach of [result.entranceApproach, result.exitApproach]) {
        assert.ok(approach.path.every(({ x, y }) => result.cells[y * result.width + x] !== 1));
      }
    }
  }
}

function componentCount(cells, width, height) {
  const visited = new Set();
  let components = 0;
  cells.forEach((cell, index) => {
    if (cell === 1 || visited.has(index)) return;
    components += 1;
    const queue = [index];
    visited.add(index);
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      const x = current % width;
      const y = Math.floor(current / width);
      const neighbors = [x > 0 ? current - 1 : -1, x < width - 1 ? current + 1 : -1, y > 0 ? current - width : -1, y < height - 1 ? current + width : -1];
      neighbors.forEach((next) => {
        if (next < 0 || cells[next] === 1 || visited.has(next)) return;
        visited.add(next);
        queue.push(next);
      });
    }
  });
  return components;
}
