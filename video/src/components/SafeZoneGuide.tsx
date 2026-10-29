import { AbsoluteFill, useVideoConfig } from "remotion";
import { coverCrop, safeZone } from "../brand/layout";
import { colors, withAlpha } from "../brand/tokens";

// Dev overlay: coral = Instagram UI zones, dashed amber = 4:5 cover crop.
export const SafeZoneGuide: React.FC = () => {
  const { width, height } = useVideoConfig();
  const crop = coverCrop(width, height);
  const shade = withAlpha(colors.coral, 0.3);
  const middle = height - safeZone.top - safeZone.bottom;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height: safeZone.top, background: shade }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, width, height: safeZone.bottom, background: shade }} />
      <div style={{ position: "absolute", left: 0, top: safeZone.top, width: safeZone.left, height: middle, background: shade }} />
      <div style={{ position: "absolute", right: 0, top: safeZone.top, width: safeZone.right, height: middle, background: shade }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: crop.y,
          width,
          height: crop.height,
          border: `4px dashed ${colors.amber[300]}`,
          boxSizing: "border-box",
        }}
      />
    </AbsoluteFill>
  );
};
