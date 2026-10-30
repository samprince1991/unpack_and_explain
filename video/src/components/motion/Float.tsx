import { noise2D } from "@remotion/noise";
import { useCurrentFrame } from "remotion";
import { idle } from "../../brand/motion";

type FloatProps = {
  // Different seeds drift differently, so neighbours don't move in lockstep.
  seed: string;
  amplitude?: number;
  speed?: number;
  // Degrees of gentle sway (0 = none).
  sway?: number;
  children: React.ReactNode;
};

// Slow, organic drift (Perlin noise, identical on every render) for elements that would
// otherwise sit still between beats.
export const Float: React.FC<FloatProps> = ({
  seed,
  amplitude = idle.drift,
  speed = idle.driftSpeed,
  sway = 0,
  children,
}) => {
  const t = useCurrentFrame() * speed;
  return (
    <g
      style={{
        transformBox: "fill-box",
        transformOrigin: "center",
        translate: `${noise2D(`${seed}-x`, t, 0) * amplitude}px ${noise2D(`${seed}-y`, 0, t) * amplitude}px`,
        rotate: `${noise2D(`${seed}-r`, t, t) * sway}deg`,
      }}
    >
      {children}
    </g>
  );
};
