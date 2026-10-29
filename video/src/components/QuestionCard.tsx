import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";
import { typeScale } from "../brand/tokens";
import { HighlightedText } from "./HighlightedText";

// Opening card of every reel: asks the viewer about the topic. Visible from frame 0
// (no fade-in), only a subtle settle. Captions are hidden here; the card is the text.
export const QuestionCard: React.FC<{ question: string; topic: string }> = ({
  question,
  topic,
}) => {
  const frame = useCurrentFrame();
  const { visual } = layout.regions;

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
        <div>
          <HighlightedText text={question} highlight={topic} />
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
