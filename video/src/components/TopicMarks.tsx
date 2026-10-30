import { interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../brand/motion";
import { colors } from "../brand/tokens";

// Decorations around the amber topic word. The word itself is readable from its first
// frame; only the mark animates in, starting at local frame `start`.

// Amber stroke drawn left to right under the word.
export const Underline: React.FC<{ start?: number; children: React.ReactNode }> = ({
  start = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [start, start + durations.draw], [0, 100], {
    ...clamp,
    easing: ease.out,
  });
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {children}
      <span
        style={{
          position: "absolute",
          left: 0,
          bottom: "-0.04em",
          height: "0.09em",
          width: `${width}%`,
          borderRadius: "0.05em",
          background: colors.amber[500],
        }}
      />
    </span>
  );
};

// Raised pill behind the word with a thin amber outline that settles in.
export const Spotlight: React.FC<{ start?: number; children: React.ReactNode }> = ({
  start = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [start, start + durations.enter], [0, 1], {
    ...clamp,
    easing: ease.out,
  });
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        padding: "0 0.22em",
        isolation: "isolate",
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          borderRadius: "0.3em",
          background: colors.bg.raised,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          borderRadius: "0.3em",
          border: `0.04em solid ${colors.amber[500]}`,
          opacity: t,
          scale: String(1.08 - 0.08 * t),
        }}
      />
      {children}
    </span>
  );
};
