"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const workspace = path.resolve(__dirname, "../..");
const temp = fs.mkdtempSync(path.join(__dirname, ".profile-browser-test-"));
const errors = [];
let browser;
let socket;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (socket) socket.close();
  if (browser && browser.exitCode === null) {
    browser.kill();
    await new Promise((resolve) => { browser.once("exit", resolve); setTimeout(resolve, 3000); });
  }
  const resolved = path.resolve(temp);
  assert.equal(path.dirname(resolved), __dirname);
  assert.ok(path.basename(resolved).startsWith(".profile-browser-test-"));
  fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
});

async function main() {
  browser = spawn(chromePath, [
    "--headless", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--disable-background-networking", "--remote-debugging-port=0",
    `--user-data-dir=${temp}`, "about:blank",
  ], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
  const endpoint = await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error("Chrome startup timed out")), 15000);
    browser.once("error", reject);
    browser.stderr.on("data", (data) => {
      output += data;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
    browser.once("exit", () => reject(new Error(`Chrome exited: ${output.slice(-1500)}`)));
  });
  const address = new URL(endpoint);
  const targets = await (await fetch(`http://${address.host}/json/list`)).json();
  socket = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const response = JSON.parse(data);
    if (response.method === "Runtime.exceptionThrown") errors.push(response.params.exceptionDetails.text);
    const request = pending.get(response.id);
    if (!request) return;
    pending.delete(response.id);
    if (response.error) request.reject(new Error(JSON.stringify(response.error)));
    else request.resolve(response.result);
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  }
  async function waitFor(expression) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Timed out: ${expression}`);
  }
  const idle = () => waitFor("!document.getElementById('generate-button').disabled && document.getElementById('metrics').children.length > 0");
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: pathToFileURL(path.join(workspace, "map/dungeon-editor.html")).href });
  await waitFor("Boolean(window.HEALER_DUNGEON_EDITOR_PROFILES && document.querySelector('[data-save]'))");
  await idle();
  const legend = await evaluate(`Array.from(document.querySelectorAll('#legend [data-legend-key]')).map(row => ({ key: row.dataset.legendKey, text: row.textContent, shape: row.querySelector('.swatch').className }))`);
  for (const key of ['enemy', 'treasure', 'trap', 'event', 'rest', 'decoration', 'room-normal', 'room-junction', '入口', '出口', '主経路']) assert.ok(legend.some((entry) => entry.key === key), `missing legend marker: ${key}`);
  assert.ok(legend.find((entry) => entry.key === 'trap').shape.includes('triangle'));
  assert.ok(legend.find((entry) => entry.key === 'event').shape.includes('diamond'));
  assert.ok(legend.find((entry) => entry.key === 'room-junction').shape.includes('outline'));
  const metricValue = (label) => evaluate(`(() => { const term = Array.from(document.querySelectorAll('#metrics dt')).find(dt => dt.textContent === ${JSON.stringify(label)}); return term?.nextElementSibling?.textContent; })()`);
  assert.ok((await metricValue('宝箱候補')).includes('確定1'), 'the preview must show one guaranteed chest');
  assert.equal(await metricValue('追加の宝箱率'), '31.1%', 'standard danger 3 uses the interpolated additional rate');
  await evaluate(`HEALER_DUNGEON_PROFILES.replaceSaved([]);
    document.getElementById('profile-select').dispatchEvent(new Event('change'));`);
  await idle();
  const pixelCheck = await evaluate(`(async () => {
    async function image(color, overlay = false) {
      const canvas = document.createElement('canvas');
      canvas.width = 16; canvas.height = 16;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(overlay ? 8 : 0, 0, overlay ? 8 : 16, 16);
      const result = new Image();
      result.src = canvas.toDataURL();
      await result.decode();
      return result;
    }
    const images = { grass: await image('#00ff00'), overlay: await image('#0000ff', true), margin: await image('#ff0000') };
    const canvas = document.createElement('canvas'); canvas.width = 48; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const map = { width: 2, height: 1, cells: [0, 0], tileRegions: ['path', 'path'], config: { tiles: { path: ['grass', 'overlay'], room: [], wall: [], margin: ['margin'] } } };
    HEALER_DUNGEON_TILES.draw(ctx, map, {
      originX: 8, originY: 0, cellSize: 16, width: 48, height: 16,
      getImage: id => images[id], getDefinition: id => id === 'overlay' ? { drawWidth: 96 } : {},
    });
    const pixels = { ground: Array.from(ctx.getImageData(16, 8, 1, 1).data), overlay: Array.from(ctx.getImageData(32, 8, 1, 1).data), margin: Array.from(ctx.getImageData(1, 8, 1, 1).data) };
    const wallImages = { floor: await image('#00ff00'), pathWall: await image('#0000ff'), roomWall: await image('#ff0000'), margin: await image('#000000') };
    const walls = { width: 5, height: 7, cells: Array(35).fill(1), rooms: [{ left: 3, right: 3, top: 4, bottom: 4 }],
      config: { tiles: { path: ['floor'], room: ['floor'], pathWall: ['pathWall'], roomWall: ['roomWall'], margin: ['margin'], wallHeight: 2 } } };
    walls.cells[3 * 5 + 1] = walls.cells[4 * 5 + 3] = 0;
    walls.cells[1 * 5 + 2] = walls.cells[4 * 5 + 2] = walls.cells[1 * 5 + 3] = 0;
    walls.cells[1 * 5 + 4] = walls.cells[3 * 5 + 4] = 0;
    const spacing = HEALER_DUNGEON_WALL_SPACE.reserve(walls, { width: walls.width, height: walls.height, tiles: walls.config.tiles });
    walls.height = spacing.height;
    walls.tileRegions = HEALER_DUNGEON_TILES.classifyCells(walls);
    const wallCanvas = document.createElement('canvas'); wallCanvas.width = 80; wallCanvas.height = walls.height * 16;
    const wallCtx = wallCanvas.getContext('2d');
    HEALER_DUNGEON_TILES.draw(wallCtx, walls, { originX: 0, originY: 0, cellSize: 16, width: 80, height: wallCanvas.height,
      getImage: id => wallImages[id], getDefinition: () => ({}) });
    const cellPixel = (x, y) => Array.from(wallCtx.getImageData(x * 16 + 8, y * 16 + 8, 1, 1).data);
    return { ...pixels, pathWall: cellPixel(1, spacing.rows[3] - 2), roomWall: cellPixel(3, spacing.rows[4] - 2),
      above: cellPixel(1, spacing.rows[3] - 3), below: cellPixel(1, spacing.rows[3] + 1), floor: cellPixel(1, spacing.rows[3]),
      pathCap: cellPixel(2, spacing.rows[4] - 3), roomCap: cellPixel(3, spacing.rows[4] - 3), narrowPathWall: cellPixel(2, spacing.rows[4] - 2),
      upperFloor: cellPixel(2, spacing.rows[1]), singleGap: cellPixel(4, spacing.rows[3] - 2), edgeMargin: cellPixel(2, spacing.rows[1] - 3) };
  })()`);
  assert.deepEqual(pixelCheck.ground, [0, 255, 0, 255]);
  assert.deepEqual(pixelCheck.overlay, [0, 0, 255, 255], "an oversized overlay must not be covered by its neighbor's ground");
  assert.deepEqual(pixelCheck.margin, [255, 0, 0, 255], "margin tiles must fill the viewport outside the map");
  assert.deepEqual(pixelCheck.pathWall, [0, 0, 255, 255]);
  assert.deepEqual(pixelCheck.roomWall, [255, 0, 0, 255]);
  assert.deepEqual(pixelCheck.above, [0, 0, 0, 255], "walls must not exceed their configured height");
  assert.deepEqual(pixelCheck.below, [0, 0, 0, 255], "walls must only extend upward");
  assert.deepEqual(pixelCheck.floor, [0, 255, 0, 255], "wall height must never paint over floors");
  assert.deepEqual(pixelCheck.pathCap, [0, 0, 0, 255], "a path wall must leave margin below a nearby upper floor");
  assert.deepEqual(pixelCheck.roomCap, [0, 0, 0, 255], "a room wall must leave margin below a nearby upper floor");
  assert.deepEqual(pixelCheck.narrowPathWall, [0, 0, 255, 255], "wall height must remain two cells even where the original gap was too narrow");
  assert.deepEqual(pixelCheck.upperFloor, [0, 255, 0, 255], "reserving top margin must preserve the upper floor");
  assert.deepEqual(pixelCheck.singleGap, [0, 0, 255, 255], "an original one-cell gap must expand to fit the full wall height");
  assert.deepEqual(pixelCheck.edgeMargin, [0, 0, 0, 255], "the top map edge must leave room for the wall cap");

  const configureTileDraft = `document.getElementById('tile-settings-button').click();
    document.querySelector('[data-wall-height]').value = '3';
    document.querySelector('[data-wall-height]').dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-pick-tile="caveWall01"]').click();
    document.querySelector('[data-tile-group="room"]').click();
    document.querySelector('[data-pick-tile="road"]').click();
    document.querySelector('[data-tile-group="roomWall"]').click();
    document.querySelector('[data-pick-tile="caveWallHorizontal01"]').click();
    document.querySelector('[data-tile-group="pathWall"]').click();
    document.querySelector('[data-pick-tile="grass"]').click();
    document.querySelector('[data-layer-action="add"]').click();`;
  await evaluate(configureTileDraft);
  assert.ok(await evaluate(`Array.from(document.querySelectorAll('[data-pick-tile]')).slice(0, 12).every(button => {
    const bounds = button.getBoundingClientRect();
    const image = button.querySelector('img')?.getBoundingClientRect();
    const label = button.querySelector('small').getBoundingClientRect();
    return bounds.height >= 60 && (!image || image.bottom <= bounds.bottom) && label.bottom <= bounds.bottom;
  })`), "tile thumbnails and labels must fit inside each fixed-height choice");
  assert.equal(await evaluate("document.querySelectorAll('[data-pick-tile]').length"), await evaluate("Object.keys(HEALER_TILE_DEFS).length"), "every tile type must be selectable for walls");
  assert.equal(await evaluate("document.querySelector('[data-action=apply]').disabled"), true, "an unfinished layer cannot be committed");
  await evaluate(`document.querySelector('[data-tile-group="path"]').click();`);
  assert.equal(await evaluate("document.querySelector('[data-action=apply]').disabled"), true, "unfinished layers in other tabs also prevent apply");
  await evaluate(`document.querySelector('[data-action="close"]').click(); document.getElementById('tile-settings-button').click();`);
  assert.equal(await evaluate("document.querySelector('[data-wall-height]').value"), "1", "cancel must not commit wall height changes");
  await evaluate(`document.querySelector('[data-wall-height]').value = '';
    document.querySelector('[data-wall-height]').dispatchEvent(new Event('input', { bubbles: true }));`);
  assert.equal(await evaluate("document.querySelector('[data-action=apply]').disabled"), true, "an empty wall height cannot be committed");
  assert.equal(await evaluate(`document.querySelector('[data-pick-tile="caveFloor01"]').getAttribute('aria-pressed')`), "true");
  await evaluate("document.querySelector('[data-action=close]').click();");
  await evaluate(configureTileDraft);
  await evaluate(`document.querySelector('[data-pick-tile="tree"]').click();
    document.querySelector('[data-layer-action="up"][data-layer-index="1"]').click();`);
  assert.ok(await evaluate(`document.querySelector('[data-select-layer="0"]').title === 'tree'`));
  await evaluate(`document.querySelector('[data-layer-action="down"][data-layer-index="0"]').click();
    document.querySelector('[data-tile-group="margin"]').click();
    document.querySelector('[data-pick-tile="soil"]').click();
    document.querySelector('[data-layer-action="add"]').click();
    document.querySelector('[data-pick-tile="tree"]').click();
    document.querySelector('[data-action="apply"]').click();`);
  await idle();
  const savedSource = fs.readFileSync(path.join(__dirname, "dungeonSavedProfiles.js"), "utf8");
  await evaluate(`window.__disk = HEALER_DUNGEON_PROFILES.toScript([]);
    window.__confirm = true;
    window.confirm = () => window.__confirm;
    window.__failWrite = false;
    window.__cancelPicker = true;
    window.showOpenFilePicker = async () => {
      if (window.__cancelPicker) throw new DOMException('cancelled', 'AbortError');
      return [{
      name: 'dungeonSavedProfiles.js',
      getFile: async () => ({ text: async () => window.__disk }),
      createWritable: async () => {
        let buffer;
        return {
          write: async (value) => { if (window.__failWrite) throw new Error('test write failure'); buffer = value; },
          close: async () => { window.__disk = buffer; },
          abort: async () => {},
        };
      },
    }]; };
    document.getElementById('scale-select').value = '5';
    document.getElementById('danger-select').value = '7';
    document.getElementById('direction-select').value = 'down';
    document.getElementById('exit-direction-select').value = 'right';
    document.getElementById('treasure-settings-button').click();
    document.querySelector('[data-roll-max]').value = '3';
    document.querySelector('[data-treasure-row][data-id="wound_medicine"] [data-max]').value = '4';
    document.querySelector('[data-action="apply"]').click();`);
  await idle();
  for (const [danger, rate] of [[1, '20.0%'], [10, '70.0%'], [7, '53.3%']]) {
    await evaluate(`document.getElementById('danger-select').value = '${danger}'; document.getElementById('danger-select').dispatchEvent(new Event('change')); document.getElementById('generate-button').click();`);
    await idle();
    assert.equal(await metricValue('追加の宝箱率'), rate);
    assert.ok((await metricValue('宝箱候補')).includes('確定1'));
  }
  await evaluate(`document.getElementById('enemy-settings-button').click();
    document.querySelectorAll('[data-enemy-row]').forEach(row => { row.querySelector('[data-enabled]').checked = row.dataset.id === 'shadow_wolf'; });
    document.querySelector('[data-action="apply"]').click();`);
  await idle();
  const enemyLabels = await evaluate(`(() => {
    const ctx = document.getElementById('dungeon-canvas').getContext('2d');
    const fillText = ctx.fillText;
    const arc = ctx.arc;
    const labels = [];
    const circleColors = [];
    ctx.fillText = function(text, x, y, ...args) { labels.push({ text, x, y, width: this.measureText(text).width }); return fillText.call(this, text, x, y, ...args); };
    ctx.arc = function(...args) { circleColors.push(this.fillStyle); return arc.apply(this, args); };
    document.getElementById('placement-toggle').dispatchEvent(new Event('change'));
    ctx.fillText = fillText;
    ctx.arc = arc;
    return { labels, circleColors };
  })()`);
  const wolfLabels = enemyLabels.labels.filter((entry) => entry.text === 'シャドウウルフ');
  assert.ok(wolfLabels.length > 0, 'monster names must be drawn on the preview, not just in the hover text');
  assert.equal(wolfLabels.length, enemyLabels.circleColors.filter((color) => color === '#d65b54').length, 'each visible monster marker must receive its name');
  assert.ok(enemyLabels.circleColors.includes('#d65b54'), 'all monsters use the same marker color');
  assert.ok(!enemyLabels.circleColors.includes('#59617d'), 'species-specific colors must not replace the common monster marker');
  wolfLabels.forEach((label, index) => wolfLabels.slice(index + 1).forEach((other) => {
    assert.ok(label.x + label.width <= other.x || other.x + other.width <= label.x || label.y + 16 <= other.y || other.y + 16 <= label.y, 'neighboring monster names must not overlap');
  }));
  await evaluate(`document.getElementById('profile-settings-button').click();
    document.querySelector('.profile-dialog [data-id]').value = 'browser_test';
    document.querySelector('.profile-dialog [data-name]').value = '森テスト';
    document.querySelector('[data-save]').click();`);
  await waitFor("document.querySelector('[data-message]').textContent.includes('キャンセル')");
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.saved().length"), 0);
  assert.equal(await evaluate("document.querySelector('[data-save]').disabled"), false);
  await evaluate("window.__cancelPicker = false; document.querySelector('[data-save]').click();");
  await waitFor("!document.querySelector('.profile-dialog').open");
  await idle();
  const record = await evaluate("HEALER_DUNGEON_PROFILES.getRecord('browser_test')");
  assert.equal(record.name, "森テスト");
  assert.equal(record.config.scale, 5);
  assert.equal(record.config.danger, 7);
  assert.equal(record.config.width, 60);
  assert.deepEqual(record.config.tiles.path, ["caveWall01"], "wall-category tiles can be used as floors");
  assert.deepEqual(record.config.tiles.room, ["road"]);
  assert.deepEqual(record.config.tiles.wall, ["grass", "tree"], "floor-category tiles can be used under wall overlays");
  assert.deepEqual(record.config.tiles.pathWall, ["grass", "tree"]);
  assert.deepEqual(record.config.tiles.roomWall, ["caveWallHorizontal01"]);
  assert.equal(record.config.tiles.wallHeight, 3);
  assert.deepEqual(record.config.tiles.margin, ["soil", "tree"]);
  assert.deepEqual(record.config.entranceApproach.startDirections, ["down"]);
  assert.deepEqual(record.config.exitApproach.endDirections, ["right"]);
  assert.equal(record.config.treasureTable.rolls[1], 3);
  assert.equal(record.config.treasureTable.entries[0].maxCount, 4);
  assert.deepEqual(record.config.enemyPool.map((entry) => entry.id), ["shadow_wolf"]);
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.fromScript(window.__disk)[0].id"), "browser_test");

  await evaluate(`document.getElementById('profile-settings-button').click();
    document.querySelector('.profile-dialog [data-name]').value = '森テスト改';
    document.querySelector('[data-save]').click();`);
  await waitFor("!document.querySelector('.profile-dialog').open");
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.get('browser_test').name"), "森テスト改");

  await evaluate(`document.getElementById('scale-select').value = '8';
    document.getElementById('seed-input').value = 'working-copy';
    document.getElementById('grid-toggle').checked = true;
    window.__confirmCalls = 0;
    window.confirm = () => { window.__confirmCalls += 1; return window.__confirm; };
    window.__confirm = false;
    document.getElementById('profile-select').value = 'standard_digger';
    document.getElementById('profile-select').dispatchEvent(new Event('change'));`);
  await idle();
  assert.equal(await evaluate("document.getElementById('profile-select').value"), "standard_digger");
  assert.equal(await evaluate("document.getElementById('scale-select').value"), "3");
  assert.equal(await evaluate("window.__confirmCalls"), 0, "switching profiles must not ask to discard changes");
  await evaluate(`document.getElementById('profile-select').value = 'browser_test';
    document.getElementById('profile-select').dispatchEvent(new Event('change'));`);
  await idle();
  assert.equal(await evaluate("document.getElementById('scale-select').value"), "8", "switching back must restore unsaved settings");
  assert.equal(await evaluate("document.getElementById('seed-input').value"), "working-copy");
  assert.equal(await evaluate("document.getElementById('grid-toggle').checked"), true);
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.get('browser_test').scale"), 5, "working copies must not change saved/runtime profiles");
  await evaluate(`window.__confirm = true;
    document.getElementById('scale-select').value = '5';
    document.getElementById('seed-input').value = 'preview';
    document.getElementById('grid-toggle').checked = false;
    document.getElementById('new-profile-button').click();`);
  assert.equal(await evaluate("document.querySelector('.new-profile-dialog').open"), true);
  await evaluate("document.querySelector('[data-new-empty]').click();");
  await idle();
  const firstDraft = await evaluate("document.getElementById('profile-select').value");
  assert.ok(firstDraft.startsWith(":draft:"));
  assert.equal(await evaluate("document.getElementById('scale-select').value"), "3");
  assert.equal(await evaluate("document.getElementById('profile-select').selectedOptions[0].textContent"), "編集中: 新規作成1");
  await evaluate(`document.getElementById('scale-select').value = '6';
    document.getElementById('danger-select').value = '2';
    document.getElementById('profile-select').value = 'browser_test';
    document.getElementById('profile-select').dispatchEvent(new Event('change'));`);
  await idle();
  assert.equal(await evaluate("document.getElementById('scale-select').value"), "5");
  assert.ok(await evaluate(`Array.from(document.getElementById('profile-select').options).some(option => option.value === ${JSON.stringify(firstDraft)})`));
  await evaluate(`document.getElementById('profile-select').value = ${JSON.stringify(firstDraft)};
    document.getElementById('profile-select').dispatchEvent(new Event('change'));`);
  await idle();
  assert.equal(await evaluate("document.getElementById('scale-select').value"), "6");
  assert.equal(await evaluate("document.getElementById('danger-select').value"), "2");
  await evaluate("document.getElementById('new-profile-button').click(); document.querySelector('[data-new-reference]').click();");
  await idle();
  const secondDraft = await evaluate("document.getElementById('profile-select').value");
  assert.notEqual(secondDraft, firstDraft);
  assert.equal(await evaluate("document.getElementById('scale-select').value"), "6");
  assert.equal(await evaluate("document.getElementById('danger-select').value"), "2");
  assert.equal(await evaluate("document.getElementById('profile-select').selectedOptions[0].textContent"), "編集中: 新規作成2");
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.saved().length"), 1, "new working profiles are not saved automatically");
  const diskBeforeDraftDelete = await evaluate("window.__disk");
  await evaluate("document.getElementById('profile-settings-button').click(); document.querySelector('[data-delete]').click();");
  await waitFor("!document.querySelector('.profile-dialog').open");
  await idle();
  assert.equal(await evaluate("window.__disk"), diskBeforeDraftDelete, "deleting an unsaved draft must not change the profile file");
  assert.ok(await evaluate(`Array.from(document.getElementById('profile-select').options).some(option => option.value === ${JSON.stringify(firstDraft)})`));
  await evaluate(`document.getElementById('profile-select').value = 'browser_test';
    document.getElementById('profile-select').dispatchEvent(new Event('change'));`);
  await idle();

  await evaluate(`document.getElementById('profile-settings-button').click();
    document.querySelector('[value="new"]').checked = true;
    document.querySelector('[value="new"]').dispatchEvent(new Event('change'));
    document.querySelector('.profile-dialog [data-id]').value = 'failed_save';
    window.__failWrite = true;
    document.querySelector('[data-save]').click();`);
  await waitFor("document.querySelector('[data-message]').textContent.includes('test write failure')");
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.saved().length"), 1);
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.fromScript(window.__disk).length"), 1);
  await evaluate(`window.__failWrite = false;
    document.querySelector('.profile-dialog [data-id]').value = 'second_profile';
    document.querySelector('[data-save]').click();`);
  await waitFor("!document.querySelector('.profile-dialog').open");
  await idle();
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.saved().length"), 2);
  await evaluate(`document.getElementById('profile-settings-button').click();
    window.__confirm = false; document.querySelector('[data-delete]').click();`);
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.saved().length"), 2);
  await evaluate("window.__confirm = true; document.querySelector('[data-delete]').click();");
  await waitFor("!document.querySelector('.profile-dialog').open");
  await idle();
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.saved().length"), 1);

  await evaluate(`const imported = HEALER_DUNGEON_PROFILES.getRecord('browser_test');
    imported.id = imported.config.id = 'imported_forest';
    imported.name = imported.config.name = '読み込んだ森';
    const input = document.querySelector('[data-import-file]');
    input.click = () => { window.__importOpened = true; };
    document.getElementById('import-profile-button').click();
    Object.defineProperty(input, 'files', { configurable: true, value: [new File([HEALER_DUNGEON_PROFILES.serialize([imported])], 'test.json')] });
    input.dispatchEvent(new Event('change'));`);
  await waitFor("document.querySelector('[data-message]').textContent.includes('未保存')");
  assert.equal(await evaluate("window.__importOpened"), true, "JSON import must be available directly on the toolbar");
  assert.equal(await evaluate("document.querySelector('.profile-dialog').open"), false);
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.saved().length"), 1, "import must not commit automatically");
  const importedDraft = await evaluate("document.getElementById('profile-select').value");
  await evaluate(`document.getElementById('profile-select').value = ${JSON.stringify(firstDraft)};
    document.getElementById('profile-select').dispatchEvent(new Event('change'));`);
  await idle();
  assert.equal(await evaluate("document.getElementById('scale-select').value"), "6");
  await evaluate(`document.getElementById('profile-select').value = ${JSON.stringify(importedDraft)};
    document.getElementById('profile-select').dispatchEvent(new Event('change'));`);
  await idle();
  await evaluate("document.getElementById('profile-settings-button').click();");
  assert.equal(await evaluate("document.querySelector('.profile-dialog [data-id]').value"), "imported_forest");
  await evaluate("document.querySelector('[data-save]').click();");
  await waitFor("!document.querySelector('.profile-dialog').open");
  await idle();
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.get('imported_forest').name"), "読み込んだ森");
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.saved().length"), 2);

  await evaluate(`document.getElementById('profile-settings-button').click();
    window.__confirm = false; document.querySelector('[data-save]').click();`);
  await waitFor("document.querySelector('[data-message]').textContent.includes('キャンセル')");
  assert.equal(await evaluate("document.querySelector('[data-save]').disabled"), false);
  await evaluate(`window.__confirm = true;
    const external = HEALER_DUNGEON_PROFILES.getRecord('browser_test');
    external.id = external.config.id = 'external_profile';
    window.__disk = HEALER_DUNGEON_PROFILES.toScript([...HEALER_DUNGEON_PROFILES.fromScript(window.__disk), external]);
    document.querySelector('[data-save]').click();`);
  await waitFor("!document.querySelector('.profile-dialog').open");
  await idle();
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.get('external_profile').id"), "external_profile");
  assert.equal(await evaluate("HEALER_DUNGEON_PROFILES.saved().length"), 3, "save must retain externally added profiles");
  assert.equal(await evaluate(`(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  })()`), true, "unsaved changes in an inactive profile must still trigger the unload warning");

  await evaluate("document.getElementById('profile-settings-button').click();");
  const dimensions = await evaluate(`(() => {
    const d = document.querySelector('.profile-dialog').getBoundingClientRect();
    return { x: d.x, y: d.y, width: d.width, height: d.height, viewportWidth: innerWidth, viewportHeight: innerHeight };
  })()`);
  assert.ok(dimensions.x >= 0 && dimensions.y >= 0);
  assert.ok(dimensions.x + dimensions.width <= dimensions.viewportWidth);
  assert.ok(dimensions.y + dimensions.height <= dimensions.viewportHeight);
  await send("Emulation.setDeviceMetricsOverride", { width: 900, height: 700, deviceScaleFactor: 1, mobile: false });
  assert.ok(await evaluate(`(() => {
    const dialog = document.querySelector('.profile-dialog').getBoundingClientRect();
    const save = document.querySelector('[data-save]').getBoundingClientRect();
    return dialog.x >= 0 && dialog.y >= 0 && dialog.right <= innerWidth && dialog.bottom <= innerHeight
      && save.bottom <= dialog.bottom && save.top >= dialog.top;
  })()`), "profile dialog/footer must fit a smaller desktop viewport");
  await evaluate("document.querySelector('.profile-dialog [data-close]').click(); document.getElementById('profile-select').focus();");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Home", code: "Home", windowsVirtualKeyCode: 36 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Home", code: "Home", windowsVirtualKeyCode: 36 });
  await idle();
  assert.equal(await evaluate("document.getElementById('profile-select').value"), "standard_digger");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "End", code: "End", windowsVirtualKeyCode: 35 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "End", code: "End", windowsVirtualKeyCode: 35 });
  await idle();
  assert.equal(await evaluate("document.getElementById('profile-select').value"), firstDraft);
  assert.equal(await evaluate("document.getElementById('scale-select').value"), "6");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const screenshotFile = process.argv[2] || process.env.DUNGEON_SCREENSHOT;
  if (screenshotFile) {
    if (["rooms", "placements"].includes(process.argv[3])) {
      await evaluate(`document.getElementById('path-toggle').checked = false;
        document.getElementById('placement-toggle').checked = ${process.argv[3] === "placements"};
        document.getElementById('room-toggle').checked = true;
        document.getElementById('room-toggle').dispatchEvent(new Event('change'));`);
    } else {
      await evaluate(`document.getElementById('profile-select').value = 'browser_test';
        document.getElementById('profile-select').dispatchEvent(new Event('change'));
        document.getElementById('tile-settings-button').click();
        document.querySelector('[data-tile-group="pathWall"]').click();`);
    }
    await idle();
    const clip = ["rooms", "placements"].includes(process.argv[3]) ? await evaluate(`(() => {
      const rect = document.getElementById('dungeon-canvas').getBoundingClientRect();
      return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height, scale: 1 };
    })()`) : undefined;
    const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, ...(clip ? { clip } : {}) });
    const destination = path.resolve(screenshotFile);
    assert.equal(path.dirname(destination), __dirname);
    fs.writeFileSync(destination, Buffer.from(screenshot.data, "base64"));
  }
  assert.deepEqual(errors, []);
  assert.equal(fs.readFileSync(path.join(__dirname, "dungeonSavedProfiles.js"), "utf8"), savedSource);
  console.log("dungeonEditorProfiles browser tests passed");
}
