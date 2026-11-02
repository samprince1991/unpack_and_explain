import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { layout } from "../../../brand/layout";
import { clamp, durations, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";
import { useCue } from "../../../templates/SectionContext";

// The running engine (Blender) dies on "lost". Under it, the metric conversion of the
// altitude, which the VO doesn't say.
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const feet = useCue("feet", 0.55);
  const p = interpolate(frame, [feet, feet + durations.enter], [0, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill>
      <DustField seed="hook-03" />
      <BlenderClip clip="hook" />
      <Interactive.Div
        name="Altitude metric"
        style={{
          position: "absolute",
          left: layout.column.x,
          width: layout.column.width,
          top: layout.regions.visual.bottom - 80,
          textAlign: "center",
          fontFamily: fonts.body,
          fontWeight: weights.bodyMedium,
          fontSize: typeScale.label,
          color: colors.text.secondary,
          opacity: p,
          translate: `0 ${(1 - p) * 12}px`,
        }}
      >
        41,000 ft = 12,500 m
      </Interactive.Div>
    </AbsoluteFill>
  );
};
