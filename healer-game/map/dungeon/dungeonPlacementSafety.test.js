"use strict";

const assert = require("node:assert/strict");
const safety = require("./dungeonPlacementSafety.js");
const profiles = require("./dungeonProfiles.js");
const generator = require("./dungeonGenerator.js").create(require("../../rot.js-master/dist/rot.js"));

testNarrowPassageAndDeadEnd();
testCombinedBlockers();
testInteractionAccess();
testFootprints();
testGeneratedPlacementAccess();
console.log("dungeonPlacementSafety tests passed");

function map(rows, entrance, exit) {
  return { width: rows[0].length, height: rows.length, cells: rows.flatMap((row) => Array.from(row, (char) => char === "#" ? 1 : 0)), entrance, exit };
}

function testNarrowPassageAndDeadEnd() {
  const dungeon = map(["....."], { x: 0, y: 0 }, { x: 4, y: 0 });
  const before = dungeon.cells.slice();
  const blocked = safety.inspect(dungeon, [{ id: "chest", type: "treasure", x: 2, y: 0 }]);
  assert.equal(blocked.valid, false);
  assert.equal(blocked.unreachableCount, 2);
  assert.ok(blocked.errors.some((error) => error.includes("exit")));
  assert.deepEqual(dungeon.cells, before, "inspection must never turn terrain cells into walls");
  const deadEnd = safety.inspect({ ...dungeon, exit: { x: 1, y: 0 } }, [{ id: "chest", x: 4, y: 0 }]);
  assert.equal(deadEnd.valid, true, "a chest at the very end is safe when all remaining floors and the exit stay accessible");
  assert.deepEqual(deadEnd.approaches, [{ x: 3, y: 0 }]);
  assert.equal(safety.inspect(dungeon, [{ x: 0, y: 0 }]).valid, false, "objects cannot occupy the entrance");
}

function testCombinedBlockers() {
  const dungeon = map(["...", ".#.", "..."], { x: 0, y: 1 }, { x: 2, y: 1 });
  const top = { id: "top", x: 1, y: 0 };
  const bottom = { id: "bottom", x: 1, y: 2 };
  assert.equal(safety.inspect(dungeon, [top]).valid, true);
  assert.equal(safety.inspect(dungeon, [bottom]).valid, true);
  assert.equal(safety.inspect(dungeon, [top, bottom]).valid, false, "checking each chest in isolation misses paths blocked by two chests together");
}

function testInteractionAccess() {
  const dungeon = map(Array(5).fill("....."), { x: 0, y: 0 }, { x: 4, y: 4 });
  const chest = { id: "center", x: 2, y: 2 };
  const neighbors = [{ x: 2, y: 1 }, { x: 2, y: 3 }, { x: 1, y: 2 }, { x: 3, y: 2 }];
  const blocked = safety.inspect(dungeon, [chest, ...neighbors]);
  assert.equal(blocked.unreachableCount, 0);
  assert.equal(blocked.valid, false, "connected floors alone are not enough when no adjacent tile can reach the chest");
  assert.ok(blocked.errors.some((error) => error.includes("center")));
  assert.equal(safety.inspect(dungeon, [chest, ...neighbors.slice(1)]).valid, true);
}

function testFootprints() {
  const dungeon = map(Array(5).fill("......."), { x: 0, y: 2 }, { x: 6, y: 2 });
  assert.equal(safety.inspect(dungeon, [{ id: "large-event", x: 3, y: 0, width: 1, height: 5 }]).valid, false);
  assert.equal(safety.inspect(dungeon, [{ x: 2, y: 1, width: 2, height: 2 }, { x: 4, y: 1 }]).valid, true);
  assert.equal(safety.inspect(dungeon, [{ x: 2, y: 1, width: 2, height: 2 }, { x: 3, y: 2 }]).valid, false);
  for (const item of [{ x: 2, y: 1, width: Infinity }, { x: 2, y: 1, height: -1 }, { x: 2.5, y: 1 }, { x: 6, y: 1, width: 2 }]) {
    assert.equal(safety.inspect(dungeon, [item]).valid, false);
  }
  assert.equal(safety.inspect({ ...dungeon, entrance: null }, []).valid, false);
}

function testGeneratedPlacementAccess() {
  // Standard seed 1 formerly placed a chest that isolated 15 floor cells.
  assertGeneratedAccess(generator.generate(profiles.standard, { seed: 1, maxAttempts: 100 }));
  for (const scale of [1, 3, 10]) {
    for (const wallHeight of [0, 1, 3]) {
      for (const danger of [1, 10]) {
        for (let seed = 1; seed <= 12; seed += 1) {
          const result = generator.generate({ ...profiles.standard, scale, danger, tiles: { wallHeight } }, { seed, maxAttempts: 200 });
          assertGeneratedAccess(result);
        }
      }
    }
  }
  let chestsAlongsideEvents = 0;
  for (let seed = 1; seed <= 20; seed += 1) {
    const result = generator.generate({
      ...profiles.standard,
      mandatoryEvents: [{ id: "monument", type: "event", required: true, footprint: { width: 2, height: 2 }, minEntranceDistance: 0 }],
    }, { seed, maxAttempts: 200 });
    assertGeneratedAccess(result);
    assert.equal(result.placements.mandatoryEvents.length, 1);
    chestsAlongsideEvents += result.placements.treasure.length;
  }
  assert.ok(chestsAlongsideEvents > 0, "the event fixtures must also exercise randomly placed chests");
}

function assertGeneratedAccess(result) {
  assert.equal(result.ok, true);
  const access = safety.inspect(result);
  assert.equal(access.valid, true, access.errors.join(" "));
  assert.deepEqual(result.navigationCells, access.navigationCells);
  const blockers = safety.objects(result.placements);
  blockers.forEach((item, index) => {
    assert.equal(item.blocking, true);
    assert.deepEqual(item.approach, access.approaches[index]);
    assert.notEqual(result.navigationCells[item.approach.y * result.width + item.approach.x], 1);
    assert.equal(result.navigationCells[item.y * result.width + item.x], 1);
    assert.notEqual(result.cells[item.y * result.width + item.x], 1);
  });
  result.mainPath.forEach((cell, index) => {
    assert.notEqual(result.navigationCells[cell.y * result.width + cell.x], 1, "the displayed route must avoid chests and solid events");
    if (index) assert.equal(Math.abs(cell.x - result.mainPath[index - 1].x) + Math.abs(cell.y - result.mainPath[index - 1].y), 1);
  });
  assert.deepEqual(result.mainPath[0], result.entrance);
  assert.deepEqual(result.mainPath.at(-1), result.exit);
}
