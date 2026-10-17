/** Selectable "first to N points" targets shown on the home screen. */
export const TARGET_SCORE_OPTIONS: readonly number[] = [3, 5, 7, 10];

/** Default winning score (classic Catch Phrase). */
export const DEFAULT_TARGET_SCORE = 7;

/** Most player names each team can list. */
export const MAX_PLAYERS_PER_TEAM = 10;

/** Longest team/player name accepted from the setup screen or storage. */
export const MAX_NAME_LENGTH = 14;

/** Round duration is drawn uniformly from this range (hidden from players). */
export const ROUND_DURATION_MIN_MS = 45_000;
export const ROUND_DURATION_MAX_MS = 90_000;

/**
 * Beep pacing: the round is split into three phases by elapsed fraction,
 * each with a fixed interval between beeps. Later phases beep faster.
 */
export const BEEP_PHASES: readonly Readonly<{
  /** Fraction of the round duration at which this phase ends. */
  endFraction: number;
  intervalMs: number;
}>[] = [
  { endFraction: 0.5, intervalMs: 1_000 },
  { endFraction: 0.8, intervalMs: 550 },
  { endFraction: 1.0, intervalMs: 280 },
];

/** Vibration patterns (ms on/off), where supported (not iOS). */
export const BUZZER_VIBRATION_PATTERN: readonly number[] = [600, 120, 600, 120, 900];
export const CORRECT_VIBRATION_PATTERN: readonly number[] = [35];

/** Ignore a second "Got it!" tap this soon after the first (accidental double tap). */
export const CORRECT_TAP_COOLDOWN_MS = 450;

/** Default team names shown on the home screen. */
export const DEFAULT_TEAM_NAMES: readonly [string, string] = ["Team 1", "Team 2"];

/** Prefix for blank team names ("Team 1", "Team 2"). */
export const DEFAULT_TEAM_PREFIX = "Team";

/**
 * Placeholder for a future per-turn skip limit setting.
 * v1 rule: unlimited skips; skipped phrases return to the bottom of the deck.
 */
export const MAX_SKIPS_PER_TURN = Infinity;
