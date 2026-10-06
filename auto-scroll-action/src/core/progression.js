const BASE_SCROLL_SPEED_IN_LANES = 1.6;
const ACCELERATION_PER_CANDY_IN_LANES = 0.0015;
const MAX_SCROLL_SPEED_IN_LANES = 4;

export function createProgression() {
  let traveledDistance = 0;
  let scrollSpeedInLanes = BASE_SCROLL_SPEED_IN_LANES;
  let scrollSpeed = 0;
  let scrollAcceleration = 0;

  function update(deltaSeconds, collectedCandyValue, laneGap) {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    const safeLaneGap = Number.isFinite(laneGap) ? Math.max(0, laneGap) : 0;
    const accelerationInLanes = calculateScrollAcceleration(collectedCandyValue);

    scrollSpeedInLanes = Math.min(
      MAX_SCROLL_SPEED_IN_LANES,
      scrollSpeedInLanes + accelerationInLanes * safeDeltaSeconds,
    );
    scrollSpeed = safeLaneGap * scrollSpeedInLanes;
    scrollAcceleration = safeLaneGap * accelerationInLanes;
    const frameDistance = scrollSpeed * safeDeltaSeconds;
    traveledDistance += frameDistance;

    return {
      frameDistance,
      scrollAcceleration,
      scrollSpeed,
      traveledDistance,
    };
  }

  function reset() {
    traveledDistance = 0;
    scrollSpeedInLanes = BASE_SCROLL_SPEED_IN_LANES;
    scrollSpeed = 0;
    scrollAcceleration = 0;
  }

  return {
    getSnapshot: () => ({ scrollAcceleration, scrollSpeed, traveledDistance }),
    reset,
    update,
  };
}

export function calculateScrollAcceleration(collectedCandyValue) {
  const safeCandyValue = Number.isFinite(collectedCandyValue)
    ? Math.max(0, collectedCandyValue)
    : 0;

  return safeCandyValue * ACCELERATION_PER_CANDY_IN_LANES;
}
