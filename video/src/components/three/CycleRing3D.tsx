import { Billboard, Line } from "@react-three/drei";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../../brand/motion";
import { FILL, line, lineColor, type LineRole } from "./materials";
import { arcPoints, ringPoint } from "./ring";
import type { Vec3 } from "./stage";

type CycleRing3DProps = {
  // Local frame each step node appears; node i sits at turn i / nodes.length.
  nodes: { at: number }[];
  radius?: number;
  nodeRadius?: number;
  // Node drawn brighter (the current step). The moving dot, not the node, is amber.
  active?: number;
};

const circle = (r: number, n = 48): Vec3[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r, 0];
  });

// Scene position of node i: pin its icon there with Label3D (depthScale).
export const ringNode = (i: number, n: number, radius = 1.4) => ringPoint(i / n, radius);

// Cycle style in 3D: steps on a flat ring the camera looks down on, joined by arcs that
// draw in as each next step appears. Icons are 2D overlays (Label3D at ringNode()).
export const CycleRing3D: React.FC<CycleRing3DProps> = ({
  nodes,
  radius = 1.4,
  nodeRadius = 0.3,
  active,
}) => {
  const frame = useCurrentFrame();
  const n = nodes.length;
  // Arcs stop a little short of the node discs.
  const gap = (nodeRadius + 0.1) / (Math.PI * 2 * radius);
  return (
    <>
      {nodes.map((node, i) => {
        // Each arc draws as the next node arrives; the closing arc right after the last one.
        const at = i === n - 1 ? node.at + 6 : nodes[i + 1].at;
        const p = interpolate(frame, [at, at + durations.draw], [0, 1], {
          ...clamp,
          easing: ease.out,
        });
        const pts = arcPoints(i, n, radius, gap, p);
        return pts.length > 1 ? (
          <Line key={`arc-${node.at}`} points={pts} {...line("soft")} />
        ) : null;
      })}
      {nodes.map((node, i) => {
        const t = interpolate(frame, [node.at, node.at + durations.enter], [0, 1], {
          ...clamp,
          easing: ease.out,
        });
        if (t <= 0) return null;
        const role: LineRole = i === active ? "stroke" : "faint";
        return (
          // Discs paint over anything on the ring (no depth test), so travelling dots
          // slip under each step instead of crossing its icon.
          <Billboard key={`node-${node.at}`} position={ringNode(i, n, radius)}>
            <group scale={0.8 + 0.2 * t}>
              <mesh renderOrder={1}>
                <circleGeometry args={[nodeRadius, 48]} />
                <meshBasicMaterial color={FILL} transparent opacity={t} depthTest={false} />
              </mesh>
              <Line
                points={circle(nodeRadius)}
                color={lineColor(role)}
                lineWidth={i === active ? 4 : 2.5}
                transparent
                opacity={t}
                renderOrder={2}
                depthTest={false}
              />
            </group>
          </Billboard>
        );
      })}
    </>
  );
};

type RingTravelProps = {
  // Turn the trip starts at (node i = i / n) and how many turns it covers.
  from: number;
  turns?: number;
  at: number;
  frames: number;
  // Loop forever from `at` (linear), instead of one eased trip.
  repeat?: boolean;
  until?: number;
  radius?: number;
  size?: number;
  role?: LineRole;
  opacity?: number;
};

// Ring position of a RingTravel dot at `frame` (null when hidden).
export const ringTravelPoint = (
  frame: number,
  { from, turns = 1, at, frames, repeat = false, until, radius = 1.4 }: RingTravelProps,
): Vec3 | null => {
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const p = repeat
    ? ((frame - at) / frames) % 1
    : interpolate(frame, [at, at + frames], [0, 1], { ...clamp, easing: ease.smooth });
  if (!repeat && p >= 1) return null;
  return ringPoint(from + p * turns, radius);
};

// A dot riding the ring with a short tail (signals, the agent's next pass).
export const RingTravel: React.FC<RingTravelProps> = (props) => {
  const frame = useCurrentFrame();
  const { size = 0.08, role = "stroke", opacity = 1 } = props;
  const head = ringTravelPoint(frame, props);
  if (!head) return null;
  const tail = [5, 4, 3, 2, 1]
    .map((k) => ringTravelPoint(frame - k, props))
    .filter((p): p is Vec3 => p !== null);
  return (
    <>
      {tail.length > 0 ? (
        <Line
          points={[...tail, head]}
          {...line(role)}
          transparent
          opacity={0.5 * opacity}
        />
      ) : null}
      <mesh position={head}>
        <sphereGeometry args={[size, 20, 20]} />
        <meshBasicMaterial color={lineColor(role)} transparent opacity={opacity} />
      </mesh>
    </>
  );
};
