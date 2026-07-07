(() => {
  "use strict";

  window.createHealerBattleAi = function createHealerBattleAi(context) {
    const {
      party,
      player,
      enemies,
      telegraphs,
      skillSystem,
      getItemSystem,
      MOOD_BASELINE,
      COMMAND_BIAS_PREFERRED_RANGES,
      MOOD_PREFERRED_RANGE_HIGH,
      MOOD_PREFERRED_RANGE_LOW,
      TELEGRAPH_AVOID_PADDING,
      TELEGRAPH_AVOID_SPEED_MULT,
      battlePx,
      clamp,
      dist,
      distPoint,
      normalize,
      angleDiff,
      nearestAlive,
      clampUnit,
      getBattleBounds,
      updateTelegraphDynamic,
      getTargetablePartyMembers,
      getPriorityTarget,
      isAvoidTarget,
      getEffectiveMoveSpeed,
      getEquippedSlotItem,
      triggerUltimate,
    } = context;

    function isActionDisabled(unit) {
      return Boolean(unit && ((unit.frozen || 0) > 0 || (unit.sleepTimer || 0) > 0));
    }

    function updatePartyAi(dt) {
      for (const member of party) {
        if (member.dead || isActionDisabled(member)) {
          continue;
        }

        member.aiTick -= dt;
        const playerTaunted = member === player && isForcedHostileTarget(member, member.forcedTarget);
        if (playerTaunted) {
          member.aim = null;
          member.itemAim = null;
          if (member.aiIntent && member.aiIntent.manual) {
            member.aiIntent = null;
          }
        }
        const itemSystem = getItemSystem ? getItemSystem() : null;
        if (itemSystem && itemSystem.isItemUseControlling && itemSystem.isItemUseControlling(member)) {
          if (!(member === player && member.aiIntent && member.aiIntent.manual)) {
            member.aiIntent = null;
          }
          continue;
        }
        const avoidingTelegraph = member.actionLock <= 0 && updatePartyMovement(member, dt);
        if (member.aiIntent) {
          continue;
        }
        if (member === player && !playerTaunted) {
          continue;
        }
        if (!avoidingTelegraph && member.actionLock <= 0 && member.ult >= skillSystem.getUltimateCost(member) && member.mood >= 95) {
          triggerUltimate(member.id, true);
          continue;
        }

        if (member.aiTick > 0 || member.actionLock > 0 || (member.cds.attack || 0) > 0) {
          continue;
        }

        if (!avoidingTelegraph && member.mood >= 85 && member.ult >= skillSystem.getUltimateCost(member) && Math.random() < 0.16) {
          triggerUltimate(member.id, true);
          continue;
        }

        thinkPartyUnit(member, avoidingTelegraph);
      }
    }

    function updatePartyMovement(unit, dt) {
      if (unit.aiIntent && (!unit.aiIntent.target || unit.aiIntent.target.dead)) {
        unit.aiIntent = null;
      }
      if (unit.aiIntent && unit.aiIntent.target.team === unit.team && !unit.aiIntent.support && !isForcedHostileTarget(unit, unit.aiIntent.target)) {
        unit.aiIntent = null;
      }
      if (unit.aiIntent && isForcedHostileTarget(unit, unit.forcedTarget) && unit.aiIntent.target !== unit.forcedTarget) {
        unit.aiIntent = null;
      }
      const target = unit.aiIntent && unit.aiIntent.target
        ? unit.aiIntent.target
        : getPartyMovementTarget(unit);
      if (!target) {
        return false;
      }
      const d = dist(unit, target);
      const avoidDir = unit.aiIntent ? null : getTelegraphAvoidance(unit);
      const moodSpeed = 1 + Math.max(0, unit.mood - MOOD_BASELINE) * 0.003;
      const speed = getUnitMoveSpeed(unit);
      if (avoidDir) {
        unit.battleFacingIntent = "move";
        moveUnitWithWallSlide(unit, avoidDir, speed * moodSpeed * TELEGRAPH_AVOID_SPEED_MULT * dt);
        return true;
      }

      if (unit.aiIntent) {
        if (d <= unit.aiIntent.range) {
          if (unit.aiIntent.manual && unit === player && skillSystem.executePlayerMoveIntent) {
            skillSystem.executePlayerMoveIntent(unit);
          } else {
            skillSystem.executePartyIntent(unit);
          }
          return false;
        }
        const dir = normalize(target.x - unit.x, target.y - unit.y);
        unit.battleFacingIntent = "move";
        moveUnitWithWallSlide(unit, dir, speed * moodSpeed * dt);
        return false;
      }

      const desired = getPartyPreferredRange(unit);
      const dir = getPreferredRangeMoveDir(unit, target, d, desired);

      unit.battleFacingIntent = "target";
      moveUnitWithWallSlide(unit, dir, speed * moodSpeed * dt);
      return false;
    }

    function getPreferredRangeMoveDir(unit, target, targetDistance, desired) {
      const close = getCloseEnemyPressureDir(unit, desired);
      if (close.count >= 2) {
        return close.dir && close.dir.len > 0.25 ? close.dir : { x: 0, y: 0, len: 0 };
      }
      if (close.count === 1 && close.dir && close.dir.len > 0.05) {
        return close.dir;
      }
      if (targetDistance > desired + battlePx(28)) {
        return normalize(target.x - unit.x, target.y - unit.y);
      }
      if (targetDistance < desired - battlePx(28)) {
        return normalize(unit.x - target.x, unit.y - target.y);
      }
      return { x: 0, y: 0, len: 0 };
    }

    function getCloseEnemyPressureDir(unit, desired) {
      const threshold = Math.max(unit.radius + battlePx(34), desired - battlePx(18));
      let x = 0;
      let y = 0;
      let count = 0;
      for (const enemy of enemies) {
        if (!enemy || enemy.dead) {
          continue;
        }
        const distance = dist(unit, enemy);
        if (distance >= threshold) {
          continue;
        }
        const dir = normalize(unit.x - enemy.x, unit.y - enemy.y);
        if (dir.len <= 0) {
          continue;
        }
        const weight = clamp((threshold - distance) / Math.max(1, threshold), 0, 1);
        x += dir.x * weight;
        y += dir.y * weight;
        count += 1;
      }
      const dir = normalize(x, y);
      return { dir, count };
    }

    function moveUnitWithWallSlide(unit, dir, distance, options = {}) {
      const detailed = Boolean(options && options.detailed);
      if (!unit || !dir || !Number.isFinite(distance) || distance <= 0) {
        return detailed ? { moved: false, blockedByWall: false, wallRejected: false } : false;
      }
      const moveDir = dir.len === 0 ? dir : normalize(dir.x, dir.y);
      if (!moveDir || moveDir.len <= 0) {
        return detailed ? { moved: false, blockedByWall: false, wallRejected: false } : false;
      }

      let dx = moveDir.x * distance;
      let dy = moveDir.y * distance;
      const bounds = typeof getBattleBounds === "function" ? getBattleBounds() : null;
      if (!bounds) {
        unit.x += dx;
        unit.y += dy;
        clampUnit(unit);
        return detailed ? { moved: true, blockedByWall: false, wallRejected: false } : true;
      }

      const radius = Number.isFinite(unit.radius) ? unit.radius : 0;
      const minX = bounds.left + radius;
      const maxX = bounds.right - radius;
      const minY = bounds.top + radius;
      const maxY = bounds.bottom - radius;
      const edge = battlePx(2);
      const blockedX = (unit.x <= minX + edge && dx < 0) || (unit.x >= maxX - edge && dx > 0);
      const blockedY = (unit.y <= minY + edge && dy < 0) || (unit.y >= maxY - edge && dy > 0);

      if (blockedX) {
        dx = 0;
      }
      if (blockedY) {
        dy = 0;
      }

      const slideDistance = distance * 0.55;
      if (blockedX && Math.abs(dy) < 0.01 && minY < maxY) {
        dy = getWallSlideSign(unit, "y", minX, maxX, minY, maxY) * slideDistance;
      }
      if (blockedY && Math.abs(dx) < 0.01 && minX < maxX) {
        dx = getWallSlideSign(unit, "x", minX, maxX, minY, maxY) * slideDistance;
      }

      const unclampedX = unit.x + dx;
      const unclampedY = unit.y + dy;
      const nextX = clamp(unclampedX, minX, maxX);
      const nextY = clamp(unclampedY, minY, maxY);
      const actualDx = nextX - unit.x;
      const actualDy = nextY - unit.y;
      const moved = Math.abs(actualDx) > 0.01 || Math.abs(actualDy) > 0.01;
      const clampedByWall = Math.abs(nextX - unclampedX) > 0.01 || Math.abs(nextY - unclampedY) > 0.01;
      unit.x = nextX;
      unit.y = nextY;
      const blockedByWall = blockedX || blockedY || clampedByWall;
      const intendedProgress = distance;
      const actualProgress = actualDx * moveDir.x + actualDy * moveDir.y;
      const wallRejected = blockedByWall && actualProgress < intendedProgress * 0.35;
      return detailed ? { moved, blockedByWall, wallRejected } : moved;
    }

    function getWallSlideSign(unit, axis, minX, maxX, minY, maxY) {
      const key = axis === "x" ? "aiWallSlideX" : "aiWallSlideY";
      let sign = Number.isFinite(unit[key]) && unit[key] !== 0 ? Math.sign(unit[key]) : 0;
      if (!sign) {
        sign = axis === "x"
          ? (unit.x < (minX + maxX) * 0.5 ? 1 : -1)
          : (unit.y < (minY + maxY) * 0.5 ? 1 : -1);
      }
      const edge = battlePx(2);
      if (axis === "x") {
        if (unit.x <= minX + edge && sign < 0) sign = 1;
        if (unit.x >= maxX - edge && sign > 0) sign = -1;
      } else {
        if (unit.y <= minY + edge && sign < 0) sign = 1;
        if (unit.y >= maxY - edge && sign > 0) sign = -1;
      }
      unit[key] = sign;
      return sign;
    }

    function getUnitMoveSpeed(unit) {
      return typeof getEffectiveMoveSpeed === "function" ? getEffectiveMoveSpeed(unit) : unit.speed;
    }

    function getPartyMovementTarget(unit) {
      if (isForcedHostileTarget(unit, unit && unit.forcedTarget)) {
        unit.aiMoveTarget = unit.forcedTarget;
        return unit.forcedTarget;
      }
      const priorityTarget = getPriorityTarget(unit);
      if (priorityTarget) {
        unit.aiMoveTarget = priorityTarget;
        return priorityTarget;
      }
      const targetableEnemies = getPartyTargetableEnemies();
      const nearest = nearestAlive(unit, targetableEnemies);
      if (!nearest) {
        unit.aiMoveTarget = null;
        return null;
      }
      const current = unit.aiMoveTarget && !unit.aiMoveTarget.dead && targetableEnemies.includes(unit.aiMoveTarget)
        ? unit.aiMoveTarget
        : null;
      if (!current) {
        unit.aiMoveTarget = nearest;
        return nearest;
      }
      const currentDistance = dist(unit, current);
      const nearestDistance = dist(unit, nearest);
      if (nearest !== current && nearestDistance + battlePx(48) < currentDistance) {
        unit.aiMoveTarget = nearest;
        return nearest;
      }
      return current;
    }

    function getPartyTargetableEnemies() {
      return enemies.filter((enemy) => enemy && !enemy.dead && !(typeof isAvoidTarget === "function" && isAvoidTarget(enemy)));
    }

    function isForcedHostileTarget(source, target) {
      return Boolean(source && target && source !== target && source.forcedTarget === target && source.tauntTimer > 0 && !target.dead);
    }

    function getPartyPreferredRange(unit) {
      const bias = clampCommandBias(unit ? unit.commandBias : 0);
      return getPreferredRangeForBias(unit, bias) * getMoodPreferredRangeMultiplier(unit);
    }

    function getEnemyPreferredRange(enemy) {
      if (enemy && Number.isFinite(enemy.preferredRange)) {
        return enemy.preferredRange;
      }
      return getPreferredRangeForBias(enemy, 0);
    }

    function getPreferredRangeForBias(unit, bias) {
      const ranges = COMMAND_BIAS_PREFERRED_RANGES || {};
      const config = ranges[String(clampCommandBias(bias))] || ranges["0"];
      if (!config) {
        return unit && unit.preferredRange ? unit.preferredRange : battlePx(90);
      }
      const role = getPreferredRangeRole(unit);
      const range = Number.isFinite(config[role]) ? config[role] : config.front;
      return Number.isFinite(range) ? battlePx(range) : battlePx(90);
    }

    function getPreferredRangeRole(unit) {
      const weapon = typeof getEquippedSlotItem === "function" ? getEquippedSlotItem(unit, "weapon") : null;
      if (weapon && (weapon.preferredRangeRole === "front" || weapon.preferredRangeRole === "back")) {
        return weapon.preferredRangeRole;
      }
      const weaponType = weapon && weapon.weaponType;
      if (["杖", "魔導書", "楽器"].includes(weaponType)) {
        return "back";
      }
      if (["片手剣", "両手剣", "拳具", "棒具"].includes(weaponType)) {
        return "front";
      }
      return unit && (unit.role === "mage" || unit.role === "caster" || unit.role === "support") ? "back" : "front";
    }

    function clampCommandBias(value) {
      return clamp(Math.round(Number.isFinite(value) ? value : 0), -2, 2);
    }

    function getMoodPreferredRangeMultiplier(unit) {
      if (!unit || unit.mood === null || !Number.isFinite(unit.mood)) {
        return 1;
      }
      const high = MOOD_PREFERRED_RANGE_HIGH || { start: 75, end: 100, multiplier: 0.6 };
      const low = MOOD_PREFERRED_RANGE_LOW || { start: 30, end: 0, multiplier: 1.4 };
      if (unit.mood >= high.start) {
        const ratio = clamp((unit.mood - high.start) / (high.end - high.start), 0, 1);
        return 1 + (high.multiplier - 1) * ratio;
      }
      if (unit.mood <= low.start) {
        const ratio = clamp((low.start - unit.mood) / (low.start - low.end), 0, 1);
        return 1 + (low.multiplier - 1) * ratio;
      }
      return 1;
    }

    function getTelegraphAvoidance(unit) {
      if (!unit || unit.actionLock > 0 || unit.cast || unit.channel) {
        return null;
      }

      let x = 0;
      let y = 0;
      for (const telegraph of telegraphs) {
        if (telegraph.hidden || telegraph.team !== "enemy") {
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
      syncShadowWolfPackTarget();
      for (const enemy of enemies) {
        if (enemy.dead || isActionDisabled(enemy)) {
          continue;
        }

        const target = getEnemyTarget(enemy);
        if (!target) {
          continue;
        }

        const rangeTarget = getEnemyPreferredRangeTarget(enemy, target);
        const d = dist(enemy, rangeTarget);
        const preferred = getEnemyPreferredRange(enemy);
        const dir = normalize(rangeTarget.x - enemy.x, rangeTarget.y - enemy.y);
        const speed = typeof getEffectiveMoveSpeed === "function" ? getEffectiveMoveSpeed(enemy) : enemy.speed;
        if (updateEnemySkillIntent(enemy, dt, speed)) {
          continue;
        }
        if (enemy.actionLock <= 0 && enemy.role === "shadow_wolf" && (enemy.cds.attack || 0) > 0) {
          updateShadowWolfOrbit(enemy, rangeTarget, d, preferred, speed, dt);
        } else if (enemy.actionLock <= 0 && d > preferred + battlePx(10)) {
          moveUnitWithWallSlide(enemy, dir, speed * dt);
        } else if (enemy.actionLock <= 0 && d < preferred - battlePx(20) && getPreferredRangeRole(enemy) === "back") {
          moveUnitWithWallSlide(enemy, { x: -dir.x, y: -dir.y }, speed * 0.65 * dt);
        }

        if (enemy.actionLock > 0 || (enemy.cds.attack || 0) > 0) {
          continue;
        }

        thinkEnemy(enemy, target, dist(enemy, target));
      }
    }

    function updateEnemySkillIntent(enemy, dt, speed) {
      const intent = enemy && enemy.aiIntent;
      if (!intent || !intent.enemySkill) {
        return false;
      }
      if (!intent.target || intent.target.dead) {
        enemy.aiIntent = null;
        return false;
      }
      if (enemy.actionLock > 0 || (enemy.cds.attack || 0) > 0) {
        return true;
      }
      const range = Math.max(0, Number.isFinite(intent.range) ? intent.range : 0);
      const distance = dist(enemy, intent.target);
      if (distance <= range) {
        skillSystem.executeEnemyIntent(enemy);
        return true;
      }
      const dir = normalize(intent.target.x - enemy.x, intent.target.y - enemy.y);
      enemy.battleFacingIntent = "move";
      moveUnitWithWallSlide(enemy, dir, speed * dt);
      return true;
    }

    function updateShadowWolfOrbit(enemy, target, distance, preferred, speed, dt) {
      if (!enemy || !target || !Number.isFinite(distance) || !Number.isFinite(preferred)) {
        return false;
      }
      const dir = distance > 0.001 ? normalize(target.x - enemy.x, target.y - enemy.y) : { x: 1, y: 0, len: 1 };
      if (!Number.isFinite(enemy.shadowOrbitDir) || enemy.shadowOrbitDir === 0) {
        enemy.shadowOrbitDir = Math.random() < 0.5 ? -1 : 1;
      }

      const rawError = distance - preferred;
      if (enemy.shadowOrbitTarget !== target || !Number.isFinite(enemy.shadowRangeError)) {
        enemy.shadowOrbitTarget = target;
        enemy.shadowRangeError = rawError;
      } else {
        const smoothing = clamp(dt * 5.5, 0, 1);
        enemy.shadowRangeError += (rawError - enemy.shadowRangeError) * smoothing;
      }

      const deadBand = battlePx(16);
      const correctionWidth = battlePx(96);
      const error = Math.abs(enemy.shadowRangeError) <= deadBand ? 0 : enemy.shadowRangeError;
      const correction = error === 0
        ? 0
        : Math.sign(error) * clamp((Math.abs(error) - deadBand) / correctionWidth, 0, 1);
      const correctionStrength = Math.abs(correction);
      const tangentWeight = clamp(1 - correctionStrength * 0.85, 0.18, 1);
      const radialWeight = correction * 1.35;
      const orbitDir = {
        x: -dir.y * enemy.shadowOrbitDir,
        y: dir.x * enemy.shadowOrbitDir,
        len: 1,
      };
      const moveDir = normalize(
        orbitDir.x * tangentWeight + dir.x * radialWeight,
        orbitDir.y * tangentWeight + dir.y * radialWeight,
      );
      const moveSpeed = speed * (0.68 + correctionStrength * 0.26);
      const movement = moveUnitWithWallSlide(enemy, moveDir, moveSpeed * dt, { detailed: true });

      enemy.shadowOrbitFlipCooldown = Math.max(0, (enemy.shadowOrbitFlipCooldown || 0) - dt);
      if (movement.wallRejected && tangentWeight > 0.25 && enemy.shadowOrbitFlipCooldown <= 0) {
        enemy.shadowOrbitDir = -(Number.isFinite(enemy.shadowOrbitDir) && enemy.shadowOrbitDir !== 0 ? enemy.shadowOrbitDir : 1);
        enemy.shadowOrbitFlipCooldown = 0.35;
      }
      return movement.moved;
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

    function thinkPartyUnit(unit, avoidingTelegraph = false) {
      return skillSystem.thinkPartyUnit(unit, avoidingTelegraph);
    }

    function thinkEnemy(enemy, target, distance) {
      return skillSystem.thinkEnemy(enemy, target, distance);
    }

    function getEnemyTarget(enemy) {
      if (!enemy || enemy.dead) {
        return null;
      }
      if (enemy.forcedTarget && !enemy.forcedTarget.dead) {
        return enemy.forcedTarget;
      }
      const targets = getTargetablePartyMembers();
      if (enemy.role === "horn_rabbit") {
        return getLowestHpTargetBelowRatio(targets, 0.4) || nearestAlive(enemy, targets);
      }
      if (enemy.role === "shadow_wolf") {
        return getShadowWolfPackTarget(enemy, targets);
      }
      return nearestAlive(enemy, targets);
    }

    function getEnemyPreferredRangeTarget(enemy, fallbackTarget) {
      if (enemy && enemy.role === "shadow_wolf") {
        return getCurrentShadowWolfPackTarget(getTargetablePartyMembers()) || fallbackTarget;
      }
      return fallbackTarget;
    }

    function getLowestHpTarget(targets) {
      return (targets || [])
        .filter((unit) => unit && !unit.dead)
        .sort((a, b) => (a.hp || 0) - (b.hp || 0))[0] || null;
    }

    function getLowestHpTargetBelowRatio(targets, threshold) {
      return (targets || [])
        .filter((unit) => unit && !unit.dead && unit.maxHp > 0 && unit.hp / unit.maxHp < threshold)
        .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0] || null;
    }

    function getShadowWolfPackTarget(enemy, targets) {
      const wolves = getAliveShadowWolves();
      const current = getCurrentShadowWolfPackTarget(targets, wolves);
      const target = getShadowWolfPriorityTarget(targets, current);
      setShadowWolfPackTarget(wolves, target);
      return target;
    }

    function syncShadowWolfPackTarget() {
      const wolves = getAliveShadowWolves();
      if (!wolves.length) {
        return null;
      }
      const targets = getTargetablePartyMembers();
      if (!targets.length) {
        setShadowWolfPackTarget(wolves, null);
        return null;
      }
      const current = getCurrentShadowWolfPackTarget(targets, wolves);
      const target = getShadowWolfPriorityTarget(targets, current);
      setShadowWolfPackTarget(wolves, target);
      return target;
    }

    function getAliveShadowWolves() {
      return enemies.filter((candidate) => candidate && !candidate.dead && candidate.role === "shadow_wolf");
    }

    function getCurrentShadowWolfPackTarget(targets, wolves = getAliveShadowWolves()) {
      return wolves
        .map((wolf) => wolf.shadowPackTarget)
        .find((target) => target && !target.dead && targets.includes(target)) || null;
    }

    function setShadowWolfPackTarget(wolves, target) {
      for (const wolf of wolves) {
        wolf.shadowPackTarget = target || null;
      }
    }

    function getShadowWolfPriorityTarget(targets, current = null) {
      const candidates = (targets || []).filter((unit) => unit && !unit.dead);
      if (!candidates.length) {
        return null;
      }
      const highestMaxHp = Math.max(...candidates.map((unit) => getUnitMaxHpForTargeting(unit)));
      const topTargets = candidates.filter((unit) => getUnitMaxHpForTargeting(unit) === highestMaxHp);
      if (current && topTargets.includes(current)) {
        return current;
      }
      return topTargets[Math.floor(Math.random() * topTargets.length)] || null;
    }

    function getUnitMaxHpForTargeting(unit) {
      if (unit && Number.isFinite(unit.maxHp)) {
        return unit.maxHp;
      }
      return unit && Number.isFinite(unit.hp) ? unit.hp : 0;
    }

    return {
      updatePartyAi,
      updatePartyMovement,
      getTelegraphAvoidance,
      getTelegraphEscapeVector,
      getCircleTelegraphEscape,
      getLineTelegraphEscape,
      getFanTelegraphEscape,
      getTelegraphAvoidWeight,
      closestPointOnSegment,
      getLinePerpendicular,
      updateEnemyAi,
      thinkPartyUnit,
      thinkUlpes,
      thinkRihas,
      thinkSushia,
      thinkEnemy,
    };
  };
})();
