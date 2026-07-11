export type TeamIndex = 0 | 1;

export type Team = Readonly<{
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
  targetScore: number;
}>;

export type GamePhase = "setup" | "roundActive" | "roundEnd" | "gameOver";

export type GameState = Readonly<{
  phase: GamePhase;
  teams: readonly [Team, Team];
  holdingTeam: TeamIndex;
  deck: Deck;
  currentPhrase: string | null;
  settings: GameSettings;
  /** Team awarded the point when the buzzer fired; null outside roundEnd/gameOver. */
  lastPointWinner: TeamIndex | null;
}>;

export type GameEvent =
  | Readonly<{
      type: "START_GAME";
      teams: readonly [string, string];
      deck: Deck;
      settings: GameSettings;
    }>
  | Readonly<{ type: "CORRECT" }>
  | Readonly<{ type: "SKIP" }>
  | Readonly<{ type: "BUZZER" }>
  | Readonly<{ type: "RESOLVE_STEAL"; stolen: boolean }>
  | Readonly<{ type: "START_NEXT_ROUND" }>
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
