import { describe, expect, it } from "vitest";
import { brand } from "../brand/tokens";
import type { PostScript } from "./types";
import { validateScript } from "./validate";

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
  hero3d: "mechanism",
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

describe("validateScript", () => {
  it("accepts an explicit 3D opt-out with a reason", () => {
    const script = { ...base, hero3d: { optOut: "built before 3D heroes" } };
    expect(validateScript(script).errors).toEqual([]);
  });

  it("rejects a 3D opt-out without a reason", () => {
    const script = { ...base, hero3d: { optOut: "  " } };
    expect(validateScript(script).errors).toContain("hero3d.optOut needs a reason");
  });

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

  it("accepts one approved meme in an allowed section, on a spoken cue word", () => {
    const sections = base.sections.map((x) =>
      x.id === "payoff" ? { ...x, voiceover: `${words(25)} internet.` } : x,
    );
    const meme = { id: "they-dont-know" as const, section: "payoff" as const, cue: "internet" };
    expect(validateScript({ ...base, sections, meme }).errors).toEqual([]);
  });

  it("rejects a meme cue that isn't spoken in its section", () => {
    const meme = { id: "they-dont-know" as const, section: "payoff" as const, cue: "banana" };
    expect(validateScript({ ...base, meme }).errors[0]).toMatch(/meme cue "banana"/);
  });

  it("caps meme length", () => {
    const sections = base.sections.map((x) =>
      x.id === "payoff" ? { ...x, voiceover: `${words(25)} internet.` } : x,
    );
    const meme = { id: "this-is-fine" as const, section: "payoff" as const, cue: "internet", seconds: 4 };
    expect(validateScript({ ...base, sections, meme }).errors[0]).toMatch(/at most 2.5 s/);
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

  it("caps the cover text and needs hero3d", () => {
    const long = { ...plan, coverText: "one two three four five" };
    expect(validateScript(withPlan(long)).errors[0]).toMatch(/at most 4 words/);
    const noHero = { ...withPlan(plan), hero3d: { optOut: "x" } };
    expect(validateScript(noHero).errors).toContain('a blender plan needs hero3d: "mechanism"');
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
