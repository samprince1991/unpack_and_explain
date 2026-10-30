import { slideLayout } from "../../../brand/layout";
import { colors } from "../../../brand/tokens";
import { SlideCanvas } from "../../../components/carousel/SlideCanvas";
import { ClockIcon } from "../../../components/icons/ClockIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";

const CLOCK = { x: 600, y: 620 };
const ARROW_R = 140;

const polar = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${CLOCK.x + ARROW_R * Math.cos(a)} ${CLOCK.y + ARROW_R * Math.sin(a)}`;
};

// The satellite clock gets a small correction (curved arrow); the minute hand is amber.
export const RelativityVisual: React.FC = () => {
  return (
    <SlideCanvas region={slideLayout.regions.visual}>
      <defs>
        <marker id="fix-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={colors.diagram.soft} />
        </marker>
      </defs>
      <SatelliteIcon x={330} y={500} size={130} />
      <ClockIcon x={CLOCK.x} y={CLOCK.y} size={220} minuteAngle={30} />
      <path
        d={`M ${polar(-70)} A ${ARROW_R} ${ARROW_R} 0 0 0 ${polar(-120)}`}
        fill="none"
        stroke={colors.diagram.soft}
        strokeWidth={5}
        strokeLinecap="round"
        markerEnd="url(#fix-arrow)"
      />
    </SlideCanvas>
  );
};
