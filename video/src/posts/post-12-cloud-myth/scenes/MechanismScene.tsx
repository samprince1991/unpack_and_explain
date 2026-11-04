import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";

// Blender 3D hero: the photo runs down the feed cable to a rack and a drive, copies travel
// to the two other sites, then the hall loses power and site 2 takes over (beats in script.ts `blender`).
export const MechanismScene: React.FC = () => (
  <AbsoluteFill>
    <BlenderClip clip="mechanism" />
    <BlenderLabels clip="mechanism" />
  </AbsoluteFill>
);
