import { interpolate } from "remotion";
import { clamp, ease } from "../../brand/motion";
import type { Vec3 } from "./stage";

export type Node3D = { id: string; pos: Vec3; shape?: "dot" | "box" };

const dist = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

export const nodePos = (nodes: Node3D[], id: string): Vec3 => {
  const node = nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Unknown network node "${id}"`);
  return node.pos;
};

// Where the packet is along the route: constant speed over total length.
export const packetAt = (
  frame: number,
  route: string[],
  nodes: Node3D[],
  travelAt: number,
  travelFrames: number,
) => {
  const pts = route.map((id) => nodePos(nodes, id));
  const progress = interpolate(frame, [travelAt, travelAt + travelFrames], [0, 1], {
    ...clamp,
    easing: ease.smooth,
  });
  const lengths = pts.slice(1).map((p, i) => dist(pts[i], p));
  let left = progress * lengths.reduce((s, l) => s + l, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] === 0 ? 1 : Math.min(1, left / lengths[i]);
      const [a, b] = [pts[i], pts[i + 1]];
      const pos: Vec3 = [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      ];
      return { pos, segment: i, progress };
    }
    left -= lengths[i];
  }
  return { pos: pts[0], segment: 0, progress };
};
