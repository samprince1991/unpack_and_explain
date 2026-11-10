# Remotion Elements

Elements (remotion.dev/elements) are copy-in source snippets, not npm packages. They're added **only through Studio** (right inspector > Actions > **Browse Elements** > pick > confirm); there is no CLI, so an agent can't add them. Deps are in `package.json`, assets in `public/elements/`.

## Two layers

| Layer | Location | Rules |
|---|---|---|
| **Library** (original, unbranded) | `src/elements/<category>/<slug>.element.tsx` + `<Name>Composition.tsx` demo | Reference only. Never edit, never import from a post. Excluded from the brand guard. The ones that fit this channel are previewable in Studio under **Elements** (ids `El-<Name>`), registered by `src/elements/ElementsGallery.tsx`; the rest stay here as files only |
| **Branded copy** (what posts use) | `src/components/elements/<slug>.tsx` | Adapted to our tokens. Subject to the brand guard |

Categories: `audio`, `backgrounds`, `captions`, `charts`, `effects`, `layouts`, `maps`, `storytelling`, `text`, `youtube`.

## Which Elements fit this channel

| Element | Use it for |
|---|---|
| `charts/number-counter` | Big stats ("~30 satellites", "$440M in 45 minutes") |
| `text/circle-marker`, `text-marker`, `strike-through`, `crossed-off` | Emphasis; Q posts (strike the myth, mark the fact) |
| `storytelling/news-article-highlight` | F posts: citing the real incident or investigation |
| `maps/spinning-globe`, `maps/map-flyover` | Geography (cables, GPS, SWIFT, flights) |
| `backgrounds/moving-waves` | Optional subtle full-frame ambient background, restyled neutral at low opacity |
| `youtube/*` | Only when we start YouTube |

For charts, use `components/charts/` (see `motion-kit.md`). Kept as files but not for current reels: polaroid/notebook/paper/starburst, product/discount/peel/tear/shine, split-screen/PiP, audio visualizers, cylinder/spinning text, Element caption styles (we use our `Captions`).

**Rendering:** `maps/spinning-globe` and other WebGPU Elements fail in the default headless renderer ("No WebGPU adapter available"); render with `--gl=angle --chrome-mode=chrome-for-testing`. Map Elements load remote tiles and images, so rendering needs network access.

## Already adapted (reuse these)

| Branded component | From | Notes |
|---|---|---|
| `components/elements/NumberCounter.tsx` | `charts/number-counter` | Inline count-up; inherits font and color from its parent. `start` + `countFrames`; sync with `useCue` |
| `components/elements/CircleMark.tsx` | `text/circle-marker` | Hand-drawn amber circle, `box="around"`. Give the circled text its own line with room on all sides, or the ellipse clips neighbouring words |
| `components/AmbientWaves.tsx` | `backgrounds/moving-waves` | E-format background motif (via `AmbientMotif`, navy shades, 15% opacity). Keep it barely visible |

## Using an Element in a post

1. Copy (don't move) the library file to `src/components/elements/<slug>.tsx`.
2. Replace every color with `colors.*` / `colors.diagram.*` and every font with `fonts.*` / `weights.*`; remove its own `loadFont`. The brand guard fails until this is done.
3. Use `typeScale` sizes and motion presets (`ease.*`, `durations.*`).
4. Use it inside a post scene within `layout.regions`; keep its `Interactive` props so Studio editing works.

## When the user adds a new Element in Studio

Studio drops `src/<slug>.element.tsx` + `src/<Name>Composition.tsx` and adds imports and entries to `Root.tsx`.

1. Move both files into the right `src/elements/<category>/`.
2. Add a `<Composition id="El-<Name>">` line to `ElementsGallery.tsx`, using the demo's `durationInFrames`.
3. Remove what Studio added to `Root.tsx`.
