import { describe, expect, it } from "vitest";
import { generateBeepSchedule, generateRoundDurationMs } from "./beepSchedule";
import {
  BEEP_PHASES,
  ROUND_DURATION_MAX_MS,
  ROUND_DURATION_MIN_MS,
} from "./constants";

describe("generateRoundDurationMs", () => {
  it("returns the minimum when rng yields 0", () => {
    expect(generateRoundDurationMs(() => 0)).toBe(ROUND_DURATION_MIN_MS);
  });

  it("stays strictly below the maximum when rng approaches 1", () => {
    const duration = generateRoundDurationMs(() => 0.999999);
    expect(duration).toBeLessThanOrEqual(ROUND_DURATION_MAX_MS);
    expect(duration).toBeGreaterThan(ROUND_DURATION_MIN_MS);
  });

  it("always falls within the configured range", () => {
    for (const r of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const duration = generateRoundDurationMs(() => r);
      expect(duration).toBeGreaterThanOrEqual(ROUND_DURATION_MIN_MS);
      expect(duration).toBeLessThanOrEqual(ROUND_DURATION_MAX_MS);
    }
  });
});

describe("generateBeepSchedule", () => {
  const DURATION = 60_000;
  const schedule = generateBeepSchedule(DURATION);

  it("starts with a beep at time zero", () => {
    expect(schedule[0]).toBe(0);
  });

  it("is strictly increasing", () => {
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i]).toBeGreaterThan(schedule[i - 1]);
    }
  });

  it("keeps every beep before the buzzer time", () => {
    expect(schedule[schedule.length - 1]).toBeLessThan(DURATION);
  });

  it("accelerates: gaps never grow as the round progresses", () => {
    const gaps: number[] = [];
    for (let i = 1; i < schedule.length; i++) {
      gaps.push(schedule[i] - schedule[i - 1]);
    }
    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i]).toBeLessThanOrEqual(gaps[i - 1]);
    }
  });

  it("uses the configured interval within each phase", () => {
    const firstPhaseEnd = BEEP_PHASES[0].endFraction * DURATION;
    const earlyGaps: number[] = [];
    for (let i = 1; i < schedule.length && schedule[i] < firstPhaseEnd; i++) {
      earlyGaps.push(schedule[i] - schedule[i - 1]);
    }
    expect(earlyGaps.length).toBeGreaterThan(0);
    for (const gap of earlyGaps) {
      expect(gap).toBe(BEEP_PHASES[0].intervalMs);
    }
  });

  it("produces a sensible beep count for the full duration range", () => {
    for (const duration of [45_000, 67_500, 90_000]) {
      const s = generateBeepSchedule(duration);
      expect(s.length).toBeGreaterThan(duration / 2_000);
      expect(s.length).toBeLessThan(duration / 200);
    }
  });
});
