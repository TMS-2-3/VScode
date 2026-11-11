"use strict";

const assert = require("node:assert/strict");
const weights = require("./dungeonWeights.js");
const profiles = require("./dungeonProfiles.js");
const moduleApi = require("./dungeonGenerator.js");
const generator = moduleApi.create(require("../../rot.js-master/dist/rot.js"));

testIntegerWeights();
testProportionalSelection();
testDuplicateItemPersistenceAndGeneration();
console.log("dungeonWeights tests passed");

function testIntegerWeights() {
  for (const value of [1, 2, weights.MAX_WEIGHT]) assert.equal(weights.normalizeWeight(value), value);
  assert.equal(weights.normalizeWeight(1.5), 1);
  assert.equal(weights.normalizeWeight(2.8), 2);
  for (const value of [0, -1, 0.5, NaN, Infinity, weights.MAX_WEIGHT + 1, "1", null, undefined]) {
    assert.throws(() => weights.normalizeWeight(value), /重み/);
    for (const config of [
      { ...profiles.standard, enemyPool: [{ id: "enemy", name: "enemy", weight: value }] },
      { ...profiles.standard, trapPool: [{ id: "test_trap", name: "trap", weight: value }] },
      { ...profiles.standard, treasureTable: { rolls: [1, 1], entries: [{ type: "item", id: "potion", name: "ポーション", minCount: 1, maxCount: 1, weight: value }] } },
    ]) {
      assert.throws(() => moduleApi.normalizeConfig(config), /重み/);
      assert.throws(() => profiles.createRecord(config, { id: "invalid_weight", name: "invalid" }), /重み/);
    }
  }
  const decimalConfig = {
    ...profiles.standard,
    treasureTable: { rolls: [1, 1], entries: [{ type: "item", id: "potion", name: "ポーション", minCount: 1, maxCount: 1, weight: 2.8 }] },
    enemyPool: [{ id: "enemy", name: "enemy", weight: 1.9 }],
  };
  const before = JSON.stringify(decimalConfig);
  for (const config of [moduleApi.normalizeConfig(decimalConfig), profiles.createRecord(decimalConfig, { id: "floored_weights", name: "切り捨て" }).config]) {
    assert.equal(config.treasureTable.entries[0].weight, 2);
    assert.equal(config.enemyPool[0].weight, 1);
  }
  assert.equal(JSON.stringify(decimalConfig), before, "flooring must not mutate the source profile");
}

function testProportionalSelection() {
  assert.equal(weights.select([], () => { throw new Error("an empty pool must not draw a random number"); }), null);
  const entries = [{ id: "one", weight: 1 }, { id: "two", weight: 2 }];
  const counts = { one: 0, two: 0 };
  for (let draw = 0; draw < 3000; draw += 1) counts[weights.select(entries, () => (draw + 0.5) / 3000).id] += 1;
  assert.deepEqual(counts, { one: 1000, two: 2000 }, "weights 1 and 2 must produce a 1:2 ratio, not 1% and 2%");
  const quantities = [{ id: "potion", minCount: 1, maxCount: 1, weight: 2 }, { id: "potion", minCount: 2, maxCount: 2, weight: 1 }];
  const quantityCounts = { 1: 0, 2: 0 };
  for (let draw = 0; draw < 3000; draw += 1) quantityCounts[weights.select(quantities, () => (draw + 0.5) / 3000).minCount] += 1;
  assert.deepEqual(quantityCounts, { 1: 2000, 2: 1000 }, "quantity must not multiply the selection weight");
}

function testDuplicateItemPersistenceAndGeneration() {
  const entries = [
    { type: "item", id: "potion", name: "ポーション", weight: 2, minCount: 1, maxCount: 1 },
    { type: "item", id: "potion", name: "ポーション", weight: 1, minCount: 2, maxCount: 2 },
  ];
  const config = { ...profiles.standard, treasureLimits: { min: 1, max: 1 }, treasureTable: { rolls: [1, 1], entries } };
  const before = JSON.stringify(config);
  const record = profiles.createRecord(config, { id: "potion_variants", name: "個数別の抽選" });
  assert.deepEqual(profiles.parse(profiles.serialize([record]))[0].config.treasureTable.entries, entries);
  assert.deepEqual(profiles.fromScript(profiles.toScript([record]))[0].config.treasureTable.entries, entries);
  assert.deepEqual(moduleApi.normalizeConfig(config).treasureTable.entries, entries, "normalization must not merge identical item IDs");
  const quantities = new Set();
  for (const rolls of [1, 2]) {
    const found = new Set();
    for (let seed = 1; seed <= 50; seed += 1) {
      const result = generator.generate({ ...config, treasureTable: { rolls: [rolls, rolls], entries } }, { seed: `weight-${seed}`, maxAttempts: 300 });
      assert.equal(result.ok, true);
      assert.equal(result.placements.treasure.length, 1);
      assert.equal(result.config.treasureTable.entries.length, 2);
      const contents = result.placements.treasure[0].contents;
      assert.equal(contents.length, 1, "multiple successful rolls of the same item must still aggregate into one received item stack");
      assert.equal(contents[0].id, "potion");
      assert.ok(contents[0].count >= rolls && contents[0].count <= rolls * 2);
      found.add(contents[0].count);
      if (rolls === 1) quantities.add(contents[0].count);
    }
    assert.equal(found.size, rolls + 1);
  }
  assert.deepEqual([...quantities].sort(), [1, 2]);
  assert.equal(JSON.stringify(config), before);
}
