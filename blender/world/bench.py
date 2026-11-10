"""The `bench` world: a jeweller's workbench at night. The model stands on a wide wooden
bench top; behind it a dim back wall carries a pegboard of hanging tools and a shelf of
jars, and a desk lamp on the bench's far left throws a warm pool of light onto the model.
The rest of the room falls away into the dark.

The model sits on the bench: its lowest point is the bench top. Nothing moves with it.

Like the other worlds it is shaded but carries no Freestyle lines, so `qc.py` still checks
only the model. Colors: the muted `env.*` tokens only. Deterministic (no random)."""

import math
import sys

import bpy
from mathutils import Vector

from build import interpolation

from common import color, color_srgb
from world import coast
from world import sea as sea_world

LENS = 50  # indoors: the automatic close-up maths assumes 50 mm, so close-ups size themselves
PUSH = 1.1
FRAME_Y = 0.42
HOVER = 0.004  # gap between the model's lowest point and the bench top

BENCH_X, BENCH_Y0, BENCH_Y1, BENCH_T = 6.0, -3.2, 2.4, 0.12  # half length, front, back, thickness
WALL_Y, WALL_H, SIDE_X = 2.6, 5.0, 7.0
PEG_X0, PEG_X1, PEG_Z0, PEG_Z1 = -2.6, 2.6, 0.7, 2.3
SHELF_Z, SHELF_X0, SHELF_X1 = 2.75, -3.4, 3.4
LAMP_X, LAMP_Y = -2.2, 0.9


def _box(name, center, half):
    cx, cy, cz = center
    hx, hy, hz = half
    verts = [(cx + sx * hx, cy + sy * hy, cz + sz * hz) for sz in (-1, 1) for sy in (-1, 1) for sx in (-1, 1)]
    faces = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (1, 3, 7, 5), (3, 2, 6, 7), (2, 0, 4, 6)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return bpy.data.objects.new(name, mesh)


def _room(scene, tokens):
    """Dark room: the background is the night sky token, very low, so the far room is black-blue."""
    world = bpy.data.worlds.new("bench-room")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = color(tokens["colors"]["env"]["skyTop"])
    bg.inputs["Strength"].default_value = 0.35
    scene.world = world


def _bench(level, coll, tokens):
    top = _box("bench-top", (0.0, (BENCH_Y0 + BENCH_Y1) / 2, level - BENCH_T / 2), (BENCH_X, (BENCH_Y1 - BENCH_Y0) / 2, BENCH_T / 2))
    coast._link(top, coll, coast._plain("bench-wood", "sand", tokens, roughness=0.65, fade=False))
    # Plank seams: thin darker strips across the top, along x.
    seams = [_box("seam", (0.0, y, level + 0.0008), (BENCH_X, 0.006, 0.0008)) for y in (-2.1, -0.95, 1.3)]
    coast._link(coast._merge("bench-seams", seams), coll, coast._plain("bench-seams", "road", tokens, fade=False))


def _walls(level, coll, tokens):
    walls = [
        _box("wall-back", (0.0, WALL_Y + 0.05, level + WALL_H / 2 - 1.0), (SIDE_X, 0.05, WALL_H / 2)),
        _box("wall-left", (-SIDE_X, 0.0, level + WALL_H / 2 - 1.0), (0.05, WALL_Y + 0.1, WALL_H / 2)),
        _box("wall-right", (SIDE_X, 0.0, level + WALL_H / 2 - 1.0), (0.05, WALL_Y + 0.1, WALL_H / 2)),
    ]
    coast._link(coast._merge("bench-walls", walls), coll, coast._plain("bench-walls", "surface", tokens, roughness=0.9, fade=False))


def _pegboard(level, coll, tokens):
    board = _box("pegboard", (0.0, WALL_Y - 0.02, level + (PEG_Z0 + PEG_Z1) / 2), ((PEG_X1 - PEG_X0) / 2, 0.02, (PEG_Z1 - PEG_Z0) / 2))
    coast._link(board, coll, coast._plain("bench-pegboard", "structure", tokens, roughness=0.85, fade=False))
    # Hanging tools: pliers, files and tweezers as thin rods and blades, all one neutral tone.
    tools = []
    x = PEG_X0 + 0.35
    k = 0
    while x < PEG_X1 - 0.3:
        length = (0.55, 0.8, 0.45, 0.7, 0.6)[k % 5]
        top = level + PEG_Z1 - 0.2
        tools.append(coast._cylinder("hook", x, WALL_Y - 0.08, top - 0.02, top + 0.04, 0.012, seg=12))
        if k % 2:
            tools.append(_box("file", (x, WALL_Y - 0.07, top - length / 2), (0.025, 0.008, length / 2)))
        else:
            for dx in (-0.03, 0.03):
                tools.append(_box("plier", (x + dx, WALL_Y - 0.07, top - length / 2), (0.012, 0.008, length / 2)))
        x += 0.42
        k += 1
    coast._link(coast._merge("bench-tools", tools), coll, coast._plain("bench-tools", "horizon", tokens, roughness=0.4, fade=False))


def _shelf(level, coll, tokens):
    board = _box("shelf", (0.0, WALL_Y - 0.2, level + SHELF_Z), ((SHELF_X1 - SHELF_X0) / 2, 0.2, 0.025))
    coast._link(board, coll, coast._plain("bench-shelf", "sand", tokens, roughness=0.7, fade=False))
    jars = []
    x = SHELF_X0 + 0.3
    k = 0
    while x < SHELF_X1 - 0.2:
        h = (0.32, 0.22, 0.4, 0.26)[k % 4]
        r = (0.11, 0.09, 0.12, 0.08)[k % 4]
        jars.append(coast._cylinder("jar", x, WALL_Y - 0.2, level + SHELF_Z + 0.025, level + SHELF_Z + 0.025 + h, r, seg=32))
        x += 2 * r + 0.18
        k += 1
    coast._link(coast._merge("bench-jars", jars), coll, coast._plain("bench-jars", "structure", tokens, roughness=0.3, fade=False))


def _lamp(level, coll, tokens, aim):
    """A desk lamp at the far left: round foot, upright, arm leaning in, cone shade, warm bulb."""
    parts = [coast._cylinder("lamp-foot", LAMP_X, LAMP_Y, level, level + 0.05, 0.22, seg=48)]
    parts.append(coast._cylinder("lamp-post", LAMP_X, LAMP_Y, level + 0.05, level + 1.3, 0.025, seg=16))
    head = Vector((LAMP_X + 0.75, LAMP_Y - 0.35, level + 1.55))
    # Arm: a thin box from the top of the post to the shade.
    a = Vector((LAMP_X, LAMP_Y, level + 1.3))
    mid = (a + head) / 2
    arm = _box("lamp-arm", (0.0, 0.0, 0.0), (0.02, 0.02, (head - a).length / 2))
    arm.location = mid
    arm.rotation_euler = (head - a).to_track_quat("Z", "Y").to_euler()
    parts.append(arm)
    for p in parts:
        coll.objects.link(p)
    bpy.context.view_layer.update()
    metal = coast._plain("bench-lamp", "structure", tokens, roughness=0.35, fade=False)
    for p in parts:
        p.data.materials.append(metal)

    # Shade: an open cone pointing at the model, as a thin closed shell.
    direction = (aim - head).normalized()
    seg = 48
    verts, faces = [], []
    for k in range(seg):
        ang = 2 * math.pi * k / seg
        for r, z in ((0.07, 0.0), (0.2, -0.22), (0.19, -0.22), (0.06, 0.0)):
            verts.append((r * math.cos(ang), r * math.sin(ang), z))
    for k in range(seg):
        j = (k + 1) % seg
        for i in range(4):
            i2 = (i + 1) % 4
            faces.append((4 * k + i, 4 * j + i, 4 * j + i2, 4 * k + i2))
    mesh = bpy.data.meshes.new("lamp-shade")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    shade = bpy.data.objects.new("lamp-shade", mesh)
    shade.location = head
    shade.rotation_euler = (-direction).to_track_quat("Z", "Y").to_euler()
    coast._link(shade, coll, metal)

    # Bulb: a small glowing disc inside the shade.
    bulb = coast._cylinder("lamp-bulb", 0.0, 0.0, -0.12, -0.1, 0.09, seg=32)
    bulb.location = head
    bulb.rotation_euler = shade.rotation_euler
    glow = coast._plain("bench-bulb", "light", tokens, fade=False)
    bsdf = sea_world._principled(glow)
    bsdf.inputs["Emission Color"].default_value = color(tokens["colors"]["env"]["light"])
    bsdf.inputs["Emission Strength"].default_value = 3.0
    coast._link(bulb, coll, glow)

    # The lamp's light: a soft warm spot on the model.
    data = bpy.data.lights.new("lamp", "SPOT")
    data.energy = 260.0
    data.color = color_srgb(tokens["colors"]["env"]["light"])
    data.spot_size = math.radians(70)
    data.spot_blend = 0.6
    data.shadow_soft_size = 0.25
    data.specular_factor = 0.3  # keeps the amber key the brightest thing in frame
    light = bpy.data.objects.new("lamp", data)
    light.location = head + direction * 0.12
    light.rotation_euler = (-direction).to_track_quat("Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(light)


def build_bench(scene, tokens, parts):
    """Builds the world around the model. Returns the world state (`c.sea` in build.py)."""
    level = coast._lowest(parts) - HOVER
    scene.render.film_transparent = False
    _room(scene, tokens)
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = True

    coll = bpy.data.collections.new("world-bench")
    scene.collection.children.link(coll)
    center, _half = coast._footprint(parts)
    _bench(level, coll, tokens)
    _walls(level, coll, tokens)
    _pegboard(level, coll, tokens)
    _shelf(level, coll, tokens)
    _lamp(level, coll, tokens, Vector((center.x, center.y, level + 0.2)))
    return {
        "level": level,
        # Away parts drop and shrink out of view as usual.
        "flatAway": False,
        "module": sys.modules[__name__],
    }


# Called by build.py's Clip on explode / collapse (the sea world moves its waves there).
def settle(world, start, end):
    pass


def show_edge(world, exploded, frame):
    pass


def build_clip_world(scene, tokens, parts, camera_object, clip, fps):
    """The whole world for one clip: bench, lens and framing."""
    start = clip["start"]
    backdrop = clip["id"] == "backdrop"
    world = build_bench(scene, tokens, parts)

    camera = camera_object.data
    camera.animation_data_clear()
    camera.clip_end = 100.0
    with interpolation("LINEAR"):
        camera.lens = LENS
        camera.keyframe_insert("lens", frame=0)
        camera.lens = LENS * (PUSH if clip["frames"] > 1 else 1)
        camera.keyframe_insert("lens", frame=max(clip["frames"], 1))
    camera.shift_y = (start.get("frameY", FRAME_Y) - 0.5) * clip["height"] / clip["width"]

    if backdrop:
        for info in parts.values():
            for obj in info["objects"]:
                obj.hide_render = True
    return world
