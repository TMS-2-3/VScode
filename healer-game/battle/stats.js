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
      MOOD_DAMAGE_ACTION_CAP,
      DEFAULT_MP_REGEN_RATE,
      CRIT_OVERFLOW_DAMAGE_RATE,
      ULPES_PASSIVE_CRIT_CHANCE_MULTIPLIER,
      ULPES_PASSIVE_CRIT_DAMAGE_BONUS_MULTIPLIER,
      GUARD_DAMAGE_MULTIPLIER,
      GUARD_OVERFLOW_REDUCTION_RATE,
      GUARD_MAX_DAMAGE_REDUCTION,
      RIHAS_PASSIVE_MAX_STACKS,
      RIHAS_PASSIVE_STACK_DURATION,
      RIHAS_PASSIVE_STACK_COOLDOWN,
      RIHAS_PASSIVE_MAX_ATTACK_BONUS,
      RIHAS_PASSIVE_MAX_DEFENSE_BONUS,
      clamp,
      dist,
      hasPassive,
      getEquipmentEffectiveStat,
      getEquipmentStatBonusSum,
      getEquipmentFlatStatBonusSum,
    } = context;

    const REGEN_TICK_INTERVAL = 1;

    const STAT_MINIMUMS = {
      maxHp: 1,
      hp: 0,
      maxMp: 0,
      mp: 0,
      attack: 0,
      magic: 0,
      defense: 1,
      magicDefense: 1,
      guardChance: 0,
      guardDamageReduction: 0,
      speed: 0,
      critChance: 0,
      critDamage: 0,
    };

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
      return;
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
      return getEffectiveStatValue(unit, "mpRegenRate", DEFAULT_MP_REGEN_RATE);
    }

    function getHpRegenRate(unit) {
      return getEffectiveStatValue(unit, "hpRegenRate", 0);
    }

    function regenerateMp(unit, dt) {
      if (!unit || unit.maxMp <= 0) {
        return;
      }
      const rate = getMpRegenRate(unit);
      const ticks = consumeRegenTicks(unit, "mpRegenTickTimer", dt, rate);
      if (ticks <= 0) {
        return;
      }
      unit.mp = clamp(unit.mp + unit.maxMp * rate * ticks, 0, unit.maxMp);
    }

    function regenerateHp(unit, dt) {
      if (!unit || unit.dead || unit.maxHp <= 0) {
        return;
      }
      const rate = getHpRegenRate(unit);
      const ticks = consumeRegenTicks(unit, "hpRegenTickTimer", dt, rate);
      if (ticks <= 0) {
        return;
      }
      unit.hp = clamp(unit.hp + unit.maxHp * rate * ticks, 0, unit.maxHp);
      if (unit.hp <= 0) {
        unit.dead = true;
      }
    }

    function consumeRegenTicks(unit, timerKey, dt, rate) {
      if (!unit || !Number.isFinite(dt) || dt <= 0 || !Number.isFinite(rate) || rate === 0) {
        if (unit) {
          unit[timerKey] = 0;
        }
        return 0;
      }
      unit[timerKey] = Math.max(0, Number.isFinite(unit[timerKey]) ? unit[timerKey] : 0) + dt;
      if (unit[timerKey] < REGEN_TICK_INTERVAL) {
        return 0;
      }
      const ticks = Math.floor(unit[timerKey] / REGEN_TICK_INTERVAL);
      unit[timerKey] -= ticks * REGEN_TICK_INTERVAL;
      return ticks;
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

    function beginMoodAction(unit) {
      if (!unit || unit.mood === null) {
        return;
      }
      unit.moodActionGain = 0;
      unit.moodActionId = Math.max(0, Math.floor(Number.isFinite(unit.moodActionId) ? unit.moodActionId : 0)) + 1;
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

    function addMoodActionGain(unit, amount) {
      if (!unit || unit.mood === null || amount <= 0) {
        return 0;
      }
      const cap = Math.max(0, Number.isFinite(MOOD_DAMAGE_ACTION_CAP) ? MOOD_DAMAGE_ACTION_CAP : 6);
      if (cap <= 0) {
        return 0;
      }
      const current = Math.max(0, Number.isFinite(unit.moodActionGain) ? unit.moodActionGain : 0);
      const room = Math.max(0, cap - current);
      if (room <= 0) {
        return 0;
      }
      const before = unit.mood;
      const gained = addMoodGain(unit, amount);
      const applied = Math.min(gained, room);
      if (gained > applied) {
        unit.mood = clamp(before + applied, 0, 100);
      }
      unit.moodActionGain = current + applied;
      return applied;
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
      addMoodActionGain(unit, bonus);
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
      return unit ? getEffectiveStat(unit, "guardChance") * getCommandBiasConfig(unit, "active").guard : 0;
    }

    function getMoodCooldownMultiplier(unit) {
      return Math.max(0.1, 1 - clamp(getEquipmentBonus(unit, "cooldownReduction") + getStatusStatBonus(unit, "cooldownReduction"), -1, 0.9));
    }

    function getMoodCooldown(unit, baseTime) {
      return baseTime * getMoodCooldownMultiplier(unit);
    }

    function getCastSpeed(unit) {
      const base = unit && Number.isFinite(unit.castSpeed) ? unit.castSpeed : 0;
      const warmup = unit && hasPassive(unit, "warmup") ? (unit.castStacks || 0) * 0.05 : 0;
      return Math.min(1, base + warmup + getEquipmentBonus(unit, "castSpeed") + getStatusStatBonus(unit, "castSpeed"));
    }

    function getCastTimeMultiplier(unit) {
      return Math.max(0, 1 - getCastSpeed(unit));
    }

    function getCastTime(baseTime, unit) {
      if (!Number.isFinite(baseTime) || baseTime <= 0) {
        return 0;
      }
      return Math.max(0.0001, baseTime * getCastTimeMultiplier(unit));
    }

    function getMoodCastTimeMultiplier(unit) {
      return getCastTimeMultiplier(unit);
    }

    function getSushiaCastTime(baseTime, unit) {
      return getCastTime(baseTime, unit);
    }

    function getRawCritChance(unit) {
      let chance = getBaseAndEquipmentStat(unit, "critChance", 0);
      if (hasPassive(unit, "swordwork")) {
        const multiplier = Number.isFinite(ULPES_PASSIVE_CRIT_CHANCE_MULTIPLIER) ? ULPES_PASSIVE_CRIT_CHANCE_MULTIPLIER : 1;
        chance *= multiplier;
      }
      chance += getStatusStatBonus(unit, "critChance");
      return applyStatMinimum("critChance", chance);
    }

    function getEffectiveCritChance(unit) {
      return clamp(getRawCritChance(unit), 0, 1);
    }

    function getEffectiveCritDamageRate(unit) {
      let rate = getBaseAndEquipmentStat(unit, "critDamage", 0);
      if (hasPassive(unit, "swordwork")) {
        const multiplier = Number.isFinite(ULPES_PASSIVE_CRIT_DAMAGE_BONUS_MULTIPLIER)
          ? ULPES_PASSIVE_CRIT_DAMAGE_BONUS_MULTIPLIER
          : 0.5;
        rate *= multiplier;
      }
      rate += getStatusStatBonus(unit, "critDamage");
      rate += Math.max(0, getRawCritChance(unit) - 1) * getSafeNumber(CRIT_OVERFLOW_DAMAGE_RATE, 0.5);
      return applyStatMinimum("critDamage", rate);
    }

    function getCritDamageMultiplier(unit) {
      return 1 + getEffectiveCritDamageRate(unit);
    }
    function getEffectiveGuardChance(unit) {
      return clamp(getMoodGuardChance(unit), 0, 1);
    }

    function getGuardDamageReductionRate(unit) {
      const baseReduction = 1 - GUARD_DAMAGE_MULTIPLIER;
      const overflow = Math.max(0, getMoodGuardChance(unit) - 1);
      const bonus = getBaseStat(unit, "guardDamageReduction", 0) + getEquipmentBonus(unit, "guardDamageReduction");
      return clamp(baseReduction + bonus + overflow * GUARD_OVERFLOW_REDUCTION_RATE, 0, GUARD_MAX_DAMAGE_REDUCTION);
    }

    function getGuardDamageMultiplier(unit) {
      return 1 - getGuardDamageReductionRate(unit);
    }

    function getEffectiveDefense(unit) {
      return getEffectiveStat(unit, "defense");
    }

    function getEffectiveAttack(unit) {
      return getEffectiveStat(unit, "attack");
    }

    function getEffectiveMagic(unit) {
      return getEffectiveStat(unit, "magic");
    }

    function getEffectiveMagicDefense(unit) {
      return getEffectiveStat(unit, "magicDefense");
    }

    function getEffectiveMoveSpeed(unit) {
      if (unit && (unit.counterattackStanceTimer || 0) > 0) {
        return 0;
      }
      const base = getBaseStat(unit, "speed", 0) + getEquipmentFlatBonus(unit, "speed") + getEquipmentFlatBonus(unit, "moveSpeed");
      const bonus = getMoveSpeedBonus(unit);
      return Math.max(0, base + base * bonus);
    }

    function getMoveSpeedBonus(unit) {
      return getEquipmentBonus(unit, "moveSpeed") + getStatusStatBonus(unit, "moveSpeed");
    }

    function getUltimateChargeRate(unit) {
      return Math.max(0, getBaseStat(unit, "ultimateChargeRate", 1) + getEquipmentBonus(unit, "ultimateChargeRate"));
    }

    function getEffectiveStat(unit, statKey) {
      return getEffectiveStatValue(unit, statKey, 0);
    }

    function getEffectiveStatValue(unit, statKey, fallback = 0) {
      const base = getBaseStat(unit, statKey, fallback) + getEquipmentFlatBonus(unit, statKey);
      const percentBonus = getEquipmentBonus(unit, statKey) + getStatusStatBonus(unit, statKey);
      return applyStatMinimum(statKey, isAdditiveBonusStat(statKey) ? base + percentBonus : base + base * percentBonus);
    }

    function getBaseAndEquipmentStat(unit, statKey, fallback = 0) {
      const base = getBaseStat(unit, statKey, fallback) + getEquipmentFlatBonus(unit, statKey);
      const equipmentBonus = getEquipmentBonus(unit, statKey);
      return applyStatMinimum(statKey, isAdditiveBonusStat(statKey) ? base + equipmentBonus : base + base * equipmentBonus);
    }

    function isAdditiveBonusStat(statKey) {
      return [
        "critChance",
        "critDamage",
        "guardChance",
        "guardDamageReduction",
        "damageBoost",
        "damageResistance",
        "physicalDamageBoost",
        "physicalDamageResistance",
        "magicDamageBoost",
        "magicDamageResistance",
        "hpRegenRate",
        "mpRegenRate",
        "castSpeed",
        "cooldownReduction",
        "actionSpeed",
        "ultimateChargeRate",
        "moveSpeed",
      ].includes(statKey);
    }

    function getBaseStat(unit, statKey, fallback = 0) {
      const baseStats = unit && unit.baseStats;
      if (baseStats && Number.isFinite(baseStats[statKey])) {
        return baseStats[statKey];
      }
      return unit && Number.isFinite(unit[statKey]) ? unit[statKey] : fallback;
    }

    function getEquipmentBonus(unit, statKey) {
      return typeof getEquipmentStatBonusSum === "function" ? getEquipmentStatBonusSum(unit, statKey) : 0;
    }

    function getEquipmentFlatBonus(unit, statKey) {
      if (typeof getEquipmentFlatStatBonusSum === "function") {
        return getEquipmentFlatStatBonusSum(unit, statKey);
      }
      if (typeof getEquipmentEffectiveStat === "function") {
        const base = getBaseStat(unit, statKey, 0);
        return getEquipmentEffectiveStat(unit, statKey) - base;
      }
      return 0;
    }

    function getStatusStatBonus(unit, statKey) {
      let bonus = 0;
      if (unit && (unit.sharpenBladeTimer || 0) > 0 && statKey === "attack") {
        bonus += 0.2;
      }
      if (unit && (unit.counterattackStanceTimer || 0) > 0 && statKey === "guardChance") {
        bonus += 2;
      }
      if (hasPassive(unit, "painless")) {
        if (statKey === "attack") {
          bonus += getRihasPassiveRatio(unit) * getSafeNumber(RIHAS_PASSIVE_MAX_ATTACK_BONUS, 0);
        } else if (statKey === "defense") {
          bonus += getRihasPassiveRatio(unit) * getSafeNumber(RIHAS_PASSIVE_MAX_DEFENSE_BONUS, 0);
        }
      }
      if (hasPassive(unit, "number_of_times")) {
        if (statKey === "actionSpeed" || statKey === "cooldownReduction") {
          bonus += 0.5;
        } else if (statKey === "damageBoost") {
          bonus -= 0.4;
        }
      }
      if (hasPassive(unit, "magic_add_on")) {
        if (statKey === "castSpeed") {
          bonus -= 0.5;
        } else if (statKey === "magicDamageBoost") {
          bonus += 0.2;
        }
      }
      if (hasPassive(unit, "lightweight_buff")) {
        if (statKey === "moveSpeed") {
          bonus += 0.3;
        } else if (statKey === "castSpeed") {
          bonus += 0.5;
        } else if (statKey === "mpRegenRate") {
          bonus -= 0.04;
        }
      }
      if (unit && (unit.injuryTimer || 0) > 0) {
        if (statKey === "defense" || statKey === "moveSpeed") {
          bonus -= 0.1;
        }
      }
      if (unit && (unit.leakageTimer || 0) > 0) {
        if (statKey === "magic" || statKey === "magicDefense") {
          bonus -= 0.1;
        }
      }
      if (unit && (unit.tingleTimer || 0) > 0) {
        if (statKey === "attack" || statKey === "defense") {
          bonus -= 0.1;
        }
      }
      if (unit && (unit.freezingTimer || 0) > 0) {
        if (statKey === "actionSpeed") {
          bonus -= 0.1;
        } else if (statKey === "moveSpeed") {
          bonus -= 0.2;
        }
      }
      if (unit && (unit.flinchingTimer || 0) > 0) {
        if (statKey === "actionSpeed") {
          bonus -= 0.5;
        } else if (statKey === "moveSpeed") {
          bonus -= 0.1;
        }
      }
      if (unit && (unit.plantStage || 0) > 0 && statKey === "hpRegenRate") {
        const penalties = [0, 0.001, 0.003, 0.005, 0.008];
        const stage = Math.max(1, Math.min(4, Math.floor(unit.plantStage || 1)));
        bonus -= penalties[stage] || 0;
      }
      if (unit && (unit.contemptStacks || 0) > 0 && (unit.contemptTimer || 0) > 0) {
        if (statKey === "damageBoost" || statKey === "damageResistance") {
          bonus += 0.15;
        }
      }
      if (unit && (unit.feelTimer || 0) > 0 && statKey === "guardChance") {
        bonus += 0.5;
      }
      if (unit && (unit.desteStacks || 0) > 0 && statKey === "critChance") {
        bonus += 1;
      }
      if (unit && (unit.magicNeutralizeTimer || 0) > 0 && statKey === "magic") {
        bonus -= Math.max(0, Number.isFinite(unit.magicNeutralizeRatio) ? unit.magicNeutralizeRatio : 0);
      }
      if (unit && (unit.actionSpeedDownTimer || 0) > 0 && statKey === "actionSpeed") {
        bonus -= Math.max(0, Number.isFinite(unit.actionSpeedDownRatio) ? unit.actionSpeedDownRatio : 0);
      }
      if (unit && (unit.shadowDashTimer || 0) > 0) {
        if (statKey === "moveSpeed") {
          bonus += 0.5;
        } else if (statKey === "actionSpeed") {
          bonus += 0.8;
        }
      }
      return bonus;
    }

    function applyStatMinimum(statKey, value) {
      const minimum = STAT_MINIMUMS[statKey];
      if (!Number.isFinite(minimum)) {
        return value;
      }
      return Math.max(minimum, value);
    }

    function getInternalBonus(unit, statKey) {
      const base = getBaseStat(unit, statKey, 0);
      return base + getEquipmentBonus(unit, statKey) + getStatusStatBonus(unit, statKey);
    }

    function getPhysicalDamageBoost(unit) {
      return getInternalBonus(unit, "physicalDamageBoost");
    }

    function getMagicDamageBoost(unit) {
      return getInternalBonus(unit, "magicDamageBoost");
    }

    function getDamageBoost(unit) {
      return getInternalBonus(unit, "damageBoost");
    }

    function getDamageResistance(unit) {
      return getInternalBonus(unit, "damageResistance");
    }

    function getPhysicalDamageResistance(unit) {
      return getInternalBonus(unit, "physicalDamageResistance");
    }

    function getMagicDamageResistance(unit) {
      return getInternalBonus(unit, "magicDamageResistance");
    }

    function addRihasPassiveStack(unit) {
      if (!unit || !hasPassive(unit, "painless")) {
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
      if (!unit || !hasPassive(unit, "painless")) {
        if (unit) {
          unit.rihasPassiveStacks = 0;
          unit.rihasPassiveTimer = 0;
          unit.rihasPassiveStackCooldown = 0;
        }
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
      if (!unit || !hasPassive(unit, "painless")) {
        return 0;
      }
      return clamp((unit.rihasPassiveStacks || 0) / RIHAS_PASSIVE_MAX_STACKS, 0, 1);
    }

    function getRihasPassiveAttackMultiplier(unit) {
      const maxBonus = getSafeNumber(RIHAS_PASSIVE_MAX_ATTACK_BONUS, 0);
      return 1 + getRihasPassiveRatio(unit) * maxBonus;
    }

    function getRihasPassiveDefenseMultiplier(unit) {
      const maxBonus = getSafeNumber(RIHAS_PASSIVE_MAX_DEFENSE_BONUS, 0);
      return 1 + getRihasPassiveRatio(unit) * maxBonus;
    }

    function getRihasPassiveStatMultiplier(unit, statKey) {
      if (statKey === "attack") {
        return getRihasPassiveAttackMultiplier(unit);
      }
      if (statKey === "defense") {
        return getRihasPassiveDefenseMultiplier(unit);
      }
      return 1;
    }

    function getRihasPassiveDamageMultiplier(unit) {
      return 1;
    }

    function getRihasPassiveIncomingMultiplier(unit) {
      return 1;
    }

    function getSafeNumber(value, fallback = 0) {
      return Number.isFinite(value) ? value : fallback;
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
      getHpRegenRate,
      getMpRegenRate,
      regenerateHp,
      regenerateMp,
      applyMoodHighGainDamping,
      getHpRatio,
      getMoodReferenceHp,
      applyCommandMoodDelta,
      beginMoodAction,
      addMoodGain,
      addMoodActionGain,
      addMoodLoss,
      getMoodDistanceMultiplier,
      applyMultiHitMoodBonus,
      getMoodOutgoingDamageMultiplier,
      getMoodIncomingDamageMultiplier,
      getMoodGuardChance,
      getMoodCooldownMultiplier,
      getMoodCooldown,
      getMoodCastTimeMultiplier,
      getCastSpeed,
      getCastTime,
      getSushiaCastTime,
      getRawCritChance,
      getEffectiveCritChance,
      getEffectiveCritDamageRate,
      getCritDamageMultiplier,
      getEffectiveGuardChance,
      getGuardDamageReductionRate,
      getGuardDamageMultiplier,
      getEffectiveDefense,
      getEffectiveAttack,
      getEffectiveMagic,
      getEffectiveMagicDefense,
      getEffectiveMoveSpeed,
      getUltimateChargeRate,
      getEffectiveStat,
      getPhysicalDamageBoost,
      getMagicDamageBoost,
      getDamageBoost,
      getDamageResistance,
      getPhysicalDamageResistance,
      getMagicDamageResistance,
      addRihasPassiveStack,
      updateRihasPassiveStacks,
      getRihasPassiveRatio,
      getRihasPassiveAttackMultiplier,
      getRihasPassiveDefenseMultiplier,
      getRihasPassiveDamageMultiplier,
      getRihasPassiveIncomingMultiplier,
    };
  };
})();
