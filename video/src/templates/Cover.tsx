import {
  AbsoluteFill,
  getRemotionEnvironment,
  Img,
  Interactive,
  staticFile,
  type CalculateMetadataFunction,
} from "remotion";
import { fonts, weights } from "../brand/fonts";
import { coverCrop, gridCrop, layout } from "../brand/layout";
import { colors, typeScale, video, withAlpha } from "../brand/tokens";
import { voice } from "../brand/voice";
import { Background } from "../components/Background";
import { BlenderClip } from "../components/BlenderClip";
import { HighlightedText } from "../components/HighlightedText";
import {
  BlenderContext,
  blenderProblems,
  clipStatuses,
  loadBlenderManifest,
} from "./blender";
import { blenderAreas, buildBlenderJob, isBlenderPlan } from "./blenderJob";
import type { BlenderManifest, PostScript } from "./types";
import { loadVo } from "./vo";

export type CoverProps = {
  script: PostScript;
  blender3d: BlenderManifest | null;
  showGuides: boolean;
};

// Title + model must sit inside both crops: the 4:5 feed crop is the tighter one.
const TITLE_TOP = coverCrop(video.width, video.height).y + 70;

// Upload as the reel's custom cover ("Edit cover"): the Blender hero still, the cover
// title with one amber word and the avatar mark. Render: npm run cover -- post-NN-slug.
export const Cover: React.FC<CoverProps> = ({
  script,
  blender3d,
  showGuides,
}) => {
  if (!isBlenderPlan(script.blender)) {
    throw new Error(`${script.id} has no blender plan, so no 3D cover`);
  }
  const plan = script.blender;
  const text = plan.coverText ?? script.hookText;
  const highlight = plan.coverHighlight ?? script.hookHighlight ?? "";
  const feed = coverCrop(video.width, video.height);
  const grid = gridCrop();

  return (
    <BlenderContext.Provider
      value={{
        postId: script.id,
        manifest: blender3d,
        areas: blenderAreas(script),
      }}
    >
      <AbsoluteFill>
        <Background />
        <BlenderClip clip="cover" area={layout.blender.cover} frame={0} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: feed.y,
            height: 520,
            background: `linear-gradient(${withAlpha(colors.bg.base, 0.9)}, ${withAlpha(colors.bg.base, 0)})`,
          }}
        />
        <Interactive.Div
          name="Cover title"
          style={{
            position: "absolute",
            left: layout.column.x,
            width: layout.column.width,
            top: TITLE_TOP,
            textAlign: "center",
            fontFamily: fonts.heading,
            fontWeight: weights.heading,
            fontSize: typeScale.display,
            lineHeight: 1.05,
            color: colors.text.primary,
            textWrap: "balance",
          }}
        >
          <HighlightedText text={text} highlight={highlight} />
        </Interactive.Div>
        <Img
          src={staticFile("brand/avatar.svg")}
          style={{
            position: "absolute",
            left: video.width / 2 - 40,
            top: feed.y + feed.height - 140,
            width: 80,
            opacity: 0.5,
          }}
        />
        {showGuides
          ? [
              { name: "4:5 feed", y: feed.y, height: feed.height },
              { name: "3:4 grid", y: grid.y, height: grid.height },
            ].map((g) => (
              <div
                key={g.name}
                style={{
                  position: "absolute",
                  left: 0,
                  width: video.width,
                  top: g.y,
                  height: g.height,
                  border: `3px dashed ${colors.coral}`,
                }}
              />
            ))
          : null}
      </AbsoluteFill>
    </BlenderContext.Provider>
  );
};

export const calculateCoverMetadata: CalculateMetadataFunction<
  CoverProps
> = async ({ props }) => {
  const blender3d = await loadBlenderManifest(props.script.id);
  if (isBlenderPlan(props.script.blender)) {
    const vo = await loadVo(props.script, voice.wordsPerSecond);
    const job = buildBlenderJob(props.script, vo, video.fps);
    const { cover } = clipStatuses(job, blender3d);
    if (cover !== "ok" && getRemotionEnvironment().isRendering) {
      throw new Error(
        blenderProblems(props.script.id, { ...clipStatuses(job, blender3d) }) ??
          "",
      );
    }
  }
  return { props: { ...props, blender3d } };
};
