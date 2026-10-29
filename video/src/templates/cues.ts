import type { Caption } from "@remotion/captions";

export const normalizeWord = (text: string) => text.toLowerCase().replace(/[^a-z0-9']/g, "");

// Section-local time (ms) at which `word` is first spoken, or null.
export const findCueMs = (captions: Caption[], word: string): number | null => {
  const target = normalizeWord(word);
  const match = captions.find((c) => normalizeWord(c.text) === target);
  return match ? match.startMs : null;
};
