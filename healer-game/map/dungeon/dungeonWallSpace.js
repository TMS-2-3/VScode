(function initDungeonWallSpace(root, factory) {
  "use strict";

  const rooms = typeof module === "object" && module.exports ? require("./dungeonRooms.js") : root.HEALER_DUNGEON_ROOMS;
  const corridors = typeof module === "object" && module.exports ? require("./dungeonCorridors.js") : root.HEALER_DUNGEON_CORRIDORS;
  const api = factory(rooms, corridors);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HEALER_DUNGEON_WALL_SPACE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonWallSpace(rooms, corridors) {
  "use strict";

  function reserve(layout, config, markers = {}) {
    const { width, height } = config;
    const wallHeight = config.tiles.wallHeight;
    const source = layout.cells;
    const rows = [];
    const lastFloor = new Int32Array(width).fill(-1);
    for (let y = 0; y < height; y += 1) {
      let row = y ? rows[y - 1] + 1 : 0;
      if (wallHeight > 0) {
        for (let x = 0; x < width; x += 1) {
          if (source[y * width + x] === 1) continue;
          const previous = lastFloor[x];
          if (previous < y - 1) row = Math.max(row, previous < 0 ? wallHeight + 1 : rows[previous] + wallHeight + 2);
          lastFloor[x] = y;
        }
      }
      rows.push(row);
    }
    const expandedHeight = rows[height - 1] + 1;
    const result = { baseHeight: height, height: expandedHeight, addedRows: expandedHeight - height, rows };
    if (!result.addedRows) return result;

    const cells = Array(width * expandedHeight).fill(1);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const value = source[y * width + x];
        cells[rows[y] * width + x] = value;
        // Only extend an existing vertical connection; never join separated floors.
        if (y === 0 || value === 1 || source[(y - 1) * width + x] === 1) continue;
        for (let row = rows[y - 1] + 1; row < rows[y]; row += 1) cells[row * width + x] = 0;
      }
    }
    layout.cells = cells;

    const moved = new WeakSet();
    const move = (cell) => {
      if (!cell || moved.has(cell)) return;
      cell.y = rows[cell.y];
      moved.add(cell);
    };
    const pathFor = (path, values) => {
      const points = [];
      const samples = [];
      path.forEach((cell, index) => {
        const next = { x: cell.x, y: rows[cell.y] };
        const previous = points[points.length - 1];
        if (previous && previous.x === next.x) {
          const distance = Math.abs(next.y - previous.y);
          const sign = Math.sign(next.y - previous.y);
          for (let step = 1; step < distance; step += 1) {
            points.push({ x: previous.x, y: previous.y + sign * step });
            if (values) samples.push(values[index - 1] + (values[index] - values[index - 1]) * step / distance);
          }
        }
        points.push(next);
        if (values) samples.push(values[index]);
      });
      return { points, samples };
    };

    (markers.corridorShapes || []).forEach((road) => {
      const footprint = new Set();
      const original = new Set([...road.path, ...road.addedCells].map(({ x, y }) => y * width + x));
      original.forEach((index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        footprint.add(rows[y] * width + x);
        if (!y || !original.has(index - width)) return;
        for (let row = rows[y - 1] + 1; row < rows[y]; row += 1) footprint.add(row * width + x);
      });
      const path = pathFor(road.path, road.targetWidths);
      road.path = path.points;
      road.targetWidths = path.samples;
      road.actualWidths = corridors.measureWidths(road.path, footprint, width, expandedHeight);
      const centerline = new Set(road.path.map(({ x, y }) => y * width + x));
      road.addedCells = [...footprint].filter((index) => !centerline.has(index)).map((index) => ({ x: index % width, y: Math.floor(index / width) }));
      (road.roundedCorners || []).forEach(move);
    });
    for (const approach of [markers.entranceApproach, markers.exitApproach]) {
      if (!approach) continue;
      const path = pathFor(approach.path);
      approach.baseLength = approach.length;
      approach.path = path.points;
      approach.length = approach.path.length - 1;
      [approach.start, approach.end, approach.door, approach.interior].forEach(move);
    }
    [markers.entrance, markers.exit].forEach(move);
    layout.rooms.forEach((room) => {
      room.top = rows[room.top];
      room.bottom = rows[room.bottom];
      move(room.center);
      (room.doors || []).forEach(move);
      (room.roundedCorners || []).forEach((corner) => corner.removedCells.forEach(move));
    });
    (layout.corridors || []).forEach((corridor) => {
      move(corridor.start);
      move(corridor.end);
      const approach = corridor.kind === "entrance" ? markers.entranceApproach : corridor.kind === "exit" ? markers.exitApproach : null;
      corridor.length = approach ? approach.length : Math.max(Math.abs(corridor.end.x - corridor.start.x), Math.abs(corridor.end.y - corridor.start.y)) + 1;
    });
    rooms.refresh(layout, { width });
    return result;
  }

  return Object.freeze({ reserve });
});
