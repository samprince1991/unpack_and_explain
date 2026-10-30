import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { layout } from "../../brand/layout";
import { clamp } from "../../brand/motion";
import { video } from "../../brand/tokens";

type Props = { x: number; y: number };

// Farthest frame corner from any point inside the frame, so the circle always covers it.
const MAX_RADIUS = Math.hypot(video.width, video.height);

// Zoom-into-a-detail: the old scene fades out, then the new one opens from a point
// (default: center of the visual region; pass the old scene's amber point for a match cut).
const IrisReveal: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps: { x, y },
}) => {
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill
        style={{ opacity: interpolate(p, [0, 0.45], [1, 0], clamp) }}
      >
        {children}
      </AbsoluteFill>
    );
  }
  const r = interpolate(p, [0.4, 1], [0, MAX_RADIUS], clamp);
  return (
    <AbsoluteFill style={{ clipPath: `circle(${r}px at ${x}px ${y}px)` }}>
      {children}
    </AbsoluteFill>
  );
};

export const irisReveal = (
  x: number = layout.column.x + layout.column.width / 2,
  y: number = (layout.regions.visual.top + layout.regions.visual.bottom) / 2,
): TransitionPresentation<Props> => ({
  component: IrisReveal,
  props: { x, y },
});
