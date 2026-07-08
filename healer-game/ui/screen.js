(() => {
  "use strict";

  window.createHealerScreenSystem = function createHealerScreenSystem(context) {
    const {
      canvas,
      canvasCtx: ctx,
      view,
      game,
      clampTownPlayer,
      updateTownCamera,
      clampAllUnits,
      updateProfileNameInput,
    } = context;

    function resize() {
      view.w = window.innerWidth;
      view.h = window.innerHeight;
      view.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(view.w * view.dpr);
      canvas.height = Math.floor(view.h * view.dpr);
      canvas.style.width = `${view.w}px`;
      canvas.style.height = `${view.h}px`;
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);

      if (game.state === "town") {
        clampTownPlayer();
        updateTownCamera();
      } else if (game.state === "playing") {
        clampAllUnits();
      }
      updateProfileNameInput();
    }

    return {
      resize,
    };
  };
})();
