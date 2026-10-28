export const SCARY_COSTUME_MIN_CANDY_REWARD = 3;
export const SCARY_COSTUME_MAX_CANDY_REWARD = 7;

export function createScaryCostume({ random = Math.random } = {}) {
  let isActive = false;

  function activate() {
    isActive = true;
  }

  function createCandyReward() {
    const randomValue = random();
    const normalizedRandom = Number.isFinite(randomValue)
      ? Math.min(0.999999, Math.max(0, randomValue))
      : 0;
    return (
      SCARY_COSTUME_MIN_CANDY_REWARD +
      Math.floor(
        normalizedRandom *
          (SCARY_COSTUME_MAX_CANDY_REWARD -
            SCARY_COSTUME_MIN_CANDY_REWARD +
            1),
      )
    );
  }

  function repelGhostGroup(ghostCount = 1) {
    const normalizedGhostCount = Number.isFinite(ghostCount)
      ? Math.max(0, Math.floor(ghostCount))
      : 0;

    if (!isActive || normalizedGhostCount === 0) {
      return [];
    }

    isActive = false;
    return Array.from(
      { length: normalizedGhostCount },
      createCandyReward,
    );
  }

  function repelNextGhost() {
    return repelGhostGroup(1)[0] ?? 0;
  }

  function getSnapshot() {
    return { isActive };
  }

  function reset() {
    isActive = false;
  }

  return {
    activate,
    getSnapshot,
    repelGhostGroup,
    repelNextGhost,
    reset,
  };
}
