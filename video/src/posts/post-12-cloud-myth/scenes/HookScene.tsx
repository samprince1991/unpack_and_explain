import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";

// Close on the main hall (Blender), pulling back on "copies" to show all three sites.
export const HookScene: React.FC = () => (
  <AbsoluteFill>
    <DustField seed="hook-12" />
    <BlenderClip clip="hook" />
  </AbsoluteFill>
);
