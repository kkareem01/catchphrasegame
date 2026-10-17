import type { GameState } from "./types";

/** Who gets the phone after a correct guess: the next seat around the circle. */
export const nextHolderIndex = (state: GameState): number =>
  (state.holder + 1) % state.competitors.length;

/** The team that scores when the buzzer catches `holder` (teams mode). */
export const otherTeamIndex = (holder: number): number => (holder === 0 ? 1 : 0);

/** In roundEnd with the steal rule on, the point is not yet awarded. */
export const isStealPending = (state: GameState): boolean =>
  state.phase === "roundEnd" &&
  state.settings.mode === "teams" &&
  state.settings.stealRuleEnabled &&
  state.lastScorer === null;

/**
 * Winner indices: the top-scoring team, or every solo player tied on the
 * fewest strikes.
 */
export const getWinners = (state: GameState): readonly number[] => {
  const scores = state.competitors.map((c) => c.score);
  const best =
    state.settings.mode === "teams" ? Math.max(...scores) : Math.min(...scores);
  return scores.flatMap((score, index) => (score === best ? [index] : []));
};
