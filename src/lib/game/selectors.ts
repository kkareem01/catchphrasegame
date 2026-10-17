import { COOP_MIN_DURATION_SCALE, COOP_ROUND_SHRINK } from "./constants";
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
 * fewest strikes. (Co-op players win or lose together — see getTopDescribers.)
 */
export const getWinners = (state: GameState): readonly number[] => {
  const scores = state.competitors.map((c) => c.score);
  const best =
    state.settings.mode === "teams" ? Math.max(...scores) : Math.min(...scores);
  return scores.flatMap((score, index) => (score === best ? [index] : []));
};

/** Co-op: phrases cleared across every bomb so far. */
export const coopTotal = (state: GameState): number =>
  state.coop?.roundScores.reduce((sum, score) => sum + score, 0) ?? 0;

/** Co-op: whoever described the most phrases (ties shared; none if all 0). */
export const getTopDescribers = (state: GameState): readonly number[] => {
  const best = Math.max(...state.competitors.map((c) => c.score));
  if (best <= 0) return [];
  return state.competitors.flatMap((c, index) => (c.score === best ? [index] : []));
};

/** Co-op bombs get shorter each round (down to a floor); 1 elsewhere. */
export const getRoundDurationScale = (state: GameState): number => {
  if (!state.coop) return 1;
  const bombIndex = state.coop.roundScores.length - 1;
  return Math.max(COOP_MIN_DURATION_SCALE, 1 - COOP_ROUND_SHRINK * bombIndex);
};
