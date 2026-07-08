(() => {
  "use strict";

  const DATA = window.HEALER_SKILL_DATA;
  if (!DATA) {
    throw new Error("HEALER_SKILL_DATA must be loaded before battle/skills.js");
  }

  function get(owner, key) {
    return DATA[owner] && DATA[owner][key] ? DATA[owner][key] : null;
  }

  function need(owner, key) {
    const skill = get(owner, key);
    if (!skill) throw new Error(`Missing skill data: ${owner}.${key}`);
    return skill;
  }

  function createHealerSkillSystem(ctx) {
    const COMMAND_SKILL_KEYS = ["take_aim", "distance", "commandDefend", "commandAttack", "commandDefendAll", "commandAttackAll"];
    const PLAYER_SKILL_SLOT_KEYS = Array.isArray(ctx.PLAYER_SKILL_SLOT_KEYS) && ctx.PLAYER_SKILL_SLOT_KEYS.length
      ? ctx.PLAYER_SKILL_SLOT_KEYS
      : ["q", "w", "e", "r", "t"];
    const PLAYER_SKILL_PANEL_SLOTS = 6;
    const PLAYER_ULTIMATE_SLOT_INDEX = PLAYER_SKILL_PANEL_SLOTS - 1;
    const PLAYER_ULTIMATE_INPUT_LABEL = "4";

    function getSlotInputLabel(index) {
      if (index === PLAYER_ULTIMATE_SLOT_INDEX) {
        return typeof ctx.getKeybindLabel === "function"
          ? ctx.getKeybindLabel("battle.ultimate.finald")
          : PLAYER_ULTIMATE_INPUT_LABEL;
      }
      if (typeof ctx.getKeybindLabel === "function") {
        return ctx.getKeybindLabel(`battle.skill${index + 1}`);
      }
      const key = PLAYER_SKILL_SLOT_KEYS[index];
      return key ? key.toUpperCase() : "";
    }

    function getEquippedFinaldSkillKeys(player) {
      if (ctx.getEquippedActiveSkillKeys) {
        return ctx.getEquippedActiveSkillKeys(player);
      }
      return ["attack", "heal", "shield", "commandDefend", "commandAttack", "commandDefendAll", "commandAttackAll"];
    }

    function getPlayerSkillCooldown(player, key) {
      return player.cds[key] || 0;
    }

    function createPlayerSkillPanelEntries(pageEntries, player) {
      const entries = new Array(PLAYER_SKILL_PANEL_SLOTS).fill(null);
      pageEntries.slice(0, PLAYER_ULTIMATE_SLOT_INDEX).forEach((entry, index) => {
        entry.input = getSlotInputLabel(index);
        entry.level = Number.isFinite(entry.level) ? entry.level : getSkillUpgradeLevel(player, entry.key, entry.skill);
        entries[index] = entry;
      });
      const ultimateEntry = getUnitUltimateEntry(player);
      const ult = ultimateEntry.skill || need("finald", "ult");
      entries[PLAYER_ULTIMATE_SLOT_INDEX] = {
        key: ultimateEntry.key || "ult",
        input: getSlotInputLabel(PLAYER_ULTIMATE_SLOT_INDEX),
        name: ult.name,
        skillType: ult.skillType || "",
        cd: player.ult < getUltimateCost(player) ? getUltimateCost(player) - player.ult : 0,
        max: getUltimateCost(player),
        skill: ult,
        level: getSkillUpgradeLevel(player, ultimateEntry.key || "ult", ult),
        gauge: true,
      };
      return entries;
    }

    function getSkillOwner(unit) {
      return unit && (unit.skillOwner || unit.id) || "";
    }

    const SKILL_BASE_MULTIPLIERS = [1, 1.2, 1.4, 1.6, 1.8, 2];
    const BOMB_FALLOFF_MULTIPLIERS = [1, 0.87, 0.75, 0.62, 0.5, 0.37];
    const RIHAS_ULT_DURATION_BONUSES = [0, 0.5, 1, 1.5, 2, 3];

    function getSkillSourceOwner(skill, fallbackOwner = "") {
      return skill && (skill.sourceOwner || skill.owner) || fallbackOwner;
    }

    function getSkillSourceKey(skill, fallbackKey = "") {
      return skill && (skill.sourceKey || skill.key) || fallbackKey;
    }

    function isSkillSource(skill, owner, key) {
      return getSkillSourceOwner(skill) === owner && getSkillSourceKey(skill) === key;
    }

    function getSkillUpgradeLevel(unitOrOwner, key, skill = null) {
      if (typeof ctx.getSkillLevel !== "function") {
        return 0;
      }
      const owner = typeof unitOrOwner === "string" ? unitOrOwner : getSkillOwner(unitOrOwner);
      const skillKey = key || getSkillSourceKey(skill);
      if (!owner || !skillKey) {
        return 0;
      }
      try {
        return ctx.clamp(Math.floor(ctx.getSkillLevel(owner, skillKey) || 0), 0, 5);
      } catch (_error) {
        return 0;
      }
    }

    function getSkillUpgradeIndexedValue(unit, key, skill, values) {
      const level = getSkillUpgradeLevel(unit, key || getSkillSourceKey(skill), skill);
      return values[Math.max(0, Math.min(values.length - 1, level))] || 0;
    }

    function getUpgradedBaseValue(unit, key, skill, prop) {
      const value = Number.isFinite(skill && skill[prop]) ? skill[prop] : 0;
      if (prop === "damageBase") {
        if (isSkillSource(skill, "finald", "attack") || isSkillSource(skill, "rihas", "attack")) {
          return value * getSkillUpgradeIndexedValue(unit, key, skill, SKILL_BASE_MULTIPLIERS);
        }
        if (isSkillSource(skill, "ulpes", "attack")) {
          return value + getSkillUpgradeLevel(unit, key || "attack", skill) * 3;
        }
      }
      if ((isSkillSource(skill, "finald", "heal") && prop === "healBase") || (isSkillSource(skill, "finald", "shield") && prop === "shieldBase")) {
        return value * getSkillUpgradeIndexedValue(unit, key, skill, SKILL_BASE_MULTIPLIERS);
      }
      return value;
    }

    function getSkillBurnDuration(unit, skill) {
      const base = Number.isFinite(skill && skill.burnDuration) ? skill.burnDuration : 0;
      if (!isSkillSource(skill, "sushia", "fire")) {
        return base;
      }
      return base + getSkillUpgradeLevel(unit, getSkillSourceKey(skill, "fire"), skill);
    }

    function getDistanceFalloffMax(unit, skill, fallback = 0) {
      const base = Number.isFinite(skill && skill.distanceFalloffMax) ? skill.distanceFalloffMax : fallback;
      if (!isSkillSource(skill, "sushia", "bomb")) {
        return base;
      }
      return base * getSkillUpgradeIndexedValue(unit, getSkillSourceKey(skill, "bomb"), skill, BOMB_FALLOFF_MULTIPLIERS);
    }

    function getProjectilePierceCount(unit, key, skill) {
      if (isSkillSource(skill, "sushia", "attack")) {
        return getSkillUpgradeLevel(unit, key || "attack", skill);
      }
      return Number.isFinite(skill && skill.pierceCount) ? Math.max(0, Math.floor(skill.pierceCount)) : 0;
    }

    function getCdRefundPerHit(unit, key, skill) {
      const base = Number.isFinite(skill && skill.cdRefundPerHit) ? skill.cdRefundPerHit : 0;
      if (!isSkillSource(skill, "ulpes", "heroSlash")) {
        return base;
      }
      return base + getSkillUpgradeLevel(unit, key || "heroSlash", skill) * 0.3;
    }

    function getCommandIgnoreChance(source, key, skill) {
      return Math.max(0, 0.75 - getSkillUpgradeLevel(source, key, skill) * 0.1);
    }

    function getFocusIgnoreChance(source, key, skill) {
      const base = Number.isFinite(skill && skill.focusIgnoreBase) ? skill.focusIgnoreBase : 0.7;
      return Math.max(0, base - getSkillUpgradeLevel(source, key, skill) * 0.1);
    }

    function getFocusDamageTakenBonus(source, key, skill) {
      if (!isSkillSource(skill, "finald", "take_aim")) {
        return 0;
      }
      const perLevel = Number.isFinite(skill.focusDamageTakenBonusPerLevel) ? skill.focusDamageTakenBonusPerLevel : 0;
      return getSkillUpgradeLevel(source, key, skill) * perLevel;
    }

    function getSkillCooldown(unit, key, skill) {
      const base = Number.isFinite(skill && skill.cd) ? skill.cd : 0;
      if (isSkillSource(skill, "finald", "distance")) {
        return Math.max(0, base - getSkillUpgradeLevel(unit, key || "distance", skill) * 2);
      }
      return base;
    }

    function getFocusIgnoredUnitIds(source, key, skill) {
      if (!isSkillSource(skill, "finald", "take_aim")) {
        return [];
      }
      const ignoreChance = getFocusIgnoreChance(source, key, skill);
      if (ignoreChance <= 0) {
        return [];
      }
      const ignored = [];
      for (const member of ctx.getFieldPartyMembers()) {
        if (!isCommandTarget(member) || member.mood === null) {
          continue;
        }
        if ((member.mood >= 70 || member.mood <= 30) && Math.random() < ignoreChance) {
          ignored.push(member.id);
        }
      }
      return ignored;
    }

    function addFocusIgnoredFloats(ignoredUnitIds) {
      if (!Array.isArray(ignoredUnitIds) || ignoredUnitIds.length === 0) {
        return;
      }
      const ignored = new Set(ignoredUnitIds);
      for (const member of ctx.getFieldPartyMembers()) {
        if (member && ignored.has(member.id)) {
          ctx.addFloat("無視", member.x, member.y - 34, "#f7fff6");
        }
      }
    }

    function getSkillCastTime(unit, key, skill, baseTime, castFn = getCastTime) {
      let value = Number.isFinite(baseTime) ? baseTime : 0;
      if (isSkillSource(skill, "finald", "ult")) {
        value = Math.max(0, value - getSkillUpgradeLevel(unit, key || "ult", skill) * 0.5);
      }
      return castFn(value, unit);
    }

    function getSkillCostMaxMpRatio(unit, skill) {
      const base = Number.isFinite(skill && skill.costMaxMpRatio) ? skill.costMaxMpRatio : 0;
      if (!isSkillSource(skill, "finald", "ult")) {
        return base;
      }
      return Math.max(0, base - getSkillUpgradeLevel(unit, "ult", skill) * 0.02);
    }

    function getRihasUltDuration(unit, skill) {
      return (Number.isFinite(skill && skill.duration) ? skill.duration : 0) + getSkillUpgradeIndexedValue(unit, "ult", skill, RIHAS_ULT_DURATION_BONUSES);
    }

    function getUltimateCritChanceBonus(unit, skill) {
      return isSkillSource(skill, "ulpes", "ult") ? getSkillUpgradeLevel(unit, "ult", skill) * 0.1 : 0;
    }

    function isSkillEquipped(unit, key) {
      return !ctx.isActiveSkillEquipped || ctx.isActiveSkillEquipped(unit, key);
    }

    function isUltimateKey(owner, key) {
      const skill = get(owner, key);
      return Boolean(skill && (key === "ult" || skill.category === "必殺技"));
    }

    function getUnitUltimateEntry(unit) {
      const owner = getSkillOwner(unit);
      const key = ctx.getEquippedUltimateSkillKey ? ctx.getEquippedUltimateSkillKey(unit) : "ult";
      const skill = key && isUltimateKey(owner, key) ? get(owner, key) : null;
      if (skill) {
        return { key, skill };
      }
      return { key: "ult", skill: get(owner, "ult") };
    }

    function getUnitSkill(unit, key) {
      if (key === "regret") {
        return get("finald", "regret");
      }
      if (key === "ult") {
        return getUnitUltimateEntry(unit).skill;
      }
      if (key === "attack") {
        return getUnitNormalAttackSkill(unit) || get(getSkillOwner(unit), key);
      }
      return get(getSkillOwner(unit), key);
    }

    function getUnitNormalAttackSkill(unit) {
      if (!unit || typeof ctx.getEquippedActiveSkills !== "function") {
        return null;
      }
      const entry = ctx.getEquippedActiveSkills(unit).find((candidate) => candidate && candidate.key === "attack" && candidate.skill);
      return entry ? entry.skill : null;
    }

    function getAttackStat(unit) {
      return ctx.getEffectiveAttack ? ctx.getEffectiveAttack(unit) : unit.attack;
    }

    function getMagicStat(unit) {
      return ctx.getEffectiveMagic ? ctx.getEffectiveMagic(unit) : unit.magic;
    }

    function getCastTime(baseTime, unit) {
      return ctx.getCastTime ? ctx.getCastTime(baseTime, unit) : baseTime;
    }

    function getSkillCost(unit, skill) {
      if (!skill) return 0;
      let cost = 0;
      if (Number.isFinite(skill.costMaxMpRatio)) {
        cost = Math.ceil((unit && unit.maxMp || 0) * getSkillCostMaxMpRatio(unit, skill));
      } else {
        cost = Number.isFinite(skill.cost) ? skill.cost : 0;
      }
      if (cost > 0 && ctx.hasPassive && ctx.hasPassive(unit, "magic_add_on")) {
        cost = Math.ceil(cost * 1.3);
      }
      return cost;
    }

    function canPaySkillCost(unit, skill) {
      return getSkillCost(unit, skill) <= 0 || (unit && unit.mp >= getSkillCost(unit, skill));
    }

    function paySkillCost(unit, skill) {
      const cost = getSkillCost(unit, skill);
      if (unit && cost > 0) {
        unit.mp = Math.max(0, unit.mp - cost);
      }
      return cost;
    }

    function getUltimateCost(unitOrOwner) {
      const skill = typeof unitOrOwner === "string"
        ? get(unitOrOwner, "ult")
        : getUnitUltimateEntry(unitOrOwner).skill;
      return skill && Number.isFinite(skill.ultimateCost) ? skill.ultimateCost : 100;
    }

    function canUseUltimate(unit) {
      return unit && unit.ult >= getUltimateCost(unit);
    }

    function spendUltimate(unit) {
      if (unit) {
        unit.ult = Math.max(0, unit.ult - getUltimateCost(unit));
      }
    }

    function isForcedHostileTarget(source, target) {
      return Boolean(source && target && source !== target && source.forcedTarget === target && source.tauntTimer > 0 && !target.dead);
    }

    function isPlayerControlLocked() {
      const player = ctx.player;
      return isForcedHostileTarget(player, player && player.forcedTarget) || hasRegret(player);
    }

    function showPlayerControlLocked() {
      const origin = ctx.getSupportOrigin ? ctx.getSupportOrigin() : ctx.player;
      if (origin && ctx.addFloat) {
        ctx.addFloat(hasRegret(ctx.player) ? "悔恨中" : "挑発中", origin.x + 26, origin.y - 28, "#ffd0d0");
      }
    }

    function isActionDisabled(unit) {
      return Boolean(unit && ((unit.frozen || 0) > 0 || (unit.sleepTimer || 0) > 0 || (unit.absorptionLockTimer || 0) > 0));
    }

    function canOffensiveAffect(source, target) {
      if (!source || !target || source === target || target.dead) {
        return false;
      }
      if (source.team === "party" && target.team === "party") {
        if (isForcedHostileTarget(source, target)) {
          return true;
        }
        return ctx.canFriendlyFireAffect ? ctx.canFriendlyFireAffect(source, target) : true;
      }
      return true;
    }

    function canSupportAffect(source, target) {
      if (!source || !target || source === target || target.dead) {
        return false;
      }
      if (target.team === "party") {
        return true;
      }
      return isForcedHostileTarget(source, target);
    }

    function getAutoUltimateEnemyDamageMultiplier(target, automatic) {
      return automatic && target && target.team === "enemy"
        ? (Number.isFinite(ctx.AUTO_ULTIMATE_ENEMY_DAMAGE_MULTIPLIER) ? ctx.AUTO_ULTIMATE_ENEMY_DAMAGE_MULTIPLIER : 0.6)
        : 1;
    }

    function getAutoUltimateEnemyEffectMultiplier(target, automatic) {
      return automatic && target && target.team === "enemy"
        ? (Number.isFinite(ctx.AUTO_ULTIMATE_ENEMY_EFFECT_MULTIPLIER) ? ctx.AUTO_ULTIMATE_ENEMY_EFFECT_MULTIPLIER : 0.6)
        : 1;
    }

    function getOffensiveEffectDuration(source, target, duration, automatic = false) {
      if (!Number.isFinite(duration) || duration <= 0) {
        return 0;
      }
      if (source && target && source.team === "party" && target.team === "party" && source !== target) {
        const multiplier = ctx.getFriendlyFireEffectDurationMultiplier ? ctx.getFriendlyFireEffectDurationMultiplier(source, target) : 1;
        return duration * multiplier;
      }
      return duration * getAutoUltimateEnemyEffectMultiplier(target, automatic);
    }

    function speakSkill(unit, key) {
      const skill = getUnitSkill(unit, key);
      const lines = skill && Array.isArray(skill.lines) ? skill.lines : [];
      if (lines.length) ctx.addSpeech(lines[Math.floor(Math.random() * lines.length)], unit);
    }

    function ensureSkillQueue(unit) {
      if (!unit) {
        return null;
      }
      if (!Array.isArray(unit.skillQueue)) {
        unit.skillQueue = [];
      }
      if (!unit.usedSkillKeys || typeof unit.usedSkillKeys !== "object" || Array.isArray(unit.usedSkillKeys)) {
        unit.usedSkillKeys = {};
      }
      if (!unit.skillCooldownKeys || typeof unit.skillCooldownKeys !== "object" || Array.isArray(unit.skillCooldownKeys)) {
        unit.skillCooldownKeys = {};
      }
      return unit.skillQueue;
    }

    function normalizeSkillQueue(unit) {
      const queue = ensureSkillQueue(unit);
      if (!queue) {
        return [];
      }
      const seen = new Set();
      unit.skillQueue = queue.filter((key) => {
        if (typeof key !== "string" || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      return unit.skillQueue;
    }

    function initializeSkillQueue(unit, entries) {
      if (!unit || !Array.isArray(entries)) {
        return;
      }
      const keys = [];
      const seen = new Set();
      for (const entry of entries) {
        const key = typeof entry === "string" ? entry : entry && entry.key;
        if (!key || seen.has(key)) {
          continue;
        }
        seen.add(key);
        keys.push(key);
      }
      if (!keys.length) {
        return;
      }
      const queue = normalizeSkillQueue(unit);
      if (!unit.skillQueueInitialized) {
        unit.skillQueue = keys.slice();
        unit.skillQueueInitialized = true;
        return;
      }
      for (const key of keys) {
        if (!queue.includes(key)) {
          queue.push(key);
        }
      }
    }

    function removeSkillFromQueue(unit, key) {
      const queue = normalizeSkillQueue(unit);
      if (!queue.length) {
        return;
      }
      unit.skillQueue = queue.filter((queuedKey) => queuedKey !== key);
    }

    function moveSkillToQueueBack(unit, key) {
      if (!unit || !key) {
        return;
      }
      removeSkillFromQueue(unit, key);
      normalizeSkillQueue(unit).push(key);
    }

    function enqueueReadySkill(unit, key) {
      if (!unit || !key) {
        return;
      }
      const queue = normalizeSkillQueue(unit);
      if (!unit.usedSkillKeys[key] || queue.includes(key)) {
        return;
      }
      queue.push(key);
    }

    function getCooldownQueueKey(unit, cooldownKey) {
      if (!unit || !cooldownKey) {
        return null;
      }
      ensureSkillQueue(unit);
      return unit.skillCooldownKeys[cooldownKey] || null;
    }

    function onCooldownReady(unit, cooldownKey) {
      const queueKey = getCooldownQueueKey(unit, cooldownKey);
      if (!queueKey) {
        return;
      }
      enqueueReadySkill(unit, queueKey);
      if (unit.skillCooldownKeys) {
        delete unit.skillCooldownKeys[cooldownKey];
      }
    }

    function trackSkillCooldown(unit, cooldownKey, queueKey, value) {
      if (!unit || !cooldownKey || !queueKey) {
        return;
      }
      ensureSkillQueue(unit);
      unit.cds[cooldownKey] = Math.max(0, Number.isFinite(value) ? value : 0);
      unit.skillCooldownKeys[cooldownKey] = queueKey;
      if (unit.cds[cooldownKey] <= 0) {
        onCooldownReady(unit, cooldownKey);
      }
    }

    function actionHasSkillCooldown(unit, key) {
      if (!unit || !key || key === "attack") {
        return false;
      }
      if (unit.team === "enemy") {
        if (key === "casterLine" || key === "heavySlam") {
          return true;
        }
        const skill = getUnitSkill(unit, key);
        return Boolean(skill && skill.category !== "通常攻撃" && Number.isFinite(skill.cd) && skill.cd > 0);
      }
      const skill = getUnitSkill(unit, key);
      return Boolean(skill && Number.isFinite(skill.cd) && skill.cd > 0);
    }

    function markSkillUsed(unit, key) {
      if (!unit || !key) {
        return;
      }
      ensureSkillQueue(unit);
      unit.usedSkillKeys[key] = true;
      moveSkillToQueueBack(unit, key);
      if (!actionHasSkillCooldown(unit, key)) {
        if ((unit.cds.attack || 0) > 0) {
          trackSkillCooldown(unit, "attack", key, unit.cds.attack);
        } else {
          unit.pendingActionQueueKey = key;
        }
      }
    }

    function chooseQueuedCandidate(unit, candidates) {
      if (!candidates.length) {
        return null;
      }
      ensureSkillQueue(unit);
      if (unit && unit.team === "enemy") {
        const unusedCandidates = candidates.filter((candidate) => !unit.usedSkillKeys[candidate.key]);
        if (unusedCandidates.length) {
          return pickRandomCandidate(unusedCandidates);
        }
      }
      const unusedAction = findQueuedCandidate(unit, candidates, (candidate) => !unit.usedSkillKeys[candidate.key]);
      if (unusedAction) {
        return unusedAction;
      }
      const queuedAction = findQueuedCandidate(unit, candidates);
      if (queuedAction) {
        return queuedAction;
      }
      return candidates[0];
    }

    function pickRandomCandidate(candidates) {
      if (!candidates.length) {
        return null;
      }
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    function findQueuedCandidate(unit, candidates, predicate = () => true) {
      const queue = normalizeSkillQueue(unit);
      for (const queuedKey of queue) {
        const queuedAction = candidates.find((candidate) => candidate.key === queuedKey && predicate(candidate));
        if (queuedAction) {
          return queuedAction;
        }
      }
      return candidates.find(predicate) || null;
    }

    function getUnitMoveSpeedForAction(unit) {
      if (!unit) {
        return 0;
      }
      if (typeof ctx.getEffectiveMoveSpeed === "function") {
        return ctx.getEffectiveMoveSpeed(unit);
      }
      return Number.isFinite(unit.speed) ? unit.speed : 0;
    }

    function canMoveToActionTarget(unit, action) {
      return Boolean(action && action.target && getUnitMoveSpeedForAction(unit) > 0);
    }

    function useQueuedInstantAction(unit, candidates) {
      if (!candidates.length) {
        unit.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      const action = chooseQueuedCandidate(unit, candidates);
      if (!action) {
        unit.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      action.use();
      markSkillUsed(unit, action.key);
      return true;
    }

    function choosePartyAction(unit, target, candidates) {
      if (!candidates.length) {
        unit.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      const reachableCandidates = candidates.filter((candidate) => isPartyActionReachable(unit, candidate, target));
      if (!reachableCandidates.length) {
        unit.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      const action = chooseQueuedCandidate(unit, reachableCandidates);
      if (!action) {
        unit.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      const actionTarget = action.target || target;
      if (!actionTarget) {
        unit.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      if (ctx.dist(unit, actionTarget) <= action.range) {
        return executePartyAction(unit, action.key, actionTarget);
      }
      unit.aiIntent = { key: action.key, target: actionTarget, range: action.range, support: Boolean(action.support) };
      return true;
    }

    function chooseEnemyAction(enemy, candidates) {
      if (!candidates.length) {
        enemy.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      const reachableCandidates = candidates.filter((candidate) => isEnemyActionReachable(enemy, candidate));
      if (!reachableCandidates.length) {
        enemy.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      const action = chooseQueuedCandidate(enemy, reachableCandidates);
      if (!action) {
        enemy.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      if (isEnemyActionInRange(enemy, action)) {
        const used = action.use();
        if (used !== false) {
          markSkillUsed(enemy, action.key);
          return true;
        }
        enemy.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      enemy.aiIntent = {
        enemySkill: true,
        key: action.key,
        skill: action.skill || null,
        target: action.target,
        range: Math.max(0, Number.isFinite(action.range) ? action.range : 0),
      };
      return true;
    }

    function choosePriorityFullPlantSkill(enemy, activeEntries) {
      if (!enemy || !Array.isArray(activeEntries)) {
        return false;
      }
      for (const { key, skill } of activeEntries) {
        if (!skill || !skill.requiresFullPlant || !canUseEnemySkill(enemy, key, skill)) {
          continue;
        }
        const plantTarget = getFullPlantTarget(enemy);
        if (!plantTarget) {
          return false;
        }
        const range = getEnemySkillRange(skill) + plantTarget.radius;
        const candidate = {
          key,
          skill,
          target: plantTarget,
          range,
          use: () => useEnemySingleTargetSkill(enemy, key, skill, plantTarget),
        };
        return chooseEnemyAction(enemy, [candidate]);
      }
      return false;
    }

    function isPartyActionReachable(unit, action, fallbackTarget) {
      if (!action) {
        return false;
      }
      const actionTarget = action.target || fallbackTarget;
      if (!actionTarget) {
        return false;
      }
      return ctx.dist(unit, actionTarget) <= action.range || canMoveToActionTarget(unit, { ...action, target: actionTarget });
    }

    function isEnemyActionReachable(enemy, action) {
      return isEnemyActionInRange(enemy, action) || canMoveToActionTarget(enemy, action);
    }

    function isEnemyActionInRange(enemy, action) {
      if (!action) {
        return false;
      }
      if (!Number.isFinite(action.range) || !action.target) {
        return true;
      }
      return ctx.dist(enemy, action.target) <= action.range;
    }

    function executePartyIntent(unit) {
      const intent = unit && unit.aiIntent;
      if (!intent || !intent.target || intent.target.dead) {
        if (unit) unit.aiIntent = null;
        return false;
      }
      if (intent.target.team === unit.team && !intent.support && !isForcedHostileTarget(unit, intent.target)) {
        unit.aiIntent = null;
        return false;
      }
      if (isForcedHostileTarget(unit, unit.forcedTarget) && intent.target !== unit.forcedTarget) {
        unit.aiIntent = null;
        return false;
      }
      if (ctx.dist(unit, intent.target) > intent.range) {
        return false;
      }
      unit.aiIntent = null;
      return executePartyAction(unit, intent.key, intent.target);
    }

    function executeEnemyIntent(enemy) {
      const intent = enemy && enemy.aiIntent;
      if (!intent || !intent.enemySkill) {
        return false;
      }
      if (!intent.target || intent.target.dead) {
        enemy.aiIntent = null;
        return false;
      }
      if (Number.isFinite(intent.range) && ctx.dist(enemy, intent.target) > intent.range) {
        return false;
      }
      const key = intent.key;
      const skill = intent.skill || getUnitSkill(enemy, key);
      if (!canUseEnemyIntentSkill(enemy, key, skill)) {
        enemy.aiIntent = null;
        return false;
      }
      enemy.aiIntent = null;
      const used = useEnemyActionByKey(enemy, key, skill, intent.target);
      if (used !== false) {
        markSkillUsed(enemy, key);
        return true;
      }
      return false;
    }

    function canUseEnemyIntentSkill(enemy, key, skill) {
      if (key === "attack" || key === "casterLine" || key === "heavySlam") {
        return true;
      }
      return canUseEnemySkill(enemy, key, skill);
    }

    function executePartyAction(unit, key, target) {
      if (!isSkillEquipped(unit, key)) {
        return false;
      }
      const skill = getUnitSkill(unit, key);
      if (!canPaySkillCost(unit, skill)) {
        return false;
      }
      if (!usePartySkillByData(unit, key, skill, target)) {
        return false;
      }
      markSkillUsed(unit, key);
      return true;
    }

    function getActionCooldown(unit) {
      const base = unit && unit.team === "enemy" ? getEnemyActionCooldownBase(unit) : (ctx.ACTION_COOLDOWN_BASE || 7);
      const cooldown = unit.team === "party" && unit.id !== "finald" ? ctx.getCommandActionCooldown(unit, base) : base;
      const actionSpeed = (ctx.getEquipmentStatBonusSum ? ctx.getEquipmentStatBonusSum(unit, "actionSpeed") : 0) + getActionSpeedStatusBonus(unit);
      return cooldown / Math.max(0.1, 1 + actionSpeed);
    }

    function getEnemyActionCooldownBase(unit) {
      const fallback = ctx.ACTION_COOLDOWN_BASE || 7;
      if (!unit || unit.team !== "enemy" || typeof ctx.getEquippedActiveSkills !== "function") {
        return fallback;
      }
      const normal = ctx.getEquippedActiveSkills(unit)
        .find((entry) => entry && entry.skill && entry.skill.category === "通常攻撃" && Number.isFinite(entry.skill.cd));
      return normal ? Math.max(0.1, normal.skill.cd) : fallback;
    }

    function getActionSpeedStatusBonus(unit) {
      let bonus = 0;
      if (ctx.hasPassive && ctx.hasPassive(unit, "number_of_times")) {
        bonus += 0.5;
      }
      if (unit && (unit.shadowDashTimer || 0) > 0) {
        bonus += 0.8;
      }
      if (unit && (unit.actionSpeedDownTimer || 0) > 0) {
        bonus -= Math.max(0, Number.isFinite(unit.actionSpeedDownRatio) ? unit.actionSpeedDownRatio : 0);
      }
      return bonus;
    }

    function commitActionStart(unit) {
      if (ctx.beginMoodAction) ctx.beginMoodAction(unit);
      if (ctx.applyMoodCommandBiasAuto) ctx.applyMoodCommandBiasAuto(unit);
      if (ctx.commitCommandBias) ctx.commitCommandBias(unit);
    }

    function setActionCooldown(unit, options = {}) {
      if (!options.skipCommandCommit) {
        commitActionStart(unit);
      }
      unit.cds.attack = Math.max(unit.cds.attack || 0, getActionCooldown(unit));
      if (unit.pendingActionQueueKey) {
        const queueKey = unit.pendingActionQueueKey;
        unit.pendingActionQueueKey = null;
        trackSkillCooldown(unit, "attack", queueKey, unit.cds.attack);
      }
    }

    function beginPartyAction(unit) {
      commitActionStart(unit);
    }

    function finishPartyAction(unit, skillCooldowns = []) {
      setActionCooldown(unit, { skipCommandCommit: true });
      for (const cooldown of skillCooldowns) {
        if (!cooldown || !cooldown.key || !Number.isFinite(cooldown.value)) {
          continue;
        }
        trackSkillCooldown(unit, cooldown.key, cooldown.queueKey || cooldown.key, Math.max(unit.cds[cooldown.key] || 0, cooldown.value));
      }
    }

    function getPartyAttackTarget(unit) {
      if (isForcedHostileTarget(unit, unit && unit.forcedTarget)) {
        return unit.forcedTarget;
      }
      return (ctx.getPriorityTarget && ctx.getPriorityTarget(unit)) || ctx.nearestAlive(unit, getPartyTargetableEnemies());
    }

    function getPartyTargetableEnemies() {
      return ctx.enemies.filter((enemy) => enemy && !enemy.dead && !(typeof ctx.isAvoidTarget === "function" && ctx.isAvoidTarget(enemy)));
    }

    function getSupportablePartyMembers() {
      return ctx.getFieldPartyMembers()
        .filter((member) => member && !member.dead && (!ctx.isFieldUnit || ctx.isFieldUnit(member)));
    }

    function getRandomSupportTarget() {
      const members = getSupportablePartyMembers();
      if (!members.length) {
        return null;
      }
      return members[Math.floor(Math.random() * members.length)];
    }

    function getUnitActiveSkillEntries(unit) {
      const owner = getSkillOwner(unit);
      const entries = ctx.getEquippedActiveSkills
        ? ctx.getEquippedActiveSkills(unit)
        : Object.entries(DATA[owner] || {}).filter(([key]) => !isUltimateKey(owner, key)).map(([key, skill]) => ({ key, skill }));
      return entries.filter((entry) => entry && entry.key && entry.skill && !isUltimateKey(owner, entry.key));
    }

    function isSupportSkill(skill) {
      return Boolean(skill && (
        Number.isFinite(skill.healBase)
        || Number.isFinite(skill.shieldBase)
        || skill.sleepCleanse
        || Number.isFinite(skill.actionCdSetTo)
      ));
    }

    function hasRegret(unit) {
      return Boolean(unit && (unit.regretTimer || 0) > 0);
    }

    function clearRegret(unit) {
      if (!unit) {
        return;
      }
      unit.regretTimer = 0;
      unit.regretMax = 0;
    }

    function isOffensiveSkill(skill) {
      if (!skill || isSupportSkill(skill)) {
        return false;
      }
      return Number.isFinite(skill.damageBase)
        || Number.isFinite(skill.shockDamageBase)
        || Number.isFinite(skill.attackScale)
        || Number.isFinite(skill.magicScale)
        || Number.isFinite(skill.projectileCount)
        || Number.isFinite(skill.magicNeutralizeBase);
    }

    function canQueuePartySkill(unit, key, skill) {
      if (!unit || !key || !skill || isCommandSkill(key) || !isSkillEquipped(unit, key) || !canPaySkillCost(unit, skill)) {
        return false;
      }
      if (key === "attack" && (unit.cds.attack || 0) > 0) {
        return false;
      }
      if (actionHasSkillCooldown(unit, key) && (unit.cds[key] || 0) > 0) {
        return false;
      }
      return isSupportSkill(skill) || isOffensiveSkill(skill);
    }

    function getPartySkillTarget(unit, skill, attackTarget) {
      if (skill && skill.sleepCleanse) {
        return getSleepCleanseTarget(unit, skill);
      }
      if (skill && Number.isFinite(skill.actionCdSetTo)) {
        return getActionCdSupportTarget(unit, skill);
      }
      if (isSupportSkill(skill)) {
        return getRandomSupportTarget();
      }
      if (isOffensiveSkill(skill)) {
        return attackTarget;
      }
      return null;
    }

    function getPartySkillRange(skill) {
      if (skill && Number.isFinite(skill.range) && skill.range > 0) return skill.range;
      if (skill && Number.isFinite(skill.hitRange)) return skill.hitRange;
      if (skill && Number.isFinite(skill.radius)) return skill.radius;
      return ctx.battlePx(80);
    }

    function getHoveredEnemy(x = ctx.input.mouse.x, y = ctx.input.mouse.y) {
      let best = null;
      let bestDist = Infinity;
      for (const enemy of ctx.enemies) {
        if (!enemy || enemy.dead) {
          continue;
        }
        const distance = ctx.distPoint(x, y, enemy.x, enemy.y);
        if (distance <= enemy.radius + ctx.battlePx(10) && distance < bestDist) {
          best = enemy;
          bestDist = distance;
        }
      }
      return best;
    }

    function applyBurn(source, target, skill) {
      if (!target || target.dead || !skill) {
        return;
      }
      const duration = Number.isFinite(skill.burnDuration) ? skill.burnDuration : 0;
      if (duration <= 0) {
        return;
      }
      const tickRate = Number.isFinite(skill.burnTickRate) && skill.burnTickRate > 0 ? skill.burnTickRate : 1;
      target.burnTimer = Math.max(target.burnTimer || 0, duration);
      target.burnMax = Math.max(target.burnMax || 0, duration);
      target.burnTick = Math.min(Number.isFinite(target.burnTick) && target.burnTick > 0 ? target.burnTick : tickRate, tickRate);
      target.burnTickRate = tickRate;
      target.burnDamageHpRatio = Number.isFinite(skill.burnDamageHpRatio) ? skill.burnDamageHpRatio : 0.01;
      target.burnSource = source || null;
      ctx.addFloat("燃焼", target.x, target.y - 34, "#ff9f43");
    }

    function getFireDamage(unit, skill) {
      return getSkillDamage(unit, skill);
    }

    function thinkPartyUnit(unit, avoidingTelegraph = false) {
      if (hasRegret(unit)) {
        usePartyRegret(unit);
        return;
      }
      const forcedTarget = isForcedHostileTarget(unit, unit && unit.forcedTarget) ? unit.forcedTarget : null;
      const target = forcedTarget || getPartyAttackTarget(unit);
      const candidates = [];
      const activeEntries = getUnitActiveSkillEntries(unit);
      initializeSkillQueue(unit, activeEntries);
      for (const { key, skill } of activeEntries) {
        if (!canQueuePartySkill(unit, key, skill)) {
          continue;
        }
        const actionTarget = forcedTarget || getPartySkillTarget(unit, skill, target);
        if (!actionTarget) {
          continue;
        }
        const range = getPartySkillRange(skill);
        if (avoidingTelegraph && ctx.dist(unit, actionTarget) > range) {
          continue;
        }
        candidates.push({ key, target: actionTarget, range, support: isSupportSkill(skill) });
      }
      choosePartyAction(unit, target, candidates);
    }

    function thinkUlpes(unit, avoidingTelegraph = false) {
      thinkPartyUnit(unit, avoidingTelegraph);
    }

    function thinkRihas(unit, avoidingTelegraph = false) {
      thinkPartyUnit(unit, avoidingTelegraph);
    }

    function thinkSushia(unit, avoidingTelegraph = false) {
      thinkPartyUnit(unit, avoidingTelegraph);
    }

    function thinkEnemy(enemy, target, distance) {
      if (enemy.usesCustomSkillSet) {
        return thinkCustomEnemy(enemy, target, distance);
      }
      const attack = need("enemy", "attack");
      const candidates = [];
      if (enemy.role === "caster") {
        const skill = need("enemy", "casterLine");
        if (isSkillEquipped(enemy, "casterLine") && (enemy.cds.skill || 0) <= 0) candidates.push({ key: "casterLine", skill, target, range: skill.length, use: () => enemyLineAttack(enemy, target) });
      } else if (enemy.role === "elite") {
        const skill = need("enemy", "heavySlam");
        if (isSkillEquipped(enemy, "heavySlam") && (enemy.cds.skill || 0) <= 0) candidates.push({ key: "heavySlam", skill, target, range: Infinity, use: () => enemyHeavySlam(enemy, target) });
        if (isSkillEquipped(enemy, "attack")) candidates.push({ key: "attack", skill: attack, target, range: attack.eliteRange, use: () => enemyBite(enemy, target) });
      } else if (isSkillEquipped(enemy, "attack")) {
        candidates.push({ key: "attack", skill: attack, target, range: attack.bruteRange, use: () => enemyBite(enemy, target) });
      }
      chooseEnemyAction(enemy, candidates);
    }

    function thinkCustomEnemy(enemy, target, distance) {
      const candidates = [];
      if (enemy.forcedEnemySkillKey) {
        const forcedKey = enemy.forcedEnemySkillKey;
        const forcedSkill = getUnitSkill(enemy, forcedKey);
        const forcedTarget = enemy.forcedEnemySkillTarget && !enemy.forcedEnemySkillTarget.dead ? enemy.forcedEnemySkillTarget : target;
        if (forcedSkill && forcedTarget && canUseEnemySkill(enemy, forcedKey, forcedSkill)) {
          const range = Infinity;
          candidates.push({ key: forcedKey, skill: forcedSkill, target: forcedTarget, range, use: () => useEnemyActionByKey(enemy, forcedKey, forcedSkill, forcedTarget) });
          chooseEnemyAction(enemy, candidates);
          return;
        }
        enemy.forcedEnemySkillKey = null;
        enemy.forcedEnemySkillTarget = null;
      }
      const activeEntries = getUnitActiveSkillEntries(enemy);
      initializeSkillQueue(enemy, activeEntries);
      if (choosePriorityFullPlantSkill(enemy, activeEntries)) {
        return;
      }
      for (const { key, skill } of activeEntries) {
        if (!canUseEnemySkill(enemy, key, skill)) {
          continue;
        }
        if (skill.requiresFullPlant) {
          const plantTarget = getFullPlantTarget(enemy);
          if (plantTarget) {
            candidates.push({ key, skill, target: plantTarget, range: getEnemySkillRange(skill) + plantTarget.radius, use: () => useEnemySingleTargetSkill(enemy, key, skill, plantTarget) });
          }
          continue;
        }
        if (skill.enemyArea) {
          candidates.push({ key, skill, target: enemy, range: Infinity, use: () => useEnemyAreaSkill(enemy, key, skill) });
          continue;
        }
        if (skill.enemyLine) {
          if (target) {
            candidates.push({ key, skill, target, range: getEnemySkillRange(skill) + target.radius, use: () => useEnemyLineSkill(enemy, key, skill, target) });
          }
          continue;
        }
        if (key === "shadow_dash") {
          if ((enemy.shadowDashTimer || 0) <= 0) {
            candidates.push({ key, skill, target: enemy, range: Infinity, use: () => useEnemyShadowDash(enemy, key, skill) });
          }
          continue;
        }
        if (key === "sleep_scent") {
          if (target) {
            const range = (skill.radius || 0) + target.radius;
            candidates.push({ key, skill, target, range, use: () => useEnemySleepScent(enemy, key, skill) });
          }
          continue;
        }
        if (key === "pollen_spraying") {
          if (target) {
            candidates.push({ key, skill, target, range: (skill.range || 0) + target.radius, use: () => useEnemyPollenSpraying(enemy, key, skill, target) });
          }
          continue;
        }
        const range = getEnemySkillRange(skill);
        if (target) {
          candidates.push({ key, skill, target, range: range + target.radius, use: () => useEnemySingleTargetSkill(enemy, key, skill, target) });
        }
      }
      chooseEnemyAction(enemy, candidates);
    }

    function useEnemyActionByKey(enemy, key, skill, target) {
      if (key === "attack") return enemyBite(enemy, target);
      if (key === "casterLine") return enemyLineAttack(enemy, target);
      if (key === "heavySlam") return enemyHeavySlam(enemy, target);
      if (key === "shadow_dash") return useEnemyShadowDash(enemy, key, skill || getUnitSkill(enemy, key));
      if (key === "sleep_scent") return useEnemySleepScent(enemy, key, skill || getUnitSkill(enemy, key));
      if (key === "pollen_spraying") return useEnemyPollenSpraying(enemy, key, skill || getUnitSkill(enemy, key), target);
      if (key === "absorption_of_reunion") return useEnemyAbsorption(enemy, key, skill || getUnitSkill(enemy, key), target);
      if (skill && skill.enemyArea) return useEnemyAreaSkill(enemy, key, skill);
      if (skill && skill.enemyLine) return useEnemyLineSkill(enemy, key, skill, target);
      return useEnemySingleTargetSkill(enemy, key, skill || getUnitSkill(enemy, key), target);
    }

    function canUseEnemySkill(enemy, key, skill) {
      if (!enemy || !skill || (enemy.cds[key] || 0) > 0) {
        return false;
      }
      const cost = Number.isFinite(skill.cost) ? skill.cost : 0;
      return cost <= 0 || (enemy.mp || 0) >= cost;
    }

    function payEnemySkillCost(enemy, skill) {
      const cost = Number.isFinite(skill && skill.cost) ? skill.cost : 0;
      if (cost > 0) {
        enemy.mp = Math.max(0, (enemy.mp || 0) - cost);
      }
    }

    function getEnemySkillRange(skill) {
      if (skill && Number.isFinite(skill.range)) return skill.range;
      if (skill && Number.isFinite(skill.hitRange)) return skill.hitRange;
      if (skill && Number.isFinite(skill.radius)) return skill.radius;
      return ctx.battlePx(50);
    }

    function hasEnemyTargetInRadius(enemy, radius) {
      return ctx.getFieldPartyMembers().some((member) => {
        return member && !member.dead && ctx.distPoint(member.x, member.y, enemy.x, enemy.y) <= radius + member.radius;
      });
    }

    function beginEnemySkill(enemy, key, skill, options = {}) {
      payEnemySkillCost(enemy, skill);
      if (!options.skipSpeech) {
        speakSkill(enemy, key);
      }
      if (enemy && enemy.forcedEnemySkillKey === key) {
        enemy.forcedEnemySkillKey = null;
        enemy.forcedEnemySkillTarget = null;
      }
      setActionCooldown(enemy);
      if (skill && skill.category !== "通常攻撃" && Number.isFinite(skill.cd) && skill.cd > 0) {
        trackSkillCooldown(enemy, key, key, skill.cd);
      }
    }

    function startEnemyCastVisual(enemy, cast, color = "rgba(255, 133, 105, 0.95)") {
      if (!enemy || !Number.isFinite(cast) || cast <= 0) {
        return;
      }
      enemy.castVisual = {
        time: cast,
        total: cast,
        color,
      };
    }

    function getEnemySkillDamage(enemy, target, skill) {
      if (Number.isFinite(skill.healBase) && !Number.isFinite(skill.damageBase) && !Number.isFinite(skill.attackScale)) {
        return 0;
      }
      let damage = Number.isFinite(skill.damageBase) ? skill.damageBase : 0;
      if (Number.isFinite(skill.attackScale)) {
        damage += getAttackStat(enemy) * skill.attackScale;
      }
      if (Number.isFinite(skill.magicScale)) {
        damage += getMagicStat(enemy) * skill.magicScale;
      }
      if (Number.isFinite(skill.missingHpScale) && target && target.maxHp > 0) {
        const missingRatio = ctx.clamp((target.maxHp - target.hp) / target.maxHp, 0, 1);
        const scaledPart = Number.isFinite(skill.attackScale) ? getAttackStat(enemy) * skill.attackScale : damage;
        damage += scaledPart * missingRatio * skill.missingHpScale;
      }
      return damage;
    }

    function applySleep(source, target, duration) {
      if (!target || target.dead || !Number.isFinite(duration) || duration <= 0) {
        return false;
      }
      if ((target.sleepTimer || 0) > 0) {
        return false;
      }
      target.sleepTimer = Math.max(target.sleepTimer || 0, duration);
      target.sleepMax = Math.max(target.sleepMax || 0, duration);
      ctx.addFloat("睡眠", target.x, target.y - 34, "#b9a8ff");
      return true;
    }

    function applyInjury(source, target, duration) {
      if (!target || target.dead || !Number.isFinite(duration) || duration <= 0) {
        return false;
      }
      target.injuryTimer = Math.max(target.injuryTimer || 0, duration);
      target.injuryMax = Math.max(target.injuryMax || 0, duration);
      ctx.addFloat("負傷", target.x, target.y - 34, "#d96b5f");
      return true;
    }

    function applyActionSpeedDown(source, target, ratio, duration) {
      if (!target || target.dead || !Number.isFinite(ratio) || ratio <= 0 || !Number.isFinite(duration) || duration <= 0) {
        return false;
      }
      target.actionSpeedDownTimer = Math.max(target.actionSpeedDownTimer || 0, duration);
      target.actionSpeedDownMax = Math.max(target.actionSpeedDownMax || 0, duration);
      target.actionSpeedDownRatio = Math.max(target.actionSpeedDownRatio || 0, ratio);
      ctx.addFloat("行動速度低下", target.x, target.y - 34, "#9bb2c8");
      return true;
    }

    function applyPoison(source, target, skill) {
      if (!target || target.dead) {
        return false;
      }
      target.poisonActive = true;
      target.poisonTickRate = Number.isFinite(skill && skill.poisonTickRate) && skill.poisonTickRate > 0 ? skill.poisonTickRate : 1;
      target.poisonTick = Math.min(Number.isFinite(target.poisonTick) && target.poisonTick > 0 ? target.poisonTick : target.poisonTickRate, target.poisonTickRate);
      target.poisonDamageHpRatio = Number.isFinite(skill && skill.poisonDamageHpRatio) ? skill.poisonDamageHpRatio : 0.01;
      target.poisonSource = source || null;
      ctx.addFloat("毒", target.x, target.y - 34, "#8fd66b");
      return true;
    }

    function applyWound(source, target, stacks = 1) {
      if (!target || target.dead) {
        return false;
      }
      target.woundStacks = Math.min(100, Math.max(0, Math.floor(target.woundStacks || 0)) + Math.max(1, Math.floor(stacks || 1)));
      ctx.addFloat("傷口", target.x, target.y - 34, "#e07266");
      return true;
    }

    function applyPlant(source, target) {
      if (!target || target.dead || (target.plantStage || 0) > 0) {
        return false;
      }
      target.plantStage = 1;
      target.plantSource = source || null;
      target.plantUpgradedBy = {};
      ctx.addFloat("種", target.x, target.y - 34, "#84c66f");
      return true;
    }

    function upgradePlant(source, target, key) {
      if (!target || target.dead || (target.plantStage || 0) <= 0 || (target.plantStage || 0) >= 4) {
        return false;
      }
      if (!target.plantUpgradedBy || typeof target.plantUpgradedBy !== "object" || Array.isArray(target.plantUpgradedBy)) {
        target.plantUpgradedBy = {};
      }
      if (key && target.plantUpgradedBy[key]) {
        return false;
      }
      target.plantStage = Math.min(4, Math.max(1, Math.floor(target.plantStage || 1)) + 1);
      target.plantSource = source || target.plantSource || null;
      if (key) {
        target.plantUpgradedBy[key] = true;
      }
      ctx.addFloat(getPlantStageName(target), target.x, target.y - 34, "#84c66f");
      return true;
    }

    function clearPlant(target) {
      if (!target) {
        return;
      }
      target.plantStage = 0;
      target.plantSource = null;
      target.plantUpgradedBy = {};
    }

    function getPlantStageName(target) {
      const stage = Math.max(0, Math.floor(target && target.plantStage || 0));
      if (stage <= 1) return "種";
      if (stage === 2) return "発芽";
      if (stage === 3) return "開花";
      if (target && target.id === "ulpes") return "ヘンルーダ";
      if (target && target.id === "rihas") return "紫のヒヤシンス";
      if (target && target.id === "sushia") return "キンセンカ";
      if (target && target.id === "finald") return "赤の彼岸花";
      return "花";
    }

    function isFullPlantTarget(target) {
      return Boolean(target && !target.dead && (target.plantStage || 0) >= 4);
    }

    function getFlowerSkillForTarget(target) {
      if (!target) return null;
      if (target.id === "ulpes") return "rue";
      if (target.id === "rihas") return "purple_hyacinth";
      if (target.id === "sushia") return "calendula";
      if (target.id === "finald") return "red_spider_lily";
      return null;
    }

    function getFullPlantTarget(enemy) {
      const candidates = ctx.getFieldPartyMembers().filter(isFullPlantTarget);
      if (!candidates.length) {
        return null;
      }
      return ctx.nearestAlive(enemy, candidates) || candidates[0];
    }

    function applyContempt(source, target, stacks, duration) {
      if (!target || target.dead) {
        return false;
      }
      const active = (target.contemptStacks || 0) > 0 && (target.contemptTimer || 0) > 0;
      target.contemptStacks = Math.max(0, Math.floor(target.contemptStacks || 0)) + Math.max(1, Math.floor(stacks || 1));
      if (!active) {
        target.contemptTimer = Math.max(0, Number.isFinite(duration) ? duration : 0);
        target.contemptMax = Math.max(0, target.contemptTimer);
      }
      ctx.addFloat("軽蔑", target.x, target.y - 34, "#f2c56d");
      return true;
    }

    function applySorrow(source, target, duration) {
      if (!target || target.dead || !Number.isFinite(duration) || duration <= 0) {
        return false;
      }
      target.sorrowTimer = Math.max(target.sorrowTimer || 0, duration);
      target.sorrowMax = Math.max(target.sorrowMax || 0, duration);
      target.sorrowTick = Math.min(Number.isFinite(target.sorrowTick) && target.sorrowTick > 0 ? target.sorrowTick : 1, 1);
      ctx.addFloat("悲哀", target.x, target.y - 34, "#7d8fd8");
      return true;
    }

    function applyReunion(source, target, duration) {
      if (!target || target.dead || !Number.isFinite(duration) || duration <= 0) {
        return false;
      }
      target.reunionTimer = Math.max(target.reunionTimer || 0, duration);
      target.reunionMax = Math.max(target.reunionMax || 0, duration);
      target.reunionSource = source || null;
      ctx.addFloat("再会", target.x, target.y - 34, "#d889b9");
      return true;
    }

    function useEnemySingleTargetSkill(enemy, key, skill, target) {
      if (!target || target.dead) {
        return false;
      }
      const forced = enemy && enemy.forcedEnemySkillKey === key;
      beginEnemySkill(enemy, key, skill);
      const cast = getCastTime(skill.cast, enemy);
      if (cast > 0) {
        enemy.actionLock = Math.max(enemy.actionLock || 0, cast + ctx.ACTION_GAP);
        startEnemyCastVisual(enemy, cast);
        const telegraph = {
          type: "circle", x: target.x, y: target.y, radius: Math.max(target.radius + ctx.battlePx(8), ctx.battlePx(24)), team: "enemy", time: cast,
          hidden: true,
          getPosition: () => ({ x: target.x, y: target.y }),
          resolve: () => resolveEnemySingleTargetSkill(enemy, key, skill, target, { ignoreRange: forced }),
        };
        ctx.addTelegraph(telegraph);
        return true;
      }
      return resolveEnemySingleTargetSkill(enemy, key, skill, target, { ignoreRange: forced });
    }

    function resolveEnemySingleTargetSkill(enemy, key, skill, target, options = {}) {
      if (!enemy || enemy.dead || isActionDisabled(enemy) || !target || target.dead || (!options.ignoreRange && ctx.dist(enemy, target) > getEnemySkillRange(skill) + target.radius)) {
        return false;
      }
      const repeat = Math.max(1, Math.floor(Number.isFinite(skill.repeat) ? skill.repeat : 1));
      const delayMs = Math.max(0, Math.floor(Number.isFinite(skill.repeatDelayMs) ? skill.repeatDelayMs : 0));
      for (let i = 0; i < repeat; i += 1) {
        setTimeout(() => {
          if (!enemy || enemy.dead || isActionDisabled(enemy) || !target || target.dead || (!options.ignoreRange && ctx.dist(enemy, target) > getEnemySkillRange(skill) + target.radius)) {
            return;
          }
          const dealt = ctx.dealDamage(enemy, target, getEnemySkillDamage(enemy, target, skill), getSkillDamageOptions(skill));
          if (Number.isFinite(skill.injuryDuration)) {
            applyInjury(enemy, target, skill.injuryDuration);
          }
          if (skill.poison) {
            applyPoison(enemy, target, skill);
          }
          if (Number.isFinite(skill.woundStacks)) {
            applyWound(enemy, target, skill.woundStacks);
          }
          if (Number.isFinite(skill.sleepDuration)) {
            applySleep(enemy, target, skill.sleepDuration);
          }
          if (Number.isFinite(skill.contemptStacks)) {
            applyContempt(enemy, target, skill.contemptStacks, skill.contemptDuration);
          }
          if (Number.isFinite(skill.sorrowDuration)) {
            applySorrow(enemy, target, skill.sorrowDuration);
          }
          if (Number.isFinite(skill.reunionDuration)) {
            applyReunion(enemy, target, skill.reunionDuration);
          }
          if (skill.removePlantOnHit) {
            clearPlant(target);
          }
          if (skill.forcedFlowerSkill) {
            const flowerSkill = getFlowerSkillForTarget(target);
            if (flowerSkill) {
              enemy.forcedEnemySkillKey = flowerSkill;
              enemy.forcedEnemySkillTarget = null;
              enemy.aiIntent = null;
              ctx.addFloat("花獲得", enemy.x, enemy.y - 34, "#f2c56d");
            }
          }
          if (skill.forceNextSkillOnHit && dealt > 0) {
            enemy.forcedEnemySkillKey = skill.forceNextSkillOnHit;
            enemy.forcedEnemySkillTarget = target;
            enemy.cds.attack = 0;
            enemy.aiIntent = null;
          }
          if (typeof ctx.slashEffect === "function") {
            ctx.slashEffect(enemy, target);
          }
        }, i * delayMs);
      }
      return true;
    }

    function useEnemySleepScent(enemy, key, skill) {
      beginEnemySkill(enemy, key, skill);
      const cast = getCastTime(skill.cast, enemy);
      enemy.actionLock = Math.max(enemy.actionLock || 0, cast + ctx.ACTION_GAP);
      startEnemyCastVisual(enemy, cast, "rgba(185, 168, 255, 0.95)");
      ctx.addTelegraph({
        type: "circle", x: enemy.x, y: enemy.y, radius: skill.radius, team: "enemy", time: cast,
        getPosition: () => ({ x: enemy.x, y: enemy.y }),
        resolve: () => {
          if (enemy.dead || isActionDisabled(enemy)) return;
          const center = { x: enemy.x, y: enemy.y };
          ctx.areas.push({
            type: "sleep_scent", x: center.x, y: center.y, radius: skill.radius, time: skill.duration, tick: 0, tickRate: skill.tickRate || 0.25,
            apply: () => {
              for (const member of ctx.getFieldPartyMembers()) {
                if (!member.dead && ctx.distPoint(member.x, member.y, center.x, center.y) <= skill.radius + member.radius) {
                  applySleep(enemy, member, skill.sleepDuration || 0);
                }
              }
            },
          });
          ctx.addBurst(center.x, center.y, skill.radius, "rgba(185,168,255,0.18)");
        },
      });
      return true;
    }

    function useEnemyPollenSpraying(enemy, key, skill, target) {
      if (!target || target.dead) {
        return false;
      }
      beginEnemySkill(enemy, key, skill);
      const cast = getCastTime(skill.cast, enemy);
      enemy.actionLock = Math.max(enemy.actionLock || 0, cast + ctx.ACTION_GAP);
      startEnemyCastVisual(enemy, cast);
      const center = { x: target.x, y: target.y };
      ctx.addTelegraph({
        type: "circle", x: center.x, y: center.y, radius: skill.radius, team: "enemy", time: cast,
        resolve: () => {
          if (enemy.dead || isActionDisabled(enemy)) return;
          let ticksLeft = Math.max(1, Math.floor(skill.maxTicks || 5));
          ctx.areas.push({
            type: "pollen_spraying", x: center.x, y: center.y, radius: skill.radius, time: skill.duration, tick: 0, tickRate: skill.tickRate || 1,
            apply: () => {
              if (ticksLeft <= 0) return;
              ticksLeft -= 1;
              for (const member of ctx.getFieldPartyMembers()) {
                if (!member.dead && ctx.distPoint(member.x, member.y, center.x, center.y) <= skill.radius + member.radius) {
                  ctx.dealDamage(enemy, member, getEnemySkillDamage(enemy, member, skill), getSkillDamageOptions(skill, { magic: true, dotDamage: true, damageType: skill.damageType }));
                }
              }
            },
          });
          ctx.addBurst(center.x, center.y, skill.radius, "rgba(178,213,104,0.18)");
        },
      });
      return true;
    }

    function shouldShowEnemyCastTelegraph(skill) {
      return Boolean(skill && (
        skill.showTelegraph === true ||
        skill.warningTelegraph === true ||
        skill.telegraph === true
      ));
    }

    function useEnemyAreaSkill(enemy, key, skill) {
      const speakOnCastStart = key === "chocolate_lily";
      beginEnemySkill(enemy, key, skill, { skipSpeech: speakOnCastStart });
      const cast = getCastTime(skill.cast, enemy);
      enemy.actionLock = Math.max(enemy.actionLock || 0, cast + ctx.ACTION_GAP);
      startEnemyCastVisual(enemy, cast, key === "dappled_sunlight" ? "rgba(255, 232, 141, 0.95)" : "rgba(178, 213, 104, 0.95)");
      if (key === "chocolate_lily") {
        enemy.chocolateLilyCharging = true;
        enemy.chocolateLilyDamageTaken = 0;
        speakSkill(enemy, key);
      }
      const center = { x: enemy.x, y: enemy.y };
      const resolve = () => {
        if (enemy.dead || isActionDisabled(enemy)) {
          if (key === "chocolate_lily") {
            enemy.chocolateLilyCharging = false;
            enemy.chocolateLilyDamageTaken = 0;
          }
          return;
        }
        resolveEnemyAreaSkill(enemy, key, skill, center);
      };
      if (cast > 0) {
        ctx.addTelegraph({
          type: "circle", x: center.x, y: center.y, radius: skill.radius, team: "enemy", time: cast,
          hidden: !shouldShowEnemyCastTelegraph(skill),
          getPosition: () => ({ x: enemy.x, y: enemy.y }),
          resolve,
        });
      } else {
        resolve();
      }
      return true;
    }

    function resolveEnemyAreaSkill(enemy, key, skill, center) {
      if (key === "chocolate_lily") {
        enemy.chocolateLilyCharging = false;
      }
      const partyTargets = ctx.getFieldPartyMembers().filter((member) => {
        return member && !member.dead && ctx.distPoint(member.x, member.y, center.x, center.y) <= skill.radius + member.radius;
      });
      if (Number.isFinite(skill.healBase)) {
        const healTargets = skill.affectsEveryone
          ? [...ctx.getFieldPartyMembers(), ...ctx.enemies].filter((unit) => unit && !unit.dead && ctx.distPoint(unit.x, unit.y, center.x, center.y) <= skill.radius + unit.radius)
          : [enemy];
        for (const unit of healTargets) {
          const multiplier = unit === enemy ? (Number.isFinite(skill.selfHealMultiplier) ? skill.selfHealMultiplier : 1) : 1;
          const amount = (skill.healBase + getMagicStat(enemy) * (skill.magicScale || 0)) * multiplier;
          if (ctx.healUnit) {
            ctx.healUnit(enemy, unit, amount, { noUltGain: true });
          }
        }
      }
      let damage = getEnemySkillDamage(enemy, null, skill);
      if (key === "chocolate_lily") {
        damage = Math.max(0, (enemy.chocolateLilyDamageTaken || 0) * (Number.isFinite(skill.receivedDamageScale) ? skill.receivedDamageScale : 0.7));
        enemy.chocolateLilyDamageTaken = 0;
      }
      if (damage > 0) {
        for (const member of partyTargets) {
          ctx.dealDamage(enemy, member, damage, getSkillDamageOptions(skill));
        }
      }
      for (const member of partyTargets) {
        if (Number.isFinite(skill.actionSpeedDownRatio) && Number.isFinite(skill.actionSpeedDownDuration)) {
          applyActionSpeedDown(enemy, member, skill.actionSpeedDownRatio, skill.actionSpeedDownDuration);
        }
        if (skill.plantApply) {
          applyPlant(enemy, member);
        }
        if (skill.plantUpgrade) {
          upgradePlant(enemy, member, key);
        }
      }
      if (skill.radius > 0 && ctx.addBurst) {
        ctx.addBurst(center.x, center.y, skill.radius, key === "dappled_sunlight" ? "rgba(255,232,141,0.18)" : "rgba(132,198,111,0.18)");
      }
    }

    function useEnemyLineSkill(enemy, key, skill, target) {
      if (!target || target.dead) {
        return false;
      }
      beginEnemySkill(enemy, key, skill);
      const cast = getCastTime(skill.cast, enemy);
      enemy.actionLock = Math.max(enemy.actionLock || 0, cast + ctx.ACTION_GAP);
      startEnemyCastVisual(enemy, cast);
      const line = buildEnemyLine(enemy, target, skill);
      ctx.addTelegraph({
        type: "line", x: line.x, y: line.y, x2: line.x2, y2: line.y2, width: skill.radius, team: "enemy", time: cast,
        getLine: () => line,
        resolve: () => {
          if (enemy.dead || isActionDisabled(enemy)) return;
          if (Number.isFinite(skill.duration) && skill.duration > 0) {
            startEnemyLineArea(enemy, skill, line);
          } else {
            applyEnemyLineDamage(enemy, skill, line);
          }
        },
      });
      return true;
    }

    function startEnemyLineArea(enemy, skill, line) {
      const duration = Math.max(0, Number.isFinite(skill.duration) ? skill.duration : 0);
      const tickRate = Math.max(0.1, Number.isFinite(skill.tickRate) ? skill.tickRate : 1);
      ctx.areas.push({
        type: "enemy_line",
        x: line.x,
        y: line.y,
        x2: line.x2,
        y2: line.y2,
        width: skill.radius,
        time: duration,
        total: duration,
        tick: 0,
        tickRate,
        apply: () => {
          if (enemy.dead) return;
          applyEnemyLineDamage(enemy, skill, line);
        },
      });
    }

    function applyEnemyLineDamage(enemy, skill, line) {
      const damage = getEnemySkillDamage(enemy, null, skill);
      for (const member of ctx.getFieldPartyMembers()) {
        if (!member.dead && ctx.distanceToSegment(member.x, member.y, line.x, line.y, line.x2, line.y2) <= skill.radius + member.radius) {
          ctx.dealDamage(enemy, member, damage, getSkillDamageOptions(skill));
        }
      }
    }

    function buildEnemyLine(enemy, target, skill) {
      const end = ctx.projectPoint(enemy, target, getEnemySkillRange(skill));
      return { x: enemy.x, y: enemy.y, x2: end.x, y2: end.y };
    }

    function useEnemyAbsorption(enemy, key, skill, target) {
      if (!target || target.dead) {
        return false;
      }
      beginEnemySkill(enemy, key, skill);
      const cast = getCastTime(skill.cast, enemy);
      enemy.actionLock = Math.max(enemy.actionLock || 0, cast + ctx.ACTION_GAP);
      startEnemyCastVisual(enemy, cast, "rgba(216, 137, 185, 0.95)");
      ctx.addTelegraph({
        type: "circle", x: target.x, y: target.y, radius: Math.max(target.radius + ctx.battlePx(10), ctx.battlePx(28)), team: "enemy", time: cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          if (enemy.dead || target.dead) return;
          const duration = Math.max(0, Number.isFinite(skill.duration) ? skill.duration : 4);
          const tickRate = Math.max(0.1, Number.isFinite(skill.tickRate) ? skill.tickRate : 1);
          enemy.absorptionLockTimer = Math.max(enemy.absorptionLockTimer || 0, duration);
          target.absorptionLockTimer = Math.max(target.absorptionLockTimer || 0, duration);
          let time = duration;
          let tick = 0;
          ctx.areas.push({
            type: "absorption_of_reunion", x: target.x, y: target.y, radius: target.radius + ctx.battlePx(8), time: duration, tick, tickRate,
            apply: () => {
              if (time <= 0 || enemy.dead || target.dead) return;
              time -= tickRate;
              const dealt = ctx.dealDamage(enemy, target, getEnemySkillDamage(enemy, target, skill), getSkillDamageOptions(skill, { dotDamage: true, noCrit: true, noUltGain: true }));
              if (dealt > 0 && ctx.healUnit) {
                ctx.healUnit(enemy, enemy, dealt * (Number.isFinite(skill.absorbHealMultiplier) ? skill.absorbHealMultiplier : 2), { noUltGain: true });
              }
            },
          });
          ctx.addFloat("吸収", target.x, target.y - 34, "#d889b9");
        },
      });
      return true;
    }

    function useEnemyShadowDash(enemy, key, skill) {
      payEnemySkillCost(enemy, skill);
      speakSkill(enemy, key);
      const duration = Math.max(0, Number.isFinite(skill.duration) ? skill.duration : 0);
      enemy.shadowDashTimer = Math.max(enemy.shadowDashTimer || 0, duration);
      enemy.shadowDashMax = Math.max(enemy.shadowDashMax || 0, duration);
      setActionCooldown(enemy);
      if (Number.isFinite(skill.cd) && skill.cd > 0) {
        trackSkillCooldown(enemy, key, key, skill.cd);
      }
      ctx.addFloat(skill.name || "強化", enemy.x, enemy.y - 34, "#9aa7ff");
      ctx.addBurst(enemy.x, enemy.y, enemy.radius + ctx.battlePx(18), "rgba(89,97,125,0.28)");
      return true;
    }

    function getPartySkillCooldowns(unit, key, skill) {
      if (!actionHasSkillCooldown(unit, key)) {
        return [];
      }
      return [{ key, value: ctx.getMoodCooldown(unit, getSkillCooldown(unit, key, skill)) }];
    }

    function getSkillDamage(unit, skill, baseProp = "damageBase", attackProp = "attackScale", magicProp = "magicScale") {
      return getSkillDamageAgainst(unit, skill, null, baseProp, attackProp, magicProp);
    }

    function getSkillDamageAgainst(unit, skill, target = null, baseProp = "damageBase", attackProp = "attackScale", magicProp = "magicScale") {
      let damage = getUpgradedBaseValue(unit, getSkillSourceKey(skill), skill, baseProp);
      let scaledDamage = 0;
      if (Number.isFinite(skill[attackProp])) {
        scaledDamage += getAttackStat(unit) * skill[attackProp];
      }
      if (Number.isFinite(skill[magicProp])) {
        scaledDamage += getMagicStat(unit) * skill[magicProp];
      }
      scaledDamage *= getSkillScaleUpgradeMultiplier(unit, skill);
      if (target && Number.isFinite(skill.missingHpScale) && target.maxHp > 0) {
        const missingRatio = ctx.clamp ? ctx.clamp(1 - Math.max(0, target.hp || 0) / target.maxHp, 0, 1) : Math.max(0, Math.min(1, 1 - Math.max(0, target.hp || 0) / target.maxHp));
        scaledDamage *= 1 + missingRatio * skill.missingHpScale;
      }
      damage += scaledDamage;
      if (isSkillSource(skill, "rihas", "lan_wave") && baseProp === "shockDamageBase") {
        damage += getAttackStat(unit) * getSkillUpgradeLevel(unit, getSkillSourceKey(skill, "lan_wave"), skill) * 0.08;
      }
      return damage;
    }

    function getSkillScaleUpgradeMultiplier(unit, skill) {
      const values = skill && Array.isArray(skill.scaleUpgradeMultipliers) ? skill.scaleUpgradeMultipliers : null;
      if (!values || !values.length) {
        return 1;
      }
      const key = skill.category === "通常攻撃" ? "attack" : getSkillSourceKey(skill);
      return getSkillUpgradeIndexedValue(unit, key, skill, values);
    }

    function getSkillDamageType(skill) {
      return skill && skill.damageType ? String(skill.damageType) : "";
    }

    function isDotDamageSkill(skill) {
      const rawType = getSkillDamageType(skill);
      const type = rawType.toLowerCase();
      return type.includes("dot") || rawType.includes("ドット");
    }

    function isMagicDamageSkill(skill) {
      const rawType = getSkillDamageType(skill);
      const type = rawType.toLowerCase();
      if (type.includes("magic") || rawType.includes("魔法")) {
        return true;
      }
      if (type.includes("physical") || rawType.includes("物理")) {
        return false;
      }
      return Boolean(skill && (skill.damageType === "magic" || (Number.isFinite(skill.magicScale) && !Number.isFinite(skill.attackScale))));
    }

    function getSkillDamageOptions(skill, options = {}) {
      return Object.assign({
        magic: isMagicDamageSkill(skill),
        dotDamage: isDotDamageSkill(skill),
        damageType: getSkillDamageType(skill),
      }, options);
    }

    function dealPartySkillDamage(unit, target, skill, damage, options = {}) {
      const damaged = ctx.dealDamage(unit, target, damage, getSkillDamageOptions(skill, options)) > 0;
      const burnDuration = getOffensiveEffectDuration(unit, target, getSkillBurnDuration(unit, skill));
      if (burnDuration > 0) {
        applyBurn(unit, target, Object.assign({}, skill, { burnDuration }));
        if (!damaged && ctx.awardOffensiveUltimate) ctx.awardOffensiveUltimate(unit, target);
      }
      return damaged;
    }

    function getMagicNeutralizeRatio(unit, key, skill) {
      const base = Number.isFinite(skill && skill.magicNeutralizeBase) ? skill.magicNeutralizeBase : 0;
      const perLevel = Number.isFinite(skill && skill.magicNeutralizePerLevel) ? skill.magicNeutralizePerLevel : 0;
      const level = getSkillUpgradeLevel(unit, key || getSkillSourceKey(skill), skill);
      return Math.max(0, base + perLevel * level);
    }

    function applyMagicNeutralize(unit, target, key, skill) {
      const ratio = getMagicNeutralizeRatio(unit, key, skill);
      const duration = getOffensiveEffectDuration(unit, target, Number.isFinite(skill && skill.magicNeutralizeDuration) ? skill.magicNeutralizeDuration : 0);
      if (!target || target.dead || ratio <= 0 || duration <= 0) {
        return false;
      }
      target.magicNeutralizeTimer = Math.max(target.magicNeutralizeTimer || 0, duration);
      target.magicNeutralizeMax = Math.max(target.magicNeutralizeMax || 0, duration);
      target.magicNeutralizeRatio = Math.max(target.magicNeutralizeRatio || 0, ratio);
      ctx.addFloat("魔力低下", target.x, target.y - 34, "#9ef7ff");
      return true;
    }

    function getSkillSleepChance(unit, key, skill) {
      const base = Number.isFinite(skill && skill.sleepChanceBase) ? skill.sleepChanceBase : 0;
      const perLevel = Number.isFinite(skill && skill.sleepChancePerLevel) ? skill.sleepChancePerLevel : 0;
      const level = getSkillUpgradeLevel(unit, key || getSkillSourceKey(skill), skill);
      return ctx.clamp ? ctx.clamp(base + perLevel * level, 0, 1) : Math.max(0, Math.min(1, base + perLevel * level));
    }

    function applyPartySkillSleep(unit, target, key, skill) {
      const chance = getSkillSleepChance(unit, key, skill);
      const duration = getOffensiveEffectDuration(unit, target, Number.isFinite(skill && skill.sleepDuration) ? skill.sleepDuration : 0);
      if (!target || target.dead || chance <= 0 || duration <= 0 || Math.random() >= chance) {
        return false;
      }
      return applySleep(unit, target, duration);
    }

    function getSkillInjuryDuration(unit, key, skill) {
      const base = Number.isFinite(skill && skill.injuryDuration) ? skill.injuryDuration : 0;
      const perLevel = Number.isFinite(skill && skill.injuryDurationPerLevel) ? skill.injuryDurationPerLevel : 0;
      const level = getSkillUpgradeLevel(unit, key || getSkillSourceKey(skill), skill);
      return Math.max(0, base + perLevel * level);
    }

    function applyPartySkillInjury(unit, target, key, skill) {
      const duration = getOffensiveEffectDuration(unit, target, getSkillInjuryDuration(unit, key, skill));
      return applyInjury(unit, target, duration);
    }

    function applyPartySkillOnHitEffects(unit, target, key, skill, options = {}) {
      let effectApplied = false;
      if (options.sleep !== false && Number.isFinite(skill && skill.sleepChanceBase)) {
        effectApplied = applyPartySkillSleep(unit, target, key, skill) || effectApplied;
      }
      if (options.injury !== false && Number.isFinite(skill && skill.injuryDuration)) {
        effectApplied = applyPartySkillInjury(unit, target, key, skill) || effectApplied;
      }
      return effectApplied;
    }

    function getSleepCleanseTarget(unit, skill) {
      const radius = skill && Number.isFinite(skill.radius) ? skill.radius : Infinity;
      let best = null;
      let bestDistance = Infinity;
      for (const member of getSupportablePartyMembers()) {
        if (!member || member.dead || (member.sleepTimer || 0) <= 0) {
          continue;
        }
        const distance = ctx.dist(unit, member);
        if (distance <= radius + member.radius && distance < bestDistance) {
          best = member;
          bestDistance = distance;
        }
      }
      return best;
    }

    function getSleepCleanseArc(unit, key, skill) {
      const base = Number.isFinite(skill && skill.arcDeg) ? skill.arcDeg : 360;
      const perLevel = Number.isFinite(skill && skill.sleepCleanseArcBonusPerLevel) ? skill.sleepCleanseArcBonusPerLevel : 0;
      return ctx.deg(base + getSkillUpgradeLevel(unit, key || getSkillSourceKey(skill), skill) * perLevel);
    }

    function isInSleepCleanseArea(unit, target, key, skill, aimAngle) {
      const radius = Number.isFinite(skill && skill.radius) ? skill.radius : 0;
      if (!target || target.dead || ctx.distPoint(target.x, target.y, unit.x, unit.y) > radius + target.radius) {
        return false;
      }
      if (!Number.isFinite(skill && skill.arcDeg) || skill.arcDeg >= 360) {
        return true;
      }
      return ctx.inFan(target, unit.x, unit.y, radius, aimAngle, getSleepCleanseArc(unit, key, skill));
    }

    function clearSleepStatus(source, target) {
      if (!target || target.dead || (target.sleepTimer || 0) <= 0) {
        return false;
      }
      target.sleepTimer = 0;
      target.sleepMax = 0;
      ctx.addFloat("睡眠解除", target.x, target.y - 34, "#f7fff6");
      if (ctx.awardSupportUltimate) {
        ctx.awardSupportUltimate(source, target);
      }
      return true;
    }

    function getActionCdPulseFloor(skill) {
      return Math.max(0, Number.isFinite(skill && skill.actionCdSetTo) ? skill.actionCdSetTo : 0);
    }

    function getActionCdPulseCastTime(unit, key, skill) {
      const base = Number.isFinite(skill && skill.cast) ? skill.cast : 0;
      const perLevel = Number.isFinite(skill && skill.castReductionPerLevel) ? skill.castReductionPerLevel : 0;
      const level = getSkillUpgradeLevel(unit, key || getSkillSourceKey(skill), skill);
      return Math.max(0, base - perLevel * level);
    }

    function isInActionCdPulseArea(unit, target, skill) {
      const radius = Number.isFinite(skill && skill.radius) ? skill.radius : 0;
      return Boolean(target && !target.dead && ctx.distPoint(target.x, target.y, unit.x, unit.y) <= radius + target.radius);
    }

    function getActionCdSupportTarget(unit, skill) {
      const floor = getActionCdPulseFloor(skill);
      let best = null;
      let bestCd = floor;
      for (const member of getSupportablePartyMembers()) {
        if (member === unit) {
          continue;
        }
        if (!isInActionCdPulseArea(unit, member, skill)) {
          continue;
        }
        const cd = Number.isFinite(member.cds && member.cds.attack) ? member.cds.attack : 0;
        if (cd > bestCd) {
          best = member;
          bestCd = cd;
        }
      }
      return best;
    }

    function reduceActionCooldown(source, target, floor) {
      if (!target || target.dead || !target.cds || !Number.isFinite(target.cds.attack) || target.cds.attack <= floor) {
        return false;
      }
      target.cds.attack = floor;
      ctx.addFloat("行動短縮", target.x, target.y - 34, "#b9a8ff");
      if (ctx.awardSupportUltimate) {
        ctx.awardSupportUltimate(source, target);
      }
      return true;
    }

    function applyActionCdPulse(unit, skill) {
      const floor = getActionCdPulseFloor(skill);
      let affected = 0;
      for (const member of getSupportablePartyMembers()) {
        if (member === unit) {
          continue;
        }
        if (isInActionCdPulseArea(unit, member, skill) && reduceActionCooldown(unit, member, floor)) {
          affected += 1;
        }
      }
      if (affected > 0) {
        ctx.addBurst(unit.x, unit.y, skill.burstRadius || skill.radius, "rgba(185,168,255,0.2)");
      }
      return affected;
    }

    function applyPartySkillHitEffects(unit, target, key, skill, damageOptions = {}) {
      let damaged = false;
      let effectApplied = false;
      if (Number.isFinite(skill.damageBase) || Number.isFinite(skill.attackScale) || Number.isFinite(skill.magicScale)) {
        damaged = dealPartySkillDamage(unit, target, skill, getSkillDamageAgainst(unit, skill, target), damageOptions);
      }
      if (Number.isFinite(skill.magicNeutralizeBase)) {
        effectApplied = applyMagicNeutralize(unit, target, key, skill) || effectApplied;
      }
      effectApplied = applyPartySkillOnHitEffects(unit, target, key, skill, damageOptions) || effectApplied;
      if (effectApplied && !damaged && ctx.awardOffensiveUltimate) {
        ctx.awardOffensiveUltimate(unit, target);
      }
      return damaged || effectApplied;
    }

    function isSelfCenteredPartySkill(key, skill) {
      return Boolean(skill && Number.isFinite(skill.radius) && (
        skill.center === "self" ||
        skill.target === "self" ||
        (key === "attack" && !Number.isFinite(skill.distanceFalloffMax) && !Number.isFinite(skill.arcDeg) && !skill.approach && !Number.isFinite(skill.projectileCount))
      ));
    }

    function usePartySkillByData(unit, key, skill, target) {
      if (!skill) return false;
      if (Number.isFinite(skill.healBase)) return usePartyHeal(unit, key, target);
      if (Number.isFinite(skill.shieldBase)) return usePartyShield(unit, key, target);
      if (skill.sleepCleanse) return usePartySleepCleanse(unit, key, skill, target);
      if (Number.isFinite(skill.actionCdSetTo)) return usePartyActionCdPulse(unit, key, skill, target);
      if (skill.approach || Number.isFinite(skill.shockRadius)) return useJumpAreaSkill(unit, key, skill, target);
      if (Number.isFinite(skill.arcDeg)) return useFanAreaSkill(unit, key, skill, target);
      if (Number.isFinite(skill.repeat) && Number.isFinite(skill.hitRange)) return useRepeatedMeleeSkill(unit, key, skill, target);
      if (Number.isFinite(skill.projectileCount) && Number.isFinite(skill.projectileSpeed)) return useProjectileLineSkill(unit, key, skill, target);
      if (isSelfCenteredPartySkill(key, skill)) return useSelfAreaSkill(unit, key, skill);
      if (Number.isFinite(skill.radius) && Number.isFinite(skill.damageBase)) return useTargetAreaSkill(unit, key, skill, target);
      if (Number.isFinite(skill.damageBase)) return useSingleTargetLineSkill(unit, key, skill, target);
      return false;
    }

    function useRepeatedMeleeSkill(unit, key, skill, target) {
      if (!target || target.dead) return false;
      speakSkill(unit, key);
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      unit.actionLock = ctx.ACTION_GAP;
      finishPartyAction(unit, getPartySkillCooldowns(unit, key, skill));
      unit.aimAngle = ctx.angleTo(unit, target);
      const repeats = Math.max(1, Math.floor(Number.isFinite(skill.repeat) ? skill.repeat : 1));
      const delayMs = Math.max(0, Number.isFinite(skill.repeatDelayMs) ? skill.repeatDelayMs : 0);
      let sleepAppliedByThisAction = false;
      for (let i = 0; i < repeats; i += 1) {
        setTimeout(() => {
          if (!unit.dead && !target.dead && canOffensiveAffect(unit, target) && ctx.dist(unit, target) <= skill.hitRange) {
            let damage = getSkillDamageAgainst(unit, skill, target);
            if (sleepAppliedByThisAction && i > 0 && Number.isFinite(skill.sleepWakeBonusAttackScale)) {
              damage += getAttackStat(unit) * skill.sleepWakeBonusAttackScale;
            }
            const damaged = dealPartySkillDamage(unit, target, skill, damage, { crit: true });
            const canApplySleep = !skill.sleepFirstRepeatOnly || i === 0 || !sleepAppliedByThisAction;
            if (canApplySleep && damaged) {
              sleepAppliedByThisAction = applyPartySkillSleep(unit, target, key, skill) || sleepAppliedByThisAction;
            }
            if (damaged && Number.isFinite(skill.injuryDuration)) {
              applyPartySkillInjury(unit, target, key, skill);
            }
            ctx.slashEffect(unit, target);
          }
        }, i * delayMs);
      }
      return true;
    }

    function useFanAreaSkill(unit, key, skill, target) {
      if (!target || target.dead) return false;
      speakSkill(unit, key);
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      unit.aimAngle = ctx.angleTo(unit, target);
      ctx.addTelegraph({
        type: "fan", source: unit, x: unit.x, y: unit.y, radius: skill.radius,
        angle: unit.aimAngle, arc: ctx.deg(skill.arcDeg), team: "party", time: cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        getAngle: () => target.dead ? unit.aimAngle : ctx.angleTo(unit, target),
        resolve: () => {
          finishPartyAction(unit, getPartySkillCooldowns(unit, key, skill));
          if (unit.dead || isActionDisabled(unit)) return;
          let hits = 0;
          unit.aimAngle = target.dead ? unit.aimAngle : ctx.angleTo(unit, target);
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            if (ctx.inFan(unitHit, unit.x, unit.y, skill.radius, unit.aimAngle, ctx.deg(skill.arcDeg))) {
              applyPartySkillHitEffects(unit, unitHit, key, skill, { crit: true });
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          if (Number.isFinite(skill.cdRefundPerHit)) {
            const minCd = Number.isFinite(skill.minCdAfterHit) ? skill.minCdAfterHit : 0;
            trackSkillCooldown(unit, key, key, Math.max(minCd, (unit.cds[key] || 0) - hits * getCdRefundPerHit(unit, key, skill)));
          }
          ctx.addBurst(unit.x, unit.y, skill.burstRadius || skill.radius, "rgba(244,197,79,0.22)");
        },
      });
      return true;
    }

    function useSelfAreaSkill(unit, key, skill) {
      speakSkill(unit, key);
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      ctx.addTelegraph({
        type: "circle", x: unit.x, y: unit.y, radius: skill.radius, team: "party", time: cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        resolve: () => {
          finishPartyAction(unit, getPartySkillCooldowns(unit, key, skill));
          if (unit.dead || isActionDisabled(unit)) return;
          let hits = 0;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            if (ctx.distPoint(unitHit.x, unitHit.y, unit.x, unit.y) <= skill.radius + unitHit.radius) {
              if (applyPartySkillHitEffects(unit, unitHit, key, skill)) {
                hits += unitHit.team === "enemy" ? 1 : 0;
              }
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          ctx.addBurst(unit.x, unit.y, skill.burstRadius || skill.radius, "rgba(227,122,63,0.25)");
        },
      });
      return true;
    }

    function usePartySleepCleanse(unit, key, skill, target) {
      const cleanseTarget = target || getSleepCleanseTarget(unit, skill);
      if (!cleanseTarget) return false;
      speakSkill(unit, key);
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      unit.aimAngle = cleanseTarget === unit ? (unit.aimAngle || 0) : ctx.angleTo(unit, cleanseTarget);
      const telegraph = Number.isFinite(skill.arcDeg) && skill.arcDeg < 360
        ? {
            type: "fan", source: unit, x: unit.x, y: unit.y, radius: skill.radius,
            angle: unit.aimAngle, arc: getSleepCleanseArc(unit, key, skill), team: "support", time: cast,
            getPosition: () => ({ x: unit.x, y: unit.y }),
            getAngle: () => unit.aimAngle,
          }
        : {
            type: "circle", x: unit.x, y: unit.y, radius: skill.radius, team: "support", time: cast,
            getPosition: () => ({ x: unit.x, y: unit.y }),
          };
      telegraph.resolve = () => {
        finishPartyAction(unit, getPartySkillCooldowns(unit, key, skill));
        if (unit.dead || isActionDisabled(unit)) return;
        let cleansed = 0;
        const aimAngle = unit.aimAngle || 0;
        for (const member of getSupportablePartyMembers()) {
          if (isInSleepCleanseArea(unit, member, key, skill, aimAngle) && clearSleepStatus(unit, member)) {
            cleansed += 1;
          }
        }
        if (cleansed > 0) {
          ctx.addBurst(unit.x, unit.y, skill.burstRadius || skill.radius, "rgba(185,168,255,0.2)");
        }
      };
      ctx.addTelegraph(telegraph);
      return true;
    }

    function usePartyActionCdPulse(unit, key, skill, target) {
      const pulseTarget = target || getActionCdSupportTarget(unit, skill);
      if (!pulseTarget) return false;
      speakSkill(unit, key);
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(getActionCdPulseCastTime(unit, key, skill), unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      ctx.addTelegraph({
        type: "circle",
        x: unit.x,
        y: unit.y,
        radius: skill.radius,
        team: "support",
        time: cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        resolve: () => {
          finishPartyAction(unit, getPartySkillCooldowns(unit, key, skill));
          if (unit.dead || isActionDisabled(unit)) return;
          applyActionCdPulse(unit, skill);
        },
      });
      return true;
    }

    function useJumpAreaSkill(unit, key, skill, target) {
      if (!target || target.dead) return false;
      speakSkill(unit, key);
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const getLanding = () => {
        const dir = ctx.normalize(target.x - unit.x, target.y - unit.y);
        const offset = Number.isFinite(skill.landingOffset) ? skill.landingOffset : 0;
        return ctx.clampBattlePoint
          ? ctx.clampBattlePoint(target.x - dir.x * offset, target.y - dir.y * offset, ctx.battlePx(45))
          : { x: ctx.clamp(target.x - dir.x * offset, ctx.battlePx(45), ctx.view.w - ctx.battlePx(45)), y: ctx.clamp(target.y - dir.y * offset, ctx.battlePx(45), ctx.view.h - ctx.battlePx(45)) };
      };
      const landing = getLanding();
      const telegraph = {
        type: "circle", x: landing.x, y: landing.y, radius: skill.radius, team: "party", time: cast,
        getPosition: getLanding,
        resolve: () => {
          finishPartyAction(unit, getPartySkillCooldowns(unit, key, skill));
          if (unit.dead || isActionDisabled(unit)) return;
          const impact = { x: telegraph.x, y: telegraph.y };
          let hits = 0;
          unit.x = impact.x;
          unit.y = impact.y;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            const d = ctx.distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
            if (d <= skill.radius + unitHit.radius) {
              dealPartySkillDamage(unit, unitHit, skill, getSkillDamageAgainst(unit, skill, unitHit));
              hits += unitHit.team === "enemy" ? 1 : 0;
            } else if (Number.isFinite(skill.shockRadius) && d <= skill.shockRadius + unitHit.radius) {
              const shockDamage = getSkillDamageAgainst(unit, skill, unitHit, "shockDamageBase", "shockAttackScale", "shockMagicScale");
              dealPartySkillDamage(unit, unitHit, Object.assign({}, skill, { damageType: "magic" }), shockDamage, { magic: true });
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          ctx.addBurst(impact.x, impact.y, skill.burstRadius || skill.radius, "rgba(227,122,63,0.18)");
        },
      };
      ctx.addTelegraph(telegraph);
      return true;
    }

    function useProjectileLineSkill(unit, key, skill, target) {
      if (!target || target.dead) return false;
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      ctx.addTelegraph({
        type: "line", x: unit.x, y: unit.y, x2: target.x, y2: target.y, width: skill.lineWidth || ctx.battlePx(12), team: "party", time: cast,
        getLine: () => ({ x: unit.x, y: unit.y, x2: target.x, y2: target.y }),
        resolve: () => {
          finishPartyAction(unit, getPartySkillCooldowns(unit, key, skill));
          if (unit.dead || isActionDisabled(unit)) return;
          speakSkill(unit, key);
          const count = Math.max(1, Math.floor(skill.projectileCount));
          const damage = getSkillDamage(unit, skill);
          const damageOptions = getSkillDamageOptions(skill);
          const pierceCount = getProjectilePierceCount(unit, key, skill);
          for (let i = 0; i < count; i += 1) {
            const spread = (i - Math.floor(count / 2)) * (Number.isFinite(skill.spread) ? skill.spread : 0);
            const angle = ctx.angleTo(unit, target) + spread;
            ctx.projectiles.push({
              x: unit.x, y: unit.y,
              vx: Math.cos(angle) * skill.projectileSpeed,
              vy: Math.sin(angle) * skill.projectileSpeed,
              radius: skill.projectileRadius || ctx.battlePx(5),
              team: "party",
              owner: unit,
              damage,
              getDamage: (hitTarget) => getSkillDamageAgainst(unit, skill, hitTarget),
              magic: damageOptions.magic,
              dotDamage: damageOptions.dotDamage,
              damageType: damageOptions.damageType,
              life: Number.isFinite(skill.life) ? skill.life : 1.2,
              hit: new Set(),
              pierce: Boolean(skill.pierce) || pierceCount > 0,
              pierceCount: pierceCount > 0 ? pierceCount : undefined,
              affectsAllies: skill.affectsAllies !== false,
              healAllies: Boolean(skill.healAllies),
              heal: Number.isFinite(skill.heal) ? skill.heal : undefined,
              onHit: (hitTarget) => applyPartySkillOnHitEffects(unit, hitTarget, key, skill),
              color: skill.color || "#ffffff",
            });
          }
        },
      });
      return true;
    }

    function useTargetAreaSkill(unit, key, skill, target) {
      if (!target || target.dead) return false;
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "party", time: cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          finishPartyAction(unit, getPartySkillCooldowns(unit, key, skill));
          if (unit.dead || isActionDisabled(unit)) return;
          speakSkill(unit, key);
          const impact = { x: telegraph.x, y: telegraph.y };
          let hits = 0;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            const d = ctx.distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
            if (d <= skill.radius + unitHit.radius) {
              const distanceRatio = ctx.clamp(d / Math.max(1, skill.radius), 0, 1);
              const falloff = getDistanceFalloffMax(unit, skill, 0) * distanceRatio;
              const damage = getSkillDamageAgainst(unit, skill, unitHit) * Math.max(0, 1 - falloff);
              const damaged = dealPartySkillDamage(unit, unitHit, skill, damage);
              const effectApplied = applyPartySkillOnHitEffects(unit, unitHit, key, skill);
              if (effectApplied && !damaged && ctx.awardOffensiveUltimate) {
                ctx.awardOffensiveUltimate(unit, unitHit);
              }
              if (damaged || effectApplied) {
                hits += unitHit.team === "enemy" ? 1 : 0;
              }
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          ctx.addBurst(impact.x, impact.y, skill.burstRadius || skill.radius, "rgba(185,133,238,0.28)");
        },
      };
      ctx.addTelegraph(telegraph);
      return true;
    }

    function useSingleTargetLineSkill(unit, key, skill, target) {
      if (!target || target.dead) return false;
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "line", x: unit.x, y: unit.y, x2: target.x, y2: target.y, width: skill.width || ctx.battlePx(12), team: "party", time: cast,
        getLine: () => ({ x: unit.x, y: unit.y, x2: target.x, y2: target.y }),
        resolve: () => {
          finishPartyAction(unit, getPartySkillCooldowns(unit, key, skill));
          if (unit.dead || isActionDisabled(unit) || !target || target.dead || !canOffensiveAffect(unit, target)) return;
          speakSkill(unit, key);
          applyPartySkillHitEffects(unit, target, key, skill);
          ctx.effects.push({ type: "beam", x: unit.x, y: unit.y, x2: target.x, y2: target.y, color: skill.beamColor || "rgba(255,255,255,0.72)", time: 0.22, age: 0 });
          ctx.addBurst(target.x, target.y, skill.burstRadius || target.radius + ctx.battlePx(12), "rgba(255,139,67,0.24)");
        },
      };
      ctx.addTelegraph(telegraph);
      return true;
    }

    function useUlpesNormal(unit, target) {
      const skill = need("ulpes", "attack");
      speakSkill(unit, "attack");
      beginPartyAction(unit);
      unit.actionLock = ctx.ACTION_GAP;
      finishPartyAction(unit);
      unit.aimAngle = ctx.angleTo(unit, target);
      for (let i = 0; i < skill.repeat; i += 1) {
        setTimeout(() => {
          if (!unit.dead && !target.dead && canOffensiveAffect(unit, target) && ctx.dist(unit, target) <= skill.hitRange) {
            ctx.dealDamage(unit, target, getSkillDamage(unit, skill), getSkillDamageOptions(skill, { crit: true }));
            ctx.slashEffect(unit, target);
          }
        }, i * skill.repeatDelayMs);
      }
    }

    function useUlpesHeroSlash(unit, target) {
      const skill = need("ulpes", "heroSlash");
      speakSkill(unit, "heroSlash");
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      unit.aimAngle = ctx.angleTo(unit, target);
      ctx.addTelegraph({
        type: "fan", source: unit, x: unit.x, y: unit.y, radius: skill.radius,
        angle: unit.aimAngle, arc: ctx.deg(skill.arcDeg), team: "party", time: cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        getAngle: () => target.dead ? unit.aimAngle : ctx.angleTo(unit, target),
        resolve: () => {
          finishPartyAction(unit, [{ key: "heroSlash", value: ctx.getMoodCooldown(unit, skill.cd) }]);
          if (unit.dead || isActionDisabled(unit)) return;
          let hits = 0;
          unit.aimAngle = target.dead ? unit.aimAngle : ctx.angleTo(unit, target);
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            if (ctx.inFan(unitHit, unit.x, unit.y, skill.radius, unit.aimAngle, ctx.deg(skill.arcDeg))) {
              ctx.dealDamage(unit, unitHit, getSkillDamage(unit, skill), getSkillDamageOptions(skill, { crit: true }));
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          trackSkillCooldown(unit, "heroSlash", "heroSlash", Math.max(skill.minCdAfterHit, unit.cds.heroSlash - hits * getCdRefundPerHit(unit, "heroSlash", skill)));
          ctx.addBurst(unit.x, unit.y, skill.burstRadius, "rgba(244,197,79,0.22)");
        },
      });
    }

    function useRihasNormal(unit) {
      const skill = need("rihas", "attack");
      speakSkill(unit, "attack");
      beginPartyAction(unit);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      ctx.addTelegraph({
        type: "circle", x: unit.x, y: unit.y, radius: skill.radius, team: "party", time: cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        resolve: () => {
          finishPartyAction(unit);
          if (unit.dead || isActionDisabled(unit)) return;
          let hits = 0;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            if (ctx.distPoint(unitHit.x, unitHit.y, unit.x, unit.y) <= skill.radius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, getSkillDamage(unit, skill), getSkillDamageOptions(skill));
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          ctx.addBurst(unit.x, unit.y, skill.burstRadius, "rgba(227,122,63,0.25)");
        },
      });
    }
    function useRihasJump(unit, target) {
      const skill = getUnitSkill(unit, "lan_wave") || need("rihas", "lan_wave");
      speakSkill(unit, "lan_wave");
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const getLanding = () => {
        const dir = ctx.normalize(target.x - unit.x, target.y - unit.y);
        return ctx.clampBattlePoint
          ? ctx.clampBattlePoint(target.x - dir.x * skill.landingOffset, target.y - dir.y * skill.landingOffset, ctx.battlePx(45))
          : { x: ctx.clamp(target.x - dir.x * skill.landingOffset, ctx.battlePx(45), ctx.view.w - ctx.battlePx(45)), y: ctx.clamp(target.y - dir.y * skill.landingOffset, ctx.battlePx(45), ctx.view.h - ctx.battlePx(45)) };
      };
      const landing = getLanding();
      const telegraph = {
        type: "circle", x: landing.x, y: landing.y, radius: skill.radius, team: "party", time: cast,
        getPosition: getLanding,
        resolve: () => {
          finishPartyAction(unit, [{ key: "lan_wave", value: ctx.getMoodCooldown(unit, skill.cd) }]);
          if (unit.dead || isActionDisabled(unit)) return;
          const impact = { x: telegraph.x, y: telegraph.y };
          let hits = 0;
          unit.x = impact.x;
          unit.y = impact.y;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            const d = ctx.distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
            if (d <= skill.radius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, getSkillDamage(unit, skill), getSkillDamageOptions(skill));
              hits += unitHit.team === "enemy" ? 1 : 0;
            } else if (d <= skill.shockRadius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, getSkillDamage(unit, skill, "shockDamageBase", "shockAttackScale", "shockMagicScale"), getSkillDamageOptions(Object.assign({}, skill, { damageType: "magic" }), { magic: true }));
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          ctx.addBurst(impact.x, impact.y, skill.burstRadius, "rgba(227,122,63,0.18)");
        },
      };
      ctx.addTelegraph(telegraph);
    }

    function useSushiaBolts(unit, target) {
      const skill = need("sushia", "attack");
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = ctx.getSushiaCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      ctx.addTelegraph({
        type: "line", x: unit.x, y: unit.y, x2: target.x, y2: target.y, width: skill.lineWidth, team: "party", time: cast,
        getLine: () => ({ x: unit.x, y: unit.y, x2: target.x, y2: target.y }),
        resolve: () => {
          finishPartyAction(unit);
          if (unit.dead || isActionDisabled(unit)) return;
          speakSkill(unit, "attack");
          const pierceCount = getProjectilePierceCount(unit, "attack", skill);
          const damageOptions = getSkillDamageOptions(skill, { magic: true });
          for (let i = 0; i < skill.projectileCount; i += 1) {
            const spread = (i - Math.floor(skill.projectileCount / 2)) * skill.spread;
            const angle = ctx.angleTo(unit, target) + spread;
            ctx.projectiles.push({ x: unit.x, y: unit.y, vx: Math.cos(angle) * skill.projectileSpeed, vy: Math.sin(angle) * skill.projectileSpeed, radius: skill.projectileRadius, team: "party", owner: unit, damage: getSkillDamage(unit, skill), getDamage: (hitTarget) => getSkillDamageAgainst(unit, skill, hitTarget), magic: damageOptions.magic, dotDamage: damageOptions.dotDamage, damageType: damageOptions.damageType, life: skill.life, hit: new Set(), pierce: pierceCount > 0, pierceCount: pierceCount > 0 ? pierceCount : undefined, affectsAllies: true, color: skill.color });
          }
        },
      });
    }

    function useSushiaBomb(unit, target) {
      const skill = need("sushia", "bomb");
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = ctx.getSushiaCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "party", time: cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          finishPartyAction(unit, [{ key: "bomb", value: ctx.getMoodCooldown(unit, skill.cd) }]);
          if (unit.dead || isActionDisabled(unit)) return;
          speakSkill(unit, "bomb");
          const impact = { x: telegraph.x, y: telegraph.y };
          let hits = 0;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            const d = ctx.distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
            if (d <= skill.radius + unitHit.radius) {
              const distanceRatio = ctx.clamp(d / Math.max(1, skill.radius), 0, 1);
              const falloff = getDistanceFalloffMax(unit, skill, 0.8) * distanceRatio;
              const damage = getSkillDamage(unit, skill) * Math.max(0, 1 - falloff);
              ctx.dealDamage(unit, unitHit, damage, getSkillDamageOptions(skill, { magic: true }));
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          ctx.addBurst(impact.x, impact.y, skill.burstRadius, "rgba(185,133,238,0.28)");
        },
      };
      ctx.addTelegraph(telegraph);
    }

    function useSushiaFire(unit, target) {
      const skill = need("sushia", "fire");
      if (!target || target.dead) return;
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = ctx.getSushiaCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "line", x: unit.x, y: unit.y, x2: target.x, y2: target.y, width: ctx.battlePx(12), team: "party", time: cast,
        getLine: () => ({ x: unit.x, y: unit.y, x2: target.x, y2: target.y }),
        resolve: () => {
          finishPartyAction(unit, [{ key: "fire", value: ctx.getMoodCooldown(unit, skill.cd) }]);
          if (unit.dead || isActionDisabled(unit) || !target || target.dead || !canOffensiveAffect(unit, target)) return;
          speakSkill(unit, "fire");
          const damaged = ctx.dealDamage(unit, target, getFireDamage(unit, skill), getSkillDamageOptions(skill, { magic: true })) > 0;
          const burnDuration = getOffensiveEffectDuration(unit, target, getSkillBurnDuration(unit, skill));
          if (burnDuration > 0) {
            applyBurn(unit, target, Object.assign({}, skill, { burnDuration }));
            if (!damaged && ctx.awardOffensiveUltimate) ctx.awardOffensiveUltimate(unit, target);
          }
          ctx.effects.push({ type: "beam", x: unit.x, y: unit.y, x2: target.x, y2: target.y, color: skill.beamColor, time: 0.22, age: 0 });
          ctx.addBurst(target.x, target.y, skill.burstRadius, "rgba(255,139,67,0.24)");
        },
      };
      ctx.addTelegraph(telegraph);
    }

    function usePartyRegret(unit) {
      const skill = getUnitSkill(unit, "regret");
      if (!unit || unit.dead || !skill || isActionDisabled(unit) || unit.actionLock > 0) {
        return false;
      }
      beginPartyAction(unit);
      unit.aim = null;
      unit.itemAim = null;
      unit.itemUseRequest = null;
      unit.itemCast = null;
      unit.aiIntent = null;
      clearRegret(unit);
      speakSkill(unit, "regret");
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      unit.actionTotal = Math.max(unit.actionTotal || 0, unit.actionLock);
      ctx.addTelegraph({
        type: "circle",
        x: unit.x,
        y: unit.y,
        radius: unit.radius + ctx.battlePx(22),
        team: "enemy",
        time: cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        resolve: () => {
          finishPartyAction(unit);
          if (unit.dead || isActionDisabled(unit)) return;
          const ratio = Number.isFinite(skill.currentHpDamageRatio) ? skill.currentHpDamageRatio : 0.75;
          ctx.dealDamage(unit, unit, Math.max(0, unit.hp * ratio), getSkillDamageOptions(skill, { noUltGain: true }));
          ctx.addBurst(unit.x, unit.y, unit.radius + ctx.battlePx(28), "rgba(119,136,200,0.24)");
        },
      });
      return true;
    }

    function usePartyHeal(unit, key, target) {
      const skill = getUnitSkill(unit, key);
      if (!skill || !target || target.dead || !canSupportAffect(unit, target) || !ctx.isFieldUnit(target)) return false;
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "circle",
        x: target.x,
        y: target.y,
        radius: target.radius + ctx.battlePx(18),
        team: "support",
        time: cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          finishPartyAction(unit, [{ key, value: ctx.getMoodCooldown(unit, skill.cd) }]);
          if (unit.dead || isActionDisabled(unit) || !target || target.dead || !canSupportAffect(unit, target) || !ctx.isFieldUnit(target)) return;
          speakSkill(unit, key);
          ctx.healUnit(unit, target, getUpgradedBaseValue(unit, key, skill, "healBase") + getMagicStat(unit) * skill.magicScale, { noMood: target === unit });
          ctx.effects.push({ type: "beam", x: unit.x, y: unit.y, x2: target.x, y2: target.y, color: skill.beamColor, time: 0.24, age: 0 });
        },
      };
      ctx.addTelegraph(telegraph);
      return true;
    }

    function usePartyShield(unit, key, target) {
      const skill = getUnitSkill(unit, key);
      if (!skill || !target || target.dead || !canSupportAffect(unit, target) || !ctx.isFieldUnit(target)) return false;
      beginPartyAction(unit);
      paySkillCost(unit, skill);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "circle",
        x: target.x,
        y: target.y,
        radius: target.radius + ctx.battlePx(18),
        team: "support",
        time: cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          finishPartyAction(unit, [{ key, value: ctx.getMoodCooldown(unit, skill.cd) }]);
          if (unit.dead || isActionDisabled(unit) || !target || target.dead || !canSupportAffect(unit, target) || !ctx.isFieldUnit(target)) return;
          speakSkill(unit, key);
          const addedShield = ctx.addShield(target, getUpgradedBaseValue(unit, key, skill, "shieldBase") + getMagicStat(unit) * skill.magicScale, skill.duration);
          if (addedShield > 0 && ctx.awardSupportUltimate) ctx.awardSupportUltimate(unit, target);
          ctx.addTelegraph({ type: "circle", x: target.x, y: target.y, radius: target.radius + ctx.battlePx(18), team: "support", time: 0.18, resolve: () => {} });
          ctx.addBurst(target.x, target.y, target.radius + ctx.battlePx(18), "rgba(143,233,255,0.25)");
        },
      };
      ctx.addTelegraph(telegraph);
      return true;
    }

    function startPlayerAim(type) {
      const player = ctx.player;
      if (isPlayerControlLocked()) {
        showPlayerControlLocked();
        return false;
      }
      if (player.dead || player.channel || player.cast || isActionDisabled(player)) return false;
      if (hasPlayerMoveIntent()) {
        showPlayerMoveIntentBusy();
        return false;
      }
      if (!isSkillEquipped(player, type)) {
        const origin = ctx.getSupportOrigin();
        ctx.addFloat("未セット", origin.x + 26, origin.y - 28, "#ffffff");
        return false;
      }
      if (isCommandSkill(type)) {
        const skill = get("finald", type);
        if (!skill || (player.cds[type] || 0) > 0) {
          const origin = ctx.getSupportOrigin();
          ctx.addFloat("再指示中", origin.x + 26, origin.y - 28, "#ffffff");
          return false;
        }
      }
      player.aim = { type };
      ctx.game.hover = ctx.getHoveredPartyMember();
      return true;
    }

    function cancelPlayerAim() {
      ctx.player.aim = null;
    }

    function getPlayerSkillRange(skill) {
      return skill && Number.isFinite(skill.range) ? skill.range : Infinity;
    }

    function getPlayerSkillRadius(skill) {
      return skill && Number.isFinite(skill.radius) ? skill.radius : Infinity;
    }

    function isSelfCenteredPlayerSkill(skill) {
      return Boolean(skill && Number.isFinite(skill.radius) && (
        skill.target === "allAllies" ||
        skill.center === "self"
      ));
    }

    function isPointInPlayerRange(x, y, range, extra = 0) {
      if (!Number.isFinite(range)) {
        return true;
      }
      return ctx.distPoint(ctx.player.x, ctx.player.y, x, y) <= range + extra;
    }

    function showPlayerRangeError(x, y) {
      ctx.addFloat("射程外", x, y - 18, "#ffffff");
    }

    function hasPlayerMoveIntent() {
      const intent = ctx.player && ctx.player.aiIntent;
      return Boolean(intent && intent.manual);
    }

    function showPlayerMoveIntentBusy() {
      const origin = ctx.getSupportOrigin();
      ctx.addFloat("移動中", origin.x + 26, origin.y - 28, "#ffffff");
    }

    function ensurePlayerSkillRange(key, target, skill, extra = 0, options = {}) {
      if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) {
        return "blocked";
      }
      const range = getPlayerSkillRange(skill);
      if (!Number.isFinite(range) || isPointInPlayerRange(target.x, target.y, range, extra)) {
        return "inRange";
      }
      if (options.fromMoveIntent) {
        showPlayerRangeError(target.x, target.y);
        return "blocked";
      }
      ctx.player.aiIntent = {
        manual: true,
        key,
        target,
        range: range + Math.max(0, Number.isFinite(extra) ? extra : 0),
        support: Boolean(options.support),
      };
      ctx.player.aim = null;
      showPlayerMoveIntentBusy();
      return "queued";
    }

    function getPlayerSelfCenteredAimPoint() {
      return ctx.clampBattlePoint
        ? ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12))
        : { x: ctx.input.mouse.x, y: ctx.input.mouse.y };
    }

    function getPlayerMovePreviewPoint(target, range, extra = 0) {
      const player = ctx.player;
      if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y) || !Number.isFinite(range)) {
        return null;
      }
      const stopRange = Math.max(0, range + Math.max(0, Number.isFinite(extra) ? extra : 0));
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= stopRange || distance <= 0.001) {
        return null;
      }
      const travel = distance - stopRange;
      return {
        x: player.x + dx / distance * travel,
        y: player.y + dy / distance * travel,
      };
    }

    function getPlayerSelfCenteredMovePreviewPoint(target) {
      const player = ctx.player;
      if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) {
        return null;
      }
      if (ctx.distPoint(player.x, player.y, target.x, target.y) <= ctx.battlePx(8)) {
        return null;
      }
      return target;
    }

    function ensurePlayerSelfCenteredSkillPosition(key, target, skill, options = {}) {
      if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.y)) {
        return "blocked";
      }
      if (!isSelfCenteredPlayerSkill(skill)) {
        return "inRange";
      }
      const arrivalRange = ctx.battlePx(8);
      if (ctx.distPoint(ctx.player.x, ctx.player.y, target.x, target.y) <= arrivalRange) {
        return "inRange";
      }
      if (options.fromMoveIntent) {
        showPlayerRangeError(target.x, target.y);
        return "blocked";
      }
      ctx.player.aiIntent = {
        manual: true,
        key,
        target: { x: target.x, y: target.y, selfCenteredSkillPoint: true },
        range: arrivalRange,
        support: true,
      };
      ctx.player.aim = null;
      showPlayerMoveIntentBusy();
      return "queued";
    }

    function stopIfPlayerSkillQueued(rangeState) {
      return rangeState === "queued";
    }

    function executePlayerMoveIntent(unit) {
      const player = ctx.player;
      if (!player || unit !== player) {
        return false;
      }
      const intent = player.aiIntent;
      if (!intent || !intent.manual) {
        return false;
      }
      const target = intent.target;
      player.aiIntent = null;
      if (!target || target.dead) {
        const origin = ctx.getSupportOrigin();
        ctx.addFloat("対象なし", origin.x + 26, origin.y - 28, "#ffffff");
        return false;
      }
      const options = { fromMoveIntent: true };
      if (intent.key === "attack") return firePlayerShot(target, options);
      if (intent.key === "heal") return castHeal(target, options);
      if (intent.key === "shield") return castShield(target, options);
      if (intent.key === "fire") return castPlayerFire(target, options);
      if (intent.key === "bomb") return castPlayerBomb(target, options);
      if (isCommandSkill(intent.key)) return usePlayerCommand(intent.key, target, options);
      return false;
    }

    function confirmPlayerAim() {
      const player = ctx.player;
      if (isPlayerControlLocked()) {
        player.aim = null;
        showPlayerControlLocked();
        return false;
      }
      if (!player.aim || player.dead || player.channel || player.cast || isActionDisabled(player)) return false;
      ctx.game.hover = ctx.getHoveredPartyMember();
      if (player.aim.type === "attack") return firePlayerShot();
      if (player.aim.type === "heal") return castHeal();
      if (player.aim.type === "shield") return castShield();
      if (player.aim.type === "fire") return castPlayerFire();
      if (player.aim.type === "bomb") return castPlayerBomb();
      if (isCommandSkill(player.aim.type)) return usePlayerCommand(player.aim.type);
      return false;
    }

    function firePlayerShot(lockedTarget = null, options = {}) {
      const player = ctx.player;
      const skill = getUnitSkill(player, "attack") || need("finald", "attack");
      if (isPlayerControlLocked()) {
        showPlayerControlLocked();
        return false;
      }
      if (player.dead || player.channel || player.cast || isActionDisabled(player) || player.actionLock > 0) return false;
      const target = lockedTarget || ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
      const origin = ctx.getSupportOrigin(target);
      const rangeState = isSelfCenteredPlayerSkill(skill)
        ? ensurePlayerSelfCenteredSkillPosition("attack", target, skill, options)
        : ensurePlayerSkillRange("attack", target, skill, 0, options);
      if (stopIfPlayerSkillQueued(rangeState)) return true;
      if (rangeState !== "inRange") return false;
      if ((player.cds.attack || 0) > 0) { ctx.addFloat("再詠唱中", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      if (!canPaySkillCost(player, skill)) { ctx.addFloat("魔力不足", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      const castBase = Number.isFinite(skill.actionCdSetTo) ? getActionCdPulseCastTime(player, "attack", skill) : skill.cast;
      if (!ctx.startPlayerCast("attack", { target }, getCastTime(castBase, player))) return false;
      paySkillCost(player, skill);
      return true;
    }

    function completePlayerShot(lockedTarget) {
      const player = ctx.player;
      const skill = getUnitSkill(player, "attack") || need("finald", "attack");
      const target = lockedTarget || ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
      const center = isSelfCenteredPlayerSkill(skill) ? { x: player.x, y: player.y } : target;
      const origin = ctx.getSupportOrigin(center);
      speakSkill(player, "attack");
      if (Number.isFinite(skill.actionCdSetTo)) {
        applyActionCdPulse(player, skill);
        ctx.addTelegraph({
          type: "circle",
          x: player.x,
          y: player.y,
          radius: skill.radius,
          team: "support",
          time: 0.16,
          resolve: () => {},
        });
        return;
      }
      if (skill.sleepCleanse) {
        const aimAngle = Number.isFinite(player.aimAngle) ? player.aimAngle : 0;
        let cleansed = 0;
        for (const member of getSupportablePartyMembers()) {
          if (isInSleepCleanseArea(player, member, "attack", skill, aimAngle) && clearSleepStatus(player, member)) {
            cleansed += 1;
          }
        }
        ctx.addTelegraph({
          type: Number.isFinite(skill.arcDeg) && skill.arcDeg < 360 ? "fan" : "circle",
          source: player,
          x: player.x,
          y: player.y,
          radius: skill.radius,
          angle: aimAngle,
          arc: getSleepCleanseArc(player, "attack", skill),
          team: "support",
          time: 0.16,
          resolve: () => {},
        });
        if (cleansed > 0) {
          ctx.addBurst(player.x, player.y, skill.burstRadius || skill.radius, "rgba(185,168,255,0.2)");
        }
        return;
      }
      let hits = 0;
      for (const unit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
        if (unit.dead || unit === player) {
          continue;
        }
        if (!canOffensiveAffect(player, unit)) continue;
        if (ctx.distPoint(unit.x, unit.y, center.x, center.y) <= skill.radius + unit.radius) {
          if (applyPartySkillHitEffects(player, unit, "attack", skill, { magic: true })) {
            hits += 1;
          }
        }
      }
      ctx.effects.push({ type: "beam", x: origin.x, y: origin.y, x2: center.x, y2: center.y, color: skill.color || "rgba(158,247,255,0.78)", time: 0.18, age: 0 });
      ctx.addTelegraph({ type: "circle", x: center.x, y: center.y, radius: skill.radius, team: "support", time: 0.16, resolve: () => {} });
      ctx.addBurst(center.x, center.y, skill.burstRadius || skill.radius, hits > 0 ? "rgba(158,247,255,0.28)" : "rgba(158,247,255,0.14)");
    }
    function castHeal(lockedTarget = null, options = {}) {
      const player = ctx.player;
      const skill = need("finald", "heal");
      if (isPlayerControlLocked()) {
        showPlayerControlLocked();
        return false;
      }
      if (player.dead || player.channel || player.cast || isActionDisabled(player) || player.actionLock > 0) return false;
      const target = lockedTarget || ctx.game.hover;
      if (!target || target.dead || target.team !== "party") { ctx.addFloat("対象なし", ctx.input.mouse.x, ctx.input.mouse.y - 12, "#ffffff"); return false; }
      const rangeState = ensurePlayerSkillRange("heal", target, skill, target.radius, { ...options, support: true });
      if (stopIfPlayerSkillQueued(rangeState)) return true;
      if (rangeState !== "inRange") return false;
      if ((player.cds.heal || 0) > 0) { ctx.addFloat("再詠唱中", target.x, target.y - 28, "#ffffff"); return false; }
      if (!canPaySkillCost(player, skill)) { ctx.addFloat("魔力不足", target.x, target.y - 28, "#ffffff"); return false; }
      if (!ctx.startPlayerCast("heal", { target }, getCastTime(skill.cast, player))) return false;
      paySkillCost(player, skill);
      return true;
    }

    function completeHeal(target) {
      const player = ctx.player;
      const skill = need("finald", "heal");
      if (!target || target.dead || target.team !== "party" || !ctx.isFieldUnit(target)) {
        const origin = ctx.getSupportOrigin();
        ctx.addFloat("対象なし", origin.x + 26, origin.y - 28, "#ffffff");
        return;
      }
      speakSkill(player, "heal");
      ctx.healUnit(player, target, getUpgradedBaseValue(player, "heal", skill, "healBase") + getMagicStat(player) * skill.magicScale, { noMood: target === player });
      const origin = ctx.getSupportOrigin(target);
      ctx.effects.push({ type: "beam", x: origin.x, y: origin.y, x2: target.x, y2: target.y, color: skill.beamColor, time: 0.24, age: 0 });
    }

    function castShield(lockedTarget = null, options = {}) {
      const player = ctx.player;
      const skill = need("finald", "shield");
      if (isPlayerControlLocked()) {
        showPlayerControlLocked();
        return false;
      }
      if (player.dead || player.channel || player.cast || isActionDisabled(player) || player.actionLock > 0) return false;
      const target = lockedTarget || ctx.game.hover;
      const origin = target || ctx.getSupportOrigin();
      if (!target || target.dead || target.team !== "party" || !ctx.isFieldUnit(target)) { ctx.addFloat("対象なし", ctx.input.mouse.x, ctx.input.mouse.y - 12, "#ffffff"); return false; }
      const rangeState = ensurePlayerSkillRange("shield", target, skill, target.radius, { ...options, support: true });
      if (stopIfPlayerSkillQueued(rangeState)) return true;
      if (rangeState !== "inRange") return false;
      if ((player.cds.shield || 0) > 0) { ctx.addFloat("再詠唱中", target.x, target.y - 28, "#ffffff"); return false; }
      if (!canPaySkillCost(player, skill)) { ctx.addFloat("魔力不足", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      if (!ctx.startPlayerCast("shield", { target }, getCastTime(skill.cast, player))) return false;
      paySkillCost(player, skill);
      return true;
    }

    function completeShield(target) {
      const player = ctx.player;
      const skill = need("finald", "shield");
      if (!target || target.dead || target.team !== "party" || !ctx.isFieldUnit(target)) {
        const origin = ctx.getSupportOrigin();
        ctx.addFloat("対象なし", origin.x + 26, origin.y - 28, "#ffffff");
        return;
      }
      speakSkill(player, "shield");
      const addedShield = ctx.addShield(target, getUpgradedBaseValue(player, "shield", skill, "shieldBase") + getMagicStat(player) * skill.magicScale, skill.duration);
      if (addedShield > 0 && ctx.awardSupportUltimate) ctx.awardSupportUltimate(player, target);
      ctx.addTelegraph({ type: "circle", x: target.x, y: target.y, radius: target.radius + 18, team: "support", time: 0.18, resolve: () => {} });
      ctx.addBurst(target.x, target.y, target.radius + 18, "rgba(143,233,255,0.25)");
    }

    function castPlayerFire(lockedTarget = null, options = {}) {
      const player = ctx.player;
      const skill = get("finald", "fire");
      if (isPlayerControlLocked()) {
        showPlayerControlLocked();
        return false;
      }
      if (!skill || player.dead || player.channel || player.cast || isActionDisabled(player) || player.actionLock > 0) return false;
      const target = lockedTarget || getHoveredEnemy();
      if (!target) { ctx.addFloat("対象なし", ctx.input.mouse.x, ctx.input.mouse.y - 12, "#ffffff"); return false; }
      const rangeState = ensurePlayerSkillRange("fire", target, skill, target.radius, options);
      if (stopIfPlayerSkillQueued(rangeState)) return true;
      if (rangeState !== "inRange") return false;
      if ((player.cds.fire || 0) > 0) { ctx.addFloat("再詠唱中", target.x, target.y - 28, "#ffffff"); return false; }
      if (!canPaySkillCost(player, skill)) { ctx.addFloat("魔力不足", target.x, target.y - 28, "#ffffff"); return false; }
      if (!ctx.startPlayerCast("fire", { target }, getCastTime(skill.cast, player))) return false;
      paySkillCost(player, skill);
      return true;
    }

    function completePlayerFire(target) {
      const player = ctx.player;
      const skill = get("finald", "fire");
      if (!skill || !target || target.dead || !canOffensiveAffect(player, target)) {
        const origin = ctx.getSupportOrigin();
        ctx.addFloat("対象なし", origin.x + 26, origin.y - 28, "#ffffff");
        return;
      }
      speakSkill(player, "fire");
      const damaged = ctx.dealDamage(player, target, getFireDamage(player, skill), getSkillDamageOptions(skill, { magic: true })) > 0;
      const burnDuration = getOffensiveEffectDuration(player, target, getSkillBurnDuration(player, skill));
      if (burnDuration > 0) {
        applyBurn(player, target, Object.assign({}, skill, { burnDuration }));
        if (!damaged && ctx.awardOffensiveUltimate) ctx.awardOffensiveUltimate(player, target);
      }
      const origin = ctx.getSupportOrigin(target);
      ctx.effects.push({ type: "beam", x: origin.x, y: origin.y, x2: target.x, y2: target.y, color: skill.beamColor, time: 0.22, age: 0 });
      ctx.addBurst(target.x, target.y, skill.burstRadius, "rgba(255,139,67,0.24)");
    }

    function castPlayerBomb(lockedTarget = null, options = {}) {
      const player = ctx.player;
      const skill = get("finald", "bomb");
      if (isPlayerControlLocked()) {
        showPlayerControlLocked();
        return false;
      }
      if (!skill || player.dead || player.channel || player.cast || isActionDisabled(player) || player.actionLock > 0) return false;
      const target = lockedTarget || ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
      const origin = ctx.getSupportOrigin(target);
      const rangeState = ensurePlayerSkillRange("bomb", target, skill, 0, options);
      if (stopIfPlayerSkillQueued(rangeState)) return true;
      if (rangeState !== "inRange") return false;
      if ((player.cds.bomb || 0) > 0) { ctx.addFloat("再詠唱中", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      if (!canPaySkillCost(player, skill)) { ctx.addFloat("魔力不足", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      if (!ctx.startPlayerCast("bomb", { target }, getCastTime(skill.cast, player))) return false;
      paySkillCost(player, skill);
      return true;
    }

    function completePlayerBomb(target) {
      const player = ctx.player;
      const skill = get("finald", "bomb");
      if (!skill || !target) {
        return;
      }
      speakSkill(player, "bomb");
      let hits = 0;
      for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
        if (unitHit.dead || unitHit === player) continue;
        if (!canOffensiveAffect(player, unitHit)) continue;
        const d = ctx.distPoint(unitHit.x, unitHit.y, target.x, target.y);
        if (d <= skill.radius + unitHit.radius) {
          const distanceRatio = ctx.clamp(d / Math.max(1, skill.radius), 0, 1);
          const falloff = getDistanceFalloffMax(player, skill, 0.8) * distanceRatio;
          const damage = getSkillDamage(player, skill) * Math.max(0, 1 - falloff);
          ctx.dealDamage(player, unitHit, damage, getSkillDamageOptions(skill, { magic: true }));
          hits += unitHit.team === "enemy" ? 1 : 0;
        }
      }
      if (ctx.applyMultiHitMoodBonus) ctx.applyMultiHitMoodBonus(player, hits);
      ctx.addBurst(target.x, target.y, skill.burstRadius, "rgba(185,133,238,0.28)");
    }

    function isCommandSkill(key) {
      return COMMAND_SKILL_KEYS.includes(key);
    }

    function usePlayerCommand(key, lockedTarget = null, options = {}) {
      const player = ctx.player;
      const skill = get("finald", key);
      if (isPlayerControlLocked()) {
        showPlayerControlLocked();
        return false;
      }
      if (!skill || !isCommandSkill(key)) {
        return false;
      }
      if (!options.fromMoveIntent && hasPlayerMoveIntent()) {
        showPlayerMoveIntentBusy();
        return false;
      }
      if (!isSkillEquipped(player, key)) {
        const origin = ctx.getSupportOrigin();
        ctx.addFloat("未セット", origin.x + 26, origin.y - 28, "#ffffff");
        return false;
      }
      if (player.dead || player.channel || player.cast || isActionDisabled(player) || player.actionLock > 0) {
        return false;
      }
      const origin = ctx.getSupportOrigin();
      if ((player.cds[key] || 0) > 0) {
        ctx.addFloat("再指示中", origin.x + 26, origin.y - 28, "#ffffff");
        return false;
      }
      if (!canPaySkillCost(player, skill)) {
        ctx.addFloat("魔力不足", origin.x + 26, origin.y - 28, "#ffffff");
        return false;
      }

      if (skill.target === "enemy") {
        const target = lockedTarget || (ctx.getHoveredEnemy ? ctx.getHoveredEnemy() : null);
        if (!target || target.dead || target.team !== "enemy") {
          ctx.addFloat("対象なし", ctx.input.mouse.x, ctx.input.mouse.y - 12, "#ffffff");
          return false;
        }
        const rangeState = ensurePlayerSkillRange(key, target, skill, target.radius, options);
        if (stopIfPlayerSkillQueued(rangeState)) return true;
        if (rangeState !== "inRange") return false;
        if (skill.avoidTarget) {
          if (ctx.setAvoidTarget) {
            if (!ctx.setAvoidTarget(target, skill.duration, skill.name)) {
              ctx.addFloat("対象なし", target.x, target.y - 28, "#ffffff");
              return false;
            }
          } else {
            ctx.game.avoidTarget = target;
            ctx.game.avoidTargetTimer = Number.isFinite(skill.duration) && skill.duration > 0 ? skill.duration : 0;
          }
          paySkillCost(player, skill);
          player.cds[key] = getSkillCooldown(player, key, skill);
          player.aim = null;
          player.actionLock = Math.max(player.actionLock, ctx.ACTION_GAP);
          speakSkill(player, key);
          ctx.addBurst(target.x, target.y, target.radius + ctx.battlePx(22), "rgba(156,198,255,0.22)");
          return true;
        }
        const ignoredUnitIds = getFocusIgnoredUnitIds(player, key, skill);
        if (ctx.setPriorityTarget) {
          if (!ctx.setPriorityTarget(target, skill.duration, skill.name, { ignoredUnitIds })) {
            ctx.addFloat("対象なし", target.x, target.y - 28, "#ffffff");
            return false;
          }
        } else {
          ctx.game.priorityTarget = target;
          ctx.game.priorityTargetTimer = Number.isFinite(skill.duration) && skill.duration > 0 ? skill.duration : 0;
          ctx.game.priorityTargetIgnoredUnitIds = {};
          for (const unitId of ignoredUnitIds) {
            ctx.game.priorityTargetIgnoredUnitIds[unitId] = true;
          }
        }
        target.focusDamageTakenBonus = getFocusDamageTakenBonus(player, key, skill);
        addFocusIgnoredFloats(ignoredUnitIds);
        paySkillCost(player, skill);
        player.cds[key] = getSkillCooldown(player, key, skill);
        player.aim = null;
        player.actionLock = Math.max(player.actionLock, ctx.ACTION_GAP);
        speakSkill(player, key);
        ctx.addBurst(target.x, target.y, target.radius + ctx.battlePx(22), "rgba(255,213,107,0.22)");
        return true;
      }

      if (skill.target === "ally") {
        const target = lockedTarget || ctx.game.hover;
        if (!isCommandTarget(target)) {
          ctx.addFloat("対象なし", ctx.input.mouse.x, ctx.input.mouse.y - 12, "#ffffff");
          return false;
        }
        const rangeState = ensurePlayerSkillRange(key, target, skill, target.radius, { ...options, support: true });
        if (stopIfPlayerSkillQueued(rangeState)) return true;
        if (rangeState !== "inRange") return false;
        const changed = applyCommandBiasChange(target, skill.commandDelta, player, key, skill);
        if (changed && ctx.awardSupportUltimate) ctx.awardSupportUltimate(player, target);
        paySkillCost(player, skill);
        player.cds[key] = getSkillCooldown(player, key, skill);
        player.aim = null;
        player.actionLock = Math.max(player.actionLock, ctx.ACTION_GAP);
        speakSkill(player, key);
        ctx.addFloat(changed ? skill.name : "無視", target.x, target.y - 34, changed ? getCommandFloatColor(skill.commandDelta) : "#f7fff6");
        return true;
      }

      if (skill.target === "allAllies") {
        const targetPoint = lockedTarget && Number.isFinite(lockedTarget.x) && Number.isFinite(lockedTarget.y)
          ? lockedTarget
          : getPlayerSelfCenteredAimPoint();
        const positionState = ensurePlayerSelfCenteredSkillPosition(key, targetPoint, skill, options);
        if (stopIfPlayerSkillQueued(positionState)) return true;
        if (positionState !== "inRange") return false;
        let targets = 0;
        const radius = getPlayerSkillRadius(skill);
        const center = { x: player.x, y: player.y };
        for (const member of ctx.getFieldPartyMembers()) {
          if (isCommandTarget(member) && ctx.distPoint(member.x, member.y, center.x, center.y) <= radius + member.radius) {
            const changed = applyCommandBiasChange(member, skill.commandDelta, player, key, skill);
            if (changed && ctx.awardSupportUltimate) ctx.awardSupportUltimate(player, member);
            ctx.addFloat(changed ? skill.name : "無視", member.x, member.y - 34, changed ? getCommandFloatColor(skill.commandDelta) : "#f7fff6");
            targets += 1;
          }
        }
        if (targets <= 0) {
          ctx.addFloat("範囲外", origin.x + 26, origin.y - 28, "#ffffff");
          return false;
        }
        paySkillCost(player, skill);
        player.cds[key] = getSkillCooldown(player, key, skill);
        player.aim = null;
        player.actionLock = Math.max(player.actionLock, ctx.ACTION_GAP);
        speakSkill(player, key);
        ctx.addBurst(center.x, center.y, radius, skill.commandDelta < 0 ? "rgba(156,198,255,0.16)" : "rgba(255,213,107,0.16)");
        return true;
      }

      return false;
    }

    function isCommandTarget(unit) {
      return unit && !unit.dead && unit.team === "party" && unit.id !== "finald" && ctx.isFieldUnit(unit);
    }

    function applyCommandBiasChange(unit, delta, source, key, skill) {
      if (shouldIgnoreCommandBiasChange(unit, delta, source, key, skill)) {
        return false;
      }
      unit.commandBias = ctx.clampCommandBias((unit.commandBias || 0) + delta);
      return true;
    }

    function shouldIgnoreCommandBiasChange(unit, delta, source, key, skill) {
      if (!unit || unit.mood === null) {
        return false;
      }
      const ignoreChance = getCommandIgnoreChance(source, key, skill);
      if (delta > 0 && unit.mood <= 30) {
        return Math.random() < ignoreChance;
      }
      if (delta < 0 && unit.mood >= 70) {
        return Math.random() < ignoreChance;
      }
      return false;
    }

    function getCommandFloatText(delta) {
      return delta < 0 ? "防御指示" : "攻撃指示";
    }

    function getCommandFloatColor(delta) {
      return delta < 0 ? "#9cc6ff" : "#ffd56b";
    }

    function completePlayerCast(cast) {
      if (cast.type === "attack") completePlayerShot(cast.target);
      else if (cast.type === "heal") completeHeal(cast.target);
      else if (cast.type === "shield") completeShield(cast.target);
      else if (cast.type === "fire") completePlayerFire(cast.target);
      else if (cast.type === "bomb") completePlayerBomb(cast.target);
      else if (cast.type === "ult") completeFinaldUlt();
    }

    function getPlayerCastCooldown(type) {
      const skill = get("finald", type);
      if (!skill || typeof skill.cd !== "number") return null;
      return { key: type, max: skill.cd };
    }

    function triggerUltimate(id, automatic = false) {
      const unit = ctx.party.find((member) => member.id === id);
      if (id === "finald" && !automatic && isPlayerControlLocked()) {
        showPlayerControlLocked();
        return false;
      }
      if (!unit || unit.dead || isActionDisabled(unit) || !canUseUltimate(unit) || unit.actionLock > 0 || unit.cast || unit.channel) return false;
      if (unit.id !== "finald" && unit.mood !== null && unit.mood < 40) { ctx.addFloat("不調", unit.x, unit.y - 34, "#cfd5e6"); return false; }
      if (id !== "finald") spendUltimate(unit);
      if (id === "ulpes") ultUlpes(unit, automatic);
      else if (id === "rihas") ultRihas(unit, automatic);
      else if (id === "sushia") ultSushia(unit, automatic);
      else if (id === "finald") ultFinald();
      return true;
    }

    function ultUlpes(unit, automatic) {
      const skill = getUnitUltimateEntry(unit).skill || need("ulpes", "ult");
      const target = getPartyAttackTarget(unit);
      if (!target) return;
      beginPartyAction(unit);
      speakSkill(unit, "ult");
      const cast = getCastTime(automatic ? skill.autoCast : skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "party", time: cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          finishPartyAction(unit);
          if (unit.dead || isActionDisabled(unit) || target.dead) return;
          const impact = { x: telegraph.x, y: telegraph.y };
          let hits = 0;
          const point = ctx.clampBattlePoint
            ? ctx.clampBattlePoint(impact.x + skill.teleportOffset, impact.y, ctx.battlePx(35))
            : { x: ctx.clamp(impact.x + skill.teleportOffset, ctx.battlePx(35), ctx.view.w - ctx.battlePx(35)), y: impact.y };
          unit.x = point.x;
          unit.y = point.y;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            const d = ctx.distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
            if (d <= skill.hitRadius + unitHit.radius) {
              const rawDamage = skill.damageBase + getAttackStat(unit) * skill.attackScale;
              const multiplier = unitHit.team === "enemy" ? getAutoUltimateEnemyDamageMultiplier(unitHit, automatic) : 1;
              ctx.dealDamage(unit, unitHit, rawDamage * multiplier, getSkillDamageOptions(skill, { noUltGain: true, critChanceBonus: getUltimateCritChanceBonus(unit, skill) }));
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          ctx.addBurst(impact.x, impact.y, skill.burstRadius, "rgba(244,197,79,0.32)");
        },
      };
      ctx.addTelegraph(telegraph);
    }

    function ultRihas(unit, automatic = false) {
      const skill = getUnitUltimateEntry(unit).skill || need("rihas", "ult");
      beginPartyAction(unit);
      speakSkill(unit, "ult");
      unit.actionLock = ctx.ACTION_GAP;
      let taunted = 0;
      const targets = [...ctx.enemies, ...ctx.getFieldPartyMembers()]
        .filter((target) => !target.dead && target !== unit && canOffensiveAffect(unit, target) && ctx.dist(unit, target) <= skill.radius)
        .sort((a, b) => ctx.dist(unit, a) - ctx.dist(unit, b))
        .slice(0, skill.targetLimit || 8);
      for (const target of targets) {
        const duration = getOffensiveEffectDuration(unit, target, getRihasUltDuration(unit, skill), automatic);
        if (duration <= 0) continue;
        target.forcedTarget = unit;
        target.tauntTimer = duration;
        if (target.team === "enemy") taunted += 1;
      }
      ctx.addShield(unit, unit.maxHp * (skill.shieldHpRatio || 0.05) * taunted, getRihasUltDuration(unit, skill));
      ctx.addBurst(unit.x, unit.y, skill.radius + skill.burstExtraRadius, "rgba(227,122,63,0.18)");
      finishPartyAction(unit);
    }
    function ultSushia(unit, automatic) {
      const skill = getUnitUltimateEntry(unit).skill || need("sushia", "ult");
      beginPartyAction(unit);
      const cast = ctx.getSushiaCastTime(automatic ? skill.autoCast : skill.cast, unit);
      const radius = automatic ? skill.radius : skill.radius + skill.manualRadiusBonus;
      unit.actionLock = cast + ctx.ACTION_GAP;
      ctx.addTelegraph({
        type: "circle", x: unit.x, y: unit.y, radius, team: "party", time: cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        resolve: () => {
          finishPartyAction(unit);
          if (unit.dead || isActionDisabled(unit)) return;
          speakSkill(unit, "ult");
          const center = { x: unit.x, y: unit.y };
          const frozen = new Set();
          let multiHitAwarded = false;
          ctx.areas.push({
            type: "ice", x: center.x, y: center.y, radius, time: automatic ? skill.autoDuration : skill.duration, tick: 0, tickRate: skill.tickRate,
            apply: () => {
              let hits = 0;
              for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
                if (unitHit.dead || unitHit === unit) continue;
                if (!canOffensiveAffect(unit, unitHit)) continue;
                const d = ctx.distPoint(unitHit.x, unitHit.y, center.x, center.y);
                if (d <= radius + unitHit.radius) {
                  const scale = 1 - ctx.clamp(d / Math.max(1, radius), 0, 1) * (1 - (Number.isFinite(skill.falloffMin) ? skill.falloffMin : 0.5));
                  if (!frozen.has(unitHit)) {
                    const freezeTime = getOffensiveEffectDuration(unit, unitHit, getSushiaIceFreezeTime(skill, unitHit, automatic, unit) * scale, automatic);
                    if (freezeTime > unitHit.frozen) {
                      unitHit.frozen = freezeTime;
                      unitHit.frozenMax = freezeTime;
                    }
                    frozen.add(unitHit);
                  }
                  const ultimateDamageMultiplier = unitHit.team === "enemy" ? getAutoUltimateEnemyDamageMultiplier(unitHit, automatic) : 1;
                  ctx.dealDamage(unit, unitHit, (skill.damageBase + getMagicStat(unit) * skill.magicScale) * scale * ultimateDamageMultiplier, getSkillDamageOptions(skill, { magic: true, noUltGain: true }));
                  hits += unitHit.team === "enemy" ? 1 : 0;
                }
              }
              if (!multiHitAwarded && hits >= ctx.MOOD_MULTI_HIT_MIN) {
                ctx.applyMultiHitMoodBonus(unit, hits);
                multiHitAwarded = true;
              }
            },
          });
        },
      });
    }

    function getSushiaIceFreezeTime(skill, target, automatic, unit) {
      const base = target.team === "party" ? (automatic ? skill.autoFreezeAlly : skill.freezeAlly) : skill.freezeEnemy;
      return base + getSkillUpgradeLevel(unit, "ult", skill);
    }

    function ultFinald() {
      const player = ctx.player;
      const skill = getUnitUltimateEntry(player).skill || need("finald", "ult");
      if (hasPlayerMoveIntent()) {
        showPlayerMoveIntentBusy();
        return;
      }
      if (player.channel || player.cast || player.actionLock > 0) return;
      const origin = ctx.getSupportOrigin();
      if (!canPaySkillCost(player, skill)) { ctx.addFloat("魔力不足", origin.x + 26, origin.y - 28, "#ffffff"); return; }
      if (!ctx.startPlayerCast("ult", {}, getSkillCastTime(player, "ult", skill, skill.cast))) return;
      paySkillCost(player, skill);
      speakSkill(player, "ult");
    }

    function completeFinaldUlt() {
      const player = ctx.player;
      const skill = getUnitUltimateEntry(player).skill || need("finald", "ult");
      let healed = 0;
      for (const member of ctx.getFieldPartyMembers()) {
        if (member.dead) {
          continue;
        }
        const hpRatio = member.maxHp > 0 ? ctx.clamp(member.hp / member.maxHp, 0, 1) : 0;
        const hpPercent = hpRatio * 100;
        const healPercent = (skill.healHpBasePercent || 5) + Math.max(0, (skill.healHpThresholdPercent || 50) - hpPercent);
        const healAmount = getMagicStat(player) * (skill.healMagicScale || 0) + member.maxHp * (healPercent / 100);
        if (ctx.healUnit(player, member, healAmount, { noUltGain: true }) > 0) {
          healed += 1;
        }
      }
      if (healed > 0) {
        ctx.addBurst(ctx.view.w * 0.5, ctx.getBattleBounds().centerY, ctx.battlePx(170), "rgba(121,255,141,0.2)");
      }
    }

    function updatePlayerChannel(dt) {
      const player = ctx.player;
      if (!player.channel) return;
      const skill = getUnitUltimateEntry(player).skill || need("finald", "ult");
      player.channel.time -= dt;
      player.channel.pulse -= dt;
      if (player.channel.pulse <= 0) {
        player.channel.pulse = skill.pulseRate;
        const allies = ctx.getFieldPartyMembers().filter((member) => !member.dead);
        if (allies.length === 0) {
          ctx.cancelPlayerChannel();
          return;
        }
        for (const member of allies) {
          ctx.healUnit(player, member, skill.healPerPulse, { noUltGain: true });
        }
      }
      if (player.channel.time <= 0) player.channel = null;
    }

    function enemyBite(enemy, target) {
      const skill = need("enemy", "attack");
      setActionCooldown(enemy);
      const cast = getCastTime(skill.cast, enemy);
      enemy.actionLock = cast + ctx.ACTION_GAP;
      startEnemyCastVisual(enemy, cast);
      const telegraph = {
        type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "enemy", time: cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          const impact = { x: telegraph.x, y: telegraph.y };
          for (const member of ctx.getFieldPartyMembers()) {
            if (!member.dead && ctx.distPoint(member.x, member.y, impact.x, impact.y) <= skill.radius + member.radius) ctx.dealDamage(enemy, member, getAttackStat(enemy) + skill.damageBonus);
          }
        },
      };
      ctx.addTelegraph(telegraph);
    }

    function enemyLineAttack(enemy, target) {
      const skill = need("enemy", "casterLine");
      setActionCooldown(enemy);
      trackSkillCooldown(enemy, "skill", "casterLine", skill.cdBase + Math.random() * skill.cdRandom);
      const cast = getCastTime(skill.cast, enemy);
      const configuredLockBeforeFire = Number.isFinite(skill.aimLockBeforeFire) ? skill.aimLockBeforeFire : 1.3;
      const lockBeforeFire = Math.min(configuredLockBeforeFire, cast);
      enemy.actionLock = cast + ctx.ACTION_GAP;
      startEnemyCastVisual(enemy, cast);
      let lockedLine = null;
      let telegraph = null;
      const buildLine = () => {
        const end = ctx.projectPoint(enemy, target, skill.length);
        return { x: enemy.x, y: enemy.y, x2: end.x, y2: end.y };
      };
      const getLine = () => {
        if (lockedLine) {
          return lockedLine;
        }
        const line = buildLine();
        if (telegraph && telegraph.time <= lockBeforeFire) {
          lockedLine = line;
          return lockedLine;
        }
        return line;
      };
      const initial = buildLine();
      telegraph = {
        type: "line", x: initial.x, y: initial.y, x2: initial.x2, y2: initial.y2, width: skill.width, team: "enemy", time: cast, getLine,
        resolve: () => {
          for (const member of ctx.getFieldPartyMembers()) {
            if (!member.dead && ctx.distanceToSegment(member.x, member.y, telegraph.x, telegraph.y, telegraph.x2, telegraph.y2) <= skill.hitWidth + member.radius) ctx.dealDamage(enemy, member, getAttackStat(enemy) + skill.damageBonus, { magic: true });
          }
        },
      };
      ctx.addTelegraph(telegraph);
    }

    function enemyHeavySlam(enemy, target) {
      const skill = need("enemy", "heavySlam");
      setActionCooldown(enemy);
      trackSkillCooldown(enemy, "skill", "heavySlam", skill.cd);
      const cast = getCastTime(skill.cast, enemy);
      enemy.actionLock = cast + ctx.ACTION_GAP;
      startEnemyCastVisual(enemy, cast);
      const telegraph = {
        type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "enemy", time: cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          const impact = { x: telegraph.x, y: telegraph.y };
          for (const member of ctx.getFieldPartyMembers()) {
            if (!member.dead && ctx.distPoint(member.x, member.y, impact.x, impact.y) <= skill.radius + member.radius) ctx.dealDamage(enemy, member, getAttackStat(enemy) + skill.damageBonus);
          }
          ctx.addBurst(impact.x, impact.y, skill.burstRadius, "rgba(201,93,78,0.22)");
        },
      };
      ctx.addTelegraph(telegraph);
    }

    function drawPlayerAimPreview() {
      const player = ctx.player;
      if (!player.aim || player.dead) return;
      const draw = ctx.canvasCtx;
      const skill = getUnitSkill(player, player.aim.type) || get("finald", player.aim.type);
      let movePreview = null;
      draw.save();
      if (skill && Number.isFinite(skill.range)) {
        drawPlayerRangeCircle(draw, skill.range, "rgba(247,255,246,0.42)");
      }
      if (player.aim.type === "attack") {
        const target = ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
        const inRange = isSelfCenteredPlayerSkill(skill)
          ? !getPlayerSelfCenteredMovePreviewPoint(target)
          : isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill));
        movePreview = isSelfCenteredPlayerSkill(skill)
          ? getPlayerSelfCenteredMovePreviewPoint(target)
          : getPlayerMovePreviewPoint(target, getPlayerSkillRange(skill));
        draw.fillStyle = inRange ? "rgba(158,247,255,0.18)" : "rgba(255,255,255,0.08)";
        draw.strokeStyle = inRange ? "#9ef7ff" : "rgba(255,255,255,0.45)";
        draw.lineWidth = 3;
        draw.beginPath(); draw.arc(target.x, target.y, skill.radius, 0, ctx.TAU); draw.fill(); draw.stroke();
      } else if (player.aim.type === "heal") {
        const target = ctx.game.hover;
        if (target && target.team === "party" && !target.dead) {
          const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill), target.radius);
          movePreview = getPlayerMovePreviewPoint(target, getPlayerSkillRange(skill), target.radius);
          draw.strokeStyle = inRange ? "#79ff8d" : "rgba(255,255,255,0.45)";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 15, 0, ctx.TAU); draw.stroke();
        }
      } else if (player.aim.type === "shield") {
        const target = ctx.game.hover;
        if (target && target.team === "party" && !target.dead) {
          const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill), target.radius);
          movePreview = getPlayerMovePreviewPoint(target, getPlayerSkillRange(skill), target.radius);
          draw.strokeStyle = inRange ? "#8fe9ff" : "rgba(255,255,255,0.45)";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 15, 0, ctx.TAU); draw.stroke();
        }
      } else if (player.aim.type === "fire") {
        const target = getHoveredEnemy();
        if (target) {
          const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill), target.radius);
          movePreview = getPlayerMovePreviewPoint(target, getPlayerSkillRange(skill), target.radius);
          draw.strokeStyle = inRange ? "#ff8b43" : "rgba(255,255,255,0.45)";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 15, 0, ctx.TAU); draw.stroke();
        }
      } else if (player.aim.type === "bomb") {
        const target = ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
        const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill));
        movePreview = getPlayerMovePreviewPoint(target, getPlayerSkillRange(skill));
        draw.fillStyle = inRange ? "rgba(185,133,238,0.18)" : "rgba(255,255,255,0.08)";
        draw.strokeStyle = inRange ? "#b985ee" : "rgba(255,255,255,0.45)";
        draw.lineWidth = 3;
        draw.beginPath(); draw.arc(target.x, target.y, skill.radius, 0, ctx.TAU); draw.fill(); draw.stroke();
      } else if (player.aim.type === "commandDefend" || player.aim.type === "commandAttack") {
        const target = ctx.game.hover;
        if (isCommandTarget(target)) {
          const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill), target.radius);
          movePreview = getPlayerMovePreviewPoint(target, getPlayerSkillRange(skill), target.radius);
          draw.strokeStyle = inRange
            ? (player.aim.type === "commandDefend" ? "#9cc6ff" : "#ffd56b")
            : "rgba(255,255,255,0.45)";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 17, 0, ctx.TAU); draw.stroke();
        }
      } else if (player.aim.type === "take_aim") {
        const target = ctx.getHoveredEnemy ? ctx.getHoveredEnemy() : null;
        if (target) {
          const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill), target.radius);
          movePreview = getPlayerMovePreviewPoint(target, getPlayerSkillRange(skill), target.radius);
          draw.strokeStyle = inRange ? "#ffd56b" : "rgba(255,255,255,0.45)";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 18, 0, ctx.TAU); draw.stroke();
        }
      } else if (player.aim.type === "distance") {
        const target = ctx.getHoveredEnemy ? ctx.getHoveredEnemy() : null;
        if (target) {
          const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill), target.radius);
          movePreview = getPlayerMovePreviewPoint(target, getPlayerSkillRange(skill), target.radius);
          draw.strokeStyle = inRange ? "#9cc6ff" : "rgba(255,255,255,0.45)";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 18, 0, ctx.TAU); draw.stroke();
        }
      } else if (isSelfCenteredPlayerSkill(skill)) {
        const target = getPlayerSelfCenteredAimPoint();
        movePreview = getPlayerSelfCenteredMovePreviewPoint(target);
        const color = skill.commandDelta < 0 ? "#9cc6ff" : "#ffd56b";
        draw.fillStyle = skill.commandDelta < 0 ? "rgba(156,198,255,0.12)" : "rgba(255,213,107,0.12)";
        draw.strokeStyle = color;
        draw.lineWidth = 3;
        draw.beginPath();
        draw.arc(target.x, target.y, getPlayerSkillRadius(skill), 0, ctx.TAU);
        draw.fill();
        draw.stroke();
      }
      if (movePreview) {
        drawPlayerMovePrediction(draw, movePreview);
      }
      draw.restore();
    }

    function drawPlayerRangeCircle(draw, range, color) {
      if (!Number.isFinite(range)) {
        return;
      }
      draw.save();
      draw.strokeStyle = color;
      draw.lineWidth = 2;
      draw.setLineDash([8, 8]);
      draw.beginPath();
      draw.arc(ctx.player.x, ctx.player.y, range, 0, ctx.TAU);
      draw.stroke();
      draw.restore();
    }

    function drawPlayerMovePrediction(draw, destination) {
      const player = ctx.player;
      const dx = destination.x - player.x;
      const dy = destination.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= ctx.battlePx(6)) {
        return;
      }
      const ux = dx / distance;
      const uy = dy / distance;
      const startOffset = player.radius + ctx.battlePx(8);
      const endOffset = ctx.battlePx(10);
      const sx = player.x + ux * startOffset;
      const sy = player.y + uy * startOffset;
      const ex = destination.x - ux * endOffset;
      const ey = destination.y - uy * endOffset;
      const head = ctx.battlePx(13);
      const wing = ctx.battlePx(7);
      draw.save();
      draw.strokeStyle = "rgba(255,255,255,0.92)";
      draw.fillStyle = "rgba(255,255,255,0.92)";
      draw.lineWidth = Math.max(2, ctx.battlePx(2));
      draw.setLineDash([ctx.battlePx(10), ctx.battlePx(6)]);
      draw.beginPath();
      draw.moveTo(sx, sy);
      draw.lineTo(ex, ey);
      draw.stroke();
      draw.setLineDash([]);
      draw.beginPath();
      draw.moveTo(destination.x, destination.y);
      draw.lineTo(destination.x - ux * head - uy * wing, destination.y - uy * head + ux * wing);
      draw.lineTo(destination.x - ux * head + uy * wing, destination.y - uy * head - ux * wing);
      draw.closePath();
      draw.fill();
      draw.strokeStyle = "rgba(255,216,107,0.82)";
      draw.lineWidth = 2;
      draw.beginPath();
      draw.arc(destination.x, destination.y, ctx.battlePx(9), 0, ctx.TAU);
      draw.stroke();
      draw.restore();
    }
    function getPanelSkills(player, pageIndex = 0) {
      const page = Math.max(0, Math.floor(Number(pageIndex) || 0));
      const pageStart = page * PLAYER_ULTIMATE_SLOT_INDEX;
      const pageKeys = getEquippedFinaldSkillKeys(player).slice(pageStart, pageStart + PLAYER_ULTIMATE_SLOT_INDEX);
      const entries = pageKeys
        .map((key) => {
          const skill = getUnitSkill(player, key);
          if (!skill) {
            return null;
          }
          const command = isCommandSkill(key);
          const positioned = command && isSelfCenteredPlayerSkill(skill);
          return {
            key,
            name: skill.name,
            skillType: skill.skillType || "",
            cd: getPlayerSkillCooldown(player, key),
            max: getSkillCooldown(player, key, skill) || 0.1,
            skill,
            targeted: command && (skill.target === "ally" || skill.target === "enemy"),
            positioned,
            command,
            commandDelta: command ? (skill.avoidTarget ? -1 : skill.commandDelta) : 0,
            level: getSkillUpgradeLevel(player, key, skill),
          };
        })
        .filter(Boolean);
      return createPlayerSkillPanelEntries(entries, player);
    }


    function getUnitSkillEntries(unit) {
      const owner = getSkillOwner(unit);
      const activeEntries = ctx.getEquippedActiveSkills
        ? ctx.getEquippedActiveSkills(unit)
        : Object.entries(DATA[owner] || {}).filter(([key]) => !isUltimateKey(owner, key)).map(([key, skill]) => ({ key, skill }));
      const ultimateEntry = getUnitUltimateEntry(unit);
      return [
        ...activeEntries.map((entry) => ({ ...entry, level: getSkillUpgradeLevel(unit, entry.key, entry.skill) })),
        ...(ultimateEntry.skill ? [{ ...ultimateEntry, level: getSkillUpgradeLevel(unit, ultimateEntry.key || "ult", ultimateEntry.skill) }] : []),
      ];
    }

    function skillNumber(owner, key, field) {
      const value = need(owner, key)[field];
      if (typeof value !== "number" || Number.isNaN(value)) throw new Error(`Missing skill number: ${owner}.${key}.${field}`);
      return value;
    }

    return {
      data: DATA,
      getSkill: get,
      requireSkill: need,
      getPlayerSkillSlotInputLabel: getSlotInputLabel,
      getUltimateCost,
      skillNumber,
      speakSkill,
      getActionCooldown,
      setActionCooldown,
      onCooldownReady,
      trackSkillCooldown,
      thinkPartyUnit,
      thinkUlpes,
      thinkRihas,
      thinkSushia,
      thinkEnemy,
      useUlpesNormal,
      useUlpesHeroSlash,
      useRihasNormal,
      useRihasJump,
      useSushiaBolts,
      useSushiaBomb,
      getUnitSkillEntries,
      startPlayerAim,
      cancelPlayerAim,
      confirmPlayerAim,
      isPlayerControlLocked,
      executePlayerMoveIntent,
      usePlayerCommand,
      firePlayerShot,
      completePlayerShot,
      castHeal,
      completeHeal,
      castShield,
      completeShield,
      completePlayerCast,
      getPlayerCastCooldown,
      triggerUltimate,
      ultUlpes,
      ultRihas,
      ultSushia,
      ultFinald,
      updatePlayerChannel,
      enemyBite,
      enemyLineAttack,
      enemyHeavySlam,
      drawPlayerAimPreview,
      getPanelSkills,
      executePartyIntent,
      executeEnemyIntent,
    };
  }

  window.createHealerSkillSystem = createHealerSkillSystem;
})();
