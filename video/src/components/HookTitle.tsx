import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";

const bare = (word: string) => word.toLowerCase().replace(/[^a-z0-9']/g, "");

// Visible from frame 0 (no fade-in): only a subtle settle.
export const HookTitle: React.FC<{ text: string; highlight?: string }> = ({ text, highlight }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");

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
        scale: interpolate(frame, [0, durations.enter], [0.94, 1], { ...clamp, easing: ease.out }),
      }}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          style={{
            color:
              highlight && bare(word) === bare(highlight) ? colors.amber[500] : colors.text.primary,
          }}
        >
          {i < words.length - 1 ? `${word} ` : word}
        </span>
      ))}
    </Interactive.Div>
  );
};
