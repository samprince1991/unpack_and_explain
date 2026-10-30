import { useCurrentFrame } from "remotion";
import { durations } from "../../brand/motion";
import { layerOffset } from "./explode";
import type { Vec3 } from "./stage";
import { WireObject, type WireShape } from "./WireObject";

export type Layer = { shape: WireShape; size?: Vec3 };

type ExplodedViewProps = {
  layers: Layer[];
  // The one amber layer (one index, so two can't be amber).
  keyIndex?: number;
  axis?: "y" | "z";
  thickness?: number;
  gap?: number;
  // Layers draw in one after another from drawAt, then separate at explodeAt.
  drawAt?: number;
  explodeAt: number;
  explodeFrames?: number;
  stagger?: number;
};

// Scene position of layer i: use with Label3D to label a layer.
export const layerPosition = (
  i: number,
  frame: number,
  {
    layers,
    axis = "y",
    thickness = 0.12,
    gap = 0.5,
    explodeAt,
    explodeFrames = 20,
    stagger = 0,
  }: ExplodedViewProps,
): Vec3 => {
  const d = layerOffset(i, frame, {
    count: layers.length,
    thickness,
    gap,
    explodeAt,
    explodeFrames,
    stagger,
  });
  return axis === "y" ? [0, d, 0] : [0, 0, d];
};

// "What's inside": a stack that pulls apart so the key layer can be seen.
export const ExplodedView: React.FC<ExplodedViewProps> = (props) => {
  const frame = useCurrentFrame();
  const { layers, keyIndex, drawAt = 0 } = props;
  return (
    <>
      {layers.map((layer, i) => (
        <WireObject
          // Layers are positional: index is their identity.
          key={i}
          shape={layer.shape}
          size={layer.size}
          position={layerPosition(i, frame, props)}
          role={i === keyIndex ? "amber" : "stroke"}
          drawAt={drawAt + i * durations.stagger}
        />
      ))}
    </>
  );
};
