import type { Vec3 } from "./stage";

// A flat ring in the XZ plane. Turn 0 = node 0 at the back, then clockwise seen from
// above (back, right, front, left for four nodes).
export const ringPoint = (turn: number, r: number): Vec3 => {
  const a = -Math.PI / 2 + turn * Math.PI * 2;
  return [r * Math.cos(a), 0, r * Math.sin(a)];
};

// Arc from node i to node i+1, stopping `gap` turns short of both, drawn to `progress`.
export const arcPoints = (
  i: number,
  n: number,
  r: number,
  gap: number,
  progress: number,
  steps = 32,
): Vec3[] => {
  if (progress <= 0) return [];
  const from = i / n + gap;
  const to = from + (1 / n - 2 * gap) * Math.min(1, progress);
  return Array.from({ length: steps + 1 }, (_, k) => ringPoint(from + ((to - from) * k) / steps, r));
};
