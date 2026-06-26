(() => {
  "use strict";

  window.createHealerWalletSystem = function createHealerWalletSystem(context) {
    const {
      game,
      MATERIAL_DATA,
    } = context;

    const currencyKey = "gold";

    function getGoldUnit() {
      const currency = MATERIAL_DATA && MATERIAL_DATA.currencies && MATERIAL_DATA.currencies[currencyKey];
      return currency && currency.unit ? currency.unit : "G";
    }

    function normalizeGold() {
      if (!Number.isFinite(game.gold)) {
        game.gold = 0;
      }
      game.gold = Math.max(0, Math.floor(game.gold));
      return game.gold;
    }

    function getGold() {
      return normalizeGold();
    }

    function setGold(amount) {
      game.gold = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
      return game.gold;
    }

    function addGold(amount) {
      const delta = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
      return setGold(getGold() + delta);
    }

    function canAffordGold(amount) {
      const cost = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
      return getGold() >= cost;
    }

    function spendGold(amount) {
      const cost = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
      if (!canAffordGold(cost)) {
        return false;
      }
      setGold(getGold() - cost);
      return true;
    }

    function formatGold(amount = getGold()) {
      const value = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
      return `${value}${getGoldUnit()}`;
    }

    return {
      getGold,
      setGold,
      addGold,
      canAffordGold,
      spendGold,
      formatGold,
      getGoldUnit,
    };
  };
})();
