/**
 * Just enough of the Web Audio graph to assert what our synths schedule.
 * Mirrors real-browser failure modes we care about (e.g. exponential ramps
 * to zero throw).
 */
export class FakeParam {
  value = 0;
  readonly events: { kind: string; value: number; time: number }[] = [];
  setValueAtTime(value: number, time: number) {
    this.events.push({ kind: "set", value, time });
    return this;
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.events.push({ kind: "linear", value, time });
    return this;
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    if (value <= 0) throw new RangeError("exponential ramp target must be > 0");
    this.events.push({ kind: "exp", value, time });
    return this;
  }
}

export class FakeNode {
  readonly connections: unknown[] = [];
  connect<T>(node: T): T {
    this.connections.push(node);
    return node;
  }
  disconnect() {
    this.connections.length = 0;
  }
}

export class FakeSource extends FakeNode {
  startedAt: number | null = null;
  stoppedAt: number | null = null;
  stopCalls = 0;
  onended: (() => void) | null = null;
  start(time = 0) {
    this.startedAt = time;
  }
  stop(time = 0) {
    if (this.startedAt === null) throw new Error("stop() before start()");
    this.stopCalls += 1;
    this.stoppedAt = time;
  }
}

export class FakeOscillator extends FakeSource {
  type = "sine";
  readonly frequency = new FakeParam();
}

export class FakeBufferSource extends FakeSource {
  buffer: unknown = null;
}

export class FakeAudioContext {
  currentTime = 0;
  readonly sampleRate = 8_000;
  state = "running";
  readonly destination = new FakeNode();
  readonly sources: FakeSource[] = [];

  createOscillator() {
    return this.track(new FakeOscillator());
  }
  createBufferSource() {
    return this.track(new FakeBufferSource());
  }
  createGain() {
    return Object.assign(new FakeNode(), { gain: new FakeParam() });
  }
  createBiquadFilter() {
    return Object.assign(new FakeNode(), { type: "lowpass", frequency: new FakeParam() });
  }
  createWaveShaper() {
    return Object.assign(new FakeNode(), { curve: null, oversample: "none" });
  }
  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }

  private track<T extends FakeSource>(source: T): T {
    this.sources.push(source);
    return source;
  }
}
