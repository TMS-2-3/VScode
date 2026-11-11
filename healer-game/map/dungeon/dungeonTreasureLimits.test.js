"use strict";

const assert = require("node:assert/strict");
const limits = require("./dungeonTreasureLimits.js");
const profiles = require("./dungeonProfiles.js");
const moduleApi = require("./dungeonGenerator.js");
const generator = moduleApi.create(require("../../rot.js-master/dist/rot.js"));
const safety = require("./dungeonPlacementSafety.js");

testNormalization();
testPersistenceAndLegacyDefaults();
testGeneratedCounts();
testZeroMaximumPreservesTraps();
testMinimumWithoutBranchRolls();
testBoundsWithReservedRooms();
console.log("dungeonTreasureLimits tests passed");

function testNormalization() {
  assert.deepEqual(limits.normalize(), { min: 0, max: null });
  assert.deepEqual(limits.normalize({}), { min: 0, max: null });
  assert.deepEqual(limits.normalize({ max: 0 }), { min: 0, max: 0 });
  assert.deepEqual(limits.normalize({ min: 2 }), { min: 2, max: null });
  assert.deepEqual(limits.normalize({ min: 2, max: 2 }), { min: 2, max: 2 });
  for (const invalid of [null, [], 0, { other: 0 }, { min: -1 }, { min: 0.5 }, { min: "1" }, { min: Infinity }, { min: NaN }, { min: Number.MAX_SAFE_INTEGER + 1 },
    { max: -1 }, { max: 0.5 }, { max: "なし" }, { max: Infinity }, { max: NaN }, { min: 3, max: 2 }]) {
    assert.throws(() => limits.normalize(invalid), /宝箱/);
    assert.throws(() => moduleApi.normalizeConfig({ ...profiles.standard, treasureLimits: invalid }), /宝箱/);
    assert.throws(() => profiles.createRecord({ ...profiles.standard, treasureLimits: invalid }, { id: "invalid_bounds", name: "invalid" }), /宝箱/);
  }
  assert.throws(() => generator.generate({ ...profiles.standard, treasureLimits: { min: 10000, max: null } }), /下限宝箱数/, "obviously impossible bounds must fail before entering the unlimited retry loop");
}

function testPersistenceAndLegacyDefaults() {
  for (const value of [{ min: 0, max: null }, { min: 0, max: 0 }, { min: 2, max: 4 }, { min: 3, max: null }]) {
    const record = profiles.createRecord({ ...profiles.standard, treasureLimits: value }, { id: "bounded_chests", name: "宝箱数テスト" });
    assert.deepEqual(profiles.parse(profiles.serialize([record]))[0].config.treasureLimits, value);
    assert.deepEqual(profiles.fromScript(profiles.toScript([record]))[0].config.treasureLimits, value);
  }
  const legacy = profiles.createRecord(profiles.standard, { id: "old_chests", name: "旧プロファイル" });
  delete legacy.config.treasureLimits;
  const text = JSON.stringify({ format: "healer-dungeon-profiles", version: 1, profiles: [legacy] });
  assert.deepEqual(profiles.parse(text)[0].config.treasureLimits, { min: 0, max: null });
  const absent = { ...profiles.standard };
  delete absent.treasureLimits;
  assert.deepEqual(generator.generate(absent, { seed: "default-bounds", maxAttempts: 200 }), generator.generate({ ...absent, treasureLimits: limits.defaults }, { seed: "default-bounds", maxAttempts: 200 }), "missing bounds must behave exactly like the defaults");
}

function testGeneratedCounts() {
  for (const value of [{ min: 0, max: null }, { min: 0, max: 0 }, { min: 0, max: 1 }, { min: 1, max: 1 }, { min: 2, max: 2 }, { min: 2, max: 4 }, { min: 3, max: null }]) {
    for (const scale of [1, 3, 10]) {
      for (const danger of [1, 10]) {
        for (let seed = 1; seed <= 8; seed += 1) {
          const config = { ...profiles.standard, scale, danger, treasureLimits: value };
          const before = JSON.stringify(config);
          const result = generator.generate(config, { seed: `bounded-${seed}`, maxAttempts: 300 });
          assert.equal(result.ok, true, `limits ${JSON.stringify(value)}, scale ${scale}, danger ${danger}, seed ${seed}`);
          assertCountsAndAccess(result, value);
          assert.equal(JSON.stringify(config), before, "generation must not modify saved count bounds");
          assert.deepEqual(result.config.treasureLimits, value, "count bounds must not scale with map size or danger");
        }
      }
    }
  }
}

function testZeroMaximumPreservesTraps() {
  const result = generator.generate({
    ...profiles.standard,
    treasureLimits: { min: 0, max: 0 },
    branchContents: { ...profiles.standard.branchContents, outcomes: { empty: 0, trap: 0, treasure: 0, both: 1 } },
  }, { seed: "capped-both", maxAttempts: 300 });
  assert.equal(result.ok, true);
  assertCountsAndAccess(result, { min: 0, max: 0 });
  assert.ok(result.placements.branchContents.length > 0);
  assert.ok(result.placements.branchContents.every((item) => item.outcome === "trap" && item.trapId && !item.treasureId), "capping a trap-and-chest outcome must retain its trap");
}

function testMinimumWithoutBranchRolls() {
  for (const value of [{ min: 0, max: null }, { min: 2, max: 2 }, { min: 3, max: null }]) {
    const result = generator.generate({ ...profiles.standard, treasureLimits: value, branchContents: { ...profiles.standard.branchContents, enabled: false } }, { seed: "minimum-fill", maxAttempts: 300 });
    assert.equal(result.ok, true);
    assertCountsAndAccess(result, value);
    assert.equal(result.placements.treasure.length, value.min);
    assert.ok(result.placements.treasure.every((item) => item.minimumFill));
  }
}

function testBoundsWithReservedRooms() {
  const result = generator.generate({
    ...profiles.standard,
    treasureLimits: { min: 2, max: 3 },
    roomRoles: { ...profiles.standard.roomRoles, restCount: [1, 1], restPathRange: [0, 1] },
    mandatoryEvents: [{ id: "monument", type: "event", required: true, footprint: { width: 2, height: 2 }, minEntranceDistance: 0 }],
  }, { seed: "bounded-reserved-rooms", maxAttempts: 300 });
  assert.equal(result.ok, true);
  assertCountsAndAccess(result, { min: 2, max: 3 });
  assert.equal(result.placements.mandatoryEvents.length, 1);
  assert.equal(result.placements.rest.length, 1);
  const reserved = new Set([...result.placements.mandatoryEvents, ...result.placements.rest].map((item) => item.roomId));
  assert.ok(result.placements.treasure.every((item) => !reserved.has(item.roomId)), "minimum-fill chests must not overwrite event or rest rooms");
}

function assertCountsAndAccess(result, value) {
  const treasure = result.placements.treasure;
  assert.ok(treasure.length >= value.min);
  if (value.max !== null) assert.ok(treasure.length <= value.max);
  const access = safety.inspect(result);
  assert.equal(access.valid, true, access.errors.join(" "));
  assert.ok(treasure.every((item) => item.approach && result.navigationCells[item.approach.y * result.width + item.approach.x] !== 1));
  assert.equal(treasure.length, result.metrics.branchContentCounts.treasure + result.metrics.branchContentCounts.both + treasure.filter((item) => item.minimumFill).length);
  result.mainPath.forEach(({ x, y }) => assert.notEqual(result.navigationCells[y * result.width + x], 1));
}
