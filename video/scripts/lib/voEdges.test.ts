import { describe, expect, it } from "vitest";
import { findTailBleed, rmsEnvelope } from "./voEdges";

// Envelope in 10 ms frames: n frames at level v.
const run = (n: number, v: number) => Array.from({ length: n }, () => v);

describe("findTailBleed", () => {
  it("cuts a short burst after the final silence", () => {
    // 2 s speech, 300 ms silence, 30 ms bleed (like setup.mp3 in post 2).
    const env = [...run(200, 4000), ...run(30, 1), 148, 2089, 900];
    expect(findTailBleed(env, 1500)).toBe(2300 - 80);
  });

  it("leaves a clean file alone", () => {
    expect(findTailBleed([...run(200, 4000), ...run(50, 1)], 1500)).toBeNull();
  });

  it("keeps a real short last word after a pause", () => {
    // "..., too." : the word starts after the pause, so it's the last word.
    const env = [...run(200, 4000), ...run(15, 1), ...run(25, 3000), ...run(20, 1)];
    expect(findTailBleed(env, 2150)).toBeNull();
  });

  it("keeps sound that is longer than a bleed", () => {
    const env = [...run(200, 4000), ...run(20, 1), ...run(40, 3000)];
    expect(findTailBleed(env, 1000)).toBeNull();
  });
});

describe("rmsEnvelope", () => {
  it("averages 10 ms windows", () => {
    const samples = new Int16Array(320).fill(100);
    expect(rmsEnvelope(samples, 16000)).toEqual([100, 100]);
  });
});
