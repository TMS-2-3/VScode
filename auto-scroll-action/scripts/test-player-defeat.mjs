import assert from "node:assert/strict";
import { createGameController, DEBUG_SETTINGS } from "../src/core/game-controller.js";
import { RUN_STATE } from "../src/shared/contracts.js";
import {
  getPlayerDefeatMotion,
  PLAYER_DEFEAT_DURATION_SECONDS,
} from "../src/visual/player-defeat.js";

const game = createGameController();
assert.equal(game.tryDefeatFromObstacle(true), false);
assert.equal(game.finishGameOver(), false);
game.startRun();
assert.equal(game.tryDefeatFromObstacle(false), false);
const originalDebugSetting = DEBUG_SETTINGS.gameOverOnObstacleCollision;

try {
  DEBUG_SETTINGS.gameOverOnObstacleCollision = false;
  assert.equal(game.tryDefeatFromObstacle(true), false);
  assert.equal(game.isPlaying(), true);
  DEBUG_SETTINGS.gameOverOnObstacleCollision = true;
  assert.equal(game.tryDefeatFromObstacle(true), true);
  assert.equal(game.isDefeated(), true);
  assert.equal(game.isPlaying(), false);
  assert.equal(game.pauseForSupply(), false);
  assert.equal(game.tryDefeatFromObstacle(true), false);
  assert.equal(game.finishGameOver(), true);
  assert.equal(game.getState(), RUN_STATE.GAME_OVER);
  assert.equal(game.finishGameOver(), false);
  game.returnToReady();
  game.startRun();
  assert.equal(game.isPlaying(), true);
  assert.equal(game.isDefeated(), false);
  assert.equal(game.pauseForSupply(), true);
  assert.equal(game.tryDefeatFromObstacle(true), false);
  assert.equal(game.resumeFromSupply(), true);
} finally {
  DEBUG_SETTINGS.gameOverOnObstacleCollision = originalDebugSetting;
}

assert.equal(getPlayerDefeatMotion(0).phase, "knockback");
assert.equal(getPlayerDefeatMotion(0.6).phase, "roll");
assert.equal(getPlayerDefeatMotion(1.2).phase, "dizzy");
assert.equal(PLAYER_DEFEAT_DURATION_SECONDS, 3.2);
assert.equal(getPlayerDefeatMotion(3.1).phase, "dizzy");
let previousBackwardProgress = 0;

for (let time = 0; time <= PLAYER_DEFEAT_DURATION_SECONDS + 0.1; time += 1 / 120) {
  const motion = getPlayerDefeatMotion(time);
  assert.ok(motion.backwardProgress >= previousBackwardProgress);
  assert.ok(motion.backwardProgress <= 1);
  assert.ok(motion.landingProgress >= 0 && motion.landingProgress <= 1);
  assert.ok(motion.liftRatio >= 0);
  assert.ok(Number.isFinite(motion.rotation));
  previousBackwardProgress = motion.backwardProgress;
}

for (const boundary of [0.42, 1.04]) {
  const before = getPlayerDefeatMotion(boundary - 0.000001);
  const after = getPlayerDefeatMotion(boundary);
  for (const key of ["backwardProgress", "landingProgress", "liftRatio", "rotation"]) {
    assert.ok(Math.abs(before[key] - after[key]) < 0.0001, `${key} jumps at ${boundary}`);
  }
}

assert.deepEqual(getPlayerDefeatMotion(-1), getPlayerDefeatMotion(0));
assert.deepEqual(getPlayerDefeatMotion(NaN), getPlayerDefeatMotion(0));
assert.deepEqual(
  getPlayerDefeatMotion(100),
  getPlayerDefeatMotion(PLAYER_DEFEAT_DURATION_SECONDS),
);
console.log("Player defeat state and animation tests passed.");
