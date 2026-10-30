import type { Caption } from "@remotion/captions";
import type { MEME_SECTIONS, MemeId } from "../brand/memes";

export type Format = "E" | "F" | "Q";

// question + congrats are the same in every reel (template scenes): open by asking the
// viewer about the topic, close by telling them they learned it, then the follow CTA.
export const SECTION_ORDER = [
  "question",
  "hook",
  "setup",
  "mechanism",
  "payoff",
  "congrats",
  "cta",
] as const;
export type SectionId = (typeof SECTION_ORDER)[number];

export type ScriptSection = {
  id: SectionId;
  // Copied verbatim from ideas/idea-NN-slug/idea.md (npm run tracker checks it).
  voiceover: string;
  // The script's Visual / animation note, kept for reference.
  visual: string;
};

export type PostScript = {
  // Folder name under src/posts and public/posts, e.g. "post-02-gps".
  id: string;
  postNumber: number;
  format: Format;
  title: string;
  // Short on-screen hook (max 2 lines), shown from frame 0.
  hookText: string;
  // One word of hookText to color amber.
  hookHighlight?: string;
  // Topic keyword (e.g. "GPS"), colored amber in the question and congrats cards.
  topic: string;
  // Shown as "Source: ..." for the last 3 s.
  source: string;
  // Optional, at most one per reel: an approved meme shown briefly right after `cue`
  // is spoken in `section`. Leave it out when no meme genuinely fits.
  meme?: {
    id: MemeId;
    section: (typeof MEME_SECTIONS)[number];
    cue: string;
    seconds?: number;
  };
  // F posts only: section that gets the WHEN IT FAILED badge.
  failureSection?: SectionId;
  sections: ScriptSection[];
  // Facts flagged "verify" in the script. Must be checked before rendering.
  verify: string[];
};

export type VoSection = {
  id: SectionId;
  // The exact text that was synthesized. Used to detect stale audio.
  text: string;
  // Path under public/, or null when timing is estimated.
  file: string | null;
  durationMs: number;
  // Section-local timings.
  captions: Caption[];
};

export type VoManifest = {
  postId: string;
  estimated: boolean;
  sections: VoSection[];
};

// Carousels (format C): 1080x1350 stills, one per slide.
export type SlideKind = "cover" | "content" | "recap" | "cta";

export type CarouselSlide = {
  kind: SlideKind;
  // Copied verbatim from the ## Slides table in idea.md (npm run tracker checks it).
  headline: string;
  body: string;
};

export type CarouselScript = {
  // Folder name under src/posts, e.g. "post-18-gps-steps".
  id: string;
  postNumber: number;
  title: string;
  // One word of the cover headline to color amber.
  coverHighlight?: string;
  // Shown as "Source: ..." on the recap slide.
  source: string;
  // Reel idea this carousel accompanies.
  companionOf?: number;
  slides: CarouselSlide[];
  // Facts flagged "verify". Must be checked before posting.
  verify: string[];
};
