import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { layout } from "../../../brand/layout";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { ClockIcon } from "../../../components/icons/ClockIcon";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { PinIcon } from "../../../components/icons/PinIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { StepBadge } from "../../../components/StepBadge";
import { useCue, useSection } from "../../../templates/SectionContext";

const PHONE = { x: 540, y: 930 };
const SATELLITES = [
  { x: 210, y: 510 },
  { x: 540, y: 470 },
  { x: 870, y: 520 },
];
// Right side, clear of the step badge row.
const FOURTH = { x: 870, y: 770 };
const DRAW_FRAMES = 20;
const PULSE_PERIOD = 30;

const distance = (a: { x: number; y: number }) => Math.hypot(a.x - PHONE.x, a.y - PHONE.y);

const DrawCircle: React.FC<{ center: { x: number; y: number }; start: number; color: string }> = ({
  center,
  start,
  color,
}) => {
  const frame = useCurrentFrame();
  const r = distance(center);
  const circumference = 2 * Math.PI * r;
  return (
    <circle
      cx={center.x}
      cy={center.y}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={5}
      strokeDasharray={circumference}
      strokeDashoffset={interpolate(frame, [start, start + DRAW_FRAMES], [circumference, 0], {
        ...clamp,
        easing: ease.smooth,
      })}
    />
  );
};

export const MechanismScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const steps = [
    { n: 1, label: "Position + send time", from: useCue("carries", 0) },
    { n: 2, label: "Measure the delay", from: useCue("measures", 0.25) },
    { n: 3, label: "Delay × light speed = distance", from: useCue("delay", 0.45) },
    { n: 4, label: "3 distances = your position", from: useCue("three", 0.65) },
    { n: 5, label: "A 4th fixes the clock", from: useCue("fourth", 0.85) },
  ];
  const [pulses, , distances, circles, fourth] = steps.map((s) => s.from);

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
            opacity={interpolate(frame, [pulses, pulses + 10], [0, 1], clamp)}
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
          <DrawCircle key={`circle-${sat.x}`} center={sat} start={circles} color={colors.diagram.soft} />
        ))}
        {frame >= fourth ? (
          <DrawCircle center={FOURTH} start={fourth + 8} color={colors.diagram.stroke} />
        ) : null}
        {SATELLITES.map((sat) => (
          <SatelliteIcon key={`sat-${sat.x}`} x={sat.x} y={sat.y} size={100} />
        ))}
        {frame >= fourth ? <SatelliteIcon x={FOURTH.x} y={FOURTH.y} size={90} /> : null}
        <PhoneIcon x={PHONE.x} y={PHONE.y} size={140} />
        <g
          style={{
            scale: interpolate(frame, [circles + DRAW_FRAMES, circles + DRAW_FRAMES + 12], [0, 1], {
              ...clamp,
              easing: ease.pop,
            }),
            transformOrigin: `${PHONE.x}px ${PHONE.y - 80}px`,
          }}
        >
          <PinIcon x={PHONE.x} y={PHONE.y - 80} size={80} />
        </g>
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
      {steps.map((step, i) => {
        const end = steps[i + 1]?.from ?? durationInFrames;
        return end > step.from ? (
          <Sequence key={step.n} from={step.from} durationInFrames={end - step.from} layout="none">
            <div style={{ position: "absolute", left: layout.content.x, top: 1130 }}>
              <StepBadge n={step.n} label={step.label} />
            </div>
          </Sequence>
        ) : null;
      })}
    </AbsoluteFill>
  );
};
