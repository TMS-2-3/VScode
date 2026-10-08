import {
  COLLECTIBLE_TYPE,
  GAMEPLAY_UNIT_IN_LANE_GAPS,
  LANE_ENTITY_KIND,
  OBSTACLE_TYPE,
} from "../shared/contracts.js";

// レーンに流す障害物やコインの並びを、この配列へパターン単位で追加します。
//
// id: パターンを識別するための重複しない名前です。
// rare: trueなら通常抽選後に35%の出現判定を行い、falseならそのまま出現します。
// lengthRatio: パターン全体の長さです。1で現在のレーン間隔1つ分になります。
// objects: パターン内へ配置する障害物とコインの一覧です。
//
// distanceRatio: パターン開始地点からの横方向の距離です。1でレーン間隔1つ分です。
//                値が小さいものほどプレイヤーの手前へ先に流れてきます。
// lane: 上のレーンが0、中央が1、下が2です。
// kind: 障害物とコインのどちらを配置するか指定します。
// type: kindに対応する具体的な種類を指定します。
export const PLACEMENT_PATTERNS = [
  // 中央レーンのジャンプ障害物を、中段・上段・中段のコインで案内します。
  {
    id: "jump-obstacle-with-coins",
    rare: false,
    lengthRatio: 2.3,
    objects: [
      {
        distanceRatio: 0.4,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 0.7,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_HIGH,
      },
      {
        distanceRatio: 1,
        lane: 1,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.JUMP,
      },
      {
        distanceRatio: 1.3,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_HIGH,
      },
      {
        distanceRatio: 1.6,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 1.9,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
    ],
  },
  // 上段をふさぎ、中央レーンのしゃがみ障害物の下に低いコインを2枚置きます。
  {
    id: "duck-obstacle",
    rare: false,
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0.85,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_LOW,
      },
      {
        distanceRatio: 1,
        lane: 0,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
      {
        distanceRatio: 1,
        lane: 1,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.DUCK,
      },
      {
        distanceRatio: 1.15,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_LOW,
      },
    ],
  },
  // 上段に低いコインを置き、上と下をふさいだ先の中央ルートをコインで示します。
  {
    id: "upper-and-lower",
    rare: false,
    lengthRatio: 2 + GAMEPLAY_UNIT_IN_LANE_GAPS,
    objects: [
      {
        distanceRatio: 0,
        lane: 0,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_LOW,
      },
      {
        distanceRatio: 0.4,
        lane: 0,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_LOW,
      },
      {
        distanceRatio: 0.6 + GAMEPLAY_UNIT_IN_LANE_GAPS,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 1 + GAMEPLAY_UNIT_IN_LANE_GAPS,
        lane: 0,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
      {
        distanceRatio: 1 + GAMEPLAY_UNIT_IN_LANE_GAPS,
        lane: 2,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
      {
        distanceRatio: 1 + GAMEPLAY_UNIT_IN_LANE_GAPS,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 1.4 + GAMEPLAY_UNIT_IN_LANE_GAPS,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
    ],
  },
  // 上と中央をふさぎ、下段レーンの安全な通り道を中段コインで示します。
  {
    id: "upper-and-middle",
    rare: false,
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0.6,
        lane: 2,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 1,
        lane: 0,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
      {
        distanceRatio: 1,
        lane: 1,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
      {
        distanceRatio: 1,
        lane: 2,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 1.4,
        lane: 2,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
    ],
  },
  // 中央と下をふさぎ、上段レーンの安全な通り道を中段コインで示します。
  {
    id: "middle-and-lower",
    rare: false,
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0.6,
        lane: 0,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 1,
        lane: 1,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
      {
        distanceRatio: 1,
        lane: 2,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
      {
        distanceRatio: 1,
        lane: 0,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 1.4,
        lane: 0,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
    ],
  },
  // 上段レーンの障害物の手前に、中段コインを2枚並べます。
  {
    id: "upper-only",
    rare: false,
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0,
        lane: 0,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 0.4,
        lane: 0,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 1,
        lane: 0,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
    ],
  },
  // 中央レーンの障害物の手前に、中段コインを2枚並べます。
  {
    id: "middle-only",
    rare: false,
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 0.4,
        lane: 1,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_MIDDLE,
      },
      {
        distanceRatio: 1,
        lane: 1,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
    ],
  },
  // 下段レーンの障害物の手前に、上段コインを2枚並べます。
  {
    id: "lower-only",
    rare: false,
    lengthRatio: 2,
    objects: [
      {
        distanceRatio: 0,
        lane: 2,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_HIGH,
      },
      {
        distanceRatio: 0.4,
        lane: 2,
        kind: LANE_ENTITY_KIND.COIN,
        type: COLLECTIBLE_TYPE.COIN_HIGH,
      },
      {
        distanceRatio: 1,
        lane: 2,
        kind: LANE_ENTITY_KIND.OBSTACLE,
        type: OBSTACLE_TYPE.LANE_BLOCKER,
      },
    ],
  },
];

// ランダム配置時の初期位置と、パターン間隔を設定します。
export const PATTERN_RULES = {
  // 0なら最初のパターンを画面右端から流し始めます。
  initialOffsetViewportRatio: 0,
  minimumSpacingViewportRatio: 0.36,
  minimumSpacingLaneGapRatio: 0.72,
  gapUnits: 2,
  rareAppearanceRate: 0.35,
};

export function choosePlacementPattern(previousPatternId, random = Math.random) {
  const candidates = PLACEMENT_PATTERNS.filter((pattern) => pattern.id !== previousPatternId);
  const availablePatterns = candidates.length > 0 ? candidates : PLACEMENT_PATTERNS;

  if (availablePatterns.length === 0) {
    throw new Error("配置パターンが1つも登録されていません。");
  }

  return choosePatternWithRareCheck(availablePatterns, random);
}

function choosePatternWithRareCheck(candidates, random) {
  const selectedIndex = Math.floor(random() * candidates.length);
  const selectedPattern = candidates[selectedIndex];

  if (
    !selectedPattern.rare ||
    random() < PATTERN_RULES.rareAppearanceRate ||
    candidates.length === 1
  ) {
    return selectedPattern;
  }

  const rerollCandidates = candidates.filter((_, index) => index !== selectedIndex);
  return choosePatternWithRareCheck(rerollCandidates, random);
}

export function getInitialSpawnDistance(traveledDistance, viewportWidth) {
  return traveledDistance - viewportWidth * PATTERN_RULES.initialOffsetViewportRatio;
}

export function getPatternSpacing(pattern, viewportWidth, laneGap) {
  const existingSpacing = Math.max(
    viewportWidth * PATTERN_RULES.minimumSpacingViewportRatio,
    laneGap * Math.max(pattern.lengthRatio, PATTERN_RULES.minimumSpacingLaneGapRatio),
  );
  const additionalUnitSpacing =
    laneGap * GAMEPLAY_UNIT_IN_LANE_GAPS * PATTERN_RULES.gapUnits;

  return existingSpacing + additionalUnitSpacing;
}

