import { interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../../brand/motion";
import { colors } from "../../brand/tokens";

type PingProps = {
  x: number;
  y: number;
  at: number;
  // Frames per ring.
  period?: number;
  // Rings in flight at once, evenly spaced.
  rings?: number;
  from?: number;
  to?: number;
  color?: string;
  // No new rings start at or after this frame.
  until?: number;
};

// Expanding rings that say "here": the key point of a beat. Amber by default.
export const Ping: React.FC<PingProps> = ({
  x,
  y,
  at,
  period = 40,
  rings = 2,
  from = 14,
  to = 70,
  color = colors.amber[500],
  until,
}) => {
  const frame = useCurrentFrame();
  return (
    <g>
      {Array.from({ length: rings }, (_, i) => {
        const start = at + (i * period) / rings;
        const elapsed = frame - start;
        if (elapsed < 0) {
          return null;
        }
        const cycleStart = start + Math.floor(elapsed / period) * period;
        if (until !== undefined && cycleStart >= until) {
          return null;
        }
        const t = (elapsed % period) / period;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={interpolate(t, [0, 1], [from, to])}
            fill="none"
            stroke={color}
            strokeWidth={3}
            opacity={interpolate(t, [0, 0.15, 1], [0, 1, 0], clamp)}
          />
        );
      })}
    </g>
  );
};
