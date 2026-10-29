import type { Caption } from "@remotion/captions";

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9']/g, "");

// Section-local time (ms) at which `word` is first spoken, or null.
export const findCueMs = (captions: Caption[], word: string): number | null => {
  const target = normalize(word);
  const match = captions.find((c) => normalize(c.text) === target);
  return match ? match.startMs : null;
};
