import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";

// Blender 3D hero: the cable pulls apart into its layers, then light runs to the repeater and the shore (beats in script.ts `blender`).
export const MechanismScene: React.FC = () => (
  <AbsoluteFill>
    <BlenderClip clip="mechanism" />
    <BlenderLabels clip="mechanism" />
  </AbsoluteFill>
);
