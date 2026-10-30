import { Billboard, Line } from "@react-three/drei";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../../brand/motion";
import { FILL, line, lineColor } from "./materials";
import { nodePos, packetAt, type Node3D } from "./network";
import type { Vec3 } from "./stage";
import { WireObject } from "./WireObject";

type NetworkGraph3DProps = {
  nodes: Node3D[];
  edges: [string, string][];
  // Edges draw in one after another from drawAt.
  drawAt?: number;
  // Amber packet route (node ids) and its timing.
  route?: string[];
  travelAt?: number;
  travelFrames?: number;
};

const DOT = 0.12;
const BOX = 0.3;

// How far a link stops short of a node's center, so it meets the outline.
const radius = (n: Node3D) => (n.shape === "box" ? BOX / 2 : DOT);

const circle = (r: number, n = 48): Vec3[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r, 0];
  });

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const onRoute = (route: string[], [a, b]: [string, string]) =>
  route.some(
    (id, i) => i > 0 && ((route[i - 1] === a && id === b) || (route[i - 1] === b && id === a)),
  );

// Nodes and links in space; one amber packet travels the route, the destination pings.
export const NetworkGraph3D: React.FC<NetworkGraph3DProps> = ({
  nodes,
  edges,
  drawAt = 0,
  route = [],
  travelAt = 60,
  travelFrames = 60,
}) => {
  const frame = useCurrentFrame();
  const travelling = route.length > 1;
  const arrived = travelAt + travelFrames;
  const moving = travelling && frame >= travelAt && frame < arrived;
  const packet = moving ? packetAt(frame, route, nodes, travelAt, travelFrames) : null;
  // Tail: where the packet was a few frames ago.
  const tail = moving ? packetAt(frame - 5, route, nodes, travelAt, travelFrames) : null;
  const ping = interpolate(frame, [arrived, arrived + 20], [0, 1], {
    ...clamp,
    easing: ease.out,
  });

  return (
    <>
      {edges.map(([a, b], i) => {
        const start = drawAt + i * durations.stagger;
        const p = interpolate(frame, [start, start + durations.draw], [0, 1], {
          ...clamp,
          easing: ease.out,
        });
        if (p === 0) return null;
        const na = nodes.find((n) => n.id === a);
        const nb = nodes.find((n) => n.id === b);
        if (!na || !nb) throw new Error(`Unknown network edge ${a}-${b}`);
        const length = Math.hypot(...na.pos.map((v, k) => nb.pos[k] - v));
        const from = lerp3(na.pos, nb.pos, radius(na) / length);
        const to = lerp3(na.pos, nb.pos, 1 - radius(nb) / length);
        const lit = travelling && frame >= travelAt && onRoute(route, [a, b]);
        return (
          <Line
            key={`${a}-${b}`}
            points={[from, lerp3(from, to, p)]}
            {...line(lit ? "soft" : "faint")}
          />
        );
      })}
      {nodes.map((n, i) =>
        n.shape === "box" ? (
          <WireObject
            key={n.id}
            shape="box"
            size={[BOX, BOX, BOX]}
            position={n.pos}
            drawAt={drawAt + i * durations.stagger}
          />
        ) : (
          // Dots paint over the links that end at their center (no depth test), so the
          // lines stop at the ring instead of showing through the dot.
          <Billboard key={n.id} position={n.pos}>
            <mesh renderOrder={1}>
              <circleGeometry args={[DOT, 32]} />
              <meshBasicMaterial color={FILL} depthTest={false} />
            </mesh>
            <Line
              points={circle(DOT)}
              {...line("stroke")}
              renderOrder={2}
              depthTest={false}
            />
          </Billboard>
        ),
      )}
      {packet && tail ? (
        <>
          <Line points={[tail.pos, packet.pos]} {...line("amber")} transparent opacity={0.6} />
          <mesh position={packet.pos}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshBasicMaterial color={lineColor("amber")} />
          </mesh>
        </>
      ) : null}
      {travelling && ping > 0 && ping < 1 ? (
        <Billboard position={nodePos(nodes, route[route.length - 1])}>
          <Line
            points={circle(DOT * (1 + 2.5 * ping))}
            {...line("amber")}
            transparent
            opacity={1 - ping}
          />
        </Billboard>
      ) : null}
    </>
  );
};
