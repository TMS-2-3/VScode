import assert from "node:assert/strict";
import { createScaryCostume } from "../src/core/scary-costume.js";
import { PLAYER_ARTWORK } from "../src/visual/player-art.js";
import { paintGhostCostumeArtwork } from "../src/visual/ghost-costume-art.js";

const previousPath = globalThis.Path2D;
globalThis.Path2D = class {
  constructor(data) {
    assert.equal(typeof data, "string");
    assert.ok(!/NaN|Infinity/.test(data));
    this.data = data;
  }
};

function recordArtwork(options) {
  const records = [];
  let depth = 0;
  const context = new Proxy({
    createLinearGradient(...args) {
      assert.ok(args.every(Number.isFinite));
      records.push(["gradient", ...args]);
      return { addColorStop: (...stop) => records.push(["stop", ...stop]) };
    },
  }, {
    get(target, name) {
      if (name in target) return target[name];
      return (...args) => {
        assert.ok(args.filter((value) => typeof value === "number").every(Number.isFinite));
        if (name === "save") depth += 1;
        if (name === "restore") depth -= 1;
        assert.ok(depth >= 0);
        records.push([name, ...args]);
      };
    },
    set(target, name, value) {
      records.push([name, value]);
      target[name] = value;
      return true;
    },
  });
  const dimensions = options.pose === "duck" ? PLAYER_ARTWORK.ducking : PLAYER_ARTWORK.standing;
  paintGhostCostumeArtwork(context, dimensions.width, dimensions.height, options);
  assert.equal(depth, 0);
  assert.deepEqual(records[1], ["scale", 1, 1]);
  assert.ok(records.filter(([name]) => name === "fill").length > 15);
  return JSON.stringify(records);
}

try {
  const frames = new Set();
  for (let frame = 0; frame < PLAYER_ARTWORK.runFrames; frame += 1) {
    frames.add(recordArtwork({ pose: "run", frame }));
  }
  assert.ok(frames.size >= 6);
  const poses = new Set();
  for (const pose of ["run", "jump", "duck", "hit", "dizzy"]) {
    const girl = recordArtwork({ pose, frame: 1, character: "girl" });
    const boy = recordArtwork({ pose, frame: 1, character: "boy" });
    assert.equal(girl, boy);
    assert.match(girl, /M-24 -18 Q-35 -58 -2 -62/);
    poses.add(girl);
  }
  assert.equal(poses.size, 5);

  const costume = createScaryCostume({ random: () => 0.999 });
  assert.equal(costume.getSnapshot().isActive, false);
  costume.activate();
  assert.equal(costume.getSnapshot().isActive, true);
  assert.equal(costume.repelNextGhost(), 7);
  assert.equal(costume.getSnapshot().isActive, false);
  assert.equal(costume.repelNextGhost(), 0);
  costume.activate();
  assert.deepEqual(costume.repelGhostGroup(2), [7, 7]);
  assert.equal(costume.getSnapshot().isActive, false);
  costume.activate();
  costume.reset();
  assert.equal(costume.getSnapshot().isActive, false);
} finally {
  if (previousPath === undefined) delete globalThis.Path2D;
  else globalThis.Path2D = previousPath;
}

console.log("Ghost costume shared artwork, animation poses, drawing state, and effect lifecycle tests passed.");
