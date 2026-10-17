import { describe, expect, it } from "vitest";
import { createSilentWav, makeDistortionCurve } from "./waveforms";

describe("makeDistortionCurve", () => {
  it("is an odd, bounded, monotonic transfer curve", () => {
    const curve = makeDistortionCurve(20, 257);
    expect(curve).toHaveLength(257);
    expect(curve[0]).toBeCloseTo(-1);
    expect(curve[128]).toBeCloseTo(0);
    expect(curve[256]).toBeCloseTo(1);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1]);
    }
  });

  it("drives quiet signals harder as the amount increases", () => {
    const soft = makeDistortionCurve(2, 257);
    const hard = makeDistortionCurve(40, 257);
    expect(hard[160]).toBeGreaterThan(soft[160]);
  });
});

describe("createSilentWav", () => {
  it("builds a valid 8-bit mono PCM WAV of silence", () => {
    const bytes = createSilentWav(8_000, 0.5);
    const text = (start: number, end: number) =>
      String.fromCharCode(...bytes.slice(start, end));
    const view = new DataView(bytes.buffer);
    expect(text(0, 4)).toBe("RIFF");
    expect(text(8, 12)).toBe("WAVE");
    expect(text(36, 40)).toBe("data");
    expect(view.getUint32(24, true)).toBe(8_000);
    expect(view.getUint32(40, true)).toBe(4_000);
    expect(bytes.length).toBe(44 + 4_000);
    // 8-bit PCM silence is the midpoint value 128.
    expect(bytes.slice(44).every((b) => b === 128)).toBe(true);
  });
});
