import {
  COOP_SKIPS_PER_ROUND,
  DEFAULT_TARGET_SCORE,
  DEFAULT_TEAM_NAMES,
} from "./constants";
import { drawPhrase, requeueSkipped } from "./deck";
import {
  coopTotal,
  isStealPending,
  nextHolderIndex,
  otherTeamIndex,
} from "./selectors";
import { isValidRoster } from "./setup";
import type { CoopProgress, GameEvent, GameState, Rng } from "./types";

export const createInitialState = (): GameState => ({
  phase: "setup",
  competitors: DEFAULT_TEAM_NAMES.map((name) => ({ name, score: 0 })),
  holder: 0,
  deck: { remaining: [], used: [] },
  currentPhrase: null,
  settings: {
    mode: "teams",
    categoryId: "everything",
    stealRuleEnabled: false,
    targetScore: DEFAULT_TARGET_SCORE,
  },
  coop: null,
  lastScorer: null,
});

const freshCoop = (previousBest: number): CoopProgress => ({
  roundScores: [0],
  skipsLeft: COOP_SKIPS_PER_ROUND,
  previousBest,
});

/** Co-op correct guess: +1 for the team this bomb, +1 to the describer. */
const scoreCoopGuess = (state: GameState, coop: CoopProgress): GameState => ({
  ...state,
  competitors: state.competitors.map((c, i) =>
    i === state.holder ? { ...c, score: c.score + 1 } : c,
  ),
  coop: {
    ...coop,
    roundScores: coop.roundScores.map((score, i, all) =>
      i === all.length - 1 ? score + 1 : score,
    ),
  },
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

/** First round of a game: scores zeroed, first seat holding, phrase drawn. */
const beginGame = (
  state: GameState,
  names: readonly string[],
  previousBest: number,
  rng: Rng,
): GameState => {
  const { deck, phrase } = drawPhrase(state.deck, rng);
  return {
    ...state,
    phase: "roundActive",
    competitors: names.map((name) => ({ name, score: 0 })),
    holder: 0,
    deck,
    currentPhrase: phrase,
    coop: state.settings.mode === "coop" ? freshCoop(previousBest) : null,
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
      if (
        state.phase !== "setup" ||
        deckSize === 0 ||
        !isValidRoster(event.settings.mode, event.names.length)
      ) {
        return state;
      }
      return beginGame(
        { ...state, deck: event.deck, settings: event.settings },
        event.names,
        event.previousBest ?? 0,
        rng,
      );
    }

    case "CORRECT": {
      if (state.phase !== "roundActive") return state;
      const scored = state.coop ? scoreCoopGuess(state, state.coop) : state;
      const { deck, phrase } = drawPhrase(state.deck, rng);
      return {
        ...scored,
        holder: nextHolderIndex(state),
        deck,
        currentPhrase: phrase,
      };
    }

    case "SKIP": {
      if (state.phase !== "roundActive" || state.currentPhrase === null) {
        return state;
      }
      if (state.coop?.skipsLeft === 0) return state;
      const requeued = requeueSkipped(state.deck, state.currentPhrase);
      const { deck, phrase } = drawPhrase(requeued, rng);
      const coop = state.coop && { ...state.coop, skipsLeft: state.coop.skipsLeft - 1 };
      return { ...state, deck, currentPhrase: phrase, coop };
    }

    case "BUZZER": {
      if (state.phase !== "roundActive") return state;
      const ended: GameState = { ...state, phase: "roundEnd", lastScorer: null };
      if (state.coop) {
        const lastBomb = state.coop.roundScores.length >= state.settings.targetScore;
        return lastBomb ? { ...ended, phase: "gameOver" } : ended;
      }
      if (state.settings.mode === "solo") {
        return addScore(ended, state.holder, 1);
      }
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
      const coop = state.coop && {
        ...state.coop,
        roundScores: [...state.coop.roundScores, 0],
        skipsLeft: COOP_SKIPS_PER_ROUND,
      };
      return {
        ...state,
        phase: "roundActive",
        deck,
        currentPhrase: phrase,
        coop,
        lastScorer: null,
      };
    }

    case "REMATCH": {
      if (state.phase !== "gameOver") return state;
      const previousBest = Math.max(state.coop?.previousBest ?? 0, coopTotal(state));
      return beginGame(
        state,
        state.competitors.map((c) => c.name),
        previousBest,
        rng,
      );
    }

    case "NEW_GAME":
      return createInitialState();

    default:
      return state;
  }
};
