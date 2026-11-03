(function initDungeonPlacementSafety(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HEALER_DUNGEON_PLACEMENT_SAFETY = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonPlacementSafety() {
  "use strict";

  function objects(placements) {
    return [...(placements.mandatoryEvents || []), ...(placements.treasure || [])];
  }

  function inspect(dungeon, blockers = objects(dungeon.placements || {})) {
    const { width, height, cells, entrance, exit } = dungeon;
    const navigationCells = cells.slice();
    const occupied = new Set();
    const errors = [];
    const validPoint = (cell) => cell && Number.isInteger(cell.x) && Number.isInteger(cell.y)
      && cell.x >= 0 && cell.y >= 0 && cell.x < width && cell.y < height;
    const validFootprint = (item) => validPoint(item) && Number.isInteger(item.width ?? 1) && Number.isInteger(item.height ?? 1)
      && (item.width ?? 1) > 0 && (item.height ?? 1) > 0 && item.x + (item.width ?? 1) <= width && item.y + (item.height ?? 1) <= height;
    const walkable = (cell) => cell === 0 || cell === 2;
    blockers.forEach((item) => {
      const itemWidth = item.width ?? 1;
      const itemHeight = item.height ?? 1;
      if (!validFootprint(item)) {
        errors.push(`Invalid object footprint: ${item.id || item.type || "object"}.`);
        return;
      }
      for (let y = item.y; y < item.y + itemHeight; y += 1) {
        for (let x = item.x; x < item.x + itemWidth; x += 1) {
          const index = y * width + x;
          if (!walkable(cells[index]) || occupied.has(index)) errors.push(`Overlapping or non-floor object: ${item.id || item.type || "object"}.`);
          occupied.add(index);
          navigationCells[index] = 1;
        }
      }
    });
    const reachable = new Uint8Array(cells.length);
    const queue = new Int32Array(cells.length);
    let count = 0;
    const visit = (index) => {
      if (reachable[index] || !walkable(navigationCells[index])) return;
      reachable[index] = 1;
      queue[count++] = index;
    };
    if (validPoint(entrance) && walkable(navigationCells[entrance.y * width + entrance.x])) {
      visit(entrance.y * width + entrance.x);
    } else errors.push("Objects block the entrance or the entrance is missing.");
    for (let cursor = 0; cursor < count; cursor += 1) {
      const index = queue[cursor];
      const x = index % width;
      const y = Math.floor(index / width);
      if (x) visit(index - 1);
      if (x + 1 < width) visit(index + 1);
      if (y) visit(index - width);
      if (y + 1 < height) visit(index + width);
    }
    let unreachableCount = 0;
    navigationCells.forEach((cell, index) => { if (walkable(cell) && !reachable[index]) unreachableCount += 1; });
    if (unreachableCount) errors.push(`Objects disconnect ${unreachableCount} floor cells from the entrance.`);
    if (exit && (!validPoint(exit) || !reachable[exit.y * width + exit.x])) errors.push("Objects block access to the exit.");
    const approaches = blockers.map((item) => {
      const candidates = [];
      if (!validFootprint(item)) return null;
      const itemWidth = item.width ?? 1;
      const itemHeight = item.height ?? 1;
      for (let x = item.x; x < item.x + itemWidth; x += 1) candidates.push({ x, y: item.y - 1 }, { x, y: item.y + itemHeight });
      for (let y = item.y; y < item.y + itemHeight; y += 1) candidates.push({ x: item.x - 1, y }, { x: item.x + itemWidth, y });
      const approach = candidates.find((cell) => validPoint(cell) && reachable[cell.y * width + cell.x]) || null;
      if (!approach) errors.push(`No reachable interaction tile for ${item.id || item.type || "object"}.`);
      return approach;
    });
    return { valid: errors.length === 0, errors, navigationCells, approaches, reachableCount: count, unreachableCount };
  }

  return Object.freeze({ objects, inspect });
});
