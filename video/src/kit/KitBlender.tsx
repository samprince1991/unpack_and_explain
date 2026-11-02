// Studio preview of the Blender pipeline on a sample reel (src/kit/blenderSample.ts):
// opener behind the question card, 3D hook and mechanism with labels, and 2D sections
// with the depth effects (Parallax, LightSweep, DustField). Demo only.
import { AbsoluteFill } from "remotion";

import { colors } from "../brand/tokens";
import { BlenderClip } from "../components/BlenderClip";
import { BlenderLabels } from "../components/BlenderLabels";
import { DustField } from "../components/motion/DustField";
import { LightSweep } from "../components/motion/LightSweep";
import { Parallax } from "../components/motion/Parallax";
import { Reel, type ReelProps } from "../templates/Reel";

const Hook: React.FC = () => (
  <AbsoluteFill>
    <DustField seed="hook" />
    <BlenderClip clip="hook" />
  </AbsoluteFill>
);

const card = { x: 290, y: 620, width: 500, height: 340 };

const Depth: React.FC = () => (
  <AbsoluteFill>
    <Parallax depth={0.2} seed="far">
      <DustField seed="far" count={20} />
    </Parallax>
    <Parallax depth={1} seed="near">
      <div
        style={{
          position: "absolute",
          left: card.x,
          top: card.y,
          width: card.width,
          height: card.height,
          borderRadius: 24,
          border: `3px solid ${colors.diagram.stroke}`,
          backgroundColor: colors.diagram.fill,
        }}
      />
      <LightSweep at={20} area={card} />
    </Parallax>
  </AbsoluteFill>
);

const Mechanism: React.FC = () => (
  <AbsoluteFill>
    <BlenderClip clip="mechanism" />
    <BlenderLabels clip="mechanism" />
  </AbsoluteFill>
);

export const KitBlender: React.FC<ReelProps> = (props) => (
  <Reel {...props} scenes={{ hook: Hook, setup: Depth, mechanism: Mechanism, payoff: Depth }} />
);

