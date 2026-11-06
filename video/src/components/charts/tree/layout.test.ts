import { describe, expect, it } from "vitest";
import { ChartLimitError, LINE } from "../geometry";
import { NODE_R, pathIds, treeDiagramLayout } from "./layout";

const box = { x: 100, y: 100, width: 780, height: 600 };
const data = {
  id: "root",
  name: ".",
  children: [
    { id: "com", name: "com", children: [{ id: "shop", name: "shop" }] },
    { id: "org", name: "org" },
  ],
};

describe("treeDiagramLayout", () => {
  it("places levels top to bottom inside the box", () => {
    const { nodes } = treeDiagramLayout(data, box);
    const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
    expect(by.root.y).toBeLessThan(by.com.y);
    expect(by.com.y).toBeLessThan(by.shop.y);
    for (const n of nodes) {
      expect(n.x).toBeGreaterThanOrEqual(box.x);
      expect(n.x).toBeLessThanOrEqual(box.x + box.width);
      expect(n.y).toBeLessThanOrEqual(box.y + box.height);
    }
  });

  it("makes one link per child, keyed by the child id", () => {
    const { links } = treeDiagramLayout(data, box);
    expect(links.map((l) => l.id).sort()).toEqual(["com", "org", "shop"]);
  });

  it("starts branches below the parent's name, not through it", () => {
    const { nodes, links } = treeDiagramLayout(data, box);
    const com = nodes.find((n) => n.id === "com");
    const startY = Number(
      links.find((l) => l.id === "shop")?.d.match(/^M[^,]+,([\d.]+)/)?.[1],
    );
    expect(startY).toBeGreaterThan((com?.y ?? 0) + NODE_R + LINE * 0.9);
  });

  it("pathIds walks from the key up to the root", () => {
    const { nodes } = treeDiagramLayout(data, box);
    expect([...pathIds(nodes, "shop")].sort()).toEqual(["com", "root", "shop"]);
    expect(pathIds(nodes, undefined).size).toBe(0);
  });

  it("throws over 3 levels, over 5 nodes on a level, or names that collide", () => {
    const deep = {
      id: "a",
      children: [{ id: "b", children: [{ id: "c", children: [{ id: "d" }] }] }],
    };
    expect(() => treeDiagramLayout(deep, box)).toThrow(/levels/);
    const wide = {
      id: "r",
      children: Array.from({ length: 6 }, (_, i) => ({ id: `${i}` })),
    };
    expect(() => treeDiagramLayout(wide, box)).toThrow(ChartLimitError);
    const crowded = {
      id: "r",
      children: Array.from({ length: 5 }, (_, i) => ({
        id: `${i}`,
        name: "Long label",
      })),
    };
    expect(() => treeDiagramLayout(crowded, box)).toThrow(/Shorten/);
  });
});
