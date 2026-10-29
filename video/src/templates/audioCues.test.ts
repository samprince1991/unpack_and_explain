import { describe, expect, it } from "vitest";
import { audioCues } from "./audioCues";

describe("audioCues", () => {
  it("pops on the logo, whooshes on each section change and chimes on the CTA", () => {
    const sections = [
      { id: "hook" as const, from: 0, durationInFrames: 112 },
      { id: "setup" as const, from: 100, durationInFrames: 212 },
      { id: "cta" as const, from: 300, durationInFrames: 90 },
    ];
    expect(audioCues(sections, 12)).toEqual([
      { name: "pop", from: 0 },
      { name: "whoosh", from: 100 },
      { name: "chime", from: 306 },
    ]);
  });
});
