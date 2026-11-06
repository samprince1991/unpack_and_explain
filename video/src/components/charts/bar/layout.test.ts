import { describe, expect, it } from "vitest";
import { ChartLimitError } from "../geometry";
import { barLayout } from "./layout";

const box = { x: 100, y: 100, width: 600, height: 400 };
const data = [
  { id: "a", name: "Mon", value: 10 },
  { id: "b", name: "Tue", value: 20 },
  { id: "c", value: 5 },
];

const inside = (b: { x: number; y: number; width: number; height: number }) =>
  b.x >= box.x - 1e-6 &&
  b.y >= box.y - 1e-6 &&
  b.x + b.width <= box.x + box.width + 1e-6 &&
  b.y + b.height <= box.y + box.height + 1e-6;

describe("barLayout", () => {
  it.each(["vertical", "horizontal"] as const)(
    "keeps %s bars inside the box",
    (o) => {
      expect(barLayout(data, box, o).bars.every(inside)).toBe(true);
    },
  );

  it("maps bigger values to longer bars", () => {
    const v = barLayout(data, box).bars;
    expect(v[1].height).toBeGreaterThan(v[0].height);
    expect(v[0].height).toBeGreaterThan(v[2].height);
    const h = barLayout(data, box, "horizontal").bars;
    expect(h[1].width).toBeGreaterThan(h[0].width);
  });

  it("throws over the limit, on empty, negative and duplicate data", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({
      id: `${i}`,
      value: 1,
    }));
    expect(() => barLayout(seven, box)).toThrow(ChartLimitError);
    expect(() => barLayout([], box)).toThrow(ChartLimitError);
    expect(() => barLayout([{ id: "a", value: -1 }], box)).toThrow(
      ChartLimitError,
    );
    expect(() =>
      barLayout(
        [
          { id: "a", value: 1 },
          { id: "a", value: 2 },
        ],
        box,
      ),
    ).toThrow(/duplicate/);
  });

  it("throws when a name is wider than its bar slot", () => {
    const long = [
      { id: "a", name: "A very long category", value: 1 },
      { id: "b", value: 2 },
      { id: "c", value: 3 },
      { id: "d", value: 4 },
    ];
    expect(() => barLayout(long, box)).toThrow(/Shorten/);
  });

  it("is deterministic", () => {
    expect(barLayout(data, box)).toEqual(barLayout(data, box));
  });
});
