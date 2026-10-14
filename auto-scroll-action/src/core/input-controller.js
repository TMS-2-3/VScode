import { PLAYER_ACTION } from "../shared/contracts.js";

const JUMP_KEY_CODES = new Set(["KeyW", "ArrowUp"]);
const MOVE_DOWN_KEY_CODES = new Set(["KeyS", "ArrowDown"]);

export function createInputController(onAction) {
  function onKeyDown(event) {
    if (event.code === "Space") {
      event.preventDefault();

      if (!event.repeat) {
        onAction(PLAYER_ACTION.DUCK, true);
      }

      return;
    }

    const isJumpKey = JUMP_KEY_CODES.has(event.code);
    const isMoveDownKey = MOVE_DOWN_KEY_CODES.has(event.code);

    if (isJumpKey || isMoveDownKey) {
      event.preventDefault();
    }

    if (event.repeat) {
      return;
    }

    if (isJumpKey) {
      onAction(PLAYER_ACTION.JUMP);
    }

    if (isMoveDownKey) {
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
