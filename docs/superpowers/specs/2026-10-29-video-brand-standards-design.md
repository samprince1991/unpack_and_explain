# Unpack & Explain: Video Brand Standards (Design)

Date: 2026-10-29
Status: Approved in brainstorming, pending spec review

## Goal

Every reel produced with Remotion looks and sounds like the same channel: same palette, type, motion, structure, audio and quality bar. Instagram Reels is the primary target; YouTube Shorts and other platforms come later without rework.

## Decisions

| Topic | Decision |
|---|---|
| Enforcement | Code-enforced design system (tokens + shared components + templates) documented in a root `CLAUDE.md` |
| Palette | Logo palette is the source of truth (teal / amber / slate-navy). Brand tab in the tracker xlsx is updated to match |
| Theme | Dark only |
| Tagline | "How things actually work" (logo artwork wins). Spoken CTA: "Follow Unpack and Explain for how things actually work." |
| Fonts | Poppins SemiBold (headlines) + Inter Medium/SemiBold (captions, labels) |
| Visual style | Code-drawn motion graphics only. No stock footage, no AI imagery |
| Voiceover | AI TTS (ElevenLabs), one fixed voice for every reel |
| Formats covered | Reels E, F, Q. Carousels out of scope for now |

Open items (non-blocking): Instagram handle (placeholder until availability checked), ElevenLabs voice ID.

## 1. Platform specs

- Canvas 1080x1920, 30 fps, H.264 MP4, AAC 48 kHz stereo.
- Reel length 30-45 s (target spoken words 90-110).
- Safe zones (Instagram UI overlays): top 250 px, bottom 450 px, left 80 px, right 150 px. All text and key visuals stay inside the resulting content box (x 80-930, y 250-1470).
- Cover frame: title and key visual inside the centered 1080x1350 area (4:5 feed crop; also survives the 3:4 grid crop).
- Loudness: -14 LUFS integrated, true peak <= -1 dBTP. Music bed ~20 dB under voice.
- YouTube Shorts uses the same canvas. Layout values are expressed relative to composition size so a 16:9 variant can be added later.

## 2. Brand tokens

Single source: `video/src/brand/tokens.ts`. No hex values anywhere else.

| Token | Hex | Use |
|---|---|---|
| bg.base | #0f172a | Background (radial gradient outer) |
| bg.raised | #1e293b | Gradient center, cards, panels |
| teal.100 / teal.300 | #99f6e4 / #5eead4 | Glows, light strokes |
| teal.400 | #2dd4bf | Primary: diagrams, highlights, "correct", FACT stamp |
| teal.600 / teal.700 | #0d9488 / #0f766e | Fills, shadows of teal shapes |
| amber.300 | #fcd34d | Amber highlight |
| amber.500 | #f59e0b | Accent: numbers, keywords, active caption word |
| amber.600 | #d97706 | Amber shade |
| coral | #FF5A5F | Only: F-post failure segments, Q-post MYTH stamp, "wrong" marks |
| text.primary | #f8fafc | Main text |
| text.secondary | #cbd5e1 | Secondary text, tagline |
| text.muted | #94a3b8 | Sources, small labels |

Rules: max 2-3 brand hues per scene (neutrals excluded). Coral never used decoratively.

## 3. Typography

| Role | Font | Size (at 1080 wide) |
|---|---|---|
| Hook / big title | Poppins SemiBold | 96-120 px, max 2 lines |
| Scene title | Poppins SemiBold | 72 px |
| Caption | Inter SemiBold | 64 px, 1-2 lines |
| Label / step text | Inter Medium | 44-48 px |
| Source line | Inter Medium | 32 px |

Minimum text size: 44 px for anything the viewer must read; 32 px only for source lines. Sentence case (no all-caps body text; stamps/badges may be uppercase). Fonts loaded via `@remotion/google-fonts`.

## 4. Reel anatomy

Sections in order: Hook -> Setup -> Mechanism -> Payoff -> CTA.

- Frame 0: hook text already on screen. Logo sting (avatar mark) completes in under 1 s alongside it. No blank or title-card intro.
- Throughout (except CTA): small avatar watermark inside the safe zone; burned-in captions with the active word in amber; something moves at least every 2 s.
- Mechanism: numbered steps (StepBadge), one idea per step.
- F posts: coral "WHEN IT FAILED" badge during the failure segment.
- Q posts: MYTH stamp (coral) on the myth, FACT stamp (teal) on the correction.
- All posts: source line ("Source: ...") on screen during the last 3 s before the CTA card or on it.
- Units: metric and imperial where a measurement matters.
- CTA card (3-4 s): Stacked dark logo, tagline, handle.

## 5. Motion

- All animation driven by `useCurrentFrame()` with inline `interpolate()` in the `style` prop, using `scale` / `translate` / `rotate` properties (not `transform`). No CSS transitions or keyframe animations. Wrap editable elements in `Interactive.*` so Studio edits write back to code.
- Media: `<Audio>` from `@remotion/media`, images via `<CanvasImage>` / inline SVG, assets via `staticFile()`. Captions use the `Caption` type from `@remotion/captions`.
- Easing presets in `video/src/brand/motion.ts`: `smooth` (`Easing.spring({damping: 200})`, default), `out` (`Easing.bezier(0.16, 1, 0.3, 1)`), `pop` (slight overshoot, logo and stamps only).
- Element entrances 10-15 frames; scene transitions 10-15 frames (fade or slide via `@remotion/transitions`).
- No hard cuts between sections without a transition. No effects outside the presets.

## 6. Audio pipeline

- ElevenLabs TTS, one voice ID and fixed voice settings stored in `video/src/brand/voice.ts`, used for every reel.
- VO generated per section with word/character timestamps -> `public/posts/<post>/vo/<section>.mp3` and `captions.json`.
- Section durations derive from actual audio length plus a short tail pad. The script's "Time" column is guidance only.
- One royalty-free music bed (licensed, stored in `public/brand/music/`), ducked under VO. Optional subtle whoosh SFX on transitions.
- API key read from `.env` (never committed).

## 7. Code layout

```
CLAUDE.md                         repo-wide rules
Posts/post_N/script.md            source scripts (from tracker)
logo/                             master logo files (do not edit)
video/
  public/brand/                   logo SVGs (copied), music/
  public/posts/post-NN/           vo/*.mp3, captions.json
  src/brand/                      tokens.ts, fonts.ts, motion.ts, layout.ts (safe zones), voice.ts
  src/components/                 Background, SafeArea, Captions, HookTitle, LogoSting, Watermark,
                                  CtaCard, SourceTag, StepBadge, Stamp, FailureBadge, icons/
  src/templates/Reel.tsx          section sequencing, format rules (E/F/Q), audio, captions
  src/posts/post-NN-slug/         script.ts (typed), scenes/*.tsx, index.tsx
  src/Root.tsx                    one Composition per post, id `PostNN-Slug`
  scripts/tts.ts                  script.ts -> VO mp3 + timestamps
  out/                            renders (gitignored)
```

Unit boundaries: `brand/` has no React; `components/` depend only on `brand/`; `templates/` compose components; `posts/` supply data + bespoke scenes and never redefine brand values.

## 8. Per-post workflow

1. Script approved in tracker -> `Posts/post_N/script.md`.
2. Convert to typed `src/posts/post-NN-slug/script.ts` (sections, VO text, visual notes, format, source).
3. Run `scripts/tts.ts` -> VO + captions.
4. Build scenes from the Visual column using shared components.
5. Review in Studio against the QA checklist.
6. Render to `out/post-NN-slug.mp4`; export cover still.

QA checklist: safe zones respected; readable text >= 44 px (sources >= 32 px); only token colors; hook visible at frame 0; captions in sync; source line present; units dual where relevant; CTA wording and handle correct; loudness target met; cover readable in 4:5 crop; length 30-45 s.

## 9. Out of scope

Carousels, 16:9 long-form layouts, light theme, stock/AI imagery.
