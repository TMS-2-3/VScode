(() => {
  "use strict";

  const QUEST_ID = "story_horn_rabbit_competition_001";
  const PARTY_NAMES = {
    finald: "アルジュナ",
    ulpes: "ウルペス",
    rihas: "リハス",
    sushia: "スシア",
  };
  const ULTIMATE_ACTION_IDS = {
    ulpes: "battle.ultimate.ulpes",
    rihas: "battle.ultimate.rihas",
    sushia: "battle.ultimate.sushia",
    finald: "battle.ultimate.finald",
  };

  function line(speaker, text, options = {}) {
    return { type: "line", speaker, text, ...options };
  }

  function system(text, options = {}) {
    return line("", text, options);
  }

  function script(action) {
    return { type: "script", action };
  }

  function waitSkill(id, skillKey, targetUnitId, text, options = {}) {
    return {
      type: "wait",
      waitType: "skillTarget",
      id,
      skillKey,
      targetUnitId,
      text,
      ...options,
    };
  }

  function waitUltimate(id, unitId, text, options = {}) {
    return {
      type: "wait",
      waitType: "ultimate",
      id,
      unitId,
      text,
      ...options,
    };
  }

  const STEPS = [
    line("ウルペス", "しっかりサポートしろよ！アルジュナ！"),
    line("リハス", "力の強い俺様ならサポートする必要もないと思うがな！"),
    system("基本的に味方達は自動で戦闘を行います"),
    system("あなたのサポート能力でチームを勝利に導きましょう！"),
    line("リハス", "おらぁ！まだまだ！"),
    script("damageRihas"),
    system("リハスがダメージを受けました", { highlightUnitId: "rihas" }),
    waitSkill("healRihas", "heal", "rihas", "スキルのヒールをリハスに使用して体力を回復させてあげましょう！"),
    line("リハス", "まだまだ余裕だなぁ！雑魚共！！"),
    line("ウルペス", "おいアルジュナ！僕にシールドをくれ！"),
    waitSkill("shieldUlpes", "shield", "ulpes", "スキルのシェルトを使用してウルペスをシールドで守ってあげましょう！"),
    system("離れていても近づいてからスキルを打つことができます！"),
    line("ウルペス", "雑魚の攻撃じゃあ僕のシールドは割れないね！"),
    line("アルジュナ", "{pronoun}のシールドなんだけどなぁ、一応。"),
    line("リハス", "俺様が全員まとめて相手してやる！"),
    script("readyRihasUltimate"),
    system("リハスの必殺ゲージが溜まっています", { highlightUltimateUnitId: "rihas" }),
    system("リハスの必殺技は周囲の敵を挑発することができます", { highlightUltimateUnitId: "rihas" }),
    waitUltimate("rihasUltimate", "rihas", "{rihasUltKey}を押してリハスの必殺技を発動しましょう！"),
    line("リハス", "まとめてかかってこい！"),
    system("順調に進んでいますね…おや？"),
    line("スシア", "タイン！邪魔よ！そこ貰ったわ！！"),
    script("sushiaOverconfident"),
    system("まずいです！スシアが調子に乗っています！", { highlightStatusUnitId: "sushia" }),
    system("調子はここで確認することができます", { highlightStatusUnitId: "sushia" }),
    system("調子に乗っていると防御が疎かになったり、味方のことを気にせずにスキルを振るようになってしまいます", { highlightStatusUnitId: "sushia" }),
    system("逆に調子が低すぎると敵から逃げてしまったり、攻撃が疎かになります", { highlightStatusUnitId: "sushia" }),
    system("調子は敵を攻撃したり、回復を受けすぎたりすると上昇します", { highlightStatusUnitId: "sushia" }),
    system("敵からダメージを受けたり、HPをある程度低く保ってあげると調子を下げることができます", { highlightStatusUnitId: "sushia" }),
    system("調子に乗っている、もしくは調子が低い味方がいると戦況が不利になっていく可能性が高いです", { highlightStatusUnitId: "sushia" }),
    system("調子には常に気を配るようにしましょう", { highlightStatusUnitId: "sushia" }),
    line("スシア", "アイスワールド！！"),
    script("sushiaIceWorld"),
    system("スシアが調子に乗って必殺技を発動しました", { highlightUltimateUnitId: "sushia" }),
    system("スシアの必殺技は広範囲の敵の動きを止めることができます", { highlightUltimateUnitId: "sushia" }),
    system("が、スシアが調子に乗っているため味方にも当たってしまうかもしれません！", { highlightStatusUnitId: "sushia" }),
    line("ウルペス", "なっ！！"),
    line("リハス", "うおっ！？"),
    system("スシアの調子を下げてあげましょう", { highlightStatusUnitId: "sushia" }),
    system("防御指示を使ってスシアの行動を防御よりにしてあげましょう", { highlightCommandUnitId: "sushia" }),
    system("防御に集中することで攻撃の手が減り、調子を下げやすくなります", { highlightCommandUnitId: "sushia" }),
    system("逆に攻撃よりにしてあげることで高いダメージを狙ったり、調子を上げやすくなります", { highlightCommandUnitId: "sushia" }),
    system("どちらの行動に集中しているかはここで確認することができます", { highlightCommandUnitId: "sushia" }),
    waitSkill("defendSushia", "commandDefend", "sushia", "指示スキルの防御指示をスシアに使用しましょう！", { highlightCommandUnitId: "sushia" }),
    line("スシア", "分かったわ、少し手を止めるわよ"),
    system("成功しました！調子に乗っていると指示スキルは無視される場合もあります"),
    system("今回は運が良かったですね"),
    script("readyUlpesUltimate"),
    line("ウルペス", "最後の1体は僕がやろう！"),
    system("ウルペスの必殺技は敵1体に大ダメージを与えることができます！", { highlightUltimateUnitId: "ulpes" }),
    waitUltimate("ulpesUltimate", "ulpes", "最後の敵にとどめを刺しましょう！"),
    line("ウルペス", "真っ二つ！！"),
    script("finishBySushia"),
  ];

  function isTutorialQuest(quest) {
    return Boolean(quest && (quest.id === QUEST_ID || quest.battleId === QUEST_ID));
  }

  function start(game, quest, helpers = {}) {
    if (!game) {
      return null;
    }
    if (!isTutorialQuest(quest)) {
      game.battleTutorial = null;
      return null;
    }
    game.battleTutorial = {
      active: true,
      completed: false,
      questId: QUEST_ID,
      index: 0,
      mode: "line",
      selectedSkillKey: null,
      feedback: "",
      flash: 0,
    };
    setupBattle(game, helpers);
    prepare(game, helpers);
    return game.battleTutorial;
  }

  function setupBattle(game, helpers = {}) {
    for (const unit of getUniqueUnits(helpers)) {
      if (!unit) {
        continue;
      }
      unit.dead = false;
      unit.field = true;
      unit.targetable = true;
      unit.collidable = true;
      unit.hp = Math.max(1, unit.maxHp || unit.hp || 1);
      unit.mp = Math.max(0, unit.maxMp || unit.mp || 0);
      clearTutorialStatuses(unit);
      unit.shield = 0;
      unit.shieldTimer = 0;
      unit.shields = [];
      unit.actionLock = 0;
      unit.actionTotal = 0;
      unit.cast = null;
      unit.castVisual = null;
      unit.channel = null;
      unit.aiIntent = null;
      unit.aiMoveTarget = null;
      unit.battleFacingIntent = null;
      unit.itemAim = null;
      unit.itemUseRequest = null;
      unit.itemCast = null;
      unit.cds = {};
      if (unit.team === "party" && unit.mood !== null) {
        unit.mood = 50;
        unit.moodActionGain = 0;
      }
      if (unit.team === "party") {
        setUltimateReady(unit, helpers, 0.5);
      }
    }
    const enemies = Array.isArray(helpers.enemies) ? helpers.enemies : [];
    for (const enemy of enemies) {
      if (!enemy) {
        continue;
      }
      enemy.dead = false;
      enemy.hp = Math.max(1, enemy.maxHp || enemy.hp || 1);
      enemy.lootCollected = false;
      clearTutorialStatuses(enemy);
      enemy.actionLock = 0;
      enemy.actionTotal = 0;
      enemy.cast = null;
      enemy.castVisual = null;
      enemy.channel = null;
      enemy.aiIntent = null;
      enemy.aiMoveTarget = null;
      enemy.battleFacingIntent = null;
      enemy.cds = {};
    }
    game.message = "戦闘チュートリアル";
    game.messageTimer = 2;
  }

  function clearTutorialStatuses(unit) {
    if (!unit) {
      return;
    }
    unit.forcedTarget = null;
    unit.tauntTimer = 0;
    unit.frozen = 0;
    unit.frozenMax = 0;
    unit.sleepTimer = 0;
    unit.sleepMax = 0;
    unit.burnTimer = 0;
    unit.burnMax = 0;
    unit.burnTick = 0;
    unit.burnSource = null;
    unit.poisonActive = false;
    unit.poisonTick = 0;
    unit.poisonSource = null;
    unit.injuryTimer = 0;
    unit.injuryMax = 0;
    unit.woundStacks = 0;
    unit.plantStage = 0;
    unit.plantSource = null;
    unit.sorrowTimer = 0;
    unit.sorrowMax = 0;
    unit.regretTimer = 0;
    unit.regretMax = 0;
    unit.reunionTimer = 0;
    unit.reunionMax = 0;
    unit.absorptionLockTimer = 0;
    unit.actionSpeedDownTimer = 0;
    unit.actionSpeedDownMax = 0;
    unit.magicNeutralizeTimer = 0;
    unit.magicNeutralizeMax = 0;
    unit.shadowDashTimer = 0;
    unit.shadowDashMax = 0;
  }

  function getUniqueUnits(helpers = {}) {
    const seen = new Set();
    const units = [];
    const add = (unit) => {
      if (!unit || seen.has(unit)) {
        return;
      }
      seen.add(unit);
      units.push(unit);
    };
    add(helpers.player);
    for (const unit of Array.isArray(helpers.party) ? helpers.party : []) {
      add(unit);
    }
    return units;
  }

  function getState(game) {
    return game && game.battleTutorial || null;
  }

  function isActive(game) {
    const state = getState(game);
    return Boolean(state && state.active && !state.completed);
  }

  function shouldPause(game) {
    return isActive(game);
  }

  function getCurrentStep(gameOrState) {
    const state = gameOrState && gameOrState.battleTutorial ? gameOrState.battleTutorial : gameOrState;
    if (!state || !state.active) {
      return null;
    }
    return STEPS[state.index] || null;
  }

  function prepare(game, helpers = {}) {
    const state = getState(game);
    if (!state || !state.active) {
      return null;
    }
    while (state.active) {
      const step = getCurrentStep(state);
      if (!step) {
        state.active = false;
        state.completed = true;
        state.mode = "done";
        state.selectedSkillKey = null;
        return null;
      }
      if (step.type === "script") {
        applyScript(step.action, game, helpers, state);
        if (!state.active) {
          return null;
        }
        state.index += 1;
        continue;
      }
      state.mode = step.type;
      return step;
    }
    return null;
  }

  function advanceLine(game, helpers = {}) {
    const state = getState(game);
    const step = getCurrentStep(state);
    if (!state || !step || step.type !== "line") {
      return false;
    }
    state.index += 1;
    state.selectedSkillKey = null;
    state.feedback = "";
    prepare(game, helpers);
    return true;
  }

  function selectSkill(game, skillKey, helpers = {}) {
    const state = getState(game);
    const step = getCurrentStep(state);
    if (!state || !step || step.type !== "wait" || step.waitType !== "skillTarget") {
      return reject(game, "今は指定された操作だけ使えます");
    }
    if (skillKey !== step.skillKey) {
      return reject(game, `${getSkillName(step.skillKey, helpers)}を使いましょう`);
    }
    state.selectedSkillKey = skillKey;
    state.feedback = `${getUnitName(step.targetUnitId, helpers)}を選択してください`;
    if (typeof helpers.cancelItemAim === "function") {
      helpers.cancelItemAim();
    }
    let started = false;
    if (typeof helpers.startPlayerAim === "function") {
      started = helpers.startPlayerAim(skillKey);
    }
    if (!started && helpers.player) {
      helpers.player.aim = { type: skillKey };
    }
    return true;
  }

  function cancelSelectedSkill(game, helpers = {}) {
    const state = getState(game);
    const step = getCurrentStep(state);
    if (!state || !step || step.type !== "wait" || step.waitType !== "skillTarget" || !state.selectedSkillKey) {
      return false;
    }
    state.selectedSkillKey = null;
    state.feedback = `${getSkillName(step.skillKey, helpers)}を選択してください`;
    if (typeof helpers.cancelPlayerAim === "function") {
      helpers.cancelPlayerAim();
    }
    return true;
  }

  function confirmTarget(game, target, helpers = {}) {
    const state = getState(game);
    const step = getCurrentStep(state);
    if (!state || !step || step.type !== "wait" || step.waitType !== "skillTarget") {
      return reject(game, "今は指定された操作だけ使えます");
    }
    if (state.selectedSkillKey !== step.skillKey) {
      return reject(game, `${getSkillName(step.skillKey, helpers)}を選択してください`);
    }
    if (!target || target.id !== step.targetUnitId) {
      return reject(game, `${getUnitName(step.targetUnitId, helpers)}を選択してください`);
    }
    applyWaitOutcome(step, game, helpers, state);
    state.index += 1;
    state.selectedSkillKey = null;
    state.feedback = "";
    if (typeof helpers.cancelPlayerAim === "function") {
      helpers.cancelPlayerAim();
    } else if (helpers.player) {
      helpers.player.aim = null;
    }
    prepare(game, helpers);
    return true;
  }

  function activateUltimate(game, unitId, helpers = {}) {
    const state = getState(game);
    const step = getCurrentStep(state);
    if (!state || !step || step.type !== "wait" || step.waitType !== "ultimate") {
      return reject(game, "今は指定された操作だけ使えます");
    }
    if (unitId !== step.unitId) {
      return reject(game, `${getUnitName(step.unitId, helpers)}の必殺技を使いましょう`);
    }
    applyWaitOutcome(step, game, helpers, state);
    state.index += 1;
    state.selectedSkillKey = null;
    state.feedback = "";
    prepare(game, helpers);
    return true;
  }

  function reject(game, message) {
    const state = getState(game);
    if (!state) {
      return true;
    }
    state.feedback = message || "今は指定された操作だけ使えます";
    state.flash = 1;
    return true;
  }

  function applyWaitOutcome(step, game, helpers, state) {
    if (step.id === "healRihas") {
      const target = getUnitById("rihas", helpers);
      if (target && typeof helpers.healUnit === "function") {
        helpers.healUnit(helpers.player, target, Math.max(1, target.maxHp || 1), { noMood: true });
      } else if (target) {
        target.hp = Math.max(1, target.maxHp || target.hp || 1);
      }
      burstUnit(target, helpers, "rgba(121,255,141,0.22)");
      return;
    }
    if (step.id === "shieldUlpes") {
      const target = getUnitById("ulpes", helpers);
      const amount = Math.max(1, (target && target.maxHp || 1) * 0.55);
      if (target && typeof helpers.addShield === "function") {
        helpers.addShield(target, amount, 10);
      } else if (target) {
        target.shield = Math.min(target.maxHp || amount, amount);
        target.shieldTimer = 10;
        target.shields = [{ amount: target.shield, timer: 10 }];
      }
      addUnitFloat(target, "シェルト", "#8fe9ff", helpers);
      burstUnit(target, helpers, "rgba(143,233,255,0.25)");
      return;
    }
    if (step.id === "rihasUltimate") {
      const unit = getUnitById("rihas", helpers);
      if (unit) {
        setUltimateReady(unit, helpers, 1);
      }
      if (typeof helpers.triggerUltimate === "function" && helpers.triggerUltimate("rihas")) {
        return;
      }
      if (unit) {
        unit.ult = 0;
        for (const enemy of Array.isArray(helpers.enemies) ? helpers.enemies : []) {
          if (enemy && !enemy.dead) {
            enemy.forcedTarget = unit;
            enemy.tauntTimer = 5;
          }
        }
        burstUnit(unit, helpers, "rgba(227,122,63,0.18)", 72);
      }
      return;
    }
    if (step.id === "defendSushia") {
      const target = getUnitById("sushia", helpers);
      if (target) {
        target.commandBias = -1;
        target.activeCommandBias = -1;
        target.mood = Math.min(68, Number.isFinite(target.mood) ? target.mood : 68);
        addUnitFloat(target, "防御指示", "#9cc6ff", helpers);
        burstUnit(target, helpers, "rgba(156,198,255,0.2)");
      }
      if (helpers.player) {
        helpers.player.aim = null;
      }
      return;
    }
    if (step.id === "ulpesUltimate") {
      const unit = getUnitById("ulpes", helpers);
      if (unit) {
        setUltimateReady(unit, helpers, 1);
        unit.ult = 0;
        burstUnit(unit, helpers, "rgba(244,197,79,0.28)", 86);
      }
    }
  }

  function applyScript(action, game, helpers, state) {
    if (action === "damageRihas") {
      const unit = getUnitById("rihas", helpers);
      if (unit) {
        const before = unit.hp;
        unit.hp = Math.max(1, Math.round((unit.maxHp || before || 1) * 0.42));
        unit.hurt = 0.25;
        addUnitFloat(unit, `-${Math.max(1, Math.round(before - unit.hp))}`, "#ff4f4f", helpers);
      }
      return;
    }
    if (action === "readyRihasUltimate") {
      const unit = getUnitById("rihas", helpers);
      setUltimateReady(unit, helpers, 1);
      addUnitFloat(unit, "必殺OK", "#73dfff", helpers);
      return;
    }
    if (action === "sushiaOverconfident") {
      const unit = getUnitById("sushia", helpers);
      if (unit) {
        unit.mood = 95;
        setUltimateReady(unit, helpers, 1);
        addUnitFloat(unit, "調子上昇", "#ff9f43", helpers);
      }
      return;
    }
    if (action === "sushiaIceWorld") {
      const sushia = getUnitById("sushia", helpers);
      if (sushia) {
        sushia.ult = 0;
        sushia.mood = 96;
        burstUnit(sushia, helpers, "rgba(135,221,255,0.22)", 155);
      }
      for (const unitId of ["ulpes", "rihas"]) {
        const ally = getUnitById(unitId, helpers);
        if (ally) {
          ally.frozen = Math.max(ally.frozen || 0, 1.2);
          ally.frozenMax = Math.max(ally.frozenMax || 0, ally.frozen);
          addUnitFloat(ally, "凍結", "#8fe9ff", helpers);
        }
      }
      defeatEnemiesExceptLast(helpers, sushia);
      return;
    }
    if (action === "readyUlpesUltimate") {
      for (const unitId of ["ulpes", "rihas"]) {
        const ally = getUnitById(unitId, helpers);
        if (ally) {
          ally.frozen = 0;
          ally.frozenMax = 0;
        }
      }
      const unit = getUnitById("ulpes", helpers);
      setUltimateReady(unit, helpers, 1);
      addUnitFloat(unit, "必殺OK", "#73dfff", helpers);
      ensureOneEnemyLeft(helpers);
      return;
    }
    if (action === "finishBySushia") {
      const sushia = getUnitById("sushia", helpers);
      defeatRemainingEnemies(helpers, sushia);
      if (state) {
        state.active = false;
        state.completed = true;
        state.mode = "done";
        state.selectedSkillKey = null;
      }
      game.message = "チュートリアル完了";
      game.messageTimer = 2;
    }
  }

  function defeatEnemiesExceptLast(helpers = {}, source = null) {
    const alive = getAliveEnemies(helpers);
    const keep = alive[alive.length - 1] || null;
    for (const enemy of alive) {
      if (enemy !== keep) {
        defeatEnemy(enemy, source, helpers);
      }
    }
    if (keep) {
      keep.hp = Math.max(1, Math.min(keep.hp || 1, Math.round((keep.maxHp || 1) * 0.18)));
      addUnitFloat(keep, "残り1体", "#ffffff", helpers);
    }
  }

  function ensureOneEnemyLeft(helpers = {}) {
    const alive = getAliveEnemies(helpers);
    if (!alive.length) {
      return;
    }
    const keep = alive[alive.length - 1];
    for (const enemy of alive) {
      if (enemy !== keep) {
        defeatEnemy(enemy, getUnitById("sushia", helpers), helpers);
      }
    }
    keep.hp = Math.max(1, Math.min(keep.hp || 1, Math.round((keep.maxHp || 1) * 0.12)));
  }

  function defeatRemainingEnemies(helpers = {}, source = null) {
    for (const enemy of getAliveEnemies(helpers)) {
      defeatEnemy(enemy, source, helpers);
    }
  }

  function defeatEnemy(enemy, source, helpers = {}) {
    if (!enemy || enemy.dead) {
      return;
    }
    enemy.hp = 0;
    enemy.dead = true;
    enemy.defeatedBy = source && source.id || null;
    enemy.shield = 0;
    enemy.shieldTimer = 0;
    enemy.shields = [];
    enemy.actionLock = 0;
    enemy.actionTotal = 0;
    enemy.cast = null;
    enemy.castVisual = null;
    enemy.channel = null;
    enemy.aiIntent = null;
    enemy.aiMoveTarget = null;
    enemy.battleFacingIntent = null;
    enemy.pendingActionQueueKey = null;
    addUnitFloat(enemy, source && source.id === "sushia" ? "スシア" : "撃破", "#ffffff", helpers);
    burstUnit(enemy, helpers, "rgba(255,255,255,0.2)", 44);
  }

  function getAliveEnemies(helpers = {}) {
    return (Array.isArray(helpers.enemies) ? helpers.enemies : []).filter((enemy) => enemy && !enemy.dead);
  }

  function setUltimateReady(unit, helpers = {}, ratio = 1) {
    if (!unit) {
      return;
    }
    const cost = typeof helpers.getUltimateCost === "function" ? helpers.getUltimateCost(unit) : 100;
    unit.ult = Math.max(0, (Number.isFinite(cost) ? cost : 100) * ratio);
  }

  function getUnitById(unitId, helpers = {}) {
    if (!unitId) {
      return null;
    }
    if (unitId === "finald" && helpers.player) {
      return helpers.player;
    }
    const units = getUniqueUnits(helpers);
    for (const unit of units) {
      if (unit && unit.id === unitId) {
        return unit;
      }
    }
    for (const enemy of Array.isArray(helpers.enemies) ? helpers.enemies : []) {
      if (enemy && enemy.id === unitId) {
        return enemy;
      }
    }
    return null;
  }

  function getUnitName(unitId, helpers = {}) {
    const unit = getUnitById(unitId, helpers);
    if (unitId === "finald" && helpers.getPlayerFirstName) {
      return helpers.getPlayerFirstName();
    }
    return PARTY_NAMES[unitId] || unit && (unit.label || unit.name) || unitId || "";
  }

  function getSkillName(skillKey, helpers = {}) {
    const skill = findSkill(skillKey, helpers);
    return skill && skill.name || skillKey || "";
  }

  function findSkill(skillKey, helpers = {}) {
    const data = helpers.SKILL_DATA || window.HEALER_SKILL_DATA || {};
    for (const skills of Object.values(data)) {
      if (skills && skills[skillKey]) {
        return skills[skillKey];
      }
    }
    return null;
  }

  function getPronoun(helpers = {}) {
    const profile = helpers.playerProfile || {};
    const value = String(profile.pronoun || "").trim();
    return value || "私";
  }

  function getUltimateKeyLabel(unitId, helpers = {}) {
    const actionId = ULTIMATE_ACTION_IDS[unitId];
    if (actionId && typeof helpers.getKeybindLabel === "function") {
      const label = helpers.getKeybindLabel(actionId);
      if (label) {
        return label;
      }
    }
    if (unitId === "ulpes") return "1";
    if (unitId === "rihas") return "2";
    if (unitId === "sushia") return "3";
    return "4";
  }

  function formatStepText(step, helpers = {}) {
    if (!step) {
      return "";
    }
    return String(step.text || "")
      .replace(/\{pronoun\}/g, getPronoun(helpers))
      .replace(/\{rihasUltKey\}/g, getUltimateKeyLabel("rihas", helpers))
      .replace(/\{ulpesUltKey\}/g, getUltimateKeyLabel("ulpes", helpers));
  }

  function getStepSpeaker(step, helpers = {}) {
    if (!step || !step.speaker) {
      return "";
    }
    if (step.speaker === "アルジュナ" && helpers.getPlayerFirstName) {
      return helpers.getPlayerFirstName();
    }
    return step.speaker;
  }

  function addUnitFloat(unit, text, color, helpers = {}) {
    if (!unit || !text || typeof helpers.addFloat !== "function") {
      return;
    }
    helpers.addFloat(text, unit.x, unit.y - (unit.radius || 16) - 20, color || "#ffffff");
  }

  function burstUnit(unit, helpers = {}, color = "rgba(255,255,255,0.2)", extraRadius = 32) {
    if (!unit || typeof helpers.addBurst !== "function") {
      return;
    }
    const radius = (unit.radius || 16) + (typeof helpers.battlePx === "function" ? helpers.battlePx(extraRadius) : extraRadius);
    helpers.addBurst(unit.x, unit.y, radius, color);
  }

  window.HEALER_BATTLE_TUTORIAL = {
    QUEST_ID,
    isTutorialQuest,
    start,
    prepare,
    advanceLine,
    selectSkill,
    cancelSelectedSkill,
    confirmTarget,
    activateUltimate,
    reject,
    isActive,
    shouldPause,
    getCurrentStep,
    formatStepText,
    getStepSpeaker,
    getUnitById,
    getUnitName,
    getSkillName,
    getUltimateKeyLabel,
  };
})();
