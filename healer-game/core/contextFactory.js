(() => {
  "use strict";

  window.createHealerContextFactory = function createHealerContextFactory(options) {
    const {
      state,
      systems,
      data,
      balance,
      theme,
      spatial,
      TAU,
    } = options;

    const {
      CHARACTER_DEFS,
      ENEMY_DEFS,
      TOWN_DATA,
    } = data;

    const {
      BATTLE_SPATIAL_SCALE,
      TOWN_WIDTH,
      TOWN_HEIGHT,
      BATTLE_SIDE_MARGIN,
      BATTLE_MIN_PLAY_HEIGHT,
      battlePx,
    } = spatial;

    const COLORS = theme.colors;
    const ULTIMATE_KEYS = theme.ultimateKeys;
    const STATUS_FULL_NAMES = theme.statusFullNames;

    function callLater(systemName, methodName) {
      return (...args) => {
        const system = systems[systemName];
        const method = system && system[methodName];
        if (typeof method !== "function") {
          throw new Error(`Context dependency missing: ${systemName}.${methodName}`);
        }
        return method(...args);
      };
    }

    function createGeometryContext() {
      return {
        TAU,
        view: state.view,
        town: state.town,
        party: state.party,
        enemies: state.enemies,
        TOWN_WIDTH,
        TOWN_HEIGHT,
        BATTLE_SPATIAL_SCALE,
        BATTLE_SIDE_MARGIN,
        BATTLE_MIN_PLAY_HEIGHT,
        battlePx,
        isFieldUnit: callLater("battleRuntime", "isFieldUnit"),
        isTargetableUnit: callLater("battleRuntime", "isTargetableUnit"),
      };
    }

    function createStoryContext() {
      return {
        getPlayerFirstName: callLater("profileSystem", "getPlayerFirstName"),
      };
    }

    function createProfileContext() {
      return {
        view: state.view,
        game: state.game,
        town: state.town,
        playerProfile: state.playerProfile,
        profileClickTargets: state.profileClickTargets,
        COLORS,
        getPlayer: () => state.player,
        getOpeningStory: callLater("storyData", "getOpeningStory"),
        startTownStory: callLater("townController", "startTownStory"),
      };
    }

    function createUnitFactoryContext() {
      return {
        CHARACTER_DEFS,
        ENEMY_DEFS,
        MOOD_REFERENCE_HP_BY_ID: balance.moodReferenceHpById,
        MOOD_INITIAL: balance.moodInitial,
        DEFAULT_MP_REGEN_RATE: balance.defaultMpRegenRate,
        battlePx,
        getSkillSystem: () => systems.skillSystem,
        getActionCooldown: callLater("skillSystem", "getActionCooldown"),
      };
    }

    function createSkillContext() {
      return {
        get player() { return state.player; },
        get party() { return state.party; },
        get enemies() { return state.enemies; },
        get projectiles() { return state.projectiles; },
        get areas() { return state.areas; },
        get effects() { return state.effects; },
        canvasCtx: state.canvasCtx,
        TAU,
        view: state.view,
        input: state.input,
        game: state.game,
        COLORS,
        ACTION_GAP: balance.actionGap,
        ACTION_COOLDOWN_BASE: balance.actionCooldownBase,
        AI_IDLE_RECHECK: balance.aiIdleRecheck,
        MOOD_EVENT_MULT: balance.moodEventMult,
        MOOD_MULTI_HIT_MIN: balance.moodMultiHitMin,
        BATTLE_SPATIAL_SCALE,
        battlePx,
        clamp: callLater("geometry", "clamp"),
        normalize: callLater("geometry", "normalize"),
        dist: callLater("geometry", "dist"),
        distPoint: callLater("geometry", "distPoint"),
        angleTo: callLater("geometry", "angleTo"),
        deg: callLater("geometry", "deg"),
        inFan: callLater("geometry", "inFan"),
        nearestAlive: callLater("geometry", "nearestAlive"),
        projectPoint: callLater("geometry", "projectPoint"),
        distanceToSegment: callLater("geometry", "distanceToSegment"),
        getMoodCooldown: callLater("battleStats", "getMoodCooldown"),
        getCommandActionCooldown: callLater("battleStats", "getCommandActionCooldown"),
        applyMoodCommandBiasAuto: callLater("battleStats", "applyMoodCommandBiasAuto"),
        commitCommandBias: callLater("battleStats", "commitCommandBias"),
        clampCommandBias: callLater("battleStats", "clampCommandBias"),
        getSushiaCastTime: callLater("battleStats", "getSushiaCastTime"),
        applyMultiHitMoodBonus: callLater("battleStats", "applyMultiHitMoodBonus"),
        addMoodGain: callLater("battleStats", "addMoodGain"),
        dealDamage: callLater("combatSystem", "dealDamage"),
        healUnit: callLater("combatSystem", "healUnit"),
        addTelegraph: callLater("battleRuntime", "addTelegraph"),
        addBurst: callLater("battleRuntime", "addBurst"),
        addFloat: callLater("battleRuntime", "addFloat"),
        addSpeech: callLater("battleRuntime", "addSpeech"),
        slashEffect: callLater("battleRuntime", "slashEffect"),
        addShield: callLater("combatSystem", "addShield"),
        startPlayerCast: callLater("battleRuntime", "startPlayerCast"),
        getHoveredPartyMember: callLater("battleRuntime", "getHoveredPartyMember"),
        cancelPlayerChannel: callLater("battleRuntime", "cancelPlayerChannel"),
        drawAimRangeCircle: callLater("renderer", "drawAimRangeCircle"),
        getBattleBounds: callLater("geometry", "getBattleBounds"),
        clampBattlePoint: callLater("geometry", "clampBattlePoint"),
        getSupportOrigin: callLater("battleRuntime", "getSupportOrigin"),
        isFieldUnit: callLater("battleRuntime", "isFieldUnit"),
        getFieldPartyMembers: callLater("battleRuntime", "getFieldPartyMembers"),
        getTargetablePartyMembers: callLater("battleRuntime", "getTargetablePartyMembers"),
      };
    }

    function createRenderContext() {
      return {
        canvasCtx: state.canvasCtx,
        TAU,
        TOWN_WIDTH,
        TOWN_HEIGHT,
        BATTLE_SPATIAL_SCALE,
        view: state.view,
        input: state.input,
        game: state.game,
        town: state.town,
        playerProfile: state.playerProfile,
        get profileNameInput() { return state.profileNameInput; },
        profileClickTargets: state.profileClickTargets,
        expandedStatusUnitIds: state.expandedStatusUnitIds,
        statusUiButtons: state.statusUiButtons,
        statusCardMetas: state.statusCardMetas,
        player: state.player,
        party: state.party,
        enemies: state.enemies,
        projectiles: state.projectiles,
        telegraphs: state.telegraphs,
        areas: state.areas,
        effects: state.effects,
        COLORS,
        ACTION_GAP: balance.actionGap,
        MOOD_BASELINE: balance.moodBaseline,
        ULTIMATE_KEYS,
        STATUS_FULL_NAMES,
        COMMAND_BIAS_CONFIGS: balance.commandBiasConfigs,
        RIHAS_PASSIVE_MAX_STACKS: balance.rihasPassiveMaxStacks,
        RIHAS_PASSIVE_STACK_DURATION: balance.rihasPassiveStackDuration,
        SUSHIA_PASSIVE_MAX_STACKS: balance.sushiaPassiveMaxStacks,
        SUSHIA_PASSIVE_STACK_DURATION: balance.sushiaPassiveStackDuration,
        BASE_CRIT_CHANCE: balance.baseCritChance,
        BASE_CRIT_DAMAGE: balance.baseCritDamage,
        skillSystem: systems.skillSystem,
        getPlayerFirstName: callLater("profileSystem", "getPlayerFirstName"),
        getPronounChoices: callLater("profileSystem", "getPronounChoices"),
        getProfileNameInputRect: callLater("profileSystem", "getProfileNameInputRect"),
        updateProfileNameInput: callLater("profileSystem", "updateProfileNameInput"),
        selectProfileGender: callLater("profileSystem", "selectProfileGender"),
        selectProfilePronoun: callLater("profileSystem", "selectProfilePronoun"),
        confirmProfileName: callLater("profileSystem", "confirmProfileName"),
        getTownBuilding: callLater("townController", "getTownBuilding"),
        getBattleBounds: callLater("geometry", "getBattleBounds"),
        updateTelegraphDynamic: callLater("battleRuntime", "updateTelegraphDynamic"),
        battlePx,
        clamp: callLater("geometry", "clamp"),
        dist: callLater("geometry", "dist"),
        distPoint: callLater("geometry", "distPoint"),
        angleTo: callLater("geometry", "angleTo"),
        angleDiff: callLater("geometry", "angleDiff"),
        isFieldUnit: callLater("battleRuntime", "isFieldUnit"),
        getFieldPartyMembers: callLater("battleRuntime", "getFieldPartyMembers"),
        getTargetablePartyMembers: callLater("battleRuntime", "getTargetablePartyMembers"),
        getSupportOrigin: callLater("battleRuntime", "getSupportOrigin"),
        getMoodOutgoingDamageMultiplier: callLater("battleStats", "getMoodOutgoingDamageMultiplier"),
        getMoodIncomingDamageMultiplier: callLater("battleStats", "getMoodIncomingDamageMultiplier"),
        getCommandOutgoingDamageMultiplier: callLater("battleStats", "getCommandOutgoingDamageMultiplier"),
        getCommandIncomingDamageMultiplier: callLater("battleStats", "getCommandIncomingDamageMultiplier"),
        getMoodCooldownMultiplier: callLater("battleStats", "getMoodCooldownMultiplier"),
        getMoodCooldown: callLater("battleStats", "getMoodCooldown"),
        getMoodCastTimeMultiplier: callLater("battleStats", "getMoodCastTimeMultiplier"),
        getSushiaCastTime: callLater("battleStats", "getSushiaCastTime"),
        getRihasPassiveDamageMultiplier: callLater("battleStats", "getRihasPassiveDamageMultiplier"),
        getRihasPassiveIncomingMultiplier: callLater("battleStats", "getRihasPassiveIncomingMultiplier"),
        getEffectiveDefense: callLater("battleStats", "getEffectiveDefense"),
        getEffectiveGuardChance: callLater("battleStats", "getEffectiveGuardChance"),
        getGuardDamageReductionRate: callLater("battleStats", "getGuardDamageReductionRate"),
        getMpRegenRate: callLater("battleStats", "getMpRegenRate"),
      };
    }

    function createScreenContext() {
      return {
        canvas: state.canvas,
        canvasCtx: state.canvasCtx,
        view: state.view,
        game: state.game,
        clampTownPlayer: callLater("geometry", "clampTownPlayer"),
        updateTownCamera: callLater("townController", "updateTownCamera"),
        clampAllUnits: callLater("geometry", "clampAllUnits"),
        updateProfileNameInput: callLater("profileSystem", "updateProfileNameInput"),
      };
    }

    function createStatusControlsContext() {
      return {
        expandedStatusUnitIds: state.expandedStatusUnitIds,
        statusUiButtons: state.statusUiButtons,
        startPlayerAim: callLater("skillSystem", "startPlayerAim"),
        usePlayerCommand: callLater("skillSystem", "usePlayerCommand"),
        triggerUltimate: callLater("skillSystem", "triggerUltimate"),
      };
    }

    function createGameLoopContext() {
      return {
        update: callLater("battleRuntime", "update"),
        draw: callLater("renderer", "draw"),
      };
    }

    function createInputContext() {
      return {
        canvas: state.canvas,
        input: state.input,
        game: state.game,
        town: state.town,
        player: state.player,
        playerProfile: state.playerProfile,
        resize: systems.screenSystem.resize,
        startGameLoop: systems.gameLoop.start,
        startTown: callLater("townController", "startTown"),
        handleProfileSetupKey: callLater("profileSystem", "handleProfileSetupKey"),
        handleProfileSetupClick: callLater("profileSystem", "handleProfileSetupClick"),
        advanceTownStory: callLater("townController", "advanceTownStory"),
        interactTown: callLater("townController", "interactTown"),
        closeTownPanel: callLater("townController", "closeTownPanel"),
        startPlayerAim: callLater("skillSystem", "startPlayerAim"),
        usePlayerCommand: callLater("skillSystem", "usePlayerCommand"),
        cancelPlayerAim: callLater("skillSystem", "cancelPlayerAim"),
        confirmPlayerAim: callLater("skillSystem", "confirmPlayerAim"),
        triggerUltimate: callLater("skillSystem", "triggerUltimate"),
        handleStatusUiClick: systems.statusControls.handleStatusUiClick,
        hasCommandBiasDrag: systems.statusControls.hasCommandBiasDrag,
        clearCommandBiasDrag: systems.statusControls.clearCommandBiasDrag,
        updateCommandBiasDrag: systems.statusControls.updateCommandBiasDrag,
      };
    }

    function createTownContext() {
      return {
        input: state.input,
        game: state.game,
        town: state.town,
        player: state.player,
        playerProfile: state.playerProfile,
        party: state.party,
        enemies: state.enemies,
        projectiles: state.projectiles,
        telegraphs: state.telegraphs,
        areas: state.areas,
        effects: state.effects,
        TOWN_DATA,
        TOWN_WIDTH,
        TOWN_HEIGHT,
        resetGame: callLater("battleSetup", "resetGame"),
        screenToTownPoint: callLater("renderer", "screenToTownPoint"),
        clampTownPlayer: callLater("geometry", "clampTownPlayer"),
        updateProfileNameInput: callLater("profileSystem", "updateProfileNameInput"),
        beginOpeningStory: callLater("profileSystem", "beginOpeningStory"),
        getPlayerFirstName: callLater("profileSystem", "getPlayerFirstName"),
        getMeetingStory: callLater("storyData", "getMeetingStory"),
      };
    }

    function createBattleSetupContext() {
      return {
        game: state.game,
        player: state.player,
        party: state.party,
        enemies: state.enemies,
        projectiles: state.projectiles,
        telegraphs: state.telegraphs,
        areas: state.areas,
        effects: state.effects,
        expandedStatusUnitIds: state.expandedStatusUnitIds,
        COLORS,
        battlePx,
        getBattleBounds: callLater("geometry", "getBattleBounds"),
        getSupportOrigin: callLater("battleRuntime", "getSupportOrigin"),
        makePartyMember: callLater("unitFactory", "makePartyMember"),
        makeEnemy: callLater("unitFactory", "makeEnemy"),
        clampBattlePoint: callLater("geometry", "clampBattlePoint"),
        clampAllUnits: callLater("geometry", "clampAllUnits"),
        addBurst: callLater("battleRuntime", "addBurst"),
        addFloat: callLater("battleRuntime", "addFloat"),
      };
    }

    function createBattleStatsContext() {
      return {
        COMMAND_BIAS_CONFIGS: balance.commandBiasConfigs,
        COMMAND_BIAS_AUTO_GRACE_ACTIONS: balance.commandBiasAutoGraceActions,
        MOOD_NATURAL_HP_STEPS: balance.moodNaturalHpSteps,
        MOOD_NATURAL_HP_BOTTOM_DELTA: balance.moodNaturalHpBottomDelta,
        MOOD_NO_DAMAGE_GAIN_BONUS_START: balance.moodNoDamageGainBonusStart,
        MOOD_NO_DAMAGE_GAIN_BONUS_MAX_TIME: balance.moodNoDamageGainBonusMaxTime,
        MOOD_NO_DAMAGE_GAIN_BONUS_MAX: balance.moodNoDamageGainBonusMax,
        MOOD_HIGH_GAIN_DAMPING_START: balance.moodHighGainDampingStart,
        MOOD_HIGH_GAIN_DAMPING_MULT: balance.moodHighGainDampingMult,
        MOOD_DISTANCE_BONUS_START: battlePx(balance.moodDistanceBonusStart),
        MOOD_DISTANCE_BONUS_END: battlePx(balance.moodDistanceBonusEnd),
        MOOD_DISTANCE_BONUS_MAX: balance.moodDistanceBonusMax,
        MOOD_MULTI_HIT_MIN: balance.moodMultiHitMin,
        MOOD_MULTI_HIT_BASE: balance.moodMultiHitBase,
        DEFAULT_MP_REGEN_RATE: balance.defaultMpRegenRate,
        GUARD_DAMAGE_MULTIPLIER: balance.guardDamageMultiplier,
        GUARD_OVERFLOW_REDUCTION_RATE: balance.guardOverflowReductionRate,
        GUARD_MAX_DAMAGE_REDUCTION: balance.guardMaxDamageReduction,
        RIHAS_PASSIVE_MAX_STACKS: balance.rihasPassiveMaxStacks,
        RIHAS_PASSIVE_STACK_DURATION: balance.rihasPassiveStackDuration,
        RIHAS_PASSIVE_STACK_COOLDOWN: balance.rihasPassiveStackCooldown,
        RIHAS_PASSIVE_MAX_DAMAGE_BONUS: balance.rihasPassiveMaxDamageBonus,
        RIHAS_PASSIVE_MAX_DAMAGE_REDUCTION: balance.rihasPassiveMaxDamageReduction,
        clamp: callLater("geometry", "clamp"),
        dist: callLater("geometry", "dist"),
      };
    }

    function createCombatContext() {
      return {
        player: state.player,
        COLORS,
        ACTION_GAP: balance.actionGap,
        BASE_CRIT_CHANCE: balance.baseCritChance,
        BASE_CRIT_DAMAGE: balance.baseCritDamage,
        SUSHIA_PASSIVE_MAX_STACKS: balance.sushiaPassiveMaxStacks,
        SUSHIA_PASSIVE_STACK_DURATION: balance.sushiaPassiveStackDuration,
        SUSHIA_PASSIVE_STACK_COOLDOWN: balance.sushiaPassiveStackCooldown,
        MOOD_DAMAGE_DEALT_RATE: balance.moodDamageDealtRate,
        MOOD_DAMAGE_DEALT_MULT: balance.moodDamageDealtMult,
        MOOD_DAMAGE_TAKEN_RATE: balance.moodDamageTakenRate,
        MOOD_HEAL_RATE: balance.moodHealRate,
        MOOD_QUICK_HEAL_BONUS: balance.moodQuickHealBonus,
        MOOD_EVENT_MULT: balance.moodEventMult,
        MOOD_KILL_BONUS: balance.moodKillBonus,
        clamp: callLater("geometry", "clamp"),
        addFloat: callLater("battleRuntime", "addFloat"),
        addBurst: callLater("battleRuntime", "addBurst"),
        cancelPlayerChannel: callLater("battleRuntime", "cancelPlayerChannel"),
        cancelPlayerCast: callLater("battleRuntime", "cancelPlayerCast"),
        getMoodOutgoingDamageMultiplier: callLater("battleStats", "getMoodOutgoingDamageMultiplier"),
        getMoodIncomingDamageMultiplier: callLater("battleStats", "getMoodIncomingDamageMultiplier"),
        getCommandOutgoingDamageMultiplier: callLater("battleStats", "getCommandOutgoingDamageMultiplier"),
        getCommandIncomingDamageMultiplier: callLater("battleStats", "getCommandIncomingDamageMultiplier"),
        getRihasPassiveDamageMultiplier: callLater("battleStats", "getRihasPassiveDamageMultiplier"),
        getRihasPassiveIncomingMultiplier: callLater("battleStats", "getRihasPassiveIncomingMultiplier"),
        getGuardDamageMultiplier: callLater("battleStats", "getGuardDamageMultiplier"),
        getEffectiveGuardChance: callLater("battleStats", "getEffectiveGuardChance"),
        getEffectiveDefense: callLater("battleStats", "getEffectiveDefense"),
        addRihasPassiveStack: callLater("battleStats", "addRihasPassiveStack"),
        getMoodDistanceMultiplier: callLater("battleStats", "getMoodDistanceMultiplier"),
        getHpRatio: callLater("battleStats", "getHpRatio"),
        getMoodReferenceHp: callLater("battleStats", "getMoodReferenceHp"),
        addMoodGain: callLater("battleStats", "addMoodGain"),
        addMoodLoss: callLater("battleStats", "addMoodLoss"),
      };
    }

    function createBattleAiContext() {
      return {
        party: state.party,
        player: state.player,
        enemies: state.enemies,
        telegraphs: state.telegraphs,
        skillSystem: systems.skillSystem,
        MOOD_BASELINE: balance.moodBaseline,
        TELEGRAPH_AVOID_PADDING: battlePx(balance.telegraphAvoidPadding),
        TELEGRAPH_AVOID_SPEED_MULT: balance.telegraphAvoidSpeedMult,
        battlePx,
        clamp: callLater("geometry", "clamp"),
        dist: callLater("geometry", "dist"),
        distPoint: callLater("geometry", "distPoint"),
        normalize: callLater("geometry", "normalize"),
        angleDiff: callLater("geometry", "angleDiff"),
        nearestAlive: callLater("geometry", "nearestAlive"),
        clampUnit: callLater("geometry", "clampUnit"),
        updateTelegraphDynamic: callLater("battleRuntime", "updateTelegraphDynamic"),
        getTargetablePartyMembers: callLater("battleRuntime", "getTargetablePartyMembers"),
        triggerUltimate: callLater("skillSystem", "triggerUltimate"),
        setActionCooldown: callLater("skillSystem", "setActionCooldown"),
      };
    }

    function createBattleRuntimeContext() {
      return {
        view: state.view,
        input: state.input,
        game: state.game,
        player: state.player,
        party: state.party,
        enemies: state.enemies,
        projectiles: state.projectiles,
        telegraphs: state.telegraphs,
        areas: state.areas,
        effects: state.effects,
        skillSystem: systems.skillSystem,
        ACTION_GAP: balance.actionGap,
        SELF_HEAL_DELAY: balance.selfHealDelay,
        SELF_HEAL_LIMIT: balance.selfHealLimit,
        SELF_HEAL_MP_PER_SEC: balance.selfHealMpPerSec,
        SELF_HEAL_HP_PER_SEC: balance.selfHealHpPerSec,
        INTERRUPTED_CAST_COOLDOWN_REDUCTION: balance.interruptedCastCooldownReduction,
        battlePx,
        clamp: callLater("geometry", "clamp"),
        distPoint: callLater("geometry", "distPoint"),
        getBattleBounds: callLater("geometry", "getBattleBounds"),
        updateTown: callLater("townController", "updateTown"),
        updatePartyAi: callLater("battleAi", "updatePartyAi"),
        updateEnemyAi: callLater("battleAi", "updateEnemyAi"),
        separateUnits: callLater("geometry", "separateUnits"),
        spawnRearVanguardWave: callLater("battleSetup", "spawnRearVanguardWave"),
        regenerateMp: callLater("battleStats", "regenerateMp"),
        getMoodNaturalDelta: callLater("battleStats", "getMoodNaturalDelta"),
        applyCommandMoodDelta: callLater("battleStats", "applyCommandMoodDelta"),
        applyMoodHighGainDamping: callLater("battleStats", "applyMoodHighGainDamping"),
        updateDelayedDamage: callLater("combatSystem", "updateDelayedDamage"),
        updateRihasPassiveStacks: callLater("battleStats", "updateRihasPassiveStacks"),
        dealDamage: callLater("combatSystem", "dealDamage"),
        healUnit: callLater("combatSystem", "healUnit"),
      };
    }

    return {
      createGeometryContext,
      createStoryContext,
      createProfileContext,
      createUnitFactoryContext,
      createSkillContext,
      createRenderContext,
      createScreenContext,
      createStatusControlsContext,
      createGameLoopContext,
      createInputContext,
      createTownContext,
      createBattleSetupContext,
      createBattleStatsContext,
      createCombatContext,
      createBattleAiContext,
      createBattleRuntimeContext,
    };
  };
})();
