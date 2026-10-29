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

// Hook title is added by the Reel template above this scene.
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <SceneCanvas>
        {SATELLITES.map((sat, i) =>
          [0, 1, 2].map((k) => {
            const t = ((frame + k * (RING_PERIOD / 3) + i * 6) % RING_PERIOD) / RING_PERIOD;
            return (
              <circle
                key={`${i}-${k}`}
                cx={sat.x}
                cy={sat.y}
                r={40 + t * 320}
                fill="none"
                stroke={colors.diagram.soft}
                strokeWidth={4}
                opacity={(1 - t) * 0.6}
              />
            );
          }),
        )}
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
