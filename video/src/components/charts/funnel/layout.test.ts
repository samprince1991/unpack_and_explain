import { describe, expect, it } from "vitest";
import { ChartLimitError } from "../geometry";
import { funnelLayout } from "./layout";

const box = { x: 150, y: 400, width: 780, height: 600 };
const data = [
  { id: "visit", name: "Visit", value: 1000 },
  { id: "signup", name: "Sign up", value: 300 },
  { id: "buy", name: "Buy", value: 40 },
];

describe("funnelLayout", () => {
  it("stacks stages top to bottom, each narrower, inside the box", () => {
    const stages = funnelLayout(data, box);
    expect(stages[0].top).toBeCloseTo(box.y);
    expect(stages[2].bottom).toBeCloseTo(box.y + box.height);
    expect(stages[0].topWidth).toBeGreaterThan(stages[1].topWidth);
    expect(stages[1].topWidth).toBeGreaterThan(stages[2].topWidth);
    expect(stages[0].topWidth).toBeLessThanOrEqual(box.width);
  });

  it("throws over 6 stages, or names in stages too short for two lines", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({
      id: `${i}`,
      value: 7 - i,
    }));
    expect(() => funnelLayout(seven, box)).toThrow(ChartLimitError);
    const named = Array.from({ length: 6 }, (_, i) => ({
      id: `${i}`,
      name: "Step",
      value: 6 - i,
    }));
    expect(() => funnelLayout(named, { ...box, height: 400 })).toThrow(
      /taller/,
    );
  });

  it("is deterministic", () => {
    expect(funnelLayout(data, box)).toEqual(funnelLayout(data, box));
  });
});
