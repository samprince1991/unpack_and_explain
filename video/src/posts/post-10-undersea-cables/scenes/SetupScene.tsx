import { Laptop, Satellite, Smartphone } from "lucide-react";
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
import { SeaSection, seaCable } from "../../../components/styles/SeaSection";
import { colors } from "../../../brand/tokens";
import { useCue, useSection } from "../../../templates/SectionContext";
import { SEA } from "./sea";

const PHONE = { x: 215, y: SEA.land - 70 };
const LAPTOP = { x: 865, y: SEA.land - 70 };
const SAT = { x: 540, y: 440 };
const SKY = `M ${PHONE.x} ${PHONE.y - 50} Q ${SAT.x} ${SAT.y - 140} ${LAPTOP.x} ${LAPTOP.y - 50}`;
const CABLE = seaCable(SEA);

// A message between two continents: the route through space draws, then fades
// ("almost never"); the real route dives down the coast and along the seabed.
export const SetupScene: React.FC = () => {
  const { durationInFrames } = useSection();
  const continent = useCue("continent", 0.2);
  const space = useCue("space", 0.45);
  const dive = useCue("dive", 0.62);
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-10-far">
        <DustField seed="setup-10" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-10-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <SeaSection box={SEA} at={0} />
            <Interactive.G name="Phone and laptop">
              <Reveal at={4}>
                <LineIcon icon={Smartphone} x={PHONE.x} y={PHONE.y} size={100} />
              </Reveal>
              <Reveal at={continent}>
                <LineIcon icon={Laptop} x={LAPTOP.x} y={LAPTOP.y} size={110} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Satellite route (fades)">
              <Reveal at={continent} exitAt={space + 12}>
                <Float seed="sat" amplitude={8}>
                  <LineIcon icon={Satellite} x={SAT.x} y={SAT.y} size={110} />
                </Float>
              </Reveal>
              <DrawPath d={SKY} at={continent + 6} frames={20} dashed color={colors.diagram.soft} eraseAt={space + 12} />
            </Interactive.G>
            <Interactive.G name="Seabed cable">
              <DrawPath d={CABLE} at={dive} frames={24} color={colors.diagram.stroke} width={6} />
              <Travel d={CABLE} at={dive + 10} frames={36} repeat={Infinity} r={13} color={colors.amber[500]} />
              <Ping x={LAPTOP.x} y={LAPTOP.y} at={dive + 46} from={60} to={120} />
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
