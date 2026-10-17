import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioEngine, type AudioEnvironment } from "./audioEngine";

/** Minimal stand-in for the parts of AudioContext the engine touches. */
class FakeContext {
  state: string = "suspended";
  currentTime = 0;
  onstatechange: (() => void) | null = null;
  resumeShouldFail = false;
  closed = false;
  readonly destination = {};

  resume = vi.fn(async () => {
    if (this.resumeShouldFail) throw new Error("resume refused");
    this.setState("running");
  });
  close = vi.fn(async () => {
    this.closed = true;
    this.setState("closed");
  });

  setState(state: string) {
    this.state = state;
    this.onstatechange?.();
  }

  private node = () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: { value: 1 },
    threshold: { value: 0 },
    knee: { value: 0 },
    ratio: { value: 0 },
    attack: { value: 0 },
    release: { value: 0 },
  });
  createGain = vi.fn(this.node);
  createDynamicsCompressor = vi.fn(this.node);
  createBuffer = vi.fn(() => ({}));
  createBufferSource = vi.fn(() => ({
    ...this.node(),
    buffer: null,
    start: vi.fn(),
  }));
}

type Harness = {
  env: AudioEnvironment;
  contexts: FakeContext[];
  setVisible: (visible: boolean) => void;
  advanceWall: (ms: number) => void;
  sessionSupported: boolean;
  silentLoopStarts: number;
};

const createHarness = (sessionSupported = true): Harness => {
  let wall = 0;
  let visibilityListener: ((visible: boolean) => void) | null = null;
  const harness: Harness = {
    contexts: [],
    sessionSupported,
    silentLoopStarts: 0,
    setVisible: (visible) => visibilityListener?.(visible),
    advanceWall: (ms) => {
      wall += ms;
    },
    env: {
      createContext: () => {
        const ctx = new FakeContext();
        harness.contexts.push(ctx);
        return ctx as unknown as AudioContext;
      },
      now: () => wall,
      onVisibilityChange: (listener) => {
        visibilityListener = listener;
      },
      setPlaybackSession: () => harness.sessionSupported,
      startSilentLoop: () => {
        harness.silentLoopStarts += 1;
      },
      retireDelayMs: 0,
    },
  };
  return harness;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("AudioEngine", () => {
  let h: Harness;
  let engine: AudioEngine;

  beforeEach(() => {
    h = createHarness();
    engine = new AudioEngine(h.env);
  });

  it("creates and resumes a context on the first unlock", async () => {
    expect(engine.getOutput()).toBeNull();
    engine.unlock();
    await flush();
    expect(h.contexts).toHaveLength(1);
    expect(h.contexts[0].resume).toHaveBeenCalled();
    expect(engine.getOutput()?.context).toBe(h.contexts[0]);
  });

  it("reuses a healthy context on later taps", async () => {
    engine.unlock();
    await flush();
    engine.unlock();
    await flush();
    expect(h.contexts).toHaveLength(1);
  });

  it("rebuilds after an iOS interruption (phone call, Siri)", async () => {
    engine.unlock();
    await flush();
    h.contexts[0].setState("interrupted");
    expect(engine.getOutput()).toBeNull();
    engine.unlock();
    await flush();
    expect(h.contexts).toHaveLength(2);
    expect(engine.getOutput()?.context).toBe(h.contexts[1]);
  });

  it("rebuilds a context the browser closed", async () => {
    engine.unlock();
    await flush();
    h.contexts[0].setState("closed");
    engine.unlock();
    await flush();
    expect(h.contexts).toHaveLength(2);
  });

  it("rebuilds after the app was backgrounded (zombie-context workaround)", async () => {
    engine.unlock();
    await flush();
    h.setVisible(false);
    h.setVisible(true);
    engine.unlock();
    await flush();
    expect(h.contexts).toHaveLength(2);
  });

  it("rebuilds when resume() is refused", async () => {
    engine.unlock();
    await flush();
    h.contexts[0].setState("suspended");
    h.contexts[0].resumeShouldFail = true;
    engine.unlock();
    await flush();
    engine.unlock();
    await flush();
    expect(h.contexts).toHaveLength(2);
  });

  it("rebuilds a context that claims to run but whose clock is frozen", async () => {
    engine.unlock();
    await flush();
    h.advanceWall(5_000); // audio clock stays at 0 — nothing is playing
    engine.unlock();
    await flush();
    expect(h.contexts).toHaveLength(2);
  });

  it("keeps a context whose clock is advancing normally", async () => {
    engine.unlock();
    await flush();
    h.advanceWall(5_000);
    h.contexts[0].currentTime = 5;
    engine.unlock();
    await flush();
    expect(h.contexts).toHaveLength(1);
  });

  it("retires the old context after rebuilding", async () => {
    engine.unlock();
    await flush();
    h.contexts[0].setState("interrupted");
    engine.unlock();
    await flush();
    expect(h.contexts[0].close).toHaveBeenCalled();
  });

  it("only falls back to the silent <audio> loop without the Audio Session API", async () => {
    engine.unlock();
    expect(h.silentLoopStarts).toBe(0);

    const legacy = createHarness(false);
    new AudioEngine(legacy.env).unlock();
    expect(legacy.silentLoopStarts).toBe(1);
  });

  it("survives a context constructor that throws", () => {
    const broken = new AudioEngine({
      ...h.env,
      createContext: () => {
        throw new Error("no audio hardware");
      },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => broken.unlock()).not.toThrow();
    expect(broken.getOutput()).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
