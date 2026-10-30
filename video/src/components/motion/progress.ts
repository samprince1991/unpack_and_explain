import { interpolate } from "remotion";
import { clamp, durations, ease } from "../../brand/motion";

// 0 -> 1 over an entrance that starts at `at` (local frame).
export const enterProgress = (
  frame: number,
  at: number,
  frames: number = durations.enter,
  easing: (t: number) => number = ease.smooth,
): number =>
  interpolate(frame, [at, at + frames], [0, 1], { ...clamp, easing });

// 1 while shown, fading to 0 after `exitAt`. No exit when `exitAt` is undefined.
export const exitProgress = (
  frame: number,
  exitAt: number | undefined,
  frames: number = durations.enter,
): number =>
  exitAt === undefined ? 1 : 1 - enterProgress(frame, exitAt, frames);

// Start frame of item `i` in a group that enters one after another.
export const stagger = (
  at: number,
  i: number,
  gap: number = durations.stagger,
): number => at + i * gap;
