(() => {
  "use strict";

  window.createHealerLoadoutSystem = function createHealerLoadoutSystem(context) {
    const {
      SKILL_DATA,
      PASSIVE_DATA,
      LOADOUT_CONFIG,
      EQUIPMENT_DATA,
      CHARACTER_DEFS,
      game,
      resolveEquipmentItem,
      getEquipmentUpgradeLevel,
    } = context;

    const activeSlotLimit = Math.max(1, LOADOUT_CONFIG && LOADOUT_CONFIG.activeSlots || 5);
    const SKILL_MAX_LEVEL = 5;
    const CRYSTAL_GOLD_FALLBACK = 300;

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

    function isNormalAttackSkill(owner, key, skill = null) {
      const data = skill || getSkill(owner, key);
      return Boolean(data && (key === "attack" || data.category === "通常攻撃"));
    }

    function getPassive(owner, key) {
      const ownerKey = getKnownOwner(owner);
      return PASSIVE_DATA[ownerKey] && PASSIVE_DATA[ownerKey][key] ? PASSIVE_DATA[ownerKey][key] : null;
    }

    function getPassiveKeys(owner) {
      const ownerKey = getKnownOwner(owner);
      return Object.keys(PASSIVE_DATA[ownerKey] || {});
    }

    function getSkillIdentity(owner, key, skill = null) {
      const ownerKey = getKnownOwner(owner);
      const sourceOwner = skill && skill.sourceOwner ? skill.sourceOwner : ownerKey;
      const sourceKey = skill && skill.sourceKey ? skill.sourceKey : key;
      return `${sourceOwner}:${sourceKey}`;
    }

    function getPassiveIdentity(owner, key, passive = null) {
      const ownerKey = getKnownOwner(owner);
      const sourceOwner = passive && passive.sourceOwner ? passive.sourceOwner : ownerKey;
      const sourceKey = passive && passive.sourceKey ? passive.sourceKey : key;
      return `passive:${sourceOwner}:${sourceKey}`;
    }

    function getSkillProgressStore() {
      if (!game || typeof game !== "object") {
        return {};
      }
      if (!game.skillProgressById || typeof game.skillProgressById !== "object") {
        game.skillProgressById = {};
      }
      return game.skillProgressById;
    }

    function normalizeSkillProgress(entry) {
      if (!entry || typeof entry !== "object") {
        return { owned: false, level: 0 };
      }
      return {
        owned: Boolean(entry.owned),
        level: Math.max(0, Math.min(SKILL_MAX_LEVEL, Math.floor(Number.isFinite(entry.level) ? entry.level : 0))),
      };
    }

    function getInitialOwnedSkillIdentities() {
      const owned = new Set();
      const finaldDefaults = LOADOUT_CONFIG.defaults && LOADOUT_CONFIG.defaults.finald || {};
      for (const key of Array.isArray(finaldDefaults.active) ? finaldDefaults.active : []) {
        if (!key || key === "attack") {
          continue;
        }
        const skill = getSkill("finald", key);
        if (skill && !isUltimateKey("finald", key)) {
          owned.add(getSkillIdentity("finald", key, skill));
        }
      }
      return owned;
    }
    function isAlwaysOwnedSkill(owner, key, skill = null) {
      const ownerKey = getKnownOwner(owner);
      const data = skill || getSkill(ownerKey, key);
      if (ownerKey === "enemy") {
        return true;
      }
      return Boolean(data && (key === "attack" || key === "ult" || data.category === "通常攻撃" || data.category === "必殺技"));
    }

    function isInitiallyOwnedSkill(owner, key, skill = null) {
      const data = skill || getSkill(owner, key);
      if (!data) {
        return false;
      }
      return getInitialOwnedSkillIdentities().has(getSkillIdentity(owner, key, data));
    }

    function isSkillOwned(owner, key) {
      const ownerKey = getKnownOwner(owner);
      const skill = getSkill(ownerKey, key);
      if (!skill) {
        return false;
      }
      if (isAlwaysOwnedSkill(ownerKey, key, skill) || isInitiallyOwnedSkill(ownerKey, key, skill)) {
        return true;
      }
      const store = getSkillProgressStore();
      const progress = normalizeSkillProgress(store[getSkillIdentity(ownerKey, key, skill)]);
      return progress.owned;
    }

    function isAlwaysOwnedPassive(owner, key, passive = null) {
      const ownerKey = getKnownOwner(owner);
      const data = passive || getPassive(ownerKey, key);
      if (ownerKey === "enemy") {
        return true;
      }
      const defaults = LOADOUT_CONFIG.defaults && LOADOUT_CONFIG.defaults[ownerKey] || {};
      return Boolean(data && (data.alwaysOwned || defaults.passive === key));
    }

    function isPassiveOwned(owner, key) {
      const ownerKey = getKnownOwner(owner);
      const passive = getPassive(ownerKey, key);
      if (!passive) {
        return false;
      }
      if (isAlwaysOwnedPassive(ownerKey, key, passive)) {
        return true;
      }
      const store = getSkillProgressStore();
      const progress = normalizeSkillProgress(store[getPassiveIdentity(ownerKey, key, passive)]);
      return progress.owned;
    }

    function getSkillLevel(owner, key) {
      const ownerKey = getKnownOwner(owner);
      const skill = getSkill(ownerKey, key);
      if (!skill || !isSkillOwned(ownerKey, key)) {
        return 0;
      }
      if (isNormalAttackSkill(ownerKey, key, skill)) {
        return getNormalAttackUpgradeLevel(ownerKey);
      }
      const store = getSkillProgressStore();
      return normalizeSkillProgress(store[getSkillIdentity(ownerKey, key, skill)]).level;
    }

    function getNormalAttackUpgradeLevel(owner) {
      const weaponId = getEquippedWeaponId(owner);
      if (!weaponId) {
        return 0;
      }
      const level = typeof getEquipmentUpgradeLevel === "function"
        ? getEquipmentUpgradeLevel(weaponId)
        : getStoredEquipmentUpgradeLevel(weaponId);
      return Math.max(0, Math.min(SKILL_MAX_LEVEL, Math.floor(Number(level) || 0)));
    }

    function getEquippedWeaponId(owner) {
      const storedEquipment = game && game.partyEquipmentById && game.partyEquipmentById[owner];
      if (storedEquipment && storedEquipment.weapon) {
        return storedEquipment.weapon;
      }
      const def = getCharacterDef(owner);
      return def && def.equipment && def.equipment.weapon || null;
    }

    function getCharacterDef(owner) {
      if (!CHARACTER_DEFS) {
        return null;
      }
      if (owner === "finald") {
        return CHARACTER_DEFS.player || null;
      }
      const allies = Array.isArray(CHARACTER_DEFS.allies) ? CHARACTER_DEFS.allies : [];
      return allies.find((member) => member && member.id === owner) || null;
    }

    function getStoredEquipmentUpgradeLevel(itemId) {
      const store = game && game.equipmentUpgradeById && typeof game.equipmentUpgradeById === "object"
        ? game.equipmentUpgradeById
        : {};
      return Math.max(0, Math.floor(Number.isFinite(store[itemId]) ? store[itemId] : 0));
    }

    function setSkillProgress(owner, key, updates) {
      const ownerKey = getKnownOwner(owner);
      const skill = getSkill(ownerKey, key);
      if (!skill) {
        return null;
      }
      const identity = getSkillIdentity(ownerKey, key, skill);
      const store = getSkillProgressStore();
      const current = normalizeSkillProgress(store[identity]);
      const next = {
        owned: Object.prototype.hasOwnProperty.call(updates || {}, "owned") ? Boolean(updates.owned) : current.owned,
        level: Object.prototype.hasOwnProperty.call(updates || {}, "level")
          ? Math.max(0, Math.min(SKILL_MAX_LEVEL, Math.floor(Number(updates.level) || 0)))
          : current.level,
      };
      if (isAlwaysOwnedSkill(ownerKey, key, skill) || isInitiallyOwnedSkill(ownerKey, key, skill)) {
        next.owned = true;
      }
      store[identity] = next;
      return { identity, owner: ownerKey, key, skill, ...next };
    }

    function setPassiveProgress(owner, key, updates) {
      const ownerKey = getKnownOwner(owner);
      const passive = getPassive(ownerKey, key);
      if (!passive) {
        return null;
      }
      const identity = getPassiveIdentity(ownerKey, key, passive);
      const store = getSkillProgressStore();
      const current = normalizeSkillProgress(store[identity]);
      const next = {
        owned: Object.prototype.hasOwnProperty.call(updates || {}, "owned") ? Boolean(updates.owned) : current.owned,
        level: Object.prototype.hasOwnProperty.call(updates || {}, "level")
          ? Math.max(0, Math.min(SKILL_MAX_LEVEL, Math.floor(Number(updates.level) || 0)))
          : current.level,
      };
      if (isAlwaysOwnedPassive(ownerKey, key, passive)) {
        next.owned = true;
      }
      store[identity] = next;
      return { identity, owner: ownerKey, key, skill: passive, ...next };
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
      if (defaults.passive && getPassive(ownerKey, defaults.passive) && isPassiveOwned(ownerKey, defaults.passive)) {
        return defaults.passive;
      }
      const keys = getPassiveKeys(ownerKey);
      return keys.find((key) => isPassiveOwned(ownerKey, key)) || null;
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

    function shouldEnforceActiveSlotLimit(unitOrOwner) {
      return !(unitOrOwner && typeof unitOrOwner === "object" && unitOrOwner.team === "enemy");
    }

    function cleanActive(owner, keys, enforceLimit) {
      const ownerKey = getKnownOwner(owner);
      const limit = getActiveSlotLimit(ownerKey);
      const result = [];
      const seen = new Set();
      const rawKeys = Array.isArray(keys) ? keys : [];
      for (const key of rawKeys) {
        const skill = getSkill(ownerKey, key);
        if (!key || isUltimateKey(ownerKey, key) || seen.has(key) || !skill || !isSkillOwned(ownerKey, key)) {
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
      const passive = requestedPassive && getPassive(ownerKey, requestedPassive) && isPassiveOwned(ownerKey, requestedPassive)
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
      unit.loadout = normalizeLoadout(getOwnerKey(unit), loadout, { enforceLimit: shouldEnforceActiveSlotLimit(unit) });
      return unit.loadout;
    }

    function ensureUnitLoadout(unit) {
      if (!unit) {
        return { passive: null, active: [] };
      }
      const enforceLimit = shouldEnforceActiveSlotLimit(unit);
      unit.loadout = unit.loadout
        ? normalizeLoadout(getOwnerKey(unit), unit.loadout, { enforceLimit })
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
        .map((key) => ({ key, skill: key === "attack" ? getNormalAttackSkill(unit, ownerKey) : getSkill(ownerKey, key) }))
        .filter((entry) => entry.skill);
    }

    function getNormalAttackSkill(unitOrOwner, owner = getKnownOwner(getOwnerKey(unitOrOwner))) {
      const weapon = getEquippedWeapon(unitOrOwner, owner);
      const skillId = weapon && weapon.normalAttackSkillId;
      if (skillId) {
        const found = findNormalAttackSkillById(skillId);
        if (found) {
          return found.owner === owner && found.key === "attack"
            ? found.skill
            : { ...found.skill, key: "attack", owner, sourceOwner: found.owner, sourceKey: found.key };
        }
      }
      return getSkill(owner, "attack");
    }

    function findNormalAttackSkillById(skillId) {
      for (const [owner, skills] of Object.entries(SKILL_DATA || {})) {
        for (const [key, skill] of Object.entries(skills || {})) {
          if (!skill || skill.category !== "通常攻撃") {
            continue;
          }
          if (skill.id === skillId || key === skillId) {
            return { owner, key, skill };
          }
        }
      }
      return null;
    }

    function getEquippedWeapon(unitOrOwner, owner) {
      const ref = getEquippedWeaponIdFromUnit(unitOrOwner) || getEquippedWeaponId(owner);
      if (!ref) {
        return null;
      }
      if (typeof resolveEquipmentItem === "function") {
        return resolveEquipmentItem(ref);
      }
      const baseId = String(ref).split("#")[0];
      return EQUIPMENT_DATA && EQUIPMENT_DATA.items ? EQUIPMENT_DATA.items[baseId] || null : null;
    }

    function getEquippedWeaponIdFromUnit(unitOrOwner) {
      if (!unitOrOwner || typeof unitOrOwner === "string") {
        return null;
      }
      return unitOrOwner.equipment && unitOrOwner.equipment.weapon || null;
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
      return Boolean(passive && !passive.disabled && isPassiveOwned(getOwnerKey(unit), key) && canUsePassiveWithEquipment(unit, passive));
    }

    function canUsePassiveWithEquipment(unit, passive) {
      if (!passive || !unit || typeof unit !== "object") {
        return true;
      }
      const weapon = getEquippedWeapon(unit, getKnownOwner(getOwnerKey(unit)));
      if (Array.isArray(passive.requiredWeaponItemIds) && passive.requiredWeaponItemIds.length) {
        return Boolean(weapon && passive.requiredWeaponItemIds.includes(weapon.id));
      }
      if (Array.isArray(passive.requiredWeapons) && passive.requiredWeapons.length) {
        return Boolean(weapon && passive.requiredWeapons.includes(weapon.weaponType));
      }
      return true;
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

    function acquireOrUpgradeSkill(rank = "D") {
      const candidates = getCrystalSkillCandidates(rank);
      const outcomes = [];
      for (const entry of candidates) {
        if (!isCrystalEntryOwned(entry)) {
          outcomes.push({ type: "acquire", entry });
        } else if (entry.skill && entry.skill.upgradeDescription && getCrystalEntryLevel(entry) < SKILL_MAX_LEVEL) {
          outcomes.push({ type: "upgrade", entry });
        }
      }
      if (!outcomes.length) {
        return { type: "gold", rank, amount: CRYSTAL_GOLD_FALLBACK };
      }
      const picked = pickRandom(outcomes);
      if (picked.type === "acquire") {
        const progress = setCrystalEntryProgress(picked.entry, { owned: true, level: 0 });
        return buildSkillProgressResult("acquired", picked.entry, progress ? progress.level : 0);
      }
      const previousLevel = getCrystalEntryLevel(picked.entry);
      const nextLevel = Math.min(SKILL_MAX_LEVEL, previousLevel + 1);
      setCrystalEntryProgress(picked.entry, { owned: true, level: nextLevel });
      return buildSkillProgressResult("upgraded", picked.entry, nextLevel, previousLevel);
    }

    function getCrystalSkillCandidates(rank) {
      const result = [];
      const seen = new Set();
      for (const [owner, skills] of Object.entries(SKILL_DATA || {})) {
        if (owner === "enemy") {
          continue;
        }
        for (const [key, skill] of Object.entries(skills || {})) {
          if (!skill || skill.disabled || skill.crystalExcluded || skill.rank !== rank || skill.category === "通常攻撃") {
            continue;
          }
          const sourceOwner = skill.sourceOwner || owner;
          const sourceKey = skill.sourceKey || key;
          const canonicalSkill = SKILL_DATA[sourceOwner] && SKILL_DATA[sourceOwner][sourceKey] || skill;
          const identity = getSkillIdentity(owner, key, skill);
          if (seen.has(identity)) {
            continue;
          }
          const entry = { identity, kind: "skill", owner: sourceOwner, key: sourceKey, skill: canonicalSkill };
          if (isCrystalEntryOwned(entry) && !canonicalSkill.upgradeDescription) {
            continue;
          }
          seen.add(identity);
          result.push(entry);
        }
      }
      for (const [owner, passives] of Object.entries(PASSIVE_DATA || {})) {
        if (owner === "enemy") {
          continue;
        }
        for (const [key, passive] of Object.entries(passives || {})) {
          if (!passive || passive.disabled || passive.crystalExcluded || passive.rank !== rank) {
            continue;
          }
          const sourceOwner = passive.sourceOwner || owner;
          const sourceKey = passive.sourceKey || key;
          const canonicalPassive = PASSIVE_DATA[sourceOwner] && PASSIVE_DATA[sourceOwner][sourceKey] || passive;
          const identity = getPassiveIdentity(owner, key, passive);
          if (seen.has(identity)) {
            continue;
          }
          const entry = { identity, kind: "passive", owner: sourceOwner, key: sourceKey, skill: canonicalPassive };
          if (isCrystalEntryOwned(entry) && !canonicalPassive.upgradeDescription) {
            continue;
          }
          seen.add(identity);
          result.push(entry);
        }
      }
      return result;
    }

    function isCrystalEntryOwned(entry) {
      if (!entry) {
        return false;
      }
      return entry.kind === "passive"
        ? isPassiveOwned(entry.owner, entry.key)
        : isSkillOwned(entry.owner, entry.key);
    }

    function getCrystalEntryLevel(entry) {
      if (!entry) {
        return 0;
      }
      if (entry.kind === "passive") {
        const store = getSkillProgressStore();
        return normalizeSkillProgress(store[entry.identity]).level;
      }
      return getSkillLevel(entry.owner, entry.key);
    }

    function setCrystalEntryProgress(entry, updates) {
      if (!entry) {
        return null;
      }
      return entry.kind === "passive"
        ? setPassiveProgress(entry.owner, entry.key, updates)
        : setSkillProgress(entry.owner, entry.key, updates);
    }

    function buildSkillProgressResult(type, entry, level, previousLevel = null) {
      const normalizedLevel = Math.max(0, Math.min(SKILL_MAX_LEVEL, Math.floor(Number(level) || 0)));
      const normalizedPrevious = Number.isFinite(previousLevel)
        ? Math.max(0, Math.min(SKILL_MAX_LEVEL, Math.floor(previousLevel)))
        : null;
      return {
        type,
        identity: entry.identity,
        owner: entry.owner,
        key: entry.key,
        skillId: entry.skill && entry.skill.id || entry.key,
        skillName: entry.skill && entry.skill.name || entry.key,
        rank: entry.skill && entry.skill.rank || "D",
        level: normalizedLevel,
        previousLevel: normalizedPrevious,
        maxLevel: SKILL_MAX_LEVEL,
        category: entry.skill && entry.skill.category || (entry.kind === "passive" ? "パッシブ" : ""),
        skillType: entry.skill && entry.skill.skillType || "",
        simpleDescription: entry.skill && entry.skill.simpleDescription || "",
        description: entry.skill && entry.skill.description || "",
        statusIds: entry.skill && entry.skill.statusIds || [],
        upgradeSimpleDescription: entry.skill && entry.skill.upgradeSimpleDescription || "",
        upgradeDescription: entry.skill && entry.skill.upgradeDescription || "",
      };
    }

    function pickRandom(entries) {
      return entries[Math.floor(Math.random() * entries.length)];
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
      isSkillOwned,
      isPassiveOwned,
      getSkillLevel,
      acquireOrUpgradeSkill,
    };
  };
})();
