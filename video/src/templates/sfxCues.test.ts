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
