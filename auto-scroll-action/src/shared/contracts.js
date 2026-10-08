// Shared vocabulary. Keep this module declarative so each team can work independently.

export const LANE_COUNT = 3;
export const DEFAULT_LIVES = 1;
export const PLAYER_SCREEN_X_RATIO = 0.2;
// 1 gameplay unit equals the standing player's hitbox width.
export const GAMEPLAY_UNIT_IN_LANE_GAPS = 0.17;

export const PLAYER_ACTION = Object.freeze({
  DUCK: "duck",
  JUMP: "jump",
  MOVE_UP: "moveUp",
  MOVE_DOWN: "moveDown",
});

export const RUN_STATE = Object.freeze({
  READY: "ready",
  PLAYING: "playing",
  GAME_OVER: "gameOver",
});

export const LANE_ENTITY_KIND = Object.freeze({
  OBSTACLE: "obstacle",
  COIN: "coin",
  ITEM: "item",
});

export const OBSTACLE_TYPE = Object.freeze({
  LANE_BLOCKER: "laneBlocker",
  JUMP: "jump",
  DUCK: "duck",
});

export const COLLECTIBLE_TYPE = Object.freeze({
  COIN_HIGH: "coinHigh",
  COIN_MIDDLE: "coinMiddle",
  COIN_LOW: "coinLow",
  SPECIAL_COIN: "specialCoin",
  BARRIER: "barrier",
  SPEED_UP: "speedUp",
  SCORE_UP: "scoreUp",
  OBSTACLE_BREAKER: "obstacleBreaker",
  COIN_MAGNET: "coinMagnet",
});
