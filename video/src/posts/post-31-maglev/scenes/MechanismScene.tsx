import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";

// Blender 3D cutaway on the raised guideway (beats in script.ts `blender.mechanism`): the shell
// and near wall drop away, close on the front magnet, then the coil beside it as the car eases
// back and speeds past, current running round its two loops; wide on the push arrows; they
// fade and the car settles onto its rubber wheels, "150 km/h (93 mph)" pinned to the bogie.
export const MechanismScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <BlenderClip clip="mechanism" />
      <BlenderLabels clip="mechanism" />
    </AbsoluteFill>
  );
};
