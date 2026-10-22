import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { prepareBgmLoop } from "./prepare-bgm-loop.mjs";

function makeSource(bits) {
  const rate = 8000;
  const channels = 2;
  const frameBytes = channels * bits / 8;
  const frames = Math.round(rate * 2.2);
  const wav = Buffer.alloc(44 + frames * frameBytes);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * frameBytes, 28);
  wav.writeUInt16LE(frameBytes, 32);
  wav.writeUInt16LE(bits, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(frames * frameBytes, 40);

  for (let frame = 0; frame < frames; frame += 1) {
    const time = frame / rate;
    const amplitude = time >= 0.1 && time < 0.3 ? 0.15 : time >= 1.1 && time < 2 ? 0.6 : 0;
    for (let channel = 0; channel < channels; channel += 1) {
      const value = Math.round(Math.sin(frame * Math.PI * 2 * (440 + channel * 110) / rate) * amplitude * (2 ** (bits - 1) - 1));
      wav.writeIntLE(value, 44 + frame * frameBytes + channel * bits / 8, bits / 8);
    }
  }

  return { wav, rate, frameBytes };
}

for (const bits of [16, 24, 32]) {
  const { wav, rate, frameBytes } = makeSource(bits);
  const original = Buffer.from(wav);
  const automatic = prepareBgmLoop(wav);
  const trimmed = prepareBgmLoop(wav, { skipIntroSeconds: 1 });
  assert.equal(automatic.startSeconds, 0.1);
  assert.equal(trimmed.startSeconds, 1.1);
  assert.equal(trimmed.endSeconds, automatic.endSeconds);
  assert.equal(trimmed.loopDurationSeconds, 0.9);
  const expected = wav.subarray(
    44 + Math.round(trimmed.startSeconds * rate) * frameBytes,
    44 + Math.round(trimmed.endSeconds * rate) * frameBytes,
  );
  assert.deepEqual(trimmed.buffer.subarray(44, 44 + expected.length), expected);
  assert.deepEqual(wav, original);
  assert.equal(trimmed.buffer.readUInt16LE(34), bits);
  assert.equal(trimmed.buffer.readUInt16LE(22), 2);
  for (const invalid of [-1, NaN, Infinity]) {
    assert.throws(() => prepareBgmLoop(wav, { skipIntroSeconds: invalid }), /non-negative/);
  }
  assert.throws(() => prepareBgmLoop(wav, { skipIntroSeconds: 3 }), /too short/);
}

const source = readFileSync(new URL("../msc/game_rope.wav", import.meta.url));
const prepared = prepareBgmLoop(source, { skipIntroSeconds: 1.3 });
const actual = readFileSync(new URL("../msc/game_rope_loop.wav", import.meta.url));
assert.deepEqual(actual, prepared.buffer);
console.log("BGM intro trimming preserves retained PCM samples and the source file.");
