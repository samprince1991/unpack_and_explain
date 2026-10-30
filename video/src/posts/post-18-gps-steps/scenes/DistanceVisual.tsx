import { slideLayout } from "../../../brand/layout";
import { colors } from "../../../brand/tokens";
import { SlideCanvas } from "../../../components/carousel/SlideCanvas";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";

const SATELLITE = { x: 270, y: 500 };
const PHONE = { x: 810, y: 690 };
const TICK = 22;

type Point = { x: number; y: number };

// A dimension line from satellite to phone: the distance is the key element.
export const DistanceVisual: React.FC = () => {
  const a = { x: SATELLITE.x + 70, y: SATELLITE.y + 25 };
  const b = { x: PHONE.x - 60, y: PHONE.y - 21 };
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  // Unit normal, for the end ticks.
  const n = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
  const tick = (p: Point) => (
    <line x1={p.x - n.x * TICK} y1={p.y - n.y * TICK} x2={p.x + n.x * TICK} y2={p.y + n.y * TICK} />
  );

  return (
    <SlideCanvas region={slideLayout.regions.visual}>
      <SatelliteIcon x={SATELLITE.x} y={SATELLITE.y} size={140} />
      <PhoneIcon x={PHONE.x} y={PHONE.y} size={180} />
      <g stroke={colors.amber[500]} strokeWidth={6} strokeLinecap="round">
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        {tick(a)}
        {tick(b)}
      </g>
    </SlideCanvas>
  );
};
