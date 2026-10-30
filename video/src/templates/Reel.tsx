import { createElement } from "react";
import { Audio } from "@remotion/media";
import { TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
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
import { audioCues } from "./audioCues";
import { pickLook, transitionMixes } from "./look";
import { MemeMoment } from "./MemeMoment";
import { SectionContext } from "./SectionContext";
import { computeTimeline, mergeCaptions, SOURCE_LEAD_SECONDS } from "./timing";
import type { PostScript, SectionId, VoManifest } from "./types";

export type ReelProps = {
  script: PostScript;
  // Filled in by calculateReelMetadata.
  vo: VoManifest | null;
  // Brand SFX + music bed. Filled in by calculateReelMetadata.
  audio: AudioLibrary | null;
  // Studio-only overlay of Instagram UI zones and the 4:5 cover crop.
  showGuides: boolean;
};

// Sections every reel shares, rendered by the template from the script text.
const TEMPLATE_SECTIONS = ["question", "congrats", "cta"] as const;

// Bespoke scenes per post, for the sections in between.
export type SceneMap = Record<Exclude<SectionId, (typeof TEMPLATE_SECTIONS)[number]>, React.FC>;

// Transition into each section, keyed by the entering section. Wins over the look's mix.
export type TransitionMap = Partial<Record<SectionId, SectionTransitionName>>;

export const Reel: React.FC<ReelProps & { scenes: SceneMap; transitions?: TransitionMap }> = ({
  script,
  vo,
  audio,
  showGuides,
  scenes,
  transitions = {},
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!vo) {
    throw new Error("VO manifest missing: calculateReelMetadata should have provided it");
  }

  const { sections } = computeTimeline(vo.sections, fps, durations.crossfade);
  // Template cards already show their words, so no captions over them.
  const captions = mergeCaptions(
    vo.sections.filter((s) => !(TEMPLATE_SECTIONS as readonly SectionId[]).includes(s.id)),
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
  const mix: TransitionMap = { ...transitionMixes[look.transitions], ...transitions };

  return (
    <AbsoluteFill>
      <Background />
      <AmbientMotif format={script.format} />
      <TransitionSeries>
        {vo.sections.flatMap((section, i) => {
          const t = timing(section.id);
          const scene =
            section.id === "question" ? (
              <QuestionCard question={section.text} topic={script.topic} variant={look.question} />
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
                value={{ captions: section.captions, durationInFrames: t.durationInFrames }}
              >
                {scene}
                {section.id === "hook" ? (
                  <HookTitle
                    text={script.hookText}
                    highlight={script.hookHighlight}
                    variant={look.hook}
                  />
                ) : null}
                {section.id === script.failureSection ? <FailureBadge /> : null}
                {script.meme && section.id === script.meme.section ? (
                  <MemeMoment meme={script.meme} />
                ) : null}
              </SectionContext.Provider>
              {section.file ? <Audio src={staticFile(section.file)} /> : null}
            </TransitionSeries.Sequence>,
          ];
        })}
      </TransitionSeries>
      <Sequence name="Watermark" durationInFrames={cta.from + durations.crossfade}>
        <Watermark />
      </Sequence>
      <Sequence name="Captions" durationInFrames={cta.from}>
        <Captions captions={captions} />
      </Sequence>
      <Sequence name="Source" from={sourceFrom}>
        <SourceTag source={script.source} />
      </Sequence>
      {audioCues(sections, durations.crossfade).map((cue) => {
        const file = audio?.sfx[cue.name];
        return file ? (
          <Sequence key={`${cue.name}-${cue.from}`} name={`SFX ${cue.name}`} from={cue.from} layout="none">
            <Audio src={staticFile(file)} volume={sfx[cue.name].volume} />
          </Sequence>
        ) : null;
      })}
      {audio?.music ? (
        <Audio
          src={staticFile(audio.music)}
          loop
          volume={(f) =>
            music.volume *
            interpolate(
              f,
              [0, music.fadeFrames, durationInFrames - music.fadeFrames, durationInFrames],
              [0, 1, 1, 0],
              clamp,
            )
          }
        />
      ) : null}
      {showGuides ? <SafeZoneGuide /> : null}
    </AbsoluteFill>
  );
};
