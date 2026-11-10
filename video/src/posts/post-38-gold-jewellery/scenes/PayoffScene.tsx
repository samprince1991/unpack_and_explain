import { AbsoluteFill, Interactive } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { colors, typeScale } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { ShareGrid } from "../../../components/styles/ShareGrid";
import { useCue, useSection } from "../../../templates/SectionContext";

const CX = 540;

// The stamp inside the band reads "22K916", 916 in amber; then a 1,000-cell grid fills 916
// cells amber on "means": the other 84 stay neutral, the copper and silver.
export const PayoffScene: React.FC = () => {
  const { durationInFrames } = useSection();
  const stamp = useCue("stamp", 0.1);
  const means = useCue("means", 0.6);
  return (
    <AbsoluteFill>
      <DustField seed="payoff-38" count={18} />
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <Interactive.G name="Stamp inside the band">
            <Reveal at={stamp}>
              <rect
                x={CX - 270}
                y={460}
                width={540}
                height={150}
                rx={75}
                fill={colors.diagram.fill}
                stroke={colors.diagram.stroke}
                strokeWidth={5}
              />
              <text
                x={CX}
                y={562}
                textAnchor="middle"
                fontFamily={fonts.heading}
                fontWeight={weights.heading}
                fontSize={typeScale.title}
                fill={colors.diagram.soft}
                letterSpacing={6}
              >
                22K<tspan fill={colors.amber[500]}>916</tspan>
              </text>
            </Reveal>
          </Interactive.G>
          <Interactive.G name="916 of 1,000">
            <ShareGrid cx={CX} cy={930} cell={15} gap={4} cols={40} rows={25} share={916} at={stamp + 10} highlightAt={means} />
          </Interactive.G>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
