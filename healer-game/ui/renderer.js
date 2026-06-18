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
      skillSystem,
      itemSystem,
      getBattleBounds,
      updateTelegraphDynamic,
      battlePx,
      clamp,
      isFieldUnit,
      getFieldPartyMembers,
      getSupportOrigin,
    } = context;

    if (!window.createHealerTownRenderer) {
      throw new Error("createHealerTownRenderer must be loaded before ui/renderer.js");
    }
    if (!window.createHealerStatusRenderer) {
      throw new Error("createHealerStatusRenderer must be loaded before ui/renderer.js");
    }
    const townRenderer = window.createHealerTownRenderer(context);
    const statusRenderer = window.createHealerStatusRenderer(context);

  function draw() {
    ctx.clearRect(0, 0, view.w, view.h);
    if (game.state === "town") {
      townRenderer.drawTown();
      drawEffects();
      if (!playerProfile.done) {
        townRenderer.drawProfileSetup();
      } else {
        townRenderer.drawTownStoryDialogue();
      }
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
    drawResultOverlay();
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
      }
    }
  }

  function drawTelegraphs() {
    for (const telegraph of telegraphs) {
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
    for (const unit of units) {
      drawUnit(unit);
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
      const start = -Math.PI / 2;
      const end = start + TAU * (mood / 100);
      ctx.strokeStyle = getMoodColor(mood);
      ctx.lineWidth = Math.max(2, battlePx(3));
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius + battlePx(7), start, end);
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

    if (unit === player && (player.cast || player.channel)) {
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

    if (unit.team === "enemy") {
      const barWidth = Math.max(battlePx(44), unit.radius * 2.8);
      drawFieldHpBar(unit, unit.x - barWidth / 2, unit.y + unit.radius + battlePx(9), barWidth, battlePx(6), "#241312");
    } else {
      drawFieldHpBar(unit);
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
    const castProgress = player.cast
      ? 1 - clamp(player.cast.time / player.cast.total, 0, 1)
      : 1;
    const orbitRadius = unit.radius + battlePx(20);
    const pulse = 0.55 + Math.sin(game.time * 10) * 0.18;

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(124, 255, 148, 0.24)";
    ctx.lineWidth = Math.max(4, battlePx(8));
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, orbitRadius, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(190, 255, 203, 0.95)";
    ctx.lineWidth = Math.max(2, battlePx(3));
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, orbitRadius, -Math.PI / 2, -Math.PI / 2 + TAU * castProgress);
    ctx.stroke();

    for (let i = 0; i < 4; i += 1) {
      const angle = game.time * 4.2 + i * (TAU / 4);
      const x = unit.x + Math.cos(angle) * orbitRadius;
      const y = unit.y + Math.sin(angle) * orbitRadius;
      const size = i === 0 ? battlePx(5.5) : battlePx(4);
      ctx.fillStyle = `rgba(142, 255, 160, ${0.58 + pulse * 0.34})`;
      ctx.shadowColor = "#86ff9a";
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
      const life = clamp(effect.time / 0.85, 0, 1);
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
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 40px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText(game.state === "won" ? "依頼達成" : "依頼失敗", view.w / 2, view.h / 2 - 24);
    ctx.font = "18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillText("R で町へ戻る", view.w / 2, view.h / 2 + 28);
    ctx.restore();
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
