import { describe, expect, it } from "vitest";
import type { AudioOutput } from "./audioEngine";
import { BEEP_TONE, BUZZER, CORRECT_NOTES_HZ } from "./constants";
import { FakeAudioContext, FakeOscillator } from "./__fakes__/fakeAudioContext";
import { playBeep, playBuzzer, playCorrect } from "./sounds";

const setup = () => {
  const context = new FakeAudioContext();
  const output = {
    context,
    destination: context.destination,
  } as unknown as AudioOutput;
  return { context, output };
};

const oscillators = (context: FakeAudioContext) =>
  context.sources.filter((s): s is FakeOscillator => s instanceof FakeOscillator);

describe("playBeep", () => {
  it("schedules one short square tone at the requested pitch", () => {
    const { context, output } = setup();
    const sources = playBeep(output, 2, { frequency: 1_200, gain: 0.8 });
    expect(sources).toHaveLength(1);
    const [osc] = oscillators(context);
    expect(osc.type).toBe("square");
    expect(osc.frequency.events[0]).toMatchObject({ value: 1_200, time: 2 });
    expect(osc.startedAt).toBe(2);
    expect(osc.stoppedAt).toBeCloseTo(2 + BEEP_TONE.durationMs / 1_000);
  });
});

describe("playCorrect", () => {
  it("plays a rising arpeggio, one note after another", () => {
    const { context, output } = setup();
    playCorrect(output, 0);
    const triangles = oscillators(context).filter((o) => o.type === "triangle");
    expect(triangles.map((o) => o.frequency.events[0].value)).toEqual(CORRECT_NOTES_HZ);
    const starts = triangles.map((o) => o.startedAt ?? -1);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(new Set(starts).size).toBe(CORRECT_NOTES_HZ.length);
  });
});

describe("playBuzzer", () => {
  it("is long — the tail rings for the full configured length", () => {
    const { context, output } = setup();
    const sources = playBuzzer(output, 1);
    const end = Math.max(...sources.map((s) => (s as unknown as FakeOscillator).stoppedAt ?? 0));
    expect(end - 1).toBeCloseTo(BUZZER.totalMs / 1_000);
    expect(end - 1).toBeGreaterThanOrEqual(2.5);
    expect(context.sources.every((s) => s.startedAt === 1)).toBe(true);
  });

  it("layers a noise explosion with a low boom and a harsh buzz", () => {
    const { context, output } = setup();
    playBuzzer(output, 0);
    const oscs = oscillators(context);
    const noise = context.sources.filter((s) => !(s instanceof FakeOscillator));
    expect(noise).toHaveLength(1);
    expect(oscs.some((o) => o.type === "sine")).toBe(true);
    expect(oscs.filter((o) => o.type === "square" || o.type === "sawtooth")).toHaveLength(
      BUZZER.buzz.frequenciesHz.length,
    );
  });

  it("reuses one noise buffer per context", () => {
    const { context, output } = setup();
    playBuzzer(output, 0);
    playBuzzer(output, 3);
    const buffers = context.sources
      .filter((s) => !(s instanceof FakeOscillator))
      .map((s) => (s as unknown as { buffer: unknown }).buffer);
    expect(buffers[0]).toBe(buffers[1]);
  });
});
