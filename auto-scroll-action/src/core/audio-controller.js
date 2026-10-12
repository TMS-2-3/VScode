export function createAudioController() {
  let audioContext = null;

  function getAudioContext() {
    if (audioContext) {
      return audioContext;
    }

    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
    return audioContext;
  }

  function unlock() {
    const context = getAudioContext();

    if (context?.state === "suspended") {
      void context.resume();
    }
  }

  function playTone({
    startFrequency,
    endFrequency,
    duration,
    volume,
    type = "sine",
    delay = 0,
  }) {
    const context = getAudioContext();

    if (!context) {
      return;
    }

    unlock();
    const startTime = context.currentTime + delay;
    const endTime = startTime + duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, endTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(endTime);
  }

  function playJump() {
    playTone({
      startFrequency: 220,
      endFrequency: 430,
      duration: 0.11,
      volume: 0.105,
      type: "square",
    });
  }

  function playCandyCollect() {
    playTone({
      startFrequency: 660,
      endFrequency: 880,
      duration: 0.08,
      volume: 0.12,
      type: "triangle",
    });
    playTone({
      startFrequency: 880,
      endFrequency: 1180,
      duration: 0.08,
      volume: 0.09,
      type: "triangle",
      delay: 0.055,
    });
  }

  return {
    playCandyCollect,
    playJump,
    unlock,
  };
}
