(() => {
  "use strict";

  window.createHealerStatPresenter = function createHealerStatPresenter(context) {
    const {
      COMMAND_BIAS_CONFIGS,
      getMoodOutgoingDamageMultiplier,
      getMoodIncomingDamageMultiplier,
      getCommandOutgoingDamageMultiplier,
      getCommandIncomingDamageMultiplier,
      getMoodCooldownMultiplier,
      getMoodCastTimeMultiplier,
      getCastSpeed,
      getSushiaCastTime,
      getRihasPassiveDamageMultiplier,
      getRihasPassiveIncomingMultiplier,
      getPhysicalDamageBoost,
      getMagicDamageBoost,
      getDamageBoost,
      getDamageResistance,
      getPhysicalDamageResistance,
      getMagicDamageResistance,
      getEffectiveAttack,
      getEffectiveMagic,
      getEffectiveDefense,
      getEffectiveMagicDefense,
      getEffectiveMoveSpeed,
      getUltimateChargeRate: getBattleUltimateChargeRate,
      getEffectiveGuardChance,
      getGuardDamageReductionRate,
      getEffectiveCritChance,
      getEffectiveCritDamageRate,
      getHpRegenRate,
      getMpRegenRate,
      getEquipmentStatBonusSum,
      hasPassive,
    } = context;

    function getDetailedStats(unit, options = {}) {
      const includeBattleState = options.includeBattleState !== false;
      const outgoing = getUnitOutgoingDamageMultiplier(unit, includeBattleState);
      const incoming = getUnitIncomingDamageMultiplier(unit, includeBattleState);
      const castSpeed = getUnitCastSpeed(unit);
      const skillSpeed = 1 - getMoodCooldownMultiplierSafe(unit);
      return [
        { label: "攻撃力", value: formatNumber(callNumber(getEffectiveAttack, unit, 0)) },
        { label: "魔力", value: formatNumber(callNumber(getEffectiveMagic, unit, 0)) },
        { label: "防御力", value: formatNumber(callNumber(getEffectiveDefense, unit, 0)) },
        { label: "魔法防御力", value: formatNumber(callNumber(getEffectiveMagicDefense, unit, 0)) },
        { label: "会心率", value: formatPercent(getUnitCritChance(unit)) },
        { label: "会心ダメージ", value: formatPercent(getUnitCritDamageRate(unit)) },
        { label: "ガード率", value: formatPercent(callNumber(getEffectiveGuardChance, unit, 0)) },
        { label: "ガード軽減率", value: formatPercent(callNumber(getGuardDamageReductionRate, unit, 0)) },
        { label: "与ダメージ率", value: formatPercent(outgoing) },
        { label: "被ダメージ率", value: formatPercent(incoming) },
        { label: "物理与ダメージ率", value: formatPercent(getPhysicalOutgoingDamageRate(unit)) },
        { label: "物理被ダメージ率", value: formatPercent(getPhysicalIncomingDamageRate(unit)) },
        { label: "魔法与ダメージ率", value: formatPercent(getMagicOutgoingDamageRate(unit)) },
        { label: "魔法被ダメージ率", value: formatPercent(getMagicIncomingDamageRate(unit)) },
        { label: "HP再生率", value: formatPercent(callNumber(getHpRegenRate, unit, 0)) },
        { label: "MP再生率", value: formatPercent(callNumber(getMpRegenRate, unit, 0)) },
        { label: "詠唱速度", value: formatSignedPercent(castSpeed) },
        { label: "スキル速度", value: formatSignedPercent(skillSpeed) },
        { label: "行動速度", value: getActionSpeedText(unit, includeBattleState) },
        { breakAfter: true },
        { label: "ゲージ上昇率", value: formatPercent(getUltimateChargeRate(unit)) },
        { label: "移動速度", value: `${Math.round(getUnitMoveSpeed(unit))}` },
      ];
    }

    function getActionSpeedText(unit, includeBattleState = true) {
      return formatPercent(getUnitActionSpeedRate(unit, includeBattleState));
    }

    function getUnitActionSpeedRate(unit, includeBattleState = true) {
      if (!unit) {
        return 1;
      }
      const config = includeBattleState && unit.id !== "finald" ? getCommandBiasConfig(unit.activeCommandBias || 0) : null;
      const actionCdMultiplier = config && Number.isFinite(config.actionCd) && config.actionCd > 0 ? config.actionCd : 1;
      return Math.max(0, 1 + getUnitActionSpeedBonus(unit)) / actionCdMultiplier;
    }

    function getUnitActionSpeedBonus(unit) {
      const equipment = typeof getEquipmentStatBonusSum === "function" ? getEquipmentStatBonusSum(unit, "actionSpeed") : 0;
      const passive = typeof hasPassive === "function" && hasPassive(unit, "number_of_times") ? 0.5 : 0;
      return equipment + passive;
    }

    function getUnitMoveSpeed(unit) {
      if (typeof getEffectiveMoveSpeed === "function") {
        return getEffectiveMoveSpeed(unit);
      }
      return unit && Number.isFinite(unit.speed) ? unit.speed : 0;
    }

    function getCommandBiasConfig(value) {
      const normalized = Math.max(-2, Math.min(2, Math.round(Number(value) || 0)));
      if (Array.isArray(COMMAND_BIAS_CONFIGS)) {
        const found = COMMAND_BIAS_CONFIGS.find((config) => config && config.value === normalized);
        if (found) {
          return found;
        }
      }
      return { value: 0, actionCd: 1 };
    }

    function getUltimateChargeRate(unit) {
      if (typeof getBattleUltimateChargeRate === "function") {
        return getBattleUltimateChargeRate(unit);
      }
      const bonus = typeof getEquipmentStatBonusSum === "function" ? getEquipmentStatBonusSum(unit, "ultimateChargeRate") : 0;
      return Math.max(0, (unit && Number.isFinite(unit.ultimateChargeRate) ? unit.ultimateChargeRate : 1) + bonus);
    }

    function getUnitOutgoingDamageMultiplier(unit, includeBattleState = true) {
      let bonus = includeBattleState
        ? multiplierToBonus(callNumber(getMoodOutgoingDamageMultiplier, unit, 1))
          + multiplierToBonus(callNumber(getCommandOutgoingDamageMultiplier, unit, 1))
        : 0;
      if (hasPassiveSafe(unit, "painless")) {
        bonus += multiplierToBonus(callNumber(getRihasPassiveDamageMultiplier, unit, 1));
      }
      if (typeof getDamageBoost === "function") {
        bonus += getDamageBoost(unit);
      }
      return Math.max(0, 1 + bonus);
    }

    function getUnitIncomingDamageMultiplier(unit, includeBattleState = true) {
      let bonus = includeBattleState
        ? multiplierToBonus(callNumber(getMoodIncomingDamageMultiplier, unit, 1))
          + multiplierToBonus(callNumber(getCommandIncomingDamageMultiplier, unit, 1))
        : 0;
      if (hasPassiveSafe(unit, "painless")) {
        bonus += multiplierToBonus(callNumber(getRihasPassiveIncomingMultiplier, unit, 1));
      }
      if (typeof getDamageResistance === "function") {
        bonus -= getDamageResistance(unit);
      }
      return Math.max(0, 1 + bonus);
    }

    function getPhysicalOutgoingDamageRate(unit) {
      const boost = typeof getPhysicalDamageBoost === "function" ? getPhysicalDamageBoost(unit) : 0;
      return Math.max(0, 1 + boost);
    }

    function getPhysicalIncomingDamageRate(unit) {
      const resistance = typeof getPhysicalDamageResistance === "function" ? getPhysicalDamageResistance(unit) : 0;
      return Math.max(0, 1 - resistance);
    }

    function getMagicOutgoingDamageRate(unit) {
      const boost = typeof getMagicDamageBoost === "function" ? getMagicDamageBoost(unit) : 0;
      return Math.max(0, 1 + boost);
    }

    function getMagicIncomingDamageRate(unit) {
      const resistance = typeof getMagicDamageResistance === "function" ? getMagicDamageResistance(unit) : 0;
      return Math.max(0, 1 - resistance);
    }

    function getUnitCritChance(unit) {
      return typeof getEffectiveCritChance === "function" ? getEffectiveCritChance(unit) : 0;
    }

    function getUnitCritDamageRate(unit) {
      return typeof getEffectiveCritDamageRate === "function" ? getEffectiveCritDamageRate(unit) : 0;
    }

    function getUnitCastSpeed(unit) {
      return typeof getCastSpeed === "function" ? getCastSpeed(unit) : 1 - getUnitCastTimeMultiplier(unit);
    }

    function getUnitCastTimeMultiplier(unit) {
      if (hasPassiveSafe(unit, "warmup") && typeof getSushiaCastTime === "function") {
        return getSushiaCastTime(1, unit);
      }
      return typeof getMoodCastTimeMultiplier === "function" ? getMoodCastTimeMultiplier(unit) : 1;
    }

    function getMoodCooldownMultiplierSafe(unit) {
      return typeof getMoodCooldownMultiplier === "function" ? getMoodCooldownMultiplier(unit) : 1;
    }

    function hasPassiveSafe(unit, key) {
      return typeof hasPassive === "function" ? hasPassive(unit, key) : false;
    }

    function callNumber(fn, unit, fallback = 0) {
      if (typeof fn !== "function") {
        return fallback;
      }
      const value = fn(unit);
      return Number.isFinite(value) ? value : fallback;
    }

    function multiplierToBonus(multiplier) {
      return (Number.isFinite(multiplier) ? multiplier : 1) - 1;
    }

    function formatNumber(value) {
      return `${Math.floor(Number.isFinite(value) ? value : 0)}`;
    }

    function formatPercent(value) {
      return `${Math.round((Number.isFinite(value) ? value : 0) * 100)}%`;
    }

    function formatSignedPercent(value) {
      const rounded = Math.round((Number.isFinite(value) ? value : 0) * 100);
      return `${rounded > 0 ? "+" : ""}${rounded}%`;
    }

    return {
      getDetailedStats,
    };
  };
})();
