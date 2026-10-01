import { LANE_ENTITY_KIND } from "../shared/contracts.js";
import { COIN_DEFINITIONS } from "./coins.js";
import { ITEM_DEFINITIONS } from "./items.js";
import { OBSTACLE_DEFINITIONS } from "./obstacles.js";

// A future spawn system can select definitions from these arrays.
export const SPAWN_POOLS = {
  [LANE_ENTITY_KIND.OBSTACLE]: OBSTACLE_DEFINITIONS,
  [LANE_ENTITY_KIND.COIN]: COIN_DEFINITIONS,
  [LANE_ENTITY_KIND.ITEM]: ITEM_DEFINITIONS,
};
