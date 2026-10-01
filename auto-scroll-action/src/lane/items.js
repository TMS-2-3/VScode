import { COLLECTIBLE_TYPE, LANE_ENTITY_KIND } from "../shared/contracts.js";

// Add an entry here when a new item type becomes available for spawning.
export const ITEM_DEFINITIONS = [
  COLLECTIBLE_TYPE.BARRIER,
  COLLECTIBLE_TYPE.SPEED_UP,
  COLLECTIBLE_TYPE.SCORE_UP,
  COLLECTIBLE_TYPE.OBSTACLE_BREAKER,
  COLLECTIBLE_TYPE.COIN_MAGNET,
].map((type) => ({
  kind: LANE_ENTITY_KIND.ITEM,
  type,
  widthRatio: 0.22,
  heightRatio: 0.22,
  bottomOffsetRatio: 0.1,
}));
