(() => {
  "use strict";

  window.createHealerBattleSetup = function createHealerBattleSetup(context) {
    const {
      game,
      player,
      party,
      enemies,
      projectiles,
      telegraphs,
      areas,
      effects,
      expandedStatusUnitIds,
      COLORS,
      battlePx,
      getBattleBounds,
      getSupportOrigin,
      makePartyMember,
      makeEnemy,
      clampBattlePoint,
      clampAllUnits,
      addBurst,
      addFloat,
    } = context;

    function resetGame() {
      projectiles.length = 0;
      telegraphs.length = 0;
      areas.length = 0;
      effects.length = 0;
      expandedStatusUnitIds.clear();
      game.state = "playing";
      game.time = 0;
      game.stageClearTimer = 0;
      game.reinforcementsSpawned = false;
      game.message = "依頼: 魔物を全滅させる";
      game.messageTimer = 4;

      const bounds = getBattleBounds();
      const supportOrigin = getSupportOrigin();
      const cx = bounds.left + bounds.width * 0.33;
      const cy = bounds.centerY;

      Object.assign(player, {
        x: supportOrigin.x,
        y: supportOrigin.y,
        hp: player.maxHp,
        mp: player.maxMp,
        shield: 0,
        shieldTimer: 0,
        ult: 0,
        dead: false,
        cds: {},
        channel: null,
        actionLock: 0,
        actionTotal: 0,
        hurt: 0,
        guardFlash: 0,
        noDamage: 999,
        cast: null,
        aim: null,
        selfHealFloat: 0,
        delayedDamageQueue: [],
        field: false,
        targetable: false,
        collidable: false,
      });

      const ulpes = makePartyMember("ulpes");
      const rihas = makePartyMember("rihas");
      const sushia = makePartyMember("sushia");

      Object.assign(ulpes, { x: cx + battlePx(28), y: cy - battlePx(72) });
      Object.assign(rihas, { x: cx + battlePx(62), y: cy + battlePx(55) });
      Object.assign(sushia, { x: cx - battlePx(28), y: cy - battlePx(6) });
      party.length = 0;
      party.push(player, ulpes, rihas, sushia);

      const startX = Math.min(bounds.right - battlePx(120), bounds.left + bounds.width * 0.72);
      const startY = bounds.centerY;
      const enemySpread = Math.min(battlePx(150), bounds.height * 0.32);
      enemies.length = 0;
      enemies.push(
        makeEnemy("魔物A", startX, startY - enemySpread, "brute"),
        makeEnemy("魔物B", startX + battlePx(72), startY - enemySpread * 0.53, "skirmisher"),
        makeEnemy("魔物C", startX + battlePx(18), startY + battlePx(5), "brute"),
        makeEnemy("魔物D", startX + battlePx(92), startY + enemySpread * 0.59, "skirmisher"),
        makeEnemy("小術師A", startX + battlePx(205), startY - enemySpread * 0.64, "caster"),
        makeEnemy("小術師B", startX + battlePx(220), startY + enemySpread * 0.53, "caster"),
        makeEnemy("大魔物", startX + battlePx(150), startY + battlePx(4), "elite"),
      );

      clampAllUnits();
    }

    function spawnRearVanguardWave() {
      const bounds = getBattleBounds();
      const spawnX = bounds.left + battlePx(34);
      const centerY = bounds.centerY;
      const spread = Math.min(battlePx(92), bounds.height * 0.24);
      const wave = [
        makeEnemy("小魔物A", spawnX, centerY - spread, "smallVanguard"),
        makeEnemy("小魔物B", spawnX - battlePx(8), centerY, "smallVanguard"),
        makeEnemy("小魔物C", spawnX, centerY + spread, "smallVanguard"),
      ];

      for (const enemy of wave) {
        const point = clampBattlePoint(enemy.x, enemy.y, enemy.radius);
        enemy.x = point.x;
        enemy.y = point.y;
        enemies.push(enemy);
        addBurst(enemy.x, enemy.y, enemy.radius * 3.2, "rgba(230,151,99,0.28)");
      }

      addFloat("増援!", spawnX + battlePx(46), centerY - spread - battlePx(28), COLORS.enemy);
      game.reinforcementsSpawned = true;
      game.message = "後方から増援!";
      game.messageTimer = 4;
    }

    return {
      resetGame,
      spawnRearVanguardWave,
    };
  };
})();
