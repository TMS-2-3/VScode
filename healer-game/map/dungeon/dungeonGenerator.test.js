"use strict";

const assert = require("node:assert/strict");
const ROT = require("../../rot.js-master/dist/rot.js");
const DungeonGenerator = require("./dungeonGenerator.js");
const DungeonProfiles = require("./dungeonProfiles.js");

const generator = DungeonGenerator.create(ROT);

testDeterministicGeneration();
testStandardProfile();
testMandatoryEventPlacement();
testRotRandomStateIsRestored();
testExplicitAttemptLimit();

console.log("dungeonGenerator tests passed");

function testDeterministicGeneration() {
  const first = generator.generate(DungeonProfiles.standard, { seed: "same-seed" });
  const second = generator.generate(DungeonProfiles.standard, { seed: "same-seed" });
  assert.deepEqual(second, first);
}

function testStandardProfile() {
  for (let seed = 1; seed <= 100; seed += 1) {
    const result = generator.generate(DungeonProfiles.standard, { seed });
    assert.equal(result.ok, true, `seed ${seed} should produce a valid dungeon`);
    assert.equal(result.width, 60);
    assert.equal(result.height, 40);
    assert.equal(result.cells.length, result.width * result.height);
    assert.ok(result.metrics.roomCount >= 6 && result.metrics.roomCount <= 12);
    assert.ok(result.metrics.mainPathLength >= 30);
    assert.ok(result.metrics.branchRoomCount >= 2);
    assert.equal(result.placements.rest.length, 0, "standard profile must not add a recovery room");
    assertUniqueWalkablePlacements(result);

    const asciiRows = DungeonGenerator.toAscii(result).split("\n");
    assert.equal(asciiRows.length, result.height);
    assert.ok(asciiRows.every((row) => row.length === result.width));
    assert.doesNotThrow(() => JSON.stringify(result));
  }
}

function testMandatoryEventPlacement() {
  const profile = {
    ...DungeonProfiles.standard,
    mandatoryEvents: [
      {
        id: "story_marker",
        type: "story",
        required: true,
        preferBranch: true,
        minEntranceDistance: 12,
        footprint: { width: 2, height: 2 },
        data: { storyId: "sample" },
      },
    ],
  };
  const result = generator.generate(profile, { seed: 4182 });
  assert.equal(result.ok, true);
  assert.equal(result.placements.mandatoryEvents.length, 1);
  assert.equal(result.placements.mandatoryEvents[0].id, "story_marker");
  assert.equal(result.placements.mandatoryEvents[0].width, 2);
  assert.equal(result.placements.mandatoryEvents[0].height, 2);
  assert.ok(result.placements.mandatoryEvents[0].approach);
}

function testRotRandomStateIsRestored() {
  ROT.RNG.setSeed(987654321);
  ROT.RNG.getUniform();
  const seedBefore = ROT.RNG.getSeed();
  const stateBefore = ROT.RNG.getState().slice();
  generator.generate(DungeonProfiles.standard, { seed: 15 });
  assert.equal(ROT.RNG.getSeed(), seedBefore);
  assert.deepEqual(ROT.RNG.getState(), stateBefore);
}

function testExplicitAttemptLimit() {
  const impossibleProfile = {
    ...DungeonProfiles.standard,
    retryLimit: 2,
    validation: {
      ...DungeonProfiles.standard.validation,
      minRooms: 50,
      maxRooms: 50,
    },
  };
  const result = generator.generate(impossibleProfile, { seed: 1 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "attempt_limit_exhausted");
  assert.equal(result.attempts.length, 2);
}

function assertUniqueWalkablePlacements(result) {
  const occupied = new Set();
  const groups = [
    result.placements.treasure,
    result.placements.rest,
    result.placements.enemies,
    result.placements.traps,
    result.placements.decorations,
  ];
  groups.flat().forEach((placement) => {
    const key = `${placement.x},${placement.y}`;
    assert.equal(occupied.has(key), false, `duplicate placement at ${key}`);
    occupied.add(key);
    assert.notEqual(DungeonGenerator.getCell(result, placement.x, placement.y), DungeonGenerator.CELL_TYPES.WALL);
  });
}
