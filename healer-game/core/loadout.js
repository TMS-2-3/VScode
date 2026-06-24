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

    function isUltimateKey(owner, key) {
      const skill = getSkill(owner, key);
      return Boolean(skill && (key === "ult" || skill.category === "必殺技"));
    }

    function getUltimateKeys(owner) {
      const ownerKey = getKnownOwner(owner);
      return Object.keys(SKILL_DATA[ownerKey] || {}).filter((key) => isUltimateKey(ownerKey, key));
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

    function getRequiredUltimate(owner) {
      const ownerKey = getKnownOwner(owner);
      const defaults = LOADOUT_CONFIG.defaults && LOADOUT_CONFIG.defaults[ownerKey] || {};
      if (defaults.ultimate && isUltimateKey(ownerKey, defaults.ultimate)) {
        return defaults.ultimate;
      }
      if (isUltimateKey(ownerKey, "ult")) {
        return "ult";
      }
      const keys = getUltimateKeys(ownerKey);
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
        if (!key || isUltimateKey(ownerKey, key) || seen.has(key) || !getSkill(ownerKey, key)) {
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
      const requestedUltimate = Object.prototype.hasOwnProperty.call(loadout, "ultimate")
        ? loadout.ultimate
        : defaults.ultimate;
      const ultimate = requestedUltimate && isUltimateKey(ownerKey, requestedUltimate)
        ? requestedUltimate
        : getRequiredUltimate(ownerKey);
      const requestedActive = Array.isArray(loadout.active) ? loadout.active : defaults.active;
      return {
        passive,
        ultimate,
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
      if (isUltimateKey(getOwnerKey(unit), key)) {
        return getEquippedUltimateSkillKey(unit) === key;
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
      if (!unit) {
        return false;
      }
      const loadout = ensureUnitLoadout(unit);
      if (loadout.passive !== key) {
        return false;
      }
      const passive = getPassive(getOwnerKey(unit), key);
      return Boolean(passive && !passive.disabled);
    }

    function getEquippedPassive(unit) {
      const loadout = ensureUnitLoadout(unit);
      if (!loadout.passive) {
        return null;
      }
      return getPassive(getOwnerKey(unit), loadout.passive);
    }

    function getEquippedUltimateSkillKey(unit) {
      return ensureUnitLoadout(unit).ultimate;
    }

    function getEquippedUltimateSkill(unit) {
      const key = getEquippedUltimateSkillKey(unit);
      return key ? getSkill(getOwnerKey(unit), key) : null;
    }

    return {
      activeSlotLimit,
      getActiveSlotLimit,
      getDefaultLoadout,
      normalizeLoadout,
      setUnitLoadout,
      ensureUnitLoadout,
      getRequiredPassive,
      getRequiredUltimate,
      getEquippedActiveSkillKeys,
      isActiveSkillEquipped,
      getEquippedActiveSkills,
      hasPassive,
      getEquippedPassive,
      getEquippedUltimateSkillKey,
      getEquippedUltimateSkill,
    };
  };
})();
