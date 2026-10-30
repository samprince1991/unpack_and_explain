import { slideLayout } from "../../../brand/layout";
import { colors } from "../../../brand/tokens";
import { SlideCanvas } from "../../../components/carousel/SlideCanvas";
import { PinIcon } from "../../../components/icons/PinIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";

const POINT = { x: 540, y: 740 };
const SATELLITES = [
  { x: 230, y: 480 },
  { x: 540, y: 450 },
  { x: 850, y: 480 },
];
const FOURTH = { x: 880, y: 680 };
// Only the part of each distance circle near the meeting point is drawn.
const ARC_LENGTH = 220;

const DistanceArc: React.FC<{ center: { x: number; y: number } }> = ({ center }) => {
  const r = Math.hypot(POINT.x - center.x, POINT.y - center.y);
  const dir = Math.atan2(POINT.y - center.y, POINT.x - center.x);
  const spread = ARC_LENGTH / 2 / r;
  const at = (a: number) => `${center.x + r * Math.cos(a)} ${center.y + r * Math.sin(a)}`;
  return (
    <path
      d={`M ${at(dir - spread)} A ${r} ${r} 0 0 1 ${at(dir + spread)}`}
      fill="none"
      stroke={colors.diagram.stroke}
      strokeWidth={4}
      strokeLinecap="round"
    />
  );
};

// Three distance arcs meet at one point (the pin); a fourth satellite checks the clock.
export const FixVisual: React.FC = () => {
  return (
    <SlideCanvas region={slideLayout.regions.visual}>
      {SATELLITES.map((s) => (
        <line
          key={`range-${s.x}`}
          x1={s.x}
          y1={s.y + 30}
          x2={POINT.x}
          y2={POINT.y}
          stroke={colors.diagram.faint}
          strokeWidth={3}
          strokeDasharray="6 10"
        />
      ))}
      {SATELLITES.map((s) => (
        <DistanceArc key={s.x} center={s} />
      ))}
      <line
        x1={FOURTH.x - 40}
        y1={FOURTH.y + 10}
        x2={POINT.x + 40}
        y2={POINT.y - 10}
        stroke={colors.diagram.faint}
        strokeWidth={3}
        strokeDasharray="6 10"
      />
      {SATELLITES.map((s) => (
        <SatelliteIcon key={s.x} x={s.x} y={s.y} size={110} />
      ))}
      <SatelliteIcon x={FOURTH.x} y={FOURTH.y} size={80} />
      <PinIcon x={POINT.x} y={POINT.y} size={90} />
    </SlideCanvas>
  );
};
