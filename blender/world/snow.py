"""The `snow` world: a supermarket car park after a snowfall, on a winter night.

The model stands in a parking bay. Ahead of its nose (+x) runs the ploughed drive aisle,
grey slush with dark tyre tracks, and two tracks lead from it into the bay; faint bay lines
show through the snow either side of the car. Behind it (+y, the side away from the
cameras) a ploughed snowbank runs along the edge of the car park with three lamp posts
standing in it, then a low shop with a snow-covered roof and a dimly lit glass front,
snowy fields, a belt of snow-capped firs and hills fading into the night haze. Light snow
falls throughout.

A night world (the one outdoor exception to daylight, because the topic happens on a
freezing night): the sea world's sky regraded dark (`skyTop` to `horizonNight`), a faint
cool moon, and the lamps on, cool white LED light (`lamp`), never warm, which would sit too
close to amber. The middle lamp stands just behind the car, so the model sits in its pool of
light and casts a shadow on the snow. Snow is a mid grey-blue (`snow`), darker than the
white line art, so the model's outlines keep reading against it; slush and tracks are
`slush`.

Like the coast and track worlds it is shaded but carries no Freestyle lines, so `qc.py`
still checks only the model. Deterministic (no random)."""

import copy
import math
import sys

import bmesh
import bpy

from build import interpolation

from common import color, color_srgb
from world import coast
from world import sea as sea_world

LENS = 30
PUSH = 1.1
FRAME_Y = 0.42
HOVER = 0.004  # gap between the model's lowest point and the ground

X0, X1, Y0, Y1 = -110.0, 150.0, -120.0, 120.0
NX, NY = 240, 240

# Car park (model units: the car is 2 long, so 1 unit is about 2.1 m)
LOT_X, LOT_Y = 26.0, 9.0  # half sizes of the flat car park
AISLE_X0, AISLE_X1 = 1.35, 3.6  # the drive aisle ahead of the car's nose
BAY_Y = 0.6  # bay lines either side of the car
TRACK_Y, TRACK_W = 0.37, 0.12  # tyre tracks into the bay (the car's own wheel track)
BANK_Y, BANK_W, BANK_H = 3.4, 0.9, 0.34  # ploughed snowbank behind the car
LAMP_XS, LAMP_H = (-9.0, 0.3, 10.0), 3.8  # the middle one over the car
SHOP = (-24.0, 12.0, 16.0, 22.0, 2.3)  # x0, x1, y0, y1, height
TREES_Y0, TREES_Y1 = 30.0, 52.0
HILL0, HILL1, HILL_H = 34.0, 90.0, 7.0

MOON_ENERGY = 0.35
SKY_STRENGTH = 0.6

FLAKES = 2600
FLAKE_R = 0.007
FLAKE_BOX = (-7.0, 9.0, -1.2, 9.0)  # x0, x1, y0, y1: behind and beside the car, not at the cameras
FLAKE_TOP = 16.0
FALL = 0.32  # units per second


def _smooth(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def _hash(i, salt=0.0):
    """Deterministic 0-1 value for an integer (no random module)."""
    v = math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
    return v - math.floor(v)


def night_tokens(tokens):
    """The tokens with the daylight sky swapped for the night one, so the sea world's sky
    and the coast world's haze (which read skyDay / horizonDay) come out dark."""
    t = copy.deepcopy(tokens)
    env = t["colors"]["env"]
    env["skyDay"] = env["skyTop"]
    env["horizonDay"] = env["horizonNight"]
    env["sunDay"] = env["lamp"]
    return t


def _bank(x, y):
    """Height of the ploughed snowbank at (x, y): a lumpy ridge along the car park's back."""
    d = (y - BANK_Y) / BANK_W
    if abs(d) >= 1.0 or abs(x) > LOT_X:
        return 0.0
    lump = 0.75 + 0.25 * coast._wobble(0.9 * x, 0.6 * d) + 0.15 * math.sin(1.7 * x)
    end = 1 - _smooth(LOT_X - 3.0, LOT_X, abs(x))
    return BANK_H * (math.cos(d * math.pi / 2) ** 2) * lump * end


def height(x, y):
    """Ground height above the car park: flat inside it, the snowbank, then fields rising
    into far hills."""
    h = _bank(x, y)
    d = max(abs(x) - LOT_X, abs(y) - LOT_Y, 0.0)
    h += 0.12 * _smooth(0.0, 5.0, d) * (0.6 + 0.4 * coast._wobble(0.15 * x, 0.2 * y))
    far = max(abs(y) - 20.0, 0.0) if y > 0 else max(abs(y) - 25.0, 0.0)
    h += HILL_H * _smooth(HILL0 - 20.0, HILL1, far) * (0.6 + 0.4 * coast._wobble(0.08 * x, 0.04 * y))
    return h


def _slush(x, y):
    """How much of the ground is ploughed slush (0 clean snow, 1 slush)."""
    aisle = _smooth(AISLE_X0 - 0.15, AISLE_X0 + 0.15, x) * (1 - _smooth(AISLE_X1 - 0.15, AISLE_X1 + 0.15, x))
    aisle *= 1 - _smooth(LOT_Y - 2.0, LOT_Y, abs(y))
    tracks = 0.0
    if -0.9 < x < AISLE_X0 + 0.2:
        for s in (1, -1):
            tracks = max(tracks, 1 - _smooth(TRACK_W * 0.3, TRACK_W * 0.6, abs(y - s * TRACK_Y)))
        tracks *= _smooth(-0.9, -0.4, x)
    # Tyre tracks curving along the aisle, the way cars drove through it.
    lanes = 0.0
    for c in (2.1, 2.9):
        for s in (1, -1):
            lanes = max(lanes, 1 - _smooth(TRACK_W * 0.3, TRACK_W * 0.6, abs(x - c - s * 0.37 - 0.05 * math.sin(0.4 * y))))
    return min(1.0, 0.55 * aisle + 0.9 * max(tracks, lanes * aisle))


def _paint(obj, level, tokens):
    env = tokens["colors"]["env"]
    snow, slush, land = color(env["snow"]), color(env["slush"]), color(env["land"])
    line = color(env["flake"])
    layer = obj.data.color_attributes.new("ground", "FLOAT_COLOR", "POINT")
    for i, v in enumerate(obj.data.vertices):
        x, y, z = v.co
        c = coast._mix(snow, slush, _slush(x, y))
        # Bay lines, half buried: dashed by a slow wobble where the snow covers them.
        for s in (1, -1):
            if -1.4 < x < AISLE_X0 - 0.1:
                k = 1 - _smooth(0.02, 0.05, abs(y - s * BAY_Y))
                k *= _smooth(0.2, 0.6, 0.5 + 0.5 * coast._wobble(2.5 * x, 3.0 * s))
                c = coast._mix(c, line, 0.6 * k)
        # Far fields: a touch darker where the snow is thin over the land.
        c = coast._mix(c, land, 0.18 * _smooth(HILL0, HILL1, abs(y)))
        layer.data[i].color = c


def _snow_material(name, tokens, vertex=True, token="snow"):
    """Snow: vertex color (or one token), soft large patches, a fine crust bump near the
    camera, matte, fading into the haze."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    bsdf = sea_world._principled(mat)
    bsdf.inputs["Roughness"].default_value = 0.9
    if vertex:
        attr = tree.nodes.new("ShaderNodeVertexColor")
        attr.layer_name = "ground"
        base = attr.outputs["Color"]
    else:
        rgb = tree.nodes.new("ShaderNodeRGB")
        rgb.outputs[0].default_value = color(tokens["colors"]["env"][token])
        base = rgb.outputs[0]
    coord = tree.nodes.new("ShaderNodeTexCoord")
    patches = tree.nodes.new("ShaderNodeTexNoise")
    patches.inputs["Scale"].default_value = 0.4
    patches.inputs["Detail"].default_value = 3.0
    shade = tree.nodes.new("ShaderNodeMapRange")
    shade.inputs["From Min"].default_value = 0.35
    shade.inputs["From Max"].default_value = 0.65
    shade.inputs["To Min"].default_value = 0.9
    shade.inputs["To Max"].default_value = 1.08
    tint = tree.nodes.new("ShaderNodeVectorMath")
    tint.operation = "SCALE"
    tree.links.new(coord.outputs["Object"], patches.inputs["Vector"])
    tree.links.new(patches.outputs["Fac"], shade.inputs["Value"])
    tree.links.new(base, tint.inputs[0])
    tree.links.new(shade.outputs["Result"], tint.inputs["Scale"])
    tree.links.new(tint.outputs["Vector"], bsdf.inputs["Base Color"])
    noise = tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 14.0
    noise.inputs["Detail"].default_value = 6.0
    bump = tree.nodes.new("ShaderNodeBump")
    bump.inputs["Distance"].default_value = 0.01
    tree.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    # The crust fades out with distance, or far snow sparkles (it's smaller than a pixel).
    camera = tree.nodes.new("ShaderNodeCameraData")
    near = tree.nodes.new("ShaderNodeMapRange")
    near.inputs["From Min"].default_value = 2.0
    near.inputs["From Max"].default_value = 14.0
    near.inputs["To Min"].default_value = 0.3
    near.inputs["To Max"].default_value = 0.0
    tree.links.new(camera.outputs["View Z Depth"], near.inputs["Value"])
    tree.links.new(near.outputs["Result"], bump.inputs["Strength"])
    coast._fade(mat, tokens)
    return mat


def _box(name, center, half):
    cx, cy, cz = center
    hx, hy, hz = half
    verts = [(cx + sx * hx, cy + sy * hy, cz + sz * hz) for sz in (-1, 1) for sy in (-1, 1) for sx in (-1, 1)]
    faces = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (1, 3, 7, 5), (3, 2, 6, 7), (2, 0, 4, 6)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return bpy.data.objects.new(name, mesh)


LAMP_ENERGY = 650.0  # watts per lamp (model units are about 2 m)
LAMP_REACH = 0.9  # how far the lamp head leans out over the car park, toward -y


def _lamps(level, coll, tokens):
    """Lamp posts in the snowbank, their heads leaning out over the bays, each a cool white
    spot light pointing down (the middle one lights the car)."""
    poles, arms, heads, caps = [], [], [], []
    for x in LAMP_XS:
        base = level + _bank(x, BANK_Y)
        top = level + LAMP_H
        poles.append(coast._cylinder("pole", x, BANK_Y, base - 0.1, top, 0.045, seg=12))
        arms.append(_box("arm", (x, BANK_Y - LAMP_REACH / 2, top - 0.03), (0.03, LAMP_REACH / 2, 0.03)))
        heads.append(_box("lamp", (x, BANK_Y - LAMP_REACH, top - 0.07), (0.2, 0.26, 0.04)))
        caps.append(_box("lamp-snow", (x, BANK_Y - LAMP_REACH, top - 0.01), (0.18, 0.24, 0.015)))
        data = bpy.data.lights.new("lamp", "SPOT")
        data.energy = LAMP_ENERGY
        data.color = color_srgb(tokens["colors"]["env"]["lamp"])
        data.spot_size = math.radians(95)
        data.spot_blend = 0.7
        data.shadow_soft_size = 0.35
        data.specular_factor = 0.25  # keeps the amber key the brightest thing in frame
        light = bpy.data.objects.new("lamp", data)
        light.location = (x, BANK_Y - LAMP_REACH, top - 0.13)
        bpy.context.scene.collection.objects.link(light)  # points straight down (-z)
    coast._link(coast._merge("snow-poles", poles + arms), coll, coast._plain("snow-poles", "structure", tokens))
    glow = coast._plain("snow-lamps", "structure", tokens, fade=False)
    bsdf = sea_world._principled(glow)
    bsdf.inputs["Emission Color"].default_value = color(tokens["colors"]["env"]["lamp"])
    # Soft: at 0.8 the Emission-pass glow bloomed the heads into a halo behind the question text.
    bsdf.inputs["Emission Strength"].default_value = 0.3
    coast._link(coast._merge("snow-lamps", heads), coll, glow)
    coast._link(coast._merge("snow-lamp-caps", caps), coll, _snow_material("snow-caps", tokens, vertex=False))


def _shop(level, coll, tokens):
    """A low shop: walls, a dark glass front facing the car park, a canopy over the door,
    and snow lying on the flat roof and the canopy."""
    x0, x1, y0, y1, h = SHOP
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    walls = [_box("shop", (cx, cy, level + h / 2 - 0.2), ((x1 - x0) / 2, (y1 - y0) / 2, h / 2 + 0.2))]
    walls.append(_box("canopy", (cx + 6.0, y0 - 0.9, level + 1.35), (3.0, 0.9, 0.06)))
    walls.append(_box("post", (cx + 3.2, y0 - 1.6, level + 0.65), (0.06, 0.06, 0.7)))
    walls.append(_box("post", (cx + 8.8, y0 - 1.6, level + 0.65), (0.06, 0.06, 0.7)))
    coast._link(coast._merge("snow-shop", walls), coll, coast._plain("snow-shop", "structure", tokens))
    glass = [_box("glass", (cx - 4.0 + 7.0 * k, y0 - 0.02, level + 0.75), (2.8, 0.02, 0.55)) for k in range(3)]
    lit = coast._plain("snow-shop-glass", "road", tokens, roughness=0.3)
    bsdf = sea_world._principled(lit)  # a dim, cool glow from inside the closed shop
    bsdf.inputs["Emission Color"].default_value = color(tokens["colors"]["env"]["lamp"])
    bsdf.inputs["Emission Strength"].default_value = 0.06
    coast._link(coast._merge("snow-shop-glass", glass), coll, lit)
    roof = [
        _box("roof-snow", (cx, cy, level + h + 0.06), ((x1 - x0) / 2 + 0.05, (y1 - y0) / 2 + 0.05, 0.06)),
        _box("canopy-snow", (cx + 6.0, y0 - 0.9, level + 1.43), (2.95, 0.85, 0.025)),
    ]
    coast._link(coast._merge("snow-roof", roof), coll, _snow_material("snow-roof", tokens, vertex=False))


def _cone(verts, faces, x, y, z0, z1, r, seg=10):
    base = len(verts)
    for k in range(seg):
        a = 2 * math.pi * k / seg
        verts.append((x + r * math.cos(a), y + r * math.sin(a), z0))
    verts.append((x, y, z1))
    tip = base + seg
    for k in range(seg):
        faces.append((base + k, base + (k + 1) % seg, tip))
    faces.append(tuple(base + k for k in range(seg))[::-1])


def _trees(level, coll, tokens):
    """A belt of firs behind the shop and along the sides: three stacked cones each, dark
    green with a snow cap on every tier."""
    green_v, green_f, snow_v, snow_f = [], [], [], []
    k = 0
    for row in range(5):
        y = TREES_Y0 + (TREES_Y1 - TREES_Y0) * row / 4
        for i in range(34):
            x = -70.0 + 140.0 * (i + 0.5 * (row % 2)) / 34 + 2.5 * (_hash(k, 1) - 0.5)
            yy = y + 3.0 * (_hash(k, 2) - 0.5)
            k += 1
            if _hash(k, 3) < 0.25:
                continue
            s = 2.2 + 1.6 * _hash(k, 4)
            z = level + height(x, yy) - 0.1
            for tier in range(3):
                z0 = z + s * (0.15 + 0.27 * tier)
                z1 = z0 + s * 0.45
                r = s * (0.36 - 0.09 * tier)
                _cone(green_v, green_f, x, yy, z0, z1, r)
                _cone(snow_v, snow_f, x, yy, z1 - s * 0.14, z1 + 0.02, r * 0.34)
    for name, verts, faces, mat in (
        ("snow-trees", green_v, green_f, coast._plain("snow-trees", "land", tokens)),
        ("snow-tree-caps", snow_v, snow_f, _snow_material("snow-tree-caps", tokens, vertex=False)),
    ):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        coast._link(bpy.data.objects.new(name, mesh), coll, mat)


def _flakes(level, coll, tokens):
    """Falling snow: small round flakes scattered through a tall box around the car; the
    whole cloud sinks at a steady speed (`_animate`), tall enough never to run out."""
    bm = bmesh.new()
    x0, x1, y0, y1 = FLAKE_BOX
    for i in range(FLAKES):
        x = x0 + (x1 - x0) * _hash(i, 11)
        y = y0 + (y1 - y0) * _hash(i, 12)
        z = level + 0.05 + FLAKE_TOP * _hash(i, 13)
        r = FLAKE_R * (0.6 + 0.8 * _hash(i, 14))
        geom = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)
        bmesh.ops.translate(bm, verts=geom["verts"], vec=(x, y, z))
    mesh = bpy.data.meshes.new("snow-flakes")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("snow-flakes", mesh)
    mat = bpy.data.materials.new("snow-flakes")
    mat.use_nodes = True
    bsdf = sea_world._principled(mat)
    bsdf.inputs["Base Color"].default_value = color(tokens["colors"]["env"]["flake"])
    bsdf.inputs["Roughness"].default_value = 1.0
    coast._fade(mat, tokens)
    coast._link(obj, coll, mat)
    obj.visible_shadow = False
    return obj


def build_snow(scene, tokens, parts):
    """Builds the world around the model. Returns the world state (`c.sea` in build.py)."""
    tokens = night_tokens(tokens)
    level = coast._lowest(parts) - HOVER

    scene.render.film_transparent = False
    sea_world._sky(scene, tokens)
    sea_world._sun(tokens)
    moon = bpy.data.objects.get("sun")
    if moon:  # a faint cool moon: enough to show the fields and the trees
        moon.data.energy = MOON_ENERGY
        moon.data.angle = math.radians(2)
    background = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
    background.inputs["Strength"].default_value *= SKY_STRENGTH
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = True

    coll = bpy.data.collections.new("world-snow")
    scene.collection.children.link(coll)
    edges = [AISLE_X0 - 0.15, AISLE_X0 + 0.15, AISLE_X1 - 0.15, AISLE_X1 + 0.15]
    xs = sorted(set(coast._axis(X0, X1, NX, dense=0.0) + edges))
    ys = sorted(set(coast._axis(Y0, Y1, NY, dense=0.0) + [s * d for s in (1, -1) for d in (BAY_Y, TRACK_Y)]))
    ground = coast._grid("snow-ground", xs, ys, lambda x, y: level + height(x, y))
    _paint(ground, level, tokens)
    coast._link(ground, coll, _snow_material("snow-ground", tokens))
    _lamps(level, coll, tokens)
    _shop(level, coll, tokens)
    _trees(level, coll, tokens)
    flakes = _flakes(level, coll, tokens)
    return {
        "level": level,
        "flakes": flakes,
        # Away parts (the car's shell in a cutaway) drop and shrink out of view as usual.
        "flatAway": False,
        "module": sys.modules[__name__],
    }


def _animate(world, frames, fps):
    with interpolation("LINEAR"):
        flakes = world["flakes"]
        for f in (0, frames):
            flakes.location = (0.0, 0.0, -FALL * f / fps)
            flakes.keyframe_insert("location", frame=f)
        sky = bpy.context.scene.world.node_tree
        stretch = next((n for n in sky.nodes if n.type == "MAPPING"), None)
        if stretch:  # the cloud banks drift slowly
            for f in (0, frames):
                stretch.inputs["Location"].default_value = (0.0004 * f, 0.0, 0.0)
                stretch.inputs["Location"].keyframe_insert("default_value", frame=f)


# Called by build.py's Clip on explode / collapse (the sea world moves its waves there).
def settle(world, start, end):
    pass


def show_edge(world, exploded, frame):
    pass


def build_clip_world(scene, tokens, parts, camera_object, clip, fps):
    """The whole world for one clip: car park, lens and framing."""
    start = clip["start"]
    backdrop = clip["id"] == "backdrop"
    world = build_snow(scene, tokens, parts)
    if clip["frames"] > 1:
        _animate(world, clip["frames"], fps)

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
