(() => {
  "use strict";

  window.createHealerStatusRenderer = function createHealerStatusRenderer(context) {
    const {
      canvasCtx: ctx,
      TAU,
      view,
      game,
      player,
      party,
      enemies,
      expandedStatusUnitIds,
      statusUiButtons,
      statusCardMetas,
      COLORS,
      ACTION_GAP,
      ULTIMATE_KEYS,
      STATUS_FULL_NAMES,
      COMMAND_BIAS_CONFIGS,
      RIHAS_PASSIVE_MAX_STACKS,
      RIHAS_PASSIVE_STACK_DURATION,
      SUSHIA_PASSIVE_MAX_STACKS,
      SUSHIA_PASSIVE_STACK_DURATION,
      BASE_CRIT_CHANCE,
      BASE_CRIT_DAMAGE,
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
      getSushiaCastTime,
      getRihasPassiveDamageMultiplier,
      getRihasPassiveIncomingMultiplier,
      getEffectiveDefense,
      getEffectiveGuardChance,
      getGuardDamageReductionRate,
      getMpRegenRate,
    } = context;
  function drawHud() {
    drawAllyStatusCards();
    drawArjunaHud();
  }

  function drawAllyStatusCards() {
    statusUiButtons.length = 0;
    statusCardMetas.length = 0;
    const allies = party.filter((member) => member.id !== "finald");
    const units = [...allies, player];
    const bounds = getBattleBounds();
    const gap = clamp(view.w * 0.009, 6, 10);
    const margin = clamp(view.w * 0.016, 10, 18);
    const cardW = (view.w - margin * 2 - gap * (units.length - 1)) / Math.max(1, units.length);
    const y = 6;
    const idealH = clamp(view.h * 0.16, 112, 136);
    const cardH = Math.min(idealH, Math.max(78, bounds.top - y - 6));
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
    drawCircleGauge(ultGaugeX, gaugeY, ultGaugeRadius, unit.ult / 100, "rgba(0,0,0,0.45)", "#73dfff");
    ctx.fillStyle = "rgba(10,13,12,0.84)";
    ctx.beginPath();
    ctx.arc(ultGaugeX, gaugeY, Math.max(7, ultGaugeRadius - 6), 0, TAU);
    ctx.fill();

    if (unit.ult >= 100) {
      ctx.strokeStyle = "rgba(255,255,255,0.82)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ultGaugeX, gaugeY, ultGaugeRadius + 3, 0, TAU);
      ctx.stroke();
    }

    const ultKey = ULTIMATE_KEYS[unit.id];
    if (ultKey) {
      const keyX = ultGaugeX;
      const keyY = gaugeY;
      ctx.fillStyle = unit.ult >= 100 ? "#73dfff" : "rgba(7,10,9,0.88)";
      ctx.strokeStyle = unit.ult >= 100 ? "#ffffff" : "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1;
      roundRect(keyX - 8, keyY - 8, 16, 16, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = unit.ult >= 100 ? "#111111" : "#f7fff6";
      ctx.font = "800 11px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ultKey, keyX, keyY + 0.5);
      ctx.textBaseline = "alphabetic";
    }

    drawStatusIcons(unit, barX, statusIconY, statusIconMaxWidth, statusIconSize);

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
    const by = y + h - buttonSize;
    statusUiButtons.push({ action: "toggle", unitId: unit.id, x: bx, y: by, w: buttonSize + buttonOutset, h: buttonSize + buttonOutset });
    drawCornerTriangleButton(x + w - triangleSize, y + h - triangleSize, triangleSize, expandedStatusUnitIds.has(unit.id) ? "close" : "expand");
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
    const panelY = meta.y + meta.h + 7;
    const availableH = Math.max(210, Math.min(view.h - panelY - 12, battleBounds.bottom - panelY - 8));
    const panelH = Math.min(clamp(view.h * 0.46, 320, 430), availableH);
    const panelX = clamp(meta.x, 12, view.w - panelW - 12);
    drawPanel(panelX, panelY, panelW, panelH);
    statusUiButtons.push({ action: "consume", x: panelX, y: panelY, w: panelW, h: panelH });

    const innerX = panelX + 14;
    const innerY = panelY + 16;
    const innerW = panelW - 28;
    const hiddenIcons = getOverflowStatusIcons(unit, meta.statusIconMaxWidth, meta.statusIconSize);

    const hiddenH = drawHiddenStatusDetails(hiddenIcons, innerX, innerY, innerW);
    const statsY = innerY + hiddenH + 10;
    const statsH = drawDetailedStats(unit, innerX, statsY, innerW, panelH - hiddenH - 82);
    const skillsY = statsY + statsH + 10;
    drawDetailedSkills(unit, innerX, skillsY, innerW, panelY + panelH - skillsY - 24);

    const triangleSize = 16;
    const buttonSize = 36;
    const buttonOutset = 10;
    const bx = panelX + panelW - buttonSize;
    const by = panelY + panelH - buttonSize;
    statusUiButtons.push({ action: "close", unitId, x: bx, y: by, w: buttonSize + buttonOutset, h: buttonSize + buttonOutset });
    drawCornerTriangleButton(panelX + panelW - triangleSize, panelY + panelH - triangleSize, triangleSize, "close");
  }

  function drawCornerTriangleButton(x, y, size, mode) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "rgba(0,0,0,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (mode === "close") {
      ctx.moveTo(x + size, y);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x, y + size);
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
        drawStatusIcon(hiddenIcons[i], startX + col * (iconSize + gap), y + row * (iconSize + gap), iconSize);
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
    const rowH = 25;
    const colGap = 10;
    const columns = w < 230 ? 1 : 2;
    const colW = (w - colGap * (columns - 1)) / columns;
    const startY = y + 29;
    for (let i = 0; i < stats.length; i += 1) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const sx = x + col * (colW + colGap);
      const sy = startY + row * rowH;
      if (sy > y + h - 8) {
        return Math.max(36, sy - y);
      }
      drawDetailStatRow(stats[i].label, stats[i].value, sx, sy, colW);
    }
    return 29 + Math.ceil(stats.length / columns) * rowH;
  }

  function drawDetailStatRow(label, value, x, y, w) {
    ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#aebdb4";
    ctx.fillText(label, x, y);
    ctx.font = "800 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#f7fff6";
    ctx.fillText(value, x + w, y);
  }

  function getDetailedStats(unit) {
    const outgoing = getUnitOutgoingDamageMultiplier(unit);
    const incoming = getUnitIncomingDamageMultiplier(unit);
    const castSpeed = 1 / getUnitCastTimeMultiplier(unit) - 1;
    const skillSpeed = 1 / getMoodCooldownMultiplier(unit) - 1;
    return [
      { label: "攻撃力", value: formatNumber(unit.attack) },
      { label: "魔力", value: formatNumber(unit.magic) },
      { label: "防御力", value: formatNumber(getEffectiveDefense(unit)) },
      { label: "魔法防御力", value: formatNumber(unit.magicDefense) },
      { label: "会心率", value: formatPercent(BASE_CRIT_CHANCE) },
      { label: "会心ダメージ", value: formatPercent(BASE_CRIT_DAMAGE) },
      { label: "与ダメ補正", value: formatSignedPercent(outgoing - 1) },
      { label: "被ダメ補正", value: formatSignedPercent(incoming - 1) },
      { label: "詠唱速度", value: formatSignedPercent(castSpeed) },
      { label: "スキルヘイスト", value: formatSignedPercent(skillSpeed) },
      { label: "ガード率", value: formatPercent(getEffectiveGuardChance(unit)) },
      { label: "ガード軽減率", value: formatPercent(getGuardDamageReductionRate(unit)) },
      { label: "移動速度", value: `${Math.round(unit.speed)}` },
      { label: "MP回復率", value: formatPercent(getMpRegenRate(unit)) },
    ];
  }

  function getUnitOutgoingDamageMultiplier(unit) {
    let multiplier = getMoodOutgoingDamageMultiplier(unit) * getCommandOutgoingDamageMultiplier(unit);
    if (unit.id === "rihas") {
      multiplier *= getRihasPassiveDamageMultiplier(unit);
    }
    return multiplier;
  }

  function getUnitIncomingDamageMultiplier(unit) {
    let multiplier = getMoodIncomingDamageMultiplier(unit) * getCommandIncomingDamageMultiplier(unit);
    if (unit.id === "rihas") {
      multiplier *= getRihasPassiveIncomingMultiplier(unit);
    }
    return multiplier;
  }

  function getUnitCastTimeMultiplier(unit) {
    if (unit.id === "sushia") {
      return getSushiaCastTime(1, unit);
    }
    return getMoodCastTimeMultiplier(unit);
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
    }
  }

  function getDetailedSkillEntries(unit) {
    const data = skillSystem.data[unit.id] || {};
    return Object.entries(data).map(([key, skill]) => {
      const cooldown = getSkillCooldownDetail(unit, key, skill);
      return { key, skill, ...cooldown };
    });
  }

  function getSkillCooldownDetail(unit, key, skill) {
    if (key === "ult") {
      const remaining = unit.ult >= 100 ? 0 : 100 - unit.ult;
      return { remaining, max: 100, text: unit.ult >= 100 ? "OK" : `${Math.round(unit.ult)}%`, gauge: true };
    }
    const max = key === "attack" && unit.id !== "finald"
      ? skillSystem.getActionCooldown(unit)
      : (skill.cd ? getMoodCooldown(unit, skill.cd) : 0);
    const remaining = unit.cds[key] || 0;
    return { remaining, max: Math.max(0.1, max), text: remaining > 0 ? remaining.toFixed(1) : "OK", gauge: false };
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

  function formatNumber(value) {
    return `${Math.floor(value)}`;
  }

  function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  function formatSignedPercent(value) {
    const rounded = Math.round(value * 100);
    return `${rounded > 0 ? "+" : ""}${rounded}%`;
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
      drawStatusIcon(icons[i], x + col * (size + gap), y + row * (size + gap), size);
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
    if (icon.permanent) {
      return Infinity;
    }
    return Number.isFinite(icon.remaining) ? icon.remaining : (Number.isFinite(icon.ratio) ? icon.ratio : 0);
  }

  function getStatusIcons(unit) {
    const icons = [];
    if (unit.id === "finald") {
      icons.push({ label: "空", color: "#73dfff", ratio: 1, permanent: true });
    }
    if (unit.actionLock > ACTION_GAP) {
      const total = Math.max(unit.actionTotal || unit.actionLock, unit.actionLock, 0.1);
      icons.push({ label: "詠", color: "#73ff91", ratio: unit.actionLock / total, remaining: unit.actionLock });
    }
    if (unit.frozen > 0) {
      const frozenMax = Math.max(0.1, unit.frozenMax || unit.frozen);
      icons.push({ label: "凍", color: "#b8e7ff", ratio: unit.frozen / frozenMax, remaining: unit.frozen });
    }
    if (unit.id === "sushia" && (unit.castStacks || 0) > 0) {
      icons.push({ label: "熱", color: "#ff9f43", ratio: unit.stackTimer / SUSHIA_PASSIVE_STACK_DURATION, stack: unit.castStacks, remaining: unit.stackTimer });
    }
    if (unit.tauntTimer > 0) {
      const duration = skillSystem.requireSkill("rihas", "ult").duration || 5.5;
      icons.push({ label: "怒", color: "#ff6b44", ratio: unit.tauntTimer / duration, remaining: unit.tauntTimer });
    }
    if ((unit.rihasPassiveStacks || 0) > 0) {
      icons.push({ label: "拳", color: "#e37a3f", ratio: unit.rihasPassiveTimer / RIHAS_PASSIVE_STACK_DURATION, stack: unit.rihasPassiveStacks, remaining: unit.rihasPassiveTimer });
    }
    return icons;
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
    const bottomReserve = view.h - bounds.bottom;
    const idealH = clamp(view.h * 0.19, 128, 168);
    const h = Math.min(idealH, Math.max(92, bottomReserve - 14));
    const x = margin;
    const y = view.h - h - 8;
    const w = view.w - margin * 2;
    drawPanel(x, y, w, h);

    const aliveEnemies = enemies.filter((enemy) => !enemy.dead).length;
    ctx.fillStyle = "#d4e4d5";
    ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${game.message} / 残り魔物 ${aliveEnemies}/${enemies.length}`, x + 18, y - 8);

    const skillX = x + 16;
    const skillW = Math.min(w - 32, clamp(view.w * 0.38, 360, 500));
    if (skillW > 220) {
      drawSkillPanel(skillX, y + 10, skillW, h - 20);
    }

    const commandW = Math.min(w - skillW - 64, clamp(view.w * 0.34, 330, 470));
    if (commandW > 260) {
      drawCommandSkillPanel(x + w - 16 - commandW, y + 10, commandW, h - 20);
    }
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
  function drawSkillPanel(x, y, w, h) {
    const skills = skillSystem.getPanelSkills(player);
    const inputLabels = ["A", "S", "D", "4"];
    const gap = 8;
    const itemW = (w - gap * Math.max(0, skills.length - 1)) / Math.max(1, skills.length);
    const itemY = y + 8;
    const itemH = h - 16;
    const nameY = itemY + itemH * 0.62;
    for (let i = 0; i < skills.length; i += 1) {
      const sx = x + i * (itemW + gap);
      const skill = skills[i];
      ctx.fillStyle = "#f7fff6";
      ctx.strokeStyle = "rgba(8,14,12,0.64)";
      ctx.lineWidth = 1.5;
      roundRect(sx, itemY, itemW, itemH, 8);
      ctx.fill();
      ctx.stroke();
      const shadowRatio = skill.gauge
        ? 1 - clamp(player.ult / 100, 0, 1)
        : clamp(skill.cd / Math.max(0.1, skill.max), 0, 1);
      drawSkillCooldownShadow(sx, itemY, itemW, itemH, shadowRatio);
      drawSkillInputBadge(inputLabels[i], sx + 8, itemY + 7, itemW - 16);
      ctx.fillStyle = "#102018";
      ctx.font = `800 ${itemW < 92 ? 11 : 12}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(247,255,246,0.86)";
      ctx.strokeText(skill.name, sx + itemW / 2, nameY);
      ctx.fillText(skill.name, sx + itemW / 2, nameY);
      statusUiButtons.push({
        action: "playerSkill",
        skillKey: skill.key,
        ultimate: Boolean(skill.gauge),
        x: sx,
        y: itemY,
        w: itemW,
        h: itemH,
      });
    }
    ctx.textBaseline = "alphabetic";
  }

  function drawCommandSkillPanel(x, y, w, h) {
    const skills = skillSystem.getCommandPanelSkills(player);
    const inputLabels = ["G", "H", "J", "K"];
    const gap = 8;
    const itemW = (w - gap * Math.max(0, skills.length - 1)) / Math.max(1, skills.length);
    const itemY = y + 8;
    const itemH = h - 16;
    const nameY = itemY + itemH * 0.62;
    for (let i = 0; i < skills.length; i += 1) {
      const sx = x + i * (itemW + gap);
      const skill = skills[i];
      ctx.fillStyle = "#f7fff6";
      ctx.strokeStyle = skill.commandDelta < 0 ? "rgba(86,140,255,0.78)" : "rgba(255,185,67,0.78)";
      ctx.lineWidth = 1.8;
      roundRect(sx, itemY, itemW, itemH, 8);
      ctx.fill();
      ctx.stroke();
      drawSkillCooldownShadow(sx, itemY, itemW, itemH, clamp(skill.cd / Math.max(0.1, skill.max), 0, 1));
      drawSkillInputBadge(inputLabels[i], sx + 8, itemY + 7, itemW - 16);
      ctx.fillStyle = "#102018";
      ctx.font = `800 ${itemW < 92 ? 10 : 11}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(247,255,246,0.86)";
      ctx.strokeText(skill.name, sx + itemW / 2, nameY);
      ctx.fillText(skill.name, sx + itemW / 2, nameY);
      statusUiButtons.push({
        action: "playerCommand",
        skillKey: skill.key,
        targeted: skill.targeted,
        x: sx,
        y: itemY,
        w: itemW,
        h: itemH,
      });
    }
    ctx.textBaseline = "alphabetic";
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
    };
  };
})();
