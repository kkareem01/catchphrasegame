import { describe, expect, it } from "vitest";
import { DEFAULT_TARGET_SCORE } from "./constants";
import { createInitialState, gameReducer } from "./reducer";
import type { Deck, GameSettings, GameState } from "./types";

const TARGET = DEFAULT_TARGET_SCORE;
const SETTINGS: GameSettings = {
  categoryId: "everything",
  stealRuleEnabled: false,
  targetScore: TARGET,
};
const STEAL_SETTINGS: GameSettings = { ...SETTINGS, stealRuleEnabled: true };

const deckOf = (...phrases: string[]): Deck => ({ remaining: phrases, used: [] });

const startedGame = (settings: GameSettings = SETTINGS): GameState =>
  gameReducer(createInitialState(), {
    type: "START_GAME",
    teams: ["Reds", "Blues"],
    deck: deckOf("one", "two", "three", "four"),
    settings,
  });

const withScores = (state: GameState, scores: [number, number]): GameState => ({
  ...state,
  teams: [
    { ...state.teams[0], score: scores[0] },
    { ...state.teams[1], score: scores[1] },
  ],
});

describe("createInitialState", () => {
  it("starts in setup with zero scores and no phrase", () => {
    const state = createInitialState();
    expect(state.phase).toBe("setup");
    expect(state.teams[0].score).toBe(0);
    expect(state.teams[1].score).toBe(0);
    expect(state.currentPhrase).toBeNull();
  });
});

describe("START_GAME", () => {
  it("enters roundActive with the first phrase drawn", () => {
    const state = startedGame();
    expect(state.phase).toBe("roundActive");
    expect(state.currentPhrase).toBe("one");
    expect(state.deck.remaining).toEqual(["two", "three", "four"]);
    expect(state.teams[0].name).toBe("Reds");
    expect(state.teams[1].name).toBe("Blues");
    expect(state.holdingTeam).toBe(0);
  });

  it("does not mutate the previous state", () => {
    const initial = createInitialState();
    startedGame();
    expect(initial.phase).toBe("setup");
  });
});

describe("CORRECT", () => {
  it("flips possession and draws the next phrase", () => {
    const state = gameReducer(startedGame(), { type: "CORRECT" });
    expect(state.holdingTeam).toBe(1);
    expect(state.currentPhrase).toBe("two");
    expect(state.phase).toBe("roundActive");
  });

  it("does not change any score", () => {
    const state = gameReducer(startedGame(), { type: "CORRECT" });
    expect(state.teams[0].score).toBe(0);
    expect(state.teams[1].score).toBe(0);
  });
});

describe("SKIP", () => {
  it("keeps possession and requeues the phrase at the bottom", () => {
    const state = gameReducer(startedGame(), { type: "SKIP" });
    expect(state.holdingTeam).toBe(0);
    expect(state.currentPhrase).toBe("two");
    expect(state.deck.remaining).toEqual(["three", "four", "one"]);
  });
});

describe("BUZZER without steal rule", () => {
  it("awards a point to the non-holding team and enters roundEnd", () => {
    const state = gameReducer(startedGame(), { type: "BUZZER" });
    expect(state.phase).toBe("roundEnd");
    expect(state.teams[1].score).toBe(1);
    expect(state.teams[0].score).toBe(0);
    expect(state.lastPointWinner).toBe(1);
  });

  it("ends the game when the non-holding team reaches the winning score", () => {
    const nearWin = withScores(startedGame(), [0, TARGET - 1]);
    const state = gameReducer(nearWin, { type: "BUZZER" });
    expect(state.phase).toBe("gameOver");
    expect(state.teams[1].score).toBe(TARGET);
  });

  it("respects a custom target score chosen at game start", () => {
    const shortGame = startedGame({ ...SETTINGS, targetScore: 3 });
    const nearWin = withScores(shortGame, [0, 2]);
    const state = gameReducer(nearWin, { type: "BUZZER" });
    expect(state.phase).toBe("gameOver");
    expect(state.teams[1].score).toBe(3);
  });

  it("does not end the game before reaching a higher target", () => {
    const longGame = startedGame({ ...SETTINGS, targetScore: 10 });
    const nearWin = withScores(longGame, [0, 6]);
    const state = gameReducer(nearWin, { type: "BUZZER" });
    expect(state.phase).toBe("roundEnd");
    expect(state.teams[1].score).toBe(7);
  });
});

describe("BUZZER with steal rule", () => {
  it("enters roundEnd without awarding a point yet", () => {
    const state = gameReducer(startedGame(STEAL_SETTINGS), { type: "BUZZER" });
    expect(state.phase).toBe("roundEnd");
    expect(state.teams[0].score).toBe(0);
    expect(state.teams[1].score).toBe(0);
  });

  it("awards 1 point on failed steal", () => {
    const buzzed = gameReducer(startedGame(STEAL_SETTINGS), { type: "BUZZER" });
    const state = gameReducer(buzzed, { type: "RESOLVE_STEAL", stolen: false });
    expect(state.teams[1].score).toBe(1);
    expect(state.phase).toBe("roundEnd");
  });

  it("awards 2 points on successful steal", () => {
    const buzzed = gameReducer(startedGame(STEAL_SETTINGS), { type: "BUZZER" });
    const state = gameReducer(buzzed, { type: "RESOLVE_STEAL", stolen: true });
    expect(state.teams[1].score).toBe(2);
  });

  it("ends the game if the steal points reach the winning score", () => {
    const nearWin = withScores(startedGame(STEAL_SETTINGS), [0, TARGET - 2]);
    const buzzed = gameReducer(nearWin, { type: "BUZZER" });
    const state = gameReducer(buzzed, { type: "RESOLVE_STEAL", stolen: true });
    expect(state.phase).toBe("gameOver");
    expect(state.teams[1].score).toBe(TARGET);
  });
});

describe("START_NEXT_ROUND", () => {
  it("returns to roundActive with a fresh phrase, losing team holding first", () => {
    const buzzed = gameReducer(startedGame(), { type: "BUZZER" });
    const state = gameReducer(buzzed, { type: "START_NEXT_ROUND" });
    expect(state.phase).toBe("roundActive");
    expect(state.currentPhrase).toBe("two");
    expect(state.holdingTeam).toBe(0);
    expect(state.lastPointWinner).toBeNull();
  });
});

describe("NEW_GAME", () => {
  it("resets to setup from gameOver", () => {
    const nearWin = withScores(startedGame(), [0, TARGET - 1]);
    const over = gameReducer(nearWin, { type: "BUZZER" });
    const state = gameReducer(over, { type: "NEW_GAME" });
    expect(state.phase).toBe("setup");
    expect(state.teams[0].score).toBe(0);
    expect(state.teams[1].score).toBe(0);
  });
});

describe("illegal events are no-ops", () => {
  it("ignores CORRECT/SKIP/BUZZER outside roundActive", () => {
    const setup = createInitialState();
    expect(gameReducer(setup, { type: "CORRECT" })).toBe(setup);
    expect(gameReducer(setup, { type: "SKIP" })).toBe(setup);
    expect(gameReducer(setup, { type: "BUZZER" })).toBe(setup);
  });

  it("ignores RESOLVE_STEAL outside roundEnd or when steal rule is off", () => {
    const active = startedGame();
    expect(gameReducer(active, { type: "RESOLVE_STEAL", stolen: true })).toBe(active);
    const buzzedNoSteal = gameReducer(active, { type: "BUZZER" });
    expect(
      gameReducer(buzzedNoSteal, { type: "RESOLVE_STEAL", stolen: true }),
    ).toBe(buzzedNoSteal);
  });

  it("ignores START_GAME outside setup", () => {
    const active = startedGame();
    const again = gameReducer(active, {
      type: "START_GAME",
      teams: ["X", "Y"],
      deck: deckOf("z"),
      settings: SETTINGS,
    });
    expect(again).toBe(active);
  });

  it("ignores START_NEXT_ROUND outside roundEnd", () => {
    const active = startedGame();
    expect(gameReducer(active, { type: "START_NEXT_ROUND" })).toBe(active);
  });

  it("ignores START_NEXT_ROUND in roundEnd while a steal is unresolved", () => {
    const buzzed = gameReducer(startedGame(STEAL_SETTINGS), { type: "BUZZER" });
    expect(gameReducer(buzzed, { type: "START_NEXT_ROUND" })).toBe(buzzed);
  });
});
