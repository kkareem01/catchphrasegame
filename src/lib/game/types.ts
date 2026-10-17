/** One of the two teams. */
export type Competitor = Readonly<{
  name: string;
  score: number;
}>;

export type Deck = Readonly<{
  remaining: readonly string[];
  used: readonly string[];
}>;

export type GameSettings = Readonly<{
  categoryId: string;
  stealRuleEnabled: boolean;
  /** Points to win. */
  targetScore: number;
}>;

export type GamePhase = "setup" | "roundActive" | "roundEnd" | "gameOver";

export type GameState = Readonly<{
  phase: GamePhase;
  /** The two teams. */
  competitors: readonly Competitor[];
  /** Index of the team holding the phone. */
  holder: number;
  deck: Deck;
  currentPhrase: string | null;
  settings: GameSettings;
  /**
   * Team awarded the point when the buzzer fired. Null outside
   * roundEnd/gameOver and while a steal is unresolved.
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
