import {
  BEEP_PHASES,
  ROUND_DURATION_MAX_MS,
  ROUND_DURATION_MIN_MS,
} from "./constants";
import type { Rng } from "./types";

/** Draws a hidden round duration uniformly from the configured range. */
export const generateRoundDurationMs = (rng: Rng): number =>
  Math.round(
    ROUND_DURATION_MIN_MS +
      rng() * (ROUND_DURATION_MAX_MS - ROUND_DURATION_MIN_MS),
  );

/**
 * Builds the beep timeline for a round: offsets (ms from round start) at
 * which a beep plays. Beeps start immediately and accelerate through the
 * configured phases; the buzzer (not included here) fires at `durationMs`.
 */
export const generateBeepSchedule = (durationMs: number): readonly number[] => {
  const offsets: number[] = [];
  let t = 0;
  while (t < durationMs) {
    offsets.push(t);
    const fractionElapsed = t / durationMs;
    const phase =
      BEEP_PHASES.find((p) => fractionElapsed < p.endFraction) ??
      BEEP_PHASES[BEEP_PHASES.length - 1];
    t += phase.intervalMs;
  }
  return offsets;
};
