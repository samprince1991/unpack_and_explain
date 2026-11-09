import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";

// In on the dial on "salary", then back to the whole rack with the biggest weight amber on
// "credit" (beats in script.ts `blender.hook`).
export const HookScene: React.FC = () => (
  <AbsoluteFill>
    <DustField seed="hook-07" />
    <BlenderClip clip="hook" />
  </AbsoluteFill>
);
