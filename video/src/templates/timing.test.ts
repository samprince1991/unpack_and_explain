import type { Caption } from "@remotion/captions";
import { describe, expect, it } from "vitest";
import {
  computeTimeline,
  countWords,
  estimateCaptions,
  estimateDurationMs,
  mergeCaptions,
  msToFrames,
} from "./timing";
import type { VoSection } from "./types";

const cap = (text: string, startMs: number, endMs: number): Caption => ({
  text,
  startMs,
  endMs,
  timestampMs: null,
  confidence: null,
});

describe("countWords / estimateDurationMs", () => {
  it("counts words separated by any whitespace", () => {
    expect(countWords("  GPS doesn't\ttrack you. ")).toBe(4);
  });

  it("estimates duration from words per second", () => {
    expect(estimateDurationMs("one two three four five", 2.5)).toBe(2000);
  });
});

describe("msToFrames", () => {
  it("rounds up so audio is never cut", () => {
    expect(msToFrames(1000, 30)).toBe(30);
    expect(msToFrames(1001, 30)).toBe(31);
  });
});

describe("computeTimeline", () => {
  it("adds tail pad, transition overlap and the CTA minimum", () => {
    const { sections, totalFrames } = computeTimeline(
      [
        { id: "hook", durationMs: 1000 },
        { id: "cta", durationMs: 2000 },
      ],
      30,
      12,
    );
    // hook: 30 audio + 6 pad + 12 transition overlap
    expect(sections[0]).toEqual({ id: "hook", from: 0, durationInFrames: 48 });
    // cta: max(60 + 6, 90 minimum), starts where the transition begins
    expect(sections[1]).toEqual({ id: "cta", from: 36, durationInFrames: 90 });
    expect(totalFrames).toBe(126);
  });

  it("matches TransitionSeries total = sum - transitions", () => {
    const { sections, totalFrames } = computeTimeline(
      [
        { id: "hook", durationMs: 3000 },
        { id: "setup", durationMs: 5000 },
        { id: "cta", durationMs: 4000 },
      ],
      30,
      12,
    );
    const sum = sections.reduce((n, s) => n + s.durationInFrames, 0);
    expect(totalFrames).toBe(sum - 2 * 12);
  });
});

describe("estimateCaptions", () => {
  it("spreads words evenly with a leading space after the first", () => {
    expect(estimateCaptions("a b", 1000)).toEqual([cap("a", 0, 500), cap(" b", 500, 1000)]);
  });
});

describe("mergeCaptions", () => {
  it("offsets each section by its start and normalizes spacing", () => {
    const vo: VoSection[] = [
      { id: "hook", text: "", file: null, durationMs: 1000, captions: [cap("Hi", 0, 400)] },
      { id: "cta", text: "", file: null, durationMs: 1000, captions: [cap("Go", 0, 300)] },
    ];
    const timings = [
      { id: "hook" as const, from: 0, durationInFrames: 48 },
      { id: "cta" as const, from: 36, durationInFrames: 90 },
    ];
    // Each section's last word ends a caption page, so pages never span sections.
    expect(mergeCaptions(vo, timings, 30)).toEqual([
      { ...cap("Hi", 0, 400), pageBreakAfter: true },
      { ...cap(" Go", 1200, 1500), pageBreakAfter: true },
    ]);
  });
});
