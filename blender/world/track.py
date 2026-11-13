"""The `track` world: a test track in afternoon light. A long straight of tarmac runs along +x (the
model's forward axis) with painted edge lines, a low concrete barrier along the far side and a row
of light towers behind it, a launch ramp up ahead, a few low sheds off to the side, then
grassland and hills fading into haze, under the sea world's daylight sky and afternoon sun.

The model sits on the tarmac: its lowest point is the ground. Nothing here moves with it, so
a car that hops (a `shift` beat on its whole group) leaves the ground and comes back down
onto the same spot.

Like the coast world it is shaded but carries no Freestyle lines, so `qc.py` still checks
only the model. Colors: the daylight `env.*` tokens plus the graded grass texture and blades
(`coast._grass_texture`, `coast._grass_blades`). Deterministic (no random)."""

import sys

import bpy

from build import interpolation

from common import color
from world import coast
from world import sea as sea_world

LENS = 30
PUSH = 1.1
FRAME_Y = 0.42
HOVER = 0.004  # gap between the model's lowest point and the tarmac

X0, X1, Y0, Y1 = -110.0, 150.0, -120.0, 120.0
NX, NY = 220, 220

TRACK_HALF = 2.6  # half width of the tarmac
SHOULDER = 0.9  # gravel strip each side of it
LINE_Y, LINE_W = 2.35, 0.08  # painted edge lines
# Both on the far (+y) side: the cameras sit on the -y side, so nothing stands between
# them and the car.
BARRIER_Y, BARRIER_H, BARRIER_W = 3.9, 0.32, 0.22  # low concrete wall
TOWER_Y, TOWER_STEP, TOWER_H = 5.6, 9.0, 3.4  # light towers behind it
SPAN = 70.0  # half length of the barrier and the tower row along x
RAMP_X, RAMP_LEN, RAMP_H, RAMP_HALF = 6.0, 3.2, 0.55, 1.3
HILL0, HILL1, HILL_H = 30.0, 80.0, 6.0


def _smooth(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def height(x, y):
    """Ground height above the tarmac: flat around the track, rising into far hills."""
    d = abs(y) - TRACK_HALF - SHOULDER
    if d <= 0:
        return 0.0
    h = 0.05 * _smooth(0.0, 6.0, d) * (0.6 + 0.4 * coast._wobble(0.2 * x, 0.3 * d))
    h += HILL_H * _smooth(HILL0, HILL1, d) * (0.6 + 0.4 * coast._wobble(0.12 * x, 0.05 * d))
    return h


def _grass(a):
    """How much grass grows at distance a from the track's center line (none on the shoulder)."""
    return _smooth(TRACK_HALF + SHOULDER - 0.2, TRACK_HALF + SHOULDER + 0.6, a)


def _paint(obj, level, tokens):
    env = tokens["colors"]["env"]
    road, sand, land = color(env["road"]), color(env["sand"]), color(env["land"])
    layer = obj.data.color_attributes.new("ground", "FLOAT_COLOR", "POINT")
    grass = obj.data.attributes.new("grass", "FLOAT", "POINT")
    for i, v in enumerate(obj.data.vertices):
        x, y, _ = v.co
        a = abs(y)
        grass.data[i].value = _grass(a)
        c = coast._mix(road, sand, _smooth(TRACK_HALF - 0.05, TRACK_HALF + 0.1, a))
        c = coast._mix(c, land, _smooth(TRACK_HALF + SHOULDER - 0.2, TRACK_HALF + SHOULDER + 0.6, a))
        c = coast._mix(c, land, 0.25 * _smooth(HILL0, HILL1, a))  # darker far hills
        layer.data[i].color = c


def _box(name, center, half):
    cx, cy, cz = center
    hx, hy, hz = half
    verts = [(cx + sx * hx, cy + sy * hy, cz + sz * hz) for sz in (-1, 1) for sy in (-1, 1) for sx in (-1, 1)]
    faces = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (1, 3, 7, 5), (3, 2, 6, 7), (2, 0, 4, 6)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return bpy.data.objects.new(name, mesh)


def _lines(level, coll, tokens):
    """Painted edge lines: long thin strips just above the tarmac, dashed at the center."""
    strips = []
    for side in (1, -1):
        strips.append(_box("line", (0.0, side * LINE_Y, level + 0.003), (SPAN, LINE_W / 2, 0.002)))
    n = int(2 * SPAN / 3.0)
    for k in range(n):
        x = -SPAN + 3.0 * k + 0.75
        strips.append(_box("dash", (x, 0.0, level + 0.003), (0.75, LINE_W / 2, 0.002)))
    mat = coast._plain("track-lines", "horizon", tokens, roughness=0.7)
    coast._link(coast._merge("track-lines", strips), coll, mat)


def _barrier(level, coll, tokens):
    wall = _box("barrier", (0.0, BARRIER_Y, level + BARRIER_H / 2), (SPAN, BARRIER_W / 2, BARRIER_H / 2))
    coast._link(wall, coll, coast._plain("track-barrier", "structure", tokens))


def _towers(level, coll, tokens):
    poles, heads = [], []
    n = int(2 * SPAN / TOWER_STEP)
    for k in range(n + 1):
        x = -SPAN + k * TOWER_STEP
        poles.append(coast._cylinder("tower", x, TOWER_Y, level - 0.05, level + TOWER_H, 0.05, seg=12))
        heads.append(_box("lamp", (x, TOWER_Y - 0.12, level + TOWER_H + 0.08), (0.32, 0.08, 0.1)))
    coast._link(coast._merge("track-towers", poles), coll, coast._plain("track-towers", "structure", tokens))
    glow = coast._plain("track-lamps", "light", tokens)
    bsdf = sea_world._principled(glow)
    bsdf.inputs["Emission Color"].default_value = color(tokens["colors"]["env"]["light"])
    bsdf.inputs["Emission Strength"].default_value = 0.0  # daylight: the lamps are off
    coast._link(coast._merge("track-lamps", heads), coll, glow)


def _ramp(level, coll, tokens):
    """A launch ramp up the track: a wedge that curves up into a short kicker."""
    steps = 24
    verts, faces = [], []
    for k in range(steps + 1):
        t = k / steps
        x = RAMP_X + RAMP_LEN * t
        z = level + RAMP_H * t * t
        for y in (-RAMP_HALF, RAMP_HALF):
            verts += [(x, y, level), (x, y, z + 0.002)]
    for k in range(steps):
        a, b = 4 * k, 4 * (k + 1)
        faces.append((a + 1, b + 1, b + 3, a + 3))  # top
        faces.append((a, a + 1, b + 1, b))  # -y side
        faces.append((a + 2, b + 2, b + 3, a + 3))  # +y side
    e = 4 * steps
    faces.append((e, e + 2, e + 3, e + 1))  # back face of the kicker
    mesh = bpy.data.meshes.new("track-ramp")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("track-ramp", mesh)
    coast._link(obj, coll, coast._plain("track-ramp", "structure", tokens, roughness=0.7))


def _sheds(level, coll, tokens):
    sheds = [
        _box("shed", (18.0, 16.0, level + 1.2), (6.0, 2.5, 1.2)),
        _box("shed", (34.0, 19.0, level + 0.9), (4.0, 2.0, 0.9)),
        _box("shed", (-14.0, -18.0, level + 1.4), (5.0, 3.0, 1.4)),
    ]
    coast._link(coast._merge("track-sheds", sheds), coll, coast._plain("track-sheds", "structure", tokens))


def build_track(scene, tokens, parts):
    """Builds the world around the model. Returns the world state (`c.sea` in build.py)."""
    level = coast._lowest(parts) - HOVER

    scene.render.film_transparent = False
    sea_world._sky(scene, tokens)
    sea_world._sun(tokens)
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = True

    coll = bpy.data.collections.new("world-track")
    scene.collection.children.link(coll)
    xs = coast._axis(X0, X1, NX, dense=0.0)
    ys = sorted(set(coast._axis(Y0, Y1, NY, dense=0.0) + [s * d for s in (1, -1) for d in (TRACK_HALF - 0.05, TRACK_HALF + 0.1, TRACK_HALF + SHOULDER - 0.2, TRACK_HALF + SHOULDER + 0.6)]))
    ground = coast._grid("track-ground", xs, ys, lambda x, y: level + height(x, y))
    _paint(ground, level, tokens)
    coast._link(ground, coll, coast._terrain_material(tokens))
    coast._grass_blades((0.0, 0.0), lambda x, y: level + height(x, y), lambda x, y: _grass(abs(y)), coll, tokens, "track-grass")
    _lines(level, coll, tokens)
    _barrier(level, coll, tokens)
    _towers(level, coll, tokens)
    _ramp(level, coll, tokens)
    _sheds(level, coll, tokens)
    return {
        "level": level,
        # Away parts (the car's shell in a cutaway) drop and shrink out of view as usual.
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
    """The whole world for one clip: track, lens and framing."""
    start = clip["start"]
    backdrop = clip["id"] == "backdrop"
    world = build_track(scene, tokens, parts)
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

