export function createHud(root) {
  const candyCount = root.querySelector("#candy-count");

  if (!(candyCount instanceof HTMLOutputElement)) {
    throw new Error("#candy-count が見つかりません。");
  }

  function setCandyCount(value) {
    candyCount.value = String(Math.max(0, Math.floor(value)));
  }

  setCandyCount(0);

  return {
    setCandyCount,
  };
}
