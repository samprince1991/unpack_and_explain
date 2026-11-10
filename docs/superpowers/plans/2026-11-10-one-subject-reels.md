# One Subject, Easy to Follow: Implementation Plan

> **For agentic workers:** this repo forbids subagents (CLAUDE.md). Execute inline with superpowers:executing-plans. No commits unless the user asks. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Every reel stays on one named subject and reads as a chain: the tracker enforces topic, spine and cold read on unbuilt reels; post 27 is rewritten and re-rendered; the other unbuilt reels get spines, cold reads and subject-first lines.

**Architecture:** Pure matching helpers in a new `video/scripts/lib/subject.ts` (topic mention, first sentence, back-reference). `tracker.ts` parses three new idea.md parts (`topic:` front matter, `## Spine`, `## Cold read`) and calls the helpers inside `validateIdea` for E/F/Q reels whose status isn't rendered/posted. `scripts/tracker.ts` adds the code check `topic === script.topic`.

**Tech stack:** TypeScript, vitest, js-yaml (existing). Spec: `docs/superpowers/specs/2026-11-10-one-subject-reels-design.md`.

---

### Task 1: Subject matching helpers

**Files:** Create `video/scripts/lib/subject.ts`, `video/scripts/lib/subject.test.ts`

- [ ] **Step 1: failing tests**

```ts
import { describe, expect, it } from "vitest";
import { firstSentence, mentionsTopic, opensOnTopic } from "./subject";

describe("mentionsTopic", () => {
  it("matches whole words, any case", () => {
    expect(mentionsTopic("Do you know how GPS finds you?", "GPS")).toBe(true);
    expect(mentionsTopic("Do you know how gpsx works?", "GPS")).toBe(false);
  });
  it("ignores articles and tolerates singular/plural", () => {
    expect(mentionsTopic("Do you know how a hovercraft floats?", "a hovercraft")).toBe(true);
    expect(mentionsTopic("Every ship shoves water aside.", "ships")).toBe(true);
    expect(mentionsTopic("Why do air taxis have 12 propellers?", "air taxi")).toBe(true);
  });
  it("needs every topic word", () => {
    expect(mentionsTopic("Who approves your card?", "card payment")).toBe(false);
  });
});

describe("firstSentence / opensOnTopic", () => {
  it("cuts at the first . ? or :", () => {
    expect(firstSentence("A boat drags. A car grips.")).toBe("A boat drags.");
  });
  it("accepts the topic or a back-reference opener", () => {
    expect(opensOnTopic("A hovercraft never touches the water. Nothing holds it.", "a hovercraft")).toBe(true);
    expect(opensOnTopic("It isn't a grade on your wealth. It's a prediction.", "credit score")).toBe(true);
    expect(opensOnTopic("A boat drags through water. A car grips the road.", "a hovercraft")).toBe(false);
  });
});
```

- [ ] **Step 2:** `npx vitest run scripts/lib/subject.test.ts`: FAIL (module missing).
- [ ] **Step 3: implementation**

```ts
// Plain-text subject checks for idea.md scripts (docs/superpowers/specs/2026-11-10-one-subject-reels-design.md).
const ARTICLES = new Set(["a", "an", "the"]);
const BACK_REFERENCES = new Set(["it", "its", "it's", "this", "that", "they", "these", "those"]);

const tokens = (text: string) => text.toLowerCase().match(/[a-z0-9.']+/g)?.map((w) => w.replace(/^'+|'+$|\.+$/g, "")) ?? [];
const stem = (w: string) => w.replace(/(es|s)$/, "");

export const topicWords = (topic: string) => tokens(topic).filter((w) => !ARTICLES.has(w));

export const mentionsTopic = (text: string, topic: string): boolean => {
  const have = new Set(tokens(text).map(stem));
  const need = topicWords(topic).map(stem);
  return need.length > 0 && need.every((w) => have.has(w));
};

export const firstSentence = (text: string) => text.trim().match(/^[\s\S]*?[.?:](?=\s|$)/)?.[0] ?? text.trim();

export const opensOnTopic = (text: string, topic: string): boolean => {
  const first = firstSentence(text);
  return mentionsTopic(first, topic) || BACK_REFERENCES.has(tokens(first)[0] ?? "");
};
```

- [ ] **Step 4:** run again: PASS.

### Task 2: Tracker parses and checks topic, spine, cold read

**Files:** Modify `video/scripts/lib/tracker.ts` (IdeaMeta, Idea, parseIdea, validateIdea), `video/scripts/lib/tracker.fixtures.ts` (FRONT gets `topic: "GPS"`, setup opens on GPS, SCRIPT gets Spine + Cold read), `video/scripts/lib/tracker.test.ts`.

- [ ] **Step 1: failing tests** (in `describe("validateIdea")`):
  - fixture still passes clean;
  - question without the topic → `question card doesn't name the topic "GPS" (one subject per reel)`;
  - setup opening on something else → `setup's first sentence doesn't name the topic "GPS" (or open with it/this/that)`;
  - title without the topic → `title doesn't contain the topic "GPS"`;
  - no `topic` → `topic is required for reels (the subject, amber on the question card)`;
  - missing spine row / Answer not starting `Mechanism:`/`Payoff:` → `## Spine needs Question, Hook, Setup, Mechanism, Payoff and Answer rows` / `## Spine Answer must start with "Mechanism:" or "Payoff:"`;
  - missing cold read line → `## Cold read needs About:, Asks: and Answer: lines`;
  - the same broken idea with `status: rendered` → none of these errors (exempt).
- [ ] **Step 2:** `npx vitest run scripts/lib/tracker.test.ts`: the new tests FAIL.
- [ ] **Step 3: implementation**
  - `IdeaMeta.topic?: string`; `Idea.spine: Record<string, string>` (from `## Spine` rows `| Part | Job |`, part lower-cased); `Idea.coldRead: Record<string, string>` (from `## Cold read` lines `About: ...`, keys lower-cased).
  - In `validateIdea`, inside the reel branch, when `!["rendered", "posted"].includes(meta.status)`: the five checks from the spec, using `subject.ts`.
- [ ] **Step 4:** run tracker tests: PASS; `npm test`: all PASS.

### Task 3: Code topic matches idea topic

**Files:** Modify `video/scripts/tracker.ts` `checkScriptTs`.

- [ ] Add: `if (idea.meta.topic && script.topic !== idea.meta.topic) errors.push(\`topic "${idea.meta.topic}" differs from script.ts topic "${script.topic}"\`)` for non-rendered/posted reels.
- [ ] `npm run tracker`: expect errors only on the ideas the spec lists (they get fixed in Tasks 5-6).

### Task 4: Rules in the docs

**Files:** `CLAUDE.md` (reel anatomy rule, `/ig-reel` scoring override, QA checklist, per-post workflow step 1: spine + cold read before approval), `instagram/voice.md` (question line rule), `docs/instagram-pipeline.md` (stage 4 output adds spine and cold read).

- [ ] Add the "One subject per reel" and "Easy to follow" rules (spec, Rules section) verbatim in meaning, short.

### Task 5: Post 27 rewrite and re-render

**Files:** `ideas/idea-27-hovercraft/idea.md`, `video/src/posts/post-27-hovercraft/script.ts`, `scenes/SetupScene.tsx`.

- [ ] idea.md: status `scripted`, `topic: "a hovercraft"`, new question + setup lines, `question_score: 62.2`, spine, cold read; same lines in script.ts; SFX setup cues `touches`, `solid`.
- [ ] SetupScene: one CraftSide over a water line, lift + amber gap on "touches", `Ping` in the gap on "solid".
- [ ] `npm run tts -- post-27-hovercraft --only=question`, then `--only=setup`; check "trimmed" lines.
- [ ] `npm run blender -- post-27-hovercraft` (expect only the opener to render).
- [ ] `npm run qa:audio` (No stray blips, SFX levels OK), stills, motion sheets, render, master; status built → rendered; tracker clean for 27.

### Task 6: Other unbuilt reels

**Files:** `ideas/idea-04-*`, `ideas/idea-28-*` … `ideas/idea-37-*`.

- [ ] Add `topic`, `## Spine` and `## Cold read` to each scripted reel.
- [ ] Draft subject-first lines for 29, 33, 30, 34, 35, 32, 37 (spec drafts), score new question cards with `npm run ig`, then **show the user the drafts and wait for approval before writing them**.
- [ ] Apply approved lines; `npm run tracker` clean; `npm run lint`, `npm test` pass.
