"""The `rail` world: a raised guideway in afternoon light. The model's own stretch of track (its
`guideway`, `wall` and coil parts) repeats end to end along +x (the model's forward axis) in
both directions, on concrete piers above low grassland, with hills fading into haze, under
the sea world's daylight sky and afternoon sun.

The repeats copy the model's track meshes, so the guideway's profile always matches the
model's. They are shaded in the same fill color as the model but carry no Freestyle lines:
the lines stay on the model's own stretch (the one the story happens on), and `qc.py` still
checks only the model. When the cutaway drops the near wall, only the model's stretch opens;
the repeats keep their walls, like a drawn cutaway.

Built for the maglev (idea 31). A model without a `guideway` part gets the piers, ground and
hills only. Colors: `diagram.fill` for the track repeats, the daylight `env.*` tokens and the coast grass for the rest.
Deterministic (no random)."""

import sys

import bpy
from mathutils import Matrix, Vector

from build import interpolation

from common import color
from world import coast
from world import sea as sea_world

LENS = 50  # the automatic close-up maths assumes 50 mm, so close-ups size themselves
PUSH = 1.1
FRAME_Y = 0.42

TRACK_PARTS = ("guideway", "wall", "coil", "coils")  # parts copied along the track
REPEATS = 30  # copies each way: the guideway runs into the haze
# Coils are dense (about 27k vertices a stretch) and Freestyle maps every vertex in the scene
# even where it draws no line, so only the nearest stretches carry them; beyond, the haze hides them.
COIL_PARTS = ("coil", "coils")
COIL_REPEATS = 3
# Gap between stretches (model units, about 1 cm). End faces touching exactly make
# Freestyle's visibility of the model's end edges flicker frame to frame.
JOINT = 0.002
PIER_H = 1.3  # ground below the guideway floor, in model units (the model is 2 long): about 7 m
PIER_W, PIER_D = 0.2, 0.16  # pier half width (across the track) and half depth (along it)

X0, X1, Y0, Y1 = -70.0, 90.0, -90.0, 90.0
NX, NY = 200, 200
HILL0, HILL1, HILL_H = 14.0, 60.0, 6.0


def _smooth(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def height(x, y):
    """Ground height above its base: gentle swells near the track, hills further out."""
    d = abs(y)
    h = 0.08 * (0.5 + 0.5 * coast._wobble(0.15 * x, 0.2 * d))
    h += HILL_H * _smooth(HILL0, HILL1, d) * (0.6 + 0.4 * coast._wobble(0.08 * x, 0.04 * d))
    return h


def _paint(obj, base, tokens):
    env = tokens["colors"]["env"]
    land, sand = color(env["land"]), color(env["sand"])
    layer = obj.data.color_attributes.new("ground", "FLOAT_COLOR", "POINT")
    grass = obj.data.attributes.new("grass", "FLOAT", "POINT")
    for i, v in enumerate(obj.data.vertices):
        x, y, _ = v.co
        grass.data[i].value = 1.0
        c = coast._mix(land, sand, 0.18 * (0.5 + 0.5 * coast._wobble(0.3 * x, 0.25 * y)))  # dry patches
        c = coast._mix(c, land, 0.3 * _smooth(HILL0, HILL1, abs(y)))  # darker far hills
        layer.data[i].color = c


def _track_material(tokens):
    """The model's fill color, fading into the haze like the rest of the world."""
    mat = bpy.data.materials.new("rail-track")
    mat.use_nodes = True
    bsdf = sea_world._principled(mat)
    bsdf.inputs["Base Color"].default_value = color(tokens["colors"]["fill"])
    bsdf.inputs["Roughness"].default_value = 0.6
    coast._fade(mat, tokens)
    return mat


def _track_span(parts):
    """(x min, x max, floor bottom z, y half width) of the model's guideway, or None."""
    info = parts.get("guideway")
    if not info:
        return None
    corners = [o.matrix_world @ Vector(c) for o in info["objects"] for c in o.bound_box]
    xs, ys, zs = [c.x for c in corners], [c.y for c in corners], [c.z for c in corners]
    return min(xs), max(xs), min(zs), max(abs(min(ys)), abs(max(ys)))


def _repeat_track(parts, span, coll, mat, include_home):
    """Linked copies of the model's track meshes, end to end along x."""
    x0, x1, _, _ = span
    step = x1 - x0 + JOINT
    ks = [k for k in range(-REPEATS, REPEATS + 1) if k or include_home]
    for name in TRACK_PARTS:
        if name not in parts:
            continue
        for obj in parts[name]["objects"]:
            dense = name in COIL_PARTS or obj.name.startswith("nearcoils")
            _copies(obj, [k for k in ks if not dense or abs(k) <= COIL_REPEATS], step, coll, mat)


def _copies(obj, ks, step, coll, mat):
    rest = obj.matrix_world.copy()
    for k in ks:
        copy = bpy.data.objects.new(f"rail-{obj.name}-{k}", _track_mesh(obj, mat))
        copy.matrix_world = Matrix.Translation((k * step, 0.0, 0.0)) @ rest
        coll.objects.link(copy)


_MESHES = {}


def _track_mesh(obj, mat):
    """One mesh per source object, shared by all its copies, carrying the track material
    (the model's own mesh keeps its look-A material)."""
    if obj.name not in _MESHES:
        mesh = obj.data.copy()
        mesh.materials.clear()
        mesh.materials.append(mat)
        _MESHES[obj.name] = mesh
    return _MESHES[obj.name]


def _piers(span, ground, coll, tokens):
    x0, x1, floor, _ = span
    step = x1 - x0 + JOINT
    piers = []
    for k in range(-REPEATS, REPEATS + 1):
        x = x0 + k * step  # one under every joint
        piers.append(_box("pier", (x, 0.0, (floor + ground) / 2), (PIER_D, PIER_W, (floor - ground) / 2 - 0.002)))
    coast._link(coast._merge("rail-piers", piers), coll, coast._plain("rail-piers", "structure", tokens))


def _box(name, center, half):
    cx, cy, cz = center
    hx, hy, hz = half
    verts = [(cx + sx * hx, cy + sy * hy, cz + sz * hz) for sz in (-1, 1) for sy in (-1, 1) for sx in (-1, 1)]
    faces = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (1, 3, 7, 5), (3, 2, 6, 7), (2, 0, 4, 6)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return bpy.data.objects.new(name, mesh)


def build_rail(scene, tokens, parts, backdrop):
    """Builds the world around the model. Returns the world state (`c.sea` in build.py)."""
    _MESHES.clear()
    span = _track_span(parts)
    floor = span[2] if span else coast._lowest(parts)
    ground = floor - PIER_H

    scene.render.film_transparent = False
    sea_world._sky(scene, tokens)
    sea_world._sun(tokens)
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = True

    coll = bpy.data.collections.new("world-rail")
    scene.collection.children.link(coll)
    xs = coast._axis(X0, X1, NX, dense=0.0)
    ys = coast._axis(Y0, Y1, NY, dense=0.0)
    land = coast._grid("rail-ground", xs, ys, lambda x, y: ground + height(x, y))
    _paint(land, ground, tokens)
    coast._link(land, coll, coast._terrain_material(tokens))
    if not backdrop:
        coast._grass_blades((0.0, 0.0), lambda x, y: ground + height(x, y), lambda x, y: 1.0, coll, tokens, "rail-grass")
    if span:
        # The backdrop hides the model, so the track runs through its stretch too.
        _repeat_track(parts, span, coll, _track_material(tokens), include_home=backdrop)
        _piers(span, ground, coll, tokens)
    return {
        "level": floor,
        # Away parts (the shell and near wall in the cutaway) drop and shrink out of view.
        "flatAway": False,
        "module": sys.modules[__name__],
    }


def _animate(frames):
    sky = bpy.context.scene.world.node_tree
    stretch = next((n for n in sky.nodes if n.type == "MAPPING"), None)
    if stretch:  # the clouds drift slowly
        with interpolation("LINEAR"):
            for f in (0, frames):
                stretch.inputs["Location"].default_value = (0.0006 * f, 0.0, 0.0)
                stretch.inputs["Location"].keyframe_insert("default_value", frame=f)


# Called by build.py's Clip on explode / collapse (the sea world moves its waves there).
def settle(world, start, end):
    pass


def show_edge(world, exploded, frame):
    pass


def build_clip_world(scene, tokens, parts, camera_object, clip, fps):
    """The whole world for one clip: raised guideway, ground, lens and framing."""
    start = clip["start"]
    backdrop = clip["id"] == "backdrop"
    world = build_rail(scene, tokens, parts, backdrop)
    if clip["frames"] > 1:
        _animate(clip["frames"])

    camera = camera_object.data
    camera.animation_data_clear()
    camera.clip_end = 400.0
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
