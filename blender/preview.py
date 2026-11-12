"""Four look-A preview stills of a model, for approving it before it joins the catalog.
Every mesh object is drawn as its own part (stroke lines), no amber.

  blender -b --factory-startup --python blender/preview.py -- <model_id> <public-relative glb> <out_dir>
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402

import build  # noqa: E402
from common import HERE, load_tokens, reset_scene, script_args  # noqa: E402

ANGLES = [(-35, 18), (0, 8), (90, 8), (150, 25)]


def main():
    model_id, file, out_dir = script_args()[:3]
    tokens = load_tokens()
    repo = os.path.dirname(HERE)
    os.makedirs(out_dir, exist_ok=True)
    for i, (yaw, pitch) in enumerate(ANGLES):
        scene = reset_scene()
        # Discover object names first, then render each one as its own part.
        build.import_model({"id": model_id, "file": file}, repo)
        names = [o.name for o in scene.objects if o.type == "MESH"]
        scene = reset_scene()
        model = {
            "id": model_id,
            "file": file,
            # One lineset per object is slow for big models: group them past 40.
            "parts": {n: [n] for n in names} if len(names) <= 40 else {"all": names},
            "keyPart": None,
            "explode": {"axis": "x", "order": [], "spacing": 0},
            "spinAxis": "x",
            # model:add has just run QC with the catalog entry (its contacts); this stand-in
            # entry treats every object as a part, so QC here would flag listed contacts.
            "skipQc": True,
        }
        job = {"postId": "preview", "fps": 30, "model": model}
        clip = {"id": "preview", "frames": 1, "width": 1080, "height": 870, "hash": "",
                "start": {"yaw": yaw, "pitch": pitch, "zoom": 1}, "beats": []}
        build.build_clip(scene, job, clip, tokens, False, repo)
        scene.render.filepath = os.path.join(out_dir, f"view-{i}.png")
        bpy.ops.render.render(write_still=True)
    print(f"[preview] {len(ANGLES)} stills in {out_dir}")


main()
