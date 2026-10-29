import { Audio } from "@remotion/media";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { music, sfx, type AudioLibrary } from "../brand/audio";
import { clamp, durations } from "../brand/motion";
import { Background } from "../components/Background";
import { Captions } from "../components/Captions";
import { CtaCard } from "../components/CtaCard";
import { dip } from "../components/dip";
import { FailureBadge } from "../components/FailureBadge";
import { HookTitle } from "../components/HookTitle";
import { SafeZoneGuide } from "../components/SafeZoneGuide";
import { SourceTag } from "../components/SourceTag";
import { Watermark } from "../components/Watermark";
import { audioCues } from "./audioCues";
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

// Bespoke scenes per post. The CTA is always the shared CtaCard.
export type SceneMap = Record<Exclude<SectionId, "cta">, React.FC>;

export const Reel: React.FC<ReelProps & { scenes: SceneMap }> = ({
  script,
  vo,
  audio,
  showGuides,
  scenes,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  if (!vo) {
    throw new Error("VO manifest missing: calculateReelMetadata should have provided it");
  }

  const { sections } = computeTimeline(vo.sections, fps, durations.crossfade);
  // The CTA card carries the handle; no captions over it.
  const captions = mergeCaptions(
    vo.sections.filter((s) => s.id !== "cta"),
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

  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        {vo.sections.flatMap((section, i) => {
          const t = timing(section.id);
          const Scene = section.id === "cta" ? CtaCard : scenes[section.id];
          return [
            i > 0 ? (
              <TransitionSeries.Transition
                key={`${section.id}-transition`}
                presentation={dip()}
                timing={linearTiming({ durationInFrames: durations.crossfade })}
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
                <Scene />
                {section.id === "hook" ? (
                  <HookTitle text={script.hookText} highlight={script.hookHighlight} />
                ) : null}
                {section.id === script.failureSection ? <FailureBadge /> : null}
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
