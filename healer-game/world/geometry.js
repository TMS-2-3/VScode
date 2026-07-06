(() => {
  "use strict";

  window.createHealerGeometrySystem = function createHealerGeometrySystem(context) {
    const {
      TAU,
      view,
      town,
      party,
      enemies,
      TOWN_WIDTH,
      TOWN_HEIGHT,
      BATTLE_SIDE_MARGIN,
      BATTLE_MIN_PLAY_HEIGHT,
      battlePx,
      isFieldUnit,
      isTargetableUnit,
    } = context;

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
      return Math.round((view.w * (1 - context.BATTLE_SPATIAL_SCALE)) / 2 + BATTLE_SIDE_MARGIN);
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
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return { x: 0, y: 0, len: 0 };
      }
      const len = Math.hypot(x, y);
      if (!Number.isFinite(len) || len === 0) {
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
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return Infinity;
      }
      let d = (a - b) % TAU;
      if (d > Math.PI) d -= TAU;
      if (d < -Math.PI) d += TAU;
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

    return {
      clampTownPlayer,
      separateUnits,
      nearestAlive,
      clampAllUnits,
      getBattleBounds,
      getBattleSideMargin,
      clampBattlePoint,
      clampUnit,
      normalize,
      dist,
      distPoint,
      angleTo,
      angleDiff,
      inFan,
      projectPoint,
      distanceToSegment,
      deg,
      clamp,
    };
  };
})();
