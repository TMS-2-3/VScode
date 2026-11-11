"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROT = require("../../rot.js-master/dist/rot.js");
const profiles = require("./dungeonProfiles.js");
const generator = require("./dungeonGenerator.js").create(ROT);
const original = profiles.saved();

try {
  testRoundTrip();
  testCatalogAndIsolation();
  testScriptAndFreshBrowserLoad();
  testValidation();
  testUnscaledGeneration();
  console.log("dungeonProfiles tests passed");
} finally {
  profiles.replaceSaved(original);
}

function makeRecord(id = "forest_test") {
  return profiles.createRecord({
    ...profiles.standard,
    scale: 5,
    danger: 7,
    entranceApproach: { ...profiles.standard.entranceApproach, startDirections: ["down"] },
    exitApproach: { ...profiles.standard.exitApproach, endDirections: ["left", "up"] },
    tiles: { floorTileId: "grass01", wallTileId: "caveWall01" },
    treasureLimits: { min: 2, max: 4 },
    treasureTable: {
      rolls: [1, 3],
      entries: [{ type: "material", id: "horn", name: "角", weight: 3, minCount: 1, maxCount: 4 }],
    },
    enemyPool: [{ id: "horn_rabbit", name: "ツノウサギ", weight: 2 }],
  }, {
    id, name: "森テスト", preview: { seed: "profile-roundtrip", viewOptions: { grid: true, rooms: false } },
  });
}

function testRoundTrip() {
  const record = makeRecord();
  assert.deepEqual(profiles.parse(profiles.serialize([record])), [record]);
  assert.equal(record.config.width, 60);
  assert.equal(record.config.height, 40);
  assert.deepEqual(record.config.placements.enemyCount, [4, 8]);
  assert.deepEqual(record.config.treasureLimits, { min: 2, max: 4 });
  assert.equal(record.config.id, record.id);
  assert.equal(record.config.name, record.name);
  profiles.replaceSaved([record]);
  assert.equal(profiles.get(record.id).preview, undefined, "preview seed must not become a runtime seed");
  assert.equal(profiles.get(record.id).seed, undefined);
  assert.equal(profiles.getRecord(record.id).preview.seed, "profile-roundtrip");
}

function testCatalogAndIsolation() {
  const first = makeRecord("first");
  const second = makeRecord("second");
  profiles.replaceSaved([first, second]);
  first.config.tiles.floorTileId = "changed";
  assert.equal(profiles.get("first").tiles.floorTileId, "grass01");
  const retrieved = profiles.get("first");
  retrieved.tiles.floorTileId = "also-changed";
  assert.equal(profiles.get("first").tiles.floorTileId, "grass01");
  assert.equal(profiles.list()[0].builtIn, true);
  assert.equal(profiles.list().length, 3);
  assert.deepEqual(profiles.get("standard"), profiles.standard);
  assert.throws(() => profiles.get("missing"), /見つかりません/);
  profiles.replaceSaved([second]);
  assert.throws(() => profiles.get("first"), /見つかりません/);
  assert.equal(profiles.get("second").id, "second");
  assert.throws(() => profiles.replaceSaved([second, second]), /重複/);
  assert.equal(profiles.saved().length, 1, "invalid replacement must leave the current catalog intact");
}

function testScriptAndFreshBrowserLoad() {
  const record = makeRecord();
  const script = profiles.toScript([record]);
  assert.deepEqual(profiles.fromScript(script.replace(/\n/g, "\r\n")), [record]);
  assert.deepEqual(profiles.fromScript("\uFEFF" + script), [record]);
  assert.throws(() => profiles.fromScript("console.log('unrelated code');" + script), /保存ファイル/);
  assert.throws(() => profiles.fromScript(script + "\nalert('do not execute');"), /保存ファイル/);
  const browser = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, "dungeonTiles.js"), "utf8"), browser);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "dungeonTreasureLimits.js"), "utf8"), browser);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "dungeonWeights.js"), "utf8"), browser);
  vm.runInContext(script, browser);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "dungeonProfiles.js"), "utf8"), browser);
  const restored = JSON.parse(JSON.stringify(browser.HEALER_DUNGEON_PROFILES.getRecord(record.id)));
  assert.deepEqual(restored, record, "fresh load must restore the saved catalog without localStorage or fetch");
  const persistedFile = fs.readFileSync(path.join(__dirname, profiles.fileName), "utf8");
  assert.doesNotThrow(() => profiles.fromScript(persistedFile));
  const commonJs = vm.createContext({ module: { exports: {} } });
  vm.runInContext(script, commonJs);
  assert.equal(commonJs.module.exports.profiles[0].id, record.id);
}

function testValidation() {
  assert.throws(() => profiles.createRecord(profiles.standard, { id: "standard_digger", name: "標準上書き" }), /標準/);
  assert.throws(() => profiles.createRecord(profiles.standard, { id: "../escape", name: "不正" }), /ID/);
  assert.throws(() => profiles.createRecord(profiles.standard, { id: "valid", name: "   " }), /名前/);
  assert.throws(() => profiles.createRecord(profiles.standard, { id: "valid", name: "" }), /名前/);
  assert.throws(() => profiles.createRecord(profiles.standard, { id: "", name: "valid" }), /ID/);
  assert.throws(() => profiles.parse('{"format":"other","version":1,"profiles":[]}'), /形式/);
  assert.throws(() => profiles.parse('{"format":"healer-dungeon-profiles","version":2,"profiles":[]}'), /形式/);
  assert.throws(() => profiles.createRecord({ scale: 11 }, { id: "bad", name: "bad" }), /scale/);
  assert.throws(() => profiles.createRecord({ generator: null }, { id: "bad", name: "bad" }), /generator/);
  assert.throws(() => profiles.createRecord({ enemyPool: [null] }, { id: "bad", name: "bad" }), /enemyPool/);
  assert.throws(() => profiles.createRecord({ entranceApproach: { startDirections: [] } }, { id: "bad", name: "bad" }), /方向/);
  assert.throws(() => profiles.createRecord({ validation: { minRooms: Infinity } }, { id: "bad", name: "bad" }), /値/);
  assert.throws(() => profiles.createRecord({ tuning: {} }, { id: "bad", name: "bad" }), /補正前/);
  assert.throws(() => profiles.createRecord(JSON.parse('{"__proto__":{"polluted":true}}'), { id: "bad", name: "bad" }), /未対応/);
  assert.equal({}.polluted, undefined);
}

function testUnscaledGeneration() {
  let record = makeRecord();
  const first = generator.generate(record.config, { seed: record.preview.seed, maxAttempts: 300 });
  assert.equal(first.ok, true);
  for (let round = 0; round < 5; round += 1) {
    record = profiles.parse(profiles.serialize([record]))[0];
    const result = generator.generate(record.config, { seed: record.preview.seed, maxAttempts: 300 });
    assert.equal(result.ok, true);
    assert.equal(result.width, 72);
    assert.equal(result.wallSpacing.baseHeight, 48);
    assert.equal(result.height, 48 + result.wallSpacing.addedRows);
    assert.deepEqual(result, first);
    assert.equal(record.config.width, 60, "the stored width must remain unscaled");
    assert.deepEqual(record.config.placements.enemyCount, [4, 8]);
    assert.deepEqual(record.config.treasureLimits, { min: 2, max: 4 }, "bounds must stay unscaled through saving and loading");
    assert.ok(result.placements.treasure.length >= 2 && result.placements.treasure.length <= 4);
  }
}
