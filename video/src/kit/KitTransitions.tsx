import { TransitionSeries } from "@remotion/transitions";
import {
  ArrowRightLeft,
  Eye,
  Footprints,
  Layers,
  ScanSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment } from "react";
import { AbsoluteFill } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { durations } from "../brand/motion";
import { colors, typeScale } from "../brand/tokens";
import { Background } from "../components/Background";
import { LineIcon } from "../components/icons/LineIcon";
import { Float } from "../components/motion/Float";
import { SceneCanvas } from "../components/SceneCanvas";
import {
  sectionTransitions,
  type SectionTransitionName,
} from "../components/transitions/sectionTransitions";

// Each scene is named after the transition that brought it in.
const SCENES: { name: SectionTransitionName; icon: LucideIcon }[] = [
  { name: "dip", icon: Eye },
  { name: "zoomDip", icon: Layers },
  { name: "push", icon: Footprints },
  { name: "iris", icon: ScanSearch },
  { name: "wipe", icon: ArrowRightLeft },
];
export const KIT_SCENE_FRAMES = 45;

const Scene: React.FC<{ name: string; icon: LucideIcon }> = ({
  name,
  icon,
}) => (
  <AbsoluteFill>
    <SceneCanvas>
      <Float seed={name}>
        <LineIcon icon={icon} x={540} y={760} size={260} />
      </Float>
    </SceneCanvas>
    <div
      style={{
        position: "absolute",
        left: layout.column.x,
        width: layout.column.width,
        top: layout.regions.captions.top,
        textAlign: "center",
        fontFamily: fonts.body,
        fontWeight: weights.bodySemibold,
        fontSize: typeScale.caption,
        color: colors.text.primary,
      }}
    >
      {name}
    </div>
  </AbsoluteFill>
);

export const KitTransitions: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <TransitionSeries>
      {SCENES.map((s, i) => (
        <Fragment key={s.name}>
          {i > 0 ? (
            <TransitionSeries.Transition {...sectionTransitions[s.name]()} />
          ) : null}
          <TransitionSeries.Sequence durationInFrames={KIT_SCENE_FRAMES}>
            <Scene name={s.name} icon={s.icon} />
          </TransitionSeries.Sequence>
        </Fragment>
      ))}
    </TransitionSeries>
  </AbsoluteFill>
);

// Each transition overlaps two scenes by durations.crossfade.
export const kitTransitionsFrames =
  SCENES.length * KIT_SCENE_FRAMES - (SCENES.length - 1) * durations.crossfade;
