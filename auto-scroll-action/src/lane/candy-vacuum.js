export const CANDY_VACUUM_DURATION_SECONDS = 12;

const VACUUM_RANGE_IN_LANE_GAPS = 1.75;
const VACUUM_PULL_STRENGTH = 3.6;
const VACUUM_RELEASE_STRENGTH = 8;
const VACUUM_ROTATION_SPEED = 18;

export function createCandyVacuumManager({ coinManager } = {}) {
  if (!coinManager) {
    throw new Error("Candy vacuum requires a coin manager.");
  }

  let remainingSeconds = 0;
  let elapsedSeconds = 0;

  function activate(durationSeconds = CANDY_VACUUM_DURATION_SECONDS) {
    remainingSeconds = Number.isFinite(durationSeconds)
      ? Math.max(0, durationSeconds)
      : 0;
    elapsedSeconds = 0;
  }

  function update(deltaSeconds, context = {}) {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds)
      ? Math.max(0, deltaSeconds)
      : 0;
    const isActive = remainingSeconds > 0;

    const attractedCount = coinManager.updateVacuumAttraction({
      ...context,
      deltaSeconds: safeDeltaSeconds,
      isActive,
      pullStrength: VACUUM_PULL_STRENGTH,
      rangeInLaneGaps: VACUUM_RANGE_IN_LANE_GAPS,
      releaseStrength: VACUUM_RELEASE_STRENGTH,
      rotationSpeed: VACUUM_ROTATION_SPEED,
    });

    if (!isActive) {
      return {
        attractedCount: 0,
        isActive: false,
        isPulling: false,
      };
    }

    const activeDeltaSeconds = Math.min(safeDeltaSeconds, remainingSeconds);
    elapsedSeconds += activeDeltaSeconds;
    remainingSeconds = Math.max(0, remainingSeconds - safeDeltaSeconds);

    if (remainingSeconds === 0) {
      coinManager.discardVacuumingCoins();
      return {
        attractedCount: 0,
        isActive: false,
        isPulling: false,
      };
    }

    return {
      attractedCount,
      isActive: true,
      isPulling: attractedCount > 0,
    };
  }

  function getSnapshot() {
    return {
      elapsedSeconds,
      isActive: remainingSeconds > 0,
      remainingSeconds,
    };
  }

  function reset() {
    remainingSeconds = 0;
    elapsedSeconds = 0;
    coinManager.resetVacuumAttraction();
  }

  return {
    activate,
    getSnapshot,
    reset,
    update,
  };
}
