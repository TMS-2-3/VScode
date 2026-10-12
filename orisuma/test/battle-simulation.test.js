import assert from "node:assert/strict";
import test from "node:test";
import { BattleSimulation, normalizeBattleInput } from "../js/battle-simulation.js";
import {
  DEFAULT_RULES,
  DODGE,
  LANDING,
  LEDGE,
  MAIN_PLATFORM_DEPTH,
  MOVEMENT,
  SMASH_CHARGE,
  STAGES,
  TECH,
  calculateLaunch,
  getMainPlatformTriangle,
  getMove,
  noteDefenseInput,
  resolveFighterBodyCollision,
  resolveImpactAfterCollision,
  resolveStageCollision,
  selectMoveFromInput,
  startDodge,
  tryGrabLedge,
  updateDodge,
  updateLedgeHang
} from "../js/battle-data.js";
import { CanvasRenderer } from "../js/canvas-renderer.js";
import { PracticeMode } from "../js/practice-mode.js";
import { RollbackManager } from "../js/rollback-manager.js";

function createBattle({ mode = "stock", finalSmash = false } = {}) {
  const simulation = new BattleSimulation();
  const rules = {
    ...DEFAULT_RULES,
    mode,
    finalSmash,
    stocks: 2,
    hp: 100,
    gameSpeed: 1
  };
  const match = simulation.createMatch({ id: "test-match", rules, stage: STAGES.final });
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
  assert.equal(getMove("nova", "specialSide").projectile.damage, 16);
  assert.equal(getMove("nova", "pummel").damage, 1.6);
  assert.deepEqual(hitDamage("throwForward"), [7]);
  assert.deepEqual(hitDamage("throwBack"), [2, 10.5]);
  assert.deepEqual(hitDamage("throwUp"), [7.5]);
  assert.deepEqual(hitDamage("throwDown"), [2, 2, 2, 4]);
  assert.equal(getMove("nova", "finalPunch").damage, 32.5);
});

test("the shared simulation applies Nova's first jab", () => {
  const { simulation, match, second } = createBattle();
  simulation.step(match, inputs({ attack: true }), 1 / 60);
  for (let frame = 0; frame < 8; frame += 1) simulation.step(match, inputs(), 1 / 60);
  assert.equal(second.damage, 3);
  assert.ok(match.events.some(event => event.kind === "hit" && event.targetId === "p2"));
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

test("holding smash for ten seconds forces a cancel with one second of end lag", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 900;

  simulation.step(match, inputs({ smash: true }), 1 / 60);
  for (let frame = 0; frame < 40; frame += 1) {
    simulation.step(match, inputs({ smash: true }), 0.25);
  }

  assert.equal(first.smashCharge, null);
  assert.equal(first.action, "smashChargeCancel");
  assert.equal(first.actionLock, SMASH_CHARGE.forcedCancelLag);
  assert.equal(first.move, null);

  simulation.step(match, inputs({ attack: true }), 0.25);
  assert.equal(first.action, "smashChargeCancel");
  assert.equal(first.move, null);
  simulation.step(match, inputs(), 0.25);
  simulation.step(match, inputs(), 0.25);
  assert.equal(first.action, "smashChargeCancel");
  simulation.step(match, inputs(), 0.25);
  assert.equal(first.actionLock, 0);
  assert.equal(first.action, null);
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
  stepFrames(simulation, match, 14, inputs({ attack: true }));
  assert.equal(first.action, "jab2");
  stepFrames(simulation, match, 16, inputs({ attack: true }));
  assert.equal(first.action, "jab3");
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
  assert.ok(first.moveState.impulseApplied);
  assert.ok(first.vx > first.stats.runSpeed);
  assert.ok(first.x > startX);
});

test("ground running ramps from 40 percent to full speed over 0.6 seconds", () => {
  const { simulation, match, first, second } = createBattle();
  second.x = 900;
  first.y = STAGES.final.platforms[0].y - first.h / 2;

  simulation.step(match, inputs({ moveX: 1 }), 1 / 60);
  assert.equal(first.vx, first.stats.runSpeed * MOVEMENT.groundRunStartSpeedScale);
  assert.equal(first.runRampDirection, 1);

  stepFrames(simulation, match, 36, inputs({ moveX: 1 }));
  assert.equal(first.runRampElapsed, MOVEMENT.groundRunRampDuration);
  assert.equal(first.vx, first.stats.runSpeed);
});

test("reversing restarts ground run at 40 percent and prevents dash attack", () => {
  const speedBattle = createBattle();
  speedBattle.second.x = 900;
  speedBattle.first.y = STAGES.final.platforms[0].y - speedBattle.first.h / 2;
  stepFrames(speedBattle.simulation, speedBattle.match, 37, inputs({ moveX: 1 }));
  speedBattle.simulation.step(speedBattle.match, inputs({ moveX: -1 }), 1 / 60);

  assert.equal(
    speedBattle.first.vx,
    -speedBattle.first.stats.runSpeed * MOVEMENT.groundRunStartSpeedScale
  );
  assert.equal(speedBattle.first.runRampDirection, -1);

  const { simulation, match, first, second } = createBattle();
  second.x = 900;
  first.y = STAGES.final.platforms[0].y - first.h / 2;
  stepFrames(simulation, match, 37, inputs({ moveX: 1 }));

  simulation.step(match, inputs({ moveX: -1, attack: true }), 1 / 60);

  assert.equal(first.action, "side");
  assert.equal(first.facing, -1);
  assert.equal(first.runRampElapsed, 0);
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
  stepFrames(simulation, match, 12, inputs({ moveX: 1, moveY: -1, special: true }));

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

test("final smash activation is resolved by the shared simulation", () => {
  const { simulation, match, first } = createBattle({ finalSmash: true });
  first.finalGauge = 100;
  simulation.step(match, inputs({ special: true }), 1 / 60);
  assert.equal(match.finalSmash?.fighterId, first.id);
  assert.equal(first.finalGauge, 0);
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
  const rules = { ...DEFAULT_RULES, mode: "practice", finalSmash: false, gameSpeed: 1 };
  const match = simulation.createMatch({ id: "practice", rules, stage: STAGES.final });
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

test("the main-platform slope uses twice the depth for smoother outward movement", () => {
  const main = STAGES.final.platforms.find(platform => platform.type === "main");
  const triangle = getMainPlatformTriangle(main);
  assert.equal(triangle.depth, 360);
  assert.equal(triangle.halfWidth / triangle.depth, 10 / 9);
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

test("ledge jump starts at the ledge and uses the shared 1.3 multiplier", () => {
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
  assert.equal(first.vy, first.stats.airJumpSpeed * LEDGE.jumpSpeedMultiplier);
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
