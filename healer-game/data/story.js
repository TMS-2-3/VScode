(() => {
  "use strict";

  window.createHealerStoryData = function createHealerStoryData(context) {
    const { getPlayerFirstName, getPlayerLastName, getPlayerFullName, getPlayerPronoun, getTileMap } = context;

    const TUTORIAL_STORY_QUEST_ID = "story_horn_rabbit_competition_001";
    const PATH_AHEAD_STORY_QUEST_ID = "story_path_ahead_001";

    function getPlayerLastNameText() {
      return typeof getPlayerLastName === "function" ? getPlayerLastName() : "フィナルド";
    }

    function getPlayerPronounText() {
      return typeof getPlayerPronoun === "function" ? getPlayerPronoun() : "私";
    }

    function getQuestMapName(quest) {
      if (!quest || !quest.fieldMapId || typeof getTileMap !== "function") {
        return String(quest && (quest.destinationName || quest.fieldLocation || quest.recommended) || "").trim();
      }
      const map = getTileMap(quest.fieldMapId);
      const mapName = String(map && (map.name || map.label || map.title) || "").trim();
      return mapName || String(quest.destinationName || quest.fieldLocation || quest.recommended || "").trim();
    }

    function getOpeningStory() {
      const name = getPlayerFirstName();
      return [
        { speaker: name, text: "今日はついに応募していたパーティーの顔合わせか" },
        { speaker: name, text: "あの強力な魔王の討伐を目標に募集されていたんだ" },
        { speaker: name, text: "どんな人達か楽しみだな" },
        { speaker: name, text: "集合場所は依頼所だ、さっそく会いに行こう" },
      ];
    }

    function getMeetingStory() {
      const name = getPlayerFirstName();
      return [
        { speaker: "ウルペス", text: "僕の方が強いに決まってるだろ" },
        { speaker: "リハス", text: "お前みたいなチビの方が強いだぁ？" },
        { speaker: "リハス", text: "見ろよ。この身体を、筋肉を。お前なんか一捻りだ" },
        { speaker: "ウルペス", text: "ふっ、筋肉がすべてなわけないだろ。この筋肉バカめ" },
        { speaker: "スシア", text: "アホとバカ、少しは落ち着きなさいよ。どっちも大して強くないんだから" },
        { speaker: "ウルペス＆リハス", text: "誰がアホ/バカだ！！！" },
        { speaker: "スシア", text: "４人目、来たわよ。ほんと、呆れる" },
        { speaker: name, text: "(もしかしてずっと喧嘩してた…？)" },
        { speaker: name, text: `えーと、白魔法士の${getPlayerFullName()}です。よろしくお願いします…` },
        { speaker: "ウルペス", text: "イケメン剣士のウルペス・トゥルスだ。よろしく頼む" },
        { speaker: "リハス", text: "一番強い、モンクのリハス・タインだ。せいぜい足引っ張んなよ" },
        { speaker: "ウルペス", text: "なっ、僕の方が強いと言っているだろう！" },
        { speaker: "スシア", text: "このバカ２人は気にしなくていいから" },
        { speaker: "スシア", text: "黒魔法士のストゥード…" },
        { speaker: "スシア", text: "スシア・ストゥードよ。一応、よろしく" },
        { speaker: "ウルペス", text: "誰がバカだ！このガキ！" },
        { speaker: "リハス", text: "そうだ！俺様が一番強いのは一目瞭然だろう" },
        { speaker: "スシア", text: "じゃあ、４人揃ったことだし、依頼で勝負する？" },
        { speaker: "リハス", text: "いいだろう、俺様の勝ちは見えているがな！ガハハハハ" },
        { speaker: "ウルペス", text: "僕が一番ということを証明してやろう" },
        { speaker: name, text: "(このパーティー…大丈夫かな…)" },
        { text: "依頼を受けましょう！依頼所で受けることができます！" },
      ];
    }

    function getQuestAcceptedStory(quest) {
      if (!quest || quest.id !== TUTORIAL_STORY_QUEST_ID) {
        return [];
      }
      const name = getPlayerFirstName();
      const mapName = getQuestMapName(quest) || "森";
      return [
        { speaker: "スシア", text: "今回の依頼の魔物は雑魚ね" },
        { speaker: "リハス", text: "早く行こうぜ！俺様の実力見せてやるよ！" },
        { speaker: "ウルペス", text: "ふっ、僕が一番多く倒して見せるさ" },
        { speaker: name, text: "じゃっ、じゃあ、早く行こうか" },
        { speaker: name, text: `ツノウサギが多く生息しているのは${mapName}の方だね` },
        { speaker: name, text: "(みんなずっとこの調子なのかな…)" },
      ];
    }

    function getQuestEncounterStory(quest) {
      if (!quest) {
        return [];
      }
      if (quest.id === PATH_AHEAD_STORY_QUEST_ID) {
        return [
          { speaker: "ウルペス", text: "なんだこの魔物、弱そうな見た目してるな" },
          { speaker: "リハス", text: "俺様がぶっ倒してやる" },
        ];
      }
      if (quest.id !== TUTORIAL_STORY_QUEST_ID) {
        return [];
      }
      return [
        { speaker: "ウルペス", text: "発見！僕が一番強いということを証明してやろう！" },
        { speaker: "リハス", text: "どけ！俺様が一番に決まっているだろ！" },
        { speaker: "スシア", text: "戦うときくらい足並みそろえましょうよ" },
        { speaker: "スシア", text: "ほんと、バカなのかしら" },
      ];
    }

    function getQuestCompletedStory(quest) {
      if (!quest) {
        return [];
      }
      if (quest.id === PATH_AHEAD_STORY_QUEST_ID) {
        return [
          { speaker: "スシア", text: "なんだか不気味な魔物だったわね" },
          { speaker: "アルジュナ", text: "確かに、なんとなくだけど" },
          { speaker: "リハス", text: "はっはっはっ！お前ら、あんな雑魚相手にいつまでビビってんの？" },
          { speaker: "ウルペス", text: "そうだぞ、一体あの雑魚のどこが不気味だったんだ？" },
          { speaker: "スシア", text: "それもそうね、気のせいだったと思うわ" },
          { speaker: "ウルペス", text: "この先が僕が住んでいた村だ" },
          { speaker: "ウルペス", text: "早く行くぞ！" },
        ];
      }
      if (quest.id !== TUTORIAL_STORY_QUEST_ID) {
        return [];
      }
      const name = getPlayerFirstName();
      const lastName = getPlayerLastNameText();
      const pronoun = getPlayerPronounText();
      return [
        { speaker: "スシア", text: "それで、みんなは何体倒せたのかな？" },
        { speaker: "リハス", text: "俺様が１体も倒せなかったなんて" },
        { speaker: "ウルペス", text: "僕が…負けたなんて" },
        { speaker: name, text: `${pronoun}も１体も倒せなかった…` },
        { speaker: "スシア", text: `${lastName}は白魔法士だから当然じゃない？` },
        { speaker: "リハス", text: "認めよう…スシア…" },
        { speaker: "リハス", text: "俺様くらいは強いんだな" },
        { speaker: "スシア", text: "上から目線でどうも" },
        { speaker: "ウルペス", text: "あぁ、そうだな" },
        { speaker: "ウルペス", text: "僕の次くらいには強いな" },
        { speaker: "スシア", text: "トゥルスの次とか光栄で仕方がないわね…" },
        { speaker: "スシア", text: "まあ、みんなセンスはあるんじゃない？" },
        { speaker: name, text: "(まだみんなプライドがあるけど仲良くなれそうでよかった…)" },
        { speaker: name, text: "みんな！改めて、これからよろしくね！" },
        { speaker: name, text: "(まだちょっと不安だけど)" },
        { speaker: "ウルペス", text: "あぁ！僕達で魔王を討伐するぞー！" },
        { speaker: "リハス", text: "俺様に任せな！" },
        { speaker: "スシア", text: "そうね、頑張りましょ" },
        { speaker: "ウルペス", text: "早速提案なんだが" },
        { speaker: "ウルペス", text: "森を少し歩いた所に僕が住んでいた村があるんだ" },
        { speaker: "ウルペス", text: "そこの近くの洞窟の奥には伝説の剣があるという噂を昔から聞いているんだ" },
        { speaker: "ウルペス", text: "魔王討伐には強い武器が必要だからな" },
        { speaker: "ウルペス", text: "まずはそこに行かないか？" },
        { speaker: "リハス", text: "伝説の剣か…ワクワクするなぁ！" },
        { speaker: "スシア", text: "魔王城に向かうのにも森を歩く必要はあるし、いいと思うわ" },
        { speaker: name, text: `うん、${pronoun}も賛成するよ` },
        { speaker: "ウルペス", text: "そうと決まれば、早速出発だ！" },
        { speaker: name, text: "準備も忘れないようにしよう" },
      ];
    }

    return {
      getOpeningStory,
      getMeetingStory,
      getQuestAcceptedStory,
      getQuestEncounterStory,
      getQuestCompletedStory,
    };
  };
})();
