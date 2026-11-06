import { sum } from "d3-array";
import { arc, pie } from "d3-shape";
import { charts } from "../../../brand/charts";
import {
  type Box,
  ChartLimitError,
  checkCount,
  checkValues,
  type Point,
  uniqueIds,
} from "../geometry";

export type SliceDatum = { id: string; name?: string; value: number };
export type SliceShape = SliceDatum & {
  startAngle: number;
  endAngle: number;
  padAngle: number;
  // Unit vector from the center to the slice's middle (for the pull-out and labels).
  dir: Point;
  labelAt: Point;
};
export type PieLayout = {
  cx: number;
  cy: number;
  outer: number;
  inner: number;
  slices: SliceShape[];
};

const CHART = "PieChart";

// Slices in data order, clockwise from 12 o'clock. A plain pie leaves room around the
// circle for outside labels on small slices.
export const pieLayout = (
  data: SliceDatum[],
  box: Box,
  donut = false,
): PieLayout => {
  checkCount(CHART, "slices", data.length, charts.limits.slices);
  checkValues(
    CHART,
    data.map((d) => d.value),
  );
  uniqueIds(
    CHART,
    data.map((d) => d.id),
  );
  if (sum(data, (d) => d.value) === 0) {
    throw new ChartLimitError(`${CHART}: values add up to 0`);
  }
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const outer =
    Math.min(box.width, box.height) / 2 -
    (donut ? charts.pull : charts.labelSize * 1.3);
  const inner = donut ? outer * 0.6 : 0;
  const labelR = donut ? (outer + inner) / 2 : outer * 0.62;
  const arcs = pie<SliceDatum>()
    .value((d) => d.value)
    .sort(null)
    .padAngle(0.015)(data);
  const slices = arcs.map((a) => {
    const mid = (a.startAngle + a.endAngle) / 2;
    const dir = { x: Math.sin(mid), y: -Math.cos(mid) };
    return {
      ...a.data,
      startAngle: a.startAngle,
      endAngle: a.endAngle,
      padAngle: a.padAngle,
      dir,
      labelAt: { x: cx + dir.x * labelR, y: cy + dir.y * labelR },
    };
  });
  return { cx, cy, outer, inner, slices };
};

// Path of one slice around (0, 0), cut off at `endAngle` for the sweep-in.
export const slicePath = (
  layout: PieLayout,
  slice: SliceShape,
  endAngle = slice.endAngle,
): string =>
  arc()({
    innerRadius: layout.inner,
    outerRadius: layout.outer,
    startAngle: slice.startAngle,
    endAngle: Math.max(slice.startAngle, Math.min(endAngle, slice.endAngle)),
    padAngle: slice.padAngle,
  }) ?? "";
