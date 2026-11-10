import { AbsoluteFill, Interactive } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { colors, typeScale } from "../../../brand/tokens";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

// Blender 3D hero in the coast world: the fan spins up, the skirt traps the air, the skirt
// drops away so the cushion shows, arrows push up on the whole hull bottom, then the skirt
// returns and air leaks out under it (beats in script.ts `blender.mechanism`).
// The one number the VO doesn't say sits in the sky above the craft, on one line.
export const MechanismScene: React.FC = () => {
  const harder = useCue("harder", 0.33);
  const whole = useCue("whole", 0.5);
  return (
    <AbsoluteFill>
      <BlenderClip clip="mechanism" />
      <BlenderLabels clip="mechanism" />
      <SceneCanvas>
        <Interactive.G name="Cushion pressure">
          <Reveal at={harder} exitAt={whole}>
            <text
              x={540}
              y={480}
              textAnchor="middle"
              fontFamily={fonts.body}
              fontWeight={weights.bodySemibold}
              fontSize={typeScale.label}
              fill={colors.text.primary}
            >
              +0.75% (765 Pa, 0.11 psi)
            </text>
          </Reveal>
        </Interactive.G>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
