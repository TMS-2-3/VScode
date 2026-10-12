import { LANE_COUNT } from "../shared/contracts.js";

const TOP_LANE_RATIO = 0.35;
const LANE_GAP_RATIO = 0.25;

export function createLaneManager() {
  let width = 1280;
  let height = 720;

  function resize(nextWidth, nextHeight) {
    width = Math.max(1, Math.round(nextWidth));
    height = Math.max(1, Math.round(nextHeight));
  }

  function getLaneY(lanePosition) {
    const clampedPosition = Math.min(Math.max(lanePosition, 0), LANE_COUNT - 1);

    return Math.round(height * TOP_LANE_RATIO + getLaneGap() * clampedPosition);
  }

  function getLaneGap() {
    return Math.round(height * LANE_GAP_RATIO);
  }

  function getSnapshot() {
    return Array.from({ length: LANE_COUNT }, (_, index) => ({
      index,
      y: getLaneY(index),
      startX: 0,
      endX: width,
    }));
  }

  return {
    getLaneGap,
    getLaneY,
    getSnapshot,
    resize,
  };
}
