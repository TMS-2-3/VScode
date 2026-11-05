(function initDungeonCorridors(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HEALER_DUNGEON_CORRIDORS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonCorridors() {
  "use strict";

  function shape(layout, config, random) {
    const { width, height } = config;
    const settings = config.generator.corridorShape;
    if (!settings.enabled) return [];
    const original = layout.cells.slice();
    const roomIds = new Int32Array(original.length).fill(-1);
    const protectedCells = new Uint8Array(original.length);
    layout.rooms.forEach((room, id) => {
      for (let y = Math.max(0, room.top - 1); y <= Math.min(height - 1, room.bottom + 1); y += 1) {
        for (let x = Math.max(0, room.left - 1); x <= Math.min(width - 1, room.right + 1); x += 1) {
          protectedCells[y * width + x] = 1;
          if (x >= room.left && x <= room.right && y >= room.top && y <= room.bottom && original[y * width + x] !== 1) roomIds[y * width + x] = id;
        }
      }
    });
    const pathCells = original.map((cell, index) => cell !== 1 && roomIds[index] < 0);
    const routes = traceRoutes(pathCells, width, height);
    const owners = new Int32Array(original.length).fill(-1);
    const endpoints = routes.map((route) => [route[0], route[route.length - 1]]);
    const originalOwners = new Map();
    routes.forEach((route, owner) => route.forEach((index) => {
      if (!originalOwners.has(index)) originalOwners.set(index, new Set());
      originalOwners.get(index).add(owner);
    }));
    const results = [];

    routes.forEach((route, routeIndex) => {
      const path = route.map((index) => ({ x: index % width, y: Math.floor(index / width) }));
      const ownPath = new Set(route);
      const footprint = new Set(route);
      const added = [];
      const startRoom = nearestRoom(route[0], route[1], pathCells, roomIds, width, height);
      const endRoom = nearestRoom(route[route.length - 1], route[route.length - 2], pathCells, roomIds, width, height);
      const roomInfluence = (id) => id < 0 ? 0 : (Math.sqrt(layout.rooms[id].area || roomArea(layout.rooms[id])) - 6) * 0.1;
      const baseline = 1.1 + (config.scale - 1) * 0.1 + random() * 0.9;
      const startWidth = clamp(baseline + roomInfluence(startRoom) + (random() - 0.5) * 1.1, settings.minWidth, settings.maxWidth);
      const endWidth = clamp(baseline + roomInfluence(endRoom) + (random() - 0.5) * 1.1, settings.minWidth, settings.maxWidth);
      const bulge = random() < settings.bulgeChance
        ? { center: 0.2 + random() * 0.6, spread: 0.14 + random() * 0.18, amount: 0.45 + random() * 1.1 } : null;
      const sideBias = (random() - 0.5) * 0.6;
      const widths = path.map((_, index) => {
        const t = path.length > 1 ? index / (path.length - 1) : 0.5;
        const swelling = bulge ? bulge.amount * Math.exp(-0.5 * ((t - bulge.center) / bulge.spread) ** 2) : 0;
        return clamp(startWidth + (endWidth - startWidth) * t + swelling, settings.minWidth, settings.maxWidth);
      });
      const sharedNodes = new Map();
      endpoints.forEach((pair, owner) => {
        if (owner === routeIndex) return;
        const shared = pair.filter((index) => endpoints[routeIndex].includes(index));
        if (shared.length) sharedNodes.set(owner, shared);
      });
      const near = (x, y, nodes) => nodes.some((index) => Math.hypot(x - index % width, y - Math.floor(index / width)) <= settings.maxWidth / 2 + 1);

      // Widen additively, preserving room shells, map-edge exits and unrelated route boundaries.
      function carve(x, y) {
        if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) return;
        const index = y * width + x;
        if (layout.cells[index] !== 1 || protectedCells[index]) return;
        let connected = false;
        for (const neighbor of adjacent(index, width, height)) {
          if (original[neighbor] !== 1) {
            if (!ownPath.has(neighbor)) {
              const linkedAtJunction = [...(originalOwners.get(neighbor) || [])].some((owner) => near(x, y, sharedNodes.get(owner) || []));
              if (!linkedAtJunction) return;
            }
            connected = true;
          } else if (owners[neighbor] >= 0) {
            const otherOwner = owners[neighbor];
            if (otherOwner !== routeIndex && !near(x, y, sharedNodes.get(otherOwner) || [])) return;
            connected = true;
          }
        }
        if (!connected) return;
        layout.cells[index] = 0;
        owners[index] = routeIndex;
        footprint.add(index);
        added.push({ x, y });
      }

      function brush(cx, cy, strokeWidth) {
        const radius = Math.max(0.49, strokeWidth / 2 - 0.01);
        const candidates = [];
        for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
          for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
            const distance = (x - cx) ** 2 + (y - cy) ** 2;
            if (distance <= radius * radius) candidates.push({ x, y, distance });
          }
        }
        candidates.sort((a, b) => a.distance - b.distance);
        candidates.forEach(({ x, y }) => carve(x, y));
      }

      path.forEach((cell, index) => {
        const before = path[Math.max(0, index - 1)];
        const after = path[Math.min(path.length - 1, index + 1)];
        const dx = after.x - before.x;
        const dy = after.y - before.y;
        const length = Math.hypot(dx, dy) || 1;
        brush(cell.x - dy / length * sideBias, cell.y + dx / length * sideBias, widths[index]);
        if (index > 0) brush((cell.x + before.x) / 2, (cell.y + before.y) / 2, (widths[index] + widths[index - 1]) / 2);
      });

      const roundedCorners = [];
      for (let index = 1; index < path.length - 1; index += 1) {
        const corner = path[index];
        const before = path[index - 1];
        const after = path[index + 1];
        const inX = corner.x - before.x;
        const inY = corner.y - before.y;
        const outX = after.x - corner.x;
        const outY = after.y - corner.y;
        if (inX * outX + inY * outY !== 0 || random() >= settings.roundingChance) continue;
        let incoming = 1;
        let outgoing = 1;
        while (incoming < 3 && index - incoming > 0
          && path[index - incoming].x - path[index - incoming - 1].x === inX
          && path[index - incoming].y - path[index - incoming - 1].y === inY) incoming += 1;
        while (outgoing < 3 && index + outgoing < path.length - 1
          && path[index + outgoing + 1].x - path[index + outgoing].x === outX
          && path[index + outgoing + 1].y - path[index + outgoing].y === outY) outgoing += 1;
        const radius = Math.min(incoming, outgoing, 1 + Math.floor(random() * 3));
        const entry = { x: corner.x - inX * radius, y: corner.y - inY * radius };
        const exit = { x: corner.x + outX * radius, y: corner.y + outY * radius };
        const countBefore = added.length;
        for (let step = 0; step <= radius * 6; step += 1) {
          const t = step / (radius * 6);
          const u = 1 - t;
          brush(u * u * entry.x + 2 * u * t * corner.x + t * t * exit.x,
            u * u * entry.y + 2 * u * t * corner.y + t * t * exit.y,
            Math.max(widths[index], Math.min(settings.maxWidth, 1.8)));
        }
        if (added.length > countBefore) roundedCorners.push({ ...corner, radius });
      }

      const actualWidths = measureWidths(path, footprint, width, height, settings.maxWidth + 1);
      results.push({
        id: `road_${routeIndex + 1}`, path,
        roomIds: [...new Set([startRoom, endRoom].filter((id) => id >= 0).map((id) => layout.rooms[id].id))],
        targetWidths: widths, actualWidths: actualWidths.length ? actualWidths : [1], addedCells: added,
        bulge: added.length ? bulge : null, roundedCorners,
      });
    });
    return results;
  }

  function measureWidths(path, footprint, width, height, maxDistance = Math.max(width, height)) {
    const ownPath = new Set(path.map(({ x, y }) => y * width + x));
    const widths = path.map((cell, index) => {
      const other = path[index + 1] || path[index - 1] || cell;
      const horizontal = cell.y === other.y;
      const perpendicularNeighbor = [-1, 1].some((sign) => {
        const x = cell.x + (horizontal ? 0 : sign);
        const y = cell.y + (horizontal ? sign : 0);
        return x >= 0 && y >= 0 && x < width && y < height && ownPath.has(y * width + x);
      });
      if (perpendicularNeighbor) return null;
      let span = 1;
      for (const sign of [-1, 1]) {
        for (let distance = 1; distance <= maxDistance; distance += 1) {
          const x = cell.x + (horizontal ? 0 : sign * distance);
          const y = cell.y + (horizontal ? sign * distance : 0);
          if (x < 0 || y < 0 || x >= width || y >= height || !footprint.has(y * width + x)) break;
          span += 1;
        }
      }
      return span;
    }).filter((value) => value !== null);
    return widths.length ? widths : [1];
  }

  function traceRoutes(pathCells, width, height) {
    const indices = [];
    const nodes = new Set();
    pathCells.forEach((value, index) => {
      if (!value) return;
      indices.push(index);
      if (adjacent(index, width, height).filter((neighbor) => pathCells[neighbor]).length !== 2) nodes.add(index);
    });
    const visited = new Set();
    const routes = [];
    const edgeKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
    [...nodes, ...indices.filter((index) => !nodes.has(index))].forEach((start) => {
      const neighbors = adjacent(start, width, height).filter((neighbor) => pathCells[neighbor]);
      if (!neighbors.length) routes.push([start]);
      neighbors.forEach((first) => {
        if (visited.has(edgeKey(start, first))) return;
        const route = [start];
        let previous = start;
        let current = first;
        while (!visited.has(edgeKey(previous, current))) {
          visited.add(edgeKey(previous, current));
          route.push(current);
          if (nodes.has(current) || current === start) break;
          const next = adjacent(current, width, height).find((neighbor) => neighbor !== previous && pathCells[neighbor]);
          if (next === undefined) break;
          previous = current;
          current = next;
        }
        routes.push(route);
      });
    });
    return routes;
  }

  function nearestRoom(start, blocked, pathCells, roomIds, width, height) {
    const visited = new Set([start, blocked]);
    const queue = [start];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      for (const neighbor of adjacent(queue[cursor], width, height)) {
        if (roomIds[neighbor] >= 0) return roomIds[neighbor];
        if (!pathCells[neighbor] || visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
    return -1;
  }

  function adjacent(index, width, height) {
    const result = [];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) result.push(index - 1);
    if (x + 1 < width) result.push(index + 1);
    if (y > 0) result.push(index - width);
    if (y + 1 < height) result.push(index + width);
    return result;
  }

  function roomArea(room) {
    return (room.right - room.left + 1) * (room.bottom - room.top + 1);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  return Object.freeze({ shape, traceRoutes, measureWidths });
});
