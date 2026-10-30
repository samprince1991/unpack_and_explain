import { MEME_DEFAULT_SECONDS, MEME_MAX_SECONDS } from "../brand/memes";
import { brand } from "../brand/tokens";
import { normalizeWord } from "./cues";
import { countWords } from "./timing";
import { SECTION_ORDER, type CarouselScript, type PostScript } from "./types";

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
