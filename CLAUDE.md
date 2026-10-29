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
  - `src/templates/Reel.tsx`: section sequencing, format rules, audio, captions.
  - `src/posts/post-NN-slug/`: `script.ts` (typed data) + `scenes/*.tsx` for that post only.
  - `public/posts/post-NN/`: generated VO mp3s and `captions.json`.
  - `scripts/tts.ts`: generates VO + timestamps from `script.ts`.

## Commands (from `video/`)

- Preview: `npm run dev` (Remotion Studio)
- Typecheck + lint: `npm run lint` (run before saying any work is done)
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
- **Safe zones:** top 250 px, bottom 450 px, left 80 px, right 150 px. Content box is x 80-930, y 250-1470. Always lay out through the `SafeArea` component / `layout.ts`, never with ad-hoc offsets.
- **Cover frame:** title + key visual inside the centered 1080x1350 area (4:5 feed crop).
- **Audio:** -14 LUFS integrated, true peak <= -1 dBTP, music ~20 dB under VO.
- Layout values derive from composition width/height so a 16:9 variant can be added later.

## Brand tokens

All colors come from `video/src/brand/tokens.ts`. **Never write a hex value anywhere else.**

| Token | Hex | Use |
|---|---|---|
| bg.base / bg.raised | #0f172a / #1e293b | Radial background (raised in center), cards |
| teal.400 | #2dd4bf | Primary: diagrams, highlights, "correct", FACT |
| teal.100 / 300 / 600 / 700 | #99f6e4 / #5eead4 / #0d9488 / #0f766e | Glows, fills, shading |
| amber.500 (300 / 600) | #f59e0b (#fcd34d / #d97706) | Accent: numbers, keywords, active caption word |
| coral | #FF5A5F | Only failure segments, MYTH, "wrong" marks |
| text.primary / secondary / muted | #f8fafc / #cbd5e1 / #94a3b8 | Main text / tagline, secondary / sources |

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
3. **Mechanism:** numbered `StepBadge`s, one idea per step.
4. **Before / on CTA:** `SourceTag` ("Source: ...") visible for the last 3 s.
5. **CTA card (3-4 s):** Stacked-Dark logo, tagline, handle (`brand.handle`, placeholder until confirmed).

## Motion

- Animate only with `useCurrentFrame()` + inline `interpolate()` in the `style` prop. Use `scale` / `translate` / `rotate` style properties, not `transform` strings.
- Use easing presets from `src/brand/motion.ts`: `smooth` (default), `out`, `pop` (overshoot, logo and stamps only).
- Entrances 10-15 frames. Section transitions 10-15 frames via `@remotion/transitions` (fade or slide).
- Wrap editable elements in `Interactive.*` with a meaningful `name` so Studio edits write back to code.

## Audio and captions

- VO: ElevenLabs, the single voice in `src/brand/voice.ts`. Never switch voice or settings per post.
- Generate VO per section with timestamps via `scripts/tts.ts`. Section length = real audio length + tail pad. The script's "Time" column is guidance only.
- Captions are JSON in the `Caption` type from `@remotion/captions`, built from TTS timestamps.
- Use `<Audio>` from `@remotion/media`. Music: the licensed bed in `public/brand/music/`, ducked under VO.
- API keys live in `video/.env`. Never commit `.env` or print keys.

## Per-post workflow

1. Read `Posts/post_N/script.md` (and the tracker row for format/source notes).
2. Create `src/posts/post-NN-slug/script.ts` with the VO text copied **verbatim**.
3. Run TTS -> VO + captions.
4. Build scenes from the Visual column with shared components; add bespoke scene components only inside the post folder.
5. Register `PostNN-Slug` in `src/Root.tsx`.
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
- Draw visuals as code (SVG / shapes / icons in brand colors).
- Keep facts exactly as scripted. Flag anything marked "verify" to the user before rendering.
- Keep each file focused; split scenes into their own files.

## Don't

- Don't hardcode colors, fonts, sizes, safe-zone offsets or easing curves outside `src/brand/`.
- Don't use CSS transitions/animations or Tailwind animation classes (they don't render).
- Don't use stock footage, AI imagery, emoji as graphics, or light backgrounds.
- Don't put text or key visuals in the IG UI zones (top 250 / bottom 450 / right 150).
- Don't add a title-card intro or any blank frames before the hook.
- Don't rewrite, shorten or "improve" script text without asking.
- Don't modify anything in `logo/` or redefine brand values inside a post folder.
- Don't render, commit or push unless the user asks.
