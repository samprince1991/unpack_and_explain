import { describe, expect, it } from "vitest";
import { findCueMs } from "./cues";

const caps = [" Three", " distances,", " phone's"].map((text, i) => ({
  text,
  startMs: i * 1000,
  endMs: i * 1000 + 500,
  timestampMs: null,
  confidence: null,
}));

describe("findCueMs", () => {
  it("matches case- and punctuation-insensitively", () => {
    expect(findCueMs(caps, "three")).toBe(0);
    expect(findCueMs(caps, "Distances")).toBe(1000);
    expect(findCueMs(caps, "phone's")).toBe(2000);
  });

  it("returns null when the word is not spoken", () => {
    expect(findCueMs(caps, "fourth")).toBeNull();
  });
});
