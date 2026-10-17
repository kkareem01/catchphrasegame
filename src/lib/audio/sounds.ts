import {
  BEEP_TONE,
  BUZZER,
  CORRECT_GAIN,
  CORRECT_NOTE_MS,
  CORRECT_NOTES_HZ,
} from "./constants";
import type { AudioOutput } from "./audioEngine";
import { makeDistortionCurve } from "./waveforms";

/** Every synth returns its source nodes so a caller can cancel them. */
type Sources = readonly AudioScheduledSourceNode[];

const MS = 1_000;
/** Exponential ramps can't reach 0; this is inaudible. */
const SILENT = 0.0001;

/** Attack → optional hold at peak → exponential release to silence. */
const envelope = (
  context: BaseAudioContext,
  at: number,
  peak: number,
  attackS: number,
  endS: number,
  holdS = attackS,
): GainNode => {
  const gain = context.createGain();
  gain.gain.setValueAtTime(SILENT, at);
  gain.gain.linearRampToValueAtTime(peak, at + attackS);
  gain.gain.setValueAtTime(peak, at + holdS);
  gain.gain.exponentialRampToValueAtTime(SILENT, at + endS);
  return gain;
};

const tone = (
  { context, destination }: AudioOutput,
  at: number,
  spec: Readonly<{
    type: OscillatorType;
    frequency: number;
    gain: number;
    attackS: number;
    durationS: number;
    holdS?: number;
  }>,
): AudioScheduledSourceNode => {
  const osc = context.createOscillator();
  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.frequency, at);
  const amp = envelope(context, at, spec.gain, spec.attackS, spec.durationS, spec.holdS);
  osc.connect(amp).connect(destination);
  osc.start(at);
  osc.stop(at + spec.durationS);
  return osc;
};

/** Sharp square "bip" — square waves cut through party noise. */
export const playBeep = (
  output: AudioOutput,
  at: number,
  { frequency, gain }: Readonly<{ frequency: number; gain: number }>,
): Sources => [
  tone(output, at, {
    type: "square",
    frequency,
    gain,
    attackS: BEEP_TONE.attackMs / MS,
    durationS: BEEP_TONE.durationMs / MS,
    holdS: BEEP_TONE.holdMs / MS,
  }),
];

/** Bright rising arpeggio for a correct guess. */
export const playCorrect = (output: AudioOutput, at: number): Sources =>
  CORRECT_NOTES_HZ.flatMap((frequency, index) => {
    const start = at + (index * CORRECT_NOTE_MS) / MS;
    const durationS = (CORRECT_NOTE_MS * 1.6) / MS;
    return [
      tone(output, start, {
        type: "triangle",
        frequency,
        gain: CORRECT_GAIN,
        attackS: 0.004,
        durationS,
      }),
      tone(output, start, {
        type: "square",
        frequency: frequency * 2,
        gain: CORRECT_GAIN * 0.15,
        attackS: 0.004,
        durationS,
      }),
    ];
  });

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

const whiteNoise = (context: BaseAudioContext): AudioBuffer => {
  const cached = noiseBuffers.get(context);
  if (cached) return cached;
  const length = Math.ceil((context.sampleRate * BUZZER.totalMs) / MS);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffers.set(context, buffer);
  return buffer;
};

const shaper = (context: BaseAudioContext, drive: number): WaveShaperNode => {
  const node = context.createWaveShaper();
  node.curve = makeDistortionCurve(drive);
  node.oversample = "2x";
  return node;
};

/** Low thump — felt on bigger speakers, adds weight to the blast. */
const boom = ({ context, destination }: AudioOutput, at: number): Sources => {
  const { startHz, endHz, sweepMs, gain, decayMs } = BUZZER.boom;
  const osc = context.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(startHz, at);
  osc.frequency.exponentialRampToValueAtTime(endHz, at + sweepMs / MS);
  osc.connect(envelope(context, at, gain, 0.005, decayMs / MS)).connect(destination);
  osc.start(at);
  osc.stop(at + decayMs / MS);
  return [osc];
};

/** Distorted noise with a closing low-pass: the "explosion" — loud on phones. */
const blast = ({ context, destination }: AudioOutput, at: number): Sources => {
  const b = BUZZER.blast;
  const totalS = BUZZER.totalMs / MS;
  const source = context.createBufferSource();
  source.buffer = whiteNoise(context);
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(b.startCutoffHz, at);
  filter.frequency.exponentialRampToValueAtTime(b.endCutoffHz, at + b.sweepMs / MS);

  const amp = context.createGain();
  amp.gain.setValueAtTime(SILENT, at);
  amp.gain.linearRampToValueAtTime(b.gain, at + b.attackMs / MS);
  amp.gain.setValueAtTime(b.gain, at + b.holdMs / MS);
  amp.gain.exponentialRampToValueAtTime(b.tailGain, at + b.tailAtMs / MS);
  amp.gain.exponentialRampToValueAtTime(SILENT, at + totalS);

  source
    .connect(filter)
    .connect(shaper(context, b.drive))
    .connect(amp)
    .connect(destination);
  source.start(at);
  source.stop(at + totalS);
  return [source];
};

/** Grating two-note "wrong answer" buzz with tremolo and a pitch drop. */
const errorBuzz = ({ context, destination }: AudioOutput, at: number): Sources => {
  const b = BUZZER.buzz;
  const holdS = b.holdMs / MS;
  const endS = holdS + b.releaseMs / MS;

  const tremolo = context.createGain();
  tremolo.gain.value = 1 - b.tremoloDepth;
  const lfo = context.createOscillator();
  lfo.frequency.value = b.tremoloHz;
  const lfoDepth = context.createGain();
  lfoDepth.gain.value = b.tremoloDepth;
  lfo.connect(lfoDepth).connect(tremolo.gain);

  const amp = context.createGain();
  amp.gain.setValueAtTime(SILENT, at);
  amp.gain.linearRampToValueAtTime(b.gain, at + 0.01);
  amp.gain.setValueAtTime(b.gain, at + holdS);
  amp.gain.exponentialRampToValueAtTime(SILENT, at + endS);

  const distortion = shaper(context, b.drive);
  distortion.connect(tremolo).connect(amp).connect(destination);

  const voices = b.frequenciesHz.map((frequency, index) => {
    const osc = context.createOscillator();
    osc.type = index === 0 ? "square" : "sawtooth";
    osc.frequency.setValueAtTime(frequency, at);
    osc.frequency.setValueAtTime(frequency, at + holdS);
    osc.frequency.exponentialRampToValueAtTime(frequency * b.pitchDrop, at + endS);
    osc.connect(distortion);
    return osc;
  });

  const sources = [lfo, ...voices];
  for (const source of sources) {
    source.start(at);
    source.stop(at + endS);
  }
  return sources;
};

/** The time's-up sound: ~3 s of boom, blast and buzz. */
export const playBuzzer = (output: AudioOutput, at: number): Sources => [
  ...boom(output, at),
  ...blast(output, at),
  ...errorBuzz(output, at),
];
