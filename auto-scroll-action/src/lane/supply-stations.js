export const SUPPLY_ITEM_EFFECT_TYPE = Object.freeze({
  CANDY_BONUS: "candyBonus",
  CANDY_LAUNCHER: "candyLauncher",
  CANDY_PARTY: "candyParty",
  CANDY_VACUUM: "candyVacuum",
  MAGIC_CLOCK: "magicClock",
  PUMPKIN_BARRIER: "pumpkinBarrier",
  SCARY_COSTUME: "scaryCostume",
  SPEED_BOOST: "speedBoost",
  STAMP: "stamp",
});

export const SUPPLY_ITEM_THEFT_CHANCE = 0.05;
const CANDY_ASSORTMENT_ITEM_TYPE = "candyAssortment";
const STAMP_ITEM_TYPE = "stamp";
export const STAMP_APPEARANCE_RULES = Object.freeze({
  baseChance: 0.03,
  rampMaxChance: 0.15,
  candyForRampMaxChance: 150,
  bonusChance: 0.3,
  bonusCandyThreshold: 200,
});

export const MAGIC_CLOCK_SPEED_PERCENT_VALUES = Object.freeze([
  -50, -45, -40, -35, -30, -25, -20, -15, -10,
  10, 15, 20, 25, 30, 35, 40, 45, 50,
]);

const MAGIC_CLOCK_POSITIVE_MIN_DURATION_SECONDS = 10;
const MAGIC_CLOCK_POSITIVE_MAX_DURATION_SECONDS = 20;
const MAGIC_CLOCK_NEGATIVE_MIN_DURATION_SECONDS = 5;
const MAGIC_CLOCK_NEGATIVE_MAX_DURATION_SECONDS = 14;

export const SUPPLY_ITEM_DEFINITIONS = [
  {
    type: "candyAssortment",
    name: "おかしのつめあわせ",
    symbol: "CANDY",
    artwork: "candyBag",
    description: "たくさんのおかし！",
    accentColor: "#f0a44b",
    effect: {
      type: SUPPLY_ITEM_EFFECT_TYPE.CANDY_BONUS,
      amount: 15,
    },
  },
  {
    type: "pumpkinBarrier",
    name: "かぼちゃバリア",
    symbol: "BARRIER",
    artwork: "pumpkinBarrier",
    description: "１回だけかぼちゃが身代わりになってくれる",
    accentColor: "#f28a32",
    effect: {
      type: SUPPLY_ITEM_EFFECT_TYPE.PUMPKIN_BARRIER,
      durationSeconds: 15,
    },
  },
  {
    type: "candyLauncher",
    name: "おかしランチャー",
    symbol: "LAUNCH",
    artwork: "candyLauncher",
    description:
      "おかしランチャーを発射する。障害物を破壊できるとおかしが周りに出てくる",
    accentColor: "#5cc7bd",
    effect: {
      type: SUPPLY_ITEM_EFFECT_TYPE.CANDY_LAUNCHER,
      countdownSeconds: 3,
    },
  },
  {
    type: "candyParty",
    name: "パーティータイム",
    symbol: "PARTY",
    artwork: "candyParty",
    description: "おかしがたくさん出てくるようになる",
    accentColor: "#cf62b8",
    effect: {
      type: SUPPLY_ITEM_EFFECT_TYPE.CANDY_PARTY,
      durationSeconds: 10,
    },
  },
  {
    type: "candyVacuum",
    name: "おかしバキューム",
    symbol: "VACUUM",
    artwork: "candyVacuum",
    description: "おかしを吸い寄せる",
    accentColor: "#58cfc4",
    effect: {
      type: SUPPLY_ITEM_EFFECT_TYPE.CANDY_VACUUM,
      durationSeconds: 12,
    },
  },
  {
    type: "scaryCostume",
    name: "こわ～い仮装",
    symbol: "BOO",
    artwork: "scaryCostume",
    description: "いたずらなお化けを驚かせちゃう！",
    accentColor: "#9c79c7",
    effect: {
      type: SUPPLY_ITEM_EFFECT_TYPE.SCARY_COSTUME,
    },
  },
  {
    type: "magicClock",
    name: "魔法の時計",
    symbol: "TIME",
    artwork: "magicClock",
    description: "時間の流れが変わってしまう",
    accentColor: "#70c9c0",
    effect: {
      type: SUPPLY_ITEM_EFFECT_TYPE.MAGIC_CLOCK,
    },
  },
  {
    type: STAMP_ITEM_TYPE,
    name: "スタンプ",
    symbol: "STAMP",
    artwork: "stamp",
    description: "スタンプをゲット！！\nスタッフの人にこの画面を見せてね！",
    accentColor: "#e6bb61",
    effect: { type: SUPPLY_ITEM_EFFECT_TYPE.STAMP },
  },
];

export function createSupplyStationManager({
  itemDefinitions = SUPPLY_ITEM_DEFINITIONS,
  isItemSelectable = () => true,
  getCandyCount = () => 0,
  random = Math.random,
  theftChance = SUPPLY_ITEM_THEFT_CHANCE,
  onUseItem = (item, context) => item.use?.(context),
} = {}) {
  const activeStations = new Map();
  let activeDraw = null;
  let nextId = 1;
  let stampWasDrawn = false;

  function addStation({ x, isLarge = false } = {}) {
    if (!Number.isFinite(x)) {
      throw new Error("Supply station x must be a finite number.");
    }

    const station = {
      id: `supply-station-${nextId}`,
      x,
      isLarge: Boolean(isLarge),
      isTriggered: false,
    };

    nextId += 1;
    activeStations.set(station.id, station);
    return station.id;
  }

  function moveStations(deltaX) {
    if (!Number.isFinite(deltaX)) {
      return;
    }

    activeStations.forEach((station) => {
      station.x += deltaX;
    });
  }

  function openStation(id, { repelTheft = false } = {}) {
    const station = activeStations.get(id);

    if (!station || station.isTriggered || activeDraw) {
      return null;
    }

    const selectableItems = itemDefinitions.filter((itemDefinition) =>
      isItemSelectable(itemDefinition),
    );
    const requestedItemCount = station.isLarge ? 2 : 1;
    const fallbackItem = itemDefinitions.find(
      (itemDefinition) => itemDefinition.type === CANDY_ASSORTMENT_ITEM_TYPE,
    );
    const stampItem = selectableItems.find((item) => item.type === STAMP_ITEM_TYPE);
    const stampChance = getStampAppearanceChance(getCandyCount());
    let candidates = selectableItems.filter((item) => item.type !== STAMP_ITEM_TYPE);
    const selectedItems = [];

    for (let index = 0; index < requestedItemCount; index += 1) {
      // Stamp odds are per slot and independent of the normal item pool size.
      const drawStamp = stampItem && !stampWasDrawn &&
        normalizeRandomRoll(random()) < stampChance;
      const item = drawStamp
        ? cloneItem(stampItem)
        : chooseDistinctItems(candidates, 1, random)[0] ?? cloneItem(fallbackItem);

      if (!item) {
        continue;
      }
      if (drawStamp) {
        // Reserve the one appearance now, including for a two-slot draw.
        stampWasDrawn = true;
      }
      selectedItems.push(item);
      candidates = candidates.filter((candidate) => candidate.type !== item.type);
    }

    if (selectedItems.length === 0) {
      return null;
    }

    station.isTriggered = true;
    const slots = selectedItems.map((selectedItem) => {
      const isStolen = selectedItem.type !== STAMP_ITEM_TYPE &&
        random() < normalizeChance(theftChance);

      return {
        item: resolveItemEffect(selectedItem, random),
        candidates: itemDefinitions.map(cloneItem),
        isStolen,
        // A costume active before the draw protects both simultaneous slots.
        isTheftRepelled: isStolen && repelTheft,
        isClaimed: false,
      };
    });
    const isLarge = station.isLarge && slots.length === 2;
    activeDraw = {
      stationId: station.id,
      isLarge,
      slots,
    };

    return cloneDraw(activeDraw);
  }

  function claimItem(slotIndex = 0, context = {}) {
    if (!activeDraw) {
      return null;
    }

    if (typeof slotIndex === "object") {
      context = slotIndex;
      slotIndex = 0;
    }

    const slot = activeDraw.slots[slotIndex];

    if (!slot || slot.isClaimed) {
      return null;
    }

    slot.isClaimed = true;

    if (!slot.isStolen || slot.isTheftRepelled) {
      onUseItem(slot.item, context);
    }

    const claimedItem = {
      ...cloneItem(slot.item),
      isStolen: slot.isStolen,
      isTheftRepelled: slot.isTheftRepelled,
    };

    if (activeDraw.slots.every((drawSlot) => drawSlot.isClaimed)) {
      activeDraw = null;
    }

    return claimedItem;
  }

  function removeStation(id) {
    return activeStations.delete(id);
  }

  function getSnapshot() {
    return Array.from(activeStations.values(), (station) => ({ ...station }));
  }

  function getActiveDraw() {
    return cloneDraw(activeDraw);
  }

  function reset() {
    activeStations.clear();
    activeDraw = null;
    stampWasDrawn = false;
  }

  return {
    addStation,
    claimItem,
    getActiveDraw,
    getSnapshot,
    moveStations,
    openStation,
    removeStation,
    reset,
  };
}

export function getStampAppearanceChance(candyCount) {
  const candy = Number.isFinite(candyCount) ? Math.max(0, candyCount) : 0;
  if (candy > STAMP_APPEARANCE_RULES.bonusCandyThreshold) {
    return STAMP_APPEARANCE_RULES.bonusChance;
  }

  const progress = Math.min(1, candy / STAMP_APPEARANCE_RULES.candyForRampMaxChance);
  return STAMP_APPEARANCE_RULES.baseChance +
    (STAMP_APPEARANCE_RULES.rampMaxChance - STAMP_APPEARANCE_RULES.baseChance) * progress;
}

export function chooseRandomItem(itemDefinitions, random = Math.random) {
  const candidates = Array.isArray(itemDefinitions)
    ? itemDefinitions.filter((item) => item?.type)
    : [];

  if (candidates.length === 0) {
    return null;
  }

  const selectedIndex = Math.min(
    candidates.length - 1,
    Math.floor(random() * candidates.length),
  );
  return cloneItem(candidates[selectedIndex]);
}

export function chooseDistinctItems(
  itemDefinitions,
  count,
  random = Math.random,
) {
  const candidates = Array.isArray(itemDefinitions)
    ? itemDefinitions.filter((item) => item?.type).map(cloneItem)
    : [];
  const selectedItems = [];
  const itemCount = Math.min(
    candidates.length,
    Math.max(0, Math.floor(Number.isFinite(count) ? count : 0)),
  );

  while (selectedItems.length < itemCount) {
    const selectedIndex = Math.min(
      candidates.length - 1,
      Math.floor(normalizeRandomRoll(random()) * candidates.length),
    );
    selectedItems.push(candidates.splice(selectedIndex, 1)[0]);
  }

  return selectedItems;
}

export function resolveItemEffect(item, random = Math.random) {
  const resolvedItem = cloneItem(item);

  if (resolvedItem?.effect?.type !== SUPPLY_ITEM_EFFECT_TYPE.MAGIC_CLOCK) {
    return resolvedItem;
  }

  const speedPercentIndex = Math.min(
    MAGIC_CLOCK_SPEED_PERCENT_VALUES.length - 1,
    Math.floor(normalizeRandomRoll(random()) * MAGIC_CLOCK_SPEED_PERCENT_VALUES.length),
  );
  const speedChangePercent = MAGIC_CLOCK_SPEED_PERCENT_VALUES[speedPercentIndex];
  const minimumDuration = speedChangePercent < 0
    ? MAGIC_CLOCK_NEGATIVE_MIN_DURATION_SECONDS
    : MAGIC_CLOCK_POSITIVE_MIN_DURATION_SECONDS;
  const maximumDuration = speedChangePercent < 0
    ? MAGIC_CLOCK_NEGATIVE_MAX_DURATION_SECONDS
    : MAGIC_CLOCK_POSITIVE_MAX_DURATION_SECONDS;
  const durationRange = maximumDuration - minimumDuration + 1;
  const durationSeconds =
    minimumDuration +
    Math.min(
      durationRange - 1,
      Math.floor(normalizeRandomRoll(random()) * durationRange),
    );

  resolvedItem.effect = {
    ...resolvedItem.effect,
    durationSeconds,
    speedChangePercent,
    speedIncreaseRatio: speedChangePercent / 100,
  };
  return resolvedItem;
}

function cloneDraw(draw) {
  if (!draw) {
    return null;
  }

  return {
    stationId: draw.stationId,
    isLarge: draw.isLarge,
    slots: draw.slots.map((slot) => ({
      item: cloneItem(slot.item),
      candidates: slot.candidates.map(cloneItem),
      isStolen: slot.isStolen,
      isTheftRepelled: slot.isTheftRepelled,
      isClaimed: slot.isClaimed,
    })),
  };
}

function cloneItem(item) {
  if (!item) {
    return null;
  }

  return {
    ...item,
    effect: item.effect ? { ...item.effect } : item.effect,
  };
}

function normalizeRandomRoll(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(0.999999999, Math.max(0, value));
}

function normalizeChance(chance) {
  if (!Number.isFinite(chance)) {
    return 0;
  }

  return Math.min(1, Math.max(0, chance));
}
