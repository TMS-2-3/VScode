(() => {
  "use strict";

  window.createHealerUnitFactory = function createHealerUnitFactory(context) {
    const {
      CHARACTER_DEFS,
      ENEMY_DEFS,
      MOOD_REFERENCE_HP_BY_ID,
      MOOD_INITIAL,
      DEFAULT_MP_REGEN_RATE,
      battlePx,
      getSkillSystem,
      getActionCooldown,
    } = context;

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
        mpRegenRate: Number.isFinite(options.mpRegenRate) ? options.mpRegenRate : DEFAULT_MP_REGEN_RATE,
        speed: options.speed || battlePx(100),
        attack: options.attack || 10,
        magic: options.magic || 10,
        defense: options.defense || 0,
        magicDefense: options.magicDefense || 0,
        guardChance: options.guardChance || 0,
        commandBias: 0,
        activeCommandBias: 0,
        commandBiasActionCount: 0,
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
      const skillSystem = getSkillSystem();
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

    return {
      makeUnit,
      makePartyMember,
      makeEnemy,
    };
  };
})();
