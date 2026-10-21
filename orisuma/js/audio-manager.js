export class AudioManager {
  constructor() {
    this.enabled = localStorage.getItem("orisuma.sound") !== "off";
    this.context = null;
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("orisuma.sound", this.enabled ? "on" : "off");
    this.play("ui");
  }

  play(kind) {
    if (!this.enabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!this.context) this.context = new AudioContext();

    const presets = {
      ui: [420, 0.04, "sine", 0.045],
      jump: [520, 0.06, "triangle", 0.055],
      ledge: [340, 0.05, "triangle", 0.045],
      grab: [310, 0.055, "square", 0.045],
      pummel: [190, 0.04, "square", 0.05],
      throw: [135, 0.09, "sawtooth", 0.065],
      dodge: [620, 0.045, "sine", 0.04],
      tech: [500, 0.045, "triangle", 0.045],
      bounce: [180, 0.07, "square", 0.055],
      clank: [980, 0.055, "square", 0.055],
      projectile: [680, 0.07, "sawtooth", 0.05],
      finalSmash: [740, 0.32, "sawtooth", 0.075],
      finalPunch: [105, 0.2, "sawtooth", 0.085],
      shieldBreak: [95, 0.22, "sawtooth", 0.075],
      justGuard: [920, 0.12, "triangle", 0.065],
      respawn: [760, 0.12, "triangle", 0.05],
      hit: [150, 0.08, "square", 0.07],
      shield: [260, 0.05, "sine", 0.04],
      ko: [85, 0.24, "sawtooth", 0.08]
    };
    const [freq, duration, type, volume] = presets[kind] || presets.ui;
    const ctx = this.context;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (kind === "ko") osc.frequency.exponentialRampToValueAtTime(38, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }
}
