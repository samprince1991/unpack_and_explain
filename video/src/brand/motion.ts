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
  // Gap between items entering one after another.
  stagger: 6,
  // Line drawing (paths, arcs).
  draw: 20,
} as const;

// Always-on motion so a scene never sits still between beats. Small on purpose.
export const idle = {
  // Float: px of drift, and noise speed per frame.
  drift: 4,
  driftSpeed: 0.012,
  // Camera push-in across one section (1.04 = 4% closer by the end).
  pushIn: 1.04,
} as const;

export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
