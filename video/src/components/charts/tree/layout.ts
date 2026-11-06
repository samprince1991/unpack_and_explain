import { hierarchy, tree } from "d3-hierarchy";
import { linkVertical } from "d3-shape";
import { charts } from "../../../brand/charts";
import {
  type Box,
  ChartLimitError,
  checkCount,
  checkFits,
  LINE,
  uniqueIds,
} from "../geometry";
import type { TreeDatum } from "../treemap/layout";

export const NODE_R = 22;

export type TreeNodeShape = {
  id: string;
  name?: string;
  depth: number;
  x: number;
  y: number;
  parentId?: string;
};
// One link per child node, keyed by the child's id.
export type TreeLinkShape = { id: string; depth: number; d: string };

const CHART = "TreeDiagram";

// Top-down tree; names under the nodes. Names must fit between their neighbours.
export const treeDiagramLayout = (
  root: TreeDatum,
  box: Box,
): { nodes: TreeNodeShape[]; links: TreeLinkShape[] } => {
  const h = hierarchy(root);
  uniqueIds(
    CHART,
    h.descendants().map((d) => d.data.id),
  );
  if (h.height + 1 > charts.limits.treeDepth) {
    throw new ChartLimitError(
      `${CHART}: ${h.height + 1} levels, max ${charts.limits.treeDepth}`,
    );
  }
  for (let depth = 0; depth <= h.height; depth++) {
    const count = h.descendants().filter((d) => d.depth === depth).length;
    checkCount(
      CHART,
      `nodes on level ${depth + 1}`,
      count,
      charts.limits.treeLevel,
    );
  }

  const inset = charts.labelSize;
  const laid = tree<TreeDatum>().size([
    box.width - inset * 2,
    box.height - NODE_R * 2 - LINE,
  ])(h);
  const nodes = laid.descendants().map((n) => ({
    id: n.data.id,
    name: n.data.name,
    depth: n.depth,
    x: box.x + inset + n.x,
    y: box.y + NODE_R + n.y,
    parentId: n.parent?.data.id,
  }));

  for (const n of nodes) {
    if (!n.name) {
      continue;
    }
    const level = nodes.filter((o) => o.depth === n.depth && o.id !== n.id);
    const gap = Math.min(box.width, ...level.map((o) => Math.abs(o.x - n.x)));
    const edge = 2 * Math.min(n.x - box.x, box.x + box.width - n.x);
    checkFits(CHART, n.name, Math.min(gap - 16, edge));
  }

  const link = linkVertical();
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const links = nodes
    .filter((n) => n.parentId !== undefined)
    .map((n) => {
      const parent = pos.get(n.parentId ?? "");
      const px = parent?.x ?? n.x;
      // Branches leave from under the parent's name, so they never cross it.
      const py = (parent?.y ?? n.y) + NODE_R + (parent?.name ? LINE : 0);
      return {
        id: n.id,
        depth: n.depth,
        d: link({ source: [px, py], target: [n.x, n.y] }) ?? "",
      };
    });
  return { nodes, links };
};

// Ids from the key node up to the root (empty when there's no key).
export const pathIds = (
  nodes: TreeNodeShape[],
  keyId: string | undefined,
): Set<string> => {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ids = new Set<string>();
  let current = keyId === undefined ? undefined : byId.get(keyId);
  while (current) {
    ids.add(current.id);
    current =
      current.parentId === undefined ? undefined : byId.get(current.parentId);
  }
  return ids;
};
