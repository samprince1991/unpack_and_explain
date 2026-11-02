import { getLength, getPointAtLength } from "@remotion/paths";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../brand/motion";
import { colors } from "../../brand/tokens";
import { DrawPath } from "../motion/DrawPath";
import { Ping } from "../motion/Ping";
import { enterProgress } from "../motion/progress";

type GlidePathProps = {
  // Start of the glide (high, left) and the touchdown point on the runway.
  from: { x: number; y: number };
  to: { x: number; y: number };
  // Runway length in px, starting at the touchdown point.
  runway?: number;
  // Frame the ground and dashed route draw in.
  at: number;
  // Frame the aircraft starts gliding, and how long until touchdown.
  flyAt: number;
  flyFrames: number;
};

// Side view of a descent: ground line, runway, the dashed route arcing down, and the
// aircraft (amber, the key element) gliding along it and stopping on the runway.
// SVG, for use inside SceneCanvas. Works for landings, ballistic arcs, slides.
export const GlidePath: React.FC<GlidePathProps> = ({
  from,
  to,
  runway = 220,
  at,
  flyAt,
  flyFrames,
}) => {
  const frame = useCurrentFrame();
  const ctrl = { x: from.x + (to.x - from.x) * 0.55, y: from.y + (to.y - from.y) * 0.05 };
  const d = `M ${from.x} ${from.y} Q ${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`;
  const length = getLength(d);
  const flown = interpolate(frame, [flyAt, flyAt + flyFrames], [0, 1], {
    ...clamp,
    easing: ease.smooth,
  });
  const plane = getPointAtLength(d, flown * length);
  const visible = enterProgress(frame, flyAt, 8);
  const ground = enterProgress(frame, at);

  return (
    <g>
      <line
        x1={from.x - 40}
        y1={to.y}
        x2={to.x + runway + 40}
        y2={to.y}
        stroke={colors.diagram.faint}
        strokeWidth={4}
        opacity={ground}
      />
      <line
        x1={to.x}
        y1={to.y}
        x2={to.x + runway}
        y2={to.y}
        stroke={colors.diagram.stroke}
        strokeWidth={12}
        strokeLinecap="round"
        opacity={ground}
      />
      <DrawPath d={d} at={at} frames={24} dashed color={colors.diagram.soft} />
      {plane ? (
        <circle cx={plane.x} cy={plane.y} r={16} fill={colors.amber[500]} opacity={visible} />
      ) : null}
      <Ping x={to.x} y={to.y} at={flyAt + flyFrames} until={flyAt + flyFrames + 60} from={18} to={80} />
    </g>
  );
};
