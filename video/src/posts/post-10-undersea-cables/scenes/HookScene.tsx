import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { layout } from "../../../brand/layout";
import { clamp, durations, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";
import { useCue } from "../../../templates/SectionContext";

// The cable builds up on the seabed (Blender); the fibers turn amber on "cable".
// Under it, the imperial conversion the VO doesn't say.
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const km = useCue("kilometers", 0.4);
  const p = interpolate(frame, [km, km + durations.enter], [0, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill>
      <DustField seed="hook-10" />
      <BlenderClip clip="hook" />
      <Interactive.Div
        name="Distance imperial"
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
        1.5 million km = 930,000 mi
      </Interactive.Div>
    </AbsoluteFill>
  );
};
