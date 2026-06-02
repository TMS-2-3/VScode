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
    createInputSystem: window.createHealerInputSystem,
    createRenderer: window.createHealerRenderer,
    createBattleScaler: window.createHealerBattleScaler,
    createGameLoop: window.createHealerGameLoop,
    createScreenSystem: window.createHealerScreenSystem,
    createStatusControls: window.createHealerStatusControls,
    createContextFactory: window.createHealerContextFactory,
    createStoryData: window.createHealerStoryData,
  };

  const data = {
    CHARACTER_DEFS: window.HEALER_CHARACTER_DEFS,
    ENEMY_DEFS: window.HEALER_ENEMY_DEFS,
    SKILL_DATA: window.HEALER_SKILL_DATA,
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
    balance: BALANCE,
    theme: THEME,
    spatial,
    TAU,
  });

  systems.geometry = modules.createGeometrySystem(contexts.createGeometryContext());
  systems.storyData = modules.createStoryData(contexts.createStoryContext());
  systems.profileSystem = modules.createProfileSystem(contexts.createProfileContext());
  systems.unitFactory = modules.createUnitFactory(contexts.createUnitFactoryContext());

  state.player = systems.unitFactory.makeUnit({
    ...data.CHARACTER_DEFS.player,
    name: systems.profileSystem.getPlayerFirstName(),
  });

  systems.townController = modules.createTownController(contexts.createTownContext());
  systems.battleStats = modules.createBattleStats(contexts.createBattleStatsContext());
  systems.skillSystem = modules.createSkillSystem(contexts.createSkillContext());
  systems.combatSystem = modules.createCombatSystem(contexts.createCombatContext());
  systems.battleAi = modules.createBattleAi(contexts.createBattleAiContext());
  systems.battleSetup = modules.createBattleSetup(contexts.createBattleSetupContext());
  systems.battleRuntime = modules.createBattleRuntime(contexts.createBattleRuntimeContext());

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
      },
      game: {
        state: "town",
        time: 0,
        message: "はじまりの町",
        messageTimer: 5,
        hover: null,
        stageClearTimer: 0,
        reinforcementsSpawned: false,
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
      town: {
        player: { ...townData.player },
        camera: { x: 0, y: 0 },
        buildings: [],
        props: [],
        interaction: null,
        panel: null,
        story: null,
        introDone: false,
        meetingDone: false,
      },
      playerProfile: {
        gender: "",
        firstName: "アルジュナ",
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
