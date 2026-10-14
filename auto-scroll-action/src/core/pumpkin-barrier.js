export const PUMPKIN_BARRIER_DURATION_SECONDS = 15;

export function createPumpkinBarrier() {
  let remainingSeconds = 0;

  function activate(durationSeconds = PUMPKIN_BARRIER_DURATION_SECONDS) {
    remainingSeconds = Number.isFinite(durationSeconds)
      ? Math.max(0, durationSeconds)
      : 0;
  }

  function update(deltaSeconds) {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds)
      ? Math.max(0, deltaSeconds)
      : 0;
    remainingSeconds = Math.max(0, remainingSeconds - safeDeltaSeconds);
  }

  function consume() {
    if (remainingSeconds <= 0) {
      return false;
    }

    remainingSeconds = 0;
    return true;
  }

  function reset() {
    remainingSeconds = 0;
  }

  function getSnapshot() {
    return {
      isActive: remainingSeconds > 0,
      remainingSeconds,
    };
  }

  return {
    activate,
    consume,
    getSnapshot,
    reset,
    update,
  };
}
