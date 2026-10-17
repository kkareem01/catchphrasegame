/**
 * Soft-clip transfer curve for a WaveShaperNode: tanh(k·x) normalised to
 * ±1. Adds grit/harmonics so low sounds become audible on tiny speakers.
 */
export const makeDistortionCurve = (
  amount: number,
  samples = 1_024,
): Float32Array<ArrayBuffer> => {
  const curve = new Float32Array(samples);
  const norm = Math.tanh(amount);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = Math.tanh(amount * x) / norm;
  }
  return curve;
};

const SILENCE_8BIT = 128;
const WAV_HEADER_BYTES = 44;

/** Builds an 8-bit mono PCM WAV file containing only silence. */
export const createSilentWav = (
  sampleRate: number,
  durationS: number,
): Uint8Array<ArrayBuffer> => {
  const dataBytes = Math.round(sampleRate * durationS);
  const bytes = new Uint8Array(WAV_HEADER_BYTES + dataBytes);
  const view = new DataView(bytes.buffer);
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byte rate (1 byte per sample)
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample
  writeText(36, "data");
  view.setUint32(40, dataBytes, true);
  bytes.fill(SILENCE_8BIT, WAV_HEADER_BYTES);
  return bytes;
};
