import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AudioOutput } from "./audioEngine";
import { SCHEDULER_LOOKAHEAD_MS, SCHEDULER_TICK_MS } from "./constants";
import { FakeAudioContext } from "./__fakes__/fakeAudioContext";
import { GameAudio } from "./gameAudio";

const setup = () => {
  let wallMs = 0;
  const context = new FakeAudioContext();
  const output = { context, destination: context.destination } as unknown as AudioOutput;
  let live: AudioOutput | null = output;
  const engine = { unlock: vi.fn(), getOutput: vi.fn(() => live) };
  const audio = new GameAudio(() => engine, () => wallMs);
  audio.unlock();
  const advance = (ms: number) => {
    wallMs += ms;
    context.currentTime += ms / 1_000;
    vi.advanceTimersByTime(ms);
  };
  return {
    audio,
    context,
    engine,
    advance,
    setLive: (on: boolean) => {
      live = on ? output : null;
    },
  };
};

describe("GameAudio", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates the engine once and forwards every unlock", () => {
    const createEngine = vi.fn(() => ({ unlock: vi.fn(), getOutput: () => null }));
    const audio = new GameAudio(createEngine);
    audio.unlock();
    audio.unlock();
    expect(createEngine).toHaveBeenCalledTimes(1);
  });

  it("does nothing on the server (no engine)", () => {
    const audio = new GameAudio(() => null);
    expect(() => {
      audio.unlock();
      audio.playBuzzer();
      audio.startRound([0], 1_000);
      audio.stopRound();
    }).not.toThrow();
  });

  it("books beeps just ahead of time instead of all at once", () => {
    const { audio, context, advance } = setup();
    audio.startRound([0, 500, 1_000, 1_500], 2_000);
    expect(context.sources).toHaveLength(1);
    advance(500 - SCHEDULER_LOOKAHEAD_MS + SCHEDULER_TICK_MS);
    expect(context.sources).toHaveLength(2);
  });

  it("schedules each beep exactly once as time passes", () => {
    const { audio, context, advance } = setup();
    audio.startRound([0, 500, 1_000, 1_500], 2_000);
    for (let t = 0; t < 2_000; t += SCHEDULER_TICK_MS) advance(SCHEDULER_TICK_MS);
    expect(context.sources.map((s) => s.startedAt)).toHaveLength(4);
    // Each beep lands at (or just after) its offset on the audio clock.
    const starts = context.sources.map((s) => s.startedAt ?? 0);
    [0, 0.5, 1, 1.5].forEach((expected, i) => {
      expect(starts[i]).toBeGreaterThanOrEqual(expected - 0.001);
      expect(starts[i]).toBeLessThan(expected + SCHEDULER_LOOKAHEAD_MS / 1_000);
    });
  });

  it("skips beeps while audio is down and doesn't burst them on recovery", () => {
    const { audio, context, advance, setLive } = setup();
    setLive(false);
    audio.startRound([0, 200, 400, 1_000], 2_000);
    for (let t = 0; t < 600; t += SCHEDULER_TICK_MS) advance(SCHEDULER_TICK_MS);
    expect(context.sources).toHaveLength(0);
    setLive(true);
    for (let t = 600; t < 1_200; t += SCHEDULER_TICK_MS) advance(SCHEDULER_TICK_MS);
    expect(context.sources).toHaveLength(1);
  });

  it("stops pending beeps when the round ends", () => {
    const { audio, context, advance } = setup();
    audio.startRound([0, 50, 100], 1_000);
    advance(SCHEDULER_TICK_MS);
    audio.stopRound();
    expect(context.sources.length).toBeGreaterThan(0);
    expect(context.sources.every((s) => s.stopCalls >= 2)).toBe(true);
    const count = context.sources.length;
    advance(500);
    expect(context.sources).toHaveLength(count);
  });

  it("forgets beeps that finished playing", () => {
    const { audio, context } = setup();
    audio.startRound([0], 1_000);
    context.sources[0].onended?.();
    audio.stopRound();
    expect(context.sources[0].stopCalls).toBe(1);
  });

  it("plays one-shot sounds only when audio is live", () => {
    const { audio, context, setLive } = setup();
    audio.playCorrect();
    const afterCorrect = context.sources.length;
    expect(afterCorrect).toBeGreaterThan(0);
    audio.playBuzzer();
    expect(context.sources.length).toBeGreaterThan(afterCorrect);
    setLive(false);
    const count = context.sources.length;
    audio.playBuzzer();
    expect(context.sources).toHaveLength(count);
  });

  it("previews beeps followed by the buzzer", () => {
    const { audio, context } = setup();
    audio.playPreview();
    const squares = context.sources.filter(
      (s) => (s as unknown as { type?: string }).type === "square",
    );
    expect(squares.length).toBeGreaterThan(3);
    const latestStart = Math.max(...context.sources.map((s) => s.startedAt ?? 0));
    expect(latestStart).toBeGreaterThan(0.5);
  });

  it("keeps the game alive if a synth throws", () => {
    const { audio, context } = setup();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    context.createOscillator = () => {
      throw new Error("boom");
    };
    expect(() => audio.playCorrect()).not.toThrow();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
