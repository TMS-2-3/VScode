import { normalizePlayerCharacter, paintPlayerArtwork } from "./player-art.js";

const STORAGE_KEY = "auto-scroll-action:player-character";

export function createCharacterSelector(root, onChange) {
  if (!(root instanceof HTMLFieldSetElement)) {
    throw new Error("Character selector is missing.");
  }

  const inputs = [...root.querySelectorAll('input[name="character"]')];
  let selected = "girl";

  try {
    selected = normalizePlayerCharacter(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Selection still works when browser storage is unavailable.
  }

  for (const canvas of root.querySelectorAll("[data-character-preview]")) {
    const context = canvas.getContext("2d");

    if (context) {
      paintPlayerArtwork(context, canvas.width, canvas.height, {
        character: canvas.dataset.characterPreview,
        frame: 1,
      });
    }
  }

  for (const input of inputs) {
    input.checked = input.value === selected;
    input.addEventListener("change", () => {
      if (!input.checked) {
        return;
      }

      selected = normalizePlayerCharacter(input.value);

      try {
        window.localStorage.setItem(STORAGE_KEY, selected);
      } catch {
        // Keep the current selection for this session.
      }

      onChange(selected);
    });
  }

  return { getSelectedCharacter: () => selected };
}
