import { describe, expect, it } from "vitest";
import { barHeight, barX } from "./bars";

const opts = { values: [2, 4, 1], maxHeight: 2, riseAt: 10, stagger: 0, riseFrames: 20 };

describe("Bars3D maths", () => {
  it("starts flat", () => {
    expect(barHeight(1, 0, opts)).toBe(0);
  });

  it("scales the tallest value to maxHeight", () => {
    expect(barHeight(1, 100, opts)).toBeCloseTo(2);
    expect(barHeight(0, 100, opts)).toBeCloseTo(1);
  });

  it("centers the row on x 0", () => {
    expect([0, 1, 2].map((i) => barX(i, 3, 0.6))).toEqual([-0.6, 0, 0.6]);
  });
});
