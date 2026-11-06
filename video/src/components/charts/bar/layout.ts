import { max } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
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

export type BarDatum = { id: string; name?: string; value: number };
export type Orientation = "vertical" | "horizontal";
export type BarShape = BarDatum & {
  x: number;
  y: number;
  width: number;
  height: number;
  valueAt: Point;
  nameAt: Point;
};
export type BarLayout = {
  bars: BarShape[];
  baseline: { x1: number; y1: number; x2: number; y2: number };
};

const CHART = "BarChart";

// Vertical: names under the bars, values above. Horizontal: name above each bar, value
// after its end. `top` fixes the value axis maximum (default: the largest value).
export const barLayout = (
  data: BarDatum[],
  box: Box,
  orientation: Orientation = "vertical",
  top?: number,
): BarLayout => {
  checkCount(CHART, "bars", data.length, charts.limits.bars);
  checkValues(
    CHART,
    data.map((d) => d.value),
  );
  uniqueIds(
    CHART,
    data.map((d) => d.id),
  );
  const ids = data.map((d) => d.id);
  const domainMax = top ?? max(data, (d) => d.value) ?? 0;
  const hasNames = data.some((d) => d.name);

  if (orientation === "vertical") {
    const baseY = box.y + box.height - (hasNames ? LINE : 0);
    const band = scaleBand(ids, [box.x, box.x + box.width]).padding(
      charts.barGap,
    );
    const y = scaleLinear([0, domainMax || 1], [baseY, box.y + LINE]);
    const bars = data.map((d) => {
      const x = band(d.id) ?? box.x;
      const cx = x + band.bandwidth() / 2;
      if (d.name) {
        checkFits(CHART, d.name, band.step());
      }
      return {
        ...d,
        x,
        y: y(d.value),
        width: band.bandwidth(),
        height: baseY - y(d.value),
        valueAt: { x: cx, y: y(d.value) - LINE / 2 },
        nameAt: { x: cx, y: baseY + LINE / 2 },
      };
    });
    return {
      bars,
      baseline: { x1: box.x, y1: baseY, x2: box.x + box.width, y2: baseY },
    };
  }

  const valueRoom = charts.labelSize * 3.5;
  const band = scaleBand(ids, [box.y, box.y + box.height]).paddingInner(0.15);
  const x = scaleLinear(
    [0, domainMax || 1],
    [box.x, box.x + box.width - valueRoom],
  );
  // Tighter than LINE so horizontal bars still fit a carousel visual region.
  const nameLine = hasNames ? charts.labelSize * 1.15 : 0;
  const thick = Math.min(band.bandwidth() - nameLine, charts.barMax);
  if (thick < charts.labelSize * 0.5) {
    throw new ChartLimitError(
      `${CHART}: bars too thin; use fewer bars or a taller box`,
    );
  }
  const bars = data.map((d) => {
    const slot = band(d.id) ?? box.y;
    const by = slot + nameLine;
    if (d.name) {
      checkFits(CHART, d.name, box.width);
    }
    return {
      ...d,
      x: box.x,
      y: by,
      width: x(d.value) - box.x,
      height: thick,
      valueAt: { x: x(d.value) + 16, y: by + thick / 2 },
      nameAt: { x: box.x, y: slot + nameLine / 2 },
    };
  });
  return {
    bars,
    baseline: { x1: box.x, y1: box.y, x2: box.x, y2: box.y + box.height },
  };
};
