import assert from "node:assert/strict";
import { createStampCelebration } from "../src/visual/stamp-celebration.js";

const pendingFrames = new Map();
const resizeListeners = [];
const draws = [];
let nextFrameId = 0;
let spriteCount = 0;
let reducedMotion = false;
let bounds = { width: 1280, height: 720 };
const previousWindow = globalThis.window;
const previousRequest = globalThis.requestAnimationFrame;
const previousCancel = globalThis.cancelAnimationFrame;
const previousRandom = Math.random;

function makeContext() {
  return {
    fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {},
    fill() {}, bezierCurveTo() {}, stroke() {}, clearRect() {}, save() {},
    restore() {}, rotate() {}, scale() {},
    translate(x, y) { draws.push({ x, y }); },
    drawImage() {},
  };
}

function advance(time) {
  const callbacks = [...pendingFrames.values()];
  pendingFrames.clear();
  for (const callback of callbacks) callback(time);
}

const canvas = {
  hidden: true,
  getContext: () => makeContext(),
  getBoundingClientRect: () => bounds,
  ownerDocument: {
    createElement(tag) {
      assert.equal(tag, "canvas");
      spriteCount += 1;
      return { getContext: () => makeContext() };
    },
  },
};

globalThis.window = {
  matchMedia: () => ({ matches: reducedMotion }),
  addEventListener(type, callback) {
    assert.equal(type, "resize");
    resizeListeners.push(callback);
  },
};
globalThis.requestAnimationFrame = (callback) => {
  const id = ++nextFrameId;
  pendingFrames.set(id, callback);
  return id;
};
globalThis.cancelAnimationFrame = (id) => pendingFrames.delete(id);
Math.random = () => 0.5;

try {
  const celebration = createStampCelebration(canvas);
  assert.equal(canvas.hidden, true);
  assert.equal(pendingFrames.size, 0);
  celebration.start();
  assert.equal(canvas.hidden, false);
  assert.equal(canvas.width, 1280);
  assert.equal(canvas.height, 720);
  assert.equal(pendingFrames.size, 1);
  assert.equal(spriteCount, 18);

  advance(0);
  advance(250);
  assert.equal(draws.length, 144);
  assert.ok(draws.every(({ y }) => y > bounds.height * 0.7 && y < bounds.height));
  assert.ok(draws.some(({ x }) => x < bounds.width / 2));
  assert.ok(draws.some(({ x }) => x > bounds.width / 2));
  draws.length = 0;
  advance(1000);
  assert.ok(draws.some(({ y }) => y < bounds.height * 0.35));
  assert.equal(spriteCount, 18);

  bounds = { width: 640, height: 360 };
  resizeListeners[0]();
  assert.equal(canvas.width, 640);
  assert.equal(canvas.height, 360);
  advance(3600);
  assert.equal(canvas.hidden, true);
  assert.equal(pendingFrames.size, 0);

  celebration.start();
  celebration.start();
  assert.equal(pendingFrames.size, 1);
  assert.equal(spriteCount, 18);
  let theftFrames = 0;
  requestAnimationFrame(() => { theftFrames += 1; });
  celebration.reset();
  assert.equal(canvas.hidden, true);
  advance(4000);
  assert.equal(theftFrames, 1);
  assert.equal(pendingFrames.size, 0);

  bounds = { width: 390, height: 220 };
  celebration.start();
  advance(5000);
  draws.length = 0;
  advance(5250);
  assert.equal(draws.length, 90);
  celebration.reset();

  reducedMotion = true;
  celebration.start();
  advance(6000);
  draws.length = 0;
  advance(6250);
  assert.equal(draws.length, 30);
  assert.ok(draws.every(({ y }) => y > bounds.height * 0.8));
  advance(7400);
  assert.equal(canvas.hidden, true);
  assert.equal(pendingFrames.size, 0);
  assert.equal(spriteCount, 18);
  assert.throws(() => createStampCelebration({ getContext: () => null }), /unavailable/);
} finally {
  Math.random = previousRandom;
  if (previousWindow === undefined) delete globalThis.window;
  else globalThis.window = previousWindow;
  if (previousRequest === undefined) delete globalThis.requestAnimationFrame;
  else globalThis.requestAnimationFrame = previousRequest;
  if (previousCancel === undefined) delete globalThis.cancelAnimationFrame;
  else globalThis.cancelAnimationFrame = previousCancel;
}

console.log("Stamp celebration launch, caching, resize, cleanup, independent animation, and reduced-motion tests passed.");
