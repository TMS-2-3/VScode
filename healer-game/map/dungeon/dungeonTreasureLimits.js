(function initDungeonTreasureLimits(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HEALER_DUNGEON_TREASURE_LIMITS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonTreasureLimits() {
  "use strict";

  const defaults = Object.freeze({ min: 0, max: null });

  function normalize(value = defaults, label = "宝箱") {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}数の設定が不正です。`);
    if (Object.keys(value).some((key) => key !== "min" && key !== "max")) throw new Error(`未対応の${label}数設定です。`);
    const min = value.min === undefined ? defaults.min : value.min;
    const max = value.max === undefined ? defaults.max : value.max;
    if (!Number.isSafeInteger(min) || min < 0) throw new Error(`下限${label}数は0以上の整数にしてください。`);
    if (max !== null && (!Number.isSafeInteger(max) || max < 0)) throw new Error(`上限${label}数は0以上の整数か、なしにしてください。`);
    if (max !== null && min > max) throw new Error(`上限${label}数は下限${label}数以上にしてください。`);
    return { min, max };
  }

  return Object.freeze({ defaults, normalize });
});
