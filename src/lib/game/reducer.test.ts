import { describe, expect, it } from "vitest";
import { DEFAULT_TARGET_SCORE } from "./constants";
import { createInitialState, gameReducer } from "./reducer";
import type { Deck, GameSettings, GameState } from "./types";

const TARGET = DEFAULT_TARGET_SCORE;
const SETTINGS: GameSettings = {
  mode: "teams",
  categoryId: "everything",
  stealRuleEnabled: false,
  targetScore: TARGET,
};
const STEAL_SETTINGS: GameSettings = { ...SETTINGS, stealRuleEnabled: true };
const SOLO_SETTINGS: GameSettings = { ...SETTINGS, mode: "solo", targetScore: 3 };

const deckOf = (...phrases: string[]): Deck => ({ remaining: phrases, used: [] });

const startedGame = (settings: GameSettings = SETTINGS): GameState =>
  gameReducer(createInitialState(), {
    type: "START_GAME",
    names: ["Reds", "Blues"],
    deck: deckOf("one", "two", "three", "four"),
    settings,
  });

const soloGame = (settings: GameSettings = SOLO_SETTINGS): GameState =>
  gameReducer(createInitialState(), {
    type: "START_GAME",
    names: ["Ann", "Bo", "Cy"],
    deck: deckOf("one", "two", "three", "four"),
    settings,
  });

const withScores = (state: GameState, scores: readonly number[]): GameState => ({
  ...state,
  competitors: state.competitors.map((c, i) => ({ ...c, score: scores[i] })),
});

describe("createInitialState", () => {
  it("starts in setup with zero scores and no phrase", () => {
    const state = createInitialState();
    expect(state.phase).toBe("setup");
    expect(state.competitors[0].score).toBe(0);
    expect(state.competitors[1].score).toBe(0);
    expect(state.currentPhrase).toBeNull();
  });
});

describe("START_GAME", () => {
  it("enters roundActive with the first phrase drawn", () => {
    const state = startedGame();
    expect(state.phase).toBe("roundActive");
    expect(state.currentPhrase).toBe("one");
    expect(state.deck.remaining).toEqual(["two", "three", "four"]);
    expect(state.competitors[0].name).toBe("Reds");
    expect(state.competitors[1].name).toBe("Blues");
    expect(state.holder).toBe(0);
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
    expect(state.holder).toBe(1);
    expect(state.currentPhrase).toBe("two");
    expect(state.phase).toBe("roundActive");
  });

  it("does not change any score", () => {
    const state = gameReducer(startedGame(), { type: "CORRECT" });
    expect(state.competitors[0].score).toBe(0);
    expect(state.competitors[1].score).toBe(0);
  });
});

describe("SKIP", () => {
  it("keeps possession and requeues the phrase at the bottom", () => {
    const state = gameReducer(startedGame(), { type: "SKIP" });
    expect(state.holder).toBe(0);
    expect(state.currentPhrase).toBe("two");
    expect(state.deck.remaining).toEqual(["three", "four", "one"]);
  });
});

describe("BUZZER without steal rule", () => {
  it("awards a point to the non-holding team and enters roundEnd", () => {
    const state = gameReducer(startedGame(), { type: "BUZZER" });
    expect(state.phase).toBe("roundEnd");
    expect(state.competitors[1].score).toBe(1);
    expect(state.competitors[0].score).toBe(0);
    expect(state.lastScorer).toBe(1);
  });

  it("ends the game when the non-holding team reaches the winning score", () => {
    const nearWin = withScores(startedGame(), [0, TARGET - 1]);
    const state = gameReducer(nearWin, { type: "BUZZER" });
    expect(state.phase).toBe("gameOver");
    expect(state.competitors[1].score).toBe(TARGET);
  });

  it("respects a custom target score chosen at game start", () => {
    const shortGame = startedGame({ ...SETTINGS, targetScore: 3 });
    const nearWin = withScores(shortGame, [0, 2]);
    const state = gameReducer(nearWin, { type: "BUZZER" });
    expect(state.phase).toBe("gameOver");
    expect(state.competitors[1].score).toBe(3);
  });

  it("does not end the game before reaching a higher target", () => {
    const longGame = startedGame({ ...SETTINGS, targetScore: 10 });
    const nearWin = withScores(longGame, [0, 6]);
    const state = gameReducer(nearWin, { type: "BUZZER" });
    expect(state.phase).toBe("roundEnd");
    expect(state.competitors[1].score).toBe(7);
  });
});

describe("BUZZER with steal rule", () => {
  it("enters roundEnd without awarding a point yet", () => {
    const state = gameReducer(startedGame(STEAL_SETTINGS), { type: "BUZZER" });
    expect(state.phase).toBe("roundEnd");
    expect(state.competitors[0].score).toBe(0);
    expect(state.competitors[1].score).toBe(0);
  });

  it("awards 1 point on failed steal", () => {
    const buzzed = gameReducer(startedGame(STEAL_SETTINGS), { type: "BUZZER" });
    const state = gameReducer(buzzed, { type: "RESOLVE_STEAL", stolen: false });
    expect(state.competitors[1].score).toBe(1);
    expect(state.phase).toBe("roundEnd");
  });

  it("awards 2 points on successful steal", () => {
    const buzzed = gameReducer(startedGame(STEAL_SETTINGS), { type: "BUZZER" });
    const state = gameReducer(buzzed, { type: "RESOLVE_STEAL", stolen: true });
    expect(state.competitors[1].score).toBe(2);
  });

  it("ends the game if the steal points reach the winning score", () => {
    const nearWin = withScores(startedGame(STEAL_SETTINGS), [0, TARGET - 2]);
    const buzzed = gameReducer(nearWin, { type: "BUZZER" });
    const state = gameReducer(buzzed, { type: "RESOLVE_STEAL", stolen: true });
    expect(state.phase).toBe("gameOver");
    expect(state.competitors[1].score).toBe(TARGET);
  });
});

describe("START_NEXT_ROUND", () => {
  it("returns to roundActive with a fresh phrase, losing team holding first", () => {
    const buzzed = gameReducer(startedGame(), { type: "BUZZER" });
    const state = gameReducer(buzzed, { type: "START_NEXT_ROUND" });
    expect(state.phase).toBe("roundActive");
    expect(state.currentPhrase).toBe("two");
    expect(state.holder).toBe(0);
    expect(state.lastScorer).toBeNull();
  });
});

describe("NEW_GAME", () => {
  it("resets to setup from gameOver", () => {
    const nearWin = withScores(startedGame(), [0, TARGET - 1]);
    const over = gameReducer(nearWin, { type: "BUZZER" });
    const state = gameReducer(over, { type: "NEW_GAME" });
    expect(state.phase).toBe("setup");
    expect(state.competitors[0].score).toBe(0);
    expect(state.competitors[1].score).toBe(0);
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
      names: ["X", "Y"],
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

describe("START_GAME roster validation", () => {
  it("rejects a teams game without exactly two names", () => {
    const setup = createInitialState();
    const state = gameReducer(setup, {
      type: "START_GAME",
      names: ["Only one"],
      deck: deckOf("z"),
      settings: SETTINGS,
    });
    expect(state).toBe(setup);
  });

  it("rejects a solo game with fewer than the minimum players", () => {
    const setup = createInitialState();
    const state = gameReducer(setup, {
      type: "START_GAME",
      names: ["Ann", "Bo"],
      deck: deckOf("z"),
      settings: SOLO_SETTINGS,
    });
    expect(state).toBe(setup);
  });

  it("rejects an empty deck", () => {
    const setup = createInitialState();
    const state = gameReducer(setup, {
      type: "START_GAME",
      names: ["Reds", "Blues"],
      deck: deckOf(),
      settings: SETTINGS,
    });
    expect(state).toBe(setup);
  });
});

describe("solo (free-for-all) mode", () => {
  it("starts with every player at zero strikes, first player holding", () => {
    const state = soloGame();
    expect(state.phase).toBe("roundActive");
    expect(state.competitors.map((c) => c.name)).toEqual(["Ann", "Bo", "Cy"]);
    expect(state.competitors.every((c) => c.score === 0)).toBe(true);
    expect(state.holder).toBe(0);
  });

  it("passes the phone around the circle and wraps to the first player", () => {
    const once = gameReducer(soloGame(), { type: "CORRECT" });
    const twice = gameReducer(once, { type: "CORRECT" });
    const thrice = gameReducer(twice, { type: "CORRECT" });
    expect([once.holder, twice.holder, thrice.holder]).toEqual([1, 2, 0]);
  });

  it("gives the player caught holding the phone a strike", () => {
    const passed = gameReducer(soloGame(), { type: "CORRECT" });
    const state = gameReducer(passed, { type: "BUZZER" });
    expect(state.phase).toBe("roundEnd");
    expect(state.competitors.map((c) => c.score)).toEqual([0, 1, 0]);
    expect(state.lastScorer).toBe(1);
  });

  it("ignores the steal rule even if it was switched on", () => {
    const state = gameReducer(
      soloGame({ ...SOLO_SETTINGS, stealRuleEnabled: true }),
      { type: "BUZZER" },
    );
    expect(state.lastScorer).toBe(0);
    expect(state.competitors[0].score).toBe(1);
    expect(gameReducer(state, { type: "RESOLVE_STEAL", stolen: true })).toBe(state);
  });

  it("ends the game when a player reaches the strike limit", () => {
    const nearOut = withScores(soloGame(), [SOLO_SETTINGS.targetScore - 1, 0, 0]);
    const state = gameReducer(nearOut, { type: "BUZZER" });
    expect(state.phase).toBe("gameOver");
  });

  it("lets the caught player start the next round", () => {
    const passed = gameReducer(soloGame(), { type: "CORRECT" });
    const buzzed = gameReducer(passed, { type: "BUZZER" });
    const state = gameReducer(buzzed, { type: "START_NEXT_ROUND" });
    expect(state.holder).toBe(1);
  });
});

describe("REMATCH", () => {
  it("restarts from gameOver with the same names and settings, scores reset", () => {
    const nearWin = withScores(startedGame(), [0, TARGET - 1]);
    const over = gameReducer(nearWin, { type: "BUZZER" });
    const state = gameReducer(over, { type: "REMATCH" });
    expect(state.phase).toBe("roundActive");
    expect(state.competitors).toEqual([
      { name: "Reds", score: 0 },
      { name: "Blues", score: 0 },
    ]);
    expect(state.settings).toBe(over.settings);
    expect(state.holder).toBe(0);
    expect(state.lastScorer).toBeNull();
  });

  it("keeps drawing from the same deck so phrases don't repeat", () => {
    const over = gameReducer(withScores(startedGame(), [0, TARGET - 1]), {
      type: "BUZZER",
    });
    const state = gameReducer(over, { type: "REMATCH" });
    expect(state.currentPhrase).toBe("two");
  });

  it("is ignored outside gameOver", () => {
    const active = startedGame();
    expect(gameReducer(active, { type: "REMATCH" })).toBe(active);
  });
});
