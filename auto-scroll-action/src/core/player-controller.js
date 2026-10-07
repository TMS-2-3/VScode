import {
  GAMEPLAY_UNIT_IN_LANE_GAPS,
  LANE_COUNT,
  PLAYER_ACTION,
} from "../shared/contracts.js";

const JUMP_DURATION_MULTIPLIER = 1.5;
const GRAVITY = 2000 / (JUMP_DURATION_MULTIPLIER * JUMP_DURATION_MULTIPLIER);
const FALL_GRAVITY_MULTIPLIER = 1.08;
const LANE_DROP_DURATION_SECONDS = 0.63;
const LANE_DROP_INITIAL_PROGRESS_RATE = 0.6;
const LANE_DROP_INPUT_BUFFER_RATIO = 0.1;
const FIRST_JUMP_PEAK_RATIO = 0.6;
const DOUBLE_JUMP_PEAK_RATIO = 1.05;
const LATE_SECOND_JUMP_RATIO = 0.35;
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
  let isDroppingLane = false;
  let laneDropElapsedSeconds = 0;
  let isLaneDropQueued = false;
  let duckRequested = false;

  function startJump(peakRatio) {
    laneDropElapsedSeconds = 0;
    jumpPeak = lanes.getLaneGap() * peakRatio;
    const remainingHeight = Math.max(0, jumpPeak - elevation);
    verticalSpeed = Math.sqrt(2 * GRAVITY * remainingHeight);
  }

  function startLaneDrop() {
    const currentLaneIndex = Math.round(lanePosition);
    const lowerLane = Math.min(currentLaneIndex + 1, LANE_COUNT - 1);

    if (lowerLane === currentLaneIndex) {
      return false;
    }

    // 下降先を基準に高度100%から落とし、1段目を使用済みとして扱う。
    targetLane = lowerLane;
    lanePosition = lowerLane;
    jumpOriginLane = lowerLane;
    elevation = lanes.getLaneGap();
    verticalSpeed = 0;
    jumpCount = 1;
    jumpPeak = elevation;
    upperLandingLane = null;
    isDroppingLane = true;
    laneDropElapsedSeconds = 0;
    isLaneDropQueued = false;
    return true;
  }

  function canQueueLaneDrop() {
    if (verticalSpeed > 0) {
      return false;
    }

    const laneGap = lanes.getLaneGap();
    const landingLane = upperLandingLane ?? Math.round(jumpOriginLane);
    const landingElevation = upperLandingLane === null ? 0 : laneGap;
    const remainingDistance = Math.max(0, elevation - landingElevation);

    return (
      landingLane < LANE_COUNT - 1 &&
      remainingDistance <= laneGap * LANE_DROP_INPUT_BUFFER_RATIO
    );
  }

  function finishLanding(landingLane = lanePosition) {
    const shouldStartQueuedLaneDrop = isLaneDropQueued;

    lanePosition = landingLane;
    targetLane = landingLane;
    elevation = 0;
    verticalSpeed = 0;
    jumpCount = 0;
    jumpPeak = 0;
    jumpOriginLane = lanePosition;
    upperLandingLane = null;
    isDroppingLane = false;
    laneDropElapsedSeconds = 0;
    isLaneDropQueued = false;

    if (shouldStartQueuedLaneDrop) {
      startLaneDrop();
    }
  }

  function reset() {
    lanePosition = 1;
    targetLane = 1;
    elevation = 0;
    verticalSpeed = 0;
    jumpCount = 0;
    jumpPeak = 0;
    jumpOriginLane = lanePosition;
    upperLandingLane = null;
    isDroppingLane = false;
    laneDropElapsedSeconds = 0;
    isLaneDropQueued = false;
    duckRequested = false;
  }

  function handleAction(action, isActive = false) {
    if (action === PLAYER_ACTION.DUCK) {
      duckRequested = isActive;
      return true;
    }

    if (action === PLAYER_ACTION.MOVE_DOWN) {
      if (jumpCount > 0) {
        if (canQueueLaneDrop()) {
          isLaneDropQueued = true;
          return true;
        }

        return false;
      }

      return startLaneDrop();
    }

    if (action !== PLAYER_ACTION.JUMP || duckRequested) {
      return false;
    }

    if (jumpCount === 0) {
      jumpCount = 1;
      jumpOriginLane = lanePosition;
      upperLandingLane = null;
      isDroppingLane = false;
      startJump(FIRST_JUMP_PEAK_RATIO);
      return true;
    }

    if (jumpCount === 1) {
      jumpCount = 2;

      const originLaneIndex = Math.round(jumpOriginLane);
      const isLateSecondJump =
        verticalSpeed < 0 && elevation <= lanes.getLaneGap() * LATE_SECOND_JUMP_RATIO;
      const isTopLaneJump = originLaneIndex === 0;

      // 上昇中でも2回目の入力時点で二段ジャンプへ移行する。
      // 最上段では2回目も、1段ジャンプと同じ高さを上限にする。
      if (isLateSecondJump || isTopLaneJump) {
        upperLandingLane = null;
        isDroppingLane = false;
        startJump(FIRST_JUMP_PEAK_RATIO);
        return true;
      }

      upperLandingLane = originLaneIndex - 1;
      isDroppingLane = false;
      startJump(DOUBLE_JUMP_PEAK_RATIO);
      return true;
    }

    return false;
  }

  function update(deltaSeconds, jumpTimeScale = 1) {
    if (jumpCount === 0) {
      return;
    }

    if (isDroppingLane) {
      const safeDeltaSeconds = Number.isFinite(deltaSeconds)
        ? Math.max(0, deltaSeconds)
        : 0;
      const laneGap = lanes.getLaneGap();
      laneDropElapsedSeconds += safeDeltaSeconds;
      const linearProgress = Math.min(
        1,
        laneDropElapsedSeconds / LANE_DROP_DURATION_SECONDS,
      );
      const easedProgress =
        linearProgress *
        (LANE_DROP_INITIAL_PROGRESS_RATE +
          (1 - LANE_DROP_INITIAL_PROGRESS_RATE) * linearProgress);
      elevation = laneGap * (1 - easedProgress);
      verticalSpeed =
        (-laneGap *
          (LANE_DROP_INITIAL_PROGRESS_RATE +
            2 * (1 - LANE_DROP_INITIAL_PROGRESS_RATE) * linearProgress)) /
        LANE_DROP_DURATION_SECONDS;

      if (linearProgress >= 1) {
        finishLanding();
      }

      return;
    }

    const safeJumpTimeScale = Number.isFinite(jumpTimeScale)
      ? Math.max(1, jumpTimeScale)
      : 1;
    const jumpDeltaSeconds = deltaSeconds * safeJumpTimeScale;
    const wasAscending = verticalSpeed > 0;
    const activeGravity = wasAscending ? GRAVITY : GRAVITY * FALL_GRAVITY_MULTIPLIER;
    elevation +=
      verticalSpeed * jumpDeltaSeconds -
      (activeGravity * jumpDeltaSeconds * jumpDeltaSeconds) / 2;
    verticalSpeed -= activeGravity * jumpDeltaSeconds;

    if (wasAscending && elevation >= jumpPeak) {
      elevation = jumpPeak;
      verticalSpeed = 0;
    }

    if (jumpCount === 2 && upperLandingLane !== null && verticalSpeed <= 0 && elevation <= lanes.getLaneGap()) {
      finishLanding(upperLandingLane);
      return;
    }

    if (elevation <= 0) {
      finishLanding();
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
        width: laneGap * GAMEPLAY_UNIT_IN_LANE_GAPS,
        height: laneGap * (isDucking ? CROUCH_HITBOX_HEIGHT_RATIO : PLAYER_HITBOX_HEIGHT_RATIO),
      },
    };
  }

  return {
    getSnapshot,
    handleAction,
    reset,
    update,
  };
}
