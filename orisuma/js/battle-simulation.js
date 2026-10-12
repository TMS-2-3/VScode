import {
  DEFAULT_RULES,
  FINAL_SMASH,
  GRAB,
  KNOCKBACK,
  MOVEMENT,
  NOVA_CHARGE,
  NOVA_RECOVERY,
  RESPAWN,
  SHIELD,
  SMASH_CHARGE,
  addFinalGaugeFromDamage,
  applyClankRebound,
  applyFinalGaugeKoRule,
  applyHitlagSdi,
  applyJumpCut,
  applyPerfectShield,
  applyShieldDamage,
  beginFinalSmash,
  calculateLaunch,
  canAct,
  clearDodge,
  clearLedgeState,
  fighterRect,
  getAirDodgeFromInput,
  getCharacterDefinition,
  getGroundDodgeFromInput,
  getHitbox,
  getActiveMoveHits,
  getMove,
  horizontalInput,
  noteDefenseInput,
  resetShield,
  resolveClankOutcome,
  resolveFighterBodyCollision,
  resolveImpactAfterCollision,
  resolveStageCollision,
  selectGrabMove,
  selectMoveFromInput,
  startDashIfNeeded,
  startDodge,
  tryGrabLedge,
  updateCoreTimers,
  updateDodge,
  updateLedgeHang,
  updateShieldState,
  verticalInput
} from "./battle-data.js";
import { approach, clamp, rectsOverlap, roundValue } from "./utils.js";

export class BattleSimulation {
  constructor({ onEvent = null } = {}) {
    this.onEvent = onEvent;
  }

  createMatch({ id, rules, stage, countdown = 0 }) {
    return {
      id,
      frame: 0,
      elapsed: 0,
      countdown,
      rules: { ...rules },
      stage,
      fighters: new Map(),
      events: [],
      eventSeq: 0,
      finalSmash: null,
      projectiles: [],
      projectileSeq: 0,
      clankPairs: new Set()
    };
  }

  createFighter({
    id,
    name,
    characterId,
    slot,
    colorIndex = 0,
    spawn,
    facing = 1,
    rules = DEFAULT_RULES,
    invuln = 0,
    hp = rules.hp ?? DEFAULT_RULES.hp,
    stocks = rules.stocks ?? 0,
    isDummy = false,
    inputEnabled = true,
    spawnOnGround = false
  }) {
    const character = getCharacterDefinition(characterId);
    const stats = character.stats;
    return {
      id,
      name,
      characterId: character.id,
      weightClass: character.weightClass,
      stats: { ...stats },
      slot,
      colorIndex,
      x: spawn[0],
      y: spawn[1],
      spawnX: spawn[0],
      spawnY: spawn[1],
      spawnOnGround,
      vx: 0,
      vy: 0,
      w: stats.w,
      h: stats.h,
      facing,
      onGround: spawnOnGround,
      jumps: stats.jumps,
      maxJumps: stats.jumps,
      damage: 0,
      finalGauge: 0,
      finalSmashInputFrame: -1,
      hp,
      maxHp: hp,
      stocks,
      kills: 0,
      falls: 0,
      alive: true,
      eliminated: false,
      respawn: 0,
      invuln,
      shield: false,
      shieldHp: SHIELD.max,
      shieldMax: SHIELD.max,
      shieldStun: 0,
      shieldReleaseLag: 0,
      clankLag: 0,
      actionLock: 0,
      perfectShieldWindow: 0,
      perfectShieldFlash: 0,
      hitstun: 0,
      hitlag: 0,
      dodge: null,
      dodgeInvuln: 0,
      hasAirDodged: false,
      landingLag: 0,
      techWindow: 0,
      techLockout: 0,
      crouching: false,
      tumbling: false,
      meteor: false,
      staleMoves: [],
      grabbing: null,
      grabbedBy: null,
      grabTimer: 0,
      grabEscape: 0,
      bufferedThrow: null,
      pummelCooldown: 0,
      fastFalling: false,
      dashTimer: 0,
      dashDirection: 0,
      runRampElapsed: 0,
      runRampDirection: 0,
      jumpCutAvailable: false,
      actionStartedAir: false,
      ledgeGrabCount: 0,
      respawnPlatform: 0,
      ledge: null,
      ledgeClimb: null,
      ledgeRoll: null,
      ledgeHold: 0,
      ledgeHorizontalLocked: false,
      ledgeCooldown: 0,
      action: null,
      move: null,
      moveState: null,
      smashCharge: null,
      novaCharge: 0,
      novaCharging: false,
      recovery: null,
      throwState: null,
      actionTime: 0,
      hitList: [],
      lastInput: normalizeBattleInput(),
      currentInput: normalizeBattleInput(),
      lastHitBy: null,
      networkStatus: "ok",
      inputSeq: 0,
      isDummy,
      inputEnabled
    };
  }

  step(match, inputs, rawDt) {
    match.frame += 1;
    if (match.countdown > 0) {
      match.countdown = Math.max(0, match.countdown - rawDt);
      return { active: false, dt: 0, finished: false };
    }

    const dt = rawDt * (match.rules.gameSpeed || 1);
    const resolvedInputs = new Map();
    for (const fighter of match.fighters.values()) {
      const input = normalizeBattleInput(inputs?.get(fighter.id));
      fighter.currentInput = { ...input };
      resolvedInputs.set(fighter.id, input);
    }

    this.resolveFinalSmashActivation(match, resolvedInputs);
    if (match.finalSmash) {
      this.updateFinalSmashState(match, dt);
      for (const fighter of match.fighters.values()) {
        fighter.lastInput = { ...resolvedInputs.get(fighter.id) };
      }
      return { active: true, dt, finished: false };
    }

    match.elapsed += dt;

    for (const fighter of match.fighters.values()) {
      this.updateFighter(match, fighter, resolvedInputs.get(fighter.id), dt);
    }

    this.resolveFighterCollisions(match);
    match.clankPairs.clear();
    this.resolveAttackClanks(match);
    this.updateAttacks(match);
    this.updateProjectiles(match, dt);
    for (const fighter of match.fighters.values()) this.checkBoundsAndHealth(match, fighter);

    return { active: true, dt, finished: this.shouldFinish(match) };
  }

  updateFinalSmashState(match, dt) {
    const state = match.finalSmash;
    if (!match.rules.finalSmash || !state) {
      match.finalSmash = null;
      return;
    }

    const fighter = match.fighters.get(state.fighterId);
    if (!fighter || !fighter.alive) {
      match.finalSmash = null;
      return;
    }

    state.elapsed = (state.elapsed || 0) + dt;
    state.remaining = Math.max(0, FINAL_SMASH.defaultActiveDuration - state.elapsed);
    fighter.action = "finalSmash";
    fighter.move = null;
    fighter.vx = 0;
    fighter.vy = 0;
    fighter.shield = false;
    fighter.invuln = Math.max(fighter.invuln || 0, state.remaining + 0.1);

    if (!state.punchDone && state.elapsed >= 0.6) {
      state.punchDone = true;
      const punch = { ...getMove(fighter.characterId, "finalPunch"), ignoreNovaCharge: true };
      for (const target of this.targetsInFront(match, fighter, 190, 130)) {
        this.applyHit(match, fighter, target, punch);
      }
      this.addEvent(match, "finalPunch", fighter.id, fighter.id, { x: fighter.x, y: fighter.y });
    }

    if (state.remaining > 0) return;
    fighter.action = null;
    fighter.actionTime = 0;
    match.finalSmash = null;
  }

  targetsInFront(match, fighter, reach, height) {
    const area = {
      x: fighter.facing > 0 ? fighter.x + 12 : fighter.x - reach - 12,
      y: fighter.y - height / 2,
      w: reach,
      h: height
    };
    return Array.from(match.fighters.values()).filter(target => (
      target.id !== fighter.id && target.alive && rectsOverlap(area, fighterRect(target))
    ));
  }

  resolveFinalSmashActivation(match, inputs) {
    if (!match.rules.finalSmash) return;
    const candidates = [];
    for (const fighter of match.fighters.values()) {
      const input = inputs.get(fighter.id);
      if (!input || !fighter.alive || fighter.finalGauge < FINAL_SMASH.maxGauge) continue;
      const specialPressed = input.special && !fighter.lastInput.special;
      const neutralInput = Math.abs(horizontalInput(input)) <= FINAL_SMASH.neutralInputThreshold
        && Math.abs(verticalInput(input)) <= FINAL_SMASH.neutralInputThreshold;
      if (!specialPressed || !neutralInput) continue;

      fighter.finalSmashInputFrame = match.frame;
      if (match.finalSmash || !canAct(fighter) || fighter.action || fighter.shield || fighter.ledge) continue;
      candidates.push(fighter);
    }

    if (match.finalSmash || candidates.length === 0) return;
    const activation = beginFinalSmash(candidates, `${match.id}:${match.frame}`, match.frame);
    match.finalSmash = {
      ...activation.state,
      elapsed: 0,
      punchDone: false
    };
    this.addEvent(match, "finalSmash", activation.winner.id, activation.winner.id, {
      x: activation.winner.x,
      y: activation.winner.y
    });
  }

  updateFighter(match, fighter, input, dt) {
    const stats = fighter.stats;
    const wasOnGround = fighter.onGround;

    if (!fighter.alive) {
      if (!fighter.eliminated && fighter.respawn > 0) {
        fighter.respawn -= dt;
        if (fighter.respawn <= 0) {
          this.respawnFighter(fighter);
          this.addEvent(match, "respawn", fighter.id);
        }
      }
      fighter.lastInput = { ...input };
      return;
    }

    const axis = horizontalInput(input);
    const verticalAxis = verticalInput(input);
    const lastAxis = horizontalInput(fighter.lastInput);
    const lastVerticalAxis = verticalInput(fighter.lastInput);
    const facingAtFrameStart = fighter.facing;
    const wasShielding = fighter.shield;
    const shieldPressed = input.shield && !fighter.lastInput.shield;
    const shieldReleased = !input.shield && fighter.lastInput.shield;
    const jumpPressed = input.jump && !fighter.lastInput.jump;
    const attackPressed = input.attack && !fighter.lastInput.attack;
    const smashPressed = input.smash && !fighter.lastInput.smash;
    const specialPressed = input.special && !fighter.lastInput.special && fighter.finalSmashInputFrame !== match.frame;
    const grabPressed = input.grab && !fighter.lastInput.grab;
    noteDefenseInput(fighter, shieldPressed, shieldReleased);

    if (fighter.hitlag > 0) {
      applyHitlagSdi(fighter, input, dt);
      fighter.hitlag = Math.max(0, fighter.hitlag - dt);
      fighter.lastInput = { ...input };
      return;
    }

    updateCoreTimers(fighter, dt);
    fighter.pummelCooldown = Math.max(0, (fighter.pummelCooldown || 0) - dt);
    applyJumpCut(fighter, input, fighter.lastInput);

    if (fighter.grabbedBy) {
      this.updateGrabbedFighter(match, fighter, input);
      fighter.lastInput = { ...input };
      return;
    }

    if (fighter.grabbing) {
      this.updateGrabHolder(match, fighter, dt, {
        attackPressed,
        grabPressed,
        axis,
        verticalAxis,
        lastAxis,
        lastVerticalAxis
      });
      fighter.lastInput = { ...input };
      return;
    }

    if (fighter.respawnPlatform > 0) {
      fighter.vx = 0;
      fighter.vy = 0;
      fighter.shield = false;
      if (input.down) {
        fighter.respawnPlatform = 0;
        fighter.jumps = Math.min(fighter.jumps, Math.max(0, fighter.maxJumps - 1));
      }
      fighter.lastInput = { ...input };
      return;
    }

    if (fighter.ledge) {
      fighter.crouching = false;
      const ledgeAction = updateLedgeHang(fighter, input, jumpPressed, attackPressed, shieldPressed, dt);
      if (ledgeAction === "jump") this.addEvent(match, "jump", fighter.id);
      if (["climb", "drop", "attack", "roll"].includes(ledgeAction)) this.addEvent(match, "ledge", fighter.id);
      fighter.lastInput = { ...input };
      return;
    }

    if (fighter.novaCharging) this.updateNovaCharge(fighter, input, dt);

    if (fighter.recovery) {
      this.updateRecovery(match, fighter, input, dt, {
        axis,
        verticalAxis,
        jumpPressed,
        attackPressed,
        smashPressed,
        specialPressed,
        shieldPressed,
        grabPressed
      });
      fighter.lastInput = { ...input };
      return;
    }

    if (fighter.smashCharge) this.updateSmashCharge(fighter, input, dt);
    if (fighter.move) this.updateMoveMechanics(match, fighter, input, attackPressed, dt);

    const canControl = fighter.inputEnabled !== false && canAct(fighter);
    if (canControl && !wasShielding && fighter.onGround && Math.abs(axis) > 0.05 && !input.shield && !grabPressed) {
      fighter.facing = Math.sign(axis);
    }
    let performedShieldCancel = false;

    if (canControl && !fighter.action) {
      if (!wasShielding && !input.shield) startDashIfNeeded(fighter, input, fighter.lastInput, axis);
      const groundDodge = fighter.onGround ? getGroundDodgeFromInput(input, fighter.lastInput) : null;
      const airDodge = !fighter.onGround && !fighter.hasAirDodged ? getAirDodgeFromInput(input, fighter.lastInput) : null;

      if (groundDodge && startDodge(fighter, groundDodge)) {
        performedShieldCancel = wasShielding;
        this.addEvent(match, "dodge", fighter.id);
      } else if (airDodge && startDodge(fighter, airDodge)) {
        this.addEvent(match, "dodge", fighter.id);
      } else if (jumpPressed && (fighter.onGround || fighter.jumps > 0)) {
        performedShieldCancel = wasShielding;
        fighter.vy = fighter.onGround ? stats.jumpSpeed : stats.airJumpSpeed;
        fighter.onGround = false;
        fighter.jumps = Math.max(0, fighter.jumps - 1);
        fighter.jumpCutAvailable = true;
        fighter.fastFalling = false;
        this.addEvent(match, "jump", fighter.id);
      } else if (grabPressed) {
        performedShieldCancel = wasShielding;
        const variant = this.getGrabVariant(fighter, axis, facingAtFrameStart);
        if (variant === "pivot") fighter.facing = axis === 0 ? -facingAtFrameStart : Math.sign(axis);
        this.startMove(fighter, selectGrabMove(fighter.characterId, variant));
      } else if (wasShielding && specialPressed && input.up) {
        performedShieldCancel = true;
        this.startSpecial(fighter, input, axis);
      } else if (wasShielding && smashPressed && input.up && fighter.onGround) {
        performedShieldCancel = true;
        this.startSmashCharge(fighter, selectMoveFromInput(fighter.characterId, input, axis, "smash"));
      } else if (!wasShielding && specialPressed) {
        if (!fighter.onGround && Math.abs(axis) > 0.35) fighter.facing = Math.sign(axis);
        this.startSpecial(fighter, input, axis);
      } else if (!wasShielding && smashPressed && fighter.onGround) {
        this.startSmashCharge(fighter, selectMoveFromInput(fighter.characterId, input, axis, "smash"));
      } else if (!wasShielding && attackPressed) {
        const runDirection = Math.abs(axis) > 0.35 ? Math.sign(axis) : 0;
        const fullGroundRun = fighter.onGround && runDirection !== 0 &&
          fighter.runRampDirection === runDirection &&
          fighter.runRampElapsed >= MOVEMENT.groundRunRampDuration;
        this.startMove(fighter, selectMoveFromInput(fighter.characterId, input, axis, "attack", {
          airborne: !fighter.onGround,
          facing: fighter.facing,
          dashing: fullGroundRun
        }));
      }
    }

    if (wasShielding && shieldReleased && !performedShieldCancel) {
      fighter.shieldReleaseLag = Math.max(fighter.shieldReleaseLag || 0, SHIELD.releaseLag);
    }
    fighter.shield = Boolean(canControl && fighter.onGround && input.shield && !fighter.action);
    const shieldEvent = updateShieldState(fighter, input, dt);
    if (shieldEvent) this.addEvent(match, shieldEvent, fighter.id);
    const canMove = fighter.inputEnabled !== false && canAct(fighter);

    fighter.crouching = Boolean(
      canMove && fighter.onGround && verticalAxis > 0.55 && !fighter.shield && !fighter.dodge
    );

    if (canMove && !fighter.onGround && verticalAxis > 0.7 && lastVerticalAxis <= 0.7 && fighter.vy > -60) {
      fighter.fastFalling = true;
    }

    const groundRunDirection = canMove && fighter.onGround && !fighter.shield && !fighter.dodge &&
      !fighter.crouching && Math.abs(axis) > 0.01 ? Math.sign(axis) : 0;
    let groundRunSpeedScale = 1;
    if (groundRunDirection !== 0) {
      if (fighter.runRampDirection !== groundRunDirection) {
        fighter.runRampDirection = groundRunDirection;
        fighter.runRampElapsed = 0;
        fighter.vx = groundRunDirection * stats.runSpeed * MOVEMENT.groundRunStartSpeedScale;
      }
      const runProgress = clamp(
        fighter.runRampElapsed / MOVEMENT.groundRunRampDuration,
        0,
        1
      );
      groundRunSpeedScale = MOVEMENT.groundRunStartSpeedScale +
        (1 - MOVEMENT.groundRunStartSpeedScale) * runProgress;
      fighter.runRampElapsed = Math.min(
        MOVEMENT.groundRunRampDuration,
        fighter.runRampElapsed + dt
      );
    } else if (fighter.onGround) {
      fighter.runRampElapsed = 0;
      fighter.runRampDirection = 0;
    }

    const maxSpeed = fighter.onGround ? stats.runSpeed * groundRunSpeedScale : stats.runSpeed;
    const accel = fighter.onGround
      ? stats.groundAccel
      : stats.airAccel * MOVEMENT.airAccelerationMultiplier;
    const friction = fighter.onGround ? stats.groundFriction : stats.airFriction;
    const controlScale = fighter.action ? 0.35 : fighter.hitstun > 0 ? 0.18 : 1;

    if (fighter.shield) {
      fighter.vx = 0;
    } else if (canMove && !fighter.dodge && !fighter.crouching && Math.abs(axis) > 0.01) {
      fighter.vx += axis * accel * controlScale * dt;
      fighter.vx = clamp(fighter.vx, -maxSpeed, maxSpeed);
    } else if (fighter.onGround && !fighter.dodge) {
      fighter.vx = approach(fighter.vx, 0, friction * dt);
    } else if (!fighter.onGround && fighter.hitstun > 0 && Math.abs(axis) > 0.01) {
      fighter.vx += axis * (stats.launchedAirAccel || 240) * dt;
      fighter.vx *= 0.992;
    }

    if (fighter.hitstun > 0 && fighter.tumbling) {
      fighter.vx = approach(fighter.vx, 0, KNOCKBACK.horizontalDecay * dt);
      if (fighter.vy < 0) fighter.vy = approach(fighter.vy, 0, KNOCKBACK.verticalDecay * dt);
    } else if (fighter.hitstun <= 0) {
      fighter.tumbling = false;
      fighter.meteor = false;
    }

    const dodging = Boolean(fighter.dodge);
    const groundRolling = fighter.dodge?.type === "roll";
    const gravityScale = fighter.dodge?.type === "airDodge" ? 0.38 : 1;
    const gravity = (
      fighter.fastFalling
        ? stats.fastFallGravity
        : stats.gravity * MOVEMENT.normalGravityMultiplier
    ) * gravityScale;
    const maxFallSpeed = fighter.fastFalling
      ? stats.fastFallMaxSpeed
      : stats.maxFallSpeed * MOVEMENT.normalFallSpeedMultiplier;
    const preserveDownwardLaunch = fighter.hitstun > 0 && fighter.tumbling && fighter.vy > maxFallSpeed;
    fighter.vy = preserveDownwardLaunch
      ? fighter.vy + gravity * dt
      : Math.min(fighter.vy + gravity * dt, maxFallSpeed);
    if (dodging) updateDodge(fighter, dt);

    const prevX = fighter.x;
    const prevY = fighter.y;
    fighter.x += fighter.vx * dt;
    fighter.y += fighter.vy * dt;
    fighter.onGround = false;

    const collision = resolveStageCollision(match.stage, fighter, prevX, prevY, input, {
      groundRoll: groundRolling
    });
    const impact = resolveImpactAfterCollision(fighter, collision, input);
    if (["tech", "wallTech", "slopeTech", "ceilingTech"].includes(impact)) this.addEvent(match, "tech", fighter.id);
    if (["bounce", "wallBounce", "slopeBounce", "ceilingBounce"].includes(impact)) this.addEvent(match, "bounce", fighter.id);
    if (!fighter.onGround && canControl && fighter.inputEnabled !== false && tryGrabLedge(match.stage, fighter, input)) {
      this.handleLedgeTrump(match, fighter);
      this.addEvent(match, "ledge", fighter.id);
    }
    if (wasOnGround && !fighter.onGround && !fighter.ledge) {
      fighter.jumps = Math.min(fighter.jumps, Math.max(0, fighter.maxJumps - 1));
    }

    this.updateActionTimer(fighter, input, dt);
    if (match.rules.mode === "hp" && fighter.hp <= 0) this.eliminateFighter(match, fighter);
    fighter.lastInput = { ...input };
  }

  startMove(fighter, move) {
    if (!move) return false;
    clearLedgeState(fighter, 0);
    clearDodge(fighter);
    fighter.smashCharge = null;
    fighter.actionStartedAir = !fighter.onGround;
    fighter.action = move.id;
    fighter.move = {
      ...move,
      ...(Array.isArray(move.hits) ? { hits: move.hits.map(hit => ({ ...hit })) } : {}),
      ...(move.projectile ? { projectile: { ...move.projectile } } : {})
    };
    fighter.moveState = {
      contact: false,
      spawned: false,
      impulseApplied: false,
      chainQueued: false
    };
    fighter.actionTime = 0;
    fighter.hitList = [];
    fighter.vx *= move.velocityScale ?? 0.72;
    return true;
  }

  startSpecial(fighter, input, axis) {
    if (input.down) {
      this.startNovaCharge(fighter);
      return;
    }
    if (input.up) {
      this.startRecovery(fighter);
      return;
    }
    this.startMove(fighter, selectMoveFromInput(fighter.characterId, input, axis, "special"));
  }

  startNovaCharge(fighter) {
    clearLedgeState(fighter, 0);
    clearDodge(fighter);
    fighter.smashCharge = null;
    fighter.novaCharging = true;
    fighter.action = "novaCharge";
    fighter.move = null;
    fighter.moveState = null;
    fighter.actionTime = 0;
    fighter.hitList = [];
    fighter.shield = false;
    if (fighter.onGround) fighter.vx = 0;
  }

  updateNovaCharge(fighter, input, dt) {
    const cancelled = !input.special || input.attack || input.smash || input.jump || input.shield || input.grab ||
      input.up || Math.abs(horizontalInput(input)) > 0.35;
    if (cancelled) {
      fighter.novaCharging = false;
      if (fighter.action === "novaCharge") fighter.action = null;
      return false;
    }

    fighter.novaCharge = clamp((fighter.novaCharge || 0) + dt, 0, NOVA_CHARGE.maxDuration);
    fighter.shield = false;
    if (fighter.onGround) fighter.vx = 0;
    if (fighter.novaCharge >= NOVA_CHARGE.maxDuration) {
      fighter.novaCharging = false;
      fighter.action = null;
      return false;
    }
    return true;
  }

  startRecovery(fighter) {
    clearLedgeState(fighter, 0);
    clearDodge(fighter);
    fighter.smashCharge = null;
    fighter.novaCharging = false;
    fighter.recovery = { phase: "thrust", elapsed: 0 };
    fighter.action = "specialUp";
    fighter.move = null;
    fighter.moveState = null;
    fighter.actionTime = 0;
    fighter.hitList = [];
    fighter.shield = false;
    fighter.onGround = false;
    fighter.vy = Math.min(fighter.vy, NOVA_RECOVERY.neutralSpeed * 0.72);
    fighter.jumps = Math.min(fighter.jumps, Math.max(0, fighter.maxJumps - 1));
  }

  updateRecovery(match, fighter, input, dt, state) {
    const recovery = fighter.recovery;
    recovery.elapsed += dt;
    const cancelThrust = state.jumpPressed || state.attackPressed || state.smashPressed || state.specialPressed ||
      state.shieldPressed || state.grabPressed;
    if (recovery.phase === "thrust" && (cancelThrust || recovery.elapsed >= NOVA_RECOVERY.thrustDuration)) {
      recovery.phase = "fall";
      fighter.action = "specialFall";
    }

    fighter.vx += state.axis * NOVA_RECOVERY.horizontalAcceleration * dt;
    fighter.vx = clamp(fighter.vx, -NOVA_RECOVERY.horizontalMaxSpeed, NOVA_RECOVERY.horizontalMaxSpeed);
    if (recovery.phase === "thrust") {
      const targetSpeed = state.verticalAxis < -0.35
        ? NOVA_RECOVERY.upSpeed
        : state.verticalAxis > 0.35
        ? NOVA_RECOVERY.downSpeed
        : NOVA_RECOVERY.neutralSpeed;
      fighter.vy = approach(fighter.vy, targetSpeed, 980 * dt);
    } else {
      const gravityScale = state.verticalAxis < -0.35
        ? NOVA_RECOVERY.slowFallGravityScale
        : state.verticalAxis > 0.35
        ? NOVA_RECOVERY.fastFallGravityScale
        : 1;
      const fallScale = state.verticalAxis < -0.35
        ? NOVA_RECOVERY.slowFallSpeedScale
        : state.verticalAxis > 0.35
        ? NOVA_RECOVERY.fastFallSpeedScale
        : 1;
      fighter.vy = Math.min(fighter.vy + fighter.stats.gravity * MOVEMENT.normalGravityMultiplier * gravityScale * dt,
        fighter.stats.maxFallSpeed * MOVEMENT.normalFallSpeedMultiplier * fallScale);
    }

    const prevX = fighter.x;
    const prevY = fighter.y;
    fighter.x += fighter.vx * dt;
    fighter.y += fighter.vy * dt;
    fighter.onGround = false;
    const collision = resolveStageCollision(match.stage, fighter, prevX, prevY, input);
    if (collision.landed) {
      fighter.recovery = null;
      fighter.action = "specialLanding";
      fighter.landingLag = Math.max(fighter.landingLag || 0, NOVA_RECOVERY.landingLag);
      fighter.vx = 0;
      fighter.vy = 0;
    } else if (tryGrabLedge(match.stage, fighter, input)) {
      fighter.recovery = null;
      fighter.action = null;
      this.handleLedgeTrump(match, fighter);
      this.addEvent(match, "ledge", fighter.id);
    }
    if (match.rules.mode === "hp" && fighter.hp <= 0) this.eliminateFighter(match, fighter);
  }

  updateMoveMechanics(match, fighter, input, attackPressed, dt) {
    const move = fighter.move;
    const state = fighter.moveState || (fighter.moveState = {});
    const nextTime = fighter.actionTime + dt;
    if (move.chainTo && attackPressed) state.chainQueued = true;
    if (!state.impulseApplied && Number.isFinite(move.impulseAt) && nextTime >= move.impulseAt) {
      state.impulseApplied = true;
      if (Number.isFinite(move.impulseX)) fighter.vx = fighter.facing * move.impulseX;
      if (Number.isFinite(move.impulseY)) {
        fighter.vy = Math.min(fighter.vy, move.impulseY);
        fighter.onGround = false;
      }
    }
    if (!state.spawned && move.projectile && nextTime >= move.spawnAt) {
      state.spawned = true;
      this.spawnProjectile(match, fighter, move.projectile, input);
    }
  }

  spawnProjectile(match, fighter, config, input) {
    match.projectileSeq = (match.projectileSeq || 0) + 1;
    const aim = config.aimDegrees
      ? input.up ? -config.aimDegrees : input.down ? config.aimDegrees : 0
      : 0;
    const radians = aim * Math.PI / 180;
    const speed = config.speed || 0;
    const move = {
      ...config,
      id: config.kind,
      hitId: "projectile",
      projectile: true,
      clankType: "projectile"
    };
    match.projectiles.push({
      id: `${fighter.id}:projectile:${match.projectileSeq}`,
      ownerId: fighter.id,
      kind: config.kind,
      x: fighter.x + fighter.facing * (config.offsetX || 0),
      y: fighter.y + (config.offsetY || 0),
      vx: fighter.facing * Math.cos(radians) * speed,
      vy: Math.sin(radians) * speed,
      facing: fighter.facing,
      w: config.w,
      h: config.h,
      age: 0,
      distance: 0,
      move
    });
    this.addEvent(match, "projectile", fighter.id, fighter.id, { x: fighter.x, y: fighter.y });
  }

  updateProjectiles(match, dt) {
    const projectiles = match.projectiles || [];
    for (const projectile of projectiles) {
      if (projectile.dead) continue;
      const dx = projectile.vx * dt;
      const dy = projectile.vy * dt;
      projectile.x += dx;
      projectile.y += dy;
      projectile.age += dt;
      projectile.distance += Math.hypot(dx, dy);
      if (projectile.age >= projectile.move.lifetime || projectile.distance >= projectile.move.maxDistance) {
        projectile.dead = true;
        continue;
      }
      const rect = this.projectileRect(projectile);
      if (match.stage.platforms.some(platform => rectsOverlap(rect, platform))) projectile.dead = true;
    }

    for (let firstIndex = 0; firstIndex < projectiles.length; firstIndex += 1) {
      const first = projectiles[firstIndex];
      if (first.dead) continue;
      for (let secondIndex = firstIndex + 1; secondIndex < projectiles.length; secondIndex += 1) {
        const second = projectiles[secondIndex];
        if (second.dead || first.ownerId === second.ownerId) continue;
        if (!rectsOverlap(this.projectileRect(first), this.projectileRect(second))) continue;
        first.dead = true;
        second.dead = true;
        this.addEvent(match, "clank", second.ownerId, first.ownerId, {
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2
        });
        break;
      }
    }

    for (const projectile of projectiles) {
      if (projectile.dead) continue;
      const rect = this.projectileRect(projectile);
      for (const fighter of match.fighters.values()) {
        if (!fighter.alive || fighter.id === projectile.ownerId || !this.isActiveAttack(fighter)) continue;
        let outcome = null;
        let fighterView = null;
        for (const move of getActiveMoveHits(fighter, fighter.move, fighter.actionTime)) {
          if (move.clankMode === "none" || !rectsOverlap(rect, getHitbox(fighter, move))) continue;
          fighterView = { ...fighter, move };
          const projectileView = {
            id: projectile.id,
            alive: true,
            move: projectile.move,
            staleMoves: [],
            actionStartedAir: false
          };
          outcome = resolveClankOutcome(fighterView, projectileView);
          if (outcome) break;
        }
        if (!outcome) continue;
        projectile.dead = true;
        if (outcome.priorityWinner !== fighterView) {
          applyClankRebound(fighter, outcome.reboundDamage, outcome.hitlag);
        }
        this.addEvent(match, "clank", fighter.id, projectile.ownerId, { x: projectile.x, y: projectile.y });
        break;
      }
    }

    for (const projectile of projectiles) {
      if (projectile.dead) continue;
      const owner = match.fighters.get(projectile.ownerId);
      if (!owner) {
        projectile.dead = true;
        continue;
      }
      const rect = this.projectileRect(projectile);
      for (const target of match.fighters.values()) {
        if (target.id === owner.id || !target.alive || target.invuln > 0 || target.dodgeInvuln > 0) continue;
        if (!rectsOverlap(rect, fighterRect(target))) continue;
        this.applyHit(match, owner, target, projectile.move);
        projectile.dead = true;
        break;
      }
    }

    match.projectiles = projectiles.filter(projectile => !projectile.dead);
  }

  projectileRect(projectile) {
    return {
      x: projectile.x - projectile.w / 2,
      y: projectile.y - projectile.h / 2,
      w: projectile.w,
      h: projectile.h
    };
  }

  startSmashCharge(fighter, move) {
    clearLedgeState(fighter, 0);
    clearDodge(fighter);
    fighter.smashCharge = {
      moveId: move.id,
      elapsed: 0,
      ratio: 0
    };
    fighter.action = "smashCharge";
    fighter.move = null;
    fighter.moveState = null;
    fighter.actionTime = 0;
    fighter.hitList = [];
    fighter.actionStartedAir = !fighter.onGround;
    fighter.shield = false;
    if (fighter.onGround) fighter.vx = 0;
  }

  updateSmashCharge(fighter, input, dt) {
    const charge = fighter.smashCharge;
    if (!charge) return null;

    if (!input.smash) {
      const baseMove = getMove(fighter.characterId, charge.moveId);
      const maxDamageMultiplier = baseMove.smashChargeDamageMax ?? SMASH_CHARGE.maxDamageMultiplier;
      const maxKnockbackMultiplier = baseMove.smashChargeKnockbackMax ?? SMASH_CHARGE.maxKnockbackMultiplier;
      const damageMultiplier = 1 + charge.ratio * (maxDamageMultiplier - 1);
      const knockbackMultiplier = 1 + charge.ratio * (maxKnockbackMultiplier - 1);
      const scaleDamage = value => Number.isFinite(value) ? roundValue(value * damageMultiplier) : value;
      const scaleHit = hit => ({
        ...hit,
        damage: scaleDamage(hit.damage),
        hpDamage: scaleDamage(hit.hpDamage),
        shieldDamage: scaleDamage(hit.shieldDamage),
        chargeKnockbackMultiplier: knockbackMultiplier
      });
      const chargedHits = Array.isArray(baseMove.hits) ? baseMove.hits.map(scaleHit) : null;
      const primaryHit = chargedHits?.[0] || scaleHit(baseMove);
      const chargedMove = {
        ...baseMove,
        ...(chargedHits ? { hits: chargedHits } : primaryHit),
        damage: primaryHit.damage,
        hpDamage: primaryHit.hpDamage,
        shieldDamage: primaryHit.shieldDamage,
        chargeRatio: charge.ratio,
        chargeDamageMultiplier: damageMultiplier,
        chargeKnockbackMultiplier: knockbackMultiplier
      };
      fighter.smashCharge = null;
      fighter.action = null;
      this.startMove(fighter, chargedMove);
      return "released";
    }

    charge.elapsed += dt;
    charge.ratio = clamp(charge.elapsed / SMASH_CHARGE.maxDuration, 0, 1);
    if (fighter.onGround) fighter.vx = 0;
    if (charge.elapsed < SMASH_CHARGE.forcedCancelDuration) return "charging";

    fighter.smashCharge = null;
    fighter.action = "smashChargeCancel";
    fighter.move = null;
    fighter.moveState = null;
    fighter.actionTime = 0;
    fighter.hitList = [];
    fighter.actionStartedAir = false;
    fighter.actionLock = SMASH_CHARGE.forcedCancelLag;
    return "forcedCancel";
  }

  clearSmashCharge(fighter) {
    fighter.smashCharge = null;
    fighter.actionLock = 0;
    if (["smashCharge", "smashChargeCancel"].includes(fighter.action)) {
      fighter.action = null;
      fighter.move = null;
      fighter.moveState = null;
      fighter.actionTime = 0;
      fighter.hitList = [];
      fighter.actionStartedAir = false;
    }
  }

  updateActionTimer(fighter, input, dt) {
    if (!fighter.action || !fighter.move) return;
    fighter.actionTime += dt;
    if (fighter.actionTime < fighter.move.total) return;
    const chainTo = fighter.move.chainTo;
    const chainReady = chainTo && (fighter.moveState?.chainQueued || (input.attack && fighter.actionTime >= fighter.move.chainOpen));
    if (chainReady) {
      this.startMove(fighter, getMove(fighter.characterId, chainTo));
      return;
    }
    fighter.action = null;
    fighter.move = null;
    fighter.moveState = null;
    fighter.actionTime = 0;
    fighter.hitList = [];
    fighter.actionStartedAir = false;
  }

  getGrabVariant(fighter, axis, facingBeforeInput) {
    const direction = Math.abs(axis) > 0.35 ? Math.sign(axis) : 0;
    const movingFast = fighter.dashTimer > 0 || Math.abs(fighter.vx) > fighter.stats.runSpeed * 0.65;
    if (movingFast && direction && direction !== facingBeforeInput) return "pivot";
    if (movingFast && direction === facingBeforeInput) return "dash";
    return "standing";
  }

  startGrabHold(match, attacker, target) {
    if (attacker.grabbing || attacker.grabbedBy || target.grabbedBy) return false;
    if (target.grabbing) this.releaseGrab(match, target, "interrupted");
    clearLedgeState(target);
    clearDodge(target);
    this.clearSmashCharge(target);
    attacker.grabbing = target.id;
    attacker.grabTimer = 0;
    attacker.grabEscape = Math.min(2.2, GRAB.holdTime + (target.damage || 0) * 0.004);
    attacker.bufferedThrow = null;
    attacker.pummelCooldown = 0.12;
    attacker.action = "grabHold";
    attacker.move = null;
    attacker.moveState = null;
    attacker.actionTime = 0;
    attacker.vx = 0;
    attacker.shield = false;

    target.grabbedBy = attacker.id;
    target.action = "grabbed";
    target.move = null;
    target.actionTime = 0;
    target.hitList = [];
    target.hitstun = 0;
    target.hitlag = 0;
    target.vx = 0;
    target.vy = 0;
    target.shield = false;
    target.crouching = false;
    this.syncGrabbedPosition(attacker, target);
    this.addEvent(match, "grab", target.id, attacker.id);
    return true;
  }

  updateGrabHolder(match, attacker, dt, state) {
    const target = match.fighters.get(attacker.grabbing);
    if (!target || !target.alive || target.grabbedBy !== attacker.id) {
      this.releaseGrab(match, attacker, "lost");
      return;
    }

    if (attacker.throwState) {
      this.updateThrowSequence(match, attacker, target, dt);
      return;
    }

    attacker.grabTimer += dt;
    attacker.grabEscape -= dt;
    attacker.vx = 0;
    attacker.vy = 0;
    attacker.shield = false;
    attacker.crouching = false;
    this.syncGrabbedPosition(attacker, target);

    if (state.attackPressed && attacker.pummelCooldown <= 0) {
      const pummel = this.applyNovaCharge(attacker, getMove(attacker.characterId, "pummel"));
      this.dealFighterDamage(match, attacker, target, pummel.damage, pummel.hpDamage);
      attacker.pummelCooldown = GRAB.pummelCooldown;
      attacker.grabEscape -= 0.08;
      this.addEvent(match, "pummel", target.id, attacker.id);
      if (match.rules.mode === "hp" && target.hp <= 0) {
        this.releaseGrab(match, attacker, "defeated", false);
        this.eliminateFighter(match, target);
        return;
      }
    }

    const requestedThrow = this.getThrowDirection(state);
    if (requestedThrow) attacker.bufferedThrow = requestedThrow;
    const throwDirection = attacker.grabTimer >= 0.12 ? attacker.bufferedThrow : null;
    if (throwDirection) {
      this.throwGrabbedFighter(match, attacker, target, throwDirection);
      return;
    }
    if (attacker.grabEscape <= 0) this.releaseGrab(match, attacker, "escape");
  }

  updateGrabbedFighter(match, target, input) {
    const attacker = match.fighters.get(target.grabbedBy);
    if (!attacker || attacker.grabbing !== target.id || !attacker.alive) {
      target.grabbedBy = null;
      target.action = null;
      return;
    }
    if (attacker.throwState) {
      this.syncThrowPosition(attacker, target);
      return;
    }
    this.syncGrabbedPosition(attacker, target);
    const buttonMash = ["jump", "attack", "smash", "special", "shield", "grab"]
      .reduce((count, action) => count + Number(input[action] && !target.lastInput[action]), 0);
    const stickMash = Number(Math.abs(horizontalInput(input) - horizontalInput(target.lastInput)) > 0.75)
      + Number(Math.abs(verticalInput(input) - verticalInput(target.lastInput)) > 0.75);
    attacker.grabEscape -= (buttonMash + stickMash) * GRAB.escapeMashValue;
  }

  getThrowDirection(state) {
    if (state.verticalAxis < -0.55 && state.lastVerticalAxis >= -0.55) return "up";
    if (state.verticalAxis > 0.55 && state.lastVerticalAxis <= 0.55) return "down";
    if (state.axis < -0.55 && state.lastAxis >= -0.55) return "left";
    if (state.axis > 0.55 && state.lastAxis <= 0.55) return "right";
    return state.grabPressed ? "forward" : null;
  }

  throwGrabbedFighter(match, attacker, target, direction) {
    const horizontalDirection = direction === "left" ? -1 : direction === "right" ? 1 : 0;
    const variant = direction === "up"
      ? "Up"
      : direction === "down"
      ? "Down"
      : horizontalDirection === attacker.facing ? "Forward" : "Back";
    const move = getMove(attacker.characterId, `throw${variant}`);
    attacker.throwState = {
      moveId: move.id,
      elapsed: 0,
      nextHit: 0,
      variant: variant.toLowerCase()
    };
    attacker.action = move.id;
    attacker.move = null;
    attacker.moveState = { staleRecorded: false };
    attacker.actionTime = 0;
    attacker.bufferedThrow = null;
    attacker.vx = 0;
    this.syncThrowPosition(attacker, target);
  }

  updateThrowSequence(match, attacker, target, dt) {
    const state = attacker.throwState;
    const move = getMove(attacker.characterId, state.moveId);
    state.elapsed += dt;
    attacker.actionTime = state.elapsed;
    attacker.vx = 0;
    attacker.vy = 0;
    this.syncThrowPosition(attacker, target);

    while (state.nextHit < move.hits.length && state.elapsed >= move.hits[state.nextHit].start) {
      let hit = { ...move.hits[state.nextHit], id: move.id, hitId: move.hits[state.nextHit].id };
      state.nextHit += 1;
      hit = this.applyNovaCharge(attacker, hit);
      hit = this.resolveMoveAngle(attacker, target, hit);
      this.dealFighterDamage(match, attacker, target, hit.damage, hit.hpDamage);
      target.lastHitBy = attacker.id;
      attacker.hitlag = Math.max(attacker.hitlag || 0, (hit.hitlag || 0.04) * 0.5);
      target.hitlag = Math.max(target.hitlag || 0, hit.hitlag || 0.04);
      this.addEvent(match, "pummel", target.id, attacker.id);
      if (hit.noLaunch) continue;

      this.detachGrabbedFighter(attacker, target);
      const launch = calculateLaunch({ move: hit, attacker, target, rules: match.rules, targetInput: target.currentInput });
      this.applyLaunchToFighter(target, launch);
      attacker.action = "throwEnd";
      attacker.actionLock = Math.max(attacker.actionLock || 0, Math.max(0.08, move.total - state.elapsed));
      this.rememberMoveUse(attacker, move.id);
      this.addEvent(match, "throw", target.id, attacker.id);
      if (match.rules.mode === "hp" && target.hp <= 0) this.eliminateFighter(match, target);
      return;
    }

    if (state.elapsed >= move.total) this.releaseGrab(match, attacker, "throw", false);
  }

  syncThrowPosition(attacker, target) {
    const state = attacker.throwState;
    const variant = state?.variant;
    let side = attacker.facing;
    let offsetY = 0;
    if (variant === "back" && state.elapsed >= 0.13) side = -attacker.facing;
    if (variant === "down") {
      side = -attacker.facing;
      offsetY = attacker.h * 0.42;
    }
    if (variant === "up") offsetY = -attacker.h * 0.62;
    target.x = attacker.x + side * (attacker.w / 2 + target.w / 2 - 4);
    target.y = attacker.y + offsetY;
    target.facing = -attacker.facing;
    target.vx = 0;
    target.vy = 0;
    target.onGround = attacker.onGround && variant !== "up";
  }

  detachGrabbedFighter(attacker, target) {
    attacker.grabbing = null;
    attacker.grabTimer = 0;
    attacker.grabEscape = 0;
    attacker.bufferedThrow = null;
    attacker.throwState = null;
    attacker.action = null;
    attacker.moveState = null;
    attacker.actionTime = 0;
    target.grabbedBy = null;
    target.action = null;
  }

  releaseGrab(match, attacker, reason = "release", grantInvuln = true) {
    const target = attacker?.grabbing ? match.fighters.get(attacker.grabbing) : null;
    if (attacker) {
      const wasThrowing = Boolean(attacker.throwState);
      attacker.grabbing = null;
      attacker.grabTimer = 0;
      attacker.grabEscape = 0;
      attacker.bufferedThrow = null;
      attacker.throwState = null;
      attacker.moveState = null;
      if (attacker.action === "grabHold" || wasThrowing) attacker.action = null;
    }
    if (!target) return;
    target.grabbedBy = null;
    target.action = null;
    target.vx = attacker.facing * 75;
    target.vy = 0;
    target.x = attacker.x + attacker.facing * (attacker.w / 2 + target.w / 2 + 10);
    if (grantInvuln && reason !== "throw") target.invuln = Math.max(target.invuln || 0, GRAB.releaseInvuln);
  }

  releaseFighterGrabRelations(match, fighter) {
    if (fighter.grabbing) this.releaseGrab(match, fighter, "interrupted");
    if (!fighter.grabbedBy) return;
    const holder = match.fighters.get(fighter.grabbedBy);
    if (holder) this.releaseGrab(match, holder, "interrupted");
    else fighter.grabbedBy = null;
  }

  syncGrabbedPosition(attacker, target) {
    target.x = attacker.x + attacker.facing * (attacker.w / 2 + target.w / 2 - 4);
    target.y = attacker.y;
    target.facing = -attacker.facing;
    target.vx = 0;
    target.vy = 0;
    target.onGround = attacker.onGround;
  }

  resolveFighterCollisions(match) {
    const fighters = Array.from(match.fighters.values());
    for (let firstIndex = 0; firstIndex < fighters.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < fighters.length; secondIndex += 1) {
        resolveFighterBodyCollision(fighters[firstIndex], fighters[secondIndex]);
      }
    }
  }

  resolveAttackClanks(match) {
    const fighters = Array.from(match.fighters.values());
    for (let firstIndex = 0; firstIndex < fighters.length; firstIndex += 1) {
      const first = fighters[firstIndex];
      if (!this.isActiveAttack(first)) continue;
      for (let secondIndex = firstIndex + 1; secondIndex < fighters.length; secondIndex += 1) {
        const second = fighters[secondIndex];
        if (!this.isActiveAttack(second)) continue;
        const firstHits = getActiveMoveHits(first, first.move, first.actionTime);
        const secondHits = getActiveMoveHits(second, second.move, second.actionTime);
        let outcome = null;
        let firstView = null;
        let secondView = null;
        for (const firstMove of firstHits) {
          for (const secondMove of secondHits) {
            if (!rectsOverlap(getHitbox(first, firstMove), getHitbox(second, secondMove))) continue;
            firstView = { ...first, move: firstMove };
            secondView = { ...second, move: secondMove };
            outcome = resolveClankOutcome(firstView, secondView);
            if (outcome) break;
          }
          if (outcome) break;
        }
        if (!outcome) continue;

        match.clankPairs.add(this.fighterPairKey(first.id, second.id));
        if (outcome.priorityWinner) {
          const winnerIsFirst = outcome.priorityWinner === firstView;
          const loser = winnerIsFirst ? second : first;
          const loserMove = winnerIsFirst ? outcome.secondMove : outcome.firstMove;
          if (loserMove.clankMode !== "through") applyClankRebound(loser, outcome.reboundDamage, 0);
        } else {
          if (outcome.firstMove.clankMode !== "through") {
            applyClankRebound(first, outcome.reboundDamage, outcome.hitlag);
          }
          if (outcome.secondMove.clankMode !== "through") {
            applyClankRebound(second, outcome.reboundDamage, outcome.hitlag);
          }
        }
        this.addEvent(match, "clank", second.id, first.id, {
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2
        });
      }
    }
  }

  updateAttacks(match) {
    const pendingHits = [];
    for (const attacker of match.fighters.values()) {
      if (!this.isActiveAttack(attacker)) continue;
      for (const move of getActiveMoveHits(attacker, attacker.move, attacker.actionTime)) {
        const hitbox = getHitbox(attacker, move);
        for (const target of match.fighters.values()) {
          if (target.id === attacker.id || !target.alive || target.invuln > 0 || target.dodgeInvuln > 0) continue;
          if (match.clankPairs.has(this.fighterPairKey(attacker.id, target.id))) continue;
          const hitKey = `${move.hitId || "main"}:${target.id}`;
          if (attacker.hitList.includes(hitKey)) continue;
          if (!rectsOverlap(hitbox, fighterRect(target))) continue;
          attacker.hitList.push(hitKey);
          pendingHits.push({ attacker, target, move });
        }
      }
    }

    for (const { attacker, target, move } of pendingHits) {
      if (move.type === "grab") this.startGrabHold(match, attacker, target);
      else this.applyHit(match, attacker, target, move);
    }
  }

  isActiveAttack(fighter) {
    return Boolean(
      fighter.alive && fighter.move && fighter.hitlag <= 0 &&
      getActiveMoveHits(fighter, fighter.move, fighter.actionTime).length > 0
    );
  }

  fighterPairKey(firstId, secondId) {
    return firstId < secondId ? `${firstId}|${secondId}` : `${secondId}|${firstId}`;
  }

  handleLedgeTrump(match, grabber) {
    if (!grabber.ledge) return;
    const ledge = grabber.ledge;
    for (const other of match.fighters.values()) {
      if (other.id === grabber.id || !other.ledge) continue;
      const sameLedge = Math.abs(other.ledge.x - ledge.x) < 2 && Math.abs(other.ledge.y - ledge.y) < 2;
      if (!sameLedge) continue;
      clearLedgeState(other);
      other.action = null;
      other.move = null;
      other.actionTime = 0;
      other.x = ledge.x + ledge.side * (other.w / 2 + 18);
      other.y = ledge.y + 54;
      other.vx = ledge.side * 155;
      other.vy = 135;
      other.hitstun = Math.max(other.hitstun, 0.18);
      this.addEvent(match, "ledge", other.id, grabber.id);
    }
  }

  applyHit(match, attacker, target, move) {
    this.registerMoveContact(attacker, move);
    move = this.applyNovaCharge(attacker, move);
    move = this.resolveMoveAngle(attacker, target, move);
    const rules = match.rules;
    const perfectGuard = target.perfectShieldWindow > 0 && !move.beatsShield;
    const blocked = (target.shield || perfectGuard) && !move.beatsShield;

    if (blocked) {
      if (perfectGuard && applyPerfectShield(target, attacker, move)) {
        this.rememberMoveUse(attacker, move.id);
        this.addEvent(match, "justGuard", target.id, attacker.id);
        return;
      }
      const shieldResult = applyShieldDamage(target, move);
      if (shieldResult.broken) {
        target.lastHitBy = attacker.id;
        attacker.hitlag = Math.max(attacker.hitlag, move.hitlag || 0.06);
        this.rememberMoveUse(attacker, move.id);
        this.addEvent(match, "shieldBreak", target.id, attacker.id);
        return;
      }
    }

    if (!blocked) {
      this.releaseFighterGrabRelations(match, target);
      this.dealFighterDamage(match, attacker, target, move.damage, move.hpDamage, {
        buildFinalGauge: move.buildsFinalGauge !== false
      });
      target.lastHitBy = attacker.id;
      target.action = null;
      target.move = null;
      target.moveState = null;
      target.actionTime = 0;
      target.hitList = [];
      target.actionStartedAir = false;
    }

    if (move.noLaunch) {
      attacker.hitlag = Math.max(attacker.hitlag || 0, (move.hitlag || 0.04) * 0.65);
      this.rememberMoveUse(attacker, move.id);
      this.addEvent(match, blocked ? "shield" : "hit", target.id, attacker.id);
      return;
    }

    clearLedgeState(target);
    clearDodge(target);
    const launch = calculateLaunch({
      move,
      attacker,
      target,
      rules,
      blocked,
      targetInput: target.currentInput
    });
    this.applyLaunchToFighter(target, launch);
    attacker.hitlag = Math.max(attacker.hitlag, launch.hitlag * 0.65);
    this.rememberMoveUse(attacker, move.id);
    this.addEvent(match, blocked ? "shield" : "hit", target.id, attacker.id);
    if (rules.mode === "hp" && target.hp <= 0) this.eliminateFighter(match, target);
  }

  registerMoveContact(attacker, move = attacker.move) {
    if (!attacker.moveState || attacker.move?.id !== move?.id) return;
    attacker.moveState.contact = true;
    if (Number.isFinite(attacker.move?.contactTotal)) {
      attacker.move.total = Math.max(attacker.move.total, attacker.move.contactTotal);
    }
  }

  applyNovaCharge(attacker, move) {
    const stored = Math.max(0, attacker.novaCharge || 0);
    if (attacker.characterId !== "nova" || stored <= 0 || move.ignoreNovaCharge || (move.damage || 0) <= 0) return move;
    const ratio = clamp(stored / NOVA_CHARGE.maxDuration, 0, 1);
    const multiplier = 1 + ratio * (NOVA_CHARGE.maxDamageMultiplier - 1);
    const scale = value => Number.isFinite(value) ? roundValue(value * multiplier) : value;
    attacker.novaCharge = 0;
    return {
      ...move,
      damage: scale(move.damage),
      hpDamage: scale(move.hpDamage),
      shieldDamage: scale(move.shieldDamage),
      novaChargeMultiplier: multiplier
    };
  }

  resolveMoveAngle(attacker, target, move) {
    if (move.angleMode !== "towardTargetUp") return move;
    const horizontalDistance = Math.abs(target.x - attacker.x);
    const userAngle = clamp(horizontalDistance / 120 * 75, 0, 75);
    return { ...move, angle: 90 - userAngle };
  }

  dealFighterDamage(match, attacker, target, damage, hpDamage = damage, { buildFinalGauge = true } = {}) {
    let appliedDamage = 0;
    if (match.rules.mode === "hp") {
      const previousHp = target.hp;
      target.hp = Math.max(0, target.hp - Math.max(0, hpDamage));
      appliedDamage = previousHp - target.hp;
    } else {
      const previousDamage = target.damage;
      target.damage += Math.max(0, damage);
      appliedDamage = target.damage - previousDamage;
    }
    if (buildFinalGauge) addFinalGaugeFromDamage(attacker, target, appliedDamage, match.rules.finalSmash);
    return appliedDamage;
  }

  applyLaunchToFighter(target, launch) {
    this.clearSmashCharge(target);
    target.novaCharging = false;
    target.recovery = null;
    target.throwState = null;
    target.moveState = null;
    target.vx = launch.vx;
    target.vy = launch.vy;
    target.hitstun = launch.hitstun;
    target.hitlag = Math.max(target.hitlag || 0, launch.hitlag);
    target.tumbling = launch.tumble;
    target.meteor = launch.meteor;
    target.onGround = false;
    target.jumps = Math.min(target.jumps, Math.max(0, target.maxJumps - 1));
    target.crouching = false;
    target.clankLag = 0;
  }

  rememberMoveUse(attacker, moveId) {
    if (attacker.move?.id === moveId && attacker.moveState) {
      if (attacker.moveState.staleRecorded) return;
      attacker.moveState.staleRecorded = true;
    }
    attacker.staleMoves = attacker.staleMoves || [];
    attacker.staleMoves.unshift(moveId);
    if (attacker.staleMoves.length > KNOCKBACK.staleQueueSize) attacker.staleMoves.length = KNOCKBACK.staleQueueSize;
  }

  checkBoundsAndHealth(match, fighter) {
    if (!fighter.alive) return;
    const blast = match.stage.blast;
    if (fighter.x < blast.left || fighter.x > blast.right || fighter.y < blast.top || fighter.y > blast.bottom) {
      this.eliminateFighter(match, fighter);
    }
  }

  eliminateFighter(match, fighter) {
    if (!fighter.alive || fighter.eliminated) return;
    this.releaseFighterGrabRelations(match, fighter);
    fighter.novaCharge = 0;
    fighter.novaCharging = false;
    fighter.recovery = null;
    fighter.throwState = null;
    applyFinalGaugeKoRule(fighter, match.rules.finalSmash);
    fighter.falls += 1;
    if (fighter.lastHitBy && fighter.lastHitBy !== fighter.id) {
      const killer = match.fighters.get(fighter.lastHitBy);
      if (killer) killer.kills += 1;
    }
    this.addEvent(match, "ko", fighter.id, fighter.lastHitBy, { x: fighter.x, y: fighter.y });

    if (match.rules.mode === "practice") {
      this.respawnFighter(fighter, { practice: true });
      return;
    }
    if (match.rules.mode === "stock") {
      fighter.stocks -= 1;
      if (fighter.stocks <= 0) {
        fighter.alive = false;
        fighter.eliminated = true;
        return;
      }
      fighter.alive = false;
      fighter.respawn = 1.6;
      return;
    }
    if (match.rules.mode === "time") {
      fighter.alive = false;
      fighter.respawn = 1.6;
      return;
    }
    fighter.alive = false;
    fighter.eliminated = true;
  }

  respawnFighter(fighter, { practice = false } = {}) {
    fighter.x = fighter.spawnX;
    fighter.y = fighter.spawnY - (practice ? 0 : 90);
    fighter.vx = 0;
    fighter.vy = 0;
    fighter.damage = 0;
    fighter.maxHp = fighter.maxHp || DEFAULT_RULES.hp;
    fighter.hp = fighter.maxHp;
    fighter.alive = true;
    fighter.eliminated = false;
    fighter.respawn = 0;
    fighter.respawnPlatform = practice ? 0 : RESPAWN.platformTime;
    fighter.shield = false;
    fighter.onGround = practice && fighter.spawnOnGround;
    fighter.invuln = practice ? 0 : RESPAWN.invuln;
    fighter.hitstun = 0;
    fighter.hitlag = 0;
    clearLedgeState(fighter, 0);
    clearDodge(fighter);
    fighter.dodgeInvuln = 0;
    fighter.hasAirDodged = false;
    fighter.landingLag = 0;
    fighter.techWindow = 0;
    fighter.techLockout = 0;
    fighter.shieldReleaseLag = 0;
    fighter.clankLag = 0;
    fighter.actionLock = 0;
    fighter.perfectShieldWindow = 0;
    fighter.perfectShieldFlash = 0;
    fighter.crouching = false;
    fighter.tumbling = false;
    fighter.meteor = false;
    fighter.grabbing = null;
    fighter.grabbedBy = null;
    fighter.grabTimer = 0;
    fighter.grabEscape = 0;
    fighter.bufferedThrow = null;
    fighter.pummelCooldown = 0;
    fighter.fastFalling = false;
    fighter.dashTimer = 0;
    fighter.dashDirection = 0;
    fighter.runRampElapsed = 0;
    fighter.runRampDirection = 0;
    fighter.jumpCutAvailable = false;
    fighter.actionStartedAir = false;
    fighter.ledgeGrabCount = 0;
    fighter.action = null;
    fighter.move = null;
    fighter.moveState = null;
    fighter.smashCharge = null;
    fighter.novaCharge = 0;
    fighter.novaCharging = false;
    fighter.recovery = null;
    fighter.throwState = null;
    fighter.actionTime = 0;
    fighter.hitList = [];
    fighter.jumps = fighter.maxJumps;
    fighter.lastHitBy = null;
    resetShield(fighter);
  }

  shouldFinish(match) {
    if (match.rules.mode === "practice") return false;
    const fighters = Array.from(match.fighters.values());
    if (fighters.length < 2) return true;
    if (match.rules.mode === "time") return match.elapsed >= match.rules.timeLimit;
    return fighters.filter(fighter => !fighter.eliminated).length <= 1;
  }

  buildResult(match, reason) {
    const ranked = this.rankFighters(match);
    let previousKey = null;
    let currentRank = 1;
    return {
      reason,
      rules: { ...match.rules },
      elapsed: match.elapsed,
      rows: ranked.map((fighter, index) => {
        const key = this.rankingKey(match, fighter);
        if (previousKey !== null && key !== previousKey) currentRank = index + 1;
        previousKey = key;
        return {
          rank: currentRank,
          id: fighter.id,
          name: fighter.name,
          kills: fighter.kills,
          falls: fighter.falls,
          damage: Math.round(fighter.damage),
          hp: Math.round(fighter.hp),
          stocks: fighter.stocks,
          eliminated: fighter.eliminated
        };
      })
    };
  }

  rankFighters(match) {
    return Array.from(match.fighters.values()).sort((a, b) => {
      if (match.rules.mode === "time") return (b.kills - b.falls) - (a.kills - a.falls);
      if (match.rules.mode === "hp") return Number(a.eliminated) - Number(b.eliminated) || b.hp - a.hp;
      return Number(a.eliminated) - Number(b.eliminated) || b.stocks - a.stocks;
    });
  }

  rankingKey(match, fighter) {
    if (match.rules.mode === "time") return `time:${fighter.kills - fighter.falls}`;
    if (match.rules.mode === "hp") return `hp:${Number(fighter.eliminated)}:${Math.round(fighter.hp)}`;
    return `stock:${Number(fighter.eliminated)}:${fighter.stocks}`;
  }

  addEvent(match, kind, targetId, sourceId, details = null) {
    match.eventSeq += 1;
    const revision = match.rollback?.revision || 0;
    const event = {
      id: `${revision}-${match.frame}-${match.eventSeq}`,
      kind,
      targetId,
      sourceId,
      ...(details || {})
    };
    match.events.push(event);
    if (this.onEvent) this.onEvent(event, match);
  }

  snapshot(match, extras = {}) {
    return {
      id: match.id,
      frame: match.frame,
      phase: extras.phase || (match.rules.mode === "practice" ? "practice" : "game"),
      stage: match.stage,
      rules: match.rules,
      ...(extras.serverTime === undefined ? {} : { serverTime: extras.serverTime }),
      ...(extras.stateHash === undefined ? {} : { stateHash: extras.stateHash }),
      ...(extras.net === undefined ? {} : { net: extras.net }),
      countdown: match.countdown,
      elapsed: match.elapsed,
      remainingTime: match.rules.mode === "practice" ? 0 : Math.max(0, match.rules.timeLimit - match.elapsed),
      finalSmash: match.finalSmash ? {
        fighterId: match.finalSmash.fighterId,
        remaining: roundValue(match.finalSmash.remaining),
        elapsed: roundValue(match.finalSmash.elapsed || 0),
        punchDone: Boolean(match.finalSmash.punchDone)
      } : null,
      fighters: Array.from(match.fighters.values()).map(fighter => ({
        id: fighter.id,
        name: fighter.name,
        characterId: fighter.characterId,
        weightClass: fighter.weightClass,
        slot: fighter.slot,
        colorIndex: fighter.colorIndex,
        x: roundValue(fighter.x),
        y: roundValue(fighter.y),
        vx: roundValue(fighter.vx),
        vy: roundValue(fighter.vy),
        w: fighter.w,
        h: fighter.h,
        facing: fighter.facing,
        damage: roundValue(fighter.damage),
        finalGauge: roundValue(fighter.finalGauge || 0),
        hp: roundValue(fighter.hp),
        stocks: fighter.stocks,
        kills: fighter.kills,
        falls: fighter.falls,
        alive: fighter.alive,
        eliminated: fighter.eliminated,
        respawn: roundValue(fighter.respawn),
        invuln: roundValue(Math.max(fighter.invuln, fighter.dodgeInvuln || 0)),
        shield: fighter.shield,
        shieldHp: roundValue(fighter.shieldHp),
        shieldMax: roundValue(fighter.shieldMax),
        shieldStun: roundValue(fighter.shieldStun),
        shieldReleaseLag: roundValue(fighter.shieldReleaseLag || 0),
        actionLock: roundValue(fighter.actionLock || 0),
        justGuard: fighter.perfectShieldFlash > 0,
        hitstun: roundValue(fighter.hitstun),
        crouching: Boolean(fighter.crouching),
        tumbling: Boolean(fighter.tumbling),
        meteor: Boolean(fighter.meteor),
        grabbing: fighter.grabbing,
        grabbedBy: fighter.grabbedBy,
        landingLag: roundValue(fighter.landingLag),
        respawnPlatform: roundValue(fighter.respawnPlatform),
        ledge: fighter.ledge ? { ...fighter.ledge } : null,
        dodge: fighter.dodge ? fighter.dodge.type : null,
        networkStatus: fighter.networkStatus || "ok",
        inputSeq: fighter.inputSeq || 0,
        action: fighter.action,
        move: fighter.move ? fighter.move.id : null,
        actionTime: roundValue(fighter.actionTime || 0),
        novaCharge: roundValue(fighter.novaCharge || 0),
        novaChargeRatio: roundValue((fighter.novaCharge || 0) / NOVA_CHARGE.maxDuration),
        novaCharging: Boolean(fighter.novaCharging),
        recovery: fighter.recovery ? { ...fighter.recovery, elapsed: roundValue(fighter.recovery.elapsed) } : null,
        smashCharge: fighter.smashCharge ? {
          elapsed: roundValue(fighter.smashCharge.elapsed),
          ratio: roundValue(fighter.smashCharge.ratio),
          maxed: fighter.smashCharge.ratio >= 1
        } : null,
        hitbox: getActiveMoveHits(fighter, fighter.move, fighter.actionTime)[0]
          ? getHitbox(fighter, getActiveMoveHits(fighter, fighter.move, fighter.actionTime)[0])
          : null,
        hitboxes: getActiveMoveHits(fighter, fighter.move, fighter.actionTime)
          .map(move => ({ ...getHitbox(fighter, move), hitId: move.hitId }))
      })),
      projectiles: (match.projectiles || []).map(projectile => ({
        id: projectile.id,
        ownerId: projectile.ownerId,
        kind: projectile.kind,
        x: roundValue(projectile.x),
        y: roundValue(projectile.y),
        vx: roundValue(projectile.vx),
        vy: roundValue(projectile.vy),
        facing: projectile.facing,
        w: projectile.w,
        h: projectile.h
      })),
      events: match.events
    };
  }
}

export function normalizeBattleInput(input = null) {
  const source = input && typeof input === "object" ? input : {};
  const fallbackX = (source.right ? 1 : 0) - (source.left ? 1 : 0);
  const fallbackY = (source.down ? 1 : 0) - (source.up ? 1 : 0);
  const moveX = finiteClamp(source.moveX, -1, 1, fallbackX);
  const moveY = finiteClamp(source.moveY, -1, 1, fallbackY);
  return {
    moveX,
    moveY,
    left: moveX < -0.35,
    right: moveX > 0.35,
    up: moveY < -0.35,
    down: moveY > 0.35,
    jump: Boolean(source.jump),
    attack: Boolean(source.attack),
    smash: Boolean(source.smash),
    special: Boolean(source.special),
    shield: Boolean(source.shield),
    grab: Boolean(source.grab)
  };
}

function finiteClamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
