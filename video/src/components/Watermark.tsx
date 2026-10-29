import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";

// Doubles as the logo sting: pops in within the first second, fades out at the end
// of its Sequence.
export const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <Img
      name="Watermark"
      src={staticFile("brand/avatar.svg")}
      style={{
        position: "absolute",
        left: layout.watermark.x,
        top: layout.watermark.y,
        width: layout.watermark.width,
        scale: interpolate(frame, [0, durations.sting], [0, 1], { ...clamp, easing: ease.pop }),
        opacity: interpolate(
          frame,
          [durationInFrames - durations.crossfade, durationInFrames],
          [0.05, 0],
          clamp,
        ),
      }}
    />
  );
};
