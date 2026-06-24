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
    } = context;

    const INCAPACITATED_HP_RECOVERY_RATIO = 0.2;

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

    function savePartyHp() {
      game.partyHpById = game.partyHpById && typeof game.partyHpById === "object"
        ? game.partyHpById
        : {};
      for (const member of party) {
        if (!member || !member.id || !Number.isFinite(member.hp)) {
          continue;
        }
        game.partyHpById[member.id] = getPersistentHp(member);
      }
    }

    function saveFullPartyHp() {
      game.partyHpById = game.partyHpById && typeof game.partyHpById === "object"
        ? game.partyHpById
        : {};
      for (const member of party) {
        if (!member || !member.id || !Number.isFinite(member.maxHp)) {
          continue;
        }
        game.partyHpById[member.id] = member.maxHp;
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
        for (const member of party) {
          member.hp = member.maxHp;
          member.mp = member.maxMp;
          member.dead = false;
          member.shield = 0;
          member.shieldTimer = 0;
          member.shields = [];
        }
        saveFullPartyHp();
        town.panel = {
          title: "宿屋",
          lines: ["全員のHPとMPを回復した。", "次の依頼に向けて一息つける場所。"],
        };
      } else if (target.id === "item") {
        town.panel = {
          title: "アイテム屋",
          lines: ["回復薬、魔力薬、状態回復アイテムを扱う予定。", "今は品揃え準備中。"],
        };
      } else if (target.id === "weapon") {
        town.panel = {
          title: "武器屋",
          lines: ["杖、剣、拳具を扱う予定。", "数値強化だけでなく、調子の動きが変わる装備にしたい。"],
        };
      } else if (target.id === "armor") {
        town.panel = {
          title: "防具屋",
          lines: ["ローブ、軽鎧、腕甲を扱う予定。", "防御力や魔防、ガード率に関わる装備を置く予定。"],
        };
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
      } else if (action.kind === "close") {
        closeTownPanel();
      }
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
      const moveLabels = [
        keyLabel("common.moveUp", "W"),
        keyLabel("common.moveLeft", "A"),
        keyLabel("common.moveDown", "S"),
        keyLabel("common.moveRight", "D"),
      ].join("/");
      const skillLabels = [1, 2, 3, 4, 5].map((index) => keyLabel(`battle.skill${index}`, ["Q", "E", "R", "F", "G"][index - 1])).join("/");
      const itemLabels = [1, 2, 3].map((index) => keyLabel(`battle.item${index}`, ["C", "V", "B"][index - 1])).join("/");
      const fireLabel = keyLabel("battle.confirm", "左クリック");
      const cancelLabel = keyLabel("battle.cancelAim", "右クリック");
      const pageLabel = keyLabel("battle.skillPage", "Space");
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
            title: `${getPlayerFirstName()}の技`,
            lines: [
              `共通: 構え中は${fireLabel}で発動、${cancelLabel}でキャンセル。`,
              "援護射撃: 指定地点の狭い範囲へ魔法攻撃。",
              "ヒール: カーソル上の味方を回復。対象がいないと発動しない。",
              "バリア: 指定範囲の味方にシールドを付与。重なったシールドは耐久値が加算される。",
              "指示スキル: 味方への指示や敵へのフォーカスを行う。通常スキルと同じ10枠内に自由にセットできる。",
            ],
          },
          {
            title: "必殺技",
            lines: [
              `${ultLabels.ulpes} ウルペス: 正義の一撃。敵へ飛び込み、大きな一撃を入れる。`,
              `${ultLabels.rihas} リハス: 俺ァ無敵!! 周囲の敵を挑発し、自分にシールドを張る。`,
              `${ultLabels.sushia} スシア: アイスワールド。広範囲を凍らせ、継続ダメージを与える。`,
              `${ultLabels.finald} ${getPlayerFirstName()}: フルヒール。詠唱後に全味方を最大HP割合で回復する。`,
            ],
          },
          {
            title: "調子メーター",
            lines: [
              "仲間はHPが高く保たれたり、活躍したりすると調子が上がる。",
              "高い調子では攻撃性能が伸びるが、上がりすぎると慢心して被ダメージが増えたり、必殺技を勝手に使ったりする。",
              "逆にHPが削られすぎると調子が下がり、萎縮して弱くなる。",
            ],
          },
          {
            title: "操作",
            lines: [
              `主人公は${moveLabels}で戦場を移動しながら、味方を支援する。`,
              "構え中は主人公中心の射程円が出る。射程外の対象・地点には発動できない。",
              `ページ内の左5枠は${skillLabels}で左から順に構える。右端の必殺技は${ultLabels.finald}で発動。`,
              `${fireLabel}: 発動 / ${cancelLabel}: 構えキャンセル / ${pageLabel}: ページ切り替え。`,
              `アイテムは${itemLabels}で構え、${fireLabel}でカーソル上の味方に使用する。`,
              `${ultLabels.ulpes}/${ultLabels.rihas}/${ultLabels.sushia}/${ultLabels.finald}: 必殺技 / 勝利条件: 敵全滅`,
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
