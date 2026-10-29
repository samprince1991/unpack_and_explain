import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";

// F posts: rendered by the Reel template over the failure section.
export const FailureBadge: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        left: layout.column.x,
        top: layout.regions.visual.top,
        width: layout.column.width,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Interactive.Div
        name="Failure badge"
        style={{
          padding: "10px 32px",
          borderRadius: 999,
          background: colors.coral,
          color: colors.bg.base,
          fontFamily: fonts.heading,
          fontWeight: weights.heading,
          fontSize: typeScale.label,
          letterSpacing: 2,
          scale: interpolate(frame, [0, durations.enter], [0.6, 1], { ...clamp, easing: ease.pop }),
        }}
      >
        WHEN IT FAILED
      </Interactive.Div>
    </div>
  );
};
