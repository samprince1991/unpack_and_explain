import { Car, Ship } from "lucide-react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";
import { CraftSide } from "./craft";

const GROUND = 880;
const water = (y: number) =>
  Array.from({ length: 21 }, (_, i) => `${i === 0 ? "M" : "L"} ${170 + i * 37} ${y + (i % 2 ? -8 : 8)}`).join(" ");

// Three beats, one thing touching the surface each: a boat dragging its wake through the
// water, a car's tyres gripping the road, then the hovercraft lifting clear (the gap amber).
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const drags = useCue("drags", 0.05);
  const grips = useCue("grips", 0.38);
  const touches = useCue("touches", 0.7);
  const neither = useCue("neither", 0.85);
  const lift = interpolate(frame, [neither - 6, neither + 18], [0, 44], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-27-far">
        <DustField seed="setup-27" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-27-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Boat dragging through water">
              <Reveal at={drags - 8} exitAt={grips - 6}>
                <path d={water(GROUND)} fill="none" stroke={colors.diagram.soft} strokeWidth={5} strokeLinejoin="round" />
                <LineIcon icon={Ship} x={560} y={GROUND - 120} size={300} />
                <DrawPath d={`M 400 ${GROUND - 30} C 340 ${GROUND - 24} 290 ${GROUND - 10} 220 ${GROUND - 4}`} at={drags} color={colors.amber[500]} width={6} />
                <DrawPath d={`M 400 ${GROUND + 6} C 340 ${GROUND + 14} 290 ${GROUND + 26} 220 ${GROUND + 34}`} at={drags + 4} color={colors.amber[500]} width={6} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Car gripping the road">
              <Reveal at={grips - 6} exitAt={touches - 4}>
                <line x1={170} y1={GROUND} x2={910} y2={GROUND} stroke={colors.diagram.soft} strokeWidth={5} strokeLinecap="round" />
                <line x1={190} y1={GROUND + 40} x2={890} y2={GROUND + 40} stroke={colors.diagram.faint} strokeWidth={4} strokeDasharray="36 28" />
                <LineIcon icon={Car} x={540} y={GROUND - 115} size={300} />
                {[477, 603].map((cx) => (
                  <Reveal key={cx} at={grips} pop>
                    <ellipse cx={cx} cy={GROUND - 2} rx={30} ry={8} fill={colors.amber[500]} />
                  </Reveal>
                ))}
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Hovercraft lifting clear">
              <Reveal at={touches - 4}>
                <path d={water(GROUND)} fill="none" stroke={colors.diagram.soft} strokeWidth={5} strokeLinejoin="round" />
                <CraftSide cx={540} ground={GROUND - 10} scale={1.2} lift={lift} accentGap={frame >= neither} />
              </Reveal>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
