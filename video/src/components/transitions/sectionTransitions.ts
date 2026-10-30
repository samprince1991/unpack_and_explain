import {
  linearTiming,
  springTiming,
  type TransitionPresentation,
  type TransitionTiming,
} from "@remotion/transitions";
import { durations } from "../../brand/motion";
import { dip } from "../dip";
import { irisReveal } from "./irisReveal";
import { push } from "./push";
import { wipeReveal } from "./wipeReveal";
import { zoomDip } from "./zoomDip";

type SectionTransition = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  presentation: TransitionPresentation<any>;
  timing: TransitionTiming;
};

const smooth = () =>
  springTiming({
    config: { damping: 200 },
    durationInFrames: durations.crossfade,
  });

export type SectionTransitionName =
  | "dip"
  | "zoomDip"
  | "push"
  | "iris"
  | "wipe";

// Section transitions a post can pick, keyed by the section that is entering.
// All run for durations.crossfade frames (the timeline overlaps sections by that much),
// and none shows two scenes stacked on the same pixels.
export const sectionTransitions: Record<
  SectionTransitionName,
  () => SectionTransition
> = {
  // Default. Plain fade through the background.
  dip: () => ({
    presentation: dip(),
    timing: linearTiming({ durationInFrames: durations.crossfade }),
  }),
  // Fade with depth. A "new chapter".
  zoomDip: () => ({ presentation: zoomDip(), timing: smooth() }),
  // Next step of a process.
  push: () => ({ presentation: push(), timing: smooth() }),
  // Zooming into a detail.
  iris: () => ({ presentation: irisReveal(), timing: smooth() }),
  // Before / after, myth / fact.
  wipe: () => ({ presentation: wipeReveal(), timing: smooth() }),
};
