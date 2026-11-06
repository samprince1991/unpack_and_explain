import { evolvePath } from "@remotion/paths";
import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { charts } from "../../../brand/charts";
import { clamp, durations, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import {
  type ChartBaseProps,
  ChartText,
  chartProgress,
  keyColor,
  valueOpacity,
} from "../common";
import { formatValue } from "../geometry";
import { type LineDatum, lineLayout } from "./layout";

const DRAW = durations.draw * 2;
const DOT = 12;

export type LineChartProps = ChartBaseProps & {
  data: LineDatum[];
  range?: [number, number];
};

// The line draws in like a pen stroke; each point appears as the line reaches it.
// The key point grows and turns amber at keyAt. SVG, for SceneCanvas / SlideCanvas.
export const LineChart: React.FC<LineChartProps> = ({
  data,
  box,
  range,
  keyId,
  values = "key",
  format,
  unit,
  ...timing
}) => {
  const frame = useCurrentFrame();
  const { d, points, baseline } = lineLayout(data, box, range);
  const at = timing.at ?? 0;
  const base = chartProgress(frame, timing);
  const draw = timing.still
    ? 1
    : interpolate(frame, [at, at + DRAW], [0, 1], {
        ...clamp,
        easing: ease.smooth,
      });
  const { strokeDasharray, strokeDashoffset } = evolvePath(draw, d);

  return (
    <Interactive.G name="Line chart" style={{ opacity: base.exit }}>
      <line
        {...baseline}
        stroke={colors.diagram.faint}
        strokeWidth={charts.strokeSoft}
        strokeLinecap="round"
        opacity={base.enter}
      />
      <path
        d={d}
        fill="none"
        stroke={colors.diagram.stroke}
        strokeWidth={charts.stroke + 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />
      {points.map((pt, i) => {
        const p = chartProgress(frame, {
          ...timing,
          at: at + (DRAW * i) / (points.length - 1),
        });
        const isKey = pt.id === keyId;
        const r = DOT + (isKey ? 6 * p.key : 0);
        return (
          <g key={pt.id}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={r * p.enter}
              fill={keyColor(isKey, p.key, colors.bg.base)}
              stroke={keyColor(isKey, p.key, colors.diagram.stroke)}
              strokeWidth={charts.stroke}
            />
            {pt.name ? (
              <ChartText
                x={pt.nameAt.x}
                y={pt.nameAt.y}
                text={pt.name}
                color={colors.text.muted}
                opacity={p.enter}
              />
            ) : null}
            <ChartText
              x={pt.valueAt.x}
              y={pt.valueAt.y}
              text={formatValue(pt.value, format, unit)}
              color={keyColor(isKey, p.key, colors.text.secondary)}
              opacity={valueOpacity(values, isKey, p)}
            />
          </g>
        );
      })}
    </Interactive.G>
  );
};
