(() => {
  "use strict";

  window.createHealerBattleRuntime = function createHealerBattleRuntime(context) {
    const {
      view,
      input,
      game,
      player,
      party,
      enemies,
      projectiles,
      telegraphs,
      areas,
      effects,
      effectSystem,
      skillSystem,
      getItemSystem,
      ACTION_GAP,
      SHIELD_MOOD_GAIN_PER_SEC,
      battlePx,
      clamp,
      distPoint,
      getBattleBounds,
      updateTown,
      updatePartyAi,
      updateEnemyAi,
      separateUnits,
      spawnRearVanguardWave,
      regenerateHp,
      regenerateMp,
      getUltimateChargeRate,
      getMoodNaturalDelta,
      applyCommandMoodDelta,
      applyMoodHighGainDamping,
      addMoodGain,
      updateDelayedDamage,
      updateRihasPassiveStacks,
      dealDamage,
      canFriendlyFireAffect,
      healUnit,
      addGold,
      addItem,
    } = context;

    function isSystemMenuPaused() {
      const menu = game.systemMenu;
      return Boolean(game.state === "playing" && menu && (menu.open || menu.panel || menu.confirm));
    }

    function isActionDisabled(unit) {
      return Boolean(unit && ((unit.frozen || 0) > 0 || (unit.sleepTimer || 0) > 0 || (unit.absorptionLockTimer || 0) > 0));
    }

    function update(dt) {
      if (isSystemMenuPaused()) {
        return;
      }
      game.time += dt;
      if (game.messageTimer > 0) {
        game.messageTimer -= dt;
      }

      updateEffects(dt);
      if (game.state === "town") {
        updateTown(dt);
        return;
      }
      if (game.state !== "playing") {
        return;
      }

      game.hover = getHoveredPartyMember();
      updateCooldownsAndTimers(dt);
      const itemSystem = getItemSystem ? getItemSystem() : null;
      if (itemSystem && itemSystem.updateItemUsage) {
        itemSystem.updateItemUsage(dt);
      }
      updatePriorityTarget(dt);
      updateAvoidTarget(dt);
      updatePlayer(dt);
      updatePartyAi(dt);
      updateEnemyAi(dt);
      updateProjectiles(dt);
      updateTelegraphs(dt);
      updateAreas(dt);
      separateUnits(dt);
      clearInvalidPriorityTarget();
      clearInvalidAvoidTarget();
      collectDefeatedEnemyDrops();
      checkBattleState(dt);
    }

    function updateCooldownsAndTimers(dt) {
      for (const unit of [...party, ...enemies]) {
        if (unit.dead) {
          enforceIncapacitatedState(unit);
          continue;
        }

        unit.noDamage += dt;
        if (unit.actionLock > 0 && (!unit.actionTotal || unit.actionTotal < unit.actionLock)) {
          unit.actionTotal = unit.actionLock;
        }
        unit.actionLock = Math.max(0, unit.actionLock - dt);
        if (unit.actionLock <= 0) {
          unit.actionTotal = 0;
        }
        if (unit.castVisual) {
          unit.castVisual.time = Math.max(0, (unit.castVisual.time || 0) - dt);
          if (unit.castVisual.time <= 0) {
            unit.castVisual = null;
          }
        }
        unit.hurt = Math.max(0, unit.hurt - dt);
        unit.guardFlash = Math.max(0, unit.guardFlash - dt);
        unit.frozen = Math.max(0, unit.frozen - dt);
        if (unit.frozen <= 0) {
          unit.frozenMax = 0;
        }
        unit.sleepTimer = Math.max(0, (unit.sleepTimer || 0) - dt);
        if (unit.sleepTimer <= 0) {
          unit.sleepMax = 0;
        }
        unit.contemptTimer = Math.max(0, (unit.contemptTimer || 0) - dt);
        if (unit.contemptTimer <= 0) {
          unit.contemptStacks = 0;
          unit.contemptMax = 0;
        }
        const previousFeelTimer = unit.feelTimer || 0;
        unit.feelTimer = Math.max(0, previousFeelTimer - dt);
        if (previousFeelTimer > 0 && unit.feelTimer <= 0) {
          const guarded = Math.max(0, Math.floor(unit.feelGuardCount || 0));
          if (guarded > 0) {
            unit.desteStacks = Math.max(0, Math.floor(unit.desteStacks || 0)) + guarded;
            if (typeof addFloat === "function") {
              addFloat(`ディステ+${guarded}`, unit.x, unit.y - 34, "#f2c56d");
            }
          }
          unit.feelMax = 0;
          unit.feelGuardCount = 0;
        }
        unit.sorrowTimer = Math.max(0, (unit.sorrowTimer || 0) - dt);
        if (unit.sorrowTimer <= 0) {
          unit.sorrowMax = 0;
          unit.sorrowTick = 0;
        }
        unit.reunionTimer = Math.max(0, (unit.reunionTimer || 0) - dt);
        if (unit.reunionTimer <= 0) {
          unit.reunionMax = 0;
          unit.reunionSource = null;
        }
        unit.absorptionLockTimer = Math.max(0, (unit.absorptionLockTimer || 0) - dt);
        unit.injuryTimer = Math.max(0, (unit.injuryTimer || 0) - dt);
        if (unit.injuryTimer <= 0) {
          unit.injuryMax = 0;
        }
        unit.leakageTimer = Math.max(0, (unit.leakageTimer || 0) - dt);
        if (unit.leakageTimer <= 0) {
          unit.leakageMax = 0;
        }
        unit.tingleTimer = Math.max(0, (unit.tingleTimer || 0) - dt);
        if (unit.tingleTimer <= 0) {
          unit.tingleMax = 0;
        }
        unit.freezingTimer = Math.max(0, (unit.freezingTimer || 0) - dt);
        if (unit.freezingTimer <= 0) {
          unit.freezingMax = 0;
        }
        unit.magicNeutralizeTimer = Math.max(0, (unit.magicNeutralizeTimer || 0) - dt);
        if (unit.magicNeutralizeTimer <= 0) {
          unit.magicNeutralizeMax = 0;
          unit.magicNeutralizeRatio = 0;
        }
        unit.actionSpeedDownTimer = Math.max(0, (unit.actionSpeedDownTimer || 0) - dt);
        if (unit.actionSpeedDownTimer <= 0) {
          unit.actionSpeedDownMax = 0;
          unit.actionSpeedDownRatio = 0;
        }
        unit.shadowDashTimer = Math.max(0, (unit.shadowDashTimer || 0) - dt);
        if (unit.shadowDashTimer <= 0) {
          unit.shadowDashMax = 0;
        }
        unit.sharpenBladeTimer = Math.max(0, (unit.sharpenBladeTimer || 0) - dt);
        if (unit.sharpenBladeTimer <= 0) {
          unit.sharpenBladeMax = 0;
        }
        unit.counterattackStanceTimer = Math.max(0, (unit.counterattackStanceTimer || 0) - dt);
        if (unit.counterattackStanceTimer <= 0) {
          unit.counterattackStanceMax = 0;
          unit.counterattackStanceStacks = 0;
          unit.counterattackRange = 0;
        }
        unit.flinchingTimer = Math.max(0, (unit.flinchingTimer || 0) - dt);
        if (unit.flinchingTimer <= 0) {
          unit.flinchingMax = 0;
        }
        unit.stackCooldown = Math.max(0, unit.stackCooldown - dt);
        updateDelayedDamage(unit, dt);
        if (enforceIncapacitatedState(unit)) {
          continue;
        }
        updateRihasPassiveStacks(unit, dt);

        if (unit.stackTimer > 0) {
          unit.stackTimer -= dt;
          if (unit.stackTimer <= 0) {
            unit.castStacks = 0;
          }
        }

        if (unit.tauntTimer > 0) {
          unit.tauntTimer -= dt;
          if (unit.tauntTimer <= 0) {
            unit.forcedTarget = null;
          }
        }

        updateBurn(unit, dt);
        updatePoison(unit, dt);
        if (enforceIncapacitatedState(unit)) {
          continue;
        }
        updateSorrow(unit, dt);
        updateShieldStacks(unit, dt);

        for (const key of Object.keys(unit.cds)) {
          if (key === "attack" && (isActionDisabled(unit) || unit.chocolateLilyCharging)) continue;
          const before = unit.cds[key] || 0;
          unit.cds[key] = Math.max(0, before - dt);
          if (before > 0 && unit.cds[key] <= 0 && skillSystem.onCooldownReady) {
            skillSystem.onCooldownReady(unit, key);
          }
        }

        regenerateHp(unit, dt);
        if (enforceIncapacitatedState(unit)) {
          continue;
        }
        regenerateMp(unit, dt);

        if (unit.team === "party") {
          const chargeRate = typeof getUltimateChargeRate === "function" ? getUltimateChargeRate(unit) : 1;
          unit.ult = clamp(unit.ult + dt * 0.6 * chargeRate, 0, skillSystem.getUltimateCost ? skillSystem.getUltimateCost(unit) : 100);
        }

        if (unit.team === "party" && unit.id !== "finald") {
          const naturalDelta = applyCommandMoodDelta(unit, getMoodNaturalDelta(unit) * dt);
          const adjustedDelta = naturalDelta > 0 ? applyMoodHighGainDamping(unit, naturalDelta) : naturalDelta;
          unit.mood = clamp(unit.mood + adjustedDelta, 0, 100);
        }
      }
    }

    function updatePriorityTarget(dt) {
      clearInvalidPriorityTarget();
      if (!game.priorityTarget) {
        game.priorityTargetTimer = 0;
        game.priorityTargetIgnoredUnitIds = {};
        return;
      }
      if (!Number.isFinite(game.priorityTargetTimer) || game.priorityTargetTimer <= 0) {
        return;
      }
      game.priorityTargetTimer = Math.max(0, game.priorityTargetTimer - dt);
      if (game.priorityTargetTimer <= 0) {
        const target = game.priorityTarget;
        clearFocusDamageTakenBonus(target);
        game.priorityTarget = null;
        game.priorityTargetIgnoredUnitIds = {};
        clearPartyAttackIntents();
        addFloat("フォーカス終了", target.x, target.y - 36, "#f7fff6");
      }
    }

    function updateAvoidTarget(dt) {
      clearInvalidAvoidTarget();
      if (!game.avoidTarget) {
        game.avoidTargetTimer = 0;
        return;
      }
      if (!Number.isFinite(game.avoidTargetTimer) || game.avoidTargetTimer <= 0) {
        return;
      }
      game.avoidTargetTimer = Math.max(0, game.avoidTargetTimer - dt);
      if (game.avoidTargetTimer <= 0) {
        const target = game.avoidTarget;
        game.avoidTarget = null;
        clearPartyAttackIntents();
        addFloat("ディスタンス終了", target.x, target.y - 36, "#f7fff6");
      }
    }

    function updateBurn(unit, dt) {
      if (!unit || unit.dead) {
        return;
      }
      if ((unit.burnTimer || 0) <= 0) {
        clearBurn(unit);
        return;
      }
      const elapsed = Math.min(dt, unit.burnTimer);
      const tickRate = Number.isFinite(unit.burnTickRate) && unit.burnTickRate > 0 ? unit.burnTickRate : 1;
      unit.burnTimer = Math.max(0, unit.burnTimer - dt);
      unit.burnTick = (Number.isFinite(unit.burnTick) && unit.burnTick > 0 ? unit.burnTick : tickRate) - elapsed;
      while (unit.burnTick <= 0 && !unit.dead) {
        const ratio = Number.isFinite(unit.burnDamageHpRatio) ? unit.burnDamageHpRatio : 0.01;
        const damage = Math.max(0, unit.hp * ratio);
        if (damage > 0) {
          const burnSource = unit.burnSource && !unit.burnSource.dead ? unit.burnSource : null;
          const damageSource = burnSource && burnSource.team !== unit.team ? burnSource : (unit.team === "enemy" ? burnSource : null);
          dealDamage(damageSource, unit, damage, { magic: true, dotDamage: true, damageType: "ドット魔法", noUltGain: true });
        }
        unit.burnTick += tickRate;
      }
      if (unit.burnTimer <= 0 || unit.dead) {
        clearBurn(unit);
      }
    }

    function clearBurn(unit) {
      if (!unit) {
        return;
      }
      unit.burnTimer = 0;
      unit.burnMax = 0;
      unit.burnTick = 0;
      unit.burnTickRate = 1;
      unit.burnDamageHpRatio = 0;
      unit.burnSource = null;
    }

    function updatePoison(unit, dt) {
      if (!unit || unit.dead || !unit.poisonActive) {
        return;
      }
      const tickRate = Number.isFinite(unit.poisonTickRate) && unit.poisonTickRate > 0 ? unit.poisonTickRate : 1;
      unit.poisonTick = (Number.isFinite(unit.poisonTick) && unit.poisonTick > 0 ? unit.poisonTick : tickRate) - dt;
      while (unit.poisonTick <= 0 && !unit.dead && unit.poisonActive) {
        const ratio = Number.isFinite(unit.poisonDamageHpRatio) ? unit.poisonDamageHpRatio : 0.01;
        const damage = Math.max(0, (unit.maxHp || 0) * ratio);
        if (damage > 0) {
          const poisonSource = unit.poisonSource && !unit.poisonSource.dead ? unit.poisonSource : null;
          dealDamage(poisonSource, unit, damage, { magic: true, dotDamage: true, damageType: "ドット魔法", noUltGain: true });
        }
        unit.poisonTick += tickRate;
      }
    }

    function updateSorrow(unit, dt) {
      if (!unit || unit.dead || (unit.sorrowTimer || 0) <= 0 || unit.team !== "party") {
        return;
      }
      unit.sorrowTick = (Number.isFinite(unit.sorrowTick) && unit.sorrowTick > 0 ? unit.sorrowTick : 1) - dt;
      if (unit.sorrowTick > 0) {
        return;
      }
      unit.sorrowTick = 1;
      for (const member of party) {
        if (!member || member.dead || member === unit) {
          continue;
        }
        member.forcedTarget = unit;
        member.tauntTimer = Math.max(member.tauntTimer || 0, 1.5);
      }
    }

    function updateShieldStacks(unit, dt) {
      if (!Array.isArray(unit.shields)) {
        unit.shields = [];
      }
      if (unit.shields.length === 0 && unit.shield > 0 && unit.shieldTimer > 0) {
        unit.shields.push({ amount: unit.shield, timer: unit.shieldTimer });
      }
      for (const stack of unit.shields) {
        stack.timer -= dt;
      }
      unit.shields = unit.shields.filter((stack) => stack && stack.amount > 0 && stack.timer > 0);
      const total = unit.shields.reduce((sum, stack) => sum + stack.amount, 0);
      unit.shield = clamp(total, 0, unit.maxHp || total);
      unit.shieldTimer = unit.shields.reduce((max, stack) => Math.max(max, stack.timer), 0);
      if (unit.shield > 0 && unit.team === "party" && unit.mood !== null && SHIELD_MOOD_GAIN_PER_SEC > 0) {
        addMoodGain(unit, SHIELD_MOOD_GAIN_PER_SEC * dt);
      }
    }
    function updatePlayer(dt) {
      if (player.dead) {
        return;
      }

      if (player.cast) {
        if (isPlayerCastTargetLost(player.cast)) {
          interruptPlayerCastForTargetLoss();
          return;
        }
        player.cast.time -= dt;
        if (player.cast.time <= 0) {
          finishPlayerCast();
        }
      }
      skillSystem.updatePlayerChannel(dt);
    }

    function isPlayerCastTargetLost(cast) {
      return Boolean(cast && ["heal", "shield", "fire"].includes(cast.type) && cast.target && cast.target.dead);
    }

    function interruptPlayerCastForTargetLoss() {
      const cast = player.cast;
      player.cast = null;
      applyPlayerCastCooldown(cast);
      player.actionLock = Math.max(player.actionLock, ACTION_GAP);
      const origin = getSupportOrigin(cast && cast.target);
      addFloat("詠唱中断", origin.x + 28, origin.y - 32, "#ffffff");
    }

    function startPlayerCast(type, data, castTime) {
      if (player.dead || player.channel || player.cast || isActionDisabled(player) || player.actionLock > 0) {
        return false;
      }
      player.aim = null;
      player.cast = { type, time: castTime, total: castTime, ...data };
      player.actionLock = castTime;
      return true;
    }

    function finishPlayerCast() {
      const cast = player.cast;
      player.cast = null;
      if (!cast) {
        return;
      }
      if (player.dead || isActionDisabled(player)) {
        applyPlayerCastCooldown(cast);
        return;
      }

      skillSystem.completePlayerCast(cast);
      applyPlayerCastCooldown(cast);
      player.actionLock = Math.max(player.actionLock, ACTION_GAP);
    }

    function updateProjectiles(dt) {
      for (let i = projectiles.length - 1; i >= 0; i -= 1) {
        const shot = projectiles[i];
        shot.life -= dt;
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;

        if (
          shot.life <= 0 ||
          shot.x < -battlePx(60) ||
          shot.y < -battlePx(60) ||
          shot.x > view.w + battlePx(60) ||
          shot.y > view.h + battlePx(60)
        ) {
          projectiles.splice(i, 1);
          continue;
        }

        const candidates = shot.team === "party"
          ? (shot.affectsAllies ? [...enemies, ...getFieldPartyMembers()] : enemies)
          : getFieldPartyMembers();
        for (const unit of candidates) {
          if (unit.dead || unit === shot.owner) {
            continue;
          }
          if (shot.team === "party" && unit.team === "party" && !shot.healAllies && canFriendlyFireAffect && !canFriendlyFireAffect(shot.owner, unit)) {
            continue;
          }
          if (shot.hit.has(unit)) {
            continue;
          }
          if (distPoint(unit.x, unit.y, shot.x, shot.y) <= unit.radius + shot.radius) {
            shot.hit.add(unit);
            if (shot.healAllies && unit.team === shot.owner.team) {
              healUnit(shot.owner, unit, shot.heal ?? shot.damage, { noMood: unit === player });
            } else {
              const damage = typeof shot.getDamage === "function" ? shot.getDamage(unit) : shot.damage;
              const dealt = dealDamage(shot.owner, unit, damage, { magic: shot.magic, dotDamage: shot.dotDamage, damageType: shot.damageType });
              if (typeof shot.onHit === "function") {
                shot.onHit(unit, dealt);
              }
            }
            if (Number.isFinite(shot.pierceCount)) {
              if (shot.pierceCount <= 0) {
                projectiles.splice(i, 1);
                break;
              }
              shot.pierceCount -= 1;
            } else if (!shot.pierce) {
              projectiles.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    function updateTelegraphs(dt) {
      for (let i = telegraphs.length - 1; i >= 0; i -= 1) {
        const telegraph = telegraphs[i];
        if (!telegraph) {
          telegraphs.splice(i, 1);
          continue;
        }
        updateTelegraphDynamic(telegraph);
        telegraph.time = (Number.isFinite(telegraph.time) ? telegraph.time : 0) - dt;
        if (telegraph.time <= 0) {
          updateTelegraphDynamic(telegraph);
          try {
            if (typeof telegraph.resolve === "function") {
              telegraph.resolve();
            }
          } finally {
            telegraphs.splice(i, 1);
          }
        }
      }
    }

    function enforceIncapacitatedState(unit) {
      if (!unit || !unit.dead) {
        return false;
      }
      unit.hp = 0;
      clearIncapacitatedStatuses(unit);
      clearUnitActionReservation(unit);
      unit.actionLock = 0;
      unit.actionTotal = 0;
      if (unit.team === "party" && unit.id !== "finald" && unit.mood !== null) {
        unit.mood = 0;
        unit.moodActionGain = 0;
      }
      return true;
    }

    function clearIncapacitatedStatuses(unit) {
      unit.shield = 0;
      unit.shieldTimer = 0;
      unit.shields = [];
      unit.frozen = 0;
      unit.frozenMax = 0;
      unit.burnTimer = 0;
      unit.burnMax = 0;
      unit.burnTick = 0;
      unit.burnTickRate = 1;
      unit.burnDamageHpRatio = 0;
      unit.burnSource = null;
      unit.sleepTimer = 0;
      unit.sleepMax = 0;
      unit.poisonActive = false;
      unit.poisonTick = 0;
      unit.poisonTickRate = 1;
      unit.poisonDamageHpRatio = 0;
      unit.poisonSource = null;
      unit.woundStacks = 0;
      unit.injuryTimer = 0;
      unit.injuryMax = 0;
      unit.leakageTimer = 0;
      unit.leakageMax = 0;
      unit.tingleTimer = 0;
      unit.tingleMax = 0;
      unit.freezingTimer = 0;
      unit.freezingMax = 0;
      unit.plantStage = 0;
      unit.plantSource = null;
      unit.plantUpgradedBy = {};
      unit.contemptStacks = 0;
      unit.contemptTimer = 0;
      unit.contemptMax = 0;
      unit.feelTimer = 0;
      unit.feelMax = 0;
      unit.feelGuardCount = 0;
      unit.desteStacks = 0;
      unit.regretTimer = 0;
      unit.regretMax = 0;
      unit.sorrowTimer = 0;
      unit.sorrowMax = 0;
      unit.sorrowTick = 0;
      unit.reunionTimer = 0;
      unit.reunionMax = 0;
      unit.reunionSource = null;
      unit.absorptionLockTimer = 0;
      unit.magicNeutralizeTimer = 0;
      unit.magicNeutralizeMax = 0;
      unit.magicNeutralizeRatio = 0;
      unit.actionSpeedDownTimer = 0;
      unit.actionSpeedDownMax = 0;
      unit.actionSpeedDownRatio = 0;
      unit.shadowDashTimer = 0;
      unit.shadowDashMax = 0;
      unit.sharpenBladeTimer = 0;
      unit.sharpenBladeMax = 0;
      unit.counterattackStanceTimer = 0;
      unit.counterattackStanceMax = 0;
      unit.counterattackStanceStacks = 0;
      unit.counterattackRange = 0;
      unit.flinchingTimer = 0;
      unit.flinchingMax = 0;
      unit.rihasPassiveStacks = 0;
      unit.rihasPassiveTimer = 0;
      unit.rihasPassiveStackCooldown = 0;
      unit.castStacks = 0;
      unit.stackTimer = 0;
      unit.stackCooldown = 0;
      unit.forcedTarget = null;
      unit.tauntTimer = 0;
      unit.delayedDamageQueue = [];
      unit.goukenHitCounts = {};
      unit.chocolateLilyCharging = false;
      unit.chocolateLilyDamageTaken = 0;
    }

    function updateTelegraphDynamic(telegraph) {
      if (!telegraph) {
        return;
      }
      if (typeof telegraph.getPosition === "function") {
        const position = telegraph.getPosition();
        if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) {
          telegraph.x = position.x;
          telegraph.y = position.y;
        }
      }
      if (typeof telegraph.getLine === "function") {
        const line = telegraph.getLine();
        if (line) {
          telegraph.x = Number.isFinite(line.x) ? line.x : telegraph.x;
          telegraph.y = Number.isFinite(line.y) ? line.y : telegraph.y;
          telegraph.x2 = Number.isFinite(line.x2) ? line.x2 : telegraph.x2;
          telegraph.y2 = Number.isFinite(line.y2) ? line.y2 : telegraph.y2;
        }
      }
      if (typeof telegraph.getAngle === "function") {
        const angle = telegraph.getAngle();
        if (Number.isFinite(angle)) {
          telegraph.angle = angle;
        }
      }
    }

    function updateAreas(dt) {
      for (let i = areas.length - 1; i >= 0; i -= 1) {
        const area = areas[i];
        if (!area) {
          areas.splice(i, 1);
          continue;
        }
        const tickRate = Number.isFinite(area.tickRate) && area.tickRate > 0 ? area.tickRate : 1;
        area.time = (Number.isFinite(area.time) ? area.time : 0) - dt;
        area.tick = (Number.isFinite(area.tick) ? area.tick : tickRate) - dt;
        if (area.tick <= 0) {
          area.tick = tickRate;
          if (typeof area.apply === "function") {
            area.apply();
          }
        }
        if (area.time <= 0) {
          areas.splice(i, 1);
        }
      }
    }

    function updateEffects(dt) {
      if (effectSystem && typeof effectSystem.updateEffects === "function") {
        effectSystem.updateEffects(dt);
        return;
      }
      for (let i = effects.length - 1; i >= 0; i -= 1) {
        const effect = effects[i];
        effect.time -= dt;
        effect.age += dt;
        if (effect.vy) {
          effect.y += effect.vy * dt;
        }
        if (effect.time <= 0) {
          effects.splice(i, 1);
        }
      }
    }

    function checkBattleState(dt) {
      const fieldPartyMembers = getFieldPartyMembers();
      if (fieldPartyMembers.length > 0 && fieldPartyMembers.every((member) => member.dead)) {
        clearBattleActionReservations();
        game.state = "lost";
        game.message = "全滅した";
        game.messageTimer = 999;
        game.defeatUi = { mode: "main", message: "" };
        return;
      }
      if (enemies.every((enemy) => enemy.dead)) {
        if (!game.reinforcementsSpawned && spawnRearVanguardWave()) {
          return;
        }
        game.stageClearTimer += dt;
        grantBattleRewards();
        clearBattleActionReservations();
        game.state = "won";
        game.message = "依頼達成";
        game.messageTimer = 999;
      }
    }

    function clearBattleActionReservations() {
      for (const unit of [...party, ...enemies]) {
        clearUnitActionReservation(unit);
      }
    }

    function clearUnitActionReservation(unit) {
      if (!unit) {
        return;
      }
      unit.aiIntent = null;
      unit.aiMoveTarget = null;
      unit.battleFacingIntent = null;
      unit.aim = null;
      unit.itemAim = null;
      unit.itemUseRequest = null;
      unit.itemCast = null;
      unit.cast = null;
      unit.castVisual = null;
      unit.channel = null;
      unit.pendingActionQueueKey = null;
      unit.skillQueue = [];
      unit.firstSkillPending = Boolean(unit.firstSkillKey);
      unit.forcedEnemySkillKey = null;
      unit.forcedEnemySkillTarget = null;
      unit.absorptionLockTimer = 0;
      unit.chocolateLilyCharging = false;
      unit.chocolateLilyDamageTaken = 0;
    }

    function ensureBattleRewards() {
      if (!game.battleRewards || typeof game.battleRewards !== "object") {
        game.battleRewards = { pending: [], granted: [], claimed: false };
      }
      if (!Array.isArray(game.battleRewards.pending)) {
        game.battleRewards.pending = [];
      }
      if (!Array.isArray(game.battleRewards.granted)) {
        game.battleRewards.granted = [];
      }
      if (game.battleRewards.autoPowerCrystal && typeof game.battleRewards.autoPowerCrystal !== "object") {
        game.battleRewards.autoPowerCrystal = null;
      }
      game.battleRewards.claimed = Boolean(game.battleRewards.claimed);
      return game.battleRewards;
    }

    function collectDefeatedEnemyDrops() {
      for (const enemy of enemies) {
        if (!enemy || enemy.team !== "enemy" || !enemy.dead || enemy.lootCollected) {
          continue;
        }
        enemy.lootCollected = true;
        collectEnemyDrops(enemy);
      }
    }

    function collectEnemyDrops(enemy) {
      const drops = Array.isArray(enemy.drops) ? enemy.drops : [];
      for (const drop of drops) {
        if (!drop || !rollDrop(drop)) {
          continue;
        }
        addBattleReward(normalizeDropReward(drop));
      }
    }

    function rollDrop(drop) {
      const chance = normalizeDropChance(drop.chance);
      return chance >= 1 || Math.random() < chance;
    }

    function normalizeDropChance(value) {
      if (!Number.isFinite(value)) {
        return 1;
      }
      const chance = value > 1 ? value / 100 : value;
      return clamp(chance, 0, 1);
    }

    function normalizeDropReward(drop) {
      const amount = Math.max(0, Math.floor(Number.isFinite(drop.amount) ? drop.amount : drop.count || 1));
      if (amount <= 0) {
        return null;
      }
      if (drop.type === "currency" || drop.key === "gold" || drop.currency === "gold") {
        return {
          type: "currency",
          key: drop.key || drop.currency || "gold",
          name: drop.name || "お金",
          amount,
        };
      }
      if (drop.type === "material") {
        return {
          type: "material",
          key: drop.key || drop.id || drop.name || "material",
          name: drop.name || drop.id || drop.key || "素材",
          count: amount,
        };
      }
      return {
        type: "item",
        key: drop.key || drop.id || drop.name || "item",
        name: drop.name || drop.id || drop.key || "アイテム",
        count: amount,
      };
    }

    function collectQuestRewards(quest = game.currentQuest) {
      if (!quest) {
        return;
      }
      const rewardEntries = Array.isArray(quest.rewards)
        ? quest.rewards
        : Array.isArray(quest.rewardEntries)
          ? quest.rewardEntries
          : [];
      for (const reward of rewardEntries) {
        addBattleReward(normalizeDropReward(reward));
      }
      const gold = Math.max(0, Math.floor(Number(
        quest.rewardGold ?? quest.goldReward ?? quest.gold ?? 0
      )));
      if (gold > 0) {
        addBattleReward({
          type: "currency",
          key: "gold",
          name: "お金",
          amount: gold,
        });
      }
    }

    function addBattleReward(reward) {
      if (!reward) {
        return;
      }
      const rewards = ensureBattleRewards();
      const key = getBattleRewardMergeKey(reward);
      const existing = rewards.pending.find((entry) => getBattleRewardMergeKey(entry) === key);
      if (existing) {
        if (reward.type === "currency") {
          existing.amount = (existing.amount || 0) + (reward.amount || 0);
        } else {
          existing.count = (existing.count || 0) + (reward.count || 0);
        }
        return;
      }
      rewards.pending.push({ ...reward });
    }

    function getBattleRewardMergeKey(reward) {
      return `${reward && reward.type || "item"}:${reward && reward.key || reward && reward.name || ""}`;
    }

    function setupBattleRewardPowerCrystalAutoUse(rewards) {
      const total = getBattleRewardItemCount(rewards && rewards.granted, "d_power_flag");
      const enabled = isPowerCrystalAutoUseEnabled();
      rewards.autoPowerCrystal = {
        itemId: "d_power_flag",
        enabled,
        total,
        remaining: enabled ? total : 0,
        opened: 0,
        complete: !enabled || total <= 0,
      };
    }

    function getBattleRewardItemCount(entries, itemId) {
      if (!Array.isArray(entries)) {
        return 0;
      }
      return entries.reduce((sum, entry) => {
        if (!entry || entry.type !== "item" || entry.key !== itemId) {
          return sum;
        }
        return sum + Math.max(0, Math.floor(entry.count || entry.amount || 0));
      }, 0);
    }

    function isPowerCrystalAutoUseEnabled() {
      if (!game.settings || typeof game.settings !== "object") {
        game.settings = {};
      }
      if (typeof game.settings.powerCrystalAutoUse !== "boolean") {
        game.settings.powerCrystalAutoUse = true;
      }
      return game.settings.powerCrystalAutoUse !== false;
    }

    function grantBattleRewards() {
      const rewards = ensureBattleRewards();
      if (rewards.claimed) {
        return;
      }
      collectQuestRewards();
      rewards.granted = rewards.pending.map((entry) => ({ ...entry }));
      rewards.claimed = true;
      setupBattleRewardPowerCrystalAutoUse(rewards);
      const gold = rewards.granted
        .filter((entry) => entry && entry.type === "currency" && entry.key === "gold")
        .reduce((sum, entry) => sum + Math.max(0, entry.amount || 0), 0);
      if (gold > 0 && typeof addGold === "function") {
        addGold(gold);
      }
      for (const entry of rewards.granted) {
        if (entry && entry.type === "material") {
          addMaterialReward(entry.key, entry.count);
        } else if (entry && entry.type === "item" && typeof addItem === "function") {
          addItem(entry.key, entry.count);
        }
      }
    }

    function addMaterialReward(key, count) {
      const materialKey = String(key || "");
      const amount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
      if (!materialKey || amount <= 0) {
        return;
      }
      if (!game.materialsById || typeof game.materialsById !== "object") {
        game.materialsById = {};
      }
      const before = Number.isFinite(game.materialsById[materialKey]) ? game.materialsById[materialKey] : 0;
      game.materialsById[materialKey] = before + amount;
    }

    function getHoveredPartyMember() {
      let best = null;
      let bestDist = Infinity;
      for (const member of getFieldPartyMembers()) {
        if (member.dead) {
          continue;
        }
        const d = distPoint(input.mouse.x, input.mouse.y, member.x, member.y);
        if (d <= member.radius + battlePx(8) && d < bestDist) {
          best = member;
          bestDist = d;
        }
      }
      return best;
    }

    function getHoveredEnemy(x = input.mouse.x, y = input.mouse.y) {
      let best = null;
      let bestDist = Infinity;
      for (const enemy of enemies) {
        if (enemy.dead) {
          continue;
        }
        const d = distPoint(x, y, enemy.x, enemy.y);
        if (d <= enemy.radius + battlePx(10) && d < bestDist) {
          best = enemy;
          bestDist = d;
        }
      }
      return best;
    }

    function getPriorityTarget(unit = null) {
      clearInvalidPriorityTarget();
      if (!game.priorityTarget) {
        return null;
      }
      if (isAvoidTarget(game.priorityTarget)) {
        return null;
      }
      if (unit && game.priorityTargetIgnoredUnitIds && game.priorityTargetIgnoredUnitIds[unit.id]) {
        return null;
      }
      return game.priorityTarget;
    }

    function setPriorityTarget(target, duration = 0, label = "ターゲット指定", options = {}) {
      if (!target || target.dead || !enemies.includes(target)) {
        return false;
      }
      if (game.avoidTarget) {
        game.avoidTarget = null;
        game.avoidTargetTimer = 0;
      }
      if (game.priorityTarget && game.priorityTarget !== target) {
        clearFocusDamageTakenBonus(game.priorityTarget);
      }
      game.priorityTarget = target;
      game.priorityTargetTimer = Number.isFinite(duration) && duration > 0 ? duration : 0;
      game.priorityTargetIgnoredUnitIds = {};
      if (Array.isArray(options.ignoredUnitIds)) {
        for (const unitId of options.ignoredUnitIds) {
          if (unitId) {
            game.priorityTargetIgnoredUnitIds[unitId] = true;
          }
        }
      }
      clearFocusDamageTakenBonus(target);
      clearPartyAttackIntents();
      if (label) {
        addFloat(label, target.x, target.y - 36, "#ffd56b");
      }
      return true;
    }

    function getAvoidTarget() {
      clearInvalidAvoidTarget();
      return game.avoidTarget || null;
    }

    function isAvoidTarget(target) {
      return Boolean(target && getAvoidTarget() === target);
    }

    function setAvoidTarget(target, duration = 0, label = "ディスタンス") {
      if (!target || target.dead || !enemies.includes(target)) {
        return false;
      }
      if (game.priorityTarget) {
        clearFocusDamageTakenBonus(game.priorityTarget);
        game.priorityTarget = null;
        game.priorityTargetTimer = 0;
        game.priorityTargetIgnoredUnitIds = {};
      }
      game.avoidTarget = target;
      game.avoidTargetTimer = Number.isFinite(duration) && duration > 0 ? duration : 0;
      clearPartyAttackIntents();
      if (label) {
        addFloat(label, target.x, target.y - 36, "#9cc6ff");
      }
      return true;
    }

    function togglePriorityTargetAt(x, y) {
      const enemy = getHoveredEnemy(x, y);
      if (!enemy) {
        return false;
      }
      if (getPriorityTarget() === enemy) {
        clearFocusDamageTakenBonus(enemy);
        game.priorityTarget = null;
        game.priorityTargetTimer = 0;
        game.priorityTargetIgnoredUnitIds = {};
        clearPartyAttackIntents();
        addFloat("ターゲット解除", enemy.x, enemy.y - 36, "#f7fff6");
      } else {
        setPriorityTarget(enemy, 0, "ターゲット指定");
      }
      return true;
    }

    function clearFocusDamageTakenBonus(target) {
      if (target) {
        target.focusDamageTakenBonus = 0;
      }
    }

    function clearPartyAttackIntents() {
      for (const member of party) {
        if (member.id !== "finald") {
          member.aiIntent = null;
          member.aiMoveTarget = null;
        }
      }
    }

    function clearInvalidPriorityTarget() {
      if (game.priorityTarget && (game.priorityTarget.dead || !enemies.includes(game.priorityTarget))) {
        clearFocusDamageTakenBonus(game.priorityTarget);
        game.priorityTarget = null;
        game.priorityTargetTimer = 0;
        game.priorityTargetIgnoredUnitIds = {};
        clearPartyAttackIntents();
      }
    }

    function clearInvalidAvoidTarget() {
      if (game.avoidTarget && (game.avoidTarget.dead || !enemies.includes(game.avoidTarget))) {
        game.avoidTarget = null;
        game.avoidTargetTimer = 0;
        clearPartyAttackIntents();
      }
    }

    function isFieldUnit(unit) {
      return Boolean(unit && unit.field !== false);
    }

    function isTargetableUnit(unit) {
      return isFieldUnit(unit) && unit.targetable !== false && !unit.dead;
    }

    function getFieldPartyMembers() {
      return party.filter(isFieldUnit);
    }

    function getTargetablePartyMembers() {
      return party.filter(isTargetableUnit);
    }

    function getSupportOrigin(target = null) {
      if (isFieldUnit(player)) {
        return { x: player.x, y: player.y };
      }
      const bounds = getBattleBounds();
      const fallbackY = bounds.bottom - battlePx(42);
      const y = target && Number.isFinite(target.y)
        ? clamp(target.y, bounds.top + battlePx(28), bounds.bottom - battlePx(28))
        : fallbackY;
      return { x: bounds.left - battlePx(36), y };
    }

    function addTelegraph(data) {
      if (!data || typeof data !== "object") {
        return;
      }
      data.time = Number.isFinite(data.time) ? data.time : 0;
      data.total = Number.isFinite(data.total) && data.total > 0
        ? data.total
        : (data.time > 0 ? data.time : 1);
      telegraphs.push(data);
    }

    function addBurst(x, y, radius, color) {
      effects.push({ type: "burst", x, y, radius, color, time: 0.35, age: 0 });
    }

    function addSpeech(text, unit) {
      if (!text || !unit) {
        return;
      }
      effects.push({ type: "speech", text, source: unit, time: 1.25, total: 1.25, age: 0 });
    }

    function addFloat(text, x, y, color, outline = "#0b0d0b") {
      const lifetime = 1.3;
      const stackStep = battlePx(18);
      const stackRangeX = battlePx(44);
      const stackRangeY = battlePx(36);
      for (const effect of effects) {
        if (effect.type !== "float") {
          continue;
        }
        const originX = Number.isFinite(effect.originX) ? effect.originX : effect.x;
        const originY = Number.isFinite(effect.originY) ? effect.originY : effect.y;
        if (Math.abs(originX - x) <= stackRangeX && Math.abs(originY - y) <= stackRangeY) {
          effect.y -= stackStep;
        }
      }
      effects.push({ type: "float", text, x, y, originX: x, originY: y, color, outline, time: lifetime, total: lifetime, age: 0, vy: -28 });
    }

    function slashEffect(from, to) {
      effects.push({
        type: "beam",
        x: from.x,
        y: from.y,
        x2: to.x,
        y2: to.y,
        color: "rgba(244,197,79,0.75)",
        time: 0.16,
        age: 0,
      });
    }

    function cancelPlayerChannel() {
      player.channel = null;
      const origin = getSupportOrigin();
      addFloat("中断", origin.x + 28, origin.y - 32, "#ffffff");
    }

    function cancelPlayerCast() {
      const itemSystem = getItemSystem ? getItemSystem() : null;
      if (itemSystem && itemSystem.cancelItemUse && itemSystem.cancelItemUse(player)) {
        const origin = getSupportOrigin();
        addFloat("詠唱中断", origin.x + 28, origin.y - 32, "#ffffff");
        return;
      }
      const cast = player.cast;
      player.cast = null;
      applyPlayerCastCooldown(cast);
      player.actionLock = Math.max(player.actionLock, ACTION_GAP);
      const origin = getSupportOrigin();
      addFloat("詠唱中断", origin.x + 28, origin.y - 32, "#ffffff");
    }

    function applyPlayerCastCooldown(cast) {
      if (cast && cast.type === "ult") {
        player.ult = Math.max(0, player.ult - (skillSystem.getUltimateCost ? skillSystem.getUltimateCost(player) : 100));
        return;
      }
      const cooldown = getPlayerCastCooldown(cast && cast.type);
      if (!cooldown) {
        return;
      }
      player.cds[cooldown.key] = cooldown.max;
    }

    function getPlayerCastCooldown(type) {
      return skillSystem.getPlayerCastCooldown(type);
    }

    return {
      update,
      updateCooldownsAndTimers,
      updatePlayer,
      startPlayerCast,
      finishPlayerCast,
      updateProjectiles,
      updateTelegraphs,
      updateTelegraphDynamic,
      updateAreas,
      updateEffects,
      checkBattleState,
      getHoveredPartyMember,
      getHoveredEnemy,
      getPriorityTarget,
      setPriorityTarget,
      getAvoidTarget,
      isAvoidTarget,
      setAvoidTarget,
      togglePriorityTargetAt,
      clearPartyAttackIntents,
      clearInvalidPriorityTarget,
      clearInvalidAvoidTarget,
      isFieldUnit,
      isTargetableUnit,
      getFieldPartyMembers,
      getTargetablePartyMembers,
      getSupportOrigin,
      addTelegraph,
      addBurst,
      addSpeech,
      addFloat,
      slashEffect,
      cancelPlayerChannel,
      cancelPlayerCast,
      applyPlayerCastCooldown,
      getPlayerCastCooldown,
    };
  };
})();
