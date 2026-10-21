export const CANDY_APPEARANCE = Object.freeze({
  WRAPPED: "wrapped",
  CHOCOLATE: "chocolate",
  COOKIE: "cookie",
  CUPCAKE: "cupcake",
  LOLLIPOP: "lollipop",
});

export const CANDY_APPEARANCES = Object.freeze(
  Object.values(CANDY_APPEARANCE),
);

export function chooseCandyAppearance(random = Math.random) {
  const candidate = random();
  const randomValue = Number.isFinite(candidate) ? candidate : 0;
  const index = Math.min(
    CANDY_APPEARANCES.length - 1,
    Math.max(0, Math.floor(randomValue * CANDY_APPEARANCES.length)),
  );

  return CANDY_APPEARANCES[index];
}

export function normalizeCandyAppearance(appearance) {
  return CANDY_APPEARANCES.includes(appearance)
    ? appearance
    : CANDY_APPEARANCE.WRAPPED;
}
