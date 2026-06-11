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
      screenToTownPoint,
      clampTownPlayer,
      updateProfileNameInput,
      beginOpeningStory,
      getPlayerFirstName,
      getMeetingStory,
    } = context;

    function startTown() {
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

    function updateTown() {
      if (!playerProfile.done) {
        updateProfileNameInput();
        town.interaction = getTownInteraction();
        return;
      }
      if (town.story) {
        town.interaction = null;
        return;
      }
      town.interaction = getTownInteraction();
    }

    function updateTownCamera() {
      town.camera.x = 0;
      town.camera.y = 0;
    }

    function getTownInteraction() {
      if (town.panel || town.story) {
        return null;
      }
      const point = screenToTownPoint(input.mouse.x, input.mouse.y);
      if (!point) {
        return null;
      }
      for (const building of town.buildings) {
        if (point.x >= building.x && point.x <= building.x + building.w && point.y >= building.y - 44 && point.y <= building.y + building.h + 46) {
          return building;
        }
      }
      return null;
    }

    function interactTown(options = {}) {
      if (town.story) {
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
        }
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
              "共通: 構え中は左クリックで発動、右クリックでキャンセル。",
              "援護射撃: 指定地点の狭い範囲へ魔法攻撃。",
              "ヒール: カーソル上の味方を回復。対象がいないと発動しない。",
              "バリア: 指定範囲の味方にシールドを付与。重なったシールドは耐久値が加算される。",
              "指示スキル: 味方の攻防メーターを動かす。通常スキルと同じ10枠内に自由にセットできる。",
            ],
          },
          {
            title: "必殺技",
            lines: [
              "1 ウルペス: 正義の一撃。敵へ飛び込み、大きな一撃を入れる。",
              "2 リハス: 俺ァ無敵!! 周囲の敵を挑発し、自分にシールドを張る。",
              "3 スシア: アイスワールド。広範囲を凍らせ、継続ダメージを与える。",
              `4 ${getPlayerFirstName()}: フルヒール。4で詠唱開始、3秒後に全味方を最大HP割合で回復する。`,
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
              "主人公は戦場に出ず、後方から味方を支援する。",
              "ページ内の左5枠は Q/E/R/F/G で左から順に構える。右端の必殺技は4で発動。左クリック: 発動 / 右クリック: 構えキャンセル",
              "Space: ページ１とページ２を切り替える。通常スキルも指示スキルも自由に配置できる。",
              "何も構えていない時は、敵を左クリックでターゲット指定。同じ敵をもう一度押すと解除。",
              "1-4: 必殺技 / 勝利条件: 敵全滅",
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
