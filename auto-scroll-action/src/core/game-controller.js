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

  function tryGameOverFromObstacle(hasCollision) {
    if (
      state !== RUN_STATE.PLAYING ||
      !hasCollision ||
      !DEBUG_SETTINGS.gameOverOnObstacleCollision
    ) {
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
    isSupplyPaused: () => state === RUN_STATE.SUPPLY,
    pauseForSupply,
    returnToReady,
    resumeFromSupply,
    startRun,
    tryGameOverFromObstacle,
  };
}
