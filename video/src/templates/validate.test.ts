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
  source: "Somewhere.gov",
  verify: [],
  sections: [
    { id: "hook", voiceover: words(10), visual: "" },
    { id: "setup", voiceover: words(15), visual: "" },
    { id: "mechanism", voiceover: words(40), visual: "" },
    { id: "payoff", voiceover: words(26), visual: "" },
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

  it("warns when spoken words are outside 90-110", () => {
    const sections = base.sections.map((x) =>
      x.id === "mechanism" ? { ...x, voiceover: words(80) } : x,
    );
    expect(validateScript({ ...base, sections }).warnings[0]).toMatch(/outside 90-110/);
  });
});
