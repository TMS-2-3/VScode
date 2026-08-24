(() => {
  "use strict";

  window.createHealerTownRenderer = function createHealerTownRenderer(context) {
    const {
      canvasCtx: ctx,
      TAU,
      TOWN_WIDTH,
      TOWN_HEIGHT,
      view,
      game,
      town,
      player,
      party,
      playerProfile,
      profileClickTargets,
      COLORS,
      CHARACTER_DEFS,
      SKILL_DATA,
      BASE_CRIT_CHANCE,
      BASE_CRIT_DAMAGE_RATE,
      MOOD_BASELINE,
      STATUS_DATA,
      EQUIPMENT_DATA,
      MATERIAL_DATA,
      itemSystem,
      tileMapSystem,
      getEquipmentInstancesByItemId,
      getEquipmentItemRef,
      getEquipmentBaseItemId,
      getEquipmentOwnedCount: getEquipmentOwnedCountFromSystem,
      getEquipmentUpgradeLevel: getEquipmentUpgradeLevelFromSystem,
      getEffectiveStat,
      normalizeEquipment,
      normalizeLoadout,
      getDefaultLoadout,
      getGold,
      formatGold,
      getPlayerFirstName,
      getPronounChoices,
      getProfileNameInputRects,
      updateProfileNameInput,
      selectProfileGender,
      selectProfilePronoun,
      confirmProfileName,
      getTownBuilding,
      getTownEventActors,
      getTownNpcActors,
      getTownMonsterSymbols,
      getQuestTypes,
      getQuestsByType,
      getQuestById,
      getKeybindLabel,
    } = context;

  const MAX_ACCEPTED_FREE_QUESTS = 3;
  const INN_PARTY_UNIT_ORDER = ["finald", "ulpes", "rihas", "sushia"];
  const ITEM_SHOP_CATEGORIES = [
    { key: "healing", label: "回復" },
    { key: "mp", label: "MP回復" },
    { key: "mood", label: "調子" },
    { key: "support", label: "戦闘補助" },
    { key: "other", label: "その他" },
  ];

  function getActionLabel(actionId, fallback) {
    return typeof getKeybindLabel === "function" ? getKeybindLabel(actionId) || fallback : fallback;
  }

  function getInteractLabel() {
    return getActionLabel("field.interact", "E");
  }

  function getBackLabel() {
    return getActionLabel("common.menuBack", "Esc");
  }

  function isQuestAcceptedForTown(quest) {
    return Boolean(quest && town && town.acceptedQuestIds && town.acceptedQuestIds[quest.id] === true);
  }

  function isQuestCompletedForTown(quest) {
    return Boolean(quest && quest.type === "story" && town && town.completedQuestIds && town.completedQuestIds[quest.id] === true);
  }

  function getAcceptedFreeQuestCountForTown(ignoreQuestId = "") {
    const ignoredId = String(ignoreQuestId || "");
    if (!town || !town.acceptedQuestIds || typeof getQuestsByType !== "function") {
      return 0;
    }
    const acceptedIds = new Set(Object.keys(town.acceptedQuestIds).filter((questId) => questId && questId !== ignoredId && town.acceptedQuestIds[questId] === true));
    return getQuestsByType("free").filter((quest) => quest && acceptedIds.has(quest.id)).length;
  }

  function isFreeQuestAcceptLimitReachedForTown(quest) {
    return Boolean(
      quest
      && quest.type === "free"
      && !isQuestAcceptedForTown(quest)
      && getAcceptedFreeQuestCountForTown(quest.id) >= MAX_ACCEPTED_FREE_QUESTS
    );
  }

  function isQuestUnavailableForTown(quest) {
    return isQuestAcceptedForTown(quest) || isQuestCompletedForTown(quest);
  }

  function getQuestStatusText(quest) {
    if (isQuestCompletedForTown(quest)) {
      return "クリア済み";
    }
    if (isQuestAcceptedForTown(quest)) {
      return "受注中";
    }
    if (isFreeQuestAcceptLimitReachedForTown(quest)) {
      return "受注上限";
    }
    return "";
  }

  function getAvailableQuestCount(typeKey) {
    return getQuestsByType(typeKey).filter((quest) => !isQuestUnavailableForTown(quest)).length;
  }

  function getActiveStoryQuestForTownField() {
    if (typeof getQuestsByType !== "function") {
      return null;
    }
    return getQuestsByType("story")
      .find((quest) => quest && isQuestAcceptedForTown(quest) && !isQuestCompletedForTown(quest)) || null;
  }

  function getAcceptedFreeQuestsForTownField() {
    if (typeof getQuestsByType !== "function") {
      return [];
    }
    return getQuestsByType("free")
      .filter((quest) => quest && isQuestAcceptedForTown(quest));
  }

  function getAcceptedFreeQuestsForReplacePanel() {
    const panelEntries = town && town.panel && Array.isArray(town.panel.acceptedFreeQuests)
      ? town.panel.acceptedFreeQuests
      : [];
    const entries = panelEntries.length
      ? panelEntries
      : getAcceptedFreeQuestsForTownField();
    return entries
      .map((entry) => {
        const quest = entry && entry.id && typeof getQuestById === "function" ? getQuestById(entry.id) : null;
        const name = String(quest && quest.name || entry && entry.name || "フリー依頼").trim();
        const destination = getQuestDestinationName(quest) || String(entry && (entry.destinationName || entry.fieldLocation) || "").trim();
        return {
          id: entry && entry.id || quest && quest.id || "",
          name,
          destination,
        };
      })
      .filter((entry) => entry.id);
  }

  function getQuestDestinationName(quest) {
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
    const explicit = String(quest.destinationName || quest.fieldLocation || "").trim();
    if (explicit) {
      return explicit;
    }
    return String(quest.recommended || "").trim();
  }

  const EQUIPMENT_RANK_FILTERS = ["D", "C", "B", "A", "S"];
  const EQUIPMENT_SHOP_WEAPON_TYPES = ["片手剣", "両手剣", "拳具", "棒具", "杖", "魔導書", "楽器"];
  const WEAPON_CRAFT_GRID_SLOTS = EQUIPMENT_SHOP_WEAPON_TYPES.map((type) => ({ key: type, label: type }));
  const EQUIPMENT_SHOP_UNITS = [
    { id: "ulpes", label: "ウルペス" },
    { id: "rihas", label: "リハス" },
    { id: "sushia", label: "スシア" },
    { id: "finald", label: "アルジュナ" },
  ];
  const WEAPON_ALLOWED_UNIT_FALLBACK = {
    "片手剣": ["ulpes", "rihas"],
    "両手剣": ["ulpes"],
    "拳具": ["rihas"],
    "棒具": ["rihas", "sushia"],
    "杖": ["sushia"],
    "魔導書": ["finald", "sushia"],
    "楽器": ["finald"],
  };
  const ARMOR_SLOT_FILTERS = [
    { key: "head", label: "頭" },
    { key: "body", label: "胴" },
    { key: "legs", label: "脚" },
    { key: "feet", label: "靴" },
    { key: "hands", label: "手" },
    { key: "accessory", label: "アクセサリ" },
  ];
  const ARMOR_CRAFT_GRID_SLOTS = ARMOR_SLOT_FILTERS;
  const ARMOR_BASIC_STAT_FILTERS = [
    { key: "maxHp", label: "HP" },
    { key: "maxMp", label: "MP" },
    { key: "attack", label: "攻撃力" },
    { key: "magic", label: "魔力" },
    { key: "defense", label: "防御力" },
    { key: "magicDefense", label: "魔法防御力" },
  ];
  const ARMOR_DETAIL_STAT_FILTERS = [
    { key: "critChance", label: "会心率" },
    { key: "critDamage", label: "会心ダメージ" },
    { key: "guardChance", label: "ガード率" },
    { key: "guardDamageReduction", label: "ガード軽減率" },
    { key: "damageBoost", label: "与ダメージ率" },
    { key: "damageResistance", label: "被ダメージ率" },
    { key: "physicalDamageBoost", label: "物理与ダメージ率" },
    { key: "physicalDamageResistance", label: "物理被ダメージ率" },
    { key: "magicDamageBoost", label: "魔法与ダメージ率" },
    { key: "magicDamageResistance", label: "魔法被ダメージ率" },
    { key: "hpRegenRate", label: "HP再生率" },
    { key: "mpRegenRate", label: "MP再生率" },
    { key: "castSpeed", label: "詠唱速度" },
    { key: "cooldownReduction", label: "スキル速度" },
    { key: "actionSpeed", label: "行動速度" },
    { key: "ultimateChargeRate", label: "ゲージ上昇率" },
    { key: "moveSpeed", label: "移動速度" },
  ];

  const TOWN_CHARACTER_SPRITE_PATHS = {
    sushia: "sushia_img",
    ulpes: "ulpes_img",
    rihas: "rihas_img",
  };
  const ARJUNA_TOWN_SPRITE_PATHS = {
    male: "arjuna_man_img",
    female: "arjuna_woman_img",
  };
  const TOWN_WALK_DIRECTIONS = ["down", "left", "right", "up"];
  const TOWN_WALK_FRAMES = [1, 2, 3];
  const TOWN_TILE_CHARACTER_FOOT_OFFSET_Y = 7;
  const TOWN_MARGIN_DEPTH_DRAW_PADDING = 2;
  const townWalkImages = createTownWalkImages();
  const profileAppearanceImages = createProfileAppearanceImages();
  let townTileMapRenderCache = null;
  let townMarginDepthRenderCache = null;
  let townDebugGridCache = null;
  let lastTownMapDebugMode = false;

  function createTownWalkImages() {
    const images = {};
    if (typeof Image !== "function") {
      return images;
    }
    const spritePaths = {
      ...TOWN_CHARACTER_SPRITE_PATHS,
      arjunaMale: ARJUNA_TOWN_SPRITE_PATHS.male,
      arjunaFemale: ARJUNA_TOWN_SPRITE_PATHS.female,
    };
    for (const [unitId, spritePath] of Object.entries(spritePaths)) {
      images[unitId] = {};
      for (const direction of TOWN_WALK_DIRECTIONS) {
        images[unitId][direction] = {};
        for (const frame of TOWN_WALK_FRAMES) {
          const image = new Image();
          image.src = `img/char/${spritePath}/walk/${direction}_${String(frame).padStart(2, "0")}.png`;
          images[unitId][direction][frame] = image;
        }
      }
    }
    return images;
  }

  function ensureTownWalkImageSet(imageKey, spritePath) {
    if (!imageKey || !spritePath || typeof Image !== "function") {
      return;
    }
    if (townWalkImages[imageKey]) {
      return;
    }
    townWalkImages[imageKey] = {};
    for (const direction of TOWN_WALK_DIRECTIONS) {
      townWalkImages[imageKey][direction] = {};
      for (const frame of TOWN_WALK_FRAMES) {
        const image = new Image();
        image.src = `img/char/${spritePath}/walk/${direction}_${String(frame).padStart(2, "0")}.png`;
        townWalkImages[imageKey][direction][frame] = image;
      }
    }
  }

  function createProfileAppearanceImages() {
    const images = {};
    if (typeof Image !== "function") {
      return images;
    }
    for (const [key, spritePath] of Object.entries(ARJUNA_TOWN_SPRITE_PATHS)) {
      const image = new Image();
      image.src = `img/char/${spritePath}/default/front.png`;
      images[key] = image;
    }
    return images;
  }

  function getTownWalkImage(unitId, facing, frame, spritePath = null) {
    const imageKey = unitId === "finald"
      ? playerProfile.gender === "女の子" ? "arjunaFemale" : "arjunaMale"
      : unitId;
    ensureTownWalkImageSet(imageKey, spritePath);
    const direction = TOWN_WALK_DIRECTIONS.includes(facing) ? facing : "down";
    const normalizedFrame = TOWN_WALK_FRAMES.includes(frame) ? frame : 1;
    return townWalkImages[imageKey] && townWalkImages[imageKey][direction] && townWalkImages[imageKey][direction][normalizedFrame] || null;
  }

  function isTownImageReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
  }

  function createTownRenderCanvas(width, height) {
    const safeWidth = Math.max(1, Math.ceil(Number(width) || 1));
    const safeHeight = Math.max(1, Math.ceil(Number(height) || 1));
    if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(safeWidth, safeHeight);
    }
    if (typeof document !== "undefined" && document.createElement) {
      const canvas = document.createElement("canvas");
      canvas.width = safeWidth;
      canvas.height = safeHeight;
      return canvas;
    }
    return null;
  }

  function getTownMapCacheId(map) {
    return String((map && (map.id || map.name)) || "map");
  }

  function getTownMapPixelSize(map) {
    return tileMapSystem && typeof tileMapSystem.getMapPixelSize === "function"
      ? tileMapSystem.getMapPixelSize(map)
      : {
          w: Math.max(1, Math.floor(Number(map && map.width) || 0) * Math.floor(Number(map && map.tileSize) || 48)),
          h: Math.max(1, Math.floor(Number(map && map.height) || 0) * Math.floor(Number(map && map.tileSize) || 48)),
        };
  }

  function getTownFullMapViewport(map, mapSize = getTownMapPixelSize(map)) {
    return { x: 0, y: 0, w: Math.max(1, mapSize.w || 1), h: Math.max(1, mapSize.h || 1) };
  }

  function normalizeTownTileId(tileEntry) {
    if (tileEntry && typeof tileEntry === "object") {
      return normalizeTownTileId(tileEntry.tileId ?? tileEntry.id ?? tileEntry.key ?? null);
    }
    if (tileEntry === null || tileEntry === undefined || tileEntry === "" || tileEntry === "." || tileEntry === false) {
      return null;
    }
    return String(tileEntry);
  }

  function isTownTileEntryImageReady(tileEntry) {
    const tileId = normalizeTownTileId(tileEntry);
    if (!tileId || !tileMapSystem || typeof tileMapSystem.getTileDef !== "function") {
      return true;
    }
    const tile = tileMapSystem.getTileDef(tileId);
    const src = tile && (tile.image || tile.src);
    if (!src || typeof tileMapSystem.getTileImage !== "function") {
      return true;
    }
    const image = tileMapSystem.getTileImage(tileId);
    return !image || image.complete === true;
  }

  function getTownGroundTileLayerIds(map) {
    if (!map || !Array.isArray(map.layers)) {
      return ["ground"];
    }
    return map.layers
      .filter((layer) => layer && layer.id === "ground" && layer.visible !== false && layer.draw !== false)
      .map((layer) => layer.id);
  }

  function getTownTileMapCacheLayerIds(map) {
    return [...getTownGroundTileLayerIds(map), ...getTownForegroundTileLayerIds(map)];
  }

  function areTownTileMapCacheImagesReady(map) {
    if (!map || !tileMapSystem || typeof tileMapSystem.forEachMapTileEntry !== "function") {
      return false;
    }
    let ready = true;
    tileMapSystem.forEachMapTileEntry(map, (entry) => {
      if (!isTownTileEntryImageReady(entry.tileEntry)) {
        ready = false;
      }
    }, {
      layerIds: getTownTileMapCacheLayerIds(map),
      viewport: getTownFullMapViewport(map),
    });
    return ready;
  }

  function getTownTileMapCacheKey(map, mapSize) {
    const layerIds = getTownTileMapCacheLayerIds(map).join(",");
    return [
      getTownMapCacheId(map),
      Math.floor(Number(map && map.width) || 0),
      Math.floor(Number(map && map.height) || 0),
      Math.floor(Number(map && map.tileSize) || 48),
      Math.round(Number(mapSize && mapSize.w) || 0),
      Math.round(Number(mapSize && mapSize.h) || 0),
      layerIds,
    ].join("|");
  }

  function getTownTileMapRenderCache(map) {
    if (!map || !tileMapSystem || typeof tileMapSystem.drawTileMap !== "function") {
      return null;
    }
    const mapSize = getTownMapPixelSize(map);
    const key = getTownTileMapCacheKey(map, mapSize);
    if (townTileMapRenderCache && townTileMapRenderCache.key === key) {
      if (!townTileMapRenderCache.ready && areTownTileMapCacheImagesReady(map)) {
        buildTownTileMapRenderCache(townTileMapRenderCache, map, mapSize);
      }
      return townTileMapRenderCache;
    }
    townTileMapRenderCache = {
      key,
      ready: false,
      mapSize,
      baseCanvas: null,
      depthGroups: [],
    };
    if (areTownTileMapCacheImagesReady(map)) {
      buildTownTileMapRenderCache(townTileMapRenderCache, map, mapSize);
    }
    return townTileMapRenderCache;
  }

  function buildTownTileMapRenderCache(cache, map, mapSize) {
    if (!cache || !map) {
      return false;
    }
    const baseCanvas = buildTownTileMapBaseCanvas(map, mapSize);
    const depthGroups = buildTownTileMapDepthGroups(map, mapSize);
    if (!baseCanvas || !depthGroups) {
      cache.ready = false;
      return false;
    }
    cache.baseCanvas = baseCanvas;
    cache.depthGroups = depthGroups;
    cache.ready = true;
    return true;
  }

  function buildTownTileMapBaseCanvas(map, mapSize) {
    const canvas = createTownRenderCanvas(mapSize.w, mapSize.h);
    const cacheCtx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!cacheCtx) {
      return null;
    }
    cacheCtx.fillStyle = "#47784f";
    cacheCtx.fillRect(0, 0, Math.max(1, mapSize.w || TOWN_WIDTH), Math.max(1, mapSize.h || TOWN_HEIGHT));
    const groundLayerIds = getTownGroundTileLayerIds(map);
    if (groundLayerIds.length) {
      tileMapSystem.drawTileMap(cacheCtx, map, {
        drawFallback: true,
        drawDefaultTile: false,
        layerIds: groundLayerIds,
        viewport: getTownFullMapViewport(map, mapSize),
      });
    }
    return canvas;
  }

  function buildTownTileMapDepthGroups(map, mapSize) {
    if (!tileMapSystem || typeof tileMapSystem.forEachMapTileEntry !== "function" || typeof tileMapSystem.drawTile !== "function") {
      return null;
    }
    const layerIds = getTownForegroundTileLayerIds(map);
    if (!layerIds.length) {
      return [];
    }
    const groupsBySortY = new Map();
    let order = 0;
    tileMapSystem.forEachMapTileEntry(map, (entry) => {
      const sortY = Number.isFinite(entry.drawBottomY) ? entry.drawBottomY : entry.y + entry.tileSize;
      const key = String(Math.round(sortY * 100) / 100);
      const left = entry.x + (Number.isFinite(entry.drawOffsetX) ? entry.drawOffsetX : 0);
      const top = entry.y + (Number.isFinite(entry.drawOffsetY) ? entry.drawOffsetY : 0);
      const right = left + Math.max(1, Number(entry.drawWidth) || entry.tileSize);
      const bottom = top + Math.max(1, Number(entry.drawHeight) || entry.tileSize);
      let group = groupsBySortY.get(key);
      if (!group) {
        group = {
          sortY,
          order,
          entries: [],
          minX: left,
          minY: top,
          maxX: right,
          maxY: bottom,
        };
        groupsBySortY.set(key, group);
      }
      group.entries.push({ ...entry, order: order++ });
      group.minX = Math.min(group.minX, left);
      group.minY = Math.min(group.minY, top);
      group.maxX = Math.max(group.maxX, right);
      group.maxY = Math.max(group.maxY, bottom);
    }, {
      layerIds,
      viewport: getTownFullMapViewport(map, mapSize),
    });

    const groups = [...groupsBySortY.values()].sort((a, b) => (a.sortY - b.sortY) || (a.order - b.order));
    for (const group of groups) {
      group.x = Math.floor(group.minX);
      group.y = Math.floor(group.minY);
      group.w = Math.max(1, Math.ceil(group.maxX) - group.x);
      group.h = Math.max(1, Math.ceil(group.maxY) - group.y);
      const canvas = createTownRenderCanvas(group.w, group.h);
      const cacheCtx = canvas && canvas.getContext && canvas.getContext("2d");
      if (!cacheCtx) {
        return null;
      }
      group.entries.sort((a, b) => a.order - b.order);
      for (const entry of group.entries) {
        tileMapSystem.drawTile(cacheCtx, entry.tileEntry, entry.x - group.x, entry.y - group.y, entry.tileSize, { drawFallback: true });
      }
      group.canvas = canvas;
      delete group.entries;
      delete group.minX;
      delete group.minY;
      delete group.maxX;
      delete group.maxY;
    }
    return groups;
  }

  function getTownMarginDepthBounds(map, viewport, drawPadding = TOWN_MARGIN_DEPTH_DRAW_PADDING) {
    const tileSize = tileMapSystem && typeof tileMapSystem.getTileSize === "function"
      ? tileMapSystem.getTileSize(map)
      : Math.max(1, Math.floor(Number(map && map.tileSize) || 48));
    const mapSize = getTownMapPixelSize(map);
    const safeViewport = viewport || { x: 0, y: 0, w: mapSize.w, h: mapSize.h };
    const padding = Math.max(1, Math.floor(Number(drawPadding) || 1));
    const viewX = Number(safeViewport.x) || 0;
    const viewY = Number(safeViewport.y) || 0;
    const viewW = Math.max(0, Number(safeViewport.w) || 0);
    const viewH = Math.max(0, Number(safeViewport.h) || 0);
    return {
      tileSize,
      minCol: Math.floor(viewX / tileSize) - padding,
      minRow: Math.floor(viewY / tileSize) - padding,
      maxCol: Math.ceil((viewX + viewW) / tileSize) + padding,
      maxRow: Math.ceil((viewY + viewH) / tileSize) + padding,
      mapWidth: Math.floor(Number(map && map.width) || 0),
      mapHeight: Math.floor(Number(map && map.height) || 0),
    };
  }

  function getTownMarginDepthCacheKey(map, layerIds, bounds) {
    return [
      getTownMapCacheId(map),
      Math.floor(Number(map && map.width) || 0),
      Math.floor(Number(map && map.height) || 0),
      Math.floor(Number(map && map.tileSize) || 48),
      layerIds.join(","),
      bounds.tileSize,
      bounds.minCol,
      bounds.minRow,
      bounds.maxCol,
      bounds.maxRow,
    ].join("|");
  }

  function getTownMarginEntrySide(entry, map) {
    const mapWidth = Math.floor(Number(map && map.width) || 0);
    if (entry && entry.col < 0) {
      return "left";
    }
    if (entry && entry.col >= mapWidth) {
      return "right";
    }
    return "middle";
  }

  function getTownMarginEntryOrderBase(side) {
    if (side === "left") {
      return -100000;
    }
    if (side === "right") {
      return 900000;
    }
    return 400000;
  }

  function areTownMarginDepthImagesReady(map, layerIds, viewport) {
    if (!tileMapSystem || typeof tileMapSystem.forEachMarginTileEntry !== "function") {
      return false;
    }
    let ready = true;
    tileMapSystem.forEachMarginTileEntry(map, (entry) => {
      if (!isTownTileEntryImageReady(entry.tileEntry)) {
        ready = false;
      }
    }, {
      layerIds,
      viewport,
      drawPadding: TOWN_MARGIN_DEPTH_DRAW_PADDING,
    });
    return ready;
  }

  function buildTownMarginDepthGroups(map, layerIds, viewport) {
    if (!tileMapSystem || typeof tileMapSystem.forEachMarginTileEntry !== "function" || typeof tileMapSystem.drawTile !== "function") {
      return null;
    }
    const groupsByKey = new Map();
    let order = 0;
    tileMapSystem.forEachMarginTileEntry(map, (entry) => {
      const sortY = Number.isFinite(entry.drawBottomY) ? entry.drawBottomY : entry.y + entry.tileSize;
      const side = getTownMarginEntrySide(entry, map);
      const key = `${Math.round(sortY * 100) / 100}|${side}`;
      const left = entry.x + (Number.isFinite(entry.drawOffsetX) ? entry.drawOffsetX : 0);
      const top = entry.y + (Number.isFinite(entry.drawOffsetY) ? entry.drawOffsetY : 0);
      const right = left + Math.max(1, Number(entry.drawWidth) || entry.tileSize);
      const bottom = top + Math.max(1, Number(entry.drawHeight) || entry.tileSize);
      let group = groupsByKey.get(key);
      if (!group) {
        group = {
          sortY,
          order: getTownMarginEntryOrderBase(side) + order,
          entries: [],
          minX: left,
          minY: top,
          maxX: right,
          maxY: bottom,
        };
        groupsByKey.set(key, group);
      }
      group.entries.push({ ...entry, order: order++ });
      group.minX = Math.min(group.minX, left);
      group.minY = Math.min(group.minY, top);
      group.maxX = Math.max(group.maxX, right);
      group.maxY = Math.max(group.maxY, bottom);
    }, {
      layerIds,
      viewport,
      drawPadding: TOWN_MARGIN_DEPTH_DRAW_PADDING,
    });

    const groups = [...groupsByKey.values()].sort((a, b) => (a.sortY - b.sortY) || (a.order - b.order));
    for (const group of groups) {
      group.x = Math.floor(group.minX);
      group.y = Math.floor(group.minY);
      group.w = Math.max(1, Math.ceil(group.maxX) - group.x);
      group.h = Math.max(1, Math.ceil(group.maxY) - group.y);
      const canvas = createTownRenderCanvas(group.w, group.h);
      const cacheCtx = canvas && canvas.getContext && canvas.getContext("2d");
      if (!cacheCtx) {
        return null;
      }
      group.entries.sort((a, b) => (a.order - b.order));
      for (const entry of group.entries) {
        tileMapSystem.drawTile(cacheCtx, entry.tileEntry, entry.x - group.x, entry.y - group.y, entry.tileSize, { drawFallback: true });
      }
      group.canvas = canvas;
      delete group.entries;
      delete group.minX;
      delete group.minY;
      delete group.maxX;
      delete group.maxY;
    }
    return groups;
  }

  function getTownMarginDepthRenderCache(map, layerIds, viewport) {
    if (!map || !layerIds.length || !tileMapSystem || typeof tileMapSystem.forEachMarginTileEntry !== "function") {
      return null;
    }
    const bounds = getTownMarginDepthBounds(map, viewport);
    if (bounds.minCol >= 0 && bounds.minRow >= 0 && bounds.maxCol < bounds.mapWidth && bounds.maxRow < bounds.mapHeight) {
      return { key: "", ready: true, groups: [] };
    }
    const key = getTownMarginDepthCacheKey(map, layerIds, bounds);
    if (townMarginDepthRenderCache && townMarginDepthRenderCache.key === key) {
      if (!townMarginDepthRenderCache.ready && areTownMarginDepthImagesReady(map, layerIds, viewport)) {
        townMarginDepthRenderCache.groups = buildTownMarginDepthGroups(map, layerIds, viewport) || [];
        townMarginDepthRenderCache.ready = true;
      }
      return townMarginDepthRenderCache;
    }
    townMarginDepthRenderCache = {
      key,
      ready: false,
      groups: [],
    };
    if (areTownMarginDepthImagesReady(map, layerIds, viewport)) {
      townMarginDepthRenderCache.groups = buildTownMarginDepthGroups(map, layerIds, viewport) || [];
      townMarginDepthRenderCache.ready = true;
    }
    return townMarginDepthRenderCache;
  }

  function appendTownMarginDepthGroupDrawables(drawables, map, layerIds, viewport) {
    if (!Array.isArray(drawables)) {
      return;
    }
    const cache = getTownMarginDepthRenderCache(map, layerIds, viewport);
    if (!cache || !cache.ready) {
      return;
    }
    for (const group of cache.groups || []) {
      if (!isTownDepthGroupVisible(group, viewport)) {
        continue;
      }
      drawables.push({
        type: "marginGroup",
        sortY: group.sortY,
        order: group.order,
        group,
      });
    }
  }

  function getTownDebugGridCache(map) {
    if (!map || !tileMapSystem || typeof tileMapSystem.drawDebugGrid !== "function") {
      return null;
    }
    const mapSize = getTownMapPixelSize(map);
    const key = [
      getTownMapCacheId(map),
      Math.floor(Number(map.width) || 0),
      Math.floor(Number(map.height) || 0),
      Math.floor(Number(map.tileSize) || 48),
      Math.round(mapSize.w || 0),
      Math.round(mapSize.h || 0),
      "debug-grid",
    ].join("|");
    if (townDebugGridCache && townDebugGridCache.key === key) {
      return townDebugGridCache;
    }
    const canvas = createTownRenderCanvas(mapSize.w, mapSize.h);
    const cacheCtx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!cacheCtx) {
      return null;
    }
    tileMapSystem.drawDebugGrid(cacheCtx, map, {
      viewport: getTownFullMapViewport(map, mapSize),
    });
    townDebugGridCache = { key, canvas, mapSize };
    return townDebugGridCache;
  }

  function drawCachedTownCanvas(canvas, viewport, mapSize) {
    if (!canvas || !viewport) {
      return false;
    }
    const sx = Math.max(0, Math.floor(Number(viewport.x) || 0));
    const sy = Math.max(0, Math.floor(Number(viewport.y) || 0));
    const maxW = Math.max(1, Math.ceil(Number(mapSize && mapSize.w) || canvas.width || 1));
    const maxH = Math.max(1, Math.ceil(Number(mapSize && mapSize.h) || canvas.height || 1));
    const sw = Math.max(0, Math.min(maxW - sx, Math.ceil(Number(viewport.w) || maxW)));
    const sh = Math.max(0, Math.min(maxH - sy, Math.ceil(Number(viewport.h) || maxH)));
    if (sw <= 0 || sh <= 0) {
      return false;
    }
    ctx.drawImage(canvas, sx, sy, sw, sh, sx, sy, sw, sh);
    return true;
  }

  function isTownDepthGroupVisible(group, viewport) {
    if (!group || !viewport) {
      return false;
    }
    const viewX = Number(viewport.x) || 0;
    const viewY = Number(viewport.y) || 0;
    const viewW = Math.max(0, Number(viewport.w) || 0);
    const viewH = Math.max(0, Number(viewport.h) || 0);
    return group.x + group.w >= viewX
      && group.y + group.h >= viewY
      && group.x <= viewX + viewW
      && group.y <= viewY + viewH;
  }

  function drawTown() {
    ctx.fillStyle = "#3f6a48";
    ctx.fillRect(0, 0, view.w, view.h);

    const transform = getTownMapTransform();
    ctx.save();
    try {
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);
      ctx.translate(-(transform.cameraX || 0), -(transform.cameraY || 0));
      const usingTileMap = drawTownTileMapBase(transform);
      if (!usingTileMap) {
        drawTownTerrain();
        drawTownRoads();
        drawTownProps();
        drawTownBuildings();
      }
      if (usingTileMap) {
        drawTownTileMapDepthSorted(transform);
        drawTownTileMapDebug(transform);
        drawTownInteractionHighlight(town.interaction || null);
      } else {
        drawTownCharacters();
      }
    } finally {
      ctx.restore();
    }

    drawTownMapNamePopup();
    drawTownActiveStoryQuestHud();
    drawTownPanel();
    drawTownReturnFade();
  }

  function getTownMapTransform() {
    const tileMap = getTownTileMap();
    if (tileMap) {
      return getTownTileMapTransform(tileMap);
    }
    const marginX = 28;
    const marginTop = 112;
    const marginBottom = 34;
    const scale = Math.min((view.w - marginX * 2) / TOWN_WIDTH, (view.h - marginTop - marginBottom) / TOWN_HEIGHT);
    const safeScale = Math.max(0.18, scale);
    return {
      scale: safeScale,
      x: (view.w - TOWN_WIDTH * safeScale) / 2,
      y: marginTop + Math.max(0, view.h - marginTop - marginBottom - TOWN_HEIGHT * safeScale) / 2,
      cameraX: 0,
      cameraY: 0,
      viewportW: TOWN_WIDTH,
      viewportH: TOWN_HEIGHT,
    };
  }

  function getTownTileMapTransform(tileMap) {
    const mapSize = tileMapSystem && typeof tileMapSystem.getMapPixelSize === "function"
      ? tileMapSystem.getMapPixelSize(tileMap)
      : { w: TOWN_WIDTH, h: TOWN_HEIGHT };
    const mapW = Math.max(1, Number.isFinite(mapSize.w) ? mapSize.w : TOWN_WIDTH);
    const mapH = Math.max(1, Number.isFinite(mapSize.h) ? mapSize.h : TOWN_HEIGHT);
    const scale = 1;
    const visibleW = Math.max(1, view.w / scale);
    const visibleH = Math.max(1, view.h / scale);
    const mapFitsX = mapW <= visibleW;
    const mapFitsY = mapH <= visibleH;
    const cameraX = mapFitsX ? 0 : clampTownView(town.player.x - visibleW / 2, 0, mapW - visibleW);
    const cameraY = mapFitsY ? 0 : clampTownView(town.player.y - visibleH / 2, 0, mapH - visibleH);
    if (town.camera) {
      town.camera.x = cameraX;
      town.camera.y = cameraY;
    }
    return {
      scale,
      x: mapFitsX ? Math.max(0, (view.w - mapW * scale) / 2) : 0,
      y: mapFitsY ? Math.max(0, (view.h - mapH * scale) / 2) : 0,
      cameraX,
      cameraY,
      viewportW: visibleW,
      viewportH: visibleH,
    };
  }

  function clampTownView(value, min, max) {
    return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
  }

  function getTownVisibleWorldViewport(transform) {
    const scale = Math.max(0.001, Number(transform && transform.scale) || 1);
    return {
      x: (Number(transform && transform.cameraX) || 0) - (Number(transform && transform.x) || 0) / scale,
      y: (Number(transform && transform.cameraY) || 0) - (Number(transform && transform.y) || 0) / scale,
      w: view.w / scale,
      h: view.h / scale,
    };
  }

  function screenToTownPoint(x, y) {
    const transform = getTownMapTransform();
    const worldX = (x - transform.x) / transform.scale + (transform.cameraX || 0);
    const worldY = (y - transform.y) / transform.scale + (transform.cameraY || 0);
    const tileMap = getTownTileMap();
    const mapSize = tileMap ? getTownMapPixelSize(tileMap) : { w: TOWN_WIDTH, h: TOWN_HEIGHT };
    const maxW = Math.max(1, Number(mapSize && mapSize.w) || TOWN_WIDTH);
    const maxH = Math.max(1, Number(mapSize && mapSize.h) || TOWN_HEIGHT);
    if (worldX < 0 || worldY < 0 || worldX > maxW || worldY > maxH) {
      return null;
    }
    return { x: worldX, y: worldY };
  }

  function getTownTileMap() {
    const mapId = town && town.mapId
      ? town.mapId
      : (window.HEALER_TOWN_DATA && window.HEALER_TOWN_DATA.tileMapId) || null;
    if (!tileMapSystem || typeof tileMapSystem.getMap !== "function" || !mapId) {
      return null;
    }
    return tileMapSystem.getMap(mapId);
  }

  function getTownTileMapViewport(transform) {
    return {
      x: transform.cameraX || 0,
      y: transform.cameraY || 0,
      w: transform.viewportW || TOWN_WIDTH,
      h: transform.viewportH || TOWN_HEIGHT,
    };
  }

  function getTownForegroundTileLayerIds(map) {
    if (!map || !Array.isArray(map.layers)) {
      return ["terrain", "object", "event"];
    }
    return map.layers
      .filter((layer) => layer && layer.id !== "ground" && layer.visible !== false && layer.draw !== false)
      .map((layer) => layer.id);
  }

  function drawTownTileMapBase(transform = getTownMapTransform()) {
    const map = getTownTileMap();
    if (!map || !tileMapSystem || typeof tileMapSystem.drawTileMap !== "function") {
      return false;
    }
    const mapSize = tileMapSystem && typeof tileMapSystem.getMapPixelSize === "function"
      ? tileMapSystem.getMapPixelSize(map)
      : { w: TOWN_WIDTH, h: TOWN_HEIGHT };
    if (typeof tileMapSystem.drawMarginTile === "function") {
      tileMapSystem.drawMarginTile(ctx, map, {
        drawFallback: true,
        layerIds: getTownGroundTileLayerIds(map),
        useCache: true,
        viewport: getTownVisibleWorldViewport(transform),
      });
    }
    const cache = getTownTileMapRenderCache(map);
    const viewport = getTownTileMapViewport(transform);
    if (cache && cache.ready && cache.baseCanvas && drawCachedTownCanvas(cache.baseCanvas, viewport, cache.mapSize || mapSize)) {
      return true;
    }
    ctx.fillStyle = "#47784f";
    ctx.fillRect(0, 0, Math.max(1, mapSize.w || TOWN_WIDTH), Math.max(1, mapSize.h || TOWN_HEIGHT));
    tileMapSystem.drawTileMap(ctx, map, {
      drawFallback: true,
      drawDefaultTile: false,
      layerIds: ["ground"],
      viewport,
    });
    return true;
  }

  function drawTownTileMapForeground(transform = getTownMapTransform()) {
    const map = getTownTileMap();
    if (!map || !tileMapSystem || typeof tileMapSystem.drawTileMap !== "function") {
      return false;
    }
    const layerIds = getTownForegroundTileLayerIds(map);
    if (!layerIds.length) {
      return false;
    }
    tileMapSystem.drawTileMap(ctx, map, {
      drawDefaultTile: false,
      drawFallback: true,
      layerIds,
      viewport: getTownTileMapViewport(transform),
    });
    return true;
  }

  function drawTownTileMapDepthSorted(transform = getTownMapTransform()) {
    const map = getTownTileMap();
    if (!map || !tileMapSystem || typeof tileMapSystem.forEachMapTileEntry !== "function" || typeof tileMapSystem.drawTile !== "function") {
      drawTownCharacters();
      drawTownTileMapForeground(transform);
      return false;
    }

    const layerIds = getTownForegroundTileLayerIds(map);
    const cache = getTownTileMapRenderCache(map);
    if (cache && cache.ready) {
      const viewport = getTownTileMapViewport(transform);
      const marginViewport = getTownVisibleWorldViewport(transform);
      const drawables = [];
      appendTownMarginDepthGroupDrawables(drawables, map, layerIds, marginViewport);
      for (const group of cache.depthGroups || []) {
        if (!isTownDepthGroupVisible(group, viewport)) {
          continue;
        }
        drawables.push({
          type: "group",
          sortY: group.sortY,
          order: group.order,
          group,
        });
      }
      let order = 1000000;
      for (const actor of getTownCharacterActors()) {
        drawables.push({
          type: "actor",
          sortY: getTownActorSortY(actor),
          order: order++,
          actor,
        });
      }
      drawables.sort((a, b) => (a.sortY - b.sortY) || (a.order - b.order));
      for (const drawable of drawables) {
        if (drawable.type === "group" || drawable.type === "marginGroup") {
          ctx.drawImage(drawable.group.canvas, drawable.group.x, drawable.group.y);
        } else {
          drawTownActor(drawable.actor);
        }
      }
      drawTownArgumentMarks();
      return true;
    }

    const drawables = [];
    let order = 0;
    tileMapSystem.forEachMapTileEntry(map, (entry) => {
      drawables.push({
        type: "tile",
        sortY: Number.isFinite(entry.drawBottomY) ? entry.drawBottomY : entry.y + entry.tileSize,
        order: order++,
        entry,
      });
    }, {
      layerIds,
      viewport: getTownTileMapViewport(transform),
    });

    appendTownMarginDepthGroupDrawables(drawables, map, layerIds, getTownVisibleWorldViewport(transform));

    order = 1000000;
    for (const actor of getTownCharacterActors()) {
      drawables.push({
        type: "actor",
        sortY: getTownActorSortY(actor),
        order: order++,
        actor,
      });
    }

    drawables.sort((a, b) => (a.sortY - b.sortY) || (a.order - b.order));
    for (const drawable of drawables) {
      if (drawable.type === "tile") {
        const entry = drawable.entry;
        tileMapSystem.drawTile(ctx, entry.tileEntry, entry.x, entry.y, entry.tileSize, { drawFallback: true });
      } else if (drawable.type === "marginGroup") {
        ctx.drawImage(drawable.group.canvas, drawable.group.x, drawable.group.y);
      } else {
        drawTownActor(drawable.actor);
      }
    }
    drawTownArgumentMarks();
    return true;
  }

  function drawTownTileMapDebug(transform = getTownMapTransform()) {
    const map = getTownTileMap();
    if (!map || !tileMapSystem) {
      return;
    }
    const debugEnabled = game && game.settings && game.settings.mapDebugMode === true;
    if (!debugEnabled) {
      if (lastTownMapDebugMode) {
        townDebugGridCache = null;
      }
      lastTownMapDebugMode = false;
      return;
    }
    lastTownMapDebugMode = true;
    const debugCache = getTownDebugGridCache(map);
    if (debugCache && debugCache.canvas) {
      drawCachedTownCanvas(debugCache.canvas, getTownTileMapViewport(transform), debugCache.mapSize);
    } else if (typeof tileMapSystem.drawDebugGrid === "function") {
      tileMapSystem.drawDebugGrid(ctx, map, { viewport: getTownTileMapViewport(transform) });
    }
  }

  function drawTownTerrain() {
    ctx.fillStyle = "#47784f";
    ctx.fillRect(0, 0, TOWN_WIDTH, TOWN_HEIGHT);

    ctx.strokeStyle = "rgba(255,255,255,0.035)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= TOWN_WIDTH; x += 80) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, TOWN_HEIGHT);
    }
    for (let y = 0; y <= TOWN_HEIGHT; y += 80) {
      ctx.moveTo(0, y);
      ctx.lineTo(TOWN_WIDTH, y);
    }
    ctx.stroke();
  }

  function drawTownRoads() {
    ctx.fillStyle = "#b9a67f";
    roundRect(0, 430, TOWN_WIDTH, 150, 26);
    ctx.fill();
    roundRect(705, 0, 190, TOWN_HEIGHT, 26);
    ctx.fill();

    ctx.fillStyle = "#c9b98f";
    ctx.beginPath();
    ctx.arc(800, 505, 150, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "rgba(92,70,44,0.22)";
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 18]);
    ctx.beginPath();
    ctx.moveTo(0, 505);
    ctx.lineTo(TOWN_WIDTH, 505);
    ctx.moveTo(800, 0);
    ctx.lineTo(800, TOWN_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawTownProps() {
    for (const prop of town.props) {
      ctx.save();
      if (prop.type === "tree") {
        ctx.fillStyle = "#5f3c24";
        roundRect(prop.x - 6, prop.y + 10, 12, 26, 4);
        ctx.fill();
        ctx.fillStyle = "#2f6d3c";
        ctx.beginPath();
        ctx.arc(prop.x, prop.y, prop.r, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#3f8a4d";
        ctx.beginPath();
        ctx.arc(prop.x - 10, prop.y - 8, prop.r * 0.55, 0, TAU);
        ctx.fill();
      } else if (prop.type === "well") {
        ctx.fillStyle = "#6c7c85";
        ctx.beginPath();
        ctx.arc(prop.x, prop.y, prop.r, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#26343c";
        ctx.beginPath();
        ctx.arc(prop.x, prop.y, prop.r - 9, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#d8e1e2";
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (prop.type === "crate") {
        ctx.fillStyle = "#9a6841";
        roundRect(prop.x, prop.y, prop.w, prop.h, 4);
        ctx.fill();
        ctx.strokeStyle = "#593821";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawTownBuildings() {
    const buildings = [...town.buildings].sort((a, b) => (a.y + a.h) - (b.y + b.h));
    for (const building of buildings) {
      drawTownBuilding(building);
    }
  }

  function drawTownBuilding(building) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    roundRect(building.x + 10, building.y + 14, building.w, building.h, 10);
    ctx.fill();

    ctx.fillStyle = building.wall;
    roundRect(building.x, building.y, building.w, building.h, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(52,38,29,0.45)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = building.roof;
    ctx.beginPath();
    ctx.moveTo(building.x - 18, building.y + 28);
    ctx.lineTo(building.x + building.w / 2, building.y - 36);
    ctx.lineTo(building.x + building.w + 18, building.y + 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const doorW = 54;
    ctx.fillStyle = "#5f3a2a";
    roundRect(building.door.x - doorW / 2, building.y + building.h - 58, doorW, 58, 5);
    ctx.fill();

    ctx.fillStyle = "#f4e7bc";
    roundRect(building.x + building.w / 2 - 33, building.y + 45, 66, 34, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(66,43,28,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#2d241b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 20px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(building.sign, building.x + building.w / 2, building.y + 62);

    ctx.fillStyle = "#fff7df";
    ctx.strokeStyle = "#34251d";
    ctx.lineWidth = 4;
    ctx.font = "800 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.strokeText(building.name, building.x + building.w / 2, building.y + building.h + 30);
    ctx.fillText(building.name, building.x + building.w / 2, building.y + building.h + 30);

        drawTownInteractionHighlight(building);
    ctx.restore();
  }

  function drawTownInteractionHighlight(building) {
    if (!building || town.interaction !== building || town.panel) {
      return;
    }
    if (building.type === "npc") {
      const pulse = 0.5 + Math.sin(game.time * 6) * 0.18;
      const x = Number(building.x) || 0;
      const y = Number(building.y) || 0;
      const footY = y + (getTownTileMap() ? TOWN_TILE_CHARACTER_FOOT_OFFSET_Y : 17);
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${0.56 + pulse * 0.28})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(x, footY, 25, 12, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "rgba(17,23,20,0.86)";
      ctx.strokeStyle = "#f7fff6";
      ctx.lineWidth = 2;
      roundRect(x - 44, y - 76, 88, 30, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f7fff6";
      ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      drawFittedTownText(getInteractLabel(), x, y - 61, 74, 800, 15, 9, "#f7fff6", "center");
      ctx.restore();
      return;
    }
    if (!Number.isFinite(building.x) || !Number.isFinite(building.y) || !Number.isFinite(building.w) || !Number.isFinite(building.h)) {
      return;
    }
    const pulse = 0.5 + Math.sin(game.time * 6) * 0.18;
    ctx.strokeStyle = `rgba(255,255,255,${0.62 + pulse * 0.3})`;
    ctx.lineWidth = 5;
    roundRect(building.x - 12, building.y - 48, building.w + 24, building.h + 104, 14);
    ctx.stroke();
    ctx.fillStyle = "rgba(17,23,20,0.86)";
    ctx.strokeStyle = "#f7fff6";
    ctx.lineWidth = 2;
    roundRect(building.x + building.w / 2 - 50, building.y - 78, 100, 30, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    drawFittedTownText(getInteractLabel(), building.x + building.w / 2, building.y - 63, 86, 800, 15, 9, "#f7fff6", "center");
  }

  function getTownEventCharacterActors() {
    return typeof getTownEventActors === "function" ? getTownEventActors() : [];
  }

  function getTownNpcCharacterActors() {
    return typeof getTownNpcActors === "function" ? getTownNpcActors() : [];
  }

  function getTownMonsterSymbolActors() {
    return typeof getTownMonsterSymbols === "function" ? getTownMonsterSymbols() : [];
  }

  function drawTownCharacters() {
    if (!playerProfile.done) {
      return;
    }
    const actors = [{
      id: "finald",
      x: town.player.x,
      y: town.player.y,
      color: town.player.color || COLORS.player,
      label: town.player.label || "主",
      facing: town.player.facing || "down",
      walkFrame: town.player.walkFrame || 1,
      spriteHeight: town.player.spriteHeight || 72,
    }];
    const eventActors = getTownEventCharacterActors();
    if (!town.meetingDone && eventActors.length > 0) {
      actors.push(...eventActors);
    } else if (!town.meetingDone) {
      const guild = getTownBuilding("guild");
      const baseX = guild ? guild.door.x : 800;
      const baseY = guild ? guild.door.y - 18 : 790;
      drawTownActor({ id: "ulpes", x: baseX - 74, y: baseY + 8, color: COLORS.ulpes, label: "ウ", facing: "down", walkFrame: 1 });
      drawTownActor({ id: "rihas", x: baseX - 8, y: baseY + 34, color: COLORS.rihas, label: "リ", facing: "down", walkFrame: 1 });
      drawTownActor({ id: "sushia", x: baseX + 66, y: baseY + 10, color: COLORS.sushia, label: "ス", facing: "down", walkFrame: 1 });
      drawArgumentMark(baseX - 48, baseY - 22);
      drawArgumentMark(baseX + 6, baseY + 4);
      drawArgumentMark(baseX + 66, baseY - 18);
    } else if (Array.isArray(town.followers)) {
      for (const follower of town.followers) {
        actors.push(follower);
      }
    }
    actors.push(...getTownNpcCharacterActors());
    actors.push(...getTownMonsterSymbolActors());
    actors.sort((a, b) => a.y - b.y);
    for (const actor of actors) {
      drawTownActor(actor);
    }
  }

  function getTownCharacterActors() {
    if (!playerProfile.done) {
      return [];
    }
    const actors = [{
      id: "finald",
      x: town.player.x,
      y: town.player.y,
      color: town.player.color || COLORS.player,
      label: town.player.label || "荳ｻ",
      facing: town.player.facing || "down",
      walkFrame: town.player.walkFrame || 1,
      spriteHeight: town.player.spriteHeight || 72,
    }];
    const eventActors = getTownEventCharacterActors();
    if (!town.meetingDone && eventActors.length > 0) {
      actors.push(...eventActors);
    } else if (!town.meetingDone) {
      const guild = getTownBuilding("guild");
      const baseX = guild ? guild.door.x : 800;
      const baseY = guild ? guild.door.y - 18 : 790;
      actors.push(
        { id: "ulpes", x: baseX - 74, y: baseY + 8, color: COLORS.ulpes, label: "繧ｦ", facing: "down", walkFrame: 1 },
        { id: "rihas", x: baseX - 8, y: baseY + 34, color: COLORS.rihas, label: "繝ｪ", facing: "down", walkFrame: 1 },
        { id: "sushia", x: baseX + 66, y: baseY + 10, color: COLORS.sushia, label: "繧ｹ", facing: "down", walkFrame: 1 },
      );
    } else if (Array.isArray(town.followers)) {
      for (const follower of town.followers) {
        actors.push(follower);
      }
    }
    actors.push(...getTownNpcCharacterActors());
    actors.push(...getTownMonsterSymbolActors());
    return actors;
  }

  function drawTownArgumentMarks() {
    if (!playerProfile.done || town.meetingDone) {
      return;
    }
    const eventActors = getTownEventCharacterActors();
    if (eventActors.length > 0) {
      for (const actor of eventActors) {
        if (actor && actor.showArgumentMark !== false) {
          drawArgumentMark(actor.x, actor.y - 44);
        }
      }
      return;
    }
    const guild = getTownBuilding("guild");
    const baseX = guild ? guild.door.x : 800;
    const baseY = guild ? guild.door.y - 18 : 790;
    drawArgumentMark(baseX - 48, baseY - 22);
    drawArgumentMark(baseX + 6, baseY + 4);
    drawArgumentMark(baseX + 66, baseY - 18);
  }

  function getTownActorSortY(actor) {
    if (!actor) {
      return 0;
    }
    return actor.y + (getTownTileMap() ? TOWN_TILE_CHARACTER_FOOT_OFFSET_Y : 0);
  }

  function drawTownActor(actor) {
    if (!actor) {
      return;
    }
    if (actor.type === "monsterSymbol") {
      drawTownMonsterSymbol(actor);
      return;
    }
    if (drawTownCharacterSprite(actor)) {
      return;
    }
    drawTownNpc(actor.x, actor.y, actor.color, actor.label);
  }

  function drawTownMonsterSymbol(actor) {
    const usingTileMap = Boolean(getTownTileMap());
    const radius = Math.max(10, Number(actor.radius) || 16);
    const footY = actor.y + (usingTileMap ? TOWN_TILE_CHARACTER_FOOT_OFFSET_Y : 17);
    const bodyY = actor.y - radius * 0.65 + (usingTileMap ? TOWN_TILE_CHARACTER_FOOT_OFFSET_Y : 0);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.beginPath();
    ctx.ellipse(actor.x, footY, radius * 1.08, radius * 0.46, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = actor.color || "#9f7cff";
    ctx.strokeStyle = actor.alert ? "#ffcf66" : "#182018";
    ctx.lineWidth = actor.alert ? 4 : 3;
    ctx.beginPath();
    ctx.arc(actor.x, bodyY, radius, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#101814";
    ctx.font = "900 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(actor.label || "M", actor.x, bodyY + 1);
    ctx.restore();
    if (actor.questId) {
      drawTownQuestPaperMark(actor.x + (actor.alert ? -18 : 0), bodyY - radius - 18, actor.questType);
    }
    if (actor.alert) {
      drawArgumentMark(actor.x + (actor.questId ? 18 : 0), bodyY - radius - 16);
    }
  }

  function drawTownQuestPaperMark(x, y, questType) {
    const isStory = questType === "story";
    const pulse = 0.5 + Math.sin(game.time * 6 + x * 0.01) * 0.12;
    const w = 18;
    const h = 22;
    const left = x - w / 2;
    const top = y - h / 2;
    ctx.save();
    ctx.fillStyle = isStory ? `rgba(255,216,107,${0.86 + pulse * 0.1})` : `rgba(247,255,246,${0.86 + pulse * 0.1})`;
    ctx.strokeStyle = isStory ? "#4f3810" : "#25352b";
    ctx.lineWidth = 2;
    roundRect(left, top, w, h, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isStory ? "#fff0a8" : "#dfeee3";
    ctx.beginPath();
    ctx.moveTo(left + w - 6, top + 1);
    ctx.lineTo(left + w - 1, top + 6);
    ctx.lineTo(left + w - 6, top + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#182018";
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", x, y + 2);
    ctx.restore();
  }

  function drawTownCharacterSprite(actor) {
    const image = getTownWalkImage(actor.spriteId || actor.id, actor.facing, actor.walkFrame, actor.spritePath || null);
    if (!isTownImageReady(image)) {
      return false;
    }
    const height = actor.spriteHeight || 64;
    const width = height * image.naturalWidth / image.naturalHeight;
    const footY = actor.y + (getTownTileMap() ? TOWN_TILE_CHARACTER_FOOT_OFFSET_Y : 24);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.beginPath();
    ctx.ellipse(actor.x, footY - 2, 18, 8, 0, 0, TAU);
    ctx.fill();
    const previousSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, actor.x - width / 2, footY - height, width, height);
    ctx.imageSmoothingEnabled = previousSmoothing;
    ctx.restore();
    return true;
  }
  function drawTownNpc(x, y, color, label) {
    const usingTileMap = Boolean(getTownTileMap());
    const footY = usingTileMap ? y + TOWN_TILE_CHARACTER_FOOT_OFFSET_Y : y + 17;
    const bodyY = usingTileMap ? y - 17 + TOWN_TILE_CHARACTER_FOOT_OFFSET_Y : y;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(x, footY, 17, 8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#102018";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, bodyY, 14, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#101814";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, bodyY + 1);
    ctx.restore();
  }

  function drawArgumentMark(x, y) {
    const pulse = 0.5 + Math.sin(game.time * 8 + x * 0.01) * 0.18;
    ctx.save();
    ctx.fillStyle = `rgba(255,84,64,${0.72 + pulse * 0.25})`;
    ctx.strokeStyle = "#2d1110";
    ctx.lineWidth = 4;
    ctx.font = "900 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText("!", x, y);
    ctx.fillText("!", x, y);
    ctx.strokeStyle = "rgba(255,84,64,0.78)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 22, y + 4);
    ctx.lineTo(x - 8, y - 10);
    ctx.lineTo(x + 4, y - 2);
    ctx.lineTo(x + 20, y - 16);
    ctx.stroke();
    ctx.restore();
  }

  function drawTownMapNamePopup() {
    const popup = town && town.mapNamePopup;
    if (!popup || !popup.name) {
      return;
    }
    const holdTime = 3;
    const fadeTime = 1;
    const age = Math.max(0, Number(popup.age) || 0);
    const alpha = age <= holdTime ? 1 : Math.max(0, 1 - (age - holdTime) / fadeTime);
    if (alpha <= 0) {
      return;
    }

    const title = String(popup.name);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = "900 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const popupW = Math.min(view.w - 36, Math.max(230, ctx.measureText(title).width + 64));
    const popupH = 56;
    const popupX = Math.round((view.w - popupW) / 2);
    const popupY = 24;
    drawPanel(popupX, popupY, popupW, popupH);
    ctx.fillStyle = "#f7fff6";
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 4;
    ctx.strokeText(title, popupX + popupW / 2, popupY + popupH / 2 + 1);
    ctx.fillText(title, popupX + popupW / 2, popupY + popupH / 2 + 1);
    ctx.restore();
  }

  function drawTownReturnFade() {
    const fade = town && town.returnFade;
    if (!fade) {
      return;
    }
    const age = Math.max(0, Number(fade.age) || 0);
    const hold = Math.max(0, Number(fade.hold) || 0);
    const duration = Math.max(0.01, Number(fade.fade) || 0.85);
    const alpha = age <= hold ? 1 : Math.max(0, 1 - (age - hold) / duration);
    if (alpha <= 0) {
      return;
    }
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, alpha)})`;
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();
  }

  function drawTownQuestNoticePopup() {
    const popup = town && town.questNoticePopup;
    if (!popup) {
      return;
    }
    const age = Math.max(0, Number(popup.age) || 0);
    const hold = Math.max(0, Number(popup.hold) || 2);
    const fade = Math.max(0.01, Number(popup.fade) || 1);
    const alpha = age <= hold ? 1 : Math.max(0, 1 - (age - hold) / fade);
    if (alpha <= 0) {
      return;
    }

    const centerX = view.w / 2;
    const centerY = view.h * 0.42;
    const bandW = Math.min(view.w - 48, 980);
    const bandH = Math.min(230, Math.max(170, view.h * 0.22));
    const bandX = centerX - bandW / 2;
    const bandY = centerY - bandH / 2;
    const title = String(popup.title || "依頼");
    const message = String(popup.message || `${title}を受注しました`);
    const typeName = String(popup.typeName || "依頼");
    const questName = String(popup.questName || "");

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = "rgba(2, 6, 7, 0.5)";
    ctx.fillRect(0, 0, view.w, view.h);

    ctx.fillStyle = "rgba(16, 24, 24, 0.94)";
    roundRect(bandX, bandY, bandW, bandH, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 216, 107, 0.82)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "rgba(117, 31, 38, 0.86)";
    roundRect(bandX + 18, bandY + 18, bandW - 36, bandH - 36, 8);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 216, 107, 0.92)";
    roundRect(bandX + 34, bandY + 38, bandW - 68, 8, 4);
    ctx.fill();
    roundRect(bandX + 34, bandY + bandH - 46, bandW - 68, 8, 4);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 20px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffd86b";
    ctx.fillText(`${typeName} 受注`, centerX, bandY + 62);

    ctx.font = "950 46px 'Segoe UI Black', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillText(questName || title, centerX + 4, centerY + 2);
    ctx.fillStyle = "#f7fff6";
    drawFittedTownText(questName || title, centerX, centerY - 2, bandW - 120, 950, 46, 24, "#f7fff6", "center");

    ctx.font = "850 22px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffe08b";
    drawFittedTownText(message, centerX, bandY + bandH - 72, bandW - 96, 850, 22, 14, "#ffe08b", "center");
    ctx.restore();
  }

  function drawTownActiveStoryQuestHud() {
    if (town.panel || town.story || (game.systemMenu && game.systemMenu.open)) {
      return;
    }
    const activeStoryQuest = getActiveStoryQuestForTownField();
    const entries = [];
    if (activeStoryQuest) {
      entries.push({
        label: "ストーリー依頼 受注中",
        name: String(activeStoryQuest.name || "ストーリー依頼"),
        destination: getQuestDestinationName(activeStoryQuest),
        color: "#ffd86b",
      });
    }
    for (const quest of getAcceptedFreeQuestsForTownField()) {
      entries.push({
        label: "フリー依頼 受注中",
        name: String(quest.name || "フリー依頼"),
        destination: getQuestDestinationName(quest),
        color: "#f7fff6",
      });
    }
    if (entries.length === 0) {
      return;
    }
    const x = 18;
    const y = 18;
    const w = Math.min(view.w - 36, 380);
    const rowH = 58;
    const h = 16 + entries.length * rowH;
    ctx.save();
    ctx.fillStyle = "rgba(11,18,14,0.76)";
    ctx.strokeStyle = "rgba(247,255,246,0.35)";
    ctx.lineWidth = 2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const rowY = y + 14 + i * rowH;
      ctx.fillStyle = entry.color;
      ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText(entry.label, x + 15, rowY + 12);
      drawFittedTownText(entry.name, x + 15, rowY + 36, w - 30, 900, 18, 12, "#f7fff6");
      if (entry.destination) {
        drawFittedTownText(`場所: ${entry.destination}`, x + 15, rowY + 56, w - 30, 800, 15, 11, "#dce9dc");
      }
    }
    ctx.restore();
  }

  function drawTownPanel() {
    if (!town.panel) {
      return;
    }
    town.panel.clickTargets = [];
    if (town.panel.action === "battleGuide") {
      drawBattleGuidePanel();
      return;
    }
    if (town.panel.action === "questType") {
      drawQuestTypePanel();
      return;
    }
    if (town.panel.action === "questList") {
      drawQuestListPanel();
      return;
    }
    if (town.panel.action === "questDecision") {
      drawQuestDecisionPanel();
      return;
    }
    if (town.panel.action === "inn") {
      drawInnPanel();
      return;
    }
    if (town.panel.action === "itemShop") {
      drawItemShopPanel();
      return;
    }
    if (town.panel.action === "equipmentShop") {
      drawEquipmentShopPanel();
      return;
    }
    const w = Math.min(560, view.w - 32);
    const h = 188;
    const x = (view.w - w) / 2;
    const y = view.h - h - 28;
    drawPanel(x, y, w, h);

    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 22px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(town.panel.title, x + 24, y + 42);

    ctx.font = "14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#dce9dc";
    for (let i = 0; i < town.panel.lines.length; i += 1) {
      ctx.fillText(town.panel.lines[i], x + 24, y + 76 + i * 25);
    }

    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${getInteractLabel()}  閉じる`, x + w - 24, y + h - 24);
  }

  function drawInnPanel() {
    const { x, y, w, h } = getTownFacilityPageRect();
    const cost = Number.isFinite(town.panel.cost) ? town.panel.cost : 100;
    const restLocked = Boolean(game.innRestUsedUntilBattle);
    const canPay = getGoldValue() >= cost;
    const members = getInnPartyMembers();
    drawPanel(x, y, w, h);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("宿屋", x + 26, y + 44);
    ctx.fillStyle = "#ffd86b";
    ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(`所持金: ${formatGoldSafe(getGoldValue())}`, x + w - 180, y + 44);

    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(restLocked ? "次の戦闘後まで再度利用できません。" : `全員を全回復します。料金は${formatGoldSafe(cost)}です。`, x + 26, y + 84);
    ctx.fillText("HP/MPと戦闘不能、簡易的な状態異常を回復します。", x + 26, y + 108);

    drawInnStatusComparison(members, x, y, w, h);
    if (town.panel.message) {
      ctx.fillStyle = isTownPanelErrorMessage(town.panel.message) ? "#ffb4a8" : "#ffd86b";
      ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText(town.panel.message, x + 26, y + h - 72);
    }

    drawTextButton(x + 26, y + h - 60, 132, 38, "閉じる", { kind: "close" });
    drawTextButton(x + w - 190, y + h - 60, 164, 38, "泊まる", { kind: "confirmInnRest" }, true, restLocked || !canPay);
    drawPanelFooter(x, y, w, h);
  }

  function drawInnStatusComparison(members, panelX, panelY, panelW, panelH) {
    const contentX = panelX + 24;
    const contentY = panelY + 136;
    const contentW = panelW - 48;
    const contentH = Math.max(110, panelH - 220);
    const gap = 18;
    const columnW = (contentW - gap) / 2;
    const currentRect = { x: contentX, y: contentY, w: columnW, h: contentH };
    const afterRect = { x: contentX + columnW + gap, y: contentY, w: columnW, h: contentH };
    drawInnStatusColumn("現在の状態", members, currentRect, false);
    drawInnStatusColumn("泊まった後", members, afterRect, true);
  }

  function drawInnStatusColumn(title, members, rect, afterRest) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.fillStyle = "#f7fff6";
    ctx.font = "900 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(title, rect.x + 16, rect.y + 28);

    if (!members.length) {
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("パーティーメンバーがいません。", rect.x + 16, rect.y + 64);
      ctx.restore();
      return;
    }

    const rowGap = 10;
    const rowH = Math.max(82, Math.min(112, Math.floor((rect.h - 52 - rowGap * Math.max(0, members.length - 1)) / members.length)));
    for (let i = 0; i < members.length; i += 1) {
      const rowY = rect.y + 46 + i * (rowH + rowGap);
      if (rowY + rowH > rect.y + rect.h - 8) {
        break;
      }
      drawInnMemberRow(members[i], rect.x + 12, rowY, rect.w - 24, rowH, afterRest);
    }
    ctx.restore();
  }

  function drawInnMemberRow(member, x, y, w, h, afterRest) {
    const name = getInnMemberName(member);
    const dead = isInnMemberIncapacitated(member);
    const maxHp = getInnMemberMaxResource(member, "maxHp");
    const maxMp = getInnMemberMaxResource(member, "maxMp");
    const currentHp = afterRest ? maxHp : getInnMemberCurrentResource(member, "hp", maxHp);
    const currentMp = afterRest ? maxMp : getInnMemberCurrentResource(member, "mp", maxMp);
    const statusChips = afterRest ? [] : getInnMemberStatusChips(member);
    ctx.save();
    ctx.fillStyle = dead && !afterRest ? "rgba(255,120,110,0.1)" : "rgba(255,255,255,0.075)";
    ctx.strokeStyle = dead && !afterRest ? "rgba(255,120,110,0.42)" : "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    const nameW = Math.min(118, Math.max(78, w * 0.24));
    drawFittedTownText(name, x + 14, y + 25, nameW, 900, 16, 11, dead && !afterRest ? "#ffb4a8" : "#f7fff6");
    if (afterRest && dead) {
      ctx.fillStyle = "#8ff0a4";
      ctx.font = "800 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("戦闘不能解除", x + 14, y + 46);
    }

    const barX = x + nameW + 24;
    const barW = Math.max(116, w - nameW - 40);
    drawInnResourceBar("HP", currentHp, maxHp, barX, y + 14, barW, COLORS.hp || "#72df82");
    drawInnResourceBar("MP", currentMp, maxMp, barX, y + 42, barW, COLORS.mp || "#73a7ff");
    drawInnStatusChips(afterRest ? [{ name: "状態なし", color: "#5d6864", empty: true }] : statusChips, barX, y + 70, barW, h - 76);
    ctx.restore();
  }

  function drawInnResourceBar(label, current, max, x, y, w, color) {
    const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
    ctx.fillStyle = "#dce9dc";
    ctx.font = "800 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, x, y + 11);
    ctx.textAlign = "right";
    ctx.fillText(`${formatInnNumber(current)} / ${formatInnNumber(max)}`, x + w, y + 11);
    const barY = y + 15;
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    roundRect(x, barY, w, 8, 4);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(x, barY, w * ratio, 8, 4);
    ctx.fill();
  }

  function drawInnStatusChips(chips, x, y, w, h) {
    const list = Array.isArray(chips) && chips.length ? chips : [{ name: "状態なし", color: "#5d6864", empty: true }];
    let cursorX = x;
    let cursorY = y;
    const maxY = y + Math.max(18, h);
    for (const chip of list.slice(0, 8)) {
      const label = chip.name || "状態";
      ctx.font = "800 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      const chipW = Math.min(Math.max(44, ctx.measureText(label).width + 18), Math.max(44, w));
      if (cursorX + chipW > x + w && cursorX > x) {
        cursorX = x;
        cursorY += 23;
      }
      if (cursorY + 18 > maxY) {
        break;
      }
      ctx.fillStyle = chip.empty ? "rgba(255,255,255,0.08)" : chip.color || "#d4e4d5";
      roundRect(cursorX, cursorY, chipW, 18, 9);
      ctx.fill();
      ctx.fillStyle = chip.empty ? "#dce9dc" : "#111814";
      ctx.textBaseline = "middle";
      drawFittedTownText(label, cursorX + chipW / 2, cursorY + 9.5, chipW - 10, 800, 11, 8, chip.empty ? "#dce9dc" : "#111814", "center");
      cursorX += chipW + 6;
    }
    ctx.textBaseline = "alphabetic";
  }

  function getInnPartyMembers() {
    const availableIds = new Set(["finald"]);
    const livePartyIds = Array.isArray(party)
      ? party.map((member) => member && member.id).filter((id) => id && id !== "finald")
      : [];
    if (livePartyIds.length > 0) {
      livePartyIds.forEach((id) => availableIds.add(id));
    } else if (town && town.meetingDone) {
      INN_PARTY_UNIT_ORDER.forEach((id) => availableIds.add(id));
    }
    return INN_PARTY_UNIT_ORDER
      .filter((unitId) => availableIds.has(unitId))
      .map((unitId) => getInnDisplayUnit(unitId))
      .filter(Boolean);
  }

  function getInnDisplayUnit(unitId) {
    const live = getInnLiveUnit(unitId);
    if (live) {
      return live;
    }
    const def = getInnCharacterDef(unitId);
    if (!def) {
      return null;
    }
    const critChance = Number.isFinite(def.critChance) ? def.critChance : Number.isFinite(BASE_CRIT_CHANCE) ? BASE_CRIT_CHANCE : 0;
    const critDamage = Number.isFinite(def.critDamage) ? def.critDamage : Number.isFinite(BASE_CRIT_DAMAGE_RATE) ? BASE_CRIT_DAMAGE_RATE : 0;
    const unit = {
      ...def,
      skillOwner: def.skillOwner || def.id,
      hp: def.maxHp || 100,
      mp: def.maxMp || 0,
      critChance,
      critDamage,
      baseStats: {
        ...(def.baseStats || {}),
        critChance,
        critDamage,
      },
      mood: def.id === "finald" ? null : Number.isFinite(MOOD_BASELINE) ? MOOD_BASELINE : 50,
      ult: 0,
      cds: {},
      activeCommandBias: 0,
    };
    const storedEquipment = game.partyEquipmentById && game.partyEquipmentById[unitId] || def.equipment || {};
    const storedLoadout = game.partyLoadoutById && game.partyLoadoutById[unitId] || null;
    unit.equipment = typeof normalizeEquipment === "function" ? normalizeEquipment(storedEquipment, unit) : { ...storedEquipment };
    unit.loadout = storedLoadout && typeof normalizeLoadout === "function"
      ? normalizeLoadout(unit.skillOwner || unit.id, storedLoadout)
      : typeof getDefaultLoadout === "function"
        ? getDefaultLoadout(unit.skillOwner || unit.id)
        : { passive: null, active: [] };
    unit.dead = Boolean(game.partyDeadById && game.partyDeadById[unit.id]);
    unit.hp = getInnMemberCurrentResource(unit, "hp", getInnMemberMaxResource(unit, "maxHp"));
    unit.mp = getInnMemberCurrentResource(unit, "mp", getInnMemberMaxResource(unit, "maxMp"));
    return unit;
  }

  function getInnLiveUnit(unitId) {
    if (player && player.id === unitId) {
      return player;
    }
    return Array.isArray(party) ? party.find((member) => member && member.id === unitId) || null : null;
  }

  function getInnCharacterDef(unitId) {
    if (unitId === "finald") {
      return CHARACTER_DEFS && CHARACTER_DEFS.player ? CHARACTER_DEFS.player : null;
    }
    const allies = CHARACTER_DEFS && Array.isArray(CHARACTER_DEFS.allies) ? CHARACTER_DEFS.allies : [];
    return allies.find((member) => member && member.id === unitId) || null;
  }

  function getInnMemberName(member) {
    if (!member) {
      return "";
    }
    if (member.id === "finald" && typeof getPlayerFirstName === "function") {
      return getPlayerFirstName() || member.name || "アルジュナ";
    }
    return member.name || member.label || member.id;
  }

  function getInnMemberMaxResource(member, key) {
    const fallback = Math.max(key === "maxHp" ? 1 : 0, Number.isFinite(member && member[key]) ? member[key] : 0);
    const value = typeof getEffectiveStat === "function" ? getEffectiveStat(member, key) : fallback;
    const minimum = key === "maxHp" ? 1 : 0;
    return Math.max(minimum, Math.round(Number.isFinite(value) ? value : fallback));
  }

  function getInnMemberCurrentResource(member, key, max) {
    const saved = key === "hp"
      ? game.partyHpById && Number(game.partyHpById[member.id])
      : game.partyMpById && Number(game.partyMpById[member.id]);
    const current = Number.isFinite(saved) ? saved : Number.isFinite(member && member[key]) ? member[key] : max;
    return Math.max(0, Math.min(max, Math.round(Number.isFinite(current) ? current : max)));
  }

  function isInnMemberIncapacitated(member) {
    return Boolean(member && (
      member.dead
      || member.hp <= 0
      || game.partyDeadById && game.partyDeadById[member.id]
    ));
  }

  function getInnMemberStatusChips(member) {
    const chips = [];
    if (isInnMemberIncapacitated(member)) {
      chips.push(getInnStatusChip("incapacitated"));
    }
    const saved = game.partyStatusById && member && game.partyStatusById[member.id];
    if (saved && typeof saved === "object") {
      for (const statusId of Object.keys(saved)) {
        if (statusId === "incapacitated" && chips.some((chip) => chip.id === "incapacitated")) {
          continue;
        }
        chips.push(getInnStatusChip(statusId, saved[statusId]));
      }
    }
    return chips.filter(Boolean);
  }

  function getInnStatusChip(statusId, state = null) {
    const statusData = STATUS_DATA || window.HEALER_STATUS_DATA || {};
    const status = statusData[statusId] || statusData[String(statusId || "").replace(/^Injury$/, "debuff_Injury")] || {};
    const stacks = state && Number.isFinite(state.stacks) && state.stacks > 1 ? ` x${Math.floor(state.stacks)}` : "";
    return {
      id: statusId,
      name: `${status.name || statusId}${stacks}`,
      color: status.color || "#d4e4d5",
    };
  }

  function formatInnNumber(value) {
    return String(Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
  }

  function getTownFacilityPageRect() {
    const marginX = view.w >= 1280 ? 32 : 24;
    const marginY = view.h >= 760 ? 28 : 22;
    const w = Math.max(360, view.w - marginX * 2);
    const h = Math.max(360, view.h - marginY * 2);
    return {
      x: (view.w - w) / 2,
      y: (view.h - h) / 2,
      w,
      h,
    };
  }

  function drawItemShopPanel() {
    const { x, y, w, h } = getTownFacilityPageRect();
    const items = getShopItems();
    const groups = buildItemShopCategoryGroups(items);
    const selectedGroup = getSelectedItemShopCategoryGroup(groups);
    const selectedItems = selectedGroup ? selectedGroup.items : [];
    const selectedItem = getSelectedItemShopItem(selectedItems);
    drawPanel(x, y, w, h);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("アイテム屋", x + 26, y + 44);
    ctx.fillStyle = "#ffd86b";
    ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(`所持金: ${formatGoldSafe(getGoldValue())}`, x + w - 180, y + 44);

    if (!items.length) {
      town.panel.scroll = 0;
      town.panel.scrollMax = 0;
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("今は販売中のアイテムがありません。", x + 26, y + 92);
    } else {
      drawItemShopLayout(groups, selectedGroup, selectedItems, selectedItem, x, y, w, h);
    }

    if (town.panel.message) {
      ctx.fillStyle = isTownPanelErrorMessage(town.panel.message) ? "#ffb4a8" : "#ffd86b";
      ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText(town.panel.message, x + 26, y + h - 70);
    }
    drawTextButton(x + 24, y + h - 50, 130, 34, "閉じる", { kind: "close" });
    drawPanelFooter(x, y, w, h);
  }

  function drawItemShopLayout(groups, selectedGroup, selectedItems, selectedItem, panelX, panelY, panelW, panelH) {
    const contentX = panelX + 24;
    const contentY = panelY + 78;
    const contentW = panelW - 48;
    const contentH = Math.max(120, panelH - 158);
    const gap = 16;
    let categoryW = Math.min(206, Math.max(138, Math.floor(contentW * 0.17)));
    let detailW = Math.min(420, Math.max(300, Math.floor(contentW * 0.34)));
    let listW = contentW - categoryW - detailW - gap * 2;
    if (listW < 220) {
      listW = Math.max(180, Math.floor(contentW * 0.34));
      detailW = Math.max(250, contentW - categoryW - listW - gap * 2);
    }
    if (contentW < 760) {
      categoryW = Math.max(96, Math.floor(contentW * 0.22));
      listW = Math.max(120, Math.floor(contentW * 0.38));
      detailW = Math.max(1, contentW - categoryW - listW - gap * 2);
    }
    const categoryRect = { x: contentX, y: contentY, w: categoryW, h: contentH };
    const listRect = { x: categoryRect.x + categoryRect.w + gap, y: contentY, w: listW, h: contentH };
    const detailRect = { x: listRect.x + listRect.w + gap, y: contentY, w: Math.max(1, contentX + contentW - (listRect.x + listRect.w + gap)), h: contentH };
    drawItemShopCategoryList(groups, selectedGroup, categoryRect);
    drawItemShopItemList(selectedItems, selectedItem, listRect);
    drawItemShopDetail(selectedItem, detailRect);
  }

  function buildItemShopCategoryGroups(items) {
    const groups = ITEM_SHOP_CATEGORIES.map((category) => ({
      ...category,
      items: [],
    }));
    const byKey = new Map(groups.map((group) => [group.key, group]));
    for (const item of items) {
      const key = getItemShopCategoryKey(item);
      const group = byKey.get(key) || byKey.get("other");
      if (group) {
        group.items.push(item);
      }
    }
    return groups;
  }

  function getItemShopCategoryKey(item) {
    if (!item) {
      return "other";
    }
    if (Number.isFinite(item.healFlat) && item.healFlat > 0) {
      return "healing";
    }
    if (Number.isFinite(item.mpFlat) && item.mpFlat > 0) {
      return "mp";
    }
    if (Number.isFinite(item.moodDelta) && item.moodDelta !== 0) {
      return "mood";
    }
    if (
      item.baseStatBuffs && typeof item.baseStatBuffs === "object"
      || item.statusIds && Array.isArray(item.statusIds) && item.statusIds.length > 0
      || item.buffs && typeof item.buffs === "object"
    ) {
      return "support";
    }
    return "other";
  }

  function getSelectedItemShopCategoryGroup(groups) {
    const selectedKey = town.panel && town.panel.selectedItemShopCategory;
    const selected = groups.find((group) => group.key === selectedKey && group.items.length > 0)
      || groups.find((group) => group.items.length > 0)
      || groups[0]
      || null;
    if (town.panel && selected) {
      if (town.panel.selectedItemShopCategory !== selected.key) {
        town.panel.scroll = 0;
        town.panel.scrollMax = 0;
        town.panel.selectedItemShopItemId = null;
      }
      town.panel.selectedItemShopCategory = selected.key;
    }
    return selected;
  }

  function getSelectedItemShopItem(items) {
    const selectedId = town.panel && town.panel.selectedItemShopItemId;
    const selected = items.find((item) => item && item.id === selectedId) || items[0] || null;
    if (town.panel) {
      town.panel.selectedItemShopItemId = selected ? selected.id : null;
    }
    return selected;
  }

  function drawItemShopCategoryList(groups, selectedGroup, rect) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.fillStyle = "#dce9dc";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("カテゴリ", rect.x + 14, rect.y + 26);
    const rowH = 42;
    const gap = 8;
    for (let i = 0; i < groups.length; i += 1) {
      const group = groups[i];
      const rowY = rect.y + 44 + i * (rowH + gap);
      if (rowY + rowH > rect.y + rect.h - 8) {
        break;
      }
      const selected = Boolean(selectedGroup && group.key === selectedGroup.key);
      const disabled = group.items.length <= 0;
      town.panel.clickTargets.push({
        x: rect.x + 10,
        y: rowY,
        w: rect.w - 20,
        h: rowH,
        action: disabled ? { kind: "noop" } : { kind: "selectItemShopCategory", category: group.key },
      });
      ctx.fillStyle = selected ? "rgba(255,216,107,0.24)" : disabled ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.08)";
      ctx.strokeStyle = selected ? "#ffd86b" : "rgba(255,255,255,0.14)";
      ctx.lineWidth = selected ? 2 : 1;
      roundRect(rect.x + 10, rowY, rect.w - 20, rowH, 8);
      ctx.fill();
      ctx.stroke();
      drawFittedTownText(group.label, rect.x + 22, rowY + 26, rect.w - 76, 850, 14, 10, disabled ? "rgba(220,233,220,0.45)" : "#f7fff6");
      ctx.fillStyle = disabled ? "rgba(220,233,220,0.35)" : "#ffd86b";
      ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(group.items.length), rect.x + rect.w - 24, rowY + 26);
      ctx.textAlign = "left";
    }
    ctx.restore();
  }

  function drawItemShopItemList(items, selectedItem, rect) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.fillStyle = "#dce9dc";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("商品", rect.x + 14, rect.y + 26);
    ctx.restore();

    const viewport = { x: rect.x, y: rect.y + 40, w: rect.w, h: Math.max(42, rect.h - 40) };
    const rowH = 68;
    const gap = 8;
    const contentH = items.length * rowH + Math.max(0, items.length - 1) * gap;
    const scrollMax = Math.max(0, contentH - viewport.h);
    const scroll = Math.max(0, Math.min(scrollMax, town.panel.scroll || 0));
    town.panel.scroll = scroll;
    town.panel.scrollMax = scrollMax;

    ctx.save();
    ctx.beginPath();
    ctx.rect(viewport.x, viewport.y, viewport.w, viewport.h);
    ctx.clip();
    if (!items.length) {
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("このカテゴリの商品はありません。", rect.x + 14, viewport.y + 32);
    }
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const rowY = viewport.y + i * (rowH + gap) - scroll;
      if (rowY + rowH < viewport.y || rowY > viewport.y + viewport.h) {
        continue;
      }
      const selected = Boolean(selectedItem && item && selectedItem.id === item.id);
      town.panel.clickTargets.push({
        x: rect.x + 10,
        y: rowY,
        w: rect.w - 20,
        h: rowH,
        action: { kind: "selectItemShopItem", itemId: item.id },
      });
      ctx.fillStyle = selected ? "rgba(255,216,107,0.25)" : "rgba(255,255,255,0.075)";
      ctx.strokeStyle = selected ? "#ffd86b" : "rgba(255,255,255,0.16)";
      ctx.lineWidth = selected ? 2 : 1;
      roundRect(rect.x + 10, rowY, rect.w - 20, rowH, 8);
      ctx.fill();
      ctx.stroke();
      drawFittedTownText(item.name || item.id, rect.x + 24, rowY + 26, Math.max(44, rect.w - 150), 900, 16, 11, selected ? "#fff6c2" : "#f7fff6");
      drawFittedTownText(item.simpleDescription || item.description || "アイテム", rect.x + 24, rowY + 49, rect.w - 42, 700, 12, 9, "#dce9dc");
      ctx.fillStyle = "#ffd86b";
      ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(formatGoldSafe(getItemShopPrice(item)), rect.x + rect.w - 24, rowY + 27);
      ctx.textAlign = "left";
    }
    ctx.restore();
    drawTownScrollbar(viewport, scroll, scrollMax);
  }

  function drawItemShopDetail(item, rect) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#dce9dc";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("選択中のアイテム", rect.x + 16, rect.y + 26);

    if (!item) {
      ctx.fillStyle = "#dce9dc";
      ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("左の一覧からアイテムを選択してください。", rect.x + 16, rect.y + 64);
      ctx.restore();
      return;
    }

    const detailX = rect.x + 16;
    const detailW = Math.max(60, rect.w - 32);
    const price = getItemShopPrice(item);
    const inventory = getItemInventoryCountForTown(item);
    const equipped = getItemEquippedCountForTown(item);
    const quantity = getItemShopBuyQuantity(item.id);
    const totalPrice = price * quantity;
    const focused = town.panel && town.panel.buyQuantityFocusItemId === item.id;
    const canBuy = price > 0 && quantity > 0 && getGoldValue() >= totalPrice;

    drawFittedTownText(item.name || item.id, detailX, rect.y + 56, detailW, 900, 22, 14, "#f7fff6");
    ctx.fillStyle = "#ffd86b";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText([item.rank, item.kind, item.useTiming].filter(Boolean).join(" / ") || "アイテム", detailX, rect.y + 82);
    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const descriptionLines = wrapCanvasText(item.description || item.simpleDescription || "説明なし", detailW);
    let cursorY = rect.y + 112;
    for (const line of descriptionLines.slice(0, 4)) {
      ctx.fillText(line, detailX, cursorY);
      cursorY += 18;
    }

    cursorY += 8;
    ctx.fillStyle = "#f7fff6";
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("効果", detailX, cursorY);
    cursorY += 20;
    const effectEntries = getItemShopEffectEntriesForTown(item);
    const valueX = detailX + Math.min(detailW, 188);
    for (const entry of effectEntries.slice(0, 8)) {
      drawFittedTownText(entry.label, detailX, cursorY, Math.max(60, valueX - detailX - 12), 700, 13, 10, "#dce9dc");
      ctx.fillStyle = entry.negative ? "#ffb4a8" : "#8ff0a4";
      ctx.font = "900 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(entry.value, valueX, cursorY);
      ctx.textAlign = "left";
      cursorY += 18;
    }

    cursorY += 8;
    ctx.fillStyle = "#f7fff6";
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("所持", detailX, cursorY);
    cursorY += 20;
    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(`持ち物 ${inventory} / 装備中 ${equipped}`, detailX, cursorY);
    cursorY += 20;
    ctx.fillText(`単価 ${formatGoldSafe(price)}`, detailX, cursorY);
    ctx.restore();

    const controlsY = rect.y + rect.h - 54;
    const buyX = rect.x + rect.w - 96;
    ctx.save();
    ctx.fillStyle = canBuy ? "#ffd86b" : "rgba(220,233,220,0.55)";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`合計 ${formatGoldSafe(totalPrice)}`, detailX, controlsY + 18);
    ctx.restore();
    drawTextButton(buyX, controlsY, 74, 36, "購入", { kind: "buyItem", itemId: item.id }, true, !canBuy);
    drawTextButton(buyX - 46, controlsY, 34, 36, "+", { kind: "adjustItemShopQuantity", itemId: item.id, delta: 1 }, false);
    drawQuantityField(buyX - 96, controlsY, 44, 36, quantity, focused, { kind: "focusItemShopQuantity", itemId: item.id });
    drawTextButton(buyX - 138, controlsY, 34, 36, "-", { kind: "adjustItemShopQuantity", itemId: item.id, delta: -1 }, false, quantity <= 1);
  }

  function getItemShopEffectEntriesForTown(item) {
    const entries = [];
    if (!item) {
      return entries;
    }
    if (Number.isFinite(item.healFlat) && item.healFlat !== 0) {
      entries.push({ label: "HP回復", value: formatSignedTownNumber(item.healFlat), negative: item.healFlat < 0 });
    }
    if (Number.isFinite(item.mpFlat) && item.mpFlat !== 0) {
      entries.push({ label: "MP回復", value: formatSignedTownNumber(item.mpFlat), negative: item.mpFlat < 0 });
    }
    if (Number.isFinite(item.moodDelta) && item.moodDelta !== 0) {
      entries.push({ label: "調子", value: formatSignedTownNumber(item.moodDelta), negative: item.moodDelta < 0 });
    }
    if (item.baseStatBuffs && typeof item.baseStatBuffs === "object") {
      for (const [key, value] of Object.entries(item.baseStatBuffs)) {
        if (Number.isFinite(value) && value !== 0) {
          entries.push({ label: `基礎${getTownStatLabel(key)}`, value: formatSignedTownNumber(value), negative: value < 0 });
        }
      }
    }
    if (!entries.length) {
      entries.push({ label: "効果", value: item.simpleDescription || "なし", negative: false });
    }
    if (Number.isFinite(item.cast) && item.cast > 0) {
      entries.push({ label: "使用時間", value: `${formatTownDecimal(item.cast)}秒`, negative: false });
    }
    if (Number.isFinite(item.reuseCd) && item.reuseCd > 0) {
      entries.push({ label: "再使用", value: `${formatTownDecimal(item.reuseCd)}秒`, negative: false });
    }
    if (Number.isFinite(item.battleMaxCount) || Number.isFinite(item.maxCount)) {
      entries.push({ label: "装備上限", value: String(Math.max(1, Math.floor(Number.isFinite(item.battleMaxCount) ? item.battleMaxCount : item.maxCount))), negative: false });
    }
    return entries;
  }

  function getItemShopPrice(item) {
    return Math.max(0, Math.floor(Number.isFinite(item && item.price) ? item.price : 0));
  }

  function getItemInventoryCountForTown(item) {
    return itemSystem && typeof itemSystem.getItemInventoryCount === "function"
      ? itemSystem.getItemInventoryCount(item.id)
      : itemSystem && typeof itemSystem.getItemOwnedCount === "function" ? itemSystem.getItemOwnedCount(item.id) : 0;
  }

  function getItemEquippedCountForTown(item) {
    return itemSystem && typeof itemSystem.getItemEquippedCount === "function" ? itemSystem.getItemEquippedCount(item.id) : 0;
  }

  function formatTownDecimal(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "0";
    }
    return Number.isInteger(numeric) ? String(numeric) : String(Math.round(numeric * 10) / 10);
  }

  function drawShopItemRow(item, x, y, w, h) {
    const price = Math.max(0, Math.floor(Number.isFinite(item.price) ? item.price : 0));
    const inventory = itemSystem && typeof itemSystem.getItemInventoryCount === "function"
      ? itemSystem.getItemInventoryCount(item.id)
      : itemSystem && typeof itemSystem.getItemOwnedCount === "function" ? itemSystem.getItemOwnedCount(item.id) : 0;
    const equipped = itemSystem && typeof itemSystem.getItemEquippedCount === "function" ? itemSystem.getItemEquippedCount(item.id) : 0;
    const quantity = getItemShopBuyQuantity(item.id);
    const totalPrice = price * quantity;
    const focused = town.panel && town.panel.buyQuantityFocusItemId === item.id;
    const canBuy = price > 0 && quantity > 0 && getGoldValue() >= totalPrice;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 17px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(item.name || item.id, x + 18, y + 28);
    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(item.simpleDescription || item.description || "アイテム", x + 18, y + 50);
    ctx.fillStyle = "#ffd86b";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(`${formatGoldSafe(price)} / 持ち物 ${inventory} / 装備中 ${equipped}`, x + Math.max(240, w - 390), y + 28);
    ctx.restore();
    const controlsY = y + 18;
    const buyX = x + w - 92;
    drawTextButton(buyX, controlsY, 74, 36, "購入", { kind: "buyItem", itemId: item.id }, true, !canBuy);
    drawTextButton(buyX - 46, controlsY, 34, 36, "+", { kind: "adjustItemShopQuantity", itemId: item.id, delta: 1 }, false);
    drawQuantityField(buyX - 96, controlsY, 44, 36, quantity, focused, { kind: "focusItemShopQuantity", itemId: item.id });
    drawTextButton(buyX - 138, controlsY, 34, 36, "-", { kind: "adjustItemShopQuantity", itemId: item.id, delta: -1 }, false, quantity <= 1);
    ctx.save();
    ctx.fillStyle = canBuy ? "#ffd86b" : "rgba(220,233,220,0.55)";
    ctx.font = "800 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(formatGoldSafe(totalPrice), buyX - 150, y + 45);
    ctx.restore();
  }

  function drawQuantityField(x, y, w, h, value, focused, action) {
    town.panel.clickTargets.push({ x, y, w, h, action });
    ctx.save();
    ctx.fillStyle = focused ? "rgba(255,216,107,0.18)" : "rgba(255,255,255,0.1)";
    ctx.strokeStyle = focused ? "#ffd86b" : "rgba(255,255,255,0.22)";
    ctx.lineWidth = focused ? 2 : 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fff6";
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(value || 1), x + w / 2, y + h / 2 + 1);
    if (focused) {
      const caretX = x + w - 9;
      ctx.strokeStyle = "#ffd86b";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(caretX, y + 9);
      ctx.lineTo(caretX, y + h - 9);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEquipmentShopPanel() {
    const { x, y, w, h } = getTownFacilityPageRect();
    const shopKind = town.panel.shopKind === "weapon" ? "weapon" : "armor";
    const tab = town.panel.tab === "reset" ? "reset" : town.panel.tab === "upgrade" ? "upgrade" : "craft";
    const rows = getEquipmentShopRows(shopKind, tab);
    drawPanel(x, y, w, h);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(shopKind === "weapon" ? "武器屋" : "防具屋", x + 26, y + 44);
    ctx.fillStyle = "#ffd86b";
    ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(`所持金: ${formatGoldSafe(getGoldValue())}`, x + w - 180, y + 44);

    const craftLabel = shopKind === "weapon" ? "生成" : "製作";
    drawTextButton(x + 26, y + 66, 112, 34, craftLabel, { kind: "selectEquipmentShopTab", tab: "craft" }, tab === "craft");
    drawTextButton(x + 148, y + 66, 112, 34, "強化", { kind: "selectEquipmentShopTab", tab: "upgrade" }, tab === "upgrade");
    drawTextButton(x + 270, y + 66, 138, 34, "強化リセット", { kind: "selectEquipmentShopTab", tab: "reset" }, tab === "reset");
    const filterButtonW = 128;
    const filterButtonX = Math.min(x + 420, x + w - filterButtonW - 26);
    const filterChanged = !isCurrentEquipmentShopFilterDefaultForTown(shopKind);
    drawTextButton(filterButtonX, y + 66, filterButtonW, 34, filterChanged ? "フィルター*" : "フィルター", { kind: "openEquipmentShopFilter" }, filterChanged);
    const listTop = y + 112;

    if (!rows.length) {
      town.panel.scroll = 0;
      town.panel.scrollMax = 0;
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      const label = shopKind === "weapon" ? "武器" : "防具・アクセサリ";
      const action = tab === "craft" ? craftLabel : tab === "reset" ? "強化リセット" : "強化";
      if (tab === "upgrade") {
        ctx.fillText(`強化できる所持${label}はありません。`, x + 26, listTop + 28);
        ctx.fillText(`${shopKind === "weapon" ? "生成" : "製作"}した装備がある場合、同じ装備でも個体ごとにここへ表示されます。`, x + 26, listTop + 56);
      } else if (tab === "reset") {
        ctx.fillText(`強化リセットできる所持${label}はありません。`, x + 26, listTop + 28);
        ctx.fillText(`強化済みの${label}がある場合、同じ装備でも個体ごとにここへ表示されます。`, x + 26, listTop + 56);
      } else {
        ctx.fillText(`${label}の${action}データはまだありません。`, x + 26, listTop + 28);
        ctx.fillText("装備データにレシピを追加すると、ここに候補が表示されます。", x + 26, listTop + 56);
      }
    } else if (shopKind === "armor" || shopKind === "weapon") {
      drawArmorCraftGridPanel(rows, shopKind, tab, x, y, w, h, listTop);
    } else {
      const listRect = { x: x + 24, y: listTop, w: w - 48, h: Math.max(96, y + h - 78 - listTop) };
      const rowH = getEquipmentShopRowHeight(tab);
      const gap = 10;
      const contentH = rows.length * rowH + Math.max(0, rows.length - 1) * gap;
      const scrollMax = Math.max(0, contentH - listRect.h);
      const scroll = Math.max(0, Math.min(scrollMax, town.panel.scroll || 0));
      town.panel.scroll = scroll;
      town.panel.scrollMax = scrollMax;
      ctx.save();
      ctx.beginPath();
      ctx.rect(listRect.x, listRect.y, listRect.w, listRect.h);
      ctx.clip();
      for (let i = 0; i < rows.length; i += 1) {
        const rowY = listRect.y + i * (rowH + gap) - scroll;
        if (rowY + rowH < listRect.y || rowY > listRect.y + listRect.h) {
          continue;
        }
        drawEquipmentShopRow(rows[i], tab, listRect.x, rowY, listRect.w, rowH);
      }
      ctx.restore();
      drawTownScrollbar(listRect, scroll, scrollMax);
    }

    if (town.panel.message) {
      ctx.fillStyle = isTownPanelErrorMessage(town.panel.message) ? "#ffb4a8" : "#ffd86b";
      ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText(town.panel.message, x + 26, y + h - 70);
    }
    drawTextButton(x + 24, y + h - 50, 130, 34, "閉じる", { kind: "close" });
    drawPanelFooter(x, y, w, h);
    if (town.panel.upgradeResult) {
      drawEquipmentUpgradeResultOverlay();
    }
    if (town.panel.confirmation) {
      drawEquipmentResetConfirmationOverlay();
    }
    if (town.panel.filterOpen) {
      drawEquipmentShopFilterOverlay(shopKind);
    }
  }

  function drawEquipmentShopFilterOverlay(shopKind) {
    const filters = getEquipmentShopFilterDraftForTown();
    const w = Math.min(900, Math.max(420, view.w - 56));
    const h = Math.min(620, Math.max(360, view.h - 72));
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;
    town.panel.clickTargets.push({ x: 0, y: 0, w: view.w, h: view.h, action: { kind: "noop" } });

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();

    drawPanel(x, y, w, h);
    ctx.save();
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 22px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("フィルター", x + 26, y + 42);
    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("適用するまで一覧には反映されません。", x + 26, y + 66);
    ctx.restore();

    const contentRect = { x: x + 26, y: y + 88, w: w - 52, h: h - 156 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(contentRect.x, contentRect.y, contentRect.w, contentRect.h);
    ctx.clip();
    drawEquipmentShopFilters(contentRect.x, contentRect.y, contentRect.w, shopKind, filters);
    ctx.restore();

    drawTextButton(x + 26, y + h - 52, 118, 34, "閉じる", { kind: "closeEquipmentShopFilter" });
    drawTextButton(x + w - 282, y + h - 52, 118, 34, "リセット", { kind: "resetEquipmentShopFilterDraft" });
    drawTextButton(x + w - 150, y + h - 52, 124, 34, "適用", { kind: "applyEquipmentShopFilter" }, true);
  }

  function drawEquipmentShopFilters(x, y, w, shopKind, filters = ensureEquipmentShopFiltersForTown()) {
    const startY = y;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    roundRect(x - 2, y - 8, w + 4, 10, 8);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#dce9dc";
    ctx.font = "900 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("絞り込み", x, y + 8);
    ctx.restore();
    y += 22;

    if (shopKind === "weapon") {
      const weapon = filters.weapon;
      y += drawFilterChipRow("種類", createBulkFilterChips("weaponType", EQUIPMENT_SHOP_WEAPON_TYPES.map((type) => ({
        label: type,
        selected: weapon.mode === "type" && weapon.weaponTypes.includes(type),
        action: { kind: "toggleEquipmentShopFilter", category: "weaponType", value: type },
      }))), x, y, w) + 4;
      y += drawFilterChipRow("装備可能者", createBulkFilterChips("weaponUnit", EQUIPMENT_SHOP_UNITS.map((unit) => ({
        label: unit.label,
        selected: weapon.mode === "unit" && weapon.unitIds.includes(unit.id),
        action: { kind: "toggleEquipmentShopFilter", category: "weaponUnit", value: unit.id },
      }))), x, y, w) + 4;
      y += drawFilterChipRow("ランク", createBulkFilterChips("weaponRank", EQUIPMENT_RANK_FILTERS.map((rank) => ({
        label: rank,
        selected: weapon.ranks.includes(rank),
        action: { kind: "toggleEquipmentShopFilter", category: "weaponRank", value: rank },
      }))), x, y, w) + 4;
      y += drawFilterChipRow("並び替え", [
        { label: "デフォルト", selected: !weapon.sortKey, action: { kind: "setEquipmentShopSort", sortKey: "default" } },
        { label: "攻撃力順", selected: weapon.sortKey === "attack", action: { kind: "setEquipmentShopSort", sortKey: "attack" } },
        { label: "魔力順", selected: weapon.sortKey === "magic", action: { kind: "setEquipmentShopSort", sortKey: "magic" } },
        { label: "ランク順", selected: weapon.sortKey === "rank", action: { kind: "setEquipmentShopSort", sortKey: "rank" } },
        { label: "降順", selected: weapon.sortDir !== "asc", action: { kind: "setEquipmentShopSort", sortDir: "desc" } },
        { label: "昇順", selected: weapon.sortDir === "asc", action: { kind: "setEquipmentShopSort", sortDir: "asc" } },
      ], x, y, w);
    } else {
      const armor = filters.armor;
      y += drawFilterChipRow("ランク", createBulkFilterChips("armorRank", EQUIPMENT_RANK_FILTERS.map((rank) => ({
        label: rank,
        selected: armor.ranks.includes(rank),
        action: { kind: "toggleEquipmentShopFilter", category: "armorRank", value: rank },
      }))), x, y, w) + 4;
      y += drawFilterChipRow("装備部位", createBulkFilterChips("armorSlot", ARMOR_SLOT_FILTERS.map((entry) => ({
        label: entry.label,
        selected: armor.slots.includes(entry.key),
        action: { kind: "toggleEquipmentShopFilter", category: "armorSlot", value: entry.key },
      }))), x, y, w) + 4;
      y += drawFilterChipRow("上昇ステータス", createBulkFilterChips("armorBasicStat", ARMOR_BASIC_STAT_FILTERS.map((entry) => ({
        label: entry.label,
        selected: armor.basicStats.includes(entry.key),
        action: { kind: "toggleEquipmentShopFilter", category: "armorBasicStat", value: entry.key },
      }))), x, y, w) + 4;
      y += drawFilterChipRow("その他", createBulkFilterChips("armorDetailStat", ARMOR_DETAIL_STAT_FILTERS.map((entry) => ({
        label: entry.label,
        selected: armor.detailStats.includes(entry.key),
        action: { kind: "toggleEquipmentShopFilter", category: "armorDetailStat", value: entry.key },
      }))), x, y, w) + 4;
      y += drawFilterChipRow("並び替え", [
        { label: "デフォルト", selected: !armor.sortKey, action: { kind: "setEquipmentShopSort", sortKey: "default" } },
        { label: "ランク順", selected: armor.sortKey === "rank", action: { kind: "setEquipmentShopSort", sortKey: "rank" } },
        { label: "降順", selected: armor.sortDir !== "asc", action: { kind: "setEquipmentShopSort", sortDir: "desc" } },
        { label: "昇順", selected: armor.sortDir === "asc", action: { kind: "setEquipmentShopSort", sortDir: "asc" } },
      ], x, y, w);
    }
    return Math.max(82, y - startY);
  }

  function createBulkFilterChips(category, chips) {
    return [
      { label: "全部外す", selected: false, action: { kind: "setEquipmentShopFilterGroup", category, mode: "none" } },
      { label: "全部つける", selected: false, action: { kind: "setEquipmentShopFilterGroup", category, mode: "all" } },
      ...chips,
    ];
  }

  function drawFilterChipRow(label, chips, x, y, w) {
    const labelW = 96;
    const gap = 6;
    const rowH = 26;
    let cursorX = x + labelW;
    let cursorY = y;
    ctx.save();
    ctx.fillStyle = "#dce9dc";
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y + 12);
    ctx.restore();
    ctx.save();
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    for (const chip of chips) {
      const chipW = Math.min(138, Math.max(48, Math.ceil(ctx.measureText(chip.label).width) + 22));
      if (cursorX + chipW > x + w && cursorX > x + labelW) {
        cursorX = x + labelW;
        cursorY += rowH;
      }
      drawFilterChip(cursorX, cursorY, chipW, 22, chip.label, chip.selected, chip.action);
      cursorX += chipW + gap;
    }
    ctx.restore();
    return cursorY + rowH - y;
  }

  function drawFilterChip(x, y, w, h, label, selected, action) {
    const hovered = inputPointInRect(x, y, w, h);
    ctx.save();
    ctx.fillStyle = selected
      ? hovered ? "rgba(255,226,124,0.95)" : "rgba(255,216,107,0.82)"
      : hovered ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.10)";
    ctx.strokeStyle = selected ? "rgba(255,245,190,0.86)" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = selected ? 1.4 : 1;
    roundRect(x, y, w, h, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = selected ? "#102018" : "#f7fff6";
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2 + 0.5);
    ctx.restore();
    town.panel.clickTargets.push({ x, y, w, h, action });
  }

  function inputPointInRect(x, y, w, h) {
    return context.input && context.input.mouse
      && context.input.mouse.x >= x
      && context.input.mouse.x <= x + w
      && context.input.mouse.y >= y
      && context.input.mouse.y <= y + h;
  }

  function drawArmorCraftGridPanel(rows, shopKind, tab, panelX, panelY, panelW, panelH, listTop) {
    const contentX = panelX + 24;
    const contentW = panelW - 48;
    const contentH = Math.max(96, panelY + panelH - 78 - listTop);
    const gap = 18;
    let listW = Math.floor(contentW * 0.64);
    let detailW = contentW - listW - gap;
    if (detailW < 330 && contentW > 640) {
      detailW = 330;
      listW = contentW - detailW - gap;
    }
    if (contentW <= 640) {
      listW = Math.floor(contentW * 0.58);
      detailW = contentW - listW - gap;
    }

    const listRect = {
      x: contentX,
      y: listTop,
      w: Math.max(180, Math.min(listW, Math.max(180, contentW - gap - 120))),
      h: contentH,
    };
    const detailRect = {
      x: contentX + listRect.w + gap,
      y: listTop,
      w: Math.max(1, contentW - listRect.w - gap),
      h: contentH,
    };
    const selectedItem = getSelectedArmorCraftItem(rows);
    const groups = buildArmorCraftGroups(rows, shopKind);
    drawArmorCraftGridList(groups, selectedItem, shopKind, tab, listRect);
    drawArmorCraftDetail(selectedItem, shopKind, tab, detailRect);
  }

  function getSelectedArmorCraftItem(rows) {
    const selectedRef = town.panel && (town.panel.selectedEquipmentShopItemRef || town.panel.selectedEquipmentShopItemId);
    const selected = rows.find((item) => {
      if (!item || !selectedRef) {
        return false;
      }
      return getEquipmentRefForTown(item) === selectedRef || item.id === selectedRef;
    }) || rows[0] || null;
    if (town.panel) {
      town.panel.selectedEquipmentShopItemId = selected && selected.id || null;
      town.panel.selectedEquipmentShopItemRef = selected ? getEquipmentRefForTown(selected) : null;
    }
    return selected;
  }

  function buildArmorCraftGroups(rows, shopKind) {
    const groups = [];
    const groupByKey = new Map();
    for (const item of rows) {
      if (!item) {
        continue;
      }
      const seriesKey = item.series || "no_series";
      let group = groupByKey.get(seriesKey);
      if (!group) {
        group = {
          key: seriesKey,
          name: getEquipmentSeriesNameForTown(seriesKey),
          slots: {},
        };
        groupByKey.set(seriesKey, group);
        groups.push(group);
      }
      const columnKey = getEquipmentShopGridColumnKey(item, shopKind);
      if (!group.slots[columnKey]) {
        group.slots[columnKey] = [];
      }
      group.slots[columnKey].push(item);
    }
    return groups;
  }

  function getEquipmentSeriesNameForTown(seriesKey) {
    const series = EQUIPMENT_DATA && EQUIPMENT_DATA.series ? EQUIPMENT_DATA.series[seriesKey] : null;
    return series && series.name || seriesKey || "シリーズなし";
  }

  function getEquipmentShopGridColumns(shopKind) {
    return shopKind === "weapon" ? WEAPON_CRAFT_GRID_SLOTS : ARMOR_CRAFT_GRID_SLOTS;
  }

  function getEquipmentShopGridColumnKey(item, shopKind) {
    if (!item) {
      return shopKind === "weapon" ? "unknown_weapon" : "unknown_slot";
    }
    return shopKind === "weapon" ? item.weaponType || "unknown_weapon" : item.slot || "unknown_slot";
  }

  function drawArmorCraftGridList(groups, selectedItem, shopKind, tab, rect) {
    const columns = getEquipmentShopGridColumns(shopKind);
    const headerH = 30;
    const compactGrid = rect.w < 560;
    const seriesW = compactGrid
      ? Math.max(70, Math.floor(rect.w * 0.28))
      : Math.min(188, Math.max(118, Math.floor(rect.w * 0.2)));
    const colGap = 6;
    const slotCount = columns.length;
    const slotW = Math.max(12, Math.floor((rect.w - seriesW - colGap * slotCount - 8) / slotCount));
    const rowH = 78;
    const rowGap = 8;
    const listBottom = rect.y + rect.h;

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.fillStyle = "#dce9dc";
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("シリーズ", rect.x + 10, rect.y + 15);
    for (let i = 0; i < slotCount; i += 1) {
      const slot = columns[i];
      const slotX = rect.x + seriesW + colGap + i * (slotW + colGap);
      drawFittedTownText(slot.label, slotX + slotW / 2, rect.y + 15, slotW - 4, 800, 12, 8, "#dce9dc", "center");
    }
    ctx.restore();

    const viewport = {
      x: rect.x,
      y: rect.y + headerH + 6,
      w: rect.w,
      h: Math.max(42, rect.h - headerH - 6),
    };
    const contentH = groups.length * rowH + Math.max(0, groups.length - 1) * rowGap;
    const scrollMax = Math.max(0, contentH - viewport.h);
    const scroll = Math.max(0, Math.min(scrollMax, town.panel.scroll || 0));
    town.panel.scroll = scroll;
    town.panel.scrollMax = scrollMax;

    ctx.save();
    ctx.beginPath();
    ctx.rect(viewport.x, viewport.y, viewport.w, viewport.h);
    ctx.clip();
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const group = groups[groupIndex];
      const rowY = viewport.y + groupIndex * (rowH + rowGap) - scroll;
      if (rowY + rowH < viewport.y || rowY > listBottom) {
        continue;
      }
      ctx.fillStyle = groupIndex % 2 === 0 ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.025)";
      roundRect(rect.x + 2, rowY, rect.w - 8, rowH, 8);
      ctx.fill();
      drawFittedTownText(group.name, rect.x + 12, rowY + 31, seriesW - 18, 900, 15, 10, "#f7fff6");
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const groupCountLabel = shopKind === "weapon" ? "種" : "部位";
      ctx.fillText(`${getArmorCraftGroupItemCount(group)}${groupCountLabel}`, rect.x + 12, rowY + 56);

      for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
        const slot = columns[slotIndex];
        const slotX = rect.x + seriesW + colGap + slotIndex * (slotW + colGap);
        drawArmorCraftGridCell(group.slots[slot.key] || [], selectedItem, tab, slotX, rowY + 8, slotW, rowH - 16);
      }
    }
    ctx.restore();
    drawTownScrollbar(viewport, scroll, scrollMax);
  }

  function getArmorCraftGroupItemCount(group) {
    return Object.values(group.slots || {}).reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0);
  }

  function drawArmorCraftGridCell(items, selectedItem, tab, x, y, w, h) {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      roundRect(x, y, w, h, 7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    const gap = 4;
    const itemH = Math.max(22, Math.floor((h - gap * (list.length - 1)) / list.length));
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      const itemRef = getEquipmentRefForTown(item);
      const cellY = y + i * (itemH + gap);
      const selected = Boolean(selectedItem && item && getEquipmentRefForTown(selectedItem) === itemRef);
      town.panel.clickTargets.push({
        x,
        y: cellY,
        w,
        h: itemH,
        action: { kind: "selectEquipmentShopItem", itemId: item.id, equipmentRef: itemRef },
      });
      ctx.save();
      ctx.fillStyle = selected ? "rgba(255,216,107,0.25)" : "rgba(255,255,255,0.075)";
      ctx.strokeStyle = selected ? "#ffd86b" : "rgba(255,255,255,0.16)";
      ctx.lineWidth = selected ? 2 : 1;
      roundRect(x, cellY, w, itemH, 7);
      ctx.fill();
      ctx.stroke();
      drawFittedTownText(getEquipmentShopItemName(item, tab), x + 6, cellY + Math.max(15, itemH / 2 + 5), w - 12, 900, 12, 8, selected ? "#fff6c2" : "#f7fff6");
      ctx.restore();
    }
  }

  function drawArmorCraftDetail(item, shopKind, tab, rect) {
    const equipmentLabel = shopKind === "weapon" ? "武器" : "防具";
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#dce9dc";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(`選択中の${equipmentLabel}`, rect.x + 16, rect.y + 26);

    if (!item) {
      ctx.fillStyle = "#dce9dc";
      ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText(`左の一覧から${equipmentLabel}を選択してください。`, rect.x + 16, rect.y + 64);
      ctx.restore();
      return;
    }

    const baseId = getEquipmentBaseIdForTown(item);
    const itemRef = getEquipmentRefForTown(item);
    const owned = getEquipmentOwnedCount(baseId);
    const currentLevel = getEquipmentUpgradeLevel(tab === "upgrade" || tab === "reset" ? itemRef : baseId);
    const upgradeRecipe = getUpgradeRecipe(item);
    const baseRecipe = tab === "upgrade" || tab === "reset" ? upgradeRecipe : getCraftRecipe(item);
    const maxLevel = Number.isFinite(upgradeRecipe && upgradeRecipe.maxLevel) ? upgradeRecipe.maxLevel : 5;
    const recipe = tab === "upgrade" ? getUpgradeCostForLevel(upgradeRecipe, currentLevel) : baseRecipe;
    const isMax = tab === "upgrade" && currentLevel >= maxLevel;
    const needsOwned = (tab === "upgrade" || tab === "reset") && !isEquipmentOwned(item);
    const enabled = tab === "reset"
      ? !needsOwned && currentLevel > 0
      : Boolean(recipe) && !isMax && !needsOwned;
    const seriesName = getEquipmentSeriesNameForTown(item.series);
    const categoryName = shopKind === "weapon" ? item.weaponType || "武器種なし" : getEquipmentSlotName(item.slot);
    const detailX = rect.x + 16;
    const detailW = Math.max(60, rect.w - 32);
    drawFittedTownText(getEquipmentShopItemName(item, tab), detailX, rect.y + 56, detailW, 900, 22, 14, "#f7fff6");
    ctx.fillStyle = "#ffd86b";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(`${item.rank || "-"} / ${seriesName} / ${categoryName}`, detailX, rect.y + 82);
    ctx.fillStyle = enabled ? "#ffd86b" : "rgba(220,233,220,0.55)";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const stateText = tab === "reset"
      ? needsOwned ? "未所持" : currentLevel <= 0 ? "+0 / リセット済み" : `+${currentLevel} -> +0`
      : tab === "upgrade"
        ? needsOwned ? "未所持" : isMax ? `+${currentLevel} / 最大` : `+${currentLevel} -> +${currentLevel + 1}`
        : `所持 ${owned}`;
    ctx.fillText(stateText, detailX, rect.y + 104);
    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const descriptionLines = wrapCanvasText(item.simpleDescription || item.description || "説明なし", detailW);
    let cursorY = rect.y + 134;
    for (const line of descriptionLines.slice(0, 2)) {
      ctx.fillText(line, detailX, cursorY);
      cursorY += 18;
    }

    cursorY += 8;
    ctx.fillStyle = "#f7fff6";
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("ステータス", detailX, cursorY);
    cursorY += 20;
    const statEntries = getEquipmentItemStatEntriesForTown(item);
    if (!statEntries.length) {
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("ステータスなし", detailX, cursorY);
      cursorY += 20;
    } else {
      const statValueX = detailX + Math.min(detailW, 188);
      for (const entry of statEntries.slice(0, 8)) {
        ctx.fillStyle = "#dce9dc";
        ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
        drawFittedTownText(entry.label, detailX, cursorY, Math.max(48, statValueX - detailX - 12), 700, 13, 10, "#dce9dc");
        ctx.fillStyle = entry.negative ? "#ffb4a8" : "#8ff0a4";
        ctx.font = "900 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(entry.value, statValueX, cursorY);
        ctx.textAlign = "left";
        cursorY += 18;
      }
    }

    if (shopKind === "weapon") {
      cursorY = drawWeaponNormalAttackDetailForTown(item, detailX, cursorY + 8, detailW, rect.y + rect.h - 86);
    }
    cursorY = drawEquipmentSetEffectDetailForTown(item, detailX, cursorY + 8, detailW, rect.y + rect.h - 86);

    cursorY += 8;
    ctx.fillStyle = "#f7fff6";
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("必要素材", detailX, cursorY);
    cursorY += 20;
    const requirementEntries = getRecipeRequirementEntriesForTown(recipe, tab);
    const requirementValueX = detailX + Math.min(detailW, 230);
    for (const entry of requirementEntries.slice(0, 6)) {
      drawFittedTownText(entry.label, detailX, cursorY, Math.max(60, requirementValueX - detailX - 14), 700, 13, 10, "#dce9dc");
      drawRecipeRequirementValue(entry, requirementValueX, cursorY);
      cursorY += 18;
    }
    ctx.fillStyle = "#ffd86b";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const equippedText = getEquipmentEquippedTextForTown(item);
    ctx.fillText(equippedText || `所持 ${owned}`, detailX, Math.min(rect.y + rect.h - 66, cursorY + 8));
    ctx.restore();

    const buttonLabel = tab === "reset" ? "リセット" : tab === "upgrade" ? "強化" : shopKind === "weapon" ? "生成" : "製作";
    drawTextButton(rect.x + rect.w - 130, rect.y + rect.h - 52, 104, 36, buttonLabel, {
      kind: tab === "reset" ? "resetEquipmentUpgrade" : tab === "upgrade" ? "upgradeEquipment" : "craftEquipment",
      itemId: baseId,
      equipmentRef: itemRef,
    }, true, !enabled);
  }

  function getTownDescription(source) {
    if (!source) {
      return "";
    }
    const detail = game && game.settings && game.settings.tooltipDescriptionMode === "detail";
    return detail
      ? source.description || source.simpleDescription || source.tooltip || source.helpText || ""
      : source.simpleDescription || source.description || source.tooltip || source.helpText || "";
  }

  function getSkillByIdForTown(skillId) {
    const id = String(skillId || "").trim();
    if (!id || !SKILL_DATA) {
      return null;
    }
    for (const ownerSkills of Object.values(SKILL_DATA)) {
      if (!ownerSkills || typeof ownerSkills !== "object") {
        continue;
      }
      for (const skill of Object.values(ownerSkills)) {
        if (skill && String(skill.id || "") === id) {
          return skill;
        }
      }
    }
    return null;
  }

  function drawEquipmentDetailSectionTitleForTown(title, x, y, maxY) {
    if (y + 18 > maxY) {
      return null;
    }
    ctx.fillStyle = "#f7fff6";
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(title, x, y);
    return y + 20;
  }

  function drawWeaponNormalAttackDetailForTown(item, x, y, w, maxY) {
    if (!item || item.slot !== "weapon" || !item.normalAttackSkillId) {
      return y;
    }
    let cursorY = drawEquipmentDetailSectionTitleForTown("通常攻撃", x, y, maxY);
    if (cursorY === null) {
      return y;
    }
    const skill = getSkillByIdForTown(item.normalAttackSkillId);
    if (!skill || cursorY > maxY) {
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("説明なし", x, cursorY);
      return cursorY + 16;
    }
    if (cursorY > maxY) {
      return cursorY;
    }
    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const lines = wrapCanvasText(getTownDescription(skill) || "説明なし", w);
    for (const line of lines.slice(0, 2)) {
      if (cursorY > maxY) {
        break;
      }
      ctx.fillText(line, x, cursorY);
      cursorY += 16;
    }
    return cursorY;
  }

  function getEquipmentSetEffectEntriesForTown(item) {
    const seriesKey = item && item.series;
    const series = seriesKey && EQUIPMENT_DATA && EQUIPMENT_DATA.series ? EQUIPMENT_DATA.series[seriesKey] : null;
    const effects = series && series.setEffects;
    if (!effects || typeof effects !== "object") {
      return [];
    }
    return Object.entries(effects)
      .map(([threshold, effect]) => ({
        threshold: Math.max(0, Math.floor(Number(threshold) || 0)),
        effect,
      }))
      .filter((entry) => entry.threshold > 0 && entry.effect)
      .sort((a, b) => a.threshold - b.threshold);
  }

  function drawEquipmentSetEffectDetailForTown(item, x, y, w, maxY) {
    const entries = getEquipmentSetEffectEntriesForTown(item);
    if (!entries.length) {
      return y;
    }
    let cursorY = drawEquipmentDetailSectionTitleForTown("セット効果", x, y, maxY);
    if (cursorY === null) {
      return y;
    }
    for (const entry of entries.slice(0, 3)) {
      if (cursorY > maxY) {
        break;
      }
      const effect = entry.effect;
      const description = getTownDescription(effect) || "説明なし";
      const text = `${entry.threshold}セット ${effect.name || "セット効果"}: ${description}`;
      const lines = wrapCanvasText(text, w);
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      for (const line of lines.slice(0, 2)) {
        if (cursorY > maxY) {
          break;
        }
        ctx.fillText(line, x, cursorY);
        cursorY += 16;
      }
    }
    return cursorY;
  }

  function getEquipmentItemStatEntriesForTown(item) {
    const entries = [];
    if (!item) {
      return entries;
    }
    for (const [key, value] of Object.entries(item.flatStatBonuses || {})) {
      if (Number.isFinite(value) && value !== 0) {
        entries.push({
          label: getTownStatLabel(key),
          value: formatSignedTownNumber(value),
          negative: value < 0,
        });
      }
    }
    for (const [key, value] of Object.entries(item.statBonuses || {})) {
      if (Number.isFinite(value) && value !== 0) {
        const displayValue = isReductionStatKey(key) ? -value : value;
        entries.push({
          label: getTownStatLabel(key),
          value: formatTownStatPercent(key, value, true),
          negative: displayValue < 0,
        });
      }
    }
    return entries;
  }

  function getRecipeRequirementEntriesForTown(recipe, tab) {
    if (tab === "reset") {
      return [{ label: "なし", value: "無料", enough: true }];
    }
    if (!recipe) {
      return [{ label: "未設定", value: "-", enough: false }];
    }
    const entries = [];
    const gold = getRecipeGoldCost(recipe);
    if (gold > 0) {
      const ownedGold = getGoldValue();
      const requiredText = formatGoldSafe(gold);
      const ownedText = formatGoldSafe(ownedGold);
      entries.push({
        label: "所持金",
        requiredText,
        ownedText,
        value: `${requiredText}/${ownedText}`,
        enough: ownedGold >= gold,
      });
    }
    for (const [key, rawCount] of Object.entries(getRecipeMaterials(recipe))) {
      const numericCount = Number(rawCount);
      const required = Math.max(0, Math.floor(Number.isFinite(numericCount) ? numericCount : 0));
      if (required <= 0) {
        continue;
      }
      const owned = getMaterialOwnedCountForTown(key);
      entries.push({
        label: getMaterialNameForTown(key),
        requiredText: String(required),
        ownedText: String(owned),
        value: `${required}/${owned}`,
        enough: owned >= required,
      });
    }
    return entries.length ? entries : [{ label: "なし", value: "無料", enough: true }];
  }

  function drawRecipeRequirementValue(entry, rightX, y) {
    ctx.save();
    ctx.font = "900 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const requiredText = entry && entry.requiredText;
    const ownedText = entry && entry.ownedText;
    if (!requiredText || !ownedText) {
      ctx.fillStyle = entry && entry.enough ? "#8ff0a4" : "#ffb4a8";
      ctx.textAlign = "right";
      ctx.fillText(entry && entry.value || "", rightX, y);
      ctx.restore();
      return;
    }

    const separator = "/";
    const requiredW = ctx.measureText(requiredText).width;
    const separatorW = ctx.measureText(separator).width;
    const ownedW = ctx.measureText(ownedText).width;
    let cursorX = rightX - requiredW - separatorW - ownedW;
    ctx.textAlign = "left";
    ctx.fillStyle = "#dce9dc";
    ctx.fillText(requiredText, cursorX, y);
    cursorX += requiredW;
    ctx.fillText(separator, cursorX, y);
    cursorX += separatorW;
    ctx.fillStyle = entry.enough ? "#8ff0a4" : "#ffb4a8";
    ctx.fillText(ownedText, cursorX, y);
    ctx.restore();
  }

  function getMaterialNameForTown(key) {
    const material = MATERIAL_DATA && MATERIAL_DATA.materials ? MATERIAL_DATA.materials[key] : null;
    return material && material.name ? material.name : key === "kari_dorop" ? "仮素材" : key || "素材";
  }

  function getMaterialOwnedCountForTown(key) {
    const store = game.materialsById && typeof game.materialsById === "object" ? game.materialsById : {};
    const amount = Number(store[key]);
    return Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  }

  function drawEquipmentShopRow(item, tab, x, y, w, h) {
    const baseId = getEquipmentBaseIdForTown(item);
    const itemRef = getEquipmentRefForTown(item);
    const displayItem = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(itemRef) || item : item;
    const owned = getEquipmentOwnedCount(baseId);
    const currentLevel = getEquipmentUpgradeLevel(tab === "upgrade" || tab === "reset" ? itemRef : baseId);
    const upgradeRecipe = getUpgradeRecipe(item);
    const baseRecipe = tab === "upgrade" || tab === "reset" ? upgradeRecipe : getCraftRecipe(item);
    const maxLevel = Number.isFinite(upgradeRecipe && upgradeRecipe.maxLevel) ? upgradeRecipe.maxLevel : 5;
    const recipe = tab === "upgrade" ? getUpgradeCostForLevel(upgradeRecipe, currentLevel) : baseRecipe;
    const isMax = tab === "upgrade" && currentLevel >= maxLevel;
    const needsOwned = (tab === "upgrade" || tab === "reset") && !isEquipmentOwned(item);
    const enabled = tab === "reset"
      ? !needsOwned && currentLevel > 0
      : Boolean(recipe) && !isMax && !needsOwned;
    const textW = Math.max(220, w - 152);
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    ctx.strokeStyle = enabled ? "rgba(255,216,107,0.42)" : "rgba(255,255,255,0.16)";
    ctx.lineWidth = enabled ? 2 : 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 16px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(getEquipmentShopItemName(item, tab), x + 18, y + 27);
    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const slot = getEquipmentSlotName(item.slot);
    const cost = tab === "reset" ? "無料" : recipe ? formatRecipeCost(recipe) : "コスト未設定";
    ctx.fillText(`${item.rank || "-"} / ${slot}${item.weaponType ? ` / ${item.weaponType}` : ""}`, x + 18, y + 49);
    ctx.fillStyle = enabled ? "#ffd86b" : "rgba(220,233,220,0.55)";
    const stateText = tab === "reset"
      ? needsOwned ? "未所持" : currentLevel <= 0 ? "+0 / リセット済み" : `+${currentLevel} -> +0`
      : tab === "upgrade"
        ? needsOwned ? "未所持" : isMax ? `+${currentLevel} / 最大` : `+${currentLevel} -> +${currentLevel + 1}`
        : `所持 ${owned}`;
    const stateParts = [stateText, cost];
    const equippedText = getEquipmentEquippedTextForTown(item);
    if (equippedText) {
      stateParts.push(equippedText);
    }
    drawFittedTownText(stateParts.join(" / "), x + 18, y + 70, textW, 800, 12, 9, enabled ? "#ffd86b" : "rgba(220,233,220,0.55)");
    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const statLines = getEquipmentShopStatLines(displayItem, textW, h >= 116 ? 2 : 1);
    for (let i = 0; i < statLines.length; i += 1) {
      ctx.fillText(statLines[i], x + 18, y + 93 + i * 16);
    }
    ctx.restore();
    const buttonLabel = tab === "reset" ? "リセット" : tab === "upgrade" ? "強化" : item && item.slot === "weapon" ? "生成" : "製作";
    drawTextButton(x + w - 112, y + Math.max(14, (h - 36) / 2), 90, 36, buttonLabel, {
      kind: tab === "reset" ? "resetEquipmentUpgrade" : tab === "upgrade" ? "upgradeEquipment" : "craftEquipment",
      itemId: baseId,
      equipmentRef: itemRef,
    }, true, !enabled);
  }

  function drawEquipmentUpgradeResultOverlay() {
    const result = town.panel && town.panel.upgradeResult;
    if (!result) {
      return;
    }
    const entries = Array.isArray(result.entries) ? result.entries : [];
    const singleColumn = Boolean(result.singleColumn);
    const rowH = singleColumn ? 32 : 34;
    const visibleRows = Math.max(1, entries.length);
    const noteH = result.note ? 24 : 0;
    const w = Math.min(singleColumn ? 760 : 700, view.w - 42);
    const subtitle = result.subtitle || `+${result.beforeLevel || 0} -> +${result.afterLevel || 0}`;
    const summaryText = `${result.name || "装備"}  ${subtitle}`;
    ctx.save();
    ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const summaryLines = wrapCanvasText(summaryText, w - 72);
    ctx.restore();
    const summaryH = Math.max(18, summaryLines.length * 18);
    const headerExtraH = Math.max(0, summaryH - 18);
    const h = Math.min(view.h - 48, Math.max(singleColumn ? 320 : 294, 220 + noteH + headerExtraH + visibleRows * rowH));
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;
    town.panel.clickTargets.push({ x: 0, y: 0, w: view.w, h: view.h, action: { kind: "noop" } });

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(0, 0, view.w, view.h);
    drawPanel(x, y, w, h);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f7fff6";
    ctx.font = "900 23px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(result.title || "強化結果", x + 26, y + 42);
    ctx.fillStyle = "#ffd86b";
    ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    for (let i = 0; i < summaryLines.length; i += 1) {
      ctx.fillText(summaryLines[i], x + 28, y + 68 + i * 18);
    }
    if (result.note) {
      ctx.fillStyle = "#dce9dc";
      ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText(result.note, x + 28, y + 91 + headerExtraH);
    }

    drawTextButton(x + w - 48, y + 18, 30, 30, "×", { kind: "closeEquipmentUpgradeResult" });

    const tableX = x + 26;
    const tableY = y + 98 + noteH + headerExtraH;
    const tableW = w - 52;
    const labelW = singleColumn ? Math.min(320, Math.max(190, tableW * 0.52)) : Math.min(176, Math.max(124, tableW * 0.28));
    const valueW = singleColumn ? tableW - labelW : (tableW - labelW - 58) / 2;
    const beforeX = tableX + labelW;
    const arrowX = beforeX + valueW;
    const afterX = arrowX + 58;

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(tableX, tableY - 26, tableW, 30, 8);
    ctx.fill();
    ctx.fillStyle = "#dce9dc";
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    if (singleColumn) {
      ctx.textAlign = "left";
      ctx.fillText("ステータス", tableX + 12, tableY - 7);
    } else {
      ctx.fillText(result.beforeLabel || "強化前", beforeX + valueW / 2, tableY - 7);
      ctx.fillText(result.afterLabel || "強化後", afterX + valueW / 2, tableY - 7);
    }

    const rowStartY = tableY + 30;
    const rowViewport = {
      x: tableX,
      y: rowStartY - 20,
      w: tableW,
      h: Math.max(64, y + h - 74 - (rowStartY - 20)),
    };
    const rowContentH = entries.length * rowH;
    const resultScrollMax = Math.max(0, rowContentH - rowViewport.h);
    const resultScroll = Math.max(0, Math.min(resultScrollMax, town.panel.resultScroll || 0));
    town.panel.resultScroll = resultScroll;
    town.panel.resultScrollMax = resultScrollMax;

    if (!entries.length) {
      ctx.fillStyle = "#dce9dc";
      ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(result.emptyText || "変化したステータスはありません。", x + w / 2, rowStartY + 52);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rowViewport.x, rowViewport.y, rowViewport.w, rowViewport.h);
      ctx.clip();
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        const rowY = rowStartY + i * rowH - resultScroll;
        if (rowY + rowH < rowViewport.y || rowY - 22 > rowViewport.y + rowViewport.h) {
          continue;
        }
        ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.025)";
        roundRect(tableX, rowY - 20, tableW, rowH - 4, 6);
        ctx.fill();

        ctx.fillStyle = entry.highlight ? "#ff8a80" : "#f7fff6";
        ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(entry.label || entry.key || "ステータス", tableX + 12, rowY + 1);

        if (singleColumn) {
          ctx.fillStyle = entry.after >= 0 ? "#f7fff6" : "#ffb4a8";
          ctx.font = "900 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(formatUpgradeResultValue(entry.after, entry.kind, entry.key), tableX + tableW - 12, rowY + 1);
          continue;
        }

        ctx.textAlign = "center";
        ctx.fillStyle = "#dce9dc";
        ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
        ctx.fillText(formatUpgradeResultValue(entry.before, entry.kind, entry.key), beforeX + valueW / 2, rowY + 1);

        ctx.fillStyle = "#ffd86b";
        ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
        ctx.fillText("→", arrowX + 29, rowY + 2);

        ctx.fillStyle = entry.highlight ? "#ff8a80" : "#f7fff6";
        ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
        ctx.fillText(formatUpgradeResultValue(entry.after, entry.kind, entry.key), afterX + valueW / 2, rowY + 1);

        ctx.fillStyle = entry.delta >= 0 ? "#8ff0a4" : "#ffb4a8";
        ctx.font = "900 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(formatUpgradeResultDelta(entry.delta, entry.kind), tableX + tableW - 12, rowY + 1);
      }
      ctx.restore();
      drawTownScrollbar(rowViewport, resultScroll, resultScrollMax, {
        valueKey: "resultScroll",
        maxKey: "resultScrollMax",
      });
    }

    drawTextButton(x + w / 2 - 76, y + h - 58, 152, 38, "閉じる", { kind: "closeEquipmentUpgradeResult" }, true);
    ctx.restore();
  }

  function drawEquipmentResetConfirmationOverlay() {
    const confirmation = town.panel && town.panel.confirmation;
    if (!confirmation) {
      return;
    }
    const w = Math.min(560, view.w - 42);
    const h = Math.min(300, view.h - 56);
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;
    town.panel.clickTargets.push({ x: 0, y: 0, w: view.w, h: view.h, action: { kind: "noop" } });

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.54)";
    ctx.fillRect(0, 0, view.w, view.h);
    drawPanel(x, y, w, h);

    ctx.fillStyle = "#f7fff6";
    ctx.font = "900 22px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(confirmation.title || "確認", x + 26, y + 44);
    drawTextButton(x + w - 48, y + 18, 30, 30, "×", { kind: "cancelEquipmentReset" });

    ctx.fillStyle = "#dce9dc";
    ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const lines = wrapCanvasText(confirmation.message || "", w - 56);
    let cursorY = y + 86;
    for (const line of lines.slice(0, 4)) {
      ctx.fillText(line, x + 28, cursorY);
      cursorY += 24;
    }
    if (confirmation.cost) {
      ctx.fillStyle = "#ffd86b";
      ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText(`コスト: ${formatRecipeCost(confirmation.cost)}`, x + 28, Math.min(y + h - 118, cursorY + 8));
      cursorY += 28;
    }
    if (confirmation.note) {
      ctx.fillStyle = "#ffb4a8";
      ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText(confirmation.note, x + 28, Math.min(y + h - 92, cursorY + 8));
    }

    drawTextButton(x + 28, y + h - 58, 132, 38, confirmation.cancelLabel || "いいえ", { kind: "cancelEquipmentReset" });
    drawTextButton(x + w - 184, y + h - 58, 156, 38, confirmation.confirmLabel || "はい", { kind: "confirmEquipmentReset" }, true);
    ctx.restore();
  }

  function formatUpgradeResultValue(value, kind, key = "") {
    const amount = Number.isFinite(value) ? value : 0;
    if (kind === "percent") {
      return formatTownStatPercent(key, amount, false);
    }
    return Number.isInteger(amount) ? String(amount) : String(Math.round(amount * 10) / 10);
  }

  function formatUpgradeResultDelta(value, kind) {
    const amount = Number.isFinite(value) ? value : 0;
    const sign = amount >= 0 ? "+" : "";
    if (kind === "percent") {
      return `${sign}${Math.round(amount * 100)}%`;
    }
    const rounded = Number.isInteger(amount) ? amount : Math.round(amount * 10) / 10;
    return `${sign}${rounded}`;
  }

  function drawPanelFooter(x, y, w, h) {
    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${getBackLabel()}  閉じる`, x + w - 24, y + h - 22);
  }

  function isTownPanelErrorMessage(message) {
    return /足りません|持てません|見つかりません|ありません|できません/.test(String(message || ""));
  }

  function getShopItems() {
    const items = itemSystem && typeof itemSystem.getItemCandidates === "function"
      ? itemSystem.getItemCandidates()
      : [];
    return items.filter((item) => item && !item.shopHidden && Number.isFinite(item.price));
  }

  function getItemShopBuyQuantity(itemId) {
    const values = town.panel && town.panel.buyQuantities && typeof town.panel.buyQuantities === "object"
      ? town.panel.buyQuantities
      : {};
    const value = Number(values[itemId]);
    return Math.max(1, Math.min(99, Math.floor(Number.isFinite(value) ? value : 1)));
  }

  function getEquipmentShopRows(shopKind, tab) {
    const items = EQUIPMENT_DATA && EQUIPMENT_DATA.items ? Object.values(EQUIPMENT_DATA.items) : [];
    const rows = [];
    for (const item of items) {
      if (!item) {
        continue;
      }
      if (item.shopHidden) {
        continue;
      }
      if (shopKind === "weapon" && item.slot !== "weapon") {
        continue;
      }
      if (shopKind !== "weapon" && item.slot === "weapon") {
        continue;
      }
      if (tab === "upgrade" || tab === "reset") {
        if (!getUpgradeRecipe(item)) {
          continue;
        }
        const instances = typeof getEquipmentInstancesByItemId === "function"
          ? getEquipmentInstancesByItemId(item.id)
          : [];
        rows.push(...instances);
      } else if (getCraftRecipe(item)) {
        rows.push(item);
      }
    }
    return applyEquipmentShopFilters(rows, shopKind);
  }

  function createDefaultEquipmentShopFiltersForTown() {
    return {
      weapon: {
        mode: "type",
        weaponTypes: [...EQUIPMENT_SHOP_WEAPON_TYPES],
        unitIds: [],
        ranks: [...EQUIPMENT_RANK_FILTERS],
        sortKey: null,
        sortDir: "desc",
      },
      armor: {
        ranks: [...EQUIPMENT_RANK_FILTERS],
        slots: ARMOR_SLOT_FILTERS.map((entry) => entry.key),
        basicStats: ARMOR_BASIC_STAT_FILTERS.map((entry) => entry.key),
        detailStats: ARMOR_DETAIL_STAT_FILTERS.map((entry) => entry.key),
        sortKey: null,
        sortDir: "desc",
      },
    };
  }

  function getEquipmentShopFilterDraftForTown() {
    if (town.panel && town.panel.filterOpen && town.panel.filterDraft && typeof town.panel.filterDraft === "object") {
      return town.panel.filterDraft;
    }
    return ensureEquipmentShopFiltersForTown();
  }

  function getEquipmentShopFilterSnapshotForTown(shopKind, filters) {
    const target = shopKind === "weapon" ? filters && filters.weapon : filters && filters.armor;
    if (shopKind === "weapon") {
      return JSON.stringify({
        mode: target && target.mode === "unit" ? "unit" : "type",
        weaponTypes: getSortedFilterValues(target && target.weaponTypes),
        unitIds: getSortedFilterValues(target && target.unitIds),
        ranks: getSortedFilterValues(target && target.ranks),
        sortKey: target && target.sortKey || null,
        sortDir: target && target.sortDir === "asc" ? "asc" : "desc",
      });
    }
    return JSON.stringify({
      ranks: getSortedFilterValues(target && target.ranks),
      slots: getSortedFilterValues(target && target.slots),
      basicStats: getSortedFilterValues(target && target.basicStats),
      detailStats: getSortedFilterValues(target && target.detailStats),
      sortKey: target && target.sortKey || null,
      sortDir: target && target.sortDir === "asc" ? "asc" : "desc",
    });
  }

  function getSortedFilterValues(values) {
    return Array.isArray(values) ? values.slice().sort() : [];
  }

  function isCurrentEquipmentShopFilterDefaultForTown(shopKind) {
    const filters = ensureEquipmentShopFiltersForTown();
    const defaults = createDefaultEquipmentShopFiltersForTown();
    const currentSnapshot = getEquipmentShopFilterSnapshotForTown(shopKind, filters);
    const defaultSnapshot = getEquipmentShopFilterSnapshotForTown(shopKind, defaults);
    return currentSnapshot === defaultSnapshot;
  }

  function ensureEquipmentShopFiltersForTown() {
    if (!town.panel || town.panel.action !== "equipmentShop") {
      return createDefaultEquipmentShopFiltersForTown();
    }
    if (!town.panel.filters || typeof town.panel.filters !== "object") {
      town.panel.filters = createDefaultEquipmentShopFiltersForTown();
    }
    const defaults = createDefaultEquipmentShopFiltersForTown();
    const filters = town.panel.filters;
    if (!filters.weapon || typeof filters.weapon !== "object") {
      filters.weapon = defaults.weapon;
    }
    if (!filters.armor || typeof filters.armor !== "object") {
      filters.armor = defaults.armor;
    }
    if (!Array.isArray(filters.weapon.weaponTypes)) {
      filters.weapon.weaponTypes = [...EQUIPMENT_SHOP_WEAPON_TYPES];
    }
    if (!Array.isArray(filters.weapon.unitIds)) {
      filters.weapon.unitIds = [];
    }
    if (!Array.isArray(filters.weapon.ranks)) {
      filters.weapon.ranks = [...EQUIPMENT_RANK_FILTERS];
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
      filters.armor.ranks = [...EQUIPMENT_RANK_FILTERS];
    }
    if (!Array.isArray(filters.armor.slots)) {
      filters.armor.slots = ARMOR_SLOT_FILTERS.map((entry) => entry.key);
    }
    if (!Array.isArray(filters.armor.basicStats)) {
      filters.armor.basicStats = ARMOR_BASIC_STAT_FILTERS.map((entry) => entry.key);
    }
    if (!Array.isArray(filters.armor.detailStats)) {
      filters.armor.detailStats = ARMOR_DETAIL_STAT_FILTERS.map((entry) => entry.key);
    }
    if (!["rank", null].includes(filters.armor.sortKey)) {
      filters.armor.sortKey = null;
    }
    if (filters.armor.sortDir !== "asc") {
      filters.armor.sortDir = "desc";
    }
    return filters;
  }

  function applyEquipmentShopFilters(rows, shopKind) {
    const filters = ensureEquipmentShopFiltersForTown();
    const shopFilters = shopKind === "weapon" ? filters.weapon : filters.armor;
    const filtered = shopKind === "weapon"
      ? rows.filter((item) => matchWeaponShopFilters(item, shopFilters))
      : rows.filter((item) => matchArmorShopFilters(item, shopFilters));
    if (shopFilters.sortKey) {
      const sortKey = shopFilters.sortKey;
      const dir = shopFilters.sortDir === "asc" ? 1 : -1;
      filtered.sort((a, b) => {
        const diff = getEquipmentSortStatValue(a, sortKey) - getEquipmentSortStatValue(b, sortKey);
        if (diff !== 0) {
          return diff * dir;
        }
        return String(a && a.name || a && a.id || "").localeCompare(String(b && b.name || b && b.id || ""), "ja");
      });
    }
    return filtered;
  }

  function matchWeaponShopFilters(item, filters) {
    if (!item) {
      return false;
    }
    if (!matchesEquipmentFilterValue(item.rank, filters.ranks, EQUIPMENT_RANK_FILTERS)) {
      return false;
    }
    if (filters.mode === "unit") {
      const allUnitIds = EQUIPMENT_SHOP_UNITS.map((unit) => unit.id);
      if (isEquipmentFilterEmpty(filters.unitIds, allUnitIds)) {
        return false;
      }
      if (!isEquipmentFilterActive(filters.unitIds, allUnitIds)) {
        return true;
      }
      const allowed = getWeaponAllowedUnitIdsForTown(item);
      return filters.unitIds.some((unitId) => allowed.includes(unitId));
    }
    return matchesEquipmentFilterValue(item.weaponType, filters.weaponTypes, EQUIPMENT_SHOP_WEAPON_TYPES);
  }

  function getWeaponAllowedUnitIdsForTown(item) {
    if (Array.isArray(item && item.allowedUnitIds)) {
      return item.allowedUnitIds;
    }
    return WEAPON_ALLOWED_UNIT_FALLBACK[item && item.weaponType] || [];
  }

  function matchArmorShopFilters(item, filters) {
    if (!item) {
      return false;
    }
    if (!matchesEquipmentFilterValue(item.rank, filters.ranks, EQUIPMENT_RANK_FILTERS)) {
      return false;
    }
    const armorSlots = ARMOR_SLOT_FILTERS.map((entry) => entry.key);
    const armorBasicStats = ARMOR_BASIC_STAT_FILTERS.map((entry) => entry.key);
    const armorDetailStats = ARMOR_DETAIL_STAT_FILTERS.map((entry) => entry.key);
    if (!matchesEquipmentFilterValue(item.slot, filters.slots, armorSlots)) {
      return false;
    }
    if (isEquipmentFilterEmpty(filters.basicStats, armorBasicStats)) {
      return false;
    }
    if (isEquipmentFilterActive(filters.basicStats, armorBasicStats) && !filters.basicStats.some((key) => hasEquipmentShopStat(item, key))) {
      return false;
    }
    if (isEquipmentFilterEmpty(filters.detailStats, armorDetailStats)) {
      return false;
    }
    if (isEquipmentFilterActive(filters.detailStats, armorDetailStats) && !filters.detailStats.some((key) => hasEquipmentShopStat(item, key))) {
      return false;
    }
    return true;
  }

  function matchesEquipmentFilterValue(value, selectedValues, allValues) {
    if (isEquipmentFilterEmpty(selectedValues, allValues)) {
      return false;
    }
    return !isEquipmentFilterActive(selectedValues, allValues) || selectedValues.includes(value);
  }

  function isEquipmentFilterActive(selectedValues, allValues) {
    return getEquipmentFilterState(selectedValues, allValues) === "partial";
  }

  function isEquipmentFilterEmpty(selectedValues, allValues) {
    return getEquipmentFilterState(selectedValues, allValues) === "none";
  }

  function getEquipmentFilterState(selectedValues, allValues) {
    if (!Array.isArray(selectedValues) || !Array.isArray(allValues)) {
      return "all";
    }
    if (!selectedValues.length) {
      return "none";
    }
    const allSelected = allValues.length > 0 && allValues.every((value) => selectedValues.includes(value));
    return allSelected ? "all" : "partial";
  }

  function hasEquipmentShopStat(item, key) {
    return getEquipmentShopStatRawValue(item, key) !== 0;
  }

  function getEquipmentSortStatValue(item, key) {
    if (key === "rank") {
      return getEquipmentRankSortValue(item);
    }
    return getEquipmentShopStatRawValue(item, key);
  }

  function getEquipmentRankSortValue(item) {
    const order = typeof HEALER_RANK_DATA !== "undefined" && Array.isArray(HEALER_RANK_DATA.order)
      ? HEALER_RANK_DATA.order
      : EQUIPMENT_RANK_FILTERS;
    const index = order.indexOf(item && item.rank);
    return index >= 0 ? index : -1;
  }

  function getEquipmentShopStatRawValue(item, key) {
    if (!item || !key) {
      return 0;
    }
    const flat = item.flatStatBonuses && Number(item.flatStatBonuses[key]);
    const percent = item.statBonuses && Number(item.statBonuses[key]);
    return (Number.isFinite(flat) ? flat : 0) + (Number.isFinite(percent) ? percent * 100 : 0);
  }

  function getEquipmentRefForTown(itemOrRef) {
    if (typeof getEquipmentItemRef === "function") {
      return getEquipmentItemRef(itemOrRef);
    }
    if (!itemOrRef) {
      return null;
    }
    return typeof itemOrRef === "string" ? itemOrRef : itemOrRef.id || null;
  }

  function getEquipmentBaseIdForTown(itemOrRef) {
    if (typeof getEquipmentBaseItemId === "function") {
      return getEquipmentBaseItemId(itemOrRef);
    }
    if (!itemOrRef) {
      return null;
    }
    return typeof itemOrRef === "string" ? itemOrRef : itemOrRef.id || null;
  }

  function getEquipmentShopItemName(item, tab) {
    const name = item && (item.name || item.id) || "装備";
    if (!["upgrade", "reset"].includes(tab) || !Number.isFinite(item && item.copyIndex) || !Number.isFinite(item && item.copyCount) || item.copyCount <= 1) {
      return name;
    }
    return `${name} #${item.copyIndex}`;
  }

  function getEquipmentShopRowHeight(tab) {
    return tab === "upgrade" || tab === "reset" ? 122 : 106;
  }

  function getEquipmentEquippedTextForTown(item) {
    const names = getEquipmentEquippedOwnerNamesForTown(item);
    return names.length ? `${names.join("、")}装備中` : "";
  }

  function getEquipmentEquippedOwnerNamesForTown(item) {
    const itemRef = getEquipmentRefForTown(item);
    if (!itemRef) {
      return [];
    }
    const names = [];
    for (const unitId of ["finald", "ulpes", "rihas", "sushia"]) {
      const equipment = getTownUnitEquipment(unitId);
      if (!equipment) {
        continue;
      }
      const equipped = Object.values(equipment).some((ref) => getEquipmentRefForTown(ref) === itemRef);
      if (equipped) {
        names.push(getTownUnitShortName(unitId));
      }
    }
    return names;
  }

  function getTownUnitEquipment(unitId) {
    const live = getTownLiveUnit(unitId);
    if (live && live.equipment) {
      return live.equipment;
    }
    return game.partyEquipmentById && game.partyEquipmentById[unitId] || null;
  }

  function getTownLiveUnit(unitId) {
    if (unitId === "finald") {
      return player || null;
    }
    return Array.isArray(party) ? party.find((unit) => unit && unit.id === unitId) || null : null;
  }

  function getTownUnitShortName(unitId) {
    if (unitId === "finald") {
      return typeof getPlayerFirstName === "function" ? getPlayerFirstName() : "アルジュナ";
    }
    const live = getTownLiveUnit(unitId);
    if (live && live.name) {
      return live.name;
    }
    const names = {
      ulpes: "ウルペス",
      rihas: "リハス",
      sushia: "スシア",
    };
    return names[unitId] || unitId;
  }

  function getEquipmentShopStatLines(item, maxWidth, maxLines) {
    const summary = getEquipmentItemStatSummaryForTown(item) || "ステータスなし";
    ctx.save();
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const lines = wrapCanvasText(`ステータス: ${summary}`, Math.max(80, maxWidth));
    ctx.restore();
    const limit = Math.max(1, Math.floor(maxLines || 1));
    if (lines.length <= limit) {
      return lines;
    }
    const clipped = lines.slice(0, limit);
    clipped[clipped.length - 1] = `${clipped[clipped.length - 1].replace(/…?$/, "")}…`;
    return clipped;
  }

  function getEquipmentItemStatSummaryForTown(item) {
    if (!item) {
      return "";
    }
    const stats = [];
    for (const [key, value] of Object.entries(item.flatStatBonuses || {})) {
      if (Number.isFinite(value) && value !== 0) {
        stats.push(`${getTownStatLabel(key)}${formatSignedTownNumber(value)}`);
      }
    }
    for (const [key, value] of Object.entries(item.statBonuses || {})) {
      if (Number.isFinite(value) && value !== 0) {
        stats.push(`${getTownStatLabel(key)}${formatTownStatPercent(key, value, true)}`);
      }
    }
    return stats.join(" / ");
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

  function formatRecipeCost(recipe) {
    if (!recipe) {
      return "コスト未設定";
    }
    const parts = [];
    const gold = Math.max(0, Math.floor(
      Number.isFinite(recipe.gold) ? recipe.gold
        : Number.isFinite(recipe.costGold) ? recipe.costGold
          : Number.isFinite(recipe.price) ? recipe.price
            : 0
    ));
    if (gold > 0) {
      parts.push(formatGoldSafe(gold));
    }
    const materials = recipe.materials || recipe.materialCost || {};
    for (const [key, count] of Object.entries(materials)) {
      const material = MATERIAL_DATA && MATERIAL_DATA.materials ? MATERIAL_DATA.materials[key] : null;
      const name = material && material.name ? material.name : key === "kari_dorop" ? "仮素材" : key;
      parts.push(`${name} x${count}`);
    }
    return parts.length ? parts.join(" / ") : "無料";
  }

  function getEquipmentOwnedCount(itemId) {
    if (typeof getEquipmentOwnedCountFromSystem === "function") {
      return getEquipmentOwnedCountFromSystem(itemId);
    }
    const store = game.equipmentInventoryById && typeof game.equipmentInventoryById === "object"
      ? game.equipmentInventoryById
      : {};
    return Math.max(0, Math.floor(Number.isFinite(store[itemId]) ? store[itemId] : 0));
  }

  function getEquipmentUpgradeLevel(itemId) {
    if (typeof getEquipmentUpgradeLevelFromSystem === "function") {
      return getEquipmentUpgradeLevelFromSystem(itemId);
    }
    const store = game.equipmentUpgradeById && typeof game.equipmentUpgradeById === "object"
      ? game.equipmentUpgradeById
      : {};
    return Math.max(0, Math.floor(Number.isFinite(store[itemId]) ? store[itemId] : 0));
  }

  function isEquipmentOwned(item) {
    return Boolean(item && (String(item.id || "").startsWith("default_") || item.material === "製作不可" || getEquipmentOwnedCount(item.id) > 0));
  }

  function getEquipmentSlotName(slotKey) {
    const slots = EQUIPMENT_DATA && Array.isArray(EQUIPMENT_DATA.slots) ? EQUIPMENT_DATA.slots : [];
    const slot = slots.find((entry) => entry && entry.key === slotKey);
    return slot && slot.name ? slot.name : slotKey || "";
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

  function formatSignedTownNumber(value) {
    const numeric = Math.round(Number.isFinite(value) ? value : 0);
    return `${numeric >= 0 ? "+" : ""}${numeric}`;
  }

  function formatTownStatPercent(key, value, signed = true) {
    const raw = Number.isFinite(value) ? value : 0;
    const displayValue = isReductionStatKey(key) ? -raw : raw;
    const percent = Math.round(displayValue * 100);
    return `${signed && percent >= 0 ? "+" : ""}${percent}%`;
  }

  function isReductionStatKey(key) {
    return ["damageResistance", "physicalDamageResistance", "magicDamageResistance"].includes(key);
  }

  function formatSignedTownPercent(value) {
    const percent = Math.round((Number.isFinite(value) ? value : 0) * 100);
    return `${percent >= 0 ? "+" : ""}${percent}%`;
  }

  function getGoldValue() {
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

  function drawQuestTypePanel() {
    const w = Math.min(640, view.w - 32);
    const h = 260;
    const x = (view.w - w) / 2;
    const y = view.h - h - 28;
    drawPanel(x, y, w, h);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("依頼所", x + 26, y + 44);
    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("受ける依頼の種類を選択してください。", x + 26, y + 74);

    const types = getQuestTypes();
    const buttonGap = 16;
    const buttonW = Math.min(250, (w - 52 - buttonGap) / 2);
    const buttonH = 82;
    const startX = x + (w - (buttonW * 2 + buttonGap)) / 2;
    const startY = y + 104;
    for (let i = 0; i < types.length; i += 1) {
      const type = types[i];
      const bx = startX + i * (buttonW + buttonGap);
      const by = startY;
      const totalQuestCount = getQuestsByType(type.key).length;
      const questCount = getAvailableQuestCount(type.key);
      drawQuestButton(bx, by, buttonW, buttonH, type.name, totalQuestCount ? `受注可 ${questCount}件` : "準備中", {
        kind: "selectQuestType",
        type: type.key,
      }, totalQuestCount === 0);
    }

    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${getInteractLabel()}  ストーリー依頼 / ${getBackLabel()}  閉じる`, x + w - 24, y + h - 22);
  }

  function drawQuestListPanel() {
    const type = town.panel.questType || "story";
    const quests = Array.isArray(town.panel.quests) ? town.panel.quests : getQuestsByType(type);
    const w = Math.min(760, view.w - 32);
    const h = Math.min(430, view.h - 56);
    const x = (view.w - w) / 2;
    const y = view.h - h - 28;
    drawPanel(x, y, w, h);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(town.panel.title || "依頼一覧", x + 26, y + 44);

    if (quests.length === 0) {
      town.panel.scroll = 0;
      town.panel.scrollMax = 0;
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("今はこの種類の依頼がありません。", x + 26, y + 84);
    } else {
      const listRect = { x: x + 24, y: y + 76, w: w - 48, h: Math.max(120, h - 146) };
      const buttonH = 82;
      const gap = 12;
      const contentH = quests.length * buttonH + Math.max(0, quests.length - 1) * gap;
      const scrollMax = Math.max(0, contentH - listRect.h);
      const scroll = Math.max(0, Math.min(scrollMax, town.panel.scroll || 0));
      town.panel.scroll = scroll;
      town.panel.scrollMax = scrollMax;
      ctx.save();
      ctx.beginPath();
      ctx.rect(listRect.x, listRect.y, listRect.w, listRect.h);
      ctx.clip();
      for (let i = 0; i < quests.length; i += 1) {
        const quest = quests[i];
        const rowY = listRect.y + i * (buttonH + gap) - scroll;
        if (rowY + buttonH < listRect.y || rowY > listRect.y + listRect.h) {
          continue;
        }
        const statusText = getQuestStatusText(quest);
        drawQuestButton(listRect.x, rowY, listRect.w, buttonH, `${quest.rank || "-"}  ${quest.name}${statusText ? `  [${statusText}]` : ""}`, statusText || quest.summary || "", {
          kind: "selectQuest",
          questId: quest.id,
        });
      }
      ctx.restore();
      drawTownScrollbar(listRect, scroll, scrollMax);
    }

    drawTextButton(x + 24, y + h - 54, 130, 34, "戻る", { kind: "backToQuestTypes" });
    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${getInteractLabel()}  一番上を選択 / ${getBackLabel()}  閉じる`, x + w - 24, y + h - 22);
  }

  function drawQuestDecisionPanel() {
    const quest = getQuestById(town.panel.questId);
    const isAcceptedFreeQuest = Boolean(quest && quest.type === "free" && isQuestAcceptedForTown(quest));
    const isAbandonConfirming = isAcceptedFreeQuest && Boolean(town.panel && town.panel.abandonConfirm);
    const isAcceptLimitReached = Boolean(quest && isFreeQuestAcceptLimitReachedForTown(quest));
    const isReplaceChoosing = Boolean(quest && town.panel && town.panel.replaceQuestId === quest.id);
    const w = Math.min(720, view.w - 32);
    const h = isReplaceChoosing ? 430 : 360;
    const x = (view.w - w) / 2;
    const y = view.h - h - 28;
    drawPanel(x, y, w, h);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("依頼の決定", x + 26, y + 44);

    if (!quest) {
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("依頼データが見つかりません。", x + 26, y + 84);
      drawTextButton(x + 24, y + h - 58, 130, 36, "戻る", { kind: "backToQuestTypes" });
      return;
    }

    ctx.fillStyle = "#ffd86b";
    ctx.font = "800 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(`${quest.rank || "-"}  ${quest.name}`, x + 26, y + 82);

    if (isReplaceChoosing) {
      const messageLines = [
        `フリー依頼は同時に${MAX_ACCEPTED_FREE_QUESTS}つまでです。`,
        `${quest.name}を受けるには、受注中の依頼を1つ破棄してください。`,
      ];
      ctx.fillStyle = "#dce9dc";
      ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      let messageY = y + 118;
      for (const line of messageLines) {
        ctx.fillText(line, x + 26, messageY);
        messageY += 22;
      }
      const abandonQuests = getAcceptedFreeQuestsForReplacePanel();
      const rowX = x + 26;
      const rowW = w - 52;
      const rowH = 54;
      const rowGap = 10;
      const rowStartY = y + 174;
      for (let i = 0; i < abandonQuests.length; i += 1) {
        const entry = abandonQuests[i];
        const rowY = rowStartY + i * (rowH + rowGap);
        drawQuestButton(rowX, rowY, rowW, rowH, `破棄して受注: ${entry.name}`, entry.destination ? `場所: ${entry.destination}` : "場所: -", {
          kind: "replaceFreeQuest",
          abandonQuestId: entry.id,
        });
      }
      if (abandonQuests.length === 0) {
        ctx.fillStyle = "#ffb4a8";
        ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
        ctx.fillText("破棄できる受注中フリー依頼がありません。", rowX, rowStartY + 24);
      }
      drawTextButton(x + 24, y + h - 60, 130, 38, "戻る", { kind: "backToQuestList", type: quest.type });
      drawTextButton(x + w - 214, y + h - 60, 190, 38, "受注をやめる", { kind: "cancelReplaceFreeQuest" }, true);
      ctx.textAlign = "right";
      ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${getBackLabel()}  閉じる`, x + w - 24, y + h - 76);
      return;
    }

    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const fieldLocation = getQuestDestinationName(quest);
    const lines = [
      quest.summary,
      `目的: ${quest.objective || "魔物を全滅させる"}`,
      `魔物情報: ${quest.enemyPreview || "不明"}`,
      fieldLocation ? `出現場所: ${fieldLocation}` : null,
      `推奨: ${quest.recommended || "-"}`,
      `報酬: ${quest.reward || "未定"}`,
    ].filter(Boolean);
    let cursorY = y + 116;
    for (const line of lines) {
      const wrapped = wrapCanvasText(line, w - 52);
      for (const textLine of wrapped) {
        ctx.fillText(textLine, x + 26, cursorY);
        cursorY += 22;
      }
    }
    const statusText = getQuestStatusText(quest);
    if (statusText || town.panel.message) {
      ctx.fillStyle = statusText ? "#ffd86b" : "#ffb4a8";
      ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      const message = isAbandonConfirming && town.panel.message
        ? town.panel.message
        : statusText
          ? `状態: ${statusText}`
          : town.panel.message;
      ctx.fillText(message, x + 26, y + h - 82);
    }

    drawTextButton(x + 24, y + h - 60, 130, 38, "戻る", { kind: "backToQuestList", type: quest.type });
    if (isAbandonConfirming) {
      drawTextButton(x + w - 390, y + h - 60, 160, 38, "やめる", { kind: "cancelAbandonQuest" });
      drawTextButton(x + w - 214, y + h - 60, 190, 38, "破棄する", { kind: "confirmAbandonQuest" }, true);
    } else if (isAcceptedFreeQuest) {
      drawTextButton(x + w - 214, y + h - 60, 190, 38, "受注を破棄", { kind: "promptAbandonQuest" }, true);
    } else if (isAcceptLimitReached) {
      drawTextButton(x + w - 214, y + h - 60, 190, 38, "受注枠を空ける", { kind: "confirmQuest" }, true);
    } else {
      drawTextButton(x + w - 214, y + h - 60, 190, 38, statusText ? "受注不可" : "この依頼を受ける", { kind: "confirmQuest" }, true, Boolean(statusText));
    }
    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${getInteractLabel()}  決定 / ${getBackLabel()}  閉じる`, x + w - 24, y + h - 76);
  }

  function drawQuestButton(x, y, w, h, title, subText, action, disabled = false) {
    town.panel.clickTargets.push({ x, y, w, h, action: disabled ? { kind: "noop" } : action });
    ctx.save();
    ctx.fillStyle = disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.11)";
    ctx.strokeStyle = disabled ? "rgba(255,255,255,0.12)" : "rgba(255,216,107,0.52)";
    ctx.lineWidth = disabled ? 1 : 2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = disabled ? "rgba(247,255,246,0.48)" : "#f7fff6";
    ctx.font = "800 17px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(title, x + 18, y + 30);
    ctx.fillStyle = disabled ? "rgba(220,233,220,0.42)" : "#dce9dc";
    ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const wrapped = wrapCanvasText(subText || "", w - 36);
    for (let i = 0; i < Math.min(2, wrapped.length); i += 1) {
      ctx.fillText(wrapped[i], x + 18, y + 54 + i * 17);
    }
    ctx.restore();
  }

  function drawTextButton(x, y, w, h, label, action, primary = false, disabled = false) {
    town.panel.clickTargets.push({ x, y, w, h, action: disabled ? { kind: "noop" } : action });
    ctx.save();
    ctx.fillStyle = disabled ? "rgba(255,255,255,0.045)" : primary ? "rgba(255,216,107,0.24)" : "rgba(255,255,255,0.1)";
    ctx.strokeStyle = disabled ? "rgba(255,255,255,0.12)" : primary ? "#ffd86b" : "rgba(255,255,255,0.24)";
    ctx.lineWidth = primary ? 2 : 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = disabled ? "rgba(247,255,246,0.42)" : primary ? "#fff6c2" : "#f7fff6";
    ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    ctx.restore();
  }

  function drawBattleGuidePanel() {
    const w = Math.min(940, view.w - 32);
    const h = Math.min(660, view.h - 32);
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;
    const compact = w < 640 || h < 600;
    const titleSize = compact ? 22 : 26;
    const sectionSize = compact ? 15 : 17;
    const textSize = compact ? 12 : 14;
    const lineHeight = compact ? 17 : 21;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.44)";
    ctx.fillRect(0, 0, view.w, view.h);
    drawPanel(x, y, w, h);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f7fff6";
    ctx.font = `800 ${titleSize}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
    ctx.fillText(town.panel.title, x + 26, y + 44);

    let cursorY = y + (compact ? 76 : 86);
    const contentW = w - 52;
    for (const section of town.panel.sections) {
      ctx.fillStyle = "#ffd86b";
      ctx.font = `800 ${sectionSize}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      ctx.fillText(section.title, x + 26, cursorY);
      cursorY += compact ? 22 : 27;

      ctx.fillStyle = "#dce9dc";
      ctx.font = `700 ${textSize}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      for (const line of section.lines) {
        const wrapped = wrapCanvasText(line, contentW);
        for (const textLine of wrapped) {
          if (cursorY > y + h - 40) {
            break;
          }
          ctx.fillText(textLine, x + 36, cursorY);
          cursorY += lineHeight;
        }
      }
      cursorY += compact ? 8 : 12;
    }

    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    const actionLabel = town.panel.startsInField ? "依頼を受ける" : "戦闘開始";
    ctx.fillText(`${getInteractLabel()} で${actionLabel}`, x + w - 24, y + h - 20);
    ctx.restore();
  }

  function drawProfileSetup() {
    updateProfileNameInput();
    profileClickTargets.length = 0;
    const w = Math.min(620, view.w - 32);
    const h = Math.min(430, view.h - 32);
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(0, 0, view.w, view.h);
    drawPanel(x, y, w, h);

    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("主人公設定", x + w / 2, y + 48);

    if (playerProfile.step === "gender") {
      drawProfilePrompt(x, y, w, "見た目を選択してください");
      drawProfileAppearanceChoices(x, y + 142, w);
    } else if (playerProfile.step === "name") {
      drawProfilePrompt(x, y, w, "名前を入力してください");
      ctx.fillStyle = "#cfe1d0";
      ctx.font = "700 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("姓名を入力してください。各8文字まで。未入力ならアルジュナ・フィナルドになります。", x + w / 2, y + 132);
      const inputRects = getProfileNameInputRects();
      ctx.fillStyle = "#f7fff6";
      ctx.font = "800 22px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("・", inputRects.separator.x, inputRects.separator.y + 1);
      ctx.fillStyle = "rgba(247,255,246,0.7)";
      ctx.font = "700 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("名", inputRects.first.x + inputRects.first.w / 2, inputRects.first.y - 9);
      ctx.fillText("姓", inputRects.last.x + inputRects.last.w / 2, inputRects.last.y - 9);
      drawProfileButton(x + w / 2 - 100, y + 255, 200, 46, "決定", false, confirmProfileName);
    } else if (playerProfile.step === "pronoun") {
      drawProfilePrompt(x, y, w, "一人称を入力してください");
      ctx.fillStyle = "#cfe1d0";
      ctx.font = "700 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("8文字まで。未入力なら「俺」になります。", x + w / 2, y + 132);
      drawProfileButton(x + w / 2 - 100, y + 255, 200, 46, "決定", false, () => selectProfilePronoun(playerProfile.pronoun));
    }

    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "rgba(247,255,246,0.72)";
    ctx.fillText(playerProfile.step === "name" || playerProfile.step === "pronoun" ? "Enter / 決定" : "数字キー / クリック", x + w - 24, y + h - 24);
    ctx.restore();
  }

  function drawProfilePrompt(x, y, w, text) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 22px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, x + w / 2, y + 116);
  }

  function drawProfileChoices(panelX, startY, panelW, choices, columns) {
    const gap = 12;
    const buttonW = Math.min(150, (panelW - 72 - gap * (columns - 1)) / columns);
    const buttonH = 48;
    const totalW = buttonW * columns + gap * (columns - 1);
    const x0 = panelX + (panelW - totalW) / 2;
    for (let i = 0; i < choices.length; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const x = x0 + col * (buttonW + gap);
      const y = startY + row * (buttonH + 14);
      drawProfileButton(x, y, buttonW, buttonH, choices[i].label, choices[i].selected, choices[i].action);
    }
  }

  function drawProfileAppearanceChoices(panelX, startY, panelW) {
    const choices = [
      { label: "1  見た目A", gender: "男の子", color: COLORS.player },
      { label: "2  見た目B", gender: "女の子", color: "#ff93c8" },
    ];
    const gap = 18;
    const buttonW = Math.min(190, (panelW - 78 - gap) / 2);
    const buttonH = 112;
    const totalW = buttonW * 2 + gap;
    const x0 = panelX + (panelW - totalW) / 2;
    for (let i = 0; i < choices.length; i += 1) {
      const choice = choices[i];
      const x = x0 + i * (buttonW + gap);
      const y = startY;
      const selected = playerProfile.gender === choice.gender;
      profileClickTargets.push({ x, y, w: buttonW, h: buttonH, action: () => selectProfileGender(choice.gender) });
      ctx.fillStyle = selected ? "rgba(184,140,255,0.55)" : "rgba(255,255,255,0.1)";
      ctx.strokeStyle = selected ? "#f7fff6" : "rgba(255,255,255,0.18)";
      ctx.lineWidth = selected ? 3 : 1;
      roundRect(x, y, buttonW, buttonH, 8);
      ctx.fill();
      ctx.stroke();

      const cx = x + buttonW / 2;
      const cy = y + 50;
      const image = profileAppearanceImages[choice.gender === "女の子" ? "female" : "male"];
      if (isTownImageReady(image)) {
        const imageH = 72;
        const imageW = imageH * image.naturalWidth / image.naturalHeight;
        const previousSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, cx - imageW / 2, cy - imageH / 2, imageW, imageH);
        ctx.imageSmoothingEnabled = previousSmoothing;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, TAU);
        ctx.fill();
        ctx.fillStyle = choice.color;
        ctx.beginPath();
        ctx.arc(cx, cy, 17, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(17,23,20,0.42)";
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 4, 2.5, 0, TAU);
        ctx.arc(cx + 6, cy - 4, 2.5, 0, TAU);
        ctx.fill();
      }

      ctx.fillStyle = "#f7fff6";
      ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(choice.label, cx, y + 86);
    }
  }

  function drawProfileButton(x, y, w, h, label, selected, action) {
    profileClickTargets.push({ x, y, w, h, action });
    ctx.fillStyle = selected ? "rgba(184,140,255,0.55)" : "rgba(255,255,255,0.1)";
    ctx.strokeStyle = selected ? "#f7fff6" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = selected ? 3 : 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  }

  function drawTownStoryDialogue() {
    if (!town.story) {
      return;
    }
    const entry = town.story.lines[town.story.index];
    if (!entry) {
      return;
    }

    const w = Math.min(920, view.w - 28);
    const x = (view.w - w) / 2;
    const fontSize = view.w < 560 ? 15 : 17;
    const lineHeight = fontSize + 10;
    const textFont = `700 ${fontSize}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
    ctx.font = textFont;
    const textLines = wrapCanvasText(entry.text, w - 58);
    const h = Math.min(view.h - 28, Math.max(154, 100 + textLines.length * lineHeight));
    const y = Math.max(14, view.h - h - 22);
    const speaker = entry.speaker || "システム";

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(0, 0, view.w, view.h);

    drawPanel(x, y, w, h);
    ctx.fillStyle = "rgba(247,255,246,0.96)";
    roundRect(x + 22, y + 18, Math.min(210, Math.max(118, ctx.measureText(speaker).width + 42)), 36, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(18,24,20,0.78)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#111714";
    ctx.font = "800 16px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(speaker, x + 42, y + 42);

    ctx.font = textFont;
    ctx.fillStyle = "#f7fff6";
    for (let i = 0; i < textLines.length; i += 1) {
      ctx.fillText(textLines[i], x + 30, y + 82 + i * lineHeight);
    }

    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "rgba(247,255,246,0.78)";
    ctx.fillText(`${town.story.index + 1}/${town.story.lines.length}`, x + w - 30, y + 34);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(getInteractLabel(), x + w - 30, y + h - 22);
    ctx.restore();
  }

  function wrapCanvasText(text, maxWidth) {
    const lines = [];
    let line = "";
    for (const char of Array.from(text)) {
      if (char === "\n") {
        lines.push(line);
        line = "";
        continue;
      }
      const next = line + char;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = next;
      }
    }
    if (line) {
      lines.push(line);
    }
    return lines.length ? lines : [""];
  }

  function drawFittedTownText(text, x, y, maxWidth, weight, maxSize, minSize, color, align = "left") {
    const value = String(text || "");
    let size = maxSize;
    do {
      ctx.font = `${weight} ${size}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      if (ctx.measureText(value).width <= maxWidth || size <= minSize) {
        break;
      }
      size -= 1;
    } while (size > minSize);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(value, x, y);
  }

  function drawTownScrollbar(rect, scroll, maxScroll, options = {}) {
    if (!rect || !maxScroll || !town.panel) {
      return;
    }
    const scrollState = options.scrollState || town.panel;
    const valueKey = options.valueKey || "scroll";
    const maxKey = options.maxKey || "scrollMax";
    const trackW = 5;
    const trackX = rect.x + rect.w - trackW - 2;
    const trackY = rect.y + 2;
    const trackH = rect.h - 4;
    const thumbH = Math.max(28, trackH * (trackH / (trackH + maxScroll)));
    const thumbY = trackY + (trackH - thumbH) * Math.max(0, Math.min(1, scroll / maxScroll));
    const track = { x: trackX, y: trackY, w: trackW, h: trackH };
    const knob = { x: trackX, y: thumbY, w: trackW, h: thumbH };
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    roundRect(trackX, trackY, trackW, trackH, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(255,216,107,0.72)";
    roundRect(trackX, thumbY, trackW, thumbH, 4);
    ctx.fill();
    ctx.restore();
    town.panel.clickTargets.push({
      x: trackX - 8,
      y: trackY,
      w: trackW + 16,
      h: trackH,
      action: {
        kind: "startScrollbarDrag",
        scrollState,
        valueKey,
        maxKey,
        track,
        knob,
      },
    });
  }

  function drawPanel(x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(10,16,13,0.88)";
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

    return {
      drawTown,
      drawProfileSetup,
      drawTownStoryDialogue,
      drawTownQuestNoticePopup,
      screenToTownPoint,
    };
  };
})();
