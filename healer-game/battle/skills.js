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
    const COMMAND_SKILL_KEYS = ["commandDefend", "commandAttack", "commandDefendAll", "commandAttackAll"];

    function getSkillOwner(unit) {
      return unit && (unit.skillOwner || unit.id) || "";
    }

    function isSkillEquipped(unit, key) {
      return !ctx.isActiveSkillEquipped || ctx.isActiveSkillEquipped(unit, key);
    }

    function getUnitSkill(unit, key) {
      return get(getSkillOwner(unit), key);
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

    function speakSkill(unit, key) {
      const skill = getUnitSkill(unit, key);
      const lines = skill && Array.isArray(skill.lines) ? skill.lines : [];
      if (lines.length) ctx.addSpeech(lines[Math.floor(Math.random() * lines.length)], unit);
    }

    function useRandom(unit, candidates) {
      if (!candidates.length) {
        unit.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      candidates[Math.floor(Math.random() * candidates.length)]();
      return true;
    }

    function choosePartyAction(unit, target, candidates) {
      if (!candidates.length) {
        unit.aiTick = ctx.AI_IDLE_RECHECK;
        return false;
      }
      const action = candidates[Math.floor(Math.random() * candidates.length)];
      if (ctx.dist(unit, target) <= action.range) {
        action.use();
      } else {
        unit.aiIntent = { key: action.key, target, range: action.range };
      }
      return true;
    }

    function executePartyIntent(unit) {
      const intent = unit && unit.aiIntent;
      if (!intent || !intent.target || intent.target.dead) {
        if (unit) unit.aiIntent = null;
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
      if (unit.id === "ulpes") {
        if (key === "heroSlash") { useUlpesHeroSlash(unit, target); return true; }
        if (key === "attack") { useUlpesNormal(unit, target); return true; }
      } else if (unit.id === "rihas") {
        if (key === "quake") { useRihasJump(unit, target); return true; }
        if (key === "attack") { useRihasNormal(unit); return true; }
      } else if (unit.id === "sushia") {
        if (key === "bomb") { useSushiaBomb(unit, target); return true; }
        if (key === "attack") { useSushiaBolts(unit, target); return true; }
      }
      return false;
    }

    function getActionCooldown(unit) {
      const base = ctx.ACTION_COOLDOWN_BASE || 7;
      if (unit.team === "party" && unit.id !== "finald") return ctx.getCommandActionCooldown(unit, base);
      if (unit.team === "enemy") return base;
      return base;
    }

    function setActionCooldown(unit) {
      if (ctx.applyMoodCommandBiasAuto) ctx.applyMoodCommandBiasAuto(unit);
      if (ctx.commitCommandBias) ctx.commitCommandBias(unit);
      unit.cds.attack = Math.max(unit.cds.attack || 0, getActionCooldown(unit));
    }

    function getPartyAttackTarget(unit) {
      return (ctx.getPriorityTarget && ctx.getPriorityTarget()) || ctx.nearestAlive(unit, ctx.enemies);
    }

    function thinkUlpes(unit, avoidingTelegraph = false) {
      const target = getPartyAttackTarget(unit);
      if (!target) return;
      const d = ctx.dist(unit, target);
      const attack = need("ulpes", "attack");
      const slash = need("ulpes", "heroSlash");
      const candidates = [];
      if (isSkillEquipped(unit, "heroSlash") && (unit.cds.heroSlash || 0) <= 0 && (!avoidingTelegraph || d <= slash.range)) candidates.push({ key: "heroSlash", range: slash.range, use: () => useUlpesHeroSlash(unit, target) });
      if (isSkillEquipped(unit, "attack") && (!avoidingTelegraph || d <= attack.range)) candidates.push({ key: "attack", range: attack.range, use: () => useUlpesNormal(unit, target) });
      choosePartyAction(unit, target, candidates);
    }

    function thinkRihas(unit, avoidingTelegraph = false) {
      const target = getPartyAttackTarget(unit);
      if (!target) return;
      const d = ctx.dist(unit, target);
      const attack = need("rihas", "attack");
      const quake = need("rihas", "quake");
      const candidates = [];
      if (isSkillEquipped(unit, "quake") && !avoidingTelegraph && (unit.cds.quake || 0) <= 0) candidates.push({ key: "quake", range: quake.range, use: () => useRihasJump(unit, target) });
      if (isSkillEquipped(unit, "attack") && (!avoidingTelegraph || d <= attack.range)) candidates.push({ key: "attack", range: attack.range, use: () => useRihasNormal(unit) });
      choosePartyAction(unit, target, candidates);
    }

    function thinkSushia(unit, avoidingTelegraph = false) {
      const target = getPartyAttackTarget(unit);
      if (!target) return;
      const d = ctx.dist(unit, target);
      const attack = need("sushia", "attack");
      const bomb = need("sushia", "bomb");
      const candidates = [];
      if (isSkillEquipped(unit, "bomb") && (unit.cds.bomb || 0) <= 0 && (!avoidingTelegraph || d <= bomb.range)) candidates.push({ key: "bomb", range: bomb.range, use: () => useSushiaBomb(unit, target) });
      if (isSkillEquipped(unit, "attack") && (!avoidingTelegraph || d <= attack.range)) candidates.push({ key: "attack", range: attack.range, use: () => useSushiaBolts(unit, target) });
      choosePartyAction(unit, target, candidates);
    }

    function thinkEnemy(enemy, target, distance) {
      const attack = need("enemy", "attack");
      const candidates = [];
      if (enemy.role === "caster") {
        if (isSkillEquipped(enemy, "casterLine") && (enemy.cds.skill || 0) <= 0) candidates.push(() => enemyLineAttack(enemy, target));
      } else if (enemy.role === "elite") {
        if (isSkillEquipped(enemy, "heavySlam") && (enemy.cds.skill || 0) <= 0) candidates.push(() => enemyHeavySlam(enemy, target));
        if (isSkillEquipped(enemy, "attack") && distance <= attack.eliteRange) candidates.push(() => enemyBite(enemy, target));
      } else if (isSkillEquipped(enemy, "attack") && distance <= attack.bruteRange) {
        candidates.push(() => enemyBite(enemy, target));
      }
      useRandom(enemy, candidates);
    }

    function useUlpesNormal(unit, target) {
      const skill = need("ulpes", "attack");
      speakSkill(unit, "attack");
      setActionCooldown(unit);
      unit.actionLock = ctx.ACTION_GAP;
      unit.aimAngle = ctx.angleTo(unit, target);
      for (let i = 0; i < skill.repeat; i += 1) {
        setTimeout(() => {
          if (!unit.dead && !target.dead && ctx.dist(unit, target) <= skill.hitRange) {
            ctx.dealDamage(unit, target, skill.damageBase + getAttackStat(unit) * skill.attackScale, { crit: true });
            ctx.slashEffect(unit, target);
          }
        }, i * skill.repeatDelayMs);
      }
    }

    function useUlpesHeroSlash(unit, target) {
      const skill = need("ulpes", "heroSlash");
      speakSkill(unit, "heroSlash");
      setActionCooldown(unit);
      unit.cds.heroSlash = ctx.getMoodCooldown(unit, skill.cd);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      unit.aimAngle = ctx.angleTo(unit, target);
      ctx.addTelegraph({
        type: "fan", source: unit, x: unit.x, y: unit.y, radius: skill.radius,
        angle: unit.aimAngle, arc: ctx.deg(skill.arcDeg), team: "party", time: cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        getAngle: () => target.dead ? unit.aimAngle : ctx.angleTo(unit, target),
        resolve: () => {
          let hits = 0;
          unit.aimAngle = target.dead ? unit.aimAngle : ctx.angleTo(unit, target);
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (ctx.inFan(unitHit, unit.x, unit.y, skill.radius, unit.aimAngle, ctx.deg(skill.arcDeg))) {
              ctx.dealDamage(unit, unitHit, skill.damageBase + getAttackStat(unit) * skill.attackScale, { crit: true });
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          unit.cds.heroSlash = Math.max(skill.minCdAfterHit, unit.cds.heroSlash - hits * skill.cdRefundPerHit);
          ctx.addBurst(unit.x, unit.y, skill.burstRadius, "rgba(244,197,79,0.22)");
        },
      });
    }

    function useRihasNormal(unit) {
      const skill = need("rihas", "attack");
      speakSkill(unit, "attack");
      setActionCooldown(unit);
      const cast = getCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      ctx.addTelegraph({
        type: "circle", x: unit.x, y: unit.y, radius: skill.radius, team: "party", time: cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        resolve: () => {
          let hits = 0;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (ctx.distPoint(unitHit.x, unitHit.y, unit.x, unit.y) <= skill.radius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, skill.damageBase + getAttackStat(unit) * skill.attackScale);
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          ctx.addBurst(unit.x, unit.y, skill.burstRadius, "rgba(227,122,63,0.25)");
        },
      });
    }
    function useRihasJump(unit, target) {
      const skill = need("rihas", "quake");
      speakSkill(unit, "quake");
      setActionCooldown(unit);
      unit.cds.quake = ctx.getMoodCooldown(unit, skill.cd);
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
          if (unit.dead) return;
          const impact = { x: telegraph.x, y: telegraph.y };
          let hits = 0;
          unit.x = impact.x;
          unit.y = impact.y;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            const d = ctx.distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
            if (d <= skill.radius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, skill.damageBase + getAttackStat(unit) * skill.attackScale);
              hits += unitHit.team === "enemy" ? 1 : 0;
            } else if (d <= skill.shockRadius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, skill.shockDamageBase + getAttackStat(unit) * skill.shockAttackScale, { magic: true });
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
      setActionCooldown(unit);
      const cast = ctx.getSushiaCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      ctx.addTelegraph({
        type: "line", x: unit.x, y: unit.y, x2: target.x, y2: target.y, width: skill.lineWidth, team: "party", time: cast,
        getLine: () => ({ x: unit.x, y: unit.y, x2: target.x, y2: target.y }),
        resolve: () => {
          speakSkill(unit, "attack");
          for (let i = 0; i < skill.projectileCount; i += 1) {
            const spread = (i - Math.floor(skill.projectileCount / 2)) * skill.spread;
            const angle = ctx.angleTo(unit, target) + spread;
            ctx.projectiles.push({ x: unit.x, y: unit.y, vx: Math.cos(angle) * skill.projectileSpeed, vy: Math.sin(angle) * skill.projectileSpeed, radius: skill.projectileRadius, team: "party", owner: unit, damage: skill.damageBase + getMagicStat(unit) * skill.magicScale, magic: true, life: skill.life, hit: new Set(), pierce: false, affectsAllies: true, color: skill.color });
          }
        },
      });
    }

    function useSushiaBomb(unit, target) {
      const skill = need("sushia", "bomb");
      setActionCooldown(unit);
      unit.cds.bomb = ctx.getMoodCooldown(unit, skill.cd);
      const cast = ctx.getSushiaCastTime(skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "party", time: cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          speakSkill(unit, "bomb");
          const impact = { x: telegraph.x, y: telegraph.y };
          let hits = 0;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            const d = ctx.distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
            if (d <= skill.radius + unitHit.radius) {
              const near = d <= skill.innerRadius + unitHit.radius;
              const damage = near ? skill.nearDamageBase + getMagicStat(unit) * skill.nearMagicScale : skill.farDamageBase + getMagicStat(unit) * skill.farMagicScale;
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

    function startPlayerAim(type) {
      const player = ctx.player;
      if (player.dead || player.channel || player.cast || player.frozen > 0) return false;
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

    function confirmPlayerAim() {
      const player = ctx.player;
      if (!player.aim || player.dead || player.channel || player.cast || player.frozen > 0) return false;
      ctx.game.hover = ctx.getHoveredPartyMember();
      if (player.aim.type === "attack") return firePlayerShot();
      if (player.aim.type === "heal") return castHeal();
      if (player.aim.type === "shield") return castShield();
      if (isCommandSkill(player.aim.type)) return usePlayerCommand(player.aim.type);
      return false;
    }

    function firePlayerShot() {
      const player = ctx.player;
      const skill = need("finald", "attack");
      if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) return false;
      const target = ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
      const origin = ctx.getSupportOrigin(target);
      if ((player.cds.attack || 0) > 0) { ctx.addFloat("再詠唱中", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      if (player.mp < skill.cost) { ctx.addFloat("魔力不足", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      if (!ctx.startPlayerCast("attack", { target }, getCastTime(skill.cast, player))) return false;
      player.mp -= skill.cost;
      player.cds.attack = skill.cd;
      return true;
    }

    function completePlayerShot(lockedTarget) {
      const player = ctx.player;
      const skill = need("finald", "attack");
      const target = lockedTarget || ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
      const origin = ctx.getSupportOrigin(target);
      speakSkill(player, "attack");
      let hits = 0;
      const damage = skill.damageBase + getMagicStat(player) * skill.magicScale;
      for (const unit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
        if (unit.dead || unit === player) {
          continue;
        }
        if (ctx.distPoint(unit.x, unit.y, target.x, target.y) <= skill.radius + unit.radius) {
          ctx.dealDamage(player, unit, damage, { magic: true });
          hits += 1;
        }
      }
      ctx.effects.push({ type: "beam", x: origin.x, y: origin.y, x2: target.x, y2: target.y, color: "rgba(158,247,255,0.78)", time: 0.18, age: 0 });
      ctx.addTelegraph({ type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "support", time: 0.16, resolve: () => {} });
      ctx.addBurst(target.x, target.y, skill.burstRadius, hits > 0 ? "rgba(158,247,255,0.28)" : "rgba(158,247,255,0.14)");
    }
    function castHeal() {
      const player = ctx.player;
      const skill = need("finald", "heal");
      if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) return false;
      const target = ctx.game.hover;
      if (!target || target.dead || target.team !== "party") { ctx.addFloat("対象なし", ctx.input.mouse.x, ctx.input.mouse.y - 12, "#ffffff"); return false; }
      if ((player.cds.heal || 0) > 0) { ctx.addFloat("再詠唱中", target.x, target.y - 28, "#ffffff"); return false; }
      if (player.mp < skill.cost) { ctx.addFloat("魔力不足", target.x, target.y - 28, "#ffffff"); return false; }
      if (!ctx.startPlayerCast("heal", { target }, getCastTime(skill.cast, player))) return false;
      player.mp -= skill.cost;
      player.cds.heal = skill.cd;
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
      ctx.healUnit(player, target, skill.healBase + getMagicStat(player) * skill.magicScale, { noMood: target === player });
      const origin = ctx.getSupportOrigin(target);
      ctx.effects.push({ type: "beam", x: origin.x, y: origin.y, x2: target.x, y2: target.y, color: skill.beamColor, time: 0.24, age: 0 });
    }

    function castShield() {
      const player = ctx.player;
      const skill = need("finald", "shield");
      if (player.dead || player.channel || player.cast || player.frozen > 0 || player.actionLock > 0) return false;
      const origin = ctx.getSupportOrigin();
      if ((player.cds.shield || 0) > 0) { ctx.addFloat("再詠唱中", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      if (player.mp < skill.cost) { ctx.addFloat("魔力不足", origin.x + 26, origin.y - 28, "#ffffff"); return false; }
      const point = ctx.clampBattlePoint
        ? ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(35))
        : { x: ctx.clamp(ctx.input.mouse.x, ctx.battlePx(35), ctx.view.w - ctx.battlePx(35)), y: ctx.clamp(ctx.input.mouse.y, ctx.battlePx(35), ctx.view.h - ctx.battlePx(35)) };
      const { x, y } = point;
      if (!ctx.startPlayerCast("shield", { x, y }, getCastTime(skill.cast, player))) return false;
      player.mp -= skill.cost;
      player.cds.shield = skill.cd;
      return true;
    }

    function completeShield(x, y) {
      const player = ctx.player;
      const skill = need("finald", "shield");
      speakSkill(player, "shield");
      let applied = 0;
      for (const member of ctx.getFieldPartyMembers()) {
        if (!member.dead && ctx.distPoint(member.x, member.y, x, y) <= skill.radius + member.radius) {
          ctx.addShield(member, skill.shieldBase + getMagicStat(player) * skill.magicScale, skill.duration);
          if (member !== player) ctx.addMoodGain(member, skill.moodGain * ctx.MOOD_EVENT_MULT);
          applied += 1;
        }
      }
      player.ult = ctx.clamp(player.ult + applied * 4, 0, 100);
      ctx.addTelegraph({ type: "circle", x, y, radius: skill.radius, team: "support", time: 0.18, resolve: () => {} });
      ctx.addBurst(x, y, skill.radius + 4, "rgba(143,233,255,0.25)");
    }

    function isCommandSkill(key) {
      return COMMAND_SKILL_KEYS.includes(key);
    }

    function usePlayerCommand(key) {
      const player = ctx.player;
      const skill = get("finald", key);
      if (!skill || !isCommandSkill(key)) {
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

      if (skill.target === "ally") {
        const target = ctx.game.hover;
        if (!isCommandTarget(target)) {
          ctx.addFloat("対象なし", ctx.input.mouse.x, ctx.input.mouse.y - 12, "#ffffff");
          return false;
        }
        const changed = applyCommandBiasChange(target, skill.commandDelta);
        player.cds[key] = skill.cd;
        player.aim = null;
        player.actionLock = Math.max(player.actionLock, ctx.ACTION_GAP);
        speakSkill(player, key);
        ctx.addFloat(changed ? skill.name : "無視", target.x, target.y - 34, changed ? getCommandFloatColor(skill.commandDelta) : "#f7fff6");
        return true;
      }

      if (skill.target === "allAllies") {
        let targets = 0;
        for (const member of ctx.getFieldPartyMembers()) {
          if (isCommandTarget(member)) {
            const changed = applyCommandBiasChange(member, skill.commandDelta);
            ctx.addFloat(changed ? skill.name : "無視", member.x, member.y - 34, changed ? getCommandFloatColor(skill.commandDelta) : "#f7fff6");
            targets += 1;
          }
        }
        if (targets <= 0) {
          ctx.addFloat("対象なし", origin.x + 26, origin.y - 28, "#ffffff");
          return false;
        }
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

    function applyCommandBiasChange(unit, delta) {
      if (shouldIgnoreCommandBiasChange(unit, delta)) {
        return false;
      }
      unit.commandBias = ctx.clampCommandBias((unit.commandBias || 0) + delta);
      return true;
    }

    function shouldIgnoreCommandBiasChange(unit, delta) {
      if (!unit || unit.mood === null) {
        return false;
      }
      if (delta > 0 && unit.mood <= 5) {
        return Math.random() < 0.9;
      }
      if (delta > 0 && unit.mood <= 30) {
        return Math.random() < 0.2;
      }
      if (delta < 0 && unit.mood >= 95) {
        return Math.random() < 0.9;
      }
      if (delta < 0 && unit.mood >= 70) {
        return Math.random() < 0.25;
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
      else if (cast.type === "shield") completeShield(cast.x, cast.y);
      else if (cast.type === "ult") completeFinaldUlt();
    }

    function getPlayerCastCooldown(type) {
      const skill = get("finald", type);
      if (!skill || typeof skill.cd !== "number") return null;
      return { key: type, max: skill.cd };
    }

    function triggerUltimate(id, automatic = false) {
      const unit = ctx.party.find((member) => member.id === id);
      if (!unit || unit.dead || unit.frozen > 0 || unit.ult < 100 || unit.actionLock > 0 || unit.cast || unit.channel) return false;
      if (unit.id !== "finald" && unit.mood !== null && unit.mood <= 50) { ctx.addFloat("不調", unit.x, unit.y - 34, "#cfd5e6"); return false; }
      unit.ult = 0;
      if (id === "ulpes") ultUlpes(unit, automatic);
      else if (id === "rihas") ultRihas(unit);
      else if (id === "sushia") ultSushia(unit, automatic);
      else if (id === "finald") ultFinald();
      return true;
    }

    function ultUlpes(unit, automatic) {
      const skill = need("ulpes", "ult");
      const target = getPartyAttackTarget(unit);
      if (!target) return;
      speakSkill(unit, "ult");
      const cast = getCastTime(automatic ? skill.autoCast : skill.cast, unit);
      unit.actionLock = cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "party", time: cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          if (unit.dead || target.dead) return;
          const impact = { x: telegraph.x, y: telegraph.y };
          let hits = 0;
          const point = ctx.clampBattlePoint
            ? ctx.clampBattlePoint(impact.x + skill.teleportOffset, impact.y, ctx.battlePx(35))
            : { x: ctx.clamp(impact.x + skill.teleportOffset, ctx.battlePx(35), ctx.view.w - ctx.battlePx(35)), y: impact.y };
          unit.x = point.x;
          unit.y = point.y;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            const d = ctx.distPoint(unitHit.x, unitHit.y, impact.x, impact.y);
            if (d <= skill.hitRadius + unitHit.radius) {
              const rawDamage = skill.damageBase + getAttackStat(unit) * skill.attackScale;
              const base = unitHit.team === "enemy" ? rawDamage : rawDamage / 4;
              ctx.dealDamage(unit, unitHit, automatic ? base * skill.autoDamageScale : base);
              hits += unitHit.team === "enemy" ? 1 : 0;
            }
          }
          ctx.applyMultiHitMoodBonus(unit, hits);
          ctx.addBurst(impact.x, impact.y, skill.burstRadius, "rgba(244,197,79,0.32)");
        },
      };
      ctx.addTelegraph(telegraph);
    }

    function ultRihas(unit) {
      const skill = need("rihas", "ult");
      speakSkill(unit, "ult");
      unit.actionLock = ctx.ACTION_GAP;
      let taunted = 0;
      for (const enemy of ctx.enemies) {
        if (!enemy.dead && ctx.dist(unit, enemy) <= skill.radius) {
          enemy.forcedTarget = unit;
          enemy.tauntTimer = skill.duration;
          taunted += 1;
        }
      }
      ctx.addShield(unit, skill.shieldBase + taunted * skill.shieldPerTarget, skill.duration);
      ctx.addBurst(unit.x, unit.y, skill.radius + skill.burstExtraRadius, "rgba(227,122,63,0.18)");
    }
    function ultSushia(unit, automatic) {
      const skill = need("sushia", "ult");
      const cast = ctx.getSushiaCastTime(automatic ? skill.autoCast : skill.cast, unit);
      const radius = automatic ? skill.radius : skill.radius + skill.manualRadiusBonus;
      unit.actionLock = cast + ctx.ACTION_GAP;
      ctx.addTelegraph({
        type: "circle", x: unit.x, y: unit.y, radius, team: "party", time: cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        resolve: () => {
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
                const d = ctx.distPoint(unitHit.x, unitHit.y, center.x, center.y);
                if (d <= radius + unitHit.radius) {
                  if (!frozen.has(unitHit)) {
                    const freezeTime = getSushiaIceFreezeTime(skill, unitHit, automatic);
                    if (freezeTime > unitHit.frozen) {
                      unitHit.frozen = freezeTime;
                      unitHit.frozenMax = freezeTime;
                    }
                    frozen.add(unitHit);
                  }
                  const scale = 1 - ctx.clamp(d / radius, 0, 0.8);
                  const allyDamageMultiplier = !automatic && unitHit.team === "party" ? skill.manualAllyDamageMultiplier : 1;
                  ctx.dealDamage(unit, unitHit, (skill.damageBase + getMagicStat(unit) * skill.magicScale) * scale * allyDamageMultiplier, { magic: true });
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

    function getSushiaIceFreezeTime(skill, target, automatic) {
      if (automatic) {
        return target.team === "party" ? skill.autoFreezeAlly : skill.autoFreezeEnemy;
      }
      return target.team === "party" ? skill.freezeAlly : skill.freezeEnemy;
    }

    function ultFinald() {
      const player = ctx.player;
      const skill = need("finald", "ult");
      if (player.channel || player.cast || player.actionLock > 0) return;
      if (!ctx.startPlayerCast("ult", {}, getCastTime(skill.cast, player))) return;
      speakSkill(player, "ult");
    }

    function completeFinaldUlt() {
      const player = ctx.player;
      const skill = need("finald", "ult");
      let healed = 0;
      for (const member of ctx.getFieldPartyMembers()) {
        if (member.dead) {
          continue;
        }
        const hpRatio = member.maxHp > 0 ? ctx.clamp(member.hp / member.maxHp, 0, 1) : 0;
        const healRatio = skill.baseHealRatio + (1 - hpRatio) * skill.missingHealRatio;
        if (ctx.healUnit(player, member, member.maxHp * healRatio) > 0) {
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
      const skill = need("finald", "ult");
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
          ctx.healUnit(player, member, skill.healPerPulse);
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
      enemy.cds.skill = skill.cdBase + Math.random() * skill.cdRandom;
      const cast = getCastTime(skill.cast, enemy);
      enemy.actionLock = cast + ctx.ACTION_GAP;
      const getLine = () => {
        const end = ctx.projectPoint(enemy, target, skill.length);
        return { x: enemy.x, y: enemy.y, x2: end.x, y2: end.y };
      };
      const initial = getLine();
      const telegraph = {
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
      enemy.cds.skill = skill.cd;
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
      draw.save();
      if (player.aim.type === "attack") {
        const skill = need("finald", "attack");
        const target = ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(12));
        draw.fillStyle = "rgba(158,247,255,0.18)";
        draw.strokeStyle = "#9ef7ff";
        draw.lineWidth = 3;
        draw.beginPath(); draw.arc(target.x, target.y, skill.radius, 0, ctx.TAU); draw.fill(); draw.stroke();
      } else if (player.aim.type === "heal") {
        const target = ctx.game.hover;
        if (target && target.team === "party" && !target.dead) {
          draw.strokeStyle = "#79ff8d";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 15, 0, ctx.TAU); draw.stroke();
        }
      } else if (player.aim.type === "shield") {
        const skill = need("finald", "shield");
        const point = ctx.clampBattlePoint
          ? ctx.clampBattlePoint(ctx.input.mouse.x, ctx.input.mouse.y, ctx.battlePx(35))
          : { x: ctx.clamp(ctx.input.mouse.x, ctx.battlePx(35), ctx.view.w - ctx.battlePx(35)), y: ctx.clamp(ctx.input.mouse.y, ctx.battlePx(35), ctx.view.h - ctx.battlePx(35)) };
        const { x, y } = point;
        draw.fillStyle = "rgba(143,233,255,0.18)";
        draw.strokeStyle = "#8fe9ff";
        draw.lineWidth = 3;
        draw.beginPath(); draw.arc(x, y, skill.radius, 0, ctx.TAU); draw.fill(); draw.stroke();
      } else if (player.aim.type === "commandDefend" || player.aim.type === "commandAttack") {
        const target = ctx.game.hover;
        if (isCommandTarget(target)) {
          draw.strokeStyle = player.aim.type === "commandDefend" ? "#9cc6ff" : "#ffd56b";
          draw.lineWidth = 3;
          draw.beginPath(); draw.arc(target.x, target.y, target.radius + 17, 0, ctx.TAU); draw.stroke();
        }
      }
      draw.restore();
    }
    function getPanelSkills(player) {
      const entries = [];
      const attack = get("finald", "attack");
      const heal = get("finald", "heal");
      const shield = get("finald", "shield");
      const ult = need("finald", "ult");
      if (attack && isSkillEquipped(player, "attack")) entries.push({ key: "attack", input: "A", name: attack.name, cd: player.cds.attack || 0, max: attack.cd });
      if (heal && isSkillEquipped(player, "heal")) entries.push({ key: "heal", input: "S", name: heal.name, cd: player.cds.heal || 0, max: heal.cd });
      if (shield && isSkillEquipped(player, "shield")) entries.push({ key: "shield", input: "D", name: shield.name, cd: player.cds.shield || 0, max: shield.cd });
      entries.push({ key: "ult", input: "4", name: ult.name, cd: player.ult < 100 ? 100 - player.ult : 0, max: 100, gauge: true });
      return entries;
    }

    function getCommandPanelSkills(player) {
      const inputLabels = { commandDefend: "G", commandAttack: "H", commandDefendAll: "J", commandAttackAll: "K" };
      return COMMAND_SKILL_KEYS.filter((key) => isSkillEquipped(player, key)).map((key) => {
        const skill = need("finald", key);
        return {
          key,
          input: inputLabels[key],
          name: skill.name,
          cd: player.cds[key] || 0,
          max: skill.cd,
          targeted: skill.target === "ally",
          commandDelta: skill.commandDelta,
        };
      });
    }

    function getUnitSkillEntries(unit) {
      const owner = getSkillOwner(unit);
      const activeEntries = ctx.getEquippedActiveSkills
        ? ctx.getEquippedActiveSkills(unit)
        : Object.entries(DATA[owner] || {}).filter(([key]) => key !== "ult").map(([key, skill]) => ({ key, skill }));
      const ult = get(owner, "ult");
      return [
        ...activeEntries,
        ...(ult ? [{ key: "ult", skill: ult }] : []),
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
      skillNumber,
      speakSkill,
      getActionCooldown,
      setActionCooldown,
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
      getCommandPanelSkills,
      executePartyIntent,
    };
  }

  window.createHealerSkillSystem = createHealerSkillSystem;
})();
