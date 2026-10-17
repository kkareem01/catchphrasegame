import { describe, expect, it } from "vitest";
import { BEEP_TONE } from "./constants";
import { beepTone, takeDueBeeps } from "./scheduling";

describe("takeDueBeeps", () => {
  const offsets = [0, 100, 200, 300, 400];

  it("returns beeps inside the lookahead window and advances the cursor", () => {
    const result = takeDueBeeps(offsets, 0, 0, 150, 50);
    expect(result.due).toEqual([0, 100]);
    expect(result.nextIndex).toBe(2);
  });

  it("resumes from the cursor so no beep is scheduled twice", () => {
    const result = takeDueBeeps(offsets, 2, 120, 150, 50);
    expect(result.due).toEqual([200]);
    expect(result.nextIndex).toBe(3);
  });

  it("drops beeps that are too late to play (e.g. after an audio hiccup)", () => {
    const result = takeDueBeeps(offsets, 0, 260, 100, 50);
    expect(result.due).toEqual([300]);
    expect(result.nextIndex).toBe(4);
  });

  it("returns nothing once every beep is taken", () => {
    expect(takeDueBeeps(offsets, 5, 900, 100, 50)).toEqual({
      due: [],
      nextIndex: 5,
    });
  });
});

describe("beepTone", () => {
  it("rises in pitch and loudness as the round runs out", () => {
    const start = beepTone(0, 60_000);
    const middle = beepTone(30_000, 60_000);
    const end = beepTone(60_000, 60_000);
    expect(start.frequency).toBe(BEEP_TONE.startHz);
    expect(end.frequency).toBe(BEEP_TONE.endHz);
    expect(middle.frequency).toBeGreaterThan(start.frequency);
    expect(middle.frequency).toBeLessThan(end.frequency);
    expect(end.gain).toBeGreaterThan(start.gain);
  });

  it("clamps out-of-range offsets", () => {
    expect(beepTone(-5, 1_000)).toEqual(beepTone(0, 1_000));
    expect(beepTone(5_000, 1_000)).toEqual(beepTone(1_000, 1_000));
  });
});
