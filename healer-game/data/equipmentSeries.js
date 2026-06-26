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
    },
  };
})();
