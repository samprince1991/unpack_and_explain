import { interpolate } from "remotion";
import { clamp, ease } from "../../brand/motion";

export type ExplodeOptions = {
  count: number;
  // Layer spacing when stacked, and the extra gap once exploded (scene units).
  thickness: number;
  gap: number;
  explodeAt: number;
  explodeFrames: number;
  // Frames between layers starting to move.
  stagger: number;
};

// Offset of layer i along the axis, centered on the middle of the stack.
export const layerOffset = (i: number, frame: number, o: ExplodeOptions) => {
  const start = o.explodeAt + i * o.stagger;
  const p = interpolate(frame, [start, start + o.explodeFrames], [0, 1], {
    ...clamp,
    easing: ease.smooth,
  });
  return (i - (o.count - 1) / 2) * (o.thickness + o.gap * p);
};
