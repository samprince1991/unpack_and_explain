# Carousel renderer (Phase 2) design

Date: 2026-10-30. First user: idea 18 (`ideas/idea-18-gps-steps`, "How GPS works in 4 steps").

## Goal

Turn a `scripted` carousel idea (`## Slides` table in `idea.md`) into 1080x1350 PNG slides in the brand, with one command, using `src/brand/` and shared components. Same discipline as reels: typed post data copied verbatim from `idea.md`, a validator, and a tracker check that keeps the two in sync.

## Decision

Approach A: a typed `slides.ts` per post plus per-slide visual components, rendered by a shared `Carousel` template. Rejected: parsing `idea.md` at render time (markdown parser in the bundle, untyped, fragile slide-to-visual pairing) and a text-only template (CLAUDE.md wants a diagram with one amber key element).

## Composition

- One Remotion `Composition` per carousel post, 1080x1350, `durationInFrames = slides.length`, fps 30 (irrelevant: **frame N = slide N+1**, nothing animates).
- All slides: `npx remotion render CarouselNN-Slug out/post-NN-slug --sequence --image-format=png`. One slide: `npx remotion still CarouselNN-Slug out/post-NN-slug/slide-N.png --frame=N-1`.
- Props: `{ slides: CarouselScript, showGuides: boolean }`. `showGuides` draws the carousel guide overlay.

## Brand additions (`src/brand/`)

- `tokens.ts`: `carousel = { width: 1080, height: 1350 }`; `carouselType = { cover: 112, headline: 76, body: 46, footer: 32 }` (body >= 44, footer/source >= 32 per CLAUDE.md).
- `layout.ts`: `carouselLayout(width, height)` derived from the size, with `margin: 120` and vertical regions (starting values, tuned against QA stills):
  - headline 150-390, visual 420-800, body 830-1130, footer 1170-1230 (inside the 120 px margin).
  - Cover: hook 200-560, visual 590-930, promise line 960-1100.
  - Text column x 120-960 (symmetric, centered on 540).
- No new colors. Footer text `text.muted`; handle on the CTA slide `teal.400` (brand moment); amber only in the slide's visual key element and the cover's highlight word.

## Template (`src/templates/Carousel.tsx`)

Picks `slides.slides[frame]` and renders `Background`, then by `kind`:

| kind | Content |
|---|---|
| `cover` | Hook (Poppins, `carouselType.cover`, max 2-3 lines, `coverHighlight` word amber via `HighlightedText`), visual, promise line (Inter body, secondary). All text inside the 4:5 grid crop and 120 px margin. |
| `content` | Headline (Poppins 76), visual, body (Inter 46, secondary). Used for the stake slide and each step. |
| `recap` | Headline, the steps as a numbered list (parsed from the body: "1 ... 2 ... 3 ..."), source line ("Source: ...", Inter 32 muted) under it. No visual. |
| `cta` | Stacked-Dark logo, headline as the ask, body line, handle in teal. |

Every slide also gets `SlideFooter`: "3/9" left, `brand.handle` right, Inter 32 muted. All text elements wrapped in `Interactive.Div` with meaningful names.

Visuals come from the post: `<Carousel visuals={{ 1: CoverVisual, 3: BroadcastVisual }} />` keyed by slide number, mirroring the reel `scenes` map. A visual is a component that draws into `SlideCanvas` (SVG in slide coordinates, clipped to the visual region) using `colors.diagram.*` and the existing icons, with one amber element.

Components: `src/components/carousel/SlideFooter.tsx`, `SlideCanvas.tsx`, `CarouselGuide.tsx` (margin, 4:5 crop, center line). Layout components per kind live in the template file or `src/templates/carousel/` if it grows.

## Post data

```ts
// src/templates/types.ts
export type SlideKind = "cover" | "content" | "recap" | "cta";
export type CarouselSlide = { kind: SlideKind; headline: string; body: string };
export type CarouselScript = {
  id: string;          // "post-18-gps-steps"
  postNumber: number;
  title: string;
  coverHighlight?: string; // one word of the cover headline in amber (e.g. "pin")
  source: string;      // shown on the recap slide
  companionOf?: number;
  slides: CarouselSlide[];  // headline/body verbatim from idea.md
  verify: string[];
};
```

`slides.ts` is plain data (no React imports) so the tracker can import it under tsx. Post folder: `slides.ts`, `slides.test.ts`, `scenes/*.tsx` (visuals), `index.tsx` (exports `CarouselNN` wrapping `Carousel` with the visuals map). Registered in `Root.tsx` as `CarouselNN-Slug`.

## Validation

`validateCarousel(script)` in `src/templates/validate.ts`, using shared constants (move `SLIDE_RANGE` / `SLIDE_WORDS` there and import them from `scripts/lib/tracker.ts`, so the tracker and renderer agree):
- 6-10 slides; first `cover`, second-to-last `recap`, last `cta`; others `content`.
- Cover headline <= 6 words, other headlines <= 7, bodies <= 25.
- `source` non-empty; no "!" anywhere.
- `slides.test.ts` asserts no errors or warnings.

Tracker: for a carousel, if `src/posts/post-NN-slug/slides.ts` exists, each slide's headline and body must equal the `idea.md` row; if status is built/rendered/posted and the file is missing, error (same as reels).

## QA

- Render all slides with `--props=./qa-guides.json` and inspect every PNG: nothing in the 120 px margin, cover text inside the 4:5 crop, text >= 44 px, one amber element per slide, no overflow.
- `npm run lint`, `npm test` (brand guard covers new files), `npm run tracker`.

## Docs

CLAUDE.md: replace "Build (Phase 2, not built yet)" with the commands above; carousel status moves `scripted` → `built` (code exists) → `rendered` → `posted`. Mention `CarouselNN-Slug` in the repo map.

## Out of scope

Animated/video carousels, alt-text files, auto-upload, a generic text-only fallback visual.
