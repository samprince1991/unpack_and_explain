import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { Float } from "../../../components/motion/Float";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { CodeBlock } from "../../../components/styles/CodeBlock";
import { useCue } from "../../../templates/SectionContext";

const LINES = 11;

// A window full of code streams in, then blurs away on "read ... code": you never read it.
// The chat box is saved for the setup, where the VO says what you type.
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const read = useCue("read", 0.5);
  const blurEnd = useCue("build", 0.8);
  const blur = interpolate(frame, [read, blurEnd], [0, 10], { ...clamp, easing: ease.smooth });
  const fade = interpolate(frame, [read, blurEnd], [1, 0.35], { ...clamp, easing: ease.smooth });

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <Interactive.G name="Code" style={{ opacity: fade, filter: `blur(${blur}px)` }}>
          <Float seed="hook-code">
            <CodeBlock x={190} y={680} width={700} lines={LINES} at={0} seed="hook" />
          </Float>
        </Interactive.G>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
