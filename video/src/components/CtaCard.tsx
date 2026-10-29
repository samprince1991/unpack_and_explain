import { Img, Interactive, interpolate, staticFile, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { clamp, durations, ease } from "../brand/motion";
import { brand, colors, typeScale } from "../brand/tokens";
import { SafeArea } from "./SafeArea";

// Stacked logo already contains the wordmark and tagline.
export const CtaCard: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <SafeArea justify="center">
      <Img
        name="CTA logo"
        src={staticFile("brand/stacked.svg")}
        style={{
          width: 760,
          opacity: interpolate(frame, [0, durations.enter], [0, 1], clamp),
          scale: interpolate(frame, [0, durations.enter * 1.5], [0.9, 1], {
            ...clamp,
            easing: ease.pop,
          }),
        }}
      />
      <Interactive.Div
        name="CTA handle"
        style={{
          // The stacked SVG has built-in bottom padding.
          marginTop: -130,
          fontFamily: fonts.body,
          fontWeight: weights.bodySemibold,
          fontSize: typeScale.label,
          color: colors.teal[400],
          opacity: interpolate(frame, [durations.enter, durations.enter * 2], [0, 1], clamp),
        }}
      >
        {brand.handle}
      </Interactive.Div>
    </SafeArea>
  );
};
