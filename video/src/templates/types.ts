import type { Caption } from "@remotion/captions";

export type Format = "E" | "F" | "Q";

export const SECTION_ORDER = ["hook", "setup", "mechanism", "payoff", "cta"] as const;
export type SectionId = (typeof SECTION_ORDER)[number];

export type ScriptSection = {
  id: SectionId;
  // Copied verbatim from Posts/post_N/script.md.
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
  // Shown as "Source: ..." for the last 3 s.
  source: string;
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
