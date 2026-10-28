import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const WINDOW_SECONDS = 0.01;
// The current song has a lone pickup followed by a decaying 1.3-second lead-in.
const BGM_INTRO_SKIP_SECONDS = 1.3;

export function prepareBgmLoop(wav, { skipIntroSeconds = 0 } = {}) {
  if (!Number.isFinite(skipIntroSeconds) || skipIntroSeconds < 0) {
    throw new Error("The intro skip must be a non-negative number of seconds.");
  }

  if (
    wav.toString("ascii", 0, 4) !== "RIFF" ||
    wav.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new Error("The source must be a WAV file.");
  }

  let format;
  let data;

  for (let offset = 12; offset + 8 <= wav.length;) {
    const kind = wav.toString("ascii", offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);

    if (offset + 8 + size > wav.length) {
      throw new Error("The WAV file contains an incomplete chunk.");
    }

    if (kind === "fmt " && size >= 16) {
      format = {
        encoding: wav.readUInt16LE(offset + 8),
        channels: wav.readUInt16LE(offset + 10),
        sampleRate: wav.readUInt32LE(offset + 12),
        blockAlign: wav.readUInt16LE(offset + 20),
        bits: wav.readUInt16LE(offset + 22),
      };
    } else if (kind === "data") {
      data = { offset: offset + 8, size };
    }

    if (format && data) {
      break;
    }

    offset += 8 + size + (size % 2);
  }

  if (
    !format || !data || format.encoding !== 1 ||
    ![16, 24, 32].includes(format.bits) ||
    format.sampleRate <= 0 || format.channels <= 0 ||
    format.blockAlign !== format.channels * format.bits / 8
  ) {
    throw new Error("Use an uncompressed 16-, 24- or 32-bit PCM WAV file.");
  }

  const sampleBytes = format.bits / 8;
  const frames = Math.floor(data.size / format.blockAlign);
  const windowFrames = Math.max(1, Math.round(format.sampleRate * WINDOW_SECONDS));
  const sampleScale = 2 ** (format.bits - 1);
  const levels = [];
  let peakLevel = 0;

  function readSample(frame, channel) {
    return wav.readIntLE(
      data.offset + frame * format.blockAlign + channel * sampleBytes,
      sampleBytes,
    );
  }

  for (let start = 0; start < frames; start += windowFrames) {
    const end = Math.min(frames, start + windowFrames);
    let power = 0;

    for (let frame = start; frame < end; frame += 1) {
      for (let channel = 0; channel < format.channels; channel += 1) {
        const sample = readSample(frame, channel) / sampleScale;
        power += sample * sample;
      }
    }

    const level = Math.sqrt(power / ((end - start) * format.channels));
    levels.push(level);
    peakLevel = Math.max(peakLevel, level);
  }

  if (peakLevel === 0) {
    throw new Error("The source contains no audible samples.");
  }

  const threshold = Math.min(0.01, peakLevel * 0.1);
  const firstWindow = levels.findIndex((level) => level >= threshold);
  const lastWindow = levels.findLastIndex((level) => level >= threshold);
  const startFrame = firstWindow * windowFrames + Math.round(skipIntroSeconds * format.sampleRate);
  const endFrame = Math.min(frames, (lastWindow + 1) * windowFrames);
  const outputFrames = endFrame - startFrame;

  if (outputFrames < 2) {
    throw new Error("The source is too short to prepare a loop.");
  }

  const dataBytes = outputFrames * format.blockAlign;
  const output = Buffer.alloc(44 + dataBytes + (dataBytes % 2));
  output.write("RIFF", 0);
  output.writeUInt32LE(output.length - 8, 4);
  output.write("WAVEfmt ", 8);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(format.channels, 22);
  output.writeUInt32LE(format.sampleRate, 24);
  output.writeUInt32LE(format.sampleRate * format.blockAlign, 28);
  output.writeUInt16LE(format.blockAlign, 32);
  output.writeUInt16LE(format.bits, 34);
  output.write("data", 36);
  output.writeUInt32LE(dataBytes, 40);

  // Keep retained samples unchanged: no overlap, resampling or fade is added.
  wav.copy(
    output,
    44,
    data.offset + startFrame * format.blockAlign,
    data.offset + endFrame * format.blockAlign,
  );

  return {
    buffer: output,
    sourceDurationSeconds: frames / format.sampleRate,
    startSeconds: startFrame / format.sampleRate,
    endSeconds: endFrame / format.sampleRate,
    loopDurationSeconds: outputFrames / format.sampleRate,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const projectRoot = fileURLToPath(new URL("../", import.meta.url));
  const sourcePath = resolve(projectRoot, "msc/game_rope.wav");
  const outputPath = resolve(projectRoot, "msc/game_rope_loop.wav");
  const { buffer, ...details } = prepareBgmLoop(readFileSync(sourcePath), {
    skipIntroSeconds: BGM_INTRO_SKIP_SECONDS,
  });
  writeFileSync(outputPath, buffer);
  console.log(JSON.stringify({ sourcePath, outputPath, ...details }, null, 2));
}
