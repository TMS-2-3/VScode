(function initDungeonProfiles(root, factory) {
  "use strict";

  const savedData = typeof module === "object" && module.exports
    ? require("./dungeonSavedProfiles.js")
    : root && root.HEALER_DUNGEON_SAVED_PROFILES;
  const tiles = typeof module === "object" && module.exports ? require("./dungeonTiles.js") : root.HEALER_DUNGEON_TILES;
  const countLimits = typeof module === "object" && module.exports ? require("./dungeonTreasureLimits.js") : root.HEALER_DUNGEON_TREASURE_LIMITS;
  const weights = typeof module === "object" && module.exports ? require("./dungeonWeights.js") : root.HEALER_DUNGEON_WEIGHTS;
  const api = factory(savedData, tiles, countLimits, weights);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.HEALER_DUNGEON_PROFILES = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createDungeonProfiles(savedData, tiles, countLimits, weights) {
  "use strict";

  const standard = {
    schemaVersion: 1,
    id: "standard_digger",
    name: "Standard Digger",
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
      path: ["caveFloor01"],
      room: ["caveFloor01"],
      wall: ["caveWall01"],
      pathWall: ["caveWall01"],
      roomWall: ["caveWall01"],
      wallHeight: 1,
      margin: ["caveWall01"],
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
  };

  const format = "healer-dungeon-profiles";
  const scriptStart = '(function initSavedDungeonProfiles(root) {\n  "use strict";\n\n  const data = /* DUNGEON_PROFILES_DATA_START */\n';
  const scriptEnd = '\n/* DUNGEON_PROFILES_DATA_END */;\n\n  if (typeof module === "object" && module.exports) module.exports = data;\n  if (root) root.HEALER_DUNGEON_SAVED_PROFILES = data;\n})(typeof globalThis !== "undefined" ? globalThis : this);\n';
  let records = savedData ? parseDocument(savedData) : [];

  return Object.freeze({
    standard: deepFreeze(clone(standard)),
    fileName: "dungeonSavedProfiles.js",
    list() {
      return [{ id: standard.id, name: standard.name, builtIn: true },
        ...records.map(({ id, name }) => ({ id, name, builtIn: false }))];
    },
    get(id) {
      return getRecord(id).config;
    },
    getRecord,
    saved() {
      return clone(records);
    },
    replaceSaved(nextRecords) {
      records = validateRecords(nextRecords);
    },
    createRecord,
    parse(text) {
      return parseDocument(JSON.parse(text));
    },
    serialize(nextRecords = records) {
      return JSON.stringify({ format, version: 1, profiles: validateRecords(nextRecords) }, null, 2);
    },
    toScript(nextRecords = records) {
      return scriptStart + this.serialize(nextRecords) + scriptEnd;
    },
    fromScript(text) {
      const source = String(text).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
      if (!source.startsWith(scriptStart) || !source.endsWith(scriptEnd.trimEnd())) {
        throw new Error("ダンジョンプロファイル専用の保存ファイルを選択してください。");
      }
      return this.parse(source.slice(scriptStart.length, -scriptEnd.trimEnd().length));
    },
  });

  function getRecord(id) {
    if (id === standard.id || id === "standard") {
      return { id: standard.id, name: standard.name, config: clone(standard), preview: { seed: "preview", viewOptions: {} } };
    }
    const record = records.find((entry) => entry.id === id);
    if (!record) throw new Error(`プロファイルが見つかりません: ${id}`);
    return clone(record);
  }

  function createRecord(config, metadata = {}) {
    assertObject(config, "config");
    const id = String(metadata.id ?? config.id ?? "").trim();
    const name = String(metadata.name ?? config.name ?? "").trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(id)) {
      throw new Error("IDは英字で始まる80文字以内の半角英数字・ハイフン・アンダーバーにしてください。");
    }
    if (id === "standard" || id === standard.id) throw new Error("標準プロファイルのIDは使用できません。");
    if (!name || name.length > 120) throw new Error("名前は1～120文字で入力してください。");
    if (Object.hasOwn(config, "tuning")) throw new Error("生成結果ではなく、補正前の生成設定を保存してください。");
    const settings = copySettings(standard, { ...config, tiles: tiles.normalize(config.tiles === undefined ? standard.tiles : config.tiles) }, "config");
    settings.id = id;
    settings.name = name;
    if (settings.schemaVersion !== 1) throw new Error("非対応の設定バージョンです。");
    ["scale", "danger"].forEach((key) => {
      if (!Number.isInteger(settings[key]) || settings[key] < 1 || settings[key] > 10) {
        throw new Error(`${key}は1～10の整数にしてください。`);
      }
    });
    validateDirections(settings.entranceApproach.startDirections);
    validateDirections(settings.exitApproach.endDirections);
    validateContent(settings);
    const preview = metadata.preview || {};
    assertObject(preview, "preview");
    const viewOptions = {};
    ["path", "rooms", "placements", "details", "tiles", "grid"].forEach((key) => {
      if (typeof preview.viewOptions?.[key] === "boolean") viewOptions[key] = preview.viewOptions[key];
    });
    return { id, name, config: settings, preview: { seed: String(preview.seed ?? "preview").slice(0, 80), viewOptions } };
  }

  function parseDocument(document) {
    assertObject(document, "document");
    if (document.format !== format || document.version !== 1) throw new Error("非対応のプロファイル形式です。");
    return validateRecords(document.profiles);
  }

  function validateRecords(value) {
    if (!Array.isArray(value)) throw new Error("プロファイル一覧が不正です。");
    const ids = new Set();
    return value.map((entry) => {
      assertObject(entry, "profile");
      const record = createRecord(entry.config, entry);
      if (ids.has(record.id)) throw new Error(`IDが重複しています: ${record.id}`);
      ids.add(record.id);
      return record;
    });
  }

  // Store the unscaled input, never result.config: normalization applies scale/danger again.
  function copySettings(template, value, path) {
    if (value === undefined) return clone(template);
    if (path === "config.treasureLimits") return countLimits.normalize(value);
    if (path === "config.enemyLimits") return countLimits.normalize(value, "魔物");
    if (path === "config.trapLimits") return countLimits.normalize(value, "罠");
    if ((path === "config.tiles.floorTileId" || path === "config.tiles.wallTileId") && value === null) return null;
    if (template === null) {
      if (value !== null && (!Number.isInteger(value) || value < 1)) throw new Error(`${path}が不正です。`);
      return value;
    }
    if (Array.isArray(template)) {
      if (!Array.isArray(value)) throw new Error(`${path}は配列にしてください。`);
      if (template.length === 2 && typeof template[0] === "number") {
        if (value.length !== 2 || !value.every(Number.isFinite) || value[0] > value[1]) throw new Error(`${path}の範囲が不正です。`);
      } else if (template.length) {
        if (!value.every((item) => typeof item === typeof template[0])) throw new Error(`${path}の値が不正です。`);
      }
      return clone(value);
    }
    if (typeof template === "object") {
      assertObject(value, path);
      Object.keys(value).forEach((key) => {
        if (!Object.hasOwn(template, key)) throw new Error(`未対応の設定項目です: ${path}.${key}`);
      });
      const result = {};
      Object.keys(template).forEach((key) => { result[key] = copySettings(template[key], value[key], `${path}.${key}`); });
      return result;
    }
    if (typeof value !== typeof template || (typeof value === "number" && !Number.isFinite(value))) {
      throw new Error(`${path}の値が不正です。`);
    }
    return value;
  }

  function validateDirections(value) {
    if (!value.length || value.some((direction) => !["up", "right", "down", "left"].includes(direction))) {
      throw new Error("入口・出口の方向が不正です。");
    }
  }

  function validateContent(config) {
    [config.width, config.height].forEach((value) => {
      if (!Number.isInteger(value) || value < 20 || value > 500) throw new Error("マップの幅・高さが不正です。");
    });
    if (config.generator.type !== "digger") throw new Error("未対応の生成方式です。");
    [["enemyPool", config.enemyPool, "魔物"], ["trapPool", config.trapPool, "罠"]].forEach(([key, pool, label]) => {
      pool.forEach((entry) => {
        assertObject(entry, key);
        if (typeof entry.id !== "string" || !entry.id.trim()) throw new Error(`${label}のIDが不正です。`);
        entry.weight = weights.normalizeWeight(entry.weight);
      });
    });
    config.treasureTable.entries.forEach((entry) => {
      assertObject(entry, "treasureTable.entries");
      if (typeof entry.id !== "string" || !entry.id.trim()
        || !Number.isInteger(entry.minCount) || entry.minCount < 1 || !Number.isInteger(entry.maxCount) || entry.maxCount < entry.minCount) {
        throw new Error("宝箱のID・抽選比率・個数が不正です。");
      }
      entry.weight = weights.normalizeWeight(entry.weight);
    });
    config.mandatoryEvents.forEach((entry) => assertObject(entry, "mandatoryEvents"));
  }

  function assertObject(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}が不正です。`);
  }

  function clone(value) {
    if (Array.isArray(value)) {
      return value.map(clone);
    }
    if (value && typeof value === "object") {
      const result = {};
      Object.keys(value).forEach((key) => {
        if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("使用できない設定キーが含まれています。");
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
