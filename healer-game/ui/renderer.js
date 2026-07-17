(() => {
  "use strict";

  window.createHealerRenderer = function createHealerRenderer(context) {
    const {
      canvasCtx: ctx,
      TAU,
      view,
      input,
      game,
      playerProfile,
      player,
      party,
      enemies,
      projectiles,
      telegraphs,
      areas,
      effects,
      COLORS,
      MOOD_BASELINE,
      BASE_CRIT_CHANCE,
      BASE_CRIT_DAMAGE_RATE,
      STATUS_FULL_NAMES,
      CHARACTER_DEFS,
      SKILL_DATA,
      PASSIVE_DATA,
      EQUIPMENT_DATA,
      MATERIAL_DATA,
      LOADOUT_CONFIG,
      skillSystem,
      itemSystem,
      saveSystem,
      getGold,
      formatGold,
      getBattleBounds,
      updateTelegraphDynamic,
      battlePx,
      clamp,
      isFieldUnit,
      getFieldPartyMembers,
      getSupportOrigin,
      getEffectiveAttack,
      getEffectiveMagic,
      getEffectiveDefense,
      getEffectiveMagicDefense,
      getEffectiveStat,
      getEffectiveGuardChance,
      getGuardDamageReductionRate,
      getEffectiveCritChance,
      getEffectiveCritDamageRate,
      getHpRegenRate,
      getMpRegenRate,
      normalizeEquipment,
      resolveEquipmentItem,
      getEquipmentInstancesByItemId,
      getEquipmentItemRef,
      getEquipmentBaseItemId,
      getEquipmentOwnedCount,
      getEquipmentUpgradeLevel,
      getEquippedItems,
      getEquippedSlotItem,
      getActiveSetEffects,
      canEquipItem,
      getActiveSlotLimit,
      getDefaultLoadout,
      normalizeLoadout,
      isSkillOwned,
      isPassiveOwned,
      getSkillLevel,
      getPlayerFirstName,
      getPlayerFullName,
      KEYBINDS,
      getKeybinds,
      getKeybindLabel,
    } = context;

    if (!window.createHealerTownRenderer) {
      throw new Error("createHealerTownRenderer must be loaded before ui/renderer.js");
    }
    if (!window.createHealerStatusRenderer) {
      throw new Error("createHealerStatusRenderer must be loaded before ui/renderer.js");
    }
    if (!window.createHealerStatPresenter) {
      throw new Error("createHealerStatPresenter must be loaded before ui/renderer.js");
    }
    const statPresenter = window.createHealerStatPresenter(context);
    const townRenderer = window.createHealerTownRenderer(context);
    const statusRenderer = window.createHealerStatusRenderer({ ...context, statPresenter });
    const tooltipText = window.createHealerTooltipText(context);
    const equipmentUnitOrder = ["finald", "ulpes", "rihas", "sushia"];
    const BATTLE_WALK_DIRECTIONS = ["down", "left", "right", "up"];
    const BATTLE_WALK_FRAMES = [1, 2, 3];
    const BATTLE_WALK_SEQUENCE = [2, 1, 3, 1];
    const BATTLE_WALK_FRAME_INTERVAL = 0.16;
    const battleCharacterSpritePaths = {
      finaldMale: "arjuna_man_img",
      finaldFemale: "arjuna_woman_img",
      ulpes: "ulpes_img",
      rihas: "rihas_img",
      sushia: "sushia_img",
    };
    const equipmentCharacterArtPaths = {
      finaldMale: "img/char/arjuna_man_img/default/front.png",
      finaldFemale: "img/char/arjuna_woman_img/default/front.png",
      ulpes: "img/char/ulpes_img/default/front.png",
      rihas: "img/char/rihas_img/default/front.png",
      sushia: "img/char/sushia_img/default/front.png",
    };
    const battleCharacterSprites = createBattleCharacterSprites();
    const battleWalkRenderCache = new WeakMap();
    const battleWalkWarmQueue = [];
    let battleWalkWarmScheduled = false;
    const battleSpriteStates = new Map();
    const equipmentCharacterArtImages = createEquipmentCharacterArtImages();
    const equipmentSlotLayout = {
      left: ["head", "body", "legs"],
      right: ["hands", "feet", "accessory"],
      weapon: "weapon",
    };
    const keybindTools = KEYBINDS || window.HEALER_KEYBINDS || null;
    const equipmentTooltipTargets = [];
    const SKILL_LEVEL_ROMAN = ["", "I", "II", "III", "IV", "V"];

  function createEquipmentCharacterArtImages() {
    const images = {};
    if (typeof Image !== "function") {
      return images;
    }
    for (const [key, imagePath] of Object.entries(equipmentCharacterArtPaths)) {
      const image = new Image();
      image.src = imagePath;
      prepareSystemImage(image);
      images[key] = image;
    }
    return images;
  }

  function createBattleCharacterSprites() {
    const images = {};
    if (typeof Image !== "function") {
      return images;
    }
    for (const [unitKey, spritePath] of Object.entries(battleCharacterSpritePaths)) {
      images[unitKey] = {};
      for (const direction of BATTLE_WALK_DIRECTIONS) {
        images[unitKey][direction] = {};
        for (const frame of BATTLE_WALK_FRAMES) {
          const image = new Image();
          image.src = `img/char/${spritePath}/walk/${direction}_${String(frame).padStart(2, "0")}.png`;
          prepareBattleWalkImage(image);
          images[unitKey][direction][frame] = image;
        }
      }
    }
    return images;
  }

  function getEquipmentCharacterArtImage(unit) {
    if (!unit) {
      return null;
    }
    const key = unit.id === "finald"
      ? playerProfile.gender === "女の子" ? "finaldFemale" : "finaldMale"
      : unit.id;
    return equipmentCharacterArtImages[key] || null;
  }

  function isSystemImageReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
  }

  function prepareSystemImage(image) {
    if (!image) {
      return;
    }
    image.decoding = "async";
    if (typeof image.decode !== "function") {
      return;
    }
    const decode = () => {
      image.decode().catch(() => {});
    };
    if (image.complete) {
      decode();
    } else if (typeof image.addEventListener === "function") {
      image.addEventListener("load", decode, { once: true });
    }
  }

  function prepareBattleWalkImage(image) {
    if (!image) {
      return;
    }
    image.decoding = "async";
    const warmCache = () => {
      if (isSystemImageReady(image)) {
        queueBattleWalkWarm(image);
      }
    };
    if (typeof image.decode === "function") {
      const decodeAndWarm = () => {
        image.decode().catch(() => {}).then(warmCache);
      };
      if (image.complete) {
        decodeAndWarm();
      } else if (typeof image.addEventListener === "function") {
        image.addEventListener("load", decodeAndWarm, { once: true });
      }
      return;
    }
    if (image.complete) {
      warmCache();
    } else if (typeof image.addEventListener === "function") {
      image.addEventListener("load", warmCache, { once: true });
    }
  }

  function queueBattleWalkWarm(image) {
    if (!image || battleWalkRenderCache.has(image) || battleWalkWarmQueue.includes(image)) {
      return;
    }
    battleWalkWarmQueue.push(image);
    scheduleBattleWalkWarm();
  }

  function scheduleBattleWalkWarm() {
    if (battleWalkWarmScheduled) {
      return;
    }
    battleWalkWarmScheduled = true;
    const schedule = typeof requestAnimationFrame === "function"
      ? requestAnimationFrame
      : (callback) => setTimeout(callback, 16);
    schedule(processBattleWalkWarmQueue);
  }

  function processBattleWalkWarmQueue() {
    battleWalkWarmScheduled = false;
    const startedAt = performance.now();
    let processed = 0;
    while (battleWalkWarmQueue.length && processed < 2 && performance.now() - startedAt < 4) {
      const image = battleWalkWarmQueue.shift();
      if (isSystemImageReady(image)) {
        getBattleWalkRenderImage(image);
      }
      processed += 1;
    }
    if (battleWalkWarmQueue.length) {
      scheduleBattleWalkWarm();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, view.w, view.h);
    if (game.state === "title") {
      drawTitleScreen();
      return;
    }
    if (game.state === "town") {
      townRenderer.drawTown();
      drawEffects();
      if (!playerProfile.done) {
        townRenderer.drawProfileSetup();
      } else {
        townRenderer.drawTownStoryDialogue();
      }
      drawSystemMenu();
      return;
    }
    drawFloor();
    drawAreas();
    drawTelegraphs();
    drawPlayerAimPreview();
    drawSupportCastPreview();
    drawProjectiles();
    drawUnits();
    drawFloatingArjuna();
    drawEffects();
    statusRenderer.drawHud();
    drawSystemMenu();
    drawResultOverlay();
  }

  function drawTitleScreen() {
    game.titleTargets = [];
    getSystemMenu().targets.length = 0;
    ctx.save();
    const sky = ctx.createLinearGradient(0, 0, 0, view.h);
    sky.addColorStop(0, "#101f2a");
    sky.addColorStop(0.54, "#234537");
    sky.addColorStop(1, "#17261d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, view.w, view.h);

    drawTitleForestLayer(view.h * 0.56, "#13271b", 46, 0.6);
    drawTitleForestLayer(view.h * 0.64, "#0f1f16", 62, 0.9);
    drawTitleGround();

    const centerX = view.w / 2;
    const titleY = Math.max(118, view.h * 0.28);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(8, 12, 10, 0.32)";
    ctx.font = "900 58px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("Healer Game", centerX + 3, titleY + 4);
    ctx.fillStyle = "#f7fff6";
    ctx.fillText("Healer Game", centerX, titleY);

    ctx.font = "800 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "rgba(247,255,246,0.82)";
    ctx.fillText("まだ名もない旅の、最初の一歩", centerX, titleY + 48);

    const buttonW = Math.min(260, Math.max(180, view.w * 0.28));
    const buttonH = 58;
    const buttonX = centerX - buttonW / 2;
    const buttonY = Math.min(view.h - 120, Math.max(titleY + 112, view.h * 0.58));
    drawTitleButton(buttonX, buttonY, buttonW, buttonH, "始める", "startGame", true);
    drawTitleButton(buttonX, buttonY + buttonH + 16, buttonW, 48, "ロード", "openTitleLoad", false);
    ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "rgba(247,255,246,0.72)";
    ctx.fillText("Enter / Space でも開始", centerX, buttonY + buttonH + 88);
    if (game.titleLoadOpen) {
      drawTitleLoadPanel();
    }
    ctx.restore();
  }

  function drawTitleButton(x, y, w, h, label, action, primary) {
    const hovered = input.mouse.x >= x && input.mouse.x <= x + w
      && input.mouse.y >= y && input.mouse.y <= y + h;
    ctx.save();
    ctx.fillStyle = primary
      ? hovered ? "#fff2b7" : "#ffd66b"
      : hovered ? "rgba(247,255,246,0.96)" : "rgba(247,255,246,0.84)";
    ctx.strokeStyle = primary
      ? hovered ? "#fff8d8" : "rgba(255,255,255,0.45)"
      : hovered ? "rgba(255,213,107,0.9)" : "rgba(255,255,255,0.36)";
    ctx.lineWidth = primary ? 2 : 1.5;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = `${primary ? "900 22px" : "850 18px"} 'Segoe UI', 'Yu Gothic UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2);
    ctx.restore();
    game.titleTargets.push({ action, x, y, w, h });
  }

  function drawTitleLoadPanel() {
    const saves = saveSystem && typeof saveSystem.listSaves === "function" ? saveSystem.listSaves() : [];
    const w = Math.min(560, view.w - 42);
    const rowH = 54;
    const gap = 8;
    const visibleRows = Math.min(5, Math.max(1, saves.length));
    const h = 154 + visibleRows * rowH + Math.max(0, visibleRows - 1) * gap;
    const x = (view.w - w) / 2;
    const y = Math.max(36, (view.h - h) / 2);
    const listRect = { x: x + 24, y: y + 122, w: w - 48, h: h - 146 };
    const contentH = saves.length ? saves.length * rowH + Math.max(0, saves.length - 1) * gap : 0;
    game.titleLoadScrollMax = Math.max(0, contentH - listRect.h);
    game.titleLoadScroll = Math.max(0, Math.min(game.titleLoadScrollMax, Number.isFinite(game.titleLoadScroll) ? game.titleLoadScroll : 0));
    ctx.save();
    ctx.fillStyle = "rgba(10,16,13,0.88)";
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.fillStyle = "rgba(247,255,246,0.97)";
    ctx.strokeStyle = "rgba(255,213,107,0.55)";
    ctx.lineWidth = 1.4;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#102018";
    ctx.font = "900 22px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("ロード", x + 24, y + 22);
    drawTitleCloseButton(x + w - 46, y + 18);
    drawTitleLoadSmallButton(x + 24, y + 60, 118, 32, "ファイル読込", "importTitleSaveFile");

    if (game.titleLoadMessage) {
      drawFittedSystemText(game.titleLoadMessage, x + 156, y + 76, w - 180, 800, 13, 10, "#315340", "left", "middle");
    }

    if (!saves.length) {
      ctx.fillStyle = "#63706a";
      ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("セーブデータはまだありません。", listRect.x, listRect.y + 10);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(listRect.x, listRect.y, listRect.w, listRect.h);
    ctx.clip();
    for (let i = 0; i < saves.length; i += 1) {
      const rowY = listRect.y + i * (rowH + gap) - game.titleLoadScroll;
      if (rowY + rowH < listRect.y || rowY > listRect.y + listRect.h) {
        continue;
      }
      drawTitleLoadRow(listRect.x, rowY, listRect.w, rowH, saves[i]);
    }
    ctx.restore();
    drawSettingsScrollbar(listRect, game.titleLoadScroll, game.titleLoadScrollMax, {
      scrollState: game,
      valueKey: "titleLoadScroll",
      maxKey: "titleLoadScrollMax",
    });
    ctx.restore();
  }

  function drawTitleLoadRow(x, y, w, h, save) {
    const hovered = input.mouse.x >= x && input.mouse.x <= x + w
      && input.mouse.y >= y && input.mouse.y <= y + h;
    ctx.save();
    ctx.fillStyle = hovered ? "rgba(255,246,207,0.96)" : "rgba(255,255,255,0.86)";
    ctx.strokeStyle = hovered ? "rgba(180,129,32,0.48)" : "rgba(16,32,24,0.14)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    const deleteSize = 34;
    const deleteX = x + w - deleteSize - 10;
    const deleteY = y + (h - deleteSize) / 2;
    drawFittedSystemText(save.name || "セーブデータ", x + 16, y + 18, w - 76, 900, 15, 10, "#102018", "left", "middle");
    drawFittedSystemText(save.savedAtText || "", x + 16, y + 38, w - 76, 700, 11, 9, "#63706a", "left", "middle");
    ctx.restore();
    game.titleTargets.push({ action: "loadTitleSave", saveId: save.id, x, y, w, h });
    drawTitleDeleteSaveButton(deleteX, deleteY, deleteSize, save.id);
  }

  function drawTitleDeleteSaveButton(x, y, size, saveId) {
    const hovered = input.mouse.x >= x && input.mouse.x <= x + size
      && input.mouse.y >= y && input.mouse.y <= y + size;
    ctx.save();
    ctx.fillStyle = hovered ? "rgba(214,53,44,0.2)" : "rgba(214,53,44,0.08)";
    ctx.strokeStyle = hovered ? "rgba(214,53,44,0.9)" : "rgba(214,53,44,0.52)";
    ctx.lineWidth = hovered ? 1.6 : 1.2;
    roundRect(x, y, size, size, 7);
    ctx.fill();
    ctx.stroke();

    const cx = x + size / 2;
    const cy = y + size / 2 + 1;
    ctx.strokeStyle = "#d6352c";
    ctx.fillStyle = "#d6352c";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 8);
    ctx.lineTo(cx + 8, cy - 8);
    ctx.moveTo(cx - 3, cy - 11);
    ctx.lineTo(cx + 3, cy - 11);
    ctx.stroke();
    roundRect(cx - 6, cy - 5, 12, 14, 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 2);
    ctx.lineTo(cx - 2, cy + 6);
    ctx.moveTo(cx + 2, cy - 2);
    ctx.lineTo(cx + 2, cy + 6);
    ctx.stroke();
    ctx.restore();
    game.titleTargets.push({ action: "deleteTitleSave", saveId, x, y, w: size, h: size });
  }

  function drawTitleLoadSmallButton(x, y, w, h, label, action) {
    const hovered = input.mouse.x >= x && input.mouse.x <= x + w
      && input.mouse.y >= y && input.mouse.y <= y + h;
    ctx.save();
    ctx.fillStyle = hovered ? "#26352e" : "#102018";
    ctx.strokeStyle = hovered ? "rgba(255,213,107,0.85)" : "rgba(16,32,24,0.28)";
    ctx.lineWidth = hovered ? 1.5 : 1;
    roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();
    drawFittedSystemText(label, x + w / 2, y + h / 2, w - 10, 800, 12, 8, "#f7fff6", "center", "middle");
    ctx.restore();
    game.titleTargets.push({ action, x, y, w, h });
  }

  function drawTitleCloseButton(x, y) {
    const size = 28;
    const hovered = input.mouse.x >= x && input.mouse.x <= x + size
      && input.mouse.y >= y && input.mouse.y <= y + size;
    ctx.save();
    ctx.fillStyle = hovered ? "rgba(141,63,54,0.18)" : "rgba(16,32,24,0.08)";
    ctx.strokeStyle = "rgba(16,32,24,0.22)";
    ctx.lineWidth = 1;
    roundRect(x, y, size, size, 7);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#102018";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 9);
    ctx.lineTo(x + size - 9, y + size - 9);
    ctx.moveTo(x + size - 9, y + 9);
    ctx.lineTo(x + 9, y + size - 9);
    ctx.stroke();
    ctx.restore();
    game.titleTargets.push({ action: "closeTitleLoad", x, y, w: size, h: size });
  }

  function drawTitleForestLayer(baseY, color, step, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, view.h);
    ctx.lineTo(0, baseY);
    for (let x = 0; x <= view.w + step; x += step) {
      const peak = baseY - 40 - ((x / step) % 3) * 18;
      ctx.lineTo(x + step * 0.5, peak);
      ctx.lineTo(x + step, baseY);
    }
    ctx.lineTo(view.w, view.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawTitleGround() {
    const y = view.h * 0.72;
    ctx.fillStyle = "#203b27";
    ctx.fillRect(0, y, view.w, view.h - y);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 97) % Math.max(1, view.w);
      const gy = y + 24 + (i % 5) * 22;
      ctx.fillRect(x, gy, 34 + (i % 4) * 12, 2);
    }
  }

  function drawFloor() {
    const bounds = getBattleBounds();
    ctx.fillStyle = "#1d3f2b";
    ctx.fillRect(0, 0, view.w, view.h);

    ctx.fillStyle = "#173620";
    ctx.fillRect(0, bounds.top, bounds.left, bounds.height);
    ctx.fillRect(bounds.right, bounds.top, view.w - bounds.right, bounds.height);

    ctx.fillStyle = "#4d7f4c";
    ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);

    drawGrassField(bounds);
    drawBattleTreeBand(0, bounds.top, true);
    drawBattleTreeBand(bounds.bottom, view.h, false);
    drawBattleSideTreeBand(0, bounds.left, bounds.top, bounds.bottom, true);
    drawBattleSideTreeBand(bounds.right, view.w, bounds.top, bounds.bottom, false);

    ctx.strokeStyle = "rgba(20,45,24,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const gridGap = battlePx(64);
    for (let x = bounds.left; x <= bounds.right; x += gridGap) {
      ctx.moveTo(x, bounds.top);
      ctx.lineTo(x, bounds.bottom);
    }
    for (let y = bounds.top; y <= bounds.bottom; y += gridGap) {
      ctx.moveTo(bounds.left, y);
      ctx.lineTo(bounds.right, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(9,28,16,0.75)";
    ctx.lineWidth = Math.max(3, battlePx(5));
    ctx.beginPath();
    ctx.rect(bounds.left, bounds.top, bounds.width, bounds.height);
    ctx.stroke();
  }

  function drawGrassField(bounds) {
    ctx.save();
    ctx.lineCap = "round";
    for (let y = bounds.top + battlePx(24); y < bounds.bottom - battlePx(18); y += battlePx(38)) {
      for (let x = bounds.left + battlePx(18) + ((Math.floor(y) * 7) % battlePx(31)); x < bounds.right; x += battlePx(46)) {
        const sway = Math.sin(x * 0.09 + y * 0.04) * 3;
        ctx.strokeStyle = (Math.floor((x + y) / battlePx(46)) % 2) ? "rgba(126,178,94,0.38)" : "rgba(57,117,57,0.38)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + battlePx(7));
        ctx.lineTo(x + sway, y - battlePx(4));
        ctx.moveTo(x + battlePx(7), y + battlePx(6));
        ctx.lineTo(x + battlePx(10) + sway * 0.4, y - battlePx(2));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawBattleTreeBand(y0, y1, topBand) {
    if (y1 <= y0) {
      return;
    }
    ctx.save();
    ctx.fillStyle = topBand ? "#173620" : "#15341f";
    ctx.fillRect(0, y0, view.w, y1 - y0);

    const rowGap = battlePx(42);
    const colGap = battlePx(54);
    let row = 0;
    const treeEndY = topBand ? y1 - battlePx(18) : y1 + battlePx(24);
    for (let y = y0 + battlePx(18); y < treeEndY; y += rowGap) {
      const offset = row % 2 ? battlePx(24) : -battlePx(4);
      for (let x = offset; x < view.w + colGap; x += colGap) {
        const wobble = Math.sin(x * 0.13 + y * 0.17) * 5;
        const trunkX = x + wobble;
        const trunkY = y + battlePx(10);
        ctx.fillStyle = "#6a4428";
        roundRect(trunkX - battlePx(5), trunkY, battlePx(10), battlePx(22), battlePx(3));
        ctx.fill();
        ctx.fillStyle = row % 2 ? "#27653a" : "#225a34";
        ctx.beginPath();
        ctx.arc(trunkX, y, battlePx(24), 0, TAU);
        ctx.fill();
        ctx.fillStyle = row % 2 ? "#2f7845" : "#2b7040";
        ctx.beginPath();
        ctx.arc(trunkX - battlePx(10), y - battlePx(7), battlePx(15), 0, TAU);
        ctx.arc(trunkX + battlePx(11), y - battlePx(8), battlePx(16), 0, TAU);
        ctx.fill();
      }
      row += 1;
    }
    ctx.restore();
  }

  function drawBattleSideTreeBand(x0, x1, y0, y1, leftBand) {
    if (x1 <= x0 || y1 <= y0) {
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
    ctx.clip();
    ctx.fillStyle = leftBand ? "#173620" : "#15341f";
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

    const rowGap = battlePx(48);
    const colGap = battlePx(46);
    let row = 0;
    for (let y = y0 + battlePx(20); y < y1 + battlePx(24); y += rowGap) {
      const offset = row % 2 ? battlePx(18) : -battlePx(8);
      for (let x = x0 + offset; x < x1 + colGap; x += colGap) {
        const wobble = Math.sin(x * 0.11 + y * 0.19) * battlePx(4);
        const trunkX = x + wobble;
        const trunkY = y + battlePx(11);
        ctx.fillStyle = "#6a4428";
        roundRect(trunkX - battlePx(4), trunkY, battlePx(9), battlePx(21), battlePx(3));
        ctx.fill();
        ctx.fillStyle = row % 2 ? "#28673d" : "#225a34";
        ctx.beginPath();
        ctx.arc(trunkX, y, battlePx(23), 0, TAU);
        ctx.fill();
        ctx.fillStyle = row % 2 ? "#327947" : "#2b7040";
        ctx.beginPath();
        ctx.arc(trunkX - battlePx(9), y - battlePx(7), battlePx(14), 0, TAU);
        ctx.arc(trunkX + battlePx(10), y - battlePx(8), battlePx(15), 0, TAU);
        ctx.fill();
      }
      row += 1;
    }
    ctx.restore();
  }

  function drawAreas() {
    for (const area of areas) {
      if (area.type === "ice") {
        const alpha = clamp(area.time / 4.2, 0.15, 0.4);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#b8e7ff";
        ctx.beginPath();
        ctx.arc(area.x, area.y, area.radius, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#f7fdff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      } else if (area.type === "sleep_scent") {
        const alpha = clamp(area.time / 3, 0.14, 0.36);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#c785ff";
        ctx.beginPath();
        ctx.arc(area.x, area.y, area.radius, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#f3dcff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = "#fff0a8";
        for (let i = 0; i < 9; i += 1) {
          const angle = (i / 9) * TAU + area.time * 0.45;
          const distance = area.radius * (0.18 + (i % 4) * 0.16);
          ctx.beginPath();
          ctx.arc(area.x + Math.cos(angle) * distance, area.y + Math.sin(angle) * distance, 3 + (i % 3), 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      } else if (area.type === "pollen_spraying") {
        const alpha = clamp(area.time / 5, 0.12, 0.34);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#d8d35b";
        ctx.beginPath();
        ctx.arc(area.x, area.y, area.radius, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#fff7a6";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = "#f7e36a";
        for (let i = 0; i < 14; i += 1) {
          const angle = (i / 14) * TAU - area.time * 0.35;
          const distance = area.radius * (0.12 + (i % 5) * 0.15);
          ctx.beginPath();
          ctx.arc(area.x + Math.cos(angle) * distance, area.y + Math.sin(angle) * distance, 2 + (i % 2), 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      } else if (area.type === "enemy_line") {
        const total = Math.max(0.001, Number.isFinite(area.total) ? area.total : area.time || 1);
        const alpha = clamp(area.time / total, 0.18, 0.42);
        ctx.save();
        ctx.lineCap = "round";
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "rgba(255,52,44,0.24)";
        ctx.lineWidth = (area.width || battlePx(12)) + battlePx(10);
        ctx.beginPath();
        ctx.moveTo(area.x, area.y);
        ctx.lineTo(area.x2, area.y2);
        ctx.stroke();
        ctx.globalAlpha = Math.min(0.85, alpha + 0.25);
        ctx.strokeStyle = "#ff4d46";
        ctx.lineWidth = area.width || battlePx(12);
        ctx.beginPath();
        ctx.moveTo(area.x, area.y);
        ctx.lineTo(area.x2, area.y2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawTelegraphs() {
    for (const telegraph of telegraphs) {
      if (telegraph.hidden) {
        continue;
      }
      updateTelegraphDynamic(telegraph);
      const progress = clamp(1 - telegraph.time / telegraph.total, 0, 1);
      const enemy = telegraph.team === "enemy";
      const support = telegraph.team === "support";
      const fill = support
        ? "rgba(108,218,255,0.18)"
        : enemy
          ? "rgba(255,52,44,0.24)"
          : "rgba(0,0,0,0.26)";
      const stroke = support ? "#9ef7ff" : enemy ? "#ff4d46" : "#f7f7f7";

      ctx.save();
      ctx.lineJoin = "round";
      if (telegraph.type === "circle") {
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = support ? 2 : enemy ? 3 : 2.5;
        ctx.beginPath();
        ctx.arc(telegraph.x, telegraph.y, telegraph.radius, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = enemy ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.72)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(telegraph.x, telegraph.y, telegraph.radius * progress, 0, TAU);
        ctx.stroke();
      } else if (telegraph.type === "line") {
        ctx.strokeStyle = fill;
        ctx.lineWidth = telegraph.width + battlePx(10);
        ctx.beginPath();
        ctx.moveTo(telegraph.x, telegraph.y);
        ctx.lineTo(telegraph.x2, telegraph.y2);
        ctx.stroke();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = telegraph.width;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(telegraph.x, telegraph.y);
        ctx.lineTo(telegraph.x2, telegraph.y2);
        ctx.stroke();
      } else if (telegraph.type === "fan") {
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(telegraph.x, telegraph.y);
        ctx.arc(
          telegraph.x,
          telegraph.y,
          telegraph.radius,
          telegraph.angle - telegraph.arc / 2,
          telegraph.angle + telegraph.arc / 2
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }


  function drawPlayerAimPreview() {
    skillSystem.drawPlayerAimPreview();
    if (itemSystem && itemSystem.drawItemAimPreview) {
      itemSystem.drawItemAimPreview();
    }
  }

  function drawSupportCastPreview() {
    if (!player.cast && !player.channel) {
      return;
    }

    ctx.save();
    if (player.cast) {
      const progress = 1 - clamp(player.cast.time / Math.max(player.cast.total || 1, 0.001), 0, 1);
      if (player.cast.type === "heal" && player.cast.target && !player.cast.target.dead) {
        drawSupportCastingAt(player.cast.target.x, player.cast.target.y, player.cast.target.radius + battlePx(22), "#79ff8d", progress);
      } else if (player.cast.type === "shield") {
        drawSupportCastingAt(player.cast.x, player.cast.y, battlePx(30), "#8fe9ff", progress);
      } else if (player.cast.type === "attack" && player.cast.target) {
        const skill = skillSystem.requireSkill("finald", "attack");
        drawSupportCastingAt(player.cast.target.x, player.cast.target.y, skill.radius, "#9ef7ff", progress);
      } else if (player.cast.type === "ult") {
        const pulse = 0.5 + Math.sin(game.time * 8) * 0.5;
        for (const member of getFieldPartyMembers()) {
          if (!member.dead) {
            drawSupportCastingAt(member.x, member.y, member.radius + battlePx(20) + pulse * battlePx(5), "#79ff8d", progress);
          }
        }
      }
    }

    if (player.channel) {
      const pulse = 0.5 + Math.sin(game.time * 8) * 0.5;
      for (const member of getFieldPartyMembers()) {
        if (member.dead) {
          continue;
        }
        drawSupportCastingAt(member.x, member.y, member.radius + battlePx(18) + pulse * battlePx(5), "#79ff8d", pulse);
      }
    }
    ctx.restore();
  }

  function drawSupportCastingAt(x, y, radius, color, progress) {
    const angle = game.time * 4.4;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.32 + progress * 0.28;
    ctx.lineWidth = Math.max(1, battlePx(2.5));
    ctx.beginPath();
    ctx.arc(x, y, radius, angle, angle + TAU * 0.72);
    ctx.stroke();

    for (let i = 0; i < 3; i += 1) {
      const a = angle + i * (TAU / 3);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.55 + progress * 0.35;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * radius, y + Math.sin(a) * radius, battlePx(4), 0, TAU);
      ctx.fill();
    }
  }

  function drawAimRangeCircle(x, y, radius, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([battlePx(10), battlePx(12)]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  function drawProjectiles() {
    for (const shot of projectiles) {
      ctx.save();
      ctx.fillStyle = shot.color || "#ffffff";
      ctx.shadowColor = shot.color || "#ffffff";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.radius, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawUnits() {
    const units = [...enemies, ...party].filter((unit) => !unit.dead && isFieldUnit(unit));
    units.sort((a, b) => a.y - b.y);
    cleanupBattleSpriteStates(units);
    for (const unit of units) {
      drawUnit(unit);
    }
  }

  function cleanupBattleSpriteStates(units) {
    const livePartyIds = new Set(units
      .filter((unit) => unit && unit.team === "party")
      .map((unit) => unit.id));
    for (const unitId of battleSpriteStates.keys()) {
      if (!livePartyIds.has(unitId)) {
        battleSpriteStates.delete(unitId);
      }
    }
  }

  function drawFloatingArjuna() {
    if (!player || player.dead || isFieldUnit(player)) {
      return;
    }

    const { x, y, groundY, radius } = getFloatingArjunaVisualPosition();
    const visualUnit = { ...player, x, y, radius };
    const pulse = 0.55 + Math.sin(game.time * 4.1) * 0.18;

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#06120f";
    ctx.beginPath();
    ctx.ellipse(x, groundY, radius * 1.75, Math.max(3, radius * 0.35), 0, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 0.28 + pulse * 0.18;
    ctx.strokeStyle = "#a8fbff";
    ctx.lineWidth = Math.max(1, battlePx(2));
    ctx.beginPath();
    ctx.ellipse(x, y + radius + battlePx(6), radius * 1.55, Math.max(4, radius * 0.35), 0, 0, TAU);
    ctx.stroke();

    ctx.globalAlpha = 1;
    if (player.cast || player.channel) {
      drawCastOrbit(visualUnit);
    }

    ctx.globalAlpha = 0.22 + pulse * 0.18;
    ctx.fillStyle = "#a8fbff";
    ctx.beginPath();
    ctx.arc(x, y, radius + battlePx(11), 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = player.frozen > 0 ? "#cfefff" : player.color;
    ctx.strokeStyle = "#101814";
    ctx.lineWidth = Math.max(2, battlePx(3));
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
    ctx.stroke();

    drawUnitGear(visualUnit);

    ctx.fillStyle = "#101814";
    ctx.font = `700 ${Math.max(12, radius)}px "Segoe UI", "Yu Gothic UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(player.label, x, y + 0.5);
    ctx.restore();
  }

  function getFloatingArjunaVisualPosition() {
    const bounds = getBattleBounds();
    const radius = player.radius || battlePx(15);
    const x = clamp(bounds.left + battlePx(240), bounds.left + radius + battlePx(8), bounds.right - radius - battlePx(8));
    const groundY = clamp(bounds.centerY + battlePx(22), bounds.top + battlePx(72), bounds.bottom - battlePx(34));
    const bob = Math.sin(game.time * 2.3) * battlePx(6);
    return {
      x,
      y: groundY - battlePx(170) + bob,
      groundY,
      radius,
    };
  }

  function getSpeechAnchorPosition(source) {
    const visual = source.id === "finald" && !isFieldUnit(source) ? getFloatingArjunaVisualPosition() : null;
    const x = visual ? visual.x : source.x;
    const y = visual ? visual.y : source.y;
    const radius = visual ? visual.radius : (source.radius || battlePx(14));
    return {
      x,
      y: y - radius - battlePx(6),
    };
  }


  function lerpColor(from, to, ratio) {
    const t = clamp(ratio, 0, 1);
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    return `rgb(${r},${g},${b})`;
  }

  function getMoodColor(mood) {
    const value = clamp(mood, 0, 100);
    const blue = [93, 179, 255];
    const yellow = [255, 216, 107];
    const orange = [255, 159, 67];
    const red = [255, 79, 79];
    if (value <= 50) {
      return lerpColor(blue, yellow, value / 50);
    }
    if (value <= 70) {
      return lerpColor(yellow, orange, (value - 50) / 20);
    }
    return lerpColor(orange, red, (value - 70) / 30);
  }

  function isLowHp(unit) {
    return unit && unit.maxHp > 0 && unit.hp / unit.maxHp <= 0.25;
  }

  function drawUnit(unit) {
    const isHovered = game.hover === unit;
    const mood = unit.mood === null ? MOOD_BASELINE : unit.mood;

    ctx.save();
    if (unit.hurt > 0) {
      ctx.translate(Math.sin(game.time * 80) * 1.5, 0);
    }

    if (unit.team === "party" && unit.id !== "finald") {
      ctx.strokeStyle = getMoodColor(mood);
      ctx.lineWidth = Math.max(2, battlePx(3));
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius + battlePx(7), 0, TAU);
      ctx.stroke();
    }

    if (unit.shield > 0) {
      ctx.strokeStyle = COLORS.shield;
      ctx.lineWidth = Math.max(2, battlePx(3));
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius + battlePx(4), 0, TAU);
      ctx.stroke();
    }

    if (unit.team === "enemy" && unit === game.priorityTarget) {
      drawPriorityTargetMark(unit);
    }
    if (unit.team === "enemy" && unit === game.avoidTarget) {
      drawAvoidTargetMark(unit);
    }

    if ((unit === player && (player.cast || player.channel)) || unit.castVisual) {
      drawCastOrbit(unit);
    }

    if (isHovered) {
      ctx.strokeStyle = COLORS.white;
      ctx.lineWidth = Math.max(3, battlePx(5));
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius + battlePx(10), 0, TAU);
      ctx.stroke();
    }

    if (unit.guardFlash > 0) {
      ctx.strokeStyle = "#f6f6f6";
      ctx.lineWidth = Math.max(2, battlePx(4));
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius + battlePx(13), -0.7, 0.7);
      ctx.stroke();
    }

    if (isLowHp(unit)) {
      const pulse = 0.45 + Math.sin(game.time * 11) * 0.3;
      ctx.strokeStyle = `rgba(255,65,65,${0.6 + pulse * 0.3})`;
      ctx.lineWidth = Math.max(3, battlePx(5));
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius + battlePx(17), 0, TAU);
      ctx.stroke();
    }

    const drewPartySprite = unit.team === "party" && drawBattleCharacterSprite(unit);
    if (!drewPartySprite) {
      ctx.fillStyle = unit.frozen > 0 ? "#cfefff" : unit.color;
      ctx.strokeStyle = unit.team === "enemy" ? "#3a1816" : "#101814";
      ctx.lineWidth = Math.max(2, battlePx(3));
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius, 0, TAU);
      ctx.fill();
      ctx.stroke();

      drawUnitGear(unit);

      ctx.fillStyle = unit.team === "enemy" ? "#ffe7df" : "#101814";
      ctx.font = `700 ${Math.max(12, unit.radius)}px "Segoe UI", "Yu Gothic UI", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(unit.label, unit.x, unit.y + 0.5);
    }

    if (unit.team === "enemy") {
      const barWidth = Math.max(battlePx(44), unit.radius * 2.8);
      drawFieldHpBar(unit, unit.x - barWidth / 2, unit.y + unit.radius + battlePx(9), barWidth, battlePx(6), "#241312");
    } else {
      if (drewPartySprite) {
        const metrics = getBattleCharacterSpriteMetrics(unit);
        drawFieldHpBar(unit, unit.x - battlePx(24), metrics.top - battlePx(10), battlePx(48), battlePx(6));
      } else {
        drawFieldHpBar(unit);
      }
    }

    if (unit.tauntTimer > 0 && unit.forcedTarget) {
      ctx.strokeStyle = "rgba(227,122,63,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(unit.x, unit.y);
      ctx.lineTo(unit.forcedTarget.x, unit.forcedTarget.y);
      ctx.stroke();
      drawTauntMark(unit);
    }

    ctx.restore();
  }

  function drawBattleCharacterSprite(unit) {
    const state = updateBattleSpriteState(unit);
    const image = getBattleWalkImage(unit, state.facing, state.frame);
    if (!isSystemImageReady(image)) {
      return false;
    }
    const renderImage = getBattleWalkRenderImage(image);
    const metrics = getBattleCharacterSpriteMetrics(unit, renderImage);
    ctx.save();
    const previousSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(renderImage, metrics.x, metrics.y, metrics.w, metrics.h);
    ctx.imageSmoothingEnabled = previousSmoothing;
    ctx.restore();
    return true;
  }

  function getBattleWalkRenderImage(image) {
    if (!isSystemImageReady(image)) {
      return image;
    }
    const targetH = battlePx(64);
    const cached = battleWalkRenderCache.get(image);
    if (cached && cached.height === targetH) {
      return cached.canvas;
    }
    const sourceW = image.naturalWidth || image.width || 1;
    const sourceH = image.naturalHeight || image.height || 1;
    const targetW = Math.max(1, Math.round(targetH * sourceW / Math.max(1, sourceH)));
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const offscreen = canvas.getContext("2d");
    if (!offscreen) {
      return image;
    }
    const previousSmoothing = offscreen.imageSmoothingEnabled;
    offscreen.imageSmoothingEnabled = false;
    offscreen.clearRect(0, 0, targetW, targetH);
    offscreen.drawImage(image, 0, 0, targetW, targetH);
    offscreen.imageSmoothingEnabled = previousSmoothing;
    battleWalkRenderCache.set(image, { canvas, height: targetH });
    return canvas;
  }

  function getBattleWalkImage(unit, facing, frame) {
    if (!unit || unit.team !== "party") {
      return null;
    }
    const imageKey = unit.id === "finald"
      ? playerProfile.gender === "女の子" ? "finaldFemale" : "finaldMale"
      : unit.id;
    const direction = BATTLE_WALK_DIRECTIONS.includes(facing) ? facing : "down";
    const normalizedFrame = BATTLE_WALK_FRAMES.includes(frame) ? frame : 1;
    return battleCharacterSprites[imageKey] && battleCharacterSprites[imageKey][direction] && battleCharacterSprites[imageKey][direction][normalizedFrame] || null;
  }

  function updateBattleSpriteState(unit) {
    let state = battleSpriteStates.get(unit.id);
    if (!state) {
      state = {
        x: unit.x,
        y: unit.y,
        facing: getBattleFacingFromTarget(unit) || "down",
        frame: 1,
        moving: false,
      };
      battleSpriteStates.set(unit.id, state);
    }

    const dx = unit.x - state.x;
    const dy = unit.y - state.y;
    const moved = Math.hypot(dx, dy) > 0.25;
    const facingIntent = unit.battleFacingIntent;
    if (moved && facingIntent === "move") {
      state.facing = getFacingFromVector(dx, dy, state.facing);
    } else {
      state.facing = getBattleFacingFromTarget(unit) || state.facing || "down";
    }
    unit.battleFacingIntent = null;
    state.frame = moved ? BATTLE_WALK_SEQUENCE[Math.floor(game.time / BATTLE_WALK_FRAME_INTERVAL) % BATTLE_WALK_SEQUENCE.length] || 1 : 1;
    state.moving = moved;
    state.x = unit.x;
    state.y = unit.y;
    return state;
  }

  function getBattleFacingFromTarget(unit) {
    const target = getBattleFacingTarget(unit);
    if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) {
      return null;
    }
    return getFacingFromVector(target.x - unit.x, target.y - unit.y, null);
  }

  function getBattleFacingTarget(unit) {
    if (!unit) {
      return null;
    }
    if (unit.cast && unit.cast.target && !unit.cast.target.dead) {
      return unit.cast.target;
    }
    if (unit.aiIntent && unit.aiIntent.target && unit.aiIntent.target.team === "enemy" && !unit.aiIntent.target.dead) {
      return unit.aiIntent.target;
    }
    if (unit.forcedTarget && !unit.forcedTarget.dead) {
      return unit.forcedTarget;
    }
    if (unit.aiMoveTarget && !unit.aiMoveTarget.dead) {
      return unit.aiMoveTarget;
    }
    if (game.priorityTarget && !game.priorityTarget.dead) {
      return game.priorityTarget;
    }
    return getNearestLivingEnemy(unit);
  }

  function getNearestLivingEnemy(unit) {
    let best = null;
    let bestDist = Infinity;
    for (const enemy of enemies) {
      if (!enemy || enemy.dead || !isFieldUnit(enemy) || enemy === game.avoidTarget) {
        continue;
      }
      const d = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
      if (d < bestDist) {
        best = enemy;
        bestDist = d;
      }
    }
    return best;
  }

  function getFacingFromVector(dx, dy, fallback) {
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
      return fallback;
    }
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0 ? "right" : "left";
    }
    return dy >= 0 ? "down" : "up";
  }

  function getBattleCharacterSpriteMetrics(unit, image = null) {
    const height = battlePx(64);
    const sourceW = image && (image.naturalWidth || image.width || 0);
    const sourceH = image && (image.naturalHeight || image.height || 0);
    const width = sourceH > 0
      ? height * sourceW / sourceH
      : height;
    const footY = unit.y + unit.radius + battlePx(13);
    const x = unit.x - width / 2;
    const y = footY - height;
    return {
      x,
      y,
      w: width,
      h: height,
      top: y,
      footY,
    };
  }

  function drawPriorityTargetMark(unit) {
    const radius = unit.radius + battlePx(13);
    const pulse = 0.65 + Math.sin(game.time * 8) * 0.18;
    ctx.save();
    ctx.strokeStyle = `rgba(255,213,107,${pulse})`;
    ctx.lineWidth = Math.max(2, battlePx(3));
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, radius, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = Math.max(1, battlePx(2));
    for (let i = 0; i < 4; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 2;
      const x1 = unit.x + Math.cos(angle) * (radius - battlePx(5));
      const y1 = unit.y + Math.sin(angle) * (radius - battlePx(5));
      const x2 = unit.x + Math.cos(angle) * (radius + battlePx(5));
      const y2 = unit.y + Math.sin(angle) * (radius + battlePx(5));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAvoidTargetMark(unit) {
    const radius = unit.radius + battlePx(14);
    const pulse = 0.58 + Math.sin(game.time * 7) * 0.16;
    ctx.save();
    ctx.strokeStyle = `rgba(156,198,255,${pulse})`;
    ctx.lineWidth = Math.max(2, battlePx(3));
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, radius, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(247,255,246,0.92)";
    ctx.lineWidth = Math.max(2, battlePx(3));
    ctx.beginPath();
    ctx.moveTo(unit.x - radius * 0.58, unit.y - radius * 0.58);
    ctx.lineTo(unit.x + radius * 0.58, unit.y + radius * 0.58);
    ctx.moveTo(unit.x + radius * 0.58, unit.y - radius * 0.58);
    ctx.lineTo(unit.x - radius * 0.58, unit.y + radius * 0.58);
    ctx.stroke();
    ctx.restore();
  }

  function drawFieldHpBar(unit, x = null, y = null, w = null, h = null, back = "#132115") {
    const barW = w || battlePx(48);
    const barH = h || battlePx(6);
    const barX = x ?? unit.x - barW / 2;
    const barY = y ?? unit.y - unit.radius - battlePx(19);
    drawBar(barX, barY, barW, barH, unit.hp / unit.maxHp, back, COLORS.hp);
    if (unit.shield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = COLORS.shield;
      roundRect(barX, barY, barW * clamp(unit.shield / unit.maxHp, 0, 1), barH, Math.min(4, barH / 2));
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTauntMark(unit) {
    const pulse = 0.75 + Math.sin(game.time * 11) * 0.25;
    const x = unit.x + unit.radius + battlePx(12);
    const y = unit.y - unit.radius - battlePx(14);
    const size = battlePx(12) + pulse * battlePx(2);

    ctx.save();
    ctx.globalAlpha = 0.78 + pulse * 0.18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2b1210";
    ctx.lineWidth = Math.max(3, battlePx(5));
    ctx.beginPath();
    ctx.moveTo(x - size * 0.7, y);
    ctx.lineTo(x - size * 0.15, y - size * 0.62);
    ctx.lineTo(x + size * 0.35, y - size * 0.15);
    ctx.moveTo(x - size * 0.65, y + size * 0.62);
    ctx.lineTo(x - size * 0.05, y + size * 0.12);
    ctx.lineTo(x + size * 0.7, y + size * 0.58);
    ctx.stroke();

    ctx.strokeStyle = "#ff5d3f";
    ctx.lineWidth = Math.max(2, battlePx(3));
    ctx.beginPath();
    ctx.moveTo(x - size * 0.7, y);
    ctx.lineTo(x - size * 0.15, y - size * 0.62);
    ctx.lineTo(x + size * 0.35, y - size * 0.15);
    ctx.moveTo(x - size * 0.65, y + size * 0.62);
    ctx.lineTo(x - size * 0.05, y + size * 0.12);
    ctx.lineTo(x + size * 0.7, y + size * 0.58);
    ctx.stroke();
    ctx.restore();
  }
  function drawCastOrbit(unit) {
    const visual = unit && unit.castVisual;
    const castProgress = visual && visual.total
      ? 1 - clamp(visual.time / visual.total, 0, 1)
      : (player.cast ? 1 - clamp(player.cast.time / player.cast.total, 0, 1) : 1);
    const orbitRadius = unit.radius + battlePx(20);
    const pulse = 0.55 + Math.sin(game.time * 10) * 0.18;
    const accent = visual && visual.color ? visual.color : "rgba(190, 255, 203, 0.95)";
    const base = visual ? "rgba(255, 142, 118, 0.24)" : "rgba(124, 255, 148, 0.24)";
    const glow = visual ? "#ff8e76" : "#86ff9a";

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = base;
    ctx.lineWidth = Math.max(4, battlePx(8));
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, orbitRadius, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.lineWidth = Math.max(2, battlePx(3));
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, orbitRadius, -Math.PI / 2, -Math.PI / 2 + TAU * castProgress);
    ctx.stroke();

    for (let i = 0; i < 4; i += 1) {
      const angle = game.time * 4.2 + i * (TAU / 4);
      const x = unit.x + Math.cos(angle) * orbitRadius;
      const y = unit.y + Math.sin(angle) * orbitRadius;
      const size = i === 0 ? battlePx(5.5) : battlePx(4);
      ctx.fillStyle = visual ? accent : `rgba(142, 255, 160, ${0.58 + pulse * 0.34})`;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawUnitGear(unit) {
    if (unit.team !== "party") {
      return;
    }

    if (unit.id === "finald" || unit.id === "sushia") {
      drawStaffIcon(unit, unit.id === "finald" ? "#a8fbff" : "#e3bdff");
    } else if (unit.id === "ulpes") {
      drawSwordIcon(unit);
    } else if (unit.id === "rihas") {
      drawFistIcon(unit);
    }
  }

  function drawStaffIcon(unit, orbColor) {
    const x = unit.x + unit.radius + battlePx(7);
    const y = unit.y - unit.radius - battlePx(2);

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#6a4a2e";
    ctx.lineWidth = Math.max(2, battlePx(4));
    ctx.beginPath();
    ctx.moveTo(x - battlePx(8), y + battlePx(25));
    ctx.lineTo(x + battlePx(9), y - battlePx(10));
    ctx.stroke();

    ctx.strokeStyle = "#f7fff6";
    ctx.lineWidth = Math.max(1, battlePx(1.5));
    ctx.beginPath();
    ctx.moveTo(x - battlePx(8), y + battlePx(25));
    ctx.lineTo(x + battlePx(9), y - battlePx(10));
    ctx.stroke();

    ctx.fillStyle = orbColor;
    ctx.strokeStyle = "#f7fff6";
    ctx.lineWidth = Math.max(1, battlePx(2));
    ctx.beginPath();
    ctx.arc(x + battlePx(10), y - battlePx(12), battlePx(6), 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawSwordIcon(unit) {
    const x = unit.x + unit.radius + battlePx(5);
    const y = unit.y - unit.radius + battlePx(1);

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#f4f6f7";
    ctx.lineWidth = Math.max(3, battlePx(5));
    ctx.beginPath();
    ctx.moveTo(x - battlePx(9), y + battlePx(24));
    ctx.lineTo(x + battlePx(13), y - battlePx(12));
    ctx.stroke();

    ctx.strokeStyle = "#7e8b91";
    ctx.lineWidth = Math.max(1, battlePx(1.5));
    ctx.beginPath();
    ctx.moveTo(x - battlePx(9), y + battlePx(24));
    ctx.lineTo(x + battlePx(13), y - battlePx(12));
    ctx.stroke();

    ctx.strokeStyle = "#493327";
    ctx.lineWidth = Math.max(2, battlePx(4));
    ctx.beginPath();
    ctx.moveTo(x - battlePx(15), y + battlePx(15));
    ctx.lineTo(x + battlePx(3), y + battlePx(26));
    ctx.stroke();

    ctx.strokeStyle = "#b58b40";
    ctx.lineWidth = Math.max(2, battlePx(3));
    ctx.beginPath();
    ctx.moveTo(x - battlePx(13), y + battlePx(24));
    ctx.lineTo(x - battlePx(5), y + battlePx(33));
    ctx.stroke();
    ctx.restore();
  }

  function drawFistIcon(unit) {
    const x = unit.x + unit.radius + battlePx(8);
    const y = unit.y - unit.radius + battlePx(1);

    ctx.save();
    ctx.fillStyle = "#f7b05e";
    ctx.strokeStyle = "#3a2115";
    ctx.lineWidth = Math.max(1, battlePx(2));

    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(x + i * battlePx(5), y, battlePx(4.7), 0, TAU);
      ctx.fill();
      ctx.stroke();
    }

    roundRect(x - battlePx(3), y + battlePx(3), battlePx(25), battlePx(17), battlePx(7));
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e37a3f";
    roundRect(x + battlePx(1), y + battlePx(17), battlePx(16), battlePx(9), battlePx(4));
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawSpeechBubble(effect) {
    const source = effect.source;
    if (!source) {
      return;
    }
    const alpha = clamp(Math.min(effect.age / 0.12, effect.time / 0.22), 0, 1);
    const anchor = getSpeechAnchorPosition(source);
    const anchorX = anchor.x;
    const anchorY = anchor.y;

    ctx.globalAlpha = alpha;
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const textWidth = ctx.measureText(effect.text).width;
    const bubbleW = Math.min(Math.max(textWidth + 20, 46), 190);
    const bubbleH = 27;
    const bubbleX = clamp(anchorX - bubbleW / 2, 8, view.w - bubbleW - 8);
    const bubbleY = clamp(anchorY - bubbleH - battlePx(12) - Math.sin(effect.age * 7) * 1.5, battlePx(8), view.h - bubbleH - battlePx(20));
    const tailX = clamp(anchorX, bubbleX + 12, bubbleX + bubbleW - 12);
    const tailY = bubbleY + bubbleH - 1;

    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.strokeStyle = "rgba(10,12,10,0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tailX - 6, tailY);
    ctx.lineTo(tailX + 6, tailY);
    ctx.lineTo(clamp(anchorX, bubbleX + 10, bubbleX + bubbleW - 10), tailY + 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#101510";
    ctx.fillText(effect.text, bubbleX + bubbleW / 2, bubbleY + bubbleH / 2 + 0.5);
  }

  function drawEffects() {
    for (const effect of effects) {
      const lifeTotal = Number.isFinite(effect.total) && effect.total > 0 ? effect.total : 0.85;
      const life = clamp(effect.time / lifeTotal, 0, 1);
      ctx.save();
      if (effect.type === "speech") {
        drawSpeechBubble(effect);
      } else if (effect.type === "float") {
        ctx.globalAlpha = life;
        ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        ctx.lineWidth = 4;
        ctx.strokeStyle = effect.outline || "#0b0d0b";
        ctx.strokeText(effect.text, effect.x, effect.y);
        ctx.fillStyle = effect.color;
        ctx.fillText(effect.text, effect.x, effect.y);
      } else if (effect.type === "burst") {
        const progress = effect.age / (effect.age + effect.time);
        ctx.globalAlpha = clamp(effect.time / 0.35, 0, 1);
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius * (0.3 + progress * 0.8), 0, TAU);
        ctx.stroke();
      } else if (effect.type === "beam") {
        ctx.globalAlpha = clamp(effect.time / 0.24, 0, 1);
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(effect.x, effect.y);
        ctx.lineTo(effect.x2, effect.y2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawResultOverlay() {
    if (game.state === "playing" || game.state === "town") {
      return;
    }
    const won = game.state === "won";
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 40px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const titleY = won ? Math.max(76, view.h * 0.25) : view.h / 2 - 24;
    ctx.fillText(won ? "依頼達成" : "依頼失敗", view.w / 2, titleY);
    const autoCrystalPending = won && isBattleRewardPowerCrystalAutoPending();
    let guideY = won ? drawBattleRewardSummary(view.w / 2, titleY + 56) + 36 : drawDefeatRestartPanel(view.w / 2, titleY + 48);
    if (!autoCrystalPending) {
      ctx.font = "18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      guideY = Math.min(view.h - 42, Math.max(guideY, titleY + 54));
      if (won) {
        ctx.fillText("R で町へ戻る", view.w / 2, guideY);
      }
    }
    if (won && game.inventoryMessage && isBattleRewardPowerCrystalAutoPending()) {
      drawInventoryMessage(game.inventoryMessage, getResultMessageContentRect());
    }
    ctx.restore();
    drawTopRightGoldBadge(getSystemMenuButtonRect());
  }

  function drawDefeatRestartPanel(centerX, y) {
    const ui = getDefeatUi();
    return ui.mode === "town"
      ? drawDefeatTownRestartPanel(centerX, y)
      : drawDefeatMainRestartPanel(centerX, y);
  }

  function getDefeatUi() {
    if (!game.defeatUi || typeof game.defeatUi !== "object") {
      game.defeatUi = { mode: "main", message: "" };
    }
    return game.defeatUi;
  }

  function drawDefeatMainRestartPanel(centerX, y) {
    const ui = getDefeatUi();
    const w = Math.min(620, view.w - 44);
    const h = 236;
    const x = centerX - w / 2;
    ctx.save();
    ctx.fillStyle = "rgba(247,255,246,0.96)";
    ctx.strokeStyle = "rgba(255,213,107,0.42)";
    ctx.lineWidth = 1.2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#102018";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("再開方法を選択", centerX, y + 18);
    ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#4c6758";
    ctx.fillText("セーブ地点から再開すると、セーブ後の出来事は破棄されます。", centerX, y + 52);
    ctx.fillText("町から再開すると、現在の所持品などを保持して最寄りの町へ戻ります。", centerX, y + 76);

    const hasSave = hasCurrentSavePoint();
    const saveLabel = hasSave ? "セーブ地点から再開" : "セーブ地点なし";
    const buttonY = y + 120;
    drawSystemSmallButton(centerX - 222, buttonY, 204, 40, saveLabel, hasSave ? "restartFromSavePoint" : "noop");
    drawSystemSmallButton(centerX + 18, buttonY, 204, 40, "町から再開", "openDefeatTownRestartChoice");

    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = hasSave ? "#8a6a2a" : "#9a4d42";
    ctx.fillText(hasSave ? `現在のセーブ地点: ${getCurrentSavePointName()}` : "まだセーブされていないため使用できません。", centerX, y + 174);
    if (ui.message) {
      ctx.fillStyle = "#9a4d42";
      ctx.fillText(ui.message, centerX, y + 198);
    }
    ctx.restore();
    return y + h;
  }

  function drawDefeatTownRestartPanel(centerX, y) {
    const ui = getDefeatUi();
    const cost = 100;
    const canInn = getCurrentGoldAmount() >= cost;
    const w = Math.min(620, view.w - 44);
    const h = 254;
    const x = centerX - w / 2;
    ctx.save();
    ctx.fillStyle = "rgba(247,255,246,0.96)";
    ctx.strokeStyle = "rgba(255,213,107,0.42)";
    ctx.lineWidth = 1.2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#102018";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("町から再開", centerX, y + 18);
    ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#4c6758";
    ctx.fillText("再開する前に宿屋から再開しますか？ 全員が全回復します。", centerX, y + 52);
    ctx.fillText(`所持金: ${getGoldText()} / 宿屋: ${formatGoldAmount(cost)}`, centerX, y + 78);
    if (!canInn) {
      ctx.fillStyle = "#9a4d42";
      ctx.fillText("所持金が足りないため、宿屋から再開はできません。", centerX, y + 104);
    }
    if (ui.message) {
      ctx.fillStyle = "#9a4d42";
      ctx.fillText(ui.message, centerX, y + 126);
    }

    const buttonY = y + 166;
    drawSystemSmallButton(centerX - 254, buttonY, 152, 40, "戻る", "backToDefeatMainChoice");
    drawSystemSmallButton(centerX - 76, buttonY, 152, 40, "通常再開", "restartFromTownNormal");
    drawSystemSmallButton(centerX + 102, buttonY, 152, 40, canInn ? "宿屋から再開" : "所持金不足", canInn ? "restartFromTownInn" : "noop");

    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#8a6a2a";
    ctx.fillText("通常再開では全員が最大HP10%で再開します。", centerX, y + 220);
    ctx.restore();
    return y + h;
  }

  function hasCurrentSavePoint() {
    const saveId = game.currentSaveId;
    if (!saveId || !saveSystem || typeof saveSystem.listSaves !== "function") {
      return false;
    }
    return saveSystem.listSaves().some((entry) => entry && entry.id === saveId);
  }

  function getCurrentSavePointName() {
    const saveId = game.currentSaveId;
    if (!saveId || !saveSystem || typeof saveSystem.listSaves !== "function") {
      return "なし";
    }
    const found = saveSystem.listSaves().find((entry) => entry && entry.id === saveId);
    return found && found.name ? found.name : "セーブデータ";
  }

  function getCurrentGoldAmount() {
    const value = typeof getGold === "function"
      ? getGold()
      : Number.isFinite(game.gold)
        ? game.gold
        : 0;
    return Math.max(0, Math.floor(value));
  }

  function formatGoldAmount(amount) {
    return typeof formatGold === "function" ? formatGold(amount) : `${Math.max(0, Math.floor(amount || 0))}G`;
  }

  function drawBattleRewardSummary(centerX, y) {
    const rows = getBattleRewardRows();
    const maxRows = Math.min(5, Math.max(1, rows.length));
    const rowH = 30;
    const w = Math.min(460, view.w - 44);
    const showCrystalNext = canShowBattleRewardPowerCrystalNextButton();
    const h = 70 + maxRows * rowH + (rows.length > maxRows ? 22 : 0) + (showCrystalNext ? 50 : 0);
    const x = centerX - w / 2;
    ctx.save();
    ctx.fillStyle = "rgba(247,255,246,0.96)";
    ctx.strokeStyle = "rgba(255,213,107,0.42)";
    ctx.lineWidth = 1.2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "900 17px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("今回の戦闘で獲得したアイテム", x + 22, y + 18);

    if (!rows.length) {
      ctx.fillStyle = "#63706a";
      ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("なし", x + 22, y + 52);
    } else {
      for (let i = 0; i < maxRows; i += 1) {
        drawBattleRewardRow(rows[i], x + 22, y + 52 + i * rowH, w - 44, rowH);
      }
      if (rows.length > maxRows) {
        ctx.fillStyle = "#63706a";
        ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
        ctx.fillText(`ほか ${rows.length - maxRows} 件`, x + 22, y + 54 + maxRows * rowH);
      }
    }
    if (showCrystalNext) {
      ctx.fillStyle = "#63706a";
      ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("力の結晶を開封します", centerX, y + h - 47);
      drawSystemSmallButton(centerX - 54, y + h - 34, 108, 28, "次へ", "openNextBattleRewardCrystal");
    }
    ctx.restore();
    return y + h;
  }

  function drawBattleRewardRow(row, x, y, w, h) {
    if (!row) {
      return;
    }
    const iconSize = 22;
    ctx.save();
    ctx.fillStyle = row.color || "#6aa878";
    roundRect(x, y + 3, iconSize, iconSize, 6);
    ctx.fill();
    drawFittedSystemText(row.icon || "?", x + iconSize / 2, y + iconSize / 2 + 3, iconSize - 6, 900, 11, 8, "#f7fff6", "center", "middle");
    drawFittedSystemText(row.title, x + 34, y + h / 2, w - 150, 900, 14, 10, "#102018", "left", "middle");
    drawFittedSystemText(row.amount, x + w - 112, y + h / 2, 112, 900, 14, 10, "#9c7123", "right", "middle");
    ctx.restore();
  }

  function getBattleRewardPowerCrystalAutoState() {
    const rewards = game.battleRewards && typeof game.battleRewards === "object" ? game.battleRewards : null;
    const state = rewards && rewards.autoPowerCrystal;
    return state && typeof state === "object" ? state : null;
  }

  function isBattleRewardPowerCrystalAutoPending() {
    const state = getBattleRewardPowerCrystalAutoState();
    return Boolean(game.state === "won" && state && state.enabled && state.total > 0 && !state.complete);
  }

  function canShowBattleRewardPowerCrystalNextButton() {
    const state = getBattleRewardPowerCrystalAutoState();
    return Boolean(isBattleRewardPowerCrystalAutoPending() && state.remaining > 0 && !game.inventoryMessage);
  }

  function getInventoryPowerCrystalBulkState() {
    const state = game.inventoryPowerCrystalBulk;
    return state && typeof state === "object" ? state : null;
  }

  function isInventoryPowerCrystalBulkPending() {
    const state = getInventoryPowerCrystalBulkState();
    return Boolean(state && state.itemId === "d_power_flag" && state.total > 0 && !state.complete);
  }

  function getResultMessageContentRect() {
    const w = Math.min(880, view.w - 48);
    const h = Math.min(520, view.h - 96);
    return { x: (view.w - w) / 2, y: (view.h - h) / 2, w, h };
  }

  function getBattleRewardRows() {
    const rewards = game.battleRewards && typeof game.battleRewards === "object" ? game.battleRewards : null;
    const entries = rewards && Array.isArray(rewards.granted) && rewards.granted.length
      ? rewards.granted
      : rewards && Array.isArray(rewards.pending)
        ? rewards.pending
        : [];
    return entries.map(formatBattleRewardEntry).filter(Boolean);
  }

  function formatBattleRewardEntry(entry) {
    if (!entry) {
      return null;
    }
    if (entry.type === "currency" && entry.key === "gold") {
      const amount = Math.max(0, Math.floor(entry.amount || 0));
      return {
        icon: "G",
        color: "#d6a83a",
        title: entry.name || "お金",
        amount: typeof formatGold === "function" ? formatGold(amount) : `${amount}G`,
      };
    }
    if (entry.type === "material") {
      const count = Math.max(0, Math.floor(entry.count || entry.amount || 0));
      return {
        icon: "素",
        color: "#8a9b68",
        title: entry.name || entry.key || "素材",
        amount: `x${count}`,
      };
    }
    const count = Math.max(0, Math.floor(entry.count || entry.amount || 0));
    return {
      icon: String(entry.name || entry.key || "?").slice(0, 1),
      color: "#6aa878",
      title: entry.name || entry.key || "アイテム",
      amount: `x${count}`,
    };
  }

  function getSystemMenu() {
    if (!game.systemMenu || typeof game.systemMenu !== "object") {
      game.systemMenu = { open: false, panel: null, confirm: null, targets: [] };
    }
    if (!Array.isArray(game.systemMenu.targets)) {
      game.systemMenu.targets = [];
    }
    if (!Number.isFinite(game.systemMenu.panelScroll)) {
      game.systemMenu.panelScroll = 0;
    }
    if (!Number.isFinite(game.systemMenu.panelScrollMax)) {
      game.systemMenu.panelScrollMax = 0;
    }
    if (!game.systemMenu.equipment || typeof game.systemMenu.equipment !== "object") {
      game.systemMenu.equipment = {};
    }
    if (!game.systemMenu.settings || typeof game.systemMenu.settings !== "object") {
      game.systemMenu.settings = {};
    }
    if (!game.saveUi || typeof game.saveUi !== "object") {
      game.saveUi = {};
    }
    if (typeof game.saveUi.message !== "string") {
      game.saveUi.message = "";
    }
    const equipment = game.systemMenu.equipment;
    if (!equipmentUnitOrder.includes(equipment.selectedUnitId)) {
      equipment.selectedUnitId = "finald";
    }
    if (typeof equipment.presetName !== "string") {
      equipment.presetName = "プリセット1";
    }
    if (equipment.picker && !Number.isFinite(equipment.picker.scroll)) {
      equipment.picker.scroll = 0;
    }
    if (equipment.picker && !Number.isFinite(equipment.picker.scrollMax)) {
      equipment.picker.scrollMax = 0;
    }
    const settings = game.systemMenu.settings;
    if (settings.tab !== "controls") {
      settings.tab = "game";
    }
    if (!Number.isFinite(settings.controlsScroll)) {
      settings.controlsScroll = 0;
    }
    if (!Number.isFinite(settings.controlsScrollMax)) {
      settings.controlsScrollMax = 0;
    }
    if (!Number.isFinite(settings.gameScroll)) {
      settings.gameScroll = 0;
    }
    if (!Number.isFinite(settings.gameScrollMax)) {
      settings.gameScrollMax = 0;
    }
    return game.systemMenu;
  }

  function getGameSettings() {
    if (!game.settings || typeof game.settings !== "object") {
      game.settings = {};
    }
    if (game.settings.tooltipDescriptionMode !== "detail") {
      game.settings.tooltipDescriptionMode = "simple";
    }
    if (typeof game.settings.powerCrystalAutoUse !== "boolean") {
      game.settings.powerCrystalAutoUse = true;
    }
    if (typeof game.settings.mapDebugMode !== "boolean") {
      game.settings.mapDebugMode = false;
    }
    if (keybindTools) {
      game.settings.keybinds = keybindTools.normalizeKeybinds(
        game.settings.keybinds || keybindTools.loadSavedKeybinds()
      );
    }
    return game.settings;
  }

  function isDetailedDescriptionEnabled() {
    return getGameSettings().tooltipDescriptionMode === "detail";
  }

  function isPowerCrystalAutoUseEnabled() {
    return getGameSettings().powerCrystalAutoUse !== false;
  }

  function isMapDebugModeEnabled() {
    return getGameSettings().mapDebugMode === true;
  }

  function getDebugTileMapEntries() {
    const maps = window.HEALER_TILE_MAPS || {};
    const registry = Array.isArray(window.HEALER_DEBUG_TILE_MAPS)
      ? window.HEALER_DEBUG_TILE_MAPS
      : [
        { id: "startTown01", label: "始まりの町" },
        { id: "forestTest01", label: "森テスト1" },
        { id: "forest2", label: "森テスト2" },
        { id: "flower", label: "花マップ" },
      ];
    return registry.filter((entry) => entry && entry.id && maps[entry.id]);
  }

  function getSettingsUi() {
    const menu = getSystemMenu();
    const settings = menu.settings;
    if (settings.tab !== "controls") {
      settings.tab = "game";
    }
    if (keybindTools && !settings.controlsDraft) {
      const active = typeof getKeybinds === "function" ? getKeybinds() : keybindTools.getSettingsKeybinds(getGameSettings());
      settings.controlsDraft = keybindTools.cloneKeybinds(active);
    }
    return settings;
  }

  function getControlsDraft() {
    if (!keybindTools) {
      return {};
    }
    const ui = getSettingsUi();
    ui.controlsDraft = keybindTools.cloneKeybinds(ui.controlsDraft || keybindTools.getSettingsKeybinds(getGameSettings()));
    return ui.controlsDraft;
  }

  function getControlConflicts() {
    return keybindTools ? keybindTools.getConflicts(getControlsDraft()) : {};
  }

  function hasControlConflicts() {
    return keybindTools ? keybindTools.hasConflicts(getControlsDraft()) : false;
  }

  function canShowSystemMenuButton() {
    if (!playerProfile.done) {
      return false;
    }
    if (game.state === "town") {
      return !game.systemMenu.panel && !game.systemMenu.confirm && !townRendererHasBlockingPanel();
    }
    return game.state === "playing" && !game.systemMenu.panel && !game.systemMenu.confirm;
  }

  function townRendererHasBlockingPanel() {
    return Boolean(context.town && (context.town.panel || context.town.story));
  }

  function addSystemMenuTarget(target) {
    getSystemMenu().targets.push(target);
  }

  function drawSystemMenu() {
    const menu = getSystemMenu();
    menu.targets.length = 0;
    const menuButton = getSystemMenuButtonRect();
    if (game.state !== "town" && game.state !== "playing") {
      if (game.state !== "playing") {
        drawTopRightGoldBadge(menuButton);
      }
      return;
    }
    if (game.state === "town" && townRendererHasBlockingPanel()) {
      menu.open = false;
      menu.panel = null;
      menu.confirm = null;
      drawTopRightGoldBadge(menuButton);
      return;
    }
    if (game.state === "playing" && menu.open && !menu.panel && !menu.confirm) {
      drawSystemMenuBackdrop(0.52, "停止中");
    }
    if (menu.panel) {
      const panelType = menu.panel.type;
      drawSystemFullPanel(menu.panel);
      if (game.state !== "playing" && panelType !== "inventory") {
        drawTopRightGoldBadge(menuButton);
      }
      return;
    }
    if (menu.confirm) {
      drawSystemConfirm(menu.confirm);
      if (game.state !== "playing") {
        drawTopRightGoldBadge(menuButton);
      }
      return;
    }
    const showButton = canShowSystemMenuButton() || menu.open;
    if (!showButton) {
      if (game.state !== "playing") {
        drawTopRightGoldBadge(menuButton);
      }
      return;
    }
    drawSystemMenuButton(menuButton, menu.open);
    if (game.state !== "playing") {
      drawTopRightGoldBadge(menuButton);
    }
    if (menu.open) {
      drawSystemMenuDropdown(menuButton);
    }
  }

  function getSystemMenuButtonRect() {
    const size = 38;
    return { x: view.w - size - 16, y: 16, w: size, h: size };
  }

  function drawTopRightGoldBadge(anchorRect) {
    const text = getGoldText();
    const size = getGoldBadgeSize(text);
    const x = Math.max(12, anchorRect.x - size.w - 8);
    const y = anchorRect.y + Math.max(0, (anchorRect.h - size.h) / 2);
    drawGoldBadge(x, y, { text, ...size, mode: "dark" });
  }

  function drawInventoryGoldBadge(panelX, panelY, panelW) {
    const text = getGoldText();
    const size = getGoldBadgeSize(text);
    const closeX = panelX + panelW - 48;
    const x = Math.max(panelX + 220, closeX - size.w - 12);
    drawGoldBadge(x, panelY + 20, { text, ...size, mode: "light" });
  }

  function getGoldBadgeSize(text) {
    ctx.save();
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const w = Math.max(82, Math.ceil(ctx.measureText(String(text || "")).width) + 48);
    ctx.restore();
    return { w, h: 30 };
  }

  function drawGoldBadge(x, y, options = {}) {
    const text = options.text || getGoldText();
    const w = Number.isFinite(options.w) ? options.w : getGoldBadgeSize(text).w;
    const h = Number.isFinite(options.h) ? options.h : 30;
    const light = options.mode === "light";
    ctx.save();
    ctx.fillStyle = light ? "rgba(255,248,224,0.96)" : "rgba(10,16,13,0.76)";
    ctx.strokeStyle = light ? "rgba(180,129,32,0.42)" : "rgba(255,213,107,0.5)";
    ctx.lineWidth = 1.2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    const coinX = x + 17;
    const coinY = y + h / 2;
    ctx.fillStyle = "#d6a83a";
    ctx.strokeStyle = "rgba(88,56,12,0.42)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(coinX, coinY, 9, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff5c8";
    ctx.font = "900 10px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("G", coinX, coinY + 0.5);
    drawFittedSystemText(text, x + 33, y + h / 2, w - 42, 900, 14, 10, light ? "#102018" : "#fff8d7", "left", "middle");
    ctx.restore();
  }

  function drawSystemMenuButton(rect, active) {
    ctx.save();
    ctx.fillStyle = active ? "rgba(247,255,246,0.96)" : "rgba(10,16,13,0.72)";
    ctx.strokeStyle = active ? "rgba(255,213,107,0.9)" : "rgba(247,255,246,0.35)";
    ctx.lineWidth = 1.4;
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = active ? "#172018" : "#f7fff6";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i += 1) {
      const y = rect.y + 11 + i * 8;
      ctx.beginPath();
      ctx.moveTo(rect.x + 10, y);
      ctx.lineTo(rect.x + rect.w - 10, y);
      ctx.stroke();
    }
    ctx.restore();
    addSystemMenuTarget({ action: "toggleSystemMenu", x: rect.x, y: rect.y, w: rect.w, h: rect.h });
  }

  function getSystemMenuItems() {
    if (game.state === "playing") {
      return [
        { label: "装備確認", action: "openSystemPanel", panelType: "equipment", readOnly: true, title: "装備確認", lines: [] },
        { label: "設定", action: "openSystemPanel", panelType: "settings", title: "設定", lines: [] },
        { label: "逃走", action: "openSystemConfirm", title: "逃走", lines: ["この戦闘から逃走しますか？", "逃走処理はまだ未実装です。"] },
      ];
    }
    return [
      { label: "装備変更", action: "openSystemPanel", panelType: "equipment", readOnly: false, title: "装備変更", lines: [] },
      { label: "持ち物確認", action: "openSystemPanel", panelType: "inventory", title: "持ち物確認", lines: [] },
      { label: "設定", action: "openSystemPanel", panelType: "settings", title: "設定", lines: [] },
      { label: "セーブ", action: "openSystemPanel", panelType: "save", title: "セーブ", lines: [] },
      { label: "タイトルへ戻る", action: "openSystemConfirm", title: "タイトルへ戻る", lines: ["タイトル画面へ戻りますか？"], confirmAction: "returnTitle" },
    ];
  }

  function drawSystemMenuDropdown(button) {
    const items = getSystemMenuItems();
    const w = 188;
    const rowH = 38;
    const x = Math.max(12, button.x + button.w - w);
    const y = button.y + button.h + 8;
    const h = items.length * rowH + 12;
    ctx.save();
    ctx.fillStyle = "rgba(10,16,13,0.94)";
    ctx.strokeStyle = "rgba(247,255,246,0.22)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const iy = y + 6 + i * rowH;
      if (i > 0) {
        ctx.strokeStyle = "rgba(247,255,246,0.11)";
        ctx.beginPath();
        ctx.moveTo(x + 10, iy);
        ctx.lineTo(x + w - 10, iy);
        ctx.stroke();
      }
      ctx.fillStyle = item.action === "openSystemConfirm" ? "#ffe0c2" : "#f7fff6";
      ctx.fillText(item.label, x + 16, iy + rowH / 2);
      addSystemMenuTarget({
        action: item.action,
        panelType: item.panelType || null,
        readOnly: Boolean(item.readOnly),
        confirmAction: item.confirmAction || null,
        title: item.title,
        lines: item.lines,
        x,
        y: iy,
        w,
        h: rowH,
      });
    }
    ctx.restore();
  }

  function drawSystemMenuBackdrop(alpha, label = "") {
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(0, 0, view.w, view.h);
    if (label) {
      ctx.fillStyle = "rgba(247,255,246,0.72)";
      ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(label, 18, 18);
    }
    ctx.restore();
  }

  function drawSystemFullPanel(panel) {
    if (panel && panel.type === "equipment") {
      drawEquipmentPanel(panel);
      return;
    }
    if (panel && panel.type === "settings") {
      drawSettingsPanel(panel);
      return;
    }
    if (panel && panel.type === "inventory") {
      drawInventoryPanel(panel);
      return;
    }
    if (panel && panel.type === "save") {
      drawSavePanel(panel);
      return;
    }
    drawGenericSystemPanel(panel);
  }

  function drawGenericSystemPanel(panel) {
    const menu = getSystemMenu();
    drawSystemMenuBackdrop(game.state === "playing" ? 0.52 : 0.28);
    const w = Math.min(680, view.w - 40);
    const h = Math.min(430, view.h - 40);
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;
    ctx.save();
    ctx.fillStyle = "rgba(247,255,246,0.97)";
    ctx.strokeStyle = "rgba(16,32,24,0.36)";
    ctx.lineWidth = 1.2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = "900 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(panel.title || "メニュー", x + 28, y + 26);
    drawSystemCloseButton(x + w - 48, y + 18, "closeSystemPanel");
    const lines = Array.isArray(panel.lines) ? panel.lines : [];
    const content = { x: x + 28, y: y + 82, w: w - 56, h: h - 112 };
    const rowH = 28;
    const contentH = Math.max(0, lines.length * rowH);
    menu.panelScrollMax = Math.max(0, contentH - content.h);
    menu.panelScroll = Math.max(0, Math.min(menu.panelScrollMax, menu.panelScroll || 0));
    ctx.save();
    ctx.beginPath();
    ctx.rect(content.x, content.y, content.w, content.h);
    ctx.clip();
    ctx.font = "500 16px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    for (let i = 0; i < lines.length; i += 1) {
      const lineY = content.y + i * rowH - menu.panelScroll + 18;
      if (lineY >= content.y - rowH && lineY <= content.y + content.h + rowH) {
        ctx.fillText(lines[i], content.x, lineY);
      }
    }
    ctx.restore();
    drawSettingsScrollbar(content, menu.panelScroll, menu.panelScrollMax, {
      scrollState: menu,
      valueKey: "panelScroll",
      maxKey: "panelScrollMax",
    });
    ctx.restore();
  }

  function drawSavePanel(panel) {
    const menu = getSystemMenu();
    drawSystemMenuBackdrop(0.28);
    const w = Math.min(820, view.w - 40);
    const h = Math.min(560, view.h - 40);
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;
    const saves = saveSystem && typeof saveSystem.listSaves === "function" ? saveSystem.listSaves() : [];
    const content = { x: x + 28, y: y + 154, w: w - 56, h: h - 186 };
    const rowH = 62;
    const gap = 10;
    const contentH = saves.length ? saves.length * rowH + Math.max(0, saves.length - 1) * gap : 46;
    menu.panelScrollMax = Math.max(0, contentH - content.h);
    menu.panelScroll = Math.max(0, Math.min(menu.panelScrollMax, menu.panelScroll || 0));

    ctx.save();
    ctx.fillStyle = "rgba(247,255,246,0.97)";
    ctx.strokeStyle = "rgba(16,32,24,0.36)";
    ctx.lineWidth = 1.2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = "900 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(panel.title || "セーブ", x + 28, y + 26);
    drawSystemCloseButton(x + w - 48, y + 18, "closeSystemPanel");

    drawSystemSmallButton(x + 28, y + 78, 118, 34, "新規保存", "createSaveData", {});
    drawSystemSmallButton(x + 154, y + 78, 118, 34, "ファイル保存", "exportSaveFile", {});
    ctx.fillStyle = "#63706a";
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    drawFittedSystemText("ファイル保存はJSONを書き出すだけで、ブラウザ内セーブには追加しません。", x + 28, y + 122, w - 56, 700, 12, 9, "#63706a", "left", "middle");
    if (game.saveUi && game.saveUi.message) {
      drawFittedSystemText(game.saveUi.message, x + 28, y + 142, w - 56, 800, 13, 10, "#315340", "left", "middle");
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(content.x, content.y, content.w, content.h);
    ctx.clip();
    if (!saves.length) {
      ctx.fillStyle = "#63706a";
      ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("セーブデータはまだありません。", content.x, content.y + 8);
    } else {
      for (let i = 0; i < saves.length; i += 1) {
        const save = saves[i];
        const rowY = content.y + i * (rowH + gap) - menu.panelScroll;
        if (rowY + rowH < content.y || rowY > content.y + content.h) {
          continue;
        }
        drawSaveRow(content.x, rowY, content.w, rowH, save);
      }
    }
    ctx.restore();

    drawSettingsScrollbar(content, menu.panelScroll, menu.panelScrollMax, {
      scrollState: menu,
      valueKey: "panelScroll",
      maxKey: "panelScrollMax",
    });
    ctx.restore();
  }

  function drawSaveRow(x, y, w, h, save) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.strokeStyle = "rgba(16,32,24,0.16)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = "900 16px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    drawFittedSystemText(save.name || "セーブデータ", x + 18, y + 16, w - 142, 900, 16, 11, "#102018", "left", "middle");
    ctx.fillStyle = "#63706a";
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(save.savedAtText || "", x + 18, y + 38);
    ctx.restore();
    drawSystemSmallButton(x + w - 104, y + 14, 82, 34, "上書き", "overwriteSaveData", { saveId: save.id });
  }

  function drawInventoryPanel(panel) {
    const menu = getSystemMenu();
    drawSystemMenuBackdrop(game.state === "playing" ? 0.52 : 0.28);
    const w = Math.min(820, view.w - 40);
    const h = Math.min(560, view.h - 40);
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;
    const content = { x: x + 28, y: y + 82, w: w - 56, h: h - 112 };
    const rows = getInventoryRows();
    const contentH = rows.reduce((sum, row) => sum + row.h, 0);
    menu.panelScrollMax = Math.max(0, contentH - content.h);
    menu.panelScroll = Math.max(0, Math.min(menu.panelScrollMax, menu.panelScroll || 0));

    ctx.save();
    ctx.fillStyle = "rgba(247,255,246,0.97)";
    ctx.strokeStyle = "rgba(16,32,24,0.36)";
    ctx.lineWidth = 1.2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = "900 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(panel.title || "持ち物確認", x + 28, y + 26);
    drawSystemCloseButton(x + w - 48, y + 18, "closeSystemPanel");
    drawInventoryGoldBadge(x, y, w);

    ctx.save();
    ctx.beginPath();
    ctx.rect(content.x, content.y, content.w, content.h);
    ctx.clip();
    let cursorY = content.y - menu.panelScroll;
    for (const row of rows) {
      const rowRect = { x: content.x, y: cursorY, w: content.w, h: row.h };
      if (rowRect.y + rowRect.h >= content.y && rowRect.y <= content.y + content.h) {
        drawInventoryRow(rowRect, row);
      }
      cursorY += row.h;
    }
    ctx.restore();
    drawSettingsScrollbar(content, menu.panelScroll, menu.panelScrollMax, {
      scrollState: menu,
      valueKey: "panelScroll",
      maxKey: "panelScrollMax",
    });
    if (game.inventoryMessage) {
      drawInventoryMessage(game.inventoryMessage, content);
    }
    ctx.restore();
  }

  function getInventoryRows() {
    const rows = [];
    rows.push({ type: "section", title: "アイテム", h: 34 });
    const itemRows = getInventoryItemRows();
    if (!itemRows.length) {
      rows.push({ type: "empty", text: "所持アイテムなし", h: 34 });
    } else {
      rows.push(...itemRows);
    }

    rows.push({ type: "section", title: "素材", h: 34 });
    const materialRows = getInventoryMaterialRows();
    if (!materialRows.length) {
      rows.push({ type: "empty", text: "所持素材なし", h: 34 });
    } else {
      rows.push(...materialRows);
    }

    rows.push({ type: "section", title: "装備", h: 34 });
    const equipmentRows = getInventoryEquipmentRows();
    if (!equipmentRows.length) {
      rows.push({ type: "empty", text: "所持装備なし", h: 34 });
    } else {
      rows.push(...equipmentRows);
    }

    rows.push({ type: "section", title: "スキル", h: 34 });
    const skillRows = getInventorySkillRows();
    if (!skillRows.length) {
      rows.push({ type: "empty", text: "所持スキルなし", h: 34 });
    } else {
      rows.push(...skillRows);
    }
    return rows;
  }

  function getInventoryMaterialRows() {
    const materialDefs = MATERIAL_DATA && MATERIAL_DATA.materials ? MATERIAL_DATA.materials : {};
    const counts = game.materialsById && typeof game.materialsById === "object" ? game.materialsById : {};
    return Object.entries(counts)
      .filter(([, count]) => Number.isFinite(count) && count > 0)
      .map(([key, count]) => {
        const material = materialDefs[key] || {};
        return {
          type: "material",
          icon: "素",
          color: "#8a9b68",
          title: material.name || key,
          detail: `所持数: ${Math.floor(count)}`,
          h: 46,
        };
      });
  }

  function getInventoryEquipmentRows() {
    const equipmentItems = EQUIPMENT_DATA && EQUIPMENT_DATA.items ? Object.values(EQUIPMENT_DATA.items) : [];
    const rows = [];
    for (const item of equipmentItems) {
      if (!item || isDefaultEquipmentForInventory(item)) {
        continue;
      }
      const instances = typeof getEquipmentInstancesByItemId === "function"
        ? getEquipmentInstancesByItemId(item.id)
        : getFallbackEquipmentInventoryItems(item);
      for (const instanceItem of instances) {
        if (!instanceItem) {
          continue;
        }
        rows.push({
          type: "equipment",
          icon: getEquipmentIconLabel(instanceItem),
          color: getEquipmentIconColor(instanceItem.slot),
          title: getInventoryEquipmentTitle(instanceItem),
          detail: getInventoryEquipmentDetail(instanceItem),
          h: 46,
        });
      }
    }
    return rows;
  }

  function getFallbackEquipmentInventoryItems(item) {
    const store = game.equipmentInventoryById && typeof game.equipmentInventoryById === "object"
      ? game.equipmentInventoryById
      : {};
    const count = Math.max(0, Math.floor(Number.isFinite(store[item.id]) ? store[item.id] : 0));
    return Array.from({ length: count }, (_, index) => ({
      ...item,
      copyIndex: index + 1,
      copyCount: count,
      upgradeLevel: typeof getEquipmentUpgradeLevel === "function" ? getEquipmentUpgradeLevel(item.id) : 0,
    }));
  }

  function isDefaultEquipmentForInventory(item) {
    return Boolean(item && (String(item.id || "").startsWith("default_") || item.material === "製作不可"));
  }

  function getInventoryEquipmentTitle(item) {
    const name = item && (item.name || item.id) || "装備";
    if (Number.isFinite(item && item.copyIndex) && Number.isFinite(item && item.copyCount) && item.copyCount > 1) {
      return `${name} #${item.copyIndex}`;
    }
    return name;
  }

  function getInventoryEquipmentDetail(item) {
    const parts = [item.rank, getEquipmentSlotName(item.slot), item.weaponType].filter(Boolean);
    const level = Number.isFinite(item && item.upgradeLevel) ? Math.floor(item.upgradeLevel) : 0;
    if (level > 0) {
      parts.push(`+${level}`);
    }
    const statSummary = getEquipmentItemStatSummary(item);
    const equippedText = getEquipmentEquippedText(item);
    if (equippedText) {
      parts.push(equippedText);
    }
    if (statSummary) {
      parts.push(statSummary);
    }
    return parts.join(" / ");
  }

  function getInventorySkillRows() {
    return [
      ...getInventoryPassiveSkillRows(),
      ...getInventoryActiveSkillRows(),
    ];
  }

  function getInventoryPassiveSkillRows() {
    const rows = [];
    const seen = new Set();
    const ownerOrder = getInventorySkillOwnerOrder();
    for (const owner of ownerOrder) {
      const passives = PASSIVE_DATA && PASSIVE_DATA[owner] ? PASSIVE_DATA[owner] : {};
      for (const [key, passive] of Object.entries(passives)) {
        if (!passive || !isOwnedPassiveForDisplay(owner, key)) {
          continue;
        }
        const identity = `passive:${passive.sourceOwner || owner}:${passive.sourceKey || key}`;
        if (seen.has(identity)) {
          continue;
        }
        seen.add(identity);
        rows.push({
          type: "skill",
          icon: "P",
          color: "#5b7c5f",
          title: passive.name || key,
          detail: getInventoryPassiveSkillDetail(owner, key, passive),
          level: 0,
          h: 46,
        });
      }
    }
    return rows;
  }

  function getInventoryActiveSkillRows() {
    const rows = [];
    const seen = new Set();
    const ownerOrder = getInventorySkillOwnerOrder();
    for (const owner of ownerOrder) {
      const skills = SKILL_DATA && SKILL_DATA[owner] ? SKILL_DATA[owner] : {};
      for (const [key, skill] of Object.entries(skills)) {
        if (!skill || skill.category === "通常攻撃" || !isOwnedSkillForDisplay(owner, key)) {
          continue;
        }
        const identity = getSkillIdentity(owner, key, skill);
        if (seen.has(identity)) {
          continue;
        }
        seen.add(identity);
        const sourceOwner = skill.sourceOwner || owner;
        const sourceKey = skill.sourceKey || key;
        const displaySkill = SKILL_DATA && SKILL_DATA[sourceOwner] && SKILL_DATA[sourceOwner][sourceKey]
          ? SKILL_DATA[sourceOwner][sourceKey]
          : skill;
        const level = getSkillLevelForDisplay(sourceOwner, sourceKey);
        rows.push({
          type: "skill",
          icon: getSkillIconLabel(displaySkill),
          color: getSkillIconColor(displaySkill),
          title: displaySkill.name || sourceKey,
          detail: getInventoryActiveSkillDetail(sourceOwner, sourceKey, displaySkill, level),
          level,
          h: 46,
        });
      }
    }
    return rows;
  }

  function getInventorySkillOwnerOrder() {
    const preferred = ["finald", "ulpes", "rihas", "sushia"];
    const owners = new Set(preferred);
    for (const owner of Object.keys(SKILL_DATA || {})) {
      if (owner !== "enemy") {
        owners.add(owner);
      }
    }
    for (const owner of Object.keys(PASSIVE_DATA || {})) {
      if (owner !== "enemy") {
        owners.add(owner);
      }
    }
    return Array.from(owners);
  }

  function getInventoryPassiveSkillDetail(owner, key, passive) {
    const parts = ["パッシブ"];
    const ownerName = getInventorySkillOwnerName(owner);
    if (ownerName) {
      parts.push(ownerName);
    }
    if (passive && passive.rank) {
      parts.unshift(passive.rank);
    }
    const equippedText = getPassiveSkillEquippedText(owner, key, passive);
    if (equippedText) {
      parts.push(equippedText);
    }
    return parts.join(" / ");
  }

  function getInventoryActiveSkillDetail(owner, key, skill, level) {
    const parts = [skill.rank, skill.category].filter(Boolean);
    const normalizedLevel = Math.max(0, Math.floor(Number(level) || 0));
    if (normalizedLevel > 0) {
      parts.push(`Lv.${getSkillLevelRoman(normalizedLevel)}`);
    }
    const equippedText = getSkillEquippedText(owner, key, skill);
    if (equippedText) {
      parts.push(equippedText);
    }
    const condition = getSkillConditionLabel(skill);
    if (condition) {
      parts.push(`条件: ${condition}`);
    }
    return parts.join(" / ");
  }

  function getInventorySkillOwnerName(owner) {
    if (owner === "finald") {
      return typeof getPlayerFirstName === "function" ? getPlayerFirstName() : "アルジュナ";
    }
    const def = CHARACTER_DEFS && CHARACTER_DEFS[owner];
    return def && (def.shortName || def.name) || "";
  }

  function getEquipmentEquippedText(item) {
    return formatEquippedOwnerText(getEquipmentEquippedOwnerNames(item));
  }

  function getSkillEquippedText(owner, key, skill) {
    return formatEquippedOwnerText(getSkillEquippedOwnerNames(owner, key, skill));
  }

  function getPassiveSkillEquippedText(owner, key, passive) {
    return formatEquippedOwnerText(getPassiveSkillEquippedOwnerNames(owner, key, passive));
  }

  function formatEquippedOwnerText(names) {
    return Array.isArray(names) && names.length ? `${names.join("、")}装備中` : "";
  }

  function getEquipmentEquippedOwnerNames(item) {
    const itemRef = getEquipmentRefForDisplay(item);
    if (!itemRef) {
      return [];
    }
    const names = [];
    for (const unitId of equipmentUnitOrder) {
      const unit = getEquipmentDisplayUnit(unitId);
      if (!unit || !unit.equipment) {
        continue;
      }
      const equipped = Object.values(unit.equipment).some((ref) => getEquipmentRefForDisplay(ref) === itemRef);
      if (equipped) {
        names.push(getEquipmentShortName(unit));
      }
    }
    return names;
  }

  function getSkillEquippedOwnerNames(owner, key, skill) {
    if (!skill) {
      return [];
    }
    const identity = getSkillIdentity(owner, key, skill);
    const names = [];
    for (const unitId of equipmentUnitOrder) {
      const unit = getEquipmentDisplayUnit(unitId);
      if (!unit) {
        continue;
      }
      const unitOwner = unit.skillOwner || unit.id;
      const loadout = getEquipmentLoadout(unit);
      let equipped = false;
      if (skill.category === "必殺技") {
        const ultimateKey = loadout.ultimate;
        const ultimate = ultimateKey && SKILL_DATA && SKILL_DATA[unitOwner] && SKILL_DATA[unitOwner][ultimateKey];
        equipped = Boolean(ultimate && getSkillIdentity(unitOwner, ultimateKey, ultimate) === identity);
      } else {
        for (const activeKey of Array.isArray(loadout.active) ? loadout.active : []) {
          const activeSkill = activeKey && SKILL_DATA && SKILL_DATA[unitOwner] && SKILL_DATA[unitOwner][activeKey];
          if (activeSkill && getSkillIdentity(unitOwner, activeKey, activeSkill) === identity) {
            equipped = true;
            break;
          }
        }
      }
      if (equipped) {
        names.push(getEquipmentShortName(unit));
      }
    }
    return names;
  }

  function getPassiveSkillEquippedOwnerNames(owner, key, passive) {
    if (!passive) {
      return [];
    }
    const identity = `passive:${passive.sourceOwner || owner}:${passive.sourceKey || key}`;
    const names = [];
    for (const unitId of equipmentUnitOrder) {
      const unit = getEquipmentDisplayUnit(unitId);
      if (!unit) {
        continue;
      }
      const unitOwner = unit.skillOwner || unit.id;
      const loadout = getEquipmentLoadout(unit);
      const passiveKey = loadout.passive;
      const equippedPassive = passiveKey && PASSIVE_DATA && PASSIVE_DATA[unitOwner] && PASSIVE_DATA[unitOwner][passiveKey];
      const equippedIdentity = equippedPassive ? `passive:${equippedPassive.sourceOwner || unitOwner}:${equippedPassive.sourceKey || passiveKey}` : "";
      if (equippedIdentity === identity) {
        names.push(getEquipmentShortName(unit));
      }
    }
    return names;
  }

  function getInventoryItemRows() {
    const candidates = itemSystem && typeof itemSystem.getItemCandidates === "function"
      ? itemSystem.getItemCandidates()
      : [];
    return candidates
      .map((item) => {
        const inventory = itemSystem && typeof itemSystem.getItemInventoryCount === "function"
          ? itemSystem.getItemInventoryCount(item.id)
          : Number.isFinite(item.inventoryCount) ? item.inventoryCount : 0;
        const equipped = itemSystem && typeof itemSystem.getItemEquippedCount === "function"
          ? itemSystem.getItemEquippedCount(item.id)
          : Number.isFinite(item.equippedCount) ? item.equippedCount : 0;
        const usable = itemSystem && typeof itemSystem.canUseInventoryItem === "function"
          ? itemSystem.canUseInventoryItem(item.id)
          : false;
        return { item, inventory, equipped, usable };
      })
      .filter((entry) => entry.item && (entry.inventory > 0 || entry.equipped > 0))
      .map((entry) => ({
        type: "item",
        icon: entry.item.shortName || "道",
        title: entry.item.name || entry.item.id || "アイテム",
        detail: `持ち物: ${entry.inventory} / 装備中: ${entry.equipped}`,
        itemId: entry.item.id,
        usable: entry.usable,
        openAll: entry.item.id === "d_power_flag" && entry.inventory > 0,
        h: 46,
      }));
  }

  function getGoldText() {
    if (typeof formatGold === "function") {
      return formatGold();
    }
    const value = typeof getGold === "function"
      ? getGold()
      : Number.isFinite(game.gold)
        ? game.gold
        : 0;
    return `${Math.max(0, Math.floor(value))}G`;
  }

  function drawInventoryMessage(message, content) {
    const lines = [
      ...normalizeInventoryMessageLines(message),
      ...buildInventoryResultSkillLines(game.inventoryMessageResult),
    ];
    if (!lines.length) {
      return;
    }
    const lineH = 18;
    const panelW = Math.min(content.w - 28, 760);
    const wrappedLines = wrapInventoryMessageLines(lines, panelW - 40);
    const baseH = 164;
    const panelH = Math.min(content.h - 16, Math.max(210, baseH + Math.max(0, wrappedLines.length - 3) * lineH));
    const x = content.x + (content.w - panelW) / 2;
    const y = Math.max(content.y + 8, Math.min(content.y + content.h - panelH - 8, content.y + (content.h - panelH) / 2));
    ctx.save();
    ctx.fillStyle = "rgba(247,255,246,0.98)";
    ctx.strokeStyle = "rgba(47,109,76,0.42)";
    ctx.lineWidth = 1.4;
    roundRect(x, y, panelW, panelH, 8);
    ctx.fill();
    ctx.stroke();
    addSystemMenuTarget({ action: "absorbSystemClick", x, y, w: panelW, h: panelH });
    ctx.fillStyle = "#2f6d4c";
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("使用結果", x + 20, y + 16);
    const battleRewardCrystalMessage = isBattleRewardPowerCrystalAutoPending();
    const inventoryCrystalMessage = isInventoryPowerCrystalBulkPending();
    const sequentialCrystalMessage = battleRewardCrystalMessage || inventoryCrystalMessage;
    if (!sequentialCrystalMessage) {
      drawSystemCloseButton(x + panelW - 42, y + 10, "clearInventoryMessage");
    }
    const textY = y + 43;
    const textMaxH = Math.max(18, panelH - 88);
    const maxLines = Math.max(1, Math.floor(textMaxH / lineH));
    const visibleLines = wrappedLines.slice(0, maxLines);
    if (wrappedLines.length > visibleLines.length) {
      visibleLines[visibleLines.length - 1] = "...";
    }
    for (let i = 0; i < visibleLines.length; i += 1) {
      const line = visibleLines[i];
      if (!line) {
        continue;
      }
      drawFittedSystemText(line, x + 20, textY + i * lineH, panelW - 40, 800, i === 0 ? 13 : 12, 8, i === 0 ? "#102018" : "#52665b", "left", "top");
    }
    const crystalState = battleRewardCrystalMessage
      ? getBattleRewardPowerCrystalAutoState()
      : inventoryCrystalMessage
        ? getInventoryPowerCrystalBulkState()
        : null;
    const hasNextCrystal = crystalState && crystalState.remaining > 0;
    const nextCrystalAction = battleRewardCrystalMessage ? "openNextBattleRewardCrystal" : "openNextInventoryPowerCrystal";
    const finishCrystalAction = battleRewardCrystalMessage ? "finishBattleRewardCrystalAutoUse" : "finishInventoryPowerCrystalBulkUse";
    drawSystemSmallButton(
      x + panelW / 2 - 48,
      y + panelH - 38,
      96,
      28,
      hasNextCrystal ? "次" : "閉じる",
      sequentialCrystalMessage
        ? hasNextCrystal ? nextCrystalAction : finishCrystalAction
        : "clearInventoryMessage"
    );
    ctx.restore();
  }

  function normalizeInventoryMessageLines(message) {
    const sourceLines = Array.isArray(message) ? message : [message];
    return sourceLines
      .filter((line) => line !== null && line !== undefined)
      .flatMap((line) => String(line).split(/\r?\n/))
      .filter(Boolean);
  }

  function buildInventoryResultSkillLines(result) {
    if (!result || !["acquired", "upgraded"].includes(result.type)) {
      return [];
    }
    const skill = getInventoryResultSkill(result);
    if (!skill) {
      return [];
    }
    const unit = getInventoryResultSkillUnit(result, skill);
    const lines = ["", "スキル説明"];
    const meta = [skill.rank, skill.category, skill.skillType].filter(Boolean).join(" / ");
    if (meta) {
      lines.push(meta);
    }
    const description = formatEquipmentDescriptionText(getSystemTooltipDescription(skill), unit, skill);
    if (description) {
      lines.push(...String(description).split(/\r?\n/).filter(Boolean));
    }
    appendEquipmentRelatedStatuses(lines, description, skill.statusIds, unit);
    return lines;
  }

  function getInventoryResultSkill(result) {
    const owner = result && result.owner;
    const key = result && result.key;
    if (owner && key && SKILL_DATA && SKILL_DATA[owner] && SKILL_DATA[owner][key]) {
      return SKILL_DATA[owner][key];
    }
    const skillId = result && result.skillId;
    if (!skillId || !SKILL_DATA) {
      return null;
    }
    for (const skills of Object.values(SKILL_DATA)) {
      for (const skill of Object.values(skills || {})) {
        if (skill && (skill.id === skillId || skill.key === key)) {
          return skill;
        }
      }
    }
    return null;
  }

  function getInventoryResultSkillUnit(result, skill) {
    const owner = result && result.owner || skill && (skill.owner || skill.sourceOwner);
    if (owner === "common" && skill) {
      const identity = getSkillIdentity("common", result && result.key || skill.key, skill);
      for (const unitId of equipmentUnitOrder) {
        const aliasKey = skill.originalKey || skill.key;
        const aliasSkill = SKILL_DATA && SKILL_DATA[unitId] && SKILL_DATA[unitId][aliasKey];
        if (aliasSkill && getSkillIdentity(unitId, aliasKey, aliasSkill) === identity) {
          return getEquipmentDisplayUnit(unitId) || player;
        }
      }
      return player;
    }
    return owner ? getEquipmentDisplayUnit(owner) : player;
  }

  function wrapInventoryMessageLines(rawLines, maxWidth) {
    const wrapped = [];
    ctx.save();
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    for (const raw of rawLines) {
      const text = String(raw || "");
      if (!text) {
        wrapped.push("");
        continue;
      }
      let line = "";
      for (const char of Array.from(text)) {
        const next = line + char;
        if (line && ctx.measureText(next).width > maxWidth) {
          wrapped.push(line);
          line = char;
        } else {
          line = next;
        }
      }
      if (line) {
        wrapped.push(line);
      }
    }
    ctx.restore();
    return wrapped;
  }

  function drawInventoryRow(rect, row) {
    if (row.type === "section") {
      ctx.fillStyle = "#516157";
      ctx.font = "900 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(row.title, rect.x, rect.y + rect.h / 2);
      return;
    }
    if (row.type === "empty") {
      ctx.fillStyle = "#7b8880";
      ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(row.text, rect.x + 8, rect.y + rect.h / 2);
      return;
    }
    ctx.save();
    ctx.strokeStyle = "rgba(16,32,24,0.12)";
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y + rect.h);
    ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
    ctx.stroke();
    const iconSize = 32;
    const iconX = rect.x + 2;
    const iconY = rect.y + (rect.h - iconSize) / 2;
    ctx.fillStyle = row.color || "#8de2a1";
    roundRect(iconX, iconY, iconSize, iconSize, 7);
    ctx.fill();
    drawFittedSystemText(row.icon || "?", iconX + iconSize / 2, iconY + iconSize / 2, iconSize - 8, 900, 13, 8, "#f7fff6", "center", "middle");
    const actionW = row.type === "item" && row.usable ? row.openAll ? 176 : 76 : row.type === "skill" && row.level > 0 ? 32 : 0;
    drawFittedSystemText(row.title, rect.x + 46, rect.y + 14, rect.w - 58 - actionW, 900, 14, 10, "#102018", "left", "middle");
    drawFittedSystemText(row.detail, rect.x + 46, rect.y + 32, rect.w - 58 - actionW, 700, 11, 8, "#63706a", "left", "middle");
    if (row.type === "item" && row.usable) {
      if (row.openAll) {
        drawSystemSmallButton(rect.x + rect.w - 168, rect.y + 9, 58, 28, "使う", "useInventoryItem", { itemId: row.itemId });
        drawSystemSmallButton(rect.x + rect.w - 104, rect.y + 9, 92, 28, "全て開ける", "useAllInventoryPowerCrystals", { itemId: row.itemId });
      } else {
        drawSystemSmallButton(rect.x + rect.w - 70, rect.y + 9, 58, 28, "使う", "useInventoryItem", { itemId: row.itemId });
      }
    }
    if (row.type === "skill" && row.level > 0) {
      drawSkillLevelBadge(rect.x + rect.w - 8, rect.y + rect.h - 8, row.level);
    }
    ctx.restore();
  }

  function getEquipmentSlotName(slotKey) {
    const slot = getEquipmentSlotDef(slotKey);
    return slot && slot.name ? slot.name : slotKey || "";
  }

  function drawSettingsPanel(panel) {
    drawSystemMenuBackdrop(game.state === "playing" ? 0.52 : 0.28);
    const w = Math.min(920, view.w - 40);
    const h = Math.min(660, view.h - 40);
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;
    const ui = getSettingsUi();
    ctx.save();
    ctx.fillStyle = "rgba(247,255,246,0.98)";
    ctx.strokeStyle = "rgba(16,32,24,0.36)";
    ctx.lineWidth = 1.2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#102018";
    ctx.font = "900 24px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(panel.title || "設定", x + 28, y + 26);
    drawSystemCloseButton(x + w - 48, y + 18, "closeSystemPanel");

    const nav = { x: x + 28, y: y + 82, w: 142, h: h - 112 };
    const content = { x: nav.x + nav.w + 24, y: nav.y, w: w - nav.w - 80, h: nav.h };
    drawSettingsNavItem(nav.x, nav.y, nav.w, 40, "ゲーム", "game", ui.tab === "game");
    drawSettingsNavItem(nav.x, nav.y + 48, nav.w, 40, "操作", "controls", ui.tab === "controls");

    if (ui.tab === "controls") {
      drawSettingsControlsContent(content);
    } else {
      drawSettingsGameContent(content);
    }
    ctx.restore();
  }

  function drawSettingsNavItem(x, y, w, h, label, tab, active) {
    ctx.save();
    ctx.fillStyle = active ? "rgba(16,32,24,0.12)" : "rgba(16,32,24,0.04)";
    ctx.strokeStyle = active ? "rgba(16,32,24,0.2)" : "rgba(16,32,24,0.08)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = "900 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + 16, y + h / 2);
    ctx.restore();
    addSystemMenuTarget({ action: "selectSettingsTab", tab, x, y, w, h });
  }

  function drawSettingsGameContent(content) {
    const ui = getSettingsUi();
    const headerH = 44;
    const rowH = 58;
    const rows = [
      { type: "toggleDetailedDescriptions", label: "詳細説明文の適用" },
      { type: "togglePowerCrystalAutoUse", label: "力の結晶の自動使用" },
      { type: "toggleMapDebugMode", label: "マップデバッグモード" },
    ];
    if (isMapDebugModeEnabled()) {
      rows.push({ type: "debugMapSelector", label: "マップ確認" });
    }
    const listRect = { x: content.x, y: content.y + headerH, w: content.w, h: Math.max(80, content.h - headerH) };
    const listContentH = rows.length * rowH;
    ui.gameScrollMax = Math.max(0, listContentH - listRect.h);
    ui.gameScroll = Math.max(0, Math.min(ui.gameScrollMax, ui.gameScroll || 0));

    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "#102018";
    ctx.fillText("ゲーム", content.x, content.y + 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(listRect.x, listRect.y, listRect.w, listRect.h);
    ctx.clip();
    for (let i = 0; i < rows.length; i += 1) {
      const row = { x: listRect.x, y: listRect.y + i * rowH - ui.gameScroll, w: listRect.w, h: rowH };
      if (row.y + row.h < listRect.y || row.y > listRect.y + listRect.h) {
        continue;
      }
      drawSettingsGameRow(row, rows[i]);
    }
    ctx.restore();
    drawSettingsScrollbar(listRect, ui.gameScroll, ui.gameScrollMax, {
      scrollState: ui,
      valueKey: "gameScroll",
      maxKey: "gameScrollMax",
    });
  }

  function drawSettingsGameRow(row, entry) {
    ctx.strokeStyle = "rgba(16,32,24,0.16)";
    ctx.beginPath();
    ctx.moveTo(row.x, row.y + row.h);
    ctx.lineTo(row.x + row.w, row.y + row.h);
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(entry.label, row.x, row.y + row.h / 2);
    if (entry.type === "toggleDetailedDescriptions") {
      drawSettingsToggle(row.x + row.w - 96, row.y + 12, 86, 34, isDetailedDescriptionEnabled(), "toggleDetailedDescriptions");
    } else if (entry.type === "togglePowerCrystalAutoUse") {
      drawSettingsToggle(row.x + row.w - 96, row.y + 12, 86, 34, isPowerCrystalAutoUseEnabled(), "togglePowerCrystalAutoUse");
    } else if (entry.type === "toggleMapDebugMode") {
      drawSettingsToggle(row.x + row.w - 96, row.y + 12, 86, 34, isMapDebugModeEnabled(), "toggleMapDebugMode");
    } else if (entry.type === "debugMapSelector") {
      drawDebugMapSelector(row);
    }
  }

  function drawDebugMapSelector(row) {
    const maps = getDebugTileMapEntries();
    const gap = 8;
    const buttonCount = Math.max(1, maps.length);
    const labelW = Math.min(150, row.w * 0.28);
    const startX = row.x + labelW;
    const availableW = Math.max(120, row.w - labelW);
    const buttonW = Math.max(76, Math.min(118, (availableW - gap * (buttonCount - 1)) / buttonCount));
    const buttonY = row.y + 12;
    for (let i = 0; i < maps.length; i += 1) {
      const entry = maps[i];
      const x = startX + i * (buttonW + gap);
      drawSettingsMapButton(x, buttonY, buttonW, 34, entry.label || entry.id, entry.id, town && town.mapId === entry.id);
    }
  }

  function drawSettingsControlsContent(content) {
    if (!keybindTools) {
      ctx.fillStyle = "#102018";
      ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("キー設定を読み込めませんでした。", content.x, content.y + 6);
      return;
    }
    const ui = getSettingsUi();
    const draft = getControlsDraft();
    const conflicts = getControlConflicts();
    const actions = keybindTools.getActionDefinitions();
    const sectionOrder = keybindTools.getSectionOrder();
    const headerH = 72;
    const sectionH = 22;
    const rowH = 30;
    const listRect = { x: content.x, y: content.y + headerH, w: content.w, h: Math.max(80, content.h - headerH) };
    const listContentH = sectionOrder.length * sectionH + actions.length * rowH;
    ui.controlsScrollMax = Math.max(0, listContentH - listRect.h);
    ui.controlsScroll = Math.max(0, Math.min(ui.controlsScrollMax, ui.controlsScroll || 0));
    let y = content.y;
    let hoverConflict = null;

    ctx.fillStyle = "#102018";
    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("操作", content.x, y + 2);

    const buttonY = y + 34;
    drawSettingsCommandButton(content.x, buttonY, 72, 30, "保存", "saveKeybindDraft", !hasControlConflicts());
    drawSettingsCommandButton(content.x + 84, buttonY, 116, 30, "初期設定に戻す", "resetKeybindDraftDefaults", true);
    drawSettingsCommandButton(content.x + 212, buttonY, 104, 30, "保存前に戻す", "restoreKeybindDraft", true);
    if (ui.message) {
      drawFittedSystemText(ui.message, content.x + 330, buttonY + 15, Math.max(100, content.w - 330), 800, 12, 9, "#3f4c45", "left", "middle");
    }

    y = listRect.y - ui.controlsScroll;
    ctx.save();
    ctx.beginPath();
    ctx.rect(listRect.x, listRect.y, listRect.w, listRect.h);
    ctx.clip();
    for (const section of sectionOrder) {
      ctx.fillStyle = "#516157";
      ctx.font = "900 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      if (y + sectionH >= listRect.y && y <= listRect.y + listRect.h) {
        ctx.fillText(keybindTools.getSectionLabel(section), content.x, y + sectionH / 2);
      }
      y += sectionH;

      for (const action of actions.filter((entry) => entry.group === section)) {
        const row = { x: content.x, y, w: content.w, h: rowH };
        const binding = draft[action.id];
        const conflictIds = conflicts[action.id] || [];
        const capture = ui.controlsCapture && ui.controlsCapture.actionId === action.id;
        if (row.y + row.h >= listRect.y && row.y <= listRect.y + listRect.h) {
          drawSettingsControlRow(row, action, binding, conflictIds, capture, listRect);
          const markRect = getControlConflictMarkRect(row);
          if (conflictIds.length && isMouseInRect(markRect)) {
            hoverConflict = {
              x: markRect.x,
              y: markRect.y,
              lines: conflictIds
                .map((id) => keybindTools.getAction(id))
                .filter(Boolean)
                .map((entry) => entry.label),
            };
          }
        }
        y += rowH;
      }
    }
    ctx.restore();
    drawSettingsScrollbar(listRect, ui.controlsScroll, ui.controlsScrollMax, {
      scrollState: ui,
      valueKey: "controlsScroll",
      maxKey: "controlsScrollMax",
    });
    if (hoverConflict) {
      drawControlConflictTooltip(hoverConflict.x, hoverConflict.y, hoverConflict.lines);
    }
  }

  function drawSettingsCommandButton(x, y, w, h, label, action, enabled) {
    ctx.save();
    ctx.fillStyle = enabled ? "#102018" : "rgba(16,32,24,0.12)";
    ctx.strokeStyle = enabled ? "#102018" : "rgba(16,32,24,0.24)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();
    drawFittedSystemText(label, x + w / 2, y + h / 2, w - 10, 800, 12, 8, enabled ? "#f7fff6" : "#68746d", "center", "middle");
    ctx.restore();
    if (enabled) {
      addSystemMenuTarget({ action, x, y, w, h });
    }
  }

  function drawSettingsControlRow(row, action, binding, conflictIds, capture, clipRect) {
    ctx.save();
    ctx.strokeStyle = "rgba(16,32,24,0.12)";
    ctx.beginPath();
    ctx.moveTo(row.x, row.y + row.h);
    ctx.lineTo(row.x + row.w, row.y + row.h);
    ctx.stroke();

    ctx.fillStyle = "#102018";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(action.label, row.x, row.y + row.h / 2);

    const markRect = getControlConflictMarkRect(row);
    if (conflictIds.length) {
      drawControlConflictMark(markRect);
    }

    const buttonW = Math.min(156, Math.max(112, row.w * 0.24));
    const buttonH = Math.max(18, Math.min(24, row.h - 4));
    const button = { x: row.x + row.w - buttonW, y: row.y + (row.h - buttonH) / 2, w: buttonW, h: buttonH };
    ctx.fillStyle = capture ? "#fff2bd" : "rgba(16,32,24,0.08)";
    ctx.strokeStyle = capture ? "rgba(194,143,38,0.85)" : "rgba(16,32,24,0.26)";
    ctx.lineWidth = 1.2;
    roundRect(button.x, button.y, button.w, button.h, 6);
    ctx.fill();
    ctx.stroke();
    const label = capture ? "入力待ち..." : keybindTools.bindingLabel(binding);
    drawFittedSystemText(label, button.x + button.w / 2, button.y + button.h / 2, button.w - 12, 800, 12, 8, "#102018", "center", "middle");
    ctx.restore();
    if (!clipRect || rectIntersects(button, clipRect)) {
      addSystemMenuTarget({ action: "startKeybindCapture", actionId: action.id, x: button.x, y: button.y, w: button.w, h: button.h });
    }
  }

  function drawSettingsScrollbar(rect, scroll, maxScroll, dragOptions = null) {
    if (maxScroll <= 0) {
      return;
    }
    const trackW = 6;
    const track = { x: rect.x + rect.w - trackW, y: rect.y + 4, w: trackW, h: rect.h - 8 };
    const knobH = Math.max(34, track.h * (rect.h / (rect.h + maxScroll)));
    const knobY = track.y + (track.h - knobH) * (scroll / maxScroll);
    const knob = { x: track.x, y: knobY, w: track.w, h: knobH };
    ctx.save();
    ctx.fillStyle = "rgba(16,32,24,0.1)";
    roundRect(track.x, track.y, track.w, track.h, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(16,32,24,0.42)";
    roundRect(track.x, knobY, track.w, knobH, 3);
    ctx.fill();
    ctx.restore();
    if (dragOptions && dragOptions.scrollState) {
      addSystemMenuTarget({
        action: "startScrollbarDrag",
        x: track.x - 8,
        y: track.y,
        w: track.w + 16,
        h: track.h,
        scrollState: dragOptions.scrollState,
        valueKey: dragOptions.valueKey || "scroll",
        maxKey: dragOptions.maxKey || "scrollMax",
        track,
        knob,
      });
    }
  }

  function rectIntersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function intersectRects(a, b) {
    const x = Math.max(a.x, b.x);
    const y = Math.max(a.y, b.y);
    const right = Math.min(a.x + a.w, b.x + b.w);
    const bottom = Math.min(a.y + a.h, b.y + b.h);
    return {
      x,
      y,
      w: Math.max(0, right - x),
      h: Math.max(0, bottom - y),
    };
  }

  function getControlConflictMarkRect(row) {
    return { x: row.x + row.w - 186, y: row.y + row.h / 2 - 9, w: 18, h: 18 };
  }

  function drawControlConflictMark(rect) {
    ctx.save();
    ctx.fillStyle = "#c74032";
    ctx.beginPath();
    ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w / 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff8f2";
    ctx.font = "900 13px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", rect.x + rect.w / 2, rect.y + rect.h / 2 + 0.5);
    ctx.restore();
  }

  function drawControlConflictTooltip(x, y, lines) {
    const title = "被り:";
    const values = Array.isArray(lines) && lines.length ? lines : ["不明"];
    ctx.save();
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const tooltipW = Math.min(260, Math.max(150, ...values.map((line) => ctx.measureText(line).width + 56)));
    const tooltipH = 30 + values.length * 20;
    const tx = Math.min(view.w - tooltipW - 12, x - tooltipW - 10);
    const ty = Math.min(view.h - tooltipH - 12, y - 6);
    ctx.fillStyle = "rgba(16,32,24,0.96)";
    ctx.strokeStyle = "rgba(247,255,246,0.18)";
    ctx.lineWidth = 1;
    roundRect(tx, ty, tooltipW, tooltipH, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd2c8";
    ctx.font = "900 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title, tx + 12, ty + 9);
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    for (let i = 0; i < values.length; i += 1) {
      ctx.fillText(values[i], tx + 48, ty + 9 + i * 20);
    }
    ctx.restore();
  }

  function isMouseInRect(rect) {
    return input.mouse.x >= rect.x && input.mouse.x <= rect.x + rect.w && input.mouse.y >= rect.y && input.mouse.y <= rect.y + rect.h;
  }

  function drawSettingsToggle(x, y, w, h, enabled, action = "toggleDetailedDescriptions") {
    ctx.save();
    ctx.fillStyle = enabled ? "#246b4a" : "rgba(16,32,24,0.12)";
    ctx.strokeStyle = enabled ? "#1c573c" : "rgba(16,32,24,0.28)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, h / 2);
    ctx.fill();
    ctx.stroke();
    const knobSize = h - 8;
    const knobX = enabled ? x + w - knobSize - 4 : x + 4;
    ctx.fillStyle = "#f7fff6";
    roundRect(knobX, y + 4, knobSize, knobSize, knobSize / 2);
    ctx.fill();
    ctx.fillStyle = enabled ? "#f7fff6" : "#102018";
    ctx.font = "900 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(enabled ? "ON" : "OFF", enabled ? x + 25 : x + w - 25, y + h / 2);
    ctx.restore();
    addSystemMenuTarget({ action, x, y, w, h });
  }

  function drawSettingsMapButton(x, y, w, h, label, mapId, active) {
    ctx.save();
    ctx.fillStyle = active ? "#246b4a" : "rgba(16,32,24,0.07)";
    ctx.strokeStyle = active ? "#1c573c" : "rgba(16,32,24,0.22)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 7);
    ctx.fill();
    ctx.stroke();
    drawFittedSystemText(label, x + w / 2, y + h / 2, w - 14, 900, 12, 8, active ? "#f7fff6" : "#102018", "center", "middle");
    ctx.restore();
    addSystemMenuTarget({ action: "switchDebugTownMap", mapId, x, y, w, h });
  }

  function drawEquipmentPanel(panel) {
    drawSystemMenuBackdrop(game.state === "playing" ? 0.52 : 0.28);
    const rect = getEquipmentPanelRect();
    const ui = getSystemMenu().equipment;
    const unit = getEquipmentDisplayUnit(ui.selectedUnitId) || getEquipmentDisplayUnit("finald");
    const readOnly = Boolean(panel.readOnly);
    const layout = getEquipmentPanelLayout(rect);
    equipmentTooltipTargets.length = 0;

    ctx.save();
    ctx.fillStyle = "rgba(247,255,246,0.985)";
    ctx.strokeStyle = "rgba(16,32,24,0.34)";
    ctx.lineWidth = 1.2;
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#102018";
    ctx.font = "900 22px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(panel.title || (readOnly ? "装備確認" : "装備変更"), rect.x + 24, rect.y + 20);
    if (readOnly) {
      ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillStyle = "#6b756f";
      ctx.fillText("確認専用", rect.x + 128, rect.y + 27);
    }
    drawSystemCloseButton(rect.x + rect.w - 46, rect.y + 16, "closeSystemPanel");
    drawEquipmentPresetButton(layout.preset, readOnly);
    drawEquipmentUnitList(layout.nav, unit);
    if (unit) {
      drawEquipmentStage(layout.stage, unit, readOnly);
      drawEquipmentStats(layout.stats, unit);
    }
    drawEquipmentMessage(rect);
    if (ui.picker || ui.preset) {
      addSystemMenuTarget({ action: "closeEquipmentSubwindow", x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    }
    if (ui.picker && unit) {
      drawEquipmentPicker(layout, unit, readOnly);
    }
    if (ui.preset && unit) {
      drawEquipmentPresetWindow(layout, unit, readOnly);
    }
    if (ui.confirm) {
      drawEquipmentConfirmWindow(layout, ui.confirm);
    }
    if (!ui.confirm) {
      drawEquipmentHoverTooltip();
    }
    ctx.restore();
  }

  function getEquipmentPanelRect() {
    const w = Math.min(1120, Math.max(320, view.w - 28));
    const h = Math.min(700, Math.max(360, view.h - 28));
    return {
      x: (view.w - w) / 2,
      y: (view.h - h) / 2,
      w,
      h,
    };
  }

  function getEquipmentPanelLayout(rect) {
    const pad = 22;
    const top = rect.y + 66;
    const bottom = rect.y + rect.h - 24;
    const navW = Math.min(132, Math.max(104, rect.w * 0.13));
    const statsW = Math.min(286, Math.max(220, rect.w * 0.27));
    const nav = { x: rect.x + pad, y: top, w: navW, h: bottom - top };
    const stats = { x: rect.x + rect.w - pad - statsW, y: top, w: statsW, h: bottom - top };
    const contentX = nav.x + nav.w + 18;
    const contentW = stats.x - contentX - 18;
    const skillH = rect.h >= 610 ? 128 : 108;
    const skills = { x: contentX, y: bottom - skillH, w: contentW, h: skillH };
    const stage = { x: contentX, y: top, w: contentW, h: Math.max(190, skills.y - top - 16) };
    const preset = { x: Math.min(stats.x - 128, rect.x + rect.w - pad - statsW - 150), y: rect.y + 20, w: 126, h: 32 };
    return { nav, stage, skills, stats, preset, rect };
  }

  function getEquipmentDisplayUnit(unitId) {
    const live = getLiveEquipmentUnit(unitId);
    if (live) {
      if (itemSystem && typeof itemSystem.getCharacterItem === "function") {
        live.item = itemSystem.getCharacterItem(unitId);
      }
      return live;
    }
    const def = getEquipmentCharacterDef(unitId);
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
      mood: def.id === "finald" ? null : MOOD_BASELINE,
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
    unit.item = itemSystem && typeof itemSystem.getCharacterItem === "function"
      ? itemSystem.getCharacterItem(unitId)
      : null;
    unit.hp = getStoredEquipmentResource(unit, "partyHpById", "hp", "maxHp");
    unit.mp = getStoredEquipmentResource(unit, "partyMpById", "mp", "maxMp");
    return unit;
  }

  function getStoredEquipmentResource(unit, storeKey, currentKey, maxKey) {
    if (!unit || !unit.id) {
      return 0;
    }
    const max = getEquipmentResourceMax(unit, maxKey);
    const store = game && game[storeKey] && typeof game[storeKey] === "object" ? game[storeKey] : null;
    const saved = store ? store[unit.id] : undefined;
    const value = Number.isFinite(saved)
      ? saved
      : Number.isFinite(unit[currentKey]) ? unit[currentKey] : max;
    return Math.max(0, Math.min(max, value));
  }

  function getLiveEquipmentUnit(unitId) {
    if (player && player.id === unitId) {
      return player;
    }
    return Array.isArray(party) ? party.find((member) => member && member.id === unitId) || null : null;
  }

  function getEquipmentCharacterDef(unitId) {
    if (unitId === "finald") {
      return CHARACTER_DEFS && CHARACTER_DEFS.player ? CHARACTER_DEFS.player : null;
    }
    const allies = CHARACTER_DEFS && Array.isArray(CHARACTER_DEFS.allies) ? CHARACTER_DEFS.allies : [];
    return allies.find((member) => member.id === unitId) || null;
  }

  function drawEquipmentPresetButton(rect, readOnly) {
    ctx.save();
    ctx.fillStyle = readOnly ? "rgba(16,32,24,0.07)" : "#102018";
    ctx.strokeStyle = readOnly ? "rgba(16,32,24,0.2)" : "#102018";
    ctx.lineWidth = 1;
    roundRect(rect.x, rect.y, rect.w, rect.h, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = readOnly ? "#516058" : "#f7fff6";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("プリセット", rect.x + rect.w / 2, rect.y + rect.h / 2 + 0.5);
    ctx.restore();
    addSystemMenuTarget({ action: "openEquipmentPreset", x: rect.x, y: rect.y, w: rect.w, h: rect.h });
  }

  function drawEquipmentUnitList(rect, selectedUnit) {
    const rowH = 46;
    ctx.save();
    ctx.fillStyle = "rgba(16,32,24,0.06)";
    ctx.strokeStyle = "rgba(16,32,24,0.14)";
    ctx.lineWidth = 1;
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < equipmentUnitOrder.length; i += 1) {
      const unit = getEquipmentDisplayUnit(equipmentUnitOrder[i]);
      const y = rect.y + 12 + i * rowH;
      const active = unit && selectedUnit && unit.id === selectedUnit.id;
      ctx.fillStyle = active ? "#102018" : "rgba(255,255,255,0.64)";
      ctx.strokeStyle = active ? "#102018" : "rgba(16,32,24,0.12)";
      roundRect(rect.x + 10, y, rect.w - 20, 36, 7);
      ctx.fill();
      ctx.stroke();
      drawFittedSystemText(getEquipmentShortName(unit), rect.x + 22, y + 18, rect.w - 44, 800, 14, 10, active ? "#f7fff6" : "#102018", "left");
      if (unit) {
        addSystemMenuTarget({ action: "selectEquipmentUnit", unitId: unit.id, x: rect.x + 10, y, w: rect.w - 20, h: 36 });
      }
    }
    ctx.restore();
  }

  function drawEquipmentStage(rect, unit, readOnly) {
    ctx.save();
    ctx.fillStyle = "rgba(16,32,24,0.045)";
    ctx.strokeStyle = "rgba(16,32,24,0.12)";
    ctx.lineWidth = 1;
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();

    const centerX = rect.x + rect.w / 2;
    const artSize = Math.min(84, rect.h * 0.21);
    const artY = rect.y + Math.max(74, rect.h * 0.27);
    drawEquipmentCharacterArt(unit, centerX, artY, artSize);

    const slotW = Math.min(100, Math.max(78, rect.w * 0.19));
    const slotH = 54;
    const gapY = Math.min(18, Math.max(10, rect.h * 0.045));
    const sideOffset = Math.max(76, Math.min(102, rect.w * 0.16));
    const leftX = Math.max(rect.x + slotW + 24, centerX - slotW - sideOffset);
    const rightX = Math.min(rect.x + rect.w - slotW - 16, centerX + sideOffset);
    const startY = rect.y + Math.max(28, rect.h * 0.14);
    const leftSlotRects = [];
    for (let i = 0; i < equipmentSlotLayout.left.length; i += 1) {
      const slotKey = equipmentSlotLayout.left[i];
      const slotRect = { x: leftX, y: startY + i * (slotH + gapY), w: slotW, h: slotH };
      leftSlotRects.push(slotRect);
      drawEquipmentSlot(slotRect, unit, slotKey, readOnly);
    }
    for (let i = 0; i < equipmentSlotLayout.right.length; i += 1) {
      const slotKey = equipmentSlotLayout.right[i];
      drawEquipmentSlot({ x: rightX, y: startY + i * (slotH + gapY), w: slotW, h: slotH }, unit, slotKey, readOnly);
    }
    const bottomLeft = leftSlotRects[leftSlotRects.length - 1];
    const weaponRect = {
      x: Math.max(rect.x + 12, bottomLeft.x - slotW - 12),
      y: bottomLeft.y,
      w: slotW,
      h: slotH,
    };
    const itemRect = {
      x: weaponRect.x,
      y: Math.max(rect.y + 12, weaponRect.y - slotH - gapY),
      w: slotW,
      h: slotH,
    };
    drawEquipmentCharacterItemSlot(itemRect, unit, readOnly);
    drawEquipmentSlot(weaponRect, unit, equipmentSlotLayout.weapon, readOnly);
    const skillAreaH = unit && unit.id === "finald"
      ? Math.min(166, Math.max(150, rect.h * 0.34))
      : Math.min(126, Math.max(112, rect.h * 0.27));
    const skillAreaY = Math.max(artY + artSize * 1.68, rect.y + rect.h - skillAreaH - 122);
    const skillRect = {
      x: rect.x + 16,
      y: Math.min(skillAreaY, rect.y + rect.h - skillAreaH - 14),
      w: rect.w - 32,
      h: skillAreaH,
    };
    drawEquipmentSkillSlots(skillRect, unit, readOnly);
    ctx.restore();
  }

  function drawEquipmentCharacterArt(unit, x, y, size) {
    const image = getEquipmentCharacterArtImage(unit);
    if (isSystemImageReady(image)) {
      const height = size * 2.45;
      const width = height * image.naturalWidth / image.naturalHeight;
      ctx.save();
      const previousSmoothing = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, x - width / 2, y + size * 1.42 - height, width, height);
      ctx.imageSmoothingEnabled = previousSmoothing;
      ctx.restore();
      return;
    }
    const color = unit && unit.color ? unit.color : "#57c7c9";
    ctx.save();
    ctx.strokeStyle = "#102018";
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.58, size * 0.29, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = lightenColor(color, 0.28);
    roundRect(x - size * 0.31, y - size * 0.24, size * 0.62, size * 0.9, size * 0.2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y - size * 0.02);
    ctx.lineTo(x - size * 0.72, y + size * 0.36);
    ctx.moveTo(x + size * 0.3, y - size * 0.02);
    ctx.lineTo(x + size * 0.72, y + size * 0.36);
    ctx.moveTo(x - size * 0.15, y + size * 0.65);
    ctx.lineTo(x - size * 0.36, y + size * 1.35);
    ctx.moveTo(x + size * 0.15, y + size * 0.65);
    ctx.lineTo(x + size * 0.36, y + size * 1.35);
    ctx.stroke();
    drawEquipmentArtWeapon(unit, x, y, size);
    ctx.restore();
  }

  function drawEquipmentArtWeapon(unit, x, y, size) {
    const id = unit && unit.id;
    ctx.save();
    ctx.lineCap = "round";
    if (id === "ulpes") {
      ctx.strokeStyle = "#7e8b91";
      ctx.lineWidth = Math.max(3, size * 0.07);
      ctx.beginPath();
      ctx.moveTo(x + size * 0.58, y + size * 0.76);
      ctx.lineTo(x + size * 0.95, y - size * 0.22);
      ctx.stroke();
    } else if (id === "rihas") {
      ctx.fillStyle = "#f7b05e";
      ctx.strokeStyle = "#3a2115";
      ctx.lineWidth = Math.max(1, size * 0.03);
      roundRect(x + size * 0.5, y + size * 0.22, size * 0.26, size * 0.2, size * 0.08);
      ctx.fill();
      ctx.stroke();
      roundRect(x - size * 0.76, y + size * 0.22, size * 0.26, size * 0.2, size * 0.08);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#6a4a2e";
      ctx.lineWidth = Math.max(3, size * 0.06);
      ctx.beginPath();
      ctx.moveTo(x + size * 0.52, y + size * 0.96);
      ctx.lineTo(x + size * 0.78, y - size * 0.36);
      ctx.stroke();
      ctx.fillStyle = id === "sushia" ? "#e3bdff" : "#a8fbff";
      ctx.beginPath();
      ctx.arc(x + size * 0.8, y - size * 0.42, size * 0.1, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEquipmentSlot(rect, unit, slotKey, readOnly) {
    const slot = getEquipmentSlotDef(slotKey);
    const item = typeof getEquippedSlotItem === "function" ? getEquippedSlotItem(unit, slotKey) : null;
    ctx.save();
    ctx.fillStyle = item ? "#ffffff" : "rgba(255,255,255,0.58)";
    ctx.strokeStyle = readOnly ? "rgba(16,32,24,0.16)" : "rgba(16,32,24,0.28)";
    ctx.lineWidth = 1.1;
    roundRect(rect.x, rect.y, rect.w, rect.h, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#728077";
    ctx.font = "700 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(slot ? slot.name : slotKey, rect.x + 10, rect.y + 7);
    drawFittedSystemText(item ? item.name : "未装備", rect.x + 10, rect.y + 31, rect.w - 20, 800, 13, 9, item ? "#102018" : "#8a948f", "left");
    ctx.restore();
    addSystemMenuTarget({
      action: "openEquipmentPicker",
      kind: "equipment",
      slotKey,
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
    });
  }

  function drawEquipmentCharacterItemSlot(rect, unit, readOnly) {
    const item = getEquipmentCharacterItem(unit);
    ctx.save();
    ctx.fillStyle = item ? "#ffffff" : "rgba(255,255,255,0.58)";
    ctx.strokeStyle = readOnly ? "rgba(16,32,24,0.16)" : "rgba(16,32,24,0.28)";
    ctx.lineWidth = 1.1;
    roundRect(rect.x, rect.y, rect.w, rect.h, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#728077";
    ctx.font = "700 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("アイテム", rect.x + 10, rect.y + 7);
    const label = item ? `${item.name || item.id}${Number.isFinite(item.count) ? ` x${item.count}` : ""}` : "未所持";
    drawFittedSystemText(label, rect.x + 10, rect.y + 31, rect.w - 20, 800, 13, 9, item ? "#102018" : "#8a948f", "left");
    ctx.restore();
    registerEquipmentTooltip(rect, buildCharacterItemTooltip(item));
    addSystemMenuTarget({
      action: "openEquipmentPicker",
      kind: "item",
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
    });
  }

  function getEquipmentSlotDef(slotKey) {
    const slots = EQUIPMENT_DATA && Array.isArray(EQUIPMENT_DATA.slots) ? EQUIPMENT_DATA.slots : [];
    return slots.find((slot) => slot.key === slotKey) || null;
  }

  function drawEquipmentSkillSlots(rect, unit, readOnly) {
    const loadout = getEquipmentLoadout(unit);
    const owner = unit.skillOwner || unit.id;
    const passive = getPassiveData(owner, loadout.passive);
    const limit = typeof getActiveSlotLimit === "function" ? getActiveSlotLimit(unit) : 5;
    const active = Array.isArray(loadout.active) ? loadout.active : [];
    const configurableActive = active.filter((key) => key && key !== "attack");
    const showThirdRow = unit && unit.id === "finald";
    const maxConfigurableSlots = showThirdRow ? 9 : 4;
    const configurableLimit = Math.min(maxConfigurableSlots, Math.max(0, limit - (SKILL_DATA && SKILL_DATA[owner] && SKILL_DATA[owner].attack ? 1 : 0)));
    const normalSkill = getUnitNormalAttackSkill(unit);
    const ultimateEntry = getEquipmentUltimateSkillEntry(unit);
    const ultimateSkill = ultimateEntry.skill;
    const cols = 5;
    const rows = showThirdRow ? 3 : 2;
    const entries = Array.from({ length: rows * cols }, (_, index) => ({
      emptyCell: true,
      hidden: Math.floor(index / cols) === 0,
    }));
    entries[1] = { badge: "P", label: passive ? passive.name : "未装備", kind: "passiveSkill", locked: false, tooltip: buildPassiveCandidateTooltip(passive, unit) };
    entries[3] = { badge: "必", label: ultimateSkill ? ultimateSkill.name : "必殺技", kind: "ultimateSkill", locked: false, unavailable: Boolean(ultimateSkill && !canEquipSkillWithCurrentWeapon(unit, ultimateSkill)), level: ultimateEntry.key ? getSkillLevelForDisplay(owner, ultimateEntry.key) : 0, tooltip: buildSkillCandidateTooltip(ultimateSkill, unit) };
    entries[5] = { badge: "N", label: normalSkill ? normalSkill.name : "通常攻撃", locked: true, tooltip: buildSkillCandidateTooltip(normalSkill, unit) };
    for (let i = 0; i < configurableLimit; i += 1) {
      const key = configurableActive[i] || null;
      const skill = key && SKILL_DATA && SKILL_DATA[owner] ? SKILL_DATA[owner][key] : null;
      const entryIndex = i < 4 ? 6 + i : 10 + (i - 4);
      entries[entryIndex] = {
        badge: `${i + 1}`,
        label: skill ? skill.name : "空き",
        kind: "activeSkill",
        slotIndex: i,
        locked: false,
        unavailable: Boolean(skill && !canEquipSkillWithCurrentWeapon(unit, skill)),
        level: key ? getSkillLevelForDisplay(owner, key) : 0,
        tooltip: buildSkillCandidateTooltip(skill, unit),
      };
    }
    const gap = 7;
    const headerY = rect.y + 6;
    const slotY = rect.y + 30;
    const slotH = Math.max(34, Math.min(42, (rect.h - 34 - (rows - 1) * gap) / rows));
    const cellW = Math.max(46, (rect.w - 24 - gap * (cols - 1)) / cols);

    ctx.save();
    ctx.fillStyle = "rgba(16,32,24,0.045)";
    ctx.strokeStyle = "rgba(16,32,24,0.12)";
    ctx.lineWidth = 1;
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("スキル枠", rect.x + 12, headerY);

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const slotRect = {
        x: rect.x + 12 + col * (cellW + gap),
        y: slotY + row * (slotH + 7),
        w: cellW,
        h: slotH,
      };
      if (entry.hidden) {
        continue;
      }
      if (entry.emptyCell) {
        drawEquipmentEmptySkillCell(slotRect);
        continue;
      }
      drawEquipmentSkillSlot(slotRect, entry.badge, entry.label, readOnly, entry.locked, entry.level || 0, entry.unavailable);
      registerEquipmentTooltip(slotRect, entry.tooltip);
      if (!entry.locked) {
        addSystemMenuTarget({
          action: "openEquipmentPicker",
          kind: entry.kind,
          slotIndex: entry.slotIndex,
          x: slotRect.x,
          y: slotRect.y,
          w: slotRect.w,
          h: slotRect.h,
        });
      }
    }
    ctx.restore();
  }

  function drawEquipmentEmptySkillCell(rect) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.26)";
    ctx.strokeStyle = "rgba(16,32,24,0.07)";
    ctx.lineWidth = 1;
    roundRect(rect.x, rect.y, rect.w, rect.h, 7);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawEquipmentSkillSlot(rect, badge, label, readOnly, locked = false, level = 0, unavailable = false) {
    ctx.save();
    ctx.fillStyle = label === "空き" || label === "未装備" ? "rgba(255,255,255,0.58)" : "#ffffff";
    ctx.strokeStyle = locked ? "rgba(16,32,24,0.18)" : readOnly ? "rgba(16,32,24,0.15)" : "rgba(16,32,24,0.28)";
    ctx.lineWidth = 1;
    roundRect(rect.x, rect.y, rect.w, rect.h, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = locked ? "#63706a" : "#102018";
    ctx.font = "900 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(badge, rect.x + 7, rect.y + 5);
    drawFittedSystemText(label, rect.x + 7, rect.y + rect.h - 12, rect.w - 14, 800, 11, 8, label === "空き" || label === "未装備" ? "#8a948f" : locked ? "#516058" : "#102018", "left");
    drawSkillLevelBadge(rect.x + rect.w - 4, rect.y + rect.h - 4, level);
    if (unavailable) {
      drawUnavailableMark(rect);
    }
    ctx.restore();
  }

  function drawEquipmentStats(rect, unit) {
    const fullName = getEquipmentFullName(unit);
    const rows = getEquipmentStatRows(unit);
    const setEffects = typeof getActiveSetEffects === "function" ? getActiveSetEffects(unit) : [];
    ctx.save();
    ctx.fillStyle = "rgba(16,32,24,0.06)";
    ctx.strokeStyle = "rgba(16,32,24,0.14)";
    ctx.lineWidth = 1;
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#102018";
    ctx.font = "900 20px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    drawFittedSystemText(fullName, rect.x + 18, rect.y + 18, rect.w - 36, 900, 20, 13, "#102018", "left");
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#63706a";
    ctx.fillText(getEquipmentRoleLabel(unit), rect.x + 18, rect.y + 45);

    const resourcesY = rect.y + 70;
    const resourcesUsedH = drawEquipmentResourceBars(unit, rect.x + 18, resourcesY, rect.w - 36);
    const rowY = resourcesY + resourcesUsedH + 14;
    const statUsedH = drawEquipmentStatGrid(rows, rect.x + 18, rowY, rect.w - 36, 0);
    const setY = rowY + statUsedH + 12;
    const setLineY = setY + 27;
    const availableSetLines = Math.max(0, Math.floor((rect.y + rect.h - setLineY - 8) / 22));
    if (availableSetLines > 0) {
      ctx.fillStyle = "#102018";
      ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("発動中のセット効果", rect.x + 18, setY);
      ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillStyle = "#63706a";
      if (!setEffects.length) {
        ctx.fillText("なし", rect.x + 18, setLineY);
      } else {
        const lines = getEquipmentSetEffectLines(setEffects).slice(0, availableSetLines);
        for (let i = 0; i < lines.length; i += 1) {
          drawFittedSystemText(lines[i].text, rect.x + 18, setLineY + i * 22, rect.w - 36, lines[i].header ? 900 : 700, lines[i].header ? 13 : 12, 9, lines[i].header ? "#102018" : "#63706a", "left");
        }
      }
    }
    ctx.restore();
  }

  function drawEquipmentResourceBars(unit, x, y, w) {
    const entries = [
      { label: "HP", currentKey: "hp", maxKey: "maxHp", back: "#dbe9dd", fill: COLORS.hp || "#72df82" },
      { label: "MP", currentKey: "mp", maxKey: "maxMp", back: "#dbe4f4", fill: COLORS.mp || "#73a7ff" },
    ];
    const rowH = 24;
    const barH = 8;
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const rowY = y + i * rowH;
      const max = getEquipmentResourceMax(unit, entry.maxKey);
      const current = getEquipmentResourceCurrent(unit, entry.currentKey, max);
      const ratio = max > 0 ? current / max : 0;
      ctx.fillStyle = "#63706a";
      ctx.font = "800 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(entry.label, x, rowY);
      drawFittedSystemText(`現在 ${formatSystemNumber(current)} / 最大 ${formatSystemNumber(max)}`, x + w, rowY - 1, w - 28, 800, 12, 8, "#102018", "right");
      drawBar(x, rowY + 14, w, barH, ratio, entry.back, entry.fill);
    }
    return rowH * entries.length;
  }

  function getEquipmentResourceMax(unit, statKey) {
    const fallback = unit && Number.isFinite(unit[statKey]) ? unit[statKey] : 0;
    const value = typeof getEffectiveStat === "function" ? getEffectiveStat(unit, statKey) : fallback;
    const minimum = statKey === "maxHp" ? 1 : 0;
    return Math.max(minimum, Number.isFinite(value) ? value : fallback);
  }

  function getEquipmentResourceCurrent(unit, currentKey, max) {
    const current = unit && Number.isFinite(unit[currentKey]) ? unit[currentKey] : max;
    return Math.max(0, Math.min(max, current));
  }

  function drawEquipmentStatGrid(rows, x, y, w, h) {
    const columns = 4;
    const colGap = 7;
    const rowH = 30;
    const colW = Math.max(32, (w - colGap * (columns - 1)) / columns);
    let cellIndex = 0;
    let extraY = 0;
    let bottom = y;
    for (const stat of rows) {
      if (stat && stat.breakAfter) {
        cellIndex = Math.ceil(cellIndex / columns) * columns;
        extraY += 4;
        continue;
      }
      if (!stat) {
        continue;
      }
      const col = cellIndex % columns;
      const row = Math.floor(cellIndex / columns);
      const sx = x + col * (colW + colGap);
      const sy = y + row * rowH + extraY;
      if (h > 0 && sy > y + h - 24) {
        break;
      }
      drawEquipmentStatCell(stat, sx, sy, colW);
      bottom = Math.max(bottom, sy + rowH);
      cellIndex += 1;
    }
    return Math.max(0, bottom - y);
  }

  function drawEquipmentStatCell(stat, x, y, w) {
    ctx.fillStyle = "#7b8880";
    ctx.font = "700 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    drawFittedSystemText(stat.label, x, y, w, 700, 11, 8, "#7b8880", "left");
    drawFittedSystemText(stat.value, x, y + 14, w, 900, 13, 8, "#102018", "left");
  }

  function drawEquipmentPicker(layout, unit, readOnly) {
    const ui = getSystemMenu().equipment;
    const picker = ui.picker || {};
    if (!Number.isFinite(picker.scroll)) {
      picker.scroll = 0;
    }
    if (!Number.isFinite(picker.scrollMax)) {
      picker.scrollMax = 0;
    }
    const pickerH = Math.max(184, Math.min(244, layout.rect.h - 112));
    const rect = {
      x: layout.rect.x + 24,
      y: Math.max(layout.rect.y + 82, layout.rect.y + layout.rect.h - pickerH - 24),
      w: layout.rect.w - 48,
      h: pickerH,
    };
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.985)";
    ctx.strokeStyle = "rgba(16,32,24,0.32)";
    ctx.lineWidth = 1.2;
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();
    addSystemMenuTarget({ action: "absorbSystemClick", x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    drawSystemCloseButton(rect.x + rect.w - 40, rect.y + 12, "closeEquipmentPicker");

    if (picker.kind === "equipment") {
      drawEquipmentItemPicker(rect, unit, picker.slotKey, readOnly);
    } else if (picker.kind === "item") {
      drawCharacterItemPicker(rect, unit, readOnly);
    } else if (picker.kind === "passiveSkill") {
      drawPassiveSkillPicker(rect, unit, readOnly);
    } else if (picker.kind === "ultimateSkill") {
      drawUltimateSkillPicker(rect, unit, readOnly);
    } else {
      drawActiveSkillPicker(rect, unit, picker.slotIndex || 0, readOnly);
    }
    ctx.restore();
  }

    function drawEquipmentItemPicker(rect, unit, slotKey, readOnly) {
      const slot = getEquipmentSlotDef(slotKey);
      const current = typeof getEquippedSlotItem === "function" ? getEquippedSlotItem(unit, slotKey) : null;
      const candidates = getEquipmentItemCandidates(unit, slotKey);
    const equippedItemIds = getEquippedItemIds(unit);
    ctx.fillStyle = "#102018";
    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`${slot ? slot.name : slotKey}枠`, rect.x + 18, rect.y + 18);
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#63706a";
    ctx.fillText(current ? `現在: ${current.name}` : "現在: 未装備", rect.x + 18, rect.y + 45);
    if (current && !readOnly && !(slot && slot.required)) {
      drawSystemSmallButton(rect.x + rect.w - 150, rect.y + 44, 92, 28, "外す", "unequipEquipmentSlot", { slotKey });
    }
    drawCandidateIconGrid(candidates, rect.x + 18, rect.y + 78, rect.w - 36, rect.h - 92, {
      emptyText: "装備候補なし",
      readOnly,
      scrollState: getSystemMenu().equipment.picker,
      getIcon: (item) => ({
        label: getEquipmentIconLabel(item),
        color: getEquipmentIconColor(item && item.slot),
        selected: current && item && getEquipmentRefForDisplay(current) === getEquipmentRefForDisplay(item),
        equipped: getEquipmentItemEquipState(unit, item),
        title: item.name || item.id,
        subtitle: getEquipmentIconSubtitle(item),
        level: Number.isFinite(item && item.upgradeLevel) ? item.upgradeLevel : 0,
        tooltip: buildEquipmentItemTooltip(item, slot),
        action: "equipEquipmentItem",
        extra: { itemId: getEquipmentRefForDisplay(item) },
      }),
    });
  }

  function drawCharacterItemPicker(rect, unit, readOnly) {
    const current = getEquipmentCharacterItem(unit);
    const picker = getSystemMenu().equipment.picker || {};
    const candidates = getCharacterItemCandidates(unit, current);
    const selectedItem = getSelectedCharacterItemCandidate(candidates, picker, current);
    const quantityInfo = selectedItem ? getCharacterItemQuantityInfo(unit, selectedItem, current, picker) : null;
    ctx.fillStyle = "#102018";
    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("アイテム枠", rect.x + 18, rect.y + 18);
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#63706a";
    ctx.fillText(current ? `現在: ${current.name}${Number.isFinite(current.count) ? ` x${current.count}` : ""}` : "現在: 未所持", rect.x + 18, rect.y + 45);
    if (current && !readOnly) {
      drawSystemSmallButton(rect.x + rect.w - 150, rect.y + 44, 92, 28, "外す", "clearCharacterItem");
    }
    let gridY = rect.y + 78;
    if (selectedItem && quantityInfo) {
      drawCharacterItemQuantityControl(rect.x + 18, rect.y + 72, rect.w - 36, selectedItem, quantityInfo, readOnly);
      gridY = rect.y + 132;
    }
    drawCandidateIconGrid(candidates, rect.x + 18, gridY, rect.w - 36, rect.y + rect.h - gridY - 14, {
      emptyText: "アイテム候補なし",
      readOnly,
      scrollState: getSystemMenu().equipment.picker,
      getIcon: (item) => ({
        label: getCharacterItemIconLabel(item),
        color: "#6aa878",
        selected: selectedItem && item && selectedItem.id === item.id,
        title: item.name || item.id,
        subtitle: `持 ${getItemInventoryCountForDisplay(item)}`,
        tooltip: buildCharacterItemTooltip(item),
        action: "selectCharacterItemCandidate",
        extra: { itemId: item.id },
      }),
    });
  }

  function getCharacterItemCandidates(unit, current) {
    const candidates = itemSystem && typeof itemSystem.getItemCandidates === "function"
      ? itemSystem.getItemCandidates()
      : [];
    return candidates.filter((item) => {
      if (!item) {
        return false;
      }
      if (item.equippable === false) {
        return false;
      }
      const inventory = getItemInventoryCountForDisplay(item);
      return inventory > 0 || (current && current.id === item.id);
    });
  }

  function getSelectedCharacterItemCandidate(candidates, picker, current) {
    if (picker && picker.itemId) {
      const found = candidates.find((item) => item && item.id === picker.itemId);
      if (found) {
        return found;
      }
    }
    if (current) {
      const found = candidates.find((item) => item && item.id === current.id);
      if (found) {
        return found;
      }
    }
    return candidates[0] || null;
  }

  function getCharacterItemQuantityInfo(unit, item, current, picker) {
    const inventory = getItemInventoryCountForDisplay(item);
    const currentCount = current && current.id === item.id && Number.isFinite(current.count) ? current.count : 0;
    const maxCount = Math.max(1, Math.floor(Number.isFinite(item.battleMaxCount) ? item.battleMaxCount : Number.isFinite(item.maxCount) ? item.maxCount : 1));
    const max = Math.max(1, Math.min(maxCount, inventory + currentCount));
    const raw = Number.isFinite(picker && picker.itemQuantity)
      ? picker.itemQuantity
      : currentCount || Math.min(1, max);
    const value = Math.max(1, Math.min(max, Math.floor(raw || 1)));
    if (picker) {
      picker.itemId = item.id;
      picker.itemQuantity = value;
    }
    return { value, max, inventory, currentCount };
  }

  function drawCharacterItemQuantityControl(x, y, w, item, info, readOnly) {
    ctx.save();
    ctx.fillStyle = "rgba(16,32,24,0.055)";
    ctx.strokeStyle = "rgba(16,32,24,0.16)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, 48, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`${item.name || item.id}  ${info.value}/${info.max}`, x + 12, y + 18);
    ctx.fillStyle = "#63706a";
    ctx.font = "700 10px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(`持ち物 ${info.inventory} / 現在 ${info.currentCount}`, x + 12, y + 36);
    const buttonY = y + 8;
    const confirmW = 78;
    drawSystemSmallButton(x + w - confirmW - 8, buttonY, confirmW, 30, "持たせる", readOnly ? "noop" : "equipCharacterItem", { itemId: item.id, count: info.value });
    drawSystemSmallButton(x + w - confirmW - 50, buttonY, 30, 30, "+", readOnly || info.value >= info.max ? "noop" : "adjustCharacterItemQuantity", { delta: 1 });
    drawSystemSmallButton(x + w - confirmW - 88, buttonY, 30, 30, "-", readOnly || info.value <= 1 ? "noop" : "adjustCharacterItemQuantity", { delta: -1 });
    const track = { x: x + Math.min(180, w * 0.34), y: y + 27, w: Math.max(90, w - confirmW - 290), h: 8 };
    ctx.fillStyle = "rgba(16,32,24,0.18)";
    roundRect(track.x, track.y, track.w, track.h, 5);
    ctx.fill();
    const ratio = info.max <= 1 ? 1 : (info.value - 1) / (info.max - 1);
    ctx.fillStyle = "#6aa878";
    roundRect(track.x, track.y, Math.max(8, track.w * ratio), track.h, 5);
    ctx.fill();
    const thumbX = track.x + track.w * ratio;
    ctx.fillStyle = "#102018";
    ctx.beginPath();
    ctx.arc(thumbX, track.y + track.h / 2, 7, 0, TAU);
    ctx.fill();
    if (!readOnly && info.max > 1) {
      addSystemMenuTarget({ action: "setCharacterItemQuantityRatio", x: track.x, y: track.y - 10, w: track.w, h: 28 });
    }
    ctx.restore();
  }

  function drawActiveSkillPicker(rect, unit, slotIndex, readOnly) {
    const owner = unit.skillOwner || unit.id;
    const loadout = getEquipmentLoadout(unit);
    const configurableActive = Array.isArray(loadout.active) ? loadout.active.filter((key) => key && key !== "attack") : [];
    const currentKey = configurableActive[slotIndex] || null;
    const current = currentKey && SKILL_DATA && SKILL_DATA[owner] ? SKILL_DATA[owner][currentKey] : null;
    const candidates = sortPickerCandidatesByAvailability(
      Object.entries(SKILL_DATA && SKILL_DATA[owner] || {})
        .filter(([key]) => key !== "attack" && !isUltimateSkill(owner, key) && isOwnedSkillForDisplay(owner, key))
        .map(([key, skill]) => ({ key, skill })),
      (entry) => canEquipSkillWithCurrentWeapon(unit, entry.skill)
    );
    ctx.fillStyle = "#102018";
    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`スキル枠 ${slotIndex + 1}`, rect.x + 18, rect.y + 18);
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#63706a";
    ctx.fillText(current ? `現在: ${current.name}` : "現在: 空き", rect.x + 18, rect.y + 45);
    if (current && !readOnly) {
      drawSystemSmallButton(rect.x + rect.w - 150, rect.y + 44, 92, 28, "外す", "clearActiveSkill", { slotIndex });
    }
    drawCandidateIconGrid(candidates, rect.x + 18, rect.y + 78, rect.w - 36, rect.h - 92, {
      emptyText: "スキル候補なし",
      readOnly,
      scrollState: getSystemMenu().equipment.picker,
      getIcon: (entry) => ({
        label: getSkillIconLabel(entry.skill),
        color: getSkillIconColor(entry.skill),
        selected: currentKey === entry.key,
        equipped: getActiveSkillEquipState(unit, entry.key, entry.skill),
        disabled: !canEquipSkillWithCurrentWeapon(unit, entry.skill),
        title: entry.skill.name || entry.key,
        subtitle: entry.skill.category || "",
        level: getSkillLevelForDisplay(owner, entry.key),
        tooltip: buildSkillCandidateTooltip(entry.skill, unit),
        action: "equipActiveSkill",
        extra: { slotIndex, skillKey: entry.key },
      }),
    });
  }

  function drawPassiveSkillPicker(rect, unit, readOnly) {
    const owner = unit.skillOwner || unit.id;
    const loadout = getEquipmentLoadout(unit);
    const current = getPassiveData(owner, loadout.passive);
    const candidates = sortPickerCandidatesByAvailability(
      Object.entries(PASSIVE_DATA && PASSIVE_DATA[owner] || {})
        .filter(([key]) => isOwnedPassiveForDisplay(owner, key))
        .map(([key, passive]) => ({ key, passive })),
      (entry) => canEquipSkillWithCurrentWeapon(unit, entry.passive)
    );
    ctx.fillStyle = "#102018";
    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("パッシブ枠", rect.x + 18, rect.y + 18);
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#63706a";
    ctx.fillText(current ? `現在: ${current.name}` : "現在: 未装備", rect.x + 18, rect.y + 45);
    drawCandidateIconGrid(candidates, rect.x + 18, rect.y + 78, rect.w - 36, rect.h - 92, {
      emptyText: "パッシブ候補なし",
      readOnly,
      scrollState: getSystemMenu().equipment.picker,
      getIcon: (entry) => ({
        label: getSkillIconLabel(entry.passive),
        color: "#5b7c5f",
        selected: loadout.passive === entry.key,
        equipped: getPassiveSkillEquipState(unit, entry.key, entry.passive),
        disabled: !canEquipSkillWithCurrentWeapon(unit, entry.passive),
        title: entry.passive.name || entry.key,
        subtitle: "パッシブ",
        tooltip: buildPassiveCandidateTooltip(entry.passive, unit),
        action: "equipPassiveSkill",
        extra: { passiveKey: entry.key },
      }),
    });
  }

  function drawUltimateSkillPicker(rect, unit, readOnly) {
    const owner = unit.skillOwner || unit.id;
    const currentEntry = getEquipmentUltimateSkillEntry(unit);
    const candidates = sortPickerCandidatesByAvailability(
      getUltimateSkillCandidates(owner),
      (entry) => canEquipSkillWithCurrentWeapon(unit, entry.skill)
    );
    ctx.fillStyle = "#102018";
    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("必殺技枠", rect.x + 18, rect.y + 18);
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#63706a";
    ctx.fillText(currentEntry.skill ? `現在: ${currentEntry.skill.name}` : "現在: 未装備", rect.x + 18, rect.y + 45);
    drawCandidateIconGrid(candidates, rect.x + 18, rect.y + 78, rect.w - 36, rect.h - 92, {
      emptyText: "必殺技候補なし",
      readOnly,
      scrollState: getSystemMenu().equipment.picker,
      getIcon: (entry) => ({
        label: getSkillIconLabel(entry.skill),
        color: getSkillIconColor(entry.skill),
        selected: currentEntry.key === entry.key,
        equipped: getUltimateSkillEquipState(unit, entry.key, entry.skill),
        disabled: !canEquipSkillWithCurrentWeapon(unit, entry.skill),
        title: entry.skill.name || entry.key,
        subtitle: "必殺技",
        level: getSkillLevelForDisplay(owner, entry.key),
        tooltip: buildSkillCandidateTooltip(entry.skill, unit),
        action: "equipUltimateSkill",
        extra: { ultimateKey: entry.key },
      }),
    });
  }

  function drawCandidateIconGrid(items, x, y, w, h, options) {
    const iconSize = 46;
    const gap = 10;
    const columns = Math.max(1, Math.floor((w + gap) / (iconSize + gap)));
    if (!items.length) {
      if (options.scrollState) {
        options.scrollState.scroll = 0;
        options.scrollState.scrollMax = 0;
      }
      ctx.fillStyle = "#7b8880";
      ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText(options.emptyText, x, y + 8);
      return;
    }
    const rows = Math.ceil(items.length / columns);
    const contentH = rows * iconSize + Math.max(0, rows - 1) * gap;
    const scrollState = options.scrollState || null;
    const scrollMax = Math.max(0, contentH - h);
    const scroll = scrollState
      ? Math.max(0, Math.min(scrollMax, scrollState.scroll || 0))
      : 0;
    if (scrollState) {
      scrollState.scroll = scroll;
      scrollState.scrollMax = scrollMax;
    }
    const clipRect = { x, y, w, h };
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    for (let i = 0; i < items.length; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const rect = {
        x: x + col * (iconSize + gap),
        y: y + row * (iconSize + gap) - scroll,
        w: iconSize,
        h: iconSize,
      };
      if (!rectIntersects(rect, clipRect)) {
        continue;
      }
      const icon = options.getIcon(items[i]);
      drawCandidateIcon(rect, icon);
      const visibleRect = intersectRects(rect, clipRect);
      registerEquipmentTooltip(visibleRect, icon.tooltip);
      addSystemMenuTarget({
        action: options.readOnly || icon.disabled ? "absorbSystemClick" : icon.action,
        x: visibleRect.x,
        y: visibleRect.y,
        w: visibleRect.w,
        h: visibleRect.h,
        ...(icon.extra || {}),
      });
    }
    ctx.restore();
    drawSettingsScrollbar(clipRect, scroll, scrollMax, scrollState ? {
      scrollState,
      valueKey: "scroll",
      maxKey: "scrollMax",
    } : null);
  }

  function drawCandidateIcon(rect, icon) {
    ctx.save();
    ctx.fillStyle = icon.selected ? "#fff7d7" : "#ffffff";
    ctx.strokeStyle = icon.selected ? "#d8a73f" : "rgba(16,32,24,0.22)";
    ctx.lineWidth = icon.selected ? 2 : 1;
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = icon.color || "#60756a";
    roundRect(rect.x + 8, rect.y + 7, rect.w - 16, rect.h - 18, 7);
    ctx.fill();
    drawFittedSystemText(icon.label || "?", rect.x + rect.w / 2, rect.y + rect.h / 2 - 2, rect.w - 20, 900, 15, 9, "#f7fff6", "center", "middle");
    ctx.fillStyle = icon.selected ? "#9c7123" : "#63706a";
    ctx.font = "900 8px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(icon.subtitle || "", rect.x + rect.w / 2, rect.y + rect.h - 3);
    if (icon.equipped) {
      drawEquippedBadge(rect.x + rect.w - 16, rect.y + 4, icon.equipped);
    }
    drawSkillLevelBadge(rect.x + rect.w - 4, rect.y + rect.h - 4, icon.level || 0);
    if (icon.disabled) {
      drawUnavailableMark(rect);
    }
    ctx.restore();
  }

  function getSkillLevelRoman(level) {
    const index = Math.max(0, Math.min(SKILL_LEVEL_ROMAN.length - 1, Math.floor(Number(level) || 0)));
    return SKILL_LEVEL_ROMAN[index] || "";
  }

  function drawSkillLevelBadge(right, bottom, level) {
    const label = getSkillLevelRoman(level);
    if (!label) {
      return;
    }
    ctx.save();
    ctx.font = "900 9px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const width = Math.max(17, ctx.measureText(label).width + 8);
    const height = 13;
    const x = right - width;
    const y = bottom - height;
    ctx.fillStyle = "#233a67";
    ctx.strokeStyle = "#f7fff6";
    ctx.lineWidth = 1;
    roundRect(x, y, width, height, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fff6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + width / 2, y + height / 2 + 0.4);
    ctx.restore();
  }

  function drawEquippedBadge(x, y, state = "current") {
    const size = 13;
    ctx.save();
    ctx.fillStyle = state === "other" ? "#d88428" : "#2f8b57";
    ctx.strokeStyle = "#f7fff6";
    ctx.lineWidth = 1;
    roundRect(x, y, size, size, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fff6";
    ctx.font = "900 9px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("E", x + size / 2, y + size / 2 + 0.5);
    ctx.restore();
  }

  function drawUnavailableMark(rect) {
    ctx.save();
    ctx.strokeStyle = "rgba(196,42,42,0.92)";
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rect.x + 12, rect.y + 12);
    ctx.lineTo(rect.x + rect.w - 12, rect.y + rect.h - 12);
    ctx.moveTo(rect.x + rect.w - 12, rect.y + 12);
    ctx.lineTo(rect.x + 12, rect.y + rect.h - 12);
    ctx.stroke();
    ctx.restore();
  }

  function getEquippedItemIds(unit) {
    const ids = new Set();
    const items = typeof getEquippedItems === "function" ? getEquippedItems(unit) : [];
    for (const item of items) {
      const ref = getEquipmentRefForDisplay(item);
      if (ref) {
        ids.add(ref);
      }
    }
    return ids;
  }

  function getEquipmentIconLabel(item) {
    if (!item) {
      return "?";
    }
    const slotLabels = {
      weapon: "武",
      head: "頭",
      body: "胴",
      hands: "手",
      legs: "足",
      feet: "靴",
      accessory: "飾",
    };
    return slotLabels[item.slot] || String(item.name || item.id || "?").slice(0, 1);
  }

  function getEquipmentIconColor(slotKey) {
    const colors = {
      weapon: "#6f5942",
      head: "#5f7280",
      body: "#68785d",
      hands: "#8a6a4d",
      legs: "#766985",
      feet: "#5f6f6b",
      accessory: "#8b7445",
    };
    return colors[slotKey] || "#60756a";
  }

  function getSkillIconLabel(skill) {
    if (!skill) {
      return "?";
    }
    if (skill.category === "通常攻撃") {
      return "攻";
    }
    if (skill.category === "指示") {
      return "指";
    }
    if (skill.category === "必殺技") {
      return "必";
    }
    return String(skill.name || skill.key || "?").slice(0, 1);
  }

  function getSkillIconColor(skill) {
    if (!skill) {
      return "#60756a";
    }
    const damageType = String(skill.damageType || "");
    const damageTypeLower = damageType.toLowerCase();
    if (skill.category === "通常攻撃") {
      return "#607f8a";
    }
    if (skill.category === "指示") {
      return "#6d7a4f";
    }
    if (damageType === "magic" || damageTypeLower.includes("magic") || damageType.includes("魔法")) {
      return "#7563a1";
    }
    if (damageType === "physical" || damageTypeLower.includes("physical") || damageType.includes("物理")) {
      return "#8a5f47";
    }
    return "#60756a";
  }

  function buildEquipmentItemTooltip(item, slot) {
    if (!item) {
      return null;
    }
    const lines = [];
    const slotName = slot && slot.name ? slot.name : item.slot;
    lines.push(`${item.rank || ""}${slotName ? ` / ${slotName}` : ""}`.trim());
    if (Number.isFinite(item.copyIndex) && Number.isFinite(item.copyCount) && item.copyCount > 1) {
      lines.push(`個体: #${item.copyIndex}/${item.copyCount}`);
    }
    const summary = getEquipmentItemSummary(item);
    if (summary) {
      lines.push(summary);
    }
    if (item.weaponType) {
      lines.push(`武器種: ${item.weaponType}`);
    }
    if (Number.isFinite(item.upgradeLevel) && item.upgradeLevel > 0) {
      lines.push(`強化: +${item.upgradeLevel}`);
    }
    if (item.normalAttackSkillId) {
      lines.push(`通常攻撃: ${getNormalAttackSkillDisplayName(item.normalAttackSkillId)}`);
    }
    if (item.description) {
      lines.push(item.description);
    }
    return { title: item.name || item.id, lines };
  }

  function getNormalAttackSkillDisplayName(skillId) {
    const found = findNormalAttackSkillById(skillId);
    return found && found.skill && found.skill.name || skillId;
  }

  function getEquipmentCharacterItem(unit) {
    if (!unit) {
      return null;
    }
    if (itemSystem && typeof itemSystem.getCharacterItem === "function") {
      return itemSystem.getCharacterItem(unit.id);
    }
    return unit.item || null;
  }

  function getCharacterItemIconLabel(item) {
    if (!item) {
      return "?";
    }
    return item.shortName || String(item.name || item.id || "?").slice(0, 1);
  }

  function getItemInventoryCountForDisplay(item) {
    if (!item) {
      return 0;
    }
    if (itemSystem && typeof itemSystem.getItemInventoryCount === "function") {
      return itemSystem.getItemInventoryCount(item.id);
    }
    return Math.max(0, Math.floor(Number.isFinite(item.inventoryCount) ? item.inventoryCount : 0));
  }

  function buildCharacterItemTooltip(item) {
    if (!item) {
      return null;
    }
    const lines = ["アイテム"];
    if (itemSystem && typeof itemSystem.getItemInventoryCount === "function") {
      lines.push(`持ち物: ${itemSystem.getItemInventoryCount(item.id)}`);
    }
    if (itemSystem && typeof itemSystem.getItemEquippedCount === "function") {
      lines.push(`装備中: ${itemSystem.getItemEquippedCount(item.id)}`);
    }
    if (Number.isFinite(item.count)) {
      lines.push(`所持数: ${item.count}${Number.isFinite(item.maxCount) ? `/${item.maxCount}` : ""}`);
    } else if (Number.isFinite(item.maxCount)) {
      lines.push(`最大所持数: ${item.maxCount}`);
    }
    if (item.description) {
      lines.push(item.description);
    }
    return { title: item.name || item.id, lines };
  }

  function buildSkillCandidateTooltip(skill, unit) {
    if (!skill) {
      return null;
    }
    const lines = [];
    if (skill.category || skill.rank) {
      lines.push(`${skill.rank || ""}${skill.category ? ` / ${skill.category}` : ""}`.trim());
    }
    const condition = skill.category === "通常攻撃" ? "" : getSkillConditionLabel(skill);
    if (condition) {
      lines.push(`条件: ${condition}`);
    }
    const owner = unit && (unit.skillOwner || unit.id) || skill.owner;
    const skillKey = skill.key || skill.sourceKey || skill.id;
    const level = owner && skillKey ? getSkillLevelForDisplay(owner, skillKey) : 0;
    if (level > 0) {
      lines.push(`強化Lv.${level}`);
    }
    const costs = [];
    if (Number.isFinite(skill.cd)) {
      costs.push(`CD ${formatSystemDecimal(skill.cd)}秒`);
    }
    if (Number.isFinite(skill.cost) && skill.cost > 0) {
      costs.push(`MP ${formatSystemNumber(skill.cost)}`);
    }
    if (Number.isFinite(skill.cast) && skill.cast > 0) {
      costs.push(`詠唱 ${formatSystemDecimal(skill.cast)}秒`);
    }
    if (costs.length) {
      lines.push(costs.join(" / "));
    }
    const description = formatEquipmentDescriptionText(getSystemTooltipDescription(skill), unit, skill);
    if (description) {
      lines.push(...String(description).split(/\r?\n/));
    }
    appendEquipmentRelatedStatuses(lines, description, skill.statusIds, unit);
    return { title: skill.name || skill.key, lines };
  }

  function buildPassiveCandidateTooltip(passive, unit) {
    if (!passive) {
      return null;
    }
    const lines = ["パッシブ"];
    const condition = getSkillConditionLabel(passive);
    if (condition) {
      lines.push(`条件: ${condition}`);
    }
    const description = formatEquipmentDescriptionText(getSystemTooltipDescription(passive), unit, passive);
    if (description) {
      lines.push(...String(description).split(/\r?\n/));
    }
    appendEquipmentRelatedStatuses(lines, description, passive.statusIds, unit);
    return { title: passive.name || passive.key, lines };
  }

  function getSystemTooltipDescription(source) {
    return tooltipText.getDescription(source);
  }

  function appendEquipmentRelatedStatuses(lines, description, statusIds, unit) {
    tooltipText.appendRelatedStatuses(lines, description, statusIds, unit);
  }

  function formatEquipmentDescriptionText(text, unit, source) {
    return tooltipText.formatDescription(text, unit, source);
  }

  function registerEquipmentTooltip(rect, tooltip) {
    if (!tooltip) {
      return;
    }
    equipmentTooltipTargets.push({ x: rect.x, y: rect.y, w: rect.w, h: rect.h, tooltip });
  }

  function drawEquipmentHoverTooltip() {
    if (!input || !input.mouse || !equipmentTooltipTargets.length) {
      return;
    }
    const mouse = input.mouse;
    for (let i = equipmentTooltipTargets.length - 1; i >= 0; i -= 1) {
      const target = equipmentTooltipTargets[i];
      if (
        mouse.x >= target.x &&
        mouse.x <= target.x + target.w &&
        mouse.y >= target.y &&
        mouse.y <= target.y + target.h
      ) {
        drawEquipmentTooltipBox(target.tooltip, mouse.x, mouse.y);
        return;
      }
    }
  }

  function drawEquipmentTooltipBox(tooltip, mouseX, mouseY) {
    const title = tooltip && tooltip.title ? tooltip.title : "";
    const rawLines = Array.isArray(tooltip && tooltip.lines) ? tooltip.lines.filter(Boolean) : [];
    const textW = 248;
    const lines = wrapSystemTooltipLines(rawLines, textW);
    const lineH = 18;
    const h = 44 + lines.length * lineH;
    ctx.save();
    ctx.font = "900 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    let w = Math.max(160, ctx.measureText(title).width + 28);
    ctx.font = "700 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    for (const line of lines) {
      w = Math.max(w, ctx.measureText(line).width + 28);
    }
    w = Math.min(300, Math.max(w, textW + 28));
    const x = clamp(mouseX + 18, 12, view.w - w - 12);
    const y = clamp(mouseY + 18, 12, view.h - h - 12);
    ctx.fillStyle = "rgba(16,32,24,0.96)";
    ctx.strokeStyle = "rgba(247,255,246,0.22)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    drawFittedSystemText(title, x + 14, y + 18, w - 28, 900, 14, 10, "#f7fff6", "left", "middle");
    ctx.font = "700 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#c7d5cc";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    for (let i = 0; i < lines.length; i += 1) {
      ctx.fillText(lines[i], x + 14, y + 34 + i * lineH);
    }
    ctx.restore();
  }

  function wrapSystemTooltipLines(rawLines, maxWidth) {
    const wrapped = [];
    ctx.save();
    ctx.font = "700 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    for (const raw of rawLines) {
      const text = String(raw || "");
      let line = "";
      for (const char of Array.from(text)) {
        const next = line + char;
        if (line && ctx.measureText(next).width > maxWidth) {
          wrapped.push(line);
          line = char;
        } else {
          line = next;
        }
      }
      if (line) {
        wrapped.push(line);
      }
    }
    ctx.restore();
    const maxLines = Math.max(8, Math.floor((view.h - 72) / 18));
    return wrapped.slice(0, maxLines);
  }

  function drawEquipmentPresetWindow(layout, unit, readOnly) {
    const ui = getSystemMenu().equipment;
    const presets = game.equipmentPresetsById && Array.isArray(game.equipmentPresetsById[unit.id])
      ? game.equipmentPresetsById[unit.id]
      : [];
    const rect = {
      x: Math.max(layout.rect.x + 24, layout.rect.x + layout.rect.w / 2 - 210),
      y: layout.rect.y + 62,
      w: Math.min(420, layout.rect.w - 48),
      h: 292,
    };
    rect.x = Math.min(rect.x, layout.rect.x + layout.rect.w - rect.w - 24);
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.99)";
    ctx.strokeStyle = "rgba(16,32,24,0.32)";
    ctx.lineWidth = 1.2;
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();
    addSystemMenuTarget({ action: "absorbSystemClick", x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    drawSystemCloseButton(rect.x + rect.w - 40, rect.y + 12, "closeEquipmentPreset");
    ctx.fillStyle = "#102018";
    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("プリセット", rect.x + 18, rect.y + 18);

    const nameRect = { x: rect.x + 18, y: rect.y + 56, w: rect.w - 134, h: 34 };
    drawPresetNameField(typeof ui.presetName === "string" ? ui.presetName : "プリセット1", nameRect.x + 10, nameRect.y + 5, nameRect.w - 20, nameRect.h - 10, ui.preset && ui.preset.nameFocused, {
      field: readOnly ? null : "name",
      targetRect: nameRect,
      drawBackground: true,
    });
    drawSystemSmallButton(rect.x + rect.w - 108, rect.y + 58, 88, 30, readOnly ? "確認" : "保存", readOnly ? "noop" : "saveEquipmentPreset", {});

    ctx.fillStyle = "#63706a";
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("保存済み", rect.x + 18, rect.y + 106);
    if (!presets.length) {
      ctx.fillStyle = "#7b8880";
      ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("保存されているプリセットはありません。", rect.x + 18, rect.y + 138);
    } else {
      const rowH = 38;
      for (let i = 0; i < Math.min(presets.length, 4); i += 1) {
        const rowX = rect.x + 18;
        const rowW = rect.w - 36;
        const rowY = rect.y + 128 + i * rowH;
        ctx.fillStyle = i % 2 ? "rgba(16,32,24,0.045)" : "rgba(16,32,24,0.075)";
        roundRect(rowX, rowY, rowW, 32, 6);
        ctx.fill();
        const deleteX = rowX + rowW - 30;
        const loadX = deleteX - 66;
        const editX = loadX - 30;
        const nameMaxW = readOnly ? rowW - 24 : Math.max(80, editX - (rowX + 12) - 8);
        const rowEditing = ui.preset && ui.preset.editIndex === i;
        const nameText = rowEditing ? ui.preset.renameDraft : presets[i].name || `プリセット${i + 1}`;
        const presetTextTarget = {
          field: "rename",
          index: i,
          x: rowX + 6,
          y: rowY + 4,
          w: nameMaxW + 12,
          h: 24,
          textX: rowX + 12,
          textW: nameMaxW,
          charStops: getPresetTextStops(nameText),
        };
        drawPresetNameField(nameText, rowX + 12, rowY + 4, nameMaxW, 24, rowEditing, {
          field: rowEditing ? "rename" : null,
          index: i,
          targetRect: presetTextTarget,
          drawBackground: rowEditing,
        });
        if (!readOnly) {
          drawPresetIconButton(editX, rowY + 4, 24, rowEditing ? "save" : "edit", rowEditing ? "saveEquipmentPresetNameEdit" : "editEquipmentPresetName", { index: i, focusTarget: presetTextTarget });
          drawSystemSmallButton(loadX, rowY + 4, 58, 24, "読込", "loadEquipmentPreset", { index: i });
          drawPresetIconButton(deleteX, rowY + 4, 24, "delete", "deleteEquipmentPreset", { index: i });
        }
      }
    }
    ctx.restore();
  }

  function drawPresetNameField(text, x, y, w, h, focused, options = {}) {
    const value = String(text || "");
    ctx.save();
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const targetRect = options.targetRect || { x: x - 6, y, w: w + 12, h };
    if (options.drawBackground) {
      ctx.fillStyle = focused ? "#fffdf0" : "rgba(16,32,24,0.055)";
      ctx.strokeStyle = focused ? "#d8a73f" : "rgba(16,32,24,0.18)";
      ctx.lineWidth = 1.4;
      roundRect(targetRect.x, targetRect.y, targetRect.w, targetRect.h, 6);
      ctx.fill();
      ctx.stroke();
    }
    const stops = getPresetTextStops(value);
    const state = getPresetNameDrawState(options.field, value);
    roundRect(x, y, w, h, 4);
    ctx.save();
    ctx.clip();
    if (focused && state) {
      const start = Math.min(state.anchor, state.caret);
      const end = Math.max(state.anchor, state.caret);
      if (start !== end) {
        const sx = x + Math.min(w, stops[start] || 0);
        const ex = x + Math.min(w, stops[end] || 0);
        ctx.fillStyle = "rgba(216,167,63,0.24)";
        roundRect(sx, y + 3, Math.max(2, ex - sx), h - 6, 4);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#102018";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(value, x, y + h / 2);
    if (focused && state) {
      const caretX = x + Math.min(w - 1, stops[state.caret] || 0);
      ctx.strokeStyle = "#a17116";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(caretX, y + 5);
      ctx.lineTo(caretX, y + h - 5);
      ctx.stroke();
    }
    ctx.restore();
    if (options.field) {
      addSystemMenuTarget({
        action: "focusEquipmentPresetText",
        field: options.field,
        index: Number.isFinite(options.index) ? options.index : null,
        x: targetRect.x,
        y: targetRect.y,
        w: targetRect.w,
        h: targetRect.h,
        textX: x,
        textW: w,
        charStops: stops,
      });
    }
    ctx.restore();
  }

  function getPresetTextStops(value) {
    const stops = [0];
    let width = 0;
    for (const char of Array.from(value)) {
      width += ctx.measureText(char).width;
      stops.push(width);
    }
    return stops;
  }

  function getPresetNameDrawState(field, value) {
    const ui = getSystemMenu().equipment;
    if (!ui.preset || !field) {
      return null;
    }
    const length = Array.from(value || "").length;
    const caretKey = field === "rename" ? "renameCaret" : "nameCaret";
    const anchorKey = field === "rename" ? "renameAnchor" : "nameAnchor";
    let anchor = Number.isFinite(ui.preset[anchorKey]) ? ui.preset[anchorKey] : length;
    let caret = Number.isFinite(ui.preset[caretKey]) ? ui.preset[caretKey] : anchor;
    if (field === "rename" && ui.preset.renameSelection) {
      anchor = 0;
      caret = length;
    }
    return {
      anchor: Math.max(0, Math.min(length, anchor)),
      caret: Math.max(0, Math.min(length, caret)),
    };
  }

  function drawPresetIconButton(x, y, size, kind, action, extra = {}) {
    ctx.save();
    ctx.fillStyle = "rgba(16,32,24,0.08)";
    ctx.strokeStyle = "rgba(16,32,24,0.24)";
    ctx.lineWidth = 1;
    roundRect(x, y, size, size, 6);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = kind === "delete" ? "#8d3f36" : kind === "save" ? "#247242" : "#102018";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (kind === "edit") {
      ctx.beginPath();
      ctx.moveTo(x + 7, y + size - 7);
      ctx.lineTo(x + size - 7, y + 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + size - 10, y + 6);
      ctx.lineTo(x + size - 6, y + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 6, y + size - 6);
      ctx.lineTo(x + 10, y + size - 8);
      ctx.lineTo(x + 8, y + size - 10);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "save") {
      ctx.beginPath();
      ctx.moveTo(x + 6, y + size * 0.54);
      ctx.lineTo(x + size * 0.43, y + size - 7);
      ctx.lineTo(x + size - 6, y + 7);
      ctx.stroke();
    } else if (kind === "delete") {
      ctx.beginPath();
      ctx.moveTo(x + 7, y + 8);
      ctx.lineTo(x + size - 7, y + 8);
      ctx.moveTo(x + 10, y + 11);
      ctx.lineTo(x + 11, y + size - 6);
      ctx.lineTo(x + size - 11, y + size - 6);
      ctx.lineTo(x + size - 10, y + 11);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 6);
      ctx.lineTo(x + size - 10, y + 6);
      ctx.stroke();
    }
    ctx.restore();
    addSystemMenuTarget({ action, x, y, w: size, h: size, ...extra });
  }

  function drawEquipmentConfirmWindow(layout, confirm) {
    const rect = {
      x: layout.rect.x + layout.rect.w / 2 - 220,
      y: layout.rect.y + layout.rect.h / 2 - 92,
      w: 440,
      h: 184,
    };
    ctx.save();
    ctx.fillStyle = "rgba(16,32,24,0.28)";
    ctx.fillRect(layout.rect.x, layout.rect.y, layout.rect.w, layout.rect.h);
    addSystemMenuTarget({ action: "closeEquipmentConfirm", x: layout.rect.x, y: layout.rect.y, w: layout.rect.w, h: layout.rect.h });
    ctx.fillStyle = "rgba(255,255,255,0.99)";
    ctx.strokeStyle = "rgba(16,32,24,0.36)";
    ctx.lineWidth = 1.2;
    roundRect(rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();
    addSystemMenuTarget({ action: "absorbSystemClick", x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    drawSystemCloseButton(rect.x + rect.w - 42, rect.y + 12, "closeEquipmentConfirm");
    ctx.fillStyle = "#102018";
    ctx.font = "900 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const isEquipmentTransfer = confirm && confirm.type === "stealEquipmentItem";
    ctx.fillText(isEquipmentTransfer ? "装備中装備の移動" : "装備中スキルの移動", rect.x + 22, rect.y + 20);
    ctx.font = "700 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#37463e";
    const name = confirm && confirm.otherName ? confirm.otherName : "他キャラ";
    const itemLabel = isEquipmentTransfer && confirm.itemName ? `「${confirm.itemName}」を` : "";
    ctx.fillText(`${name}の装備スロットから${itemLabel}外します。`, rect.x + 22, rect.y + 68);
    ctx.fillText("よろしいですか？", rect.x + 22, rect.y + 94);
    drawSystemDialogButton(rect.x + rect.w - 208, rect.y + rect.h - 52, 84, 32, "いいえ", "closeEquipmentConfirm", true);
    drawSystemDialogButton(rect.x + rect.w - 112, rect.y + rect.h - 52, 84, 32, "はい", isEquipmentTransfer ? "confirmEquipmentItemTransfer" : "confirmEquipmentSkillTransfer", false);
    ctx.restore();
  }

  function drawEquipmentMessage(panelRect) {
    const ui = getSystemMenu().equipment;
    if (!ui.message) {
      return;
    }
    ctx.save();
    ctx.fillStyle = "rgba(16,32,24,0.88)";
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    const w = Math.min(360, panelRect.w - 48);
    const h = 34;
    const x = panelRect.x + panelRect.w / 2 - w / 2;
    const y = panelRect.y + panelRect.h - h - 18;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    drawFittedSystemText(ui.message, x + 16, y + h / 2, w - 32, 800, 13, 9, "#f7fff6", "center", "middle");
    ctx.restore();
  }

  function drawSystemSmallButton(x, y, w, h, label, action, extra = {}) {
    ctx.save();
    const disabled = action === "noop";
    ctx.fillStyle = disabled ? "rgba(16,32,24,0.08)" : "#102018";
    ctx.strokeStyle = disabled ? "rgba(16,32,24,0.2)" : "#102018";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();
    drawFittedSystemText(label, x + w / 2, y + h / 2, w - 10, 800, 12, 8, disabled ? "#63706a" : "#f7fff6", "center", "middle");
    ctx.restore();
    if (!disabled) {
      addSystemMenuTarget({ action, x, y, w, h, ...extra });
    }
  }

  function getEquipmentItemCandidates(unit, slotKey) {
    const items = EQUIPMENT_DATA && EQUIPMENT_DATA.items ? Object.values(EQUIPMENT_DATA.items) : [];
    const candidates = [];
    for (const item of items) {
      if (!item || item.slot !== slotKey) {
        continue;
      }
      const instances = typeof getEquipmentInstancesByItemId === "function"
        ? getEquipmentInstancesByItemId(item.id)
        : [];
      if (instances.length) {
        for (const instanceItem of instances) {
          if (!instanceItem || (typeof canEquipItem === "function" && !canEquipItem(unit, instanceItem))) {
            continue;
          }
          candidates.push(instanceItem);
        }
        continue;
      }
      const resolved = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(item.id) || item : item;
      if (typeof canEquipItem !== "function" || canEquipItem(unit, resolved)) {
        candidates.push(resolved);
      }
    }
    return candidates;
  }

  function getEquipmentRefForDisplay(itemOrRef) {
    if (typeof getEquipmentItemRef === "function") {
      return getEquipmentItemRef(itemOrRef);
    }
    if (!itemOrRef) {
      return null;
    }
    return typeof itemOrRef === "string" ? itemOrRef : itemOrRef.id || null;
  }

  function getEquipmentBaseIdForDisplay(itemOrRef) {
    if (typeof getEquipmentBaseItemId === "function") {
      return getEquipmentBaseItemId(itemOrRef);
    }
    if (!itemOrRef) {
      return null;
    }
    return typeof itemOrRef === "string" ? itemOrRef : itemOrRef.id || null;
  }

  function getEquipmentIconSubtitle(item) {
    if (!item) {
      return "";
    }
    const copy = Number.isFinite(item.copyIndex) && Number.isFinite(item.copyCount) && item.copyCount > 1
      ? `#${item.copyIndex} `
      : "";
    const rank = item.rank || "";
    return `${copy}${rank}`.trim();
  }

  function getEquipmentItemStatSummary(item) {
    if (!item) {
      return "";
    }
    const stats = [];
    for (const [key, value] of Object.entries(item.flatStatBonuses || {})) {
      stats.push(`${getStatLabel(key)}+${formatSystemNumber(value)}`);
    }
    for (const [key, value] of Object.entries(item.statBonuses || {})) {
      stats.push(`${getStatLabel(key)}${formatEquipmentStatPercent(key, value, true)}`);
    }
    return stats.join(" / ");
  }

  function getEquipmentItemSummary(item) {
    const statSummary = getEquipmentItemStatSummary(item);
    if (statSummary) {
      return statSummary;
    }
    return item ? (item.description || item.rank || "") : "";
  }

  function getEquipmentLoadout(unit) {
    if (!unit) {
      return { passive: null, ultimate: null, active: [] };
    }
    if (unit.loadout && typeof normalizeLoadout === "function") {
      return normalizeLoadout(unit.skillOwner || unit.id, unit.loadout);
    }
    return typeof getDefaultLoadout === "function" ? getDefaultLoadout(unit.skillOwner || unit.id) : { passive: null, ultimate: null, active: [] };
  }

  function getUnitWeaponItem(unit) {
    return unit && unit.equipment && unit.equipment.weapon && typeof resolveEquipmentItem === "function"
      ? resolveEquipmentItem(unit.equipment.weapon)
      : null;
  }

  function getUnitNormalAttackSkill(unit) {
    const owner = unit && (unit.skillOwner || unit.id);
    const weapon = getUnitWeaponItem(unit);
    const normalAttackSkillId = weapon && weapon.normalAttackSkillId;
    if (normalAttackSkillId) {
      const found = findNormalAttackSkillById(normalAttackSkillId);
      if (found) {
        return found.owner === owner && found.key === "attack"
          ? found.skill
          : { ...found.skill, key: "attack", owner, sourceOwner: found.owner, sourceKey: found.key };
      }
    }
    return owner && SKILL_DATA && SKILL_DATA[owner] ? SKILL_DATA[owner].attack || null : null;
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

  function isOwnedSkillForDisplay(owner, key) {
    return typeof isSkillOwned === "function" ? isSkillOwned(owner, key) : true;
  }

  function isOwnedPassiveForDisplay(owner, key) {
    return typeof isPassiveOwned === "function" ? isPassiveOwned(owner, key) : true;
  }

  function getSkillLevelForDisplay(owner, key) {
    return typeof getSkillLevel === "function" ? getSkillLevel(owner, key) : 0;
  }

  function canEquipSkillWithCurrentWeapon(unit, skill) {
    if (!unit || !skill) {
      return false;
    }
    const weapon = getUnitWeaponItem(unit);
    if (Array.isArray(skill.requiredWeaponItemIds) && skill.requiredWeaponItemIds.length) {
      return Boolean(weapon && skill.requiredWeaponItemIds.includes(weapon.id));
    }
    if (Array.isArray(skill.requiredWeapons) && skill.requiredWeapons.length) {
      return Boolean(weapon && skill.requiredWeapons.includes(weapon.weaponType));
    }
    return true;
  }

  function sortPickerCandidatesByAvailability(candidates, isAvailable) {
    return (Array.isArray(candidates) ? candidates : [])
      .map((entry, index) => ({
        entry,
        index,
        available: Boolean(isAvailable && isAvailable(entry)),
      }))
      .sort((a, b) => {
        if (a.available !== b.available) {
          return a.available ? -1 : 1;
        }
        return a.index - b.index;
      })
      .map((wrapped) => wrapped.entry);
  }

  function getSkillConditionLabel(skill) {
    if (!skill) {
      return "";
    }
    if (Array.isArray(skill.requiredWeapons) && skill.requiredWeapons.length) {
      return skill.requiredWeapons.join("/");
    }
    if (Array.isArray(skill.requiredWeaponItemIds) && skill.requiredWeaponItemIds.length) {
      return skill.requiredWeaponItemIds
        .map((id) => EQUIPMENT_DATA && EQUIPMENT_DATA.items && EQUIPMENT_DATA.items[id] ? EQUIPMENT_DATA.items[id].name || id : id)
        .join("/");
    }
    return skill.conditionText || "";
  }

  function getSkillIdentity(owner, key, skill) {
    const sourceOwner = skill && skill.sourceOwner ? skill.sourceOwner : owner;
    const sourceKey = skill && skill.sourceKey ? skill.sourceKey : key;
    return `${sourceOwner}:${sourceKey}`;
  }

  function getActiveSkillEquipState(unit, key, skill) {
    if (!unit || !skill) {
      return null;
    }
    const owner = unit.skillOwner || unit.id;
    const loadout = getEquipmentLoadout(unit);
    if (Array.isArray(loadout.active) && loadout.active.includes(key)) {
      return "current";
    }
    const identity = getSkillIdentity(owner, key, skill);
    for (const otherUnit of getEquipmentComparisonUnits(unit.id)) {
      const otherOwner = otherUnit.skillOwner || otherUnit.id;
      const otherLoadout = getEquipmentLoadout(otherUnit);
      for (const otherKey of Array.isArray(otherLoadout.active) ? otherLoadout.active : []) {
        const otherSkill = SKILL_DATA && SKILL_DATA[otherOwner] && SKILL_DATA[otherOwner][otherKey];
        if (otherSkill && getSkillIdentity(otherOwner, otherKey, otherSkill) === identity) {
          return "other";
        }
      }
    }
    return null;
  }

  function getPassiveSkillEquipState(unit, key) {
    if (!unit || !key) {
      return null;
    }
    const loadout = getEquipmentLoadout(unit);
    if (loadout.passive === key) {
      return "current";
    }
    for (const otherUnit of getEquipmentComparisonUnits(unit.id)) {
      const otherLoadout = getEquipmentLoadout(otherUnit);
      if (otherLoadout.passive === key) {
        return "other";
      }
    }
    return null;
  }

  function getUltimateSkillEquipState(unit, key, skill) {
    if (!unit || !skill) {
      return null;
    }
    const owner = unit.skillOwner || unit.id;
    const loadout = getEquipmentLoadout(unit);
    if (loadout.ultimate === key) {
      return "current";
    }
    const identity = getSkillIdentity(owner, key, skill);
    for (const otherUnit of getEquipmentComparisonUnits(unit.id)) {
      const otherOwner = otherUnit.skillOwner || otherUnit.id;
      const otherLoadout = getEquipmentLoadout(otherUnit);
      const otherKey = otherLoadout.ultimate;
      const otherSkill = otherKey && SKILL_DATA && SKILL_DATA[otherOwner] && SKILL_DATA[otherOwner][otherKey];
      if (otherSkill && getSkillIdentity(otherOwner, otherKey, otherSkill) === identity) {
        return "other";
      }
    }
    return null;
  }

  function getEquipmentItemEquipState(unit, item) {
    if (!unit || !item) {
      return null;
    }
    const itemRef = getEquipmentRefForDisplay(item);
    if (unit.equipment && Object.values(unit.equipment).some((ref) => getEquipmentRefForDisplay(ref) === itemRef)) {
      return "current";
    }
    for (const otherUnit of getEquipmentComparisonUnits(unit.id)) {
      if (otherUnit.equipment && Object.values(otherUnit.equipment).some((ref) => getEquipmentRefForDisplay(ref) === itemRef)) {
        return "other";
      }
    }
    return null;
  }

  function getEquipmentComparisonUnits(exceptUnitId) {
    return equipmentUnitOrder
      .filter((unitId) => unitId !== exceptUnitId)
      .map((unitId) => getEquipmentDisplayUnit(unitId))
      .filter(Boolean);
  }

  function isUltimateSkill(owner, key) {
    const skill = SKILL_DATA && SKILL_DATA[owner] && SKILL_DATA[owner][key];
    return Boolean(skill && (key === "ult" || skill.category === "必殺技"));
  }

  function getUltimateSkillCandidates(owner) {
    return Object.entries(SKILL_DATA && SKILL_DATA[owner] || {})
      .filter(([key]) => isUltimateSkill(owner, key))
      .map(([key, skill]) => ({ key, skill }));
  }

  function getEquipmentUltimateSkillEntry(unit) {
    if (!unit) {
      return { key: null, skill: null };
    }
    const owner = unit.skillOwner || unit.id;
    const loadout = getEquipmentLoadout(unit);
    const selectedKey = loadout.ultimate && isUltimateSkill(owner, loadout.ultimate) ? loadout.ultimate : null;
    if (selectedKey) {
      return { key: selectedKey, skill: SKILL_DATA[owner][selectedKey] };
    }
    const fallback = getUltimateSkillCandidates(owner)[0] || null;
    return fallback || { key: null, skill: null };
  }

  function getPassiveData(owner, passiveKey) {
    return passiveKey && PASSIVE_DATA && PASSIVE_DATA[owner] ? PASSIVE_DATA[owner][passiveKey] || null : null;
  }

  function getEquipmentFullName(unit) {
    if (!unit) {
      return "";
    }
    if (unit.id === "finald") {
      return typeof getPlayerFullName === "function" ? getPlayerFullName() : (unit.name || "アルジュナ・フィナルド");
    }
    return STATUS_FULL_NAMES && STATUS_FULL_NAMES[unit.id] || unit.name || unit.id;
  }

  function getEquipmentShortName(unit) {
    if (!unit) {
      return "";
    }
    if (unit.id === "finald") {
      return typeof getPlayerFirstName === "function" ? getPlayerFirstName() : (unit.name || "アルジュナ");
    }
    return unit.name || unit.id;
  }

  function getEquipmentRoleLabel(unit) {
    const labels = {
      support: "白魔法士",
      hero: "剣士",
      monk: "モンク",
      mage: "黒魔法士",
    };
    return labels[unit.role] || unit.role || "";
  }

  function getEquipmentStatRows(unit) {
    if (statPresenter && typeof statPresenter.getDetailedStats === "function") {
      return statPresenter.getDetailedStats(unit, { includeBattleState: false });
    }
    return [
      { label: "HP", value: formatSystemNumber(unit.maxHp) },
      { label: "MP", value: formatSystemNumber(unit.maxMp) },
      { label: "攻撃力", value: formatSystemNumber(callStat(getEffectiveAttack, unit, unit.attack)) },
      { label: "魔力", value: formatSystemNumber(callStat(getEffectiveMagic, unit, unit.magic)) },
      { label: "防御力", value: formatSystemNumber(callStat(getEffectiveDefense, unit, unit.defense)) },
      { label: "魔法防御力", value: formatSystemNumber(callStat(getEffectiveMagicDefense, unit, unit.magicDefense)) },
      { label: "会心率", value: formatSystemPercent(callStat(getEffectiveCritChance, unit, unit.critChance || 0)) },
      { label: "会心ダメージ", value: formatSystemPercent(callStat(getEffectiveCritDamageRate, unit, unit.critDamage || 0)) },
      { label: "ガード率", value: formatSystemPercent(callStat(getEffectiveGuardChance, unit, unit.guardChance || 0)) },
      { label: "ガード軽減率", value: formatSystemPercent(callStat(getGuardDamageReductionRate, unit, 0)) },
      { label: "HP再生率", value: formatSystemPercent(callStat(getHpRegenRate, unit, 0)) },
      { label: "MP再生率", value: formatSystemPercent(callStat(getMpRegenRate, unit, 0)) },
    ];
  }

  function getEquipmentSetEffectLines(setEffects) {
    const grouped = new Map();
    for (const entry of setEffects || []) {
      if (!entry || !entry.seriesKey) {
        continue;
      }
      if (!grouped.has(entry.seriesKey)) {
        const series = EQUIPMENT_DATA && EQUIPMENT_DATA.series ? EQUIPMENT_DATA.series[entry.seriesKey] : null;
        const maxThreshold = Number.isFinite(entry.maxThreshold) && entry.maxThreshold > 0
          ? entry.maxThreshold
          : getSetEffectMaxThreshold(series);
        grouped.set(entry.seriesKey, {
          series,
          count: Number.isFinite(entry.count) ? entry.count : 0,
          maxThreshold,
          entries: [],
        });
      }
      grouped.get(entry.seriesKey).entries.push(entry);
    }

    const lines = [];
    for (const [seriesKey, group] of grouped.entries()) {
      const name = group.series && group.series.name ? group.series.name : seriesKey;
      const max = Math.max(1, group.maxThreshold || 1);
      const count = Math.min(max, Math.max(0, Math.floor(group.count || 0)));
      lines.push({ text: `${name}(${count}/${max})`, header: true });
      group.entries
        .sort((a, b) => (a.threshold || 0) - (b.threshold || 0))
        .forEach((entry) => {
          const description = getSetEffectDescription(entry);
          if (description) {
            const effectName = getSetEffectName(entry);
            lines.push({ text: effectName ? `${effectName}: ${description}` : description, header: false });
          }
        });
    }
    return lines;
  }

  function getSetEffectMaxThreshold(series) {
    const thresholds = EQUIPMENT_DATA && Array.isArray(EQUIPMENT_DATA.setThresholds) ? EQUIPMENT_DATA.setThresholds : [];
    return thresholds.reduce((max, threshold) => (
      series && series.setEffects && series.setEffects[threshold]
        ? Math.max(max, threshold)
        : max
    ), 0);
  }

  function getSetEffectDescription(entry) {
    const effect = entry && entry.effect;
    if (!effect) {
      return "";
    }
    if (effect.simpleDescription) {
      return effect.simpleDescription;
    }
    if (effect.description) {
      return effect.description;
    }
    return getSetEffectStatsText(effect);
  }

  function getSetEffectName(entry) {
    const effect = entry && entry.effect;
    if (effect && effect.name) {
      return effect.name;
    }
    const threshold = entry && Number.isFinite(entry.threshold) ? Math.floor(entry.threshold) : 0;
    return threshold > 0 ? `${threshold}セット効果` : "";
  }

  function getSetEffectStatsText(effect) {
    const stats = [];
    for (const [key, value] of Object.entries(effect.flatStatBonuses || {})) {
      stats.push(`${getStatLabel(key)}+${formatSystemNumber(value)}`);
    }
    for (const [key, value] of Object.entries(effect.statBonuses || {})) {
      stats.push(`${getStatLabel(key)}${formatEquipmentStatPercent(key, value, true)}`);
    }
    return stats.join(" / ");
  }

  function callStat(fn, unit, fallback) {
    return typeof fn === "function" ? fn(unit) : fallback;
  }

  function getStatLabel(key) {
    const labels = {
      maxHp: "HP",
      maxMp: "MP",
      attack: "攻撃力",
      magic: "魔力",
      defense: "防御力",
      magicDefense: "魔法防御力",
      guardChance: "ガード率",
      guardDamageReduction: "ガード軽減率",
      critChance: "会心率",
      critDamage: "会心ダメージ",
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
    return labels[key] || key;
  }

  function formatSystemNumber(value) {
    return `${Math.round(Number.isFinite(value) ? value : 0)}`;
  }

  function formatSystemDecimal(value) {
    const numeric = Number.isFinite(value) ? value : 0;
    return Number.isInteger(numeric) ? `${numeric}` : `${Math.round(numeric * 10) / 10}`;
  }

  function formatEquipmentStatPercent(key, value, signed = false) {
    const numeric = Number.isFinite(value) ? value : 0;
    const displayValue = isReductionStatKey(key) ? -numeric : numeric;
    return formatSystemPercent(displayValue, signed);
  }

  function isReductionStatKey(key) {
    return ["damageResistance", "physicalDamageResistance", "magicDamageResistance"].includes(key);
  }

  function formatSystemPercent(value, signed = false) {
    const numeric = Number.isFinite(value) ? value : 0;
    const percent = Math.round(numeric * 100);
    return `${signed && percent > 0 ? "+" : ""}${percent}%`;
  }

  function drawFittedSystemText(text, x, y, maxWidth, weight, maxSize, minSize, color, align = "left", baseline = "top") {
    const value = String(text || "");
    let size = maxSize;
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    while (size > minSize) {
      ctx.font = `${weight} ${size}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      if (ctx.measureText(value).width <= Math.max(10, maxWidth)) {
        break;
      }
      size -= 1;
    }
    ctx.font = `${weight} ${size}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
    ctx.restore();
  }

  function lightenColor(color, amount) {
    const match = /^#([0-9a-f]{6})$/i.exec(color || "");
    if (!match) {
      return color || "#ffffff";
    }
    const raw = match[1];
    const r = Math.min(255, Math.round(parseInt(raw.slice(0, 2), 16) + 255 * amount));
    const g = Math.min(255, Math.round(parseInt(raw.slice(2, 4), 16) + 255 * amount));
    const b = Math.min(255, Math.round(parseInt(raw.slice(4, 6), 16) + 255 * amount));
    return `rgb(${r},${g},${b})`;
  }

  function drawSystemConfirm(confirm) {
    drawSystemMenuBackdrop(game.state === "playing" ? 0.56 : 0.34);
    const w = Math.min(440, view.w - 36);
    const h = 220;
    const x = (view.w - w) / 2;
    const y = (view.h - h) / 2;
    ctx.save();
    ctx.fillStyle = "rgba(247,255,246,0.98)";
    ctx.strokeStyle = "rgba(16,32,24,0.38)";
    ctx.lineWidth = 1.2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = "900 22px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(confirm.title || "確認", x + 24, y + 22);
    drawSystemCloseButton(x + w - 44, y + 16, "closeSystemConfirm");
    ctx.font = "500 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const lines = Array.isArray(confirm.lines) ? confirm.lines : [];
    for (let i = 0; i < lines.length; i += 1) {
      ctx.fillText(lines[i], x + 24, y + 72 + i * 25);
    }
    drawSystemDialogButton(x + w - 214, y + h - 58, 88, 34, "キャンセル", "closeSystemConfirm", false);
    drawSystemDialogButton(x + w - 114, y + h - 58, 88, 34, confirm.confirmAction ? "決定" : "表示のみ", "confirmOnly", true);
    ctx.restore();
  }

  function drawSystemCloseButton(x, y, action) {
    const size = 30;
    ctx.save();
    ctx.fillStyle = "rgba(16,32,24,0.08)";
    ctx.strokeStyle = "rgba(16,32,24,0.3)";
    ctx.lineWidth = 1;
    roundRect(x, y, size, size, 7);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#102018";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 9);
    ctx.lineTo(x + size - 9, y + size - 9);
    ctx.moveTo(x + size - 9, y + 9);
    ctx.lineTo(x + 9, y + size - 9);
    ctx.stroke();
    ctx.restore();
    addSystemMenuTarget({ action, x, y, w: size, h: size });
  }

  function drawSystemDialogButton(x, y, w, h, label, action, subdued) {
    ctx.save();
    ctx.fillStyle = subdued ? "rgba(16,32,24,0.1)" : "#102018";
    ctx.strokeStyle = subdued ? "rgba(16,32,24,0.24)" : "#102018";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = subdued ? "#102018" : "#f7fff6";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2 + 0.5);
    ctx.restore();
    addSystemMenuTarget({ action, x, y, w, h });
  }

  function drawPanel(x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(16, 22, 18, 0.76)";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawBar(x, y, w, h, ratio, back, fill) {
    const value = clamp(ratio, 0, 1);
    ctx.fillStyle = back;
    roundRect(x, y, w, h, Math.min(4, h / 2));
    ctx.fill();
    ctx.fillStyle = fill;
    roundRect(x, y, w * value, h, Math.min(4, h / 2));
    ctx.fill();
  }

  function drawCircleGauge(x, y, radius, ratio, back, fill) {
    const value = clamp(ratio, 0, 1);
    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = back;
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + TAU);
    ctx.stroke();
    if (value > 0) {
      ctx.strokeStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + TAU * value);
      ctx.stroke();
    }
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
      draw,
      screenToTownPoint: townRenderer.screenToTownPoint,
      drawAimRangeCircle,
    };
  };
})();
