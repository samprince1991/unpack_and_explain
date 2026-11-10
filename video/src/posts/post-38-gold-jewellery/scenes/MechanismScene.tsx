import { AbsoluteFill, Interactive } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { colors, typeScale } from "../../../brand/tokens";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

// Blender 3D hero on the jeweller's bench: the grains melt into one pool, the wax copy of the
// ring is buried in plaster, the front half lifts away with the wax and the ring-shaped hole
// shows, the amber dot pours the gold in and the cast ring appears (beats in script.ts
// `blender.mechanism`).
// Two lines the VO doesn't say, each on one line above the model: the karat maths, and the
// kiln temperature in both units.
export const MechanismScene: React.FC = () => {
  const karat = useCue("karat", 0.3);
  const copy = useCue("copy", 0.48);
  const kiln = useCue("kiln", 0.7);
  const molten = useCue("molten", 0.86);
  return (
    <AbsoluteFill>
      <BlenderClip clip="mechanism" />
      <BlenderLabels clip="mechanism" />
      <SceneCanvas>
        <Interactive.G name="Karat maths">
          <Reveal at={karat} exitAt={copy}>
            <text
              x={540}
              y={480}
              textAnchor="middle"
              fontFamily={fonts.body}
              fontWeight={weights.bodySemibold}
              fontSize={typeScale.label}
              fill={colors.text.primary}
            >
              22k = 22/24 = 91.6% gold
            </text>
          </Reveal>
        </Interactive.G>
        <Interactive.G name="Kiln temperature">
          <Reveal at={kiln} exitAt={molten}>
            <text
              x={540}
              y={480}
              textAnchor="middle"
              fontFamily={fonts.body}
              fontWeight={weights.bodySemibold}
              fontSize={typeScale.label}
              fill={colors.text.primary}
            >
              Kiln: 730 °C (1,350 °F)
            </text>
          </Reveal>
        </Interactive.G>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
