import { slideLayout } from "../../../brand/layout";
import { colors } from "../../../brand/tokens";
import { SlideCanvas } from "../../../components/carousel/SlideCanvas";
import { ClockIcon } from "../../../components/icons/ClockIcon";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";

const SATELLITE = { x: 280, y: 490 };
const PHONE = { x: 700, y: 690 };

// The signal travels down to the phone, which times its arrival (amber minute hand).
export const TimingVisual: React.FC = () => {
  return (
    <SlideCanvas region={slideLayout.regions.visual}>
      <line
        x1={SATELLITE.x + 40}
        y1={SATELLITE.y + 30}
        x2={PHONE.x - 50}
        y2={PHONE.y - 40}
        stroke={colors.diagram.soft}
        strokeWidth={4}
        strokeDasharray="10 10"
      />
      <SatelliteIcon x={SATELLITE.x} y={SATELLITE.y} size={140} />
      <PhoneIcon x={PHONE.x} y={PHONE.y} size={180} />
      <ClockIcon x={860} y={560} size={130} minuteAngle={50} />
    </SlideCanvas>
  );
};
