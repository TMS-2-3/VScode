(function initDungeonWeights(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HEALER_DUNGEON_WEIGHTS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonWeights() {
  "use strict";

  const MAX_WEIGHT = 1000000;

  function normalizeWeight(value) {
    const integer = Number.isFinite(value) ? Math.floor(value) : NaN;
    if (!Number.isSafeInteger(integer) || integer < 1 || integer > MAX_WEIGHT) throw new Error(`重みは1～${MAX_WEIGHT}の整数にしてください。`);
    return integer;
  }

  function select(entries, random) {
    if (!entries.length) return null;
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    if (total <= 0) return null;
    let cursor = random() * total;
    for (const entry of entries) {
      cursor -= entry.weight;
      if (cursor <= 0) return entry;
    }
    return entries[entries.length - 1];
  }

  return Object.freeze({ MAX_WEIGHT, normalizeWeight, select });
});
