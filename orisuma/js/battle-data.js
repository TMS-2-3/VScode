export const DEFAULT_CHARACTER_ID = "nova";

export const WEIGHT_CLASSES = {
  ultraLight: {
    id: "ultraLight",
    label: "超軽量",
    knockbackTaken: 1.18,
    pushPriority: 0
  },
  light: {
    id: "light",
    label: "軽量",
    knockbackTaken: 1.09,
    pushPriority: 1
  },
  middle: {
    id: "middle",
    label: "中量",
    knockbackTaken: 1,
    pushPriority: 2
  },
  heavy: {
    id: "heavy",
    label: "重量",
    knockbackTaken: 0.92,
    pushPriority: 3
  },
  ultraHeavy: {
    id: "ultraHeavy",
    label: "超重量",
    knockbackTaken: 0.84,
    pushPriority: 4
  }
};

export const BODY_COLLISION = {
  inputThreshold: 0.2,
  separation: 0.05,
  airSeparationScale: 0.08
};

export const CLANK = {
  priorityRange: 9,
  maxReboundFrames: 58
};

export const SMASH_CHARGE = {
  maxDuration: 3,
  autoReleaseDuration: 10,
  maxDamageMultiplier: 1.25,
  maxKnockbackMultiplier: 1.15
};

export const JAB_COMBO = Object.freeze({
  inputBufferFrames: 9,
  inputBuffer: 9 / 60,
  followupWindowFrames: 45,
  followupWindow: 45 / 60
});

export const NOVA_CHARGE = {
  maxDuration: 4,
  maxDamageMultiplier: 1.6
};

export const NOVA_RECOVERY = {
  thrustDuration: 1.05,
  verticalScale: 0.7,
  neutralSpeed: -500,
  upSpeed: -585,
  downSpeed: -390,
  horizontalAcceleration: 760,
  horizontalMaxSpeed: 285,
  slowFallGravityScale: 0.58,
  fastFallGravityScale: 1.38,
  slowFallSpeedScale: 0.72,
  fastFallSpeedScale: 1.22,
  landingLag: 0.46
};

export const NOVA_BODY_SIZE = Object.freeze({ width: 38, height: 66 });

export const NOVA_AIR_DOWN_FLAME = Object.freeze({
  originY: 34,
  width: NOVA_BODY_SIZE.width + 14,
  height: NOVA_BODY_SIZE.height * 0.85 * 1.8
});

export const NOVA_DOWN_SMASH_EXPLOSION = Object.freeze({
  width: 180,
  height: 52,
  centerY: 24
});

export const NOVA_MOVE_MOTION = {
  dashAttackDistance: 156.638,
  dashAttackDuration: 0.5053,
  sideSmashStepDistance: 22,
  sideSmashStepDuration: 0.18,
  upSmashImpulseAt: 0.14,
  upSmashJumpHeightRatio: 0.5,
  downSmashImpulseAt: 0.16,
  downSmashJumpHeightRatio: 0.15,
  upAirRiseDistance: NOVA_BODY_SIZE.height * 2,
  upAirRiseDuration: 0.2465,
  upAirActiveEnd: 0.34,
  upAirRecoveryFrames: 60,
  upAirRecoveryDuration: 60 / 60
};

export const NOVA_FINAL_SMASH = Object.freeze({
  transformDuration: 0.55,
  speechDuration: 1.2,
  punchStart: 1.75,
  punchTravelDuration: 0.18,
  punchAt: 1.93,
  punchActiveDuration: 0.16,
  recoveryDuration: 0.52,
  totalDuration: 2.61,
  normalArmLength: 34,
  loadedArmLength: 60,
  maxArmLength: 178,
  normalArmThickness: 16,
  maxArmThickness: NOVA_BODY_SIZE.height * 1.08,
  hitbox: Object.freeze({
    offsetX: 107,
    offsetY: -58,
    width: 190,
    height: 84
  })
});

export const FINAL_SMASH = {
  maxGauge: 100,
  dealtGainPerDamage: 0.3,
  takenGainPerDamage: 0.5,
  fullGaugeAfterKo: 98,
  neutralInputThreshold: 0.35,
  defaultActiveDuration: NOVA_FINAL_SMASH.totalDuration,
  punchStart: NOVA_FINAL_SMASH.punchStart,
  punchAt: NOVA_FINAL_SMASH.punchAt,
  punchActiveDuration: NOVA_FINAL_SMASH.punchActiveDuration
};

export const LEDGE = {
  grabRangeX: 42,
  grabRangeAbove: 22,
  grabRangeBelow: 86,
  hangOffsetX: 18,
  hangOffsetY: 47,
  climbInset: 28,
  climbDuration: 0.38,
  attackInset: 22,
  attackClimbDuration: 0.34,
  rollInset: 92,
  rollDistanceMultiplier: 1.2,
  rollDuration: 0.42,
  jumpSpeedMultiplier: 1.3,
  jumpInvuln: 0.4,
  dropSpeed: 130,
  cooldown: 0.38,
  invuln: 0.45,
  attackInvuln: 0.24,
  rollInvuln: 0.72,
  climbLag: 0.22,
  rollLag: 0.16,
  attackLag: 0.16,
  maxRegrabs: 5,
  maxHold: 6
};

export const DODGE = {
  spotDodge: {
    id: "spotDodge",
    duration: 0.48,
    invulnStart: 0.05,
    invulnEnd: 0.27
  },
  roll: {
    id: "roll",
    duration: 0.4,
    invulnStart: 0.04,
    invulnEnd: 0.23,
    speed: 422.1
  },
  airDodge: {
    id: "airDodge",
    duration: 0.5,
    invulnStart: 0.03,
    invulnEnd: 0.26,
    speed: 364,
    neutralXScale: 0.28,
    neutralYScale: 0.18
  }
};

export const SHIELD = {
  max: 60,
  regen: 8.5,
  holdDrain: 7.56,
  hitDrainPause: 0.5,
  minSize: 28,
  maxSize: 48,
  hitBase: 4,
  hitScale: 1.15,
  stunScale: 0.018,
  breakStun: 5,
  breakLaunchY: -520,
  perfectWindow: 5 / 60,
  perfectFlash: 0.18,
  perfectAttackerFreeze: 0.2,
  perfectDefenderFreeze: 0.035,
  releaseLag: 7 / 60,
  radius: 48
};

export const GRAB = {
  holdTime: 1.25,
  escapeMashValue: 0.09,
  pummelCooldown: 0.32,
  throwDamage: 5,
  throwBaseKnockback: 310,
  throwGrowth: 4.8,
  releaseInvuln: 0.18,
  variants: {
    standing: { startup: 0.1, active: 0.1, total: 0.42, offsetX: 20, offsetY: -38, w: 58, h: 54, velocityScale: 0.35 },
    dash: { startup: 0.14, active: 0.11, total: 0.55, offsetX: 25, offsetY: -38, w: 72, h: 54, velocityScale: 0.82 },
    pivot: { startup: 0.16, active: 0.11, total: 0.58, offsetX: 24, offsetY: -38, w: 76, h: 54, velocityScale: 0.45 }
  }
};

export const NOVA_GRAB_MOTION = Object.freeze({
  frontShoulderX: 19,
  frontShoulderY: -13,
  frontArmLength: 36,
  holdReach: 1.64,
  targetInset: 4,
  pummelDuration: 0.2,
  pummelRearReach: 3.15,
  variantReach: Object.freeze({
    standing: 1.64,
    dash: 2.17,
    pivot: 2.25
  })
});

export const NOVA_THROW_MOTION = Object.freeze({
  forwardReleaseAt: 0.17,
  backTossAt: 0.13,
  backReleaseAt: 0.31,
  upReleaseAt: 0.2,
  downTransferAt: 0.13,
  downReleaseAt: 0.35
});

export const KNOCKBACK = {
  diMaxRadians: 18 * Math.PI / 180,
  lsiMin: 0.92,
  lsiMax: 1.08,
  tumbleThreshold: 360,
  horizontalDecay: 165,
  verticalDecay: 95,
  hitstunBase: 0.08,
  hitstunScale: 1 / 1450,
  maxHitstun: 1.65,
  rageStart: 35,
  rageEnd: 150,
  rageMax: 1.1,
  stalePenalty: 0.075,
  staleQueueSize: 9
};

export const TECH = {
  window: 0.15,
  lockout: 40 / 60,
  minSpeed: 520,
  maxSpeed: 1500,
  invuln: 0.3,
  groundLag: 0.16,
  wallLag: 0.18,
  ceilingLag: 0.18,
  failLag: 0.36,
  bounceX: 0.58,
  bounceY: 0.52,
  wallBounceX: 0.62,
  wallBounceY: 0.82,
  slopeBounceNormal: 0.62,
  slopeBounceTangent: 0.82,
  ceilingBounceX: 0.82,
  ceilingBounceY: 0.62,
  shallowGroundBounceRetention: 0.92
};

export const KNOCKDOWN = {
  minImpactSpeed: 280,
  invuln: 0.32,
  maxDuration: 6,
  getupDuration: 0.38,
  getupInvuln: 0.1
};

export const LANDING = {
  normal: 0.04,
  attack: 0.16,
  airDodge: 0.36,
  hard: 0.24
};

export const MOVEMENT = {
  dashTapWindow: 0.16,
  dashDuration: 0.2,
  turnStepDuration: 0.14,
  runTurnDuration: 15 / 60,
  groundRunRampDuration: 0.4,
  groundRunStartSpeedScale: 0.4,
  airAccelerationMultiplier: 1.4,
  normalGravityMultiplier: 0.82,
  normalFallSpeedMultiplier: 0.7,
  jumpDurationMultiplier: 1.2,
  fastFallStartVy: -60,
  airControlWhenLaunched: 0.18,
  hitstunFriction: 0.992,
  aerialAttackControl: Object.freeze({
    airUp: Object.freeze({ accelerationScale: 0.3, maxSpeedScale: 0.55 }),
    airDown: Object.freeze({ accelerationScale: 0.35, maxSpeedScale: 0.8 })
  })
};

export const SHORT_HOP_MODES = Object.freeze({
  release: "release",
  down: "down",
  both: "both"
});

export const SHORT_HOP = Object.freeze({
  defaultMode: SHORT_HOP_MODES.both,
  heightRatio: 0.5
});

export function normalizeShortHopMode(value) {
  return Object.values(SHORT_HOP_MODES).includes(value) ? value : SHORT_HOP.defaultMode;
}

export const RESPAWN = {
  platformTime: 1.05,
  invuln: 2.8,
  platformOffsetY: -118
};

export const TIME_LIMIT = {
  infinite: 0,
  min: 60,
  max: 900,
  step: 10
};

export const PLAYER_LIMITS = Object.freeze({ min: 2, max: 8 });

export const STAGE_SCALE_BY_PLAYER_COUNT = Object.freeze({
  4: 1.2,
  5: 1.5,
  6: 1.8,
  7: 2,
  8: 2.3
});

export const DEFAULT_RULES = {
  mode: "stock",
  stocks: 3,
  timeLimit: 420,
  hp: 180,
  maxPlayers: 4,
  stage: "battlefield",
  gameSpeed: 1,
  inputDelay: 2,
  finalSmash: true,
  debug: false
};

export function normalizeTimeLimit(value, fallback = DEFAULT_RULES.timeLimit) {
  const parsed = Number.parseInt(value, 10);
  const fallbackValue = Number.parseInt(fallback, 10);
  const candidate = Number.isFinite(parsed) ? parsed : fallbackValue;
  if (candidate === TIME_LIMIT.infinite) return TIME_LIMIT.infinite;
  const finite = Number.isFinite(candidate) ? candidate : DEFAULT_RULES.timeLimit;
  const clamped = Math.max(TIME_LIMIT.min, Math.min(TIME_LIMIT.max, finite));
  return Math.round(clamped / TIME_LIMIT.step) * TIME_LIMIT.step;
}

export const MAIN_PLATFORM_DEPTH = 360;

export const STAGE_BLAST_ZONE = Object.freeze({
  left: -520 - NOVA_BODY_SIZE.height,
  right: 1800 + NOVA_BODY_SIZE.height,
  top: -360 - NOVA_BODY_SIZE.height,
  bottom: 1020 + NOVA_BODY_SIZE.height * 3
});

export const STAGES = {
  final: {
    id: "final",
    name: "終点風",
    spawn: [
      [300, 410],
      [980, 410],
      [520, 410],
      [760, 410],
      [410, 410],
      [870, 410],
      [610, 410],
      [670, 410]
    ],
    platforms: [
      { x: 240, y: 500, w: 800, h: 28, depth: MAIN_PLATFORM_DEPTH, shape: "invertedTriangle", type: "main" }
    ],
    blast: { ...STAGE_BLAST_ZONE }
  },
  small: {
    id: "small",
    name: "小戦場風",
    spawn: [
      [300, 410],
      [980, 410],
      [475, 330],
      [805, 330],
      [520, 410],
      [760, 410],
      [365, 330],
      [915, 330]
    ],
    platforms: [
      { x: 240, y: 510, w: 800, h: 28, depth: MAIN_PLATFORM_DEPTH, shape: "invertedTriangle", type: "main" },
      { x: 310, y: 380, w: 220, h: 18, type: "soft" },
      { x: 750, y: 380, w: 220, h: 18, type: "soft" }
    ],
    blast: { ...STAGE_BLAST_ZONE }
  },
  battlefield: {
    id: "battlefield",
    name: "戦場風",
    spawn: [
      [300, 410],
      [980, 410],
      [475, 315],
      [805, 315],
      [520, 410],
      [760, 410],
      [365, 315],
      [915, 315]
    ],
    platforms: [
      { x: 240, y: 510, w: 800, h: 28, depth: MAIN_PLATFORM_DEPTH, shape: "invertedTriangle", type: "main" },
      { x: 310, y: 380, w: 220, h: 18, type: "soft" },
      { x: 750, y: 380, w: 220, h: 18, type: "soft" },
      { x: 530, y: 250, w: 220, h: 18, type: "soft" }
    ],
    blast: { ...STAGE_BLAST_ZONE }
  }
};

export function getStageDefinition(stageId = DEFAULT_RULES.stage) {
  return STAGES[stageId] || STAGES[DEFAULT_RULES.stage] || STAGES.battlefield;
}

export function getStageScaleForPlayerCount(playerCount = PLAYER_LIMITS.min) {
  const count = Math.max(PLAYER_LIMITS.min, Math.min(PLAYER_LIMITS.max, Math.round(Number(playerCount) || 0)));
  return STAGE_SCALE_BY_PLAYER_COUNT[count] || 1;
}

export function getScaledStageDefinition(stageId = DEFAULT_RULES.stage, playerCount = PLAYER_LIMITS.min) {
  const stage = getStageDefinition(stageId);
  const scale = getStageScaleForPlayerCount(playerCount);
  const mainPlatform = stage.platforms.find(platform => platform.type === "main") || stage.platforms[0];
  const anchorX = mainPlatform.x + mainPlatform.w / 2;
  const scaleX = value => anchorX + (value - anchorX) * scale;
  const mainRight = mainPlatform.x + mainPlatform.w;
  const blastLeftGap = mainPlatform.x - stage.blast.left;
  const blastRightGap = stage.blast.right - mainRight;
  const scaledMainLeft = scaleX(mainPlatform.x);
  const scaledMainRight = scaleX(mainRight);

  return {
    ...stage,
    scale,
    playerCount: Math.max(PLAYER_LIMITS.min, Math.min(PLAYER_LIMITS.max, Math.round(Number(playerCount) || 0))),
    spawn: stage.spawn.map(([x, y]) => [scaleX(x), y]),
    platforms: stage.platforms.map(platform => ({
      ...platform,
      x: scaleX(platform.x),
      w: platform.w * scale
    })),
    blast: {
      left: scaledMainLeft - blastLeftGap,
      right: scaledMainRight + blastRightGap,
      top: stage.blast.top,
      bottom: stage.blast.bottom
    }
  };
}

const NOVA_JAB_ONE = {
  id: "jab1",
  label: "弱1",
  total: 0.253,
  chainTo: "jab2",
  chainOpen: 0.11,
  chainClose: 0.253,
  velocityScale: 0.45,
  hits: [{ id: "punch", start: 0.05, duration: 0.06, damage: 3, hpDamage: 3, baseKnockback: 55, knockbackGrowth: 0.7, angle: 45, hitlag: 0.035, shieldDamage: 4.2, mirror: true, offsetX: 29, offsetY: -42, w: 48, h: 34 }]
};

const NOVA_MOVES = {
  neutral: NOVA_JAB_ONE,
  jab1: NOVA_JAB_ONE,
  jab2: {
    id: "jab2",
    label: "弱2",
    total: 0.276,
    chainTo: "jab3",
    chainOpen: 0.12,
    chainClose: 0.276,
    velocityScale: 0.45,
    hits: [{ id: "punch", start: 0.05, duration: 0.06, damage: 4, hpDamage: 4, baseKnockback: 65, knockbackGrowth: 0.8, angle: 45, hitlag: 0.04, shieldDamage: 5.5, mirror: true, offsetX: 31, offsetY: -43, w: 50, h: 34 }]
  },
  jab3: {
    id: "jab3",
    label: "弱3",
    total: 0.437,
    velocityScale: 0.4,
    hits: [{ id: "finish", start: 0.07, duration: 0.08, damage: 5, hpDamage: 5, baseKnockback: 300, knockbackGrowth: 4, angle: 40, hitlag: 0.055, shieldDamage: 7.5, mirror: true, offsetX: 34, offsetY: -44, w: 60, h: 38 }]
  },
  dashAttack: {
    id: "dashAttack",
    label: "ダッシュ攻撃",
    total: 0.98,
    velocityScale: 0,
    motion: {
      start: 0.06,
      duration: NOVA_MOVE_MOTION.dashAttackDuration,
      distanceX: NOVA_MOVE_MOTION.dashAttackDistance,
      easing: "easeOutQuad",
      stopOnStage: true,
      stopOnShield: true,
      preventEdgeDrop: true
    },
    hits: [{ id: "jetRush", start: 0.11, duration: 0.12, damage: 10.2, hpDamage: 10.2, baseKnockback: 360, knockbackGrowth: 7, angle: 35, hitlag: 0.075, shieldDamage: 14.5, mirror: true, offsetX: 39, offsetY: -33, w: 116, h: 66, clankType: "ground" }]
  },
  side: {
    id: "side",
    label: "横強攻撃",
    total: 0.34,
    velocityScale: 0.62,
    hits: [{ id: "arm", start: 0.08, duration: 0.1, damage: 10, hpDamage: 10, baseKnockback: 340, knockbackGrowth: 5, angle: 60, hitlag: 0.07, shieldDamage: 14, mirror: true, offsetX: 48, offsetY: -43, w: 96, h: 38 }]
  },
  up: {
    id: "up",
    label: "上強攻撃",
    total: 0.58,
    velocityScale: 0.5,
    hits: [
      { id: "spin1", start: 0.1, duration: 0.07, damage: 5, hpDamage: 5, baseKnockback: 540, knockbackGrowth: 0, angle: 135, hitlag: 0.04, shieldDamage: 6.5, mirror: true, offsetX: 0, offsetY: -96, w: 112, h: 46 },
      { id: "spin2", start: 0.2, duration: 0.09, damage: 8, hpDamage: 8, baseKnockback: 175, knockbackGrowth: 8.4, angle: 90, hitlag: 0.07, shieldDamage: 11, mirror: true, offsetX: 0, offsetY: -100, w: 122, h: 52 }
    ]
  },
  down: {
    id: "down",
    label: "下強攻撃",
    total: 0.31,
    velocityScale: 0.55,
    hits: [{ id: "flame", start: 0.07, duration: 0.1, damage: 8, hpDamage: 8, baseKnockback: 350, knockbackGrowth: 0.8, angle: 100, hitlag: 0.05, shieldDamage: 11, mirror: true, offsetX: 0, offsetY: 4, w: 154, h: 35 }]
  },
  airNeutral: {
    id: "airNeutral",
    label: "空中ニュートラル",
    total: 0.42,
    landingLag: 0.14,
    velocityScale: 0.92,
    hits: [{ id: "shock", start: 0.07, duration: 0.16, damage: 7, hpDamage: 7, baseKnockback: 330, knockbackGrowth: 5, angle: 30, hitlag: 0.065, shieldDamage: 10, shape: "circle", radius: NOVA_BODY_SIZE.height * 0.7 * 1.3, mirror: true, offsetX: 0, offsetY: 0, clankType: "aerial" }]
  },
  airForward: {
    id: "airForward",
    label: "空中前攻撃",
    total: 0.39,
    landingLag: 0.12,
    velocityScale: 0.88,
    hits: [{ id: "swing", start: 0.09, duration: 0.09, damage: 4, hpDamage: 4, baseKnockback: 160, knockbackGrowth: 10, angle: 50, hitlag: 0.05, shieldDamage: 6, mirror: true, offsetX: 39, offsetY: -65, w: 74, h: 62, clankType: "aerial" }]
  },
  airBack: {
    id: "airBack",
    label: "空中後攻撃",
    total: 0.6,
    contactTotal: 0.86,
    landingLag: 0.28,
    velocityScale: 0.78,
    hits: [
      { id: "flame1", start: 0.11, duration: 0.045, damage: 2, hpDamage: 2, baseKnockback: 45, knockbackGrowth: 0.4, angle: 10, hitlag: 0.025, shieldDamage: 2.8, mirror: true, flameLength: 82, flameThickness: 26, clankType: "aerial" },
      { id: "flame2", start: 0.17, duration: 0.045, damage: 2, hpDamage: 2, baseKnockback: 45, knockbackGrowth: 0.4, angle: 10, hitlag: 0.025, shieldDamage: 2.8, mirror: true, flameLength: 92, flameThickness: 28, clankType: "aerial" },
      { id: "flame3", start: 0.23, duration: 0.045, damage: 2, hpDamage: 2, baseKnockback: 45, knockbackGrowth: 0.4, angle: 10, hitlag: 0.025, shieldDamage: 2.8, mirror: true, flameLength: 102, flameThickness: 30, clankType: "aerial" },
      { id: "finish", start: 0.31, duration: 0.08, requiresContact: true, damage: 14, hpDamage: 14, baseKnockback: 390, knockbackGrowth: 8, angle: 10, hitlag: 0.12, shieldDamage: 20, mirror: true, flameLength: 120, flameThickness: 42, clankType: "aerial" }
    ]
  },
  airUp: {
    id: "airUp",
    label: "空中上攻撃",
    total: NOVA_MOVE_MOTION.upAirActiveEnd + NOVA_MOVE_MOTION.upAirRecoveryDuration,
    landingLag: 0.25,
    velocityScale: 0.82,
    motion: {
      start: 0.14,
      duration: NOVA_MOVE_MOTION.upAirRiseDuration,
      distanceY: -NOVA_MOVE_MOTION.upAirRiseDistance,
      easing: "easeOutQuad",
      stopOnStage: true
    },
    hits: [
      { id: "jet", start: 0.15, duration: 0.07, damage: 4, hpDamage: 4, baseKnockback: 70, knockbackGrowth: 12.5, angle: 270, meteor: true, hitlag: 0.055, shieldDamage: 6, mirror: true, clankType: "aerial" },
      { id: "body", start: 0.2, duration: 0.14, damage: 12, hpDamage: 12, baseKnockback: 410, knockbackGrowth: 10.5, angle: 90, angleMode: "towardTargetUp", hitlag: 0.1, shieldDamage: 17, mirror: true, clankType: "aerial" }
    ]
  },
  airDown: {
    id: "airDown",
    label: "空中下攻撃",
    total: 0.55,
    landingLag: 0.2,
    velocityScale: 0.86,
    hits: Array.from({ length: 7 }, (_, index) => ({
      id: `flame${index + 1}`,
      start: 0.09 + index * 0.05,
      duration: 0.045,
      damage: 2.5,
      hpDamage: 2.5,
      baseKnockback: 30,
      knockbackGrowth: 0.45,
      angle: 85,
      hitlag: 0.025,
      shieldDamage: 3.2,
      mirror: true,
      clankType: "aerial"
    }))
  },
  smashNeutral: {
    id: "smashSide",
    label: "横スマッシュ",
    total: 0.72,
    velocityScale: 0.3,
    motion: {
      start: 0.12,
      duration: NOVA_MOVE_MOTION.sideSmashStepDuration,
      distanceX: NOVA_MOVE_MOTION.sideSmashStepDistance,
      easing: "easeOutQuad",
      stopOnStage: true,
      preventEdgeDrop: true
    },
    hits: [{ id: "punch", start: 0.2, duration: 0.1, damage: 18, hpDamage: 18, baseKnockback: 470, knockbackGrowth: 9.5, angle: 55, hitlag: 0.13, hitstunMultiplier: 1.08, shieldDamage: 26, mirror: true, offsetX: 55, offsetY: -49, w: 110, h: 52 }]
  },
  smashSide: {
    id: "smashSide",
    label: "横スマッシュ",
    total: 0.72,
    velocityScale: 0.3,
    motion: {
      start: 0.12,
      duration: NOVA_MOVE_MOTION.sideSmashStepDuration,
      distanceX: NOVA_MOVE_MOTION.sideSmashStepDistance,
      easing: "easeOutQuad",
      stopOnStage: true,
      preventEdgeDrop: true
    },
    hits: [{ id: "punch", start: 0.2, duration: 0.1, damage: 18, hpDamage: 18, baseKnockback: 470, knockbackGrowth: 9.5, angle: 55, hitlag: 0.13, hitstunMultiplier: 1.08, shieldDamage: 26, mirror: true, offsetX: 55, offsetY: -49, w: 110, h: 52 }]
  },
  smashUp: {
    id: "smashUp",
    label: "上スマッシュ",
    total: 0.8,
    velocityScale: 0.25,
    impulseAt: NOVA_MOVE_MOTION.upSmashImpulseAt,
    jumpHeightRatio: NOVA_MOVE_MOTION.upSmashJumpHeightRatio,
    endsOnLanding: true,
    preservesGroundJump: true,
    hits: [{ id: "uppercut", start: NOVA_MOVE_MOTION.upSmashImpulseAt, duration: 2, requiresRising: true, damage: 25, hpDamage: 25, baseKnockback: 470, knockbackGrowth: 4.2, angle: 75, hitlag: 0.15, hitstunMultiplier: 1.08, shieldDamage: 36, mirror: true, offsetX: 28, offsetY: -104, w: 76, h: 96 }]
  },
  smashDown: {
    id: "smashDown",
    label: "下スマッシュ",
    total: 0.66,
    velocityScale: 0.25,
    impulseAt: NOVA_MOVE_MOTION.downSmashImpulseAt,
    jumpHeightRatio: NOVA_MOVE_MOTION.downSmashJumpHeightRatio,
    endsOnLanding: true,
    preservesGroundJump: true,
    hits: [{ id: "split", start: NOVA_MOVE_MOTION.downSmashImpulseAt, duration: 0.12, damage: 16, hpDamage: 16, baseKnockback: 300, knockbackGrowth: 5.5, angle: 10, hitlag: 0.115, shieldDamage: 23, mirror: true, offsetX: 0, offsetY: 0, w: NOVA_DOWN_SMASH_EXPLOSION.width, h: 38 }]
  },
  specialNeutral: {
    id: "specialNeutral",
    label: "ニュートラル必殺技",
    total: 0.68,
    spawnAt: 0.22,
    velocityScale: 0.35,
    projectile: {
      kind: "novaBeam",
      damage: 7.2,
      hpDamage: 7.2,
      baseKnockback: 340,
      knockbackGrowth: 0,
      angle: 90,
      hitlag: 0.07,
      shieldDamage: 10.5,
      clankDamage: 7.2,
      speed: 700,
      lifetime: 3.8,
      maxDistance: 2800,
      w: 170,
      h: 10,
      offsetX: 72,
      offsetY: -37
    }
  },
  specialSide: {
    id: "specialSide",
    label: "横必殺技",
    total: 86 / 60,
    spawnAt: 16 / 60,
    velocityScale: 0.25,
    projectile: {
      kind: "rocketPunch",
      damage: 15,
      hpDamage: 15,
      baseKnockback: 450,
      knockbackGrowth: 4.5,
      angle: 45,
      hitlag: 0.12,
      shieldDamage: 24,
      clankDamage: 15,
      speed: 650,
      lifetime: 1.1,
      maxDistance: 320,
      w: 58,
      h: 30,
      offsetX: 48,
      offsetY: -40,
      aimDegrees: 40
    }
  },
  specialUp: {
    id: "specialUp",
    label: "上必殺技",
    total: NOVA_RECOVERY.thrustDuration
  },
  specialDown: {
    id: "specialDown",
    label: "下必殺技",
    total: NOVA_CHARGE.maxDuration
  },
  pummel: {
    id: "pummel",
    label: "つかみ打撃",
    damage: 1.6,
    hpDamage: 1.6,
    shieldDamage: 0
  },
  grab: {
    id: "grab",
    label: "つかみ",
    startup: 0.12,
    active: 0.1,
    total: 0.48,
    damage: 0,
    hpDamage: 0,
    baseKnockback: 0,
    knockbackGrowth: 0,
    angle: 0,
    hitlag: 0,
    shieldDamage: 0,
    landingLag: 0,
    offsetX: 18,
    offsetY: -36,
    w: 56,
    h: 52,
    forward: true,
    beatsShield: true,
    type: "grab",
    grabType: "standing"
  },
  throwForward: {
    id: "throwForward",
    label: "前投げ",
    total: 0.45,
    hits: [{ id: "throw", start: 0.17, damage: 7, hpDamage: 7, baseKnockback: 310, knockbackGrowth: 4.4, angle: 40, hitlag: 0.065 }]
  },
  throwBack: {
    id: "throwBack",
    label: "後ろ投げ",
    total: 0.62,
    hits: [
      { id: "toss", start: 0.13, damage: 2, hpDamage: 2, noLaunch: true, hitlag: 0.035 },
      { id: "follow", start: 0.31, damage: 10.5, hpDamage: 10.5, baseKnockback: 445, knockbackGrowth: 4.2, angle: 15, hitlag: 0.11 }
    ]
  },
  throwUp: {
    id: "throwUp",
    label: "上投げ",
    total: 0.5,
    hits: [{ id: "throw", start: 0.2, damage: 7.5, hpDamage: 7.5, baseKnockback: 190, knockbackGrowth: 8.8, angle: 90, hitlag: 0.075 }]
  },
  throwDown: {
    id: "throwDown",
    label: "下投げ",
    total: 0.68,
    hits: [
      { id: "flame1", start: 0.13, damage: 2, hpDamage: 2, noLaunch: true, hitlag: 0.025 },
      { id: "flame2", start: 0.2, damage: 2, hpDamage: 2, noLaunch: true, hitlag: 0.025 },
      { id: "flame3", start: 0.27, damage: 2, hpDamage: 2, noLaunch: true, hitlag: 0.025 },
      { id: "finish", start: 0.35, damage: 4, hpDamage: 4, baseKnockback: 365, knockbackGrowth: 4.5, angle: 130, hitlag: 0.08 }
    ]
  },
  finalPunch: {
    id: "finalPunch",
    label: "超高出力パンチ",
    buildsFinalGauge: false,
    damage: 32.5,
    hpDamage: 32.5,
    shieldDamage: 32.5,
    baseKnockback: 540,
    knockbackGrowth: 11.5,
    angle: 30,
    hitlag: 0.18,
    hitstunMultiplier: 1.15,
    beatsShield: true,
    mirror: true,
    offsetX: NOVA_FINAL_SMASH.hitbox.offsetX,
    offsetY: NOVA_FINAL_SMASH.hitbox.offsetY,
    w: NOVA_FINAL_SMASH.hitbox.width,
    h: NOVA_FINAL_SMASH.hitbox.height
  },
  getupAttack: {
    id: "getupAttack",
    label: "その場起き上がり攻撃",
    total: 0.62,
    velocityScale: 0,
    hits: [
      {
        id: "getupStrike",
        start: 0.12,
        duration: 0.14,
        damage: 6,
        hpDamage: 6,
        baseKnockback: 310,
        knockbackGrowth: 4.2,
        angle: 30,
        hitlag: 0.065,
        shieldDamage: 8.5,
        mirror: true,
        offsetX: 43,
        offsetY: -38,
        w: 76,
        h: 42,
        clankType: "ground"
      },
      {
        id: "getupStrike",
        start: 0.12,
        duration: 0.14,
        damage: 6,
        hpDamage: 6,
        baseKnockback: 310,
        knockbackGrowth: 4.2,
        angle: 30,
        hitlag: 0.065,
        shieldDamage: 8.5,
        mirror: true,
        offsetX: -43,
        offsetY: -38,
        w: 76,
        h: 42,
        clankType: "ground"
      }
    ]
  },
  ledgeAttack: {
    id: "ledgeAttack",
    label: "崖上がり攻撃",
    startup: 0.08,
    active: 0.16,
    total: 0.62,
    velocityScale: 0,
    hits: [
      {
        id: "ledgeStrike",
        start: 0.08,
        duration: 0.16,
        damage: 6.5,
        hpDamage: 6.5,
        baseKnockback: 370,
        knockbackGrowth: 4,
        angle: 30,
        hitlag: 0.065,
        shieldDamage: 9,
        mirror: true,
        offsetX: 38,
        offsetY: -50,
        w: 88,
        h: 42,
        clankType: "ground"
      },
      {
        id: "ledgeStrike",
        start: 0.08,
        duration: 0.16,
        damage: 6.5,
        hpDamage: 6.5,
        baseKnockback: 370,
        knockbackGrowth: 4,
        angle: 30,
        hitlag: 0.065,
        shieldDamage: 9,
        mirror: true,
        offsetX: 0,
        offsetY: -58,
        w: 48,
        h: 68,
        clankType: "ground"
      }
    ]
  }
};

export const CHARACTER_DEFINITIONS = {
  nova: {
    id: "nova",
    name: "ノヴァ",
    weightClass: "middle",
    stats: {
      w: NOVA_BODY_SIZE.width,
      h: NOVA_BODY_SIZE.height,
      jumps: 2,
      runSpeed: 365,
      dashSpeed: 455,
      turnStepSpeed: 310,
      shieldSpeed: 120,
      groundAccel: 2600,
      airAccel: 1500,
      launchedAirAccel: 270,
      groundFriction: 2300,
      airFriction: 130,
      gravity: 1750,
      fastFallGravity: 2250,
      maxFallSpeed: 980,
      fastFallMaxSpeed: 1120,
      jumpSpeed: -667.06,
      airJumpSpeed: -729.51
    },
    moves: NOVA_MOVES
  }
};

export const CHARACTER_IDS = new Set(Object.keys(CHARACTER_DEFINITIONS));

export function getCharacterDefinition(characterId) {
  return CHARACTER_DEFINITIONS[characterId] || CHARACTER_DEFINITIONS[DEFAULT_CHARACTER_ID];
}

export function getWeightClass(weightClass) {
  return WEIGHT_CLASSES[weightClass] || WEIGHT_CLASSES.middle;
}

export function addFinalGaugeFromDamage(attacker, target, damage, enabled = true) {
  const appliedDamage = Math.max(0, Number(damage) || 0);
  if (!enabled || appliedDamage <= 0) return { dealt: 0, taken: 0 };
  const dealt = appliedDamage * FINAL_SMASH.dealtGainPerDamage;
  const taken = appliedDamage * FINAL_SMASH.takenGainPerDamage;
  attacker.finalGauge = clamp((attacker.finalGauge || 0) + dealt, 0, FINAL_SMASH.maxGauge);
  target.finalGauge = clamp((target.finalGauge || 0) + taken, 0, FINAL_SMASH.maxGauge);
  return { dealt, taken };
}

export function selectDeterministicFinalSmashWinner(candidates, seed) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const ordered = [...candidates].sort((first, second) => String(first.id).localeCompare(String(second.id)));
  let hash = 2166136261;
  const source = `${seed}:${ordered.map(fighter => fighter.id).join("|")}`;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ordered[(hash >>> 0) % ordered.length];
}

export function beginFinalSmash(candidates, seed, frame) {
  const winner = selectDeterministicFinalSmashWinner(candidates, seed);
  if (!winner) return null;
  winner.finalGauge = 0;
  return {
    winner,
    state: {
      fighterId: winner.id,
      startedFrame: frame,
      remaining: FINAL_SMASH.defaultActiveDuration
    }
  };
}

export function applyFinalGaugeKoRule(fighter, enabled = true) {
  if (enabled && fighter.finalGauge >= FINAL_SMASH.maxGauge) {
    fighter.finalGauge = FINAL_SMASH.fullGaugeAfterKo;
  }
  return fighter.finalGauge || 0;
}

export function getMove(characterId, moveId) {
  const character = getCharacterDefinition(characterId);
  return character.moves[moveId] || character.moves.neutral;
}

export function selectMoveFromInput(characterId, input, axis, kind, options = {}) {
  const character = getCharacterDefinition(characterId);
  const moves = character.moves;

  if (kind === "special") {
    if (input.up) return moves.specialUp;
    if (input.down) return moves.specialDown;
    return Math.abs(axis) > 0.35 ? moves.specialSide : moves.specialNeutral;
  }
  if (kind === "grab") return moves.grab;
  if (kind === "smash") {
    if (input.up) return moves.smashUp;
    if (input.down) return moves.smashDown;
    return moves.smashSide || moves.smashNeutral;
  }
  if (options.airborne) {
    if (input.up) return moves.airUp;
    if (input.down) return moves.airDown;
    if (Math.abs(axis) <= 0.35) return moves.airNeutral;
    return Math.sign(axis) === (options.facing || 1) ? moves.airForward : moves.airBack;
  }
  if (options.dashing && moves.dashAttack) return moves.dashAttack;
  if (input.up) return moves.up;
  if (input.down) return moves.down;
  return Math.abs(axis) > 0.35 ? moves.side : (moves.jab1 || moves.neutral);
}

export function selectGrabMove(characterId, variant = "standing") {
  const base = getMove(characterId, "grab");
  const config = GRAB.variants[variant] || GRAB.variants.standing;
  return {
    ...base,
    ...config,
    id: variant === "standing" ? "grab" : `${variant}Grab`,
    label: variant === "dash" ? "ダッシュつかみ" : variant === "pivot" ? "振り向きつかみ" : "つかみ",
    type: "grab",
    grabType: variant
  };
}

export function horizontalInput(input = {}) {
  if (Number.isFinite(input.moveX)) return clamp(input.moveX, -1, 1);
  return (input.right ? 1 : 0) - (input.left ? 1 : 0);
}

export function verticalInput(input = {}) {
  if (Number.isFinite(input.moveY)) return clamp(input.moveY, -1, 1);
  return (input.down ? 1 : 0) - (input.up ? 1 : 0);
}

export function isMoveActive(move, actionTime) {
  return getActiveMoveHits(null, move, actionTime).length > 0;
}

export function getActiveMoveHits(fighter, move, actionTime) {
  if (!move) return [];
  if (!Array.isArray(move.hits)) {
    return actionTime >= move.startup && actionTime <= move.startup + move.active
      ? [{ ...move, hitId: move.hitId || "main" }]
      : [];
  }

  return move.hits
    .filter(hit => {
      if (hit.requiresContact && !fighter?.moveState?.contact) return false;
      if (hit.requiresRising && fighter && (fighter.onGround || (fighter.vy || 0) >= 0)) return false;
      const duration = hit.duration ?? 1 / 60;
      return actionTime >= hit.start && actionTime <= hit.start + duration;
    })
    .map(hit => ({
      ...move,
      ...hit,
      id: move.id,
      hitId: hit.id,
      startup: hit.start,
      active: hit.duration ?? 1 / 60
    }));
}

export function getGroundDodgeFromInput(input = {}, lastInput = {}) {
  if (!input.shield) return null;

  const shieldPressed = input.shield && !lastInput.shield;
  const leftPressed = input.left && !lastInput.left;
  const rightPressed = input.right && !lastInput.right;
  const downPressed = input.down && !lastInput.down;
  const axis = horizontalInput(input);

  if (input.down && (downPressed || shieldPressed)) return { type: "spotDodge", direction: 0 };
  if (axis !== 0 && ((axis < 0 && leftPressed) || (axis > 0 && rightPressed) || shieldPressed)) {
    return { type: "roll", direction: axis };
  }
  return null;
}

export function getAirDodgeFromInput(input = {}, lastInput = {}) {
  if (!input.shield || lastInput.shield) return null;
  const x = horizontalInput(input);
  const y = verticalInput(input);
  return { type: "airDodge", x, y };
}

export function startDodge(fighter, dodge) {
  const config = DODGE[dodge.type];
  if (!config) return false;

  clearLedgeState(fighter, 0);
  fighter.shield = false;
  fighter.move = null;
  fighter.moveState = null;
  fighter.hitList = [];
  fighter.actionTime = 0;
  fighter.dodge = { ...dodge, elapsed: 0 };

  if (dodge.type === "roll") {
    const direction = dodge.direction || fighter.facing || 1;
    fighter.action = "roll";
    fighter.facing = -direction;
    fighter.vx = direction * config.speed;
    fighter.vy = 0;
    return true;
  }

  if (dodge.type === "spotDodge") {
    fighter.action = "spotDodge";
    fighter.vx = 0;
    return true;
  }

  fighter.action = "airDodge";
  fighter.hasAirDodged = true;
  const vector = normalizeVector(dodge.x || 0, dodge.y || 0);
  if (dodge.x || dodge.y) {
    fighter.vx = vector.x * config.speed;
    fighter.vy = vector.y * config.speed;
  } else {
    fighter.vx *= config.neutralXScale;
    fighter.vy *= config.neutralYScale;
  }
  return true;
}

export function updateDodge(fighter, dt) {
  if (!fighter.dodge) return false;

  const dodge = fighter.dodge;
  const config = DODGE[dodge.type];
  if (!config) {
    clearDodge(fighter);
    return true;
  }

  fighter.actionTime += dt;
  dodge.elapsed = fighter.actionTime;

  if (fighter.actionTime >= config.invulnStart && fighter.actionTime <= config.invulnEnd) {
    fighter.dodgeInvuln = Math.max(fighter.dodgeInvuln || 0, 0.05);
  }

  if (dodge.type === "roll") {
    const direction = dodge.direction || fighter.facing || 1;
    fighter.vx = direction * config.speed;
  } else if (dodge.type === "spotDodge") {
    fighter.vx = 0;
  }

  if (fighter.actionTime < config.duration) return false;
  clearDodge(fighter);
  return true;
}

export function clearDodge(fighter) {
  fighter.dodge = null;
  fighter.dodgeInvuln = 0;
  if (["spotDodge", "roll", "airDodge"].includes(fighter.action)) {
    fighter.action = null;
    fighter.move = null;
    fighter.actionTime = 0;
    fighter.hitList = [];
  }
}

export function canAct(fighter) {
  return Boolean(
    fighter.alive &&
    fighter.hitstun <= 0 &&
    fighter.shieldStun <= 0 &&
    (fighter.shieldReleaseLag || 0) <= 0 &&
    (fighter.clankLag || 0) <= 0 &&
    (fighter.actionLock || 0) <= 0 &&
    fighter.landingLag <= 0 &&
    !fighter.action &&
    !fighter.dodge &&
    !fighter.respawnPlatform
  );
}

export function updateCoreTimers(fighter, dt) {
  fighter.invuln = Math.max(0, (fighter.invuln || 0) - dt);
  fighter.dodgeInvuln = Math.max(0, (fighter.dodgeInvuln || 0) - dt);
  fighter.hitstun = Math.max(0, (fighter.hitstun || 0) - dt);
  fighter.shieldStun = Math.max(0, (fighter.shieldStun || 0) - dt);
  fighter.shieldDrainPause = Math.max(0, (fighter.shieldDrainPause || 0) - dt);
  fighter.shieldReleaseLag = Math.max(0, (fighter.shieldReleaseLag || 0) - dt);
  fighter.clankLag = Math.max(0, (fighter.clankLag || 0) - dt);
  fighter.actionLock = Math.max(0, (fighter.actionLock || 0) - dt);
  fighter.landingLag = Math.max(0, (fighter.landingLag || 0) - dt);
  fighter.ledgeCooldown = Math.max(0, (fighter.ledgeCooldown || 0) - dt);
  fighter.techWindow = Math.max(0, (fighter.techWindow || 0) - dt);
  fighter.techLockout = Math.max(0, (fighter.techLockout || 0) - dt);
  fighter.perfectShieldWindow = Math.max(0, (fighter.perfectShieldWindow || 0) - dt);
  fighter.perfectShieldFlash = Math.max(0, (fighter.perfectShieldFlash || 0) - dt);
  fighter.dashTimer = Math.max(0, (fighter.dashTimer || 0) - dt);
  fighter.respawnPlatform = Math.max(0, (fighter.respawnPlatform || 0) - dt);
  if (fighter.shieldStun <= 0 && fighter.action === "shieldBreak") fighter.action = null;
  if (fighter.clankLag <= 0 && fighter.action === "clank") fighter.action = null;
  if (fighter.actionLock <= 0 && fighter.action === "throwEnd") {
    fighter.action = null;
    fighter.moveState = null;
  }
  if (fighter.landingLag <= 0 && ["tech", "wallTech", "slopeTech", "ceilingTech", "landing", "attackLanding", "airDodgeLanding", "specialLanding", "bounce", "wallBounce", "slopeBounce", "ceilingBounce"].includes(fighter.action)) {
    fighter.action = null;
  }
}

export function updateShieldState(fighter, input = {}, dt = 0) {
  fighter.shieldMax = fighter.shieldMax || SHIELD.max;
  fighter.shieldHp = clamp(fighter.shieldHp ?? fighter.shieldMax, 0, fighter.shieldMax);

  if (fighter.shield) {
    if ((fighter.shieldDrainPause || 0) <= 0) {
      fighter.shieldHp = Math.max(0, fighter.shieldHp - SHIELD.holdDrain * dt);
    }
    if (fighter.shieldHp <= 0) {
      breakShield(fighter);
      return "shieldBreak";
    }
    return null;
  }

  const canRegen = !input.shield && fighter.shieldStun <= 0 && fighter.landingLag <= 0;
  if (canRegen) fighter.shieldHp = Math.min(fighter.shieldMax, fighter.shieldHp + SHIELD.regen * dt);
  return null;
}

export function applyShieldDamage(fighter, move) {
  fighter.shieldMax = fighter.shieldMax || SHIELD.max;
  fighter.shieldHp = clamp(fighter.shieldHp ?? fighter.shieldMax, 0, fighter.shieldMax);
  const damage = move.shieldDamage ?? (SHIELD.hitBase + move.damage * SHIELD.hitScale);
  fighter.shieldHp = Math.max(0, fighter.shieldHp - damage);
  fighter.shieldStun = Math.max(fighter.shieldStun || 0, damage * SHIELD.stunScale);
  fighter.shieldDrainPause = Math.max(fighter.shieldDrainPause || 0, SHIELD.hitDrainPause);

  if (fighter.shieldHp > 0) return { broken: false, damage };
  breakShield(fighter);
  return { broken: true, damage };
}

export function breakShield(fighter) {
  clearLedgeState(fighter);
  clearDodge(fighter);
  fighter.shield = false;
  fighter.shieldReleaseLag = 0;
  fighter.shieldDrainPause = 0;
  fighter.perfectShieldWindow = 0;
  fighter.perfectShieldFlash = 0;
  fighter.shieldHp = 0;
  fighter.shieldStun = SHIELD.breakStun;
  fighter.hitstun = Math.max(fighter.hitstun || 0, SHIELD.breakStun);
  fighter.hitlag = 0;
  fighter.action = "shieldBreak";
  fighter.move = null;
  fighter.moveState = null;
  fighter.actionTime = 0;
  fighter.vx *= 0.25;
  fighter.vy = Math.min(fighter.vy, SHIELD.breakLaunchY);
  fighter.onGround = false;
}

export function resetShield(fighter) {
  fighter.shieldMax = fighter.shieldMax || SHIELD.max;
  fighter.shieldHp = fighter.shieldMax;
  fighter.shield = false;
  fighter.shieldStun = 0;
  fighter.shieldReleaseLag = 0;
  fighter.shieldDrainPause = 0;
  fighter.perfectShieldWindow = 0;
  fighter.perfectShieldFlash = 0;
}

export function noteDefenseInput(fighter, shieldPressed, shieldReleased = false) {
  if (shieldPressed && (fighter.techLockout || 0) <= 0) {
    fighter.techWindow = TECH.window;
    fighter.techLockout = TECH.lockout;
  }
  if (shieldReleased && fighter.shield && fighter.onGround && canAct(fighter)) {
    fighter.perfectShieldWindow = SHIELD.perfectWindow;
  }
}

export function applyPerfectShield(defender, attacker, move = {}) {
  if (defender.perfectShieldWindow <= 0) return false;
  defender.perfectShieldWindow = 0;
  defender.perfectShieldFlash = SHIELD.perfectFlash;
  defender.shieldStun = 0;
  defender.shieldReleaseLag = 0;
  defender.shieldDrainPause = Math.max(defender.shieldDrainPause || 0, SHIELD.hitDrainPause);
  defender.hitstun = 0;
  defender.hitlag = Math.max(defender.hitlag || 0, SHIELD.perfectDefenderFreeze);
  attacker.hitlag = Math.max(attacker.hitlag || 0, SHIELD.perfectAttackerFreeze, move.hitlag || 0);
  return true;
}

export function applyHitlagSdi(fighter, input = {}, dt = 0, stage = null) {
  if (fighter.hitlag <= 0) return;
  const x = horizontalInput(input);
  const y = verticalInput(input);
  if (x === 0 && y === 0) return;
  const vector = normalizeVector(x, y);
  const amount = 115 * dt;
  const prevX = fighter.x;
  const prevY = fighter.y;
  fighter.x += vector.x * amount;
  fighter.y += vector.y * amount;
  if (stage) {
    const launchState = {
      vx: fighter.vx,
      vy: fighter.vy,
      onGround: fighter.onGround,
      jumps: fighter.jumps,
      hasAirDodged: fighter.hasAirDodged,
      jumpArcActive: fighter.jumpArcActive,
      ledge: fighter.ledge
    };
    resolveStageCollision(stage, fighter, prevX, prevY, input, {
      ignoreLandingVelocity: true
    });
    Object.assign(fighter, launchState);
  }
}

export function startDashIfNeeded(fighter, input = {}, lastInput = {}, axis = 0) {
  const direction = Math.abs(axis) > 0.35 ? Math.sign(axis) : 0;
  if (!fighter.onGround || direction === 0 || fighter.shield || fighter.action || fighter.landingLag > 0) return false;
  const lastAxis = horizontalInput(lastInput);
  const lastDirection = Math.abs(lastAxis) > 0.35 ? Math.sign(lastAxis) : 0;
  if (lastDirection === direction) return false;
  fighter.dashTimer = direction === -fighter.facing ? MOVEMENT.turnStepDuration : MOVEMENT.dashDuration;
  fighter.dashDirection = direction;
  fighter.facing = direction;
  return true;
}

export function startLandingLag(fighter, kind = "normal") {
  const lag = kind === "attack" && Number.isFinite(fighter.move?.landingLag)
    ? fighter.move.landingLag
    : LANDING[kind] ?? LANDING.normal;
  fighter.landingLag = Math.max(fighter.landingLag || 0, lag);
  fighter.action = kind === "airDodge" ? "airDodgeLanding" : kind === "attack" ? "attackLanding" : "landing";
  fighter.move = null;
  fighter.moveState = null;
  fighter.actionTime = 0;
  fighter.hitList = [];
  clearDodge(fighter);
}

export function resolveImpactAfterCollision(fighter, collision, input = {}) {
  if (!collision || (!collision.landed && !collision.hitWall && !collision.hitSlope && !collision.hitCeiling)) return null;
  if (collision.landed) {
    fighter.fastFalling = false;
    fighter.hasAirDodged = false;
    fighter.ledgeGrabCount = 0;
  }

  if (collision.landed && fighter.knockdownPending) {
    fighter.knockdownPending = false;
    return startKnockdown(fighter);
  }

  const surface = collision.landed
    ? "ground"
    : collision.hitSlope
    ? "slope"
    : collision.hitWall
    ? "wall"
    : "ceiling";
  const impactSpeed = surface === "slope"
    ? getSlopeImpactSpeed(collision)
    : surface === "wall"
    ? Math.abs(collision.impactVx || 0)
    : Math.abs(collision.impactVy || 0);
  const totalImpactSpeed = Math.hypot(collision.impactVx || 0, collision.impactVy || 0);
  const shallowGroundLaunch = collision.landed && fighter.hitstun > 0 && fighter.tumbling &&
    Math.abs(collision.impactVx || 0) >= Math.abs(collision.impactVy || 0) &&
    totalImpactSpeed >= TECH.minSpeed;
  const launchedIntoSlope = surface === "slope" && fighter.hitstun > 0 && fighter.tumbling && impactSpeed > 0;
  const requiresTech = fighter.hitstun > 0 && fighter.tumbling &&
    (impactSpeed >= TECH.minSpeed || shallowGroundLaunch);
  const causesKnockdown = collision.landed && fighter.hitstun > 0 && fighter.tumbling &&
    impactSpeed >= KNOCKDOWN.minImpactSpeed;
  if (!requiresTech) {
    if (launchedIntoSlope) return bounceFromSlope(fighter, collision);
    if (causesKnockdown) return startKnockdown(fighter);
    if (collision.landed && fighter.actionStartedAir && fighter.move) {
      startLandingLag(fighter, "attack");
      return "landingLag";
    }
    if (collision.landed && fighter.dodge && fighter.dodge.type === "airDodge") {
      startLandingLag(fighter, "normal");
      return "landingLag";
    }
    return collision.landed ? "land" : null;
  }

  const teched = fighter.techWindow > 0 &&
    impactSpeed <= TECH.maxSpeed && totalImpactSpeed <= TECH.maxSpeed;
  if (teched) {
    const lag = surface === "ground"
      ? TECH.groundLag
      : surface === "wall" || surface === "slope"
      ? TECH.wallLag
      : TECH.ceilingLag;
    fighter.hitstun = 0;
    fighter.landingLag = Math.max(fighter.landingLag || 0, lag);
    fighter.invuln = Math.max(fighter.invuln || 0, TECH.invuln);
    fighter.vx = surface === "ground" ? horizontalInput(input) * 220 : 0;
    fighter.vy = 0;
    fighter.techWindow = 0;
    fighter.knockdownPending = false;
    fighter.tumbling = false;
    fighter.meteor = false;
    fighter.action = surface === "ground"
      ? "tech"
      : surface === "slope"
      ? "slopeTech"
      : surface === "wall"
      ? "wallTech"
      : "ceilingTech";
    return fighter.action;
  }

  fighter.techWindow = 0;

  if (collision.landed) {
    fighter.onGround = false;
    if (shallowGroundLaunch) {
      fighter.vx = (collision.impactVx ?? fighter.vx) * TECH.shallowGroundBounceRetention;
      fighter.vy = -Math.abs(collision.impactVy ?? fighter.vy) * TECH.shallowGroundBounceRetention;
    } else {
      fighter.vx = (collision.impactVx || fighter.vx) * TECH.bounceX;
      fighter.vy = -Math.abs(collision.impactVy || fighter.vy) * TECH.bounceY;
    }
    fighter.hitstun = Math.max(fighter.hitstun, TECH.failLag);
    fighter.landingLag = Math.max(fighter.landingLag || 0, TECH.failLag);
    fighter.knockdownPending = true;
    fighter.action = "bounce";
    return "bounce";
  }

  if (collision.hitWall) {
    fighter.vx = -(collision.impactVx || fighter.vx) * TECH.wallBounceX;
    fighter.vy = (collision.impactVy || fighter.vy) * TECH.wallBounceY;
    fighter.hitstun = Math.max(fighter.hitstun, TECH.failLag);
    fighter.action = "wallBounce";
    return "wallBounce";
  }

  if (collision.hitSlope) return bounceFromSlope(fighter, collision);

  if (collision.hitCeiling) {
    fighter.onGround = false;
    fighter.vx = (collision.impactVx ?? fighter.vx) * TECH.ceilingBounceX;
    fighter.vy = Math.abs(collision.impactVy ?? fighter.vy) * TECH.ceilingBounceY;
    fighter.hitstun = Math.max(fighter.hitstun, TECH.failLag);
    fighter.action = "ceilingBounce";
    return "ceilingBounce";
  }

  return null;
}

export function startKnockdown(fighter) {
  clearDodge(fighter);
  fighter.knockdown = { phase: "down", elapsed: 0 };
  fighter.knockdownPending = false;
  fighter.action = "downed";
  fighter.move = null;
  fighter.moveState = null;
  fighter.runTurn = null;
  fighter.actionTime = 0;
  fighter.hitList = [];
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.onGround = true;
  fighter.hitstun = 0;
  fighter.landingLag = 0;
  fighter.techWindow = 0;
  fighter.tumbling = false;
  fighter.meteor = false;
  fighter.fastFalling = false;
  fighter.jumpArcActive = false;
  fighter.shield = false;
  fighter.crouching = false;
  fighter.invuln = Math.max(fighter.invuln || 0, KNOCKDOWN.invuln);
  return "knockdown";
}

function getSlopeImpactSpeed(collision) {
  const normal = collision.slopeNormal;
  if (!normal) return 0;
  const dot = (collision.impactVx || 0) * normal.x + (collision.impactVy || 0) * normal.y;
  return Math.max(0, -dot);
}

function bounceFromSlope(fighter, collision) {
  const normal = collision.slopeNormal;
  if (!normal) return null;
  const impactVx = collision.impactVx ?? fighter.vx;
  const impactVy = collision.impactVy ?? fighter.vy;
  const normalSpeed = impactVx * normal.x + impactVy * normal.y;
  if (normalSpeed >= 0) return null;

  const normalVx = normalSpeed * normal.x;
  const normalVy = normalSpeed * normal.y;
  const tangentVx = impactVx - normalVx;
  const tangentVy = impactVy - normalVy;
  fighter.onGround = false;
  fighter.vx = tangentVx * TECH.slopeBounceTangent - normalVx * TECH.slopeBounceNormal;
  fighter.vy = tangentVy * TECH.slopeBounceTangent - normalVy * TECH.slopeBounceNormal;
  fighter.hitstun = Math.max(fighter.hitstun, TECH.failLag);
  fighter.action = "slopeBounce";
  return "slopeBounce";
}

export function resolveStageCollision(stage, fighter, prevX, prevY, input = {}, options = {}) {
  constrainGroundMotionToPlatform(
    stage,
    fighter,
    prevX,
    prevY,
    options.groundRoll || options.preventEdgeDrop
  );
  const result = {
    landed: false,
    hitCeiling: false,
    hitWall: false,
    hitSlope: false,
    slopeNormal: null,
    impactVx: fighter.vx,
    impactVy: fighter.vy
  };
  const oldBox = fighterBoxAt(fighter, prevX, prevY);

  for (const platform of stage.platforms) {
    const platformBox = platformRect(platform);
    const newBox = fighterBoxAt(fighter, fighter.x, fighter.y);
    const withinX = newBox.right > platformBox.left && newBox.left < platformBox.right;
    const canLand = platform.type !== "soft" || !input.down;

    const canReachTop = options.ignoreLandingVelocity || fighter.vy >= 0;
    const crossedTop = oldBox.bottom <= platformBox.top && newBox.bottom >= platformBox.top;
    const forcedIntoMainTop = options.resolveTopPenetration && platform.type === "main" &&
      newBox.top < platformBox.top && newBox.bottom > platformBox.top;
    if (withinX && canLand && canReachTop && (crossedTop || forcedIntoMainTop)) {
      fighter.y = platformBox.top - fighter.h / 2;
      fighter.vy = 0;
      fighter.onGround = true;
      fighter.jumps = fighter.maxJumps;
      fighter.hasAirDodged = false;
      fighter.jumpArcActive = false;
      fighter.ledge = null;
      result.landed = true;
      continue;
    }

    if (platform.type !== "main") continue;
    resolveMainPlatformCollision(fighter, oldBox, platform, result);
  }

  return result;
}

export function placeFighterWithStageCollision(stage, fighter, x, y, input = {}) {
  const previousX = fighter.x;
  const previousY = fighter.y;
  fighter.x = x;
  fighter.y = y;
  fighter.onGround = false;
  return resolveStageCollision(stage, fighter, previousX, previousY, input, {
    ignoreLandingVelocity: true,
    resolveTopPenetration: true
  });
}

export function tryGrabLedge(stage, fighter, input = {}, options = {}) {
  if (!canGrabLedge(fighter, input, options)) return false;

  for (const platform of stage.platforms) {
    if (platform.type !== "main") continue;
    const ledges = [
      { x: platform.x, y: platform.y, side: -1 },
      { x: platform.x + platform.w, y: platform.y, side: 1 }
    ];

    for (const ledge of ledges) {
      if (fighter.x * ledge.side < ledge.x * ledge.side) continue;
      if (Math.abs(fighter.x - ledge.x) > LEDGE.grabRangeX) continue;
      if (fighter.y < ledge.y - LEDGE.grabRangeAbove) continue;
      if (fighter.y > ledge.y + LEDGE.grabRangeBelow) continue;
      startLedgeHang(fighter, ledge, input);
      return true;
    }
  }

  return false;
}

export function updateLedgeHang(fighter, input = {}, jumpPressed = false, attackPressed = false, shieldPressed = false, dt = 0) {
  if (!fighter.ledge) return null;
  if (fighter.ledgeClimb) return updateLedgeClimb(fighter, dt);
  if (fighter.ledgeRoll) return updateLedgeRoll(fighter, dt);
  if (fighter.ledgeAttack) return updateLedgeAttack(fighter, dt);

  const ledge = fighter.ledge;
  fighter.ledgeHold += dt;
  fighter.x = ledge.x + ledge.side * LEDGE.hangOffsetX;
  fighter.y = ledge.y + LEDGE.hangOffsetY;
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.onGround = false;
  fighter.jumpArcActive = false;
  fighter.shield = false;
  fighter.action = "ledge";
  fighter.move = null;
  fighter.actionTime = 0;
  fighter.hitList = [];
  fighter.facing = -ledge.side;

  if (jumpPressed) {
    releaseLedge(fighter);
    fighter.vx = 0;
    fighter.vy = fighter.stats.airJumpSpeed / MOVEMENT.jumpDurationMultiplier * LEDGE.jumpSpeedMultiplier;
    fighter.invuln = LEDGE.jumpInvuln;
    fighter.jumpArcActive = true;
    fighter.jumps = Math.max(0, fighter.maxJumps - 1);
    return "jump";
  }

  if (attackPressed) {
    startLedgeAttack(fighter, ledge);
    return "attack";
  }

  if (shieldPressed) {
    startLedgeRoll(fighter, ledge);
    return "roll";
  }

  const horizontalHeld = Math.abs(horizontalInput(input)) > 0.35;
  if (fighter.ledgeHorizontalLocked && !horizontalHeld) fighter.ledgeHorizontalLocked = false;
  const acceptHorizontal = !fighter.ledgeHorizontalLocked;
  const towardStage = acceptHorizontal && (ledge.side < 0 ? input.right : input.left);
  const awayStage = acceptHorizontal && (ledge.side < 0 ? input.left : input.right);
  if (input.up || towardStage) {
    startLedgeClimb(fighter, ledge);
    return "climb";
  }

  if (input.down || awayStage || fighter.ledgeHold >= LEDGE.maxHold) {
    releaseLedge(fighter);
    fighter.x = ledge.x + ledge.side * (fighter.w / 2 + 12);
    fighter.y = ledge.y + LEDGE.hangOffsetY;
    fighter.vx = ledge.side * 80;
    fighter.vy = LEDGE.dropSpeed;
    fighter.jumps = Math.min(fighter.jumps, Math.max(0, fighter.maxJumps - 1));
    return "drop";
  }

  return null;
}

export function clearLedgeState(fighter, cooldown = LEDGE.cooldown) {
  fighter.ledge = null;
  fighter.ledgeClimb = null;
  fighter.ledgeRoll = null;
  fighter.ledgeAttack = null;
  fighter.ledgeHold = 0;
  fighter.ledgeHorizontalLocked = false;
  fighter.ledgeCooldown = cooldown === 0 ? 0 : Math.max(fighter.ledgeCooldown || 0, cooldown);
}

export function getNovaSideTiltMotion(progress) {
  const value = clamp(Number(progress) || 0, 0, 1);
  const ease = amount => amount * amount * (3 - 2 * amount);
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  if (value < 0.2) {
    const phase = ease(value / 0.2);
    return {
      angle: interpolate(1.2, -0.7, phase),
      reach: interpolate(1, 0.94, phase),
      force: phase * 0.25
    };
  }
  if (value < 0.42) {
    const phase = ease((value - 0.2) / 0.22);
    return {
      angle: interpolate(-0.7, -0.03, phase),
      reach: interpolate(0.94, 1.58 * 1.25, phase),
      force: interpolate(0.25, 1, phase)
    };
  }
  if (value < 0.56) {
    const phase = ease((value - 0.42) / 0.14);
    return {
      angle: interpolate(-0.03, 0.16, phase),
      reach: interpolate(1.58 * 1.25, 1.36 * 1.25, phase),
      force: interpolate(1, 0.82, phase)
    };
  }
  const phase = ease((value - 0.56) / 0.44);
  return {
    angle: interpolate(0.16, 1.2, phase),
    reach: interpolate(1.36 * 1.25, 1, phase),
    force: interpolate(0.82, 0, phase)
  };
}

export function getNovaSideSmashMotion(progress, charging = false) {
  const value = clamp(Number(progress) || 0, 0, 1);
  const ease = amount => amount * amount * (3 - 2 * amount);
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  const chargedPose = {
    force: 0.28,
    frontArm: 2.7,
    frontArmReach: 0.92,
    frontArmRootY: -12,
    rearArm: 0.48,
    rearLeg: 0.2,
    frontLeg: -0.24,
    offsetX: -2,
    offsetY: 1,
    rotation: -0.055,
    step: 0
  };
  if (charging) return chargedPose;

  if (value < 0.14) {
    const phase = ease(value / 0.14);
    return {
      ...chargedPose,
      force: interpolate(0.28, 0.42, phase),
      frontArm: interpolate(2.7, 2.82, phase),
      rearArm: interpolate(0.48, 0.34, phase),
      rearLeg: interpolate(0.2, 0.28, phase),
      frontLeg: interpolate(-0.24, -0.38, phase),
      offsetX: interpolate(-2, -3, phase),
      rotation: interpolate(-0.055, -0.09, phase)
    };
  }
  if (value < 0.28) {
    const phase = ease((value - 0.14) / 0.14);
    return {
      force: interpolate(0.42, 1, phase),
      frontArm: interpolate(2.82, -0.08, phase),
      frontArmReach: interpolate(0.92, 1.82, phase),
      frontArmRootY: interpolate(-12, -18, phase),
      rearArm: interpolate(0.34, 0.82, phase),
      rearLeg: interpolate(0.28, 0.46, phase),
      frontLeg: interpolate(-0.38, -0.64, phase),
      offsetX: interpolate(-3, 5, phase),
      offsetY: interpolate(1, 0, phase),
      rotation: interpolate(-0.09, 0.12, phase),
      step: phase
    };
  }
  if (value < 0.46) {
    const phase = ease((value - 0.28) / 0.18);
    return {
      force: interpolate(1, 0.82, phase),
      frontArm: interpolate(-0.08, 0.08, phase),
      frontArmReach: interpolate(1.82, 1.55, phase),
      frontArmRootY: interpolate(-18, -15, phase),
      rearArm: interpolate(0.82, 0.7, phase),
      rearLeg: interpolate(0.46, 0.4, phase),
      frontLeg: interpolate(-0.64, -0.56, phase),
      offsetX: interpolate(5, 4, phase),
      offsetY: 0,
      rotation: interpolate(0.12, 0.09, phase),
      step: 1
    };
  }

  const phase = ease((value - 0.46) / 0.54);
  return {
    force: interpolate(0.82, 0, phase),
    frontArm: interpolate(0.08, 1.2, phase),
    frontArmReach: interpolate(1.55, 1, phase),
    frontArmRootY: interpolate(-15, -13, phase),
    rearArm: interpolate(0.7, 0.12, phase),
    rearLeg: interpolate(0.4, 0.04, phase),
    frontLeg: interpolate(-0.56, -0.04, phase),
    offsetX: interpolate(4, 0, phase),
    offsetY: 0,
    rotation: interpolate(0.09, 0, phase),
    step: 1
  };
}

export function getNovaUpSmashPoseProgress(fighter) {
  const time = Math.max(0, Number(fighter?.actionTime) || 0);
  const impulseAt = NOVA_MOVE_MOTION.upSmashImpulseAt;
  if (time < impulseAt) return clamp(time / impulseAt, 0, 1) * 0.2;
  if (fighter?.onGround) return 1;
  const velocityY = Number(fighter?.vy) || 0;
  if (velocityY < 0) {
    const remainingRise = clamp(-velocityY / 430, 0, 1);
    return 0.2 + (1 - remainingRise) * 0.45;
  }
  return 0.65 + clamp(velocityY / 430, 0, 1) * 0.35;
}

export function getNovaUpSmashMotion(progress, charging = false) {
  const value = clamp(Number(progress) || 0, 0, 1);
  const ease = amount => amount * amount * (3 - 2 * amount);
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  const chargePose = {
    force: 0.35,
    rearLeg: 0.72,
    frontLeg: -0.72,
    rearArm: 1.15,
    rearArmReach: 0.9,
    rearArmForward: true,
    rearArmRootY: -7,
    frontArm: 1.85,
    frontArmReach: 0.92,
    frontArmRootY: -7,
    offsetX: 0,
    offsetY: 10,
    rotation: 0
  };
  if (charging) return chargePose;

  if (value < 0.2) {
    const phase = ease(value / 0.2);
    return {
      ...chargePose,
      force: interpolate(0.35, 0.72, phase),
      rearLeg: interpolate(0.72, 0.9, phase),
      frontLeg: interpolate(-0.72, -0.9, phase),
      rearArm: interpolate(1.15, 0.78, phase),
      frontArm: interpolate(1.85, -0.62, phase),
      frontArmReach: interpolate(0.92, 1.18, phase),
      frontArmRootY: interpolate(-7, -11, phase),
      offsetY: interpolate(10, 4, phase),
      rotation: interpolate(0, 0.04, phase)
    };
  }
  if (value < 0.65) {
    const phase = ease((value - 0.2) / 0.45);
    return {
      force: interpolate(0.72, 1, phase),
      rearLeg: interpolate(0.9, 0.34, phase),
      frontLeg: interpolate(-0.9, -0.3, phase),
      rearArm: interpolate(0.78, 1.08, phase),
      rearArmReach: 1,
      rearArmForward: false,
      rearArmRootY: -13,
      frontArm: interpolate(-0.62, -0.9, phase),
      frontArmReach: interpolate(1.18, 1.55, phase),
      frontArmRootY: interpolate(-11, -20, phase),
      offsetX: interpolate(0, 2, phase),
      offsetY: interpolate(4, -2, phase),
      rotation: interpolate(0.04, -0.045, phase)
    };
  }

  const phase = ease((value - 0.65) / 0.35);
  return {
    force: interpolate(1, 0, phase),
    rearLeg: interpolate(0.34, 0.04, phase),
    frontLeg: interpolate(-0.3, -0.04, phase),
    rearArm: interpolate(1.08, 0.12, phase),
    rearArmReach: 1,
    rearArmForward: false,
    rearArmRootY: -13,
    frontArm: interpolate(-0.9, 1.2, phase),
    frontArmReach: interpolate(1.55, 1, phase),
    frontArmRootY: interpolate(-20, -13, phase),
    offsetX: interpolate(2, 0, phase),
    offsetY: interpolate(-2, 0, phase),
    rotation: interpolate(-0.045, 0, phase)
  };
}

export function getNovaDownSmashPoseProgress(fighter) {
  const time = Math.max(0, Number(fighter?.actionTime) || 0);
  const impulseAt = NOVA_MOVE_MOTION.downSmashImpulseAt;
  if (time < impulseAt) return clamp(time / impulseAt, 0, 1) * 0.24;
  if (fighter?.onGround) return 1;
  const velocityY = Number(fighter?.vy) || 0;
  if (velocityY < 0) {
    const remainingRise = clamp(-velocityY / 230, 0, 1);
    return 0.24 + (1 - remainingRise) * 0.36;
  }
  return 0.6 + clamp(velocityY / 230, 0, 1) * 0.4;
}

export function getNovaDownSmashMotion(progress, charging = false) {
  const value = clamp(Number(progress) || 0, 0, 1);
  const ease = amount => amount * amount * (3 - 2 * amount);
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  const chargePose = {
    force: 0.18,
    rearLeg: 0.22,
    frontLeg: -0.22,
    rearArm: 0.2,
    rearArmReach: 1,
    rearArmForward: false,
    rearArmRootY: -12,
    frontArm: 1.12,
    frontArmReach: 1,
    frontArmRootY: -12,
    offsetX: 0,
    offsetY: 3,
    rotation: 0
  };
  if (charging) return chargePose;

  if (value < 0.24) {
    const phase = ease(value / 0.24);
    return {
      ...chargePose,
      force: interpolate(0.18, 0.72, phase),
      rearLeg: interpolate(0.22, 0.5, phase),
      frontLeg: interpolate(-0.22, -0.5, phase),
      rearArm: interpolate(0.2, -0.18, phase),
      frontArm: interpolate(1.12, 1.48, phase),
      offsetY: interpolate(3, 0, phase)
    };
  }
  if (value < 0.6) {
    const phase = ease((value - 0.24) / 0.36);
    return {
      force: interpolate(0.72, 1, phase),
      rearLeg: interpolate(0.5, 0.66, phase),
      frontLeg: interpolate(-0.5, -0.66, phase),
      rearArm: interpolate(-0.18, -0.32, phase),
      rearArmReach: 1,
      rearArmForward: false,
      rearArmRootY: -13,
      frontArm: interpolate(1.48, 1.64, phase),
      frontArmReach: 1,
      frontArmRootY: -13,
      offsetX: 0,
      offsetY: 0,
      rotation: 0
    };
  }

  const phase = ease((value - 0.6) / 0.4);
  return {
    force: interpolate(1, 0, phase),
    rearLeg: interpolate(0.66, 0.04, phase),
    frontLeg: interpolate(-0.66, -0.04, phase),
    rearArm: interpolate(-0.32, 0.12, phase),
    rearArmReach: 1,
    rearArmForward: false,
    rearArmRootY: -13,
    frontArm: interpolate(1.64, 1.2, phase),
    frontArmReach: 1,
    frontArmRootY: -13,
    offsetX: 0,
    offsetY: 0,
    rotation: 0
  };
}

export function getNovaGrabMotion(progress, variant = "standing", holding = false, pummelProgress = 0) {
  const value = clamp(Number(progress) || 0, 0, 1);
  const pummelValue = clamp(Number(pummelProgress) || 0, 0, 1);
  const ease = amount => amount * amount * (3 - 2 * amount);
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  const safeVariant = NOVA_GRAB_MOTION.variantReach[variant] ? variant : "standing";
  const maxReach = NOVA_GRAB_MOTION.variantReach[safeVariant];

  if (holding) {
    const strike = Math.sin(pummelValue * Math.PI);
    return {
      force: strike,
      rearLeg: 0.12 + strike * 0.12,
      frontLeg: -0.12 - strike * 0.15,
      rearArm: interpolate(0.12, -0.03, strike),
      rearArmReach: interpolate(1, NOVA_GRAB_MOTION.pummelRearReach, strike),
      rearArmForward: strike > 0.02,
      rearArmRootY: -13,
      frontArm: 0,
      frontArmReach: NOVA_GRAB_MOTION.holdReach,
      frontArmRootY: NOVA_GRAB_MOTION.frontShoulderY,
      offsetX: strike * 2,
      offsetY: 0,
      rotation: strike * 0.035
    };
  }

  let extension = 0;
  if (value < 0.3) extension = ease(value / 0.3);
  else if (value < 0.55) extension = 1;
  else extension = 1 - ease((value - 0.55) / 0.45);
  const variantLean = safeVariant === "dash" ? 1 : safeVariant === "pivot" ? 0.72 : 0.35;
  return {
    force: extension,
    rearLeg: 0.04 + extension * 0.18 * variantLean,
    frontLeg: -0.04 - extension * 0.22 * variantLean,
    rearArm: 0.12 + extension * 0.12,
    rearArmReach: 1,
    rearArmForward: false,
    rearArmRootY: -13,
    frontArm: interpolate(1.2, 0, extension),
    frontArmReach: interpolate(1, maxReach, extension),
    frontArmRootY: NOVA_GRAB_MOTION.frontShoulderY,
    offsetX: extension * 4 * variantLean,
    offsetY: extension * variantLean,
    rotation: extension * 0.055 * variantLean
  };
}

export function getNovaGrabbedFighterOffset(targetWidth = NOVA_BODY_SIZE.width) {
  const width = Math.max(0, Number(targetWidth) || NOVA_BODY_SIZE.width);
  const handX = NOVA_GRAB_MOTION.frontShoulderX +
    NOVA_GRAB_MOTION.frontArmLength * NOVA_GRAB_MOTION.holdReach;
  return {
    x: handX + width / 2 - NOVA_GRAB_MOTION.targetInset,
    y: 0
  };
}

function novaThrowVariant(variant) {
  return ["forward", "back", "up", "down"].includes(variant) ? variant : "forward";
}

function novaThrowMoveId(variant) {
  const safeVariant = novaThrowVariant(variant);
  return `throw${safeVariant[0].toUpperCase()}${safeVariant.slice(1)}`;
}

function novaThrowProgress(variant, actionTime) {
  const move = getMove("nova", novaThrowMoveId(variant));
  return clamp((Number(actionTime) || 0) / Math.max(1 / 60, move.total || 1), 0, 1);
}

function novaThrowArmToPoint(rootX, rootY, pointX, pointY, baseLength) {
  const distanceX = pointX - rootX;
  const distanceY = pointY - rootY;
  return {
    angle: Math.atan2(distanceY, distanceX),
    reach: Math.max(0.8, Math.hypot(distanceX, distanceY) / baseLength)
  };
}

export function getNovaThrowTargetOffset(variant, actionTime, targetWidth = NOVA_BODY_SIZE.width) {
  const safeVariant = novaThrowVariant(variant);
  const time = Math.max(0, Number(actionTime) || 0);
  const hold = getNovaGrabbedFighterOffset(targetWidth);
  const ease = amount => {
    const value = clamp(amount, 0, 1);
    return value * value * (3 - 2 * value);
  };
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  const mixPoint = (from, to, amount) => ({
    x: interpolate(from.x, to.x, amount),
    y: interpolate(from.y, to.y, amount)
  });

  if (safeVariant === "forward") {
    const releaseAt = NOVA_THROW_MOTION.forwardReleaseAt;
    const phase = clamp(time / releaseAt, 0, 1);
    const drawnBack = { x: 22, y: -24 };
    if (phase < 0.42) return mixPoint(hold, drawnBack, ease(phase / 0.42));
    return mixPoint(drawnBack, { x: 116, y: -8 }, ease((phase - 0.42) / 0.58));
  }

  if (safeVariant === "back") {
    const phase = ease(time / NOVA_THROW_MOTION.backTossAt);
    const control = { x: 4, y: -68 };
    const end = { x: -76, y: -4 };
    const inverse = 1 - phase;
    return {
      x: inverse * inverse * hold.x + 2 * inverse * phase * control.x + phase * phase * end.x,
      y: inverse * inverse * hold.y + 2 * inverse * phase * control.y + phase * phase * end.y
    };
  }

  if (safeVariant === "up") {
    const phase = ease(time / NOVA_THROW_MOTION.upReleaseAt);
    return mixPoint(hold, { x: 0, y: -84 }, phase);
  }

  const phase = ease(time / NOVA_THROW_MOTION.downTransferAt);
  return mixPoint(hold, { x: 4, y: 34 }, phase);
}

export function getNovaThrowMotion(variant, actionTime) {
  const safeVariant = novaThrowVariant(variant);
  const time = Math.max(0, Number(actionTime) || 0);
  const progress = novaThrowProgress(safeVariant, time);
  const target = getNovaThrowTargetOffset(safeVariant, time);
  const ease = amount => {
    const value = clamp(amount, 0, 1);
    return value * value * (3 - 2 * value);
  };
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  const pose = {
    force: Math.sin(progress * Math.PI),
    rearLeg: 0.1,
    frontLeg: -0.1,
    rearArm: 0.12,
    rearArmReach: 1,
    rearArmForward: false,
    rearArmRootY: -13,
    frontArm: 0,
    frontArmReach: NOVA_GRAB_MOTION.holdReach,
    frontArmRootY: NOVA_GRAB_MOTION.frontShoulderY,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    targetX: target.x,
    targetY: target.y
  };

  if (safeVariant === "forward") {
    const phase = clamp(time / NOVA_THROW_MOTION.forwardReleaseAt, 0, 1);
    const targetHandX = target.x - NOVA_BODY_SIZE.width / 2 + NOVA_GRAB_MOTION.targetInset;
    const front = novaThrowArmToPoint(19, -13, targetHandX, target.y, 36);
    pose.frontArm = front.angle;
    pose.frontArmReach = front.reach;
    pose.rearLeg = 0.08 + Math.sin(phase * Math.PI) * 0.28;
    pose.frontLeg = -0.08 - Math.sin(phase * Math.PI) * 0.36;
    pose.offsetX = ease(Math.max(0, (phase - 0.42) / 0.58)) * 6;
    pose.rotation = interpolate(-0.07, 0.12, phase);
    return pose;
  }

  if (safeVariant === "back") {
    const tossPhase = clamp(time / NOVA_THROW_MOTION.backTossAt, 0, 1);
    const followPhase = clamp(
      (time - NOVA_THROW_MOTION.backTossAt) /
        (NOVA_THROW_MOTION.backReleaseAt - NOVA_THROW_MOTION.backTossAt),
      0,
      1
    );
    const followStrike = Math.sin(followPhase * Math.PI);
    pose.rearLeg = 0.1 - tossPhase * 0.26;
    pose.frontLeg = -0.1 + tossPhase * 0.3;
    pose.frontArm = interpolate(0, -Math.PI, ease(tossPhase));
    pose.frontArmReach = interpolate(NOVA_GRAB_MOTION.holdReach, 2.62, ease(tossPhase));
    pose.offsetX = -followStrike * 3;
    pose.rotation = -0.1 * Math.sin(tossPhase * Math.PI) + followStrike * 0.06;
    return pose;
  }

  if (safeVariant === "up") {
    const phase = ease(time / NOVA_THROW_MOTION.upReleaseAt);
    const rear = novaThrowArmToPoint(-20, -13, -13, -65, 30);
    const front = novaThrowArmToPoint(19, -13, 13, -65, 36);
    pose.rearLeg = interpolate(0.1, 0.42, phase);
    pose.frontLeg = interpolate(-0.1, -0.42, phase);
    pose.rearArm = interpolate(0.12, rear.angle, phase);
    pose.rearArmReach = interpolate(1, rear.reach, phase);
    pose.rearArmForward = phase > 0.04;
    pose.frontArm = interpolate(0, front.angle, phase);
    pose.frontArmReach = interpolate(NOVA_GRAB_MOTION.holdReach, front.reach, phase);
    pose.offsetY = -phase * 4;
    return pose;
  }

  const transferPhase = ease(time / NOVA_THROW_MOTION.downTransferAt);
  const rear = novaThrowArmToPoint(-20, -13, -8, 28, 30);
  pose.rearLeg = interpolate(0.1, 0.34, transferPhase);
  pose.frontLeg = interpolate(-0.1, -0.34, transferPhase);
  pose.rearArm = interpolate(0.12, rear.angle, transferPhase);
  pose.rearArmReach = interpolate(1, rear.reach, transferPhase);
  pose.rearArmForward = transferPhase > 0.04;
  pose.frontArm = interpolate(0, 1.2, transferPhase);
  pose.frontArmReach = interpolate(NOVA_GRAB_MOTION.holdReach, 1, transferPhase);
  pose.offsetY = transferPhase * 2;
  return pose;
}

export function getNovaNeutralSpecialMotion(actionTime) {
  const move = getMove("nova", "specialNeutral");
  const time = Math.max(0, Number(actionTime) || 0);
  const ease = amount => {
    const value = clamp(amount, 0, 1);
    return value * value * (3 - 2 * value);
  };
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  const focus = time <= move.spawnAt
    ? ease(time / move.spawnAt)
    : 1 - ease((time - move.spawnAt) / Math.max(1 / 60, move.total - move.spawnAt));
  return {
    force: focus,
    rearLeg: 0.04 + focus * 0.12,
    frontLeg: -0.04 - focus * 0.12,
    rearArm: interpolate(0.12, -0.95, focus),
    rearArmReach: interpolate(1, 0.86, focus),
    rearArmForward: focus > 0.04,
    rearArmRootY: -13,
    frontArm: interpolate(1.2, -2.16, focus),
    frontArmReach: interpolate(1, 0.82, focus),
    frontArmRootY: -13,
    offsetX: time >= move.spawnAt ? -Math.max(0, 1 - (time - move.spawnAt) / 0.1) * 2 : 0,
    offsetY: -focus,
    rotation: 0
  };
}

export function getNovaSideSpecialMotion(actionTime) {
  const move = getMove("nova", "specialSide");
  const time = Math.max(0, Number(actionTime) || 0);
  const ease = amount => {
    const value = clamp(amount, 0, 1);
    return value * value * (3 - 2 * value);
  };
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  const brace = time <= move.spawnAt
    ? ease(time / move.spawnAt)
    : 1 - ease((time - move.spawnAt) / Math.max(1 / 60, move.total - move.spawnAt));
  const recoil = time >= move.spawnAt
    ? Math.max(0, 1 - (time - move.spawnAt) / 0.12)
    : 0;
  return {
    force: brace,
    rearLeg: 0.04 + brace * 0.22,
    frontLeg: -0.04 - brace * 0.28,
    rearArm: interpolate(0.12, 0, brace),
    rearArmReach: interpolate(1, 1.82, brace),
    rearArmForward: brace > 0.04,
    rearArmRootY: interpolate(-13, -26, brace),
    frontArm: interpolate(1.2, 0, brace),
    frontArmReach: interpolate(1, 1.95, brace),
    frontArmRootY: interpolate(-13, -26, brace),
    offsetX: brace * 4 - recoil * 3,
    offsetY: brace,
    rotation: brace * 0.06 - recoil * 0.04
  };
}

export function getNovaRecoveryMotion(elapsed, phase = "thrust") {
  const progress = clamp((Number(elapsed) || 0) / NOVA_RECOVERY.thrustDuration, 0, 1);
  const thrusting = phase === "thrust";
  const force = thrusting ? Math.min(1, progress * 6, (1 - progress) * 5 + 0.35) : 0;
  return {
    force,
    rearLeg: 0.04 - force * 0.18,
    frontLeg: -0.04 + force * 0.18,
    rearArm: 0.12 - force * 0.34,
    rearArmReach: 1,
    rearArmForward: false,
    rearArmRootY: -13,
    frontArm: 1.2 + force * 0.34,
    frontArmReach: 1,
    frontArmRootY: -13,
    offsetX: 0,
    offsetY: -force * 2,
    rotation: 0
  };
}

export function getNovaChargeMotion(ratio) {
  const value = clamp(Number(ratio) || 0, 0, 1);
  const pulse = Math.sin(value * Math.PI * 8) * 0.06;
  return {
    force: value,
    rearLeg: 0.12 + value * 0.18,
    frontLeg: -0.12 - value * 0.18,
    rearArm: 0.12 + value * 0.48 + pulse,
    rearArmReach: 1 + value * 0.12,
    rearArmForward: value > 0.02,
    rearArmRootY: -13,
    frontArm: 1.2 + value * 1.12 - pulse,
    frontArmReach: 1,
    frontArmRootY: -13,
    offsetX: 0,
    offsetY: value * 2,
    rotation: 0
  };
}

export function getNovaFinalSmashMotion(elapsed) {
  const time = clamp(Number(elapsed) || 0, 0, NOVA_FINAL_SMASH.totalDuration);
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  const transform = smoothStep(clamp(time / NOVA_FINAL_SMASH.transformDuration, 0, 1));
  const punchProgress = smoothStep(clamp(
    (time - NOVA_FINAL_SMASH.punchStart) / NOVA_FINAL_SMASH.punchTravelDuration,
    0,
    1
  ));
  const returnStart = NOVA_FINAL_SMASH.punchAt + NOVA_FINAL_SMASH.punchActiveDuration;
  const returnProgress = smoothStep(clamp(
    (time - returnStart) / NOVA_FINAL_SMASH.recoveryDuration,
    0,
    1
  ));
  const aimProgress = smoothStep(clamp(punchProgress / 0.55, 0, 1));
  const thrustProgress = smoothStep(clamp((punchProgress - 0.35) / 0.65, 0, 1));
  const loadedAngle = -2.72;
  const aimedAngle = -0.16;
  let armAngle = interpolate(1.2, loadedAngle, transform);
  let armLength = interpolate(NOVA_FINAL_SMASH.normalArmLength, NOVA_FINAL_SMASH.loadedArmLength, transform);
  let armThickness = interpolate(
    NOVA_FINAL_SMASH.normalArmThickness,
    NOVA_FINAL_SMASH.maxArmThickness,
    transform
  );

  if (time >= NOVA_FINAL_SMASH.punchStart) {
    armAngle = interpolate(loadedAngle, aimedAngle, aimProgress);
    armAngle = interpolate(armAngle, 0, thrustProgress);
    armLength = interpolate(NOVA_FINAL_SMASH.loadedArmLength, NOVA_FINAL_SMASH.maxArmLength, thrustProgress);
  }
  if (time >= returnStart) {
    armAngle = interpolate(0, 1.2, returnProgress);
    armLength = interpolate(NOVA_FINAL_SMASH.maxArmLength, NOVA_FINAL_SMASH.normalArmLength, returnProgress);
    armThickness = interpolate(
      NOVA_FINAL_SMASH.maxArmThickness,
      NOVA_FINAL_SMASH.normalArmThickness,
      returnProgress
    );
  }

  const speechFadeIn = clamp(
    (time - NOVA_FINAL_SMASH.transformDuration) / 0.12,
    0,
    1
  );
  const speechFadeOut = clamp(
    (NOVA_FINAL_SMASH.punchStart - time) / 0.12,
    0,
    1
  );
  const punchForce = Math.sin(clamp(
    (time - NOVA_FINAL_SMASH.punchStart) /
      (NOVA_FINAL_SMASH.punchTravelDuration + NOVA_FINAL_SMASH.punchActiveDuration),
    0,
    1
  ) * Math.PI);

  return {
    phase: time < NOVA_FINAL_SMASH.transformDuration
      ? "transform"
      : time < NOVA_FINAL_SMASH.punchStart
      ? "hold"
      : time < NOVA_FINAL_SMASH.punchAt
      ? "punch"
      : time < returnStart
      ? "active"
      : "recover",
    timeFrozen: time < NOVA_FINAL_SMASH.punchAt,
    showSpeech: time >= NOVA_FINAL_SMASH.transformDuration && time < NOVA_FINAL_SMASH.punchStart,
    speechAlpha: speechFadeIn * speechFadeOut,
    transform,
    punchProgress,
    returnProgress,
    armAngle,
    armLength,
    armThickness,
    frontArmVisible: false,
    rearLeg: 0.04 + transform * 0.38 - returnProgress * 0.38,
    frontLeg: -0.04 - transform * 0.5 + returnProgress * 0.5,
    rearArm: 0.12 + transform * 0.42 - returnProgress * 0.42,
    rearArmReach: 1 + transform * 0.16 - returnProgress * 0.16,
    rearArmForward: transform > 0.05 && returnProgress < 0.95,
    rearArmRootY: -13,
    frontArm: 1.2,
    frontArmReach: 1,
    frontArmRootY: -18,
    offsetX: punchForce * 7,
    offsetY: -transform * 2 + returnProgress * 2,
    rotation: punchForce * 0.055
  };
}

export function getNovaForwardAirMotion(progress) {
  const value = clamp(Number(progress) || 0, 0, 1);
  const ease = amount => amount * amount * (3 - 2 * amount);
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  const maxReach = 1.58 * 1.25;

  if (value < 0.18) {
    const phase = ease(value / 0.18);
    return {
      angle: interpolate(1.2, 1.55, phase),
      reach: 1,
      force: phase * 0.18
    };
  }
  if (value < 0.48) {
    const phase = ease((value - 0.18) / 0.3);
    return {
      angle: interpolate(1.55, -0.78, phase),
      reach: interpolate(1, maxReach, Math.sin(phase * Math.PI / 2)),
      force: interpolate(0.18, 1, Math.sin(phase * Math.PI / 2))
    };
  }
  if (value < 0.62) {
    const phase = ease((value - 0.48) / 0.14);
    return {
      angle: interpolate(-0.78, -0.92, phase),
      reach: interpolate(maxReach, 1.35, phase),
      force: interpolate(1, 0.72, phase)
    };
  }
  const phase = ease((value - 0.62) / 0.38);
  return {
    angle: interpolate(-0.92, 1.2, phase),
    reach: interpolate(1.35, 1, phase),
    force: interpolate(0.72, 0, phase)
  };
}

export function getNovaBackAirPoseProgress(actionTime, contact = false) {
  const time = Math.max(0, Number(actionTime) || 0);
  const move = NOVA_MOVES.airBack;
  const startupEnd = move.hits[0].start;
  const lastHit = move.hits[move.hits.length - 1];
  const activeEnd = lastHit.start + lastHit.duration;
  const recoveryEnd = contact ? move.contactTotal : move.total;
  if (time < startupEnd) return clamp(time / startupEnd, 0, 1) * 0.2;
  if (time <= activeEnd) {
    return 0.2 + clamp((time - startupEnd) / (activeEnd - startupEnd), 0, 1) * 0.52;
  }
  return 0.72 + clamp((time - activeEnd) / Math.max(1 / 60, recoveryEnd - activeEnd), 0, 1) * 0.28;
}

export function getNovaBackAirMotion(progress) {
  const value = clamp(Number(progress) || 0, 0, 1);
  const ease = amount => amount * amount * (3 - 2 * amount);
  let force = 1;
  if (value < 0.2) force = ease(value / 0.2);
  else if (value > 0.72) force = 1 - ease((value - 0.72) / 0.28);

  return {
    force,
    bodyLean: force * 0.27,
    offsetX: force * 3,
    offsetY: force * 1.5,
    rearLeg: 0.04 + force * 1.03,
    frontLeg: -0.04 + force * 1.01,
    rearArm: 0.12 - force * 0.48,
    frontArm: 1.2 - force * 0.36
  };
}

export function getNovaBackAirFlame(actionTime, contact = false, hitId = null) {
  const time = Math.max(0, Number(actionTime) || 0);
  const move = NOVA_MOVES.airBack;
  const hit = hitId
    ? move.hits.find(candidate => candidate.id === hitId)
    : move.hits.find(candidate => {
      if (candidate.requiresContact && !contact) return false;
      return time >= candidate.start && time <= candidate.start + candidate.duration;
    });
  if (!hit || (hit.requiresContact && !contact)) return null;

  const poseProgress = getNovaBackAirPoseProgress(time, contact);
  const motion = getNovaBackAirMotion(poseProgress);
  const footPosition = (rootX, angle) => ({
    x: rootX - Math.sin(angle) * 25,
    y: 14 + Math.cos(angle) * 25
  });
  const rearFoot = footPosition(-11, motion.rearLeg);
  const frontFoot = footPosition(10, motion.frontLeg);
  const originX = (rearFoot.x + frontFoot.x) / 2;
  const originY = (rearFoot.y + frontFoot.y) / 2;
  const length = hit.flameLength;
  const thickness = hit.flameThickness;

  return {
    hitId: hit.id,
    large: hit.id === "finish",
    progress: clamp((time - hit.start) / Math.max(1 / 60, hit.duration), 0, 1),
    originX,
    originY,
    centerX: originX - length / 2,
    centerY: originY,
    length,
    thickness,
    poseProgress,
    motion
  };
}

export function getNovaUpAirPoseProgress(actionTime) {
  const time = Math.max(0, Number(actionTime) || 0);
  const move = NOVA_MOVES.airUp;
  const startupEnd = move.motion.start;
  if (time < startupEnd) return clamp(time / startupEnd, 0, 1) * 0.2;
  if (time <= NOVA_MOVE_MOTION.upAirActiveEnd) {
    return 0.2 + clamp(
      (time - startupEnd) / (NOVA_MOVE_MOTION.upAirActiveEnd - startupEnd),
      0,
      1
    ) * 0.35;
  }
  return 0.55 + clamp(
    (time - NOVA_MOVE_MOTION.upAirActiveEnd) / NOVA_MOVE_MOTION.upAirRecoveryDuration,
    0,
    1
  ) * 0.45;
}

export function getNovaUpAirMotion(progress) {
  const value = clamp(Number(progress) || 0, 0, 1);
  const ease = amount => amount * amount * (3 - 2 * amount);
  let force = 1;
  if (value < 0.2) force = ease(value / 0.2);
  else if (value > 0.55) force = 1 - ease((value - 0.55) / 0.45);
  return {
    force,
    rearLeg: 0.04 + force * 0.16,
    frontLeg: -0.04 - force * 0.16,
    rearArm: 0.12,
    frontArm: 1.2,
    offsetY: -force * 2
  };
}

export function getNovaUpAirJet(actionTime) {
  const time = Math.max(0, Number(actionTime) || 0);
  const hit = NOVA_MOVES.airUp.hits.find(candidate => candidate.id === "jet");
  if (time < hit.start || time > hit.start + hit.duration) return null;
  return {
    progress: clamp((time - hit.start) / hit.duration, 0, 1),
    leftX: -11,
    rightX: 10,
    originY: 37,
    length: 37,
    width: 17
  };
}

export function getNovaDownAirFlame(actionTime) {
  const time = Math.max(0, Number(actionTime) || 0);
  const hits = NOVA_MOVES.airDown.hits;
  const start = hits[0].start;
  const lastHit = hits[hits.length - 1];
  const end = lastHit.start + lastHit.duration;
  if (time < start || time > end) return null;
  return {
    ...NOVA_AIR_DOWN_FLAME,
    progress: clamp((time - start) / (end - start), 0, 1)
  };
}

export function isNovaUpAirHeadIntangible(fighter) {
  if (fighter?.characterId !== "nova" || fighter.action !== "airUp") return false;
  const move = fighter.move || NOVA_MOVES.airUp;
  const bodyHit = move.hits?.find(hit => hit.id === "body") || NOVA_MOVES.airUp.hits[1];
  const time = fighter.actionTime || 0;
  return time >= bodyHit.start && time <= bodyHit.start + bodyHit.duration;
}

export function getNovaUpTiltMotion(progress) {
  const value = clamp(Number(progress) || 0, 0, 1);
  const ease = amount => amount * amount * (3 - 2 * amount);
  const interpolate = (from, to, amount) => from + (to - from) * amount;
  let rightHandAngle = 0.12;
  let rightHandReach = 1;
  let rightHandForce = 0;
  let rightHandExtended = false;
  let leftHandAngle = 1.2;
  let leftHandReach = 1;
  let leftHandForce = 0;

  if (value < 0.12) {
    const phase = ease(value / 0.12);
    rightHandAngle = interpolate(0.12, 2.35, phase);
    rightHandForce = phase * 0.25;
    rightHandExtended = value >= 0.04;
  } else if (value < 0.33) {
    const phase = ease((value - 0.12) / 0.21);
    rightHandAngle = interpolate(2.35, 5.95, phase);
    rightHandReach = 1 + Math.sin(phase * Math.PI) * 0.32;
    rightHandForce = interpolate(0.25, 1, Math.sin(phase * Math.PI));
    rightHandExtended = true;
  } else if (value < 0.65) {
    const phase = ease((value - 0.33) / 0.32);
    rightHandAngle = interpolate(5.95, 0.12 + Math.PI * 2, phase);
    rightHandReach = interpolate(1.1, 0.86, phase);
    rightHandForce = interpolate(0.35, 0, phase);
    rightHandExtended = true;
  }

  if (value >= 0.24 && value < 0.33) {
    const phase = ease((value - 0.24) / 0.09);
    leftHandAngle = interpolate(1.2, 0.78, phase);
    leftHandReach = interpolate(0.94, 1, phase);
    leftHandForce = phase * 0.25;
  } else if (value >= 0.33 && value < 0.55) {
    const phase = ease((value - 0.33) / 0.22);
    leftHandAngle = interpolate(0.78, -2.8, phase);
    leftHandReach = 1 + Math.sin(phase * Math.PI) * 0.32;
    leftHandForce = interpolate(0.25, 1, Math.sin(phase * Math.PI));
  } else if (value >= 0.55 && value < 0.78) {
    const phase = ease((value - 0.55) / 0.23);
    leftHandAngle = interpolate(-2.8, 1.2 - Math.PI * 2, phase);
    leftHandReach = interpolate(1.1, 1, phase);
    leftHandForce = interpolate(0.35, 0, phase);
  }

  return {
    rightHandAngle,
    rightHandReach,
    rightHandForce,
    rightHandExtended,
    rightShoulderY: -13 - rightHandForce * 8,
    leftHandAngle,
    leftHandReach,
    leftHandForce,
    leftShoulderY: -13 - leftHandForce * 8
  };
}

export function getNovaDownTiltMotion(progress) {
  const value = clamp(Number(progress) || 0, 0, 1);
  const ease = amount => amount * amount * (3 - 2 * amount);
  let force = 0;
  let flame = 0;

  if (value < 0.23) {
    force = ease(value / 0.23);
  } else if (value < 0.56) {
    force = 1;
  } else {
    force = 1 - ease((value - 0.56) / 0.44);
  }

  if (value < 0.16) {
    flame = ease(value / 0.16) * 0.45;
  } else if (value < 0.58) {
    flame = 1;
  } else if (value < 0.78) {
    flame = 1 - ease((value - 0.58) / 0.2);
  }

  return {
    force,
    flame,
    rearLeg: 0.04 + force * 0.13,
    frontLeg: -0.04 - force * 0.13,
    rearArm: 0.12 + force * 0.52,
    frontArm: 1.2 - force * 0.5,
    armRootY: -13 - force * 2.5
  };
}

function getNovaArmTrackingHitbox(fighter, { shoulderX, shoulderY, angle, length, padding = 12 }) {
  const angleCos = Math.cos(angle);
  const angleSin = Math.sin(angle);
  const armCenterOffset = 6;
  const startLocalX = shoulderX - angleSin * armCenterOffset;
  const startY = shoulderY + angleCos * armCenterOffset;
  const endLocalX = startLocalX + angleCos * length;
  const endY = startY + angleSin * length;
  const startX = fighter.x + fighter.facing * startLocalX;
  const endX = fighter.x + fighter.facing * endLocalX;
  return {
    x: Math.min(startX, endX) - padding,
    y: fighter.y + Math.min(startY, endY) - padding,
    w: Math.abs(endX - startX) + padding * 2,
    h: Math.abs(endY - startY) + padding * 2
  };
}

function getNovaSideTiltHitbox(fighter, move) {
  const progress = (fighter.actionTime || 0) / Math.max(1 / 60, move.total || 1);
  const motion = getNovaSideTiltMotion(progress);
  return getNovaArmTrackingHitbox(fighter, {
    shoulderX: 19,
    shoulderY: -13,
    angle: motion.angle,
    length: 32 * motion.reach
  });
}

function getNovaSideSmashHitbox(fighter, move) {
  const progress = (fighter.actionTime || 0) / Math.max(1 / 60, move.total || 1);
  const motion = getNovaSideSmashMotion(progress);
  return getNovaArmTrackingHitbox(fighter, {
    shoulderX: 19,
    shoulderY: motion.frontArmRootY,
    angle: motion.frontArm,
    length: 32 * motion.frontArmReach,
    padding: 18
  });
}

function getNovaUpSmashHitbox(fighter) {
  const motion = getNovaUpSmashMotion(getNovaUpSmashPoseProgress(fighter));
  return getNovaArmTrackingHitbox(fighter, {
    shoulderX: 19,
    shoulderY: motion.frontArmRootY,
    angle: motion.frontArm,
    length: 32 * motion.frontArmReach,
    padding: 18
  });
}

function getNovaForwardAirHitbox(fighter, move) {
  const progress = (fighter.actionTime || 0) / Math.max(1 / 60, move.total || 1);
  const motion = getNovaForwardAirMotion(progress);
  return getNovaArmTrackingHitbox(fighter, {
    shoulderX: 19,
    shoulderY: -13 - motion.force * 2,
    angle: motion.angle,
    length: 32 * motion.reach,
    padding: 13
  });
}

function getNovaBackAirHitbox(fighter, move) {
  const flame = getNovaBackAirFlame(fighter.actionTime, true, move.hitId);
  if (!flame) return { x: fighter.x, y: fighter.y, w: 0, h: 0 };
  const angle = flame.motion.bodyLean;
  const angleCos = Math.cos(angle);
  const angleSin = Math.sin(angle);
  const rotatedCenterX = flame.centerX * angleCos - flame.centerY * angleSin;
  const rotatedCenterY = flame.centerX * angleSin + flame.centerY * angleCos;
  const halfWidth = Math.abs(angleCos) * flame.length / 2 + Math.abs(angleSin) * flame.thickness / 2;
  const halfHeight = Math.abs(angleSin) * flame.length / 2 + Math.abs(angleCos) * flame.thickness / 2;
  const centerX = fighter.x + fighter.facing * (flame.motion.offsetX + rotatedCenterX);
  const centerY = fighter.y + flame.motion.offsetY + rotatedCenterY;
  return {
    x: centerX - halfWidth,
    y: centerY - halfHeight,
    w: halfWidth * 2,
    h: halfHeight * 2
  };
}

function getNovaUpAirHitbox(fighter, move) {
  const motion = getNovaUpAirMotion(getNovaUpAirPoseProgress(fighter.actionTime));
  if (move.hitId === "jet") {
    const jet = getNovaUpAirJet(fighter.actionTime);
    if (!jet) return { x: fighter.x, y: fighter.y, w: 0, h: 0 };
    const left = jet.leftX - jet.width / 2;
    const right = jet.rightX + jet.width / 2;
    return {
      x: fighter.x + left,
      y: fighter.y + motion.offsetY + jet.originY,
      w: right - left,
      h: jet.length
    };
  }
  return {
    x: fighter.x - 26,
    y: fighter.y + motion.offsetY - 51,
    w: 52,
    h: 58
  };
}

function getNovaDownAirHitbox(fighter) {
  const flame = getNovaDownAirFlame(fighter.actionTime) || NOVA_AIR_DOWN_FLAME;
  return {
    x: fighter.x - flame.width / 2,
    y: fighter.y + flame.originY,
    w: flame.width,
    h: flame.height
  };
}

function getNovaUpTiltHitbox(fighter, move) {
  const progress = (fighter.actionTime || 0) / Math.max(1 / 60, move.total || 1);
  const motion = getNovaUpTiltMotion(progress);
  const rightHand = move.hitId === "spin1";
  return getNovaArmTrackingHitbox(fighter, rightHand ? {
    shoulderX: -20,
    shoulderY: motion.rightShoulderY,
    angle: motion.rightHandAngle,
    length: 39 * motion.rightHandReach
  } : {
    shoulderX: 19,
    shoulderY: motion.leftShoulderY,
    angle: motion.leftHandAngle,
    length: 32 * motion.leftHandReach
  });
}

export function getHitbox(fighter, move) {
  if (fighter?.characterId === "nova" && move.id === "smashUp" && move.hitId === "uppercut") {
    return getNovaUpSmashHitbox(fighter);
  }
  if (fighter?.characterId === "nova" && move.id === "smashSide" && move.hitId === "punch") {
    return getNovaSideSmashHitbox(fighter, move);
  }
  if (fighter?.characterId === "nova" && move.id === "side" && move.hitId === "arm") {
    return getNovaSideTiltHitbox(fighter, move);
  }
  if (fighter?.characterId === "nova" && move.id === "up" && ["spin1", "spin2"].includes(move.hitId)) {
    return getNovaUpTiltHitbox(fighter, move);
  }
  if (fighter?.characterId === "nova" && move.id === "airForward" && move.hitId === "swing") {
    return getNovaForwardAirHitbox(fighter, move);
  }
  if (fighter?.characterId === "nova" && move.id === "airBack") {
    return getNovaBackAirHitbox(fighter, move);
  }
  if (fighter?.characterId === "nova" && move.id === "airUp" && ["jet", "body"].includes(move.hitId)) {
    return getNovaUpAirHitbox(fighter, move);
  }
  if (fighter?.characterId === "nova" && move.id === "airDown") {
    return getNovaDownAirHitbox(fighter);
  }
  if (move.shape === "circle") {
    const radius = Math.max(0, Number(move.radius) || 0);
    const direction = move.mirror || move.forward ? fighter.facing : 1;
    const cx = fighter.x + direction * (move.offsetX || 0);
    const cy = fighter.y + (move.offsetY || 0);
    return {
      shape: "circle",
      cx,
      cy,
      radius,
      x: cx - radius,
      y: cy - radius,
      w: radius * 2,
      h: radius * 2
    };
  }
  if (move.mirror) {
    const centerX = fighter.x + fighter.facing * (move.offsetX || 0);
    return { x: centerX - move.w / 2, y: fighter.y + move.offsetY, w: move.w, h: move.h };
  }
  if (move.forward) {
    const x = fighter.facing > 0 ? fighter.x + move.offsetX : fighter.x - move.offsetX - move.w;
    return { x, y: fighter.y + move.offsetY, w: move.w, h: move.h };
  }
  return { x: fighter.x + move.offsetX, y: fighter.y + move.offsetY, w: move.w, h: move.h };
}

export function hitboxesOverlap(first, second) {
  const firstIsCircle = first?.shape === "circle";
  const secondIsCircle = second?.shape === "circle";
  if (firstIsCircle && secondIsCircle) {
    const distanceX = first.cx - second.cx;
    const distanceY = first.cy - second.cy;
    const combinedRadius = first.radius + second.radius;
    return distanceX * distanceX + distanceY * distanceY <= combinedRadius * combinedRadius;
  }
  if (firstIsCircle) return circleRectOverlap(first, second);
  if (secondIsCircle) return circleRectOverlap(second, first);
  return first.x < second.x + second.w && first.x + first.w > second.x &&
    first.y < second.y + second.h && first.y + first.h > second.y;
}

function circleRectOverlap(circle, rect) {
  const nearestX = clamp(circle.cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(circle.cy, rect.y, rect.y + rect.h);
  const distanceX = circle.cx - nearestX;
  const distanceY = circle.cy - nearestY;
  return distanceX * distanceX + distanceY * distanceY <= circle.radius * circle.radius;
}

export function getKnockdownBodyPose(fighter) {
  if (fighter.knockdown?.phase === "down" || fighter.action === "downed") {
    return { progress: 0, rotation: -Math.PI / 2 };
  }

  let progress = null;
  if (fighter.knockdown?.phase === "getup" || fighter.action === "getup") {
    progress = clamp((fighter.actionTime || 0) / KNOCKDOWN.getupDuration, 0, 1);
  } else if (fighter.action === "getupAttack") {
    const total = fighter.move?.total || getMove(fighter.characterId || DEFAULT_CHARACTER_ID, "getupAttack")?.total || 1;
    progress = clamp((fighter.actionTime || 0) / total / 0.3, 0, 1);
  }
  if (progress === null) return null;

  const eased = progress * progress * (3 - 2 * progress);
  return {
    progress: eased,
    rotation: -Math.PI / 2 * (1 - eased)
  };
}

export function fighterRect(fighter) {
  const knockdownPose = getKnockdownBodyPose(fighter);
  if (knockdownPose) {
    const cosine = Math.abs(Math.cos(knockdownPose.rotation));
    const sine = Math.abs(Math.sin(knockdownPose.rotation));
    const width = fighter.w * cosine + fighter.h * sine;
    const height = fighter.w * sine + fighter.h * cosine;
    return {
      x: fighter.x - width / 2,
      y: fighter.y + fighter.h / 2 - height,
      w: width,
      h: height
    };
  }
  const height = fighter.crouching ? fighter.h * 0.7 : fighter.h;
  const y = fighter.y + fighter.h / 2 - height;
  return { x: fighter.x - fighter.w / 2, y, w: fighter.w, h: height };
}

function getNovaHurtboxPose(fighter) {
  const action = fighter.action || "";
  const move = fighter.move || getMove("nova", action);
  const total = Math.max(1 / 60, move?.total || 1);
  const progress = clamp((fighter.actionTime || 0) / total, 0, 1);
  const punch = Math.sin(progress * Math.PI);
  const pose = {
    rearLeg: 0.04,
    frontLeg: -0.04,
    rearArm: 0.12,
    rearArmReach: 1,
    rearArmForward: false,
    rearArmRootY: -13,
    frontArm: 1.2,
    frontArmReach: 1,
    frontArmRootY: -13,
    offsetX: 0,
    offsetY: 0,
    rotation: 0
  };

  if (action === "side") {
    const motion = getNovaSideTiltMotion(progress);
    pose.rearLeg += motion.force * 0.18;
    pose.frontLeg -= motion.force * 0.22;
    pose.rearArm += motion.force * 0.24;
    pose.frontArm = motion.angle;
    pose.frontArmReach = motion.reach;
    pose.offsetX = Math.sin(progress * Math.PI) * 2;
    pose.rotation = Math.sin(progress * Math.PI) * 0.035;
  } else if (action === "smashSide" || (action === "smashCharge" && fighter.smashCharge?.moveId === "smashSide")) {
    const motion = getNovaSideSmashMotion(progress, action === "smashCharge");
    Object.assign(pose, {
      rearLeg: motion.rearLeg,
      frontLeg: motion.frontLeg,
      rearArm: motion.rearArm,
      frontArm: motion.frontArm,
      frontArmReach: motion.frontArmReach,
      frontArmRootY: motion.frontArmRootY,
      offsetX: motion.offsetX,
      offsetY: motion.offsetY,
      rotation: motion.rotation
    });
  } else if (action === "smashUp" || (action === "smashCharge" && fighter.smashCharge?.moveId === "smashUp")) {
    const charging = action === "smashCharge";
    const motion = getNovaUpSmashMotion(
      charging ? 0 : getNovaUpSmashPoseProgress(fighter),
      charging
    );
    Object.assign(pose, {
      rearLeg: motion.rearLeg,
      frontLeg: motion.frontLeg,
      rearArm: motion.rearArm,
      rearArmReach: motion.rearArmReach,
      rearArmForward: motion.rearArmForward,
      rearArmRootY: motion.rearArmRootY,
      frontArm: motion.frontArm,
      frontArmReach: motion.frontArmReach,
      frontArmRootY: motion.frontArmRootY,
      offsetX: motion.offsetX,
      offsetY: motion.offsetY,
      rotation: motion.rotation
    });
  } else if (action === "smashDown" || (action === "smashCharge" && fighter.smashCharge?.moveId === "smashDown")) {
    const charging = action === "smashCharge";
    const motion = getNovaDownSmashMotion(
      charging ? 0 : getNovaDownSmashPoseProgress(fighter),
      charging
    );
    Object.assign(pose, {
      rearLeg: motion.rearLeg,
      frontLeg: motion.frontLeg,
      rearArm: motion.rearArm,
      rearArmReach: motion.rearArmReach,
      rearArmForward: motion.rearArmForward,
      rearArmRootY: motion.rearArmRootY,
      frontArm: motion.frontArm,
      frontArmReach: motion.frontArmReach,
      frontArmRootY: motion.frontArmRootY,
      offsetX: motion.offsetX,
      offsetY: motion.offsetY,
      rotation: motion.rotation
    });
  } else if (["grab", "dashGrab", "pivotGrab", "grabHold"].includes(action)) {
    const variant = action === "dashGrab" ? "dash" : action === "pivotGrab" ? "pivot" : "standing";
    const grabTotal = fighter.move?.total || GRAB.variants[variant].total;
    const grabProgress = action === "grabHold"
      ? 1
      : clamp((fighter.actionTime || 0) / Math.max(1 / 60, grabTotal), 0, 1);
    const pummelProgress = action === "grabHold" && fighter.pummelAnimation > 0
      ? 1 - clamp(fighter.pummelAnimation / NOVA_GRAB_MOTION.pummelDuration, 0, 1)
      : 0;
    const motion = getNovaGrabMotion(grabProgress, variant, action === "grabHold", pummelProgress);
    Object.assign(pose, {
      rearLeg: motion.rearLeg,
      frontLeg: motion.frontLeg,
      rearArm: motion.rearArm,
      rearArmReach: motion.rearArmReach,
      rearArmForward: motion.rearArmForward,
      rearArmRootY: motion.rearArmRootY,
      frontArm: motion.frontArm,
      frontArmReach: motion.frontArmReach,
      frontArmRootY: motion.frontArmRootY,
      offsetX: motion.offsetX,
      offsetY: motion.offsetY,
      rotation: motion.rotation
    });
  } else if (["throwForward", "throwBack", "throwUp", "throwDown"].includes(action)) {
    const variant = action.slice("throw".length).toLowerCase();
    const motion = getNovaThrowMotion(variant, fighter.actionTime || 0);
    Object.assign(pose, {
      rearLeg: motion.rearLeg,
      frontLeg: motion.frontLeg,
      rearArm: motion.rearArm,
      rearArmReach: motion.rearArmReach,
      rearArmForward: motion.rearArmForward,
      rearArmRootY: motion.rearArmRootY,
      frontArm: motion.frontArm,
      frontArmReach: motion.frontArmReach,
      frontArmRootY: motion.frontArmRootY,
      offsetX: motion.offsetX,
      offsetY: motion.offsetY,
      rotation: motion.rotation
    });
  } else if (action === "specialNeutral") {
    Object.assign(pose, getNovaNeutralSpecialMotion(fighter.actionTime || 0));
  } else if (action === "specialSide") {
    Object.assign(pose, getNovaSideSpecialMotion(fighter.actionTime || 0));
  } else if (action === "specialUp" || action === "specialFall") {
    Object.assign(pose, getNovaRecoveryMotion(
      fighter.recovery?.elapsed || fighter.actionTime || 0,
      fighter.recovery?.phase || (action === "specialUp" ? "thrust" : "fall")
    ));
  } else if (action === "novaCharge") {
    Object.assign(pose, getNovaChargeMotion((fighter.novaCharge || 0) / NOVA_CHARGE.maxDuration));
  } else if (action === "finalSmash") {
    Object.assign(pose, getNovaFinalSmashMotion(fighter.actionTime || 0));
  } else if (action === "airForward") {
    const motion = getNovaForwardAirMotion(progress);
    pose.rearLeg += motion.force * 0.2;
    pose.frontLeg -= motion.force * 0.18;
    pose.rearArm += motion.force * 0.3;
    pose.frontArm = motion.angle;
    pose.frontArmReach = motion.reach;
    pose.frontArmRootY -= motion.force * 2;
    pose.offsetX = motion.force * 2;
    pose.offsetY = -motion.force;
    pose.rotation = -motion.force * 0.06;
  } else if (action === "up") {
    const motion = getNovaUpTiltMotion(progress);
    const force = Math.max(motion.rightHandForce, motion.leftHandForce);
    pose.rearLeg += force * 0.18;
    pose.frontLeg -= force * 0.18;
    pose.rearArm = motion.rightHandAngle;
    pose.rearArmReach = motion.rightHandReach;
    pose.rearArmForward = motion.rightHandExtended;
    pose.rearArmRootY = motion.rightShoulderY;
    pose.frontArm = motion.leftHandAngle;
    pose.frontArmReach = motion.leftHandReach;
    pose.frontArmRootY = motion.leftShoulderY;
    pose.offsetY = -force * 2;
    pose.rotation = (motion.rightHandForce - motion.leftHandForce) * 0.045;
  } else if (action === "airBack") {
    const motion = getNovaBackAirMotion(getNovaBackAirPoseProgress(
      fighter.actionTime,
      Boolean(fighter.moveState?.contact)
    ));
    Object.assign(pose, {
      rearLeg: motion.rearLeg,
      frontLeg: motion.frontLeg,
      rearArm: motion.rearArm,
      frontArm: motion.frontArm,
      offsetX: motion.offsetX,
      offsetY: motion.offsetY,
      rotation: motion.bodyLean
    });
  } else if (action === "airUp") {
    const motion = getNovaUpAirMotion(getNovaUpAirPoseProgress(fighter.actionTime));
    Object.assign(pose, {
      rearLeg: motion.rearLeg,
      frontLeg: motion.frontLeg,
      rearArm: motion.rearArm,
      frontArm: motion.frontArm,
      offsetY: motion.offsetY
    });
  } else if (action === "down") {
    const motion = getNovaDownTiltMotion(progress);
    Object.assign(pose, {
      rearLeg: motion.rearLeg,
      frontLeg: motion.frontLeg,
      rearArm: motion.rearArm,
      frontArm: motion.frontArm,
      rearArmRootY: motion.armRootY,
      frontArmRootY: motion.armRootY
    });
  } else if (action === "airNeutral") {
    const burst = progress < 0.32
      ? Math.sin(progress / 0.32 * Math.PI / 2)
      : Math.max(0, 1 - (progress - 0.32) / 0.68);
    pose.rearLeg += burst * 0.56;
    pose.frontLeg -= burst * 0.56;
    pose.rearArm -= burst * 1.02;
    pose.rearArmReach += burst * 0.18;
    pose.rearArmForward = burst > 0.08;
    pose.frontArm += burst * 0.92;
    pose.frontArmReach += burst * 0.15;
    pose.offsetY = -burst * 2;
    pose.rotation = Math.sin(progress * Math.PI * 2) * burst * 0.08;
  } else if (action === "jab1") {
    pose.rearLeg += punch * 0.08;
    pose.frontLeg -= punch * 0.1;
    pose.rearArm += punch * 0.15;
    pose.frontArm -= punch * 1.38;
    pose.frontArmReach += punch * 0.08;
  } else if (action === "jab2") {
    pose.rearLeg -= punch * 0.08;
    pose.frontLeg += punch * 0.09;
    pose.rearArm -= punch * 0.24;
    pose.rearArmForward = punch > 0.08;
    pose.rearArmReach += punch * 0.18;
    pose.frontArm -= punch * 0.12;
  } else if (action === "jab3") {
    pose.rearLeg += punch * 0.2;
    pose.frontLeg -= punch * 0.28;
    pose.rearArm += punch * 0.28;
    pose.frontArm -= punch * 1.48;
    pose.frontArmReach += punch * 0.34;
    pose.offsetX = punch * 7;
    pose.offsetY = punch * 1.5;
    pose.rotation = punch * 0.09;
  } else if (action !== "airDown" && !fighter.onGround) {
    if ((fighter.vy || 0) < 0) {
      Object.assign(pose, { rearLeg: -0.42, frontLeg: 0.42, rearArm: -0.48, frontArm: 0.5 });
    } else {
      Object.assign(pose, { rearLeg: 0.2, frontLeg: -0.2, rearArm: 0.36, frontArm: 1.38 });
    }
  }
  return pose;
}

function transformedNovaPoint(fighter, pose, localX, localY) {
  const cosine = Math.cos(pose.rotation);
  const sine = Math.sin(pose.rotation);
  const rotatedX = localX * cosine - localY * sine;
  const rotatedY = localX * sine + localY * cosine;
  const yScale = fighter.crouching ? 0.7 : 1;
  const crouchOffset = fighter.crouching ? fighter.h * 0.15 : 0;
  return {
    x: fighter.x + fighter.facing * (pose.offsetX + rotatedX),
    y: fighter.y + crouchOffset + (pose.offsetY + rotatedY) * yScale
  };
}

function transformedNovaRect(fighter, pose, part, x, y, w, h) {
  const points = [
    transformedNovaPoint(fighter, pose, x, y),
    transformedNovaPoint(fighter, pose, x + w, y),
    transformedNovaPoint(fighter, pose, x, y + h),
    transformedNovaPoint(fighter, pose, x + w, y + h)
  ];
  const left = Math.min(...points.map(point => point.x));
  const right = Math.max(...points.map(point => point.x));
  const top = Math.min(...points.map(point => point.y));
  const bottom = Math.max(...points.map(point => point.y));
  return { part, x: left, y: top, w: right - left, h: bottom - top };
}

function novaSegmentHurtbox(fighter, pose, part, start, end, padding) {
  const startPoint = transformedNovaPoint(fighter, pose, start.x, start.y);
  const endPoint = transformedNovaPoint(fighter, pose, end.x, end.y);
  return {
    part,
    x: Math.min(startPoint.x, endPoint.x) - padding,
    y: Math.min(startPoint.y, endPoint.y) - padding,
    w: Math.abs(endPoint.x - startPoint.x) + padding * 2,
    h: Math.abs(endPoint.y - startPoint.y) + padding * 2
  };
}

export function fighterHurtboxes(fighter) {
  if (!fighter) return [];
  if (fighter.characterId !== "nova" || getKnockdownBodyPose(fighter)) {
    return [{ part: "body", ...fighterRect(fighter) }];
  }

  const pose = getNovaHurtboxPose(fighter);
  const boxes = [
    transformedNovaRect(fighter, pose, "body", -22, -23, 44, 46)
  ];
  if (!isNovaUpAirHeadIntangible(fighter)) {
    boxes.push(transformedNovaRect(fighter, pose, "head", -24, -53, 48, 37));
  }

  for (const [part, rootX, angle] of [
    ["rearLeg", -11, pose.rearLeg],
    ["frontLeg", 10, pose.frontLeg]
  ]) {
    boxes.push(novaSegmentHurtbox(fighter, pose, part, { x: rootX, y: 14 }, {
      x: rootX - Math.sin(angle) * 30,
      y: 14 + Math.cos(angle) * 30
    }, 7));
  }

  const rearArmStart = { x: -20, y: pose.rearArmRootY };
  const rearArmEnd = pose.rearArmForward
    ? {
      x: rearArmStart.x + Math.cos(pose.rearArm) * 34 * pose.rearArmReach,
      y: rearArmStart.y + Math.sin(pose.rearArm) * 34 * pose.rearArmReach
    }
    : {
      x: rearArmStart.x,
      y: rearArmStart.y + 27 * pose.rearArmReach
    };
  boxes.push(novaSegmentHurtbox(
    fighter,
    pose,
    "rearArm",
    rearArmStart,
    rearArmEnd,
    7
  ));
  if (pose.frontArmVisible !== false) {
    const frontLength = 36 * pose.frontArmReach;
    boxes.push(novaSegmentHurtbox(fighter, pose, "frontArm", {
      x: 19,
      y: pose.frontArmRootY
    }, {
      x: 19 + Math.cos(pose.frontArm) * frontLength,
      y: pose.frontArmRootY + Math.sin(pose.frontArm) * frontLength
    }, 8));
  }
  return boxes;
}

export function hitboxOverlapsFighter(hitbox, fighter) {
  return fighterHurtboxes(fighter).some(hurtbox => hitboxesOverlap(hitbox, hurtbox));
}

export function resolveFighterBodyCollision(first, second) {
  if (!canBodiesCollide(first, second)) return null;
  const firstBox = fighterRect(first);
  const secondBox = fighterRect(second);
  const overlapX = Math.min(firstBox.x + firstBox.w, secondBox.x + secondBox.w) - Math.max(firstBox.x, secondBox.x);
  const overlapY = Math.min(firstBox.y + firstBox.h, secondBox.y + secondBox.h) - Math.max(firstBox.y, secondBox.y);
  if (overlapX <= 0 || overlapY <= 0) return null;

  if (overlapY < overlapX && Math.abs(first.y - second.y) > 1) {
    return null;
  }

  const left = first.x < second.x || (first.x === second.x && String(first.id) < String(second.id)) ? first : second;
  const right = left === first ? second : first;
  const firstMoving = Math.abs(horizontalInput(first.currentInput || first.lastInput)) > BODY_COLLISION.inputThreshold;
  const secondMoving = Math.abs(horizontalInput(second.currentInput || second.lastInput)) > BODY_COLLISION.inputThreshold;
  const firstLedgeGetup = isLedgeGetup(first);
  const secondLedgeGetup = isLedgeGetup(second);
  let winner = null;

  if (firstLedgeGetup !== secondLedgeGetup) {
    winner = firstLedgeGetup ? first : second;
  } else if (Boolean(first.onGround) !== Boolean(second.onGround)) {
    winner = first.onGround ? first : second;
  } else if (firstMoving !== secondMoving) {
    winner = firstMoving ? first : second;
  } else if (firstMoving && secondMoving) {
    const firstWeight = getWeightClass(first.weightClass).pushPriority;
    const secondWeight = getWeightClass(second.weightClass).pushPriority;
    if (firstWeight !== secondWeight) winner = firstWeight > secondWeight ? first : second;
  }

  const ledgeGetupPushingGroundedFighter = Boolean(
    winner && isLedgeGetup(winner) && (winner === first ? second.onGround : first.onGround)
  );
  const involvesAir = !first.onGround || !second.onGround;
  const separationScale = involvesAir && !ledgeGetupPushingGroundedFighter
    ? BODY_COLLISION.airSeparationScale
    : 1;
  const separation = (overlapX + BODY_COLLISION.separation) * separationScale;
  if (!winner) {
    left.x -= separation / 2;
    right.x += separation / 2;
  } else {
    const loser = winner === first ? second : first;
    loser.x += loser === right ? separation : -separation;
    const pushDirection = loser === right ? 1 : -1;
    const carriedSpeed = Math.max(0, winner.vx * pushDirection) * pushDirection;
    if (Math.abs(carriedSpeed) > Math.abs(loser.vx)) loser.vx = carriedSpeed;
  }

  return { kind: "push", winner, first, second };
}

export function resolveClankOutcome(first, second) {
  const firstMove = first?.move;
  const secondMove = second?.move;
  if (!firstMove || !secondMove || !canHitboxesClank(first, second)) return null;

  const firstDamage = clankDamage(first, firstMove);
  const secondDamage = clankDamage(second, secondMove);
  const difference = firstDamage - secondDamage;
  const priorityWinner = Math.abs(difference) >= CLANK.priorityRange
    ? (difference > 0 ? first : second)
    : null;

  return {
    first,
    second,
    firstMove,
    secondMove,
    firstDamage,
    secondDamage,
    priorityWinner,
    reboundDamage: Math.max(firstDamage, secondDamage),
    hitlag: Math.max(firstMove.hitlag || 0, secondMove.hitlag || 0)
  };
}

export function applyClankRebound(fighter, reboundDamage, hitlag = 0) {
  fighter.action = "clank";
  fighter.move = null;
  fighter.moveState = null;
  fighter.actionTime = 0;
  fighter.hitList = [];
  fighter.actionStartedAir = false;
  fighter.shield = false;
  fighter.clankLag = clankReboundFrames(reboundDamage) / 60;
  fighter.hitlag = Math.max(fighter.hitlag || 0, hitlag);
  fighter.vx *= 0.22;
}

export function clankReboundFrames(damage) {
  return Math.min(CLANK.maxReboundFrames, Math.ceil((30 / 16) * (Math.max(0, damage) + 3)));
}

function canBodiesCollide(first, second) {
  return Boolean(
    first && second && first !== second &&
    first.alive && second.alive &&
    !first.eliminated && !second.eliminated &&
    !isDodgeState(first) && !isDodgeState(second) &&
    (!first.ledge || isLedgeGetup(first)) &&
    (!second.ledge || isLedgeGetup(second)) &&
    !first.respawnPlatform && !second.respawnPlatform &&
    !first.grabbedBy && !second.grabbedBy &&
    !first.grabbing && !second.grabbing
  );
}

function isLedgeGetup(fighter) {
  return Boolean(fighter?.ledge && (
    fighter.ledgeClimb || fighter.ledgeAttack
  ));
}

function isDodgeState(fighter) {
  return Boolean(fighter?.dodge || fighter?.ledgeRoll);
}

function canHitboxesClank(first, second) {
  const firstMode = first.move.clankMode || "normal";
  const secondMode = second.move.clankMode || "normal";
  if (first.move.type === "grab" || second.move.type === "grab") return false;
  if (firstMode === "none" || secondMode === "none") return false;

  const firstType = attackCollisionType(first);
  const secondType = attackCollisionType(second);
  if (firstType === "projectile" || secondType === "projectile") return true;
  return firstType === "ground" && secondType === "ground";
}

function attackCollisionType(fighter) {
  if (fighter.move.clankType === "projectile" || fighter.move.projectile) return "projectile";
  if (fighter.move.clankType === "ground") return "ground";
  if (fighter.move.clankType === "aerial") return "aerial";
  return fighter.actionStartedAir ? "aerial" : "ground";
}

function clankDamage(fighter, move) {
  const repeats = (fighter.staleMoves || []).filter(moveId => moveId === move.id).length;
  const staleMultiplier = Math.max(0.7, 1 - repeats * KNOCKBACK.stalePenalty);
  return Math.max(0, Number(move.clankDamage ?? move.damage) || 0) * staleMultiplier;
}

export function calculateLaunch({ move, attacker, target, rules = DEFAULT_RULES, blocked = false, targetInput = null }) {
  const direction = attacker.x <= target.x ? 1 : -1;
  const percent = launchPercent(target, rules);
  const weight = getWeightClass(target.weightClass).knockbackTaken;
  const shieldScale = blocked ? 0.18 : 1;
  const staleCount = (attacker.staleMoves || []).filter(moveId => moveId === move.id).length;
  const staleMultiplier = Math.max(0.7, 1 - staleCount * KNOCKBACK.stalePenalty);
  const rageProgress = clamp(
    ((attacker.damage || 0) - KNOCKBACK.rageStart) / (KNOCKBACK.rageEnd - KNOCKBACK.rageStart),
    0,
    1
  );
  const rageMultiplier = 1 + rageProgress * (KNOCKBACK.rageMax - 1);
  const chargeKnockbackMultiplier = Math.max(0, Number(move.chargeKnockbackMultiplier) || 1);
  const basePower = typeof move.fixedKnockback === "number"
    ? move.fixedKnockback
    : move.baseKnockback + percent * move.knockbackGrowth;
  const power = basePower * weight * shieldScale * staleMultiplier * rageMultiplier * chargeKnockbackMultiplier;
  const launchAngle = resolveLaunchAngle(move.angle, target.onGround, power);
  const angle = vectorFromAngle(launchAngle, direction);
  const diVector = blocked ? angle : applyDirectionalInfluence(angle, targetInput, move.diRadians ?? KNOCKBACK.diMaxRadians);
  const lsiMultiplier = blocked ? 1 : getLaunchSpeedInfluence(diVector, targetInput);
  const vector = { x: diVector.x * lsiMultiplier, y: diVector.y * lsiMultiplier };
  const hitstunScale = move.hitstunMultiplier || 1;
  const hitstun = blocked
    ? 0.08
    : clamp((KNOCKBACK.hitstunBase + power * KNOCKBACK.hitstunScale) * hitstunScale, 0.12, KNOCKBACK.maxHitstun);

  return {
    vx: vector.x * power,
    vy: vector.y * power - (blocked ? 30 : 80),
    power,
    percent,
    hitlag: blocked ? Math.min(0.08, move.hitlag || 0.05) : move.hitlag || 0.06,
    hitstun,
    tumble: !blocked && power >= KNOCKBACK.tumbleThreshold,
    meteor: !blocked && (move.meteor === true || vector.y > 0.55),
    staleMultiplier,
    rageMultiplier,
    chargeKnockbackMultiplier,
    lsiMultiplier,
    angle: launchAngle
  };
}

export function launchPercent(target, rules = DEFAULT_RULES) {
  if (rules.mode === "hp") {
    const maxHp = target.maxHp || rules.hp || DEFAULT_RULES.hp;
    return Math.max(0, maxHp - target.hp) * 0.55;
  }
  return target.damage || 0;
}

function vectorFromAngle(angleDegrees, direction) {
  const radians = angleDegrees * Math.PI / 180;
  return normalizeVector(Math.cos(radians) * direction, -Math.sin(radians));
}

function resolveLaunchAngle(angle, grounded, power) {
  if (angle !== 361) return angle;
  if (!grounded) return 45;
  return clamp(18 + power * 0.035, 18, 44);
}

function applyDirectionalInfluence(vector, input, maxRadians) {
  if (!input) return vector;
  const x = horizontalInput(input);
  const y = verticalInput(input);
  const magnitude = Math.min(1, Math.hypot(x, y));
  if (magnitude < 0.2) return vector;
  const inputAngle = Math.atan2(y, x);
  const launchAngle = Math.atan2(vector.y, vector.x);
  const difference = normalizeRadians(inputAngle - launchAngle);
  const influence = Math.min(1, Math.abs(Math.sin(difference)) * 1.15) * magnitude;
  const rotation = clamp(difference, -maxRadians, maxRadians) * influence;
  return {
    x: Math.cos(launchAngle + rotation),
    y: Math.sin(launchAngle + rotation)
  };
}

function getLaunchSpeedInfluence(vector, input) {
  if (!input || Math.abs(vector.y) > 0.92) return 1;
  const y = verticalInput(input);
  if (Math.abs(y) < 0.2) return 1;
  return clamp(1 - y * 0.08, KNOCKBACK.lsiMin, KNOCKBACK.lsiMax);
}

function normalizeRadians(value) {
  let result = value;
  while (result > Math.PI) result -= Math.PI * 2;
  while (result < -Math.PI) result += Math.PI * 2;
  return result;
}

function normalizeVector(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function canGrabLedge(fighter, input, options = {}) {
  const recovering = Boolean(fighter.recovery);
  const attacking = Boolean(fighter.move || fighter.smashCharge || fighter.novaCharging || fighter.throwState);
  return Boolean(
    fighter.alive &&
    !fighter.onGround &&
    !options.wasGrounded &&
    !fighter.ledge &&
    !attacking &&
    (!fighter.action || recovering) &&
    !input.down &&
    fighter.ledgeCooldown <= 0 &&
    (fighter.ledgeGrabCount || 0) < LEDGE.maxRegrabs &&
    fighter.hitstun <= 0 &&
    fighter.hitlag <= 0 &&
    (recovering || fighter.vy > -260)
  );
}

function startLedgeHang(fighter, ledge, input = {}) {
  fighter.ledge = { ...ledge };
  fighter.ledgeClimb = null;
  fighter.ledgeRoll = null;
  fighter.ledgeAttack = null;
  fighter.ledgeHold = 0;
  fighter.ledgeHorizontalLocked = Math.abs(horizontalInput(input)) > 0.35;
  fighter.ledgeCooldown = 0;
  fighter.x = ledge.x + ledge.side * LEDGE.hangOffsetX;
  fighter.y = ledge.y + LEDGE.hangOffsetY;
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.onGround = false;
  fighter.shield = false;
  fighter.action = "ledge";
  fighter.move = null;
  fighter.actionTime = 0;
  fighter.hitList = [];
  fighter.jumps = fighter.maxJumps;
  fighter.hasAirDodged = false;
  fighter.knockdownPending = false;
  fighter.ledgeGrabCount = (fighter.ledgeGrabCount || 0) + 1;
  fighter.facing = -ledge.side;
  const regrabPenalty = Math.max(0, fighter.ledgeGrabCount - 1) * 0.1;
  fighter.invuln = Math.max(fighter.invuln || 0, Math.max(0.12, LEDGE.invuln - regrabPenalty));
}

function startLedgeClimb(fighter, ledge) {
  fighter.ledgeClimb = {
    elapsed: 0,
    startX: fighter.x,
    startY: fighter.y,
    endX: ledge.x - ledge.side * (fighter.w / 2 + LEDGE.climbInset),
    endY: ledge.y - fighter.h / 2
  };
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.onGround = false;
  fighter.shield = false;
  fighter.action = "ledgeClimb";
  fighter.move = null;
  fighter.actionTime = 0;
  fighter.hitList = [];
  fighter.invuln = Math.max(fighter.invuln || 0, LEDGE.invuln);
}

function updateLedgeClimb(fighter, dt) {
  const climb = fighter.ledgeClimb;
  climb.elapsed += dt;
  const progress = clamp(climb.elapsed / LEDGE.climbDuration, 0, 1);
  const liftProgress = smoothStep(clamp(progress / 0.72, 0, 1));
  const inwardProgress = smoothStep(clamp((progress - 0.18) / 0.82, 0, 1));
  fighter.x = climb.startX + (climb.endX - climb.startX) * inwardProgress;
  fighter.y = climb.startY + (climb.endY - climb.startY) * liftProgress;
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.onGround = false;
  fighter.shield = false;
  fighter.action = "ledgeClimb";

  if (progress < 1) return "climbing";

  const endX = climb.endX;
  const endY = climb.endY;
  clearLedgeState(fighter);
  fighter.x = endX;
  fighter.y = endY;
  fighter.onGround = true;
  fighter.jumps = fighter.maxJumps;
  fighter.hasAirDodged = false;
  fighter.action = "landing";
  fighter.landingLag = Math.max(fighter.landingLag || 0, LEDGE.climbLag);
  return "climbComplete";
}

function startLedgeAttack(fighter, ledge) {
  const move = getMove(fighter.characterId, "ledgeAttack");
  const invulnEnd = getLedgeAttackInvulnEnd(move);
  fighter.ledgeAttack = {
    elapsed: 0,
    invulnEnd,
    startX: fighter.x,
    startY: fighter.y,
    endX: ledge.x - ledge.side * (fighter.w / 2 + LEDGE.attackInset),
    endY: ledge.y - fighter.h / 2
  };
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.onGround = false;
  fighter.shield = false;
  fighter.facing = -ledge.side;
  fighter.invuln = invulnEnd;
  fighter.action = move.id;
  fighter.move = {
    ...move,
    hits: move.hits.map(hit => ({ ...hit }))
  };
  fighter.moveState = {
    contact: false,
    spawned: false,
    impulseApplied: false,
    chainQueued: false,
    chainInputUntil: 0
  };
  fighter.actionStartedAir = false;
  fighter.actionTime = 0;
  fighter.hitList = [];
  fighter.landingLag = Math.max(fighter.landingLag || 0, LEDGE.attackLag);
}

function updateLedgeAttack(fighter, dt) {
  const attack = fighter.ledgeAttack;
  attack.elapsed += dt;
  fighter.actionTime = attack.elapsed;
  if (attack.elapsed >= attack.invulnEnd) fighter.invuln = 0;
  const progress = clamp(attack.elapsed / LEDGE.attackClimbDuration, 0, 1);
  const liftProgress = smoothStep(clamp(progress / 0.82, 0, 1));
  const inwardProgress = smoothStep(clamp((progress - 0.08) / 0.92, 0, 1));
  fighter.x = attack.startX + (attack.endX - attack.startX) * inwardProgress;
  fighter.y = attack.startY + (attack.endY - attack.startY) * liftProgress;
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.onGround = false;
  fighter.shield = false;
  fighter.action = "ledgeAttack";

  if (progress < 1) return "attacking";

  const endX = attack.endX;
  const endY = attack.endY;
  clearLedgeState(fighter);
  fighter.x = endX;
  fighter.y = endY;
  fighter.onGround = true;
  fighter.jumps = fighter.maxJumps;
  fighter.hasAirDodged = false;
  return "attackClimbComplete";
}

function getLedgeAttackInvulnEnd(move) {
  if (Array.isArray(move?.hits) && move.hits.length > 0) {
    return Math.max(...move.hits.map(hit => (
      (Number(hit.start) || 0) + (Number(hit.duration) || 1 / 60)
    )));
  }
  if (Number.isFinite(move?.startup) && Number.isFinite(move?.active)) {
    return move.startup + move.active;
  }
  return LEDGE.attackInvuln;
}

function startLedgeRoll(fighter, ledge) {
  const rollDistance = DODGE.roll.speed * DODGE.roll.duration * LEDGE.rollDistanceMultiplier;
  fighter.ledgeRoll = {
    elapsed: 0,
    startX: fighter.x,
    startY: fighter.y,
    endX: ledge.x - ledge.side * rollDistance,
    endY: ledge.y - fighter.h / 2,
    facing: fighter.facing
  };
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.onGround = false;
  fighter.shield = false;
  fighter.action = "ledgeRoll";
  fighter.move = null;
  fighter.actionTime = 0;
  fighter.hitList = [];
  fighter.invuln = Math.max(fighter.invuln || 0, LEDGE.rollInvuln);
}

function updateLedgeRoll(fighter, dt) {
  const roll = fighter.ledgeRoll;
  roll.elapsed += dt;
  const progress = clamp(roll.elapsed / LEDGE.rollDuration, 0, 1);
  const liftProgress = smoothStep(clamp(progress / 0.58, 0, 1));
  const inwardProgress = smoothStep(clamp((progress - 0.1) / 0.9, 0, 1));
  fighter.x = roll.startX + (roll.endX - roll.startX) * inwardProgress;
  fighter.y = roll.startY + (roll.endY - roll.startY) * liftProgress;
  fighter.vx = 0;
  fighter.vy = 0;
  fighter.onGround = false;
  fighter.shield = false;
  fighter.facing = roll.facing;
  fighter.action = "ledgeRoll";

  if (progress < 1) return "rolling";

  const endX = roll.endX;
  const endY = roll.endY;
  const facing = roll.facing;
  clearLedgeState(fighter);
  fighter.x = endX;
  fighter.y = endY;
  fighter.facing = facing;
  fighter.onGround = true;
  fighter.jumps = fighter.maxJumps;
  fighter.hasAirDodged = false;
  fighter.action = "landing";
  fighter.landingLag = Math.max(fighter.landingLag || 0, LEDGE.rollLag);
  return "rollComplete";
}

function releaseLedge(fighter) {
  clearLedgeState(fighter);
  fighter.action = null;
  fighter.move = null;
  fighter.actionTime = 0;
  fighter.hitList = [];
}

function smoothStep(value) {
  return value * value * (3 - 2 * value);
}

function constrainGroundMotionToPlatform(stage, fighter, prevX, prevY, constrainToPlatform = false) {
  if (!constrainToPlatform && fighter.dodge?.type !== "roll") return;
  const halfWidth = fighter.w / 2;
  const previousBottom = prevY + fighter.h / 2;
  const support = stage.platforms
    .filter(platform => (
      Math.abs(previousBottom - platform.y) <= 8 &&
      prevX + halfWidth > platform.x &&
      prevX - halfWidth < platform.x + platform.w
    ))
    .sort((first, second) => (
      Math.abs(previousBottom - first.y) - Math.abs(previousBottom - second.y)
    ))[0];
  if (!support) return;

  const minX = support.x + halfWidth;
  const maxX = support.x + support.w - halfWidth;
  const constrainedX = clamp(fighter.x, minX, maxX);
  if (constrainedX === fighter.x) return;
  fighter.x = constrainedX;
  fighter.vx = 0;
}

function resolveMainPlatformCollision(fighter, oldBox, platform, result) {
  const triangle = getMainPlatformTriangle(platform);
  const platformBox = {
    left: triangle.left,
    right: triangle.right,
    top: triangle.top,
    bottom: triangle.bottom
  };
  const newBox = fighterBoxAt(fighter, fighter.x, fighter.y);
  if (!boxesOverlap(newBox, platformBox)) return;

  const overlapTop = Math.max(newBox.top, triangle.top);
  const overlapBottom = Math.min(newBox.bottom, triangle.bottom);
  if (overlapBottom <= overlapTop) return;

  const progress = clamp((overlapTop - triangle.top) / triangle.depth, 0, 1);
  const halfWidth = triangle.halfWidth * (1 - progress);
  const leftSlopeX = triangle.centerX - halfWidth;
  const rightSlopeX = triangle.centerX + halfWidth;
  if (newBox.right <= leftSlopeX || newBox.left >= rightSlopeX) return;

  const pushLeft = newBox.right - leftSlopeX;
  const pushRight = rightSlopeX - newBox.left;
  const approachSide = Math.abs(fighter.x - triangle.centerX) > 0.001
    ? Math.sign(fighter.x - triangle.centerX)
    : Math.sign(fighter.vx || fighter.facing || 1);
  const exitLeft = pushLeft < pushRight || (pushLeft === pushRight && approachSide < 0);

  if (exitLeft) {
    fighter.x -= pushLeft + 0.01;
    fighter.vx = Math.min(0, fighter.vx);
  } else {
    fighter.x += pushRight + 0.01;
    fighter.vx = Math.max(0, fighter.vx);
  }
  const normalLength = Math.hypot(triangle.depth, triangle.halfWidth);
  result.hitSlope = true;
  result.slopeNormal = {
    x: (exitLeft ? -triangle.depth : triangle.depth) / normalLength,
    y: triangle.halfWidth / normalLength
  };
}

function fighterBoxAt(fighter, x, y) {
  return {
    left: x - fighter.w / 2,
    right: x + fighter.w / 2,
    top: y - fighter.h / 2,
    bottom: y + fighter.h / 2
  };
}

function platformRect(platform) {
  const triangle = platform.type === "main" ? getMainPlatformTriangle(platform) : null;
  return {
    left: platform.x,
    right: platform.x + platform.w,
    top: platform.y,
    bottom: triangle ? triangle.bottom : platform.y + platform.h
  };
}

export function getMainPlatformTriangle(platform) {
  const depth = Math.max(1, Number(platform.depth) || MAIN_PLATFORM_DEPTH);
  const halfWidth = platform.w / 2;
  return {
    left: platform.x,
    right: platform.x + platform.w,
    top: platform.y,
    bottom: platform.y + depth,
    centerX: platform.x + halfWidth,
    halfWidth,
    depth,
    apexX: platform.x + halfWidth,
    apexY: platform.y + depth
  };
}

function boxesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
