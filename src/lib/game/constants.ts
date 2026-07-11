/** Selectable "first to N points" targets shown on the home screen. */
export const TARGET_SCORE_OPTIONS: readonly number[] = [3, 5, 7, 10];

/** Default winning score (classic Catch Phrase). */
export const DEFAULT_TARGET_SCORE = 7;

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

/** Beep tone (Hz) and duration. */
export const BEEP_FREQUENCY_HZ = 880;
export const BEEP_DURATION_MS = 80;

/** Buzzer tone (Hz) and duration. */
export const BUZZER_FREQUENCY_HZ = 160;
export const BUZZER_DURATION_MS = 1_200;

/** Rising two-note chime played when a phrase is guessed correctly. */
export const CORRECT_TONE_FREQUENCIES: readonly number[] = [660, 988];
export const CORRECT_TONE_DURATION_MS = 90;

/** Vibration pattern (ms on/off) fired with the buzzer, where supported. */
export const BUZZER_VIBRATION_PATTERN: readonly number[] = [400, 100, 400];

/** Default team names shown on the home screen. */
export const DEFAULT_TEAM_NAMES: readonly [string, string] = ["Team 1", "Team 2"];

/**
 * Placeholder for a future per-turn skip limit setting.
 * v1 rule: unlimited skips; skipped phrases return to the bottom of the deck.
 */
export const MAX_SKIPS_PER_TURN = Infinity;
