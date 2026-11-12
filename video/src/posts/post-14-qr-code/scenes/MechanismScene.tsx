import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";

// Blender 3D on the cafe table: the corner squares light up and the code turns upright,
// close on one module (one bit), close on a 2 x 4 block (its bits as a label, not spoken),
// then wide: a patch of modules tears away and comes back (beats in script.ts
// `blender.mechanism`).
export const MechanismScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <BlenderClip clip="mechanism" />
      <BlenderLabels clip="mechanism" />
    </AbsoluteFill>
  );
};
