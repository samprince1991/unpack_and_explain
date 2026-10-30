import { describe, expect, it } from "vitest";
import { arcPoints, ringPoint } from "./ring";

describe("ringPoint", () => {
  it("starts at the back and goes clockwise seen from above", () => {
    const back = ringPoint(0, 2);
    expect(back[0]).toBeCloseTo(0);
    expect(back[2]).toBeCloseTo(-2);
    const right = ringPoint(0.25, 2);
    expect(right[0]).toBeCloseTo(2);
    expect(right[2]).toBeCloseTo(0);
  });
});

describe("arcPoints", () => {
  it("stops short of both nodes", () => {
    const pts = arcPoints(0, 4, 1, 0.05, 1);
    const first = ringPoint(0.05, 1);
    const last = ringPoint(0.2, 1);
    expect(pts[0][0]).toBeCloseTo(first[0]);
    expect(pts.at(-1)?.[0]).toBeCloseTo(last[0]);
  });

  it("is empty before it starts drawing", () => {
    expect(arcPoints(0, 4, 1, 0.05, 0)).toEqual([]);
  });
});
