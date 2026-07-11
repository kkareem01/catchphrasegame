import {
  BEEP_DURATION_MS,
  BEEP_FREQUENCY_HZ,
  BUZZER_DURATION_MS,
  BUZZER_FREQUENCY_HZ,
  CORRECT_TONE_DURATION_MS,
  CORRECT_TONE_FREQUENCIES,
} from "@/lib/game/constants";

const MS_PER_SECOND = 1_000;
const BEEP_GAIN = 0.25;
const BUZZER_GAIN = 0.5;
const CORRECT_GAIN = 0.3;

/**
 * Thin wrapper around one AudioContext. Beeps are scheduled against the
 * audio clock (sample-accurate, immune to JS timer throttling).
 *
 * `unlock()` MUST be called from inside a user-gesture handler (a tap) —
 * iOS Safari refuses to start audio otherwise.
 */
class BeepPlayer {
  private context: AudioContext | null = null;
  private scheduled: OscillatorNode[] = [];

  unlock(): void {
    if (typeof window === "undefined") return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
      }
      if (this.context.state === "suspended") {
        void this.context.resume();
      }
    } catch {
      // Audio is a nice-to-have; the game runs silently without it.
      this.context = null;
    }
  }

  /** True once unlock() has produced a running AudioContext. */
  isReady(): boolean {
    return this.context !== null;
  }

  /** Schedules every beep of a round plus the final buzzer. */
  scheduleRound(beepOffsetsMs: readonly number[], buzzerAtMs: number): void {
    if (!this.context) return;
    const startTime = this.context.currentTime;
    for (const offset of beepOffsetsMs) {
      this.scheduleTone(startTime + offset / MS_PER_SECOND, {
        frequency: BEEP_FREQUENCY_HZ,
        durationMs: BEEP_DURATION_MS,
        gain: BEEP_GAIN,
        type: "square",
      });
    }
    this.scheduleTone(startTime + buzzerAtMs / MS_PER_SECOND, {
      frequency: BUZZER_FREQUENCY_HZ,
      durationMs: BUZZER_DURATION_MS,
      gain: BUZZER_GAIN,
      type: "sawtooth",
    });
  }

  /** Plays a short rising chime immediately (a phrase was guessed right). */
  playCorrect(): void {
    if (!this.context) return;
    const startTime = this.context.currentTime;
    CORRECT_TONE_FREQUENCIES.forEach((frequency, index) => {
      this.scheduleTone(
        startTime + (index * CORRECT_TONE_DURATION_MS) / MS_PER_SECOND,
        {
          frequency,
          durationMs: CORRECT_TONE_DURATION_MS,
          gain: CORRECT_GAIN,
          type: "triangle",
        },
      );
    });
  }

  /** Cancels everything scheduled (round quit or unmount). */
  cancelAll(): void {
    for (const oscillator of this.scheduled) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch {
        // Already stopped — fine.
      }
    }
    this.scheduled = [];
  }

  private scheduleTone(
    atTime: number,
    tone: Readonly<{
      frequency: number;
      durationMs: number;
      gain: number;
      type: OscillatorType;
    }>,
  ): void {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    oscillator.type = tone.type;
    oscillator.frequency.value = tone.frequency;

    const endTime = atTime + tone.durationMs / MS_PER_SECOND;
    gainNode.gain.setValueAtTime(tone.gain, atTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    oscillator.start(atTime);
    oscillator.stop(endTime);
    this.scheduled.push(oscillator);
  }
}

/** Module-level singleton: one AudioContext for the whole app. */
export const beepPlayer = new BeepPlayer();
