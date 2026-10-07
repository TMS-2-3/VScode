import { LANE_COUNT, PLAYER_ACTION } from "../shared/contracts.js";

const JUMP_DURATION_MULTIPLIER = 1.5;
const GRAVITY = 2000 / (JUMP_DURATION_MULTIPLIER * JUMP_DURATION_MULTIPLIER);
const LANE_CHANGE_SPEED = 7;
const FIRST_JUMP_PEAK_RATIO = 0.6;
const DOUBLE_JUMP_PEAK_RATIO = 1.2;
const LATE_SECOND_JUMP_RATIO = 0.35;
const PLAYER_HITBOX_WIDTH_RATIO = 0.17;
const PLAYER_HITBOX_HEIGHT_RATIO = 0.35;
const CROUCH_HITBOX_HEIGHT_RATIO = 0.15;

export function createPlayerController(lanes) {
  let lanePosition = 1;
  let targetLane = 1;
  let elevation = 0;
  let verticalSpeed = 0;
  let jumpCount = 0;
  let jumpPeak = 0;
  let jumpOriginLane = lanePosition;
  let upperLandingLane = null;
  let duckRequested = false;

  function startJump(peakRatio) {
    jumpPeak = lanes.getLaneGap() * peakRatio;
    const remainingHeight = Math.max(0, jumpPeak - elevation);
    verticalSpeed = Math.sqrt(2 * GRAVITY * remainingHeight);
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
      jumpOriginLane = lanePosition;
      upperLandingLane = null;
      startJump(FIRST_JUMP_PEAK_RATIO);
      return;
    }

    if (jumpCount === 1) {
      jumpCount = 2;

      const isLateSecondJump =
        verticalSpeed < 0 && elevation <= lanes.getLaneGap() * LATE_SECOND_JUMP_RATIO;

      if (isLateSecondJump) {
        upperLandingLane = null;
        startJump(FIRST_JUMP_PEAK_RATIO);
        return;
      }

      const originLaneIndex = Math.round(jumpOriginLane);
      upperLandingLane = originLaneIndex > 0 ? originLaneIndex - 1 : null;
      startJump(DOUBLE_JUMP_PEAK_RATIO);
    }
  }

  function update(deltaSeconds, jumpTimeScale = 1) {
    if (jumpCount === 0) {
      lanePosition += (targetLane - lanePosition) * Math.min(1, LANE_CHANGE_SPEED * deltaSeconds);
      return;
    }

    const safeJumpTimeScale = Number.isFinite(jumpTimeScale)
      ? Math.max(1, jumpTimeScale)
      : 1;
    const jumpDeltaSeconds = deltaSeconds * safeJumpTimeScale;
    const wasAscending = verticalSpeed > 0;
    elevation +=
      verticalSpeed * jumpDeltaSeconds -
      (GRAVITY * jumpDeltaSeconds * jumpDeltaSeconds) / 2;
    verticalSpeed -= GRAVITY * jumpDeltaSeconds;

    if (wasAscending && elevation >= jumpPeak) {
      elevation = jumpPeak;
      verticalSpeed = 0;
    }

    if (jumpCount === 2 && upperLandingLane !== null && verticalSpeed <= 0 && elevation <= lanes.getLaneGap()) {
      lanePosition = upperLandingLane;
      targetLane = upperLandingLane;
      elevation = 0;
      verticalSpeed = 0;
      jumpCount = 0;
      jumpPeak = 0;
      jumpOriginLane = lanePosition;
      upperLandingLane = null;
      return;
    }

    if (elevation <= 0) {
      elevation = 0;
      verticalSpeed = 0;
      jumpCount = 0;
      jumpPeak = 0;
      jumpOriginLane = lanePosition;
      upperLandingLane = null;
    }
  }

  function getSnapshot() {
    const isDucking = duckRequested && jumpCount === 0;
    const laneGap = lanes.getLaneGap();

    return {
      lanePosition: jumpCount > 0 ? jumpOriginLane : lanePosition,
      elevation,
      isDucking,
      hitbox: {
        width: laneGap * PLAYER_HITBOX_WIDTH_RATIO,
        height: laneGap * (isDucking ? CROUCH_HITBOX_HEIGHT_RATIO : PLAYER_HITBOX_HEIGHT_RATIO),
      },
    };
  }

  return {
    getSnapshot,
    handleAction,
    update,
  };
}
