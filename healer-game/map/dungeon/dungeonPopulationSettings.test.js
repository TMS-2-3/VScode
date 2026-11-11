"use strict";

const assert = require("node:assert/strict");
const profiles = require("./dungeonProfiles.js");
const moduleApi = require("./dungeonGenerator.js");
const generator = moduleApi.create(require("../../rot.js-master/dist/rot.js"));
const safety = require("./dungeonPlacementSafety.js");

testDefaultsAndValidation();
testPersistence();
testPopulationBounds();
testTrapCapPreservesTreasure();
testTrapTypesAndAmbientSpacing();
console.log("dungeonPopulationSettings tests passed");

function testDefaultsAndValidation() {
  const legacy = { ...profiles.standard };
  delete legacy.enemyLimits;
  delete legacy.trapLimits;
  delete legacy.trapPool;
  const normalized = moduleApi.normalizeConfig(legacy);
  assert.deepEqual(normalized.enemyLimits, { min: 0, max: null });
  assert.deepEqual(normalized.trapLimits, { min: 0, max: null });
  assert.deepEqual(normalized.trapPool, []);
  for (const [key, label] of [["enemyLimits", "魔物"], ["trapLimits", "罠"]]) {
    for (const value of [null, [], { min: -1 }, { min: 1.5 }, { max: -1 }, { max: Infinity }, { min: 3, max: 2 }, { extra: 0 }]) {
      const config = { ...profiles.standard, [key]: value };
      assert.throws(() => moduleApi.normalizeConfig(config), new RegExp(label));
      assert.throws(() => profiles.createRecord(config, { id: "invalid_population", name: "invalid" }), new RegExp(label));
    }
    assert.throws(() => generator.generate({ ...profiles.standard, [key]: { min: Number.MAX_SAFE_INTEGER, max: null } }), new RegExp(label));
  }
  assert.throws(() => profiles.createRecord({ ...profiles.standard, trapPool: [null] }, { id: "invalid_trap", name: "invalid" }), /trapPool/);
  assert.throws(() => profiles.createRecord({ ...profiles.standard, trapPool: [{ id: "spike", weight: 0 }] }, { id: "invalid_trap", name: "invalid" }), /重み/);
}

function testPersistence() {
  const config = {
    ...profiles.standard,
    enemyLimits: { min: 2, max: 4 },
    trapLimits: { min: 1, max: 3 },
    trapPool: [{ id: "test_spike", name: "試験用の罠", weight: 2.9 }],
  };
  const before = JSON.stringify(config);
  const record = profiles.createRecord(config, { id: "population", name: "個数指定" });
  const restored = profiles.fromScript(profiles.toScript([record]))[0].config;
  assert.deepEqual(restored.enemyLimits, { min: 2, max: 4 });
  assert.deepEqual(restored.trapLimits, { min: 1, max: 3 });
  assert.deepEqual(restored.trapPool, [{ id: "test_spike", name: "試験用の罠", weight: 2 }]);
  assert.equal(JSON.stringify(config), before);
  delete record.config.enemyLimits;
  delete record.config.trapLimits;
  delete record.config.trapPool;
  const legacy = profiles.parse(JSON.stringify({ format: "healer-dungeon-profiles", version: 1, profiles: [record] }))[0];
  assert.deepEqual(legacy.config.enemyLimits, { min: 0, max: null });
  assert.deepEqual(legacy.config.trapLimits, { min: 0, max: null });
  assert.deepEqual(legacy.config.trapPool, []);
}

function testPopulationBounds() {
  for (const limits of [{ min: 0, max: null }, { min: 0, max: 0 }, { min: 0, max: 2 }, { min: 3, max: 3 }, { min: 4, max: null }, { min: 2, max: 5 }]) {
    for (const scale of [1, 3, 10]) {
      for (const danger of [1, 10]) {
        for (let seed = 1; seed <= 6; seed += 1) {
          const config = { ...profiles.standard, scale, danger, enemyLimits: limits, trapLimits: limits };
          const before = JSON.stringify(config);
          const result = generator.generate(config, { seed: `population-${seed}`, maxAttempts: 300 });
          assert.equal(result.ok, true, `${JSON.stringify(limits)}, scale ${scale}, danger ${danger}, seed ${seed}`);
          for (const key of ["enemies", "traps"]) {
            assert.ok(result.placements[key].length >= limits.min);
            if (limits.max !== null) assert.ok(result.placements[key].length <= limits.max);
          }
          assert.deepEqual(result.config.enemyLimits, limits);
          assert.deepEqual(result.config.trapLimits, limits);
          assert.equal(JSON.stringify(config), before);
          assert.equal(safety.inspect(result).valid, true);
          const keys = Object.values(result.placements).filter(Array.isArray).flat().filter((item) => Number.isInteger(item.x) && Number.isInteger(item.y)).map((item) => `${item.x},${item.y}`);
          assert.equal(new Set(keys).size, keys.length);
          assert.ok(result.placements.traps.every((item) => item.trapTypeId === null && item.trapName === ""), "no real trap type should be invented for an empty pool");
        }
      }
    }
  }
}

function testTrapCapPreservesTreasure() {
  const result = generator.generate({
    ...profiles.standard,
    trapLimits: { min: 0, max: 0 },
    branchContents: { ...profiles.standard.branchContents, outcomes: { empty: 0, trap: 0, treasure: 0, both: 1 } },
  }, { seed: "trap-cap", maxAttempts: 300 });
  assert.equal(result.ok, true);
  assert.equal(result.placements.traps.length, 0);
  assert.ok(result.placements.branchContents.length > 0);
  assert.ok(result.placements.branchContents.every((item) => item.outcome === "treasure" && item.treasureId && !item.trapId));
  const cappedAmbient = generator.generate({
    ...profiles.standard, trapLimits: { min: 0, max: 2 }, placements: { ...profiles.standard.placements, trapCount: [5, 5] },
  }, { seed: "ambient-cap", maxAttempts: 300 });
  assert.equal(cappedAmbient.ok, true);
  assert.equal(cappedAmbient.placements.traps.length, 2, "branch and ambient traps must share the same cap");
}

function testTrapTypesAndAmbientSpacing() {
  const config = {
    ...profiles.standard,
    trapLimits: { min: 4, max: 6 },
    trapPool: [{ id: "test_spike", name: "棘（試験）", weight: 2.9 }, { id: "test_dart", name: "矢（試験）", weight: 1 }],
    placements: { ...profiles.standard.placements, trapCount: [2, 2] },
  };
  const found = new Set();
  for (let seed = 1; seed <= 20; seed += 1) {
    const result = generator.generate(config, { seed: `trap-types-${seed}`, maxAttempts: 300 });
    assert.equal(result.ok, true);
    assert.ok(result.placements.traps.length >= 4 && result.placements.traps.length <= 6);
    assert.deepEqual(result.config.trapPool.map((entry) => entry.weight), [2, 1]);
    result.placements.traps.forEach((item) => {
      found.add(item.trapTypeId);
      assert.equal(item.trapName, config.trapPool.find((entry) => entry.id === item.trapTypeId).name);
      if (item.branchId) return;
      result.placements.traps.forEach((other) => {
        if (other === item) return;
        assert.ok(Math.abs(item.x - other.x) + Math.abs(item.y - other.y) >= result.config.placements.minTrapSpacing);
      });
    });
  }
  assert.deepEqual([...found].sort(), ["test_dart", "test_spike"]);
  const withoutBranches = generator.generate({ ...config, trapLimits: { min: 3, max: 3 }, branchContents: { ...config.branchContents, enabled: false } }, { seed: "trap-minimum", maxAttempts: 300 });
  assert.equal(withoutBranches.ok, true);
  assert.equal(withoutBranches.placements.traps.length, 3);
}
