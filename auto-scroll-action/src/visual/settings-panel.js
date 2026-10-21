export function createSettingsPanel(button, dialog, audio) {
  if (
    !(button instanceof HTMLButtonElement) ||
    !(dialog instanceof HTMLDialogElement)
  ) {
    throw new Error("Settings controls are missing.");
  }

  const closeButton = dialog.querySelector("[data-settings-close]");
  const sliders = Array.from(dialog.querySelectorAll("input[data-volume]"));

  function updateControls() {
    const settings = audio.getVolumeSettings();

    for (const slider of sliders) {
      const percent = Math.round(settings[slider.dataset.volume] * 100);
      slider.value = String(percent);
      slider.setAttribute("aria-valuetext", `${percent}%`);
      slider.style.setProperty("--volume-level", `${percent}%`);
      dialog.querySelector(`output[for="${slider.id}"]`).value = `${percent}%`;
    }
  }

  button.addEventListener("click", () => {
    updateControls();
    dialog.showModal();
    button.setAttribute("aria-expanded", "true");
    sliders[0].focus();
  });

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    button.setAttribute("aria-expanded", "false");
    button.focus();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) {
      return;
    }

    const bounds = dialog.getBoundingClientRect();

    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      dialog.close();
    }
  });

  for (const slider of sliders) {
    slider.addEventListener("input", () => {
      audio.setVolumeSettings({
        [slider.dataset.volume]: Number(slider.value) / 100,
      });
      updateControls();
    });
  }

  updateControls();
  return { isOpen: () => dialog.open };
}
