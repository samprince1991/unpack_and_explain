import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { clamp } from "../../brand/motion";

type Props = { distance: number };

// "Next step": the old scene drifts left and fades, then the new one arrives from the
// right. Sequential halves, so the two never overlap.
const Push: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps: { distance },
}) => {
  const exiting = presentationDirection === "exiting";
  const t = exiting
    ? interpolate(p, [0, 0.5], [0, 1], clamp)
    : interpolate(p, [0.5, 1], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - t,
        translate: `${(exiting ? -1 : 1) * distance * t}px 0px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const push = (distance = 120): TransitionPresentation<Props> => ({
  component: Push,
  props: { distance },
});
