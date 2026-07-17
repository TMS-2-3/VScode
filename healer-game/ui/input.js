(() => {
  "use strict";

  window.createHealerInputSystem = function createHealerInputSystem(context) {
    const {
      canvas,
      input,
      game,
      town,
      party,
      enemies,
      projectiles,
      telegraphs,
      areas,
      effects,
      expandedStatusUnitIds,
      player,
      playerProfile,
      CHARACTER_DEFS,
      SKILL_DATA,
      PASSIVE_DATA,
      EQUIPMENT_DATA,
      LOADOUT_CONFIG,
      resize,
      startGameLoop,
      startTown,
      saveSystem,
      getGold,
      formatGold,
      canAffordGold,
      spendGold,
      handleProfileSetupKey,
      handleProfileSetupClick,
      interactTown,
      switchTownMap,
      closeTownPanel,
      PLAYER_SKILL_SLOT_KEYS,
      ITEM_SLOT_KEYS,
      KEYBINDS,
      getKeybinds,
      getKeybindLabel,
      getPanelSkills,
      startPlayerAim,
      usePlayerCommand,
      cancelPlayerAim,
      confirmPlayerAim,
      isPlayerControlLocked,
      triggerUltimate,
      useItemSlot,
      cancelItemAim,
      confirmItemAim,
      useInventoryItem,
      usePowerCrystalDFromBattleReward,
      getCharacterItem,
      setCharacterItem,
      clearCharacterItem,
      getItemInventoryCount,
      getItemCandidates,
      getPlayerFirstName,
      handleStatusUiClick,
      hasCommandBiasDrag,
      clearCommandBiasDrag,
      updateCommandBiasDrag,
      normalizeEquipment,
      equipItem,
      unequipSlot,
      canEquipItem,
      resolveEquipmentItem,
      getEquipmentItemRef,
      getEquipmentBaseItemId,
      getEquipmentOwnedCount: getEquipmentOwnedCountFromSystem,
      getDefaultLoadout,
      normalizeLoadout,
      setUnitLoadout,
      getActiveSlotLimit,
      isSkillOwned,
      isPassiveOwned,
    } = context;

    function attach() {
      window.addEventListener("resize", resize);
      resize();
      startGameLoop();
      canvas.tabIndex = 0;

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("copy", handleClipboardCopy);
      window.addEventListener("cut", handleClipboardCut);
      window.addEventListener("paste", handleClipboardPaste);
      window.addEventListener("compositionend", handleCompositionEnd);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mouseup", handleMouseUp);
      canvas.addEventListener("wheel", handleWheel, { passive: false });
      canvas.addEventListener("mouseleave", handleMouseLeave);
      canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
      });
      canvas.addEventListener("auxclick", (event) => {
        event.preventDefault();
      });
    }

    const playerSkillSlotKeys = Array.isArray(PLAYER_SKILL_SLOT_KEYS) && PLAYER_SKILL_SLOT_KEYS.length
      ? PLAYER_SKILL_SLOT_KEYS.map((key) => String(key).toLowerCase())
      : ["q", "w", "e", "r", "t"];
    const itemSlotKeys = Array.isArray(ITEM_SLOT_KEYS) && ITEM_SLOT_KEYS.length
      ? ITEM_SLOT_KEYS.map((key) => String(key).toLowerCase())
      : ["c", "v", "b", "n"];
    const keybindTools = KEYBINDS || window.HEALER_KEYBINDS || null;
    const movementKeys = ["w", "a", "s", "d"];
    const movementActions = [
      { id: "common.moveUp", logicalKey: "w" },
      { id: "common.moveDown", logicalKey: "s" },
      { id: "common.moveLeft", logicalKey: "a" },
      { id: "common.moveRight", logicalKey: "d" },
    ];
    const playerSkillActionIds = ["battle.skill1", "battle.skill2", "battle.skill3", "battle.skill4", "battle.skill5"];
    const itemActionIds = itemSlotKeys.map((_, index) => `battle.item${index + 1}`);
    const ultimateActionByUnitId = {
      ulpes: "battle.ultimate.ulpes",
      rihas: "battle.ultimate.rihas",
      sushia: "battle.ultimate.sushia",
      finald: "battle.ultimate.finald",
    };
    const equipmentUnitOrder = ["finald", "ulpes", "rihas", "sushia"];
    const presetNameMaxLength = 16;
    const DEFEAT_INN_RESTART_COST = 100;
    const DEFEAT_TOWN_RESTART_HP_RATIO = 0.1;
    let presetTextInput = null;
    let syncingPresetTextInput = false;

    function getSystemMenu() {
      if (!game.systemMenu || typeof game.systemMenu !== "object") {
        game.systemMenu = { open: false, panel: null, confirm: null, targets: [] };
      }
      if (!Array.isArray(game.systemMenu.targets)) {
        game.systemMenu.targets = [];
      }
      if (!Number.isFinite(game.systemMenu.panelScroll)) {
        game.systemMenu.panelScroll = 0;
      }
      if (!Number.isFinite(game.systemMenu.panelScrollMax)) {
        game.systemMenu.panelScrollMax = 0;
      }
      if (!game.systemMenu.equipment || typeof game.systemMenu.equipment !== "object") {
        game.systemMenu.equipment = {};
      }
      if (!game.systemMenu.settings || typeof game.systemMenu.settings !== "object") {
        game.systemMenu.settings = {};
      }
      if (!game.saveUi || typeof game.saveUi !== "object") {
        game.saveUi = {};
      }
      if (typeof game.saveUi.message !== "string") {
        game.saveUi.message = "";
      }
      const equipment = game.systemMenu.equipment;
      if (!equipmentUnitOrder.includes(equipment.selectedUnitId)) {
        equipment.selectedUnitId = "finald";
      }
      if (typeof equipment.presetName !== "string") {
        equipment.presetName = "プリセット1";
      }
      if (equipment.picker && !Number.isFinite(equipment.picker.scroll)) {
        equipment.picker.scroll = 0;
      }
      if (equipment.picker && !Number.isFinite(equipment.picker.scrollMax)) {
        equipment.picker.scrollMax = 0;
      }
      const settings = game.systemMenu.settings;
      if (settings.tab !== "controls") {
        settings.tab = "game";
      }
      if (!Number.isFinite(settings.controlsScroll)) {
        settings.controlsScroll = 0;
      }
      if (!Number.isFinite(settings.controlsScrollMax)) {
        settings.controlsScrollMax = 0;
      }
      if (!Number.isFinite(settings.gameScroll)) {
        settings.gameScroll = 0;
      }
      if (!Number.isFinite(settings.gameScrollMax)) {
        settings.gameScrollMax = 0;
      }
      return game.systemMenu;
    }

    function getGameSettings() {
      if (!game.settings || typeof game.settings !== "object") {
        game.settings = {};
      }
      if (game.settings.tooltipDescriptionMode !== "detail") {
        game.settings.tooltipDescriptionMode = "simple";
      }
      if (typeof game.settings.powerCrystalAutoUse !== "boolean") {
        game.settings.powerCrystalAutoUse = true;
      }
      if (typeof game.settings.mapDebugMode !== "boolean") {
        game.settings.mapDebugMode = false;
      }
      if (keybindTools) {
        game.settings.keybinds = keybindTools.normalizeKeybinds(
          game.settings.keybinds || keybindTools.loadSavedKeybinds()
        );
      }
      return game.settings;
    }

    function getDebugTileMapEntries() {
      const maps = window.HEALER_TILE_MAPS || {};
      const registry = Array.isArray(window.HEALER_DEBUG_TILE_MAPS)
        ? window.HEALER_DEBUG_TILE_MAPS
        : [
          { id: "startTown01", label: "始まりの町" },
          { id: "forestTest01", label: "森テスト1" },
          { id: "forest2", label: "森テスト2" },
          { id: "flower", label: "花マップ" },
        ];
      return registry.filter((entry) => entry && entry.id && maps[entry.id]);
    }

    function switchDebugTownMap(mapId) {
      const entry = getDebugTileMapEntries().find((candidate) => candidate.id === mapId);
      if (!entry) {
        game.message = "マップを読み込めませんでした。";
        game.messageTimer = 3;
        return;
      }
      const ok = typeof switchTownMap === "function" ? switchTownMap(entry.id) : false;
      game.message = ok ? `${entry.label || entry.id} に切り替えました。` : "マップを切り替えられませんでした。";
      game.messageTimer = 3;
      clearMovementKeys();
    }

    function getActiveKeybinds() {
      if (typeof getKeybinds === "function") {
        return getKeybinds();
      }
      return keybindTools ? keybindTools.getSettingsKeybinds(getGameSettings()) : {};
    }

    function getSettingsUi() {
      const menu = getSystemMenu();
      const settings = menu.settings;
      if (settings.tab !== "controls") {
        settings.tab = "game";
      }
      if (!settings.controlsDraft && keybindTools) {
        settings.controlsDraft = keybindTools.cloneKeybinds(getActiveKeybinds());
      }
      return settings;
    }

    function getControlsDraft() {
      const ui = getSettingsUi();
      if (!keybindTools) {
        return {};
      }
      ui.controlsDraft = keybindTools.cloneKeybinds(ui.controlsDraft || getActiveKeybinds());
      return ui.controlsDraft;
    }

    function setSettingsMessage(text) {
      const ui = getSettingsUi();
      ui.message = text || "";
    }

    function openSettingsPanelFromTarget(target) {
      const menu = getSystemMenu();
      const ui = getSettingsUi();
      menu.open = false;
      menu.confirm = null;
      menu.panel = { type: "settings", title: target.title || "設定", lines: target.lines || [] };
      menu.panelScroll = 0;
      menu.panelScrollMax = 0;
      ui.tab = "game";
      ui.controlsDraft = keybindTools ? keybindTools.cloneKeybinds(getActiveKeybinds()) : {};
      ui.controlsCapture = null;
      ui.message = "";
      clearMovementKeys();
    }

    function openSavePanelFromTarget(target) {
      const menu = getSystemMenu();
      menu.open = false;
      menu.confirm = null;
      menu.panel = { type: "save", title: target.title || "セーブ" };
      menu.panelScroll = 0;
      menu.panelScrollMax = 0;
      getSystemMenu();
      game.saveUi.message = "";
      clearMovementKeys();
    }

    function promptForSaveName() {
      const fallback = `セーブデータ${saveSystem && saveSystem.listSaves ? saveSystem.listSaves().length + 1 : 1}`;
      const inputName = window.prompt("セーブデータ名を入力してください。", fallback);
      if (inputName === null) {
        return "";
      }
      return saveSystem && saveSystem.normalizeSaveName
        ? saveSystem.normalizeSaveName(inputName)
        : String(inputName || "").trim().slice(0, 24);
    }

    function createNewSave() {
      if (!saveSystem || typeof saveSystem.createSave !== "function") {
        game.saveUi.message = "セーブ機能を利用できません。";
        return;
      }
      const name = promptForSaveName();
      if (!name) {
        game.saveUi.message = "セーブデータ名を入力してください。";
        return;
      }
      const result = saveSystem.createSave(name);
      game.saveUi.message = result && result.message ? result.message : "セーブしました。";
    }

    function overwriteExistingSave(saveId) {
      if (!saveSystem || typeof saveSystem.overwriteSave !== "function") {
        game.saveUi.message = "セーブ機能を利用できません。";
        return;
      }
      const save = saveSystem.listSaves().find((entry) => entry.id === saveId);
      if (!save) {
        game.saveUi.message = "上書き先が見つかりません。";
        return;
      }
      if (!window.confirm(`${save.name} に上書きしますか？`)) {
        game.saveUi.message = "上書きをキャンセルしました。";
        return;
      }
      const result = saveSystem.overwriteSave(saveId);
      game.saveUi.message = result && result.message ? result.message : "上書きしました。";
    }

    function getFileSaveName() {
      const fallback = `セーブデータ${saveSystem && saveSystem.listSaves ? saveSystem.listSaves().length + 1 : 1}`;
      const inputName = window.prompt("セーブファイル名を入力してください。", fallback);
      if (inputName === null) {
        return "";
      }
      return saveSystem && saveSystem.normalizeSaveName
        ? saveSystem.normalizeSaveName(inputName)
        : String(inputName || "").trim().slice(0, 24);
    }

    async function writeSaveTextFile(fileName, text) {
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: "Healer Game Save",
              accept: { "application/json": [".json"] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(text);
          await writable.close();
          return { ok: true };
        } catch (error) {
          if (error && error.name === "AbortError") {
            return { ok: false, canceled: true, message: "ファイル保存をキャンセルしました。" };
          }
        }
      }
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return { ok: true };
    }

    async function exportSaveFile() {
      const restoreState = captureFileSaveUiState();
      if (!saveSystem || typeof saveSystem.createFileSave !== "function") {
        game.saveUi.message = "ファイル保存機能を利用できません。";
        restoreFileSaveUiState(restoreState);
        return;
      }
      const name = getFileSaveName();
      if (!name) {
        game.saveUi.message = "セーブデータ名を入力してください。";
        restoreFileSaveUiState(restoreState);
        return;
      }
      const result = saveSystem.createFileSave(name);
      if (!result || !result.ok) {
        game.saveUi.message = result && result.message ? result.message : "ファイル保存に失敗しました。";
        restoreFileSaveUiState(restoreState);
        return;
      }
      game.saveUi.message = result.message || "セーブファイルを作成しました。";
      const written = await writeSaveTextFile(result.fileName || `${name}.json`, result.text || "");
      if (!written || !written.ok) {
        game.saveUi.message = written && written.message ? written.message : "ファイル保存に失敗しました。";
        restoreFileSaveUiState(restoreState);
        return;
      }
      restoreFileSaveUiState(restoreState);
      game.saveUi.message = `${result.name || name} をファイルに保存しました。`;
    }

    function captureFileSaveUiState() {
      const menu = getSystemMenu();
      return {
        state: game.state,
        titleLoadOpen: game.titleLoadOpen,
        titleLoadMessage: game.titleLoadMessage,
        systemMenuOpen: menu.open,
        systemMenuPanel: menu.panel && typeof menu.panel === "object" ? { ...menu.panel } : menu.panel,
        systemMenuConfirm: menu.confirm,
        panelScroll: menu.panelScroll,
        panelScrollMax: menu.panelScrollMax,
      };
    }

    function restoreFileSaveUiState(snapshot) {
      if (!snapshot) {
        return;
      }
      const menu = getSystemMenu();
      game.state = snapshot.state;
      game.titleLoadOpen = snapshot.titleLoadOpen;
      game.titleLoadMessage = snapshot.titleLoadMessage;
      menu.open = snapshot.systemMenuOpen;
      menu.panel = snapshot.systemMenuPanel && typeof snapshot.systemMenuPanel === "object" ? { ...snapshot.systemMenuPanel } : snapshot.systemMenuPanel;
      menu.confirm = snapshot.systemMenuConfirm;
      menu.panelScroll = snapshot.panelScroll;
      menu.panelScrollMax = snapshot.panelScrollMax;
      clearMovementKeys();
    }

    function readSelectedFileAsText(file) {
      if (file && typeof file.text === "function") {
        return file.text();
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error || new Error("read failed"));
        reader.readAsText(file);
      });
    }

    function setFileLoadMessage(fromTitle, message) {
      if (fromTitle) {
        game.titleLoadMessage = message || "";
      } else {
        game.saveUi.message = message || "";
      }
    }

    function finishFileLoad(result, fromTitle) {
      if (fromTitle) {
        game.titleTargets = [];
        game.titleLoadOpen = false;
        game.titleLoadMessage = "";
      } else {
        const menu = getSystemMenu();
        menu.panel = null;
        menu.confirm = null;
        menu.open = false;
      }
      startTown();
      game.message = result && result.message ? result.message : "セーブファイルをロードしました。";
      game.messageTimer = 4;
      clearMovementKeys();
    }

    function importSaveFile(fromTitle = false) {
      if (!saveSystem || typeof saveSystem.importFileText !== "function") {
        setFileLoadMessage(fromTitle, "ファイル読込機能を利用できません。");
        return;
      }
      const inputEl = document.createElement("input");
      inputEl.type = "file";
      inputEl.accept = ".json,application/json";
      inputEl.hidden = true;
      inputEl.addEventListener("change", async () => {
        const file = inputEl.files && inputEl.files[0];
        inputEl.remove();
        if (!file) {
          setFileLoadMessage(fromTitle, "ファイル読込をキャンセルしました。");
          return;
        }
        try {
          const text = await readSelectedFileAsText(file);
          const result = saveSystem.importFileText(text);
          if (!result || !result.ok) {
            setFileLoadMessage(fromTitle, result && result.message ? result.message : "ファイル読込に失敗しました。");
            return;
          }
          finishFileLoad(result, fromTitle);
        } catch (error) {
          setFileLoadMessage(fromTitle, "ファイル読込に失敗しました。");
        }
      }, { once: true });
      document.body.appendChild(inputEl);
      inputEl.click();
    }

    function loadTitleSave(saveId) {
      if (!saveSystem || typeof saveSystem.loadSave !== "function") {
        game.titleLoadMessage = "ロード機能を利用できません。";
        return;
      }
      const result = saveSystem.loadSave(saveId);
      if (!result || !result.ok) {
        game.titleLoadMessage = result && result.message ? result.message : "ロードに失敗しました。";
        return;
      }
      game.titleTargets = [];
      startTown();
      game.message = result.message || "ロードしました。";
      game.messageTimer = 4;
      clearMovementKeys();
    }

    function deleteTitleSave(saveId) {
      if (!saveSystem || typeof saveSystem.deleteSave !== "function" || typeof saveSystem.listSaves !== "function") {
        game.titleLoadMessage = "削除機能を利用できません。";
        return;
      }
      const save = saveSystem.listSaves().find((entry) => entry && entry.id === saveId);
      if (!save) {
        game.titleLoadMessage = "削除するセーブデータが見つかりません。";
        return;
      }
      if (!window.confirm(`${save.name || "セーブデータ"} を削除しますか？`)) {
        game.titleLoadMessage = "削除をキャンセルしました。";
        return;
      }
      const result = saveSystem.deleteSave(saveId);
      game.titleLoadMessage = result && result.message ? result.message : "セーブデータを削除しました。";
      game.titleLoadScroll = Math.max(0, Math.min(game.titleLoadScrollMax || 0, game.titleLoadScroll || 0));
      clearMovementKeys();
    }

    function getDefeatUi() {
      if (!game.defeatUi || typeof game.defeatUi !== "object") {
        game.defeatUi = { mode: "main", message: "" };
      }
      return game.defeatUi;
    }

    function hasCurrentSavePoint() {
      const saveId = game.currentSaveId;
      if (!saveId || !saveSystem || typeof saveSystem.listSaves !== "function") {
        return false;
      }
      return saveSystem.listSaves().some((entry) => entry && entry.id === saveId);
    }

    function restartFromCurrentSavePoint() {
      if (game.state !== "lost") {
        return;
      }
      const ui = getDefeatUi();
      if (!hasCurrentSavePoint() || !saveSystem || typeof saveSystem.loadSave !== "function") {
        ui.mode = "main";
        ui.message = "利用できるセーブ地点がありません。";
        clearMovementKeys();
        return;
      }
      const result = saveSystem.loadSave(game.currentSaveId);
      if (!result || !result.ok) {
        ui.mode = "main";
        ui.message = result && result.message ? result.message : "セーブ地点から再開できませんでした。";
        clearMovementKeys();
        return;
      }
      game.state = "title";
      game.defeatUi = null;
      startTown();
      game.message = result.message || "セーブ地点から再開しました。";
      game.messageTimer = 4;
      clearMovementKeys();
    }

    function openDefeatTownRestartChoice() {
      if (game.state !== "lost") {
        return;
      }
      const ui = getDefeatUi();
      ui.mode = "town";
      ui.message = "";
      clearMovementKeys();
    }

    function backToDefeatMainChoice() {
      const ui = getDefeatUi();
      ui.mode = "main";
      ui.message = "";
      clearMovementKeys();
    }

    function canAffordDefeatInnRestart() {
      if (typeof canAffordGold === "function") {
        return canAffordGold(DEFEAT_INN_RESTART_COST);
      }
      const gold = typeof getGold === "function"
        ? getGold()
        : Number.isFinite(game.gold)
          ? game.gold
          : 0;
      return gold >= DEFEAT_INN_RESTART_COST;
    }

    function spendDefeatInnRestartCost() {
      if (typeof spendGold === "function") {
        return spendGold(DEFEAT_INN_RESTART_COST);
      }
      if (!canAffordDefeatInnRestart()) {
        return false;
      }
      game.gold = Math.max(0, Math.floor((Number.isFinite(game.gold) ? game.gold : 0) - DEFEAT_INN_RESTART_COST));
      return true;
    }

    function restartFromTown(useInn) {
      if (game.state !== "lost") {
        return;
      }
      const ui = getDefeatUi();
      if (useInn) {
        if (!spendDefeatInnRestartCost()) {
          ui.mode = "town";
          ui.message = "所持金が足りません。";
          clearMovementKeys();
          return;
        }
        recoverBattlePartyFullForDefeatRestart();
        game.innRestUsedUntilBattle = true;
      } else {
        recoverBattlePartyLowForDefeatRestart();
      }
      const message = useInn ? "宿屋から再開しました。" : "町から再開しました。";
      game.defeatUi = null;
      game.battleRewards = null;
      startTown();
      game.message = message;
      game.messageTimer = 4;
      clearMovementKeys();
    }

    function recoverBattlePartyFullForDefeatRestart() {
      if (!game.partyHpById || typeof game.partyHpById !== "object") {
        game.partyHpById = {};
      }
      if (!game.partyMpById || typeof game.partyMpById !== "object") {
        game.partyMpById = {};
      }
      if (!game.partyDeadById || typeof game.partyDeadById !== "object") {
        game.partyDeadById = {};
      }
      game.partyStatusById = {};
      const seen = new Set();
      for (const member of [player, ...(Array.isArray(party) ? party : [])]) {
        if (!member || !member.id || seen.has(member.id)) {
          continue;
        }
        seen.add(member.id);
        const maxHp = Math.max(1, Number.isFinite(member.maxHp) ? member.maxHp : member.hp || 1);
        const maxMp = Math.max(0, Number.isFinite(member.maxMp) ? member.maxMp : member.mp || 0);
        member.hp = maxHp;
        member.mp = maxMp;
        member.dead = false;
        clearMemberBattleStatuses(member);
        game.partyHpById[member.id] = maxHp;
        game.partyMpById[member.id] = maxMp;
        delete game.partyDeadById[member.id];
      }
    }

    function recoverBattlePartyLowForDefeatRestart() {
      if (!game.partyHpById || typeof game.partyHpById !== "object") {
        game.partyHpById = {};
      }
      if (!game.partyMpById || typeof game.partyMpById !== "object") {
        game.partyMpById = {};
      }
      if (!game.partyDeadById || typeof game.partyDeadById !== "object") {
        game.partyDeadById = {};
      }
      game.partyStatusById = {};
      const seen = new Set();
      for (const member of [player, ...(Array.isArray(party) ? party : [])]) {
        if (!member || !member.id || seen.has(member.id)) {
          continue;
        }
        seen.add(member.id);
        const maxHp = Math.max(1, Number.isFinite(member.maxHp) ? member.maxHp : member.hp || 1);
        const hp = Math.max(1, Math.ceil(maxHp * DEFEAT_TOWN_RESTART_HP_RATIO));
        member.hp = hp;
        member.dead = false;
        clearMemberBattleStatuses(member);
        game.partyHpById[member.id] = hp;
        delete game.partyDeadById[member.id];
      }
    }

    function clearMemberBattleStatuses(member) {
      member.shield = 0;
      member.shieldTimer = 0;
      member.shields = [];
      member.frozen = 0;
      member.frozenMax = 0;
      member.burnTimer = 0;
      member.burnMax = 0;
      member.burnTick = 0;
      member.burnTickRate = 1;
      member.burnDamageHpRatio = 0;
      member.burnSource = null;
      member.sleepTimer = 0;
      member.sleepMax = 0;
      member.poisonActive = false;
      member.poisonTick = 0;
      member.poisonTickRate = 1;
      member.poisonDamageHpRatio = 0;
      member.poisonSource = null;
      member.woundStacks = 0;
      member.injuryTimer = 0;
      member.injuryMax = 0;
      member.plantStage = 0;
      member.plantSource = null;
      member.plantUpgradedBy = {};
      member.contemptStacks = 0;
      member.contemptTimer = 0;
      member.contemptMax = 0;
      member.feelTimer = 0;
      member.feelMax = 0;
      member.feelGuardCount = 0;
      member.desteStacks = 0;
      member.regretTimer = 0;
      member.regretMax = 0;
      member.sorrowTimer = 0;
      member.sorrowMax = 0;
      member.sorrowTick = 0;
      member.reunionTimer = 0;
      member.reunionMax = 0;
      member.reunionSource = null;
      member.absorptionLockTimer = 0;
      member.magicNeutralizeTimer = 0;
      member.magicNeutralizeMax = 0;
      member.magicNeutralizeRatio = 0;
      member.actionSpeedDownTimer = 0;
      member.actionSpeedDownMax = 0;
      member.actionSpeedDownRatio = 0;
      member.shadowDashTimer = 0;
      member.shadowDashMax = 0;
      member.rihasPassiveStacks = 0;
      member.rihasPassiveTimer = 0;
      member.rihasPassiveStackCooldown = 0;
      member.castStacks = 0;
      member.stackTimer = 0;
      member.stackCooldown = 0;
      member.forcedTarget = null;
      member.tauntTimer = 0;
      member.delayedDamageQueue = [];
      member.aiIntent = null;
      member.aiMoveTarget = null;
      member.aim = null;
      member.itemAim = null;
      member.itemUseRequest = null;
      member.itemCast = null;
      member.cast = null;
      member.channel = null;
    }

    function selectSettingsTab(tab) {
      const ui = getSettingsUi();
      ui.tab = tab === "controls" ? "controls" : "game";
      ui.controlsCapture = null;
      clearMovementKeys();
    }

    function startKeybindCapture(actionId) {
      if (!keybindTools || !keybindTools.getAction(actionId)) {
        return;
      }
      const ui = getSettingsUi();
      ui.tab = "controls";
      ui.controlsCapture = { actionId };
      ui.message = "変更先の操作を入力してください。";
      clearMovementKeys();
    }

    function finishKeybindCapture(binding) {
      if (!keybindTools || !binding) {
        return false;
      }
      const ui = getSettingsUi();
      const capture = ui.controlsCapture;
      if (!capture || !capture.actionId) {
        return false;
      }
      if (keybindTools.isBindingAllowed && !keybindTools.isBindingAllowed(capture.actionId, binding)) {
        ui.controlsCapture = null;
        ui.message = "メニュー開閉/戻るに左クリックは設定できません。";
        clearMovementKeys();
        return true;
      }
      const draft = getControlsDraft();
      draft[capture.actionId] = binding;
      ui.controlsDraft = keybindTools.normalizeKeybinds(draft);
      ui.controlsCapture = null;
      const action = keybindTools.getAction(capture.actionId);
      ui.message = `${action ? action.label : "操作"}を${keybindTools.bindingLabel(binding)}に変更しました。`;
      clearMovementKeys();
      return true;
    }

    function handleControlCaptureKey(event) {
      const ui = getSettingsUi();
      if (!keybindTools || !ui.controlsCapture) {
        return false;
      }
      const binding = keybindTools.keyboardEventToBinding(event);
      if (!binding) {
        return false;
      }
      event.preventDefault();
      finishKeybindCapture(binding);
      return true;
    }

    function handleControlCaptureMouse(event) {
      const ui = getSettingsUi();
      if (!keybindTools || !ui.controlsCapture) {
        return false;
      }
      const binding = keybindTools.mouseEventToBinding(event);
      if (!binding) {
        return false;
      }
      event.preventDefault();
      finishKeybindCapture(binding);
      return true;
    }

    function saveKeybindDraft() {
      if (!keybindTools) {
        return;
      }
      const draft = getControlsDraft();
      if (keybindTools.hasConflicts(draft)) {
        setSettingsMessage("ボタンの被りがあります。保存できません。");
        return;
      }
      const normalized = keybindTools.normalizeKeybinds(draft);
      getGameSettings().keybinds = normalized;
      keybindTools.saveKeybinds(normalized);
      getSettingsUi().controlsDraft = keybindTools.cloneKeybinds(normalized);
      getSettingsUi().controlsCapture = null;
      setSettingsMessage("キー配置を保存しました。");
      clearMovementKeys();
    }

    function resetKeybindDraftDefaults() {
      if (!keybindTools) {
        return;
      }
      const ui = getSettingsUi();
      ui.controlsDraft = keybindTools.createDefaultKeybinds();
      ui.controlsCapture = null;
      ui.message = "初期設定に戻しました。保存すると適用されます。";
      clearMovementKeys();
    }

    function restoreKeybindDraft() {
      if (!keybindTools) {
        return;
      }
      const ui = getSettingsUi();
      ui.controlsDraft = keybindTools.cloneKeybinds(getActiveKeybinds());
      ui.controlsCapture = null;
      ui.message = "保存前の状態に戻しました。";
      clearMovementKeys();
    }

    function isActionEvent(actionId, event) {
      if (!keybindTools || !event) {
        return false;
      }
      return keybindTools.eventMatchesAction(getGameSettings(), actionId, event);
    }

    function shouldPreventKeyDown(event, key) {
      if (isPresetNativeInputEvent(event)) {
        return false;
      }
      if (isEquipmentPresetNameFocused() || (keybindTools && getSettingsUi().controlsCapture)) {
        if (isEquipmentPresetNameFocused() && (event.ctrlKey || event.metaKey) && ["c", "x", "v"].includes(key)) {
          return false;
        }
        return true;
      }
      if (keybindTools) {
        return Object.values(getActiveKeybinds()).some((binding) =>
          binding && binding.startsWith("key:") && keybindTools.eventMatchesBinding(event, binding)
        );
      }
      return [...playerSkillSlotKeys, ...itemSlotKeys, ...movementKeys, "enter", "escape", "space", "1", "2", "3", "4"].includes(key);
    }

    function getEquipmentUi() {
      return getSystemMenu().equipment;
    }

    function isEquipmentPanelOpen() {
      const menu = getSystemMenu();
      return Boolean(menu.panel && menu.panel.type === "equipment");
    }

    function isEquipmentReadOnly() {
      const menu = getSystemMenu();
      return Boolean(menu.panel && menu.panel.readOnly);
    }

    function isEquipmentPresetNameFocused() {
      if (!isEquipmentPanelOpen()) {
        return false;
      }
      const ui = getEquipmentUi();
      return Boolean(ui.preset && (ui.preset.nameFocused || ui.preset.renameFocused));
    }

    function getCharacterDef(unitId) {
      if (unitId === "finald") {
        return CHARACTER_DEFS && CHARACTER_DEFS.player ? CHARACTER_DEFS.player : null;
      }
      const allies = CHARACTER_DEFS && Array.isArray(CHARACTER_DEFS.allies) ? CHARACTER_DEFS.allies : [];
      return allies.find((member) => member.id === unitId) || null;
    }

    function getLivePartyUnit(unitId) {
      if (player && player.id === unitId) {
        return player;
      }
      return Array.isArray(party) ? party.find((member) => member && member.id === unitId) || null : null;
    }

    function getEquipmentStore() {
      if (!game.partyEquipmentById || typeof game.partyEquipmentById !== "object") {
        game.partyEquipmentById = {};
      }
      return game.partyEquipmentById;
    }

    function getLoadoutStore() {
      if (!game.partyLoadoutById || typeof game.partyLoadoutById !== "object") {
        game.partyLoadoutById = {};
      }
      return game.partyLoadoutById;
    }

    function getPresetStore(unitId) {
      if (!game.equipmentPresetsById || typeof game.equipmentPresetsById !== "object") {
        game.equipmentPresetsById = {};
      }
      if (!Array.isArray(game.equipmentPresetsById[unitId])) {
        game.equipmentPresetsById[unitId] = [];
      }
      return game.equipmentPresetsById[unitId];
    }

    function makeEquipmentUnit(unitId) {
      const live = getLivePartyUnit(unitId);
      if (live) {
        if (typeof getCharacterItem === "function") {
          live.item = getCharacterItem(unitId);
        }
        return live;
      }
      const def = getCharacterDef(unitId);
      if (!def) {
        return null;
      }
      const unit = {
        ...def,
        skillOwner: def.skillOwner || def.id,
        hp: def.maxHp || 100,
        mp: def.maxMp || 0,
        mood: def.id === "finald" ? null : 50,
        ult: 0,
        cds: {},
        activeCommandBias: 0,
      };
      const equipment = getEquipmentStore()[unitId] || def.equipment || {};
      const loadout = getLoadoutStore()[unitId] || null;
      unit.equipment = typeof normalizeEquipment === "function" ? normalizeEquipment(equipment, unit) : { ...equipment };
      unit.loadout = loadout && typeof normalizeLoadout === "function"
        ? normalizeLoadout(unit.skillOwner || unit.id, loadout)
        : typeof getDefaultLoadout === "function"
          ? getDefaultLoadout(unit.skillOwner || unit.id)
          : { passive: null, active: [] };
      unit.item = typeof getCharacterItem === "function" ? getCharacterItem(unitId) : null;
      return unit;
    }

    function getSelectedEquipmentUnit() {
      return makeEquipmentUnit(getEquipmentUi().selectedUnitId || "finald");
    }

    function copyEquipment(equipment) {
      return { ...(equipment || {}) };
    }

    function copyLoadout(loadout) {
      return {
        passive: loadout && loadout.passive ? loadout.passive : null,
        ultimate: loadout && loadout.ultimate ? loadout.ultimate : null,
        active: Array.isArray(loadout && loadout.active) ? loadout.active.slice() : [],
      };
    }

    function copyCharacterItem(item) {
      return item && item.id ? { id: item.id, count: Number.isFinite(item.count) ? item.count : null } : null;
    }

    function getEquipmentRefForInput(itemOrRef) {
      if (typeof getEquipmentItemRef === "function") {
        return getEquipmentItemRef(itemOrRef);
      }
      if (!itemOrRef) {
        return null;
      }
      return typeof itemOrRef === "string" ? itemOrRef : itemOrRef.id || null;
    }

    function equipmentRefsMatch(a, b) {
      const refA = getEquipmentRefForInput(a);
      const refB = getEquipmentRefForInput(b);
      return Boolean(refA && refB && refA === refB);
    }

    function commitEquipmentUnit(unit) {
      if (!unit || !unit.id) {
        return;
      }
      if (typeof normalizeEquipment === "function") {
        unit.equipment = normalizeEquipment(unit.equipment || {}, unit);
      }
      if (typeof normalizeLoadout === "function") {
        unit.loadout = normalizeLoadout(unit.skillOwner || unit.id, unit.loadout || {});
      }
      releaseDuplicateEquipmentRefs(unit);
      getEquipmentStore()[unit.id] = copyEquipment(unit.equipment);
      getLoadoutStore()[unit.id] = copyLoadout(unit.loadout);
      if (typeof setCharacterItem === "function" && typeof clearCharacterItem === "function") {
        if (unit.item && unit.item.id) {
          setCharacterItem(unit.id, unit.item.id, unit.item.count);
        } else {
          clearCharacterItem(unit.id);
        }
      }
      const live = getLivePartyUnit(unit.id);
      if (live && live !== unit) {
        live.equipment = copyEquipment(unit.equipment);
        live.loadout = copyLoadout(unit.loadout);
        live.item = typeof getCharacterItem === "function" ? getCharacterItem(unit.id) : null;
      }
    }

    function releaseDuplicateEquipmentRefs(unit) {
      if (!unit || !unit.id || !unit.equipment) {
        return;
      }
      const refs = new Set(Object.values(unit.equipment)
        .map((ref) => getEquipmentRefForInput(ref))
        .filter((ref) => ref && !isDefaultEquipmentItem(typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(ref) : { id: ref })));
      if (!refs.size) {
        return;
      }
      for (const unitId of equipmentUnitOrder) {
        if (unitId === unit.id) {
          continue;
        }
        const otherUnit = makeEquipmentUnit(unitId);
        if (!otherUnit || !otherUnit.equipment) {
          continue;
        }
        let changed = false;
        for (const [slotKey, ref] of Object.entries(otherUnit.equipment)) {
          if (refs.has(getEquipmentRefForInput(ref))) {
            otherUnit.equipment[slotKey] = null;
            changed = true;
          }
        }
        if (!changed) {
          continue;
        }
        if (typeof normalizeEquipment === "function") {
          otherUnit.equipment = normalizeEquipment(otherUnit.equipment, otherUnit);
        }
        getEquipmentStore()[otherUnit.id] = copyEquipment(otherUnit.equipment);
        const live = getLivePartyUnit(otherUnit.id);
        if (live && live !== otherUnit) {
          live.equipment = copyEquipment(otherUnit.equipment);
        }
      }
    }

    function setEquipmentMessage(text) {
      const ui = getEquipmentUi();
      ui.message = text || "";
      ui.messageTimer = text ? 2.4 : 0;
    }

    function openEquipmentPanelFromTarget(target) {
      const menu = getSystemMenu();
      const ui = getEquipmentUi();
      menu.open = false;
      menu.confirm = null;
      menu.panel = {
        type: "equipment",
        title: target.title,
        lines: target.lines || [],
        readOnly: Boolean(target.readOnly),
      };
      ui.selectedUnitId = "finald";
      ui.picker = null;
      ui.preset = null;
      hidePresetTextInput();
      ui.confirm = null;
      menu.panelScroll = 0;
      menu.panelScrollMax = 0;
      ui.message = "";
      clearMovementKeys();
    }

    function closeEquipmentSubwindow() {
      if (!isEquipmentPanelOpen()) {
        return false;
      }
      const ui = getEquipmentUi();
      if (ui.confirm) {
        ui.confirm = null;
        ui.picker = null;
        ui.itemQuantityDrag = null;
        return true;
      }
      if (ui.picker || ui.preset) {
        ui.picker = null;
        ui.preset = null;
        ui.itemQuantityDrag = null;
        hidePresetTextInput();
        return true;
      }
      return false;
    }

    function clampPresetName(value) {
      const trimmed = Array.from(String(value || "").trim()).slice(0, presetNameMaxLength).join("");
      return trimmed;
    }

    function getActivePresetTextField() {
      const ui = getEquipmentUi();
      if (!ui.preset) {
        return null;
      }
      if (ui.preset.nameFocused) {
        return "name";
      }
      if (ui.preset.renameFocused) {
        return "rename";
      }
      return null;
    }

    function getPresetTextValue(field) {
      const ui = getEquipmentUi();
      if (field === "rename") {
        return ui.preset && typeof ui.preset.renameDraft === "string" ? ui.preset.renameDraft : "";
      }
      return typeof ui.presetName === "string" ? ui.presetName : "";
    }

    function setPresetTextValue(field, value) {
      const ui = getEquipmentUi();
      const next = Array.from(String(value || "")).slice(0, presetNameMaxLength).join("");
      if (field === "rename") {
        if (ui.preset) {
          ui.preset.renameDraft = next;
        }
      } else {
        ui.presetName = next;
      }
      if (!syncingPresetTextInput && field === getActivePresetTextField()) {
        syncPresetNativeInputFromState(field);
      }
      return next;
    }

    function getPresetTextKeys(field) {
      return field === "rename"
        ? { caret: "renameCaret", anchor: "renameAnchor" }
        : { caret: "nameCaret", anchor: "nameAnchor" };
    }

    function clampTextIndex(index, length) {
      return Math.max(0, Math.min(length, Math.floor(Number(index) || 0)));
    }

    function normalizePresetTextState(field) {
      const ui = getEquipmentUi();
      if (!ui.preset || !field) {
        return null;
      }
      const keys = getPresetTextKeys(field);
      const length = Array.from(getPresetTextValue(field)).length;
      if (field === "rename" && ui.preset.renameSelection) {
        ui.preset[keys.anchor] = 0;
        ui.preset[keys.caret] = length;
        ui.preset.renameSelection = false;
      }
      if (!Number.isFinite(ui.preset[keys.anchor])) {
        ui.preset[keys.anchor] = length;
      }
      if (!Number.isFinite(ui.preset[keys.caret])) {
        ui.preset[keys.caret] = ui.preset[keys.anchor];
      }
      ui.preset[keys.anchor] = clampTextIndex(ui.preset[keys.anchor], length);
      ui.preset[keys.caret] = clampTextIndex(ui.preset[keys.caret], length);
      return {
        field,
        value: getPresetTextValue(field),
        length,
        anchor: ui.preset[keys.anchor],
        caret: ui.preset[keys.caret],
      };
    }

    function setPresetTextSelection(field, anchor, caret) {
      const ui = getEquipmentUi();
      if (!ui.preset || !field) {
        return;
      }
      const keys = getPresetTextKeys(field);
      const length = Array.from(getPresetTextValue(field)).length;
      ui.preset[keys.anchor] = clampTextIndex(anchor, length);
      ui.preset[keys.caret] = clampTextIndex(caret, length);
      if (!syncingPresetTextInput && field === getActivePresetTextField()) {
        syncPresetNativeInputFromState(field);
      }
    }

    function selectAllPresetText(field = getActivePresetTextField()) {
      if (!field) {
        return false;
      }
      setPresetTextSelection(field, 0, Array.from(getPresetTextValue(field)).length);
      return true;
    }

    function getPresetTextSelectionRange(field = getActivePresetTextField()) {
      const state = normalizePresetTextState(field);
      if (!state) {
        return null;
      }
      return {
        ...state,
        start: Math.min(state.anchor, state.caret),
        end: Math.max(state.anchor, state.caret),
      };
    }

    function replacePresetTextSelection(text, field = getActivePresetTextField()) {
      const range = getPresetTextSelectionRange(field);
      if (!range) {
        return false;
      }
      const chars = Array.from(range.value);
      const insert = Array.from(String(text || "")).filter((char) => char !== "\r" && char !== "\n");
      const room = Math.max(0, presetNameMaxLength - (chars.length - (range.end - range.start)));
      const clipped = insert.slice(0, room);
      chars.splice(range.start, range.end - range.start, ...clipped);
      const next = setPresetTextValue(field, chars.join(""));
      const caret = Math.min(Array.from(next).length, range.start + clipped.length);
      setPresetTextSelection(field, caret, caret);
      return true;
    }

    function deletePresetTextSelection(direction, field = getActivePresetTextField()) {
      const range = getPresetTextSelectionRange(field);
      if (!range) {
        return false;
      }
      const chars = Array.from(range.value);
      if (range.start !== range.end) {
        chars.splice(range.start, range.end - range.start);
        setPresetTextValue(field, chars.join(""));
        setPresetTextSelection(field, range.start, range.start);
        return true;
      }
      if (direction === "backward" && range.caret > 0) {
        chars.splice(range.caret - 1, 1);
        setPresetTextValue(field, chars.join(""));
        setPresetTextSelection(field, range.caret - 1, range.caret - 1);
        return true;
      }
      if (direction === "forward" && range.caret < chars.length) {
        chars.splice(range.caret, 1);
        setPresetTextValue(field, chars.join(""));
        setPresetTextSelection(field, range.caret, range.caret);
      }
      return true;
    }

    function movePresetTextCaret(position, extendSelection = false, field = getActivePresetTextField()) {
      const range = getPresetTextSelectionRange(field);
      if (!range) {
        return false;
      }
      const next = clampTextIndex(position, range.length);
      if (extendSelection) {
        setPresetTextSelection(field, range.anchor, next);
      } else {
        setPresetTextSelection(field, next, next);
      }
      return true;
    }

    function getSelectedPresetText(field = getActivePresetTextField()) {
      const range = getPresetTextSelectionRange(field);
      if (!range || range.start === range.end) {
        return "";
      }
      return Array.from(range.value).slice(range.start, range.end).join("");
    }

    function copyPresetTextSelection(cut = false) {
      const selected = getSelectedPresetText();
      if (!selected) {
        return false;
      }
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(selected).catch(() => {});
      }
      if (cut) {
        deletePresetTextSelection("forward");
      }
      return true;
    }

    function pastePresetTextFromClipboard() {
      if (!getActivePresetTextField()) {
        return false;
      }
      if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
        navigator.clipboard.readText()
          .then((text) => replacePresetTextSelection(text))
          .catch(() => {});
      }
      return true;
    }

    function ensurePresetTextInput() {
      if (presetTextInput || typeof document === "undefined") {
        return presetTextInput;
      }
      presetTextInput = document.createElement("input");
      presetTextInput.type = "text";
      presetTextInput.maxLength = presetNameMaxLength * 2;
      presetTextInput.autocomplete = "off";
      presetTextInput.autocapitalize = "off";
      presetTextInput.spellcheck = false;
      presetTextInput.setAttribute("aria-hidden", "true");
      Object.assign(presetTextInput.style, {
        position: "fixed",
        left: "0px",
        top: "0px",
        width: "1px",
        height: "1px",
        opacity: "0",
        border: "0",
        padding: "0",
        margin: "0",
        background: "transparent",
        color: "transparent",
        caretColor: "transparent",
        zIndex: "10000",
        pointerEvents: "none",
      });
      presetTextInput.addEventListener("input", syncPresetStateFromNativeInput);
      presetTextInput.addEventListener("select", syncPresetSelectionFromNativeInput);
      presetTextInput.addEventListener("keyup", syncPresetSelectionFromNativeInput);
      presetTextInput.addEventListener("compositionend", syncPresetStateFromNativeInput);
      document.body.appendChild(presetTextInput);
      return presetTextInput;
    }

    function hidePresetTextInput() {
      if (!presetTextInput) {
        return;
      }
      presetTextInput.blur();
      presetTextInput.style.display = "none";
    }

    function codePointIndexToOffset(text, index) {
      return Array.from(String(text || "")).slice(0, index).join("").length;
    }

    function offsetToCodePointIndex(text, offset) {
      return Array.from(String(text || "").slice(0, Math.max(0, offset || 0))).length;
    }

    function positionPresetTextInput(target) {
      const el = ensurePresetTextInput();
      if (!el) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = target && Number.isFinite(target.x) ? target.x : 0;
      const y = target && Number.isFinite(target.y) ? target.y : 0;
      const w = target && Number.isFinite(target.w) ? target.w : 1;
      const h = target && Number.isFinite(target.h) ? target.h : 1;
      el.style.left = `${rect.left + x}px`;
      el.style.top = `${rect.top + y}px`;
      el.style.width = `${Math.max(1, w)}px`;
      el.style.height = `${Math.max(1, h)}px`;
      el.style.display = "block";
    }

    function syncPresetNativeInputFromState(field = getActivePresetTextField(), target = null) {
      const el = ensurePresetTextInput();
      if (!el || !field || syncingPresetTextInput) {
        return;
      }
      const state = normalizePresetTextState(field);
      if (!state) {
        hidePresetTextInput();
        return;
      }
      syncingPresetTextInput = true;
      positionPresetTextInput(target || getEquipmentUi().preset && getEquipmentUi().preset.textInputTarget);
      const value = getPresetTextValue(field);
      if (el.value !== value) {
        el.value = value;
      }
      const start = codePointIndexToOffset(value, Math.min(state.anchor, state.caret));
      const end = codePointIndexToOffset(value, Math.max(state.anchor, state.caret));
      try {
        el.setSelectionRange(start, end);
      } catch (_) {
        // Some IME states temporarily reject selection changes; input sync will recover on the next event.
      }
      if (document.activeElement !== el) {
        el.focus({ preventScroll: true });
      }
      syncingPresetTextInput = false;
    }

    function syncPresetStateFromNativeInput() {
      if (!presetTextInput || syncingPresetTextInput) {
        return;
      }
      const field = getActivePresetTextField();
      if (!field) {
        return;
      }
      syncingPresetTextInput = true;
      const next = setPresetTextValue(field, presetTextInput.value);
      if (presetTextInput.value !== next) {
        presetTextInput.value = next;
      }
      syncingPresetTextInput = false;
      syncPresetSelectionFromNativeInput();
    }

    function syncPresetSelectionFromNativeInput() {
      if (!presetTextInput || syncingPresetTextInput) {
        return;
      }
      const field = getActivePresetTextField();
      if (!field) {
        return;
      }
      const value = getPresetTextValue(field);
      const start = offsetToCodePointIndex(value, presetTextInput.selectionStart || 0);
      const end = offsetToCodePointIndex(value, presetTextInput.selectionEnd || start);
      syncingPresetTextInput = true;
      setPresetTextSelection(field, start, end);
      syncingPresetTextInput = false;
    }

    function isPresetNativeInputEvent(event) {
      return Boolean(presetTextInput && event && event.target === presetTextInput);
    }

    function handleEquipmentPresetTextKey(event, key) {
      if (!isEquipmentPresetNameFocused()) {
        return false;
      }
      const field = getActivePresetTextField();
      const range = getPresetTextSelectionRange(field);
      if (!field || !range) {
        return false;
      }
      if (key === "escape") {
        return false;
      }
      if (isPresetNativeInputEvent(event)) {
        if (key === "enter") {
          syncPresetStateFromNativeInput();
          if (field === "rename") {
            saveEquipmentPresetNameEdit();
          } else {
            saveEquipmentPreset();
          }
          return true;
        }
        event.__presetAllowDefault = true;
        return true;
      }
      if (event.ctrlKey || event.metaKey) {
        if (key === "a") {
          selectAllPresetText(field);
          return true;
        }
        if (["c", "x", "v"].includes(key)) {
          return false;
        }
        return false;
      }
      if (key === "enter") {
        if (field === "rename") {
          saveEquipmentPresetNameEdit();
        } else {
          saveEquipmentPreset();
        }
        return true;
      }
      if (key === "backspace") {
        deletePresetTextSelection("backward", field);
        return true;
      }
      if (key === "delete") {
        deletePresetTextSelection("forward", field);
        return true;
      }
      if (key === "arrowleft") {
        const next = !event.shiftKey && range.start !== range.end ? range.start : range.caret - 1;
        movePresetTextCaret(next, event.shiftKey, field);
        return true;
      }
      if (key === "arrowright") {
        const next = !event.shiftKey && range.start !== range.end ? range.end : range.caret + 1;
        movePresetTextCaret(next, event.shiftKey, field);
        return true;
      }
      if (key === "home") {
        movePresetTextCaret(0, event.shiftKey, field);
        return true;
      }
      if (key === "end") {
        movePresetTextCaret(range.length, event.shiftKey, field);
        return true;
      }
      if (event.altKey || event.key.length < 1 || event.key === "Dead" || event.key.length > 2) {
        return false;
      }
      replacePresetTextSelection(event.key, field);
      return true;
    }

    function equipSelectedItem(itemId, options = {}) {
      if (isEquipmentReadOnly()) {
        setEquipmentMessage("戦闘中は装備確認のみです。");
        return;
      }
      const unit = getSelectedEquipmentUnit();
      const item = typeof resolveEquipmentItem === "function" ? resolveEquipmentItem(itemId) : null;
      if (!unit || !item || typeof equipItem !== "function") {
        setEquipmentMessage("この装備は装備できません。");
        return;
      }
      const itemRef = getEquipmentRefForInput(item);
      const currentItemId = unit.equipment && unit.equipment[item.slot] || null;
      if (equipmentRefsMatch(currentItemId, itemRef)) {
        if (isRequiredEquipmentSlot(item.slot)) {
          setEquipmentMessage(item.slot === "weapon" ? "武器は外せません。" : "この枠は外せません。");
          return;
        }
        if (typeof unequipSlot !== "function" || !unequipSlot(unit, item.slot)) {
          setEquipmentMessage("この枠は外せません。");
          return;
        }
        commitEquipmentUnit(unit);
        getEquipmentUi().picker = null;
          setEquipmentMessage("装備を外しました。");
        return;
      }
      if (!options.skipTransferConfirm) {
        const holder = findOtherEquipmentHolder(unit, item);
        if (holder) {
          openEquipmentItemStealConfirm(unit, item, holder);
          return;
        }
      }
      if (!equipItem(unit, item)) {
        setEquipmentMessage("この装備は装備できません。");
        return;
      }
      commitEquipmentUnit(unit);
      getEquipmentUi().picker = null;
      setEquipmentMessage(`${item.name || "装備"}を装備しました。`);
    }

    function isRequiredEquipmentSlot(slotKey) {
      const slots = EQUIPMENT_DATA && Array.isArray(EQUIPMENT_DATA.slots) ? EQUIPMENT_DATA.slots : [];
      const slot = slots.find((entry) => entry && entry.key === slotKey);
      return Boolean(slot && slot.required);
    }

    function unequipSelectedSlot(slotKey) {
      if (isEquipmentReadOnly()) {
        setEquipmentMessage("戦闘中は装備確認のみです。");
        return;
      }
      const unit = getSelectedEquipmentUnit();
      if (!unit || typeof unequipSlot !== "function" || !unequipSlot(unit, slotKey)) {
        setEquipmentMessage(slotKey === "weapon" ? "武器は外せません。" : "この枠は外せません。");
        return;
      }
      commitEquipmentUnit(unit);
      getEquipmentUi().picker = null;
      setEquipmentMessage("装備を外しました。");
    }

    function selectCharacterItemCandidate(itemId) {
      const ui = getEquipmentUi();
      if (!ui.picker || ui.picker.kind !== "item") {
        return;
      }
      const unit = getSelectedEquipmentUnit();
      const candidates = typeof getItemCandidates === "function" ? getItemCandidates() : [];
      const item = candidates.find((entry) => entry && entry.id === itemId);
      if (!unit || !item || item.equippable === false) {
        return;
      }
      const current = typeof getCharacterItem === "function" ? getCharacterItem(unit.id) : null;
      const max = getCharacterItemAssignableMax(unit, item);
      ui.picker.itemId = item.id;
      ui.picker.itemQuantity = Math.max(1, Math.min(max, current && current.id === item.id && Number.isFinite(current.count) ? current.count : 1));
    }

    function adjustCharacterItemQuantity(delta) {
      const ui = getEquipmentUi();
      const picker = ui.picker || {};
      if (picker.kind !== "item" || !picker.itemId) {
        return;
      }
      const unit = getSelectedEquipmentUnit();
      const item = getItemCandidateById(picker.itemId);
      const max = getCharacterItemAssignableMax(unit, item);
      picker.itemQuantity = Math.max(1, Math.min(max, Math.floor(Number(picker.itemQuantity) || 1) + Math.floor(Number(delta) || 0)));
    }

    function setCharacterItemQuantityFromRatio(ratio) {
      const ui = getEquipmentUi();
      const picker = ui.picker || {};
      if (picker.kind !== "item" || !picker.itemId) {
        return;
      }
      const unit = getSelectedEquipmentUnit();
      const item = getItemCandidateById(picker.itemId);
      const max = getCharacterItemAssignableMax(unit, item);
      const normalized = Math.max(0, Math.min(1, Number(ratio) || 0));
      picker.itemQuantity = Math.max(1, Math.min(max, Math.round(1 + (max - 1) * normalized)));
    }

    function startCharacterItemQuantityDrag(target) {
      const ui = getEquipmentUi();
      if (!target || !target.w) {
        ui.itemQuantityDrag = null;
        return;
      }
      ui.itemQuantityDrag = { x: target.x, w: target.w };
    }

    function updateCharacterItemQuantityDrag() {
      const ui = getEquipmentUi();
      const drag = ui.itemQuantityDrag;
      if (!drag || !drag.w) {
        return false;
      }
      setCharacterItemQuantityFromRatio((input.mouse.x - drag.x) / drag.w);
      return true;
    }

    function equipSelectedCharacterItem(itemId, count = null) {
      if (isEquipmentReadOnly()) {
        setEquipmentMessage("戦闘中は装備確認のみです。");
        return;
      }
      const unit = getSelectedEquipmentUnit();
      const candidates = typeof getItemCandidates === "function" ? getItemCandidates() : [];
      const item = candidates.find((entry) => entry && entry.id === itemId);
      if (!unit || !item || item.equippable === false || typeof setCharacterItem !== "function") {
        setEquipmentMessage("このアイテムは装備できません。");
        return;
      }
      const current = typeof getCharacterItem === "function" ? getCharacterItem(unit.id) : null;
      if (current && current.id === item.id) {
        const desiredCount = Math.max(1, Math.floor(Number(count) || Number(current.count) || 1));
        if (current.count === desiredCount) {
          getEquipmentUi().picker = null;
          setEquipmentMessage("アイテム数は変更ありません。");
          return;
        }
      }
      const desired = Math.max(1, Math.floor(Number(count) || 1));
      if (!setCharacterItem(unit.id, item.id, desired)) {
        setEquipmentMessage("このアイテムは装備できません。");
        return;
      }
      unit.item = typeof getCharacterItem === "function" ? getCharacterItem(unit.id) : item;
      getEquipmentUi().picker = null;
      setEquipmentMessage(`${item.name || "アイテム"}を${unit.item && unit.item.count ? unit.item.count : desired}個持たせました。`);
    }

    function getItemCandidateById(itemId) {
      const candidates = typeof getItemCandidates === "function" ? getItemCandidates() : [];
      return candidates.find((entry) => entry && entry.id === itemId) || null;
    }

    function getCharacterItemAssignableMax(unit, item) {
      if (!unit || !item) {
        return 1;
      }
      const current = typeof getCharacterItem === "function" ? getCharacterItem(unit.id) : null;
      const currentCount = current && current.id === item.id && Number.isFinite(current.count) ? current.count : 0;
      const inventoryCount = typeof getItemInventoryCount === "function"
        ? getItemInventoryCount(item.id)
        : Number.isFinite(item.inventoryCount) ? item.inventoryCount : 0;
      const maxCount = Math.max(1, Math.floor(Number.isFinite(item.battleMaxCount) ? item.battleMaxCount : Number.isFinite(item.maxCount) ? item.maxCount : 1));
      return Math.max(1, Math.min(maxCount, inventoryCount + currentCount));
    }

    function clearSelectedCharacterItem() {
      if (isEquipmentReadOnly()) {
        setEquipmentMessage("戦闘中は装備確認のみです。");
        return;
      }
      const unit = getSelectedEquipmentUnit();
      if (!unit || typeof clearCharacterItem !== "function") {
        return;
      }
      clearCharacterItem(unit.id);
      unit.item = null;
      getEquipmentUi().picker = null;
      setEquipmentMessage("アイテムを外しました。");
    }

    function getFixedAttackKey(owner) {
      return SKILL_DATA && SKILL_DATA[owner] && SKILL_DATA[owner].attack ? "attack" : null;
    }

    function getUnitWeaponItem(unit) {
      return unit && unit.equipment && unit.equipment.weapon && typeof resolveEquipmentItem === "function"
        ? resolveEquipmentItem(unit.equipment.weapon)
        : null;
    }

    function canEquipSkillWithCurrentWeapon(unit, skill) {
      if (!unit || !skill) {
        return false;
      }
      const weapon = getUnitWeaponItem(unit);
      if (Array.isArray(skill.requiredWeaponItemIds) && skill.requiredWeaponItemIds.length) {
        return Boolean(weapon && skill.requiredWeaponItemIds.includes(weapon.id));
      }
      if (Array.isArray(skill.requiredWeapons) && skill.requiredWeapons.length) {
        return Boolean(weapon && skill.requiredWeapons.includes(weapon.weaponType));
      }
      return true;
    }

    function getEquipmentFullName(unit) {
      if (!unit) {
        return "";
      }
      if (unit.id === "finald") {
        return typeof getPlayerFirstName === "function" ? getPlayerFirstName() : (unit.name || "アルジュナ");
      }
      const names = {
        ulpes: "ウルペス",
        rihas: "リハス",
        sushia: "スシア",
      };
      return names[unit.id] || unit.name || unit.id;
    }

    function getSkillIdentity(owner, key, skill) {
      const sourceOwner = skill && skill.sourceOwner ? skill.sourceOwner : owner;
      const sourceKey = skill && skill.sourceKey ? skill.sourceKey : key;
      return `${sourceOwner}:${sourceKey}`;
    }

    function findOtherActiveSkillHolder(unit, skillKey, skill) {
      if (!unit || !skill) {
        return null;
      }
      const owner = unit.skillOwner || unit.id;
      const identity = getSkillIdentity(owner, skillKey, skill);
      for (const unitId of equipmentUnitOrder) {
        if (unitId === unit.id) {
          continue;
        }
        const otherUnit = makeEquipmentUnit(unitId);
        if (!otherUnit) {
          continue;
        }
        const otherOwner = otherUnit.skillOwner || otherUnit.id;
        const otherLoadout = copyLoadout(otherUnit.loadout || (typeof getDefaultLoadout === "function" ? getDefaultLoadout(otherOwner) : null));
        for (const otherKey of getConfigurableActiveKeys(otherOwner, otherLoadout.active)) {
          const otherSkill = SKILL_DATA && SKILL_DATA[otherOwner] && SKILL_DATA[otherOwner][otherKey];
          if (otherSkill && getSkillIdentity(otherOwner, otherKey, otherSkill) === identity) {
            return { unit: otherUnit, key: otherKey };
          }
        }
      }
      return null;
    }

    function openEquipmentSkillStealConfirm(unit, slotIndex, skillKey, holder) {
      const ui = getEquipmentUi();
      ui.confirm = {
        type: "stealActiveSkill",
        unitId: unit.id,
        slotIndex,
        skillKey,
        otherUnitId: holder.unit.id,
        otherSkillKey: holder.key,
        otherName: getEquipmentFullName(holder.unit),
      };
    }

    function findOtherEquipmentHolder(unit, item) {
      if (!unit || !item) {
        return null;
      }
      const itemRef = getEquipmentRefForInput(item);
      for (const unitId of equipmentUnitOrder) {
        if (unitId === unit.id) {
          continue;
        }
        const otherUnit = makeEquipmentUnit(unitId);
        if (!otherUnit || !otherUnit.equipment) {
          continue;
        }
        for (const [slotKey, equippedItemId] of Object.entries(otherUnit.equipment)) {
          if (equipmentRefsMatch(equippedItemId, itemRef)) {
            return { unit: otherUnit, slotKey };
          }
        }
      }
      return null;
    }

    function hasAvailableEquipmentCopy(unit, item) {
      if (!item || isDefaultEquipmentItem(item)) {
        return true;
      }
      if (item.instanceId || item.equipmentInstanceId || item.refId) {
        return !findOtherEquipmentHolder(unit, item);
      }
      return getEquipmentOwnedCount(item.id) > getEquipmentUsedCount(item.id, unit && unit.id);
    }

    function getEquipmentOwnedCount(itemId) {
      if (typeof getEquipmentOwnedCountFromSystem === "function") {
        return getEquipmentOwnedCountFromSystem(itemId);
      }
      const store = game.equipmentInventoryById && typeof game.equipmentInventoryById === "object"
        ? game.equipmentInventoryById
        : {};
      return Math.max(0, Math.floor(Number.isFinite(store[itemId]) ? store[itemId] : 0));
    }

    function getEquipmentUsedCount(itemId, exceptUnitId = null) {
      let count = 0;
      for (const unitId of equipmentUnitOrder) {
        if (unitId === exceptUnitId) {
          continue;
        }
        const unit = makeEquipmentUnit(unitId);
        if (!unit || !unit.equipment) {
          continue;
        }
        for (const equippedItemId of Object.values(unit.equipment)) {
          const equippedBaseId = typeof getEquipmentBaseItemId === "function" ? getEquipmentBaseItemId(equippedItemId) : equippedItemId;
          if (equippedBaseId === itemId) {
            count += 1;
          }
        }
      }
      return count;
    }

    function isDefaultEquipmentItem(item) {
      return Boolean(item && (String(item.id || "").startsWith("default_") || item.material === "製作不可"));
    }

    function openEquipmentItemStealConfirm(unit, item, holder) {
      const ui = getEquipmentUi();
      ui.confirm = {
        type: "stealEquipmentItem",
        unitId: unit.id,
        itemId: getEquipmentRefForInput(item),
        itemName: item.name || item.id,
        otherUnitId: holder.unit.id,
        otherSlotKey: holder.slotKey,
        otherName: getEquipmentFullName(holder.unit),
      };
    }

    function closeEquipmentConfirm() {
      const ui = getEquipmentUi();
      ui.confirm = null;
      ui.picker = null;
    }

    function confirmEquipmentSkillTransfer() {
      const ui = getEquipmentUi();
      const confirm = ui.confirm;
      if (!confirm || confirm.type !== "stealActiveSkill") {
        closeEquipmentConfirm();
        return;
      }
      const targetUnit = makeEquipmentUnit(confirm.unitId);
      const otherUnit = makeEquipmentUnit(confirm.otherUnitId);
      if (otherUnit && confirm.otherSkillKey) {
        const otherOwner = otherUnit.skillOwner || otherUnit.id;
        const otherCurrent = copyLoadout(otherUnit.loadout || (typeof getDefaultLoadout === "function" ? getDefaultLoadout(otherOwner) : null));
        const otherActive = getConfigurableActiveKeys(otherOwner, otherCurrent.active).filter((key) => key !== confirm.otherSkillKey);
        otherUnit.loadout = {
          passive: otherCurrent.passive,
          ultimate: otherCurrent.ultimate,
          active: composeActiveKeys(otherOwner, otherActive),
        };
        commitEquipmentUnit(otherUnit);
      }
      ui.confirm = null;
      if (targetUnit) {
        ui.selectedUnitId = confirm.unitId;
        equipSelectedActiveSkill(confirm.slotIndex, confirm.skillKey, { skipTransferConfirm: true });
      } else {
        ui.picker = null;
      }
    }

    function confirmEquipmentItemTransfer() {
      const ui = getEquipmentUi();
      const confirm = ui.confirm;
      if (!confirm || confirm.type !== "stealEquipmentItem") {
        closeEquipmentConfirm();
        return;
      }
      const otherUnit = makeEquipmentUnit(confirm.otherUnitId);
      if (otherUnit && otherUnit.equipment && confirm.otherSlotKey) {
        otherUnit.equipment[confirm.otherSlotKey] = null;
        commitEquipmentUnit(otherUnit);
      }
      ui.confirm = null;
      ui.selectedUnitId = confirm.unitId;
      equipSelectedItem(confirm.itemId, { skipTransferConfirm: true });
    }

    function getConfigurableActiveKeys(owner, active) {
      return (Array.isArray(active) ? active : []).filter((key) =>
        key && key !== "attack" && !isUltimateSkill(owner, key) && SKILL_DATA && SKILL_DATA[owner] && SKILL_DATA[owner][key]
      );
    }

    function composeActiveKeys(owner, configurable) {
      const limit = typeof getActiveSlotLimit === "function" ? getActiveSlotLimit(owner) : 5;
      const attackKey = getFixedAttackKey(owner);
      const result = [];
      if (attackKey) {
        result.push(attackKey);
      }
      const seen = new Set(result);
      for (const key of configurable) {
        if (!key || seen.has(key)) {
          continue;
        }
        seen.add(key);
        result.push(key);
        if (result.length >= limit) {
          break;
        }
      }
      return result;
    }

    function equipSelectedActiveSkill(slotIndex, skillKey, options = {}) {
      if (isEquipmentReadOnly()) {
        setEquipmentMessage("戦闘中は装備確認のみです。");
        return;
      }
      const unit = getSelectedEquipmentUnit();
      if (!unit || !skillKey) {
        return;
      }
      const owner = unit.skillOwner || unit.id;
      const skill = SKILL_DATA && SKILL_DATA[owner] && SKILL_DATA[owner][skillKey];
      if (!skill || skillKey === "attack" || isUltimateSkill(owner, skillKey)) {
        setEquipmentMessage("このスキルは装備できません。");
        return;
      }
      if (typeof isSkillOwned === "function" && !isSkillOwned(owner, skillKey)) {
        setEquipmentMessage("このスキルは未所持です。");
        return;
      }
      if (!canEquipSkillWithCurrentWeapon(unit, skill)) {
        setEquipmentMessage("必要武器を満たしていません。");
        return;
      }
      const limit = typeof getActiveSlotLimit === "function" ? getActiveSlotLimit(unit) : 5;
      const configurableLimit = Math.max(0, limit - (getFixedAttackKey(owner) ? 1 : 0));
      const index = Math.max(0, Math.min(configurableLimit - 1, Math.floor(Number(slotIndex) || 0)));
      const current = copyLoadout(unit.loadout || (typeof getDefaultLoadout === "function" ? getDefaultLoadout(owner) : null));
      const configurable = getConfigurableActiveKeys(owner, current.active);
      if (configurableLimit <= 0) {
        setEquipmentMessage("空きスキル枠がありません。");
        return;
      }
      const existingIndex = configurable.indexOf(skillKey);
      const otherHolder = options.skipTransferConfirm ? null : findOtherActiveSkillHolder(unit, skillKey, skill);
      if (existingIndex < 0 && otherHolder) {
        openEquipmentSkillStealConfirm(unit, index, skillKey, otherHolder);
        return;
      }
      let reordered = false;
      if (existingIndex >= 0) {
        if (existingIndex === index) {
          configurable.splice(existingIndex, 1);
          unit.loadout = { passive: current.passive, ultimate: current.ultimate, active: composeActiveKeys(owner, configurable) };
          commitEquipmentUnit(unit);
          getEquipmentUi().picker = null;
          setEquipmentMessage("スキルを外しました。");
          return;
        }
        reordered = true;
        if (index >= configurable.length) {
          configurable.splice(existingIndex, 1);
          configurable.push(skillKey);
        } else {
          const targetKey = configurable[index];
          configurable[index] = skillKey;
          configurable[existingIndex] = targetKey;
        }
      } else if (index >= configurable.length) {
        configurable.push(skillKey);
      } else {
        configurable.splice(index, 1, skillKey);
      }
      unit.loadout = { passive: current.passive, ultimate: current.ultimate, active: composeActiveKeys(owner, configurable) };
      if (typeof setUnitLoadout === "function" && getLivePartyUnit(unit.id) === unit) {
        setUnitLoadout(unit, unit.loadout);
      }
      commitEquipmentUnit(unit);
      getEquipmentUi().picker = null;
      setEquipmentMessage(reordered ? "スキル位置を入れ替えました。" : `${skill.name || "スキル"}を装備しました。`);
    }

    function clearSelectedActiveSkill(slotIndex) {
      if (isEquipmentReadOnly()) {
        setEquipmentMessage("戦闘中は装備確認のみです。");
        return;
      }
      const unit = getSelectedEquipmentUnit();
      if (!unit) {
        return;
      }
      const owner = unit.skillOwner || unit.id;
      const current = copyLoadout(unit.loadout || (typeof getDefaultLoadout === "function" ? getDefaultLoadout(owner) : null));
      const configurable = getConfigurableActiveKeys(owner, current.active);
      const index = Math.floor(Number(slotIndex) || 0);
      if (index < 0 || index >= configurable.length) {
        return;
      }
      configurable.splice(index, 1);
      unit.loadout = { passive: current.passive, ultimate: current.ultimate, active: composeActiveKeys(owner, configurable) };
      commitEquipmentUnit(unit);
      getEquipmentUi().picker = null;
      setEquipmentMessage("スキルを外しました。");
    }

    function equipSelectedPassive(passiveKey) {
      if (isEquipmentReadOnly()) {
        setEquipmentMessage("戦闘中は装備確認のみです。");
        return;
      }
      const unit = getSelectedEquipmentUnit();
      if (!unit || !passiveKey) {
        return;
      }
      const owner = unit.skillOwner || unit.id;
      const passive = PASSIVE_DATA && PASSIVE_DATA[owner] && PASSIVE_DATA[owner][passiveKey];
      if (!passive) {
        setEquipmentMessage("このパッシブは装備できません。");
        return;
      }
      if (typeof isPassiveOwned === "function" && !isPassiveOwned(owner, passiveKey)) {
        setEquipmentMessage("このパッシブは未所持です。");
        return;
      }
      if (!canEquipSkillWithCurrentWeapon(unit, passive)) {
        setEquipmentMessage("必要武器を満たしていません。");
        return;
      }
      const current = copyLoadout(unit.loadout || (typeof getDefaultLoadout === "function" ? getDefaultLoadout(owner) : null));
      unit.loadout = { passive: passiveKey, ultimate: current.ultimate, active: current.active };
      commitEquipmentUnit(unit);
      getEquipmentUi().picker = null;
      setEquipmentMessage(`${passive.name || "パッシブ"}を装備しました。`);
    }

    function isUltimateSkill(owner, key) {
      const skill = SKILL_DATA && SKILL_DATA[owner] && SKILL_DATA[owner][key];
      return Boolean(skill && (key === "ult" || skill.category === "必殺技"));
    }

    function equipSelectedUltimate(ultimateKey) {
      if (isEquipmentReadOnly()) {
        setEquipmentMessage("戦闘中は装備確認のみです。");
        return;
      }
      const unit = getSelectedEquipmentUnit();
      if (!unit || !ultimateKey) {
        return;
      }
      const owner = unit.skillOwner || unit.id;
      const skill = SKILL_DATA && SKILL_DATA[owner] && SKILL_DATA[owner][ultimateKey];
      if (!isUltimateSkill(owner, ultimateKey)) {
        setEquipmentMessage("この必殺技は装備できません。");
        return;
      }
      const current = copyLoadout(unit.loadout || (typeof getDefaultLoadout === "function" ? getDefaultLoadout(owner) : null));
      unit.loadout = { passive: current.passive, ultimate: ultimateKey, active: current.active };
      commitEquipmentUnit(unit);
      getEquipmentUi().picker = null;
      setEquipmentMessage(`${skill.name || "必殺技"}を装備しました。`);
    }

    function saveEquipmentPreset() {
      if (isEquipmentReadOnly()) {
        setEquipmentMessage("戦闘中はプリセット保存できません。");
        return;
      }
      syncPresetStateFromNativeInput();
      const unit = getSelectedEquipmentUnit();
      if (!unit) {
        return;
      }
      commitEquipmentUnit(unit);
      const ui = getEquipmentUi();
      const name = clampPresetName(ui.presetName);
      if (!name) {
        ui.presetName = "";
        setEquipmentMessage("プリセット名を入力してください。");
        syncPresetNativeInputFromState("name");
        return;
      }
      ui.presetName = name;
      const presets = getPresetStore(unit.id);
      if (ui.preset && ui.preset.renameFocused) {
        ui.preset = { ...ui.preset, editIndex: null, renameFocused: false, renameDraft: "", renameSelection: false };
      }
      const editIndex = ui.preset && Number.isFinite(ui.preset.editIndex) ? Math.floor(ui.preset.editIndex) : -1;
      if (editIndex >= 0 && presets[editIndex]) {
        const duplicate = presets.findIndex((preset, index) => index !== editIndex && preset && preset.name === name);
        if (duplicate >= 0) {
          setEquipmentMessage("同じ名前のプリセットがあります。");
          return;
        }
        presets[editIndex] = { ...presets[editIndex], name };
        ui.preset = { open: true, nameFocused: false, editIndex: null };
        hidePresetTextInput();
        setEquipmentMessage(`${name}に名前を変更しました。`);
        return;
      }
      const snapshot = {
        name,
        equipment: copyEquipment(unit.equipment),
        loadout: copyLoadout(unit.loadout),
        item: copyCharacterItem(typeof getCharacterItem === "function" ? getCharacterItem(unit.id) : unit.item),
      };
      const index = presets.findIndex((preset) => preset && preset.name === name);
      if (index >= 0) {
        presets[index] = snapshot;
      } else {
        presets.push(snapshot);
      }
      ui.preset = { open: true, nameFocused: false };
      hidePresetTextInput();
      setEquipmentMessage(`${name}を保存しました。`);
    }

    function saveEquipmentPresetNameEdit(index = null) {
      if (isEquipmentReadOnly()) {
        return;
      }
      syncPresetStateFromNativeInput();
      const unit = getSelectedEquipmentUnit();
      const ui = getEquipmentUi();
      const editIndex = Number.isFinite(index)
        ? Math.floor(index)
        : ui.preset && Number.isFinite(ui.preset.editIndex)
          ? Math.floor(ui.preset.editIndex)
          : -1;
      const presets = unit ? getPresetStore(unit.id) : [];
      const preset = presets[editIndex];
      if (!unit || !preset) {
        return;
      }
      const draftName = ui.preset && typeof ui.preset.renameDraft === "string" ? ui.preset.renameDraft : preset.name;
      const name = clampPresetName(draftName);
      if (!name) {
        setEquipmentMessage("プリセット名を入力してください。");
        syncPresetNativeInputFromState("rename");
        return;
      }
      const duplicate = presets.findIndex((entry, presetIndex) => presetIndex !== editIndex && entry && entry.name === name);
      if (duplicate >= 0) {
        setEquipmentMessage("同じ名前のプリセットがあります。");
        return;
      }
      presets[editIndex] = { ...preset, name };
      ui.preset = {
        open: true,
        nameFocused: false,
        editIndex: null,
        renameFocused: false,
        renameDraft: "",
        renameSelection: false,
      };
      hidePresetTextInput();
      setEquipmentMessage(`${name}に名前を変更しました。`);
    }

    function loadEquipmentPreset(index) {
      if (isEquipmentReadOnly()) {
        setEquipmentMessage("戦闘中はプリセット読み込みできません。");
        return;
      }
      const unit = getSelectedEquipmentUnit();
      const presets = unit ? getPresetStore(unit.id) : [];
      const preset = presets[Math.floor(Number(index) || 0)];
      if (!unit || !preset) {
        return;
      }
      unit.equipment = copyEquipment(preset.equipment);
      unit.loadout = copyLoadout(preset.loadout);
      if (Object.prototype.hasOwnProperty.call(preset, "item")) {
        unit.item = copyCharacterItem(preset.item);
      }
      commitEquipmentUnit(unit);
      setEquipmentMessage(`${preset.name || "プリセット"}を読み込みました。`);
    }

    function editEquipmentPresetName(index) {
      if (isEquipmentReadOnly()) {
        return;
      }
      const unit = getSelectedEquipmentUnit();
      const presets = unit ? getPresetStore(unit.id) : [];
      const editIndex = Math.floor(Number(index) || 0);
      const preset = presets[editIndex];
      if (!unit || !preset) {
        return;
      }
      const ui = getEquipmentUi();
      ui.presetName = clampPresetName(preset.name || `プリセット${editIndex + 1}`);
      ui.preset = {
        open: true,
        nameFocused: false,
        editIndex,
        renameFocused: true,
        renameDraft: ui.presetName,
        renameSelection: true,
      };
      setEquipmentMessage("名前を編集できます。");
    }

    function deleteEquipmentPreset(index) {
      if (isEquipmentReadOnly()) {
        return;
      }
      const unit = getSelectedEquipmentUnit();
      const presets = unit ? getPresetStore(unit.id) : [];
      const deleteIndex = Math.floor(Number(index) || 0);
      const preset = presets[deleteIndex];
      if (!unit || !preset) {
        return;
      }
      presets.splice(deleteIndex, 1);
      const ui = getEquipmentUi();
      if (ui.preset && Number.isFinite(ui.preset.editIndex)) {
        if (ui.preset.editIndex === deleteIndex) {
          ui.preset = {
            open: true,
            nameFocused: false,
            editIndex: null,
            renameFocused: false,
            renameDraft: "",
            renameSelection: false,
          };
        } else if (ui.preset.editIndex > deleteIndex) {
          ui.preset.editIndex -= 1;
        }
      }
      setEquipmentMessage(`${preset.name || "プリセット"}を削除しました。`);
    }

    function isSystemMenuOpen() {
      const menu = getSystemMenu();
      return Boolean(menu.open || menu.panel || menu.confirm);
    }

    function canOpenSystemMenu() {
      if (!playerProfile.done) {
        return false;
      }
      if (game.state === "town") {
        return !town.story && !town.panel;
      }
      return game.state === "playing";
    }

    function clearMovementKeys() {
      input.keys = input.keys || {};
      for (const key of movementKeys) {
        input.keys[key] = false;
      }
    }

    function setLogicalMovementKey(key, pressed) {
      if (!key) {
        return;
      }
      input.keys = input.keys || {};
      input.keys[key] = Boolean(pressed);
    }

    function getMovementActionFromEvent(event) {
      for (const action of movementActions) {
        if (isActionEvent(action.id, event)) {
          return action;
        }
      }
      return null;
    }

    function closeSystemMenu() {
      const menu = getSystemMenu();
      menu.open = false;
      menu.panel = null;
      menu.confirm = null;
      game.inventoryMessage = null;
      game.inventoryMessageResult = null;
      game.inventoryPowerCrystalBulk = null;
      menu.panelScroll = 0;
      menu.panelScrollMax = 0;
      menu.equipment.picker = null;
      menu.equipment.preset = null;
      menu.equipment.confirm = null;
      menu.equipment.itemQuantityDrag = null;
      menu.settings.controlsCapture = null;
      hidePresetTextInput();
      clearMovementKeys();
    }

    function openSystemMenu() {
      if (!canOpenSystemMenu()) {
        return false;
      }
      const menu = getSystemMenu();
      menu.open = true;
      menu.panel = null;
      menu.confirm = null;
      clearMovementKeys();
      return true;
    }

    function toggleSystemMenu() {
      if (isSystemMenuOpen()) {
        closeSystemMenu();
        return true;
      }
      return openSystemMenu();
    }

    function closeSystemPanel() {
      const menu = getSystemMenu();
      menu.panel = null;
      menu.confirm = null;
      menu.open = false;
      game.inventoryMessage = null;
      game.inventoryMessageResult = null;
      game.inventoryPowerCrystalBulk = null;
      menu.panelScroll = 0;
      menu.panelScrollMax = 0;
      menu.equipment.picker = null;
      menu.equipment.preset = null;
      menu.equipment.confirm = null;
      menu.settings.controlsCapture = null;
      hidePresetTextInput();
      clearMovementKeys();
    }

    function closeSystemConfirm() {
      const menu = getSystemMenu();
      menu.confirm = null;
      menu.open = false;
      clearMovementKeys();
    }

    function returnToTitle() {
      const menu = getSystemMenu();
      menu.open = false;
      menu.panel = null;
      menu.confirm = null;
      menu.targets.length = 0;
      menu.panelScroll = 0;
      menu.panelScrollMax = 0;
      game.state = "title";
      game.time = 0;
      game.message = "";
      game.messageTimer = 0;
      game.titleLoadOpen = false;
      game.titleLoadMessage = "";
      game.titleLoadScroll = 0;
      game.titleLoadScrollMax = 0;
      game.currentQuest = null;
      game.battleRewards = null;
      game.defeatUi = null;
      game.stageClearTimer = 0;
      game.reinforcementsSpawned = false;
      game.priorityTarget = null;
      game.priorityTargetTimer = 0;
      game.priorityTargetIgnoredUnitIds = {};
      game.avoidTarget = null;
      game.avoidTargetTimer = 0;
      if (town) {
        town.panel = null;
        town.selectedQuest = null;
        town.story = null;
        town.interaction = null;
      }
      if (player) {
        player.aim = null;
        player.itemAim = null;
        player.cast = null;
        player.channel = null;
      }
      [enemies, projectiles, telegraphs, areas, effects].forEach((list) => {
        if (Array.isArray(list)) {
          list.length = 0;
        }
      });
      if (expandedStatusUnitIds && typeof expandedStatusUnitIds.clear === "function") {
        expandedStatusUnitIds.clear();
      }
      cancelPlayerAim();
      cancelItemAim();
      clearMovementKeys();
    }

    function clearInventoryMessage() {
      game.inventoryMessage = null;
      game.inventoryMessageResult = null;
      clearMovementKeys();
    }

    function getInventoryPowerCrystalBulkState() {
      const state = game.inventoryPowerCrystalBulk;
      return state && typeof state === "object" ? state : null;
    }

    function isInventoryPowerCrystalBulkPending() {
      const state = getInventoryPowerCrystalBulkState();
      return Boolean(state && state.itemId === "d_power_flag" && state.total > 0 && !state.complete);
    }

    function finishInventoryPowerCrystalBulkUse() {
      clearInventoryMessage();
      const state = getInventoryPowerCrystalBulkState();
      if (state) {
        state.remaining = 0;
        state.complete = true;
      }
      game.inventoryPowerCrystalBulk = null;
      return true;
    }

    function openNextInventoryPowerCrystal() {
      const state = getInventoryPowerCrystalBulkState();
      if (!state || state.complete) {
        return false;
      }
      clearInventoryMessage();
      const remaining = Math.max(0, Math.floor(Number.isFinite(state.remaining) ? state.remaining : 0));
      if (remaining <= 0) {
        return finishInventoryPowerCrystalBulkUse();
      }
      const result = typeof useInventoryItem === "function"
        ? useInventoryItem(state.itemId || "d_power_flag")
        : null;
      if (result && result.ok) {
        state.remaining = Math.max(0, remaining - 1);
        state.opened = Math.max(0, Math.floor(Number.isFinite(state.opened) ? state.opened : 0)) + 1;
      } else {
        state.remaining = 0;
      }
      clearMovementKeys();
      return true;
    }

    function startInventoryPowerCrystalBulkUse() {
      const rawCount = typeof getItemInventoryCount === "function" ? getItemInventoryCount("d_power_flag") : 0;
      const total = Math.max(0, Math.floor(Number.isFinite(rawCount) ? rawCount : 0));
      if (total <= 0) {
        if (typeof useInventoryItem === "function") {
          useInventoryItem("d_power_flag");
        }
        clearMovementKeys();
        return true;
      }
      game.inventoryPowerCrystalBulk = {
        itemId: "d_power_flag",
        total,
        remaining: total,
        opened: 0,
        complete: false,
      };
      return openNextInventoryPowerCrystal();
    }

    function getBattleRewardPowerCrystalAutoState() {
      const rewards = game.battleRewards && typeof game.battleRewards === "object" ? game.battleRewards : null;
      const state = rewards && rewards.autoPowerCrystal;
      return state && typeof state === "object" ? state : null;
    }

    function isBattleRewardPowerCrystalAutoPending() {
      const state = getBattleRewardPowerCrystalAutoState();
      return Boolean(game.state === "won" && state && state.enabled && state.total > 0 && !state.complete);
    }

    function finishBattleRewardCrystalAutoUse() {
      const state = getBattleRewardPowerCrystalAutoState();
      clearInventoryMessage();
      if (state) {
        state.remaining = 0;
        state.complete = true;
      }
      return true;
    }

    function openNextBattleRewardCrystal() {
      const state = getBattleRewardPowerCrystalAutoState();
      if (!state || !state.enabled || state.complete) {
        return false;
      }
      clearInventoryMessage();
      const remaining = Math.max(0, Math.floor(Number.isFinite(state.remaining) ? state.remaining : 0));
      if (remaining <= 0) {
        return finishBattleRewardCrystalAutoUse();
      }
      const result = typeof usePowerCrystalDFromBattleReward === "function"
        ? usePowerCrystalDFromBattleReward()
        : null;
      if (result && result.ok) {
        state.remaining = Math.max(0, remaining - 1);
        state.opened = Math.max(0, Math.floor(Number.isFinite(state.opened) ? state.opened : 0)) + 1;
      } else {
        state.remaining = 0;
      }
      clearMovementKeys();
      return true;
    }

    function activateMenuBack() {
      if (isBattleRewardPowerCrystalAutoPending() && game.inventoryMessage) {
        const state = getBattleRewardPowerCrystalAutoState();
        return state && state.remaining > 0
          ? openNextBattleRewardCrystal()
          : finishBattleRewardCrystalAutoUse();
      }
      if (isInventoryPowerCrystalBulkPending() && game.inventoryMessage) {
        const state = getInventoryPowerCrystalBulkState();
        return state && state.remaining > 0
          ? openNextInventoryPowerCrystal()
          : finishInventoryPowerCrystalBulkUse();
      }
      const menu = getSystemMenu();
      if (menu.confirm) {
        closeSystemConfirm();
        return true;
      }
      if (menu.panel) {
        if (menu.panel.type === "inventory" && game.inventoryMessage) {
          clearInventoryMessage();
          return true;
        }
        if (closeEquipmentSubwindow()) {
          return true;
        }
        closeSystemPanel();
        return true;
      }
      if (menu.open) {
        closeSystemMenu();
        return true;
      }
      if (game.state === "town" && town.panel) {
        closeTownPanel();
        return true;
      }
      return openSystemMenu();
    }

    function handleSystemMenuKey(event, key) {
      if (handleControlCaptureKey(event)) {
        return true;
      }
      if (handleEquipmentPresetTextKey(event, key)) {
        if (!event.__presetAllowDefault) {
          event.preventDefault();
        }
        return true;
      }
      if (!isActionEvent("common.menuBack", event)) {
        return false;
      }
      event.preventDefault();
      return activateMenuBack();
    }

    function handleSystemMenuMouse(event) {
      if (!isActionEvent("common.menuBack", event)) {
        return false;
      }
      event.preventDefault();
      return activateMenuBack();
    }

    function handleClipboardCopy(event) {
      if (!isEquipmentPresetNameFocused()) {
        return;
      }
      if (isPresetNativeInputEvent(event)) {
        return;
      }
      const selected = getSelectedPresetText();
      if (!selected) {
        return;
      }
      if (event.clipboardData) {
        event.clipboardData.setData("text/plain", selected);
        event.preventDefault();
      } else {
        copyPresetTextSelection(false);
      }
    }

    function handleClipboardCut(event) {
      if (!isEquipmentPresetNameFocused()) {
        return;
      }
      if (isPresetNativeInputEvent(event)) {
        setTimeout(syncPresetStateFromNativeInput, 0);
        return;
      }
      const selected = getSelectedPresetText();
      if (!selected) {
        return;
      }
      if (event.clipboardData) {
        event.clipboardData.setData("text/plain", selected);
        event.preventDefault();
      }
      deletePresetTextSelection("forward");
    }

    function handleClipboardPaste(event) {
      if (!isEquipmentPresetNameFocused()) {
        return;
      }
      if (isPresetNativeInputEvent(event)) {
        setTimeout(syncPresetStateFromNativeInput, 0);
        return;
      }
      const text = event.clipboardData ? event.clipboardData.getData("text/plain") : "";
      if (text) {
        replacePresetTextSelection(text);
        event.preventDefault();
      } else {
        pastePresetTextFromClipboard();
      }
    }

    function handleCompositionEnd(event) {
      if (!isEquipmentPresetNameFocused() || !event || !event.data) {
        return;
      }
      if (isPresetNativeInputEvent(event)) {
        setTimeout(syncPresetStateFromNativeInput, 0);
        return;
      }
      replacePresetTextSelection(event.data);
    }

    function getPresetTextIndexFromTarget(target, x) {
      const stops = Array.isArray(target && target.charStops) ? target.charStops : [0];
      const textX = Number.isFinite(target && target.textX) ? target.textX : target.x;
      const relX = Math.max(0, x - textX);
      for (let i = 0; i < stops.length - 1; i += 1) {
        const midpoint = (stops[i] + stops[i + 1]) / 2;
        if (relX < midpoint) {
          return i;
        }
      }
      return Math.max(0, stops.length - 1);
    }

    function focusPresetTextTarget(target, options = {}) {
      if (!target || !target.field) {
        return false;
      }
      const ui = getEquipmentUi();
      if (target.field === "name") {
        ui.preset = {
          ...(ui.preset || {}),
          open: true,
          nameFocused: true,
          editIndex: null,
          renameFocused: false,
          renameDraft: "",
          renameSelection: false,
        };
      } else if (target.field === "rename") {
        ui.preset = {
          ...(ui.preset || {}),
          open: true,
          nameFocused: false,
          editIndex: Number.isFinite(target.index) ? Math.floor(target.index) : ui.preset && ui.preset.editIndex,
          renameFocused: true,
          renameSelection: false,
        };
      }
      if (ui.preset) {
        ui.preset.textInputTarget = target;
      }
      const state = normalizePresetTextState(target.field);
      if (!state) {
        return false;
      }
      const caret = getPresetTextIndexFromTarget(target, input.mouse.x);
      const anchor = options.extend ? state.anchor : caret;
      setPresetTextSelection(target.field, anchor, caret);
      ui.preset.textDrag = options.drag ? {
        field: target.field,
        target,
        anchor,
      } : null;
      syncPresetNativeInputFromState(target.field, target);
      return true;
    }

    function updatePresetTextDrag() {
      const ui = getEquipmentUi();
      const drag = ui.preset && ui.preset.textDrag;
      if (!drag || !drag.field || !drag.target) {
        return false;
      }
      const caret = getPresetTextIndexFromTarget(drag.target, input.mouse.x);
      setPresetTextSelection(drag.field, drag.anchor, caret);
      return true;
    }

    function clampScrollbarValue(value, max) {
      return Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));
    }

    function startScrollbarDrag(target) {
      const state = target && target.scrollState;
      const valueKey = target && target.valueKey ? target.valueKey : "scroll";
      const maxKey = target && target.maxKey ? target.maxKey : "scrollMax";
      const track = target && target.track;
      const knob = target && target.knob;
      const max = Math.max(0, state && Number.isFinite(state[maxKey]) ? state[maxKey] : 0);
      if (!state || !track || !knob || max <= 0) {
        input.scrollbarDrag = null;
        return false;
      }
      const pointerInKnob = input.mouse.y >= knob.y && input.mouse.y <= knob.y + knob.h;
      input.scrollbarDrag = {
        scrollState: state,
        valueKey,
        maxKey,
        trackY: track.y,
        trackH: track.h,
        knobH: knob.h,
        grabOffset: pointerInKnob ? input.mouse.y - knob.y : knob.h / 2,
      };
      updateActiveScrollbarDrag();
      clearMovementKeys();
      return true;
    }

    function updateActiveScrollbarDrag() {
      const drag = input.scrollbarDrag;
      if (!drag || !drag.scrollState) {
        return false;
      }
      const max = Math.max(0, Number.isFinite(drag.scrollState[drag.maxKey]) ? drag.scrollState[drag.maxKey] : 0);
      if (max <= 0) {
        input.scrollbarDrag = null;
        return false;
      }
      const travel = Math.max(1, drag.trackH - drag.knobH);
      const ratio = (input.mouse.y - drag.trackY - drag.grabOffset) / travel;
      drag.scrollState[drag.valueKey] = clampScrollbarValue(ratio * max, max);
      return true;
    }

    function clearScrollbarDrag() {
      input.scrollbarDrag = null;
    }

    function getHoveredTownPanelTarget() {
      const targets = town.panel && Array.isArray(town.panel.clickTargets) ? town.panel.clickTargets : [];
      for (let i = targets.length - 1; i >= 0; i -= 1) {
        const target = targets[i];
        if (
          input.mouse.x >= target.x &&
          input.mouse.x <= target.x + target.w &&
          input.mouse.y >= target.y &&
          input.mouse.y <= target.y + target.h
        ) {
          return target;
        }
      }
      return null;
    }

    function handleTownPanelScrollbarClick() {
      const target = getHoveredTownPanelTarget();
      const action = target && target.action;
      if (!action || action.kind !== "startScrollbarDrag") {
        return false;
      }
      return startScrollbarDrag(action);
    }

    function handleSystemMenuClick(button, event = null) {
      if (button !== 0) {
        return false;
      }
      const menu = getSystemMenu();
      const target = [...menu.targets].reverse().find((entry) =>
        input.mouse.x >= entry.x &&
        input.mouse.x <= entry.x + entry.w &&
        input.mouse.y >= entry.y &&
        input.mouse.y <= entry.y + entry.h
      );
      if (target) {
        if (target.action === "focusEquipmentPresetText") {
          focusPresetTextTarget(target, { extend: Boolean(event && event.shiftKey), drag: true });
        } else if (target.action === "startScrollbarDrag") {
          startScrollbarDrag(target);
        } else if (target.action === "toggleSystemMenu") {
          toggleSystemMenu();
        } else if (target.action === "openSystemPanel") {
          if (target.panelType === "equipment") {
            openEquipmentPanelFromTarget(target);
          } else if (target.panelType === "settings") {
            openSettingsPanelFromTarget(target);
          } else if (target.panelType === "save") {
            openSavePanelFromTarget(target);
          } else {
            menu.open = false;
            menu.confirm = null;
            menu.panel = { type: target.panelType || null, title: target.title, lines: target.lines || [] };
            menu.panelScroll = 0;
            menu.panelScrollMax = 0;
            clearMovementKeys();
          }
        } else if (target.action === "useInventoryItem") {
          if (typeof useInventoryItem === "function") {
            useInventoryItem(target.itemId);
          }
          clearMovementKeys();
        } else if (target.action === "useAllInventoryPowerCrystals") {
          startInventoryPowerCrystalBulkUse();
        } else if (target.action === "openNextInventoryPowerCrystal") {
          openNextInventoryPowerCrystal();
        } else if (target.action === "finishInventoryPowerCrystalBulkUse") {
          finishInventoryPowerCrystalBulkUse();
        } else if (target.action === "openNextBattleRewardCrystal") {
          openNextBattleRewardCrystal();
        } else if (target.action === "finishBattleRewardCrystalAutoUse") {
          finishBattleRewardCrystalAutoUse();
        } else if (target.action === "restartFromSavePoint") {
          restartFromCurrentSavePoint();
        } else if (target.action === "openDefeatTownRestartChoice") {
          openDefeatTownRestartChoice();
        } else if (target.action === "restartFromTownNormal") {
          restartFromTown(false);
        } else if (target.action === "restartFromTownInn") {
          restartFromTown(true);
        } else if (target.action === "backToDefeatMainChoice") {
          backToDefeatMainChoice();
        } else if (target.action === "clearInventoryMessage") {
          clearInventoryMessage();
        } else if (target.action === "openSystemConfirm") {
          menu.open = false;
          menu.panel = null;
          menu.confirm = { title: target.title, lines: target.lines || [], confirmAction: target.confirmAction || null };
          clearMovementKeys();
        } else if (target.action === "closeSystemPanel") {
          closeSystemPanel();
        } else if (target.action === "closeSystemConfirm") {
          closeSystemConfirm();
        } else if (target.action === "confirmOnly") {
          const confirmAction = menu.confirm && menu.confirm.confirmAction;
          if (confirmAction === "returnTitle") {
            returnToTitle();
          } else {
            closeSystemConfirm();
          }
        } else if (target.action === "selectEquipmentUnit") {
          const ui = getEquipmentUi();
          if (equipmentUnitOrder.includes(target.unitId)) {
            ui.selectedUnitId = target.unitId;
            ui.picker = null;
            ui.preset = null;
            hidePresetTextInput();
            ui.confirm = null;
            setEquipmentMessage("");
          }
        } else if (target.action === "openEquipmentPicker") {
          const ui = getEquipmentUi();
          ui.picker = {
            kind: target.kind,
            slotKey: target.slotKey || null,
            slotIndex: Number.isFinite(target.slotIndex) ? target.slotIndex : null,
            scroll: 0,
            scrollMax: 0,
          };
          ui.preset = null;
          hidePresetTextInput();
          ui.confirm = null;
        } else if (target.action === "closeEquipmentPicker") {
          getEquipmentUi().picker = null;
          getEquipmentUi().confirm = null;
          getEquipmentUi().itemQuantityDrag = null;
        } else if (target.action === "equipEquipmentItem") {
          equipSelectedItem(target.itemId);
        } else if (target.action === "selectCharacterItemCandidate") {
          selectCharacterItemCandidate(target.itemId);
        } else if (target.action === "adjustCharacterItemQuantity") {
          adjustCharacterItemQuantity(target.delta);
        } else if (target.action === "setCharacterItemQuantityRatio") {
          const ratio = Number.isFinite(target.ratio)
            ? target.ratio
            : target.w ? (input.mouse.x - target.x) / target.w : 0;
          setCharacterItemQuantityFromRatio(ratio);
          startCharacterItemQuantityDrag(target);
        } else if (target.action === "equipCharacterItem") {
          equipSelectedCharacterItem(target.itemId, target.count);
        } else if (target.action === "clearCharacterItem") {
          clearSelectedCharacterItem();
        } else if (target.action === "unequipEquipmentSlot") {
          unequipSelectedSlot(target.slotKey);
        } else if (target.action === "equipActiveSkill") {
          equipSelectedActiveSkill(target.slotIndex, target.skillKey);
        } else if (target.action === "clearActiveSkill") {
          clearSelectedActiveSkill(target.slotIndex);
        } else if (target.action === "equipPassiveSkill") {
          equipSelectedPassive(target.passiveKey);
        } else if (target.action === "equipUltimateSkill") {
          equipSelectedUltimate(target.ultimateKey);
        } else if (target.action === "openEquipmentPreset") {
          const ui = getEquipmentUi();
          ui.preset = { open: true, nameFocused: false, editIndex: null, renameFocused: false, renameDraft: "", renameSelection: false };
          ui.picker = null;
          ui.confirm = null;
        } else if (target.action === "closeEquipmentPreset") {
          getEquipmentUi().preset = null;
          hidePresetTextInput();
        } else if (target.action === "focusEquipmentPresetName") {
          const ui = getEquipmentUi();
          ui.preset = { open: true, nameFocused: true, editIndex: null, renameFocused: false, renameDraft: "", renameSelection: false };
          syncPresetNativeInputFromState("name");
        } else if (target.action === "saveEquipmentPreset") {
          saveEquipmentPreset();
        } else if (target.action === "saveEquipmentPresetNameEdit") {
          saveEquipmentPresetNameEdit(target.index);
        } else if (target.action === "loadEquipmentPreset") {
          loadEquipmentPreset(target.index);
        } else if (target.action === "editEquipmentPresetName") {
          const presetNameBeforeEdit = getEquipmentUi().presetName;
          editEquipmentPresetName(target.index);
          getEquipmentUi().presetName = presetNameBeforeEdit;
          if (target.focusTarget) {
            focusPresetTextTarget(target.focusTarget, { extend: false, drag: false });
            selectAllPresetText("rename");
          } else {
            syncPresetNativeInputFromState("rename");
          }
        } else if (target.action === "deleteEquipmentPreset") {
          deleteEquipmentPreset(target.index);
        } else if (target.action === "confirmEquipmentSkillTransfer") {
          confirmEquipmentSkillTransfer();
        } else if (target.action === "confirmEquipmentItemTransfer") {
          confirmEquipmentItemTransfer();
        } else if (target.action === "closeEquipmentConfirm") {
          closeEquipmentConfirm();
        } else if (target.action === "closeEquipmentSubwindow") {
          closeEquipmentSubwindow();
        } else if (target.action === "toggleDetailedDescriptions") {
          const settings = getGameSettings();
          settings.tooltipDescriptionMode = settings.tooltipDescriptionMode === "detail" ? "simple" : "detail";
          clearMovementKeys();
        } else if (target.action === "togglePowerCrystalAutoUse") {
          const settings = getGameSettings();
          settings.powerCrystalAutoUse = settings.powerCrystalAutoUse === false;
          clearMovementKeys();
        } else if (target.action === "toggleMapDebugMode") {
          const settings = getGameSettings();
          settings.mapDebugMode = !settings.mapDebugMode;
          clearMovementKeys();
        } else if (target.action === "switchDebugTownMap") {
          switchDebugTownMap(target.mapId);
        } else if (target.action === "selectSettingsTab") {
          selectSettingsTab(target.tab);
        } else if (target.action === "createSaveData") {
          createNewSave();
        } else if (target.action === "overwriteSaveData") {
          overwriteExistingSave(target.saveId);
        } else if (target.action === "exportSaveFile") {
          void exportSaveFile();
        } else if (target.action === "startKeybindCapture") {
          startKeybindCapture(target.actionId);
        } else if (target.action === "saveKeybindDraft") {
          saveKeybindDraft();
        } else if (target.action === "resetKeybindDraftDefaults") {
          resetKeybindDraftDefaults();
        } else if (target.action === "restoreKeybindDraft") {
          restoreKeybindDraft();
        } else if (target.action === "absorbSystemClick") {
          clearMovementKeys();
        }
        return true;
      }
      if (menu.open) {
        closeSystemMenu();
        return true;
      }
      if (menu.panel || menu.confirm) {
        return true;
      }
      return false;
    }

    function handleKeyDown(event) {
      const key = event.key === " " ? "space" : event.key.toLowerCase();

      if (shouldPreventKeyDown(event, key)) {
        event.preventDefault();
      }
      if (event.repeat && !isEquipmentPresetNameFocused() && !(keybindTools && getSettingsUi().controlsCapture)) {
        return;
      }
      if (game.state === "title") {
        if (!game.titleLoadOpen && (key === "enter" || key === "space")) {
          beginTitleStart();
          event.preventDefault();
        } else if (game.titleLoadOpen && key === "escape") {
          game.titleLoadOpen = false;
          game.titleLoadMessage = "";
          event.preventDefault();
        }
        return;
      }
      if (handleSystemMenuKey(event, key)) {
        return;
      }
      if (handleTownPanelKey(event, key)) {
        return;
      }
      if (isSystemMenuOpen()) {
        return;
      }
      const movementAction = getMovementActionFromEvent(event);
      if (game.state === "town" && movementAction) {
        setLogicalMovementKey(movementAction.logicalKey, true);
      }

      if (game.state === "town") {
        if (!playerProfile.done) {
          handleProfileSetupKey(key);
          return;
        }
        if (town.story) {
          if (isActionEvent("field.interact", event)) {
            interactTown();
          }
          return;
        }
        if (town.panel && town.panel.action === "battleGuide" && isActionEvent("field.interact", event)) {
          interactTown();
          return;
        }
        if (isActionEvent("field.interact", event)) {
          interactTown();
        }
        return;
      }

      if (game.state !== "playing") {
        if (game.state === "won" && key === "r" && !isBattleRewardPowerCrystalAutoPending()) {
          startTown();
        }
        return;
      }

      if (isLockedBattleControlEvent(event)) {
        event.preventDefault();
        return;
      }

      if (isActionEvent("battle.skillPage", event)) {
        game.skillPage = game.skillPage === "page2" ? "page1" : "page2";
        cancelPlayerAim();
        cancelItemAim();
        return;
      }
      for (const [unitId, actionId] of Object.entries(ultimateActionByUnitId)) {
        if (isActionEvent(actionId, event)) {
          cancelItemAim();
          triggerUltimate(unitId);
          return;
        }
      }

      const itemSlotIndex = itemActionIds.findIndex((actionId) => isActionEvent(actionId, event));
      if (itemSlotIndex >= 0) {
        useItemSlot(itemSlotIndex);
        return;
      }

      const slotIndex = playerSkillActionIds.findIndex((actionId) => isActionEvent(actionId, event));
      if (slotIndex >= 0) {
        usePlayerSkillSlot(slotIndex);
      }
    }

    function handleTownPanelKey(event, key) {
      if (game.state !== "town" || !town.panel || town.panel.action !== "itemShop") {
        return false;
      }
      const itemId = town.panel.buyQuantityFocusItemId;
      if (!itemId) {
        return false;
      }
      if (!town.panel.buyQuantities || typeof town.panel.buyQuantities !== "object") {
        town.panel.buyQuantities = {};
      }
      const current = Math.max(1, Math.floor(Number(town.panel.buyQuantities[itemId]) || 1));
      if (/^[0-9]$/.test(key)) {
        const base = town.panel.buyQuantityFreshFocus ? "" : String(current);
        const next = Math.max(1, Math.min(99, Math.floor(Number(`${base}${key}`) || 0)));
        town.panel.buyQuantities[itemId] = next;
        town.panel.buyQuantityFreshFocus = false;
        event.preventDefault();
        return true;
      }
      if (key === "backspace" || key === "delete") {
        const text = town.panel.buyQuantityFreshFocus ? "" : String(current);
        const nextText = text.slice(0, -1);
        town.panel.buyQuantities[itemId] = Math.max(1, Math.floor(Number(nextText) || 1));
        town.panel.buyQuantityFreshFocus = false;
        event.preventDefault();
        return true;
      }
      if (key === "enter") {
        interactTown();
        event.preventDefault();
        return true;
      }
      if (key === "escape") {
        town.panel.buyQuantityFocusItemId = null;
        town.panel.buyQuantityFreshFocus = false;
        event.preventDefault();
        return true;
      }
      return false;
    }

    function handleKeyUp(event) {
      const movementAction = getMovementActionFromEvent(event);
      if (!movementAction) {
        return;
      }
      if (game.state === "town") {
        setLogicalMovementKey(movementAction.logicalKey, false);
        event.preventDefault();
      } else if (game.state === "playing") {
        setLogicalMovementKey(movementAction.logicalKey, false);
      }
    }

    function usePlayerSkillSlot(slotIndex) {
      if (isPlayerControlLocked && isPlayerControlLocked()) {
        cancelPlayerAim();
        cancelItemAim();
        return;
      }
      const pageIndex = game.skillPage === "page2" ? 1 : 0;
      const skills = getPanelSkills(player, pageIndex);
      const skill = skills[slotIndex];
      if (!skill) {
        return;
      }
      if (skill.gauge) {
        cancelItemAim();
        triggerUltimate("finald");
      } else if (skill.command) {
        cancelItemAim();
        if (skill.targeted || skill.positioned) {
          startPlayerAim(skill.key);
        } else {
          usePlayerCommand(skill.key);
        }
      } else {
        cancelItemAim();
        startPlayerAim(skill.key);
      }
    }

    function handleMouseMove(event) {
      setMouseFromEvent(event);
      if (updateActiveScrollbarDrag()) {
        event.preventDefault();
        return;
      }
      if (updatePresetTextDrag()) {
        return;
      }
      if (updateCharacterItemQuantityDrag()) {
        return;
      }
      if (hasCommandBiasDrag()) {
        updateCommandBiasDrag(input.mouse.x);
      }
    }

    function handleMouseDown(event) {
      event.preventDefault();
      setMouseFromEvent(event);
      if (canvas && typeof canvas.focus === "function") {
        canvas.focus({ preventScroll: true });
      }
      if (game.state === "title") {
        if (event.button === 0) {
          handleTitleClick(input.mouse.x, input.mouse.y);
        }
        return;
      }
      if (handleControlCaptureMouse(event)) {
        return;
      }
      if (handleSystemMenuMouse(event)) {
        return;
      }
      if (handleSystemMenuClick(event.button, event)) {
        return;
      }
      if (isSystemMenuOpen()) {
        return;
      }
      if (game.state === "town") {
        if (!playerProfile.done) {
          handleProfileSetupClick(input.mouse.x, input.mouse.y);
          return;
        }
        if (town.story) {
          if (isActionEvent("field.interact", event)) {
            interactTown();
          }
          return;
        }
        if (town.panel && event.button === 0 && handleTownPanelScrollbarClick()) {
          return;
        }
        if (town.panel && town.panel.action === "battleGuide" && isActionEvent("field.interact", event)) {
          interactTown({ pointer: true });
          return;
        }
        if (town.panel && event.button === 0) {
          interactTown({ pointer: true });
          return;
        }
        if (isActionEvent("field.interact", event)) {
          interactTown({ pointer: true });
        }
        return;
      }
      if (game.state !== "playing") {
        return;
      }
      if (event.button === 0) {
        if (handleStatusUiClick(input.mouse.x, input.mouse.y)) {
          return;
        }
      }
      if (isPlayerControlLocked && isPlayerControlLocked()) {
        if (isActionEvent("battle.confirm", event) || isActionEvent("battle.cancelAim", event)) {
          cancelPlayerAim();
          cancelItemAim();
          return;
        }
      }
      if (isActionEvent("battle.confirm", event)) {
        if (player.itemAim) {
          confirmItemAim();
          return;
        }
        if (player.aim) {
          confirmPlayerAim();
          return;
        }
      }
      if (isActionEvent("battle.cancelAim", event)) {
        if (event.button === 2) {
          input.mouse.right = true;
        }
        if (player.aim || player.itemAim) {
          cancelPlayerAim();
          cancelItemAim();
        }
      } else if (event.button === 2) {
        input.mouse.right = true;
      }
    }

    function handleTitleClick(x, y) {
      const targets = Array.isArray(game.titleTargets) ? game.titleTargets : [];
      for (let i = targets.length - 1; i >= 0; i -= 1) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        if (x >= target.x && x <= target.x + target.w && y >= target.y && y <= target.y + target.h) {
          if (target.action === "startGame") {
            beginTitleStart();
          } else if (target.action === "openTitleLoad") {
            game.titleLoadOpen = true;
            game.titleLoadMessage = "";
            game.titleLoadScroll = 0;
          } else if (target.action === "closeTitleLoad") {
            game.titleLoadOpen = false;
            game.titleLoadMessage = "";
          } else if (target.action === "loadTitleSave") {
            loadTitleSave(target.saveId);
          } else if (target.action === "deleteTitleSave") {
            deleteTitleSave(target.saveId);
          } else if (target.action === "importTitleSaveFile") {
            importSaveFile(true);
          }
          return true;
        }
      }
      return false;
    }

    function beginTitleStart() {
      if (game.state !== "title") {
        return;
      }
      game.titleTargets = [];
      game.titleLoadOpen = false;
      game.titleLoadMessage = "";
      if (saveSystem && typeof saveSystem.resetForNewGame === "function") {
        saveSystem.resetForNewGame();
      }
      startTown();
    }

    function isLockedBattleControlEvent(event) {
      if (!isPlayerControlLocked || !isPlayerControlLocked()) {
        return false;
      }
      const locked = isActionEvent("battle.skillPage", event)
        || isActionEvent("battle.confirm", event)
        || isActionEvent("battle.cancelAim", event)
        || itemActionIds.some((actionId) => isActionEvent(actionId, event))
        || playerSkillActionIds.some((actionId) => isActionEvent(actionId, event))
        || Object.values(ultimateActionByUnitId).some((actionId) => isActionEvent(actionId, event));
      if (locked) {
        cancelPlayerAim();
        cancelItemAim();
      }
      return locked;
    }

    function handleMouseUp(event) {
      if (event.button === 0) {
        const ui = getEquipmentUi();
        if (ui.preset) {
          ui.preset.textDrag = null;
        }
        ui.itemQuantityDrag = null;
        clearScrollbarDrag();
        clearCommandBiasDrag();
      }
      if (event.button === 2) {
        input.mouse.right = false;
      }
    }

    function handleWheel(event) {
      setMouseFromEvent(event);
      if (game.state === "title" && game.titleLoadOpen) {
        if (scrollNumericState(game, "titleLoadScroll", "titleLoadScrollMax", event.deltaY)) {
          event.preventDefault();
        }
        return;
      }
      if (game.state === "town" && town.panel) {
        if (town.panel.upgradeResult) {
          if (scrollNumericState(town.panel, "resultScroll", "resultScrollMax", event.deltaY)) {
            event.preventDefault();
          }
          return;
        }
        if (scrollNumericState(town.panel, "scroll", "scrollMax", event.deltaY)) {
          event.preventDefault();
        }
        return;
      }
      const menu = getSystemMenu();
      const settings = menu.settings;
      if (!menu.panel) {
        return;
      }
      if (menu.panel.type === "settings" && settings.tab === "controls") {
        if (scrollNumericState(settings, "controlsScroll", "controlsScrollMax", event.deltaY)) {
          event.preventDefault();
        }
        return;
      }
      if (menu.panel.type === "settings") {
        if (scrollNumericState(settings, "gameScroll", "gameScrollMax", event.deltaY)) {
          event.preventDefault();
        }
        return;
      }
      if (menu.panel.type === "equipment") {
        const picker = menu.equipment && menu.equipment.picker;
        if (picker && scrollNumericState(picker, "scroll", "scrollMax", event.deltaY)) {
          event.preventDefault();
        }
        return;
      }
      if (scrollNumericState(menu, "panelScroll", "panelScrollMax", event.deltaY)) {
        event.preventDefault();
      }
    }

    function scrollNumericState(state, valueKey, maxKey, delta) {
      if (!state || !Number.isFinite(delta)) {
        return false;
      }
      const max = Math.max(0, state[maxKey] || 0);
      if (max <= 0) {
        return false;
      }
      state[valueKey] = Math.max(0, Math.min(max, (state[valueKey] || 0) + delta));
      return true;
    }

    function handleMouseLeave() {
      input.mouse.right = false;
      clearScrollbarDrag();
      clearCommandBiasDrag();
    }

    function setMouseFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      input.mouse.x = event.clientX - rect.left;
      input.mouse.y = event.clientY - rect.top;
    }

    return {
      attach,
      setMouseFromEvent,
    };
  };
})();
