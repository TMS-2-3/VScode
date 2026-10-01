// Shared vocabulary. Keep this module declarative so each team can work independently.

export const LANE_COUNT = 3;
export const DEFAULT_LIVES = 1;

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
  DEFAULT: "default",
  DUCK: "duck",
  JUMP: "jump",
  MOVING: "moving",
  PROJECTILE: "projectile",
  ENEMY: "enemy",
});

export const COLLECTIBLE_TYPE = Object.freeze({
  COIN: "coin",
  STAR_COIN: "starCoin",
  BARRIER: "barrier",
  SPEED_UP: "speedUp",
  SCORE_UP: "scoreUp",
  OBSTACLE_BREAKER: "obstacleBreaker",
  COIN_MAGNET: "coinMagnet",
});
