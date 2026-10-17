import {
  LIMITER,
  MASTER_DRIVE,
  STALL_MIN_WALL_MS,
  STALL_RATIO,
} from "./constants";

/** Browser hooks, injected so the self-healing logic is testable. */
export type AudioEnvironment = Readonly<{
  createContext: () => AudioContext;
  now: () => number;
  onVisibilityChange: (listener: (visible: boolean) => void) => void;
  /** Routes audio past the iOS silent switch; false if the API is missing. */
  setPlaybackSession: () => boolean;
  /** Pre-16.4 iOS fallback: a looping silent <audio> forces playback mode. */
  startSilentLoop: () => void;
  retireDelayMs: number;
}>;

export type AudioOutput = Readonly<{
  context: AudioContext;
  destination: AudioNode;
}>;

type ClockProbe = Readonly<{ audioS: number; wallMs: number }>;

/** States after which a context never recovers by itself on iOS. */
const DEAD_STATES: readonly string[] = ["closed", "interrupted"];

/**
 * Owns one AudioContext and keeps it healthy. Mobile browsers break audio in
 * several silent ways (iOS interruptions, background "zombie" contexts that
 * report running but output nothing, refused resumes). `unlock()` runs on
 * every tap and replaces a broken context with a fresh one, so sound comes
 * back without restarting the app.
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private master: AudioNode | null = null;
  private needsRebuild = false;
  private probe: ClockProbe | null = null;
  private listening = false;

  constructor(private readonly env: AudioEnvironment) {}

  /** Call from inside a user gesture (tap/click/key). Safe to call often. */
  unlock(): void {
    try {
      this.listen();
      if (!this.env.setPlaybackSession()) this.env.startSilentLoop();
      if (this.shouldRebuild()) this.rebuild();
      this.resumeIfNeeded();
    } catch (error) {
      console.warn("[audio] unlock failed; continuing without sound", error);
      this.context = null;
      this.master = null;
    }
  }

  /** The live output, or null when audio is unavailable right now. */
  getOutput(): AudioOutput | null {
    const { context, master } = this;
    if (!context || !master || context.state !== "running") return null;
    return { context, destination: master };
  }

  private listen(): void {
    if (this.listening) return;
    this.listening = true;
    this.env.onVisibilityChange((visible) => {
      if (!visible) {
        // iOS often returns from background with a context that claims to
        // run but is silent. Swap it out on the next tap.
        this.needsRebuild = true;
      } else {
        this.resumeIfNeeded();
      }
    });
  }

  private shouldRebuild(): boolean {
    const { context } = this;
    if (!context || this.needsRebuild) return true;
    if (DEAD_STATES.includes(context.state)) return true;
    return this.isClockFrozen(context);
  }

  private isClockFrozen(context: AudioContext): boolean {
    if (context.state !== "running" || !this.probe) return false;
    const wallMs = this.env.now() - this.probe.wallMs;
    const audioMs = (context.currentTime - this.probe.audioS) * 1_000;
    if (wallMs < STALL_MIN_WALL_MS) return false;
    this.recordProbe(context);
    return audioMs < wallMs * STALL_RATIO;
  }

  private recordProbe(context: AudioContext): void {
    this.probe = { audioS: context.currentTime, wallMs: this.env.now() };
  }

  private rebuild(): void {
    const previous = this.context;
    const context = this.env.createContext();
    this.context = context;
    this.master = buildMasterBus(context);
    this.needsRebuild = false;
    this.probe = null;

    context.onstatechange = () => {
      if (this.context !== context) return;
      if (DEAD_STATES.includes(context.state)) this.needsRebuild = true;
      if (context.state === "running") this.recordProbe(context);
    };
    primeContext(context);
    if (previous) this.retire(previous);
  }

  private resumeIfNeeded(): void {
    const { context } = this;
    if (!context || context.state === "running") return;
    if (DEAD_STATES.includes(context.state)) return;
    context.resume().catch((error: unknown) => {
      console.warn("[audio] resume refused; rebuilding on next tap", error);
      this.needsRebuild = true;
    });
  }

  /** Lets in-flight sounds (e.g. the buzzer tail) finish, then frees it. */
  private retire(context: AudioContext): void {
    context.onstatechange = null;
    setTimeout(() => {
      context.close().catch(() => {
        // Already closed — nothing to free.
      });
    }, this.env.retireDelayMs);
  }
}

/** Drive gain → brick-wall-ish limiter → speakers. */
const buildMasterBus = (context: AudioContext): AudioNode => {
  const drive = context.createGain();
  drive.gain.value = MASTER_DRIVE;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = LIMITER.thresholdDb;
  limiter.knee.value = LIMITER.kneeDb;
  limiter.ratio.value = LIMITER.ratio;
  limiter.attack.value = LIMITER.attackS;
  limiter.release.value = LIMITER.releaseS;
  drive.connect(limiter);
  limiter.connect(context.destination);
  return drive;
};

/** Playing a 1-sample silent buffer inside the gesture unlocks older iOS. */
const primeContext = (context: AudioContext): void => {
  const source = context.createBufferSource();
  source.buffer = context.createBuffer(1, 1, 22_050);
  source.connect(context.destination);
  source.start(0);
};
