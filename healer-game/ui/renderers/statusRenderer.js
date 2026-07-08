(() => {
  "use strict";

  window.createHealerStatusRenderer = function createHealerStatusRenderer(context) {
    const {
      canvasCtx: ctx,
      TAU,
      view,
      game,
      input,
      player,
      party,
      enemies,
      expandedStatusUnitIds,
      statusUiButtons,
      statusCardMetas,
      statusTooltipTargets,
      COLORS,
      ACTION_GAP,
      ULTIMATE_KEYS,
      STATUS_FULL_NAMES,
      STATUS_DATA,
      ITEM_SLOT_KEYS,
      getKeybindLabel,
      getPlayerFirstName,
      COMMAND_BIAS_CONFIGS,
      RIHAS_PASSIVE_MAX_STACKS,
      RIHAS_PASSIVE_STACK_DURATION,
      SUSHIA_PASSIVE_MAX_STACKS,
      SUSHIA_PASSIVE_STACK_DURATION,
      skillSystem,
      getBattleBounds,
      clamp,
      getMoodOutgoingDamageMultiplier,
      getMoodIncomingDamageMultiplier,
      getCommandOutgoingDamageMultiplier,
      getCommandIncomingDamageMultiplier,
      getMoodCooldownMultiplier,
      getMoodCooldown,
      getMoodCastTimeMultiplier,
      getCastSpeed,
      getSushiaCastTime,
      getRihasPassiveDamageMultiplier,
      getRihasPassiveIncomingMultiplier,
      getPhysicalDamageBoost,
      getMagicDamageBoost,
      getDamageBoost,
      getDamageResistance,
      getPhysicalDamageResistance,
      getMagicDamageResistance,
      getEffectiveAttack,
      getEffectiveMagic,
      getEffectiveDefense,
      getEffectiveMagicDefense,
      getEffectiveMoveSpeed,
      getUltimateChargeRate: getBattleUltimateChargeRate,
      getEffectiveGuardChance,
      getGuardDamageReductionRate,
      getEffectiveCritChance,
      getEffectiveCritDamageRate,
      getHpRegenRate,
      getMpRegenRate,
      getElementKeys,
      getElementName,
      getElementShortName,
      getNormalElement,
      getElementBoostBonus,
      getElementResistanceBonus,
      getEquipmentStatBonusSum,
      hasPassive,
      getEquippedPassive,
      getSkillLevel,
    } = context;
    const SKILL_LEVEL_ROMAN = ["", "I", "II", "III", "IV", "V"];
    const statusData = STATUS_DATA || window.HEALER_STATUS_DATA || {};
    const tooltipText = window.createHealerTooltipText(context);
    const statPresenter = context.statPresenter || (window.createHealerStatPresenter ? window.createHealerStatPresenter(context) : null);
    if (!statPresenter || typeof statPresenter.getDetailedStats !== "function") {
      throw new Error("createHealerStatPresenter must be loaded before ui/renderers/statusRenderer.js");
    }

  function getBattleActionLabel(actionId, fallback = "") {
    if (typeof getKeybindLabel !== "function" || !actionId) {
      return fallback;
    }
    return getKeybindLabel(actionId) || fallback;
  }

  function getUltimateActionId(unitId) {
    const ids = {
      ulpes: "battle.ultimate.ulpes",
      rihas: "battle.ultimate.rihas",
      sushia: "battle.ultimate.sushia",
      finald: "battle.ultimate.finald",
    };
    return ids[unitId] || "";
  }

  function getItemSlotOwnerUnit(unitId) {
    if (!unitId) {
      return null;
    }
    if (player && player.id === unitId) {
      return player;
    }
    if (!Array.isArray(party)) {
      return null;
    }
    return party.find((unit) => unit && unit.id === unitId) || null;
  }

  function getDefaultItemKeyLabel(index) {
    const slotKeys = Array.isArray(ITEM_SLOT_KEYS) && ITEM_SLOT_KEYS.length ? ITEM_SLOT_KEYS : ["c", "v", "b", "n"];
    const key = slotKeys[index] || "";
    return String(key).toUpperCase();
  }

  function getDefaultItemOwnerLabel(index) {
    return ["ウルペス", "リハス", "スシア", "アルジュナ"][index] || "";
  }

  function getUltimateCost(unit) {
    return skillSystem && typeof skillSystem.getUltimateCost === "function"
      ? skillSystem.getUltimateCost(unit)
      : 100;
  }

  function drawHud() {
    statusUiButtons.length = 0;
    statusCardMetas.length = 0;
    if (Array.isArray(statusTooltipTargets)) {
      statusTooltipTargets.length = 0;
    }
    drawArjunaHud();
    drawAllyStatusCards();
    drawStatusTooltip();
  }

  function drawAllyStatusCards() {
    const allies = party.filter((member) => member.id !== "finald");
    const units = [...allies, player];
    const bounds = getBattleBounds();
    const gap = clamp(view.w * 0.009, 6, 10);
    const margin = clamp(view.w * 0.016, 10, 18);
    const cardW = (view.w - margin * 2 - gap * (units.length - 1)) / Math.max(1, units.length);
    const bottomReserve = view.h - bounds.bottom;
    const idealH = clamp(view.h * 0.16, 112, 136);
    const cardH = Math.min(idealH, Math.max(78, bottomReserve - 14));
    const y = view.h - cardH - 8;
    for (let i = 0; i < units.length; i += 1) {
      drawAllyCard(units[i], margin + i * (cardW + gap), y, cardW, cardH);
    }
    drawExpandedStatusPanels();
  }

  function drawAllyCard(unit, x, y, w, h) {
    const isArjuna = unit.id === "finald";
    const pad = clamp(w * 0.06, 8, 14);
    const compact = w < 220 || h < 116;
    const actionGaugeRadius = compact ? 15 : 18;
    const ultGaugeRadius = compact ? 16 : 18;
    const iconAreaX = x + pad;
    const iconAreaW = clamp(w * 0.25, compact ? 44 : 58, compact ? 58 : 76);
    const iconCenterX = iconAreaX + iconAreaW / 2;
    const portraitSize = Math.min(compact ? 44 : 64, iconAreaW, Math.max(30, h - pad * 2 - 38));
    const portraitX = iconCenterX - portraitSize / 2;
    const portraitY = y + h - pad - portraitSize - 3;
    const barGap = compact ? 5 : 8;
    const barX = iconAreaX + iconAreaW + barGap;
    const ultGaugeX = x + w - pad - ultGaugeRadius - 3;
    const actionGaugeX = ultGaugeX - ultGaugeRadius - actionGaugeRadius - 8;
    const statusRight = isArjuna ? ultGaugeX - ultGaugeRadius - 8 : actionGaugeX - actionGaugeRadius - 6;
    const barW = Math.max(0, x + w - pad - barX);
    const barH = compact ? 7 : 8;
    const barStep = compact ? 15 : 17;
    const hpY = y + pad + (compact ? 0 : 2);
    const mpY = hpY + barStep;
    const moodY = mpY + barStep;
    const commandY = moodY + (compact ? 16 : 18);
    const gaugeY = y + h - Math.max(ultGaugeRadius + 9, pad * 0.45 + 8);
    const statusIconSize = compact ? 14 : 16;
    const statusIconY = gaugeY - statusIconSize - 2;
    const statusIconMaxWidth = Math.max(0, statusRight - barX);
    const incapacitated = Boolean(unit.dead);
    statusCardMetas.push({ unitId: unit.id, x, y, w, h, statusIconMaxWidth, statusIconSize });

    drawPanel(x, y, w, h);
    drawDangerCardFlash(unit, x, y, w, h);
    statusUiButtons.push({ action: "consume", x, y, w, h });

    drawFittedText(getStatusDisplayName(unit), iconCenterX, y + pad + 11, iconAreaW + 10, 800, compact ? 11 : 13, 9, "#f7fff6", "center");
    drawFittedText(getRoleLabel(unit), iconCenterX, y + pad + 26, iconAreaW + 10, 700, compact ? 9 : 10, 8, "#cfe0d2", "center");

    drawCharacterUiPortrait(unit, portraitX, portraitY, portraitSize);

    if (!isArjuna) {
      drawActionCooldownGauge(unit, actionGaugeX, gaugeY, actionGaugeRadius);
    }
    const ultimateCost = getUltimateCost(unit);
    drawCircleGauge(ultGaugeX, gaugeY, ultGaugeRadius, unit.ult / ultimateCost, "rgba(0,0,0,0.45)", "#73dfff");
    ctx.fillStyle = "rgba(10,13,12,0.84)";
    ctx.beginPath();
    ctx.arc(ultGaugeX, gaugeY, Math.max(7, ultGaugeRadius - 6), 0, TAU);
    ctx.fill();

    if (unit.ult >= ultimateCost) {
      ctx.strokeStyle = "rgba(255,255,255,0.82)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ultGaugeX, gaugeY, ultGaugeRadius + 3, 0, TAU);
      ctx.stroke();
    }

    const ultKey = getBattleActionLabel(getUltimateActionId(unit.id), ULTIMATE_KEYS[unit.id]);
    if (ultKey) {
      const keyX = ultGaugeX;
      const keyY = gaugeY;
      ctx.font = "800 10px 'Segoe UI', sans-serif";
      const keyW = Math.max(16, Math.min(44, ctx.measureText(ultKey).width + 8));
      ctx.fillStyle = unit.ult >= ultimateCost ? "#73dfff" : "rgba(7,10,9,0.88)";
      ctx.strokeStyle = unit.ult >= ultimateCost ? "#ffffff" : "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1;
      roundRect(keyX - keyW / 2, keyY - 8, keyW, 16, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = unit.ult >= ultimateCost ? "#111111" : "#f7fff6";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      drawFittedText(ultKey, keyX, keyY + 4, keyW - 4, 800, 10, 6, unit.ult >= ultimateCost ? "#111111" : "#f7fff6", "center");
      ctx.textBaseline = "alphabetic";
    }

    if (!incapacitated) {
      drawStatusIcons(unit, barX, statusIconY, statusIconMaxWidth, statusIconSize);
    }

    drawLabeledBar("HP", barX, hpY, barW, barH, unit.hp / unit.maxHp, "#132115", COLORS.hp, {
      text: `${Math.ceil(unit.hp)}/${unit.maxHp}${unit.shield > 0 ? ` +${Math.ceil(unit.shield)}` : ""}`,
      shieldRatio: unit.maxHp > 0 ? unit.shield / unit.maxHp : 0,
    });
    if (unit.maxMp > 0) {
      drawLabeledBar("MP", barX, mpY, barW, Math.max(5, barH - 1), unit.mp / unit.maxMp, "#131b2a", COLORS.mp, {
        text: `${Math.ceil(unit.mp)}/${unit.maxMp}`,
      });
    }
    if (unit.mood !== null) {
      drawLabeledBar("調子", barX, moodY, barW, Math.max(5, barH - 1), unit.mood / 100, "#2b2615", getMoodColor(unit.mood), {
        text: `${Math.round(unit.mood)}%`,
      });
    }
    if (!isArjuna) {
      drawCommandBiasMeter(barX, commandY, barW, 8, unit.commandBias || 0, unit.activeCommandBias || 0);
    }

    const triangleSize = 15;
    const buttonSize = 34;
    const buttonOutset = 10;
    const bx = x + w - buttonSize;
    const by = y - buttonOutset;
    statusUiButtons.push({ action: "toggle", unitId: unit.id, x: bx, y: by, w: buttonSize + buttonOutset, h: buttonSize + buttonOutset });
    drawCornerTriangleButton(x + w - triangleSize, y, triangleSize, expandedStatusUnitIds.has(unit.id) ? "close" : "expand", "topRight");
    if (incapacitated) {
      drawIncapacitatedCardOverlay(x, y, w, h);
      drawStatusIcons(unit, barX, statusIconY, statusIconMaxWidth, statusIconSize);
    }
  }

  function drawIncapacitatedCardOverlay(x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(30,34,34,0.62)";
    ctx.strokeStyle = "rgba(214,222,220,0.48)";
    ctx.lineWidth = 1.2;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    const badgeW = Math.min(w - 32, 92);
    const badgeH = 24;
    const badgeX = x + w / 2 - badgeW / 2;
    const badgeY = y + h / 2 - badgeH / 2;
    ctx.fillStyle = "rgba(222,228,226,0.9)";
    ctx.strokeStyle = "rgba(8,12,12,0.48)";
    ctx.lineWidth = 1;
    roundRect(badgeX, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#242828";
    ctx.font = "900 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("戦闘不能", x + w / 2, badgeY + badgeH / 2 + 0.5);
    ctx.restore();
  }

  function drawExpandedStatusPanels() {
    if (!expandedStatusUnitIds.size) {
      return;
    }
    for (const unitId of [...expandedStatusUnitIds]) {
      drawExpandedStatusPanel(unitId);
    }
  }

  function drawExpandedStatusPanel(unitId) {
    const unit = getPartyUnitById(unitId);
    const meta = statusCardMetas.find((item) => item.unitId === unitId);
    if (!unit || !meta) {
      expandedStatusUnitIds.delete(unitId);
      return;
    }

    const battleBounds = getBattleBounds();
    const panelW = Math.min(meta.w, view.w - 24);
    const panelBottom = meta.y - 7;
    const availableH = Math.max(210, panelBottom - battleBounds.top - 8);
    const panelH = Math.min(clamp(view.h * 0.66, 430, 620), availableH);
    const panelY = Math.max(battleBounds.top + 4, panelBottom - panelH);
    const panelX = clamp(meta.x, 12, view.w - panelW - 12);
    drawPanel(panelX, panelY, panelW, panelH);
    statusUiButtons.push({ action: "consume", x: panelX, y: panelY, w: panelW, h: panelH });

    const innerX = panelX + 14;
    const innerY = panelY + 16;
    const innerW = panelW - 28;
    const hiddenIcons = getOverflowStatusIcons(unit, meta.statusIconMaxWidth, meta.statusIconSize);

    const hiddenH = drawHiddenStatusDetails(hiddenIcons, innerX, innerY, innerW);
    const statsY = innerY + hiddenH + 10;
    const statsH = drawDetailedStats(unit, innerX, statsY, innerW, panelH - hiddenH - 96);
    const skillsY = statsY + statsH + 10;
    drawDetailedSkills(unit, innerX, skillsY, innerW, panelY + panelH - skillsY - 24);

    const triangleSize = 16;
    const buttonSize = 36;
    const buttonOutset = 10;
    const bx = panelX + panelW - buttonSize;
    const by = panelY - buttonOutset;
    statusUiButtons.push({ action: "close", unitId, x: bx, y: by, w: buttonSize + buttonOutset, h: buttonSize + buttonOutset });
    drawCornerTriangleButton(panelX + panelW - triangleSize, panelY, triangleSize, "close", "topRight");
  }

  function drawCornerTriangleButton(x, y, size, mode, corner = "bottomRight") {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "rgba(0,0,0,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (corner === "topRight") {
      ctx.moveTo(x + size, y);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x + size, y);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x, y + size);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function getPartyUnitById(id) {
    return party.find((unit) => unit.id === id) || (player.id === id ? player : null);
  }

  function drawHiddenStatusDetails(hiddenIcons, x, y, w) {
    const iconSize = 18;
    const gap = 4;
    const rows = 3;
    const columns = Math.max(3, Math.floor((w + gap) / (iconSize + gap)));
    const capacity = columns * rows;
    const gridW = columns * iconSize + (columns - 1) * gap;
    const startX = x + Math.max(0, (w - gridW) / 2);
    if (hiddenIcons.length) {
      const hasOverflow = hiddenIcons.length > capacity;
      const count = hasOverflow ? capacity - 1 : Math.min(hiddenIcons.length, capacity);
      for (let i = 0; i < count; i += 1) {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const ix = startX + col * (iconSize + gap);
        const iy = y + row * (iconSize + gap);
        drawStatusIcon(hiddenIcons[i], ix, iy, iconSize);
        registerStatusTooltip(hiddenIcons[i], ix, iy, iconSize);
      }
      if (hasOverflow) {
        const lastIndex = capacity - 1;
        const col = lastIndex % columns;
        const row = Math.floor(lastIndex / columns);
        drawStatusIcon({ label: "…", color: "#5d6864", ratio: 1 }, startX + col * (iconSize + gap), y + row * (iconSize + gap), iconSize);
      }
      return Math.ceil((hasOverflow ? capacity : count) / columns) * (iconSize + gap);
    }

    return 0;
  }

  function drawDetailedStats(unit, x, y, w, h) {
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("詳細ステータス", x, y);

    const stats = getDetailedStats(unit);
    const rowH = w >= 250 ? 26 : (w >= 230 ? 28 : 27);
    const colGap = 7;
    const columns = w < 190 ? 1 : (w < 230 ? 2 : (w < 250 ? 3 : 4));
    const colW = (w - colGap * (columns - 1)) / columns;
    const startY = y + 29;
    let cellIndex = 0;
    let extraY = 0;
    for (const stat of stats) {
      if (stat.breakAfter) {
        cellIndex = Math.ceil(cellIndex / columns) * columns;
        extraY += 4;
        continue;
      }
      const col = cellIndex % columns;
      const row = Math.floor(cellIndex / columns);
      const sx = x + col * (colW + colGap);
      const sy = startY + row * rowH + extraY;
      if (sy > y + h - 18) {
        return Math.max(36, h);
      }
      drawDetailStatRow(stat.label, stat.value, sx, sy, colW);
      cellIndex += 1;
    }
    return 29 + Math.ceil(cellIndex / columns) * rowH + extraY;
  }

  function drawDetailStatRow(label, value, x, y, w) {
    drawFittedText(label, x, y, w, 700, 12, 8, "#aebdb4", "left");
    drawFittedText(value, x, y + 15, w, 800, 14, 9, "#f7fff6", "left");
  }

  function getDetailedStats(unit) {
    return statPresenter.getDetailedStats(unit);
  }

  function drawDetailedSkills(unit, x, y, w, h) {
    if (w < 70) {
      return;
    }
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("スキル", x, y);

    const skills = getDetailedSkillEntries(unit);
    const iconSize = 35;
    const gapX = 7;
    const gapY = 26;
    const columns = Math.max(1, Math.floor((w + gapX) / (iconSize + gapX)));
    for (let i = 0; i < skills.length; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const sx = x + col * (iconSize + gapX);
      const sy = y + 20 + row * (iconSize + gapY);
      if (sy + iconSize > y + h) {
        break;
      }
      drawSkillCooldownIcon(skills[i], sx, sy, iconSize);
      registerSkillTooltip(unit, skills[i], sx, sy, iconSize);
    }
  }

  function getDetailedSkillEntries(unit) {
    const entries = skillSystem.getUnitSkillEntries
      ? skillSystem.getUnitSkillEntries(unit)
      : Object.entries(skillSystem.data[unit.id] || {}).map(([key, skill]) => ({ key, skill }));
    return entries.map(({ key, skill, level }) => {
      const cooldown = getSkillCooldownDetail(unit, key, skill);
      return { key, skill, level: Number.isFinite(level) ? level : getSkillLevelForDisplay(unit, key), ...cooldown };
    });
  }

  function getSkillCooldownDetail(unit, key, skill) {
    if (key === "ult") {
      const ultimateCost = getUltimateCost(unit);
      const remaining = unit.ult >= ultimateCost ? 0 : ultimateCost - unit.ult;
      return { remaining, max: ultimateCost, text: unit.ult >= ultimateCost ? "OK" : `${Math.round(unit.ult)}/${ultimateCost}%`, gauge: true };
    }
    const max = key === "attack" && unit.id !== "finald"
      ? skillSystem.getActionCooldown(unit)
      : (skill.cd ? getMoodCooldown(unit, skill.cd) : 0);
    const remaining = unit.cds[key] || 0;
    return { remaining, max: Math.max(0.1, max), text: remaining > 0 ? `${Math.ceil(Math.max(0, remaining))}` : "OK", gauge: false };
  }

  function drawSkillCooldownIcon(entry, x, y, size) {
    const ratio = entry.max > 0 ? clamp(entry.remaining / entry.max, 0, 1) : 0;
    ctx.save();
    ctx.fillStyle = entry.gauge ? "#73dfff" : "#d4e4d5";
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    roundRect(x, y, size, size, 7);
    ctx.fill();
    ctx.stroke();
    roundRect(x, y, size, size, 7);
    ctx.clip();
    if (ratio > 0) {
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.fillStyle = "rgba(0,0,0,0.58)";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, size * 0.82, -Math.PI / 2, -Math.PI / 2 + TAU * ratio);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#101814";
    ctx.font = "800 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(getSkillIconLabel(entry.skill), x + size / 2, y + size / 2 + 0.5);
    drawSkillLevelBadge(x + size - 2, y + size - 2, entry.level || 0);
    ctx.restore();

    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(entry.text, x + size / 2, y + size + 11);
  }

  function getSkillIconLabel(skill) {
    return Array.from(skill.name || "?")[0] || "?";
  }

  function getSkillLevelForDisplay(unit, key) {
    if (typeof getSkillLevel !== "function" || !unit || !key) {
      return 0;
    }
    return getSkillLevel(unit.skillOwner || unit.id, key);
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
    ctx.font = "900 8px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const width = Math.max(15, ctx.measureText(label).width + 7);
    const height = 12;
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

  function drawCharacterUiPortrait(unit, x, y, size) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(x, y, size, size, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();

    roundRect(x, y, size, size, 8);
    ctx.clip();
    ctx.fillStyle = unit.color;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.28, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.font = `800 ${Math.max(11, size * 0.34)}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(unit.label || unit.name.slice(0, 1), x + size / 2, y + size / 2 + 0.5);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  function getRoleLabel(unit) {
    if (unit.id === "ulpes") return "勇者";
    if (unit.id === "rihas") return "モンク";
    if (unit.id === "sushia") return "黒魔法士";
    if (unit.id === "finald") return "白魔法士";
    return unit.role || "";
  }

  function getStatusDisplayName(unit) {
    return STATUS_FULL_NAMES[unit.id] || unit.name;
  }

  function isLowHp(unit) {
    return Boolean(unit && unit.team === "party" && unit.maxHp > 0 && unit.hp / unit.maxHp <= 0.25);
  }

  function drawDangerCardFlash(unit, x, y, w, h) {
    if (!isLowHp(unit)) {
      return;
    }
    const pulse = 0.45 + Math.sin(game.time * 10) * 0.28;
    ctx.save();
    ctx.strokeStyle = `rgba(255,68,68,${0.62 + pulse * 0.28})`;
    ctx.lineWidth = 3;
    roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawActionCooldownGauge(unit, x, y, radius) {
    const max = Math.max(0.1, skillSystem.getActionCooldown(unit) || 1);
    const remaining = clamp(unit.cds.attack || 0, 0, max);
    const readyRatio = 1 - remaining / max;
    drawCircleGauge(x, y, radius, readyRatio, "rgba(0,0,0,0.45)", "#ffd86b");
    ctx.fillStyle = remaining > 0 ? "#dff9ff" : "#101814";
    ctx.font = `800 ${radius <= 10 ? 8 : 9}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("行", x, y + 0.5);
    ctx.textBaseline = "alphabetic";
  }

  function drawStatusIcons(unit, x, y, maxWidth, size) {
    const icons = getSortedStatusIcons(unit);
    if (!icons.length || maxWidth < size) {
      return;
    }
    const gap = 3;
    const columns = getStatusIconColumns(maxWidth, size, gap);
    const capacity = getStatusIconCapacity(maxWidth, size, gap);
    const hasOverflow = icons.length > capacity;
    const visibleCount = hasOverflow ? Math.max(0, capacity - 1) : Math.min(icons.length, capacity);
    for (let i = 0; i < visibleCount; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const ix = x + col * (size + gap);
      const iy = y + row * (size + gap);
      drawStatusIcon(icons[i], ix, iy, size);
      registerStatusTooltip(icons[i], ix, iy, size);
    }
    if (hasOverflow) {
      drawStatusIcon({ label: "…", color: "#5d6864", ratio: 1 }, x + (columns - 1) * (size + gap), y + size + gap, size);
    }
  }

  function getSortedStatusIcons(unit) {
    return getStatusIcons(unit).sort((a, b) => getStatusIconSortTime(b) - getStatusIconSortTime(a));
  }

  function getStatusIconColumns(maxWidth, size, gap = 3) {
    return Math.max(1, Math.floor((maxWidth + gap) / (size + gap)));
  }

  function getStatusIconCapacity(maxWidth, size, gap = 3) {
    return getStatusIconColumns(maxWidth, size, gap) * 2;
  }

  function getOverflowStatusIcons(unit, maxWidth, size) {
    const icons = getSortedStatusIcons(unit);
    const capacity = getStatusIconCapacity(maxWidth, size);
    if (icons.length <= capacity) {
      return [];
    }
    return icons.slice(Math.max(0, capacity - 1));
  }

  function getStatusIconSortTime(icon) {
    const priority = Number.isFinite(icon && icon.sortPriority) ? icon.sortPriority : 0;
    if (icon.permanent) {
      return 100000 + priority;
    }
    const time = Number.isFinite(icon.remaining) ? icon.remaining : (Number.isFinite(icon.ratio) ? icon.ratio : 0);
    return time + priority;
  }

  function getStatusDef(statusIdOrName) {
    if (!statusIdOrName || !statusData) {
      return null;
    }
    if (statusData[statusIdOrName]) {
      return statusData[statusIdOrName];
    }
    return Object.values(statusData).find((status) => status && status.name === statusIdOrName) || null;
  }

  function makeStatusIcon(unit, statusId, options = {}) {
    const status = getStatusDef(statusId) || {};
    return {
      statusId,
      unit,
      label: options.label || status.label || "?",
      name: options.name || status.name || statusId,
      description: options.description || status.description || "",
      simpleDescription: options.simpleDescription || status.simpleDescription || "",
      color: options.color || status.color || "#d4e4d5",
      ratio: options.ratio,
      remaining: options.remaining,
      stack: options.stack,
      permanent: options.permanent,
      durationless: options.durationless,
      sortPriority: options.sortPriority,
    };
  }

  function isPoisonStatusActive(unit) {
    return Boolean(unit && (
      unit.poisonActive ||
      ((unit.poisonDamageHpRatio || 0) > 0 && (unit.poisonTickRate || 0) > 0)
    ));
  }

  function getStatusIcons(unit) {
    if (unit && unit.dead) {
      return [makeStatusIcon(unit, "incapacitated", {
        ratio: 1,
        permanent: true,
        durationless: true,
        sortPriority: 1000,
      })];
    }
    const icons = [];
    const passive = getEquippedPassive ? getEquippedPassive(unit) : null;
    if (passive && passive.key === "hilment" && unit.id === "finald") {
      icons.push({ label: "癒", name: passive.name || "ヒルメント", description: passive.description || "", simpleDescription: passive.simpleDescription || "", color: "#79ff8d", ratio: 1, permanent: true, unit });
    }
    if (unit.actionLock > ACTION_GAP) {
      const total = Math.max(unit.actionTotal || unit.actionLock, unit.actionLock, 0.1);
      icons.push({ label: "詠", name: "詠唱中", color: "#73ff91", ratio: unit.actionLock / total, remaining: unit.actionLock, unit });
    }
    if (unit.frozen > 0) {
      const frozenMax = Math.max(0.1, unit.frozenMax || unit.frozen);
      icons.push(makeStatusIcon(unit, "debuff_freeze", { ratio: unit.frozen / frozenMax, remaining: unit.frozen }));
    }
    if ((unit.burnTimer || 0) > 0) {
      const burnMax = Math.max(0.1, unit.burnMax || unit.burnTimer);
      icons.push(makeStatusIcon(unit, "debuff_burn", { ratio: unit.burnTimer / burnMax, remaining: unit.burnTimer }));
    }
    if ((unit.sleepTimer || 0) > 0) {
      const sleepMax = Math.max(0.1, unit.sleepMax || unit.sleepTimer);
      icons.push(makeStatusIcon(unit, "debuff_sleep", { ratio: unit.sleepTimer / sleepMax, remaining: unit.sleepTimer }));
    }
    if (isPoisonStatusActive(unit)) {
      icons.push(makeStatusIcon(unit, "debuff_poison", { ratio: 1, permanent: true, durationless: true, sortPriority: 90 }));
    }
    if ((unit.woundStacks || 0) > 0) {
      icons.push(makeStatusIcon(unit, "debuff_wound", { ratio: 1, stack: unit.woundStacks, permanent: true, durationless: true, sortPriority: 80 }));
    }
    if ((unit.plantStage || 0) > 0) {
      icons.push(makeStatusIcon(unit, "debuff_plant", {
        label: getPlantStatusLabel(unit),
        name: getPlantStatusName(unit),
        ratio: 1,
        permanent: true,
        durationless: true,
        sortPriority: 70,
      }));
    }
    if ((unit.contemptStacks || 0) > 0 && (unit.contemptTimer || 0) > 0) {
      const contemptMax = Math.max(0.1, unit.contemptMax || unit.contemptTimer);
      icons.push(makeStatusIcon(unit, "buff_contempt", { ratio: unit.contemptTimer / contemptMax, remaining: unit.contemptTimer, stack: unit.contemptStacks }));
    }
    if ((unit.feelTimer || 0) > 0) {
      const feelMax = Math.max(0.1, unit.feelMax || unit.feelTimer);
      icons.push(makeStatusIcon(unit, "buff_feel", { ratio: unit.feelTimer / feelMax, remaining: unit.feelTimer, stack: unit.feelGuardCount || undefined }));
    }
    if ((unit.desteStacks || 0) > 0) {
      icons.push(makeStatusIcon(unit, "buff_deste", { ratio: 1, stack: unit.desteStacks, permanent: true, durationless: true, sortPriority: 65 }));
    }
    if ((unit.regretTimer || 0) > 0) {
      icons.push(makeStatusIcon(unit, "debuff_regret", { ratio: 1, permanent: true, durationless: true, sortPriority: 60 }));
    }
    if ((unit.sorrowTimer || 0) > 0) {
      const sorrowMax = Math.max(0.1, unit.sorrowMax || unit.sorrowTimer);
      icons.push(makeStatusIcon(unit, "debuff_sorrow", { ratio: unit.sorrowTimer / sorrowMax, remaining: unit.sorrowTimer }));
    }
    if ((unit.reunionTimer || 0) > 0) {
      const reunionMax = Math.max(0.1, unit.reunionMax || unit.reunionTimer);
      icons.push(makeStatusIcon(unit, "reunion", { ratio: unit.reunionTimer / reunionMax, remaining: unit.reunionTimer }));
    }
    if ((unit.absorptionLockTimer || 0) > 0) {
      icons.push({ label: "吸", name: "吸収中", description: "吸収により行動できない。", simpleDescription: "吸収により行動できない。", color: "#d889b9", ratio: 1, unit });
    }
    if ((unit.injuryTimer || 0) > 0) {
      const injuryMax = Math.max(0.1, unit.injuryMax || unit.injuryTimer);
      icons.push(makeStatusIcon(unit, "debuff_Injury", { ratio: unit.injuryTimer / injuryMax, remaining: unit.injuryTimer }));
    }
    if ((unit.magicNeutralizeTimer || 0) > 0) {
      const neutralizeMax = Math.max(0.1, unit.magicNeutralizeMax || unit.magicNeutralizeTimer);
      const ratio = Math.max(0, Number.isFinite(unit.magicNeutralizeRatio) ? unit.magicNeutralizeRatio : 0);
      icons.push(makeStatusIcon(unit, "debuff_magic_neutralize", {
        ratio: unit.magicNeutralizeTimer / neutralizeMax,
        remaining: unit.magicNeutralizeTimer,
        description: `魔力-${Math.round(ratio * 100)}%`,
        simpleDescription: `魔力-${Math.round(ratio * 100)}%`,
      }));
    }
    if (hasPassive(unit, "warmup") && (unit.castStacks || 0) > 0) {
      icons.push(makeStatusIcon(unit, "buff_warmup", { ratio: unit.stackTimer / SUSHIA_PASSIVE_STACK_DURATION, stack: unit.castStacks, remaining: unit.stackTimer }));
    }
    if (unit.tauntTimer > 0) {
      const duration = skillSystem.requireSkill("rihas", "ult").duration || 5.5;
      icons.push(makeStatusIcon(unit, "debuff_taunt", { ratio: unit.tauntTimer / duration, remaining: unit.tauntTimer }));
    }
    if (hasPassive(unit, "painless") && (unit.rihasPassiveStacks || 0) > 0) {
      icons.push(makeStatusIcon(unit, "buff_itaminasi", { ratio: unit.rihasPassiveTimer / RIHAS_PASSIVE_STACK_DURATION, stack: unit.rihasPassiveStacks, remaining: unit.rihasPassiveTimer }));
    }
    return icons;
  }

  function getPlantStatusLabel(unit) {
    const stage = Math.max(1, Math.min(4, Math.floor(unit && unit.plantStage || 1)));
    if (stage === 1) return "種";
    if (stage === 2) return "芽";
    if (stage === 3) return "開";
    return "花";
  }

  function getPlantStatusName(unit) {
    const stage = Math.max(1, Math.min(4, Math.floor(unit && unit.plantStage || 1)));
    if (stage === 1) return "種";
    if (stage === 2) return "発芽";
    if (stage === 3) return "開花";
    if (unit && unit.id === "ulpes") return "ヘンルーダ";
    if (unit && unit.id === "rihas") return "紫のヒヤシンス";
    if (unit && unit.id === "sushia") return "キンセンカ";
    if (unit && unit.id === "finald") return "赤の彼岸花";
    return "花";
  }
  function drawStatusIcon(icon, x, y, size) {
    const r = Math.max(4, size * 0.28);
    ctx.save();
    ctx.fillStyle = icon.color;
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1;
    roundRect(x, y, size, size, r);
    ctx.fill();
    ctx.stroke();

    const elapsedRatio = 1 - clamp(icon.ratio || 0, 0, 1);
    if (elapsedRatio > 0) {
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.fillStyle = "rgba(0,0,0,0.52)";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, size * 0.72, -Math.PI / 2, -Math.PI / 2 - TAU * elapsedRatio, true);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.max(9, size - 5)}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(0,0,0,0.72)";
    ctx.lineWidth = 2;
    ctx.strokeText(icon.label, x + size / 2, y + size / 2 + 0.5);
    ctx.fillText(icon.label, x + size / 2, y + size / 2 + 0.5);

    if ((icon.stack || 0) > 1) {
      const badge = Math.max(10, size * 0.58);
      ctx.fillStyle = "rgba(0,0,0,0.82)";
      roundRect(x + size - badge + 2, y + size - badge + 2, badge, badge, 4);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.max(8, badge - 3)}px 'Segoe UI', sans-serif`;
      ctx.fillText(String(icon.stack), x + size - badge / 2 + 2, y + size - badge / 2 + 2.5);
    }
    ctx.restore();
  }


  function registerStatusTooltip(icon, x, y, size) {
    if (!Array.isArray(statusTooltipTargets) || !icon) {
      return;
    }
    statusTooltipTargets.push({ x, y, w: size, h: size, tooltip: buildStatusTooltip(icon) });
  }

  function registerSkillTooltip(unit, entry, x, y, w, h = w) {
    if (!Array.isArray(statusTooltipTargets) || !entry) {
      return;
    }
    statusTooltipTargets.push({ x, y, w, h, tooltip: buildSkillTooltip(unit, entry) });
  }

  function buildStatusTooltip(icon) {
    const lines = [];
    const description = formatDescriptionText(getTooltipDescription(icon), icon.unit, icon);
    pushTooltipText(lines, description || "説明文は未設定");
    if (icon.permanent) {
      lines.push(icon.durationless ? "解除まで継続" : "常時効果");
    }
    if ((icon.stack || 0) > 1) {
      lines.push(`スタック: ${icon.stack}`);
    }
    if (Number.isFinite(icon.remaining)) {
      lines.push(`残り効果時間: ${formatRemainingSeconds(icon.remaining)}`);
    }
    return { title: icon.name || icon.label || "状態", lines };
  }

  function buildSkillTooltip(unit, entry) {
    const skill = entry.skill || {};
    const lines = [];
    const description = formatDescriptionText(getTooltipDescription(skill), unit, skill);
    pushTooltipText(lines, description || "説明文は未設定");
    const relatedStatuses = getReferencedStatuses(description, skill.statusIds);
    if (relatedStatuses.length) {
      lines.push("");
      for (const status of relatedStatuses) {
        lines.push(`${status.name}: ${formatDescriptionText(getTooltipDescription(status), unit, status)}`);
      }
    }
    if (Number.isFinite(skill.cost)) {
      lines.push(`MP: ${skill.cost}`);
    } else if (Number.isFinite(skill.costMaxMpRatio)) {
      lines.push(`MP: 最大MPの${Math.round(skill.costMaxMpRatio * 100)}%`);
    }
    if (Number.isFinite(skill.cd)) {
      lines.push(`CD: ${formatRemainingSeconds(skill.cd)}`);
    }
    if (entry.gauge) {
      lines.push(`必殺: ${entry.text}`);
    }
    return { title: skill.name || entry.key || "スキル", lines };
  }

  function getSkillPanelTooltipEntry(entry) {
    if (!entry) {
      return null;
    }
    const tooltipEntry = Object.assign({}, entry);
    if (!tooltipEntry.skill && skillSystem.getSkill && tooltipEntry.key) {
      tooltipEntry.skill = skillSystem.getSkill("finald", tooltipEntry.key);
    }
    if (tooltipEntry.gauge && !tooltipEntry.text) {
      const ultimateCost = getUltimateCost(player);
      tooltipEntry.text = player.ult >= ultimateCost ? "OK" : `${Math.round(player.ult)}/${ultimateCost}%`;
    }
    return tooltipEntry;
  }

  function pushTooltipText(lines, text) {
    tooltipText.pushText(lines, text);
  }

  function formatDescriptionText(text, unit, source) {
    return tooltipText.formatDescription(text, unit, source);
  }

  function getReferencedStatuses(description, statusIds) {
    return tooltipText.getReferencedStatuses(description, statusIds);
  }

  function formatRemainingSeconds(value) {
    return `${Math.ceil(Math.max(0, value))}秒`;
  }

  function getTooltipDescription(source) {
    return tooltipText.getDescription(source);
  }
  function drawStatusTooltip() {
    if (!Array.isArray(statusTooltipTargets) || !input || !input.mouse) {
      return;
    }
    const mouse = input.mouse;
    for (let i = statusTooltipTargets.length - 1; i >= 0; i -= 1) {
      const target = statusTooltipTargets[i];
      if (mouse.x >= target.x && mouse.x <= target.x + target.w && mouse.y >= target.y && mouse.y <= target.y + target.h) {
        drawTooltipBox(target.tooltip, mouse.x, mouse.y);
        return;
      }
    }
  }

  function drawTooltipBox(tooltip, mouseX, mouseY) {
    if (!tooltip) {
      return;
    }
    const title = String(tooltip.title || "");
    const rawLines = Array.isArray(tooltip.lines) ? tooltip.lines.map((line) => String(line)) : [];
    ctx.save();
    const maxW = Math.max(180, Math.min(420, view.w - 16));
    const textW = maxW - 24;
    ctx.font = "700 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    const lines = wrapTooltipLines(rawLines, textW);
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    let contentW = ctx.measureText(title).width;
    ctx.font = "700 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    for (const line of lines) {
      contentW = Math.max(contentW, ctx.measureText(line.text).width);
    }
    const boxW = Math.min(maxW, Math.max(180, contentW + 24));
    const lineH = 15;
    const boxH = 34 + lines.length * lineH;
    const boxX = clamp(mouseX + 16, 8, view.w - boxW - 8);
    const boxY = clamp(mouseY + 16, 8, view.h - boxH - 8);

    ctx.fillStyle = "rgba(8,12,10,0.94)";
    ctx.strokeStyle = "rgba(247,255,246,0.28)";
    ctx.lineWidth = 1;
    roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    drawFittedText(title, boxX + 12, boxY + 19, boxW - 24, 800, 13, 10, "#f7fff6", "left");
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!line.text) {
        continue;
      }
      drawFittedText(line.text, boxX + 12, boxY + 38 + i * lineH, boxW - 24, 700, 11, 9, line.primary ? "#d6e1d8" : "#aebdb4", "left");
    }
    ctx.restore();
  }

  function wrapTooltipLines(rawLines, maxWidth) {
    const wrapped = [];
    for (let i = 0; i < rawLines.length; i += 1) {
      const text = rawLines[i];
      if (!text) {
        wrapped.push({ text: "", primary: false });
        continue;
      }
      let line = "";
      for (const char of Array.from(text)) {
        const next = line + char;
        if (line && ctx.measureText(next).width > maxWidth) {
          wrapped.push({ text: line, primary: i === 0 });
          line = char;
        } else {
          line = next;
        }
      }
      wrapped.push({ text: line, primary: i === 0 });
    }
    return wrapped;
  }
  function getCommandBiasMeterLayout(x, y, w, h) {
    const labelW = 22;
    const gap = 3;
    const segmentCount = COMMAND_BIAS_CONFIGS.length;
    const segmentStartX = x + labelW + 3;
    const segmentEndX = x + w - labelW - 3;
    const segmentW = Math.max(5, (segmentEndX - segmentStartX - gap * (segmentCount - 1)) / segmentCount);
    return { labelW, gap, segmentCount, segmentStartX, segmentW };
  }

  function drawCommandBiasMeter(x, y, w, h, value, activeValue) {
    const layout = getCommandBiasMeterLayout(x, y, w, h);
    const active = clamp(Math.round(value) + 2, 0, 4);
    const applied = clamp(Math.round(activeValue) + 2, 0, 4);

    ctx.save();
    ctx.fillStyle = "#b7c7bd";
    drawShieldIcon(x + layout.labelW / 2 - 2, y + h / 2, 15, "#8fe9ff");
    drawCommandSwordIcon(x + w - layout.labelW / 2 + 2, y + h / 2, 13, "#cf3f63");

    for (let i = 0; i < layout.segmentCount; i += 1) {
      const sx = layout.segmentStartX + i * (layout.segmentW + layout.gap);
      const isActive = i === active;
      const isApplied = i === applied;
      ctx.fillStyle = isActive ? "#f7fff6" : "rgba(255,255,255,0.12)";
      ctx.strokeStyle = isApplied ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.38)";
      ctx.lineWidth = isApplied ? 1.4 : 1;
      roundRect(sx, y, layout.segmentW, h, 3);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShieldIcon(cx, cy, size, color) {
    const w = size * 0.86;
    const h = size;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.52);
    ctx.lineTo(cx + w * 0.46, cy - h * 0.32);
    ctx.lineTo(cx + w * 0.36, cy + h * 0.18);
    ctx.quadraticCurveTo(cx, cy + h * 0.56, cx - w * 0.36, cy + h * 0.18);
    ctx.lineTo(cx - w * 0.46, cy - h * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(8,14,18,0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.36);
    ctx.lineTo(cx, cy + h * 0.36);
    ctx.stroke();
    ctx.restore();
  }

  function drawCommandSwordIcon(cx, cy, size, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);

    const guardColor = color || "#cf3f63";
    const handleColor = "#873054";

    ctx.fillStyle = "#dfe5f2";
    ctx.strokeStyle = "rgba(24,28,42,0.34)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.08);
    ctx.lineTo(size * 0.34, -size * 0.12);
    ctx.lineTo(size * 0.28, size * 0.1);
    ctx.lineTo(-size * 0.3, size * 0.1);
    ctx.lineTo(-size * 0.34, -size * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.88);
    ctx.lineTo(size * 0.1, -size * 0.12);
    ctx.lineTo(-size * 0.1, -size * 0.12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = guardColor;
    roundRect(-size * 0.43, size * 0.08, size * 0.86, size * 0.16, 2);
    ctx.fill();

    ctx.fillStyle = handleColor;
    roundRect(-size * 0.1, size * 0.2, size * 0.2, size * 0.32, 2);
    ctx.fill();

    ctx.fillStyle = guardColor;
    ctx.beginPath();
    ctx.arc(0, size * 0.56, size * 0.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawArjunaHud() {
    const bounds = getBattleBounds();
    const margin = clamp(view.w * 0.018, 12, 22);
    const topReserve = bounds.top;
    const idealH = clamp(view.h * 0.17, 116, 154);
    const h = Math.min(idealH, Math.max(92, topReserve - 12));
    const x = margin;
    const y = 6;
    const menuReserveW = clamp(view.w * 0.07, 64, 92);
    const w = view.w - margin * 2 - menuReserveW;
    drawPanel(x, y, w, h);

    const innerX = x + 16;
    const innerW = w - 32;
    const gap = 12;
    let itemW = clamp(innerW * 0.25, 280, 430);
    let ultimateW = clamp(innerW * 0.24, 260, 420);
    let skillW = innerW - itemW - ultimateW - gap * 2;
    if (skillW < 420) {
      const deficit = 420 - skillW;
      const itemReduce = Math.min(Math.max(0, itemW - 240), deficit * 0.55);
      itemW -= itemReduce;
      const ultimateReduce = Math.min(Math.max(0, ultimateW - 220), deficit - itemReduce);
      ultimateW -= ultimateReduce;
      skillW = innerW - itemW - ultimateW - gap * 2;
    }
    if (skillW < 260) {
      skillW = 260;
      ultimateW = Math.max(190, innerW - skillW - itemW - gap * 2);
    }
    if (ultimateW < 190) {
      ultimateW = 190;
      itemW = Math.max(180, innerW - skillW - ultimateW - gap * 2);
    }

    const contentY = y + 10;
    const contentH = h - 20;
    const page = game.skillPage === "page2" ? "page2" : "page1";
    const skillX = innerX;
    const ultimateX = skillX + skillW + gap;
    const itemX = ultimateX + ultimateW + gap;
    drawSkillPanel(skillX, contentY, skillW, contentH, page);
    drawUltimatePanel(ultimateX, contentY, ultimateW, contentH);
    drawItemPanel(itemX, contentY, itemW, contentH);
  }

  function getBattleHudUnits() {
    const unitIds = ["ulpes", "rihas", "sushia", "finald"];
    return unitIds
      .map((unitId) => unitId === "finald" ? player : party.find((unit) => unit && unit.id === unitId))
      .filter(Boolean);
  }

  function drawBattleTimePill(x, y, w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(6,12,10,0.36)";
    ctx.strokeStyle = "rgba(247,255,246,0.16)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 7);
    ctx.fill();
    ctx.stroke();
    const centerY = y + h / 2 + 0.5;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#aebdb4";
    ctx.font = "900 11px 'Yu Gothic UI', 'Yu Gothic', 'Meiryo', sans-serif";
    ctx.fillText("時間", x + 8, centerY);
    const timeText = formatBattleTime(game.time);
    let timeSize = 13;
    do {
      ctx.font = `900 ${timeSize}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      if (ctx.measureText(timeText).width <= w - 44 || timeSize <= 9) {
        break;
      }
      timeSize -= 1;
    } while (timeSize > 9);
    ctx.textAlign = "right";
    ctx.fillStyle = "#f7fff6";
    ctx.fillText(timeText, x + w - 8, centerY);
    ctx.restore();
  }

  function drawUltimatePanel(x, y, w, h) {
    const units = getBattleHudUnits();
    const slotCount = Math.max(4, units.length);
    const gap = 7;
    const sidePadding = 8;
    const slotW = Math.max(36, (w - sidePadding * 2 - gap * (slotCount - 1)) / slotCount);
    const slotY = y + 8;
    const slotH = Math.max(34, h - 32);

    ctx.save();
    ctx.fillStyle = "rgba(6,12,10,0.24)";
    ctx.strokeStyle = "rgba(247,255,246,0.13)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < slotCount; i += 1) {
      const sx = x + sidePadding + i * (slotW + gap);
      const unit = units[i];
      drawUltimateSlot(unit, sx, slotY, slotW, slotH);
      drawFittedText(getUltimateOwnerShortName(unit), sx + slotW / 2, slotY + slotH + 14, slotW, 800, 10, 7, "#d6e1d8", "center");
    }
    ctx.restore();
  }

  function getUltimateOwnerShortName(unit) {
    if (!unit) {
      return "";
    }
    if (unit.id === "finald" && typeof getPlayerFirstName === "function") {
      return getPlayerFirstName();
    }
    return unit.name || unit.label || getStatusDisplayName(unit) || "";
  }
  function getUnitUltimatePanelEntry(unit) {
    if (!unit) {
      return { key: "ult", skill: null, level: 0 };
    }
    const entries = skillSystem && typeof skillSystem.getUnitSkillEntries === "function"
      ? skillSystem.getUnitSkillEntries(unit)
      : [];
    const entry = entries.find((candidate) => candidate && candidate.skill && (candidate.key === "ult" || candidate.skill.category === "必殺技"));
    if (entry) {
      return {
        key: entry.key || "ult",
        skill: entry.skill,
        level: Number.isFinite(entry.level) ? entry.level : getSkillLevelForDisplay(unit, entry.key || "ult"),
      };
    }
    const owner = unit.skillOwner || unit.id;
    const skill = skillSystem && typeof skillSystem.getSkill === "function" ? skillSystem.getSkill(owner, "ult") : null;
    return { key: "ult", skill, level: getSkillLevelForDisplay(unit, "ult") };
  }

  function drawUltimateSlot(unit, x, y, w, h) {
    const entry = getUnitUltimatePanelEntry(unit);
    const skill = entry.skill;
    const ultimateCost = unit ? getUltimateCost(unit) : 100;
    const ratio = unit && ultimateCost > 0 ? clamp(unit.ult / ultimateCost, 0, 1) : 0;
    const ready = Boolean(unit && ratio >= 1);
    const moodLocked = Boolean(unit && unit.id !== "finald" && unit.mood !== null && unit.mood < 40);
    const hardDisabled = !unit || unit.dead || unit.frozen > 0 || (unit.sleepTimer || 0) > 0;
    const disabled = hardDisabled || moodLocked;
    const available = ready && !disabled;
    const key = unit ? getBattleActionLabel(getUltimateActionId(unit.id), ULTIMATE_KEYS[unit.id]) : "";

    ctx.fillStyle = available
      ? "#f2ffff"
      : moodLocked
        ? "rgba(74,61,66,0.78)"
        : "rgba(247,255,246,0.62)";
    ctx.strokeStyle = available
      ? "rgba(115,223,255,0.98)"
      : moodLocked
        ? "rgba(255,107,107,0.76)"
        : hardDisabled
          ? "rgba(255,107,107,0.62)"
          : "rgba(115,223,255,0.52)";
    ctx.lineWidth = available ? 2.4 : 1.4;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    drawSkillCooldownShadow(x, y, w, h, 1 - ratio);
    drawSkillInputBadge(String(key).toUpperCase(), x + 7, y + 7, w - 14);

    if (available) {
      ctx.save();
      ctx.shadowColor = "#73dfff";
      ctx.shadowBlur = 13;
      ctx.strokeStyle = "rgba(115,223,255,0.72)";
      ctx.lineWidth = 1.6;
      roundRect(x + 3, y + 3, w - 6, h - 6, 6);
      ctx.stroke();
      ctx.restore();
    }

    const iconR = Math.min(w * 0.21, h * 0.17, 15);
    ctx.fillStyle = available ? "#73dfff" : moodLocked ? "rgba(255,107,107,0.72)" : "rgba(115,223,255,0.58)";
    ctx.strokeStyle = "rgba(9,14,13,0.5)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.34, iconR, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#102018";
    ctx.font = `900 ${Math.max(11, Math.min(14, iconR * 0.9))}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(skill ? getSkillIconLabel(skill) : "必", x + w / 2, y + h * 0.34 + 0.5);

    const mainTextColor = moodLocked ? "#ffe4e4" : "#102018";
    const subTextColor = moodLocked ? "#ffd0d0" : "#4c6758";
    drawFittedText(skill ? skill.name : "必殺技", x + w / 2, y + h * 0.6, w - 10, 900, 11, 8, mainTextColor, "center");
    drawFittedText(skill && skill.skillType ? skill.skillType : "必殺技", x + w / 2, y + h * 0.78, w - 10, 800, 10, 7, subTextColor, "center");
    drawSkillLevelBadge(x + w - 5, y + h - 5, entry.level || 0);
    drawUltimateStateBadge(x, y, w, h, available, moodLocked);

    if (unit) {
      statusUiButtons.push({
        action: "unitUltimate",
        unitId: unit.id,
        x,
        y,
        w,
        h,
      });
      registerSkillTooltip(unit, {
        key: entry.key || "ult",
        skill,
        level: entry.level || 0,
        gauge: true,
        text: moodLocked ? "調子不足" : ready ? "OK" : "準備中",
      }, x, y, w, h);
    }
  }

  function drawUltimateStateBadge(x, y, w, h, available, moodLocked) {
    if (!available && !moodLocked) {
      return;
    }
    const label = available ? "OK" : "不調";
    const badgeW = available ? 25 : 32;
    const badgeH = 15;
    ctx.save();
    ctx.shadowColor = available ? "#73dfff" : "#ff6b6b";
    ctx.shadowBlur = available ? 9 : 5;
    ctx.strokeStyle = available ? "rgba(115,223,255,0.9)" : "rgba(255,107,107,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 9, y + h - 7);
    ctx.lineTo(x + w - 9, y + h - 7);
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (w < badgeW + 38) {
      ctx.restore();
      return;
    }
    const bx = x + w - badgeW - 6;
    const by = y + 6;
    ctx.fillStyle = available ? "#73dfff" : "rgba(255,107,107,0.92)";
    ctx.strokeStyle = available ? "#f2ffff" : "rgba(255,230,230,0.9)";
    ctx.lineWidth = 1;
    roundRect(bx, by, badgeW, badgeH, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = available ? "#102018" : "#240b0b";
    ctx.font = "900 9px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, bx + badgeW / 2, by + badgeH / 2 + 0.5);
    ctx.restore();
  }
  function drawItemPanel(x, y, w, h) {
    const slots = Array.isArray(game.itemSlots) ? game.itemSlots : [];
    const gap = 7;
    const sidePadding = 8;
    const slotCount = Math.max(4, slots.length);
    const slotW = Math.max(34, (w - sidePadding * 2 - gap * (slotCount - 1)) / slotCount);
    const slotY = y + 8;
    const slotH = Math.max(34, h - 32);

    ctx.save();
    ctx.fillStyle = "rgba(6,12,10,0.24)";
    ctx.strokeStyle = "rgba(247,255,246,0.13)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < slotCount; i += 1) {
      const sx = x + sidePadding + i * (slotW + gap);
      const item = slots[i];
      const selected = isItemSlotSelected(i, item);
      drawItemSlot(sx, slotY, slotW, slotH, item, getBattleActionLabel(`battle.item${i + 1}`, getDefaultItemKeyLabel(i)), selected);
      drawFittedText(item && item.ownerName ? item.ownerName : getDefaultItemOwnerLabel(i), sx + slotW / 2, slotY + slotH + 14, slotW, 800, 10, 7, "#d6e1d8", "center");
      statusUiButtons.push({
        action: "itemSlot",
        slotIndex: i,
        x: sx,
        y: slotY,
        w: slotW,
        h: slotH,
      });
    }
    ctx.restore();
  }

  function isItemSlotSelected(slotIndex, item) {
    if (player.itemAim && player.itemAim.slotIndex === slotIndex) {
      return true;
    }
    const ownerUnitId = item && item.ownerUnitId;
    const owner = getItemSlotOwnerUnit(ownerUnitId);
    return Boolean(owner && (
      owner.itemCast && owner.itemCast.slotIndex === slotIndex ||
      owner.itemUseRequest && owner.itemUseRequest.slotIndex === slotIndex
    ));
  }

  function drawItemSlot(x, y, w, h, item, key, selected = false) {
    const hasItem = Boolean(item && item.count > 0);
    ctx.fillStyle = hasItem ? "#f7fff6" : "rgba(247,255,246,0.32)";
    ctx.strokeStyle = selected ? "rgba(141,226,161,1)" : hasItem ? "rgba(126,210,153,0.78)" : "rgba(8,14,12,0.28)";
    ctx.lineWidth = selected ? 2.6 : hasItem ? 1.6 : 1.1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    const cdRatio = hasItem && item.maxCd > 0 ? clamp((item.cd || 0) / item.maxCd, 0, 1) : 0;
    drawSkillCooldownShadow(x, y, w, h, cdRatio);
    drawSkillInputBadge(String(key).toUpperCase(), x + 7, y + 7, w - 14);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (hasItem) {
      const iconR = Math.min(w * 0.24, h * 0.2, 17);
      ctx.fillStyle = "#8de2a1";
      ctx.strokeStyle = "rgba(9,14,13,0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.4, iconR, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#102018";
      ctx.font = `900 ${Math.max(11, Math.min(14, iconR * 0.82))}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      ctx.fillText(item.shortName || "道", x + w / 2, y + h * 0.4 + 0.5);
      drawFittedText(item.name || "アイテム", x + w / 2, y + h * 0.69, w - 10, 800, 10, 8, "#102018", "center");
      ctx.fillStyle = "#102018";
      ctx.font = "900 10px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`x${item.count}`, x + w - 7, y + h - 10);
    } else {
      ctx.fillStyle = "rgba(16,32,24,0.62)";
      ctx.font = "900 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("空", x + w / 2, y + h * 0.54);
    }
  }

  function drawBagIcon(cx, cy, size) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#d2a36b";
    ctx.strokeStyle = "rgba(7,11,10,0.55)";
    ctx.lineWidth = Math.max(1.2, size * 0.06);
    roundRect(-size * 0.42, -size * 0.14, size * 0.84, size * 0.62, size * 0.12);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -size * 0.13, size * 0.24, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(102,63,36,0.8)";
    roundRect(-size * 0.12, size * 0.07, size * 0.24, size * 0.14, 2);
    ctx.fill();
    ctx.restore();
  }
  function drawQuestInfoPanel(x, y, w, h, aliveEnemies) {
    ctx.save();
    ctx.fillStyle = "rgba(6,12,10,0.3)";
    ctx.strokeStyle = "rgba(247,255,246,0.14)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    const questName = game.currentQuest && game.currentQuest.name ? game.currentQuest.name : "仮依頼";
    const targetName = game.priorityTarget && !game.priorityTarget.dead ? game.priorityTarget.name : "なし";
    const lines = [
      { label: "状況", value: game.message || "-" },
      { label: "依頼", value: questName },
      { label: "時間", value: formatBattleTime(game.time) },
      { label: "敵", value: `${aliveEnemies}/${enemies.length}` },
      { label: "狙い", value: targetName },
    ];
    const rowH = Math.max(18, Math.min(22, h / Math.max(1, lines.length)));
    for (let i = 0; i < lines.length; i += 1) {
      const rowY = y + 17 + i * rowH;
      ctx.fillStyle = "#aebdb4";
      ctx.font = "800 10px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(lines[i].label, x + 10, rowY);
      drawFittedText(lines[i].value, x + 48, rowY, w - 58, 800, 12, 8, "#f7fff6", "left");
    }
    ctx.restore();
  }

  function formatBattleTime(time) {
    const total = Math.max(0, Math.floor(time || 0));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function drawFittedText(text, x, y, maxWidth, weight, maxSize, minSize, color, align = "left") {
    let size = maxSize;
    do {
      ctx.font = `${weight} ${size}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      if (ctx.measureText(text).width <= maxWidth || size <= minSize) {
        break;
      }
      size -= 1;
    } while (size > minSize);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, x, y);
  }

  function drawLabeledBar(label, x, y, w, h, ratio, back, fill, options = {}) {
    const labelW = 26;
    const valueW = options.text ? clamp(w * 0.31, 48, 72) : 0;
    const valueGap = options.text ? 5 : 0;
    ctx.fillStyle = "#dce9dc";
    ctx.font = "800 10px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y + h / 2);
    const barX = x + labelW;
    const barW = Math.max(0, w - labelW - valueW - valueGap);
    drawBar(barX, y, barW, h, ratio, back, fill);
    if (options.shieldRatio > 0) {
      ctx.save();
      ctx.globalAlpha = 0.78;
      ctx.fillStyle = COLORS.shield;
      roundRect(barX, y, barW * clamp(options.shieldRatio, 0, 1), h, Math.min(4, h / 2));
      ctx.fill();
      ctx.restore();
    }
    if (options.text) {
      const valueX = barX + barW + valueGap;
      let valueSize = 11;
      do {
        ctx.font = `800 ${valueSize}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
        if (ctx.measureText(options.text).width <= valueW || valueSize <= 9) {
          break;
        }
        valueSize -= 1;
      } while (valueSize > 9);
      ctx.textAlign = "left";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(0,0,0,0.72)";
      ctx.strokeText(options.text, valueX, y + h / 2 + 0.5);
      ctx.fillStyle = "#f7fff6";
      ctx.fillText(options.text, valueX, y + h / 2 + 0.5);
    }
    ctx.textBaseline = "alphabetic";
  }
  function drawSkillPanel(x, y, w, h, page = "page1", desiredItemW = null) {
    ctx.save();
    ctx.fillStyle = "rgba(6,12,10,0.24)";
    ctx.strokeStyle = "rgba(247,255,246,0.13)";
    ctx.lineWidth = 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const pageTwo = page === "page2";
    const skills = skillSystem.getPanelSkills(player, pageTwo ? 1 : 0);
    const slots = 5;
    const gap = 8;
    const toggleW = clamp(w * 0.14, 72, 92);
    const listOffset = 10;
    const listX = x + toggleW + gap + listOffset;
    const listW = Math.max(0, w - toggleW - gap - listOffset);
    const availableItemW = (listW - gap * Math.max(0, slots - 1)) / Math.max(1, slots);
    const itemW = desiredItemW !== null ? Math.min(desiredItemW, availableItemW) : availableItemW;
    const itemY = y + 8;
    const itemH = h - 16;
    const timeH = clamp(h * 0.2, 22, 30);
    const timeGap = 6;
    const toggleH = itemH;
    const nameY = itemY + itemH * 0.56;
    const typeY = itemY + itemH * 0.75;
    drawSkillRoleToggle(x, itemY, toggleW, toggleH, page);
    drawBattleTimePill(x - 8, y + h + timeGap + 6, toggleW, timeH);
    for (let i = 0; i < slots; i += 1) {
      const sx = listX + i * (itemW + gap);
      const skill = skills[i];
      if (!skill) {
        ctx.fillStyle = "rgba(247,255,246,0.34)";
        ctx.strokeStyle = "rgba(8,14,12,0.3)";
        ctx.lineWidth = 1.2;
        roundRect(sx, itemY, itemW, itemH, 8);
        ctx.fill();
        ctx.stroke();
        if (skillSystem.getPlayerSkillSlotInputLabel) {
          drawSkillInputBadge(skillSystem.getPlayerSkillSlotInputLabel(i), sx + 8, itemY + 7, itemW - 16);
        }
        continue;
      }
      ctx.fillStyle = "#f7fff6";
      ctx.strokeStyle = skill.command
        ? (skill.commandDelta < 0 ? "rgba(86,140,255,0.78)" : "rgba(255,185,67,0.78)")
        : "rgba(8,14,12,0.64)";
      ctx.lineWidth = skill.command ? 1.8 : 1.5;
      roundRect(sx, itemY, itemW, itemH, 8);
      ctx.fill();
      ctx.stroke();
      const shadowRatio = clamp(skill.cd / Math.max(0.1, skill.max), 0, 1);
      drawSkillCooldownShadow(sx, itemY, itemW, itemH, shadowRatio);
      drawSkillInputBadge(skill.input, sx + 8, itemY + 7, itemW - 16);
      ctx.fillStyle = "#102018";
      ctx.font = `800 ${itemW < 92 ? 11 : 12}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(247,255,246,0.86)";
      ctx.strokeText(skill.name, sx + itemW / 2, nameY);
      ctx.fillText(skill.name, sx + itemW / 2, nameY);
      if (skill.skillType) {
        drawFittedText(skill.skillType, sx + itemW / 2, typeY, itemW - 10, 800, itemW < 92 ? 9 : 10, 7, "#4c6758", "center");
      }
      drawSkillLevelBadge(sx + itemW - 5, itemY + itemH - 5, skill.level || 0);
      statusUiButtons.push({
        action: !skill.command ? "playerSkill" : "playerCommand",
        skillKey: skill.key,
        ultimate: false,
        targeted: skill.targeted,
        positioned: skill.positioned,
        x: sx,
        y: itemY,
        w: itemW,
        h: itemH,
      });
      registerSkillTooltip(player, getSkillPanelTooltipEntry(skill), sx, itemY, itemW, itemH);
    }
    ctx.textBaseline = "alphabetic";
  }
  function drawSkillRoleToggle(x, y, w, h, page) {
    const pageTwo = page === "page2";
    ctx.save();
    ctx.lineWidth = 1.2;
    const stackedCards = [
      { dx: 21, dy: 12, alpha: 0.34 },
      { dx: 15, dy: 8, alpha: 0.42 },
      { dx: 9, dy: 4, alpha: 0.52 },
    ];
    for (const card of stackedCards) {
      ctx.fillStyle = `rgba(247,255,246,${card.alpha})`;
      ctx.strokeStyle = "rgba(8,14,12,0.3)";
      roundRect(x + card.dx, y + card.dy, w - 12, h - 9, 8);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    roundRect(x + 24, y + 15, w - 12, h - 12, 8);
    ctx.fill();
    ctx.fillStyle = pageTwo ? "#fff2bd" : "#eef8ff";
    ctx.strokeStyle = pageTwo ? "rgba(255,185,67,0.9)" : "rgba(151,247,255,0.84)";
    ctx.lineWidth = 2;
    roundRect(x, y, w - 6, h - 6, 8);
    ctx.fill();
    ctx.stroke();

    const cx = x + (w - 6) / 2;
    const cy = y + (h - 6) / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.max(32, Math.min(70, h * 0.92))}px 'Segoe UI Symbol', 'Segoe UI', sans-serif`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.54)";
    ctx.strokeText("↻", cx, cy - 1);
    ctx.fillStyle = "rgba(22,37,29,0.6)";
    ctx.fillText("↻", cx, cy - 1);
    ctx.fillStyle = "rgba(9,14,13,0.82)";
    roundRect(cx - Math.min(19, w * 0.3), cy - 13, Math.min(38, w * 0.6), 16, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1;
    ctx.stroke();
    drawFittedText(getBattleActionLabel("battle.skillPage", "Space"), cx, cy - 1, Math.min(52, w * 0.72), 900, 9, 6, "#f7fff6", "center");
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#102018";
    ctx.font = "800 11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(pageTwo ? "ページ２" : "ページ１", cx, y + h - 16);
    statusUiButtons.push({
      action: "toggleSkillPage",
      x,
      y,
      w,
      h,
    });
    ctx.restore();
  }

  function drawSkillCooldownShadow(x, y, w, h, ratio) {
    const value = clamp(ratio, 0, 1);
    if (value <= 0) {
      return;
    }
    ctx.save();
    roundRect(x, y, w, h, 8);
    ctx.clip();
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    if (value >= 0.995) {
      ctx.fillRect(x, y, w, h);
    } else {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const radius = Math.hypot(w, h);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + TAU * value);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSkillInputBadge(label, x, y, maxW) {
    if (!label) {
      return;
    }
    ctx.save();
    let fontSize = 10;
    do {
      ctx.font = `800 ${fontSize}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      if (ctx.measureText(label).width <= Math.max(22, maxW - 16) || fontSize <= 8) {
        break;
      }
      fontSize -= 1;
    } while (fontSize > 8);
    const textW = ctx.measureText(label).width;
    const badgeW = Math.min(maxW, Math.max(24, textW + 14));
    const badgeH = 17;
    ctx.fillStyle = "rgba(9,14,13,0.78)";
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1;
    roundRect(x, y, badgeW, badgeH, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fff6";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + badgeW / 2, y + badgeH / 2 + 0.5);
    ctx.restore();
  }

  function getMoodColor(mood) {
    if (mood <= 50) {
      const t = clamp(mood / 50, 0, 1);
      return lerpColor([154, 204, 255], [255, 216, 107], t);
    }
    const t = clamp((mood - 50) / 50, 0, 1);
    return lerpColor([255, 216, 107], [255, 70, 70], t);
  }

  function lerpColor(a, b, t) {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r},${g},${bl})`;
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
      drawHud,
      getDetailedStats,
    };
  };
})();

