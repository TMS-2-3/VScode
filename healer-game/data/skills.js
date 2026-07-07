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
        id: "shock", key: "attack", owner: "finald", name: "ショック", rank: "D", category: "通常攻撃", skillType: "範囲攻撃",
        requiredWeaponItemIds: ["default_a"],
        cd: 2, cast: 1, cost: 15, range: px(200), radius: px(54), burstRadius: px(62),
        damageBase: 16, magicScale: 0.28, color: "#9ef7ff", lines: ["ショック"], damageType: "magic",
        formula: [{ text: "16 + 魔力 * 0.28", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "１秒の詠唱を行った後、指定した範囲内の敵に衝撃を与え、(式=値)の魔法ダメージを与える。",
        simpleDescription: "指定した範囲内の敵に衝撃を与え、魔法ダメージを与える。",
        upgradeSimpleDescription: "レベルが上がるごとにダメージが上昇する",
        upgradeDescription: "レベルが上がるごとに基礎ダメージが(1.2/1.4/1.6/1.8/2.0)倍になる",
      },
      heal: {
        id: "heal", key: "heal", owner: "finald", name: "ヒール", rank: "D", category: "スキル", skillType: "単体回復",
        requiredWeapons: ["杖", "魔導書", "楽器"],
        cd: 6, cast: 2, cost: 20, range: px(300), healBase: 38, magicScale: 0.55, beamColor: "rgba(151,247,255,0.72)", lines: ["ヒール"],
        formula: [{ text: "38 + 魔力 * 0.55", stat: "magic", baseProp: "healBase", scaleProp: "magicScale" }],
        description: "２秒の詠唱を行った後、指定した味方１人の体力を(式=値)回復する。",
        simpleDescription: "詠唱後、指定した味方１人の体力を回復する。",
        upgradeSimpleDescription: "レベルが上がるごとに回復量が上昇する",
        upgradeDescription: "レベルが上がるごとに基礎回復量が(1.2/1.4/1.6/1.8/2.0)倍になる",
      },
      shield: {
        id: "shelt", key: "shield", owner: "finald", name: "シェルト", rank: "D", category: "スキル", skillType: "単体シールド",
        requiredWeapons: ["杖", "魔導書", "楽器"],
        cd: 8, cast: 2, cost: 25, range: px(280), shieldBase: 40, magicScale: 0.45, duration: 8, lines: ["シェルト"],
        formula: [{ text: "40 + 魔力 * 0.45", stat: "magic", baseProp: "shieldBase", scaleProp: "magicScale" }],
        description: "２秒の詠唱を行った後、指定した味方１人に8秒間持続する(式=値)のシールドを付与する。",
        simpleDescription: "詠唱後、指定した味方１人にシールドを付与する。",
        upgradeSimpleDescription: "レベルが上がるごとにシールド量が上昇する",
        upgradeDescription: "レベルが上がるごとに基礎シールド量が(1.2/1.4/1.6/1.8/2.0)倍になる",
      },
      take_aim: {
        id: "take_aim", key: "take_aim", owner: "finald", name: "フォーカス", rank: "D", category: "指示", skillType: "対象指示",
        conditionText: "アルジュナ",
        cd: 40, cost: 0, range: px(550), duration: 15, target: "enemy", focusIgnoreBase: 0.7, lines: ["フォーカス"],
        description: "指定した敵1体を味方達が狙うようになる。15秒経過するか対象が戦闘不能になるまで続く。調子70%以上、もしくは30%以下の味方は70%の確率で無視する。",
        simpleDescription: "指定した敵1体を一定時間、味方達が狙うようになる。",
        upgradeSimpleDescription: "レベルが上がるごとに無視される確率が低下する",
        upgradeDescription: "レベルが上がるごとに無視される確率が-(10/20/30/40/50)%低下する",
      },
      distance: {
        id: "distance", key: "distance", owner: "finald", name: "ディスタンス", rank: "D", category: "スキル", skillType: "全体指示",
        conditionText: "アルジュナ",
        cd: 20, cost: 0, range: px(400), duration: 8, target: "enemy", avoidTarget: true, lines: ["ディスタンス"],
        description: "８秒間、対象の敵を味方がターゲットにしなくなる。範囲攻撃などの巻き込みは発生する。",
        simpleDescription: "一定時間、対象の敵を味方が狙わなくなる。",
        upgradeSimpleDescription: "レベルが上がるごとにスキルのクールタイムが短くなる",
        upgradeDescription: "レベルが上がるごとにスキルのクールタイムが(2/4/6/8/10)秒短縮される",
      },
      commandDefend: {
        id: "1_defend", key: "commandDefend", owner: "finald", name: "防御指示", rank: "D", category: "指示", skillType: "対象指示",
        conditionText: "アルジュナ",
        cd: 7.5, cost: 0, range: px(480), commandDelta: -1, target: "ally", lines: ["防御指示"],
        description: "指定した味方１人に指示を出し、攻防メーターを防御よりに１つずらす。対象の調子が70%以上だと75%の確率で無視されることがある。",
        simpleDescription: "指定した味方１人に指示を出し、攻防メーターを防御よりに１つずらす。対象の調子が高いと無視されることがある。",
        upgradeSimpleDescription: "レベルが上がるごとに無視される確率が低下する",
        upgradeDescription: "レベルが上がるごとに無視される確率が-(10/20/30/40/50)%低下する",
      },
      commandAttack: {
        id: "1_attack", key: "commandAttack", owner: "finald", name: "攻撃指示", rank: "D", category: "指示", skillType: "対象指示",
        conditionText: "アルジュナ",
        cd: 7.5, cost: 0, range: px(480), commandDelta: 1, target: "ally", lines: ["攻撃指示"],
        description: "指定した味方１人に指示を出し、攻防メーターを攻撃よりに１つずらす。対象の調子が30%以下だと75%の確率で無視されることがある。",
        simpleDescription: "指定した味方１人に指示を出し、攻防メーターを攻撃よりに１つずらす。対象の調子が低いと無視されることがある。",
        upgradeSimpleDescription: "レベルが上がるごとに無視される確率が低下する",
        upgradeDescription: "レベルが上がるごとに無視される確率が-(10/20/30/40/50)%低下する",
      },
      commandDefendAll: {
        id: "all_defend", key: "commandDefendAll", owner: "finald", name: "防御陣形", rank: "D", category: "指示", skillType: "範囲指示",
        conditionText: "アルジュナ",
        cd: 20, cost: 0, radius: px(520), commandDelta: -1, target: "allAllies", lines: ["防御陣形"],
        description: "自分を中心とした範囲内の味方全員に指示を出し、攻防メーターを防御よりに１つずらす。対象の調子が70%以上だと75%の確率で無視されることがある。",
        simpleDescription: "自分を中心とした範囲内の味方全員に指示を出し、攻防メーターを防御よりに１つずらす。対象の調子が高いと無視されることがある。",
        upgradeSimpleDescription: "レベルが上がるごとに無視される確率が低下する",
        upgradeDescription: "レベルが上がるごとに無視される確率が-(10/20/30/40/50)%低下する",
      },
      commandAttackAll: {
        id: "all_attack", key: "commandAttackAll", owner: "finald", name: "攻撃陣形", rank: "D", category: "指示", skillType: "範囲指示",
        conditionText: "アルジュナ",
        cd: 20, cost: 0, radius: px(520), commandDelta: 1, target: "allAllies", lines: ["攻撃陣形"],
        description: "自分を中心とした範囲内の味方全員に指示を出し、攻防メーターを攻撃よりに１つずらす。対象の調子が30%以下だと75%の確率で無視される。",
        simpleDescription: "自分を中心とした範囲内の味方全員に指示を出し、攻防メーターを攻撃よりに１つずらす。対象の調子が低いと無視されることがある。",
        upgradeSimpleDescription: "レベルが上がるごとに無視される確率が低下する",
        upgradeDescription: "レベルが上がるごとに無視される確率が-(10/20/30/40/50)%低下する",
      },
      ult: {
        id: "hull_heal", key: "ult", owner: "finald", name: "ストレプション", rank: "D", category: "必殺技", skillType: "全体回復",
        requiredWeapons: ["杖", "魔導書", "楽器"],
        cast: 5, ultimateCost: 110, costMaxMpRatio: 0.3, healMagicScale: 0.25, healHpBasePercent: 5, healHpThresholdPercent: 50, lines: ["ストレプション"],
        formula: [{ text: "魔力 * 0.25 + 最大HP * (5 + max(0, 50 - HP%))%", type: "strepionHeal" }],
        description: "５秒の詠唱を行った後、味方全員の体力を(式=値)回復する。体力が50%以下だとHPの減少割合に基づいて回復量が上昇する。",
        simpleDescription: "詠唱後、味方全員の体力を回復する。体力が少ないほど回復量が上昇する。",
        upgradeSimpleDescription: "レベルが上がるごとに詠唱時間と消費MP量が減少する",
        upgradeDescription: "レベルが上がるごとに詠唱時間が(0.5/1/1.5/2/2.5)秒短縮され、消費MP量が最大MPの(2/4/6/8/10)%減少する",
      },
    },
    ulpes: {
      attack: {
        id: "speed_slash", key: "attack", owner: "ulpes", name: "ウルペスラッシュ", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        requiredWeaponItemIds: ["default_u"],
        cd: 2, range: px(52), hitRange: px(62), repeat: 2, repeatDelayMs: 120, damageBase: 8, attackScale: 0.23, lines: ["ウルペスラッシュ"], damageType: "physical",
        formula: [{ text: "8 + 攻撃力 * 0.23", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "指定した対象に(式=値)の切りつけ攻撃を２回行い、物理ダメージを与える。",
        simpleDescription: "指定した対象に２回の切りつけ攻撃を行い、物理ダメージを与える。",
        upgradeSimpleDescription: "レベルが上がるごとにダメージが上昇する",
        upgradeDescription: "レベルが上がるごとに基礎ダメージが+(3/6/9/12/15)増加する",
      },
      heroSlash: {
        id: "hero_slash", key: "heroSlash", owner: "ulpes", name: "ウルペススラッシュ", rank: "D", category: "スキル", skillType: "範囲攻撃",
        requiredWeapons: ["両手剣"],
        cd: 10, cost: 10, range: px(128), radius: px(120), arcDeg: 200, cast: 0.62, damageBase: 18, attackScale: 0.7, minCdAfterHit: 0, cdRefundPerHit: 0.8, burstRadius: px(116), lines: ["ウルペススラッシュ"], damageType: "physical",
        formula: [{ text: "18 + 攻撃力 * 0.7", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "広い範囲を薙ぎ払い、範囲内の敵に(式=値)の物理ダメージを与える。命中した敵の数が１体ごとにこのスキルのクールタイムを0.8秒短縮する。",
        simpleDescription: "広い範囲を薙ぎ払い、範囲内の敵に物理ダメージを与える。命中した敵の数によってこのスキルのクールタイムを短縮する。",
        upgradeSimpleDescription: "レベルが上がるごとにこのスキルが敵に命中した際のクールタイムの短縮時間が増加する",
        upgradeDescription: "レベルが上がるごとにこのスキルが敵に命中した際のクールタイム短縮時間が+(0.3/0.6/0.9/1.2/1.5)秒増加する",
      },
      ult: {
        id: "hero_one_slash", key: "ult", owner: "ulpes", name: "真っ二つ", rank: "D", category: "必殺技", skillType: "単体攻撃",
        requiredWeapons: ["両手剣"],
        cast: 0.7, autoCast: 0.45, radius: px(72), hitRadius: px(70), damageBase: 74, attackScale: 2.1, teleportOffset: px(22), burstRadius: px(84), lines: ["真っ二つ"], damageType: "physical",
        formula: [{ text: "74 + 攻撃力 * 2.1", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "0.7秒のチャージを行った後、最も距離が近い敵の傍に移動し、対象の敵１体に強力な斬撃をお見舞いし、(式=値)の物理ダメージを与える。",
        simpleDescription: "少しのチャージを行い、最も距離が近い敵１体に強力な斬撃をお見舞いし、物理ダメージを与える。",
        upgradeSimpleDescription: "レベルが上がるごとにこのスキルで与える攻撃の会心率が上昇する",
        upgradeDescription: "レベルが上がるごとにこのスキルで与える攻撃にのみに適用される追加会心率を+(10/20/30/40/50)%獲得する。",
      },
    },
    rihas: {
      attack: {
        id: "huriharai", key: "attack", owner: "rihas", name: "振り払い", rank: "D", category: "通常攻撃", skillType: "範囲攻撃",
        requiredWeaponItemIds: ["default_r"],
        cd: 2, range: px(65), radius: px(65), cast: 0, damageBase: 20, attackScale: 0.53, burstRadius: px(72), lines: ["振り払い"], damageType: "physical",
        formula: [{ text: "20 + 攻撃力 * 0.53", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "周囲を振り払い、自身を中心とした一定範囲内の敵に(式=値)の物理ダメージを与える。",
        simpleDescription: "周囲を振り払い、範囲内の敵に物理ダメージを与える。",
        upgradeSimpleDescription: "レベルが上がるごとにダメージが上昇する",
        upgradeDescription: "レベルが上がるごとに基礎ダメージが(1.2/1.4/1.6/1.8/2.0)倍になる",
      },
      lan_wave: {
        id: "lan_wave", key: "lan_wave", owner: "rihas", name: "ランウェーブ", rank: "D", category: "スキル", skillType: "範囲攻撃",
        requiredWeapons: ["拳具", "棒具"],
        cd: 13, cost: 15, range: px(260), radius: px(90), shockRadius: px(180), cast: 1, landingOffset: px(18), damageBase: 22, attackScale: 0.8, shockDamageBase: 10, shockMagicScale: 0.2, burstRadius: px(170), approach: true, lines: ["ランウェーブ"], damageType: "mixed",
        formula: [
          { text: "22 + 攻撃力 * 0.8", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" },
          { text: "10 + 魔力 * 0.2", stat: "magic", baseProp: "shockDamageBase", scaleProp: "shockMagicScale" },
        ],
        description: "１秒のチャージを行った後、対象の敵の傍にジャンプする。着地地点の周囲の敵に(式=値)の物理ダメージを与える。さらに、広い範囲に(式=値)の魔法ダメージを与える衝撃波を放つ。",
        simpleDescription: "少しのチャージを行い、対象の敵の傍にジャンプする。着地時の周囲の敵に物理ダメージを与え、魔法ダメージを与える衝撃波を放つ。",
        upgradeSimpleDescription: "レベルが上がるごとに衝撃波のダメージが上昇する",
        upgradeDescription: "レベルが上がるごとに衝撃波のダメージが発動キャラの攻撃力の(8/16/24/32/40)%分の追加ダメージを与える",
      },
      ult: {
        id: "taunt_shield", key: "ult", owner: "rihas", name: "まとめてかかってこい", rank: "D", category: "必殺技", skillType: "範囲デバフ", ultimateCost: 100, radius: px(380), duration: 5.5, targetLimit: 8, shieldHpRatio: 0.05, burstExtraRadius: px(10), lines: ["まとめてかかってこい"], statusIds: ["debuff_taunt"],
        requiredWeapons: ["拳具"],
        formula: [{ text: "最大HP * 5% * 命中数", type: "rihasTauntShield" }],
        description: "最大８体の周囲の敵に\"挑発\"を付与する。挑発を与えた敵１体につき、(式=値)のシールドを獲得する。",
        simpleDescription: "周囲の敵に\"挑発\"を付与し、挑発を与えた敵の数に応じてシールドを獲得する。",
        upgradeSimpleDescription: "レベルが上がるごとに付与する\"挑発\"の効果時間が増加する\nさらに、獲得するシールドの継続時間も増加する",
        upgradeDescription: "レベルが上がるごとに付与する\"挑発\"の効果時間が+(0.5/1/1.5/2/3)秒増加する\nさらに、獲得するシールドの継続時間が+(0.5/1/1.5/2/3)秒増加する",
      },
    },
    sushia: {
      attack: {
        id: "masic_shot", key: "attack", owner: "sushia", name: "魔力弾", rank: "D", category: "通常攻撃", skillType: "方向指定攻撃",
        requiredWeaponItemIds: ["default_s"],
        cd: 2, cost: 20, range: px(340), cast: 1, projectileCount: 1, spread: 0, lineWidth: px(16), projectileSpeed: px(360), projectileRadius: px(5), damageBase: 15, magicScale: 0.45, life: rangeLife(340, 360), color: "#d9afff", lines: ["魔力弾"], damageType: "magic",
        formula: [{ text: "15 + 魔力 * 0.45", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "１秒の詠唱を行った後、魔力で生成した弾を発射する。当たった敵に(式=値)の魔法ダメージを与える。魔力弾は敵に当たるか最大射程まで飛ぶと消滅する。",
        simpleDescription: "詠唱後、魔力で生成された弾を発射する。",
        upgradeSimpleDescription: "レベルが上がるごとに魔力弾が敵を貫通しやすくなる",
        upgradeDescription: "レベルが上がるごとに魔力弾が敵を(1/2/3/4/5)体貫通するようになる",
      },
      bomb: {
        id: "bomber", key: "bomb", owner: "sushia", name: "ボンバー", rank: "D", category: "スキル", skillType: "範囲攻撃",
        requiredWeapons: ["杖", "魔導書", "楽器"],
        cd: 15, cost: 40, range: px(400), cast: 3, radius: px(150), damageBase: 32, magicScale: 0.9, distanceFalloffMax: 0.8, burstRadius: px(154), lines: ["ボンバー"], damageType: "magic",
        formula: [{ text: "32 + 魔力 * 0.9", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "３秒の詠唱を行った後、対象を中心とした一定範囲内の敵に(式=値)の魔法ダメージを与える爆発を引き起こす。爆発の中心から離れているユニットほど受けるダメージが低下する。",
        simpleDescription: "詠唱後、対象を中心に周囲の敵も巻き込む爆発を引き起こし、魔法ダメージを与える。中心から離れている敵ほどダメージが低下する。",
        upgradeSimpleDescription: "レベルが上がるごとに中心からの距離によるダメージの低下量が減少する",
        upgradeDescription: "レベルが上がるごとに中心からの距離によるダメージの低下量が元の約(87/75/62/50/37)%にまで減少する",
      },
      fire: {
        id: "fire", key: "fire", owner: "sushia", name: "ファイア", rank: "D", category: "スキル", skillType: "単体攻撃",
        requiredWeapons: ["杖", "魔導書", "楽器"],
        cd: 14, cost: 40, range: px(450), cast: 1, damageBase: 30, magicScale: 0.45, burnDuration: 3, burnDamageHpRatio: 0.01, burnTickRate: 1, beamColor: "rgba(255,139,67,0.74)", burstRadius: px(44), lines: ["ファイア"], damageType: "magic", statusIds: ["debuff_burn"],
        formula: [{ text: "30 + 魔力 * 0.45", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "１秒の詠唱を行った後、対象の敵１体に炎を放ち、(式=値)の魔法ダメージを与え、3秒の\"燃焼\"を付与する。",
        simpleDescription: "詠唱後、対象の敵１体に炎を放ち、魔法ダメージを与え、\"燃焼\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに付与する\"燃焼\"の効果時間が増加する",
        upgradeDescription: "レベルが上がるごとに付与する\"燃焼\"の効果時間が+(1/2/3/4/5)秒増加する",
      },
      ult: {
        id: "ice_word", key: "ult", owner: "sushia", name: "アイスワールド", rank: "D", category: "必殺技", skillType: "範囲攻撃", ultimateCost: 130, cast: 5, autoCast: 5, radius: px(330), manualRadiusBonus: 0,
        requiredWeapons: ["杖", "魔導書", "楽器"],
        duration: 8, autoDuration: 8, tickRate: 1, falloffMin: 0.5,
        freezeEnemy: 5, freezeAlly: 5, autoFreezeAlly: 5,
        damageBase: 8, magicScale: 0.18, lines: ["アイスワールド"], damageType: "magic", statusIds: ["debuff_freeze"],
        formula: [{ text: "8 + 魔力 * 0.18", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "５秒の詠唱を行った後、８秒の間、周囲の広い範囲を氷で覆いつくす。氷に触れた敵には最大５秒の\"凍結\"を付与する。氷に触れている敵は毎秒(式=値)の魔法ダメージを受け続ける。中心から離れている敵ほどダメージと凍結の効果時間が弱くなる。",
        simpleDescription: "詠唱後、一定時間の間、周囲の広い範囲を氷で覆いつくす。氷に触れた敵には\"凍結\"を付与する。氷に触れている敵は魔法ダメージを受け続ける。中心から離れている敵ほど効果が弱くなる。",
        upgradeSimpleDescription: "レベルが上がるごとに付与する\"凍結\"の効果時間が増加する",
        upgradeDescription: "レベルが上がるごとに付与する\"凍結\"の効果時間が+(1/2/3/4/5)秒増加する",
      },
    },
    weapon: {
      hornRabbitKnife: {
        id: "horn_rabbit_attack_knife", key: "hornRabbitKnife", owner: "weapon", name: "突き刺し", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, range: px(50), damageBase: 13, attackScale: 0.5, missingHpScale: 0.25, scaleUpgradeMultipliers: [1, 1.1, 1.2, 1.3, 1.4, 1.5], lines: ["突き刺し"], damageType: "physical",
        formula: [{ text: "13 + 攻撃力 * 0.5 * (1 + 対象の減少HP割合 / 4)", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "敵に剣を突き刺し、(式=値)の物理ダメージを与える。",
        simpleDescription: "敵に剣を突き刺し、物理ダメージを与える。",
        upgradeSimpleDescription: "レベルが上がるごとにダメージが上昇する",
        upgradeDescription: "レベルが上がるごとにスキルの参照式が(1.1/1.2/1.3/1.4/1.5)倍になる",
      },
      hornRabbitSword: {
        id: "horn_rabbit_attack_sword", key: "hornRabbitSword", owner: "weapon", name: "振りかざし", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, cast: 1, range: px(65), damageBase: 10, attackScale: 0.6, missingHpScale: 0.25, scaleUpgradeMultipliers: [1, 1.1, 1.2, 1.3, 1.4, 1.5], lines: ["振りかざし"], damageType: "physical",
        formula: [{ text: "10 + 攻撃力 * 0.6 * (1 + 対象の減少HP割合 / 4)", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "1秒のチャージ後、敵に剣を振りかざし、(式=値)の物理ダメージを与える。",
        simpleDescription: "少しのチャージを行い、敵に剣を振りかざし、物理ダメージを与える。",
        upgradeSimpleDescription: "レベルが上がるごとにダメージが上昇する",
        upgradeDescription: "レベルが上がるごとにスキルの参照式が(1.1/1.2/1.3/1.4/1.5)倍になる",
      },
      hornRabbitFist: {
        id: "horn_rabbit_attack_fist", key: "hornRabbitFist", owner: "weapon", name: "顔面パンチ", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, range: px(40), damageBase: 14, attackScale: 0.55, missingHpScale: 0.25, scaleUpgradeMultipliers: [1, 1.1, 1.2, 1.3, 1.4, 1.5], lines: ["顔面パンチ"], damageType: "physical",
        formula: [{ text: "14 + 攻撃力 * 0.55 * (1 + 対象の減少HP割合 / 4)", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "敵の顔を殴り、(式=値)の物理ダメージを与える。",
        simpleDescription: "敵の顔を殴り、物理ダメージを与える。",
        upgradeSimpleDescription: "レベルが上がるごとにダメージが上昇する",
        upgradeDescription: "レベルが上がるごとにスキルの参照式が(1.1/1.2/1.3/1.4/1.5)倍になる",
      },
      hornRabbitStaff: {
        id: "horn_rabbit_attack_staff", key: "hornRabbitStaff", owner: "weapon", name: "2連打撃", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, range: px(55), hitRange: px(65), repeat: 2, repeatDelayMs: 120, damageBase: 8, attackScale: 0.2, missingHpScale: 0.25, scaleUpgradeMultipliers: [1, 1.1, 1.2, 1.3, 1.4, 1.5], lines: ["2連打撃"], damageType: "physical",
        formula: [{ text: "8 + 攻撃力 * 0.2 * (1 + 対象の減少HP割合 / 4)", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "棒具を振り、端を2回ずつ当て、(式=値)の物理ダメージを2度与える。",
        simpleDescription: "棒具を振り、端を1回ずつ当て、物理ダメージを与える。",
        upgradeSimpleDescription: "レベルが上がるごとにダメージが上昇する",
        upgradeDescription: "レベルが上がるごとにスキルの参照式が(1.1/1.2/1.3/1.4/1.5)倍になる",
      },
      hornRabbitStick: {
        id: "horn_rabbit_attack_stick", key: "hornRabbitStick", owner: "weapon", name: "魔力弾", rank: "D", category: "通常攻撃", skillType: "方向指定攻撃",
        cd: 2, cost: 25, range: px(350), cast: 1, projectileCount: 1, spread: 0, lineWidth: px(12), projectileSpeed: px(360), projectileRadius: px(5), damageBase: 10, magicScale: 0.5, missingHpScale: 0.25, scaleUpgradeMultipliers: [1, 1.1, 1.2, 1.3, 1.4, 1.5], life: rangeLife(350, 360), color: "#d9afff", lines: ["魔力弾"], damageType: "magic",
        formula: [{ text: "10 + 魔力 * 0.5 * (1 + 対象の減少HP割合 / 4)", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "１秒の詠唱を行った後、指定した方向に魔力で生成した弾を発射する。当たった敵に(式=値)の魔法ダメージを与える。魔力弾は敵に当たるか最大射程まで飛ぶと消滅する。",
        simpleDescription: "詠唱後、魔力で生成された弾を発射する。",
        upgradeSimpleDescription: "レベルが上がるごとにダメージが上昇する",
        upgradeDescription: "レベルが上がるごとにスキルの参照式が(1.1/1.2/1.3/1.4/1.5)倍になる",
      },
      hornRabbitBook: {
        id: "horn_rabbit_attack_book", key: "hornRabbitBook", owner: "weapon", name: "ショック", rank: "D", category: "通常攻撃", skillType: "範囲攻撃",
        cd: 2, cost: 20, range: px(230), radius: px(60), burstRadius: px(68), cast: 1, damageBase: 10, magicScale: 0.35, missingHpScale: 0.25, scaleUpgradeMultipliers: [1, 1.1, 1.2, 1.3, 1.4, 1.5], color: "#9ef7ff", lines: ["ショック"], damageType: "magic",
        formula: [{ text: "10 + 魔力 * 0.35 * (1 + 対象の減少HP割合 / 4)", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "1秒の詠唱後、指定した範囲内の敵に衝撃を与え、(式=値)の魔法ダメージを与える。",
        simpleDescription: "詠唱後、指定した範囲内の敵に衝撃を与え、魔法ダメージを与える。",
        upgradeSimpleDescription: "レベルが上がるごとにダメージが上昇する",
        upgradeDescription: "レベルが上がるごとにスキルの参照式が(1.1/1.2/1.3/1.4/1.5)倍になる",
      },
      hornRabbitFlute: {
        id: "horn_rabbit_attack_flute", key: "hornRabbitFlute", owner: "weapon", name: "魔力中和音", rank: "D", category: "通常攻撃", skillType: "範囲デバフ",
        cd: 2, cost: 20, range: px(0), radius: px(200), burstRadius: px(208), cast: 0.5, center: "self", magicNeutralizeBase: 0.05, magicNeutralizePerLevel: 0.01, magicNeutralizeDuration: 4, lines: ["魔力中和音"], statusIds: ["debuff_magic_neutralize"],
        description: "詠唱後、周囲の敵の魔力を中和し、4秒間対象の魔力を5%減少させる。",
        simpleDescription: "詠唱後、周囲の敵の魔力を中和し、4秒間魔力を減少させる。",
        upgradeSimpleDescription: "レベルが上がるごとに魔力の中和効果が上昇する",
        upgradeDescription: "レベルが上がるごとに魔力の中和効果が+(1/2/3/4/5)%上昇する",
      },
      budAlrauneKnife: {
        id: "bud_alraune_attack_knife", key: "budAlrauneKnife", owner: "weapon", name: "突き刺し", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, range: px(50), damageBase: 13, attackScale: 0.5, sleepChanceBase: 0.2, sleepChancePerLevel: 0.05, sleepDuration: 3, lines: ["突き刺し"], damageType: "physical", statusIds: ["debuff_sleep"],
        formula: [{ text: "13 + 攻撃力 * 0.5", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "敵に剣を突き刺し、(式=値)の物理ダメージを与える。20%の確率で敵に3秒の\"睡眠\"を付与する。",
        simpleDescription: "敵に剣を突き刺し、物理ダメージを与える。まれに敵に\"睡眠\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに\"睡眠\"の付与率が上昇する",
        upgradeDescription: "レベルが上がるごとに\"睡眠\"の付与率が+(5/10/15/20/25)%上昇する",
      },
      budAlrauneSword: {
        id: "bud_alraune_attack_sword", key: "budAlrauneSword", owner: "weapon", name: "振りかざし", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, cast: 1, range: px(65), damageBase: 10, attackScale: 0.6, sleepChanceBase: 0.2, sleepChancePerLevel: 0.05, sleepDuration: 3, lines: ["振りかざし"], damageType: "physical", statusIds: ["debuff_sleep"],
        formula: [{ text: "10 + 攻撃力 * 0.6", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "1秒のチャージ後、敵に剣を振りかざし、(式=値)の物理ダメージを与える。20%の確率で敵に3秒の\"睡眠\"を付与する。",
        simpleDescription: "少しのチャージを行い、敵に剣を振りかざし、物理ダメージを与える。まれに\"睡眠\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに\"睡眠\"の付与率が上昇する",
        upgradeDescription: "レベルが上がるごとに\"睡眠\"の付与率が+(5/10/15/20/25)%上昇する",
      },
      budAlrauneFist: {
        id: "bud_alraune_attack_fist", key: "budAlrauneFist", owner: "weapon", name: "顔面パンチ", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, range: px(40), damageBase: 14, attackScale: 0.55, sleepChanceBase: 0.2, sleepChancePerLevel: 0.05, sleepDuration: 3, lines: ["顔面パンチ"], damageType: "physical", statusIds: ["debuff_sleep"],
        formula: [{ text: "14 + 攻撃力 * 0.55", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "敵の顔を殴り、(式=値)の物理ダメージを与える。20%の確率で敵に3秒の\"睡眠\"を付与する。",
        simpleDescription: "敵の顔を殴り、物理ダメージを与える。まれに\"睡眠\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに\"睡眠\"の付与率が上昇する",
        upgradeDescription: "レベルが上がるごとに\"睡眠\"の付与率が+(5/10/15/20/25)%上昇する",
      },
      budAlrauneStaff: {
        id: "bud_alraune_attack_staff", key: "budAlrauneStaff", owner: "weapon", name: "2連打撃", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, range: px(55), hitRange: px(65), repeat: 2, repeatDelayMs: 120, damageBase: 8, attackScale: 0.2, sleepChanceBase: 0.2, sleepChancePerLevel: 0.05, sleepDuration: 3, sleepFirstRepeatOnly: true, sleepWakeBonusAttackScale: 0.15, lines: ["2連打撃"], damageType: "physical", statusIds: ["debuff_sleep"],
        formula: [{ text: "8 + 攻撃力 * 0.2", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "棒具を振り、端を2回ずつ当て、(式=値)の物理ダメージを2度与える。20%ずつの確率で敵に3秒の\"睡眠\"を付与する。1回目で\"睡眠\"を付与した場合、2回目のダメージが攻撃力 * 0.15分上昇し、この2回目では\"睡眠\"を付与しない。",
        simpleDescription: "棒具を振り、端を1回ずつ当て、物理ダメージを与える。まれに\"睡眠\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに\"睡眠\"の付与率が上昇する",
        upgradeDescription: "レベルが上がるごとに\"睡眠\"の付与率が+(5/10/15/20/25)%上昇する",
      },
      budAlrauneStick: {
        id: "bud_alraune_attack_stick", key: "budAlrauneStick", owner: "weapon", name: "魔力弾", rank: "D", category: "通常攻撃", skillType: "方向指定攻撃",
        cd: 2, cost: 25, range: px(350), cast: 1, projectileCount: 1, spread: 0, lineWidth: px(12), projectileSpeed: px(360), projectileRadius: px(5), damageBase: 10, magicScale: 0.5, sleepChanceBase: 0.2, sleepChancePerLevel: 0.05, sleepDuration: 3, life: rangeLife(350, 360), color: "#d9afff", lines: ["魔力弾"], damageType: "magic", statusIds: ["debuff_sleep"],
        formula: [{ text: "10 + 魔力 * 0.5", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "1秒の詠唱を行った後、指定した方向に魔力で生成した弾を発射する。当たった敵に(式=値)の魔法ダメージを与える。魔力弾は敵に当たるか最大射程まで飛ぶと消滅する。20%の確率で敵に3秒の\"睡眠\"を付与する。",
        simpleDescription: "詠唱後、魔力で生成された弾を発射する。まれに\"睡眠\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに\"睡眠\"の付与率が上昇する",
        upgradeDescription: "レベルが上がるごとに\"睡眠\"の付与率が+(5/10/15/20/25)%上昇する",
      },
      budAlrauneBook: {
        id: "bud_alraune_attack_book", key: "budAlrauneBook", owner: "weapon", name: "ショック", rank: "D", category: "通常攻撃", skillType: "範囲攻撃",
        cd: 2, cost: 20, range: px(230), radius: px(60), burstRadius: px(68), cast: 1, damageBase: 10, magicScale: 0.35, sleepChanceBase: 0.15, sleepChancePerLevel: 0.05, sleepDuration: 2, color: "#9ef7ff", lines: ["ショック"], damageType: "magic", statusIds: ["debuff_sleep"],
        formula: [{ text: "10 + 魔力 * 0.35", stat: "magic", baseProp: "damageBase", scaleProp: "magicScale" }],
        description: "1秒の詠唱後、指定した範囲内の敵に衝撃を与え、(式=値)の魔法ダメージを与える。15%の確率で敵に2秒の\"睡眠\"を付与する。",
        simpleDescription: "詠唱後、指定した範囲内の敵に衝撃を与え、魔法ダメージを与える。まれに\"睡眠\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに\"睡眠\"の付与率が上昇する",
        upgradeDescription: "レベルが上がるごとに\"睡眠\"の付与率が+(5/10/15/20/25)%上昇する",
      },
      budAlrauneFlute: {
        id: "bud_alraune_attack_flute", key: "budAlrauneFlute", owner: "weapon", name: "目覚まし", rank: "D", category: "通常攻撃", skillType: "範囲バフ",
        cd: 2, cost: 20, range: px(0), radius: px(220), burstRadius: px(228), cast: 0.2, center: "self", arcDeg: 90, sleepCleanse: true, sleepCleanseArcBonusPerLevel: 6, lines: ["目覚まし"], statusIds: ["debuff_sleep"],
        description: "詠唱後、周囲の味方に大きな音を出し、\"睡眠\"が付与されている場合、即座に解除する。",
        simpleDescription: "詠唱後、周囲の味方に大きな音を出し、味方に付与されている\"睡眠\"を解除する。",
        upgradeSimpleDescription: "レベルが上がるごとにスキルの範囲が拡大する",
        upgradeDescription: "レベルが上がるごとにスキルの範囲が+(6/12/18/24/30)度拡大する",
      },
      shadowWolfKnife: {
        id: "shadow_wolf_attack_knife", key: "shadowWolfKnife", owner: "weapon", name: "突き刺し", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, range: px(50), damageBase: 13, attackScale: 0.5, injuryDuration: 3, injuryDurationPerLevel: 1, lines: ["突き刺し"], damageType: "physical", statusIds: ["debuff_Injury"],
        formula: [{ text: "13 + 攻撃力 * 0.5", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "敵に剣を突き刺し、(式=値)の物理ダメージを与え、3秒の\"負傷\"を付与する。",
        simpleDescription: "敵に剣を突き刺し、物理ダメージを与え、\"負傷\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに\"負傷\"の効果時間が増加する",
        upgradeDescription: "レベルが上がるごとに\"負傷\"の効果時間が+(1/2/3/4/5)秒増加する",
      },
      shadowWolfSword: {
        id: "shadow_wolf_attack_sword", key: "shadowWolfSword", owner: "weapon", name: "振りかざし", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, cast: 1, range: px(65), damageBase: 10, attackScale: 0.6, injuryDuration: 3, injuryDurationPerLevel: 1, lines: ["振りかざし"], damageType: "physical", statusIds: ["debuff_Injury"],
        formula: [{ text: "10 + 攻撃力 * 0.6", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "1秒のチャージ後、敵に剣を振りかざし、(式=値)の物理ダメージを与え、3秒の\"負傷\"を付与する。",
        simpleDescription: "少しのチャージを行い、敵に剣を振りかざし、物理ダメージを与え、\"負傷\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに\"負傷\"の効果時間が増加する",
        upgradeDescription: "レベルが上がるごとに\"負傷\"の効果時間が+(1/2/3/4/5)秒増加する",
      },
      shadowWolfFist: {
        id: "shadow_wolf_attack_fist", key: "shadowWolfFist", owner: "weapon", name: "顔面パンチ", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, range: px(40), damageBase: 14, attackScale: 0.55, injuryDuration: 3, injuryDurationPerLevel: 1, lines: ["顔面パンチ"], damageType: "physical", statusIds: ["debuff_Injury"],
        formula: [{ text: "14 + 攻撃力 * 0.55", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "敵の顔を殴り、(式=値)の物理ダメージを与え、3秒の\"負傷\"を付与する。",
        simpleDescription: "敵の顔を殴り、物理ダメージを与え、\"負傷\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに\"負傷\"の効果時間が増加する",
        upgradeDescription: "レベルが上がるごとに\"負傷\"の効果時間が+(1/2/3/4/5)秒増加する",
      },
      shadowWolfStaff: {
        id: "shadow_wolf_attack_staff", key: "shadowWolfStaff", owner: "weapon", name: "2連打撃", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 2, range: px(55), hitRange: px(65), repeat: 2, repeatDelayMs: 120, damageBase: 8, attackScale: 0.2, injuryDuration: 3, injuryDurationPerLevel: 1, lines: ["2連打撃"], damageType: "physical", statusIds: ["debuff_Injury"],
        formula: [{ text: "8 + 攻撃力 * 0.2", stat: "attack", baseProp: "damageBase", scaleProp: "attackScale" }],
        description: "棒具を振り、端を2回ずつ当て、(式=値)の物理ダメージを2度与える。命中した敵に3秒の\"負傷\"を付与する。",
        simpleDescription: "棒具を振り、端を1回ずつ当て、物理ダメージを与え、\"負傷\"を付与する。",
        upgradeSimpleDescription: "レベルが上がるごとに\"負傷\"の効果時間が増加する",
        upgradeDescription: "レベルが上がるごとに\"負傷\"の効果時間が+(1/2/3/4/5)秒増加する",
      },
      shadowWolfFlute: {
        id: "shadow_wolf_attack_flute", key: "shadowWolfFlute", owner: "weapon", name: "遠吠え", rank: "D", category: "通常攻撃", skillType: "範囲バフ",
        cd: 2, cost: 60, range: px(0), radius: px(150), burstRadius: px(158), cast: 3, center: "self", actionCdSetTo: 0.3, castReductionPerLevel: 0.5, lines: ["遠吠え"],
        description: "3秒の詠唱後、範囲内の味方の行動CDが残り0.3秒以上の場合、即座に残り0.3秒にまで短縮する。",
        simpleDescription: "詠唱後、範囲内の味方の行動CDを短縮する。",
        upgradeSimpleDescription: "レベルが上がるごとに詠唱時間が短縮される",
        upgradeDescription: "レベルが上がるごとに詠唱時間が(0.5/1/1.5/2/2.5)秒短縮される",
      },
    },
    enemy: {
      attack: { id: "enemy_attack", key: "attack", owner: "enemy", name: "通常攻撃", category: "通常攻撃", cd: 5, bruteRange: px(48), eliteRange: px(58), cast: 0.32, radius: px(42), damageBonus: 8 },
      casterLine: { id: "enemy_caster_line", key: "casterLine", owner: "enemy", name: "射撃線", category: "スキル", cdBase: 12, cdRandom: 0, cast: 0.86, aimLockBeforeFire: 1.3, length: px(620), width: px(26), hitWidth: px(18), damageBonus: 17 },
      heavySlam: { id: "enemy_heavy_slam", key: "heavySlam", owner: "enemy", name: "ヘビースラム", category: "スキル", cd: 17, cast: 0.95, radius: px(98), damageBonus: 20, burstRadius: px(110) },
      d_enemy_attack: {
        id: "d_enemy_attack", key: "d_enemy_attack", owner: "enemy", name: "通常攻撃", rank: "D", category: "通常攻撃", skillType: "単体攻撃",
        cd: 5, range: px(50), damageBase: 10, attackScale: 0.2, damageType: "physical", lines: ["！！"],
      },
      rush: {
        id: "rush", key: "rush", owner: "enemy", name: "突進", rank: "D", category: "スキル", skillType: "単体攻撃",
        cd: 8, cast: 0.5, range: px(85), damageBase: 10, attackScale: 0.35, damageType: "physical", lines: ["突撃"],
      },
      multi_biting: {
        id: "multi_biting", key: "multi_biting", owner: "enemy", name: "連続噛みつき", rank: "D", category: "スキル", skillType: "単体攻撃",
        cd: 13, range: px(70), repeat: 2, repeatDelayMs: 120, damageBase: 8, attackScale: 0.1, missingHpScale: 1 / 3, damageType: "physical", lines: ["連続噛みつき"],
      },
      vine_punch: {
        id: "vine_punch", key: "vine_punch", owner: "enemy", name: "つるの打撃", rank: "D", category: "スキル", skillType: "単体攻撃",
        cd: 10, range: px(100), damageBase: 13, attackScale: 0.3, damageType: "physical", lines: ["つるの打撃"],
      },
      sleep_scent: {
        id: "sleep_scent", key: "sleep_scent", owner: "enemy", name: "甘い香り", rank: "D", category: "スキル", skillType: "範囲デバフ",
        cd: 25, cost: 20, cast: 1, radius: px(130), duration: 3, tickRate: 0.25, sleepDuration: 12, lines: ["甘い香り"], statusIds: ["debuff_sleep"],
      },
      pollen_spraying: {
        id: "pollen_spraying", key: "pollen_spraying", owner: "enemy", name: "花粉散布", rank: "D", category: "スキル", skillType: "範囲攻撃",
        cd: 20, cost: 20, cast: 0.5, range: px(80), radius: px(140), duration: 3, tickRate: 1, maxTicks: 5, damageBase: 5, magicScale: 0.1, damageType: "ドット魔法", lines: ["花粉散布"],
      },
      biting: {
        id: "biting", key: "biting", owner: "enemy", name: "噛みつき", rank: "D", category: "スキル", skillType: "単体攻撃",
        cd: 15, range: px(50), damageBase: 15, attackScale: 0.2, injuryDuration: 4, damageType: "physical", lines: ["噛みつき"], statusIds: ["debuff_Injury"],
      },
      shadow_dash: {
        id: "shadow_dash", key: "shadow_dash", owner: "enemy", name: "影走り", rank: "D", category: "スキル", skillType: "対象バフ",
        cd: 20, cost: 10, duration: 10, moveSpeedBonus: 0.5, actionSpeedBonus: 0.8, lines: ["影走り"],
      },
      throat_hunt: {
        id: "throat_hunt", key: "throat_hunt", owner: "enemy", name: "喉笛狩り", rank: "D", category: "スキル", skillType: "単体攻撃",
        cd: 15, range: px(30), damageBase: 10, attackScale: 0.3, missingHpScale: 1, damageType: "physical", lines: ["喉笛狩り"],
      },
    },
  };

  const skillData = window.HEALER_SKILL_DATA;
  const skillWeaponTypesByOwner = {
    finald: ["魔導書", "楽器"],
    ulpes: ["片手剣", "両手剣"],
    rihas: ["片手剣", "拳具", "棒具"],
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
        active: ["attack", "heal", "shield", "commandAttack", "commandDefend"],
      },
      ulpes: { passive: "swordwork", ultimate: "ult", active: ["attack"] },
      rihas: { passive: "painless", ultimate: "ult", active: ["attack"] },
      sushia: { passive: "warmup", ultimate: "ult", active: ["attack"] },
      enemy: { passive: null, active: ["attack", "casterLine", "heavySlam"] },
    },
  };
})();
