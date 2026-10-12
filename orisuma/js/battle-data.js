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
  separation: 0.05
};

export const CLANK = {
  priorityRange: 9,
  maxReboundFrames: 58
};

export const SMASH_CHARGE = {
  maxDuration: 3,
  forcedCancelDuration: 10,
  forcedCancelLag: 1,
  maxDamageMultiplier: 1.25,
  maxKnockbackMultiplier: 1.15
};

export const NOVA_CHARGE = {
  maxDuration: 4,
  maxDamageMultiplier: 1.6
};

export const NOVA_RECOVERY = {
  thrustDuration: 1.05,
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

export const FINAL_SMASH = {
  maxGauge: 100,
  dealtGainPerDamage: 0.3,
  takenGainPerDamage: 0.5,
  fullGaugeAfterKo: 98,
  neutralInputThreshold: 0.35,
  defaultActiveDuration: 1
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
  rollInset: 92,
  rollDistanceMultiplier: 1.2,
  rollDuration: 0.42,
  jumpSpeedMultiplier: 1.3,
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
  holdDrain: 4.2,
  minSize: 28,
  maxSize: 48,
  hitBase: 4,
  hitScale: 1.15,
  stunScale: 0.018,
  breakStun: 2.45,
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
  ceilingBounceY: 0.62
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
  groundRunRampDuration: 0.6,
  groundRunStartSpeedScale: 0.4,
  shortHopCut: 0.62,
  jumpCutMinVy: -180,
  airAccelerationMultiplier: 1.4,
  normalGravityMultiplier: 0.82,
  normalFallSpeedMultiplier: 0.7,
  fastFallStartVy: -60,
  airControlWhenLaunched: 0.18,
  hitstunFriction: 0.992
};

export const RESPAWN = {
  platformTime: 1.05,
  invuln: 2.8,
  platformOffsetY: -118
};

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

export const MAIN_PLATFORM_DEPTH = 360;

export const STAGES = {
  final: {
    id: "final",
    name: "終点風",
    spawn: [
      [300, 410],
      [980, 410],
      [520, 410],
      [760, 410]
    ],
    platforms: [
      { x: 240, y: 500, w: 800, h: 28, depth: MAIN_PLATFORM_DEPTH, shape: "invertedTriangle", type: "main" }
    ],
    blast: { left: -520, right: 1800, top: -360, bottom: 1020 }
  },
  small: {
    id: "small",
    name: "小戦場風",
    spawn: [
      [300, 410],
      [980, 410],
      [475, 330],
      [805, 330]
    ],
    platforms: [
      { x: 240, y: 510, w: 800, h: 28, depth: MAIN_PLATFORM_DEPTH, shape: "invertedTriangle", type: "main" },
      { x: 310, y: 380, w: 220, h: 18, type: "soft" },
      { x: 750, y: 380, w: 220, h: 18, type: "soft" }
    ],
    blast: { left: -520, right: 1800, top: -360, bottom: 1020 }
  },
  battlefield: {
    id: "battlefield",
    name: "戦場風",
    spawn: [
      [300, 410],
      [980, 410],
      [475, 315],
      [805, 315]
    ],
    platforms: [
      { x: 240, y: 510, w: 800, h: 28, depth: MAIN_PLATFORM_DEPTH, shape: "invertedTriangle", type: "main" },
      { x: 310, y: 380, w: 220, h: 18, type: "soft" },
      { x: 750, y: 380, w: 220, h: 18, type: "soft" },
      { x: 530, y: 250, w: 220, h: 18, type: "soft" }
    ],
    blast: { left: -520, right: 1800, top: -360, bottom: 1020 }
  }
};

const NOVA_JAB_ONE = {
  id: "jab1",
  label: "弱1",
  total: 0.22,
  chainTo: "jab2",
  chainOpen: 0.11,
  velocityScale: 0.45,
  hits: [{ id: "punch", start: 0.05, duration: 0.06, damage: 3, hpDamage: 3, baseKnockback: 55, knockbackGrowth: 0.7, angle: 45, hitlag: 0.035, shieldDamage: 4.2, mirror: true, offsetX: 29, offsetY: -42, w: 48, h: 34 }]
};

const NOVA_MOVES = {
  neutral: NOVA_JAB_ONE,
  jab1: NOVA_JAB_ONE,
  jab2: {
    id: "jab2",
    label: "弱2",
    total: 0.24,
    chainTo: "jab3",
    chainOpen: 0.12,
    velocityScale: 0.45,
    hits: [{ id: "punch", start: 0.05, duration: 0.06, damage: 4, hpDamage: 4, baseKnockback: 65, knockbackGrowth: 0.8, angle: 45, hitlag: 0.04, shieldDamage: 5.5, mirror: true, offsetX: 31, offsetY: -43, w: 50, h: 34 }]
  },
  jab3: {
    id: "jab3",
    label: "弱3",
    total: 0.38,
    velocityScale: 0.4,
    hits: [{ id: "finish", start: 0.07, duration: 0.08, damage: 5, hpDamage: 5, baseKnockback: 190, knockbackGrowth: 3.8, angle: 40, hitlag: 0.055, shieldDamage: 7.5, mirror: true, offsetX: 34, offsetY: -44, w: 60, h: 38 }]
  },
  dashAttack: {
    id: "dashAttack",
    label: "ダッシュ攻撃",
    total: 0.72,
    velocityScale: 0.68,
    impulseAt: 0.06,
    impulseX: 620,
    hits: [{ id: "jetRush", start: 0.11, duration: 0.12, damage: 10.2, hpDamage: 10.2, baseKnockback: 360, knockbackGrowth: 7, angle: 35, hitlag: 0.075, shieldDamage: 14.5, mirror: true, offsetX: 37, offsetY: -37, w: 82, h: 58, clankType: "ground" }]
  },
  side: {
    id: "side",
    label: "横強攻撃",
    total: 0.34,
    velocityScale: 0.62,
    hits: [{ id: "arm", start: 0.08, duration: 0.1, damage: 10, hpDamage: 10, baseKnockback: 340, knockbackGrowth: 4.2, angle: 60, hitlag: 0.07, shieldDamage: 14, mirror: true, offsetX: 48, offsetY: -43, w: 96, h: 38 }]
  },
  up: {
    id: "up",
    label: "上強攻撃",
    total: 0.58,
    velocityScale: 0.5,
    hits: [
      { id: "spin1", start: 0.1, duration: 0.07, damage: 5, hpDamage: 5, baseKnockback: 70, knockbackGrowth: 0.7, angle: 90, hitlag: 0.04, shieldDamage: 6.5, mirror: true, offsetX: 0, offsetY: -96, w: 112, h: 46 },
      { id: "spin2", start: 0.2, duration: 0.09, damage: 8, hpDamage: 8, baseKnockback: 175, knockbackGrowth: 8.4, angle: 90, hitlag: 0.07, shieldDamage: 11, mirror: true, offsetX: 0, offsetY: -100, w: 122, h: 52 }
    ]
  },
  down: {
    id: "down",
    label: "下強攻撃",
    total: 0.31,
    velocityScale: 0.55,
    hits: [{ id: "flame", start: 0.07, duration: 0.1, damage: 8, hpDamage: 8, baseKnockback: 90, knockbackGrowth: 1.2, angle: 100, hitlag: 0.05, shieldDamage: 11, mirror: true, offsetX: 0, offsetY: 4, w: 154, h: 35 }]
  },
  airNeutral: {
    id: "airNeutral",
    label: "空中ニュートラル",
    total: 0.42,
    landingLag: 0.14,
    velocityScale: 0.92,
    hits: [{ id: "shock", start: 0.07, duration: 0.16, damage: 7, hpDamage: 7, baseKnockback: 330, knockbackGrowth: 7, angle: 30, hitlag: 0.065, shieldDamage: 10, mirror: true, offsetX: 0, offsetY: -50, w: 94, h: 94, clankType: "aerial" }]
  },
  airForward: {
    id: "airForward",
    label: "空中前攻撃",
    total: 0.39,
    landingLag: 0.12,
    velocityScale: 0.88,
    hits: [{ id: "swing", start: 0.09, duration: 0.09, damage: 4, hpDamage: 4, baseKnockback: 160, knockbackGrowth: 10.5, angle: 50, hitlag: 0.05, shieldDamage: 6, mirror: true, offsetX: 39, offsetY: -65, w: 74, h: 62, clankType: "aerial" }]
  },
  airBack: {
    id: "airBack",
    label: "空中後攻撃",
    total: 0.6,
    contactTotal: 0.86,
    landingLag: 0.28,
    velocityScale: 0.78,
    hits: [
      { id: "flame1", start: 0.11, duration: 0.045, damage: 2, hpDamage: 2, baseKnockback: 45, knockbackGrowth: 0.4, angle: 10, hitlag: 0.025, shieldDamage: 2.8, mirror: true, offsetX: -43, offsetY: -43, w: 76, h: 34, clankType: "aerial" },
      { id: "flame2", start: 0.17, duration: 0.045, damage: 2, hpDamage: 2, baseKnockback: 45, knockbackGrowth: 0.4, angle: 10, hitlag: 0.025, shieldDamage: 2.8, mirror: true, offsetX: -52, offsetY: -43, w: 88, h: 36, clankType: "aerial" },
      { id: "flame3", start: 0.23, duration: 0.045, damage: 2, hpDamage: 2, baseKnockback: 45, knockbackGrowth: 0.4, angle: 10, hitlag: 0.025, shieldDamage: 2.8, mirror: true, offsetX: -60, offsetY: -43, w: 98, h: 38, clankType: "aerial" },
      { id: "finish", start: 0.31, duration: 0.08, requiresContact: true, damage: 14, hpDamage: 14, baseKnockback: 440, knockbackGrowth: 4.8, angle: 10, hitlag: 0.12, shieldDamage: 20, mirror: true, offsetX: -67, offsetY: -44, w: 112, h: 44, clankType: "aerial" }
    ]
  },
  airUp: {
    id: "airUp",
    label: "空中上攻撃",
    total: 0.7,
    landingLag: 0.25,
    velocityScale: 0.82,
    impulseAt: 0.14,
    impulseY: -220,
    hits: [
      { id: "jet", start: 0.15, duration: 0.07, damage: 4, hpDamage: 4, baseKnockback: 70, knockbackGrowth: 12.5, angle: 270, meteor: true, hitlag: 0.055, shieldDamage: 6, mirror: true, offsetX: 0, offsetY: 25, w: 58, h: 54, clankType: "aerial" },
      { id: "body", start: 0.2, duration: 0.14, damage: 12, hpDamage: 12, baseKnockback: 410, knockbackGrowth: 10.5, angle: 90, angleMode: "towardTargetUp", hitlag: 0.1, shieldDamage: 17, mirror: true, offsetX: 0, offsetY: -72, w: 66, h: 88, clankType: "aerial" }
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
      baseKnockback: 38,
      knockbackGrowth: 0.45,
      angle: 85,
      hitlag: 0.025,
      shieldDamage: 3.2,
      mirror: true,
      offsetX: 0,
      offsetY: 10,
      w: 112,
      h: 82,
      clankType: "aerial"
    }))
  },
  smashNeutral: {
    id: "smashSide",
    label: "横スマッシュ",
    total: 0.72,
    velocityScale: 0.3,
    hits: [{ id: "punch", start: 0.2, duration: 0.1, damage: 18, hpDamage: 18, baseKnockback: 470, knockbackGrowth: 9.5, angle: 55, hitlag: 0.13, hitstunMultiplier: 1.08, shieldDamage: 26, mirror: true, offsetX: 55, offsetY: -49, w: 110, h: 52 }]
  },
  smashSide: {
    id: "smashSide",
    label: "横スマッシュ",
    total: 0.72,
    velocityScale: 0.3,
    hits: [{ id: "punch", start: 0.2, duration: 0.1, damage: 18, hpDamage: 18, baseKnockback: 470, knockbackGrowth: 9.5, angle: 55, hitlag: 0.13, hitstunMultiplier: 1.08, shieldDamage: 26, mirror: true, offsetX: 55, offsetY: -49, w: 110, h: 52 }]
  },
  smashUp: {
    id: "smashUp",
    label: "上スマッシュ",
    total: 0.8,
    velocityScale: 0.25,
    hits: [{ id: "uppercut", start: 0.19, duration: 0.13, damage: 25, hpDamage: 25, baseKnockback: 470, knockbackGrowth: 4.2, angle: 75, hitlag: 0.15, hitstunMultiplier: 1.08, shieldDamage: 36, mirror: true, offsetX: 28, offsetY: -104, w: 76, h: 96 }]
  },
  smashDown: {
    id: "smashDown",
    label: "下スマッシュ",
    total: 0.66,
    velocityScale: 0.25,
    hits: [{ id: "split", start: 0.16, duration: 0.12, damage: 16, hpDamage: 16, baseKnockback: 300, knockbackGrowth: 5.5, angle: 0, hitlag: 0.115, shieldDamage: 23, mirror: true, offsetX: 0, offsetY: 0, w: 180, h: 38 }]
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
    total: 0.92,
    spawnAt: 0.18,
    velocityScale: 0.25,
    projectile: {
      kind: "rocketPunch",
      damage: 16,
      hpDamage: 16,
      baseKnockback: 450,
      knockbackGrowth: 4.5,
      angle: 45,
      hitlag: 0.12,
      shieldDamage: 24,
      clankDamage: 16,
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
      { id: "finish", start: 0.35, damage: 4, hpDamage: 4, baseKnockback: 365, knockbackGrowth: 4.5, angle: 50, hitlag: 0.08 }
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
    beatsShield: true
  },
  ledgeAttack: {
    id: "ledgeAttack",
    label: "崖上がり攻撃",
    startup: 0.08,
    active: 0.16,
    total: 0.62,
    damage: 9,
    hpDamage: 13,
    baseKnockback: 280,
    knockbackGrowth: 5.6,
    angle: 24,
    hitlag: 0.07,
    shieldDamage: 14,
    landingLag: 0.18,
    offsetX: 18,
    offsetY: -50,
    w: 92,
    h: 62,
    forward: true
  }
};

export const CHARACTER_DEFINITIONS = {
  nova: {
    id: "nova",
    name: "ノヴァ",
    weightClass: "middle",
    stats: {
      w: 38,
      h: 66,
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
  if (fighter.actionLock <= 0 && ["smashChargeCancel", "throwEnd"].includes(fighter.action)) {
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
    fighter.shieldHp = Math.max(0, fighter.shieldHp - SHIELD.holdDrain * dt);
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

  if (fighter.shieldHp > 0) return { broken: false, damage };
  breakShield(fighter);
  return { broken: true, damage };
}

export function breakShield(fighter) {
  clearLedgeState(fighter);
  clearDodge(fighter);
  fighter.shield = false;
  fighter.shieldReleaseLag = 0;
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
  defender.hitstun = 0;
  defender.hitlag = Math.max(defender.hitlag || 0, SHIELD.perfectDefenderFreeze);
  attacker.hitlag = Math.max(attacker.hitlag || 0, SHIELD.perfectAttackerFreeze, move.hitlag || 0);
  return true;
}

export function applyHitlagSdi(fighter, input = {}, dt = 0) {
  if (fighter.hitlag <= 0) return;
  const x = horizontalInput(input);
  const y = verticalInput(input);
  if (x === 0 && y === 0) return;
  const vector = normalizeVector(x, y);
  const amount = 115 * dt;
  fighter.x += vector.x * amount;
  fighter.y += vector.y * amount;
}

export function applyJumpCut(fighter, input = {}, lastInput = {}) {
  if (!lastInput.jump || input.jump || !fighter.jumpCutAvailable) return false;
  if (fighter.vy >= MOVEMENT.jumpCutMinVy) return false;
  fighter.vy *= MOVEMENT.shortHopCut;
  fighter.jumpCutAvailable = false;
  return true;
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
  const launchedIntoSlope = surface === "slope" && fighter.hitstun > 0 && fighter.tumbling && impactSpeed > 0;
  const requiresTech = fighter.hitstun > 0 && fighter.tumbling && impactSpeed >= TECH.minSpeed;
  if (!requiresTech) {
    if (launchedIntoSlope) return bounceFromSlope(fighter, collision);
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

  const teched = fighter.techWindow > 0 && impactSpeed <= TECH.maxSpeed;
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
    fighter.vx = (collision.impactVx || fighter.vx) * TECH.bounceX;
    fighter.vy = -Math.abs(collision.impactVy || fighter.vy) * TECH.bounceY;
    fighter.hitstun = Math.max(fighter.hitstun, TECH.failLag);
    fighter.landingLag = Math.max(fighter.landingLag || 0, TECH.failLag);
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
  constrainGroundRollToPlatform(stage, fighter, prevX, prevY, options.groundRoll);
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

    if (withinX && canLand && fighter.vy >= 0 && oldBox.bottom <= platformBox.top && newBox.bottom >= platformBox.top) {
      fighter.y = platformBox.top - fighter.h / 2;
      fighter.vy = 0;
      fighter.onGround = true;
      fighter.jumps = fighter.maxJumps;
      fighter.hasAirDodged = false;
      fighter.ledge = null;
      result.landed = true;
      continue;
    }

    if (platform.type !== "main") continue;
    resolveMainPlatformCollision(fighter, oldBox, platform, result);
  }

  return result;
}

export function tryGrabLedge(stage, fighter, input = {}) {
  if (!canGrabLedge(fighter, input)) return false;

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

  const ledge = fighter.ledge;
  fighter.ledgeHold += dt;
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
  fighter.facing = -ledge.side;

  if (jumpPressed) {
    releaseLedge(fighter);
    fighter.vx = 0;
    fighter.vy = fighter.stats.airJumpSpeed * LEDGE.jumpSpeedMultiplier;
    fighter.jumps = Math.max(0, fighter.maxJumps - 1);
    return "jump";
  }

  if (attackPressed) {
    releaseLedge(fighter);
    fighter.x = ledge.x - ledge.side * (fighter.w / 2 + LEDGE.attackInset);
    fighter.y = ledge.y - fighter.h / 2;
    fighter.vx = 0;
    fighter.vy = 0;
    fighter.onGround = true;
    fighter.jumps = fighter.maxJumps;
    fighter.facing = -ledge.side;
    fighter.invuln = Math.max(fighter.invuln, LEDGE.attackInvuln);
    fighter.action = "ledgeAttack";
    fighter.move = getMove(fighter.characterId, "ledgeAttack");
    fighter.actionTime = 0;
    fighter.hitList = [];
    fighter.landingLag = Math.max(fighter.landingLag || 0, LEDGE.attackLag);
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
  fighter.ledgeHold = 0;
  fighter.ledgeHorizontalLocked = false;
  fighter.ledgeCooldown = cooldown === 0 ? 0 : Math.max(fighter.ledgeCooldown || 0, cooldown);
}

export function getHitbox(fighter, move) {
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

export function fighterRect(fighter) {
  const height = fighter.crouching ? fighter.h * 0.7 : fighter.h;
  return { x: fighter.x - fighter.w / 2, y: fighter.y + fighter.h / 2 - height, w: fighter.w, h: height };
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
  let winner = null;

  if (firstMoving !== secondMoving) {
    winner = firstMoving ? first : second;
  } else if (firstMoving && secondMoving) {
    const firstWeight = getWeightClass(first.weightClass).pushPriority;
    const secondWeight = getWeightClass(second.weightClass).pushPriority;
    if (firstWeight !== secondWeight) winner = firstWeight > secondWeight ? first : second;
  }

  const separation = overlapX + BODY_COLLISION.separation;
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
    !first.ledge && !second.ledge &&
    !first.respawnPlatform && !second.respawnPlatform &&
    !first.grabbedBy && !second.grabbedBy &&
    !first.grabbing && !second.grabbing
  );
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

function canGrabLedge(fighter, input) {
  const recovering = Boolean(fighter.recovery);
  return Boolean(
    fighter.alive &&
    !fighter.onGround &&
    !fighter.ledge &&
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

function constrainGroundRollToPlatform(stage, fighter, prevX, prevY, groundRoll = false) {
  if (!groundRoll && fighter.dodge?.type !== "roll") return;
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
