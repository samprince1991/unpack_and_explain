import { useVideoConfig } from "remotion";
import { layout } from "../brand/layout";

const CLIP_ID = "visual-region-clip";

// Full-frame SVG in frame coordinates (1080x1920), clipped to the visual region,
// so scene drawings can never spill into captions or Instagram UI zones.
export const SceneCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useVideoConfig();
  const { visual } = layout.regions;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", left: 0, top: 0, width, height }}
    >
      <defs>
        <clipPath id={CLIP_ID}>
          <rect
            x={layout.column.x}
            y={visual.top}
            width={layout.column.width}
            height={visual.bottom - visual.top}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${CLIP_ID})`}>{children}</g>
    </svg>
  );
};
