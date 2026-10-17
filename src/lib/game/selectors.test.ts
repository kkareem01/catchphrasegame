import { describe, expect, it } from "vitest";
import { createInitialState, gameReducer } from "./reducer";
import { COOP_MIN_DURATION_SCALE } from "./constants";
import {
  coopTotal,
  getRoundDurationScale,
  getTopDescribers,
  getWinners,
  isStealPending,
  nextHolderIndex,
} from "./selectors";
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

describe("co-op selectors", () => {
  const coop = (roundScores: readonly number[], describerScores: readonly number[]) => ({
    ...withScores(started(["A", "B", "C"], settings({ mode: "coop" })), describerScores),
    coop: { roundScores, skipsLeft: 3, previousBest: 0 },
  });

  it("totals phrases cleared across every bomb", () => {
    expect(coopTotal(coop([4, 6, 2], [0, 0, 0]))).toBe(12);
    expect(coopTotal(started(["A", "B"], settings()))).toBe(0);
  });

  it("finds the top describer(s), or nobody if nothing was cleared", () => {
    expect(getTopDescribers(coop([5], [3, 1, 3]))).toEqual([0, 2]);
    expect(getTopDescribers(coop([0], [0, 0, 0]))).toEqual([]);
  });

  it("shrinks the hidden timer bomb by bomb, down to a floor", () => {
    expect(getRoundDurationScale(coop([0], [0, 0, 0]))).toBe(1);
    const second = getRoundDurationScale(coop([3, 0], [0, 0, 0]));
    const third = getRoundDurationScale(coop([3, 3, 0], [0, 0, 0]));
    expect(second).toBeLessThan(1);
    expect(third).toBeLessThan(second);
    const late = getRoundDurationScale(coop(Array(20).fill(1), [0, 0, 0]));
    expect(late).toBe(COOP_MIN_DURATION_SCALE);
  });

  it("never shrinks the timer outside co-op", () => {
    expect(getRoundDurationScale(started(["A", "B"], settings()))).toBe(1);
  });
});
