import { describe, expect, it } from "vitest";
import { ChartLimitError } from "../geometry";
import { sankeyLayout } from "./layout";

const box = { x: 150, y: 400, width: 780, height: 600 };
const data = {
  nodes: [
    { id: "pay", name: "Pay" },
    { id: "tax", name: "Tax" },
    { id: "net", name: "Net" },
    { id: "rent", name: "Rent" },
    { id: "save", name: "Save" },
  ],
  links: [
    { source: "pay", target: "tax", value: 20 },
    { source: "pay", target: "net", value: 80 },
    { source: "net", target: "rent", value: 50 },
    { source: "net", target: "save", value: 30 },
  ],
};

describe("sankeyLayout", () => {
  it("puts nodes in columns inside the box", () => {
    const { nodes } = sankeyLayout(data, box);
    const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
    expect(by.pay.column).toBe(0);
    expect(by.net.column).toBe(1);
    expect(by.rent.column).toBe(2);
    for (const n of nodes) {
      expect(n.x).toBeGreaterThanOrEqual(box.x);
      expect(n.x + n.width).toBeLessThanOrEqual(box.x + box.width + 1e-6);
      expect(n.y).toBeGreaterThanOrEqual(box.y - 1e-6);
      expect(n.y + n.height).toBeLessThanOrEqual(box.y + box.height + 1e-6);
    }
  });

  it("labels the last column on the left of its nodes", () => {
    const { nodes } = sankeyLayout(data, box);
    expect(nodes.find((n) => n.id === "rent")?.anchor).toBe("end");
    expect(nodes.find((n) => n.id === "pay")?.anchor).toBe("start");
  });

  it("builds link paths keyed source->target, width by value", () => {
    const { links } = sankeyLayout(data, box);
    const by = Object.fromEntries(links.map((l) => [l.id, l]));
    expect(by["pay->net"].width).toBeGreaterThan(by["pay->tax"].width);
    expect(by["net->rent"].d).toMatch(/^M/);
  });

  it("throws on unknown nodes, too many columns or nodes per column", () => {
    expect(() =>
      sankeyLayout(
        {
          nodes: [{ id: "a" }],
          links: [{ source: "a", target: "x", value: 1 }],
        },
        box,
      ),
    ).toThrow(/unknown node "x"/);
    const chain = {
      nodes: ["a", "b", "c", "d"].map((id) => ({ id })),
      links: [
        { source: "a", target: "b", value: 1 },
        { source: "b", target: "c", value: 1 },
        { source: "c", target: "d", value: 1 },
      ],
    };
    expect(() => sankeyLayout(chain, box)).toThrow(/columns/);
    const fan = {
      nodes: [{ id: "s" }, ...["a", "b", "c", "d", "e"].map((id) => ({ id }))],
      links: ["a", "b", "c", "d", "e"].map((t) => ({
        source: "s",
        target: t,
        value: 1,
      })),
    };
    expect(() => sankeyLayout(fan, box)).toThrow(ChartLimitError);
  });
});
