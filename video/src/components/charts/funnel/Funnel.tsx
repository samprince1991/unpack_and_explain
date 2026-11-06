import { Interactive, useCurrentFrame } from "remotion";
import { charts } from "../../../brand/charts";
import { colors } from "../../../brand/tokens";
import {
  type ChartBaseProps,
  ChartText,
  chartProgress,
  keyColor,
  textOn,
  valueOpacity,
} from "../common";
import { formatValue } from "../geometry";
import { type FunnelDatum, funnelLayout } from "./layout";

export type FunnelProps = ChartBaseProps & { data: FunnelDatum[] };

// Stages drop in top to bottom; the key stage turns amber at keyAt.
// SVG, for SceneCanvas / SlideCanvas.
export const Funnel: React.FC<FunnelProps> = ({
  data,
  box,
  keyId,
  values = "key",
  format,
  unit,
  ...timing
}) => {
  const frame = useCurrentFrame();
  const stages = funnelLayout(data, box);
  const base = chartProgress(frame, timing);

  return (
    <Interactive.G name="Funnel" style={{ opacity: base.exit }}>
      {stages.map((s, i) => {
        const p = chartProgress(frame, timing, i);
        const isKey = s.id === keyId;
        return (
          <g
            key={s.id}
            style={{
              opacity: p.enter,
              translate: `0px ${(1 - p.enter) * -30}px`,
            }}
          >
            <polygon
              points={s.points}
              fill={keyColor(isKey, p.key, colors.diagram.fill)}
              stroke={keyColor(isKey, p.key, colors.diagram.soft)}
              strokeWidth={charts.stroke}
              strokeLinejoin="round"
            />
            {s.name ? (
              <ChartText
                x={s.nameAt.x}
                y={s.nameAt.y}
                text={s.name}
                color={
                  isKey && p.key > 0.5 ? colors.bg.base : colors.text.muted
                }
              />
            ) : null}
            <ChartText
              x={s.valueAt.x}
              y={s.valueAt.y}
              text={formatValue(s.value, format, unit)}
              color={textOn(isKey, p.key)}
              opacity={valueOpacity(values, isKey, p)}
            />
          </g>
        );
      })}
    </Interactive.G>
  );
};
