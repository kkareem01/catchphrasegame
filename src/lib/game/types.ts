/**
 * "teams": two teams alternate the phone; the team NOT holding it at the
 * buzzer scores. "solo": free-for-all for any number of players (great for
 * odd counts); whoever is caught holding the phone takes a strike.
 */
export type GameMode = "teams" | "solo";

/** A team (teams mode) or a player (solo mode). Score = points or strikes. */
export type Competitor = Readonly<{
  name: string;
  score: number;
}>;

export type Deck = Readonly<{
  remaining: readonly string[];
  used: readonly string[];
}>;

export type GameSettings = Readonly<{
  mode: GameMode;
  categoryId: string;
  /** Teams mode only; ignored in solo. */
  stealRuleEnabled: boolean;
  /** Score that ends the game: points to win (teams) or strikes to lose (solo). */
  targetScore: number;
}>;

export type GamePhase = "setup" | "roundActive" | "roundEnd" | "gameOver";

export type GameState = Readonly<{
  phase: GamePhase;
  competitors: readonly Competitor[];
  /** Index into `competitors` of whoever holds the phone. */
  holder: number;
  deck: Deck;
  currentPhrase: string | null;
  settings: GameSettings;
  /**
   * Competitor whose score changed when the buzzer fired: the scoring team
   * (teams) or the caught player (solo). Null outside roundEnd/gameOver and
   * while a steal is unresolved.
   */
  lastScorer: number | null;
}>;

export type GameEvent =
  | Readonly<{
      type: "START_GAME";
      names: readonly string[];
      deck: Deck;
      settings: GameSettings;
    }>
  | Readonly<{ type: "CORRECT" }>
  | Readonly<{ type: "SKIP" }>
  | Readonly<{ type: "BUZZER" }>
  | Readonly<{ type: "RESOLVE_STEAL"; stolen: boolean }>
  | Readonly<{ type: "START_NEXT_ROUND" }>
  | Readonly<{ type: "REMATCH" }>
  | Readonly<{ type: "NEW_GAME" }>;

export type Category = Readonly<{
  id: string;
  name: string;
  emoji: string;
  phrases: readonly string[];
  /**
   * Kept out of the "Everything" mix while still directly selectable.
   * Used by the easy/kids deck so it can't water down a grown-up game.
   */
  excludeFromMix?: boolean;
}>;

/** Random number generator returning a float in [0, 1). Injectable for tests. */
export type Rng = () => number;
