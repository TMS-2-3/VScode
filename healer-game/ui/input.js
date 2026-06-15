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
      PLAYER_SKILL_SLOT_KEYS,
      ITEM_SLOT_KEYS,
      getPanelSkills,
      startPlayerAim,
      usePlayerCommand,
      cancelPlayerAim,
      confirmPlayerAim,
      triggerUltimate,
      useItemSlot,
      cancelItemAim,
      confirmItemAim,
      handleStatusUiClick,
      togglePriorityTargetAt,
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

    const playerSkillSlotKeys = Array.isArray(PLAYER_SKILL_SLOT_KEYS) && PLAYER_SKILL_SLOT_KEYS.length
      ? PLAYER_SKILL_SLOT_KEYS.map((key) => String(key).toLowerCase())
      : ["q", "e", "r", "f", "g"];
    const itemSlotKeys = Array.isArray(ITEM_SLOT_KEYS) && ITEM_SLOT_KEYS.length
      ? ITEM_SLOT_KEYS.map((key) => String(key).toLowerCase())
      : ["c", "v", "b"];

    function handleKeyDown(event) {
      const key = event.key === " " ? "space" : event.key.toLowerCase();

      if ([...playerSkillSlotKeys, ...itemSlotKeys, "enter", "escape", "space", "1", "2", "3", "4"].includes(key)) {
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

      if (key === "space") {
        game.skillPage = game.skillPage === "page2" ? "page1" : "page2";
        cancelPlayerAim();
        cancelItemAim();
        return;
      }
      if (key === "escape") {
        cancelPlayerAim();
        cancelItemAim();
        return;
      }
      if (key === "1") {
        cancelItemAim();
        triggerUltimate("ulpes");
        return;
      }
      if (key === "2") {
        cancelItemAim();
        triggerUltimate("rihas");
        return;
      }
      if (key === "3") {
        cancelItemAim();
        triggerUltimate("sushia");
        return;
      }
      if (key === "4") {
        cancelItemAim();
        triggerUltimate("finald");
        return;
      }

      const itemSlotIndex = itemSlotKeys.indexOf(key);
      if (itemSlotIndex >= 0) {
        useItemSlot(itemSlotIndex);
        return;
      }

      const slotIndex = playerSkillSlotKeys.indexOf(key);
      if (slotIndex >= 0) {
        usePlayerSkillSlot(slotIndex);
      }
    }

    function usePlayerSkillSlot(slotIndex) {
      const pageIndex = game.skillPage === "page2" ? 1 : 0;
      const skills = getPanelSkills(player, pageIndex);
      const skill = skills[slotIndex];
      if (!skill) {
        return;
      }
      if (skill.gauge) {
        cancelItemAim();
        triggerUltimate("finald");
      } else if (skill.command) {
        cancelItemAim();
        if (skill.targeted) {
          startPlayerAim(skill.key);
        } else {
          usePlayerCommand(skill.key);
        }
      } else {
        cancelItemAim();
        startPlayerAim(skill.key);
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
          interactTown({ pointer: true });
          return;
        }
        if (event.button === 0) {
          interactTown({ pointer: true });
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
        if (player.itemAim) {
          confirmItemAim();
          return;
        }
        if (player.aim) {
          confirmPlayerAim();
          return;
        }
        if (togglePriorityTargetAt(input.mouse.x, input.mouse.y)) {
          return;
        }
      }
      if (event.button === 2) {
        input.mouse.right = true;
        if (player.aim || player.itemAim) {
          cancelPlayerAim();
          cancelItemAim();
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
