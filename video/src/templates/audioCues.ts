import type { SfxName } from "../brand/audio";
import type { SectionTiming } from "./timing";

export type AudioCue = { name: SfxName; from: number };

// Template-level sound design shared by every reel.
export const audioCues = (sections: SectionTiming[], crossfadeFrames: number): AudioCue[] => [
  { name: "pop", from: 0 },
  ...sections
    .slice(1)
    .filter((s) => s.id !== "cta")
    .map((s) => ({ name: "whoosh" as const, from: s.from })),
  ...sections
    .filter((s) => s.id === "cta")
    .map((s) => ({ name: "chime" as const, from: s.from + Math.round(crossfadeFrames / 2) })),
];
