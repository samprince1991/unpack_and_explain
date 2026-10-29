import { Easing } from "remotion";

export const ease = {
  // Default for almost everything: no overshoot.
  smooth: Easing.spring({ damping: 200 }),
  out: Easing.bezier(0.16, 1, 0.3, 1),
  // Slight overshoot. Logo and stamps only.
  pop: Easing.spring({ damping: 12, stiffness: 160 }),
} as const;

export const durations = {
  enter: 12,
  crossfade: 12,
  sting: 20,
} as const;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
