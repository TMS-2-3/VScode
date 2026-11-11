(function initDungeonEditorSettings(root, factory) {
  "use strict";

  const tiles = typeof module === "object" && module.exports ? require("./dungeonTiles.js") : root.HEALER_DUNGEON_TILES;
  const countLimits = typeof module === "object" && module.exports ? require("./dungeonTreasureLimits.js") : root.HEALER_DUNGEON_TREASURE_LIMITS;
  const weights = typeof module === "object" && module.exports ? require("./dungeonWeights.js") : root.HEALER_DUNGEON_WEIGHTS;
  const api = factory(tiles, countLimits, weights);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HEALER_DUNGEON_EDITOR_SETTINGS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createSettingsModule(tiles, countLimits, weights) {
  "use strict";

  const ITEM_PRESETS = [
    { type: "item", id: "wound_medicine", name: "傷薬" },
    { type: "item", id: "magic_herb", name: "魔力草" },
    { type: "item", id: "relax_herb", name: "リラックス草" },
    { type: "item", id: "angry_herb", name: "アングリ草" },
    { type: "item", id: "d_power_flag", name: "力の結晶(D)" },
  ];

  const COUNT_KINDS = {
    treasure: { prefix: "treasure", field: "treasureLimits", label: "宝箱", rows: "[data-treasure-row]" },
    enemies: { prefix: "enemy", field: "enemyLimits", label: "魔物", rows: "[data-enemy-row]", pool: "enemyPool" },
    traps: { prefix: "trap", field: "trapLimits", label: "罠", rows: "[data-trap-row]", pool: "trapPool" },
  };

  function create(options = {}) {
    const tileDefinitions = options.tileDefinitions || {};
    const enemyDefinitions = options.enemyDefinitions || {};
    const trapDefinitions = options.trapDefinitions || {};
    const materialData = options.materialData || {};
    const onApply = typeof options.onApply === "function" ? options.onApply : () => {};
    const defaults = createDefaults(tileDefinitions, enemyDefinitions);
    let state = clone(defaults);
    let draft = null;
    let activeKind = "";
    let activeTileGroup = "path";
    let selectedTileLayer = 0;
    let tileQuery = "";

    const host = document.createElement("div");
    host.innerHTML = createDialogMarkup();
    document.body.appendChild(host);
    const dialog = host.querySelector("dialog");
    const title = host.querySelector("[data-dialog-title]");
    const body = host.querySelector("[data-dialog-body]");
    const applyButton = host.querySelector("[data-action='apply']");
    const resetButton = host.querySelector("[data-action='reset']");
    const closeButtons = host.querySelectorAll("[data-action='close']");

    bindTrigger(options.tileButton, "tiles");
    bindTrigger(options.treasureButton, "treasure");
    bindTrigger(options.enemyButton, "enemies");
    bindTrigger(options.trapButton, "traps");
    applyButton.addEventListener("click", applyDraft);
    resetButton.addEventListener("click", resetDraft);
    closeButtons.forEach((button) => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    body.addEventListener("input", handleBodyInput);
    body.addEventListener("change", (event) => {
      if (!event.target.matches("[data-weight]")) return;
      if (Number.isFinite(event.target.valueAsNumber)) event.target.value = String(Math.floor(event.target.valueAsNumber));
      if (COUNT_KINDS[activeKind]) updateWeightedApplyAvailability();
    });
    body.addEventListener("click", handleBodyClick);
    updateSummaries();

    return Object.freeze({
      getConfig() {
        return clone(state);
      },
      setConfig(config) {
        state = {
          tiles: tiles.normalize(config.tiles || defaults.tiles),
          treasureLimits: countLimits.normalize(config.treasureLimits),
          treasureTable: clone(config.treasureTable || defaults.treasureTable),
          enemyPool: clone(config.enemyPool || defaults.enemyPool),
          enemyLimits: countLimits.normalize(config.enemyLimits, "魔物"),
          trapPool: clone(config.trapPool || defaults.trapPool),
          trapLimits: countLimits.normalize(config.trapLimits, "罠"),
        };
        draft = null;
        if (dialog.open) dialog.close();
        updateSummaries();
      },
      getTileDefinition(tileId) {
        return tileDefinitions[tileId] || null;
      },
      getEnemyDefinition(enemyId) {
        return enemyDefinitions[enemyId] || null;
      },
      getTrapDefinition(trapId) {
        return trapDefinitions[trapId] || null;
      },
      open(kind) {
        openDialog(kind);
      },
    });

    function bindTrigger(button, kind) {
      if (!button) return;
      button.addEventListener("click", () => openDialog(kind));
    }

    function openDialog(kind) {
      activeKind = kind;
      draft = clone(state);
      selectedTileLayer = 0;
      render();
      dialog.showModal();
    }

    function render() {
      if (activeKind === "tiles") {
        title.textContent = "タイル設定";
        body.innerHTML = renderTileSettings(tileDefinitions, draft.tiles, activeTileGroup, selectedTileLayer, tileQuery);
        updateTileApplyAvailability();
      } else if (activeKind === "treasure") {
        title.textContent = "宝箱設定";
        body.innerHTML = renderTreasureSettings(createTreasureCatalog(materialData, draft.treasureTable.entries), draft.treasureTable, draft.treasureLimits);
        updateWeightedApplyAvailability();
      } else {
        const info = COUNT_KINDS[activeKind];
        title.textContent = `${info.label}設定`;
        body.innerHTML = renderPoolSettings(activeKind, activeKind === "enemies" ? enemyDefinitions : trapDefinitions, draft[info.pool], draft[info.field]);
        updateWeightedApplyAvailability();
      }
    }

    function handleBodyInput(event) {
      if (event.target.matches("[data-weight], [data-enabled]")) {
        if (COUNT_KINDS[activeKind]) updateWeightedApplyAvailability();
        return;
      }
      const info = COUNT_KINDS[activeKind];
      if (info && event.target.matches(`[data-${info.prefix}-limit-min], [data-${info.prefix}-limit-max], [data-${info.prefix}-limit-none]`)) {
        const maximum = body.querySelector(`[data-${info.prefix}-limit-max]`);
        maximum.disabled = body.querySelector(`[data-${info.prefix}-limit-none]`).checked;
        if (event.target.matches(`[data-${info.prefix}-limit-none]`) && !maximum.disabled && maximum.value === "") {
          const minimum = body.querySelector(`[data-${info.prefix}-limit-min]`).valueAsNumber;
          maximum.value = String(Number.isSafeInteger(minimum) && minimum >= 0 ? minimum : 0);
        }
        readCountLimitsDraft();
        updateWeightedApplyAvailability();
        return;
      }
      if (activeKind === "tiles" && event.target.matches("[data-wall-height]")) {
        draft.tiles.wallHeight = event.target.value === "" ? NaN : Number(event.target.value);
        updateTileApplyAvailability();
        return;
      }
      if (event.target.matches("[data-filter]")) {
        const query = event.target.value.trim().toLowerCase();
        if (activeKind === "tiles") tileQuery = query;
        body.querySelectorAll("[data-search-text]").forEach((row) => {
          row.hidden = query && !row.dataset.searchText.includes(query);
        });
      }
    }

    function updateTileApplyAvailability() {
      applyButton.disabled = !Number.isInteger(draft.tiles.wallHeight) || draft.tiles.wallHeight < 0 || draft.tiles.wallHeight > 500
        || tiles.GROUPS.some(({ id }) => draft.tiles[id].some((tileId) => !tileId));
    }

    function readCountLimitsDraft() {
      const info = COUNT_KINDS[activeKind];
      draft[info.field] = {
        min: body.querySelector(`[data-${info.prefix}-limit-min]`).valueAsNumber,
        max: body.querySelector(`[data-${info.prefix}-limit-none]`).checked ? null : body.querySelector(`[data-${info.prefix}-limit-max]`).valueAsNumber,
      };
    }

    function updateWeightedApplyAvailability() {
      const info = COUNT_KINDS[activeKind];
      let message = "";
      try {
        countLimits.normalize(draft[info.field], info.label);
        validateSelectedWeights(info.rows);
      }
      catch (error) { message = error.message; }
      applyButton.disabled = Boolean(message);
      const errorLabel = body.querySelector(`[data-${info.prefix}-limit-error]`);
      errorLabel.textContent = message;
      errorLabel.hidden = !message;
      return !message;
    }

    function validateSelectedWeights(selector) {
      body.querySelectorAll(selector).forEach((row) => {
        if (row.querySelector("[data-enabled]").checked) weights.normalizeWeight(row.querySelector("[data-weight]").valueAsNumber);
      });
    }

    function handleBodyClick(event) {
      if (activeKind === "tiles") {
        handleTileClick(event);
        return;
      }
      if (activeKind !== "treasure") return;
      const duplicateButton = event.target.closest("[data-duplicate-treasure]");
      if (duplicateButton) {
        const row = duplicateButton.closest("[data-treasure-row]");
        const minCount = positiveInteger(row.querySelector("[data-min]").value, 1);
        const entry = {
          type: row.dataset.type, id: row.dataset.id, name: row.dataset.name,
          weight: Math.floor(row.querySelector("[data-weight]").valueAsNumber),
          minCount, maxCount: Math.max(minCount, positiveInteger(row.querySelector("[data-max]").value, minCount)),
        };
        readTreasureDraft();
        draft.treasureTable.entries.push(entry);
        render();
        return;
      }
      const addButton = event.target.closest("[data-add-treasure]");
      if (!addButton) return;
      const typeInput = body.querySelector("[data-custom-type]");
      const idInput = body.querySelector("[data-custom-id]");
      const nameInput = body.querySelector("[data-custom-name]");
      const id = idInput.value.trim();
      if (!id) {
        idInput.focus();
        return;
      }
      readTreasureDraft();
      const type = typeInput.value.trim() || "item";
      const known = createTreasureCatalog(materialData, draft.treasureTable.entries).find((entry) => entry.type === type && entry.id === id);
      const entry = {
        type,
        id,
        name: nameInput.value.trim() || known?.name || id,
        weight: 1,
        minCount: 1,
        maxCount: 1,
      };
      draft.treasureTable.entries.push(entry);
      render();
    }

    function handleTileClick(event) {
      const groupButton = event.target.closest("[data-tile-group]");
      if (groupButton) {
        activeTileGroup = groupButton.dataset.tileGroup;
        selectedTileLayer = 0;
        render();
        return;
      }
      const stack = draft.tiles[activeTileGroup];
      const layerButton = event.target.closest("[data-select-layer]");
      const actionButton = event.target.closest("[data-layer-action]");
      const tileButton = event.target.closest("[data-pick-tile]");
      if (layerButton) selectedTileLayer = Number(layerButton.dataset.selectLayer);
      else if (tileButton) {
        stack[selectedTileLayer] = tileButton.dataset.pickTile;
      } else if (actionButton) {
        const action = actionButton.dataset.layerAction;
        if (action === "add") {
          stack.push("");
          selectedTileLayer = stack.length - 1;
        } else {
          const index = Number(actionButton.dataset.layerIndex);
          if (action === "remove") {
            stack.splice(index, 1);
            if (index < selectedTileLayer) selectedTileLayer -= 1;
            selectedTileLayer = Math.max(0, Math.min(selectedTileLayer, stack.length - 1));
          } else {
            const next = index + (action === "up" ? -1 : 1);
            if (next < 0 || next >= stack.length) return;
            [stack[index], stack[next]] = [stack[next], stack[index]];
            selectedTileLayer = next;
          }
        }
      } else return;
      render();
    }

    function applyDraft() {
      if (activeKind === "tiles") readTileDraft();
      else {
        const info = COUNT_KINDS[activeKind];
        if (activeKind === "treasure") readTreasureDraft();
        else {
          readCountLimitsDraft();
          readPoolDraft();
        }
        if (!updateWeightedApplyAvailability()) return;
        draft[info.field] = countLimits.normalize(draft[info.field], info.label);
      }
      state = clone(draft);
      updateSummaries();
      dialog.close();
      onApply(clone(state));
    }

    function resetDraft() {
      if (activeKind === "tiles") {
        draft.tiles = clone(defaults.tiles);
        selectedTileLayer = 0;
      }
      else {
        const info = COUNT_KINDS[activeKind];
        draft[info.field] = clone(defaults[info.field]);
        if (activeKind === "treasure") draft.treasureTable = clone(defaults.treasureTable);
        else draft[info.pool] = clone(defaults[info.pool]);
      }
      render();
    }

    function readTileDraft() {
      draft.tiles = tiles.normalize(draft.tiles);
    }

    function readTreasureDraft() {
      readCountLimitsDraft();
      const entries = [];
      body.querySelectorAll("[data-treasure-row]").forEach((row) => {
        const enabled = row.querySelector("[data-enabled]");
        if (!enabled.checked) return;
        entries.push({
          type: row.dataset.type,
          id: row.dataset.id,
          name: row.dataset.name,
          weight: Math.floor(row.querySelector("[data-weight]").valueAsNumber),
          minCount: positiveInteger(row.querySelector("[data-min]").value, 1),
          maxCount: positiveInteger(row.querySelector("[data-max]").value, 1),
        });
      });
      entries.forEach((entry) => { entry.maxCount = Math.max(entry.minCount, entry.maxCount); });
      const minRolls = positiveInteger(body.querySelector("[data-roll-min]").value, 1);
      const maxRolls = positiveInteger(body.querySelector("[data-roll-max]").value, minRolls);
      draft.treasureTable = { rolls: [minRolls, Math.max(minRolls, maxRolls)], entries };
    }

    function readPoolDraft() {
      const info = COUNT_KINDS[activeKind];
      const pool = [];
      body.querySelectorAll(info.rows).forEach((row) => {
        if (!row.querySelector("[data-enabled]").checked) return;
        pool.push({
          id: row.dataset.id,
          name: row.dataset.name,
          weight: Math.floor(row.querySelector("[data-weight]").valueAsNumber),
        });
      });
      draft[info.pool] = pool;
    }

    function updateSummaries() {
      if (options.tileButton) {
        options.tileButton.querySelector("span").textContent = tiles.GROUPS.map(({ id, name }) => `${name}${state.tiles[id].length}層`).join(" / ");
        options.tileButton.title = `壁の高さ${state.tiles.wallHeight}マス / ${options.tileButton.querySelector("span").textContent}`;
      }
      if (options.treasureButton) {
        options.treasureButton.querySelector("span").textContent = `${state.treasureTable.entries.length}候補 / ${state.treasureLimits.min}～${state.treasureLimits.max ?? "なし"}個`;
      }
      if (options.enemyButton) {
        options.enemyButton.querySelector("span").textContent = `${state.enemyPool.length}種類 / ${state.enemyLimits.min}～${state.enemyLimits.max ?? "なし"}体`;
      }
      if (options.trapButton) {
        options.trapButton.querySelector("span").textContent = `${state.trapPool.length}種類 / ${state.trapLimits.min}～${state.trapLimits.max ?? "なし"}個`;
      }
    }
  }

  function createDefaults(tileDefinitions, enemyDefinitions) {
    const floorTileId = tileDefinitions.caveFloor01 ? "caveFloor01" : firstTileId(tileDefinitions, true);
    const wallTileId = tileDefinitions.caveWall01 ? "caveWall01" : firstTileId(tileDefinitions, false);
    const preferredEnemies = ["horn_rabbit", "bud_alraune", "shadow_wolf"]
      .filter((id) => enemyDefinitions[id])
      .map((id) => ({ id, name: displayName(enemyDefinitions[id], id), weight: 1 }));
    return {
      tiles: tiles.normalize({ floorTileId, wallTileId }),
      treasureLimits: countLimits.normalize(),
      treasureTable: {
        rolls: [1, 1],
        entries: [{ type: "item", id: "wound_medicine", name: "傷薬", weight: 1, minCount: 1, maxCount: 1 }],
      },
      enemyPool: preferredEnemies,
      enemyLimits: countLimits.normalize(),
      trapPool: [],
      trapLimits: countLimits.normalize(),
    };
  }

  function firstTileId(definitions, passable) {
    const found = Object.entries(definitions).find(([, definition]) => definition && definition.image && Boolean(definition.passable) === passable);
    return found ? found[0] : null;
  }

  function renderTileSettings(definitions, selected, group, selectedLayer, query) {
    const stack = selected[group];
    const choices = Object.entries(definitions).filter(([, definition]) => definition && typeof definition === "object");
    const previewImages = stack.map((tileId) => {
      const definition = definitions[tileId];
      if (!definition || !definition.image) return "";
      const bounds = tiles.drawingBounds(definition, window.HEALER_TILE_SIZE || 48);
      return `<img src="${escapeHtml(resolveAssetPath(definition.image))}" alt="" style="left:${64 + bounds.x * 64}px;top:${64 + bounds.y * 64}px;width:${bounds.width * 64}px;height:${bounds.height * 64}px">`;
    }).join("");
    return `
      <div class="tile-settings-toolbar"><div class="tile-group-tabs" role="tablist" aria-label="タイルの用途">${tiles.GROUPS.map(({ id, name }) => `<button data-tile-group="${id}" type="button" role="tab" aria-selected="${id === group}">${name}</button>`).join("")}</div>
        <label class="wall-height-field">壁の高さ<input data-wall-height type="number" min="0" max="500" step="1" value="${Number.isFinite(selected.wallHeight) ? selected.wallHeight : ""}"><span>マス</span></label></div>
      <div class="tile-editor-layout">
        <section class="tile-stack-editor"><h3>重ね順（下→上）</h3>
          <div class="tile-composite-preview">${previewImages}</div>
          <div class="tile-stack-list">${stack.map((tileId, index) => tileLayerRow(definitions, tileId, index, selectedLayer, stack.length)).join("") || '<span class="empty">タイルなし</span>'}</div>
          <button data-layer-action="add" class="add-tile-layer" type="button" title="重ねるタイルを追加" aria-label="重ねるタイルを追加">＋</button>
        </section>
        <section class="tile-palette"><div class="dialog-filter"><input data-filter type="search" placeholder="タイル名またはIDで検索" value="${escapeHtml(query)}"></div>
          <div class="tile-choice-grid">${choices.map(([id, definition]) => tileChoice({ id, definition }, stack[selectedLayer], query)).join("")}</div>
        </section>
      </div>`;
  }

  function tileLayerRow(definitions, tileId, index, selectedLayer, count) {
    const definition = definitions[tileId];
    const name = tileId ? displayName(definition, tileId) : "未選択";
    return `<div class="tile-layer-row ${index === selectedLayer ? "selected" : ""}">
      <button data-select-layer="${index}" class="tile-layer-label" type="button" title="${escapeHtml(tileId || name)}"><span>${index + 1}</span><strong>${escapeHtml(name)}</strong></button>
      <button data-layer-action="up" data-layer-index="${index}" type="button" title="下の層へ" aria-label="下の層へ" ${index === 0 ? "disabled" : ""}>↑</button>
      <button data-layer-action="down" data-layer-index="${index}" type="button" title="上の層へ" aria-label="上の層へ" ${index === count - 1 ? "disabled" : ""}>↓</button>
      <button data-layer-action="remove" data-layer-index="${index}" type="button" title="この層を削除" aria-label="この層を削除">×</button>
    </div>`;
  }

  function tileChoice(entry, selectedId, query) {
    const name = displayName(entry.definition, entry.id);
    const searchText = `${name} ${entry.id} ${(entry.definition.tags || []).join(" ")}`.toLowerCase();
    return `<button class="tile-choice" data-pick-tile="${escapeHtml(entry.id)}" data-search-text="${escapeHtml(searchText)}" type="button" aria-pressed="${entry.id === selectedId}" ${query && !searchText.includes(query) ? "hidden" : ""}>
      ${entry.definition.image ? `<img src="${escapeHtml(resolveAssetPath(entry.definition.image))}" alt="" loading="lazy" decoding="async">` : '<span class="tile-no-image">?</span>'}
      <strong>${escapeHtml(name)}</strong><small>${escapeHtml(entry.id)}</small>
    </button>`;
  }

  function renderTreasureSettings(catalog, table, limits) {
    const selected = new Map();
    // Each entry is a separate roll candidate, even when item IDs match.
    table.entries.forEach((entry) => {
      const key = `${entry.type}:${entry.id}`;
      if (!selected.has(key)) selected.set(key, []);
      selected.get(key).push(entry);
    });
    return `
      ${renderCountSettings("treasure", limits)}
      <div class="loot-toolbar">
        <label>1箱の抽選回数 <input data-roll-min type="number" min="1" value="${table.rolls[0]}"> ～ <input data-roll-max type="number" min="1" value="${table.rolls[1]}"></label>
        <input data-filter type="search" placeholder="内容名またはIDで検索">
      </div>
      <div class="custom-entry"><select data-custom-type><option value="item">アイテム</option><option value="material">素材</option><option value="currency">通貨</option><option value="equipment">装備</option></select><input data-custom-id placeholder="ID"><input data-custom-name placeholder="表示名"><button data-add-treasure type="button">追加</button></div>
      <div class="config-table config-table-treasure"><div class="config-head">使用</div><div class="config-head">内容</div><div class="config-head">重み</div><div class="config-head">個数</div><div class="config-head">追加</div>
        ${catalog.map((entry) => (selected.get(`${entry.type}:${entry.id}`) || [null]).map((current) => treasureRow(entry, current)).join("")).join("")}
      </div>`;
  }

  function treasureRow(entry, current) {
    const name = current?.name || entry.name;
    const searchText = `${name} ${entry.id} ${entry.type}`.toLowerCase();
    return `<div class="config-row" data-treasure-row data-type="${escapeHtml(entry.type)}" data-id="${escapeHtml(entry.id)}" data-name="${escapeHtml(name)}" data-search-text="${escapeHtml(searchText)}">
      <input data-enabled type="checkbox" ${current ? "checked" : ""}>
      <span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(entry.type)} / ${escapeHtml(entry.id)}</small></span>
      <input data-weight type="number" min="1" max="${weights.MAX_WEIGHT}" step="1" aria-label="重み" value="${current ? Number.isFinite(current.weight) ? Math.floor(current.weight) : "" : 1}">
      <span class="range-inputs"><input data-min type="number" min="1" value="${current ? current.minCount : 1}"><b>～</b><input data-max type="number" min="1" value="${current ? current.maxCount : 1}"></span>
      <button data-duplicate-treasure class="duplicate-treasure" type="button" title="同じアイテムの抽選候補を追加" aria-label="同じアイテムの抽選候補を追加">＋</button>
    </div>`;
  }

  function renderCountSettings(kind, limits) {
    const { prefix, label } = COUNT_KINDS[kind];
    return `<div class="treasure-count-settings">
      <label>下限${label}数<input data-${prefix}-limit-min type="number" min="0" step="1" value="${Number.isFinite(limits.min) ? limits.min : ""}"></label>
      <label>上限${label}数<input data-${prefix}-limit-max type="number" min="0" step="1" placeholder="なし" value="${Number.isFinite(limits.max) ? limits.max : ""}" ${limits.max === null ? "disabled" : ""}></label>
      <label><input data-${prefix}-limit-none type="checkbox" aria-label="上限${label}数なし" ${limits.max === null ? "checked" : ""}>なし</label>
      <p data-${prefix}-limit-error class="treasure-count-error" role="status" hidden></p>
    </div>`;
  }

  function renderPoolSettings(kind, definitions, pool, limits) {
    const info = COUNT_KINDS[kind];
    const selected = new Map(pool.map((entry) => [entry.id, entry]));
    const catalog = new Map(Object.entries(definitions));
    pool.forEach((entry) => { if (!catalog.has(entry.id)) catalog.set(entry.id, { name: entry.name || entry.id }); });
    const rows = [...catalog].map(([id, definition]) => ({ id, definition }));
    return `${renderCountSettings(kind, limits)}<div class="dialog-filter"><input data-filter type="search" placeholder="${info.label}名またはIDで検索"></div>
      <div class="config-table config-table-enemy"><div class="config-head">使用</div><div class="config-head">${info.label}</div><div class="config-head">重み</div>
      ${rows.length ? rows.map((entry) => poolRow(info.prefix, entry, selected.get(entry.id))).join("") : `<span class="empty">${info.label}データなし</span>`}</div>`;
  }

  function poolRow(prefix, entry, current) {
    const name = displayName(entry.definition, entry.id);
    const image = entry.definition.mapImagePath || entry.definition.imagePath || entry.definition.image || "";
    const searchText = `${name} ${entry.id}`.toLowerCase();
    return `<div class="config-row" data-${prefix}-row data-id="${escapeHtml(entry.id)}" data-name="${escapeHtml(name)}" data-search-text="${escapeHtml(searchText)}">
      <input data-enabled type="checkbox" ${current ? "checked" : ""}>
      <span class="enemy-entry">${image ? `<img src="${escapeHtml(resolveAssetPath(image))}" alt="">` : ""}<span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(entry.id)}</small></span></span>
      <input data-weight type="number" min="1" max="${weights.MAX_WEIGHT}" step="1" aria-label="重み" value="${current ? Number.isFinite(current.weight) ? Math.floor(current.weight) : "" : 1}">
    </div>`;
  }

  function createTreasureCatalog(materialData, selectedEntries) {
    const entries = ITEM_PRESETS.slice();
    const currencies = materialData.currencies || {};
    Object.entries(currencies).forEach(([id, item]) => entries.push({ type: "currency", id, name: item.name || id }));
    const materials = materialData.materials || {};
    Object.entries(materials).forEach(([id, item]) => entries.push({ type: "material", id, name: item.name || id }));
    selectedEntries.forEach((entry) => {
      if (!entries.some((item) => item.type === entry.type && item.id === entry.id)) entries.push(entry);
    });
    return entries;
  }

  function createDialogMarkup() {
    return `<dialog class="editor-dialog"><div class="dialog-panel"><header><h2 data-dialog-title></h2><button class="icon-close" data-action="close" type="button" title="閉じる" aria-label="閉じる">×</button></header><div class="dialog-body" data-dialog-body></div><footer><button data-action="reset" type="button">初期設定に戻す</button><span></span><button data-action="close" type="button">閉じる</button><button data-action="apply" class="primary" type="button">適用</button></footer></div></dialog>`;
  }

  function displayName(definition, fallback) {
    return definition && (definition.name || definition.label) ? definition.name || definition.label : fallback;
  }

  function resolveAssetPath(path) {
    const value = String(path || "").replaceAll("\\", "/");
    if (value.startsWith("map/")) return `./${value.slice(4)}`;
    if (value.startsWith("img/")) return `../${value}`;
    return value;
  }

  function positiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function positiveInteger(value, fallback) {
    return Math.max(1, Math.floor(positiveNumber(value, fallback)));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return Object.freeze({ create });
});
