# Blender 3D

Every new reel renders its 3D in Blender: the frame-0 backdrop, hook and mechanism clips, and the cover still. Posts built without Blender opt out with a reason (`blender: { optOut: "..." }`). Why it works this way: `design-decisions.md`.

## Look A, "lit line art"

Dark navy shaded surfaces, soft key + rim light (neutral white), Freestyle lines in `diagram.stroke`, the one key part amber with a slight glow, light depth of field, transparent background. Same color roles as 2D: one amber part per beat, no teal, no text in 3D. Labels are 2D via `BlenderLabels`, numbers and units only.

## Models

- Only from `src/brand/models.ts`. License: CC0, CC-BY (with `credit` in the caption), NASA, or own.
- Sources: NASA 3D Resources, Poly Haven, Kenney, Smithsonian 3D, Sketchfab (license filter). Never AI-generated.
- Procedural models (`blender/models/*.py`) are license "own". A hand-prepared `blender/models/<id>.blend` wins over the GLB.
- Don't lead with the previous post's model.

## The plan (`blender` in `script.ts`)

- `model`, `cover` and `opener` shots, and `hook` and `mechanism` shots with `beats`.
- Shot fields: `yaw`, `pitch`, `zoom`, `keyPart`, `exploded`, `roll` (the picture tilts on screen; positive is clockwise), `aim` (a part that wide shots center on). A clip's start can also set `drift` (orbit in degrees per second, default 4; lower it for flat models, which the default turns edge-on).
- Beats: `{ cue, fallback, do, part?, to?, label?, shot?, follow?, by?, frames? }`. Cues resolve with the same maths as `useCue`.
- `coverText` is at most 4 words and defaults to `hookText`.

| Action | What it does |
|---|---|
| `reveal` | Parts scale in, staggered |
| `focus` | Close-up: the camera centers on the part and zooms until it fills about 60% of the frame; it turns amber |
| `explode` / `collapse` | Parts pull apart / come back, ending wide |
| `spin` | A part rotates |
| `flow` | An amber dot travels part to part; the camera follows it into a close-up of the destination, which becomes the key. `follow: false` keeps the camera still |
| `label` | 2D text pinned to a part |
| `shot` | A camera change |
| `wide` | Pull back to the whole model |
| `stop` | Amber off; spinning parts coast to a stop |
| `shift` | A part slides to `by`; the catalog's `flex` parts (springs) stretch to stay attached. A catalog `groups` name (e.g. the coupe's `car`) moves all its parts together: a whole car hopping. `frames` sets the slide length (default 14); `frames: 0` is instant, for a part that starts somewhere else (a train placed off-screen, then shifted home at speed) |
| `appear` | A catalog `appearOnly` part scales in |
| `vanish` | An `appearOnly` part scales back out (air jets switching off) |

## Camera rhythm

Wide, close-ups on the part that matters, then wide again.

- Open wide: the clip's own `zoom` is the wide framing, about 1-1.3.
- One close-up per idea. Leave `zoom` off `focus` and `flow` so close-ups size themselves from the part. Use `shot.yaw` / `pitch` to swing round to the side the part shows best.
- Let `flow` carry the camera to the next part instead of adding a separate focus.
- End wide, with `wide` or `collapse`.
- Every clip also pushes in slowly (lens, 10%).

`validateScript` warns when the mechanism has no close-up or ends on one without a `wide` / `collapse` / `explode` after it.

## Worlds (required)

Every new reel renders inside a world (decided 2026-11-10, see `docs/design-decisions.md`). `validateScript` fails a plan with no `world`; only posts built before then set `worldOptOut` with a reason. When no existing world fits the topic, build a new one in `blender/world/` before the post's 3D (muted `env.*` tones, one amber key) and add its id to `WORLDS` in `src/templates/types.ts`.

`world: "sea"` in the plan renders every clip opaque and full-frame inside that world, and adds a `backdrop` clip that plays dimmed behind the 2D setup and payoff. Code: `blender/world/`. Colors: the muted `env.*` tokens.

Six worlds so far:

| World | Scene | Use for |
|---|---|---|
| `sea` | Open sea cut in section along a ship's hull, so the part below the waterline shows. Needs a model with a `waterline` part (`validateScript` checks it) | Ships, hulls, anything that sits in the water |
| `coast` | Sea, beach, dunes, grassland with a road, fence, lamps and power lines, hills fading into haze. Any model | Anything that sits on water or land: hovercraft, vehicles, bridges, outdoor machines |
| `track` | A test track at dusk: a straight of tarmac along the model's forward axis with edge lines, a low barrier and light towers on the far (+y) side, a launch ramp ahead, low sheds, grassland and hills in haze. Any model | Cars and other ground vehicles: jumps, launches, braking, grip (ideas 28, 30, 34) |
| `bench` | A jeweller's workbench at night: a wide wooden bench top, a dim back wall with a pegboard of hanging tools and a shelf of jars, and a desk lamp at the far left throwing a warm pool of light on the model. 50 mm lens, so automatic close-ups size themselves. Any model | Jewellery, small crafted objects, anything made by hand on a table (idea 38) |
| `cafe` | A cafe table at night: a round wooden table top, a coffee cup on its saucer to the left, a dim back wall with a long dark window and a bench seat, and a pendant lamp above throwing a warm pool of light on the model. 50 mm lens. Any model | Everyday objects you meet at a table: QR codes, phones, cards, receipts, cups (idea 14) |
| `rail` | A raised guideway at dusk: the model's own stretch of track (`guideway`, `wall`, coil parts) repeated end to end along x on concrete piers, over low grassland with hills in haze. 50 mm lens. The repeats have no lines and only the nearest 3 each way carry coils (Freestyle maps every vertex, so dense repeats slowed stills from seconds to minutes) | Maglev and other track-guided vehicles (idea 31) |

- **Coast placements** (clip start field `coast`): `sea` (on the water, the beach far ahead; default), `shore` (on the water right at the beach), `land` (on the grass, the road and lamps behind it, the sea far back). The backdrop clip always shows the shore.
- **Hovercraft effects:** a model with a `skirt` part presses a shallow dip into the water and gets a ring of spray around the skirt, when it's over water.
- The coast world draws no lines and fades into opaque haze with distance (never to transparent, which dithers into noise).
- **Track:** the model sits on the tarmac; nothing in the world moves with it, so a `shift` on a whole-car group lifts it off the ground and back. Both worlds use a 30 mm lens (wider than the 50 mm the automatic close-up maths assumes), so set `zoom` by hand on close-ups of small parts.
- Extra shot fields: `frameY` (screen height of the focus, 0 top to 1 bottom, default 0.42, above the captions) and, on a clip's start, `sea` (`calm` or `bowWave`, sea world) or `coast` (`sea`, `shore` or `land`, coast world).
- Freestyle lines stay on the model's parts, so `qc.py` still checks only the model.
- `BLENDER_WORLD_VERSION` marks renders stale when `blender/world/*.py` changes the picture.

## Where it shows

- The Reel template puts the opener clip behind the question card automatically (dimmed, with a scrim).
- Hook and mechanism scenes draw `<BlenderClip clip="hook" />` / `<BlenderClip clip="mechanism" />` + `<BlenderLabels clip="mechanism" />`. A test fails if a Blender post's `MechanismScene.tsx` doesn't draw the clip.
- The cover is a `CoverNN-Slug` still (`templates/Cover.tsx`; register it in `Root.tsx` with `calculateCoverMetadata`), laid out for both crops (4:5 feed, 3:4 grid).
- 2D sections get depth from `components/motion/Parallax`, `LightSweep` and `DustField`.
- Preview in Studio: **Kit-Blender** and **Kit-BlenderCover**.

## Stale renders

Each clip stores a hash of its plan + VO timing, plus `modelHash` (the GLB) and `codeHash` (shared Blender code).

- Studio shows a placeholder for missing clips.
- A final render throws if a clip is missing, stale or a preview.
- `codeHash` makes `npm run blender` re-render but never blocks a final render, so a real look change still needs a `BLENDER_LOOK_VERSION` bump.
- Renders with no `modelHash` / `codeHash` are accepted by final renders and re-render the next time `npm run blender` runs on that post.
- After any TTS re-take of the question, hook or mechanism, re-run `npm run blender`.
- Sound effects never need a Blender re-render.

## Geometry QC

Freestyle draws a crease wherever face normals differ by more than 40 degrees (`look.CREASE_DEG`), and no line at all where two surfaces cross. So in every model, procedural or downloaded:

- Curves in steps under about 25 degrees: lathes 48+ segments, round wires and fibers 16 sides.
- Real rounding instead of single 45-degree chamfers.
- Cross-sections built with true rotations (square corners).
- No repeated end point on a closed profile (it leaves a seam line).
- Nested parts with small gaps instead of crossing.
- A collar, flange or visible gap wherever one part meets another.

`blender/qc.py` enforces this and blocks on errors: crease-band edges (28-52 degrees: broken, dashed lines; 52-80 degrees: faceted lines on round parts) and parts that touch or cross without a line at the junction. `hardEdges` (parts whose 52-80 degree edges really are sharp, like flat blades) and `contacts` (part pairs whose junction draws its own line) in `models.ts` are the only exceptions.

After changing a model's geometry, rebuild its GLB. Every post rendered with model tracking that uses it then goes stale until re-rendered.

## Blender version

Blender 5.3 (`blender/VERSION`, `BLENDER_PATH` in `video/.env`; the 4.5 path stays there as a commented fallback). Switched 2026-11-11 (`design-decisions.md`).

- The code runs on both 4.5 and 5.x: `common.eevee_engine()` picks the engine name, and `look.setup_glow` builds the 5.x compositor (a `compositing_node_group` whose Group Output is the image, `ShaderNodeMix` / `ShaderNodeMath`, the `Emission` pass) or the 4.x one.
- The glow fails soft: if the tree can't be built, the log prints `[look] glow skipped: ...` and the clip renders without bloom. Treat that line as a bug: amber without glow is a look change.
- Vulkan is the default GPU backend on Windows from 5.3. With a warm shader cache it matches 4.5 speed (post 14 mechanism stills: 15 s against 16 s); OpenGL was slower (23-56 s). The first run after installing a new version compiles shaders and is slower.
- Checks to repeat after any Blender upgrade: `npm run blender -- --selftest`, `--frames` on one post per world under both versions (pixel diff, side-by-side at full size), `npm run model:qc`, and rebuilding each `blender/models/*.py` without errors.

## 5.3 features to try on the next reel

These are opt-in trials, not yet part of look A. Run each on the next reel's model with `--frames` before the full render, show the side-by-sides to the user, and adopt only on approval. Adopting a trial that changes the picture means a `BLENDER_LOOK_VERSION` bump and a line in `design-decisions.md`.

1. **Light-band surfaces (EEVEE Material Lighting nodes).** New in 5.3: `ShaderNodeLightAccumulation`, `ShaderNodeLightEvaluation` (diffuse term, direction, attenuation), `ShaderNodeLightInfo`, `ShaderNodeShadowRaycast`. Idea: in `look.part_material`, swap the Principled shading of navy parts for two soft bands between `diagram.fill` and `bg.raised` driven by the key light, plus a thin neutral rim from the rim light only. Flat bands sit better under Freestyle lines than PBR gradients, especially in close-ups. The amber emission and glow stay as they are.
   - Try it behind a switch in `look.py` (default off), then render the same `--frames` with it off and on.
   - Pass: surfaces read as two clean tones at full size and on the 25% contact sheet, lines and amber unchanged, colors still token-exact (Standard view), no shadow acne in `--sequence` motion.
2. **Line Art for intersection lines.** Line Art is a Grease Pencil modifier (`GreasePencilLineartModifier`, Grease Pencil v3 in 5.x). It draws lines where surfaces cross, which Freestyle never does: that gap is why `qc.py` blocks part contacts and why models need collars and gaps.
   - Try it as an add-on: Freestyle keeps silhouettes, borders and creases; Line Art draws intersections only, in `diagram.stroke` at the same width.
   - Pass: at the model's junctions (cropped 2-3x at full size), the intersection line matches the Freestyle weight and color, doesn't flicker in motion, and stays neutral when the part's own lines are keyed amber.
   - If it holds, `qc.py`'s contact check can become a warning for that model, and the collar rule loosens. That's a design decision: ask first.
3. **Quad-Sphere for round parts.** `bpy.ops.mesh.primitive_quad_sphere_add(segments=..., method="EVEN_AREA")` builds a sphere from quads with no poles. UV spheres end in triangle fans at the poles, which can draw pinched crease lines. Use it in new procedural models for balls, bearings, pearls and domes. Pass: `npm run model:qc` and a full-size crop at the old pole position show no stray lines.
4. **Curve to Mesh `Miter Scale`** (Geometry Nodes): keeps the tube radius even through bends. Use it only if a new model builds cables or wires from curves in Geometry Nodes. Our current models build tubes by hand.

Already active with no plan changes: 5.3 fixed EEVEE soft-shadow banding at high sample counts and area-light leakage onto the backs of objects (all our lights are area lights). sRGB PNGs now carry an ICC profile, which made no measurable difference. Not useful for us: Gaussian splats (photo scans, off-brand), panoramic cameras, the sky sun disc (no world uses a sky texture), and the project system.

## Render time

Three workers on the RTX 3000 Ada laptop: about 0.4-0.5 s a frame for plain clips, about 2.5 s a frame for the sea world at 1080x1920. The coast world renders a full-size still in about 10 s including scene build. Iterate with `--frames`, `--preview` and `--only`.
