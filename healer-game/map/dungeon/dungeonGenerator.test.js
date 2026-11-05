"use strict";

const assert = require("node:assert/strict");
const ROT = require("../../rot.js-master/dist/rot.js");
const DungeonGenerator = require("./dungeonGenerator.js");
const DungeonProfiles = require("./dungeonProfiles.js");

const generator = DungeonGenerator.create(ROT);

testDeterministicGeneration();
testStandardProfile();
testScaleLevels();
testDangerLevels();
testDangerTreasureRates();
testGuaranteedTreasure();
testFixedStartDirection();
testFixedExitDirection();
testEditorContentConfiguration();
testBranchContentDistribution();
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
    assert.equal(result.wallSpacing.baseHeight, 40);
    assert.equal(result.height, 40 + result.wallSpacing.addedRows);
    assert.equal(result.cells.length, result.width * result.height);
    assert.ok(result.metrics.roomCount >= 6 && result.metrics.roomCount <= 12);
    assert.ok(result.metrics.mainPathLength >= 30);
    assert.ok(result.metrics.branchRoomCount >= 2);
    assertEntranceApproach(result);
    assertExitApproach(result);
    assert.equal(result.placements.rest.length, 0, "standard profile must not add a recovery room");
    assert.equal(result.metrics.guaranteedTreasureCount, 1, "each standard map must contain one guaranteed chest");
    assert.ok(result.placements.treasure.length >= 1);
    assertUniqueWalkablePlacements(result);

    const asciiRows = DungeonGenerator.toAscii(result).split("\n");
    assert.equal(asciiRows.length, result.height);
    assert.ok(asciiRows.every((row) => row.length === result.width));
    assert.doesNotThrow(() => JSON.stringify(result));
  }
}

function testScaleLevels() {
  const expectedDimensions = [
    [42, 28], [51, 34], [60, 40], [66, 44], [72, 48],
    [78, 52], [84, 56], [90, 60], [96, 64], [102, 68],
  ];
  let previousRoomMaximum = 0;
  expectedDimensions.forEach(([width, height], index) => {
    const scale = index + 1;
    const config = DungeonGenerator.normalizeConfig({ ...DungeonProfiles.standard, scale });
    assert.equal(config.scale, scale);
    assert.equal(config.width, width);
    assert.equal(config.height, height);
    assert.ok(config.validation.maxRooms > previousRoomMaximum);
    previousRoomMaximum = config.validation.maxRooms;

    for (let seed = 1; seed <= 10; seed += 1) {
      const result = generator.generate({ ...DungeonProfiles.standard, scale }, { seed, maxAttempts: 200 });
      assert.equal(result.ok, true, `scale ${scale}, seed ${seed} should produce a valid dungeon`);
      assert.equal(result.config.scale, scale);
      assert.equal(result.width, width);
      assert.equal(result.wallSpacing.baseHeight, height);
      assert.equal(result.height, height + result.wallSpacing.addedRows);
    }
  });
}

function testDangerLevels() {
  const lowConfig = DungeonGenerator.normalizeConfig({ ...DungeonProfiles.standard, danger: 1 });
  const standardConfig = DungeonGenerator.normalizeConfig(DungeonProfiles.standard);
  const highConfig = DungeonGenerator.normalizeConfig({ ...DungeonProfiles.standard, danger: 10 });
  assert.equal(standardConfig.danger, 3);
  assert.deepEqual(standardConfig.placements.enemyCount, [4, 8]);
  assert.ok(highConfig.placements.enemyCount[0] > lowConfig.placements.enemyCount[1]);
  assert.ok(trapOutcomeRate(highConfig) > trapOutcomeRate(standardConfig));
  assert.ok(trapOutcomeRate(standardConfig) > trapOutcomeRate(lowConfig));

  let previousEnemyMinimum = -1;
  let previousTrapRate = -1;
  for (let danger = 1; danger <= 10; danger += 1) {
    const config = DungeonGenerator.normalizeConfig({ ...DungeonProfiles.standard, danger });
    assert.equal(config.danger, danger);
    assert.ok(config.placements.enemyCount[0] >= previousEnemyMinimum);
    assert.ok(trapOutcomeRate(config) > previousTrapRate);
    previousEnemyMinimum = config.placements.enemyCount[0];
    previousTrapRate = trapOutcomeRate(config);
  }

  const totals = {
    low: { branches: 0, traps: 0, enemies: 0 },
    high: { branches: 0, traps: 0, enemies: 0 },
  };
  for (let seed = 1; seed <= 300; seed += 1) {
    collectDangerMetrics(generator.generate({ ...DungeonProfiles.standard, danger: 1 }, { seed }), totals.low);
    collectDangerMetrics(generator.generate({ ...DungeonProfiles.standard, danger: 10 }, { seed }), totals.high);
  }
  assert.ok(totals.high.enemies > totals.low.enemies, "higher danger should place more enemies");
  assert.ok(
    totals.high.traps / totals.high.branches > totals.low.traps / totals.low.branches,
    "higher danger should produce more trap-bearing branches"
  );
}

function trapOutcomeRate(config) {
  return config.branchContents.outcomes.trap + config.branchContents.outcomes.both;
}

function testDangerTreasureRates() {
  const trapFactors = [0, 0.45, 0.75, 1, 1.5, 2, 2.6, 3.3, 4.1, 5, 6];
  let previousTreasureRate = 0;
  for (let danger = 1; danger <= 10; danger += 1) {
    const config = DungeonGenerator.normalizeConfig({ ...DungeonProfiles.standard, danger });
    const outcomes = config.branchContents.outcomes;
    const treasureRate = outcomes.treasure + outcomes.both;
    const expectedTreasure = 0.2 + 0.5 * (danger - 1) / 9;
    assert.ok(Math.abs(treasureRate - expectedTreasure) < 1e-12, `danger ${danger} must use the intended additional chest rate`);
    assert.ok(treasureRate > previousTreasureRate);
    previousTreasureRate = treasureRate;
    const expectedTrap = 0.38 * trapFactors[danger] / (0.62 + 0.38 * trapFactors[danger]);
    assert.ok(Math.abs(trapOutcomeRate(config) - expectedTrap) < 1e-12, "the additional chest rate must not alter existing trap odds");
    assert.ok(Math.abs(Object.values(outcomes).reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
    assert.ok(Object.values(outcomes).every((value) => value >= 0 && value <= 1));
    assert.deepEqual(config.roomRoles.treasureCount, [1, 1], "danger must not change the guaranteed chest count");
  }
  for (const outcomes of [
    { empty: 0.5, trap: 0.5, treasure: 0, both: 0 },
    { empty: 0, trap: 0, treasure: 0.8, both: 0.2 },
    { empty: 0.5, trap: 0, treasure: 0.5, both: 0 },
    { empty: 0, trap: 0.5, treasure: 0, both: 0.5 },
    { empty: 0.005, trap: 0.005, treasure: 0.495, both: 0.495 },
  ]) {
    for (const danger of [1, 3, 10]) {
      const config = DungeonGenerator.normalizeConfig({ ...DungeonProfiles.standard, danger, branchContents: { ...DungeonProfiles.standard.branchContents, outcomes } });
      const adjusted = config.branchContents.outcomes;
      assert.ok(Object.values(adjusted).every((value) => value >= 0 && value <= 1));
      assert.ok(Math.abs(Object.values(adjusted).reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
      Object.keys(outcomes).filter((key) => outcomes[key] === 0).forEach((key) => assert.equal(adjusted[key], 0, "explicitly disabled outcomes must stay disabled"));
    }
  }
}

function testGuaranteedTreasure() {
  const legacy = { ...DungeonProfiles.standard, roomRoles: { ...DungeonProfiles.standard.roomRoles, treasureCount: [0, 0] } };
  const guaranteedLocations = new Set();
  const guaranteedRooms = new Set();
  assert.deepEqual(DungeonGenerator.normalizeConfig(legacy).roomRoles.treasureCount, [1, 1], "old profiles must inherit the minimum chest guarantee without rewriting saved data");
  for (let danger = 1; danger <= 10; danger += 1) {
    for (const scale of [1, 3, 10]) {
      for (let seed = 1; seed <= 10; seed += 1) {
        const result = generator.generate({ ...legacy, scale, danger }, { seed: `guaranteed-${seed}`, maxAttempts: 200 });
        assert.equal(result.ok, true);
        const guaranteed = result.placements.treasure.filter((item) => item.guaranteed);
        const additional = result.placements.treasure.filter((item) => !item.guaranteed);
        assert.equal(guaranteed.length, 1);
        guaranteedLocations.add(`${guaranteed[0].x},${guaranteed[0].y}`);
        guaranteedRooms.add(guaranteed[0].roomId);
        assert.equal(result.metrics.guaranteedTreasureCount, 1);
        assert.equal(result.metrics.additionalTreasureCount, additional.length);
        assert.equal(additional.length, result.metrics.branchContentCounts.treasure + result.metrics.branchContentCounts.both, "the branch roll only supplies additional chests");
        assert.ok(guaranteed.every((item) => !item.branchId && item.approach), "the guaranteed chest must not depend on a successful branch roll");
        assert.ok(additional.every((item) => item.branchId && item.approach));
      }
    }
  }
  assert.ok(guaranteedLocations.size > 10, "only the chest count is guaranteed; its position must vary with the seed");
  assert.ok(guaranteedRooms.size > 1, "the guaranteed chest must not be tied to a fixed room");
  const withoutBranchRolls = generator.generate({ ...legacy, branchContents: { ...legacy.branchContents, enabled: false } }, { seed: "guarantee-no-rolls", maxAttempts: 200 });
  assert.equal(withoutBranchRolls.ok, true);
  assert.equal(withoutBranchRolls.placements.treasure.length, 1);
  assert.equal(withoutBranchRolls.placements.treasure[0].guaranteed, true);
  assert.deepEqual(legacy.roomRoles.treasureCount, [0, 0], "normalization must not mutate the original saved profile");
}

function collectDangerMetrics(result, totals) {
  assert.equal(result.ok, true);
  const counts = result.metrics.branchContentCounts;
  totals.branches += counts.empty + counts.trap + counts.treasure + counts.both;
  totals.traps += counts.trap + counts.both;
  totals.enemies += result.metrics.placementCounts.enemies;
}

function assertEntranceApproach(result) {
  const approach = result.entranceApproach;
  assert.ok(approach, "an entrance corridor must be generated");
  assert.deepEqual(result.entrance, approach.start);
  assert.equal(result.metrics.entranceApproachLength, approach.length);
  assert.ok((approach.baseLength ?? approach.length) >= result.config.entranceApproach.minLength);
  assert.ok((approach.baseLength ?? approach.length) <= result.config.entranceApproach.maxLength);
  assert.equal(approach.length, approach.path.length - 1);
  assert.ok(approach.turns <= result.config.entranceApproach.maxTurns);
  assert.ok(result.config.entranceApproach.startDirections.includes(approach.startDirection));
  const onMapEdge = approach.start.x === 0
    || approach.start.y === 0
    || approach.start.x === result.width - 1
    || approach.start.y === result.height - 1;
  assert.equal(onMapEdge, true, "the entrance must be on a map edge");
  approach.path.forEach((cell, index) => {
    assert.notEqual(DungeonGenerator.getCell(result, cell.x, cell.y), DungeonGenerator.CELL_TYPES.WALL);
    if (index === 0) return;
    const previous = approach.path[index - 1];
    assert.equal(Math.abs(cell.x - previous.x) + Math.abs(cell.y - previous.y), 1);
  });
}

function assertExitApproach(result) {
  const approach = result.exitApproach;
  assert.ok(approach, "an exit corridor must be generated");
  assert.deepEqual(result.exit, approach.end);
  assert.equal(result.metrics.exitApproachLength, approach.length);
  assert.ok((approach.baseLength ?? approach.length) >= result.config.exitApproach.minLength);
  assert.ok((approach.baseLength ?? approach.length) <= result.config.exitApproach.maxLength);
  assert.equal(approach.length, approach.path.length - 1);
  assert.ok(approach.turns <= result.config.exitApproach.maxTurns);
  assert.ok(result.config.exitApproach.endDirections.includes(approach.endDirection));
  const onMapEdge = approach.end.x === 0
    || approach.end.y === 0
    || approach.end.x === result.width - 1
    || approach.end.y === result.height - 1;
  assert.equal(onMapEdge, true, "the exit must be on a map edge");
  const exitInsideRoom = result.rooms.some((room) => {
    return result.exit.x >= room.left && result.exit.x <= room.right
      && result.exit.y >= room.top && result.exit.y <= room.bottom;
  });
  assert.equal(exitInsideRoom, false, "the goal must be on the exit corridor, not inside a room");
  approach.path.forEach((cell, index) => {
    assert.notEqual(DungeonGenerator.getCell(result, cell.x, cell.y), DungeonGenerator.CELL_TYPES.WALL);
    if (index === 0) return;
    const previous = approach.path[index - 1];
    assert.equal(Math.abs(cell.x - previous.x) + Math.abs(cell.y - previous.y), 1);
  });
}

function testFixedStartDirection() {
  const profile = {
    ...DungeonProfiles.standard,
    entranceApproach: {
      ...DungeonProfiles.standard.entranceApproach,
      startDirections: ["down"],
    },
  };
  for (let seed = 1; seed <= 30; seed += 1) {
    const result = generator.generate(profile, { seed });
    assert.equal(result.entranceApproach.startDirection, "down");
    assert.equal(result.entrance.y, 0);
    assert.equal(result.entranceApproach.path[1].y, 1);
  }
}

function testFixedExitDirection() {
  const profile = {
    ...DungeonProfiles.standard,
    exitApproach: {
      ...DungeonProfiles.standard.exitApproach,
      endDirections: ["right"],
    },
  };
  for (let seed = 1; seed <= 30; seed += 1) {
    const result = generator.generate(profile, { seed });
    assert.equal(result.exitApproach.endDirection, "right");
    assert.equal(result.exit.x, result.width - 1);
    const path = result.exitApproach.path;
    assert.equal(path[path.length - 2].x, result.width - 2);
  }
}

function testEditorContentConfiguration() {
  const profile = {
    ...DungeonProfiles.standard,
    tiles: { floorTileId: "sample_floor", wallTileId: "sample_wall" },
    roomRoles: {
      ...DungeonProfiles.standard.roomRoles,
      treasureCount: [1, 1],
    },
    treasureTable: {
      rolls: [2, 2],
      entries: [
        { type: "item", id: "sample_item", name: "Sample Item", weight: 1, minCount: 2, maxCount: 3 },
      ],
    },
    enemyPool: [
      { id: "sample_enemy", name: "Sample Enemy", weight: 1 },
    ],
  };
  const result = generator.generate(profile, { seed: "editor-content", maxAttempts: 200 });
  assert.equal(result.ok, true);
  assert.equal(result.config.tiles.floorTileId, "sample_floor");
  assert.equal(result.config.tiles.wallTileId, "sample_wall");
  assert.ok(result.placements.treasure.length >= 1);
  result.placements.treasure.forEach((treasure) => {
    assert.equal(treasure.contents.length, 1);
    assert.equal(treasure.contents[0].id, "sample_item");
    assert.ok(treasure.contents[0].count >= 4 && treasure.contents[0].count <= 6);
  });
  assert.ok(result.placements.enemies.length >= 1);
  result.placements.enemies.forEach((enemy) => {
    assert.equal(enemy.enemyId, "sample_enemy");
    assert.equal(enemy.enemyName, "Sample Enemy");
  });
}

function testBranchContentDistribution() {
  const counts = { empty: 0, trap: 0, treasure: 0, both: 0 };
  let total = 0;
  let cornerTreasureCount = 0;
  let treasureCount = 0;
  for (let seed = 1; seed <= 1200; seed += 1) {
    const result = generator.generate(DungeonProfiles.standard, { seed });
    result.placements.branchContents.forEach((content) => {
      counts[content.outcome] += 1;
      total += 1;
      assert.equal(content.complete, true);
      if (content.trapId) {
        const trap = result.placements.traps.find((item) => item.id === content.trapId);
        const route = result.branchRoutes.find((item) => item.id === content.branchId);
        assert.ok(trap && route);
        assert.ok(route.path.some((cell) => cell.x === trap.x && cell.y === trap.y));
      }
    });
    result.placements.treasure.forEach((treasure) => {
      const room = result.rooms.find((candidate) => candidate.id === treasure.roomId);
      const distanceToCorner = (cell) => Math.min(
        Math.abs(cell.x - room.left) + Math.abs(cell.y - room.top),
        Math.abs(cell.x - room.right) + Math.abs(cell.y - room.top),
        Math.abs(cell.x - room.left) + Math.abs(cell.y - room.bottom),
        Math.abs(cell.x - room.right) + Math.abs(cell.y - room.bottom)
      );
      const cornerDistance = distanceToCorner(treasure);
      const nearestFloorDistance = Math.min(...room.floorCells.map(distanceToCorner));
      treasureCount += 1;
      if (cornerDistance <= nearestFloorDistance + 1) cornerTreasureCount += 1;
    });
  }
  const expected = DungeonGenerator.normalizeConfig(DungeonProfiles.standard).branchContents.outcomes;
  Object.keys(expected).forEach((outcome) => {
    assert.ok(Math.abs(counts[outcome] / total - expected[outcome]) < 0.05, `${outcome} probability drifted`);
  });
  assert.ok(cornerTreasureCount / treasureCount > 0.8, "treasure should favor room corners");
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
