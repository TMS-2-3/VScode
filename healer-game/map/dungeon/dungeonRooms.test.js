"use strict";

const assert = require("node:assert/strict");
const rooms = require("./dungeonRooms.js");
const profiles = require("./dungeonProfiles.js");
const generator = require("./dungeonGenerator.js").create(require("../../rot.js-master/dist/rot.js"));

testRoundedFootprintAndOutline();
testCornerDoorsAndUndeclaredConnections();
testDisabledAndSmallRooms();
testProfileRoundTrip();
testGeneratedRooms();
console.log("dungeonRooms tests passed");

function fixture() {
  const width = 24;
  const height = 20;
  const room = { id: "room", left: 4, right: 12, top: 4, bottom: 12, width: 9, height: 9, center: { x: 8, y: 8 }, area: 81, doors: [] };
  const cells = Array(width * height).fill(1);
  for (let y = room.top; y <= room.bottom; y += 1) {
    for (let x = room.left; x <= room.right; x += 1) cells[y * width + x] = 0;
  }
  return {
    layout: { rooms: [room], cells },
    config: { width, height, generator: { roomShape: { roundingChance: 1, maxCornerRadius: 3 } } },
  };
}

function testRoundedFootprintAndOutline() {
  const { layout, config } = fixture();
  rooms.shape(layout, config, () => 0.9);
  const [room] = layout.rooms;
  assert.equal(room.shape, "rounded");
  assert.equal(room.cornerRadius, 3);
  assert.equal(room.roundedCorners.length, 4);
  assert.equal(room.area, room.floorCells.length);
  assert.ok(room.area < 81);
  assert.equal(layout.cells[room.center.y * config.width + room.center.x], 0);
  room.roundedCorners.forEach((corner) => corner.removedCells.forEach(({ x, y }) => {
    assert.equal(layout.cells[y * config.width + x], 1);
    assert.ok(!room.floorCells.some((cell) => cell.x === x && cell.y === y));
  }));
  assertConnected(layout.cells, config.width, config.height);
  const floorSet = new Set(room.floorCells.map(({ x, y }) => `${x}:${y}`));
  room.outlineEdges.forEach(({ x1, y1, x2, y2 }) => {
    assert.equal(Math.abs(x2 - x1) + Math.abs(y2 - y1), 1);
    const neighbors = x1 === x2 ? [[x1 - 1, Math.min(y1, y2)], [x1, Math.min(y1, y2)]] : [[Math.min(x1, x2), y1 - 1], [Math.min(x1, x2), y1]];
    assert.equal(neighbors.filter(([x, y]) => floorSet.has(`${x}:${y}`)).length, 1, "every outline edge must separate a room floor from a non-room cell");
  });
  const repeat = fixture();
  rooms.shape(repeat.layout, repeat.config, () => 0.9);
  assert.deepEqual(repeat.layout, layout);
}

function testCornerDoorsAndUndeclaredConnections() {
  for (const declareDoors of [true, false]) {
    const { layout, config } = fixture();
    const [room] = layout.rooms;
    for (let y = 1; y <= 3; y += 1) layout.cells[y * config.width + 4] = 0;
    for (let x = 13; x <= 18; x += 1) layout.cells[12 * config.width + x] = 0;
    layout.cells[3 * config.width + 4] = 2;
    layout.cells[12 * config.width + 13] = 2;
    if (declareDoors) room.doors = [{ x: 4, y: 3 }, { x: 13, y: 12 }];
    const original = layout.cells.slice();
    rooms.shape(layout, config, () => 0.9);
    assert.equal(room.cornerRadius, 3);
    assert.equal(layout.cells[4 * config.width + 4], 0, "a corner entrance must remain open");
    assert.equal(layout.cells[12 * config.width + 12], 0);
    original.forEach((cell, index) => {
      const x = index % config.width;
      const y = Math.floor(index / config.width);
      if (x < room.left || x > room.right || y < room.top || y > room.bottom) assert.equal(layout.cells[index], cell);
    });
    assertConnected(layout.cells, config.width, config.height);
  }
  const internalDoor = fixture();
  internalDoor.layout.cells[4 * internalDoor.config.width + 4] = 2;
  rooms.shape(internalDoor.layout, internalDoor.config, () => 0.9);
  assert.equal(internalDoor.layout.cells[4 * internalDoor.config.width + 4], 2);
  assertConnected(internalDoor.layout.cells, internalDoor.config.width, internalDoor.config.height);
}

function testDisabledAndSmallRooms() {
  for (const overrides of [{ roundingChance: 0 }, { maxCornerRadius: 0 }]) {
    const { layout, config } = fixture();
    Object.assign(config.generator.roomShape, overrides);
    const original = layout.cells.slice();
    rooms.shape(layout, config, () => 0.1);
    assert.deepEqual(layout.cells, original);
    assert.equal(layout.rooms[0].cornerRadius, 0);
    assert.equal(layout.rooms[0].outlineEdges.length, 36);
  }
  const cells = Array(64).fill(1);
  const room = { id: "tiny", left: 2, right: 3, top: 2, bottom: 3, center: { x: 2, y: 2 }, doors: [] };
  for (let y = 2; y <= 3; y += 1) for (let x = 2; x <= 3; x += 1) cells[y * 8 + x] = 0;
  rooms.shape({ cells, rooms: [room] }, { width: 8, height: 8, generator: { roomShape: { roundingChance: 1, maxCornerRadius: 3 } } }, () => 0.9);
  assert.equal(room.area, 4);
  assert.equal(room.cornerRadius, 0, "small rooms must not be hollowed out");
}

function testProfileRoundTrip() {
  const record = profiles.createRecord({ ...profiles.standard, generator: { ...profiles.standard.generator, roomShape: { roundingChance: 0.8, maxCornerRadius: 2 } } }, { id: "rounded", name: "角丸の森" });
  assert.deepEqual(profiles.parse(profiles.serialize([record]))[0].config.generator.roomShape, { roundingChance: 0.8, maxCornerRadius: 2 });
}

function testGeneratedRooms() {
  let roundedCount = 0;
  let rectangleCount = 0;
  for (const scale of [1, 3, 6, 10]) {
    for (let seed = 1; seed <= 30; seed += 1) {
      const result = generator.generate({ ...profiles.standard, scale }, { seed: `rooms-${seed}`, maxAttempts: 200 });
      assert.equal(result.ok, true, `scale ${scale}, seed ${seed}`);
      assert.equal(result.metrics.roundedRoomCount, result.rooms.filter((room) => room.cornerRadius > 0).length);
      assertConnected(result.cells, result.width, result.height);
      result.rooms.forEach((room) => {
        if (room.cornerRadius) roundedCount += 1;
        else rectangleCount += 1;
        assert.equal(room.area, room.floorCells.length);
        assert.ok(room.floorCells.every(({ x, y }) => result.cells[y * result.width + x] !== 1));
        assert.notEqual(result.cells[room.center.y * result.width + room.center.x], 1);
        room.roundedCorners.flatMap((corner) => corner.removedCells).forEach(({ x, y }) => {
          assert.equal(result.cells[y * result.width + x], 1, "corridor widening must not undo a rounded room corner");
        });
      });
      result.rooms.flatMap((room) => room.doors).forEach(({ x, y }) => assert.notEqual(result.cells[y * result.width + x], 1));
      Object.values(result.placements).filter(Array.isArray).flat().forEach((placement) => {
        if (!Number.isFinite(placement.x) || !Number.isFinite(placement.y)) return;
        for (let row = 0; row < (placement.height || 1); row += 1) {
          for (let col = 0; col < (placement.width || 1); col += 1) {
            assert.notEqual(result.cells[(placement.y + row) * result.width + placement.x + col], 1, "placements must fit entirely on the rounded floor");
          }
        }
      });
    }
  }
  assert.ok(roundedCount > 0 && rectangleCount > 0, "rounded and rectangular rooms must both occur");
}

function assertConnected(cells, width, height) {
  const start = cells.findIndex((cell) => cell !== 1);
  const visited = new Set([start]);
  const queue = [start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % width;
    const y = Math.floor(index / width);
    const neighbors = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, y > 0 ? index - width : -1, y < height - 1 ? index + width : -1];
    neighbors.forEach((next) => {
      if (next < 0 || cells[next] === 1 || visited.has(next)) return;
      visited.add(next);
      queue.push(next);
    });
  }
  assert.equal(visited.size, cells.filter((cell) => cell !== 1).length, "every floor must remain connected");
}
