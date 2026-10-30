import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { STAGE, cameraAt, type StageOptions, type StageView } from "./stage";

// The frame's view: pass the same object to Stage3D and every Label3D.
export const useStageView = (options: Omit<StageOptions, "fps">): StageView => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return cameraAt(frame, { ...options, fps });
};

// Canvas for 3D hero scenes: fills the visual region on the 540 column. The camera
// never moves; the scene groups do (see stage.ts projectToScreen). Animate only from
// useCurrentFrame(), never R3F useFrame().
export const Stage3D: React.FC<{ view: StageView; children: React.ReactNode }> = ({
  view,
  children,
}) => (
  <ThreeCanvas
    width={STAGE.width}
    height={STAGE.height}
    camera={{ position: [0, 0, STAGE.distance], fov: STAGE.fov }}
    style={{ position: "absolute", left: STAGE.left, top: STAGE.top }}
  >
    <group
      position={[-view.pan[0] * view.zoom, -view.pan[1] * view.zoom, 0]}
      scale={view.zoom}
    >
      <group rotation={view.rotation}>{children}</group>
    </group>
  </ThreeCanvas>
);
