import { Bot, MessageSquareText } from "lucide-react";
import { AbsoluteFill, Interactive } from "remotion";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { Float } from "../../../components/motion/Float";
import { Ping } from "../../../components/motion/Ping";
import { Reveal } from "../../../components/motion/Reveal";
import { Travel } from "../../../components/motion/Travel";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { CodeBlock } from "../../../components/styles/CodeBlock";
import { useCue, useSection } from "../../../templates/SectionContext";

const BUBBLE = { x: 260, y: 800 };
const AGENT = { x: 540, y: 800 };
const FILES_X = 720;
const IN_PATH = `M ${BUBBLE.x + 95} ${BUBBLE.y} L ${AGENT.x - 110} ${AGENT.y}`;
const OUT_PATH = `M ${AGENT.x + 110} ${AGENT.y} L ${FILES_X - 20} ${AGENT.y}`;

// Your words go in, an AI agent sits in the middle, files of code come out.
export const SetupScene: React.FC = () => {
  const { durationInFrames } = useSection();
  const agentIn = useCue("vibe", 0.08);
  const type = useCue("type", 0.28);
  const agent = useCue("agent", 0.72);
  const writes = useCue("writes", 0.78);
  const all = useCue("all", 0.83);
  const code = useCue("code", 0.88);

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <Interactive.G name="Request">
            <Reveal at={0}>
              <Float seed="setup-bubble">
                <LineIcon icon={MessageSquareText} x={BUBBLE.x} y={BUBBLE.y} size={170} />
              </Float>
            </Reveal>
          </Interactive.G>
          <DrawPath d={IN_PATH} at={type} dashed />
          <Travel d={IN_PATH} at={type + 10} frames={24} repeat={Infinity} until={agent} />
          <Interactive.G name="Agent">
            <Reveal at={agentIn}>
              <Float seed="setup-agent">
                <LineIcon icon={Bot} x={AGENT.x} y={AGENT.y} size={190} accent={false} />
              </Float>
            </Reveal>
            <Reveal at={agent} pop>
              <LineIcon icon={Bot} x={AGENT.x} y={AGENT.y} size={190} accent />
            </Reveal>
            <Ping x={AGENT.x} y={AGENT.y} at={agent} from={110} to={170} until={writes + 30} />
          </Interactive.G>
          <DrawPath d={OUT_PATH} at={writes} frames={10} dashed />
          <Interactive.G name="Files">
            <CodeBlock x={FILES_X} y={640} width={200} lines={4} at={writes} seed="f1" chrome={false} />
            <CodeBlock x={FILES_X} y={770} width={200} lines={4} at={all} seed="f2" chrome={false} />
            <CodeBlock x={FILES_X} y={900} width={200} lines={4} at={code} seed="f3" chrome={false} />
          </Interactive.G>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
