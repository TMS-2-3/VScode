(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const TAU = Math.PI * 2;

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
  };

  let party = [];
  let enemies = [];
  let projectiles = [];
  let telegraphs = [];
  let areas = [];
  let effects = [];
  let lastTime = performance.now();
  const TOWN_WIDTH = 1600;
  const TOWN_HEIGHT = 1100;
  const town = {
    player: { x: TOWN_WIDTH * 0.5, y: TOWN_HEIGHT - 160, radius: 15, speed: 235, color: "#57c7c9" },
    camera: { x: 0, y: 0 },
    buildings: [],
    props: [],
    interaction: null,
    panel: null,
  };

  const PLAYER_ATTACK_CAST = 1;
  const PLAYER_ATTACK_COST = 6;
  const PLAYER_ATTACK_CD = 4;
  const PLAYER_ATTACK_RANGE = 420;
  const HEAL_CAST = 2;
  const HEAL_COST = 18;
  const HEAL_CD = 6;
  const HEAL_RANGE = 520;
  const SHIELD_CAST = 2;
  const SHIELD_COST = 24;
  const SHIELD_CD = 8;
  const SHIELD_RANGE = 340;
  const INTERRUPTED_CAST_COOLDOWN_REDUCTION = 0.8;
  const SHIELD_RADIUS = 92;
  const SELF_HEAL_DELAY = 5;
  const SELF_HEAL_LIMIT = 0.8;
  const SELF_HEAL_MP_PER_SEC = 22;
  const SELF_HEAL_HP_PER_SEC = 14;
  const AI_IDLE_RECHECK = 0.2;
  const ACTION_GAP = 0.2;
  const MOOD_BASELINE = 50;
  const MOOD_NATURAL_FALL = 0.5;
  const MOOD_NATURAL_FALL_MIN = 0.1;
  const MOOD_NATURAL_FALL_MIN_TIME = 18;
  const MOOD_NATURAL_RECOVER = 0.3;
  const MOOD_EVENT_MULT = 1.2;
  const MOOD_NO_DAMAGE_GAIN_BONUS_START = 3;
  const MOOD_NO_DAMAGE_GAIN_BONUS_MAX_TIME = 18;
  const MOOD_NO_DAMAGE_GAIN_BONUS_MAX = 1.3;
  const MOOD_DISTANCE_BONUS_START = 200;
  const MOOD_DISTANCE_BONUS_END = 420;
  const MOOD_DISTANCE_BONUS_MAX = 1.5;
  const MOOD_MULTI_HIT_MIN = 2;
  const MOOD_MULTI_HIT_BASE = 3;
  const ENEMY_NORMAL_ATTACK_CD = 4;
  const CASTER_ACTION_CD = 5.2;
  const CASTER_SKILL_CD_BASE = 6.6;
  const CASTER_SKILL_CD_RANDOM = 1.5;
  const HEAVY_SLAM_CD = 8.4;
  const SUSHIA_ICE_WORLD_RADIUS = 330;

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

  const SKILL_LINES = {
    finald: {
      attack: ["援護します"],
      heal: ["ヒール!", "回復!"],
      shield: ["バリア展開!", "守るよ!"],
      ult: ["フルヒール!!"],
    },
    ulpes: {
      attack: ["てやっ!", "くらえ!"],
      heroSlash: ["ヒーロースラッシュ!!"],
      ult: ["正義の一撃!!"],
    },
    rihas: {
      attack: ["どりゃぁ!", "しねぇ!"],
      quake: ["台地よ!揺れよ!"],
      ult: ["相手してやる"],
    },
    sushia: {
      attack: ["とうっ!", "拡散弾!"],
      bomb: ["インパクトボム!!"],
      ult: ["全部凍っちゃえ!!"],
    },
  };
  const player = makeUnit({
    id: "finald",
    name: "フィナルド",
    label: "フ",
    team: "party",
    role: "support",
    color: COLORS.player,
    radius: 15,
    maxHp: 150,
    maxMp: 140,
    speed: 230,
    attack: 7,
    magic: 16,
    defense: 6,
    magicDefense: 12,
    guardChance: 0,
  });

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
  }

  window.addEventListener("resize", resize);
  resize();
  startTown();
  requestAnimationFrame(loop);

  window.addEventListener("keydown", (event) => {
    const key = event.key === " " ? "space" : event.key.toLowerCase();
    input.keys[key] = true;

    if (["f", "g", "r", "e", "escape", "space", "1", "2", "3", "4"].includes(key)) {
      event.preventDefault();
    }
    if (event.repeat) {
      return;
    }

    if (game.state === "town") {
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
    } else if (key === "g") {
      startPlayerAim("shield");
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
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = event.clientX - rect.left;
    input.mouse.y = event.clientY - rect.top;
  });

  canvas.addEventListener("mousedown", (event) => {
    event.preventDefault();
    if (game.state !== "playing") {
      return;
    }
    if (event.button === 0) {
      confirmPlayerAim();
    }
    if (event.button === 2) {
      input.mouse.right = true;
      if (player.aim) {
        cancelPlayerAim();
      } else {
        startPlayerAim("attack");
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
    game.message = "依頼: 魔物を全滅させる";
    game.messageTimer = 4;

    const cx = view.w * 0.33;
    const cy = view.h * 0.54;

    Object.assign(player, {
      x: cx - 90,
      y: cy + 28,
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
    });

    const ulpes = makeUnit({
      id: "ulpes",
      name: "ウルペス",
      label: "ウ",
      team: "party",
      role: "hero",
      color: COLORS.ulpes,
      radius: 16,
      maxHp: 190,
      maxMp: 50,
      speed: 150,
      attack: 12,
      magic: 4,
      defense: 11,
      magicDefense: 8,
      guardChance: 0.24,
      preferredRange: 42,
    });

    const rihas = makeUnit({
      id: "rihas",
      name: "リハス",
      label: "リ",
      team: "party",
      role: "monk",
      color: COLORS.rihas,
      radius: 17,
      maxHp: 230,
      maxMp: 45,
      speed: 135,
      attack: 14,
      magic: 2,
      defense: 15,
      magicDefense: 7,
      guardChance: 0.22,
      preferredRange: 56,
    });

    const sushia = makeUnit({
      id: "sushia",
      name: "スシア",
      label: "ス",
      team: "party",
      role: "mage",
      color: COLORS.sushia,
      radius: 15,
      maxHp: 135,
      maxMp: 120,
      speed: 120,
      attack: 2,
      magic: 15,
      defense: 5,
      magicDefense: 14,
      guardChance: 0.16,
      preferredRange: 260,
    });

    Object.assign(ulpes, { x: cx + 28, y: cy - 72 });
    Object.assign(rihas, { x: cx + 62, y: cy + 55 });
    Object.assign(sushia, { x: cx - 28, y: cy - 6 });
    party = [player, ulpes, rihas, sushia];

    const startX = Math.min(view.w - 120, view.w * 0.72);
    const startY = view.h * 0.5;
    enemies = [
      makeEnemy("魔物A", startX, startY - 150, "brute"),
      makeEnemy("魔物B", startX + 72, startY - 80, "skirmisher"),
      makeEnemy("魔物C", startX + 18, startY + 5, "brute"),
      makeEnemy("魔物D", startX + 92, startY + 88, "skirmisher"),
      makeEnemy("射手A", startX + 205, startY - 96, "caster"),
      makeEnemy("射手B", startX + 220, startY + 80, "caster"),
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
      maxMp: options.maxMp || 0,
      mp: options.maxMp || 0,
      speed: options.speed || 100,
      attack: options.attack || 10,
      magic: options.magic || 10,
      defense: options.defense || 0,
      magicDefense: options.magicDefense || 0,
      guardChance: options.guardChance || 0,
      preferredRange: options.preferredRange || 90,
      mood: options.team === "party" && options.id !== "finald" ? MOOD_BASELINE : null,
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
    };
  }

  function makeEnemy(name, x, y, kind) {
    const stats = {
      brute: { hp: 110, speed: 74, radius: 15, attack: 8, defense: 7, magicDefense: 4, color: COLORS.enemy },
      skirmisher: { hp: 80, speed: 118, radius: 13, attack: 6, defense: 4, magicDefense: 3, color: "#d88468" },
      caster: { hp: 70, speed: 62, radius: 13, attack: 8, defense: 3, magicDefense: 8, color: "#a0506e" },
      elite: { hp: 250, speed: 68, radius: 22, attack: 12, defense: 11, magicDefense: 8, color: COLORS.enemyDark },
    }[kind];

    const enemy = makeUnit({
      id: `${kind}-${Math.random().toString(16).slice(2)}`,
      name,
      label: kind === "caster" ? "射" : "魔",
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
      enemy.cds.skill = CASTER_SKILL_CD_BASE + Math.random() * CASTER_SKILL_CD_RANDOM;
    } else if (kind === "elite") {
      enemy.cds.skill = HEAVY_SLAM_CD;
    } else {
      enemy.cds.skill = 0;
    }
    return enemy;
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
    game.message = "はじまりの町";
    game.messageTimer = 4;
    town.panel = null;
    town.interaction = null;
    player.aim = null;
    if (town.buildings.length === 0) {
      setupTown();
    }
    town.player.x = TOWN_WIDTH * 0.5;
    town.player.y = TOWN_HEIGHT - 155;
    clampTownPlayer();
    updateTownCamera();
  }

  function setupTown() {
    town.buildings = [
      makeTownBuilding("inn", "宿屋", "宿", 170, 150, 250, 170, "#f0c978", "#b95143"),
      makeTownBuilding("item", "アイテム屋", "薬", 510, 160, 250, 160, "#d6e7a6", "#3f8d72"),
      makeTownBuilding("weapon", "武器屋", "剣", 890, 150, 260, 175, "#d7dce2", "#55616f"),
      makeTownBuilding("armor", "防具屋", "盾", 1210, 175, 240, 155, "#d9d3ee", "#655aa0"),
      makeTownBuilding("guild", "依頼所", "依", 610, 585, 380, 215, "#e1b07c", "#7f3f4d"),
    ];

    town.props = [
      { type: "well", x: 790, y: 465, r: 28 },
      { type: "tree", x: 120, y: 430, r: 28 },
      { type: "tree", x: 310, y: 690, r: 30 },
      { type: "tree", x: 1290, y: 455, r: 32 },
      { type: "tree", x: 1470, y: 690, r: 27 },
      { type: "crate", x: 455, y: 395, w: 42, h: 34 },
      { type: "crate", x: 1125, y: 395, w: 50, h: 32 },
    ];
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

  function updateTown(dt) {
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
    town.interaction = getTownInteraction();
    updateTownCamera();
  }

  function updateTownCamera() {
    const maxX = Math.max(0, TOWN_WIDTH - view.w);
    const maxY = Math.max(0, TOWN_HEIGHT - view.h);
    town.camera.x = clamp(town.player.x - view.w / 2, 0, maxX);
    town.camera.y = clamp(town.player.y - view.h / 2, 0, maxY);
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

  function interactTown() {
    if (town.panel) {
      if (town.panel.action === "quest") {
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
      town.panel = {
        title: "依頼所",
        lines: ["依頼: 町外れの魔物討伐", "報酬や難易度選択はあとで追加する。"],
        action: "quest",
      };
    }
  }

  function closeTownPanel() {
    town.panel = null;
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
        if (unit.mood > MOOD_BASELINE) {
          unit.mood = Math.max(MOOD_BASELINE, unit.mood - dt * getMoodNaturalFall(unit));
        } else if (unit.mood < MOOD_BASELINE) {
          unit.mood = Math.min(MOOD_BASELINE, unit.mood + dt * MOOD_NATURAL_RECOVER);
        }
      }
    }
  }

  function updatePlayer(dt) {
    if (player.dead) {
      return;
    }

    if (player.channel && hasMoveInput()) {
      cancelPlayerChannel();
    }
    if (player.cast) {
      player.cast.time -= dt;
      if (player.cast.time <= 0) {
        finishPlayerCast();
      }
    }

    const guardHeld = isPlayerGuarding();
    if (guardHeld && player.aim) {
      cancelPlayerAim();
    }
    const busy = Boolean(player.channel || player.cast);
    const guarding = guardHeld && !busy && player.actionLock <= 0 && player.frozen <= 0;
    player.guarding = guarding;
    const moveSpeed = player.speed * (guarding ? 0.42 : 1);
    if (player.frozen <= 0 && !busy) {
      const move = getMoveVector();
      player.x += move.x * moveSpeed * dt;
      player.y += move.y * moveSpeed * dt;
    }
    clampUnit(player);

    const regen = guarding ? 5 : 13;
    player.mp = clamp(player.mp + regen * dt, 0, player.maxMp);
    updateSelfHeal(dt);

    if (player.channel) {
      player.channel.time -= dt;
      player.channel.pulse -= dt;
      if (player.channel.pulse <= 0) {
        player.channel.pulse = 0.22;
        const alliesInRange = party.filter((member) => member !== player && !member.dead && dist(player, member) <= 285);
        if (alliesInRange.length === 0) {
          cancelPlayerChannel();
          return;
        }
        for (const member of party) {
          if (!member.dead && dist(player, member) <= 285) {
            healUnit(player, member, 6, { noMood: member === player });
          }
        }
      }
      if (player.channel.time <= 0) {
        player.channel = null;
      }
    }
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

    if (cast.type === "attack") {
      completePlayerShot(cast.dir);
    } else if (cast.type === "heal") {
      completeHeal(cast.target);
    } else if (cast.type === "shield") {
      completeShield(cast.x, cast.y);
    }
    player.actionLock = Math.max(player.actionLock, ACTION_GAP);
  }

  function updatePartyAi(dt) {
    for (const member of party) {
      if (member === player || member.dead || member.frozen > 0) {
        continue;
      }

      if (member.actionLock <= 0) {
        updatePartyMovement(member, dt);
      }
      member.aiTick -= dt;
      if (member.actionLock <= 0 && member.ult >= 100 && member.mood >= 95) {
        if (triggerUltimate(member.id, true)) {
          setActionCooldown(member);
        }
        continue;
      }

      if (member.aiTick > 0 || member.actionLock > 0 || (member.cds.attack || 0) > 0) {
        continue;
      }

      if (member.mood >= 85 && member.ult >= 100 && Math.random() < 0.16) {
        if (triggerUltimate(member.id, true)) {
          setActionCooldown(member);
        }
        continue;
      }

      if (member.id === "ulpes") {
        thinkUlpes(member);
      } else if (member.id === "rihas") {
        thinkRihas(member);
      } else if (member.id === "sushia") {
        thinkSushia(member);
      }
    }
  }

  function updatePartyMovement(unit, dt) {
    const target = nearestAlive(unit, enemies);
    if (!target) {
      return;
    }
    const d = dist(unit, target);
    const desired = unit.preferredRange * (unit.mood > 80 ? 0.62 : 1);
    let dir = { x: 0, y: 0 };
    if (d > desired + 18) {
      dir = normalize(target.x - unit.x, target.y - unit.y);
    } else if (d < desired - 12) {
      dir = normalize(unit.x - target.x, unit.y - target.y);
    }

    const moodSpeed = 1 + Math.max(0, unit.mood - MOOD_BASELINE) * 0.003;
    unit.x += dir.x * unit.speed * moodSpeed * dt;
    unit.y += dir.y * unit.speed * moodSpeed * dt;
    clampUnit(unit);
  }

  function updateEnemyAi(dt) {
    for (const enemy of enemies) {
      if (enemy.dead || enemy.frozen > 0) {
        continue;
      }

      const target = enemy.forcedTarget && !enemy.forcedTarget.dead
        ? enemy.forcedTarget
        : nearestAlive(enemy, party);
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
        ? (shot.affectsAllies ? [...enemies, ...party] : enemies)
        : party;
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

  function thinkUlpes(unit) {
    const target = nearestAlive(unit, enemies);
    if (!target) {
      return;
    }
    const d = dist(unit, target);
    const candidates = [];
    if ((unit.cds.heroSlash || 0) <= 0 && d <= 128) {
      candidates.push(() => useUlpesHeroSlash(unit, target));
    }
    if (d <= 52) {
      candidates.push(() => useUlpesNormal(unit, target));
    }
    useRandomCandidate(unit, candidates);
  }

  function thinkRihas(unit) {
    const target = nearestAlive(unit, enemies);
    if (!target) {
      return;
    }
    const d = dist(unit, target);
    const candidates = [];
    if ((unit.cds.quake || 0) <= 0 && d <= 260) {
      candidates.push(() => useRihasJump(unit, target));
    }
    if (d <= 75) {
      candidates.push(() => useRihasNormal(unit));
    }
    useRandomCandidate(unit, candidates);
  }

  function thinkSushia(unit) {
    const target = nearestAlive(unit, enemies);
    if (!target) {
      return;
    }
    const d = dist(unit, target);
    const candidates = [];
    if ((unit.cds.bomb || 0) <= 0 && d <= 430) {
      candidates.push(() => useSushiaBomb(unit, target));
    }
    if (d <= 340) {
      candidates.push(() => useSushiaBolts(unit, target));
    }
    useRandomCandidate(unit, candidates);
  }

  function thinkEnemy(enemy, target, distance) {
    const candidates = [];
    if (enemy.role === "caster") {
      if ((enemy.cds.skill || 0) <= 0) {
        candidates.push(() => enemyLineAttack(enemy, target));
      }
    } else if (enemy.role === "elite") {
      if ((enemy.cds.skill || 0) <= 0) {
        candidates.push(() => enemyHeavySlam(enemy, target));
      }
      if (distance <= 58) {
        candidates.push(() => enemyBite(enemy, target));
      }
    } else if (distance <= 48) {
      candidates.push(() => enemyBite(enemy, target));
    }

    useRandomCandidate(enemy, candidates);
  }

  function useRandomCandidate(unit, candidates) {
    if (candidates.length === 0) {
      unit.aiTick = AI_IDLE_RECHECK;
      return false;
    }
    candidates[Math.floor(Math.random() * candidates.length)]();
    return true;
  }

  function getActionCooldown(unit) {
    if (unit.id === "ulpes") return getMoodCooldown(unit, 3);
    if (unit.id === "rihas") return getMoodCooldown(unit, 4);
    if (unit.id === "sushia") return getMoodCooldown(unit, 5);
    if (unit.role === "caster") return CASTER_ACTION_CD;
    if (unit.team === "enemy") return ENEMY_NORMAL_ATTACK_CD;
    return 1.5;
  }

  function setActionCooldown(unit) {
    unit.cds.attack = Math.max(unit.cds.attack || 0, getActionCooldown(unit));
  }

  function moodLerp(mood, leftMood, leftValue, rightMood, rightValue) {
    const ratio = clamp((mood - leftMood) / (rightMood - leftMood), 0, 1);
    return leftValue + (rightValue - leftValue) * ratio;
  }

  function getMoodNaturalFall(unit) {
    const ratio = clamp(unit.noDamage / MOOD_NATURAL_FALL_MIN_TIME, 0, 1);
    return moodLerp(ratio, 0, MOOD_NATURAL_FALL, 1, MOOD_NATURAL_FALL_MIN);
  }

  function getMoodGainMultiplier(unit) {
    if (!unit || unit.mood === null) return 1;
    if (unit.noDamage <= MOOD_NO_DAMAGE_GAIN_BONUS_START) return 1;
    return moodLerp(unit.noDamage, MOOD_NO_DAMAGE_GAIN_BONUS_START, 1, MOOD_NO_DAMAGE_GAIN_BONUS_MAX_TIME, MOOD_NO_DAMAGE_GAIN_BONUS_MAX);
  }

  function addMoodGain(unit, amount) {
    if (!unit || unit.mood === null || amount <= 0) {
      return 0;
    }
    const adjusted = amount * getMoodGainMultiplier(unit);
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
    const lines = SKILL_LINES[unit.id] && SKILL_LINES[unit.id][skillKey];
    if (!lines || lines.length === 0) {
      return;
    }
    const line = lines[Math.floor(Math.random() * lines.length)];
    addSpeech(line, unit);
  }
  function useUlpesNormal(unit, target) {
    speakSkill(unit, "attack");
    setActionCooldown(unit);
    unit.actionLock = ACTION_GAP;
    unit.aimAngle = angleTo(unit, target);
    for (let i = 0; i < 3; i += 1) {
      setTimeout(() => {
        if (!unit.dead && !target.dead && dist(unit, target) <= 62) {
          dealDamage(unit, target, 8 + unit.attack * 0.38, { crit: true });
          slashEffect(unit, target);
        }
      }, i * 120);
    }
  }

  function useUlpesHeroSlash(unit, target) {
    speakSkill(unit, "heroSlash");
    setActionCooldown(unit);
    unit.cds.heroSlash = getMoodCooldown(unit, 10);
    unit.actionLock = 0.62 + ACTION_GAP;
    unit.aimAngle = angleTo(unit, target);
    addTelegraph({
      type: "fan",
      source: unit,
      x: unit.x,
      y: unit.y,
      radius: 122,
      angle: unit.aimAngle,
      arc: deg(200),
      team: "party",
      time: 0.62,
      getPosition: () => ({ x: unit.x, y: unit.y }),
      getAngle: () => target.dead ? unit.aimAngle : angleTo(unit, target),
      resolve: () => {
        let hits = 0;
        unit.aimAngle = target.dead ? unit.aimAngle : angleTo(unit, target);
        for (const unitHit of [...enemies, ...party]) {
          if (unitHit.dead || unitHit === unit) {
            continue;
          }
          if (inFan(unitHit, unit.x, unit.y, 122, unit.aimAngle, deg(200))) {
            dealDamage(unit, unitHit, 18 + unit.attack * 0.7, { crit: true });
            hits += unitHit.team === "enemy" ? 1 : 0;
          }
        }
        applyMultiHitMoodBonus(unit, hits);
        unit.cds.heroSlash = Math.max(1.5, unit.cds.heroSlash - hits * 0.5);
        addBurst(unit.x, unit.y, 116, "rgba(244,197,79,0.22)");
      },
    });
  }
  function useRihasNormal(unit) {
    speakSkill(unit, "attack");
    setActionCooldown(unit);
    unit.actionLock = 0.38 + ACTION_GAP;
    addTelegraph({
      type: "circle",
      x: unit.x,
      y: unit.y,
      radius: 66,
      team: "party",
      time: 0.38,
      getPosition: () => ({ x: unit.x, y: unit.y }),
      resolve: () => {
        let hits = 0;
        for (const unitHit of [...enemies, ...party]) {
          if (unitHit.dead || unitHit === unit) {
            continue;
          }
          if (distPoint(unitHit.x, unitHit.y, unit.x, unit.y) <= 66 + unitHit.radius) {
            dealDamage(unit, unitHit, 16 + unit.attack * 0.55);
            hits += unitHit.team === "enemy" ? 1 : 0;
          }
        }
        applyMultiHitMoodBonus(unit, hits);
        addBurst(unit.x, unit.y, 72, "rgba(227,122,63,0.25)");
      },
    });
  }
  function useRihasJump(unit, target) {
    speakSkill(unit, "quake");
    setActionCooldown(unit);
    unit.cds.quake = getMoodCooldown(unit, 13);
    unit.actionLock = 0.82 + ACTION_GAP;
    const dir = normalize(target.x - unit.x, target.y - unit.y);
    const landing = {
      x: clamp(target.x - dir.x * 18, 45, view.w - 45),
      y: clamp(target.y - dir.y * 18, 45, view.h - 45),
    };
    const getLanding = () => {
      const currentDir = normalize(target.x - unit.x, target.y - unit.y);
      return {
        x: clamp(target.x - currentDir.x * 18, 45, view.w - 45),
        y: clamp(target.y - currentDir.y * 18, 45, view.h - 45),
      };
    };
    const telegraph = {
      type: "circle",
      x: landing.x,
      y: landing.y,
      radius: 92,
      team: "party",
      time: 0.82,
      getPosition: getLanding,
      resolve: () => {
        if (unit.dead) {
          return;
        }
        const currentLanding = { x: telegraph.x, y: telegraph.y };
        let hits = 0;
        unit.x = currentLanding.x;
        unit.y = currentLanding.y;
        for (const unitHit of [...enemies, ...party]) {
          if (unitHit.dead || unitHit === unit) {
            continue;
          }
          const d = distPoint(unitHit.x, unitHit.y, currentLanding.x, currentLanding.y);
          if (d <= 92 + unitHit.radius) {
            dealDamage(unit, unitHit, 22 + unit.attack * 0.8);
            hits += unitHit.team === "enemy" ? 1 : 0;
          } else if (d <= 160 + unitHit.radius) {
            dealDamage(unit, unitHit, 10 + unit.attack * 0.25, { magic: true });
            hits += unitHit.team === "enemy" ? 1 : 0;
          }
        }
        applyMultiHitMoodBonus(unit, hits);
        addBurst(currentLanding.x, currentLanding.y, 158, "rgba(227,122,63,0.18)");
      },
    };
    addTelegraph(telegraph);
  }
  function useSushiaBolts(unit, target) {
    setActionCooldown(unit);
    const cast = getSushiaCastTime(1, unit);
    unit.actionLock = cast + ACTION_GAP;
    addTelegraph({
      type: "line",
      x: unit.x,
      y: unit.y,
      x2: target.x,
      y2: target.y,
      width: 16,
      team: "party",
      time: cast,
      getLine: () => ({ x: unit.x, y: unit.y, x2: target.x, y2: target.y }),
      resolve: () => {
        speakSkill(unit, "attack");
        for (let i = 0; i < 3; i += 1) {
          const spread = (i - 1) * 0.08;
          const angle = angleTo(unit, target) + spread;
          projectiles.push({
            x: unit.x,
            y: unit.y,
            vx: Math.cos(angle) * 360,
            vy: Math.sin(angle) * 360,
            radius: 5,
            team: "party",
            owner: unit,
            damage: 10 + unit.magic * 0.35,
            magic: true,
            life: 1.4,
            hit: new Set(),
            pierce: false,
            color: "#d9afff",
          });
        }
      },
    });
  }

  function useSushiaBomb(unit, target) {
    setActionCooldown(unit);
    unit.cds.bomb = getMoodCooldown(unit, 15);
    const cast = getSushiaCastTime(3, unit);
    unit.actionLock = cast + ACTION_GAP;
    const telegraph = {
      type: "circle",
      x: target.x,
      y: target.y,
      radius: 108,
      team: "party",
      time: cast,
      getPosition: () => ({ x: target.x, y: target.y }),
      resolve: () => {
        speakSkill(unit, "bomb");
        const impact = { x: telegraph.x, y: telegraph.y };
        let hits = 0;
        for (const unitHit of [...enemies, ...party]) {
          if (unitHit.dead || unitHit === unit) {
            continue;
          }
          const d = distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
          if (d <= 108 + unitHit.radius) {
            const nearCenter = d <= 32 + unitHit.radius;
            dealDamage(unit, unitHit, nearCenter ? 32 + unit.magic * 0.95 : 16 + unit.magic * 0.48, { magic: true });
            hits += unitHit.team === "enemy" ? 1 : 0;
          }
        }
        applyMultiHitMoodBonus(unit, hits);
        addBurst(impact.x, impact.y, 118, "rgba(185,133,238,0.28)");
      },
    };
    addTelegraph(telegraph);
  }

  function startPlayerAim(type) {
    if (player.dead || player.channel || player.cast || player.frozen > 0) {
      return false;
    }
    player.aim = { type };
    game.hover = getHoveredPartyMember();
    return true;
  }

  function cancelPlayerAim() {
    player.aim = null;
  }

  function confirmPlayerAim() {
    if (!player.aim || player.dead || player.channel || player.cast || player.frozen > 0) {
      return false;
    }
    game.hover = getHoveredPartyMember();
    if (player.aim.type === "attack") {
      return firePlayerShot();
    }
    if (player.aim.type === "heal") {
      return castHeal();
    }
    if (player.aim.type === "shield") {
      return castShield();
    }
    return false;
  }

  function isPlayerGuarding() {
    return Boolean(input.keys.space);
  }
  function firePlayerShot() {
    if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) {
      return false;
    }
    if ((player.cds.attack || 0) > 0) {
      addFloat("再詠唱中", player.x, player.y - 28, "#ffffff");
      return false;
    }
    if (player.mp < PLAYER_ATTACK_COST) {
      addFloat("魔力不足", player.x, player.y - 28, "#ffffff");
      return false;
    }
    const dir = normalize(input.mouse.x - player.x, input.mouse.y - player.y);
    if (dir.len === 0) {
      return false;
    }
    if (!startPlayerCast("attack", { dir }, PLAYER_ATTACK_CAST)) {
      return false;
    }
    player.mp -= PLAYER_ATTACK_COST;
    player.cds.attack = PLAYER_ATTACK_CD;
    return true;
  }

  function completePlayerShot(lockedDir) {
    const dir = lockedDir && lockedDir.len !== 0 ? lockedDir : normalize(input.mouse.x - player.x, input.mouse.y - player.y);
    if (dir.len === 0) {
      return;
    }
    speakSkill(player, "attack");
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: dir.x * 260,
      vy: dir.y * 260,
      radius: 12,
      team: "party",
      owner: player,
      damage: 16 + player.magic * 0.28,
      magic: true,
      life: PLAYER_ATTACK_RANGE / 260,
      hit: new Set(),
      pierce: true,
      affectsAllies: true,
      healAllies: true,
      heal: 16 + player.magic * 0.28,
      color: "#9ef7ff",
    });
  }

  function castHeal() {
    if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) {
      return false;
    }
    const target = game.hover;
    if (!target || target.dead || target.team !== "party") {
      addFloat("対象なし", input.mouse.x, input.mouse.y - 12, "#ffffff");
      return false;
    }
    if ((player.cds.heal || 0) > 0) {
      addFloat("再詠唱中", target.x, target.y - 28, "#ffffff");
      return false;
    }
    if (player.mp < HEAL_COST) {
      addFloat("魔力不足", player.x, player.y - 28, "#ffffff");
      return false;
    }
    if (dist(player, target) > HEAL_RANGE) {
      addFloat("届かない", target.x, target.y - 28, "#ffffff");
      return false;
    }
    if (!startPlayerCast("heal", { target }, HEAL_CAST)) {
      return false;
    }
    player.mp -= HEAL_COST;
    player.cds.heal = HEAL_CD;
    return true;
  }

  function completeHeal(target) {
    if (!target || target.dead || target.team !== "party" || dist(player, target) > HEAL_RANGE) {
      addFloat("対象なし", player.x, player.y - 28, "#ffffff");
      return;
    }
    speakSkill(player, "heal");
    healUnit(player, target, 38 + player.magic * 0.55, { noMood: target === player });
    effects.push({
      type: "beam",
      x: player.x,
      y: player.y,
      x2: target.x,
      y2: target.y,
      color: "rgba(151,247,255,0.72)",
      time: 0.24,
      age: 0,
    });
  }

  function castShield() {
    if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) {
      return false;
    }
    if ((player.cds.shield || 0) > 0) {
      addFloat("再詠唱中", player.x, player.y - 28, "#ffffff");
      return false;
    }
    if (player.mp < SHIELD_COST) {
      addFloat("魔力不足", player.x, player.y - 28, "#ffffff");
      return false;
    }
    const x = clamp(input.mouse.x, 35, view.w - 35);
    const y = clamp(input.mouse.y, 35, view.h - 35);
    if (distPoint(player.x, player.y, x, y) > SHIELD_RANGE) {
      addFloat("届かない", x, y - 18, "#ffffff");
      return false;
    }
    if (!startPlayerCast("shield", { x, y }, SHIELD_CAST)) {
      return false;
    }
    player.mp -= SHIELD_COST;
    player.cds.shield = SHIELD_CD;
    return true;
  }

  function completeShield(x, y) {
    speakSkill(player, "shield");
    let applied = 0;
    for (const member of party) {
      if (!member.dead && distPoint(member.x, member.y, x, y) <= SHIELD_RADIUS + member.radius) {
        member.shield = Math.max(member.shield, 40 + player.magic * 0.45);
        member.shieldTimer = 6;
        if (member !== player) {
          addMoodGain(member, 4 * MOOD_EVENT_MULT);
        }
        applied += 1;
      }
    }
    player.ult = clamp(player.ult + applied * 4, 0, 100);
    addTelegraph({
      type: "circle",
      x,
      y,
      radius: SHIELD_RADIUS,
      team: "support",
      time: 0.18,
      resolve: () => {},
    });
    addBurst(x, y, SHIELD_RADIUS + 4, "rgba(143,233,255,0.25)");
  }

  function triggerUltimate(id, automatic = false) {
    const unit = party.find((member) => member.id === id);
    if (!unit || unit.dead || unit.frozen > 0 || unit.ult < 100 || unit.actionLock > 0 || unit.cast) {
      return false;
    }
    if (unit.id !== "finald" && unit.mood !== null && unit.mood <= 40) {
      addFloat("不調", unit.x, unit.y - 34, "#cfd5e6");
      return false;
    }
    unit.ult = 0;
    if (id === "ulpes") {
      ultUlpes(unit, automatic);
    } else if (id === "rihas") {
      ultRihas(unit);
    } else if (id === "sushia") {
      ultSushia(unit, automatic);
    } else if (id === "finald") {
      ultFinald();
    }
    return true;
  }

  function ultUlpes(unit, automatic) {
    const target = nearestAlive(unit, enemies);
    if (!target) {
      return;
    }
    speakSkill(unit, "ult");
    unit.actionLock = (automatic ? 0.45 : 0.7) + ACTION_GAP;
    const telegraph = {
      type: "circle",
      x: target.x,
      y: target.y,
      radius: 72,
      team: "party",
      time: automatic ? 0.45 : 0.7,
      getPosition: () => ({ x: target.x, y: target.y }),
      resolve: () => {
        if (unit.dead || target.dead) {
          return;
        }
        const impact = { x: telegraph.x, y: telegraph.y };
        let hits = 0;
        unit.x = clamp(impact.x + 22, 35, view.w - 35);
        unit.y = impact.y;
        for (const unitHit of [...enemies, ...party]) {
          if (unitHit.dead || unitHit === unit) {
            continue;
          }
          const d = distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
          if (d <= 70 + unitHit.radius) {
            const base = unitHit.team === "enemy" ? 74 + unit.attack * 1.4 : (74 + unit.attack * 1.4) / 4;
            dealDamage(unit, unitHit, automatic ? base * 0.65 : base);
            hits += unitHit.team === "enemy" ? 1 : 0;
          }
        }
        applyMultiHitMoodBonus(unit, hits);
        addBurst(impact.x, impact.y, 84, "rgba(244,197,79,0.32)");
      },
    };
    addTelegraph(telegraph);
  }
  function ultRihas(unit) {
    speakSkill(unit, "ult");
    unit.actionLock = ACTION_GAP;
    let taunted = 0;
    for (const enemy of enemies) {
      if (!enemy.dead && dist(unit, enemy) <= 260) {
        enemy.forcedTarget = unit;
        enemy.tauntTimer = 5.5;
        taunted += 1;
      }
    }
    unit.shield = Math.max(unit.shield, 25 + taunted * 8);
    unit.shieldTimer = 5.5;
    addBurst(unit.x, unit.y, 270, "rgba(227,122,63,0.18)");
  }

  function ultSushia(unit, automatic) {
    const cast = automatic ? getSushiaCastTime(3.5, unit) : getSushiaCastTime(7, unit);
    unit.actionLock = cast + ACTION_GAP;
    addTelegraph({
      type: "circle",
      x: unit.x,
      y: unit.y,
      radius: SUSHIA_ICE_WORLD_RADIUS,
      team: "party",
      time: cast,
      getPosition: () => ({ x: unit.x, y: unit.y }),
      resolve: () => {
        speakSkill(unit, "ult");
        const frozen = new Set();
        let multiHitAwarded = false;
        areas.push({
          type: "ice",
          x: unit.x,
          y: unit.y,
          radius: SUSHIA_ICE_WORLD_RADIUS,
          time: automatic ? 2.6 : 4.2,
          tick: 0,
          tickRate: 0.4,
          apply: () => {
            let hits = 0;
            for (const unitHit of [...enemies, ...party]) {
              if (unitHit.dead || unitHit === unit) {
                continue;
              }
              const d = distPoint(unitHit.x, unitHit.y, unit.x, unit.y);
              if (d <= SUSHIA_ICE_WORLD_RADIUS + unitHit.radius) {
                if (!frozen.has(unitHit)) {
                  unitHit.frozen = Math.max(unitHit.frozen, automatic ? 1.1 : 2);
                  frozen.add(unitHit);
                }
                const scale = 1 - clamp(d / SUSHIA_ICE_WORLD_RADIUS, 0, 0.8);
                dealDamage(unit, unitHit, (8 + unit.magic * 0.22) * scale, { magic: true });
                hits += unitHit.team === "enemy" ? 1 : 0;
              }
            }
            if (!multiHitAwarded && hits >= MOOD_MULTI_HIT_MIN) {
              applyMultiHitMoodBonus(unit, hits);
              multiHitAwarded = true;
            }
          },
        });
      },
    });
  }
  function ultFinald() {
    if (player.channel || player.cast || player.actionLock > 0) {
      return;
    }
    player.channel = { time: 5.5, pulse: 0 };
    player.actionLock = ACTION_GAP;
    speakSkill(player, "ult");
  }

  function enemyBite(enemy, target) {
    setActionCooldown(enemy);
    enemy.actionLock = 0.32 + ACTION_GAP;
    const telegraph = {
      type: "circle",
      x: target.x,
      y: target.y,
      radius: 42,
      team: "enemy",
      time: 0.32,
      getPosition: () => ({ x: target.x, y: target.y }),
      resolve: () => {
        const impact = { x: telegraph.x, y: telegraph.y };
        for (const member of party) {
          if (!member.dead && distPoint(member.x, member.y, impact.x, impact.y) <= 42 + member.radius) {
            dealDamage(enemy, member, enemy.attack + 8);
          }
        }
      },
    };
    addTelegraph(telegraph);
  }

  function enemyLineAttack(enemy, target) {
    setActionCooldown(enemy);
    enemy.cds.skill = CASTER_SKILL_CD_BASE + Math.random() * CASTER_SKILL_CD_RANDOM;
    enemy.actionLock = 0.86 + ACTION_GAP;
    const getLine = () => {
      const end = projectPoint(enemy, target, 620);
      return { x: enemy.x, y: enemy.y, x2: end.x, y2: end.y };
    };
    const initial = getLine();
    const telegraph = {
      type: "line",
      x: initial.x,
      y: initial.y,
      x2: initial.x2,
      y2: initial.y2,
      width: 26,
      team: "enemy",
      time: 0.86,
      getLine,
      resolve: () => {
        for (const member of party) {
          if (!member.dead && distanceToSegment(member.x, member.y, telegraph.x, telegraph.y, telegraph.x2, telegraph.y2) <= 18 + member.radius) {
            dealDamage(enemy, member, enemy.attack + 17, { magic: true });
          }
        }
      },
    };
    addTelegraph(telegraph);
  }

  function enemyHeavySlam(enemy, target) {
    setActionCooldown(enemy);
    enemy.cds.skill = HEAVY_SLAM_CD;
    enemy.actionLock = 0.95 + ACTION_GAP;
    const telegraph = {
      type: "circle",
      x: target.x,
      y: target.y,
      radius: 98,
      team: "enemy",
      time: 0.95,
      getPosition: () => ({ x: target.x, y: target.y }),
      resolve: () => {
        const impact = { x: telegraph.x, y: telegraph.y };
        for (const member of party) {
          if (!member.dead && distPoint(member.x, member.y, impact.x, impact.y) <= 98 + member.radius) {
            dealDamage(enemy, member, enemy.attack + 20);
          }
        }
        addBurst(impact.x, impact.y, 110, "rgba(201,93,78,0.22)");
      },
    };
    addTelegraph(telegraph);
  }

  function dealDamage(source, target, amount, options = {}) {
    if (!target || target.dead) {
      return 0;
    }

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
        addMoodGain(source, rewardDamage * 0.035 * MOOD_EVENT_MULT * distanceMult);
      }
    }

    if (target.team === "party" && target.id !== "finald") {
      target.ult = clamp(target.ult + rewardDamage * 0.16, 0, 100);
      target.mood = clamp(target.mood - rewardDamage * 0.045 * MOOD_EVENT_MULT, 0, 100);
    }

    if (target.hp <= 0) {
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
      const quickBonus = target.noDamage < 3 ? 5 * MOOD_EVENT_MULT : 0;
      addMoodGain(target, healed * 0.12 * MOOD_EVENT_MULT + quickBonus);
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
    if (party.some((member) => member.dead)) {
      game.state = "lost";
      game.message = "戦闘不能者が出た";
      game.messageTimer = 999;
      return;
    }
    if (enemies.every((enemy) => enemy.dead)) {
      game.stageClearTimer += 1 / 60;
      game.state = "won";
      game.message = "依頼達成";
      game.messageTimer = 999;
    }
  }

  function getHoveredPartyMember() {
    let best = null;
    let bestDist = Infinity;
    for (const member of party) {
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
    addFloat("中断", player.x, player.y - 32, "#ffffff");
  }

  function cancelPlayerCast() {
    const cast = player.cast;
    player.cast = null;
    applyInterruptedPlayerCastCooldown(cast);
    player.actionLock = Math.max(player.actionLock, ACTION_GAP);
    addFloat("詠唱中断", player.x, player.y - 32, "#ffffff");
  }

  function applyInterruptedPlayerCastCooldown(cast) {
    const cooldown = getPlayerCastCooldown(cast && cast.type);
    if (!cooldown) {
      return;
    }
    player.cds[cooldown.key] = cooldown.max * (1 - INTERRUPTED_CAST_COOLDOWN_REDUCTION);
  }

  function getPlayerCastCooldown(type) {
    if (type === "attack") return { key: "attack", max: PLAYER_ATTACK_CD };
    if (type === "heal") return { key: "heal", max: HEAL_CD };
    if (type === "shield") return { key: "shield", max: SHIELD_CD };
    return null;
  }

  function draw() {
    ctx.clearRect(0, 0, view.w, view.h);
    if (game.state === "town") {
      drawTown();
      drawEffects();
      return;
    }
    drawFloor();
    drawAreas();
    drawTelegraphs();
    drawPlayerAimPreview();
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
    drawTownNpc(710, 705, COLORS.ulpes, "ウ");
    drawTownNpc(770, 735, COLORS.rihas, "リ");
    drawTownNpc(845, 710, COLORS.sushia, "ス");
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
    ctx.fillText("フ", unit.x, unit.y + 1);

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

  function drawFloor() {
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, view.w, view.h);

    const grid = 56;
    ctx.strokeStyle = COLORS.floorLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = (game.time * -8) % grid; x < view.w; x += grid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, view.h);
    }
    for (let y = (game.time * -4) % grid; y < view.h; y += grid) {
      ctx.moveTo(0, y);
      ctx.lineTo(view.w, y);
    }
    ctx.stroke();
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
    if (!player.aim || player.dead) {
      return;
    }

    ctx.save();
    if (player.aim.type === "attack") {
      const dir = normalize(input.mouse.x - player.x, input.mouse.y - player.y);
      if (dir.len > 0) {
        const endX = player.x + dir.x * PLAYER_ATTACK_RANGE;
        const endY = player.y + dir.y * PLAYER_ATTACK_RANGE;
        drawAimRangeCircle(player.x, player.y, PLAYER_ATTACK_RANGE, "rgba(158,247,255,0.22)");
        ctx.strokeStyle = "rgba(158,247,255,0.24)";
        ctx.lineWidth = 26;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.strokeStyle = "#9ef7ff";
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (player.aim.type === "heal") {
      drawAimRangeCircle(player.x, player.y, HEAL_RANGE, "rgba(121,255,141,0.24)");
      const target = game.hover;
      if (target && target.team === "party" && !target.dead) {
        const inRange = dist(player, target) <= HEAL_RANGE;
        ctx.strokeStyle = inRange ? "#79ff8d" : "#ff6a5c";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius + 15, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = inRange ? 0.72 : 0.35;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    } else if (player.aim.type === "shield") {
      drawAimRangeCircle(player.x, player.y, SHIELD_RANGE, "rgba(143,233,255,0.22)");
      const x = clamp(input.mouse.x, 35, view.w - 35);
      const y = clamp(input.mouse.y, 35, view.h - 35);
      const inRange = distPoint(player.x, player.y, x, y) <= SHIELD_RANGE;
      ctx.fillStyle = inRange ? "rgba(143,233,255,0.18)" : "rgba(255,92,78,0.14)";
      ctx.strokeStyle = inRange ? "#8fe9ff" : "#ff6a5c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, SHIELD_RADIUS, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
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
    const units = [...enemies, ...party].filter((unit) => !unit.dead);
    units.sort((a, b) => a.y - b.y);
    for (const unit of units) {
      drawUnit(unit);
    }
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
      ctx.strokeStyle = mood > 80 ? COLORS.moodHigh : COLORS.mood;
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
    }

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
      drawBar(barX, y + 25, barW, 6, unit.mood / 100, "#2b2615", unit.mood > 80 ? COLORS.moodHigh : COLORS.mood);
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
    const skills = [
      { name: "援護射撃", cd: player.cds.attack || 0, max: PLAYER_ATTACK_CD },
      { name: "ヒール", cd: player.cds.heal || 0, max: HEAL_CD },
      { name: "シールド", cd: player.cds.shield || 0, max: SHIELD_CD },
      { name: "フルヒール", cd: player.ult < 100 ? 100 - player.ult : 0, max: 100, gauge: true },
    ];
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
    const all = [...party, ...enemies].filter((unit) => !unit.dead);
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
      if (unit.dead) {
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
      clampUnit(unit);
    }
  }

  function clampUnit(unit) {
    if (!unit) return;
    unit.x = clamp(unit.x, 24 + unit.radius, view.w - 24 - unit.radius);
    unit.y = clamp(unit.y, 24 + unit.radius, view.h - 24 - unit.radius);
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
