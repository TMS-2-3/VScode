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

  function makeCost(gold, materials = {}) {
    return {
      gold: Math.max(0, Math.floor(Number.isFinite(gold) ? gold : 0)),
      materials: { ...materials },
    };
  }

  function makeFixedUpgrade(mode, cost) {
    return {
      mode,
      maxLevel: 5,
      costs: Array.from({ length: 5 }, () => cloneCost(cost)),
      multipliers: upgradeMultipliers.slice(),
    };
  }

  const weaponAllowedUnitIds = {
    "片手剣": ["ulpes", "rihas"],
    "両手剣": ["ulpes"],
    "拳具": ["rihas"],
    "棒具": ["rihas", "sushia"],
    "杖": ["sushia"],
    "魔導書": ["finald", "sushia"],
    "楽器": ["finald"],
  };

  const weaponTypeStatBonuses = {
    "片手剣": { guardChance: 0.2 },
    "両手剣": { critDamage: 0.4 },
    "拳具": { actionSpeed: 0.1 },
    "棒具": { cooldownReduction: 0.2 },
    "杖": { magicDamageBoost: 0.2 },
    "魔導書": { castSpeed: 0.2 },
    "楽器": { ultimateChargeRate: 0.2 },
  };

  function makeKariWeapon(id, name, weaponType, allowedUnitIds, statKey, normalAttackSkillId) {
    return {
      id,
      name,
      rank: "D",
      slot: "weapon",
      weaponType,
      series: "kari_set",
      material: "仮素材",
      shopHidden: true,
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

  function makeKariArmor(id, name, slot, statBonuses) {
    return {
      id,
      name,
      rank: "D",
      slot,
      series: "kari_set",
      material: "仮素材",
      shopHidden: true,
      craft: cloneCraftCost(),
      statBonuses: { ...(statBonuses || {}) },
      upgrade: makeUpgrade("randomStatMultiplier"),
      effect: null,
      simpleDescription: "仮素材で作れる仮防具。",
      description: "仮素材で作れる仮防具。製作時の追加ステータスは固定で、強化すると追加ステータスの中からランダムに伸びる。",
    };
  }

  function makeKariAccessory(id, name, statBonuses) {
    return {
      id,
      name,
      rank: "D",
      slot: "accessory",
      series: "kari_set",
      material: "仮素材",
      shopHidden: true,
      craft: cloneCraftCost(),
      statBonuses: { ...(statBonuses || {}) },
      effect: null,
      simpleDescription: "仮素材で作れる仮アクセサリ。",
      description: "仮素材で作れる仮アクセサリ。製作時の追加ステータスは固定。",
    };
  }

  function makeHornRabbitWeapon(id, name, weaponType, statKey, statValue, normalAttackSkillId, craftMaterials, upgradeMaterials) {
    return {
      id,
      name,
      rank: "D",
      slot: "weapon",
      weaponType,
      series: "horn_rabbit",
      material: "ツノウサギ素材",
      allowedUnitIds: (weaponAllowedUnitIds[weaponType] || []).slice(),
      craft: makeCost(100, craftMaterials),
      flatStatBonuses: { [statKey]: statValue },
      upgrade: makeFixedUpgrade("flatStatMultiplier", makeCost(50, upgradeMaterials)),
      normalAttackSkillId,
      effect: null,
      simpleDescription: "ツノウサギ素材で作れる武器。",
      description: "ツノウサギ素材で作れる武器。強化すると主ステータスが伸びる。",
    };
  }

  function makeHornRabbitArmor(id, name, slot, statBonuses, craftGold, craftMaterials, upgradeMaterials, description) {
    return {
      id,
      name,
      rank: "D",
      slot,
      series: "horn_rabbit",
      material: "ツノウサギ素材",
      craft: makeCost(craftGold, craftMaterials),
      statBonuses: { ...(statBonuses || {}) },
      upgrade: makeFixedUpgrade("randomStatMultiplier", makeCost(50, upgradeMaterials)),
      effect: null,
      simpleDescription: description,
      description,
    };
  }

  function makeHornRabbitAccessory(id, name, statBonuses, craftGold, craftMaterials, description) {
    return {
      id,
      name,
      rank: "D",
      slot: "accessory",
      series: "horn_rabbit",
      material: "ツノウサギ素材",
      craft: makeCost(craftGold, craftMaterials),
      statBonuses: { ...(statBonuses || {}) },
      effect: null,
      simpleDescription: description,
      description,
    };
  }

  function makeAlrauneWeapon(id, name, weaponType, statKey, statValue, normalAttackSkillId, craftMaterials, upgradeMaterials) {
    return {
      id,
      name,
      rank: "D",
      slot: "weapon",
      weaponType,
      series: "bud_alraune",
      material: "アルラウネ素材",
      allowedUnitIds: (weaponAllowedUnitIds[weaponType] || []).slice(),
      craft: makeCost(130, craftMaterials),
      flatStatBonuses: { [statKey]: statValue },
      preferredRangeRole: weaponType === "楽器" ? null : "back",
      upgrade: makeFixedUpgrade("flatStatMultiplier", makeCost(65, upgradeMaterials)),
      normalAttackSkillId,
      effect: null,
      simpleDescription: "アルラウネ素材で作れる武器。",
      description: "アルラウネ素材で作れる武器。強化すると主ステータスが伸びる。",
    };
  }

  function makeAlrauneArmor(id, name, slot, statBonuses, craftMaterials, upgradeMaterials, description) {
    return {
      id,
      name,
      rank: "D",
      slot,
      series: "bud_alraune",
      material: "アルラウネ素材",
      craft: makeCost(130, craftMaterials),
      statBonuses: { ...(statBonuses || {}) },
      upgrade: makeFixedUpgrade("randomStatMultiplier", makeCost(65, upgradeMaterials)),
      effect: null,
      simpleDescription: description,
      description,
    };
  }

  function makeAlrauneAccessory(id, name, statBonuses, craftGold, craftMaterials, description) {
    return {
      id,
      name,
      rank: "D",
      slot: "accessory",
      series: "bud_alraune",
      material: "アルラウネ素材",
      craft: makeCost(craftGold, craftMaterials),
      statBonuses: { ...(statBonuses || {}) },
      effect: null,
      simpleDescription: description,
      description,
    };
  }

  function makeShadowWolfWeapon(id, name, weaponType, statKey, statValue, normalAttackSkillId, craftMaterials, upgradeMaterials) {
    return {
      id,
      name,
      rank: "D",
      slot: "weapon",
      weaponType,
      series: "shadow_wolf",
      material: "シャドウウルフ素材",
      allowedUnitIds: (weaponAllowedUnitIds[weaponType] || []).slice(),
      craft: makeCost(130, craftMaterials),
      flatStatBonuses: { [statKey]: statValue },
      upgrade: makeFixedUpgrade("flatStatMultiplier", makeCost(65, upgradeMaterials)),
      normalAttackSkillId,
      effect: null,
      simpleDescription: "シャドウウルフ素材で作れる武器。",
      description: "シャドウウルフ素材で作れる武器。強化すると主ステータスが伸びる。",
    };
  }

  function makeShadowWolfArmor(id, name, slot, statBonuses, craftMaterials, upgradeMaterials, description) {
    return {
      id,
      name,
      rank: "D",
      slot,
      series: "shadow_wolf",
      material: "シャドウウルフ素材",
      craft: makeCost(130, craftMaterials),
      statBonuses: { ...(statBonuses || {}) },
      upgrade: makeFixedUpgrade("randomStatMultiplier", makeCost(65, upgradeMaterials)),
      effect: null,
      simpleDescription: description,
      description,
    };
  }

  function makeShadowWolfAccessory(id, name, statBonuses, craftGold, craftMaterials, description) {
    return {
      id,
      name,
      rank: "D",
      slot: "accessory",
      series: "shadow_wolf",
      material: "シャドウウルフ素材",
      craft: makeCost(craftGold, craftMaterials),
      statBonuses: { ...(statBonuses || {}) },
      effect: null,
      simpleDescription: description,
      description,
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
    weaponTypeStatBonuses,
    items: {
      default_u: {
        id: "default_u",
        name: "ウルペスソード",
        rank: "D",
        slot: "weapon",
        weaponType: "両手剣",
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
      kari_ken: makeKariWeapon("kari_ken", "仮の片手剣", "片手剣", ["ulpes", "rihas"], "attack", "speed_slash"),
      kari_ryouken: makeKariWeapon("kari_ryouken", "仮の両手剣", "両手剣", ["ulpes"], "attack", "huriharai"),
      kari_kengu: makeKariWeapon("kari_kengu", "仮の拳具", "拳具", ["rihas"], "attack", "huriharai"),
      kari_bougu: makeKariWeapon("kari_bougu", "仮の棒具", "棒具", ["rihas", "sushia"], "attack", "huriharai"),
      kari_tue: makeKariWeapon("kari_tue", "仮の杖", "杖", ["sushia"], "magic", "masic_shot"),
      kari_book: makeKariWeapon("kari_book", "仮の魔導書", "魔導書", ["finald", "sushia"], "magic", "shock"),
      kari_hue: makeKariWeapon("kari_hue", "仮の楽器", "楽器", ["finald"], "magic", "shock"),
      kari_atama: makeKariArmor("kari_atama", "仮ヘルメット", "head", { maxHp: 0.05 }),
      kari_huku: makeKariArmor("kari_huku", "仮服", "body", { defense: 0.03 }),
      kari_zubon: makeKariArmor("kari_zubon", "仮レギンス", "legs", { magicDefense: 0.03 }),
      kari_kutu: makeKariArmor("kari_kutu", "仮ブーツ", "feet", { attack: 0.03 }),
      kari_te: makeKariArmor("kari_te", "仮グローブ", "hands", { magic: 0.03 }),
      kari_akuse: makeKariAccessory("kari_akuse", "仮ネックレス", { damageResistance: 0.1 }),
      horn_rabbit_knife: makeHornRabbitWeapon(
        "horn_rabbit_knife",
        "ツサギナイフ",
        "片手剣",
        "attack",
        15,
        "horn_rabbit_attack_knife",
        { horn_rabbit_fur: 5, horn_rabbit_tooth: 1 },
        { horn_rabbit_fur: 1, horn_rabbit_tooth: 1 }
      ),
      horn_rabbit_sword: makeHornRabbitWeapon(
        "horn_rabbit_sword",
        "ツサギソード",
        "両手剣",
        "attack",
        20,
        "horn_rabbit_attack_sword",
        { horn_rabbit_fur: 5, horn_rabbit_tooth: 1 },
        { horn_rabbit_fur: 1, horn_rabbit_tooth: 1 }
      ),
      horn_rabbit_fist: makeHornRabbitWeapon(
        "horn_rabbit_fist",
        "ツサギフィスト",
        "拳具",
        "attack",
        15,
        "horn_rabbit_attack_fist",
        { horn_rabbit_fur: 5, horn_rabbit_tooth: 1 },
        { horn_rabbit_fur: 1, horn_rabbit_tooth: 1 }
      ),
      horn_rabbit_staff: makeHornRabbitWeapon(
        "horn_rabbit_staff",
        "ツサギスタッフ",
        "棒具",
        "attack",
        13,
        "horn_rabbit_attack_staff",
        { horn_rabbit_fur: 5, horn_rabbit_tooth: 1 },
        { horn_rabbit_fur: 1, horn_rabbit_tooth: 1 }
      ),
      horn_rabbit_stick: makeHornRabbitWeapon(
        "horn_rabbit_stick",
        "ツサギステッキ",
        "杖",
        "magic",
        15,
        "horn_rabbit_attack_stick",
        { horn_rabbit_fur: 5, horn_rabbit_corner: 1 },
        { horn_rabbit_corner: 1 }
      ),
      horn_rabbit_book: makeHornRabbitWeapon(
        "horn_rabbit_book",
        "魔導書・ツサギ",
        "魔導書",
        "magic",
        15,
        "horn_rabbit_attack_book",
        { horn_rabbit_fur: 5, horn_rabbit_corner: 1 },
        { horn_rabbit_corner: 1 }
      ),
      horn_rabbit_flute: makeHornRabbitWeapon(
        "horn_rabbit_flute",
        "ツサギフルート",
        "楽器",
        "magic",
        20,
        "horn_rabbit_attack_flute",
        { horn_rabbit_fur: 5, horn_rabbit_tooth: 1 },
        { horn_rabbit_corner: 1 }
      ),
      horn_rabbit_helm: makeHornRabbitArmor(
        "horn_rabbit_helm",
        "ツサギヘルム",
        "head",
        { maxHp: 0.05, magicDefense: 0.03 },
        100,
        { horn_rabbit_fur: 3, horn_rabbit_corner: 1 },
        { horn_rabbit_fur: 1, horn_rabbit_corner: 1 },
        "ツノウサギの毛皮を元に作られた暖かい頭装備"
      ),
      horn_rabbit_armor: makeHornRabbitArmor(
        "horn_rabbit_armor",
        "ツサギアーマー",
        "body",
        { maxHp: 0.05, defense: 0.03 },
        100,
        { horn_rabbit_fur: 5 },
        { horn_rabbit_fur: 2 },
        "ツノウサギの毛皮を元に作られた暖かい胴装備"
      ),
      horn_rabbit_leggings: makeHornRabbitArmor(
        "horn_rabbit_leggings",
        "ツサギレギンス",
        "legs",
        { magic: 0.05 },
        100,
        { horn_rabbit_fur: 3, horn_rabbit_corner: 1 },
        { horn_rabbit_fur: 1, horn_rabbit_corner: 1 },
        "ツノウサギの毛皮を元に作られた暖かい足装備"
      ),
      horn_rabbit_boots: makeHornRabbitArmor(
        "horn_rabbit_boots",
        "ツサギブーツ",
        "feet",
        { attack: 0.05 },
        100,
        { horn_rabbit_fur: 2, horn_rabbit_tooth: 2 },
        { horn_rabbit_fur: 1, horn_rabbit_tooth: 1 },
        "ツノウサギの毛皮を元に作られた暖かい靴装備"
      ),
      horn_rabbit_glove: makeHornRabbitArmor(
        "horn_rabbit_glove",
        "ツサギグローブ",
        "hands",
        { magic: 0.05 },
        100,
        { horn_rabbit_fur: 1, horn_rabbit_tooth: 4 },
        { horn_rabbit_fur: 1, horn_rabbit_tooth: 1 },
        "ツノウサギの毛皮を元に作られた暖かい手装備"
      ),
      horn_rabbit_pendant: makeHornRabbitAccessory(
        "horn_rabbit_pendant",
        "ツサギペンダント",
        { magicDamageBoost: 0.1 },
        150,
        { horn_rabbit_corner: 3 },
        "ツノウサギの角を元に作られた魔力溢れるペンダント"
      ),
      bud_alraune_knife: makeAlrauneWeapon(
        "bud_alraune_knife",
        "アルラナイフ",
        "片手剣",
        "attack",
        18,
        "bud_alraune_attack_knife",
        { alraune_ivy: 4, alraune_bud: 1 },
        { alraune_ivy: 1 }
      ),
      bud_alraune_sword: makeAlrauneWeapon(
        "bud_alraune_sword",
        "アルラソード",
        "両手剣",
        "attack",
        25,
        "bud_alraune_attack_sword",
        { alraune_ivy: 5, alraune_leaf: 1, alraune_bud: 1 },
        { alraune_ivy: 1 }
      ),
      bud_alraune_fist: makeAlrauneWeapon(
        "bud_alraune_fist",
        "アルラフィスト",
        "拳具",
        "attack",
        20,
        "bud_alraune_attack_fist",
        { alraune_bud: 4 },
        { alraune_bud: 1 }
      ),
      bud_alraune_staff: makeAlrauneWeapon(
        "bud_alraune_staff",
        "アルラスタッフ",
        "棒具",
        "attack",
        17,
        "bud_alraune_attack_staff",
        { alraune_ivy: 4, alraune_bud: 1 },
        { alraune_ivy: 1 }
      ),
      bud_alraune_stick: makeAlrauneWeapon(
        "bud_alraune_stick",
        "アルラステッキ",
        "杖",
        "magic",
        15,
        "bud_alraune_attack_stick",
        { alraune_leaf: 4, alraune_ivy: 1 },
        { alraune_leaf: 1 }
      ),
      bud_alraune_book: makeAlrauneWeapon(
        "bud_alraune_book",
        "魔導書・アルラ",
        "魔導書",
        "magic",
        15,
        "bud_alraune_attack_book",
        { alraune_leaf: 8 },
        { alraune_leaf: 1 }
      ),
      bud_alraune_flute: makeAlrauneWeapon(
        "bud_alraune_flute",
        "アルラフルート",
        "楽器",
        "magic",
        25,
        "bud_alraune_attack_flute",
        { alraune_leaf: 3, alraune_bud: 1 },
        { alraune_leaf: 1 }
      ),
      bud_alraune_helm: makeAlrauneArmor(
        "bud_alraune_helm",
        "アルラヘルム",
        "head",
        { maxHp: 0.05, defense: 0.1 },
        { alraune_leaf: 4, alraune_bud: 2 },
        { alraune_leaf: 1, alraune_bud: 1 },
        "アルラウネの葉を元に作られた頭装備"
      ),
      bud_alraune_armor: makeAlrauneArmor(
        "bud_alraune_armor",
        "アルラアーマー",
        "body",
        { maxHp: 0.05, attack: 0.05 },
        { alraune_leaf: 3, alraune_ivy: 3 },
        { alraune_leaf: 1, alraune_ivy: 1 },
        "アルラウネの葉を元に作られた胴装備"
      ),
      bud_alraune_leggings: makeAlrauneArmor(
        "bud_alraune_leggings",
        "アルラレギンス",
        "legs",
        { maxHp: 0.05, attack: 0.03 },
        { alraune_leaf: 2, alraune_ivy: 2 },
        { alraune_leaf: 1, alraune_ivy: 1 },
        "アルラウネの葉を元に作られた足装備"
      ),
      bud_alraune_boots: makeAlrauneArmor(
        "bud_alraune_boots",
        "アルラブーツ",
        "feet",
        { maxHp: 0.1 },
        { alraune_leaf: 2, alraune_bud: 2 },
        { alraune_leaf: 1, alraune_bud: 1 },
        "アルラウネの葉を元に作られた靴装備"
      ),
      bud_alraune_glove: makeAlrauneArmor(
        "bud_alraune_glove",
        "アルラグローブ",
        "hands",
        { attack: 0.08 },
        { alraune_leaf: 2, alraune_ivy: 3 },
        { alraune_leaf: 1, alraune_ivy: 1 },
        "アルラウネの葉を元に作られた手装備"
      ),
      bud_alraune_pendant: makeAlrauneAccessory(
        "bud_alraune_pendant",
        "アルラペンダント",
        { physicalDamageBoost: 0.1 },
        200,
        { alraune_ivy: 5 },
        "アルラウネの蕾を元に作られたペンダント"
      ),
      shadow_wolf_knife: makeShadowWolfWeapon(
        "shadow_wolf_knife",
        "影狼刃",
        "片手剣",
        "attack",
        18,
        "shadow_wolf_attack_knife",
        { shadow_wolf_fur: 2, shadow_wolf_fang: 2 },
        { shadow_wolf_fang: 1 }
      ),
      shadow_wolf_sword: makeShadowWolfWeapon(
        "shadow_wolf_sword",
        "影狼刀",
        "両手剣",
        "attack",
        25,
        "shadow_wolf_attack_sword",
        { shadow_wolf_fur: 1, shadow_wolf_fang: 3 },
        { shadow_wolf_fang: 1 }
      ),
      shadow_wolf_fist: makeShadowWolfWeapon(
        "shadow_wolf_fist",
        "影狼爪",
        "拳具",
        "attack",
        20,
        "shadow_wolf_attack_fist",
        { shadow_wolf_fur: 2, shadow_wolf_nail: 2 },
        { shadow_wolf_nail: 1 }
      ),
      shadow_wolf_staff: makeShadowWolfWeapon(
        "shadow_wolf_staff",
        "影狼薙",
        "棒具",
        "attack",
        17,
        "shadow_wolf_attack_staff",
        { shadow_wolf_fur: 1, shadow_wolf_fang: 1, shadow_wolf_nail: 1 },
        { shadow_wolf_fang: 1 }
      ),
      shadow_wolf_flute: makeShadowWolfWeapon(
        "shadow_wolf_flute",
        "影狼笛",
        "楽器",
        "magic",
        17,
        "shadow_wolf_attack_flute",
        { shadow_wolf_fur: 1, shadow_wolf_fang: 1, shadow_wolf_nail: 1 },
        { shadow_wolf_fang: 1 }
      ),
      shadow_wolf_helm: makeShadowWolfArmor(
        "shadow_wolf_helm",
        "影狼兜",
        "head",
        { attack: 0.08 },
        { shadow_wolf_fur: 3, shadow_wolf_fang: 2 },
        { shadow_wolf_fur: 1, shadow_wolf_fang: 1 },
        "シャドウウルフの毛皮を元に作られた頭装備"
      ),
      shadow_wolf_armor: makeShadowWolfArmor(
        "shadow_wolf_armor",
        "影狼鎧",
        "body",
        { magicDefense: 0.1 },
        { shadow_wolf_fur: 7 },
        { shadow_wolf_fur: 2 },
        "シャドウウルフの毛皮を元に作られた胴装備"
      ),
      shadow_wolf_leggings: makeShadowWolfArmor(
        "shadow_wolf_leggings",
        "影狼脚",
        "legs",
        { maxHp: 0.05 },
        { shadow_wolf_fur: 4 },
        { shadow_wolf_fur: 2 },
        "シャドウウルフの毛皮を元に作られた足装備"
      ),
      shadow_wolf_boots: makeShadowWolfArmor(
        "shadow_wolf_boots",
        "影狼靴",
        "feet",
        { attack: 0.05 },
        { shadow_wolf_fur: 2, shadow_wolf_nail: 2 },
        { shadow_wolf_fur: 1, shadow_wolf_nail: 1 },
        "シャドウウルフの毛皮を元に作られた靴装備"
      ),
      shadow_wolf_glove: makeShadowWolfArmor(
        "shadow_wolf_glove",
        "影狼手",
        "hands",
        { defense: 0.05 },
        { shadow_wolf_fur: 2 },
        { shadow_wolf_fur: 1 },
        "シャドウウルフの毛皮を元に作られた手装備"
      ),
      shadow_wolf_pendant: makeShadowWolfAccessory(
        "shadow_wolf_pendant",
        "影狼飾",
        { critChance: 0.1 },
        200,
        { shadow_wolf_nail: 5 },
        "シャドウウルフの爪を元に作られたペンダント"
      ),
    },
    series: seriesData.series,
  };
})();
