import { Interactive, useCurrentFrame } from "remotion";
import { charts } from "../../../brand/charts";
import { colors } from "../../../brand/tokens";
import {
  type ChartBaseProps,
  ChartText,
  chartProgress,
  keyColor,
  valueOpacity,
} from "../common";
import { formatValue } from "../geometry";
import { type BarDatum, barLayout, type Orientation } from "./layout";

export type BarChartProps = ChartBaseProps & {
  data: BarDatum[];
  orientation?: Orientation;
  // Fixed value-axis maximum (default: the largest value).
  max?: number;
};

// Bars grow from the baseline one after another; values count up with them. The key bar
// turns amber at keyAt. SVG, for SceneCanvas / SlideCanvas.
export const BarChart: React.FC<BarChartProps> = ({
  data,
  box,
  orientation = "vertical",
  max,
  keyId,
  values = "key",
  format,
  unit,
  ...timing
}) => {
  const frame = useCurrentFrame();
  const { bars, baseline } = barLayout(data, box, orientation, max);
  const base = chartProgress(frame, timing);
  const vertical = orientation === "vertical";

  return (
    <Interactive.G name="Bar chart" style={{ opacity: base.exit }}>
      <line
        {...baseline}
        stroke={colors.diagram.faint}
        strokeWidth={charts.strokeSoft}
        strokeLinecap="round"
        opacity={base.enter}
      />
      {bars.map((b, i) => {
        const p = chartProgress(frame, timing, i + 1);
        const isKey = b.id === keyId;
        const w = vertical ? b.width : b.width * p.enter;
        const h = vertical ? b.height * p.enter : b.height;
        const y = vertical ? b.y + b.height - h : b.y;
        const valueX = vertical ? b.valueAt.x : b.x + w + 16;
        const valueY = vertical ? y - (b.y - b.valueAt.y) : b.valueAt.y;
        return (
          <g key={b.id}>
            {w > 0 && h > 0 ? (
              <rect
                x={b.x}
                y={y}
                width={w}
                height={h}
                rx={Math.min(charts.radius, w / 2, h / 2)}
                fill={keyColor(isKey, p.key, colors.diagram.fill)}
                stroke={keyColor(isKey, p.key, colors.diagram.soft)}
                strokeWidth={charts.stroke}
              />
            ) : null}
            {b.name ? (
              <ChartText
                x={b.nameAt.x}
                y={b.nameAt.y}
                text={b.name}
                anchor={vertical ? "middle" : "start"}
                color={colors.text.muted}
                opacity={p.enter}
              />
            ) : null}
            <ChartText
              x={valueX}
              y={valueY}
              text={formatValue(b.value * p.enter, format, unit)}
              anchor={vertical ? "middle" : "start"}
              color={keyColor(isKey, p.key, colors.text.secondary)}
              opacity={valueOpacity(values, isKey, p)}
            />
          </g>
        );
      })}
    </Interactive.G>
  );
};
