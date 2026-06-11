(() => {
  "use strict";

  window.createHealerLoadoutSystem = function createHealerLoadoutSystem(context) {
    const {
      SKILL_DATA,
      PASSIVE_DATA,
      LOADOUT_CONFIG,
    } = context;

    const activeSlotLimit = Math.max(1, LOADOUT_CONFIG && LOADOUT_CONFIG.activeSlots || 5);

    function getOwnerKey(unitOrOwner) {
      if (!unitOrOwner) {
        return "";
      }
      if (typeof unitOrOwner === "string") {
        return unitOrOwner;
      }
      return unitOrOwner.skillOwner || unitOrOwner.id || "";
    }

    function getKnownOwner(owner) {
      return (SKILL_DATA[owner] || PASSIVE_DATA[owner]) ? owner : "enemy";
    }

    function getSkill(owner, key) {
      const ownerKey = getKnownOwner(owner);
      return SKILL_DATA[ownerKey] && SKILL_DATA[ownerKey][key] ? SKILL_DATA[ownerKey][key] : null;
    }

    function getPassive(owner, key) {
      const ownerKey = getKnownOwner(owner);
      return PASSIVE_DATA[ownerKey] && PASSIVE_DATA[ownerKey][key] ? PASSIVE_DATA[ownerKey][key] : null;
    }

    function getPassiveKeys(owner) {
      const ownerKey = getKnownOwner(owner);
      return Object.keys(PASSIVE_DATA[ownerKey] || {});
    }

    function getRequiredPassive(owner) {
      const ownerKey = getKnownOwner(owner);
      const defaults = LOADOUT_CONFIG.defaults && LOADOUT_CONFIG.defaults[ownerKey] || {};
      if (defaults.passive && getPassive(ownerKey, defaults.passive)) {
        return defaults.passive;
      }
      const keys = getPassiveKeys(ownerKey);
      return keys.length ? keys[0] : null;
    }

    function getActiveSlotLimit(unitOrOwner) {
      const ownerKey = getKnownOwner(getOwnerKey(unitOrOwner));
      const ownerLimits = LOADOUT_CONFIG.activeSlotsByOwner || {};
      const limit = Number.isFinite(ownerLimits[ownerKey]) ? ownerLimits[ownerKey] : activeSlotLimit;
      return Math.max(1, Math.floor(limit));
    }

    function cleanActive(owner, keys, enforceLimit) {
      const ownerKey = getKnownOwner(owner);
      const limit = getActiveSlotLimit(ownerKey);
      const result = [];
      const seen = new Set();
      const rawKeys = Array.isArray(keys) ? keys : [];
      for (const key of rawKeys) {
        if (!key || key === "ult" || seen.has(key) || !getSkill(ownerKey, key)) {
          continue;
        }
        seen.add(key);
        result.push(key);
        if (enforceLimit && result.length >= limit) {
          break;
        }
      }
      return result;
    }

    function normalizeLoadout(owner, loadout = {}, options = {}) {
      loadout = loadout || {};
      const ownerKey = getKnownOwner(owner);
      const defaults = LOADOUT_CONFIG.defaults && LOADOUT_CONFIG.defaults[ownerKey] || {};
      const requestedPassive = Object.prototype.hasOwnProperty.call(loadout, "passive")
        ? loadout.passive
        : defaults.passive;
      const passive = requestedPassive && getPassive(ownerKey, requestedPassive)
        ? requestedPassive
        : getRequiredPassive(ownerKey);
      const requestedActive = Array.isArray(loadout.active) ? loadout.active : defaults.active;
      return {
        passive,
        active: cleanActive(ownerKey, requestedActive, options.enforceLimit !== false),
      };
    }

    function getDefaultLoadout(unitOrOwner) {
      const ownerKey = getKnownOwner(getOwnerKey(unitOrOwner));
      return normalizeLoadout(ownerKey, LOADOUT_CONFIG.defaults && LOADOUT_CONFIG.defaults[ownerKey] || {}, { enforceLimit: true });
    }

    function setUnitLoadout(unit, loadout) {
      if (!unit) {
        return null;
      }
      unit.loadout = normalizeLoadout(getOwnerKey(unit), loadout, { enforceLimit: true });
      return unit.loadout;
    }

    function ensureUnitLoadout(unit) {
      if (!unit) {
        return { passive: null, active: [] };
      }
      unit.loadout = unit.loadout
        ? normalizeLoadout(getOwnerKey(unit), unit.loadout, { enforceLimit: true })
        : getDefaultLoadout(unit);
      return unit.loadout;
    }

    function getEquippedActiveSkillKeys(unit) {
      return ensureUnitLoadout(unit).active.slice();
    }

    function isActiveSkillEquipped(unit, key) {
      if (key === "ult") {
        return true;
      }
      return getEquippedActiveSkillKeys(unit).includes(key);
    }

    function getEquippedActiveSkills(unit) {
      const ownerKey = getKnownOwner(getOwnerKey(unit));
      return getEquippedActiveSkillKeys(unit)
        .map((key) => ({ key, skill: getSkill(ownerKey, key) }))
        .filter((entry) => entry.skill);
    }

    function hasPassive(unit, key) {
      return Boolean(unit && ensureUnitLoadout(unit).passive === key);
    }

    function getEquippedPassive(unit) {
      const loadout = ensureUnitLoadout(unit);
      if (!loadout.passive) {
        return null;
      }
      return getPassive(getOwnerKey(unit), loadout.passive);
    }

    return {
      activeSlotLimit,
      getActiveSlotLimit,
      getDefaultLoadout,
      normalizeLoadout,
      setUnitLoadout,
      ensureUnitLoadout,
      getRequiredPassive,
      getEquippedActiveSkillKeys,
      isActiveSkillEquipped,
      getEquippedActiveSkills,
      hasPassive,
      getEquippedPassive,
    };
  };
})();
