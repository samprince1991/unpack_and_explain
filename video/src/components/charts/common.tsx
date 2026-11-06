import { interpolateColors } from "remotion";
import { charts } from "../../brand/charts";
import { fonts, weights } from "../../brand/fonts";
import { durations } from "../../brand/motion";
import { colors } from "../../brand/tokens";
import { enterProgress, exitProgress, stagger } from "../motion/progress";
import type { Box } from "./geometry";

export type ValueLabels = "none" | "key" | "all";

// Local frames. `still` = carousel: final pose, key already amber, no animation.
export type ChartTiming = {
  at?: number;
  keyAt?: number;
  exitAt?: number;
  still?: boolean;
};

export type ChartBaseProps = ChartTiming & {
  box: Box;
  // The one amber item. Omit for no amber.
  keyId?: string;
  // Which value labels show. "key" = only the key item's, appearing as it turns amber.
  values?: ValueLabels;
  format?: (v: number) => string;
  unit?: string;
};

export type Progress = { enter: number; key: number; exit: number };

// enter: item `index`'s staggered entrance; key: amber on at keyAt (on from the start when
// keyAt is unset); exit: fade from exitAt.
export const chartProgress = (
  frame: number,
  timing: ChartTiming,
  index = 0,
  frames: number = durations.enter,
): Progress => {
  if (timing.still) {
    return { enter: 1, key: 1, exit: 1 };
  }
  return {
    enter: enterProgress(
      frame,
      stagger(timing.at ?? 0, index, charts.stagger),
      frames,
    ),
    key: timing.keyAt === undefined ? 1 : enterProgress(frame, timing.keyAt),
    exit: exitProgress(frame, timing.exitAt),
  };
};

// The key item's color fades from `from` to amber as `key` goes 0 -> 1.
export const keyColor = (isKey: boolean, key: number, from: string): string =>
  isKey ? interpolateColors(key, [0, 1], [from, colors.amber[500]]) : from;

export const valueOpacity = (
  values: ValueLabels,
  isKey: boolean,
  p: Progress,
): number => {
  if (values === "all") {
    return p.enter;
  }
  if (values === "key" && isKey) {
    return p.enter * p.key;
  }
  return 0;
};

// Text sitting on a fill: switches to the dark base once the fill has turned amber.
export const textOn = (isKey: boolean, key: number): string =>
  isKey && key > 0.5 ? colors.bg.base : colors.text.secondary;

type ChartTextProps = {
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  color?: string;
  opacity?: number;
  size?: number;
  // Poppins (big numbers) instead of Inter.
  heading?: boolean;
};

export const ChartText: React.FC<ChartTextProps> = ({
  x,
  y,
  text,
  anchor = "middle",
  color = colors.text.secondary,
  opacity = 1,
  size = charts.labelSize,
  heading = false,
}) =>
  opacity <= 0 ? null : (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      fontFamily={heading ? fonts.heading : fonts.body}
      fontWeight={heading ? weights.heading : weights.bodyMedium}
      fontSize={size}
      fill={color}
      opacity={opacity}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </text>
  );
