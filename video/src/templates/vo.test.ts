import { describe, expect, it } from "vitest";
import type { PostScript, VoManifest } from "./types";
import { buildEstimatedManifest, staleSections } from "./vo";

const script = {
  id: "post-99-test",
  sections: [
    { id: "hook", voiceover: "one two three four five", visual: "" },
    { id: "cta", voiceover: "six seven", visual: "" },
  ],
} as unknown as PostScript;

describe("buildEstimatedManifest", () => {
  it("estimates durations and captions without audio files", () => {
    const m = buildEstimatedManifest(script, 2.5);
    expect(m.estimated).toBe(true);
    expect(m.sections.map((s) => [s.id, s.durationMs, s.file])).toEqual([
      ["hook", 2000, null],
      ["cta", 800, null],
    ]);
    expect(m.sections[0].captions).toHaveLength(5);
  });
});

describe("staleSections", () => {
  it("lists sections whose synthesized text differs from the script", () => {
    const vo: VoManifest = {
      postId: script.id,
      estimated: false,
      sections: [
        { id: "hook", text: "one two three four five", file: "a.mp3", durationMs: 1, captions: [] },
        { id: "cta", text: "old text", file: "b.mp3", durationMs: 1, captions: [] },
      ],
    };
    expect(staleSections(script, vo)).toEqual(["cta"]);
  });
});
