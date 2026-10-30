# Unpack & Explain: Video Production Rules

Faceless explainer reels ("How things actually work") built with Remotion. Primary platform: Instagram Reels. YouTube Shorts later.
Full design rationale: `docs/specs/2026-10-29-video-brand-standards-design.md`.

## Repo map

- `ideas/`: **the content tracker** (replaces the old spreadsheet). One `ideas/idea-NN-slug/idea.md` per idea: YAML front matter (id, date, format, category, subcategory, status, link, hook, hook_formula, hook_score, question_score, companion_of, source, verify, metrics) + `## Script` table (Section | Voice-over | Visual) for reels or `## Slides` table (Slide | Headline | Body) for carousels + `## Caption`. `NN` = idea ID (numbers only). Once built, an idea becomes a post: its code, VO and render folders use the matching `post-NN-slug` name. `category` / `subcategory` must come from `ideas/categories.yml` (the fixed topic list; add new sub-categories there first) and group related ideas so topics don't repeat. After posting, set `link` to the live post URL. `ideas/README.md` (topics, schedule, performance, formats, how-to) is **generated**: never edit it by hand.
- `logo/`: master logo files. **Never edit.** Copy the SVGs you need into `video/public/brand/`.
- `instagram/`: state for the instagram-agent skills (`voice.md`, `swipe.md`, `profile.md`, `engage.md`; see Instagram skills). Skills read and write here, **not** `~/.claude/instagram/`.
- `docs/specs/` (design rationale; the skills pipeline is `2026-10-30-instagram-skills-pipeline-design.md`), `docs/plans/` (implementation plans, historical record: old paths inside are not updated).
- `video/`: the Remotion project. Run all npm/npx commands from here.
  - `src/brand/`: tokens, fonts, motion, layout (safe zones), voice config. No React here.
  - `src/components/`: shared branded components. Depend only on `src/brand/`.
  - `src/elements/`: original Remotion Elements library by category (reference only, see Remotion Elements).
  - `src/templates/Reel.tsx`: section sequencing, format rules, audio, captions.
  - `src/posts/post-NN-slug/`: `script.ts` (typed data) + `scenes/*.tsx` for that post only. Carousels use `slides.ts` instead of `script.ts`.
  - `src/templates/Carousel.tsx`: carousel slides (frame N = slide N+1), layouts per slide kind, footer.
  - `public/posts/post-NN/`: generated VO mp3s and `captions.json`.
  - `scripts/tts.ts`: generates VO + timestamps from `script.ts`.

## Commands (from `video/`)

- Preview: `npm run dev` (Remotion Studio)
- Typecheck + lint: `npm run lint` (run before saying any work is done)
- Content tracker: `npm run tracker` checks every `ideas/*/idea.md` (front matter, section order, "?" / "Congrats," / CTA / no "!", 100-130 words, https `link`, hook/question scores >= 50, carousel slide limits, `companion_of`, that a built reel's VO text matches its `src/posts/post-NN-slug/script.ts`, and that a built carousel's slides match its `slides.ts`) and regenerates `ideas/README.md`. Run it after editing any idea.
- Instagram checks: `npm run ig -- idea-NN-slug [--keywords "gps,satellites"]` runs the instagram-agent plugin's tools on one idea: `hookscore.py` (question card + hook, or carousel cover), `beats.py` at 150 wpm (reels), `caption.py` (feed-truncation box, hashtags, one ask, search terms) and `detect.py` (AI-text panel). Read-only; record `hook_formula` / `hook_score` / `question_score` in `idea.md` yourself. Needs the plugin installed (or `IG_SKILLS_DIR`); it sets `PYTHONUTF8=1`, without which the tools crash on Windows. Run the tools directly the same way: `PYTHONUTF8=1 python <skills>/ig-reel/hookscore.py --hook "one line"`.
- Unit tests: `npm test` (includes the brand guard: fails on any color literal or font-family string outside `src/brand/`)
- Logos: `npm run assets` regenerates `public/brand/avatar.svg` + `stacked.svg` from `logo/` (transparent, cropped)
- Voice-over for one section only: `npm run tts -- post-NN-slug --only=congrats` (comma-separated ids). Regenerates just those sections and keeps the rest of the VO you already approved; every generation sounds slightly different, so prefer this when fixing one line.
- Voice-over: `npm run tts -- post-NN-slug` writes `public/posts/<id>/vo/*.mp3` + `vo.json` (needs `ELEVENLABS_API_KEY` in `video/.env` and `voice.voiceId`). Without it, the reel uses estimated timing (2.5 words/s); a stale `vo.json` (script text changed) throws until TTS is re-run.
- VO bleed cleanup: `npm run vo:clean -- post-NN-slug` trims ElevenLabs stitching bleed off existing VO files without regenerating them (see Audio and captions). `npm run tts` already does this for every new take; running it twice is safe.
- QA audio (required before calling a reel done): `npx remotion render PostNN-Slug out/qa/mix.wav --codec=wav`, `npx remotion ffmpeg -y -i out/qa/mix.wav -ac 1 -ar 16000 -c:a pcm_s16le out/qa/mix16.wav`, then `python scripts/audio-bursts.py out/qa/mix16.wav`. It must print "No stray blips"; also listen across every section boundary.
- Brand sounds: `npm run brand-audio` generates the SFX + music bed once (needs `ELEVENLABS_API_KEY`).
- Safe-zone overlay: set `showGuides: true` in the Studio props panel, or pass `--props=./qa-guides.json` to `remotion still`
- QA stills: `npx remotion bundle` once, then `npx remotion still build PostNN-Slug out/qa/frame-N.png --frame=N --props=./qa-guides.json`
- QA motion (required before calling a reel done): `npx remotion render build PostNN-Slug out/seq --sequence --image-format=jpeg --scale=0.25`, then `python scripts/contact-sheet.py out/seq out/qa/sheet 15 32` and inspect every sheet, plus every 4th frame around each section boundary. Single stills miss overlaps that only happen in motion and transitions.
- Render: `npx remotion render PostNN-Slug out/post-NN-slug.mp4` (only when the user asks), then **always** master it: `npm run master -- out/post-NN-slug.mp4` → `out/post-NN-slug.master.mp4` (two-pass loudnorm to -14 LUFS / -1 dBTP, video copied untouched). Upload the `.master.mp4`. The raw mix sits around -21 LUFS, so an unmastered upload sounds quiet next to other reels.
- Cover still: `npx remotion still PostNN-Slug out/post-NN-slug-cover.png --frame=<n>`
- Carousel QA: `npx remotion render CarouselNN-Slug out/qa/carousel --sequence --image-format=png --props=./qa-guides.json` (guides: 120 px margin, slide center, the slide's regions) and inspect every PNG.
- Carousel render (only when the user asks): `npx remotion render CarouselNN-Slug out/post-NN-slug --sequence --image-format=png`; one slide: `npx remotion still CarouselNN-Slug out/post-NN-slug/slide-N.png --frame=<N-1>`.

## Formats

| Code | Format | Extra rules |
|---|---|---|
| E | Pure explainer | Standard anatomy |
| F | Explainer + failure story | Coral "WHEN IT FAILED" badge on the failure segment. Source on screen is mandatory |
| Q | Quick myth / fact | MYTH stamp (coral) on the myth, FACT stamp (teal) on the correction |
| C | Carousel | 1080x1350 slides, see Carousels. Usually a companion to a reel (`companion_of`) |

## Carousels

Swipe posts for ideas with steps or a list worth re-reading (saves and sends). Written with `/ig-carousel`, usually turned from a posted reel's mechanism by `/ig-repurpose`.

- **Slides table** in `idea.md`: `## Slides` with `Slide | Headline | Body`. 6-10 slides: 1 cover (6 words or fewer, the hook), 2 stake (also works as a second cover), then one idea per slide (headline 7 words or fewer, body 25 words or fewer), a recap slide (the one people screenshot), and a CTA slide with one ask. The tracker enforces the counts.
- **Look:** same brand as reels: dark only, token colors, diagrams in neutral line art with one amber key element, Poppins headlines, Inter body (>= 44 px readable text, >= 32 px source). Slide number (3/8) and the handle on every slide, small. Keep text clear of the outer 120 px. Source on the last content or recap slide.
- **Caption:** `/ig-caption` Job B (the caption carries the hook, since the cover used its six words). Alt text for the cover at minimum.
- **Build:** `src/templates/Carousel.tsx` renders a `CarouselNN-Slug` composition at 1080x1350, one frame per slide (design: `docs/specs/2026-10-30-carousel-renderer-design.md`). Per post:
  1. `src/posts/post-NN-slug/slides.ts`: `CarouselScript` with each slide's `kind` (`cover`, `content`..., `recap`, `cta`) and headline/body copied **verbatim** from `idea.md` (the tracker checks it), `coverHighlight` (one amber word on the cover), `source`, `verify`. Plus `slides.test.ts` asserting `validateCarousel` returns no errors or warnings.
  2. `scenes/*.tsx`: one visual per slide that needs one, drawn into `SlideCanvas` (neutral line art, one amber element). The recap and CTA slides have none (the template draws the numbered list + source, and the logo + teal handle).
  3. `index.tsx` exports `CarouselNN` (wraps `Carousel` with `visuals={{ 1: CoverVisual, ... }}`, keyed by slide number); register `CarouselNN-Slug` in `Root.tsx` with `durationInFrames={script.slides.length}`.
  4. Run the carousel QA render, `npm run lint`, `npm test`, `npm run tracker`; set `status: built`. Render the PNGs only when asked (`rendered`), upload them in order (`posted`).
- **Schedule:** one per week, on Wednesday.

## Platform specs

- 1080x1920, 30 fps, H.264 MP4, AAC 48 kHz. Length 35-52 s, 100-130 spoken words (including the question and congrats lines).
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

**Question -> Hook -> Setup -> Mechanism -> Payoff -> Congrats -> CTA.** Every reel, every format, no exceptions.

| Section | Who makes it | Script rule |
|---|---|---|
| **Question** | Template (`QuestionCard`) | Ask the viewer about the topic, ending in "?". E.g. "Do you know how GPS actually finds you?" |
| Hook, Setup, Mechanism, Payoff | Post scenes | As written in the script |
| **Congrats** | Template (`CongratsCard`, teal check + chime) | Starts with "Congrats," (comma, **not** "!"). E.g. "Congrats, you just learned how GPS finds you." With "!" the upbeat voice over-stresses "Congrats" and sounds off. |
| **CTA** | Template (`CtaCard`) | Exactly `brand.ctaLine`: "Follow Unpack and Explain for how things actually work." |

`script.ts` sets `topic` (e.g. "GPS"), which is colored amber on the question and congrats cards. `validateScript` enforces the order, the "?" and the "Congrats". Captions are hidden over the template cards because the cards already show the words.

1. **Frame 0:** the question card is already visible (no fade-in). Avatar logo sting finishes in < 1 s alongside it. The hook title appears when the hook section starts.
2. **Throughout (not CTA):** avatar watermark, burned-in captions (active word amber), motion at least every 2 s.
3. **Mechanism:** one idea per beat, shown visually and synced with `useCue`. **No on-screen text that repeats the voice-over**: captions already carry the words, so labels like numbered step badges are redundant (removed from post 2 after review). On-screen text is only for what the VO doesn't say: a number, a unit conversion, a source. `StepBadge` stays in `components/` for lists that are NOT spoken word-for-word.
4. **Before / on CTA:** `SourceTag` ("Source: ...") visible for the last 3 s.
5. **CTA card (3-4 s):** Stacked-Dark logo, tagline, handle (`brand.handle` = `@unpack_and_explain`).

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

## Memes

Meme templates live in `video/public/memes/` (the user's collection). They are **optional seasoning, not a format element**: most reels should have none. Off-limits images were deleted from the folder on 2026-10-29 (sexual, political / real politicians, war, violence and weapons, bullying, tragedy, self-harm, profanity, mocking groups / disability / religion).

**Rules (enforced by `validateScript` where possible):**
- **At most one meme per reel**, and only when it genuinely lands a joke. Zero is a perfectly good number.
- Only memes from the approved catalog `src/brand/memes.ts` (each entry has a `useFor` note). To use a new one, look at it first, check it against the off-limits list, then add it to the catalog.
- Only in the hook, setup or payoff (`MEME_SECTIONS`). **Never during the mechanism** (the explanation itself), never on the question / congrats / CTA cards.
- At most 2.5 s (default 2 s), shown right after a spoken cue word, in a natural pause **after** the point has landed, and it must finish before the next visual beat.
- Never on the cover frame or thumbnail, never as the hook.
- Don't add our own text on top of a meme that already has text.
- Real celebrity photos (Drake, movie stills of actors) are not approved by default; prefer drawn / cartoon templates. Likeness and copyright risk is lower for brief commentary, but if a post ever gets a claim, remove the meme and re-render.

**How to add one:** set `meme: { id, section, cue, seconds? }` in `script.ts` (e.g. post 2: `{ id: "they-dont-know", section: "payoff", cue: "internet", seconds: 2 }`). The template renders it with `MemeCut` (dimmed scene, framed card, slight tilt, pop in) via `templates/MemeMoment.tsx`. Check the moment in the contact sheet: the meme must not overlap the next beat.

## Audio and captions

- VO: ElevenLabs premade voice **Brian** (`nPczCjzI2devNBz1zQrb`), set in `src/brand/voice.ts`. Never switch voice or settings per post. Changing it means re-running `npm run tts` for every post you want to re-render.
- **Tone: upbeat and warm**, never flat. `voice.ts` settings (stability 0.35, style 0.45) give an energetic read; scripts help it with punctuation: "?" on the question, short sentences, and **no "!"** (it makes the voice over-emphasize the word before it). If a generated line sounds flat, rephrase or re-run TTS for that post; don't change the settings per post.
- The API key is restricted (no `voices_read` / `user_read`), so voices can't be listed from here; get voice IDs from the ElevenLabs website.
- **Licensing:** the account is on the ElevenLabs free tier (the Music API returns "not available for free users"). Free-tier output is generally non-commercial and needs attribution; confirm in ElevenLabs' current terms. Before monetizing, running ads or doing brand deals, upgrade to a paid plan for a commercial license, then regenerate the VO and SFX so every published file was made under that license.
- **Stitching bleed (known ElevenLabs glitch):** `tts.ts` sends `previous_text` / `next_text` so sections sound continuous, but sometimes the first sound of the *next* section leaks onto the end of a file, after the final silence. In the reel it plays ~0.6 s before the next section's real first word and sounds like a stutter ("E... Each", "...Follow"). Post 2 had it on the question, setup and congrats files. `scripts/lib/voClean.ts` detects a < 300 ms burst after a silent gap (only after the last word's start, so a real short last word is never cut), cuts it inside the silence and fixes `vo.json`. Never bypass this step, never hand-edit VO mp3s, and never "fix" a stutter by moving sections around: run `npm run vo:clean`, then the QA audio check.
- Generate VO per section with timestamps via `scripts/tts.ts`. Section length = real audio length + tail pad. The script's "Time" column is guidance only.
- Captions are JSON in the `Caption` type from `@remotion/captions`, built from TTS timestamps.
- Use `<Audio>` from `@remotion/media`.
- **Brand sound library** (`src/brand/audio.ts`): `pop` (logo sting, frame 0), `chime` (congrats card). **No sound on section changes**: a whoosh there landed on the end of every voice line and sounded odd, so it was removed. Plus and one instrumental music bed (volume 0.1, ~ -20 dB under VO, 1 s fade in/out). Generated once via ElevenLabs with `npm run brand-audio` into `public/brand/audio/` + `library.json`; existing files are kept so every reel sounds the same (`--force` regenerates, which changes the brand sound for all re-renders). The Reel template places all of these automatically (`templates/audioCues.ts`); posts don't add their own music. Reels render silently if the library hasn't been generated.
- Copyright: only ElevenLabs-generated audio (commercial use requires a paid plan) or audio we synthesize. No downloaded tracks, no commercial songs.
- API keys live in `video/.env`. Never commit `.env` or print keys.

## Instagram skills

The `instagram-agent` plugin (13 skills, `/ig-*`) runs the account around the Remotion build. Install it with `/plugin install instagram-agent@instagram-agent-skill`. Use the skills at every stage below; don't do these stages from memory.

**Overrides: where a skill disagrees with this file, this file wins.**
- State lives in `instagram/` (voice.md, swipe.md, profile.md, engage.md), not `~/.claude/instagram/`. The skills' `log.md` = the hook fields and metrics in each `idea.md`; their `plan.md` = the schedule in `ideas/README.md`. Read `instagram/voice.md` before writing anything.
- Reel anatomy stays (question card first, logo sting, congrats, fixed CTA), even though `/ig-reel` says "cut the intro, no logo sting". Instead, the question card must score `hookscore.py` 50+ and aim for 7 words or fewer with something concrete.
- Our safe zones, layout regions and 150 wpm (`voice.wordsPerSecond` 2.5) win over the skills' safe zones and 165 wpm. The beat sheet's "beat over 4 s" flag is met by visual changes (motion every 2 s), not only by splitting lines.
- `/ig-human` and `detect.py` results on scripts are **suggestions**: show the user the proposed rewrites; never change script text or facts without approval. BURSTINESS is low on our short, even explainer sentences: treat it as advisory. Captions, comments, replies and DMs do go through `/ig-human` before the user sees them.
- Never post, like, follow, comment or DM on the user's behalf, never log into Instagram, never ask for a password, never scrape. Every skill ends with copy-ready text the user posts by hand. `/ig-viral` reads in the user's own Chrome with the user present (claude-in-chrome), at human speed, about 10 accounts.
- Hashtags: 5 or fewer, at the bottom, never inside the first 125 characters. No links in captions.
- Never invent numbers, results or quotes; leave `{{number}}` and add it to `verify`.

**Pipeline**

| # | Stage | When | Skills | Output |
|---|---|---|---|---|
| 0 | Setup | once | `/ig-profile` (score out of 100, rewrites) | `instagram/voice.md` reviewed by the user, `instagram/profile.md`. Re-run `/ig-profile` monthly |
| 1 | Research | monthly | `/ig-viral` (outlier multiple over each account's median, hook formulas) | `instagram/swipe.md` |
| 2 | Review + plan | weekly | `/ig-audit` on posted ideas (rank by multiple and sends per reach; separate hook problems from profile problems), then `/ig-plan` | new or moved ideas and dates in `ideas/`; the 10-account engagement list in `instagram/engage.md`. The user approves the week |
| 3 | Ideas | ongoing | `/ig-plan`, `/ig-reply` (a comment question many people share becomes an idea, formula #16), `/ig-repurpose` (a posted reel's mechanism becomes a companion carousel) | `ideas/idea-NN-slug/idea.md` under an existing sub-category |
| 4 | Script a reel | per reel | `/ig-reel`: 3 hooks from different `hooks.json` formulas, scored; best 50+; beat sheet. Then `/ig-human` | `## Script` table, `hook_formula`, `hook_score`, `question_score`. The user approves the script |
| 4b | Script a carousel | per carousel | `/ig-carousel`, then `/ig-human` | `## Slides` table. The user approves the copy |
| 5 | Caption | per post | `/ig-caption` (Job A for reels: ask + context + search terms; Job B for carousels: the hook), then `/ig-human`; `npm run ig` lint shows READY | `## Caption` |
| 6 | Build | per post | Per-post workflow below (reels); Carousels section (carousels) | MP4 / slide PNGs, rendered only when asked |
| 7 | Post day | posting days | `/ig-story` (3-5 frames: reel frames or diagrams, since we're faceless; a quiz suits myth/fact posts) | copy-ready frames. The user posts |
| 8 | Engage | daily, 20 min | `/ig-comment` (list in `engage.md`, two options per post), `/ig-reply` (our threads, first hour after posting), `/ig-dm` (keyword delivery, collab pitches, two follow-ups max) | copy-ready text. The user posts or sends |
| 9 | Measure | after posting | fill `metrics` from insights (views, reach, nonfollower_pct, hold_3s, watch_pct, likes, comments, shares, saves, follows), run the tracker | feeds stage 2 |

**Cadence:** reels Mon/Tue/Thu/Fri, carousel Wed, stories on posting days, engagement round daily.

| Skill | Use it for |
|---|---|
| `/ig-reel` | Hooks, script and beat sheet for a reel (stage 4) |
| `/ig-carousel` | Slide copy for a carousel (stage 4b) |
| `/ig-caption` | Every caption (stage 5) |
| `/ig-human` | Cleaning anything written before the user sees it (stages 4, 5, 7, 8) |
| `/ig-viral` | Monthly niche research into `swipe.md` (stage 1) |
| `/ig-plan` | The weekly plan and engagement list (stage 2) |
| `/ig-audit` | Weekly post-mortem on posted ideas (stage 2) |
| `/ig-repurpose` | One reel or source into companion posts (stage 3) |
| `/ig-profile` | Profile score and rewrites (stage 0, monthly) |
| `/ig-story` | Story frames on posting days (stage 7) |
| `/ig-comment` | Comments on other accounts' posts (stage 8) |
| `/ig-reply` | Replies under our posts; questions become ideas (stages 3, 8) |
| `/ig-dm` | Keyword delivery, warm messages, collab pitches (stage 8) |

## Per-post workflow

1. Script it with `/ig-reel` (pipeline stage 4) into `ideas/idea-NN-slug/idea.md` (`## Script` table, `## Caption` from `/ig-caption`, `verify` list; layout as idea 2), run `npm run ig -- idea-NN-slug`, record `hook_formula` / `hook_score` / `question_score`, set `status: scripted`, and run `npm run tracker`. Move `status` along as it progresses (built → rendered → posted); after posting add `link` (the live post URL) and fill in `metrics`.
2. Create `src/posts/post-NN-slug/script.ts` with the VO text copied **verbatim**, plus a `script.test.ts` asserting `validateScript` returns no errors or warnings. Rules: section order, `source` required, `hookText` <= 28 chars (2 lines), CTA voiceover exactly `brand.ctaLine`, F posts need `failureSection`, 100-130 spoken words. List "verify" facts in `verify`.
3. Run TTS -> VO + captions (bleed is trimmed automatically; check the "trimmed" lines it prints). Or build with estimated timing first.
4. Build scenes (`hook`, `setup`, `mechanism`, `payoff`) from the Visual column with shared components; bespoke scene components live only inside the post folder. The template adds the hook title, failure badge, watermark, captions, source line and CTA card automatically. Sync visuals to the VO with `useCue("word", fallbackFraction)`.
5. Export `PostNN` (wrapping `Reel` with the scene map) from `index.tsx` and register `PostNN-Slug` in `src/Root.tsx` with `calculateMetadata={calculateReelMetadata}`.
6. Run `npm run lint`, review in Studio against the QA checklist, then render when asked.

## QA checklist (every reel)

- [ ] Question card visible at frame 0; congrats line before the CTA; total length 35-52 s
- [ ] Nothing outside safe zones; cover readable in 4:5 crop
- [ ] Readable text >= 44 px, sources >= 32 px
- [ ] Only token colors; max 2-3 hues per scene; coral only where allowed
- [ ] Captions in sync with VO
- [ ] No stray blips or stutters at section boundaries (`scripts/audio-bursts.py` passes, and listened through)
- [ ] Source line shown; units metric + imperial where relevant
- [ ] CTA wording, tagline and handle correct
- [ ] Loudness ~ -14 LUFS, no clipping
- [ ] Hook and question card score 50+ (`npm run ig`); caption lint READY (5 or fewer hashtags, none in the first 125 characters, one ask); AI-text findings shown to the user
- [ ] `npm run lint` passes; `npm run tracker` passes and the post's `status` is updated

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
- Don't use more than one meme per reel, don't use memes outside the approved catalog, and never put one in the mechanism.
- Don't put text or key visuals in the IG UI zones (top 250 / bottom 350 / right 150).
- Don't add a title-card intro or any blank frames before the hook.
- Don't rewrite, shorten or "improve" script text without asking.
- Don't modify anything in `logo/` or redefine brand values inside a post folder.
- Don't render, commit or push unless the user asks.
- Don't spawn subagents (including subagent-driven-development or reviewer agents). Execute plans and reviews directly in the main session to keep cost down.
