import { formatStampTimestamp } from "../core/stamp-collection.js";

export function createSettingsPanel(button, dialog, audio, { getStampLog = () => null } = {}) {
  if (
    !(button instanceof HTMLButtonElement) ||
    !(dialog instanceof HTMLDialogElement)
  ) {
    throw new Error("Settings controls are missing.");
  }

  const closeButton = dialog.querySelector("[data-settings-close]");
  const sliders = Array.from(dialog.querySelectorAll("input[data-volume]"));
  const stampLogEntry = dialog.querySelector("#stamp-log-entry");
  const stampLogEmpty = dialog.querySelector("#stamp-log-empty");
  const stampLogTime = dialog.querySelector("#stamp-log-time");

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
    const log = getStampLog();
    stampLogEntry.hidden = !log;
    stampLogEmpty.hidden = Boolean(log);
    stampLogTime.textContent = log ? formatStampTimestamp(log.gameOverAt) : "";
    if (log) {
      stampLogTime.dateTime = log.gameOverAt;
    } else {
      stampLogTime.removeAttribute("datetime");
    }
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
