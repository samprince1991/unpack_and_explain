import { AbsoluteFill, Interactive } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { colors, typeScale } from "../../../brand/tokens";
import { BlenderClip } from "../../../components/BlenderClip";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

const READOUT = { x: 540, y: 450, width: 300, height: 120 };

// Blender 3D hero: close on the weight and the fixed fingers, the die tilts and the weight
// slides so the gaps narrow, then upright and wide with three arrows, the down one amber
// (beats in script.ts `blender.mechanism`). The number the chip makes is a 2D readout:
// the die tilts 15 degrees on screen, and sin(15 degrees) = 0.26 g along that axis.
export const MechanismScene: React.FC = () => {
  const number = useCue("number", 0.64);
  const three = useCue("three", 0.72);
  return (
    <AbsoluteFill>
      <BlenderClip clip="mechanism" />
      <SceneCanvas>
        <Interactive.G name="Reading">
          <Reveal at={number - 4} exitAt={three}>
            <rect
              x={READOUT.x - READOUT.width / 2}
              y={READOUT.y - READOUT.height / 2}
              width={READOUT.width}
              height={READOUT.height}
              rx={24}
              fill={colors.bg.base}
              stroke={colors.diagram.stroke}
              strokeWidth={4}
            />
            <text
              x={READOUT.x}
              y={READOUT.y + typeScale.title * 0.35}
              textAnchor="middle"
              fontFamily={fonts.heading}
              fontWeight={weights.heading}
              fontSize={typeScale.title}
              fill={colors.text.primary}
            >
              0.26 g
            </text>
          </Reveal>
        </Interactive.G>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
