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
import { formatValue, LINE, textWidth } from "../geometry";
import { type TreeDatum, treemapLayout } from "./layout";

const PAD = 20;

export type TreemapProps = ChartBaseProps & { data: TreeDatum };

// Blocks settle in, groups before their items; the key block turns amber at keyAt.
// Labels only where they fit (name, then value). SVG, for SceneCanvas / SlideCanvas.
export const Treemap: React.FC<TreemapProps> = ({
  data,
  box,
  keyId,
  values = "key",
  format,
  unit,
  ...timing
}) => {
  const frame = useCurrentFrame();
  const blocks = treemapLayout(data, box);
  const base = chartProgress(frame, timing);

  return (
    <Interactive.G name="Treemap" style={{ opacity: base.exit }}>
      {blocks.map((b) => {
        const p = chartProgress(frame, timing, b.order);
        const isKey = b.id === keyId;
        const room = b.width - PAD * 2;
        const nameFits =
          Boolean(b.name) &&
          textWidth(b.name ?? "") <= room &&
          b.height >= LINE * 1.2;
        const valueText = formatValue(b.value, format, unit);
        const valueFits =
          textWidth(valueText) <= room &&
          b.height >= (nameFits ? LINE * 2.2 : LINE * 1.2);
        const nameY = b.y + LINE * 0.7;
        return (
          <g
            key={b.id}
            style={{
              opacity: p.enter,
              scale: String(0.92 + 0.08 * p.enter),
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          >
            <rect
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              rx={charts.radius}
              fill={
                b.leaf ? keyColor(isKey, p.key, colors.diagram.fill) : "none"
              }
              stroke={
                b.leaf
                  ? keyColor(isKey, p.key, colors.diagram.soft)
                  : colors.diagram.faint
              }
              strokeWidth={b.leaf ? charts.stroke : charts.strokeSoft}
            />
            {b.leaf && b.name && nameFits ? (
              <ChartText
                x={b.x + PAD}
                y={nameY}
                text={b.name}
                anchor="start"
                color={
                  isKey && p.key > 0.5 ? colors.bg.base : colors.text.muted
                }
              />
            ) : null}
            {b.leaf && valueFits ? (
              <ChartText
                x={b.x + PAD}
                y={nameFits ? nameY + LINE : nameY}
                text={valueText}
                anchor="start"
                color={textOn(isKey, p.key)}
                opacity={valueOpacity(values, isKey, p)}
              />
            ) : null}
          </g>
        );
      })}
    </Interactive.G>
  );
};
