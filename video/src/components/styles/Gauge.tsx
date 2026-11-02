import { noise2D } from "@remotion/noise";
import { interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../brand/fonts";
import { clamp, durations, ease } from "../../brand/motion";
import { colors, typeScale } from "../../brand/tokens";
import { enterProgress } from "../motion/progress";

type GaugeProps = {
  cx: number;
  cy: number;
  r: number;
  // Needle keyframes: [frame, level 0-1]. Moves with ease.smooth between them.
  levels: [number, number][];
  // Small unit text under the hub (e.g. "kg"); may change over time.
  unit?: string;
  // Level drawn as a brighter tick (e.g. 0.5 = half).
  mark?: number;
  at?: number;
  // Needle tremble, in level units (0 = steady). Deterministic noise.
  jitter?: number;
};

const START = Math.PI; // left end of the dial (level 0)

const point = (cx: number, cy: number, r: number, level: number) => {
  const a = START + level * Math.PI;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

const levelAt = (frame: number, levels: [number, number][]) => {
  if (levels.length === 1) {
    return levels[0][1];
  }
  return interpolate(
    frame,
    levels.map(([f]) => f),
    levels.map(([, l]) => l),
    { ...clamp, easing: ease.smooth },
  );
};

// Dial gauge (fuel, speed, pressure): half-circle scale in neutral line art, the needle
// is the amber key element. SVG, for use inside SceneCanvas.
export const Gauge: React.FC<GaugeProps> = ({
  cx,
  cy,
  r,
  levels,
  unit,
  mark,
  at = 0,
  jitter = 0,
}) => {
  const frame = useCurrentFrame();
  const p = enterProgress(frame, at, durations.enter);
  const level = levelAt(frame, levels) + noise2D("gauge", frame * 0.08, 0) * jitter;
  const tip = point(cx, cy, r - 40, level);
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const ticks = Array.from({ length: 9 }, (_, i) => i / 8);

  return (
    <g opacity={p} style={{ scale: `${0.94 + 0.06 * p}`, transformOrigin: `${cx}px ${cy}px` }}>
      <path d={arc} fill="none" stroke={colors.diagram.soft} strokeWidth={6} strokeLinecap="round" />
      {ticks.map((t) => {
        const a = point(cx, cy, r - 18, t);
        const b = point(cx, cy, r - (t === mark ? 64 : 42), t);
        return (
          <line
            key={t}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={t === mark ? colors.diagram.stroke : colors.diagram.faint}
            strokeWidth={t === mark ? 6 : 4}
            strokeLinecap="round"
          />
        );
      })}
      <line
        x1={cx}
        y1={cy}
        x2={tip.x}
        y2={tip.y}
        stroke={colors.amber[500]}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={22} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={5} />
      {unit ? (
        <text
          x={cx}
          y={cy + 90}
          textAnchor="middle"
          fontFamily={fonts.body}
          fontWeight={weights.bodySemibold}
          fontSize={typeScale.title}
          fill={colors.text.primary}
        >
          {unit}
        </text>
      ) : null}
    </g>
  );
};
