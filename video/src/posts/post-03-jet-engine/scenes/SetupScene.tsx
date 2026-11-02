import { Flame, Fuel } from "lucide-react";
import { AbsoluteFill, Interactive } from "remotion";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Float } from "../../../components/motion/Float";
import { Parallax } from "../../../components/motion/Parallax";
import { Ping } from "../../../components/motion/Ping";
import { Reveal } from "../../../components/motion/Reveal";
import { Travel } from "../../../components/motion/Travel";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";

const PUMP = { x: 330, y: 800 };
const FLAME = { x: 760, y: 800 };
const LINE = `M ${PUMP.x + 110} ${PUMP.y} C ${PUMP.x + 220} ${PUMP.y - 120}, ${FLAME.x - 220} ${FLAME.y + 120}, ${FLAME.x - 110} ${FLAME.y}`;

// Fuel flows into a flame that never goes out: "burns fuel without stopping".
export const SetupScene: React.FC = () => {
  const { durationInFrames } = useSection();
  const machine = useCue("machine", 0.3);
  const burns = useCue("burns", 0.55);
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-03-far">
        <DustField seed="setup-03" count={24} />
      </Parallax>
      <Parallax depth={1} seed="setup-03-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Pump">
              <Reveal at={0}>
                <Float seed="pump">
                  <LineIcon icon={Fuel} x={PUMP.x} y={PUMP.y} size={200} />
                </Float>
              </Reveal>
            </Interactive.G>
            <DrawPath d={LINE} at={machine} dashed />
            <Travel d={LINE} at={machine + 8} frames={22} repeat={Infinity} r={12} />
            <Interactive.G name="Flame">
              <Reveal at={burns} pop>
                <Float seed="flame" sway={3}>
                  <LineIcon icon={Flame} x={FLAME.x} y={FLAME.y} size={230} accent />
                </Float>
              </Reveal>
              <Ping x={FLAME.x} y={FLAME.y} at={burns} from={120} to={190} />
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
