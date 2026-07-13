(() => {
  "use strict";

  window.createHealerBattleSetup = function createHealerBattleSetup(context) {
    const {
      game,
      player,
      party,
      enemies,
      projectiles,
      telegraphs,
      areas,
      effects,
      expandedStatusUnitIds,
      STATUS_DATA,
      COLORS,
      battlePx,
      getBattleBounds,
      getSupportOrigin,
      makePartyMember,
      makeEnemy,
      getUltimateCost,
      getEffectiveStat,
      normalizeEquipment,
      normalizeLoadout,
      clampBattlePoint,
      clampAllUnits,
      addBurst,
      addFloat,
    } = context;

    const INCAPACITATED_HP_RECOVERY_RATIO = 0.2;
    const BATTLE_START_ULTIMATE_RATIO = 0.5;
    const CARRYOVER_STATUS_IDS = ["buff_itaminasi", "buff_warmup", "debuff_taunt", "debuff_freeze", "debuff_burn", "debuff_sleep", "debuff_Injury", "debuff_poison", "debuff_wound"];

    function getCarriedHp(unit) {
      const savedHp = game.partyHpById && game.partyHpById[unit.id];
      const carriedDead = Boolean(game.partyDeadById && game.partyDeadById[unit.id]);
      const minRecoveredHp = unit.maxHp * INCAPACITATED_HP_RECOVERY_RATIO;
      if (!Number.isFinite(savedHp)) {
        return carriedDead ? minRecoveredHp : unit.maxHp;
      }
      const hp = savedHp <= 0 || carriedDead ? Math.max(savedHp, minRecoveredHp) : savedHp;
      return Math.max(0, Math.min(unit.maxHp, hp));
    }

    function getCarriedMp(unit) {
      const maxMp = Math.max(0, Number.isFinite(unit.maxMp) ? unit.maxMp : 0);
      const savedMp = game.partyMpById && game.partyMpById[unit.id];
      if (!Number.isFinite(savedMp)) {
        return maxMp;
      }
      return Math.max(0, Math.min(maxMp, savedMp));
    }

    function applyStoredPartyConfig(unit) {
      if (!unit || !unit.id) {
        return;
      }
      const storedEquipment = game.partyEquipmentById && game.partyEquipmentById[unit.id];
      if (storedEquipment && typeof normalizeEquipment === "function") {
        unit.equipment = normalizeEquipment(storedEquipment, unit);
      }
      const storedLoadout = game.partyLoadoutById && game.partyLoadoutById[unit.id];
      if (storedLoadout && typeof normalizeLoadout === "function") {
        unit.loadout = normalizeLoadout(unit.skillOwner || unit.id, storedLoadout);
      }
    }

    function applyCarriedHp(unit) {
      unit.hp = getCarriedHp(unit);
      unit.mp = getCarriedMp(unit);
      unit.dead = Boolean(game.partyDeadById && game.partyDeadById[unit.id]) || unit.hp <= 0;
      if (unit.dead && unit.team === "party" && unit.id !== "finald" && unit.mood !== null) {
        unit.mood = 0;
        unit.moodActionGain = 0;
      }
    }

    function applyCarriedStatuses(unit) {
      resetUnitCarryoverStatusFields(unit);
      if (!unit || !unit.id || !game.partyStatusById || typeof game.partyStatusById !== "object") {
        return;
      }
      const statuses = game.partyStatusById[unit.id];
      if (!statuses || typeof statuses !== "object") {
        return;
      }
      const rihasPassive = statuses.buff_itaminasi;
      if (isStatusCarryover("buff_itaminasi") && rihasPassive && rihasPassive.timer > 0 && rihasPassive.stacks > 0) {
        unit.rihasPassiveStacks = Math.max(0, Math.floor(rihasPassive.stacks || 0));
        unit.rihasPassiveTimer = Math.max(0, rihasPassive.timer || 0);
        unit.rihasPassiveStackCooldown = Math.max(0, rihasPassive.cooldown || 0);
      }
      const warmup = statuses.buff_warmup;
      if (isStatusCarryover("buff_warmup") && warmup && warmup.timer > 0 && warmup.stacks > 0) {
        unit.castStacks = Math.max(0, Math.floor(warmup.stacks || 0));
        unit.stackTimer = Math.max(0, warmup.timer || 0);
        unit.stackCooldown = Math.max(0, warmup.cooldown || 0);
      }
      const taunt = statuses.debuff_taunt;
      if (isStatusCarryover("debuff_taunt") && taunt && taunt.timer > 0 && taunt.forcedTargetId) {
        const forcedTarget = findBattleUnitById(taunt.forcedTargetId);
        if (forcedTarget && forcedTarget !== unit && !forcedTarget.dead) {
          unit.forcedTarget = forcedTarget;
          unit.tauntTimer = Math.max(0, taunt.timer || 0);
        }
      }
      const freeze = statuses.debuff_freeze;
      if (isStatusCarryover("debuff_freeze") && freeze && freeze.timer > 0) {
        unit.frozen = Math.max(0, freeze.timer || 0);
        unit.frozenMax = Math.max(unit.frozen, freeze.max || 0);
      }
      const burn = statuses.debuff_burn;
      if (isStatusCarryover("debuff_burn") && burn && burn.timer > 0) {
        unit.burnTimer = Math.max(0, burn.timer || 0);
        unit.burnMax = Math.max(unit.burnTimer, burn.max || 0);
        unit.burnTick = Math.max(0, burn.tick || 0);
        unit.burnTickRate = Math.max(0.1, burn.tickRate || 1);
        unit.burnDamageHpRatio = Math.max(0, burn.damageHpRatio || 0.01);
        unit.burnSource = null;
      }
      const sleep = statuses.debuff_sleep;
      if (isStatusCarryover("debuff_sleep") && sleep && sleep.timer > 0) {
        unit.sleepTimer = Math.max(0, sleep.timer || 0);
        unit.sleepMax = Math.max(unit.sleepTimer, sleep.max || 0);
      }
      const injury = statuses.debuff_Injury || statuses.Injury;
      if (isStatusCarryover("debuff_Injury") && injury && injury.timer > 0) {
        unit.injuryTimer = Math.max(0, injury.timer || 0);
        unit.injuryMax = Math.max(unit.injuryTimer, injury.max || 0);
      }
      const poison = statuses.debuff_poison;
      if (isStatusCarryover("debuff_poison") && poison && poison.active) {
        unit.poisonActive = true;
        unit.poisonTick = Math.max(0, poison.tick || 0);
        unit.poisonTickRate = Math.max(0.1, poison.tickRate || 1);
        unit.poisonDamageHpRatio = Math.max(0, poison.damageHpRatio || 0.01);
        unit.poisonSource = null;
      }
      const wound = statuses.debuff_wound;
      if (isStatusCarryover("debuff_wound") && wound && wound.stacks > 0) {
        unit.woundStacks = Math.max(0, Math.floor(wound.stacks || 0));
      }
    }

    function resetUnitCarryoverStatusFields(unit) {
      if (!unit) {
        return;
      }
      unit.rihasPassiveStacks = 0;
      unit.rihasPassiveTimer = 0;
      unit.rihasPassiveStackCooldown = 0;
      unit.castStacks = 0;
      unit.stackTimer = 0;
      unit.stackCooldown = 0;
      unit.forcedTarget = null;
      unit.tauntTimer = 0;
      unit.frozen = 0;
      unit.frozenMax = 0;
      unit.burnTimer = 0;
      unit.burnMax = 0;
      unit.burnTick = 0;
      unit.burnTickRate = 1;
      unit.burnDamageHpRatio = 0;
      unit.burnSource = null;
      unit.sleepTimer = 0;
      unit.sleepMax = 0;
      unit.poisonActive = false;
      unit.poisonTick = 0;
      unit.poisonTickRate = 1;
      unit.poisonDamageHpRatio = 0;
      unit.poisonSource = null;
      unit.woundStacks = 0;
      unit.injuryTimer = 0;
      unit.injuryMax = 0;
      unit.plantStage = 0;
      unit.plantSource = null;
      unit.plantUpgradedBy = {};
      unit.contemptStacks = 0;
      unit.contemptTimer = 0;
      unit.contemptMax = 0;
      unit.feelTimer = 0;
      unit.feelMax = 0;
      unit.feelGuardCount = 0;
      unit.desteStacks = 0;
      unit.regretTimer = 0;
      unit.regretMax = 0;
      unit.sorrowTimer = 0;
      unit.sorrowMax = 0;
      unit.sorrowTick = 0;
      unit.reunionTimer = 0;
      unit.reunionMax = 0;
      unit.reunionSource = null;
      unit.absorptionLockTimer = 0;
      unit.forcedEnemySkillKey = null;
      unit.forcedEnemySkillTarget = null;
      unit.magicNeutralizeTimer = 0;
      unit.magicNeutralizeMax = 0;
      unit.magicNeutralizeRatio = 0;
      unit.actionSpeedDownTimer = 0;
      unit.actionSpeedDownMax = 0;
      unit.actionSpeedDownRatio = 0;
      unit.shadowDashTimer = 0;
      unit.shadowDashMax = 0;
      unit.goukenHitCounts = {};
    }

    function resetUnitBattleActionState(unit) {
      if (!unit) {
        return;
      }
      unit.aiIntent = null;
      unit.aiMoveTarget = null;
      unit.battleFacingIntent = null;
      unit.aim = null;
      unit.itemAim = null;
      unit.itemUseRequest = null;
      unit.itemCast = null;
      unit.cast = null;
      unit.castVisual = null;
      unit.channel = null;
      unit.pendingActionQueueKey = null;
      unit.skillQueue = [];
      unit.skillQueueInitialized = false;
      unit.firstSkillPending = Boolean(unit.firstSkillKey);
      unit.goukenHitCounts = {};
      unit.forcedEnemySkillKey = null;
      unit.forcedEnemySkillTarget = null;
      unit.absorptionLockTimer = 0;
      unit.hpRegenTickTimer = 0;
      unit.mpRegenTickTimer = 0;
      unit.chocolateLilyCharging = false;
      unit.chocolateLilyDamageTaken = 0;
    }

    function applyBattleStartUltimate(unit) {
      if (!unit || unit.team !== "party") {
        return;
      }
      if (unit.dead) {
        unit.ult = 0;
        return;
      }
      const cost = typeof getUltimateCost === "function" ? getUltimateCost(unit) : 100;
      unit.ult = Math.max(0, (Number.isFinite(cost) ? cost : 100) * BATTLE_START_ULTIMATE_RATIO);
    }

    function applyEffectiveResourceMaximums(unit) {
      if (!unit) {
        return;
      }
      const maxHp = getEffectiveResourceMaximum(unit, "maxHp", 1);
      const maxMp = getEffectiveResourceMaximum(unit, "maxMp", 0);
      unit.maxHp = maxHp;
      unit.maxMp = maxMp;
    }

    function getEffectiveResourceMaximum(unit, statKey, minimum) {
      const fallback = unit && Number.isFinite(unit[statKey]) ? unit[statKey] : minimum;
      const value = typeof getEffectiveStat === "function" ? getEffectiveStat(unit, statKey) : fallback;
      return Math.max(minimum, Math.round(Number.isFinite(value) ? value : fallback));
    }

    function findBattleUnitById(unitId) {
      if (!unitId) {
        return null;
      }
      return [player, ...party, ...enemies].find((unit) => unit && unit.id === unitId) || null;
    }

    function isStatusCarryover(statusId) {
      if (!CARRYOVER_STATUS_IDS.includes(statusId)) {
        return false;
      }
      const status = STATUS_DATA && STATUS_DATA[statusId];
      const values = status ? [status.carryover, status.inherit, status.battleCarryover, status["引き継ぎ"]] : [];
      return values.some((value) => value === true || value === "あり" || value === "有" || value === "true" || value === "yes");
    }

    function spawnQuestEnemies(quest, bounds) {
      const layout = quest && Array.isArray(quest.enemies) ? quest.enemies : null;
      if (!layout || !layout.length) {
        return false;
      }
      const baseX = Math.min(bounds.right - battlePx(120), bounds.left + bounds.width * 0.72);
      const baseY = bounds.centerY;
      let spawned = 0;
      for (let index = 0; index < layout.length; index += 1) {
        const entry = layout[index] || {};
        const role = entry.role || entry.enemyId || entry.type;
        if (!role) {
          continue;
        }
        const fallbackDy = (index - (layout.length - 1) / 2) * 48;
        const dx = Number.isFinite(entry.dx) ? entry.dx : 0;
        const dy = Number.isFinite(entry.dy) ? entry.dy : fallbackDy;
        const x = Number.isFinite(entry.x) ? bounds.left + bounds.width * entry.x : baseX + battlePx(dx);
        const y = Number.isFinite(entry.y) ? bounds.top + bounds.height * entry.y : baseY + battlePx(dy);
        const enemy = makeEnemy(entry.name || `敵${index + 1}`, x, y, role);
        const point = clampBattlePoint(enemy.x, enemy.y, enemy.radius);
        enemy.x = point.x;
        enemy.y = point.y;
        enemies.push(enemy);
        spawned += 1;
      }
      return spawned > 0;
    }

    function spawnTutorialEnemies(bounds) {
      const startX = Math.min(bounds.right - battlePx(120), bounds.left + bounds.width * 0.72);
      const startY = bounds.centerY;
      const enemySpread = Math.min(battlePx(150), bounds.height * 0.32);
      enemies.push(
        makeEnemy("魔物A", startX, startY - enemySpread, "brute"),
        makeEnemy("魔物B", startX + battlePx(72), startY - enemySpread * 0.53, "skirmisher"),
        makeEnemy("魔物C", startX + battlePx(18), startY + battlePx(5), "brute"),
        makeEnemy("魔物D", startX + battlePx(92), startY + enemySpread * 0.59, "skirmisher"),
        makeEnemy("小術師A", startX + battlePx(205), startY - enemySpread * 0.64, "caster"),
        makeEnemy("小術師B", startX + battlePx(220), startY + enemySpread * 0.53, "caster"),
        makeEnemy("大魔物", startX + battlePx(150), startY + battlePx(4), "elite"),
      );
    }

    function hasQuestReinforcements(quest) {
      return Boolean(quest && Array.isArray(quest.reinforcements) && quest.reinforcements.length > 0);
    }

    function resetGame(quest = null) {
      projectiles.length = 0;
      telegraphs.length = 0;
      areas.length = 0;
      effects.length = 0;
      expandedStatusUnitIds.clear();
      game.state = "playing";
      game.time = 0;
      game.stageClearTimer = 0;
      game.reinforcementsSpawned = !hasQuestReinforcements(quest);
      game.priorityTarget = null;
      game.priorityTargetTimer = 0;
      game.priorityTargetIgnoredUnitIds = {};
      game.avoidTarget = null;
      game.avoidTargetTimer = 0;
      game.skillPage = "page1";
      game.currentQuest = quest;
      game.battleRewards = { pending: [], granted: [], claimed: false };
      game.innRestUsedUntilBattle = false;
      game.message = quest ? `依頼: ${quest.name}` : "依頼: 魔物を全滅させる";
      game.messageTimer = 4;

      const bounds = getBattleBounds();
      const cx = bounds.left + bounds.width * 0.33;
      const cy = bounds.centerY;

      const playerStart = clampBattlePoint(bounds.left + bounds.width * 0.26, cy, player.radius);
      Object.assign(player, {
        x: playerStart.x,
        y: playerStart.y,
        hp: 0,
        mp: 0,
        shield: 0,
        shieldTimer: 0,
        shields: [],
        ult: 0,
        moodActionId: 0,
        moodActionGain: 0,
        dead: false,
        cds: {},
        channel: null,
        actionLock: 0,
        actionTotal: 0,
        hurt: 0,
        guardFlash: 0,
        burnTimer: 0,
        burnMax: 0,
        burnTick: 0,
        burnTickRate: 1,
        burnDamageHpRatio: 0,
        burnSource: null,
        feelTimer: 0,
        feelMax: 0,
        feelGuardCount: 0,
        desteStacks: 0,
        noDamage: 999,
        cast: null,
        castVisual: null,
        aim: null,
        aiIntent: null,
        aiMoveTarget: null,
        battleFacingIntent: null,
        itemAim: null,
        itemUseRequest: null,
        itemCast: null,
        pendingActionQueueKey: null,
        skillQueue: [],
        skillQueueInitialized: false,
        selfHealFloat: 0,
        delayedDamageQueue: [],
        field: true,
        targetable: true,
        collidable: true,
      });
      applyStoredPartyConfig(player);
      applyEffectiveResourceMaximums(player);
      applyCarriedHp(player);

      const ulpes = makePartyMember("ulpes");
      const rihas = makePartyMember("rihas");
      const sushia = makePartyMember("sushia");
      applyStoredPartyConfig(ulpes);
      applyStoredPartyConfig(rihas);
      applyStoredPartyConfig(sushia);

      Object.assign(ulpes, { x: cx + battlePx(28), y: cy - battlePx(72) });
      Object.assign(rihas, { x: cx + battlePx(62), y: cy + battlePx(55) });
      Object.assign(sushia, { x: cx - battlePx(28), y: cy - battlePx(6) });
      applyEffectiveResourceMaximums(ulpes);
      applyEffectiveResourceMaximums(rihas);
      applyEffectiveResourceMaximums(sushia);
      applyCarriedHp(ulpes);
      applyCarriedHp(rihas);
      applyCarriedHp(sushia);
      party.length = 0;
      party.push(player, ulpes, rihas, sushia);

      for (const member of party) {
        resetUnitBattleActionState(member);
        applyBattleStartUltimate(member);
      }

      enemies.length = 0;
      if (!spawnQuestEnemies(quest, bounds)) {
        spawnTutorialEnemies(bounds);
      }

      for (const member of party) {
        applyCarriedStatuses(member);
      }

      clampAllUnits();
    }

    function spawnRearVanguardWave() {
      const quest = game.currentQuest;
      const layout = quest && Array.isArray(quest.reinforcements) ? quest.reinforcements : null;
      if (!layout || !layout.length) {
        game.reinforcementsSpawned = true;
        return false;
      }
      const bounds = getBattleBounds();
      const spawnX = bounds.left + battlePx(34);
      const centerY = bounds.centerY;
      let spawned = 0;
      for (let index = 0; index < layout.length; index += 1) {
        const entry = layout[index] || {};
        const role = entry.role || entry.enemyId || entry.type;
        if (!role) {
          continue;
        }
        const fallbackDy = (index - (layout.length - 1) / 2) * 92;
        const dx = Number.isFinite(entry.dx) ? entry.dx : 0;
        const dy = Number.isFinite(entry.dy) ? entry.dy : fallbackDy;
        const enemy = makeEnemy(entry.name || `増援${index + 1}`, spawnX + battlePx(dx), centerY + battlePx(dy), role);
        const point = clampBattlePoint(enemy.x, enemy.y, enemy.radius);
        enemy.x = point.x;
        enemy.y = point.y;
        enemies.push(enemy);
        addBurst(enemy.x, enemy.y, enemy.radius * 3.2, "rgba(230,151,99,0.28)");
        spawned += 1;
      }

      game.reinforcementsSpawned = true;
      if (spawned > 0) {
        const message = quest && quest.reinforcementMessage || "後方から増援!";
        addFloat("増援!", spawnX + battlePx(46), centerY - battlePx(120), COLORS.enemy);
        game.message = message;
        game.messageTimer = 4;
        return true;
      }
      return false;
    }

    return {
      resetGame,
      spawnRearVanguardWave,
    };
  };
})();
