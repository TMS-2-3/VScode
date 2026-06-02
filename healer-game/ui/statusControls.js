(() => {
  "use strict";

  window.createHealerStatusControls = function createHealerStatusControls(context) {
    const {
      expandedStatusUnitIds,
      statusUiButtons,
      startPlayerAim,
      usePlayerCommand,
      triggerUltimate,
    } = context;

    function handleStatusUiClick(x, y) {
      for (let i = statusUiButtons.length - 1; i >= 0; i -= 1) {
        const button = statusUiButtons[i];
        if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
          if (button.action === "close") {
            expandedStatusUnitIds.delete(button.unitId);
          } else if (button.action === "toggle") {
            if (expandedStatusUnitIds.has(button.unitId)) {
              expandedStatusUnitIds.delete(button.unitId);
            } else {
              expandedStatusUnitIds.add(button.unitId);
            }
          } else if (button.action === "playerCommand") {
            if (button.targeted) {
              startPlayerAim(button.skillKey);
            } else {
              usePlayerCommand(button.skillKey);
            }
          } else if (button.action === "playerSkill") {
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
