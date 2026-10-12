export class RollbackManager {
  constructor(limit = 180) {
    this.limit = limit;
    this.states = [];
    this.pendingFrom = null;
    this.revision = 0;
    this.rollbackCount = 0;
    this.lastRollbackFrames = 0;
  }

  capture(match) {
    const state = {
      frame: match.frame,
      elapsed: match.elapsed,
      countdown: match.countdown,
      eventSeq: match.eventSeq,
      lastHash: match.lastHash,
      finalSmash: cloneValue(match.finalSmash),
      projectiles: cloneValue(match.projectiles || []),
      projectileSeq: match.projectileSeq || 0,
      fighters: Array.from(match.fighters.entries()).map(([id, fighter]) => [id, cloneValue(fighter)])
    };
    const last = this.states.at(-1);
    if (!last || last.frame < state.frame) {
      this.states.push(state);
    } else if (last.frame === state.frame) {
      this.states[this.states.length - 1] = state;
    } else {
      const existing = this.states.findIndex(item => item.frame >= state.frame);
      if (existing >= 0 && this.states[existing].frame === state.frame) this.states[existing] = state;
      else this.states.splice(existing < 0 ? this.states.length : existing, 0, state);
    }
    const excess = this.states.length - (this.limit + 1);
    if (excess > 0) this.states.splice(0, excess);
  }

  request(frame, currentFrame) {
    const requested = Math.max(1, Math.floor(frame));
    const oldest = this.oldestFrame + 1;
    if (requested < oldest || requested > currentFrame) return false;
    this.pendingFrom = this.pendingFrom === null ? requested : Math.min(this.pendingFrom, requested);
    return true;
  }

  consumeRequest() {
    const frame = this.pendingFrom;
    this.pendingFrom = null;
    return frame;
  }

  restore(match, frame) {
    const state = this.states.find(item => item.frame === frame);
    if (!state) return false;
    match.frame = state.frame;
    match.elapsed = state.elapsed;
    match.countdown = state.countdown;
    match.eventSeq = state.eventSeq;
    match.lastHash = state.lastHash;
    match.finalSmash = cloneValue(state.finalSmash);
    match.projectiles = cloneValue(state.projectiles || []);
    match.projectileSeq = state.projectileSeq || 0;
    match.events = [];
    match.fighters = new Map(state.fighters.map(([id, fighter]) => [id, cloneValue(fighter)]));
    this.states = this.states.filter(item => item.frame <= frame);
    return true;
  }

  begin() {
    this.revision += 1;
  }

  complete(fromFrame, toFrame) {
    this.rollbackCount += 1;
    this.lastRollbackFrames = Math.max(0, toFrame - fromFrame + 1);
  }

  get oldestFrame() {
    return this.states[0]?.frame ?? 0;
  }

  get newestFrame() {
    return this.states.at(-1)?.frame ?? 0;
  }
}

function cloneValue(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
