(() => {
  "use strict";

  const STORAGE_KEY = "healer-game:keybinds";

  const ACTIONS = [
    { id: "common.moveUp", group: "field", section: "フィールド", label: "上", defaultBinding: "key:KeyW", logicalKey: "w" },
    { id: "common.moveDown", group: "field", section: "フィールド", label: "下", defaultBinding: "key:KeyS", logicalKey: "s" },
    { id: "common.moveLeft", group: "field", section: "フィールド", label: "左", defaultBinding: "key:KeyA", logicalKey: "a" },
    { id: "common.moveRight", group: "field", section: "フィールド", label: "右", defaultBinding: "key:KeyD", logicalKey: "d" },
    { id: "common.menuBack", group: "common", section: "共通", label: "メニュー開閉/戻る", defaultBinding: "key:Escape" },
    { id: "field.interact", group: "field", section: "フィールド", label: "インタラクト", defaultBinding: "key:KeyE" },
    { id: "battle.confirm", group: "battle", section: "戦闘", label: "発射ボタン", defaultBinding: "mouse:0" },
    { id: "battle.cancelAim", group: "battle", section: "戦闘", label: "構えキャンセル", defaultBinding: "mouse:2" },
    { id: "battle.skillPage", group: "battle", section: "戦闘", label: "アイテム/スキルページ切替", defaultBinding: "key:Space" },
    { id: "battle.skill1", group: "battle", section: "戦闘", label: "スキル1", defaultBinding: "key:KeyQ" },
    { id: "battle.skill2", group: "battle", section: "戦闘", label: "スキル2", defaultBinding: "key:KeyW" },
    { id: "battle.skill3", group: "battle", section: "戦闘", label: "スキル3", defaultBinding: "key:KeyE" },
    { id: "battle.skill4", group: "battle", section: "戦闘", label: "スキル4", defaultBinding: "key:KeyR" },
    { id: "battle.skill5", group: "battle", section: "戦闘", label: "スキル5", defaultBinding: "key:KeyT" },
    { id: "battle.ultimate.ulpes", group: "battle", section: "戦闘", label: "必殺技(ウルペス)", defaultBinding: "key:Digit1" },
    { id: "battle.ultimate.rihas", group: "battle", section: "戦闘", label: "必殺技(リハス)", defaultBinding: "key:Digit2" },
    { id: "battle.ultimate.sushia", group: "battle", section: "戦闘", label: "必殺技(スシア)", defaultBinding: "key:Digit3" },
    { id: "battle.ultimate.finald", group: "battle", section: "戦闘", label: "必殺技(アルジュナ)", defaultBinding: "key:Digit4" },
    { id: "battle.item1", group: "battle", section: "戦闘", label: "アイテム1", defaultBinding: "key:KeyC" },
    { id: "battle.item2", group: "battle", section: "戦闘", label: "アイテム2", defaultBinding: "key:KeyV" },
    { id: "battle.item3", group: "battle", section: "戦闘", label: "アイテム3", defaultBinding: "key:KeyB" },
    { id: "battle.item4", group: "battle", section: "戦闘", label: "アイテム4", defaultBinding: "key:KeyN" },
  ];

  const ACTION_BY_ID = Object.fromEntries(ACTIONS.map((action) => [action.id, action]));
  const SECTION_ORDER = ["common", "field", "battle"];
  const SECTION_LABELS = {
    common: "共通",
    field: "フィールド",
    battle: "戦闘",
  };

  function createDefaultKeybinds() {
    return Object.fromEntries(ACTIONS.map((action) => [action.id, action.defaultBinding]));
  }

  function normalizeKeybinds(bindings) {
    const defaults = createDefaultKeybinds();
    const source = bindings && typeof bindings === "object" ? bindings : {};
    const normalized = {};
    for (const action of ACTIONS) {
      const value = source[action.id];
      normalized[action.id] = isValidBinding(value) && isBindingAllowed(action.id, value) ? value : defaults[action.id];
    }
    return normalized;
  }

  function cloneKeybinds(bindings) {
    return { ...normalizeKeybinds(bindings) };
  }

  function isValidBinding(value) {
    return typeof value === "string" && /^(key|mouse):.+/.test(value);
  }

  function isBindingAllowed(actionId, binding) {
    if (actionId === "common.menuBack" && binding === "mouse:0") {
      return false;
    }
    return isValidBinding(binding);
  }

  function loadSavedKeybinds() {
    try {
      const raw = window.localStorage ? window.localStorage.getItem(STORAGE_KEY) : null;
      return raw ? normalizeKeybinds(JSON.parse(raw)) : null;
    } catch (error) {
      return null;
    }
  }

  function saveKeybinds(bindings) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeKeybinds(bindings)));
      }
    } catch (error) {
      // localStorage can be unavailable in some browser privacy modes.
    }
  }

  function getSettingsKeybinds(settings) {
    if (!settings || typeof settings !== "object") {
      return createDefaultKeybinds();
    }
    settings.keybinds = normalizeKeybinds(settings.keybinds || loadSavedKeybinds());
    return settings.keybinds;
  }

  function getActionDefinitions() {
    return ACTIONS.slice();
  }

  function getAction(actionId) {
    return ACTION_BY_ID[actionId] || null;
  }

  function getSectionOrder() {
    return SECTION_ORDER.slice();
  }

  function getSectionLabel(group) {
    return SECTION_LABELS[group] || group;
  }

  function keyboardEventToBinding(event) {
    const code = event && event.code ? event.code : "";
    if (code) {
      return `key:${code}`;
    }
    const key = normalizeFallbackKey(event && event.key);
    return key ? `key:${key}` : null;
  }

  function mouseEventToBinding(event) {
    if (!event || !Number.isFinite(event.button)) {
      return null;
    }
    return `mouse:${event.button}`;
  }

  function eventMatchesBinding(event, binding) {
    if (!isValidBinding(binding)) {
      return false;
    }
    if (binding.startsWith("key:")) {
      return keyboardEventToBinding(event) === binding;
    }
    if (binding.startsWith("mouse:")) {
      return mouseEventToBinding(event) === binding;
    }
    return false;
  }

  function eventMatchesAction(settings, actionId, event) {
    const bindings = getSettingsKeybinds(settings);
    return eventMatchesBinding(event, bindings[actionId]);
  }

  function bindingLabel(binding) {
    if (!isValidBinding(binding)) {
      return "-";
    }
    if (binding.startsWith("mouse:")) {
      const button = Number(binding.slice(6));
      if (button === 0) return "左クリック";
      if (button === 1) return "中クリック";
      if (button === 2) return "右クリック";
      if (button === 3) return "Mouse4";
      if (button === 4) return "Mouse5";
      return `Mouse${button + 1}`;
    }
    const code = binding.slice(4);
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^Numpad[0-9]$/.test(code)) return `Num${code.slice(6)}`;
    const labels = {
      Space: "Space",
      Escape: "Esc",
      Enter: "Enter",
      Tab: "Tab",
      Backspace: "Backspace",
      Delete: "Delete",
      ArrowUp: "↑",
      ArrowDown: "↓",
      ArrowLeft: "←",
      ArrowRight: "→",
      ShiftLeft: "左Shift",
      ShiftRight: "右Shift",
      ControlLeft: "左Ctrl",
      ControlRight: "右Ctrl",
      AltLeft: "左Alt",
      AltRight: "右Alt",
      MetaLeft: "左Meta",
      MetaRight: "右Meta",
    };
    return labels[code] || code.replace(/^Key/, "").replace(/^Digit/, "");
  }

  function getKeybindLabel(settings, actionId) {
    const bindings = getSettingsKeybinds(settings);
    return bindingLabel(bindings[actionId]);
  }

  function normalizeFallbackKey(key) {
    if (!key) {
      return "";
    }
    if (key === " ") {
      return "Space";
    }
    const normalized = String(key);
    if (normalized.length === 1) {
      return normalized.toUpperCase();
    }
    return normalized;
  }

  function canConflict(a, b) {
    if (!a || !b || a.id === b.id) {
      return false;
    }
    return a.group === "common" || b.group === "common" || a.group === b.group;
  }

  function getConflicts(bindings) {
    const normalized = normalizeKeybinds(bindings);
    const conflicts = {};
    for (const action of ACTIONS) {
      conflicts[action.id] = [];
    }
    for (let i = 0; i < ACTIONS.length; i += 1) {
      const a = ACTIONS[i];
      const aBinding = normalized[a.id];
      for (let j = i + 1; j < ACTIONS.length; j += 1) {
        const b = ACTIONS[j];
        const bBinding = normalized[b.id];
        if (aBinding && aBinding === bBinding && canConflict(a, b)) {
          conflicts[a.id].push(b.id);
          conflicts[b.id].push(a.id);
        }
      }
    }
    return conflicts;
  }

  function hasConflicts(bindings) {
    const conflicts = getConflicts(bindings);
    return Object.values(conflicts).some((entries) => entries.length > 0);
  }

  window.HEALER_KEYBINDS = {
    createDefaultKeybinds,
    normalizeKeybinds,
    cloneKeybinds,
    loadSavedKeybinds,
    saveKeybinds,
    getSettingsKeybinds,
    getActionDefinitions,
    getAction,
    getSectionOrder,
    getSectionLabel,
    keyboardEventToBinding,
    mouseEventToBinding,
    eventMatchesBinding,
    eventMatchesAction,
    isBindingAllowed,
    bindingLabel,
    getKeybindLabel,
    getConflicts,
    hasConflicts,
  };
})();
