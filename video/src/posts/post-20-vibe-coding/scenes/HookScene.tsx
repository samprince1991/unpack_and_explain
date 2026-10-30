import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { Float } from "../../../components/motion/Float";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { ChatBox } from "../../../components/styles/ChatBox";
import { CodeBlock } from "../../../components/styles/CodeBlock";
import { useCue } from "../../../templates/SectionContext";

// A one-line request types itself in; the code it produces streams out below and blurs
// away on "read ... code": you never read it.
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const code = useCue("you", 0.3);
  const read = useCue("read", 0.5);
  const blurEnd = useCue("build", 0.8);
  const blur = interpolate(frame, [read, blurEnd], [0, 10], { ...clamp, easing: ease.smooth });
  const fade = interpolate(frame, [read, blurEnd], [1, 0.35], { ...clamp, easing: ease.smooth });

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <Interactive.G name="Chat box">
          <Float seed="hook-chat">
            <ChatBox x={540} y={720} width={780} text="make me a habit tracker" at={0} accentSend={false} />
          </Float>
        </Interactive.G>
        <Interactive.G name="Code" style={{ opacity: fade, filter: `blur(${blur}px)` }}>
          <CodeBlock x={190} y={830} width={700} lines={9} at={code} seed="hook" />
        </Interactive.G>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
