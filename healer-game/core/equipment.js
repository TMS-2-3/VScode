(() => {
  "use strict";

  window.createHealerEquipmentSystem = function createHealerEquipmentSystem(context) {
    const { EQUIPMENT_DATA } = context;
    const slots = EQUIPMENT_DATA.slots || [];
    const slotKeys = slots.map((slot) => slot.key);
    const slotByKey = Object.fromEntries(slots.map((slot) => [slot.key, slot]));
    const defaultElement = EQUIPMENT_DATA.defaultElement || "none";

    function getEmptyEquipment() {
      return Object.fromEntries(slotKeys.map((key) => [key, null]));
    }

    function normalizeEquipment(equipment = {}, unit = null) {
      const normalized = getEmptyEquipment();
      for (const key of slotKeys) {
        const item = equipment && equipment[key] ? resolveItem(equipment[key]) : null;
        if (item && item.slot === key && (!unit || canEquip(unit, item))) {
          normalized[key] = item.id;
          continue;
        }
        const fallback = isRequiredSlot(key) ? getDefaultItemForSlot(unit, key) : null;
        normalized[key] = fallback ? fallback.id : null;
      }
      return normalized;
    }

    function resolveItem(itemOrId) {
      if (!itemOrId) {
        return null;
      }
      if (typeof itemOrId === "string") {
        return EQUIPMENT_DATA.items[itemOrId] || null;
      }
      return itemOrId.id ? itemOrId : null;
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
      return items.find((item) => item && item.slot === slotKey && (!unit || canEquip(unit, item))) || null;
    }

    function canEquip(unit, itemOrId) {
      const item = resolveItem(itemOrId);
      if (!unit || !item || !slotByKey[item.slot]) {
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
      unit.equipment[item.slot] = item.id;
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
            effects.push({ seriesKey, threshold, effect: series.setEffects[threshold] });
          }
        }
      }
      return effects;
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

    function getEffectiveStat(unit, statKey) {
      if (!unit) {
        return 0;
      }
      const base = getNumber(unit[statKey]);
      const flatBonus = getFlatStatBonusSum(unit, statKey);
      return (base + flatBonus) * Math.max(0, 1 + getStatBonusSum(unit, statKey));
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
      getEquippedItems,
      isRequiredSlot,
      getDefaultItemForSlot,
      canEquip,
      equipItem,
      unequipSlot,
      getSetCounts,
      getActiveSetEffects,
      getStatBonusSum,
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
