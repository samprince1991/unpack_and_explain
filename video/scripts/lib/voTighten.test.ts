import { describe, expect, it } from "vitest";
import type { VoSection } from "../../src/templates/types";
import { FRAME_MS } from "./voEdges";
import { findPauseCuts, KEEP_MS } from "./voTighten";

// Envelope with speech (loud) everywhere except the given silent spans, in ms.
const envelope = (lengthMs: number, silent: [number, number][]): number[] =>
  Array.from({ length: lengthMs / FRAME_MS }, (_, f) =>
    silent.some(([a, b]) => f * FRAME_MS >= a && f * FRAME_MS < b) ? 0 : 3000,
  );

const section = (captions: [number, number][]): VoSection =>
  ({ id: "mechanism", text: "", file: "x.mp3", durationMs: 4000, captions: captions.map(([startMs, endMs], i) => ({ text: `w${i}`, startMs, endMs })) }) as unknown as VoSection;

describe("findPauseCuts", () => {
  it("cuts a long silent pause down to KEEP_MS, from its middle", () => {
    const env = envelope(4000, [[1000, 2000]]);
    const cuts = findPauseCuts(env, section([[0, 1000], [2000, 3000]]));
    expect(cuts).toHaveLength(1);
    expect(cuts[0].toMs - cuts[0].fromMs).toBe(1000 - KEEP_MS);
    expect((cuts[0].fromMs + cuts[0].toMs) / 2).toBe(1500);
  });

  it("leaves short pauses alone", () => {
    const env = envelope(4000, [[1000, 1400]]);
    expect(findPauseCuts(env, section([[0, 1000], [1400, 3000]]))).toEqual([]);
  });

  it("only cuts silence, even when the captions claim a longer gap", () => {
    // Captions say 1000-2000 is a pause, but only 1600-2000 is quiet.
    const env = envelope(4000, [[1600, 2000]]);
    expect(findPauseCuts(env, section([[0, 1000], [2000, 3000]]))).toEqual([]);
  });
});
