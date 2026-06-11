(() => {
  "use strict";

  window.createHealerStoryData = function createHealerStoryData(context) {
    const { getPlayerFirstName, getPlayerFullName } = context;

    function getOpeningStory() {
      const name = getPlayerFirstName();
      return [
        { speaker: name, text: "今日はついに応募したパーティーの顔合わせか" },
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
        { speaker: "スシア", text: "アホとバカ、落ち着きなさいよ。私の方が強いんだから" },
        { speaker: "ウルペス＆リハス", text: "誰がアホ/バカだ！" },
        { speaker: "スシア", text: "４人目、来たわよ。ほんと、呆れる" },
        { speaker: name, text: "(もしかしてずっと喧嘩してた…？)" },
        { speaker: name, text: `えーと、白魔法士の${getPlayerFullName()}です。よろしくお願いします…` },
        { speaker: "ウルペス", text: "イケメン剣士のウルペス・トゥルスだ。よろしく頼む" },
        { speaker: "リハス", text: "一番強い、モンクのリハス・タインだ。せいぜい足引っ張んなよ" },
        { speaker: "ウルペス", text: "なっ、僕の方が強いと言っているだろう！" },
        { speaker: "スシア", text: "このバカ２人は気にしなくていいから" },
        { speaker: "スシア", text: "魔法使いのスシアよ。よろしくね" },
        { speaker: "ウルペス", text: "誰がバカだ！このガキ！" },
        { speaker: "リハス", text: "そうだ！俺様が一番強いのは一目瞭然だろう" },
        { speaker: "スシア", text: "じゃあ、４人揃ったことだし、依頼で勝負する？" },
        { speaker: "リハス", text: "いいだろう、俺様の勝ちは見えているがな！ガハハハハ" },
        { speaker: "ウルペス", text: "僕が一番ということを証明してやろう" },
        { speaker: name, text: "(このパーティー…大丈夫かな…)" },
        { text: "依頼を受けましょう！依頼所で受けることができます！" },
      ];
    }

    return {
      getOpeningStory,
      getMeetingStory,
    };
  };
})();
