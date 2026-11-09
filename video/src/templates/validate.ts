import { TEMPLATE_SFX, type SfxName } from "../brand/audio";
import { MEME_DEFAULT_SECONDS, MEME_MAX_SECONDS } from "../brand/memes";
import { isModelId, modelParts, models, type ModelEntry } from "../brand/models";
import { isBlenderPlan } from "./blenderJob";
import { brand } from "../brand/tokens";
import { normalizeWord } from "./cues";
import { isSfxPlan, isSharedSfx, SFX_LIMITS } from "./sfxCues";
import { countWords } from "./timing";
import {
  BEAT_ACTIONS, WORLDS,
  SECTION_ORDER,
  SFX_SECTIONS,
  type Beat,
  type CarouselScript,
  type PostScript,
  type SectionId,
  type Shot,
} from "./types";

export const COVER_MAX_WORDS = 4;

const spokenIn = (script: PostScript, section: SectionId, cue: string) =>
  (script.sections.find((s) => s.id === section)?.voiceover ?? "")
    .split(/[\s-]+/)
    .some((w) => normalizeWord(w) === normalizeWord(cue));

const SFX_BANNED_PROMPT = /\b(voices?|speech|spoken|speaking|singing|vocals?|music|musical|melody|songs?)\b/i;

// Rules for sound effects (docs/specs/2026-11-08-sfx-pipeline-design.md).
const validateSfx = (script: PostScript, errors: string[], warnings: string[]) => {
  const plan = script.sfx;
  if (!isSfxPlan(plan)) {
    if (!plan.optOut.trim()) {
      errors.push("sfx.optOut needs a reason");
    }
    return;
  }
  const { cuesPerReel, cuesInMechanism, customSounds, customMinSeconds, customMaxSeconds, maxOffsetFrames } =
    SFX_LIMITS;
  if (plan.cues.length === 0) {
    errors.push("an sfx plan needs at least 1 cue (otherwise use optOut)");
  }
  if (plan.cues.length > cuesPerReel) {
    errors.push(`sfx: at most ${cuesPerReel} cues per reel`);
  }
  if (plan.cues.filter((c) => c.section === "mechanism").length > cuesInMechanism) {
    errors.push(`sfx: at most ${cuesInMechanism} cues in the mechanism`);
  }

  const custom = Object.entries(plan.custom ?? {});
  if (custom.length > customSounds) {
    errors.push(`sfx: at most ${customSounds} topic sounds per reel`);
  }
  for (const [name, sound] of custom) {
    if (isSharedSfx(name)) {
      errors.push(`sfx: topic sound "${name}" shadows a shared sound`);
    }
    if (sound.seconds < customMinSeconds || sound.seconds > customMaxSeconds) {
      errors.push(`sfx: topic sound "${name}" must be ${customMinSeconds}-${customMaxSeconds} s`);
    }
    if (SFX_BANNED_PROMPT.test(sound.prompt)) {
      errors.push(`sfx: topic sound "${name}" can't ask for speech or music`);
    }
    if (!plan.cues.some((c) => c.sound === name)) {
      warnings.push(`sfx: topic sound "${name}" is never used`);
    }
  }

  for (const cue of plan.cues) {
    const isCustom = plan.custom?.[cue.sound] !== undefined;
    if (!isCustom && !isSharedSfx(cue.sound)) {
      errors.push(`sfx cue "${cue.cue}": "${cue.sound}" is not a shared or custom sound`);
    } else if (TEMPLATE_SFX.includes(cue.sound as SfxName)) {
      errors.push(`sfx cue "${cue.cue}": "${cue.sound}" is placed by the template`);
    }
    if (!(SFX_SECTIONS as readonly string[]).includes(cue.section)) {
      errors.push(`sfx cue "${cue.cue}" must be in the hook, setup, mechanism or payoff`);
      continue;
    }
    const spoken = (script.sections.find((s) => s.id === cue.section)?.voiceover ?? "")
      .split(/[\s-]+/)
      .map(normalizeWord)
      .filter(Boolean);
    const first = spoken.indexOf(normalizeWord(cue.cue));
    if (first === -1) {
      errors.push(`sfx cue "${cue.cue}" is not spoken in the ${cue.section} section`);
    } else if (first === spoken.length - 1) {
      // A sound on a section's last word is what made the old section whoosh sound wrong.
      errors.push(`sfx cue "${cue.cue}" is the last word of the ${cue.section} section`);
    }
    if (Math.abs(cue.offsetFrames ?? 0) > maxOffsetFrames) {
      errors.push(`sfx cue "${cue.cue}": offsetFrames must be -${maxOffsetFrames} to ${maxOffsetFrames}`);
    }
  }
};

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
  const appearOnly: readonly string[] = (models[plan.model] as ModelEntry).appearOnly ?? [];
  const checkPart = (where: string, part: string | undefined) => {
    if (part !== undefined && !parts.includes(part)) {
      errors.push(`${where}: part "${part}" is not in model ${plan.model} (${parts.join(", ")})`);
    }
  };
  if (plan.world !== undefined) {
    if (!(WORLDS as readonly string[]).includes(plan.world)) {
      errors.push(`blender.world "${plan.world}" is unknown (${WORLDS.join(", ")})`);
    } else if (plan.world === "sea" && !parts.includes("waterline")) {
      errors.push('blender.world "sea" needs a model with a waterline part');
    }
  }
  const checkShot = (where: string, shot: Partial<Shot>) => {
    if (shot.frameY !== undefined && (shot.frameY < 0 || shot.frameY > 1)) {
      errors.push(`${where}: frameY must be between 0 and 1`);
    }
    checkPart(where, shot.keyPart);
    checkPart(where, shot.aim);
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
      if (["focus", "spin", "flow", "label", "shift", "appear"].includes(beat.do) && !beat.part) {
        errors.push(`${where}: "${beat.do}" needs a part`);
      }
      if (beat.follow !== undefined && beat.do !== "flow") {
        errors.push(`${where}: "follow" only applies to flow`);
      }
      if (beat.do === "flow" && !beat.to) {
        errors.push(`${where}: "flow" needs a destination part (to)`);
      }
      if (beat.do === "shift" && !beat.by) {
        errors.push(`${where}: "shift" needs an offset (by)`);
      }
      if (beat.by && beat.do !== "shift") {
        errors.push(`${where}: "by" only applies to shift`);
      }
      if (beat.do === "appear" && beat.part && !appearOnly.includes(beat.part)) {
        errors.push(`${where}: part "${beat.part}" is not in the model's appearOnly list`);
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

// Close / wide rhythm (docs/specs/2026-11-03-blender-camera-rhythm-design.md): the
// mechanism moves in to the part that matters, then pulls back so the whole thing reads.
const isCloseUp = (b: Beat) => b.do === "focus" || (b.do === "flow" && b.follow !== false);
const isWide = (b: Beat) => b.do === "wide" || b.do === "collapse" || b.do === "explode";

const checkCameraRhythm = (script: PostScript, warnings: string[]) => {
  if (!isBlenderPlan(script.blender)) {
    return;
  }
  // Beats run in cue order; fallbacks give that order without the VO timing.
  const beats = [...script.blender.mechanism.beats].sort((a, b) => a.fallback - b.fallback);
  const lastClose = beats.map(isCloseUp).lastIndexOf(true);
  if (lastClose === -1) {
    warnings.push("blender.mechanism has no close-up: add a focus (or a followed flow) on the part that matters");
  } else if (!beats.slice(lastClose + 1).some(isWide)) {
    warnings.push(
      'blender.mechanism ends on a close-up: add a "wide" (or collapse) after the last close-up so the whole model reads',
    );
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
  checkCameraRhythm(script, warnings);
  validateSfx(script, errors, warnings);

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
