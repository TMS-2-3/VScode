(() => {
  "use strict";

  const spatialScale = window.HEALER_CONFIG && Number.isFinite(window.HEALER_CONFIG.battleSpatialScale)
    ? window.HEALER_CONFIG.battleSpatialScale
    : 1;
  const px = (value) => Math.max(1, Math.round(value * spatialScale));
  const BASE_PARTY_STATS = {
    maxHp: 500,
    maxMp: 300,
    attack: 100,
    magic: 100,
    defense: 100,
    magicDefense: 100,
  };

  window.HEALER_CHARACTER_DEFS = {
    player: {
      id: "finald",
      name: "アルジュナ",
      label: "主",
      team: "party",
      role: "support",
      color: "#57c7c9",
      radius: px(15),
      ...BASE_PARTY_STATS,
      speed: px(125),
      guardChance: 0,
      equipment: { weapon: "default_a" },
      field: true,
      targetable: true,
      collidable: true,
    },
    allies: [
      {
        id: "ulpes",
        name: "ウルペス",
        label: "ウ",
        team: "party",
        role: "hero",
        color: "#f4c54f",
        radius: px(16),
        ...BASE_PARTY_STATS,
        speed: px(150),
        guardChance: 0.2,
        preferredRange: px(42),
        equipment: { weapon: "default_u" },
      },
      {
        id: "rihas",
        name: "リハス",
        label: "リ",
        team: "party",
        role: "monk",
        color: "#e37a3f",
        radius: px(17),
        ...BASE_PARTY_STATS,
        speed: px(135),
        guardChance: 0.2,
        preferredRange: px(56),
        equipment: { weapon: "default_r" },
      },
      {
        id: "sushia",
        name: "スシア",
        label: "ス",
        team: "party",
        role: "mage",
        color: "#b985ee",
        radius: px(15),
        ...BASE_PARTY_STATS,
        speed: px(120),
        guardChance: 0.2,
        preferredRange: px(260),
        equipment: { weapon: "default_s" },
      },
    ],
  };
})();
