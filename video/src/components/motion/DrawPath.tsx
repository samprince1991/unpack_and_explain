import { evolvePath } from "@remotion/paths";
import { useId } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../../brand/motion";
import { colors } from "../../brand/tokens";

type DrawPathProps = {
  d: string;
  at: number;
  frames?: number;
  // Erase from the start after this frame (the line flows away instead of fading).
  eraseAt?: number;
  color?: string;
  width?: number;
  dashed?: boolean;
};

// Draws any SVG path like a pen stroke (evolvePath from @remotion/paths).
export const DrawPath: React.FC<DrawPathProps> = ({
  d,
  at,
  frames = durations.draw,
  eraseAt,
  color = colors.diagram.stroke,
  width = 4,
  dashed = false,
}) => {
  const frame = useCurrentFrame();
  const maskId = useId();
  const draw = interpolate(frame, [at, at + frames], [0, 1], {
    ...clamp,
    easing: ease.smooth,
  });
  const erase =
    eraseAt === undefined
      ? 0
      : interpolate(frame, [eraseAt, eraseAt + frames], [0, 1], {
          ...clamp,
          easing: ease.smooth,
        });
  if (draw <= 0 || erase >= 1) {
    return null;
  }
  // evolvePath: 0..1 draws in, 1..2 erases from the start.
  const evolution = evolvePath(draw + erase, d);
  if (!dashed) {
    return (
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        {...evolution}
      />
    );
  }
  // A dashed line can't also use strokeDasharray for drawing, so it's revealed through a
  // solid drawn mask instead.
  return (
    <g>
      <mask id={maskId}>
        <path
          d={d}
          fill="none"
          stroke="white"
          strokeWidth={width + 4}
          {...evolution}
        />
      </mask>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray="8 10"
        strokeLinecap="round"
        mask={`url(#${maskId})`}
      />
    </g>
  );
};
