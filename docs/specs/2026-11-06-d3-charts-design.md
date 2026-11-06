# D3 charts: frame-driven data visuals for reels and carousels

Date: 2026-11-06. Extends `2026-10-30-reel-variety-design.md` (scene styles) and
`2026-10-30-carousel-renderer-design.md`.

## Problem

Data topics (shares, comparisons, flows, "what's inside") only have `ShareGrid`, `Gauge` and
the five unbranded chart Elements. Each new chart is hand-rolled geometry. We want a small,
branded chart kit with real layout maths (scales, arcs, treemaps, sankey flows) that renders
deterministically in Remotion and works on carousel slides too.

ECharts was considered and dropped: its animation runs on the wall clock, and theming it to
the brand means fighting its defaults. D3 is used **for maths only**.

## Approach

D3 modules compute geometry; our React SVG components draw it; motion comes from
`useCurrentFrame()` + `interpolate()` like every other style piece (`ShareGrid`, `Gauge`).

- Allowed: `d3-scale`, `d3-shape`, `d3-array`, `d3-hierarchy`, `d3-sankey` (+ `@types/*`).
  Individual modules, never the `d3` bundle.
- Never: `d3-selection`, `d3-transition`, `d3-timer`, `d3-ease` (DOM mutation / wall clock /
  our easings live in `brand/motion.ts`). A unit test fails if any file under `src/` imports
  them.

Rejected: D3 selections writing into an SVG per frame (fights React, breaks `Interactive`
Studio edits) and a generic config-driven `<Chart spec>` (heavy, hard to keep on brand).

## Structure

### `src/brand/charts.ts` (data only, no React)

| Value | Meaning |
|---|---|
| `stroke`, `strokeSoft` | Line widths for main shapes / axes and guides |
| `labelSize` | `typeScale.label` (46 px); value labels never smaller than 44 px |
| `radius`, `barGap` | Corner radius, gap between bars as a fraction of the band |
| `limits` | bars / slices / funnel stages <= 6; line points 2-8; treemap leaves <= 8; tree nodes <= 5 per level and depth <= 3; sankey nodes <= 4 per column, columns 2-3 |
| `stagger` | Frames between items entering |

### `src/components/charts/<chart>/`

One folder per chart, two files each:

- `layout.ts`: pure function `(data, box, options) => shapes` (rects, paths, label anchors).
  No React, no frame. Throws `ChartLimitError` with a readable message when data exceeds
  `charts.limits`, so an unreadable chart fails in Studio instead of shipping.
- `<Name>.tsx`: draws the layout and animates it.

Shared helpers in `src/components/charts/common.ts`: `Box` type (`{ x, y, width, height }`),
`chartProgress(frame, { at, keyAt, exitAt, still, index })` → `{ enter, key, exit }`, and
`ChartText` (Inter Medium, `labelSize`; bar values count up with the bar's growth).
Names (`name` on a datum) are always drawn when given and fit-checked; a name that can't
fit throws. Value labels follow `values`.

### Pieces

| Component | D3 | Entrance | Key (amber at `keyAt`) |
|---|---|---|---|
| `BarChart` (`orientation: "vertical" \| "horizontal"`) | `scaleBand`, `scaleLinear` | Bars grow from the baseline, staggered | One bar |
| `LineChart` | `scaleLinear` / `scalePoint`, `line` + `curveMonotoneX` | Line draws in (`@remotion/paths` `evolvePath`), points pop after | One point (+ its value) |
| `PieChart` (`donut?: boolean`) | `pie`, `arc` | Slices sweep in clockwise | One slice (slight pull-out) |
| `Treemap` | `hierarchy`, `treemap` (`treemapSquarify`) | Blocks split in by depth | One block |
| `TreeDiagram` | `hierarchy`, `tree` | Branches draw in level by level, nodes pop | One node + the path to it |
| `Sankey` | `d3-sankey` | Flow bands draw from source to target, staggered | One flow band |
| `Funnel` | `scaleLinear` (own trapezoids) | Stages drop in top to bottom | One stage |

Shared props on every chart:

```ts
type ChartProps<D> = {
  data: D;
  box: Box;              // where it sits, inside SceneCanvas / SlideCanvas
  keyId?: string;        // the one amber item (omit = no amber yet)
  at?: number;           // entrance start, local frames
  keyAt?: number;        // amber on; sync with useCue
  exitAt?: number;       // fade out
  format?: (v: number) => string;
  unit?: string;         // shown on value labels (metric + imperial where relevant)
  values?: "none" | "key" | "all"; // value labels, default "key"
  still?: boolean;       // carousel: final pose, key already amber, no animation
};
```

Colors: fills `colors.diagram.fill`, outlines `diagram.stroke` / `soft`, guides and axes
`diagram.faint`, key item `amber.500`. No teal, no coral (except a future Q/F use, out of
scope). Fonts only via `brand/fonts.ts`. Axes are minimal: a baseline and at most 3 faint
gridlines; no legends, no tooltips.

## Use rules

- Reels: hook, setup or payoff (the mechanism stays the Blender hero). Inside `SceneCanvas`,
  `box` within the visual region on the 540 column.
- Carousels: `still` inside `SlideCanvas`. A chart on a content slide is the slide's visual.
- One amber item per beat. Labels show numbers and units only, never words the VO says.
- Counts stay within `charts.limits`; if a topic needs more, group the tail into "Other".
- Real numbers only, with a source; unknown numbers stay `{{number}}` in `verify`.

## Preview

`src/kit/KitCharts.tsx`, registered in `KitGallery` as:

- **Kit-Charts** (1080x1920): each chart in a reel scene, entrance → key → exit, one after
  another, with `showGuides`.
- **Kit-ChartsSlides** (1080x1350): each chart as a `still` slide, one frame per chart.

## Testing

- `layout.test.ts` per chart: shapes stay inside `box`; values map monotonically; over-limit
  data throws `ChartLimitError`; empty data throws.
- Determinism: render each chart's `layout` twice with the same input, deep-equal output.
- Import guard: no `d3-selection` / `d3-transition` / `d3-timer` / `d3-ease` / `d3` under `src/`.
- Existing brand guard covers color literals and font strings.
- Manual: Kit-Charts contact sheet at 25% and full-size stills of the busiest frame.

## Docs

- CLAUDE.md: a **Charts** block under the scene style library (table of the seven pieces and
  the use rules above); the Elements table points chart uses to `components/charts/`. The chart
  Elements stay in `src/elements/` as reference.

## Out of scope (add when a post needs it)

Maps (`d3-geo`), network graphs (`d3-force`, precomputed ticks), area / stacked charts,
scatter, radar, MYTH/FACT chart variants.
