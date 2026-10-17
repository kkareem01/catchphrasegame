import { BEEP_TONE } from "./constants";

/**
 * Lookahead window: picks the beep offsets (ms from round start) that should
 * be booked on the audio clock now. Beeps more than `lateToleranceMs` overdue
 * are dropped, so a stalled-then-recovered context doesn't fire a burst.
 */
export const takeDueBeeps = (
  offsets: readonly number[],
  fromIndex: number,
  elapsedMs: number,
  lookaheadMs: number,
  lateToleranceMs: number,
): Readonly<{ due: readonly number[]; nextIndex: number }> => {
  const horizon = elapsedMs + lookaheadMs;
  let nextIndex = fromIndex;
  while (nextIndex < offsets.length && offsets[nextIndex] < horizon) {
    nextIndex++;
  }
  const due = offsets
    .slice(fromIndex, nextIndex)
    .filter((offset) => offset >= elapsedMs - lateToleranceMs);
  return { due, nextIndex };
};

const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

/** Tension curve: later beeps are higher and louder. */
export const beepTone = (
  offsetMs: number,
  roundDurationMs: number,
): Readonly<{ frequency: number; gain: number }> => {
  const progress = Math.min(1, Math.max(0, offsetMs / roundDurationMs));
  return {
    frequency: lerp(BEEP_TONE.startHz, BEEP_TONE.endHz, progress),
    gain: lerp(BEEP_TONE.startGain, BEEP_TONE.endGain, progress),
  };
};
