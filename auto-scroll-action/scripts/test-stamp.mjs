import assert from "node:assert/strict";
import { createStampCollection, formatStampTimestamp } from "../src/core/stamp-collection.js";
import {
  createSupplyStationManager,
  getStampAppearanceChance,
  SUPPLY_ITEM_DEFINITIONS,
  SUPPLY_ITEM_EFFECT_TYPE,
} from "../src/lane/supply-stations.js";

const stamp = SUPPLY_ITEM_DEFINITIONS.find((item) => item.type === "stamp");
const assortment = SUPPLY_ITEM_DEFINITIONS.find((item) => item.type === "candyAssortment");
assert.equal(stamp.name, "スタンプ");
assert.equal(stamp.description, "スタンプをゲット！！\nスタッフの人にこの画面を見せてね！");
assert.deepEqual(stamp.effect, { type: SUPPLY_ITEM_EFFECT_TYPE.STAMP });
assert.equal(getStampAppearanceChance(0), 0.03);
assert.ok(Math.abs(getStampAppearanceChance(75) - 0.09) < 1e-12);
assert.ok(Math.abs(getStampAppearanceChance(149) - (0.03 + 0.12 * 149 / 150)) < 1e-12);
assert.equal(getStampAppearanceChance(150), 0.15);
assert.equal(getStampAppearanceChance(151), 0.15);
assert.equal(getStampAppearanceChance(199), 0.15);
assert.equal(getStampAppearanceChance(200), 0.15);
assert.equal(getStampAppearanceChance(201), 0.3);
assert.equal(getStampAppearanceChance(10000), 0.3);
assert.equal(getStampAppearanceChance(-10), 0.03);
assert.equal(getStampAppearanceChance(NaN), 0.03);

const queuedRandom = (values) => () => values.shift() ?? 0.99;
const open = (manager, isLarge = false, options = {}) => {
  const id = manager.addStation({ x: 1000, isLarge });
  return manager.openStation(id, options);
};
const claimAll = (manager, draw) => draw.slots.forEach((slot, index) => manager.claimItem(index));

for (const [candyCount, expectedPerThousand] of [
  [0, 30], [75, 90], [150, 150], [151, 150],
  [199, 150], [200, 150], [201, 300], [1000, 300],
]) {
  const chance = getStampAppearanceChance(candyCount);
  for (const [roll, expected] of [[chance - 1e-8, "stamp"], [chance, "candyAssortment"]]) {
    const manager = createSupplyStationManager({
      itemDefinitions: [assortment, stamp],
      getCandyCount: () => candyCount,
      random: queuedRandom([roll, 0, 0.99]),
      theftChance: 0,
    });
    assert.equal(open(manager).slots[0].item.type, expected);
  }

  let stamps = 0;
  for (let step = 0; step < 1000; step += 1) {
    const manager = createSupplyStationManager({
      getCandyCount: () => candyCount,
      random: queuedRandom([(step + 0.5) / 1000, 0.5, 0.99]),
      theftChance: 0,
    });
    stamps += open(manager).slots[0].item.type === "stamp" ? 1 : 0;
  }
  assert.equal(stamps, expectedPerThousand);
}

const used = [];
const manager = createSupplyStationManager({
  random: () => 0,
  theftChance: 0,
  onUseItem: (item) => used.push(item.type),
});
const first = open(manager);
assert.equal(first.slots[0].item.type, "stamp");
assert.equal(manager.claimItem(0).type, "stamp");
assert.equal(manager.claimItem(0), null);
assert.deepEqual(used, ["stamp"]);
for (let index = 0; index < 6; index += 1) {
  const draw = open(manager, true);
  assert.ok(draw.slots.every((slot) => slot.item.type !== "stamp"));
  claimAll(manager, draw);
}
manager.reset();
assert.equal(open(manager).slots[0].item.type, "stamp");

for (const rolls of [[0, 0, 0.99, 0.99], [0.99, 0, 0, 0.99, 0.99]]) {
  const large = createSupplyStationManager({
    itemDefinitions: [assortment, stamp],
    random: queuedRandom(rolls),
    theftChance: 0,
  });
  const draw = open(large, true);
  assert.equal(draw.slots.length, 2);
  assert.equal(draw.slots.filter((slot) => slot.item.type === "stamp").length, 1);
  assert.equal(new Set(draw.slots.map((slot) => slot.item.type)).size, 2);
}

for (const isItemSelectable of [() => false, (item) => item.type === "stamp"]) {
  const fallback = createSupplyStationManager({
    itemDefinitions: [assortment, stamp],
    isItemSelectable,
    random: () => 0.99,
    theftChance: 0,
  });
  assert.deepEqual(open(fallback, true).slots.map((slot) => slot.item.type), [
    "candyAssortment", "candyAssortment",
  ]);
}

const protectedCollection = createStampCollection({ storage: null });
let theftRandomCalls = 0;
const protectedStamp = createSupplyStationManager({
  random: () => { theftRandomCalls += 1; return 0; },
  theftChance: 1,
  onUseItem: (item) => {
    if (item.effect?.type === SUPPLY_ITEM_EFFECT_TYPE.STAMP) protectedCollection.collect();
  },
});
const protectedDraw = open(protectedStamp, true);
assert.equal(protectedDraw.slots[0].item.type, "stamp");
assert.equal(protectedDraw.slots[0].isStolen, false);
assert.equal(protectedDraw.slots[0].isTheftRepelled, false);
assert.equal(protectedDraw.slots[1].isStolen, true);
assert.equal(theftRandomCalls, 3);
claimAll(protectedStamp, protectedDraw);
assert.equal(protectedCollection.hasStamp(), true);
const nextAfterStamp = open(protectedStamp, true);
assert.ok(nextAfterStamp.slots.every((slot) => slot.item.type !== "stamp" && slot.isStolen));
claimAll(protectedStamp, nextAfterStamp);
protectedStamp.reset();
protectedCollection.reset();
const repelled = open(protectedStamp, true, { repelTheft: true });
assert.equal(repelled.slots[0].isStolen, false);
assert.equal(repelled.slots[0].isTheftRepelled, false);
assert.equal(repelled.slots[1].isTheftRepelled, true);
claimAll(protectedStamp, repelled);
assert.equal(protectedCollection.hasStamp(), true);

const stored = new Map();
let writes = 0;
const storage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem(key, value) { stored.set(key, value); writes += 1; },
};
let now = new Date("2026-10-22T05:14:46.000Z");
const collection = createStampCollection({ storage, now: () => now });
assert.equal(collection.getLatestLog(), null);
assert.equal(collection.collect(), true);
assert.equal(collection.collect(), false);
assert.equal(stored.size, 0);
assert.deepEqual(collection.finishRun(), { gameOverAt: now.toISOString() });
assert.equal(collection.finishRun(), null);
assert.equal(writes, 1);
assert.equal(stored.size, 1);
assert.match(formatStampTimestamp(now.toISOString()), /2026\/10\/22.*14:14:46/);
const log = collection.getLatestLog();
log.gameOverAt = "changed";
assert.equal(collection.getLatestLog().gameOverAt, now.toISOString());
const reloaded = createStampCollection({ storage });
assert.equal(reloaded.hasStamp(), false);
assert.equal(reloaded.getLatestLog().gameOverAt, now.toISOString());

collection.reset();
now = new Date("2026-10-22T07:01:02.000Z");
collection.finishRun();
assert.equal(writes, 1);
assert.equal(collection.getLatestLog().gameOverAt, "2026-10-22T05:14:46.000Z");
assert.equal(collection.collect(), false);
collection.reset();
collection.collect();
collection.finishRun();
assert.equal(writes, 2);
assert.equal(stored.size, 1);
assert.equal(collection.getLatestLog().gameOverAt, now.toISOString());

for (const value of ["not json", "[]", "null", '{"gameOverAt":"bad date"}', '{"gameOverAt":123}']) {
  const invalid = createStampCollection({ storage: { getItem: () => value } });
  assert.equal(invalid.getLatestLog(), null);
}
const denied = createStampCollection({
  storage: {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  },
  now: () => now,
});
denied.collect();
assert.equal(denied.finishRun().gameOverAt, now.toISOString());
assert.equal(denied.getLatestLog().gameOverAt, now.toISOString());

console.log("Stamp chance boundaries, once-per-run selection, large stations, theft and fallback tests passed.");
console.log("Stamp collection, single-record persistence, reloads and Japan-time seconds tests passed.");
