import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";

// Animates in at local frame 0. Wrap in a <Sequence from={cue}>.
export const StepBadge: React.FC<{ n: number; label: string }> = ({ n, label }) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Step badge"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        opacity: interpolate(frame, [0, durations.enter], [0, 1], clamp),
        translate: interpolate(frame, [0, durations.enter], ["0px 24px", "0px 0px"], {
          ...clamp,
          easing: ease.out,
        }),
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          flexShrink: 0,
          borderRadius: 44,
          background: colors.teal[400],
          color: colors.bg.base,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.heading,
          fontWeight: weights.heading,
          fontSize: typeScale.label,
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: fonts.body,
          fontWeight: weights.bodyMedium,
          fontSize: typeScale.label,
          color: colors.text.primary,
        }}
      >
        {label}
      </div>
    </Interactive.Div>
  );
};
