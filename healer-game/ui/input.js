(() => {
  "use strict";

  window.createHealerInputSystem = function createHealerInputSystem(context) {
    const {
      canvas,
      input,
      game,
      town,
      party,
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
      handleProfileSetupKey,
      handleProfileSetupClick,
      interactTown,
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
      triggerUltimate,
      useItemSlot,
      cancelItemAim,
      confirmItemAim,
      handleStatusUiClick,
      hasCommandBiasDrag,
      clearCommandBiasDrag,
      updateCommandBiasDrag,
      normalizeEquipment,
      equipItem,
      unequipSlot,
      canEquipItem,
      resolveEquipmentItem,
      getDefaultLoadout,
      normalizeLoadout,
      setUnitLoadout,
      getActiveSlotLimit,
    } = context;

    function attach() {
      window.addEventListener("resize", resize);
      resize();
      startTown();
      startGameLoop();

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
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
      : ["q", "e", "r", "f", "g"];
    const itemSlotKeys = Array.isArray(ITEM_SLOT_KEYS) && ITEM_SLOT_KEYS.length
      ? ITEM_SLOT_KEYS.map((key) => String(key).toLowerCase())
      : ["c", "v", "b"];
    const keybindTools = KEYBINDS || window.HEALER_KEYBINDS || null;
    const movementKeys = ["w", "a", "s", "d"];
    const movementActions = [
      { id: "common.moveUp", logicalKey: "w" },
      { id: "common.moveDown", logicalKey: "s" },
      { id: "common.moveLeft", logicalKey: "a" },
      { id: "common.moveRight", logicalKey: "d" },
    ];
    const playerSkillActionIds = ["battle.skill1", "battle.skill2", "battle.skill3", "battle.skill4", "battle.skill5"];
    const itemActionIds = ["battle.item1", "battle.item2", "battle.item3"];
    const ultimateActionByUnitId = {
      ulpes: "battle.ultimate.ulpes",
      rihas: "battle.ultimate.rihas",
      sushia: "battle.ultimate.sushia",
      finald: "battle.ultimate.finald",
    };
    const equipmentUnitOrder = ["finald", "ulpes", "rihas", "sushia"];
    const presetNameMaxLength = 16;

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
      const equipment = game.systemMenu.equipment;
      if (!equipmentUnitOrder.includes(equipment.selectedUnitId)) {
        equipment.selectedUnitId = "finald";
      }
      if (typeof equipment.presetName !== "string" || !equipment.presetName.trim()) {
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
      if (keybindTools) {
        game.settings.keybinds = keybindTools.normalizeKeybinds(
          game.settings.keybinds || keybindTools.loadSavedKeybinds()
        );
      }
      return game.settings;
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
      if (isEquipmentPresetNameFocused() || (keybindTools && getSettingsUi().controlsCapture)) {
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
      return Boolean(ui.preset && ui.preset.nameFocused);
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
      getEquipmentStore()[unit.id] = copyEquipment(unit.equipment);
      getLoadoutStore()[unit.id] = copyLoadout(unit.loadout);
      const live = getLivePartyUnit(unit.id);
      if (live && live !== unit) {
        live.equipment = copyEquipment(unit.equipment);
        live.loadout = copyLoadout(unit.loadout);
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
        return true;
      }
      if (ui.picker || ui.preset) {
        ui.picker = null;
        ui.preset = null;
        return true;
      }
      return false;
    }

    function clampPresetName(value) {
      const trimmed = Array.from(String(value || "").trim()).slice(0, presetNameMaxLength).join("");
      return trimmed || "プリセット1";
    }

    function handleEquipmentPresetTextKey(event, key) {
      if (!isEquipmentPresetNameFocused()) {
        return false;
      }
      const ui = getEquipmentUi();
      if (key === "escape") {
        return false;
      }
      if (key === "enter") {
        saveEquipmentPreset();
        return true;
      }
      if (key === "backspace") {
        const chars = Array.from(ui.presetName || "");
        chars.pop();
        ui.presetName = chars.join("");
        return true;
      }
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
        return false;
      }
      const next = Array.from(`${ui.presetName || ""}${event.key}`).slice(0, presetNameMaxLength).join("");
      ui.presetName = next;
      return true;
    }

    function equipSelectedItem(itemId) {
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
      const currentItemId = unit.equipment && unit.equipment[item.slot] || null;
      if (currentItemId === item.id) {
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
        return "アルジュナ";
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
      const unit = getSelectedEquipmentUnit();
      if (!unit) {
        return;
      }
      commitEquipmentUnit(unit);
      const ui = getEquipmentUi();
      const name = clampPresetName(ui.presetName);
      ui.presetName = name;
      const presets = getPresetStore(unit.id);
      const editIndex = ui.preset && Number.isFinite(ui.preset.editIndex) ? Math.floor(ui.preset.editIndex) : -1;
      if (editIndex >= 0 && presets[editIndex]) {
        const duplicate = presets.findIndex((preset, index) => index !== editIndex && preset && preset.name === name);
        if (duplicate >= 0) {
          setEquipmentMessage("同じ名前のプリセットがあります。");
          return;
        }
        presets[editIndex] = { ...presets[editIndex], name };
        ui.preset = { open: true, nameFocused: false, editIndex: null };
        setEquipmentMessage(`${name}に名前を変更しました。`);
        return;
      }
      const snapshot = {
        name,
        equipment: copyEquipment(unit.equipment),
        loadout: copyLoadout(unit.loadout),
      };
      const index = presets.findIndex((preset) => preset && preset.name === name);
      if (index >= 0) {
        presets[index] = snapshot;
      } else {
        presets.push(snapshot);
      }
      ui.preset = { open: true, nameFocused: false };
      setEquipmentMessage(`${name}を保存しました。`);
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
      ui.preset = { open: true, nameFocused: true, editIndex };
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
          ui.preset = { open: true, nameFocused: false, editIndex: null };
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
      menu.panelScroll = 0;
      menu.panelScrollMax = 0;
      menu.equipment.picker = null;
      menu.equipment.preset = null;
      menu.equipment.confirm = null;
      menu.settings.controlsCapture = null;
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
      menu.panelScroll = 0;
      menu.panelScrollMax = 0;
      menu.equipment.picker = null;
      menu.equipment.preset = null;
      menu.equipment.confirm = null;
      menu.settings.controlsCapture = null;
      clearMovementKeys();
    }

    function closeSystemConfirm() {
      const menu = getSystemMenu();
      menu.confirm = null;
      menu.open = false;
      clearMovementKeys();
    }

    function activateMenuBack() {
      const menu = getSystemMenu();
      if (menu.confirm) {
        closeSystemConfirm();
        return true;
      }
      if (menu.panel) {
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
        event.preventDefault();
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

    function handleSystemMenuClick(button) {
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
        if (target.action === "toggleSystemMenu") {
          toggleSystemMenu();
        } else if (target.action === "openSystemPanel") {
          if (target.panelType === "equipment") {
            openEquipmentPanelFromTarget(target);
          } else if (target.panelType === "settings") {
            openSettingsPanelFromTarget(target);
          } else {
            menu.open = false;
            menu.confirm = null;
            menu.panel = { type: target.panelType || null, title: target.title, lines: target.lines || [] };
            menu.panelScroll = 0;
            menu.panelScrollMax = 0;
            clearMovementKeys();
          }
        } else if (target.action === "openSystemConfirm") {
          menu.open = false;
          menu.panel = null;
          menu.confirm = { title: target.title, lines: target.lines || [] };
          clearMovementKeys();
        } else if (target.action === "closeSystemPanel") {
          closeSystemPanel();
        } else if (target.action === "closeSystemConfirm") {
          closeSystemConfirm();
        } else if (target.action === "confirmOnly") {
          closeSystemConfirm();
        } else if (target.action === "selectEquipmentUnit") {
          const ui = getEquipmentUi();
          if (equipmentUnitOrder.includes(target.unitId)) {
            ui.selectedUnitId = target.unitId;
            ui.picker = null;
            ui.preset = null;
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
          ui.confirm = null;
        } else if (target.action === "closeEquipmentPicker") {
          getEquipmentUi().picker = null;
          getEquipmentUi().confirm = null;
        } else if (target.action === "equipEquipmentItem") {
          equipSelectedItem(target.itemId);
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
          ui.preset = { open: true, nameFocused: false };
          ui.picker = null;
          ui.confirm = null;
        } else if (target.action === "closeEquipmentPreset") {
          getEquipmentUi().preset = null;
        } else if (target.action === "focusEquipmentPresetName") {
          const ui = getEquipmentUi();
          ui.preset = { open: true, nameFocused: true };
        } else if (target.action === "saveEquipmentPreset") {
          saveEquipmentPreset();
        } else if (target.action === "loadEquipmentPreset") {
          loadEquipmentPreset(target.index);
        } else if (target.action === "editEquipmentPresetName") {
          editEquipmentPresetName(target.index);
        } else if (target.action === "deleteEquipmentPreset") {
          deleteEquipmentPreset(target.index);
        } else if (target.action === "confirmEquipmentSkillTransfer") {
          confirmEquipmentSkillTransfer();
        } else if (target.action === "closeEquipmentConfirm") {
          closeEquipmentConfirm();
        } else if (target.action === "closeEquipmentSubwindow") {
          closeEquipmentSubwindow();
        } else if (target.action === "toggleDetailedDescriptions") {
          const settings = getGameSettings();
          settings.tooltipDescriptionMode = settings.tooltipDescriptionMode === "detail" ? "simple" : "detail";
          clearMovementKeys();
        } else if (target.action === "selectSettingsTab") {
          selectSettingsTab(target.tab);
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
      if (handleSystemMenuKey(event, key)) {
        return;
      }
      if (isSystemMenuOpen()) {
        return;
      }
      const movementAction = getMovementActionFromEvent(event);
      if ((game.state === "playing" || game.state === "town") && movementAction) {
        setLogicalMovementKey(movementAction.logicalKey, true);
        if (game.state === "playing") return;
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
        if (key === "r") {
          startTown();
        }
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

    function handleKeyUp(event) {
      const movementAction = getMovementActionFromEvent(event);
      if (!movementAction) {
        return;
      }
      setLogicalMovementKey(movementAction.logicalKey, false);
      if (game.state === "playing" || game.state === "town") {
        event.preventDefault();
      }
    }

    function usePlayerSkillSlot(slotIndex) {
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
        if (skill.targeted) {
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
      if (hasCommandBiasDrag()) {
        updateCommandBiasDrag(input.mouse.x);
      }
    }

    function handleMouseDown(event) {
      event.preventDefault();
      setMouseFromEvent(event);
      if (handleControlCaptureMouse(event)) {
        return;
      }
      if (handleSystemMenuMouse(event)) {
        return;
      }
      if (handleSystemMenuClick(event.button)) {
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

    function handleMouseUp(event) {
      if (event.button === 0) {
        clearCommandBiasDrag();
      }
      if (event.button === 2) {
        input.mouse.right = false;
      }
    }

    function handleWheel(event) {
      setMouseFromEvent(event);
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
