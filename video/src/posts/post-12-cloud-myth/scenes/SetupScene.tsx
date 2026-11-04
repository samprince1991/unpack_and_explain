import { Cloud, Warehouse } from "lucide-react";
import { AbsoluteFill, Interactive, Sequence, useCurrentFrame } from "remotion";
import { layout } from "../../../brand/layout";
import { colors } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Float } from "../../../components/motion/Float";
import { Parallax } from "../../../components/motion/Parallax";
import { exitProgress } from "../../../components/motion/progress";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { Stamp } from "../../../components/Stamp";
import { MythSwap } from "../../../components/styles/MythSwap";
import { useCue } from "../../../templates/SectionContext";

const CLOUD_Y = 600;
const DROP = 280; // the warehouse lands at CLOUD_Y + DROP
const GROUND_Y = CLOUD_Y + DROP + 165;

const StampAt: React.FC<{ kind: "myth" | "fact"; top: number; exitAt?: number }> = ({
  kind,
  top,
  exitAt,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: layout.column.x,
        width: layout.column.width,
        top,
        textAlign: "center",
        opacity: exitProgress(frame, exitAt),
      }}
    >
      <Stamp kind={kind} />
    </div>
  );
};

// The myth: a cloud up in the sky (MYTH on "sky"). The fact: it drops to the ground as
// a warehouse, the amber key (FACT on "warehouse").
export const SetupScene: React.FC = () => {
  const sky = useCue("sky", 0.4);
  const warehouse = useCue("warehouse", 0.75);
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-12-far">
        <DustField seed="setup-12" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-12-near">
        <SceneCanvas>
          <Interactive.G name="Ground">
            <DrawPath
              d={`M 200 ${GROUND_Y} L 880 ${GROUND_Y}`}
              at={warehouse}
              frames={18}
              color={colors.diagram.faint}
              width={4}
            />
          </Interactive.G>
          <MythSwap
            x={540}
            y={CLOUD_Y}
            drop={DROP}
            at={2}
            swapAt={warehouse}
            myth={
              <Float seed="cloud-12" amplitude={10}>
                <LineIcon icon={Cloud} x={0} y={0} size={320} stroke={6} />
              </Float>
            }
            fact={<LineIcon icon={Warehouse} x={0} y={0} size={320} stroke={6} accent />}
          />
        </SceneCanvas>
      </Parallax>
      <Sequence from={sky} durationInFrames={Math.max(1, warehouse - sky + 12)} layout="none">
        <StampAt kind="myth" top={CLOUD_Y + 190} exitAt={warehouse - sky} />
      </Sequence>
      <Sequence from={warehouse + 10} layout="none">
        <StampAt kind="fact" top={GROUND_Y + 25} />
      </Sequence>
    </AbsoluteFill>
  );
};
