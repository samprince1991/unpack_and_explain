import {
  AbsoluteFill,
  Img,
  Interactive,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { fonts, weights } from "../brand/fonts";
import { colors, typeScale, video } from "../brand/tokens";
import { useBlender } from "../templates/blender";
import { blenderFramePath } from "../templates/blenderJob";
import type { BlenderClipId } from "../templates/types";

// Soft top and bottom edges: a close-up can run past the clip area, and a hard cut
// across the part reads as a glitch.
const EDGE_FADE = 10; // % of the clip height
const edgeMask = `linear-gradient(to bottom, transparent 0%, black ${EDGE_FADE}%, black ${100 - EDGE_FADE}%, transparent 100%)`;

export type ClipArea = { x: number; y: number; width: number; height: number };

// Plays one Blender clip (RGBA PNG sequence) frame by frame. Inside a reel section the
// local frame is the clip frame (clips are as long as their section). Placed on the
// clip's own area (layout.blender) by default.
export const BlenderClip: React.FC<{
  clip: BlenderClipId;
  area?: ClipArea;
  // Freeze on one frame (e.g. a still from a clip).
  frame?: number;
  style?: React.CSSProperties;
}> = ({ clip, area: areaProp, frame: fixed, style }) => {
  const current = useCurrentFrame();
  const { postId, manifest, areas } = useBlender();
  const area = areaProp ?? areas[clip];
  const rendered = manifest?.clips[clip];
  const box: React.CSSProperties = {
    position: "absolute",
    left: area.x,
    top: area.y,
    width: area.width,
    height: area.height,
  };

  if (!rendered) {
    // Studio only: calculateReelMetadata refuses final renders with missing clips.
    return (
      <AbsoluteFill>
        <div
          style={{
            ...box,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px dashed ${colors.diagram.faint}`,
            color: colors.text.muted,
            fontFamily: fonts.body,
            fontWeight: weights.bodyMedium,
            fontSize: typeScale.source,
          }}
        >
          {`3D ${clip}: npm run blender -- ${postId}`}
        </div>
      </AbsoluteFill>
    );
  }

  const frame = Math.min(Math.max(fixed ?? current, 0), rendered.frames - 1);
  // A full-frame world has no clip edge to soften.
  const mask = area.height >= video.height ? undefined : edgeMask;
  return (
    <AbsoluteFill>
      <Interactive.Div name={`Blender ${clip}`} style={{ ...box, ...style }}>
        <Img
          src={staticFile(blenderFramePath(postId, clip, frame))}
          style={{ width: "100%", height: "100%", maskImage: mask, WebkitMaskImage: mask }}
        />
      </Interactive.Div>
    </AbsoluteFill>
  );
};
