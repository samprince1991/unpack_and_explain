# Faster, safer `npm run blender`

Date: 2026-11-09. Status: design approved, spec awaiting review. Builds on `2026-11-02-blender-3d-design.md`.

## Goal

Shorten the 3D iteration loop and the final render, keeping one render path: `npm run blender` is the only way clips reach a reel. The Blender MCP stays an optional workbench; nothing rendered or edited in a live session ships.

Out of scope: `blender/dev.py` (a live loader that only served the MCP), AI model generators, asset library changes.

## Problems today

- Checking a frame at full size means rendering its whole clip.
- `render_clip` deletes the clip folder before rendering, so a `--preview` or a failed run loses a good full render. If the job hash is unchanged, the old manifest entry still claims the clip is there.
- Every clip re-renders unless limited with `--only`.
- The clip hash covers the catalog entry, not the geometry, so a changed GLB does not mark clips stale.
- Clips render in one Blender process, one frame at a time.

## Benchmark

Post 21, mechanism clip, 12 full-size frames per process, on the RTX 3000 Ada laptop (8 GB VRAM). Short sample, one run each:

| Processes | Wall time | Frames/s | Speedup | Peak VRAM |
|---|---|---|---|---|
| 1 | 11.3 s | 1.06 | n/a | 2.5 GB |
| 2 | 15.6 s | 1.53 | 1.4x | 3.4 GB |
| 3 | 18.7 s | 1.93 | 1.8x | 4.2 GB |
| 4 | 35.5 s | 1.35 | 1.3x | 4.6 GB |

The scene build took 0.3-0.4 s per process. A frame rendered alone was pixel-identical to the same frame rendered in sequence. Post 26's sea world (1080x1920) was not measured; see Testing.

## Design

### Render flow

`scripts/blender.ts` owns the decisions and the manifest. `blender/render.py` only renders the frames it is given. For each clip in the job:

1. **Check:** compare the clip with its manifest entry (see Skip rules) and print whether it renders or skips, and why.
2. **Split:** cut the clip into 40-frame chunks. A pool of workers (default 3) takes the next chunk as each finishes, so a slow stretch holds up only its own chunk. The cover and clips of 40 frames or fewer run as a single chunk. Clips render one after another.
3. **Render to a temp folder:** workers write `<clip>.tmp/NNNN.png`, keeping today's frame numbering. Each worker also writes its label tracks to a side file; label tracks cover the whole clip, so the first chunk's file is used.
4. **Verify and swap:** when every chunk has exited 0 and the folder has exactly `frames` PNGs named `0000` to `frames - 1`, the temp folder replaces the clip folder and Node writes the manifest entry.

Node is the only manifest writer, so workers never race on it.

**On failure:** any non-zero exit (including a geometry QC failure) stops the other workers, removes the temp folder, and exits non-zero naming the clip. The old clip and its manifest entry stay untouched. Clips finished earlier in the run stay valid. A leftover `<clip>.tmp` from a killed run is deleted when that clip next renders.

### `--frames`

- `--frames`: for each selected clip, the first frame, last frame and every beat frame, de-duplicated.
- `--frames=120,240`: those frames for each selected clip. Frames past a clip's end are dropped with a warning; pair with `--only` when the numbers refer to one clip.
- Full size by default; `--preview` makes them small.
- Output: `video/out/blender-frames/<post>/<clip>/NNNN.png`. The folder for a clip is replaced on each run.
- Never touches the manifest or clip folders, and is never read by Remotion. It always renders (no skip) and uses the same worker pool.

### Stale rules

Each manifest clip entry gains two fields, separate from the existing `hash`:

| Field | Covers | Mismatch means |
|---|---|---|
| `modelHash` | Bytes of the catalog model's GLB | Clip status `stale`: Studio warns, a final render refuses |
| `codeHash` | `blender/build.py`, `look.py`, `common.py`, `qc.py`, `render.py`, `world/*.py`, `tokens.json` | `npm run blender` re-renders; final renders are not blocked |

`codeHash` normalizes line endings so a Git checkout does not change it.

**Where the check runs:** `calculateReelMetadata` runs in the browser and cannot read the repo, but the GLB is in `public/`, so it can `fetch(staticFile(model.file))` and hash the bytes. Node and browser must produce the same `modelHash`, so the byte-hash function is shared and tested. `calculateCoverMetadata` gets the same check. `codeHash` is compared only in Node.

**Existing renders:** a manifest entry without `modelHash` is accepted by final renders, so shipping this marks nothing stale. Those entries are re-rendered the next time `npm run blender` runs on that post.

**Known limits:**
- A real look change still needs a manual `BLENDER_LOOK_VERSION` bump to block old posts.
- Editing `blender/models/<id>.py` counts only once the GLB is rebuilt. This is correct: renders read the GLB.
- A hand-made `blender/models/<id>.blend` is outside `public/`, so the final-render check cannot see it. None exist today. If one appears, `npm run blender` includes it in that post's `codeHash` (not `modelHash`, which the browser must be able to reproduce) and logs that final renders cannot verify it.

### Skip rules

A clip is skipped only when all of these hold:

- `hash`, `modelHash` and `codeHash` match
- the requested quality is met: a full render satisfies both modes, a preview render satisfies only `--preview`

So `--preview` no longer overwrites a matching full render, and QA contact sheets use the full render when there is one.

### Flags

| Flag | Meaning |
|---|---|
| `--workers=N` | Worker count, default 3. `--workers=1` is one process at a time |
| `--force` | Re-render clips that are up to date |
| `--only=a,b` | Narrows which clips are considered. **Changed:** it no longer forces a re-render on its own |
| `--preview` | Unchanged: 25% size, low samples |
| `--frames[=list]` | Test stills, above |
| `--selftest` | Unchanged, one process |

`render.py` gains a worker mode that takes one clip and a frame list. `kit-blender` uses the normal flow.

## Testing

**Unit tests (`npm test`):** the skip decision (each field mismatched, preview against full, missing fields), chunking, beat frame selection, clip statuses with `modelHash`, the byte hash, and `codeHash` line-ending normalization.

**Real runs, before calling this done:**
1. `kit-blender` with `--workers=1` and `--workers=3`: every frame pixel-identical, and label tracks identical.
2. Post 26 with 3 workers while logging VRAM with `nvidia-smi`. If it runs out of memory or slows below 2 workers, lower the default or set a per-world limit.
3. Force a worker failure mid-clip: old clip and manifest entry intact, non-zero exit, temp folder gone.
4. A second run with nothing changed skips everything; touching a GLB byte in a test copy makes a final render refuse.
5. `--frames` on post 21: stills appear under `out/`, and the manifest and clip folders are byte-identical before and after.

Then `npm run lint`, `npm test`, and update the commands and render times in `CLAUDE.md`.
