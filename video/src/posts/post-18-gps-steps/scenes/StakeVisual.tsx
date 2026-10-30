import { slideLayout } from "../../../brand/layout";
import { colors } from "../../../brand/tokens";
import { SlideCanvas } from "../../../components/carousel/SlideCanvas";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";

const PHONE = { x: 540, y: 690 };
const SATELLITES = [
  { x: 280, y: 480 },
  { x: 800, y: 480 },
];

// Signals only come down; the phone listens (amber arcs) and sends nothing back.
export const StakeVisual: React.FC = () => {
  return (
    <SlideCanvas region={slideLayout.regions.visual}>
      <defs>
        <marker id="stake-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={colors.diagram.soft} />
        </marker>
      </defs>
      {SATELLITES.map((s) => (
        <line
          key={s.x}
          x1={s.x + (PHONE.x - s.x) * 0.18}
          y1={s.y + 40}
          x2={s.x + (PHONE.x - s.x) * 0.72}
          y2={PHONE.y - 60}
          stroke={colors.diagram.soft}
          strokeWidth={4}
          strokeDasharray="10 10"
          markerEnd="url(#stake-arrow)"
        />
      ))}
      {SATELLITES.map((s) => (
        <SatelliteIcon key={s.x} x={s.x} y={s.y} size={130} />
      ))}
      <PhoneIcon x={PHONE.x} y={PHONE.y} size={180} />
      {/* Listening: partial arcs either side of the phone. */}
      <g stroke={colors.amber[500]} strokeWidth={5} fill="none" strokeLinecap="round">
        {[70, 100].map((r) => (
          <g key={r}>
            <path d={`M ${PHONE.x - r} ${PHONE.y - 40} A ${r * 1.3} ${r * 1.3} 0 0 0 ${PHONE.x - r} ${PHONE.y + 40}`} />
            <path d={`M ${PHONE.x + r} ${PHONE.y - 40} A ${r * 1.3} ${r * 1.3} 0 0 1 ${PHONE.x + r} ${PHONE.y + 40}`} />
          </g>
        ))}
      </g>
    </SlideCanvas>
  );
};
