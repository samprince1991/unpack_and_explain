import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { Gauge } from "../../../components/styles/Gauge";
import { WaveProfile } from "../../../components/styles/WaveProfile";
import { useCue, useSection } from "../../../templates/SectionContext";
import { BOW, GAUGE } from "./wave";

// A plain bow (no bulb) shoves water aside: on "piles" the water bunches up into a crest
// at the bow (amber on "wave"); on "fuel" the crest hands the amber to a fuel gauge
// whose needle drops.
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const piles = useCue("piles", 0.3);
  const wave = useCue("wave", 0.45);
  const fuel = useCue("fuel", 0.85);
  const crest = interpolate(frame, [piles, piles + 24], [0.15, 1], { ...clamp, easing: ease.smooth });
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-26-far">
        <DustField seed="setup-26" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-26-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Bow pushing water">
              <WaveProfile box={BOW} crest={crest} crestAccent={frame >= wave && frame < fuel} />
            </Interactive.G>
            <Interactive.G name="Fuel gauge">
              <Reveal at={fuel - 6}>
                <Gauge {...GAUGE} at={fuel - 6} levels={[[fuel, 0.85], [fuel + 30, 0.3]]} />
              </Reveal>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
