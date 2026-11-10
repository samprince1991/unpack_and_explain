"""Run by `npm run blender` (video/scripts/blender.ts), which decides what to render:

  blender -b --factory-startup --python-exit-code 1 --python blender/render.py -- \
    --worker <job.json> <clip_id> <out_dir> <frame,frame,...> <meta.json or -> [--preview]
  blender -b --factory-startup --python-exit-code 1 --python blender/render.py -- --selftest <out_dir>

A worker renders the given frames of one clip as RGBA PNGs named NNNN.png into <out_dir>.
With a meta path it also writes that clip's label tracks and the Blender version."""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

import build  # noqa: E402
from common import HERE, load_json, load_tokens, reset_scene, script_args  # noqa: E402

REPO_ROOT = os.path.dirname(HERE)


def render_frames(job, clip, out_dir, frames, tokens, preview):
    """Builds the clip's scene, renders the frames, and returns its label tracks."""
    scene = reset_scene()
    labels = build.build_clip(scene, job, clip, tokens, preview, REPO_ROOT)
    os.makedirs(out_dir, exist_ok=True)
    for frame in frames:
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(out_dir, f"{frame:04d}.png")
        bpy.ops.render.render(write_still=True)
    return labels


def run_worker(job_path, clip_id, out_dir, frames, meta_path, preview):
    job = load_json(job_path)
    clip = next(c for c in job["clips"] if c["id"] == clip_id)
    labels = render_frames(job, clip, out_dir, frames, load_tokens(), preview)
    if meta_path != "-":
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({"labels": labels, "blenderVersion": bpy.app.version_string}, f)


def selftest(out_dir):
    """Renders a cube in look A and checks the PNG has transparency and an amber key."""
    tokens = load_tokens()
    job = {
        "postId": "selftest",
        "fps": 30,
        "model": {
            "id": "selftest",
            "selftest": True,
            "parts": {"body": ["body"]},
            "keyPart": "body",
            "explode": {"axis": "x", "order": ["body"], "spacing": 0.3},
            "spinAxis": "z",
        },
    }
    clip = {"id": "cover", "frames": 1, "width": 1080, "height": 870,
            "start": {"yaw": 35, "pitch": 20, "zoom": 1}, "beats": []}
    render_frames(job, clip, out_dir, [0], tokens, preview=True)
    image = bpy.data.images.load(os.path.join(out_dir, "0000.png"))
    px = list(image.pixels)
    rgba = [px[i : i + 4] for i in range(0, len(px), 4)]
    transparent = any(p[3] < 0.01 for p in rgba)
    amber = any(p[3] > 0.5 and p[0] > 0.6 and 0.25 < p[1] < 0.8 and p[2] < 0.35 for p in rgba)
    print(f"[selftest] blender {bpy.app.version_string}: transparent={transparent} amber={amber}")
    if not (transparent and amber):
        raise SystemExit(1)


def main():
    args = script_args()
    flags = [a for a in args if a.startswith("--")]
    rest = [a for a in args if not a.startswith("--")]
    if "--selftest" in flags:
        selftest(rest[0])
        return
    if "--worker" not in flags:
        raise SystemExit("render.py is run by `npm run blender`")
    job_path, clip_id, out_dir, frames, meta_path = rest
    run_worker(job_path, clip_id, out_dir, [int(f) for f in frames.split(",")], meta_path, "--preview" in flags)


try:
    main()
except SystemExit as err:
    if err.code not in (0, None):
        print(f"[blender] {err}")
    sys.exit(err.code if isinstance(err.code, int) else 1)
