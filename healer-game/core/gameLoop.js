(() => {
  "use strict";

  window.createHealerGameLoop = function createHealerGameLoop(context) {
    const {
      update,
      draw,
    } = context;

    let lastTime = performance.now();

    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.033);
      lastTime = now;
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }

    function start() {
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }

    return {
      start,
      loop,
    };
  };
})();
