// Pure sample processing for generated sounds. Remotion's ffmpeg has no afade, areverse,
// silenceremove or volumedetect, so this happens here and ffmpeg only decodes and encodes.
const FULL_SCALE = 32767;
const PEAK_DB = -3;
const SILENCE_DB = -50;
const FADE_IN_MS = 5;
const FADE_OUT_MS = 30;

const dbToLinear = (db: number) => 10 ** (db / 20);

// Starts right on the sound so cues land on the word, at a common peak, with no clicks.
// `samples` is interleaved; every step works in whole frames.
export const cleanSfxSamples = (
  samples: Int16Array,
  channels: number,
  sampleRate: number,
): Int16Array => {
  const threshold = FULL_SCALE * dbToLinear(SILENCE_DB);
  const frames = Math.floor(samples.length / channels);
  const isLoud = (frame: number) => {
    for (let c = 0; c < channels; c++) {
      if (Math.abs(samples[frame * channels + c]) >= threshold) {
        return true;
      }
    }
    return false;
  };
  let first = 0;
  while (first < frames && !isLoud(first)) {
    first++;
  }
  if (first === frames) {
    throw new Error("Generated sound is silent; regenerate it");
  }
  let last = frames - 1;
  while (!isLoud(last)) {
    last--;
  }

  const trimmed = samples.slice(first * channels, (last + 1) * channels);
  const peak = trimmed.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const gain = (FULL_SCALE * dbToLinear(PEAK_DB)) / peak;

  const count = last - first + 1;
  const fadeIn = Math.max(1, Math.round((FADE_IN_MS / 1000) * sampleRate));
  const fadeOut = Math.max(1, Math.round((FADE_OUT_MS / 1000) * sampleRate));
  const out = new Int16Array(trimmed.length);
  for (let frame = 0; frame < count; frame++) {
    const envelope = Math.min(1, frame / fadeIn, (count - 1 - frame) / fadeOut);
    for (let c = 0; c < channels; c++) {
      out[frame * channels + c] = Math.round(trimmed[frame * channels + c] * gain * envelope);
    }
  }
  return out;
};

export const pcmToWav = (samples: Int16Array, channels: number, sampleRate: number): Buffer => {
  const bytes = samples.length * 2;
  const wav = Buffer.alloc(44 + bytes);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + bytes, 4);
  wav.write("WAVEfmt ", 8, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * 2, 28);
  wav.writeUInt16LE(channels * 2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(bytes, 40);
  samples.forEach((v, i) => wav.writeInt16LE(v, 44 + i * 2));
  return wav;
};

export const wavToPcm = (wav: Buffer): Int16Array => {
  const data = wav.indexOf("data");
  const start = data + 8;
  const bytes = wav.subarray(start, start + wav.readUInt32LE(data + 4));
  return new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
};
