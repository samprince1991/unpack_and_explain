import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Ping } from "../../../components/motion/Ping";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";
import { CraftSide } from "./craft";

const WATER = 880;
const LIFT = 46;
const water = (y: number) =>
  Array.from({ length: 21 }, (_, i) => `${i === 0 ? "M" : "L"} ${170 + i * 37} ${y + (i % 2 ? -8 : 8)}`).join(" ");

// One subject: the same side-view hovercraft over the water. It lifts clear on "touches"
// and the empty gap under the skirt turns amber; on "solid" a pulse marks the gap,
// where nothing holds it up.
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const touches = useCue("touches", 0.25);
  const solid = useCue("solid", 0.65);
  const lift = interpolate(frame, [touches - 8, touches + 16], [0, LIFT], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-27-far">
        <DustField seed="setup-27" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-27-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Hovercraft over the water">
              <Reveal at={0}>
                <path d={water(WATER)} fill="none" stroke={colors.diagram.soft} strokeWidth={5} strokeLinejoin="round" />
                <CraftSide cx={540} ground={WATER - 10} scale={1.2} lift={lift} accentGap={frame >= touches} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Nothing solid under it">
              <Ping x={540} y={WATER - 10 - LIFT / 2} at={solid} rings={2} from={10} to={90} />
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
