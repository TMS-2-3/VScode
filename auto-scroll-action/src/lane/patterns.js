import {
  COLLECTIBLE_TYPE,
  LANE_ENTITY_KIND,
  OBSTACLE_TYPE,
} from "../shared/contracts.js";

// レーンに流す障害物やコインの並びを、この配列へパターン単位で追加します。
//
// id: パターンを識別するための重複しない名前です。
// lengthRatio: パターン全体の長さです。1で現在のレーン間隔1つ分になります。
// objects: パターン内へ配置する障害物とコインの一覧です。
//
// distanceRatio: パターン開始地点からの横方向の距離です。1でレーン間隔1つ分です。
// lane: 上のレーンが0、中央が1、下が2です。
// kind: 障害物とコインのどちらを配置するか指定します。
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
  // 中央レーンに、しゃがんで避ける障害物を置きます。
  {
    id: "duck-obstacle",
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0,
        lane: 1,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.DUCK,
      },
    ],
  },
  // 上と下のレーンを障害物でふさぎます。
  {
    id: "upper-and-lower",
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0,
        lane: 0,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
      {
        distanceRatio: 0,
        lane: 2,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
    ],
  },
  // 上と中央のレーンを障害物でふさぎます。
  {
    id: "upper-and-middle",
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0,
        lane: 0,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
      {
        distanceRatio: 0,
        lane: 1,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
    ],
  },
  // 中央と下のレーンを障害物でふさぎます。
  {
    id: "middle-and-lower",
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0,
        lane: 1,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
      {
        distanceRatio: 0,
        lane: 2,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
    ],
  },
  // 上のレーンだけに障害物を置きます。
  {
    id: "upper-only",
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0,
        lane: 0,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
    ],
  },
  // 中央のレーンだけに障害物を置きます。
  {
    id: "middle-only",
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0,
        lane: 1,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
    ],
  },
  // 下のレーンだけに障害物を置きます。
  {
    id: "lower-only",
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0,
        lane: 2,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
    ],
  },
];

// ランダム配置時の初期位置と、パターン間隔を設定します。
export const PATTERN_RULES = {
  initialOffsetViewportRatio: 0.56,
  minimumSpacingViewportRatio: 0.36,
  minimumSpacingLaneGapRatio: 0.72,
};

export function choosePlacementPattern(previousPatternId, random = Math.random) {
  const candidates = PLACEMENT_PATTERNS.filter((pattern) => pattern.id !== previousPatternId);
  return candidates[Math.floor(random() * candidates.length)];
}

export function getInitialSpawnDistance(traveledDistance, viewportWidth) {
  return traveledDistance - viewportWidth * PATTERN_RULES.initialOffsetViewportRatio;
}

export function getPatternSpacing(pattern, viewportWidth, laneGap) {
  return Math.max(
    viewportWidth * PATTERN_RULES.minimumSpacingViewportRatio,
    laneGap * Math.max(pattern.lengthRatio, PATTERN_RULES.minimumSpacingLaneGapRatio),
  );
}

