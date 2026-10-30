import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { clamp } from "../../brand/motion";

type Props = Record<string, never>;

// Dip with depth: the old scene sinks back and blurs out, the new one settles forward.
// Still sequential (first half out, second half in), so scenes never stack.
const ZoomDip: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const exiting = presentationDirection === "exiting";
  const t = exiting
    ? interpolate(p, [0, 0.5], [0, 1], clamp)
    : interpolate(p, [0.5, 1], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - t,
        scale: String(exiting ? 1 - 0.04 * t : 1 + 0.04 * t),
        filter: `blur(${t * 8}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const zoomDip = (): TransitionPresentation<Props> => ({
  component: ZoomDip,
  props: {},
});
