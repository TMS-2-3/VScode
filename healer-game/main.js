(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const TAU = Math.PI * 2;
  const createSkillSystem = window.createHealerSkillSystem;
  const CHARACTER_DEFS = window.HEALER_CHARACTER_DEFS;
  const ENEMY_DEFS = window.HEALER_ENEMY_DEFS;
  const TOWN_DATA = window.HEALER_TOWN_DATA;
  const CONFIG = window.HEALER_CONFIG || {};

  if (!createSkillSystem || !CHARACTER_DEFS || !ENEMY_DEFS || !TOWN_DATA || !CONFIG) {
    throw new Error("config, data files, and skills.js must be loaded before main.js");
  }

  const BATTLE_SPATIAL_SCALE = Number.isFinite(CONFIG.battleSpatialScale) ? CONFIG.battleSpatialScale : 1;

  const view = {
    w: window.innerWidth,
    h: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  };

  const input = {
    mouse: { x: view.w / 2, y: view.h / 2, right: false },
  };

  const game = {
    state: "town",
    time: 0,
    message: "はじまりの町",
    messageTimer: 5,
    hover: null,
    stageClearTimer: 0,
    reinforcementsSpawned: false,
  };

  let party = [];
  let enemies = [];
  let projectiles = [];
  let telegraphs = [];
  let areas = [];
  let effects = [];
  let lastTime = performance.now();
  let expandedStatusUnitIds = new Set();
  let statusUiButtons = [];
  let statusCardMetas = [];
  const TOWN_WIDTH = TOWN_DATA.width;
  const TOWN_HEIGHT = TOWN_DATA.height;
  const BATTLE_SIDE_MARGIN = battlePx(24);
  const BATTLE_MIN_PLAY_HEIGHT = battlePx(320);
  const town = {
    player: { ...TOWN_DATA.player },
    camera: { x: 0, y: 0 },
    buildings: [],
    props: [],
    interaction: null,
    panel: null,
    story: null,
    followers: [],
    introDone: false,
    meetingDone: false,
  };
  const playerProfile = {
    gender: "",
    firstName: "アルジュナ",
    pronoun: "",
    done: false,
    step: "gender",
  };
  let profileNameInput = null;
  let profileClickTargets = [];

  const INTERRUPTED_CAST_COOLDOWN_REDUCTION = 0.8;
  const SELF_HEAL_DELAY = 5;
  const SELF_HEAL_LIMIT = 0.8;
  const SELF_HEAL_MP_PER_SEC = 22;
  const SELF_HEAL_HP_PER_SEC = 14;
  const AI_IDLE_RECHECK = 0.2;
  const ACTION_GAP = 0.2;
  const MOOD_BASELINE = 50;
  const MOOD_INITIAL = 35;
  const MOOD_NATURAL_HP_STEPS = [
    { hp: 0.85, delta: 1 },
    { hp: 0.7, delta: 0.5 },
    { hp: 0.6, delta: 0.2 },
    { hp: 0.5, delta: -0.3 },
    { hp: 0.4, delta: -0.5 },
    { hp: 0.3, delta: -0.8 },
    { hp: 0.2, delta: -1 },
    { hp: 0.1, delta: -1.5 },
  ];
  const MOOD_NATURAL_HP_BOTTOM_DELTA = -3;
  const MOOD_EVENT_MULT = 1.2;
  const MOOD_NO_DAMAGE_GAIN_BONUS_START = 3;
  const MOOD_NO_DAMAGE_GAIN_BONUS_MAX_TIME = 18;
  const MOOD_NO_DAMAGE_GAIN_BONUS_MAX = 1.3;
  const MOOD_HIGH_GAIN_DAMPING_START = 90;
  const MOOD_HIGH_GAIN_DAMPING_MULT = 0.7;
  const MOOD_DISTANCE_BONUS_START = battlePx(200);
  const MOOD_DISTANCE_BONUS_END = battlePx(420);
  const MOOD_DISTANCE_BONUS_MAX = 1.5;
  const MOOD_MULTI_HIT_MIN = 2;
  const MOOD_MULTI_HIT_BASE = 3;
  const MOOD_DAMAGE_DEALT_RATE = 0.035;
  const MOOD_DAMAGE_DEALT_MULT = 0.85;
  const MOOD_KILL_BONUS = 3;
  const MOOD_DAMAGE_TAKEN_RATE = 0.0495;
  const MOOD_HEAL_RATE = 0.1104;
  const MOOD_QUICK_HEAL_BONUS = 2;
  const MOOD_REFERENCE_HP_BY_ID = {
    ulpes: 190,
    rihas: 230,
    sushia: 135,
  };
  const TELEGRAPH_AVOID_MOOD_LIMIT = 80;
  const TELEGRAPH_AVOID_PADDING = battlePx(18);
  const TELEGRAPH_AVOID_SPEED_MULT = 1.15;
  const RIHAS_PASSIVE_MAX_STACKS = 30;
  const RIHAS_PASSIVE_STACK_DURATION = 2;
  const RIHAS_PASSIVE_STACK_COOLDOWN = 0.8;
  const RIHAS_PASSIVE_MAX_DAMAGE_BONUS = 0.15;
  const RIHAS_PASSIVE_MAX_DAMAGE_REDUCTION = 0.15;
  const SUSHIA_PASSIVE_MAX_STACKS = 15;
  const SUSHIA_PASSIVE_STACK_DURATION = 8;
  const SUSHIA_PASSIVE_STACK_COOLDOWN = 1;
  const BASE_CRIT_CHANCE = 0.1;
  const BASE_CRIT_DAMAGE = 1.65;

  const COLORS = {
    floor: "#263129",
    floorLine: "rgba(255,255,255,0.045)",
    player: "#57c7c9",
    ulpes: "#f4c54f",
    rihas: "#e37a3f",
    sushia: "#b985ee",
    enemy: "#c95d4e",
    enemyDark: "#8e453f",
    hp: "#72df82",
    mp: "#73a7ff",
    shield: "#8fe9ff",
    heal: "#5cff7a",
    enemyHeal: "#d86bff",
    mood: "#ffd86b",
    moodHigh: "#ff9f43",
    ult: "#b88cff",
    black: "#111111",
    white: "#ffffff",
  };

  const ULTIMATE_KEYS = {
    ulpes: "1",
    rihas: "2",
    sushia: "3",
    finald: "4",
  };
  const STATUS_FULL_NAMES = {
    ulpes: "ウルペス・トゥルス",
    rihas: "リハス・タイン",
    sushia: "スシア・ストゥード",
  };

  function getOpeningStory() {
    const name = getPlayerFirstName();
    return [
      { speaker: name, text: "今日はついに応募したパーティーの顔合わせか" },
      { speaker: name, text: "あの強力な魔王の討伐を目標に募集されていたんだ" },
      { speaker: name, text: "どんな人達か楽しみだな" },
      { speaker: name, text: "集合場所は依頼所だ、さっそく会いに行こう" },
    ];
  }

  function getMeetingStory() {
    const name = getPlayerFirstName();
    return [
      { speaker: "ウルペス", text: "僕の方が強いに決まってるだろ" },
      { speaker: "リハス", text: "お前みたいなチビの方が強いだぁ？" },
      { speaker: "リハス", text: "見ろよ。この身体を、筋肉を。お前なんか一捻りだ" },
      { speaker: "ウルペス", text: "ふっ、筋肉がすべてなわけないだろ。この筋肉バカめ" },
      { speaker: "スシア", text: "アホとバカ、落ち着きなさいよ。私の方が強いんだから" },
      { speaker: "ウルペス＆リハス", text: "誰がアホ/バカだ！" },
      { speaker: "スシア", text: "４人目、来たわよ。ほんと、呆れる" },
      { speaker: name, text: "(もしかしてずっと喧嘩してた…？)" },
      { speaker: name, text: `えーと、サポートの${getPlayerFirstName()}です。よろしくお願いします…` },
      { speaker: "ウルペス", text: "イケメン剣士のウルペス・トゥルスだ。よろしく頼む" },
      { speaker: "リハス", text: "一番強い、モンクのリハス・タインだ。せいぜい足引っ張んなよ" },
      { speaker: "ウルペス", text: "なっ、僕の方が強いと言っているだろう！" },
      { speaker: "スシア", text: "このバカ２人は気にしなくていいから" },
      { speaker: "スシア", text: "魔法使いのスシアよ。よろしくね" },
      { speaker: "ウルペス", text: "誰がバカだ！このガキ！" },
      { speaker: "リハス", text: "そうだ！俺様が一番強いのは一目瞭然だろう" },
      { speaker: "スシア", text: "じゃあ、４人揃ったことだし、依頼で勝負する？" },
      { speaker: "リハス", text: "いいだろう、俺様の勝ちは見えているがな！ガハハハハ" },
      { speaker: "ウルペス", text: "僕が一番ということを証明してやろう" },
      { speaker: name, text: "(このパーティー…大丈夫かな…)" },
      { text: "依頼を受けましょう！依頼所で受けることができます！" },
    ];
  }

  const player = makeUnit({ ...CHARACTER_DEFS.player, name: getPlayerFirstName() });
  const skillSystem = createSkillSystem(createSkillContext());
  profileNameInput = createProfileNameInput();

  function createSkillContext() {
    return {
      get player() { return player; },
      get party() { return party; },
      get enemies() { return enemies; },
      get projectiles() { return projectiles; },
      get areas() { return areas; },
      get effects() { return effects; },
      canvasCtx: ctx,
      TAU,
      view,
      input,
      game,
      COLORS,
      ACTION_GAP,
      AI_IDLE_RECHECK,
      MOOD_EVENT_MULT,
      MOOD_MULTI_HIT_MIN,
      BATTLE_SPATIAL_SCALE,
      battlePx,
      clamp,
      normalize,
      dist,
      distPoint,
      angleTo,
      deg,
      inFan,
      nearestAlive,
      projectPoint,
      distanceToSegment,
      getMoodCooldown,
      getSushiaCastTime,
      applyMultiHitMoodBonus,
      addMoodGain,
      dealDamage,
      healUnit,
      addTelegraph,
      addBurst,
      addFloat,
      addSpeech,
      slashEffect,
      addShield,
      startPlayerCast,
      getHoveredPartyMember,
      cancelPlayerChannel,
      drawAimRangeCircle,
      getBattleBounds,
      clampBattlePoint,
      getSupportOrigin,
      isFieldUnit,
      getFieldPartyMembers,
      getTargetablePartyMembers,
    };
  }

  function createProfileNameInput() {
    const inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.maxLength = 6;
    inputEl.value = playerProfile.firstName;
    inputEl.className = "profile-name-input";
    inputEl.setAttribute("aria-label", "主人公の名前");
    document.body.appendChild(inputEl);
    inputEl.addEventListener("input", () => {
      playerProfile.firstName = clampProfileName(inputEl.value);
      if (inputEl.value !== playerProfile.firstName) {
        inputEl.value = playerProfile.firstName;
      }
    });
    inputEl.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        confirmProfileName();
      }
    });
    return inputEl;
  }

  function setMouseFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = event.clientX - rect.left;
    input.mouse.y = event.clientY - rect.top;
  }

  function getPlayerFirstName() {
    return playerProfile.firstName || "アルジュナ";
  }

  function clampProfileName(value) {
    return Array.from((value || "").trim()).slice(0, 6).join("");
  }

  function handleProfileSetupKey(key) {
    if (playerProfile.step === "gender") {
      if (key === "1") selectProfileGender("男の子");
      else if (key === "2") selectProfileGender("女の子");
    } else if (playerProfile.step === "name") {
      if (["e", "space", "enter"].includes(key)) {
        confirmProfileName();
      }
    } else if (playerProfile.step === "pronoun") {
      const index = Number(key) - 1;
      const choices = getPronounChoices();
      if (choices[index]) {
        selectProfilePronoun(choices[index]);
      }
    }
  }

  function handleProfileSetupClick(x, y) {
    for (const target of profileClickTargets) {
      if (x >= target.x && x <= target.x + target.w && y >= target.y && y <= target.y + target.h) {
        target.action();
        return;
      }
    }
  }

  function selectProfileGender(gender) {
    playerProfile.gender = gender;
    town.player.color = gender === "女の子" ? "#ff93c8" : COLORS.player;
    player.color = town.player.color;
    playerProfile.step = "name";
    updateProfileNameInput();
  }

  function confirmProfileName() {
    playerProfile.firstName = clampProfileName(profileNameInput ? profileNameInput.value : playerProfile.firstName) || "アルジュナ";
    if (profileNameInput) {
      profileNameInput.value = playerProfile.firstName;
    }
    playerProfile.step = "pronoun";
    updateProfileNameInput();
  }

  function selectProfilePronoun(pronoun) {
    playerProfile.pronoun = pronoun;
    completeProfileSetup();
  }

  function completeProfileSetup() {
    playerProfile.done = true;
    player.name = getPlayerFirstName();
    updateProfileNameInput();
    beginOpeningStory();
  }

  function beginOpeningStory() {
    if (town.introDone || town.story || !playerProfile.done) {
      return;
    }
    startTownStory("opening", getOpeningStory(), () => {
      town.introDone = true;
      game.message = "集合場所: 依頼所";
      game.messageTimer = 5;
    });
  }

  function getPronounChoices() {
    return ["俺", "僕", "我", "私", "うち", "あたし"];
  }

  function updateProfileNameInput() {
    if (!profileNameInput) {
      return;
    }
    const visible = game.state === "town" && !playerProfile.done && playerProfile.step === "name";
    profileNameInput.hidden = !visible;
    if (!visible) {
      return;
    }
    const rect = getProfileNameInputRect();
    profileNameInput.style.width = `${rect.w}px`;
    profileNameInput.style.left = `${rect.x}px`;
    profileNameInput.style.top = `${rect.y}px`;
    if (document.activeElement !== profileNameInput) {
      profileNameInput.focus();
      profileNameInput.select();
    }
  }

  function getProfileNameInputRect() {
    const w = Math.max(120, Math.min(220, view.w - 190));
    return {
      x: view.w / 2 - w / 2 - 58,
      y: Math.max(138, view.h * 0.5 - 14),
      w,
      h: 46,
    };
  }

  function resize() {
    view.w = window.innerWidth;
    view.h = window.innerHeight;
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(view.w * view.dpr);
    canvas.height = Math.floor(view.h * view.dpr);
    canvas.style.width = `${view.w}px`;
    canvas.style.height = `${view.h}px`;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    if (game.state === "town") {
      clampTownPlayer();
      updateTownCamera();
    } else {
      clampAllUnits();
    }
    updateProfileNameInput();
  }

  window.addEventListener("resize", resize);
  resize();
  startTown();
  requestAnimationFrame(loop);

  window.addEventListener("keydown", (event) => {
    const key = event.key === " " ? "space" : event.key.toLowerCase();

    if (["f", "g", "r", "e", "enter", "escape", "space", "1", "2", "3", "4"].includes(key)) {
      event.preventDefault();
    }
    if (event.repeat) {
      return;
    }

    if (game.state === "town") {
      if (!playerProfile.done) {
        handleProfileSetupKey(key);
        return;
      }
      if (town.story) {
        if (["e", "space", "enter"].includes(key)) {
          advanceTownStory();
        }
        return;
      }
      if (town.panel && town.panel.action === "battleGuide" && ["e", "space", "enter"].includes(key)) {
        interactTown();
        return;
      }
      if (key === "e") {
        interactTown();
      } else if (key === "escape") {
        closeTownPanel();
      }
      return;
    }

    if (game.state !== "playing") {
      if (key === "r") {
        startTown();
      }
      return;
    }

    if (key === "f") {
      startPlayerAim("heal");
    } else if (key === "g" || key === "space") {
      startPlayerAim("shield");
    } else if (key === "escape") {
      cancelPlayerAim();
    } else if (key === "1") {
      triggerUltimate("ulpes");
    } else if (key === "2") {
      triggerUltimate("rihas");
    } else if (key === "3") {
      triggerUltimate("sushia");
    } else if (key === "4") {
      triggerUltimate("finald");
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    setMouseFromEvent(event);
  });

  canvas.addEventListener("mousedown", (event) => {
    event.preventDefault();
    setMouseFromEvent(event);
    if (game.state === "town") {
      if (!playerProfile.done) {
        handleProfileSetupClick(input.mouse.x, input.mouse.y);
        return;
      }
      if (town.story && event.button === 0) {
        advanceTownStory();
        return;
      }
      if (town.panel && town.panel.action === "battleGuide" && event.button === 0) {
        interactTown();
        return;
      }
      if (event.button === 0) {
        interactTown();
      }
      return;
    }
    if (game.state !== "playing") {
      return;
    }
    if (event.button === 0) {
      if (handleStatusUiClick(input.mouse.x, input.mouse.y)) {
        return;
      }
      if (player.aim) {
        confirmPlayerAim();
      } else {
        startPlayerAim("attack");
      }
    }
    if (event.button === 2) {
      input.mouse.right = true;
      if (player.aim) {
        cancelPlayerAim();
      }
    }
  });

  canvas.addEventListener("mouseup", (event) => {
    if (event.button === 2) {
      input.mouse.right = false;
    }
  });

  canvas.addEventListener("mouseleave", () => {
    input.mouse.right = false;
  });

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function resetGame() {
    projectiles = [];
    telegraphs = [];
    areas = [];
    effects = [];
    expandedStatusUnitIds.clear();
    game.state = "playing";
    game.time = 0;
    game.stageClearTimer = 0;
    game.reinforcementsSpawned = false;
    game.message = "依頼: 魔物を全滅させる";
    game.messageTimer = 4;

    const bounds = getBattleBounds();
    const supportOrigin = getSupportOrigin();
    const cx = bounds.left + bounds.width * 0.33;
    const cy = bounds.centerY;

    Object.assign(player, {
      x: supportOrigin.x,
      y: supportOrigin.y,
      hp: player.maxHp,
      mp: player.maxMp,
      shield: 0,
      shieldTimer: 0,
      ult: 0,
      dead: false,
      cds: {},
      channel: null,
      actionLock: 0,
      actionTotal: 0,
      hurt: 0,
      guardFlash: 0,
      noDamage: 999,
      cast: null,
      aim: null,
      selfHealFloat: 0,
      delayedDamageQueue: [],
      field: false,
      targetable: false,
      collidable: false,
    });

    const ulpes = makePartyMember("ulpes");
    const rihas = makePartyMember("rihas");
    const sushia = makePartyMember("sushia");

    Object.assign(ulpes, { x: cx + battlePx(28), y: cy - battlePx(72) });
    Object.assign(rihas, { x: cx + battlePx(62), y: cy + battlePx(55) });
    Object.assign(sushia, { x: cx - battlePx(28), y: cy - battlePx(6) });
    party = [player, ulpes, rihas, sushia];

    const startX = Math.min(bounds.right - battlePx(120), bounds.left + bounds.width * 0.72);
    const startY = bounds.centerY;
    const enemySpread = Math.min(battlePx(150), bounds.height * 0.32);
    enemies = [
      makeEnemy("魔物A", startX, startY - enemySpread, "brute"),
      makeEnemy("魔物B", startX + battlePx(72), startY - enemySpread * 0.53, "skirmisher"),
      makeEnemy("魔物C", startX + battlePx(18), startY + battlePx(5), "brute"),
      makeEnemy("魔物D", startX + battlePx(92), startY + enemySpread * 0.59, "skirmisher"),
      makeEnemy("射手A", startX + battlePx(205), startY - enemySpread * 0.64, "caster"),
      makeEnemy("射手B", startX + battlePx(220), startY + enemySpread * 0.53, "caster"),
      makeEnemy("大魔物", startX + battlePx(150), startY + battlePx(4), "elite"),
    ];

    clampAllUnits();
  }

  function makeUnit(options) {
    return {
      id: options.id,
      name: options.name,
      label: options.label || "?",
      team: options.team,
      role: options.role,
      x: options.x || 0,
      y: options.y || 0,
      radius: options.radius || battlePx(14),
      color: options.color || "#ffffff",
      maxHp: options.maxHp || 100,
      hp: options.maxHp || 100,
      moodBaseHp: options.moodBaseHp || MOOD_REFERENCE_HP_BY_ID[options.id] || options.maxHp || 100,
      maxMp: options.maxMp || 0,
      mp: options.maxMp || 0,
      speed: options.speed || battlePx(100),
      attack: options.attack || 10,
      magic: options.magic || 10,
      defense: options.defense || 0,
      magicDefense: options.magicDefense || 0,
      guardChance: options.guardChance || 0,
      preferredRange: options.preferredRange || 90,
      mood: options.team === "party" && options.id !== "finald" ? MOOD_INITIAL : null,
      ult: 0,
      shield: 0,
      shieldTimer: 0,
      cds: {},
      actionLock: 0,
      actionTotal: 0,
      aiTick: 0,
      hurt: 0,
      guardFlash: 0,
      frozen: 0,
      frozenMax: 0,
      dead: false,
      noDamage: 999,
      channel: null,
      cast: null,
      aim: null,
      selfHealFloat: 0,
      delayedDamageQueue: [],
      rihasPassiveStacks: 0,
      rihasPassiveTimer: 0,
      rihasPassiveStackCooldown: 0,
      castStacks: 0,
      stackTimer: 0,
      stackCooldown: 0,
      forcedTarget: null,
      tauntTimer: 0,
      aimAngle: 0,
      field: options.field !== false,
      targetable: options.targetable !== false,
      collidable: options.collidable !== false,
    };
  }

  function makePartyMember(id) {
    const def = CHARACTER_DEFS.allies.find((member) => member.id === id);
    if (!def) {
      throw new Error(`Unknown party member: ${id}`);
    }
    return makeUnit({ ...def });
  }

  function makeEnemy(name, x, y, kind) {
    const stats = ENEMY_DEFS[kind];
    if (!stats) {
      throw new Error(`Unknown enemy kind: ${kind}`);
    }

    const enemy = makeUnit({
      id: `${kind}-${Math.random().toString(16).slice(2)}`,
      name,
      label: stats.label,
      team: "enemy",
      role: kind,
      color: stats.color,
      radius: stats.radius,
      maxHp: stats.hp,
      maxMp: 0,
      speed: stats.speed,
      attack: stats.attack,
      defense: stats.defense,
      magicDefense: stats.magicDefense,
      magic: 0,
    });
    enemy.x = x;
    enemy.y = y;
    enemy.cds.attack = Math.random() * getActionCooldown(enemy);
    if (kind === "caster") {
      const casterLine = skillSystem.requireSkill("enemy", "casterLine");
      enemy.cds.skill = casterLine.cdBase + Math.random() * casterLine.cdRandom;
    } else if (kind === "elite") {
      enemy.cds.skill = skillSystem.requireSkill("enemy", "heavySlam").cd;
    } else {
      enemy.cds.skill = 0;
    }
    return enemy;
  }

  function spawnRearVanguardWave() {
    const bounds = getBattleBounds();
    const spawnX = bounds.left + battlePx(34);
    const centerY = bounds.centerY;
    const spread = Math.min(battlePx(92), bounds.height * 0.24);
    const wave = [
      makeEnemy("小魔物A", spawnX, centerY - spread, "smallVanguard"),
      makeEnemy("小魔物B", spawnX - battlePx(8), centerY, "smallVanguard"),
      makeEnemy("小魔物C", spawnX, centerY + spread, "smallVanguard"),
    ];

    for (const enemy of wave) {
      const point = clampBattlePoint(enemy.x, enemy.y, enemy.radius);
      enemy.x = point.x;
      enemy.y = point.y;
      enemy.cds.attack = 0.35 + Math.random() * 0.7;
      enemies.push(enemy);
      addBurst(enemy.x, enemy.y, enemy.radius * 3.2, "rgba(230,151,99,0.28)");
    }

    addFloat("増援!", spawnX + battlePx(46), centerY - spread - battlePx(28), COLORS.enemy);
    game.reinforcementsSpawned = true;
    game.message = "後方から増援!";
    game.messageTimer = 4;
  }


  function startTown() {
    projectiles = [];
    telegraphs = [];
    areas = [];
    effects = [];
    enemies = [];
    game.state = "town";
    game.time = 0;
    game.hover = null;
    game.stageClearTimer = 0;
    game.reinforcementsSpawned = false;
    game.message = "はじまりの町";
    game.messageTimer = 4;
    town.panel = null;
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
    resetTownFollowers();
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

  function updateTown(dt) {
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

  function resetTownFollowers() {
    const spacing = 42;
    town.followers = [
      { id: "ulpes", label: "ウ", color: COLORS.ulpes, x: town.player.x, y: town.player.y + spacing },
      { id: "rihas", label: "リ", color: COLORS.rihas, x: town.player.x, y: town.player.y + spacing * 2 },
      { id: "sushia", label: "ス", color: COLORS.sushia, x: town.player.x, y: town.player.y + spacing * 3 },
    ];
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

  function isNearTownBuilding(id, range) {
    return town.interaction && town.interaction.id === id;
  }

  function interactTown() {
    if (town.story) {
      return;
    }
    if (town.panel) {
      if (town.panel.action === "quest") {
        showBattleGuidePanel();
      } else if (town.panel.action === "battleGuide") {
        resetGame();
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
      town.panel = {
        title: "依頼所",
        lines: ["依頼: 町外れの魔物討伐", "報酬や難易度選択はあとで追加する。"],
        action: "quest",
      };
    }
  }

  function handleStatusUiClick(x, y) {
    for (let i = statusUiButtons.length - 1; i >= 0; i -= 1) {
      const button = statusUiButtons[i];
      if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
        if (button.action === "close") {
          expandedStatusUnitIds.delete(button.unitId);
        } else if (button.action === "toggle") {
          if (expandedStatusUnitIds.has(button.unitId)) {
            expandedStatusUnitIds.delete(button.unitId);
          } else {
            expandedStatusUnitIds.add(button.unitId);
          }
        }
        return true;
      }
    }
    return false;
  }

  function showBattleGuidePanel() {
    town.panel = {
      title: "出発前の確認",
      action: "battleGuide",
      sections: [
        {
          title: `${getPlayerFirstName()}の技`,
          lines: [
            "共通: 構え中は左クリックで発動、右クリックでキャンセル。",
            "援護射撃: 左クリックで構え、指定地点の狭い範囲へ魔法攻撃。",
            "ヒール: Fで構え、カーソル上の味方を回復。対象がいないと発動しない。",
            "バリア: GまたはSpaceで構え、指定範囲の味方にシールドを付与。重なったシールドは耐久値が加算される。",
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
            "少し調子に乗っている時が、一番パフォーマンスを出しやすい。",
            "調子が上がると攻撃力や詠唱が強くなるが、上がりすぎると慢心してガードや攻撃が雑になったり、必殺技を勝手に使ったりする。",
            "逆にHPが削られすぎると調子が下がり、萎縮して弱くなる。",
          ],
        },
        {
          title: "操作",
          lines: [
            "主人公は戦場に出ず、後方から味方を支援する。",
            "左クリック: 援護射撃の構え、または構え中スキルの発動 / 右クリック: 構えキャンセル",
            "F: ヒール / G・Space: バリア / 1-4: 必殺技 / 勝利条件: 敵全滅",
          ],
        },
      ],
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
      resetTownFollowers();
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

  function update(dt) {
    game.time += dt;
    if (game.messageTimer > 0) {
      game.messageTimer -= dt;
    }

    updateEffects(dt);
    if (game.state === "town") {
      updateTown(dt);
      return;
    }
    if (game.state !== "playing") {
      return;
    }

    game.hover = getHoveredPartyMember();
    updateCooldownsAndTimers(dt);
    updatePlayer(dt);
    updatePartyAi(dt);
    updateEnemyAi(dt);
    updateProjectiles(dt);
    updateTelegraphs(dt);
    updateAreas(dt);
    separateUnits(dt);
    checkBattleState();
  }

  function updateCooldownsAndTimers(dt) {
    for (const unit of [...party, ...enemies]) {
      if (unit.dead) {
        continue;
      }

      unit.noDamage += dt;
      if (unit.actionLock > 0 && (!unit.actionTotal || unit.actionTotal < unit.actionLock)) {
        unit.actionTotal = unit.actionLock;
      }
      unit.actionLock = Math.max(0, unit.actionLock - dt);
      if (unit.actionLock <= 0) {
        unit.actionTotal = 0;
      }
      unit.hurt = Math.max(0, unit.hurt - dt);
      unit.guardFlash = Math.max(0, unit.guardFlash - dt);
      unit.frozen = Math.max(0, unit.frozen - dt);
      if (unit.frozen <= 0) {
        unit.frozenMax = 0;
      }
      unit.stackCooldown = Math.max(0, unit.stackCooldown - dt);
      updateDelayedDamage(unit, dt);
      updateRihasPassiveStacks(unit, dt);

      if (unit.stackTimer > 0) {
        unit.stackTimer -= dt;
        if (unit.stackTimer <= 0) {
          unit.castStacks = 0;
        }
      }

      if (unit.tauntTimer > 0) {
        unit.tauntTimer -= dt;
        if (unit.tauntTimer <= 0) {
          unit.forcedTarget = null;
        }
      }

      if (unit.shieldTimer > 0) {
        unit.shieldTimer -= dt;
        if (unit.shieldTimer <= 0) {
          unit.shield = 0;
        }
      }

      for (const key of Object.keys(unit.cds)) {
        unit.cds[key] = Math.max(0, unit.cds[key] - dt);
      }

      if (unit.team === "party") {
        unit.ult = clamp(unit.ult + dt * 1.2, 0, 100);
      }

      if (unit.team === "party" && unit.id !== "finald") {
        const naturalDelta = getMoodNaturalDelta(unit) * dt;
        const adjustedDelta = naturalDelta > 0 ? applyMoodHighGainDamping(unit, naturalDelta) : naturalDelta;
        unit.mood = clamp(unit.mood + adjustedDelta, 0, 100);
      }
    }
  }

  function updatePlayer(dt) {
    if (player.dead) {
      return;
    }

    const supportOrigin = getSupportOrigin();
    player.x = supportOrigin.x;
    player.y = supportOrigin.y;

    if (player.cast) {
      player.cast.time -= dt;
      if (player.cast.time <= 0) {
        finishPlayerCast();
      }
    }

    const regen = 13;
    player.mp = clamp(player.mp + regen * dt, 0, player.maxMp);
    updateSelfHeal(dt);

    skillSystem.updatePlayerChannel(dt);

  }

  function updateSelfHeal(dt) {
    const limit = player.maxHp * SELF_HEAL_LIMIT;
    player.selfHealing = false;
    if (player.noDamage < SELF_HEAL_DELAY || player.hp >= limit || player.mp <= 0 || player.dead) {
      return;
    }

    const mpSpend = Math.min(player.mp, SELF_HEAL_MP_PER_SEC * dt);
    const healAmount = Math.min(SELF_HEAL_HP_PER_SEC * dt, limit - player.hp);
    if (mpSpend <= 0 || healAmount <= 0) {
      return;
    }

    player.mp -= mpSpend;
    player.hp = clamp(player.hp + healAmount, 0, limit);
    player.selfHealing = true;
    player.selfHealFloat += dt;
    if (player.selfHealFloat >= 0.8) {
      player.selfHealFloat = 0;
      addFloat("自己治療", player.x, player.y - 34, "#bdfcff");
    }
  }

  function startPlayerCast(type, data, castTime) {
    if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) {
      return false;
    }
    player.aim = null;
    player.cast = { type, time: castTime, total: castTime, ...data };
    player.actionLock = castTime;
    return true;
  }

  function finishPlayerCast() {
    const cast = player.cast;
    player.cast = null;
    if (!cast) {
      return;
    }
    if (player.dead || player.frozen > 0) {
      applyInterruptedPlayerCastCooldown(cast);
      return;
    }

    skillSystem.completePlayerCast(cast);

    player.actionLock = Math.max(player.actionLock, ACTION_GAP);
  }

  function updatePartyAi(dt) {
    for (const member of party) {
      if (member === player || member.dead || member.frozen > 0) {
        continue;
      }

      member.aiTick -= dt;
      const avoidingTelegraph = member.actionLock <= 0 && updatePartyMovement(member, dt);
      if (!avoidingTelegraph && member.actionLock <= 0 && member.ult >= 100 && member.mood >= 95) {
        if (triggerUltimate(member.id, true)) {
          setActionCooldown(member);
        }
        continue;
      }

      if (member.aiTick > 0 || member.actionLock > 0 || (member.cds.attack || 0) > 0) {
        continue;
      }

      if (!avoidingTelegraph && member.mood >= 85 && member.ult >= 100 && Math.random() < 0.16) {
        if (triggerUltimate(member.id, true)) {
          setActionCooldown(member);
        }
        continue;
      }

      if (member.id === "ulpes") {
        thinkUlpes(member, avoidingTelegraph);
      } else if (member.id === "rihas") {
        thinkRihas(member, avoidingTelegraph);
      } else if (member.id === "sushia") {
        thinkSushia(member, avoidingTelegraph);
      }
    }
  }

  function updatePartyMovement(unit, dt) {
    const target = nearestAlive(unit, enemies);
    if (!target) {
      return false;
    }
    const d = dist(unit, target);
    const avoidDir = getTelegraphAvoidance(unit);
    const moodSpeed = 1 + Math.max(0, unit.mood - MOOD_BASELINE) * 0.003;
    if (avoidDir) {
      unit.x += avoidDir.x * unit.speed * moodSpeed * TELEGRAPH_AVOID_SPEED_MULT * dt;
      unit.y += avoidDir.y * unit.speed * moodSpeed * TELEGRAPH_AVOID_SPEED_MULT * dt;
      clampUnit(unit);
      return true;
    }

    const desired = unit.preferredRange * (unit.mood > 80 ? 0.62 : 1);
    let dir = { x: 0, y: 0 };
    if (d > desired + battlePx(18)) {
      dir = normalize(target.x - unit.x, target.y - unit.y);
    } else if (d < desired - battlePx(12)) {
      dir = normalize(unit.x - target.x, unit.y - target.y);
    }

    unit.x += dir.x * unit.speed * moodSpeed * dt;
    unit.y += dir.y * unit.speed * moodSpeed * dt;
    clampUnit(unit);
    return false;
  }

  function getTelegraphAvoidance(unit) {
    if (!unit || unit.mood === null || unit.mood > TELEGRAPH_AVOID_MOOD_LIMIT || unit.actionLock > 0 || unit.cast || unit.channel) {
      return null;
    }

    let x = 0;
    let y = 0;
    for (const telegraph of telegraphs) {
      if (telegraph.team !== "enemy") {
        continue;
      }
      updateTelegraphDynamic(telegraph);
      const escape = getTelegraphEscapeVector(unit, telegraph);
      if (!escape) {
        continue;
      }
      x += escape.x * escape.weight;
      y += escape.y * escape.weight;
    }

    const dir = normalize(x, y);
    return dir.len > 0 ? dir : null;
  }

  function getTelegraphEscapeVector(unit, telegraph) {
    if (telegraph.type === "circle") {
      return getCircleTelegraphEscape(unit, telegraph);
    }
    if (telegraph.type === "line") {
      return getLineTelegraphEscape(unit, telegraph);
    }
    if (telegraph.type === "fan") {
      return getFanTelegraphEscape(unit, telegraph);
    }
    return null;
  }

  function getCircleTelegraphEscape(unit, telegraph) {
    const dangerRadius = telegraph.radius + unit.radius + TELEGRAPH_AVOID_PADDING;
    const d = distPoint(unit.x, unit.y, telegraph.x, telegraph.y);
    if (d > dangerRadius) {
      return null;
    }
    const dir = d === 0 ? { x: 1, y: 0 } : normalize(unit.x - telegraph.x, unit.y - telegraph.y);
    return { x: dir.x, y: dir.y, weight: getTelegraphAvoidWeight(telegraph, dangerRadius, d) };
  }

  function getLineTelegraphEscape(unit, telegraph) {
    const closest = closestPointOnSegment(unit.x, unit.y, telegraph.x, telegraph.y, telegraph.x2, telegraph.y2);
    const dangerWidth = (telegraph.width || battlePx(24)) * 0.5 + unit.radius + TELEGRAPH_AVOID_PADDING;
    const d = distPoint(unit.x, unit.y, closest.x, closest.y);
    if (d > dangerWidth) {
      return null;
    }
    const dir = d === 0 ? getLinePerpendicular(telegraph) : normalize(unit.x - closest.x, unit.y - closest.y);
    return { x: dir.x, y: dir.y, weight: getTelegraphAvoidWeight(telegraph, dangerWidth, d) };
  }

  function getFanTelegraphEscape(unit, telegraph) {
    const dangerRadius = telegraph.radius + unit.radius + TELEGRAPH_AVOID_PADDING;
    const d = distPoint(unit.x, unit.y, telegraph.x, telegraph.y);
    if (d > dangerRadius) {
      return null;
    }
    const angle = Math.atan2(unit.y - telegraph.y, unit.x - telegraph.x);
    if (Math.abs(angleDiff(angle, telegraph.angle)) > telegraph.arc / 2) {
      return null;
    }
    const dir = d === 0 ? { x: Math.cos(telegraph.angle), y: Math.sin(telegraph.angle) } : normalize(unit.x - telegraph.x, unit.y - telegraph.y);
    return { x: dir.x, y: dir.y, weight: getTelegraphAvoidWeight(telegraph, dangerRadius, d) };
  }

  function getTelegraphAvoidWeight(telegraph, dangerSize, distance) {
    const urgency = telegraph.total ? 1 - clamp(telegraph.time / telegraph.total, 0, 1) : 0;
    return 1 + clamp((dangerSize - distance) / dangerSize, 0, 1) + urgency * 0.5;
  }

  function closestPointOnSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) {
      return { x: x1, y: y1 };
    }
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
    return { x: x1 + t * dx, y: y1 + t * dy };
  }

  function getLinePerpendicular(telegraph) {
    const dx = telegraph.x2 - telegraph.x;
    const dy = telegraph.y2 - telegraph.y;
    const dir = normalize(-dy, dx);
    return dir.len > 0 ? dir : { x: 1, y: 0 };
  }

  function updateEnemyAi(dt) {
    for (const enemy of enemies) {
      if (enemy.dead || enemy.frozen > 0) {
        continue;
      }

      const target = enemy.forcedTarget && !enemy.forcedTarget.dead
        ? enemy.forcedTarget
        : nearestAlive(enemy, getTargetablePartyMembers());
      if (!target) {
        continue;
      }

      const d = dist(enemy, target);
      const preferred = enemy.role === "caster" ? battlePx(330) : battlePx(36);
      const dir = normalize(target.x - enemy.x, target.y - enemy.y);
      if (enemy.actionLock <= 0 && d > preferred + battlePx(10)) {
        enemy.x += dir.x * enemy.speed * dt;
        enemy.y += dir.y * enemy.speed * dt;
      } else if (enemy.actionLock <= 0 && d < preferred - battlePx(20) && enemy.role === "caster") {
        enemy.x -= dir.x * enemy.speed * 0.65 * dt;
        enemy.y -= dir.y * enemy.speed * 0.65 * dt;
      }
      clampUnit(enemy);

      if (enemy.actionLock > 0 || (enemy.cds.attack || 0) > 0) {
        continue;
      }

      thinkEnemy(enemy, target, d);
    }
  }

  function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const shot = projectiles[i];
      shot.life -= dt;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;

      if (
        shot.life <= 0 ||
        shot.x < -battlePx(60) ||
        shot.y < -battlePx(60) ||
        shot.x > view.w + battlePx(60) ||
        shot.y > view.h + battlePx(60)
      ) {
        projectiles.splice(i, 1);
        continue;
      }

      const candidates = shot.team === "party"
        ? (shot.affectsAllies ? [...enemies, ...getFieldPartyMembers()] : enemies)
        : getFieldPartyMembers();
      for (const unit of candidates) {
        if (unit.dead || unit === shot.owner) {
          continue;
        }
        if (shot.hit.has(unit)) {
          continue;
        }
        if (distPoint(unit.x, unit.y, shot.x, shot.y) <= unit.radius + shot.radius) {
          shot.hit.add(unit);
          if (shot.healAllies && unit.team === shot.owner.team) {
            healUnit(shot.owner, unit, shot.heal ?? shot.damage, { noMood: unit === player });
          } else {
            dealDamage(shot.owner, unit, shot.damage, { magic: shot.magic });
          }
          if (!shot.pierce) {
            projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  function updateTelegraphs(dt) {
    for (let i = telegraphs.length - 1; i >= 0; i -= 1) {
      const telegraph = telegraphs[i];
      updateTelegraphDynamic(telegraph);
      telegraph.time -= dt;
      if (telegraph.time <= 0) {
        updateTelegraphDynamic(telegraph);
        telegraph.resolve();
        telegraphs.splice(i, 1);
      }
    }
  }

  function updateTelegraphDynamic(telegraph) {
    if (telegraph.getPosition) {
      const position = telegraph.getPosition();
      telegraph.x = position.x;
      telegraph.y = position.y;
    }
    if (telegraph.getLine) {
      const line = telegraph.getLine();
      telegraph.x = line.x;
      telegraph.y = line.y;
      telegraph.x2 = line.x2;
      telegraph.y2 = line.y2;
    }
    if (telegraph.getAngle) {
      telegraph.angle = telegraph.getAngle();
    }
  }

  function updateAreas(dt) {
    for (let i = areas.length - 1; i >= 0; i -= 1) {
      const area = areas[i];
      area.time -= dt;
      area.tick -= dt;
      if (area.tick <= 0) {
        area.tick = area.tickRate;
        area.apply();
      }
      if (area.time <= 0) {
        areas.splice(i, 1);
      }
    }
  }

  function updateEffects(dt) {
    for (let i = effects.length - 1; i >= 0; i -= 1) {
      const effect = effects[i];
      effect.time -= dt;
      effect.age += dt;
      if (effect.vy) {
        effect.y += effect.vy * dt;
      }
      if (effect.time <= 0) {
        effects.splice(i, 1);
      }
    }
  }

  function thinkUlpes(unit, avoidingTelegraph = false) {
    return skillSystem.thinkUlpes(unit, avoidingTelegraph);
  }

  function thinkRihas(unit, avoidingTelegraph = false) {
    return skillSystem.thinkRihas(unit, avoidingTelegraph);
  }

  function thinkSushia(unit, avoidingTelegraph = false) {
    return skillSystem.thinkSushia(unit, avoidingTelegraph);
  }

  function thinkEnemy(enemy, target, distance) {
    return skillSystem.thinkEnemy(enemy, target, distance);
  }

  function getActionCooldown(unit) {
    return skillSystem.getActionCooldown(unit);
  }

  function setActionCooldown(unit) {
    return skillSystem.setActionCooldown(unit);
  }
  function moodLerp(mood, leftMood, leftValue, rightMood, rightValue) {
    const ratio = clamp((mood - leftMood) / (rightMood - leftMood), 0, 1);
    return leftValue + (rightValue - leftValue) * ratio;
  }

  function getMoodNaturalDelta(unit) {
    if (!unit || unit.mood === null || unit.maxHp <= 0) {
      return 0;
    }

    const hpRatio = clamp(unit.hp / unit.maxHp, 0, 1);
    for (const step of MOOD_NATURAL_HP_STEPS) {
      if (hpRatio >= step.hp) {
        return step.delta;
      }
    }
    return MOOD_NATURAL_HP_BOTTOM_DELTA;
  }

  function getMoodGainMultiplier(unit) {
    if (!unit || unit.mood === null) return 1;
    if (unit.noDamage <= MOOD_NO_DAMAGE_GAIN_BONUS_START) return 1;
    return moodLerp(unit.noDamage, MOOD_NO_DAMAGE_GAIN_BONUS_START, 1, MOOD_NO_DAMAGE_GAIN_BONUS_MAX_TIME, MOOD_NO_DAMAGE_GAIN_BONUS_MAX);
  }

  function applyMoodHighGainDamping(unit, amount) {
    if (!unit || unit.mood === null || amount <= 0) {
      return amount;
    }
    if (unit.mood >= MOOD_HIGH_GAIN_DAMPING_START) {
      return amount * MOOD_HIGH_GAIN_DAMPING_MULT;
    }

    const normalRoom = MOOD_HIGH_GAIN_DAMPING_START - unit.mood;
    if (amount <= normalRoom) {
      return amount;
    }
    return normalRoom + (amount - normalRoom) * MOOD_HIGH_GAIN_DAMPING_MULT;
  }

  function getHpRatio(amount, unit) {
    if (!unit || unit.maxHp <= 0 || amount <= 0) {
      return 0;
    }
    return Math.max(0, amount / unit.maxHp);
  }

  function getMoodReferenceHp(unit) {
    return Math.max(1, unit && (unit.moodBaseHp || unit.maxHp) || 1);
  }

  function addMoodGain(unit, amount) {
    if (!unit || unit.mood === null || amount <= 0) {
      return 0;
    }
    const adjusted = applyMoodHighGainDamping(unit, amount * getMoodGainMultiplier(unit));
    const before = unit.mood;
    unit.mood = clamp(unit.mood + adjusted, 0, 100);
    return unit.mood - before;
  }
  function getMoodDistanceMultiplier(source, target) {
    if (!source || !target) return 1;
    const hitDistance = dist(source, target);
    if (hitDistance <= MOOD_DISTANCE_BONUS_START) return 1;
    return moodLerp(hitDistance, MOOD_DISTANCE_BONUS_START, 1, MOOD_DISTANCE_BONUS_END, MOOD_DISTANCE_BONUS_MAX);
  }

  function applyMultiHitMoodBonus(unit, enemyHits) {
    if (!unit || unit.mood === null || enemyHits < MOOD_MULTI_HIT_MIN) {
      return;
    }
    const bonus = MOOD_MULTI_HIT_BASE + enemyHits;
    addMoodGain(unit, bonus);
  }

  function getMoodOutgoingDamageMultiplier(unit) {
    if (!unit || unit.mood === null) return 1;
    if (unit.mood <= 50) return moodLerp(unit.mood, 0, 0.5, 50, 1);
    if (unit.mood <= 70) return moodLerp(unit.mood, 50, 1, 70, 1.3);
    return moodLerp(unit.mood, 70, 1.3, 100, 0.8);
  }

  function getMoodIncomingDamageMultiplier(unit) {
    if (!unit || unit.mood === null || unit.mood <= 70) return 1;
    return moodLerp(unit.mood, 70, 1, 100, 1.2);
  }

  function getMoodGuardChance(unit) {
    if (!unit || unit.mood === null) return unit ? unit.guardChance : 0;
    if (unit.mood >= 93) return 0;

    let delta = 0;
    if (unit.mood <= 50) {
      delta = moodLerp(unit.mood, 0, -0.5, 50, 0);
    } else if (unit.mood <= 70) {
      delta = moodLerp(unit.mood, 50, 0, 70, 0.15);
    } else if (unit.mood <= 92) {
      delta = moodLerp(unit.mood, 70, 0.15, 92, -0.15);
    } else {
      delta = -0.15;
    }
    return clamp(unit.guardChance + delta, 0, 1);
  }

  function getMoodCooldownMultiplier(unit) {
    if (!unit || unit.mood === null || unit.mood >= 50) return 1;
    if (unit.mood >= 40) return moodLerp(unit.mood, 50, 1, 40, 1.05);
    return moodLerp(unit.mood, 40, 1.05, 0, 1.8);
  }

  function getMoodCooldown(unit, baseTime) {
    return baseTime * getMoodCooldownMultiplier(unit);
  }

  function getMoodCastTimeMultiplier(unit) {
    if (!unit || unit.mood === null) return 1;
    if (unit.mood <= 50) return moodLerp(unit.mood, 0, 1.3, 50, 1);
    if (unit.mood <= 70) return moodLerp(unit.mood, 50, 1, 70, 0.8);
    return moodLerp(unit.mood, 70, 0.8, 100, 1);
  }

  function getSushiaCastTime(baseTime, unit) {
    const stackMultiplier = 1 - unit.castStacks * 0.05;
    return Math.max(baseTime * 0.25, baseTime * stackMultiplier * getMoodCastTimeMultiplier(unit));
  }

  function speakSkill(unit, skillKey) {
    return skillSystem.speakSkill(unit, skillKey);
  }

  function useUlpesNormal(unit, target) {
    return skillSystem.useUlpesNormal(unit, target);
  }

  function useUlpesHeroSlash(unit, target) {
    return skillSystem.useUlpesHeroSlash(unit, target);
  }

  function useRihasNormal(unit) {
    return skillSystem.useRihasNormal(unit);
  }

  function useRihasJump(unit, target) {
    return skillSystem.useRihasJump(unit, target);
  }

  function useSushiaBolts(unit, target) {
    return skillSystem.useSushiaBolts(unit, target);
  }

  function useSushiaBomb(unit, target) {
    return skillSystem.useSushiaBomb(unit, target);
  }


  function startPlayerAim(type) {
    return skillSystem.startPlayerAim(type);
  }

  function cancelPlayerAim() {
    return skillSystem.cancelPlayerAim();
  }

  function confirmPlayerAim() {
    return skillSystem.confirmPlayerAim();
  }

  function firePlayerShot() {
    return skillSystem.firePlayerShot();
  }

  function completePlayerShot(lockedDir) {
    return skillSystem.completePlayerShot(lockedDir);
  }

  function castHeal() {
    return skillSystem.castHeal();
  }

  function completeHeal(target) {
    return skillSystem.completeHeal(target);
  }

  function castShield() {
    return skillSystem.castShield();
  }

  function completeShield(x, y) {
    return skillSystem.completeShield(x, y);
  }

  function addShield(unit, amount, duration) {
    if (!unit || amount <= 0 || duration <= 0) {
      return;
    }
    unit.shield = clamp(unit.shield + amount, 0, unit.maxHp);
    unit.shieldTimer = Math.max(unit.shieldTimer, duration);
  }

  function triggerUltimate(id, automatic = false) {
    return skillSystem.triggerUltimate(id, automatic);
  }

  function ultUlpes(unit, automatic) {
    return skillSystem.ultUlpes(unit, automatic);
  }

  function ultRihas(unit) {
    return skillSystem.ultRihas(unit);
  }

  function ultSushia(unit, automatic) {
    return skillSystem.ultSushia(unit, automatic);
  }

  function ultFinald() {
    return skillSystem.ultFinald();
  }

  function enemyBite(enemy, target) {
    return skillSystem.enemyBite(enemy, target);
  }

  function enemyLineAttack(enemy, target) {
    return skillSystem.enemyLineAttack(enemy, target);
  }

  function enemyHeavySlam(enemy, target) {
    return skillSystem.enemyHeavySlam(enemy, target);
  }
  function dealDamage(source, target, amount, options = {}) {
    if (!target || target.dead) {
      return 0;
    }

    const wasTargetAlive = target.hp > 0;
    let finalAmount = amount;
    if (source && source.team === "party" && source.id !== "finald" && source.mood !== null) {
      finalAmount *= getMoodOutgoingDamageMultiplier(source);
      if (source.id === "rihas") {
        finalAmount *= getRihasPassiveDamageMultiplier(source);
      }
      if (options.crit && Math.random() < BASE_CRIT_CHANCE) {
        finalAmount *= BASE_CRIT_DAMAGE;
        addFloat("CRIT", target.x, target.y - 36, "#fff1a0");
      }
    }

    if (target.team === "party" && target.id !== "finald" && target.mood !== null) {
      finalAmount *= getMoodIncomingDamageMultiplier(target);
    }

    if (source && source.team === "enemy" && target.id === "rihas" && source.forcedTarget === target && source.tauntTimer > 0) {
      finalAmount *= 0.6;
    }

    if (target.id === "rihas") {
      finalAmount *= getRihasPassiveIncomingMultiplier(target);
    }

    finalAmount = reduceByDefense(target, finalAmount, options.magic);

    if (target.team === "party" && target.id !== "finald") {
      const guarded = tryGuard(target);
      if (guarded) {
        finalAmount *= 0.48;
      }
    }

    const damageFloatColor = getDamageFloatColor(source, target);
    let shielded = 0;
    if (target.shield > 0) {
      shielded = Math.min(target.shield, finalAmount);
      target.shield -= shielded;
      finalAmount -= shielded;
      if (target.shield <= 0) {
        target.shield = 0;
        target.shieldTimer = 0;
      }
      if (shielded > 0) {
        addFloat(`${Math.round(shielded)}`, target.x, target.y - 26, damageFloatColor);
      }
    }

    finalAmount = Math.max(0, finalAmount);
    let delayedAmount = 0;
    if (target.id === "rihas" && finalAmount > 0 && !options.delayed) {
      addRihasPassiveStack(target);
      delayedAmount = finalAmount / 3;
      finalAmount -= delayedAmount;
      target.delayedDamageQueue.push({
        timer: 1,
        ticks: 5,
        amount: delayedAmount / 5,
        color: damageFloatColor,
      });
    }

    if (finalAmount > 0) {
      target.hp = Math.max(0, target.hp - finalAmount);
      target.hurt = 0.22;
      target.noDamage = 0;
      addFloat(`${Math.round(finalAmount)}`, target.x, target.y - 24, damageFloatColor);
      if (target === player && player.channel) {
        cancelPlayerChannel();
      }
      if (target === player && player.cast) {
        cancelPlayerCast();
      }
    } else if (delayedAmount > 0) {
      target.noDamage = 0;
    }

    const rewardDamage = finalAmount + delayedAmount;
    if (source && source.team === "party") {
      source.ult = clamp(source.ult + rewardDamage * 0.22, 0, 100);
      if (source.id === "sushia" && target.team === "enemy" && rewardDamage > 0 && options.magic && source.stackCooldown <= 0) {
        source.castStacks = clamp(source.castStacks + 1, 0, SUSHIA_PASSIVE_MAX_STACKS);
        source.stackTimer = SUSHIA_PASSIVE_STACK_DURATION;
        source.stackCooldown = SUSHIA_PASSIVE_STACK_COOLDOWN;
      }
      if (source.mood !== null && target.team === "enemy") {
        const distanceMult = getMoodDistanceMultiplier(source, target);
        const damageRatio = getHpRatio(rewardDamage, target);
        const referenceDamage = damageRatio * getMoodReferenceHp(target);
        addMoodGain(source, referenceDamage * MOOD_DAMAGE_DEALT_RATE * MOOD_DAMAGE_DEALT_MULT * MOOD_EVENT_MULT * distanceMult);
      }
    }

    if (target.team === "party" && target.id !== "finald") {
      target.ult = clamp(target.ult + rewardDamage * 0.16, 0, 100);
      const damageRatio = getHpRatio(rewardDamage, target);
      const referenceDamage = damageRatio * getMoodReferenceHp(target);
      target.mood = clamp(target.mood - referenceDamage * MOOD_DAMAGE_TAKEN_RATE * MOOD_EVENT_MULT, 0, 100);
    }

    if (target.hp <= 0) {
      if (wasTargetAlive && target.team === "enemy" && source && source.team === "party" && source.mood !== null) {
        addMoodGain(source, MOOD_KILL_BONUS);
      }
      target.dead = true;
      target.hp = 0;
      addBurst(target.x, target.y, target.radius * 2.2, "rgba(255,255,255,0.2)");
    }
    return rewardDamage + shielded;
  }

  function healUnit(source, target, amount, options = {}) {
    if (!target || target.dead) {
      return 0;
    }
    const before = target.hp;
    target.hp = clamp(target.hp + amount, 0, target.maxHp);
    const healed = target.hp - before;
    const healFloatColor = getHealFloatColor(target);
    if (healed <= 0) {
      addFloat("+0", target.x, target.y - 28, healFloatColor);
      return 0;
    }

    addFloat(`+${Math.round(healed)}`, target.x, target.y - 28, healFloatColor);
    target.hurt = 0;
    if (source && source.team === "party") {
      source.ult = clamp(source.ult + healed * 0.22, 0, 100);
    }
    if (!options.noMood && target.team === "party" && target.id !== "finald") {
      const quickBonus = target.noDamage < 3 ? MOOD_QUICK_HEAL_BONUS : 0;
      const healRatio = getHpRatio(healed, target);
      const referenceHeal = healRatio * getMoodReferenceHp(target);
      addMoodGain(target, referenceHeal * MOOD_HEAL_RATE * MOOD_EVENT_MULT + quickBonus);
    }
    return healed;
  }

  function reduceByDefense(target, amount, isMagic) {
    const defense = isMagic ? target.magicDefense : getEffectiveDefense(target);
    return amount * (100 / (100 + Math.max(0, defense)));
  }

  function getDamageFloatColor(source, target) {
    if (target.team === "party") {
      return "#ff4f4f";
    }
    if (source && source.team === "party" && target.team === "enemy") {
      return "#ffffff";
    }
    return "#ffffff";
  }

  function getHealFloatColor(target) {
    return target && target.team === "enemy" ? COLORS.enemyHeal : COLORS.heal;
  }

  function getEffectiveDefense(unit) {
    return unit.defense;
  }

  function addRihasPassiveStack(unit) {
    if (!unit || unit.id !== "rihas") {
      return;
    }
    if ((unit.rihasPassiveStackCooldown || 0) > 0) {
      return;
    }
    const before = unit.rihasPassiveStacks || 0;
    unit.rihasPassiveStacks = clamp(before + 1, 0, RIHAS_PASSIVE_MAX_STACKS);
    unit.rihasPassiveTimer = RIHAS_PASSIVE_STACK_DURATION;
    unit.rihasPassiveStackCooldown = RIHAS_PASSIVE_STACK_COOLDOWN;
  }

  function updateRihasPassiveStacks(unit, dt) {
    if (!unit || unit.id !== "rihas") {
      return;
    }
    unit.rihasPassiveStackCooldown = Math.max(0, (unit.rihasPassiveStackCooldown || 0) - dt);
    if ((unit.rihasPassiveStacks || 0) <= 0) {
      return;
    }
    unit.rihasPassiveTimer -= dt;
    if (unit.rihasPassiveTimer <= 0) {
      unit.rihasPassiveStacks = 0;
      unit.rihasPassiveTimer = 0;
      unit.rihasPassiveStackCooldown = 0;
    }
  }

  function getRihasPassiveRatio(unit) {
    if (!unit || unit.id !== "rihas") {
      return 0;
    }
    return clamp((unit.rihasPassiveStacks || 0) / RIHAS_PASSIVE_MAX_STACKS, 0, 1);
  }

  function getRihasPassiveDamageMultiplier(unit) {
    return 1 + getRihasPassiveRatio(unit) * RIHAS_PASSIVE_MAX_DAMAGE_BONUS;
  }

  function getRihasPassiveIncomingMultiplier(unit) {
    return 1 - getRihasPassiveRatio(unit) * RIHAS_PASSIVE_MAX_DAMAGE_REDUCTION;
  }

  function updateDelayedDamage(unit, dt) {
    if (!unit.delayedDamageQueue || unit.delayedDamageQueue.length === 0 || unit.dead) {
      return;
    }

    for (let i = unit.delayedDamageQueue.length - 1; i >= 0; i -= 1) {
      const entry = unit.delayedDamageQueue[i];
      entry.timer -= dt;
      while (entry.timer <= 0 && entry.ticks > 0 && !unit.dead) {
        applyDelayedDamage(unit, entry.amount, entry.color);
        entry.ticks -= 1;
        entry.timer += 1;
      }
      if (entry.ticks <= 0 || unit.dead) {
        unit.delayedDamageQueue.splice(i, 1);
      }
    }
  }

  function applyDelayedDamage(unit, amount, color = "#ff4f4f") {
    const damage = Math.max(0, amount);
    if (damage <= 0 || unit.dead) {
      return;
    }
    const before = unit.hp;
    unit.hp = Math.max(0, unit.hp - damage);
    const actualDamage = before - unit.hp;
    if (unit.id === "rihas" && actualDamage > 0) {
      addRihasPassiveStack(unit);
    }
    unit.hurt = 0.18;
    addFloat(`${Math.round(damage)}`, unit.x, unit.y - 24, color);
    if (unit.hp <= 0) {
      unit.dead = true;
      unit.hp = 0;
      addBurst(unit.x, unit.y, unit.radius * 2.2, "rgba(255,255,255,0.2)");
    }
  }

  function tryGuard(unit) {
    if (unit.frozen > 0 || unit.actionLock > 0) {
      return false;
    }
    const chance = getMoodGuardChance(unit);
    if (chance <= 0) {
      return false;
    }
    if (Math.random() < chance) {
      unit.guardFlash = 0.28;
      unit.actionLock = ACTION_GAP;
      return true;
    }
    return false;
  }

  function checkBattleState() {
    if (getFieldPartyMembers().some((member) => member.dead)) {
      game.state = "lost";
      game.message = "戦闘不能者が出た";
      game.messageTimer = 999;
      return;
    }
    if (enemies.every((enemy) => enemy.dead)) {
      if (!game.reinforcementsSpawned) {
        spawnRearVanguardWave();
        return;
      }
      game.stageClearTimer += 1 / 60;
      game.state = "won";
      game.message = "依頼達成";
      game.messageTimer = 999;
    }
  }

  function getHoveredPartyMember() {
    let best = null;
    let bestDist = Infinity;
    for (const member of getFieldPartyMembers()) {
      if (member.dead) {
        continue;
      }
      const d = distPoint(input.mouse.x, input.mouse.y, member.x, member.y);
      if (d <= member.radius + battlePx(8) && d < bestDist) {
        best = member;
        bestDist = d;
      }
    }
    return best;
  }

  function isFieldUnit(unit) {
    return Boolean(unit && unit.field !== false);
  }

  function isTargetableUnit(unit) {
    return isFieldUnit(unit) && unit.targetable !== false && !unit.dead;
  }

  function getFieldPartyMembers() {
    return party.filter(isFieldUnit);
  }

  function getTargetablePartyMembers() {
    return party.filter(isTargetableUnit);
  }

  function getSupportOrigin(target = null) {
    const bounds = getBattleBounds();
    const fallbackY = bounds.bottom - battlePx(42);
    const y = target && Number.isFinite(target.y)
      ? clamp(target.y, bounds.top + battlePx(28), bounds.bottom - battlePx(28))
      : fallbackY;
    return { x: bounds.left - battlePx(36), y };
  }

  function addTelegraph(data) {
    data.total = data.total || data.time || 1;
    telegraphs.push(data);
  }

  function addBurst(x, y, radius, color) {
    effects.push({ type: "burst", x, y, radius, color, time: 0.35, age: 0 });
  }

  function addSpeech(text, unit) {
    if (!text || !unit) {
      return;
    }
    effects.push({ type: "speech", text, source: unit, time: 1.25, total: 1.25, age: 0 });
  }
  function addFloat(text, x, y, color, outline = "#0b0d0b") {
    effects.push({ type: "float", text, x, y, color, outline, time: 0.85, age: 0, vy: -28 });
  }

  function slashEffect(from, to) {
    effects.push({
      type: "beam",
      x: from.x,
      y: from.y,
      x2: to.x,
      y2: to.y,
      color: "rgba(244,197,79,0.75)",
      time: 0.16,
      age: 0,
    });
  }

  function cancelPlayerChannel() {
    player.channel = null;
    const origin = getSupportOrigin();
    addFloat("中断", origin.x + 28, origin.y - 32, "#ffffff");
  }

  function cancelPlayerCast() {
    const cast = player.cast;
    player.cast = null;
    applyInterruptedPlayerCastCooldown(cast);
    player.actionLock = Math.max(player.actionLock, ACTION_GAP);
    const origin = getSupportOrigin();
    addFloat("詠唱中断", origin.x + 28, origin.y - 32, "#ffffff");
  }

  function applyInterruptedPlayerCastCooldown(cast) {
    const cooldown = getPlayerCastCooldown(cast && cast.type);
    if (!cooldown) {
      return;
    }
    player.cds[cooldown.key] = cooldown.max * (1 - INTERRUPTED_CAST_COOLDOWN_REDUCTION);
  }

  function getPlayerCastCooldown(type) {
    return skillSystem.getPlayerCastCooldown(type);
  }

  function draw() {
    ctx.clearRect(0, 0, view.w, view.h);
    if (game.state === "town") {
      drawTown();
      drawEffects();
      if (!playerProfile.done) {
        drawProfileSetup();
      } else {
        drawTownStoryDialogue();
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
    drawHud();
    drawResultOverlay();
  }

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
    ctx.fillStyle = "rgba(0,0,0,0.22)";
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
    ctx.fillStyle = "#d4e4d5";
    const target = town.interaction ? `${town.interaction.name}をクリックで利用` : "施設をクリックして利用";
    ctx.fillText(target, 34, 73);
  }

  function drawTownPanel() {
    if (!town.panel) {
      return;
    }
    if (town.panel.action === "battleGuide") {
      drawBattleGuidePanel();
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
    ctx.fillText(town.panel.action === "quest" ? "E  出発" : "E  閉じる", x + w - 24, y + h - 24);
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
    profileClickTargets = [];
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
    return skillSystem.drawPlayerAimPreview();
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
    if (!player || player.dead) {
      return;
    }

    const bounds = getBattleBounds();
    const radius = player.radius || battlePx(15);
    const x = clamp(bounds.left + battlePx(240), bounds.left + radius + battlePx(8), bounds.right - radius - battlePx(8));
    const groundY = clamp(bounds.centerY + battlePx(22), bounds.top + battlePx(72), bounds.bottom - battlePx(34));
    const bob = Math.sin(game.time * 2.3) * battlePx(6);
    const y = groundY - battlePx(170) + bob;
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


  function lerpColor(from, to, ratio) {
    const t = clamp(ratio, 0, 1);
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    return `rgb(${r},${g},${b})`;
  }

  function getMoodColor(mood) {
    const value = clamp(mood, 0, 100);
    const white = [255, 255, 255];
    const yellow = [255, 216, 107];
    const orange = [255, 159, 67];
    const red = [255, 79, 79];
    if (value <= 50) {
      return lerpColor(white, yellow, value / 50);
    }
    if (value <= 70) {
      return lerpColor(yellow, orange, (value - 50) / 20);
    }
    return lerpColor(orange, red, (value - 70) / 30);
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
    const anchorX = source.x;
    const anchorY = source.y - (source.radius || battlePx(14)) - battlePx(20);

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

  function drawHud() {
    drawAllyStatusCards();
    drawArjunaHud();
  }

  function drawAllyStatusCards() {
    statusUiButtons = [];
    statusCardMetas = [];
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
      drawCommandBiasMeter(barX, commandY, barW, 8, unit.commandBias || 0);
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
      { label: "ガード率", value: formatPercent(getMoodGuardChance(unit)) },
      { label: "移動速度", value: `${Math.round(unit.speed)}` },
    ];
  }

  function getUnitOutgoingDamageMultiplier(unit) {
    let multiplier = getMoodOutgoingDamageMultiplier(unit);
    if (unit.id === "rihas") {
      multiplier *= getRihasPassiveDamageMultiplier(unit);
    }
    return multiplier;
  }

  function getUnitIncomingDamageMultiplier(unit) {
    let multiplier = getMoodIncomingDamageMultiplier(unit);
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

  function drawCommandBiasMeter(x, y, w, h, value) {
    const labelW = 22;
    const gap = 3;
    const segmentW = Math.max(8, (w - labelW * 2 - gap * 4) / 5);
    const startX = x + labelW;
    const active = clamp(Math.round(value) + 2, 0, 4);

    ctx.save();
    ctx.font = "800 9px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#b7c7bd";
    ctx.fillText("防", x + labelW / 2 - 2, y + h / 2);
    ctx.fillText("攻", x + w - labelW / 2 + 2, y + h / 2);
    for (let i = 0; i < 5; i += 1) {
      const sx = startX + i * (segmentW + gap);
      const isActive = i === active;
      ctx.fillStyle = isActive ? (i < 2 ? "#8fe9ff" : i > 2 ? "#ffb15e" : "#d4e4d5") : "rgba(255,255,255,0.11)";
      roundRect(sx, y, segmentW, h, 3);
      ctx.fill();
      if (isActive) {
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
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
    const skillW = w - 32;
    if (skillW > 220) {
      drawSkillPanel(skillX, y + 10, skillW, h - 20);
    }
  }

  function drawArjunaStats(x, y, w, h) {
    const compact = h < 92;
    const iconAreaW = clamp(w * 0.34, compact ? 56 : 74, compact ? 76 : 96);
    const iconCenterX = x + iconAreaW / 2;
    const labelBottom = compact ? 33 : 38;
    const portraitSize = Math.min(compact ? 52 : 78, iconAreaW, Math.max(28, h - labelBottom - 2));
    const portraitX = iconCenterX - portraitSize / 2;
    const portraitY = y + h - portraitSize;
    const barX = x + iconAreaW + 10;
    const barW = Math.max(0, w - iconAreaW - 10);
    const barH = compact ? 6 : 8;
    const ultRadius = compact ? 17 : 20;
    const ultX = x + w - ultRadius;
    const ultY = y + ultRadius + (compact ? 2 : 4);

    drawFittedText(getStatusDisplayName(player), iconCenterX, y + (compact ? 14 : 16), iconAreaW + 10, 800, compact ? 12 : 14, 9, "#f7fff6", "center");
    drawFittedText(getRoleLabel(player), iconCenterX, y + (compact ? 29 : 33), iconAreaW + 10, 700, compact ? 10 : 11, 8, "#cfe0d2", "center");
    drawCharacterUiPortrait(player, portraitX, portraitY, portraitSize);

    drawCircleGauge(ultX, ultY, ultRadius, player.ult / 100, "rgba(0,0,0,0.45)", "#73dfff");
    ctx.fillStyle = "rgba(10,13,12,0.84)";
    ctx.beginPath();
    ctx.arc(ultX, ultY, Math.max(7, ultRadius - 6), 0, TAU);
    ctx.fill();
    ctx.fillStyle = player.ult >= 100 ? "#101814" : "#f7fff6";
    ctx.font = "800 11px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("4", ultX, ultY + 0.5);
    ctx.textBaseline = "alphabetic";

    const firstBarY = y + (compact ? clamp(h * 0.52, 44, 52) : clamp(h * 0.54, 58, 72));
    const lastBarY = y + h - barH;
    const barGap = Math.max(14, lastBarY - firstBarY - (compact ? 5 : 7));
    drawLabeledBar("HP", barX, firstBarY, barW, barH, player.hp / player.maxHp, "#132115", COLORS.hp, {
      text: `${Math.ceil(player.hp)}/${player.maxHp}${player.shield > 0 ? ` +${Math.ceil(player.shield)}` : ""}`,
      shieldRatio: player.maxHp > 0 ? player.shield / player.maxHp : 0,
    });
    drawLabeledBar("MP", barX, firstBarY + barGap, barW, Math.max(6, barH - 1), player.mp / player.maxMp, "#131b2a", COLORS.mp, {
      text: `${Math.ceil(player.mp)}/${player.maxMp}`,
    });
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
    const inputLabels = ["左クリック", "F", "G", "R"];
    const gap = 10;
    const itemW = (w - 32 - gap * 3) / 4;
    const itemY = y + 8;
    const itemH = h - 16;
    const nameY = y + Math.max(26, h * 0.33);
    const barY = y + Math.max(44, h * 0.58);
    const cdY = y + Math.min(h - 11, Math.max(62, h * 0.82));
    for (let i = 0; i < skills.length; i += 1) {
      const sx = x + 16 + i * (itemW + gap);
      const skill = skills[i];
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRect(sx, itemY, itemW, itemH, 8);
      ctx.fill();
      drawSkillInputBadge(inputLabels[i], sx + 8, itemY + 7, itemW - 16);
      ctx.fillStyle = "#eff9ef";
      ctx.font = `700 ${itemW < 82 ? 10 : 12}px 'Segoe UI', 'Yu Gothic UI', sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(skill.name, sx + itemW / 2, nameY);
      const ratio = skill.gauge ? player.ult / 100 : 1 - clamp(skill.cd / skill.max, 0, 1);
      drawBar(sx + 12, barY, itemW - 24, 7, ratio, "rgba(0,0,0,0.35)", skill.gauge ? COLORS.ult : COLORS.mp);
      if (skill.cd > 0 && !skill.gauge) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 13px 'Segoe UI', sans-serif";
        ctx.fillText(skill.cd.toFixed(1), sx + itemW / 2, cdY);
      }
    }
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


  function clampTownPlayer() {
    town.player.x = clamp(town.player.x, town.player.radius, TOWN_WIDTH - town.player.radius);
    town.player.y = clamp(town.player.y, town.player.radius, TOWN_HEIGHT - town.player.radius);
  }

  function separateUnits(dt) {
    const all = [...party, ...enemies].filter((unit) => !unit.dead && isFieldUnit(unit) && unit.collidable !== false);
    for (let i = 0; i < all.length; i += 1) {
      for (let j = i + 1; j < all.length; j += 1) {
        const a = all[i];
        const b = all[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const min = a.radius + b.radius + 4;
        if (d < min) {
          const push = (min - d) * 0.5;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push * dt * 18;
          a.y -= ny * push * dt * 18;
          b.x += nx * push * dt * 18;
          b.y += ny * push * dt * 18;
          clampUnit(a);
          clampUnit(b);
        }
      }
    }
  }

  function nearestAlive(from, list) {
    let best = null;
    let bestDist = Infinity;
    for (const unit of list) {
      if (unit.dead || (unit.team === "party" && !isTargetableUnit(unit))) {
        continue;
      }
      const d = dist(from, unit);
      if (d < bestDist) {
        best = unit;
        bestDist = d;
      }
    }
    return best;
  }

  function clampAllUnits() {
    for (const unit of [...party, ...enemies]) {
      if (isFieldUnit(unit)) {
        clampUnit(unit);
      }
    }
  }

  function getBattleBounds() {
    let top = clamp(view.h * 0.22, 136, 176);
    let bottomBand = clamp(view.h * 0.22, 136, 184);
    const shortage = BATTLE_MIN_PLAY_HEIGHT - (view.h - top - bottomBand);
    if (shortage > 0) {
      top = Math.max(64, top - shortage * 0.45);
      bottomBand = Math.max(76, bottomBand - shortage * 0.55);
    }
    const bottom = view.h - bottomBand;
    const side = getBattleSideMargin();
    return {
      left: side,
      right: view.w - side,
      top,
      bottom,
      width: Math.max(0, view.w - side * 2),
      height: Math.max(0, bottom - top),
      centerY: (top + bottom) / 2,
    };
  }

  function getBattleSideMargin() {
    return Math.round((view.w * (1 - BATTLE_SPATIAL_SCALE)) / 2 + BATTLE_SIDE_MARGIN);
  }

  function clampBattlePoint(x, y, margin = 0) {
    const bounds = getBattleBounds();
    return {
      x: clamp(x, bounds.left + margin, bounds.right - margin),
      y: clamp(y, bounds.top + margin, bounds.bottom - margin),
    };
  }

  function clampUnit(unit) {
    if (!isFieldUnit(unit)) return;
    const point = clampBattlePoint(unit.x, unit.y, unit.radius);
    unit.x = point.x;
    unit.y = point.y;
  }

  function normalize(x, y) {
    const len = Math.hypot(x, y);
    if (len === 0) {
      return { x: 0, y: 0, len: 0 };
    }
    return { x: x / len, y: y / len, len };
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function distPoint(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
  }

  function angleTo(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  function angleDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return d;
  }

  function inFan(unit, x, y, radius, angle, arc) {
    const d = distPoint(unit.x, unit.y, x, y);
    if (d > radius + unit.radius) {
      return false;
    }
    const a = Math.atan2(unit.y - y, unit.x - x);
    return Math.abs(angleDiff(a, angle)) <= arc / 2;
  }

  function projectPoint(from, to, length) {
    const angle = angleTo(from, to);
    return {
      x: from.x + Math.cos(angle) * length,
      y: from.y + Math.sin(angle) * length,
    };
  }

  function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) {
      return distPoint(px, py, x1, y1);
    }
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
    return distPoint(px, py, x1 + t * dx, y1 + t * dy);
  }

  function deg(value) {
    return (value * Math.PI) / 180;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function battlePx(value) {
    return Math.max(1, Math.round(value * BATTLE_SPATIAL_SCALE));
  }
})();
