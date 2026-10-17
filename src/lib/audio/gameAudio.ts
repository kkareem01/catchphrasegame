import { AudioEngine, type AudioOutput } from "./audioEngine";
import { createBrowserEnvironment } from "./browserEnvironment";
import {
  SCHEDULER_LATE_TOLERANCE_MS,
  SCHEDULER_LOOKAHEAD_MS,
  SCHEDULER_TICK_MS,
} from "./constants";
import { beepTone, takeDueBeeps } from "./scheduling";
import { playBeep, playBuzzer, playCorrect } from "./sounds";

const MS = 1_000;
const PREVIEW_BEEPS_MS: readonly number[] = [0, 260, 460, 620, 760];
const PREVIEW_BUZZER_MS = 950;

type Round = Readonly<{
  offsets: readonly number[];
  durationMs: number;
  startedAtMs: number;
}>;

/**
 * The game's sound board. Round beeps are booked a few ms ahead on the audio
 * clock (sample-accurate) by a short-interval scheduler instead of all up
 * front, so if the context is rebuilt mid-round the beeps carry on with it.
 */
type Engine = Pick<AudioEngine, "unlock" | "getOutput">;

export class GameAudio {
  private engine: Engine | null = null;
  private round: Round | null = null;
  private nextBeep = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly roundSources = new Set<AudioScheduledSourceNode>();

  constructor(
    private readonly createEngine: () => Engine | null,
    private readonly now: () => number = () => performance.now(),
  ) {}

  /** Wire to every user gesture: starts audio and heals a broken context. */
  unlock(): void {
    this.engine ??= this.createEngine();
    this.engine?.unlock();
  }

  startRound(offsets: readonly number[], durationMs: number): void {
    this.stopRound();
    this.round = { offsets, durationMs, startedAtMs: this.now() };
    this.nextBeep = 0;
    this.timer = setInterval(() => this.tick(), SCHEDULER_TICK_MS);
    this.tick();
  }

  stopRound(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.round = null;
    for (const source of this.roundSources) stopQuietly(source);
    this.roundSources.clear();
  }

  playCorrect(): void {
    this.withOutput((output) => playCorrect(output, output.context.currentTime));
  }

  playBuzzer(): void {
    this.withOutput((output) => playBuzzer(output, output.context.currentTime));
  }

  /** Settings "Test sound": a few speeding beeps, then the buzzer. */
  playPreview(): void {
    this.withOutput((output) => {
      const now = output.context.currentTime;
      PREVIEW_BEEPS_MS.forEach((offset, index) => {
        playBeep(output, now + offset / MS, beepTone(index, PREVIEW_BEEPS_MS.length - 1));
      });
      playBuzzer(output, now + PREVIEW_BUZZER_MS / MS);
    });
  }

  private tick(): void {
    const { round } = this;
    if (!round) return;
    const elapsed = this.now() - round.startedAtMs;
    const { due, nextIndex } = takeDueBeeps(
      round.offsets,
      this.nextBeep,
      elapsed,
      SCHEDULER_LOOKAHEAD_MS,
      SCHEDULER_LATE_TOLERANCE_MS,
    );
    const output = this.engine?.getOutput();
    // Without live audio, keep the cursor moving so beeps don't pile up.
    this.nextBeep = nextIndex;
    if (!output) return;
    for (const offset of due) {
      const at = output.context.currentTime + Math.max(0, offset - elapsed) / MS;
      for (const source of playBeep(output, at, beepTone(offset, round.durationMs))) {
        this.roundSources.add(source);
        source.onended = () => this.roundSources.delete(source);
      }
    }
  }

  private withOutput(play: (output: AudioOutput) => unknown): void {
    const output = this.engine?.getOutput();
    if (!output) return;
    try {
      play(output);
    } catch (error) {
      console.warn("[audio] failed to play sound", error);
    }
  }
}

const stopQuietly = (source: AudioScheduledSourceNode): void => {
  try {
    source.stop();
    source.disconnect();
  } catch {
    // Already stopped — fine.
  }
};

/** Module-level singleton: one sound board for the whole app. */
export const gameAudio = new GameAudio(() =>
  typeof window === "undefined" ? null : new AudioEngine(createBrowserEnvironment()),
);
