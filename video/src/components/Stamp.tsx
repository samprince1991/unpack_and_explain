import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";

// Q posts: MYTH (coral) and FACT (teal). Wrap in a <Sequence from={cue}>.
export const Stamp: React.FC<{ kind: "myth" | "fact" }> = ({ kind }) => {
  const frame = useCurrentFrame();
  const color = kind === "myth" ? colors.coral : colors.teal[400];

  return (
    <Interactive.Div
      name="Stamp"
      style={{
        display: "inline-block",
        padding: "12px 40px",
        border: `8px solid ${color}`,
        borderRadius: 16,
        color,
        fontFamily: fonts.heading,
        fontWeight: weights.heading,
        fontSize: typeScale.title,
        letterSpacing: 6,
        rotate: "-8deg",
        opacity: interpolate(frame, [0, 4], [0, 1], clamp),
        scale: interpolate(frame, [0, durations.enter], [1.6, 1], { ...clamp, easing: ease.pop }),
      }}
    >
      {kind === "myth" ? "MYTH" : "FACT"}
    </Interactive.Div>
  );
};
