import type { Deck, Rng } from "./types";

/** Fisher–Yates shuffle. Returns a new array; the input is not mutated. */
export const shuffle = <T>(items: readonly T[], rng: Rng): readonly T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/** Builds a fresh deck with all phrases shuffled into the remaining pile. */
export const createDeck = (phrases: readonly string[], rng: Rng): Deck => ({
  remaining: shuffle(phrases, rng),
  used: [],
});

/**
 * Draws the top phrase, moving it to the used pile. If the remaining pile is
 * empty, the used pile is reshuffled back in first so play never stalls.
 */
export const drawPhrase = (
  deck: Deck,
  rng: Rng,
): Readonly<{ deck: Deck; phrase: string }> => {
  const source: Deck =
    deck.remaining.length > 0
      ? deck
      : { remaining: shuffle(deck.used, rng), used: [] };
  const [phrase, ...rest] = source.remaining;
  return {
    phrase,
    deck: { remaining: rest, used: [...source.used, phrase] },
  };
};

/** Returns a skipped phrase to the bottom of the remaining pile. */
export const requeueSkipped = (deck: Deck, phrase: string): Deck => ({
  remaining: [...deck.remaining, phrase],
  used: deck.used,
});
