(() => {
  "use strict";

  window.createHealerEquipmentSystem = function createHealerEquipmentSystem(context) {
    const { EQUIPMENT_DATA, game } = context;
    const slots = EQUIPMENT_DATA.slots || [];
    const slotKeys = slots.map((slot) => slot.key);
    const slotByKey = Object.fromEntries(slots.map((slot) => [slot.key, slot]));
    const defaultElement = EQUIPMENT_DATA.defaultElement || "none";
    const upgradeMultipliers = [1, 1.1, 1.2, 1.3, 1.4, 1.5];
    const armorRandomTotals = { D: 0.3, C: 0.6, B: 0.9, A: 1.2, S: 1.5 };
    const armorRandomNegativeMaxCounts = { D: 0, C: 0, B: 1, A: 1, S: 2 };
    const accessoryRandomCounts = { D: 1, C: 2, B: 3, A: 4, S: 5 };
    const armorRandomStatKeys = ["maxHp", "maxMp", "attack", "magic", "defense", "magicDefense"];
    const accessoryRandomOptions = [
      { label: "会心率+10%", statBonuses: { critChance: 0.1 } },
      { label: "会心ダメージ+20%", statBonuses: { critDamage: 0.2 } },
      { label: "ガード率+10%", statBonuses: { guardChance: 0.1 } },
      { label: "ガード軽減率+20%", statBonuses: { guardDamageReduction: 0.2 } },
      { label: "与ダメージ率+5%", statBonuses: { damageBoost: 0.05 } },
      { label: "被ダメージ率-5%", statBonuses: { damageResistance: 0.05 } },
      { label: "物理与ダメージ率+10%", statBonuses: { physicalDamageBoost: 0.1 } },
      { label: "物理被ダメージ率-10%", statBonuses: { physicalDamageResistance: 0.1 } },
      { label: "魔法与ダメージ率+10%", statBonuses: { magicDamageBoost: 0.1 } },
      { label: "魔法被ダメージ率-10%", statBonuses: { magicDamageResistance: 0.1 } },
      { label: "HP再生率+2%", statBonuses: { hpRegenRate: 0.02 } },
      { label: "MP再生率+3%", statBonuses: { mpRegenRate: 0.03 } },
      { label: "詠唱速度+10%", statBonuses: { castSpeed: 0.1 } },
      { label: "クールタイム-10%", statBonuses: { cooldownReduction: 0.1 } },
      { label: "行動速度+5%", statBonuses: { actionSpeed: 0.05 } },
      { label: "ゲージ上昇率+10%", statBonuses: { ultimateChargeRate: 0.1 } },
      { label: "移動速度+10%", statBonuses: { moveSpeed: 0.1 } },
    ];

    function ensureEquipmentState() {
      if (!game) {
        return;
      }
      ensureEquipmentStores();
      migrateLegacyInventoryCounts();
      migrateLegacyPartyEquipmentRefs();
      syncEquipmentInventoryCounts();
      migrateRandomStatUpgradeTargets();
    }

    function ensureEquipmentStores() {
      if (!game.equipmentInstancesById || typeof game.equipmentInstancesById !== "object") {
        game.equipmentInstancesById = {};
      }
      if (!Number.isFinite(game.nextEquipmentInstanceSeq)) {
        game.nextEquipmentInstanceSeq = 1;
      }
      if (!game.equipmentInventoryById || typeof game.equipmentInventoryById !== "object") {
        game.equipmentInventoryById = {};
      }
      if (!game.equipmentUpgradeById || typeof game.equipmentUpgradeById !== "object") {
        game.equipmentUpgradeById = {};
      }
      if (!game.equipmentRandomStatsById || typeof game.equipmentRandomStatsById !== "object") {
        game.equipmentRandomStatsById = {};
      }
      if (!game.equipmentRandomSeedsById || typeof game.equipmentRandomSeedsById !== "object") {
        game.equipmentRandomSeedsById = {};
      }
      if (!game.equipmentUpgradeRollsById || typeof game.equipmentUpgradeRollsById !== "object") {
        game.equipmentUpgradeRollsById = {};
      }
    }

    function migrateLegacyInventoryCounts() {
      const counts = game.equipmentInventoryById && typeof game.equipmentInventoryById === "object"
        ? { ...game.equipmentInventoryById }
        : {};
      for (const [itemId, countValue] of Object.entries(counts)) {
        const item = getBaseItem(itemId);
        const count = Math.max(0, Math.floor(Number.isFinite(countValue) ? countValue : 0));
        if (!item || isDefaultItem(item) || count <= 0) {
          continue;
        }
        const existing = getEquipmentInstanceIdsByItemId(item.id).length;
        const missing = Math.max(0, count - existing);
        const legacyLevel = getStoredBaseUpgradeLevel(item.id);
        const legacySeed = getStoredBaseRandomSeed(item.id);
        for (let i = 0; i < missing; i += 1) {
          createEquipmentInstance(item.id, {
            skipEnsure: true,
            upgradeLevel: legacyLevel,
            randomSeed: i === 0 ? legacySeed : null,
          });
        }
      }
      game.equipmentInventoryMigratedToInstances = true;
    }

    function migrateLegacyPartyEquipmentRefs() {
      if (!game.partyEquipmentById || typeof game.partyEquipmentById !== "object") {
        return;
      }
      const used = new Set();
      for (const equipment of Object.values(game.partyEquipmentById)) {
        if (!equipment || typeof equipment !== "object") {
          continue;
        }
        for (const ref of Object.values(equipment)) {
          if (getEquipmentInstanceRaw(ref)) {
            used.add(ref);
          }
        }
      }
      for (const equipment of Object.values(game.partyEquipmentById)) {
        if (!equipment || typeof equipment !== "object") {
          continue;
        }
        for (const [slotKey, ref] of Object.entries(equipment)) {
          if (!ref || getEquipmentInstanceRaw(ref)) {
            continue;
          }
          const item = getBaseItem(ref);
          if (!item || item.slot !== slotKey || isDefaultItem(item)) {
            continue;
          }
          let instanceId = getEquipmentInstanceIdsByItemId(item.id).find((candidate) => !used.has(candidate));
          if (!instanceId) {
            instanceId = createEquipmentInstance(item.id, {
              skipEnsure: true,
              upgradeLevel: getStoredBaseUpgradeLevel(item.id),
              randomSeed: getStoredBaseRandomSeed(item.id),
            });
          }
          if (instanceId) {
            equipment[slotKey] = instanceId;
            used.add(instanceId);
          }
        }
      }
    }

    function syncEquipmentInventoryCounts() {
      if (!game || !game.equipmentInventoryById || typeof game.equipmentInventoryById !== "object") {
        return;
      }
      const nextCounts = {};
      const instances = game.equipmentInstancesById && typeof game.equipmentInstancesById === "object"
        ? game.equipmentInstancesById
        : {};
      for (const instance of Object.values(instances)) {
        if (!instance || !instance.itemId || !getBaseItem(instance.itemId)) {
          continue;
        }
        nextCounts[instance.itemId] = (nextCounts[instance.itemId] || 0) + 1;
      }
      for (const itemId of Object.keys(EQUIPMENT_DATA.items || {})) {
        if (nextCounts[itemId] > 0) {
          game.equipmentInventoryById[itemId] = nextCounts[itemId];
        } else if (!isDefaultItem(itemId)) {
          delete game.equipmentInventoryById[itemId];
        }
      }
    }

    function migrateRandomStatUpgradeTargets() {
      const instances = game.equipmentInstancesById && typeof game.equipmentInstancesById === "object"
        ? game.equipmentInstancesById
        : {};
      for (const instance of Object.values(instances)) {
        if (!instance || !instance.itemId) {
          continue;
        }
        const item = getBaseItem(instance.itemId);
        const level = clampUpgradeLevel(instance.upgradeLevel);
        ensureRandomStatUpgradeTargets(item, instance, level);
      }
      const upgradeStore = game.equipmentUpgradeById && typeof game.equipmentUpgradeById === "object"
        ? game.equipmentUpgradeById
        : {};
      for (const [itemId, levelValue] of Object.entries(upgradeStore)) {
        const item = getBaseItem(itemId);
        const level = clampUpgradeLevel(levelValue);
        ensureRandomStatUpgradeTargets(item, null, level);
      }
    }

    function createEquipmentInstance(itemId, options = {}) {
      if (!game || !itemId) {
        return null;
      }
      if (!options.skipEnsure) {
        ensureEquipmentState();
      } else {
        ensureEquipmentStores();
      }
      const item = getBaseItem(itemId);
      if (!item || isDefaultItem(item)) {
        return null;
      }
      const instanceId = makeEquipmentInstanceId(item.id);
      const randomSeed = Number.isFinite(options.randomSeed)
        ? options.randomSeed
        : Math.floor(Math.random() * 1000000000);
      game.equipmentInstancesById[instanceId] = {
        id: instanceId,
        itemId: item.id,
        upgradeLevel: clampUpgradeLevel(options.upgradeLevel),
        randomSeed,
      };
      game.equipmentRandomSeedsById[instanceId] = randomSeed;
      delete game.equipmentRandomStatsById[instanceId];
      clearEquipmentUpgradeRolls(instanceId, { skipEnsure: true });
      syncEquipmentInventoryCounts();
      return instanceId;
    }

    function getEquipmentInstancesByItemId(itemId) {
      ensureEquipmentState();
      const ids = getEquipmentInstanceIdsByItemId(itemId);
      return ids
        .map((instanceId, index) => {
          const item = resolveItem(instanceId);
          if (item) {
            item.copyIndex = index + 1;
            item.copyCount = ids.length;
          }
          return item;
        })
        .filter(Boolean);
    }

    function getEquipmentInstance(itemOrId) {
      ensureEquipmentState();
      return getEquipmentInstanceRaw(getEquipmentItemRef(itemOrId));
    }

    function getEquipmentInstanceIdsByItemId(itemId) {
      if (!game || !itemId) {
        return [];
      }
      const baseId = getEquipmentBaseItemId(itemId);
      const instances = game.equipmentInstancesById && typeof game.equipmentInstancesById === "object"
        ? game.equipmentInstancesById
        : {};
      return Object.values(instances)
        .filter((entry) => entry && entry.itemId === baseId)
        .map((entry) => entry.id);
    }

    function getEquipmentInstanceRaw(ref) {
      if (!game || !ref || !game.equipmentInstancesById || typeof game.equipmentInstancesById !== "object") {
        return null;
      }
      const instance = game.equipmentInstancesById[ref];
      return instance && instance.itemId ? instance : null;
    }

    function getEquipmentItemRef(itemOrId) {
      if (!itemOrId) {
        return null;
      }
      if (typeof itemOrId === "string") {
        return itemOrId;
      }
      if (typeof itemOrId === "object") {
        return itemOrId.instanceId || itemOrId.equipmentInstanceId || itemOrId.refId || itemOrId.itemId || itemOrId.id || null;
      }
      return null;
    }

    function getEquipmentBaseItemId(itemOrId) {
      if (!itemOrId) {
        return null;
      }
      const ref = getEquipmentItemRef(itemOrId);
      const instance = getEquipmentInstanceRaw(ref);
      if (instance) {
        return instance.itemId;
      }
      if (typeof itemOrId === "object") {
        return itemOrId.itemId || itemOrId.baseItemId || itemOrId.id || ref;
      }
      return ref;
    }

    function getBaseItem(itemId) {
      return itemId && EQUIPMENT_DATA.items ? EQUIPMENT_DATA.items[itemId] || null : null;
    }

    function makeEquipmentInstanceId(itemId) {
      const base = String(itemId || "item").replace(/[^A-Za-z0-9_]/g, "_").slice(0, 36) || "item";
      let id = "";
      do {
        id = `eq_${base}_${Math.max(1, Math.floor(game.nextEquipmentInstanceSeq || 1))}`;
        game.nextEquipmentInstanceSeq = Math.max(1, Math.floor(game.nextEquipmentInstanceSeq || 1)) + 1;
      } while (game.equipmentInstancesById[id]);
      return id;
    }

    function getStoredBaseUpgradeLevel(itemId) {
      const store = game && game.equipmentUpgradeById && typeof game.equipmentUpgradeById === "object"
        ? game.equipmentUpgradeById
        : {};
      return clampUpgradeLevel(store[itemId]);
    }

    function getStoredBaseRandomSeed(itemId) {
      const store = game && game.equipmentRandomSeedsById && typeof game.equipmentRandomSeedsById === "object"
        ? game.equipmentRandomSeedsById
        : {};
      return Number.isFinite(store[itemId]) ? store[itemId] : Math.floor(Math.random() * 1000000000);
    }

    function clampUpgradeLevel(level) {
      return Math.max(0, Math.min(5, Math.floor(Number.isFinite(level) ? level : 0)));
    }

    function getEmptyEquipment() {
      return Object.fromEntries(slotKeys.map((key) => [key, null]));
    }

    function normalizeEquipment(equipment = {}, unit = null) {
      ensureEquipmentState();
      const normalized = getEmptyEquipment();
      const localUsed = new Set();
      for (const key of slotKeys) {
        const normalizedRef = normalizeEquipmentRef(equipment && equipment[key], unit, key, localUsed);
        const item = normalizedRef ? resolveItem(normalizedRef) : null;
        if (item && item.slot === key && (!unit || canEquip(unit, item))) {
          normalized[key] = normalizedRef;
          localUsed.add(normalizedRef);
          continue;
        }
        const fallback = isRequiredSlot(key) ? getDefaultItemForSlot(unit, key) : null;
        normalized[key] = fallback ? getEquipmentItemRef(fallback) : null;
      }
      return normalized;
    }

    function normalizeEquipmentRef(ref, unit, slotKey, localUsed = new Set()) {
      if (!ref) {
        return null;
      }
      const item = resolveItem(ref);
      if (!item || item.slot !== slotKey || (unit && !canEquip(unit, item))) {
        return null;
      }
      const exactRef = getEquipmentItemRef(item);
      if (getEquipmentInstanceRaw(exactRef)) {
        return exactRef;
      }
      if (isDefaultItem(item)) {
        return item.id;
      }
      const candidates = getEquipmentInstanceIdsByItemId(getEquipmentBaseItemId(item));
      return candidates.find((instanceId) => !localUsed.has(instanceId)) || candidates[0] || null;
    }

    function resolveItem(itemOrId) {
      const source = resolveItemSource(itemOrId);
      return source.base ? getEffectiveItem(source.base, source.instance) : null;
    }

    function resolveStaticItem(itemOrId) {
      const source = resolveItemSource(itemOrId, { skipEnsure: true });
      return source.base || null;
    }

    function resolveItemSource(itemOrId, options = {}) {
      if (!options.skipEnsure) {
        ensureEquipmentState();
      }
      if (!itemOrId) {
        return { base: null, instance: null };
      }
      if (typeof itemOrId === "string") {
        const instance = getEquipmentInstanceRaw(itemOrId);
        if (instance) {
          return { base: getBaseItem(instance.itemId), instance };
        }
        return { base: getBaseItem(itemOrId), instance: null };
      }
      if (typeof itemOrId === "object") {
        const ref = itemOrId.instanceId || itemOrId.equipmentInstanceId || itemOrId.refId || null;
        const instance = ref ? getEquipmentInstanceRaw(ref) : null;
        if (instance) {
          return { base: getBaseItem(instance.itemId), instance };
        }
        const baseId = itemOrId.itemId || itemOrId.baseItemId || itemOrId.id || ref || null;
        return { base: getBaseItem(baseId), instance: null };
      }
      return { base: null, instance: null };
    }

    function getEquippedItems(unit) {
      if (!unit || !unit.equipment) {
        return [];
      }
      return slotKeys
        .map((slotKey) => resolveItem(unit.equipment[slotKey]))
        .filter(Boolean);
    }

    function isRequiredSlot(slotKey) {
      return Boolean(slotByKey[slotKey] && slotByKey[slotKey].required);
    }

    function getDefaultItemForSlot(unit, slotKey) {
      const items = Object.values(EQUIPMENT_DATA.items || {});
      const item = items.find((entry) => entry && entry.slot === slotKey && isDefaultItem(entry) && (!unit || canEquip(unit, entry, { ignoreOwnership: true })))
        || items.find((entry) => entry && entry.slot === slotKey && (!unit || canEquip(unit, entry, { ignoreOwnership: true })))
        || null;
      return item ? getEffectiveItem(item) : null;
    }

    function canEquip(unit, itemOrId, options = {}) {
      const item = resolveItem(itemOrId);
      if (!unit || !item || !slotByKey[item.slot]) {
        return false;
      }
      if (!options.ignoreOwnership && !isEquipmentOwned(getEquipmentItemRef(item))) {
        return false;
      }
      if (Array.isArray(item.allowedUnitIds) && !item.allowedUnitIds.includes(unit.id)) {
        return false;
      }
      if (Array.isArray(item.allowedRoles) && !item.allowedRoles.includes(unit.role)) {
        return false;
      }
      return true;
    }

    function equipItem(unit, itemOrId) {
      const item = resolveItem(itemOrId);
      if (!canEquip(unit, item)) {
        return false;
      }
      unit.equipment = normalizeEquipment(unit.equipment, unit);
      unit.equipment[item.slot] = getEquipmentItemRef(item);
      return true;
    }

    function unequipSlot(unit, slotKey) {
      if (!unit || !slotByKey[slotKey]) {
        return false;
      }
      if (isRequiredSlot(slotKey)) {
        return false;
      }
      unit.equipment = normalizeEquipment(unit.equipment, unit);
      unit.equipment[slotKey] = null;
      return true;
    }

    function getEffectiveItem(itemOrId, explicitInstance = null) {
      const source = explicitInstance
        ? { base: resolveStaticItem(itemOrId), instance: explicitInstance }
        : resolveItemSource(itemOrId);
      const item = source.base;
      if (!item) {
        return null;
      }
      const instance = source.instance || null;
      const refId = instance ? instance.id : item.id;
      const effective = {
        ...item,
        id: item.id,
        itemId: item.id,
        baseItemId: item.id,
        refId,
        instanceId: instance ? instance.id : null,
        equipmentInstanceId: instance ? instance.id : null,
        flatStatBonuses: getRandomizedFlatStatBonuses(item, instance),
        statBonuses: { ...(item.statBonuses || {}) },
      };
      applyGeneratedRandomStats(effective, item, instance);
      applyUpgradeBonuses(effective, item, instance);
      effective.summaryStats = getItemSummaryStats(effective);
      return effective;
    }

    function applyGeneratedRandomStats(effective, source, instance) {
      if (!source || !source.randomStatProfile) {
        return;
      }
      const generated = getGeneratedRandomStats(source, instance);
      addBonusObject(effective.statBonuses, generated.statBonuses);
      if (generated.description) {
        effective.randomDescription = generated.description;
      }
    }

    function applyUpgradeBonuses(effective, source, instance) {
      const level = getEquipmentUpgradeLevel(instance ? instance.id : source && source.id);
      const clampedLevel = Math.max(0, Math.min(level, upgradeMultipliers.length - 1));
      effective.upgradeLevel = clampedLevel;
      if (!clampedLevel || !source || !source.upgrade) {
        return;
      }
      const multipliers = Array.isArray(source.upgrade.multipliers) ? source.upgrade.multipliers : upgradeMultipliers;
      if (source.upgrade.mode === "flatStatMultiplier") {
        applyFlatStatUpgradeBonuses(effective, source, instance, clampedLevel, multipliers);
      } else if (source.upgrade.mode === "randomStatMultiplier") {
        applyRandomStatUpgradeBonuses(effective, source, instance, clampedLevel, multipliers);
      }
    }

    function applyRandomStatUpgradeBonuses(effective, source, instance, clampedLevel, multipliers) {
      const baseBonuses = getRandomStatUpgradeBaseBonuses(source, instance);
      const targets = getRandomStatUpgradeTargets(source, instance);
      if (!targets.length) {
        return;
      }
      const stepsByKey = {};
      const adjusted = {};
      for (let upgradeLevel = 1; upgradeLevel <= clampedLevel; upgradeLevel += 1) {
        const key = getStoredRandomStatUpgradeTarget(source, instance, targets, upgradeLevel);
        const value = baseBonuses[key];
        if (!key || !Number.isFinite(value) || value === 0) {
          continue;
        }
        const previousStep = stepsByKey[key] || 0;
        const nextStep = previousStep + 1;
        stepsByKey[key] = nextStep;
        const delta = getRandomStatUpgradeDelta(value, previousStep, nextStep, multipliers);
        if (delta) {
          adjusted[key] = roundPercentStatValue((adjusted[key] || 0) + delta);
        }
      }
      for (const [key, value] of Object.entries(adjusted)) {
        if (!Number.isFinite(value) || !value) {
          continue;
        }
        effective.statBonuses[key] = roundPercentStatValue((effective.statBonuses[key] || 0) + value);
      }
    }

    function getRandomStatUpgradeDelta(baseValue, previousStep, nextStep, multipliers) {
      const previousMultiplier = getRandomStatUpgradeMultiplier(multipliers, previousStep);
      const nextMultiplier = getRandomStatUpgradeMultiplier(multipliers, nextStep);
      const roundedDelta = roundPercentStatValue(baseValue * nextMultiplier - baseValue * previousMultiplier);
      if (baseValue < 0) {
        return roundedDelta <= -0.01 ? roundedDelta : -0.01;
      }
      return roundedDelta >= 0.01 ? roundedDelta : 0.01;
    }

    function getRandomStatUpgradeMultiplier(multipliers, step) {
      const values = Array.isArray(multipliers) && multipliers.length ? multipliers : upgradeMultipliers;
      const index = Math.max(0, Math.min(Math.floor(Number.isFinite(step) ? step : 0), values.length - 1));
      return Number.isFinite(values[index]) ? values[index] : 1;
    }

    function getRandomStatUpgradeBaseBonuses(source, instance = null) {
      const generated = source && source.randomStatProfile ? getGeneratedRandomStats(source, instance) : null;
      const baseBonuses = generated ? generated.statBonuses || {} : source && source.statBonuses || {};
      const normalized = {};
      for (const [key, value] of Object.entries(baseBonuses)) {
        if (Number.isFinite(value) && value !== 0) {
          normalized[key] = roundPercentStatValue(value);
        }
      }
      return normalized;
    }

    function getRandomStatUpgradeTargets(source, instance = null) {
      const generated = source && source.randomStatProfile ? getGeneratedRandomStats(source, instance) : null;
      const baseBonuses = getRandomStatUpgradeBaseBonuses(source, instance);
      return Array.from(new Set(generated && generated.upgradeTargets || Object.keys(baseBonuses)))
        .filter((key) => Number.isFinite(baseBonuses[key]) && baseBonuses[key] !== 0);
    }

    function applyFlatStatUpgradeBonuses(effective, source, instance, clampedLevel, multipliers) {
      for (const [key, value] of Object.entries(effective.flatStatBonuses || {})) {
        let current = roundStatValue(value, true);
        for (let upgradeLevel = 1; upgradeLevel <= clampedLevel; upgradeLevel += 1) {
          const previousMultiplier = Number.isFinite(multipliers[upgradeLevel - 1]) ? multipliers[upgradeLevel - 1] : 1;
          const nextMultiplier = Number.isFinite(multipliers[upgradeLevel]) ? multipliers[upgradeLevel] : previousMultiplier;
          const incrementRate = Math.max(0, nextMultiplier - previousMultiplier);
          if (!incrementRate) {
            continue;
          }
          const varianceRate = getEquipmentUpgradeRoll(source, instance, key, upgradeLevel);
          const gain = roundStatValue(current * incrementRate * varianceRate, true);
          current = roundStatValue(current + gain, true);
        }
        effective.flatStatBonuses[key] = current;
      }
    }

    function getEquipmentUpgradeRoll(item, instance, statKey, upgradeLevel) {
      const variance = Math.max(0, getNumber(item && item.randomFlatStatVariance));
      if (!variance) {
        return 1;
      }
      const key = getRandomStatKey(item, instance);
      const store = getUpgradeRollStore();
      if (!store[key] || typeof store[key] !== "object") {
        store[key] = {};
      }
      const rollKey = `${statKey}:${Math.max(1, Math.floor(upgradeLevel))}`;
      if (!Number.isFinite(store[key][rollKey])) {
        store[key][rollKey] = 1 + (Math.random() * 2 - 1) * variance;
      }
      return store[key][rollKey];
    }

    function getStoredRandomStatUpgradeTarget(item, instance, targets, upgradeLevel) {
      if (!Array.isArray(targets) || !targets.length) {
        return null;
      }
      const key = getRandomStatKey(item, instance);
      const store = getUpgradeRollStore();
      const rollKey = `randomStatTarget:${Math.max(1, Math.floor(upgradeLevel))}`;
      if (store[key] && typeof store[key][rollKey] === "string" && targets.includes(store[key][rollKey])) {
        return store[key][rollKey];
      }
      return null;
    }

    function ensureRandomStatUpgradeTarget(item, instance, targets, upgradeLevel) {
      if (!Array.isArray(targets) || !targets.length) {
        return null;
      }
      const key = getRandomStatKey(item, instance);
      const store = getUpgradeRollStore();
      if (!store[key] || typeof store[key] !== "object") {
        store[key] = {};
      }
      const rollKey = `randomStatTarget:${Math.max(1, Math.floor(upgradeLevel))}`;
      if (typeof store[key][rollKey] === "string" && targets.includes(store[key][rollKey])) {
        return store[key][rollKey];
      }
      const target = targets[Math.floor(Math.random() * targets.length) % targets.length] || null;
      if (target) {
        store[key][rollKey] = target;
      }
      return target;
    }

    function ensureRandomStatUpgradeTargets(item, instance, targetLevel) {
      const level = clampUpgradeLevel(targetLevel);
      if (!level || !item || !item.upgrade || item.upgrade.mode !== "randomStatMultiplier") {
        return [];
      }
      const targets = getRandomStatUpgradeTargets(item, instance);
      const selected = [];
      for (let upgradeLevel = 1; upgradeLevel <= level; upgradeLevel += 1) {
        const target = ensureRandomStatUpgradeTarget(item, instance, targets, upgradeLevel);
        if (target) {
          selected.push(target);
        }
      }
      return selected;
    }

    function getGeneratedRandomStats(item, instance = null) {
      const profile = item && item.randomStatProfile;
      if (!profile) {
        return { statBonuses: {}, upgradeTargets: [], description: "" };
      }
      const key = getRandomStatKey(item, instance);
      const store = getRandomStatStore();
      if (!store[key] || (profile.type !== "accessory" && store[key].version !== 2)) {
        store[key] = profile.type === "accessory"
          ? generateAccessoryRandomStats(item, instance)
          : generateArmorRandomStats(item, instance);
      } else if (profile.type !== "accessory") {
        normalizeArmorRandomStats(store[key]);
      }
      return store[key];
    }

    function normalizeArmorRandomStats(generated) {
      if (!generated || !generated.statBonuses) {
        return;
      }
      for (const [key, value] of Object.entries(generated.statBonuses)) {
        generated.statBonuses[key] = roundPercentStatValue(value);
      }
      generated.description = Object.entries(generated.statBonuses)
        .map(([key, value]) => `${getStatLabel(key)}${formatSignedPercent(value)}`)
        .join(" / ");
      generated.upgradeTargets = Object.keys(generated.statBonuses);
    }

    function getRandomizedFlatStatBonuses(item, instance = null) {
      const base = { ...(item && item.flatStatBonuses || {}) };
      for (const [key, value] of Object.entries(base)) {
        base[key] = roundStatValue(value, true);
      }
      return base;
    }

    function generateArmorRandomStats(item, instance = null) {
      const rank = item.rank || "D";
      const total = armorRandomTotals[rank] || armorRandomTotals.D;
      const totalPercent = Math.max(1, Math.round(total * 100));
      const key = getRandomStatKey(item, instance);
      const rng = makeDeterministicRandom(`${key}:armor:${getRandomStatSeed(item, instance)}`);
      const drawnKeys = drawArmorRandomStatKeys(rng, 4);
      const selectedKeys = Array.from(new Set(drawnKeys));
      const positiveMin = 5;
      const negativeMin = 5;
      const positiveMax = Math.max(positiveMin, totalPercent);
      const negativeMax = Math.max(negativeMin, Math.floor(totalPercent / 2));
      let negativeCount = pickArmorNegativeCount(rank, rng, selectedKeys.length);
      while (negativeCount > 0) {
        const positiveCount = selectedKeys.length - negativeCount;
        const maxNegativeTotal = positiveCount * positiveMax - totalPercent;
        if (maxNegativeTotal >= negativeMin * negativeCount) {
          break;
        }
        negativeCount -= 1;
      }
      const shuffledKeys = shuffleArmorRandomValues(selectedKeys, rng);
      const negativeKeys = shuffledKeys.slice(0, negativeCount);
      const positiveKeys = shuffledKeys.slice(negativeCount);
      const maxNegativeTotal = Math.max(0, positiveKeys.length * positiveMax - totalPercent);
      const negativeMagnitudes = generateCappedRandomIntegers(negativeKeys.length, negativeMin, negativeMax, maxNegativeTotal, rng);
      const negativeTotal = negativeMagnitudes.reduce((sum, value) => sum + value, 0);
      const positiveValues = generateBoundedIntegerDistribution(
        totalPercent + negativeTotal,
        positiveKeys.length,
        positiveMin,
        positiveMax,
        rng
      );
      const statBonuses = {};
      for (let i = 0; i < negativeKeys.length; i += 1) {
        addPercentStatBonus(statBonuses, negativeKeys[i], -negativeMagnitudes[i] / 100);
      }
      for (let i = 0; i < positiveKeys.length; i += 1) {
        addPercentStatBonus(statBonuses, positiveKeys[i], positiveValues[i] / 100);
      }
      for (const [statKey, value] of Object.entries(statBonuses)) {
        if (!value) {
          delete statBonuses[statKey];
        }
      }
      return {
        version: 2,
        statBonuses,
        upgradeTargets: shuffledKeys.filter((key) => Object.prototype.hasOwnProperty.call(statBonuses, key)),
        description: Object.entries(statBonuses)
          .map(([key, value]) => `${getStatLabel(key)}${formatSignedPercent(value)}`)
          .join(" / "),
      };
    }

    function drawArmorRandomStatKeys(rng, count) {
      const drawn = [];
      for (let i = 0; i < Math.max(1, Math.floor(count)); i += 1) {
        drawn.push(armorRandomStatKeys[Math.floor(rng() * armorRandomStatKeys.length) % armorRandomStatKeys.length]);
      }
      return drawn;
    }

    function addPercentStatBonus(target, statKey, amount) {
      if (!target || !statKey || !Number.isFinite(amount)) {
        return;
      }
      target[statKey] = roundPercentStatValue((target[statKey] || 0) + amount);
    }

    function pickArmorNegativeCount(rank, rng, statCount) {
      const maxCount = Math.max(0, Math.min(
        Math.floor(Number.isFinite(armorRandomNegativeMaxCounts[rank]) ? armorRandomNegativeMaxCounts[rank] : 0),
        Math.max(0, statCount - 1)
      ));
      if (maxCount <= 0) {
        return 0;
      }
      const roll = rng();
      if (maxCount === 1) {
        return roll < 0.35 ? 1 : 0;
      }
      if (roll < 0.45) {
        return 0;
      }
      if (roll < 0.8) {
        return 1;
      }
      return maxCount;
    }

    function shuffleArmorRandomValues(values, rng) {
      const shuffled = values.slice();
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    function generateCappedRandomIntegers(count, minValue, maxValue, maxTotal, rng) {
      if (count <= 0) {
        return [];
      }
      const values = [];
      let remainingCap = Math.max(minValue * count, Math.floor(maxTotal));
      for (let i = 0; i < count; i += 1) {
        const remainingSlots = count - i - 1;
        const high = Math.min(maxValue, remainingCap - minValue * remainingSlots);
        const value = randomIntInclusive(minValue, Math.max(minValue, high), rng);
        values.push(value);
        remainingCap -= value;
      }
      return values;
    }

    function generateBoundedIntegerDistribution(targetTotal, count, minValue, maxValue, rng) {
      if (count <= 0) {
        return [];
      }
      const values = [];
      let remaining = Math.max(minValue * count, Math.min(maxValue * count, Math.floor(targetTotal)));
      for (let i = 0; i < count; i += 1) {
        const remainingSlots = count - i - 1;
        if (remainingSlots <= 0) {
          values.push(Math.max(minValue, Math.min(maxValue, remaining)));
          break;
        }
        const low = Math.max(minValue, remaining - maxValue * remainingSlots);
        const high = Math.min(maxValue, remaining - minValue * remainingSlots);
        const value = randomIntInclusive(low, high, rng);
        values.push(value);
        remaining -= value;
      }
      return values;
    }

    function randomIntInclusive(minValue, maxValue, rng) {
      const min = Math.ceil(Math.min(minValue, maxValue));
      const max = Math.floor(Math.max(minValue, maxValue));
      return min + Math.floor(rng() * (max - min + 1));
    }

    function generateAccessoryRandomStats(item, instance = null) {
      const rank = item.rank || "D";
      const drawCount = accessoryRandomCounts[rank] || accessoryRandomCounts.D;
      const key = getRandomStatKey(item, instance);
      const rng = makeDeterministicRandom(`${key}:accessory:${getRandomStatSeed(item, instance)}`);
      const statBonuses = {};
      const labels = [];
      const targets = [];
      for (let i = 0; i < drawCount; i += 1) {
        const option = accessoryRandomOptions[Math.floor(rng() * accessoryRandomOptions.length) % accessoryRandomOptions.length];
        labels.push(option.label);
        for (const [key, value] of Object.entries(option.statBonuses || {})) {
          statBonuses[key] = roundStatValue((statBonuses[key] || 0) + value);
          targets.push(key);
        }
      }
      return {
        statBonuses,
        upgradeTargets: targets,
        description: labels.join(" / "),
      };
    }

    function getRandomStatStore() {
      if (!game) {
        return {};
      }
      if (!game.equipmentRandomStatsById || typeof game.equipmentRandomStatsById !== "object") {
        game.equipmentRandomStatsById = {};
      }
      return game.equipmentRandomStatsById;
    }

    function getUpgradeRollStore() {
      if (!game) {
        return {};
      }
      if (!game.equipmentUpgradeRollsById || typeof game.equipmentUpgradeRollsById !== "object") {
        game.equipmentUpgradeRollsById = {};
      }
      return game.equipmentUpgradeRollsById;
    }

    function getRandomStatKey(item, instance = null) {
      return instance && instance.id ? instance.id : item && item.id ? item.id : "";
    }

    function getRandomStatSeed(item, instance = null) {
      if (instance && Number.isFinite(instance.randomSeed)) {
        return instance.randomSeed;
      }
      if (!game || !item) {
        return 0;
      }
      const store = game.equipmentRandomSeedsById && typeof game.equipmentRandomSeedsById === "object"
        ? game.equipmentRandomSeedsById
        : {};
      const key = getRandomStatKey(item, instance);
      return Number.isFinite(store[key]) ? store[key] : 0;
    }

    function getItemSummaryStats(item) {
      return {
        flatStatBonuses: { ...(item && item.flatStatBonuses || {}) },
        statBonuses: { ...(item && item.statBonuses || {}) },
      };
    }

    function isDefaultItem(itemOrId) {
      const item = resolveStaticItem(itemOrId);
      return Boolean(item && (item.material === "製作不可" || String(item.id || "").startsWith("default_")));
    }

    function isEquipmentOwned(itemId) {
      if (!itemId) {
        return false;
      }
      ensureEquipmentState();
      const ref = getEquipmentItemRef(itemId);
      if (getEquipmentInstanceRaw(ref)) {
        return true;
      }
      const item = resolveStaticItem(itemId);
      return isDefaultItem(item) || getEquipmentOwnedCount(item && item.id) > 0;
    }

    function getEquipmentOwnedCount(itemId) {
      if (!game || !itemId) {
        return 0;
      }
      ensureEquipmentState();
      return getEquipmentInstanceIdsByItemId(getEquipmentBaseItemId(itemId)).length;
    }

    function getEquipmentUpgradeLevel(itemId) {
      if (!game || !itemId) {
        return 0;
      }
      ensureEquipmentState();
      const ref = getEquipmentItemRef(itemId);
      const instance = getEquipmentInstanceRaw(ref);
      if (instance) {
        return clampUpgradeLevel(instance.upgradeLevel);
      }
      const store = game.equipmentUpgradeById && typeof game.equipmentUpgradeById === "object"
        ? game.equipmentUpgradeById
        : {};
      return clampUpgradeLevel(store[ref]);
    }

    function setEquipmentUpgradeLevel(itemId, level) {
      if (!game || !itemId) {
        return false;
      }
      ensureEquipmentState();
      const ref = getEquipmentItemRef(itemId);
      const next = clampUpgradeLevel(level);
      const instance = getEquipmentInstanceRaw(ref);
      if (instance) {
        const item = getBaseItem(instance.itemId);
        instance.upgradeLevel = next;
        if (next <= 0) {
          clearEquipmentUpgradeRolls(ref, { skipEnsure: true });
        } else {
          ensureRandomStatUpgradeTargets(item, instance, next);
        }
        return true;
      }
      if (!game.equipmentUpgradeById || typeof game.equipmentUpgradeById !== "object") {
        game.equipmentUpgradeById = {};
      }
      game.equipmentUpgradeById[ref] = next;
      if (next <= 0) {
        clearEquipmentUpgradeRolls(ref, { skipEnsure: true });
      } else {
        ensureRandomStatUpgradeTargets(resolveStaticItem(ref), null, next);
      }
      return true;
    }

    function resetEquipmentUpgrade(itemId) {
      if (!setEquipmentUpgradeLevel(itemId, 0)) {
        return false;
      }
      clearEquipmentUpgradeRolls(itemId);
      return true;
    }

    function getEquipmentRandomStatUpgradeTarget(itemId, upgradeLevel) {
      if (!game || !itemId) {
        return null;
      }
      ensureEquipmentState();
      const ref = getEquipmentItemRef(itemId);
      const instance = getEquipmentInstanceRaw(ref);
      const item = instance ? getBaseItem(instance.itemId) : resolveStaticItem(ref);
      if (!item || !item.upgrade || item.upgrade.mode !== "randomStatMultiplier") {
        return null;
      }
      const targets = getRandomStatUpgradeTargets(item, instance);
      return getStoredRandomStatUpgradeTarget(item, instance, targets, upgradeLevel);
    }

    function clearEquipmentUpgradeRolls(itemId, options = {}) {
      if (!game || !itemId) {
        return false;
      }
      if (!options.skipEnsure) {
        ensureEquipmentState();
      } else {
        ensureEquipmentStores();
      }
      const ref = getEquipmentItemRef(itemId);
      const instance = getEquipmentInstanceRaw(ref);
      const item = resolveStaticItem(itemId);
      const key = instance ? instance.id : item && item.id || ref;
      if (!key || !game.equipmentUpgradeRollsById || typeof game.equipmentUpgradeRollsById !== "object") {
        return false;
      }
      delete game.equipmentUpgradeRollsById[key];
      return true;
    }

    function rerollEquipmentRandomStats(itemId) {
      ensureEquipmentState();
      const ref = getEquipmentItemRef(itemId);
      const item = resolveStaticItem(itemId);
      const instance = getEquipmentInstanceRaw(ref);
      const key = instance ? instance.id : item && item.id;
      if (!key) {
        return false;
      }
      const seed = Math.floor(Math.random() * 1000000000);
      if (instance) {
        instance.randomSeed = seed;
      }
      if (!game.equipmentRandomSeedsById || typeof game.equipmentRandomSeedsById !== "object") {
        game.equipmentRandomSeedsById = {};
      }
      game.equipmentRandomSeedsById[key] = seed;
      if (game.equipmentRandomStatsById && typeof game.equipmentRandomStatsById === "object") {
        delete game.equipmentRandomStatsById[key];
      }
      return true;
    }

    function getSetCounts(unit) {
      const counts = {};
      for (const item of getEquippedItems(unit)) {
        if (!item.series) {
          continue;
        }
        counts[item.series] = (counts[item.series] || 0) + 1;
      }
      return counts;
    }

    function getActiveSetEffects(unit) {
      const counts = getSetCounts(unit);
      const effects = [];
      for (const [seriesKey, count] of Object.entries(counts)) {
        const series = EQUIPMENT_DATA.series[seriesKey];
        if (!series || !series.setEffects) {
          continue;
        }
        for (const threshold of EQUIPMENT_DATA.setThresholds || []) {
          if (count >= threshold && series.setEffects[threshold]) {
            effects.push({
              seriesKey,
              count,
              maxThreshold: getSeriesMaxThreshold(series),
              threshold,
              effect: series.setEffects[threshold],
            });
          }
        }
      }
      return effects;
    }

    function getSeriesMaxThreshold(series) {
      const thresholds = EQUIPMENT_DATA.setThresholds || [];
      return thresholds.reduce((max, threshold) => (
        series && series.setEffects && series.setEffects[threshold]
          ? Math.max(max, threshold)
          : max
      ), 0);
    }

    function getStatBonusSum(unit, statKey) {
      let bonus = 0;
      for (const item of getEquippedItems(unit)) {
        bonus += getNumber(item.statBonuses && item.statBonuses[statKey]);
      }
      for (const entry of getActiveSetEffects(unit)) {
        bonus += getNumber(entry.effect.statBonuses && entry.effect.statBonuses[statKey]);
      }
      return bonus;
    }

    function getFlatStatBonusSum(unit, statKey) {
      let bonus = 0;
      for (const item of getEquippedItems(unit)) {
        bonus += getNumber(item.flatStatBonuses && item.flatStatBonuses[statKey]);
      }
      for (const entry of getActiveSetEffects(unit)) {
        bonus += getNumber(entry.effect.flatStatBonuses && entry.effect.flatStatBonuses[statKey]);
      }
      return bonus;
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

    function getEffectiveStat(unit, statKey) {
      if (!unit) {
        return 0;
      }
      const base = getNumber(unit[statKey]);
      const flatBonus = getFlatStatBonusSum(unit, statKey);
      const baseValue = base + flatBonus;
      const bonus = getStatBonusSum(unit, statKey);
      return isAdditiveBonusStat(statKey) ? baseValue + bonus : baseValue + baseValue * bonus;
    }

    function getWeaponElement(unit) {
      const weapon = getEquippedSlotItem(unit, "weapon");
      return getItemElement(weapon);
    }

    function getElementKeys() {
      return EQUIPMENT_DATA.elements && EQUIPMENT_DATA.elements[defaultElement] ? [defaultElement] : [];
    }

    function getElementName(elementKey) {
      const data = EQUIPMENT_DATA.elements && EQUIPMENT_DATA.elements[elementKey];
      return data && data.name ? data.name : elementKey;
    }

    function getElementShortName(elementKey) {
      const data = EQUIPMENT_DATA.elements && EQUIPMENT_DATA.elements[elementKey];
      return data && data.shortName ? data.shortName : getElementName(elementKey).replace(/属性/g, "");
    }

    function getNormalElement(unit) {
      return defaultElement;
    }

    function getEquippedSlotItem(unit, slotKey) {
      return unit && unit.equipment ? resolveItem(unit.equipment[slotKey]) : null;
    }

    function getUnitElement(unit) {
      return defaultElement;
    }

    function getItemElement(item) {
      return defaultElement;
    }

    function getDamageElement(source, options = {}) {
      return defaultElement;
    }

    function getElementOutgoingDamageMultiplier(source, target, options = {}) {
      return 1;
    }

    function getElementIncomingDamageMultiplier(target, source, options = {}) {
      return 1;
    }

    function getElementBoostBonus(unit, elementKey) {
      return 0;
    }

    function getElementResistanceBonus(unit, elementKey) {
      return 0;
    }

    function addBonusObject(target, source) {
      if (!target || !source) {
        return;
      }
      for (const [key, value] of Object.entries(source)) {
        const amount = getNumber(value);
        if (amount) {
          target[key] = roundStatValue((target[key] || 0) + amount);
        }
      }
    }

    function roundStatValue(value, integer = false) {
      if (!Number.isFinite(value)) {
        return 0;
      }
      if (integer) {
        return Math.max(0, Math.round(value));
      }
      return Math.round(value * 10000) / 10000;
    }

    function roundPercentStatValue(value) {
      if (!Number.isFinite(value)) {
        return 0;
      }
      return Math.round(value * 100) / 100;
    }

    function makeDeterministicRandom(seedText) {
      let seed = hashString(seedText || "seed") || 1;
      return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    }

    function hashString(text) {
      let hash = 2166136261;
      for (const char of String(text || "")) {
        hash ^= char.codePointAt(0);
        hash = Math.imul(hash, 16777619) >>> 0;
      }
      return hash >>> 0;
    }

    function getStatLabel(statKey) {
      const labels = {
        maxHp: "HP",
        maxMp: "MP",
        attack: "攻撃力",
        magic: "魔力",
        defense: "防御力",
        magicDefense: "魔法防御力",
        critChance: "会心率",
        critDamage: "会心ダメージ",
        guardChance: "ガード率",
        guardDamageReduction: "ガード軽減率",
        damageBoost: "与ダメージ率",
        damageResistance: "被ダメージ率",
        physicalDamageBoost: "物理与ダメージ率",
        physicalDamageResistance: "物理被ダメージ率",
        magicDamageBoost: "魔法与ダメージ率",
        magicDamageResistance: "魔法被ダメージ率",
        hpRegenRate: "HP再生率",
        mpRegenRate: "MP再生率",
        castSpeed: "詠唱速度",
        cooldownReduction: "クールタイム",
        actionSpeed: "行動速度",
        ultimateChargeRate: "ゲージ上昇率",
        moveSpeed: "移動速度",
      };
      return labels[statKey] || statKey;
    }

    function formatSignedPercent(value) {
      const percent = Math.round(getNumber(value) * 100);
      return `${percent >= 0 ? "+" : ""}${percent}%`;
    }

    function getNumber(value, fallback = 0) {
      return Number.isFinite(value) ? value : fallback;
    }

    return {
      slots,
      slotKeys,
      defaultElement,
      getEmptyEquipment,
      normalizeEquipment,
      resolveItem,
      resolveStaticItem,
      getEquippedItems,
      isRequiredSlot,
      getDefaultItemForSlot,
      canEquip,
      equipItem,
      unequipSlot,
      isEquipmentOwned,
      getEquipmentOwnedCount,
      getEquipmentUpgradeLevel,
      setEquipmentUpgradeLevel,
      resetEquipmentUpgrade,
      getEquipmentRandomStatUpgradeTarget,
      createEquipmentInstance,
      getEquipmentInstancesByItemId,
      getEquipmentInstance,
      getEquipmentItemRef,
      getEquipmentBaseItemId,
      rerollEquipmentRandomStats,
      getSetCounts,
      getActiveSetEffects,
      getStatBonusSum,
      getFlatStatBonusSum,
      getEffectiveStat,
      getWeaponElement,
      getElementKeys,
      getElementName,
      getElementShortName,
      getNormalElement,
      getUnitElement,
      getEquippedSlotItem,
      getDamageElement,
      getElementOutgoingDamageMultiplier,
      getElementIncomingDamageMultiplier,
      getElementBoostBonus,
      getElementResistanceBonus,
    };
  };
})();
