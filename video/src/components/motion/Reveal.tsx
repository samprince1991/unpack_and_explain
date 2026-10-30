import { useCurrentFrame } from "remotion";
import { durations, ease } from "../../brand/motion";
import { enterProgress, exitProgress } from "./progress";

type RevealProps = {
  // Local frame the entrance starts (usually a useCue value).
  at: number;
  // Optional frame the element starts leaving, so finished beats clear the stage.
  exitAt?: number;
  // Starting offset and scale of the entrance.
  dy?: number;
  fromScale?: number;
  frames?: number;
  // `pop` overshoots: logo, stamps and the one key marker only.
  pop?: boolean;
  children: React.ReactNode;
};

// SVG group that fades + settles in, and optionally out. Use inside SceneCanvas instead of
// `frame >= cue ? <X/> : null`, which snaps elements in and out in a single frame.
export const Reveal: React.FC<RevealProps> = ({
  at,
  exitAt,
  dy = 16,
  fromScale = 0.94,
  frames = durations.enter,
  pop = false,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = enterProgress(frame, at, frames, pop ? ease.pop : ease.smooth);
  const opacity = Math.min(t, 1) * exitProgress(frame, exitAt, frames);
  if (opacity <= 0) {
    return null;
  }
  return (
    <g
      opacity={opacity}
      style={{
        transformBox: "fill-box",
        transformOrigin: "center",
        translate: `0px ${(1 - t) * dy}px`,
        scale: String(fromScale + (1 - fromScale) * t),
      }}
    >
      {children}
    </g>
  );
};
