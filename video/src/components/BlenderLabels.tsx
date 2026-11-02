import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";
import { useBlender } from "../templates/blender";
import type { BlenderClipId } from "../templates/types";
import type { ClipArea } from "./BlenderClip";

const LIFT = 110; // px between the part and its label
const HALF_WIDTH = 220; // keeps a label's box inside the column

// 2D labels pinned to Blender parts (positions projected by Blender per frame).
// Text is never rendered in 3D, so labels keep the brand fonts.
export const BlenderLabels: React.FC<{
  clip: BlenderClipId;
  area?: ClipArea;
}> = ({ clip, area: areaProp }) => {
  const frame = useCurrentFrame();
  const { manifest, areas } = useBlender();
  const area = areaProp ?? areas[clip];
  const tracks = manifest?.clips[clip]?.labels ?? [];
  const { visual } = layout.regions;
  const { column } = layout;

  return (
    <AbsoluteFill>
      {tracks.map((track, i) => {
        const at = Math.min(frame, track.points.length - 1);
        const point = track.points[at];
        if (!point) {
          return null;
        }
        const firstShown = track.points.findIndex((p) => p !== null);
        const opacity = interpolate(
          at,
          [firstShown, firstShown + durations.enter],
          [0, 1],
          {
            ...clamp,
            easing: ease.out,
          },
        );
        const px = area.x + point[0] * area.width;
        const py = area.y + point[1] * area.height;
        const x = Math.min(
          Math.max(px, column.x + HALF_WIDTH),
          column.x + column.width - HALF_WIDTH,
        );
        const y = Math.min(
          Math.max(py - LIFT, visual.top + typeScale.label),
          visual.bottom - typeScale.label,
        );
        return (
          <div key={`${track.text}-${i}`} style={{ opacity }}>
            <div
              style={{
                position: "absolute",
                left: px - 6,
                top: py - 6,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.diagram.stroke,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: x - HALF_WIDTH,
                top: y - typeScale.label,
                width: HALF_WIDTH * 2,
                textAlign: "center",
                fontFamily: fonts.body,
                fontWeight: weights.bodyMedium,
                fontSize: typeScale.label,
                color: colors.text.primary,
              }}
            >
              {track.text}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
