(() => {
  "use strict";

  window.HEALER_RANK_DATA = {
    order: ["D", "C", "B", "A", "S"],
    initialRank: "D",
    rankUpCondition: "clearAllStoryQuestsInRank",
    ranks: {
      D: { key: "D", armorStatTotal: 30 },
      C: { key: "C", armorStatTotal: 60 },
      B: { key: "B", armorStatTotal: 90 },
      A: { key: "A", armorStatTotal: 120 },
      S: { key: "S", armorStatTotal: 150 },
    },
    equipmentUpgradeMultipliers: [1.1, 1.2, 1.3, 1.4, 1.5],
  };
})();
