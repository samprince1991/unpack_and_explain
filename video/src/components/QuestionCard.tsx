import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";
import type { QuestionStyle } from "../templates/look";
import { HighlightedText, splitHighlight } from "./HighlightedText";
import { Spotlight, Underline } from "./TopicMarks";

// Topic on its own line, big; the rest of the question smaller above and below it.
const BigTopic: React.FC<{ question: string; topic: string }> = ({ question, topic }) => {
  const parts = splitHighlight(question, topic);
  const at = parts.findIndex((p) => p.hit);
  if (at < 0) {
    return <HighlightedText text={question} highlight={topic} />;
  }
  const line = (text: string) =>
    text ? (
      <div style={{ fontSize: typeScale.title, color: colors.text.primary }}>{text}</div>
    ) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {line(parts.slice(0, at).map((p) => p.text).join(" "))}
      <div style={{ fontSize: typeScale.display, lineHeight: 1.05, color: colors.amber[500] }}>
        {parts[at].text}
      </div>
      {line(parts.slice(at + 1).map((p) => p.text).join(" "))}
    </div>
  );
};

// Opening card of every reel: asks the viewer about the topic. Visible from frame 0
// (no fade-in), only a subtle settle; the style's decoration animates around the topic.
// Captions are hidden here; the card is the text.
export const QuestionCard: React.FC<{
  question: string;
  topic: string;
  variant?: QuestionStyle;
}> = ({ question, topic, variant = "center" }) => {
  const frame = useCurrentFrame();
  const { visual } = layout.regions;
  // Marks start once the card has settled.
  const markAt = durations.enter;

  return (
    <AbsoluteFill>
      <Interactive.Div
        name="Question"
        style={{
          position: "absolute",
          left: layout.column.x,
          top: visual.top,
          width: layout.column.width,
          height: visual.bottom - visual.top,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: fonts.heading,
          fontWeight: weights.heading,
          fontSize: typeScale.question,
          lineHeight: 1.15,
          textWrap: "balance",
          scale: interpolate(frame, [0, durations.enter], [0.94, 1], { ...clamp, easing: ease.out }),
        }}
      >
        {variant === "bigTopic" ? (
          <BigTopic question={question} topic={topic} />
        ) : (
          <div>
            <HighlightedText
              text={question}
              highlight={topic}
              mark={
                variant === "underline"
                  ? (m) => <Underline start={markAt}>{m}</Underline>
                  : variant === "spotlight"
                    ? (m) => <Spotlight start={markAt}>{m}</Spotlight>
                    : undefined
              }
            />
          </div>
        )}
      </Interactive.Div>
    </AbsoluteFill>
  );
};
