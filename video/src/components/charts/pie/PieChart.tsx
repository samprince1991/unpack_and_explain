import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { charts } from "../../../brand/charts";
import { clamp, durations, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import {
  type ChartBaseProps,
  ChartText,
  chartProgress,
  keyColor,
  textOn,
  valueOpacity,
} from "../common";
import { formatValue, LINE, textWidth } from "../geometry";
import { pieLayout, type SliceDatum, slicePath } from "./layout";

const SWEEP = durations.draw * 2;
// Clearance (px) a value label needs along its slice's arc to sit inside it.
const LABEL_GAP = 40;

export type PieChartProps = ChartBaseProps & {
  data: SliceDatum[];
  donut?: boolean;
};

// Slices sweep in clockwise; the key slice pulls out and turns amber at keyAt.
// Pie: values inside the slices. Donut: the key value (big) and name in the hole.
// SVG, for SceneCanvas / SlideCanvas.
export const PieChart: React.FC<PieChartProps> = ({
  data,
  box,
  donut = false,
  keyId,
  values = "key",
  format,
  unit,
  ...timing
}) => {
  const frame = useCurrentFrame();
  const layout = pieLayout(data, box, donut);
  const at = timing.at ?? 0;
  const p = chartProgress(frame, timing);
  const labels = chartProgress(frame, { ...timing, at: at + SWEEP });
  const sweep = timing.still
    ? 1
    : interpolate(frame, [at, at + SWEEP], [0, 1], {
        ...clamp,
        easing: ease.smooth,
      });
  const end = sweep * Math.PI * 2;
  const key = layout.slices.find((s) => s.id === keyId);

  return (
    <Interactive.G name="Pie chart" style={{ opacity: p.exit }}>
      {layout.slices.map((s) => {
        if (end <= s.startAngle) {
          return null;
        }
        const isKey = s.id === keyId;
        const pull = isKey ? charts.pull * p.key : 0;
        const text = formatValue(s.value, format, unit);
        // Inside label only when it fits along the slice's arc at the label radius.
        const arcRoom =
          (s.endAngle - s.startAngle) *
          Math.hypot(s.labelAt.x - layout.cx, s.labelAt.y - layout.cy);
        const big = arcRoom >= textWidth(text) + LABEL_GAP;
        const labelR = layout.outer + charts.labelSize;
        const lx = big ? s.labelAt.x : layout.cx + s.dir.x * labelR;
        const ly = big ? s.labelAt.y : layout.cy + s.dir.y * labelR;
        return (
          <g key={s.id}>
            <path
              d={slicePath(layout, s, end)}
              fill={keyColor(isKey, p.key, colors.diagram.fill)}
              stroke={keyColor(isKey, p.key, colors.diagram.soft)}
              strokeWidth={charts.stroke}
              strokeLinejoin="round"
              style={{
                translate: `${layout.cx + s.dir.x * pull}px ${layout.cy + s.dir.y * pull}px`,
              }}
            />
            {donut ? null : (
              <ChartText
                x={lx + s.dir.x * pull}
                y={ly + s.dir.y * pull}
                text={text}
                color={big ? textOn(isKey, labels.key) : colors.text.secondary}
                opacity={big || isKey ? valueOpacity(values, isKey, labels) : 0}
              />
            )}
          </g>
        );
      })}
      {donut && key ? (
        <>
          <ChartText
            x={layout.cx}
            y={layout.cy - (key.name ? LINE * 0.4 : 0)}
            text={formatValue(key.value, format, unit)}
            heading
            size={typeScale.title}
            color={keyColor(true, labels.key, colors.text.primary)}
            opacity={valueOpacity(values, true, labels)}
          />
          {key.name ? (
            <ChartText
              x={layout.cx}
              y={layout.cy + LINE * 0.6}
              text={key.name}
              color={colors.text.muted}
              opacity={valueOpacity(values, true, labels)}
            />
          ) : null}
        </>
      ) : null}
    </Interactive.G>
  );
};
