"use strict";

const DEFAULT_DIFFICULTY = "easy";
const DEFAULT_PLAY_MODE = "timed";
const SCORE_PER_PART = 100;
const TIMED_SECONDS = 5 * 60;
const LEGACY_STORAGE_KEY = "sequence-parts-best-score";
const STORAGE_KEY = "sequence-parts-best-scores-v2";
const SOUND_VOLUME = 0.43;
const BOMB_SOUND_VOLUME = 0.35;
const CLEAR_STEP_DELAY = 400;
const CLEAR_ANIMATION_DURATION = 260;
const BLAST_EFFECT_DURATION = 620;
const BLAST_WAVE_DELAY = 55;

const DIFFICULTIES = {
  baby: { key: "baby", label: "Baby", colorCount: 2, boardSize: 10 },
  easy: { key: "easy", label: "Easy", colorCount: 3, boardSize: 12 },
  normal: { key: "normal", label: "Normal", colorCount: 4, boardSize: 13 },
  hard: { key: "hard", label: "Hard", colorCount: 5, boardSize: 15 },
};

const COLOR_POOL = [
  { key: "red", label: "Red", value: "#d94b4b" },
  { key: "blue", label: "Blue", value: "#2d6fcb" },
  { key: "yellow", label: "Yellow", value: "#d89a24" },
  { key: "green", label: "Green", value: "#2fa068" },
  { key: "purple", label: "Purple", value: "#8b5cc7" },
];

const RAINBOW_COLOR = { key: "rainbow", label: "Rainbow", value: "#8b5cf6", isRainbow: true };

const PLAY_MODES = {
  timed: { key: "timed", label: "5分", seconds: TIMED_SECONDS },
  endless: { key: "endless", label: "エンドレス", seconds: null },
};

const ITEM_EFFECTS = {
  wild: { key: "wild", label: "ワイルド数字", chance: 7 },
  rainbow: { key: "rainbow", label: "虹色パーツ", chance: 7 },
  multiplier: { key: "multiplier", label: "倍率パーツ", chance: 6 },
  bomb: { key: "bomb", label: "爆弾パーツ", chance: 7 },
  rotate: { key: "rotate", label: "回転パーツ", chance: 11 },
};
const DEFAULT_ITEM_EFFECTS = ["wild", "rainbow"];
const ITEM_SELECTION_LIMIT = 2;
const COLOR_NUMBER_WEIGHT_BASE = 7;
const BOMB_BLAST_RADIUS = 1;
const MULTIPLIER_VALUES = [
  { value: 2, weight: 40 },
  { value: 3, weight: 30 },
  { value: 4, weight: 20 },
  { value: 5, weight: 10 },
];

const SHAPES = [
  { name: "Dot", cells: [[0, 0]], weight: 12 },
  { name: "Two", cells: [[0, 0], [1, 0]], weight: 12 },
  { name: "Three", cells: [[0, 0], [1, 0], [2, 0]], weight: 9 },
  { name: "Corner", cells: [[0, 0], [0, 1], [1, 1]], weight: 10 },
  { name: "Square", cells: [[0, 0], [1, 0], [0, 1], [1, 1]], weight: 7 },
  { name: "Long L", cells: [[0, 0], [0, 1], [0, 2], [1, 2]], weight: 7 },
  { name: "Long J", cells: [[1, 0], [1, 1], [1, 2], [0, 2]], weight: 7 },
  { name: "T", cells: [[0, 0], [1, 0], [2, 0], [1, 1]], weight: 6 },
];

const boardElement = document.querySelector("#board");
const rackElement = document.querySelector("#piece-rack");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const timerElement = document.querySelector("#timer");
const statusElement = document.querySelector("#status");
const restartButton = document.querySelector("#restart-button");
const playAgainButton = document.querySelector("#play-again-button");
const gameOverElement = document.querySelector("#game-over");
const finalScoreElement = document.querySelector("#final-score");
const rulesButton = document.querySelector("#rules-button");
const rulesPanel = document.querySelector("#rules-panel");
const rulesOverlay = document.querySelector("#rules-overlay");
const rulesCloseButton = document.querySelector("#rules-close-button");
const scoreListButton = document.querySelector("#score-list-button");
const scoreListPanel = document.querySelector("#score-list-panel");
const scoreListBody = document.querySelector("#score-list-body");
const scoreClearAllButton = document.querySelector("#score-clear-all-button");
const stageSizeLabel = document.querySelector("#stage-size-label");
const rulesBoardSize = document.querySelector("#rules-board-size");
const difficultyButton = document.querySelector("#difficulty-button");
const difficultyLabel = document.querySelector("#difficulty-label");
const difficultyPopover = document.querySelector("#difficulty-popover");
const difficultyOptions = document.querySelectorAll(".difficulty-option");
const startModal = document.querySelector("#start-modal");
const startRulesButton = document.querySelector("#start-rules-button");
const startDifficultyButtons = document.querySelectorAll("[data-start-difficulty]");
const playModeButtons = document.querySelectorAll("[data-play-mode]");
const itemModeButtons = document.querySelectorAll("[data-item-mode]");
const itemEffectButtons = document.querySelectorAll("[data-item-effect]");
const itemPicker = document.querySelector("#start-item-picker");
const itemSettingNote = document.querySelector("#item-setting-note");
const ruleItemExamples = document.querySelectorAll("[data-rule-effect]");
const gameOverTitle = document.querySelector("#game-over-title");

const directions = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

let board = [];
let rack = [];
let placedParts = new Map();
let boardCells = [];
let currentDifficulty = DIFFICULTIES[DEFAULT_DIFFICULTY];
let boardSize = currentDifficulty.boardSize;
let activeSlot = 0;
let cursor = createDefaultCursor();
let nextPartId = 1;
let score = 0;
let currentPlayMode = PLAY_MODES[DEFAULT_PLAY_MODE];
let itemEffectsEnabled = false;
let selectedItemEffects = [...DEFAULT_ITEM_EFFECTS];
let bestScores = readBestScores();
let bestScore = getBestScoreForCurrentPattern();
let isGameStarted = false;
let timerEndAt = null;
let timerIntervalId = null;
let isResolving = false;
let isGameOver = false;
let isTimeUpPending = false;
let clearingIds = new Set();
let lastWheelRotateAt = 0;
let audioContext = null;
let resolveRunId = 0;

init();

function init() {
  syncDifficultyUI();
  syncItemSettingsUI();
  renderRuleItemExamples();
  restartGame();
  bindEvents();
  openStartModal();
  openRules();
}

function bindEvents() {
  document.addEventListener("pointerdown", unlockAudioContext, { passive: true });
  document.addEventListener("keydown", unlockAudioContext);
  document.addEventListener("wheel", unlockAudioContext, { passive: true });

  boardElement.addEventListener("mousemove", updateCursorFromPointer);
  boardElement.addEventListener("pointerdown", (event) => {
    updateCursorFromPointer(event);
    if (event.button === 0) {
      placeActivePart();
    }
  });
  boardElement.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    updateCursorFromPointer(event);
    switchActiveSlot();
  });
  rackElement.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    switchActiveSlot();
  });
  boardElement.addEventListener("wheel", handleWheelRotate, { passive: false });
  rackElement.addEventListener("wheel", handleWheelRotate, { passive: false });

  rackElement.addEventListener("click", (event) => {
    const slot = event.target.closest(".piece-slot");
    if (!slot) {
      return;
    }
    if (!isGameStarted || isResolving || isGameOver || isTimeUpPending) {
      return;
    }
    activeSlot = Number(slot.dataset.slot);
    clampCursorForActivePart();
    setStatus(`スロット${slotLabel(activeSlot)}を選択中`);
    render();
  });

  document.addEventListener("keydown", handleKeydown);
  restartButton.addEventListener("click", prepareStart);
  playAgainButton.addEventListener("click", prepareStart);
  rulesButton.addEventListener("click", toggleRules);
  startRulesButton.addEventListener("click", openRules);
  rulesCloseButton.addEventListener("click", closeRules);
  scoreListButton.addEventListener("click", toggleScoreList);
  scoreClearAllButton.addEventListener("click", clearAllBestScores);
  scoreListBody.addEventListener("click", handleScoreListClick);
  rulesOverlay.addEventListener("click", closeRules);
  difficultyButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleDifficultyPopover();
  });
  difficultyPopover.addEventListener("click", (event) => {
    event.stopPropagation();
    const option = event.target.closest(".difficulty-option");
    if (!option) {
      return;
    }
    setDifficulty(option.dataset.difficulty);
  });
  document.addEventListener("click", closeDifficultyPopover);
  startDifficultyButtons.forEach((button) => {
    button.addEventListener("click", () => setDifficulty(button.dataset.startDifficulty));
  });
  playModeButtons.forEach((button) => {
    button.addEventListener("click", () => startGame(button.dataset.playMode));
  });
  itemModeButtons.forEach((button) => {
    button.addEventListener("click", () => setItemEffectsEnabled(button.dataset.itemMode === "on"));
  });
  itemEffectButtons.forEach((button) => {
    button.addEventListener("click", () => toggleItemEffect(button.dataset.itemEffect));
  });
}

function buildBoardElements() {
  boardElement.replaceChildren();
  boardElement.style.setProperty("--board-size", String(boardSize));
  boardElement.dataset.boardSize = String(boardSize);
  boardCells = [];
  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = String(x);
      cell.dataset.y = String(y);
      boardElement.append(cell);
      boardCells.push(cell);
    }
  }
}

function restartGame() {
  stopTimer();
  buildBoardElements();
  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));
  placedParts = new Map();
  rack = [createRandomPart(), createRandomPart()];
  activeSlot = 0;
  cursor = createDefaultCursor();
  clampCursorForActivePart();
  nextPartId = 1;
  score = 0;
  syncBestScoreForCurrentPattern();
  isResolving = false;
  resolveRunId += 1;
  isGameOver = false;
  isTimeUpPending = false;
  clearingIds = new Set();
  clearScorePopups();
  clearBombEffects();
  gameOverTitle.textContent = "Game Over";
  gameOverElement.hidden = true;
  setStatus("スロットAを選択中");
  if (isGameStarted) {
    startTimerForCurrentMode();
  } else {
    resetTimerDisplay();
  }
  render();
}

function prepareStart() {
  isGameStarted = false;
  stopTimer();
  gameOverElement.hidden = true;
  restartGame();
  openStartModal();
}

function startGame(modeKey) {
  const nextMode = PLAY_MODES[modeKey];
  if (!nextMode) {
    return;
  }
  if (itemEffectsEnabled && selectedItemEffects.length !== ITEM_SELECTION_LIMIT) {
    syncItemSettingsUI();
    return;
  }

  currentPlayMode = nextMode;
  isGameStarted = true;
  closeStartModal();
  restartGame();
}

function openStartModal() {
  syncItemSettingsUI();
  startModal.hidden = false;
}

function closeStartModal() {
  startModal.hidden = true;
}

function startTimerForCurrentMode() {
  stopTimer();
  if (currentPlayMode.seconds === null) {
    timerEndAt = null;
    timerElement.textContent = "∞";
    timerElement.parentElement.classList.remove("timer-ending");
    return;
  }

  timerEndAt = Date.now() + currentPlayMode.seconds * 1000;
  updateTimerDisplay(currentPlayMode.seconds);
  timerIntervalId = window.setInterval(tickTimer, 250);
}

function tickTimer() {
  if (timerEndAt === null || isGameOver || !isGameStarted) {
    return;
  }

  const remainingSeconds = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
  updateTimerDisplay(remainingSeconds);
  if (remainingSeconds <= 0) {
    stopTimer();
    handleTimeUp();
  }
}

function handleTimeUp() {
  if (isGameOver) {
    return;
  }

  isTimeUpPending = true;
  if (isResolving) {
    setStatus("時間切れです。連鎖終了後に結果を表示します");
    return;
  }

  finishTimeUp();
}

function finishTimeUp() {
  isTimeUpPending = false;
  endGame("時間切れです", "Time Up");
}

function stopTimer() {
  if (timerIntervalId !== null) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function resetTimerDisplay() {
  if (currentPlayMode.seconds === null) {
    timerElement.textContent = "∞";
  } else {
    updateTimerDisplay(currentPlayMode.seconds);
  }
  timerElement.parentElement.classList.remove("timer-ending");
}

function updateTimerDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  timerElement.textContent = `${minutes}:${String(rest).padStart(2, "0")}`;
  timerElement.parentElement.classList.toggle("timer-ending", seconds <= 30);
}

function createRandomPart() {
  const shape = weightedPick(SHAPES);
  const effect = pickItemEffect(shape);
  const colorNumber = pickColorNumberForEffect(effect);
  return {
    shapeName: shape.name,
    baseCells: shape.cells.map(([x, y]) => ({ x, y })),
    color: { ...colorNumber.color },
    number: colorNumber.number,
    rotation: randomInt(0, 3),
    effect,
    isWild: effect === "wild",
    hasBomb: effect === "bomb",
    canRotate: effect === "rotate",
    multiplier: effect === "multiplier" ? pickMultiplierValue() : 1,
  };
}

function pickColorNumberForEffect(effect) {
  if (effect === "wild") {
    return {
      color: randomItem(getActiveColors()),
      number: null,
    };
  }

  if (effect === "rainbow") {
    return {
      color: RAINBOW_COLOR,
      number: randomInt(1, 9),
    };
  }

  return pickWeightedColorNumberPair();
}

function pickWeightedColorNumberPair() {
  const existingCounts = countColorNumberPairsOnBoard();
  const pairs = getActiveColors().flatMap((color) =>
    Array.from({ length: 9 }, (_, index) => {
      const number = index + 1;
      const count = existingCounts.get(colorNumberKey(color.key, number)) || 0;
      return {
        color,
        number,
        weight: Math.max(0, COLOR_NUMBER_WEIGHT_BASE - count),
      };
    }),
  );
  const candidates = pairs.filter((pair) => pair.weight > 0);
  return weightedPick(candidates.length > 0 ? candidates : pairs.map((pair) => ({ ...pair, weight: 1 })));
}

function countColorNumberPairsOnBoard() {
  const counts = new Map();
  for (const part of placedParts.values()) {
    if (!usesColorNumberBias(part)) {
      continue;
    }

    const key = colorNumberKey(part.color.key, part.number);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function usesColorNumberBias(part) {
  return !part.isWild && !part.color.isRainbow && Number.isInteger(part.number) && part.number >= 1 && part.number <= 9;
}

function colorNumberKey(colorKey, number) {
  return `${colorKey}:${number}`;
}

function pickItemEffect(shape = null) {
  const activeEffects = itemEffectsEnabled ? selectedItemEffects : [];
  const effectWeights = activeEffects
    .filter((key) => ITEM_EFFECTS[key] && canApplyEffectToShape(key, shape))
    .map((key) => ({ key, weight: ITEM_EFFECTS[key].chance }));
  const effectTotal = effectWeights.reduce((sum, item) => sum + item.weight, 0);
  return weightedPick([{ key: "none", weight: Math.max(0, 100 - effectTotal) }, ...effectWeights]).key;
}

function canApplyEffectToShape(effect, shape) {
  if (effect !== "rotate" || !shape) {
    return true;
  }
  return hasMeaningfulRotation(shape.cells);
}

function hasMeaningfulRotation(cells) {
  return uniqueRotationKeys(cells).length > 1;
}

function pickMultiplierValue() {
  return weightedPick(MULTIPLIER_VALUES).value;
}

function renderRuleItemExamples() {
  const tShape = SHAPES.find((shape) => shape.name === "T");
  const tKeys = new Set(tShape.cells.map(([x, y]) => `${x},${y}`));
  ruleItemExamples.forEach((example) => {
    const part = createRuleExamplePart(example.dataset.ruleEffect, tShape);
    example.replaceChildren();
    example.style.setProperty("--piece-color", part.color.value);
    example.classList.toggle("rainbow", Boolean(part.color.isRainbow));

    for (let y = 0; y < 2; y += 1) {
      for (let x = 0; x < 3; x += 1) {
        if (!tKeys.has(`${x},${y}`)) {
          const empty = document.createElement("span");
          empty.className = "rule-piece-empty";
          example.append(empty);
          continue;
        }

        const cell = document.createElement("span");
        cell.className = "cell occupied";
        cell.classList.toggle("rainbow", Boolean(part.color.isRainbow));
        cell.style.setProperty("--piece-color", part.color.value);
        cell.replaceChildren(createPartContent(part));
        example.append(cell);
      }
    }
  });
}

function createRuleExamplePart(effect, shape) {
  const isRainbow = effect === "rainbow";
  return {
    shapeName: shape.name,
    baseCells: shape.cells.map(([x, y]) => ({ x, y })),
    color: { ...(isRainbow ? RAINBOW_COLOR : COLOR_POOL[0]) },
    number: effect === "wild" ? null : 5,
    rotation: 0,
    effect,
    isWild: effect === "wild",
    hasBomb: effect === "bomb",
    canRotate: effect === "rotate",
    multiplier: effect === "multiplier" ? 3 : 1,
  };
}

function getActiveColors() {
  return COLOR_POOL.slice(0, currentDifficulty.colorCount);
}

function createDefaultCursor() {
  const center = Math.floor((boardSize - 1) / 2);
  return { x: center, y: center };
}

function weightedPick(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();

  if (key === "escape" && !difficultyPopover.hidden) {
    event.preventDefault();
    closeDifficultyPopover();
    return;
  }

  if (!rulesPanel.hidden) {
    if (key === "escape") {
      event.preventDefault();
      closeRules();
    }
    return;
  }

  if (!startModal.hidden) {
    if (key === "enter") {
      event.preventDefault();
      startGame(DEFAULT_PLAY_MODE);
    }
    return;
  }

  if (isGameOver && event.key !== "Enter") {
    return;
  }

  if (isResolving || isTimeUpPending) {
    return;
  }

  const moves = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };

  if (moves[key]) {
    event.preventDefault();
    cursor = clampCursorForPart(rack[activeSlot], {
      x: cursor.x + moves[key].x,
      y: cursor.y + moves[key].y,
    });
    renderBoard();
    return;
  }

  if (key === " " || key === "spacebar") {
    event.preventDefault();
    rotateActivePart();
    return;
  }

  if (key === "k") {
    event.preventDefault();
    placeActivePart();
    return;
  }

  if (key === "h") {
    event.preventDefault();
    switchActiveSlot();
    return;
  }

  if (key === "1" || key === "2") {
    event.preventDefault();
    activeSlot = Number(key) - 1;
    setStatus(`スロット${slotLabel(activeSlot)}を選択中`);
    render();
    return;
  }

  if (key === "enter" && isGameOver) {
    event.preventDefault();
    prepareStart();
  }
}

function toggleRules() {
  if (rulesPanel.hidden) {
    openRules();
  } else {
    closeRules();
  }
}

function openRules() {
  renderBestScoreList();
  rulesPanel.hidden = false;
  rulesOverlay.hidden = false;
  rulesButton.setAttribute("aria-expanded", "true");
}

function closeRules() {
  rulesPanel.hidden = true;
  rulesOverlay.hidden = true;
  rulesButton.setAttribute("aria-expanded", "false");
}

function toggleScoreList() {
  if (scoreListPanel.hidden) {
    renderBestScoreList();
    scoreListPanel.hidden = false;
    scoreListButton.setAttribute("aria-expanded", "true");
  } else {
    scoreListPanel.hidden = true;
    scoreListButton.setAttribute("aria-expanded", "false");
  }
}

function toggleDifficultyPopover() {
  if (difficultyPopover.hidden) {
    openDifficultyPopover();
  } else {
    closeDifficultyPopover();
  }
}

function openDifficultyPopover() {
  difficultyPopover.hidden = false;
  difficultyButton.setAttribute("aria-expanded", "true");
}

function closeDifficultyPopover() {
  difficultyPopover.hidden = true;
  difficultyButton.setAttribute("aria-expanded", "false");
}

function setDifficulty(key) {
  const nextDifficulty = DIFFICULTIES[key];
  if (!nextDifficulty) {
    return;
  }

  closeDifficultyPopover();
  if (nextDifficulty.key === currentDifficulty.key) {
    return;
  }

  currentDifficulty = nextDifficulty;
  boardSize = nextDifficulty.boardSize;
  syncDifficultyUI();
  restartGame();
  renderBestScoreList();
}

function syncDifficultyUI() {
  const sizeText = `${boardSize} x ${boardSize}`;
  stageSizeLabel.textContent = sizeText;
  rulesBoardSize.textContent = sizeText;
  difficultyLabel.textContent = currentDifficulty.label;
  difficultyOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.difficulty === currentDifficulty.key);
  });
  startDifficultyButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.startDifficulty === currentDifficulty.key);
  });
}

function setItemEffectsEnabled(enabled) {
  itemEffectsEnabled = enabled;
  syncItemSettingsUI();
  syncBestScoreForCurrentPattern();
  renderBestScoreList();
  render();
}

function toggleItemEffect(key) {
  if (!ITEM_EFFECTS[key] || !itemEffectsEnabled) {
    return;
  }

  const currentIndex = selectedItemEffects.indexOf(key);
  if (currentIndex !== -1) {
    return;
  }

  selectedItemEffects.push(key);
  while (selectedItemEffects.length > ITEM_SELECTION_LIMIT) {
    selectedItemEffects.shift();
  }
  syncItemSettingsUI();
}

function syncItemSettingsUI() {
  itemModeButtons.forEach((button) => {
    const isActive = button.dataset.itemMode === (itemEffectsEnabled ? "on" : "off");
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  itemPicker.classList.toggle("disabled", !itemEffectsEnabled);
  itemEffectButtons.forEach((button) => {
    const isSelected = selectedItemEffects.includes(button.dataset.itemEffect);
    button.classList.toggle("active", isSelected);
    button.disabled = !itemEffectsEnabled;
    button.setAttribute("aria-pressed", String(isSelected));
  });

  if (itemEffectsEnabled) {
    const selectedLabels = selectedItemEffects.map((key) => ITEM_EFFECTS[key].label).join(" / ");
    itemSettingNote.textContent = `ON: ${selectedLabels}のみ有効`;
  } else {
    itemSettingNote.textContent = "OFF: アイテムなし";
  }
}

function syncBestScoreForCurrentPattern() {
  bestScore = isBestScoreEnabled() ? getBestScoreForCurrentPattern() : 0;
}

function getBestScoreForCurrentPattern() {
  const value = Number(bestScores[bestScoreKey(currentDifficulty.key, itemEffectsEnabled)]);
  return Number.isFinite(value) ? value : 0;
}

function writeBestScoreForCurrentPattern(value) {
  if (!isBestScoreEnabled()) {
    return;
  }

  bestScores[bestScoreKey(currentDifficulty.key, itemEffectsEnabled)] = value;
  writeBestScores();
}

function isBestScoreEnabled() {
  return currentPlayMode.seconds !== null;
}

function bestScoreKey(difficultyKey, itemsEnabled) {
  return `${difficultyKey}:${itemsEnabled ? "items-on" : "items-off"}`;
}

function renderBestScoreList() {
  scoreListBody.replaceChildren();
  Object.values(DIFFICULTIES).forEach((difficulty) => {
    const row = document.createElement("tr");
    const mode = document.createElement("th");
    mode.scope = "row";
    mode.textContent = difficulty.label;
    row.append(mode);

    [false, true].forEach((itemsEnabled) => {
      const cell = document.createElement("td");
      const key = bestScoreKey(difficulty.key, itemsEnabled);
      const value = Number(bestScores[key]) || 0;
      const inner = document.createElement("div");
      inner.className = "score-list-cell-inner";

      const valueText = document.createElement("span");
      valueText.className = "score-list-value";
      valueText.textContent = value.toLocaleString("ja-JP");

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "score-delete-button";
      deleteButton.dataset.scoreKey = key;
      deleteButton.setAttribute(
        "aria-label",
        `${difficulty.label} ${itemsEnabled ? "アイテムON" : "アイテムOFF"}の最高スコアを削除`,
      );
      deleteButton.append(createTrashIcon());

      inner.append(valueText, deleteButton);
      cell.append(inner);
      cell.classList.toggle(
        "current-score",
        difficulty.key === currentDifficulty.key && itemsEnabled === itemEffectsEnabled,
      );
      row.append(cell);
    });

    scoreListBody.append(row);
  });
}

function handleScoreListClick(event) {
  const button = event.target instanceof Element
    ? event.target.closest("[data-score-key]")
    : null;
  if (!button) {
    return;
  }

  if (!window.confirm("スコアを削除してもよろしいですか？")) {
    return;
  }

  delete bestScores[button.dataset.scoreKey];
  writeBestScores();
  syncBestScoreForCurrentPattern();
  renderBestScoreList();
  render();
}

function clearAllBestScores() {
  if (!window.confirm("すべてのスコアを削除してもよろしいですか？")) {
    return;
  }

  bestScores = {};
  writeBestScores();
  syncBestScoreForCurrentPattern();
  renderBestScoreList();
  render();
}

function createTrashIcon() {
  const icon = document.createElement("span");
  icon.className = "trash-icon";
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function handleWheelRotate(event) {
  if (!isGameStarted || isResolving || isGameOver || isTimeUpPending) {
    return;
  }

  if (event.deltaY === 0) {
    return;
  }

  event.preventDefault();
  const now = window.performance.now();
  if (now - lastWheelRotateAt < 120) {
    return;
  }
  lastWheelRotateAt = now;
  rotateActivePart(event.deltaY < 0 ? 1 : -1);
}

function switchActiveSlot() {
  if (!isGameStarted || isResolving || isGameOver || isTimeUpPending) {
    return;
  }
  activeSlot = activeSlot === 0 ? 1 : 0;
  clampCursorForActivePart();
  setStatus(`スロット${slotLabel(activeSlot)}を選択中`);
  render();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampCursorForActivePart() {
  cursor = clampCursorForPart(rack[activeSlot], cursor);
}

function clampCursorForPart(part, targetCursor) {
  if (!part) {
    return {
      x: clamp(targetCursor.x, 0, boardSize - 1),
      y: clamp(targetCursor.y, 0, boardSize - 1),
    };
  }

  const bounds = getRotatedBounds(part.baseCells, part.rotation);
  return {
    x: clamp(targetCursor.x, 0, Math.max(0, boardSize - bounds.width)),
    y: clamp(targetCursor.y, 0, Math.max(0, boardSize - bounds.height)),
  };
}

function getRotatedBounds(cells, rotation) {
  const rotated = getRotatedCells(cells, rotation);
  return {
    width: Math.max(...rotated.map((cell) => cell.x)) + 1,
    height: Math.max(...rotated.map((cell) => cell.y)) + 1,
  };
}

function updateCursorFromPointer(event) {
  if (!isGameStarted || isResolving || isGameOver || isTimeUpPending) {
    return;
  }

  const rect = boardElement.getBoundingClientRect();
  const cellSize = rect.width / boardSize;
  cursor = clampCursorForPart(rack[activeSlot], {
    x: Math.floor((event.clientX - rect.left) / cellSize),
    y: Math.floor((event.clientY - rect.top) / cellSize),
  });
  renderBoard();
}

function rotateActivePart(direction = 1) {
  if (!isGameStarted || isResolving || isGameOver || isTimeUpPending) {
    return;
  }
  const part = rack[activeSlot];
  if (!part.canRotate) {
    setStatus("↻付きのパーツだけ回転できます");
    renderBoard();
    return;
  }
  part.rotation = (part.rotation + direction + 4) % 4;
  clampCursorForActivePart();
  render();
}

function placeActivePart() {
  if (!isGameStarted || isResolving || isGameOver || isTimeUpPending) {
    return;
  }

  const part = rack[activeSlot];
  if (!canPlace(part, cursor.x, cursor.y, part.rotation)) {
    setStatus("そこには置けません");
    renderBoard();
    return;
  }

  const placed = {
    id: nextPartId,
    shapeName: part.shapeName,
    baseCells: part.baseCells.map((cell) => ({ ...cell })),
    color: { ...part.color },
    number: part.number,
    rotation: part.rotation,
    effect: part.effect,
    isWild: part.isWild,
    hasBomb: part.hasBomb,
    canRotate: part.canRotate,
    multiplier: part.multiplier,
    cells: getAbsoluteCells(part, cursor.x, cursor.y, part.rotation),
  };
  nextPartId += 1;
  placed.cellKeys = new Set(placed.cells.map(cellKey));
  placedParts.set(placed.id, placed);
  for (const cell of placed.cells) {
    board[cell.y][cell.x] = placed.id;
  }

  rack[activeSlot] = createRandomPart();
  clampCursorForActivePart();
  render();
  const matches = findMatches();
  if (matches.length > 0) {
    resolveMatches(matches, placed.id);
    return;
  }

  finishTurn("設置しました");
}

function finishTurn(message) {
  selectPlayableSlot();
  const playable = canAnyRackPartFit();
  if (!playable) {
    endGame();
    return;
  }
  setStatus(message);
  render();
}

function resolveMatches(matches, originPartId) {
  isResolving = true;
  const currentResolveRunId = ++resolveRunId;
  const clearGroups = buildClearGroups(matches);
  const allClearIds = [...new Set(clearGroups.flatMap((group) => group.ids))];
  const clearSteps = buildClearSteps(clearGroups, originPartId);
  const popupPointsById = getScorePopupPointsById(clearGroups);
  clearingIds = new Set();
  clearBombEffects();
  const gained = clearGroups.reduce((sum, group) => sum + group.scoring.total, 0);
  setStatus(`${allClearIds.length}パーツ消去 +${gained}pt`);
  render();

  clearSteps.forEach((step, index) => {
    window.setTimeout(() => {
      if (!isResolving || isGameOver || currentResolveRunId !== resolveRunId) {
        return;
      }
      for (const id of step.ids) {
        clearingIds.add(id);
      }
      markClearingParts(step.ids);
      markBombBlastEffects(step.ids, currentResolveRunId);
      spawnScorePopupsForIds(step.ids, popupPointsById);
      playClearSoundForIds(step.ids);
    }, index * CLEAR_STEP_DELAY);
  });

  window.setTimeout(() => {
    if (currentResolveRunId !== resolveRunId) {
      return;
    }

    for (const id of allClearIds) {
      const part = placedParts.get(id);
      if (!part) {
        continue;
      }
      for (const cell of part.cells) {
        board[cell.y][cell.x] = null;
      }
      placedParts.delete(id);
    }

    score += gained;
    if (isBestScoreEnabled() && score > bestScore) {
      bestScore = score;
      writeBestScoreForCurrentPattern(bestScore);
      renderBestScoreList();
    }
    clearingIds = new Set();
    clearBombEffects();
    isResolving = false;
    if (isGameOver) {
      render();
      return;
    }
    if (isTimeUpPending) {
      finishTimeUp();
      return;
    }
    finishTurn(`${clearGroups.length}連鎖消去`);
  }, Math.max(0, clearSteps.length - 1) * CLEAR_STEP_DELAY + CLEAR_ANIMATION_DURATION);
}

function buildClearGroups(matches) {
  let groups = matches.map((match) => expandBombClearing(new Set(match.ids)));
  let merged = true;

  while (merged) {
    merged = false;
    for (let i = 0; i < groups.length; i += 1) {
      for (let j = i + 1; j < groups.length; j += 1) {
        if (!setsIntersect(groups[i], groups[j])) {
          continue;
        }
        groups[i] = expandBombClearing(new Set([...groups[i], ...groups[j]]));
        groups.splice(j, 1);
        merged = true;
        break;
      }
      if (merged) {
        break;
      }
    }
  }

  return groups.map((ids) => {
    const idList = [...ids];
    return {
      ids: idList,
      scoring: scoreInfoForClearedIds(idList),
    };
  });
}

function buildClearSteps(clearGroups, originPartId) {
  const finalIds = new Set(clearGroups.flatMap((group) => group.ids));
  const originPart = placedParts.get(originPartId);
  const adjacency = buildPartAdjacency();
  const distances = new Map();
  const pending = [];
  const seedIds = finalIds.has(originPartId)
    ? [originPartId]
    : getNearestClearSeedIds(finalIds, originPart);
  const explodedBombIds = new Set();

  for (const id of seedIds) {
    const distance = id === originPartId ? 0 : distanceFromOriginPart(originPart, placedParts.get(id));
    relaxClearDistance(id, distance, distances, pending);
  }

  while (pending.length > 0) {
    pending.sort((a, b) => a.distance - b.distance || a.id - b.id);
    const current = pending.shift();
    if (distances.get(current.id) !== current.distance) {
      continue;
    }

    for (const neighborId of adjacency.get(current.id) ?? []) {
      if (finalIds.has(neighborId)) {
        relaxClearDistance(neighborId, current.distance + 1, distances, pending);
      }
    }

    const part = placedParts.get(current.id);
    if (!part?.hasBomb || explodedBombIds.has(current.id)) {
      continue;
    }
    explodedBombIds.add(current.id);

    for (const blastId of getBombBlastPartIds(part)) {
      if (!finalIds.has(blastId)) {
        continue;
      }
      const blastDistance = getBombBlastDistance(part, placedParts.get(blastId));
      relaxClearDistance(blastId, current.distance + blastDistance, distances, pending);
    }
  }

  addUnreachedClearDistances(finalIds, originPart, distances);

  const orderedIds = [...finalIds]
    .map((id) => ({
      id,
      distance: distances.get(id) ?? 0,
    }))
    .sort((a, b) => a.distance - b.distance || a.id - b.id);
  const steps = [];

  for (const item of orderedIds) {
    const lastStep = steps[steps.length - 1];
    if (lastStep && lastStep.distance === item.distance) {
      lastStep.ids.push(item.id);
    } else {
      steps.push({ distance: item.distance, ids: [item.id] });
    }
  }

  return steps;
}

function relaxClearDistance(id, distance, distances, pending) {
  const currentDistance = distances.get(id);
  if (currentDistance !== undefined && currentDistance <= distance) {
    return;
  }

  distances.set(id, distance);
  pending.push({ id, distance });
}

function getNearestClearSeedIds(finalIds, originPart) {
  if (!originPart) {
    return [...finalIds];
  }

  let nearestDistance = Infinity;
  const nearestIds = [];
  for (const id of finalIds) {
    const distance = distanceFromOriginPart(originPart, placedParts.get(id));
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIds.length = 0;
      nearestIds.push(id);
    } else if (distance === nearestDistance) {
      nearestIds.push(id);
    }
  }
  return nearestIds;
}

function addUnreachedClearDistances(finalIds, originPart, distances) {
  const reachedDistances = [...distances.values()];
  const fallbackStart = reachedDistances.length > 0 ? Math.max(...reachedDistances) + 1 : 0;

  for (const id of finalIds) {
    if (!distances.has(id)) {
      distances.set(id, fallbackStart + distanceFromOriginPart(originPart, placedParts.get(id)));
    }
  }
}

function distanceFromOriginPart(originPart, targetPart) {
  if (!originPart || !targetPart) {
    return 0;
  }

  let distance = Infinity;
  for (const originCell of originPart.cells) {
    for (const targetCell of targetPart.cells) {
      distance = Math.min(
        distance,
        Math.abs(originCell.x - targetCell.x) + Math.abs(originCell.y - targetCell.y),
      );
    }
  }
  return Number.isFinite(distance) ? distance : 0;
}

function getBombBlastDistance(bombPart, targetPart) {
  if (!bombPart || !targetPart) {
    return 1;
  }

  let distance = Infinity;
  for (const bombCell of bombPart.cells) {
    for (const targetCell of targetPart.cells) {
      distance = Math.min(
        distance,
        Math.max(Math.abs(bombCell.x - targetCell.x), Math.abs(bombCell.y - targetCell.y)),
      );
    }
  }
  return Math.max(1, Number.isFinite(distance) ? distance : 1);
}


function getScorePopupPointsById(clearGroups) {
  const pointsById = new Map();
  for (const group of clearGroups) {
    for (const [id, points] of group.scoring.pointsById) {
      pointsById.set(id, points);
    }
  }
  return pointsById;
}

function markClearingParts(ids) {
  for (const id of ids) {
    const part = placedParts.get(id);
    if (!part) {
      continue;
    }

    for (const cell of part.cells) {
      boardCells[cell.y * boardSize + cell.x]?.classList.add("clearing");
    }
  }
}

function markBombBlastEffects(ids, runId) {
  for (const id of ids) {
    const part = placedParts.get(id);
    if (!part?.hasBomb) {
      continue;
    }
    markBombBlastCells(part, runId);
  }
}

function markBombBlastCells(part, runId) {
  for (const cell of getBombBlastCells(part)) {
    const element = boardCells[cell.y * boardSize + cell.x];
    if (!element) {
      continue;
    }

    const distance = getBombBlastCellDistance(part, cell);
    const isOrigin = distance === 0;
    const overlay = document.createElement("span");
    overlay.className = `blast-overlay ${isOrigin ? "blast-origin" : "blast-wave"}`;
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.setProperty("--blast-delay", `${distance * BLAST_WAVE_DELAY}ms`);

    if (isOrigin) {
      const burst = document.createElement("span");
      burst.className = "blast-burst";

      const label = document.createElement("span");
      label.className = "blast-label";
      label.textContent = "爆";

      overlay.append(burst, label);
      element.classList.add("blast-origin-cell");
    } else {
      const wave = document.createElement("span");
      wave.className = "blast-wave-ring";
      overlay.append(wave);
    }

    element.classList.add("blast-range");
    element.append(overlay);

    window.setTimeout(() => {
      if (runId !== resolveRunId) {
        return;
      }
      overlay.remove();
      if (!element.querySelector(".blast-overlay")) {
        element.classList.remove("blast-range");
        element.classList.remove("blast-origin-cell");
      }
    }, BLAST_EFFECT_DURATION + distance * BLAST_WAVE_DELAY);
  }
}

function clearBombEffects() {
  boardElement.querySelectorAll(".blast-overlay").forEach((effect) => effect.remove());
  boardElement.querySelectorAll(".blast-range").forEach((cell) => cell.classList.remove("blast-range"));
  boardElement.querySelectorAll(".blast-origin-cell").forEach((cell) => cell.classList.remove("blast-origin-cell"));
}

function playClearSoundForIds(ids) {
  const clearedParts = ids.map((id) => placedParts.get(id)).filter(Boolean);
  const hasBomb = clearedParts.some((part) => part.hasBomb);
  const hasMultiplier = clearedParts.some((part) => part.multiplier > 1);

  if (hasBomb) {
    playBombSound();
  }

  if (hasMultiplier) {
    playChimeSound(hasBomb ? 0.09 : 0);
    return;
  }

  if (hasBomb) {
    return;
  }

  playPopSound();
}

function unlockAudioContext() {
  getAudioContext();
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume()?.catch(() => {});
  }

  return audioContext;
}

function createSoundGain(context, startTime, peak, duration, baseVolume = SOUND_VOLUME) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak * baseVolume, startTime + duration * 0.18);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  gain.connect(context.destination);
  return gain;
}

function playTone({ type = "sine", frequency, endFrequency, startTime, duration, volume = 1, baseVolume = SOUND_VOLUME }) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = createSoundGain(context, startTime, volume, duration, baseVolume);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration);
  }
  oscillator.connect(gain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playPopSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  playTone({ type: "triangle", frequency: 560, endFrequency: 760, startTime: now, duration: 0.13, volume: 0.44 });
  playTone({ type: "sine", frequency: 1046, endFrequency: 1320, startTime: now + 0.035, duration: 0.12, volume: 0.34 });
  playTone({ type: "sine", frequency: 1760, endFrequency: 1568, startTime: now + 0.09, duration: 0.12, volume: 0.16 });
  playTone({ type: "triangle", frequency: 380, endFrequency: 300, startTime: now, duration: 0.08, volume: 0.1 });
}

function playChimeSound(delay = 0) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime + delay;
  [740, 988, 1318].forEach((frequency, index) => {
    playTone({
      type: "sine",
      frequency,
      endFrequency: frequency * 1.02,
      startTime: now + index * 0.055,
      duration: 0.18,
      volume: 0.42,
    });
  });
}

function playBombSound() {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const now = context.currentTime;
  playTone({ type: "triangle", frequency: 220, endFrequency: 120, startTime: now, duration: 0.14, volume: 0.42, baseVolume: BOMB_SOUND_VOLUME });
  playTone({ type: "sine", frequency: 132, endFrequency: 58, startTime: now + 0.015, duration: 0.34, volume: 0.48, baseVolume: BOMB_SOUND_VOLUME });
  playTone({ type: "sine", frequency: 320, endFrequency: 190, startTime: now + 0.035, duration: 0.16, volume: 0.16, baseVolume: BOMB_SOUND_VOLUME });

  const noiseDuration = 0.18;
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * noiseDuration), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * ((1 - index / data.length) ** 3);
  }

  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = createSoundGain(context, now + 0.015, 0.05, noiseDuration, BOMB_SOUND_VOLUME);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(360, now);
  filter.frequency.exponentialRampToValueAtTime(120, now + noiseDuration);
  noise.buffer = buffer;
  noise.connect(filter);
  filter.connect(gain);
  noise.start(now + 0.015);
  noise.stop(now + noiseDuration + 0.02);
}

function expandBombClearing(initialIds) {
  const ids = new Set(initialIds);
  const explodedBombIds = new Set();
  let expanded = true;

  while (expanded) {
    expanded = false;
    const blastSeeds = new Set();

    for (const id of [...ids]) {
      const part = placedParts.get(id);
      if (!part?.hasBomb || explodedBombIds.has(id)) {
        continue;
      }
      explodedBombIds.add(id);

      for (const blastId of getBombBlastPartIds(part)) {
        if (ids.has(blastId)) {
          continue;
        }
        ids.add(blastId);
        blastSeeds.add(blastId);
        expanded = true;
      }
    }

    for (const chainId of getConnectedChainIds(blastSeeds)) {
      if (ids.has(chainId)) {
        continue;
      }
      ids.add(chainId);
      expanded = true;
    }
  }

  return ids;
}

function getBombBlastPartIds(part) {
  const ids = new Set();
  for (const cell of getBombBlastCells(part)) {
    const hitId = board[cell.y][cell.x];
    if (hitId !== null && hitId !== part.id) {
      ids.add(hitId);
    }
  }
  return ids;
}

function getBombBlastCells(part) {
  return getBlastCellsFromCells(part.cells);
}

function getBlastCellsFromCells(originCells) {
  const cells = new Map();
  for (const cell of originCells) {
    for (let y = cell.y - BOMB_BLAST_RADIUS; y <= cell.y + BOMB_BLAST_RADIUS; y += 1) {
      for (let x = cell.x - BOMB_BLAST_RADIUS; x <= cell.x + BOMB_BLAST_RADIUS; x += 1) {
        if (isInsideBoard(x, y)) {
          cells.set(`${x},${y}`, { x, y });
        }
      }
    }
  }
  return [...cells.values()];
}

function getBombBlastCellDistance(part, targetCell) {
  let distance = Infinity;
  for (const cell of part.cells) {
    distance = Math.min(
      distance,
      Math.max(Math.abs(cell.x - targetCell.x), Math.abs(cell.y - targetCell.y)),
    );
  }
  return Number.isFinite(distance) ? distance : 0;
}

function getConnectedChainIds(seedIds) {
  const adjacency = buildPartAdjacency();
  const ids = new Set();
  const stack = [...seedIds];

  while (stack.length > 0) {
    const id = stack.pop();
    if (ids.has(id)) {
      continue;
    }

    ids.add(id);
    for (const neighborId of adjacency.get(id) ?? []) {
      if (!ids.has(neighborId)) {
        stack.push(neighborId);
      }
    }
  }

  return ids;
}

function setsIntersect(a, b) {
  for (const value of a) {
    if (b.has(value)) {
      return true;
    }
  }
  return false;
}

function scoreInfoForClearedIds(ids) {
  const overallMultiplier = maxMultiplierForClearedIds(ids);
  const chainBonus = scoreMultiplier(ids.length);
  const pointsById = new Map();
  let total = 0;

  for (const id of ids) {
    const part = placedParts.get(id);
    const partMultiplier = part?.multiplier > 1 && part.multiplier < overallMultiplier
      ? part.multiplier
      : 1;
    const points = Math.round(SCORE_PER_PART * chainBonus * overallMultiplier * partMultiplier);
    pointsById.set(id, points);
    total += points;
  }

  return {
    total,
    pointsById,
    overallMultiplier,
  };
}

function maxMultiplierForClearedIds(ids) {
  let multiplier = 1;
  for (const id of ids) {
    const part = placedParts.get(id);
    if (part?.multiplier > multiplier) {
      multiplier = part.multiplier;
    }
  }
  return multiplier;
}

function scoreMultiplier(partCount) {
  const multiplier = partCount <= 3 ? 1 : 1 + (partCount - 3) * 0.1;
  return multiplier;
}

function spawnScorePopupsForIds(ids, pointsById) {
  for (const id of ids) {
    const part = placedParts.get(id);
    if (!part) {
      continue;
    }
    const points = pointsById.get(id) ?? SCORE_PER_PART;
    const center = getPartVisualCenter(part);
    const popup = document.createElement("div");
    popup.className = "score-popup";
    popup.textContent = `+${points.toLocaleString("ja-JP")}pt`;
    popup.style.left = `${center.x}px`;
    popup.style.top = `${center.y}px`;
    boardElement.append(popup);
    window.setTimeout(() => popup.remove(), 2100);
  }
}

function getPartVisualCenter(part) {
  const centers = part.cells.map((cell) => {
    const element = boardCells[cell.y * boardSize + cell.x];
    return {
      x: element.offsetLeft + element.offsetWidth / 2,
      y: element.offsetTop + element.offsetHeight / 2,
    };
  });
  const total = centers.reduce((sum, center) => ({
    x: sum.x + center.x,
    y: sum.y + center.y,
  }), { x: 0, y: 0 });

  return {
    x: total.x / centers.length,
    y: total.y / centers.length,
  };
}

function clearScorePopups() {
  boardElement.querySelectorAll(".score-popup").forEach((popup) => popup.remove());
}

function endGame(message = "置けるパーツがありません", title = "Game Over") {
  stopTimer();
  isGameOver = true;
  setStatus(message);
  gameOverTitle.textContent = title;
  finalScoreElement.textContent = score.toLocaleString("ja-JP");
  gameOverElement.hidden = false;
  render();
}

function selectPlayableSlot() {
  if (canPartFitSomewhere(rack[activeSlot])) {
    return;
  }
  const otherSlot = activeSlot === 0 ? 1 : 0;
  if (canPartFitSomewhere(rack[otherSlot])) {
    activeSlot = otherSlot;
  }
}

function canAnyRackPartFit() {
  return rack.some((part) => canPartFitSomewhere(part));
}

function canPartFitSomewhere(part) {
  const rotations = part.canRotate ? uniqueRotations(part) : [part.rotation];
  for (const rotation of rotations) {
    for (let y = 0; y < boardSize; y += 1) {
      for (let x = 0; x < boardSize; x += 1) {
        if (canPlace(part, x, y, rotation)) {
          return true;
        }
      }
    }
  }
  return false;
}

function uniqueRotations(part) {
  return uniqueRotationKeys(part.baseCells).map((item) => item.rotation);
}

function uniqueRotationKeys(cells) {
  const seen = new Set();
  const rotations = [];
  for (let rotation = 0; rotation < 4; rotation += 1) {
    const key = getRotatedCells(cells, rotation)
      .map((cell) => `${cell.x},${cell.y}`)
      .join("|");
    if (!seen.has(key)) {
      seen.add(key);
      rotations.push({ rotation, key });
    }
  }
  return rotations;
}

function canPlace(part, originX, originY, rotation) {
  const cells = getAbsoluteCells(part, originX, originY, rotation);
  return cells.every((cell) => (
    cell.x >= 0 &&
    cell.x < boardSize &&
    cell.y >= 0 &&
    cell.y < boardSize &&
    board[cell.y][cell.x] === null
  ));
}

function getAbsoluteCells(part, originX, originY, rotation) {
  return getRotatedCells(part.baseCells, rotation).map((cell) => ({
    x: originX + cell.x,
    y: originY + cell.y,
  }));
}

function getRotatedCells(cells, rotation) {
  let rotated = cells.map((cell) => ({ ...cell }));
  for (let i = 0; i < rotation; i += 1) {
    rotated = rotated.map((cell) => ({ x: cell.y, y: -cell.x }));
  }
  const minX = Math.min(...rotated.map((cell) => cell.x));
  const minY = Math.min(...rotated.map((cell) => cell.y));
  return rotated
    .map((cell) => ({ x: cell.x - minX, y: cell.y - minY }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

function findMatches() {
  const adjacency = buildPartAdjacency();
  const visited = new Set();
  const matches = [];

  for (const id of placedParts.keys()) {
    if (visited.has(id)) {
      continue;
    }
    const component = [];
    const stack = [id];
    visited.add(id);

    while (stack.length > 0) {
      const current = stack.pop();
      component.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }

    if (componentHasRun(component)) {
      matches.push({ ids: component });
    }
  }

  return matches;
}

function buildPartAdjacency() {
  const adjacency = new Map();
  for (const id of placedParts.keys()) {
    adjacency.set(id, new Set());
  }

  for (const part of placedParts.values()) {
    for (const cell of part.cells) {
      for (const direction of directions) {
        const neighborX = cell.x + direction.x;
        const neighborY = cell.y + direction.y;
        if (!isInsideBoard(neighborX, neighborY)) {
          continue;
        }
        const neighborId = board[neighborY][neighborX];
        if (neighborId === null || neighborId === part.id) {
          continue;
        }
        const neighbor = placedParts.get(neighborId);
        if (canPartsConnect(part, neighbor)) {
          adjacency.get(part.id).add(neighborId);
          adjacency.get(neighborId).add(part.id);
        }
      }
    }
  }

  return adjacency;
}

function canPartsConnect(a, b) {
  return colorsConnect(a, b) && numbersConnect(a, b);
}

function colorsConnect(a, b) {
  return a.color.isRainbow || b.color.isRainbow || a.color.key === b.color.key;
}

function numbersConnect(a, b) {
  for (const aNumber of numberOptions(a)) {
    for (const bNumber of numberOptions(b)) {
      if (Math.abs(aNumber - bNumber) <= 1) {
        return true;
      }
    }
  }
  return false;
}

function numberOptions(part) {
  if (part.isWild) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  }
  return [part.number];
}

function componentHasRun(componentIds) {
  const parts = componentIds.map((id) => placedParts.get(id));
  const actualNumbers = new Set(parts.filter((part) => !part.isWild).map((part) => part.number));
  const wildCount = parts.filter((part) => part.isWild).length;

  for (let start = 1; start <= 7; start += 1) {
    let missing = 0;
    for (let number = start; number < start + 3; number += 1) {
      if (!actualNumbers.has(number)) {
        missing += 1;
      }
    }
    if (missing <= wildCount) {
      return true;
    }
  }
  return false;
}

function render() {
  scoreElement.textContent = score.toLocaleString("ja-JP");
  bestScoreElement.textContent = isBestScoreEnabled() ? bestScore.toLocaleString("ja-JP") : "-";
  renderRack();
  renderBoard();
}

function renderRack() {
  rackElement.replaceChildren();
  rack.forEach((part, index) => {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "piece-slot";
    slot.dataset.slot = String(index);
    slot.style.setProperty("--piece-color", part.color.value);
    if (index === activeSlot) {
      slot.classList.add("active");
    }
    if (!canPartFitSomewhere(part)) {
      slot.classList.add("blocked");
    }

    const top = document.createElement("div");
    top.className = "slot-top";
    const name = document.createElement("span");
    name.className = "slot-name";
    name.textContent = `Slot ${slotLabel(index)}`;
    const value = document.createElement("span");
    value.className = "slot-value";
    value.classList.toggle("rainbow", Boolean(part.color.isRainbow));
    value.replaceChildren(createPartContent(part));
    top.append(name, value);

    slot.append(top, createMiniPreview(part));
    rackElement.append(slot);
  });
}

function createMiniPreview(part) {
  const size = 5;
  const cells = getRotatedCells(part.baseCells, part.rotation);
  const keys = new Set(cells.map(cellKey));
  const grid = document.createElement("div");
  grid.className = "mini-grid";
  grid.classList.toggle("rainbow", Boolean(part.color.isRainbow));
  grid.style.setProperty("--piece-color", part.color.value);
  grid.style.setProperty("--mini-size", String(size));

  const width = Math.max(...cells.map((cell) => cell.x)) + 1;
  const height = Math.max(...cells.map((cell) => cell.y)) + 1;
  const offsetX = Math.floor((size - width) / 2);
  const offsetY = Math.floor((size - height) / 2);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const cell = document.createElement("span");
      cell.className = "mini-cell";
      if (keys.has(`${x - offsetX},${y - offsetY}`)) {
        cell.classList.add("filled");
        cell.classList.toggle("rainbow", Boolean(part.color.isRainbow));
      }
      grid.append(cell);
    }
  }
  return grid;
}

function createPartContent(part) {
  const content = document.createElement("span");
  content.className = "part-content";

  const number = document.createElement("span");
  number.className = "part-number";
  number.textContent = numberLabel(part);
  content.append(number);

  if (part.hasBomb) {
    const bomb = document.createElement("span");
    bomb.className = "effect-badge bomb";
    bomb.setAttribute("aria-label", "爆弾");
    content.append(bomb);
  }

  if (part.canRotate) {
    const rotate = document.createElement("span");
    rotate.className = "effect-badge rotate";
    rotate.setAttribute("aria-label", "回転");
    rotate.textContent = "↻";
    content.append(rotate);
  }

  if (part.multiplier > 1) {
    const multiplier = document.createElement("span");
    multiplier.className = "effect-badge multiplier";
    multiplier.textContent = `×${part.multiplier}`;
    content.append(multiplier);
  }

  return content;
}

function numberLabel(part) {
  return part.isWild ? "?" : String(part.number);
}

function renderBoard() {
  const part = rack[activeSlot];
  const ghostCells = !isGameStarted || isGameOver ? [] : getAbsoluteCells(part, cursor.x, cursor.y, part.rotation);
  const ghostKeys = new Set(ghostCells.filter((cell) => isInsideBoard(cell.x, cell.y)).map(cellKey));
  const bombAssistCells = part?.hasBomb ? getBlastCellsFromCells(ghostCells) : [];
  const bombAssistKeys = new Set(bombAssistCells.map(cellKey));
  const bombAssistOriginKeys = new Set(ghostCells.filter((cell) => isInsideBoard(cell.x, cell.y)).map(cellKey));
  const ghostHasOutOfBoundsCells = ghostCells.some((cell) => !isInsideBoard(cell.x, cell.y));
  const placementValid = !isGameOver && canPlace(part, cursor.x, cursor.y, part.rotation);

  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      const key = `${x},${y}`;
      const element = boardCells[y * boardSize + x];
      const partId = board[y][x];
      element.className = "cell";
      element.style.removeProperty("--piece-color");
      element.replaceChildren();

      if (partId !== null) {
        const placed = placedParts.get(partId);
        element.classList.add("occupied");
        element.classList.toggle("rainbow", Boolean(placed.color.isRainbow));
        element.style.setProperty("--piece-color", placed.color.value);
        element.replaceChildren(createPartContent(placed));
        if (clearingIds.has(partId)) {
          element.classList.add("clearing");
        }
      }

      if (bombAssistKeys.has(key)) {
        element.classList.add("bomb-assist");
        element.classList.toggle("bomb-assist-origin", bombAssistOriginKeys.has(key));
      }

      if (ghostKeys.has(key)) {
        const isOverlap = partId !== null;
        element.classList.add("ghost");
        element.classList.toggle("rainbow", Boolean(part.color.isRainbow));
        element.classList.toggle("overlap", isOverlap);
        element.classList.toggle("invalid", !placementValid && !isOverlap && ghostHasOutOfBoundsCells);
        element.style.setProperty("--piece-color", part.color.value);
        if (isOverlap) {
          element.replaceChildren();
        } else {
          element.replaceChildren(createPartContent(part));
        }
      }
    }
  }
}

function setStatus(message) {
  statusElement.textContent = message;
}

function slotLabel(index) {
  return index === 0 ? "A" : "B";
}

function isInsideBoard(x, y) {
  return x >= 0 && x < boardSize && y >= 0 && y < boardSize;
}

function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

function readBestScores() {
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return {};
    }

    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, scoreValue]) => [key, Number(scoreValue)])
        .filter(([, scoreValue]) => Number.isFinite(scoreValue) && scoreValue >= 0),
    );
  } catch {
    return {};
  }
}

function writeBestScores() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bestScores));
  } catch {
    // Best score persistence is optional; the game should keep running.
  }
}
