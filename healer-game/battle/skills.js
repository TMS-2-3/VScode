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
    const COMMAND_SKILL_KEYS = ["take_aim", "commandDefend", "commandAttack", "commandDefendAll", "commandAttackAll"];
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

    function getFocusDamageTakenBonus(source, key, skill) {
      if (!isSkillSource(skill, "finald", "take_aim")) {
        return 0;
      }
      const perLevel = Number.isFinite(skill.focusDamageTakenBonusPerLevel) ? skill.focusDamageTakenBonusPerLevel : 0.02;
      return getSkillUpgradeLevel(source, key, skill) * perLevel;
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
      if (Number.isFinite(skill.costMaxMpRatio)) {
        return Math.ceil((unit && unit.maxMp || 0) * getSkillCostMaxMpRatio(unit, skill));
      }
      return Number.isFinite(skill.cost) ? skill.cost : 0;
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

    function removeSkillFromQueue(unit, key) {
      const queue = normalizeSkillQueue(unit);
      if (!queue.length) {
        return;
      }
      unit.skillQueue = queue.filter((queuedKey) => queuedKey !== key);
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
        return key === "casterLine" || key === "heavySlam";
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
      removeSkillFromQueue(unit, key);
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
      const queue = normalizeSkillQueue(unit);
      for (const queuedKey of queue) {
        const queuedAction = candidates.find((candidate) => candidate.key === queuedKey);
        if (queuedAction) {
          return queuedAction;
        }
      }
      return candidates[Math.floor(Math.random() * candidates.length)];
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
      const action = chooseQueuedCandidate(unit, candidates);
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
      const base = ctx.ACTION_COOLDOWN_BASE || 7;
      const cooldown = unit.team === "party" && unit.id !== "finald" ? ctx.getCommandActionCooldown(unit, base) : base;
      const actionSpeed = ctx.getEquipmentStatBonusSum ? ctx.getEquipmentStatBonusSum(unit, "actionSpeed") : 0;
      return cooldown / Math.max(0.1, 1 + actionSpeed);
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
      return (ctx.getPriorityTarget && ctx.getPriorityTarget()) || ctx.nearestAlive(unit, ctx.enemies);
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
      return Boolean(skill && (Number.isFinite(skill.healBase) || Number.isFinite(skill.shieldBase)));
    }

    function isOffensiveSkill(skill) {
      if (!skill || isSupportSkill(skill)) {
        return false;
      }
      return Number.isFinite(skill.damageBase)
        || Number.isFinite(skill.shockDamageBase)
        || Number.isFinite(skill.attackScale)
        || Number.isFinite(skill.magicScale)
        || Number.isFinite(skill.projectileCount);
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
      if (isSupportSkill(skill)) {
        return getRandomSupportTarget();
      }
      if (isOffensiveSkill(skill)) {
        return attackTarget;
      }
      return null;
    }

    function getPartySkillRange(skill) {
      if (skill && Number.isFinite(skill.range)) return skill.range;
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
      const target = getPartyAttackTarget(unit);
      const candidates = [];
      for (const { key, skill } of getUnitActiveSkillEntries(unit)) {
        if (!canQueuePartySkill(unit, key, skill)) {
          continue;
        }
        const actionTarget = getPartySkillTarget(unit, skill, target);
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
      const attack = need("enemy", "attack");
      const candidates = [];
      if (enemy.role === "caster") {
        if (isSkillEquipped(enemy, "casterLine") && (enemy.cds.skill || 0) <= 0) candidates.push({ key: "casterLine", use: () => enemyLineAttack(enemy, target) });
      } else if (enemy.role === "elite") {
        if (isSkillEquipped(enemy, "heavySlam") && (enemy.cds.skill || 0) <= 0) candidates.push({ key: "heavySlam", use: () => enemyHeavySlam(enemy, target) });
        if (isSkillEquipped(enemy, "attack") && distance <= attack.eliteRange) candidates.push({ key: "attack", use: () => enemyBite(enemy, target) });
      } else if (isSkillEquipped(enemy, "attack") && distance <= attack.bruteRange) {
        candidates.push({ key: "attack", use: () => enemyBite(enemy, target) });
      }
      useQueuedInstantAction(enemy, candidates);
    }

    function getPartySkillCooldowns(unit, key, skill) {
      if (!actionHasSkillCooldown(unit, key)) {
        return [];
      }
      return [{ key, value: ctx.getMoodCooldown(unit, skill.cd) }];
    }

    function getSkillDamage(unit, skill, baseProp = "damageBase", attackProp = "attackScale", magicProp = "magicScale") {
      let damage = getUpgradedBaseValue(unit, getSkillSourceKey(skill), skill, baseProp);
      if (Number.isFinite(skill[attackProp])) {
        damage += getAttackStat(unit) * skill[attackProp];
      }
      if (Number.isFinite(skill[magicProp])) {
        damage += getMagicStat(unit) * skill[magicProp];
      }
      if (isSkillSource(skill, "rihas", "lan_wave") && baseProp === "shockDamageBase") {
        damage += getAttackStat(unit) * getSkillUpgradeLevel(unit, getSkillSourceKey(skill, "lan_wave"), skill) * 0.08;
      }
      return damage;
    }

    function isMagicDamageSkill(skill) {
      return Boolean(skill && (skill.damageType === "magic" || (Number.isFinite(skill.magicScale) && !Number.isFinite(skill.attackScale))));
    }

    function getSkillDamageOptions(skill, options = {}) {
      return Object.assign({ magic: isMagicDamageSkill(skill) }, options);
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
      for (let i = 0; i < repeats; i += 1) {
        setTimeout(() => {
          if (!unit.dead && !target.dead && canOffensiveAffect(unit, target) && ctx.dist(unit, target) <= skill.hitRange) {
            dealPartySkillDamage(unit, target, skill, getSkillDamage(unit, skill), { crit: true });
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
          if (unit.dead || unit.frozen > 0) return;
          let hits = 0;
          unit.aimAngle = target.dead ? unit.aimAngle : ctx.angleTo(unit, target);
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            if (ctx.inFan(unitHit, unit.x, unit.y, skill.radius, unit.aimAngle, ctx.deg(skill.arcDeg))) {
              dealPartySkillDamage(unit, unitHit, skill, getSkillDamage(unit, skill), { crit: true });
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
          if (unit.dead || unit.frozen > 0) return;
          let hits = 0;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            if (ctx.distPoint(unitHit.x, unitHit.y, unit.x, unit.y) <= skill.radius + unitHit.radius) {
              dealPartySkillDamage(unit, unitHit, skill, getSkillDamage(unit, skill));
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          ctx.addBurst(unit.x, unit.y, skill.burstRadius || skill.radius, "rgba(227,122,63,0.25)");
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
          if (unit.dead || unit.frozen > 0) return;
          const impact = { x: telegraph.x, y: telegraph.y };
          let hits = 0;
          unit.x = impact.x;
          unit.y = impact.y;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            const d = ctx.distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
            if (d <= skill.radius + unitHit.radius) {
              dealPartySkillDamage(unit, unitHit, skill, getSkillDamage(unit, skill));
              hits += unitHit.team === "enemy" ? 1 : 0;
            } else if (Number.isFinite(skill.shockRadius) && d <= skill.shockRadius + unitHit.radius) {
              const shockDamage = getSkillDamage(unit, skill, "shockDamageBase", "shockAttackScale", "shockMagicScale");
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
          if (unit.dead || unit.frozen > 0) return;
          speakSkill(unit, key);
          const count = Math.max(1, Math.floor(skill.projectileCount));
          const damage = getSkillDamage(unit, skill);
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
              magic: isMagicDamageSkill(skill),
              life: Number.isFinite(skill.life) ? skill.life : 1.2,
              hit: new Set(),
              pierce: Boolean(skill.pierce) || pierceCount > 0,
              pierceCount: pierceCount > 0 ? pierceCount : undefined,
              affectsAllies: skill.affectsAllies !== false,
              healAllies: Boolean(skill.healAllies),
              heal: Number.isFinite(skill.heal) ? skill.heal : undefined,
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
          if (unit.dead || unit.frozen > 0) return;
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
              const damage = getSkillDamage(unit, skill) * Math.max(0, 1 - falloff);
              dealPartySkillDamage(unit, unitHit, skill, damage);
              hits += unitHit.team === "enemy" ? 1 : 0;
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
          if (unit.dead || unit.frozen > 0 || !target || target.dead || !canOffensiveAffect(unit, target)) return;
          speakSkill(unit, key);
          dealPartySkillDamage(unit, target, skill, getSkillDamage(unit, skill));
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
            ctx.dealDamage(unit, target, getSkillDamage(unit, skill), { crit: true });
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
          if (unit.dead || unit.frozen > 0) return;
          let hits = 0;
          unit.aimAngle = target.dead ? unit.aimAngle : ctx.angleTo(unit, target);
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            if (ctx.inFan(unitHit, unit.x, unit.y, skill.radius, unit.aimAngle, ctx.deg(skill.arcDeg))) {
              ctx.dealDamage(unit, unitHit, getSkillDamage(unit, skill), { crit: true });
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
          if (unit.dead || unit.frozen > 0) return;
          let hits = 0;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            if (ctx.distPoint(unitHit.x, unitHit.y, unit.x, unit.y) <= skill.radius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, getSkillDamage(unit, skill));
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
          if (unit.dead || unit.frozen > 0) return;
          const impact = { x: telegraph.x, y: telegraph.y };
          let hits = 0;
          unit.x = impact.x;
          unit.y = impact.y;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (!canOffensiveAffect(unit, unitHit)) continue;
            const d = ctx.distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
            if (d <= skill.radius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, getSkillDamage(unit, skill));
              hits += unitHit.team === "enemy" ? 1 : 0;
            } else if (d <= skill.shockRadius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, getSkillDamage(unit, skill, "shockDamageBase", "shockAttackScale", "shockMagicScale"), { magic: true });
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
          if (unit.dead || unit.frozen > 0) return;
          speakSkill(unit, "attack");
          const pierceCount = getProjectilePierceCount(unit, "attack", skill);
          for (let i = 0; i < skill.projectileCount; i += 1) {
            const spread = (i - Math.floor(skill.projectileCount / 2)) * skill.spread;
            const angle = ctx.angleTo(unit, target) + spread;
            ctx.projectiles.push({ x: unit.x, y: unit.y, vx: Math.cos(angle) * skill.projectileSpeed, vy: Math.sin(angle) * skill.projectileSpeed, radius: skill.projectileRadius, team: "party", owner: unit, damage: getSkillDamage(unit, skill), magic: true, life: skill.life, hit: new Set(), pierce: pierceCount > 0, pierceCount: pierceCount > 0 ? pierceCount : undefined, affectsAllies: true, color: skill.color });
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
          if (unit.dead || unit.frozen > 0) return;
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
              ctx.dealDamage(unit, unitHit, damage, { magic: true });
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
          if (unit.dead || unit.frozen > 0 || !target || target.dead || !canOffensiveAffect(unit, target)) return;
          speakSkill(unit, "fire");
          const damaged = ctx.dealDamage(unit, target, getFireDamage(unit, skill), { magic: true }) > 0;
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

    function usePartyHeal(unit, key, target) {
      const skill = getUnitSkill(unit, key);
      if (!skill || !target || target.dead || target.team !== "party" || !ctx.isFieldUnit(target)) return false;
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
          if (unit.dead || unit.frozen > 0 || !target || target.dead || target.team !== "party" || !ctx.isFieldUnit(target)) return;
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
      if (!skill || !target || target.dead || target.team !== "party" || !ctx.isFieldUnit(target)) return false;
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
          if (unit.dead || unit.frozen > 0 || !target || target.dead || target.team !== "party" || !ctx.isFieldUnit(target)) return;
          speakSkill(unit, key);
          const addedShield = ctx.addShield(target, getUpgradedBaseValue(unit, key, skill, "shieldBase") + getMagicStat(unit) * skill.magicScale, skill.duration);
          if (addedShield > 0 && ctx.awardSupportUltimate) ctx.awardSupportUltimate(unit, target);
          const moodGain = Number.isFinite(skill.moodGain) ? skill.moodGain : 0;
          if (target !== unit && ctx.addMoodGain && moodGain > 0) ctx.addMoodGain(target, moodGain * ctx.MOOD_EVENT_MULT);
          ctx.addTelegraph({ type: "circle", x: target.x, y: target.y, radius: target.radius + ctx.battlePx(18), team: "support", time: 0.18, resolve: () => {} });
          ctx.addBurst(target.x, target.y, target.radius + ctx.battlePx(18), "rgba(143,233,255,0.25)");
        },
      };
      ctx.addTelegraph(telegraph);
      return true;
    }

    function startPlayerAim(type) {
      const player = ctx.player;
      if (player.dead || player.channel || player.cast || player.frozen > 0) return false;
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
      if (!player.aim || player.dead || player.channel || player.cast || player.frozen > 0) return false;
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
      const skill = need("finald", "attack");
      if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) return false;
      const target = lockedTarget || ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
      const origin = ctx.getSupportOrigin(target);
      const rangeState = ensurePlayerSkillRange("attack", target, skill, 0, options);
      if (stopIfPlayerSkillQueued(rangeState)) return true;
      if (rangeState !== "inRange") return false;
      if ((player.cds.attack || 0) > 0) { ctx.addFloat("再詠唱中", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      if (!canPaySkillCost(player, skill)) { ctx.addFloat("魔力不足", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      if (!ctx.startPlayerCast("attack", { target }, getCastTime(skill.cast, player))) return false;
      paySkillCost(player, skill);
      return true;
    }

    function completePlayerShot(lockedTarget) {
      const player = ctx.player;
      const skill = need("finald", "attack");
      const target = lockedTarget || ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
      const origin = ctx.getSupportOrigin(target);
      speakSkill(player, "attack");
      let hits = 0;
      const damage = getSkillDamage(player, skill);
      for (const unit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
        if (unit.dead || unit === player) {
          continue;
        }
        if (!canOffensiveAffect(player, unit)) continue;
        if (ctx.distPoint(unit.x, unit.y, target.x, target.y) <= skill.radius + unit.radius) {
          ctx.dealDamage(player, unit, damage, { magic: true });
          hits += 1;
        }
      }
      ctx.effects.push({ type: "beam", x: origin.x, y: origin.y, x2: target.x, y2: target.y, color: "rgba(158,247,255,0.78)", time: 0.18, age: 0 });
      ctx.addTelegraph({ type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "support", time: 0.16, resolve: () => {} });
      ctx.addBurst(target.x, target.y, skill.burstRadius, hits > 0 ? "rgba(158,247,255,0.28)" : "rgba(158,247,255,0.14)");
    }
    function castHeal(lockedTarget = null, options = {}) {
      const player = ctx.player;
      const skill = need("finald", "heal");
      if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) return false;
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
      if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) return false;
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
      if (target !== player) ctx.addMoodGain(target, skill.moodGain * ctx.MOOD_EVENT_MULT);
      ctx.addTelegraph({ type: "circle", x: target.x, y: target.y, radius: target.radius + 18, team: "support", time: 0.18, resolve: () => {} });
      ctx.addBurst(target.x, target.y, target.radius + 18, "rgba(143,233,255,0.25)");
    }

    function castPlayerFire(lockedTarget = null, options = {}) {
      const player = ctx.player;
      const skill = get("finald", "fire");
      if (!skill || player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) return false;
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
      const damaged = ctx.dealDamage(player, target, getFireDamage(player, skill), { magic: true }) > 0;
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
      if (!skill || player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) return false;
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
          ctx.dealDamage(player, unitHit, damage, { magic: true });
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
      if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) {
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
        if (ctx.setPriorityTarget) {
          if (!ctx.setPriorityTarget(target, skill.duration, skill.name)) {
            ctx.addFloat("対象なし", target.x, target.y - 28, "#ffffff");
            return false;
          }
        } else {
          ctx.game.priorityTarget = target;
          ctx.game.priorityTargetTimer = Number.isFinite(skill.duration) && skill.duration > 0 ? skill.duration : 0;
        }
        target.focusDamageTakenBonus = getFocusDamageTakenBonus(player, key, skill);
        paySkillCost(player, skill);
        player.cds[key] = skill.cd;
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
        player.cds[key] = skill.cd;
        player.aim = null;
        player.actionLock = Math.max(player.actionLock, ctx.ACTION_GAP);
        speakSkill(player, key);
        ctx.addFloat(changed ? skill.name : "無視", target.x, target.y - 34, changed ? getCommandFloatColor(skill.commandDelta) : "#f7fff6");
        return true;
      }

      if (skill.target === "allAllies") {
        let targets = 0;
        const radius = getPlayerSkillRadius(skill);
        for (const member of ctx.getFieldPartyMembers()) {
          if (isCommandTarget(member) && isPointInPlayerRange(member.x, member.y, radius, member.radius)) {
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
        player.cds[key] = skill.cd;
        player.aim = null;
        player.actionLock = Math.max(player.actionLock, ctx.ACTION_GAP);
        speakSkill(player, key);
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
      if (!unit || unit.dead || unit.frozen > 0 || !canUseUltimate(unit) || unit.actionLock > 0 || unit.cast || unit.channel) return false;
      if (unit.id !== "finald" && unit.mood !== null && unit.mood <= 50) { ctx.addFloat("不調", unit.x, unit.y - 34, "#cfd5e6"); return false; }
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
          if (unit.dead || unit.frozen > 0 || target.dead) return;
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
              ctx.dealDamage(unit, unitHit, rawDamage * multiplier, { noUltGain: true, critChanceBonus: getUltimateCritChanceBonus(unit, skill) });
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
          if (unit.dead || unit.frozen > 0) return;
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
                  ctx.dealDamage(unit, unitHit, (skill.damageBase + getMagicStat(unit) * skill.magicScale) * scale * ultimateDamageMultiplier, { magic: true, noUltGain: true });
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
      const lockBeforeFire = Number.isFinite(skill.aimLockBeforeFire) ? skill.aimLockBeforeFire : 1.3;
      const cast = Math.max(getCastTime(skill.cast, enemy), lockBeforeFire);
      enemy.actionLock = cast + ctx.ACTION_GAP;
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
      const skill = get("finald", player.aim.type);
      draw.save();
      if (skill && Number.isFinite(skill.range)) {
        drawPlayerRangeCircle(draw, skill.range, "rgba(247,255,246,0.42)");
      }
      if (player.aim.type === "attack") {
        const target = ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
        const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill));
        draw.fillStyle = inRange ? "rgba(158,247,255,0.18)" : "rgba(255,255,255,0.08)";
        draw.strokeStyle = inRange ? "#9ef7ff" : "rgba(255,255,255,0.45)";
        draw.lineWidth = 3;
        draw.beginPath(); draw.arc(target.x, target.y, skill.radius, 0, ctx.TAU); draw.fill(); draw.stroke();
      } else if (player.aim.type === "heal") {
        const target = ctx.game.hover;
        if (target && target.team === "party" && !target.dead) {
          const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill), target.radius);
          draw.strokeStyle = inRange ? "#79ff8d" : "rgba(255,255,255,0.45)";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 15, 0, ctx.TAU); draw.stroke();
        }
      } else if (player.aim.type === "shield") {
        const target = ctx.game.hover;
        if (target && target.team === "party" && !target.dead) {
          const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill), target.radius);
          draw.strokeStyle = inRange ? "#8fe9ff" : "rgba(255,255,255,0.45)";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 15, 0, ctx.TAU); draw.stroke();
        }
      } else if (player.aim.type === "fire") {
        const target = getHoveredEnemy();
        if (target) {
          const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill), target.radius);
          draw.strokeStyle = inRange ? "#ff8b43" : "rgba(255,255,255,0.45)";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 15, 0, ctx.TAU); draw.stroke();
        }
      } else if (player.aim.type === "bomb") {
        const target = ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
        const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill));
        draw.fillStyle = inRange ? "rgba(185,133,238,0.18)" : "rgba(255,255,255,0.08)";
        draw.strokeStyle = inRange ? "#b985ee" : "rgba(255,255,255,0.45)";
        draw.lineWidth = 3;
        draw.beginPath(); draw.arc(target.x, target.y, skill.radius, 0, ctx.TAU); draw.fill(); draw.stroke();
      } else if (player.aim.type === "commandDefend" || player.aim.type === "commandAttack") {
        const target = ctx.game.hover;
        if (isCommandTarget(target)) {
          const inRange = isPointInPlayerRange(target.x, target.y, getPlayerSkillRange(skill), target.radius);
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
          draw.strokeStyle = inRange ? "#ffd56b" : "rgba(255,255,255,0.45)";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 18, 0, ctx.TAU); draw.stroke();
        }
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
          return {
            key,
            name: skill.name,
            skillType: skill.skillType || "",
            cd: getPlayerSkillCooldown(player, key),
            max: skill.cd || 0.1,
            skill,
            targeted: command && (skill.target === "ally" || skill.target === "enemy"),
            command,
            commandDelta: command ? skill.commandDelta : 0,
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
    };
  }

  window.createHealerSkillSystem = createHealerSkillSystem;
})();
