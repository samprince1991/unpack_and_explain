import { evolvePath } from "@remotion/paths";
import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import {
  type ChartBaseProps,
  ChartText,
  chartProgress,
  keyColor,
  valueOpacity,
} from "../common";
import { formatValue, LINE } from "../geometry";
import { type SankeyData, sankeyLayout } from "./layout";

const FLOW = durations.draw + 10;

export type SankeyProps = ChartBaseProps & { data: SankeyData };

// Nodes appear column by column; each flow band draws from source to target. keyId is a
// link id ("source->target"): that band turns amber and shows its value at its middle.
// values "all" adds node values under the names. SVG, for SceneCanvas / SlideCanvas.
export const Sankey: React.FC<SankeyProps> = ({
  data,
  box,
  keyId,
  values = "key",
  format,
  unit,
  ...timing
}) => {
  const frame = useCurrentFrame();
  const { nodes, links } = sankeyLayout(data, box);
  const at = timing.at ?? 0;
  const base = chartProgress(frame, timing);

  return (
    <Interactive.G name="Sankey" style={{ opacity: base.exit }}>
      {links.map((l, i) => {
        const start = at + l.column * FLOW + 8 + i * 3;
        const drawn = timing.still
          ? 1
          : interpolate(frame, [start, start + FLOW], [0, 1], {
              ...clamp,
              easing: ease.smooth,
            });
        const { strokeDasharray, strokeDashoffset } = evolvePath(drawn, l.d);
        const isKey = l.id === keyId;
        return (
          <path
            key={l.id}
            d={l.d}
            fill="none"
            stroke={keyColor(isKey, base.key, colors.diagram.faint)}
            strokeOpacity={0.55 + (isKey ? 0.4 * base.key : 0)}
            strokeWidth={Math.max(2, l.width)}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
        );
      })}
      {nodes.map((n) => {
        const p = chartProgress(frame, { ...timing, at: at + n.column * FLOW });
        return (
          <g key={n.id} style={{ opacity: p.enter }}>
            <rect
              x={n.x}
              y={n.y}
              width={n.width}
              height={Math.max(2, n.height)}
              rx={4}
              fill={colors.diagram.stroke}
            />
            {n.name ? (
              <ChartText
                x={n.labelAt.x}
                y={n.labelAt.y}
                text={n.name}
                anchor={n.anchor}
                color={colors.text.secondary}
              />
            ) : null}
            <ChartText
              x={n.labelAt.x}
              y={n.labelAt.y + (n.name ? LINE * 0.9 : 0)}
              text={formatValue(n.value, format, unit)}
              anchor={n.anchor}
              color={colors.text.muted}
              opacity={values === "all" ? p.enter : 0}
            />
          </g>
        );
      })}
      {links
        .filter((l) => l.id === keyId)
        .map((l) => (
          <ChartText
            key={l.id}
            x={l.mid.x}
            y={l.mid.y}
            text={formatValue(l.value, format, unit)}
            color={colors.bg.base}
            opacity={
              valueOpacity(values, true, base) * (l.width >= LINE ? 1 : 0)
            }
          />
        ))}
    </Interactive.G>
  );
};
