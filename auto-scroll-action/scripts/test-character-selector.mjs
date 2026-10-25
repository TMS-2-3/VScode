import assert from "node:assert/strict";
import { createCharacterSelector } from "../src/visual/character-selector.js";

class CharacterInput extends EventTarget {
  constructor(value) {
    super();
    this.value = value;
    this.checked = value === "girl";
  }
}

class CharacterFieldset {
  inputs = [new CharacterInput("girl"), new CharacterInput("boy")];

  querySelectorAll(selector) {
    assert.equal(selector, 'input[name="character"]');
    return this.inputs;
  }

  choose(value) {
    for (const input of this.inputs) {
      input.checked = input.value === value;
    }
    this.inputs.find((input) => input.checked).dispatchEvent(new Event("change"));
  }
}

globalThis.HTMLFieldSetElement = CharacterFieldset;
globalThis.window = {
  get localStorage() {
    assert.fail("Character selection must not persist across page loads.");
  },
};

try {
  const root = new CharacterFieldset();
  const changes = [];
  const selector = createCharacterSelector(root, (value) => changes.push(value));
  assert.equal(selector.getSelectedCharacter(), "boy");
  assert.deepEqual(root.inputs.map((input) => input.checked), [false, true]);
  assert.deepEqual(changes, []);

  root.choose("girl");
  assert.equal(selector.getSelectedCharacter(), "girl");
  assert.deepEqual(changes, ["girl"]);
  root.inputs[1].dispatchEvent(new Event("change"));
  assert.deepEqual(changes, ["girl"]);

  // A new page starts with the boy without changing the existing page's choice.
  const reopened = createCharacterSelector(new CharacterFieldset(), () => {});
  assert.equal(reopened.getSelectedCharacter(), "boy");
  assert.equal(selector.getSelectedCharacter(), "girl");
  root.choose("boy");
  assert.equal(selector.getSelectedCharacter(), "boy");
  assert.deepEqual(changes, ["girl", "boy"]);
  assert.throws(() => createCharacterSelector(null, () => {}), /missing/);
} finally {
  delete globalThis.HTMLFieldSetElement;
  delete globalThis.window;
}

console.log("Character selector defaults and page-lifetime selection tests passed.");
