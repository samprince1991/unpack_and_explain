import { colors } from "../../brand/tokens";

// Line art roles for 3D, matching the 2D diagram roles. Amber = the one key element.
export type LineRole = "stroke" | "soft" | "faint" | "amber";

// Screen pixels (drei Line / Edges). Plain WebGL lines are always 1 px.
export const LINE: Record<LineRole, number> = { stroke: 3, soft: 2, faint: 1.5, amber: 4 };

export const lineColor = (role: LineRole) =>
  role === "amber" ? colors.amber[500] : colors.diagram[role];

export const line = (role: LineRole) => ({ color: lineColor(role), lineWidth: LINE[role] });

// Solid object fill: hides the lines behind it, so shapes read as 3D.
export const FILL = colors.diagram.fill;
