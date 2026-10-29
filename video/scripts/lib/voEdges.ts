// ElevenLabs' request stitching (previous_text / next_text) sometimes leaves the first
// sound of the NEXT section at the very end of a file: a short burst after the final
// silence. In the reel it plays ~0.6 s before the next section's real first word and
// sounds like a stutter ("E... Each"). This finds where to cut it off.

export const FRAME_MS = 10;
// Gap of near-silence that separates the bleed from the real speech.
export const MIN_GAP_MS = 120;
// Anything after that gap longer than this is real speech, not bleed.
export const MAX_BLEED_MS = 300;
// Silence kept after the last real word, so the cut lands inside the gap.
export const KEEP_SILENCE_MS = 40;

// RMS per FRAME_MS window of 16-bit mono samples.
export const rmsEnvelope = (samples: Int16Array, sampleRate: number): number[] => {
  const size = Math.round((sampleRate * FRAME_MS) / 1000);
  const env: number[] = [];
  for (let i = 0; i < samples.length; i += size) {
    const end = Math.min(i + size, samples.length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += samples[j] * samples[j];
    }
    env.push(Math.sqrt(sum / (end - i)));
  }
  return env;
};

// New length in ms if the file ends with a bleed, otherwise null. The cut must come
// after `lastWordStartMs` so a real short last word ("..., too.") is never removed.
export const findTailBleed = (env: number[], lastWordStartMs: number): number | null => {
  const peak = Math.max(...env);
  const threshold = Math.max(30, peak * 0.005);
  const loud = env.map((v) => v >= threshold);

  let last = loud.lastIndexOf(true);
  if (last < 0) {
    return null;
  }
  // Walk back over the final sound island until a long enough silent gap.
  const minGap = MIN_GAP_MS / FRAME_MS;
  let islandStart = last;
  let quiet = 0;
  for (let i = last; i >= 0; i--) {
    if (loud[i]) {
      islandStart = i;
      quiet = 0;
    } else if (++quiet >= minGap) {
      break;
    }
  }
  if (quiet < minGap) {
    return null;
  }
  last += 1;
  const islandMs = (last - islandStart) * FRAME_MS;
  const cutMs = islandStart * FRAME_MS - (MIN_GAP_MS - KEEP_SILENCE_MS);
  if (islandMs > MAX_BLEED_MS || cutMs <= lastWordStartMs + 150) {
    return null;
  }
  return cutMs;
};
