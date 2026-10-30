import { slideLayout } from "../../../brand/layout";
import { colors } from "../../../brand/tokens";
import { SlideCanvas } from "../../../components/carousel/SlideCanvas";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { PinIcon } from "../../../components/icons/PinIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";

const PHONE = { x: 540, y: 800 };
const SATELLITES = [
  { x: 300, y: 650 },
  { x: 780, y: 650 },
];

// Two satellites signalling down to a phone with no Wi-Fi that still shows the pin.
export const CoverVisual: React.FC = () => {
  return (
    <SlideCanvas region={slideLayout.regions.coverVisual}>
      {SATELLITES.map((s) => (
        <line
          key={s.x}
          x1={s.x}
          y1={s.y + 20}
          x2={PHONE.x}
          y2={PHONE.y - 60}
          stroke={colors.diagram.soft}
          strokeWidth={3}
          strokeDasharray="8 10"
        />
      ))}
      {SATELLITES.map((s) => (
        <SatelliteIcon key={s.x} x={s.x} y={s.y} size={120} />
      ))}
      <PhoneIcon x={PHONE.x} y={PHONE.y} size={220} />
      {/* No Wi-Fi: struck-through arcs beside the phone. */}
      <g transform="translate(700 790)" stroke={colors.diagram.faint} strokeWidth={5} fill="none" strokeLinecap="round">
        <path d="M -30 0 A 42 42 0 0 1 30 0" />
        <path d="M -18 14 A 24 24 0 0 1 18 14" />
        <circle cx={0} cy={28} r={4} fill={colors.diagram.faint} />
        <line x1={-36} y1={36} x2={36} y2={-24} stroke={colors.diagram.soft} />
      </g>
      <PinIcon x={PHONE.x} y={PHONE.y + 20} size={70} />
    </SlideCanvas>
  );
};
