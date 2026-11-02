import { Bot } from "lucide-react";
import { AbsoluteFill, Interactive, useCurrentFrame } from "remotion";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { Float } from "../../../components/motion/Float";
import { Ping } from "../../../components/motion/Ping";
import { Reveal } from "../../../components/motion/Reveal";
import { Travel } from "../../../components/motion/Travel";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { ChatBox } from "../../../components/styles/ChatBox";
import { CodeBlock } from "../../../components/styles/CodeBlock";
import { useCue, useSection } from "../../../templates/SectionContext";

const CHAT = { x: 540, y: 600 };
const AGENT = { x: 420, y: 880 };
const FILES_X = 640;
const IN_PATH = `M ${AGENT.x} ${CHAT.y + 70} L ${AGENT.x} ${AGENT.y - 110}`;
const OUT_PATH = `M ${AGENT.x + 110} ${AGENT.y} L ${FILES_X - 20} ${AGENT.y}`;

// Your words go in (typed as the VO says them), an AI agent sits in the middle, files of
// code come out.
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const chatIn = useCue("vibe", 0.08);
  const make = useCue("make", 0.33);
  const and = useCue("and", 0.61);
  const agent = useCue("agent", 0.72);
  const writes = useCue("writes", 0.78);
  const all = useCue("all", 0.83);
  const code = useCue("code", 0.88);
  // Characters land between "make" and "tracker", as the VO says them.
  const framesPerChar = 1.5;

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <Interactive.G name="Request">
            <Float seed="setup-chat">
              <ChatBox
                x={CHAT.x}
                y={CHAT.y}
                width={740}
                text="make me a habit tracker"
                at={chatIn}
                typeAt={make}
                framesPerChar={framesPerChar}
                // Amber "go" once typed, then the agent becomes the one key element.
                accentSend={frame < agent}
              />
            </Float>
          </Interactive.G>
          <DrawPath d={IN_PATH} at={and} dashed />
          <Travel d={IN_PATH} at={and + 10} frames={20} repeat={Infinity} until={agent} />
          <Interactive.G name="Agent">
            <Reveal at={and}>
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
            <CodeBlock x={FILES_X} y={720} width={200} lines={4} at={writes} seed="f1" chrome={false} />
            <CodeBlock x={FILES_X} y={850} width={200} lines={4} at={all} seed="f2" chrome={false} />
            <CodeBlock x={FILES_X} y={980} width={200} lines={4} at={code} seed="f3" chrome={false} />
          </Interactive.G>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
