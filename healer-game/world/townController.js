(() => {
  "use strict";

  window.createHealerTownController = function createHealerTownController(context) {
    const {
      input,
      game,
      town,
      player,
      playerProfile,
      party,
      enemies,
      projectiles,
      telegraphs,
      areas,
      effects,
      TOWN_DATA,
      EQUIPMENT_DATA,
      MATERIAL_DATA,
      QUEST_DATA,
      TOWN_WIDTH,
      TOWN_HEIGHT,
      resetGame,
      clampTownPlayer,
      clamp,
      distPoint,
      updateProfileNameInput,
      beginOpeningStory,
      getPlayerFirstName,
      getMeetingStory,
      getKeybindLabel,
      getGold,
      formatGold,
      canAffordGold,
      spendGold,
      addGold,
      getItemCandidates,
      getItemDef,
      getItemOwnedCount,
      getItemCapacity,
      addItem,
      resolveEquipmentItem,
      createEquipmentInstance,
      getEquipmentOwnedCount: getEquipmentOwnedCountFromSystem,
      getEquipmentUpgradeLevel: getEquipmentUpgradeLevelFromSystem,
      setEquipmentUpgradeLevel: setEquipmentUpgradeLevelFromSystem,
      resetEquipmentUpgrade: resetEquipmentUpgradeFromSystem,
      getEquipmentRandomStatUpgradeTarget,
      rerollEquipmentRandomStats: rerollEquipmentRandomStatsFromSystem,
      getEquipmentItemRef,
      getEquipmentBaseItemId,
    } = context;

    const INCAPACITATED_HP_RECOVERY_RATIO = 0.2;
    const INN_REST_COST = 100;

    function keyLabel(actionId, fallback) {
      return typeof getKeybindLabel === "function" ? getKeybindLabel(actionId) || fallback : fallback;
    }

    function getPersistentHp(member) {
      const maxHp = Number.isFinite(member.maxHp) ? member.maxHp : member.hp;
      const hp = member.dead || member.hp <= 0
        ? maxHp * INCAPACITATED_HP_RECOVERY_RATIO
        : member.hp;
      return clamp(hp, 0, maxHp);
    }

    function getPersistentMp(member) {
      const maxMp = Math.max(0, Number.isFinite(member.maxMp) ? member.maxMp : member.mp || 0);
      const mp = Number.isFinite(member.mp) ? member.mp : maxMp;
      return clamp(mp, 0, maxMp);
    }

    function savePartyHp() {
      game.partyHpById = game.partyHpById && typeof game.partyHpById === "object"
        ? game.partyHpById
        : {};
      game.partyMpById = game.partyMpById && typeof game.partyMpById === "object"
        ? game.partyMpById
        : {};
      for (const member of party) {
        if (!member || !member.id) {
          continue;
        }
        if (Number.isFinite(member.hp)) {
          const hp = getPersistentHp(member);
          game.partyHpById[member.id] = hp;
          member.hp = hp;
          if (hp > 0) {
            member.dead = false;
          }
        }
        if (Number.isFinite(member.mp) || Number.isFinite(member.maxMp)) {
          const mp = getPersistentMp(member);
          game.partyMpById[member.id] = mp;
          member.mp = mp;
        }
      }
    }

    function saveFullPartyHp() {
      game.partyHpById = game.partyHpById && typeof game.partyHpById === "object"
        ? game.partyHpById
        : {};
      game.partyMpById = game.partyMpById && typeof game.partyMpById === "object"
        ? game.partyMpById
        : {};
      for (const member of party) {
        if (!member || !member.id) {
          continue;
        }
        if (Number.isFinite(member.maxHp)) {
          game.partyHpById[member.id] = member.maxHp;
        }
        if (Number.isFinite(member.maxMp)) {
          game.partyMpById[member.id] = member.maxMp;
        }
      }
    }

    function startTown() {
      const returningFromBattle = game.state === "won" || game.state === "lost";
      if (returningFromBattle) {
        savePartyHp();
      }
      projectiles.length = 0;
      telegraphs.length = 0;
      areas.length = 0;
      effects.length = 0;
      enemies.length = 0;
      game.state = "town";
      game.time = 0;
      game.hover = null;
      game.stageClearTimer = 0;
      game.reinforcementsSpawned = false;
      game.currentQuest = null;
      game.message = "はじまりの町";
      game.messageTimer = 4;
      town.panel = null;
      town.selectedQuest = null;
      town.interaction = null;
      player.aim = null;
      if (town.buildings.length === 0) {
        setupTown();
      }
      if (!town.introDone) {
        const inn = getTownBuilding("inn");
        town.player.x = inn ? inn.door.x : TOWN_WIDTH * 0.5;
        town.player.y = inn ? inn.door.y + 52 : TOWN_HEIGHT - 155;
      } else {
        town.player.x = TOWN_WIDTH * 0.5;
        town.player.y = TOWN_HEIGHT - 155;
      }
      clampTownPlayer();
      initializeTownFollowers(true);
      resetTownTrail();
      town.interaction = getTownInteraction();
      updateTownCamera();
      updateProfileNameInput();
      if (!playerProfile.done) {
        town.story = null;
        return;
      }
      beginOpeningStory();
    }

    function setupTown() {
      town.buildings = TOWN_DATA.buildings.map((building) => makeTownBuilding(
        building.id,
        building.name,
        building.sign,
        building.x,
        building.y,
        building.w,
        building.h,
        building.wall,
        building.roof,
      ));

      town.props = TOWN_DATA.props.map((prop) => ({ ...prop }));
    }

    function makeTownBuilding(id, name, sign, x, y, w, h, wall, roof) {
      return {
        id,
        name,
        sign,
        x,
        y,
        w,
        h,
        wall,
        roof,
        door: { x: x + w / 2, y: y + h + 14 },
      };
    }

    function getTownBuilding(id) {
      return town.buildings.find((building) => building.id === id) || null;
    }

    function updateTown(dt = 0) {
      if (!playerProfile.done) {
        updateProfileNameInput();
        town.interaction = getTownInteraction();
        return;
      }
      if (town.story) {
        town.interaction = null;
        return;
      }
      updateTownMovement(dt);
      updateTownFollowers();
      town.interaction = getTownInteraction();
    }

    function updateTownCamera() {
      town.camera.x = 0;
      town.camera.y = 0;
    }

    function updateTownMovement(dt) {
      if (town.panel || dt <= 0) {
        return;
      }
      const keys = input.keys || {};
      const dx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      const dy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
      const len = Math.hypot(dx, dy);
      if (len <= 0) {
        return;
      }
      const speed = town.player.speed || 235;
      const vx = (dx / len) * speed * dt;
      const vy = (dy / len) * speed * dt;
      moveTownPlayerAxis(vx, 0);
      moveTownPlayerAxis(0, vy);
      appendTownTrailPoint();
    }

    function moveTownPlayerAxis(dx, dy) {
      const nextX = town.player.x + dx;
      const nextY = town.player.y + dy;
      if (!isTownBlockedAt(nextX, nextY, town.player.radius || 15)) {
        town.player.x = nextX;
        town.player.y = nextY;
      }
      clampTownPlayer();
    }

    function isTownBlockedAt(x, y, radius) {
      for (const building of town.buildings) {
        if (circleRectIntersects(x, y, radius, building.x - 10, building.y - 42, building.w + 20, building.h + 46)) {
          return true;
        }
      }
      for (const prop of town.props) {
        if (prop.type === "tree" || prop.type === "well") {
          const propRadius = (prop.r || 20) + radius + 5;
          if (distPoint(x, y, prop.x, prop.y) <= propRadius) {
            return true;
          }
        } else if (prop.type === "crate") {
          if (circleRectIntersects(x, y, radius, prop.x - 3, prop.y - 3, prop.w + 6, prop.h + 6)) {
            return true;
          }
        }
      }
      return false;
    }

    function circleRectIntersects(cx, cy, radius, rx, ry, rw, rh) {
      const closestX = clamp(cx, rx, rx + rw);
      const closestY = clamp(cy, ry, ry + rh);
      return distPoint(cx, cy, closestX, closestY) <= radius;
    }

    function initializeTownFollowers(force = false) {
      if (!town.meetingDone) {
        town.followers = [];
        return;
      }
      if (!force && Array.isArray(town.followers) && town.followers.length === 3) {
        return;
      }
      const startX = town.player.x;
      const startY = town.player.y;
      town.followers = [
        { id: "ulpes", label: "ウ", color: "#f4c54f", x: startX - 44, y: startY + 52 },
        { id: "rihas", label: "リ", color: "#e37a3f", x: startX, y: startY + 72 },
        { id: "sushia", label: "ス", color: "#b985ee", x: startX + 44, y: startY + 52 },
      ];
    }

    function resetTownTrail() {
      town.trail = [{ x: town.player.x, y: town.player.y }];
    }

    function appendTownTrailPoint() {
      if (!Array.isArray(town.trail) || town.trail.length === 0) {
        resetTownTrail();
        return;
      }
      const last = town.trail[town.trail.length - 1];
      if (distPoint(last.x, last.y, town.player.x, town.player.y) < 8) {
        return;
      }
      town.trail.push({ x: town.player.x, y: town.player.y });
      if (town.trail.length > 420) {
        town.trail.splice(0, town.trail.length - 420);
      }
    }

    function updateTownFollowers() {
      if (!town.meetingDone) {
        town.followers = [];
        return;
      }
      initializeTownFollowers();
      if (!Array.isArray(town.trail) || town.trail.length === 0) {
        resetTownTrail();
      }
      for (let i = 0; i < town.followers.length; i += 1) {
        const target = getTrailPointBehind((i + 1) * 58);
        town.followers[i].x = target.x;
        town.followers[i].y = target.y;
      }
    }

    function getTrailPointBehind(distance) {
      const trail = town.trail || [];
      if (trail.length === 0) {
        return { x: town.player.x, y: town.player.y };
      }
      let remaining = distance;
      let current = { x: town.player.x, y: town.player.y };
      for (let i = trail.length - 1; i >= 0; i -= 1) {
        const next = trail[i];
        const segment = distPoint(current.x, current.y, next.x, next.y);
        if (segment >= remaining && segment > 0) {
          const t = remaining / segment;
          return {
            x: current.x + (next.x - current.x) * t,
            y: current.y + (next.y - current.y) * t,
          };
        }
        remaining -= segment;
        current = next;
      }
      const fallback = trail[0];
      return { x: fallback.x, y: fallback.y };
    }
    function getTownInteraction() {
      if (town.panel || town.story) {
        return null;
      }
      let best = null;
      let bestDist = Infinity;
      for (const building of town.buildings) {
        const d = distPoint(town.player.x, town.player.y, building.door.x, building.door.y);
        if (d <= 82 && d < bestDist) {
          best = building;
          bestDist = d;
        }
      }
      return best;
    }

    function interactTown(options = {}) {
      if (town.story) {
        advanceTownStory();
        return;
      }
      if (town.panel) {
        const clicked = options.pointer ? getTownPanelClickAction() : null;
        if (clicked) {
          runTownPanelAction(clicked);
        } else if (town.panel.confirmation) {
          clearEquipmentResetConfirmation();
        } else if (town.panel.upgradeResult) {
          clearEquipmentUpgradeResult();
        } else if (options.pointer && ["inn", "itemShop", "equipmentShop"].includes(town.panel.action)) {
          return;
        } else if (!options.pointer && town.panel.action === "itemShop" && town.panel.buyQuantityFocusItemId) {
          buyShopItem(town.panel.buyQuantityFocusItemId);
        } else if (options.pointer && ["questType", "questList", "questDecision"].includes(town.panel.action)) {
          return;
        } else if (town.panel.action === "questType") {
          showQuestListPanel("story");
        } else if (town.panel.action === "questList") {
          selectFirstQuestInPanel();
        } else if (town.panel.action === "questDecision") {
          confirmSelectedQuest();
        } else if (town.panel.action === "battleGuide") {
          resetGame(town.selectedQuest);
        } else {
          closeTownPanel();
        }
        return;
      }

      const target = getTownInteraction();
      if (!target) {
        return;
      }

      if (target.id === "inn") {
        showInnPanel();
      } else if (target.id === "item") {
        showItemShopPanel();
      } else if (target.id === "weapon") {
        showEquipmentShopPanel("weapon");
      } else if (target.id === "armor") {
        showEquipmentShopPanel("armor");
      } else if (target.id === "guild") {
        if (!town.meetingDone) {
          startGuildMeetingStory();
          return;
        }
        showQuestTypePanel();
      }
    }

    function showQuestTypePanel() {
      town.selectedQuest = null;
      town.panel = {
        title: "依頼所",
        action: "questType",
        clickTargets: [],
      };
    }

    function showQuestListPanel(typeKey) {
      const type = getQuestType(typeKey);
      town.selectedQuest = null;
      town.panel = {
        title: type ? type.name : "依頼一覧",
        action: "questList",
        questType: typeKey,
        quests: getQuestsByType(typeKey),
        clickTargets: [],
      };
    }

    function showQuestDecisionPanel(questId) {
      const quest = getQuestById(questId);
      if (!quest) {
        game.message = "依頼データが見つからない";
        game.messageTimer = 3;
        return;
      }
      town.selectedQuest = quest;
      town.panel = {
        title: "依頼の決定",
        action: "questDecision",
        questId: quest.id,
        clickTargets: [],
      };
    }

    function confirmSelectedQuest() {
      const quest = town.selectedQuest || getQuestById(town.panel && town.panel.questId);
      if (!quest) {
        game.message = "依頼を選択してください";
        game.messageTimer = 3;
        return;
      }
      town.selectedQuest = quest;
      showBattleGuidePanel(quest);
    }

    function selectFirstQuestInPanel() {
      if (!town.panel || !Array.isArray(town.panel.quests) || town.panel.quests.length === 0) {
        return;
      }
      showQuestDecisionPanel(town.panel.quests[0].id);
    }

    function runTownPanelAction(action) {
      if (!action || action.kind === "noop") {
        return;
      }
      if (action.kind === "selectQuestType") {
        showQuestListPanel(action.type);
      } else if (action.kind === "selectQuest") {
        showQuestDecisionPanel(action.questId);
      } else if (action.kind === "confirmQuest") {
        confirmSelectedQuest();
      } else if (action.kind === "backToQuestTypes") {
        showQuestTypePanel();
      } else if (action.kind === "backToQuestList") {
        showQuestListPanel(action.type || (town.selectedQuest && town.selectedQuest.type) || "story");
      } else if (action.kind === "startBattle") {
        resetGame(town.selectedQuest);
      } else if (action.kind === "confirmInnRest") {
        confirmInnRest();
      } else if (action.kind === "buyItem") {
        buyShopItem(action.itemId);
      } else if (action.kind === "focusItemShopQuantity") {
        focusItemShopQuantity(action.itemId);
      } else if (action.kind === "adjustItemShopQuantity") {
        adjustItemShopQuantity(action.itemId, action.delta);
      } else if (action.kind === "selectEquipmentShopTab") {
        selectEquipmentShopTab(action.tab);
      } else if (action.kind === "craftEquipment") {
        craftEquipment(action.itemId);
      } else if (action.kind === "upgradeEquipment") {
        upgradeEquipment(action.equipmentRef || action.itemId);
      } else if (action.kind === "resetEquipmentUpgrade") {
        showEquipmentResetConfirmation("upgrade", action.equipmentRef || action.itemId);
      } else if (action.kind === "resetEquipmentStats") {
        showEquipmentResetConfirmation("stats", action.equipmentRef || action.itemId);
      } else if (action.kind === "confirmEquipmentReset") {
        confirmEquipmentReset();
      } else if (action.kind === "cancelEquipmentReset") {
        clearEquipmentResetConfirmation();
      } else if (action.kind === "closeEquipmentUpgradeResult") {
        clearEquipmentUpgradeResult();
      } else if (action.kind === "close") {
        closeTownPanel();
      }
    }

    function showInnPanel() {
      town.panel = {
        title: "宿屋",
        action: "inn",
        cost: INN_REST_COST,
        message: isInnRestLocked() ? "次の戦闘後まで利用できません。" : "",
        clickTargets: [],
      };
    }

    function confirmInnRest() {
      if (isInnRestLocked()) {
        setTownPanelMessage("次の戦闘後まで利用できません。");
        return;
      }
      if (!spendGoldSafe(INN_REST_COST)) {
        setTownPanelMessage(`所持金が足りません。${formatGoldSafe(INN_REST_COST)}必要です。`);
        return;
      }
      recoverPartyFull();
      saveFullPartyHp();
      game.innRestUsedUntilBattle = true;
      setTownPanelMessage(`全員が全回復しました。-${formatGoldSafe(INN_REST_COST)}`);
    }

    function isInnRestLocked() {
      return Boolean(game.innRestUsedUntilBattle);
    }

    function recoverPartyFull() {
      for (const member of getRecoveryMembers()) {
        member.hp = member.maxHp;
        member.mp = member.maxMp;
        member.dead = false;
        member.shield = 0;
        member.shieldTimer = 0;
        member.shields = [];
        member.frozen = 0;
        member.frozenMax = 0;
        member.burnTimer = 0;
        member.burnMax = 0;
        member.burnTick = 0;
        member.burnSource = null;
        member.delayedDamageQueue = [];
      }
    }

    function getRecoveryMembers() {
      const members = [];
      const seen = new Set();
      for (const member of [player, ...party]) {
        if (!member || !member.id || seen.has(member.id)) {
          continue;
        }
        seen.add(member.id);
        members.push(member);
      }
      return members;
    }

    function showItemShopPanel() {
      town.panel = {
        title: "アイテム屋",
        action: "itemShop",
        scroll: 0,
        scrollMax: 0,
        buyQuantities: {},
        buyQuantityFocusItemId: null,
        message: "",
        clickTargets: [],
      };
    }

    function buyShopItem(itemId) {
      const item = typeof getItemDef === "function" ? getItemDef(itemId) : null;
      if (!item) {
        setTownPanelMessage("商品データが見つかりません。");
        return;
      }
      const price = getItemPrice(item);
      if (price <= 0) {
        setTownPanelMessage("この商品はまだ販売価格が設定されていません。");
        return;
      }
      const quantity = getItemShopBuyQuantity(item.id);
      const totalPrice = price * quantity;
      if (!canAffordGoldSafe(totalPrice)) {
        setTownPanelMessage(`所持金が足りません。${formatGoldSafe(totalPrice)}必要です。`);
        return;
      }
      const added = typeof addItem === "function" ? addItem(item.id, quantity) : 0;
      if (added <= 0) {
        setTownPanelMessage(`${item.name || item.id}を購入できません。`);
        return;
      }
      spendGoldSafe(price * added);
      setTownPanelMessage(`${item.name || item.id}を${added}個購入しました。-${formatGoldSafe(price * added)}`);
    }

    function getItemPrice(item) {
      return Math.max(0, Math.floor(Number.isFinite(item && item.price) ? item.price : 0));
    }

    function focusItemShopQuantity(itemId) {
      if (!town.panel || town.panel.action !== "itemShop") {
        return;
      }
      town.panel.buyQuantityFocusItemId = itemId || null;
      town.panel.buyQuantityFreshFocus = true;
      if (itemId) {
        setItemShopBuyQuantity(itemId, getItemShopBuyQuantity(itemId));
      }
    }

    function adjustItemShopQuantity(itemId, delta) {
      setItemShopBuyQuantity(itemId, getItemShopBuyQuantity(itemId) + Math.floor(Number(delta) || 0));
      focusItemShopQuantity(itemId);
    }

    function setItemShopBuyQuantity(itemId, value) {
      if (!town.panel || town.panel.action !== "itemShop") {
        return;
      }
      if (!town.panel.buyQuantities || typeof town.panel.buyQuantities !== "object") {
        town.panel.buyQuantities = {};
      }
      const item = getItemDef ? getItemDef(itemId) : null;
      const price = getItemPrice(item);
      const maxByGold = price > 0 ? Math.max(1, Math.floor(getGoldSafe() / price)) : 99;
      const next = Math.max(1, Math.min(99, maxByGold || 1, Math.floor(Number(value) || 0)));
      town.panel.buyQuantities[itemId] = next;
    }

    function getItemShopBuyQuantity(itemId) {
      if (!town.panel || town.panel.action !== "itemShop") {
        return 1;
      }
      const values = town.panel.buyQuantities && typeof town.panel.buyQuantities === "object" ? town.panel.buyQuantities : {};
      const current = Number(values[itemId]);
      if (Number.isFinite(current) && current > 0) {
        return Math.floor(current);
      }
      return 1;
    }

    function showEquipmentShopPanel(shopKind) {
      const isWeapon = shopKind === "weapon";
      town.panel = {
        title: isWeapon ? "武器屋" : "防具屋",
        action: "equipmentShop",
        shopKind: isWeapon ? "weapon" : "armor",
        tab: "craft",
        scroll: 0,
        scrollMax: 0,
        message: "",
        clickTargets: [],
      };
    }

    function selectEquipmentShopTab(tab) {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      town.panel.tab = tab === "statReset" && town.panel.shopKind === "armor"
        ? "statReset"
        : tab === "reset" ? "reset" : tab === "upgrade" ? "upgrade" : "craft";
      town.panel.scroll = 0;
      town.panel.scrollMax = 0;
      town.panel.message = "";
      town.panel.upgradeResult = null;
      town.panel.confirmation = null;
    }

    function craftEquipment(itemId) {
      const item = getEquipmentItem(itemId);
      if (!item) {
        setTownPanelMessage("装備データが見つかりません。");
        return;
      }
      const recipe = getCraftRecipe(item);
      if (!recipe) {
        setTownPanelMessage("この装備にはまだ製作データがありません。");
        return;
      }
      if (!canPayRecipeCost(recipe)) {
        setTownPanelMessage("素材か所持金が足りません。");
        return;
      }
      if (!payRecipeCost(recipe)) {
        setTownPanelMessage("素材か所持金が足りません。");
        return;
      }
      const instanceId = typeof createEquipmentInstance === "function" ? createEquipmentInstance(item.id) : null;
      if (!instanceId && typeof createEquipmentInstance !== "function") {
        addEquipmentInventory(item.id, 1);
      } else if (!instanceId) {
        refundRecipeCost(recipe);
        setTownPanelMessage("装備の作成に失敗しました。素材は消費していません。");
        return;
      }
      const count = getEquipmentOwnedCount(item.id);
      const verb = town.panel && town.panel.shopKind === "weapon" ? "生成" : "製作";
      const craftedItem = instanceId && typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(instanceId) : item;
      setEquipmentUpgradeResult(buildEquipmentChangeResult({
        title: `${verb}結果`,
        baseItem: item,
        beforeItem: null,
        afterItem: craftedItem || item,
        beforeLevel: 0,
        afterLevel: getEquipmentUpgradeLevel(instanceId || item.id),
        beforeLabel: "",
        afterLabel: "入手装備",
        subtitle: buildCraftedEquipmentSubtitle(craftedItem || item, count),
        note: "手に入った装備のステータスです。",
        emptyText: "追加ステータスはありません。",
        singleColumn: true,
      }));
      setTownPanelMessage(`${item.name || item.id}を${verb}しました。所持 ${count}個`);
    }

    function buildCraftedEquipmentSubtitle(item, count) {
      const parts = [`所持 ${count}個`];
      if (item && item.rank) {
        parts.push(item.rank);
      }
      if (item && item.slot) {
        parts.push(getTownEquipmentSlotLabel(item.slot));
      }
      if (item && item.weaponType) {
        parts.push(item.weaponType);
      }
      return parts.filter(Boolean).join(" / ");
    }

    function getTownEquipmentSlotLabel(slot) {
      const labels = {
        weapon: "武器",
        armor: "防具",
        accessory: "アクセサリ",
      };
      return labels[slot] || slot || "装備";
    }

    function upgradeEquipment(itemRef) {
      const resolved = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(itemRef) : null;
      const itemId = typeof getEquipmentBaseItemId === "function" ? getEquipmentBaseItemId(itemRef) : itemRef;
      const item = resolved || getEquipmentItem(itemId);
      if (!item) {
        setTownPanelMessage("装備データが見つかりません。");
        return;
      }
      const recipe = getUpgradeRecipe(item);
      if (!recipe) {
        setTownPanelMessage("この装備にはまだ強化データがありません。");
        return;
      }
      if (!isEquipmentOwned(itemRef)) {
        setTownPanelMessage("この装備はまだ所持していません。");
        return;
      }
      const upgradeRef = typeof getEquipmentItemRef === "function" ? getEquipmentItemRef(item) : itemRef;
      const currentLevel = getEquipmentUpgradeLevel(upgradeRef);
      const maxLevel = Number.isFinite(recipe.maxLevel) ? recipe.maxLevel : 5;
      if (currentLevel >= maxLevel) {
        setTownPanelMessage("これ以上強化できません。");
        return;
      }
      const cost = getUpgradeCostForLevel(recipe, currentLevel);
      if (!payRecipeCost(cost)) {
        setTownPanelMessage("素材か所持金が足りません。");
        return;
      }
      const beforeItem = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(upgradeRef) : item;
      setEquipmentUpgradeLevel(upgradeRef, currentLevel + 1);
      const highlightedKey = typeof getEquipmentRandomStatUpgradeTarget === "function"
        ? getEquipmentRandomStatUpgradeTarget(upgradeRef, currentLevel + 1)
        : null;
      const afterItem = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(upgradeRef) : item;
      setEquipmentUpgradeResult(buildEquipmentChangeResult({
        title: "強化結果",
        baseItem: item,
        beforeItem,
        afterItem,
        beforeLevel: currentLevel,
        afterLevel: currentLevel + 1,
        highlightKeys: highlightedKey ? [highlightedKey] : [],
      }));
      setTownPanelMessage(`${item.name || item.id}を+${currentLevel + 1}に強化しました。`);
    }

    function resetEquipmentUpgrade(itemRef) {
      const resolved = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(itemRef) : null;
      const itemId = typeof getEquipmentBaseItemId === "function" ? getEquipmentBaseItemId(itemRef) : itemRef;
      const item = resolved || getEquipmentItem(itemId);
      if (!item) {
        setTownPanelMessage("装備データが見つかりません。");
        return;
      }
      if (!isEquipmentOwned(itemRef)) {
        setTownPanelMessage("この装備はまだ所持していません。");
        return;
      }
      const upgradeRef = typeof getEquipmentItemRef === "function" ? getEquipmentItemRef(item) : itemRef;
      const currentLevel = getEquipmentUpgradeLevel(upgradeRef);
      if (currentLevel <= 0) {
        setTownPanelMessage("この装備はまだ強化されていません。");
        return;
      }
      if (typeof resetEquipmentUpgradeFromSystem === "function") {
        resetEquipmentUpgradeFromSystem(upgradeRef);
      } else {
        setEquipmentUpgradeLevel(upgradeRef, 0);
        if (game.equipmentUpgradeRollsById && typeof game.equipmentUpgradeRollsById === "object") {
          delete game.equipmentUpgradeRollsById[upgradeRef];
        }
      }
      setTownPanelMessage(`${item.name || item.id}の強化をリセットしました。+${currentLevel} -> +0`);
    }

    function showEquipmentResetConfirmation(type, itemRef) {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      const resolved = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(itemRef) : null;
      const itemId = typeof getEquipmentBaseItemId === "function" ? getEquipmentBaseItemId(itemRef) : itemRef;
      const item = resolved || getEquipmentItem(itemId);
      if (!item) {
        setTownPanelMessage("装備データが見つかりません。");
        return;
      }
      const equipmentRef = typeof getEquipmentItemRef === "function" ? getEquipmentItemRef(item) : itemRef;
      const currentLevel = getEquipmentUpgradeLevel(equipmentRef);
      const resetCost = type === "stats" ? getEquipmentResetCost(item) : null;
      if (type === "stats" && !resetCost) {
        setTownPanelMessage("リセットコストが未設定です。");
        return;
      }
      const name = item.name || item.id || "装備";
      town.panel.confirmation = {
        type,
        equipmentRef,
        cost: resetCost,
        title: type === "stats" ? "ステータスリセット確認" : "強化リセット確認",
        message: type === "stats"
          ? `${name}の基礎ステータス割り振りを再抽選します。${currentLevel > 0 ? `強化Lvは+${currentLevel}から+0に戻ります。` : "強化Lvは+0のままです。"}`
          : `${name}の強化Lvを+${currentLevel}から+0に戻します。`,
        note: "この操作は実行後に元へ戻せません。",
        confirmLabel: type === "stats" ? "再抽選する" : "リセットする",
        cancelLabel: "やめる",
      };
    }

    function confirmEquipmentReset() {
      const confirmation = town.panel && town.panel.confirmation;
      if (!confirmation) {
        return;
      }
      const { type, equipmentRef } = confirmation;
      clearEquipmentResetConfirmation();
      if (type === "stats") {
        resetEquipmentStats(equipmentRef);
      } else {
        resetEquipmentUpgrade(equipmentRef);
      }
    }

    function clearEquipmentResetConfirmation() {
      if (town.panel) {
        town.panel.confirmation = null;
      }
    }

    function resetEquipmentStats(itemRef) {
      const resolved = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(itemRef) : null;
      const itemId = typeof getEquipmentBaseItemId === "function" ? getEquipmentBaseItemId(itemRef) : itemRef;
      const item = resolved || getEquipmentItem(itemId);
      if (!item) {
        setTownPanelMessage("装備データが見つかりません。");
        return;
      }
      if (!item.randomStatProfile) {
        setTownPanelMessage("この装備にはランダムステータスがありません。");
        return;
      }
      if (!isEquipmentOwned(itemRef)) {
        setTownPanelMessage("この装備はまだ所持していません。");
        return;
      }
      const equipmentRef = typeof getEquipmentItemRef === "function" ? getEquipmentItemRef(item) : itemRef;
      const currentLevel = getEquipmentUpgradeLevel(equipmentRef);
      const resetCost = getEquipmentResetCost(item);
      if (!payRecipeCost(resetCost)) {
        setTownPanelMessage("素材か所持金が足りません。");
        return;
      }
      const beforeItem = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(equipmentRef) : item;
      if (typeof resetEquipmentUpgradeFromSystem === "function") {
        resetEquipmentUpgradeFromSystem(equipmentRef);
      } else {
        setEquipmentUpgradeLevel(equipmentRef, 0);
      }
      if (typeof rerollEquipmentRandomStatsFromSystem === "function") {
        rerollEquipmentRandomStatsFromSystem(equipmentRef);
      } else {
        rerollEquipmentRandomStats(equipmentRef);
      }
      const afterItem = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(equipmentRef) : item;
      setEquipmentUpgradeResult(buildEquipmentChangeResult({
        title: "ステータスリセット結果",
        subtitle: currentLevel > 0 ? `+${currentLevel} -> +0 / ステータス再抽選` : "ステータス再抽選",
        baseItem: item,
        beforeItem,
        afterItem,
        beforeLevel: currentLevel,
        afterLevel: 0,
        beforeLabel: "リセット前",
        afterLabel: "リセット後",
        note: "強化Lvは+0に戻り、基礎ステータスを再抽選しました。",
      }));
      setTownPanelMessage(`${item.name || item.id}のステータスをリセットしました。`);
    }

    function setEquipmentUpgradeResult(result) {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      town.panel.upgradeResult = result || null;
      town.panel.resultScroll = 0;
      town.panel.resultScrollMax = 0;
    }

    function clearEquipmentUpgradeResult() {
      if (town.panel) {
        town.panel.upgradeResult = null;
        town.panel.resultScroll = 0;
        town.panel.resultScrollMax = 0;
      }
    }

    function buildEquipmentChangeResult(options = {}) {
      const { title, subtitle, baseItem, beforeItem, afterItem, beforeLevel, afterLevel, beforeLabel, afterLabel, highlightKeys, note, emptyText, singleColumn } = options;
      const highlightSet = new Set(Array.isArray(highlightKeys) ? highlightKeys : []);
      return {
        title: title || "強化結果",
        name: afterItem && afterItem.name || beforeItem && beforeItem.name || baseItem && baseItem.name || "装備",
        beforeLevel: Math.max(0, Math.floor(Number.isFinite(beforeLevel) ? beforeLevel : 0)),
        afterLevel: Math.max(0, Math.floor(Number.isFinite(afterLevel) ? afterLevel : 0)),
        beforeLabel: beforeLabel || "強化前",
        afterLabel: afterLabel || "強化後",
        subtitle,
        note: note || "",
        emptyText: emptyText || "",
        singleColumn: Boolean(singleColumn),
        entries: buildEquipmentUpgradeResultEntries(beforeItem, afterItem, highlightSet),
      };
    }

    function buildEquipmentUpgradeResultEntries(beforeItem, afterItem, highlightSet = new Set()) {
      const entries = [];
      const seen = new Set();
      addEquipmentUpgradeResultEntries(entries, seen, "flat", beforeItem && beforeItem.flatStatBonuses, afterItem && afterItem.flatStatBonuses, highlightSet);
      addEquipmentUpgradeResultEntries(entries, seen, "percent", beforeItem && beforeItem.statBonuses, afterItem && afterItem.statBonuses, highlightSet);
      return entries;
    }

    function addEquipmentUpgradeResultEntries(entries, seen, kind, beforeStats, afterStats, highlightSet) {
      const keys = new Set([
        ...Object.keys(beforeStats || {}),
        ...Object.keys(afterStats || {}),
      ]);
      for (const key of keys) {
        const before = getNumber(beforeStats && beforeStats[key]);
        const after = getNumber(afterStats && afterStats[key]);
        if (before === after || seen.has(`${kind}:${key}`)) {
          continue;
        }
        seen.add(`${kind}:${key}`);
        entries.push({
          key,
          label: getTownStatLabel(key),
          kind,
          before,
          after,
          delta: after - before,
          highlight: highlightSet.has(key),
        });
      }
    }

    function getTownStatLabel(statKey) {
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

    function getEquipmentItem(itemId) {
      const items = EQUIPMENT_DATA && EQUIPMENT_DATA.items ? EQUIPMENT_DATA.items : {};
      return items[itemId] || null;
    }

    function getCraftRecipe(item) {
      return item && (item.craft || item.craftCost || item.recipe || null);
    }

    function getUpgradeRecipe(item) {
      return item && (item.upgrade || item.upgradeCost || item.enhance || null);
    }

    function getUpgradeCostForLevel(recipe, currentLevel) {
      if (recipe && Array.isArray(recipe.costs)) {
        return recipe.costs[Math.max(0, Math.floor(currentLevel))] || null;
      }
      return recipe;
    }

    function getEquipmentResetCost(item) {
      const craftRecipe = getCraftRecipe(item);
      if (!craftRecipe) {
        return null;
      }
      const materials = {};
      for (const [key, count] of Object.entries(getRecipeMaterials(craftRecipe))) {
        const amount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
        if (key && amount > 0) {
          materials[key] = 1;
        }
      }
      return {
        gold: Math.ceil(getRecipeGoldCost(craftRecipe) / 2),
        materials,
      };
    }

    function payRecipeCost(recipe) {
      if (!canPayRecipeCost(recipe)) {
        return false;
      }
      spendRecipeCost(recipe);
      return true;
    }

    function canPayRecipeCost(recipe) {
      if (!recipe) {
        return false;
      }
      const goldCost = getRecipeGoldCost(recipe);
      const materials = getRecipeMaterials(recipe);
      return canAffordGoldSafe(goldCost) && canSpendMaterials(materials);
    }

    function spendRecipeCost(recipe) {
      const goldCost = getRecipeGoldCost(recipe);
      const materials = getRecipeMaterials(recipe);
      if (goldCost > 0 && !spendGoldSafe(goldCost)) {
        return false;
      }
      spendMaterials(materials);
      return true;
    }

    function refundRecipeCost(recipe) {
      const goldCost = getRecipeGoldCost(recipe);
      if (goldCost > 0) {
        addGoldSafe(goldCost);
      }
      addMaterials(getRecipeMaterials(recipe));
    }

    function getRecipeGoldCost(recipe) {
      return Math.max(0, Math.floor(
        Number.isFinite(recipe && recipe.gold) ? recipe.gold
          : Number.isFinite(recipe && recipe.costGold) ? recipe.costGold
            : Number.isFinite(recipe && recipe.price) ? recipe.price
              : 0
      ));
    }

    function getRecipeMaterials(recipe) {
      const raw = recipe && (recipe.materials || recipe.materialCost || {});
      if (Array.isArray(raw)) {
        return raw.reduce((acc, entry) => {
          if (entry && entry.key) {
            acc[entry.key] = Math.max(0, Math.floor(entry.count || entry.amount || 0));
          }
          return acc;
        }, {});
      }
      return raw && typeof raw === "object" ? raw : {};
    }

    function canSpendMaterials(materials) {
      const store = getMaterialStore();
      return Object.entries(materials).every(([key, count]) => {
        const required = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
        return !required || (Number.isFinite(store[key]) ? store[key] : 0) >= required;
      });
    }

    function spendMaterials(materials) {
      const store = getMaterialStore();
      for (const [key, count] of Object.entries(materials)) {
        const amount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
        if (amount > 0) {
          store[key] = Math.max(0, (Number.isFinite(store[key]) ? store[key] : 0) - amount);
        }
      }
    }

    function addMaterials(materials) {
      const store = getMaterialStore();
      for (const [key, count] of Object.entries(materials)) {
        const amount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
        if (key && amount > 0) {
          store[key] = (Number.isFinite(store[key]) ? store[key] : 0) + amount;
        }
      }
    }

    function getMaterialStore() {
      if (!game.materialsById || typeof game.materialsById !== "object") {
        game.materialsById = {};
      }
      return game.materialsById;
    }

    function addEquipmentInventory(itemId, count) {
      if (!game.equipmentInventoryById || typeof game.equipmentInventoryById !== "object") {
        game.equipmentInventoryById = {};
      }
      const key = String(itemId || "");
      if (!key) {
        return;
      }
      game.equipmentInventoryById[key] = (Number.isFinite(game.equipmentInventoryById[key]) ? game.equipmentInventoryById[key] : 0)
        + Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
    }

    function getEquipmentOwnedCount(itemId) {
      if (typeof getEquipmentOwnedCountFromSystem === "function") {
        return getEquipmentOwnedCountFromSystem(itemId);
      }
      if (!game.equipmentInventoryById || typeof game.equipmentInventoryById !== "object") {
        game.equipmentInventoryById = {};
      }
      return Math.max(0, Math.floor(Number.isFinite(game.equipmentInventoryById[itemId]) ? game.equipmentInventoryById[itemId] : 0));
    }

    function isEquipmentOwned(itemId) {
      const baseId = typeof getEquipmentBaseItemId === "function" ? getEquipmentBaseItemId(itemId) : itemId;
      const item = getEquipmentItem(baseId);
      const ref = typeof getEquipmentItemRef === "function" ? getEquipmentItemRef(itemId) : itemId;
      const isInstance = ref && game.equipmentInstancesById && game.equipmentInstancesById[ref];
      return Boolean(item && (isInstance || String(item.id || "").startsWith("default_") || item.material === "製作不可" || getEquipmentOwnedCount(baseId) > 0));
    }

    function rerollEquipmentRandomStats(itemId) {
      if (typeof context.rerollEquipmentRandomStats === "function") {
        context.rerollEquipmentRandomStats(itemId);
        return;
      }
      if (!game.equipmentRandomStatsById || typeof game.equipmentRandomStatsById !== "object") {
        game.equipmentRandomStatsById = {};
      }
      if (!game.equipmentRandomSeedsById || typeof game.equipmentRandomSeedsById !== "object") {
        game.equipmentRandomSeedsById = {};
      }
      game.equipmentRandomSeedsById[itemId] = Math.floor(Math.random() * 1000000000);
      delete game.equipmentRandomStatsById[itemId];
    }

    function getEquipmentUpgradeLevel(itemId) {
      if (typeof getEquipmentUpgradeLevelFromSystem === "function") {
        return getEquipmentUpgradeLevelFromSystem(itemId);
      }
      if (!game.equipmentUpgradeById || typeof game.equipmentUpgradeById !== "object") {
        game.equipmentUpgradeById = {};
      }
      return Math.max(0, Math.floor(Number.isFinite(game.equipmentUpgradeById[itemId]) ? game.equipmentUpgradeById[itemId] : 0));
    }

    function setEquipmentUpgradeLevel(itemId, level) {
      if (typeof setEquipmentUpgradeLevelFromSystem === "function") {
        setEquipmentUpgradeLevelFromSystem(itemId, level);
        return;
      }
      if (!game.equipmentUpgradeById || typeof game.equipmentUpgradeById !== "object") {
        game.equipmentUpgradeById = {};
      }
      game.equipmentUpgradeById[itemId] = Math.max(0, Math.floor(Number.isFinite(level) ? level : 0));
    }

    function setTownPanelMessage(message) {
      if (town.panel) {
        town.panel.message = message || "";
      }
      game.message = message || "";
      game.messageTimer = message ? 3 : 0;
    }

    function canAffordGoldSafe(amount) {
      const cost = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
      if (typeof canAffordGold === "function") {
        return canAffordGold(cost);
      }
      const gold = typeof getGold === "function" ? getGold() : Number.isFinite(game.gold) ? game.gold : 0;
      return gold >= cost;
    }

    function spendGoldSafe(amount) {
      const cost = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
      if (typeof spendGold === "function") {
        return spendGold(cost);
      }
      if (!canAffordGoldSafe(cost)) {
        return false;
      }
      game.gold = Math.max(0, (Number.isFinite(game.gold) ? game.gold : 0) - cost);
      return true;
    }

    function addGoldSafe(amount) {
      const value = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
      if (value <= 0) {
        return;
      }
      if (typeof addGold === "function") {
        addGold(value);
        return;
      }
      game.gold = Math.max(0, (Number.isFinite(game.gold) ? game.gold : 0) + value);
    }

    function getGoldSafe() {
      if (typeof getGold === "function") {
        return getGold();
      }
      return Number.isFinite(game.gold) ? game.gold : 0;
    }

    function formatGoldSafe(amount) {
      if (typeof formatGold === "function") {
        return formatGold(amount);
      }
      return `${Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0))}G`;
    }

    function getNumber(value, fallback = 0) {
      return Number.isFinite(value) ? value : fallback;
    }

    function getTownPanelClickAction() {
      const targets = town.panel && Array.isArray(town.panel.clickTargets) ? town.panel.clickTargets : [];
      for (let i = targets.length - 1; i >= 0; i -= 1) {
        const target = targets[i];
        if (input.mouse.x >= target.x && input.mouse.x <= target.x + target.w && input.mouse.y >= target.y && input.mouse.y <= target.y + target.h) {
          return target.action;
        }
      }
      return null;
    }

    function getQuestType(typeKey) {
      return QUEST_DATA.types[typeKey] || null;
    }

    function getQuestTypes() {
      return Object.values(QUEST_DATA.types);
    }

    function getQuestById(questId) {
      return QUEST_DATA.quests.find((quest) => quest.id === questId) || null;
    }

    function getQuestsByType(typeKey) {
      return QUEST_DATA.quests.filter((quest) => quest.type === typeKey);
    }

    function showBattleGuidePanel(quest = town.selectedQuest) {
      if (quest) {
        town.selectedQuest = quest;
      }
      const skillLabels = [1, 2, 3, 4, 5].map((index) => keyLabel(`battle.skill${index}`, ["Q", "W", "E", "R", "T"][index - 1])).join("/");
      const itemLabels = [1, 2, 3, 4].map((index) => keyLabel(`battle.item${index}`, ["C", "V", "B", "N"][index - 1])).join("/");
      const fireLabel = keyLabel("battle.confirm", "左クリック");
      const cancelLabel = keyLabel("battle.cancelAim", "右クリック");
      const pageLabel = keyLabel("battle.skillPage", "Space");
      const menuLabel = keyLabel("common.menuBack", "Esc");
      const ultLabels = {
        ulpes: keyLabel("battle.ultimate.ulpes", "1"),
        rihas: keyLabel("battle.ultimate.rihas", "2"),
        sushia: keyLabel("battle.ultimate.sushia", "3"),
        finald: keyLabel("battle.ultimate.finald", "4"),
      };
      town.panel = {
        title: quest ? `出発前の確認: ${quest.name}` : "出発前の確認",
        action: "battleGuide",
        questId: quest ? quest.id : null,
        clickTargets: [],
        sections: [
          quest ? {
            title: "依頼内容",
            lines: [
              `ランク: ${quest.rank || "-"}`,
              `目的: ${quest.objective || "敵を全滅させる"}`,
              `敵情報: ${quest.enemyPreview || "不明"}`,
              `報酬: ${quest.reward || "未定"}`,
            ],
          } : null,
          {
            title: "戦闘の基本",
            lines: [
              "移動は自動。基本距離を保ち、危険な予兆もできる範囲で避ける。",
              "射程外のスキルは発動位置まで移動予約し、射程内で詠唱を始める。",
              `構え中は${fireLabel}で発動、${cancelLabel}でキャンセル。`,
              "ヒール/シェルトはカーソル上の味方、攻撃スキルは敵や地点を狙う。",
              "指示スキルは通常スキル枠にセットし、味方への指示や敵へのフォーカスに使う。",
            ],
          },
          {
            title: "操作",
            lines: [
              `左5枠: ${skillLabels} / 必殺: ${ultLabels.finald} / ページ切替: ${pageLabel}`,
              `${fireLabel}: 発動 / ${cancelLabel}: 構えキャンセル / アイテム: ${itemLabels}`,
              `右上メニューまたは${menuLabel}: 設定・装備確認。戦闘中は時間停止。`,
              `${ultLabels.ulpes}/${ultLabels.rihas}/${ultLabels.sushia}: 仲間の必殺技 / 勝利条件: 敵全滅`,
            ],
          },
          {
            title: "調子と必殺技",
            lines: [
              "調子はHPが高いほど上がり、低いほど下がる。高すぎると慢心、低すぎると萎縮する。",
              "ウルペスは真っ二つ、リハスはまとめてかかってこい、スシアはアイスワールド。",
              `${getPlayerFirstName()}のストレプションは全味方を回復し、HPが低い味方ほど回復量が増える。`,
            ],
          },
        ].filter(Boolean),
      };
    }

    function closeTownPanel() {
      town.panel = null;
    }

    function startGuildMeetingStory() {
      if (town.story || town.meetingDone) {
        return;
      }
      closeTownPanel();
      startTownStory("meeting", getMeetingStory(), () => {
        town.meetingDone = true;
        initializeTownFollowers(true);
        resetTownTrail();
        game.message = "依頼所で依頼を受けよう";
        game.messageTimer = 5;
      });
    }

    function startTownStory(id, lines, onComplete) {
      town.story = {
        id,
        lines,
        index: 0,
        onComplete,
      };
    }

    function advanceTownStory() {
      if (!town.story) {
        return;
      }
      town.story.index += 1;
      if (town.story.index < town.story.lines.length) {
        return;
      }
      const complete = town.story.onComplete;
      town.story = null;
      if (complete) {
        complete();
      }
    }

    return {
      startTown,
      setupTown,
      makeTownBuilding,
      getTownBuilding,
      updateTown,
      updateTownCamera,
      getTownInteraction,
      interactTown,
      showBattleGuidePanel,
      closeTownPanel,
      showQuestTypePanel,
      showQuestListPanel,
      showQuestDecisionPanel,
      startGuildMeetingStory,
      startTownStory,
      advanceTownStory,
      getQuestTypes,
      getQuestsByType,
      getQuestById,
    };
  };
})();
