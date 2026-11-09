# Carousels

Swipe posts for ideas with steps or a list worth re-reading (saves and sends). Written with `/ig-carousel`, usually turned from a posted reel's mechanism by `/ig-repurpose`. One per week, on Wednesday.

## Copy

`## Slides` table in `idea.md`: `Slide | Headline | Body`. 6-10 slides:

1. Cover: 6 words or fewer, the hook.
2. Stake: also works as a second cover.
3. Then one idea per slide: headline 7 words or fewer, body 25 words or fewer.
4. A recap slide, the one people screenshot.
5. A CTA slide with one ask.

The tracker enforces the counts.

**Caption:** `/ig-caption` Job B (the caption carries the hook, since the cover used its six words). Alt text for the cover at minimum.

## Look

Same brand as reels: dark only, token colors, diagrams in neutral line art with one amber key element, Poppins headlines, Inter body (at least 44 px for readable text, 32 px for the source). Slide number (3/8) and the handle on every slide, small. Keep text clear of the outer 120 px. Source on the last content or recap slide.

## Build

`src/templates/Carousel.tsx` renders a `CarouselNN-Slug` composition at 1080x1350, one frame per slide.

1. `src/posts/post-NN-slug/slides.ts`: a `CarouselScript` with each slide's `kind` (`cover`, `content`..., `recap`, `cta`) and headline/body copied **verbatim** from `idea.md` (the tracker checks it), `coverHighlight` (one amber word on the cover), `source`, `verify`. Plus `slides.test.ts` asserting `validateCarousel` returns no errors or warnings.
2. `scenes/*.tsx`: one visual per slide that needs one, drawn into `SlideCanvas` (neutral line art, one amber element). The recap and CTA slides have none: the template draws the numbered list + source, and the logo + teal handle.
3. `index.tsx` exports `CarouselNN` (wraps `Carousel` with `visuals={{ 1: CoverVisual, ... }}`, keyed by slide number). Register `CarouselNN-Slug` in `Root.tsx`, inside the `Carousels` folder, with `durationInFrames={script.slides.length}`.
4. Run the carousel QA render, `npm run lint`, `npm test`, `npm run tracker`, and set `status: built`. After rendering set `rendered`; upload the PNGs in order and set `posted`.

## Commands

- QA: `npx remotion render CarouselNN-Slug out/qa/carousel --sequence --image-format=png --props=./qa-guides.json` (guides: 120 px margin, slide center, the slide's regions). Inspect every PNG.
- Render: `npx remotion render CarouselNN-Slug out/post-NN-slug --sequence --image-format=png`.
- One slide: `npx remotion still CarouselNN-Slug out/post-NN-slug/slide-N.png --frame=<N-1>`.
