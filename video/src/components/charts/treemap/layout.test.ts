import { describe, expect, it } from "vitest";
import { ChartLimitError } from "../geometry";
import { treemapLayout } from "./layout";

const box = { x: 100, y: 100, width: 700, height: 500 };
const data = {
  id: "root",
  children: [
    { id: "a", value: 60 },
    {
      id: "g",
      children: [
        { id: "b", value: 25 },
        { id: "c", value: 15 },
      ],
    },
  ],
};

describe("treemapLayout", () => {
  it("returns every node but the root, inside the box", () => {
    const blocks = treemapLayout(data, box);
    expect(blocks.map((b) => b.id).sort()).toEqual(["a", "b", "c", "g"]);
    for (const b of blocks) {
      expect(b.x).toBeGreaterThanOrEqual(box.x);
      expect(b.y).toBeGreaterThanOrEqual(box.y);
      expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width);
      expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height);
    }
  });

  it("gives bigger values bigger blocks and marks leaves", () => {
    const by = Object.fromEntries(
      treemapLayout(data, box).map((b) => [b.id, b]),
    );
    expect(by.a.width * by.a.height).toBeGreaterThan(by.b.width * by.b.height);
    expect(by.b.width * by.b.height).toBeGreaterThan(by.c.width * by.c.height);
    expect(by.g.leaf).toBe(false);
    expect(by.a.leaf).toBe(true);
  });

  it("throws over 8 leaves or more than 2 levels", () => {
    const nine = {
      id: "r",
      children: Array.from({ length: 9 }, (_, i) => ({ id: `${i}`, value: 1 })),
    };
    expect(() => treemapLayout(nine, box)).toThrow(ChartLimitError);
    const deep = {
      id: "r",
      children: [
        { id: "a", children: [{ id: "b", children: [{ id: "c", value: 1 }] }] },
      ],
    };
    expect(() => treemapLayout(deep, box)).toThrow(/levels/);
  });

  it("is deterministic", () => {
    expect(treemapLayout(data, box)).toEqual(treemapLayout(data, box));
  });
});
