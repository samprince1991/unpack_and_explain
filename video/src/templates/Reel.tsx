import { createElement } from "react";
import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { music, sfx, type AudioLibrary } from "../brand/audio";
import { clamp, durations } from "../brand/motion";
import { AmbientMotif } from "../components/AmbientMotif";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";
import { CongratsCard } from "../components/CongratsCard";
import { CtaCard } from "../components/CtaCard";
import { FailureBadge } from "../components/FailureBadge";
import { HookTitle } from "../components/HookTitle";
import { QuestionCard } from "../components/QuestionCard";
import { SafeZoneGuide } from "../components/SafeZoneGuide";
import { SourceTag } from "../components/SourceTag";
import {
  sectionTransitions,
  type SectionTransitionName,
} from "../components/transitions/sectionTransitions";
import { Watermark } from "../components/Watermark";
import { CaptionScrim, WorldBackdrop, WorldDust } from "../components/WorldBackdrop";
import { BlenderClip } from "../components/BlenderClip";
import { audioCues } from "./audioCues";
import { BlenderContext } from "./blender";
import { blenderAreas, isBlenderPlan } from "./blenderJob";
import { pickLook, transitionMixes } from "./look";
import { SectionContext } from "./SectionContext";
import { isSfxPlan, resolveSfxCues, SFX_FADE_FRAMES, sfxFile } from "./sfxCues";
import { computeTimeline, mergeCaptions, SOURCE_LEAD_SECONDS } from "./timing";
import type {
  BlenderManifest,
  PostScript,
  SectionId,
  SfxManifest,
  VoManifest,
} from "./types";

export type ReelProps = {
  script: PostScript;
  // Filled in by calculateReelMetadata.
  vo: VoManifest | null;
  // Brand SFX + music bed. Filled in by calculateReelMetadata.
  audio: AudioLibrary | null;
  // Blender renders (manifest). Filled in by calculateReelMetadata for posts with a plan.
  blender3d?: BlenderManifest | null;
  // Topic sounds (sfx.json). Filled in by calculateReelMetadata for posts with a plan.
  sfxManifest?: SfxManifest | null;
  // QA only: render one stem. "vo" is voice only, "sfx" effects only. Default "full".
  audioMix?: "full" | "vo" | "sfx";
  // QA only: accept --preview Blender clips in a CLI render (low-res contact sheets).
  allowBlenderPreview?: boolean;
  // Studio-only overlay of Instagram UI zones and the 4:5 cover crop.
  showGuides: boolean;
};

// Sections every reel shares, rendered by the template from the script text.
const TEMPLATE_SECTIONS = ["question", "congrats", "cta"] as const;

// The hook's first words are spoken while the question card (and its 3D backdrop) is
// still fading out, so its first caption would sit on top of the card. Captions stay
// hidden for the dip's first half (until the card is gone), then fade in quickly.
const CAPTION_FADE_FRAMES = 3;
const CaptionGate: React.FC<{ hideFrom: number; showAt: number; children: React.ReactNode }> = ({
  hideFrom,
  showAt,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity =
    frame < hideFrom ? 1 : interpolate(frame, [showAt, showAt + CAPTION_FADE_FRAMES], [0, 1], clamp);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// Bespoke scenes per post, for the sections in between.
export type SceneMap = Record<
  Exclude<SectionId, (typeof TEMPLATE_SECTIONS)[number]>,
  React.FC
>;

// Transition into each section, keyed by the entering section. Wins over the look's mix.
export type TransitionMap = Partial<Record<SectionId, SectionTransitionName>>;

export const Reel: React.FC<
  ReelProps & { scenes: SceneMap; transitions?: TransitionMap }
> = ({
  script,
  vo,
  audio,
  blender3d = null,
  sfxManifest = null,
  audioMix = "full",
  showGuides,
  scenes,
  transitions = {},
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!vo) {
    throw new Error(
      "VO manifest missing: calculateReelMetadata should have provided it",
    );
  }

  const { sections } = computeTimeline(vo.sections, fps, durations.crossfade);
  // Template cards already show their words, so no captions over them.
  const captions = mergeCaptions(
    vo.sections.filter(
      (s) => !(TEMPLATE_SECTIONS as readonly SectionId[]).includes(s.id),
    ),
    sections,
    fps,
  );
  const timing = (id: SectionId) => {
    const t = sections.find((s) => s.id === id);
    if (!t) {
      throw new Error(`Missing section ${id}`);
    }
    return t;
  };
  const cta = timing("cta");
  const sourceFrom = Math.max(0, cta.from - SOURCE_LEAD_SECONDS * fps);
  const look = pickLook(script.postNumber, script.look);
  const mix: TransitionMap = {
    ...transitionMixes[look.transitions],
    ...transitions,
  };
  const has3d = isBlenderPlan(script.blender);
  const world = isBlenderPlan(script.blender) ? script.blender.world : undefined;
  const sfxCues = isSfxPlan(script.sfx)
    ? resolveSfxCues(script.sfx, vo.sections, sections, fps, durations.crossfade)
    : [];

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
        <AmbientMotif format={script.format} />
        <TransitionSeries>
          {vo.sections.flatMap((section, i) => {
            const t = timing(section.id);
            const scene =
              section.id === "question" ? (
                <QuestionCard
                  question={section.text}
                  topic={script.topic}
                  variant={look.question}
                  backdrop={has3d ? <BlenderClip clip="opener" /> : undefined}
                />
              ) : section.id === "congrats" ? (
                <CongratsCard text={section.text} topic={script.topic} />
              ) : section.id === "cta" ? (
                <CtaCard />
              ) : (
                createElement(scenes[section.id])
              );
            return [
              i > 0 ? (
                <TransitionSeries.Transition
                  key={`${section.id}-transition`}
                  {...sectionTransitions[mix[section.id] ?? "dip"]()}
                />
              ) : null,
              <TransitionSeries.Sequence
                key={section.id}
                name={section.id}
                durationInFrames={t.durationInFrames}
              >
                <SectionContext.Provider
                  value={{
                    captions: section.captions,
                    durationInFrames: t.durationInFrames,
                  }}
                >
                  {world && (section.id === "setup" || section.id === "payoff") ? <WorldBackdrop /> : null}
                  {scene}
                  {world && (section.id === "hook" || section.id === "mechanism") ? <WorldDust /> : null}
                  {section.id === "hook" && script.hookTitle !== false ? (
                    <HookTitle
                      text={script.hookText}
                      highlight={script.hookHighlight}
                      variant={look.hook}
                    />
                  ) : null}
                  {section.id === script.failureSection ? (
                    <FailureBadge />
                  ) : null}
                </SectionContext.Provider>
                {section.file && audioMix !== "sfx" ? <Audio src={staticFile(section.file)} /> : null}
              </TransitionSeries.Sequence>,
            ];
          })}
        </TransitionSeries>
        <Sequence
          name="Watermark"
          durationInFrames={cta.from + durations.crossfade}
        >
          <Watermark />
        </Sequence>
        <Sequence name="Captions" durationInFrames={cta.from}>
          <CaptionGate
            hideFrom={timing("hook").from}
            showAt={timing("hook").from + Math.ceil(durations.crossfade / 2)}
          >
            {world ? <CaptionScrim /> : null}
            <Captions captions={captions} />
          </CaptionGate>
        </Sequence>
        <Sequence name="Source" from={sourceFrom}>
          <SourceTag source={script.source} />
        </Sequence>
        {audioMix !== "vo"
          ? audioCues(sections, durations.crossfade).map((cue) => {
              const file = audio?.sfx[cue.name];
              return file ? (
                <Sequence
                  key={`${cue.name}-${cue.from}`}
                  name={`SFX ${cue.name}`}
                  from={cue.from}
                  layout="none"
                >
                  <Audio src={staticFile(file)} volume={sfx[cue.name].volume} />
                </Sequence>
              ) : null;
            })
          : null}
        {audioMix !== "vo"
          ? sfxCues.map((cue) => {
              const file = sfxFile(cue.sound, audio, sfxManifest);
              return file ? (
                <Sequence
                  key={`${cue.sound}-${cue.from}`}
                  name={`SFX ${cue.sound}`}
                  from={cue.from}
                  durationInFrames={cue.durationInFrames}
                  layout="none"
                >
                  <Audio
                    src={staticFile(file)}
                    volume={(f) =>
                      cue.volume *
                      interpolate(
                        f,
                        [cue.durationInFrames - SFX_FADE_FRAMES, cue.durationInFrames],
                        [1, 0],
                        clamp,
                      )
                    }
                  />
                </Sequence>
              ) : null;
            })
          : null}
        {audio?.music && audioMix === "full" ? (
          <Audio
            src={staticFile(audio.music)}
            loop
            volume={(f) =>
              music.volume *
              interpolate(
                f,
                [
                  0,
                  music.fadeFrames,
                  durationInFrames - music.fadeFrames,
                  durationInFrames,
                ],
                [0, 1, 1, 0],
                clamp,
              )
            }
          />
        ) : null}
        {showGuides ? <SafeZoneGuide /> : null}
      </AbsoluteFill>
    </BlenderContext.Provider>
  );
};
