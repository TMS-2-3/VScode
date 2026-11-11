"use strict";

const assert = require("node:assert/strict");
const tiles = require("./dungeonTiles.js");
const profiles = require("./dungeonProfiles.js");
const moduleApi = require("./dungeonGenerator.js");
const generator = moduleApi.create(require("../../rot.js-master/dist/rot.js"));
const opposite = { up: "down", down: "up", left: "right", right: "left" };
const deltas = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const tileIds = { up: "lineCopyUp", down: "lineCopyDown", left: "lineCopyLeft", right: "lineCopyRight" };

testImageToggle();
testEndpointDirections();
testPersistence();
testGeneratedCopies();
console.log("dungeonPreview tests passed");

function testImageToggle() {
  const dungeon = { width: 1, height: 1, cells: [0], tileRegions: ["path"], config: { tiles: {} } };
  const fills = [];
  let draws = 0;
  const context = {
    save() {}, restore() {},
    fillRect(x, y) { fills.push([x, y, this.fillStyle]); },
    drawImage() { draws += 1; },
  };
  const before = JSON.stringify(dungeon);
  tiles.draw(context, dungeon, {
    originX: 10, originY: 10, cellSize: 10, width: 40, height: 40, showImages: false,
    getDefinition() { assert.fail("image visibility OFF must not request tile definitions"); },
    getImage() { assert.fail("image visibility OFF must not request images"); },
  });
  assert.equal(draws, 0);
  assert.ok(fills.some(([x, y, color]) => x === 10 && y === 10 && color === "#d7d2bc"));
  assert.ok(fills.some(([x, y, color]) => x === 20 && y === 10 && color === "#1d2822"));
  tiles.draw(context, dungeon, {
    originX: 10, originY: 10, cellSize: 10, width: 40, height: 40,
    getDefinition: () => ({}), getImage: () => ({ complete: true, naturalWidth: 48 }),
  });
  assert.ok(draws > 0);
  assert.equal(JSON.stringify(dungeon), before);
}

function testEndpointDirections() {
  for (const direction of Object.keys(opposite)) {
    const dungeon = {
      width: 7, height: 7, tileRegions: Array(49).fill("margin"),
      entrance: { x: 3, y: 3 }, entranceApproach: { startDirection: direction },
      config: { endpointLineCopy: true },
    };
    dungeon.tileRegions[3 * 7 + 3] = "path";
    const before = JSON.stringify(dungeon);
    dungeon.lineCopies = tiles.createEndpointLineCopies(dungeon);
    const copy = dungeon.lineCopies[0];
    assert.equal(copy.direction, opposite[direction]);
    assert.equal(copy.tileId, tileIds[opposite[direction]]);
    assert.equal(copy.endpoint, "entrance");
    const [dx, dy] = deltas[copy.direction];
    assert.equal(tiles.regionAt(dungeon, 3 + dx, 3 + dy), "path");
    assert.equal(tiles.regionAt(dungeon, 3 + dx * 100, 3 + dy * 100), "path");
    assert.equal(tiles.regionAt(dungeon, 3 - dx * 100, 3 - dy * 100), "margin");
    delete dungeon.lineCopies;
    assert.equal(JSON.stringify(dungeon), before);
    dungeon.exit = dungeon.entrance;
    delete dungeon.entrance;
    dungeon.exitApproach = { endDirection: direction };
    assert.equal(tiles.createEndpointLineCopies(dungeon)[0].tileId, tileIds[direction]);
    dungeon.config.endpointLineCopy = false;
    assert.deepEqual(tiles.createEndpointLineCopies(dungeon), []);
  }
  const fallback = tiles.createEndpointLineCopies({
    config: { endpointLineCopy: true }, entrance: { x: 0, y: 0 }, exit: { x: 1, y: 1 },
    mainPath: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
  });
  assert.equal(fallback.find((entry) => entry.endpoint === "entrance").direction, "left");
  assert.equal(fallback.find((entry) => entry.endpoint === "exit").direction, "down");
}

function testPersistence() {
  const record = profiles.createRecord({ ...profiles.standard, endpointLineCopy: true }, {
    id: "copy_profile", name: "copy test", preview: { viewOptions: { details: false, tiles: false, grid: true } },
  });
  const restored = profiles.fromScript(profiles.toScript([record]))[0];
  assert.deepEqual(restored, record);
  assert.equal(restored.config.endpointLineCopy, true);
  assert.deepEqual(restored.preview.viewOptions, { details: false, tiles: false, grid: true });
  const legacyConfig = { ...profiles.standard };
  delete legacyConfig.endpointLineCopy;
  const legacy = profiles.createRecord(legacyConfig, {
    id: "legacy", name: "legacy", preview: { viewOptions: { path: false, rooms: false, placements: false } },
  });
  assert.equal(legacy.config.endpointLineCopy, false);
  assert.deepEqual(legacy.preview.viewOptions, { path: false, rooms: false, placements: false });
  assert.equal(moduleApi.normalizeConfig(legacyConfig).endpointLineCopy, false);
  for (const value of [null, "true", 1]) {
    assert.throws(() => moduleApi.normalizeConfig({ ...profiles.standard, endpointLineCopy: value }), /直線コピー/);
    assert.throws(() => profiles.createRecord({ ...profiles.standard, endpointLineCopy: value }, { id: "invalid", name: "invalid" }), /endpointLineCopy/);
  }
}

function testGeneratedCopies() {
  for (const direction of ["up", "down", "left", "right", null]) {
    const config = {
      ...profiles.standard,
      entranceApproach: { ...profiles.standard.entranceApproach, ...(direction ? { startDirections: [direction] } : {}) },
      exitApproach: { ...profiles.standard.exitApproach, ...(direction ? { endDirections: [direction] } : {}) },
    };
    const before = JSON.stringify(config);
    const options = { seed: `copy-${direction}`, maxAttempts: 300 };
    const without = generator.generate(config, options);
    const withCopies = generator.generate({ ...config, endpointLineCopy: true }, options);
    assert.equal(without.ok, true);
    assert.equal(withCopies.ok, true);
    assert.equal(withCopies.config.endpointLineCopy, true);
    assert.equal(withCopies.lineCopies.length, 2);
    assert.deepEqual(without.lineCopies, []);
    for (const field of ["cells", "navigationCells", "rooms", "placements", "mainPath", "tileRegions", "attempt"]) {
      assert.deepEqual(withCopies[field], without[field], `${field} must not be rerolled by the copy setting`);
    }
    const start = withCopies.lineCopies.find((entry) => entry.endpoint === "entrance");
    const end = withCopies.lineCopies.find((entry) => entry.endpoint === "exit");
    assert.equal(start.direction, opposite[withCopies.entranceApproach.startDirection]);
    assert.equal(end.direction, withCopies.exitApproach.endDirection);
    for (const [copy, point] of [[start, withCopies.entrance], [end, withCopies.exit]]) {
      assert.deepEqual([copy.x, copy.y], [point.x, point.y]);
      assert.equal(copy.tileId, tileIds[copy.direction]);
      const [dx, dy] = deltas[copy.direction];
      assert.equal(tiles.regionAt(withCopies, copy.x + dx * withCopies.width * 2, copy.y + dy * withCopies.height * 2),
        tiles.regionAt(withCopies, copy.x, copy.y));
    }
    assert.equal(JSON.stringify(config), before);
  }
}
