import { Code, FolderOpen, ListChecks, Play } from "lucide-react";
import { AbsoluteFill, Series } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { colors, typeScale } from "../brand/tokens";
import { Background } from "../components/Background";
import { Travel } from "../components/motion/Travel";
import { SceneCanvas } from "../components/SceneCanvas";
import { ChatBox } from "../components/styles/ChatBox";
import { CodeBlock } from "../components/styles/CodeBlock";
import { CycleDiagram, cycleLoop } from "../components/styles/CycleDiagram";
import { PhoneFrame } from "../components/styles/PhoneFrame";

const FRAMES = 90;

const Label: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      left: layout.column.x,
      width: layout.column.width,
      top: layout.regions.captions.top,
      textAlign: "center",
      fontFamily: fonts.body,
      fontWeight: weights.bodySemibold,
      fontSize: typeScale.label,
      color: colors.text.muted,
    }}
  >
    {text}
  </div>
);

const DEMOS: { name: string; draw: React.ReactNode }[] = [
  {
    name: "ChatBox",
    draw: <ChatBox x={540} y={800} width={700} text="how does wifi work" at={0} />,
  },
  {
    name: "CodeBlock",
    draw: <CodeBlock x={190} y={560} width={700} lines={10} at={0} accentLine={4} />,
  },
  {
    name: "CycleDiagram",
    draw: (
      <>
        <CycleDiagram
          cx={540}
          cy={800}
          r={280}
          active={1}
          nodes={[
            { icon: FolderOpen, at: 0 },
            { icon: ListChecks, at: 12 },
            { icon: Code, at: 24 },
            { icon: Play, at: 36 },
          ]}
        />
        <Travel d={cycleLoop(540, 800, 280, 0, 4)} at={50} frames={36} color={colors.amber[500]} />
      </>
    ),
  },
  { name: "PhoneFrame", draw: <PhoneFrame x={540} y={800} width={440} height={760} /> },
];

// Scene style library (src/components/styles): one demo per piece.
export const KitStyles: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Series>
      {DEMOS.map((d) => (
        <Series.Sequence key={d.name} durationInFrames={FRAMES}>
          <SceneCanvas>{d.draw}</SceneCanvas>
          <Label text={d.name} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

export const kitStylesFrames = DEMOS.length * FRAMES;
