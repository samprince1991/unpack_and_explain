import { interpolate } from "remotion";
import { clamp, ease } from "../../brand/motion";

export type BarOptions = {
  values: number[];
  maxHeight: number;
  riseAt: number;
  stagger: number;
  riseFrames: number;
};

// Height of bar i: the tallest value reaches maxHeight.
export const barHeight = (i: number, frame: number, o: BarOptions) => {
  const start = o.riseAt + i * o.stagger;
  const p = interpolate(frame, [start, start + o.riseFrames], [0, 1], {
    ...clamp,
    easing: ease.out,
  });
  return (o.values[i] / Math.max(...o.values)) * o.maxHeight * p;
};

// X of bar i, with the row centered on 0.
export const barX = (i: number, count: number, spacing: number) =>
  (i - (count - 1) / 2) * spacing;
