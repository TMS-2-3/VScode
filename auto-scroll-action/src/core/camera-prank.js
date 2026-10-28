export const CAMERA_PRANK_DURATION_SECONDS = 10;
export const CAMERA_PRANK_COOLDOWN_SECONDS = 5;

const CAMERA_PRANK_INTRO_SECONDS = 3;
const CAMERA_PRANK_POPUP_SECONDS = 0.8;
const CAMERA_PRANK_PLAYER_LOOK_START_SECONDS = 1.5;
const CAMERA_PRANK_PLAYER_LOOK_END_SECONDS = 2.3;
const CAMERA_PRANK_COSTUME_CHECK_SECONDS = 1.72;
const CAMERA_PRANK_REPEL_SECONDS = 0.85;
const CAMERA_PRANK_ENTER_SECONDS = 1.15;
const CAMERA_PRANK_EXIT_SECONDS = 0.9;
const INTRO_CAMERA_ZOOM_INCREASE = 0.13;
const MINIMUM_ZOOM_INCREASE = 0.16;
const ZOOM_WAVE_RANGE = 0.065;
const GHOST_CLOSEUP_SCALE = 3.6;
const GHOST_CLOSEUP_Y_RATIO = 0.56;
const GHOST_GAZE_INTERVAL_SECONDS = 1.4;
const GHOST_WANDER_SEQUENCE = Object.freeze([
  { gaze: "camera", x: 0, y: 0 },
  { gaze: "look-up-left", x: -0.032, y: -0.026 },
  { gaze: "look-right", x: 0.036, y: 0 },
  { gaze: "look-down-right", x: 0.031, y: 0.026 },
  { gaze: "look-left", x: -0.036, y: 0 },
  { gaze: "look-up-right", x: 0.031, y: -0.026 },
  { gaze: "look-down-left", x: -0.031, y: 0.026 },
  { gaze: "look-up", x: 0, y: -0.029 },
]);

const CAMERA_PRANK_PHASE = Object.freeze({
  COOLDOWN: "cooldown",
  EFFECT: "effect",
  IDLE: "idle",
  INTRO: "intro",
  REPELLED: "repelled",
});

export function createCameraPrank() {
  let phase = CAMERA_PRANK_PHASE.IDLE;
  let phaseElapsedSeconds = 0;
  let repelCandyCount = 0;

  function canSpawn() {
    return phase === CAMERA_PRANK_PHASE.IDLE;
  }

  function activate() {
    if (!canSpawn()) {
      return false;
    }

    phase = CAMERA_PRANK_PHASE.INTRO;
    phaseElapsedSeconds = 0;
    repelCandyCount = 0;
    return true;
  }

  function repel(candyCount = 0) {
    if (phase !== CAMERA_PRANK_PHASE.INTRO) {
      return false;
    }

    phase = CAMERA_PRANK_PHASE.REPELLED;
    phaseElapsedSeconds = 0;
    repelCandyCount = Number.isFinite(candyCount)
      ? Math.max(0, Math.floor(candyCount))
      : 0;
    return true;
  }

  function update(deltaSeconds) {
    let remainingDelta = Number.isFinite(deltaSeconds)
      ? Math.max(0, deltaSeconds)
      : 0;
    let didLookAtPlayer = false;
    let repelledCandyCollected = 0;

    while (remainingDelta > 0 && phase !== CAMERA_PRANK_PHASE.IDLE) {
      const phaseDuration = getPhaseDuration(phase);
      const step = Math.min(
        remainingDelta,
        Math.max(0, phaseDuration - phaseElapsedSeconds),
      );
      const previousElapsedSeconds = phaseElapsedSeconds;
      phaseElapsedSeconds += step;
      remainingDelta -= step;

      if (
        phase === CAMERA_PRANK_PHASE.INTRO &&
        previousElapsedSeconds < CAMERA_PRANK_COSTUME_CHECK_SECONDS &&
        phaseElapsedSeconds >= CAMERA_PRANK_COSTUME_CHECK_SECONDS
      ) {
        didLookAtPlayer = true;
      }

      if (phaseElapsedSeconds < phaseDuration) {
        break;
      }

      if (phase === CAMERA_PRANK_PHASE.INTRO) {
        phase = CAMERA_PRANK_PHASE.EFFECT;
      } else if (phase === CAMERA_PRANK_PHASE.EFFECT) {
        phase = CAMERA_PRANK_PHASE.COOLDOWN;
      } else if (phase === CAMERA_PRANK_PHASE.REPELLED) {
        repelledCandyCollected = repelCandyCount;
        repelCandyCount = 0;
        phase = CAMERA_PRANK_PHASE.COOLDOWN;
      } else {
        phase = CAMERA_PRANK_PHASE.IDLE;
      }
      phaseElapsedSeconds = 0;
    }

    return {
      ...getSnapshot(),
      didLookAtPlayer,
      repelledCandyCollected,
    };
  }

  function getSnapshot() {
    if (phase === CAMERA_PRANK_PHASE.INTRO) {
      return createIntroSnapshot(phaseElapsedSeconds);
    }

    if (phase === CAMERA_PRANK_PHASE.EFFECT) {
      return createEffectSnapshot(phaseElapsedSeconds);
    }

    if (phase === CAMERA_PRANK_PHASE.REPELLED) {
      return createRepelledSnapshot(phaseElapsedSeconds, repelCandyCount);
    }

    return createInactiveSnapshot();
  }

  function reset() {
    phase = CAMERA_PRANK_PHASE.IDLE;
    phaseElapsedSeconds = 0;
    repelCandyCount = 0;
  }

  return {
    activate,
    canSpawn,
    getSnapshot,
    repel,
    reset,
    update,
  };
}

function createIntroSnapshot(elapsedSeconds) {
  const popupProgress = smoothstep(
    Math.min(1, elapsedSeconds / CAMERA_PRANK_POPUP_SECONDS),
  );
  const isLookingAtPlayer =
    elapsedSeconds >= CAMERA_PRANK_PLAYER_LOOK_START_SECONDS &&
    elapsedSeconds < CAMERA_PRANK_PLAYER_LOOK_END_SECONDS;
  const closeupProgress = smoothstep(
    Math.min(
      1,
      Math.max(
        0,
        (elapsedSeconds - CAMERA_PRANK_PLAYER_LOOK_END_SECONDS) /
          (CAMERA_PRANK_INTRO_SECONDS - CAMERA_PRANK_PLAYER_LOOK_END_SECONDS),
      ),
    ),
  );
  const popupScale = 0.5 + popupProgress * 0.18;
  const popupYRatio = 1.13 - popupProgress * 0.3;

  return {
    durationSeconds: CAMERA_PRANK_DURATION_SECONDS,
    effectElapsedSeconds: 0,
    effectRemainingSeconds: CAMERA_PRANK_DURATION_SECONDS,
    ghostCandyCount: 0,
    ghostDriftX:
      Math.sin(elapsedSeconds * 2.4) * 0.008 * (1 - closeupProgress),
    ghostDriftY: 0,
    ghostGaze: isLookingAtPlayer ? "player" : "camera",
    ghostOpacity: popupProgress * (0.48 + closeupProgress * 0.27),
    ghostRotation:
      Math.sin(elapsedSeconds * 1.6) * 0.018 * (1 - closeupProgress),
    ghostScale: lerp(popupScale, GHOST_CLOSEUP_SCALE, closeupProgress),
    ghostXRatio: 0.5,
    ghostYRatio: lerp(
      popupYRatio,
      GHOST_CLOSEUP_Y_RATIO,
      closeupProgress,
    ),
    isActive: true,
    isEffectActive: false,
    isRepelled: false,
    phase: CAMERA_PRANK_PHASE.INTRO,
    scale: 1 + INTRO_CAMERA_ZOOM_INCREASE * closeupProgress,
  };
}

function createEffectSnapshot(elapsedSeconds) {
  const remainingSeconds = Math.max(
    0,
    CAMERA_PRANK_DURATION_SECONDS - elapsedSeconds,
  );
  const enterProgress = smoothstep(
    Math.min(1, elapsedSeconds / CAMERA_PRANK_ENTER_SECONDS),
  );
  const exitProgress = smoothstep(
    Math.min(1, remainingSeconds / CAMERA_PRANK_EXIT_SECONDS),
  );
  const slowWave =
    Math.sin(elapsedSeconds * 1.17) * 0.62 +
    Math.sin(elapsedSeconds * 0.47 + 1.2) * 0.38;
  const zoomIncrease =
    MINIMUM_ZOOM_INCREASE +
    ZOOM_WAVE_RANGE * (slowWave * 0.5 + 0.5);
  const initialZoomProgress = 0.65 + enterProgress * 0.35;
  const wanderingPosition = getWanderingPosition(elapsedSeconds);

  return {
    durationSeconds: CAMERA_PRANK_DURATION_SECONDS,
    effectElapsedSeconds: elapsedSeconds,
    effectRemainingSeconds: remainingSeconds,
    ghostCandyCount: 0,
    ghostDriftX: wanderingPosition.x,
    ghostDriftY: wanderingPosition.y,
    ghostGaze: getWanderingGaze(elapsedSeconds),
    ghostOpacity: exitProgress * (0.75 + Math.sin(elapsedSeconds * 0.8) * 0.025),
    ghostRotation: Math.sin(elapsedSeconds * 0.54) * 0.01,
    ghostScale:
      GHOST_CLOSEUP_SCALE + Math.sin(elapsedSeconds * 0.63) * 0.16,
    ghostXRatio: 0.5,
    ghostYRatio: GHOST_CLOSEUP_Y_RATIO,
    isActive: true,
    isEffectActive: true,
    isRepelled: false,
    phase: CAMERA_PRANK_PHASE.EFFECT,
    scale: 1 + zoomIncrease * initialZoomProgress * exitProgress,
  };
}

function createRepelledSnapshot(elapsedSeconds, candyCount) {
  const fleeProgress = smoothstep(
    Math.min(1, elapsedSeconds / CAMERA_PRANK_REPEL_SECONDS),
  );

  return {
    durationSeconds: CAMERA_PRANK_DURATION_SECONDS,
    effectElapsedSeconds: 0,
    effectRemainingSeconds: CAMERA_PRANK_DURATION_SECONDS,
    ghostCandyCount: candyCount,
    ghostDriftX: -fleeProgress * 0.09,
    ghostDriftY: fleeProgress * 0.36,
    ghostGaze: "scared",
    ghostOpacity: (1 - fleeProgress) * 0.5,
    ghostRotation: -fleeProgress * 0.18,
    ghostScale: 0.68 - fleeProgress * 0.14,
    ghostXRatio: 0.5,
    ghostYRatio: 0.83,
    isActive: true,
    isEffectActive: false,
    isRepelled: true,
    phase: CAMERA_PRANK_PHASE.REPELLED,
    repelProgress: fleeProgress,
    scale: 1,
  };
}

function createInactiveSnapshot() {
  return {
    durationSeconds: CAMERA_PRANK_DURATION_SECONDS,
    effectElapsedSeconds: 0,
    effectRemainingSeconds: 0,
    ghostCandyCount: 0,
    ghostOpacity: 0,
    ghostScale: 0.5,
    isActive: false,
    isEffectActive: false,
    isRepelled: false,
    phase: CAMERA_PRANK_PHASE.IDLE,
    scale: 1,
  };
}

function getPhaseDuration(phase) {
  if (phase === CAMERA_PRANK_PHASE.INTRO) {
    return CAMERA_PRANK_INTRO_SECONDS;
  }

  if (phase === CAMERA_PRANK_PHASE.EFFECT) {
    return CAMERA_PRANK_DURATION_SECONDS;
  }

  if (phase === CAMERA_PRANK_PHASE.REPELLED) {
    return CAMERA_PRANK_REPEL_SECONDS;
  }

  if (phase === CAMERA_PRANK_PHASE.COOLDOWN) {
    return CAMERA_PRANK_COOLDOWN_SECONDS;
  }

  return 0;
}

function smoothstep(value) {
  const safeValue = Math.min(1, Math.max(0, value));
  return safeValue * safeValue * (3 - 2 * safeValue);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function getWanderingGaze(elapsedSeconds) {
  return getWanderStep(elapsedSeconds).current.gaze;
}

function getWanderingPosition(elapsedSeconds) {
  const { current, previous, stepProgress } = getWanderStep(elapsedSeconds);
  const moveProgress = smoothstep(Math.min(1, stepProgress / 0.35));

  return {
    x: lerp(previous.x, current.x, moveProgress),
    y: lerp(previous.y, current.y, moveProgress),
  };
}

function getWanderStep(elapsedSeconds) {
  const elapsedIntervals =
    Math.max(0, elapsedSeconds) / GHOST_GAZE_INTERVAL_SECONDS;
  const absoluteIndex = Math.floor(elapsedIntervals);
  const currentIndex = absoluteIndex % GHOST_WANDER_SEQUENCE.length;
  const previousIndex = absoluteIndex === 0
    ? currentIndex
    : (currentIndex - 1 + GHOST_WANDER_SEQUENCE.length) %
      GHOST_WANDER_SEQUENCE.length;

  return {
    current: GHOST_WANDER_SEQUENCE[currentIndex],
    previous: GHOST_WANDER_SEQUENCE[previousIndex],
    stepProgress: elapsedIntervals - absoluteIndex,
  };
}
