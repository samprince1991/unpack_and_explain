import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { Gauge } from "../../../components/styles/Gauge";
import { useCue, useSection } from "../../../templates/SectionContext";
import { CAR, Car } from "../car";

const GROUND = 1150;
const SCALE = 1.05; // 630 px wide: the nose and tail stay inside the canvas through the camera push
const CAR_X = 540 - (CAR.width * SCALE) / 2;
const GAUGE = { cx: 540, cy: 670, r: 170 };
// The callout circle, over the car: first a gas engine, then this car's electric motor.
const CALL = { cx: 540, cy: 620, r: 160 };
const MOTOR = {
  x: CAR_X + (CAR.motor.x + CAR.motor.w / 2) * SCALE,
  y: GROUND + (CAR.motor.y + CAR.motor.h / 2) * SCALE,
};

type WavesProps = { x: number; y: number; frame: number; count: number; size: number; color: string; opacity?: number };

// Rising heat waves: `count` wavy lines drifting up from (x, y) and fading as they go.
const Waves: React.FC<WavesProps> = ({ x, y, frame, count, size, color, opacity = 1 }) => (
  <g>
    {Array.from({ length: count }, (_, k) => {
      const span = size * 1.4;
      const rise = (frame * 1.4 + k * 17) % span;
      const wx = x + (k - (count - 1) / 2) * size * 0.55;
      const wy = y - rise;
      const h = size / 4;
      return (
        <path
          key={k}
          d={`M ${wx} ${wy} q ${h * 0.6} ${-h} 0 ${-2 * h} q ${-h * 0.6} ${-h} 0 ${-2 * h}`}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          opacity={opacity * (1 - rise / span)}
        />
      );
    })}
  </g>
);

// One subject, the electric car, side on (traced from the 3D model).
// "No free heat": a cabin temperature dial over it reads low (the dial style leads: the last
// three posts led with line-art diagrams). "A gas car warms you with heat from its engine":
// the dial clears and a callout circle shows a gas engine with big heat waves pouring off it
// (amber: the heat is the thing to notice). "An electric motor makes very little heat": the
// callout swaps to this car's motor, amber, joined to it in the car by a dashed leader line,
// with only one small, faint wisp coming off it.
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const gas = useCue("gas", 0.3);
  const motor = useCue("motor", 0.78);
  const motorKey = interpolate(frame, [motor + 4, motor + 16], [0, 1], { ...clamp, easing: ease.smooth });
  const lead = interpolate(frame, [motor + 4, motor + 18], [0, 1], { ...clamp, easing: ease.smooth });
  const start = { x: CALL.cx - CALL.r * 0.55, y: CALL.cy + CALL.r * 0.83 };
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-37-far">
        <DustField seed="setup-37" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-37-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Cabin dial">
              <Reveal at={0} exitAt={gas - 6}>
                <Gauge cx={GAUGE.cx} cy={GAUGE.cy} r={GAUGE.r} levels={[[0, 0.14]]} unit="°C" jitter={0.01} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Callout ring">
              <Reveal at={gas}>
                <circle cx={CALL.cx} cy={CALL.cy} r={CALL.r} fill={colors.diagram.fill} stroke={colors.diagram.soft} strokeWidth={5} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Gas engine">
              <Reveal at={gas + 4} exitAt={motor - 6}>
                <g>
                  <rect x={CALL.cx - 80} y={CALL.cy - 10} width={160} height={100} rx={14} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={6} />
                  {[-40, 0, 40].map((dx) => (
                    <line key={dx} x1={CALL.cx + dx} y1={CALL.cy + 12} x2={CALL.cx + dx} y2={CALL.cy + 68} stroke={colors.diagram.soft} strokeWidth={6} strokeLinecap="round" />
                  ))}
                  <Waves x={CALL.cx} y={CALL.cy - 24} frame={frame - gas} count={3} size={90} color={colors.amber[500]} />
                </g>
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Electric motor">
              <Reveal at={motor}>
                <g>
                  <rect x={CALL.cx - 90} y={CALL.cy - 10} width={150} height={96} rx={30} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={6} />
                  <rect x={CALL.cx - 90} y={CALL.cy - 10} width={150} height={96} rx={30} fill={colors.amber[500]} opacity={motorKey} />
                  <rect x={CALL.cx + 64} y={CALL.cy + 26} width={46} height={24} rx={8} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={5} />
                  <Waves x={CALL.cx - 15} y={CALL.cy - 24} frame={frame - motor} count={1} size={44} color={colors.diagram.soft} opacity={0.45} />
                </g>
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Ground">
              {/* Behind the car, so it never paints over the bottom of the tyres. */}
              <line x1={160} y1={GROUND} x2={920} y2={GROUND} stroke={colors.diagram.faint} strokeWidth={5} strokeLinecap="round" />
            </Interactive.G>
            <Interactive.G name="Electric car">
              <Reveal at={0}>
                <Car x={CAR_X} y={GROUND} scale={SCALE} motorKey={motorKey} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Leader line">
              <line
                x1={start.x}
                y1={start.y}
                x2={start.x + (MOTOR.x - start.x) * lead}
                y2={start.y + (MOTOR.y - 18 - start.y) * lead}
                stroke={colors.diagram.soft}
                strokeWidth={5}
                strokeDasharray="12 10"
                strokeLinecap="round"
                opacity={lead > 0 ? 1 : 0}
              />
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
