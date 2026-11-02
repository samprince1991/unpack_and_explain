import type { Caption } from "@remotion/captions";

// Keeps inner apostrophes ("don't") but drops quote marks around a word ("'make", "app',").
export const normalizeWord = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9']/g, "")
    .replace(/^'+|'+$/g, "");

// Section-local time (ms) at which `word` is first spoken, or null. A part of a
// hyphenated word counts too ("pounds" in "pounds-versus-kilograms"), at that word's start.
export const findCueMs = (captions: Caption[], word: string): number | null => {
  const target = normalizeWord(word);
  const match = captions.find(
    (c) =>
      normalizeWord(c.text) === target ||
      c.text.split("-").some((part) => normalizeWord(part) === target),
  );
  return match ? match.startMs : null;
};
