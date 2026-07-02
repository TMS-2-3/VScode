(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const canvasCtx = canvas.getContext("2d");
  const TAU = Math.PI * 2;

  const modules = {
    createSkillSystem: window.createHealerSkillSystem,
    createUnitFactory: window.createHealerUnitFactory,
    createGeometrySystem: window.createHealerGeometrySystem,
    createProfileSystem: window.createHealerProfileSystem,
    createTownController: window.createHealerTownController,
    createBattleStats: window.createHealerBattleStats,
    createCombatSystem: window.createHealerCombatSystem,
    createBattleAi: window.createHealerBattleAi,
    createBattleSetup: window.createHealerBattleSetup,
    createBattleRuntime: window.createHealerBattleRuntime,
    createItemSystem: window.createHealerItemSystem,
    createInputSystem: window.createHealerInputSystem,
    createRenderer: window.createHealerRenderer,
    createBattleScaler: window.createHealerBattleScaler,
    createGameLoop: window.createHealerGameLoop,
    createScreenSystem: window.createHealerScreenSystem,
    createStatusControls: window.createHealerStatusControls,
    createContextFactory: window.createHealerContextFactory,
    createLoadoutSystem: window.createHealerLoadoutSystem,
    createEquipmentSystem: window.createHealerEquipmentSystem,
    createWalletSystem: window.createHealerWalletSystem,
    createStoryData: window.createHealerStoryData,
  };

  const data = {
    CHARACTER_DEFS: window.HEALER_CHARACTER_DEFS,
    ENEMY_DEFS: window.HEALER_ENEMY_DEFS,
    SKILL_DATA: window.HEALER_SKILL_DATA,
    STATUS_DATA: window.HEALER_STATUS_DATA,
    PASSIVE_DATA: window.HEALER_PASSIVE_DATA,
    LOADOUT_CONFIG: window.HEALER_LOADOUT_CONFIG,
    ELEMENT_DATA: window.HEALER_ELEMENT_DATA,
    EQUIPMENT_DATA: window.HEALER_EQUIPMENT_DATA,
    EQUIPMENT_SERIES_DATA: window.HEALER_EQUIPMENT_SERIES_DATA,
    MATERIAL_DATA: window.HEALER_MATERIAL_DATA,
    RANK_DATA: window.HEALER_RANK_DATA,
    QUEST_DATA: window.HEALER_QUEST_DATA,
    FACILITY_DATA: window.HEALER_FACILITY_DATA,
    TOWN_DATA: window.HEALER_TOWN_DATA,
  };
  const CONFIG = window.HEALER_CONFIG;
  const BALANCE = window.HEALER_BALANCE;
  const THEME = window.HEALER_THEME;

  const missingModules = Object.entries(modules)
    .filter(([, module]) => !module)
    .map(([name]) => name);
  const missingData = Object.entries({ ...data, CONFIG, BALANCE, THEME })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingModules.length || missingData.length) {
    throw new Error(`healer-game load error. modules: ${missingModules.join(", ") || "none"} / data: ${missingData.join(", ") || "none"}`);
  }

  const battleScaler = modules.createBattleScaler(CONFIG);
  const battlePx = battleScaler.battlePx;
  const spatial = {
    BATTLE_SPATIAL_SCALE: battleScaler.battleSpatialScale,
    TOWN_WIDTH: data.TOWN_DATA.width,
    TOWN_HEIGHT: data.TOWN_DATA.height,
    BATTLE_SIDE_MARGIN: battlePx(BALANCE.battleSideMargin),
    BATTLE_MIN_PLAY_HEIGHT: battlePx(BALANCE.battleMinPlayHeight),
    battlePx,
  };

  const state = createInitialState({
    canvas,
    canvasCtx,
    townData: data.TOWN_DATA,
  });
  const systems = {};
  const contexts = modules.createContextFactory({
    state,
    systems,
    data,
    config: CONFIG,
    balance: BALANCE,
    theme: THEME,
    spatial,
    TAU,
  });

  systems.geometry = modules.createGeometrySystem(contexts.createGeometryContext());
  systems.storyData = modules.createStoryData(contexts.createStoryContext());
  systems.profileSystem = modules.createProfileSystem(contexts.createProfileContext());
  systems.loadoutSystem = modules.createLoadoutSystem(contexts.createLoadoutContext());
  systems.equipmentSystem = modules.createEquipmentSystem(contexts.createEquipmentContext());
  systems.walletSystem = modules.createWalletSystem(contexts.createWalletContext());
  systems.unitFactory = modules.createUnitFactory(contexts.createUnitFactoryContext());

  state.player = systems.unitFactory.makeUnit({
    ...data.CHARACTER_DEFS.player,
    name: systems.profileSystem.getPlayerFullName(),
  });

  systems.townController = modules.createTownController(contexts.createTownContext());
  systems.battleStats = modules.createBattleStats(contexts.createBattleStatsContext());
  systems.skillSystem = modules.createSkillSystem(contexts.createSkillContext());
  systems.combatSystem = modules.createCombatSystem(contexts.createCombatContext());
  systems.battleAi = modules.createBattleAi(contexts.createBattleAiContext());
  systems.battleSetup = modules.createBattleSetup(contexts.createBattleSetupContext());
  systems.battleRuntime = modules.createBattleRuntime(contexts.createBattleRuntimeContext());
  systems.itemSystem = modules.createItemSystem(contexts.createItemContext());

  state.profileNameInput = systems.profileSystem.createProfileNameInput();
  systems.renderer = modules.createRenderer(contexts.createRenderContext());
  systems.screenSystem = modules.createScreenSystem(contexts.createScreenContext());
  systems.statusControls = modules.createStatusControls(contexts.createStatusControlsContext());
  systems.gameLoop = modules.createGameLoop(contexts.createGameLoopContext());
  systems.inputSystem = modules.createInputSystem(contexts.createInputContext());
  systems.inputSystem.attach();

  function createInitialState(options) {
    const { canvas, canvasCtx, townData } = options;
    const view = {
      w: window.innerWidth,
      h: window.innerHeight,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    };

    return {
      canvas,
      canvasCtx,
      view,
      input: {
        mouse: { x: view.w / 2, y: view.h / 2, right: false },
        keys: {},
      },
      game: {
        state: "town",
        time: 0,
        message: "はじまりの町",
        messageTimer: 5,
        hover: null,
        priorityTarget: null,
        priorityTargetTimer: 0,
        priorityTargetIgnoredUnitIds: {},
        skillPage: "page1",
        itemSlots: null,
        gold: 0,
        innRestUsedUntilBattle: false,
        materialsById: {},
        battleRewards: null,
        currentQuest: null,
        stageClearTimer: 0,
        reinforcementsSpawned: false,
        partyHpById: {},
        partyMpById: {},
        partyStatusById: {},
        partyEquipmentById: {},
        partyLoadoutById: {},
        partyItemById: {},
        itemInventoryById: {},
        skillProgressById: {},
        equipmentInventoryById: {},
        equipmentInstancesById: {},
        nextEquipmentInstanceSeq: 1,
        equipmentUpgradeById: {},
        equipmentRandomStatsById: {},
        equipmentRandomSeedsById: {},
        equipmentPresetsById: {},
        settings: {
          tooltipDescriptionMode: "simple",
          powerCrystalAutoUse: true,
          keybinds: window.HEALER_KEYBINDS
            ? window.HEALER_KEYBINDS.normalizeKeybinds(window.HEALER_KEYBINDS.loadSavedKeybinds())
            : null,
        },
        systemMenu: {
          open: false,
          panel: null,
          confirm: null,
          targets: [],
          panelScroll: 0,
          panelScrollMax: 0,
          settings: {
            tab: "game",
            controlsDraft: null,
            controlsCapture: null,
            controlsScroll: 0,
            controlsScrollMax: 0,
            gameScroll: 0,
            gameScrollMax: 0,
            message: "",
          },
        },
      },
      party: [],
      enemies: [],
      projectiles: [],
      telegraphs: [],
      areas: [],
      effects: [],
      expandedStatusUnitIds: new Set(),
      statusUiButtons: [],
      statusCardMetas: [],
      statusTooltipTargets: [],
      town: {
        player: { ...townData.player },
        camera: { x: 0, y: 0 },
        buildings: [],
        props: [],
        followers: [],
        trail: [],
        interaction: null,
        panel: null,
        selectedQuest: null,
        story: null,
        introDone: false,
        meetingDone: false,
      },
      playerProfile: {
        gender: "",
        firstName: "アルジュナ",
        lastName: "フィナルド",
        pronoun: "",
        done: false,
        step: "gender",
      },
      profileNameInput: null,
      profileClickTargets: [],
      player: null,
    };
  }
})();
