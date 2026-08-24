(() => {
  "use strict";

  window.HEALER_NPC_DATA = {
    npcs: [
      {
        id: "kuraku_villager_equipment_001",
        mapId: "startTown01",
        name: "村人",
        label: "村",
        color: "#f7fff6",
        cell: "T7",
        facing: "down",
        wander: { enabled: true, interval: 2 },
        dialogue: [
          { speaker: "村人", text: "武器や防具を作るのも大事なことだよ" },
          { speaker: "村人", text: "武器は通常攻撃、防具はステータスに大きな影響をもたらす" },
          { speaker: "村人", text: "組み合わせによっては特殊な効果も出ることもあるんだ" },
        ],
      },
      /*
      {
        id: "kuraku_villager_001",
        mapId: "startTown01",
        name: "村人",
        label: "村",
        color: "#f7fff6",
        spriteId: null,
        col: 12,
        row: 10,
        facing: "down",
        wander: { enabled: true, interval: 2 },
        dialogue: [
          { speaker: "村人", text: "こんにちは。" },
        ],
      },
      */
    ],
  };
})();
