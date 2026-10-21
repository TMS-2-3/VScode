import {
  COLLECTIBLE_TYPE,
  LANE_COUNT,
  PLAYER_SCREEN_X_RATIO,
} from "../shared/contracts.js";

export const CANDY_LAUNCHER_COUNTDOWN_SECONDS = 3;

const LAUNCHER_PHASE = Object.freeze({
  IDLE: "idle",
  COUNTDOWN: "countdown",
  PROJECTILE: "projectile",
  EXPLOSION: "explosion",
});

const PROJECTILE_PLAYER_SPEED_MULTIPLIER = 1.15;
const MIN_PROJECTILE_SPEED_IN_LANE_GAPS = 1.15;
const PROJECTILE_RADIUS_IN_LANE_GAPS = 0.12;
const EXPLOSION_DURATION_SECONDS = 0.55;
const SMOKE_INTERVAL_SECONDS = 0.14;
const SMOKE_LIFETIME_SECONDS = 0.65;
const MIN_CANDY_DROP_COUNT = 3;
const MAX_CANDY_DROP_COUNT = 8;
const DROP_COLUMN_OFFSETS_IN_LANE_GAPS = [-0.42, 0, 0.42];
const DROP_ROW_TYPES = [
  COLLECTIBLE_TYPE.COIN_HIGH,
  COLLECTIBLE_TYPE.COIN_MIDDLE,
  COLLECTIBLE_TYPE.COIN_LOW,
];

export function createCandyLauncherManager({ random = Math.random } = {}) {
  const smokePuffs = new Map();
  let phase = LAUNCHER_PHASE.IDLE;
  let countdownRemainingSeconds = 0;
  let smokeElapsedSeconds = 0;
  let targetLane = 0;
  let projectile = null;
  let explosion = null;
  let nextSmokeId = 1;
  let lastCountdownValue = null;

  function activate() {
    if (phase !== LAUNCHER_PHASE.IDLE) {
      return false;
    }

    phase = LAUNCHER_PHASE.COUNTDOWN;
    countdownRemainingSeconds = CANDY_LAUNCHER_COUNTDOWN_SECONDS;
    smokeElapsedSeconds = SMOKE_INTERVAL_SECONDS;
    projectile = null;
    explosion = null;
    lastCountdownValue = null;
    return true;
  }

  function update(
    deltaSeconds,
    {
      laneGap,
      obstacles = [],
      playerFootY,
      playerLanePosition,
      scrollSpeed,
      viewportWidth,
    } = {},
  ) {
    const safeDeltaSeconds = Number.isFinite(deltaSeconds)
      ? Math.max(0, deltaSeconds)
      : 0;
    const safeLaneGap = Number.isFinite(laneGap) ? Math.max(0, laneGap) : 0;
    const safeViewportWidth = Number.isFinite(viewportWidth)
      ? Math.max(0, viewportWidth)
      : 0;
    const safeScrollSpeed = Number.isFinite(scrollSpeed)
      ? Math.max(0, scrollSpeed)
      : 0;
    const result = {
      candyDrops: [],
      countdownCue: null,
      destroyedObstacleId: null,
      didFire: false,
    };

    updateSmokePuffs(safeDeltaSeconds);

    if (phase === LAUNCHER_PHASE.COUNTDOWN) {
      targetLane = normalizeLane(playerLanePosition);
      smokeElapsedSeconds += safeDeltaSeconds;

      while (smokeElapsedSeconds >= SMOKE_INTERVAL_SECONDS) {
        smokeElapsedSeconds -= SMOKE_INTERVAL_SECONDS;
        spawnSmokePuff({
          laneGap: safeLaneGap,
          originX:
            safeViewportWidth * PLAYER_SCREEN_X_RATIO + safeLaneGap * 0.34,
          originY: playerFootY - safeLaneGap * 0.23,
        });
      }

      countdownRemainingSeconds = Math.max(
        0,
        countdownRemainingSeconds - safeDeltaSeconds,
      );

      if (countdownRemainingSeconds > 0) {
        const countdownValue = Math.max(
          1,
          Math.ceil(countdownRemainingSeconds),
        );

        if (countdownValue !== lastCountdownValue) {
          lastCountdownValue = countdownValue;
          result.countdownCue = countdownValue;
        }
      }

      if (countdownRemainingSeconds === 0) {
        const launchX =
          safeViewportWidth * PLAYER_SCREEN_X_RATIO + safeLaneGap * 0.36;
        projectile = {
          lane: targetLane,
          radius: safeLaneGap * PROJECTILE_RADIUS_IN_LANE_GAPS,
          rotation: 0,
          x: launchX,
        };
        phase = LAUNCHER_PHASE.PROJECTILE;
        result.didFire = true;

        for (let index = 0; index < 4; index += 1) {
          spawnSmokePuff({
            forceRatio: 1.45,
            laneGap: safeLaneGap,
            originX: launchX,
            originY: playerFootY - safeLaneGap * 0.23,
          });
        }
      }

      return result;
    }

    if (phase === LAUNCHER_PHASE.PROJECTILE && projectile) {
      const previousX = projectile.x;
      projectile.x +=
        Math.max(
          safeLaneGap * MIN_PROJECTILE_SPEED_IN_LANE_GAPS,
          safeScrollSpeed * PROJECTILE_PLAYER_SPEED_MULTIPLIER,
        ) * safeDeltaSeconds;
      projectile.rotation += safeDeltaSeconds * 9;
      const hitObstacle = findHitObstacle(
        obstacles,
        projectile,
        previousX,
        safeLaneGap,
      );

      if (hitObstacle) {
        result.destroyedObstacleId = hitObstacle.id;
        result.candyDrops = createCandyDrops(
          hitObstacle.x,
          hitObstacle.lane,
          safeLaneGap,
        );
        explosion = {
          lane: hitObstacle.lane,
          remainingSeconds: EXPLOSION_DURATION_SECONDS,
          x: hitObstacle.x,
        };
        projectile = null;
        phase = LAUNCHER_PHASE.EXPLOSION;
      } else if (projectile.x - projectile.radius > safeViewportWidth) {
        projectile = null;
        phase = LAUNCHER_PHASE.IDLE;
      }

      return result;
    }

    if (phase === LAUNCHER_PHASE.EXPLOSION && explosion) {
      explosion.remainingSeconds = Math.max(
        0,
        explosion.remainingSeconds - safeDeltaSeconds,
      );

      if (explosion.remainingSeconds === 0) {
        explosion = null;
        phase = LAUNCHER_PHASE.IDLE;
      }
    }

    return result;
  }

  function getSnapshot() {
    const countdownValue = phase === LAUNCHER_PHASE.COUNTDOWN
      ? Math.max(1, Math.ceil(countdownRemainingSeconds))
      : null;

    return {
      countdownValue,
      explosion: explosion
        ? {
            ...explosion,
            progress:
              1 - explosion.remainingSeconds / EXPLOSION_DURATION_SECONDS,
          }
        : null,
      isActive: phase !== LAUNCHER_PHASE.IDLE,
      phase,
      projectile: projectile ? { ...projectile } : null,
      smokePuffs: Array.from(smokePuffs.values(), (puff) => ({ ...puff })),
      targetLane,
    };
  }

  function reset() {
    smokePuffs.clear();
    phase = LAUNCHER_PHASE.IDLE;
    countdownRemainingSeconds = 0;
    smokeElapsedSeconds = 0;
    targetLane = 0;
    projectile = null;
    explosion = null;
    lastCountdownValue = null;
  }

  function spawnSmokePuff({ forceRatio = 1, laneGap, originX, originY }) {
    if (
      laneGap <= 0 ||
      !Number.isFinite(originX) ||
      !Number.isFinite(originY)
    ) {
      return;
    }

    const puff = {
      ageSeconds: 0,
      driftX: laneGap * (0.05 + random() * 0.12) * forceRatio,
      driftY: -laneGap * (0.12 + random() * 0.13) * forceRatio,
      id: `launcher-smoke-${nextSmokeId}`,
      lifetimeSeconds: SMOKE_LIFETIME_SECONDS,
      size: laneGap * (0.065 + random() * 0.055) * forceRatio,
      x: originX + (random() - 0.5) * laneGap * 0.04,
      y: originY + (random() - 0.5) * laneGap * 0.04,
    };

    nextSmokeId += 1;
    smokePuffs.set(puff.id, puff);
  }

  function updateSmokePuffs(deltaSeconds) {
    smokePuffs.forEach((puff, id) => {
      puff.ageSeconds += deltaSeconds;

      if (puff.ageSeconds >= puff.lifetimeSeconds) {
        smokePuffs.delete(id);
      }
    });
  }

  function createCandyDrops(centerX, lane, laneGap) {
    const cells = [];

    DROP_COLUMN_OFFSETS_IN_LANE_GAPS.forEach((offsetRatio) => {
      DROP_ROW_TYPES.forEach((type) => {
        cells.push({
          lane,
          type,
          x: centerX + laneGap * offsetRatio,
        });
      });
    });

    for (let index = cells.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [cells[index], cells[swapIndex]] = [cells[swapIndex], cells[index]];
    }

    const dropCount = Math.min(
      MAX_CANDY_DROP_COUNT,
      MIN_CANDY_DROP_COUNT +
        Math.floor(
          random() * (MAX_CANDY_DROP_COUNT - MIN_CANDY_DROP_COUNT + 1),
        ),
    );
    return cells.slice(0, dropCount);
  }

  return {
    activate,
    getSnapshot,
    reset,
    update,
  };
}

function findHitObstacle(obstacles, projectile, previousX, laneGap) {
  return obstacles
    .filter((obstacle) => {
      if (obstacle.lane !== projectile.lane) {
        return false;
      }

      const halfWidth = laneGap * obstacle.widthRatio * 0.5;
      const obstacleLeft = obstacle.x - halfWidth;
      const obstacleRight = obstacle.x + halfWidth;
      return (
        obstacleRight >= previousX - projectile.radius &&
        obstacleLeft <= projectile.x + projectile.radius
      );
    })
    .sort((first, second) => first.x - second.x)[0] ?? null;
}

function normalizeLane(lanePosition) {
  const roundedLane = Number.isFinite(lanePosition)
    ? Math.round(lanePosition)
    : 0;
  return Math.min(LANE_COUNT - 1, Math.max(0, roundedLane));
}
