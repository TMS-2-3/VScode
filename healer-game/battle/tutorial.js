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
  const TUTORIAL_MOOD_MIN = 40;
  const SUSHIA_DEFEND_MOOD = 80;
  const SUSHIA_CALM_MOOD = 60;

  function line(speaker, text, options = {}) {
    return { type: "line", speaker, text, ...options };
  }

  function system(text, options = {}) {
    return line("", text, options);
  }

  function script(action) {
    return { type: "script", action };
  }

  function run(action, options = {}) {
    return { type: "run", action, ...options };
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
    run("rihasOpeningDamage", { minTime: 2.2, maxTime: 4.2 }),
    line("リハス", "おらぁ！まだまだ！"),
    system("リハスがダメージを受けました", { highlightUnitId: "rihas" }),
    waitSkill("healRihas", "heal", "rihas", "スキルのヒールをリハスに使用して体力を回復させてあげましょう！"),
    line("リハス", "まだまだ余裕だなぁ！雑魚共！！"),
    run("ulpesRushOut", { minTime: 1.5, maxTime: 3.5 }),
    line("ウルペス", "おいアルジュナ！僕にシールドをくれ！"),
    system("スキルのシェルトを使用してウルペスをシールドで守ってあげましょう！", { highlightUnitId: "ulpes" }),
    waitSkill("shieldUlpes", "shield", "ulpes", "離れていても近づいてからスキルを打つことができます！"),
    line("ウルペス", "雑魚の攻撃じゃあ僕のシールドは割れないね！"),
    line("アルジュナ", "{pronoun}のシールドなんだけどなぁ、一応。"),
    run("freeCombatAfterShield", { duration: 5 }),
    line("リハス", "俺様が全員まとめて相手してやる！"),
    script("readyRihasUltimate"),
    system("リハスの必殺ゲージが溜まっています", { highlightUltimateUnitId: "rihas" }),
    system("リハスの必殺技は周囲の敵を挑発することができます", { highlightUltimateUnitId: "rihas" }),
    waitUltimate("rihasUltimate", "rihas", "{rihasUltKey}を押してリハスの必殺技を発動しましょう！"),
    line("リハス", "まとめてかかってこい！"),
    run("rihasTauntCombat", { minTime: 5.5, maxTime: 7.2 }),
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
    script("startSushiaIceWorld"),
    system("スシアが調子に乗って必殺技を発動しました", { highlightUltimateUnitId: "sushia" }),
    system("スシアの必殺技は広範囲の敵の動きを止めることができます", { highlightUltimateUnitId: "sushia" }),
    system("が、スシアが調子に乗っているため味方にも当たってしまうかもしれません！", { highlightStatusUnitId: "sushia" }),
    line("ウルペス", "なっ！！"),
    line("リハス", "うおっ！？"),
    run("sushiaIceWorldCombat", { minTime: 13, maxTime: 15.5 }),
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
    run("ulpesFinalThenSushiaShot", { minTime: 1.2, maxTime: 5 }),
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
      pendingWait: null,
      pendingScript: null,
      run: null,
      enemyAliveFloor: null,
      sushiaMoodDrift: null,
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
    if (!isActive(game)) {
      return false;
    }
    const state = getState(game);
    const step = getCurrentStep(game);
    return Boolean(step && (step.type === "line" || (step.type === "wait" && !state.pendingWait)));
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
        const result = applyScript(step.action, game, helpers, state);
        if (!state.active) {
          return null;
        }
        if (result === "pending") {
          state.mode = "script";
          return step;
        }
        state.index += 1;
        continue;
      }
      if (step.type === "run") {
        if (!state.run || state.run.index !== state.index) {
          beginRunStep(step, game, helpers, state);
        }
        state.mode = "run";
        return step;
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
    if (state && state.pendingWait) {
      return reject(game, "発動を待っています");
    }
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
    if (state && state.pendingWait) {
      return reject(game, "発動を待っています");
    }
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
    if (state && state.pendingWait) {
      return reject(game, "発動を待っています");
    }
    if (!state || !step || step.type !== "wait" || step.waitType !== "skillTarget") {
      return reject(game, "今は指定された操作だけ使えます");
    }
    if (state.selectedSkillKey !== step.skillKey) {
      return reject(game, `${getSkillName(step.skillKey, helpers)}を選択してください`);
    }
    if (!target || target.id !== step.targetUnitId) {
      return reject(game, `${getUnitName(step.targetUnitId, helpers)}を選択してください`);
    }
    return beginWaitAction(step, target, game, helpers, state);
  }

  function activateUltimate(game, unitId, helpers = {}) {
    const state = getState(game);
    const step = getCurrentStep(state);
    if (state && state.pendingWait) {
      return reject(game, "発動を待っています");
    }
    if (!state || !step || step.type !== "wait" || step.waitType !== "ultimate") {
      return reject(game, "今は指定された操作だけ使えます");
    }
    if (unitId !== step.unitId) {
      return reject(game, `${getUnitName(step.unitId, helpers)}の必殺技を使いましょう`);
    }
    return beginWaitUltimate(step, unitId, game, helpers, state);
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

  function beginWaitAction(step, target, game, helpers, state) {
    const player = helpers.player;
    const before = makeWaitSnapshot(step, target, helpers);
    let started = false;
    if (step.skillKey === "heal" && typeof helpers.castHeal === "function") {
      started = helpers.castHeal(target);
    } else if (step.skillKey === "shield" && typeof helpers.castShield === "function") {
      started = helpers.castShield(target);
    } else if (step.skillKey === "commandDefend" && typeof helpers.usePlayerCommand === "function") {
      started = helpers.usePlayerCommand(step.skillKey, target);
    }
    if (!started) {
      return reject(game, "発動できません");
    }
    state.pendingWait = {
      id: step.id,
      waitType: step.waitType,
      skillKey: step.skillKey,
      targetUnitId: step.targetUnitId,
      before,
      startedAt: Number.isFinite(game && game.time) ? game.time : 0,
    };
    state.selectedSkillKey = null;
    state.feedback = player && player.aiIntent && player.aiIntent.manual ? "移動してから発動します" : "発動を待っています";
    return true;
  }

  function beginWaitUltimate(step, unitId, game, helpers, state) {
    const unit = getUnitById(unitId, helpers);
    let started = false;
    if (unit) {
      setUltimateReady(unit, helpers, 1);
    }
    const before = makeWaitSnapshot(step, unit, helpers);
    if (typeof helpers.triggerUltimate === "function") {
      started = helpers.triggerUltimate(unitId);
    }
    if (!started) {
      return reject(game, "発動できません");
    }
    state.pendingWait = {
      id: step.id,
      waitType: step.waitType,
      unitId,
      before,
      startedAt: Number.isFinite(game && game.time) ? game.time : 0,
    };
    state.selectedSkillKey = null;
    state.feedback = "発動を待っています";
    return true;
  }

  function makeWaitSnapshot(step, target, helpers = {}) {
    const player = helpers.player || null;
    return {
      hp: target && Number.isFinite(target.hp) ? target.hp : null,
      shield: target && Number.isFinite(target.shield) ? target.shield : null,
      commandBias: target && Number.isFinite(target.commandBias) ? target.commandBias : null,
      activeCommandBias: target && Number.isFinite(target.activeCommandBias) ? target.activeCommandBias : null,
      playerCooldown: player && player.cds && Number.isFinite(player.cds[step.skillKey]) ? player.cds[step.skillKey] : 0,
      ult: target && Number.isFinite(target.ult) ? target.ult : null,
    };
  }

  function update(game, helpers = {}) {
    const state = getState(game);
    if (!state || !state.active) {
      return false;
    }
    const dt = Math.max(0, Number.isFinite(helpers.dt) ? helpers.dt : 0);
    protectTutorialCombatants(state, helpers);
    updateSushiaMoodDrift(state, helpers, dt);
    const step = getCurrentStep(state);
    if (step && step.type === "run") {
      if (!state.run || state.run.index !== state.index) {
        beginRunStep(step, game, helpers, state);
      }
      updateRunStep(game, helpers, state, step);
      return true;
    }
    if (state.pendingScript && updatePendingScript(game, helpers, state)) {
      return true;
    }
    if (state.pendingWait && updatePendingWait(game, helpers, state)) {
      return true;
    }
    return true;
  }

  function updatePendingWait(game, helpers, state) {
    const pending = state.pendingWait;
    const step = getCurrentStep(state);
    if (!pending || !step || step.type !== "wait") {
      state.pendingWait = null;
      return false;
    }
    if (!isPendingWaitComplete(pending, helpers)) {
      state.feedback = getPendingWaitMessage(pending, helpers);
      return false;
    }
    finishWaitStep(game, helpers, state);
    return true;
  }

  function getPendingWaitMessage(pending, helpers = {}) {
    const player = helpers.player;
    if (player && player.aiIntent && player.aiIntent.manual) {
      return "移動してから発動します";
    }
    if (player && player.cast) {
      return "詠唱中です";
    }
    return "発動を待っています";
  }

  function isPendingWaitComplete(pending, helpers = {}) {
    if (pending.waitType === "ultimate") {
      const unit = getUnitById(pending.unitId, helpers);
      if (!unit) {
        return false;
      }
      const beforeUlt = pending.before && Number.isFinite(pending.before.ult) ? pending.before.ult : 0;
      return unit.ult < beforeUlt && (unit.actionLock || 0) <= 0 && !unit.cast && !unit.channel;
    }
    const player = helpers.player;
    const target = getUnitById(pending.targetUnitId, helpers);
    if (!player || !target) {
      return false;
    }
    if (player.aiIntent && player.aiIntent.manual) {
      return false;
    }
    if (player.cast) {
      return false;
    }
    if (pending.skillKey === "heal") {
      const beforeHp = pending.before && Number.isFinite(pending.before.hp) ? pending.before.hp : 0;
      return target.hp > beforeHp || ((player.cds && player.cds.heal || 0) > 0 && (player.actionLock || 0) <= 0);
    }
    if (pending.skillKey === "shield") {
      const beforeShield = pending.before && Number.isFinite(pending.before.shield) ? pending.before.shield : 0;
      return target.shield > beforeShield || ((player.cds && player.cds.shield || 0) > 0 && (player.actionLock || 0) <= 0);
    }
    if (pending.skillKey === "commandDefend") {
      const currentBias = Number.isFinite(target.activeCommandBias) ? target.activeCommandBias : target.commandBias;
      const beforeBias = pending.before && Number.isFinite(pending.before.activeCommandBias)
        ? pending.before.activeCommandBias
        : pending.before && pending.before.commandBias;
      return currentBias < (Number.isFinite(beforeBias) ? beforeBias : 0)
        || ((player.cds && player.cds.commandDefend || 0) > 0 && (player.actionLock || 0) <= 0);
    }
    return false;
  }

  function finishWaitStep(game, helpers, state) {
    const pending = state.pendingWait;
    state.pendingWait = null;
    state.index += 1;
    state.selectedSkillKey = null;
    state.feedback = "";
    if (pending && pending.id === "defendSushia") {
      setSushiaMood(helpers, SUSHIA_DEFEND_MOOD, "調子低下");
      beginSushiaMoodDrift(state, helpers, SUSHIA_CALM_MOOD, 5);
    }
    if (typeof helpers.cancelPlayerAim === "function") {
      helpers.cancelPlayerAim();
    } else if (helpers.player) {
      helpers.player.aim = null;
    }
    prepare(game, helpers);
  }

  function beginRunStep(step, game, helpers, state) {
    state.run = {
      index: state.index,
      action: step.action,
      timer: 0,
      data: {},
    };
    state.feedback = "";
    state.flash = 0;
    startRunAction(state.run, step, game, helpers, state);
  }

  function updateRunStep(game, helpers, state, step) {
    const runState = state.run;
    if (!runState) {
      return false;
    }
    const dt = Math.max(0, Number.isFinite(helpers.dt) ? helpers.dt : 0);
    runState.timer += dt;
    updateRunAction(runState, step, game, helpers, state, dt);
    if (!isRunActionComplete(runState, step, helpers, state)) {
      return false;
    }
    finishRunStep(game, helpers, state, step);
    return true;
  }

  function finishRunStep(game, helpers, state, step) {
    if (step && step.action === "ulpesFinalThenSushiaShot") {
      state.run = null;
      state.active = false;
      state.completed = true;
      state.mode = "done";
      state.selectedSkillKey = null;
      game.message = "チュートリアル完了";
      game.messageTimer = 2;
      return;
    }
    state.run = null;
    state.index += 1;
    state.selectedSkillKey = null;
    state.feedback = "";
    prepare(game, helpers);
  }

  function startRunAction(runState, step, game, helpers, state) {
    const action = step && step.action;
    if (action === "rihasOpeningDamage") {
      setEnemyAliveFloor(state, helpers, getAliveEnemies(helpers).length);
      const rihas = getUnitById("rihas", helpers);
      if (rihas) {
        rihas.hp = Math.max(1, rihas.maxHp || rihas.hp || 1);
        readyUnitForTutorialAction(rihas);
      }
      forceEnemiesTarget(rihas, helpers, 3.5);
      return;
    }
    if (action === "ulpesRushOut") {
      setEnemyAliveFloor(state, helpers, getAliveEnemies(helpers).length);
      const ulpes = getUnitById("ulpes", helpers);
      readyUnitForTutorialAction(ulpes);
      if (ulpes) {
        ulpes.commandBias = Math.max(ulpes.commandBias || 0, 1);
        ulpes.activeCommandBias = Math.max(ulpes.activeCommandBias || 0, 1);
      }
      clearEnemyForcedTargets(helpers);
      return;
    }
    if (action === "freeCombatAfterShield") {
      setEnemyAliveFloor(state, helpers, getAliveEnemies(helpers).length);
      runState.data.sushiaMoodStart = getSushiaMood(helpers);
      clearEnemyForcedTargets(helpers);
      return;
    }
    if (action === "rihasTauntCombat") {
      setEnemyAliveFloor(state, helpers, Math.min(3, getAliveEnemies(helpers).length));
      const rihas = getUnitById("rihas", helpers);
      runState.data.sushiaMoodStart = getSushiaMood(helpers);
      forceEnemiesTarget(rihas, helpers, 6);
      return;
    }
    if (action === "sushiaIceWorldCombat") {
      setEnemyAliveFloor(state, helpers, Math.min(1, getAliveEnemies(helpers).length));
      runState.data.allyFreezeShown = false;
      return;
    }
    if (action === "ulpesFinalThenSushiaShot") {
      setEnemyAliveFloor(state, helpers, 1);
      const target = ensureOneEnemyLeft(helpers);
      runState.data.target = target;
      runState.data.phase = "delay";
      runState.data.shotStarted = false;
      if (target) {
        readyUnitForTutorialAction(target);
        clearTutorialStatuses(target);
        target.hp = Math.max(2, Math.min(target.hp || 1, Math.round((target.maxHp || 1) * 0.12)));
        target.actionLock = Math.max(target.actionLock || 0, 1.2);
        target.aiIntent = null;
        target.aiMoveTarget = null;
        addUnitFloat(target, "あと少し", "#ffffff", helpers);
      }
    }
  }

  function updateRunAction(runState, step, game, helpers, state, dt) {
    const action = runState && runState.action;
    if (action === "rihasOpeningDamage") {
      const rihas = getUnitById("rihas", helpers);
      forceEnemiesTarget(rihas, helpers, 0.6);
      if (rihas && runState.timer >= getStepMinTime(step, 2.2)) {
        applyTutorialHpRatio(rihas, 0.7, helpers);
      }
      return;
    }
    if (action === "ulpesRushOut") {
      moveUlpesTowardEnemies(runState, step, helpers, dt);
      return;
    }
    if (action === "rihasTauntCombat") {
      const rihas = getUnitById("rihas", helpers);
      forceEnemiesTarget(rihas, helpers, 0.8);
      rampSushiaMood(runState, helpers, 100, 2.2);
      if (!runState.data.defeatedOne && runState.timer >= 2.2) {
        defeatEnemiesUntil(helpers, 3, rihas);
        setSushiaMood(helpers, 100, "調子MAX");
        runState.data.defeatedOne = true;
      }
      return;
    }
    if (action === "freeCombatAfterShield") {
      rampSushiaMood(runState, helpers, 70, getStepDuration(step, 5));
      return;
    }
    if (action === "sushiaIceWorldCombat") {
      const sushia = getUnitById("sushia", helpers);
      if (!runState.data.allyFreezeShown && runState.timer >= 5.2) {
        for (const unitId of ["ulpes", "rihas"]) {
          const ally = getUnitById(unitId, helpers);
          if (ally) {
            ally.frozen = Math.max(ally.frozen || 0, 1.2);
            ally.frozenMax = Math.max(ally.frozenMax || 0, ally.frozen);
            addUnitFloat(ally, "凍結", "#8fe9ff", helpers);
          }
        }
        runState.data.allyFreezeShown = true;
      }
      if (!runState.data.weakenedForIceWorld && runState.timer >= 7) {
        weakenEnemiesUntil(helpers, 1, 1);
        runState.data.weakenedForIceWorld = true;
      }
      if (!runState.data.defeatedTwo && runState.timer >= 11.5 && getAliveEnemies(helpers).length > 1) {
        defeatEnemiesUntil(helpers, 1, sushia);
        runState.data.defeatedTwo = true;
      }
      return;
    }
    if (action === "ulpesFinalThenSushiaShot") {
      updateSushiaFinalShot(runState, helpers, state, dt);
    }
  }

  function isRunActionComplete(runState, step, helpers, state) {
    const timer = runState && runState.timer || 0;
    const action = runState && runState.action;
    const maxTime = getStepMaxTime(step, Infinity);
    if (action === "rihasOpeningDamage") {
      const rihas = getUnitById("rihas", helpers);
      const maxHp = Math.max(1, rihas && rihas.maxHp || 1);
      return (timer >= getStepMinTime(step, 2.2) && rihas && rihas.hp <= maxHp * 0.72) || timer >= maxTime;
    }
    if (action === "ulpesRushOut") {
      const ulpes = getUnitById("ulpes", helpers);
      const player = helpers.player;
      const shieldRange = getSkillRange("shield", helpers, toBattlePx(helpers, 230));
      const farEnough = Boolean(ulpes && player && getDistance(ulpes, player) > shieldRange + toBattlePx(helpers, 24));
      return (timer >= getStepMinTime(step, 1.5) && farEnough) || timer >= maxTime;
    }
    if (action === "freeCombatAfterShield") {
      return timer >= getStepDuration(step, 5);
    }
    if (action === "rihasTauntCombat") {
      return (timer >= getStepMinTime(step, 5.5) && getAliveEnemies(helpers).length <= 3) || timer >= maxTime;
    }
    if (action === "sushiaIceWorldCombat") {
      return (timer >= getStepMinTime(step, 13) && !hasActiveArea("ice", helpers)) || timer >= maxTime;
    }
    if (action === "ulpesFinalThenSushiaShot") {
      return getAliveEnemies(helpers).length <= 0 || timer >= maxTime;
    }
    return timer >= getStepDuration(step, 1);
  }

  function updateSushiaFinalShot(runState, helpers, state, dt) {
    const sushia = getUnitById("sushia", helpers);
    const target = runState.data.target && !runState.data.target.dead
      ? runState.data.target
      : getAliveEnemies(helpers)[0] || null;
    if (!sushia || !target) {
      defeatRemainingEnemies(helpers, sushia);
      return;
    }
    runState.data.target = target;
    lockFinalShotActors(sushia, target, helpers);
    target.actionLock = Math.max(target.actionLock || 0, 0.2);
    target.aiIntent = null;
    target.aiMoveTarget = null;
    if (!runState.data.shotStarted && runState.timer >= 0.45) {
      startSushiaFinalShot(runState, sushia, target, helpers, state);
      return;
    }
    if (runState.data.phase === "casting") {
      runState.data.castLeft = Math.max(0, (runState.data.castLeft || 0) - dt);
      sushia.aimAngle = getAngle(sushia, target);
      if (runState.data.castLeft <= 0) {
        fireSushiaFinalProjectile(runState, sushia, target, helpers, state);
      }
      return;
    }
    if (runState.data.phase === "projectile" && runState.timer >= (runState.data.projectileFallbackAt || 3)) {
      if (!target.dead && typeof helpers.dealDamage === "function") {
        helpers.dealDamage(sushia, target, Math.max(1, (target.hp || 1) + (target.maxHp || 1)), { magic: true, damageType: "magic", noUltGain: true });
      } else if (!target.dead) {
        defeatEnemy(target, sushia, helpers);
      }
      runState.data.phase = "done";
    }
  }

  function startSushiaFinalShot(runState, sushia, target, helpers, state) {
    readyUnitForTutorialAction(sushia);
    clearTutorialStatuses(target);
    lockFinalShotActors(sushia, target, helpers, 3.4);
    setEnemyAliveFloor(state, helpers, 0);
    if (target) {
      target.hp = Math.max(1, Math.min(target.hp || 1, 1));
    }
    if (helpers.skillSystem && typeof helpers.skillSystem.useSushiaBolts === "function") {
      runState.data.shotStarted = true;
      runState.data.phase = "projectile";
      runState.data.projectileFallbackAt = runState.timer + 3.2;
      helpers.skillSystem.useSushiaBolts(sushia, target);
      return;
    }
    const cast = 1;
    runState.data.shotStarted = true;
    runState.data.phase = "casting";
    runState.data.castLeft = cast;
    sushia.actionLock = Math.max(sushia.actionLock || 0, cast + 0.2);
    sushia.actionTotal = Math.max(sushia.actionTotal || 0, cast + 0.2);
    sushia.castVisual = { time: cast, total: cast };
    sushia.aimAngle = getAngle(sushia, target);
    addUnitFloat(sushia, "魔力弾", "#d9afff", helpers);
  }

  function fireSushiaFinalProjectile(runState, sushia, target, helpers, state) {
    runState.data.phase = "projectile";
    runState.data.projectileFallbackAt = runState.timer + 1.8;
    setEnemyAliveFloor(state, helpers, 0);
    sushia.castVisual = null;
    sushia.actionLock = Math.max(sushia.actionLock || 0, 0.2);
    const speed = toBattlePx(helpers, 360);
    const angle = getAngle(sushia, target);
    const distance = getDistance(sushia, target);
    const projectiles = Array.isArray(helpers.projectiles) ? helpers.projectiles : null;
    if (projectiles) {
      projectiles.push({
        x: sushia.x,
        y: sushia.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: toBattlePx(helpers, 6),
        team: "party",
        owner: sushia,
        damage: Math.max(1, (target.hp || 1) + (target.maxHp || 1)),
        getDamage: (hitTarget) => hitTarget === target ? Math.max(1, (hitTarget.hp || 1) + (hitTarget.maxHp || 1)) : 0,
        magic: true,
        dotDamage: false,
        damageType: "magic",
        life: Math.max(0.8, distance / Math.max(1, speed) + 0.45),
        hit: new Set(),
        pierce: false,
        affectsAllies: false,
        color: "#d9afff",
        onHit: (hitTarget) => {
          if (hitTarget === target) {
            runState.data.phase = "done";
          }
        },
      });
      return;
    }
    if (typeof helpers.dealDamage === "function") {
      helpers.dealDamage(sushia, target, Math.max(1, (target.hp || 1) + (target.maxHp || 1)), { magic: true, damageType: "magic", noUltGain: true });
    } else {
      defeatEnemy(target, sushia, helpers);
    }
    runState.data.phase = "done";
  }

  function lockFinalShotActors(sushia, target, helpers = {}, duration = 0.3) {
    for (const unit of getUniqueUnits(helpers)) {
      if (!unit || unit === sushia) {
        continue;
      }
      unit.actionLock = Math.max(unit.actionLock || 0, duration);
      unit.actionTotal = Math.max(unit.actionTotal || 0, unit.actionLock || 0);
      unit.cast = null;
      unit.channel = null;
      unit.aiIntent = null;
      unit.aiMoveTarget = null;
    }
    if (target && !target.dead) {
      target.actionLock = Math.max(target.actionLock || 0, duration);
      target.actionTotal = Math.max(target.actionTotal || 0, target.actionLock || 0);
      target.cast = null;
      target.channel = null;
      target.aiIntent = null;
      target.aiMoveTarget = null;
    }
  }

  function moveUlpesTowardEnemies(runState, step, helpers, dt) {
    const ulpes = getUnitById("ulpes", helpers);
    const target = getAliveEnemies(helpers)[0] || null;
    if (!ulpes || !target) {
      return;
    }
    const distance = getDistance(ulpes, target);
    if (distance <= toBattlePx(helpers, 100)) {
      return;
    }
    const speed = Math.max(toBattlePx(helpers, 120), ulpes.speed || toBattlePx(helpers, 120));
    moveUnitToward(ulpes, target.x, target.y, speed * dt, helpers);
  }

  function positionSushiaForIceWorld(sushia, helpers = {}) {
    if (!sushia) {
      return;
    }
    const enemies = getAliveEnemies(helpers);
    if (!enemies.length) {
      return;
    }
    const center = enemies.reduce((sum, enemy) => ({
      x: sum.x + (enemy.x || 0),
      y: sum.y + (enemy.y || 0),
    }), { x: 0, y: 0 });
    center.x /= enemies.length;
    center.y /= enemies.length;
    const player = helpers.player || null;
    const awayX = player ? center.x - player.x : -1;
    const awayY = player ? center.y - player.y : 0;
    const d = Math.hypot(awayX, awayY) || 1;
    sushia.x = center.x - awayX / d * toBattlePx(helpers, 120);
    sushia.y = center.y - awayY / d * toBattlePx(helpers, 45);
    sushia.battleFacingIntent = { x: awayX / d, y: awayY / d, timer: 0.4 };
    clampUnitToBattle(sushia, helpers);
  }

  function applyTutorialHpRatio(unit, ratio, helpers = {}) {
    if (!unit) {
      return;
    }
    const maxHp = Math.max(1, unit.maxHp || unit.hp || 1);
    const nextHp = Math.max(1, Math.round(maxHp * ratio));
    if (unit.hp <= nextHp) {
      return;
    }
    const before = unit.hp;
    unit.hp = nextHp;
    unit.hurt = Math.max(unit.hurt || 0, 0.25);
    addUnitFloat(unit, `-${Math.max(1, Math.round(before - unit.hp))}`, "#ff4f4f", helpers);
  }

  function getSushiaMood(helpers = {}) {
    const sushia = getUnitById("sushia", helpers);
    return sushia && Number.isFinite(sushia.mood) ? sushia.mood : 50;
  }

  function setSushiaMood(helpers = {}, mood = 50, label = "") {
    const sushia = getUnitById("sushia", helpers);
    if (!sushia || !Number.isFinite(sushia.mood)) {
      return;
    }
    sushia.mood = clampNumber(mood, TUTORIAL_MOOD_MIN, 100);
    if (label) {
      addUnitFloat(sushia, label, sushia.mood >= 100 ? "#ff9f43" : "#9cc6ff", helpers);
    }
  }

  function rampSushiaMood(runState, helpers = {}, targetMood = 50, duration = 1) {
    const sushia = getUnitById("sushia", helpers);
    if (!runState || !sushia || !Number.isFinite(sushia.mood)) {
      return;
    }
    if (!Number.isFinite(runState.data.sushiaMoodStart)) {
      runState.data.sushiaMoodStart = sushia.mood;
    }
    const progress = clampNumber((runState.timer || 0) / Math.max(0.1, duration || 1), 0, 1);
    const start = runState.data.sushiaMoodStart;
    sushia.mood = clampNumber(start + (targetMood - start) * progress, TUTORIAL_MOOD_MIN, 100);
  }

  function beginSushiaMoodDrift(state, helpers = {}, targetMood = 60, duration = 5) {
    const sushia = getUnitById("sushia", helpers);
    if (!state || !sushia || !Number.isFinite(sushia.mood)) {
      return;
    }
    state.sushiaMoodDrift = {
      elapsed: 0,
      duration: Math.max(0.1, duration || 5),
      start: clampNumber(sushia.mood, TUTORIAL_MOOD_MIN, 100),
      target: clampNumber(targetMood, TUTORIAL_MOOD_MIN, 100),
    };
  }

  function updateSushiaMoodDrift(state, helpers = {}, dt = 0) {
    const drift = state && state.sushiaMoodDrift;
    if (!drift || dt <= 0) {
      return;
    }
    const sushia = getUnitById("sushia", helpers);
    if (!sushia || !Number.isFinite(sushia.mood)) {
      state.sushiaMoodDrift = null;
      return;
    }
    drift.elapsed = Math.min(drift.duration, (drift.elapsed || 0) + dt);
    const progress = clampNumber(drift.elapsed / Math.max(0.1, drift.duration), 0, 1);
    sushia.mood = clampNumber(drift.start + (drift.target - drift.start) * progress, TUTORIAL_MOOD_MIN, 100);
    if (progress >= 1) {
      state.sushiaMoodDrift = null;
    }
  }

  function setEnemyAliveFloor(state, helpers = {}, count = 0) {
    if (!state) {
      return;
    }
    state.enemyAliveFloor = Math.max(0, Math.min(getEnemyList(helpers).length, Math.floor(count)));
  }

  function defeatEnemiesUntil(helpers = {}, keepCount = 1, source = null) {
    const alive = getAliveEnemies(helpers);
    const limit = Math.max(0, Math.floor(keepCount));
    while (alive.length > limit) {
      const enemy = alive.shift();
      defeatEnemy(enemy, source, helpers);
    }
    const keep = alive[alive.length - 1] || null;
    if (keep && limit === 1) {
      keep.hp = Math.max(1, Math.min(keep.hp || 1, Math.round((keep.maxHp || 1) * 0.18)));
      addUnitFloat(keep, "残り1体", "#ffffff", helpers);
    }
  }

  function weakenEnemiesUntil(helpers = {}, keepCount = 1, hp = 1) {
    const alive = getAliveEnemies(helpers);
    const limit = Math.max(0, Math.floor(keepCount));
    const targetHp = Math.max(1, Math.floor(hp));
    while (alive.length > limit) {
      const enemy = alive.shift();
      if (enemy && !enemy.dead) {
        enemy.hp = Math.max(1, Math.min(enemy.hp || 1, targetHp));
      }
    }
  }

  function forceEnemiesTarget(target, helpers = {}, duration = 1) {
    if (!target) {
      return;
    }
    for (const enemy of getAliveEnemies(helpers)) {
      enemy.forcedTarget = target;
      enemy.tauntTimer = Math.max(enemy.tauntTimer || 0, duration);
      if (!enemy.cds || typeof enemy.cds !== "object") {
        enemy.cds = {};
      }
      enemy.cds.attack = Math.min(enemy.cds.attack || 0, 0.15);
    }
  }

  function clearEnemyForcedTargets(helpers = {}) {
    for (const enemy of getEnemyList(helpers)) {
      if (!enemy) {
        continue;
      }
      enemy.forcedTarget = null;
      enemy.tauntTimer = 0;
    }
  }

  function getSkillRange(skillKey, helpers = {}, fallback = 0) {
    const skill = findSkill(skillKey, helpers);
    return Number.isFinite(skill && skill.range) ? skill.range : fallback;
  }

  function hasActiveArea(type, helpers = {}) {
    const areas = Array.isArray(helpers.areas) ? helpers.areas : [];
    return areas.some((area) => area && area.type === type && (area.time || 0) > 0);
  }

  function moveUnitToward(unit, x, y, amount, helpers = {}) {
    if (!unit || amount <= 0) {
      return;
    }
    const dx = x - unit.x;
    const dy = y - unit.y;
    const d = Math.hypot(dx, dy);
    if (!d) {
      return;
    }
    const step = Math.min(amount, d);
    unit.x += dx / d * step;
    unit.y += dy / d * step;
    unit.battleFacingIntent = { x: dx / d, y: dy / d, timer: 0.2 };
    clampUnitToBattle(unit, helpers);
  }

  function clampUnitToBattle(unit, helpers = {}) {
    if (!unit || typeof helpers.getBattleBounds !== "function") {
      return;
    }
    const bounds = helpers.getBattleBounds();
    if (!bounds) {
      return;
    }
    const margin = unit.radius || toBattlePx(helpers, 16);
    unit.x = clampNumber(unit.x, bounds.left + margin, bounds.right - margin);
    unit.y = clampNumber(unit.y, bounds.top + margin, bounds.bottom - margin);
  }

  function getStepDuration(step, fallback) {
    return Number.isFinite(step && step.duration) ? step.duration : fallback;
  }

  function getStepMinTime(step, fallback) {
    return Number.isFinite(step && step.minTime) ? step.minTime : fallback;
  }

  function getStepMaxTime(step, fallback) {
    return Number.isFinite(step && step.maxTime) ? step.maxTime : fallback;
  }

  function getDistance(a, b) {
    if (!a || !b) {
      return Infinity;
    }
    return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
  }

  function getAngle(a, b) {
    if (!a || !b) {
      return 0;
    }
    return Math.atan2((b.y || 0) - (a.y || 0), (b.x || 0) - (a.x || 0));
  }

  function toBattlePx(helpers = {}, value) {
    return typeof helpers.battlePx === "function" ? helpers.battlePx(value) : value;
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updatePendingScript(game, helpers, state) {
    const pending = state.pendingScript;
    if (!pending) {
      return false;
    }
    if (pending.action === "sushiaIceWorld") {
      const sushia = getUnitById("sushia", helpers);
      if (sushia && ((sushia.actionLock || 0) > 0 || sushia.cast || sushia.channel)) {
        return false;
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
      state.pendingScript = null;
      state.index += 1;
      prepare(game, helpers);
      return true;
    }
    state.pendingScript = null;
    state.index += 1;
    prepare(game, helpers);
    return true;
  }

  function protectTutorialCombatants(state, helpers = {}) {
    if (!state || !state.active) {
      return;
    }
    for (const unit of getUniqueUnits(helpers)) {
      keepTutorialUnitAlive(unit);
      clampTutorialMood(unit);
    }
    const enemies = getEnemyList(helpers);
    if (!enemies.length) {
      return;
    }
    const floor = Number.isFinite(state.enemyAliveFloor)
      ? Math.max(0, Math.min(enemies.length, Math.floor(state.enemyAliveFloor)))
      : enemies.length;
    if (floor <= 0) {
      return;
    }
    const alive = getAliveEnemies(helpers);
    for (const enemy of alive) {
      keepTutorialUnitAlive(enemy);
    }
    let missing = Math.max(0, floor - alive.length);
    if (missing <= 0) {
      return;
    }
    for (const enemy of enemies) {
      if (missing <= 0) {
        break;
      }
      if (enemy && enemy.dead) {
        keepTutorialUnitAlive(enemy);
        missing -= 1;
      }
    }
  }

  function keepTutorialUnitAlive(unit) {
    if (!unit) {
      return;
    }
    if (unit.dead || !Number.isFinite(unit.hp) || unit.hp <= 0) {
      unit.dead = false;
      unit.hp = 1;
      unit.field = true;
      unit.targetable = true;
      unit.collidable = true;
      unit.defeatedBy = null;
      unit.lootCollected = false;
      unit.actionLock = 0;
      unit.actionTotal = 0;
      unit.cast = null;
      unit.channel = null;
      unit.pendingActionQueueKey = null;
    }
  }

  function clampTutorialMood(unit) {
    if (!unit || unit.team !== "party" || !Number.isFinite(unit.mood)) {
      return;
    }
    unit.mood = Math.max(TUTORIAL_MOOD_MIN, unit.mood);
  }

  function readyUnitForTutorialAction(unit) {
    if (!unit) {
      return;
    }
    unit.actionLock = 0;
    unit.actionTotal = 0;
    unit.cast = null;
    unit.castVisual = null;
    unit.channel = null;
    unit.aiIntent = null;
    unit.aiMoveTarget = null;
    unit.pendingActionQueueKey = null;
  }

  function hasScriptPassed(state, action) {
    const index = STEPS.findIndex((step) => step && step.type === "script" && step.action === action);
    return index >= 0 && state && state.index > index;
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
      readyUnitForTutorialAction(unit);
      if (unit && unit.mood !== null) {
        unit.mood = Math.max(unit.mood || 0, 60);
      }
      setUltimateReady(unit, helpers, 1);
      addUnitFloat(unit, "必殺OK", "#73dfff", helpers);
      return;
    }
    if (action === "sushiaOverconfident") {
      const unit = getUnitById("sushia", helpers);
      if (unit) {
        unit.mood = 100;
        setUltimateReady(unit, helpers, 1);
        addUnitFloat(unit, "調子上昇", "#ff9f43", helpers);
      }
      return;
    }
    if (action === "startSushiaIceWorld") {
      const sushia = getUnitById("sushia", helpers);
      if (sushia) {
        readyUnitForTutorialAction(sushia);
        sushia.mood = 100;
        setUltimateReady(sushia, helpers, 1);
        positionSushiaForIceWorld(sushia, helpers);
        if (typeof helpers.triggerUltimate === "function") {
          helpers.triggerUltimate("sushia", true);
        }
      }
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
      readyUnitForTutorialAction(unit);
      if (unit && unit.mood !== null) {
        unit.mood = Math.max(unit.mood || 0, 60);
      }
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
      return null;
    }
    const keep = alive[alive.length - 1];
    for (const enemy of alive) {
      if (enemy !== keep) {
        defeatEnemy(enemy, getUnitById("sushia", helpers), helpers);
      }
    }
    keep.hp = Math.max(1, Math.min(keep.hp || 1, Math.round((keep.maxHp || 1) * 0.12)));
    return keep;
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
    return getEnemyList(helpers).filter((enemy) => enemy && !enemy.dead);
  }

  function getEnemyList(helpers = {}) {
    return Array.isArray(helpers.enemies) ? helpers.enemies : [];
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
    update,
    getCurrentStep,
    formatStepText,
    getStepSpeaker,
    getUnitById,
    getUnitName,
    getSkillName,
    getUltimateKeyLabel,
  };
})();
