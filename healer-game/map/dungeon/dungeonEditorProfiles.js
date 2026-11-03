(function initDungeonEditorProfiles(root) {
  "use strict";

  function create(options) {
    const profiles = options.profiles;
    const select = options.select;
    const button = options.button;
    let selectedId = profiles.standard.id;
    let fileHandle = null;
    let writing = false;
    let draftSequence = 0;
    const workingCopies = new Map();
    const defaultRecord = { ...profiles.getRecord(selectedId), config: options.getConfig(), preview: options.getPreview() };
    workingCopies.set(selectedId, { record: clone(defaultRecord), baseline: snapshot(defaultRecord), isNew: false });
    const disabledControls = new Map();
    const host = document.createElement("div");
    host.innerHTML = `<dialog class="editor-dialog profile-dialog" aria-labelledby="profile-dialog-title">
      <div class="dialog-panel">
        <header><h2 id="profile-dialog-title">プロファイル管理</h2><button class="icon-close" data-close type="button" title="閉じる" aria-label="閉じる">×</button></header>
        <div class="dialog-body">
          <p class="profile-current" data-current></p>
          <fieldset class="profile-modes"><legend>保存方法</legend>
            <label><input type="radio" name="profile-save-mode" value="new" checked>新規保存</label>
            <label><input type="radio" name="profile-save-mode" value="overwrite">上書き保存</label>
          </fieldset>
          <label class="profile-field">ID<input data-id type="text" maxlength="80" spellcheck="false" required></label>
          <label class="profile-field">名前<input data-name type="text" maxlength="120" required></label>
          <dl class="profile-summary" data-summary></dl>
          <div class="profile-file-actions"><button data-import type="button">JSON読込</button><button data-export type="button">JSON書出し</button></div>
          <p class="profile-message" data-message role="status" aria-live="polite"></p>
          <input data-import-file type="file" accept=".json,application/json" hidden>
        </div>
        <footer><button data-delete class="danger-button" type="button">削除</button><span></span><button data-close type="button">閉じる</button><button data-save class="primary" type="button">ファイルに保存</button></footer>
      </div>
    </dialog>
    <dialog class="editor-dialog new-profile-dialog" aria-labelledby="new-profile-title">
      <div class="dialog-panel">
        <header><h2 id="new-profile-title">新規プロファイル</h2><button class="icon-close" data-new-close type="button" title="閉じる" aria-label="閉じる">×</button></header>
        <div class="dialog-body">
          <button data-new-empty class="primary" type="button">新しく作る</button>
          <label class="profile-field reference-profile-field">参照元<select data-reference></select></label>
          <button data-new-reference type="button">参照して作る</button>
        </div>
        <footer><span></span><button data-new-close type="button">閉じる</button></footer>
      </div>
    </dialog>`;
    document.body.appendChild(host);
    const dialog = host.querySelector(".profile-dialog");
    const newDialog = host.querySelector(".new-profile-dialog");
    const referenceSelect = host.querySelector("[data-reference]");
    const idInput = host.querySelector("[data-id]");
    const nameInput = host.querySelector("[data-name]");
    const message = host.querySelector("[data-message]");
    const newMode = host.querySelector("[value='new']");
    const overwriteMode = host.querySelector("[value='overwrite']");
    const importFile = host.querySelector("[data-import-file]");
    const deleteButton = host.querySelector("[data-delete]");

    refreshSelect();
    button.addEventListener("click", open);
    options.newButton.addEventListener("click", openNew);
    options.importButton.addEventListener("click", () => importFile.click());
    select.addEventListener("change", () => load(select.value));
    host.querySelectorAll("[data-close]").forEach((entry) => entry.addEventListener("click", close));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener("cancel", (event) => { if (writing) event.preventDefault(); });
    [newMode, overwriteMode].forEach((entry) => entry.addEventListener("change", populateIdentity));
    host.querySelector("[data-save]").addEventListener("click", save);
    deleteButton.addEventListener("click", remove);
    host.querySelector("[data-export]").addEventListener("click", exportJson);
    host.querySelector("[data-import]").addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", importJson);
    host.querySelectorAll("[data-new-close]").forEach((entry) => entry.addEventListener("click", () => newDialog.close()));
    newDialog.addEventListener("click", (event) => { if (event.target === newDialog) newDialog.close(); });
    host.querySelector("[data-new-empty]").addEventListener("click", () => createDraft(defaultRecord));
    host.querySelector("[data-new-reference]").addEventListener("click", () => createDraft(getWorkingCopy(referenceSelect.value).record));
    window.addEventListener("beforeunload", (event) => {
      if (!hasChanges() && !writing) return;
      event.preventDefault();
      event.returnValue = "";
    });

    return Object.freeze({ hasChanges });

    function snapshot(record) {
      return JSON.stringify(record);
    }

    function rememberCurrent() {
      const current = workingCopies.get(selectedId);
      if (!current) return;
      current.record = { ...current.record, config: options.getConfig(), preview: options.getPreview() };
    }

    function isDirty(state) {
      return state.isNew || (state.baseline !== null && snapshot(state.record) !== state.baseline);
    }

    function hasChanges() {
      rememberCurrent();
      return [...workingCopies.values()].some(isDirty);
    }

    function getWorkingCopy(id) {
      if (!workingCopies.has(id)) {
        const record = id === profiles.standard.id ? clone(defaultRecord) : profiles.getRecord(id);
        workingCopies.set(id, { record, baseline: null, isNew: false });
      }
      return workingCopies.get(id);
    }

    function refreshSelect() {
      select.replaceChildren();
      const savedGroup = document.createElement("optgroup");
      savedGroup.label = "保存済み";
      const draftGroup = document.createElement("optgroup");
      draftGroup.label = "編集中の新規プロファイル";
      const listedIds = new Set();
      profiles.list().forEach((entry) => {
        listedIds.add(entry.id);
        const current = workingCopies.get(entry.id);
        const option = document.createElement("option");
        option.value = entry.id;
        const name = entry.builtIn ? "標準プロファイル" : entry.name;
        option.textContent = current && isDirty(current) ? `編集中: ${name}` : name;
        option.title = entry.id;
        savedGroup.appendChild(option);
      });
      workingCopies.forEach((state, key) => {
        if (listedIds.has(key)) return;
        const option = document.createElement("option");
        option.value = key;
        option.textContent = `編集中: ${state.record.name}`;
        option.title = state.record.id;
        draftGroup.appendChild(option);
      });
      select.appendChild(savedGroup);
      if (draftGroup.children.length) select.appendChild(draftGroup);
      select.value = selectedId;
    }

    function load(id) {
      rememberCurrent();
      activate(id);
    }

    function activate(id) {
      const state = getWorkingCopy(id);
      selectedId = id;
      options.onLoad(clone(state.record));
      rememberCurrent();
      if (state.baseline === null && !state.isNew) state.baseline = snapshot(state.record);
      refreshSelect();
    }

    function nextIdentity() {
      let index = 1;
      const ids = new Set(profiles.list().map((entry) => entry.id));
      const names = new Set(profiles.list().map((entry) => entry.name));
      workingCopies.forEach(({ record }) => { ids.add(record.id); names.add(record.name); });
      while (ids.has(`dungeon_${index}`) || names.has(`新規作成${index}`)) index += 1;
      return { id: `dungeon_${index}`, name: `新規作成${index}` };
    }

    function openNew() {
      rememberCurrent();
      refreshSelect();
      referenceSelect.replaceChildren(...[...select.children].map((entry) => entry.cloneNode(true)));
      referenceSelect.value = selectedId;
      newDialog.showModal();
    }

    function createDraft(source) {
      rememberCurrent();
      const identity = nextIdentity();
      const record = clone(source);
      Object.assign(record, identity);
      Object.assign(record.config, identity);
      addDraft(record);
      newDialog.close();
      options.setStatus(`作成しました: ${record.name}（未保存）`);
    }

    function addDraft(record) {
      const key = `:draft:${++draftSequence}`;
      workingCopies.set(key, { record: clone(record), baseline: null, isNew: true });
      activate(key);
    }

    function open() {
      rememberCurrent();
      const state = getWorkingCopy(selectedId);
      const selected = state.record;
      const canOverwrite = profiles.saved().some((entry) => entry.id === selected.id);
      overwriteMode.disabled = !canOverwrite;
      overwriteMode.checked = canOverwrite;
      newMode.checked = !canOverwrite;
      deleteButton.disabled = selectedId === profiles.standard.id;
      host.querySelector("[data-current]").textContent = `編集中: ${selectedId === profiles.standard.id ? "標準プロファイル" : selected.name}`;
      renderSummary();
      populateIdentity();
      setMessage(state.isNew ? "未保存" : "");
      dialog.showModal();
    }

    function renderSummary() {
      const config = options.getConfig();
      const values = [
        ["規模 / 危険度", `${config.scale} / ${config.danger}`],
        ["壁の高さ", `${config.tiles.wallHeight}マス`],
        ...root.HEALER_DUNGEON_TILES.GROUPS.map(({ id, name }) => [name, config.tiles[id].join(" + ") || "タイルなし"]),
        ["宝箱 / 魔物", `${config.treasureTable.entries.length}種類 / ${config.enemyPool.length}種類`],
        ["保存先", `map/dungeon/${profiles.fileName}`],
      ];
      const summary = host.querySelector("[data-summary]");
      summary.replaceChildren();
      values.forEach(([label, value]) => {
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = label;
        dd.textContent = value;
        summary.append(dt, dd);
      });
    }

    function populateIdentity() {
      const state = getWorkingCopy(selectedId);
      idInput.readOnly = overwriteMode.checked;
      const identity = overwriteMode.checked || state.isNew ? state.record : nextIdentity();
      idInput.value = identity.id;
      nameInput.value = identity.name;
    }

    function readRecord() {
      return profiles.createRecord(options.getConfig(), {
        id: idInput.value.trim(), name: nameInput.value.trim(), preview: options.getPreview(),
      });
    }

    async function save() {
      if (writing) return;
      try {
        const record = readRecord();
        const isNew = newMode.checked;
        const saved = await persist((latest) => {
          const index = latest.findIndex((entry) => entry.id === record.id);
          if (isNew && index >= 0) throw new Error("同じIDのプロファイルがあります。別のIDを指定してください。");
          if (!isNew && index < 0) throw new Error("上書き先が見つかりません。新規保存を選択してください。");
          if (!isNew && !window.confirm(`「${record.name}」を上書きしますか？`)) return null;
          if (index >= 0) latest[index] = record;
          else latest.push(record);
          return latest;
        });
        if (!saved) return;
        rememberCurrent();
        workingCopies.delete(selectedId);
        workingCopies.delete(record.id);
        activate(record.id);
        dialog.close();
        options.setStatus(`保存しました: ${record.name} (${record.id})`);
      } catch (error) {
        report(error);
      }
    }

    async function remove() {
      if (writing || selectedId === profiles.standard.id) return;
      const id = selectedId;
      const state = getWorkingCopy(id);
      const name = state.record.name;
      if (!window.confirm(`「${name}」を削除しますか？未保存の編集内容も破棄されます。`)) return;
      try {
        if (!state.isNew && profiles.saved().some((entry) => entry.id === id)) {
          const saved = await persist((latest) => latest.filter((entry) => entry.id !== id));
          if (!saved) return;
        }
        workingCopies.delete(id);
        activate(profiles.standard.id);
        dialog.close();
        options.setStatus(`削除しました: ${name}`);
      } catch (error) {
        report(error);
      }
    }

    async function persist(update) {
      if (!window.showOpenFilePicker) {
        throw new Error("ファイルへの直接保存はChrome/Edgeで利用できます。この環境ではJSON書出しをご利用ください。");
      }
      setWriting(true);
      try {
        if (!fileHandle) {
          const handles = await window.showOpenFilePicker({
            id: "healer-dungeon-profiles",
            multiple: false,
            types: [{ description: profiles.fileName, accept: { "text/javascript": [".js"] } }],
          });
          const handle = handles[0];
          if (!handle || handle.name !== profiles.fileName) throw new Error(`保存先には${profiles.fileName}を選択してください。`);
          profiles.fromScript(await (await handle.getFile()).text());
          fileHandle = handle;
        }
        // Re-read the file so saving one ID cannot discard profiles added by another editor.
        const previousSource = await (await fileHandle.getFile()).text();
        const latest = profiles.fromScript(previousSource);
        const updated = update(latest);
        if (!updated) {
          setMessage("保存をキャンセルしました。");
          return false;
        }
        const source = profiles.toScript(updated);
        if (await (await fileHandle.getFile()).text() !== previousSource) {
          throw new Error("保存中にファイルが更新されました。もう一度保存してください。");
        }
        const writable = await fileHandle.createWritable();
        try {
          await writable.write(source);
          await writable.close();
        } catch (error) {
          try { await writable.abort(); } catch (_) { /* The stream may already be closed. */ }
          throw error;
        }
        profiles.replaceSaved(updated);
        return true;
      } finally {
        setWriting(false);
      }
    }

    function exportJson() {
      try {
        const record = readRecord();
        const blob = new Blob([profiles.serialize([record]) + "\n"], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${record.id}.dungeon.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setMessage(`JSONを書き出しました: ${record.id}`);
      } catch (error) {
        report(error);
      }
    }

    async function importJson() {
      const file = importFile.files[0];
      importFile.value = "";
      if (!file || writing) return;
      try {
        const imported = profiles.parse(await file.text());
        if (imported.length !== 1) throw new Error("1つのプロファイルを含むJSONファイルを選択してください。");
        const record = imported[0];
        rememberCurrent();
        // Each import gets its own working copy, even when its ID matches another profile.
        addDraft(record);
        if (dialog.open) dialog.close();
        setMessage(`JSON読込: ${record.name}（未保存）`);
        options.setStatus(`読み込みました: ${record.name}（未保存）`);
      } catch (error) {
        report(error);
      }
    }

    function close() {
      if (!writing) dialog.close();
    }

    function setWriting(value) {
      writing = value;
      host.querySelectorAll("button, input").forEach((entry) => {
        if (value) {
          disabledControls.set(entry, entry.disabled);
          entry.disabled = true;
        } else {
          entry.disabled = disabledControls.get(entry) || false;
        }
      });
      if (!value) disabledControls.clear();
      select.disabled = value;
      button.disabled = value;
      options.newButton.disabled = value;
      options.importButton.disabled = value;
      if (value) setMessage("保存中...");
    }

    function setMessage(text, isError = false) {
      message.textContent = text;
      message.classList.toggle("error", isError);
    }

    function report(error) {
      if (error?.name === "AbortError") {
        setMessage("保存をキャンセルしました。");
        return;
      }
      setMessage(error?.message || "処理に失敗しました。", true);
      if (!dialog.open) options.setStatus(error?.message || "処理に失敗しました。", true);
    }

    function clone(value) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  root.HEALER_DUNGEON_EDITOR_PROFILES = Object.freeze({ create });
})(typeof globalThis !== "undefined" ? globalThis : this);
