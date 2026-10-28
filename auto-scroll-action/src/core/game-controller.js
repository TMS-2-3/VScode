import { RUN_STATE } from "../shared/contracts.js";

// falseにすると、障害物へ当たってもゲームオーバーになりません。
export const DEBUG_SETTINGS = {
  gameOverOnObstacleCollision: true,
};

export function createGameController() {
  let state = RUN_STATE.READY;

  function startRun() {
    state = RUN_STATE.PLAYING;
  }

  function tryDefeatFromObstacle(hasCollision) {
    if (
      state !== RUN_STATE.PLAYING ||
      !hasCollision ||
      !DEBUG_SETTINGS.gameOverOnObstacleCollision
    ) {
      return false;
    }

    state = RUN_STATE.DEFEATED;
    return true;
  }

  function finishGameOver() {
    if (state !== RUN_STATE.DEFEATED) {
      return false;
    }

    state = RUN_STATE.GAME_OVER;
    return true;
  }

  function pauseForSupply() {
    if (state !== RUN_STATE.PLAYING) {
      return false;
    }

    state = RUN_STATE.SUPPLY;
    return true;
  }

  function resumeFromSupply() {
    if (state !== RUN_STATE.SUPPLY) {
      return false;
    }

    state = RUN_STATE.PLAYING;
    return true;
  }

  function returnToReady() {
    state = RUN_STATE.READY;
  }

  return {
    getState: () => state,
    isPlaying: () => state === RUN_STATE.PLAYING,
    isDefeated: () => state === RUN_STATE.DEFEATED,
    isSupplyPaused: () => state === RUN_STATE.SUPPLY,
    pauseForSupply,
    finishGameOver,
    returnToReady,
    resumeFromSupply,
    startRun,
    tryDefeatFromObstacle,
  };
}
