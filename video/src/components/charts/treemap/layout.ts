import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { charts } from "../../../brand/charts";
import {
  type Box,
  ChartLimitError,
  checkCount,
  checkValues,
  uniqueIds,
} from "../geometry";

// Shared by Treemap and TreeDiagram. Leaves carry `value` (treemap block size).
export type TreeDatum = {
  id: string;
  name?: string;
  value?: number;
  children?: TreeDatum[];
};

export type BlockShape = {
  id: string;
  name?: string;
  value: number;
  depth: number;
  leaf: boolean;
  // Entrance order: parents first, then their children.
  order: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

const CHART = "Treemap";

// Squarified treemap, biggest first. At most 2 levels below the root (groups + items).
export const treemapLayout = (root: TreeDatum, box: Box): BlockShape[] => {
  const h = hierarchy(root).sum((d) =>
    d.children?.length ? 0 : (d.value ?? 0),
  );
  const leaves = h.leaves();
  checkCount(CHART, "leaves", leaves.length, charts.limits.leaves);
  checkValues(
    CHART,
    leaves.map((l) => l.data.value ?? 0),
  );
  uniqueIds(
    CHART,
    h.descendants().map((d) => d.data.id),
  );
  if (h.height > 2) {
    throw new ChartLimitError(
      `${CHART}: ${h.height} levels below the root, max 2`,
    );
  }
  if (!h.value) {
    throw new ChartLimitError(`${CHART}: values add up to 0`);
  }
  h.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const laid = treemap<TreeDatum>()
    .tile(treemapSquarify)
    .size([box.width, box.height])
    .paddingInner(10)
    .paddingOuter(6)
    .round(true)(h);
  return laid
    .descendants()
    .filter((d) => d.depth > 0)
    .map((d, order) => ({
      id: d.data.id,
      name: d.data.name,
      value: d.value ?? 0,
      depth: d.depth,
      leaf: !d.children,
      order,
      x: box.x + d.x0,
      y: box.y + d.y0,
      width: d.x1 - d.x0,
      height: d.y1 - d.y0,
    }));
};
