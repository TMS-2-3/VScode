(() => {
  "use strict";

  window.createHealerEffectSystem = function createHealerEffectSystem(context) {
    const {
      effects,
      EFFECT_DATA,
      SKILL_DATA,
      battlePx,
    } = context;

    const DEFAULT_FRAME_DURATIONS = [0.5, 0.7, 0.5];
    const imageCache = new Map();

    function getEffectTable() {
      if (EFFECT_DATA && EFFECT_DATA.effects && typeof EFFECT_DATA.effects === "object") {
        return EFFECT_DATA.effects;
      }
      return EFFECT_DATA && typeof EFFECT_DATA === "object" ? EFFECT_DATA : {};
    }

    function getEffectDefaults() {
      return EFFECT_DATA && EFFECT_DATA.defaults && typeof EFFECT_DATA.defaults === "object"
        ? EFFECT_DATA.defaults
        : {};
    }

    function getEffectDef(effectId) {
      if (!effectId) {
        return null;
      }
      const table = getEffectTable();
      const def = table[String(effectId)] || null;
      return def && typeof def === "object" ? def : null;
    }

    function normalizeFrameEntry(frame) {
      if (typeof frame === "string") {
        return { src: frame };
      }
      if (!frame || typeof frame !== "object") {
        return null;
      }
      const src = frame.src || frame.image || frame.path || frame.url || null;
      return src ? { ...frame, src } : null;
    }

    function getEffectFrameEntries(def) {
      if (!def) {
        return [];
      }
      const frameSource = Array.isArray(def.frames)
        ? def.frames
        : (Array.isArray(def.images) ? def.images : [def.frame1, def.frame2, def.frame3]);
      return frameSource
        .map((frame) => normalizeFrameEntry(frame))
        .filter(Boolean);
    }

    function getImage(src) {
      if (!src || typeof Image === "undefined") {
        return null;
      }
      const key = String(src);
      if (imageCache.has(key)) {
        return imageCache.get(key);
      }
      const image = new Image();
      image.src = key;
      imageCache.set(key, image);
      return image;
    }

    function preloadEffect(effectId) {
      const def = getEffectDef(effectId);
      if (!def) {
        return false;
      }
      const frames = getEffectFrameEntries(def);
      if (!frames.length) {
        return false;
      }
      frames.forEach((frame) => getImage(frame.src));
      return true;
    }

    function preloadEffects(effectIds) {
      const ids = Array.isArray(effectIds) ? effectIds : [effectIds];
      let count = 0;
      for (const effectId of ids) {
        if (preloadEffect(effectId)) {
          count += 1;
        }
      }
      return count;
    }

    function getSkillDef(owner, key) {
      if (!owner || !key || !SKILL_DATA) {
        return null;
      }
      return SKILL_DATA[owner] && SKILL_DATA[owner][key] || null;
    }

    function getSkillEffectIds(skill) {
      const ids = [];
      if (!skill || typeof skill !== "object") {
        return ids;
      }
      addEffectId(ids, skill.effectId);
      addEffectId(ids, skill.startEffectId);
      addEffectId(ids, skill.hitEffectId);
      addEffectId(ids, skill.areaEffectId);
      addEffectId(ids, skill.endEffectId);
      if (Array.isArray(skill.effects)) {
        for (const entry of skill.effects) {
          addEffectId(ids, typeof entry === "string" ? entry : entry && (entry.id || entry.effectId));
        }
      }
      if (skill.effectIds && typeof skill.effectIds === "object") {
        Object.keys(skill.effectIds).forEach((key) => addEffectId(ids, skill.effectIds[key]));
      }
      return [...new Set(ids)];
    }

    function addEffectId(ids, effectId) {
      if (typeof effectId === "string" && effectId) {
        ids.push(effectId);
      }
    }

    function getUnitSkillKeys(unit) {
      const keys = new Set();
      const loadout = unit && unit.loadout || {};
      if (Array.isArray(loadout.active)) {
        loadout.active.forEach((key) => key && keys.add(key));
      }
      if (loadout.ultimate) {
        keys.add(loadout.ultimate);
      }
      if (loadout.passive) {
        keys.add(loadout.passive);
      }
      if (unit && unit.firstSkillKey) {
        keys.add(unit.firstSkillKey);
      }
      if (Array.isArray(unit && unit.skillQueue)) {
        unit.skillQueue.forEach((key) => key && keys.add(key));
      }
      keys.add("attack");
      keys.add("ult");
      return [...keys];
    }

    function preloadBattleEffects(units) {
      const effectIds = new Set();
      const battleUnits = Array.isArray(units) ? units : [];
      for (const unit of battleUnits) {
        if (!unit) {
          continue;
        }
        const owner = unit.skillOwner || unit.id || "";
        for (const key of getUnitSkillKeys(unit)) {
          const skill = getSkillDef(owner, key) || getSkillDef("party", key) || getSkillDef("enemy", key);
          getSkillEffectIds(skill).forEach((effectId) => effectIds.add(effectId));
        }
      }
      return preloadEffects([...effectIds]);
    }

    function getBaseFrameDurations(def) {
      const defaults = getEffectDefaults();
      const source = Array.isArray(def && def.frameDurations)
        ? def.frameDurations
        : (Array.isArray(defaults.frameDurations) ? defaults.frameDurations : DEFAULT_FRAME_DURATIONS);
      return DEFAULT_FRAME_DURATIONS.map((fallback, index) => {
        const value = Number(source[index]);
        return Number.isFinite(value) && value >= 0 ? value : fallback;
      });
    }

    function getEffectDuration(def, options) {
      const value = Number(
        options.effectDuration
        ?? options.duration
        ?? options.skillDuration
        ?? (options.skill && (options.skill.effectDuration ?? options.skill.duration))
        ?? def.effectDuration
        ?? 0,
      );
      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function resolveFollowTarget(def, options) {
      if (options.followTarget) {
        return options.followTarget;
      }
      const follow = options.follow ?? def.follow ?? getEffectDefaults().follow ?? "none";
      if (follow === "source") return options.source || null;
      if (follow === "target") return options.target || null;
      if (follow === "hitbox") return options.hitbox || options.area || options.projectile || options.target || null;
      return null;
    }

    function getEffectPosition(def, options, followTarget) {
      const source = followTarget || options.position || options.hitbox || options.area || options.projectile || options.target || options.source || {};
      const x = Number(options.x ?? source.x);
      const y = Number(options.y ?? source.y);
      return {
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
      };
    }

    function playSkillEffect(skill, options = {}) {
      if (!skill || typeof skill !== "object") {
        return null;
      }
      const effectId = options.effectId || skill.effectId || skill.startEffectId;
      return playEffect(effectId, { ...options, skill });
    }

    function playEffect(effectId, options = {}) {
      const def = getEffectDef(effectId);
      if (!def) {
        return null;
      }
      const frames = getEffectFrameEntries(def);
      if (!frames.length) {
        return null;
      }
      const images = frames.map((frame) => getImage(frame.src));
      if (!images.some(Boolean)) {
        return null;
      }
      const baseDurations = getBaseFrameDurations(def);
      const phaseDurations = [
        baseDurations[0],
        baseDurations[1] + getEffectDuration(def, options),
        baseDurations[2],
      ];
      const followTarget = resolveFollowTarget(def, options);
      const position = getEffectPosition(def, options, followTarget);
      const defaults = getEffectDefaults();
      const scale = Number(options.scale ?? def.scale ?? defaults.scale ?? 1);
      const radius = Number(options.radius ?? def.radius ?? 0);
      const effect = {
        type: "spriteEffect",
        effectId: String(effectId),
        x: position.x,
        y: position.y,
        originX: position.x,
        originY: position.y,
        images,
        frameEntries: frames,
        phaseDurations,
        phaseIndex: 0,
        phaseRemaining: phaseDurations[0],
        frameIndex: 0,
        time: phaseDurations.reduce((sum, value) => sum + value, 0),
        total: phaseDurations.reduce((sum, value) => sum + value, 0),
        age: 0,
        follow: options.follow ?? def.follow ?? defaults.follow ?? "none",
        followTarget,
        anchor: options.anchor || def.anchor || defaults.anchor || "center",
        layer: options.layer || def.layer || defaults.layer || "aboveUnits",
        scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
        width: Number(options.width ?? def.width),
        height: Number(options.height ?? def.height),
        radius: Number.isFinite(radius) && radius > 0 ? radius : 0,
        scaleToRadius: options.scaleToRadius ?? def.scaleToRadius ?? false,
        rotation: Number(options.rotation ?? def.rotation ?? 0) || 0,
        alpha: Number(options.alpha ?? def.alpha ?? 1) || 1,
      };
      effects.push(effect);
      return effect;
    }

    function updateEffects(dt) {
      const elapsed = Math.max(0, Number(dt) || 0);
      for (let i = effects.length - 1; i >= 0; i -= 1) {
        const effect = effects[i];
        if (!effect) {
          effects.splice(i, 1);
          continue;
        }
        if (effect.type === "spriteEffect") {
          updateSpriteEffect(effect, elapsed);
        } else {
          updateLegacyEffect(effect, elapsed);
        }
        if (effect.time <= 0) {
          effects.splice(i, 1);
        }
      }
    }

    function updateLegacyEffect(effect, dt) {
      effect.time = (Number.isFinite(effect.time) ? effect.time : 0) - dt;
      effect.age = (Number.isFinite(effect.age) ? effect.age : 0) + dt;
      if (effect.vy) {
        effect.y += effect.vy * dt;
      }
    }

    function updateSpriteEffect(effect, dt) {
      effect.time = (Number.isFinite(effect.time) ? effect.time : 0) - dt;
      effect.age = (Number.isFinite(effect.age) ? effect.age : 0) + dt;
      updateSpriteEffectPosition(effect);
      effect.phaseRemaining = (Number.isFinite(effect.phaseRemaining) ? effect.phaseRemaining : 0) - dt;
      while (effect.phaseRemaining <= 0 && effect.phaseIndex < effect.phaseDurations.length - 1) {
        effect.phaseIndex += 1;
        effect.phaseRemaining += Math.max(0, Number(effect.phaseDurations[effect.phaseIndex]) || 0);
      }
      effect.frameIndex = Math.min(effect.images.length - 1, Math.max(0, effect.phaseIndex));
    }

    function updateSpriteEffectPosition(effect) {
      const target = effect.followTarget;
      if (!target || typeof target !== "object") {
        return;
      }
      const x = Number(target.x);
      const y = Number(target.y);
      if (Number.isFinite(x)) {
        effect.x = x;
      }
      if (Number.isFinite(y)) {
        effect.y = y;
      }
    }

    function endEffect(effect) {
      if (!effect || effect.type !== "spriteEffect") {
        return false;
      }
      if (effect.phaseIndex < 2) {
        effect.phaseIndex = 2;
        effect.frameIndex = Math.min(effect.images.length - 1, 2);
        effect.phaseRemaining = Math.max(0, Number(effect.phaseDurations[2]) || DEFAULT_FRAME_DURATIONS[2]);
        effect.time = effect.phaseRemaining;
      }
      return true;
    }

    function clearImageCache() {
      imageCache.clear();
    }

    return {
      getEffectDef,
      getSkillEffectIds,
      preloadEffect,
      preloadEffects,
      preloadBattleEffects,
      playEffect,
      playSkillEffect,
      updateEffects,
      endEffect,
      clearImageCache,
    };
  };
})();
