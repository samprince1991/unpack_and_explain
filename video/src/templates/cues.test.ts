import { describe, expect, it } from "vitest";
import { findCueMs } from "./cues";

const caps = [" Three", " distances,", " phone's", " 'make", " app',"].map(
  (text, i) => ({
    text,
    startMs: i * 1000,
    endMs: i * 1000 + 500,
    timestampMs: null,
    confidence: null,
  }),
);

describe("findCueMs", () => {
  it("matches case- and punctuation-insensitively", () => {
    expect(findCueMs(caps, "three")).toBe(0);
    expect(findCueMs(caps, "Distances")).toBe(1000);
    expect(findCueMs(caps, "phone's")).toBe(2000);
  });

  it("ignores quote marks around a word", () => {
    expect(findCueMs(caps, "make")).toBe(3000);
    expect(findCueMs(caps, "app")).toBe(4000);
  });

  it("returns null when the word is not spoken", () => {
    expect(findCueMs(caps, "fourth")).toBeNull();
  });

  it("matches a part of a hyphenated word at that word's start", () => {
    const hyphen = [
      {
        text: " pounds-versus-kilograms",
        startMs: 500,
        endMs: 1500,
        timestampMs: null,
        confidence: null,
      },
    ];
    expect(findCueMs(hyphen, "pounds")).toBe(500);
    expect(findCueMs(hyphen, "kilograms")).toBe(500);
    expect(findCueMs(hyphen, "versus")).toBe(500);
  });
});
