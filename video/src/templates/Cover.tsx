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
  loadModelHash,
} from "./blender";
import { blenderAreas, blenderSubjectPath, buildBlenderJob, isBlenderPlan } from "./blenderJob";
import type { BlenderManifest, PostScript } from "./types";
import { loadVo } from "./vo";

export type CoverProps = {
  script: PostScript;
  blender3d: BlenderManifest | null;
  showGuides: boolean;
};

// Title + model must sit inside both crops: the 4:5 feed crop is the tighter one.
const TITLE_TOP = coverCrop(video.width, video.height).y + 60;
// Poppins SemiBold: average glyph width as a share of the font size (sizes the longest word).
const GLYPH_EM = 0.6;
// The world behind the model: darker and softer, so the model and the title carry the cover.
const BACKDROP_FILTER = "brightness(0.5) saturate(0.85) blur(3px)";

// Largest size up to typeScale.cover at which the longest word fits the column.
export const coverFontSize = (text: string) => {
  const longest = Math.max(...text.split(/\s+/).map((w) => w.length), 1);
  return Math.floor(Math.min(typeScale.cover, layout.column.width / (longest * GLYPH_EM)));
};

// Upload as the reel's custom cover ("Edit cover"), docs/blender.md "Cover". Layers, back to
// front: the world (dimmed, softened), a light pool behind the model, a vignette, the title,
// then the model alone (the subject layer), so it stands in front of the words. Covers
// rendered before the subject layer existed keep the old flat layout.
// Render: npm run cover -- post-NN-slug.
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
  const cover = blender3d?.clips.cover;
  const box = cover?.subjectBox ?? null;
  // A world cover has its own model-only pass; without a world the clip is the model alone.
  const subjectLayer = cover?.subject ? "pass" : box && !plan.world ? "clip" : null;
  const area = blenderAreas(script).cover;
  const pool = box
    ? {
        x: area.x + ((box[0] + box[2]) / 2) * area.width,
        y: area.y + ((box[1] + box[3]) / 2) * area.height,
      }
    : null;
  const fontSize = coverFontSize(text);

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
        {subjectLayer === "clip" ? null : (
          <BlenderClip
            clip="cover"
            frame={0}
            style={subjectLayer ? { filter: BACKDROP_FILTER, scale: "1.03" } : undefined}
          />
        )}
        {pool ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at ${pool.x}px ${pool.y}px, ${withAlpha(colors.diagram.stroke, 0.16)} 0px, ${withAlpha(colors.diagram.stroke, 0)} 520px)`,
            }}
          />
        ) : null}
        {subjectLayer ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 75% 60% at 50% 48%, ${withAlpha(colors.bg.base, 0)} 40%, ${withAlpha(colors.bg.base, 0.85)} 100%)`,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            // A world fills the frame, so the scrim runs to the top instead of showing an edge.
            top: plan.world ? 0 : feed.y,
            height: plan.world ? feed.y + 520 : 520,
            background: `linear-gradient(${withAlpha(colors.bg.base, 0.9)} ${plan.world ? feed.y : 0}px, ${withAlpha(colors.bg.base, 0)})`,
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
            fontSize: subjectLayer ? fontSize : typeScale.display,
            lineHeight: 1.0,
            color: colors.text.primary,
            textWrap: "balance",
            textShadow: subjectLayer
              ? `0 6px 36px ${withAlpha(colors.bg.base, 0.9)}, 0 0 80px ${withAlpha(colors.text.primary, 0.12)}`
              : undefined,
          }}
        >
          <HighlightedText text={text} highlight={highlight} />
        </Interactive.Div>
        {subjectLayer === "pass" ? (
          <Img
            src={staticFile(blenderSubjectPath(script.id))}
            style={{ position: "absolute", left: area.x, top: area.y, width: area.width, height: area.height }}
          />
        ) : null}
        {subjectLayer === "clip" ? <BlenderClip clip="cover" frame={0} /> : null}
        <Img
          src={staticFile("brand/avatar.svg")}
          style={
            subjectLayer
              ? // Small, in the corner of the 4:5 crop: out of the way of the model.
                { position: "absolute", left: layout.column.x, top: feed.y + feed.height - 100, width: 60 }
              : {
                  position: "absolute",
                  left: video.width / 2 - 40,
                  top: feed.y + feed.height - 140,
                  width: 80,
                  opacity: 0.5,
                }
          }
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
    const statuses = clipStatuses(
      job,
      blender3d,
      await loadModelHash(job.model.file),
    );
    if (statuses.cover !== "ok" && getRemotionEnvironment().isRendering) {
      throw new Error(blenderProblems(props.script.id, statuses) ?? "");
    }
  }
  return { props: { ...props, blender3d } };
};
