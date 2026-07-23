(() => {
  "use strict";

  window.createHealerGameLoop = function createHealerGameLoop(context) {
    const {
      config,
      update,
      draw,
      game,
    } = context;

    const DEFAULT_FPS_LIMIT = Number.isFinite(config && config.defaultFpsLimit) ? config.defaultFpsLimit : 60;
    const FPS_LIMIT_OPTIONS = Array.isArray(config && config.fpsLimitOptions) && config.fpsLimitOptions.length
      ? config.fpsLimitOptions
      : [15, 30, 45, 60, 90, 120, 140, 160, 180, 210, "unlimited"];
    const FRAME_SKIP_TOLERANCE_MS = 0.25;
    const BASE_MAX_DT = 0.033;

    let lastTime = performance.now();
    let lastRenderTime = lastTime;
    let lastLoopError = null;
    let lastLoopErrorAt = 0;
    let loopErrorCount = 0;
    let lastSlowFrameLogAt = 0;
    const SLOW_FRAME_WARNING_MS = 120;

    function normalizeFpsLimit(value) {
      if (value === "unlimited" || value === "無制限") {
        return "unlimited";
      }
      const numeric = Math.floor(Number(value));
      if (FPS_LIMIT_OPTIONS.some((option) => option !== "unlimited" && Number(option) === numeric)) {
        return numeric;
      }
      return DEFAULT_FPS_LIMIT;
    }

    function getFpsLimit() {
      if (!game.settings || typeof game.settings !== "object") {
        game.settings = {};
      }
      game.settings.fpsLimit = normalizeFpsLimit(game.settings.fpsLimit);
      return game.settings.fpsLimit;
    }

    function getFrameIntervalMs() {
      const fpsLimit = getFpsLimit();
      return fpsLimit === "unlimited" ? 0 : 1000 / Math.max(1, fpsLimit);
    }

    function getMaxDt(frameIntervalMs) {
      if (!Number.isFinite(frameIntervalMs) || frameIntervalMs <= 0) {
        return BASE_MAX_DT;
      }
      return Math.max(BASE_MAX_DT, frameIntervalMs / 1000 + 0.004);
    }

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
      const frameIntervalMs = getFrameIntervalMs();
      const frameElapsedMs = now - lastRenderTime;
      if (frameIntervalMs > 0 && frameElapsedMs + FRAME_SKIP_TOLERANCE_MS < frameIntervalMs) {
        requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min((now - lastTime) / 1000, getMaxDt(frameIntervalMs));
      lastTime = now;
      lastRenderTime = frameIntervalMs > 0
        ? now - (frameElapsedMs % frameIntervalMs)
        : now;
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
      lastRenderTime = lastTime;
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
