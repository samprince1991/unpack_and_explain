import { AbsoluteFill, useVideoConfig } from "remotion";
import { slideLayout } from "../../brand/layout";
import { colors, withAlpha } from "../../brand/tokens";

// Dev overlay: coral = the 120 px margin, solid amber line = slide center,
// dashed amber = the regions the current slide uses.
export const CarouselGuide: React.FC<{ regions: { top: number; bottom: number }[] }> = ({
  regions,
}) => {
  const { width, height } = useVideoConfig();
  const { margin, column } = slideLayout;
  const shade = withAlpha(colors.coral, 0.3);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height: margin, background: shade }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, width, height: margin, background: shade }} />
      <div style={{ position: "absolute", left: 0, top: margin, width: margin, height: height - margin * 2, background: shade }} />
      <div style={{ position: "absolute", right: 0, top: margin, width: margin, height: height - margin * 2, background: shade }} />
      <div style={{ position: "absolute", left: width / 2 - 1, top: 0, width: 2, height, background: colors.amber[300] }} />
      {regions.map((r) => (
        <div
          key={`${r.top}-${r.bottom}`}
          style={{
            position: "absolute",
            left: column.x,
            top: r.top,
            width: column.width,
            height: r.bottom - r.top,
            border: `2px dashed ${colors.amber[300]}`,
            boxSizing: "border-box",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
