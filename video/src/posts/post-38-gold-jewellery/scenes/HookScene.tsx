import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";

// Close on the finished gold ring on "gold", then the amber dot carries the camera to the
// wax ring on its sprue on "wax" (beats in script.ts `blender.hook`). No text: the VO says it.
export const HookScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <DustField seed="hook-38" />
      <BlenderClip clip="hook" />
    </AbsoluteFill>
  );
};
