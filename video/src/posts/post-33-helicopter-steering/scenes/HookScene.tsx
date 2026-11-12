import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";

// The helicopter hovers over the grass, rotor turning; the camera rises to the rotor head and
// the two swashplate plates turn amber on "2 plates" (beats in script.ts `blender.hook`). The
// template adds the hook title.
export const HookScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <DustField seed="hook-33" />
      <BlenderClip clip="hook" />
    </AbsoluteFill>
  );
};
