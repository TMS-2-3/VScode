const BASE_SCROLL_SPEED_IN_LANES = 1;
const SPEED_INCREASE_PER_CANDY_IN_LANES = 0.0065;
const MAX_SCROLL_SPEED_IN_LANES = 4;

export function createProgression() {
  let traveledDistance = 0;
  let scrollSpeedInLanes = BASE_SCROLL_SPEED_IN_LANES;
  let scrollSpeed = 0;
  let speedRatio = 1;

  function update(deltaSeconds, collectedCandyValue, laneGap) {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds) ? Math.max(0, deltaSeconds) : 0;
    const safeLaneGap = Number.isFinite(laneGap) ? Math.max(0, laneGap) : 0;

    scrollSpeedInLanes = calculateScrollSpeedInLanes(collectedCandyValue);
    scrollSpeed = safeLaneGap * scrollSpeedInLanes;
    speedRatio = scrollSpeedInLanes / BASE_SCROLL_SPEED_IN_LANES;
    const frameDistance = scrollSpeed * safeDeltaSeconds;
    traveledDistance += frameDistance;

    return {
      frameDistance,
      scrollSpeed,
      speedRatio,
      traveledDistance,
    };
  }

  function reset() {
    traveledDistance = 0;
    scrollSpeedInLanes = BASE_SCROLL_SPEED_IN_LANES;
    scrollSpeed = 0;
    speedRatio = 1;
  }

  return {
    getSnapshot: () => ({ scrollSpeed, speedRatio, traveledDistance }),
    reset,
    update,
  };
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
