(() => {
  "use strict";

  window.createHealerCombatSystem = function createHealerCombatSystem(context) {
    const {
      player,
      game,
      COLORS,
      ACTION_GAP,
      SUSHIA_PASSIVE_MAX_STACKS,
      SUSHIA_PASSIVE_STACK_DURATION,
      SUSHIA_PASSIVE_STACK_COOLDOWN,
      MOOD_DAMAGE_HP_RATIO_GAIN,
      MOOD_DAMAGE_HIT_CAP,
      MOOD_DAMAGE_TAKEN_RATE,
      MOOD_DAMAGE_TAKEN_BASE_LOSS,
      MOOD_HEAL_RATE,
      MOOD_QUICK_HEAL_BONUS,
      MOOD_EVENT_MULT,
      MOOD_KILL_BONUS,
      FRIENDLY_FIRE_MOOD_SAFE_LIMIT,
      FRIENDLY_FIRE_MOOD_MAX,
      FRIENDLY_FIRE_MIN_DAMAGE_MULTIPLIER,
      FRIENDLY_FIRE_MAX_DAMAGE_MULTIPLIER,
      FRIENDLY_FIRE_LOW_EFFECT_DURATION_MULTIPLIER,
      FRIENDLY_FIRE_HIGH_EFFECT_DURATION_MULTIPLIER,
      HILMENT_SELF_HEAL_RATIO,
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
      getPhysicalDamageBoost,
      getMagicDamageBoost,
      getDamageBoost,
      getDamageResistance,
      getPhysicalDamageResistance,
      getMagicDamageResistance,
      getGuardDamageMultiplier,
      getUltimateChargeRate,
      getEffectiveGuardChance,
      getEffectiveCritChance,
      getCritDamageMultiplier,
      getActiveSetEffects,
      getUltimateCost,
      getEffectiveDefense,
      getEffectiveMagicDefense,
      addRihasPassiveStack,
      getElementOutgoingDamageMultiplier,
      getElementIncomingDamageMultiplier,
      getMoodDistanceMultiplier,
      getHpRatio,
      getMoodReferenceHp,
      addMoodActionGain,
      addMoodGain,
      addMoodLoss,
      hasPassive,
    } = context;

    const DEFENSE_BASELINE = 100;
    const DEFENSE_OVER_BASE_SCALE = 0.4;

    function addShield(unit, amount, duration) {
      if (!unit || amount <= 0 || duration <= 0) {
        return 0;
      }
      const currentTotal = syncShieldTotal(unit);
      const room = Math.max(0, (unit.maxHp || 0) - currentTotal);
      const added = Math.min(amount, room);
      if (added <= 0) {
        return 0;
      }
      getShieldStacks(unit).push({ amount: added, timer: duration });
      syncShieldTotal(unit);
      applyShieldMoodGain(unit, added);
      return added;
    }

    function applyShieldMoodGain(unit, addedShield) {
      if (!unit || unit.team !== "party" || unit.id === "finald" || addedShield <= 0) {
        return 0;
      }
      const shieldRatio = getHpRatio(addedShield, unit);
      const referenceShield = shieldRatio * Math.max(1, unit.maxHp || 1);
      return addMoodGain(unit, referenceShield * MOOD_HEAL_RATE * MOOD_EVENT_MULT);
    }

    function getShieldStacks(unit) {
      if (!unit) {
        return [];
      }
      if (!Array.isArray(unit.shields)) {
        unit.shields = [];
      }
      if (unit.shields.length === 0 && unit.shield > 0 && unit.shieldTimer > 0) {
        unit.shields.push({ amount: unit.shield, timer: unit.shieldTimer });
      }
      return unit.shields;
    }

    const ULTIMATE_GAIN_PER_AFFECTED_UNIT = 4;

    function syncShieldTotal(unit) {
      if (!unit) {
        return 0;
      }
      const stacks = getShieldStacks(unit).filter((stack) => stack && stack.amount > 0 && stack.timer > 0);
      unit.shields = stacks;
      const total = stacks.reduce((sum, stack) => sum + stack.amount, 0);
      unit.shield = clamp(total, 0, unit.maxHp || total);
      unit.shieldTimer = stacks.reduce((max, stack) => Math.max(max, stack.timer), 0);
      return unit.shield;
    }

    function isDotDamageOptions(options = {}) {
      const rawType = String(options.damageType || "");
      const type = rawType.toLowerCase();
      return options.dotDamage === true || options.dot === true || type.includes("dot") || rawType.includes("ドット");
    }

    function dealDamage(source, target, amount, options = {}) {
      if (!target || target.dead) {
        return 0;
      }

      if (isFriendlyFire(source, target) && !canFriendlyFireAffect(source, target)) {
        return 0;
      }

      const wasTargetAlive = target.hp > 0;
      let finalAmount = amount;
      let criticalHit = false;

      if (shouldRollCritical(source, target, options)) {
        finalAmount *= getCritDamageMultiplier(source);
        criticalHit = true;
      }

      finalAmount = reduceByDefense(target, finalAmount, options.magic);
      finalAmount = applyDamageModifierSum(source, target, finalAmount, options);
      finalAmount *= getElementDamageMultiplier(source, target, options);
      finalAmount *= getFriendlyFireDamageMultiplier(source, target);

      const dotDamage = isDotDamageOptions(options);
      let guarded = false;
      if (!dotDamage && target.team === "party" && target.id !== "finald") {
        guarded = tryGuard(target);
        if (guarded) {
          finalAmount *= getGuardDamageMultiplier(target);
        }
      }

      const damageFloatColor = getDamageFloatColor(source, target);
      let shielded = 0;
      const hpBeforeDamage = Math.max(0, Number.isFinite(target.hp) ? target.hp : 0);
      if (finalAmount > 0 && syncShieldTotal(target) > 0) {
        const stacks = getShieldStacks(target).sort((a, b) => a.timer - b.timer);
        let remainingShieldDamage = finalAmount;
        for (const stack of stacks) {
          if (remainingShieldDamage <= 0) {
            break;
          }
          const absorbed = Math.min(stack.amount, remainingShieldDamage);
          stack.amount -= absorbed;
          remainingShieldDamage -= absorbed;
          shielded += absorbed;
        }
        finalAmount = remainingShieldDamage;
        syncShieldTotal(target);
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
      if (!dotDamage && (finalAmount > 0 || shielded > 0)) {
        clearSleep(target);
      }
      let delayedAmount = 0;
      if (hasPassive(target, "painless") && finalAmount > 0 && !options.delayed) {
        addRihasPassiveStack(target);
        delayedAmount = finalAmount / 3;
        finalAmount -= delayedAmount;
        target.delayedDamageQueue.push({
          timer: 1,
          ticks: 5,
          amount: Math.max(1, delayedAmount / 5),
          color: damageFloatColor,
          dotDamage: true,
          damageType: "dot",
        });
      }

      let immediateHpDamage = 0;
      if (finalAmount > 0) {
        target.hp = Math.max(0, target.hp - finalAmount);
        immediateHpDamage = hpBeforeDamage - target.hp;
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
      } else if (delayedAmount > 0) {
        target.noDamage = 0;
      }

      const rewardDamage = finalAmount + delayedAmount;
      if (source && source.team === "party") {
        if (target.team === "enemy" && rewardDamage + shielded > 0) {
          awardOffensiveUltimate(source, target, options);
        }
        if (hasPassive(source, "warmup") && target.team === "enemy" && rewardDamage > 0 && options.magic && source.stackCooldown <= 0) {
          source.castStacks = clamp(source.castStacks + 1, 0, SUSHIA_PASSIVE_MAX_STACKS);
          source.stackTimer = SUSHIA_PASSIVE_STACK_DURATION;
          source.stackCooldown = SUSHIA_PASSIVE_STACK_COOLDOWN;
        }
        if (source.mood !== null && target.team === "enemy") {
          const hpDamageForMood = Math.min(hpBeforeDamage, Math.max(0, rewardDamage));
          const damageRatio = getHpRatio(hpDamageForMood, target);
          const distanceMult = getMoodDistanceMultiplier(source, target);
          const ratioGain = Math.max(0, Number.isFinite(MOOD_DAMAGE_HP_RATIO_GAIN) ? MOOD_DAMAGE_HP_RATIO_GAIN : 12);
          const hitCap = Math.max(0, Number.isFinite(MOOD_DAMAGE_HIT_CAP) ? MOOD_DAMAGE_HIT_CAP : 2);
          const moodGain = Math.min(hitCap, damageRatio * ratioGain * distanceMult);
          addMoodActionGain(source, moodGain);
        }
      }

      if (target.team === "party" && target.id !== "finald") {
        applyDamageMoodLoss(target, immediateHpDamage);
      }

      if (target.hp <= 0) {
        if (wasTargetAlive && target.team === "enemy" && source && source.team === "party" && source.mood !== null) {
          addMoodActionGain(source, MOOD_KILL_BONUS);
        }
        target.dead = true;
        target.hp = 0;
        addBurst(target.x, target.y, target.radius * 2.2, "rgba(255,255,255,0.2)");
      }
      return rewardDamage + shielded;
    }

    function applyDamageMoodLoss(target, hpDamage) {
      if (!target || target.team !== "party" || target.id === "finald" || hpDamage <= 0) {
        return 0;
      }
      const damageRatio = getHpRatio(hpDamage, target);
      const referenceDamage = damageRatio * Math.max(1, target.maxHp || 1);
      const baseLoss = Number.isFinite(MOOD_DAMAGE_TAKEN_BASE_LOSS) ? MOOD_DAMAGE_TAKEN_BASE_LOSS : 0;
      return addMoodLoss(target, referenceDamage * MOOD_DAMAGE_TAKEN_RATE * MOOD_EVENT_MULT + baseLoss);
    }

    function clearSleep(unit) {
      if (!unit || (unit.sleepTimer || 0) <= 0) {
        return;
      }
      unit.sleepTimer = 0;
      unit.sleepMax = 0;
      addFloat("睡眠解除", unit.x, unit.y - 34, "#f7fff6");
    }

    function awardOffensiveUltimate(source, target, options = {}) {
      if (!target || target.team !== "enemy") {
        return 0;
      }
      return awardUltimateForAffectedUnit(source, options);
    }

    function awardSupportUltimate(source, target, options = {}) {
      if (!target || target.team !== "party") {
        return 0;
      }
      return awardUltimateForAffectedUnit(source, options);
    }

    function awardUltimateForAffectedUnit(source, options = {}) {
      if (!source || source.dead || source.team !== "party" || options.noUltGain || options.ultimate) {
        return 0;
      }
      const before = Number.isFinite(source.ult) ? source.ult : 0;
      const chargeRate = typeof getUltimateChargeRate === "function" ? getUltimateChargeRate(source) : 1;
      source.ult = clamp(before + ULTIMATE_GAIN_PER_AFFECTED_UNIT * chargeRate, 0, getUltimateCap(source));
      return source.ult - before;
    }

    function getUltimateCap(unit) {
      return typeof getUltimateCost === "function" ? getUltimateCost(unit) : 100;
    }

    function formatDamageFloat(amount, options = {}) {
      const prefix = `${options.guarded ? "B!" : ""}${options.critical ? "C!" : ""}`;
      return `${prefix}${Math.round(amount)}`;
    }

    function shouldRollCritical(source, target, options = {}) {
      if (!source || options.noCrit === true || options.crit === false || isDotDamageOptions(options)) {
        return false;
      }
      if (hasGuaranteedSetCritical(source, target)) {
        return true;
      }
      const bonus = Number.isFinite(options.critChanceBonus) ? options.critChanceBonus : 0;
      return Math.random() < clamp(getEffectiveCritChance(source) + bonus, 0, 1);
    }

    function hasGuaranteedSetCritical(source, target) {
      if (!source || source.team !== "party" || !target || target.team !== "enemy" || target.maxHp <= 0 || typeof getActiveSetEffects !== "function") {
        return false;
      }
      const hpRatio = clamp(target.hp / Math.max(1, target.maxHp), 0, 1);
      return getActiveSetEffects(source).some((entry) => {
        const threshold = entry && entry.effect && entry.effect.guaranteedCritHpRatio;
        return Number.isFinite(threshold) && hpRatio <= threshold;
      });
    }

    function applyDamageModifierSum(source, target, amount, options = {}) {
      let bonus = 0;
      if (source && source.team === "party" && source.id !== "finald" && source.mood !== null) {
        bonus += multiplierToBonus(getMoodOutgoingDamageMultiplier(source));
        bonus += multiplierToBonus(getCommandOutgoingDamageMultiplier(source));
      }
      bonus += getDamageTypeBoost(source, options);
      if (source && hasPassive(source, "painless")) {
        bonus += multiplierToBonus(getRihasPassiveDamageMultiplier(source));
      }
      bonus += getCommonDamageBoost(source);
      if (target.team === "party" && target.id !== "finald" && target.mood !== null) {
        bonus += multiplierToBonus(getMoodIncomingDamageMultiplier(target));
        bonus += multiplierToBonus(getCommandIncomingDamageMultiplier(target));
      }
      bonus -= getCommonDamageResistance(target);
      bonus -= getDamageTypeResistance(target, options);
      bonus += getFocusIncomingDamageBonus(target);
      if (source && source.team === "enemy" && hasPassive(target, "painless") && source.forcedTarget === target && source.tauntTimer > 0) {
        bonus += multiplierToBonus(0.6);
      }
      if (hasPassive(target, "painless")) {
        bonus += multiplierToBonus(getRihasPassiveIncomingMultiplier(target));
      }
      return amount * Math.max(0, 1 + bonus);
    }

    function getFocusIncomingDamageBonus(target) {
      if (!target || !game || game.priorityTarget !== target || !Number.isFinite(game.priorityTargetTimer) || game.priorityTargetTimer <= 0) {
        return 0;
      }
      return Math.max(0, getSafeNumber(target.focusDamageTakenBonus, 0));
    }

    function getDamageTypeBoost(unit, options = {}) {
      if (!unit) {
        return 0;
      }
      const getter = options.magic ? getMagicDamageBoost : getPhysicalDamageBoost;
      return typeof getter === "function" ? getSafeNumber(getter(unit), 0) : 0;
    }

    function getCommonDamageBoost(unit) {
      return typeof getDamageBoost === "function" ? getSafeNumber(getDamageBoost(unit), 0) : 0;
    }

    function getCommonDamageResistance(unit) {
      return typeof getDamageResistance === "function" ? getSafeNumber(getDamageResistance(unit), 0) : 0;
    }

    function getDamageTypeResistance(unit, options = {}) {
      if (!unit) {
        return 0;
      }
      const getter = options.magic ? getMagicDamageResistance : getPhysicalDamageResistance;
      return typeof getter === "function" ? getSafeNumber(getter(unit), 0) : 0;
    }

    function getElementDamageMultiplier(source, target, options = {}) {
      let multiplier = 1;
      if (source && typeof getElementOutgoingDamageMultiplier === "function") {
        multiplier *= getSafeMultiplier(getElementOutgoingDamageMultiplier(source, target, options));
      }
      if (target && typeof getElementIncomingDamageMultiplier === "function") {
        multiplier *= getSafeMultiplier(getElementIncomingDamageMultiplier(target, source, options));
      }
      return Math.max(0, multiplier);
    }

    function isFriendlyFire(source, target) {
      return Boolean(source && target && source !== target && source.team === "party" && target.team === "party");
    }

    function getFriendlyFireMood(source) {
      return source && Number.isFinite(source.mood) ? source.mood : -Infinity;
    }

    function isForcedHostileTarget(source, target) {
      return Boolean(source && target && source !== target && source.forcedTarget === target && source.tauntTimer > 0);
    }

    function canFriendlyFireAffect(source, target) {
      if (!isFriendlyFire(source, target)) {
        return true;
      }
      if (isForcedHostileTarget(source, target)) {
        return true;
      }
      return getFriendlyFireMood(source) >= getSafeNumber(FRIENDLY_FIRE_MOOD_SAFE_LIMIT, 80);
    }

    function getFriendlyFireDamageMultiplier(source, target) {
      if (!isFriendlyFire(source, target)) {
        return 1;
      }
      if (isForcedHostileTarget(source, target)) {
        return 1;
      }
      if (!canFriendlyFireAffect(source, target)) {
        return 0;
      }
      const highMood = getSafeNumber(FRIENDLY_FIRE_MOOD_MAX, 90);
      const lowMultiplier = getSafeNumber(FRIENDLY_FIRE_MIN_DAMAGE_MULTIPLIER, 0.3);
      const highMultiplier = getSafeNumber(FRIENDLY_FIRE_MAX_DAMAGE_MULTIPLIER, 0.8);
      return getFriendlyFireMood(source) < highMood ? lowMultiplier : highMultiplier;
    }

    function getFriendlyFireEffectDurationMultiplier(source, target) {
      if (!isFriendlyFire(source, target)) {
        return 1;
      }
      if (isForcedHostileTarget(source, target)) {
        return 1;
      }
      if (!canFriendlyFireAffect(source, target)) {
        return 0;
      }
      const highMood = getSafeNumber(FRIENDLY_FIRE_MOOD_MAX, 90);
      const lowMultiplier = getSafeNumber(FRIENDLY_FIRE_LOW_EFFECT_DURATION_MULTIPLIER, 0.5);
      const highMultiplier = getSafeNumber(FRIENDLY_FIRE_HIGH_EFFECT_DURATION_MULTIPLIER, 1);
      return getFriendlyFireMood(source) < highMood ? lowMultiplier : highMultiplier;
    }

    function getSafeNumber(value, fallback) {
      return Number.isFinite(value) ? value : fallback;
    }

    function getSafeMultiplier(multiplier) {
      return Number.isFinite(multiplier) ? multiplier : 1;
    }

    function multiplierToBonus(multiplier) {
      return getSafeMultiplier(multiplier) - 1;
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
      awardSupportUltimate(source, target, options);
      applyHilmentSelfHeal(source, target, healed);

      if (!options.noMood && target.team === "party" && target.id !== "finald") {
        const quickBonus = target.noDamage < 3 ? MOOD_QUICK_HEAL_BONUS : 0;
        const healRatio = getHpRatio(healed, target);
        const referenceHeal = healRatio * getMoodReferenceHp(target);
        addMoodGain(target, referenceHeal * MOOD_HEAL_RATE * MOOD_EVENT_MULT + quickBonus);
      }
      return healed;
    }

    function applyHilmentSelfHeal(source, target, healed) {
      if (!source || source.dead || !target || source === target || healed <= 0) {
        return;
      }
      if (source.id !== "finald" || source.team !== "party" || target.team !== "party" || !hasPassive(source, "hilment")) {
        return;
      }
      const ratio = Number.isFinite(HILMENT_SELF_HEAL_RATIO) ? HILMENT_SELF_HEAL_RATIO : 0.3;
      const before = source.hp;
      source.hp = clamp(source.hp + healed * ratio, 0, source.maxHp);
      const selfHealed = source.hp - before;
      if (selfHealed <= 0) {
        return;
      }
      source.hurt = 0;
      addFloat(`+${Math.round(selfHealed)}`, source.x, source.y - 28, getHealFloatColor(source));
    }

    function reduceByDefense(target, amount, isMagic) {
      const defense = isMagic ? getEffectiveMagicDefense(target) : getEffectiveDefense(target);
      const scaledDefense = getDefenseValueForDamage(defense);
      return amount * (DEFENSE_BASELINE / scaledDefense);
    }

    function getDefenseValueForDamage(defense) {
      const safeDefense = Math.max(1, Number.isFinite(defense) ? defense : 1);
      if (safeDefense <= DEFENSE_BASELINE) {
        return safeDefense;
      }
      return DEFENSE_BASELINE + (safeDefense - DEFENSE_BASELINE) * DEFENSE_OVER_BASE_SCALE;
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
          applyDelayedDamage(unit, entry.amount, entry.color, { dotDamage: entry.dotDamage !== false, damageType: entry.damageType || "dot" });
          entry.ticks -= 1;
          entry.timer += 1;
        }
        if (entry.ticks <= 0 || unit.dead) {
          unit.delayedDamageQueue.splice(i, 1);
        }
      }
    }

    function applyDelayedDamage(unit, amount, color = "#ff4f4f", options = {}) {
      const damage = Math.max(0, amount);
      if (damage <= 0 || unit.dead) {
        return;
      }
      // Painless delayed ticks are DoT-style direct HP damage; future sleep wake checks should read options.dotDamage.
      const before = unit.hp;
      unit.hp = Math.max(0, unit.hp - damage);
      const actualDamage = before - unit.hp;
      if (hasPassive(unit, "painless") && actualDamage > 0) {
        addRihasPassiveStack(unit);
      }
      applyDamageMoodLoss(unit, actualDamage);
      unit.hurt = 0.18;
      addFloat(`${Math.round(damage)}`, unit.x, unit.y - 24, color);
      if (unit.hp <= 0) {
        unit.dead = true;
        unit.hp = 0;
        addBurst(unit.x, unit.y, unit.radius * 2.2, "rgba(255,255,255,0.2)");
      }
    }

    function tryGuard(unit) {
      if (unit.frozen > 0 || (unit.sleepTimer || 0) > 0 || unit.actionLock > 0) {
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
      awardOffensiveUltimate,
      awardSupportUltimate,
      dealDamage,
      canFriendlyFireAffect,
      getFriendlyFireEffectDurationMultiplier,
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

