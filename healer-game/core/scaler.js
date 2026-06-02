(() => {
  "use strict";

  window.createHealerBattleScaler = function createHealerBattleScaler(config) {
    const battleSpatialScale = Number.isFinite(config.battleSpatialScale)
      ? config.battleSpatialScale
      : 1;

    function battlePx(value) {
      return Math.max(1, Math.round(value * battleSpatialScale));
    }

    return {
      battleSpatialScale,
      battlePx,
    };
  };
})();
