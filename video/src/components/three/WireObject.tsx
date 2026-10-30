import { Edges } from "@react-three/drei";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../../brand/motion";
import { FILL, line, type LineRole } from "./materials";
import type { Vec3 } from "./stage";

export type WireShape = "box" | "cylinder" | "slab" | "card" | "phone";

// Default sizes (scene units): card is ISO card ratio, phone a slim slab.
const SIZES: Record<WireShape, Vec3> = {
  box: [1, 1, 1],
  cylinder: [1, 1, 1],
  slab: [1.6, 0.12, 1.2],
  card: [1.6, 1, 0.04],
  phone: [1, 2, 0.12],
};

type WireObjectProps = {
  shape: WireShape;
  size?: Vec3;
  position?: Vec3;
  rotation?: Vec3;
  // Non-uniform scale, e.g. a bar rising (keep > 0).
  scale?: Vec3;
  role?: LineRole;
  // Frame the object scales and fades in.
  drawAt?: number;
  opacity?: number;
};

// A primitive as line art: dark solid fill (hides back edges) + token-colored edges.
export const WireObject: React.FC<WireObjectProps> = ({
  shape,
  size = SIZES[shape],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  role = "stroke",
  drawAt = 0,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [drawAt, drawAt + durations.enter], [0, 1], {
    ...clamp,
    easing: ease.out,
  });
  const grow = 0.85 + 0.15 * p;
  const alpha = p * opacity;
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={[scale[0] * grow, scale[1] * grow, scale[2] * grow]}
      visible={alpha > 0}
    >
      {shape === "cylinder" ? (
        // 16 sides: facets show as a few vertical lines, like a hand-drawn can.
        <cylinderGeometry args={[size[0] / 2, size[0] / 2, size[1], 16]} />
      ) : (
        <boxGeometry args={size} />
      )}
      <meshBasicMaterial
        color={FILL}
        transparent
        opacity={alpha}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
      <Edges threshold={15} {...line(role)} transparent opacity={alpha} />
    </mesh>
  );
};
