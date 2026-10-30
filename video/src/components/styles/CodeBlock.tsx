import { random, useCurrentFrame } from "remotion";
import { colors } from "../../brand/tokens";
import { enterProgress, stagger } from "../motion/progress";

type CodeBlockProps = {
  // Top-left of the panel, frame coordinates.
  x: number;
  y: number;
  width: number;
  lines: number;
  // Local frame the panel appears; lines follow 2 frames apart.
  at: number;
  // Different seeds give different line shapes.
  seed?: string;
  // One line in amber: the line that matters (a bug, the fix). Omit for none.
  accentLine?: number;
  // Window chrome (three dots). Off for a bare stack of lines.
  chrome?: boolean;
};

const LINE_GAP = 34;
const LINE_HEIGHT = 14;
const PAD = 36;
const CHROME = 50;

export const codeBlockHeight = (lines: number, chrome = true) =>
  (chrome ? CHROME : PAD) + lines * LINE_GAP + PAD / 2;

// UI mock style: code drawn as abstract lines (never readable text) for a file, an
// editor or "lots of code".
export const CodeBlock: React.FC<CodeBlockProps> = ({
  x,
  y,
  width,
  lines,
  at,
  seed = "code",
  accentLine,
  chrome = true,
}) => {
  const frame = useCurrentFrame();
  const panel = enterProgress(frame, at);
  if (panel <= 0) {
    return null;
  }
  const top = y + (chrome ? CHROME : PAD);
  return (
    <g opacity={panel}>
      <rect
        x={x}
        y={y}
        width={width}
        height={codeBlockHeight(lines, chrome)}
        rx={24}
        fill={colors.diagram.fill}
        stroke={colors.diagram.faint}
        strokeWidth={3}
      />
      {chrome
        ? [0, 1, 2].map((i) => (
            <circle key={i} cx={x + 34 + i * 26} cy={y + 28} r={7} fill={colors.diagram.faint} />
          ))
        : null}
      {Array.from({ length: lines }, (_, i) => {
        const indent = Math.floor(random(`${seed}-indent-${i}`) * 3) * 36;
        const w = (0.3 + random(`${seed}-w-${i}`) * 0.5) * (width - PAD * 2 - indent);
        const t = enterProgress(frame, stagger(at, i, 2), 8);
        return (
          <rect
            key={i}
            x={x + PAD + indent}
            y={top + i * LINE_GAP}
            width={w * t}
            height={LINE_HEIGHT}
            rx={LINE_HEIGHT / 2}
            fill={
              i === accentLine
                ? colors.amber[500]
                : i % 3 === 0
                  ? colors.diagram.soft
                  : colors.diagram.faint
            }
          />
        );
      })}
    </g>
  );
};
