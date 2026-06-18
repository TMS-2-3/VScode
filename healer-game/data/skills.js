(() => {
  "use strict";

  const spatialScale = window.HEALER_CONFIG && Number.isFinite(window.HEALER_CONFIG.battleSpatialScale)
    ? window.HEALER_CONFIG.battleSpatialScale
    : 1;
  const px = (value) => Math.max(1, Math.round(value * spatialScale));

  window.HEALER_SKILL_DATA = {
    finald: {
      attack: { id: "finald_attack", key: "attack", owner: "finald", name: "援護射撃", cd: 5, cast: 1, cost: 6, range: px(200), radius: px(54), burstRadius: px(62), damageBase: 16, magicScale: 0.28, color: "#9ef7ff", lines: ["援護します"] },
      heal: { id: "finald_heal", key: "heal", owner: "finald", name: "ヒール", cd: 6, cast: 2, cost: 18, range: px(300), healBase: 38, magicScale: 0.55, beamColor: "rgba(151,247,255,0.72)", lines: ["ヒール!", "回復!"] },
      shield: { id: "finald_shield", key: "shield", owner: "finald", name: "バリア", cd: 8, cast: 2, cost: 24, range: px(280), radius: px(92), shieldBase: 40, magicScale: 0.45, duration: 6, moodGain: 4, lines: ["バリア展開!", "守るよ!"] },
      commandDefend: { id: "finald_command_defend", key: "commandDefend", owner: "finald", name: "防御指示", cd: 7.5, cost: 0, range: px(480), commandDelta: -1, target: "ally", lines: ["下がって!"] },
      commandAttack: { id: "finald_command_attack", key: "commandAttack", owner: "finald", name: "攻撃指示", cd: 7.5, cost: 0, range: px(480), commandDelta: 1, target: "ally", lines: ["攻めて!"] },
      commandDefendAll: { id: "finald_command_defend_all", key: "commandDefendAll", owner: "finald", name: "防御陣形", cd: 20, cost: 0, radius: px(520), commandDelta: -1, target: "allAllies", lines: ["みんな下がって!"] },
      commandAttackAll: { id: "finald_command_attack_all", key: "commandAttackAll", owner: "finald", name: "攻撃陣形", cd: 20, cost: 0, radius: px(520), commandDelta: 1, target: "allAllies", lines: ["みんな攻めて!"] },
      ult: { id: "finald_ult", key: "ult", owner: "finald", name: "フルヒール", cast: 3, baseHealRatio: 0.25, missingHealRatio: 0.3, lines: ["フルヒール!!"] },
    },
    ulpes: {
      attack: { id: "ulpes_attack", key: "attack", owner: "ulpes", name: "通常攻撃", cd: 2.5, range: px(52), hitRange: px(62), repeat: 3, repeatDelayMs: 120, damageBase: 8, attackScale: 0.38, lines: ["てやっ!", "くらえ!"] },
      heroSlash: { id: "ulpes_hero_slash", key: "heroSlash", owner: "ulpes", name: "ヒーロースラッシュ", cd: 10, range: px(128), radius: px(122), arcDeg: 200, cast: 0.62, damageBase: 18, attackScale: 0.7, minCdAfterHit: 1.5, cdRefundPerHit: 0.5, burstRadius: px(116), lines: ["ヒーロースラッシュ!!"] },
      ult: { id: "ulpes_ult", key: "ult", owner: "ulpes", name: "正義の一撃", cast: 0.7, autoCast: 0.45, radius: px(72), hitRadius: px(70), damageBase: 74, attackScale: 1.4, teleportOffset: px(22), burstRadius: px(84), lines: ["正義の一撃!!"] },
    },
    rihas: {
      attack: { id: "rihas_attack", key: "attack", owner: "rihas", name: "台地揺るがす拳", cd: 2.5, range: px(75), radius: px(66), cast: 0.38, damageBase: 16, attackScale: 0.55, burstRadius: px(72), lines: ["どりゃぁ!", "しねぇ!"] },
      quake: { id: "rihas_quake", key: "quake", owner: "rihas", name: "台地よ!揺れよ!", cd: 13, range: px(260), radius: px(92), shockRadius: px(160), cast: 0.82, landingOffset: px(18), damageBase: 22, attackScale: 0.8, shockDamageBase: 10, shockAttackScale: 0.25, burstRadius: px(158), approach: true, lines: ["台地よ!揺れよ!"] },
      ult: { id: "rihas_ult", key: "ult", owner: "rihas", name: "俺ァ無敵!!", radius: px(350), duration: 5.5, shieldBase: 25, shieldPerTarget: 8, burstExtraRadius: px(10), lines: ["相手してやる"] },
    },
    sushia: {
      attack: { id: "sushia_attack", key: "attack", owner: "sushia", name: "拡散弾", cd: 2.5, range: px(340), cast: 1, projectileCount: 3, spread: 0.08, lineWidth: px(16), projectileSpeed: px(360), projectileRadius: px(5), damageBase: 10, magicScale: 0.35, life: 1.4, color: "#d9afff", lines: ["とうっ!", "拡散弾!"] },
      bomb: { id: "sushia_bomb", key: "bomb", owner: "sushia", name: "インパクトボム", cd: 15, range: px(430), cast: 3, radius: px(108), innerRadius: px(32), nearDamageBase: 32, nearMagicScale: 0.95, farDamageBase: 16, farMagicScale: 0.48, burstRadius: px(118), lines: ["インパクトボム!!"] },
      ult: {
        id: "sushia_ult", key: "ult", owner: "sushia", name: "アイスワールド",
        cast: 5, autoCast: 3.5, radius: px(330), manualRadiusBonus: px(50),
        duration: 4.2, autoDuration: 2.6, tickRate: 0.4,
        freezeEnemy: 3, freezeAlly: 1, autoFreezeAlly: 3,
        damageBase: 8, magicScale: 0.22, lines: ["全部凍っちゃえ!!"],
      },
    },
    enemy: {
      attack: { id: "enemy_attack", key: "attack", owner: "enemy", name: "通常攻撃", cd: 5, bruteRange: px(48), eliteRange: px(58), cast: 0.32, radius: px(42), damageBonus: 8 },
      casterLine: { id: "enemy_caster_line", key: "casterLine", owner: "enemy", name: "射撃線", cdBase: 12, cdRandom: 0, cast: 0.86, length: px(620), width: px(26), hitWidth: px(18), damageBonus: 17 },
      heavySlam: { id: "enemy_heavy_slam", key: "heavySlam", owner: "enemy", name: "ヘビースラム", cd: 17, cast: 0.95, radius: px(98), damageBonus: 20, burstRadius: px(110) },
    },
  };

  window.HEALER_PASSIVE_DATA = {
    finald: {
      hilment: { id: "finald_passive_hilment", key: "hilment", owner: "finald", name: "ヒルメント", selfHealRatio: 0.3 },
    },
    ulpes: {
      swordwork: { id: "ulpes_passive_swordwork", key: "swordwork", owner: "ulpes", name: "勇者の剣捌き" },
    },
    rihas: {
      painless: { id: "rihas_passive_painless", key: "painless", owner: "rihas", name: "痛みなし" },
    },
    sushia: {
      warmup: { id: "sushia_passive_warmup", key: "warmup", owner: "sushia", name: "あったまってきたよ！" },
    },
  };

  window.HEALER_LOADOUT_CONFIG = {
    passiveSlots: 1,
    activeSlots: 5,
    activeSlotsByOwner: {
      finald: 10,
    },
    defaults: {
      finald: {
        passive: "hilment",
        active: ["attack", "heal", "shield", "commandDefend", "commandAttack", "commandDefendAll", "commandAttackAll"],
      },
      ulpes: { passive: "swordwork", active: ["attack", "heroSlash"] },
      rihas: { passive: "painless", active: ["attack", "quake"] },
      sushia: { passive: "warmup", active: ["attack", "bomb"] },
      enemy: { passive: null, active: ["attack", "casterLine", "heavySlam"] },
    },
  };
})();