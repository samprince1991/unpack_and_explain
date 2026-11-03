# Blender camera rhythm: close-ups, then wide

Date: 2026-11-03. Extends `2026-11-02-blender-3d-design.md`.

## Problem

The post 10 (undersea cables) and post 3 (jet engine) clips framed the whole model nearly all
the time. `focus` only zoomed 1.2x past the clip's framing and moved the camera halfway to the
part, so "close-ups" left the part small and off-center (a long, thin cable became a sliver
of line in empty navy). The only motion between beats was the 4 deg/s orbit.

## Pattern (every new reel)

**Wide to set the scene, close-ups on the part that matters, wide again so the whole thing
reads.** Built into `blender/build.py`, so a plan gets it without numbers:

| Piece | Behaviour | Constants |
|---|---|---|
| `focus` close-up | Camera aims at the part's center and zooms until the part (its bounding box) fills ~60% of the frame, clamped to 1.6-3.5x the clip's wide framing. `shot.zoom` still overrides (absolute) | `CLOSE_FILL`, `CLOSE_MIN`, `CLOSE_MAX` |
| `flow` follows | The camera travels with the amber dot (same 24 frames) into a close-up of the destination. `follow: false` keeps the camera still | `FLOW_FRAMES` |
| `wide` (new action) | Camera back to the whole model (fits the exploded spread when exploded), target at the center, amber unchanged. `explode` / `collapse` also end wide | |
| Push-in | The lens creeps 10% tighter over every clip, so the 3D never sits still between beats | `PUSH` |
| Depth of field | f-stop scales with zoom, so close-ups keep the same light blur instead of going soft | `FSTOP` |

`validateScript` warns (and the post's `script.test.ts` fails) when the mechanism has no
close-up (`focus` or followed `flow`), or ends on one without a `wide` / `collapse` /
`explode` after it.

`BLENDER_LOOK_VERSION` went to 2: every existing render is stale until `npm run blender` runs
again for that post.

## Writing a plan

- Open wide (the clip's `zoom` is the wide framing, ~1-1.3).
- One close-up per idea: `{ do: "focus", part }` with no zoom. Use `shot.yaw` / `pitch` to
  swing round to the side the part shows best.
- Let `flow` carry the camera to the next part instead of a separate focus.
- End wide: `{ cue: "<last idea word>", do: "wide" }` or a `collapse`.
- Check the busiest close-up at full size: the key part centered, nothing important cut at
  the column edge, labels inside `layout.regions`.
