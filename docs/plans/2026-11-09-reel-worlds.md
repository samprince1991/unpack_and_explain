# Reel Worlds Pilot Implementation Plan

> Run inline with superpowers:executing-plans (`CLAUDE.md`: no subagents). Steps use `- [ ]` tracking.

**Goal:** Find out whether post 26 rebuilt as a full-frame Blender world beats the current reel, and stop early if it doesn't.

**Architecture:** An optional `world` preset in a post's `blender` plan. `blender/world/` builds the sea around the existing model, parts and beats; the template draws world clips full-frame. Posts without `world` must not change.

**Tech:** Blender 4.5 LTS (Eevee, Freestyle), Remotion, Vitest. Spec: `docs/specs/2026-11-09-reel-worlds-design.md`.

**Progress:** Gate 1 passed (user, 2026-11-09). Motion test rendered; user review pending before Part 2.

---

## Part 1: Gate 1, three still frames

Exploratory render code, so visual review replaces TDD here. Task 3 is the decision point.

### Task 1: `env.*` tokens

**Files:** Modify `video/src/brand/tokens.ts`, `video/scripts/blender.ts`.

- [ ] Add `colors.env` (muted sky, horizon, fog, sea and light tones) to `tokens.ts`.
- [ ] Export them as `tokens.colors.env` in `scripts/blender.ts`, so `blender/tokens.json` gets them.
- [ ] Run `npm test`. Expected: pass, including the brand guard.
- [ ] Commit.

### Task 2: Style frame script

**Files:** Create `blender/world/__init__.py`, `blender/world/sea.py`, `blender/world/styleframes.py`.

- [ ] `sea.py`: `build_sea(scene, tokens, parts)` builds sky, fog, light and a section-cut water mesh whose surface is ambient swell + `bow` + `bulb` shape keys. The wave heights are sampled from the model's own `bowwave` / `bulbwave` tube geometry, so nothing is defined twice.
- [ ] `styleframes.py`: loads the existing post 26 `3d/job.json`, reuses `build.import_model`, `build.group_parts`, `build.Clip` and `look.*`, and renders `wide`, `split` and `waves` at 1080x1920 into `video/out/qa/worlds/`, printing seconds per frame.
- [ ] Commit once the frames render.

### Task 3: Gate 1 decision

- [ ] Inspect all three frames at full size, plus their captions region and the 4:5 crop.
- [ ] Put them beside the current frames and show the user, with the measured seconds per frame.
- [ ] **Stop and wait.** If they don't clearly win, record that in the spec and end the pilot.

## Part 2: Pipeline (only after Gate 1 passes)

These stay at outline level on purpose: their details depend on what the stills settle (fog method, mesh density, framing). Expand each with full code and tests here before starting it.

### Task 4: `world` in the plan and job
`templates/types.ts`, `blenderJob.ts`, `validateScript`. TDD: a post without `world` keeps its job and hash; `world: "sea"` is accepted and enters the hash; unknown presets are rejected.

### Task 5: Full-frame clips
World clips use a 1080x1920 area, opaque film and no edge mask in `BlenderClip`. TDD on the area logic; existing posts unchanged.

### Task 6: World in the renderer
`build_clip` calls `world/sea.py` when the job has `world`. The `collapse` / `explode` beats also key the water shape keys. A `selftest` still passes for look A.

### Task 7: Backdrop and caption gradient
A ship-free sea backdrop clip for setup and payoff, dimmed. A token-colored gradient behind captions.

### Task 8: Convert post 26
Copy the current render and `3d/` aside first. Add `world: "sea"`, retune shots, keep the script text. `npm run blender -- post-26-bulbous-bow --preview`, review, then full render.

### Task 9: QA and comparison
Full reel QA from `CLAUDE.md`, the master render, and a side-by-side video. The user decides. Only on a win: update `CLAUDE.md` and the per-post workflow.
