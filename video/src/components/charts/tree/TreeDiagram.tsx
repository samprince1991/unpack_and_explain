import { evolvePath } from "@remotion/paths";
import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { charts } from "../../../brand/charts";
import { clamp, durations, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import {
  type ChartTiming,
  ChartText,
  chartProgress,
  keyColor,
} from "../common";
import { type Box, LINE } from "../geometry";
import type { TreeDatum } from "../treemap/layout";
import { NODE_R, pathIds, treeDiagramLayout } from "./layout";

const LEVEL = durations.draw;

export type TreeDiagramProps = ChartTiming & {
  data: TreeDatum;
  box: Box;
  keyId?: string;
};

// Grows level by level: nodes pop in, branches draw down to the next level. At keyAt the
// key node and the path from the root to it turn amber. SVG, for SceneCanvas / SlideCanvas.
export const TreeDiagram: React.FC<TreeDiagramProps> = ({
  data,
  box,
  keyId,
  ...timing
}) => {
  const frame = useCurrentFrame();
  const { nodes, links } = treeDiagramLayout(data, box);
  const onPath = pathIds(nodes, keyId);
  const at = timing.at ?? 0;
  const base = chartProgress(frame, timing);

  return (
    <Interactive.G name="Tree diagram" style={{ opacity: base.exit }}>
      {links.map((l) => {
        const start = at + (l.depth - 1) * LEVEL + 4;
        const drawn = timing.still
          ? 1
          : interpolate(frame, [start, start + LEVEL], [0, 1], {
              ...clamp,
              easing: ease.smooth,
            });
        const { strokeDasharray, strokeDashoffset } = evolvePath(drawn, l.d);
        return (
          <path
            key={l.id}
            d={l.d}
            fill="none"
            stroke={keyColor(onPath.has(l.id), base.key, colors.diagram.soft)}
            strokeWidth={charts.stroke}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
        );
      })}
      {nodes.map((n) => {
        const p = chartProgress(frame, { ...timing, at: at + n.depth * LEVEL });
        const isKey = n.id === keyId;
        return (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={NODE_R * p.enter}
              fill={keyColor(isKey, p.key, colors.diagram.fill)}
              stroke={keyColor(onPath.has(n.id), p.key, colors.diagram.stroke)}
              strokeWidth={charts.stroke}
            />
            {n.name ? (
              <ChartText
                x={n.x}
                y={n.y + NODE_R + LINE / 2}
                text={n.name}
                color={colors.text.secondary}
                opacity={p.enter}
              />
            ) : null}
          </g>
        );
      })}
    </Interactive.G>
  );
};
