# Reel worlds: a Blender-only pilot on post 26

Date: 2026-11-09. Status: design approved by the user; Gate 1 pending.

## Problem

The reels read as animated diagrams. Frames from posts 21 and 26 show three causes:

1. **No world.** Clips render with a transparent film over the same navy background, so the
   post 26 hull is a floating plate, not a ship in water.
2. **Small picture.** 3D sits in a band (`layout.blender`: 610 to 870 px of the 1920 px frame),
   and the band's soft edges are visible.
3. **One texture.** Dark surfaces with white outlines everywhere, with little depth in the light.

Post 21's close-ups show the 3D itself can work. It needs a place to sit in and more of the frame.

The evidence that visuals are the main constraint is weak: the posted reels checked show 0 and
120 views with no hold or watch-time data. So this is a pilot with a stop point, not a rollout.

## Decisions

- **Blender only.** AI video was reviewed and declined by the user. `CLAUDE.md`'s no-AI-imagery rule stands.
- **Skipped for now:** Unreal, Lottie / Rive, other code-first frameworks, prompt-to-video tools.
- **Direction:** an atmospheric world in muted tones with one amber key. This is the direction the
  user chose on 2026-11-05 in a design whose files were lost before being committed.
- **Pilot post:** 26 (bulbous bow). It is the flatter of the two reels reviewed and is not posted yet.
- **Git:** commit as we go on `feature/reel-worlds`; no push.

## Approach

The world is built into each clip: ship and water render together in one opaque, full-frame
Blender scene, so the hull really meets the water and the light is shared. Rejected: a separate
background layer behind today's clips (the ship still floats) and a hand-built scene for post 26
only (proves nothing about later reels).

## Gate 1: three still frames

Before any pipeline change, a standalone script (`blender/world/styleframes.py`, deleted once Gate 1 passed) renders three
full-size frames for the user to compare with the current ones:

1. Wide bow in the sea.
2. Split level at the waterline, with the bulb visible below the surface.
3. The bow wave and bulb wave on the water, with the amber line.

The only other change at this stage is adding the `env.*` tokens, because `blender/` may not
contain color values. It also measures seconds per frame. If the stills don't clearly win, the
pilot stops here.

## Design (after Gate 1)

**World.** An optional `world` setting in a post's `blender` plan, for example `world: "sea"`. Code
lives in `blender/world/`, with one preset now. Posts without `world` render exactly as today, and
their clip hashes don't change.

**Look.** Opaque full-frame render: animated sea, fog, horizon and sun glow (light shafts were tried and dropped: they never rendered, so dust comes from `DustField` in Remotion). Colors come
from new muted `env.*` tokens in `src/brand/tokens.ts`, passed through `tokens.json`. Amber remains
the only key color, one per beat. Freestyle outlines stay on the model's parts only (linesets are
already per part collection), which keeps the signature look and means `qc.py` still checks only
the model. World geometry may still occlude lines.

**Water explains the mechanism.** The surface is a mesh with shape keys `bowwave` and `bulbwave`
on top of the ambient ripple. Shape keys add linearly, so the surface is the literal sum of the two
waves. It uses the same schematic curves as `blender/models/bulbous_bow.py` (bulb wave -0.85 x bow
wave), so cancelling is partial, matching the script's "partly cancel". It is an illustration, not
a fluid simulation. The amber line stays on the crest, so the existing parts and beats largely
carry over: `collapse` raises the waves and `explode` settles them.

**Template.**
- Opener, hook, mechanism and cover render full-frame in the world.
- Setup and payoff keep their 2D scenes over a dimmed sea backdrop clip (no ship), so the reel
  doesn't jump between ocean and flat navy.
- A soft token-colored gradient sits behind captions.
- Sections, safe zones, the congrats and CTA cards, script, VO and section timing don't change.

**Stale checks.** The clip hash covers the world preset and its settings, so changing them flags a
re-render as usual.

## Testing and comparison

- Unit: a post without `world` keeps its job and hash; `validateScript` accepts `world: "sea"` and
  rejects unknown presets; brand guard covers the new tokens.
- Before overwriting anything, copy the current post 26 render and `3d/` folder aside.
- Standard reel QA: `npm run lint`, `npm test`, `npm run tracker`, `npm run model:qc`, `npm run qa:audio`,
  contact sheets, full-size junction crops, captions readable over water, 4:5 and 3:4 cover crops.
- A side-by-side video of old and new. The user decides. Only if the new version wins do
  `CLAUDE.md` and the per-post workflow change to make worlds the default for new reels.

## Risks

- **Render time.** Volumetric fog plus Freestyle on a dense water mesh could be far slower than
  today's 1-3 s a frame, on an 8 GB laptop GPU. Rough guess: a few hours for ~700 frames. Gate 1
  measures it. Mitigations: a coarser mesh near the horizon, or a fake fog layer in place of volumes.
- **Seeing the bulb.** It sits underwater, so the split-level shot must read clearly. If it can't,
  the pilot may end at Gate 1.
- **Bare hull.** The model is a plain hull cut square at the back. Fog or framing should hide the cut;
  extra hull detail is out of scope unless the stills show it's needed.
- **Text legibility** on a busier picture, handled by the caption gradient and checked in QA.
