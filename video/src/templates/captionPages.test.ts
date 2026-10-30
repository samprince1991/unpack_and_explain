import type { Caption } from "@remotion/captions";
import { describe, expect, it } from "vitest";
import { LINE_CHARS, textWidth, toCaptionPages } from "./captionPages";
import { estimateCaptions } from "./timing";

const caps = (text: string): Caption[] => estimateCaptions(text, text.split(" ").length * 400);
const pages = (text: string) =>
  toCaptionPages(caps(text)).map((p) => p.lines.map((l) => l.map((t) => t.text).join("")));
const flat = (text: string) => pages(text).map((lines) => lines.join(" "));

describe("toCaptionPages", () => {
  it("keeps a short sentence on one line", () => {
    expect(pages("Here's the trick.")).toEqual([["Here's the trick."]]);
  });

  it("starts a new page at every sentence end, so no word is orphaned", () => {
    expect(flat("you don't need to read one line of code to build an app. It works.")).toEqual([
      "you don't need to read one line",
      "of code to build an app.",
      "It works.",
    ]);
  });

  it("keeps a quote on one page and never ends a line on a weak word", () => {
    expect(
      pages("You type 'make me a habit tracker app', and an AI agent writes all the code."),
    ).toEqual([
      ["You type 'make me", "a habit tracker app',"],
      ["and an AI agent", "writes all the code."],
    ]);
  });

  it("prefers commas when a sentence needs several pages", () => {
    expect(flat("It reads your project, plans the steps, and writes the code.")).toEqual([
      "It reads your project,",
      "plans the steps, and writes the code.",
    ]);
  });

  it("breaks before a link word rather than between two content words", () => {
    expect(flat("broadcasting precise timing signals and their positions.")).toEqual([
      "broadcasting precise timing signals",
      "and their positions.",
    ]);
  });

  it("splits a page into at most two lines that fit the column", () => {
    for (const lines of pages(
      "So it doesn't need to read one line of code to build an app, and it still works.",
    )) {
      expect(lines.length).toBeLessThanOrEqual(2);
      for (const line of lines) {
        expect(textWidth(line)).toBeLessThanOrEqual(LINE_CHARS);
      }
    }
  });

  it("lets a leading clause word stand alone but not a trailing one", () => {
    expect(pages("Congrats, you just learned")).toEqual([["Congrats,", "you just learned"]]);
  });

  it("breaks pages at section ends and long pauses", () => {
    const section = caps("one two three");
    section[section.length - 1] = { ...section[section.length - 1], pageBreakAfter: true };
    const after = caps("four five").map((c) => ({ ...c, startMs: c.startMs + 1200, endMs: c.endMs + 1200 }));
    expect(toCaptionPages([...section, ...after]).map((p) => p.lines.flat().length)).toEqual([3, 2]);

    const paused = caps("left right");
    paused[1] = { ...paused[1], startMs: paused[0].endMs + 800, endMs: paused[0].endMs + 1200 };
    expect(toCaptionPages(paused)).toHaveLength(2);
  });

  it("keeps token timings and page bounds", () => {
    const [page] = toCaptionPages(caps("Hi there."));
    expect(page.startMs).toBe(0);
    expect(page.endMs).toBe(800);
    expect(page.lines[0].map((t) => [t.fromMs, t.toMs])).toEqual([
      [0, 400],
      [400, 800],
    ]);
  });
});
