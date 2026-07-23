(() => {
  "use strict";

  window.createHealerSaveSystem = function createHealerSaveSystem(context) {
    const {
      state,
      game,
      town,
      player,
      party,
      playerProfile,
      updateProfileNameInput,
    } = context;

    const INDEX_KEY = "healer-game.save.index.v1";
    const DATA_KEY_PREFIX = "healer-game.save.data.v1.";
    const FILE_SAVE_TYPE = "healer-game.save-file.v1";
    const SAVE_VERSION = 1;
    const SAVE_NAME_MAX_LENGTH = 24;
    let storageAvailable = null;

    function canUseStorage() {
      if (storageAvailable !== null) {
        return storageAvailable;
      }
      try {
        const key = "healer-game.save.storage-test";
        window.localStorage.setItem(key, "1");
        window.localStorage.removeItem(key);
        storageAvailable = true;
        return storageAvailable;
      } catch (error) {
        storageAvailable = false;
        return storageAvailable;
      }
    }

    function readIndex() {
      if (!canUseStorage()) {
        return [];
      }
      try {
        const parsed = JSON.parse(window.localStorage.getItem(INDEX_KEY) || "[]");
        return Array.isArray(parsed) ? parsed.filter((entry) => entry && entry.id) : [];
      } catch (error) {
        return [];
      }
    }

    function writeIndex(index) {
      window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    }

    function getDataKey(saveId) {
      return `${DATA_KEY_PREFIX}${saveId}`;
    }

    function clonePlain(value, fallback) {
      if (value === undefined || value === null) {
        return fallback;
      }
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (error) {
        return fallback;
      }
    }

    const initialTownMapId = typeof town.mapId === "string" && town.mapId ? town.mapId : null;
    const initialTownPlayer = clonePlain(town.player, {});
    const initialPlayer = clonePlain(player, null);

    function normalizeSaveName(name) {
      const text = String(name || "").trim();
      return text.slice(0, SAVE_NAME_MAX_LENGTH);
    }

    function makeSaveId() {
      return `save_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    function formatTimestamp(timestamp) {
      const date = new Date(timestamp || Date.now());
      const pad = (value) => String(value).padStart(2, "0");
      return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function makeSafeFileName(name) {
      const base = normalizeSaveName(name) || "healer-save";
      const safe = base.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_");
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "_");
      return `${safe}_${stamp}.json`;
    }

    function getLivePartyMembers() {
      const members = [];
      const seen = new Set();
      for (const unit of [player, ...(Array.isArray(party) ? party : [])]) {
        if (!unit || !unit.id || seen.has(unit.id)) {
          continue;
        }
        seen.add(unit.id);
        members.push(unit);
      }
      return members;
    }

    function syncLivePartySnapshot() {
      if (!game.partyHpById || typeof game.partyHpById !== "object") {
        game.partyHpById = {};
      }
      if (!game.partyMpById || typeof game.partyMpById !== "object") {
        game.partyMpById = {};
      }
      if (!game.partyDeadById || typeof game.partyDeadById !== "object") {
        game.partyDeadById = {};
      }
      if (!game.partyEquipmentById || typeof game.partyEquipmentById !== "object") {
        game.partyEquipmentById = {};
      }
      if (!game.partyLoadoutById || typeof game.partyLoadoutById !== "object") {
        game.partyLoadoutById = {};
      }
      for (const unit of getLivePartyMembers()) {
        if (Number.isFinite(unit.hp)) {
          game.partyHpById[unit.id] = Math.max(0, unit.hp);
        }
        if (Number.isFinite(unit.mp)) {
          game.partyMpById[unit.id] = Math.max(0, unit.mp);
        }
        if (unit.dead) {
          game.partyDeadById[unit.id] = true;
        } else {
          delete game.partyDeadById[unit.id];
        }
        if (unit.equipment && typeof unit.equipment === "object") {
          game.partyEquipmentById[unit.id] = clonePlain(unit.equipment, {});
        }
        if (unit.loadout && typeof unit.loadout === "object") {
          game.partyLoadoutById[unit.id] = clonePlain(unit.loadout, {});
        }
      }
    }

    function buildSnapshot(saveName) {
      syncLivePartySnapshot();
      const now = Date.now();
      return {
        version: SAVE_VERSION,
        name: saveName,
        savedAt: now,
        game: {
          gold: Number.isFinite(game.gold) ? Math.max(0, Math.floor(game.gold)) : 0,
          innRestUsedUntilBattle: game.innRestUsedUntilBattle === true,
          materialsById: clonePlain(game.materialsById, {}),
          partyHpById: clonePlain(game.partyHpById, {}),
          partyMpById: clonePlain(game.partyMpById, {}),
          partyDeadById: clonePlain(game.partyDeadById, {}),
          partyStatusById: clonePlain(game.partyStatusById, {}),
          partyEquipmentById: clonePlain(game.partyEquipmentById, {}),
          partyLoadoutById: clonePlain(game.partyLoadoutById, {}),
          partyItemById: clonePlain(game.partyItemById, {}),
          itemInventoryById: clonePlain(game.itemInventoryById, {}),
          skillProgressById: clonePlain(game.skillProgressById, {}),
          equipmentInventoryById: clonePlain(game.equipmentInventoryById, {}),
          equipmentInstancesById: clonePlain(game.equipmentInstancesById, {}),
          nextEquipmentInstanceSeq: Number.isFinite(game.nextEquipmentInstanceSeq) ? game.nextEquipmentInstanceSeq : 1,
          equipmentUpgradeById: clonePlain(game.equipmentUpgradeById, {}),
          equipmentRandomStatsById: clonePlain(game.equipmentRandomStatsById, {}),
          equipmentRandomSeedsById: clonePlain(game.equipmentRandomSeedsById, {}),
          equipmentUpgradeRollsById: clonePlain(game.equipmentUpgradeRollsById, {}),
          equipmentInventoryMigratedToInstances: game.equipmentInventoryMigratedToInstances === true,
          equipmentPresetsById: clonePlain(game.equipmentPresetsById, {}),
          settings: clonePlain(game.settings, {}),
        },
        town: {
          introDone: town.introDone === true,
          meetingDone: town.meetingDone === true,
          player: clonePlain(town.player, {}),
        },
        playerProfile: clonePlain(playerProfile, {}),
      };
    }

    function listSaves() {
      const index = readIndex();
      return index
        .map((entry) => ({
          id: entry.id,
          name: entry.name || "セーブデータ",
          savedAt: Number.isFinite(entry.savedAt) ? entry.savedAt : 0,
          savedAtText: formatTimestamp(entry.savedAt),
        }))
        .sort((a, b) => b.savedAt - a.savedAt);
    }

    function saveToStorage(saveId, saveName) {
      if (!canUseStorage()) {
        return { ok: false, message: "ブラウザ保存領域を利用できません。" };
      }
      const name = normalizeSaveName(saveName);
      if (!name) {
        return { ok: false, message: "セーブデータ名を入力してください。" };
      }
      const id = saveId || makeSaveId();
      const snapshot = buildSnapshot(name);
      snapshot.id = id;
      try {
        window.localStorage.setItem(getDataKey(id), JSON.stringify(snapshot));
        const index = readIndex().filter((entry) => entry.id !== id);
        index.unshift({
          id,
          name,
          savedAt: snapshot.savedAt,
        });
        writeIndex(index);
        game.currentSaveId = id;
        return { ok: true, id, name, savedAt: snapshot.savedAt, message: `${name} にセーブしました。` };
      } catch (error) {
        return { ok: false, message: "セーブに失敗しました。保存容量を確認してください。" };
      }
    }

    function createSave(name) {
      return saveToStorage(null, name);
    }

    function overwriteSave(saveId) {
      const entry = listSaves().find((item) => item.id === saveId);
      if (!entry) {
        return { ok: false, message: "上書き先のセーブデータが見つかりません。" };
      }
      return saveToStorage(saveId, entry.name);
    }

    function deleteSave(saveId) {
      if (!canUseStorage() || !saveId) {
        return { ok: false, message: "削除するセーブデータが見つかりません。" };
      }
      const entry = listSaves().find((item) => item.id === saveId);
      if (!entry) {
        return { ok: false, message: "削除するセーブデータが見つかりません。" };
      }
      try {
        window.localStorage.removeItem(getDataKey(saveId));
        writeIndex(readIndex().filter((item) => item.id !== saveId));
        if (game.currentSaveId === saveId) {
          game.currentSaveId = null;
        }
        return { ok: true, message: `${entry.name || "セーブデータ"} を削除しました。` };
      } catch (error) {
        return { ok: false, message: "セーブデータの削除に失敗しました。" };
      }
    }

    function readSave(saveId) {
      if (!canUseStorage() || !saveId) {
        return null;
      }
      try {
        return JSON.parse(window.localStorage.getItem(getDataKey(saveId)) || "null");
      } catch (error) {
        return null;
      }
    }

    function wrapFileSnapshot(snapshot) {
      return {
        fileType: FILE_SAVE_TYPE,
        exportedAt: Date.now(),
        snapshot,
      };
    }

    function serializeFileSnapshot(snapshot) {
      return JSON.stringify(wrapFileSnapshot(snapshot), null, 2);
    }

    function createFileSave(name) {
      const saveName = normalizeSaveName(name);
      if (!saveName) {
        return { ok: false, message: "セーブデータ名を入力してください。" };
      }
      const snapshot = buildSnapshot(saveName);
      snapshot.id = makeSaveId();
      const fileName = makeSafeFileName(snapshot.name || saveName);
      return {
        ok: true,
        id: snapshot.id,
        name: snapshot.name || saveName,
        fileName,
        text: serializeFileSnapshot(snapshot),
        message: `${snapshot.name || saveName} をファイルに書き出します。`,
      };
    }

    function normalizeImportedSnapshot(value) {
      const snapshot = value && value.fileType === FILE_SAVE_TYPE ? value.snapshot : value;
      if (!snapshot || typeof snapshot !== "object" || snapshot.version !== SAVE_VERSION) {
        return null;
      }
      if (!snapshot.game || !snapshot.town || !snapshot.playerProfile) {
        return null;
      }
      const copy = clonePlain(snapshot, null);
      if (!copy) {
        return null;
      }
      copy.id = copy.id || makeSaveId();
      copy.name = normalizeSaveName(copy.name) || "ファイルセーブ";
      copy.savedAt = Number.isFinite(copy.savedAt) ? copy.savedAt : Date.now();
      return copy;
    }

    function storeImportedSnapshot(snapshot) {
      if (!canUseStorage()) {
        return { ok: false, message: "ブラウザ保存領域を利用できません。" };
      }
      try {
        window.localStorage.setItem(getDataKey(snapshot.id), JSON.stringify(snapshot));
        const index = readIndex().filter((entry) => entry.id !== snapshot.id);
        index.unshift({
          id: snapshot.id,
          name: snapshot.name,
          savedAt: snapshot.savedAt,
        });
        writeIndex(index);
        return { ok: true };
      } catch (error) {
        return { ok: false, message: "セーブファイルの登録に失敗しました。保存容量を確認してください。" };
      }
    }

    function assignObject(target, source) {
      if (!target || typeof target !== "object") {
        return;
      }
      for (const key of Object.keys(target)) {
        delete target[key];
      }
      if (!source || typeof source !== "object") {
        return;
      }
      Object.assign(target, clonePlain(source, {}));
    }

    function resetForNewGame() {
      const preservedSettings = clonePlain(game.settings, {});
      game.state = "title";
      game.time = 0;
      game.message = "はじまりの町";
      game.messageTimer = 5;
      game.titleTargets = [];
      game.titleLoadOpen = false;
      game.titleLoadMessage = "";
      game.titleLoadScroll = 0;
      game.titleLoadScrollMax = 0;
      game.hover = null;
      game.priorityTarget = null;
      game.priorityTargetTimer = 0;
      game.priorityTargetIgnoredUnitIds = {};
      game.avoidTarget = null;
      game.avoidTargetTimer = 0;
      game.skillPage = "page1";
      game.itemSlots = null;
      game.gold = 0;
      game.innRestUsedUntilBattle = false;
      game.battleRewards = null;
      game.currentQuest = null;
      game.stageClearTimer = 0;
      game.reinforcementsSpawned = false;
      game.currentSaveId = null;
      game.defeatUi = null;
      assignObject(game.materialsById, {});
      assignObject(game.partyHpById, {});
      assignObject(game.partyMpById, {});
      assignObject(game.partyDeadById, {});
      assignObject(game.partyStatusById, {});
      assignObject(game.partyEquipmentById, {});
      assignObject(game.partyLoadoutById, {});
      assignObject(game.partyItemById, {});
      assignObject(game.itemInventoryById, {});
      assignObject(game.skillProgressById, {});
      assignObject(game.equipmentInventoryById, {});
      assignObject(game.equipmentInstancesById, {});
      game.nextEquipmentInstanceSeq = 1;
      assignObject(game.equipmentUpgradeById, {});
      assignObject(game.equipmentRandomStatsById, {});
      assignObject(game.equipmentRandomSeedsById, {});
      assignObject(game.equipmentUpgradeRollsById, {});
      game.equipmentInventoryMigratedToInstances = false;
      assignObject(game.equipmentPresetsById, {});
      game.saveUi = { message: "" };
      game.settings = preservedSettings;
      game.systemMenu = {
        open: false,
        panel: null,
        confirm: null,
        targets: [],
        panelScroll: 0,
        panelScrollMax: 0,
        settings: {
          tab: "game",
          controlsDraft: null,
          controlsCapture: null,
          controlsScroll: 0,
          controlsScrollMax: 0,
          gameScroll: 0,
          gameScrollMax: 0,
          message: "",
        },
      };

      town.mapId = initialTownMapId;
      town.player = clonePlain(initialTownPlayer, {});
      town.camera = { x: 0, y: 0 };
      town.buildings = [];
      town.props = [];
      town.followers = [];
      town.trail = [];
      town.interaction = null;
      town.mapNamePopup = null;
      town.symbolEncounters = null;
      town.panel = null;
      town.selectedQuest = null;
      town.story = null;
      town.introDone = false;
      town.meetingDone = false;

      playerProfile.gender = "";
      playerProfile.firstName = "アルジュナ";
      playerProfile.lastName = "フィナルド";
      playerProfile.pronoun = "";
      playerProfile.done = false;
      playerProfile.step = "gender";
      if (player) {
        if (initialPlayer && typeof initialPlayer === "object") {
          for (const key of Object.keys(player)) {
            delete player[key];
          }
          Object.assign(player, clonePlain(initialPlayer, {}));
        } else {
          player.name = "アルジュナ・フィナルド";
          player.aim = null;
          player.itemAim = null;
        }
      }
      clearTransientArrays();
      if (typeof updateProfileNameInput === "function") {
        updateProfileNameInput();
      }
      return { ok: true };
    }

    function restoreGameStores(snapshotGame) {
      const saved = snapshotGame && typeof snapshotGame === "object" ? snapshotGame : {};
      game.gold = Number.isFinite(saved.gold) ? Math.max(0, Math.floor(saved.gold)) : 0;
      game.innRestUsedUntilBattle = saved.innRestUsedUntilBattle === true;
      game.battleRewards = null;
      game.currentQuest = null;
      game.stageClearTimer = 0;
      game.reinforcementsSpawned = false;
      game.defeatUi = null;
      game.priorityTarget = null;
      game.priorityTargetTimer = 0;
      game.priorityTargetIgnoredUnitIds = {};
      game.avoidTarget = null;
      game.avoidTargetTimer = 0;
      game.skillPage = "page1";
      game.message = "ロードしました。";
      game.messageTimer = 4;
      assignObject(game.materialsById, saved.materialsById);
      assignObject(game.partyHpById, saved.partyHpById);
      assignObject(game.partyMpById, saved.partyMpById);
      assignObject(game.partyDeadById, saved.partyDeadById);
      assignObject(game.partyStatusById, saved.partyStatusById);
      assignObject(game.partyEquipmentById, saved.partyEquipmentById);
      assignObject(game.partyLoadoutById, saved.partyLoadoutById);
      assignObject(game.partyItemById, saved.partyItemById);
      assignObject(game.itemInventoryById, saved.itemInventoryById);
      assignObject(game.skillProgressById, saved.skillProgressById);
      assignObject(game.equipmentInventoryById, saved.equipmentInventoryById);
      assignObject(game.equipmentInstancesById, saved.equipmentInstancesById);
      game.nextEquipmentInstanceSeq = Number.isFinite(saved.nextEquipmentInstanceSeq) ? Math.max(1, Math.floor(saved.nextEquipmentInstanceSeq)) : 1;
      assignObject(game.equipmentUpgradeById, saved.equipmentUpgradeById);
      assignObject(game.equipmentRandomStatsById, saved.equipmentRandomStatsById);
      assignObject(game.equipmentRandomSeedsById, saved.equipmentRandomSeedsById);
      assignObject(game.equipmentUpgradeRollsById, saved.equipmentUpgradeRollsById);
      game.equipmentInventoryMigratedToInstances = saved.equipmentInventoryMigratedToInstances === true;
      assignObject(game.equipmentPresetsById, saved.equipmentPresetsById);
      assignObject(game.settings, saved.settings);
    }

    function restoreTown(snapshotTown) {
      const saved = snapshotTown && typeof snapshotTown === "object" ? snapshotTown : {};
      town.introDone = saved.introDone === true;
      town.meetingDone = saved.meetingDone === true;
      town.story = null;
      town.panel = null;
      town.selectedQuest = null;
      town.interaction = null;
      town.symbolEncounters = null;
      if (saved.player && typeof saved.player === "object") {
        Object.assign(town.player, clonePlain(saved.player, {}));
      }
    }

    function restoreProfile(snapshotProfile) {
      const saved = snapshotProfile && typeof snapshotProfile === "object" ? snapshotProfile : {};
      playerProfile.gender = saved.gender || "";
      playerProfile.firstName = saved.firstName || "アルジュナ";
      playerProfile.lastName = saved.lastName || "フィナルド";
      playerProfile.pronoun = saved.pronoun || "私";
      playerProfile.done = saved.done === true;
      playerProfile.step = saved.step || (playerProfile.done ? "pronoun" : "gender");
      if (player) {
        player.name = `${playerProfile.firstName}・${playerProfile.lastName}`;
      }
      if (typeof updateProfileNameInput === "function") {
        updateProfileNameInput();
      }
    }

    function applySnapshot(snapshot, saveId) {
      restoreProfile(snapshot.playerProfile);
      restoreGameStores(snapshot.game);
      restoreTown(snapshot.town);
      clearTransientArrays();
      game.systemMenu.open = false;
      game.systemMenu.panel = null;
      game.systemMenu.confirm = null;
      game.currentSaveId = saveId;
      game.defeatUi = null;
      game.titleLoadOpen = false;
      game.titleLoadMessage = "";
      return { ok: true, name: snapshot.name || "セーブデータ", message: `${snapshot.name || "セーブデータ"} をロードしました。` };
    }

    function loadSave(saveId) {
      const snapshot = readSave(saveId);
      if (!snapshot || snapshot.version !== SAVE_VERSION) {
        return { ok: false, message: "セーブデータを読み込めませんでした。" };
      }
      return applySnapshot(snapshot, saveId);
    }

    function importFileText(text) {
      let parsed = null;
      try {
        parsed = JSON.parse(String(text || ""));
      } catch (error) {
        return { ok: false, message: "セーブファイルを読み込めませんでした。" };
      }
      const snapshot = normalizeImportedSnapshot(parsed);
      if (!snapshot) {
        return { ok: false, message: "このセーブファイルは利用できません。" };
      }
      const stored = storeImportedSnapshot(snapshot);
      const result = applySnapshot(snapshot, stored.ok ? snapshot.id : null);
      if (!result.ok) {
        return result;
      }
      return {
        ...result,
        id: stored.ok ? snapshot.id : null,
        message: stored.ok
          ? `${snapshot.name} をファイルから読み込みました。`
          : `${snapshot.name} をファイルから読み込みました。ブラウザ保存には登録できませんでした。`,
      };
    }

    function clearTransientArrays() {
      const keys = ["party", "enemies", "projectiles", "telegraphs", "areas", "effects"];
      for (const key of keys) {
        if (Array.isArray(state[key])) {
          state[key].length = 0;
        }
      }
      if (state.expandedStatusUnitIds && typeof state.expandedStatusUnitIds.clear === "function") {
        state.expandedStatusUnitIds.clear();
      }
    }

    return {
      createSave,
      overwriteSave,
      deleteSave,
      loadSave,
      createFileSave,
      importFileText,
      listSaves,
      normalizeSaveName,
      formatTimestamp,
      resetForNewGame,
    };
  };
})();
