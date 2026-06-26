(() => {
  "use strict";

  window.createHealerTooltipText = function createHealerTooltipText(context) {
    const {
      game,
      STATUS_DATA,
      clamp,
      getEffectiveAttack,
      getEffectiveMagic,
    } = context;
    const statusData = STATUS_DATA || window.HEALER_STATUS_DATA || {};
    const DEFAULT_DESCRIPTION_MODE = "simple";

    function getDescription(source) {
      if (!source) {
        return "";
      }
      if (getDescriptionMode() === "detail") {
        return source.description || source.simpleDescription || source.tooltip || source.helpText || "";
      }
      return source.simpleDescription || source.description || source.tooltip || source.helpText || "";
    }

    function getDescriptionMode() {
      const mode = game && game.settings && game.settings.tooltipDescriptionMode;
      return mode === "detail" ? "detail" : DEFAULT_DESCRIPTION_MODE;
    }

    function pushText(lines, text) {
      const parts = String(text || "").split(/\r?\n/);
      for (const part of parts) {
        lines.push(part);
      }
    }

    function pushDescriptionWithStatuses(lines, source, unit, fallback = "") {
      const description = formatDescription(getDescription(source), unit, source);
      if (description || fallback) {
        pushText(lines, description || fallback);
      }
      appendRelatedStatuses(lines, description, source && source.statusIds, unit);
      return description;
    }

    function appendRelatedStatuses(lines, description, statusIds, unit) {
      const relatedStatuses = getReferencedStatuses(description, statusIds);
      if (!relatedStatuses.length) {
        return;
      }
      lines.push("");
      for (const status of relatedStatuses) {
        lines.push(`${status.name}: ${formatDescription(getDescription(status), unit, status)}`);
      }
    }

    function formatDescription(text, unit, source) {
      let index = 0;
      return String(text || "").replace(/\(式=値\)/g, () => {
        const formula = Array.isArray(source && source.formula) ? source.formula[index] : null;
        index += 1;
        if (!formula) {
          return "(式=?)";
        }
        return `(${formula.text || "式"}=${formatNumber(getFormulaValue(unit, source, formula))})`;
      });
    }

    function getFormulaValue(unit, source, formula) {
      if (!unit || !formula) {
        return 0;
      }
      if (formula.type === "strepionHeal") {
        const hpPercent = unit.maxHp > 0 ? clampValue(unit.hp / unit.maxHp, 0, 1) * 100 : 100;
        const missingBelow = Math.max(0, (source.healHpThresholdPercent || 50) - hpPercent);
        return callStat(getEffectiveMagic, unit, unit.magic) * (source.healMagicScale || 0)
          + unit.maxHp * (((source.healHpBasePercent || 5) + missingBelow) / 100);
      }
      if (formula.type === "rihasTauntShield") {
        return unit.maxHp * (source.shieldHpRatio || 0.05);
      }
      if (formula.type === "burnTick") {
        return Math.max(0, unit.hp * 0.01);
      }
      const statValue = formula.stat === "attack"
        ? callStat(getEffectiveAttack, unit, unit.attack)
        : formula.stat === "magic"
          ? callStat(getEffectiveMagic, unit, unit.magic)
          : 0;
      const base = Number.isFinite(source[formula.baseProp]) ? source[formula.baseProp] : 0;
      const scale = Number.isFinite(source[formula.scaleProp]) ? source[formula.scaleProp] : 0;
      return base + statValue * scale;
    }

    function getReferencedStatuses(description, statusIds) {
      const result = [];
      const seen = new Set();
      const addStatus = (status) => {
        if (!status || seen.has(status.id || status.name)) {
          return;
        }
        seen.add(status.id || status.name);
        result.push(status);
      };
      if (Array.isArray(statusIds)) {
        for (const id of statusIds) {
          addStatus(getStatusDef(id));
        }
      }
      const quoted = String(description || "").match(/"([^"\r\n]+)"/g) || [];
      for (const raw of quoted) {
        addStatus(getStatusDef(raw.slice(1, -1)));
      }
      return result;
    }

    function getStatusDef(statusIdOrName) {
      if (!statusIdOrName || !statusData) {
        return null;
      }
      if (statusData[statusIdOrName]) {
        return statusData[statusIdOrName];
      }
      return Object.values(statusData).find((status) => status && status.name === statusIdOrName) || null;
    }

    function callStat(fn, unit, fallback) {
      return typeof fn === "function" ? fn(unit) : fallback;
    }

    function clampValue(value, min, max) {
      return typeof clamp === "function" ? clamp(value, min, max) : Math.max(min, Math.min(max, value));
    }

    function formatNumber(value) {
      return `${Math.round(Number.isFinite(value) ? value : 0)}`;
    }

    return {
      appendRelatedStatuses,
      formatDescription,
      getDescription,
      getFormulaValue,
      getReferencedStatuses,
      getStatusDef,
      pushDescriptionWithStatuses,
      pushText,
    };
  };
})();
