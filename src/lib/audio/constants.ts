/**
 * Sound design constants. Phone speakers barely reproduce anything below
 * ~300 Hz, so every sound carries most of its energy between 1–4 kHz or as
 * broadband noise. A limiter on the master bus lets us drive levels hard
 * without clipping.
 */

/** Pre-limiter drive. Higher = louder perceived level, more compression. */
export const MASTER_DRIVE = 1.8;

export const LIMITER = {
  thresholdDb: -6,
  kneeDb: 3,
  ratio: 20,
  attackS: 0.002,
  releaseS: 0.18,
} as const;

/** Tick beep: pitch and level climb as the hidden timer runs out. */
export const BEEP_TONE = {
  startHz: 1_046.5, // C6
  endHz: 1_568, // G6
  startGain: 0.7,
  endGain: 1,
  durationMs: 95,
  attackMs: 3,
  /** Held at full level this long, then a fast release: a punchy "bip". */
  holdMs: 65,
} as const;

/** "Got it!" chime: quick major arpeggio (C6–E6–G6). */
export const CORRECT_NOTES_HZ: readonly number[] = [1_046.5, 1_318.5, 1_568];
export const CORRECT_NOTE_MS = 70;
export const CORRECT_GAIN = 0.8;

/** Time's-up blast: boom + filtered noise explosion + harsh error buzz. */
export const BUZZER = {
  totalMs: 3_000,
  boom: { startHz: 150, endHz: 38, sweepMs: 500, gain: 0.85, decayMs: 1_200 },
  blast: {
    startCutoffHz: 7_000,
    endCutoffHz: 300,
    sweepMs: 2_800,
    gain: 0.9,
    attackMs: 12,
    /** Full blast holds, then a long rumbling tail. */
    holdMs: 700,
    /** Level the tail passes through at `tailAtMs` before dying out. */
    tailGain: 0.3,
    tailAtMs: 1_900,
    drive: 30,
  },
  buzz: {
    frequenciesHz: [147, 156] as readonly number[], // D3 + E♭3: a grating semitone
    gain: 0.55,
    holdMs: 1_600,
    releaseMs: 800,
    pitchDrop: 0.6,
    drive: 12,
    tremoloHz: 14,
    tremoloDepth: 0.25,
  },
} as const;

/** Round scheduler: how often it wakes and how far ahead it books beeps. */
export const SCHEDULER_TICK_MS = 25;
export const SCHEDULER_LOOKAHEAD_MS = 120;
/** A beep this late (audio resumed after a hiccup) is dropped, not bunched up. */
export const SCHEDULER_LATE_TOLERANCE_MS = 150;

/** Health check: a "running" context whose clock moved < 25% of wall time is frozen. */
export const STALL_MIN_WALL_MS = 1_500;
export const STALL_RATIO = 0.25;

/** How long an old context lingers after a rebuild so in-flight sounds finish. */
export const RETIRE_DELAY_MS = 4_000;

/** Silent loop used to escape the iOS ring/silent switch on pre-16.4 iOS. */
export const SILENT_LOOP = { sampleRate: 8_000, durationS: 0.5 } as const;
