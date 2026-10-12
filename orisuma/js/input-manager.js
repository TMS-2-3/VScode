import { ACTIONS, DEFAULT_CONTROLS } from "./constants.js";
import { normalizeBattleInput } from "./battle-simulation.js";
import { clone, emptyInput, isTyping } from "./utils.js";

const STICK_DEADZONE = 0.2;
const DIGITAL_THRESHOLD = 0.35;

export class InputManager {
  constructor(onChange) {
    this.onChange = onChange;
    this.controls = this.loadControls();
    this.keys = new Set();
    this.captureKeyboard = null;
    this.captureGamepadAction = null;
  }

  bind() {
    window.addEventListener("keydown", event => this.onKeyDown(event));
    window.addEventListener("keyup", event => this.keys.delete(event.code));
    window.addEventListener("gamepadconnected", () => this.onChange());
    window.addEventListener("gamepaddisconnected", () => this.onChange());
  }

  onKeyDown(event) {
    if (this.captureKeyboard) {
      event.preventDefault();
      this.controls.keyboard[this.captureKeyboard] = event.code;
      this.captureKeyboard = null;
      this.saveControls();
      this.onChange();
      return;
    }
    if (isTyping()) return;
    this.keys.add(event.code);
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
      event.preventDefault();
    }
  }

  readInput() {
    const input = emptyInput();
    for (const [action] of ACTIONS) {
      if (["left", "right", "up", "down"].includes(action)) continue;
      const code = this.controls.keyboard[action];
      if (code && this.keys.has(code)) input[action] = true;
    }

    const keyboardX = Number(this.keys.has(this.controls.keyboard.right)) - Number(this.keys.has(this.controls.keyboard.left));
    const keyboardY = Number(this.keys.has(this.controls.keyboard.down)) - Number(this.keys.has(this.controls.keyboard.up));
    input.moveX = keyboardX;
    input.moveY = keyboardY;

    const pad = this.firstGamepad();
    if (pad) {
      for (const [action] of ACTIONS) {
        if (["left", "right", "up", "down"].includes(action)) continue;
        if (this.readPadBinding(pad, this.controls.gamepad[action])) input[action] = true;
      }
      const padX = this.readPadBindingValue(pad, this.controls.gamepad.right)
        - this.readPadBindingValue(pad, this.controls.gamepad.left);
      const padY = this.readPadBindingValue(pad, this.controls.gamepad.down)
        - this.readPadBindingValue(pad, this.controls.gamepad.up);
      if (Math.abs(padX) > Math.abs(input.moveX)) input.moveX = this.clamp(padX, -1, 1);
      if (Math.abs(padY) > Math.abs(input.moveY)) input.moveY = this.clamp(padY, -1, 1);
    }

    return normalizeBattleInput(input);
  }

  startKeyboardCapture(action) {
    this.captureKeyboard = action;
    this.onChange();
  }

  startGamepadCapture(action) {
    this.captureGamepadAction = action;
    const started = performance.now();
    const poll = () => {
      if (this.captureGamepadAction !== action) return;
      const pad = this.firstGamepad();
      if (!pad) {
        if (performance.now() - started > 5000) {
          this.captureGamepadAction = null;
          this.onChange();
          return;
        }
        requestAnimationFrame(poll);
        return;
      }

      for (let i = 0; i < pad.buttons.length; i += 1) {
        if (pad.buttons[i].pressed) {
          this.controls.gamepad[action] = `button${i}`;
          this.finishGamepadCapture();
          return;
        }
      }
      for (let i = 0; i < pad.axes.length; i += 1) {
        if (pad.axes[i] < -0.65 || pad.axes[i] > 0.65) {
          this.controls.gamepad[action] = `axis${i}${pad.axes[i] < 0 ? "-" : "+"}`;
          this.finishGamepadCapture();
          return;
        }
      }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
    this.onChange();
  }

  finishGamepadCapture() {
    this.captureGamepadAction = null;
    this.saveControls();
    this.onChange();
  }

  resetControls() {
    this.controls = clone(DEFAULT_CONTROLS);
    this.saveControls();
    this.onChange();
  }

  hasGamepad() {
    return Boolean(this.firstGamepad());
  }

  firstGamepad() {
    return navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean)[0] : null;
  }

  readPadBinding(pad, binding) {
    return this.readPadBindingValue(pad, binding) > DIGITAL_THRESHOLD;
  }

  readPadBindingValue(pad, binding) {
    if (!binding) return false;
    if (binding.startsWith("button")) {
      const index = Number(binding.slice(6));
      const button = pad.buttons[index];
      return button ? Math.max(Number(button.value) || 0, button.pressed ? 1 : 0) : 0;
    }
    const match = /^axis(\d+)([+-])$/.exec(binding);
    if (match) {
      const value = (pad.axes[Number(match[1])] || 0) * (match[2] === "-" ? -1 : 1);
      if (value <= STICK_DEADZONE) return 0;
      return this.clamp((value - STICK_DEADZONE) / (1 - STICK_DEADZONE), 0, 1);
    }
    return 0;
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  loadControls() {
    try {
      const saved = JSON.parse(localStorage.getItem("orisuma.controls") || "null");
      return {
        keyboard: { ...DEFAULT_CONTROLS.keyboard, ...(saved && saved.keyboard) },
        gamepad: { ...DEFAULT_CONTROLS.gamepad, ...(saved && saved.gamepad) }
      };
    } catch (error) {
      return clone(DEFAULT_CONTROLS);
    }
  }

  saveControls() {
    localStorage.setItem("orisuma.controls", JSON.stringify(this.controls));
  }
}
