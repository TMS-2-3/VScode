const TWO_PI = Math.PI * 2;
const RUN_INTRO_DURATION_SECONDS = 1.85;
const JUMP_DURATION_SECONDS = 0.28;
const DOUBLE_JUMP_DURATION_SECONDS = 0.31;
const CANDY_DURATION_SECONDS = 0.3;
const GHOST_SCARE_DURATION_SECONDS = 0.66;
const GHOST_FLEE_DURATION_SECONDS = 0.72;
const SUPPLY_ROULETTE_TICK_DURATION_SECONDS = 0.09;
const SUPPLY_ROULETTE_RESULT_DURATION_SECONDS = 0.58;
const SUPPLY_GO_DURATION_SECONDS = 0.4;
const SUPPLY_THEFT_VOICE_DURATION_SECONDS = 0.86;
const LAUNCHER_COUNTDOWN_DURATION_SECONDS = 0.18;
const LAUNCHER_FIRE_DURATION_SECONDS = 0.48;
const LAUNCHER_EXPLOSION_DURATION_SECONDS = 0.72;
const CANDY_VACUUM_LOOP_DURATION_SECONDS = 0.64;
const OBSTACLE_HIT_DURATION_SECONDS = 0.24;
const GAME_OVER_DURATION_SECONDS = 1.18;
const PUMPKIN_CRUSH_DURATION_SECONDS = 0.68;
const CANDY_PARTY_BURST_DURATION_SECONDS = 0.7;
const CANDY_VACUUM_IDLE_VOLUME = 0.12;
const CANDY_VACUUM_PULL_VOLUME = 0.38;
const VOLUME_STORAGE_KEY = "auto-scroll-action:audio-volumes";
const DEFAULT_VOLUME_SETTINGS = { master: 1, bgm: 1, se: 1 };
const MIN_BACKGROUND_MUSIC_PLAYBACK_RATE = 0.0625;
const MAX_BACKGROUND_MUSIC_PLAYBACK_RATE = 16;
const BACKGROUND_MUSIC_VOLUMES = {
  title: 0.24,
  playing: 0.4,
  supply: 0.16,
};
const CANDY_PLAYBACK_RATES = [0.9, 1, 0.95, 1.06, 0.93];
const GHOST_PLAYBACK_RATES = [1, 1.025, 0.985];
const SUPPLY_ROULETTE_TICK_RATES = [
  1,
  1.122,
  1.26,
  1.498,
  1.335,
  1.189,
];
const LAUNCHER_COUNTDOWN_RATES = [1.42, 1.18, 1];

export function createAudioController() {
  const volumeSettings = loadVolumeSettings();
  // Rebuild after replacing game_rope.wav: node scripts/prepare-bgm-loop.mjs
  const backgroundMusic = new Audio(
    new URL("../../msc/game_rope_loop.wav?v=2", import.meta.url).href,
  );
  backgroundMusic.loop = true;
  backgroundMusic.preload = "auto";
  let backgroundMusicMode = "off";
  let audioContext = null;
  let masterGain = null;
  let seVolumeGain = null;
  let soundBuffers = null;
  let candyVariationIndex = 0;
  let ghostVariationIndex = 0;
  let candyVacuumSource = null;
  let candyVacuumGain = null;
  let candyVacuumMode = "off";

  function getAudioContext() {
    if (audioContext) {
      return audioContext;
    }

    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
    seVolumeGain = audioContext.createGain();
    seVolumeGain.gain.value = volumeSettings.master * volumeSettings.se;
    seVolumeGain.connect(audioContext.destination);
    masterGain = createMasterOutput(audioContext, seVolumeGain);
    soundBuffers = {
      runIntro: createRunIntroBuffer(audioContext),
      jump: createJumpBuffer(audioContext, false),
      doubleJump: createJumpBuffer(audioContext, true),
      candy: createCandyCollectBuffer(audioContext),
      ghostScare: createGhostScareBuffer(audioContext),
      ghostFlee: createGhostFleeBuffer(audioContext),
      supplyRouletteTick: createSupplyRouletteTickBuffer(audioContext),
      supplyRouletteResult: createSupplyRouletteResultBuffer(audioContext),
      supplyGo: createSupplyGoBuffer(audioContext),
      supplyTheftVoice: createSupplyTheftVoiceBuffer(audioContext),
      launcherCountdown: createLauncherCountdownBuffer(audioContext),
      launcherFire: createLauncherFireBuffer(audioContext),
      launcherExplosion: createLauncherExplosionBuffer(audioContext),
      candyVacuumLoop: createCandyVacuumLoopBuffer(audioContext),
      obstacleHit: createObstacleHitBuffer(audioContext),
      gameOver: createGameOverBuffer(audioContext),
      pumpkinCrush: createPumpkinCrushBuffer(audioContext),
      candyPartyBurst: createCandyPartyBurstBuffer(audioContext),
    };
    return audioContext;
  }

  function unlock() {
    resumeBackgroundMusic();
    const context = getAudioContext();

    if (context?.state === "suspended") {
      void context.resume();
    }
  }

  function resumeBackgroundMusic() {
    if (backgroundMusicMode === "off" || !backgroundMusic.paused) {
      return;
    }

    void backgroundMusic.play().catch((error) => {
      // Autoplay waits for a user gesture; changing screens may cancel play().
      if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
        console.warn("BGM playback failed.", error);
      }
    });
  }

  function setBackgroundMusicSpeed(speedRatio = 1) {
    if (!Number.isFinite(speedRatio) || speedRatio <= 0) {
      return;
    }

    const playbackRate = Math.max(
      MIN_BACKGROUND_MUSIC_PLAYBACK_RATE,
      Math.min(MAX_BACKGROUND_MUSIC_PLAYBACK_RATE, speedRatio),
    );

    if (backgroundMusic.playbackRate !== playbackRate) {
      backgroundMusic.playbackRate = playbackRate;
    }
  }

  function setBackgroundMusicMode(mode, { restart = false } = {}) {
    const volume = BACKGROUND_MUSIC_VOLUMES[mode];
    backgroundMusicMode = volume === undefined ? "off" : mode;

    if (backgroundMusicMode === "off") {
      backgroundMusic.pause();
      return;
    }

    if (backgroundMusicMode === "title" || restart) {
      setBackgroundMusicSpeed(1);
    }

    if (restart) {
      backgroundMusic.currentTime = 0;
    }

    applyVolumeSettings();
    resumeBackgroundMusic();
  }

  function applyVolumeSettings() {
    const sceneVolume = BACKGROUND_MUSIC_VOLUMES[backgroundMusicMode] ?? 0;
    backgroundMusic.volume =
      sceneVolume * volumeSettings.master * volumeSettings.bgm;

    if (audioContext && seVolumeGain) {
      seVolumeGain.gain.setTargetAtTime(
        volumeSettings.master * volumeSettings.se,
        audioContext.currentTime,
        0.015,
      );
    }
  }

  function setVolumeSettings(nextSettings) {
    for (const key of Object.keys(DEFAULT_VOLUME_SETTINGS)) {
      if (Number.isFinite(nextSettings[key])) {
        volumeSettings[key] = Math.max(0, Math.min(1, nextSettings[key]));
      }
    }

    applyVolumeSettings();

    try {
      window.localStorage.setItem(
        VOLUME_STORAGE_KEY,
        JSON.stringify(volumeSettings),
      );
    } catch {
      // Volume changes still work when browser storage is unavailable.
    }
  }

  function playBuffer(buffer, { playbackRate = 1, volume = 1 } = {}) {
    const context = getAudioContext();

    if (!context || !masterGain || !buffer) {
      return;
    }

    unlock();
    const source = context.createBufferSource();
    const gain = context.createGain();
    const startTime = context.currentTime;

    source.buffer = buffer;
    source.playbackRate.setValueAtTime(playbackRate, startTime);
    gain.gain.setValueAtTime(volume, startTime);
    source.connect(gain);
    gain.connect(masterGain);
    source.addEventListener("ended", () => {
      source.disconnect();
      gain.disconnect();
    });
    source.start(startTime);
  }

  function playRunIntro() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.runIntro, { volume: 0.68 });
  }

  function playJump(jumpCount = 1) {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(jumpCount >= 2 ? soundBuffers.doubleJump : soundBuffers.jump, {
      volume: jumpCount >= 2 ? 0.58 : 0.54,
    });
  }

  function playCandyCollect() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    const playbackRate = CANDY_PLAYBACK_RATES[
      candyVariationIndex % CANDY_PLAYBACK_RATES.length
    ];
    candyVariationIndex += 1;
    playBuffer(soundBuffers.candy, {
      playbackRate,
      volume: 1.35,
    });
  }

  function playGhostScare() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    const playbackRate = GHOST_PLAYBACK_RATES[
      ghostVariationIndex % GHOST_PLAYBACK_RATES.length
    ];
    ghostVariationIndex += 1;
    playBuffer(soundBuffers.ghostScare, {
      playbackRate,
      volume: 0.62,
    });
  }

  function playGhostFlee() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.ghostFlee, {
      volume: 0.64,
    });
  }

  function playSupplyRouletteTick(step = 0) {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    const rateIndex =
      Math.abs(Math.trunc(step)) % SUPPLY_ROULETTE_TICK_RATES.length;
    playBuffer(soundBuffers.supplyRouletteTick, {
      playbackRate: SUPPLY_ROULETTE_TICK_RATES[rateIndex],
      volume: 0.38,
    });
  }

  function playSupplyRouletteResult() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.supplyRouletteResult, {
      volume: 0.58,
    });
  }

  function playSupplyGo() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.supplyGo, {
      volume: 0.56,
    });
  }

  function playSupplyTheftVoice() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.supplyTheftVoice, {
      volume: 0.6,
    });
  }

  function playLauncherCountdown(value) {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    const countdownValue = Math.min(3, Math.max(1, Math.trunc(value) || 1));
    playBuffer(soundBuffers.launcherCountdown, {
      playbackRate: LAUNCHER_COUNTDOWN_RATES[countdownValue - 1],
      volume: countdownValue === 1 ? 0.5 : 0.44,
    });
  }

  function playLauncherFire() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.launcherFire, {
      volume: 0.62,
    });
  }

  function playLauncherExplosion() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.launcherExplosion, {
      volume: 0.72,
    });
  }

  function setCandyVacuumState({ isActive = false, isPulling = false } = {}) {
    if (!isActive) {
      stopCandyVacuumLoop();
      return;
    }

    const context = getAudioContext();

    if (!context || !masterGain || !soundBuffers) {
      return;
    }

    unlock();
    const nextMode = isPulling ? "pulling" : "idle";

    if (
      candyVacuumSource &&
      candyVacuumGain &&
      candyVacuumMode === nextMode
    ) {
      return;
    }

    if (!candyVacuumSource || !candyVacuumGain) {
      const source = context.createBufferSource();
      const gain = context.createGain();

      source.buffer = soundBuffers.candyVacuumLoop;
      source.loop = true;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      source.connect(gain);
      gain.connect(masterGain);
      source.addEventListener("ended", () => {
        source.disconnect();
        gain.disconnect();
      });
      source.start(context.currentTime);
      candyVacuumSource = source;
      candyVacuumGain = gain;
    }

    const targetVolume = isPulling
      ? CANDY_VACUUM_PULL_VOLUME
      : CANDY_VACUUM_IDLE_VOLUME;
    const now = context.currentTime;
    candyVacuumGain.gain.cancelScheduledValues(now);
    candyVacuumGain.gain.setValueAtTime(
      Math.max(0.0001, candyVacuumGain.gain.value),
      now,
    );
    candyVacuumGain.gain.linearRampToValueAtTime(targetVolume, now + 0.08);
    candyVacuumMode = nextMode;
  }

  function stopCandyVacuumLoop() {
    if (!audioContext || !candyVacuumSource || !candyVacuumGain) {
      candyVacuumMode = "off";
      return;
    }

    const source = candyVacuumSource;
    const gain = candyVacuumGain;
    const now = audioContext.currentTime;
    candyVacuumSource = null;
    candyVacuumGain = null;
    candyVacuumMode = "off";
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    source.stop(now + 0.09);
  }

  function playGameOver() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.gameOver, {
      volume: 0.82,
    });
  }

  function playObstacleHit() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.obstacleHit, {
      volume: 0.95,
    });
  }

  function playPumpkinCrush() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.pumpkinCrush, {
      volume: 0.7,
    });
  }

  function playCandyPartyBurst() {
    const context = getAudioContext();

    if (!context || !soundBuffers) {
      return;
    }

    playBuffer(soundBuffers.candyPartyBurst, {
      volume: 0.64,
    });
  }

  return {
    getVolumeSettings: () => ({ ...volumeSettings }),
    playCandyCollect,
    playCandyPartyBurst,
    playGameOver,
    playGhostFlee,
    playGhostScare,
    playJump,
    playLauncherCountdown,
    playLauncherExplosion,
    playLauncherFire,
    playObstacleHit,
    playPumpkinCrush,
    playRunIntro,
    playSupplyGo,
    playSupplyRouletteResult,
    playSupplyRouletteTick,
    playSupplyTheftVoice,
    setBackgroundMusicMode,
    setBackgroundMusicSpeed,
    setCandyVacuumState,
    setVolumeSettings,
    unlock,
  };
}

function loadVolumeSettings() {
  const settings = { ...DEFAULT_VOLUME_SETTINGS };

  try {
    const saved = JSON.parse(window.localStorage.getItem(VOLUME_STORAGE_KEY));

    for (const key of Object.keys(settings)) {
      if (Number.isFinite(saved?.[key])) {
        settings[key] = Math.max(0, Math.min(1, saved[key]));
      }
    }
  } catch {
    // Use the defaults for missing, invalid or inaccessible saved settings.
  }

  return settings;
}

function createMasterOutput(context, output) {
  const gain = context.createGain();
  const compressor = context.createDynamicsCompressor();

  gain.gain.value = 0.7;
  compressor.threshold.value = -12;
  compressor.knee.value = 14;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.12;
  gain.connect(compressor);
  compressor.connect(output);
  return gain;
}

function createRunIntroBuffer(context) {
  const bounces = [
    { start: 0, duration: 0.4, pitch: 145, volume: 0.64, phase: 0 },
    {
      start: 0.47,
      duration: 0.2,
      pitch: 300,
      volume: 0.56,
      phase: 0,
      isSquish: true,
    },
  ];
  const notes = [
    { start: 0.82, duration: 0.18, frequency: 493.88, volume: 0.4 },
    { start: 0.98, duration: 0.18, frequency: 587.33, volume: 0.4 },
    { start: 1.14, duration: 0.66, frequency: 783.99, volume: 0.44 },
  ];
  const finalChord = [392, 493.88, 587.33];

  return createSoundBuffer(
    context,
    RUN_INTRO_DURATION_SECONDS,
    (time, _progress, sampleRate) => {
      let sample = 0;

      for (const bounce of bounces) {
        const localTime = time - bounce.start;

        if (localTime < 0 || localTime >= bounce.duration) {
          continue;
        }

        const progress = localTime / bounce.duration;
        const rise = easeOutCubic(Math.min(1, progress * 3));
        const frequency = bounce.isSquish
          ? bounce.pitch * (1 - easeOutCubic(progress) * 0.52)
          : bounce.pitch * (1 + rise * 1.35) * (1 - progress * 0.48);
        bounce.phase += TWO_PI * frequency / sampleRate;
        const attack = Math.min(1, localTime / (bounce.isSquish ? 0.006 : 0.012));
        const release = (1 - progress) ** (bounce.isSquish ? 2 : 1.6);
        const jelly =
          Math.sin(bounce.phase) * 0.82 +
          Math.sin(bounce.phase * 2 + 0.25) * 0.14;
        sample += jelly * attack * release * bounce.volume;
      }

      for (const note of notes) {
        const localTime = time - note.start;

        if (localTime < 0 || localTime >= note.duration) {
          continue;
        }

        const attack = Math.min(1, localTime / 0.009);
        const release = Math.min(1, (note.duration - localTime) / 0.1);
        const decay = Math.exp(-localTime * 4.2);
        const phase = localTime * TWO_PI * note.frequency;
        const bell =
          Math.sin(phase) * 0.8 +
          Math.sin(phase * 2 + 0.2) * 0.15 +
          Math.sin(phase * 3 + 0.4) * 0.05;
        sample += bell * attack * release * decay * note.volume;
      }

      const chordTime = time - notes[notes.length - 1].start;

      if (chordTime >= 0) {
        const attack = Math.min(1, chordTime / 0.035);
        const release = Math.min(1, (RUN_INTRO_DURATION_SECONDS - time) / 0.16);
        const decay = Math.exp(-chordTime * 4.5);

        for (const frequency of finalChord) {
          sample +=
            Math.sin(chordTime * TWO_PI * frequency) *
            attack *
            Math.max(0, release) *
            decay *
            0.12;
        }
      }

      return softClip(sample * 0.86);
    },
  );
}

function createJumpBuffer(context, isDoubleJump) {
  const duration = isDoubleJump
    ? DOUBLE_JUMP_DURATION_SECONDS
    : JUMP_DURATION_SECONDS;
  const startFrequency = isDoubleJump ? 330 : 235;
  const endFrequency = isDoubleJump ? 760 : 570;
  let phase = 0;

  return createSoundBuffer(context, duration, (time, progress, sampleRate) => {
    const pitchProgress = easeOutCubic(Math.min(1, progress * 1.18));
    const frequency =
      startFrequency *
      (endFrequency / startFrequency) ** pitchProgress *
      (1 + Math.sin(time * TWO_PI * 9) * 0.012 * progress);
    phase += TWO_PI * frequency / sampleRate;

    const attack = Math.min(1, time / 0.009);
    const release = (1 - progress) ** 1.45;
    const body =
      Math.sin(phase) * 0.72 +
      Math.sin(phase * 2 + 0.35) * 0.18 +
      Math.sin(phase * 3.01) * 0.06;
    const softPop =
      Math.sin(time * TWO_PI * (isDoubleJump ? 190 : 145)) *
      Math.exp(-time * 32) *
      0.24;

    return softClip((body + softPop) * attack * release * 0.82);
  });
}

function createCandyCollectBuffer(context) {
  let bodyPhase = 0;

  return createSoundBuffer(
    context,
    CANDY_DURATION_SECONDS,
    (time, _progress, sampleRate) => {
      const bounceProgress = Math.min(1, time / 0.085);
      const bodyFrequency = 330 + easeOutCubic(bounceProgress) * 205;
      bodyPhase += TWO_PI * bodyFrequency / sampleRate;

      const bodyAttack = Math.min(1, time / 0.006);
      const bodyDecay = Math.exp(-time * 18);
      const roundBody =
        Math.sin(bodyPhase) * 0.78 +
        Math.sin(bodyPhase * 2 + 0.25) * 0.12;
      const softPop =
        Math.sin(time * TWO_PI * 185) *
        Math.exp(-time * 34) *
        0.24;

      const sparkleTime = time - 0.09;
      const sparkle = sparkleTime < 0
        ? 0
        : (
          Math.sin(sparkleTime * TWO_PI * 740) * 0.7 +
          Math.sin(sparkleTime * TWO_PI * 1110 + 0.4) * 0.18
        ) * Math.exp(-sparkleTime * 25) * 0.24;

      return softClip(
        (roundBody * bodyAttack * bodyDecay + softPop + sparkle) * 0.58,
      );
    },
  );
}

function createGhostScareBuffer(context) {
  let phase = 0;
  let noiseState = 0x5f3759df;
  let smoothedNoise = 0;

  return createSoundBuffer(
    context,
    GHOST_SCARE_DURATION_SECONDS,
    (time, progress, sampleRate) => {
      const voiceProgress = easeOutCubic(progress);
      const pitchRise = Math.min(1, progress / 0.13);
      const pitchFall = Math.max(0, (progress - 0.13) / 0.87);
      const baseFrequency =
        progress < 0.13
          ? 210 + 92 * easeOutCubic(pitchRise)
          : 302 * (188 / 302) ** pitchFall;
      const vibratoDepth = 0.01 + voiceProgress * 0.025;
      const frequency =
        baseFrequency *
        (1 + Math.sin(time * TWO_PI * 8.2) * vibratoDepth);
      phase += TWO_PI * frequency / sampleRate;

      const attack = Math.min(1, time / 0.012);
      const release = Math.min(1, (GHOST_SCARE_DURATION_SECONDS - time) / 0.14);
      const breathPulse = 0.88 + Math.sin(time * TWO_PI * 5.4) * 0.12;
      let vowel = 0;

      for (let harmonic = 1; harmonic <= 9; harmonic += 1) {
        const harmonicFrequency = frequency * harmonic;
        const formantWeight =
          0.36 / harmonic +
          gaussian(harmonicFrequency, 720, 230) * 0.34 +
          gaussian(harmonicFrequency, 1180, 330) * 0.24 +
          gaussian(harmonicFrequency, 2350, 520) * 0.08;
        vowel +=
          Math.sin(phase * harmonic + harmonic * 0.08) * formantWeight;
      }

      noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
      const whiteNoise = noiseState / 0xffffffff * 2 - 1;
      smoothedNoise += (whiteNoise - smoothedNoise) * 0.18;
      const consonant =
        smoothedNoise * Math.exp(-time * 42) * 0.42 +
        Math.sin(time * TWO_PI * 112) * Math.exp(-time * 28) * 0.28;
      const tinyEcho =
        Math.sin(phase * 0.505 + 0.8) *
        Math.max(0, progress - 0.42) *
        0.11;

      return softClip(
        (vowel * breathPulse * 0.62 + consonant + tinyEcho) *
          attack *
          Math.max(0, release) *
          0.78,
      );
    },
  );
}

function createGhostFleeBuffer(context) {
  let phase = 0;
  let noiseState = 0x0badcafe;
  let smoothedNoise = 0;

  return createSoundBuffer(
    context,
    GHOST_FLEE_DURATION_SECONDS,
    (time, progress, sampleRate) => {
      const pitchFall = easeOutCubic(progress);
      const baseFrequency = 560 * (225 / 560) ** pitchFall;
      const vibratoDepth = 0.018 + progress * 0.05;
      const frequency =
        baseFrequency *
        (1 + Math.sin(time * TWO_PI * (10.5 + progress * 2)) * vibratoDepth);
      phase += TWO_PI * frequency / sampleRate;

      const attack = Math.min(1, time / 0.008);
      const release = Math.min(1, (GHOST_FLEE_DURATION_SECONDS - time) / 0.16);
      const distanceFade = 1 - progress * 0.48;
      let frightenedVoice = 0;

      for (let harmonic = 1; harmonic <= 8; harmonic += 1) {
        const harmonicFrequency = frequency * harmonic;
        const formantWeight =
          0.3 / harmonic +
          gaussian(harmonicFrequency, 900, 260) * 0.38 +
          gaussian(harmonicFrequency, 1650, 420) * 0.22;
        frightenedVoice +=
          Math.sin(phase * harmonic + harmonic * 0.13) * formantWeight;
      }

      noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
      const whiteNoise = noiseState / 0xffffffff * 2 - 1;
      smoothedNoise += (whiteNoise - smoothedNoise) * 0.22;
      const gasp =
        smoothedNoise * Math.exp(-time * 38) * 0.46 +
        Math.sin(time * TWO_PI * 135) * Math.exp(-time * 25) * 0.2;
      const tremblingTail =
        Math.sin(phase * 0.5 + Math.sin(time * TWO_PI * 14) * 0.35) *
        Math.max(0, progress - 0.28) *
        0.13;

      return softClip(
        (frightenedVoice * 0.68 + gasp + tremblingTail) *
          attack *
          Math.max(0, release) *
          distanceFade *
          0.76,
      );
    },
  );
}

function createSupplyRouletteTickBuffer(context) {
  return createSoundBuffer(
    context,
    SUPPLY_ROULETTE_TICK_DURATION_SECONDS,
    (time) => {
      const attack = Math.min(1, time / 0.0025);
      const decay = Math.exp(-time * 43);
      const phase = time * TWO_PI * 660;
      const electronicBell =
        Math.sin(phase) * 0.62 +
        Math.sin(phase * 2.01 + 0.2) * 0.25 +
        Math.sin(phase * 3.97 + 0.5) * 0.13;
      const click = Math.sin(time * TWO_PI * 1780) * Math.exp(-time * 90) * 0.16;

      return softClip((electronicBell * attack * decay + click) * 0.72);
    },
  );
}

function createSupplyRouletteResultBuffer(context) {
  const notes = [
    { frequency: 1046.5, start: 0, volume: 0.68 },
    { frequency: 1318.51, start: 0.065, volume: 0.66 },
    { frequency: 1567.98, start: 0.13, volume: 0.72 },
    { frequency: 2093, start: 0.205, volume: 0.82 },
  ];

  return createSoundBuffer(
    context,
    SUPPLY_ROULETTE_RESULT_DURATION_SECONDS,
    (time) => {
      let sample = 0;

      notes.forEach((note) => {
        const localTime = time - note.start;

        if (localTime < 0) {
          return;
        }

        const attack = Math.min(1, localTime / 0.004);
        const decay = Math.exp(-localTime * 8.5);
        const phase = localTime * TWO_PI * note.frequency;
        const bell =
          Math.sin(phase) * 0.66 +
          Math.sin(phase * 2.005 + 0.25) * 0.23 +
          Math.sin(phase * 4.01 + 0.55) * 0.11;
        sample += bell * attack * decay * note.volume;
      });

      const shimmerTime = time - 0.205;

      if (shimmerTime >= 0) {
        sample +=
          Math.sin(shimmerTime * TWO_PI * 3135.96) *
          Math.exp(-shimmerTime * 12) *
          0.18;
      }

      return softClip(sample * 0.52);
    },
  );
}

function createSupplyGoBuffer(context) {
  let sweepPhase = 0;

  return createSoundBuffer(
    context,
    SUPPLY_GO_DURATION_SECONDS,
    (time, progress, sampleRate) => {
      const sweepProgress = easeOutCubic(Math.min(1, progress * 1.45));
      const frequency = 340 * (920 / 340) ** sweepProgress;
      sweepPhase += TWO_PI * frequency / sampleRate;

      const attack = Math.min(1, time / 0.006);
      const release = (1 - progress) ** 1.7;
      const risingBody =
        Math.sin(sweepPhase) * 0.7 +
        Math.sin(sweepPhase * 2.01 + 0.25) * 0.21 +
        Math.sin(sweepPhase * 3.98 + 0.5) * 0.09;
      const pop =
        Math.sin(time * TWO_PI * 175) * Math.exp(-time * 34) * 0.32;
      const sparkleTime = time - 0.14;
      const sparkle = sparkleTime >= 0
        ? Math.sin(sparkleTime * TWO_PI * 2349.32) *
          Math.exp(-sparkleTime * 17) *
          0.22
        : 0;

      return softClip(
        risingBody * attack * release * 0.72 + pop + sparkle,
      );
    },
  );
}

function createSupplyTheftVoiceBuffer(context) {
  const chuckles = [
    { start: 0, duration: 0.19, pitch: 340 },
    { start: 0.22, duration: 0.18, pitch: 405 },
    { start: 0.43, duration: 0.36, pitch: 315 },
  ];
  let phase = 0;
  let noiseState = 0x1badb002;
  let smoothedNoise = 0;

  return createSoundBuffer(
    context,
    SUPPLY_THEFT_VOICE_DURATION_SECONDS,
    (time, _progress, sampleRate) => {
      const chuckle = chuckles.find(
        ({ start, duration }) => time >= start && time < start + duration,
      );

      if (!chuckle) {
        return 0;
      }

      const localTime = time - chuckle.start;
      const localProgress = localTime / chuckle.duration;
      const pitchSlide = chuckle === chuckles[2]
        ? 1 - localProgress * 0.22
        : 1 + easeOutCubic(localProgress) * 0.13;
      const frequency =
        chuckle.pitch *
        pitchSlide *
        (1 + Math.sin(localTime * TWO_PI * 11) * 0.025);
      phase += TWO_PI * frequency / sampleRate;

      const attack = Math.min(1, localTime / 0.009);
      const release = (1 - localProgress) ** 0.72;
      let voice = 0;

      for (let harmonic = 1; harmonic <= 8; harmonic += 1) {
        const harmonicFrequency = frequency * harmonic;
        const formantWeight =
          0.3 / harmonic +
          gaussian(harmonicFrequency, 520, 210) * 0.31 +
          gaussian(harmonicFrequency, 1850, 460) * 0.24;
        voice +=
          Math.sin(phase * harmonic + harmonic * 0.13) * formantWeight;
      }

      noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
      const whiteNoise = noiseState / 0xffffffff * 2 - 1;
      smoothedNoise += (whiteNoise - smoothedNoise) * 0.24;
      const breath =
        smoothedNoise * Math.exp(-localTime * 28) * 0.24;
      const bounce = 0.9 + Math.sin(localTime * TWO_PI * 7) * 0.1;

      return softClip(
        (voice * bounce * 0.7 + breath) * attack * release * 0.82,
      );
    },
  );
}

function createLauncherCountdownBuffer(context) {
  return createSoundBuffer(
    context,
    LAUNCHER_COUNTDOWN_DURATION_SECONDS,
    (time) => {
      const attack = Math.min(1, time / 0.003);
      const decay = Math.exp(-time * 24);
      const phase = time * TWO_PI * 540;
      const signal =
        Math.sin(phase) * 0.68 +
        Math.sin(phase * 2.01 + 0.2) * 0.23 +
        Math.sin(phase * 4.02 + 0.55) * 0.09;
      const click =
        Math.sin(time * TWO_PI * 1480) * Math.exp(-time * 70) * 0.18;

      return softClip(signal * attack * decay * 0.82 + click);
    },
  );
}

function createLauncherFireBuffer(context) {
  let sweepPhase = 0;
  let noiseState = 0xc0ffee;
  let smoothedNoise = 0;

  return createSoundBuffer(
    context,
    LAUNCHER_FIRE_DURATION_SECONDS,
    (time, progress, sampleRate) => {
      const sweepProgress = easeOutCubic(progress);
      const frequency = 185 * (980 / 185) ** sweepProgress;
      sweepPhase += TWO_PI * frequency / sampleRate;

      noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
      const whiteNoise = noiseState / 0xffffffff * 2 - 1;
      smoothedNoise += (whiteNoise - smoothedNoise) * 0.1;
      const airyNoise = whiteNoise - smoothedNoise;
      const whooshEnvelope = Math.sin(Math.PI * progress) * (1 - progress * 0.5);
      const launchTone =
        Math.sin(sweepPhase) * 0.64 +
        Math.sin(sweepPhase * 2.02 + 0.4) * 0.2;
      const muzzlePop =
        Math.sin(time * TWO_PI * 118) * Math.exp(-time * 24) * 0.5;
      const release = (1 - progress) ** 0.8;

      return softClip(
        launchTone * release * 0.52 +
          airyNoise * whooshEnvelope * 0.3 +
          muzzlePop,
      );
    },
  );
}

function createLauncherExplosionBuffer(context) {
  let boomPhase = 0;
  let noiseState = 0xb00b135;
  let smoothedNoise = 0;

  return createSoundBuffer(
    context,
    LAUNCHER_EXPLOSION_DURATION_SECONDS,
    (time, progress, sampleRate) => {
      const frequency = 145 * (48 / 145) ** easeOutCubic(progress);
      boomPhase += TWO_PI * frequency / sampleRate;

      noiseState = (noiseState * 1103515245 + 12345) >>> 0;
      const whiteNoise = noiseState / 0xffffffff * 2 - 1;
      smoothedNoise += (whiteNoise - smoothedNoise) * 0.08;
      const crackle = whiteNoise - smoothedNoise;
      const impact =
        Math.sin(time * TWO_PI * 72) * Math.exp(-time * 19) * 0.72;
      const lowBoom = Math.sin(boomPhase) * Math.exp(-time * 4.2) * 0.9;
      const debris = crackle * Math.exp(-time * 6.5) * 0.46;
      const pop =
        Math.sin(time * TWO_PI * 310) * Math.exp(-time * 31) * 0.24;

      return softClip((impact + lowBoom + debris + pop) * 0.72);
    },
  );
}

function createCandyVacuumLoopBuffer(context) {
  let whirlPhase = 0;

  return createSoundBuffer(
    context,
    CANDY_VACUUM_LOOP_DURATION_SECONDS,
    (time, progress, sampleRate) => {
      const frequency = 187.5 + Math.sin(progress * TWO_PI) * 48;
      whirlPhase += TWO_PI * frequency / sampleRate;
      const motor =
        Math.sin(whirlPhase) * 0.5 +
        Math.sin(whirlPhase * 2 + 0.45) * 0.16;
      const air =
        Math.sin(time * TWO_PI * 625 + Math.sin(progress * TWO_PI) * 1.4) *
          0.18 +
        Math.sin(time * TWO_PI * 812.5 + 1.1) * 0.12;
      const swirl = 0.82 + Math.sin(progress * TWO_PI * 2) * 0.18;

      return softClip((motor + air) * swirl * 0.72);
    },
  );
}

function createGameOverBuffer(context) {
  const notes = [
    { start: 0, duration: 0.17, frequency: 659.25, endFrequency: 659.25 },
    { start: 0.135, duration: 0.18, frequency: 523.25, endFrequency: 523.25 },
    { start: 0.28, duration: 0.9, frequency: 392, endFrequency: 246.94 },
  ].map((note) => ({ ...note, phase: 0 }));

  return createSoundBuffer(
    context,
    GAME_OVER_DURATION_SECONDS,
    (time, progress, sampleRate) => {
      let sample = 0;

      notes.forEach((note) => {
        const localTime = time - note.start;

        if (localTime < 0 || localTime >= note.duration) {
          return;
        }

        const noteProgress = localTime / note.duration;
        const slide = easeOutCubic(noteProgress);
        const frequency =
          note.frequency * (note.endFrequency / note.frequency) ** slide;
        const vibrato = 1 + Math.sin(localTime * TWO_PI * 5) * 0.004;
        note.phase += TWO_PI * frequency * vibrato / sampleRate;
        const attack = Math.min(1, localTime / 0.006);
        const release = Math.min(1, (1 - noteProgress) / 0.25);
        const body =
          Math.sin(note.phase) * 0.72 +
          Math.sin(note.phase * 2 + 0.15) * 0.2 +
          Math.sin(note.phase * 3 + 0.3) * 0.08;

        sample += body * attack * release * Math.exp(-noteProgress * 1.1);
      });

      return softClip(sample * 0.8 * Math.min(1, (1 - progress) / 0.06));
    },
  );
}

function createObstacleHitBuffer(context) {
  let impactPhase = 0;
  let noiseState = 0x5a17c0de;
  let smoothedNoise = 0;

  return createSoundBuffer(
    context,
    OBSTACLE_HIT_DURATION_SECONDS,
    (time, progress, sampleRate) => {
      const frequency = 195 * (72 / 195) ** easeOutCubic(progress);
      impactPhase += TWO_PI * frequency / sampleRate;

      noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
      const whiteNoise = noiseState / 0xffffffff * 2 - 1;
      const smoothing = 1 - Math.exp(-TWO_PI * 2800 / sampleRate);
      smoothedNoise += (whiteNoise - smoothedNoise) * smoothing;
      const attack = Math.min(1, time / 0.0015);
      const release = (1 - progress) ** 2;
      const slap = smoothedNoise * Math.exp(-time * 34) * 1.45;
      const thump = Math.sin(impactPhase) * Math.exp(-time * 22) * 0.85;
      const crack =
        Math.sin(time * TWO_PI * 710) * Math.exp(-time * 85) * 0.24;

      return softClip((slap + thump + crack) * attack * release);
    },
  );
}

function createPumpkinCrushBuffer(context) {
  let crushPhase = 0;
  let noiseState = 0xdecafbad;
  let smoothedNoise = 0;

  return createSoundBuffer(
    context,
    PUMPKIN_CRUSH_DURATION_SECONDS,
    (time, progress, sampleRate) => {
      const frequency = 165 * (42 / 165) ** easeOutCubic(progress);
      crushPhase += TWO_PI * frequency / sampleRate;

      noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
      const whiteNoise = noiseState / 0xffffffff * 2 - 1;
      smoothedNoise += (whiteNoise - smoothedNoise) * 0.055;
      const rindCrack =
        (whiteNoise - smoothedNoise) * Math.exp(-time * 11) * 0.4;
      const softBody =
        Math.sin(crushPhase) * Math.exp(-time * 4.8) * 0.82;
      const wetSplat =
        Math.sin(time * TWO_PI * 74) * Math.exp(-time * 15) * 0.58 +
        Math.sin(Math.max(0, time - 0.07) * TWO_PI * 53) *
          Math.exp(-Math.max(0, time - 0.07) * 18) *
          (time >= 0.07 ? 0.32 : 0);

      return softClip((softBody + wetSplat + rindCrack) * 0.78);
    },
  );
}

function createCandyPartyBurstBuffer(context) {
  let noiseState = 0xf00dcafe;
  let smoothedNoise = 0;
  const sparkleNotes = [1760, 2093, 2637.02, 3135.96];

  return createSoundBuffer(
    context,
    CANDY_PARTY_BURST_DURATION_SECONDS,
    (time) => {
      noiseState = (noiseState * 1103515245 + 12345) >>> 0;
      const whiteNoise = noiseState / 0xffffffff * 2 - 1;
      smoothedNoise += (whiteNoise - smoothedNoise) * 0.1;
      const paperSnap =
        (whiteNoise - smoothedNoise) * Math.exp(-time * 15) * 0.48;
      const pop =
        Math.sin(time * TWO_PI * 105) * Math.exp(-time * 30) * 0.82;
      let sparkle = 0;

      sparkleNotes.forEach((frequency, index) => {
        const localTime = time - 0.045 - index * 0.045;

        if (localTime < 0) {
          return;
        }

        sparkle +=
          Math.sin(localTime * TWO_PI * frequency) *
          Math.exp(-localTime * 10.5) *
          0.2;
      });

      return softClip((pop + paperSnap + sparkle) * 0.72);
    },
  );
}

function createSoundBuffer(context, durationSeconds, sampleAtTime) {
  const frameCount = Math.ceil(context.sampleRate * durationSeconds);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    const time = index / context.sampleRate;
    const progress = index / Math.max(1, frameCount - 1);
    channel[index] = sampleAtTime(time, progress, context.sampleRate);
  }

  return buffer;
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function gaussian(value, center, width) {
  return Math.exp(-(((value - center) / width) ** 2));
}

function softClip(value) {
  return Math.tanh(value);
}
