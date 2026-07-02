(() => {
  "use strict";

  window.createHealerStatusControls = function createHealerStatusControls(context) {
    const {
      game,
      expandedStatusUnitIds,
      statusUiButtons,
      startPlayerAim,
      usePlayerCommand,
      cancelPlayerAim,
      isPlayerControlLocked,
      triggerUltimate,
      useItemSlot,
      cancelItemAim,
    } = context;

    function handleStatusUiClick(x, y) {
      for (let i = statusUiButtons.length - 1; i >= 0; i -= 1) {
        const button = statusUiButtons[i];
        if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
          if (isLockedBattleControlButton(button)) {
            cancelPlayerAim();
            cancelItemAim();
            return true;
          }
          if (button.action === "close") {
            expandedStatusUnitIds.delete(button.unitId);
          } else if (button.action === "toggle") {
            if (expandedStatusUnitIds.has(button.unitId)) {
              expandedStatusUnitIds.delete(button.unitId);
            } else {
              expandedStatusUnitIds.add(button.unitId);
            }
          } else if (button.action === "toggleSkillPage") {
            game.skillPage = game.skillPage === "page2" ? "page1" : "page2";
            cancelPlayerAim();
            cancelItemAim();
          } else if (button.action === "playerCommand") {
            cancelItemAim();
            if (button.targeted) {
              startPlayerAim(button.skillKey);
            } else {
              usePlayerCommand(button.skillKey);
            }
          } else if (button.action === "itemSlot") {
            useItemSlot(button.slotIndex);
          } else if (button.action === "unitUltimate") {
            cancelItemAim();
            triggerUltimate(button.unitId);
          } else if (button.action === "playerSkill") {
            cancelItemAim();
            if (button.ultimate) {
              triggerUltimate("finald");
            } else {
              startPlayerAim(button.skillKey);
            }
          }
          return true;
        }
      }
      return false;
    }

    function isLockedBattleControlButton(button) {
      if (!button || !isPlayerControlLocked || !isPlayerControlLocked()) {
        return false;
      }
      return button.action === "toggleSkillPage"
        || button.action === "playerCommand"
        || button.action === "itemSlot"
        || button.action === "unitUltimate"
        || button.action === "playerSkill";
    }

    function hasCommandBiasDrag() {
      return false;
    }

    function clearCommandBiasDrag() {
    }

    function updateCommandBiasDrag(x) {
    }

    return {
      handleStatusUiClick,
      hasCommandBiasDrag,
      clearCommandBiasDrag,
      updateCommandBiasDrag,
    };
  };
})();
