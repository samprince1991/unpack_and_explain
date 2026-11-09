import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";

// From the whole phone to the chip, through its lid, onto the weight, amber on "weight"
// (beats in script.ts `blender.hook`).
export const HookScene: React.FC = () => (
  <AbsoluteFill>
    <DustField seed="hook-21" />
    <BlenderClip clip="hook" />
  </AbsoluteFill>
);
