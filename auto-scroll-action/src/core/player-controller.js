import { LANE_COUNT, PLAYER_ACTION } from "../shared/contracts.js";

const INITIAL_JUMP_SPEED = 340;
const DOUBLE_JUMP_SPEED = 520;
const GRAVITY = 2000;
const LANE_CHANGE_SPEED = 7;

export function createPlayerController() {
  let lanePosition = 1;
  let targetLane = 1;
  let elevation = 0;
  let verticalSpeed = 0;
  let jumpCount = 0;
  let duckRequested = false;

  function startJump(speed) {
    verticalSpeed = speed;
  }

  function handleAction(action, isActive = false) {
    if (action === PLAYER_ACTION.DUCK) {
      duckRequested = isActive;
      return;
    }

    if (action === PLAYER_ACTION.MOVE_DOWN) {
      targetLane = Math.min(targetLane + 1, LANE_COUNT - 1);
      return;
    }

    if (action !== PLAYER_ACTION.JUMP || duckRequested) {
      return;
    }

    if (jumpCount === 0) {
      jumpCount = 1;
      startJump(INITIAL_JUMP_SPEED);
      return;
    }

    if (jumpCount === 1 && targetLane > 0) {
      jumpCount = 2;
      targetLane -= 1;
      startJump(DOUBLE_JUMP_SPEED);
    }
  }

  function update(deltaSeconds) {
    lanePosition += (targetLane - lanePosition) * Math.min(1, LANE_CHANGE_SPEED * deltaSeconds);

    if (jumpCount === 0) {
      return;
    }

    elevation += verticalSpeed * deltaSeconds;
    verticalSpeed -= GRAVITY * deltaSeconds;

    if (elevation <= 0) {
      elevation = 0;
      verticalSpeed = 0;
      jumpCount = 0;
    }
  }

  function getSnapshot() {
    return {
      lanePosition,
      elevation,
      isDucking: duckRequested && jumpCount === 0,
    };
  }

  return {
    getSnapshot,
    handleAction,
    update,
  };
}
