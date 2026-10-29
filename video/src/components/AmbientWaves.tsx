import { waves } from "@remotion/effects/waves";
import { AbsoluteFill, Solid, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../brand/tokens";

// Adapted from Remotion Element backgrounds/moving-waves: a barely-visible, slow
// full-frame texture in the two navy shades, so the IG UI bands don't read as dead space.
export const AmbientWaves: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ opacity: 0.15 }}>
      <Solid
        color={colors.bg.base}
        width={width}
        height={height}
        effects={[
          waves({
            colors: [colors.bg.base, colors.bg.raised],
            direction: "horizontal",
            thickness: 140,
            gap: 0,
            angle: 0,
            offset: frame * 0.4,
            amplitude: 22,
            wavelength: 420,
            phase: 0,
          }),
        ]}
      />
    </AbsoluteFill>
  );
};
