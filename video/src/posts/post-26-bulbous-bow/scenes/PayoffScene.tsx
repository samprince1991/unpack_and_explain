import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { Gauge } from "../../../components/styles/Gauge";
import { WaveProfile } from "../../../components/styles/WaveProfile";
import { useCue, useSection } from "../../../templates/SectionContext";
import { BOW, GAUGE } from "./wave";

const OLD = { length: 190, radius: 52 };
const NEW = { length: 120, radius: 44 };

// The bow with its long, fast-ship bulb. A speed gauge (amber needle) drops on "slowed";
// on "swapped" the gauge leaves, the old bulb slides away and a shorter one settles in
// (the new amber key).
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const speed = useCue("speed", 0.2);
  const slowed = useCue("slowed", 0.5);
  const swapped = useCue("swapped", 0.7);
  const out = interpolate(frame, [swapped, swapped + 18], [0, 1], { ...clamp, easing: ease.smooth });
  const inn = interpolate(frame, [swapped + 10, swapped + 28], [0, 1], { ...clamp, easing: ease.out });
  const crest = interpolate(frame, [slowed, slowed + 30], [0.35, 0.6], { ...clamp, easing: ease.smooth });
  return (
    <AbsoluteFill>
      <DustField seed="payoff-26" count={18} />
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <Interactive.G name="Bow and bulbs">
            <WaveProfile
              box={BOW}
              crest={crest}
              bulbs={[
                { ...OLD, dx: out * 120, dy: out * 60, opacity: 1 - out },
                { ...NEW, dx: (1 - inn) * 60, opacity: inn, accent: true },
              ]}
            />
          </Interactive.G>
          <Interactive.G name="Speed gauge">
            <Reveal at={speed - 6} exitAt={swapped}>
              <Gauge {...GAUGE} at={speed - 6} unit="kn" levels={[[slowed, 0.85], [slowed + 30, 0.45]]} />
            </Reveal>
          </Interactive.G>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
