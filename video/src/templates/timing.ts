import type { Caption } from "@remotion/captions";
import type { SectionId, VoSection } from "./types";

// Breathing room after each section's last word.
export const TAIL_PAD_FRAMES = 6;
export const CTA_MIN_SECONDS = 3;
export const SOURCE_LEAD_SECONDS = 3;

export const countWords = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

export const estimateDurationMs = (text: string, wordsPerSecond: number): number =>
  Math.round((countWords(text) / wordsPerSecond) * 1000);

export const msToFrames = (ms: number, fps: number): number => Math.ceil((ms / 1000) * fps);

export type SectionTiming = { id: SectionId; from: number; durationInFrames: number };

// Every section except the last is extended by the transition length, so its audio
// finishes before the next section fades in. Matches TransitionSeries' overlap math.
export const computeTimeline = (
  sections: { id: SectionId; durationMs: number }[],
  fps: number,
  transitionFrames: number,
): { sections: SectionTiming[]; totalFrames: number } => {
  let cursor = 0;
  const timings = sections.map((section, i) => {
    const isLast = i === sections.length - 1;
    const audioFrames = msToFrames(section.durationMs, fps) + TAIL_PAD_FRAMES;
    const minimum = section.id === "cta" ? CTA_MIN_SECONDS * fps : 0;
    const durationInFrames = Math.max(audioFrames, minimum) + (isLast ? 0 : transitionFrames);
    const timing = { id: section.id, from: cursor, durationInFrames };
    cursor += durationInFrames - (isLast ? 0 : transitionFrames);
    return timing;
  });
  return { sections: timings, totalFrames: cursor };
};

export const estimateCaptions = (text: string, durationMs: number): Caption[] => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const step = durationMs / words.length;
  return words.map((word, i) => ({
    text: i === 0 ? word : ` ${word}`,
    startMs: Math.round(i * step),
    endMs: Math.round((i + 1) * step),
    timestampMs: null,
    confidence: null,
  }));
};

// Section-local captions -> one global list for the whole reel.
export const mergeCaptions = (
  vo: VoSection[],
  timings: SectionTiming[],
  fps: number,
): Caption[] =>
  vo
    .flatMap((section) => {
      const timing = timings.find((t) => t.id === section.id);
      if (!timing) {
        throw new Error(`No timing for section ${section.id}`);
      }
      const offset = (timing.from / fps) * 1000;
      return section.captions.map((c, i) => ({
        ...c,
        startMs: c.startMs + offset,
        endMs: c.endMs + offset,
        timestampMs: c.timestampMs === null ? null : c.timestampMs + offset,
        ...(i === section.captions.length - 1 ? { pageBreakAfter: true } : {}),
      }));
    })
    .map((c, i) => {
      const word = c.text.trimStart();
      return { ...c, text: i === 0 ? word : ` ${word}` };
    });
