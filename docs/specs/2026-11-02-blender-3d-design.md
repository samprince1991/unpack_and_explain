# Blender 3D: real models, lit line art, 3D frame 0 and cover

Date: 2026-11-02. Status: approved, built. Plan: `docs/plans/2026-11-02-blender-3d.md`. Deviations: clips use per-clip screen areas (`layout.blender`) instead of a lens shift; QA renders may accept `--preview` clips with the `allowBlenderPreview` prop; the first catalog model is procedural (`blender/models/jet_engine.py`); Blender 4.5.15 is installed portable (`BLENDER_PATH` in `video/.env`).
Supersedes for new posts: the live-three.js mechanism rule in `2026-10-30-3d-hero-design.md` (old posts keep it).

## Problem

Reels look empty on a phone: thin primitives (boxes, cylinders) fill 15-20% of the visual region, and the captions end up as the main visual. Frame 0 is text on a dark background, which also makes a weak thumbnail. We want every new reel to show a **real object in real 3D**, with a premium look that still reads as our brand, from frame 0 to the cover image.

## Decisions (approved in chat, 2026-11-02)

- **All 3D is rendered in Blender** (headless, scripted), not live in WebGL. Remotion composites the Blender renders with the 2D layers (captions, cards, labels, logo).
- **Look A, "lit line art":** dark navy shaded surfaces with a soft rim light, neutral line art on top, the one key part in amber with a slight glow (bloom), light depth of field. Transparent background, so our radial background shows through.
- **Where 3D appears in every new reel:** frame 0 (behind the question card), the hook, the mechanism, and a separate cover still. Setup and payoff stay 2D, plus frame-driven 3D effects (parallax, light sweep, dust).
- **Real models** come from an approved catalog (like memes), never AI-generated (brand rule: no AI imagery).

## Rules (new posts, from post 21 on)

1. `script.ts` has a `blender` plan: one catalog model, the cover and opener shots, the hook shot, and the mechanism beats keyed to spoken cue words.
2. Brand colors in Blender come only from a generated `tokens.json` (exported from `src/brand/tokens.ts`). No hex values in `blender/`; the brand guard test scans it.
3. Same color roles as 2D: neutral lines and fills, **one amber part per beat**, no teal, coral only on F failure beats. Text is never rendered in Blender: labels are 2D overlays placed from Blender's projected positions.
4. A Blender render that doesn't match the current `script.ts` + `vo.json` throws at render time (like a stale `vo.json`).
5. Posts 01, 02, 18, 20 are exempt (`blender: { optOut: "built before Blender" }`).

## Units

### 1. Model catalog: `src/brand/models.ts`, `public/models/`, `blender/models/`
Entry: `id`, `title`, `file` (`models/<id>.glb`), `source` (URL), `license` (`CC0` | `CC-BY` | `NASA` | `own`), `credit` (required for CC-BY, goes in the caption), `parts` (named mesh parts we animate, e.g. `fan`, `compressor`, `combustor`, `turbine`, `nozzle`), `keyPart` (default amber part), `upAxis` / `front` fix-ups, `useFor`. Sources to search first: NASA 3D Resources, Poly Haven, Kenney, Smithsonian 3D, Sketchfab (license filter).
Optional hand-prepared `blender/models/<id>.blend` (parts split and named, extra animation); when present it wins over the GLB.

### 2. Intake: `npm run model:add -- <raw.glb> --id <id>`
Node script using `@gltf-transform` (dev dependency): center, normalize scale (longest side = 2 units), weld, simplify, prune, write `public/models/<id>.glb`. Prints mesh names (to fill `parts`), rejects models over an edge budget (line-art spaghetti), and renders 4 preview stills in look A via Blender into `out/models/<id>/` for approval. Adds a catalog stub with `TODO` fields that the catalog test rejects until filled. Raw downloads go in `blender/raw/` (gitignored).

### 3. Blender renderer: `blender/`
- `blender/look.py`: builds look A from `tokens.json`: Principled surfaces in `diagram.fill` (roughness ~0.6), key + rim lights (neutral white, no colored light), Grease Pencil **Line Art** modifier for the lines (`diagram.stroke`, widths per role from `materials.ts` values exported in `tokens.json`), amber part = amber lines + low amber emission, compositor Glare (bloom) on the emission only, camera DoF. Eevee, transparent film, 30 fps.
- `blender/build.py`: imports the model (GLB or `.blend`), maps catalog part names to objects, and applies a **job**: camera shots, a slow default orbit (motion at least every 2 s), and beat actions as keyframes.
- `blender/render.py`: entry point `blender -b --factory-startup --python blender/render.py -- <job.json>`. Renders each requested clip as an RGBA PNG sequence, and writes `labels.json` (per-frame 2D screen position of every labeled part, via `world_to_camera_view`) and `manifest.json` (job hash, frame counts, Blender version).
- Beat actions (the vocabulary; extended only when a post needs it):
  `reveal` (parts scale/fade in, staggered), `focus` (camera glides to a part, that part turns amber, the previous amber part goes neutral), `explode` / `collapse` (parts slide apart along an axis in catalog order), `spin` (a part rotates from the cue, e.g. a fan), `flow` (amber dot travels part to part), `label` (a 2D label pinned to a part from the cue to the next beat), `shot` (camera only).
- Version pinned in `blender/VERSION` (Blender 4.5 LTS); the runner checks it and prints the `winget install BlenderFoundation.Blender` hint if Blender is missing.

### 4. Job runner: `npm run blender -- post-NN-slug [--only=cover,opener,hook,mechanism] [--preview]`
Node (`scripts/blender.ts`): loads `script.ts` and `vo.json`, resolves every beat cue to a frame with the existing `findCueMs` (the same maths as `useCue`, so 2D and 3D stay in sync), writes `public/posts/post-NN-slug/3d/job.json`, exports `blender/tokens.json`, runs Blender, then checks the manifest. `--preview` renders at 25% with low samples for fast iteration. Output: `public/posts/post-NN-slug/3d/<clip>/0000.png...`, gitignored (regenerable; a fresh clone needs Blender to render).

### 5. Remotion side
- `components/BlenderClip.tsx`: plays one clip by frame (`<Img>` per frame from `staticFile`), with `hold` / `loop` / `fade`, placed in the visual region on the 540 column. Missing render: a visible placeholder in Studio ("run npm run blender -- post-NN"), an error at render time.
- `components/BlenderLabels.tsx`: draws `labels.json` entries as 2D text (brand fonts, `typeScale`), clamped to `layout.regions`.
- `templates/metadata.ts`: compares the job hash recomputed from `script.ts` + `vo.json` with `manifest.json`; mismatch throws "Blender render is stale: npm run blender -- post-NN".
- **Frame 0:** `QuestionCard` gets an optional `backdrop` (the opener clip, dimmed, slow push-in) behind the text, with a soft dark scrim under the words so the question stays readable from frame 0. The Reel template wires it when `blender` is set.
- **Hook:** the hook scene draws `BlenderClip clip="hook"` under the hook title.
- **Mechanism:** `MechanismScene` draws `BlenderClip clip="mechanism"` + `BlenderLabels`.
- **Cover:** new `templates/Cover.tsx` → `CoverNN-Slug` still composition (1080x1920, 1 frame): cover render + `coverText` (defaults to `hookText`) with one amber word + small avatar mark. Title and model sit inside the area that survives both Instagram crops: 4:5 feed (y 285-1635) and 3:4 profile grid (y 240-1680), and inside the 540 column. `npm run cover -- post-NN-slug` renders `out/post-NN-slug-cover.png` (upload via "Edit cover").
- **3D effects for 2D sections** (`components/motion/`): `Parallax` (2-3 depth layers drift at different speeds), `LightSweep` (a soft highlight crossing the key object), `DustField` (sparse neutral particles drifting in depth). Frame-driven, token colors, previewed in Kit.

### 6. Script types and validation
```ts
blender: BlenderPlan | { optOut: string };
type BlenderPlan = {
  model: ModelId;
  coverText?: string;            // <= 4 words; defaults to hookText
  cover: Shot;                   // still
  opener: Shot;                  // frame-0 backdrop loop
  hook: Shot & { actions?: Beat[] };
  mechanism: { start: Shot; beats: Beat[] };
};
type Shot = { yaw: number; pitch: number; zoom: number; keyPart?: string; exploded?: boolean };
type Beat = { cue: string; fallback: number; do: "reveal" | "focus" | "explode" | "collapse" | "spin" | "flow" | "label" | "shot"; part?: string; to?: string; label?: string; shot?: Partial<Shot> };
```
`validateScript` adds: model id in the catalog; every `part` / `to` / `keyPart` in that model's parts; every cue spoken in its section (same check as memes); at most one amber part at a time; `label` text not repeating the VO (numbers/units only, per the mechanism rule); `coverText` <= 4 words; `hero3d: "mechanism"` required alongside `blender`.

## Workflow changes (CLAUDE.md, per-post workflow, `/ig-reel` overrides)
- Scripting (stage 4): the Visual column names the model and the part for each beat; pick the model from the catalog (or add one with `model:add`) and don't lead with the previous post's model.
- Build: after TTS, `npm run blender -- post-NN-slug --preview`, review, then the full render. Any TTS re-take of hook or mechanism means re-running Blender (the stale check enforces it).
- QA checklist adds: question readable over the backdrop at frame 0; one amber part per beat in the Blender clips; labels inside regions; cover readable at 4:5 and 3:4; model credit in the caption for CC-BY; render up to date.
- `hero3d.test.ts`: a post with a `blender` plan passes when its `MechanismScene.tsx` uses `BlenderClip`; old posts still pass with `components/three`.

## Testing
- Vitest: catalog entries complete (no `TODO`, CC-BY has credit, file exists); job building (cue → frame, fallback, hash stable and changes when VO changes); stale-manifest detection; new `validateScript` rules; brand guard extended to `blender/**/*.py` (no hex, no font names); cover layout inside both crops.
- Blender smoke test: `npm run blender -- --selftest` renders a catalog-free cube in look A at preview size and checks the PNG has alpha and an amber pixel.
- Visual QA: Kit-Blender composition (a catalog model's sample clips), the usual contact sheets for the reel, and the cover still.

## Costs and limits
- Render time: Eevee + Line Art at the visual-region size is roughly 1-3 s per frame, so a 20 s mechanism takes 10-30 minutes; `--preview` and `--only` keep iteration fast.
- PNG sequences are large (hundreds of MB per post), hence gitignored.
- Needs Blender installed locally; nothing renders 3D in CI.

## Out of scope
- Live WebGL GLB models (`WireModel`); existing `components/three` stays for old posts and the Kit.
- 3D in setup and payoff (2D + 3D effects only), 3D transitions, text inside Blender, AI-generated models.
- Carousel slides from Blender renders (easy later: reuse the cover still pipeline).
