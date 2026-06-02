(() => {
  "use strict";

  window.createHealerInputSystem = function createHealerInputSystem(context) {
    const {
      canvas,
      input,
      game,
      town,
      player,
      playerProfile,
      resize,
      startGameLoop,
      startTown,
      handleProfileSetupKey,
      handleProfileSetupClick,
      advanceTownStory,
      interactTown,
      closeTownPanel,
      startPlayerAim,
      usePlayerCommand,
      cancelPlayerAim,
      confirmPlayerAim,
      triggerUltimate,
      handleStatusUiClick,
      hasCommandBiasDrag,
      clearCommandBiasDrag,
      updateCommandBiasDrag,
    } = context;

    function attach() {
      window.addEventListener("resize", resize);
      resize();
      startTown();
      startGameLoop();

      window.addEventListener("keydown", handleKeyDown);
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("mouseup", handleMouseUp);
      canvas.addEventListener("mouseleave", handleMouseLeave);
      canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
      });
    }

    function handleKeyDown(event) {
      const key = event.key === " " ? "space" : event.key.toLowerCase();

      if (["a", "s", "d", "g", "h", "j", "k", "r", "e", "enter", "escape", "space", "1", "2", "3", "4"].includes(key)) {
        event.preventDefault();
      }
      if (event.repeat) {
        return;
      }

      if (game.state === "town") {
        if (!playerProfile.done) {
          handleProfileSetupKey(key);
          return;
        }
        if (town.story) {
          if (["e", "space", "enter"].includes(key)) {
            advanceTownStory();
          }
          return;
        }
        if (town.panel && town.panel.action === "battleGuide" && ["e", "space", "enter"].includes(key)) {
          interactTown();
          return;
        }
        if (key === "e") {
          interactTown();
        } else if (key === "escape") {
          closeTownPanel();
        }
        return;
      }

      if (game.state !== "playing") {
        if (key === "r") {
          startTown();
        }
        return;
      }

      if (key === "a") {
        startPlayerAim("attack");
      } else if (key === "s") {
        startPlayerAim("heal");
      } else if (key === "d") {
        startPlayerAim("shield");
      } else if (key === "g") {
        startPlayerAim("commandDefend");
      } else if (key === "h") {
        startPlayerAim("commandAttack");
      } else if (key === "j") {
        usePlayerCommand("commandDefendAll");
      } else if (key === "k") {
        usePlayerCommand("commandAttackAll");
      } else if (key === "escape") {
        cancelPlayerAim();
      } else if (key === "1") {
        triggerUltimate("ulpes");
      } else if (key === "2") {
        triggerUltimate("rihas");
      } else if (key === "3") {
        triggerUltimate("sushia");
      } else if (key === "4") {
        triggerUltimate("finald");
      }
    }

    function handleMouseMove(event) {
      setMouseFromEvent(event);
      if (hasCommandBiasDrag()) {
        updateCommandBiasDrag(input.mouse.x);
      }
    }

    function handleMouseDown(event) {
      event.preventDefault();
      setMouseFromEvent(event);
      if (game.state === "town") {
        if (!playerProfile.done) {
          handleProfileSetupClick(input.mouse.x, input.mouse.y);
          return;
        }
        if (town.story && event.button === 0) {
          advanceTownStory();
          return;
        }
        if (town.panel && town.panel.action === "battleGuide" && event.button === 0) {
          interactTown();
          return;
        }
        if (event.button === 0) {
          interactTown();
        }
        return;
      }
      if (game.state !== "playing") {
        return;
      }
      if (event.button === 0) {
        if (handleStatusUiClick(input.mouse.x, input.mouse.y)) {
          return;
        }
        if (player.aim) {
          confirmPlayerAim();
        }
      }
      if (event.button === 2) {
        input.mouse.right = true;
        if (player.aim) {
          cancelPlayerAim();
        }
      }
    }

    function handleMouseUp(event) {
      if (event.button === 0) {
        clearCommandBiasDrag();
      }
      if (event.button === 2) {
        input.mouse.right = false;
      }
    }

    function handleMouseLeave() {
      input.mouse.right = false;
      clearCommandBiasDrag();
    }

    function setMouseFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      input.mouse.x = event.clientX - rect.left;
      input.mouse.y = event.clientY - rect.top;
    }

    return {
      attach,
      setMouseFromEvent,
    };
  };
})();
