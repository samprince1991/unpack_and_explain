import { describe, expect, it } from "vitest";
import { ChartLimitError } from "../geometry";
import { lineLayout } from "./layout";

const box = { x: 100, y: 100, width: 700, height: 500 };
const data = [
  { id: "2020", name: "2020", value: 3 },
  { id: "2021", name: "2021", value: 8 },
  { id: "2022", name: "2022", value: 5 },
];

describe("lineLayout", () => {
  it("keeps points inside the box, left to right", () => {
    const { points } = lineLayout(data, box);
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(box.x);
      expect(p.x).toBeLessThanOrEqual(box.x + box.width);
      expect(p.y).toBeGreaterThanOrEqual(box.y);
      expect(p.y).toBeLessThanOrEqual(box.y + box.height);
    }
    expect(points[0].x).toBeLessThan(points[1].x);
  });

  it("puts higher values higher up and builds a path", () => {
    const { points, d } = lineLayout(data, box);
    expect(points[1].y).toBeLessThan(points[0].y);
    expect(d.startsWith("M")).toBe(true);
  });

  it("allows negative values (e.g. temperatures)", () => {
    expect(() =>
      lineLayout(
        [
          { id: "a", value: -5 },
          { id: "b", value: 3 },
        ],
        box,
      ),
    ).not.toThrow();
  });

  it("throws with fewer than 2 or more than 8 points", () => {
    expect(() => lineLayout([{ id: "a", value: 1 }], box)).toThrow(
      ChartLimitError,
    );
    const nine = Array.from({ length: 9 }, (_, i) => ({
      id: `${i}`,
      value: i,
    }));
    expect(() => lineLayout(nine, box)).toThrow(ChartLimitError);
  });

  it("is deterministic", () => {
    expect(lineLayout(data, box)).toEqual(lineLayout(data, box));
  });
});
