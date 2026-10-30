import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";
import type { HookStyle } from "../templates/look";
import { HighlightedText } from "./HighlightedText";
import { Underline } from "./TopicMarks";

// Word-by-word gap: tighter than durations.stagger so a 5-word title lands in under a second.
const WORD_GAP = 3;

const Words: React.FC<{ text: string; highlight?: string }> = ({ text, highlight }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const hits = new Set(
    highlight ? highlight.split(" ").map((w) => w.toLowerCase().replace(/[^a-z0-9']/g, "")) : [],
  );
  return (
    <>
      {words.map((word, i) => {
        const t = interpolate(frame, [i * WORD_GAP, i * WORD_GAP + durations.enter], [0, 1], {
          ...clamp,
          easing: ease.out,
        });
        const hit = hits.has(word.toLowerCase().replace(/[^a-z0-9']/g, ""));
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: t,
              translate: `0px ${(1 - t) * 30}px`,
              color: hit ? colors.amber[500] : colors.text.primary,
            }}
          >
            {i < words.length - 1 ? `${word} ` : word}
          </span>
        );
      })}
    </>
  );
};

// Shown when the hook section starts. Every style is fully in within ~1 s.
export const HookTitle: React.FC<{ text: string; highlight?: string; variant?: HookStyle }> = ({
  text,
  highlight,
  variant = "settle",
}) => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, durations.enter + 3], [100, 0], { ...clamp, easing: ease.out });

  const body =
    variant === "wordByWord" ? (
      <Words text={text} highlight={highlight} />
    ) : (
      <HighlightedText
        text={text}
        highlight={highlight ?? ""}
        mark={
          variant === "underline"
            ? (m) => <Underline start={durations.enter}>{m}</Underline>
            : undefined
        }
      />
    );

  return (
    <Interactive.Div
      name="Hook title"
      style={{
        position: "absolute",
        left: layout.column.x,
        top: layout.regions.visual.top,
        width: layout.column.width,
        textAlign: "center",
        fontFamily: fonts.heading,
        fontWeight: weights.heading,
        fontSize: typeScale.hook,
        lineHeight: 1.1,
        color: colors.text.primary,
        // Rise slides the title up from behind its own top edge.
        overflow: variant === "rise" ? "hidden" : undefined,
        scale:
          variant === "settle" || variant === "underline"
            ? interpolate(frame, [0, durations.enter], [0.94, 1], { ...clamp, easing: ease.out })
            : undefined,
      }}
    >
      <div style={variant === "rise" ? { translate: `0px ${rise}%` } : undefined}>{body}</div>
    </Interactive.Div>
  );
};
