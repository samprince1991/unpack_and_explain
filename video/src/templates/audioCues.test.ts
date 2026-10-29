import { describe, expect, it } from "vitest";
import { audioCues } from "./audioCues";

describe("audioCues", () => {
  it("pops on the logo and chimes on the congrats card; no sounds on section changes", () => {
    const sections = [
      { id: "question" as const, from: 0, durationInFrames: 80 },
      { id: "hook" as const, from: 68, durationInFrames: 112 },
      { id: "congrats" as const, from: 300, durationInFrames: 90 },
      { id: "cta" as const, from: 378, durationInFrames: 90 },
    ];
    expect(audioCues(sections, 12)).toEqual([
      { name: "pop", from: 0 },
      { name: "chime", from: 306 },
    ]);
  });
});
