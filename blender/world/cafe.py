"""The `cafe` world: a cafe table at night. The model stands on a round wooden table top;
a coffee cup on its saucer sits to the left, and behind the table a dim wall with a long
dark window (mullions, a sill) and a bench seat runs across the room. A pendant lamp hangs
above the table and throws a warm pool of light onto the model. The rest of the room falls
away into the dark.

The model sits on the table: its lowest point is the table top. Nothing moves with it.

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
from world.bench import _box

LENS = 50  # indoors: the automatic close-up maths assumes 50 mm, so close-ups size themselves
PUSH = 1.1
FRAME_Y = 0.42
HOVER = 0.004  # gap between the model's lowest point and the table top

TABLE_R, TABLE_T, TABLE_Y = 3.4, 0.1, 0.6  # radius, thickness, center y (the model sits in front of the middle)
WALL_Y, WALL_H, SIDE_X = 4.2, 6.0, 9.0
WINDOW_X0, WINDOW_X1, WINDOW_Z0, WINDOW_Z1 = -5.5, 5.5, 1.6, 4.4
SEAT_Y, SEAT_Z = 3.4, 0.2
CUP_X, CUP_Y = -1.75, 0.15
LAMP_Z = 4.2


def _room(scene, tokens):
    world = bpy.data.worlds.new("cafe-room")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = color(tokens["colors"]["env"]["skyTop"])
    bg.inputs["Strength"].default_value = 0.35
    scene.world = world


def _disc(name, cx, cy, z0, z1, r, seg=96):
    return coast._cylinder(name, cx, cy, z0, z1, r, seg=seg)


def _table(level, coll, tokens):
    top = _disc("table-top", 0.0, TABLE_Y, level - TABLE_T, level, TABLE_R)
    coast._link(top, coll, coast._plain("cafe-wood", "sand", tokens, roughness=0.6, fade=False))
    # A thin darker rim band just under the top edge.
    rim = _disc("table-rim", 0.0, TABLE_Y, level - TABLE_T - 0.06, level - TABLE_T, TABLE_R - 0.05)
    post = _disc("table-post", 0.0, TABLE_Y, level - 3.0, level - TABLE_T - 0.06, 0.18, seg=32)
    coast._link(coast._merge("cafe-table-under", [rim, post]), coll, coast._plain("cafe-table-under", "road", tokens, fade=False))


def _cup(level, coll, tokens):
    """Saucer, cup and handle: plain round shapes in one neutral tone."""
    parts = [
        _disc("saucer", CUP_X, CUP_Y, level, level + 0.03, 0.42, seg=64),
        _disc("cup", CUP_X, CUP_Y, level + 0.03, level + 0.42, 0.24, seg=64),
    ]
    # Handle: a short ring of boxes on the cup's right side.
    for k in range(17):
        a = math.radians(-80 + 160 * k / 16)
        x = CUP_X + 0.24 + 0.11 * math.cos(a)
        z = level + 0.23 + 0.11 * math.sin(a)
        parts.append(_box("handle", (x, CUP_Y, z), (0.018, 0.022, 0.018)))
    coast._link(coast._merge("cafe-cup", parts), coll, coast._plain("cafe-cup", "horizon", tokens, roughness=0.35, fade=False))
    # The coffee: a dark disc just under the rim.
    coffee = _disc("coffee", CUP_X, CUP_Y, level + 0.36, level + 0.4, 0.21, seg=64)
    coast._link(coffee, coll, coast._plain("cafe-coffee", "road", tokens, roughness=0.2, fade=False))


def _walls(level, coll, tokens):
    walls = [
        # Back wall in three pieces round the window opening.
        _box("wall-low", (0.0, WALL_Y + 0.05, level + (WINDOW_Z0 - 1.5) / 2), (SIDE_X, 0.05, (WINDOW_Z0 + 1.5) / 2)),
        _box("wall-high", (0.0, WALL_Y + 0.05, level + (WINDOW_Z1 + WALL_H) / 2), (SIDE_X, 0.05, (WALL_H - WINDOW_Z1) / 2)),
        _box("wall-left", (-(SIDE_X + WINDOW_X1) / 2, WALL_Y + 0.05, level + (WINDOW_Z0 + WINDOW_Z1) / 2), ((SIDE_X - WINDOW_X1) / 2, 0.05, (WINDOW_Z1 - WINDOW_Z0) / 2)),
        _box("wall-right", ((SIDE_X + WINDOW_X1) / 2, WALL_Y + 0.05, level + (WINDOW_Z0 + WINDOW_Z1) / 2), ((SIDE_X - WINDOW_X1) / 2, 0.05, (WINDOW_Z1 - WINDOW_Z0) / 2)),
    ]
    coast._link(coast._merge("cafe-walls", walls), coll, coast._plain("cafe-walls", "surface", tokens, roughness=0.9, fade=False))

    # The night outside the window: a dark pane far behind, then mullions and a sill.
    night = _box("night", (0.0, WALL_Y + 1.5, level + (WINDOW_Z0 + WINDOW_Z1) / 2), (SIDE_X, 0.05, (WINDOW_Z1 - WINDOW_Z0) / 2 + 0.5))
    coast._link(night, coll, coast._plain("cafe-night", "seaDeep", tokens, roughness=1.0, fade=False))
    frame = []
    span = WINDOW_X1 - WINDOW_X0
    for k in range(5):
        x = WINDOW_X0 + span * k / 4
        frame.append(_box("mullion", (x, WALL_Y, level + (WINDOW_Z0 + WINDOW_Z1) / 2), (0.05, 0.06, (WINDOW_Z1 - WINDOW_Z0) / 2)))
    frame.append(_box("transom", (0.0, WALL_Y, level + WINDOW_Z1 - 0.9), (span / 2, 0.05, 0.035)))
    frame.append(_box("sill", (0.0, WALL_Y - 0.12, level + WINDOW_Z0 - 0.03), (span / 2 + 0.15, 0.16, 0.04)))
    coast._link(coast._merge("cafe-window", frame), coll, coast._plain("cafe-window", "structure", tokens, roughness=0.6, fade=False))

    # Floor far below the table and a bench seat along the wall.
    floor = _box("floor", (0.0, 0.0, level - 3.0), (SIDE_X, WALL_Y + 4.0, 0.02))
    coast._link(floor, coll, coast._plain("cafe-floor", "road", tokens, roughness=0.8, fade=False))
    seat = [
        _box("seat", (0.0, SEAT_Y, level + SEAT_Z - 0.6), (SIDE_X - 0.5, 0.45, 0.08)),
        _box("seat-back", (0.0, WALL_Y - 0.1, level + SEAT_Z), (SIDE_X - 0.5, 0.08, 0.6)),
    ]
    coast._link(coast._merge("cafe-seat", seat), coll, coast._plain("cafe-seat", "structure", tokens, roughness=0.85, fade=False))


def _lamp(level, coll, tokens, aim):
    """A pendant lamp above the table: a thin cord, a cone shade and a warm bulb."""
    head = Vector((aim.x + 0.6, aim.y - 0.4, level + LAMP_Z))
    metal = coast._plain("cafe-lamp", "structure", tokens, roughness=0.35, fade=False)
    cord = coast._cylinder("lamp-cord", head.x, head.y, head.z + 0.05, head.z + 6.0, 0.012, seg=12)
    coast._link(cord, coll, metal)

    direction = (aim - head).normalized()
    seg = 48
    verts, faces = [], []
    for k in range(seg):
        ang = 2 * math.pi * k / seg
        for r, z in ((0.08, 0.0), (0.42, -0.36), (0.41, -0.36), (0.07, 0.0)):
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

    bulb = coast._cylinder("lamp-bulb", 0.0, 0.0, -0.2, -0.17, 0.16, seg=32)
    bulb.location = head
    bulb.rotation_euler = shade.rotation_euler
    glow = coast._plain("cafe-bulb", "light", tokens, fade=False)
    bsdf = sea_world._principled(glow)
    bsdf.inputs["Emission Color"].default_value = color(tokens["colors"]["env"]["light"])
    bsdf.inputs["Emission Strength"].default_value = 3.0
    coast._link(bulb, coll, glow)

    data = bpy.data.lights.new("lamp", "SPOT")
    data.energy = 700.0
    data.color = color_srgb(tokens["colors"]["env"]["light"])
    data.spot_size = math.radians(60)
    data.spot_blend = 0.6
    data.shadow_soft_size = 0.3
    data.specular_factor = 0.3  # keeps the amber key the brightest thing in frame
    light = bpy.data.objects.new("lamp", data)
    light.location = head + direction * 0.2
    light.rotation_euler = (-direction).to_track_quat("Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(light)


def build_cafe(scene, tokens, parts):
    """Builds the world around the model. Returns the world state (`c.sea` in build.py)."""
    level = coast._lowest(parts) - HOVER
    scene.render.film_transparent = False
    _room(scene, tokens)
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = True

    coll = bpy.data.collections.new("world-cafe")
    scene.collection.children.link(coll)
    center, _half = coast._footprint(parts)
    _table(level, coll, tokens)
    _cup(level, coll, tokens)
    _walls(level, coll, tokens)
    _lamp(level, coll, tokens, Vector((center.x, center.y, level + 1.0)))
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
    """The whole world for one clip: table, room, lens and framing."""
    start = clip["start"]
    backdrop = clip["id"] == "backdrop"
    world = build_cafe(scene, tokens, parts)

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
