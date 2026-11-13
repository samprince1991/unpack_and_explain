# Unpack & Explain: Video Production Rules

Faceless explainer reels ("How things actually work") built with Remotion. Primary platform: Instagram Reels. The same reels also go up as YouTube Shorts (from 2026-11-10).

## Read before working on

| Task | Doc |
|---|---|
| 3D, models, cameras, worlds, stale clips | `docs/blender.md` |
| Scene motion, transitions, scene styles, charts | `docs/motion-kit.md` |
| Voice-over, captions, sound effects, licensing | `docs/audio.md` |
| Carousels | `docs/carousels.md` |
| Remotion Elements | `docs/remotion-elements.md` |
| Any Instagram stage or `/ig-*` skill | `docs/instagram-pipeline.md` |
| Which model / subagent does a step | `docs/model-tiers.md` |
| Why something is built this way, before changing it | `docs/design-decisions.md` |

## Repo map

- `ideas/`: **the content tracker**. One `ideas/idea-NN-slug/idea.md` per idea: YAML front matter (id, date, format, topic, category, subcategory, status, link, hook, hook_formula, hook_score, question_score, companion_of, source, verify, metrics, youtube) + for reels a `## Spine` table (Part | Job), a `## Script` table (Section | Voice-over | Visual) and a `## Cold read` (About / Asks / Answer), or a `## Slides` table for carousels; then `## Caption`. `NN` = idea ID. Once built, an idea becomes a post: its code, VO and render folders use the matching `post-NN-slug` name. `category` / `subcategory` must come from `ideas/categories.yml` (add new sub-categories there first). `ideas/README.md` is **generated**: never edit it by hand.
- `logo/`: master logo files. **Never edit.** `npm run assets` copies what the video needs.
- `instagram/`: state for the instagram-agent skills (`voice.md`, `swipe.md`, `profile.md`, `engage.md`). Skills read and write here, **not** `~/.claude/instagram/`.
- `blender/`: headless Blender scripts, procedural models in `blender/models/`, worlds in `blender/world/`. Colors only from the generated `blender/tokens.json`; never write color values here (the brand guard scans it).
- `docs/`: the reference docs above.
- `video/`: the Remotion project. **Run all npm/npx commands from here.**
  - `src/brand/`: tokens, fonts, motion, layout (safe zones), voice, audio, models. No React here.
  - `src/components/`: shared branded components. Depend only on `src/brand/`.
  - `src/elements/`: original Remotion Elements library (reference only).
  - `src/kit/`: Studio previews of the shared pieces. Posts never import from here.
  - `src/templates/`: `Reel.tsx`, `Carousel.tsx`, `Cover.tsx`, validation, timing.
  - `src/posts/post-NN-slug/`: `script.ts` (or `slides.ts` for carousels) + `scenes/*.tsx` for that post only.
  - `src/Root.tsx`: registers compositions in the `Reels`, `Covers` and `Carousels` folders, in number order, with each `id` written inline (`scripts/lib/qaAudio.ts` searches for it).
  - `public/posts/post-NN-slug/`: `vo/` + `vo.json`, `sfx/` + `sfx.json`, `3d/` (Blender renders, gitignored).
  - `public/models/*.glb`: the approved 3D models.
  - `out/`: renders (gitignored), one `out/post-NN-slug/` folder per post, plus `out/qa/` and `out/seq/` for checks.

## Commands (from `video/`)

| Command | What it does |
|---|---|
| `npm run dev` | Remotion Studio |
| `npm run lint` | Typecheck + lint. Run before saying any work is done |
| `npm test` | Unit tests, including the brand guard (fails on any color or font literal outside `src/brand/`) |
| `npm run tracker` | Checks every `idea.md` (format, words, scores, links, slide limits, that VO and slides match the post's code) and regenerates `ideas/README.md`. Run after editing any idea |
| `npm run ig -- idea-NN-slug` | Instagram checks on one idea, read-only (`docs/instagram-pipeline.md`) |
| `npm run assets` | Regenerates `public/brand/avatar.svg` + `stacked.svg` from `logo/` |
| `npm run tts -- post-NN-slug [--only=congrats]` | Writes VO + `vo.json` (needs `ELEVENLABS_API_KEY` in `video/.env`). Every take sounds different, so use `--only` when fixing one line. Without VO the reel uses estimated timing; a stale `vo.json` throws until TTS is re-run |
| `npm run vo:clean -- post-NN-slug` | Trims stitching bleed off existing VO. `tts` already does this; safe to run twice |
| `npm run vo:tighten -- post-NN-slug` | Shortens pauses between words over 450 ms to 400 ms (cuts only inside silence) and shifts the captions. For a reel just over 52 s; re-run `npm run blender` after it |
| `npm run sfx -- post-NN-slug [--only=name] [--force]` | Generates the post's topic sounds; keeps any whose prompt, length and model still match |
| `npm run brand-audio` | Generates missing shared sounds. `--music` for the bed: ask the user first (`docs/audio.md`) |
| `npm run blender -- post-NN-slug` | Renders the post's 3D clips, skipping up-to-date ones. Needs Blender 5.3 (`BLENDER_PATH` in `video/.env`). Flags: `--preview` (25% size, never replaces a full render), `--only=cover,opener,hook,mechanism`, `--force`, `--workers=N` (default 3) |
| `npm run blender -- post-NN-slug --frames` | Test stills at full size to `out/blender-frames/`: each clip's first, last and beat frames, or `--frames=120,240`. Never touches clips or the manifest |
| `npm run blender -- --selftest` / `kit-blender` | Checks the install / renders the Kit sample |
| `npm run model:add -- <raw.glb> --id <id>` | Cleans a model, writes `public/models/<id>.glb`, adds a TODO stub to `models.ts`, renders previews to `out/models/<id>/`. `npm test` fails until the stub is filled in |
| `npm run model:qc [-- <id>]` | Geometry QC (`docs/blender.md`). Also runs inside `model:add` and before every clip |
| `npm run cover -- post-NN-slug` | 3D cover to `out/post-NN-slug/post-NN-slug-cover.png` (upload with "Edit cover"), plus the profile-grid preview `out/qa/cover-grid.png`. Cover rules: `docs/blender.md` "Cover" |
| `npm run qa:audio -- post-NN-slug` | Renders voice, SFX and mix stems to `out/qa/`. Must print "No stray blips" and, with a sound plan, "SFX levels OK" (every cue at least 8 dB under the voice). Then listen to `out/qa/mix.wav` across every section boundary and cue |
| `npm run master -- out/post-NN-slug/post-NN-slug.mp4` | Two-pass loudnorm to -14 LUFS / -1 dBTP, video untouched. Writes `.master.mp4` next to the input |

**Render a reel:** `npx remotion render PostNN-Slug out/post-NN-slug/post-NN-slug.mp4`, then **always** master it and upload the `.master.mp4`. The raw mix sits around -21 LUFS, so an unmastered upload sounds quiet next to other reels.

**QA renders:**
- Safe-zone overlay: `showGuides: true` in the Studio props panel, or `--props=./qa-guides.json`.
- Stills: `npx remotion bundle` once, then `npx remotion still build PostNN-Slug out/qa/frame-N.png --frame=N --props=./qa-guides.json`.
- Motion (required before calling a reel done): `npx remotion render build PostNN-Slug out/seq --sequence --image-format=jpeg --scale=0.25`, then `python scripts/contact-sheet.py out/seq out/qa/sheet 15 32` (needs Pillow). Inspect every sheet, plus every 4th frame around each section boundary. Single stills miss overlaps that only happen in motion.

## Formats

| Code | Format | Extra rules |
|---|---|---|
| E | Pure explainer | Standard anatomy |
| F | Explainer + failure story | Coral "WHEN IT FAILED" badge on the failure segment. Source on screen is mandatory |
| Q | Quick myth / fact | MYTH stamp (coral) on the myth, FACT stamp (teal) on the correction |
| C | Carousel | 1080x1350 slides (`docs/carousels.md`). Usually a companion to a reel (`companion_of`) |

## Platform specs

- 1080x1920, 30 fps, H.264 MP4, AAC 48 kHz. Length 35-52 s, 100-130 spoken words (including the question and congrats lines).
- **Safe zones:** top 250 px, bottom 350 px, left 80 px, right 150 px. Content box is x 80-930, y 250-1570.
- **Screen regions** (`layout.regions`): visual 360-1230 (hook title + scene), captions 1250-1470, source 1490-1560. Watermark (avatar mark, 25% opacity) sits top-left at y 292. Scene drawings go inside `SceneCanvas` (clipped to the visual region); text positions must stay inside `layout.regions`.
- **Centering:** the safe area is lopsided, so its center (x 505) is NOT the frame center (x 540). Anything centered uses `layout.column` (x 150-930, centered on 540), never `layout.content`. Diagrams are drawn around x 540. The `showGuides` overlay draws the frame-center line and the column.
- **Cover frame:** title + key visual inside the centered 1080x1350 area (4:5 feed crop).
- **Audio:** -14 LUFS integrated, true peak <= -1 dBTP, music about 20 dB under VO.
- Layout values derive from composition width and height, so a 16:9 variant can be added later.

## Brand tokens

All colors come from `video/src/brand/tokens.ts`. **Never write a hex value anywhere else.**

| Token | Hex | Use |
|---|---|---|
| bg.base / bg.raised | #0f172a / #1e293b | Radial background (raised in center), cards |
| diagram.stroke / soft / faint / fill | #e2e8f0 / #94a3b8 / #475569 / #1e293b | **All scene diagrams**: main line art / secondary lines, rings / dashed guides, orbits / object fills |
| amber.500 (300 / 600) | #f59e0b (#fcd34d / #d97706) | Key element: the ONE thing to notice per beat (pin, number, result), active caption word, hook highlight |
| teal.400 | #2dd4bf | **Brand only**: logo, CTA handle, FACT stamp, "correct" marks |
| teal.100 / 300 / 600 / 700 | #99f6e4 / #5eead4 / #0d9488 / #0f766e | Reserved for brand elements (shading and glows of teal items) |
| coral | #FF5A5F | Only failure segments, MYTH, "wrong" marks |
| text.primary / secondary / muted | #f8fafc / #cbd5e1 / #94a3b8 | Main text / tagline, secondary / sources |
| env.* | see `tokens.ts` | Muted tones for Blender worlds only |

**Color roles:**
- Diagrams are **neutral line art**. Never draw scene objects in teal.
- **Amber = one key element per beat.** If two things are amber, one of them shouldn't be.
- **Teal = brand moments only**, so it stays rare and recognizable.
- Icons in `src/components/icons/` are neutral by default; only `PinIcon` and the clock's minute hand are amber, because they *are* the key marker.
- Theme is **dark only**.
- Tagline: **"How things actually work"**. Spoken CTA: "Follow Unpack and Explain for how things actually work."
- Logo: Avatar mark for sting + watermark, Stacked-Dark for the CTA card. Never recolor, stretch, crop or add effects to the logo.

## Typography

| Role | Font | Size |
|---|---|---|
| Display (big topic word, kinetic type) | Poppins SemiBold | 128 px (`typeScale.display`), one word or short phrase |
| Hook / big title | Poppins SemiBold | 96-120 px, max 2 lines |
| Scene title | Poppins SemiBold | 72 px |
| Caption | Inter SemiBold | 64 px, 1-2 lines |
| Label / step | Inter Medium | 44-48 px |
| Source line | Inter Medium | 32 px |

Load fonts only through `src/brand/fonts.ts` (`@remotion/google-fonts`). Sentence case; only stamps and badges may be uppercase.

## Reel anatomy

**Question -> Hook -> Setup -> Mechanism -> Payoff -> Congrats -> CTA.** Every reel, every format, no exceptions.

| Section | Who makes it | Script rule |
|---|---|---|
| **Question** | Template (`QuestionCard`) | Ask the viewer about the topic, ending in "?". E.g. "Do you know how GPS actually finds you?" |
| Hook, Setup, Mechanism, Payoff | Post scenes | As written in the script |
| **Congrats** | Template (`CongratsCard`, teal check + chime) | Starts with "Congrats," (comma, **not** "!"). E.g. "Congrats, you just learned how GPS finds you." |
| **CTA** | Template (`CtaCard`) | Exactly `brand.ctaLine`: "Follow Unpack and Explain for how things actually work." |

`script.ts` sets `topic` (e.g. "GPS"), colored amber on the question and congrats cards. Captions are hidden over the template cards because the cards already show the words.

1. **Frame 0:** the question card is already visible (no fade-in). The avatar logo sting finishes in under 1 s alongside it. The hook title appears when the hook section starts.
2. **Throughout (not CTA):** avatar watermark, burned-in captions (active word amber), motion at least every 2 s.
3. **Mechanism:** a Blender 3D scene (`docs/blender.md`), one idea per beat, synced to the VO. **No on-screen text that repeats the voice-over.** On-screen text is only for what the VO doesn't say: a number, a unit conversion, a source.
4. **Hook:** Blender too. **Setup and payoff** stay 2D, with scene styles and charts.
5. **World:** every new reel renders inside a Blender world (`world` in the `blender` plan), with its dimmed backdrop behind the 2D sections. If no world fits the topic, build one first (`docs/blender.md`). Only posts built before 2026-11-10 use `worldOptOut`.
6. **Before / on CTA:** `SourceTag` ("Source: ...") visible for the last 3 s.
7. **CTA card (3-4 s):** Stacked-Dark logo, tagline, handle (`brand.handle` = `@unpack_and_explain`).

### One subject, easy to follow

A muted viewer must know what the reel is about from frame 0 and follow it line by line. `npm run tracker` enforces the checkable parts on every reel not yet rendered or posted.

- **One subject.** `topic` (idea.md front matter and `script.ts`) is the subject. It appears in the title, the question card and the setup's first sentence (or that sentence opens with it / this / that). Any number on the question card is about the subject; never borrow a number or object from elsewhere in the script to lift the score.
- **One comparison at most**, and only with the ordinary version of the same thing (normal trains for a maglev, normal braking for regen), drawn on the same object where possible. No unrelated objects with their own icons. Every scene shows the subject.
- **Each section has one job:** Question (curiosity about the subject), Hook (a surprising claim about it), Setup (the problem the mechanism solves), Mechanism (the steps, cause to effect, one per sentence), Payoff (what it leads to), Congrats (what was learned).
- **Each sentence follows from the one before** ("so", "but", "then" logic). If two sentences can swap without breaking the meaning, one doesn't belong.
- **The question card is answered** explicitly, in the mechanism or payoff.
- **`## Spine`** in idea.md (Question, Hook, Setup, Mechanism, Payoff, Answer: one line each, Answer starts `Mechanism:` or `Payoff:`) is written and approved before the script lines.
- **`## Cold read`** (About / Asks / Answer) is written by Claude from the voice-over alone before the user approves the script. If any line can't be filled from the VO, the script isn't ready.

## Motion

- Animate only with `useCurrentFrame()` + inline `interpolate()` in the `style` prop. Use `scale` / `translate` / `rotate` style properties, not `transform` strings.
- Use easing presets from `src/brand/motion.ts`: `smooth` (default), `out`, `pop` (overshoot, logo and stamps only).
- Entrances 10-15 frames. Never crossfade two scenes: their visuals and text stack on top of each other.
- Wrap editable elements in `Interactive.*` with a meaningful `name` so Studio edits write back to code.
- Shared components read tokens. In bespoke scenes, keep layout and keyframes inline in `Interactive.*` styles so Studio can edit them, but colors, fonts and easings still come from `src/brand/`.
- Name timing keys `crossfade`, not `transition`: the Remotion ESLint rule flags `transition` as a CSS transition.
- Prefer the motion kit over hand-rolled maths (`docs/motion-kit.md`). Only frame-driven animation libraries.

## Variety

**Fixed frame, varied content layer.** Colors, fonts, the channel voice, captions, the congrats and CTA cards, logo, watermark, safe zones, section order and audio never vary. These do:

| Layer | How it varies | Where |
|---|---|---|
| **Look** | `pickLook(postNumber)` rotates the question card style, hook title style and transition mix. Consecutive posts never share a style | `src/templates/look.ts` |
| **Format signature** | Background motif by `format`: E moving waves, F blueprint grid, Q pulsing dot grid. Never overridden | `src/components/AmbientMotif.tsx` |
| **3D model** | Don't lead with the previous post's model | `src/brand/models.ts` |
| **Scene styles** | 2-3 visual languages that suit the topic (line-art diagram, UI mock, cycle diagram, kinetic type, map, chart...). Lead with a different one from the last 3 posts | `src/components/styles/` |

- **Leave `look` unset** in `script.ts`; the rotation does the work. Pin a slot (`look: { hook: "rise" }`) only when a style clearly fits the topic better, and say why in a comment. Posts 1 and 2 pin `classicLook`; never change that.
- Question card text is readable at frame 0 in every style; only the decoration animates.
- Preview every style and motif in Studio: **Kit-Looks**.

## Instagram rules

The pipeline is in `docs/instagram-pipeline.md`. **Where a skill disagrees with this file, this file wins.**

- State lives in `instagram/`, not `~/.claude/instagram/`. The skills' `log.md` = the hook fields and metrics in each `idea.md`; their `plan.md` = the schedule in `ideas/README.md`. Read `instagram/voice.md` before writing anything.
- Reel anatomy stays (question card first, logo sting, congrats, fixed CTA), even though `/ig-reel` says "cut the intro, no logo sting". Instead, the question card must score `hookscore.py` 50+ and aim for 7 words or fewer with something concrete. Only score candidates that already name the subject (`topic`); a higher score from a borrowed number or object doesn't count.
- Our safe zones, layout regions and 150 wpm (`voice.wordsPerSecond` 2.5) win over the skills' safe zones and 165 wpm. The beat sheet's "beat over 4 s" flag is met by visual changes (motion every 2 s), not only by splitting lines.
- `/ig-human` and `detect.py` results on scripts are **suggestions**: show the user the proposed rewrites; never change script text or facts without approval. BURSTINESS is advisory on our short, even sentences. Captions, comments, replies and DMs do go through `/ig-human` before the user sees them.
- Never post, like, follow, comment or DM on the user's behalf, never log into Instagram, never ask for a password, never scrape. Every skill ends with copy-ready text the user posts by hand. `/ig-viral` reads in the user's own Chrome with the user present (claude-in-chrome), at human speed, about 10 accounts.
- Hashtags: 5 or fewer, at the bottom, never inside the first 125 characters. No links in captions.
- Never invent numbers, results or quotes; leave `{{number}}` and add it to `verify`.

## Per-post workflow

1. Agree the `## Spine` and `topic` with the user, then script it with `/ig-reel` into `ideas/idea-NN-slug/idea.md` (`## Script` table, `## Cold read`, `## Caption` from `/ig-caption`, `verify` list), run `npm run ig -- idea-NN-slug`, record `hook_formula` / `hook_score` / `question_score`, set `status: scripted`, and run `npm run tracker`. Move `status` along as it progresses (built > rendered > posted); after posting add `link` and fill in `metrics`. `status` / `link` / `metrics` are Instagram's; when a reel goes up as a YouTube Short, add a `youtube:` block (`date`, `link`, `metrics`: views, engaged_views, stayed_pct, watch_pct, likes, comments, shares, subscribers) and fill it from YouTube Studio.
   - **Analytics:** ask the user for a fresh Instagram insights export (CSV) whenever the newest `# as of` date on posted metrics is more than 7 days old, and at the start of any planning or new-post work. The CSV has views, reach, likes, comments, shares, saves and follows. `hold_3s`, `watch_pct` and `nonfollower_pct` aren't in it, so ask for those per reel from Insights too.
2. Create `src/posts/post-NN-slug/script.ts` with the VO text copied **verbatim**, plus a `script.test.ts` asserting `validateScript` returns no errors or warnings. Rules: section order, `source` required, `hookText` at most 28 characters (2 lines), CTA exactly `brand.ctaLine`, F posts need `failureSection`, 100-130 spoken words. List "verify" facts in `verify`.
3. Run TTS (bleed is trimmed automatically; check the "trimmed" lines it prints), or build with estimated timing first.
4. Pick the model (catalog, or `npm run model:add`) and the world (an existing one, or build a new one for the topic), write the `blender` plan from the Visual column, run `npm run blender -- post-NN-slug --preview`, review, then the full render. Register `CoverNN-Slug` and run `npm run cover`.
5. Write the `sfx` plan (sparse cues on spoken words, topic sounds that differ from the last post's), then `npm run sfx -- post-NN-slug`.
6. Build the scenes from the Visual column with shared components and scene styles; bespoke scene components live only in the post folder. The template adds the hook title, failure badge, watermark, captions, source line and CTA card. Sync visuals to the VO with `useCue("word", fallbackFraction)`.
7. Export `PostNN` (wrapping `Reel` with the scene map) from `index.tsx` and register `PostNN-Slug` in `Root.tsx`, in the `Reels` folder, with `calculateMetadata={calculateReelMetadata}`.
8. Run `npm run lint`, review against the QA checklist, render, master.

## QA checklist (every reel)

- [ ] Look comes from the rotation (or a pinned slot with a reason); scene styles differ from the last 3 posts
- [ ] Mechanism goes wide > close-ups > wide, the key part centered and big in each close-up; one amber part per beat in every clip; nothing clipped; labels inside `layout.regions`
- [ ] Rendered inside a world (no `worldOptOut` on new posts); question readable over the 3D backdrop at frame 0; cover follows `docs/blender.md` "Cover" (hero framing, model in front of the title, text names the topic) and reads at grid size in `out/qa/cover-grid.png`; CC-BY model credit in the caption; `npm run blender` up to date
- [ ] 3D edges: `npm run model:qc` passes, and full-size frames (not the 25% contact sheet) cropped 2-3x at every junction show single clean lines: no broken or dashed lines, no faceted curves, no outline that stops inside another part
- [ ] One subject: the topic is named on the question card and opens the setup; no unrelated objects; every scene shows the subject; the question card is answered (spine Answer row)
- [ ] Congrats line before the CTA; total length 35-52 s
- [ ] Nothing outside safe zones
- [ ] Readable text >= 44 px, sources >= 32 px
- [ ] Only token colors; at most 2-3 hues per scene; coral only where allowed
- [ ] Captions in sync with VO
- [ ] No stray blips or stutters at section boundaries (`npm run qa:audio` passes, and listened through)
- [ ] SFX: sparse, nothing masks a key word, each sound fits its moment
- [ ] Source line shown; units metric + imperial where relevant
- [ ] CTA wording, tagline and handle correct
- [ ] Loudness about -14 LUFS, no clipping
- [ ] Hook and question card score 50+; caption lint READY; AI-text findings shown to the user
- [ ] `npm run lint` and `npm run tracker` pass; the post's `status` is updated

## Do

- Reuse shared components; extend them in `src/components/` when a pattern appears in a second post.
- Keep one idea per scene and build the frame around the single thing the viewer should notice first.
- Keep diagrams sparse: when a new beat starts, fade out the geometry from the previous beat. Prefer partial arcs over full circles, and don't let lines radiate from under an icon. Check the busiest frame at full size.
- Draw visuals as code (SVG, shapes, icons) in neutral `colors.diagram.*`, with amber only on the key element.
- Keep facts exactly as scripted. Flag anything marked "verify" to the user before rendering.
- Keep each file focused; split scenes into their own files.

## Don't

- Don't hardcode colors, fonts, sizes, safe-zone offsets or easing curves outside `src/brand/`.
- Don't use CSS transitions or animations, or Tailwind animation classes (they don't render).
- Don't use stock footage, AI imagery, emoji as graphics, or light backgrounds.
- Don't put text or key visuals in the IG UI zones (top 250 / bottom 350 / right 150).
- Don't add a title-card intro or any blank frames before the hook.
- Don't rewrite, shorten or "improve" script text without asking.
- Don't modify anything in `logo/` or redefine brand values inside a post folder.
- Don't commit or push unless the user asks.
- Don't spawn Opus subagents, and don't use subagent-driven-development or reviewer agents. Spawn only the cheap project agents in `.claude/agents/` (`docs/model-tiers.md`), and only for their listed jobs. Spine, script, hooks, scenes, Blender worlds/models, visual QA and debugging stay in the main session.
