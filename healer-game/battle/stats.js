(() => {
  "use strict";

  window.createHealerBattleStats = function createHealerBattleStats(context) {
    const {
      COMMAND_BIAS_CONFIGS,
      COMMAND_BIAS_AUTO_GRACE_ACTIONS,
      MOOD_NATURAL_HP_STEPS,
      MOOD_NATURAL_HP_BOTTOM_DELTA,
      MOOD_NO_DAMAGE_GAIN_BONUS_START,
      MOOD_NO_DAMAGE_GAIN_BONUS_MAX_TIME,
      MOOD_NO_DAMAGE_GAIN_BONUS_MAX,
      MOOD_HIGH_GAIN_DAMPING_START,
      MOOD_HIGH_GAIN_DAMPING_MULT,
      MOOD_DISTANCE_BONUS_START,
      MOOD_DISTANCE_BONUS_END,
      MOOD_DISTANCE_BONUS_MAX,
      MOOD_MULTI_HIT_MIN,
      MOOD_MULTI_HIT_BASE,
      DEFAULT_MP_REGEN_RATE,
      GUARD_DAMAGE_MULTIPLIER,
      GUARD_OVERFLOW_REDUCTION_RATE,
      GUARD_MAX_DAMAGE_REDUCTION,
      RIHAS_PASSIVE_MAX_STACKS,
      RIHAS_PASSIVE_STACK_DURATION,
      RIHAS_PASSIVE_STACK_COOLDOWN,
      RIHAS_PASSIVE_MAX_DAMAGE_BONUS,
      RIHAS_PASSIVE_MAX_DAMAGE_REDUCTION,
      clamp,
      dist,
    } = context;

    function getCommandActionCooldown(unit, baseTime) {
      return baseTime * getCommandBiasConfig(unit, "active").actionCd;
    }

    function getCommandOutgoingDamageMultiplier(unit) {
      if (!isCommandBiasAffectedUnit(unit)) {
        return 1;
      }
      return getCommandBiasConfig(unit, "active").damageOut || 1;
    }

    function getCommandIncomingDamageMultiplier(unit) {
      if (!isCommandBiasAffectedUnit(unit)) {
        return 1;
      }
      return getCommandBiasConfig(unit, "active").damageIn || 1;
    }

    function isCommandBiasAffectedUnit(unit) {
      return Boolean(unit && unit.team === "party" && unit.id !== "finald");
    }

    function commitCommandBias(unit) {
      if (!unit || unit.team !== "party" || unit.id === "finald") {
        return;
      }
      unit.activeCommandBias = clampCommandBias(unit.commandBias);
    }

    function applyMoodCommandBiasAuto(unit) {
      if (!unit || unit.team !== "party" || unit.id === "finald" || unit.mood === null) {
        return;
      }
      if ((unit.commandBiasActionCount || 0) < COMMAND_BIAS_AUTO_GRACE_ACTIONS) {
        unit.commandBiasActionCount = (unit.commandBiasActionCount || 0) + 1;
        return;
      }

      if (unit.mood <= 20) {
        const roll = Math.random();
        if (roll < 0.1) {
          unit.commandBias = -2;
        } else if (roll < 0.35) {
          unit.commandBias = clampCommandBias(unit.commandBias - 1);
        }
        return;
      }

      if (unit.mood <= 40) {
        if (Math.random() < 0.15) {
          unit.commandBias = clampCommandBias(unit.commandBias - 1);
        }
        return;
      }

      if (unit.mood > 80) {
        const roll = Math.random();
        if (roll < 0.1) {
          unit.commandBias = 2;
        } else if (roll < 0.35) {
          unit.commandBias = clampCommandBias(unit.commandBias + 1);
        }
        return;
      }

      if (unit.mood >= 65) {
        if (Math.random() < 0.15) {
          unit.commandBias = clampCommandBias(unit.commandBias + 1);
        }
      }
    }

    function clampCommandBias(value) {
      return clamp(Math.round(Number.isFinite(value) ? value : 0), -2, 2);
    }

    function getCommandBiasConfig(unit, mode = "active") {
      const value = unit ? (mode === "selected" ? unit.commandBias : unit.activeCommandBias) : 0;
      const normalized = clampCommandBias(value);
      return COMMAND_BIAS_CONFIGS.find((config) => config.value === normalized) || COMMAND_BIAS_CONFIGS[2];
    }

    function moodLerp(mood, leftMood, leftValue, rightMood, rightValue) {
      const ratio = clamp((mood - leftMood) / (rightMood - leftMood), 0, 1);
      return leftValue + (rightValue - leftValue) * ratio;
    }

    function getMoodNaturalDelta(unit) {
      if (!unit || unit.mood === null || unit.maxHp <= 0) {
        return 0;
      }

      const hpRatio = clamp(unit.hp / unit.maxHp, 0, 1);
      for (const step of MOOD_NATURAL_HP_STEPS) {
        if (hpRatio >= step.hp) {
          return step.delta;
        }
      }
      return MOOD_NATURAL_HP_BOTTOM_DELTA;
    }

    function getMoodGainMultiplier(unit) {
      if (!unit || unit.mood === null) return 1;
      if (unit.noDamage <= MOOD_NO_DAMAGE_GAIN_BONUS_START) return 1;
      return moodLerp(unit.noDamage, MOOD_NO_DAMAGE_GAIN_BONUS_START, 1, MOOD_NO_DAMAGE_GAIN_BONUS_MAX_TIME, MOOD_NO_DAMAGE_GAIN_BONUS_MAX);
    }

    function getMpRegenRate(unit) {
      return unit && Number.isFinite(unit.mpRegenRate) ? unit.mpRegenRate : DEFAULT_MP_REGEN_RATE;
    }

    function regenerateMp(unit, dt) {
      if (!unit || unit.maxMp <= 0) {
        return;
      }
      unit.mp = clamp(unit.mp + unit.maxMp * getMpRegenRate(unit) * dt, 0, unit.maxMp);
    }

    function applyMoodHighGainDamping(unit, amount) {
      if (!unit || unit.mood === null || amount <= 0) {
        return amount;
      }
      if (unit.mood >= MOOD_HIGH_GAIN_DAMPING_START) {
        return amount * MOOD_HIGH_GAIN_DAMPING_MULT;
      }

      const normalRoom = MOOD_HIGH_GAIN_DAMPING_START - unit.mood;
      if (amount <= normalRoom) {
        return amount;
      }
      return normalRoom + (amount - normalRoom) * MOOD_HIGH_GAIN_DAMPING_MULT;
    }

    function getHpRatio(amount, unit) {
      if (!unit || unit.maxHp <= 0 || amount <= 0) {
        return 0;
      }
      return Math.max(0, amount / unit.maxHp);
    }

    function getMoodReferenceHp(unit) {
      return Math.max(1, unit && (unit.moodBaseHp || unit.maxHp) || 1);
    }

    function applyCommandMoodDelta(unit, amount) {
      if (!unit || unit.mood === null || amount === 0) {
        return amount;
      }
      const config = getCommandBiasConfig(unit, "active");
      return amount > 0 ? amount * config.moodGain : amount * config.moodLoss;
    }

    function addMoodGain(unit, amount) {
      if (!unit || unit.mood === null || amount <= 0) {
        return 0;
      }
      const adjusted = applyMoodHighGainDamping(unit, applyCommandMoodDelta(unit, amount * getMoodGainMultiplier(unit)));
      const before = unit.mood;
      unit.mood = clamp(unit.mood + adjusted, 0, 100);
      return unit.mood - before;
    }

    function addMoodLoss(unit, amount) {
      if (!unit || unit.mood === null || amount <= 0) {
        return 0;
      }
      const before = unit.mood;
      unit.mood = clamp(unit.mood + applyCommandMoodDelta(unit, -amount), 0, 100);
      return before - unit.mood;
    }

    function getMoodDistanceMultiplier(source, target) {
      if (!source || !target) return 1;
      const hitDistance = dist(source, target);
      if (hitDistance <= MOOD_DISTANCE_BONUS_START) return 1;
      return moodLerp(hitDistance, MOOD_DISTANCE_BONUS_START, 1, MOOD_DISTANCE_BONUS_END, MOOD_DISTANCE_BONUS_MAX);
    }

    function applyMultiHitMoodBonus(unit, enemyHits) {
      if (!unit || unit.mood === null || enemyHits < MOOD_MULTI_HIT_MIN) {
        return;
      }
      const bonus = MOOD_MULTI_HIT_BASE + enemyHits;
      addMoodGain(unit, bonus);
    }

    function getMoodOutgoingDamageMultiplier(unit) {
      if (!unit || unit.mood === null) return 1;
      if (unit.mood <= 10) return 0.3;
      if (unit.mood <= 50) return moodLerp(unit.mood, 10, 0.3, 50, 1);
      if (unit.mood <= 90) return moodLerp(unit.mood, 50, 1, 90, 1.3);
      return 1.3;
    }

    function getMoodIncomingDamageMultiplier(unit) {
      if (!unit || unit.mood === null || unit.mood <= 70) return 1;
      if (unit.mood <= 80) return moodLerp(unit.mood, 70, 1, 80, 1.1);
      if (unit.mood <= 90) return moodLerp(unit.mood, 80, 1.1, 90, 1.25);
      return moodLerp(unit.mood, 90, 1.25, 100, 1.4);
    }

    function getMoodGuardChance(unit) {
      if (unit && unit.id === "finald") return 0;
      return unit ? unit.guardChance * getCommandBiasConfig(unit, "active").guard : 0;
    }

    function getMoodCooldownMultiplier() {
      return 1;
    }

    function getMoodCooldown(unit, baseTime) {
      return baseTime * getMoodCooldownMultiplier(unit);
    }

    function getMoodCastTimeMultiplier() {
      return 1;
    }

    function getSushiaCastTime(baseTime, unit) {
      const stackMultiplier = 1 - unit.castStacks * 0.05;
      return Math.max(baseTime * 0.25, baseTime * stackMultiplier * getMoodCastTimeMultiplier(unit));
    }

    function getEffectiveGuardChance(unit) {
      return clamp(getMoodGuardChance(unit), 0, 1);
    }

    function getGuardDamageReductionRate(unit) {
      const baseReduction = 1 - GUARD_DAMAGE_MULTIPLIER;
      const overflow = Math.max(0, getMoodGuardChance(unit) - 1);
      return clamp(baseReduction + overflow * GUARD_OVERFLOW_REDUCTION_RATE, 0, GUARD_MAX_DAMAGE_REDUCTION);
    }

    function getGuardDamageMultiplier(unit) {
      return 1 - getGuardDamageReductionRate(unit);
    }

    function getEffectiveDefense(unit) {
      return unit.defense;
    }

    function addRihasPassiveStack(unit) {
      if (!unit || unit.id !== "rihas") {
        return;
      }
      if ((unit.rihasPassiveStackCooldown || 0) > 0) {
        return;
      }
      const before = unit.rihasPassiveStacks || 0;
      unit.rihasPassiveStacks = clamp(before + 1, 0, RIHAS_PASSIVE_MAX_STACKS);
      unit.rihasPassiveTimer = RIHAS_PASSIVE_STACK_DURATION;
      unit.rihasPassiveStackCooldown = RIHAS_PASSIVE_STACK_COOLDOWN;
    }

    function updateRihasPassiveStacks(unit, dt) {
      if (!unit || unit.id !== "rihas") {
        return;
      }
      unit.rihasPassiveStackCooldown = Math.max(0, (unit.rihasPassiveStackCooldown || 0) - dt);
      if ((unit.rihasPassiveStacks || 0) <= 0) {
        return;
      }
      unit.rihasPassiveTimer -= dt;
      if (unit.rihasPassiveTimer <= 0) {
        unit.rihasPassiveStacks = 0;
        unit.rihasPassiveTimer = 0;
        unit.rihasPassiveStackCooldown = 0;
      }
    }

    function getRihasPassiveRatio(unit) {
      if (!unit || unit.id !== "rihas") {
        return 0;
      }
      return clamp((unit.rihasPassiveStacks || 0) / RIHAS_PASSIVE_MAX_STACKS, 0, 1);
    }

    function getRihasPassiveDamageMultiplier(unit) {
      return 1 + getRihasPassiveRatio(unit) * RIHAS_PASSIVE_MAX_DAMAGE_BONUS;
    }

    function getRihasPassiveIncomingMultiplier(unit) {
      return 1 - getRihasPassiveRatio(unit) * RIHAS_PASSIVE_MAX_DAMAGE_REDUCTION;
    }

    return {
      getCommandActionCooldown,
      getCommandOutgoingDamageMultiplier,
      getCommandIncomingDamageMultiplier,
      commitCommandBias,
      applyMoodCommandBiasAuto,
      clampCommandBias,
      getCommandBiasConfig,
      moodLerp,
      getMoodNaturalDelta,
      getMoodGainMultiplier,
      getMpRegenRate,
      regenerateMp,
      applyMoodHighGainDamping,
      getHpRatio,
      getMoodReferenceHp,
      applyCommandMoodDelta,
      addMoodGain,
      addMoodLoss,
      getMoodDistanceMultiplier,
      applyMultiHitMoodBonus,
      getMoodOutgoingDamageMultiplier,
      getMoodIncomingDamageMultiplier,
      getMoodGuardChance,
      getMoodCooldownMultiplier,
      getMoodCooldown,
      getMoodCastTimeMultiplier,
      getSushiaCastTime,
      getEffectiveGuardChance,
      getGuardDamageReductionRate,
      getGuardDamageMultiplier,
      getEffectiveDefense,
      addRihasPassiveStack,
      updateRihasPassiveStacks,
      getRihasPassiveRatio,
      getRihasPassiveDamageMultiplier,
      getRihasPassiveIncomingMultiplier,
    };
  };
})();
