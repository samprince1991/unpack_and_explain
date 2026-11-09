import { CircleCheck, Wallet } from "lucide-react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Ping } from "../../../components/motion/Ping";
import { Reveal } from "../../../components/motion/Reveal";
import { Travel } from "../../../components/motion/Travel";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { Gauge } from "../../../components/styles/Gauge";
import { useCue, useSection } from "../../../templates/SectionContext";

const CX = 540;
const CY = 760;
const STRIKE = `M ${CX - 190} ${CY + 130} L ${CX + 190} ${CY - 130}`;
// Today's line runs in from the left, then forks: one future repays, the other doesn't.
const PAST = `M 180 ${CY + 40} C 280 ${CY + 10}, 340 ${CY + 70}, 470 ${CY + 40}`;
const REPAYS = `M 470 ${CY + 40} C 590 ${CY + 10}, 690 ${CY - 120}, 810 ${CY - 170}`;
const MISSES = `M 470 ${CY + 40} C 590 ${CY + 70}, 690 ${CY + 180}, 810 ${CY + 220}`;
const GAUGE_Y = 900;
const SCORE_FROM = 300;
const SCORE_TO = 850;

const Score: React.FC<{ value: number }> = ({ value }) => (
  <text
    x={CX}
    y={GAUGE_Y + 150}
    textAnchor="middle"
    fontFamily={fonts.heading}
    fontWeight={weights.heading}
    fontSize={typeScale.display}
    fill={colors.text.primary}
    style={{ fontVariantNumeric: "tabular-nums" }}
  >
    {value}
  </text>
);

const DialEnd: React.FC<{ x: number; text: string }> = ({ x, text }) => (
  <text
    x={x}
    y={GAUGE_Y + 60}
    textAnchor="middle"
    fontFamily={fonts.body}
    fontWeight={weights.bodySemibold}
    fontSize={typeScale.label}
    fill={colors.text.secondary}
  >
    {text}
  </text>
);

// A wallet is struck through on "wealth"; the line of your past forks into two futures on
// "prediction", the repaying one amber on "repay"; a dial and counter sweep 300 to 850.
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const wealth = useCue("wealth", 0.12);
  const prediction = useCue("prediction", 0.2);
  const repay = useCue("repay", 0.45);
  const scores = useCue("scores", 0.65);
  const from = useCue("300", 0.75);
  const to = useCue("850", 0.83);
  const score = Math.round(
    interpolate(frame, [from, to + 14], [SCORE_FROM, SCORE_TO], { ...clamp, easing: ease.smooth }),
  );
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-07-far">
        <DustField seed="setup-07" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-07-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Wallet">
              <Reveal at={0} exitAt={prediction - 8}>
                <LineIcon icon={Wallet} x={CX} y={CY} size={360} stroke={7} />
                <DrawPath d={STRIKE} at={wealth} frames={12} color={colors.amber[500]} width={14} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Two futures">
              <Reveal at={prediction} exitAt={scores - 8} dy={0}>
                <DrawPath d={PAST} at={prediction} frames={16} width={8} />
                <DrawPath d={REPAYS} at={prediction + 14} frames={20} dashed width={6} color={colors.diagram.soft} />
                <DrawPath d={MISSES} at={prediction + 14} frames={20} dashed width={6} color={colors.diagram.faint} />
                <DrawPath d={REPAYS} at={repay} frames={14} color={colors.amber[500]} width={10} />
                <Travel d={REPAYS} at={repay} frames={14} />
              </Reveal>
              <Reveal at={repay + 10} exitAt={scores - 8}>
                <LineIcon icon={CircleCheck} x={850} y={CY - 200} size={92} />
              </Reveal>
              <Ping x={850} y={CY - 200} at={repay + 12} from={50} to={130} until={scores - 12} />
            </Interactive.G>
            <Interactive.G name="Score dial">
              <Gauge cx={CX} cy={GAUGE_Y} r={330} levels={[[from, 0], [to + 14, 1]]} at={scores} jitter={0.004} />
              <Reveal at={scores}>
                <DialEnd x={CX - 330} text={String(SCORE_FROM)} />
                <DialEnd x={CX + 330} text={String(SCORE_TO)} />
                <Score value={score} />
              </Reveal>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
