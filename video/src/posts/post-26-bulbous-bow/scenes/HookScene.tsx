import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";

// Above the water on the whole bow, then the camera dips down to the bulb, amber on "bump"
// (beats in script.ts `blender.hook`).
export const HookScene: React.FC = () => (
  <AbsoluteFill>
    <DustField seed="hook-26" />
    <BlenderClip clip="hook" />
  </AbsoluteFill>
);
