import {
  CHARACTER_DEFINITIONS,
  DEFAULT_RULES as SHARED_DEFAULT_RULES,
  PLAYER_LIMITS as SHARED_PLAYER_LIMITS,
  SHORT_HOP as SHARED_SHORT_HOP,
  SHORT_HOP_MODES as SHARED_SHORT_HOP_MODES,
  STAGES as SHARED_STAGES,
  TIME_LIMIT as SHARED_TIME_LIMIT,
  WEIGHT_CLASSES
} from "./battle-data.js";

export const ACTIONS = [
  ["left", "左移動"],
  ["right", "右移動"],
  ["up", "上入力"],
  ["down", "下入力"],
  ["jump", "ジャンプ"],
  ["attack", "通常攻撃"],
  ["smash", "スマッシュ"],
  ["special", "必殺技"],
  ["shield", "シールド"],
  ["grab", "つかみ"]
];

export const DEFAULT_CONTROLS = {
  shortHopMode: SHARED_SHORT_HOP.defaultMode,
  keyboard: {
    left: "KeyA",
    right: "KeyD",
    up: "KeyW",
    down: "KeyS",
    jump: "Space",
    attack: "KeyJ",
    smash: "KeyI",
    special: "KeyK",
    shield: "KeyL",
    grab: "KeyU"
  },
  gamepad: {
    left: "axis0-",
    right: "axis0+",
    up: "axis1-",
    down: "axis1+",
    jump: "button0",
    attack: "button2",
    smash: "button3",
    special: "button1",
    shield: "button5",
    grab: "button4"
  }
};

export const STAGE_LABELS = {
  final: "終点風",
  small: "小戦場風",
  battlefield: "戦場風"
};

export const MODE_LABELS = {
  stock: "ストック制",
  time: "タイム制",
  hp: "体力制",
  practice: "練習"
};

export const PLAYER_COLORS = [
  "#27d5b5",
  "#ffcf5a",
  "#6aa8ff",
  "#ff7676",
  "#ff72bd",
  "#95df62",
  "#ff914d",
  "#a98cff"
];

export const CHARACTER_ASSETS = Object.fromEntries(Object.values(CHARACTER_DEFINITIONS).map(character => [
  character.id,
  {
    id: character.id,
    name: character.name,
    weightClass: character.weightClass,
    weightLabel: WEIGHT_CLASSES[character.weightClass]?.label || WEIGHT_CLASSES.middle.label
  }
]));

export const DEFAULT_RULES = SHARED_DEFAULT_RULES;

export const PLAYER_LIMITS = SHARED_PLAYER_LIMITS;

export const SHORT_HOP = SHARED_SHORT_HOP;

export const SHORT_HOP_MODES = SHARED_SHORT_HOP_MODES;

export const TIME_LIMIT = SHARED_TIME_LIMIT;

export const STAGES = SHARED_STAGES;
