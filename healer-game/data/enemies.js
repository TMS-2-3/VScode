(() => {
  "use strict";

  const spatialScale = window.HEALER_CONFIG && Number.isFinite(window.HEALER_CONFIG.battleSpatialScale)
    ? window.HEALER_CONFIG.battleSpatialScale
    : 1;
  const px = (value) => Math.max(1, Math.round(value * spatialScale));

  window.HEALER_ENEMY_DEFS = {
    brute: {
      label: "魔",
      hp: 110,
      speed: px(74),
      radius: px(15),
      attack: 6,
      defense: 100,
      magicDefense: 100,
      element: "none",
      elementResistances: {},
      color: "#c95d4e",
    },
    skirmisher: {
      label: "魔",
      hp: 80,
      speed: px(118),
      radius: px(13),
      attack: 4,
      defense: 100,
      magicDefense: 100,
      element: "none",
      elementResistances: {},
      color: "#d88468",
    },
    smallVanguard: {
      label: "小",
      hp: 62,
      speed: px(128),
      radius: px(11),
      attack: 4,
      defense: 100,
      magicDefense: 100,
      element: "none",
      elementResistances: {},
      color: "#e69763",
    },
    caster: {
      label: "射",
      hp: 70,
      speed: px(62),
      radius: px(13),
      attack: 6,
      defense: 100,
      magicDefense: 100,
      element: "none",
      elementResistances: {},
      color: "#a0506e",
    },
    elite: {
      label: "魔",
      hp: 250,
      speed: px(68),
      radius: px(22),
      attack: 10,
      defense: 100,
      magicDefense: 100,
      element: "none",
      elementResistances: {},
      color: "#8e453f",
    },
  };
})();
