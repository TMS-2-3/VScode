"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");

const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const temp = fs.mkdtempSync(path.join(__dirname, ".line-copy-browser-"));
const originalMaps = fs.readFileSync(path.join(__dirname, "maps.js"), "utf8");
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
  assert.equal(path.dirname(path.resolve(temp)), __dirname);
  assert.ok(path.basename(temp).startsWith(".line-copy-browser-"));
  fs.rmSync(temp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
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
    browser.once("exit", () => reject(new Error(`Chrome exited: ${output.slice(-1000)}`)));
  });
  const targets = await (await fetch(`http://${new URL(endpoint).host}/json/list`)).json();
  socket = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const response = JSON.parse(data);
    if (response.method === "Runtime.exceptionThrown") errors.push(response.params.exceptionDetails);
    const request = pending.get(response.id);
    if (!request) return;
    pending.delete(response.id);
    clearTimeout(request.timer);
    if (response.error) request.reject(new Error(JSON.stringify(response.error)));
    else request.resolve(response.result);
  });
  socket.addEventListener("close", () => {
    pending.forEach((request) => { clearTimeout(request.timer); request.reject(new Error("Chrome connection closed")); });
    pending.clear();
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function waitFor(expression) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Timed out: ${expression}`);
  }
  async function clickCell(col, row) {
    const point = await evaluate(`(() => {
      const rect = surface.getBoundingClientRect();
      return { x: rect.left + (${col} + 0.5) * state.map.tileSize * state.mapZoom,
        y: rect.top + (${row} + 0.5) * state.map.tileSize * state.mapZoom };
    })()`);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", buttons: 1, clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", buttons: 0, clickCount: 1 });
  }
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: pathToFileURL(path.join(__dirname, "map-editor.html")).href });
  await waitFor("typeof state !== 'undefined' && Boolean(state.map)");
  await evaluate(`{
    const testMap = { id: 'line_copy_preview', name: '直線コピー確認', width: 7, height: 7,
      defaultTile: 'grass', marginTiles: { ground: 'grass', object: null }, events: [],
      layers: ['ground','terrain','object','event'].map(id => ({ id, tiles: Array(49).fill(id === 'ground' ? 'grass' : null) })) };
    for (const [col,row] of [[1,1],[3,3],[1,5],[5,5]]) testMap.layers[0].tiles[row * 7 + col] = 'road';
    testMap.layers[2].tiles[2 * 7 + 1] = 'stoneMarker';
    state.map = normalizeMap(testMap); state.mapZoom = 1;
    state.activeLayer = 'ground'; state.selectedTile = 'grass'; resetHistory(); renderAll();
  }`);
  assert.equal(await evaluate("tileMapSystem.getLineCopySources(state.map).length"), 0);
  assert.ok(await evaluate("surface.querySelectorAll('[data-margin=true]').length > 0"), "margin preview must exist without any copy event selected or placed");
  assert.equal(await evaluate("surfaceWrap.style.padding"), "162px");
  await evaluate("Array.from(layerTabs.children).find(button => button.textContent === 'イベント').click()");
  assert.equal(await evaluate("getPaletteTiles().filter(id => defs[id].lineCopyDirection).length"), 4);
  for (const [suffix, col, row, endCol, endRow] of [
    ["Down", 1, 1, 1, 7], ["Up", 3, 3, 3, -1], ["Left", 1, 5, -1, 5], ["Right", 5, 5, 7, 5],
  ]) {
    await evaluate(`Array.from(palette.children).find(button => button.title.includes('(lineCopy${suffix})')).click()`);
    await clickCell(col, row);
    assert.equal(await evaluate(`state.map.layers.find(layer => layer.id === 'event').tiles[${row * 7 + col}]`), `lineCopy${suffix}`);
    assert.equal(await evaluate(`Boolean(surface.querySelector('[data-tile-id="road"][data-col="${endCol}"][data-row="${endRow}"][data-margin="true"]'))`), true);
  }
  assert.equal(await evaluate("surface.querySelectorAll('.line-copy-symbol').length"), 4);
  assert.equal(await evaluate(`Boolean(surface.querySelector('[data-tile-id="stoneMarker"][data-col="1"][data-row="2"]'))`), false);
  await evaluate("undoMapEdit()");
  assert.equal(await evaluate("tileMapSystem.getLineCopySources(state.map).length"), 3);
  await evaluate("redoMapEdit()");
  assert.equal(await evaluate("tileMapSystem.getLineCopySources(state.map).length"), 4);
  const roundTrip = await evaluate(`(() => {
    const saved = createSerializableMap(state.map);
    const holder = { HEALER_TILE_MAPS: {} };
    new Function('window', buildMapAssignmentSource())(holder);
    state.map = normalizeMap(JSON.parse(JSON.stringify(saved))); renderAll();
    return { jsonSources: tileMapSystem.getLineCopySources(state.map).length,
      jsSources: tileMapSystem.getLineCopySources(holder.HEALER_TILE_MAPS.line_copy_preview).length,
      rawDestination: saved.layers.find(layer => layer.id === 'ground').tiles[2 * 7 + 1],
      rawObject: saved.layers.find(layer => layer.id === 'object').tiles[2 * 7 + 1] };
  })()`);
  assert.deepEqual(roundTrip, { jsonSources: 4, jsSources: 4, rawDestination: "grass", rawObject: "stoneMarker" });
  const pixels = await evaluate(`(async () => {
    const image = color => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 48;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0,0,48,48); return canvas.toDataURL(); };
    const renderDefs = { ...defs, __road: { image: image('#ff0000'), passable: true }, __grass: { image: image('#00ff00'), passable: true } };
    const system = createHealerTileMapSystem({ tileDefs: renderDefs });
    const map = { id: 'pixel_test', width: 2, height: 1, marginTiles: { ground: '__grass' },
      layers: [{ id: 'ground', tiles: ['__road','__grass'] }, { id: 'event', tiles: ['lineCopyRight', null] }] };
    await Promise.all(system.preloadTileImages(map).map(image => image.decode()));
    const canvas = document.createElement('canvas'); canvas.width = 192; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    const draw = useCache => { ctx.clearRect(0,0,192,96); system.drawTileMap(ctx, map);
      system.drawMarginTile(ctx, map, { viewport: { x: 0, y: 0, w: 192, h: 96 }, useCache });
      return [[24,24], [72,24], [120,24], [120,72]].map(([x,y]) => Array.from(ctx.getImageData(x,y,1,1).data)); };
    return { direct: draw(false), cached: draw(true) };
  })()`);
  const expected = [[255, 0, 0, 255], [255, 0, 0, 255], [255, 0, 0, 255], [0, 255, 0, 255]];
  assert.deepEqual(pixels.direct, expected);
  assert.deepEqual(pixels.cached, expected);
  await waitFor("Array.from(surface.querySelectorAll('img')).every(image => image.complete)");
  if (process.argv[2]) {
    const screenshot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.resolve(process.argv[2]), Buffer.from(screenshot.data, "base64"));
  }
  await evaluate("document.querySelector('[data-tool=erase]').click()");
  await clickCell(1, 1);
  assert.equal(await evaluate("tileMapSystem.getTileIdAt(state.map, 1, 2, 'object')"), "stoneMarker");
  for (const [col, row] of [[3, 3], [1, 5], [5, 5]]) await clickCell(col, row);
  await evaluate("Array.from(layerTabs.children).find(button => button.textContent === '地面').click()");
  assert.equal(await evaluate("tileMapSystem.getLineCopySources(state.map).length"), 0);
  assert.ok(await evaluate("surface.querySelectorAll('[data-margin=true]').length > 0"), "margin preview must remain after deleting all copy events and switching layers");
  assert.equal(await evaluate("surfaceWrap.style.padding"), "162px");
  await send("Page.navigate", { url: pathToFileURL(path.join(__dirname, "../index.html")).href });
  await waitFor("typeof window.createHealerTileMapSystem === 'function' && Boolean(document.querySelector('canvas'))");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  assert.deepEqual(errors, []);
  assert.equal(fs.readFileSync(path.join(__dirname, "maps.js"), "utf8"), originalMaps);
  console.log("mapEditorLineCopy browser tests passed");
}
