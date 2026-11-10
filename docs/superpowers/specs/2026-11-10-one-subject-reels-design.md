# One subject, easy to follow: reel scripting rules and checks

Date: 2026-11-10. Status: approved in discussion, awaiting spec review by the user.

## Problem

Post 27 (hovercraft) opened on "how air actually lifts 60 cars?" and a setup about a boat and a car, so a muted viewer met three vehicles in the first 8 seconds before the reel settled on the hovercraft. The cause was process: the question card must score 50+ on `hookscore.py`, which rewards a concrete number, so a number was borrowed from the payoff. A subject-naming option ("an 11-tonne hovercraft", 62.2) was available and not used.

The pipeline only enforces section order and line format. Nothing checks that a reel stays on its subject, that each line follows from the one before, or that the question card gets answered. `instagram/voice.md` already asks for "Do you know how {topic} ...?" but nothing enforces it; post 27's card had no amber word because its `topic` wasn't in the question.

## Rules (CLAUDE.md anatomy + QA checklist, instagram/voice.md)

**One subject per reel.**
- The question card names the subject. Any number in it is about the subject; never borrow a number or object from elsewhere in the script to lift the score.
- The setup opens on the subject. At most one comparison, and only with the ordinary version of the same thing (normal trains for a maglev, normal braking for regen), drawn on the same object where possible.
- Every scene shows the subject.

**Easy to follow.**
- Each section does one job: Question (curiosity about the subject), Hook (a surprising claim about it), Setup (the problem the mechanism solves), Mechanism (the steps, cause to effect, one per sentence), Payoff (what it leads to), Congrats (names what was learned).
- Each sentence follows from the one before ("so", "but", "then" logic). If two sentences can swap without breaking the meaning, one of them doesn't belong.
- No new object or name unless it connects to the subject.
- The question card is answered explicitly, in the mechanism or payoff.

**Scoring order (`/ig-reel` override in CLAUDE.md):** question-card candidates must name the subject before they are scored.

## idea.md additions

- Front matter `topic:`: the subject word(s), the same as `script.topic` in code (amber on the question and congrats cards).
- `## Spine` table, written and approved before the script lines:

  | Part | Job |
  |---|---|
  | Question | what the viewer is curious about |
  | Hook | the surprising claim |
  | Setup | the problem the mechanism solves |
  | Mechanism | the steps, cause to effect |
  | Payoff | what it leads to |
  | Answer | `Mechanism:` or `Payoff:` + where and how the question card is answered |

- `## Cold read`: written by Claude from the voice-over alone, before the user approves the script. Three lines: `About:` (the subject), `Asks:` (the question), `Answer:` (the answer as the VO gives it). If any can't be filled from the lines alone, the script isn't ready.

## Tracker checks (`npm run tracker`, errors)

Apply to reel ideas (formats E, F, Q) whose status is not `rendered` or `posted`. Carousels are out of scope.

1. `topic` is set.
2. Once a `## Script` table exists: `topic` appears in the title, the question line, and the first sentence of the setup (or that sentence opens with a back-reference: it, its, this, that, they). Case-insensitive, singular/plural-tolerant word match (`ship` matches `ships`).
3. Once the post is built (code exists): `topic` equals `script.topic`.
4. Status `scripted` or later: `## Spine` has all six rows filled, and the Answer row starts with `Mechanism:` or `Payoff:`.
5. Status `scripted` or later: `## Cold read` has non-empty `About:`, `Asks:` and `Answer:` lines.

Unit tests cover each check, including the plural match, the back-reference, and the rendered/posted exemption.

## Post 27 changes

| | New |
|---|---|
| Question | "Do you know how a hovercraft actually lifts 60 cars?" (hookscore 62.2) |
| Hook | unchanged |
| Setup | "A hovercraft never touches the water. Nothing solid holds it up." |
| Rest | unchanged |

- Setup visual: one 2D side-view hovercraft over a water line; it lifts and the gap turns amber on "touches"; a soft pulse in the empty gap on "solid". World backdrop behind.
- SFX setup cues move to "touches" and "solid".
- TTS for question and setup only; Blender re-renders the opener only (the backdrop length comes from the longer payoff); then audio QA, stills, motion sheets, render, master.
- Status goes back to `scripted` for the rewrite (so the new checks apply), then built, rendered. Caption unchanged.

## Other unbuilt reels

The checks flag 29, 33, 30, 34, 35, 32, 37 (and every scripted reel needs a spine and cold read). Draft rewrites, facts unchanged, are in the discussion log; each is scored, run through the tracker and approved by the user before it is written to idea.md. Question cards must still score 50+; if not, alternatives go to the user. No re-renders: none are built.

## Out of scope

- Reels already rendered or posted (01, 02, 03, 07, 10, 12, 20, 21, 26): left as they are. Scripted ones (04, 28-37) are in scope.
- An automated semantic check of flow (that sentences logically follow): handled by the spine, the cold read and review, not code.
