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
