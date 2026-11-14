import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";

// Blender cutaway in the snowy car park: wide, close on the battery, the amber dot to the
// drive unit ("drives the wheels") and up to the heater, the heat cable thickening on "huge
// share", then frost on the pack and its glow dying on "cold", and wide again (beats in
// script.ts `blender.mechanism`). No on-screen text: every step is in the VO.
export const MechanismScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <BlenderClip clip="mechanism" />
      <BlenderLabels clip="mechanism" />
    </AbsoluteFill>
  );
};
