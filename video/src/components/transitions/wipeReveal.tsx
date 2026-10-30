import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { colors } from "../../brand/tokens";

type Props = Record<string, never>;

// Before/after: a thin line sweeps left to right. Old scene is clipped away on the left,
// new scene is shown only on the left, so each pixel shows exactly one scene.
const WipeReveal: React.FC<TransitionPresentationComponentProps<Props>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
}) => {
  const edge = `${p * 100}%`;
  if (presentationDirection === "exiting") {
    return (
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${edge})` }}>
        {children}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
        {children}
      </AbsoluteFill>
      {p > 0 && p < 1 ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: edge,
            width: 3,
            translate: "-1.5px 0px",
            background: colors.diagram.soft,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const wipeReveal = (): TransitionPresentation<Props> => ({
  component: WipeReveal,
  props: {},
});
