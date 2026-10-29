# Unpack & Explain: Video Production Rules

Faceless explainer reels ("How things actually work") built with Remotion. Primary platform: Instagram Reels. YouTube Shorts later.
Full design rationale: `docs/superpowers/specs/2026-10-29-video-brand-standards-design.md`.

## Repo map

- `Posts/post_N/script.md`: approved scripts (source of truth for VO text, visuals, sources, caption).
- `Unpack_and_Explain_Tracker.xlsx`: content plan, all scripts, brand tab, metrics. Read it for format and schedule context.
- `logo/`: master logo files. **Never edit.** Copy the SVGs you need into `video/public/brand/`.
- `video/`: the Remotion project. Run all npm/npx commands from here.
  - `src/brand/`: tokens, fonts, motion, layout (safe zones), voice config. No React here.
  - `src/components/`: shared branded components. Depend only on `src/brand/`.
  - `src/elements/`: original Remotion Elements library by category (reference only, see Remotion Elements).
  - `src/templates/Reel.tsx`: section sequencing, format rules, audio, captions.
  - `src/posts/post-NN-slug/`: `script.ts` (typed data) + `scenes/*.tsx` for that post only.
  - `public/posts/post-NN/`: generated VO mp3s and `captions.json`.
  - `scripts/tts.ts`: generates VO + timestamps from `script.ts`.

## Commands (from `video/`)

- Preview: `npm run dev` (Remotion Studio)
- Typecheck + lint: `npm run lint` (run before saying any work is done)
- Unit tests: `npm test` (includes the brand guard: fails on any color literal or font-family string outside `src/brand/`)
- Logos: `npm run assets` regenerates `public/brand/avatar.svg` + `stacked.svg` from `logo/` (transparent, cropped)
- Voice-over: `npm run tts -- post-NN-slug` writes `public/posts/<id>/vo/*.mp3` + `vo.json` (needs `ELEVENLABS_API_KEY` in `video/.env` and `voice.voiceId`). Without it, the reel uses estimated timing (2.5 words/s); a stale `vo.json` (script text changed) throws until TTS is re-run.
- Brand sounds: `npm run brand-audio` generates the SFX + music bed once (needs `ELEVENLABS_API_KEY`).
- Safe-zone overlay: set `showGuides: true` in the Studio props panel, or pass `--props=./qa-guides.json` to `remotion still`
- QA stills: `npx remotion bundle` once, then `npx remotion still build PostNN-Slug out/qa/frame-N.png --frame=N --props=./qa-guides.json`
- QA motion (required before calling a reel done): `npx remotion render build PostNN-Slug out/seq --sequence --image-format=jpeg --scale=0.25`, then `python scripts/contact-sheet.py out/seq out/qa/sheet 15 32` and inspect every sheet, plus every 4th frame around each section boundary. Single stills miss overlaps that only happen in motion and transitions.
- Render: `npx remotion render PostNN-Slug out/post-NN-slug.mp4` (only when the user asks)
- Cover still: `npx remotion still PostNN-Slug out/post-NN-slug-cover.png --frame=<n>`

## Formats

| Code | Format | Extra rules |
|---|---|---|
| E | Pure explainer | Standard anatomy |
| F | Explainer + failure story | Coral "WHEN IT FAILED" badge on the failure segment. Source on screen is mandatory |
| Q | Quick myth / fact | MYTH stamp (coral) on the myth, FACT stamp (teal) on the correction |

Carousels are out of scope for this project for now.

## Platform specs

- 1080x1920, 30 fps, H.264 MP4, AAC 48 kHz. Length 30-45 s, 90-110 spoken words.
- **Safe zones:** top 250 px, bottom 350 px, left 80 px, right 150 px. Content box is x 80-930, y 250-1570. (Bottom 350 = organic Reels overlay: username, 2-line caption, audio label, plus margin. Meta's ~670 px figure is for ads only; revisit if we run these as ads.)
- **Screen regions** (`layout.regions`): visual 360-1230 (hook title + scene), captions 1250-1470, source 1490-1560. Watermark (avatar mark, 25% opacity) sits top-left at y 292. Scene drawings go inside `SceneCanvas` (clipped to the visual region); text positions must stay inside `layout.regions`.
- **Centering:** the safe area is lopsided (left 80 / right 150), so its center (x 505) is NOT the frame center (x 540). Anything centered (text, cards, badges) uses `layout.column` (x 150-930, centered on 540), never `layout.content`. Diagrams are drawn around x 540, and `SceneCanvas` clips to the same column. The `showGuides` overlay draws the frame-center line and the column; check centered items against it.
- **Cover frame:** title + key visual inside the centered 1080x1350 area (4:5 feed crop).
- **Audio:** -14 LUFS integrated, true peak <= -1 dBTP, music ~20 dB under VO.
- Layout values derive from composition width/height so a 16:9 variant can be added later.

## Brand tokens

All colors come from `video/src/brand/tokens.ts`. **Never write a hex value anywhere else.**

| Token | Hex | Use |
|---|---|---|
| bg.base / bg.raised | #0f172a / #1e293b | Radial background (raised in center), cards |
| diagram.stroke / soft / faint / fill | #e2e8f0 / #94a3b8 / #475569 / #1e293b | **All scene diagrams**: main line art / secondary lines, rings / dashed guides, orbits / object fills |
| amber.500 (300 / 600) | #f59e0b (#fcd34d / #d97706) | Key element: the ONE thing to notice per scene (pin, number, result), active caption word, hook highlight |
| teal.400 | #2dd4bf | **Brand only**: logo, CTA handle, FACT stamp, "correct" marks |
| teal.100 / 300 / 600 / 700 | #99f6e4 / #5eead4 / #0d9488 / #0f766e | Reserved for brand elements (shading/glows of teal items) |
| coral | #FF5A5F | Only failure segments, MYTH, "wrong" marks |
| text.primary / secondary / muted | #f8fafc / #cbd5e1 / #94a3b8 | Main text / tagline, secondary / sources |

**Color roles (design system rule):**
- Diagrams are **neutral line art** (`colors.diagram.*`). Never draw scene objects in teal: the logo is teal, so teal diagrams make everything blend and the brand stops standing out.
- **Amber = one key element per scene** (per beat). If two things are amber, one of them shouldn't be.
- **Teal = brand moments only**, so it stays rare and recognizable.
- Icons in `src/components/icons/` are neutral by default; only `PinIcon` (and the clock's minute hand) are amber because they *are* the key marker.
- Theme is **dark only**.
- Tagline is **"How things actually work"**. Spoken CTA: "Follow Unpack and Explain for how things actually work."
- Logo: Avatar mark for sting + watermark, Stacked-Dark for the CTA card. Never recolor, stretch, crop or add effects to the logo.

## Typography

| Role | Font | Size |
|---|---|---|
| Hook / big title | Poppins SemiBold | 96-120 px, max 2 lines |
| Scene title | Poppins SemiBold | 72 px |
| Caption | Inter SemiBold | 64 px, 1-2 lines |
| Label / step | Inter Medium | 44-48 px |
| Source line | Inter Medium | 32 px |

Load fonts only through `src/brand/fonts.ts` (`@remotion/google-fonts`). Sentence case; only stamps/badges may be uppercase.

## Reel anatomy

Hook -> Setup -> Mechanism -> Payoff -> CTA.

1. **Frame 0:** hook text is already visible. Avatar logo sting finishes in < 1 s alongside it.
2. **Throughout (not CTA):** avatar watermark, burned-in captions (active word amber), motion at least every 2 s.
3. **Mechanism:** one idea per beat, shown visually and synced with `useCue`. **No on-screen text that repeats the voice-over**: captions already carry the words, so labels like numbered step badges are redundant (removed from post 2 after review). On-screen text is only for what the VO doesn't say: a number, a unit conversion, a source. `StepBadge` stays in `components/` for lists that are NOT spoken word-for-word.
4. **Before / on CTA:** `SourceTag` ("Source: ...") visible for the last 3 s.
5. **CTA card (3-4 s):** Stacked-Dark logo, tagline, handle (`brand.handle`, placeholder until confirmed).

## Motion

- Animate only with `useCurrentFrame()` + inline `interpolate()` in the `style` prop. Use `scale` / `translate` / `rotate` style properties, not `transform` strings.
- Use easing presets from `src/brand/motion.ts`: `smooth` (default), `out`, `pop` (overshoot, logo and stamps only).
- Entrances 10-15 frames. Section transitions use the `dip` presentation (`src/components/dip.tsx`: fade out, then fade in). Never crossfade two scenes: their visuals and text stack on top of each other.
- Wrap editable elements in `Interactive.*` with a meaningful `name` so Studio edits write back to code.
- Shared components read tokens (locked brand values). In bespoke scenes, keep layout and keyframes inline in `Interactive.*` styles so Studio can edit them, but colors, fonts and easings still come from `src/brand/`.
- Name timing keys `crossfade`, not `transition`: the Remotion ESLint rule flags `transition` as a CSS transition.

## Remotion Elements

Elements (remotion.dev/elements) are copy-in source snippets, not npm packages. They are added **only through Studio** (right inspector → Actions → **Browse Elements** → pick → confirm); there is no CLI, so an agent can't add them. All 40 catalog Elements we use are already installed (deps in `package.json`, assets in `public/elements/`).

**Two layers, kept separate:**

| Layer | Location | Rules |
|---|---|---|
| **Library** (original, unbranded) | `src/elements/<category>/<slug>.element.tsx` + `<Name>Composition.tsx` demo | Reference only. Never edit, never import from a post. Excluded from the brand guard. Previewable in Studio under the **Elements** folder (ids `El-<Name>`), registered by `src/elements/ElementsGallery.tsx`. |
| **Branded copy** (what posts use) | `src/components/elements/<slug>.tsx` | Adapted to our tokens (below). Subject to the brand guard. |

Categories: `audio`, `backgrounds`, `captions`, `charts`, `effects`, `layouts`, `maps`, `overlays`, `storytelling`, `text`, `youtube`.

**Which Elements fit this channel:**

| Element (library path) | Use it for |
|---|---|
| `charts/number-counter` | Big stats ("~30 satellites", "$440M in 45 minutes") |
| `charts/horizontal-bar-chart`, `vertical-bar-chart`, `line-chart`, `pie-chart` | Data comparisons in E posts |
| `text/circle-marker`, `text-marker`, `strike-through`, `crossed-off` | Emphasis; Q posts (strike the myth, mark the fact) |
| `storytelling/news-article-highlight` | F posts: citing the real incident / investigation |
| `maps/spinning-globe`, `maps/map-flyover` | Geography (cables, GPS, SWIFT, flights) |
| `backgrounds/moving-waves` | Optional subtle full-frame ambient background, restyled neutral at low opacity |
| `youtube/*` | Only when we start YouTube |

Kept but not for current reels: lower thirds (faceless channel), polaroid/notebook/paper/starburst, product/discount/peel/tear/shine, split-screen/PiP, audio visualizers, cylinder/spinning text, Element caption styles (we use our `Captions`), social safe zones (we use `SafeZoneGuide`).

**Rendering notes:** `maps/spinning-globe` (and other WebGPU Elements) fail in the default headless renderer ("No WebGPU adapter available"); render with `--gl=angle --chrome-mode=chrome-for-testing`. Map Elements load remote tiles/images, so rendering needs network access.

**Already adapted (reuse these, don't re-adapt):**

| Branded component | From Element | Notes |
|---|---|---|
| `components/elements/NumberCounter.tsx` | `charts/number-counter` | Inline count-up; inherits font/color from parent. `start` + `countFrames`; sync with `useCue` |
| `components/elements/CircleMark.tsx` | `text/circle-marker` | Hand-drawn amber circle, `box="around"`. Give the circled text its own line with room on all sides, or the ellipse clips neighbouring words |
| `components/AmbientWaves.tsx` | `backgrounds/moving-waves` | Template-level background in every reel (navy shades, 15% opacity). Keep it barely visible |

**To use an Element in a post (required steps):**
1. Copy (don't move) the library file to `src/components/elements/<slug>.tsx`.
2. Replace every color with `colors.*` / `colors.diagram.*` and every font with `fonts.*` / `weights.*`; remove its own `loadFont`. The brand guard test fails until this is done.
3. Use `typeScale` sizes and motion presets (`ease.*`, `durations.*`).
4. Use it inside a post scene within `layout.regions`; keep its `Interactive` props so Studio editing works.

**When the user adds a new Element in Studio:** Studio drops `src/<slug>.element.tsx` + `src/<Name>Composition.tsx` and adds imports/entries to `Root.tsx`. Move both files into the right `src/elements/<category>/`, add a `<Composition id="El-<Name>">` line to `ElementsGallery.tsx` (use the demo's `durationInFrames`), and remove what Studio added to `Root.tsx`. Root only registers posts + `<ElementsGallery />`.

## Audio and captions

- VO: ElevenLabs, the single voice in `src/brand/voice.ts`. Never switch voice or settings per post.
- Generate VO per section with timestamps via `scripts/tts.ts`. Section length = real audio length + tail pad. The script's "Time" column is guidance only.
- Captions are JSON in the `Caption` type from `@remotion/captions`, built from TTS timestamps.
- Use `<Audio>` from `@remotion/media`.
- **Brand sound library** (`src/brand/audio.ts`): `whoosh` (section change), `pop` (logo sting, frame 0), `chime` (CTA card) and one instrumental music bed (volume 0.1, ~ -20 dB under VO, 1 s fade in/out). Generated once via ElevenLabs with `npm run brand-audio` into `public/brand/audio/` + `library.json`; existing files are kept so every reel sounds the same (`--force` regenerates, which changes the brand sound for all re-renders). The Reel template places all of these automatically (`templates/audioCues.ts`); posts don't add their own music. Reels render silently if the library hasn't been generated.
- Copyright: only ElevenLabs-generated audio (commercial use requires a paid plan) or audio we synthesize. No downloaded tracks, no commercial songs.
- API keys live in `video/.env`. Never commit `.env` or print keys.

## Per-post workflow

1. Read `Posts/post_N/script.md` (and the tracker row for format/source notes).
2. Create `src/posts/post-NN-slug/script.ts` with the VO text copied **verbatim**, plus a `script.test.ts` asserting `validateScript` returns no errors or warnings. Rules: section order, `source` required, `hookText` <= 28 chars (2 lines), CTA voiceover exactly `brand.ctaLine`, F posts need `failureSection`, 90-110 spoken words. List "verify" facts in `verify`.
3. Run TTS -> VO + captions (or build with estimated timing first).
4. Build scenes (`hook`, `setup`, `mechanism`, `payoff`) from the Visual column with shared components; bespoke scene components live only inside the post folder. The template adds the hook title, failure badge, watermark, captions, source line and CTA card automatically. Sync visuals to the VO with `useCue("word", fallbackFraction)`.
5. Export `PostNN` (wrapping `Reel` with the scene map) from `index.tsx` and register `PostNN-Slug` in `src/Root.tsx` with `calculateMetadata={calculateReelMetadata}`.
6. Run `npm run lint`, review in Studio against the QA checklist, then render when asked.

## QA checklist (every reel)

- [ ] Hook text visible at frame 0; total length 30-45 s
- [ ] Nothing outside safe zones; cover readable in 4:5 crop
- [ ] Readable text >= 44 px, sources >= 32 px
- [ ] Only token colors; max 2-3 hues per scene; coral only where allowed
- [ ] Captions in sync with VO
- [ ] Source line shown; units metric + imperial where relevant
- [ ] CTA wording, tagline and handle correct
- [ ] Loudness ~ -14 LUFS, no clipping
- [ ] `npm run lint` passes

## Do

- Reuse shared components; extend them in `src/components/` when a pattern appears in a second post.
- Keep one idea per scene and build the frame around the single thing the viewer should notice first.
- Keep diagrams sparse: when a new beat starts, fade out the geometry from the previous beat (e.g. lines fade once arcs take over). Prefer partial arcs over full circles, keep a single amber focal point, and don't let lines radiate from under an icon (it reads as clutter). Check the busiest frame at full size.
- Draw visuals as code (SVG / shapes / icons) in neutral `colors.diagram.*`, with amber only on the key element.
- Keep facts exactly as scripted. Flag anything marked "verify" to the user before rendering.
- Keep each file focused; split scenes into their own files.

## Don't

- Don't hardcode colors, fonts, sizes, safe-zone offsets or easing curves outside `src/brand/`.
- Don't use CSS transitions/animations or Tailwind animation classes (they don't render).
- Don't use stock footage, AI imagery, emoji as graphics, or light backgrounds.
- Don't put text or key visuals in the IG UI zones (top 250 / bottom 350 / right 150).
- Don't add a title-card intro or any blank frames before the hook.
- Don't rewrite, shorten or "improve" script text without asking.
- Don't modify anything in `logo/` or redefine brand values inside a post folder.
- Don't render, commit or push unless the user asks.
- Don't spawn subagents (including subagent-driven-development or reviewer agents). Execute plans and reviews directly in the main session to keep cost down.
