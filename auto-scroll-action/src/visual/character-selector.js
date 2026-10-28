import { normalizePlayerCharacter, PLAYER_CHARACTER } from "./player-art.js";

export function createCharacterSelector(root, onChange) {
  if (!(root instanceof HTMLFieldSetElement)) {
    throw new Error("Character selector is missing.");
  }

  const inputs = [...root.querySelectorAll('input[name="character"]')];
  // Keep selection for this page only; reopening the game always starts with the boy.
  let selected = PLAYER_CHARACTER.BOY;

  for (const input of inputs) {
    input.checked = input.value === selected;
    input.addEventListener("change", () => {
      if (!input.checked) {
        return;
      }

      selected = normalizePlayerCharacter(input.value);

      onChange(selected);
    });
  }

  return { getSelectedCharacter: () => selected };
}
