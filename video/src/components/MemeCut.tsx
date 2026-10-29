import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { layout } from "../brand/layout";
import { clamp, durations, ease } from "../brand/motion";
import { colors, withAlpha } from "../brand/tokens";

const FADE_OUT_FRAMES = 6;

// A short meme cutaway: dims the scene and pops the meme in as a framed card inside
// the visual region. Captions and the watermark stay on top. Lasts its Sequence.
export const MemeCut: React.FC<{ file: string }> = ({ file }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { visual } = layout.regions;

  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(
          frame,
          [0, 4, durationInFrames - FADE_OUT_FRAMES, durationInFrames],
          [0, 1, 1, 0],
          clamp,
        ),
      }}
    >
      <AbsoluteFill style={{ backgroundColor: withAlpha(colors.bg.base, 0.8) }} />
      <div
        style={{
          position: "absolute",
          left: layout.column.x,
          top: visual.top,
          width: layout.column.width,
          height: visual.bottom - visual.top,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          name="Meme"
          src={staticFile(file)}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            borderRadius: 20,
            border: `4px solid ${colors.diagram.faint}`,
            rotate: "-2deg",
            scale: interpolate(frame, [0, durations.enter], [0.85, 1], { ...clamp, easing: ease.pop }),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
