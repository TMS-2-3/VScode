export function emptyInput() {
  return {
    moveX: 0,
    moveY: 0,
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shortHopMode: "both",
    attack: false,
    smash: false,
    special: false,
    shield: false,
    grab: false
  };
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function bindingLabel(code) {
  const pointerLabels = {
    Mouse0: "左クリック",
    Mouse1: "ホイールクリック",
    Mouse2: "右クリック",
    Mouse3: "サイドボタン1",
    Mouse4: "サイドボタン2",
    WheelUp: "ホイール上",
    WheelDown: "ホイール下"
  };
  if (pointerLabels[code]) return pointerLabels[code];
  const labels = {
    Space: "Space",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→"
  };
  if (labels[code]) return labels[code];
  if (code && code.startsWith("Key")) return code.slice(3);
  if (code && code.startsWith("Digit")) return code.slice(5);
  return code || "未設定";
}

export function padBindingLabel(binding) {
  if (!binding) return "パッド未設定";
  if (binding.startsWith("button")) return `Pad B${binding.slice(6)}`;
  if (binding.startsWith("axis")) return `Pad ${binding.toUpperCase()}`;
  return binding;
}

export function formatTime(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(value / 60);
  const secs = String(value % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

export function isTyping() {
  const tag = document.activeElement && document.activeElement.tagName;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(tag);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function escapeAttr(value) {
  return escapeHtml(value);
}

export function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function approach(value, target, amount) {
  if (value < target) return Math.min(target, value + amount);
  if (value > target) return Math.max(target, value - amount);
  return target;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function fighterRect(fighter) {
  return { x: fighter.x - fighter.w / 2, y: fighter.y - fighter.h / 2, w: fighter.w, h: fighter.h };
}

export function roundValue(value) {
  return Math.round(value * 100) / 100;
}

export function createRenderCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
