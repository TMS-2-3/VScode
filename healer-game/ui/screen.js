(() => {
  "use strict";

  window.createHealerScreenSystem = function createHealerScreenSystem(context) {
    const {
      canvas,
      canvasCtx: ctx,
      config,
      view,
      game,
      clampTownPlayer,
      updateTownCamera,
      clampAllUnits,
      updateProfileNameInput,
    } = context;

    function resize() {
      const baseW = Math.max(1, Math.floor(Number(view.baseW) || 1920));
      const baseH = Math.max(1, Math.floor(Number(view.baseH) || 1080));
      const screenW = Math.max(1, Math.floor(window.innerWidth || baseW));
      const screenH = Math.max(1, Math.floor(window.innerHeight || baseH));
      const fitScale = Math.max(0.01, Math.min(screenW / baseW, screenH / baseH));
      const smallScreenZoom = Math.max(1, Number(config && config.smallScreenDefaultZoom) || 1);
      const screenZoom = fitScale < 1 ? smallScreenZoom : 1;
      const viewW = baseW / screenZoom;
      const viewH = baseH / screenZoom;
      const displayW = Math.max(1, Math.round(baseW * fitScale));
      const displayH = Math.max(1, Math.round(baseH * fitScale));
      const displayScale = displayW / viewW;
      view.w = viewW;
      view.h = viewH;
      view.baseW = baseW;
      view.baseH = baseH;
      view.screenW = screenW;
      view.screenH = screenH;
      view.fitScale = fitScale;
      view.screenZoom = screenZoom;
      view.displayScale = displayScale;
      view.displayW = displayW;
      view.displayH = displayH;
      view.displayX = Math.round((screenW - displayW) / 2);
      view.displayY = Math.round((screenH - displayH) / 2);
      view.dpr = Math.min(window.devicePixelRatio || 1, 2);
      const renderW = Math.max(1, Math.floor(displayW * view.dpr));
      const renderH = Math.max(1, Math.floor(displayH * view.dpr));
      view.renderScale = Math.min(renderW / viewW, renderH / viewH);
      canvas.width = renderW;
      canvas.height = renderH;
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;
      ctx.setTransform(view.renderScale, 0, 0, view.renderScale, 0, 0);

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
