import { describe, expect, it } from "vitest";
import { ChartLimitError } from "../geometry";
import { pieLayout, slicePath } from "./layout";

const box = { x: 100, y: 100, width: 600, height: 500 };
const data = [
  { id: "a", value: 50 },
  { id: "b", value: 30 },
  { id: "c", value: 20 },
];

describe("pieLayout", () => {
  it("covers the full circle in data order, starting at 12 o'clock", () => {
    const { slices } = pieLayout(data, box);
    expect(slices.map((s) => s.id)).toEqual(["a", "b", "c"]);
    expect(slices[0].startAngle).toBeCloseTo(0);
    expect(slices[2].endAngle).toBeCloseTo(Math.PI * 2);
  });

  it("fits the circle in the box and makes a donut hole", () => {
    const pie = pieLayout(data, box);
    expect(pie.cx - pie.outer).toBeGreaterThanOrEqual(box.x);
    expect(pie.cy + pie.outer).toBeLessThanOrEqual(box.y + box.height);
    expect(pie.inner).toBe(0);
    expect(pieLayout(data, box, true).inner).toBeGreaterThan(0);
  });

  it("builds slice paths, cut at a given angle", () => {
    const pie = pieLayout(data, box);
    expect(slicePath(pie, pie.slices[0])).toMatch(/^M/);
    expect(slicePath(pie, pie.slices[1], 0)).not.toBe(
      slicePath(pie, pie.slices[1]),
    );
  });

  it("throws over 6 slices or a zero total", () => {
    const seven = Array.from({ length: 7 }, (_, i) => ({
      id: `${i}`,
      value: 1,
    }));
    expect(() => pieLayout(seven, box)).toThrow(ChartLimitError);
    expect(() => pieLayout([{ id: "a", value: 0 }], box)).toThrow(
      ChartLimitError,
    );
  });

  it("is deterministic", () => {
    expect(pieLayout(data, box)).toEqual(pieLayout(data, box));
  });
});
