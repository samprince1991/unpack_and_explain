import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { QrGrid } from "../../../components/styles/QrGrid";
import { useCue, useSection } from "../../../templates/SectionContext";
import { QR_MATRIX } from "../qrMatrix";

const CX = 540;
const CY = 800;
const CELL = 25;

// One subject: the same QR code, flat. On "yes" one module lights amber (one square, one
// yes or no); on "tilted" the code tips and foreshortens, the way a camera sees it; on
// "scratched" a scratch drags across it and the amber moves to the scratch.
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const yes = useCue("yes", 0.4);
  const tilted = useCue("tilted", 0.8);
  const scratched = useCue("scratched", 0.9);
  const tilt = interpolate(frame, [tilted - 4, tilted + 14], [0, 1], { ...clamp, easing: ease.smooth });
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-14-far">
        <DustField seed="setup-14" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-14-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G
              name="Tilted code"
              style={{
                rotate: `${-13 * tilt}deg`,
                scale: `${1 - 0.08 * tilt} ${1 - 0.2 * tilt}`,
                transformOrigin: `${CX}px ${CY}px`,
              }}
            >
              <QrGrid matrix={QR_MATRIX} cx={CX} cy={CY} cell={CELL} accent={[[11, 10]]} accentAt={yes} accentExitAt={scratched} />
              <Interactive.G name="Scratch">
                <DrawPath
                  d={`M ${CX - 230} ${CY - 170} Q ${CX - 20} ${CY - 60} ${CX + 240} ${CY + 150}`}
                  at={scratched}
                  color={colors.amber[500]}
                  width={7}
                />
              </Interactive.G>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
