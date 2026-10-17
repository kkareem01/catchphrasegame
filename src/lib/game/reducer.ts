import { DEFAULT_TARGET_SCORE, DEFAULT_TEAM_NAMES } from "./constants";
import { drawPhrase, requeueSkipped } from "./deck";
import { isStealPending, nextHolderIndex, otherTeamIndex } from "./selectors";
import type { GameEvent, GameState, Rng } from "./types";

export const createInitialState = (): GameState => ({
  phase: "setup",
  competitors: DEFAULT_TEAM_NAMES.map((name) => ({ name, score: 0 })),
  holder: 0,
  rosters: [[], []],
  rotation: [0, 0],
  deck: { remaining: [], used: [] },
  currentPhrase: null,
  settings: {
    categoryId: "everything",
    stealRuleEnabled: false,
    targetScore: DEFAULT_TARGET_SCORE,
  },
  lastScorer: null,
});

const addScore = (
  state: GameState,
  index: number,
  points: number,
): GameState => {
  const competitors = state.competitors.map((c, i) =>
    i === index ? { ...c, score: c.score + points } : c,
  );
  return {
    ...state,
    competitors,
    lastScorer: index,
    phase:
      competitors[index].score >= state.settings.targetScore
        ? "gameOver"
        : state.phase,
  };
};

const TEAM_COUNT = 2;

/** Moves `team`'s rotation on to its next listed player (no-op if none). */
const advanceRotation = (state: GameState, team: number): readonly number[] =>
  state.rotation.map((index, t) => {
    const size = state.rosters[t].length;
    return t === team && size > 0 ? (index + 1) % size : index;
  });

/** First round of a game: scores zeroed, team 1 holding, phrase drawn. */
const beginGame = (
  state: GameState,
  names: readonly string[],
  rosters: readonly (readonly string[])[],
  rng: Rng,
): GameState => {
  const { deck, phrase } = drawPhrase(state.deck, rng);
  return {
    ...state,
    phase: "roundActive",
    competitors: names.map((name) => ({ name, score: 0 })),
    holder: 0,
    rosters,
    rotation: rosters.map(() => 0),
    deck,
    currentPhrase: phrase,
    lastScorer: null,
  };
};

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
      const deckSize = event.deck.remaining.length + event.deck.used.length;
      const rosters = event.rosters ?? [[], []];
      if (
        state.phase !== "setup" ||
        deckSize === 0 ||
        event.names.length !== TEAM_COUNT ||
        rosters.length !== TEAM_COUNT
      ) {
        return state;
      }
      return beginGame(
        { ...state, deck: event.deck, settings: event.settings },
        event.names,
        rosters,
        rng,
      );
    }

    case "CORRECT": {
      if (state.phase !== "roundActive") return state;
      const { deck, phrase } = drawPhrase(state.deck, rng);
      return {
        ...state,
        holder: nextHolderIndex(state),
        // The describer is done; their team's next turn goes to the next player.
        rotation: advanceRotation(state, state.holder),
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
      const ended: GameState = { ...state, phase: "roundEnd", lastScorer: null };
      if (state.settings.stealRuleEnabled) return ended;
      return addScore(ended, otherTeamIndex(state.holder), 1);
    }

    case "RESOLVE_STEAL": {
      if (!isStealPending(state)) return state;
      const points = event.stolen ? 2 : 1;
      return addScore(state, otherTeamIndex(state.holder), points);
    }

    case "START_NEXT_ROUND": {
      if (state.phase !== "roundEnd" || isStealPending(state)) return state;
      const { deck, phrase } = drawPhrase(state.deck, rng);
      return {
        ...state,
        phase: "roundActive",
        deck,
        currentPhrase: phrase,
        lastScorer: null,
      };
    }

    case "REMATCH": {
      if (state.phase !== "gameOver") return state;
      return beginGame(
        state,
        state.competitors.map((c) => c.name),
        state.rosters,
        rng,
      );
    }

    case "NEW_GAME":
      return createInitialState();

    default:
      return state;
  }
};
