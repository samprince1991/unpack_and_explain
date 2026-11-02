import { random, useCurrentFrame } from "remotion";
import { layout } from "../../brand/layout";
import { colors } from "../../brand/tokens";

// Sparse specks drifting at different depths (near = bigger, faster, brighter). Adds
// air and depth behind 2D drawings. Deterministic: same render every time.
export const DustField: React.FC<{
  count?: number;
  seed?: string;
  area?: { x: number; y: number; width: number; height: number };
}> = ({
  count = 28,
  seed = "dust",
  area = { x: 0, y: layout.regions.visual.top, width: 1080, height: layout.regions.visual.bottom - layout.regions.visual.top },
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        top: area.y,
        width: area.width,
        height: area.height,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const depth = random(`${seed}-d-${i}`);
        const speed = 0.15 + depth * 0.5;
        const x = random(`${seed}-x-${i}`) * area.width + Math.sin(frame / 60 + i) * 6 * depth;
        const y = ((random(`${seed}-y-${i}`) * area.height - frame * speed) % area.height + area.height) % area.height;
        const size = 2 + depth * 5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              backgroundColor: colors.diagram.soft,
              opacity: 0.12 + depth * 0.3,
            }}
          />
        );
      })}
    </div>
  );
};
