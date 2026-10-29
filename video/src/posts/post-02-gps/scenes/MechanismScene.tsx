import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { ClockIcon } from "../../../components/icons/ClockIcon";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

const PHONE = { x: 540, y: 980 };
const SATELLITES = [
  { x: 210, y: 560 },
  { x: 540, y: 520 },
  { x: 870, y: 570 },
];
const FOURTH = { x: 870, y: 820 };
const DRAW_FRAMES = 20;
const PULSE_PERIOD = 30;
// Length of each distance arc. Only the part of the circle that crosses the phone is
// drawn, so three arcs meet at one point instead of three full circles crowding the frame.
const ARC_LENGTH = 260;

const distance = (a: { x: number; y: number }) => Math.hypot(a.x - PHONE.x, a.y - PHONE.y);

const DistanceArc: React.FC<{ center: { x: number; y: number }; start: number; color: string }> = ({
  center,
  start,
  color,
}) => {
  const frame = useCurrentFrame();
  const r = distance(center);
  const dir = Math.atan2(PHONE.y - center.y, PHONE.x - center.x);
  const spread = ARC_LENGTH / 2 / r;
  const point = (a: number) => `${center.x + r * Math.cos(a)} ${center.y + r * Math.sin(a)}`;
  return (
    <path
      d={`M ${point(dir - spread)} A ${r} ${r} 0 0 1 ${point(dir + spread)}`}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeDasharray={ARC_LENGTH}
      strokeDashoffset={interpolate(frame, [start, start + DRAW_FRAMES], [ARC_LENGTH, 0], {
        ...clamp,
        easing: ease.smooth,
      })}
    />
  );
};

export const MechanismScene: React.FC = () => {
  const frame = useCurrentFrame();
  // Visual beats, synced to the voice-over (the captions already carry the words).
  const pulses = useCue("carries", 0);
  const distances = useCue("delay", 0.45);
  const circles = useCue("three", 0.65);
  const fourth = useCue("fourth", 0.85);

  return (
    <AbsoluteFill>
      <SceneCanvas>
        {SATELLITES.map((sat) => (
          <line
            key={`line-${sat.x}`}
            x1={sat.x}
            y1={sat.y}
            x2={PHONE.x}
            y2={PHONE.y}
            stroke={frame >= distances ? colors.diagram.stroke : colors.diagram.faint}
            strokeWidth={frame >= distances ? 6 : 3}
            strokeDasharray={frame >= distances ? undefined : "8 10"}
            // Lines step back once the arcs take over the story.
            opacity={interpolate(frame, [pulses, pulses + 10, circles, circles + 12], [0, 1, 1, 0], clamp)}
          />
        ))}
        {frame >= pulses && frame < distances
          ? SATELLITES.map((sat, i) => {
              const t = ((frame - pulses + i * 8) % PULSE_PERIOD) / PULSE_PERIOD;
              return (
                <circle
                  key={`pulse-${sat.x}`}
                  cx={sat.x + (PHONE.x - sat.x) * t}
                  cy={sat.y + (PHONE.y - sat.y) * t}
                  r={10}
                  fill={colors.diagram.stroke}
                />
              );
            })
          : null}
        {SATELLITES.map((sat) => (
          <SatelliteIcon key={`sat-${sat.x}`} x={sat.x} y={sat.y} size={100} />
        ))}
        {frame >= fourth ? <SatelliteIcon x={FOURTH.x} y={FOURTH.y} size={90} /> : null}
        <g opacity={interpolate(frame, [circles, circles + 12], [1, 0.3], clamp)}>
          <PhoneIcon x={PHONE.x} y={PHONE.y} size={140} />
        </g>
        {SATELLITES.map((sat) => (
          <DistanceArc key={`arc-${sat.x}`} center={sat} start={circles} color={colors.diagram.soft} />
        ))}
        {frame >= fourth ? (
          <DistanceArc center={FOURTH} start={fourth + 8} color={colors.diagram.faint} />
        ) : null}
        {frame >= circles + DRAW_FRAMES ? (
          <circle
            cx={PHONE.x}
            cy={PHONE.y}
            r={14 + ((frame - circles - DRAW_FRAMES) % 40) * 1.2}
            fill="none"
            stroke={colors.amber[500]}
            strokeWidth={3}
            opacity={1 - ((frame - circles - DRAW_FRAMES) % 40) / 40}
          />
        ) : null}
        <circle
          cx={PHONE.x}
          cy={PHONE.y}
          r={interpolate(frame, [circles + DRAW_FRAMES, circles + DRAW_FRAMES + 10], [0, 16], {
            ...clamp,
            easing: ease.pop,
          })}
          fill={colors.amber[500]}
        />
        {frame >= fourth ? (
          <ClockIcon
            x={PHONE.x + 150}
            y={PHONE.y}
            size={90}
            minuteAngle={interpolate(frame, [fourth + 15, fourth + 30], [60, 0], {
              ...clamp,
              easing: ease.pop,
            })}
          />
        ) : null}
      </SceneCanvas>
    </AbsoluteFill>
  );
};
