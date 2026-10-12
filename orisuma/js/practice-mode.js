import { BattleSimulation, normalizeBattleInput } from "./battle-simulation.js";
import { STAGES } from "./constants.js";
import { emptyInput } from "./utils.js";

const FIXED_STEP = 1 / 60;
const MAX_CATCH_UP_STEPS = 4;

export class PracticeMode {
  constructor({ inputManager, audioManager, assetManager, playerNameProvider }) {
    this.input = inputManager;
    this.audio = audioManager;
    this.assets = assetManager;
    this.playerNameProvider = playerNameProvider;
    this.simulation = new BattleSimulation({
      onEvent: event => this.audio.play(event.kind)
    });
    this.active = false;
    this.data = null;
    this.cachedSnapshot = null;
    this.lastUpdateAt = 0;
    this.accumulator = 0;
  }

  start(options) {
    this.assets.preload({ stage: options.stage, characters: [options.player, options.enemy] });
    this.data = this.createPractice(options);
    this.cachedSnapshot = null;
    this.active = true;
    this.lastUpdateAt = performance.now();
    this.accumulator = 0;
  }

  exit() {
    this.active = false;
    this.data = null;
    this.cachedSnapshot = null;
  }

  update() {
    if (!this.active || !this.data) return;
    const now = performance.now();
    const dt = Math.min(0.1, Math.max(0, (now - this.lastUpdateAt) / 1000));
    this.lastUpdateAt = now;
    if (dt <= 0) return;

    this.data.events = [];
    this.accumulator += dt;
    const playerInput = normalizeBattleInput(this.input.readInput());
    const frameInputs = new Map([
      ["practice-player", playerInput],
      ["practice-dummy", emptyInput()]
    ]);
    let steps = 0;
    while (this.accumulator >= FIXED_STEP && steps < MAX_CATCH_UP_STEPS) {
      this.simulation.step(this.data, frameInputs, FIXED_STEP);
      this.accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (steps > 0) this.cachedSnapshot = null;
    if (steps === MAX_CATCH_UP_STEPS) this.accumulator = Math.min(this.accumulator, FIXED_STEP);
  }

  snapshot() {
    if (!this.data) return null;
    if (!this.cachedSnapshot) {
      this.cachedSnapshot = this.simulation.snapshot(this.data, { phase: "practice" });
    }
    return this.cachedSnapshot;
  }

  createPractice(options) {
    const stage = STAGES[options.stage] || STAGES.battlefield;
    const mainPlatform = stage.platforms.find(platform => platform.type === "main") || stage.platforms[0];
    const rules = {
      mode: "practice",
      stage: stage.id,
      debug: options.debug,
      gameSpeed: 1,
      finalSmash: Boolean(options.finalSmash),
      hp: 999,
      stocks: 0,
      timeLimit: 0
    };
    const match = this.simulation.createMatch({ id: "practice", rules, stage });
    const playerSpawn = stage.spawn[0] || [460, 410];
    const dummySpawn = stage.spawn[1] || [820, 410];
    const player = this.simulation.createFighter({
      id: "practice-player",
      name: this.playerNameProvider(),
      characterId: options.player,
      slot: 1,
      colorIndex: 0,
      spawn: playerSpawn,
      facing: 1,
      rules,
      hp: 999
    });
    const dummy = this.simulation.createFighter({
      id: "practice-dummy",
      name: "Target",
      characterId: options.enemy,
      slot: 2,
      colorIndex: 1,
      spawn: dummySpawn,
      facing: -1,
      rules,
      hp: 999,
      isDummy: true,
      inputEnabled: false,
      spawnOnGround: true
    });
    dummy.y = mainPlatform.y - dummy.h / 2;
    dummy.spawnY = dummy.y;
    match.fighters.set(player.id, player);
    match.fighters.set(dummy.id, dummy);
    return match;
  }
}
