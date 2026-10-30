import { describe, expect, it } from "vitest";
import { packetAt, type Node3D } from "./network";

const nodes: Node3D[] = [
  { id: "a", pos: [0, 0, 0] },
  { id: "b", pos: [1, 0, 0] },
  { id: "c", pos: [2, 0, 0] },
];

describe("packetAt", () => {
  it("waits at the first node before travelAt", () => {
    expect(packetAt(0, ["a", "b", "c"], nodes, 30, 60)).toMatchObject({
      pos: [0, 0, 0],
      segment: 0,
      progress: 0,
    });
  });

  it("ends at the last node", () => {
    expect(packetAt(200, ["a", "b", "c"], nodes, 30, 60)).toMatchObject({
      pos: [2, 0, 0],
      segment: 1,
      progress: 1,
    });
  });

  it("is on the second segment past halfway", () => {
    const p = packetAt(70, ["a", "b", "c"], nodes, 30, 60);
    expect(p.segment).toBe(1);
    expect(p.pos[0]).toBeGreaterThan(1);
  });

  it("throws on an unknown node id", () => {
    expect(() => packetAt(0, ["a", "zz"], nodes, 0, 10)).toThrow(/zz/);
  });
});
