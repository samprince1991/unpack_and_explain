# Sound Effects Pipeline Implementation Plan

> Execute inline in the main session with superpowers:executing-plans (this project doesn't use subagents). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let reels play hand-placed ElevenLabs sound effects (a shared set plus per-reel topic sounds), timed to spoken words, with validation and audio QA.

**Architecture:** `script.ts` gains an `sfx` plan. A pure resolver turns it into timed cues using the VO captions, and `Reel.tsx` plays them. Two generators (`brand-audio`, new `sfx`) call ElevenLabs and clean each sound in TypeScript. `qa:audio` renders separate voice and SFX stems so the stutter and level checks measure the right signal.

**Tech Stack:** Remotion, TypeScript, vitest, ElevenLabs `/v1/sound-generation`, Python stdlib for QA.

**Spec:** `docs/specs/2026-11-08-sfx-pipeline-design.md`

**Ground rules**
- Run everything from `video/`.
- **Phase 1 spends no ElevenLabs credits.** Do not run `npm run brand-audio` or `npm run sfx` until the user confirms the paid plan is active.
- **Commit only when the user asks** (project rule). The plan has no per-task commits.
- Remotion's bundled ffmpeg has no `afade`, `areverse`, `silenceremove` or `volumedetect`. It does have `libmp3lame`, `volume`, `atrim` and `silencedetect`. Sample processing therefore happens in TypeScript.

## Files

| File | Responsibility |
|---|---|
| `src/brand/audio.ts` (modify) | Shared sound definitions, model constant, custom volume default |
| `src/templates/types.ts` (modify) | `SfxPlan`, `SfxCue`, `SfxManifest`, `PostScript.sfx` |
| `src/templates/sfxCues.ts` + test (create) | Pure: limits, resolver, gap and staleness problems |
| `src/templates/sfxManifest.ts` (create) | Loads `sfx.json` (uses `staticFile`, so it stays out of the pure file) |
| `src/templates/validate.ts` + test (modify) | `validateSfx` rules |
| `src/templates/metadata.ts`, `Reel.tsx` (modify) | Load manifest, throw or warn on problems, play cues, `audioMix` prop |
| `scripts/lib/sfxEdges.ts` + test (create) | Pure: level-match, trim, fades, WAV read and write |
| `scripts/lib/sfxGenerate.ts` (create) | API call, decode, clean, encode |
| `scripts/lib/voClean.ts` (modify) | Export its `ffmpeg` helper |
| `scripts/brand-audio.ts` (modify) | Clean new sounds, pin the model, music becomes opt-in with `--music` |
| `scripts/sfx.ts` (create) | Per-post topic sound generator |
| `scripts/lib/qaAudio.ts` + test, `scripts/qa-audio.ts` (create) | QA stems and checks |
| `scripts/audio-sfx-levels.py` (create) | Level check with `--selftest` |
| `qa-vo.json`, `qa-sfx.json` (create) | Props for the stems |
| `src/brand/sfxPosts.test.ts` (create) | Guard: only listed posts may opt out |
| `CLAUDE.md` (modify) | Document the pipeline |

---

# Phase 1: code (no credits)

### Task 1: Types and brand constants

**Files:** Modify `src/brand/audio.ts`, `src/templates/types.ts`, `src/kit/blenderSample.ts`, `src/templates/blenderJob.test.ts`, `src/templates/validate.test.ts`, all seven `src/posts/*/script.ts`

- [ ] **Step 1: Extend `src/brand/audio.ts`.** Replace the `sfx` object and add the constants below it. `pop` and `chime` keep their exact prompts.

```ts
export const sfx = {
  pop: {
    prompt: "Short soft UI pop, gentle rounded click, clean, for a logo appearing on screen",
    seconds: 0.5,
    volume: 0.4,
  },
  chime: {
    prompt: "Bright gentle two-note chime, warm and positive, clean ending, for a congratulations moment",
    seconds: 1.2,
    volume: 0.4,
  },
  tick: { prompt: "Short soft mechanical tick, clean and dry, no reverb", seconds: 0.5, volume: 0.25 },
  thud: { prompt: "Soft low thud, short and rounded, no reverb tail", seconds: 0.6, volume: 0.3 },
  swell: { prompt: "Short airy rising swell, gentle, builds and stops with no impact", seconds: 1.5, volume: 0.25 },
  sweep: { prompt: "Soft airy sweep passing by, light and short", seconds: 0.8, volume: 0.2 },
  snap: { prompt: "Crisp soft mechanical snap, something clicking into place, clean", seconds: 0.5, volume: 0.3 },
  stamp: { prompt: "Soft rubber stamp pressed on paper, muted and short", seconds: 0.5, volume: 0.3 },
  buzz: { prompt: "Short low error buzz, muted, not harsh", seconds: 0.7, volume: 0.25 },
} as const;

export type SfxName = keyof typeof sfx;

// Placed by the template (audioCues.ts), never by a post's sfx plan.
export const TEMPLATE_SFX: readonly SfxName[] = ["pop", "chime"];

// Pinned so every sound comes from one model. v3 is limited access (other accounts get
// "Unknown model"); moving to it is a deliberate change that regenerates the library.
export const SFX_MODEL = "eleven_text_to_sound_v2";
export const SFX_PROMPT_INFLUENCE = 0.6;
// Topic sounds without their own volume.
export const SFX_CUSTOM_VOLUME = 0.3;
```

- [ ] **Step 2: Add types to `src/templates/types.ts`.** After `ScriptSection`:

```ts
// Sound effects (docs/specs/2026-11-08-sfx-pipeline-design.md). Template cards keep their
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
```

And in `PostScript`, after `blender`:

```ts
  // Sound effects placed on spoken words. Posts built before SFX opt out with a reason.
  sfx: SfxPlan | { optOut: string };
```

- [ ] **Step 3: Add `sfx` to every `PostScript` literal,** directly above its `hero3d:` line:
  - `src/posts/post-01-card-payment/script.ts`, `post-02-gps`, `post-03-jet-engine`, `post-20-vibe-coding`: `sfx: { optOut: "posted before SFX" },`
  - `src/posts/post-10-undersea-cables/script.ts`, `post-12-cloud-myth`, `post-26-bulbous-bow`: `sfx: { optOut: "SFX planned, awaiting paid-plan generation" },`
  - `src/kit/blenderSample.ts`: `sfx: { optOut: "kit sample" },`
  - `src/templates/blenderJob.test.ts` and the `base` in `src/templates/validate.test.ts`: `sfx: { optOut: "unit test base" },`

- [ ] **Step 4: Typecheck.** Run: `npm run lint`. Expected: passes. Fix any other literal it reports.

- [ ] **Step 5: Lock in that SFX can't stale Blender clips.** In `blenderJob.test.ts`, add inside `describe("buildBlenderJob")`:

```ts
  it("hash ignores the sfx plan, so sound changes never need a Blender re-render", () => {
    const withSound = {
      ...script,
      sfx: { cues: [{ sound: "tick", section: "mechanism" as const, cue: "compressor" }] },
    };
    expect(buildBlenderJob(withSound, vo, 30).hash).toBe(job.hash);
  });
```

Run: `npx vitest run src/templates/blenderJob.test.ts`. Expected: PASS.

### Task 2: Cue resolver

**Files:** Create `src/templates/sfxCues.ts`, `src/templates/sfxCues.test.ts`

- [ ] **Step 1: Write the failing test** in `src/templates/sfxCues.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SFX_MODEL } from "../brand/audio";
import { estimateCaptions } from "./timing";
import {
  isSfxPlan,
  resolveSfxCues,
  sfxFile,
  sfxGapProblems,
  sfxProblems,
  sfxSoundIsCurrent,
} from "./sfxCues";
import type { SfxPlan, VoSection } from "./types";

const section = (id: VoSection["id"], text: string, durationMs: number): VoSection => ({
  id,
  text,
  file: null,
  durationMs,
  captions: estimateCaptions(text, durationMs),
});

// 4 words over 2000 ms: "two" starts at 500 ms, frame 15 at 30 fps.
const vo = [section("hook", "one two three four", 2000)];
const timings = [{ id: "hook" as const, from: 100, durationInFrames: 72 }];
const CROSSFADE = 12;
const resolve = (plan: SfxPlan) => resolveSfxCues(plan, vo, timings, 30, CROSSFADE);

describe("isSfxPlan", () => {
  it("tells a plan from an opt-out", () => {
    expect(isSfxPlan({ cues: [] })).toBe(true);
    expect(isSfxPlan({ optOut: "old" })).toBe(false);
  });
});

describe("resolveSfxCues", () => {
  it("places a cue at section start + spoken frame + offset", () => {
    const [cue] = resolve({ cues: [{ sound: "tick", section: "hook", cue: "two", offsetFrames: -3 }] });
    expect(cue.from).toBe(100 + 15 - 3);
    expect(cue.volume).toBe(0.25);
  });

  it("clamps an early offset to the section start", () => {
    const [cue] = resolve({ cues: [{ sound: "tick", section: "hook", cue: "one", offsetFrames: -15 }] });
    expect(cue.from).toBe(100);
  });

  it("caps a long sound at the next section's start", () => {
    const plan: SfxPlan = {
      custom: { roar: { prompt: "jet roar", seconds: 4 } },
      cues: [{ sound: "roar", section: "hook", cue: "two" }],
    };
    const [cue] = resolve(plan);
    // Section ends at 100 + 72 - 12 = 160; the cue starts at 115.
    expect(cue.durationInFrames).toBe(45);
  });

  it("uses a custom sound's volume, or the default", () => {
    const plan: SfxPlan = {
      custom: { a: { prompt: "a", seconds: 1, volume: 0.5 }, b: { prompt: "b", seconds: 1 } },
      cues: [
        { sound: "a", section: "hook", cue: "one" },
        { sound: "b", section: "hook", cue: "four" },
      ],
    };
    expect(resolve(plan).map((c) => c.volume)).toEqual([0.5, 0.3]);
  });

  it("sorts by frame", () => {
    const cues = resolve({
      cues: [
        { sound: "tick", section: "hook", cue: "four" },
        { sound: "thud", section: "hook", cue: "one" },
      ],
    });
    expect(cues.map((c) => c.sound)).toEqual(["thud", "tick"]);
  });

  it("throws when the cue word isn't spoken", () => {
    expect(() => resolve({ cues: [{ sound: "tick", section: "hook", cue: "banana" }] })).toThrow(/banana/);
  });
});

describe("sfxGapProblems", () => {
  it("flags cues under 1 s apart", () => {
    const cue = (from: number) => ({ sound: "tick", from, durationInFrames: 15, volume: 0.25 });
    expect(sfxGapProblems([cue(0), cue(30)], 30)).toEqual([]);
    expect(sfxGapProblems([cue(0), cue(29)], 30)[0]).toMatch(/under 1 s/);
  });
});

describe("sfxProblems", () => {
  const plan: SfxPlan = {
    custom: { roar: { prompt: "jet roar", seconds: 3 } },
    cues: [
      { sound: "tick", section: "hook", cue: "one" },
      { sound: "roar", section: "hook", cue: "four" },
    ],
  };
  const library = { sfx: { tick: "brand/audio/tick.mp3" }, music: null };
  const current = { prompt: "jet roar", seconds: 3, model: SFX_MODEL, file: "posts/p/sfx/roar.mp3" };
  const manifest = { postId: "p", sounds: { roar: current } };

  it("passes when every sound exists and matches", () => {
    expect(sfxProblems("p", plan, manifest, library)).toEqual([]);
  });

  it("flags a missing shared sound", () => {
    expect(sfxProblems("p", plan, manifest, { sfx: {}, music: null })[0]).toMatch(/brand-audio/);
  });

  it("flags missing and stale topic sounds", () => {
    expect(sfxProblems("p", plan, null, library)[0]).toMatch(/npm run sfx -- p/);
    const stale = { postId: "p", sounds: { roar: { ...current, prompt: "other" } } };
    expect(sfxProblems("p", plan, stale, library)[0]).toMatch(/out of date/);
  });

  it("doesn't flag a volume change: volume isn't baked into the file", () => {
    const louder: SfxPlan = { ...plan, custom: { roar: { prompt: "jet roar", seconds: 3, volume: 0.5 } } };
    expect(sfxProblems("p", louder, manifest, library)).toEqual([]);
  });
});

describe("sfxSoundIsCurrent", () => {
  it("compares prompt, seconds and model", () => {
    const entry = { prompt: "a", seconds: 1, model: SFX_MODEL, file: "f" };
    expect(sfxSoundIsCurrent(entry, { prompt: "a", seconds: 1 })).toBe(true);
    expect(sfxSoundIsCurrent(entry, { prompt: "a", seconds: 2 })).toBe(false);
    expect(sfxSoundIsCurrent({ ...entry, model: "other" }, { prompt: "a", seconds: 1 })).toBe(false);
    expect(sfxSoundIsCurrent(undefined, { prompt: "a", seconds: 1 })).toBe(false);
  });
});

describe("sfxFile", () => {
  it("finds shared sounds in the library and topic sounds in the manifest", () => {
    const library = { sfx: { tick: "brand/audio/tick.mp3" }, music: null };
    const manifest = {
      postId: "p",
      sounds: { roar: { prompt: "r", seconds: 1, model: SFX_MODEL, file: "posts/p/sfx/roar.mp3" } },
    };
    expect(sfxFile("tick", library, manifest)).toBe("brand/audio/tick.mp3");
    expect(sfxFile("roar", library, manifest)).toBe("posts/p/sfx/roar.mp3");
    expect(sfxFile("thud", library, manifest)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it.** Run: `npx vitest run src/templates/sfxCues.test.ts`. Expected: FAIL, cannot find `./sfxCues`.

- [ ] **Step 3: Write `src/templates/sfxCues.ts`:**

```ts
import { SFX_CUSTOM_VOLUME, SFX_MODEL, sfx as sharedSfx, type AudioLibrary, type SfxName } from "../brand/audio";
import { findCueMs } from "./cues";
import type { SectionTiming } from "./timing";
import type { PostScript, SfxCustomSound, SfxManifest, SfxManifestSound, SfxPlan, VoSection } from "./types";

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

export type ResolvedSfxCue = { sound: string; from: number; durationInFrames: number; volume: number };

export const isSfxPlan = (plan: PostScript["sfx"]): plan is SfxPlan => "cues" in plan;

export const isSharedSfx = (name: string): name is SfxName => Object.keys(sharedSfx).includes(name);

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
        volume: custom ? (custom.volume ?? SFX_CUSTOM_VOLUME) : (shared?.volume ?? SFX_CUSTOM_VOLUME),
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

export const sfxSoundIsCurrent = (entry: SfxManifestSound | undefined, sound: SfxCustomSound): boolean =>
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
```

- [ ] **Step 4: Run it.** Run: `npx vitest run src/templates/sfxCues.test.ts`. Expected: PASS.

### Task 3: Validation rules

**Files:** Modify `src/templates/validate.ts`, `src/templates/validate.test.ts`

- [ ] **Step 1: Add failing tests** at the end of `validate.test.ts`:

```ts
describe("sfx plan", () => {
  // The hook starts on "alpha" and ends on "omega".
  const sections = base.sections.map((s) =>
    s.id === "hook" ? { ...s, voiceover: `alpha beta gamma delta ${words(6)} omega` } : s,
  );
  const withSfx = (sfx: PostScript["sfx"]) => ({ ...base, sections, sfx }) as PostScript;
  const cue = { sound: "tick", section: "hook" as const, cue: "alpha" };
  const errorsOf = (sfx: PostScript["sfx"]) => validateScript(withSfx(sfx)).errors;

  it("accepts a sparse plan", () => {
    const result = validateScript(withSfx({ cues: [cue] }));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("needs an opt-out reason and at least one cue", () => {
    expect(errorsOf({ optOut: " " })).toContain("sfx.optOut needs a reason");
    expect(errorsOf({ cues: [] })[0]).toMatch(/at least 1 cue/);
  });

  it("limits cues per reel and in the mechanism", () => {
    const mech = { sound: "tick", section: "mechanism" as const, cue: "word" };
    expect(errorsOf({ cues: Array.from({ length: 9 }, () => cue) })[0]).toMatch(/at most 8 cues/);
    expect(errorsOf({ cues: Array.from({ length: 5 }, () => mech) })[0]).toMatch(/at most 4 cues in the mechanism/);
  });

  it("limits topic sounds and warns about unused ones", () => {
    const custom = (n: number) =>
      Object.fromEntries(Array.from({ length: n }, (_, i) => [`s${i}`, { prompt: "metal clang", seconds: 1 }]));
    expect(errorsOf({ custom: custom(4), cues: [cue] }).join()).toMatch(/at most 3 topic sounds/);
    expect(validateScript(withSfx({ custom: custom(1), cues: [cue] })).warnings[0]).toMatch(/"s0" is never used/);
  });

  it("limits topic sound length and bans shadowing a shared name", () => {
    const sized = (seconds: number) => ({ custom: { a: { prompt: "clang", seconds } }, cues: [{ ...cue, sound: "a" }] });
    expect(errorsOf(sized(5))[0]).toMatch(/0.5-4 s/);
    expect(errorsOf(sized(0.4))[0]).toMatch(/0.5-4 s/);
    const shadow = { custom: { tick: { prompt: "clang", seconds: 1 } }, cues: [cue] };
    expect(errorsOf(shadow)[0]).toMatch(/shared sound/);
  });

  it("rejects unknown and template sounds", () => {
    expect(errorsOf({ cues: [{ ...cue, sound: "banana" }] })[0]).toMatch(/not a shared or custom sound/);
    expect(errorsOf({ cues: [{ ...cue, sound: "pop" }] })[0]).toMatch(/template/);
  });

  it("rejects template sections at runtime", () => {
    const bad = { sound: "tick", section: "congrats", cue: "Congrats" } as unknown as typeof cue;
    expect(errorsOf({ cues: [bad] })[0]).toMatch(/hook, setup, mechanism or payoff/);
  });

  it("needs the cue spoken, and not as the section's last word", () => {
    expect(errorsOf({ cues: [{ ...cue, cue: "banana" }] })[0]).toMatch(/not spoken/);
    expect(errorsOf({ cues: [{ ...cue, cue: "omega" }] })[0]).toMatch(/last word/);
  });

  it("allows a repeat of the last word when it's first spoken earlier", () => {
    const repeated = base.sections.map((s) =>
      s.id === "hook" ? { ...s, voiceover: `alpha beta ${words(8)} alpha` } : s,
    );
    const script = { ...base, sections: repeated, sfx: { cues: [cue] } } as PostScript;
    expect(validateScript(script).errors).toEqual([]);
  });

  it("limits offsets", () => {
    expect(errorsOf({ cues: [{ ...cue, offsetFrames: 16 }] })[0]).toMatch(/-15 to 15/);
  });

  it("bans speech and music in topic prompts", () => {
    const plan = (prompt: string) => ({ custom: { a: { prompt, seconds: 1 } }, cues: [{ ...cue, sound: "a" }] });
    expect(errorsOf(plan("a man's voice saying hello"))[0]).toMatch(/speech or music/);
    expect(errorsOf(plan("upbeat Music loop"))[0]).toMatch(/speech or music/);
    expect(errorsOf(plan("jet engine spooling up"))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them.** Run: `npx vitest run src/templates/validate.test.ts`. Expected: new tests FAIL.

- [ ] **Step 3: Implement in `validate.ts`.** Add imports:

```ts
import { TEMPLATE_SFX, type SfxName } from "../brand/audio";
import { isSfxPlan, isSharedSfx, SFX_LIMITS } from "./sfxCues";
import { SFX_SECTIONS } from "./types";
```

(Merge `SFX_SECTIONS` into the existing `./types` import.) Add above `validateScript`:

```ts
const SFX_BANNED_PROMPT = /\b(voices?|speech|spoken|speaking|singing|vocals?|music|musical|melody|songs?)\b/i;

// Rules for sound effects (docs/specs/2026-11-08-sfx-pipeline-design.md).
const validateSfx = (script: PostScript, errors: string[], warnings: string[]) => {
  const plan = script.sfx;
  if (!isSfxPlan(plan)) {
    if (!plan.optOut.trim()) {
      errors.push("sfx.optOut needs a reason");
    }
    return;
  }
  const { cuesPerReel, cuesInMechanism, customSounds, customMinSeconds, customMaxSeconds, maxOffsetFrames } = SFX_LIMITS;
  if (plan.cues.length === 0) {
    errors.push("an sfx plan needs at least 1 cue (otherwise use optOut)");
  }
  if (plan.cues.length > cuesPerReel) {
    errors.push(`sfx: at most ${cuesPerReel} cues per reel`);
  }
  if (plan.cues.filter((c) => c.section === "mechanism").length > cuesInMechanism) {
    errors.push(`sfx: at most ${cuesInMechanism} cues in the mechanism`);
  }

  const custom = Object.entries(plan.custom ?? {});
  if (custom.length > customSounds) {
    errors.push(`sfx: at most ${customSounds} topic sounds per reel`);
  }
  for (const [name, sound] of custom) {
    if (isSharedSfx(name)) {
      errors.push(`sfx: topic sound "${name}" shadows a shared sound`);
    }
    if (sound.seconds < customMinSeconds || sound.seconds > customMaxSeconds) {
      errors.push(`sfx: topic sound "${name}" must be ${customMinSeconds}-${customMaxSeconds} s`);
    }
    if (SFX_BANNED_PROMPT.test(sound.prompt)) {
      errors.push(`sfx: topic sound "${name}" can't ask for speech or music`);
    }
    if (!plan.cues.some((c) => c.sound === name)) {
      warnings.push(`sfx: topic sound "${name}" is never used`);
    }
  }

  for (const cue of plan.cues) {
    const isCustom = plan.custom?.[cue.sound] !== undefined;
    if (!isCustom && !isSharedSfx(cue.sound)) {
      errors.push(`sfx cue "${cue.cue}": "${cue.sound}" is not a shared or custom sound`);
    } else if (TEMPLATE_SFX.includes(cue.sound as SfxName)) {
      errors.push(`sfx cue "${cue.cue}": "${cue.sound}" is placed by the template`);
    }
    if (!(SFX_SECTIONS as readonly string[]).includes(cue.section)) {
      errors.push(`sfx cue "${cue.cue}" must be in the hook, setup, mechanism or payoff`);
      continue;
    }
    const spoken = (script.sections.find((s) => s.id === cue.section)?.voiceover ?? "")
      .split(/[\s-]+/)
      .map(normalizeWord)
      .filter(Boolean);
    const first = spoken.indexOf(normalizeWord(cue.cue));
    if (first === -1) {
      errors.push(`sfx cue "${cue.cue}" is not spoken in the ${cue.section} section`);
    } else if (first === spoken.length - 1) {
      // A sound on a section's last word is what made the old section whoosh sound wrong.
      errors.push(`sfx cue "${cue.cue}" is the last word of the ${cue.section} section`);
    }
    if (Math.abs(cue.offsetFrames ?? 0) > maxOffsetFrames) {
      errors.push(`sfx cue "${cue.cue}": offsetFrames must be -${maxOffsetFrames} to ${maxOffsetFrames}`);
    }
  }
};
```

Call it right after `checkCameraRhythm(script, warnings);`:

```ts
  validateSfx(script, errors, warnings);
```

- [ ] **Step 4: Run them.** Run: `npx vitest run src/templates/validate.test.ts`. Expected: PASS.

### Task 4: Playback in the reel

**Files:** Create `src/templates/sfxManifest.ts`, `qa-vo.json`, `qa-sfx.json`. Modify `src/templates/metadata.ts`, `src/templates/Reel.tsx`.

- [ ] **Step 1: Create `src/templates/sfxManifest.ts`:**

```ts
import { staticFile } from "remotion";
import { sfxManifestPath } from "./sfxCues";
import type { SfxManifest } from "./types";

// Null until `npm run sfx` has been run for this post.
export const loadSfxManifest = async (postId: string): Promise<SfxManifest | null> => {
  try {
    const res = await fetch(staticFile(sfxManifestPath(postId)));
    return res.ok ? ((await res.json()) as SfxManifest) : null;
  } catch {
    return null;
  }
};
```

- [ ] **Step 2: Update `metadata.ts`.** Add imports:

```ts
import { isSfxPlan, resolveSfxCues, sfxGapProblems, sfxProblems } from "./sfxCues";
import { loadSfxManifest } from "./sfxManifest";
```

Change the timeline line to also take `sections`:

```ts
  const { sections, totalFrames } = computeTimeline(vo.sections, video.fps, durations.crossfade);
```

And before the `return`:

```ts
  let sfxManifest = null;
  if (isSfxPlan(props.script.sfx)) {
    sfxManifest = await loadSfxManifest(props.script.id);
    const cues = resolveSfxCues(props.script.sfx, vo.sections, sections, video.fps, durations.crossfade);
    const problems = [
      ...sfxProblems(props.script.id, props.script.sfx, sfxManifest, audio),
      ...sfxGapProblems(cues, video.fps),
    ];
    if (problems.length > 0 && getRemotionEnvironment().isRendering) {
      throw new Error(`[${props.script.id}]\n- ${problems.join("\n- ")}`);
    }
    problems.forEach((p) => console.warn(`[${props.script.id}] ${p}`));
  }
```

Add `sfxManifest` to the returned props: `props: { ...props, vo, audio, blender3d, sfxManifest }`.

- [ ] **Step 3: Update `Reel.tsx`.** Named `audioMix` because `mix` is already the transition map in this file. Add to imports:

```ts
import { isSfxPlan, resolveSfxCues, SFX_FADE_FRAMES, sfxFile } from "./sfxCues";
```

Add `SfxManifest` to the `./types` import. In `ReelProps`:

```ts
  // Topic sounds (sfx.json). Filled in by calculateReelMetadata for posts with a plan.
  sfxManifest?: SfxManifest | null;
  // QA only: render one stem. "vo" is voice only, "sfx" effects only. Default "full".
  audioMix?: "full" | "vo" | "sfx";
```

Destructure `sfxManifest = null, audioMix = "full",` alongside `blender3d = null`. After `const has3d = ...`:

```ts
  const sfxCues = isSfxPlan(script.sfx)
    ? resolveSfxCues(script.sfx, vo.sections, sections, fps, durations.crossfade)
    : [];
```

Change the section audio line to:

```tsx
                {section.file && audioMix !== "sfx" ? <Audio src={staticFile(section.file)} /> : null}
```

Wrap the existing template loop so stems respect it, and add the plan's cues after it:

```tsx
        {audioMix !== "vo"
          ? audioCues(sections, durations.crossfade).map((cue) => {
              const file = audio?.sfx[cue.name];
              return file ? (
                <Sequence
                  key={`${cue.name}-${cue.from}`}
                  name={`SFX ${cue.name}`}
                  from={cue.from}
                  layout="none"
                >
                  <Audio src={staticFile(file)} volume={sfx[cue.name].volume} />
                </Sequence>
              ) : null;
            })
          : null}
        {audioMix !== "vo"
          ? sfxCues.map((cue) => {
              const file = sfxFile(cue.sound, audio, sfxManifest);
              return file ? (
                <Sequence
                  key={`${cue.sound}-${cue.from}`}
                  name={`SFX ${cue.sound}`}
                  from={cue.from}
                  durationInFrames={cue.durationInFrames}
                  layout="none"
                >
                  <Audio
                    src={staticFile(file)}
                    volume={(f) =>
                      cue.volume *
                      interpolate(
                        f,
                        [cue.durationInFrames - SFX_FADE_FRAMES, cue.durationInFrames],
                        [1, 0],
                        clamp,
                      )
                    }
                  />
                </Sequence>
              ) : null;
            })
          : null}
```

Change the music condition to `{audio?.music && audioMix === "full" ? (`.

- [ ] **Step 4: Create the stem props.** `qa-vo.json`: `{ "audioMix": "vo" }`. `qa-sfx.json`: `{ "audioMix": "sfx" }`.

- [ ] **Step 5: Verify.** Run: `npm run lint`, then `npm test`. Expected: both pass. Every post still opts out, so no reel's audio changes.

### Task 5: Cleaning generated sounds

**Files:** Create `scripts/lib/sfxEdges.ts`, `scripts/lib/sfxEdges.test.ts`, `scripts/lib/sfxGenerate.ts`. Modify `scripts/lib/voClean.ts`.

- [ ] **Step 1: Write the failing test** in `scripts/lib/sfxEdges.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { cleanSfxSamples, pcmToWav, wavToPcm } from "./sfxEdges";

const RATE = 1000; // 1 frame = 1 ms, so fades are easy to read.

const peak = (s: Int16Array) => s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

describe("cleanSfxSamples", () => {
  const body = new Int16Array(200).fill(10000);

  it("trims silence off both ends", () => {
    const input = new Int16Array(300);
    input.set(body, 50);
    expect(cleanSfxSamples(input, 1, RATE).length).toBe(200);
  });

  it("level-matches quiet and loud takes to the same peak", () => {
    const quiet = cleanSfxSamples(new Int16Array(200).fill(1000), 1, RATE);
    const loud = cleanSfxSamples(new Int16Array(200).fill(30000), 1, RATE);
    expect(peak(quiet)).toBe(peak(loud));
    expect(peak(loud)).toBe(Math.round(32767 * 10 ** (-3 / 20)));
  });

  it("fades both ends so nothing clicks", () => {
    const out = cleanSfxSamples(body, 1, RATE);
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBe(0);
    expect(out[100]).toBe(peak(out));
  });

  it("keeps stereo frames together", () => {
    const input = new Int16Array(600);
    // 100 silent stereo frames, then 200 frames, the left channel only.
    for (let i = 100; i < 300; i++) {
      input[i * 2] = 10000;
    }
    const out = cleanSfxSamples(input, 2, RATE);
    expect(out.length).toBe(400);
    expect(out[201]).toBe(0);
    expect(out[200]).toBeGreaterThan(0);
  });

  it("throws on a silent take rather than writing nothing", () => {
    expect(() => cleanSfxSamples(new Int16Array(100), 1, RATE)).toThrow(/silent/);
  });
});

describe("WAV", () => {
  it("round-trips samples", () => {
    const samples = Int16Array.from([1, -2, 300, -400]);
    expect(Array.from(wavToPcm(pcmToWav(samples, 2, 44100)))).toEqual([1, -2, 300, -400]);
  });
});
```

- [ ] **Step 2: Run it.** Run: `npx vitest run scripts/lib/sfxEdges.test.ts`. Expected: FAIL, cannot find `./sfxEdges`.

- [ ] **Step 3: Write `scripts/lib/sfxEdges.ts`:**

```ts
// Pure sample processing for generated sounds. Remotion's ffmpeg has no afade, areverse,
// silenceremove or volumedetect, so this happens here and ffmpeg only decodes and encodes.
const FULL_SCALE = 32767;
const PEAK_DB = -3;
const SILENCE_DB = -50;
const FADE_IN_MS = 5;
const FADE_OUT_MS = 30;

const dbToLinear = (db: number) => 10 ** (db / 20);

// Starts right on the sound so cues land on the word, at a common peak, with no clicks.
// `samples` is interleaved; every step works in whole frames.
export const cleanSfxSamples = (samples: Int16Array, channels: number, sampleRate: number): Int16Array => {
  const threshold = FULL_SCALE * dbToLinear(SILENCE_DB);
  const frames = Math.floor(samples.length / channels);
  const isLoud = (frame: number) => {
    for (let c = 0; c < channels; c++) {
      if (Math.abs(samples[frame * channels + c]) >= threshold) {
        return true;
      }
    }
    return false;
  };
  let first = 0;
  while (first < frames && !isLoud(first)) {
    first++;
  }
  if (first === frames) {
    throw new Error("Generated sound is silent; regenerate it");
  }
  let last = frames - 1;
  while (!isLoud(last)) {
    last--;
  }

  const trimmed = samples.slice(first * channels, (last + 1) * channels);
  const peak = trimmed.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const gain = (FULL_SCALE * dbToLinear(PEAK_DB)) / peak;

  const count = last - first + 1;
  const fadeIn = Math.max(1, Math.round((FADE_IN_MS / 1000) * sampleRate));
  const fadeOut = Math.max(1, Math.round((FADE_OUT_MS / 1000) * sampleRate));
  const out = new Int16Array(trimmed.length);
  for (let frame = 0; frame < count; frame++) {
    const envelope = Math.min(1, frame / fadeIn, (count - 1 - frame) / fadeOut);
    for (let c = 0; c < channels; c++) {
      out[frame * channels + c] = Math.round(trimmed[frame * channels + c] * gain * envelope);
    }
  }
  return out;
};

export const pcmToWav = (samples: Int16Array, channels: number, sampleRate: number): Buffer => {
  const bytes = samples.length * 2;
  const wav = Buffer.alloc(44 + bytes);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + bytes, 4);
  wav.write("WAVEfmt ", 8, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * 2, 28);
  wav.writeUInt16LE(channels * 2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(bytes, 40);
  samples.forEach((v, i) => wav.writeInt16LE(v, 44 + i * 2));
  return wav;
};

export const wavToPcm = (wav: Buffer): Int16Array => {
  const data = wav.indexOf("data");
  const start = data + 8;
  const bytes = wav.subarray(start, start + wav.readUInt32LE(data + 4));
  return new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
};
```

- [ ] **Step 4: Run it.** Run: `npx vitest run scripts/lib/sfxEdges.test.ts`. Expected: PASS.

- [ ] **Step 5: Export the helper.** In `scripts/lib/voClean.ts`, change `const ffmpeg = (args: string[]) => {` to `export const ffmpeg = (args: string[]) => {`.

- [ ] **Step 6: Write `scripts/lib/sfxGenerate.ts`:**

```ts
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SFX_MODEL, SFX_PROMPT_INFLUENCE } from "../../src/brand/audio";
import { cleanSfxSamples, pcmToWav, wavToPcm } from "./sfxEdges";
import { ffmpeg } from "./voClean";

const CHANNELS = 2;
const SAMPLE_RATE = 44100;

// Generates one sound with ElevenLabs, cleans it and writes it as an mp3.
export const generateSfx = async (apiKey: string, file: string, text: string, seconds: number) => {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      duration_seconds: seconds,
      prompt_influence: SFX_PROMPT_INFLUENCE,
      model_id: SFX_MODEL,
    }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs sound generation ${res.status}: ${await res.text()}`);
  }
  const dir = mkdtempSync(join(tmpdir(), "sfx-"));
  try {
    const raw = join(dir, "raw.mp3");
    const decoded = join(dir, "decoded.wav");
    const cleaned = join(dir, "cleaned.wav");
    writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
    ffmpeg(["-v", "error", "-y", "-i", raw, "-ac", `${CHANNELS}`, "-ar", `${SAMPLE_RATE}`, "-c:a", "pcm_s16le", decoded]);
    const samples = cleanSfxSamples(wavToPcm(readFileSync(decoded)), CHANNELS, SAMPLE_RATE);
    writeFileSync(cleaned, pcmToWav(samples, CHANNELS, SAMPLE_RATE));
    ffmpeg(["-v", "error", "-y", "-i", cleaned, "-c:a", "libmp3lame", "-b:a", "128k", file]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
```

- [ ] **Step 7: Prove the decode, clean and encode path without credits.** Run in `video/`:

```powershell
New-Item -ItemType Directory -Force out/qa | Out-Null
npx remotion ffmpeg -v error -y -i public/brand/audio/chime.mp3 -ac 2 -ar 44100 -c:a pcm_s16le out/qa/chime-check.wav
npx remotion ffmpeg -v error -y -i out/qa/chime-check.wav -c:a libmp3lame -b:a 128k out/qa/chime-check.mp3
```

Expected: both exit 0 and write their files. These are throwaways; `chime.mp3` is only read.

### Task 6: Generators

**Files:** Modify `scripts/brand-audio.ts`, `package.json`. Create `scripts/sfx.ts`.

- [ ] **Step 1: Rewrite the sound and music parts of `scripts/brand-audio.ts`.** Import `generateSfx` from `./lib/sfxGenerate`. Replace the `for` loop body's generation with `await generateSfx(apiKey, join(publicDir, file), spec.prompt, spec.seconds);`. Replace the `try` block for music with the block below. Music stays opt-in, so generating sounds on a paid plan can't quietly add a bed to every later render:

```ts
  // Opt-in: once a bed exists, every later render plays it.
  const musicFile = audioPath(MUSIC_NAME);
  const wantMusic = process.argv.includes("--music");
  if (wantMusic && (force || !existsSync(join(publicDir, musicFile)))) {
    try {
      console.log("Generating music bed...");
      const audio = await generate(apiKey, "/v1/music", {
        prompt: music.prompt,
        music_length_ms: music.lengthMs,
        force_instrumental: true,
      });
      writeFileSync(join(publicDir, musicFile), audio);
    } catch (err) {
      // Music needs a paid ElevenLabs plan; SFX still work without it.
      console.warn(`Music skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  library.music = existsSync(join(publicDir, musicFile)) ? musicFile : null;
```

- [ ] **Step 2: Create `scripts/sfx.ts`:**

```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SFX_MODEL } from "../src/brand/audio";
import { isSfxPlan, sfxManifestPath, sfxSoundIsCurrent } from "../src/templates/sfxCues";
import type { PostScript, SfxManifest } from "../src/templates/types";
import { generateSfx } from "./lib/sfxGenerate";

// Generates a post's topic sounds. Keeps every sound whose prompt, seconds and model still
// match, because each generation sounds different. --only=name --force redoes one sound.
const main = async () => {
  const postId = process.argv[2];
  if (!postId || postId.startsWith("--")) {
    throw new Error("Usage: npm run sfx -- <post-id> [--only=name,name] [--force]");
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing. Add it to video/.env");
  }
  const { script } = (await import(`../src/posts/${postId}/script`)) as { script: PostScript };
  if (!isSfxPlan(script.sfx)) {
    throw new Error(`${postId} opts out of SFX: ${script.sfx.optOut}`);
  }

  const force = process.argv.includes("--force");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.slice("--only=".length).split(",") : null;

  const publicDir = join(process.cwd(), "public");
  const manifestFile = join(publicDir, sfxManifestPath(postId));
  mkdirSync(join(publicDir, "posts", postId, "sfx"), { recursive: true });
  const existing: SfxManifest | null = existsSync(manifestFile)
    ? (JSON.parse(readFileSync(manifestFile, "utf8")) as SfxManifest)
    : null;

  const manifest: SfxManifest = { postId, sounds: {} };
  for (const [name, sound] of Object.entries(script.sfx.custom ?? {})) {
    const file = `posts/${postId}/sfx/${name}.mp3`;
    const previous = existing?.sounds[name];
    const current = sfxSoundIsCurrent(previous, sound) && existsSync(join(publicDir, file));
    const selected = !only || only.includes(name);
    if (selected && (force || !current)) {
      console.log(`Generating ${name}...`);
      await generateSfx(apiKey, join(publicDir, file), sound.prompt, sound.seconds);
      manifest.sounds[name] = { prompt: sound.prompt, seconds: sound.seconds, model: SFX_MODEL, file };
    } else if (previous) {
      manifest.sounds[name] = previous;
    }
  }
  writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${sfxManifestPath(postId)}`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

- [ ] **Step 3: Add scripts to `package.json`,** after `"brand-audio"`:

```json
    "sfx": "tsx --env-file=.env scripts/sfx.ts",
    "qa:audio": "tsx scripts/qa-audio.ts",
```

- [ ] **Step 4: Verify without spending credits.** Run: `npm run lint`, then `npm run sfx -- post-26-bulbous-bow`. Expected: lint passes; the second prints `post-26-bulbous-bow opts out of SFX: ...` and exits 1 before any API call.

### Task 7: Audio QA

**Files:** Create `scripts/audio-sfx-levels.py`, `scripts/lib/qaAudio.ts`, `scripts/lib/qaAudio.test.ts`, `scripts/qa-audio.ts`

- [ ] **Step 1: Write `scripts/audio-sfx-levels.py`:**

```python
"""Fails if a sound effect comes within MARGIN_DB of the voice where the two overlap.

Usage (run by `npm run qa:audio`):
  python scripts/audio-sfx-levels.py out/qa/vo16.wav out/qa/sfx16.wav out/qa/cues.json
  python scripts/audio-sfx-levels.py --selftest

Both wavs are 16 kHz mono 16-bit. cues.json is [{"sound", "start", "end"}], in seconds.
"""
import array
import json
import math
import sys
import wave

RATE = 16000
FRAME = 160  # 10 ms
THRESHOLD = 60  # same "is sound" level as audio-bursts.py
MARGIN_DB = 8


def read(path):
    w = wave.open(path)
    if w.getframerate() != RATE or w.getnchannels() != 1:
        sys.exit("Expected 16 kHz mono 16-bit wav.")
    return array.array("h", w.readframes(w.getnframes()))


def envelope(x):
    return [math.sqrt(sum(v * v for v in x[i : i + FRAME]) / FRAME) for i in range(0, len(x) - FRAME + 1, FRAME)]


def db(power):
    return 10 * math.log10(power)


# Voice and effect levels (dB) over the frames where both sound, or None if they never overlap.
def cue_levels(vo, sfx, start, end):
    a, b = int(start * 100), int(end * 100)
    both = [(v, s) for v, s in zip(vo[a:b], sfx[a:b]) if v >= THRESHOLD and s >= THRESHOLD]
    if not both:
        return None
    return (
        db(sum(v * v for v, _ in both) / len(both)),
        db(sum(s * s for _, s in both) / len(both)),
    )


def failures(vo, sfx, cues):
    out = []
    for cue in cues:
        levels = cue_levels(vo, sfx, cue["start"], cue["end"])
        if levels and levels[1] > levels[0] - MARGIN_DB:
            out.append(f'{cue["sound"]} at {cue["start"]:.2f} s is only {levels[0] - levels[1]:.1f} dB under the voice')
    return out


def selftest():
    second = lambda amp: envelope(array.array("h", [amp] * RATE))
    cue = [{"sound": "x", "start": 0.1, "end": 0.9}]
    assert failures(second(3000), second(2000), cue), "a loud effect must fail"
    assert not failures(second(3000), second(500), cue), "a quiet effect must pass"
    assert not failures(second(0), second(3000), cue), "an effect clear of the voice must pass"
    print("Selftest passed.")


if __name__ == "__main__":
    if sys.argv[1] == "--selftest":
        selftest()
        sys.exit(0)
    vo_env, sfx_env = envelope(read(sys.argv[1])), envelope(read(sys.argv[2]))
    with open(sys.argv[3], encoding="utf-8") as f:
        problems = failures(vo_env, sfx_env, json.load(f))
    if problems:
        print("\n".join(problems))
        sys.exit(1)
    print("SFX levels OK.")
```

- [ ] **Step 2: Run the selftest.** Run: `python scripts/audio-sfx-levels.py --selftest`. Expected: `Selftest passed.`

- [ ] **Step 3: Write the failing test** in `scripts/lib/qaAudio.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { compositionForPost, cueWindows } from "./qaAudio";

describe("compositionForPost", () => {
  const root = `<Composition id="Post03-JetEngine" /><Composition id="Cover26-BulbousBow" /><Composition id="Post26-BulbousBow" />`;

  it("finds the reel, not the cover", () => {
    expect(compositionForPost(root, "post-26-bulbous-bow")).toBe("Post26-BulbousBow");
    expect(compositionForPost(root, "post-03-jet-engine")).toBe("Post03-JetEngine");
  });

  it("throws when the post isn't registered", () => {
    expect(() => compositionForPost(root, "post-99-nope")).toThrow(/post-99-nope/);
  });
});

describe("cueWindows", () => {
  it("converts frames to seconds", () => {
    const cue = { sound: "tick", from: 30, durationInFrames: 15, volume: 0.25 };
    expect(cueWindows([cue], 30)).toEqual([{ sound: "tick", start: 1, end: 1.5 }]);
  });
});
```

- [ ] **Step 4: Run it.** Run: `npx vitest run scripts/lib/qaAudio.test.ts`. Expected: FAIL, cannot find `./qaAudio`.

- [ ] **Step 5: Write `scripts/lib/qaAudio.ts`:**

```ts
import type { ResolvedSfxCue } from "../../src/templates/sfxCues";

// "post-26-bulbous-bow" -> the "Post26-..." composition registered in Root.tsx.
export const compositionForPost = (rootSource: string, postId: string): string => {
  const number = postId.match(/^post-(\d+)-/)?.[1];
  const match = number ? rootSource.match(new RegExp(`id="(Post${number}-[^"]+)"`)) : null;
  if (!match) {
    throw new Error(`No reel composition for ${postId} in Root.tsx`);
  }
  return match[1];
};

export const cueWindows = (cues: ResolvedSfxCue[], fps: number) =>
  cues.map((c) => ({ sound: c.sound, start: c.from / fps, end: (c.from + c.durationInFrames) / fps }));
```

- [ ] **Step 6: Run it.** Run: `npx vitest run scripts/lib/qaAudio.test.ts`. Expected: PASS.

- [ ] **Step 7: Write `scripts/qa-audio.ts`:**

```ts
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { durations } from "../src/brand/motion";
import { video } from "../src/brand/tokens";
import { isSfxPlan, resolveSfxCues } from "../src/templates/sfxCues";
import { computeTimeline } from "../src/templates/timing";
import type { PostScript, VoManifest } from "../src/templates/types";
import { voManifestPath } from "../src/templates/vo";
import { compositionForPost, cueWindows } from "./lib/qaAudio";

const OUT = "out/qa";

const run = (command: string, args: string[]) =>
  spawnSync(command, args.map((a) => `"${a}"`), { stdio: "inherit", shell: true }).status === 0;

const must = (ok: boolean, what: string) => {
  if (!ok) {
    throw new Error(`${what} failed`);
  }
};

const renderStem = (composition: string, name: string, props: string | null) => {
  const wav = `${OUT}/${name}.wav`;
  must(
    run("npx", ["remotion", "render", composition, wav, "--codec=wav", ...(props ? [`--props=${props}`] : [])]),
    `Rendering the ${name} stem`,
  );
  return wav;
};

const toAnalysisWav = (wav: string) => {
  const out = wav.replace(/\.wav$/, "16.wav");
  must(
    run("npx", ["remotion", "ffmpeg", "-v", "error", "-y", "-i", wav, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", out]),
    `Converting ${wav}`,
  );
  return out;
};

const main = async () => {
  const postId = process.argv[2];
  if (!postId) {
    throw new Error("Usage: npm run qa:audio -- <post-id>");
  }
  const composition = compositionForPost(readFileSync(join("src", "Root.tsx"), "utf8"), postId);
  mkdirSync(OUT, { recursive: true });

  const vo16 = toAnalysisWav(renderStem(composition, "vo", "./qa-vo.json"));
  // On the voice alone: an intentional tick in a pause would fail this on the full mix,
  // and a sustained topic sound could hide a real stutter.
  const stutterOk = run("python", ["scripts/audio-bursts.py", vo16]);

  const { script } = (await import(`../src/posts/${postId}/script`)) as { script: PostScript };
  let levelsOk = true;
  if (isSfxPlan(script.sfx)) {
    const vo = JSON.parse(readFileSync(join("public", voManifestPath(postId)), "utf8")) as VoManifest;
    const { sections } = computeTimeline(vo.sections, video.fps, durations.crossfade);
    const cues = resolveSfxCues(script.sfx, vo.sections, sections, video.fps, durations.crossfade);
    writeFileSync(`${OUT}/cues.json`, JSON.stringify(cueWindows(cues, video.fps)));
    const sfx16 = toAnalysisWav(renderStem(composition, "sfx", "./qa-sfx.json"));
    levelsOk = run("python", ["scripts/audio-sfx-levels.py", vo16, sfx16, `${OUT}/cues.json`]);
  }

  const mix = renderStem(composition, "mix", null);
  console.log(`\nListen across every section boundary and every cue: ${mix}`);
  if (!stutterOk || !levelsOk) {
    process.exit(1);
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

- [ ] **Step 8: Run it end to end on an opted-out post.** Run: `npm run qa:audio -- post-26-bulbous-bow`. Expected: prints `No stray blips.` and the path to `out/qa/mix.wav`. An opted-out post has no SFX stem, so this proves the voice stem and the `audioMix` prop.

- [ ] **Step 9: Sanity-check the full mix.** Run `npm run master -- out/qa/mix.wav`. Expected: the "Before" figure is near the usual -21 LUFS raw mix, and "After" is near -14 LUFS. `out/` is gitignored, so the extra files need no clean-up.

### Task 8: Guard and docs

**Files:** Create `src/brand/sfxPosts.test.ts`. Modify `CLAUDE.md`, `docs/specs/2026-10-29-video-brand-standards-design.md`.

- [ ] **Step 1: Write `src/brand/sfxPosts.test.ts`:**

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const POSTS = join(process.cwd(), "src", "posts");

// Live before SFX existed. Posts 10, 12 and 26 leave this list in Phase 2.
const MAY_OPT_OUT = [
  "post-01-card-payment",
  "post-02-gps",
  "post-03-jet-engine",
  "post-10-undersea-cables",
  "post-12-cloud-myth",
  "post-20-vibe-coding",
  "post-26-bulbous-bow",
];

describe("SFX guard", () => {
  it("every new reel has a sound plan", () => {
    const optedOut = readdirSync(POSTS).filter((name) => {
      const script = join(POSTS, name, "script.ts");
      return existsSync(script) && /sfx:\s*\{\s*optOut/.test(readFileSync(script, "utf8"));
    });
    expect(optedOut.filter((name) => !MAY_OPT_OUT.includes(name))).toEqual([]);
  });
});
```

- [ ] **Step 2: Update `CLAUDE.md`:**
  - **Commands:** add `npm run sfx -- post-NN-slug [--only=name] [--force]` and `npm run qa:audio -- post-NN-slug`. Replace the three-step "QA audio" line with `qa:audio`: it must print "No stray blips" and "SFX levels OK", and you still listen to `out/qa/mix.wav` across every section boundary and cue. Note `npm run brand-audio` generates missing sounds and only makes music with `--music`.
  - **Audio and captions:** replace the "Brand sound library" bullet with the shared set, topic sounds, the `sfx` plan and its rules (keep "no sound on section changes"). Replace the licensing bullet's "confirm in ElevenLabs' current terms" with what the docs say: free-plan content is non-commercial, needs "elevenlabs.io" in the title and never gains commercial rights later; paid-plan content is commercial except beta services.
  - **Per-post workflow:** add step 3c: "Plan the sound (`sfx` in `script.ts`): write 3-8 cues on spoken words, topic sounds that suit the subject, then `npm run sfx`."
  - **QA checklist:** add "SFX: sparse, nothing masks a key word, `npm run qa:audio` passes, listened through."
  - **Repo map:** add `public/posts/post-NN/sfx/` beside the VO.

- [ ] **Step 3: Update line 94 of `docs/specs/2026-10-29-video-brand-standards-design.md`** to add: "Per-reel sound effects: see `2026-11-08-sfx-pipeline-design.md`."

- [ ] **Step 4: Verify Phase 1.** Run: `npm run lint`, `npm test`, `npm run tracker`. Expected: all pass, and `git status` shows no changes under `ideas/*/idea.md`.

**End of Phase 1. Stop and report. Phase 2 needs the user to confirm the paid plan.**

---

# Phase 2: sounds (only after the user confirms the paid plan)

### Task 9: Decide what the upgrade changes

- [ ] **Step 1: Ask the user the three questions from the spec,** one at a time:
  1. Generate the music bed now (`--music`), or later?
  2. Regenerate `pop` and `chime` on the paid plan (`--force` also redoes the shared set and changes the brand sound slightly)?
  3. Regenerate VO on 10, 12 and 26? If yes, run `npm run tts` and `npm run blender` for each **before** Task 11, since new takes change the cue timing.

### Task 10: Generate and check the shared set

- [ ] **Step 1: Generate.** Run: `npm run brand-audio` (add `--music` or `--force` per Task 9). Expected: generates seven new sounds, prints `Wrote brand/audio/library.json`. Read the printed lines to confirm `pop` and `chime` were not regenerated unless `--force` was chosen.
- [ ] **Step 2: User listens** to each new file in `public/brand/audio/`. To redo one sound, delete just that file and run `npm run brand-audio` again; existing files are kept.

### Task 11: Pilot on post 26

**Files:** Modify `src/posts/post-26-bulbous-bow/script.ts`, `src/brand/audio.ts` and `src/templates/sfxCues.ts` if tuning requires it.

- [ ] **Step 1: Draft the plan with the user.** Read the post's voice-over and Blender beats. Replace its `optOut` with 3-8 cues on spoken words, plus 1-3 topic sounds that suit a ship's bow and waves. Show the draft to the user before spending credits on topic sounds.
- [ ] **Step 2: Generate.** Run: `npm run sfx -- post-26-bulbous-bow`. Expected: writes each sound and `sfx/sfx.json`.
- [ ] **Step 3: Check.** Run: `npm test`, then `npm run qa:audio -- post-26-bulbous-bow`. Expected: "No stray blips." and "SFX levels OK." Also raise one cue's volume temporarily to confirm the level check fails, then restore it.
- [ ] **Step 4: User listens** to `out/qa/mix.wav`. Tune volumes, prompts, limits and `MARGIN_DB` until approved. Record final values in code and the spec.

### Task 12: Roll out to 10 and 12, render all three

- [ ] **Step 1: Repeat Task 11's steps 1-3** for `post-10-undersea-cables` and `post-12-cloud-myth`, leading with sounds different from post 26's.
- [ ] **Step 2: Remove posts 10, 12 and 26 from `MAY_OPT_OUT`** in `src/brand/sfxPosts.test.ts`.
- [ ] **Step 3: Render and master each:**

```powershell
npx remotion render Post26-BulbousBow out/post-26-bulbous-bow.mp4
npm run master -- out/post-26-bulbous-bow.mp4
```

Same for `Post10-UnderseaCables` and `Post12-CloudMyth`. Expected: `After: -14 LUFS`, true peak at or below -1 dBTP.

- [ ] **Step 4: Verify.** Run: `npm run lint`, `npm test`, `npm run tracker`. Expected: all pass.
- [ ] **Step 5: Report to the user** with the master paths, so they can replace the earlier renders before posting.
