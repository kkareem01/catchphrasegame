import { describe, expect, it } from "vitest";
import { createInitialState, gameReducer } from "./reducer";
import { getWinners, isStealPending, nextHolderIndex } from "./selectors";
import type { GameSettings, GameState } from "./types";

const settings = (overrides: Partial<GameSettings> = {}): GameSettings => ({
  categoryId: "everything",
  stealRuleEnabled: false,
  targetScore: 3,
  ...overrides,
});

const started = (s: GameSettings = settings()): GameState =>
  gameReducer(createInitialState(), {
    type: "START_GAME",
    names: ["A", "B"],
    deck: { remaining: ["a", "b", "c"], used: [] },
    settings: s,
  });

const withScores = (state: GameState, scores: readonly number[]): GameState => ({
  ...state,
  competitors: state.competitors.map((c, i) => ({ ...c, score: scores[i] })),
});

describe("nextHolderIndex", () => {
  it("alternates between the two teams", () => {
    const state = started();
    expect(nextHolderIndex(state)).toBe(1);
    expect(nextHolderIndex({ ...state, holder: 1 })).toBe(0);
  });
});

describe("getWinners", () => {
  it("picks the highest-scoring team", () => {
    expect(getWinners(withScores(started(), [1, 3]))).toEqual([1]);
  });
});

describe("isStealPending", () => {
  it("is true only in roundEnd with the steal rule on and no point awarded", () => {
    const steal = started(settings({ stealRuleEnabled: true }));
    const buzzed = gameReducer(steal, { type: "BUZZER" });
    expect(isStealPending(steal)).toBe(false);
    expect(isStealPending(buzzed)).toBe(true);
    const resolved = gameReducer(buzzed, { type: "RESOLVE_STEAL", stolen: false });
    expect(isStealPending(resolved)).toBe(false);
  });
});
