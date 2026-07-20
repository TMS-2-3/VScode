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
      EQUIPMENT_DATA,
      MATERIAL_DATA,
      itemSystem,
      tileMapSystem,
      getEquipmentInstancesByItemId,
      getEquipmentItemRef,
      getEquipmentBaseItemId,
      getEquipmentOwnedCount: getEquipmentOwnedCountFromSystem,
      getEquipmentUpgradeLevel: getEquipmentUpgradeLevelFromSystem,
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
      getQuestTypes,
      getQuestsByType,
      getQuestById,
      getKeybindLabel,
    } = context;

  function getActionLabel(actionId, fallback) {
    return typeof getKeybindLabel === "function" ? getKeybindLabel(actionId) || fallback : fallback;
  }

  function getInteractLabel() {
    return getActionLabel("field.interact", "E");
  }

  function getBackLabel() {
    return getActionLabel("common.menuBack", "Esc");
  }

  const EQUIPMENT_RANK_FILTERS = ["D", "C", "B", "A", "S"];
  const EQUIPMENT_SHOP_WEAPON_TYPES = ["片手剣", "両手剣", "拳具", "棒具", "杖", "魔導書", "楽器"];
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
  const TOWN_TILE_CHARACTER_FOOT_OFFSET_Y = 5;
  const townWalkImages = createTownWalkImages();
  const profileAppearanceImages = createProfileAppearanceImages();

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

  function getTownWalkImage(unitId, facing, frame) {
    const imageKey = unitId === "finald"
      ? playerProfile.gender === "女の子" ? "arjunaFemale" : "arjunaMale"
      : unitId;
    const direction = TOWN_WALK_DIRECTIONS.includes(facing) ? facing : "down";
    const normalizedFrame = TOWN_WALK_FRAMES.includes(frame) ? frame : 1;
    return townWalkImages[imageKey] && townWalkImages[imageKey][direction] && townWalkImages[imageKey][direction][normalizedFrame] || null;
  }

  function isTownImageReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
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

    drawTownHud();
    drawTownPanel();
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
    if (worldX < 0 || worldY < 0 || worldX > TOWN_WIDTH || worldY > TOWN_HEIGHT) {
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
        useCache: true,
        viewport: getTownVisibleWorldViewport(transform),
      });
    }
    ctx.fillStyle = "#47784f";
    ctx.fillRect(0, 0, Math.max(1, mapSize.w || TOWN_WIDTH), Math.max(1, mapSize.h || TOWN_HEIGHT));
    const viewport = getTownTileMapViewport(transform);
    tileMapSystem.drawTileMap(ctx, map, {
      drawFallback: true,
      includeDefaultTile: true,
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
    if (game && game.settings && game.settings.mapDebugMode === true && typeof tileMapSystem.drawDebugGrid === "function") {
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
    if (!town.meetingDone) {
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
    if (!town.meetingDone) {
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
    return actors;
  }

  function drawTownArgumentMarks() {
    if (!playerProfile.done || town.meetingDone) {
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
    if (drawTownCharacterSprite(actor)) {
      return;
    }
    drawTownNpc(actor.x, actor.y, actor.color, actor.label);
  }

  function drawTownCharacterSprite(actor) {
    const image = getTownWalkImage(actor.id, actor.facing, actor.walkFrame);
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

  function drawTownHud() {
    drawPanel(18, 18, Math.min(430, view.w - 36), 80);
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 19px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("はじまりの町", 34, 47);
    ctx.font = "13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffd86b";
    const interactLabel = getInteractLabel();
    const moveText = getTownTileMap() ? "WASDで1マス移動" : "WASDで移動";
    const target = town.interaction ? `${town.interaction.name}: ${interactLabel}で利用` : `${moveText} / 施設の近くで${interactLabel}`;
    ctx.fillText(target, 34, 73);
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
    const w = Math.min(900, Math.max(320, view.w - 48));
    const h = Math.min(420, Math.max(260, view.h - 72));
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;
    const cost = Number.isFinite(town.panel.cost) ? town.panel.cost : 100;
    const restLocked = Boolean(game.innRestUsedUntilBattle);
    const canPay = getGoldValue() >= cost;
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
    ctx.fillText("HP/MPと戦闘不能、簡易的な状態異常を回復します。", x + 26, y + 112);
    if (town.panel.message) {
      ctx.fillStyle = isTownPanelErrorMessage(town.panel.message) ? "#ffb4a8" : "#ffd86b";
      ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText(town.panel.message, x + 26, y + 148);
    }

    drawTextButton(x + 26, y + h - 60, 132, 38, "閉じる", { kind: "close" });
    drawTextButton(x + w - 190, y + h - 60, 164, 38, "泊まる", { kind: "confirmInnRest" }, true, restLocked || !canPay);
    drawPanelFooter(x, y, w, h);
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
      const listRect = { x: x + 24, y: y + 78, w: w - 48, h: Math.max(120, h - 158) };
      const rowH = 86;
      const gap = 10;
      const contentH = items.length * rowH + Math.max(0, items.length - 1) * gap;
      const scrollMax = Math.max(0, contentH - listRect.h);
      const scroll = Math.max(0, Math.min(scrollMax, town.panel.scroll || 0));
      town.panel.scroll = scroll;
      town.panel.scrollMax = scrollMax;
      ctx.save();
      ctx.beginPath();
      ctx.rect(listRect.x, listRect.y, listRect.w, listRect.h);
      ctx.clip();
      for (let i = 0; i < items.length; i += 1) {
        const rowY = listRect.y + i * (rowH + gap) - scroll;
        if (rowY + rowH < listRect.y || rowY > listRect.y + listRect.h) {
          continue;
        }
        drawShopItemRow(items[i], listRect.x, rowY, listRect.w, rowH);
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
    const filterY = y + 110;
    const filterH = drawEquipmentShopFilters(x + 26, filterY, w - 52, shopKind);
    const listTop = filterY + filterH + 10;

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
  }

  function drawEquipmentShopFilters(x, y, w, shopKind) {
    const filters = ensureEquipmentShopFiltersForTown();
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
    drawFilterChip(x + w - 86, y - 8, 86, 24, "条件クリア", false, { kind: "clearEquipmentShopFilters" });
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
      const questCount = getQuestsByType(type.key).length;
      drawQuestButton(bx, by, buttonW, buttonH, type.name, questCount ? `${questCount}件` : "準備中", {
        kind: "selectQuestType",
        type: type.key,
      }, questCount === 0);
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
        drawQuestButton(listRect.x, rowY, listRect.w, buttonH, `${quest.rank || "-"}  ${quest.name}`, quest.summary || "", {
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
    const w = Math.min(720, view.w - 32);
    const h = 360;
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
    ctx.fillStyle = "#dce9dc";
    ctx.font = "700 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const lines = [
      quest.summary,
      `目的: ${quest.objective || "敵を全滅させる"}`,
      `敵情報: ${quest.enemyPreview || "不明"}`,
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

    drawTextButton(x + 24, y + h - 60, 130, 38, "戻る", { kind: "backToQuestList", type: quest.type });
    drawTextButton(x + w - 214, y + h - 60, 190, 38, "この依頼を受ける", { kind: "confirmQuest" }, true);
    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${getInteractLabel()}  決定 / ${getBackLabel()}  閉じる`, x + w - 24, y + h - 76);
  }

  function drawQuestButton(x, y, w, h, title, subText, action, disabled = false) {
    town.panel.clickTargets.push({ x, y, w, h, action });
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
    ctx.fillText(`${getInteractLabel()} で戦闘開始`, x + w - 24, y + h - 20);
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
      screenToTownPoint,
    };
  };
})();
