import { OBSTACLE_TYPE } from "./contracts.js";

export const OBSTACLE_APPEARANCE = Object.freeze({
  PUMPKIN_LANTERN: "pumpkinLantern",
  GRAVESTONE: "gravestone",
  LOW_GHOST: "lowGhost",
  FALLEN_BARREL: "fallenBarrel",
  ZOMBIE_HAND: "zombieHand",
  CAULDRON: "cauldron",
  JACK_IN_THE_BOX: "jackInTheBox",
  FLOATING_GHOST: "floatingGhost",
  SPIKED_BALL: "spikedBall",
  HANGING_BAT: "hangingBat",
  WEB_SPIDER: "webSpider",
  FLYING_WITCH: "flyingWitch",
  FLYING_BAT: "flyingBat",
  ZOMBIE: "zombie",
  PUMPKIN_STACK: "pumpkinStack",
  CRATE_STACK: "crateStack",
  BARREL: "barrel",
  SCARECROW: "scarecrow",
  MUMMY: "mummy",
  COFFIN: "coffin",
  SKELETON: "skeleton",
  PUMPKIN_PERSON: "pumpkinPerson",
  SAW_BLADE: "sawBlade",
});

const A = OBSTACLE_APPEARANCE;

// Visual variants only. Collision sizes remain defined in lane/obstacles.js.
export const OBSTACLE_APPEARANCES = Object.freeze({
  [OBSTACLE_TYPE.JUMP]: Object.freeze([
    A.PUMPKIN_LANTERN, A.GRAVESTONE, A.LOW_GHOST, A.FALLEN_BARREL, A.ZOMBIE_HAND,
    A.CAULDRON, A.SAW_BLADE, A.JACK_IN_THE_BOX,
  ]),
  [OBSTACLE_TYPE.DUCK]: Object.freeze([
    A.FLOATING_GHOST, A.SPIKED_BALL, A.HANGING_BAT, A.WEB_SPIDER,
    A.FLYING_WITCH, A.SAW_BLADE, A.FLYING_BAT,
  ]),
  [OBSTACLE_TYPE.LANE_BLOCKER]: Object.freeze([
    A.ZOMBIE, A.PUMPKIN_STACK, A.CRATE_STACK, A.BARREL, A.SCARECROW, A.MUMMY,
    A.COFFIN, A.SAW_BLADE, A.SKELETON, A.PUMPKIN_PERSON,
  ]),
});

// The top lane has no ceiling to hang a bat or a ball from.
const TOP_LANE_DUCK_APPEARANCES = Object.freeze(
  OBSTACLE_APPEARANCES[OBSTACLE_TYPE.DUCK].filter(
    (appearance) => appearance !== A.SPIKED_BALL && appearance !== A.HANGING_BAT,
  ),
);

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
