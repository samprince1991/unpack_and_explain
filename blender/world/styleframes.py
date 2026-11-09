"""Gate 1 of the reel-worlds pilot: three full-size stills of post 26 in the sea world.

  blender -b --factory-startup --python blender/world/styleframes.py -- <job.json> <out_dir> [--scale=50] [--only=wide,split]
"""

import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [os.path.dirname(HERE), HERE]

import bpy  # noqa: E402

import build  # noqa: E402
import look  # noqa: E402
import sea as sea_world  # noqa: E402
from common import load_json, load_tokens, reset_scene, script_args  # noqa: E402

REPO_ROOT = os.path.dirname(os.path.dirname(HERE))
WIDTH, HEIGHT = 1080, 1920
# Puts the focus at about y 800 of 1920, above the captions (shift is a fraction of the width).
SHIFT_Y = -0.15

LENS = 30  # wider than the band clips' 50 mm: closer camera, a more monumental ship

SHOTS = {
    "wide": {"yaw": 20, "pitch": 9, "zoom": 3.0, "keyPart": "bulb", "aim": "bulb", "exploded": True},
    "split": {"yaw": 14, "pitch": 7, "zoom": 5.0, "keyPart": "bulb", "aim": "bulb", "exploded": True},
    "waves": {"yaw": 6, "pitch": 9, "zoom": 3.4, "keyPart": "bulbwave", "aim": "bulb", "exploded": False, "bow": 1.0, "bulb": 0.0},
}


def render_shot(name, shot, job, tokens, out_dir, scale):
    scene = reset_scene()
    look.setup_render(scene, WIDTH, HEIGHT, job["fps"], 1, False)
    scene.render.resolution_percentage = scale
    look.setup_world(scene, tokens)
    meshes, radius = build.import_model(job["model"], REPO_ROOT)
    parts = build.group_parts(meshes, job["model"], tokens)
    look.setup_lights(radius)
    look.setup_glow(scene)
    clip = {
        "id": name,
        "frames": 1,
        "width": WIDTH,
        "height": HEIGHT,
        "start": {k: shot[k] for k in ("yaw", "pitch", "zoom", "keyPart", "aim", "exploded")},
        "beats": [],
    }
    c = build.Clip(scene, job, clip, tokens, parts, radius)
    c.start()
    sea = sea_world.build_sea(scene, tokens, parts)
    sea_world.set_waves(sea, shot.get("bow", 0.0), shot.get("bulb", 0.0))
    if not shot["exploded"]:
        bpy.context.view_layer.update()
        sea_world.wave_lines_to_cut(parts, sea)
    camera = c.rig.cam.data
    camera.animation_data_clear()
    camera.lens = LENS
    camera.shift_y = SHIFT_Y
    scene.frame_set(0)
    scene.render.filepath = os.path.abspath(os.path.join(out_dir, f"{name}.png"))
    started = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"[styleframes] {name}: {time.time() - started:.1f} s at {scale}%")


def main():
    args = script_args()
    flags = [a for a in args if a.startswith("--")]
    rest = [a for a in args if not a.startswith("--")]
    scale = next((int(f.split("=")[1]) for f in flags if f.startswith("--scale=")), 100)
    only = next((f.split("=")[1].split(",") for f in flags if f.startswith("--only=")), list(SHOTS))
    tokens = load_tokens()
    job = load_json(rest[0])
    os.makedirs(rest[1], exist_ok=True)
    for name in only:
        render_shot(name, SHOTS[name], job, tokens, rest[1], scale)


try:
    main()
except SystemExit as err:
    print(f"[styleframes] {err}")
    sys.exit(1)
except Exception:
    import traceback

    traceback.print_exc()
    sys.exit(1)
