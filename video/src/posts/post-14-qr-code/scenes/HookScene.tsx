import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";

// The QR code on the cafe table, tilted; the three corner squares turn amber on "squares"
// and the code turns upright on "way" (beats in script.ts `blender.hook`). No text: the VO says it.
export const HookScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <DustField seed="hook-14" />
      <BlenderClip clip="hook" />
    </AbsoluteFill>
  );
};
