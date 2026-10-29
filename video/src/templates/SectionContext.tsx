import type { Caption } from "@remotion/captions";
import { createContext, useContext } from "react";
import { useVideoConfig } from "remotion";
import { findCueMs } from "./cues";

type Section = { captions: Caption[]; durationInFrames: number };

export const SectionContext = createContext<Section | null>(null);

export const useSection = (): Section => {
  const section = useContext(SectionContext);
  if (!section) {
    throw new Error("useSection must be used inside a Reel section");
  }
  return section;
};

// Local frame at which `word` is spoken in this section. Falls back to a fraction
// of the section length if the word isn't found (e.g. after a script edit).
export const useCue = (word: string, fallbackFraction: number): number => {
  const { captions, durationInFrames } = useSection();
  const { fps } = useVideoConfig();
  const ms = findCueMs(captions, word);
  return ms === null
    ? Math.round(durationInFrames * fallbackFraction)
    : Math.round((ms / 1000) * fps);
};
