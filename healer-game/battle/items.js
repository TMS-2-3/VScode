(() => {
  "use strict";

  window.createHealerItemSystem = function createHealerItemSystem(context) {
    const {
      canvasCtx: ctx,
      TAU,
      game,
      player,
      party,
      enemies,
      input,
      ITEM_SLOT_KEYS,
      ACTION_GAP,
      battlePx,
      dist,
      normalize,
      clampUnit,
      getEffectiveMoveSpeed,
      healUnit,
      addFloat,
      addBurst,
      getHoveredPartyMember,
      getSupportOrigin,
      cancelPlayerAim,
      isPlayerControlLocked,
      setActionCooldown,
      acquireOrUpgradeSkill,
      addGold,
      formatGold,
    } = context;

    const ITEM_SLOT_UNIT_ORDER = ["ulpes", "rihas", "sushia", "finald"];
    const ITEM_OWNER_NAMES = {
      ulpes: "ウルペス",
      rihas: "リハス",
      sushia: "スシア",
      finald: "アルジュナ",
    };
    const ITEM_ALIASES = {
      potion: "kari_potion",
    };
    const ITEM_DATA = {
      kari_potion: {
        id: "kari_potion",
        name: "仮ポーション",
        shortName: "薬",
        kind: "ポーション",
        useTiming: "どこでも",
        target: "self",
        consumeCount: 1,
        maxCount: 3,
        battleMaxCount: 3,
        cast: 2,
        reuseCd: 15,
        healFlat: 250,
        price: 50,
        cd: 0,
        maxCd: 15,
        simpleDescription: "飲むと体力が回復する。",
        description: "飲むとHPが250回復する。",
      },
      horn_rabbit_corner: {
        id: "horn_rabbit_corner",
        name: "ツノウサギの角",
        shortName: "角",
        kind: "素材",
        useTiming: "戦闘中",
        target: "self",
        inventoryStore: "material",
        consumeCount: 1,
        maxCount: 1,
        battleMaxCount: 1,
        cast: 5,
        reuseCd: 0,
        cd: 0,
        maxCd: 0,
        baseStatBuffs: { magic: 20 },
        simpleDescription: "魔力がこもっている角。戦闘中に使用すると魔力が上昇する",
        description: "吸収された魔力がこもっている角。\n戦闘中に使用することで\nその戦闘の間、基礎魔力が20上昇する",
      },
      d_power_flag: {
        id: "d_power_flag",
        name: "力の結晶(D)",
        shortName: "結",
        kind: "素材",
        useTiming: "非戦闘中",
        target: "none",
        consumeCount: 1,
        maxCount: 999,
        equippable: false,
        simpleDescription: "Dランクのスキルを獲得、強化できる。",
        description: "未所持または強化が終わっていないDランクのスキルを獲得、強化する。全て獲得、強化済みなら300Gを獲得する。",
      },
    };

    const slotKeys = Array.isArray(ITEM_SLOT_KEYS) && ITEM_SLOT_KEYS.length
      ? ITEM_SLOT_KEYS.map((key) => String(key).toLowerCase())
      : ["c", "v", "b", "n"];

    function createItemInstance(itemId, options = {}) {
      const normalizedId = normalizeItemId(itemId);
      const def = ITEM_DATA[normalizedId];
      if (!def) {
        return null;
      }
      const count = Number.isFinite(options.count) ? options.count : def.maxCount || 1;
      return {
        ...def,
        count: Math.max(0, count),
        cd: Number.isFinite(options.cd) ? options.cd : def.cd || 0,
        maxCd: Number.isFinite(options.maxCd) ? options.maxCd : def.maxCd || def.reuseCd || 0,
      };
    }

    function normalizeItemId(itemId) {
      const key = String(itemId || "");
      return ITEM_ALIASES[key] || key;
    }

    function getPartyItemStore() {
      if (!game.partyItemById || typeof game.partyItemById !== "object") {
        game.partyItemById = {};
      }
      return game.partyItemById;
    }

    function getInventoryStore() {
      if (!game.itemInventoryById || typeof game.itemInventoryById !== "object") {
        game.itemInventoryById = {};
      }
      return game.itemInventoryById;
    }

    function getMaterialInventoryStore() {
      if (!game.materialsById || typeof game.materialsById !== "object") {
        game.materialsById = {};
      }
      return game.materialsById;
    }

    function usesMaterialInventory(itemId) {
      const def = ITEM_DATA[normalizeItemId(itemId)];
      return Boolean(def && def.inventoryStore === "material");
    }

    function normalizePartyItems() {
      const store = getPartyItemStore();
      const hasAnyCharacterEntry = ITEM_SLOT_UNIT_ORDER.some((unitId) =>
        Object.prototype.hasOwnProperty.call(store, unitId)
      );
      if (!hasAnyCharacterEntry) {
        migrateLegacySlots(store);
      }
      for (const unitId of ITEM_SLOT_UNIT_ORDER) {
        if (!Object.prototype.hasOwnProperty.call(store, unitId)) {
          store[unitId] = null;
        } else {
          store[unitId] = normalizeItemEntry(store[unitId]);
        }
      }
      return store;
    }

    function migrateLegacySlots(store) {
      if (Array.isArray(game.itemSlots) && game.itemSlots.some(Boolean)) {
        for (let i = 0; i < ITEM_SLOT_UNIT_ORDER.length; i += 1) {
          store[ITEM_SLOT_UNIT_ORDER[i]] = normalizeItemEntry(game.itemSlots[i]);
        }
        return;
      }
      store.ulpes = createItemInstance("kari_potion");
      store.rihas = null;
      store.sushia = null;
      store.finald = null;
    }

    function normalizeItemEntry(entry) {
      if (!entry) {
        return null;
      }
      if (typeof entry === "string") {
        return createItemInstance(entry);
      }
      return createItemInstance(entry.id, entry);
    }

    function getItemOwnerName(unitId) {
      return ITEM_OWNER_NAMES[unitId] || unitId || "";
    }

    function attachSlotOwner(item, unitId, slotIndex) {
      if (!item) {
        return null;
      }
      item.ownerUnitId = unitId;
      item.ownerName = getItemOwnerName(unitId);
      item.slotIndex = slotIndex;
      return item;
    }

    function normalizeSlots() {
      const store = normalizePartyItems();
      game.itemSlots = ITEM_SLOT_UNIT_ORDER.map((unitId, index) => attachSlotOwner(store[unitId], unitId, index));
      return game.itemSlots;
    }

    function getItemSlots() {
      return normalizeSlots();
    }

    function getItemSlotKeys() {
      return slotKeys.slice();
    }

    function getItemSlotOwners() {
      return ITEM_SLOT_UNIT_ORDER.map((unitId) => ({ unitId, name: getItemOwnerName(unitId) }));
    }

    function getItemCandidates() {
      return Object.values(ITEM_DATA).map((item) => ({
        ...item,
        inventoryCount: getItemInventoryCount(item.id),
        equippedCount: getItemEquippedCount(item.id),
        totalCount: getItemOwnedCount(item.id),
      }));
    }

    function getItemDef(itemId) {
      return ITEM_DATA[normalizeItemId(itemId)] || null;
    }

    function getItemOwnedCount(itemId) {
      return getItemInventoryCount(itemId) + getItemEquippedCount(itemId);
    }

    function getItemInventoryCount(itemId) {
      const normalizedId = normalizeItemId(itemId);
      if (usesMaterialInventory(normalizedId)) {
        const store = getMaterialInventoryStore();
        return Math.max(0, Math.floor(Number.isFinite(store[normalizedId]) ? store[normalizedId] : 0));
      }
      const store = getInventoryStore();
      return Math.max(0, Math.floor(Number.isFinite(store[normalizedId]) ? store[normalizedId] : 0));
    }

    function getItemEquippedCount(itemId) {
      const normalizedId = normalizeItemId(itemId);
      const store = normalizePartyItems();
      return ITEM_SLOT_UNIT_ORDER.reduce((sum, unitId) => {
        const item = store[unitId];
        return sum + (item && item.id === normalizedId && Number.isFinite(item.count) ? item.count : 0);
      }, 0);
    }

    function getItemCapacity(itemId) {
      const normalizedId = normalizeItemId(itemId);
      const def = getItemDef(normalizedId);
      if (!def) {
        return 0;
      }
      return 9999;
    }

    function addItem(itemId, count = 1) {
      const normalizedId = normalizeItemId(itemId);
      const def = getItemDef(normalizedId);
      if (!def) {
        return 0;
      }
      let remaining = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
      if (remaining <= 0) {
        return 0;
      }
      if (usesMaterialInventory(normalizedId)) {
        const store = getMaterialInventoryStore();
        store[normalizedId] = getItemInventoryCount(normalizedId) + remaining;
        return remaining;
      }
      const store = getInventoryStore();
      store[normalizedId] = getItemInventoryCount(normalizedId) + remaining;
      return remaining;
    }

    function canUseInventoryItem(itemId) {
      const normalizedId = normalizeItemId(itemId);
      if (normalizedId === "d_power_flag") {
        return game.state !== "playing" && getItemInventoryCount(normalizedId) > 0;
      }
      return false;
    }

    function useInventoryItem(itemId) {
      const normalizedId = normalizeItemId(itemId);
      if (normalizedId === "d_power_flag") {
        return usePowerCrystalD();
      }
      return setInventoryUseMessage("このアイテムはまだ使用できません。", false);
    }

    function usePowerCrystalDFromBattleReward() {
      return usePowerCrystalD({ battleReward: true });
    }

    function usePowerCrystalD(options = {}) {
      const itemId = "d_power_flag";
      const fromBattleReward = Boolean(options && options.battleReward);
      if (game.state === "playing" && !fromBattleReward) {
        return setInventoryUseMessage("戦闘中は使用できません。", false);
      }
      if (!removeInventoryItem(itemId, 1)) {
        return setInventoryUseMessage("力の結晶(D)を所持していません。", false);
      }
      const result = typeof acquireOrUpgradeSkill === "function" ? acquireOrUpgradeSkill("D") : null;
      if (!result) {
        addItem(itemId, 1);
        return setInventoryUseMessage("使用できませんでした。", false);
      }
      if (result.type === "acquired") {
        return setInventoryUseMessage(`${result.skillName || "スキル"}を獲得しました。`, true, result);
      }
      if (result.type === "upgraded") {
        return setInventoryUseMessage(buildSkillUpgradeMessage(result), true, result);
      }
      if (result.type === "gold") {
        const amount = Math.max(0, Math.floor(Number.isFinite(result.amount) ? result.amount : 300));
        if (typeof addGold === "function") {
          addGold(amount);
        } else {
          game.gold = Math.max(0, Math.floor(Number.isFinite(game.gold) ? game.gold : 0)) + amount;
        }
        const goldText = typeof formatGold === "function" ? formatGold(amount) : `${amount}G`;
        return setInventoryUseMessage(`強化候補がないため${goldText}を獲得しました。`, true, result);
      }
      return setInventoryUseMessage("使用しました。", true, result);
    }

    function buildSkillUpgradeMessage(result) {
      const name = result && result.skillName ? result.skillName : "スキル";
      const from = Number.isFinite(result && result.previousLevel) ? result.previousLevel : Math.max(0, (result && result.level || 1) - 1);
      const to = Number.isFinite(result && result.level) ? result.level : from + 1;
      const lines = [`${name}を強化しました。 Lv.${from} -> Lv.${to}`];
      const descriptionLines = String(getSkillUpgradeDescription(result) || "")
        .split(/\r?\n/)
        .filter(Boolean);
      if (descriptionLines.length) {
        lines.push(`強化内容: ${descriptionLines[0]}`);
        lines.push(...descriptionLines.slice(1));
      }
      return lines;
    }

    function getSkillUpgradeDescription(result) {
      if (!result) {
        return "";
      }
      const detailMode = game && game.settings && game.settings.tooltipDescriptionMode === "detail";
      if (detailMode) {
        return result.upgradeDescription || result.upgradeSimpleDescription || "";
      }
      return result.upgradeSimpleDescription || result.upgradeDescription || "";
    }

    function setInventoryUseMessage(message, ok, result = null) {
      const sourceLines = Array.isArray(message) ? message : [message];
      const lines = sourceLines
        .filter((line) => line !== null && line !== undefined)
        .flatMap((line) => String(line).split(/\r?\n/))
        .filter(Boolean);
      const text = lines.join("\n");
      game.inventoryMessage = lines.length > 1 ? lines : text;
      game.inventoryMessageResult = result || null;
      game.message = lines[0] || game.message;
      game.messageTimer = lines.length ? 3 : game.messageTimer;
      return { ok: Boolean(ok), message: text, result };
    }

    function getItemMaxCount(itemOrDef) {
      const def = typeof itemOrDef === "string" ? getItemDef(itemOrDef) : itemOrDef;
      if (!def) {
        return 0;
      }
      return Math.max(1, Math.floor(
        Number.isFinite(def.battleMaxCount) ? def.battleMaxCount
          : Number.isFinite(def.maxCount) ? def.maxCount
            : 1
      ));
    }

    function getCharacterItem(unitOrId) {
      const unitId = typeof unitOrId === "string" ? unitOrId : unitOrId && unitOrId.id;
      if (!unitId) {
        return null;
      }
      const store = normalizePartyItems();
      const index = ITEM_SLOT_UNIT_ORDER.indexOf(unitId);
      return attachSlotOwner(store[unitId], unitId, index);
    }

    function setCharacterItem(unitOrId, itemId, count = null) {
      const unitId = typeof unitOrId === "string" ? unitOrId : unitOrId && unitOrId.id;
      const def = getItemDef(itemId);
      if (!unitId || !def || def.equippable === false) {
        return false;
      }
      const normalizedId = normalizeItemId(itemId);
      const store = normalizePartyItems();
      const current = store[unitId];
      const desired = clampItemEquipCount(def, count);
      const reusable = current && current.id === normalizedId && Number.isFinite(current.count) ? current.count : 0;
      if (getItemInventoryCount(normalizedId) + reusable < desired) {
        return false;
      }
      if (current && current.id && Number.isFinite(current.count) && current.count > 0) {
        addItem(current.id, current.count);
      }
      if (!removeInventoryItem(normalizedId, desired)) {
        if (current && current.id && Number.isFinite(current.count) && current.count > 0) {
          removeInventoryItem(current.id, current.count);
          store[unitId] = current;
        }
        return false;
      }
      store[unitId] = createItemInstance(normalizedId, { count: desired });
      normalizeSlots();
      return true;
    }

    function clearCharacterItem(unitOrId) {
      const unitId = typeof unitOrId === "string" ? unitOrId : unitOrId && unitOrId.id;
      if (!unitId) {
        return false;
      }
      const store = normalizePartyItems();
      const current = store[unitId];
      if (current && current.id && Number.isFinite(current.count) && current.count > 0) {
        addItem(current.id, current.count);
      }
      store[unitId] = null;
      normalizeSlots();
      return true;
    }

    function removeInventoryItem(itemId, count) {
      const normalizedId = normalizeItemId(itemId);
      const amount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
      if (amount <= 0) {
        return true;
      }
      const current = getItemInventoryCount(normalizedId);
      if (current < amount) {
        return false;
      }
      if (usesMaterialInventory(normalizedId)) {
        const store = getMaterialInventoryStore();
        store[normalizedId] = current - amount;
        return true;
      }
      const store = getInventoryStore();
      store[normalizedId] = current - amount;
      return true;
    }

    function clampItemEquipCount(def, count) {
      const maxCount = getItemMaxCount(def);
      const requested = Number.isFinite(count) ? Math.floor(count) : maxCount;
      return Math.max(1, Math.min(maxCount, requested));
    }

    function useItemSlot(index) {
      return requestItemUse(index);
    }

    function isActionDisabled(unit) {
      return Boolean(unit && ((unit.frozen || 0) > 0 || (unit.sleepTimer || 0) > 0));
    }

    function requestItemUse(index) {
      const slotIndex = Math.floor(Number(index));
      const item = getUsableItem(slotIndex);
      if (!item) {
        return false;
      }
      const user = getItemUser(item);
      if (!user || user.dead || isActionDisabled(user)) {
        showSupportFloat("使用不可", "#f7fff6");
        return false;
      }
      if (cancelPlayerAim) {
        cancelPlayerAim();
      }
      player.itemAim = null;
      if (user.id === "finald") {
        if (isPlayerControlLocked && isPlayerControlLocked()) {
          showSupportFloat("挑発中", "#ffd0d0");
          return false;
        }
        return requestArjunaItemUse(user, item, slotIndex);
      }
      user.itemUseRequest = {
        slotIndex,
        itemId: item.id,
        ownerUnitId: user.id,
      };
      user.aiIntent = null;
      addFloat(`${item.name}準備`, user.x, user.y - 30, "#8de2a1");
      return true;
    }

    function requestArjunaItemUse(user, item, slotIndex) {
      if (user.channel || user.cast || user.itemCast || user.actionLock > 0) {
        showSupportFloat("行動中", "#f7fff6");
        return false;
      }
      return beginItemUse(user, { slotIndex, itemId: item.id, ownerUnitId: user.id }, { ignoreDistance: true });
    }

    function startItemAim(index) {
      return requestItemUse(index);
    }

    function cancelItemAim() {
      player.itemAim = null;
    }

    function confirmItemAim() {
      return false;
    }

    function getUsableItem(slotIndex) {
      const slots = normalizeSlots();
      const item = slots[slotIndex];
      if (!item || item.count <= 0) {
        showSupportFloat("空き", "#f7fff6");
        return null;
      }
      if ((item.cd || 0) > 0) {
        showSupportFloat("準備中", "#f7fff6");
        return null;
      }
      return item;
    }

    function updateItemUsage(dt) {
      updateItemCooldowns(dt);
      for (const unit of Array.isArray(party) ? party : []) {
        if (!unit || unit.dead) {
          if (unit) {
            unit.itemUseRequest = null;
            unit.itemCast = null;
          }
          continue;
        }
        if (unit.itemCast) {
          updateItemCast(unit, dt);
          continue;
        }
        if (unit.itemUseRequest) {
          updateItemRequest(unit, dt);
        }
      }
    }

    function updateItemCooldowns(dt) {
      if (!Number.isFinite(dt) || dt <= 0) {
        return;
      }
      const store = normalizePartyItems();
      for (const unitId of ITEM_SLOT_UNIT_ORDER) {
        const item = store[unitId];
        if (item && item.cd > 0) {
          item.cd = Math.max(0, item.cd - dt);
        }
      }
      normalizeSlots();
    }

    function updateItemRequest(unit, dt) {
      const request = unit.itemUseRequest;
      if (!request) {
        return;
      }
      const item = getRequestItem(request);
      if (!item || item.count <= 0) {
        unit.itemUseRequest = null;
        return;
      }
      if (item.cd > 0) {
        return;
      }
      if (isActionDisabled(unit) || unit.channel || unit.cast || unit.actionLock > 0) {
        return;
      }
      if (unit.id !== "finald" && (unit.cds.attack || 0) > 0) {
        return;
      }
      unit.aiIntent = null;
      if (unit.id !== "finald" && !isSafeForItemUse(unit)) {
        moveAwayForItemUse(unit, dt);
        return;
      }
      beginItemUse(unit, request, { ignoreDistance: unit.id === "finald" });
    }

    function updateItemCast(unit, dt) {
      const cast = unit.itemCast;
      if (!cast) {
        return;
      }
      if (unit.dead || isActionDisabled(unit)) {
        finishItemUse(unit, cast, false);
        return;
      }
      cast.time -= dt;
      if (cast.time <= 0) {
        finishItemUse(unit, cast, true);
      }
    }

    function beginItemUse(unit, request, options = {}) {
      const item = getRequestItem(request);
      if (!unit || !item || item.count <= 0 || item.cd > 0) {
        if (unit) {
          unit.itemUseRequest = null;
        }
        return false;
      }
      if (!options.ignoreDistance && unit.id !== "finald" && !isSafeForItemUse(unit)) {
        return false;
      }
      const castTime = Math.max(0, Number.isFinite(item.cast) ? item.cast : 0);
      unit.itemUseRequest = null;
      unit.aiIntent = null;
      if (castTime <= 0) {
        finishItemUse(unit, { ...request, itemId: item.id, total: 0, time: 0 }, true);
        return true;
      }
      unit.itemCast = {
        ...request,
        itemId: item.id,
        time: castTime,
        total: castTime,
      };
      unit.actionLock = Math.max(unit.actionLock || 0, castTime + (ACTION_GAP || 0));
      unit.actionTotal = Math.max(unit.actionTotal || 0, unit.actionLock);
      addFloat(item.name || "アイテム", unit.x, unit.y - 30, "#8de2a1");
      return true;
    }

    function finishItemUse(unit, cast, success) {
      const item = getRequestItem(cast);
      unit.itemCast = null;
      unit.itemUseRequest = null;
      if (!item) {
        return false;
      }
      consumeItem(item);
      startItemReuseCooldown(item);
      if (unit.id !== "finald" && typeof setActionCooldown === "function") {
        setActionCooldown(unit);
      }
      unit.actionLock = Math.max(unit.actionLock || 0, ACTION_GAP || 0);
      unit.actionTotal = Math.max(unit.actionTotal || 0, unit.actionLock);
      if (!success || unit.dead || isActionDisabled(unit)) {
        addFloat("中断", unit.x, unit.y - 30, "#ffffff");
        return false;
      }
      applyItemEffect(unit, item);
      return true;
    }

    function consumeItem(item) {
      const consumeCount = Math.max(1, Math.floor(Number.isFinite(item.consumeCount) ? item.consumeCount : 1));
      item.count = Math.max(0, (item.count || 0) - consumeCount);
    }

    function startItemReuseCooldown(item) {
      const cooldown = Number.isFinite(item.reuseCd) ? item.reuseCd : Number.isFinite(item.maxCd) ? item.maxCd : 0;
      item.maxCd = Math.max(item.maxCd || 0, cooldown);
      item.cd = Math.max(item.cd || 0, cooldown);
    }

    function applyItemEffect(unit, item) {
      if (item && item.baseStatBuffs && typeof item.baseStatBuffs === "object") {
        let applied = false;
        for (const [statKey, value] of Object.entries(item.baseStatBuffs)) {
          if (!Number.isFinite(value) || value === 0) {
            continue;
          }
          unit[statKey] = (Number.isFinite(unit[statKey]) ? unit[statKey] : 0) + value;
          addFloat(`${getItemStatLabel(statKey)}+${value}`, unit.x, unit.y - 30, "#d9afff");
          applied = true;
        }
        if (applied) {
          if (addBurst) {
            addBurst(unit.x, unit.y, unit.radius + battlePx(18), "rgba(217,175,255,0.22)");
          }
          return true;
        }
      }
      if (Number.isFinite(item.healFlat) || Number.isFinite(item.healRatio)) {
        const amount = Number.isFinite(item.healFlat)
          ? item.healFlat
          : unit.maxHp * (Number.isFinite(item.healRatio) ? item.healRatio : 0.25);
        const healed = healUnit(unit, unit, amount, { noMood: true });
        if (healed > 0) {
          if (addBurst) {
            addBurst(unit.x, unit.y, unit.radius + battlePx(18), "rgba(141,226,161,0.22)");
          }
        } else {
          addFloat("効果なし", unit.x, unit.y - 30, "#ffffff");
        }
        return true;
      }
      addFloat("未実装", unit.x, unit.y - 30, "#f7fff6");
      return false;
    }

    function getItemStatLabel(statKey) {
      const labels = {
        attack: "攻撃力",
        magic: "魔力",
        defense: "防御力",
        magicDefense: "魔防",
        maxHp: "HP",
        maxMp: "MP",
      };
      return labels[statKey] || statKey;
    }

    function getRequestItem(request) {
      if (!request) {
        return null;
      }
      const slots = normalizeSlots();
      const item = Number.isFinite(request.slotIndex) ? slots[request.slotIndex] : getCharacterItem(request.ownerUnitId);
      if (item && (!request.itemId || item.id === request.itemId)) {
        return item;
      }
      return getCharacterItem(request.ownerUnitId);
    }

    function getItemUser(item) {
      const unitId = item && item.ownerUnitId;
      if (!unitId) {
        return null;
      }
      if (player && player.id === unitId) {
        return player;
      }
      return Array.isArray(party) ? party.find((member) => member && member.id === unitId) || null : null;
    }

    function isSafeForItemUse(unit) {
      return getNearestEnemyDistance(unit) >= getItemSafeDistance();
    }

    function getItemSafeDistance() {
      return typeof battlePx === "function" ? battlePx(200) : 200;
    }

    function getNearestEnemyDistance(unit) {
      let nearest = Infinity;
      for (const enemy of Array.isArray(enemies) ? enemies : []) {
        if (!enemy || enemy.dead) {
          continue;
        }
        nearest = Math.min(nearest, dist ? dist(unit, enemy) : Math.hypot(unit.x - enemy.x, unit.y - enemy.y));
      }
      return nearest;
    }

    function moveAwayForItemUse(unit, dt) {
      let x = 0;
      let y = 0;
      for (const enemy of Array.isArray(enemies) ? enemies : []) {
        if (!enemy || enemy.dead) {
          continue;
        }
        const d = dist ? dist(unit, enemy) : Math.hypot(unit.x - enemy.x, unit.y - enemy.y);
        const safe = getItemSafeDistance();
        if (d > safe + (battlePx ? battlePx(40) : 40)) {
          continue;
        }
        const dir = normalize ? normalize(unit.x - enemy.x, unit.y - enemy.y) : fallbackNormalize(unit.x - enemy.x, unit.y - enemy.y);
        const weight = d <= 1 ? 2 : Math.max(0.25, (safe + (battlePx ? battlePx(40) : 40) - d) / safe);
        x += (dir.len > 0 ? dir.x : 1) * weight;
        y += (dir.len > 0 ? dir.y : 0) * weight;
      }
      const away = normalize ? normalize(x, y) : fallbackNormalize(x, y);
      if (away.len <= 0) {
        return;
      }
      const speed = typeof getEffectiveMoveSpeed === "function" ? getEffectiveMoveSpeed(unit) : unit.speed;
      unit.battleFacingIntent = "move";
      unit.x += away.x * speed * dt;
      unit.y += away.y * speed * dt;
      if (clampUnit) {
        clampUnit(unit);
      }
    }

    function fallbackNormalize(x, y) {
      const len = Math.hypot(x, y);
      return len > 0 ? { x: x / len, y: y / len, len } : { x: 0, y: 0, len: 0 };
    }

    function hasPendingItemUse(unit) {
      return Boolean(unit && (unit.itemUseRequest || unit.itemCast));
    }

    function cancelItemUse(unit) {
      if (!unit) {
        return false;
      }
      if (unit.itemCast) {
        finishItemUse(unit, unit.itemCast, false);
        return true;
      }
      if (unit.itemUseRequest) {
        unit.itemUseRequest = null;
        return true;
      }
      return false;
    }

    function isItemUseControlling(unit) {
      if (!unit) {
        return false;
      }
      if (unit.itemCast) {
        return true;
      }
      return Boolean(unit.itemUseRequest && unit.actionLock <= 0 && (unit.id === "finald" || (unit.cds.attack || 0) <= 0));
    }

    function drawItemAimPreview() {
      if ((!player.itemAim && !player.itemCast) || player.dead) {
        return;
      }
      if (player.itemCast) {
        ctx.save();
        const progress = 1 - Math.max(0, player.itemCast.time) / Math.max(0.001, player.itemCast.total || 1);
        ctx.strokeStyle = "#8de2a1";
        ctx.fillStyle = "rgba(141,226,161,0.13)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 17, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
        ctx.stroke();
        ctx.restore();
        return;
      }
      const target = getHoveredPartyMember ? getHoveredPartyMember() : null;
      if (!target || target.dead || target.team !== "party") {
        return;
      }
      ctx.save();
      ctx.strokeStyle = "#8de2a1";
      ctx.fillStyle = "rgba(141,226,161,0.13)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.radius + 17, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    function showSupportFloat(text, color) {
      const origin = getSupportOrigin ? getSupportOrigin() : { x: input.mouse.x, y: input.mouse.y };
      addFloat(text, origin.x + 26, origin.y - 28, color);
    }

    normalizeSlots();

    return {
      getItemSlots,
      getItemSlotKeys,
      getItemSlotOwners,
      getItemCandidates,
      getItemDef,
      getItemOwnedCount,
      getItemInventoryCount,
      getItemEquippedCount,
      getItemCapacity,
      canUseInventoryItem,
      useInventoryItem,
      usePowerCrystalDFromBattleReward,
      addItem,
      getCharacterItem,
      setCharacterItem,
      clearCharacterItem,
      updateItemUsage,
      hasPendingItemUse,
      cancelItemUse,
      isItemUseControlling,
      useItemSlot,
      startItemAim,
      cancelItemAim,
      confirmItemAim,
      drawItemAimPreview,
    };
  };
})();
