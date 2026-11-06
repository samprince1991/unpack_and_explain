import { max } from "d3-array";
import { scaleLinear } from "d3-scale";
import { charts } from "../../../brand/charts";
import {
  type Box,
  ChartLimitError,
  checkCount,
  checkFits,
  checkValues,
  LINE,
  type Point,
  uniqueIds,
} from "../geometry";

export type FunnelDatum = { id: string; name?: string; value: number };
export type StageShape = FunnelDatum & {
  // SVG polygon points.
  points: string;
  top: number;
  bottom: number;
  topWidth: number;
  bottomWidth: number;
  nameAt: Point;
  valueAt: Point;
};

const CHART = "Funnel";
const GAP = 8;

// Trapezoid stages, width by value, centered on the box. Name over value inside each stage.
export const funnelLayout = (data: FunnelDatum[], box: Box): StageShape[] => {
  checkCount(CHART, "stages", data.length, charts.limits.stages);
  checkValues(
    CHART,
    data.map((d) => d.value),
  );
  uniqueIds(
    CHART,
    data.map((d) => d.id),
  );
  const top = max(data, (d) => d.value) ?? 0;
  if (top === 0) {
    throw new ChartLimitError(`${CHART}: all values are 0`);
  }
  const n = data.length;
  const h = (box.height - GAP * (n - 1)) / n;
  const named = data.some((d) => d.name);
  if (h < (named ? LINE * 1.8 : LINE)) {
    throw new ChartLimitError(
      `${CHART}: stages are ${Math.round(h)} px tall; needs a taller box or fewer stages`,
    );
  }
  const width = scaleLinear([0, top], [box.width * 0.18, box.width]);
  const cx = box.x + box.width / 2;

  return data.map((d, i) => {
    const y0 = box.y + i * (h + GAP);
    const y1 = y0 + h;
    const tw = width(d.value);
    const bw = Math.min(tw, i < n - 1 ? width(data[i + 1].value) : tw * 0.85);
    const mid = y0 + h / 2;
    if (d.name) {
      // Text sits at mid-height, where the stage is as wide as the average of its edges.
      checkFits(CHART, d.name, (tw + bw) / 2 - 24);
    }
    return {
      ...d,
      points: [
        [cx - tw / 2, y0],
        [cx + tw / 2, y0],
        [cx + bw / 2, y1],
        [cx - bw / 2, y1],
      ]
        .map((p) => p.join(","))
        .join(" "),
      top: y0,
      bottom: y1,
      topWidth: tw,
      bottomWidth: bw,
      nameAt: { x: cx, y: d.name ? mid - LINE * 0.45 : mid },
      valueAt: { x: cx, y: d.name ? mid + LINE * 0.45 : mid },
    };
  });
};
