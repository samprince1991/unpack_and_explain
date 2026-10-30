import { slideLayout } from "../../../brand/layout";
import { colors } from "../../../brand/tokens";
import { SlideCanvas } from "../../../components/carousel/SlideCanvas";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";

const EARTH = { x: 540, y: 960, r: 240 };
const ORBIT = 400;
const ANGLES = [-128, -90, -52];

const onOrbit = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: EARTH.x + ORBIT * Math.cos(a), y: EARTH.y + ORBIT * Math.sin(a) };
};

// Satellites on one orbit arc above Earth, each broadcasting rings; one is the key.
export const BroadcastVisual: React.FC = () => {
  return (
    <SlideCanvas region={slideLayout.regions.visual}>
      <circle cx={EARTH.x} cy={EARTH.y} r={EARTH.r} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={3} />
      <circle cx={EARTH.x} cy={EARTH.y} r={ORBIT} fill="none" stroke={colors.diagram.faint} strokeWidth={3} strokeDasharray="6 12" />
      {ANGLES.map((deg, i) => {
        const p = onOrbit(deg);
        const ring = i === 1 ? colors.amber[500] : colors.diagram.soft;
        return (
          <g key={deg}>
            {[52, 84].map((r, k) => (
              <circle key={r} cx={p.x} cy={p.y} r={r} fill="none" stroke={ring} strokeWidth={4} opacity={k === 0 ? 1 : 0.5} />
            ))}
            <SatelliteIcon x={p.x} y={p.y} size={110} />
          </g>
        );
      })}
    </SlideCanvas>
  );
};
