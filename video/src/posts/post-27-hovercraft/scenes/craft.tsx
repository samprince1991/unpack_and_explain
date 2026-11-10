import { colors } from "../../../brand/tokens";

type CraftProps = {
  // Center x and the ground line the skirt hovers over (frame coordinates).
  cx: number;
  ground: number;
  // Size multiplier (1 = about 440 px long) and how far the skirt sits above the ground.
  scale?: number;
  lift?: number;
  // Amber: the air gap under the skirt (the one key element of its beat).
  accentGap?: boolean;
  opacity?: number;
};

const FINGERS = 11;
const HALF = 210; // half length of the skirt at scale 1
const SKIRT = 46; // skirt height
const R = HALF / FINGERS; // finger radius

// Side view of the post's hovercraft in diagram line art: finger skirt, hull with a raised
// bow cowl (bow to the right), fan duct with its guard, rudder. Matches the Blender model.
export const CraftSide: React.FC<CraftProps> = ({ cx, ground, scale = 1, lift = 0, accentGap = false, opacity = 1 }) => {
  const s = scale;
  const base = ground - lift; // bottom of the skirt
  const hullBottom = base - SKIRT * s;
  const x = (u: number) => cx + u * s;
  const y = (v: number) => hullBottom + v * s;
  const fingers = Array.from({ length: FINGERS }, (_, i) => {
    const left = x(-HALF + i * 2 * R);
    const right = x(-HALF + (i + 1) * 2 * R);
    return `M ${left} ${hullBottom} L ${left} ${base - R * s} A ${R * s} ${R * s} 0 0 0 ${right} ${base - R * s} L ${right} ${hullBottom}`;
  }).join(" ");
  const hull = [
    `M ${x(-225)} ${y(0)}`,
    `L ${x(205)} ${y(0)}`,
    `C ${x(235)} ${y(0)} ${x(245)} ${y(-30)} ${x(238)} ${y(-58)}`, // bow rounds up
    `C ${x(200)} ${y(-80)} ${x(120)} ${y(-92)} ${x(60)} ${y(-96)}`, // the cowl rises toward the cockpit
    `L ${x(30)} ${y(-74)}`,
    `L ${x(-200)} ${y(-74)}`,
    `C ${x(-222)} ${y(-74)} ${x(-230)} ${y(-60)} ${x(-230)} ${y(-40)}`,
    `L ${x(-230)} ${y(-14)}`,
    `C ${x(-230)} ${y(-5)} ${x(-228)} ${y(0)} ${x(-225)} ${y(0)}`,
    "Z",
  ].join(" ");
  const duct = { cx: x(-140), cy: y(-74) - 66 * s, r: 66 * s }; // sits on the deck
  const gapY = (base + ground) / 2;
  return (
    <g opacity={opacity}>
      {/* rudder behind the duct */}
      <rect
        x={x(-222)}
        y={y(-194)}
        width={12 * s}
        height={120 * s}
        rx={4 * s}
        fill={colors.diagram.fill}
        stroke={colors.diagram.soft}
        strokeWidth={4}
      />
      {/* fan duct, seen side-on: a short drum */}
      <rect
        x={duct.cx - 26 * s}
        y={duct.cy - duct.r}
        width={52 * s}
        height={duct.r * 2}
        rx={14 * s}
        fill={colors.diagram.fill}
        stroke={colors.diagram.stroke}
        strokeWidth={5}
      />
      <line x1={duct.cx + 30 * s} y1={duct.cy - duct.r + 8 * s} x2={duct.cx + 30 * s} y2={duct.cy + duct.r - 8 * s} stroke={colors.diagram.soft} strokeWidth={3} />
      <path d={hull} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={5} strokeLinejoin="round" />
      <path d={fingers} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={4} strokeLinejoin="round" />
      {lift > 2 ? (
        <line
          x1={x(-HALF)}
          y1={gapY}
          x2={x(HALF)}
          y2={gapY}
          stroke={accentGap ? colors.amber[500] : colors.diagram.faint}
          strokeWidth={accentGap ? 6 : 3}
          strokeDasharray={accentGap ? undefined : "10 10"}
          strokeLinecap="round"
        />
      ) : null}
    </g>
  );
};
