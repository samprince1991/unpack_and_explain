# Design decisions

Why the pipeline is built the way it is, and what was tried or rejected. The rules themselves live in `CLAUDE.md` and the other files in `docs/`. Git history holds the original specs and plans.

## Brand and format

- **Code-enforced brand.** Tokens, shared components and templates carry the brand, and a test fails on any color or font literal outside `src/brand/`. A style guide alone wouldn't hold up across many posts.
- **Logo palette is the source of truth.** Dark theme only.
- **Neutral diagrams, amber for one thing, teal only for the brand.** Teal diagrams blended into the teal logo in the first review, and the brand stopped standing out.
- **Length 35-52 s, 100-130 words.** Precise wording needed more room than the first 50 s / 125 word limit.
- **Bottom safe zone 350 px.** That's the organic Reels overlay plus margin. Meta's ~670 px figure is for ads only, so revisit it if these run as ads.
- **No on-screen text that repeats the voice-over.** Captions already carry the words; numbered step badges were redundant and got removed.
- **"Congrats," with a comma.** With "!" the upbeat voice over-stresses the word.
- **Section transitions never crossfade.** Scenes are transparent over one background, so a crossfade stacks their text and visuals.

## Reel variety

- **Fixed frame, varied content layer.** Four reels a week that open identically read as a template, but the frame has to stay recognizable. Colors, fonts, voice, captions, end cards and section order never vary; question card, hook title, transitions, motif and scene style do.
- **Looks rotate deterministically by post number**, not randomly, because a Remotion render must come out the same every time. Consecutive posts never share a style.
- **The format picks the background motif**, so the format is felt before it's said.
- **Scene styles are built when a post needs one**, not in advance.

## 3D

- **Blender instead of live three.js.** Live 3D stayed thin primitives filling 15-20% of the visual region, so captions became the main visual and frame 0 made a weak thumbnail. Blender gives real models, lighting and a strong cover. Post 20 is the only reel still using live three.js.
- **Text is never rendered in 3D.** Labels are 2D overlays placed from Blender's projected positions, so they keep brand fonts and stay inside the layout regions.
- **Models are never AI-generated** (brand rule), and come from an approved catalog with a known license.
- **Camera rhythm: wide, close-ups, wide.** Early clips framed the whole model nearly all the time, and "close-ups" left the part small and off-center. Close-ups now size themselves from the part's bounding box, so a plan gets the rhythm without numbers.
- **Geometry QC is automated.** Freestyle draws a crease above 40 degrees and nothing where surfaces cross, which caused broken and faceted lines that were only visible at full size.

### Render pipeline

- **`npm run blender` is the only route into a reel.** The Blender MCP is an optional workbench; nothing rendered or edited in a live session ships.
- **Node owns decisions and the manifest; `render.py` only renders the frames it's given.** Workers can't race on the manifest.
- **A clip reaches its folder only when every frame has rendered.** Failed runs and previews can no longer destroy a good full render.
- **Three workers by default.** Measured on the RTX 3000 Ada laptop (8 GB VRAM), post 21 mechanism, 12 frames per process, one short run each:

  | Processes | Frames/s | Speedup | Peak VRAM |
  |---|---|---|---|
  | 1 | 1.06 | n/a | 2.5 GB |
  | 2 | 1.53 | 1.4x | 3.4 GB |
  | 3 | 1.93 | 1.8x | 4.2 GB |
  | 4 | 1.35 | 1.3x | 4.6 GB |

  A frame rendered alone was pixel-identical to the same frame rendered in sequence, which is what makes splitting into chunks safe.
- **Stale rules differ by cause.** A changed plan, VO timing or GLB blocks a final render, because the picture would be wrong. Shared Blender code only triggers a re-render on the next `npm run blender`, because most code changes don't alter the look. A real look change needs a `BLENDER_LOOK_VERSION` bump.
- **Known limits:**
  - The clip hash includes the whole catalog entry, so editing a model's description text also marks its renders stale. Narrowing it would mark every post stale once, so it's left until a full re-render is happening anyway.
  - Editing `blender/models/<id>.py` counts only once the GLB is rebuilt, which is correct because renders read the GLB.
  - A hand-made `.blend` is outside `public/`, so the final-render check can't see it. It's included in the code hash only.

### Worlds

- **Why they exist:** reels read as animated diagrams because of no sense of place, a small picture in a band, and one texture everywhere.
- **Blender only.** AI video was reviewed and declined. Also skipped: Unreal, Lottie / Rive, other code-first frameworks, prompt-to-video tools.
- **The world is built into each clip.** Ship and water render in one opaque scene, so the hull really meets the water and the light is shared. Rejected: a separate background layer (the ship still floats) and a hand-built scene for one post (proves nothing for later reels).
- **Muted world tones with one amber key.** A colorful world and photo cards were both rejected.
- **The water explains the mechanism.** Wave shapes are stored as shape keys, which add linearly, so the surface is the literal sum of the waves. It's an illustration, not a fluid simulation.
- **Coast, one world for land and water (2026-11-10).** Built for the hovercraft (idea 27), which drives from sea onto land. One scene with placements beats two separate worlds: the pipeline renders one world per reel, and the same code serves water topics, land topics and the shore between them. It doesn't cut the water open like the sea world: a model on the coast sits on the surface.
- **Worlds are required on every new reel (2026-11-10).** The user asked for it after the sea-world pilot (post 26). They cost much more render time (about 2.5 s a frame against 0.4-0.5 s), and each new topic usually needs a new world, so budget for that. Posts built before the rule keep `worldOptOut`. Note: when this was decided, post 26 was not posted yet, so there was no metric comparison behind it. Compare its `hold_3s` and `watch_pct` with the earlier reels once it has them.

## Charts

- **D3 for maths only.** Its selections mutate the DOM and its timers run on the wall clock, which flickers in renders and breaks Studio edits. A test bans those modules.
- **ECharts rejected:** wall-clock animation, and theming it to the brand means fighting its defaults. A generic config-driven `<Chart spec>` was also rejected as heavy and hard to keep on brand.
- **Charts throw over their limits**, so an unreadable chart fails in Studio instead of shipping.

## Audio

- **One voice, fixed settings, for every reel.** Sections are generated separately with neighbouring text passed in, which keeps intonation continuous but causes the stitching bleed that `voClean` removes.
- **No sound on section changes.** A whoosh there landed on the end of every voice line. For the same reason, a sound cue can't sit on a section's last word.
- **Sound effects are placed by hand in `script.ts`.** Rejected: sounds inside scenes (reel-wide limits can't be checked) and adding them with ffmpeg after rendering (no Studio preview). Nothing plays automatically from Blender beats.
- **Stutter checks run on the voice stem alone.** On the full mix, an intentional tick in a pause would fail and a sustained sound could hide a real stutter.
- **SFX model pinned to `eleven_text_to_sound_v2`.** `v3` is limited access. Moving to it should be a deliberate change.
- **The music bed is opt-in**, because once the file exists every later render plays it.

## Carousels

- **Typed `slides.ts` plus per-slide visuals.** Rejected parsing `idea.md` at render time (a markdown parser in the bundle, untyped, fragile slide-to-visual pairing). The tracker checks that the two match instead.

## Content and Instagram

- **Fixed topic list in `ideas/categories.yml`,** so new ideas build on a theme instead of repeating one.
- **Reel anatomy stays,** even though `/ig-reel` advises against intros. The question card must score 50+ instead (it first scored 45 WEAK).
- **Skill state lives in the repo,** so it travels with the project.
- **Claude never posts, likes, follows, comments or messages.** Every skill ends with copy-ready text the user posts by hand.
- **BURSTINESS findings are advisory,** because the detector penalizes short, even explainer sentences.

## Removed

- **Memes:** the template, catalog and image collection were removed. Git history has them if the idea returns.
- **Live three.js kit:** `Bars3D`, `ExplodedView`, `NetworkGraph3D`, `WireGlobe`, `WireObject` and Kit-Three were used by no post once Blender took over. The pieces post 20 needs remain.
