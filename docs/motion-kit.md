# Motion kit, scene styles and charts

Reusable pieces for scenes. Prefer these over hand-rolled `interpolate` maths. Posts never import from `src/kit`.

## Motion pieces (preview: Kit-Motion)

| Piece | Use |
|---|---|
| `components/motion/Reveal` | Fade + settle in (`at`), optional `exitAt`. Replaces `frame >= cue ? <X/> : null`, which snaps |
| `components/motion/DrawPath` | Pen-stroke draw of any path (`@remotion/paths`), `eraseAt` to flow away, `dashed` |
| `components/motion/Travel` | Dot moving along a path with a comet tail (signals, packets); `repeat`, `until` |
| `components/motion/Ping` | Expanding amber rings on the key point |
| `components/motion/Float` | Perlin-noise drift (`@remotion/noise`) so nothing sits still between beats |
| `components/motion/Camera` | Wrap the drawing inside `SceneCanvas`: slow push-in plus `shots` that glide or zoom to a point on a cue. Pass `duration={useSection().durationInFrames}` in reels |
| `components/motion/progress` | `enterProgress`, `exitProgress`, `stagger` |
| `components/motion/Parallax` | Depth layer: near layers drift and push in more than far ones |
| `components/motion/LightSweep` | One soft glint crossing an area (`at`, `area`) |
| `components/motion/DustField` | Sparse specks drifting at different depths in the visual region |
| `components/icons/LineIcon` | Any `lucide-react` icon in diagram style (`accent` = amber). Draw bespoke icons only when none fits. Preview: Kit-Icons |
| `components/BlenderClip` / `BlenderLabels` | Plays a Blender clip (PNG sequence) by frame; 2D labels pinned to Blender parts. See `blender.md` |

## Section transitions (preview: Kit-Transitions)

Each post's look picks a transition mix. `Reel` also takes `transitions={{ mechanism: "push", payoff: "iris" }}` (keyed by the entering section), which wins over the mix. Options in `components/transitions/sectionTransitions.ts`:

- `dip`: the default
- `zoomDip`: a new chapter
- `push`: the next step
- `iris`: zoom into a detail
- `wipe`: before/after, myth/fact

Scenes are transparent over one background, so every transition hands off sequentially or with complementary masks. Never use stock `@remotion/transitions` presentations (slide, wipe, iris...) directly: they stack the two scenes.

## Animation libraries

Only frame-driven ones. Framer Motion / motion.dev, CSS animations and react-spring run on the wall clock and flicker in renders. GSAP only via `@remotion/gsap` (`useGsapTimeline`), and only if a timeline is genuinely easier than `interpolate`.

## Scene styles (preview: Kit-Styles)

Reusable visual languages in `src/components/styles/`. Build a new one when a post needs it, not in advance. Make it reusable from the start (props, no post-specific text) and follow the diagram rules (neutral `colors.diagram.*`, one amber element, inside `SceneCanvas`).

When planning a post's Visual column, check which styles the previous 3 posts used and lead with a different one.

| Style | Use |
|---|---|
| `ChatBox` | UI mock: a chat input typing a message; the send button can be the amber key |
| `CodeBlock` | UI mock: code as abstract lines (never readable), optional amber line, window chrome |
| `CycleDiagram` | Steps on a ring with arcs drawing in; `cycleLoop()` gives a path for `Travel` |
| `Gauge` | A dial with a moving needle: `levels` keyframes, optional `unit` and marked level |
| `GlidePath` | A descending route to a touchdown point on a runway |
| `PhoneFrame` | UI mock: phone outline + `phoneScreen()` for app content |
| `SeaSection` | Side view of an ocean between two coasts; `seaCable()` route along the seabed, `seaCableSplit()` for a break, `seaCoasts()` to place things |
| `MythSwap` | Q posts: the myth drawing falls away and the fact drawing settles in its place; pair with `Stamp` MYTH / FACT |
| `ShareGrid` | "X out of 100" grid: the share (fractions allowed) fills amber; for small percentages a pie would hide |
| `WaveProfile` | Side view of a ship's bow at the waterline, with a bow wave (`crest`, `crestAccent`) and optional `bulbs`; `waveProfilePoints()` to place things |

## Charts (preview: Kit-Charts, Kit-ChartsSlides)

`src/components/charts/`. D3 for layout maths only (`d3-scale`, `d3-shape`, `d3-array`, `d3-hierarchy`, `d3-sankey`); never `d3-selection`, `d3-transition`, `d3-timer` or `d3-ease` (a test bans them). Each chart is a pure `layout.ts` + a component.

- **Shared props:** `box`, `keyId` (the one amber item), `at`, `keyAt` (sync with `useCue`), `exitAt`, `values` (`"none"` / `"key"` / `"all"`, default `"key"`), `format`, `unit`, `still` (carousel final pose).
- **Limits** are in `src/brand/charts.ts`. Over them, or with a name that doesn't fit, the chart throws: group the tail into "Other" or shorten the name.
- **Where:** hook, setup, payoff and carousel slides. Never the mechanism.
- **Labels:** numbers, units and short names only.

| Chart | Use |
|---|---|
| `bar/BarChart` | Comparisons (vertical with short names, horizontal for longer names) |
| `line/LineChart` | Trends over time (negative values allowed) |
| `pie/PieChart` | Shares; `donut` puts the key value in the hole. Slices too narrow for their label get none |
| `treemap/Treemap` | What's inside (price, storage, parts); labels only where they fit |
| `tree/TreeDiagram` | Hierarchies (DNS, file systems); the path to the key turns amber |
| `sankey/Sankey` | Where something goes (money, energy, traffic); `keyId` = `"source->target"` |
| `funnel/Funnel` | Filtering steps (visits > signups > buys) |

## Live three.js (post 20 only)

New reels use Blender. `components/three/` keeps only what post 20 needs to re-render, plus `materials.ts`, whose line widths Blender also reads.

- `Stage3D` + `useStageView`, `Label3D`, `CycleRing3D`.
- Animate only from `useCurrentFrame()`, never R3F `useFrame()`.
- `remotion.config.ts` sets the ANGLE GL renderer, so CLI renders need no `--gl` flag. Node-API renders must pass `chromiumOptions: { gl: "angle" }`.
