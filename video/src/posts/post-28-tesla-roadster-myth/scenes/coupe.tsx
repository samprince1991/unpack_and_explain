import { colors } from "../../../brand/tokens";

// Side view of the post's coupe in diagram line art, nose to the right, from the same
// shape maths as blender/models/coupe.py (in metres: 4.2 m long, wheels r 0.27 m at ±1.32 m).
const LX = 2.1;
const ZB = 0.13;
const R = 0.27;
const AXLES = [1.32, -1.32];
const PX = 105; // px per metre at scale 1 (about 440 px long)

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};
const plan = (x: number) => {
  const u = x / LX;
  const n = u > 0 ? 5 : 6;
  return Math.max(1 - Math.abs(u) ** n, 0) ** (1 / n);
};
const belt = (x: number) => 0.8 - 0.13 * smooth(0.25, 1, x / LX) - 0.03 * smooth(-0.55, -1, x / LX);
const cabin = (x: number) => 0.33 * smooth(0.8, -0.05, x) * smooth(-1.3, -0.5, x);
const arch = (x: number) =>
  Math.max(...AXLES.map((ax) => (R * 2 + 0.045 - ZB) * (1 - smooth(0.22, 0.56, Math.abs(x - ax)))));

const outline = (() => {
  const xs = Array.from({ length: 161 }, (_, i) => -LX + (2 * LX * i) / 160);
  const top = xs.map((x) => {
    const g = plan(x);
    const zc = (ZB + belt(x)) / 2;
    const hh = ((belt(x) - ZB) / 2) * g ** 0.6;
    return [x, zc + hh + cabin(x) * g] as const;
  });
  const bottom = xs.map((x) => {
    const g = plan(x);
    const zc = (ZB + belt(x)) / 2;
    const hh = ((belt(x) - ZB) / 2) * g ** 0.6;
    return [x, zc - hh + arch(x) * Math.min(1, g * 1.5)] as const;
  });
  return [...top, ...bottom.reverse()];
})();

const topAt = (x: number) => {
  const g = plan(x);
  const zc = (ZB + belt(x)) / 2;
  const hh = ((belt(x) - ZB) / 2) * g ** 0.6;
  return zc + hh + cabin(x) * g;
};

// Side window (above the belt, under the roof edge) and the rear wing, as in the model.
const WINDOW = (() => {
  const xs = Array.from({ length: 31 }, (_, i) => -0.7 + (0.88 * i) / 30);
  return [...xs.map((x) => [x, topAt(x) - 0.08] as const), ...xs.reverse().map((x) => [x, belt(x) + 0.05] as const)];
})();
const WING = { x0: -1.99, x1: -1.69, z: Math.max(topAt(-1.99), topAt(-1.69)) + 0.17, strut: -1.84 };

type CoupeProps = {
  // Center x and the ground line under the wheels (frame coordinates).
  cx: number;
  ground: number;
  scale?: number;
  // Height of the wheels above the ground (a hop), in px.
  lift?: number;
  // Neutral weight: `faint` draws the parked cars, softer than the subject.
  tone?: "stroke" | "faint";
  opacity?: number;
};

export const CoupeSide: React.FC<CoupeProps> = ({ cx, ground, scale = 1, lift = 0, tone = "stroke", opacity = 1 }) => {
  const s = scale * PX;
  const base = ground - lift;
  const x = (u: number) => cx + u * s;
  const y = (v: number) => base - v * s;
  const d = outline.map(([u, v], i) => `${i === 0 ? "M" : "L"} ${x(u).toFixed(1)} ${y(v).toFixed(1)}`).join(" ") + " Z";
  const line = tone === "stroke" ? colors.diagram.stroke : colors.diagram.soft;
  const width = tone === "stroke" ? 5 : 3;
  const pathOf = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([u, v], i) => `${i === 0 ? "M" : "L"} ${x(u).toFixed(1)} ${y(v).toFixed(1)}`).join(" ") + " Z";
  return (
    <g opacity={opacity}>
      <line x1={x(WING.strut)} y1={y(topAt(WING.strut))} x2={x(WING.strut)} y2={y(WING.z)} stroke={line} strokeWidth={width} />
      <rect
        x={x(WING.x0)}
        y={y(WING.z) - 0.03 * s}
        width={(WING.x1 - WING.x0) * s}
        height={0.03 * s}
        rx={0.015 * s}
        fill={colors.diagram.fill}
        stroke={line}
        strokeWidth={width}
      />
      <path d={d} fill={colors.diagram.fill} stroke={line} strokeWidth={width} strokeLinejoin="round" />
      <path d={pathOf(WINDOW)} fill="none" stroke={colors.diagram.soft} strokeWidth={Math.max(2, width - 2)} strokeLinejoin="round" />
      {AXLES.map((ax) => (
        <g key={ax}>
          <circle cx={x(ax)} cy={y(R)} r={R * s} fill={colors.diagram.fill} stroke={line} strokeWidth={width} />
          <circle cx={x(ax)} cy={y(R)} r={R * s * 0.55} fill="none" stroke={colors.diagram.soft} strokeWidth={Math.max(2, width - 2)} />
        </g>
      ))}
    </g>
  );
};

// Underside points for drawings that hang things under the car (frame coordinates).
export const coupeUnderside = (cx: number, ground: number, scale = 1, u = 0) => ({
  x: cx + u * scale * PX,
  y: ground - (ZB + 0.01) * scale * PX,
});
