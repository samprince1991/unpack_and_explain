import { AbsoluteFill, Interactive } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { colors, typeScale } from "../../../brand/tokens";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

// The camera drops toward the waterline and the skirt turns amber on "air" (beats in
// script.ts `blender.hook`). The weight in imperial is the only text: the VO says tonnes.
// It sits in the sky just under the hook title, above the craft.
export const HookScene: React.FC = () => {
  const tonne = useCue("tonne", 0.65);
  return (
    <AbsoluteFill>
      <DustField seed="hook-27" />
      <BlenderClip clip="hook" />
      <SceneCanvas>
        <Interactive.G name="Weight in US tons">
          <Reveal at={tonne}>
            <text
              x={540}
              y={700}
              textAnchor="middle"
              fontFamily={fonts.body}
              fontWeight={weights.bodySemibold}
              fontSize={typeScale.label}
              fill={colors.text.secondary}
            >
              11 t (12 US tons)
            </text>
          </Reveal>
        </Interactive.G>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
