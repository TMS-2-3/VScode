const BASE_SCROLL_SPEED_IN_LANES = 1;
const SPEED_INCREASE_PER_CANDY_IN_LANES = 0.0065;
const MAX_SCROLL_SPEED_IN_LANES = 4;

export const SPEED_BOOST_RULES = Object.freeze({
  durationSeconds: 7.5,
  fadeDurationSeconds: 1,
  speedIncreaseRatio: 0.6,
  jumpDistanceIncreaseRatio: 0.1,
});

export function createProgression() {
  let traveledDistance = 0;
  let scrollSpeedInLanes = BASE_SCROLL_SPEED_IN_LANES;
  let scrollSpeed = 0;
  let speedRatio = 1;
  let speedBoostRemainingSeconds = 0;
  let speedBoostRatio = 0;

  function update(deltaSeconds, collectedCandyValue, laneGap) {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    const safeLaneGap = Number.isFinite(laneGap) ? Math.max(0, laneGap) : 0;

    const baseScrollSpeedInLanes = calculateScrollSpeedInLanes(collectedCandyValue);
    speedBoostRatio = calculateSpeedBoostRatio(speedBoostRemainingSeconds);
    scrollSpeedInLanes = baseScrollSpeedInLanes * (1 + speedBoostRatio);
    scrollSpeed = safeLaneGap * scrollSpeedInLanes;
    speedRatio = scrollSpeedInLanes / BASE_SCROLL_SPEED_IN_LANES;
    const jumpDistanceRatio = calculateBoostedJumpDistanceRatio(speedBoostRatio);
    const jumpTimeScale = speedRatio / jumpDistanceRatio;
    const frameDistance = scrollSpeed * safeDeltaSeconds;
    traveledDistance += frameDistance;
    speedBoostRemainingSeconds = Math.max(
      0,
      speedBoostRemainingSeconds - safeDeltaSeconds,
    );

    return {
      frameDistance,
      jumpDistanceRatio,
      jumpTimeScale,
      scrollSpeed,
      speedBoostRatio,
      speedRatio,
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
  }

  function activateSpeedBoost() {
    speedBoostRemainingSeconds = SPEED_BOOST_RULES.durationSeconds;
    speedBoostRatio = SPEED_BOOST_RULES.speedIncreaseRatio;
  }

  return {
    activateSpeedBoost,
    getSnapshot: () => ({
      scrollSpeed,
      speedBoostRatio,
      speedBoostRemainingSeconds,
      speedRatio,
      traveledDistance,
    }),
    reset,
    update,
  };
}

export function calculateSpeedBoostRatio(remainingSeconds) {
  const safeRemainingSeconds = Number.isFinite(remainingSeconds)
    ? Math.max(0, remainingSeconds)
    : 0;

  if (safeRemainingSeconds <= SPEED_BOOST_RULES.fadeDurationSeconds) {
    return (
      SPEED_BOOST_RULES.speedIncreaseRatio *
      (safeRemainingSeconds / SPEED_BOOST_RULES.fadeDurationSeconds)
    );
  }

  return SPEED_BOOST_RULES.speedIncreaseRatio;
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
