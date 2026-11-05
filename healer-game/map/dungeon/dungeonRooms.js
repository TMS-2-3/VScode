(function initDungeonRooms(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HEALER_DUNGEON_ROOMS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonRooms() {
  "use strict";

  function shape(layout, config, random) {
    const { cells, rooms } = layout;
    const { width, height } = config;
    const settings = config.generator.roomShape;
    rooms.forEach((room) => {
      const roomWidth = room.right - room.left + 1;
      const roomHeight = room.bottom - room.top + 1;
      const limit = Math.max(0, Math.min(settings.maxCornerRadius, Math.floor((roomWidth - 2) / 2), Math.floor((roomHeight - 2) / 2)));
      const radius = limit && random() < settings.roundingChance ? 1 + Math.floor(random() * limit) : 0;
      const protectedCells = new Set([room.center.y * width + room.center.x]);
      const anchors = new Map();
      const insideRoom = (x, y) => x >= room.left && x <= room.right && y >= room.top && y <= room.bottom;
      const addAnchor = (x, y, horizontal) => anchors.set(`${x}:${y}:${horizontal}`, { x, y, horizontal });
      (room.doors || []).forEach((door) => addAnchor(
        Math.max(room.left, Math.min(room.right, door.x)),
        Math.max(room.top, Math.min(room.bottom, door.y)),
        door.x < room.left || door.x > room.right
      ));
      for (let y = room.top; y <= room.bottom; y += 1) {
        for (let x = room.left; x <= room.right; x += 1) {
          if (cells[y * width + x] === 2) addAnchor(x, y, x === room.left || x === room.right);
          if (x !== room.left && x !== room.right && y !== room.top && y !== room.bottom) continue;
          if (cells[y * width + x] === 1) continue;
          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height || insideRoom(nx, ny)) continue;
            if (cells[ny * width + nx] !== 1) addAnchor(x, y, dx !== 0);
          }
        }
      }
      // Keep an inward lane for every existing entrance, including doors at room corners.
      anchors.forEach((anchor) => {
        let { x, y } = anchor;
        protectedCells.add(y * width + x);
        const walkX = () => {
          while (x !== room.center.x) { x += Math.sign(room.center.x - x); protectedCells.add(y * width + x); }
        };
        const walkY = () => {
          while (y !== room.center.y) { y += Math.sign(room.center.y - y); protectedCells.add(y * width + x); }
        };
        if (anchor.horizontal) { walkX(); walkY(); }
        else { walkY(); walkX(); }
      });

      const corners = [
        { name: "topLeft", x: room.left, y: room.top, dx: 1, dy: 1 },
        { name: "topRight", x: room.right, y: room.top, dx: -1, dy: 1 },
        { name: "bottomLeft", x: room.left, y: room.bottom, dx: 1, dy: -1 },
        { name: "bottomRight", x: room.right, y: room.bottom, dx: -1, dy: -1 },
      ];
      room.roundedCorners = [];
      corners.forEach((corner) => {
        const removedCells = [];
        for (let row = 0; row < radius; row += 1) {
          for (let col = 0; col < radius; col += 1) {
            if ((radius - col) ** 2 + (radius - row) ** 2 <= radius ** 2) continue;
            const x = corner.x + col * corner.dx;
            const y = corner.y + row * corner.dy;
            const index = y * width + x;
            if (cells[index] !== 0 || protectedCells.has(index)) continue;
            cells[index] = 1;
            removedCells.push({ x, y });
          }
        }
        if (removedCells.length) room.roundedCorners.push({ corner: corner.name, radius, removedCells });
      });
      room.cornerRadius = room.roundedCorners.length ? radius : 0;
      room.shape = room.cornerRadius ? "rounded" : "rectangle";
    });
    refresh(layout, config);
  }

  function refresh(layout, config) {
    const { cells, rooms } = layout;
    const { width } = config;
    rooms.forEach((room) => {
      room.width = room.right - room.left + 1;
      room.height = room.bottom - room.top + 1;
      room.floorCells = [];
      for (let y = room.top; y <= room.bottom; y += 1) {
        for (let x = room.left; x <= room.right; x += 1) {
          if (cells[y * width + x] !== 1) room.floorCells.push({ x, y });
        }
      }
      room.area = room.floorCells.length;
      const floorSet = new Set(room.floorCells.map(({ x, y }) => y * width + x));
      room.outlineEdges = [];
      room.floorCells.forEach(({ x, y }) => {
        if (x === room.left || !floorSet.has(y * width + x - 1)) room.outlineEdges.push({ x1: x, y1: y, x2: x, y2: y + 1 });
        if (x === room.right || !floorSet.has(y * width + x + 1)) room.outlineEdges.push({ x1: x + 1, y1: y, x2: x + 1, y2: y + 1 });
        if (y === room.top || !floorSet.has((y - 1) * width + x)) room.outlineEdges.push({ x1: x, y1: y, x2: x + 1, y2: y });
        if (y === room.bottom || !floorSet.has((y + 1) * width + x)) room.outlineEdges.push({ x1: x, y1: y + 1, x2: x + 1, y2: y + 1 });
      });
    });
  }

  return Object.freeze({ shape, refresh });
});
