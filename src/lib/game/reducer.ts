import { DEFAULT_TEAM_NAMES, WINNING_SCORE } from "./constants";
import { drawPhrase, requeueSkipped } from "./deck";
import type { GameEvent, GameState, Rng, TeamIndex } from "./types";

export const createInitialState = (): GameState => ({
  phase: "setup",
  teams: [
    { name: DEFAULT_TEAM_NAMES[0], score: 0 },
    { name: DEFAULT_TEAM_NAMES[1], score: 0 },
  ],
  holdingTeam: 0,
  deck: { remaining: [], used: [] },
  currentPhrase: null,
  settings: { categoryId: "everything", stealRuleEnabled: false },
  lastPointWinner: null,
});

const otherTeam = (team: TeamIndex): TeamIndex => (team === 0 ? 1 : 0);

const awardPoints = (
  state: GameState,
  team: TeamIndex,
  points: number,
): GameState => {
  const teams: GameState["teams"] = [
    team === 0
      ? { ...state.teams[0], score: state.teams[0].score + points }
      : state.teams[0],
    team === 1
      ? { ...state.teams[1], score: state.teams[1].score + points }
      : state.teams[1],
  ];
  return {
    ...state,
    teams,
    lastPointWinner: team,
    phase: teams[team].score >= WINNING_SCORE ? "gameOver" : state.phase,
  };
};

/** In roundEnd with the steal rule on, the point is not yet awarded. */
const isStealPending = (state: GameState): boolean =>
  state.phase === "roundEnd" &&
  state.settings.stealRuleEnabled &&
  state.lastPointWinner === null;

/**
 * Pure game state machine. Events fired in the wrong phase return the state
 * unchanged (same reference). Randomness (deck reshuffle when exhausted)
 * enters only via the injectable rng.
 */
export const gameReducer = (
  state: GameState,
  event: GameEvent,
  rng: Rng = Math.random,
): GameState => {
  switch (event.type) {
    case "START_GAME": {
      if (state.phase !== "setup") return state;
      const { deck, phrase } = drawPhrase(event.deck, rng);
      return {
        phase: "roundActive",
        teams: [
          { name: event.teams[0], score: 0 },
          { name: event.teams[1], score: 0 },
        ],
        holdingTeam: 0,
        deck,
        currentPhrase: phrase,
        settings: event.settings,
        lastPointWinner: null,
      };
    }

    case "CORRECT": {
      if (state.phase !== "roundActive") return state;
      const { deck, phrase } = drawPhrase(state.deck, rng);
      return {
        ...state,
        holdingTeam: otherTeam(state.holdingTeam),
        deck,
        currentPhrase: phrase,
      };
    }

    case "SKIP": {
      if (state.phase !== "roundActive" || state.currentPhrase === null) {
        return state;
      }
      const requeued = requeueSkipped(state.deck, state.currentPhrase);
      const { deck, phrase } = drawPhrase(requeued, rng);
      return { ...state, deck, currentPhrase: phrase };
    }

    case "BUZZER": {
      if (state.phase !== "roundActive") return state;
      const ended: GameState = { ...state, phase: "roundEnd", lastPointWinner: null };
      if (state.settings.stealRuleEnabled) return ended;
      return awardPoints(ended, otherTeam(state.holdingTeam), 1);
    }

    case "RESOLVE_STEAL": {
      if (!isStealPending(state)) return state;
      const points = event.stolen ? 2 : 1;
      return awardPoints(state, otherTeam(state.holdingTeam), points);
    }

    case "START_NEXT_ROUND": {
      if (state.phase !== "roundEnd" || isStealPending(state)) return state;
      const { deck, phrase } = drawPhrase(state.deck, rng);
      return {
        ...state,
        phase: "roundActive",
        deck,
        currentPhrase: phrase,
        lastPointWinner: null,
      };
    }

    case "NEW_GAME":
      return createInitialState();

    default:
      return state;
  }
};
