import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";

// Blender 3D hero: wide on the rack, each weight lifts forward in close-up as it's named,
// its share written on it in 2D. The dial drops away for the close-ups and returns with the
// final wide, as all five settle (beats in script.ts).
export const MechanismScene: React.FC = () => (
  <AbsoluteFill>
    <BlenderClip clip="mechanism" />
    <BlenderLabels clip="mechanism" onPart={{ dy: 34 }} />
  </AbsoluteFill>
);
