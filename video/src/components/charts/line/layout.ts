import { max, min } from "d3-array";
import { scaleLinear, scalePoint } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
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

export type LineDatum = { id: string; name?: string; value: number };
export type LinePointShape = LineDatum & {
  x: number;
  y: number;
  valueAt: Point;
  nameAt: Point;
};
export type LineLayout = {
  d: string;
  points: LinePointShape[];
  baseline: { x1: number; y1: number; x2: number; y2: number };
};

const CHART = "LineChart";

// Names along the bottom, values above the points. `range` fixes the value axis
// (default: 0 or the lowest value, up to the highest).
export const lineLayout = (
  data: LineDatum[],
  box: Box,
  range?: [number, number],
): LineLayout => {
  checkCount(CHART, "points", data.length, charts.limits.points);
  if (data.length < 2) {
    throw new ChartLimitError(`${CHART}: needs at least 2 points`);
  }
  const values = data.map((d) => d.value);
  checkValues(CHART, values, true);
  uniqueIds(
    CHART,
    data.map((d) => d.id),
  );

  const hasNames = data.some((d) => d.name);
  const baseY = box.y + box.height - (hasNames ? LINE : 0);
  const x = scalePoint(
    data.map((d) => d.id),
    [box.x, box.x + box.width],
  ).padding(0.5);
  const lo = range?.[0] ?? Math.min(0, min(values) ?? 0);
  const hi = range?.[1] ?? max(values) ?? 1;
  const y = scaleLinear(
    [lo, hi === lo ? lo + 1 : hi],
    [baseY - charts.labelSize * 0.5, box.y + LINE],
  );

  const points = data.map((d) => {
    const px = x(d.id) ?? box.x;
    const py = y(d.value);
    if (d.name) {
      checkFits(CHART, d.name, x.step());
    }
    return {
      ...d,
      x: px,
      y: py,
      valueAt: { x: px, y: py - LINE * 0.6 },
      nameAt: { x: px, y: baseY + LINE / 2 },
    };
  });
  const d =
    line<LinePointShape>()
      .x((p) => p.x)
      .y((p) => p.y)
      .curve(curveMonotoneX)(points) ?? "";
  return {
    d,
    points,
    baseline: { x1: box.x, y1: baseY, x2: box.x + box.width, y2: baseY },
  };
};
