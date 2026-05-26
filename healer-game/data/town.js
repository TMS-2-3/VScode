(() => {
  "use strict";

  window.HEALER_TOWN_DATA = {
    width: 1600,
    height: 1100,
    player: { x: 800, y: 940, radius: 15, speed: 235, color: "#57c7c9" },
    buildings: [
      { id: "inn", name: "宿屋", sign: "宿", x: 170, y: 150, w: 250, h: 170, wall: "#f0c978", roof: "#b95143" },
      { id: "item", name: "アイテム屋", sign: "薬", x: 510, y: 160, w: 250, h: 160, wall: "#d6e7a6", roof: "#3f8d72" },
      { id: "weapon", name: "武器屋", sign: "剣", x: 890, y: 150, w: 260, h: 175, wall: "#d7dce2", roof: "#55616f" },
      { id: "armor", name: "防具屋", sign: "盾", x: 1210, y: 175, w: 240, h: 155, wall: "#d9d3ee", roof: "#655aa0" },
      { id: "guild", name: "依頼所", sign: "依", x: 610, y: 585, w: 380, h: 215, wall: "#e1b07c", roof: "#7f3f4d" },
    ],
    props: [
      { type: "well", x: 790, y: 465, r: 28 },
      { type: "tree", x: 120, y: 430, r: 28 },
      { type: "tree", x: 310, y: 690, r: 30 },
      { type: "tree", x: 1290, y: 455, r: 32 },
      { type: "tree", x: 1470, y: 690, r: 27 },
      { type: "crate", x: 455, y: 395, w: 42, h: 34 },
      { type: "crate", x: 1125, y: 395, w: 50, h: 32 },
    ],
  };
})();
