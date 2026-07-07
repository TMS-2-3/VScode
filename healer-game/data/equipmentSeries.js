(() => {
  "use strict";

  window.HEALER_EQUIPMENT_SERIES_DATA = {
    setThresholds: [2, 5],
    series: {
      kari_set: {
        key: "kari_set",
        name: "仮シリーズ",
        setEffects: {
          2: {
            name: "仮シリーズ 2セット",
            statBonuses: { maxHp: 0.3, maxMp: 0.3 },
            simpleDescription: "HPとMPが30%増加する。",
            description: "同じ仮シリーズを2部位以上装備している間、最大HPと最大MPが30%増加する。",
          },
          5: {
            name: "仮シリーズ 5セット",
            statBonuses: { attack: 0.3, magic: 0.3 },
            simpleDescription: "攻撃力と魔力が30%増加する。",
            description: "同じ仮シリーズを5部位以上装備している間、攻撃力と魔力が30%増加する。",
          },
        },
      },
      horn_rabbit: {
        key: "horn_rabbit",
        name: "ツノウサギ",
        setEffects: {
          2: {
            name: "丈夫な毛皮",
            flatStatBonuses: { defense: 20 },
            simpleDescription: "防御力が上昇する",
            description: "防御力が20上昇する",
          },
          5: {
            name: "角の加護",
            flatStatBonuses: { magicDefense: 25 },
            simpleDescription: "魔法防御力が上昇する",
            description: "魔法防御力が25上昇する",
          },
        },
      },
      bud_alraune: {
        key: "bud_alraune",
        name: "つぼみのアルラウネ",
        setEffects: {
          2: {
            name: "つぼみの中",
            statBonuses: { magicDefense: 0.1 },
            simpleDescription: "魔法防御力が上昇する",
            description: "魔法防御力が10%上昇する",
          },
          5: {
            name: "ツタの棘",
            statBonuses: { attack: 0.1 },
            simpleDescription: "攻撃力が上昇する",
            description: "攻撃力が10%上昇する",
          },
        },
      },
      shadow_wolf: {
        key: "shadow_wolf",
        name: "シャドウウルフ",
        setEffects: {
          2: {
            name: "ハントダッシュ",
            statBonuses: { moveSpeed: 0.2 },
            simpleDescription: "移動速度が上昇する",
            description: "移動速度が20%上昇する",
          },
          5: {
            name: "ハントアイ",
            guaranteedCritHpRatio: 0.2,
            simpleDescription: "HPが低い敵に攻撃をする時、会心が発生する",
            description: "HPが20%以下の敵に対する攻撃が必ず会心になる",
          },
        },
      },
    },
  };
})();
