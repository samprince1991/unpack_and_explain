import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";

// Blender 3D hero: close on the bulb, the two waves rise out of step, then sink away as
// they cancel and the camera pulls back on the calm waterline (beats in script.ts `blender`).
export const MechanismScene: React.FC = () => (
  <AbsoluteFill>
    <BlenderClip clip="mechanism" />
    <BlenderLabels clip="mechanism" />
  </AbsoluteFill>
);
