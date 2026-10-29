import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";
import { HighlightedText } from "./HighlightedText";

const CHECK_SIZE = 150;

// Closing beat of every reel, before the CTA: a teal check ("correct" is a brand moment)
// and the congrats line. Captions are hidden here; the card is the text.
export const CongratsCard: React.FC<{ text: string; topic: string }> = ({ text, topic }) => {
  const frame = useCurrentFrame();
  const { visual } = layout.regions;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: layout.column.x,
          top: visual.top,
          width: layout.column.width,
          height: visual.bottom - visual.top,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 56,
        }}
      >
        <svg
          width={CHECK_SIZE}
          height={CHECK_SIZE}
          viewBox="0 0 100 100"
          style={{
            scale: interpolate(frame, [4, 4 + durations.enter], [0, 1], { ...clamp, easing: ease.pop }),
          }}
        >
          <circle cx={50} cy={50} r={46} fill={colors.teal[400]} />
          <path
            d="M29 51 L44 65 L72 36"
            fill="none"
            stroke={colors.bg.base}
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={70}
            strokeDashoffset={interpolate(frame, [12, 24], [70, 0], { ...clamp, easing: ease.out })}
          />
        </svg>
        <Interactive.Div
          name="Congrats"
          style={{
            textAlign: "center",
            fontFamily: fonts.heading,
            fontWeight: weights.heading,
            fontSize: typeScale.title,
            lineHeight: 1.2,
            textWrap: "balance",
            opacity: interpolate(frame, [0, durations.enter], [0, 1], clamp),
            translate: interpolate(frame, [0, durations.enter], ["0px 20px", "0px 0px"], {
              ...clamp,
              easing: ease.out,
            }),
          }}
        >
          <HighlightedText text={text} highlight={topic} />
        </Interactive.Div>
      </div>
    </AbsoluteFill>
  );
};
