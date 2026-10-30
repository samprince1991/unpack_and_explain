import type { LucideIcon } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { colors } from "../../brand/tokens";
import { LineIcon } from "../icons/LineIcon";
import { DrawPath } from "../motion/DrawPath";
import { enterProgress } from "../motion/progress";

type CycleNode = {
  icon: LucideIcon;
  // Local frame the node appears.
  at: number;
};

type CycleDiagramProps = {
  cx: number;
  cy: number;
  r: number;
  nodes: CycleNode[];
  // Node drawn brighter (the current step). The moving dot, not the node, is amber.
  active?: number;
  nodeRadius?: number;
};

// First node at the top, then clockwise.
const angleOf = (i: number, n: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;

export const cyclePoint = (cx: number, cy: number, r: number, i: number, n: number) => ({
  x: cx + r * Math.cos(angleOf(i, n)),
  y: cy + r * Math.sin(angleOf(i, n)),
});

// Arc from node i to node i+1 along the ring, stopping short of both node circles.
export const cycleArc = (cx: number, cy: number, r: number, i: number, n: number, nodeR = 74) => {
  const gap = (nodeR + 18) / r;
  const a0 = angleOf(i, n) + gap;
  const a1 = angleOf(i + 1, n) - gap;
  const p = (a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
};

// One full clockwise trip around the ring starting at node `from`, for Travel.
export const cycleLoop = (cx: number, cy: number, r: number, from: number, n: number) => {
  const a = angleOf(from, n);
  const p = (k: number) => `${cx + r * Math.cos(k)} ${cy + r * Math.sin(k)}`;
  return `M ${p(a)} A ${r} ${r} 0 0 1 ${p(a + Math.PI)} A ${r} ${r} 0 0 1 ${p(a + Math.PI * 2 - 0.001)}`;
};

// Cycle style: steps on a ring, joined by arcs that draw in as each next step appears.
// For loops: agent loops, water cycle, engine strokes, feedback.
export const CycleDiagram: React.FC<CycleDiagramProps> = ({
  cx,
  cy,
  r,
  nodes,
  active,
  nodeRadius = 74,
}) => {
  const frame = useCurrentFrame();
  const n = nodes.length;
  return (
    <g>
      {nodes.map((node, i) => {
        // Each arc draws as the next node arrives; the closing arc right after the last one.
        const at = i === n - 1 ? node.at + 6 : nodes[i + 1].at;
        return (
          <DrawPath
            key={`arc-${i}`}
            d={cycleArc(cx, cy, r, i, n, nodeRadius)}
            at={at}
            color={colors.diagram.soft}
          />
        );
      })}
      {nodes.map((node, i) => {
        const t = enterProgress(frame, node.at);
        if (t <= 0) {
          return null;
        }
        const p = cyclePoint(cx, cy, r, i, n);
        return (
          <g
            key={`node-${i}`}
            opacity={t}
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              scale: String(0.8 + 0.2 * t),
            }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={nodeRadius}
              fill={colors.diagram.fill}
              stroke={i === active ? colors.diagram.stroke : colors.diagram.faint}
              strokeWidth={i === active ? 5 : 3}
            />
            <LineIcon icon={node.icon} x={p.x} y={p.y} size={nodeRadius * 0.9} />
          </g>
        );
      })}
    </g>
  );
};
