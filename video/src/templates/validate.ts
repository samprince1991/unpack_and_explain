import { MEME_DEFAULT_SECONDS, MEME_MAX_SECONDS } from "../brand/memes";
import { isModelId, modelParts } from "../brand/models";
import { isBlenderPlan } from "./blenderJob";
import { brand } from "../brand/tokens";
import { normalizeWord } from "./cues";
import { countWords } from "./timing";
import {
  BEAT_ACTIONS,
  SECTION_ORDER,
  type Beat,
  type CarouselScript,
  type PostScript,
  type SectionId,
  type Shot,
} from "./types";

export const COVER_MAX_WORDS = 4;

const spokenIn = (script: PostScript, section: SectionId, cue: string) =>
  (script.sections.find((s) => s.id === section)?.voiceover ?? "")
    .split(/\s+/)
    .some((w) => normalizeWord(w) === normalizeWord(cue));

// Rules for the Blender plan (docs/specs/2026-11-02-blender-3d-design.md).
const validateBlender = (script: PostScript, errors: string[]) => {
  const plan = script.blender;
  if (!isBlenderPlan(plan)) {
    if (!plan.optOut.trim()) {
      errors.push("blender.optOut needs a reason");
    }
    return;
  }
  if (script.hero3d !== "mechanism") {
    errors.push('a blender plan needs hero3d: "mechanism"');
  }
  if (!isModelId(plan.model)) {
    errors.push(`blender.model "${plan.model}" is not in src/brand/models.ts`);
    return;
  }
  const parts = modelParts(plan.model);
  const checkPart = (where: string, part: string | undefined) => {
    if (part !== undefined && !parts.includes(part)) {
      errors.push(`${where}: part "${part}" is not in model ${plan.model} (${parts.join(", ")})`);
    }
  };
  const checkShot = (where: string, shot: Partial<Shot>) => {
    checkPart(where, shot.keyPart);
    if (shot.zoom !== undefined && shot.zoom <= 0) {
      errors.push(`${where}: zoom must be > 0`);
    }
  };
  const checkBeats = (section: "hook" | "mechanism", beats: Beat[] = []) =>
    beats.forEach((beat, i) => {
      const where = `blender.${section}.beats[${i}]`;
      if (!(BEAT_ACTIONS as readonly string[]).includes(beat.do)) {
        errors.push(`${where}: unknown action "${beat.do}"`);
      }
      if (!spokenIn(script, section, beat.cue)) {
        errors.push(`${where}: cue "${beat.cue}" is not spoken in the ${section} section`);
      }
      if (["focus", "spin", "flow", "label"].includes(beat.do) && !beat.part) {
        errors.push(`${where}: "${beat.do}" needs a part`);
      }
      if (beat.do === "flow" && !beat.to) {
        errors.push(`${where}: "flow" needs a destination part (to)`);
      }
      if (beat.do === "label" && !beat.label?.trim()) {
        errors.push(`${where}: "label" needs label text`);
      }
      if (beat.label && spokenIn(script, section, beat.label) && !/\d/.test(beat.label)) {
        errors.push(`${where}: label "${beat.label}" repeats the voice-over`);
      }
      checkPart(where, beat.part);
      checkPart(where, beat.to);
      checkShot(where, beat.shot ?? {});
    });
  checkShot("blender.cover", plan.cover);
  checkShot("blender.opener", plan.opener);
  checkShot("blender.hook", plan.hook);
  checkShot("blender.mechanism", plan.mechanism);
  checkBeats("hook", plan.hook.beats);
  checkBeats("mechanism", plan.mechanism.beats);
  if (plan.mechanism.beats.length === 0) {
    errors.push("blender.mechanism needs at least one beat");
  }
  const coverText = plan.coverText ?? script.hookText;
  if (countWords(coverText) > COVER_MAX_WORDS) {
    errors.push(`cover text "${coverText}" must be at most ${COVER_MAX_WORDS} words (set blender.coverText)`);
  }
};

// ~2 lines at the hook font size inside the content box.
export const HOOK_MAX_CHARS = 28;
export const WORD_RANGE = { min: 100, max: 130 } as const;
// ig-carousel limits, shared with the content tracker.
export const SLIDE_RANGE = { min: 6, max: 10 } as const;
export const SLIDE_WORDS = { cover: 6, headline: 7, body: 25 } as const;

export const validateScript = (script: PostScript) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const ids = script.sections.map((s) => s.id);
  if (ids.join(",") !== SECTION_ORDER.join(",")) {
    errors.push(`Sections must be ${SECTION_ORDER.join(" > ")}, got ${ids.join(" > ")}`);
  }
  if (!script.source.trim()) {
    errors.push("source is required");
  }
  if (script.hookText.length > HOOK_MAX_CHARS) {
    errors.push(`hookText must be at most ${HOOK_MAX_CHARS} characters (2 lines)`);
  }
  if (script.format === "F" && !script.failureSection) {
    errors.push("F posts need failureSection");
  }
  if (script.format !== "F" && script.failureSection) {
    errors.push("failureSection is only for F posts");
  }
  const question = script.sections.find((s) => s.id === "question");
  if (question && !question.voiceover.trim().endsWith("?")) {
    errors.push('question voiceover must end with "?"');
  }
  const congrats = script.sections.find((s) => s.id === "congrats");
  if (congrats && !congrats.voiceover.trim().startsWith("Congrats")) {
    errors.push('congrats voiceover must start with "Congrats"');
  }
  const cta = script.sections.find((s) => s.id === "cta");
  if (cta && cta.voiceover !== brand.ctaLine) {
    errors.push(`CTA voiceover must be exactly "${brand.ctaLine}"`);
  }
  if (typeof script.hero3d === "object" && !script.hero3d.optOut.trim()) {
    errors.push("hero3d.optOut needs a reason");
  }

  validateBlender(script, errors);

  if (script.meme) {
    const { section, cue, seconds = MEME_DEFAULT_SECONDS } = script.meme;
    const spoken = script.sections.find((s) => s.id === section)?.voiceover ?? "";
    if (!spoken.split(/\s+/).some((w) => normalizeWord(w) === normalizeWord(cue))) {
      errors.push(`meme cue "${cue}" is not spoken in the ${section} section`);
    }
    if (seconds > MEME_MAX_SECONDS) {
      errors.push(`meme must be at most ${MEME_MAX_SECONDS} s`);
    }
  }

  const total = script.sections.reduce((n, s) => n + countWords(s.voiceover), 0);
  if (total < WORD_RANGE.min || total > WORD_RANGE.max) {
    warnings.push(`Spoken words ${total} outside ${WORD_RANGE.min}-${WORD_RANGE.max} target`);
  }

  return { errors, warnings };
};

// Cover first, recap second-to-last, CTA last, content in between.
const expectedKind = (i: number, total: number) =>
  i === 0 ? "cover" : i === total - 1 ? "cta" : i === total - 2 ? "recap" : "content";

export const validateCarousel = (script: CarouselScript) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { slides } = script;

  if (slides.length < SLIDE_RANGE.min || slides.length > SLIDE_RANGE.max) {
    errors.push(`needs ${SLIDE_RANGE.min}-${SLIDE_RANGE.max} slides, got ${slides.length}`);
  }
  slides.forEach((s, i) => {
    const kind = expectedKind(i, slides.length);
    if (s.kind !== kind) {
      errors.push(`slide ${i + 1} must be ${kind}, got ${s.kind}`);
    }
    const max = i === 0 ? SLIDE_WORDS.cover : SLIDE_WORDS.headline;
    const headline = countWords(s.headline);
    if (headline < 1 || headline > max) {
      errors.push(`slide ${i + 1} headline needs 1-${max} words, got ${headline}`);
    }
    const body = countWords(s.body);
    if (body > SLIDE_WORDS.body) {
      errors.push(`slide ${i + 1} body has ${body} words, max ${SLIDE_WORDS.body}`);
    }
    if (`${s.headline} ${s.body}`.includes("!")) {
      errors.push(`slide ${i + 1} must not use "!"`);
    }
  });
  if (!script.source.trim()) {
    errors.push("source is required");
  }

  return { errors, warnings };
};
