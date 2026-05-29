(() => {
  "use strict";

  const spatialScale = window.HEALER_CONFIG && Number.isFinite(window.HEALER_CONFIG.battleSpatialScale)
    ? window.HEALER_CONFIG.battleSpatialScale
    : 1;
  const px = (value) => Math.max(1, Math.round(value * spatialScale));

  const DATA = {
    finald: {
      attack: { id: "finald_attack", key: "attack", owner: "finald", name: "援護射撃", cd: 5, cast: 1, cost: 6, radius: px(54), burstRadius: px(62), damageBase: 16, magicScale: 0.28, color: "#9ef7ff", lines: ["援護します"] },
      heal: { id: "finald_heal", key: "heal", owner: "finald", name: "ヒール", cd: 6, cast: 2, cost: 18, range: px(520), healBase: 38, magicScale: 0.55, beamColor: "rgba(151,247,255,0.72)", lines: ["ヒール!", "回復!"] },
      shield: { id: "finald_shield", key: "shield", owner: "finald", name: "バリア", cd: 8, cast: 2, cost: 24, range: px(340), radius: px(92), shieldBase: 40, magicScale: 0.45, duration: 6, moodGain: 4, lines: ["バリア展開!", "守るよ!"] },
      ult: { id: "finald_ult", key: "ult", owner: "finald", name: "フルヒール", cast: 3, baseHealRatio: 0.25, missingHealRatio: 0.5, lines: ["フルヒール!!"] },
    },
    ulpes: {
      attack: { id: "ulpes_attack", key: "attack", owner: "ulpes", name: "通常攻撃", cd: 3, range: px(52), hitRange: px(62), repeat: 3, repeatDelayMs: 120, damageBase: 8, attackScale: 0.38, lines: ["てやっ!", "くらえ!"] },
      heroSlash: { id: "ulpes_hero_slash", key: "heroSlash", owner: "ulpes", name: "ヒーロースラッシュ", cd: 10, range: px(128), radius: px(122), arcDeg: 200, cast: 0.62, damageBase: 18, attackScale: 0.7, minCdAfterHit: 1.5, cdRefundPerHit: 0.5, burstRadius: px(116), lines: ["ヒーロースラッシュ!!"] },
      ult: { id: "ulpes_ult", key: "ult", owner: "ulpes", name: "正義の一撃", cast: 0.7, autoCast: 0.45, radius: px(72), hitRadius: px(70), damageBase: 74, attackScale: 1.4, autoDamageScale: 0.65, teleportOffset: px(22), burstRadius: px(84), lines: ["正義の一撃!!"] },
    },
    rihas: {
      attack: { id: "rihas_attack", key: "attack", owner: "rihas", name: "台地揺るがす拳", cd: 4, range: px(75), radius: px(66), cast: 0.38, damageBase: 16, attackScale: 0.55, burstRadius: px(72), lines: ["どりゃぁ!", "しねぇ!"] },
      quake: { id: "rihas_quake", key: "quake", owner: "rihas", name: "台地よ!揺れよ!", cd: 13, range: px(260), radius: px(92), shockRadius: px(160), cast: 0.82, landingOffset: px(18), damageBase: 22, attackScale: 0.8, shockDamageBase: 10, shockAttackScale: 0.25, burstRadius: px(158), approach: true, lines: ["台地よ!揺れよ!"] },
      ult: { id: "rihas_ult", key: "ult", owner: "rihas", name: "俺ァ無敵!!", radius: px(350), duration: 5.5, shieldBase: 25, shieldPerTarget: 8, burstExtraRadius: px(10), lines: ["相手してやる"] },
    },
    sushia: {
      attack: { id: "sushia_attack", key: "attack", owner: "sushia", name: "拡散弾", cd: 5, range: px(340), cast: 1, projectileCount: 3, spread: 0.08, lineWidth: px(16), projectileSpeed: px(360), projectileRadius: px(5), damageBase: 10, magicScale: 0.35, life: 1.4, color: "#d9afff", lines: ["とうっ!", "拡散弾!"] },
      bomb: { id: "sushia_bomb", key: "bomb", owner: "sushia", name: "インパクトボム", cd: 15, range: px(430), cast: 3, radius: px(108), innerRadius: px(32), nearDamageBase: 32, nearMagicScale: 0.95, farDamageBase: 16, farMagicScale: 0.48, burstRadius: px(118), lines: ["インパクトボム!!"] },
      ult: {
        id: "sushia_ult", key: "ult", owner: "sushia", name: "アイスワールド",
        cast: 5, autoCast: 3.5, radius: px(330), manualRadiusBonus: px(50),
        duration: 4.2, autoDuration: 2.6, tickRate: 0.4,
        freezeEnemy: 3, freezeAlly: 1, autoFreezeEnemy: 1, autoFreezeAlly: 3,
        manualAllyDamageMultiplier: 0.5,
        damageBase: 8, magicScale: 0.22, lines: ["全部凍っちゃえ!!"],
      },
    },
    enemy: {
      attack: { id: "enemy_attack", key: "attack", owner: "enemy", name: "通常攻撃", cd: 4, bruteRange: px(48), eliteRange: px(58), cast: 0.32, radius: px(42), damageBonus: 8 },
      casterLine: { id: "enemy_caster_line", key: "casterLine", owner: "enemy", name: "射撃線", actionCd: 5.2, cdBase: 6.6, cdRandom: 1.5, cast: 0.86, length: px(620), width: px(26), hitWidth: px(18), damageBonus: 17 },
      heavySlam: { id: "enemy_heavy_slam", key: "heavySlam", owner: "enemy", name: "ヘビースラム", cd: 8.4, cast: 0.95, radius: px(98), damageBonus: 20, burstRadius: px(110) },
    },
  };

  function get(owner, key) {
    return DATA[owner] && DATA[owner][key] ? DATA[owner][key] : null;
  }

  function need(owner, key) {
    const skill = get(owner, key);
    if (!skill) throw new Error(`Missing skill data: ${owner}.${key}`);
    return skill;
  }

  function createHealerSkillSystem(ctx) {
    function speakSkill(unit, key) {
      if (unit.id === "finald") {
        return;
      }
      const skill = get(unit.id, key);
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
    function getActionCooldown(unit) {
      if (unit.id === "ulpes") return ctx.getMoodCooldown(unit, need("ulpes", "attack").cd);
      if (unit.id === "rihas") return ctx.getMoodCooldown(unit, need("rihas", "attack").cd);
      if (unit.id === "sushia") return ctx.getMoodCooldown(unit, need("sushia", "attack").cd);
      if (unit.role === "caster") return need("enemy", "casterLine").actionCd;
      if (unit.team === "enemy") return need("enemy", "attack").cd;
      return 1.5;
    }

    function setActionCooldown(unit) {
      unit.cds.attack = Math.max(unit.cds.attack || 0, getActionCooldown(unit));
    }

    function thinkUlpes(unit, avoidingTelegraph = false) {
      const target = ctx.nearestAlive(unit, ctx.enemies);
      if (!target) return;
      const d = ctx.dist(unit, target);
      const attack = need("ulpes", "attack");
      const slash = need("ulpes", "heroSlash");
      const candidates = [];
      if ((unit.cds.heroSlash || 0) <= 0 && d <= slash.range) candidates.push(() => useUlpesHeroSlash(unit, target));
      if (d <= attack.range) candidates.push(() => useUlpesNormal(unit, target));
      useRandom(unit, candidates);
    }

    function thinkRihas(unit, avoidingTelegraph = false) {
      const target = ctx.nearestAlive(unit, ctx.enemies);
      if (!target) return;
      const d = ctx.dist(unit, target);
      const attack = need("rihas", "attack");
      const quake = need("rihas", "quake");
      const candidates = [];
      if ((!avoidingTelegraph || !quake.approach) && (unit.cds.quake || 0) <= 0 && d <= quake.range) candidates.push(() => useRihasJump(unit, target));
      if (d <= attack.range) candidates.push(() => useRihasNormal(unit));
      useRandom(unit, candidates);
    }

    function thinkSushia(unit, avoidingTelegraph = false) {
      const target = ctx.nearestAlive(unit, ctx.enemies);
      if (!target) return;
      const d = ctx.dist(unit, target);
      const attack = need("sushia", "attack");
      const bomb = need("sushia", "bomb");
      const candidates = [];
      if ((unit.cds.bomb || 0) <= 0 && d <= bomb.range) candidates.push(() => useSushiaBomb(unit, target));
      if (d <= attack.range) candidates.push(() => useSushiaBolts(unit, target));
      useRandom(unit, candidates);
    }

    function thinkEnemy(enemy, target, distance) {
      const attack = need("enemy", "attack");
      const candidates = [];
      if (enemy.role === "caster") {
        if ((enemy.cds.skill || 0) <= 0) candidates.push(() => enemyLineAttack(enemy, target));
      } else if (enemy.role === "elite") {
        if ((enemy.cds.skill || 0) <= 0) candidates.push(() => enemyHeavySlam(enemy, target));
        if (distance <= attack.eliteRange) candidates.push(() => enemyBite(enemy, target));
      } else if (distance <= attack.bruteRange) {
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
            ctx.dealDamage(unit, target, skill.damageBase + unit.attack * skill.attackScale, { crit: true });
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
      unit.actionLock = skill.cast + ctx.ACTION_GAP;
      unit.aimAngle = ctx.angleTo(unit, target);
      ctx.addTelegraph({
        type: "fan", source: unit, x: unit.x, y: unit.y, radius: skill.radius,
        angle: unit.aimAngle, arc: ctx.deg(skill.arcDeg), team: "party", time: skill.cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        getAngle: () => target.dead ? unit.aimAngle : ctx.angleTo(unit, target),
        resolve: () => {
          let hits = 0;
          unit.aimAngle = target.dead ? unit.aimAngle : ctx.angleTo(unit, target);
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (ctx.inFan(unitHit, unit.x, unit.y, skill.radius, unit.aimAngle, ctx.deg(skill.arcDeg))) {
              ctx.dealDamage(unit, unitHit, skill.damageBase + unit.attack * skill.attackScale, { crit: true });
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
      unit.actionLock = skill.cast + ctx.ACTION_GAP;
      ctx.addTelegraph({
        type: "circle", x: unit.x, y: unit.y, radius: skill.radius, team: "party", time: skill.cast,
        getPosition: () => ({ x: unit.x, y: unit.y }),
        resolve: () => {
          let hits = 0;
          for (const unitHit of [...ctx.enemies, ...ctx.getFieldPartyMembers()]) {
            if (unitHit.dead || unitHit === unit) continue;
            if (ctx.distPoint(unitHit.x, unitHit.y, unit.x, unit.y) <= skill.radius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, skill.damageBase + unit.attack * skill.attackScale);
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
      unit.actionLock = skill.cast + ctx.ACTION_GAP;
      const getLanding = () => {
        const dir = ctx.normalize(target.x - unit.x, target.y - unit.y);
        return ctx.clampBattlePoint
          ? ctx.clampBattlePoint(target.x - dir.x * skill.landingOffset, target.y - dir.y * skill.landingOffset, ctx.battlePx(45))
          : { x: ctx.clamp(target.x - dir.x * skill.landingOffset, ctx.battlePx(45), ctx.view.w - ctx.battlePx(45)), y: ctx.clamp(target.y - dir.y * skill.landingOffset, ctx.battlePx(45), ctx.view.h - ctx.battlePx(45)) };
      };
      const landing = getLanding();
      const telegraph = {
        type: "circle", x: landing.x, y: landing.y, radius: skill.radius, team: "party", time: skill.cast,
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
              ctx.dealDamage(unit, unitHit, skill.damageBase + unit.attack * skill.attackScale);
              hits += unitHit.team === "enemy" ? 1 : 0;
            } else if (d <= skill.shockRadius + unitHit.radius) {
              ctx.dealDamage(unit, unitHit, skill.shockDamageBase + unit.attack * skill.shockAttackScale, { magic: true });
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
            ctx.projectiles.push({ x: unit.x, y: unit.y, vx: Math.cos(angle) * skill.projectileSpeed, vy: Math.sin(angle) * skill.projectileSpeed, radius: skill.projectileRadius, team: "party", owner: unit, damage: skill.damageBase + unit.magic * skill.magicScale, magic: true, life: skill.life, hit: new Set(), pierce: false, affectsAllies: true, color: skill.color });
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
              const damage = near ? skill.nearDamageBase + unit.magic * skill.nearMagicScale : skill.farDamageBase + unit.magic * skill.farMagicScale;
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
      if (!ctx.startPlayerCast("attack", { target }, skill.cast)) return false;
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
      const damage = skill.damageBase + player.magic * skill.magicScale;
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
      if (!ctx.startPlayerCast("heal", { target }, skill.cast)) return false;
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
      ctx.healUnit(player, target, skill.healBase + player.magic * skill.magicScale, { noMood: target === player });
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
      if (!ctx.startPlayerCast("shield", { x, y }, skill.cast)) return false;
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
          ctx.addShield(member, skill.shieldBase + player.magic * skill.magicScale, skill.duration);
          if (member !== player) ctx.addMoodGain(member, skill.moodGain * ctx.MOOD_EVENT_MULT);
          applied += 1;
        }
      }
      player.ult = ctx.clamp(player.ult + applied * 4, 0, 100);
      ctx.addTelegraph({ type: "circle", x, y, radius: skill.radius, team: "support", time: 0.18, resolve: () => {} });
      ctx.addBurst(x, y, skill.radius + 4, "rgba(143,233,255,0.25)");
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
      if (unit.id !== "finald" && unit.mood !== null && unit.mood <= 40) { ctx.addFloat("不調", unit.x, unit.y - 34, "#cfd5e6"); return false; }
      unit.ult = 0;
      if (id === "ulpes") ultUlpes(unit, automatic);
      else if (id === "rihas") ultRihas(unit);
      else if (id === "sushia") ultSushia(unit, automatic);
      else if (id === "finald") ultFinald();
      return true;
    }

    function ultUlpes(unit, automatic) {
      const skill = need("ulpes", "ult");
      const target = ctx.nearestAlive(unit, ctx.enemies);
      if (!target) return;
      speakSkill(unit, "ult");
      const cast = automatic ? skill.autoCast : skill.cast;
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
              const base = unitHit.team === "enemy" ? skill.damageBase + unit.attack * skill.attackScale : (skill.damageBase + unit.attack * skill.attackScale) / 4;
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
                  ctx.dealDamage(unit, unitHit, (skill.damageBase + unit.magic * skill.magicScale) * scale * allyDamageMultiplier, { magic: true });
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
      if (!ctx.startPlayerCast("ult", {}, skill.cast)) return;
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
      enemy.actionLock = skill.cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "enemy", time: skill.cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          const impact = { x: telegraph.x, y: telegraph.y };
          for (const member of ctx.getFieldPartyMembers()) {
            if (!member.dead && ctx.distPoint(member.x, member.y, impact.x, impact.y) <= skill.radius + member.radius) ctx.dealDamage(enemy, member, enemy.attack + skill.damageBonus);
          }
        },
      };
      ctx.addTelegraph(telegraph);
    }

    function enemyLineAttack(enemy, target) {
      const skill = need("enemy", "casterLine");
      setActionCooldown(enemy);
      enemy.cds.skill = skill.cdBase + Math.random() * skill.cdRandom;
      enemy.actionLock = skill.cast + ctx.ACTION_GAP;
      const getLine = () => {
        const end = ctx.projectPoint(enemy, target, skill.length);
        return { x: enemy.x, y: enemy.y, x2: end.x, y2: end.y };
      };
      const initial = getLine();
      const telegraph = {
        type: "line", x: initial.x, y: initial.y, x2: initial.x2, y2: initial.y2, width: skill.width, team: "enemy", time: skill.cast, getLine,
        resolve: () => {
          for (const member of ctx.getFieldPartyMembers()) {
            if (!member.dead && ctx.distanceToSegment(member.x, member.y, telegraph.x, telegraph.y, telegraph.x2, telegraph.y2) <= skill.hitWidth + member.radius) ctx.dealDamage(enemy, member, enemy.attack + skill.damageBonus, { magic: true });
          }
        },
      };
      ctx.addTelegraph(telegraph);
    }

    function enemyHeavySlam(enemy, target) {
      const skill = need("enemy", "heavySlam");
      setActionCooldown(enemy);
      enemy.cds.skill = skill.cd;
      enemy.actionLock = skill.cast + ctx.ACTION_GAP;
      const telegraph = {
        type: "circle", x: target.x, y: target.y, radius: skill.radius, team: "enemy", time: skill.cast,
        getPosition: () => ({ x: target.x, y: target.y }),
        resolve: () => {
          const impact = { x: telegraph.x, y: telegraph.y };
          for (const member of ctx.getFieldPartyMembers()) {
            if (!member.dead && ctx.distPoint(member.x, member.y, impact.x, impact.y) <= skill.radius + member.radius) ctx.dealDamage(enemy, member, enemy.attack + skill.damageBonus);
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
      }
      draw.restore();
    }
    function getPanelSkills(player) {
      const attack = need("finald", "attack");
      const heal = need("finald", "heal");
      const shield = need("finald", "shield");
      const ult = need("finald", "ult");
      return [
        { name: attack.name, cd: player.cds.attack || 0, max: attack.cd },
        { name: heal.name, cd: player.cds.heal || 0, max: heal.cd },
        { name: shield.name, cd: player.cds.shield || 0, max: shield.cd },
        { name: ult.name, cd: player.ult < 100 ? 100 - player.ult : 0, max: 100, gauge: true },
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
      startPlayerAim,
      cancelPlayerAim,
      confirmPlayerAim,
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
    };
  }

  window.HEALER_SKILL_DATA = DATA;
  window.createHealerSkillSystem = createHealerSkillSystem;
})();
