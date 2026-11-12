import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";

// Top-down, nose up. The mast is the turning point.
const MAST = { x: 540, y: 790 };
const DISC = 330;
const TWIST = 16; // degrees the body swings (exaggerated so it reads)
const TAIL_Y = 1150;

const arcPath = (r: number, from: number, to: number) => {
  const p = (a: number) => {
    const t = ((a - 90) * Math.PI) / 180;
    return `${MAST.x + r * Math.cos(t)} ${MAST.y + r * Math.sin(t)}`;
  };
  return `M ${p(from)} A ${r} ${r} 0 0 ${to > from ? 1 : 0} ${p(to)}`;
};

// The same helicopter from above. The rotor turns anticlockwise (soft arrow on the rim). "Twists
// the body the other way": the body swings clockwise, an amber curved arrow beside it. "Tail
// rotor ... pushes sideways": the tail rotor turns amber with a push arrow off the tail, and the
// body swings back, the nose held straight.
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const twists = useCue("twists", 0.2);
  const tail = useCue("tail", 0.6);
  const pushes = useCue("pushes", 0.7);
  const straight = useCue("straight", 0.9);
  const swing =
    interpolate(frame, [twists, twists + 24], [0, TWIST], { ...clamp, easing: ease.smooth }) -
    interpolate(frame, [pushes, pushes + 24], [0, TWIST], { ...clamp, easing: ease.smooth });
  const spin = -frame * 9;
  const tailOn = interpolate(frame, [tail, tail + 8], [0, 1], { ...clamp, easing: ease.smooth });
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="payoff-33-far">
        <DustField seed="payoff-33" count={22} />
      </Parallax>
      <Parallax depth={1} seed="payoff-33-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Rotor disc">
              <circle cx={MAST.x} cy={MAST.y} r={DISC} fill="none" stroke={colors.diagram.faint} strokeWidth={3} strokeDasharray="10 12" />
              <path d={arcPath(DISC + 34, 40, -30)} fill="none" stroke={colors.diagram.soft} strokeWidth={5} strokeLinecap="round" />
              <path
                d={`M ${MAST.x + (DISC + 34) * Math.cos((-120 * Math.PI) / 180)} ${MAST.y + (DISC + 34) * Math.sin((-120 * Math.PI) / 180)} l -6 -26 l 26 8`}
                fill="none"
                stroke={colors.diagram.soft}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Interactive.G>
            <Interactive.G name="Body" style={{ rotate: `${swing}deg`, transformOrigin: `${MAST.x}px ${MAST.y}px` }}>
              <path
                d={`M ${MAST.x - 12} ${MAST.y + 100} L ${MAST.x - 7} ${TAIL_Y} L ${MAST.x + 7} ${TAIL_Y} L ${MAST.x + 12} ${MAST.y + 100} Z`}
                fill={colors.diagram.fill}
                stroke={colors.diagram.stroke}
                strokeWidth={5}
                strokeLinejoin="round"
              />
              <ellipse cx={MAST.x} cy={MAST.y - 20} rx={86} ry={130} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={6} />
              <path
                d={`M ${MAST.x - 70} ${MAST.y - 70} Q ${MAST.x} ${MAST.y - 120} ${MAST.x + 70} ${MAST.y - 70}`}
                fill="none"
                stroke={colors.diagram.soft}
                strokeWidth={4}
              />
              <line x1={MAST.x - 30} y1={TAIL_Y - 10} x2={MAST.x - 30} y2={TAIL_Y + 44} stroke={colors.diagram.stroke} strokeWidth={8} strokeLinecap="round" />
              <line
                x1={MAST.x - 30}
                y1={TAIL_Y - 10}
                x2={MAST.x - 30}
                y2={TAIL_Y + 44}
                stroke={colors.amber[500]}
                strokeWidth={8}
                strokeLinecap="round"
                opacity={tailOn}
              />
              <Reveal at={pushes} exitAt={straight + 30}>
                <path
                  d={`M ${MAST.x + 24} ${TAIL_Y + 16} L ${MAST.x + 150} ${TAIL_Y + 16} M ${MAST.x + 126} ${TAIL_Y - 6} L ${MAST.x + 150} ${TAIL_Y + 16} L ${MAST.x + 126} ${TAIL_Y + 38}`}
                  fill="none"
                  stroke={colors.amber[500]}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Blades" style={{ rotate: `${spin}deg`, transformOrigin: `${MAST.x}px ${MAST.y}px` }}>
              <line x1={MAST.x - DISC} y1={MAST.y} x2={MAST.x + DISC} y2={MAST.y} stroke={colors.diagram.stroke} strokeWidth={10} strokeLinecap="round" />
              <circle cx={MAST.x} cy={MAST.y} r={18} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={5} />
            </Interactive.G>
            <Interactive.G name="Twist arrow">
              <Reveal at={twists} exitAt={tail}>
                <path d={arcPath(190, 150, 215)} fill="none" stroke={colors.amber[500]} strokeWidth={8} strokeLinecap="round" />
                <path
                  d={`M ${MAST.x + 190 * Math.cos((125 * Math.PI) / 180)} ${MAST.y + 190 * Math.sin((125 * Math.PI) / 180)} l 30 -2 l -8 28`}
                  fill="none"
                  stroke={colors.amber[500]}
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Reveal>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
