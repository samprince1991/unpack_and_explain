# Carousel renderer Implementation Plan

> **For agentic workers:** Execute inline in the main session (CLAUDE.md: no subagents). Steps use checkbox (`- [ ]`) syntax. Do not commit unless the user asks.

**Goal:** Render a scripted carousel idea as 1080x1350 branded PNG slides with one Remotion command; first post: idea 18 (GPS in 4 steps).

**Architecture:** Typed `slides.ts` per post (verbatim copy of `idea.md`'s `## Slides`), checked by `validateCarousel` and by the tracker. A shared `Carousel` template maps frame N to slide N+1 and lays out cover / content / recap / CTA slides; the post supplies per-slide SVG visuals keyed by slide number.

**Tech Stack:** Remotion 4, React, TypeScript, vitest, tsx scripts.

Spec: `docs/specs/2026-10-30-carousel-renderer-design.md`.

---

## File map

| File | Responsibility |
|---|---|
| `video/src/brand/tokens.ts` (modify) | `carousel` size, `carouselType` sizes |
| `video/src/brand/layout.ts` (modify) | `carouselLayout`: margin, column, regions |
| `video/src/templates/types.ts` (modify) | `SlideKind`, `CarouselSlide`, `CarouselScript` |
| `video/src/templates/validate.ts` (modify) | `SLIDE_RANGE`, `SLIDE_WORDS` (moved here), `validateCarousel` |
| `video/src/templates/validate.test.ts` (modify) | tests for `validateCarousel` |
| `video/scripts/lib/tracker.ts` (modify) | import slide limits from validate.ts |
| `video/scripts/tracker.ts` (modify) | `checkSlidesTs`: slides.ts must match idea.md |
| `video/src/components/carousel/SlideFooter.tsx` | "n/N" + handle |
| `video/src/components/carousel/SlideCanvas.tsx` | SVG in slide coords clipped to a region |
| `video/src/components/carousel/CarouselGuide.tsx` | QA overlay: 120 px margin, 4:5 crop, center |
| `video/src/templates/Carousel.tsx` | frame → slide, layouts per kind |
| `video/src/posts/post-18-gps-steps/slides.ts` (+ `slides.test.ts`) | data |
| `video/src/posts/post-18-gps-steps/scenes/*.tsx` | one visual per slide that has one |
| `video/src/posts/post-18-gps-steps/index.tsx` | `Carousel18` with visuals map |
| `video/src/Root.tsx` (modify) | register `Carousel18-GpsSteps` |
| `CLAUDE.md` (modify) | carousel build commands |

---

### Task 1: Types and validator (TDD)

- [ ] Add to `types.ts`:

```ts
export type SlideKind = "cover" | "content" | "recap" | "cta";
export type CarouselSlide = { kind: SlideKind; headline: string; body: string };
export type CarouselScript = {
  id: string;
  postNumber: number;
  title: string;
  coverHighlight?: string;
  source: string;
  companionOf?: number;
  slides: CarouselSlide[];
  verify: string[];
};
```

- [ ] Write failing tests in `validate.test.ts` (`describe("validateCarousel")`): a valid 6-slide fixture returns `{ errors: [], warnings: [] }`; 5 slides → error; wrong kind order (no cover first / recap not second-to-last / cta not last) → error; 7-word cover headline → error; 26-word body → error; empty source → error; "!" in any text → error.
- [ ] Run `npx vitest run src/templates/validate.test.ts` → FAIL (not exported).
- [ ] Implement in `validate.ts`:

```ts
export const SLIDE_RANGE = { min: 6, max: 10 } as const;
export const SLIDE_WORDS = { cover: 6, headline: 7, body: 25 } as const;

export const validateCarousel = (script: CarouselScript) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { slides } = script;
  if (slides.length < SLIDE_RANGE.min || slides.length > SLIDE_RANGE.max) {
    errors.push(`needs ${SLIDE_RANGE.min}-${SLIDE_RANGE.max} slides, got ${slides.length}`);
  }
  const expected = slides.map((_, i) =>
    i === 0 ? "cover" : i === slides.length - 1 ? "cta" : i === slides.length - 2 ? "recap" : "content",
  );
  slides.forEach((s, i) => {
    if (s.kind !== expected[i]) errors.push(`slide ${i + 1} must be ${expected[i]}, got ${s.kind}`);
    const max = i === 0 ? SLIDE_WORDS.cover : SLIDE_WORDS.headline;
    const h = countWords(s.headline);
    if (h < 1 || h > max) errors.push(`slide ${i + 1} headline needs 1-${max} words, got ${h}`);
    if (countWords(s.body) > SLIDE_WORDS.body) errors.push(`slide ${i + 1} body has ${countWords(s.body)} words, max ${SLIDE_WORDS.body}`);
    if (`${s.headline}${s.body}`.includes("!")) errors.push(`slide ${i + 1} must not use "!"`);
  });
  if (!script.source.trim()) errors.push("source is required");
  return { errors, warnings };
};
```

- [ ] Run tests → PASS.
- [ ] In `scripts/lib/tracker.ts` replace the local `SLIDE_RANGE` / `SLIDE_WORDS` with an import from `../../src/templates/validate` (re-export if tests import them from tracker). Run `npm test` → PASS.

### Task 2: Brand tokens and layout

- [ ] `tokens.ts`: `export const carousel = { width: 1080, height: 1350 } as const;` and `export const carouselType = { cover: 112, headline: 76, body: 46, footer: 32 } as const;`
- [ ] `layout.ts`: `carouselLayout(width, height)` returning `{ margin: 120, column: { x: 120, width: width - 240 }, regions: { headline, visual, body, footer, coverHook, coverVisual, coverBody } }` with the spec's y values, plus `export const slideLayout = carouselLayout(carousel.width, carousel.height)`. Add a `layout.test.ts` case: every region lies within `[margin, height - margin]` and the cover text regions within the 4:5 crop (`coverCrop` of 1080x1350 is the full frame, so margin is the binding check).
- [ ] `npm test` → PASS.

### Task 3: Shared carousel components

- [ ] `SlideFooter` ({ index, total }): absolute at `regions.footer`, flex space-between across the column, Inter medium `carouselType.footer`, `colors.text.muted`; left `${index}/${total}`, right `brand.handle`. Wrapped in `Interactive.Div name="Slide footer"`.
- [ ] `SlideCanvas` ({ region, children }): full-slide SVG (`viewBox 0 0 width height`) with a clipPath to `column` × region (unique clip id per region).
- [ ] `CarouselGuide`: coral shade over the 120 px margin, amber center line, dashed amber outline of each region.

### Task 4: Carousel template

- [ ] `Carousel.tsx` exports `CarouselProps = { script: CarouselScript; showGuides: boolean }` and `Carousel: React.FC<CarouselProps & { visuals: Partial<Record<number, React.FC>> }>`. Uses `useCurrentFrame()` to pick `slides[Math.min(frame, slides.length - 1)]`; renders `Background`, the kind layout, `SlideFooter`, `CarouselGuide` when `showGuides`.
- [ ] Layouts (all `Interactive.Div`, centered text, `textWrap: "balance"`):
  - cover: hook in `coverHook` (Poppins `cover`, `HighlightedText` with `coverHighlight`), visual in `coverVisual`, body in `coverBody` (Inter body, `text.secondary`).
  - content: headline in `headline` (Poppins `headline`, primary), visual, body (Inter body, secondary).
  - recap: headline; body split on `/\s(?=\d+\s)/` into numbered rows spanning visual+body regions (number in amber? no: numbers `text.muted`, text primary; amber stays for visuals); `Source: ...` line below, Inter `footer`, muted.
  - cta: stacked logo (`brand/stacked.svg`, width 640) in the visual region, headline above, body below, handle in `teal[400]` under the body.
- [ ] `npm run lint` → PASS.

### Task 5: Post 18 data

- [ ] `slides.ts`: `CarouselScript` with id `post-18-gps-steps`, postNumber 18, `coverHighlight: "pin"`, source `GPS.gov`, companionOf 2, the 9 slides verbatim from `ideas/idea-18-gps-steps/idea.md` (kinds: cover, content×6, recap, cta), verify list copied.
- [ ] `slides.test.ts`: `validateCarousel(script)` equals `{ errors: [], warnings: [] }`.
- [ ] Tracker: add `checkSlidesTs` in `scripts/tracker.ts` (mirror of `checkScriptTs`): import `slides.ts`, compare each `idea.slides[i]` headline/body with `script.slides[i]`, error on count or text mismatch; error when status is built/rendered/posted and the file is missing. Call it for carousels.
- [ ] `npm test` and `npm run tracker` → PASS.

### Task 6: Post 18 visuals

One SVG component per slide with a visual, using existing icons, neutral `colors.diagram.*`, exactly one amber element:

| Slide | Visual | Amber |
|---|---|---|
| 1 cover | Phone with a crossed-out wifi arc, two satellites above with dashed signal lines down | pin on the phone |
| 2 stake | Satellites sending arrows down to the phone; one faint arrow up crossed out | none-amber except... the phone's listening arcs (amber) |
| 3 step 1 | Earth with a partial orbit arc, 3 satellites emitting partial rings | one satellite's ring |
| 4 step 2 | Signal line from satellite to phone with a small clock at the phone | clock hand (ClockIcon) |
| 5 step 3 | Satellite and phone with a dimension line between them | the distance line |
| 6 step 4 | Three partial range arcs meeting at a point, fourth satellite small with clock | the pin at the meeting point |
| 7 bonus | Satellite clock with a correction arrow; faint drift trail on a map line | the correction arrow |
| 8 recap | none | none |
| 9 cta | logo (template) | none |

- [ ] `index.tsx`: `export const Carousel18: React.FC<CarouselProps> = (p) => <Carousel {...p} visuals={{ 1: CoverVisual, 2: StakeVisual, ... }} />`.
- [ ] `Root.tsx`: `<Composition id="Carousel18-GpsSteps" component={Carousel18} durationInFrames={slides18.slides.length} fps={video.fps} width={carousel.width} height={carousel.height} defaultProps={{ script: slides18, showGuides: false }} />`.

### Task 7: QA

- [ ] `npm run lint`, `npm test`, `npm run tracker` → all pass.
- [ ] `npx remotion render Carousel18-GpsSteps out/qa/carousel --sequence --image-format=png --props=./qa-guides.json`; view every PNG: no text in the margin, nothing clipped or overlapping, one amber element, text sizes per spec. Fix and repeat.
- [ ] Render clean: `npx remotion render Carousel18-GpsSteps out/post-18-gps-steps --sequence --image-format=png` only when the user asks (CLAUDE.md: render only when asked; QA renders are fine).

### Task 8: Docs and status

- [ ] CLAUDE.md Carousels: replace "Build (Phase 2, not built yet)" with the build/render commands and the status flow; repo map mentions `slides.ts`; Commands lists the carousel render.
- [ ] Set idea 18 `status: built`; `npm run tracker`.
