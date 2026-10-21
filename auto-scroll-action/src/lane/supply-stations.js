export const SUPPLY_ITEM_EFFECT_TYPE = Object.freeze({
  CANDY_BONUS: "candyBonus",
  CANDY_LAUNCHER: "candyLauncher",
  CANDY_PARTY: "candyParty",
  PUMPKIN_BARRIER: "pumpkinBarrier",
  SPEED_BOOST: "speedBoost",
});

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
    name: "おかしパーティータイム",
    symbol: "PARTY",
    artwork: "candyParty",
    description: "おかしがたくさん出てくるようになる",
    accentColor: "#cf62b8",
    effect: {
      type: SUPPLY_ITEM_EFFECT_TYPE.CANDY_PARTY,
      durationSeconds: 10,
    },
  },
];

export function createSupplyStationManager({
  itemDefinitions = SUPPLY_ITEM_DEFINITIONS,
  isItemSelectable = () => true,
  random = Math.random,
  onUseItem = (item, context) => item.use?.(context),
} = {}) {
  const activeStations = new Map();
  let activeDraw = null;
  let nextId = 1;

  function addStation({ x } = {}) {
    if (!Number.isFinite(x)) {
      throw new Error("Supply station x must be a finite number.");
    }

    const station = {
      id: `supply-station-${nextId}`,
      x,
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

  function openStation(id) {
    const station = activeStations.get(id);

    if (!station || station.isTriggered || activeDraw) {
      return null;
    }

    const selectableItems = itemDefinitions.filter((itemDefinition) =>
      isItemSelectable(itemDefinition),
    );
    const item = chooseRandomItem(selectableItems, random);

    if (!item) {
      return null;
    }

    station.isTriggered = true;
    activeDraw = {
      stationId: station.id,
      item,
      candidates: itemDefinitions.map((candidate) => ({ ...candidate })),
    };

    return cloneDraw(activeDraw);
  }

  function claimItem(context = {}) {
    if (!activeDraw) {
      return null;
    }

    const selectedItem = activeDraw.item;
    onUseItem(selectedItem, context);
    activeDraw = null;
    return { ...selectedItem };
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
  return { ...candidates[selectedIndex] };
}

function cloneDraw(draw) {
  if (!draw) {
    return null;
  }

  return {
    stationId: draw.stationId,
    item: { ...draw.item },
    candidates: draw.candidates.map((item) => ({ ...item })),
  };
}
