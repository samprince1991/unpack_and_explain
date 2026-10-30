import { ArrowUp } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { fonts, weights } from "../../brand/fonts";
import { durations } from "../../brand/motion";
import { colors, typeScale } from "../../brand/tokens";
import { LineIcon } from "../icons/LineIcon";
import { enterProgress } from "../motion/progress";

type ChatBoxProps = {
  // Center of the box, frame coordinates.
  x: number;
  y: number;
  width: number;
  // What the user types. Keep it short: one line at label size.
  text: string;
  // Local frame the box appears; typing starts once it has settled.
  at: number;
  framesPerChar?: number;
  // Send button turns amber once typing ends (the "go" moment).
  accentSend?: boolean;
};

const HEIGHT = 120;
const CARET_BLINK = 16;

// UI mock style: a chat input with a message typing itself in. SVG, for use inside
// SceneCanvas. The box is neutral; only the send button may be the amber key element.
export const ChatBox: React.FC<ChatBoxProps> = ({
  x,
  y,
  width,
  text,
  at,
  framesPerChar = 1.2,
  accentSend = true,
}) => {
  const frame = useCurrentFrame();
  const t = enterProgress(frame, at);
  if (t <= 0) {
    return null;
  }
  const typeFrom = at + durations.enter;
  const chars = Math.max(0, Math.min(text.length, Math.floor((frame - typeFrom) / framesPerChar)));
  const done = chars >= text.length;
  const left = x - width / 2;
  const caretOn = !done || Math.floor((frame - typeFrom) / CARET_BLINK) % 2 === 0;
  const send = { x: left + width - HEIGHT / 2, y };

  return (
    <g opacity={t} style={{ translate: `0px ${(1 - t) * 16}px` }}>
      <rect
        x={left}
        y={y - HEIGHT / 2}
        width={width}
        height={HEIGHT}
        rx={HEIGHT / 2}
        fill={colors.diagram.fill}
        stroke={colors.diagram.soft}
        strokeWidth={3}
      />
      <text
        x={left + 50}
        y={y}
        dominantBaseline="central"
        fontFamily={fonts.body}
        fontWeight={weights.bodyMedium}
        fontSize={typeScale.label}
        fill={colors.text.primary}
      >
        {text.slice(0, chars)}
        <tspan fill={colors.diagram.soft} opacity={caretOn ? 1 : 0}>
          |
        </tspan>
      </text>
      <circle
        cx={send.x}
        cy={send.y}
        r={HEIGHT / 2 - 16}
        fill="none"
        stroke={done && accentSend ? colors.amber[500] : colors.diagram.faint}
        strokeWidth={3}
      />
      <LineIcon icon={ArrowUp} x={send.x} y={send.y} size={48} accent={done && accentSend} />
    </g>
  );
};
