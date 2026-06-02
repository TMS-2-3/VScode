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
      skillSystem,
      ACTION_GAP,
      SELF_HEAL_DELAY,
      SELF_HEAL_LIMIT,
      SELF_HEAL_MP_PER_SEC,
      SELF_HEAL_HP_PER_SEC,
      INTERRUPTED_CAST_COOLDOWN_REDUCTION,
      battlePx,
      clamp,
      distPoint,
      getBattleBounds,
      updateTown,
      updatePartyAi,
      updateEnemyAi,
      separateUnits,
      spawnRearVanguardWave,
      regenerateMp,
      getMoodNaturalDelta,
      applyCommandMoodDelta,
      applyMoodHighGainDamping,
      updateDelayedDamage,
      updateRihasPassiveStacks,
      dealDamage,
      healUnit,
    } = context;

    function update(dt) {
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
      updatePlayer(dt);
      updatePartyAi(dt);
      updateEnemyAi(dt);
      updateProjectiles(dt);
      updateTelegraphs(dt);
      updateAreas(dt);
      separateUnits(dt);
      checkBattleState(dt);
    }

    function updateCooldownsAndTimers(dt) {
      for (const unit of [...party, ...enemies]) {
        if (unit.dead) {
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
        unit.hurt = Math.max(0, unit.hurt - dt);
        unit.guardFlash = Math.max(0, unit.guardFlash - dt);
        unit.frozen = Math.max(0, unit.frozen - dt);
        if (unit.frozen <= 0) {
          unit.frozenMax = 0;
        }
        unit.stackCooldown = Math.max(0, unit.stackCooldown - dt);
        updateDelayedDamage(unit, dt);
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

        if (unit.shieldTimer > 0) {
          unit.shieldTimer -= dt;
          if (unit.shieldTimer <= 0) {
            unit.shield = 0;
          }
        }

        for (const key of Object.keys(unit.cds)) {
          unit.cds[key] = Math.max(0, unit.cds[key] - dt);
        }

        regenerateMp(unit, dt);

        if (unit.team === "party") {
          unit.ult = clamp(unit.ult + dt * 1.2, 0, 100);
        }

        if (unit.team === "party" && unit.id !== "finald") {
          const naturalDelta = applyCommandMoodDelta(unit, getMoodNaturalDelta(unit) * dt);
          const adjustedDelta = naturalDelta > 0 ? applyMoodHighGainDamping(unit, naturalDelta) : naturalDelta;
          unit.mood = clamp(unit.mood + adjustedDelta, 0, 100);
        }
      }
    }

    function updatePlayer(dt) {
      if (player.dead) {
        return;
      }

      const supportOrigin = getSupportOrigin();
      player.x = supportOrigin.x;
      player.y = supportOrigin.y;

      if (player.cast) {
        player.cast.time -= dt;
        if (player.cast.time <= 0) {
          finishPlayerCast();
        }
      }

      updateSelfHeal(dt);
      skillSystem.updatePlayerChannel(dt);
    }

    function updateSelfHeal(dt) {
      const limit = player.maxHp * SELF_HEAL_LIMIT;
      player.selfHealing = false;
      if (player.noDamage < SELF_HEAL_DELAY || player.hp >= limit || player.mp <= 0 || player.dead) {
        return;
      }

      const mpSpend = Math.min(player.mp, SELF_HEAL_MP_PER_SEC * dt);
      const healAmount = Math.min(SELF_HEAL_HP_PER_SEC * dt, limit - player.hp);
      if (mpSpend <= 0 || healAmount <= 0) {
        return;
      }

      player.mp -= mpSpend;
      player.hp = clamp(player.hp + healAmount, 0, limit);
      player.selfHealing = true;
      player.selfHealFloat += dt;
      if (player.selfHealFloat >= 0.8) {
        player.selfHealFloat = 0;
        addFloat("自己治療", player.x, player.y - 34, "#bdfcff");
      }
    }

    function startPlayerCast(type, data, castTime) {
      if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) {
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
      if (player.dead || player.frozen > 0) {
        applyInterruptedPlayerCastCooldown(cast);
        return;
      }

      skillSystem.completePlayerCast(cast);
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
          if (shot.hit.has(unit)) {
            continue;
          }
          if (distPoint(unit.x, unit.y, shot.x, shot.y) <= unit.radius + shot.radius) {
            shot.hit.add(unit);
            if (shot.healAllies && unit.team === shot.owner.team) {
              healUnit(shot.owner, unit, shot.heal ?? shot.damage, { noMood: unit === player });
            } else {
              dealDamage(shot.owner, unit, shot.damage, { magic: shot.magic });
            }
            if (!shot.pierce) {
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
        updateTelegraphDynamic(telegraph);
        telegraph.time -= dt;
        if (telegraph.time <= 0) {
          updateTelegraphDynamic(telegraph);
          telegraph.resolve();
          telegraphs.splice(i, 1);
        }
      }
    }

    function updateTelegraphDynamic(telegraph) {
      if (telegraph.getPosition) {
        const position = telegraph.getPosition();
        telegraph.x = position.x;
        telegraph.y = position.y;
      }
      if (telegraph.getLine) {
        const line = telegraph.getLine();
        telegraph.x = line.x;
        telegraph.y = line.y;
        telegraph.x2 = line.x2;
        telegraph.y2 = line.y2;
      }
      if (telegraph.getAngle) {
        telegraph.angle = telegraph.getAngle();
      }
    }

    function updateAreas(dt) {
      for (let i = areas.length - 1; i >= 0; i -= 1) {
        const area = areas[i];
        area.time -= dt;
        area.tick -= dt;
        if (area.tick <= 0) {
          area.tick = area.tickRate;
          area.apply();
        }
        if (area.time <= 0) {
          areas.splice(i, 1);
        }
      }
    }

    function updateEffects(dt) {
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
      if (getFieldPartyMembers().some((member) => member.dead)) {
        game.state = "lost";
        game.message = "戦闘不能者が出た";
        game.messageTimer = 999;
        return;
      }
      if (enemies.every((enemy) => enemy.dead)) {
        if (!game.reinforcementsSpawned) {
          spawnRearVanguardWave();
          return;
        }
        game.stageClearTimer += dt;
        game.state = "won";
        game.message = "依頼達成";
        game.messageTimer = 999;
      }
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
      const bounds = getBattleBounds();
      const fallbackY = bounds.bottom - battlePx(42);
      const y = target && Number.isFinite(target.y)
        ? clamp(target.y, bounds.top + battlePx(28), bounds.bottom - battlePx(28))
        : fallbackY;
      return { x: bounds.left - battlePx(36), y };
    }

    function addTelegraph(data) {
      data.total = data.total || data.time || 1;
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
      effects.push({ type: "float", text, x, y, color, outline, time: 0.85, age: 0, vy: -28 });
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
      const cast = player.cast;
      player.cast = null;
      applyInterruptedPlayerCastCooldown(cast);
      player.actionLock = Math.max(player.actionLock, ACTION_GAP);
      const origin = getSupportOrigin();
      addFloat("詠唱中断", origin.x + 28, origin.y - 32, "#ffffff");
    }

    function applyInterruptedPlayerCastCooldown(cast) {
      const cooldown = getPlayerCastCooldown(cast && cast.type);
      if (!cooldown) {
        return;
      }
      player.cds[cooldown.key] = cooldown.max * (1 - INTERRUPTED_CAST_COOLDOWN_REDUCTION);
    }

    function getPlayerCastCooldown(type) {
      return skillSystem.getPlayerCastCooldown(type);
    }

    return {
      update,
      updateCooldownsAndTimers,
      updatePlayer,
      updateSelfHeal,
      startPlayerCast,
      finishPlayerCast,
      updateProjectiles,
      updateTelegraphs,
      updateTelegraphDynamic,
      updateAreas,
      updateEffects,
      checkBattleState,
      getHoveredPartyMember,
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
      applyInterruptedPlayerCastCooldown,
      getPlayerCastCooldown,
    };
  };
})();
