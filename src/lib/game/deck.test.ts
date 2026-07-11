import { describe, expect, it } from "vitest";
import { createDeck, drawPhrase, requeueSkipped, shuffle } from "./deck";
import type { Deck, Rng } from "./types";

/** Deterministic RNG from a fixed sequence, cycling if exhausted. */
const seqRng = (values: readonly number[]): Rng => {
  let i = 0;
  return () => values[i++ % values.length];
};

const PHRASES = ["alpha", "bravo", "charlie", "delta"] as const;

describe("shuffle", () => {
  it("returns a permutation of the input", () => {
    const result = shuffle(PHRASES, seqRng([0.1, 0.9, 0.4, 0.7]));
    expect([...result].sort()).toEqual([...PHRASES].sort());
  });

  it("does not mutate the input array", () => {
    const input = [...PHRASES];
    shuffle(input, seqRng([0.5]));
    expect(input).toEqual([...PHRASES]);
  });

  it("is deterministic for a given rng", () => {
    const a = shuffle(PHRASES, seqRng([0.2, 0.6, 0.3]));
    const b = shuffle(PHRASES, seqRng([0.2, 0.6, 0.3]));
    expect(a).toEqual(b);
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffle([], seqRng([0.5]))).toEqual([]);
    expect(shuffle(["only"], seqRng([0.5]))).toEqual(["only"]);
  });
});

describe("createDeck", () => {
  it("shuffles all phrases into remaining with empty used pile", () => {
    const deck = createDeck(PHRASES, seqRng([0.3, 0.8, 0.1]));
    expect([...deck.remaining].sort()).toEqual([...PHRASES].sort());
    expect(deck.used).toEqual([]);
  });
});

describe("drawPhrase", () => {
  it("draws the top phrase and moves it to used", () => {
    const deck: Deck = { remaining: ["a", "b", "c"], used: [] };
    const { deck: next, phrase } = drawPhrase(deck, seqRng([0.5]));
    expect(phrase).toBe("a");
    expect(next.remaining).toEqual(["b", "c"]);
    expect(next.used).toEqual(["a"]);
  });

  it("does not mutate the input deck", () => {
    const deck: Deck = { remaining: ["a", "b"], used: [] };
    drawPhrase(deck, seqRng([0.5]));
    expect(deck).toEqual({ remaining: ["a", "b"], used: [] });
  });

  it("never repeats a phrase until the deck is exhausted", () => {
    let deck = createDeck(PHRASES, seqRng([0.4, 0.2, 0.9, 0.6]));
    const drawn: string[] = [];
    for (let i = 0; i < PHRASES.length; i++) {
      const result = drawPhrase(deck, seqRng([0.5]));
      drawn.push(result.phrase);
      deck = result.deck;
    }
    expect([...drawn].sort()).toEqual([...PHRASES].sort());
  });

  it("reshuffles the used pile back in when remaining is empty", () => {
    const deck: Deck = { remaining: [], used: ["x", "y", "z"] };
    const { deck: next, phrase } = drawPhrase(deck, seqRng([0.6, 0.2]));
    expect(["x", "y", "z"]).toContain(phrase);
    expect(next.remaining.length).toBe(2);
    expect(next.used).toEqual([phrase]);
  });
});

describe("requeueSkipped", () => {
  it("moves the skipped phrase to the bottom of remaining", () => {
    const deck: Deck = { remaining: ["b", "c"], used: [] };
    const next = requeueSkipped(deck, "a");
    expect(next.remaining).toEqual(["b", "c", "a"]);
    expect(next.used).toEqual([]);
  });

  it("does not mutate the input deck", () => {
    const deck: Deck = { remaining: ["b"], used: [] };
    requeueSkipped(deck, "a");
    expect(deck.remaining).toEqual(["b"]);
  });
});
