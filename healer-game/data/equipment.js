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
  const craftCost = { gold: 100, materials: { kari_dorop: 3 } };
  const upgradeCosts = [
    { gold: 30, materials: { kari_dorop: 1 } },
    { gold: 30, materials: { kari_dorop: 2 } },
    { gold: 30, materials: { kari_dorop: 3 } },
    { gold: 30, materials: { kari_dorop: 4 } },
    { gold: 30, materials: { kari_dorop: 5 } },
  ];
  const upgradeMultipliers = [1, 1.1, 1.2, 1.3, 1.4, 1.5];

  function cloneCost(cost) {
    return {
      gold: cost.gold || 0,
      materials: { ...(cost.materials || {}) },
    };
  }

  function cloneCraftCost() {
    return cloneCost(craftCost);
  }

  function makeUpgrade(mode) {
    return {
      mode,
      maxLevel: 5,
      costs: upgradeCosts.map(cloneCost),
      multipliers: upgradeMultipliers.slice(),
    };
  }

  function makeWeapon(id, name, weaponType, allowedUnitIds, statKey, normalAttackSkillId) {
    return {
      id,
      name,
      rank: "D",
      slot: "weapon",
      weaponType,
      series: "kari_set",
      material: "仮素材",
      allowedUnitIds,
      craft: cloneCraftCost(),
      flatStatBonuses: { [statKey]: 20 },
      randomFlatStatVariance: 0.1,
      upgrade: makeUpgrade("flatStatMultiplier"),
      normalAttackSkillId,
      effect: null,
      simpleDescription: "仮素材で作れる仮武器。",
      description: "仮素材で作れる仮武器。強化すると主ステータスが伸びる。",
    };
  }

  function makeArmor(id, name, slot) {
    return {
      id,
      name,
      rank: "D",
      slot,
      series: "kari_set",
      material: "仮素材",
      craft: cloneCraftCost(),
      randomStatProfile: { type: "armor", rank: "D" },
      upgrade: makeUpgrade("randomStatMultiplier"),
      effect: null,
      simpleDescription: "仮素材で作れる仮防具。",
      description: "仮素材で作れる仮防具。製作時にランダムステータスが付き、強化するとランダムステータスが伸びる。",
    };
  }

  function makeAccessory(id, name) {
    return {
      id,
      name,
      rank: "D",
      slot: "accessory",
      series: "kari_set",
      material: "仮素材",
      craft: cloneCraftCost(),
      randomStatProfile: { type: "accessory", rank: "D" },
      effect: null,
      simpleDescription: "仮素材で作れる仮アクセサリ。",
      description: "仮素材で作れる仮アクセサリ。製作時にアクセサリ用のランダムステータスが付く。",
    };
  }

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
        flatStatBonuses: { attack: 10 },
        normalAttackSkillId: "speed_slash",
        effect: null,
        simpleDescription: "ウルペス用の初期武器",
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
        flatStatBonuses: { attack: 10 },
        normalAttackSkillId: "huriharai",
        effect: null,
        simpleDescription: "リハス用の初期武器",
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
        flatStatBonuses: { magic: 10 },
        normalAttackSkillId: "masic_shot",
        effect: null,
        simpleDescription: "スシア用の初期武器",
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
        flatStatBonuses: { magic: 10 },
        normalAttackSkillId: "shock",
        effect: null,
        simpleDescription: "アルジュナ用の初期武器",
        description: "アルジュナ用の初期武器",
      },
      kari_ken: makeWeapon("kari_ken", "仮の片手剣", "片手剣", ["ulpes"], "attack", "speed_slash"),
      kari_ryouken: makeWeapon("kari_ryouken", "仮の両手剣", "両手剣", ["ulpes"], "attack", "huriharai"),
      kari_kengu: makeWeapon("kari_kengu", "仮の拳具", "拳具", ["rihas"], "attack", "huriharai"),
      kari_bougu: makeWeapon("kari_bougu", "仮の棒具", "棒具", ["rihas", "sushia"], "attack", "huriharai"),
      kari_tue: makeWeapon("kari_tue", "仮の杖", "杖", ["sushia"], "magic", "masic_shot"),
      kari_book: makeWeapon("kari_book", "仮の魔導書", "魔導書", ["finald", "sushia"], "magic", "shock"),
      kari_hue: makeWeapon("kari_hue", "仮の魔楽器", "魔楽器", ["finald"], "magic", "shock"),
      kari_atama: makeArmor("kari_atama", "仮ヘルメット", "head"),
      kari_huku: makeArmor("kari_huku", "仮服", "body"),
      kari_zubon: makeArmor("kari_zubon", "仮レギンス", "legs"),
      kari_kutu: makeArmor("kari_kutu", "仮ブーツ", "feet"),
      kari_te: makeArmor("kari_te", "仮グローブ", "hands"),
      kari_akuse: makeAccessory("kari_akuse", "仮ネックレス"),
    },
    series: seriesData.series,
  };
})();
