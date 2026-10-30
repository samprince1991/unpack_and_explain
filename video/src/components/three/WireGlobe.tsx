import { ThreeCanvas } from "@remotion/three";
import { interpolate, useCurrentFrame } from "remotion";
import { layout } from "../../brand/layout";
import { clamp, ease } from "../../brand/motion";
import { colors } from "../../brand/tokens";

type WireGlobeProps = {
  // Degrees the globe turns per second.
  spin?: number;
  // Latitude / longitude (degrees) of the amber marker, or null for none.
  marker?: { lat: number; lon: number } | null;
  // Frame the marker pops in.
  markerAt?: number;
  // Show a satellite on a tilted orbit.
  orbit?: boolean;
};

const RING = 0.006;
const MERIDIANS = 8;
const LATITUDES = [-60, -30, 0, 30, 60];
const rad = (deg: number) => (deg * Math.PI) / 180;

// 3D line-art globe in diagram colors (React Three Fiber via @remotion/three). Fills the
// visual region. Everything moves from useCurrentFrame(); never use R3F's useFrame().
// Render with --gl=angle (see CLAUDE.md).
export const WireGlobe: React.FC<WireGlobeProps> = ({
  spin = 12,
  marker = null,
  markerAt = 0,
  orbit = true,
}) => {
  const frame = useCurrentFrame();
  const width = layout.column.width;
  const height = layout.regions.visual.bottom - layout.regions.visual.top;
  const turn = rad((frame / 30) * spin);
  const markerScale = interpolate(frame, [markerAt, markerAt + 12], [0, 1], {
    ...clamp,
    easing: ease.pop,
  });
  const satAngle = frame * 0.02;

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0.5, 5], fov: 40 }}
      style={{
        position: "absolute",
        left: layout.column.x,
        top: layout.regions.visual.top,
      }}
    >
      <group rotation={[rad(18), turn, 0]}>
        {/* Solid core hides the back half of the lines, so the globe reads as 3D. */}
        <mesh>
          <sphereGeometry args={[0.99, 48, 32]} />
          <meshBasicMaterial color={colors.diagram.fill} />
        </mesh>
        {Array.from({ length: MERIDIANS }, (_, i) => (
          <mesh key={`m${i}`} rotation={[0, (i * Math.PI) / MERIDIANS, 0]}>
            <torusGeometry args={[1, RING, 6, 128]} />
            <meshBasicMaterial color={colors.diagram.faint} />
          </mesh>
        ))}
        {LATITUDES.map((lat) => (
          <mesh
            key={`l${lat}`}
            position={[0, Math.sin(rad(lat)), 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[Math.cos(rad(lat)), RING, 6, 128]} />
            <meshBasicMaterial
              color={lat === 0 ? colors.diagram.soft : colors.diagram.faint}
            />
          </mesh>
        ))}
        {marker ? (
          <mesh
            position={[
              Math.cos(rad(marker.lat)) * Math.sin(rad(marker.lon)),
              Math.sin(rad(marker.lat)),
              Math.cos(rad(marker.lat)) * Math.cos(rad(marker.lon)),
            ]}
            scale={markerScale}
          >
            <sphereGeometry args={[0.05, 24, 16]} />
            <meshBasicMaterial color={colors.amber[500]} />
          </mesh>
        ) : null}
      </group>
      {orbit ? (
        <group rotation={[rad(70), rad(-20), 0]}>
          <mesh>
            <torusGeometry args={[1.55, RING / 2, 6, 160]} />
            <meshBasicMaterial color={colors.diagram.faint} />
          </mesh>
          <mesh
            position={[Math.cos(satAngle) * 1.55, Math.sin(satAngle) * 1.55, 0]}
          >
            <boxGeometry args={[0.09, 0.09, 0.09]} />
            <meshBasicMaterial color={colors.diagram.stroke} />
          </mesh>
        </group>
      ) : null}
    </ThreeCanvas>
  );
};
