import { getLength, getPointAtLength } from "@remotion/paths";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../brand/motion";
import { colors, withAlpha } from "../../brand/tokens";

type TravelProps = {
  // Path the dot follows.
  d: string;
  at: number;
  // Frames for one trip along the path.
  frames?: number;
  // Number of trips (Infinity = until the scene ends). A new trip starts every `frames`.
  repeat?: number;
  // No new trips start at or after this frame.
  until?: number;
  r?: number;
  color?: string;
  // Fading copies behind the dot: a cheap motion blur that reads as speed.
  tail?: number;
};

// A dot (signal, packet, car...) moving along a path, with a comet tail.
export const Travel: React.FC<TravelProps> = ({
  d,
  at,
  frames = 30,
  repeat = 1,
  until,
  r = 10,
  color = colors.diagram.stroke,
  tail = 5,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - at;
  if (elapsed < 0) {
    return null;
  }
  const trip = Math.floor(elapsed / frames);
  if (trip >= repeat || (until !== undefined && at + trip * frames >= until)) {
    return null;
  }
  const length = getLength(d);
  const local = elapsed - trip * frames;
  const pointAt = (f: number) =>
    getPointAtLength(
      d,
      interpolate(f, [0, frames], [0, 1], { ...clamp, easing: ease.smooth }) *
        length,
    );
  // Fade at both ends of a trip so repeats don't blink.
  const fade = interpolate(
    local,
    [0, 4, frames - 4, frames],
    [0, 1, 1, 0],
    clamp,
  );
  const head = pointAt(local);

  return (
    <g opacity={fade}>
      {Array.from({ length: tail }, (_, i) => {
        const p = pointAt(local - (i + 1) * 1.5);
        const k = (i + 1) / (tail + 1);
        return p ? (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={r * (1 - k * 0.6)}
            fill={withAlpha(color, 0.5 * (1 - k))}
          />
        ) : null;
      })}
      {head ? <circle cx={head.x} cy={head.y} r={r} fill={color} /> : null}
    </g>
  );
};
