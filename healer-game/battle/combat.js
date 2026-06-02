(() => {
  "use strict";

  window.createHealerCombatSystem = function createHealerCombatSystem(context) {
    const {
      player,
      COLORS,
      ACTION_GAP,
      BASE_CRIT_CHANCE,
      BASE_CRIT_DAMAGE,
      SUSHIA_PASSIVE_MAX_STACKS,
      SUSHIA_PASSIVE_STACK_DURATION,
      SUSHIA_PASSIVE_STACK_COOLDOWN,
      MOOD_DAMAGE_DEALT_RATE,
      MOOD_DAMAGE_DEALT_MULT,
      MOOD_DAMAGE_TAKEN_RATE,
      MOOD_HEAL_RATE,
      MOOD_QUICK_HEAL_BONUS,
      MOOD_EVENT_MULT,
      MOOD_KILL_BONUS,
      clamp,
      addFloat,
      addBurst,
      cancelPlayerChannel,
      cancelPlayerCast,
      getMoodOutgoingDamageMultiplier,
      getMoodIncomingDamageMultiplier,
      getCommandOutgoingDamageMultiplier,
      getCommandIncomingDamageMultiplier,
      getRihasPassiveDamageMultiplier,
      getRihasPassiveIncomingMultiplier,
      getGuardDamageMultiplier,
      getEffectiveGuardChance,
      getEffectiveDefense,
      addRihasPassiveStack,
      getMoodDistanceMultiplier,
      getHpRatio,
      getMoodReferenceHp,
      addMoodGain,
      addMoodLoss,
    } = context;

    function addShield(unit, amount, duration) {
      if (!unit || amount <= 0 || duration <= 0) {
        return;
      }
      unit.shield = clamp(unit.shield + amount, 0, unit.maxHp);
      unit.shieldTimer = Math.max(unit.shieldTimer, duration);
    }

    function dealDamage(source, target, amount, options = {}) {
      if (!target || target.dead) {
        return 0;
      }

      const wasTargetAlive = target.hp > 0;
      let finalAmount = amount;
      let criticalHit = false;

      if (options.crit && source && source.team === "party" && source.id !== "finald" && Math.random() < BASE_CRIT_CHANCE) {
        finalAmount *= BASE_CRIT_DAMAGE;
        criticalHit = true;
      }

      finalAmount = reduceByDefense(target, finalAmount, options.magic);

      if (source && source.team === "party" && source.id !== "finald" && source.mood !== null) {
        finalAmount *= getMoodOutgoingDamageMultiplier(source);
        finalAmount *= getCommandOutgoingDamageMultiplier(source);
      }
      if (source && source.id === "rihas") {
        finalAmount *= getRihasPassiveDamageMultiplier(source);
      }
      if (target.team === "party" && target.id !== "finald" && target.mood !== null) {
        finalAmount *= getMoodIncomingDamageMultiplier(target);
        finalAmount *= getCommandIncomingDamageMultiplier(target);
      }
      if (source && source.team === "enemy" && target.id === "rihas" && source.forcedTarget === target && source.tauntTimer > 0) {
        finalAmount *= 0.6;
      }
      if (target.id === "rihas") {
        finalAmount *= getRihasPassiveIncomingMultiplier(target);
      }

      let guarded = false;
      if (target.team === "party" && target.id !== "finald") {
        guarded = tryGuard(target);
        if (guarded) {
          finalAmount *= getGuardDamageMultiplier(target);
        }
      }

      const damageFloatColor = getDamageFloatColor(source, target);
      let shielded = 0;
      if (target.shield > 0) {
        shielded = Math.min(target.shield, finalAmount);
        target.shield -= shielded;
        finalAmount -= shielded;
        if (target.shield <= 0) {
          target.shield = 0;
          target.shieldTimer = 0;
        }
        if (shielded > 0) {
          addFloat(
            formatDamageFloat(shielded, { critical: criticalHit, guarded }),
            target.x,
            target.y - 26,
            damageFloatColor
          );
        }
      }

      finalAmount = Math.max(0, finalAmount);
      let delayedAmount = 0;
      if (target.id === "rihas" && finalAmount > 0 && !options.delayed) {
        addRihasPassiveStack(target);
        delayedAmount = finalAmount / 3;
        finalAmount -= delayedAmount;
        target.delayedDamageQueue.push({
          timer: 1,
          ticks: 5,
          amount: delayedAmount / 5,
          color: damageFloatColor,
        });
      }

      if (finalAmount > 0) {
        target.hp = Math.max(0, target.hp - finalAmount);
        target.hurt = 0.22;
        target.noDamage = 0;
        addFloat(
          formatDamageFloat(finalAmount, { critical: criticalHit, guarded }),
          target.x,
          target.y - 24,
          damageFloatColor
        );
        if (target === player && player.channel) {
          cancelPlayerChannel();
        }
        if (target === player && player.cast) {
          cancelPlayerCast();
        }
      } else if (delayedAmount > 0) {
        target.noDamage = 0;
      }

      const rewardDamage = finalAmount + delayedAmount;
      if (source && source.team === "party") {
        source.ult = clamp(source.ult + rewardDamage * 0.22, 0, 100);
        if (source.id === "sushia" && target.team === "enemy" && rewardDamage > 0 && options.magic && source.stackCooldown <= 0) {
          source.castStacks = clamp(source.castStacks + 1, 0, SUSHIA_PASSIVE_MAX_STACKS);
          source.stackTimer = SUSHIA_PASSIVE_STACK_DURATION;
          source.stackCooldown = SUSHIA_PASSIVE_STACK_COOLDOWN;
        }
        if (source.mood !== null && target.team === "enemy") {
          const distanceMult = getMoodDistanceMultiplier(source, target);
          const damageRatio = getHpRatio(rewardDamage, target);
          const referenceDamage = damageRatio * getMoodReferenceHp(target);
          addMoodGain(source, referenceDamage * MOOD_DAMAGE_DEALT_RATE * MOOD_DAMAGE_DEALT_MULT * MOOD_EVENT_MULT * distanceMult);
        }
      }

      if (target.team === "party" && target.id !== "finald") {
        target.ult = clamp(target.ult + rewardDamage * 0.16, 0, 100);
        const damageRatio = getHpRatio(rewardDamage, target);
        const referenceDamage = damageRatio * getMoodReferenceHp(target);
        addMoodLoss(target, referenceDamage * MOOD_DAMAGE_TAKEN_RATE * MOOD_EVENT_MULT);
      }

      if (target.hp <= 0) {
        if (wasTargetAlive && target.team === "enemy" && source && source.team === "party" && source.mood !== null) {
          addMoodGain(source, MOOD_KILL_BONUS);
        }
        target.dead = true;
        target.hp = 0;
        addBurst(target.x, target.y, target.radius * 2.2, "rgba(255,255,255,0.2)");
      }
      return rewardDamage + shielded;
    }

    function formatDamageFloat(amount, options = {}) {
      const prefix = `${options.guarded ? "B!" : ""}${options.critical ? "C!" : ""}`;
      return `${prefix}${Math.round(amount)}`;
    }

    function healUnit(source, target, amount, options = {}) {
      if (!target || target.dead) {
        return 0;
      }
      const before = target.hp;
      target.hp = clamp(target.hp + amount, 0, target.maxHp);
      const healed = target.hp - before;
      const healFloatColor = getHealFloatColor(target);
      if (healed <= 0) {
        addFloat("+0", target.x, target.y - 28, healFloatColor);
        return 0;
      }

      addFloat(`+${Math.round(healed)}`, target.x, target.y - 28, healFloatColor);
      target.hurt = 0;
      if (source && source.team === "party") {
        source.ult = clamp(source.ult + healed * 0.22, 0, 100);
      }
      if (!options.noMood && target.team === "party" && target.id !== "finald") {
        const quickBonus = target.noDamage < 3 ? MOOD_QUICK_HEAL_BONUS : 0;
        const healRatio = getHpRatio(healed, target);
        const referenceHeal = healRatio * getMoodReferenceHp(target);
        addMoodGain(target, referenceHeal * MOOD_HEAL_RATE * MOOD_EVENT_MULT + quickBonus);
      }
      return healed;
    }

    function reduceByDefense(target, amount, isMagic) {
      const defense = isMagic ? target.magicDefense : getEffectiveDefense(target);
      return amount * (100 / (100 + Math.max(0, defense)));
    }

    function getDamageFloatColor(source, target) {
      if (target.team === "party") {
        return "#ff4f4f";
      }
      if (source && source.team === "party" && target.team === "enemy") {
        return "#ffffff";
      }
      return "#ffffff";
    }

    function getHealFloatColor(target) {
      return target && target.team === "enemy" ? COLORS.enemyHeal : COLORS.heal;
    }

    function updateDelayedDamage(unit, dt) {
      if (!unit.delayedDamageQueue || unit.delayedDamageQueue.length === 0 || unit.dead) {
        return;
      }

      for (let i = unit.delayedDamageQueue.length - 1; i >= 0; i -= 1) {
        const entry = unit.delayedDamageQueue[i];
        entry.timer -= dt;
        while (entry.timer <= 0 && entry.ticks > 0 && !unit.dead) {
          applyDelayedDamage(unit, entry.amount, entry.color);
          entry.ticks -= 1;
          entry.timer += 1;
        }
        if (entry.ticks <= 0 || unit.dead) {
          unit.delayedDamageQueue.splice(i, 1);
        }
      }
    }

    function applyDelayedDamage(unit, amount, color = "#ff4f4f") {
      const damage = Math.max(0, amount);
      if (damage <= 0 || unit.dead) {
        return;
      }
      const before = unit.hp;
      unit.hp = Math.max(0, unit.hp - damage);
      const actualDamage = before - unit.hp;
      if (unit.id === "rihas" && actualDamage > 0) {
        addRihasPassiveStack(unit);
      }
      unit.hurt = 0.18;
      addFloat(`${Math.round(damage)}`, unit.x, unit.y - 24, color);
      if (unit.hp <= 0) {
        unit.dead = true;
        unit.hp = 0;
        addBurst(unit.x, unit.y, unit.radius * 2.2, "rgba(255,255,255,0.2)");
      }
    }

    function tryGuard(unit) {
      if (unit.frozen > 0 || unit.actionLock > 0) {
        return false;
      }
      const chance = getEffectiveGuardChance(unit);
      if (chance <= 0) {
        return false;
      }
      if (Math.random() < chance) {
        unit.guardFlash = 0.28;
        unit.actionLock = ACTION_GAP;
        return true;
      }
      return false;
    }

    return {
      addShield,
      dealDamage,
      formatDamageFloat,
      healUnit,
      reduceByDefense,
      getDamageFloatColor,
      getHealFloatColor,
      updateDelayedDamage,
      applyDelayedDamage,
      tryGuard,
    };
  };
})();
