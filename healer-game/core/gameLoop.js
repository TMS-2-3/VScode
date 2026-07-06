(() => {
  "use strict";

  window.createHealerGameLoop = function createHealerGameLoop(context) {
    const {
      update,
      draw,
      game,
    } = context;

    let lastTime = performance.now();
    let lastLoopError = null;
    let lastLoopErrorAt = 0;
    let loopErrorCount = 0;
    let lastSlowFrameLogAt = 0;
    const SLOW_FRAME_WARNING_MS = 120;

    function reportLoopError(error) {
      lastLoopError = error;
      loopErrorCount += 1;
      window.healerGameLastLoopError = error;
      const now = performance.now();
      if (now - lastLoopErrorAt < 1000) {
        return;
      }
      lastLoopErrorAt = now;
      console.error("[healer-game] game loop error", error);
    }

    function reportSlowFrame(frame) {
      window.healerGameLastSlowFrame = frame;
      const now = performance.now();
      if (now - lastSlowFrameLogAt < 1000) {
        return;
      }
      lastSlowFrameLogAt = now;
      console.warn("[healer-game] slow frame", frame);
    }

    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      const frameStartedAt = performance.now();
      let updateMs = 0;
      let drawMs = 0;
      try {
        const updateStartedAt = performance.now();
        update(dt);
        updateMs = performance.now() - updateStartedAt;
        const drawStartedAt = performance.now();
        draw();
        drawMs = performance.now() - drawStartedAt;
      } catch (error) {
        reportLoopError(error);
      } finally {
        const totalMs = performance.now() - frameStartedAt;
        if (totalMs >= SLOW_FRAME_WARNING_MS) {
          reportSlowFrame({
            totalMs: Math.round(totalMs * 10) / 10,
            updateMs: Math.round(updateMs * 10) / 10,
            drawMs: Math.round(drawMs * 10) / 10,
            dt: Math.round(dt * 1000) / 1000,
            state: game && game.state,
            time: game && Number.isFinite(game.time) ? Math.round(game.time * 10) / 10 : null,
          });
        }
        requestAnimationFrame(loop);
      }
    }

    function start() {
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }

    return {
      start,
      loop,
      getLastLoopError: () => lastLoopError,
      getLoopErrorCount: () => loopErrorCount,
      getLastSlowFrame: () => window.healerGameLastSlowFrame || null,
    };
  };
})();
