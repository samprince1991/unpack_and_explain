import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";
import { TRAIN, Train } from "../train";

const RAIL_Y = 960;
const WHEEL = { cx: 540, r: 170 };
const GAP = 46; // px the maglev lifts: exaggerated from 10 cm so it reads

// One subject, the train, side on. "Normal trains roll on steel wheels": a big steel wheel
// on a rail, shaking as it rolls (short shake lines at the contact). "Lifts off": the wheel
// fades, the maglev car settles in its place and rises, and the gap under it turns amber.
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const steel = useCue("steel", 0.2);
  const lifts = useCue("lifts", 0.75);
  const rolling = frame >= steel && frame < lifts;
  const shake = rolling ? 3 * Math.sin(frame * 2.1) : 0;
  const spin = (frame - steel) * 4;
  const wheelOut = interpolate(frame, [lifts - 8, lifts + 4], [1, 0], { ...clamp, easing: ease.smooth });
  const trainIn = interpolate(frame, [lifts - 4, lifts + 8], [0, 1], { ...clamp, easing: ease.smooth });
  const lift = interpolate(frame, [lifts + 6, lifts + 22], [0, GAP], { ...clamp, easing: ease.out });
  const hub = RAIL_Y - WHEEL.r;
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-31-far">
        <DustField seed="setup-31" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-31-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Rail">
              <DrawPath d={`M 120 ${RAIL_Y} L 960 ${RAIL_Y}`} at={0} color={colors.diagram.stroke} width={6} />
              <DrawPath d={`M 120 ${RAIL_Y + 26} L 960 ${RAIL_Y + 26}`} at={4} color={colors.diagram.faint} width={4} />
            </Interactive.G>
            <Interactive.G name="Steel wheel" style={{ translate: `0px ${shake}px` }}>
              <g opacity={wheelOut}>
                <circle cx={WHEEL.cx} cy={hub} r={WHEEL.r} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={6} />
                <circle cx={WHEEL.cx} cy={hub} r={WHEEL.r - 26} fill="none" stroke={colors.diagram.soft} strokeWidth={4} />
                <g style={{ rotate: `${spin}deg`, transformOrigin: `${WHEEL.cx}px ${hub}px` }}>
                  {[0, 60, 120].map((a) => (
                    <line
                      key={a}
                      x1={WHEEL.cx + (WHEEL.r - 30) * Math.cos((a * Math.PI) / 180)}
                      y1={hub + (WHEEL.r - 30) * Math.sin((a * Math.PI) / 180)}
                      x2={WHEEL.cx - (WHEEL.r - 30) * Math.cos((a * Math.PI) / 180)}
                      y2={hub - (WHEEL.r - 30) * Math.sin((a * Math.PI) / 180)}
                      stroke={colors.diagram.soft}
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                  ))}
                </g>
                <circle cx={WHEEL.cx} cy={hub} r={16} fill={colors.diagram.stroke} />
              </g>
            </Interactive.G>
            <Interactive.G name="Shake lines">
              <Reveal at={steel} exitAt={lifts - 6}>
                {[-1, 1].map((s) => (
                  <g key={s}>
                    <path
                      d={`M ${WHEEL.cx + s * 70} ${RAIL_Y - 14} q ${s * 26} -8 ${s * 46} 0`}
                      fill="none"
                      stroke={colors.diagram.soft}
                      strokeWidth={4}
                      strokeLinecap="round"
                      opacity={0.5 + 0.5 * Math.abs(Math.sin(frame * 0.7 + s))}
                    />
                    <path
                      d={`M ${WHEEL.cx + s * 82} ${RAIL_Y - 34} q ${s * 22} -8 ${s * 38} 0`}
                      fill="none"
                      stroke={colors.diagram.soft}
                      strokeWidth={4}
                      strokeLinecap="round"
                      opacity={0.5 + 0.5 * Math.abs(Math.sin(frame * 0.7 + s + 1.5))}
                    />
                  </g>
                ))}
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Maglev">
              <Train y={RAIL_Y} lift={lift} opacity={trainIn} />
            </Interactive.G>
            <Interactive.G name="Gap">
              <Reveal at={lifts + 14}>
                <rect
                  x={TRAIN.left + 40}
                  y={RAIL_Y - lift + 8}
                  width={TRAIN.right - TRAIN.left - 80}
                  height={Math.max(lift - 16, 0)}
                  rx={6}
                  fill={colors.amber[500]}
                  opacity={0.85}
                />
              </Reveal>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
