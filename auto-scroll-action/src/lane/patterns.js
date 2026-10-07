import {
  COLLECTIBLE_TYPE,
  LANE_ENTITY_KIND,
  OBSTACLE_TYPE,
} from "../shared/contracts.js";

// レーンに流す障害物やコインの並びを、この配列へパターン単位で追加します。
//
// id: パターンを識別するための重複しない名前です。
// lengthRatio: パターン全体の長さです。1で現在のレーン間隔1つ分になります。
// objects: パターン内へ配置する障害物、コイン、アイテムの一覧です。
//
// distanceRatio: パターン開始地点からの横方向の距離です。1でレーン間隔1つ分です。
// lane: 上のレーンが0、中央が1、下が2です。
// kind: 障害物、コイン、アイテムのどれを配置するか指定します。
// type: kindに対応する具体的な種類を指定します。
export const PLACEMENT_PATTERNS = [
  {
    id: "jump-obstacle-with-coins",
    lengthRatio: 2,
    objects: [
      // 中央レーンの先頭に、ジャンプで避ける障害物を置きます。
      {
        distanceRatio: 0,
        lane: 1,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.JUMP,
      },
      // 障害物を越えた先の中央レーンに、通常コインを2個並べます。
      {
        distanceRatio: 1,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN,
      },
      {
        distanceRatio: 1.35,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN,
      },
    ],
  },
];
