import { PLAYER_ACTION } from "../shared/contracts.js";

export function createInputController(onAction) {
  function onKeyDown(event) {
    if (event.code === "Space") {
      event.preventDefault();

      if (!event.repeat) {
        onAction(PLAYER_ACTION.DUCK, true);
      }

      return;
    }

    if (event.repeat) {
      return;
    }

    if (event.code === "KeyW") {
      event.preventDefault();
      onAction(PLAYER_ACTION.JUMP);
    }

    if (event.code === "KeyS") {
      event.preventDefault();
      onAction(PLAYER_ACTION.MOVE_DOWN);
    }
  }

  function onKeyUp(event) {
    if (event.code === "Space") {
      event.preventDefault();
      onAction(PLAYER_ACTION.DUCK, false);
    }
  }

  function releaseDuck() {
    onAction(PLAYER_ACTION.DUCK, false);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", releaseDuck);

  return {
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseDuck);
    },
  };
}
