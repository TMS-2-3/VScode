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
      tileMapSystem,
      TOWN_DATA,
      STATUS_DATA,
      ENEMY_DEFS,
      EQUIPMENT_DATA,
      MATERIAL_DATA,
      QUEST_DATA,
      NPC_DATA,
      TOWN_WIDTH,
      TOWN_HEIGHT,
      preloadMapEnemySprites,
      preloadBattleEnemySprites,
      resetGame,
      clampTownPlayer,
      clamp,
      distPoint,
      updateProfileNameInput,
      beginOpeningStory,
      getPlayerFirstName,
      getMeetingStory,
      getQuestAcceptedStory,
      getQuestEncounterStory,
      getQuestCompletedStory,
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
      getEquipmentItemRef,
      getEquipmentBaseItemId,
    } = context;

    const INN_REST_COST = 100;
    const TUTORIAL_STORY_QUEST_ID = "story_horn_rabbit_competition_001";
    const STORY_PATH_AHEAD_QUEST_ID = "story_path_ahead_001";
    const TUTORIAL_STORY_RETURN_MAP_ID = "startTown01";
    const TUTORIAL_STORY_RETURN_COL = 19;
    const TUTORIAL_STORY_RETURN_ROW = 17;
    const TOWN_RETURN_FADE_HOLD = 0.35;
    const TOWN_RETURN_FADE_DURATION = 0.85;
    const TOWN_QUEST_NOTICE_FADE_IN = 0.8;
    const TOWN_QUEST_NOTICE_HOLD = 2;
    const TOWN_QUEST_NOTICE_FADE = 1;
    const MAX_ACCEPTED_FREE_QUESTS = 3;
    const TOWN_WALK_ANIMATION_SEQUENCE = [2, 1, 3, 1];
    const TOWN_WALK_FRAME_INTERVAL = 0.16;
    const TOWN_MOVEMENT_KEYS = ["w", "a", "s", "d"];
    const TOWN_FOLLOWER_SPRITE_HEIGHT = 72;
    const EQUIPMENT_SHOP_RANK_FILTERS = ["D", "C", "B", "A", "S"];
    const EQUIPMENT_SHOP_WEAPON_TYPE_FILTERS = ["片手剣", "両手剣", "拳具", "棒具", "杖", "魔導書", "楽器"];
    const EQUIPMENT_SHOP_UNIT_FILTERS = ["ulpes", "rihas", "sushia", "finald"];
    const EQUIPMENT_SHOP_ARMOR_SLOT_FILTERS = ["head", "body", "hands", "waist", "feet", "accessory"];
    const EQUIPMENT_SHOP_ARMOR_BASIC_STAT_FILTERS = ["maxHp", "maxMp", "attack", "magic", "defense", "magicDefense"];
    const EQUIPMENT_SHOP_ARMOR_DETAIL_STAT_FILTERS = [
      "critChance", "critDamage", "guardChance", "guardDamageReduction", "damageBoost", "damageResistance",
      "physicalDamageBoost", "physicalDamageResistance", "magicDamageBoost", "magicDamageResistance",
      "hpRegenRate", "mpRegenRate", "castSpeed", "cooldownReduction", "actionSpeed", "ultimateChargeRate", "moveSpeed",
    ];
    const TOWN_TILE_MAP_BUILDING_IDS = {
      armorShopFront: "armor",
      weaponShopFront: "weapon",
      innFront: "inn",
      requestOfficeFront: "guild",
      itemShopFront: "item",
    };
    const TOWN_EVENT_ACTOR_LABELS = {
      ulpes: "ウ",
      rihas: "リ",
      sushia: "ス",
    };
    const TOWN_EVENT_ACTOR_COLORS = {
      ulpes: "#f4c54f",
      rihas: "#e37a3f",
      sushia: "#b985ee",
    };
    const SYMBOL_ENCOUNTER_MAX_PER_CONFIG = 3;
    const SYMBOL_ENCOUNTER_WANDER_INTERVAL = 2;
    const SYMBOL_ENCOUNTER_CHASE_INTERVAL = 1;
    const SYMBOL_ENCOUNTER_ALERT_RANGE = 3;
    const SYMBOL_ENCOUNTER_RELEASE_RANGE = 5;
    const SYMBOL_ENCOUNTER_PLAYER_SPAWN_EXCLUSION_RADIUS = 3;
    const SYMBOL_ENCOUNTER_TRANSFER_EXCLUSION_RADIUS = 2;
    const SYMBOL_ENCOUNTER_RANDOM_ATTEMPTS = 240;
    const ENCOUNTER_CUTIN_DURATION = 1.25;
    const TOWN_NPC_WANDER_INTERVAL = 2;
    const SYMBOL_ENCOUNTER_DIRECTIONS = [
      { x: 0, y: -1, facing: "up" },
      { x: 1, y: 0, facing: "right" },
      { x: 0, y: 1, facing: "down" },
      { x: -1, y: 0, facing: "left" },
    ];

    function getTownMapId() {
      const fallbackId = TOWN_DATA && typeof TOWN_DATA.tileMapId === "string" ? TOWN_DATA.tileMapId : null;
      const mapId = typeof town.mapId === "string" && town.mapId ? town.mapId : fallbackId;
      if (mapId && town.mapId !== mapId) {
        town.mapId = mapId;
      }
      return mapId;
    }

    function showTownMapNamePopup(tileMap, mapId) {
      const name = tileMap && (tileMap.name || tileMap.label || tileMap.title);
      const popupName = String(name || mapId || "").trim();
      town.mapNamePopup = popupName ? { name: popupName, age: 0 } : null;
    }

    function updateTownMapNamePopup(dt = 0) {
      const popup = town.mapNamePopup;
      if (!popup) {
        return;
      }
      popup.age = Math.max(0, Number(popup.age) || 0) + Math.max(0, Number(dt) || 0);
      if (popup.age >= 4) {
        town.mapNamePopup = null;
      }
    }

    function startTownReturnFade() {
      town.returnFade = {
        age: 0,
        hold: TOWN_RETURN_FADE_HOLD,
        fade: TOWN_RETURN_FADE_DURATION,
      };
    }

    function updateTownReturnFade(dt = 0) {
      const fade = town.returnFade;
      if (!fade) {
        return;
      }
      fade.age = Math.max(0, Number(fade.age) || 0) + Math.max(0, Number(dt) || 0);
      const hold = Math.max(0, Number(fade.hold) || 0);
      const duration = Math.max(0.01, Number(fade.fade) || TOWN_RETURN_FADE_DURATION);
      if (fade.age >= hold + duration) {
        town.returnFade = null;
      }
    }

    function showTownQuestNoticePopup(quest, options = {}) {
      if (!quest) {
        return;
      }
      const type = getQuestType(quest.type);
      const typeName = options.typeName || type && type.name || "依頼";
      const questName = String(options.questName || quest.name || "依頼");
      town.questNoticePopup = {
        age: 0,
        fadeIn: Math.max(0, Number(options.fadeIn) || TOWN_QUEST_NOTICE_FADE_IN),
        hold: Math.max(0, Number(options.hold) || TOWN_QUEST_NOTICE_HOLD),
        fade: Math.max(0.01, Number(options.fade) || TOWN_QUEST_NOTICE_FADE),
        typeName,
        questName,
        title: options.title || `${typeName}「${questName}」`,
        message: options.message || `${typeName}「${questName}」を受注しました`,
        onComplete: typeof options.onComplete === "function" ? options.onComplete : null,
      };
    }

    function updateTownQuestNoticePopup(dt = 0) {
      const popup = town.questNoticePopup;
      if (!popup) {
        return;
      }
      popup.age = Math.max(0, Number(popup.age) || 0) + Math.max(0, Number(dt) || 0);
      const fadeIn = Math.max(0, Number(popup.fadeIn) || TOWN_QUEST_NOTICE_FADE_IN);
      const hold = Math.max(0, Number(popup.hold) || TOWN_QUEST_NOTICE_HOLD);
      const fade = Math.max(0.01, Number(popup.fade) || TOWN_QUEST_NOTICE_FADE);
      if (popup.age >= fadeIn + hold + fade) {
        const onComplete = typeof popup.onComplete === "function" ? popup.onComplete : null;
        town.questNoticePopup = null;
        if (onComplete) {
          onComplete();
        }
      }
    }

    function getTownTileMap() {
      const mapId = getTownMapId();
      if (!mapId || !tileMapSystem || typeof tileMapSystem.getMap !== "function") {
        return null;
      }
      return tileMapSystem.getMap(mapId);
    }

    function getDefaultTownMapId() {
      return TOWN_DATA && typeof TOWN_DATA.tileMapId === "string" ? TOWN_DATA.tileMapId : null;
    }

    function getTownTileMapPixelSize(tileMap = getTownTileMap()) {
      if (tileMap && tileMapSystem && typeof tileMapSystem.getMapPixelSize === "function") {
        return tileMapSystem.getMapPixelSize(tileMap);
      }
      const tileSize = Math.max(1, Math.floor(Number(tileMap && tileMap.tileSize) || 48));
      return {
        w: Math.max(0, Math.floor(Number(tileMap && tileMap.width) || 0)) * tileSize || TOWN_WIDTH,
        h: Math.max(0, Math.floor(Number(tileMap && tileMap.height) || 0)) * tileSize || TOWN_HEIGHT,
      };
    }

    function placeTownPlayerAtMapCenter(tileMap = getTownTileMap()) {
      const size = getTownTileMapPixelSize(tileMap);
      town.player.x = Math.max(1, size.w) * 0.5;
      town.player.y = Math.max(1, size.h) * 0.5;
      town.player.gridMove = null;
      snapTownPlayerToGridCenter();
      clampTownPlayer();
    }

    function switchTownMap(mapId, options = {}) {
      if (!mapId || !tileMapSystem || typeof tileMapSystem.getMap !== "function") {
        return false;
      }
      const tileMap = tileMapSystem.getMap(mapId);
      if (!tileMap) {
        return false;
      }
      if (tileMapSystem && typeof tileMapSystem.clearMarginTileCache === "function") {
        tileMapSystem.clearMarginTileCache();
      }
      town.mapId = mapId;
      resetTownSymbolsForMapEntry(mapId);
      resetTownNpcsForMapEntry(mapId);
      showTownMapNamePopup(tileMap, mapId);
      town.panel = null;
      town.selectedQuest = null;
      town.interaction = null;
      town.player.gridMove = null;
      setupTown();
      const targetCol = Number.isFinite(options.targetCol) ? Math.floor(options.targetCol) : null;
      const targetRow = Number.isFinite(options.targetRow) ? Math.floor(options.targetRow) : null;
      if (targetCol !== null && targetRow !== null) {
        placeTownPlayerAtTile(tileMap, targetCol, targetRow);
      } else {
        placeTownPlayerAtMapCenter(tileMap);
      }
      initializeTownFollowers(true);
      resetTownTrail();
      ensureTownMapSymbols(tileMap);
      ensureTownMapNpcs(tileMap);
      town.interaction = getTownInteraction();
      updateTownCamera();
      return true;
    }

    function placeTownPlayerAtTile(tileMap, col, row) {
      if (!tileMap) {
        return false;
      }
      const targetTile = isTownGridTilePassable(tileMap, col, row)
        ? { col, row }
        : findNearestPassableTownTile(tileMap, col, row);
      if (!targetTile) {
        placeTownPlayerAtMapCenter(tileMap);
        return false;
      }
      const center = getTownTileCenter(tileMap, targetTile.col, targetTile.row);
      town.player.x = center.x;
      town.player.y = center.y;
      town.player.gridMove = null;
      clampTownPlayer();
      return true;
    }

    function getTownBuildingTemplateById(id) {
      return Array.isArray(TOWN_DATA && TOWN_DATA.buildings)
        ? TOWN_DATA.buildings.find((building) => building && building.id === id) || null
        : null;
    }

    function getTownBuildingIdFromMapEvent(event) {
      if (!event) {
        return null;
      }
      const tileId = event.tileId || event.tile || event.buildingTileId || null;
      if (tileId && TOWN_TILE_MAP_BUILDING_IDS[tileId]) {
        return TOWN_TILE_MAP_BUILDING_IDS[tileId];
      }
      const eventId = String(event.id || "");
      if (eventId.includes("armor")) return "armor";
      if (eventId.includes("weapon")) return "weapon";
      if (eventId.includes("inn")) return "inn";
      if (eventId.includes("request")) return "guild";
      if (eventId.includes("item")) return "item";
      return null;
    }

    function buildTownBuildingsFromTileMap(map) {
      const tileSize = Math.max(1, Math.floor(Number(map && map.tileSize) || 48));
      const events = Array.isArray(map && map.events) ? map.events : [];
      return events
        .filter((event) => event && (event.type === "buildingArea" || event.action === "buildingArea"))
        .map((event) => {
          const id = getTownBuildingIdFromMapEvent(event) || String(event.id || "building");
          const template = getTownBuildingTemplateById(id) || {};
          const x = Math.floor(Number(event.x ?? event.col) || 0) * tileSize;
          const y = Math.floor(Number(event.y ?? event.row) || 0) * tileSize;
          const w = Math.max(1, Math.floor(Number(event.width ?? event.w) || 1)) * tileSize;
          const h = Math.max(1, Math.floor(Number(event.height ?? event.h) || 1)) * tileSize;
          return {
            id,
            name: template.name || String(event.name || id),
            sign: template.sign || "",
            x,
            y,
            w,
            h,
            wall: template.wall || "#d7dce2",
            roof: template.roof || "#55616f",
            tileId: event.tileId || null,
            door: { x: x + w / 2, y: y + h + Math.max(10, Math.round(tileSize * 0.3)) },
          };
        });
    }

    function keyLabel(actionId, fallback) {
      return typeof getKeybindLabel === "function" ? getKeybindLabel(actionId) || fallback : fallback;
    }

    function getPersistentHp(member) {
      const maxHp = Number.isFinite(member.maxHp) ? member.maxHp : member.hp;
      const hp = member.dead || member.hp <= 0 ? 0 : member.hp;
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
      game.partyDeadById = game.partyDeadById && typeof game.partyDeadById === "object"
        ? game.partyDeadById
        : {};
      for (const member of party) {
        if (!member || !member.id) {
          continue;
        }
        const incapacitated = Boolean(member.dead || member.hp <= 0);
        if (Number.isFinite(member.hp)) {
          const hp = getPersistentHp(member);
          game.partyHpById[member.id] = hp;
          member.hp = hp;
        }
        if (incapacitated) {
          member.dead = true;
          game.partyDeadById[member.id] = true;
        } else {
          member.dead = false;
          delete game.partyDeadById[member.id];
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
      game.partyDeadById = game.partyDeadById && typeof game.partyDeadById === "object"
        ? game.partyDeadById
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
        delete game.partyDeadById[member.id];
      }
    }

    function savePartyStatuses() {
      game.partyStatusById = game.partyStatusById && typeof game.partyStatusById === "object"
        ? game.partyStatusById
        : {};
      const seen = new Set();
      for (const member of party) {
        if (!member || !member.id || seen.has(member.id)) {
          continue;
        }
        seen.add(member.id);
        const statuses = collectCarryoverStatuses(member);
        if (Object.keys(statuses).length > 0) {
          game.partyStatusById[member.id] = statuses;
        } else {
          delete game.partyStatusById[member.id];
        }
      }
    }

    function collectCarryoverStatuses(member) {
      const statuses = {};
      if (isStatusCarryover("buff_itaminasi") && (member.rihasPassiveStacks || 0) > 0 && (member.rihasPassiveTimer || 0) > 0) {
        statuses.buff_itaminasi = {
          stacks: Math.max(0, Math.floor(member.rihasPassiveStacks || 0)),
          timer: Math.max(0, member.rihasPassiveTimer || 0),
          cooldown: Math.max(0, member.rihasPassiveStackCooldown || 0),
        };
      }
      if (isStatusCarryover("buff_warmup") && (member.castStacks || 0) > 0 && (member.stackTimer || 0) > 0) {
        statuses.buff_warmup = {
          stacks: Math.max(0, Math.floor(member.castStacks || 0)),
          timer: Math.max(0, member.stackTimer || 0),
          cooldown: Math.max(0, member.stackCooldown || 0),
        };
      }
      if (isStatusCarryover("debuff_taunt") && (member.tauntTimer || 0) > 0) {
        statuses.debuff_taunt = {
          timer: Math.max(0, member.tauntTimer || 0),
          forcedTargetId: member.forcedTarget && member.forcedTarget.id || null,
        };
      }
      if (isStatusCarryover("debuff_freeze") && (member.frozen || 0) > 0) {
        statuses.debuff_freeze = {
          timer: Math.max(0, member.frozen || 0),
          max: Math.max(member.frozen || 0, member.frozenMax || 0),
        };
      }
      if (isStatusCarryover("debuff_burn") && (member.burnTimer || 0) > 0) {
        statuses.debuff_burn = {
          timer: Math.max(0, member.burnTimer || 0),
          max: Math.max(member.burnTimer || 0, member.burnMax || 0),
          tick: Math.max(0, member.burnTick || 0),
          tickRate: Math.max(0, member.burnTickRate || 1),
          damageHpRatio: Math.max(0, member.burnDamageHpRatio || 0),
        };
      }
      if (isStatusCarryover("debuff_sleep") && (member.sleepTimer || 0) > 0) {
        statuses.debuff_sleep = {
          timer: Math.max(0, member.sleepTimer || 0),
          max: Math.max(member.sleepTimer || 0, member.sleepMax || 0),
        };
      }
      if (isStatusCarryover("debuff_Injury") && (member.injuryTimer || 0) > 0) {
        statuses.debuff_Injury = {
          timer: Math.max(0, member.injuryTimer || 0),
          max: Math.max(member.injuryTimer || 0, member.injuryMax || 0),
        };
      }
      if (isStatusCarryover("debuff_poison") && member.poisonActive) {
        statuses.debuff_poison = {
          active: true,
          tick: Math.max(0, member.poisonTick || 0),
          tickRate: Math.max(0, member.poisonTickRate || 1),
          damageHpRatio: Math.max(0, member.poisonDamageHpRatio || 0.01),
        };
      }
      if (isStatusCarryover("debuff_wound") && (member.woundStacks || 0) > 0) {
        statuses.debuff_wound = {
          stacks: Math.max(0, Math.floor(member.woundStacks || 0)),
        };
      }
      return statuses;
    }

    function isStatusCarryover(statusId) {
      const status = STATUS_DATA && STATUS_DATA[statusId];
      const values = status ? [status.carryover, status.inherit, status.battleCarryover, status["引き継ぎ"]] : [];
      return values.some((value) => value === true || value === "あり" || value === "有" || value === "true" || value === "yes");
    }

    function clearSavedPartyStatuses() {
      game.partyStatusById = {};
    }

    function startTown() {
      const returningFromBattle = game.state === "won" || game.state === "lost";
      const pendingSaveRestore = !returningFromBattle && game.pendingTownRestoreFromSave && typeof game.pendingTownRestoreFromSave === "object"
        ? game.pendingTownRestoreFromSave
        : null;
      const completedQuest = game.currentQuest;
      const completedSymbolEncounter = returningFromBattle && game.state === "won"
        ? completedQuest && completedQuest.symbolEncounter
        : null;
      const completedTutorialStoryEncounter = Boolean(
        completedSymbolEncounter && completedSymbolEncounter.questId === TUTORIAL_STORY_QUEST_ID
      );
      const completedStoryQuest = completedSymbolEncounter && completedSymbolEncounter.questId
        ? getQuestById(completedSymbolEncounter.questId) || completedQuest
        : completedQuest;
      if (returningFromBattle) {
        savePartyHp();
        savePartyStatuses();
        if (game.state === "won") {
          recordTownEnemyVictoriesFromBattle(completedQuest, enemies);
        }
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
      if (pendingSaveRestore && pendingSaveRestore.mapId) {
        town.mapId = pendingSaveRestore.mapId;
      } else if (completedTutorialStoryEncounter) {
        town.mapId = TUTORIAL_STORY_RETURN_MAP_ID;
      } else if (completedSymbolEncounter && completedSymbolEncounter.mapId) {
        town.mapId = completedSymbolEncounter.mapId;
      }
      town.panel = null;
      town.selectedQuest = null;
      town.interaction = null;
      town.mapNamePopup = null;
      town.returnFade = null;
      town.questNoticePopup = null;
      player.aim = null;
      town.player.gridMove = null;
      if (getTownTileMap() || town.buildings.length === 0) {
        setupTown();
      }
      const restoredTownPlayerFromSave = pendingSaveRestore && restoreTownPlayerFromSave(pendingSaveRestore.player);
      if (restoredTownPlayerFromSave) {
        game.pendingTownRestoreFromSave = null;
      } else if (completedTutorialStoryEncounter) {
        placeTownPlayerAtTile(getTownTileMap(), TUTORIAL_STORY_RETURN_COL, TUTORIAL_STORY_RETURN_ROW);
        town.player.facing = "up";
      } else if (completedSymbolEncounter && Number.isFinite(completedSymbolEncounter.returnCol) && Number.isFinite(completedSymbolEncounter.returnRow)) {
        placeTownPlayerAtTile(getTownTileMap(), completedSymbolEncounter.returnCol, completedSymbolEncounter.returnRow);
      } else if (!town.introDone) {
        const inn = getTownBuilding("inn");
        town.player.x = inn ? inn.door.x : TOWN_WIDTH * 0.5;
        town.player.y = inn ? inn.door.y + 52 : TOWN_HEIGHT - 155;
      } else {
        town.player.x = TOWN_WIDTH * 0.5;
        town.player.y = TOWN_HEIGHT - 155;
      }
      if (!restoredTownPlayerFromSave) {
        snapTownPlayerToGridCenter();
      }
      if (pendingSaveRestore) {
        game.pendingTownRestoreFromSave = null;
      }
      clampTownPlayer();
      if (completedSymbolEncounter) {
        completeTownSymbolEncounter(completedSymbolEncounter);
      } else if (returningFromBattle && town.symbolEncounters) {
        ensureTownSymbolEncounterState().pendingBattle = null;
      }
      ensureTownMapSymbols();
      ensureTownMapNpcs();
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
      if (completedTutorialStoryEncounter && !town.story) {
        const storyLines = typeof getQuestCompletedStory === "function" ? getQuestCompletedStory(completedStoryQuest) : [];
        if (Array.isArray(storyLines) && storyLines.length > 0) {
          startTownReturnFade();
          startTownStory(`questCompleted:${TUTORIAL_STORY_QUEST_ID}`, storyLines, () => {
            acceptNextStoryQuestAfterTutorial();
          });
        }
      } else if (completedSymbolEncounter && completedStoryQuest && completedStoryQuest.type === "story" && !town.story) {
        const storyLines = typeof getQuestCompletedStory === "function" ? getQuestCompletedStory(completedStoryQuest) : [];
        if (Array.isArray(storyLines) && storyLines.length > 0) {
          startTownStory(`questCompleted:${completedStoryQuest.id}`, storyLines);
        }
      }
    }

    function setupTown() {
      const tileMap = getTownTileMap();
      if (tileMap) {
        town.buildings = buildTownBuildingsFromTileMap(tileMap);
        town.props = [];
        if (tileMapSystem && typeof tileMapSystem.preloadTileImages === "function") {
          tileMapSystem.preloadTileImages(tileMap);
        }
        if (town.buildings.length > 0 || getTownMapId() !== getDefaultTownMapId()) {
          return;
        }
      }

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
      updateTownMapNamePopup(dt);
      updateTownReturnFade(dt);
      updateTownQuestNoticePopup(dt);
      if (!playerProfile.done) {
        updateProfileNameInput();
        town.interaction = getTownInteraction();
        return;
      }
      if (updateEncounterCutin(dt)) {
        town.interaction = null;
        return;
      }
      if (town.story) {
        town.interaction = null;
        return;
      }
      if (town.questNoticePopup) {
        town.interaction = null;
        return;
      }
      updateTownMovement(dt);
      updateTownFollowers(dt);
      updateTownNpcs(getTownTileMap(), dt);
      updateTownSymbolEncounters(getTownTileMap(), dt);
      town.interaction = getTownInteraction();
    }

    function updateTownCamera() {
      const tileMap = getTownTileMap();
      if (!tileMap) {
        town.camera.x = 0;
        town.camera.y = 0;
        return;
      }
      town.camera.x = Number.isFinite(town.camera.x) ? town.camera.x : 0;
      town.camera.y = Number.isFinite(town.camera.y) ? town.camera.y : 0;
    }

    function getTownTileSize(tileMap = getTownTileMap()) {
      if (tileMap && tileMapSystem && typeof tileMapSystem.getTileSize === "function") {
        return tileMapSystem.getTileSize(tileMap);
      }
      return Math.max(1, Math.floor(Number(tileMap && tileMap.tileSize) || 48));
    }

    function getTownGridCollisionRadius(tileSize) {
      return Math.max(4, Math.min(town.player.radius || 15, tileSize * 0.18));
    }

    function getTownTileCenter(tileMap, col, row) {
      const tileSize = getTownTileSize(tileMap);
      return {
        x: (Math.floor(col) + 0.5) * tileSize,
        y: (Math.floor(row) + 0.5) * tileSize,
      };
    }

    function getTownPlayerTile(tileMap) {
      if (tileMap && tileMapSystem && typeof tileMapSystem.worldToTile === "function") {
        return tileMapSystem.worldToTile(tileMap, town.player.x, town.player.y);
      }
      const tileSize = getTownTileSize(tileMap);
      return {
        col: Math.floor(town.player.x / tileSize),
        row: Math.floor(town.player.y / tileSize),
      };
    }

    function getTownRawMapEvent(event) {
      return event && event.raw ? event.raw : event;
    }

    function getTownMapEventAction(event) {
      const raw = getTownRawMapEvent(event) || {};
      return event && event.action || raw.action || raw.type || "";
    }

    function isTownMapEventActive(event) {
      const raw = getTownRawMapEvent(event);
      if (!raw || raw.enabled === false) {
        return false;
      }
      if (raw.requiresProfileDone === true && !playerProfile.done) {
        return false;
      }
      if ((raw.disabledWhenMeetingDone === true || raw.onlyBeforeMeetingDone === true) && town.meetingDone) {
        return false;
      }
      if (raw.requiresMeetingDone === true && !town.meetingDone) {
        return false;
      }
      return true;
    }

    function townMapEventMatchesTile(event, col, row) {
      const raw = getTownRawMapEvent(event);
      if (!raw) {
        return false;
      }
      const eventCol = Math.floor(Number(raw.col ?? raw.x) || 0);
      const eventRow = Math.floor(Number(raw.row ?? raw.y) || 0);
      const width = Math.max(1, Math.floor(Number(raw.w ?? raw.width) || 1));
      const height = Math.max(1, Math.floor(Number(raw.h ?? raw.height) || 1));
      return col >= eventCol && row >= eventRow && col < eventCol + width && row < eventRow + height;
    }

    function getTownEventActors(tileMap = getTownTileMap()) {
      if (!tileMap || !playerProfile.done || town.meetingDone) {
        return [];
      }
      const events = Array.isArray(tileMap.events) ? tileMap.events : [];
      return events
        .filter((event) => {
          const action = getTownMapEventAction(event);
          return isTownMapEventActive(event) && (action === "partyJoinNpc" || action === "townNpc");
        })
        .map((event) => {
          const raw = getTownRawMapEvent(event) || {};
          const npcId = raw.npcId || raw.actorId || raw.characterId || raw.id;
          const col = Math.floor(Number(raw.col ?? raw.x) || 0);
          const row = Math.floor(Number(raw.row ?? raw.y) || 0);
          const center = getTownTileCenter(tileMap, col, row);
          return {
            id: npcId,
            eventId: raw.id || npcId,
            name: raw.name || npcId,
            x: center.x,
            y: center.y,
            color: raw.color || TOWN_EVENT_ACTOR_COLORS[npcId] || "#f7fff6",
            label: raw.label || TOWN_EVENT_ACTOR_LABELS[npcId] || String(raw.name || npcId || "?").slice(0, 1),
            facing: raw.facing || raw.direction || "down",
            walkFrame: 1,
            spriteHeight: Number.isFinite(town.player && town.player.spriteHeight) ? town.player.spriteHeight : TOWN_FOLLOWER_SPRITE_HEIGHT,
            showArgumentMark: raw.showArgumentMark !== false,
          };
        });
    }

    function ensureTownSymbolEncounterState() {
      if (!town.symbolEncounters || typeof town.symbolEncounters !== "object") {
        town.symbolEncounters = {};
      }
      if (!town.symbolEncounters.byMapId || typeof town.symbolEncounters.byMapId !== "object") {
        town.symbolEncounters.byMapId = {};
      }
      if (!Number.isFinite(town.symbolEncounters.nextId)) {
        town.symbolEncounters.nextId = 1;
      }
      return town.symbolEncounters;
    }

    function ensureTownNpcState() {
      if (!town.npcActorsByMapId || typeof town.npcActorsByMapId !== "object" || Array.isArray(town.npcActorsByMapId)) {
        town.npcActorsByMapId = {};
      }
      return town.npcActorsByMapId;
    }

    function ensureTownAcceptedQuestState() {
      if (!town.acceptedQuestIds || typeof town.acceptedQuestIds !== "object" || Array.isArray(town.acceptedQuestIds)) {
        town.acceptedQuestIds = {};
      }
      return town.acceptedQuestIds;
    }

    function ensureTownCompletedQuestState() {
      if (!town.completedQuestIds || typeof town.completedQuestIds !== "object" || Array.isArray(town.completedQuestIds)) {
        town.completedQuestIds = {};
      }
      return town.completedQuestIds;
    }

    function ensureTownEncounterStorySeenState() {
      if (!town.encounterStorySeenQuestIds || typeof town.encounterStorySeenQuestIds !== "object" || Array.isArray(town.encounterStorySeenQuestIds)) {
        town.encounterStorySeenQuestIds = {};
      }
      return town.encounterStorySeenQuestIds;
    }

    function ensureTownFreeQuestRollState() {
      if (!town.freeQuestRollsById || typeof town.freeQuestRollsById !== "object" || Array.isArray(town.freeQuestRollsById)) {
        town.freeQuestRollsById = {};
      }
      return town.freeQuestRollsById;
    }

    function ensureTownEnemyVictoryState() {
      if (!town.enemyVictoryByRole || typeof town.enemyVictoryByRole !== "object" || Array.isArray(town.enemyVictoryByRole)) {
        town.enemyVictoryByRole = {};
      }
      return town.enemyVictoryByRole;
    }

    function markTownEnemyVictory(role) {
      const key = String(role || "").trim();
      if (!key) {
        return;
      }
      ensureTownEnemyVictoryState()[key] = true;
    }

    function getTownQuestRequiredEnemyVictory(quest) {
      const role = quest && (
        quest.requiresEnemyVictory
        || quest.requiredEnemyVictory
        || quest.requiredEnemyVictoryRole
        || quest.requiredEnemyRole
        || quest.unlockEnemyId
      );
      return role ? String(role) : "";
    }

    function isTownEnemyVictoryUnlocked(role) {
      const key = String(role || "").trim();
      return !key || ensureTownEnemyVictoryState()[key] === true;
    }

    function recordTownEnemyVictoriesFromBattle(quest, battleEnemies) {
      const roles = new Set();
      const addRole = (role) => {
        const key = String(role || "").trim();
        if (key) {
          roles.add(key);
        }
      };
      if (Array.isArray(battleEnemies)) {
        for (const enemy of battleEnemies) {
          if (enemy && enemy.team === "enemy") {
            addRole(enemy.role || enemy.enemyId || enemy.type || enemy.id);
          }
        }
      }
      if (Array.isArray(quest && quest.enemies)) {
        for (const entry of quest.enemies) {
          addRole(entry && (entry.role || entry.enemyId || entry.type || entry.id));
        }
      }
      if (Array.isArray(quest && quest.fieldEnemies)) {
        for (const entry of quest.fieldEnemies) {
          addRole(entry && (entry.role || entry.enemyId || entry.type || entry.id));
        }
      }
      addRole(quest && (quest.fieldEnemyId || quest.enemyId || quest.role));
      for (const role of roles) {
        markTownEnemyVictory(role);
      }
    }

    function getTownRawQuestById(questId) {
      const id = String(questId || "");
      return QUEST_DATA && Array.isArray(QUEST_DATA.quests)
        ? QUEST_DATA.quests.find((quest) => quest && quest.id === id) || null
        : null;
    }

    function getTownQuestMapName(mapId) {
      if (!mapId || !tileMapSystem || typeof tileMapSystem.getMap !== "function") {
        return "";
      }
      const map = tileMapSystem.getMap(mapId);
      return String(map && (map.name || map.label || map.title) || "").trim();
    }

    function getTownQuestMapPool(quest) {
      const rawPool = Array.isArray(quest && quest.fieldMapPool)
        ? quest.fieldMapPool
        : Array.isArray(quest && quest.fieldMaps)
          ? quest.fieldMaps
          : null;
      const pool = rawPool
        ? rawPool.map((entry) => String(entry || "").trim()).filter(Boolean)
        : [];
      if (pool.length > 0) {
        return pool;
      }
      const mapId = String(quest && quest.fieldMapId || "").trim();
      return mapId ? [mapId] : [];
    }

    function isTownFreeQuestRollable(quest) {
      return Boolean(quest && quest.type === "free" && (
        getTownQuestMapPool(quest).length > 0
        || quest.rewardRollEnemyId
        || quest.rewardSourceEnemyId
      ));
    }

    function chooseTownQuestMapId(quest) {
      const pool = getTownQuestMapPool(quest);
      if (pool.length === 0) {
        return String(quest && quest.fieldMapId || "").trim();
      }
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function normalizeTownDropChance(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return 1;
      }
      return clamp(numeric > 1 ? numeric / 100 : numeric, 0, 1);
    }

    function normalizeTownDropReward(drop) {
      if (!drop) {
        return null;
      }
      const amount = Math.max(0, Math.floor(Number(drop.amount ?? drop.count ?? 1) || 0));
      if (amount <= 0) {
        return null;
      }
      if (drop.type === "currency" || drop.key === "gold" || drop.currency === "gold") {
        return {
          type: "currency",
          key: drop.key || drop.currency || "gold",
          name: drop.name || "お金",
          amount,
        };
      }
      if (drop.type === "material") {
        return {
          type: "material",
          key: drop.key || drop.id || drop.name || "material",
          name: drop.name || drop.id || drop.key || "素材",
          count: amount,
        };
      }
      return {
        type: "item",
        key: drop.key || drop.id || drop.name || "item",
        name: drop.name || drop.id || drop.key || "アイテム",
        count: amount,
      };
    }

    function isTownQuestRewardDropAllowed(quest, drop) {
      const reward = normalizeTownDropReward(drop);
      if (!reward) {
        return false;
      }
      if (reward.type === "currency") {
        return quest.rewardRollIncludeCurrency === true;
      }
      if (reward.type === "material") {
        return quest.rewardRollIncludeMaterials !== false;
      }
      return quest.rewardRollIncludeItems === true;
    }

    function getTownQuestRewardPool(quest) {
      const enemyId = String(quest && (quest.rewardSourceEnemyId || quest.rewardRollEnemyId || quest.fieldEnemyId) || "").trim();
      const enemy = enemyId && ENEMY_DEFS ? ENEMY_DEFS[enemyId] : null;
      const drops = Array.isArray(enemy && enemy.drops) ? enemy.drops : [];
      return drops
        .map((drop) => ({
          reward: normalizeTownDropReward(drop),
          weight: normalizeTownDropChance(drop && drop.chance),
          drop,
        }))
        .filter((entry) => entry.reward && entry.weight > 0 && isTownQuestRewardDropAllowed(quest, entry.drop));
    }

    function pickTownWeightedReward(pool) {
      const totalWeight = pool.reduce((sum, entry) => sum + Math.max(0, entry.weight || 0), 0);
      if (totalWeight <= 0) {
        return null;
      }
      let roll = Math.random() * totalWeight;
      for (const entry of pool) {
        roll -= Math.max(0, entry.weight || 0);
        if (roll <= 0) {
          return { ...entry.reward };
        }
      }
      return pool.length ? { ...pool[pool.length - 1].reward } : null;
    }

    function getTownRewardMergeKey(reward) {
      return `${reward && reward.type || "item"}:${reward && reward.key || reward && reward.name || ""}`;
    }

    function mergeTownRewardEntries(entries) {
      const merged = [];
      for (const reward of Array.isArray(entries) ? entries : []) {
        if (!reward) {
          continue;
        }
        const key = getTownRewardMergeKey(reward);
        const existing = merged.find((entry) => getTownRewardMergeKey(entry) === key);
        if (existing) {
          if (reward.type === "currency") {
            existing.amount = (existing.amount || 0) + (reward.amount || 0);
          } else {
            existing.count = (existing.count || 0) + (reward.count || 0);
          }
          continue;
        }
        merged.push({ ...reward });
      }
      return merged;
    }

    function rollTownQuestRewards(quest) {
      const count = Math.max(0, Math.floor(Number(quest && quest.rewardRollCount) || 0));
      if (count <= 0) {
        return [];
      }
      const pool = getTownQuestRewardPool(quest);
      const rewards = [];
      for (let i = 0; i < count; i += 1) {
        const reward = pickTownWeightedReward(pool);
        if (reward) {
          rewards.push(reward);
        }
      }
      return mergeTownRewardEntries(rewards);
    }

    function formatTownQuestRewardEntries(entries) {
      const rewards = mergeTownRewardEntries(entries);
      if (!rewards.length) {
        return "";
      }
      return rewards.map((reward) => {
        if (reward.type === "currency") {
          return formatGoldSafe(reward.amount || 0);
        }
        return `${reward.name || reward.key || "報酬"} x${Math.max(0, reward.count || reward.amount || 0)}`;
      }).join(" / ");
    }

    function cloneTownRewardEntries(entries) {
      return Array.isArray(entries) ? entries.map((entry) => ({ ...entry })) : [];
    }

    function rollTownFreeQuest(quest) {
      if (!isTownFreeQuestRollable(quest)) {
        return null;
      }
      const rolls = ensureTownFreeQuestRollState();
      const fieldMapId = chooseTownQuestMapId(quest);
      const rewards = rollTownQuestRewards(quest);
      const rewardText = formatTownQuestRewardEntries(rewards);
      const mapName = getTownQuestMapName(fieldMapId);
      const roll = {
        fieldMapId,
        fieldLocation: mapName || fieldMapId,
        rewards,
        reward: rewardText || quest.reward || "未定",
        rolledAt: Date.now(),
      };
      rolls[quest.id] = roll;
      return roll;
    }

    function ensureTownFreeQuestRoll(quest) {
      if (!isTownFreeQuestRollable(quest)) {
        return null;
      }
      const rolls = ensureTownFreeQuestRollState();
      const current = rolls[quest.id];
      if (current && typeof current === "object" && current.fieldMapId) {
        current.rewards = cloneTownRewardEntries(current.rewards);
        current.reward = current.reward || formatTownQuestRewardEntries(current.rewards) || quest.reward || "未定";
        current.fieldLocation = current.fieldLocation || getTownQuestMapName(current.fieldMapId) || current.fieldMapId;
        return current;
      }
      return rollTownFreeQuest(quest);
    }

    function getTownQuestView(quest) {
      if (!quest) {
        return null;
      }
      const requiredQuestId = getTownRequiredCompletedQuestIdFromSymbolConfig(quest);
      if (requiredQuestId && !isTownQuestCompleted(requiredQuestId) && !isTownQuestAccepted(quest.id) && !isTownQuestCompleted(quest.id)) {
        return quest;
      }
      const requiredEnemyRole = getTownQuestRequiredEnemyVictory(quest);
      if (requiredEnemyRole && !isTownEnemyVictoryUnlocked(requiredEnemyRole) && !isTownQuestAccepted(quest.id) && !isTownQuestCompleted(quest.id)) {
        return quest;
      }
      if (!isTownFreeQuestRollable(quest)) {
        return quest;
      }
      const roll = ensureTownFreeQuestRoll(quest);
      if (!roll) {
        return quest;
      }
      return {
        ...quest,
        fieldMapId: roll.fieldMapId || quest.fieldMapId,
        fieldLocation: roll.fieldLocation || quest.fieldLocation,
        reward: roll.reward || quest.reward,
        rewards: cloneTownRewardEntries(roll.rewards),
        rolledAt: roll.rolledAt || null,
      };
    }

    function shouldPlayTownQuestEncounterStory(quest) {
      if (!quest || !quest.id) {
        return false;
      }
      if (quest.encounterStoryOnce === true && ensureTownEncounterStorySeenState()[String(quest.id)] === true) {
        return false;
      }
      return true;
    }

    function markTownQuestEncounterStorySeen(quest) {
      if (!quest || !quest.id || quest.encounterStoryOnce !== true) {
        return;
      }
      ensureTownEncounterStorySeenState()[String(quest.id)] = true;
    }

    function getTownQuestIdFromSymbolConfig(config) {
      const questId = config && (config.questId || config.quest || config.questKey);
      return questId ? String(questId) : "";
    }

    function getTownRequiredCompletedQuestIdFromSymbolConfig(config) {
      const questId = config && (
        config.requiresQuestCompleted
        || config.requiredCompletedQuestId
        || config.requiredQuestCompleted
        || config.afterQuestId
        || config.unlockQuestId
      );
      return questId ? String(questId) : "";
    }

    function isTownQuestAccepted(questId) {
      if (!questId) {
        return false;
      }
      return ensureTownAcceptedQuestState()[String(questId)] === true;
    }

    function isTownQuestCompleted(questId) {
      if (!questId) {
        return false;
      }
      return ensureTownCompletedQuestState()[String(questId)] === true;
    }

    function isTownAcceptedFreeQuest(quest) {
      return Boolean(quest && quest.type === "free" && isTownQuestAccepted(quest.id));
    }

    function isTownQuestEnabled(quest) {
      if (!quest) {
        return false;
      }
      const accepted = isTownQuestAccepted(quest.id);
      const completed = isTownQuestCompleted(quest.id);
      if (quest.enabled === false && !accepted && !completed) {
        return false;
      }
      const requiredQuestId = getTownRequiredCompletedQuestIdFromSymbolConfig(quest);
      if (requiredQuestId && !isTownQuestCompleted(requiredQuestId) && !accepted && !completed) {
        return false;
      }
      const requiredEnemyRole = getTownQuestRequiredEnemyVictory(quest);
      if (requiredEnemyRole && !isTownEnemyVictoryUnlocked(requiredEnemyRole) && !accepted && !completed) {
        return false;
      }
      return true;
    }

    function isTownSymbolWildUnlocked(config) {
      const questId = getTownRequiredCompletedQuestIdFromSymbolConfig(config);
      return !questId || isTownQuestCompleted(questId);
    }

    function acceptTownQuest(quest) {
      if (!quest || !quest.id) {
        return false;
      }
      ensureTownAcceptedQuestState()[String(quest.id)] = true;
      return true;
    }

    function getTownQuestDestinationName(quest) {
      if (!quest) {
        return "";
      }
      if (quest.fieldMapId && tileMapSystem && typeof tileMapSystem.getMap === "function") {
        const map = tileMapSystem.getMap(quest.fieldMapId);
        const mapName = String(map && (map.name || map.label || map.title) || "").trim();
        if (mapName) {
          return mapName;
        }
      }
      return String(quest.destinationName || quest.fieldLocation || quest.recommended || "").trim();
    }

    function acceptNextStoryQuestAfterTutorial() {
      const quest = getQuestById(STORY_PATH_AHEAD_QUEST_ID);
      if (!quest || isTownQuestCompleted(quest.id)) {
        game.message = "クラク村に戻ってきました。";
        game.messageTimer = 4;
        return;
      }
      acceptTownQuest(quest);
      if (getTownMapId() === quest.fieldMapId) {
        ensureTownMapSymbols(getTownTileMap());
      }
      showTownQuestNoticePopup(quest, {
        onComplete: () => {
          game.message = `${quest.name}を受けました。${getTownQuestDestinationName(quest) || "出現場所"}へ向かいましょう。`;
          game.messageTimer = 5;
        },
      });
    }

    function clearTownAcceptedQuest(questId) {
      if (!questId) {
        return;
      }
      delete ensureTownAcceptedQuestState()[String(questId)];
    }

    function clearTownQuestSymbols(questId) {
      const id = String(questId || "");
      if (!id) {
        return;
      }
      const state = ensureTownSymbolEncounterState();
      const maps = state.byMapId && typeof state.byMapId === "object" ? state.byMapId : {};
      for (const mapState of Object.values(maps)) {
        if (!mapState || !Array.isArray(mapState.symbols)) {
          continue;
        }
        mapState.symbols = mapState.symbols.filter((symbol) => symbol && symbol.questId !== id);
      }
      if (state.pendingBattle && state.pendingBattle.questId === id) {
        state.pendingBattle = null;
      }
    }

    function completeTownQuest(questId) {
      if (!questId) {
        return;
      }
      ensureTownCompletedQuestState()[String(questId)] = true;
      const quest = getTownRawQuestById(questId);
      if (quest && quest.type === "free") {
        rollTownFreeQuest(quest);
      }
    }

    function isTownQuestCompletionBlocking(quest) {
      return Boolean(quest && quest.type === "story" && isTownQuestCompleted(quest.id));
    }

    function getTownAcceptedFreeQuestCount(ignoreQuestId = "") {
      const ignoredId = String(ignoreQuestId || "");
      return Object.keys(ensureTownAcceptedQuestState())
        .filter((questId) => questId && questId !== ignoredId)
        .filter((questId) => {
          const quest = getTownRawQuestById(questId);
          return Boolean(quest && quest.type === "free" && isTownQuestAccepted(questId));
        })
        .length;
    }

    function getTownAcceptedFreeQuestViews() {
      return Object.keys(ensureTownAcceptedQuestState())
        .filter((questId) => isTownQuestAccepted(questId))
        .map((questId) => getQuestById(questId))
        .filter((quest) => isTownAcceptedFreeQuest(quest));
    }

    function isTownFreeQuestAcceptLimitReached(quest) {
      return Boolean(
        quest
        && quest.type === "free"
        && !isTownQuestAccepted(quest.id)
        && getTownAcceptedFreeQuestCount(quest.id) >= MAX_ACCEPTED_FREE_QUESTS
      );
    }

    function isTownQuestUnavailable(quest) {
      return Boolean(quest && (
        !isTownQuestEnabled(quest)
        || isTownQuestAccepted(quest.id)
        || isTownQuestCompletionBlocking(quest)
      ));
    }

    function getTownQuestUnavailableMessage(quest) {
      if (!quest) {
        return "依頼データが見つからない";
      }
      if (!isTownQuestEnabled(quest)) {
        return "この依頼はまだ受けられません。";
      }
      if (isTownQuestAccepted(quest.id)) {
        return "この依頼は受注中です。";
      }
      if (isTownQuestCompletionBlocking(quest)) {
        return "この依頼はクリア済みです。";
      }
      if (isTownFreeQuestAcceptLimitReached(quest)) {
        return `フリー依頼を同時に受注できるのは${MAX_ACCEPTED_FREE_QUESTS}つまでです。`;
      }
      return "";
    }

    function getTownQuestDisplayOrder(quest) {
      if (!quest) {
        return 0;
      }
      if (quest.type === "story" && isTownQuestCompleted(quest.id)) {
        return 2;
      }
      if (isTownQuestAccepted(quest.id)) {
        return 1;
      }
      return 0;
    }

    function getTownSymbolMapId(tileMap = getTownTileMap()) {
      return String(tileMap && tileMap.id || getTownMapId() || "town");
    }

    function getTownSymbolMapState(mapId = getTownSymbolMapId()) {
      const state = ensureTownSymbolEncounterState();
      const key = String(mapId || "town");
      if (!state.byMapId[key] || typeof state.byMapId[key] !== "object") {
        state.byMapId[key] = { symbols: [], symbolSpritePreloadKey: "" };
      }
      const mapState = state.byMapId[key];
      if (!Array.isArray(mapState.symbols)) {
        mapState.symbols = [];
      }
      return mapState;
    }

    function resetTownSymbolsForMapEntry(mapId = getTownSymbolMapId()) {
      const state = ensureTownSymbolEncounterState();
      const key = String(mapId || "town");
      state.byMapId = {
        [key]: { symbols: [], symbolSpritePreloadKey: "" },
      };
      state.pendingBattle = null;
      return state.byMapId[key];
    }

    function getTownNpcMapState(mapId = getTownSymbolMapId()) {
      const state = ensureTownNpcState();
      const key = String(mapId || "town");
      if (!state[key] || typeof state[key] !== "object") {
        state[key] = { actors: [] };
      }
      const mapState = state[key];
      if (!Array.isArray(mapState.actors)) {
        mapState.actors = [];
      }
      return mapState;
    }

    function resetTownNpcsForMapEntry(mapId = getTownSymbolMapId()) {
      const state = ensureTownNpcState();
      const key = String(mapId || "town");
      state[key] = { actors: [] };
      return state[key];
    }

    function getTownNpcDataEntries() {
      const entries = NPC_DATA && NPC_DATA.npcs;
      if (Array.isArray(entries)) {
        return entries;
      }
      if (entries && typeof entries === "object") {
        return Object.values(entries);
      }
      return [];
    }

    function getTownNpcConfigId(config, index = 0) {
      const id = String(config && (config.id || config.npcId || config.actorId || config.name) || "").trim();
      return id || `npc_${index}`;
    }

    function getTownNpcConfigMapId(config, fallbackMapId) {
      return String(config && (config.mapId || config.map || config.fieldMapId) || fallbackMapId || "").trim();
    }

    function isTownNpcConfigActive(config) {
      if (!config || config.enabled === false) {
        return false;
      }
      if (config.requiresProfileDone === true && !playerProfile.done) {
        return false;
      }
      if (config.requiresMeetingDone === true && !town.meetingDone) {
        return false;
      }
      if (config.disabledWhenMeetingDone === true && town.meetingDone) {
        return false;
      }
      const requiredQuest = config.requiresQuestAccepted || config.requiredQuestAccepted || null;
      if (requiredQuest && !isTownQuestAccepted(requiredQuest)) {
        return false;
      }
      const requiredCompletedQuest = config.requiresQuestCompleted
        || config.requiredQuestCompleted
        || config.requiredCompletedQuestId
        || config.requiresCompletedQuestId
        || null;
      if (requiredCompletedQuest && !isTownQuestCompleted(requiredCompletedQuest)) {
        return false;
      }
      const disabledQuest = config.disabledWhenQuestCompleted || config.disableWhenQuestCompleted || null;
      if (disabledQuest && isTownQuestCompleted(disabledQuest)) {
        return false;
      }
      return true;
    }

    function parseTownMapCell(cell) {
      const text = String(cell || "").trim();
      if (!text) {
        return null;
      }
      const excelMatch = /^([A-Za-z]+)(\d+)$/.exec(text);
      if (excelMatch) {
        let col = 0;
        const letters = excelMatch[1].toUpperCase();
        for (let i = 0; i < letters.length; i += 1) {
          col = col * 26 + (letters.charCodeAt(i) - 64);
        }
        return {
          col: col - 1,
          row: Math.max(0, Math.floor(Number(excelMatch[2]) || 1) - 1),
        };
      }
      const pairMatch = /^(-?\d+)\s*[,/:\s]\s*(-?\d+)$/.exec(text);
      if (pairMatch) {
        return {
          col: Math.floor(Number(pairMatch[1])),
          row: Math.floor(Number(pairMatch[2])),
        };
      }
      return null;
    }

    function getTownNpcConfigTile(config, tileMap) {
      const parsed = parseTownMapCell(config && (config.cell || config.tile || config.position || config.coord));
      const col = parsed ? parsed.col : Math.floor(Number(config && (config.col ?? config.x ?? config.spawnCol ?? config.tileCol)));
      const row = parsed ? parsed.row : Math.floor(Number(config && (config.row ?? config.y ?? config.spawnRow ?? config.tileRow)));
      const width = Math.max(0, Math.floor(Number(tileMap && tileMap.width) || 0));
      const height = Math.max(0, Math.floor(Number(tileMap && tileMap.height) || 0));
      if (!Number.isFinite(col) || !Number.isFinite(row) || col < 0 || row < 0 || col >= width || row >= height) {
        return null;
      }
      if (!isTownGridTilePassable(tileMap, col, row)) {
        return null;
      }
      return { col, row };
    }

    function getTownNpcConfigs(tileMap = getTownTileMap()) {
      const mapId = getTownSymbolMapId(tileMap);
      const configs = [];
      for (const config of getTownNpcDataEntries()) {
        if (getTownNpcConfigMapId(config, mapId) === mapId) {
          configs.push(config);
        }
      }
      if (tileMap) {
        for (const key of ["npcs", "townNpcs", "npcActors"]) {
          if (Array.isArray(tileMap[key])) {
            configs.push(...tileMap[key].map((config) => ({ ...config, mapId })));
          }
        }
      }
      return configs.filter(isTownNpcConfigActive);
    }

    function getTownNpcWanderInterval(config) {
      const wander = config && config.wander;
      const raw = wander && typeof wander === "object"
        ? wander.interval ?? wander.seconds ?? wander.time
        : config && (config.wanderInterval ?? config.moveInterval);
      return Math.max(0.1, Number(raw) || TOWN_NPC_WANDER_INTERVAL);
    }

    function isTownNpcStationary(config) {
      const wander = config && config.wander;
      return config && (config.stationary === true || config.noMove === true)
        || wander === false
        || wander && typeof wander === "object" && wander.enabled === false;
    }

    function makeTownNpcActor(tileMap, mapId, config, configIndex) {
      const tile = getTownNpcConfigTile(config, tileMap);
      if (!tile) {
        return null;
      }
      const configId = getTownNpcConfigId(config, configIndex);
      const center = getTownTileCenter(tileMap, tile.col, tile.row);
      const spriteId = String(config.spriteId || config.characterId || config.unitId || "").trim();
      const spritePath = String(config.spritePath || config.imageFolder || config.folder || "").trim();
      const labelSource = String(config.label || config.name || configId || "N");
      return {
        type: "npc",
        id: `${mapId}:npc:${configId}`,
        mapId,
        configId,
        npcId: configId,
        name: String(config.name || config.label || configId),
        label: labelSource.slice(0, 2),
        color: config.color || "#f7fff6",
        spriteId: spriteId || null,
        spritePath: spritePath || null,
        spriteHeight: Math.max(32, Number(config.spriteHeight) || TOWN_FOLLOWER_SPRITE_HEIGHT),
        col: tile.col,
        row: tile.row,
        x: center.x,
        y: center.y,
        facing: config.facing || config.direction || "down",
        walkFrame: 1,
        walkFrameIndex: -1,
        walkTimer: 0,
        moveTimer: Math.random() * getTownNpcWanderInterval(config),
        wanderInterval: getTownNpcWanderInterval(config),
        stationary: isTownNpcStationary(config),
        rawConfig: config,
      };
    }

    function ensureTownMapNpcs(tileMap = getTownTileMap()) {
      if (!tileMap) {
        return [];
      }
      const mapId = getTownSymbolMapId(tileMap);
      const mapState = getTownNpcMapState(mapId);
      const configs = getTownNpcConfigs(tileMap);
      if (configs.length === 0) {
        mapState.actors = [];
        return mapState.actors;
      }
      const activeIds = new Set(configs.map((config, index) => getTownNpcConfigId(config, index)));
      mapState.actors = mapState.actors.filter((actor) => actor && activeIds.has(actor.configId));
      configs.forEach((config, index) => {
        const configId = getTownNpcConfigId(config, index);
        if (mapState.actors.some((actor) => actor && actor.configId === configId)) {
          return;
        }
        const actor = makeTownNpcActor(tileMap, mapId, config, index);
        if (actor) {
          mapState.actors.push(actor);
        }
      });
      return mapState.actors;
    }

    function getTownNpcActors(tileMap = getTownTileMap()) {
      return ensureTownMapNpcs(tileMap)
        .filter((actor) => actor && !actor.removed)
        .map((actor) => ({
          type: "npc",
          id: actor.id,
          npcId: actor.npcId,
          mapId: actor.mapId,
          name: actor.name,
          label: actor.label,
          color: actor.color,
          spriteId: actor.spriteId,
          spritePath: actor.spritePath,
          spriteHeight: actor.spriteHeight,
          x: actor.x,
          y: actor.y,
          col: actor.col,
          row: actor.row,
          facing: actor.facing || "down",
          walkFrame: actor.walkFrame || 1,
        }));
    }

    function getTownFieldQuestSymbolConfig(quest) {
      if (!quest || !quest.id || !quest.fieldMapId) {
        return null;
      }
      const fieldEnemies = Array.isArray(quest.fieldEnemies)
        ? quest.fieldEnemies.map((entry) => ({ ...entry })).filter(Boolean)
        : null;
      const fieldEnemyId = String(quest.fieldEnemyId || quest.enemyId || quest.role || "").trim();
      if ((!fieldEnemies || fieldEnemies.length === 0) && !fieldEnemyId) {
        return null;
      }
      const fieldEnemyCount = Math.max(1, Math.floor(Number(quest.fieldEnemyCount ?? quest.enemyCount ?? 1) || 1));
      const rawCol = quest.fieldTargetCol ?? quest.fieldSpawnCol ?? quest.spawnCol ?? quest.fixedCol;
      const rawRow = quest.fieldTargetRow ?? quest.fieldSpawnRow ?? quest.spawnRow ?? quest.fixedRow;
      const hasFixedTile = Number.isFinite(Number(rawCol)) && Number.isFinite(Number(rawRow));
      const config = {
        id: `quest_${quest.id}`,
        questId: quest.id,
        battleId: quest.battleId || quest.id,
        name: quest.name || "依頼シンボル",
        label: quest.name || "依頼シンボル",
        symbolLabel: quest.symbolLabel || "依",
        color: quest.symbolColor || (quest.type === "story" ? "#ffd86b" : "#f7fff6"),
        rank: quest.rank || "D",
        objective: quest.objective || "魔物を全滅させる",
        enemyPreview: quest.enemyPreview || null,
        reward: quest.reward || null,
        rewards: cloneTownRewardEntries(quest.rewards),
        maxSymbols: 1,
        radius: quest.symbolRadius || 16,
      };
      if (fieldEnemies && fieldEnemies.length > 0) {
        config.enemies = fieldEnemies;
      } else {
        config.enemyId = fieldEnemyId;
        config.enemyCount = fieldEnemyCount;
      }
      if (hasFixedTile) {
        config.spawnCol = Math.floor(Number(rawCol));
        config.spawnRow = Math.floor(Number(rawRow));
        config.stationary = quest.stationarySymbol !== false;
      }
      return config;
    }

    function getTownAcceptedFieldQuestSymbolConfigs(tileMap, existingQuestIds) {
      const mapId = getTownSymbolMapId(tileMap);
      if (!mapId || !QUEST_DATA || !Array.isArray(QUEST_DATA.quests)) {
        return [];
      }
      return QUEST_DATA.quests
        .map((quest) => getTownQuestView(quest))
        .filter((quest) => quest
          && quest.fieldMapId === mapId
          && isTownQuestAccepted(quest.id)
          && isTownQuestEnabled(quest)
          && !existingQuestIds.has(quest.id))
        .map((quest) => getTownFieldQuestSymbolConfig(quest))
        .filter(Boolean);
    }

    function getTownSymbolEncounterConfigs(tileMap = getTownTileMap()) {
      const wildConfigs = [];
      const questConfigs = [];
      if (tileMap) {
        for (const key of ["symbolEncounters", "monsterSymbols", "encounterSymbols"]) {
          if (Array.isArray(tileMap[key])) {
            wildConfigs.push(...tileMap[key]);
          }
        }
        for (const key of ["questSymbolEncounters", "questMonsterSymbols", "questEncounterSymbols"]) {
          if (Array.isArray(tileMap[key])) {
            questConfigs.push(...tileMap[key]);
          }
        }
      }
      const existingQuestIds = new Set();
      for (const config of questConfigs.concat(wildConfigs)) {
        const questId = getTownQuestIdFromSymbolConfig(config);
        if (questId) {
          existingQuestIds.add(questId);
        }
      }
      questConfigs.push(...getTownAcceptedFieldQuestSymbolConfigs(tileMap, existingQuestIds));
      const activeWildConfigs = wildConfigs.filter((config) => (
        config
        && config.enabled !== false
        && !getTownQuestIdFromSymbolConfig(config)
        && isTownSymbolWildUnlocked(config)
      ));
      const activeQuestConfigs = questConfigs
        .concat(wildConfigs.filter((config) => config && getTownQuestIdFromSymbolConfig(config)))
        .filter((config) => (
          config
          && config.enabled !== false
          && isTownQuestAccepted(getTownQuestIdFromSymbolConfig(config))
          && isTownQuestEnabled(getQuestById(getTownQuestIdFromSymbolConfig(config)))
        ));
      return activeWildConfigs.concat(activeQuestConfigs);
    }

    function getTownSymbolConfigId(config, index = 0) {
      const baseId = String(
        config.id
        || config.key
        || config.symbolId
        || config.enemyId
        || config.role
        || `symbol_${index + 1}`,
      );
      const questId = getTownQuestIdFromSymbolConfig(config);
      return questId ? `quest:${questId}:${baseId}` : `wild:${baseId}`;
    }

    function getTownSymbolMaxCount(config) {
      const value = Math.floor(Number(config && (config.maxSymbols ?? config.max ?? config.countPerMap)) || SYMBOL_ENCOUNTER_MAX_PER_CONFIG);
      return Math.max(0, Math.min(SYMBOL_ENCOUNTER_MAX_PER_CONFIG, value));
    }

    function getTownSymbolRandomEnemyCountRange(config) {
      const range = Array.isArray(config && config.enemyCountRange)
        ? config.enemyCountRange
        : null;
      const rawMin = range
        ? range[0]
        : config && (config.enemyCountMin ?? config.minEnemyCount ?? config.minEnemies);
      const rawMax = range
        ? range[1]
        : config && (config.enemyCountMax ?? config.maxEnemyCount ?? config.maxEnemies);
      if (!Number.isFinite(Number(rawMin)) || !Number.isFinite(Number(rawMax))) {
        return null;
      }
      const a = Math.max(1, Math.floor(Number(rawMin)));
      const b = Math.max(1, Math.floor(Number(rawMax)));
      return {
        min: Math.min(a, b),
        max: Math.max(a, b),
      };
    }

    function getTownSymbolEnemyCount(config) {
      const range = getTownSymbolRandomEnemyCountRange(config);
      if (range) {
        return range.min + Math.floor(Math.random() * (range.max - range.min + 1));
      }
      const value = Math.floor(Number(config && (config.enemyCount ?? config.enemyCountPerSymbol ?? config.battleCount)) || 3);
      return Math.max(1, value);
    }

    function normalizeTownSymbolEnemyEntry(entry) {
      if (typeof entry === "string") {
        return entry ? { role: entry } : null;
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const role = entry.role || entry.enemyId || entry.type || entry.id;
      if (!role) {
        return null;
      }
      return { ...entry, role };
    }

    function resolveTownSymbolEnemyEntries(config) {
      if (Array.isArray(config && config.enemies) && config.enemies.length > 0) {
        return config.enemies
          .map((entry) => normalizeTownSymbolEnemyEntry(entry))
          .filter(Boolean);
      }
      const exactIds = Array.isArray(config && config.battleEnemyIds)
        ? config.battleEnemyIds
        : (Array.isArray(config && config.encounterEnemyIds) ? config.encounterEnemyIds : null);
      if (exactIds && exactIds.length > 0) {
        return exactIds
          .map((enemyId) => normalizeTownSymbolEnemyEntry(enemyId))
          .filter(Boolean);
      }
      const ids = [];
      if (Array.isArray(config && config.enemyIds)) {
        ids.push(...config.enemyIds.filter((enemyId) => enemyId));
      } else if (config && (config.enemyId || config.role || config.enemyType)) {
        ids.push(config.enemyId || config.role || config.enemyType);
      }
      if (ids.length === 0) {
        return [];
      }
      if (ids.length > 1) {
        return ids.map((enemyId) => ({ role: enemyId }));
      }
      const enemyCount = getTownSymbolEnemyCount(config);
      return Array.from({ length: enemyCount }, () => ({ role: ids[0] }));
    }

    function getTownSymbolEnemyEntryLabel(entry, fallback = "") {
      if (!entry) {
        return fallback;
      }
      const role = String(entry.role || "").trim();
      return String(entry.name || entry.label || fallback || role || "魔物").trim();
    }

    function buildTownSymbolEnemyPreview(config, enemyEntries) {
      if (!Array.isArray(enemyEntries) || enemyEntries.length === 0) {
        return config && config.enemyPreview || null;
      }
      const singleRole = enemyEntries[0] && enemyEntries[0].role;
      const allSameRole = singleRole && enemyEntries.every((entry) => entry && entry.role === singleRole);
      if (allSameRole) {
        const name = String(config && (config.enemyName || config.name || config.label) || getTownSymbolEnemyEntryLabel(enemyEntries[0], singleRole)).trim();
        return `${name} x${enemyEntries.length}`;
      }
      const counts = new Map();
      const order = [];
      for (const entry of enemyEntries) {
        const label = getTownSymbolEnemyEntryLabel(entry);
        if (!counts.has(label)) {
          counts.set(label, 0);
          order.push(label);
        }
        counts.set(label, counts.get(label) + 1);
      }
      return order.map((label) => `${label} x${counts.get(label)}`).join(" / ");
    }

    function getTownSymbolLabel(config) {
      const label = String(config && (config.symbolLabel || config.mapLabel || config.marker || "") || "").trim();
      if (label) {
        return label.slice(0, 2);
      }
      return "M";
    }

    function getTownMapTransferTiles(tileMap) {
      const tiles = [];
      const events = Array.isArray(tileMap && tileMap.events) ? tileMap.events : [];
      for (const event of events) {
        const raw = getTownRawMapEvent(event) || {};
        if (raw.enabled === false) {
          continue;
        }
        const action = getTownMapEventAction(event);
        if (action !== "mapTransfer" && action !== "transfer" && action !== "door") {
          continue;
        }
        const eventCol = Math.floor(Number(raw.col ?? raw.x) || 0);
        const eventRow = Math.floor(Number(raw.row ?? raw.y) || 0);
        const width = Math.max(1, Math.floor(Number(raw.w ?? raw.width) || 1));
        const height = Math.max(1, Math.floor(Number(raw.h ?? raw.height) || 1));
        for (let row = eventRow; row < eventRow + height; row += 1) {
          for (let col = eventCol; col < eventCol + width; col += 1) {
            tiles.push({ col, row });
          }
        }
      }
      return tiles;
    }

    function isTownSymbolNearTransferTile(col, row, transferTiles) {
      for (const tile of transferTiles || []) {
        if (Math.hypot(col - tile.col, row - tile.row) <= SYMBOL_ENCOUNTER_TRANSFER_EXCLUSION_RADIUS) {
          return true;
        }
      }
      return false;
    }

    function getTownSymbolTileKey(col, row) {
      return `${Math.floor(col)},${Math.floor(row)}`;
    }

    function getTownSymbolOccupiedTiles(mapState, ignoreSymbolId = null) {
      const occupied = new Set();
      for (const symbol of Array.isArray(mapState && mapState.symbols) ? mapState.symbols : []) {
        if (!symbol || symbol.removed || symbol.id === ignoreSymbolId) {
          continue;
        }
        occupied.add(getTownSymbolTileKey(symbol.col, symbol.row));
      }
      return occupied;
    }

    function getTownNpcOccupiedTiles(mapState, ignoreNpcId = null) {
      const occupied = new Set();
      for (const actor of Array.isArray(mapState && mapState.actors) ? mapState.actors : []) {
        if (!actor || actor.removed || actor.id === ignoreNpcId) {
          continue;
        }
        occupied.add(getTownSymbolTileKey(actor.col, actor.row));
      }
      return occupied;
    }

    function isTownTileBlockedByNpc(tileMap, col, row, ignoreNpcId = null) {
      if (!tileMap) {
        return false;
      }
      const mapState = getTownNpcMapState(getTownSymbolMapId(tileMap));
      return getTownNpcOccupiedTiles(mapState, ignoreNpcId).has(getTownSymbolTileKey(col, row));
    }

    function isTownSymbolSpawnTileAllowed(tileMap, col, row, occupied, transferTiles) {
      if (!isTownGridTilePassable(tileMap, col, row)) {
        return false;
      }
      const playerTile = getTownPlayerTile(tileMap);
      if (playerTile && Math.hypot(playerTile.col - col, playerTile.row - row) <= SYMBOL_ENCOUNTER_PLAYER_SPAWN_EXCLUSION_RADIUS) {
        return false;
      }
      if (occupied && occupied.has(getTownSymbolTileKey(col, row))) {
        return false;
      }
      return !isTownSymbolNearTransferTile(col, row, transferTiles);
    }

    function findTownSymbolSpawnTile(tileMap, mapState) {
      const width = Math.max(0, Math.floor(Number(tileMap && tileMap.width) || 0));
      const height = Math.max(0, Math.floor(Number(tileMap && tileMap.height) || 0));
      if (width <= 0 || height <= 0) {
        return null;
      }
      const occupied = getTownSymbolOccupiedTiles(mapState);
      const transferTiles = getTownMapTransferTiles(tileMap);
      for (let attempt = 0; attempt < SYMBOL_ENCOUNTER_RANDOM_ATTEMPTS; attempt += 1) {
        const col = Math.floor(Math.random() * width);
        const row = Math.floor(Math.random() * height);
        if (isTownSymbolSpawnTileAllowed(tileMap, col, row, occupied, transferTiles)) {
          return { col, row };
        }
      }
      const total = width * height;
      const start = Math.floor(Math.random() * Math.max(1, total));
      for (let offset = 0; offset < total; offset += 1) {
        const index = (start + offset) % total;
        const col = index % width;
        const row = Math.floor(index / width);
        if (isTownSymbolSpawnTileAllowed(tileMap, col, row, occupied, transferTiles)) {
          return { col, row };
        }
      }
      return null;
    }

    function getTownFixedSymbolSpawnTile(tileMap, config, mapState) {
      if (!tileMap || !config) {
        return null;
      }
      const rawCol = config.spawnCol ?? config.fixedCol ?? config.tileCol ?? config.col;
      const rawRow = config.spawnRow ?? config.fixedRow ?? config.tileRow ?? config.row;
      const col = Math.floor(Number(rawCol));
      const row = Math.floor(Number(rawRow));
      if (!Number.isFinite(col) || !Number.isFinite(row)) {
        return null;
      }
      const width = Math.max(0, Math.floor(Number(tileMap.width) || 0));
      const height = Math.max(0, Math.floor(Number(tileMap.height) || 0));
      if (col < 0 || row < 0 || col >= width || row >= height) {
        return null;
      }
      if (!isTownGridTilePassable(tileMap, col, row)) {
        return null;
      }
      const occupied = getTownSymbolOccupiedTiles(mapState);
      if (occupied.has(getTownSymbolTileKey(col, row))) {
        return null;
      }
      return { col, row };
    }

    function getTownSymbolPrimaryEnemyRole(enemyEntries, config) {
      const firstEntry = Array.isArray(enemyEntries) && enemyEntries.length > 0
        ? enemyEntries.find((entry) => entry && entry.role)
        : null;
      if (firstEntry && firstEntry.role) {
        return firstEntry.role;
      }
      return config && (config.enemyId || config.role || config.enemyType) || null;
    }

    function getTownSymbolDirectImagePath(config) {
      if (!config || typeof config !== "object") {
        return null;
      }
      const sprite = config.sprite || config.enemySprite || null;
      return String(
        config.mapImagePath
        || config.mapSpritePath
        || config.imagePath
        || config.spritePath
        || sprite && (sprite.mapImagePath || sprite.mapSpritePath || sprite.imagePath || sprite.path || sprite.left)
        || "",
      ).trim() || null;
    }

    function getTownSymbolMapSpriteHeight(config) {
      const value = Number(config && (config.mapSpriteHeight ?? config.spriteHeight ?? config.imageHeight));
      if (Number.isFinite(value) && value > 0) {
        return Math.max(24, value);
      }
      const role = config && (config.enemyId || config.role || config.enemyType);
      const enemyDef = role && ENEMY_DEFS ? ENEMY_DEFS[role] : null;
      const enemyValue = Number(enemyDef && (enemyDef.mapSpriteHeight ?? enemyDef.spriteHeight ?? enemyDef.imageHeight));
      return Number.isFinite(enemyValue) && enemyValue > 0 ? Math.max(24, enemyValue) : null;
    }

    function preloadTownSymbolSprites(symbols) {
      if (typeof preloadMapEnemySprites !== "function") {
        return;
      }
      const sources = [];
      for (const symbol of Array.isArray(symbols) ? symbols : []) {
        if (!symbol || symbol.removed) {
          continue;
        }
        sources.push(symbol);
        if (symbol.enemyRole) {
          sources.push(symbol.enemyRole);
        }
        if (Array.isArray(symbol.enemyEntries)) {
          sources.push(...symbol.enemyEntries);
        }
      }
      const preloadResult = preloadMapEnemySprites(sources);
      if (preloadResult && typeof preloadResult.catch === "function") {
        preloadResult.catch(() => {});
      }
    }

    function restoreTownPlayerFromSave(savedPlayer) {
      if (!savedPlayer || typeof savedPlayer !== "object") {
        return false;
      }
      const x = Number(savedPlayer.x);
      const y = Number(savedPlayer.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return false;
      }
      town.player.x = x;
      town.player.y = y;
      town.player.gridMove = null;
      if (["up", "down", "left", "right"].includes(savedPlayer.facing)) {
        town.player.facing = savedPlayer.facing;
      }
      town.player.moving = false;
      town.player.walkFrame = 1;
      town.player.walkFrameIndex = -1;
      town.player.walkTimer = 0;
      return true;
    }

    function getTownSymbolSpritePreloadKey(symbols) {
      return (Array.isArray(symbols) ? symbols : [])
        .filter((symbol) => symbol && !symbol.removed)
        .map((symbol) => {
          const entries = Array.isArray(symbol.enemyEntries)
            ? symbol.enemyEntries.map((entry) => String(entry && (entry.role || entry.enemyId || entry.type || entry.id) || "")).join(",")
            : "";
          return [
            symbol.id,
            symbol.enemyRole || "",
            symbol.imagePath || "",
            symbol.mapSpriteHeight || "",
            entries,
          ].join(":");
        })
        .join("|");
    }

    function preloadTownSymbolSpritesIfNeeded(mapState) {
      if (!mapState || !Array.isArray(mapState.symbols)) {
        return;
      }
      const key = getTownSymbolSpritePreloadKey(mapState.symbols);
      if (mapState.symbolSpritePreloadKey === key) {
        return;
      }
      mapState.symbolSpritePreloadKey = key;
      preloadTownSymbolSprites(mapState.symbols);
    }

    function preloadTownBattleSprites(quest) {
      if (typeof preloadBattleEnemySprites !== "function") {
        return;
      }
      const sources = [];
      if (Array.isArray(quest && quest.enemies)) {
        sources.push(...quest.enemies);
      }
      if (Array.isArray(quest && quest.reinforcements)) {
        sources.push(...quest.reinforcements);
      }
      const preloadResult = preloadBattleEnemySprites(sources);
      if (preloadResult && typeof preloadResult.catch === "function") {
        preloadResult.catch(() => {});
      }
    }

    function getTownSymbolFacingAfterMove(symbol, step) {
      if (step && step.x < 0) {
        return "left";
      }
      if (step && step.x > 0) {
        return "right";
      }
      return symbol && symbol.facing || "left";
    }

    function makeTownMonsterSymbol(tileMap, mapId, config, configIndex, spawnTile) {
      const state = ensureTownSymbolEncounterState();
      const configId = getTownSymbolConfigId(config, configIndex);
      const center = getTownTileCenter(tileMap, spawnTile.col, spawnTile.row);
      const enemyEntries = resolveTownSymbolEnemyEntries(config);
      const enemyPreview = getTownSymbolRandomEnemyCountRange(config)
        ? buildTownSymbolEnemyPreview(config, enemyEntries)
        : (config.enemyPreview || buildTownSymbolEnemyPreview(config, enemyEntries));
      return {
        type: "monsterSymbol",
        id: `${mapId}:${configId}:${state.nextId++}`,
        mapId,
        configId,
        name: String(config.name || config.label || configId),
        label: getTownSymbolLabel(config),
        color: config.color || "#9f7cff",
        rank: config.rank || "D",
        questId: getTownQuestIdFromSymbolConfig(config) || null,
        battleId: config.battleId || null,
        enemyRole: getTownSymbolPrimaryEnemyRole(enemyEntries, config),
        imagePath: getTownSymbolDirectImagePath(config),
        mapSpriteHeight: getTownSymbolMapSpriteHeight(config),
        objective: config.objective || null,
        enemyPreview,
        reward: config.reward || null,
        rewards: Array.isArray(config.rewards) ? config.rewards.map((entry) => ({ ...entry })) : null,
        col: spawnTile.col,
        row: spawnTile.row,
        x: center.x,
        y: center.y,
        facing: "down",
        alert: false,
        moveTimer: Math.random() * SYMBOL_ENCOUNTER_WANDER_INTERVAL,
        chaseTimer: 0,
        radius: Math.max(10, Number(config.radius) || 16),
        stationary: config.stationary === true || config.fixedPosition === true || config.noMove === true,
        enemyCount: enemyEntries.length,
        enemyEntries,
      };
    }

    function ensureTownMapSymbols(tileMap = getTownTileMap()) {
      if (!tileMap) {
        return [];
      }
      const configs = getTownSymbolEncounterConfigs(tileMap);
      const mapId = getTownSymbolMapId(tileMap);
      const mapState = getTownSymbolMapState(mapId);
      if (configs.length === 0) {
        mapState.symbols = [];
        mapState.symbolSpritePreloadKey = "";
        return mapState.symbols;
      }
      const activeConfigIds = new Set(configs.map((config, index) => getTownSymbolConfigId(config, index)));
      mapState.symbols = mapState.symbols.filter((symbol) => symbol && !symbol.removed && activeConfigIds.has(symbol.configId));
      configs.forEach((config, index) => {
        const configId = getTownSymbolConfigId(config, index);
        const maxCount = getTownSymbolMaxCount(config);
        let currentCount = mapState.symbols.filter((symbol) => symbol.configId === configId).length;
        while (currentCount < maxCount) {
          const spawnTile = getTownFixedSymbolSpawnTile(tileMap, config, mapState) || findTownSymbolSpawnTile(tileMap, mapState);
          if (!spawnTile) {
            break;
          }
          mapState.symbols.push(makeTownMonsterSymbol(tileMap, mapId, config, index, spawnTile));
          currentCount += 1;
        }
      });
      preloadTownSymbolSpritesIfNeeded(mapState);
      return mapState.symbols;
    }

    function getTownMonsterSymbols(tileMap = getTownTileMap()) {
      return ensureTownMapSymbols(tileMap)
        .filter((symbol) => symbol && !symbol.removed)
        .map((symbol) => {
          const quest = getQuestById(symbol.questId);
          return {
            type: "monsterSymbol",
            id: symbol.id,
            mapId: symbol.mapId,
            configId: symbol.configId,
            name: symbol.name,
            label: symbol.label,
            color: symbol.color,
            role: symbol.enemyRole || null,
            enemyRole: symbol.enemyRole || null,
            imagePath: symbol.imagePath || null,
            mapSpriteHeight: symbol.mapSpriteHeight || null,
            x: symbol.x,
            y: symbol.y,
            col: symbol.col,
            row: symbol.row,
            facing: symbol.facing || "down",
            alert: symbol.alert === true,
            radius: symbol.radius,
            questId: symbol.questId || null,
            questType: quest && quest.type || null,
          };
        });
    }

    function isTownTileBlockedByMapEvent(tileMap, col, row) {
      if (!tileMap || town.meetingDone) {
        return false;
      }
      const events = Array.isArray(tileMap.events) ? tileMap.events : [];
      return events.some((event) => {
        const action = getTownMapEventAction(event);
        const raw = getTownRawMapEvent(event) || {};
        const blocks = raw.blocking === true || action === "partyJoinNpc";
        return blocks && isTownMapEventActive(event) && townMapEventMatchesTile(event, col, row);
      });
    }

    function isTownGridTilePassable(tileMap, col, row, options = {}) {
      if (!tileMap) {
        return false;
      }
      if (tileMapSystem && typeof tileMapSystem.isTileCoordPassable === "function"
        && !tileMapSystem.isTileCoordPassable(tileMap, col, row, { outOfBoundsPassable: false })) {
        return false;
      }
      if (isTownTileBlockedByMapEvent(tileMap, col, row)) {
        return false;
      }
      if (!options.ignoreNpcs && isTownTileBlockedByNpc(tileMap, col, row, options.ignoreNpcId || null)) {
        return false;
      }
      const tileSize = getTownTileSize(tileMap);
      const center = getTownTileCenter(tileMap, col, row);
      return !isTownBlockedAt(center.x, center.y, getTownGridCollisionRadius(tileSize));
    }

    function findNearestPassableTownTile(tileMap, originCol, originRow, maxRadius = 4) {
      for (let radius = 0; radius <= maxRadius; radius += 1) {
        for (let row = originRow - radius; row <= originRow + radius; row += 1) {
          for (let col = originCol - radius; col <= originCol + radius; col += 1) {
            if (Math.max(Math.abs(col - originCol), Math.abs(row - originRow)) !== radius) {
              continue;
            }
            if (isTownGridTilePassable(tileMap, col, row)) {
              return { col, row };
            }
          }
        }
      }
      return null;
    }

    function snapTownPlayerToGridCenter() {
      const tileMap = getTownTileMap();
      if (!tileMap) {
        return;
      }
      const tile = getTownPlayerTile(tileMap);
      const targetTile = isTownGridTilePassable(tileMap, tile.col, tile.row)
        ? tile
        : findNearestPassableTownTile(tileMap, tile.col, tile.row);
      if (!targetTile) {
        return;
      }
      const center = getTownTileCenter(tileMap, targetTile.col, targetTile.row);
      town.player.x = center.x;
      town.player.y = center.y;
      town.player.gridMove = null;
    }

    function updateTownMovementInputOrder(keys) {
      town.movementKeyOrder = Array.isArray(town.movementKeyOrder) ? town.movementKeyOrder : [];
      town.movementKeysDown = town.movementKeysDown && typeof town.movementKeysDown === "object" ? town.movementKeysDown : {};
      for (const key of TOWN_MOVEMENT_KEYS) {
        const pressed = Boolean(keys && keys[key]);
        const wasPressed = Boolean(town.movementKeysDown[key]);
        if (pressed && !wasPressed) {
          town.movementKeyOrder = town.movementKeyOrder.filter((entry) => entry !== key);
          town.movementKeyOrder.push(key);
        } else if (!pressed && wasPressed) {
          town.movementKeyOrder = town.movementKeyOrder.filter((entry) => entry !== key);
        }
        town.movementKeysDown[key] = pressed;
      }
    }

    function getTownFacingFromInput(keys, dx, dy, fallback = "down") {
      const order = Array.isArray(town.movementKeyOrder) ? town.movementKeyOrder : [];
      for (const key of order) {
        if (!keys || !keys[key]) {
          continue;
        }
        if (key === "a" && dx < 0) return "left";
        if (key === "d" && dx > 0) return "right";
        if (key === "w" && dy < 0) return "up";
        if (key === "s" && dy > 0) return "down";
      }
      if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) > 0) {
        return dx > 0 ? "right" : "left";
      }
      if (Math.abs(dy) > 0) {
        return dy > 0 ? "down" : "up";
      }
      return fallback;
    }

    function updateTownActorWalkAnimation(actor, dt, moving) {
      if (!actor) {
        return;
      }
      if (!moving) {
        actor.moving = false;
        actor.walkFrame = 1;
        actor.walkFrameIndex = -1;
        actor.walkTimer = 0;
        return;
      }
      if (!actor.moving || !Number.isFinite(actor.walkFrameIndex) || actor.walkFrameIndex < 0) {
        actor.moving = true;
        actor.walkFrameIndex = 0;
        actor.walkFrame = TOWN_WALK_ANIMATION_SEQUENCE[0];
        actor.walkTimer = 0;
        return;
      }
      actor.walkTimer = (Number.isFinite(actor.walkTimer) ? actor.walkTimer : 0) + Math.max(0, dt || 0);
      while (actor.walkTimer >= TOWN_WALK_FRAME_INTERVAL) {
        actor.walkTimer -= TOWN_WALK_FRAME_INTERVAL;
        actor.walkFrameIndex = (actor.walkFrameIndex + 1) % TOWN_WALK_ANIMATION_SEQUENCE.length;
      }
      actor.walkFrame = TOWN_WALK_ANIMATION_SEQUENCE[actor.walkFrameIndex] || 1;
    }

    function updateTownNpcs(tileMap = getTownTileMap(), dt = 0) {
      if (!tileMap) {
        return;
      }
      const actors = ensureTownMapNpcs(tileMap);
      if (!actors.length || game.state !== "town" || !playerProfile.done || town.panel || town.story || (game.systemMenu && game.systemMenu.open)) {
        for (const actor of actors) {
          updateTownActorWalkAnimation(actor, dt, false);
        }
        return;
      }
      const elapsed = Math.min(0.5, Math.max(0, Number(dt) || 0));
      if (elapsed <= 0) {
        return;
      }
      const mapState = getTownNpcMapState(getTownSymbolMapId(tileMap));
      const occupied = getTownNpcOccupiedTiles(mapState);
      const playerTile = getTownPlayerTile(tileMap);
      for (const actor of actors) {
        if (!actor || actor.removed || actor.stationary === true) {
          updateTownActorWalkAnimation(actor, elapsed, false);
          continue;
        }
        let moved = false;
        actor.moveTimer = (Number.isFinite(actor.moveTimer) ? actor.moveTimer : 0) + elapsed;
        const interval = Math.max(0.1, Number(actor.wanderInterval) || TOWN_NPC_WANDER_INTERVAL);
        while (actor.moveTimer >= interval) {
          actor.moveTimer -= interval;
          const directions = shuffleTownSymbolDirections(SYMBOL_ENCOUNTER_DIRECTIONS);
          for (const step of directions) {
            if (tryMoveTownNpc(tileMap, actor, step, occupied, playerTile)) {
              moved = true;
              break;
            }
          }
        }
        updateTownActorWalkAnimation(actor, elapsed, moved);
      }
    }

    function tryMoveTownNpc(tileMap, actor, step, occupied, playerTile) {
      if (!tileMap || !actor || !step || (!step.x && !step.y)) {
        return false;
      }
      const targetCol = actor.col + step.x;
      const targetRow = actor.row + step.y;
      const fromKey = getTownSymbolTileKey(actor.col, actor.row);
      const targetKey = getTownSymbolTileKey(targetCol, targetRow);
      if (occupied && occupied.has(targetKey)) {
        return false;
      }
      if (playerTile && playerTile.col === targetCol && playerTile.row === targetRow) {
        return false;
      }
      if (!isTownGridTilePassable(tileMap, targetCol, targetRow, { ignoreNpcId: actor.id })) {
        return false;
      }
      const center = getTownTileCenter(tileMap, targetCol, targetRow);
      if (occupied) {
        occupied.delete(fromKey);
        occupied.add(targetKey);
      }
      actor.col = targetCol;
      actor.row = targetRow;
      actor.x = center.x;
      actor.y = center.y;
      actor.facing = step.facing || actor.facing || "down";
      return true;
    }

    function updateTownMovement(dt) {
      const keys = input.keys || {};
      updateTownMovementInputOrder(keys);
      if (town.panel || dt <= 0) {
        updateTownActorWalkAnimation(town.player, dt, false);
        return;
      }
      const tileMap = getTownTileMap();
      if (tileMap) {
        updateTownGridMovement(tileMap, dt, keys);
        return;
      }
      const dx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      const dy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
      const len = Math.hypot(dx, dy);
      if (len <= 0) {
        updateTownActorWalkAnimation(town.player, dt, false);
        return;
      }
      town.player.facing = getTownFacingFromInput(keys, dx, dy, town.player.facing || "down");
      const beforeX = town.player.x;
      const beforeY = town.player.y;
      const speed = town.player.speed || 235;
      const vx = (dx / len) * speed * dt;
      const vy = (dy / len) * speed * dt;
      moveTownPlayerAxis(vx, 0);
      moveTownPlayerAxis(0, vy);
      const moved = distPoint(beforeX, beforeY, town.player.x, town.player.y) > 0.05;
      updateTownActorWalkAnimation(town.player, dt, moved);
      if (moved) {
        appendTownTrailPoint();
      }
    }

    function updateTownGridMovement(tileMap, dt, keys) {
      if (continueTownGridMove(tileMap, dt)) {
        return;
      }
      const step = getTownGridStepFromInput(keys);
      if (!step) {
        updateTownActorWalkAnimation(town.player, dt, false);
        return;
      }
      town.player.facing = step.facing;
      if (!startTownGridMove(tileMap, step)) {
        const fallbackStep = step.x && step.y ? getTownGridCardinalFallbackStep(keys) : null;
        if (!fallbackStep || !startTownGridMove(tileMap, fallbackStep)) {
          updateTownActorWalkAnimation(town.player, dt, false);
          return;
        }
      }
      continueTownGridMove(tileMap, dt);
    }

    function getTownGridStepFromInput(keys) {
      if (!keys) {
        return null;
      }
      const dx = getTownGridAxisFromInput(keys, "a", "d");
      const dy = getTownGridAxisFromInput(keys, "w", "s");
      if (!dx && !dy) {
        return null;
      }
      return {
        x: dx,
        y: dy,
        facing: getTownFacingFromInput(keys, dx, dy, town.player.facing || "down"),
      };
    }

    function getTownGridAxisFromInput(keys, negativeKey, positiveKey) {
      const order = Array.isArray(town.movementKeyOrder) ? town.movementKeyOrder : [];
      const negativePressed = Boolean(keys && keys[negativeKey]);
      const positivePressed = Boolean(keys && keys[positiveKey]);
      if (negativePressed && positivePressed) {
        for (const key of order) {
          if (!keys || !keys[key]) {
            continue;
          }
          if (key === negativeKey) return -1;
          if (key === positiveKey) return 1;
        }
        return 0;
      }
      if (negativePressed) return -1;
      if (positivePressed) return 1;
      return 0;
    }

    function getTownGridCardinalFallbackStep(keys) {
      const order = Array.isArray(town.movementKeyOrder) ? town.movementKeyOrder : [];
      for (const key of order) {
        if (!keys || !keys[key]) {
          continue;
        }
        if (key === "a") return { x: -1, y: 0, facing: "left" };
        if (key === "d") return { x: 1, y: 0, facing: "right" };
        if (key === "w") return { x: 0, y: -1, facing: "up" };
        if (key === "s") return { x: 0, y: 1, facing: "down" };
      }
      if (keys && keys.a) return { x: -1, y: 0, facing: "left" };
      if (keys && keys.d) return { x: 1, y: 0, facing: "right" };
      if (keys && keys.w) return { x: 0, y: -1, facing: "up" };
      if (keys && keys.s) return { x: 0, y: 1, facing: "down" };
      return null;
    }

    function startTownGridMove(tileMap, step) {
      if (step && step.facing) {
        town.player.facing = step.facing;
      }
      const current = getTownPlayerTile(tileMap);
      const targetCol = current.col + step.x;
      const targetRow = current.row + step.y;
      if (step.x && step.y && !canTownMoveDiagonally(tileMap, current.col, current.row, step.x, step.y)) {
        town.player.gridMove = null;
        return false;
      }
      if (!isTownGridTilePassable(tileMap, targetCol, targetRow)) {
        town.player.gridMove = null;
        return false;
      }
      const center = getTownTileCenter(tileMap, targetCol, targetRow);
      town.player.gridMove = {
        targetX: center.x,
        targetY: center.y,
        col: targetCol,
        row: targetRow,
        facing: step.facing,
      };
      appendTownTileTrailPoint(tileMap, targetCol, targetRow, step.facing);
      return true;
    }

    function canTownMoveDiagonally(tileMap, col, row, dx, dy) {
      return isTownGridTilePassable(tileMap, col + dx, row)
        && isTownGridTilePassable(tileMap, col, row + dy)
        && isTownGridTilePassable(tileMap, col + dx, row + dy);
    }

    function continueTownGridMove(tileMap, dt) {
      const move = town.player.gridMove;
      if (!move) {
        return false;
      }
      const beforeX = town.player.x;
      const beforeY = town.player.y;
      const dx = move.targetX - town.player.x;
      const dy = move.targetY - town.player.y;
      const distance = Math.hypot(dx, dy);
      const speed = Math.max(1, town.player.speed || 235);
      const amount = speed * Math.max(0, dt || 0);
      let arrived = false;
      town.player.facing = move.facing || town.player.facing || "down";
      if (distance <= amount || distance <= 0.001) {
        town.player.x = move.targetX;
        town.player.y = move.targetY;
        town.player.gridMove = null;
        arrived = true;
      } else {
        town.player.x += dx / distance * amount;
        town.player.y += dy / distance * amount;
      }
      clampTownPlayer();
      const moved = distPoint(beforeX, beforeY, town.player.x, town.player.y) > 0.05;
      updateTownActorWalkAnimation(town.player, dt, moved || Boolean(town.player.gridMove));
      updateTownCamera();
      if (arrived) {
        appendTownTrailPoint();
        handleTownStepEvents(tileMap);
      }
      return true;
    }

    function getTownMapTransferData(event) {
      if (!event) {
        return null;
      }
      const raw = event.raw || {};
      const payload = event.payload || raw.payload || {};
      const action = event.action || raw.action || raw.type || "";
      const targetMap = raw.targetMap || payload.targetMap || raw.mapId || payload.mapId || null;
      if (!targetMap || (action !== "mapTransfer" && action !== "transfer" && action !== "door")) {
        return null;
      }
      return {
        targetMap,
        targetCol: Number(raw.targetCol ?? payload.targetCol),
        targetRow: Number(raw.targetRow ?? payload.targetRow),
        name: raw.name || event.id || targetMap,
      };
    }

    function getTownGuidedStepData(event) {
      if (!event) {
        return null;
      }
      const raw = getTownRawMapEvent(event) || {};
      const payload = event.payload || raw.payload || {};
      const action = getTownMapEventAction(event);
      if (action !== "guidedStep" && action !== "forcedStep") {
        return null;
      }
      if (!isTownMapEventActive(event)) {
        return null;
      }
      const move = raw.move || payload.move || {};
      const moveX = Math.floor(Number(raw.moveX ?? raw.dx ?? move.x) || 0);
      const moveY = Math.floor(Number(raw.moveY ?? raw.dy ?? move.y) || 0);
      const dialogue = raw.dialogue || raw.lines || payload.dialogue || payload.lines || null;
      return {
        id: raw.id || event.id || "guidedStep",
        message: raw.message || payload.message || "",
        messageTimer: Number(raw.messageTimer ?? payload.messageTimer) || 3,
        dialogue: normalizeTownGuidedStepDialogue(dialogue),
        facing: raw.facing || raw.direction || payload.facing || payload.direction || town.player.facing || "down",
        moveX,
        moveY,
      };
    }

    function normalizeTownGuidedStepDialogue(dialogue) {
      const entries = Array.isArray(dialogue)
        ? dialogue
        : dialogue
          ? [dialogue]
          : [];
      return entries
        .map((entry) => {
          if (typeof entry === "string") {
            return { text: entry };
          }
          if (!entry || typeof entry !== "object") {
            return null;
          }
          return {
            speaker: entry.speaker || entry.name || undefined,
            text: String(entry.text || entry.message || ""),
          };
        })
        .filter((entry) => entry && entry.text);
    }

    function applyTownGuidedStepMove(tileMap, guided) {
      if (!guided) {
        return false;
      }
      town.player.facing = guided.facing || town.player.facing || "down";
      town.player.gridMove = null;
      if (guided.moveX || guided.moveY) {
        startTownGridMove(tileMap, {
          x: guided.moveX,
          y: guided.moveY,
          facing: town.player.facing,
        });
      }
      return true;
    }

    function runTownGuidedStep(tileMap, guided) {
      if (!guided) {
        return false;
      }
      if (Array.isArray(guided.dialogue) && guided.dialogue.length > 0) {
        town.player.facing = guided.facing || town.player.facing || "down";
        town.player.gridMove = null;
        startTownStory(`guidedStep:${guided.id}`, guided.dialogue, () => {
          applyTownGuidedStepMove(getTownTileMap() || tileMap, guided);
        });
        return true;
      }
      if (guided.message) {
        game.message = guided.message;
        game.messageTimer = Math.max(0, guided.messageTimer || 3);
      }
      return applyTownGuidedStepMove(tileMap, guided);
    }

    function getTownBackStepFromFacing(facing) {
      if (facing === "up") return { x: 0, y: 1, facing: "down" };
      if (facing === "down") return { x: 0, y: -1, facing: "up" };
      if (facing === "left") return { x: 1, y: 0, facing: "right" };
      if (facing === "right") return { x: -1, y: 0, facing: "left" };
      return { x: 0, y: -1, facing: "up" };
    }

    function getTutorialTransferBlock(transfer) {
      if (!transfer || isTownQuestCompleted(TUTORIAL_STORY_QUEST_ID)) {
        return null;
      }
      const currentMapId = getTownMapId();
      const accepted = isTownQuestAccepted(TUTORIAL_STORY_QUEST_ID);
      if (town.meetingDone && currentMapId === "startTown01" && transfer.targetMap === "kuraku_forest_1" && !accepted) {
        return {
          id: "tutorialQuestRequired",
          text: "依頼を受けよう！",
        };
      }
      if (currentMapId === "kuraku_forest_1" && transfer.targetMap === "kuraku_forest_2" && accepted) {
        return {
          id: "tutorialQuestAreaLimit",
          text: "依頼の魔物はこの付近にいるはずだ！",
        };
      }
      return null;
    }

    function runTownTransferBlock(tileMap, block) {
      if (!block || !block.text) {
        return false;
      }
      const backStep = getTownBackStepFromFacing(town.player && town.player.facing);
      town.player.gridMove = null;
      startTownStory(`transferBlock:${block.id || "default"}`, [{ text: block.text }], () => {
        startTownGridMove(getTownTileMap() || tileMap, backStep);
      });
      return true;
    }

    function handleTownStepEvents(tileMap) {
      if (!tileMap || !tileMapSystem || typeof tileMapSystem.getEventsAtTile !== "function") {
        return false;
      }
      const tile = getTownPlayerTile(tileMap);
      const events = tileMapSystem.getEventsAtTile(tileMap, tile.col, tile.row, "step");
      for (const event of events) {
        const guided = getTownGuidedStepData(event);
        if (runTownGuidedStep(tileMap, guided)) {
          return true;
        }
      }
      for (const event of events) {
        const transfer = getTownMapTransferData(event);
        if (!transfer) {
          continue;
        }
        const block = getTutorialTransferBlock(transfer);
        if (runTownTransferBlock(tileMap, block)) {
          return true;
        }
        const options = {};
        if (Number.isFinite(transfer.targetCol) && Number.isFinite(transfer.targetRow)) {
          options.targetCol = transfer.targetCol;
          options.targetRow = transfer.targetRow;
        }
        if (switchTownMap(transfer.targetMap, options)) {
          return true;
        }
      }
      return false;
    }

    function updateTownSymbolEncounters(tileMap = getTownTileMap(), dt = 0) {
      if (!tileMap) {
        return;
      }
      const symbols = ensureTownMapSymbols(tileMap);
      if (!symbols.length || game.state !== "town" || !playerProfile.done || town.panel || town.story || (game.systemMenu && game.systemMenu.open)) {
        return;
      }
      const elapsed = Math.min(0.5, Math.max(0, Number(dt) || 0));
      if (elapsed <= 0) {
        checkTownSymbolEncounter(tileMap, symbols);
        return;
      }
      const playerTile = getTownPlayerTile(tileMap);
      const occupied = getTownSymbolOccupiedTiles(getTownSymbolMapState(getTownSymbolMapId(tileMap)));
      for (const symbol of symbols) {
        if (!symbol || symbol.removed) {
          continue;
        }
        updateTownSymbolAlert(symbol, playerTile);
        if (symbol.stationary === true) {
          continue;
        }
        if (symbol.alert) {
          updateTownSymbolChase(tileMap, symbol, playerTile, occupied, elapsed);
        } else {
          updateTownSymbolWander(tileMap, symbol, occupied, elapsed);
        }
        updateTownSymbolAlert(symbol, playerTile);
      }
      checkTownSymbolEncounter(tileMap, symbols);
    }

    function getTownSymbolDistanceToTile(symbol, tile) {
      if (!symbol || !tile) {
        return Infinity;
      }
      return Math.hypot(symbol.col - tile.col, symbol.row - tile.row);
    }

    function updateTownSymbolAlert(symbol, playerTile) {
      const distance = getTownSymbolDistanceToTile(symbol, playerTile);
      if (symbol.alert) {
        if (distance > SYMBOL_ENCOUNTER_RELEASE_RANGE) {
          symbol.alert = false;
          symbol.chaseTimer = 0;
        }
      } else if (distance <= SYMBOL_ENCOUNTER_ALERT_RANGE) {
        symbol.alert = true;
        symbol.chaseTimer = 0;
      }
    }

    function updateTownSymbolWander(tileMap, symbol, occupied, dt) {
      symbol.moveTimer = (Number.isFinite(symbol.moveTimer) ? symbol.moveTimer : 0) + dt;
      while (symbol.moveTimer >= SYMBOL_ENCOUNTER_WANDER_INTERVAL) {
        symbol.moveTimer -= SYMBOL_ENCOUNTER_WANDER_INTERVAL;
        const directions = shuffleTownSymbolDirections(SYMBOL_ENCOUNTER_DIRECTIONS);
        for (const step of directions) {
          if (tryMoveTownSymbol(tileMap, symbol, step, occupied)) {
            break;
          }
        }
      }
    }

    function updateTownSymbolChase(tileMap, symbol, playerTile, occupied, dt) {
      symbol.chaseTimer = (Number.isFinite(symbol.chaseTimer) ? symbol.chaseTimer : 0) + dt;
      while (symbol.chaseTimer >= SYMBOL_ENCOUNTER_CHASE_INTERVAL) {
        symbol.chaseTimer -= SYMBOL_ENCOUNTER_CHASE_INTERVAL;
        const directions = getTownSymbolChaseDirections(symbol, playerTile);
        for (const step of directions) {
          if (tryMoveTownSymbol(tileMap, symbol, step, occupied)) {
            break;
          }
        }
      }
    }

    function shuffleTownSymbolDirections(directions) {
      const result = directions.slice();
      for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }

    function getTownSymbolChaseDirections(symbol, playerTile) {
      return shuffleTownSymbolDirections(SYMBOL_ENCOUNTER_DIRECTIONS)
        .map((step) => ({
          ...step,
          score: Math.hypot((symbol.col + step.x) - playerTile.col, (symbol.row + step.y) - playerTile.row),
        }))
        .sort((a, b) => a.score - b.score);
    }

    function tryMoveTownSymbol(tileMap, symbol, step, occupied) {
      if (!step || (!step.x && !step.y)) {
        return false;
      }
      const targetCol = symbol.col + step.x;
      const targetRow = symbol.row + step.y;
      const fromKey = getTownSymbolTileKey(symbol.col, symbol.row);
      const targetKey = getTownSymbolTileKey(targetCol, targetRow);
      if (occupied && occupied.has(targetKey)) {
        return false;
      }
      if (!isTownGridTilePassable(tileMap, targetCol, targetRow)) {
        return false;
      }
      const center = getTownTileCenter(tileMap, targetCol, targetRow);
      if (occupied) {
        occupied.delete(fromKey);
        occupied.add(targetKey);
      }
      symbol.col = targetCol;
      symbol.row = targetRow;
      symbol.x = center.x;
      symbol.y = center.y;
      symbol.facing = getTownSymbolFacingAfterMove(symbol, step);
      return true;
    }

    function checkTownSymbolEncounter(tileMap, symbols = ensureTownMapSymbols(tileMap)) {
      if (!tileMap || game.state !== "town" || !Array.isArray(symbols) || !symbols.length) {
        return false;
      }
      if (isEncounterCutinActive()) {
        return false;
      }
      const playerTile = getTownPlayerTile(tileMap);
      const engagedSymbols = symbols.filter((symbol) => symbol
        && !symbol.removed
        && symbol.alert === true
        && symbol.col === playerTile.col
        && symbol.row === playerTile.row);
      if (!engagedSymbols.length) {
        return false;
      }
      return startTownSymbolEncounterBattle(tileMap, engagedSymbols);
    }

    function startTownSymbolEncounterBattle(tileMap, symbols) {
      const quest = buildTownSymbolEncounterQuest(tileMap, symbols);
      if (!quest) {
        return false;
      }
      const storyLines = shouldPlayTownQuestEncounterStory(quest) && typeof getQuestEncounterStory === "function"
        ? getQuestEncounterStory(quest)
        : [];
      if (Array.isArray(storyLines) && storyLines.length > 0) {
        markTownQuestEncounterStorySeen(quest);
        town.player.gridMove = null;
        startTownStory(`questEncounter:${quest.id}`, storyLines, () => {
          beginTownSymbolEncounterBattle(quest, symbols);
        });
        return true;
      }
      beginTownSymbolEncounterBattle(quest, symbols);
      return true;
    }

    function beginTownSymbolEncounterBattle(quest, symbols) {
      const state = ensureTownSymbolEncounterState();
      state.pendingBattle = quest.symbolEncounter;
      for (const symbol of symbols) {
        symbol.inBattle = true;
      }
      startEncounterCutin(quest, symbols);
    }

    function isEncounterCutinActive() {
      return Boolean(game.encounterCutin && game.encounterCutin.active);
    }

    function getEncounterCutinEnemyText(quest, symbols) {
      const preview = String(quest && quest.enemyPreview || "").trim();
      if (preview) {
        return preview;
      }
      const names = [];
      for (const symbol of Array.isArray(symbols) ? symbols : []) {
        const enemyEntries = Array.isArray(symbol && symbol.enemyEntries) ? symbol.enemyEntries : [];
        for (const entry of enemyEntries) {
          const normalized = normalizeTownSymbolEnemyEntry(entry);
          if (normalized && normalized.name) {
            names.push(normalized.name);
          }
        }
      }
      return names.length ? Array.from(new Set(names)).join(" / ") : "魔物の気配";
    }

    function getEncounterCutinSymbolText(symbols) {
      const labels = (Array.isArray(symbols) ? symbols : [])
        .map((symbol) => String(symbol && (symbol.name || symbol.label || symbol.configId) || "").trim())
        .filter(Boolean);
      if (!labels.length) {
        return "";
      }
      const unique = Array.from(new Set(labels));
      return unique.length === 1 ? unique[0] : unique.join(" / ");
    }

    function startEncounterCutin(quest, symbols) {
      preloadTownBattleSprites(quest);
      town.player.gridMove = null;
      input.keys = input.keys || {};
      for (const key of TOWN_MOVEMENT_KEYS) {
        input.keys[key] = false;
      }
      game.messageTimer = 0;
      game.encounterCutin = {
        active: true,
        timer: 0,
        duration: ENCOUNTER_CUTIN_DURATION,
        quest,
        title: "戦闘開始",
        subtitle: quest && quest.name ? quest.name : "魔物と遭遇",
        enemyText: getEncounterCutinEnemyText(quest, symbols),
        symbolText: getEncounterCutinSymbolText(symbols),
      };
    }

    function updateEncounterCutin(dt = 0) {
      if (!isEncounterCutinActive()) {
        return false;
      }
      const cutin = game.encounterCutin;
      cutin.timer = Math.max(0, Number(cutin.timer) || 0) + Math.max(0, Number(dt) || 0);
      if (cutin.timer < Math.max(0.1, Number(cutin.duration) || ENCOUNTER_CUTIN_DURATION)) {
        return true;
      }
      const quest = cutin.quest || null;
      game.encounterCutin = null;
      resetGame(quest);
      return true;
    }

    function buildTownSymbolEncounterQuest(tileMap, symbols) {
      const mapId = getTownSymbolMapId(tileMap);
      const playerTile = getTownPlayerTile(tileMap);
      const enemiesForBattle = [];
      symbols.forEach((symbol, symbolIndex) => {
        const enemyEntries = Array.isArray(symbol.enemyEntries) ? symbol.enemyEntries : [];
        enemyEntries.forEach((entry, enemyIndex) => {
          const normalized = normalizeTownSymbolEnemyEntry(entry);
          if (!normalized) {
            return;
          }
          enemiesForBattle.push({
            ...normalized,
            name: normalized.name || `${symbol.name || symbol.configId}${symbolIndex + 1}-${enemyIndex + 1}`,
          });
        });
      });
      if (!enemiesForBattle.length) {
        return null;
      }
      const primaryName = symbols.length === 1
        ? (symbols[0].name || symbols[0].configId || "Symbol")
        : `Symbols x${symbols.length}`;
      const primarySymbol = symbols[0] || null;
      const questId = symbols.map((symbol) => symbol && symbol.questId).find(Boolean) || null;
      const questTemplate = symbols.length === 1 && questId
        ? getQuestById(questId)
        : null;
      return {
        ...(questTemplate || {}),
        id: questTemplate && questTemplate.id || `symbol_${mapId}_${Date.now()}`,
        type: questTemplate && questTemplate.type || "symbolEncounter",
        rank: questTemplate && questTemplate.rank || primarySymbol && primarySymbol.rank || "D",
        name: questTemplate && questTemplate.name || primaryName,
        objective: questTemplate && questTemplate.objective || primarySymbol && primarySymbol.objective || "魔物を全滅させる",
        enemyPreview: questTemplate && questTemplate.enemyPreview || primarySymbol && primarySymbol.enemyPreview || enemiesForBattle.map((entry) => entry.role).join(" / "),
        reward: questTemplate && questTemplate.reward || primarySymbol && primarySymbol.reward || "",
        rewards: questTemplate && questTemplate.rewards || primarySymbol && primarySymbol.rewards || null,
        battleId: questTemplate && questTemplate.battleId || primarySymbol && primarySymbol.battleId || `symbol_${mapId}`,
        enemies: enemiesForBattle,
        symbolEncounter: {
          mapId,
          questId,
          symbolIds: symbols.map((symbol) => symbol.id),
          returnCol: playerTile.col,
          returnRow: playerTile.row,
        },
      };
    }

    function completeTownSymbolEncounter(encounter) {
      if (!encounter || !encounter.mapId || !Array.isArray(encounter.symbolIds)) {
        return;
      }
      const mapState = getTownSymbolMapState(encounter.mapId);
      const defeatedIds = new Set(encounter.symbolIds);
      mapState.symbols = mapState.symbols.filter((symbol) => symbol && !defeatedIds.has(symbol.id));
      const state = ensureTownSymbolEncounterState();
      if (state.pendingBattle && state.pendingBattle.mapId === encounter.mapId) {
        state.pendingBattle = null;
      }
      clearTownAcceptedQuest(encounter.questId);
      completeTownQuest(encounter.questId);
      const tileMap = tileMapSystem && typeof tileMapSystem.getMap === "function"
        ? tileMapSystem.getMap(encounter.mapId)
        : null;
      if (tileMap) {
        ensureTownMapSymbols(tileMap);
      }
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
      const tileMap = getTownTileMap();
      if (tileMap && tileMapSystem && typeof tileMapSystem.isWorldCirclePassable === "function") {
        if (!tileMapSystem.isWorldCirclePassable(tileMap, x, y, radius, { outOfBoundsPassable: false })) {
          return true;
        }
      }
      const usingTileMap = Boolean(tileMap);
      for (const building of town.buildings) {
        const rectX = usingTileMap ? building.x : building.x - 10;
        const rectY = usingTileMap ? building.y : building.y - 42;
        const rectW = usingTileMap ? building.w : building.w + 20;
        const rectH = usingTileMap ? building.h : building.h + 46;
        if (circleRectIntersects(x, y, radius, rectX, rectY, rectW, rectH)) {
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
        town.followers.forEach(normalizeTownFollowerDisplay);
        return;
      }
      const startX = town.player.x;
      const startY = town.player.y;
      const tileMap = getTownTileMap();
      if (tileMap) {
        const trail = buildInitialTownTileTrail(tileMap);
        const first = trail[trail.length - 2] || trail[trail.length - 1] || getTownTrailPointFromPlayer(tileMap);
        const second = trail[trail.length - 3] || first;
        const third = trail[trail.length - 4] || second;
        town.followers = [
          makeTownFollower("ulpes", "ウ", "#f4c54f", first.x, first.y, first.facing || "down"),
          makeTownFollower("rihas", "リ", "#e37a3f", second.x, second.y, second.facing || "down"),
          makeTownFollower("sushia", "ス", "#b985ee", third.x, third.y, third.facing || "down"),
        ];
        return;
      }
      town.followers = [
        makeTownFollower("ulpes", "ウ", "#f4c54f", startX - 44, startY + 52, "down"),
        makeTownFollower("rihas", "リ", "#e37a3f", startX, startY + 72, "down"),
        makeTownFollower("sushia", "ス", "#b985ee", startX + 44, startY + 52, "down"),
      ];
    }

    function makeTownFollower(id, label, color, x, y, facing = "down") {
      return normalizeTownFollowerDisplay({
        id,
        label,
        color,
        x,
        y,
        facing,
        walkFrame: 1,
        walkFrameIndex: -1,
        walkTimer: 0,
      });
    }

    function normalizeTownFollowerDisplay(follower) {
      if (!follower) {
        return follower;
      }
      follower.spriteHeight = Number.isFinite(town.player && town.player.spriteHeight)
        ? town.player.spriteHeight
        : TOWN_FOLLOWER_SPRITE_HEIGHT;
      return follower;
    }

    function getTownTrailPointFromPlayer(tileMap = getTownTileMap()) {
      if (tileMap) {
        const tile = getTownPlayerTile(tileMap);
        const center = getTownTileCenter(tileMap, tile.col, tile.row);
        return {
          x: center.x,
          y: center.y,
          col: tile.col,
          row: tile.row,
          facing: town.player.facing || "down",
        };
      }
      return { x: town.player.x, y: town.player.y, facing: town.player.facing || "down" };
    }

    function getTownBackStepFromFacing(facing) {
      if (facing === "up") return { x: 0, y: 1 };
      if (facing === "left") return { x: 1, y: 0 };
      if (facing === "right") return { x: -1, y: 0 };
      return { x: 0, y: -1 };
    }

    function getTownTrailPointFromTile(tileMap, col, row, facing) {
      const center = getTownTileCenter(tileMap, col, row);
      return { x: center.x, y: center.y, col, row, facing: facing || town.player.facing || "down" };
    }

    function buildInitialTownTileTrail(tileMap = getTownTileMap()) {
      if (!tileMap) {
        return [getTownTrailPointFromPlayer(null)];
      }
      const current = getTownPlayerTile(tileMap);
      const facing = town.player.facing || "down";
      const back = getTownBackStepFromFacing(facing);
      const currentPoint = getTownTrailPointFromTile(tileMap, current.col, current.row, facing);
      const trail = [];
      for (let offset = 3; offset >= 1; offset -= 1) {
        const col = current.col + back.x * offset;
        const row = current.row + back.y * offset;
        trail.push(isTownGridTilePassable(tileMap, col, row)
          ? getTownTrailPointFromTile(tileMap, col, row, facing)
          : currentPoint);
      }
      trail.push(currentPoint);
      return trail;
    }

    function resetTownTrail() {
      const tileMap = getTownTileMap();
      town.trail = tileMap ? buildInitialTownTileTrail(tileMap) : [getTownTrailPointFromPlayer(null)];
    }

    function appendTownTrailPoint() {
      if (!Array.isArray(town.trail) || town.trail.length === 0) {
        resetTownTrail();
        return;
      }
      const tileMap = getTownTileMap();
      if (tileMap) {
        const tile = getTownPlayerTile(tileMap);
        appendTownTileTrailPoint(tileMap, tile.col, tile.row, town.player.facing || "down");
        return;
      }
      const last = town.trail[town.trail.length - 1];
      if (distPoint(last.x, last.y, town.player.x, town.player.y) < 8) {
        return;
      }
      town.trail.push({ x: town.player.x, y: town.player.y, facing: town.player.facing || "down" });
      if (town.trail.length > 420) {
        town.trail.splice(0, town.trail.length - 420);
      }
    }

    function updateTownFollowers(dt = 0) {
      if (!town.meetingDone) {
        town.followers = [];
        return;
      }
      initializeTownFollowers();
      if (!Array.isArray(town.trail) || town.trail.length === 0) {
        resetTownTrail();
      }
      const tileMap = getTownTileMap();
      if (tileMap) {
        updateTownTileFollowers(tileMap, dt);
        return;
      }
      for (let i = 0; i < town.followers.length; i += 1) {
        const follower = town.followers[i];
        const beforeX = follower.x;
        const beforeY = follower.y;
        const target = getTrailPointBehind((i + 1) * 58);
        follower.x = target.x;
        follower.y = target.y;
        if (target.facing) {
          follower.facing = target.facing;
        }
        const moved = distPoint(beforeX, beforeY, follower.x, follower.y) > 0.05;
        updateTownActorWalkAnimation(follower, dt, moved);
      }
    }

    function appendTownTileTrailPoint(tileMap, col, row, facing = town.player.facing || "down") {
      if (!tileMap) {
        return;
      }
      if (!Array.isArray(town.trail) || town.trail.length === 0) {
        town.trail = [];
      }
      const point = getTownTrailPointFromTile(tileMap, col, row, facing);
      const last = town.trail[town.trail.length - 1];
      if (last && last.col === point.col && last.row === point.row) {
        last.facing = point.facing;
        return;
      }
      town.trail.push(point);
      if (town.trail.length > 80) {
        town.trail.splice(0, town.trail.length - 80);
      }
    }

    function updateTownTileFollowers(tileMap, dt = 0) {
      for (let i = 0; i < town.followers.length; i += 1) {
        const follower = town.followers[i];
        const target = getTileTrailPointBehind(i + 1);
        moveTownFollowerTowardTilePoint(follower, target, dt);
      }
    }

    function getTileTrailPointBehind(tileOffset) {
      const trail = town.trail || [];
      if (trail.length === 0) {
        return getTownTrailPointFromPlayer();
      }
      const index = Math.max(0, trail.length - 1 - Math.max(0, Math.floor(tileOffset) || 0));
      return trail[index] || trail[0];
    }

    function moveTownFollowerTowardTilePoint(follower, target, dt = 0) {
      if (!follower || !target) {
        return;
      }
      const beforeX = follower.x;
      const beforeY = follower.y;
      const dx = target.x - follower.x;
      const dy = target.y - follower.y;
      const distance = Math.hypot(dx, dy);
      const speed = Math.max(1, town.player.speed || 235);
      const amount = speed * Math.max(0, dt || 0);
      if (distance <= amount || distance <= 0.001) {
        follower.x = target.x;
        follower.y = target.y;
        if (target.facing) {
          follower.facing = target.facing;
        }
      } else {
        follower.x += dx / distance * amount;
        follower.y += dy / distance * amount;
        if (target.facing) {
          follower.facing = target.facing;
        }
      }
      const moved = distPoint(beforeX, beforeY, follower.x, follower.y) > 0.05;
      updateTownActorWalkAnimation(follower, dt, moved);
    }

    function getTrailPointBehind(distance) {
      const trail = town.trail || [];
      if (trail.length === 0) {
        return { x: town.player.x, y: town.player.y, facing: town.player.facing || "down" };
      }
      let remaining = distance;
      let current = { x: town.player.x, y: town.player.y, facing: town.player.facing || "down" };
      for (let i = trail.length - 1; i >= 0; i -= 1) {
        const next = trail[i];
        const segment = distPoint(current.x, current.y, next.x, next.y);
        if (segment >= remaining && segment > 0) {
          const t = remaining / segment;
          return {
            x: current.x + (next.x - current.x) * t,
            y: current.y + (next.y - current.y) * t,
            facing: current.facing || next.facing || "down",
          };
        }
        remaining -= segment;
        current = next;
      }
      const fallback = trail[0];
      return { x: fallback.x, y: fallback.y, facing: fallback.facing || "down" };
    }

    function getTownFacingDelta(facing) {
      if (facing === "left") return { x: -1, y: 0 };
      if (facing === "right") return { x: 1, y: 0 };
      if (facing === "up") return { x: 0, y: -1 };
      return { x: 0, y: 1 };
    }

    function getOppositeTownFacing(facing) {
      if (facing === "left") return "right";
      if (facing === "right") return "left";
      if (facing === "up") return "down";
      return "up";
    }

    function getTownDynamicNpcInteraction(tileMap, col, row) {
      const actor = ensureTownMapNpcs(tileMap).find((candidate) => candidate
        && !candidate.removed
        && candidate.col === col
        && candidate.row === row);
      if (!actor) {
        return null;
      }
      return {
        id: "townNpc",
        type: "npc",
        npcId: actor.npcId,
        name: actor.name || actor.npcId || "NPC",
        x: actor.x,
        y: actor.y,
        actor,
      };
    }

    function normalizeTownNpcDialogueEntry(entry, config) {
      if (typeof entry === "string") {
        return { speaker: config && config.speaker || config && config.name || undefined, text: entry };
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const text = String(entry.text || entry.message || entry.line || "");
      if (!text) {
        return null;
      }
      return {
        speaker: entry.speaker || entry.name || config && config.speaker || undefined,
        text,
      };
    }

    function normalizeTownNpcDialogue(config) {
      const source = config && (config.dialogue || config.lines || config.talk || config.message);
      const entries = Array.isArray(source) ? source : source ? [source] : [];
      return entries
        .map((entry) => normalizeTownNpcDialogueEntry(entry, config))
        .filter(Boolean);
    }

    function runTownNpcAction(action, actor, config) {
      if (!action) {
        return;
      }
      if (typeof action === "string") {
        game.message = action;
        game.messageTimer = 3;
        return;
      }
      const kind = String(action.kind || action.type || action.action || "").trim();
      if (kind === "message") {
        game.message = String(action.text || action.message || "");
        game.messageTimer = Math.max(0, Number(action.timer) || 3);
      } else if (kind === "acceptQuest") {
        const quest = getQuestById(action.questId || action.id);
        if (quest && acceptTownQuest(quest)) {
          showTownQuestNoticePopup(quest);
          if (quest.fieldMapId === getTownMapId()) {
            ensureTownMapSymbols(getTownTileMap());
          }
        }
      } else if (kind === "custom" && typeof action.run === "function") {
        action.run({ actor, config, game, town, startTownStory, getQuestById, acceptTownQuest });
      }
    }

    function runTownNpcActions(actor, config) {
      if (typeof config.onInteract === "function") {
        config.onInteract({ actor, config, game, town, startTownStory, getQuestById, acceptTownQuest });
      }
      const actions = Array.isArray(config.actions)
        ? config.actions
        : config.action
          ? [config.action]
          : [];
      for (const action of actions) {
        runTownNpcAction(action, actor, config);
      }
    }

    function runTownNpcInteraction(target) {
      const actor = target && target.actor;
      const config = actor && actor.rawConfig || {};
      if (!actor) {
        return;
      }
      actor.facing = getOppositeTownFacing(town.player.facing || "down");
      const lines = normalizeTownNpcDialogue(config);
      if (lines.length > 0) {
        startTownStory(`npc:${actor.npcId || actor.id}`, lines, () => {
          runTownNpcActions(actor, config);
        });
        return;
      }
      runTownNpcActions(actor, config);
    }

    function getTownNpcInteractionFromTileMap(tileMap) {
      if (!tileMap) {
        return null;
      }
      const tile = getTownPlayerTile(tileMap);
      const dir = getTownFacingDelta(town.player.facing || "down");
      const targetCol = tile.col + dir.x;
      const targetRow = tile.row + dir.y;
      const npc = getTownDynamicNpcInteraction(tileMap, targetCol, targetRow);
      if (npc) {
        return npc;
      }
      if (!tileMapSystem || typeof tileMapSystem.getEventsAtTile !== "function" || town.meetingDone) {
        return null;
      }
      const events = tileMapSystem.getEventsAtTile(tileMap, targetCol, targetRow, "interact");
      for (const event of events) {
        const raw = getTownRawMapEvent(event) || {};
        const action = getTownMapEventAction(event);
        if (!isTownMapEventActive(event) || (action !== "partyJoinNpc" && action !== "townNpc")) {
          continue;
        }
        return {
          id: "meetingNpc",
          eventId: raw.id || null,
          npcId: raw.npcId || raw.actorId || raw.characterId || null,
          name: raw.name || raw.npcId || raw.id || "仲間",
        };
      }
      return null;
    }

    function getTownFacilityInteractionFromTileMap(tileMap) {
      if (!tileMap || !tileMapSystem || typeof tileMapSystem.getEventsAtTile !== "function") {
        return null;
      }
      if ((town.player.facing || "down") !== "up") {
        return null;
      }
      const tile = getTownPlayerTile(tileMap);
      const events = tileMapSystem.getEventsAtTile(tileMap, tile.col, tile.row, "interact");
      for (const event of events) {
        const raw = event && event.raw || {};
        const action = event && event.action || raw.type || raw.action || "";
        if (action !== "facilityInteraction") {
          continue;
        }
        const requiredFacing = raw.facing || raw.direction || raw.requiredFacing || null;
        if (requiredFacing && requiredFacing !== town.player.facing) {
          continue;
        }
        const payload = raw.payload || {};
        const facilityId = raw.facilityId || raw.buildingId || raw.targetId || payload.facilityId || null;
        if (!facilityId) {
          continue;
        }
        const building = getTownBuilding(facilityId);
        if (building) {
          return building;
        }
        const tileSize = getTownTileSize(tileMap);
        const template = getTownBuildingTemplateById(facilityId);
        return {
          id: facilityId,
          name: template && template.name || String(raw.name || facilityId),
          sign: template && template.sign || "",
          x: tile.col * tileSize,
          y: tile.row * tileSize,
          w: tileSize,
          h: tileSize,
          door: getTownTileCenter(tileMap, tile.col, tile.row),
        };
      }
      return null;
    }

    function getTownInteraction() {
      if (town.panel || town.story) {
        return null;
      }
      const tileMap = getTownTileMap();
      if (tileMap) {
        const npc = getTownNpcInteractionFromTileMap(tileMap);
        if (npc) {
          return npc;
        }
        return getTownFacilityInteractionFromTileMap(tileMap);
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
        } else if (town.panel.filterOpen) {
          return;
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
          startSelectedQuest();
        } else {
          closeTownPanel();
        }
        return;
      }

      const target = getTownInteraction();
      if (!target) {
        return;
      }

      if (target.type === "npc") {
        runTownNpcInteraction(target);
        return;
      }

      if (target.id === "meetingNpc") {
        startGuildMeetingStory();
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
          game.message = "3人に話しかけよう";
          game.messageTimer = 3;
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
        scroll: 0,
        scrollMax: 0,
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
      if (town.panel && town.panel.abandonConfirm === true) {
        confirmFreeQuestAbandon();
        return;
      }
      if (town.panel && town.panel.replaceQuestId) {
        const message = "破棄するフリー依頼を選んでください。";
        town.panel.message = message;
        game.message = message;
        game.messageTimer = 3;
        return;
      }
      if (isTownAcceptedFreeQuest(quest)) {
        promptFreeQuestAbandon();
        return;
      }
      if (isTownFreeQuestAcceptLimitReached(quest)) {
        promptFreeQuestReplace(quest);
        return;
      }
      if (isTownQuestUnavailable(quest)) {
        const message = getTownQuestUnavailableMessage(quest);
        if (town.panel) {
          town.panel.message = message;
        }
        game.message = message;
        game.messageTimer = 3;
        return;
      }
      town.selectedQuest = quest;
      startSelectedQuest();
    }

    function selectFirstQuestInPanel() {
      if (!town.panel || !Array.isArray(town.panel.quests) || town.panel.quests.length === 0) {
        return;
      }
      const quest = town.panel.quests.find((entry) => entry && (isTownAcceptedFreeQuest(entry) || !isTownQuestUnavailable(entry)));
      if (!quest) {
        game.message = "受けられる依頼がありません。";
        game.messageTimer = 3;
        return;
      }
      showQuestDecisionPanel(quest.id);
    }

    function promptFreeQuestAbandon() {
      const quest = town.selectedQuest || getQuestById(town.panel && town.panel.questId);
      if (!isTownAcceptedFreeQuest(quest)) {
        return;
      }
      town.selectedQuest = quest;
      if (town.panel) {
        town.panel.abandonConfirm = true;
        town.panel.replaceQuestId = null;
        town.panel.message = `${quest.name}の受注を破棄しますか？`;
      }
    }

    function cancelFreeQuestAbandon() {
      if (!town.panel) {
        return;
      }
      town.panel.abandonConfirm = false;
      town.panel.message = "";
    }

    function confirmFreeQuestAbandon() {
      const quest = town.selectedQuest || getQuestById(town.panel && town.panel.questId);
      if (!isTownAcceptedFreeQuest(quest)) {
        cancelFreeQuestAbandon();
        return;
      }
      clearTownAcceptedQuest(quest.id);
      clearTownQuestSymbols(quest.id);
      const message = `${quest.name}の受注を破棄しました。`;
      showQuestListPanel("free");
      game.message = message;
      game.messageTimer = 3;
      if (town.panel) {
        town.panel.message = message;
      }
    }

    function promptFreeQuestReplace(quest) {
      if (!quest || quest.type !== "free" || isTownQuestAccepted(quest.id)) {
        return;
      }
      town.selectedQuest = quest;
      if (town.panel) {
        town.panel.abandonConfirm = false;
        town.panel.replaceQuestId = quest.id;
        town.panel.acceptedFreeQuests = getTownAcceptedFreeQuestViews().map((entry) => ({
          id: entry.id,
          name: entry.name,
          destinationName: getTownQuestDestinationName(entry),
        }));
        town.panel.message = `フリー依頼は${MAX_ACCEPTED_FREE_QUESTS}つまでです。破棄する依頼を選んでください。`;
      }
    }

    function cancelFreeQuestReplace() {
      if (!town.panel) {
        return;
      }
      const message = "フリー依頼の受注をやめました。";
      showQuestListPanel("free");
      game.message = message;
      game.messageTimer = 3;
      if (!town.panel) {
        return;
      }
      town.panel.replaceQuestId = null;
      town.panel.acceptedFreeQuests = [];
      town.panel.message = message;
    }

    function acceptTownQuestAfterAbandon(abandonQuestId) {
      const newQuestId = town.panel && town.panel.replaceQuestId || town.selectedQuest && town.selectedQuest.id;
      const newQuest = getQuestById(newQuestId);
      const abandonQuest = getQuestById(abandonQuestId);
      if (!newQuest || newQuest.type !== "free" || isTownQuestAccepted(newQuest.id) || !isTownQuestEnabled(newQuest)) {
        game.message = "受ける依頼データが見つかりません。";
        game.messageTimer = 3;
        return;
      }
      if (!isTownAcceptedFreeQuest(abandonQuest)) {
        game.message = "破棄する依頼を選んでください。";
        game.messageTimer = 3;
        return;
      }
      clearTownAcceptedQuest(abandonQuest.id);
      clearTownQuestSymbols(abandonQuest.id);
      acceptTownQuest(newQuest);
      closeTownPanel();
      ensureTownMapSymbols(getTownTileMap());
      const destination = getTownQuestDestinationName(newQuest) || "出現場所";
      showTownQuestNoticePopup(newQuest, {
        onComplete: () => {
          game.message = `${abandonQuest.name}を破棄し、${newQuest.name}を受けました。${destination}へ向かいましょう。`;
          game.messageTimer = 5;
        },
      });
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
      } else if (action.kind === "promptAbandonQuest") {
        promptFreeQuestAbandon();
      } else if (action.kind === "confirmAbandonQuest") {
        confirmFreeQuestAbandon();
      } else if (action.kind === "cancelAbandonQuest") {
        cancelFreeQuestAbandon();
      } else if (action.kind === "replaceFreeQuest") {
        acceptTownQuestAfterAbandon(action.abandonQuestId);
      } else if (action.kind === "cancelReplaceFreeQuest") {
        cancelFreeQuestReplace();
      } else if (action.kind === "backToQuestTypes") {
        showQuestTypePanel();
      } else if (action.kind === "backToQuestList") {
        showQuestListPanel(action.type || (town.selectedQuest && town.selectedQuest.type) || "story");
      } else if (action.kind === "startBattle") {
        startSelectedQuest();
      } else if (action.kind === "confirmInnRest") {
        confirmInnRest();
      } else if (action.kind === "buyItem") {
        buyShopItem(action.itemId);
      } else if (action.kind === "focusItemShopQuantity") {
        focusItemShopQuantity(action.itemId);
      } else if (action.kind === "adjustItemShopQuantity") {
        adjustItemShopQuantity(action.itemId, action.delta);
      } else if (action.kind === "selectItemShopCategory") {
        selectItemShopCategory(action.category);
      } else if (action.kind === "selectItemShopItem") {
        selectItemShopItem(action.itemId);
      } else if (action.kind === "selectEquipmentShopTab") {
        selectEquipmentShopTab(action.tab);
      } else if (action.kind === "openEquipmentShopFilter") {
        openEquipmentShopFilterWindow();
      } else if (action.kind === "applyEquipmentShopFilter") {
        applyEquipmentShopFilterWindow();
      } else if (action.kind === "resetEquipmentShopFilterDraft") {
        resetEquipmentShopFilterDraft();
      } else if (action.kind === "closeEquipmentShopFilter") {
        closeEquipmentShopFilterWindow();
      } else if (action.kind === "toggleEquipmentShopFilter") {
        toggleEquipmentShopFilter(action.category, action.value);
      } else if (action.kind === "setEquipmentShopFilterGroup") {
        setEquipmentShopFilterGroup(action.category, action.mode);
      } else if (action.kind === "setEquipmentShopSort") {
        setEquipmentShopSort(action.sortKey, action.sortDir);
      } else if (action.kind === "clearEquipmentShopFilters") {
        clearEquipmentShopFilters();
      } else if (action.kind === "selectEquipmentShopItem") {
        selectEquipmentShopItem(action.itemId, action.equipmentRef);
      } else if (action.kind === "craftEquipment") {
        craftEquipment(action.itemId);
      } else if (action.kind === "upgradeEquipment") {
        upgradeEquipment(action.equipmentRef || action.itemId);
      } else if (action.kind === "resetEquipmentUpgrade") {
        showEquipmentResetConfirmation("upgrade", action.equipmentRef || action.itemId);
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

    function startSelectedQuest() {
      const quest = town.selectedQuest || getQuestById(town.panel && town.panel.questId);
      if (isTownFreeQuestAcceptLimitReached(quest)) {
        promptFreeQuestReplace(quest);
        return;
      }
      if (isTownQuestUnavailable(quest)) {
        const message = getTownQuestUnavailableMessage(quest);
        if (town.panel) {
          town.panel.message = message;
        }
        game.message = message;
        game.messageTimer = 3;
        return;
      }
      if (quest && quest.fieldMapId) {
        acceptTownQuest(quest);
        closeTownPanel();
        if (getTownMapId() === quest.fieldMapId) {
          ensureTownMapSymbols(getTownTileMap());
        }
        const acceptedMessage = `${quest.name}を受けました。${getTownQuestDestinationName(quest) || "出現場所"}へ向かいましょう。`;
        const storyLines = typeof getQuestAcceptedStory === "function" ? getQuestAcceptedStory(quest) : [];
        if (Array.isArray(storyLines) && storyLines.length > 0) {
          showTownQuestNoticePopup(quest, {
            onComplete: () => {
              startTownStory(`questAccepted:${quest.id}`, storyLines, () => {
                game.message = acceptedMessage;
                game.messageTimer = 5;
              });
            },
          });
          return;
        }
        showTownQuestNoticePopup(quest, {
          onComplete: () => {
            game.message = acceptedMessage;
            game.messageTimer = 5;
          },
        });
        return;
      }
      preloadTownBattleSprites(quest);
      resetGame(quest);
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
      clearSavedPartyStatuses();
      game.innRestUsedUntilBattle = true;
      setTownPanelMessage(`全員が全回復しました。-${formatGoldSafe(INN_REST_COST)}`);
    }

    function isInnRestLocked() {
      return Boolean(game.innRestUsedUntilBattle);
    }

    function recoverPartyFull() {
      game.partyDeadById = game.partyDeadById && typeof game.partyDeadById === "object"
        ? game.partyDeadById
        : {};
      for (const member of getRecoveryMembers()) {
        member.hp = member.maxHp;
        member.mp = member.maxMp;
        member.dead = false;
        if (member.id) {
          delete game.partyDeadById[member.id];
        }
        member.shield = 0;
        member.shieldTimer = 0;
        member.shields = [];
        member.frozen = 0;
        member.frozenMax = 0;
        member.burnTimer = 0;
        member.burnMax = 0;
        member.burnTick = 0;
        member.burnTickRate = 1;
        member.burnDamageHpRatio = 0;
        member.burnSource = null;
        member.sleepTimer = 0;
        member.sleepMax = 0;
        member.poisonActive = false;
        member.poisonTick = 0;
        member.poisonTickRate = 1;
        member.poisonDamageHpRatio = 0;
        member.poisonSource = null;
        member.woundStacks = 0;
        member.injuryTimer = 0;
        member.injuryMax = 0;
        member.plantStage = 0;
        member.plantSource = null;
        member.plantUpgradedBy = {};
        member.contemptStacks = 0;
        member.contemptTimer = 0;
        member.contemptMax = 0;
        member.feelTimer = 0;
        member.feelMax = 0;
        member.feelGuardCount = 0;
        member.desteStacks = 0;
        member.regretTimer = 0;
        member.regretMax = 0;
        member.sorrowTimer = 0;
        member.sorrowMax = 0;
        member.sorrowTick = 0;
        member.reunionTimer = 0;
        member.reunionMax = 0;
        member.reunionSource = null;
        member.absorptionLockTimer = 0;
        member.forcedEnemySkillKey = null;
        member.forcedEnemySkillTarget = null;
        member.shadowDashTimer = 0;
        member.shadowDashMax = 0;
        member.rihasPassiveStacks = 0;
        member.rihasPassiveTimer = 0;
        member.rihasPassiveStackCooldown = 0;
        member.castStacks = 0;
        member.stackTimer = 0;
        member.stackCooldown = 0;
        member.forcedTarget = null;
        member.tauntTimer = 0;
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
        selectedItemShopCategory: null,
        selectedItemShopItemId: null,
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

    function selectItemShopCategory(category) {
      if (!town.panel || town.panel.action !== "itemShop") {
        return;
      }
      town.panel.selectedItemShopCategory = category || null;
      town.panel.selectedItemShopItemId = null;
      town.panel.scroll = 0;
      town.panel.scrollMax = 0;
      town.panel.buyQuantityFocusItemId = null;
      town.panel.buyQuantityFreshFocus = false;
    }

    function selectItemShopItem(itemId) {
      if (!town.panel || town.panel.action !== "itemShop") {
        return;
      }
      town.panel.selectedItemShopItemId = itemId || null;
      town.panel.buyQuantityFocusItemId = null;
      town.panel.buyQuantityFreshFocus = false;
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
        filters: createEquipmentShopFilters(),
      };
    }

    function selectEquipmentShopTab(tab) {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      town.panel.tab = tab === "reset" ? "reset" : tab === "upgrade" ? "upgrade" : "craft";
      town.panel.scroll = 0;
      town.panel.scrollMax = 0;
      town.panel.selectedEquipmentShopItemId = null;
      town.panel.selectedEquipmentShopItemRef = null;
      town.panel.message = "";
      town.panel.upgradeResult = null;
      town.panel.confirmation = null;
      town.panel.filterOpen = false;
      town.panel.filterDraft = null;
      town.panel.filterScroll = 0;
      town.panel.filterScrollMax = 0;
    }

    function createEquipmentShopFilters() {
      return {
        weapon: {
          mode: "type",
          weaponTypes: [...EQUIPMENT_SHOP_WEAPON_TYPE_FILTERS],
          unitIds: [],
          ranks: [...EQUIPMENT_SHOP_RANK_FILTERS],
          sortKey: null,
          sortDir: "desc",
        },
        armor: {
          ranks: [...EQUIPMENT_SHOP_RANK_FILTERS],
          slots: [...EQUIPMENT_SHOP_ARMOR_SLOT_FILTERS],
          basicStats: [...EQUIPMENT_SHOP_ARMOR_BASIC_STAT_FILTERS],
          detailStats: [...EQUIPMENT_SHOP_ARMOR_DETAIL_STAT_FILTERS],
          sortKey: null,
          sortDir: "desc",
        },
      };
    }

    function cloneEquipmentShopFilters(filters) {
      const source = filters && typeof filters === "object" ? filters : createEquipmentShopFilters();
      const defaults = createEquipmentShopFilters();
      const weapon = source.weapon && typeof source.weapon === "object" ? source.weapon : defaults.weapon;
      const armor = source.armor && typeof source.armor === "object" ? source.armor : defaults.armor;
      return {
        weapon: {
          mode: weapon.mode === "unit" ? "unit" : "type",
          weaponTypes: Array.isArray(weapon.weaponTypes) ? weapon.weaponTypes.slice() : defaults.weapon.weaponTypes.slice(),
          unitIds: Array.isArray(weapon.unitIds) ? weapon.unitIds.slice() : defaults.weapon.unitIds.slice(),
          ranks: Array.isArray(weapon.ranks) ? weapon.ranks.slice() : defaults.weapon.ranks.slice(),
          sortKey: ["attack", "magic", "rank"].includes(weapon.sortKey) ? weapon.sortKey : null,
          sortDir: weapon.sortDir === "asc" ? "asc" : "desc",
        },
        armor: {
          ranks: Array.isArray(armor.ranks) ? armor.ranks.slice() : defaults.armor.ranks.slice(),
          slots: Array.isArray(armor.slots) ? armor.slots.slice() : defaults.armor.slots.slice(),
          basicStats: Array.isArray(armor.basicStats) ? armor.basicStats.slice() : defaults.armor.basicStats.slice(),
          detailStats: Array.isArray(armor.detailStats) ? armor.detailStats.slice() : defaults.armor.detailStats.slice(),
          sortKey: armor.sortKey === "rank" ? "rank" : null,
          sortDir: armor.sortDir === "asc" ? "asc" : "desc",
        },
      };
    }

    function ensureEquipmentShopFilters() {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return createEquipmentShopFilters();
      }
      if (!town.panel.filters || typeof town.panel.filters !== "object") {
        town.panel.filters = createEquipmentShopFilters();
      }
      const filters = town.panel.filters;
      if (!filters.weapon || typeof filters.weapon !== "object") {
        filters.weapon = createEquipmentShopFilters().weapon;
      }
      if (!filters.armor || typeof filters.armor !== "object") {
        filters.armor = createEquipmentShopFilters().armor;
      }
      if (!Array.isArray(filters.weapon.weaponTypes)) {
        filters.weapon.weaponTypes = [...EQUIPMENT_SHOP_WEAPON_TYPE_FILTERS];
      }
      if (!Array.isArray(filters.weapon.unitIds)) {
        filters.weapon.unitIds = [];
      }
      if (!Array.isArray(filters.weapon.ranks)) {
        filters.weapon.ranks = [...EQUIPMENT_SHOP_RANK_FILTERS];
      }
      if (!["type", "unit"].includes(filters.weapon.mode)) {
        filters.weapon.mode = filters.weapon.unitIds.length ? "unit" : "type";
      }
      if (!["attack", "magic", "rank", null].includes(filters.weapon.sortKey)) {
        filters.weapon.sortKey = null;
      }
      if (filters.weapon.sortDir !== "asc") {
        filters.weapon.sortDir = "desc";
      }
      if (!Array.isArray(filters.armor.ranks)) {
        filters.armor.ranks = [...EQUIPMENT_SHOP_RANK_FILTERS];
      }
      if (!Array.isArray(filters.armor.slots)) {
        filters.armor.slots = [...EQUIPMENT_SHOP_ARMOR_SLOT_FILTERS];
      }
      if (!Array.isArray(filters.armor.basicStats)) {
        filters.armor.basicStats = [...EQUIPMENT_SHOP_ARMOR_BASIC_STAT_FILTERS];
      }
      if (!Array.isArray(filters.armor.detailStats)) {
        filters.armor.detailStats = [...EQUIPMENT_SHOP_ARMOR_DETAIL_STAT_FILTERS];
      }
      if (!["rank", null].includes(filters.armor.sortKey)) {
        filters.armor.sortKey = null;
      }
      if (filters.armor.sortDir !== "asc") {
        filters.armor.sortDir = "desc";
      }
      return filters;
    }

    function ensureEquipmentShopFilterDraft() {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return createEquipmentShopFilters();
      }
      if (!town.panel.filterDraft || typeof town.panel.filterDraft !== "object") {
        town.panel.filterDraft = cloneEquipmentShopFilters(ensureEquipmentShopFilters());
      }
      return town.panel.filterDraft;
    }

    function getMutableEquipmentShopFilters() {
      if (town.panel && town.panel.filterOpen) {
        return ensureEquipmentShopFilterDraft();
      }
      return ensureEquipmentShopFilters();
    }

    function markEquipmentShopFilterEdited() {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      if (town.panel.filterOpen) {
        town.panel.filterScroll = 0;
        town.panel.filterScrollMax = 0;
      } else {
        town.panel.scroll = 0;
        town.panel.scrollMax = 0;
      }
    }

    function openEquipmentShopFilterWindow() {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      town.panel.filterOpen = true;
      town.panel.filterDraft = cloneEquipmentShopFilters(ensureEquipmentShopFilters());
      town.panel.filterScroll = 0;
      town.panel.filterScrollMax = 0;
      town.panel.message = "";
    }

    function selectEquipmentShopItem(itemId, equipmentRef = null) {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      town.panel.selectedEquipmentShopItemId = itemId || null;
      town.panel.selectedEquipmentShopItemRef = equipmentRef || itemId || null;
    }

    function applyEquipmentShopFilterWindow() {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      const draft = cloneEquipmentShopFilters(ensureEquipmentShopFilterDraft());
      town.panel.filters = draft;
      town.panel.filterOpen = false;
      town.panel.filterDraft = null;
      town.panel.filterScroll = 0;
      town.panel.filterScrollMax = 0;
      town.panel.scroll = 0;
      town.panel.scrollMax = 0;
      setTownPanelMessage("フィルターを適用しました。");
    }

    function resetEquipmentShopFilterDraft() {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      const draft = ensureEquipmentShopFilterDraft();
      const defaults = createEquipmentShopFilters();
      if (town.panel.shopKind === "weapon") {
        draft.weapon = defaults.weapon;
      } else {
        draft.armor = defaults.armor;
      }
      town.panel.filterScroll = 0;
      town.panel.filterScrollMax = 0;
      town.panel.message = "フィルターを初期状態に戻しました。適用で反映します。";
    }

    function closeEquipmentShopFilterWindow() {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      town.panel.filterOpen = false;
      town.panel.filterDraft = null;
      town.panel.filterScroll = 0;
      town.panel.filterScrollMax = 0;
      town.panel.message = "";
    }

    function toggleEquipmentShopFilter(category, value) {
      if (!town.panel || town.panel.action !== "equipmentShop" || !value) {
        return;
      }
      const filters = getMutableEquipmentShopFilters();
      if (category === "weaponType") {
        filters.weapon.mode = "type";
        filters.weapon.unitIds = [];
        toggleListValue(filters.weapon.weaponTypes, value);
      } else if (category === "weaponUnit") {
        filters.weapon.mode = "unit";
        filters.weapon.weaponTypes = [];
        toggleListValue(filters.weapon.unitIds, value);
      } else if (category === "weaponRank") {
        toggleListValue(filters.weapon.ranks, value);
      } else if (category === "armorRank") {
        toggleListValue(filters.armor.ranks, value);
      } else if (category === "armorSlot") {
        toggleListValue(filters.armor.slots, value);
      } else if (category === "armorBasicStat") {
        toggleListValue(filters.armor.basicStats, value);
      } else if (category === "armorDetailStat") {
        toggleListValue(filters.armor.detailStats, value);
      }
      markEquipmentShopFilterEdited();
    }

    function setEquipmentShopFilterGroup(category, mode) {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      const filters = getMutableEquipmentShopFilters();
      const values = getEquipmentShopFilterValues(category);
      if (!values) {
        return;
      }
      const next = mode === "all" ? [...values] : [];
      if (category === "weaponType") {
        filters.weapon.mode = "type";
        filters.weapon.weaponTypes = next;
        filters.weapon.unitIds = [];
      } else if (category === "weaponUnit") {
        filters.weapon.mode = "unit";
        filters.weapon.unitIds = next;
        filters.weapon.weaponTypes = [];
      } else if (category === "weaponRank") {
        filters.weapon.ranks = next;
      } else if (category === "armorRank") {
        filters.armor.ranks = next;
      } else if (category === "armorSlot") {
        filters.armor.slots = next;
      } else if (category === "armorBasicStat") {
        filters.armor.basicStats = next;
      } else if (category === "armorDetailStat") {
        filters.armor.detailStats = next;
      }
      markEquipmentShopFilterEdited();
    }

    function getEquipmentShopFilterValues(category) {
      if (category === "weaponType") {
        return EQUIPMENT_SHOP_WEAPON_TYPE_FILTERS;
      }
      if (category === "weaponUnit") {
        return EQUIPMENT_SHOP_UNIT_FILTERS;
      }
      if (category === "weaponRank" || category === "armorRank") {
        return EQUIPMENT_SHOP_RANK_FILTERS;
      }
      if (category === "armorSlot") {
        return EQUIPMENT_SHOP_ARMOR_SLOT_FILTERS;
      }
      if (category === "armorBasicStat") {
        return EQUIPMENT_SHOP_ARMOR_BASIC_STAT_FILTERS;
      }
      if (category === "armorDetailStat") {
        return EQUIPMENT_SHOP_ARMOR_DETAIL_STAT_FILTERS;
      }
      return null;
    }

    function toggleListValue(list, value) {
      const index = list.indexOf(value);
      if (index >= 0) {
        list.splice(index, 1);
      } else {
        list.push(value);
      }
    }

    function setEquipmentShopSort(sortKey, sortDir) {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      const filters = getMutableEquipmentShopFilters();
      const target = town.panel.shopKind === "armor" ? filters.armor : filters.weapon;
      if (sortKey === "default") {
        target.sortKey = null;
        target.sortDir = "desc";
      } else if (sortKey) {
        target.sortKey = target.sortKey === sortKey ? null : sortKey;
      }
      if (sortDir) {
        target.sortDir = sortDir === "asc" ? "asc" : "desc";
      }
      markEquipmentShopFilterEdited();
    }

    function clearEquipmentShopFilters() {
      if (!town.panel || town.panel.action !== "equipmentShop") {
        return;
      }
      const filters = getMutableEquipmentShopFilters();
      if (town.panel.shopKind === "weapon") {
        filters.weapon = createEquipmentShopFilters().weapon;
      } else {
        filters.armor = createEquipmentShopFilters().armor;
      }
      markEquipmentShopFilterEdited();
    }

    function craftEquipment(itemId) {
      const item = getEquipmentItem(itemId);
      if (!item) {
        setTownPanelMessage("装備データが見つかりません。");
        return;
      }
      if (item.shopHidden) {
        setTownPanelMessage("この装備は現在店頭にありません。");
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
        head: "頭",
        body: "胴",
        hands: "手",
        waist: "腰",
        feet: "脚",
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
      const name = item.name || item.id || "装備";
      town.panel.confirmation = {
        type: "upgrade",
        equipmentRef,
        cost: null,
        title: "強化リセット確認",
        message: `${name}の強化Lvを+${currentLevel}から+0に戻します。`,
        note: "この操作は実行後に元へ戻せません。",
        confirmLabel: "リセットする",
        cancelLabel: "やめる",
      };
    }

    function confirmEquipmentReset() {
      const confirmation = town.panel && town.panel.confirmation;
      if (!confirmation) {
        return;
      }
      const { equipmentRef } = confirmation;
      clearEquipmentResetConfirmation();
      resetEquipmentUpgrade(equipmentRef);
    }

    function clearEquipmentResetConfirmation() {
      if (town.panel) {
        town.panel.confirmation = null;
      }
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
        cooldownReduction: "スキル速度",
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
      return getTownQuestView(getTownRawQuestById(questId));
    }

    function getQuestsByType(typeKey) {
      return QUEST_DATA.quests
        .map((quest, index) => ({ quest: getTownQuestView(quest), index }))
        .filter((entry) => entry.quest)
        .filter((entry) => entry.quest.type === typeKey && isTownQuestEnabled(entry.quest))
        .sort((a, b) => {
          const orderDiff = getTownQuestDisplayOrder(a.quest) - getTownQuestDisplayOrder(b.quest);
          return orderDiff || a.index - b.index;
        })
        .map((entry) => entry.quest);
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
        title: quest ? `${quest.fieldMapId ? "依頼の確認" : "出発前の確認"}: ${quest.name}` : "出発前の確認",
        action: "battleGuide",
        questId: quest ? quest.id : null,
        startsInField: Boolean(quest && quest.fieldMapId),
        clickTargets: [],
        sections: [
          quest ? {
            title: "依頼内容",
            lines: [
              `ランク: ${quest.rank || "-"}`,
              `目的: ${quest.objective || "魔物を全滅させる"}`,
              `魔物情報: ${quest.enemyPreview || "不明"}`,
              getTownQuestDestinationName(quest) ? `出現場所: ${getTownQuestDestinationName(quest)}` : null,
              `報酬: ${quest.reward || "未定"}`,
            ].filter(Boolean),
          } : null,
          quest && quest.fieldMapId ? {
            title: "受注後",
            lines: [
              "依頼を受けても自動では移動しない。任意のタイミングで出現場所へ向かう。",
              "出現場所のマップに入ると、依頼シンボルが野良シンボルとは別枠で出現する。",
            ],
          } : null,
          {
            title: "戦闘の基本",
            lines: [
              "移動は自動。基本距離を保ち、危険な予兆もできる範囲で避ける。",
              "射程外のスキルは発動位置まで移動予約し、射程内で詠唱を始める。",
              `構え中は${fireLabel}で発動、${cancelLabel}でキャンセル。`,
              "ヒール/シェルトはカーソル上の味方、攻撃スキルは魔物や地点を狙う。",
              "指示スキルは通常スキル枠にセットし、味方への指示や魔物へのフォーカスに使う。",
            ],
          },
          {
            title: "操作",
            lines: [
              `左5枠: ${skillLabels} / 必殺: ${ultLabels.finald} / ページ切替: ${pageLabel}`,
              `${fireLabel}: 発動 / ${cancelLabel}: 構えキャンセル / アイテム: ${itemLabels}`,
              `右上メニューまたは${menuLabel}: 設定・装備確認。戦闘中は時間停止。`,
              `${ultLabels.ulpes}/${ultLabels.rihas}/${ultLabels.sushia}: 仲間の必殺技 / 勝利条件: 魔物全滅`,
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
      if (town.panel && town.panel.action === "equipmentShop" && town.panel.filterOpen) {
        closeEquipmentShopFilterWindow();
        return;
      }
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
      getTownEventActors,
      getTownNpcActors,
      getTownMonsterSymbols,
      updateTown,
      updateTownCamera,
      getTownInteraction,
      interactTown,
      switchTownMap,
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
