import type { Caption } from "@remotion/captions";
import type { ModelId } from "../brand/models";
import type { Look } from "./look";

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

// Sound effects (docs/audio.md). Template cards keep their
// own sounds, so cues only go in the post's own sections.
export const SFX_SECTIONS = ["hook", "setup", "mechanism", "payoff"] as const;
export type SfxSection = (typeof SFX_SECTIONS)[number];

export type SfxCustomSound = { prompt: string; seconds: number; volume?: number };

export type SfxCue = {
  // A shared sound from brand/audio.ts or a key of `custom`.
  sound: string;
  section: SfxSection;
  // Word spoken in that section (first occurrence, same matching as useCue).
  cue: string;
  // -15 to 15. Negative leads the word: a swell that builds into it.
  offsetFrames?: number;
};

export type SfxPlan = { custom?: Record<string, SfxCustomSound>; cues: SfxCue[] };

// Written by `npm run sfx` next to the generated files.
export type SfxManifestSound = { prompt: string; seconds: number; model: string; file: string };
export type SfxManifest = { postId: string; sounds: Record<string, SfxManifestSound> };

export type PostScript = {
  // Folder name under src/posts and public/posts, e.g. "post-02-gps".
  id: string;
  postNumber: number;
  format: Format;
  title: string;
  // Short on-screen hook (max 2 lines), shown as the hook title when the hook starts.
  hookText: string;
  // false hides the hook title (e.g. when it would repeat the VO over a 3D hook); the
  // Blender hook clip then gets the whole visual region. Default true.
  hookTitle?: boolean;
  // One word of hookText to color amber.
  hookHighlight?: string;
  // Topic keyword (e.g. "GPS"), colored amber in the question and congrats cards.
  topic: string;
  // Shown as "Source: ..." for the last 3 s.
  source: string;
  // Pins question card / hook title / transition mix styles. Unset slots rotate by
  // postNumber (see templates/look.ts).
  look?: Partial<Look>;
  // Blender-rendered 3D (frame-0 backdrop, hook, mechanism, cover). Posts built before
  // Blender opt out with a reason. See docs/blender.md.
  blender: BlenderPlan | { optOut: string };
  // Sound effects placed on spoken words. Posts built before SFX opt out with a reason.
  sfx: SfxPlan | { optOut: string };
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

// ---- Blender 3D (docs/blender.md) ----

// Camera framing. yaw/pitch in degrees around the model, zoom 1 = whole model fits.
export type Shot = {
  yaw: number;
  pitch: number;
  zoom: number;
  // Catalog part drawn amber (the one key element). Omit for no amber.
  keyPart?: string;
  // Parts pulled apart along the model's explode axis.
  exploded?: boolean;
  // Degrees the camera turns around its view axis: the model looks tilted on screen.
  roll?: number;
  // Wide shots and clip starts: the part to center on instead of the model's center
  // (when the visible parts sit off-center once others are hidden).
  aim?: string;
  // Clip start only: slow orbit in degrees per second (default 4). Lower it for flat models,
  // which the default turns edge-on over a long clip.
  drift?: number;
  // Worlds: screen height of the focus, 0 top to 1 bottom (default 0.42, above the captions).
  frameY?: number;
  // Sea world, clip start: the water with only the bow wave, or calm (default).
  sea?: "calm" | "bowWave";
  // Coast world, clip start: where the model sits (default sea). The backdrop always shows the shore.
  coast?: CoastPlacement;
};

export const BEAT_ACTIONS = [
  "reveal",
  "focus",
  "explode",
  "collapse",
  "spin",
  "flow",
  "label",
  "shot",
  // Camera pulls back to the whole model (amber unchanged): the wide after close-ups.
  "wide",
  // Amber off and spinning parts spin down (an engine dying, a machine switching off).
  "stop",
  // A part slides to `by`; the model's `flex` parts (springs) stretch to stay attached.
  "shift",
  // A catalog `appearOnly` part scales in. Those parts are hidden until this beat.
  "appear",
  // An `appearOnly` part scales back out (air jets switching off).
  "vanish",
  // A part (or each part of a group) turns to `by` degrees about x, y, z from rest; parts
  // attached to it (catalog `attach`) turn with it. A swashplate tilting, blades changing pitch.
  "tilt",
] as const;
export type BeatAction = (typeof BEAT_ACTIONS)[number];

// One visual beat, started when `cue` is spoken in its section.
export type Beat = {
  cue: string;
  // Fraction of the section used if the cue word isn't found in the VO timing.
  fallback: number;
  do: BeatAction;
  // focus / spin / flow (from) / label / shift / tilt / appear / vanish: a catalog part
  // (shift / tilt: or a group).
  part?: string;
  // flow: destination part.
  to?: string;
  // flow: the camera follows the dot into a close-up of the destination. Default true.
  follow?: boolean;
  // shift: offset from the part's rest place (a catalog `groups` name moves its parts together), in model units (the model's longest side is
  // 2). [0, 0, 0] sends it home.
  by?: readonly [number, number, number];
  // tilt: degrees about x, y, z from the part's rest pose. [0, 0, 0] turns it back.
  // shift / tilt: how many frames the move takes (default 14). 0 is instant: a part that starts
  // somewhere else (a train placed off-screen at frame 0, then shifted home at speed).
  frames?: number;
  // label: 2D text (a number or unit, never words the VO already says).
  label?: string;
  // shot / focus / wide: camera change. On focus, omit zoom: the close-up is sized
  // from the part's bounding box.
  shot?: Partial<Shot>;
};

// Opaque full-frame environments (docs/blender.md).
export const WORLDS = ["sea", "coast", "track", "bench", "cafe", "rail", "snow"] as const;
export const COAST_PLACEMENTS = ["sea", "shore", "land"] as const;
export type CoastPlacement = (typeof COAST_PLACEMENTS)[number];
export type WorldId = (typeof WORLDS)[number];

export type BlenderPlan = {
  model: ModelId;
  // Renders every clip inside a world, and adds a backdrop clip behind the 2D sections.
  world?: WorldId;
  // Every new reel needs a world. Only posts built before worlds were required set this
  // reason instead (validateScript enforces one or the other).
  worldOptOut?: string;
  // Cover title, at most 4 words. Defaults to hookText.
  coverText?: string;
  // Word of the cover title colored amber. Defaults to hookHighlight.
  coverHighlight?: string;
  cover: Shot;
  // Frame-0 backdrop behind the question card (whole question section). Optional beats
  // (cued on the question line), e.g. a rotor already spinning at frame 0.
  opener: Shot & { beats?: Beat[] };
  hook: Shot & { beats?: Beat[] };
  mechanism: Shot & { beats: Beat[] };
};

export const BLENDER_CLIPS = ["cover", "opener", "hook", "mechanism", "backdrop"] as const;
export type BlenderClipId = (typeof BLENDER_CLIPS)[number];

// Written by Blender next to the PNG sequences.
export type BlenderLabelTrack = {
  text: string;
  // Per frame: position as a 0-1 fraction of the clip (x right, y down), null when hidden.
  // Per frame: part center [x, y] and the part's screen top (0-1 in the clip), or null
  // when the label is hidden. Older renders have no top.
  points: ([number, number] | [number, number, number] | null)[];
};

export type BlenderManifestClip = {
  hash: string;
  // Hash of the model's GLB. A mismatch makes the clip stale. Older renders have none.
  modelHash?: string;
  // Hash of the shared Blender code. Only `npm run blender` compares it (re-renders, never blocks).
  codeHash?: string;
  frames: number;
  width: number;
  height: number;
  // Rendered at reduced size with `--preview`: fine in Studio, refused for final renders.
  preview: boolean;
  blenderVersion: string;
  labels: BlenderLabelTrack[];
  // Cover only: the model's screen box (0-1, top-left origin: x0, y0, x1, y1) and, in a
  // world, a second model-only layer (cover/subject/0000.png) that Cover.tsx puts in front
  // of the title.
  subjectBox?: [number, number, number, number] | null;
  subject?: boolean;
};

// Written by scripts/blender.ts next to the PNG sequences; one entry per rendered clip.
export type BlenderManifest = {
  postId: string;
  clips: Partial<Record<BlenderClipId, BlenderManifestClip>>;
};
