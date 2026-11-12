import { AbsoluteFill, Interactive } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { colors, typeScale } from "../../../brand/tokens";
import { BlenderClip } from "../../../components/BlenderClip";
import { DustField } from "../../../components/motion/DustField";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

// The maglev streaks in along the raised guideway (beats in script.ts `blender.hook`). The hook
// title already says "603 km/h", so the 2D layer adds only the imperial conversion, under the
// title and above the train.
export const HookScene: React.FC = () => {
  const speed = useCue("603", 0.6);
  return (
    <AbsoluteFill>
      <DustField seed="hook-31" />
      <BlenderClip clip="hook" />
      <SceneCanvas>
        <Interactive.G name="Speed in mph">
          <Reveal at={speed}>
            <text
              x={540}
              y={700}
              textAnchor="middle"
              fontFamily={fonts.body}
              fontWeight={weights.bodySemibold}
              fontSize={typeScale.label}
              fill={colors.text.primary}
            >
              375 mph
            </text>
          </Reveal>
        </Interactive.G>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
