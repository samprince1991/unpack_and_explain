# 3D hero scene: one three.js mechanism per reel

Date: 2026-10-30. Status: approved, built (library + enforcement). First hero3d post: the next new reel. Implementation notes and small deviations: `docs/plans/2026-10-30-3d-hero.md`.

## Problem

Reels are drawn as 2D SVG line art. The repo already has three.js (`three` 0.187, `@react-three/fiber` 9, `@remotion/three`) but only one 3D piece, `components/three/WireGlobe.tsx`, used once (post 02). We want every new reel to carry real 3D depth, without slowing every render or turning every reel into the same 3D look.

## Rule

- **Every new reel's mechanism section is a 3D hero scene** built with three.js through `@remotion/three`. Hook, setup and payoff stay 2D (scene styles in `src/components/styles/`).
- **Existing posts (01, 02, 18, 20) are exempt.** They are approved or rendered; they opt out explicitly so the validator stays green and nothing re-renders differently.
- 3D follows the same brand rules as 2D: neutral `colors.diagram.*` line art, **one amber key element per beat**, drawn inside the visual region on the 540 column, no teal, no hex outside `src/brand/`.
- Motion only from `useCurrentFrame()` (never R3F `useFrame()`), synced with `useCue` like 2D scenes.
- Text never renders in WebGL. Labels and numbers are 2D overlays (Inter / Poppins via `src/brand/fonts.ts`) positioned over the canvas.

Out of scope: 3D in other sections, 3D text, bloom / post-processing, downloaded models (GLTF), 3D transitions.

## Dependency

Add `@react-three/drei` (v10, matches fiber 9). We use only:
- `Line` (Line2 / LineSegments2): `lineWidth` in pixels. Plain WebGL lines are always 1 px, which disappears at 1080 px; WireGlobe works around it with thin tori.
- `Edges`: outline of a mesh's geometry with the same `Line` props (threshold 15 deg, so only real edges show).
- `OrthographicCamera` / `PerspectiveCamera` as needed.

## Units (`src/components/three/`)

Each unit takes props only (no post-specific text), is previewed in Studio under **Kit-Three**, and reads colors only from tokens.

### `Stage3D`
The canvas every 3D style draws into.
- `ThreeCanvas` sized to `layout.column.width` x visual region height, placed at `layout.column.x`, `layout.regions.visual.top` (same as WireGlobe).
- Props: `camera: "perspective" | "ortho"`, `orbit?: number` (degrees per second around Y), `tilt?: number` (degrees down), `shots?: Shot3D[]` (`{ at, target: [x,y,z], zoom }`, glide between them with `ease.smooth`, mirroring 2D `Camera`), `duration` (pass `useSection().durationInFrames`), `children`.
- All camera maths is a pure function `cameraAt(frame, props)` so it can be unit-tested.

### `materials.ts`
Token-colored helpers: `line(role)` returns `{ color, lineWidth }` for `stroke` / `soft` / `faint` / `amber`; `fill` returns the dark object fill (`colors.diagram.fill`) so solids hide the lines behind them. One place for line widths (`LINE = { main: 3, soft: 2, faint: 1.5 }` px, tuned in Kit-Three).

### `WireObject`
A primitive drawn as `Edges` over a dark fill: `shape: "box" | "cylinder" | "slab" | "card" | "phone"`, `size`, `position`, `rotation`, `accent?: boolean` (amber edges), `drawAt` (scale + opacity in over 12 frames, `ease.out`). Building block for the other styles and for one-off objects.

### `ExplodedView`
A stack of layers that separate along an axis.
- Props: `layers: { shape, size }[]`, `keyIndex?: number` (the one amber layer; a single index, so two amber layers can't happen), `axis: "y" | "z"`, `gap`, `explodeAt`, `explodeFrames` (default 20), `stagger`.
- Pure helper `layerOffset(i, frame, props)` for tests.
- 2D labels: optional `labels` rendered by the scene, using exported `projectToScreen()` (a pure helper that projects a 3D point with the stage camera to frame pixels) so labels track the layers.

### `NetworkGraph3D`
Nodes and edges in space, with one amber route.
- Props: `nodes: { id, pos: [x,y,z], shape?: "dot" | "box" }[]`, `edges: [id, id][]`, `drawAt` (edges draw in one after another), `route?: id[]`, `travelAt`, `travelFrames`.
- The amber packet travels the route with a short tail; the destination node pings (amber ring) on arrival. Non-route edges stay `faint`, route edges become `soft` as the packet passes.
- Pure helper `packetAt(frame, route, nodes)` returns position + segment index.

### `Bars3D`
Columns rising from a faint floor grid.
- Props: `values: number[]`, `keyIndex` (amber column), `riseAt`, `stagger`, `maxHeight`.
- Value labels are 2D `NumberCounter` overlays placed with `projectToScreen()`.
- Pure helper `barHeight(i, frame, props)`.

`WireGlobe` stays as it is (may move onto `Stage3D` later).

## Data flow

`src/posts/post-NN-slug/scenes/MechanismScene.tsx` wraps a `Stage3D` and one or more 3D styles, passing frames from `useCue("word", fraction)`. Each beat of the mechanism is a camera shot or a style event (explode, travel, rise), so motion lands at least every 2 s. Geometry from a finished beat fades to `faint` or out (same "keep diagrams sparse" rule as 2D).

## Enforcement

`PostScript` gets a required field:

```ts
// The mechanism is a 3D hero scene (three.js). Posts built before 3D opt out with a reason.
hero3d: "mechanism" | { optOut: string };
```

- TypeScript fails if the field is missing.
- `validateScript` errors when `optOut` is an empty string.
- A repo test (`hero3d.test.ts`, next to the brand guard) reads every `src/posts/*/script.ts` with `hero3d: "mechanism"` and fails if that post's `scenes/MechanismScene.tsx` does not import from `components/three`.
- Posts 01, 02, 18, 20 get `hero3d: { optOut: "built before 3D heroes" }`.

## Rendering

WebGL in headless Chrome needs `--gl=angle`. Every reel QA and render command in CLAUDE.md gets it (stills, sequence, wav render, final render). Set it once in `remotion.config.ts` (`Config.setChromiumOpenGlRenderer("angle")`) so the commands don't change and nobody forgets it; CLAUDE.md notes this. The config file only applies to the CLI; any Node-API render script must pass `chromiumOptions: { gl: "angle" }` itself.

## Docs

CLAUDE.md:
- Motion kit table: `Stage3D`, `WireObject`, `ExplodedView`, `NetworkGraph3D`, `Bars3D`.
- Per-post workflow step 4 and the QA checklist: "mechanism is a 3D hero (`hero3d`), labels are 2D overlays, one amber element per beat".
- Variety: 3D styles rotate like scene styles (don't lead with the same 3D style as the previous post).

## Testing

- Unit: `cameraAt`, `layerOffset`, `packetAt`, `barHeight`, `projectToScreen` (pure maths), `validateScript` opt-out rule, `hero3d.test.ts` guard.
- Brand guard still passes (no hex / font strings in `components/three/`).
- Visual: Kit-Three shows all four styles plus WireGlobe; check stills at the busiest frame and a contact sheet (`scripts/contact-sheet.py`) for motion and line weight at full size.
- `npm run lint`, `npm test`.
