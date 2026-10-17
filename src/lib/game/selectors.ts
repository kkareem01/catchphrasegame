import type { GameState } from "./types";

/** Which team gets the phone after a correct guess: always the other one. */
export const nextHolderIndex = (state: GameState): number =>
  (state.holder + 1) % state.competitors.length;

/** The team that scores when the buzzer catches `holder`. */
export const otherTeamIndex = (holder: number): number => (holder === 0 ? 1 : 0);

/** In roundEnd with the steal rule on, the point is not yet awarded. */
export const isStealPending = (state: GameState): boolean =>
  state.phase === "roundEnd" &&
  state.settings.stealRuleEnabled &&
  state.lastScorer === null;

/** Index of the top-scoring team (both, if tied). */
export const getWinners = (state: GameState): readonly number[] => {
  const scores = state.competitors.map((c) => c.score);
  const best = Math.max(...scores);
  return scores.flatMap((score, index) => (score === best ? [index] : []));
};
