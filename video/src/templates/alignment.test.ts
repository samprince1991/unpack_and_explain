import { describe, expect, it } from "vitest";
import { alignmentToCaptions } from "./alignment";

const align = (text: string, perChar = 0.1) => ({
  characters: text.split(""),
  character_start_times_seconds: text.split("").map((_, i) => i * perChar),
  character_end_times_seconds: text.split("").map((_, i) => (i + 1) * perChar),
});

describe("alignmentToCaptions", () => {
  it("groups characters into words with ms timings", () => {
    expect(alignmentToCaptions(align("Hi you."))).toEqual([
      { text: "Hi", startMs: 0, endMs: 200, timestampMs: 100, confidence: null },
      { text: " you.", startMs: 300, endMs: 700, timestampMs: 500, confidence: null },
    ]);
  });

  it("ignores repeated and trailing whitespace", () => {
    expect(alignmentToCaptions(align("a  b ")).map((c) => c.text)).toEqual(["a", " b"]);
  });

  it("throws on mismatched arrays", () => {
    expect(() =>
      alignmentToCaptions({
        characters: ["a"],
        character_start_times_seconds: [],
        character_end_times_seconds: [0.1],
      }),
    ).toThrow();
  });
});
