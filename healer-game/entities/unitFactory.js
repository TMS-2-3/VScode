(() => {
  "use strict";

  window.createHealerUnitFactory = function createHealerUnitFactory(context) {
    const {
      CHARACTER_DEFS,
      ENEMY_DEFS,
      MOOD_REFERENCE_HP_BY_ID,
      MOOD_INITIAL,
      DEFAULT_MP_REGEN_RATE,
      BASE_CRIT_CHANCE,
      BASE_CRIT_DAMAGE_RATE,
      battlePx,
      getSkillSystem,
      getActionCooldown,
      getDefaultLoadout,
      normalizeLoadout,
      getEmptyEquipment,
      normalizeEquipment,
    } = context;

    function makeUnit(options) {
      const skillOwner = options.skillOwner || options.id;
      const unit = {
        id: options.id,
        skillOwner,
        name: options.name,
        label: options.label || "?",
        team: options.team,
        role: options.role,
        x: options.x || 0,
        y: options.y || 0,
        radius: options.radius || battlePx(14),
        color: options.color || "#ffffff",
        element: "none",
        elementBoosts: {},
        elementResistances: {},
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
        physicalDamageBoost: Number.isFinite(options.physicalDamageBoost) ? options.physicalDamageBoost : 0,
        magicDamageBoost: Number.isFinite(options.magicDamageBoost) ? options.magicDamageBoost : 0,
        physicalDamageResistance: Number.isFinite(options.physicalDamageResistance) ? options.physicalDamageResistance : 0,
        magicDamageResistance: Number.isFinite(options.magicDamageResistance) ? options.magicDamageResistance : 0,
        critChance: Number.isFinite(options.critChance) ? options.critChance : BASE_CRIT_CHANCE,
        critDamage: Number.isFinite(options.critDamage) ? options.critDamage : BASE_CRIT_DAMAGE_RATE,
        castSpeed: Number.isFinite(options.castSpeed) ? options.castSpeed : 0,
        guardChance: options.guardChance || 0,
        commandBias: 0,
        activeCommandBias: 0,
        commandBiasActionCount: 0,
        preferredRange: options.preferredRange || 90,
        mood: options.team === "party" && options.id !== "finald" ? MOOD_INITIAL : null,
        ult: 0,
        shield: 0,
        shieldTimer: 0,
        shields: [],
        cds: {},
        loadout: options.loadout ? normalizeLoadout(skillOwner, options.loadout) : getDefaultLoadout(skillOwner),
        equipment: getEmptyEquipment(),
        actionLock: 0,
        actionTotal: 0,
        aiTick: 0,
        aiIntent: null,
        skillQueue: [],
        usedSkillKeys: {},
        skillCooldownKeys: {},
        pendingActionQueueKey: null,
        hurt: 0,
        guardFlash: 0,
        frozen: 0,
        frozenMax: 0,
        burnTimer: 0,
        burnMax: 0,
        burnTick: 0,
        burnTickRate: 1,
        burnDamageHpRatio: 0,
        burnSource: null,
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
      unit.equipment = normalizeEquipment(options.equipment || {}, unit);
      return unit;
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
        skillOwner: "enemy",
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
        element: stats.element,
        elementBoosts: stats.elementBoosts,
        elementResistances: stats.elementResistances,
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
