import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";
import { SceneCanvas } from "../../../components/SceneCanvas";

const PHONE = { x: 540, y: 990 };
const SATELLITES = [
  { x: 230, y: 740 },
  { x: 850, y: 730 },
];
const RING_PERIOD = 36;
// Half-width of each signal arc, in radians, centered on the satellite -> phone direction.
const ARC_SPREAD = 0.6;

// Arc of radius r around `from`, facing `to`.
const signalArc = (from: { x: number; y: number }, to: { x: number; y: number }, r: number) => {
  const dir = Math.atan2(to.y - from.y, to.x - from.x);
  const a = dir - ARC_SPREAD;
  const b = dir + ARC_SPREAD;
  return `M ${from.x + r * Math.cos(a)} ${from.y + r * Math.sin(a)} A ${r} ${r} 0 0 1 ${from.x + r * Math.cos(b)} ${from.y + r * Math.sin(b)}`;
};

// Hook title is added by the Reel template above this scene.
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <SceneCanvas>
        {SATELLITES.map((sat, i) => {
          // Signals travel from each satellite to the phone; nothing goes back.
          const reach = Math.hypot(PHONE.x - sat.x, PHONE.y - sat.y) - 70;
          return [0, 1, 2].map((k) => {
            const t = ((frame + k * (RING_PERIOD / 3) + i * 6) % RING_PERIOD) / RING_PERIOD;
            return (
              <path
                key={`${i}-${k}`}
                d={signalArc(sat, PHONE, 50 + t * (reach - 50))}
                fill="none"
                stroke={colors.diagram.soft}
                strokeWidth={4}
                strokeLinecap="round"
                opacity={interpolate(t, [0, 0.15, 1], [0, 0.7, 0.15])}
              />
            );
          });
        })}
        {SATELLITES.map((sat) => (
          <SatelliteIcon key={sat.x} x={sat.x} y={sat.y} size={110} />
        ))}
        <g
          style={{
            scale: interpolate(frame, [0, durations.enter], [0.8, 1], { ...clamp, easing: ease.smooth }),
            transformOrigin: `${PHONE.x}px ${PHONE.y}px`,
          }}
        >
          <PhoneIcon x={PHONE.x} y={PHONE.y} size={260} />
        </g>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
