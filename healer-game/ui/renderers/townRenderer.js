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
      playerProfile,
      profileClickTargets,
      COLORS,
      getPronounChoices,
      getProfileNameInputRect,
      updateProfileNameInput,
      selectProfileGender,
      selectProfilePronoun,
      confirmProfileName,
      getTownBuilding,
      getQuestTypes,
      getQuestsByType,
      getQuestById,
    } = context;

  function drawTown() {
    ctx.fillStyle = "#3f6a48";
    ctx.fillRect(0, 0, view.w, view.h);

    const transform = getTownMapTransform();
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);
    drawTownTerrain();
    drawTownRoads();
    drawTownProps();
    drawTownBuildings();
    drawTownCompanions();
    ctx.restore();

    drawTownHud();
    drawTownPanel();
  }

  function getTownMapTransform() {
    const marginX = 28;
    const marginTop = 112;
    const marginBottom = 34;
    const scale = Math.min((view.w - marginX * 2) / TOWN_WIDTH, (view.h - marginTop - marginBottom) / TOWN_HEIGHT);
    const safeScale = Math.max(0.18, scale);
    return {
      scale: safeScale,
      x: (view.w - TOWN_WIDTH * safeScale) / 2,
      y: marginTop + Math.max(0, view.h - marginTop - marginBottom - TOWN_HEIGHT * safeScale) / 2,
    };
  }

  function screenToTownPoint(x, y) {
    const transform = getTownMapTransform();
    const worldX = (x - transform.x) / transform.scale;
    const worldY = (y - transform.y) / transform.scale;
    if (worldX < 0 || worldY < 0 || worldX > TOWN_WIDTH || worldY > TOWN_HEIGHT) {
      return null;
    }
    return { x: worldX, y: worldY };
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

    if (town.interaction === building && !town.panel) {
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
      ctx.fillText("クリック", building.x + building.w / 2, building.y - 63);
    }
    ctx.restore();
  }

  function drawTownCompanions() {
    if (!playerProfile.done) {
      return;
    }
    if (!town.meetingDone) {
      const guild = getTownBuilding("guild");
      const baseX = guild ? guild.door.x : 800;
      const baseY = guild ? guild.door.y - 18 : 790;
      drawTownNpc(baseX - 74, baseY + 8, COLORS.ulpes, "ウ");
      drawTownNpc(baseX - 8, baseY + 34, COLORS.rihas, "リ");
      drawTownNpc(baseX + 66, baseY + 10, COLORS.sushia, "ス");
      drawArgumentMark(baseX - 48, baseY - 22);
      drawArgumentMark(baseX + 6, baseY + 4);
      drawArgumentMark(baseX + 66, baseY - 18);
      return;
    }
    const plazaX = TOWN_WIDTH * 0.5;
    const plazaY = 560;
    drawTownNpc(plazaX - 48, plazaY + 54, COLORS.ulpes, "ウ");
    drawTownNpc(plazaX, plazaY + 74, COLORS.rihas, "リ");
    drawTownNpc(plazaX + 48, plazaY + 54, COLORS.sushia, "ス");
  }

  function drawTownNpc(x, y, color, label) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(x, y + 17, 17, 8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#102018";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#101814";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y + 1);
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
    const target = town.interaction ? `${town.interaction.name}をクリックで利用` : "施設をクリックして利用";
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
    ctx.fillText("E  閉じる", x + w - 24, y + h - 24);
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
    ctx.fillText("E  ストーリー依頼 / Esc  閉じる", x + w - 24, y + h - 22);
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

    let cursorY = y + 76;
    if (quests.length === 0) {
      ctx.fillStyle = "#dce9dc";
      ctx.font = "700 15px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("今はこの種類の依頼がありません。", x + 26, cursorY);
    } else {
      for (const quest of quests) {
        const buttonH = 82;
        drawQuestButton(x + 24, cursorY, w - 48, buttonH, `${quest.rank || "-"}  ${quest.name}`, quest.summary || "", {
          kind: "selectQuest",
          questId: quest.id,
        });
        cursorY += buttonH + 12;
        if (cursorY > y + h - 84) {
          break;
        }
      }
    }

    drawTextButton(x + 24, y + h - 54, 130, 34, "戻る", { kind: "backToQuestTypes" });
    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("E  一番上を選択 / Esc  閉じる", x + w - 24, y + h - 22);
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
    ctx.fillText("E  決定 / Esc  閉じる", x + w - 24, y + h - 76);
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

  function drawTextButton(x, y, w, h, label, action, primary = false) {
    town.panel.clickTargets.push({ x, y, w, h, action });
    ctx.save();
    ctx.fillStyle = primary ? "rgba(255,216,107,0.24)" : "rgba(255,255,255,0.1)";
    ctx.strokeStyle = primary ? "#ffd86b" : "rgba(255,255,255,0.24)";
    ctx.lineWidth = primary ? 2 : 1;
    roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = primary ? "#fff6c2" : "#f7fff6";
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
    ctx.fillText("E / Space / Enter / クリック で戦闘開始", x + w - 24, y + h - 20);
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
      drawProfilePrompt(x, y, w, "性別を選択してください");
      drawProfileChoices(x, y + 150, w, [
        { label: "1  男の子", selected: playerProfile.gender === "男の子", action: () => selectProfileGender("男の子") },
        { label: "2  女の子", selected: playerProfile.gender === "女の子", action: () => selectProfileGender("女の子") },
      ], 2);
    } else if (playerProfile.step === "name") {
      drawProfilePrompt(x, y, w, "名前を入力してください");
      ctx.fillStyle = "#cfe1d0";
      ctx.font = "700 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.fillText("フィナルドの前につく名前。6文字まで。未入力ならアルジュナになります。", x + w / 2, y + 132);
      const inputRect = getProfileNameInputRect();
      ctx.fillStyle = "#f7fff6";
      ctx.font = "800 22px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("・フィナルド", inputRect.x + inputRect.w + 14, inputRect.y + inputRect.h / 2 + 1);
      drawProfileButton(x + w / 2 - 100, y + 255, 200, 46, "決定", false, confirmProfileName);
    } else if (playerProfile.step === "pronoun") {
      drawProfilePrompt(x, y, w, "一人称を選択してください");
      drawProfileChoices(x, y + 136, w, getPronounChoices().map((choice, index) => ({
        label: `${index + 1}  ${choice}`,
        selected: playerProfile.pronoun === choice,
        action: () => selectProfilePronoun(choice),
      })), 3);
    }

    ctx.textAlign = "right";
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "rgba(247,255,246,0.72)";
    ctx.fillText(playerProfile.step === "name" ? "Enter / 決定" : "数字キー / クリック", x + w - 24, y + h - 24);
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
    ctx.fillText("E / Space / クリック", x + w - 30, y + h - 22);
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
