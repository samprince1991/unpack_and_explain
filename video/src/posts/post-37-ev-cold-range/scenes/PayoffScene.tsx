import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";
import { Car } from "../car";

const BAR = { x: 180, y: 600, w: 720, h: 72 }; // inset, so the camera push never clips its rounded ends
const LEFT = 0.59; // AAA: a 100-mile car went about 59 miles
const GROUND = 1170;
const CAR_SCALE = 0.9;
const CAR_X = 370;
// The charge flap on the car's rear fender (car.tsx coordinates, traced from the model).
const PORT = { x: CAR_X + 64 * CAR_SCALE, y: GROUND - 128 * CAR_SCALE };
const POST = { x: 190, y: 930, w: 80, h: GROUND - 930 };

// Two stacked parts, so nothing crosses. Top: the range as a bar, "-7 °C (20 °F)" over it on
// "minus"; on "lost" it shrinks to 59% (amber: the result), "100 mi -> 59 mi (161 -> 95 km)"
// under it. Bottom: the same car, big, on the ground the whole time; on "Tip" a charging post
// stands up beside it, and on "plugged" its cable draws across to the car's charge flap, the
// plug amber (the bar goes neutral, so there's one amber at a time).
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const minus = useCue("minus", 0.12);
  const lost = useCue("lost", 0.5);
  const tip = useCue("Tip", 0.7);
  const plugged = useCue("plugged", 0.9);
  const fill = interpolate(frame, [lost, lost + 24], [1, LEFT], { ...clamp, easing: ease.smooth });
  const plugKey = interpolate(frame, [plugged + 8, plugged + 20], [0, 1], { ...clamp, easing: ease.smooth });
  const cableFrom = { x: POST.x + POST.w, y: POST.y + 120 };
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="payoff-37-far">
        <DustField seed="payoff-37" count={22} />
      </Parallax>
      <Parallax depth={1} seed="payoff-37-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Temperature">
              <Reveal at={minus}>
                <text
                  x={540}
                  y={530}
                  textAnchor="middle"
                  fontFamily={fonts.body}
                  fontWeight={weights.bodySemibold}
                  fontSize={typeScale.label}
                  fill={colors.text.primary}
                >
                  -7 °C (20 °F)
                </text>
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Range bar">
              <Reveal at={0}>
                <rect x={BAR.x} y={BAR.y} width={BAR.w} height={BAR.h} rx={BAR.h / 2} fill="none" stroke={colors.diagram.faint} strokeWidth={5} strokeDasharray="14 12" />
                <rect x={BAR.x} y={BAR.y} width={BAR.w * fill} height={BAR.h} rx={BAR.h / 2} fill={colors.diagram.soft} />
                <rect x={BAR.x} y={BAR.y} width={BAR.w * fill} height={BAR.h} rx={BAR.h / 2} fill={colors.amber[500]} opacity={1 - plugKey} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Range numbers">
              <Reveal at={lost + 10}>
                <text
                  x={540}
                  y={BAR.y + BAR.h + 80}
                  textAnchor="middle"
                  fontFamily={fonts.body}
                  fontWeight={weights.bodySemibold}
                  fontSize={typeScale.label}
                  fill={colors.text.primary}
                >
                  100 mi → 59 mi (161 → 95 km)
                </text>
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Ground">
              <line x1={100} y1={GROUND} x2={980} y2={GROUND} stroke={colors.diagram.faint} strokeWidth={5} strokeLinecap="round" />
            </Interactive.G>
            <Interactive.G name="Car">
              <Reveal at={0}>
                <Car x={CAR_X} y={GROUND} scale={CAR_SCALE} motor={false} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Charging post">
              <Reveal at={tip} dy={30}>
                <g>
                  <rect x={POST.x} y={POST.y} width={POST.w} height={POST.h} rx={16} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={6} />
                  <rect x={POST.x + 16} y={POST.y + 24} width={POST.w - 32} height={40} rx={6} fill="none" stroke={colors.diagram.soft} strokeWidth={4} />
                </g>
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Cable and plug">
              <DrawPath
                d={`M ${cableFrom.x} ${cableFrom.y} C ${cableFrom.x + 60} ${GROUND - 20} ${PORT.x - 70} ${GROUND - 30} ${PORT.x - 18} ${PORT.y + 6}`}
                at={plugged}
                frames={12}
                color={colors.diagram.soft}
                width={7}
              />
              <Reveal at={plugged + 8}>
                <g>
                  <rect x={PORT.x - 24} y={PORT.y - 14} width={34} height={30} rx={8} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={5} />
                  <rect x={PORT.x - 24} y={PORT.y - 14} width={34} height={30} rx={8} fill={colors.amber[500]} opacity={plugKey} />
                </g>
              </Reveal>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
