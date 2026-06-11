(() => {
  "use strict";

  window.HEALER_QUEST_DATA = {
    types: {
      story: { key: "story", name: "ストーリー依頼" },
      free: { key: "free", name: "フリー依頼" },
    },
    quests: [
      {
        id: "story_tutorial_001",
        type: "story",
        rank: "D",
        name: "仮依頼: 町外れの魔物討伐",
        summary: "町外れに集まった魔物を討伐する。今ある仮の戦闘に出発するためのストーリー依頼。",
        objective: "敵を全滅させる",
        recommended: "チュートリアル",
        enemyPreview: "魔物、小術師、大魔物",
        reward: "仮報酬",
        battleId: "tutorial",
      },
    ],
  };
})();
