import type { SectionTransitionName } from "../components/transitions/sectionTransitions";
import type { SectionId } from "./types";

// Per-post variety inside the fixed brand frame. Colors, fonts, voice, captions and the
// congrats / CTA cards never change; these slots do.
export const QUESTION_STYLES = ["center", "bigTopic", "underline", "spotlight"] as const;
export type QuestionStyle = (typeof QUESTION_STYLES)[number];

export const HOOK_STYLES = ["settle", "wordByWord", "underline", "rise"] as const;
export type HookStyle = (typeof HOOK_STYLES)[number];

// Transition into each scene section. `classic` (all dip) is for posts built before looks
// existed and is never picked by rotation.
type SceneEntry = Extract<SectionId, "hook" | "setup" | "mechanism" | "payoff" | "congrats">;
export const transitionMixes = {
  steady: { hook: "dip", setup: "dip", mechanism: "push", payoff: "dip", congrats: "dip" },
  process: { hook: "dip", setup: "push", mechanism: "push", payoff: "zoomDip", congrats: "dip" },
  chapter: { hook: "zoomDip", setup: "dip", mechanism: "zoomDip", payoff: "iris", congrats: "dip" },
  focus: { hook: "dip", setup: "iris", mechanism: "push", payoff: "iris", congrats: "zoomDip" },
  classic: { hook: "dip", setup: "dip", mechanism: "dip", payoff: "dip", congrats: "dip" },
} as const satisfies Record<string, Record<SceneEntry, SectionTransitionName>>;
export type TransitionMix = keyof typeof transitionMixes;
const ROTATING_MIXES = ["steady", "process", "chapter", "focus"] as const;

export type Look = {
  question: QuestionStyle;
  hook: HookStyle;
  transitions: TransitionMix;
};

// Today's look before variety existed. Pinned by posts that are already approved or posted,
// so re-renders don't change them.
export const classicLook: Look = { question: "center", hook: "settle", transitions: "classic" };

// Deterministic rotation (Remotion renders must be repeatable). Each slot steps at a
// different rate, so consecutive posts never share a question or hook style and the
// combinations drift instead of cycling together.
export const pickLook = (postNumber: number, override: Partial<Look> = {}): Look => {
  const n = Math.max(0, Math.floor(postNumber));
  return {
    question: QUESTION_STYLES[n % 4],
    hook: HOOK_STYLES[(3 * n + 1) % 4],
    transitions: ROTATING_MIXES[(n + Math.floor(n / 4) + 2) % 4],
    ...override,
  };
};
