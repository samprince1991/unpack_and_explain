import { useVideoConfig } from "remotion";
import { slideLayout } from "../../brand/layout";

type Region = { top: number; bottom: number };

// Full-slide SVG in slide coordinates (1080x1350), clipped to one region of the column,
// so a visual can never run into the headline, body or margin.
export const SlideCanvas: React.FC<{ region: Region; children: React.ReactNode }> = ({
  region,
  children,
}) => {
  const { width, height } = useVideoConfig();
  const clipId = `slide-clip-${region.top}-${region.bottom}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", left: 0, top: 0, width, height }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect
            x={slideLayout.column.x}
            y={region.top}
            width={slideLayout.column.width}
            height={region.bottom - region.top}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{children}</g>
    </svg>
  );
};
