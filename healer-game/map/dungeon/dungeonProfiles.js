(function initDungeonProfiles(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.HEALER_DUNGEON_PROFILES = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonProfiles() {
  "use strict";

  const standard = {
    schemaVersion: 1,
    id: "standard_digger",
    name: "Standard Digger",
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
  };

  return Object.freeze({
    standard: deepFreeze(clone(standard)),
  });

  function clone(value) {
    if (Array.isArray(value)) {
      return value.map(clone);
    }
    if (value && typeof value === "object") {
      const result = {};
      Object.keys(value).forEach((key) => {
        result[key] = clone(value[key]);
      });
      return result;
    }
    return value;
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) {
      return value;
    }
    Object.keys(value).forEach((key) => deepFreeze(value[key]));
    return Object.freeze(value);
  }
});
