import { COLLECTIBLE_TYPE, LANE_ENTITY_KIND } from "../shared/contracts.js";

// Add an entry here when a new coin type becomes available for spawning.
export const COIN_DEFINITIONS = [
  {
    kind: LANE_ENTITY_KIND.COIN,
    type: COLLECTIBLE_TYPE.COIN,
    value: 1,
    widthRatio: 0.16,
    heightRatio: 0.16,
    bottomOffsetRatio: 0.12,
  },
  {
    kind: LANE_ENTITY_KIND.COIN,
    type: COLLECTIBLE_TYPE.STAR_COIN,
    value: 5,
    widthRatio: 0.22,
    heightRatio: 0.22,
    bottomOffsetRatio: 0.12,
  },
];
