(function initDungeonGenerator(root, factory) {
  "use strict";

  const tiles = typeof module === "object" && module.exports ? require("./dungeonTiles.js") : root.HEALER_DUNGEON_TILES;
  const corridors = typeof module === "object" && module.exports ? require("./dungeonCorridors.js") : root.HEALER_DUNGEON_CORRIDORS;
  const rooms = typeof module === "object" && module.exports ? require("./dungeonRooms.js") : root.HEALER_DUNGEON_ROOMS;
  const wallSpace = typeof module === "object" && module.exports ? require("./dungeonWallSpace.js") : root.HEALER_DUNGEON_WALL_SPACE;
  const placementSafety = typeof module === "object" && module.exports ? require("./dungeonPlacementSafety.js") : root.HEALER_DUNGEON_PLACEMENT_SAFETY;
  const countLimits = typeof module === "object" && module.exports ? require("./dungeonTreasureLimits.js") : root.HEALER_DUNGEON_TREASURE_LIMITS;
  const weights = typeof module === "object" && module.exports ? require("./dungeonWeights.js") : root.HEALER_DUNGEON_WEIGHTS;
  const api = factory(tiles, corridors, rooms, wallSpace, placementSafety, countLimits, weights);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.HEALER_DUNGEON_GENERATOR = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonGeneratorModule(tiles, corridors, rooms, wallSpace, placementSafety, countLimits, weights) {
  "use strict";

  const CELL_TYPES = Object.freeze({
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
  });

  const SCALE_FACTORS = Object.freeze([0, 0.7, 0.85, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7]);
  const DANGER_ENEMY_FACTORS = Object.freeze([0, 0.5, 0.75, 1, 1.35, 1.7, 2.05, 2.4, 2.75, 3.1, 3.5]);
  const DANGER_TRAP_FACTORS = Object.freeze([0, 0.45, 0.75, 1, 1.5, 2, 2.6, 3.3, 4.1, 5, 6]);
  const DANGER_TREASURE_RATE_RANGE = Object.freeze([0.3, 0.5]);

  const DEFAULT_CONFIG = Object.freeze({
    schemaVersion: 1,
    id: "generated_dungeon",
    name: "Generated Dungeon",
    theme: "generic_dungeon",
    scale: 3,
    danger: 3,
    width: 60,
    height: 40,
    retryLimit: null,
    endpointLineCopy: false,
    generator: {
      type: "digger",
      roomWidth: [4, 9],
      roomHeight: [4, 7],
      corridorLength: [2, 8],
      dugPercentage: 0.2,
      timeLimit: 1000,
      roomShape: {
        roundingChance: 0.55,
        maxCornerRadius: 3,
      },
      corridorShape: {
        enabled: true,
        minWidth: 1,
        maxWidth: 5,
        bulgeChance: 0.65,
        roundingChance: 0.55,
      },
    },
    entranceApproach: {
      enabled: true,
      startDirections: ["down", "left", "up", "right"],
      minLength: 3,
      maxLength: 18,
      maxTurns: 2,
      turnChance: 0.45,
    },
    exitApproach: {
      enabled: true,
      endDirections: ["up", "right", "down", "left"],
      minLength: 3,
      maxLength: 18,
      maxTurns: 2,
      turnChance: 0.45,
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
      treasureCount: [0, 0],
      treasureCornerBias: 0.85,
      restCount: [0, 0],
      restPathRange: [0.6, 0.85],
    },
    branchContents: {
      enabled: true,
      minPathLength: 3,
      outcomes: {
        empty: 0.31,
        trap: 0.31,
        treasure: 0.31,
        both: 0.07,
      },
    },
    tiles: {
      floorTileId: "caveFloor01",
      wallTileId: "caveWall01",
    },
    treasureLimits: { min: 0, max: null },
    treasureTable: {
      rolls: [1, 1],
      entries: [],
    },
    enemyPool: [],
    enemyLimits: { min: 0, max: null },
    trapPool: [],
    trapLimits: { min: 0, max: null },
    placements: {
      enemyCount: [4, 8],
      trapCount: [0, 0],
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

  function buildCandidate(rot, baseConfig, baseSeed, generationSeed, attemptIndex) {
    let config = baseConfig;
    const generated = withRotSeed(rot, generationSeed, () => createDiggerLayout(rot, config));
    rooms.shape(generated, config, createRandom(deriveSeed(generationSeed, 0x3a010e)));
    const random = createRandom(deriveSeed(generationSeed, 0x51f15e));
    const entranceApproach = config.entranceApproach.enabled
      ? createEntranceApproach(generated, config, random)
      : null;
    const pair = config.entranceApproach.enabled
      ? null
      : findFarthestRoomPair(generated.cells, config.width, config.height, generated.rooms);
    const entranceRoom = entranceApproach
      ? generated.rooms.find((room) => room.id === entranceApproach.roomId) || null
      : pair
        ? generated.rooms[pair.fromRoomIndex]
        : generated.rooms[0] || null;
    const entrance = entranceApproach
      ? point(entranceApproach.start.x, entranceApproach.start.y)
      : entranceRoom
        ? point(entranceRoom.center.x, entranceRoom.center.y)
        : null;
    const exitApproach = entrance && config.exitApproach.enabled
      ? createExitApproach(generated, config, random, entrance, entranceRoom && entranceRoom.id)
      : null;
    const exitRoom = exitApproach
      ? generated.rooms.find((room) => room.id === exitApproach.roomId) || null
      : entrance
        ? findFarthestRoomFromPoint(generated.cells, config.width, config.height, generated.rooms, entrance, entranceRoom && entranceRoom.id)
        : null;
    const exit = exitApproach
      ? point(exitApproach.end.x, exitApproach.end.y)
      : exitRoom
        ? point(exitRoom.center.x, exitRoom.center.y)
        : null;
    const corridorShapes = corridors.shape(generated, config, createRandom(deriveSeed(generationSeed, 0x7c012e)));
    const wallSpacing = wallSpace.reserve(generated, config, { entrance, exit, entranceApproach, exitApproach, corridorShapes });
    config = { ...config, height: wallSpacing.height };
    const route = entrance && exit
      ? findPath(generated.cells, config.width, config.height, entrance, exit)
      : null;
    let mainPath = route ? route.path : [];
    const entranceDistances = entrance
      ? createDistanceMap(generated.cells, config.width, config.height, entrance)
      : createEmptyDistanceMap(config.width * config.height);
    const exitDistances = exit
      ? createDistanceMap(generated.cells, config.width, config.height, exit)
      : createEmptyDistanceMap(config.width * config.height);

    decorateRooms(generated.rooms, mainPath, entranceDistances, config.width);
    if (entranceRoom) entranceRoom.role = "entrance";
    if (exitRoom) exitRoom.role = "exit";
    const branchRoutes = analyzeBranchRoutes(
      generated.cells,
      config.width,
      config.height,
      generated.rooms,
      mainPath
    );

    const reservationMap = new Map();
    const placements = {
      entrance: entrance ? { id: "entrance", type: "entrance", x: entrance.x, y: entrance.y, roomId: entranceRoom.id } : null,
      exit: exit ? { id: "exit", type: "exit", x: exit.x, y: exit.y, roomId: exitRoom.id } : null,
      mandatoryEvents: [],
      branchContents: [],
      treasure: [],
      rest: [],
      enemies: [],
      traps: [],
      decorations: [],
    };
    if (entrance) reserveCells(reservationMap, [entrance], "entrance");
    if (exit) reserveCells(reservationMap, [exit], "exit");
    const accessContext = { cells: generated.cells, width: config.width, height: config.height, entrance, exit };
    const canPlaceObject = (candidate) => placementSafety.inspect(accessContext, [...placementSafety.objects(placements), candidate]).valid;

    const placementTargets = {
      mandatoryEvents: config.mandatoryEvents.filter((event) => event.required !== false).length,
      treasure: config.treasureLimits.min,
      rest: randomInt(random, config.roomRoles.restCount),
      enemies: boundedCount(randomInt(random, config.placements.enemyCount), config.enemyLimits),
      traps: randomInt(random, config.placements.trapCount),
      decorations: randomInt(random, config.placements.decorationCount),
    };

    placeMandatoryEvents({
      config,
      canPlaceObject,
      cells: generated.cells,
      rooms: generated.rooms,
      width: config.width,
      height: config.height,
      entranceDistances,
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
    placeBranchContents({
      config,
      canPlaceObject,
      branchRoutes,
      cells: generated.cells,
      rooms: generated.rooms,
      width: config.width,
      height: config.height,
      random,
      reservationMap,
      placements,
    });
    fillMinimumTreasure({
      config,
      canPlaceObject,
      cells: generated.cells,
      rooms: generated.rooms,
      width: config.width,
      height: config.height,
      random,
      reservationMap,
      placements,
    });
    placementTargets.traps = boundedCount(placements.traps.length + placementTargets.traps, config.trapLimits);
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
    assignTreasureContents(placements.treasure, config.treasureTable, random);
    assignWeightedTypes(placements.enemies, config.enemyPool, random, "enemyId", "enemyName");
    assignWeightedTypes(placements.traps, config.trapPool, random, "trapTypeId", "trapName");
    const blockingObjects = placementSafety.objects(placements);
    const objectAccess = placementSafety.inspect(accessContext, blockingObjects);
    blockingObjects.forEach((object, index) => {
      object.blocking = true;
      object.approach = objectAccess.approaches[index];
    });
    const navigableRoute = entrance && exit ? findPath(objectAccess.navigationCells, config.width, config.height, entrance, exit) : null;
    mainPath = navigableRoute ? navigableRoute.path : [];
    const mainPathKeys = new Set(mainPath.map((cell) => keyOf(cell.x, cell.y)));
    generated.rooms.forEach((room) => { room.onMainPath = roomIntersectsPath(room, mainPathKeys); });

    const reservations = Array.from(reservationMap.entries()).map(([key, reason]) => {
      const [x, y] = key.split(",").map(Number);
      return { x, y, reason };
    });
    const floorCount = generated.cells.reduce((total, cell) => total + (isWalkable(cell) ? 1 : 0), 0);
    const branchRooms = generated.rooms.filter((room) => !room.onMainPath && room.role !== "entrance" && room.role !== "exit");
    const metrics = {
      roomCount: generated.rooms.length,
      roundedRoomCount: generated.rooms.filter((room) => room.cornerRadius > 0).length,
      corridorCount: generated.corridors.length,
      corridorWidthMin: corridorShapes.length ? Math.min(...corridorShapes.map((road) => Math.min(...road.actualWidths))) : 1,
      corridorWidthMax: corridorShapes.length ? Math.max(...corridorShapes.map((road) => Math.max(...road.actualWidths))) : 1,
      corridorAddedCells: corridorShapes.reduce((total, road) => total + road.addedCells.length, 0),
      roundedCornerCount: corridorShapes.reduce((total, road) => total + road.roundedCorners.length, 0),
      wallSpaceAddedRows: wallSpacing.addedRows,
      floorCount,
      floorRatio: floorCount / Math.max(1, config.width * config.height),
      mainPathLength: Math.max(0, mainPath.length - 1),
      mainPathRoomCount: generated.rooms.filter((room) => room.onMainPath).length,
      branchRoomCount: branchRooms.length,
      branchRouteCount: branchRoutes.length,
      entranceApproachLength: entranceApproach ? entranceApproach.length : 0,
      exitApproachLength: exitApproach ? exitApproach.length : 0,
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
      branchContentCounts: countBranchOutcomes(placements.branchContents),
    };
    const validation = validateCandidate({
      config,
      generated,
      entrance,
      exit,
      entranceApproach,
      exitApproach,
      mainPath,
      metrics,
      placements,
      objectAccess,
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
      navigationCells: objectAccess.navigationCells,
      tileRegions: tiles.classifyCells({ width: config.width, height: config.height, cells: generated.cells, rooms: generated.rooms, config }),
      rooms: generated.rooms,
      corridors: generated.corridors,
      corridorShapes,
      wallSpacing,
      entrance,
      exit,
      entranceApproach,
      exitApproach,
      mainPath,
      lineCopies: tiles.createEndpointLineCopies({ config, entrance, exit, entranceApproach, exitApproach, mainPath }),
      branchRoutes,
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

  function findFarthestRoomFromPoint(cells, width, height, rooms, start, excludedRoomId) {
    const distances = createDistanceMap(cells, width, height, start);
    let bestRoom = null;
    let bestDistance = -1;
    rooms.forEach((room) => {
      if (room.id === excludedRoomId) return;
      const distance = distances[toIndex(room.center.x, room.center.y, width)];
      if (distance > bestDistance) {
        bestDistance = distance;
        bestRoom = room;
      }
    });
    return bestRoom;
  }

  function createEntranceApproach(generated, config, random) {
    const candidates = [];
    const startDirections = new Set(config.entranceApproach.startDirections);
    generated.rooms.forEach((room) => {
      ["top", "right", "bottom", "left"].forEach((side) => {
        const startDirection = startDirectionForSide(side);
        if (!startDirections.has(startDirection)) return;
        getRoomSidePositions(room, side).forEach((position) => {
          const candidate = buildEntranceApproachCandidate(
            room,
            side,
            position,
            generated.cells,
            config.width,
            config.height
          );
          if (!candidate) return;
          if (candidate.length < config.entranceApproach.minLength) return;
          if (candidate.length > config.entranceApproach.maxLength) return;
          candidates.push(candidate);
        });
      });
      const bentAttempts = config.entranceApproach.maxTurns > 0 ? 18 : 0;
      for (let attempt = 0; attempt < bentAttempts; attempt += 1) {
        const directions = config.entranceApproach.startDirections;
        const startDirection = directions[Math.floor(random() * directions.length)];
        const desiredTurns = config.entranceApproach.maxTurns >= 2 && random() < 0.58 ? 2 : 1;
        const candidate = buildBentEntranceApproachCandidate(
          room,
          startDirection,
          desiredTurns,
          generated.cells,
          config.width,
          config.height,
          config.entranceApproach,
          random
        );
        if (candidate) candidates.push(candidate);
      }
    });
    if (!candidates.length) return null;

    const straightCandidates = candidates.filter((candidate) => candidate.turns === 0);
    const bentCandidates = candidates.filter((candidate) => candidate.turns > 0);
    const shouldUseBent = bentCandidates.length > 0 && random() < config.entranceApproach.turnChance;
    const pool = shouldUseBent ? bentCandidates : straightCandidates.length ? straightCandidates : bentCandidates;
    shuffle(pool, random);
    const selected = pool[0];
    selected.path.slice(0, -1).forEach((cell) => {
      generated.cells[toIndex(cell.x, cell.y, config.width)] = CELL_TYPES.FLOOR;
    });
    generated.cells[toIndex(selected.door.x, selected.door.y, config.width)] = CELL_TYPES.DOOR;
    const room = generated.rooms.find((candidate) => candidate.id === selected.roomId);
    if (room && !room.doors.some((door) => door.x === selected.door.x && door.y === selected.door.y)) {
      room.doors.push(point(selected.door.x, selected.door.y));
      room.doorCount = room.doors.length;
    }
    generated.corridors.push({
      id: "entrance_corridor",
      kind: "entrance",
      start: point(selected.start.x, selected.start.y),
      end: point(selected.door.x, selected.door.y),
      length: selected.length,
      turns: selected.turns,
    });
    return selected;
  }

  function createExitApproach(generated, config, random, entrance, excludedRoomId) {
    const candidates = [];
    const endDirections = new Set(config.exitApproach.endDirections);
    const distances = createDistanceMap(generated.cells, config.width, config.height, entrance);
    generated.rooms.forEach((room) => {
      if (room.id === excludedRoomId) return;
      const roomDistance = distances[toIndex(room.center.x, room.center.y, config.width)];
      if (roomDistance < 0) return;
      ["top", "right", "bottom", "left"].forEach((side) => {
        if (!endDirections.has(endDirectionForSide(side))) return;
        getRoomSidePositions(room, side).forEach((position) => {
          const candidate = buildEntranceApproachCandidate(
            room,
            side,
            position,
            generated.cells,
            config.width,
            config.height
          );
          if (!candidate) return;
          if (candidate.length < config.exitApproach.minLength) return;
          if (candidate.length > config.exitApproach.maxLength) return;
          candidate.roomDistance = roomDistance;
          candidates.push(candidate);
        });
      });
      const bentAttempts = config.exitApproach.maxTurns > 0 ? 18 : 0;
      for (let attempt = 0; attempt < bentAttempts; attempt += 1) {
        const directions = config.exitApproach.endDirections;
        const endDirection = directions[Math.floor(random() * directions.length)];
        const desiredTurns = config.exitApproach.maxTurns >= 2 && random() < 0.58 ? 2 : 1;
        const candidate = buildBentEntranceApproachCandidate(
          room,
          oppositeDirection(endDirection),
          desiredTurns,
          generated.cells,
          config.width,
          config.height,
          config.exitApproach,
          random
        );
        if (!candidate) continue;
        candidate.roomDistance = roomDistance;
        candidates.push(candidate);
      }
    });
    if (!candidates.length) return null;

    const farthestDistance = Math.max(...candidates.map((candidate) => candidate.roomDistance));
    const farthestCandidates = candidates.filter((candidate) => candidate.roomDistance === farthestDistance);
    const straightCandidates = farthestCandidates.filter((candidate) => candidate.turns === 0);
    const bentCandidates = farthestCandidates.filter((candidate) => candidate.turns > 0);
    const shouldUseBent = bentCandidates.length > 0 && random() < config.exitApproach.turnChance;
    const pool = shouldUseBent ? bentCandidates : straightCandidates.length ? straightCandidates : bentCandidates;
    shuffle(pool, random);
    const selected = pool[0];
    selected.path.slice(0, -1).forEach((cell) => {
      generated.cells[toIndex(cell.x, cell.y, config.width)] = CELL_TYPES.FLOOR;
    });
    generated.cells[toIndex(selected.door.x, selected.door.y, config.width)] = CELL_TYPES.DOOR;
    const room = generated.rooms.find((candidate) => candidate.id === selected.roomId);
    if (room && !room.doors.some((door) => door.x === selected.door.x && door.y === selected.door.y)) {
      room.doors.push(point(selected.door.x, selected.door.y));
      room.doorCount = room.doors.length;
    }
    const end = point(selected.start.x, selected.start.y);
    const exitApproach = {
      side: selected.side,
      endDirection: oppositeDirection(selected.startDirection),
      roomId: selected.roomId,
      end,
      door: point(selected.door.x, selected.door.y),
      interior: point(selected.interior.x, selected.interior.y),
      length: selected.length,
      turns: selected.turns,
      path: selected.path.slice().reverse().map((cell) => point(cell.x, cell.y)),
    };
    generated.corridors.push({
      id: "exit_corridor",
      kind: "exit",
      start: point(selected.door.x, selected.door.y),
      end,
      length: selected.length,
      turns: selected.turns,
    });
    return exitApproach;
  }

  function startDirectionForSide(side) {
    return { top: "down", right: "left", bottom: "up", left: "right" }[side];
  }

  function endDirectionForSide(side) {
    return { top: "up", right: "right", bottom: "down", left: "left" }[side];
  }

  function oppositeDirection(direction) {
    return { up: "down", right: "left", down: "up", left: "right" }[direction];
  }

  function getRoomSidePositions(room, side) {
    const positions = [];
    if (side === "top" || side === "bottom") {
      for (let x = room.left; x <= room.right; x += 1) positions.push(x);
      positions.sort((a, b) => Math.abs(a - room.center.x) - Math.abs(b - room.center.x));
    } else {
      for (let y = room.top; y <= room.bottom; y += 1) positions.push(y);
      positions.sort((a, b) => Math.abs(a - room.center.y) - Math.abs(b - room.center.y));
    }
    return positions;
  }

  function buildEntranceApproachCandidate(room, side, position, cells, width, height) {
    let start;
    let door;
    let interior;
    const path = [];
    if (side === "top") {
      start = point(position, 0);
      door = point(position, room.top - 1);
      interior = point(position, room.top);
      for (let y = 0; y <= room.top; y += 1) path.push(point(position, y));
    } else if (side === "bottom") {
      start = point(position, height - 1);
      door = point(position, room.bottom + 1);
      interior = point(position, room.bottom);
      for (let y = height - 1; y >= room.bottom; y -= 1) path.push(point(position, y));
    } else if (side === "left") {
      start = point(0, position);
      door = point(room.left - 1, position);
      interior = point(room.left, position);
      for (let x = 0; x <= room.left; x += 1) path.push(point(x, position));
    } else {
      start = point(width - 1, position);
      door = point(room.right + 1, position);
      interior = point(room.right, position);
      for (let x = width - 1; x >= room.right; x -= 1) path.push(point(x, position));
    }
    if (!inside(door.x, door.y, width, height)) return null;
    if (!isWalkable(cells[toIndex(interior.x, interior.y, width)])) return null;
    const corridorCells = path.slice(0, -1);
    if (corridorCells.some((cell) => isWalkable(cells[toIndex(cell.x, cell.y, width)]))) return null;
    if (!hasIsolatedApproach(path, cells, width, height)) return null;
    return {
      side,
      startDirection: startDirectionForSide(side),
      roomId: room.id,
      start,
      door,
      interior,
      length: path.length - 1,
      turns: 0,
      path,
    };
  }

  function buildBentEntranceApproachCandidate(room, startDirection, desiredTurns, cells, width, height, settings, random) {
    const waypoints = desiredTurns === 1
      ? createOneTurnWaypoints(room, startDirection, width, height, random)
      : createTwoTurnWaypoints(room, startDirection, width, height, random);
    if (!waypoints) return null;
    const path = createOrthogonalPath(waypoints.points);
    if (!path || path.length < 2) return null;
    const length = path.length - 1;
    if (length < settings.minLength || length > settings.maxLength) return null;
    if (countPathTurns(path) !== desiredTurns) return null;
    const interior = path[path.length - 1];
    const door = path[path.length - 2];
    if (!isWalkable(cells[toIndex(interior.x, interior.y, width)])) return null;
    if (path.slice(0, -1).some((cell) => isWalkable(cells[toIndex(cell.x, cell.y, width)]))) return null;
    if (!hasIsolatedApproach(path, cells, width, height)) return null;
    return {
      side: waypoints.side,
      startDirection,
      roomId: room.id,
      start: point(path[0].x, path[0].y),
      door: point(door.x, door.y),
      interior: point(interior.x, interior.y),
      length,
      turns: desiredTurns,
      path,
    };
  }

  function createOneTurnWaypoints(room, direction, width, height, random) {
    if (direction === "down" || direction === "up") {
      const enterFromLeft = random() < 0.5;
      const side = enterFromLeft ? "left" : "right";
      const targetY = randomInt(random, [room.top, room.bottom]);
      const startXRange = enterFromLeft ? [0, room.left - 2] : [room.right + 2, width - 1];
      if (startXRange[0] > startXRange[1]) return null;
      const startX = randomInt(random, startXRange);
      const startY = direction === "down" ? 0 : height - 1;
      const interiorX = enterFromLeft ? room.left : room.right;
      return {
        side,
        points: [point(startX, startY), point(startX, targetY), point(interiorX, targetY)],
      };
    }
    const enterFromTop = random() < 0.5;
    const side = enterFromTop ? "top" : "bottom";
    const targetX = randomInt(random, [room.left, room.right]);
    const startYRange = enterFromTop ? [0, room.top - 2] : [room.bottom + 2, height - 1];
    if (startYRange[0] > startYRange[1]) return null;
    const startY = randomInt(random, startYRange);
    const startX = direction === "right" ? 0 : width - 1;
    const interiorY = enterFromTop ? room.top : room.bottom;
    return {
      side,
      points: [point(startX, startY), point(targetX, startY), point(targetX, interiorY)],
    };
  }

  function createTwoTurnWaypoints(room, direction, width, height, random) {
    if (direction === "down" || direction === "up") {
      const side = direction === "down" ? "top" : "bottom";
      const targetX = randomInt(random, [room.left, room.right]);
      const interiorY = direction === "down" ? room.top : room.bottom;
      const doorY = direction === "down" ? room.top - 1 : room.bottom + 1;
      const bendRange = direction === "down" ? [1, doorY - 1] : [doorY + 1, height - 2];
      if (bendRange[0] > bendRange[1]) return null;
      const bendY = randomInt(random, bendRange);
      const maxOffset = Math.max(1, Math.min(width - 1, 10));
      const offset = randomInt(random, [1, maxOffset]) * (random() < 0.5 ? -1 : 1);
      const startX = targetX + offset;
      if (startX < 0 || startX >= width) return null;
      const startY = direction === "down" ? 0 : height - 1;
      return {
        side,
        points: [point(startX, startY), point(startX, bendY), point(targetX, bendY), point(targetX, interiorY)],
      };
    }
    const side = direction === "right" ? "left" : "right";
    const targetY = randomInt(random, [room.top, room.bottom]);
    const interiorX = direction === "right" ? room.left : room.right;
    const doorX = direction === "right" ? room.left - 1 : room.right + 1;
    const bendRange = direction === "right" ? [1, doorX - 1] : [doorX + 1, width - 2];
    if (bendRange[0] > bendRange[1]) return null;
    const bendX = randomInt(random, bendRange);
    const maxOffset = Math.max(1, Math.min(height - 1, 10));
    const offset = randomInt(random, [1, maxOffset]) * (random() < 0.5 ? -1 : 1);
    const startY = targetY + offset;
    if (startY < 0 || startY >= height) return null;
    const startX = direction === "right" ? 0 : width - 1;
    return {
      side,
      points: [point(startX, startY), point(bendX, startY), point(bendX, targetY), point(interiorX, targetY)],
    };
  }

  function createOrthogonalPath(points) {
    const path = [];
    for (let i = 0; i < points.length - 1; i += 1) {
      const from = points[i];
      const to = points[i + 1];
      if (from.x !== to.x && from.y !== to.y) return null;
      const stepX = Math.sign(to.x - from.x);
      const stepY = Math.sign(to.y - from.y);
      const distance = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
      for (let step = i === 0 ? 0 : 1; step <= distance; step += 1) {
        path.push(point(from.x + stepX * step, from.y + stepY * step));
      }
    }
    const unique = new Set(path.map((cell) => keyOf(cell.x, cell.y)));
    return unique.size === path.length ? path : null;
  }

  function countPathTurns(path) {
    let turns = 0;
    let previousDirection = null;
    for (let i = 1; i < path.length; i += 1) {
      const direction = `${Math.sign(path[i].x - path[i - 1].x)},${Math.sign(path[i].y - path[i - 1].y)}`;
      if (previousDirection && direction !== previousDirection) turns += 1;
      previousDirection = direction;
    }
    return turns;
  }

  function hasIsolatedApproach(path, cells, width, height) {
    const pathIndices = new Map(path.map((cell, index) => [keyOf(cell.x, cell.y), index]));
    for (let i = 0; i < path.length - 1; i += 1) {
      const cell = path[i];
      let isolated = true;
      forEachNeighbor(toIndex(cell.x, cell.y, width), width, height, (neighborIndex) => {
        const neighbor = point(neighborIndex % width, Math.floor(neighborIndex / width));
        const pathIndex = pathIndices.get(keyOf(neighbor.x, neighbor.y));
        if (pathIndex != null) {
          if (Math.abs(pathIndex - i) > 1) isolated = false;
          return;
        }
        if (isWalkable(cells[neighborIndex])) isolated = false;
      });
      if (!isolated) return false;
    }
    return true;
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

  function analyzeBranchRoutes(cells, width, height, rooms, mainPath) {
    if (!mainPath.length) return [];
    const distance = createEmptyDistanceMap(cells.length);
    const towardMainPath = new Int32Array(cells.length);
    towardMainPath.fill(-1);
    const queue = new Int32Array(cells.length);
    let head = 0;
    let tail = 0;
    mainPath.forEach((cell) => {
      const index = toIndex(cell.x, cell.y, width);
      if (distance[index] === 0) return;
      distance[index] = 0;
      queue[tail++] = index;
    });
    while (head < tail) {
      const current = queue[head++];
      forEachNeighbor(current, width, height, (next) => {
        if (distance[next] >= 0 || !isWalkable(cells[next])) return;
        distance[next] = distance[current] + 1;
        towardMainPath[next] = current;
        queue[tail++] = next;
      });
    }

    const groups = new Map();
    rooms.filter((room) => !room.onMainPath).forEach((room) => {
      const centerIndex = toIndex(room.center.x, room.center.y, width);
      if (distance[centerIndex] <= 0) return;
      const reversedPath = [];
      let cursor = centerIndex;
      while (cursor >= 0) {
        reversedPath.push(point(cursor % width, Math.floor(cursor / width)));
        if (distance[cursor] === 0) break;
        cursor = towardMainPath[cursor];
      }
      if (reversedPath.length < 2 || distance[cursor] !== 0) return;
      const path = reversedPath.reverse();
      const attachment = path[0];
      const firstStep = path[1];
      const groupKey = `${keyOf(attachment.x, attachment.y)}>${keyOf(firstStep.x, firstStep.y)}`;
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push({ room, path, distance: path.length - 1 });
    });

    const routes = [];
    groups.forEach((candidates) => {
      candidates.sort((a, b) => b.distance - a.distance || a.room.id.localeCompare(b.room.id));
      const endpoint = candidates[0];
      routes.push({
        id: "",
        attachment: point(endpoint.path[0].x, endpoint.path[0].y),
        endpoint: point(endpoint.path[endpoint.path.length - 1].x, endpoint.path[endpoint.path.length - 1].y),
        endpointRoomId: endpoint.room.id,
        roomIds: candidates.map((candidate) => candidate.room.id),
        length: endpoint.distance,
        path: endpoint.path,
      });
    });
    routes.sort((a, b) => {
      return a.attachment.y - b.attachment.y
        || a.attachment.x - b.attachment.x
        || a.endpointRoomId.localeCompare(b.endpointRoomId);
    });
    routes.forEach((route, index) => { route.id = `branch_${index + 1}`; });
    return routes;
  }

  function placeMandatoryEvents(context) {
    const {
      config, cells, rooms, width, height, entranceDistances, random, reservationMap, placements, canPlaceObject,
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
          const footprintPlacement = findFootprintInRoom(room, footprint, cells, width, height, reservationMap, canPlaceObject);
          if (footprintPlacement) {
            selected = { ...footprintPlacement, room };
            break;
          }
        }
      }
      if (!selected || !canPlaceObject(selected)) return;

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

  function placeBranchContents(context) {
    const {
      config, branchRoutes, cells, rooms, width, height, random, reservationMap, placements, canPlaceObject,
    } = context;
    if (!config.branchContents.enabled) return;
    branchRoutes.forEach((route) => {
      if (route.length < config.branchContents.minPathLength) return;
      const room = rooms.find((candidate) => candidate.id === route.endpointRoomId);
      if (!room || ["entrance", "exit", "event", "rest", "treasure"].includes(room.role)) return;
      const trapCandidates = route.path.slice(1, -1).filter((cell) => {
        return !reservationMap.has(keyOf(cell.x, cell.y))
          && !findContainingRoom(rooms, cell.x, cell.y);
      });
      if (!trapCandidates.length) return;

      let outcome = chooseBranchOutcome(random, config.branchContents.outcomes);
      if (config.treasureLimits.max !== null && placements.treasure.length >= config.treasureLimits.max) {
        if (outcome === "treasure") outcome = "empty";
        else if (outcome === "both") outcome = "trap";
      }
      if (config.trapLimits.max !== null && placements.traps.length >= config.trapLimits.max) {
        if (outcome === "trap") outcome = "empty";
        else if (outcome === "both") outcome = "treasure";
      }
      const wantsTrap = outcome === "trap" || outcome === "both";
      const wantsTreasure = outcome === "treasure" || outcome === "both";
      const content = {
        id: `branch_content_${placements.branchContents.length + 1}`,
        branchId: route.id,
        endpointRoomId: room.id,
        outcome,
        trapId: null,
        treasureId: null,
        complete: true,
      };

      if (wantsTreasure) {
        const treasureCell = findTreasureCellInRoom(
          room,
          cells,
          width,
          height,
          reservationMap,
          random,
          config.roomRoles.treasureCornerBias,
          canPlaceObject
        );
        if (treasureCell) {
          const treasureId = `treasure_${placements.treasure.length + 1}`;
          room.role = "treasure";
          reserveCells(reservationMap, [treasureCell], `treasure:${treasureId}`);
          placements.treasure.push({
            id: treasureId,
            type: "treasure",
            x: treasureCell.x,
            y: treasureCell.y,
            roomId: room.id,
            branchId: route.id,
          });
          content.treasureId = treasureId;
        } else {
          content.complete = false;
        }
      }

      if (wantsTrap) {
        const routeMiddle = (route.path.length - 1) / 2;
        shuffle(trapCandidates, random);
        trapCandidates.sort((a, b) => {
          const indexA = route.path.findIndex((cell) => cell.x === a.x && cell.y === a.y);
          const indexB = route.path.findIndex((cell) => cell.x === b.x && cell.y === b.y);
          return Math.abs(indexA - routeMiddle) - Math.abs(indexB - routeMiddle);
        });
        const trapCell = trapCandidates[0];
        if (trapCell) {
          const trapId = `trap_${placements.traps.length + 1}`;
          reserveCells(reservationMap, [trapCell], `trap:${trapId}`);
          placements.traps.push({
            id: trapId,
            type: "trap",
            x: trapCell.x,
            y: trapCell.y,
            roomId: null,
            branchId: route.id,
          });
          content.trapId = trapId;
        } else {
          content.complete = false;
        }
      }
      placements.branchContents.push(content);
    });
  }

  function fillMinimumTreasure(context) {
    const { config, cells, rooms, width, height, random, reservationMap, placements, canPlaceObject } = context;
    if (placements.treasure.length >= config.treasureLimits.min) return;
    const candidates = rooms.filter((room) => !["entrance", "exit", "event", "rest", "treasure"].includes(room.role));
    shuffle(candidates, random);
    for (const room of candidates) {
      if (placements.treasure.length >= config.treasureLimits.min) break;
      const cell = findTreasureCellInRoom(room, cells, width, height, reservationMap, random, config.roomRoles.treasureCornerBias, canPlaceObject);
      if (!cell) continue;
      const id = `treasure_${placements.treasure.length + 1}`;
      room.role = "treasure";
      reserveCells(reservationMap, [cell], `treasure:${id}`);
      placements.treasure.push({ id, type: "treasure", x: cell.x, y: cell.y, roomId: room.id, minimumFill: true });
    }
  }

  function chooseBranchOutcome(random, outcomes) {
    const roll = random();
    let total = 0;
    for (const outcome of ["empty", "trap", "treasure", "both"]) {
      total += outcomes[outcome];
      if (roll < total) return outcome;
    }
    return "both";
  }

  function countBranchOutcomes(contents) {
    const counts = { total: 0, empty: 0, trap: 0, treasure: 0, both: 0 };
    contents.forEach((content) => {
      counts.total += 1;
      counts[content.outcome] += 1;
    });
    return counts;
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
    placements.enemies.push(...selectSpacedCells({
      type: "enemy",
      candidates: enemyCandidates,
      count: placementTargets.enemies,
      minSpacing: config.placements.minEnemySpacing,
      random,
      reservationMap,
      rooms,
      startIndex: placements.enemies.length,
    }));

    const trapCandidates = roomCells.filter((cell) => {
      const index = toIndex(cell.x, cell.y, width);
      return entranceDistances[index] >= config.safety.entranceClearance
        && exitDistances[index] >= config.safety.exitClearance;
    });
    placements.traps.push(...selectSpacedCells({
      type: "trap",
      candidates: trapCandidates,
      count: Math.max(0, placementTargets.traps - placements.traps.length),
      existing: placements.traps,
      minSpacing: config.placements.minTrapSpacing,
      random,
      reservationMap,
      rooms,
      startIndex: placements.traps.length,
    }));

    placements.decorations.push(...selectSpacedCells({
      type: "decoration",
      candidates: roomCells,
      count: placementTargets.decorations,
      minSpacing: 1,
      random,
      reservationMap,
      rooms,
      startIndex: placements.decorations.length,
    }));
  }

  function assignTreasureContents(treasurePlacements, treasureTable, random) {
    if (!treasureTable.entries.length) {
      treasurePlacements.forEach((placement) => { placement.contents = []; });
      return;
    }
    treasurePlacements.forEach((placement) => {
      const contentById = new Map();
      const rollCount = randomInt(random, treasureTable.rolls);
      for (let roll = 0; roll < rollCount; roll += 1) {
        const entry = weights.select(treasureTable.entries, random);
        if (!entry) continue;
        const count = randomInt(random, [entry.minCount, entry.maxCount]);
        const key = `${entry.type}:${entry.id}`;
        const current = contentById.get(key);
        if (current) {
          current.count += count;
        } else {
          contentById.set(key, {
            type: entry.type,
            id: entry.id,
            name: entry.name,
            count,
          });
        }
      }
      placement.contents = Array.from(contentById.values());
    });
  }

  function assignWeightedTypes(placements, pool, random, idField, nameField) {
    placements.forEach((placement) => {
      const entry = weights.select(pool, random);
      placement[idField] = entry ? entry.id : null;
      placement[nameField] = entry ? entry.name : "";
    });
  }

  function boundedCount(count, limits) {
    return Math.max(limits.min, limits.max === null ? count : Math.min(count, limits.max));
  }

  function selectSpacedCells(options) {
    const candidates = options.candidates.slice();
    const selected = [];
    shuffle(candidates, options.random);
    for (const cell of candidates) {
      if (selected.length >= options.count) break;
      if (options.reservationMap.has(keyOf(cell.x, cell.y))) continue;
      if (selected.some((other) => manhattan(cell, other) < options.minSpacing)) continue;
      if ((options.existing || []).some((other) => manhattan(cell, other) < options.minSpacing)) continue;
      const id = `${options.type}_${(options.startIndex || 0) + selected.length + 1}`;
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
    const { config, generated, entrance, exit, entranceApproach, exitApproach, mainPath, metrics, placements, objectAccess } = context;
    const errors = objectAccess.errors.slice();
    const warnings = [];
    const rules = config.validation;

    if (!entrance || !exit || mainPath.length === 0) {
      errors.push("Entrance and exit are not connected.");
    }
    if (config.entranceApproach.enabled && !entranceApproach) {
      errors.push("An isolated entrance corridor could not be created.");
    }
    if (config.exitApproach.enabled && !exitApproach) {
      errors.push("An isolated exit corridor could not be created.");
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
    const incompleteBranches = placements.branchContents.filter((content) => !content.complete);
    if (incompleteBranches.length) {
      errors.push(`Branch contents could not be placed: ${incompleteBranches.map((content) => content.branchId).join(", ")}.`);
    }
    if (config.treasureLimits.max !== null && placements.treasure.length > config.treasureLimits.max) {
      errors.push(`Treasure count ${placements.treasure.length} exceeds ${config.treasureLimits.max}.`);
    }
    [["enemies", config.enemyLimits], ["traps", config.trapLimits]].forEach(([key, limits]) => {
      if (limits.max !== null && placements[key].length > limits.max) errors.push(`${key} count ${placements[key].length} exceeds ${limits.max}.`);
    });
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

  function findTreasureCellInRoom(room, cells, width, height, reservationMap, random, cornerBias, canPlaceObject) {
    const candidates = [];
    const corners = [
      point(room.left, room.top),
      point(room.right, room.top),
      point(room.left, room.bottom),
      point(room.right, room.bottom),
    ];
    for (let y = room.top; y <= room.bottom; y += 1) {
      for (let x = room.left; x <= room.right; x += 1) {
        if (!inside(x, y, width, height)) continue;
        if (!isWalkable(cells[toIndex(x, y, width)])) continue;
        if (reservationMap.has(keyOf(x, y))) continue;
        const cell = point(x, y);
        const cornerDistance = Math.min(...corners.map((corner) => manhattan(cell, corner)));
        candidates.push({ cell, cornerDistance });
      }
    }
    if (!candidates.length) return null;
    const nearestCornerDistance = Math.min(...candidates.map((candidate) => candidate.cornerDistance));
    const cornerCandidates = candidates.filter((candidate) => candidate.cornerDistance <= nearestCornerDistance + 1);
    const pool = cornerCandidates.length && random() < cornerBias ? cornerCandidates : candidates;
    shuffle(pool, random);
    const selected = pool.find(({ cell }) => canPlaceObject(cell));
    if (selected) return selected.cell;
    if (pool === candidates) return null;
    const preferred = new Set(pool);
    const fallback = candidates.filter((candidate) => !preferred.has(candidate));
    shuffle(fallback, random);
    return fallback.find(({ cell }) => canPlaceObject(cell))?.cell || null;
  }

  function findFootprintInRoom(room, footprint, cells, width, height, reservationMap, canPlaceObject) {
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
    return candidates.find(canPlaceObject) || null;
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
    const scale = clampInt(merged.scale, 1, 10, DEFAULT_CONFIG.scale);
    const danger = clampInt(merged.danger, 1, 10, DEFAULT_CONFIG.danger);
    const scaleFactor = SCALE_FACTORS[scale];
    const areaFactor = scaleFactor * scaleFactor;
    const enemyDangerFactor = DANGER_ENEMY_FACTORS[danger];
    const trapDangerFactor = DANGER_TRAP_FACTORS[danger];
    const width = clampInt(Math.round(Number(merged.width) * scaleFactor), 20, 500, DEFAULT_CONFIG.width);
    const height = clampInt(Math.round(Number(merged.height) * scaleFactor), 20, 500, DEFAULT_CONFIG.height);
    const minRooms = scaleInteger(merged.validation.minRooms, areaFactor, 1, 1000, DEFAULT_CONFIG.validation.minRooms);
    const maxRooms = scaleInteger(merged.validation.maxRooms, areaFactor, minRooms, 1000, DEFAULT_CONFIG.validation.maxRooms);
    const chestLimits = countLimits.normalize(merged.treasureLimits);
    if (chestLimits.min > Math.max(0, maxRooms - 2)) throw new Error("下限宝箱数がこの規模で配置できる部屋数を超えています。");
    const enemyLimits = countLimits.normalize(merged.enemyLimits, "魔物");
    const trapLimits = countLimits.normalize(merged.trapLimits, "罠");
    const tileSettings = tiles.normalize(rawConfig && rawConfig.tiles !== undefined ? rawConfig.tiles : DEFAULT_CONFIG.tiles);
    if (typeof merged.endpointLineCopy !== "boolean") throw new Error("直線コピーの設定はONまたはOFFにしてください。");
    const maximumCells = width * height * (tileSettings.wallHeight + 2);
    if (enemyLimits.min > maximumCells) throw new Error("下限魔物数がこの規模で配置できるマス数を超えています。");
    if (trapLimits.min > maximumCells) throw new Error("下限罠数がこの規模で配置できるマス数を超えています。");
    const entranceMinLength = scaleInteger(merged.entranceApproach.minLength, scaleFactor, 1, Math.max(width, height), 3);
    const entranceMaxLength = scaleInteger(merged.entranceApproach.maxLength, scaleFactor, entranceMinLength, Math.max(width, height), 18);
    const exitMinLength = scaleInteger(merged.exitApproach.minLength, scaleFactor, 1, Math.max(width, height), 3);
    const exitMaxLength = scaleInteger(merged.exitApproach.maxLength, scaleFactor, exitMinLength, Math.max(width, height), 18);
    const branchOutcomes = adjustBranchOutcomesForDanger(merged.branchContents.outcomes, trapDangerFactor, danger);
    const populationFactor = areaFactor * enemyDangerFactor;
    return {
      schemaVersion: 1,
      id: String(merged.id || DEFAULT_CONFIG.id),
      name: String(merged.name || DEFAULT_CONFIG.name),
      theme: String(merged.theme || DEFAULT_CONFIG.theme),
      scale,
      danger,
      tuning: {
        scaleFactor,
        areaFactor,
        dangerFactor: enemyDangerFactor,
        enemyDangerFactor,
        trapDangerFactor,
      },
      width,
      height,
      retryLimit: normalizeRetryLimit(merged.retryLimit),
      endpointLineCopy: merged.endpointLineCopy,
      generator: {
        type: String(merged.generator.type || "digger").toLowerCase(),
        roomWidth: normalizeIntRange(merged.generator.roomWidth, [4, 9], 2, width - 4),
        roomHeight: normalizeIntRange(merged.generator.roomHeight, [4, 7], 2, height - 4),
        corridorLength: normalizeIntRange(merged.generator.corridorLength, [2, 8], 1, Math.max(width, height)),
        dugPercentage: clampNumber(merged.generator.dugPercentage, 0.05, 0.8, 0.2),
        timeLimit: clampInt(merged.generator.timeLimit, 50, 10000, 1000),
        roomShape: {
          roundingChance: clampNumber(merged.generator.roomShape.roundingChance, 0, 1, 0.55),
          maxCornerRadius: clampInt(merged.generator.roomShape.maxCornerRadius, 0, 16, 3),
        },
        corridorShape: {
          enabled: merged.generator.corridorShape.enabled !== false,
          minWidth: clampNumber(merged.generator.corridorShape.minWidth, 1, 8, 1),
          maxWidth: clampNumber(merged.generator.corridorShape.maxWidth, Math.max(1, Math.min(8, Number(merged.generator.corridorShape.minWidth) || 1)), 8, 5),
          bulgeChance: clampNumber(merged.generator.corridorShape.bulgeChance, 0, 1, 0.65),
          roundingChance: clampNumber(merged.generator.corridorShape.roundingChance, 0, 1, 0.55),
        },
      },
      entranceApproach: {
        enabled: merged.entranceApproach.enabled !== false,
        startDirections: normalizeStartDirections(
          merged.entranceApproach.startDirections,
          merged.entranceApproach.allowedSides
        ),
        minLength: entranceMinLength,
        maxLength: entranceMaxLength,
        maxTurns: clampInt(merged.entranceApproach.maxTurns, 0, 2, 2),
        turnChance: clampNumber(merged.entranceApproach.turnChance, 0, 1, 0.45),
      },
      exitApproach: {
        enabled: merged.exitApproach.enabled !== false,
        endDirections: normalizeEndDirections(
          merged.exitApproach.endDirections,
          merged.exitApproach.allowedSides
        ),
        minLength: exitMinLength,
        maxLength: exitMaxLength,
        maxTurns: clampInt(merged.exitApproach.maxTurns, 0, 2, 2),
        turnChance: clampNumber(merged.exitApproach.turnChance, 0, 1, 0.45),
      },
      validation: {
        minRooms,
        maxRooms,
        minMainPathLength: scaleInteger(merged.validation.minMainPathLength, scaleFactor, 1, width * height, 30),
        minBranchRooms: scaleInteger(merged.validation.minBranchRooms, scaleFactor, 0, maxRooms, 2),
        minFloorRatio: clampNumber(merged.validation.minFloorRatio, 0.01, 0.95, 0.12),
        maxFloorRatio: clampNumber(merged.validation.maxFloorRatio, 0.01, 0.95, 0.36),
      },
      roomRoles: {
        // Legacy fixed counts are ignored; treasureLimits controls the bounds.
        treasureCount: [0, 0],
        treasureCornerBias: clampNumber(merged.roomRoles.treasureCornerBias, 0, 1, 0.85),
        restCount: normalizeIntRange(merged.roomRoles.restCount, [0, 0], 0, maxRooms),
        restPathRange: normalizeNumberRange(merged.roomRoles.restPathRange, [0.6, 0.85], 0, 1),
      },
      branchContents: {
        enabled: merged.branchContents.enabled !== false,
        minPathLength: clampInt(merged.branchContents.minPathLength, 1, width * height, 3),
        outcomes: branchOutcomes,
      },
      tiles: tileSettings,
      treasureLimits: chestLimits,
      treasureTable: normalizeTreasureTable(merged.treasureTable),
      enemyPool: normalizeTypePool(merged.enemyPool, "enemyId"),
      enemyLimits,
      trapPool: normalizeTypePool(merged.trapPool, "trapTypeId"),
      trapLimits,
      placements: {
        enemyCount: scaleIntRange(merged.placements.enemyCount, [4, 8], populationFactor, 0, width * height),
        trapCount: scaleIntRange(merged.placements.trapCount, [0, 3], populationFactor, 0, width * height),
        decorationCount: scaleIntRange(merged.placements.decorationCount, [0, 0], areaFactor, 0, width * height),
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

  function normalizeOptionalId(value) {
    const id = value == null ? "" : String(value).trim();
    return id || null;
  }

  function normalizeTreasureTable(value) {
    const source = value && typeof value === "object" ? value : {};
    const entries = (Array.isArray(source.entries) ? source.entries : []).map((entry) => {
      const id = normalizeOptionalId(entry && entry.id);
      if (!id) return null;
      const weight = weights.normalizeWeight(entry.weight);
      const minCount = clampInt(entry.minCount, 1, 999999, 1);
      const maxCount = clampInt(entry.maxCount, minCount, 999999, minCount);
      return {
        type: normalizeOptionalId(entry.type) || "item",
        id,
        name: String(entry.name || id),
        weight,
        minCount,
        maxCount,
      };
    }).filter(Boolean);
    return {
      rolls: normalizeIntRange(source.rolls, [1, 1], 0, 100),
      entries,
    };
  }

  function normalizeTypePool(value, legacyIdField) {
    return (Array.isArray(value) ? value : []).map((entry) => {
      const id = normalizeOptionalId(entry && (entry.id || entry[legacyIdField]));
      if (!id) return null;
      const weight = weights.normalizeWeight(entry.weight);
      return {
        id,
        name: String(entry.name || id),
        weight,
      };
    }).filter(Boolean);
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

  function normalizeBranchOutcomes(value) {
    const fallback = { empty: 0.31, trap: 0.31, treasure: 0.31, both: 0.07 };
    const source = value && typeof value === "object" ? value : fallback;
    const weights = {
      empty: Math.max(0, Number(source.empty) || 0),
      trap: Math.max(0, Number(source.trap) || 0),
      treasure: Math.max(0, Number(source.treasure) || 0),
      both: Math.max(0, Number(source.both) || 0),
    };
    const total = weights.empty + weights.trap + weights.treasure + weights.both;
    if (total <= 0) return fallback;
    return {
      empty: weights.empty / total,
      trap: weights.trap / total,
      treasure: weights.treasure / total,
      both: weights.both / total,
    };
  }

  function adjustBranchOutcomesForDanger(value, dangerFactor, danger) {
    const outcomes = normalizeBranchOutcomes(value);
    const adjusted = normalizeBranchOutcomes({
      empty: outcomes.empty,
      trap: outcomes.trap * dangerFactor,
      treasure: outcomes.treasure,
      both: outcomes.both * dangerFactor,
    });
    const [minimum, maximum] = DANGER_TREASURE_RATE_RANGE;
    const target = minimum + (maximum - minimum) * (danger - 1) / 9;
    const current = adjusted.treasure + adjusted.both;
    // Transfer within the same trap category to preserve trap odds and disabled outcomes.
    const transfers = (target >= current
      ? [["empty", "treasure"], ["trap", "both"]]
      : [["treasure", "empty"], ["both", "trap"]])
      .filter(([, destination]) => outcomes[destination] > 0);
    const available = transfers.reduce((sum, [source]) => sum + adjusted[source], 0);
    if (!available) return adjusted;
    const amount = Math.min(Math.abs(target - current), available);
    transfers.forEach(([source, destination]) => {
      const moved = Math.min(adjusted[source], amount * adjusted[source] / available);
      adjusted[source] -= moved;
      adjusted[destination] += moved;
    });
    return adjusted;
  }

  function normalizeStartDirections(value, legacySides) {
    const validDirections = new Set(["up", "right", "down", "left"]);
    let directions = Array.isArray(value) ? value : null;
    if (!directions && Array.isArray(legacySides)) {
      directions = legacySides.map(startDirectionForSide);
    }
    const normalized = (directions || ["down", "left", "up", "right"])
      .map((direction) => String(direction).toLowerCase())
      .filter((direction) => validDirections.has(direction));
    return normalized.length ? Array.from(new Set(normalized)) : ["down", "left", "up", "right"];
  }

  function normalizeEndDirections(value, legacySides) {
    const validDirections = new Set(["up", "right", "down", "left"]);
    let directions = Array.isArray(value) ? value : null;
    if (!directions && Array.isArray(legacySides)) {
      directions = legacySides.map(endDirectionForSide);
    }
    const normalized = (directions || ["up", "right", "down", "left"])
      .map((direction) => String(direction).toLowerCase())
      .filter((direction) => validDirections.has(direction));
    return normalized.length ? Array.from(new Set(normalized)) : ["up", "right", "down", "left"];
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

  function scaleIntRange(value, fallback, factor, min, max) {
    const normalized = normalizeIntRange(value, fallback, 0, max);
    const first = clampInt(Math.round(normalized[0] * factor), min, max, fallback[0]);
    const second = clampInt(Math.round(normalized[1] * factor), min, max, fallback[1]);
    return [Math.min(first, second), Math.max(first, second)];
  }

  function scaleInteger(value, factor, min, max, fallback) {
    const base = Number(value);
    const normalized = Number.isFinite(base) ? base : fallback;
    return clampInt(Math.round(normalized * factor), min, max, fallback);
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
