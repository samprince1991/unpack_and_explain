import { Line } from "@react-three/drei";
import { useCurrentFrame } from "remotion";
import { durations } from "../../brand/motion";
import { barHeight, barX } from "./bars";
import { line } from "./materials";
import type { Vec3 } from "./stage";
import { WireObject } from "./WireObject";

type Bars3DProps = {
  values: number[];
  // The one amber column (the result).
  keyIndex?: number;
  riseAt: number;
  stagger?: number;
  maxHeight?: number;
  spacing?: number;
  width?: number;
};

// Top-center of bar i at this frame: use with Label3D for the value.
export const barTop = (i: number, frame: number, props: Bars3DProps): Vec3 => {
  const { values, riseAt, stagger = durations.stagger, maxHeight = 2, spacing = 0.6 } = props;
  const h = barHeight(i, frame, { values, maxHeight, riseAt, stagger, riseFrames: durations.draw });
  return [barX(i, values.length, spacing), h - maxHeight / 2, 0];
};

// Columns rising from a faint floor grid. The floor sits at y = -maxHeight / 2 so the
// chart is centered on the stage.
export const Bars3D: React.FC<Bars3DProps> = (props) => {
  const frame = useCurrentFrame();
  const { values, keyIndex, maxHeight = 2, spacing = 0.6, width = 0.4 } = props;
  const floor = -maxHeight / 2;
  const half = (values.length * spacing) / 2;
  const grid: Vec3[] = [];
  for (let k = -2; k <= 2; k++) {
    const d = (k * half) / 2;
    grid.push([-half, floor, d], [half, floor, d], [d, floor, -half], [d, floor, half]);
  }
  return (
    <>
      <Line points={grid} segments {...line("faint")} />
      {values.map((_, i) => {
        const top = barTop(i, frame, props);
        // A zero scale breaks the edge geometry, so keep a sliver.
        const h = Math.max(0.001, top[1] - floor);
        return (
          <WireObject
            // Bars are positional: index is their identity.
            key={i}
            shape="box"
            size={[width, 1, width]}
            position={[top[0], floor + h / 2, 0]}
            scale={[1, h, 1]}
            role={i === keyIndex ? "amber" : "stroke"}
          />
        );
      })}
    </>
  );
};
