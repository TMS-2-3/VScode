(() => {
  "use strict";

  const elementData = window.HEALER_ELEMENT_DATA || {
    defaultElement: "none",
    elements: {
      none: { key: "none", name: "無属性", outgoing: {}, incoming: {} },
    },
  };
  const seriesData = window.HEALER_EQUIPMENT_SERIES_DATA || {
    setThresholds: [2, 5],
    series: {},
  };

  window.HEALER_EQUIPMENT_DATA = {
    defaultElement: elementData.defaultElement,
    slots: [
      { key: "weapon", name: "武器", allowsElement: false, hasSpecialEffect: true, required: true },
      { key: "head", name: "頭", allowsElement: false, hasSpecialEffect: false },
      { key: "body", name: "胴", allowsElement: false, hasSpecialEffect: false },
      { key: "hands", name: "手", allowsElement: false, hasSpecialEffect: false },
      { key: "legs", name: "足", allowsElement: false, hasSpecialEffect: false },
      { key: "feet", name: "靴", allowsElement: false, hasSpecialEffect: false },
      { key: "accessory", name: "アクセサリ", allowsElement: false, hasSpecialEffect: true },
    ],
    setThresholds: seriesData.setThresholds,
    elements: elementData.elements,
    items: {
      default_u: {
        id: "default_u",
        name: "ウルペスソード",
        rank: "D",
        slot: "weapon",
        weaponType: "片手剣",
        material: "製作不可",
        allowedUnitIds: ["ulpes"],
        flatStatBonuses: { attack: 3 },
        upgradeFlatStatBonuses: [
          { attack: 3 },
          { attack: 4 },
          { attack: 5 },
          { attack: 6 },
          { attack: 7 },
        ],
        normalAttackSkillId: "speed_slash",
        effect: null,
        description: "ウルペス用の初期武器",
      },
      default_r: {
        id: "default_r",
        name: "ロックグローブ",
        rank: "D",
        slot: "weapon",
        weaponType: "拳具",
        material: "製作不可",
        allowedUnitIds: ["rihas"],
        flatStatBonuses: { attack: 4 },
        upgradeFlatStatBonuses: [
          { attack: 4 },
          { attack: 5 },
          { attack: 6 },
          { attack: 7 },
          { attack: 8 },
        ],
        normalAttackSkillId: "huriharai",
        effect: null,
        description: "リハス用の初期武器",
      },
      default_s: {
        id: "default_s",
        name: "訓練用杖",
        rank: "D",
        slot: "weapon",
        weaponType: "杖",
        material: "製作不可",
        allowedUnitIds: ["sushia"],
        flatStatBonuses: { magic: 3 },
        upgradeFlatStatBonuses: [
          { magic: 3 },
          { magic: 4 },
          { magic: 5 },
          { magic: 6 },
          { magic: 7 },
        ],
        normalAttackSkillId: "masic_shot",
        effect: null,
        description: "スシア用の初期武器",
      },
      default_a: {
        id: "default_a",
        name: "訓練用魔導書",
        rank: "D",
        slot: "weapon",
        weaponType: "魔導書",
        material: "製作不可",
        allowedUnitIds: ["finald"],
        flatStatBonuses: { magic: 1 },
        upgradeFlatStatBonuses: [
          { magic: 1 },
          { magic: 2 },
          { magic: 3 },
          { magic: 4 },
          { magic: 5 },
        ],
        normalAttackSkillId: "shock",
        effect: null,
        description: "アルジュナ用の初期武器",
      },
    },
    series: seriesData.series,
  };
})();
