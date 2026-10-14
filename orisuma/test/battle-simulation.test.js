import assert from "node:assert/strict";
import test from "node:test";
import { BattleSimulation, normalizeBattleInput } from "../js/battle-simulation.js";
import {
  BODY_COLLISION,
  DEFAULT_RULES,
  DODGE,
  FINAL_SMASH,
  JAB_COMBO,
  LANDING,
  LEDGE,
  KNOCKDOWN,
  MAIN_PLATFORM_DEPTH,
  MOVEMENT,
  NOVA_AIR_DOWN_FLAME,
  NOVA_BODY_SIZE,
  NOVA_DOWN_SMASH_EXPLOSION,
  NOVA_MOVE_MOTION,
  NOVA_RECOVERY,
  SHORT_HOP,
  SMASH_CHARGE,
  STAGE_BLAST_ZONE,
  STAGES,
  TECH,
  TIME_LIMIT,
  applyHitlagSdi,
  calculateLaunch,
  fighterHurtboxes,
  fighterRect,
  getActiveMoveHits,
  getHitbox,
  getKnockdownBodyPose,
  hitboxesOverlap,
  getMainPlatformTriangle,
  getMove,
  getNovaBackAirFlame,
  getNovaBackAirMotion,
  getNovaBackAirPoseProgress,
  getNovaDownAirFlame,
  getNovaDownSmashMotion,
  getNovaDownSmashPoseProgress,
  getNovaDownTiltMotion,
  getNovaForwardAirMotion,
  getNovaSideSmashMotion,
  getNovaSideTiltMotion,
  getNovaUpAirJet,
  getNovaUpAirMotion,
  getNovaUpAirPoseProgress,
  getNovaUpSmashMotion,
  getNovaUpSmashPoseProgress,
  getNovaUpTiltMotion,
  hitboxOverlapsFighter,
  isNovaUpAirHeadIntangible,
  noteDefenseInput,
  normalizeTimeLimit,
  resolveFighterBodyCollision,
  resolveImpactAfterCollision,
  resolveStageCollision,
  selectMoveFromInput,
  startDodge,
  startKnockdown,
  tryGrabLedge,
  updateCoreTimers,
  updateDodge,
  updateLedgeHang
} from "../js/battle-data.js";
import { CanvasRenderer } from "../js/canvas-renderer.js";
import { AssetManager, FIGHTER_POSE_FRAMES } from "../js/asset-manager.js";
import { PRACTICE_GAME_SPEEDS, PracticeMode, normalizePracticeGameSpeed } from "../js/practice-mode.js";
import { RollbackManager } from "../js/rollback-manager.js";
import { bindingLabel } from "../js/utils.js";

function createBattle({ mode = "stock", finalSmash = false } = {}) {
  const simulation = new BattleSimulation();
  const rules = {
    ...DEFAULT_RULES,
    mode,
    finalSmash,
    stocks: 2,
    hp: 100,
    gameSpeed: 1,
    stage: "final"
  };
  const match = simulation.createMatch({ id: "test-match", rules });
  const first = simulation.createFighter({
    id: "p1",
    name: "P1",
    characterId: "nova",
    slot: 1,
    spawn: [500, 464],
    facing: 1,
    rules,
    spawnOnGround: true
  });
  const second = simulation.createFighter({
    id: "p2",
    name: "P2",
    characterId: "nova",
    slot: 2,
    spawn: [555, 464],
    facing: -1,
    rules,
    spawnOnGround: true
  });
  match.fighters.set(first.id, first);
  match.fighters.set(second.id, second);
  return { simulation, match, first, second };
}

function inputs(first = {}, second = {}) {
  return new Map([
    ["p1", normalizeBattleInput(first)],
    ["p2", normalizeBattleInput(second)]
  ]);
}

function stepFrames(simulation, match, count, frameInputs = inputs()) {
  for (let frame = 0; frame < count; frame += 1) simulation.step(match, frameInputs, 1 / 60);
}

test("time limits use ten-second steps and support infinity", () => {
  assert.equal(normalizeTimeLimit(0), TIME_LIMIT.infinite);
  assert.equal(normalizeTimeLimit(64), 60);
  assert.equal(normalizeTimeLimit(66), 70);
  assert.equal(normalizeTimeLimit(901), TIME_LIMIT.max);
});

test("finite timers count down and finish every versus rule mode", () => {
  for (const mode of ["stock", "time", "hp"]) {
    const { simulation, match } = createBattle({ mode });
    match.rules.timeLimit = 100;
    match.elapsed = 25.25;
    assert.equal(simulation.snapshot(match).remainingTime, 74.75);
    assert.equal(simulation.shouldFinish(match), false);
    match.elapsed = 100;
    assert.equal(simulation.snapshot(match).remainingTime, 0);
    assert.equal(simulation.shouldFinish(match), true);
  }
});

test("an infinite time rule never ends a time battle by the clock", () => {
  const { simulation, match } = createBattle({ mode: "time" });
  match.rules.timeLimit = TIME_LIMIT.infinite;
  match.elapsed = 3600;
  assert.equal(simulation.snapshot(match).remainingTime, null);
  assert.equal(simulation.shouldFinish(match), false);
});

test("Nova's complete move damage table matches the character specification", () => {
  const hitDamage = moveId => getMove("nova", moveId).hits.map(hit => hit.damage);
  assert.deepEqual(hitDamage("jab1"), [3]);
  assert.deepEqual(hitDamage("jab2"), [4]);
  assert.deepEqual(hitDamage("jab3"), [5]);
  assert.deepEqual(hitDamage("dashAttack"), [10.2]);
  assert.deepEqual(hitDamage("side"), [10]);
  assert.deepEqual(hitDamage("up"), [5, 8]);
  assert.deepEqual(hitDamage("down"), [8]);
  assert.deepEqual(hitDamage("airNeutral"), [7]);
  assert.deepEqual(hitDamage("airForward"), [4]);
  assert.deepEqual(hitDamage("airBack"), [2, 2, 2, 14]);
  assert.deepEqual(hitDamage("airUp"), [4, 12]);
  assert.deepEqual(hitDamage("airDown"), [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5]);
  assert.deepEqual(hitDamage("smashSide"), [18]);
  assert.deepEqual(hitDamage("smashUp"), [25]);
  assert.deepEqual(hitDamage("smashDown"), [16]);
  assert.equal(getMove("nova", "specialNeutral").projectile.damage, 7.2);
  assert.equal(getMove("nova", "specialSide").projectile.damage, 15);
  assert.equal(getMove("nova", "pummel").damage, 1.6);
  assert.deepEqual(hitDamage("throwForward"), [7]);
  assert.deepEqual(hitDamage("throwBack"), [2, 10.5]);
  assert.deepEqual(hitDamage("throwUp"), [7.5]);
  assert.deepEqual(hitDamage("throwDown"), [2, 2, 2, 4]);
  assert.deepEqual(hitDamage("getupAttack"), [6, 6]);
  assert.equal(getMove("nova", "finalPunch").damage, 32.5);
});

test("Nova's three jab totals are 115 percent of their previous durations", () => {
  assert.equal(getMove("nova", "jab1").total, 0.253);
  assert.equal(getMove("nova", "jab2").total, 0.276);
  assert.equal(getMove("nova", "jab3").total, 0.437);
  assert.equal(getMove("nova", "jab1").chainClose, 0.253);
  assert.equal(getMove("nova", "jab2").chainClose, 0.276);
});

test("Nova down tilt and side special match the character workbook values", () => {
  const downTilt = getMove("nova", "down").hits[0];
  const sideSpecial = getMove("nova", "specialSide");

  assert.equal(downTilt.baseKnockback, 175);
  assert.equal(downTilt.knockbackGrowth, 0.8);
  assert.equal(sideSpecial.projectile.damage, 15);
  assert.equal(sideSpecial.projectile.hpDamage, 15);
  assert.equal(sideSpecial.projectile.clankDamage, 15);
  assert.equal(sideSpecial.spawnAt, 16 / 60);
  assert.equal(sideSpecial.total - sideSpecial.spawnAt, 70 / 60);
});

test("Nova side tilt swings outward and retracts its arm-tracking hitbox", () => {
  const { first } = createBattle();
  const sideTilt = getMove("nova", "side");
  const activeHit = { ...sideTilt, ...sideTilt.hits[0], id: "side", hitId: "arm" };
  const hitboxAt = time => {
    first.actionTime = time;
    return getHitbox(first, activeHit);
  };
  const opening = hitboxAt(0.08);
  const extended = hitboxAt(0.14);
  const retracting = hitboxAt(0.18);

  assert.ok(extended.x + extended.w > opening.x + opening.w);
  assert.ok(extended.x + extended.w > retracting.x + retracting.w);
  assert.ok(extended.h >= 24);

  const rightHitbox = hitboxAt(0.14);
  first.facing = -1;
  const leftHitbox = hitboxAt(0.14);
  assert.ok(Math.abs((rightHitbox.x + rightHitbox.w / 2) + (leftHitbox.x + leftHitbox.w / 2) - first.x * 2) < 1e-9);
});

test("Nova side tilt pose winds up, extends, and returns to rest", () => {
  const start = getNovaSideTiltMotion(0);
  const extended = getNovaSideTiltMotion(0.42);
  const finish = getNovaSideTiltMotion(1);

  assert.ok(extended.reach > start.reach);
  assert.equal(extended.reach, 1.58 * 1.25);
  assert.ok(Math.abs(extended.angle) < Math.abs(start.angle));
  assert.deepEqual(finish, { angle: 1.2, reach: 1, force: 0 });

  const assets = new AssetManager();
  const pose = assets.getNovaLimbPose("side", 0.42);
  assert.equal(pose.frontArm, extended.angle);
  assert.equal(pose.frontArmReach, extended.reach);
});

test("Nova side smash pulls its fist back, steps forward, and punches with an arm-tracking hitbox", () => {
  const charged = getNovaSideSmashMotion(0, true);
  const extended = getNovaSideSmashMotion(0.28);
  const recovered = getNovaSideSmashMotion(1);

  assert.ok(charged.frontArm > 2.5);
  assert.ok(extended.frontArmReach > 1.8);
  assert.ok(Math.abs(extended.frontArm) < 0.1);
  assert.equal(recovered.frontArm, 1.2);
  assert.equal(recovered.frontArmReach, 1);

  const move = getMove("nova", "smashSide");
  assert.equal(move.motion.distanceX, NOVA_MOVE_MOTION.sideSmashStepDistance);
  assert.equal(move.motion.preventEdgeDrop, true);

  const { first } = createBattle();
  const activeHit = { ...move, ...move.hits[0], id: move.id, hitId: move.hits[0].id };
  first.action = move.id;
  first.move = move;
  first.actionTime = move.hits[0].start;
  const hitbox = getHitbox(first, activeHit);
  assert.ok(hitbox.x + hitbox.w > first.x + first.w / 2 + 30);

  const hurtbox = fighterHurtboxes(first).find(box => box.part === "frontArm");
  assert.ok(hurtbox.x + hurtbox.w > first.x + first.w / 2 + 20);

  const assets = new AssetManager();
  const chargedPose = assets.getNovaLimbPose("smashCharge", 0);
  const punchPose = assets.getNovaLimbPose("smashSide", 0.28);
  assert.equal(chargedPose.frontArm, charged.frontArm);
  assert.equal(punchPose.frontArmReach, extended.frontArmReach);
  assert.ok(FIGHTER_POSE_FRAMES.smashSide > 1);

  const renderer = new CanvasRenderer({});
  const sideChargeVisual = renderer.fighterVisualState({
    characterId: "nova",
    action: "smashCharge",
    smashCharge: { moveId: "smashSide", ratio: 0.5 },
    shield: false,
    hitstun: 0
  }, 0);
  const upChargeVisual = renderer.fighterVisualState({
    characterId: "nova",
    action: "smashCharge",
    smashCharge: { moveId: "smashUp", ratio: 0.5 },
    shield: false,
    hitstun: 0
  }, 0);
  assert.equal(sideChargeVisual.pose, "smashCharge");
  assert.equal(upChargeVisual.pose, "smashUpCharge");

  let temporarySwingLines = 0;
  renderer.drawNovaMoveEffect({
    save() {},
    restore() {},
    quadraticCurveTo() { temporarySwingLines += 1; }
  }, {
    characterId: "nova",
    action: "smashSide",
    actionTime: move.hits[0].start
  }, 0);
  assert.equal(temporarySwingLines, 0);
});

test("Nova side smash release advances the fighter by its fixed step", () => {
  const { simulation, match, first, second } = createBattle();
  first.x = 600;
  second.x = 1000;
  first.y = 500 - first.h / 2;
  second.y = 500 - second.h / 2;
  first.onGround = true;
  second.onGround = true;
  const startX = first.x;

  simulation.step(match, inputs({ smash: true }), 1 / 60);
  simulation.step(match, inputs(), 1 / 60);
  stepFrames(simulation, match, 24);

  assert.equal(first.action, "smashSide");
  assert.ok(first.x >= startX + NOVA_MOVE_MOTION.sideSmashStepDistance - 0.5);
});

test("Nova up smash crouches to charge and carries a diagonally raised fist upward", () => {
  const charged = getNovaUpSmashMotion(0, true);
  const forward = getNovaUpSmashMotion(0.2);
  const overhead = getNovaUpSmashMotion(0.65);

  assert.ok(charged.offsetY >= 8);
  assert.ok(charged.rearLeg > 0.6);
  assert.ok(charged.frontLeg < -0.6);
  assert.ok(forward.frontArm < -0.5 && forward.frontArm > -0.75);
  assert.ok(overhead.frontArm < forward.frontArm);
  assert.ok(overhead.frontArm > -1.05);
  assert.ok(overhead.frontArmReach > 1.5);
  assert.ok(overhead.frontArmRootY < forward.frontArmRootY - 7);

  const assets = new AssetManager();
  const chargePose = assets.getNovaLimbPose("smashUpCharge", 0);
  const uppercutPose = assets.getNovaLimbPose("smashUp", 0.65);
  assert.equal(chargePose.frontArm, charged.frontArm);
  assert.equal(uppercutPose.frontArm, overhead.frontArm);
  assert.ok(FIGHTER_POSE_FRAMES.smashUp > 1);

  const { first } = createBattle();
  const move = getMove("nova", "smashUp");
  const activeHit = { ...move, ...move.hits[0], id: move.id, hitId: move.hits[0].id };
  first.action = move.id;
  first.move = move;
  first.actionTime = 0.3;
  first.onGround = false;
  first.vy = -200;
  const hitbox = getHitbox(first, activeHit);
  const armHurtbox = fighterHurtboxes(first).find(box => box.part === "frontArm");
  assert.ok(hitbox.y < first.y - 30);
  assert.ok(armHurtbox.y < first.y - 25);

  const renderer = new CanvasRenderer({});
  const visual = renderer.fighterVisualState(first, 0);
  assert.equal(visual.pose, "smashUp");
  let temporarySwingLines = 0;
  renderer.drawNovaMoveEffect({
    save() {},
    restore() {},
    quadraticCurveTo() { temporarySwingLines += 1; }
  }, {
    characterId: "nova",
    action: "smashUp",
    actionTime: first.actionTime
  }, 0);
  assert.equal(temporarySwingLines, 0);
});

test("Nova up smash uses a short hop, ends its hitbox at the apex, and locks action until landing", () => {
  const { simulation, match, first, second } = createBattle();
  first.x = 600;
  second.x = 1000;
  first.y = 500 - first.h / 2;
  second.y = 500 - second.h / 2;
  first.onGround = true;
  second.onGround = true;
  const startY = first.y;
  const startingJumps = first.jumps;

  simulation.step(match, inputs({ up: true, smash: true }), 1 / 60);
  simulation.step(match, inputs({ up: true }), 1 / 60);
  assert.equal(first.action, "smashUp");
  assert.equal(first.move.jumpHeightRatio, SHORT_HOP.heightRatio);
  assert.equal(first.move.endsOnLanding, true);

  for (let frame = 0; frame < 20 && first.onGround; frame += 1) {
    simulation.step(match, inputs(), 1 / 60);
  }
  assert.equal(first.onGround, false);
  assert.ok(first.vy < 0);
  assert.equal(first.jumps, startingJumps);
  assert.equal(getActiveMoveHits(first, first.move, first.actionTime).length, 1);

  let highestY = first.y;
  for (let frame = 0; frame < 60 && first.vy < 0; frame += 1) {
    simulation.step(match, inputs(), 1 / 60);
    highestY = Math.min(highestY, first.y);
  }
  assert.ok(startY - highestY > 70);
  assert.equal(first.action, "smashUp");
  assert.equal(first.onGround, false);
  assert.ok(first.vy >= 0);
  assert.equal(getActiveMoveHits(first, first.move, first.actionTime).length, 0);

  while (first.actionTime <= first.move.total) simulation.step(match, inputs(), 1 / 60);
  assert.equal(first.action, "smashUp");
  assert.equal(first.onGround, false);

  for (let frame = 0; frame < 90 && first.action; frame += 1) {
    simulation.step(match, inputs(), 1 / 60);
  }
  assert.equal(first.onGround, true);
  assert.equal(first.action, null);
  assert.equal(first.move, null);
  assert.equal(first.jumps, first.maxJumps);
});

test("Nova down smash creates a wide explosion, floats briefly, and remains active until landing", () => {
  const charged = getNovaDownSmashMotion(0, true);
  const blastPose = getNovaDownSmashMotion(0.36);
  assert.ok(charged.offsetY > 0);
  assert.ok(blastPose.rearLeg > charged.rearLeg);
  assert.ok(blastPose.frontLeg < charged.frontLeg);
  assert.ok(FIGHTER_POSE_FRAMES.smashDown > 1);

  const assets = new AssetManager();
  const chargePose = assets.getNovaLimbPose("smashDownCharge", 0);
  const activePose = assets.getNovaLimbPose("smashDown", 0.36);
  assert.equal(chargePose.rearLeg, charged.rearLeg);
  assert.equal(activePose.frontLeg, blastPose.frontLeg);

  const renderer = new CanvasRenderer({});
  let widestExplosion = 0;
  const gradient = { addColorStop() {} };
  const ctx = {
    globalAlpha: 1,
    save() {},
    restore() {},
    createRadialGradient() { return gradient; },
    beginPath() {},
    ellipse(x, y, radiusX) { widestExplosion = Math.max(widestExplosion, radiusX * 2); },
    fill() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    closePath() {},
    stroke() {}
  };
  const move = getMove("nova", "smashDown");
  renderer.drawNovaMoveEffect(ctx, {
    characterId: "nova",
    action: "smashDown",
    actionTime: move.hits[0].start + move.hits[0].duration
  }, 0);
  assert.ok(widestExplosion > NOVA_DOWN_SMASH_EXPLOSION.width * 0.9);

  const { simulation, match, first, second } = createBattle();
  first.x = 600;
  second.x = 1000;
  first.y = 500 - first.h / 2;
  second.y = 500 - second.h / 2;
  first.onGround = true;
  second.onGround = true;
  const startY = first.y;
  const startingJumps = first.jumps;

  simulation.step(match, inputs({ down: true, smash: true }), 1 / 60);
  simulation.step(match, inputs({ down: true }), 1 / 60);
  assert.equal(first.action, "smashDown");
  assert.equal(first.move.endsOnLanding, true);

  for (let frame = 0; frame < 20 && first.onGround; frame += 1) {
    simulation.step(match, inputs(), 1 / 60);
  }
  assert.equal(first.onGround, false);
  assert.ok(first.vy < 0);
  assert.equal(first.jumps, startingJumps);

  let highestY = first.y;
  let descendingPoseProgress = 0;
  for (let frame = 0; frame < 60 && first.action; frame += 1) {
    simulation.step(match, inputs(), 1 / 60);
    highestY = Math.min(highestY, first.y);
    if (!first.onGround && first.vy >= 0) {
      descendingPoseProgress = Math.max(descendingPoseProgress, getNovaDownSmashPoseProgress(first));
    }
  }
  assert.ok(startY - highestY >= 18 && startY - highestY <= 30);
  assert.ok(descendingPoseProgress >= 0.6);
  assert.equal(first.onGround, true);
  assert.equal(first.action, null);
  assert.equal(first.jumps, first.maxJumps);
});

test("Nova up tilt swings the right hand clockwise before the left hand counterclockwise", () => {
  const rightStart = getNovaUpTiltMotion(0.12);
  const rightSwing = getNovaUpTiltMotion(0.24);
  const leftStart = getNovaUpTiltMotion(0.33);
  const leftSwing = getNovaUpTiltMotion(0.46);

  assert.ok(rightSwing.rightHandAngle > rightStart.rightHandAngle);
  assert.ok(rightSwing.rightHandForce > 0);
  assert.equal(rightSwing.leftHandForce, 0);
  assert.ok(leftSwing.leftHandAngle < leftStart.leftHandAngle);
  assert.ok(leftSwing.leftHandForce > 0);
  assert.equal(getNovaUpTiltMotion(1).rightHandExtended, false);
});

test("Nova up tilt hitboxes follow each arm above the fighter", () => {
  const { first } = createBattle();
  const upTilt = getMove("nova", "up");
  const firstHit = { ...upTilt, ...upTilt.hits[0], id: "up", hitId: "spin1" };
  const secondHit = { ...upTilt, ...upTilt.hits[1], id: "up", hitId: "spin2" };

  first.actionTime = 0.14;
  const rightHandHitbox = getHitbox(first, firstHit);
  first.actionTime = 0.26;
  const leftHandHitbox = getHitbox(first, secondHit);

  assert.ok(rightHandHitbox.y < first.y - first.h / 2 - 20);
  assert.ok(leftHandHitbox.y < first.y - first.h / 2 - 20);
  assert.ok(rightHandHitbox.w >= 24 && rightHandHitbox.h >= 24);
  assert.ok(leftHandHitbox.w >= 24 && leftHandHitbox.h >= 24);

  const assets = new AssetManager();
  const rightPose = assets.getNovaLimbPose("up", 0.24);
  const leftPose = assets.getNovaLimbPose("up", 0.46);
  assert.equal(rightPose.rearArm, getNovaUpTiltMotion(0.24).rightHandAngle);
  assert.equal(rightPose.rearArmForward, true);
  assert.ok(rightPose.rearArmRootY < -13);
  assert.equal(leftPose.frontArm, getNovaUpTiltMotion(0.46).leftHandAngle);
  assert.ok(leftPose.frontArmRootY < -13);
});

test("Nova neutral air uses a centered circular hitbox with a body-height-scaled radius", () => {
  const { first } = createBattle();
  first.x = 500;
  first.y = 300;
  const move = getMove("nova", "airNeutral");
  const hit = { ...move, ...move.hits[0], id: move.id, hitId: move.hits[0].id };
  const hitbox = getHitbox(first, hit);

  assert.equal(hitbox.shape, "circle");
  assert.equal(hitbox.cx, first.x);
  assert.equal(hitbox.cy, first.y);
  assert.equal(hitbox.radius, NOVA_BODY_SIZE.height * 0.7 * 1.3);
  assert.equal(hitbox.w, hitbox.radius * 2);
  assert.equal(hitbox.h, hitbox.radius * 2);

  const horizontalTarget = {
    x: hitbox.cx + hitbox.radius - 1,
    y: hitbox.cy - 5,
    w: 10,
    h: 10
  };
  const boundingBoxCorner = {
    x: hitbox.cx + hitbox.radius - 2,
    y: hitbox.cy + hitbox.radius - 2,
    w: 4,
    h: 4
  };
  assert.equal(hitboxesOverlap(hitbox, horizontalTarget), true);
  assert.equal(hitboxesOverlap(hitbox, boundingBoxCorner), false);
});

test("Nova forward air swings one arm upward with a tracking hitbox", () => {
  const { first } = createBattle();
  const move = getMove("nova", "airForward");
  const hit = { ...move, ...move.hits[0], id: move.id, hitId: move.hits[0].id };
  const lowProgress = move.hits[0].start / move.total;
  const highProgress = (move.hits[0].start + move.hits[0].duration) / move.total;
  const lowMotion = getNovaForwardAirMotion(lowProgress);
  const highMotion = getNovaForwardAirMotion(highProgress);

  assert.ok(lowMotion.angle > 1);
  assert.ok(highMotion.angle < 0);
  assert.ok(highMotion.reach > 1.95);

  first.actionTime = move.hits[0].start;
  const lowHitbox = getHitbox(first, hit);
  first.actionTime = move.hits[0].start + move.hits[0].duration;
  const highHitbox = getHitbox(first, hit);
  assert.ok(highHitbox.y < lowHitbox.y);
  assert.ok(highHitbox.w > lowHitbox.w);
  assert.ok(lowHitbox.x + lowHitbox.w / 2 > first.x);
  assert.ok(highHitbox.x + highHitbox.w / 2 > first.x);

  const assets = new AssetManager();
  const pose = assets.getNovaLimbPose("airForward", highProgress);
  assert.equal(pose.frontArm, highMotion.angle);
  assert.equal(pose.frontArmReach, highMotion.reach);
  assert.ok(pose.frontArmRootY < -13);

  const renderer = new CanvasRenderer({});
  const visual = renderer.fighterVisualState({
    characterId: "nova",
    action: "airForward",
    actionTime: move.hits[0].start,
    onGround: false,
    shield: false,
    hitstun: 0,
    vx: 0,
    vy: 0
  }, 0);
  assert.equal(visual.pose, "airForward");
  assert.ok(FIGHTER_POSE_FRAMES.airForward > 1);
});

test("Nova hurtboxes cover visible body parts and follow swinging arms", () => {
  const { first } = createBattle();
  first.x = 500;
  first.y = 300;
  first.facing = 1;
  first.action = null;
  first.move = null;
  first.onGround = true;

  const core = fighterRect(first);
  const idle = fighterHurtboxes(first);
  const idlePart = part => idle.find(hurtbox => hurtbox.part === part);
  assert.deepEqual(
    idle.map(hurtbox => hurtbox.part).sort(),
    ["body", "frontArm", "frontLeg", "head", "rearArm", "rearLeg"].sort()
  );
  assert.ok(idlePart("body").w > core.w);
  assert.ok(idlePart("head").y < core.y);
  assert.ok(idlePart("frontLeg").y + idlePart("frontLeg").h > core.y + core.h);
  assert.ok(idlePart("frontArm").x + idlePart("frontArm").w > core.x + core.w);
  assert.ok(idlePart("rearArm").h > idlePart("rearArm").w);
  assert.ok(idlePart("rearArm").x >= core.x - 12);

  const side = getMove("nova", "side");
  first.action = "side";
  first.move = side;
  first.actionTime = side.total * 0.42;
  const sideArm = fighterHurtboxes(first).find(hurtbox => hurtbox.part === "frontArm");
  assert.ok(sideArm.x + sideArm.w > idlePart("frontArm").x + idlePart("frontArm").w + 20);
  const armOnlyTarget = {
    x: sideArm.x + sideArm.w - 5,
    y: sideArm.y + sideArm.h / 2 - 3,
    w: 8,
    h: 6
  };
  assert.equal(hitboxesOverlap(armOnlyTarget, core), false);
  assert.equal(hitboxOverlapsFighter(armOnlyTarget, first), true);

  const forwardAir = getMove("nova", "airForward");
  first.action = "airForward";
  first.move = forwardAir;
  first.onGround = false;
  first.actionTime = forwardAir.total * 0.48;
  const forwardAirArm = fighterHurtboxes(first).find(hurtbox => hurtbox.part === "frontArm");
  assert.ok(forwardAirArm.x + forwardAirArm.w > idlePart("frontArm").x + idlePart("frontArm").w + 20);
  assert.ok(forwardAirArm.y < idlePart("frontArm").y);
});

test("Nova back air leans forward, points both legs backward, and tracks its flame hitbox", () => {
  const { first } = createBattle();
  const move = getMove("nova", "airBack");
  const firstHit = move.hits[0];
  const finishHit = move.hits[3];
  const firstTime = firstHit.start + firstHit.duration / 2;
  const finishTime = finishHit.start + finishHit.duration / 2;
  const poseProgress = getNovaBackAirPoseProgress(firstTime, false);
  const motion = getNovaBackAirMotion(poseProgress);

  assert.ok(motion.bodyLean > 0.2);
  assert.ok(motion.rearLeg > 0.9);
  assert.ok(motion.frontLeg > 0.9);
  assert.ok(FIGHTER_POSE_FRAMES.airBack > 1);

  const assets = new AssetManager();
  const pose = assets.getNovaLimbPose("airBack", poseProgress);
  assert.equal(pose.rearLeg, motion.rearLeg);
  assert.equal(pose.frontLeg, motion.frontLeg);

  const firstFlame = getNovaBackAirFlame(firstTime, false);
  const finishFlame = getNovaBackAirFlame(finishTime, true);
  assert.equal(getNovaBackAirFlame(finishTime, false), null);
  assert.ok(firstFlame.length > firstFlame.thickness * 3);
  assert.ok(finishFlame.length > firstFlame.length);
  assert.ok(finishFlame.thickness > firstFlame.thickness);
  assert.equal(finishFlame.large, true);

  const hitView = hit => ({ ...move, ...hit, id: move.id, hitId: hit.id });
  first.actionTime = firstTime;
  first.facing = 1;
  const rightFacingHitbox = getHitbox(first, hitView(firstHit));
  first.facing = -1;
  const leftFacingHitbox = getHitbox(first, hitView(firstHit));
  assert.ok(rightFacingHitbox.x + rightFacingHitbox.w / 2 < first.x);
  assert.ok(leftFacingHitbox.x + leftFacingHitbox.w / 2 > first.x);

  first.facing = 1;
  first.actionTime = finishTime;
  const finishHitbox = getHitbox(first, hitView(finishHit));
  assert.ok(finishHitbox.w > rightFacingHitbox.w);
  assert.ok(finishHitbox.h > rightFacingHitbox.h);

  const visual = new CanvasRenderer({}).fighterVisualState({
    characterId: "nova",
    action: "airBack",
    actionTime: firstTime,
    moveContact: false,
    onGround: false,
    shield: false,
    hitstun: 0,
    vx: 0,
    vy: 0
  }, 0);
  assert.equal(visual.pose, "airBack");
  assert.ok(visual.rotation > 0.2);
});

test("Nova down tilt raises both arms while its foot jets ignite without moving the fighter", () => {
  const start = getNovaDownTiltMotion(0);
  const active = getNovaDownTiltMotion(0.4);
  const finish = getNovaDownTiltMotion(1);
  assert.equal(start.force, 0);
  assert.equal(active.force, 1);
  assert.equal(active.flame, 1);
  assert.equal(finish.force, 0);
  assert.equal(finish.flame, 0);

  const assets = new AssetManager();
  const idlePose = assets.getNovaLimbPose("idle");
  const downPose = assets.getNovaLimbPose("down", 0.4);
  assert.ok(downPose.rearArm > idlePose.rearArm);
  assert.ok(downPose.frontArm < idlePose.frontArm);
  assert.ok(downPose.rearArmRootY < -13);
  assert.ok(downPose.frontArmRootY < -13);

  const renderer = new CanvasRenderer({});
  const visual = renderer.fighterVisualState({
    characterId: "nova",
    action: "down",
    actionTime: getMove("nova", "down").total * 0.4,
    onGround: true,
    shield: false,
    hitstun: 0,
    vx: 0,
    vy: 0
  }, 0);
  assert.equal(visual.pose, "down");
  assert.equal(visual.offsetY, 0);
});

test("the shared simulation applies Nova's first jab", () => {
  const { simulation, match, second } = createBattle();
  simulation.step(match, inputs({ attack: true }), 1 / 60);
  for (let frame = 0; frame < 8; frame += 1) simulation.step(match, inputs(), 1 / 60);
  assert.equal(second.damage, 3);
  assert.ok(match.events.some(event => event.kind === "hit" && event.targetId === "p2"));
});

test("a grounded down tilt hit does not displace the attacker to a ledge", () => {
  const { simulation, match, first, second } = createBattle();
  first.x = 600;
  first.y = 500 - first.h / 2;
  first.onGround = true;
  second.x = 650;
  second.y = 500 - second.h / 2;
  second.onGround = true;

  simulation.step(match, inputs({ down: true, attack: true }), 1 / 60);
  for (let frame = 0; frame < 30; frame += 1) {
    simulation.step(match, inputs({ down: true }), 1 / 60);
  }

  assert.equal(second.damage, 8);
  assert.ok(Math.abs(first.x - 600) < 1);
  assert.equal(first.y, 500 - first.h / 2);
  assert.equal(first.ledge, null);
});

test("victim SDI cannot move downward through a main platform", () => {
  const { first } = createBattle();
  first.x = 600;
  first.y = 500 - first.h / 2;
  first.onGround = false;
  first.vy = -300;
  first.hitlag = 0.1;

  applyHitlagSdi(first, { down: true }, 1 / 60, STAGES.final);

  assert.equal(first.x, 600);
  assert.equal(first.y, 500 - first.h / 2);
  assert.equal(first.onGround, true);
});

test("hitlag SDI remains available while stage collision is enforced", () => {
  const { first } = createBattle();
  first.x = 600;
  first.y = 500 - first.h / 2;
  first.onGround = true;
  first.hitlag = 0.1;

  applyHitlagSdi(first, { right: true }, 1 / 60, STAGES.final);

  assert.ok(first.x > 600);
  assert.equal(first.y, 500 - first.h / 2);
});

test("smash charge reaches its shared maximum at three seconds and releases on button up", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 900;

  simulation.step(match, inputs({ smash: true }), 1 / 60);
  for (let frame = 0; frame < 12; frame += 1) {
    simulation.step(match, inputs({ smash: true }), 0.25);
  }

  assert.equal(first.action, "smashCharge");
  assert.equal(first.smashCharge.ratio, 1);
  assert.equal(first.move, null);

  simulation.step(match, inputs(), 1 / 60);
  assert.equal(first.action, "smashSide");
  assert.equal(first.smashCharge, null);
  assert.equal(first.move.chargeDamageMultiplier, SMASH_CHARGE.maxDamageMultiplier);
  assert.equal(first.move.chargeKnockbackMultiplier, SMASH_CHARGE.maxKnockbackMultiplier);
  assert.equal(first.move.damage, 22.5);
  assert.equal(first.move.hpDamage, 22.5);
  assert.equal(first.move.shieldDamage, 32.5);
});

test("smash charge applies its knockback bonus independently from damage", () => {
  const attacker = { x: 0, damage: 0, staleMoves: [] };
  const target = { x: 100, damage: 50, weightClass: "middle", onGround: true };
  const move = {
    id: "testSmash",
    baseKnockback: 300,
    knockbackGrowth: 6,
    angle: 30,
    hitlag: 0.1
  };
  const normal = calculateLaunch({ move, attacker, target });
  const charged = calculateLaunch({
    move: { ...move, chargeKnockbackMultiplier: SMASH_CHARGE.maxKnockbackMultiplier },
    attacker,
    target
  });

  assert.ok(Math.abs(charged.power - normal.power * 1.15) < 0.000001);
});

test("every smash charge direction draws short streaks moving inward toward the fighter", () => {
  const renderer = new CanvasRenderer({});
  for (const moveId of ["smashSide", "smashUp", "smashDown"]) {
    let lineCount = 0;
    let arcCount = 0;
    const strokeStyles = [];
    const ctx = {
      globalAlpha: 1,
      set strokeStyle(value) { strokeStyles.push(value); },
      save() {},
      restore() {},
      scale() {},
      beginPath() {},
      moveTo() {},
      lineTo() { lineCount += 1; },
      arc() { arcCount += 1; },
      stroke() {},
      fill() {}
    };

    renderer.drawSmashCharge(ctx, {
      colorIndex: 0,
      facing: 1,
      smashCharge: { moveId, elapsed: 1.5, ratio: 0.5 }
    }, 350);

    assert.equal(lineCount, 14);
    assert.equal(arcCount, 2);
    assert.ok(strokeStyles.includes("#ffd84d"));
  }
});

test("holding smash for ten seconds automatically releases a maximum-charge smash", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 900;

  simulation.step(match, inputs({ smash: true }), 1 / 60);
  for (let frame = 0; frame < 40; frame += 1) {
    simulation.step(match, inputs({ smash: true }), 0.25);
  }

  assert.equal(first.smashCharge, null);
  assert.equal(first.action, "smashSide");
  assert.equal(first.move.chargeRatio, 1);
  assert.equal(first.move.chargeDamageMultiplier, SMASH_CHARGE.maxDamageMultiplier);
  assert.equal(first.move.chargeKnockbackMultiplier, SMASH_CHARGE.maxKnockbackMultiplier);
  assert.equal(first.move.damage, 22.5);
  assert.equal(first.actionLock, 0);
});

test("Nova stores a four second down-special charge and spends it on the next hit", () => {
  const { simulation, match, first, second } = createBattle();
  simulation.step(match, inputs({ down: true, special: true }), 1 / 60);
  stepFrames(simulation, match, 241, inputs({ down: true, special: true }));

  assert.equal(first.novaCharge, 4);
  assert.equal(first.novaCharging, false);
  simulation.step(match, inputs(), 1 / 60);
  simulation.step(match, inputs({ attack: true }), 1 / 60);
  stepFrames(simulation, match, 8);

  assert.equal(second.damage, 4.8);
  assert.equal(first.novaCharge, 0);
});

test("Nova loses stored down-special charge when KO'd", () => {
  const { simulation, match, first } = createBattle();
  first.novaCharge = 3.5;
  simulation.eliminateFighter(match, first);
  assert.equal(first.novaCharge, 0);
});

test("Nova's held jab input advances through all three attacks", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 900;
  simulation.step(match, inputs({ attack: true }), 1 / 60);
  stepFrames(simulation, match, 15, inputs({ attack: true }));
  assert.equal(first.action, "jab2");
  stepFrames(simulation, match, 17, inputs({ attack: true }));
  assert.equal(first.action, "jab3");
});

test("Nova's jab chain accepts separate taps through the nine-frame input buffer", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 900;
  assert.equal(JAB_COMBO.inputBufferFrames, 9);

  simulation.step(match, inputs({ attack: true }), 1 / 60);
  simulation.step(match, inputs({ attack: false }), 1 / 60);
  simulation.step(match, inputs({ attack: true }), 1 / 60);
  simulation.step(match, inputs({ attack: false }), 1 / 60);
  stepFrames(simulation, match, 12, inputs({ attack: false }));
  assert.equal(first.action, "jab2");

  simulation.step(match, inputs({ attack: true }), 1 / 60);
  simulation.step(match, inputs({ attack: false }), 1 / 60);
  stepFrames(simulation, match, 15, inputs({ attack: false }));
  assert.equal(first.action, "jab3");
});

test("Nova's opening jab does not continue without a hold or another press", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 900;
  simulation.step(match, inputs({ attack: true }), 1 / 60);
  stepFrames(simulation, match, 20, inputs({ attack: false }));
  assert.equal(first.action, null);
});

test("Nova's jab follow-up stays open for 45 frames and movement cancels it", () => {
  const waitForJabEnd = battle => {
    battle.second.x = 900;
    battle.simulation.step(battle.match, inputs({ attack: true }), 1 / 60);
    battle.simulation.step(battle.match, inputs(), 1 / 60);
    while (battle.first.action) battle.simulation.step(battle.match, inputs(), 1 / 60);
  };

  assert.equal(JAB_COMBO.followupWindowFrames, 45);
  const chained = createBattle();
  waitForJabEnd(chained);
  stepFrames(chained.simulation, chained.match, 44);
  chained.simulation.step(chained.match, inputs({ attack: true }), 1 / 60);
  assert.equal(chained.first.action, "jab2");

  const interrupted = createBattle();
  waitForJabEnd(interrupted);
  interrupted.simulation.step(interrupted.match, inputs({ moveX: 1 }), 1 / 60);
  interrupted.simulation.step(interrupted.match, inputs(), 1 / 60);
  interrupted.simulation.step(interrupted.match, inputs({ attack: true }), 1 / 60);
  assert.equal(interrupted.first.action, "jab1");
});

test("Nova's jab chain keeps a repeated press made during hitlag", () => {
  const { simulation, match, first } = createBattle();
  simulation.step(match, inputs({ attack: true }), 1 / 60);
  simulation.step(match, inputs({ attack: false }), 1 / 60);
  simulation.step(match, inputs({ attack: false }), 1 / 60);
  assert.ok(first.hitlag > 0);

  simulation.step(match, inputs({ attack: true }), 1 / 60);
  simulation.step(match, inputs({ attack: false }), 1 / 60);
  stepFrames(simulation, match, 15, inputs({ attack: false }));
  assert.equal(first.action, "jab2");
});

test("Nova's aerial attack selection preserves facing and distinguishes front and back", () => {
  const forward = selectMoveFromInput("nova", normalizeBattleInput({ moveX: 1 }), 1, "attack", {
    airborne: true,
    facing: 1
  });
  const back = selectMoveFromInput("nova", normalizeBattleInput({ moveX: -1 }), -1, "attack", {
    airborne: true,
    facing: 1
  });
  const neutral = selectMoveFromInput("nova", normalizeBattleInput(), 0, "attack", {
    airborne: true,
    facing: 1
  });
  assert.equal(forward.id, "airForward");
  assert.equal(back.id, "airBack");
  assert.equal(neutral.id, "airNeutral");
});

test("Nova uses dash attack only after reaching full ground run speed", () => {
  const selected = selectMoveFromInput("nova", normalizeBattleInput({ moveX: 1 }), 1, "attack", {
    airborne: false,
    facing: 1,
    dashing: true
  });
  assert.equal(selected.id, "dashAttack");
  assert.equal(selected.hits[0].damage, 10.2);
  assert.equal(selected.hits[0].angle, 35);
  assert.equal(selected.hits[0].baseKnockback, 360);
  assert.equal(selected.hits[0].knockbackGrowth, 7);

  const startingBattle = createBattle();
  startingBattle.first.y = STAGES.final.platforms[0].y - startingBattle.first.h / 2;
  startingBattle.simulation.step(startingBattle.match, inputs({ moveX: 1, attack: true }), 1 / 60);
  assert.equal(startingBattle.first.action, "side");

  const { simulation, match, first, second } = createBattle();
  second.x = 900;
  first.y = STAGES.final.platforms[0].y - first.h / 2;
  const startX = first.x;
  stepFrames(simulation, match, 37, inputs({ moveX: 1 }));
  simulation.step(match, inputs({ moveX: 1, attack: true }), 1 / 60);
  assert.equal(first.action, "dashAttack");
  stepFrames(simulation, match, 4, inputs({ moveX: 1 }));
  assert.ok(first.moveState.pendingMotion);
  assert.equal(first.vx, 0);
  assert.ok(first.x > startX);
});

test("Nova dash attack travels its fixed 1.8x distance and covers the whole body", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 1000;
  first.x = 500;
  first.y = STAGES.final.platforms[0].y - first.h / 2;
  first.onGround = true;
  first.facing = 1;
  first.vx = first.stats.runSpeed;
  first.runRampDirection = 1;
  first.runRampElapsed = MOVEMENT.groundRunRampDuration;
  const startX = first.x;

  simulation.step(match, inputs({ moveX: 1, attack: true }), 1 / 60);
  while (first.action === "dashAttack") {
    simulation.step(match, inputs({ moveX: 1 }), 1 / 60);
  }

  assert.ok(Math.abs(first.x - startX - NOVA_MOVE_MOTION.dashAttackDistance) < 0.001);
  const hit = getMove("nova", "dashAttack").hits[0];
  const hitbox = getHitbox({ ...first, x: 0, y: 0, facing: 1 }, hit);
  assert.ok(hitbox.x <= -first.w / 2);
  assert.ok(hitbox.x + hitbox.w >= first.w / 2);
  assert.ok(hitbox.y <= -first.h / 2);
  assert.ok(hitbox.y + hitbox.h >= first.h / 2);
  assert.ok(Math.abs(getMove("nova", "dashAttack").total - (hit.start + hit.duration) - 45 / 60) < 1e-9);
});

test("Nova dash attack stops its remaining fixed movement on shield", () => {
  const { simulation, match, first, second } = createBattle();
  first.x = 500;
  first.y = STAGES.final.platforms[0].y - first.h / 2;
  first.onGround = true;
  first.facing = 1;
  first.vx = first.stats.runSpeed;
  first.runRampDirection = 1;
  first.runRampElapsed = MOVEMENT.groundRunRampDuration;
  second.x = 625;
  second.y = STAGES.final.platforms[0].y - second.h / 2;
  second.onGround = true;
  const startX = first.x;

  simulation.step(match, inputs({ moveX: 1, attack: true }, { shield: true }), 1 / 60);
  while (first.action === "dashAttack") {
    simulation.step(match, inputs({ moveX: 1 }, { shield: true }), 1 / 60);
  }

  assert.ok(second.shieldHp < second.shieldMax);
  assert.equal(second.damage, 0);
  assert.ok(first.x - startX < NOVA_MOVE_MOTION.dashAttackDistance * 0.75);
});

test("Nova dash attack stops at the edge of its supporting platform", () => {
  const { simulation, match, first, second } = createBattle();
  const platform = STAGES.final.platforms[0];
  const edgeX = platform.x + platform.w - first.w / 2;
  first.x = edgeX - 40;
  first.y = platform.y - first.h / 2;
  first.onGround = true;
  first.facing = 1;
  first.vx = first.stats.runSpeed;
  first.runRampDirection = 1;
  first.runRampElapsed = MOVEMENT.groundRunRampDuration;
  second.x = 600;

  simulation.step(match, inputs({ moveX: 1, attack: true }), 1 / 60);
  while (first.action === "dashAttack") {
    simulation.step(match, inputs({ moveX: 1 }), 1 / 60);
  }

  assert.ok(first.x <= edgeX);
  assert.equal(first.onGround, true);
});

test("a fixed move stops when stage geometry blocks its path", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 1000;
  first.x = 220;
  first.y = 550;
  first.onGround = false;
  first.facing = 1;
  first.vx = 0;
  first.vy = 0;
  const startX = first.x;
  simulation.startMove(first, getMove("nova", "dashAttack"));

  for (let frame = 0; frame < 30 && !first.moveState.motionStopped; frame += 1) {
    simulation.step(match, inputs(), 1 / 60);
  }

  assert.equal(first.moveState.motionStopped, true);
  assert.ok(first.x - startX < NOVA_MOVE_MOTION.dashAttackDistance);
  assert.equal(first.vx, 0);
});

test("Nova up air rises by exactly two Nova body heights and has 60 frames of recovery", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 1000;
  first.x = 600;
  first.y = 300;
  first.onGround = false;
  first.vx = 0;
  first.vy = 0;
  simulation.step(match, inputs({ up: true, attack: true }), 1 / 60);

  let motionStartY = null;
  let minimumY = first.y;
  for (let frame = 0; frame < 60 && first.action === "airUp"; frame += 1) {
    const previousY = first.y;
    const hadMotion = Boolean(first.moveState?.pendingMotion);
    simulation.step(match, inputs(), 1 / 60);
    if (!hadMotion && first.moveState?.pendingMotion) motionStartY = previousY;
    if (motionStartY !== null) minimumY = Math.min(minimumY, first.y);
  }

  assert.ok(motionStartY !== null);
  assert.equal(NOVA_MOVE_MOTION.upAirRiseDistance, NOVA_BODY_SIZE.height * 2);
  assert.ok(Math.abs(motionStartY - minimumY - NOVA_MOVE_MOTION.upAirRiseDistance) < 0.001);
  const move = getMove("nova", "airUp");
  const activeEnd = Math.max(...move.hits.map(hit => hit.start + hit.duration));
  assert.equal(NOVA_MOVE_MOTION.upAirRecoveryFrames, 60);
  assert.ok(Math.abs((move.total - activeEnd) * 60 - NOVA_MOVE_MOTION.upAirRecoveryFrames) < 1e-9);
});

test("Nova up air keeps its hands down, uses short foot jets, and protects only its head", () => {
  const { first } = createBattle();
  const move = getMove("nova", "airUp");
  const jetHit = move.hits.find(hit => hit.id === "jet");
  const bodyHit = move.hits.find(hit => hit.id === "body");
  const jetTime = jetHit.start + jetHit.duration / 2;
  const bodyTime = bodyHit.start + bodyHit.duration / 2;
  const hitView = hit => ({ ...move, ...hit, id: move.id, hitId: hit.id });

  first.x = 600;
  first.y = 300;
  first.onGround = false;
  first.action = "airUp";
  first.move = move;
  first.actionTime = jetTime;

  const jet = getNovaUpAirJet(jetTime);
  const jetHitbox = getHitbox(first, hitView(jetHit));
  assert.equal(jet.length, 37);
  assert.ok(jetHitbox.y > first.y);
  assert.equal(jetHitbox.h, jet.length);

  first.actionTime = bodyTime;
  const bodyHitbox = getHitbox(first, hitView(bodyHit));
  assert.ok(bodyHitbox.y < first.y - first.h / 2);
  assert.ok(bodyHitbox.y + bodyHitbox.h < first.y + first.h / 2);

  first.action = null;
  const normalHurtboxes = fighterHurtboxes(first);
  first.action = "airUp";
  first.actionTime = bodyTime;
  const protectedHurtboxes = fighterHurtboxes(first);
  assert.equal(isNovaUpAirHeadIntangible(first), true);
  assert.ok(normalHurtboxes.some(hurtbox => hurtbox.part === "head"));
  assert.equal(protectedHurtboxes.some(hurtbox => hurtbox.part === "head"), false);
  assert.ok(protectedHurtboxes.some(hurtbox => hurtbox.part === "body"));
  first.actionTime = bodyHit.start + bodyHit.duration + 0.001;
  assert.equal(isNovaUpAirHeadIntangible(first), false);
  assert.ok(fighterHurtboxes(first).some(hurtbox => hurtbox.part === "head"));

  const poseProgress = getNovaUpAirPoseProgress(bodyTime);
  const motion = getNovaUpAirMotion(poseProgress);
  const assets = new AssetManager();
  const idlePose = assets.getNovaLimbPose("idle", 0);
  const upAirPose = assets.getNovaLimbPose("airUp", poseProgress);
  assert.equal(upAirPose.rearArm, idlePose.rearArm);
  assert.equal(upAirPose.frontArm, idlePose.frontArm);
  assert.equal(upAirPose.rearLeg, motion.rearLeg);
  assert.equal(upAirPose.frontLeg, motion.frontLeg);

  const visual = new CanvasRenderer({}).fighterVisualState({
    characterId: "nova",
    action: "airUp",
    actionTime: bodyTime,
    onGround: false,
    shield: false,
    hitstun: 0,
    vx: 0,
    vy: 0
  }, 0);
  assert.equal(visual.pose, "airUp");
  assert.ok(FIGHTER_POSE_FRAMES.airUp > 1);
});

test("Nova down air uses a narrow body-scaled flame and 30 base knockback", () => {
  const { first } = createBattle();
  const move = getMove("nova", "airDown");
  const firstHit = move.hits[0];
  const lastHit = move.hits[move.hits.length - 1];
  const activeTime = firstHit.start + firstHit.duration / 2;
  const flame = getNovaDownAirFlame(activeTime);

  assert.equal(NOVA_AIR_DOWN_FLAME.width, NOVA_BODY_SIZE.width + 14);
  assert.equal(NOVA_AIR_DOWN_FLAME.height, NOVA_BODY_SIZE.height * 0.85 * 1.8);
  assert.equal(flame.width, NOVA_AIR_DOWN_FLAME.width);
  assert.equal(flame.height, NOVA_AIR_DOWN_FLAME.height);
  assert.ok(flame.height > flame.width);
  assert.ok(move.hits.every(hit => hit.baseKnockback === 30));

  first.x = 500;
  first.y = 300;
  first.action = "airDown";
  first.move = move;
  first.actionTime = activeTime;
  const hitbox = getHitbox(first, { ...move, ...firstHit, id: move.id, hitId: firstHit.id });
  assert.equal(hitbox.x, first.x - flame.width / 2);
  assert.equal(hitbox.y, first.y + flame.originY);
  assert.equal(hitbox.w, flame.width);
  assert.equal(hitbox.h, flame.height);
  assert.equal(getNovaDownAirFlame(firstHit.start - 0.001), null);
  assert.equal(getNovaDownAirFlame(lastHit.start + lastHit.duration + 0.001), null);
  const visual = new CanvasRenderer({}).fighterVisualState({
    characterId: "nova",
    action: "airDown",
    actionTime: activeTime,
    onGround: false,
    shield: false,
    hitstun: 0,
    vx: 0,
    vy: 0
  }, 0);
  assert.equal(visual.pose, "idle");
});

test("ground running ramps from 40 percent to full speed over 0.4 seconds", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 900;
  first.y = STAGES.final.platforms[0].y - first.h / 2;

  simulation.step(match, inputs({ moveX: 1 }), 1 / 60);
  assert.equal(first.vx, first.stats.runSpeed * MOVEMENT.groundRunStartSpeedScale);
  assert.equal(first.runRampDirection, 1);

  stepFrames(simulation, match, 24, inputs({ moveX: 1 }));
  assert.equal(first.runRampElapsed, MOVEMENT.groundRunRampDuration);
  assert.ok(Math.abs(first.vx - first.stats.runSpeed) < 1e-9);
});

test("run turnaround keeps forward inertia before accelerating in reverse", () => {
  const speedBattle = createBattle();
  speedBattle.second.x = 900;
  speedBattle.first.y = STAGES.final.platforms[0].y - speedBattle.first.h / 2;
  stepFrames(speedBattle.simulation, speedBattle.match, 37, inputs({ moveX: 1 }));
  const forwardSpeed = speedBattle.first.vx;
  speedBattle.simulation.step(speedBattle.match, inputs({ moveX: -1 }), 1 / 60);

  assert.ok(speedBattle.first.runTurn);
  assert.equal(speedBattle.first.facing, -1);
  assert.ok(speedBattle.first.vx > 0);
  assert.ok(speedBattle.first.vx < forwardSpeed);
  assert.equal(speedBattle.first.runRampDirection, 0);
  assert.equal(MOVEMENT.runTurnDuration, 15 / 60);

  stepFrames(
    speedBattle.simulation,
    speedBattle.match,
    MOVEMENT.runTurnDuration * 60,
    inputs({ moveX: -1 })
  );
  assert.equal(speedBattle.first.runTurn, null);
  assert.ok(speedBattle.first.vx <= 0);
  speedBattle.simulation.step(speedBattle.match, inputs({ moveX: -1 }), 1 / 60);
  assert.ok(speedBattle.first.vx < 0);
  assert.equal(speedBattle.first.runRampDirection, -1);

  const lockedTurn = createBattle();
  lockedTurn.second.x = 900;
  lockedTurn.first.y = STAGES.final.platforms[0].y - lockedTurn.first.h / 2;
  stepFrames(lockedTurn.simulation, lockedTurn.match, 37, inputs({ moveX: 1 }));
  lockedTurn.simulation.step(lockedTurn.match, inputs({ moveX: -1 }), 1 / 60);
  lockedTurn.simulation.step(lockedTurn.match, inputs({ moveX: 1 }), 1 / 60);
  assert.ok(lockedTurn.first.runTurn);
  assert.equal(lockedTurn.first.runTurn.direction, -1);
  assert.equal(lockedTurn.first.facing, -1);

  const { simulation, match, first, second } = createBattle();
  second.x = 900;
  first.y = STAGES.final.platforms[0].y - first.h / 2;
  stepFrames(simulation, match, 37, inputs({ moveX: 1 }));

  simulation.step(match, inputs({ moveX: -1, attack: true }), 1 / 60);

  assert.equal(first.action, "side");
  assert.equal(first.facing, -1);
  assert.equal(first.runTurn, null);
  assert.equal(first.runRampElapsed, 0);
});

test("jump-canceling run turnaround preserves momentum for a reverse aerial rush", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 1000;
  first.y = STAGES.final.platforms[0].y - first.h / 2;
  stepFrames(simulation, match, 37, inputs({ moveX: 1 }));
  const forwardSpeed = first.vx;

  simulation.step(match, inputs({ moveX: -1, jump: true }), 1 / 60);

  assert.equal(first.onGround, false);
  assert.equal(first.facing, -1);
  assert.equal(first.runTurn, null);
  assert.ok(first.vx > 0);
  assert.ok(first.vx < forwardSpeed);

  simulation.step(match, inputs({ moveX: 1, attack: true }), 1 / 60);
  assert.equal(first.action, "airBack");
  assert.equal(first.facing, -1);
});

test("ground run speed reduction is not applied in the air", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 900;
  first.x = 640;
  first.y = 150;
  first.onGround = false;
  first.vx = first.stats.runSpeed * 0.8;
  first.runRampElapsed = 0;
  first.runRampDirection = 0;

  simulation.step(match, inputs({ moveX: 1 }), 1 / 60);

  assert.ok(first.vx > first.stats.runSpeed * MOVEMENT.groundRunStartSpeedScale);
  assert.equal(first.runRampElapsed, 0);
});

test("Nova's down-special bonus applies to shield damage and is consumed", () => {
  const { simulation, match, first, second } = createBattle();
  first.novaCharge = 4;
  second.shield = true;
  const shieldBefore = second.shieldHp;
  simulation.startMove(first, getMove("nova", "jab1"));
  first.actionTime = 0.06;
  simulation.updateAttacks(match);

  assert.ok(Math.abs((shieldBefore - second.shieldHp) - 6.72) < 0.000001);
  assert.equal(first.novaCharge, 0);
});

test("Nova back air gains its fourth hit and longer recovery only after contact", () => {
  const contactBattle = createBattle();
  const { simulation, match, first, second } = contactBattle;
  first.onGround = false;
  first.x = 600;
  first.y = 350;
  first.facing = 1;
  second.x = 545;
  second.y = 350;
  simulation.startMove(first, getMove("nova", "airBack"));
  for (const time of [0.12, 0.18, 0.24, 0.32]) {
    first.actionTime = time;
    first.hitlag = 0;
    second.hitlag = 0;
    simulation.updateAttacks(match);
  }
  assert.equal(second.damage, 20);
  assert.equal(first.move.total, first.move.contactTotal);

  const whiffBattle = createBattle();
  whiffBattle.second.x = 900;
  whiffBattle.simulation.startMove(whiffBattle.first, getMove("nova", "airBack"));
  whiffBattle.first.actionTime = 0.32;
  whiffBattle.simulation.updateAttacks(whiffBattle.match);
  assert.equal(whiffBattle.first.moveState.contact, false);
  assert.equal(whiffBattle.first.move.total, 0.6);
});

test("Nova neutral special creates a beam that disappears when it hits", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 760;
  simulation.step(match, inputs({ special: true }), 1 / 60);
  stepFrames(simulation, match, 50);

  assert.equal(second.damage, 7.2);
  assert.equal(match.projectiles.length, 0);
  assert.equal(first.action, null);
});

test("Nova side special can aim its rocket punch upward during startup", () => {
  const { simulation, match, second } = createBattle();
  second.x = 1000;
  simulation.step(match, inputs({ moveX: 1, special: true }), 1 / 60);
  stepFrames(simulation, match, 16, inputs({ moveX: 1, moveY: -1, special: true }));

  assert.equal(match.projectiles.length, 1);
  assert.equal(match.projectiles[0].kind, "rocketPunch");
  assert.ok(match.projectiles[0].vy < 0);
});

test("Nova projectiles cancel each other on contact", () => {
  const { simulation, match, first, second } = createBattle();
  first.x = 500;
  second.x = 700;
  simulation.spawnProjectile(match, first, getMove("nova", "specialNeutral").projectile, normalizeBattleInput());
  simulation.spawnProjectile(match, second, getMove("nova", "specialNeutral").projectile, normalizeBattleInput());
  simulation.updateProjectiles(match, 1 / 60);
  assert.equal(match.projectiles.length, 0);
});

test("projectiles pass upward through soft platforms but stop on their top surface", () => {
  const upwardBattle = createBattle();
  upwardBattle.match.stage = STAGES.battlefield;
  upwardBattle.simulation.spawnProjectile(
    upwardBattle.match,
    upwardBattle.first,
    getMove("nova", "specialNeutral").projectile,
    normalizeBattleInput()
  );
  const upward = upwardBattle.match.projectiles[0];
  upward.x = 420;
  upward.y = 410;
  upward.vx = 0;
  upward.vy = -1200;
  stepFrames(upwardBattle.simulation, upwardBattle.match, 5);
  assert.equal(upwardBattle.match.projectiles.length, 1);
  assert.ok(upwardBattle.match.projectiles[0].y < 380);

  const downwardBattle = createBattle();
  downwardBattle.match.stage = STAGES.battlefield;
  downwardBattle.simulation.spawnProjectile(
    downwardBattle.match,
    downwardBattle.first,
    getMove("nova", "specialNeutral").projectile,
    normalizeBattleInput()
  );
  const downward = downwardBattle.match.projectiles[0];
  downward.x = 420;
  downward.y = 350;
  downward.vx = 0;
  downward.vy = 1800;
  downwardBattle.simulation.updateProjectiles(downwardBattle.match, 1 / 60);
  assert.equal(downwardBattle.match.projectiles.length, 0);
});

test("projectiles still stop on the solid main platform", () => {
  const { simulation, match, first } = createBattle();
  simulation.spawnProjectile(match, first, getMove("nova", "specialNeutral").projectile, normalizeBattleInput());
  const projectile = match.projectiles[0];
  projectile.x = 640;
  projectile.y = 540;
  projectile.vx = 0;
  projectile.vy = -1200;
  simulation.updateProjectiles(match, 1 / 60);
  assert.equal(match.projectiles.length, 0);
});

test("Nova up special enters controllable special fall when another action is pressed", () => {
  const { simulation, match, first } = createBattle();
  first.y = 350;
  first.onGround = false;
  simulation.step(match, inputs({ up: true, special: true }), 1 / 60);
  assert.equal(first.recovery?.phase, "thrust");
  simulation.step(match, inputs({ moveX: 1, moveY: -1 }), 1 / 60);
  assert.ok(first.vx > 0);
  simulation.step(match, inputs({ attack: true }), 1 / 60);
  assert.equal(first.recovery?.phase, "fall");
  assert.equal(first.action, "specialFall");
  assert.equal(first.move, null);
});

test("Nova up special vertical thrust is reduced to seventy percent", () => {
  const { simulation, first } = createBattle();
  first.vy = 0;
  simulation.startRecovery(first);

  assert.equal(NOVA_RECOVERY.verticalScale, 0.7);
  assert.equal(first.vy, NOVA_RECOVERY.neutralSpeed * 0.7 * 0.72);
});

test("Nova back throw deals 2 percent before its guaranteed 10.5 percent follow-up", () => {
  const { simulation, match, first, second } = createBattle();
  simulation.startGrabHold(match, first, second);
  simulation.step(match, inputs({ moveX: -1 }), 1 / 60);
  for (let frame = 0; frame < 90 && second.grabbedBy; frame += 1) {
    simulation.step(match, inputs(), 1 / 60);
  }

  assert.equal(second.damage, 12.5);
  assert.equal(second.grabbedBy, null);
  assert.ok(second.vx < 0);
});

test("Nova's stored charge is spent by the 2 percent opening of back throw", () => {
  const { simulation, match, first, second } = createBattle();
  first.novaCharge = 4;
  simulation.startGrabHold(match, first, second);
  simulation.step(match, inputs({ moveX: -1 }), 1 / 60);
  for (let frame = 0; frame < 90 && second.grabbedBy; frame += 1) {
    simulation.step(match, inputs(), 1 / 60);
  }
  assert.equal(second.damage, 13.7);
  assert.equal(first.novaCharge, 0);
});

test("Nova down throw deals three 2 percent hits and a 4 percent finisher", () => {
  const { simulation, match, first, second } = createBattle();
  simulation.startGrabHold(match, first, second);
  simulation.step(match, inputs({ moveY: 1 }), 1 / 60);
  stepFrames(simulation, match, 100);

  assert.equal(second.damage, 10);
  assert.equal(second.grabbedBy, null);
});

test("air movement keeps facing while an air special may reverse it", () => {
  const { simulation, match, first } = createBattle();
  first.onGround = false;
  first.y = 300;
  first.facing = 1;
  simulation.step(match, inputs({ moveX: -1 }), 1 / 60);
  assert.equal(first.facing, 1);

  simulation.step(match, inputs(), 1 / 60);
  simulation.step(match, inputs({ moveX: -1, special: true }), 1 / 60);
  assert.equal(first.facing, -1);
  assert.ok(first.move);
});

test("shielding is stationary", () => {
  const { simulation, match, first } = createBattle();
  first.vx = 180;
  first.shield = true;
  first.lastInput = normalizeBattleInput({ moveX: 1, shield: true });
  simulation.step(match, inputs({ moveX: 1, shield: true }), 1 / 60);
  assert.equal(first.shield, true);
  assert.equal(first.vx, 0);
});

test("pressing the weak attack button while shielding performs a standing grab", () => {
  const { simulation, match, first, second } = createBattle();
  first.y = STAGES.final.platforms[0].y - first.h / 2;
  first.onGround = true;
  first.shield = true;
  first.lastInput = normalizeBattleInput({ shield: true });
  second.x = 900;

  simulation.step(match, inputs({ shield: true, attack: true }), 1 / 60);

  assert.equal(first.action, "grab");
  assert.equal(first.move.type, "grab");
  assert.equal(first.shield, false);
});

test("a shielded hit causes shield stun without damage, hitstun, or launch", () => {
  const { simulation, match, first, second } = createBattle();
  first.x = 500;
  second.x = 550;
  first.y = 500 - first.h / 2;
  second.y = 500 - second.h / 2;
  first.onGround = true;
  second.onGround = true;
  second.shield = true;
  second.lastInput = normalizeBattleInput({ shield: true });
  const startX = second.x;
  const startY = second.y;

  simulation.step(match, inputs({ attack: true }, { shield: true }), 1 / 60);
  for (let frame = 0; frame < 7; frame += 1) {
    simulation.step(match, inputs({}, { shield: true }), 1 / 60);
  }

  assert.ok(second.shieldHp < second.shieldMax);
  assert.equal(second.damage, 0);
  assert.equal(second.hitstun, 0);
  assert.equal(second.tumbling, false);
  assert.equal(second.onGround, true);
  assert.equal(second.x, startX);
  assert.equal(second.y, startY);
  assert.equal(second.shield, true);
});

test("final smash activation is resolved by the shared simulation", () => {
  const { simulation, match, first } = createBattle({ finalSmash: true });
  first.finalGauge = 100;
  simulation.step(match, inputs({ special: true }), 1 / 60);
  assert.equal(match.finalSmash?.fighterId, first.id);
  assert.equal(first.finalGauge, 0);
});

test("final smash snapshots expose the same active hitbox used by the attack", () => {
  const { simulation, match, first } = createBattle({ finalSmash: true });
  first.finalGauge = FINAL_SMASH.maxGauge;
  first.facing = -1;
  simulation.step(match, inputs({ special: true }), 1 / 60);

  while (match.finalSmash.elapsed < FINAL_SMASH.punchAt) {
    simulation.step(match, inputs(), 1 / 60);
  }

  const expected = getHitbox(first, getMove("nova", "finalPunch"));
  assert.deepEqual(simulation.snapshot(match).finalSmash.hitbox, {
    ...expected,
    hitId: "finalPunch"
  });

  while (match.finalSmash.elapsed < FINAL_SMASH.punchAt + FINAL_SMASH.punchActiveDuration) {
    simulation.step(match, inputs(), 1 / 60);
  }
  assert.equal(simulation.snapshot(match).finalSmash.hitbox, null);
});

test("the debug renderer draws the final smash attack range", () => {
  const calls = [];
  const renderer = new CanvasRenderer({});
  const ctx = {
    save() {},
    restore() {},
    fillRect: (...values) => calls.push(["fill", ...values]),
    strokeRect: (...values) => calls.push(["stroke", ...values])
  };
  renderer.drawFinalSmashDebugHitbox(ctx, { x: 10, y: 20, w: 190, h: 130 });
  assert.deepEqual(calls, [
    ["fill", 10, 20, 190, 130],
    ["stroke", 10, 20, 190, 130]
  ]);
});

test("Nova final smash freezes time and hits multiple fighters with one wide punch", () => {
  const { simulation, match, first, second } = createBattle({ finalSmash: true });
  const third = simulation.createFighter({
    id: "p3",
    name: "P3",
    characterId: "nova",
    slot: 3,
    spawn: [610, 464],
    facing: -1,
    rules: match.rules,
    spawnOnGround: true
  });
  match.fighters.set(third.id, third);
  second.x = 555;
  third.x = 690;
  first.finalGauge = 100;
  first.novaCharge = 4;
  const elapsedBefore = match.elapsed;
  const secondXBefore = second.x;

  simulation.step(match, inputs({ special: true }), 1 / 60);
  for (let frame = 0; frame < 20; frame += 1) {
    simulation.step(match, new Map(), 1 / 60);
  }
  assert.equal(second.damage, 0);
  assert.equal(second.x, secondXBefore);

  for (let frame = 0; frame < 45 && match.finalSmash; frame += 1) {
    simulation.step(match, new Map(), 1 / 60);
  }

  assert.equal(match.elapsed, elapsedBefore);
  assert.equal(second.damage, 32.5);
  assert.equal(third.damage, 32.5);
  assert.equal(first.finalGauge, 0);
  assert.equal(second.finalGauge, 0);
  assert.equal(third.finalGauge, 0);
  assert.equal(first.novaCharge, 4);
  assert.equal(match.finalSmash, null);
});

test("the shared hit boundary rejects self hits including final smash attacks", () => {
  const { simulation, match, first } = createBattle({ finalSmash: true });
  const before = {
    damage: first.damage,
    hp: first.hp,
    hitstun: first.hitstun,
    finalGauge: first.finalGauge
  };

  assert.equal(simulation.applyHit(match, first, first, getMove("nova", "finalPunch")), false);
  assert.deepEqual({
    damage: first.damage,
    hp: first.hp,
    hitstun: first.hitstun,
    finalGauge: first.finalGauge
  }, before);
});

test("stock KO and respawn are resolved by the shared simulation", () => {
  const { simulation, match, second } = createBattle();
  second.x = match.stage.blast.right + 1;
  const koX = second.x;
  simulation.step(match, inputs(), 1 / 60);
  assert.equal(second.alive, false);
  assert.equal(second.stocks, 1);
  assert.ok(second.respawn > 0);
  const koEvent = match.events.find(event => event.kind === "ko");
  assert.equal(koEvent.x, koX);
  assert.equal(koEvent.y, second.y);

  for (let frame = 0; frame < 100; frame += 1) simulation.step(match, inputs(), 1 / 60);
  assert.equal(second.alive, true);
  assert.equal(second.damage, 0);
  assert.ok(second.respawnPlatform > 0);
});

test("practice KO uses the same engine and immediately resets the target", () => {
  const simulation = new BattleSimulation();
  const rules = { ...DEFAULT_RULES, mode: "practice", stage: "final", finalSmash: false, gameSpeed: 1 };
  const match = simulation.createMatch({ id: "practice", rules });
  const target = simulation.createFighter({
    id: "target",
    name: "Target",
    characterId: "nova",
    slot: 1,
    spawn: [600, 464],
    rules,
    inputEnabled: false,
    spawnOnGround: true
  });
  target.damage = 80;
  target.hp = 25;
  target.x = match.stage.blast.right + 1;
  match.fighters.set(target.id, target);
  simulation.step(match, new Map([[target.id, normalizeBattleInput()]]), 1 / 60);
  assert.equal(target.alive, true);
  assert.equal(target.x, target.spawnX);
  assert.equal(target.damage, 0);
  assert.equal(target.hp, target.maxHp);
  assert.ok(match.events.some(event => event.kind === "ko"));
  assert.equal(simulation.shouldFinish(match), false);
});

test("practice mode can enable final smash rules", () => {
  const practice = new PracticeMode({
    inputManager: {},
    audioManager: { play() {} },
    assetManager: {},
    playerNameProvider: () => "P1"
  });
  const match = practice.createPractice({
    stage: "final",
    debug: false,
    finalSmash: true,
    player: "nova",
    enemy: "nova"
  });

  assert.equal(match.rules.finalSmash, true);
  assert.equal(match.rules.gameSpeed, 1);
});

test("practice mode accepts only the supported game speeds", () => {
  const practice = new PracticeMode({
    inputManager: {},
    audioManager: { play() {} },
    assetManager: {},
    playerNameProvider: () => "P1"
  });
  practice.data = practice.createPractice({
    stage: "final",
    debug: false,
    finalSmash: false,
    player: "nova",
    enemy: "nova",
    gameSpeed: 1 / 4
  });

  assert.deepEqual(PRACTICE_GAME_SPEEDS, [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1]);
  assert.equal(practice.data.rules.gameSpeed, 1 / 4);
  assert.equal(practice.setGameSpeed("0.5"), 1 / 2);
  assert.equal(practice.data.rules.gameSpeed, 1 / 2);
  assert.equal(normalizePracticeGameSpeed("unsupported"), 1);
});

test("the shared simulation replays deterministically after rollback", () => {
  const { simulation, match } = createBattle();
  match.rollback = new RollbackManager(30);
  match.rollback.capture(match);
  const sequence = [inputs({ attack: true }), ...Array.from({ length: 8 }, () => inputs())];
  for (const frameInputs of sequence) simulation.step(match, frameInputs, 1 / 60);
  const expected = simulation.snapshot(match).fighters.map(fighter => ({
    id: fighter.id,
    x: fighter.x,
    y: fighter.y,
    damage: fighter.damage,
    action: fighter.action
  }));

  assert.equal(match.rollback.restore(match, 0), true);
  for (const frameInputs of sequence) simulation.step(match, frameInputs, 1 / 60);
  const replayed = simulation.snapshot(match).fighters.map(fighter => ({
    id: fighter.id,
    x: fighter.x,
    y: fighter.y,
    damage: fighter.damage,
    action: fighter.action
  }));
  assert.deepEqual(replayed, expected);
});

test("vertical fighter overlap does not cause a stomp", () => {
  const { first, second } = createBattle();
  first.x = 500;
  first.y = 300;
  first.vy = 180;
  first.onGround = false;
  second.x = first.x;
  second.y = first.y + first.h - 2;
  second.vy = -40;
  second.onGround = false;
  const before = [first.y, first.vy, second.y, second.vy];

  assert.equal(resolveFighterBodyCollision(first, second), null);
  assert.deepEqual([first.y, first.vy, second.y, second.vy], before);
  assert.equal(first.hitstun, 0);
  assert.equal(second.hitstun, 0);
});

test("dodging fighters do not jostle", () => {
  const { first, second } = createBattle();
  first.x = 500;
  second.x = 520;
  first.dodge = { type: "roll", direction: 1, elapsed: 0 };
  const before = [first.x, second.x];

  assert.equal(resolveFighterBodyCollision(first, second), null);
  assert.deepEqual([first.x, second.x], before);

  first.dodge = null;
  first.ledge = { x: 240, y: 500, side: -1 };
  first.ledgeRoll = { elapsed: 0 };
  assert.equal(resolveFighterBodyCollision(first, second), null);
  assert.deepEqual([first.x, second.x], before);
});

test("a grounded fighter always wins a horizontal push against an airborne fighter", () => {
  const { first, second } = createBattle();
  first.x = 500;
  first.y = 460;
  first.onGround = true;
  first.weightClass = "ultraLight";
  first.currentInput = normalizeBattleInput();
  second.x = 520;
  second.y = first.y;
  second.onGround = false;
  second.weightClass = "ultraHeavy";
  second.currentInput = normalizeBattleInput({ moveX: -1 });
  const groundX = first.x;
  const airX = second.x;
  const overlap = first.w - Math.abs(second.x - first.x);

  const result = resolveFighterBodyCollision(first, second);

  assert.equal(result.winner, first);
  assert.equal(first.x, groundX);
  assert.ok(second.x > airX);
  assert.ok(Math.abs(
    second.x - airX - (overlap + BODY_COLLISION.separation) * BODY_COLLISION.airSeparationScale
  ) < 1e-9);
});

test("two airborne fighters only apply the small air jostle correction", () => {
  const { first, second } = createBattle();
  first.x = 500;
  first.y = 420;
  first.onGround = false;
  first.currentInput = normalizeBattleInput({ moveX: 1 });
  second.x = 520;
  second.y = first.y;
  second.onGround = false;
  second.currentInput = normalizeBattleInput();
  const firstX = first.x;
  const secondX = second.x;
  const overlap = first.w - Math.abs(second.x - first.x);

  const result = resolveFighterBodyCollision(first, second);

  assert.equal(result.winner, first);
  assert.equal(first.x, firstX);
  assert.ok(Math.abs(
    second.x - secondX - (overlap + BODY_COLLISION.separation) * BODY_COLLISION.airSeparationScale
  ) < 1e-9);
});

test("ground push priority is independent of fighter argument order", () => {
  const { first, second } = createBattle();
  first.x = 500;
  first.y = 460;
  first.onGround = false;
  first.currentInput = normalizeBattleInput({ moveX: 1 });
  second.x = 520;
  second.y = first.y;
  second.onGround = true;
  second.currentInput = normalizeBattleInput();
  const groundX = second.x;

  const result = resolveFighterBodyCollision(first, second);

  assert.equal(result.winner, second);
  assert.equal(second.x, groundX);
  assert.ok(first.x < 500);
});

test("a ledge getup pushes a grounded fighter inward instead of passing through", () => {
  const { first, second } = createBattle();
  first.x = 220;
  first.y = 525;
  first.vy = 100;
  first.onGround = false;
  second.x = 290;
  second.y = 500 - second.h / 2;
  second.onGround = true;
  const targetStartX = second.x;

  assert.equal(tryGrabLedge(STAGES.final, first, {}), true);
  assert.equal(updateLedgeHang(first, { right: true }, false, false, false, 1 / 60), "climb");

  let push = null;
  for (let frame = 0; frame < 20 && first.ledge; frame += 1) {
    updateLedgeHang(first, {}, false, false, false, 1 / 60);
    push = resolveFighterBodyCollision(first, second) || push;
  }

  assert.ok(push);
  assert.equal(push.winner, first);
  assert.ok(second.x > targetStartX);
});

test("battlefield platforms meet edge to edge with equal vertical spacing", () => {
  const [main, left, right, upper] = STAGES.battlefield.platforms;
  assert.equal(left.x + left.w, upper.x);
  assert.equal(upper.x + upper.w, right.x);
  assert.equal(left.y, right.y);
  assert.equal(main.y - left.y, left.y - upper.y);
});

test("small battlefield platforms match battlefield side platforms", () => {
  const [, smallLeft, smallRight] = STAGES.small.platforms;
  const [, battlefieldLeft, battlefieldRight] = STAGES.battlefield.platforms;
  assert.deepEqual(smallLeft, battlefieldLeft);
  assert.deepEqual(smallRight, battlefieldRight);
});

test("every main stage platform uses the same inverted-triangle collision shape", () => {
  for (const stage of Object.values(STAGES)) {
    const main = stage.platforms.find(platform => platform.type === "main");
    const triangle = getMainPlatformTriangle(main);
    assert.equal(main.shape, "invertedTriangle");
    assert.equal(main.depth, MAIN_PLATFORM_DEPTH);
    assert.equal(triangle.left, main.x);
    assert.equal(triangle.right, main.x + main.w);
    assert.equal(triangle.apexX, main.x + main.w / 2);
    assert.equal(triangle.apexY, main.y + main.depth);
  }
});

test("practice and versus matches reference the same canonical stage collision data", () => {
  const simulation = new BattleSimulation();
  const practice = simulation.createMatch({
    id: "practice-stage",
    rules: { ...DEFAULT_RULES, mode: "practice", stage: "final" }
  });
  const versus = simulation.createMatch({
    id: "versus-stage",
    rules: { ...DEFAULT_RULES, mode: "stock", stage: "final" }
  });

  assert.equal(practice.stage, STAGES.final);
  assert.equal(versus.stage, STAGES.final);
  assert.equal(practice.stage, versus.stage);
  assert.equal(practice.stage.platforms[0].shape, "invertedTriangle");
  assert.equal(practice.stage.platforms[0].depth, MAIN_PLATFORM_DEPTH);
});

test("the main-platform slope uses twice the depth for smoother outward movement", () => {
  const main = STAGES.final.platforms.find(platform => platform.type === "main");
  const triangle = getMainPlatformTriangle(main);
  assert.equal(triangle.depth, 360);
  assert.equal(triangle.halfWidth / triangle.depth, 10 / 9);
});

test("cached stage layers crop unused world space", () => {
  const assets = new AssetManager();
  const bounds = assets.getStageBounds(STAGES.battlefield);
  assert.deepEqual(bounds, { x: 232, y: 242, width: 816, height: 636 });
  assert.ok(bounds.width * bounds.height < 1280 * 720);
});

test("the main-platform slope pushes an ascending fighter outward", () => {
  const { first } = createBattle();
  first.x = 300;
  first.y = 545;
  first.vx = 0;
  first.vy = -400;
  first.onGround = false;
  const previousX = first.x;
  const previousY = first.y + 7;

  const collision = resolveStageCollision(STAGES.final, first, previousX, previousY, {});

  assert.equal(collision.hitSlope, true);
  assert.equal(collision.hitWall, false);
  assert.ok(collision.slopeNormal.x < 0);
  assert.ok(first.x < previousX);
  assert.equal(first.vy, -400);
  assert.equal(resolveImpactAfterCollision(first, collision), null);
  assert.equal(first.vy, -400);
});

test("the main-platform slope reflects a fighter while launch force remains", () => {
  const { first } = createBattle();
  first.x = 300;
  first.y = 545;
  first.vx = 0;
  first.vy = -400;
  first.onGround = false;
  first.hitstun = 0.5;
  first.tumbling = true;

  const collision = resolveStageCollision(STAGES.final, first, first.x, first.y + 7, {});
  const impact = resolveImpactAfterCollision(first, collision);

  assert.equal(impact, "slopeBounce");
  assert.ok(first.vx < 0);
  assert.ok(first.vx * collision.slopeNormal.x + first.vy * collision.slopeNormal.y > 0);
});

test("Nova can slide out from inside the slope and grab the ledge during recovery", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 900;
  first.x = 300;
  first.y = 545;
  first.onGround = false;
  simulation.startRecovery(first);

  simulation.step(match, inputs(), 1 / 60);

  assert.ok(first.ledge);
  assert.equal(first.ledge.x, STAGES.final.platforms[0].x);
  assert.equal(first.recovery, null);
});

test("ledge grab requires an established airborne state and no attack motion", () => {
  const { first } = createBattle();
  first.x = 220;
  first.y = 525;
  first.vy = 100;

  first.onGround = true;
  assert.equal(tryGrabLedge(STAGES.final, first, {}), false);

  first.onGround = false;
  assert.equal(tryGrabLedge(STAGES.final, first, {}, { wasGrounded: true }), false);

  first.action = null;
  first.move = getMove("nova", "down");
  assert.equal(tryGrabLedge(STAGES.final, first, {}), false);

  first.move = null;
  assert.equal(tryGrabLedge(STAGES.final, first, {}), true);
});

test("Nova jump heights follow battlefield platform spacing", () => {
  const platformGap = STAGES.battlefield.platforms[0].y - STAGES.battlefield.platforms[1].y;
  const measureJumpRise = airJump => {
    const { simulation, match, first } = createBattle();
    first.x = 400;
    first.y = STAGES.final.platforms[0].y - first.h / 2;
    first.onGround = !airJump;
    first.jumps = airJump ? 1 : first.maxJumps;
    const startY = first.y;
    let topY = startY;

    simulation.step(match, inputs({ jump: true }), 1 / 60);
    for (let frame = 0; frame < 90; frame += 1) {
      topY = Math.min(topY, first.y);
      if (first.vy >= 0) break;
      simulation.step(match, inputs({ jump: true }), 1 / 60);
    }
    return startY - topY;
  };

  const firstJumpHeight = measureJumpRise(false);
  const secondJumpHeight = measureJumpRise(true);
  assert.ok(Math.abs(firstJumpHeight - platformGap * 1.15) < 0.02);
  assert.ok(Math.abs(secondJumpHeight - firstJumpHeight * 1.2) < 0.02);
});

test("jump arcs keep their height while extending airtime by about twenty percent", () => {
  const { simulation, match, first, second } = createBattle();
  const dt = 1 / 60;
  first.x = 500;
  first.y = STAGES.final.platforms[0].y - first.h / 2;
  first.onGround = true;
  second.x = 900;

  let baselineY = 0;
  let baselineVy = first.stats.jumpSpeed;
  let baselineFrames = 0;
  const baselineGravity = first.stats.gravity * MOVEMENT.normalGravityMultiplier;
  do {
    baselineVy += baselineGravity * dt;
    baselineY += baselineVy * dt;
    baselineFrames += 1;
  } while (baselineY < 0 && baselineFrames < 180);

  simulation.step(match, inputs({ jump: true }), dt);
  let airborneFrames = 1;
  while (!first.onGround && airborneFrames < 180) {
    simulation.step(match, inputs({ jump: true }), dt);
    airborneFrames += 1;
  }

  assert.equal(MOVEMENT.jumpDurationMultiplier, 1.2);
  assert.ok(airborneFrames >= baselineFrames * 1.15);
  assert.ok(airborneFrames <= baselineFrames * 1.25 + 1);
});

test("ground short hops reach half of full-hop height in every enabled trigger mode", () => {
  const measureGroundJump = ({ mode, down = false, releaseAfterStart = false }) => {
    const { simulation, match, first, second } = createBattle();
    first.x = 400;
    second.x = 1000;
    first.y = STAGES.final.platforms[0].y - first.h / 2;
    first.onGround = true;
    first.jumps = first.maxJumps;
    const startY = first.y;
    let topY = startY;

    simulation.step(match, inputs({
      jump: true,
      moveY: down ? 1 : 0,
      shortHopMode: mode
    }), 1 / 60);
    for (let frame = 0; frame < 120; frame += 1) {
      topY = Math.min(topY, first.y);
      if (first.vy >= 0) break;
      simulation.step(match, inputs({
        jump: !releaseAfterStart,
        moveY: down ? 1 : 0,
        shortHopMode: mode
      }), 1 / 60);
    }
    return startY - topY;
  };

  const fullHop = measureGroundJump({ mode: "both" });
  const releaseShortHop = measureGroundJump({ mode: "release", releaseAfterStart: true });
  const downShortHop = measureGroundJump({ mode: "down", down: true });
  const bothReleaseShortHop = measureGroundJump({ mode: "both", releaseAfterStart: true });
  const bothDownShortHop = measureGroundJump({ mode: "both", down: true });

  for (const shortHop of [releaseShortHop, downShortHop, bothReleaseShortHop, bothDownShortHop]) {
    assert.ok(Math.abs(shortHop / fullHop - SHORT_HOP.heightRatio) < 0.0001);
  }
  assert.ok(Math.abs(measureGroundJump({ mode: "down", releaseAfterStart: true }) - fullHop) < 0.02);
  assert.ok(Math.abs(measureGroundJump({ mode: "release", down: true }) - fullHop) < 0.02);
});

test("the second jump has one fixed height and never becomes a short hop", () => {
  const measureAirJump = ({ mode, down = false, releaseAfterStart = false }) => {
    const { simulation, match, first, second } = createBattle();
    first.x = 400;
    second.x = 1000;
    first.y = 420;
    first.onGround = false;
    first.jumps = 1;
    const startY = first.y;
    let topY = startY;

    simulation.step(match, inputs({
      jump: true,
      moveY: down ? 1 : 0,
      shortHopMode: mode
    }), 1 / 60);
    for (let frame = 0; frame < 120; frame += 1) {
      topY = Math.min(topY, first.y);
      if (first.vy >= 0) break;
      simulation.step(match, inputs({
        jump: !releaseAfterStart,
        moveY: down ? 1 : 0,
        shortHopMode: mode
      }), 1 / 60);
    }
    return startY - topY;
  };

  const fixedHeight = measureAirJump({ mode: "both" });
  assert.ok(fixedHeight > 0);
  for (const variant of [
    { mode: "release", releaseAfterStart: true },
    { mode: "down", down: true },
    { mode: "both", down: true, releaseAfterStart: true }
  ]) {
    assert.ok(Math.abs(measureAirJump(variant) - fixedHeight) < 0.02);
  }
});

test("landing lag and action recovery lock facing and controls", () => {
  const landingBattle = createBattle();
  const landingFighter = landingBattle.first;
  landingFighter.y = STAGES.final.platforms[0].y - landingFighter.h / 2;
  landingFighter.facing = 1;
  landingFighter.vx = 0;
  landingFighter.landingLag = 0.2;
  landingFighter.action = "landing";
  landingBattle.simulation.step(
    landingBattle.match,
    inputs({ moveX: -1, jump: true, attack: true }),
    1 / 60
  );
  assert.equal(landingFighter.facing, 1);
  assert.equal(landingFighter.vx, 0);
  assert.equal(landingFighter.action, "landing");
  assert.equal(landingFighter.onGround, true);

  const attackBattle = createBattle();
  const attackingFighter = attackBattle.first;
  attackingFighter.facing = 1;
  attackBattle.simulation.step(attackBattle.match, inputs({ attack: true }), 1 / 60);
  attackBattle.simulation.step(attackBattle.match, inputs({ moveX: -1 }), 1 / 60);
  assert.equal(attackingFighter.facing, 1);
  assert.equal(attackingFighter.vx, 0);
  assert.equal(attackingFighter.action, "jab1");
});

test("shield release lag locks movement and facing from its first frame", () => {
  const { simulation, match, first } = createBattle();
  first.facing = 1;
  first.vx = 0;
  first.shield = true;
  first.lastInput = normalizeBattleInput({ shield: true });

  simulation.step(match, inputs({ moveX: -1 }), 1 / 60);

  assert.ok(first.shieldReleaseLag > 0);
  assert.equal(first.facing, 1);
  assert.equal(first.vx, 0);
});

test("side dodge finishes in 0.4 seconds and faces inward", () => {
  const { first } = createBattle();
  first.facing = 1;
  assert.equal(startDodge(first, { type: "roll", direction: 1 }), true);
  assert.equal(first.facing, -1);
  assert.equal(DODGE.roll.duration, 0.4);
  const previousDistance = 469 * DODGE.roll.duration;
  const currentDistance = DODGE.roll.speed * DODGE.roll.duration;
  assert.ok(Math.abs(currentDistance / previousDistance - 0.9) < 0.002);
  updateDodge(first, 0.2);
  assert.equal(first.vx, DODGE.roll.speed);
  updateDodge(first, 0.2);
  assert.equal(first.vx, DODGE.roll.speed);
});

test("ground side dodge stops at the edge of its starting platform", () => {
  const { simulation, match, first } = createBattle();
  const platform = STAGES.final.platforms[0];
  const edgeX = platform.x + platform.w - first.w / 2;
  first.x = edgeX - 4;
  first.y = platform.y - first.h / 2;
  first.onGround = true;
  first.facing = 1;

  simulation.step(match, inputs({ moveX: 1, shield: true }), 1 / 60);
  for (let frame = 0; frame < 30; frame += 1) {
    simulation.step(match, inputs({ moveX: 1, shield: true }), 1 / 60);
  }

  assert.ok(first.x <= edgeX);
  assert.equal(first.onGround, true);
});

test("air dodge has shorter duration and travel distance", () => {
  const { first } = createBattle();
  first.onGround = false;
  assert.equal(startDodge(first, { type: "airDodge", x: 1, y: 0 }), true);
  assert.equal(DODGE.airDodge.duration, 0.5);
  assert.equal(first.vx, 364);
  updateDodge(first, 0.49);
  assert.ok(first.dodge);
  updateDodge(first, 0.01);
  assert.equal(first.dodge, null);
  const originalDistance = 430 * 0.58;
  const shortenedDistance = DODGE.airDodge.speed * DODGE.airDodge.duration;
  assert.ok(Math.abs(shortenedDistance / originalDistance - 0.73) < 0.002);
});

test("landing immediately ends air dodge invulnerability and uses normal landing lag", () => {
  const { simulation, match, first } = createBattle();
  first.x = 600;
  first.y = 462;
  first.vy = 100;
  first.onGround = false;
  simulation.step(match, inputs({ moveY: 1, shield: true }), 1 / 60);
  assert.equal(first.onGround, true);
  assert.equal(first.dodge, null);
  assert.equal(first.dodgeInvuln, 0);
  assert.equal(first.action, "landing");
  assert.equal(first.landingLag, LANDING.normal);
});

test("ledge jump starts at the ledge and uses the shared jump multipliers", () => {
  const { first } = createBattle();
  first.x = 220;
  first.y = 525;
  first.vy = 100;
  first.onGround = false;
  assert.equal(tryGrabLedge(STAGES.final, first, {}), true);
  const startX = first.x;
  const startY = first.y;
  assert.equal(updateLedgeHang(first, { jump: true }, true, false, false, 1 / 60), "jump");
  assert.equal(first.x, startX);
  assert.equal(first.y, startY);
  assert.equal(first.vx, 0);
  assert.equal(
    first.vy,
    first.stats.airJumpSpeed / MOVEMENT.jumpDurationMultiplier * LEDGE.jumpSpeedMultiplier
  );
  assert.equal(first.jumpArcActive, true);
});

test("dropping from the ledge with down or away leaves only the air jump", () => {
  for (const dropInput of [{ down: true }, { left: true }]) {
    const { first } = createBattle();
    first.x = 220;
    first.y = 525;
    first.vy = 100;
    first.onGround = false;
    assert.equal(tryGrabLedge(STAGES.final, first, {}), true);
    assert.equal(first.jumps, first.maxJumps);

    assert.equal(updateLedgeHang(first, dropInput, false, false, false, 1 / 60), "drop");
    assert.equal(first.jumps, first.maxJumps - 1);
  }
});

test("ledge roll animates 1.2 times farther without reversing facing", () => {
  const { first } = createBattle();
  first.x = 220;
  first.y = 525;
  first.vy = 100;
  first.onGround = false;
  assert.equal(tryGrabLedge(STAGES.final, first, {}), true);
  const hangX = first.x;
  assert.equal(first.facing, 1);
  assert.equal(updateLedgeHang(first, { shield: true }, false, false, true, 1 / 60), "roll");
  assert.equal(first.x, hangX);
  assert.ok(first.ledgeRoll);
  const groundRollDistance = DODGE.roll.speed * DODGE.roll.duration;
  const expectedX = 240 + groundRollDistance * LEDGE.rollDistanceMultiplier;
  updateLedgeHang(first, {}, false, false, false, 1 / 60);
  assert.notEqual(first.x, expectedX);
  for (let frame = 0; frame < 30 && first.ledge; frame += 1) {
    updateLedgeHang(first, {}, false, false, false, 1 / 60);
  }
  assert.equal(first.ledge, null);
  assert.equal(first.x, expectedX);
  assert.ok(Math.abs(
    (first.x - 240) / groundRollDistance - LEDGE.rollDistanceMultiplier
  ) < Number.EPSILON * 2);
  assert.equal(first.facing, 1);
});

test("Nova ledge attack climbs continuously and uses its hand and body hitboxes", () => {
  const { first } = createBattle();
  first.x = 220;
  first.y = 525;
  first.vy = 100;
  first.onGround = false;
  assert.equal(tryGrabLedge(STAGES.final, first, {}), true);
  const hangX = first.x;
  const hangY = first.y;

  assert.equal(updateLedgeHang(first, { attack: true }, false, true, false, 1 / 60), "attack");
  assert.equal(first.x, hangX);
  assert.equal(first.y, hangY);
  assert.ok(first.ledgeAttack);
  assert.equal(first.move.hits.length, 2);
  assert.equal(first.move.hits[0].id, first.move.hits[1].id);
  assert.equal(first.move.hits[0].damage, 6.5);
  assert.equal(first.move.hits[0].angle, 30);
  assert.equal(first.move.hits[0].baseKnockback, 310);
  assert.equal(first.move.hits[0].knockbackGrowth, 4.2);
  assert.equal(first.ledgeAttack.invulnEnd, 0.24);
  assert.equal(first.invuln, 0.24);

  updateLedgeHang(first, {}, false, false, false, 1 / 60);
  assert.equal(first.x, hangX);
  assert.ok(first.y < hangY);
  updateLedgeHang(first, {}, false, false, false, 1 / 60);
  assert.ok(first.x > hangX);
  assert.ok(first.x < 240 + first.w / 2 + LEDGE.attackInset);
  assert.ok(first.y < hangY);

  for (let frame = 0; frame < 30 && first.ledge; frame += 1) {
    updateLedgeHang(first, {}, false, false, false, 1 / 60);
  }
  assert.equal(first.ledge, null);
  assert.equal(first.onGround, true);
  assert.equal(first.x, 240 + first.w / 2 + LEDGE.attackInset);
  assert.equal(first.y, 500 - first.h / 2);
  assert.equal(first.action, "ledgeAttack");
});

test("ledge attack invulnerability ends when its active frames end", () => {
  const { first } = createBattle();
  first.x = 220;
  first.y = 525;
  first.vy = 100;
  first.onGround = false;
  assert.equal(tryGrabLedge(STAGES.final, first, {}), true);
  assert.ok(first.invuln > 0.24);
  updateLedgeHang(first, { attack: true }, false, true, false, 1 / 60);

  while (first.actionTime + 1 / 60 < first.ledgeAttack.invulnEnd) {
    updateCoreTimers(first, 1 / 60);
    updateLedgeHang(first, {}, false, false, false, 1 / 60);
    assert.ok(first.invuln > 0);
  }

  updateCoreTimers(first, 1 / 60);
  updateLedgeHang(first, {}, false, false, false, 1 / 60);
  assert.ok(first.actionTime >= first.ledgeAttack.invulnEnd);
  assert.equal(first.invuln, 0);
  assert.equal(first.action, "ledgeAttack");
  assert.ok(first.actionTime < first.move.total);
});

test("normal falling uses the shared slower fall multipliers", () => {
  const { simulation, match, first } = createBattle();
  first.x = 600;
  first.y = 100;
  first.vy = 0;
  first.onGround = false;
  simulation.step(match, inputs(), 0.1);
  assert.equal(first.vy, first.stats.gravity * MOVEMENT.normalGravityMultiplier * 0.1);
  assert.ok(first.stats.maxFallSpeed * MOVEMENT.normalFallSpeedMultiplier < first.stats.maxFallSpeed);
});

test("tech requires tumble and a surface-normal impact speed in the techable range", () => {
  const { first } = createBattle();
  first.onGround = true;
  first.hitstun = 0.5;
  first.tumbling = false;
  first.techWindow = TECH.window;

  assert.equal(resolveImpactAfterCollision(first, {
    landed: true,
    hitWall: false,
    hitCeiling: false,
    impactVx: 900,
    impactVy: 700
  }), "land");

  first.hitstun = 0.5;
  first.tumbling = true;
  first.techWindow = TECH.window;
  assert.equal(resolveImpactAfterCollision(first, {
    landed: true,
    hitWall: false,
    hitCeiling: false,
    impactVx: 0,
    impactVy: TECH.maxSpeed + 1
  }), "bounce");
});

test("a timed shield press grants tech invulnerability and starts tech lockout", () => {
  const { first } = createBattle();
  first.onGround = true;
  first.hitstun = 0.5;
  first.tumbling = true;
  noteDefenseInput(first, true);

  assert.equal(resolveImpactAfterCollision(first, {
    landed: true,
    hitWall: false,
    hitCeiling: false,
    impactVx: 0,
    impactVy: 800
  }), "tech");
  assert.equal(first.hitstun, 0);
  assert.equal(first.invuln, TECH.invuln);
  assert.equal(first.techWindow, 0);
  assert.equal(first.techLockout, TECH.lockout);
});

test("a strong shallow ground impact preserves its angle and continues as a bounce", () => {
  const { first } = createBattle();
  const impactVx = 900;
  const impactVy = 520;
  first.onGround = true;
  first.hitstun = 0.5;
  first.tumbling = true;

  assert.equal(resolveImpactAfterCollision(first, {
    landed: true,
    hitWall: false,
    hitSlope: false,
    hitCeiling: false,
    impactVx,
    impactVy
  }), "bounce");

  assert.equal(first.onGround, false);
  assert.equal(first.vx, impactVx * TECH.shallowGroundBounceRetention);
  assert.equal(first.vy, -impactVy * TECH.shallowGroundBounceRetention);
  assert.ok(Math.abs(Math.abs(first.vy / first.vx) - impactVy / impactVx) < 1e-12);
  assert.equal(first.knockdownPending, true);
});

test("a tumbling medium-speed landing enters knockdown with brief invulnerability", () => {
  const { first } = createBattle();
  first.onGround = true;
  first.hitstun = 0.5;
  first.tumbling = true;

  assert.equal(resolveImpactAfterCollision(first, {
    landed: true,
    hitWall: false,
    hitSlope: false,
    hitCeiling: false,
    impactVx: 120,
    impactVy: 400
  }), "knockdown");
  assert.equal(first.action, "downed");
  assert.equal(first.knockdown.phase, "down");
  assert.equal(first.onGround, true);
  assert.equal(first.hitstun, 0);
  assert.equal(first.invuln, KNOCKDOWN.invuln);
});

test("a missed high-speed ground tech bounces once and then enters knockdown", () => {
  const { first } = createBattle();
  first.hitstun = 0.5;
  first.tumbling = true;

  assert.equal(resolveImpactAfterCollision(first, {
    landed: true,
    hitWall: false,
    hitSlope: false,
    hitCeiling: false,
    impactVx: 200,
    impactVy: 700
  }), "bounce");
  assert.equal(first.knockdownPending, true);

  assert.equal(resolveImpactAfterCollision(first, {
    landed: true,
    hitWall: false,
    hitSlope: false,
    hitCeiling: false,
    impactVx: first.vx,
    impactVy: 260
  }), "knockdown");
  assert.equal(first.knockdownPending, false);
  assert.equal(first.action, "downed");
});

test("knockdown choices support getup attack, directional dodge, and neutral getup inputs", () => {
  for (const attackInput of [{ attack: true }, { special: true }]) {
    const battle = createBattle();
    startKnockdown(battle.first);
    battle.simulation.step(battle.match, inputs(attackInput), 1 / 60);
    assert.equal(battle.first.knockdown, null);
    assert.equal(battle.first.action, "getupAttack");
    assert.equal(battle.first.move.id, "getupAttack");
  }

  for (const moveX of [-1, 1]) {
    const battle = createBattle();
    startKnockdown(battle.first);
    battle.simulation.step(battle.match, inputs({ moveX }), 1 / 60);
    assert.equal(battle.first.knockdown, null);
    assert.equal(battle.first.action, "roll");
    assert.equal(battle.first.dodge.direction, moveX);
  }

  for (const getupInput of [{ jump: true }, { shield: true }, { moveY: -1 }]) {
    const battle = createBattle();
    startKnockdown(battle.first);
    battle.first.invuln = 0;
    battle.simulation.step(battle.match, inputs(getupInput), 1 / 60);
    assert.equal(battle.first.knockdown.phase, "getup");
    assert.equal(battle.first.action, "getup");
    assert.equal(battle.first.invuln, KNOCKDOWN.getupInvuln);
  }
});

test("knockdown automatically starts a neutral getup after six seconds", () => {
  const { simulation, match, first } = createBattle();
  startKnockdown(first);

  stepFrames(simulation, match, 359);
  assert.equal(first.knockdown.phase, "down");
  assert.equal(first.action, "downed");

  simulation.step(match, inputs(), 1 / 60);
  assert.equal(KNOCKDOWN.maxDuration, 6);
  assert.equal(first.knockdown.phase, "getup");
  assert.equal(first.action, "getup");
});

test("knockdown hurtboxes rotate continuously with downed and getup poses", () => {
  const { simulation, match, first } = createBattle();
  startKnockdown(first);
  const groundY = first.y + first.h / 2;
  const downed = fighterRect(first);

  assert.ok(Math.abs(downed.w - first.h) < 1e-9);
  assert.ok(Math.abs(downed.h - first.w) < 1e-9);
  assert.ok(Math.abs(downed.y + downed.h - groundY) < 1e-9);

  first.knockdown.phase = "getup";
  first.action = "getup";
  first.actionTime = KNOCKDOWN.getupDuration / 2;
  const halfwayPose = getKnockdownBodyPose(first);
  const halfway = fighterRect(first);
  const visual = new CanvasRenderer({}).fighterVisualState(first, 0);
  assert.ok(halfway.w > first.h);
  assert.ok(halfway.h > first.h);
  assert.equal(visual.rotation, halfwayPose.rotation);
  assert.ok(Math.abs(halfway.y + halfway.h - groundY) < 1e-9);

  first.actionTime = KNOCKDOWN.getupDuration;
  const upright = fighterRect(first);
  assert.ok(Math.abs(upright.w - first.w) < 1e-9);
  assert.ok(Math.abs(upright.h - first.h) < 1e-9);

  startKnockdown(first);
  simulation.step(match, inputs({ attack: true }), 1 / 60);
  const attackStart = fighterRect(first);
  assert.ok(attackStart.w > attackStart.h);
  first.actionTime = first.move.total * 0.3;
  const attackUpright = fighterRect(first);
  assert.ok(Math.abs(attackUpright.w - first.w) < 1e-9);
  assert.ok(Math.abs(attackUpright.h - first.h) < 1e-9);

  const snapshotFighter = simulation.snapshot(match).fighters.find(fighter => fighter.id === first.id);
  assert.deepEqual(snapshotFighter.hurtbox, {
    x: Math.round(attackUpright.x * 100) / 100,
    y: Math.round(attackUpright.y * 100) / 100,
    w: Math.round(attackUpright.w * 100) / 100,
    h: Math.round(attackUpright.h * 100) / 100
  });
});

test("Nova uses a grounded relaxed pose while downed", () => {
  const { first } = createBattle();
  startKnockdown(first);
  const renderer = new CanvasRenderer({});
  const assets = new AssetManager();
  const visual = renderer.fighterVisualState(first, 0);
  const pose = assets.getNovaLimbPose("downed", 1);

  assert.equal(visual.pose, "downed");
  assert.equal(visual.offsetY, 0);
  assert.ok(pose.rearArm > 1);
  assert.ok(pose.frontArm > 1);
  assert.equal(pose.thruster, 0);
});

test("forced throw placement resolves floor penetration before down throw launch", () => {
  const { simulation, match, first, second } = createBattle();
  const platform = match.stage.platforms.find(item => item.type === "main");
  const groundY = platform.y - first.h / 2;
  first.x = platform.x + platform.w / 2;
  first.y = groundY;
  first.onGround = true;
  second.x = first.x + 50;
  second.y = groundY;
  second.onGround = true;

  simulation.startGrabHold(match, first, second);
  simulation.throwGrabbedFighter(match, first, second, "down");
  stepFrames(simulation, match, 20);

  assert.ok(second.y + second.h / 2 <= platform.y + 0.001);
  assert.ok(Math.abs(second.x - first.x) < 100);
});

test("Nova getup attack reaches both sides but damages each target only once", () => {
  const { simulation, match, first, second } = createBattle();
  first.x = 600;
  second.x = 650;
  first.y = 500 - first.h / 2;
  second.y = 500 - second.h / 2;
  first.onGround = true;
  second.onGround = true;
  startKnockdown(first);

  simulation.step(match, inputs({ attack: true }), 1 / 60);
  for (let frame = 0; frame < 18; frame += 1) simulation.step(match, inputs(), 1 / 60);

  assert.equal(second.damage, 6);
  const move = getMove("nova", "getupAttack");
  assert.equal(move.hits[0].angle, 30);
  assert.equal(move.hits[0].baseKnockback, 310);
  assert.equal(move.hits[0].knockbackGrowth, 4.2);
  assert.equal(move.hits[0].id, move.hits[1].id);
});

test("an unteched ceiling collision bounces the fighter downward", () => {
  const { first } = createBattle();
  first.onGround = false;
  first.hitstun = 0.5;
  first.tumbling = true;

  assert.equal(resolveImpactAfterCollision(first, {
    landed: false,
    hitWall: false,
    hitCeiling: true,
    impactVx: 200,
    impactVy: -900
  }), "ceilingBounce");
  assert.equal(first.vx, 200 * TECH.ceilingBounceX);
  assert.equal(first.vy, 900 * TECH.ceilingBounceY);
  assert.ok(first.vy > 0);
});

test("Nova's up-air meteor keeps launch speed and creates a strong floor bounce at 130 percent", () => {
  const { simulation, match, first, second } = createBattle();
  const meteor = getMove("nova", "airUp").hits.find(hit => hit.id === "jet");
  second.x = 640;
  second.y = 440;
  second.damage = 130;
  second.onGround = false;
  const launch = calculateLaunch({ move: meteor, attacker: first, target: second, rules: match.rules });
  assert.ok(launch.vy > second.stats.maxFallSpeed * MOVEMENT.normalFallSpeedMultiplier);

  simulation.applyLaunchToFighter(second, launch);
  stepFrames(simulation, match, 5);

  assert.equal(second.action, "bounce");
  assert.ok(second.vy < -700);
});

test("air movement applies the shared recovery acceleration multiplier", () => {
  const { simulation, match, first } = createBattle();
  first.x = 600;
  first.y = 100;
  first.vx = 0;
  first.vy = 0;
  first.onGround = false;
  simulation.step(match, inputs({ moveX: 1 }), 0.1);
  assert.equal(first.vx, first.stats.airAccel * MOVEMENT.airAccelerationMultiplier * 0.1);
  assert.equal(MOVEMENT.normalFallSpeedMultiplier, 0.7);
});

test("KO effect path points from the death position to stage center", () => {
  const renderer = new CanvasRenderer({});
  renderer.camera = { x: 640, y: 390, scale: 0.72 };
  const path = renderer.koBlastPath(STAGES.final.blast.right + 1, 120, STAGES.final);
  assert.equal(path.originX, 1280);
  assert.equal(path.targetWorldX, 640);
  assert.ok(path.dirX < 0);
  assert.ok(path.dirY > 0);
  assert.ok(Math.abs(Math.hypot(path.dirX, path.dirY) - 1) < 1e-9);
});

test("every stage shares the blast zone extended by Nova's body size", () => {
  assert.equal(STAGE_BLAST_ZONE.top, -360 - NOVA_BODY_SIZE.height);
  assert.equal(STAGE_BLAST_ZONE.left, -520 - NOVA_BODY_SIZE.height);
  assert.equal(STAGE_BLAST_ZONE.right, 1800 + NOVA_BODY_SIZE.height);
  assert.equal(STAGE_BLAST_ZONE.bottom, 1020 + NOVA_BODY_SIZE.height * 3);
  for (const stage of Object.values(STAGES)) assert.deepEqual(stage.blast, STAGE_BLAST_ZONE);
});

test("fighter labels prefer the configured player name", () => {
  const renderer = new CanvasRenderer({});
  assert.equal(renderer.fighterLabel({ name: "Player Name", slot: 2 }), "Player Name");
  assert.equal(renderer.fighterLabel({ name: "", slot: 2 }), "P2");
});

test("Nova uses distinct idle, run, jump, hurt, launched, and attack poses", () => {
  const renderer = new CanvasRenderer({});
  const base = {
    action: null,
    onGround: true,
    respawnPlatform: 0,
    crouching: false,
    shield: false,
    vx: 0,
    vy: 0
  };

  assert.equal(renderer.fighterVisualState(base, 0).pose, "idle");
  assert.deepEqual(renderer.fighterVisualState({ ...base, vx: 200 }, 90), {
    pose: "run",
    frame: 1,
    offsetY: 2,
    rotation: 0.035
  });
  assert.equal(renderer.fighterVisualState({ ...base, onGround: false, vy: -200 }, 0).pose, "jumpRise");
  assert.equal(renderer.fighterVisualState({ ...base, onGround: false, vy: 200 }, 0).pose, "jumpFall");
  assert.equal(renderer.fighterVisualState({ ...base, onGround: false, vy: -200, action: "airForward" }, 0).pose, "attack");
  assert.equal(renderer.fighterVisualState({
    ...base,
    action: "jab1",
    hitlag: 0.08,
    hitstun: 0.3,
    vx: 300
  }, 0).pose, "hurt");
  const launched = renderer.fighterVisualState({
    ...base,
    action: "bounce",
    hitlag: 0,
    hitstun: 0.3,
    tumbling: true,
    vx: 300,
    vy: 0
  }, 0);
  assert.equal(launched.pose, "launched");
  assert.ok(Math.abs(launched.rotation - Math.PI / 2) < 1e-9);
});

test("renderer animation time follows the battle speed instead of wall-clock time", () => {
  const renderer = new CanvasRenderer({});
  const snapshot = { elapsed: 2, rules: { gameSpeed: 1 / 16 } };

  assert.equal(renderer.getAnimationTimeMs(snapshot, 0), 2000);
  assert.ok(Math.abs(renderer.getAnimationTimeMs(snapshot, 0.05) - 2003.125) < 1e-9);

  const running = {
    action: null,
    onGround: true,
    respawnPlatform: 0,
    crouching: false,
    shield: false,
    hitstun: 0,
    vx: 200,
    vy: 0
  };
  const startingFrame = renderer.fighterVisualState(running, 2000).frame;
  const slowMotionFrame = renderer.fighterVisualState(running, 2000 + 90 / 16).frame;
  assert.equal(slowMotionFrame, startingFrame);
});

test("Nova lowers the cannon arm while idle and preserves the previous attack pose", () => {
  const assets = new AssetManager();
  const idle = assets.getNovaLimbPose("idle");
  const attack = assets.getNovaLimbPose("attack");
  const runForward = assets.getNovaLimbPose("run", 1);
  const runBackward = assets.getNovaLimbPose("run", -1);
  const hurt = assets.getNovaLimbPose("hurt");
  const launched = assets.getNovaLimbPose("launched");

  assert.ok(idle.frontArm > 1);
  assert.equal(attack.frontArm, -0.2);
  assert.equal(attack.rearArm, -0.28);
  assert.notEqual(runForward.frontLeg, runBackward.frontLeg);
  assert.notEqual(runForward.rearArm, runBackward.rearArm);
  assert.notDeepEqual(hurt, idle);
  assert.notDeepEqual(launched, hurt);
});

test("Nova's jab animation punches right, left, then right with a larger finisher", () => {
  const renderer = new CanvasRenderer({});
  const assets = new AssetManager();
  const base = {
    characterId: "nova",
    onGround: true,
    crouching: false,
    shield: false,
    hitlag: 0,
    hitstun: 0,
    vx: 0,
    vy: 0
  };
  const jab1Visual = renderer.fighterVisualState({ ...base, action: "jab1", actionTime: 0.1265 }, 0);
  const jab2Visual = renderer.fighterVisualState({ ...base, action: "jab2", actionTime: 0.138 }, 0);
  const jab3Visual = renderer.fighterVisualState({ ...base, action: "jab3", actionTime: 0.2185 }, 0);
  const jab1Pose = assets.getNovaLimbPose("jab1", 0.5);
  const jab2Pose = assets.getNovaLimbPose("jab2", 0.5);
  const jab3Pose = assets.getNovaLimbPose("jab3", 0.5);

  assert.equal(jab1Visual.pose, "jab1");
  assert.equal(jab2Visual.pose, "jab2");
  assert.equal(jab3Visual.pose, "jab3");
  assert.ok(jab1Pose.frontArm < 0);
  assert.equal(Boolean(jab1Pose.rearArmForward), false);
  assert.equal(jab2Pose.rearArmForward, true);
  assert.ok(jab2Pose.frontArm > 1);
  assert.ok(jab3Pose.frontArmReach > jab1Pose.frontArmReach);
  assert.ok(jab3Visual.offsetX > jab1Visual.offsetX);
  assert.ok(jab3Visual.rotation > jab1Visual.rotation);
});

test("Nova's dash attack uses a braced body-check pose and recovers upright", () => {
  const renderer = new CanvasRenderer({});
  const assets = new AssetManager();
  const base = {
    characterId: "nova",
    action: "dashAttack",
    onGround: true,
    crouching: false,
    shield: false,
    hitlag: 0,
    hitstun: 0,
    vx: 0,
    vy: 0
  };
  const active = renderer.fighterVisualState({ ...base, actionTime: 0.15 }, 0);
  const recovery = renderer.fighterVisualState({ ...base, actionTime: 0.9 }, 0);
  const bracedPose = assets.getNovaLimbPose("dashAttack", 0.5);

  assert.equal(active.pose, "dashAttack");
  assert.ok(active.rotation > 0.25);
  assert.ok(active.offsetX > 4);
  assert.ok(bracedPose.frontArm > 1.8);
  assert.ok(bracedPose.rearArm < -0.6);
  assert.ok(recovery.rotation < active.rotation);
});

test("Nova neutral air spreads its limbs and emits short radial shock lines", () => {
  const renderer = new CanvasRenderer({});
  const assets = new AssetManager();
  const move = getMove("nova", "airNeutral");
  const activeTime = move.hits[0].start + move.hits[0].duration / 2;
  const visual = renderer.fighterVisualState({
    characterId: "nova",
    action: "airNeutral",
    actionTime: activeTime,
    onGround: false,
    shield: false,
    hitstun: 0,
    vx: 0,
    vy: 0,
    facing: 1
  }, 0);
  const idlePose = assets.getNovaLimbPose("idle", 0);
  const burstPose = assets.getNovaLimbPose("airNeutral", 0.32);
  let lineCount = 0;
  let arcCount = 0;
  const ctx = {
    globalAlpha: 1,
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() { lineCount += 1; },
    stroke() {},
    arc() { arcCount += 1; }
  };

  renderer.drawNovaMoveEffect(ctx, {
    characterId: "nova",
    action: "airNeutral",
    actionTime: activeTime
  }, 0);

  assert.equal(visual.pose, "airNeutral");
  assert.ok(FIGHTER_POSE_FRAMES.airNeutral > 1);
  assert.notEqual(burstPose.rearArm, idlePose.rearArm);
  assert.notEqual(burstPose.frontArm, idlePose.frontArm);
  assert.ok(Math.abs(burstPose.rearLeg - burstPose.frontLeg) > Math.abs(idlePose.rearLeg - idlePose.frontLeg));
  assert.equal(lineCount, 12);
  assert.equal(arcCount, 0);
});

test("snapshots include victim hitlag for networked hurt poses", () => {
  const { simulation, match, second } = createBattle();
  second.hitlag = 0.08;
  second.hitstun = 0.3;
  second.tumbling = true;
  const snapshot = simulation.snapshot(match);
  const fighter = snapshot.fighters.find(item => item.id === second.id);
  assert.equal(fighter.hitlag, 0.08);
  assert.equal(fighter.hitstun, 0.3);
  assert.equal(fighter.tumbling, true);
});

test("mouse bindings have readable setting labels", () => {
  assert.equal(bindingLabel("Mouse0"), "左クリック");
  assert.equal(bindingLabel("Mouse1"), "ホイールクリック");
  assert.equal(bindingLabel("Mouse2"), "右クリック");
  assert.equal(bindingLabel("Mouse3"), "サイドボタン1");
  assert.equal(bindingLabel("Mouse4"), "サイドボタン2");
  assert.equal(bindingLabel("WheelUp"), "ホイール上");
  assert.equal(bindingLabel("WheelDown"), "ホイール下");
});

test("network presentation reuses fighters and caps extrapolation", () => {
  const renderer = new CanvasRenderer({});
  const snapshot = {
    id: "presentation-test",
    fighters: [{
      id: "p1",
      x: 100,
      y: 200,
      vx: 300,
      vy: -100,
      alive: true,
      eliminated: false,
      ledge: null,
      respawnPlatform: 0
    }]
  };
  const firstPresented = renderer.presentFighters(snapshot, 0.02)[0];
  assert.equal(firstPresented.x, 106);
  assert.equal(firstPresented.y, 198);

  snapshot.fighters[0].x = 120;
  snapshot.fighters[0].y = 180;
  const cappedPresented = renderer.presentFighters(snapshot, 1)[0];
  assert.equal(cappedPresented, firstPresented);
  assert.equal(cappedPresented.x, 135);
  assert.equal(cappedPresented.y, 175);
});
