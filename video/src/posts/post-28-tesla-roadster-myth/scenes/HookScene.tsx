import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";

// The camera slides along the side of the car; the shell drops away on "compressed" and the
// air tanks (amber) show (beats in script.ts `blender.hook`). No text: the hook title is enough.
export const HookScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <DustField seed="hook-28" />
      <BlenderClip clip="hook" />
    </AbsoluteFill>
  );
};
