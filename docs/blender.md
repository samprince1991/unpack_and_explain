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
- Beats: `{ cue, fallback, do, part?, to?, label?, shot?, follow?, by? }`. Cues resolve with the same maths as `useCue`.
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
| `shift` | A part slides to `by`; the catalog's `flex` parts (springs) stretch to stay attached |
| `appear` | A catalog `appearOnly` part scales in |

## Camera rhythm

Wide, close-ups on the part that matters, then wide again.

- Open wide: the clip's own `zoom` is the wide framing, about 1-1.3.
- One close-up per idea. Leave `zoom` off `focus` and `flow` so close-ups size themselves from the part. Use `shot.yaw` / `pitch` to swing round to the side the part shows best.
- Let `flow` carry the camera to the next part instead of adding a separate focus.
- End wide, with `wide` or `collapse`.
- Every clip also pushes in slowly (lens, 10%).

`validateScript` warns when the mechanism has no close-up or ends on one without a `wide` / `collapse` / `explode` after it.

## Worlds (optional)

`world: "sea"` in the plan renders every clip opaque and full-frame inside that world, and adds a `backdrop` clip that plays dimmed behind the 2D setup and payoff. Code: `blender/world/`. Colors: the muted `env.*` tokens.

- The sea needs a model with a `waterline` part (`validateScript` checks it).
- Extra shot fields: `frameY` (screen height of the focus, 0 top to 1 bottom, default 0.42, above the captions) and, on a clip's start, `sea` (`calm` or `bowWave`).
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

## Render time

Three workers on the RTX 3000 Ada laptop: about 0.4-0.5 s a frame for plain clips, about 2.5 s a frame for the sea world at 1080x1920. Iterate with `--frames`, `--preview` and `--only`.
