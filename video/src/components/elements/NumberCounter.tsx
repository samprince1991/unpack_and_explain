import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../brand/motion";

// Adapted from Remotion Element charts/number-counter.
// Inline: inherits font and color from its parent, so it can sit inside a sentence.
// Counting runs from local frame `start` for `countFrames` frames.
export const NumberCounter: React.FC<{ to: number; start: number; countFrames: number }> = ({
  to,
  start,
  countFrames,
}) => {
  const frame = useCurrentFrame();
  const value = Math.round(
    interpolate(frame, [start, start + countFrames], [0, to], { ...clamp, easing: ease.out }),
  );

  return (
    <Interactive.Span
      name="Number counter"
      style={{
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value.toLocaleString("en-US")}
    </Interactive.Span>
  );
};
