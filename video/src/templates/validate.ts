import { MEME_DEFAULT_SECONDS, MEME_MAX_SECONDS } from "../brand/memes";
import { brand } from "../brand/tokens";
import { normalizeWord } from "./cues";
import { countWords } from "./timing";
import { SECTION_ORDER, type PostScript } from "./types";

// ~2 lines at the hook font size inside the content box.
export const HOOK_MAX_CHARS = 28;
export const WORD_RANGE = { min: 100, max: 130 } as const;

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
