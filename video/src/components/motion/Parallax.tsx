import { noise2D } from "@remotion/noise";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { idle } from "../../brand/motion";

// One depth layer of a 2D scene. Near layers (depth 1) drift and push in more than far
// ones (depth 0), so stacked flat drawings read as 3D space. Wrap each layer (HTML).
export const Parallax: React.FC<{
  depth: number;
  seed?: string;
  // px of drift at depth 1.
  amplitude?: number;
  children: React.ReactNode;
}> = ({ depth, seed = "parallax", amplitude = 18, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame * idle.driftSpeed;
  const push = 1 + (idle.pushIn - 1) * 2 * depth * (frame / Math.max(durationInFrames, 1));
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        translate: `${noise2D(`${seed}-x`, t, 0) * amplitude * depth}px ${noise2D(`${seed}-y`, 0, t) * amplitude * depth * 0.6}px`,
        scale: push,
      }}
    >
      {children}
    </div>
  );
};
