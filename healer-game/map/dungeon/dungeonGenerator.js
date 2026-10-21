(function initDungeonGenerator(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.HEALER_DUNGEON_GENERATOR = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonGeneratorModule() {
  "use strict";

  const CELL_TYPES = Object.freeze({
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
  });

  const DEFAULT_CONFIG = Object.freeze({
    schemaVersion: 1,
    id: "generated_dungeon",
    name: "Generated Dungeon",
    theme: "generic_dungeon",
    width: 60,
    height: 40,
    retryLimit: null,
    generator: {
      type: "digger",
      roomWidth: [4, 9],
      roomHeight: [4, 7],
      corridorLength: [2, 8],
      dugPercentage: 0.2,
      timeLimit: 1000,
    },
    validation: {
      minRooms: 6,
      maxRooms: 12,
      minMainPathLength: 30,
      minBranchRooms: 2,
      minFloorRatio: 0.12,
      maxFloorRatio: 0.36,
    },
    roomRoles: {
      treasureCount: [1, 3],
      restCount: [0, 0],
      restPathRange: [0.6, 0.85],
    },
    placements: {
      enemyCount: [4, 8],
      trapCount: [0, 3],
      decorationCount: [0, 0],
      minEnemySpacing: 2,
      minTrapSpacing: 2,
    },
    safety: {
      entranceClearance: 8,
      exitClearance: 2,
    },
    mandatoryEvents: [],
  });

  function create(rot) {
    assertRot(rot);

    return Object.freeze({
      generate(config = {}, options = {}) {
        return generateDungeon(rot, config, options);
      },
      generateOrThrow(config = {}, options = {}) {
        const result = generateDungeon(rot, config, options);
        if (!result.ok) {
          const error = new Error(`Dungeon generation failed after ${result.attempts.length} attempts.`);
          error.result = result;
          throw error;
        }
        return result;
      },
    });
  }

  function generateDungeon(rot, rawConfig = {}, options = {}) {
    assertRot(rot);
    const config = normalizeConfig(rawConfig);
    const baseSeed = normalizeSeed(options.seed == null ? Date.now() : options.seed);
    const attemptLimit = normalizeRetryLimit(options.maxAttempts == null ? config.retryLimit : options.maxAttempts);
    const attempts = [];
    let bestAttempt = null;

    for (let attemptIndex = 0; attemptLimit === null || attemptIndex < attemptLimit; attemptIndex += 1) {
      const generationSeed = deriveSeed(baseSeed, attemptIndex);
      const candidate = buildCandidate(rot, config, baseSeed, generationSeed, attemptIndex);
      const report = {
        attempt: attemptIndex + 1,
        generationSeed,
        valid: candidate.validation.valid,
        errors: candidate.validation.errors.slice(),
        warnings: candidate.validation.warnings.slice(),
        metrics: clone(candidate.metrics),
      };
      attempts.push(report);

      if (!bestAttempt || report.errors.length < bestAttempt.errors.length) {
        bestAttempt = report;
      }
      if (candidate.validation.valid) {
        candidate.attempts = attempts;
        return candidate;
      }
    }

    return {
      ok: false,
      schemaVersion: 1,
      reason: "attempt_limit_exhausted",
      dungeonId: config.id,
      seed: baseSeed,
      config,
      attempts,
      bestAttempt,
    };
  }

  function buildCandidate(rot, config, baseSeed, generationSeed, attemptIndex) {
    const generated = withRotSeed(rot, generationSeed, () => createDiggerLayout(rot, config));
    const random = createRandom(deriveSeed(generationSeed, 0x51f15e));
    const pair = findFarthestRoomPair(generated.cells, config.width, config.height, generated.rooms);
    const entranceRoom = pair ? generated.rooms[pair.fromRoomIndex] : generated.rooms[0] || null;
    const exitRoom = pair ? generated.rooms[pair.toRoomIndex] : generated.rooms[generated.rooms.length - 1] || null;
    const entrance = entranceRoom ? point(entranceRoom.center.x, entranceRoom.center.y) : null;
    const exit = exitRoom ? point(exitRoom.center.x, exitRoom.center.y) : null;
    const route = entrance && exit
      ? findPath(generated.cells, config.width, config.height, entrance, exit)
      : null;
    const mainPath = route ? route.path : [];
    const entranceDistances = entrance
      ? createDistanceMap(generated.cells, config.width, config.height, entrance)
      : createEmptyDistanceMap(config.width * config.height);
    const exitDistances = exit
      ? createDistanceMap(generated.cells, config.width, config.height, exit)
      : createEmptyDistanceMap(config.width * config.height);

    decorateRooms(generated.rooms, mainPath, entranceDistances, config.width);
    if (entranceRoom) entranceRoom.role = "entrance";
    if (exitRoom) exitRoom.role = "exit";

    const reservationMap = new Map();
    const placements = {
      entrance: entrance ? { id: "entrance", type: "entrance", x: entrance.x, y: entrance.y, roomId: entranceRoom.id } : null,
      exit: exit ? { id: "exit", type: "exit", x: exit.x, y: exit.y, roomId: exitRoom.id } : null,
      mandatoryEvents: [],
      treasure: [],
      rest: [],
      enemies: [],
      traps: [],
      decorations: [],
    };
    if (entrance) reserveCells(reservationMap, [entrance], "entrance");
    if (exit) reserveCells(reservationMap, [exit], "exit");

    const placementTargets = {
      mandatoryEvents: config.mandatoryEvents.filter((event) => event.required !== false).length,
      treasure: randomInt(random, config.roomRoles.treasureCount),
      rest: randomInt(random, config.roomRoles.restCount),
      enemies: randomInt(random, config.placements.enemyCount),
      traps: randomInt(random, config.placements.trapCount),
      decorations: randomInt(random, config.placements.decorationCount),
    };

    placeMandatoryEvents({
      config,
      cells: generated.cells,
      rooms: generated.rooms,
      width: config.width,
      height: config.height,
      entranceDistances,
      random,
      reservationMap,
      placements,
    });
    placeTreasureRooms({
      count: placementTargets.treasure,
      cells: generated.cells,
      rooms: generated.rooms,
      width: config.width,
      height: config.height,
      random,
      reservationMap,
      placements,
    });
    placeRestRooms({
      count: placementTargets.rest,
      cells: generated.cells,
      rooms: generated.rooms,
      width: config.width,
      height: config.height,
      pathLength: mainPath.length,
      range: config.roomRoles.restPathRange,
      random,
      reservationMap,
      placements,
    });
    placeAmbientObjects({
      config,
      cells: generated.cells,
      rooms: generated.rooms,
      width: config.width,
      height: config.height,
      entranceDistances,
      exitDistances,
      random,
      reservationMap,
      placements,
      placementTargets,
    });

    const reservations = Array.from(reservationMap.entries()).map(([key, reason]) => {
      const [x, y] = key.split(",").map(Number);
      return { x, y, reason };
    });
    const floorCount = generated.cells.reduce((total, cell) => total + (isWalkable(cell) ? 1 : 0), 0);
    const branchRooms = generated.rooms.filter((room) => !room.onMainPath && room.role !== "entrance" && room.role !== "exit");
    const metrics = {
      roomCount: generated.rooms.length,
      corridorCount: generated.corridors.length,
      floorCount,
      floorRatio: floorCount / Math.max(1, config.width * config.height),
      mainPathLength: Math.max(0, mainPath.length - 1),
      mainPathRoomCount: generated.rooms.filter((room) => room.onMainPath).length,
      branchRoomCount: branchRooms.length,
      deadEndRoomCount: generated.rooms.filter((room) => room.doorCount <= 1).length,
      junctionRoomCount: generated.rooms.filter((room) => room.doorCount >= 3).length,
      placementTargets,
      placementCounts: {
        mandatoryEvents: placements.mandatoryEvents.filter((event) => event.required !== false).length,
        treasure: placements.treasure.length,
        rest: placements.rest.length,
        enemies: placements.enemies.length,
        traps: placements.traps.length,
        decorations: placements.decorations.length,
      },
    };
    const validation = validateCandidate({
      config,
      generated,
      entrance,
      exit,
      mainPath,
      metrics,
      placements,
    });

    return {
      ok: validation.valid,
      schemaVersion: 1,
      dungeonId: config.id,
      name: config.name,
      theme: config.theme,
      seed: baseSeed,
      generationSeed,
      attempt: attemptIndex + 1,
      width: config.width,
      height: config.height,
      cellTypes: CELL_TYPES,
      cells: generated.cells,
      rooms: generated.rooms,
      corridors: generated.corridors,
      entrance,
      exit,
      mainPath,
      branchRoomIds: branchRooms.map((room) => room.id),
      placements,
      reservations,
      metrics,
      validation,
      config,
    };
  }

  function createDiggerLayout(rot, config) {
    if (config.generator.type !== "digger") {
      throw new Error(`Unsupported dungeon generator: ${config.generator.type}`);
    }
    const width = config.width;
    const height = config.height;
    const cells = Array(width * height).fill(CELL_TYPES.WALL);
    const digger = new rot.Map.Digger(width, height, {
      roomWidth: config.generator.roomWidth.slice(),
      roomHeight: config.generator.roomHeight.slice(),
      corridorLength: config.generator.corridorLength.slice(),
      dugPercentage: config.generator.dugPercentage,
      timeLimit: config.generator.timeLimit,
    });
    digger.create((x, y, value) => {
      cells[toIndex(x, y, width)] = value === 1 ? CELL_TYPES.WALL : CELL_TYPES.FLOOR;
    });

    const rooms = digger.getRooms().map((room, index) => {
      const doors = [];
      room.getDoors((x, y) => doors.push(point(x, y)));
      doors.forEach((door) => {
        if (inside(door.x, door.y, width, height)) {
          cells[toIndex(door.x, door.y, width)] = CELL_TYPES.DOOR;
        }
      });
      return {
        id: `room_${index + 1}`,
        index,
        left: room.getLeft(),
        right: room.getRight(),
        top: room.getTop(),
        bottom: room.getBottom(),
        width: room.getRight() - room.getLeft() + 1,
        height: room.getBottom() - room.getTop() + 1,
        area: (room.getRight() - room.getLeft() + 1) * (room.getBottom() - room.getTop() + 1),
        center: point(room.getCenter()[0], room.getCenter()[1]),
        doors,
        doorCount: doors.length,
        role: "normal",
        onMainPath: false,
        distanceFromEntrance: -1,
      };
    });
    const corridors = digger.getCorridors().map((corridor, index) => ({
      id: `corridor_${index + 1}`,
      start: point(corridor._startX, corridor._startY),
      end: point(corridor._endX, corridor._endY),
      length: Math.max(Math.abs(corridor._endX - corridor._startX), Math.abs(corridor._endY - corridor._startY)) + 1,
    }));
    return { cells, rooms, corridors };
  }

  function findFarthestRoomPair(cells, width, height, rooms) {
    let best = null;
    for (let i = 0; i < rooms.length; i += 1) {
      const distances = createDistanceMap(cells, width, height, rooms[i].center);
      for (let j = i + 1; j < rooms.length; j += 1) {
        const distance = distances[toIndex(rooms[j].center.x, rooms[j].center.y, width)];
        if (distance < 0) continue;
        if (!best || distance > best.distance) {
          best = { fromRoomIndex: i, toRoomIndex: j, distance };
        }
      }
    }
    return best;
  }

  function decorateRooms(rooms, mainPath, entranceDistances, width) {
    const pathKeys = new Set(mainPath.map((cell) => keyOf(cell.x, cell.y)));
    rooms.forEach((room) => {
      room.onMainPath = roomIntersectsPath(room, pathKeys);
      room.distanceFromEntrance = entranceDistances[toIndex(room.center.x, room.center.y, width)];
      if (room.doorCount >= 3) {
        room.role = "junction";
      }
    });
  }

  function roomIntersectsPath(room, pathKeys) {
    for (let y = room.top; y <= room.bottom; y += 1) {
      for (let x = room.left; x <= room.right; x += 1) {
        if (pathKeys.has(keyOf(x, y))) return true;
      }
    }
    return false;
  }

  function placeMandatoryEvents(context) {
    const {
      config, cells, rooms, width, height, entranceDistances, random, reservationMap, placements,
    } = context;
    config.mandatoryEvents.forEach((event, index) => {
      const footprint = normalizeFootprint(event.footprint);
      const required = event.required !== false;
      let selected = null;
      if (event.position && Number.isFinite(event.position.x) && Number.isFinite(event.position.y)) {
        selected = makeFootprintPlacement(
          Math.floor(event.position.x),
          Math.floor(event.position.y),
          footprint.width,
          footprint.height,
          cells,
          width,
          height,
          reservationMap
        );
      } else {
        const roomCandidates = rooms.filter((room) => {
          if (room.role === "entrance" || room.role === "exit" || room.role === "event") return false;
          if (room.width < footprint.width || room.height < footprint.height) return false;
          const distance = entranceDistances[toIndex(room.center.x, room.center.y, width)];
          if (distance < event.minEntranceDistance) return false;
          if (Number.isFinite(event.maxEntranceDistance) && distance > event.maxEntranceDistance) return false;
          return event.preferBranch === false || !room.onMainPath;
        });
        shuffle(roomCandidates, random);
        roomCandidates.sort((a, b) => b.distanceFromEntrance - a.distanceFromEntrance);
        for (const room of roomCandidates) {
          const footprintPlacement = findFootprintInRoom(room, footprint, cells, width, height, reservationMap);
          if (footprintPlacement) {
            selected = { ...footprintPlacement, room };
            break;
          }
        }
      }
      if (!selected) return;

      const room = selected.room || findContainingRoom(rooms, selected.x, selected.y);
      if (room) room.role = "event";
      reserveCells(reservationMap, selected.cells, `event:${event.id}`);
      placements.mandatoryEvents.push({
        id: event.id || `event_${index + 1}`,
        type: event.type || "event",
        required,
        x: selected.x,
        y: selected.y,
        width: selected.width,
        height: selected.height,
        roomId: room ? room.id : null,
        approach: findApproachCell(selected, cells, width, height, reservationMap),
        data: clone(event.data || {}),
      });
    });
  }

  function placeTreasureRooms(context) {
    const { count, cells, rooms, width, height, random, reservationMap, placements } = context;
    const candidates = rooms.filter((room) => !["entrance", "exit", "event"].includes(room.role));
    shuffle(candidates, random);
    candidates.sort((a, b) => {
      if (a.onMainPath !== b.onMainPath) return a.onMainPath ? 1 : -1;
      return b.distanceFromEntrance - a.distanceFromEntrance;
    });
    for (const room of candidates) {
      if (placements.treasure.length >= count) break;
      const cell = findCellInRoom(room, cells, width, height, reservationMap);
      if (!cell) continue;
      room.role = "treasure";
      reserveCells(reservationMap, [cell], `treasure:${placements.treasure.length + 1}`);
      placements.treasure.push({
        id: `treasure_${placements.treasure.length + 1}`,
        type: "treasure",
        x: cell.x,
        y: cell.y,
        roomId: room.id,
      });
    }
  }

  function placeRestRooms(context) {
    const {
      count, cells, rooms, width, height, pathLength, range, random, reservationMap, placements,
    } = context;
    if (count <= 0 || pathLength <= 1) return;
    const minDistance = Math.floor((pathLength - 1) * range[0]);
    const maxDistance = Math.ceil((pathLength - 1) * range[1]);
    const candidates = rooms.filter((room) => {
      return room.onMainPath
        && !["entrance", "exit", "event", "treasure"].includes(room.role)
        && room.distanceFromEntrance >= minDistance
        && room.distanceFromEntrance <= maxDistance;
    });
    shuffle(candidates, random);
    for (const room of candidates) {
      if (placements.rest.length >= count) break;
      const cell = findCellInRoom(room, cells, width, height, reservationMap);
      if (!cell) continue;
      room.role = "rest";
      reserveCells(reservationMap, [cell], `rest:${placements.rest.length + 1}`);
      placements.rest.push({
        id: `rest_${placements.rest.length + 1}`,
        type: "rest",
        x: cell.x,
        y: cell.y,
        roomId: room.id,
      });
    }
  }

  function placeAmbientObjects(context) {
    const {
      config, cells, rooms, width, height, entranceDistances, exitDistances,
      random, reservationMap, placements, placementTargets,
    } = context;
    const roomCells = collectRoomCells(rooms, cells, width, height);
    const enemyCandidates = roomCells.filter((cell) => {
      const index = toIndex(cell.x, cell.y, width);
      return entranceDistances[index] >= config.safety.entranceClearance
        && exitDistances[index] >= config.safety.exitClearance;
    });
    placements.enemies = selectSpacedCells({
      type: "enemy",
      candidates: enemyCandidates,
      count: placementTargets.enemies,
      minSpacing: config.placements.minEnemySpacing,
      random,
      reservationMap,
      rooms,
    });

    const trapCandidates = roomCells.filter((cell) => {
      const index = toIndex(cell.x, cell.y, width);
      return entranceDistances[index] >= config.safety.entranceClearance
        && exitDistances[index] >= config.safety.exitClearance;
    });
    placements.traps = selectSpacedCells({
      type: "trap",
      candidates: trapCandidates,
      count: placementTargets.traps,
      minSpacing: config.placements.minTrapSpacing,
      random,
      reservationMap,
      rooms,
    });

    placements.decorations = selectSpacedCells({
      type: "decoration",
      candidates: roomCells,
      count: placementTargets.decorations,
      minSpacing: 1,
      random,
      reservationMap,
      rooms,
    });
  }

  function selectSpacedCells(options) {
    const candidates = options.candidates.slice();
    const selected = [];
    shuffle(candidates, options.random);
    for (const cell of candidates) {
      if (selected.length >= options.count) break;
      if (options.reservationMap.has(keyOf(cell.x, cell.y))) continue;
      if (selected.some((other) => manhattan(cell, other) < options.minSpacing)) continue;
      const id = `${options.type}_${selected.length + 1}`;
      const room = findContainingRoom(options.rooms, cell.x, cell.y);
      const placement = {
        id,
        type: options.type,
        x: cell.x,
        y: cell.y,
        roomId: room ? room.id : null,
      };
      selected.push(placement);
      reserveCells(options.reservationMap, [cell], `${options.type}:${selected.length}`);
    }
    return selected;
  }

  function validateCandidate(context) {
    const { config, generated, entrance, exit, mainPath, metrics, placements } = context;
    const errors = [];
    const warnings = [];
    const rules = config.validation;

    if (!entrance || !exit || mainPath.length === 0) {
      errors.push("Entrance and exit are not connected.");
    }
    if (metrics.roomCount < rules.minRooms) {
      errors.push(`Room count ${metrics.roomCount} is below ${rules.minRooms}.`);
    }
    if (metrics.roomCount > rules.maxRooms) {
      errors.push(`Room count ${metrics.roomCount} exceeds ${rules.maxRooms}.`);
    }
    if (metrics.mainPathLength < rules.minMainPathLength) {
      errors.push(`Main path ${metrics.mainPathLength} is below ${rules.minMainPathLength}.`);
    }
    if (metrics.branchRoomCount < rules.minBranchRooms) {
      errors.push(`Branch room count ${metrics.branchRoomCount} is below ${rules.minBranchRooms}.`);
    }
    if (metrics.floorRatio < rules.minFloorRatio || metrics.floorRatio > rules.maxFloorRatio) {
      errors.push(`Floor ratio ${metrics.floorRatio.toFixed(3)} is outside ${rules.minFloorRatio}-${rules.maxFloorRatio}.`);
    }
    Object.keys(metrics.placementTargets).forEach((key) => {
      const expected = metrics.placementTargets[key];
      const actual = metrics.placementCounts[key];
      if (actual < expected) {
        errors.push(`${key} placement count ${actual} is below target ${expected}.`);
      }
    });
    const requiredIds = new Set(config.mandatoryEvents.filter((event) => event.required !== false).map((event) => event.id));
    placements.mandatoryEvents.forEach((event) => requiredIds.delete(event.id));
    if (requiredIds.size) {
      errors.push(`Required events could not be placed: ${Array.from(requiredIds).join(", ")}.`);
    }
    if (generated.rooms.length === rules.maxRooms) {
      warnings.push("Room count reached the configured maximum.");
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  function findPath(cells, width, height, start, goal) {
    const startIndex = toIndex(start.x, start.y, width);
    const goalIndex = toIndex(goal.x, goal.y, width);
    const distance = createEmptyDistanceMap(cells.length);
    const previous = new Int32Array(cells.length);
    previous.fill(-1);
    const queue = new Int32Array(cells.length);
    let head = 0;
    let tail = 0;
    distance[startIndex] = 0;
    queue[tail++] = startIndex;

    while (head < tail) {
      const current = queue[head++];
      if (current === goalIndex) break;
      forEachNeighbor(current, width, height, (next) => {
        if (distance[next] >= 0 || !isWalkable(cells[next])) return;
        distance[next] = distance[current] + 1;
        previous[next] = current;
        queue[tail++] = next;
      });
    }
    if (distance[goalIndex] < 0) return null;

    const path = [];
    let cursor = goalIndex;
    while (cursor >= 0) {
      path.push(point(cursor % width, Math.floor(cursor / width)));
      if (cursor === startIndex) break;
      cursor = previous[cursor];
    }
    path.reverse();
    return { path, distance: distance[goalIndex] };
  }

  function createDistanceMap(cells, width, height, start) {
    const distance = createEmptyDistanceMap(cells.length);
    if (!start || !inside(start.x, start.y, width, height)) return distance;
    const startIndex = toIndex(start.x, start.y, width);
    if (!isWalkable(cells[startIndex])) return distance;
    const queue = new Int32Array(cells.length);
    let head = 0;
    let tail = 0;
    distance[startIndex] = 0;
    queue[tail++] = startIndex;
    while (head < tail) {
      const current = queue[head++];
      forEachNeighbor(current, width, height, (next) => {
        if (distance[next] >= 0 || !isWalkable(cells[next])) return;
        distance[next] = distance[current] + 1;
        queue[tail++] = next;
      });
    }
    return distance;
  }

  function createEmptyDistanceMap(size) {
    const distance = new Int32Array(size);
    distance.fill(-1);
    return distance;
  }

  function forEachNeighbor(index, width, height, callback) {
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) callback(index - 1);
    if (x + 1 < width) callback(index + 1);
    if (y > 0) callback(index - width);
    if (y + 1 < height) callback(index + width);
  }

  function collectRoomCells(rooms, cells, width, height) {
    const result = [];
    const seen = new Set();
    rooms.forEach((room) => {
      for (let y = room.top; y <= room.bottom; y += 1) {
        for (let x = room.left; x <= room.right; x += 1) {
          const key = keyOf(x, y);
          if (seen.has(key) || !inside(x, y, width, height)) continue;
          if (!isWalkable(cells[toIndex(x, y, width)])) continue;
          seen.add(key);
          result.push(point(x, y));
        }
      }
    });
    return result;
  }

  function findCellInRoom(room, cells, width, height, reservationMap) {
    const candidates = [];
    for (let y = room.top; y <= room.bottom; y += 1) {
      for (let x = room.left; x <= room.right; x += 1) {
        if (!inside(x, y, width, height)) continue;
        if (!isWalkable(cells[toIndex(x, y, width)])) continue;
        if (reservationMap.has(keyOf(x, y))) continue;
        candidates.push(point(x, y));
      }
    }
    candidates.sort((a, b) => manhattan(a, room.center) - manhattan(b, room.center));
    return candidates[0] || null;
  }

  function findFootprintInRoom(room, footprint, cells, width, height, reservationMap) {
    const candidates = [];
    for (let y = room.top; y <= room.bottom - footprint.height + 1; y += 1) {
      for (let x = room.left; x <= room.right - footprint.width + 1; x += 1) {
        const placement = makeFootprintPlacement(x, y, footprint.width, footprint.height, cells, width, height, reservationMap);
        if (placement) candidates.push(placement);
      }
    }
    candidates.sort((a, b) => {
      const centerA = point(a.x + (a.width - 1) / 2, a.y + (a.height - 1) / 2);
      const centerB = point(b.x + (b.width - 1) / 2, b.y + (b.height - 1) / 2);
      return manhattan(centerA, room.center) - manhattan(centerB, room.center);
    });
    return candidates[0] || null;
  }

  function makeFootprintPlacement(x, y, footprintWidth, footprintHeight, cells, width, height, reservationMap) {
    const footprintCells = [];
    for (let row = y; row < y + footprintHeight; row += 1) {
      for (let col = x; col < x + footprintWidth; col += 1) {
        if (!inside(col, row, width, height)) return null;
        if (!isWalkable(cells[toIndex(col, row, width)])) return null;
        if (reservationMap.has(keyOf(col, row))) return null;
        footprintCells.push(point(col, row));
      }
    }
    return { x, y, width: footprintWidth, height: footprintHeight, cells: footprintCells };
  }

  function findApproachCell(placement, cells, width, height, reservationMap) {
    const candidates = [];
    for (let x = placement.x; x < placement.x + placement.width; x += 1) {
      candidates.push(point(x, placement.y - 1), point(x, placement.y + placement.height));
    }
    for (let y = placement.y; y < placement.y + placement.height; y += 1) {
      candidates.push(point(placement.x - 1, y), point(placement.x + placement.width, y));
    }
    return candidates.find((cell) => {
      return inside(cell.x, cell.y, width, height)
        && isWalkable(cells[toIndex(cell.x, cell.y, width)])
        && !reservationMap.has(keyOf(cell.x, cell.y));
    }) || null;
  }

  function findContainingRoom(rooms, x, y) {
    return rooms.find((room) => x >= room.left && x <= room.right && y >= room.top && y <= room.bottom) || null;
  }

  function reserveCells(reservationMap, cells, reason) {
    cells.forEach((cell) => reservationMap.set(keyOf(cell.x, cell.y), reason));
  }

  function normalizeConfig(rawConfig) {
    const merged = merge(DEFAULT_CONFIG, rawConfig || {});
    const width = clampInt(merged.width, 20, 500, DEFAULT_CONFIG.width);
    const height = clampInt(merged.height, 20, 500, DEFAULT_CONFIG.height);
    const minRooms = clampInt(merged.validation.minRooms, 1, 1000, DEFAULT_CONFIG.validation.minRooms);
    const maxRooms = clampInt(merged.validation.maxRooms, minRooms, 1000, DEFAULT_CONFIG.validation.maxRooms);
    return {
      schemaVersion: 1,
      id: String(merged.id || DEFAULT_CONFIG.id),
      name: String(merged.name || DEFAULT_CONFIG.name),
      theme: String(merged.theme || DEFAULT_CONFIG.theme),
      width,
      height,
      retryLimit: normalizeRetryLimit(merged.retryLimit),
      generator: {
        type: String(merged.generator.type || "digger").toLowerCase(),
        roomWidth: normalizeIntRange(merged.generator.roomWidth, [4, 9], 2, width - 4),
        roomHeight: normalizeIntRange(merged.generator.roomHeight, [4, 7], 2, height - 4),
        corridorLength: normalizeIntRange(merged.generator.corridorLength, [2, 8], 1, Math.max(width, height)),
        dugPercentage: clampNumber(merged.generator.dugPercentage, 0.05, 0.8, 0.2),
        timeLimit: clampInt(merged.generator.timeLimit, 50, 10000, 1000),
      },
      validation: {
        minRooms,
        maxRooms,
        minMainPathLength: clampInt(merged.validation.minMainPathLength, 1, width * height, 30),
        minBranchRooms: clampInt(merged.validation.minBranchRooms, 0, maxRooms, 2),
        minFloorRatio: clampNumber(merged.validation.minFloorRatio, 0.01, 0.95, 0.12),
        maxFloorRatio: clampNumber(merged.validation.maxFloorRatio, 0.01, 0.95, 0.36),
      },
      roomRoles: {
        treasureCount: normalizeIntRange(merged.roomRoles.treasureCount, [1, 3], 0, maxRooms),
        restCount: normalizeIntRange(merged.roomRoles.restCount, [0, 0], 0, maxRooms),
        restPathRange: normalizeNumberRange(merged.roomRoles.restPathRange, [0.6, 0.85], 0, 1),
      },
      placements: {
        enemyCount: normalizeIntRange(merged.placements.enemyCount, [4, 8], 0, width * height),
        trapCount: normalizeIntRange(merged.placements.trapCount, [0, 3], 0, width * height),
        decorationCount: normalizeIntRange(merged.placements.decorationCount, [0, 0], 0, width * height),
        minEnemySpacing: clampInt(merged.placements.minEnemySpacing, 1, 20, 2),
        minTrapSpacing: clampInt(merged.placements.minTrapSpacing, 1, 20, 2),
      },
      safety: {
        entranceClearance: clampInt(merged.safety.entranceClearance, 0, width * height, 8),
        exitClearance: clampInt(merged.safety.exitClearance, 0, width * height, 2),
      },
      mandatoryEvents: normalizeMandatoryEvents(merged.mandatoryEvents),
    };
  }

  function normalizeMandatoryEvents(events) {
    return (Array.isArray(events) ? events : []).filter(Boolean).map((event, index) => ({
      id: String(event.id || `mandatory_event_${index + 1}`),
      type: String(event.type || "event"),
      required: event.required !== false,
      preferBranch: event.preferBranch !== false,
      minEntranceDistance: clampInt(event.minEntranceDistance, 0, 100000, 0),
      maxEntranceDistance: Number.isFinite(Number(event.maxEntranceDistance))
        ? Math.max(0, Math.floor(Number(event.maxEntranceDistance)))
        : null,
      footprint: normalizeFootprint(event.footprint),
      position: event.position && Number.isFinite(Number(event.position.x)) && Number.isFinite(Number(event.position.y))
        ? { x: Math.floor(Number(event.position.x)), y: Math.floor(Number(event.position.y)) }
        : null,
      data: clone(event.data || {}),
    }));
  }

  function normalizeFootprint(value) {
    return {
      width: clampInt(value && value.width, 1, 100, 1),
      height: clampInt(value && value.height, 1, 100, 1),
    };
  }

  function merge(base, override) {
    const result = clone(base);
    Object.keys(override || {}).forEach((key) => {
      const value = override[key];
      if (value && typeof value === "object" && !Array.isArray(value)
        && result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
        result[key] = merge(result[key], value);
      } else {
        result[key] = clone(value);
      }
    });
    return result;
  }

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === "object") {
      const result = {};
      Object.keys(value).forEach((key) => {
        result[key] = clone(value[key]);
      });
      return result;
    }
    return value;
  }

  function normalizeIntRange(value, fallback, min, max) {
    const range = Array.isArray(value) ? value : fallback;
    const first = clampInt(range[0], min, max, fallback[0]);
    const second = clampInt(range[1], min, max, fallback[1]);
    return [Math.min(first, second), Math.max(first, second)];
  }

  function normalizeRetryLimit(value) {
    if (value == null || value === Infinity || value === "until_success") {
      return null;
    }
    return clampInt(value, 1, 100000, 1);
  }

  function normalizeNumberRange(value, fallback, min, max) {
    const range = Array.isArray(value) ? value : fallback;
    const first = clampNumber(range[0], min, max, fallback[0]);
    const second = clampNumber(range[1], min, max, fallback[1]);
    return [Math.min(first, second), Math.max(first, second)];
  }

  function clampInt(value, min, max, fallback) {
    const number = Number(value);
    return Math.min(max, Math.max(min, Number.isFinite(number) ? Math.floor(number) : fallback));
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    return Math.min(max, Math.max(min, Number.isFinite(number) ? number : fallback));
  }

  function normalizeSeed(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return (Math.floor(value) >>> 0) || 1;
    }
    const text = String(value == null ? "" : value);
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) || 1;
  }

  function deriveSeed(seed, salt) {
    let value = (seed + Math.imul((salt + 1) >>> 0, 0x9e3779b1)) >>> 0;
    value ^= value >>> 16;
    value = Math.imul(value, 0x85ebca6b);
    value ^= value >>> 13;
    value = Math.imul(value, 0xc2b2ae35);
    value ^= value >>> 16;
    return value >>> 0 || 1;
  }

  function createRandom(seed) {
    let state = seed >>> 0;
    return function random() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomInt(random, range) {
    return range[0] + Math.floor(random() * (range[1] - range[0] + 1));
  }

  function shuffle(values, random) {
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const temp = values[i];
      values[i] = values[j];
      values[j] = temp;
    }
    return values;
  }

  function withRotSeed(rot, seed, callback) {
    const previousSeed = typeof rot.RNG.getSeed === "function" ? rot.RNG.getSeed() : null;
    const previousState = typeof rot.RNG.getState === "function" ? rot.RNG.getState().slice() : null;
    rot.RNG.setSeed(seed);
    try {
      return callback();
    } finally {
      if (previousSeed != null) rot.RNG.setSeed(previousSeed);
      if (previousState && typeof rot.RNG.setState === "function") rot.RNG.setState(previousState);
    }
  }

  function assertRot(rot) {
    if (!rot || !rot.Map || typeof rot.Map.Digger !== "function" || !rot.RNG || typeof rot.RNG.setSeed !== "function") {
      throw new TypeError("A compatible rot.js instance with ROT.Map.Digger and ROT.RNG is required.");
    }
  }

  function getCell(result, x, y) {
    if (!result || !Array.isArray(result.cells) || !inside(x, y, result.width, result.height)) return null;
    return result.cells[toIndex(x, y, result.width)];
  }

  function toAscii(result, options = {}) {
    if (!result || !result.ok) return "";
    const glyphs = { wall: "#", floor: ".", door: "+", path: "·", ...(options.glyphs || {}) };
    const output = result.cells.map((cell) => {
      if (cell === CELL_TYPES.DOOR) return glyphs.door;
      return cell === CELL_TYPES.WALL ? glyphs.wall : glyphs.floor;
    });
    result.mainPath.forEach((cell) => {
      const index = toIndex(cell.x, cell.y, result.width);
      if (output[index] === glyphs.floor) output[index] = glyphs.path;
    });
    result.placements.treasure.forEach((item) => { output[toIndex(item.x, item.y, result.width)] = "T"; });
    result.placements.rest.forEach((item) => { output[toIndex(item.x, item.y, result.width)] = "R"; });
    result.placements.enemies.forEach((item) => { output[toIndex(item.x, item.y, result.width)] = "M"; });
    result.placements.traps.forEach((item) => { output[toIndex(item.x, item.y, result.width)] = "^"; });
    result.placements.mandatoryEvents.forEach((item) => { output[toIndex(item.x, item.y, result.width)] = "E"; });
    if (result.entrance) output[toIndex(result.entrance.x, result.entrance.y, result.width)] = "S";
    if (result.exit) output[toIndex(result.exit.x, result.exit.y, result.width)] = "G";
    const rows = [];
    for (let y = 0; y < result.height; y += 1) {
      rows.push(output.slice(y * result.width, (y + 1) * result.width).join(""));
    }
    return rows.join("\n");
  }

  function isWalkable(cell) {
    return cell === CELL_TYPES.FLOOR || cell === CELL_TYPES.DOOR;
  }

  function inside(x, y, width, height) {
    return x >= 0 && y >= 0 && x < width && y < height;
  }

  function toIndex(x, y, width) {
    return y * width + x;
  }

  function keyOf(x, y) {
    return `${x},${y}`;
  }

  function point(x, y) {
    return { x, y };
  }

  function manhattan(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  return Object.freeze({
    CELL_TYPES,
    DEFAULT_CONFIG,
    create,
    generate(rot, config, options) {
      return generateDungeon(rot, config, options);
    },
    normalizeConfig,
    normalizeSeed,
    getCell,
    toAscii,
  });
});
