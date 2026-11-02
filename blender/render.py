"""Entry point, run by `npm run blender` (video/scripts/blender.ts):

  blender -b --factory-startup --python blender/render.py -- <job.json> <out_dir> [--preview] [--only=a,b]
  blender -b --factory-startup --python blender/render.py -- --selftest <out_dir>

Renders each clip of the job as an RGBA PNG sequence into <out_dir>/<clip>/0000.png...
and merges its entry (hash, size, labels) into <out_dir>/manifest.json."""

import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

import build  # noqa: E402
from common import HERE, load_json, load_tokens, reset_scene, script_args  # noqa: E402

REPO_ROOT = os.path.dirname(HERE)


def render_clip(job, clip, out_dir, tokens, preview):
    scene = reset_scene()
    labels = build.build_clip(scene, job, clip, tokens, preview, REPO_ROOT)
    clip_dir = os.path.join(out_dir, clip["id"])
    shutil.rmtree(clip_dir, ignore_errors=True)
    os.makedirs(clip_dir, exist_ok=True)
    scene.render.filepath = os.path.join(clip_dir, "####")
    print(f"[blender] rendering {clip['id']}: {clip['frames']} frames{' (preview)' if preview else ''}")
    bpy.ops.render.render(animation=True)
    return {
        "hash": clip["hash"],
        "frames": clip["frames"],
        "width": clip["width"],
        "height": clip["height"],
        "preview": preview,
        "blenderVersion": bpy.app.version_string,
        "labels": labels,
    }


def write_manifest(path, manifest):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)


def run_job(job_path, out_dir, preview, only):
    tokens = load_tokens()
    job = load_json(job_path)
    os.makedirs(out_dir, exist_ok=True)
    manifest_path = os.path.join(out_dir, "manifest.json")
    manifest = load_json(manifest_path) if os.path.exists(manifest_path) else {}
    manifest = {"postId": job["postId"], "clips": manifest.get("clips", {})}
    for clip in job["clips"]:
        if only and clip["id"] not in only:
            continue
        manifest["clips"][clip["id"]] = render_clip(job, clip, out_dir, tokens, preview)
        write_manifest(manifest_path, manifest)  # keep progress if a later clip fails


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
    clip = {"id": "cover", "frames": 1, "width": 1080, "height": 870, "hash": "selftest",
            "start": {"yaw": 35, "pitch": 20, "zoom": 1}, "beats": []}
    run = render_clip(job, clip, out_dir, tokens, preview=True)
    image = bpy.data.images.load(os.path.join(out_dir, "cover", "0000.png"))
    px = list(image.pixels)
    rgba = [px[i : i + 4] for i in range(0, len(px), 4)]
    transparent = any(p[3] < 0.01 for p in rgba)
    amber = any(p[3] > 0.5 and p[0] > 0.6 and 0.25 < p[1] < 0.8 and p[2] < 0.35 for p in rgba)
    print(f"[selftest] blender {run['blenderVersion']}: transparent={transparent} amber={amber}")
    if not (transparent and amber):
        raise SystemExit(1)
    print("[selftest] OK")


def main():
    args = script_args()
    flags = [a for a in args if a.startswith("--")]
    rest = [a for a in args if not a.startswith("--")]
    if "--selftest" in flags:
        selftest(rest[0])
        return
    only = next((f.split("=", 1)[1].split(",") for f in flags if f.startswith("--only=")), None)
    run_job(rest[0], rest[1], "--preview" in flags, only)


try:
    main()
except SystemExit as err:
    if err.code not in (0, None):
        print(f"[blender] {err}")
    sys.exit(err.code if isinstance(err.code, int) else 1)
