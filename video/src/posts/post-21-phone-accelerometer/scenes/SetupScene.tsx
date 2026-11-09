import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Ping } from "../../../components/motion/Ping";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { PhoneFrame } from "../../../components/styles/PhoneFrame";
import { useCue, useSection } from "../../../templates/SectionContext";

const CX = 540;
const CY = 690;
const PHONE = { width: 310, height: 600 };

// A photo on the phone's screen, square enough to fit it either way up.
const ScreenPicture: React.FC = () => (
  <g fill="none" stroke={colors.diagram.soft} strokeWidth={5} strokeLinejoin="round">
    <rect x={CX - 105} y={CY - 90} width={210} height={180} rx={14} />
    <circle cx={CX + 48} cy={CY - 38} r={20} />
    <path d={`M ${CX - 105} ${CY + 62} L ${CX - 40} ${CY - 8} L ${CX + 12} ${CY + 42} L ${CX + 48} ${CY + 12} L ${CX + 105} ${CY + 62}`} />
  </g>
);

const zigzag = (x0: number, x1: number, y: number, teeth = 5) => {
  const step = (x1 - x0) / (teeth * 2);
  const pts = Array.from({ length: teeth * 2 - 1 }, (_, i) => `L ${x0 + step * (i + 1)} ${y + (i % 2 === 0 ? -14 : 14)}`);
  return `M ${x0} ${y} ${pts.join(" ")} L ${x1} ${y}`;
};

// The phone turns sideways on "turn"; its picture follows on "follows". On "weight" the
// picture dims and the amber weight on its springs shows, with the sizes the VO doesn't say.
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const turn = useCue("turn", 0.02);
  const follows = useCue("follows", 0.38);
  const weight = useCue("weight", 0.72);
  const body = interpolate(frame, [turn + 2, turn + 22], [0, 90], { ...clamp, easing: ease.smooth });
  const picture = interpolate(frame, [follows, follows + 16], [0, -90], { ...clamp, easing: ease.smooth });
  const dim = interpolate(frame, [weight - 4, weight + 8], [1, 0.25], clamp);
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-21-far">
        <DustField seed="setup-21" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-21-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Phone turning">
              <g style={{ rotate: `${body}deg`, transformOrigin: `${CX}px ${CY}px` }}>
                <PhoneFrame x={CX} y={CY} {...PHONE}>
                  <g
                    opacity={dim}
                    style={{ rotate: `${picture}deg`, transformOrigin: `${CX}px ${CY}px` }}
                  >
                    <ScreenPicture />
                  </g>
                </PhoneFrame>
              </g>
            </Interactive.G>
            <Interactive.G name="Weight on springs">
              <Reveal at={weight - 2} dy={0}>
                <path
                  d={zigzag(CX - 130, CX - 34, CY)}
                  fill="none"
                  stroke={colors.diagram.stroke}
                  strokeWidth={5}
                  strokeLinejoin="round"
                />
                <path
                  d={zigzag(CX + 34, CX + 130, CY)}
                  fill="none"
                  stroke={colors.diagram.stroke}
                  strokeWidth={5}
                  strokeLinejoin="round"
                />
                <rect x={CX - 34} y={CY - 24} width={68} height={48} rx={8} fill={colors.amber[500]} />
              </Reveal>
              <Ping x={CX} y={CY} at={weight} from={36} to={110} />
            </Interactive.G>
            <Interactive.G name="Sizes">
              <Reveal at={weight}>
                <text
                  x={CX}
                  y={CY + 300}
                  textAnchor="middle"
                  fontFamily={fonts.body}
                  fontWeight={weights.bodySemibold}
                  fontSize={typeScale.label}
                  fill={colors.text.primary}
                >
                  Chip: 2 mm (0.08 in)
                </text>
                <text
                  x={CX}
                  y={CY + 370}
                  textAnchor="middle"
                  fontFamily={fonts.body}
                  fontWeight={weights.bodySemibold}
                  fontSize={typeScale.label}
                  fill={colors.text.primary}
                >
                  Weight: under 1 mm (0.04 in)
                </text>
              </Reveal>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
