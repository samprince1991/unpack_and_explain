import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";
import { clamp } from "../brand/motion";

type DipProps = Record<string, never>;

// Fade through the background: the outgoing scene is gone before the incoming one
// appears, so two busy scenes never overlap (a crossfade would stack them).
const Dip: React.FC<TransitionPresentationComponentProps<DipProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  const opacity =
    presentationDirection === "exiting"
      ? interpolate(presentationProgress, [0, 0.5], [1, 0], clamp)
      : interpolate(presentationProgress, [0.5, 1], [0, 1], clamp);

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const dip = (): TransitionPresentation<DipProps> => ({ component: Dip, props: {} });
