# Reel variety: looks, format signatures, scene styles

Date: 2026-10-30. Status: approved, built (looks, motifs). Scene styles are built per post, starting with post 20.

## Problem

Every reel uses the same frame: question card, hook title, background, `dip` transitions. The brand needs that frame to be recognisable, but four reels a week that open identically read as a template. We want variety without losing the brand.

## Rule: fixed frame, varied content layer

**Never varies** (brand recognition): colours and color roles, fonts and type scale, Brian's voice, captions, congrats card, CTA card, logo, watermark, safe zones, section order, music and SFX.

**Varies per post:** question card style, hook title style, transition mix, background motif (by format), and the visual languages the scenes are drawn in.

## 1. Look: one deterministic pick per post

New `src/templates/look.ts`:

```ts
export type Look = {
  question: QuestionStyle;    // "center" | "bigTopic" | "underline" | "spotlight"
  hook: HookStyle;            // "settle" | "wordByWord" | "underline" | "rise"
  transitions: TransitionMix; // "steady" | "process" | "chapter" | "focus"
};
export const pickLook = (postNumber: number, override?: Partial<Look>): Look
```

- **Rotation, not random.** Each slot picks `options[(postNumber * step + offset) % options.length]` with a different `step` / `offset` per slot. That is deterministic (same render every time, which Remotion requires), so two consecutive posts never share the same question style or hook style, and the combinations drift instead of cycling in lockstep.
- **Override:** `script.look?: Partial<Look>` in `script.ts` pins any slot by hand when a style fits the topic better.
- **Existing posts keep their look:** posts 1 and 2 get `look: classicLook` (today's center / settle / their current transitions), so re-renders don't change what's posted or approved.
- `Reel`'s `transitions` prop stays and wins over the mix for any section it lists.

### Question card styles

Card text must be readable at frame 0 (anatomy rule 1), so only decoration animates:

| Style | Look |
|---|---|
| `center` | Today's card |
| `bigTopic` | Topic word on its own line, larger, amber; rest of the question smaller around it |
| `underline` | Today's layout; an amber marker stroke draws under the topic word in the first 15 frames |
| `spotlight` | Topic word sits in a raised `bg.raised` pill with a thin amber outline that draws in |

### Hook title styles

| Style | Entrance (all done within ~1 s) |
|---|---|
| `settle` | Today's subtle scale settle |
| `wordByWord` | Words rise in one after another, 3 frames apart (lands in under 1 s) |
| `underline` | Settle, then a marker stroke under the highlight word |
| `rise` | Whole title slides up from behind a mask line |

### Transition mixes

Named sets for the four scene entries (hook is the first after the question card):

| Mix | hook | setup | mechanism | payoff | congrats |
|---|---|---|---|---|---|
| `steady` | dip | dip | push | dip | dip |
| `process` | dip | push | push | zoomDip | dip |
| `chapter` | zoomDip | dip | zoomDip | iris | dip |
| `focus` | dip | iris | push | iris | zoomDip |

`wipe` is kept for Q posts (myth to fact), set by hand.

## 2. Format signature: background motif

`AmbientWaves` becomes one of three `AmbientMotif`s, picked by `script.format` (not rotated, so the format is felt before it's said). All navy shades only, 15% opacity or lower, slow:

| Format | Motif |
|---|---|
| E explainer | Moving waves (today) |
| F failure | Faint blueprint grid drifting slowly (incident-report feel) |
| Q myth / fact | Dot grid with a slow pulse travelling across it |

## 3. Scene style library

Reusable visual languages in `src/components/styles/`, previewed in Studio under `Kit-Styles`. Built **when a post needs one**, starting with what vibe coding (post 20) needs:

| Style | Pieces | First used in |
|---|---|---|
| UI mock | `ChatBox` (typed message, reply), `Terminal` (lines + run/error/ok states), `CodeBlock` (neutral lines, one amber line) | Post 20 hook, setup |
| Cycle diagram | `CycleDiagram`: N nodes on a partial ring, a `Travel` dot moving node to node, amber on the active node | Post 20 mechanism |
| Kinetic type | `BigWord` / `BigNumber`: one word or number fills the visual region for a beat | Post 20 payoff |

Later, when a post needs them: timeline, exploded view, before/after split. All follow the diagram rules (neutral `colors.diagram.*`, one amber element, inside `SceneCanvas`).

Not in scope: camera variants (camera lives inside each scene already), music beds (Music API is not on the free tier).

## Testing

- `look.test.ts`: `pickLook` is deterministic; consecutive post numbers never share question or hook style; overrides win.
- Brand guard covers the new files (no colour or font literals).
- QA: a `Kit-Looks` Studio composition shows all question and hook styles side by side; contact sheet of post 20 as usual.

## Files

- New: `src/templates/look.ts` (+ test), `src/components/AmbientMotif.tsx`, `src/components/styles/*`, `src/kit/KitLooks.tsx`, `src/kit/KitStyles.tsx`.
- Changed: `QuestionCard.tsx`, `HookTitle.tsx` (take a `style` prop), `Reel.tsx` (pick look, motif), `types.ts` (`look?`), posts 1 and 2 (`classicLook`), `CLAUDE.md` (Motion kit + Reel anatomy notes).
