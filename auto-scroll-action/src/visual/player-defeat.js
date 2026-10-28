export const PLAYER_DEFEAT_DURATION_SECONDS = 3.2;

const KNOCKBACK_SECONDS = 0.42;
const ROLL_SECONDS = 0.62;
const ROLL_START_ROTATION = -Math.PI * 0.55;
const FULL_TURN = -Math.PI * 2;

export function getPlayerDefeatMotion(elapsedSeconds) {
  const time = Number.isFinite(elapsedSeconds)
    ? Math.min(PLAYER_DEFEAT_DURATION_SECONDS, Math.max(0, elapsedSeconds))
    : 0;

  if (time < KNOCKBACK_SECONDS) {
    const progress = time / KNOCKBACK_SECONDS;
    return {
      phase: "knockback",
      backwardProgress: 0.6 * easeOut(progress),
      landingProgress: progress,
      liftRatio: Math.sin(progress * Math.PI) * 0.32,
      rotation: ROLL_START_ROTATION * progress,
    };
  }

  if (time < KNOCKBACK_SECONDS + ROLL_SECONDS) {
    const progress = (time - KNOCKBACK_SECONDS) / ROLL_SECONDS;
    return {
      phase: "roll",
      backwardProgress: 0.6 + 0.4 * easeOut(progress),
      landingProgress: 1,
      liftRatio: Math.sin(progress * Math.PI * 2) ** 2 * 0.045,
      rotation: ROLL_START_ROTATION + (FULL_TURN - ROLL_START_ROTATION) * easeOut(progress),
    };
  }

  const dizzyTime = time - KNOCKBACK_SECONDS - ROLL_SECONDS;
  return {
    phase: "dizzy",
    backwardProgress: 1,
    landingProgress: 1,
    liftRatio: 0,
    rotation: FULL_TURN + Math.sin(dizzyTime * 7) * 0.045,
  };
}

function easeOut(progress) {
  return 1 - (1 - progress) ** 2;
}
