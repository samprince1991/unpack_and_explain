import { describe, expect, it } from "vitest";
import { layerOffset } from "./explode";

const opts = { count: 3, thickness: 0.1, gap: 0.5, explodeAt: 30, explodeFrames: 20, stagger: 0 };

describe("layerOffset", () => {
  it("stacks layers flush before the explode", () => {
    expect([0, 1, 2].map((i) => layerOffset(i, 0, opts))).toEqual([-0.1, 0, 0.1]);
  });

  it("separates them by thickness + gap after it", () => {
    const after = [0, 1, 2].map((i) => layerOffset(i, 100, opts));
    expect(after[0]).toBeCloseTo(-0.6);
    expect(after[1]).toBeCloseTo(0);
    expect(after[2]).toBeCloseTo(0.6);
  });
});
