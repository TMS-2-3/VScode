import assert from "node:assert/strict";
import { createObstacleManager, getObstacleBounds } from "../src/lane/obstacles.js";
import { createLaneManager } from "../src/lane/lane-manager.js";
import { OBSTACLE_TYPE } from "../src/shared/contracts.js";
import {
  chooseObstacleAppearance,
  normalizeObstacleAppearance,
  OBSTACLE_APPEARANCE as A,
  OBSTACLE_APPEARANCES,
} from "../src/shared/obstacle-appearances.js";
import { getObstacleArtworkLayout } from "../src/visual/obstacle-art.js";

const expectedGeometry = {
  [OBSTACLE_TYPE.JUMP]: { count: 8, width: 0.24 * 0.86, height: 0.3, offset: 0 },
  [OBSTACLE_TYPE.DUCK]: { count: 7, width: 0.44 * 0.86, height: 0.75, offset: 0.25 },
  [OBSTACLE_TYPE.LANE_BLOCKER]: { count: 10, width: 0.36 * 0.86, height: 0.85, offset: 0 },
};
const lanes = createLaneManager();
lanes.resize(1280, 720);
let randomValue = 0;
let drawCount = 0;
const manager = createObstacleManager({ random: () => { drawCount += 1; return randomValue; } });
const appearanceIds = new Set();
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10);

for (const [type, expected] of Object.entries(expectedGeometry)) {
  const pool = OBSTACLE_APPEARANCES[type];
  assert.equal(pool.length, expected.count);

  for (const [index, appearance] of pool.entries()) {
    randomValue = (index + 0.5) / pool.length;
    assert.equal(chooseObstacleAppearance(type, () => randomValue), appearance);
    const id = manager.addObstacle({ type, x: 500, lane: 1 });
    const obstacle = manager.getSnapshot().find((item) => item.id === id);
    assert.equal(obstacle.appearance, appearance);
    appearanceIds.add(appearance);
    const bounds = getObstacleBounds(obstacle, lanes);
    close(bounds.width, lanes.getLaneGap() * expected.width);
    close(bounds.height, lanes.getLaneGap() * expected.height);
    close(bounds.bottom, lanes.getLaneY(1) - lanes.getLaneGap() * expected.offset);
    const layout = getObstacleArtworkLayout(type, appearance);
    assert.ok(layout.width > 0 && layout.height > 0 && layout.widthScale >= 1);
  }

  for (const value of [NaN, Infinity, -1, 0]) {
    assert.equal(chooseObstacleAppearance(type, () => value), pool[0]);
  }
  assert.equal(chooseObstacleAppearance(type, () => 1), pool.at(-1));
  assert.equal(normalizeObstacleAppearance(type, "unknown"), pool[0]);
  const otherType = Object.keys(expectedGeometry).find((other) => other !== type);
  assert.equal(normalizeObstacleAppearance(type, OBSTACLE_APPEARANCES[otherType][0]), pool[0]);
}

assert.equal(appearanceIds.size, 23);
assert.equal(drawCount, 25);
const before = manager.getSnapshot();
manager.moveObstacles(-37);
const after = manager.getSnapshot();
for (let index = 0; index < before.length; index += 1) {
  assert.equal(after[index].appearance, before[index].appearance);
  assert.equal(after[index].x, before[index].x - 37);
}
before[0].appearance = "changed";
assert.notEqual(manager.getSnapshot()[0].appearance, "changed");
manager.addObstacle({ type: OBSTACLE_TYPE.JUMP, x: 900, lane: 0, appearance: "gravestone" });
assert.equal(drawCount, 25);
assert.equal(manager.getSnapshot().at(-1).appearance, "gravestone");
assert.throws(() => manager.addObstacle({ type: "bad", x: 1, lane: 1 }), /Unknown obstacle/);
manager.reset();
assert.equal(manager.getSnapshot().length, 0);

for (let lane = 0; lane < 3; lane += 1) {
  const pool = lane === 0
    ? [A.FLOATING_GHOST, A.WEB_SPIDER, A.FLYING_WITCH, A.SAW_BLADE, A.FLYING_BAT]
    : OBSTACLE_APPEARANCES[OBSTACLE_TYPE.DUCK];

  for (const [index, appearance] of pool.entries()) {
    const random = () => (index + 0.5) / pool.length;
    assert.equal(chooseObstacleAppearance(OBSTACLE_TYPE.DUCK, random, lane), appearance);
    const laneManager = createObstacleManager({ random });
    laneManager.addObstacle({ type: OBSTACLE_TYPE.DUCK, x: 500, lane });
    const obstacle = laneManager.getSnapshot()[0];
    assert.equal(obstacle.appearance, appearance);
    close(getObstacleBounds(obstacle, lanes).height, lanes.getLaneGap() * 0.75);
    laneManager.moveObstacles(-50);
    assert.equal(laneManager.getSnapshot()[0].appearance, appearance);
  }

  for (const appearance of [A.SPIKED_BALL, A.HANGING_BAT]) {
    const expected = lane === 0 ? A.FLOATING_GHOST : appearance;
    assert.equal(normalizeObstacleAppearance(OBSTACLE_TYPE.DUCK, appearance, lane), expected);
    const laneManager = createObstacleManager();
    laneManager.addObstacle({ type: OBSTACLE_TYPE.DUCK, x: 500, lane, appearance });
    assert.equal(laneManager.getSnapshot()[0].appearance, expected);
  }

  for (const value of [NaN, Infinity, -1, 0, 1]) {
    assert.equal(
      chooseObstacleAppearance(OBSTACLE_TYPE.DUCK, () => value, lane),
      value === 1 ? pool.at(-1) : pool[0],
    );
  }

  for (const type of [OBSTACLE_TYPE.JUMP, OBSTACLE_TYPE.LANE_BLOCKER]) {
    assert.equal(chooseObstacleAppearance(type, () => 1, lane), OBSTACLE_APPEARANCES[type].at(-1));
  }
}
for (const [type, count] of [
  [OBSTACLE_TYPE.JUMP, 1],
  [OBSTACLE_TYPE.DUCK, 2],
  [OBSTACLE_TYPE.LANE_BLOCKER, 3],
]) {
  assert.equal(normalizeObstacleAppearance(type, A.SAW_BLADE), A.SAW_BLADE);
  const layout = getObstacleArtworkLayout(type, A.SAW_BLADE);
  assert.equal(layout.blades.length, count);
  let previousBottom = 0;

  for (const blade of layout.blades) {
    assert.ok(blade.diameter > 0);
    assert.ok(blade.x - blade.diameter / 2 >= 0);
    assert.ok(blade.x + blade.diameter / 2 <= layout.width);
    assert.ok(blade.y - blade.diameter / 2 >= previousBottom);
    previousBottom = blade.y + blade.diameter / 2;
    assert.ok(previousBottom <= layout.height);
  }
}
const flyingBatLayout = getObstacleArtworkLayout(OBSTACLE_TYPE.DUCK, A.FLYING_BAT);
assert.equal(flyingBatLayout.frames, 8);
assert.ok(flyingBatLayout.frameDuration > 0);
for (let lane = 0; lane < 3; lane += 1) {
  assert.equal(normalizeObstacleAppearance(OBSTACLE_TYPE.DUCK, A.FLYING_BAT, lane), A.FLYING_BAT);
}
console.log("All 25 obstacle variants keep their collision sizes and stable appearances.");
console.log("Flying bats are allowed on every lane; top-lane hanging bats and spiked balls stay excluded.");
console.log("Saw blades use one low disk, two elevated disks or three full-lane disks.");
