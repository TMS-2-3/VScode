import { LANE_ENTITY_KIND, OBSTACLE_TYPE } from "../shared/contracts.js";

// Add an entry here when a new obstacle type becomes available for spawning.
export const OBSTACLE_DEFINITIONS = [
  {
    kind: LANE_ENTITY_KIND.OBSTACLE,
    type: OBSTACLE_TYPE.DEFAULT,
    widthRatio: 0.2,
    heightRatio: 0.35,
    bottomOffsetRatio: 0,
  },
  {
    kind: LANE_ENTITY_KIND.OBSTACLE,
    type: OBSTACLE_TYPE.DUCK,
    widthRatio: 0.34,
    heightRatio: 0.14,
    bottomOffsetRatio: 0.38,
  },
  {
    kind: LANE_ENTITY_KIND.OBSTACLE,
    type: OBSTACLE_TYPE.JUMP,
    widthRatio: 0.2,
    heightRatio: 0.28,
    bottomOffsetRatio: 0,
  },
  {
    kind: LANE_ENTITY_KIND.OBSTACLE,
    type: OBSTACLE_TYPE.MOVING,
    widthRatio: 0.18,
    heightRatio: 0.3,
    bottomOffsetRatio: 0,
  },
  {
    kind: LANE_ENTITY_KIND.OBSTACLE,
    type: OBSTACLE_TYPE.PROJECTILE,
    widthRatio: 0.14,
    heightRatio: 0.14,
    bottomOffsetRatio: 0.22,
  },
  {
    kind: LANE_ENTITY_KIND.OBSTACLE,
    type: OBSTACLE_TYPE.ENEMY,
    widthRatio: 0.2,
    heightRatio: 0.35,
    bottomOffsetRatio: 0,
  },
];
