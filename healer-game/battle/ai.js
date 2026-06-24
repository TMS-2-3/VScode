(() => {
  "use strict";

  window.createHealerBattleAi = function createHealerBattleAi(context) {
    const {
      party,
      player,
      enemies,
      telegraphs,
      skillSystem,
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
      updateTelegraphDynamic,
      getTargetablePartyMembers,
      getPriorityTarget,
      triggerUltimate,
    } = context;

    function updatePartyAi(dt) {
      for (const member of party) {
        if (member === player || member.dead || member.frozen > 0) {
          continue;
        }

        member.aiTick -= dt;
        const avoidingTelegraph = member.actionLock <= 0 && updatePartyMovement(member, dt);
        if (member.aiIntent) {
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
      const avoidDir = getTelegraphAvoidance(unit);
      const moodSpeed = 1 + Math.max(0, unit.mood - MOOD_BASELINE) * 0.003;
      if (avoidDir) {
        unit.x += avoidDir.x * unit.speed * moodSpeed * TELEGRAPH_AVOID_SPEED_MULT * dt;
        unit.y += avoidDir.y * unit.speed * moodSpeed * TELEGRAPH_AVOID_SPEED_MULT * dt;
        clampUnit(unit);
        return true;
      }

      if (unit.aiIntent) {
        if (d <= unit.aiIntent.range) {
          skillSystem.executePartyIntent(unit);
          return false;
        }
        const dir = normalize(target.x - unit.x, target.y - unit.y);
        unit.x += dir.x * unit.speed * moodSpeed * dt;
        unit.y += dir.y * unit.speed * moodSpeed * dt;
        clampUnit(unit);
        return false;
      }

      const desired = getPartyPreferredRange(unit);
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

    function getPartyMovementTarget(unit) {
      if (isForcedHostileTarget(unit, unit && unit.forcedTarget)) {
        return unit.forcedTarget;
      }
      return getPriorityTarget() || nearestAlive(unit, enemies);
    }

    function isForcedHostileTarget(source, target) {
      return Boolean(source && target && source !== target && source.forcedTarget === target && source.tauntTimer > 0 && !target.dead);
    }

    function getPartyPreferredRange(unit) {
      const bias = clampCommandBias(unit ? unit.commandBias : 0);
      return getPreferredRangeForBias(unit, bias) * getMoodPreferredRangeMultiplier(unit);
    }

    function getEnemyPreferredRange(enemy) {
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
      return unit && (unit.role === "mage" || unit.role === "caster") ? "back" : "front";
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
      if (!unit || unit.mood === null || unit.actionLock > 0 || unit.cast || unit.channel) {
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
        const preferred = getEnemyPreferredRange(enemy);
        const dir = normalize(target.x - enemy.x, target.y - enemy.y);
        if (enemy.actionLock <= 0 && d > preferred + battlePx(10)) {
          enemy.x += dir.x * enemy.speed * dt;
          enemy.y += dir.y * enemy.speed * dt;
        } else if (enemy.actionLock <= 0 && d < preferred - battlePx(20) && getPreferredRangeRole(enemy) === "back") {
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
