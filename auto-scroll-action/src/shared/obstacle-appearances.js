import { OBSTACLE_TYPE } from "./contracts.js";

export const OBSTACLE_APPEARANCE = Object.freeze({
  PUMPKIN_LANTERN: "pumpkinLantern",
  GRAVESTONE: "gravestone",
  LOW_GHOST: "lowGhost",
  FALLEN_BARREL: "fallenBarrel",
  ZOMBIE_HAND: "zombieHand",
  FLOATING_GHOST: "floatingGhost",
  SPIKED_BALL: "spikedBall",
  HANGING_BAT: "hangingBat",
  WEB_SPIDER: "webSpider",
  ZOMBIE: "zombie",
  PUMPKIN_STACK: "pumpkinStack",
  CRATE_STACK: "crateStack",
  BARREL: "barrel",
  SCARECROW: "scarecrow",
  MUMMY: "mummy",
});

const A = OBSTACLE_APPEARANCE;

// Visual variants only. Collision sizes remain defined in lane/obstacles.js.
export const OBSTACLE_APPEARANCES = Object.freeze({
  [OBSTACLE_TYPE.JUMP]: Object.freeze([
    A.PUMPKIN_LANTERN, A.GRAVESTONE, A.LOW_GHOST, A.FALLEN_BARREL, A.ZOMBIE_HAND,
  ]),
  [OBSTACLE_TYPE.DUCK]: Object.freeze([
    A.FLOATING_GHOST, A.SPIKED_BALL, A.HANGING_BAT, A.WEB_SPIDER,
  ]),
  [OBSTACLE_TYPE.LANE_BLOCKER]: Object.freeze([
    A.ZOMBIE, A.PUMPKIN_STACK, A.CRATE_STACK, A.BARREL, A.SCARECROW, A.MUMMY,
  ]),
});

// The top lane has no ceiling to hang a bat or a ball from.
const TOP_LANE_DUCK_APPEARANCES = Object.freeze([
  A.FLOATING_GHOST, A.WEB_SPIDER,
]);

function getAppearancePool(type, lane) {
  return type === OBSTACLE_TYPE.DUCK && lane === 0
    ? TOP_LANE_DUCK_APPEARANCES
    : OBSTACLE_APPEARANCES[type];
}

export function chooseObstacleAppearance(type, random = Math.random, lane) {
  const pool = getAppearancePool(type, lane);
  const candidate = random();
  const value = Number.isFinite(candidate) ? candidate : 0;
  return pool[Math.min(pool.length - 1, Math.max(0, Math.floor(value * pool.length)))];
}

export function normalizeObstacleAppearance(type, appearance, lane) {
  const pool = getAppearancePool(type, lane);
  return pool.includes(appearance) ? appearance : pool[0];
}
