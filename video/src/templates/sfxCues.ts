import {
  SFX_CUSTOM_VOLUME,
  SFX_MODEL,
  sfx as sharedSfx,
  type AudioLibrary,
  type SfxName,
} from "../brand/audio";
import { findCueMs } from "./cues";
import type { SectionTiming } from "./timing";
import type {
  PostScript,
  SfxCustomSound,
  SfxManifest,
  SfxManifestSound,
  SfxPlan,
  VoSection,
} from "./types";

// Starting values, tuned by ear on post 26.
export const SFX_LIMITS = {
  cuesPerReel: 8,
  cuesInMechanism: 4,
  customSounds: 3,
  customMinSeconds: 0.5,
  customMaxSeconds: 4,
  maxOffsetFrames: 15,
  minGapSeconds: 1,
} as const;

// Fade at the end of each cue, so a sound capped at its section end never cuts off.
export const SFX_FADE_FRAMES = 6;

export type ResolvedSfxCue = {
  sound: string;
  from: number;
  durationInFrames: number;
  volume: number;
};

export const isSfxPlan = (plan: PostScript["sfx"]): plan is SfxPlan => "cues" in plan;

export const isSharedSfx = (name: string): name is SfxName =>
  Object.keys(sharedSfx).includes(name);

export const sfxManifestPath = (postId: string) => `posts/${postId}/sfx/sfx.json`;

// Frame and length of every cue. Sections overlap by the transition, so a section really
// ends at from + duration - crossfade, which is where its sounds must be gone.
export const resolveSfxCues = (
  plan: SfxPlan,
  vo: VoSection[],
  timings: SectionTiming[],
  fps: number,
  crossfadeFrames: number,
): ResolvedSfxCue[] =>
  plan.cues
    .map((cue) => {
      const section = vo.find((s) => s.id === cue.section);
      const timing = timings.find((t) => t.id === cue.section);
      if (!section || !timing) {
        throw new Error(`SFX cue "${cue.cue}": no section ${cue.section}`);
      }
      const ms = findCueMs(section.captions, cue.cue);
      if (ms === null) {
        throw new Error(`SFX cue "${cue.cue}" is not spoken in the ${cue.section} VO`);
      }
      const end = timing.from + timing.durationInFrames - crossfadeFrames;
      const raw = timing.from + Math.round((ms / 1000) * fps) + (cue.offsetFrames ?? 0);
      const from = Math.max(timing.from, Math.min(raw, end - 1));
      const custom = plan.custom?.[cue.sound];
      const shared = isSharedSfx(cue.sound) ? sharedSfx[cue.sound] : undefined;
      const seconds = custom?.seconds ?? shared?.seconds ?? 1;
      return {
        sound: cue.sound,
        from,
        durationInFrames: Math.max(1, Math.min(Math.round(seconds * fps), end - from)),
        volume: custom
          ? (custom.volume ?? SFX_CUSTOM_VOLUME)
          : (shared?.volume ?? SFX_CUSTOM_VOLUME),
      };
    })
    .sort((a, b) => a.from - b.from);

// Needs VO timing, so it can't live in validateScript.
export const sfxGapProblems = (cues: ResolvedSfxCue[], fps: number): string[] =>
  cues.flatMap((cue, i) => {
    const next = cues[i + 1];
    return next && next.from - cue.from < SFX_LIMITS.minGapSeconds * fps
      ? [`SFX "${cue.sound}" and "${next.sound}" are under ${SFX_LIMITS.minGapSeconds} s apart`]
      : [];
  });

export const sfxSoundIsCurrent = (
  entry: SfxManifestSound | undefined,
  sound: SfxCustomSound,
): boolean =>
  entry !== undefined &&
  entry.prompt === sound.prompt &&
  entry.seconds === sound.seconds &&
  entry.model === SFX_MODEL;

// Sounds the plan needs that are missing or no longer match their prompt.
export const sfxProblems = (
  postId: string,
  plan: SfxPlan,
  manifest: SfxManifest | null,
  library: AudioLibrary | null,
): string[] => {
  const problems: string[] = [];
  const used = [...new Set(plan.cues.map((c) => c.sound))];
  for (const name of used) {
    const custom = plan.custom?.[name];
    if (custom) {
      const entry = manifest?.sounds[name];
      if (!entry) {
        problems.push(`SFX "${name}" hasn't been generated. Run: npm run sfx -- ${postId}`);
      } else if (!sfxSoundIsCurrent(entry, custom)) {
        problems.push(`SFX "${name}" is out of date. Run: npm run sfx -- ${postId}`);
      }
    } else if (isSharedSfx(name) && !library?.sfx[name]) {
      problems.push(`Shared SFX "${name}" hasn't been generated. Run: npm run brand-audio`);
    }
  }
  return problems;
};

export const sfxFile = (
  name: string,
  library: AudioLibrary | null,
  manifest: SfxManifest | null,
): string | null =>
  (isSharedSfx(name) ? library?.sfx[name] : manifest?.sounds[name]?.file) ?? null;
