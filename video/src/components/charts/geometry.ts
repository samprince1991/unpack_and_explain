import { charts } from "../../brand/charts";

// Pure chart geometry helpers: no React, no frame. Layouts import only this file and D3.
export type Box = { x: number; y: number; width: number; height: number };
export type Point = { x: number; y: number };

// One label line including spacing.
export const LINE = charts.labelSize * 1.4;

// Thrown when data can't be drawn readably. Fails loudly in Studio instead of shipping.
export class ChartLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChartLimitError";
  }
}

export const checkCount = (
  chart: string,
  what: string,
  count: number,
  max: number,
): void => {
  if (count === 0) {
    throw new ChartLimitError(`${chart}: no ${what}`);
  }
  if (count > max) {
    throw new ChartLimitError(
      `${chart}: ${count} ${what}, max ${max}. Group the smallest into "Other".`,
    );
  }
};

export const checkValues = (
  chart: string,
  values: number[],
  allowNegative = false,
): void => {
  const bad = values.find(
    (v) => !Number.isFinite(v) || (!allowNegative && v < 0),
  );
  if (bad !== undefined) {
    throw new ChartLimitError(
      `${chart}: values must be finite${allowNegative ? "" : " and >= 0"}, got ${bad}`,
    );
  }
};

export const uniqueIds = (chart: string, ids: string[]): void => {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new ChartLimitError(`${chart}: duplicate id "${id}"`);
    }
    seen.add(id);
  }
};

// Rough rendered width of a label in px.
export const textWidth = (
  text: string,
  size: number = charts.labelSize,
): number => text.length * size * charts.charWidth;

export const checkFits = (chart: string, text: string, room: number): void => {
  const width = textWidth(text);
  if (width > room) {
    throw new ChartLimitError(
      `${chart}: "${text}" is ~${Math.round(width)} px wide, room for ${Math.round(room)} px. Shorten it.`,
    );
  }
};

export const formatValue = (
  value: number,
  format?: (v: number) => string,
  unit?: string,
): string => {
  const text = format
    ? format(value)
    : Math.round(value).toLocaleString("en-US");
  if (!unit) {
    return text;
  }
  return unit === "%" ? `${text}%` : `${text} ${unit}`;
};
