import {
  LANE_COUNT,
  LANE_ENTITY_KIND,
  OBSTACLE_TYPE,
} from "../shared/contracts.js";

// Add an entry here when a new obstacle type becomes available for spawning.
export const OBSTACLE_DEFINITIONS = [
  {
    kind: LANE_ENTITY_KIND.OBSTACLE,
    type: OBSTACLE_TYPE.LANE_BLOCKER,
    widthRatio: 0.45,
    heightRatio: 0.85,
    bottomOffsetRatio: 0,
  },
  {
    kind: LANE_ENTITY_KIND.OBSTACLE,
    type: OBSTACLE_TYPE.JUMP,
    widthRatio: 0.3,
    heightRatio: 0.4,
    bottomOffsetRatio: 0,
  },
  {
    kind: LANE_ENTITY_KIND.OBSTACLE,
    type: OBSTACLE_TYPE.DUCK,
    widthRatio: 0.55,
    heightRatio: 0.75,
    bottomOffsetRatio: 0.25,
  },
];

const OBSTACLE_DEFINITIONS_BY_TYPE = new Map(
  OBSTACLE_DEFINITIONS.map((definition) => [definition.type, definition]),
);

export function createObstacleManager() {
  const activeObstacles = new Map();
  let nextId = 1;

  function addObstacle({ x, lane, type = OBSTACLE_TYPE.LANE_BLOCKER } = {}) {
    const definition = OBSTACLE_DEFINITIONS_BY_TYPE.get(type);

    if (!definition) {
      throw new Error(`Unknown obstacle type: ${type}`);
    }

    if (!Number.isFinite(x)) {
      throw new Error("Obstacle x must be a finite number.");
    }

    if (!Number.isInteger(lane) || lane < 0 || lane >= LANE_COUNT) {
      throw new Error(`Obstacle lane must be between 0 and ${LANE_COUNT - 1}.`);
    }

    const obstacle = {
      ...definition,
      id: `obstacle-${nextId}`,
      x,
      lane,
    };

    nextId += 1;
    activeObstacles.set(obstacle.id, obstacle);
    return obstacle.id;
  }

  function moveObstacles(deltaX) {
    if (!Number.isFinite(deltaX)) {
      return;
    }

    activeObstacles.forEach((obstacle) => {
      obstacle.x += deltaX;
    });
  }

  function removeObstacle(id) {
    return activeObstacles.delete(id);
  }

  function getSnapshot() {
    return Array.from(activeObstacles.values(), (obstacle) => ({ ...obstacle }));
  }

  function reset() {
    activeObstacles.clear();
  }

  return {
    addObstacle,
    getSnapshot,
    moveObstacles,
    removeObstacle,
    reset,
  };
}

export function getObstacleBounds(obstacle, lanes) {
  const laneGap = lanes.getLaneGap();
  const width = laneGap * obstacle.widthRatio;
  const height = laneGap * obstacle.heightRatio;
  const bottom = lanes.getLaneY(obstacle.lane) - laneGap * obstacle.bottomOffsetRatio;

  return {
    left: obstacle.x - width / 2,
    right: obstacle.x + width / 2,
    top: bottom - height,
    bottom,
    width,
    height,
  };
}
