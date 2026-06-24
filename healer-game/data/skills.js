(() => {
  "use strict";

  const spatialScale = window.HEALER_CONFIG && Number.isFinite(window.HEALER_CONFIG.battleSpatialScale)
    ? window.HEALER_CONFIG.battleSpatialScale
    : 1;
  const px = (value) => Math.max(1, Math.round(value * spatialScale));
  const rangeLife = (range, speed) => px(range) / Math.max(1, px(speed));

  window.HEALER_SKILL_DATA = {
    finald: {
      attack: {
        id: "shock", key: "attack", owner: "finald", name: "ショック", rank: "D", category: "通常攻撃",
        requiredWeaponItemIds: ["default_a"],
        cd: 6, cast: 1, cost: 15, range: px(200), radius: px(54), burstRadius: px(62),
        damageBase: 16, magicScale: 0.28, color: "#9ef7ff", lines: ["ショック"], damageType: "magic",
        formula: [{ text: "16 + 魔力 * 0.28", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "１秒の詠唱を行った後、指定した範囲内の敵に衝撃を与え、(式=値)の魔法ダメージを与える。",
        simpleDescription: "指定した範囲内の敵に衝撃を与え、魔法ダメージを与える。",
        upgradeDescription: "レベルが上がるごとに基礎ダメージが(1.2/1.4/1.6/1.8/2.0)倍になる",
      },
      heal: {
        id: "heal", key: "heal", owner: "finald", name: "ヒール", rank: "D", category: "スキル",
        requiredWeapons: ["杖", "魔導書", "魔楽器"],
        cd: 6, cast: 2, cost: 20, range: px(300), healBase: 38, magicScale: 0.55, beamColor: "rgba(151,247,255,0.72)", lines: ["ヒール"],
        formula: [{ text: "38 + 魔力 * 0.55", stat: "magic", baseProp: "healBase", scaleProp: "magicScale" }],
        description: "２秒の詠唱を行った後、指定した味方１人の体力を(式=値)回復する。",
        simpleDescription: "詠唱後、指定した味方１人の体力を回復する。",
        upgradeDescription: "レベルが上がるごとに基礎回復量が(1.2/1.4/1.6/1.8/2.0)倍になる",
      },
      shield: {
        id: "shelt", key: "shield", owner: "finald", name: "シェルト", rank: "D", category: "スキル",
        requiredWeapons: ["杖", "魔導書", "魔楽器"],
        cd: 8, cast: 2, cost: 25, range: px(280), shieldBase: 40, magicScale: 0.45, duration: 8, moodGain: 4, lines: ["シェルト"],
        formula: [{ text: "40 + 魔力 * 0.45", stat: "magic", baseProp: "shieldBase", scaleProp: "magicScale" }],
        description: "２秒の詠唱を行った後、指定した味方１人に8秒間持続する(式=値)のシールドを付与する。",
        simpleDescription: "詠唱後、指定した味方１人にシールドを付与する。",
        upgradeDescription: "レベルが上がるごとに基礎シールド量が(1.2/1.4/1.6/1.8/2.0)倍になる",
      },
      take_aim: {
        id: "take_aim", key: "take_aim", owner: "finald", name: "フォーカス", rank: "D", category: "指示",
        conditionText: "アルジュナ",
        cd: 40, cost: 0, range: px(550), duration: 20, target: "enemy", lines: ["フォーカス"],
        description: "指定した敵1体を味方達が狙うようになる。20秒経過するか対象が戦闘不能になるまで続く。",
        simpleDescription: "指定した敵1体を一定時間、味方達が狙うようになる。",
      },
      commandDefend: {
        id: "1_defend", key: "commandDefend", owner: "finald", name: "防御指示", rank: "D", category: "指示",
        conditionText: "アルジュナ",
        cd: 7.5, cost: 0, range: px(480), commandDelta: -1, target: "ally", lines: ["防御指示"],
        description: "指定した味方１人に指示を出し、攻防メーターを防御よりに１つずらす。対象の調子が70%以上だと75%の確率で無視されることがある。",
        simpleDescription: "指定した味方１人に指示を出し、攻防メーターを防御よりに１つずらす。対象の調子が高いと無視されることがある。",
        upgradeDescription: "レベルが上がるごとに無視される確率が-(10/20/30/40/50)%低下する",
      },
      commandAttack: {
        id: "1_attack", key: "commandAttack", owner: "finald", name: "攻撃指示", rank: "D", category: "指示",
        conditionText: "アルジュナ",
        cd: 7.5, cost: 0, range: px(480), commandDelta: 1, target: "ally", lines: ["攻撃指示"],
        description: "指定した味方１人に指示を出し、攻防メーターを攻撃よりに１つずらす。対象の調子が30%以下だと75%の確率で無視されることがある。",
        simpleDescription: "指定した味方１人に指示を出し、攻防メーターを攻撃よりに１つずらす。対象の調子が低いと無視されることがある。",
        upgradeDescription: "レベルが上がるごとに無視される確率が-(10/20/30/40/51)%低下する",
      },
      commandDefendAll: {
        id: "all_defend", key: "commandDefendAll", owner: "finald", name: "防御陣形", rank: "D", category: "指示",
        conditionText: "アルジュナ",
        cd: 20, cost: 0, radius: px(520), commandDelta: -1, target: "allAllies", lines: ["防御陣形"],
        description: "自分を中心とした範囲内の味方全員に指示を出し、攻防メーターを防御よりに１つずらす。対象の調子が70%以上だと75%の確率で無視されることがある。",
        simpleDescription: "自分を中心とした範囲内の味方全員に指示を出し、攻防メーターを防御よりに１つずらす。対象の調子が高いと無視されることがある。",
        upgradeDescription: "レベルが上がるごとに無視される確率が-(10/20/30/40/52)%低下する",
      },
      commandAttackAll: {
        id: "all_attack", key: "commandAttackAll", owner: "finald", name: "攻撃陣形", rank: "D", category: "指示",
        conditionText: "アルジュナ",
        cd: 20, cost: 0, radius: px(520), commandDelta: 1, target: "allAllies", lines: ["攻撃陣形"],
        description: "自分を中心とした範囲内の味方全員に指示を出し、攻防メーターを攻撃よりに１つずらす。対象の調子が30%以下だと75%の確率で無視される。",
        simpleDescription: "自分を中心とした範囲内の味方全員に指示を出し、攻防メーターを攻撃よりに１つずらす。対象の調子が低いと無視されることがある。",
        upgradeDescription: "レベルが上がるごとに無視される確率が-(10/20/30/40/53)%低下する",
      },
      ult: {
        id: "hull_heal", key: "ult", owner: "finald", name: "ストレプション", rank: "D", category: "必殺技",
        requiredWeapons: ["杖", "魔導書", "魔楽器"],
        cast: 5, ultimateCost: 110, costMaxMpRatio: 0.3, healMagicScale: 0.25, healHpBasePercent: 5, healHpThresholdPercent: 50, lines: ["ストレプション"],
        formula: [{ text: "魔力 * 0.25 + 最大HP * (5 + max(0, 50 - HP%))%", type: "strepionHeal" }],
        description: "５秒の詠唱を行った後、味方全員の体力を(式=値)回復する。体力が50%以下だとHPの減少割合に基づいて回復量が上昇する。",
        simpleDescription: "詠唱後、味方全員の体力を回復する。体力が少ないほど回復量が上昇する。",
        upgradeDescription: "レベルが上がるごとに詠唱時間が(0.5/1/1.5/2/2.5)秒短縮され、消費MP量が最大MPの(2/4/6/8/10)%減少する",
      },
    },
    ulpes: {
      attack: {
        id: "speed_slash", key: "attack", owner: "ulpes", name: "ウルペスラッシュ", rank: "D", category: "通常攻撃",
        requiredWeaponItemIds: ["default_u"],
        cd: 6, range: px(52), hitRange: px(62), repeat: 2, repeatDelayMs: 120, damageBase: 8, attackScale: 0.23, lines: ["ウルペスラッシュ"], damageType: "physical",
        formula: [{ text: "8 + 攻撃力 * 0.23", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "指定した対象に(式=値)の切りつけ攻撃を２回行い、物理ダメージを与える。",
        simpleDescription: "指定した対象に２回の切りつけ攻撃を行い、物理ダメージを与える。",
        upgradeDescription: "レベルが上がるごとに基礎ダメージが+(3/6/9/12/15)増加する",
      },
      heroSlash: {
        id: "hero_slash", key: "heroSlash", owner: "ulpes", name: "ウルペススラッシュ", rank: "D", category: "スキル",
        requiredWeapons: ["片手剣"],
        cd: 10, cost: 10, range: px(128), radius: px(120), arcDeg: 200, cast: 0.62, damageBase: 18, attackScale: 0.7, minCdAfterHit: 0, cdRefundPerHit: 0.8, burstRadius: px(116), lines: ["ウルペススラッシュ"], damageType: "physical",
        formula: [{ text: "18 + 攻撃力 * 0.7", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "広い範囲を薙ぎ払い、範囲内の敵に(式=値)の物理ダメージを与える。命中した敵の数が１体ごとにこのスキルのクールタイムを0.8秒短縮する。",
        simpleDescription: "広い範囲を薙ぎ払い、範囲内の敵に物理ダメージを与える。命中した敵の数によってこのスキルのクールタイムを短縮する。",
        upgradeDescription: "レベルが上がるごとにこのスキルが敵に命中した際のクールタイム短縮時間が+(0.3/0.6/0.9/1.2/1.5)秒増加する",
      },
      ult: {
        id: "hero_one_slash", key: "ult", owner: "ulpes", name: "真っ二つ", rank: "D", category: "必殺技",
        requiredWeapons: ["片手剣", "両手剣"],
        cast: 0.7, autoCast: 0.45, radius: px(72), hitRadius: px(70), damageBase: 74, attackScale: 2.1, teleportOffset: px(22), burstRadius: px(84), lines: ["真っ二つ"], damageType: "physical",
        formula: [{ text: "74 + 攻撃力 * 2.1", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "0.7秒のチャージを行った後、最も距離が近い敵の傍に移動し、対象の敵１体に強力な斬撃をお見舞いし、(式=値)の物理ダメージを与える。",
        simpleDescription: "少しのチャージを行い、最も距離が近い敵１体に強力な斬撃をお見舞いし、物理ダメージを与える。",
        upgradeDescription: "レベルが上がるごとにこのスキルで与える攻撃にのみに適用される追加会心率を+(10/20/30/40/50)%獲得する。",
      },
    },
    rihas: {
      attack: {
        id: "huriharai", key: "attack", owner: "rihas", name: "振り払い", rank: "D", category: "通常攻撃",
        requiredWeaponItemIds: ["default_r"],
        cd: 6, range: px(65), radius: px(65), cast: 0, damageBase: 20, attackScale: 0.53, burstRadius: px(72), lines: ["振り払い"], damageType: "physical",
        formula: [{ text: "20 + 攻撃力 * 0.53", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "周囲を振り払い、自身を中心とした一定範囲内の敵に(式=値)の物理ダメージを与える。",
        simpleDescription: "周囲を振り払い、範囲内の敵に物理ダメージを与える。",
        upgradeDescription: "レベルが上がるごとに基礎ダメージが(1.2/1.4/1.6/1.8/2.0)倍になる",
      },
      lan_wave: {
        id: "lan_wave", key: "lan_wave", owner: "rihas", name: "ランウェーブ", rank: "D", category: "スキル",
        requiredWeapons: ["拳具", "棒具"],
        cd: 13, cost: 15, range: px(260), radius: px(90), shockRadius: px(180), cast: 1, landingOffset: px(18), damageBase: 22, attackScale: 0.8, shockDamageBase: 10, shockMagicScale: 0.2, burstRadius: px(170), approach: true, lines: ["ランウェーブ"], damageType: "mixed",
        formula: [
          { text: "22 + 攻撃力 * 0.8", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" },
          { text: "10 + 魔力 * 0.2", stat: "magic", baseProp: "shockDamageBase", scaleProp: "shockMagicScale" },
        ],
        description: "１秒のチャージを行った後、対象の敵の傍にジャンプする。着地地点の周囲の敵に(式=値)の物理ダメージを与える。さらに、広い範囲に(式=値)の魔法ダメージを与える衝撃波を放つ。",
        simpleDescription: "少しのチャージを行い、対象の敵の傍にジャンプする。着地時の周囲の敵に物理ダメージを与え、魔法ダメージを与える衝撃波を放つ。",
        upgradeDescription: "レベルが上がるごとに衝撃波のダメージが発動キャラの攻撃力の(8/16/24/32/40)%分の追加ダメージを与える",
      },
      ult: {
        id: "taunt_shield", key: "ult", owner: "rihas", name: "まとめてかかってこい", rank: "D", category: "必殺技", ultimateCost: 100, radius: px(380), duration: 5.5, targetLimit: 8, shieldHpRatio: 0.05, burstExtraRadius: px(10), lines: ["まとめてかかってこい"], statusIds: ["debuff_taunt"],
        requiredWeapons: ["拳具"],
        formula: [{ text: "最大HP * 5% * 命中数", type: "rihasTauntShield" }],
        description: "最大８体の周囲の敵に\"挑発\"を付与する。挑発を与えた敵１体につき、(式=値)のシールドを獲得する。",
        simpleDescription: "周囲の敵に\"挑発\"を付与し、挑発を与えた敵の数に応じてシールドを獲得する。",
        upgradeDescription: "レベルが上がるごとに付与する\"挑発\"の効果時間が+(0.5/1/1.5/2/3)秒増加する。さらに、獲得するシールドの継続時間が+(0.5/1/1.5/2/3)秒増加する",
      },
    },
    sushia: {
      attack: {
        id: "masic_shot", key: "attack", owner: "sushia", name: "魔力弾", rank: "D", category: "通常攻撃",
        requiredWeaponItemIds: ["default_s"],
        cd: 6, cost: 20, range: px(340), cast: 1, projectileCount: 1, spread: 0, lineWidth: px(16), projectileSpeed: px(360), projectileRadius: px(5), damageBase: 15, magicScale: 0.45, life: rangeLife(340, 360), color: "#d9afff", lines: ["魔力弾"], damageType: "magic",
        formula: [{ text: "15 + 魔力 * 0.45", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "１秒の詠唱を行った後、魔力で生成した弾を発射する。当たった敵に(式=値)の魔法ダメージを与える。魔力弾は敵に当たるか最大射程まで飛ぶと消滅する。",
        simpleDescription: "詠唱後、魔力で生成された弾を発射する。",
        upgradeDescription: "レベルが上がるごとに魔力弾が敵を(1/2/3/4/5)体貫通するようになる",
      },
      bomb: {
        id: "bomber", key: "bomb", owner: "sushia", name: "ボンバー", rank: "D", category: "スキル",
        requiredWeapons: ["杖", "魔導書", "魔楽器"],
        cd: 15, cost: 40, range: px(400), cast: 3, radius: px(150), damageBase: 32, magicScale: 0.9, distanceFalloffMax: 0.8, burstRadius: px(154), lines: ["ボンバー"], damageType: "magic",
        formula: [{ text: "32 + 魔力 * 0.9", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "３秒の詠唱を行った後、対象を中心とした一定範囲内の敵に(式=値)の魔法ダメージを与える爆発を引き起こす。爆発の中心から離れているユニットほど受けるダメージが低下する。",
        simpleDescription: "詠唱後、対象を中心に周囲の敵も巻き込む爆発を引き起こし、魔法ダメージを与える。中心から離れている敵ほどダメージが低下する。",
        upgradeDescription: "レベルが上がるごとに中心からの距離によるダメージの低下量が元の約(87/75/62/50/37)%にまで減少する",
      },
      fire: {
        id: "fire", key: "fire", owner: "sushia", name: "ファイア", rank: "D", category: "スキル",
        requiredWeapons: ["杖", "魔導書", "魔楽器"],
        cd: 14, cost: 40, range: px(450), cast: 3, damageBase: 30, magicScale: 0.55, burnDuration: 3, burnDamageHpRatio: 0.01, burnTickRate: 1, beamColor: "rgba(255,139,67,0.74)", burstRadius: px(44), lines: ["チャッカ"], damageType: "magic", statusIds: ["debuff_burn"],
        formula: [{ text: "30 + 魔力 * 0.55", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "３秒の詠唱を行った後、対象の敵１体に炎を放ち、(式=値)の魔法ダメージを与え、3秒の\"燃焼\"を付与する。",
        simpleDescription: "詠唱後、対象の敵１体に炎を放ち、魔法ダメージを与え、\"燃焼\"を付与する。",
        upgradeDescription: "レベルが上がるごとに付与する\"燃焼\"の効果時間が+(1/2/3/4/5)秒増加する",
      },
      ult: {
        id: "ice_word", key: "ult", owner: "sushia", name: "アイスワールド", rank: "D", category: "必殺技", ultimateCost: 130, cast: 5, autoCast: 5, radius: px(330), manualRadiusBonus: 0,
        requiredWeapons: ["杖", "魔導書", "魔楽器"],
        duration: 8, autoDuration: 8, tickRate: 1, falloffMin: 0.5,
        freezeEnemy: 5, freezeAlly: 5, autoFreezeAlly: 5,
        damageBase: 8, magicScale: 0.18, lines: ["アイスワールド"], damageType: "magic", statusIds: ["debuff_freeze"],
        formula: [{ text: "8 + 魔力 * 0.18", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "５秒の詠唱を行った後、８秒の間、周囲の広い範囲を氷で覆いつくす。氷に触れた敵には最大５秒の\"凍結\"を付与する。氷に触れている敵は毎秒(式=値)の魔法ダメージを受け続ける。中心から離れている敵ほどダメージと凍結の効果時間が弱くなる。",
        simpleDescription: "詠唱後、一定時間の間、周囲の広い範囲を氷で覆いつくす。氷に触れた敵には\"凍結\"を付与する。氷に触れている敵は魔法ダメージを受け続ける。中心から離れている敵ほど効果が弱くなる。",
        upgradeDescription: "レベルが上がるごとに付与する\"凍結\"の効果時間が+(1/2/3/4/5)秒増加する",
      },
    },
    enemy: {
      attack: { id: "enemy_attack", key: "attack", owner: "enemy", name: "通常攻撃", cd: 5, bruteRange: px(48), eliteRange: px(58), cast: 0.32, radius: px(42), damageBonus: 8 },
      casterLine: { id: "enemy_caster_line", key: "casterLine", owner: "enemy", name: "射撃線", cdBase: 12, cdRandom: 0, cast: 2, aimLockBeforeFire: 1.3, length: px(620), width: px(26), hitWidth: px(18), damageBonus: 17 },
      heavySlam: { id: "enemy_heavy_slam", key: "heavySlam", owner: "enemy", name: "ヘビースラム", cd: 17, cast: 0.95, radius: px(98), damageBonus: 20, burstRadius: px(110) },
    },
  };

  const skillData = window.HEALER_SKILL_DATA;
  const skillWeaponTypesByOwner = {
    finald: ["魔導書", "魔楽器"],
    ulpes: ["片手剣", "両手剣"],
    rihas: ["拳具", "棒具"],
    sushia: ["杖", "魔導書", "棒具"],
  };
  window.HEALER_SKILL_WEAPON_TYPES_BY_OWNER = skillWeaponTypesByOwner;

  function addSkillAlias(targetOwner, aliasKey, sourceOwner, sourceKey) {
    if (!skillData[targetOwner] || !skillData[sourceOwner] || !skillData[sourceOwner][sourceKey] || skillData[targetOwner][aliasKey]) {
      return;
    }
    skillData[targetOwner][aliasKey] = {
      ...skillData[sourceOwner][sourceKey],
      key: aliasKey,
      owner: targetOwner,
      sourceOwner,
      sourceKey,
    };
  }

  for (const [targetOwner, weaponTypes] of Object.entries(skillWeaponTypesByOwner)) {
    for (const [sourceOwner, skills] of Object.entries(skillData)) {
      for (const [sourceKey, skill] of Object.entries(skills || {})) {
        if (!skill || skill.category !== "スキル" || !Array.isArray(skill.requiredWeapons)) {
          continue;
        }
        if (skill.requiredWeapons.some((weaponType) => weaponTypes.includes(weaponType))) {
          addSkillAlias(targetOwner, sourceKey, sourceOwner, sourceKey);
        }
      }
    }
  }

  window.HEALER_PASSIVE_DATA = {
    finald: {
      hilment: { id: "hilment_passive", key: "hilment", owner: "finald", name: "ヒルメント", selfHealRatio: 0.3, description: "味方に与えた回復効果の30%分、自身の体力を回復する。味方の体力を超過した回復効果はこの効果に含まれない。", simpleDescription: "味方に与えた回復効果の一部を自身の体力を回復する。" },
    },
    ulpes: {
      swordwork: { id: "hero_critical_passive", key: "swordwork", owner: "ulpes", name: "慣れた剣捌き", description: "会心率が2倍になる。代わりに会心ダメージが半分減少する。", simpleDescription: "会心率が増加する。代わりに会心ダメージが低下する" },
    },
    rihas: {
      painless: { id: "damage_dot_passive", key: "painless", owner: "rihas", name: "痛みなし", statusIds: ["buff_itaminasi"], description: "受けるダメージの1/3を5分割にし、1秒ごとの遅延ダメージで受ける。遅延ダメージは最低1ダメージ。HPが減るたびに３秒間持続する\"逆境\"を１スタック獲得する。", simpleDescription: "受けるダメージの一部を分割して受ける\nHPが減るたびに\"逆境\"を獲得する" },
    },
    sushia: {
      warmup: { id: "warmup_passive", key: "warmup", owner: "sushia", name: "あったまってきたよ！", statusIds: ["buff_warmup"], description: "敵に魔法ダメージを与えるたびに８秒間持続する\"ウォームアップ\"を１スタック獲得する。", simpleDescription: "敵に魔法ダメージを与えるたびに\"ウォームアップ\"を獲得する。" },
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
        ultimate: "ult",
        active: ["attack", "heal", "shield", "take_aim", "commandDefend", "commandAttack", "commandDefendAll", "commandAttackAll"],
      },
      ulpes: { passive: "swordwork", ultimate: "ult", active: ["attack", "heroSlash"] },
      rihas: { passive: "painless", ultimate: "ult", active: ["attack", "lan_wave"] },
      sushia: { passive: "warmup", ultimate: "ult", active: ["attack", "fire"] },
      enemy: { passive: null, active: ["attack", "casterLine", "heavySlam"] },
    },
  };
})();
