import type { SfxName } from "../brand/audio";
import type { SectionTiming } from "./timing";

export type AudioCue = { name: SfxName; from: number };

// Template-level sound design shared by every reel. Deliberately sparse: no sound on
// section changes (a whoosh there landed on the end of every voice line and sounded odd).
export const audioCues = (sections: SectionTiming[], crossfadeFrames: number): AudioCue[] => [
  { name: "pop", from: 0 },
  ...sections
    .filter((s) => s.id === "congrats")
    .map((s) => ({ name: "chime" as const, from: s.from + Math.round(crossfadeFrames / 2) })),
];
