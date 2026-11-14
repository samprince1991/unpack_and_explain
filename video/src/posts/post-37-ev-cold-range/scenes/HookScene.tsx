import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";

// The car already X-rayed in the snowy car park; on "heater" the amber dot runs from the
// battery up the heat cable and the camera follows it to the heater (beats in script.ts
// `blender.hook`). No text: the VO says it, and the template adds the hook title.
export const HookScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <DustField seed="hook-37" />
      <BlenderClip clip="hook" />
    </AbsoluteFill>
  );
};
