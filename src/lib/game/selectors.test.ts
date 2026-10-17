import { describe, expect, it } from "vitest";
import { createInitialState, gameReducer } from "./reducer";
import { getWinners, isStealPending, nextHolderIndex } from "./selectors";
import type { GameSettings, GameState } from "./types";

const settings = (overrides: Partial<GameSettings> = {}): GameSettings => ({
  mode: "teams",
  categoryId: "everything",
  stealRuleEnabled: false,
  targetScore: 3,
  ...overrides,
});

const started = (names: readonly string[], s: GameSettings): GameState =>
  gameReducer(createInitialState(), {
    type: "START_GAME",
    names,
    deck: { remaining: ["a", "b", "c"], used: [] },
    settings: s,
  });

const withScores = (state: GameState, scores: readonly number[]): GameState => ({
  ...state,
  competitors: state.competitors.map((c, i) => ({ ...c, score: scores[i] })),
});

describe("nextHolderIndex", () => {
  it("alternates between two teams", () => {
    const state = started(["A", "B"], settings());
    expect(nextHolderIndex(state)).toBe(1);
    expect(nextHolderIndex({ ...state, holder: 1 })).toBe(0);
  });

  it("wraps around a circle of players", () => {
    const state = started(["A", "B", "C"], settings({ mode: "solo" }));
    expect(nextHolderIndex({ ...state, holder: 2 })).toBe(0);
  });
});

describe("getWinners", () => {
  it("picks the highest-scoring team", () => {
    const state = withScores(started(["A", "B"], settings()), [1, 3]);
    expect(getWinners(state)).toEqual([1]);
  });

  it("picks every solo player tied on the fewest strikes", () => {
    const state = withScores(
      started(["A", "B", "C", "D"], settings({ mode: "solo" })),
      [1, 3, 1, 2],
    );
    expect(getWinners(state)).toEqual([0, 2]);
  });
});

describe("isStealPending", () => {
  it("is true only in roundEnd with the steal rule on and no point awarded", () => {
    const steal = started(["A", "B"], settings({ stealRuleEnabled: true }));
    const buzzed = gameReducer(steal, { type: "BUZZER" });
    expect(isStealPending(steal)).toBe(false);
    expect(isStealPending(buzzed)).toBe(true);
    const resolved = gameReducer(buzzed, { type: "RESOLVE_STEAL", stolen: false });
    expect(isStealPending(resolved)).toBe(false);
  });
});
