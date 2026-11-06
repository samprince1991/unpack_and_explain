import { sankey, sankeyLinkHorizontal, type SankeyNode } from "d3-sankey";
import { charts } from "../../../brand/charts";
import {
  type Box,
  ChartLimitError,
  checkCount,
  checkFits,
  checkValues,
  type Point,
  uniqueIds,
} from "../geometry";

export type SankeyData = {
  nodes: { id: string; name?: string }[];
  links: { source: string; target: string; value: number }[];
};
export type SankeyNodeShape = {
  id: string;
  name?: string;
  value: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
  labelAt: Point;
  anchor: "start" | "end";
};
export type SankeyLinkShape = {
  // `${source}->${target}`: use as keyId.
  id: string;
  value: number;
  column: number;
  d: string;
  width: number;
  mid: Point;
};

type N = { id: string; name?: string };
type L = Record<string, unknown>;

const CHART = "Sankey";
const NODE_W = 24;

// Flows left to right in 2-3 columns. Labels sit right of each node, except the last
// column (left of its nodes), and must fit in the gap between columns.
export const sankeyLayout = (
  data: SankeyData,
  box: Box,
): { nodes: SankeyNodeShape[]; links: SankeyLinkShape[] } => {
  uniqueIds(
    CHART,
    data.nodes.map((n) => n.id),
  );
  checkCount(CHART, "links", data.links.length, Number.POSITIVE_INFINITY);
  checkValues(
    CHART,
    data.links.map((l) => l.value),
  );
  const known = new Set(data.nodes.map((n) => n.id));
  for (const l of data.links) {
    for (const end of [l.source, l.target]) {
      if (!known.has(end)) {
        throw new ChartLimitError(`${CHART}: link uses unknown node "${end}"`);
      }
    }
  }

  const graph = sankey<N, L>()
    .nodeId((d) => d.id)
    .nodeWidth(NODE_W)
    .nodePadding(charts.labelSize * 1.6)
    .extent([
      [box.x, box.y],
      [box.x + box.width, box.y + box.height],
    ])({
    nodes: data.nodes.map((n) => ({ ...n })),
    links: data.links.map((l) => ({ ...l })),
  });

  const xs = [...new Set(graph.nodes.map((n) => n.x0 ?? 0))].sort(
    (a, b) => a - b,
  );
  if (xs.length < 2 || xs.length > charts.limits.sankeyColumns) {
    throw new ChartLimitError(
      `${CHART}: ${xs.length} columns, needs 2-${charts.limits.sankeyColumns}`,
    );
  }
  xs.forEach((x, column) => {
    const count = graph.nodes.filter((n) => n.x0 === x).length;
    checkCount(
      CHART,
      `nodes in column ${column + 1}`,
      count,
      charts.limits.sankeyColumn,
    );
  });
  const gap = (box.width - NODE_W * xs.length) / (xs.length - 1);
  const last = xs.length - 1;

  const nodes = graph.nodes.map((n) => {
    const column = xs.indexOf(n.x0 ?? 0);
    const x0 = n.x0 ?? 0;
    const x1 = n.x1 ?? 0;
    const y0 = n.y0 ?? 0;
    const y1 = n.y1 ?? 0;
    if (n.name) {
      checkFits(CHART, n.name, gap - 24);
    }
    return {
      id: n.id,
      name: n.name,
      value: n.value ?? 0,
      column,
      x: x0,
      y: y0,
      width: x1 - x0,
      height: y1 - y0,
      anchor: column === last ? ("end" as const) : ("start" as const),
      labelAt: { x: column === last ? x0 - 12 : x1 + 12, y: (y0 + y1) / 2 },
    };
  });

  const path = sankeyLinkHorizontal<N, L>();
  const links = graph.links.map((l) => {
    const s = l.source as SankeyNode<N, L>;
    const t = l.target as SankeyNode<N, L>;
    return {
      id: `${s.id}->${t.id}`,
      value: l.value,
      column: xs.indexOf(s.x0 ?? 0),
      d: path(l) ?? "",
      width: l.width ?? 0,
      // 40% along the band (not the middle), clear of the target's right-aligned label.
      mid: {
        x: (s.x1 ?? 0) + ((t.x0 ?? 0) - (s.x1 ?? 0)) * 0.4,
        y: (l.y0 ?? 0) + ((l.y1 ?? 0) - (l.y0 ?? 0)) * 0.4,
      },
    };
  });
  return { nodes, links };
};
