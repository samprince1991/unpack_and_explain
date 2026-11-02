import { AbsoluteFill, Interactive, useCurrentFrame } from "remotion";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Float } from "../../../components/motion/Float";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { Gauge } from "../../../components/styles/Gauge";
import { GlidePath } from "../../../components/styles/GlidePath";
import { useCue, useSection } from "../../../templates/SectionContext";

const FLIP_FRAMES = 8;

// The fuel gauge: units flip between kg and lb on the mix-up, then the needle drops
// below half. Then the glide: a side-view path down to the runway at Gimli.
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const pounds = useCue("pounds", 0.12);
  const calculation = useCue("calculation", 0.33);
  const less = useCue("less", 0.45);
  const glided = useCue("glided", 0.65);
  const landed = useCue("landed", 0.9);
  // Mix-up: the unit label flips kg/lb until "calculation", then stays on lb.
  const flipping = frame >= pounds && frame < calculation;
  const unit =
    frame < pounds
      ? "kg"
      : flipping
        ? Math.floor((frame - pounds) / FLIP_FRAMES) % 2 === 0
          ? "lb"
          : "kg"
        : "lb";

  return (
    <AbsoluteFill>
      <DustField seed="payoff-03" count={18} />
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <Interactive.G name="Fuel gauge">
            <Reveal at={0} exitAt={glided - 6}>
              <Float seed="gauge" amplitude={10} sway={1.5}>
                <Gauge
                  cx={540}
                  cy={860}
                  r={280}
                  levels={[
                    [0, 0.9],
                    [less, 0.9],
                    [less + 30, 0.42],
                  ]}
                  mark={0.5}
                  unit={unit}
                  // Needle trembles while the tank is still "full": the gauge is never still.
                  jitter={frame < less ? 0.015 : 0}
                />
              </Float>
            </Reveal>
          </Interactive.G>
          <Interactive.G name="Glide path">
            <Reveal at={glided}>
              <GlidePath
                from={{ x: 230, y: 560 }}
                to={{ x: 620, y: 1060 }}
                runway={200}
                at={glided}
                flyAt={glided + 6}
                flyFrames={Math.max(30, landed - glided)}
              />
            </Reveal>
          </Interactive.G>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
