const DURATION_SECONDS = 3.6;
const REDUCED_MOTION_DURATION_SECONDS = 1.4;
const SPRITE_SIZE = 32;
const COLORS = ["#ffc849", "#ff8754", "#f582bc", "#68dfcd", "#b8a0ff", "#fff5cf"];

export function createStampCelebration(canvas) {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Stamp celebration canvas is unavailable.");
  }

  const sprites = new Map();
  let animationFrameId = null;
  let width = 1;
  let height = 1;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(bounds.width));
    height = Math.max(1, Math.round(bounds.height));
    // This short foreground effect uses one canvas pixel per CSS pixel.
    canvas.width = width;
    canvas.height = height;
  }

  function getSprite(shape, color) {
    const key = `${shape}:${color}`;
    if (sprites.has(key)) {
      return sprites.get(key);
    }

    const sprite = canvas.ownerDocument.createElement("canvas");
    sprite.width = SPRITE_SIZE;
    sprite.height = SPRITE_SIZE;
    const painter = sprite.getContext("2d");
    if (!painter) {
      return null;
    }

    painter.fillStyle = color;
    painter.strokeStyle = color;
    painter.lineWidth = 4;
    painter.lineCap = "round";
    if (shape === 0) {
      painter.fillRect(7, 10, 18, 12);
      painter.fillStyle = "#ffffff99";
      painter.fillRect(9, 11, 4, 10);
    } else if (shape === 1) {
      painter.beginPath();
      for (let point = 0; point < 10; point += 1) {
        const angle = point * Math.PI / 5 - Math.PI / 2;
        const radius = point % 2 === 0 ? 13 : 6;
        const x = 16 + Math.cos(angle) * radius;
        const y = 16 + Math.sin(angle) * radius;
        if (point === 0) painter.moveTo(x, y);
        else painter.lineTo(x, y);
      }
      painter.closePath();
      painter.fill();
    } else {
      painter.beginPath();
      painter.moveTo(10, 3);
      painter.bezierCurveTo(30, 5, 4, 15, 20, 18);
      painter.bezierCurveTo(34, 22, 8, 26, 18, 29);
      painter.stroke();
    }
    sprites.set(key, sprite);
    return sprite;
  }

  function reset() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    context.clearRect(0, 0, width, height);
    canvas.hidden = true;
  }

  function start() {
    reset();
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? REDUCED_MOTION_DURATION_SECONDS : DURATION_SECONDS;
    canvas.hidden = false;
    resize();
    const count = reducedMotion ? 30 : width < 600 ? 90 : 144;
    const size = Math.max(9, Math.min(19, Math.min(width, height) * 0.026));
    const pieces = Array.from({ length: count }, (_, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      return {
        x: direction === 1 ? 0.1 : 0.9,
        delay: Math.random() * 0.16,
        velocityX: direction * (0.14 + Math.random() * 0.24),
        velocityY: -(reducedMotion ? 0.5 + Math.random() * 0.2 : 1.04 + Math.random() * 0.36),
        gravity: reducedMotion ? 1.6 : 0.9,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 10,
        size: size * (0.7 + Math.random() * 0.6),
        sprite: getSprite(index % 3, COLORS[Math.floor(index / 3) % COLORS.length]),
      };
    });
    let startTime = null;

    function animate(currentTime) {
      if (startTime === null) startTime = currentTime;
      const elapsed = (currentTime - startTime) / 1000;
      if (elapsed >= duration) {
        reset();
        return;
      }

      context.clearRect(0, 0, width, height);
      for (const piece of pieces) {
        const time = elapsed - piece.delay;
        if (time < 0 || !piece.sprite) continue;
        // Absolute-time trajectories avoid frame-rate-dependent flight or drift.
        const sway = Math.sin(piece.phase + time * 3) * Math.min(1, time * 3) * 0.025;
        const x = (piece.x + piece.velocityX * time + sway) * width;
        const y = (1.03 + piece.velocityY * time + piece.gravity * time * time / 2) * height;
        if (x < -piece.size || x > width + piece.size || y < -piece.size || y > height + piece.size) continue;

        context.save();
        context.globalAlpha = Math.min(1, (duration - elapsed) / 0.4);
        context.translate(x, y);
        context.rotate(piece.phase + piece.spin * time);
        context.scale(Math.max(0.24, Math.abs(Math.cos(piece.phase + time * 6))), 1);
        context.drawImage(piece.sprite, -piece.size / 2, -piece.size / 2, piece.size, piece.size);
        context.restore();
      }
      animationFrameId = requestAnimationFrame(animate);
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => {
    if (animationFrameId !== null) resize();
  });

  reset();
  return { start, reset };
}
