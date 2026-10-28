const BASE_SCROLL_SPEED_IN_LANES = 1;
const SPEED_INCREASE_PER_CANDY_IN_LANES = 0.0058;
const MAX_SCROLL_SPEED_IN_LANES = 5;

export const SPEED_BOOST_RULES = Object.freeze({
  durationSeconds: 7.5,
  fadeDurationSeconds: 1,
  speedIncreaseRatio: 0.6,
  stackEffectMultiplier: 0.5,
  jumpDistanceIncreaseRatio: 0.1,
});

export function createProgression() {
  let traveledDistance = 0;
  let scrollSpeedInLanes = BASE_SCROLL_SPEED_IN_LANES;
  let scrollSpeed = 0;
  let speedRatio = 1;
  let speedBoostRemainingSeconds = 0;
  let speedBoostRatio = 0;
  let speedBoostFullRatio = 0;
  let speedBoostStackCount = 0;
  let timedSpeedBoostRemainingSeconds = 0;
  let timedSpeedBoostRatio = 0;

  function update(
    deltaSeconds,
    collectedCandyValue,
    laneGap,
    scrollDeltaSeconds = deltaSeconds,
  ) {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    const safeScrollDeltaSeconds = Number.isFinite(scrollDeltaSeconds)
      ? Math.max(0, scrollDeltaSeconds)
      : safeDeltaSeconds;
    const safeLaneGap = Number.isFinite(laneGap) ? Math.max(0, laneGap) : 0;

    const baseScrollSpeedInLanes = calculateScrollSpeedInLanes(collectedCandyValue);
    speedBoostRatio = calculateSpeedBoostRatio(
      speedBoostRemainingSeconds,
      speedBoostFullRatio,
    );
    timedSpeedBoostRatio = timedSpeedBoostRemainingSeconds > 0
      ? timedSpeedBoostRatio
      : 0;
    scrollSpeedInLanes =
      baseScrollSpeedInLanes *
      (1 + speedBoostRatio) *
      (1 + timedSpeedBoostRatio);
    scrollSpeed = safeLaneGap * scrollSpeedInLanes;
    speedRatio = scrollSpeedInLanes / BASE_SCROLL_SPEED_IN_LANES;
    const jumpDistanceRatio = calculateBoostedJumpDistanceRatio(speedBoostRatio);
    const jumpTimeScale = speedRatio / jumpDistanceRatio;
    const frameDistance = scrollSpeed * safeScrollDeltaSeconds;
    traveledDistance += frameDistance;
    speedBoostRemainingSeconds = Math.max(
      0,
      speedBoostRemainingSeconds - safeDeltaSeconds,
    );
    if (speedBoostRemainingSeconds === 0) {
      speedBoostFullRatio = 0;
      speedBoostStackCount = 0;
    }
    timedSpeedBoostRemainingSeconds = Math.max(
      0,
      timedSpeedBoostRemainingSeconds - safeDeltaSeconds,
    );

    return {
      frameDistance,
      jumpDistanceRatio,
      jumpTimeScale,
      scrollSpeed,
      speedBoostRatio,
      speedBoostStackCount,
      speedRatio,
      timedSpeedBoostRatio,
      traveledDistance,
    };
  }

  function reset() {
    traveledDistance = 0;
    scrollSpeedInLanes = BASE_SCROLL_SPEED_IN_LANES;
    scrollSpeed = 0;
    speedRatio = 1;
    speedBoostRemainingSeconds = 0;
    speedBoostRatio = 0;
    speedBoostFullRatio = 0;
    speedBoostStackCount = 0;
    timedSpeedBoostRemainingSeconds = 0;
    timedSpeedBoostRatio = 0;
  }

  function activateSpeedBoost() {
    speedBoostStackCount = speedBoostRemainingSeconds > 0
      ? speedBoostStackCount + 1
      : 1;
    speedBoostFullRatio = calculateStackedSpeedBoostRatio(
      speedBoostStackCount,
    );
    speedBoostRemainingSeconds = SPEED_BOOST_RULES.durationSeconds;
    speedBoostRatio = speedBoostFullRatio;
  }

  function activateTimedSpeedBoost({ durationSeconds, speedIncreaseRatio } = {}) {
    const safeDurationSeconds = Number.isFinite(durationSeconds)
      ? Math.max(0, durationSeconds)
      : 0;
    const safeSpeedIncreaseRatio = Number.isFinite(speedIncreaseRatio)
      ? Math.min(5, Math.max(-0.95, speedIncreaseRatio))
      : 0;

    timedSpeedBoostRemainingSeconds = safeDurationSeconds;
    timedSpeedBoostRatio = safeSpeedIncreaseRatio;
  }

  return {
    activateSpeedBoost,
    activateTimedSpeedBoost,
    getSnapshot: () => ({
      scrollSpeed,
      speedBoostFullRatio,
      speedBoostRatio,
      speedBoostRemainingSeconds,
      speedBoostStackCount,
      speedRatio,
      timedSpeedBoostRatio,
      timedSpeedBoostRemainingSeconds,
      traveledDistance,
    }),
    reset,
    update,
  };
}

export function calculateSpeedBoostRatio(
  remainingSeconds,
  fullSpeedBoostRatio = SPEED_BOOST_RULES.speedIncreaseRatio,
) {
  const safeRemainingSeconds = Number.isFinite(remainingSeconds)
    ? Math.max(0, remainingSeconds)
    : 0;
  const safeFullSpeedBoostRatio = Number.isFinite(fullSpeedBoostRatio)
    ? Math.max(0, fullSpeedBoostRatio)
    : 0;

  if (safeRemainingSeconds <= SPEED_BOOST_RULES.fadeDurationSeconds) {
    return (
      safeFullSpeedBoostRatio *
      (safeRemainingSeconds / SPEED_BOOST_RULES.fadeDurationSeconds)
    );
  }

  return safeFullSpeedBoostRatio;
}

export function calculateStackedSpeedBoostRatio(stackCount) {
  const safeStackCount = Number.isFinite(stackCount)
    ? Math.max(0, Math.floor(stackCount))
    : 0;
  let stackedRatio = 0;

  for (let index = 0; index < safeStackCount; index += 1) {
    stackedRatio +=
      SPEED_BOOST_RULES.speedIncreaseRatio *
      SPEED_BOOST_RULES.stackEffectMultiplier ** index;
  }

  return stackedRatio;
}

export function calculateBoostedJumpDistanceRatio(speedBoostRatio) {
  const safeSpeedBoostRatio = Number.isFinite(speedBoostRatio)
    ? Math.max(0, speedBoostRatio)
    : 0;
  const boostStrength = Math.min(
    1,
    safeSpeedBoostRatio / SPEED_BOOST_RULES.speedIncreaseRatio,
  );

  return 1 + SPEED_BOOST_RULES.jumpDistanceIncreaseRatio * boostStrength;
}

export function calculateScrollSpeedInLanes(collectedCandyValue) {
  const safeCandyValue = Number.isFinite(collectedCandyValue)
    ? Math.max(0, collectedCandyValue)
    : 0;

  return Math.min(
    MAX_SCROLL_SPEED_IN_LANES,
    BASE_SCROLL_SPEED_IN_LANES + safeCandyValue * SPEED_INCREASE_PER_CANDY_IN_LANES,
  );
}
