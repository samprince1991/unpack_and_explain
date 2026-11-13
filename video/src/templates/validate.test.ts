import { describe, expect, it } from "vitest";
import { brand } from "../brand/tokens";
import type { PostScript } from "./types";
import { COVER_NAMES_TOPIC_FROM, coverNamesTopic, validateScript } from "./validate";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

const base: PostScript = {
  id: "post-99-test",
  postNumber: 99,
  format: "E",
  title: "Test",
  hookText: "Short hook",
  topic: "Thing",
  source: "Somewhere.gov",
  verify: [],
  sfx: { optOut: "unit test base" },
  blender: { optOut: "unit test base" },
  sections: [
    { id: "question", voiceover: "Do you know how this works?", visual: "" },
    { id: "hook", voiceover: words(10), visual: "" },
    { id: "setup", voiceover: words(15), visual: "" },
    { id: "mechanism", voiceover: words(40), visual: "" },
    { id: "payoff", voiceover: words(26), visual: "" },
    { id: "congrats", voiceover: "Congrats! You just learned how this works.", visual: "" },
    { id: "cta", voiceover: brand.ctaLine, visual: "" },
  ],
};

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

describe("validateScript", () => {
  it("accepts a valid E script", () => {
    expect(validateScript(base)).toEqual({ errors: [], warnings: [] });
  });

  it("requires the exact section order", () => {
    const s = { ...base, sections: [...base.sections].reverse() };
    expect(validateScript(s).errors[0]).toMatch(/Sections must be/);
  });

  it("requires a source", () => {
    expect(validateScript({ ...base, source: " " }).errors).toContain("source is required");
  });

  it("limits hook text to 2 lines", () => {
    const s = { ...base, hookText: "This hook is far too long for two lines" };
    expect(validateScript(s).errors[0]).toMatch(/hookText/);
  });

  it("enforces the canonical CTA line", () => {
    const sections = base.sections.map((x) =>
      x.id === "cta" ? { ...x, voiceover: "Follow us for how the world actually works." } : x,
    );
    expect(validateScript({ ...base, sections }).errors[0]).toMatch(/CTA voiceover/);
  });

  it("requires failureSection on F posts and forbids it elsewhere", () => {
    expect(validateScript({ ...base, format: "F" }).errors).toContain(
      "F posts need failureSection",
    );
    expect(validateScript({ ...base, failureSection: "payoff" }).errors).toContain(
      "failureSection is only for F posts",
    );
  });

  it("requires the opening question to be a question", () => {
    const sections = base.sections.map((x) =>
      x.id === "question" ? { ...x, voiceover: "This is a statement." } : x,
    );
    expect(validateScript({ ...base, sections }).errors).toContain(
      'question voiceover must end with "?"',
    );
  });

  it("requires the congrats line before the CTA", () => {
    const sections = base.sections.map((x) =>
      x.id === "congrats" ? { ...x, voiceover: "Well, that is how it works." } : x,
    );
    expect(validateScript({ ...base, sections }).errors).toContain(
      'congrats voiceover must start with "Congrats"',
    );
  });

  it("warns when spoken words are outside 100-130", () => {
    const sections = base.sections.map((x) =>
      x.id === "mechanism" ? { ...x, voiceover: words(80) } : x,
    );
    expect(validateScript({ ...base, sections }).warnings[0]).toMatch(/outside 100-130/);
  });
});

describe("validateScript: blender plan", () => {
  const sections = base.sections.map((s) =>
    s.id === "mechanism"
      ? { ...s, voiceover: `${words(38)} compressor squeezes air` }
      : s.id === "hook"
        ? { ...s, voiceover: `${words(9)} engines` }
        : s,
  );
  const plan = {
    model: "jet-engine" as const,
    worldOptOut: "unit test base" as string | undefined,
    coverText: "Things hide this",
    cover: { yaw: 30, pitch: 15, zoom: 1 },
    opener: { yaw: 20, pitch: 10, zoom: 1 },
    hook: { yaw: 20, pitch: 10, zoom: 1, beats: [{ cue: "engines", fallback: 0.5, do: "reveal" as const }] },
    mechanism: {
      yaw: 60,
      pitch: 20,
      zoom: 1,
      beats: [{ cue: "squeezes", fallback: 0.5, do: "focus" as const, part: "compressor" }],
    },
  };
  const withPlan = (p: typeof plan | Record<string, unknown>) =>
    ({ ...base, sections, blender: p }) as PostScript;

  it("accepts a valid plan", () => {
    expect(validateScript(withPlan(plan)).errors).toEqual([]);
  });

  it("requires a world unless the post opts out with a reason", () => {
    const required = 'blender.world is required (sea, coast, track, bench, cafe, rail); add a world for the topic (docs/blender.md)';
    expect(validateScript(withPlan({ ...plan, worldOptOut: undefined })).errors).toContain(required);
    expect(validateScript(withPlan({ ...plan, worldOptOut: " " })).errors).toContain(required);
  });

  it("rejects a world and an opt-out together", () => {
    expect(validateScript(withPlan({ ...plan, world: "sea" })).errors).toContain(
      "blender: set world or worldOptOut, not both",
    );
  });

  it("accepts the sea world on a model with a waterline", () => {
    const sea = { ...plan, worldOptOut: undefined, model: "bulbous-bow", world: "sea", hook: { yaw: 20, pitch: 10, zoom: 1 }, mechanism: { yaw: 60, pitch: 20, zoom: 1, beats: [{ cue: "squeezes", fallback: 0.5, do: "wide" }] } };
    expect(validateScript(withPlan(sea)).errors).toEqual([]);
  });

  it("accepts the coast world with a placement, and rejects a placement elsewhere", () => {
    const coast = { ...plan, worldOptOut: undefined, world: "coast", opener: { ...plan.opener, coast: "shore" } };
    expect(validateScript(withPlan(coast)).errors).toEqual([]);
    expect(validateScript(withPlan({ ...coast, opener: { ...plan.opener, coast: "moon" } })).errors).toContain(
      "blender.opener: coast must be sea, shore, land",
    );
    expect(validateScript(withPlan({ ...plan, opener: { ...plan.opener, coast: "land" } })).errors).toContain(
      "blender.opener: coast only applies to the coast world",
    );
  });

  it("rejects unknown worlds, and the sea on a model with no waterline", () => {
    expect(validateScript(withPlan({ ...plan, world: "moon" })).errors).toContain(
      'blender.world "moon" is unknown (sea, coast, track, bench, cafe, rail)',
    );
    expect(validateScript(withPlan({ ...plan, world: "sea" })).errors).toContain(
      'blender.world "sea" needs a model with a waterline part',
    );
  });

  it("rejects framing outside the picture", () => {
    const off = { ...plan, opener: { ...plan.opener, frameY: 1.4 } };
    expect(validateScript(withPlan(off)).errors).toContain("blender.opener: frameY must be between 0 and 1");
  });

  it("rejects an opt-out without a reason", () => {
    expect(validateScript({ ...base, blender: { optOut: " " } }).errors).toContain(
      "blender.optOut needs a reason",
    );
  });

  it("rejects unknown models, parts and unspoken cues", () => {
    expect(validateScript(withPlan({ ...plan, model: "toaster" })).errors[0]).toMatch(/not in src\/brand\/models/);
    const badPart = {
      ...plan,
      mechanism: { ...plan.mechanism, beats: [{ cue: "squeezes", fallback: 0.5, do: "focus", part: "wing" }] },
    };
    expect(validateScript(withPlan(badPart)).errors[0]).toMatch(/part "wing"/);
    const badCue = {
      ...plan,
      mechanism: { ...plan.mechanism, beats: [{ cue: "banana", fallback: 0.5, do: "explode" }] },
    };
    expect(validateScript(withPlan(badCue)).errors[0]).toMatch(/cue "banana"/);
  });

  it("rejects labels that repeat the VO, but allows numbers", () => {
    const label = (text: string) => ({
      ...plan,
      mechanism: {
        ...plan.mechanism,
        beats: [{ cue: "squeezes", fallback: 0.5, do: "label", part: "compressor", label: text }],
      },
    });
    expect(validateScript(withPlan(label("compressor"))).errors[0]).toMatch(/repeats the voice-over/);
    expect(validateScript(withPlan(label("40:1"))).errors).toEqual([]);
  });

  it("caps the cover text", () => {
    const long = { ...plan, coverText: "one two three four five" };
    expect(validateScript(withPlan(long)).errors[0]).toMatch(/at most 4 words/);
  });

  it("makes new covers name the topic", () => {
    const vague = { ...plan, coverText: "2 plates steer" };
    expect(validateScript(withPlan(vague)).errors[0]).toMatch(/must name the topic "Thing"/);
    const old = { ...withPlan(vague), postNumber: COVER_NAMES_TOPIC_FROM - 1 } as PostScript;
    expect(validateScript(old).errors).toEqual([]);
  });

  it("matches the topic in the cover text", () => {
    expect(coverNamesTopic("Helicopters steer with 2 plates", "helicopter")).toBe(true);
    expect(coverNamesTopic("Hovercraft float on air", "a hovercraft")).toBe(true);
    expect(coverNamesTopic("Your gold is part copper", "gold jewellery")).toBe(true);
    expect(coverNamesTopic("It's part copper", "gold jewellery")).toBe(false);
  });

  describe("camera rhythm (close-up, then wide)", () => {
    const rhythm = (beats: Record<string, unknown>[]) =>
      validateScript(withPlan({ ...plan, mechanism: { ...plan.mechanism, beats } })).warnings;
    const close = { cue: "squeezes", fallback: 0.3, do: "focus", part: "compressor" };
    const wide = { cue: "air", fallback: 0.9, do: "wide" };

    it("passes a close-up followed by a wide", () => {
      expect(rhythm([close, wide])).toEqual([]);
      expect(rhythm([close, { ...wide, do: "collapse" }])).toEqual([]);
    });

    it("warns without a close-up", () => {
      expect(rhythm([{ ...wide, do: "explode" }])[0]).toMatch(/no close-up/);
      const unfollowed = { cue: "air", fallback: 0.3, do: "flow", part: "fan", to: "nozzle", follow: false };
      expect(rhythm([unfollowed])[0]).toMatch(/no close-up/);
    });

    it("warns when the mechanism ends on a close-up (a followed flow counts)", () => {
      expect(rhythm([close])[0]).toMatch(/ends on a close-up/);
      const flow = { cue: "air", fallback: 0.95, do: "flow", part: "fan", to: "nozzle" };
      expect(rhythm([close, wide, flow])[0]).toMatch(/ends on a close-up/);
    });

    it("rejects follow on anything but flow", () => {
      expect(validateScript(withPlan({ ...plan, mechanism: { ...plan.mechanism, beats: [{ ...close, follow: true }] } })).errors[0]).toMatch(
        /"follow" only applies to flow/,
      );
    });
  });
});
