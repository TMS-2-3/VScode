(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const TAU = Math.PI * 2;
  const createSkillSystem = window.createHealerSkillSystem;
  const CHARACTER_DEFS = window.HEALER_CHARACTER_DEFS;
  const ENEMY_DEFS = window.HEALER_ENEMY_DEFS;
  const TOWN_DATA = window.HEALER_TOWN_DATA;

  if (!createSkillSystem || !CHARACTER_DEFS || !ENEMY_DEFS || !TOWN_DATA) {
    throw new Error("data files and skills.js must be loaded before main.js");
  }

  const view = {
    w: window.innerWidth,
    h: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  };

  const input = {
    keys: Object.create(null),
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
  const TOWN_WIDTH = TOWN_DATA.width;
  const TOWN_HEIGHT = TOWN_DATA.height;
  const BATTLE_SIDE_MARGIN = 24;
  const BATTLE_MIN_PLAY_HEIGHT = 320;
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
  const MOOD_DISTANCE_BONUS_START = 200;
  const MOOD_DISTANCE_BONUS_END = 420;
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
  const TELEGRAPH_AVOID_PADDING = 18;
  const TELEGRAPH_AVOID_SPEED_MULT = 1.15;

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
    input.keys[key] = true;

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

  window.addEventListener("keyup", (event) => {
    input.keys[event.key === " " ? "space" : event.key.toLowerCase()] = false;
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
      }
      return;
    }
    if (game.state !== "playing") {
      return;
    }
    if (event.button === 0) {
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
    game.state = "playing";
    game.time = 0;
    game.stageClearTimer = 0;
    game.reinforcementsSpawned = false;
    game.message = "依頼: 魔物を全滅させる";
    game.messageTimer = 4;

    const bounds = getBattleBounds();
    const supportOrigin = getSupportOrigin();
    const cx = view.w * 0.33;
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

    Object.assign(ulpes, { x: cx + 28, y: cy - 72 });
    Object.assign(rihas, { x: cx + 62, y: cy + 55 });
    Object.assign(sushia, { x: cx - 28, y: cy - 6 });
    party = [player, ulpes, rihas, sushia];

    const startX = Math.min(view.w - 120, view.w * 0.72);
    const startY = bounds.centerY;
    const enemySpread = Math.min(150, bounds.height * 0.32);
    enemies = [
      makeEnemy("魔物A", startX, startY - enemySpread, "brute"),
      makeEnemy("魔物B", startX + 72, startY - enemySpread * 0.53, "skirmisher"),
      makeEnemy("魔物C", startX + 18, startY + 5, "brute"),
      makeEnemy("魔物D", startX + 92, startY + enemySpread * 0.59, "skirmisher"),
      makeEnemy("射手A", startX + 205, startY - enemySpread * 0.64, "caster"),
      makeEnemy("射手B", startX + 220, startY + enemySpread * 0.53, "caster"),
      makeEnemy("大魔物", startX + 150, startY + 4, "elite"),
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
      radius: options.radius || 14,
      color: options.color || "#ffffff",
      maxHp: options.maxHp || 100,
      hp: options.maxHp || 100,
      moodBaseHp: options.moodBaseHp || MOOD_REFERENCE_HP_BY_ID[options.id] || options.maxHp || 100,
      maxMp: options.maxMp || 0,
      mp: options.maxMp || 0,
      speed: options.speed || 100,
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
      aiTick: 0,
      hurt: 0,
      guardFlash: 0,
      frozen: 0,
      dead: false,
      noDamage: 999,
      channel: null,
      cast: null,
      aim: null,
      selfHealFloat: 0,
      delayedDamageQueue: [],
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
    const spawnX = bounds.left + 34;
    const centerY = bounds.centerY;
    const spread = Math.min(92, bounds.height * 0.24);
    const wave = [
      makeEnemy("小魔物A", spawnX, centerY - spread, "smallVanguard"),
      makeEnemy("小魔物B", spawnX - 8, centerY, "smallVanguard"),
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

    addFloat("増援!", spawnX + 46, centerY - spread - 28, COLORS.enemy);
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
      updateTownCamera();
      return;
    }
    if (town.story) {
      updateTownCamera();
      return;
    }
    const before = { x: town.player.x, y: town.player.y };
    if (!town.panel) {
      const move = getMoveVector();
      const speed = town.player.speed;
      const nextX = town.player.x + move.x * speed * dt;
      if (!isTownBlockedAt(nextX, town.player.y)) {
        town.player.x = nextX;
      }
      const nextY = town.player.y + move.y * speed * dt;
      if (!isTownBlockedAt(town.player.x, nextY)) {
        town.player.y = nextY;
      }
      clampTownPlayer();
    }
    updateTownFollowers(dt, before);
    town.interaction = getTownInteraction();
    if (!town.meetingDone && town.introDone && !town.panel && isNearTownBuilding("guild", 170)) {
      startGuildMeetingStory();
    }
    updateTownCamera();
  }

  function updateTownCamera() {
    const maxX = Math.max(0, TOWN_WIDTH - view.w);
    const maxY = Math.max(0, TOWN_HEIGHT - view.h);
    town.camera.x = clamp(town.player.x - view.w / 2, 0, maxX);
    town.camera.y = clamp(town.player.y - view.h / 2, 0, maxY);
  }

  function resetTownFollowers() {
    const spacing = 42;
    town.followers = [
      { id: "ulpes", label: "ウ", color: COLORS.ulpes, x: town.player.x, y: town.player.y + spacing },
      { id: "rihas", label: "リ", color: COLORS.rihas, x: town.player.x, y: town.player.y + spacing * 2 },
      { id: "sushia", label: "ス", color: COLORS.sushia, x: town.player.x, y: town.player.y + spacing * 3 },
    ];
  }

  function updateTownFollowers(dt, previousPlayerPosition) {
    if (!town.meetingDone || town.followers.length === 0) {
      return;
    }
    let target = { x: previousPlayerPosition.x, y: previousPlayerPosition.y };
    const spacing = 38;
    for (const follower of town.followers) {
      const dx = target.x - follower.x;
      const dy = target.y - follower.y;
      const d = Math.hypot(dx, dy);
      if (d > spacing) {
        const speed = town.player.speed * 1.12;
        const step = Math.min(d - spacing, speed * dt);
        follower.x += (dx / d) * step;
        follower.y += (dy / d) * step;
      }
      follower.x = clamp(follower.x, 12, TOWN_WIDTH - 12);
      follower.y = clamp(follower.y, 12, TOWN_HEIGHT - 12);
      target = follower;
    }
  }

  function isTownBlockedAt(x, y) {
    const r = town.player.radius;
    if (x < r || y < r || x > TOWN_WIDTH - r || y > TOWN_HEIGHT - r) {
      return true;
    }
    for (const building of town.buildings) {
      if (circleRectOverlap(x, y, r + 4, building.x, building.y, building.w, building.h)) {
        return true;
      }
    }
    return false;
  }

  function getTownInteraction() {
    let best = null;
    let bestDist = Infinity;
    for (const building of town.buildings) {
      const d = distPoint(town.player.x, town.player.y, building.door.x, building.door.y);
      if (d <= 72 && d < bestDist) {
        best = building;
        bestDist = d;
      }
    }
    return best;
  }

  function isNearTownBuilding(id, range) {
    const building = getTownBuilding(id);
    return !!building && distPoint(town.player.x, town.player.y, building.door.x, building.door.y) <= range;
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

  function showBattleGuidePanel() {
    town.panel = {
      title: "出発前の確認",
      action: "battleGuide",
      sections: [
        {
          title: `${getPlayerFirstName()}の技`,
          lines: [
            "援護射撃: 左クリックで構え、もう一度左クリックで後方から発射。敵にはダメージ、味方には回復。",
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
            `4 ${getPlayerFirstName()}: フルヒール。詠唱中、戦場の味方を回復し続ける。`,
          ],
        },
        {
          title: "調子メーター",
          lines: [
            "仲間はHPが高く保たれたり、活躍したりすると調子が上がる。",
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
      unit.actionLock = Math.max(0, unit.actionLock - dt);
      unit.hurt = Math.max(0, unit.hurt - dt);
      unit.guardFlash = Math.max(0, unit.guardFlash - dt);
      unit.frozen = Math.max(0, unit.frozen - dt);
      unit.stackCooldown = Math.max(0, unit.stackCooldown - dt);
      updateDelayedDamage(unit, dt);

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

    player.guarding = false;

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
    if (d > desired + 18) {
      dir = normalize(target.x - unit.x, target.y - unit.y);
    } else if (d < desired - 12) {
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
    const dangerWidth = (telegraph.width || 24) * 0.5 + unit.radius + TELEGRAPH_AVOID_PADDING;
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
      const preferred = enemy.role === "caster" ? 330 : 36;
      const dir = normalize(target.x - enemy.x, target.y - enemy.y);
      if (enemy.actionLock <= 0 && d > preferred + 10) {
        enemy.x += dir.x * enemy.speed * dt;
        enemy.y += dir.y * enemy.speed * dt;
      } else if (enemy.actionLock <= 0 && d < preferred - 20 && enemy.role === "caster") {
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
        shot.x < -60 ||
        shot.y < -60 ||
        shot.x > view.w + 60 ||
        shot.y > view.h + 60
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
    const gained = addMoodGain(unit, bonus);
    if (gained > 0) {
      addFloat(`調子+${Math.round(gained)}`, unit.x, unit.y - 42, COLORS.mood);
    }
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
  function isPlayerGuarding() {
    return false;
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
    unit.shield += amount;
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
      if (source.id === "rihas" && hasDelayedDamage(source)) {
        finalAmount *= 1.12;
      }
      if (options.crit && Math.random() < 0.1) {
        finalAmount *= 1.65;
        addFloat("CRIT", target.x, target.y - 36, "#fff1a0");
      }
    }

    if (target.team === "party" && target.id !== "finald" && target.mood !== null) {
      finalAmount *= getMoodIncomingDamageMultiplier(target);
    }

    if (source && source.team === "enemy" && target.id === "rihas" && source.forcedTarget === target && source.tauntTimer > 0) {
      finalAmount *= 0.6;
    }

    finalAmount = reduceByDefense(target, finalAmount, options.magic);

    if (target.team === "party") {
      const guarded = tryGuard(target);
      if (guarded) {
        finalAmount *= target === player ? 0.35 : 0.48;
      }
    }

    let shielded = 0;
    if (target.shield > 0) {
      shielded = Math.min(target.shield, finalAmount);
      target.shield -= shielded;
      finalAmount -= shielded;
      if (shielded > 0) {
        addFloat(`-${Math.round(shielded)}`, target.x, target.y - 26, "#8fe9ff");
      }
    }

    finalAmount = Math.max(0, finalAmount);
    let delayedAmount = 0;
    if (target.id === "rihas" && finalAmount > 0 && !options.delayed) {
      delayedAmount = finalAmount / 3;
      finalAmount -= delayedAmount;
      target.delayedDamageQueue.push({
        timer: 1,
        ticks: 5,
        amount: delayedAmount / 5,
      });
    }

    if (finalAmount > 0) {
      target.hp = Math.max(0, target.hp - finalAmount);
      target.hurt = 0.22;
      target.noDamage = 0;
      addFloat(`-${Math.round(finalAmount)}`, target.x, target.y - 24, getDamageFloatColor(source, target));
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
        source.castStacks = clamp(source.castStacks + 1, 0, 15);
        source.stackTimer = 8;
        source.stackCooldown = 1;
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
        const gained = addMoodGain(source, MOOD_KILL_BONUS);
        if (gained > 0) {
          addFloat(`撃破+${Math.round(gained)}`, source.x, source.y - 46, COLORS.mood);
        }
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
    if (healed <= 0) {
      addFloat("+0", target.x, target.y - 28, "#79ff8d");
      return 0;
    }

    addFloat(`+${Math.round(healed)}`, target.x, target.y - 28, "#79ff8d");
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

  function getEffectiveDefense(unit) {
    if (unit.id === "rihas" && hasDelayedDamage(unit)) {
      return unit.defense + 8;
    }
    return unit.defense;
  }

  function hasDelayedDamage(unit) {
    return unit.delayedDamageQueue && unit.delayedDamageQueue.length > 0;
  }

  function updateDelayedDamage(unit, dt) {
    if (!unit.delayedDamageQueue || unit.delayedDamageQueue.length === 0 || unit.dead) {
      return;
    }

    for (let i = unit.delayedDamageQueue.length - 1; i >= 0; i -= 1) {
      const entry = unit.delayedDamageQueue[i];
      entry.timer -= dt;
      while (entry.timer <= 0 && entry.ticks > 0 && !unit.dead) {
        applyDelayedDamage(unit, entry.amount);
        entry.ticks -= 1;
        entry.timer += 1;
      }
      if (entry.ticks <= 0 || unit.dead) {
        unit.delayedDamageQueue.splice(i, 1);
      }
    }
  }

  function applyDelayedDamage(unit, amount) {
    const damage = Math.max(0, amount);
    if (damage <= 0 || unit.dead) {
      return;
    }
    unit.hp = Math.max(0, unit.hp - damage);
    unit.hurt = 0.18;
    addFloat(`-${Math.round(damage)}`, unit.x, unit.y - 24, "#ff4f4f");
    if (unit.hp <= 0) {
      unit.dead = true;
      unit.hp = 0;
      addBurst(unit.x, unit.y, unit.radius * 2.2, "rgba(255,255,255,0.2)");
    }
  }

  function tryGuard(unit) {
    if (unit === player) {
      if (isPlayerGuarding() && !player.channel && !player.cast && player.actionLock <= 0 && player.frozen <= 0) {
        player.guardFlash = 0.18;
        return true;
      }
      return false;
    }
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
      if (d <= member.radius + 8 && d < bestDist) {
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
    const fallbackY = bounds.bottom - 42;
    const y = target && Number.isFinite(target.y)
      ? clamp(target.y, bounds.top + 28, bounds.bottom - 28)
      : fallbackY;
    return { x: bounds.left - 36, y };
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
    drawEffects();
    drawHud();
    drawResultOverlay();
  }

  function drawTown() {
    updateTownCamera();
    ctx.fillStyle = "#3f6a48";
    ctx.fillRect(0, 0, view.w, view.h);

    ctx.save();
    ctx.translate(-town.camera.x, -town.camera.y);
    drawTownTerrain();
    drawTownRoads();
    drawTownProps();
    drawTownBuildings();
    drawTownCompanions();
    drawTownPlayer();
    ctx.restore();

    drawTownHud();
    drawTownPanel();
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
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(building.door.x, building.door.y, 34 + pulse * 5, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "#111714";
      ctx.strokeStyle = "#f7fff6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(building.door.x, building.door.y - 48, 17, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f7fff6";
      ctx.font = "800 16px 'Segoe UI', sans-serif";
      ctx.fillText("E", building.door.x, building.door.y - 48);
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
    for (const follower of town.followers) {
      drawTownNpc(follower.x, follower.y, follower.color, follower.label);
    }
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

  function drawTownPlayer() {
    const unit = town.player;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.24)";
    ctx.beginPath();
    ctx.ellipse(unit.x, unit.y + unit.radius + 4, unit.radius + 4, 7, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = unit.color;
    ctx.strokeStyle = "#101814";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, unit.radius, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#101814";
    ctx.font = "800 14px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("主", unit.x, unit.y + 1);

    ctx.strokeStyle = "#6a4a2e";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(unit.x + 14, unit.y + 20);
    ctx.lineTo(unit.x + 30, unit.y - 14);
    ctx.stroke();
    ctx.fillStyle = "#a8fbff";
    ctx.strokeStyle = "#f7fff6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(unit.x + 31, unit.y - 16, 6, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawTownHud() {
    drawPanel(18, 18, 300, 80);
    ctx.fillStyle = "#f7fff6";
    ctx.font = "800 19px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("はじまりの町", 34, 47);
    ctx.font = "13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#d4e4d5";
    const target = town.interaction ? town.interaction.name : "広場";
    ctx.fillText(`現在地: ${target}`, 34, 73);
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

    ctx.fillStyle = "#4d7f4c";
    ctx.fillRect(0, bounds.top, view.w, bounds.height);

    drawGrassField(bounds);
    drawBattleTreeBand(0, bounds.top, true);
    drawBattleTreeBand(bounds.bottom, view.h, false);

    ctx.strokeStyle = "rgba(20,45,24,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= view.w; x += 64) {
      ctx.moveTo(x, bounds.top);
      ctx.lineTo(x, bounds.bottom);
    }
    for (let y = bounds.top; y <= bounds.bottom; y += 64) {
      ctx.moveTo(0, y);
      ctx.lineTo(view.w, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(9,28,16,0.75)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, bounds.top);
    ctx.lineTo(view.w, bounds.top);
    ctx.moveTo(0, bounds.bottom);
    ctx.lineTo(view.w, bounds.bottom);
    ctx.stroke();
  }

  function drawGrassField(bounds) {
    ctx.save();
    ctx.lineCap = "round";
    for (let y = bounds.top + 24; y < bounds.bottom - 18; y += 38) {
      for (let x = 18 + ((Math.floor(y) * 7) % 31); x < view.w; x += 46) {
        const sway = Math.sin(x * 0.09 + y * 0.04) * 3;
        ctx.strokeStyle = (Math.floor((x + y) / 46) % 2) ? "rgba(126,178,94,0.38)" : "rgba(57,117,57,0.38)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + 7);
        ctx.lineTo(x + sway, y - 4);
        ctx.moveTo(x + 7, y + 6);
        ctx.lineTo(x + 10 + sway * 0.4, y - 2);
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

    const rowGap = 42;
    const colGap = 54;
    let row = 0;
    const treeEndY = topBand ? y1 - 18 : y1 + 24;
    for (let y = y0 + 18; y < treeEndY; y += rowGap) {
      const offset = row % 2 ? 24 : -4;
      for (let x = offset; x < view.w + colGap; x += colGap) {
        const wobble = Math.sin(x * 0.13 + y * 0.17) * 5;
        const trunkX = x + wobble;
        const trunkY = y + 10;
        ctx.fillStyle = "#6a4428";
        roundRect(trunkX - 5, trunkY, 10, 22, 3);
        ctx.fill();
        ctx.fillStyle = row % 2 ? "#27653a" : "#225a34";
        ctx.beginPath();
        ctx.arc(trunkX, y, 24, 0, TAU);
        ctx.fill();
        ctx.fillStyle = row % 2 ? "#2f7845" : "#2b7040";
        ctx.beginPath();
        ctx.arc(trunkX - 10, y - 7, 15, 0, TAU);
        ctx.arc(trunkX + 11, y - 8, 16, 0, TAU);
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
        ctx.lineWidth = telegraph.width + 10;
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
        drawSupportCastingAt(player.cast.target.x, player.cast.target.y, player.cast.target.radius + 22, "#79ff8d", progress);
      } else if (player.cast.type === "shield") {
        drawSupportCastingAt(player.cast.x, player.cast.y, 30, "#8fe9ff", progress);
      } else if (player.cast.type === "attack" && player.cast.target) {
        drawSupportCastingAt(player.cast.target.x, player.cast.target.y, 22, "#9ef7ff", progress);
      }
    }

    if (player.channel) {
      const pulse = 0.5 + Math.sin(game.time * 8) * 0.5;
      for (const member of getFieldPartyMembers()) {
        if (member.dead) {
          continue;
        }
        drawSupportCastingAt(member.x, member.y, member.radius + 18 + pulse * 5, "#79ff8d", pulse);
      }
    }
    ctx.restore();
  }

  function drawSupportCastingAt(x, y, radius, color, progress) {
    const angle = game.time * 4.4;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.32 + progress * 0.28;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, angle, angle + TAU * 0.72);
    ctx.stroke();

    for (let i = 0; i < 3; i += 1) {
      const a = angle + i * (TAU / 3);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.55 + progress * 0.35;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * radius, y + Math.sin(a) * radius, 4, 0, TAU);
      ctx.fill();
    }
  }

  function drawAimRangeCircle(x, y, radius, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
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
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius + 7, start, end);
      ctx.stroke();
    }

    if (unit.shield > 0) {
      ctx.strokeStyle = COLORS.shield;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius + 4, 0, TAU);
      ctx.stroke();
    }

    if (unit === player && (player.cast || player.channel)) {
      drawCastOrbit(unit);
    }

    if (isHovered) {
      ctx.strokeStyle = COLORS.white;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius + 10, 0, TAU);
      ctx.stroke();
    }

    if (unit.guardFlash > 0 || unit.guarding) {
      ctx.strokeStyle = "#f6f6f6";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(unit.x, unit.y, unit.radius + 13, -0.7, 0.7);
      ctx.stroke();
    }

    ctx.fillStyle = unit.frozen > 0 ? "#cfefff" : unit.color;
    ctx.strokeStyle = unit.team === "enemy" ? "#3a1816" : "#101814";
    ctx.lineWidth = 3;
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
      const barWidth = Math.max(44, unit.radius * 2.8);
      drawBar(unit.x - barWidth / 2, unit.y + unit.radius + 9, barWidth, 6, unit.hp / unit.maxHp, "#241312", COLORS.hp);
    } else {
      drawBar(unit.x - 24, unit.y - unit.radius - 20, 48, 5, unit.hp / unit.maxHp, "#132115", COLORS.hp);
    }
    if (unit.team === "party" && unit.maxMp > 0) {
      drawBar(unit.x - 24, unit.y - unit.radius - 13, 48, 4, unit.mp / unit.maxMp, "#131b2a", COLORS.mp);
    }
    if (unit.shield > 0) {
      drawBar(unit.x - 24, unit.y - unit.radius - 7, 48, 3, unit.shield / 60, "#0d2b34", COLORS.shield);
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

  function drawTauntMark(unit) {
    const pulse = 0.75 + Math.sin(game.time * 11) * 0.25;
    const x = unit.x + unit.radius + 12;
    const y = unit.y - unit.radius - 14;
    const size = 12 + pulse * 2;

    ctx.save();
    ctx.globalAlpha = 0.78 + pulse * 0.18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2b1210";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.7, y);
    ctx.lineTo(x - size * 0.15, y - size * 0.62);
    ctx.lineTo(x + size * 0.35, y - size * 0.15);
    ctx.moveTo(x - size * 0.65, y + size * 0.62);
    ctx.lineTo(x - size * 0.05, y + size * 0.12);
    ctx.lineTo(x + size * 0.7, y + size * 0.58);
    ctx.stroke();

    ctx.strokeStyle = "#ff5d3f";
    ctx.lineWidth = 3;
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
    const orbitRadius = unit.radius + 20;
    const pulse = 0.55 + Math.sin(game.time * 10) * 0.18;

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(124, 255, 148, 0.24)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, orbitRadius, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = "rgba(190, 255, 203, 0.95)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, orbitRadius, -Math.PI / 2, -Math.PI / 2 + TAU * castProgress);
    ctx.stroke();

    for (let i = 0; i < 4; i += 1) {
      const angle = game.time * 4.2 + i * (TAU / 4);
      const x = unit.x + Math.cos(angle) * orbitRadius;
      const y = unit.y + Math.sin(angle) * orbitRadius;
      const size = i === 0 ? 5.5 : 4;
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
    const x = unit.x + unit.radius + 7;
    const y = unit.y - unit.radius - 2;

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#6a4a2e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 25);
    ctx.lineTo(x + 9, y - 10);
    ctx.stroke();

    ctx.strokeStyle = "#f7fff6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 8, y + 25);
    ctx.lineTo(x + 9, y - 10);
    ctx.stroke();

    ctx.fillStyle = orbColor;
    ctx.strokeStyle = "#f7fff6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 10, y - 12, 6, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawSwordIcon(unit) {
    const x = unit.x + unit.radius + 5;
    const y = unit.y - unit.radius + 1;

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#f4f6f7";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 24);
    ctx.lineTo(x + 13, y - 12);
    ctx.stroke();

    ctx.strokeStyle = "#7e8b91";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 24);
    ctx.lineTo(x + 13, y - 12);
    ctx.stroke();

    ctx.strokeStyle = "#493327";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 15, y + 15);
    ctx.lineTo(x + 3, y + 26);
    ctx.stroke();

    ctx.strokeStyle = "#b58b40";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 13, y + 24);
    ctx.lineTo(x - 5, y + 33);
    ctx.stroke();
    ctx.restore();
  }

  function drawFistIcon(unit) {
    const x = unit.x + unit.radius + 8;
    const y = unit.y - unit.radius + 1;

    ctx.save();
    ctx.fillStyle = "#f7b05e";
    ctx.strokeStyle = "#3a2115";
    ctx.lineWidth = 2;

    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(x + i * 5, y, 4.7, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }

    roundRect(x - 3, y + 3, 25, 17, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e37a3f";
    roundRect(x + 1, y + 17, 16, 9, 4);
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
    const anchorY = source.y - (source.radius || 14) - 20;

    ctx.globalAlpha = alpha;
    ctx.font = "800 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const textWidth = ctx.measureText(effect.text).width;
    const bubbleW = Math.min(Math.max(textWidth + 20, 46), 190);
    const bubbleH = 27;
    const bubbleX = clamp(anchorX - bubbleW / 2, 8, view.w - bubbleW - 8);
    const bubbleY = clamp(anchorY - bubbleH - 12 - Math.sin(effect.age * 7) * 1.5, 8, view.h - bubbleH - 20);
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
    drawPanel(18, 18, 300, 78);
    ctx.fillStyle = "#f7fff6";
    ctx.font = "700 18px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(game.message, 34, 47);
    ctx.font = "13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#d4e4d5";
    const aliveEnemies = enemies.filter((enemy) => !enemy.dead).length;
    ctx.fillText(`残り魔物 ${aliveEnemies} / ${enemies.length}`, 34, 72);

    const hudW = Math.min(390, view.w - 32);
    const rowH = 43;
    const hudH = 18 + rowH * party.length;
    const x = 18;
    const y = view.h - hudH - 16;
    drawPanel(x, y, hudW, hudH);
    for (let i = 0; i < party.length; i += 1) {
      drawPartyRow(party[i], x + 16, y + 14 + i * rowH, hudW - 32);
    }

    const skillW = Math.min(460, view.w - hudW - 64);
    if (skillW > 220) {
      drawSkillPanel(view.w - skillW - 18, view.h - 116, skillW, 100);
    }
  }

  function drawPartyRow(unit, x, y, width) {
    const iconX = x + 10;
    const iconY = y + 13;
    const barX = x + 112;
    const barW = width - 118;

    drawCircleGauge(iconX, iconY, 13, unit.ult / 100, "rgba(0,0,0,0.45)", COLORS.ult);
    ctx.fillStyle = unit.color;
    ctx.beginPath();
    ctx.arc(iconX, iconY, 8, 0, TAU);
    ctx.fill();

    if (unit.ult >= 100) {
      ctx.strokeStyle = "rgba(255,255,255,0.82)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(iconX, iconY, 16, 0, TAU);
      ctx.stroke();
    }

    const ultKey = ULTIMATE_KEYS[unit.id];
    if (ultKey) {
      const keyX = iconX - 11;
      const keyY = iconY - 18;
      ctx.fillStyle = unit.ult >= 100 ? COLORS.ult : "rgba(7,10,9,0.88)";
      ctx.strokeStyle = unit.ult >= 100 ? "#ffffff" : "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1;
      roundRect(keyX - 7, keyY - 7, 14, 14, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = unit.ult >= 100 ? "#111111" : "#f7fff6";
      ctx.font = "800 10px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ultKey, keyX, keyY + 0.5);
      ctx.textBaseline = "alphabetic";
    }

    ctx.fillStyle = "#f7fff6";
    ctx.font = "700 13px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(unit.name, x + 25, y + 8);
    ctx.font = "11px 'Segoe UI', 'Yu Gothic UI', sans-serif";
    ctx.fillStyle = "#cfe0d2";
    ctx.fillText(`${Math.ceil(unit.hp)}/${unit.maxHp}`, x + 25, y + 25);

    drawBar(barX, y + 2, barW, 8, unit.hp / unit.maxHp, "#132115", COLORS.hp);
    if (unit.maxMp > 0) {
      drawBar(barX, y + 14, barW, 6, unit.mp / unit.maxMp, "#131b2a", COLORS.mp);
    }
    if (unit.mood !== null) {
      const marker = barX + barW * 0.5;
      drawBar(barX, y + 25, barW, 6, unit.mood / 100, "#2b2615", getMoodColor(unit.mood));
      ctx.strokeStyle = "#f6f6f6";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marker, y + 24);
      ctx.lineTo(marker, y + 33);
      ctx.stroke();
    }
  }
  function drawSkillPanel(x, y, w, h) {
    drawPanel(x, y, w, h);
    const skills = skillSystem.getPanelSkills(player);
    const gap = 10;
    const itemW = (w - 32 - gap * 3) / 4;
    for (let i = 0; i < skills.length; i += 1) {
      const sx = x + 16 + i * (itemW + gap);
      const skill = skills[i];
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRect(sx, y + 18, itemW, h - 36, 8);
      ctx.fill();
      ctx.fillStyle = "#eff9ef";
      ctx.font = "700 12px 'Segoe UI', 'Yu Gothic UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(skill.name, sx + itemW / 2, y + 42);
      const ratio = skill.gauge ? player.ult / 100 : 1 - clamp(skill.cd / skill.max, 0, 1);
      drawBar(sx + 12, y + 60, itemW - 24, 7, ratio, "rgba(0,0,0,0.35)", skill.gauge ? COLORS.ult : COLORS.mp);
      if (skill.cd > 0 && !skill.gauge) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 13px 'Segoe UI', sans-serif";
        ctx.fillText(skill.cd.toFixed(1), sx + itemW / 2, y + 82);
      }
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


  function clampTownPlayer() {
    town.player.x = clamp(town.player.x, town.player.radius, TOWN_WIDTH - town.player.radius);
    town.player.y = clamp(town.player.y, town.player.radius, TOWN_HEIGHT - town.player.radius);
  }

  function circleRectOverlap(cx, cy, r, rx, ry, rw, rh) {
    const nearestX = clamp(cx, rx, rx + rw);
    const nearestY = clamp(cy, ry, ry + rh);
    return distPoint(cx, cy, nearestX, nearestY) <= r;
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

  function getMoveVector() {
    let x = 0;
    let y = 0;
    if (input.keys.w || input.keys.arrowup) y -= 1;
    if (input.keys.s || input.keys.arrowdown) y += 1;
    if (input.keys.a || input.keys.arrowleft) x -= 1;
    if (input.keys.d || input.keys.arrowright) x += 1;
    return normalize(x, y);
  }

  function hasMoveInput() {
    return Boolean(input.keys.w || input.keys.a || input.keys.s || input.keys.d || input.keys.arrowup || input.keys.arrowdown || input.keys.arrowleft || input.keys.arrowright);
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
    let top = clamp(view.h * 0.16, 88, 132);
    let bottomBand = clamp(view.h * 0.18, 108, 160);
    const shortage = BATTLE_MIN_PLAY_HEIGHT - (view.h - top - bottomBand);
    if (shortage > 0) {
      top = Math.max(64, top - shortage * 0.45);
      bottomBand = Math.max(76, bottomBand - shortage * 0.55);
    }
    const bottom = view.h - bottomBand;
    return {
      left: BATTLE_SIDE_MARGIN,
      right: view.w - BATTLE_SIDE_MARGIN,
      top,
      bottom,
      width: Math.max(0, view.w - BATTLE_SIDE_MARGIN * 2),
      height: Math.max(0, bottom - top),
      centerY: (top + bottom) / 2,
    };
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
})();
