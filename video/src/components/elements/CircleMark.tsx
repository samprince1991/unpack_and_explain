import { Circle } from "@remotion/rough-notation";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../brand/motion";
import { colors } from "../../brand/tokens";

const DRAW_FRAMES = 20;
const BOIL_FRAMES = 90;

// Adapted from Remotion Element text/circle-marker: a hand-drawn amber circle around
// the key words of a line. Starts drawing at local frame `start`.
export const CircleMark: React.FC<{ start: number; children: React.ReactNode }> = ({
  start,
  children,
}) => {
  const frame = useCurrentFrame();

  return (
    <Circle
      name="Circle mark"
      progress={interpolate(frame, [start, start + DRAW_FRAMES], [0, 1], {
        ...clamp,
        easing: ease.out,
        posterize: 4,
      })}
      // Changing the seed in steps gives the hand-drawn "boil" from the original Element.
      seed={interpolate(frame, [start, start + BOIL_FRAMES], [1, 90], { ...clamp, posterize: 4 })}
      roughness={1.8}
      strokeWidth={6}
      color={colors.amber[500]}
      padding={{ left: 20, right: 20, top: 12, bottom: 12 }}
      box="around"
    >
      {children}
    </Circle>
  );
};
