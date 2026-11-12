import { AbsoluteFill } from "remotion";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";

// Blender, over the coast world's grass (beats in script.ts `blender.mechanism`): close on the
// swashplate, the still lower plate amber, then the spinning upper one; the whole plate rises
// and the pitch links stretch; out to the blades, which pitch up together, and the helicopter
// climbs under a lift arrow; back to the plate, which tilts forward; from above, an arc over the
// rear of the blade circle where the blades rise, the rotor tilts, and the helicopter noses
// down and moves forward, wide. No labels: the voice-over names every step.
export const MechanismScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <BlenderClip clip="mechanism" />
      <BlenderLabels clip="mechanism" />
    </AbsoluteFill>
  );
};
