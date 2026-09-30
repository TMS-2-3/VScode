import { LANE_COUNT } from "../shared/contracts.js";

export function createLaneManager() {
  let width = 1280;
  let height = 720;

  function resize(nextWidth, nextHeight) {
    width = nextWidth;
    height = nextHeight;
  }

  function getLaneY(lanePosition) {
    const topLaneY = height * 0.4;
    const laneGap = height * 0.15;

    return topLaneY + lanePosition * laneGap;
  }

  function getSnapshot() {
    return Array.from({ length: LANE_COUNT }, (_, index) => ({
      index,
      y: getLaneY(index),
      startX: width * 0.14,
      endX: width * 0.86,
    }));
  }

  return {
    getLaneY,
    getSnapshot,
    resize,
  };
}
