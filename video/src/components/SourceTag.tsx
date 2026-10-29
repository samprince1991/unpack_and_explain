import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";

export const SourceTag: React.FC<{ source: string }> = ({ source }) => {
  const frame = useCurrentFrame();
  const { source: region } = layout.regions;

  return (
    <Interactive.Div
      name="Source"
      style={{
        position: "absolute",
        left: layout.column.x,
        top: region.top,
        width: layout.column.width,
        height: region.bottom - region.top,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.body,
        fontWeight: weights.bodyMedium,
        fontSize: typeScale.source,
        color: colors.text.muted,
        opacity: interpolate(frame, [0, durations.enter], [0, 1], clamp),
      }}
    >
      {`Source: ${source}`}
    </Interactive.Div>
  );
};
