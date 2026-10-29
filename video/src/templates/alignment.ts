import type { Caption } from "@remotion/captions";

export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export const alignmentToCaptions = (alignment: Alignment): Caption[] => {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } =
    alignment;
  if (characters.length !== starts.length || characters.length !== ends.length) {
    throw new Error("Alignment arrays have different lengths");
  }

  const captions: Caption[] = [];
  let word = "";
  let start = 0;
  let end = 0;

  const flush = () => {
    if (!word) {
      return;
    }
    captions.push({
      text: captions.length === 0 ? word : ` ${word}`,
      startMs: Math.round(start * 1000),
      endMs: Math.round(end * 1000),
      timestampMs: Math.round(((start + end) / 2) * 1000),
      confidence: null,
    });
    word = "";
  };

  characters.forEach((char, i) => {
    if (/\s/.test(char)) {
      flush();
      return;
    }
    if (!word) {
      start = starts[i];
    }
    word += char;
    end = ends[i];
  });
  flush();

  return captions;
};
