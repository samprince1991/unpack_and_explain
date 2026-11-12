"""The `coast` world: sea, a beach, dunes, grassland with a road, fence, lamps and power lines,
and hills on the horizon, under the sea world's sky and low warm sun. One scene, three
placements of the model (clip start field `coast`):

- sea:   the model on the water, the beach and land ahead in the distance (default)
- shore: the model on the water right at the beach, both in frame
- land:  the model on the grass, the sea far behind it

The model sits on the surface: its lowest point is the water (or ground) level. A model
with a `skirt` part is a hovercraft: over water its cushion presses a shallow dip into the
surface and a ring of spray rises around the skirt.

The world is shaded but carries no Freestyle lines; lines stay on the model's parts, so
`qc.py` still checks only the model. Colors: the muted `env.*` tokens only. Everything is
deterministic (no random), so a re-render draws the same picture."""

import math
import sys

import bpy
from mathutils import Vector

from build import interpolation

from common import color
from world import sea as sea_world

LENS = 30
PUSH = 1.1
FRAME_Y = 0.42

# Where the shoreline sits along +x (the model's forward axis), per placement.
SHORE = {"sea": 9.0, "shore": 1.6, "land": -15.0}
HOVER = 0.012  # gap between the model's lowest point and the surface

# Terrain, as height above the still water over u = distance inland from the shoreline.
BEACH, DUNE0, DUNE1 = 5.0, 5.0, 9.0
BEACH_RISE = 0.032
DUNE_H = 0.28
PLATEAU = 0.5
HILL0, HILL1, HILL_H = 34.0, 70.0, 5.5
SEABED = 0.05  # slope of the seabed (hidden under the opaque water, keeps the shore clean)

X0, X1, Y0, Y1 = -90.0, 130.0, -110.0, 110.0
NX, NY = 260, 200
FADE_NEAR, FADE_FAR = 14.0, 120.0  # land and water dissolve into the sky with distance

# Inland past the plateau edge, so a model placed on land sits in front of them.
ROAD_U, ROAD_W = 19.0, 0.7
FENCE_U, FENCE_STEP = 20.1, 1.3
LAMP_U, LAMP_STEP = 18.1, 7.0
POLE_U, POLE_STEP, POLE_H = 25.0, 9.0, 2.2
SPAN = 46.0  # half length of the road, fence and lines along y

DIP = 0.035  # how far the cushion presses the water down (exaggerated to read on screen)
SPRAY_H, SPRAY_FLARE = 0.2, 0.28
SPRAY_DRIFT = 0.03


def _smooth(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def _wobble(y, u):
    """Deterministic gentle variation (sums of sines), about -1..1."""
    return 0.5 * math.sin(0.21 * y + 0.13 * u) + 0.3 * math.sin(0.47 * y - 0.31 * u + 1.3) + 0.2 * math.sin(1.1 * y + 0.7 * u + 2.1)


def shore_offset(y):
    """The shoreline curves gently into a bay; zero at y = 0 so placements stay exact."""
    return 2.2 * (1 - math.cos(0.045 * y))


def height(u, y):
    """Terrain height above the still water at u (inland distance from the shoreline)."""
    if u < 0:
        return max(-SEABED * -u, -1.2)
    h = BEACH_RISE * min(u, BEACH)
    h += DUNE_H * _smooth(DUNE0, DUNE1, u) * (0.75 + 0.25 * _wobble(y, u))
    h += (PLATEAU - DUNE_H) * _smooth(DUNE1, DUNE1 + 4, u)
    h += 0.12 * _smooth(DUNE1, DUNE1 + 6, u) * _wobble(0.6 * y, 0.5 * u)
    h += HILL_H * _smooth(HILL0, HILL1, u) * (0.6 + 0.4 * _wobble(0.18 * y, 0.05 * u))
    return h


def _axis(lo, hi, n, dense=0.0, power=2.2):
    """n+1 values from lo to hi, packed densely around `dense`."""
    out = []
    for i in range(n + 1):
        t = -1 + 2 * i / n
        s = math.copysign(abs(t) ** power, t)
        out.append(dense + s * ((hi - dense) if s > 0 else (dense - lo)))
    return out


def _grid(name, xs, ys, z_of):
    verts = [(x, y, z_of(x, y)) for y in ys for x in xs]
    nx = len(xs)
    faces = [
        (j * nx + i, j * nx + i + 1, (j + 1) * nx + i + 1, (j + 1) * nx + i)
        for j in range(len(ys) - 1)
        for i in range(nx - 1)
    ]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    mesh.shade_smooth()
    return bpy.data.objects.new(name, mesh)


def _fog_shader(tree, tokens):
    """Opaque fog: unlit horizon color. Fading to transparent instead dithers into noise."""
    fog = tree.nodes.new("ShaderNodeEmission")
    fog.inputs["Color"].default_value = color(tokens["colors"]["env"]["horizon"])
    fog.inputs["Strength"].default_value = 1.0
    return fog


def _fade(mat, tokens, near=FADE_NEAR, far=FADE_FAR):
    """Mixes the surface toward the horizon color with camera depth (fog without volumes)."""
    tree = mat.node_tree
    output = next(n for n in tree.nodes if n.type == "OUTPUT_MATERIAL")
    surface = output.inputs["Surface"].links[0].from_socket
    camera = tree.nodes.new("ShaderNodeCameraData")
    span = tree.nodes.new("ShaderNodeMapRange")
    span.inputs["From Min"].default_value = near
    span.inputs["From Max"].default_value = far
    span.interpolation_type = "SMOOTHSTEP"
    clear = _fog_shader(tree, tokens)
    mix = tree.nodes.new("ShaderNodeMixShader")
    tree.links.new(camera.outputs["View Z Depth"], span.inputs["Value"])
    tree.links.new(span.outputs["Result"], mix.inputs[0])
    tree.links.new(surface, mix.inputs[1])
    tree.links.new(clear.outputs[0], mix.inputs[2])
    tree.links.new(mix.outputs[0], output.inputs["Surface"])


def _plain(name, token, tokens, roughness=0.8, fade=True):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = sea_world._principled(mat)
    bsdf.inputs["Base Color"].default_value = color(tokens["colors"]["env"][token])
    bsdf.inputs["Roughness"].default_value = roughness
    if fade:
        _fade(mat, tokens)
    return mat


def _terrain_material(tokens):
    """Vertex colors carry sand, grass and the foam line; a fine noise roughens the surface."""
    mat = bpy.data.materials.new("coast-terrain")
    mat.use_nodes = True
    tree = mat.node_tree
    bsdf = sea_world._principled(mat)
    attr = tree.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "ground"
    tree.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.92
    coord = tree.nodes.new("ShaderNodeTexCoord")
    noise = tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.0
    noise.inputs["Detail"].default_value = 8.0
    bump = tree.nodes.new("ShaderNodeBump")
    bump.inputs["Distance"].default_value = 0.02
    tree.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    # The fine bump fades out with distance, or far ground sparkles (it's smaller than a pixel).
    camera = tree.nodes.new("ShaderNodeCameraData")
    near = tree.nodes.new("ShaderNodeMapRange")
    near.inputs["From Min"].default_value = 2.0
    near.inputs["From Max"].default_value = 16.0
    near.inputs["To Min"].default_value = 0.35
    near.inputs["To Max"].default_value = 0.0
    tree.links.new(camera.outputs["View Z Depth"], near.inputs["Value"])
    tree.links.new(near.outputs["Result"], bump.inputs["Strength"])
    # Large soft patches (grass growing thicker and thinner), darker and lighter.
    patches = tree.nodes.new("ShaderNodeTexNoise")
    patches.inputs["Scale"].default_value = 0.35
    patches.inputs["Detail"].default_value = 4.0
    shade = tree.nodes.new("ShaderNodeMapRange")
    shade.inputs["From Min"].default_value = 0.35
    shade.inputs["From Max"].default_value = 0.65
    shade.inputs["To Min"].default_value = 0.6
    shade.inputs["To Max"].default_value = 1.4
    tint = tree.nodes.new("ShaderNodeVectorMath")
    tint.operation = "SCALE"
    tree.links.new(coord.outputs["Object"], patches.inputs["Vector"])
    tree.links.new(patches.outputs["Fac"], shade.inputs["Value"])
    tree.links.new(attr.outputs["Color"], tint.inputs[0])
    tree.links.new(shade.outputs["Result"], tint.inputs["Scale"])
    tree.links.new(tint.outputs["Vector"], bsdf.inputs["Base Color"])
    _fade(mat, tokens)
    return mat


def _mix(a, b, t):
    return tuple(a[i] * (1 - t) + b[i] * t for i in range(4))


def _paint_ground(obj, level, shore, tokens):
    env = tokens["colors"]["env"]
    sand, land, foam = color(env["sand"]), color(env["land"]), color(env["horizon"])
    wet = _mix(sand, color(env["seaShallow"]), 0.55)
    layer = obj.data.color_attributes.new("ground", "FLOAT_COLOR", "POINT")
    for i, v in enumerate(obj.data.vertices):
        x, y, z = v.co
        u = x - shore - shore_offset(y)
        h = z - level
        grass = _smooth(DUNE0 + 1.0, DUNE1 + 1.0, u + 1.2 * _wobble(0.4 * y, 0.3 * u))
        c = _mix(sand, land, grass)
        c = _mix(c, wet, 1 - _smooth(0.0, 0.05, h))  # wet sand at the water's edge
        c = _mix(c, foam, 0.55 * (1 - _smooth(0.0, 0.018, abs(h - 0.006))))  # the foam line
        c = _mix(c, land, 0.25 * _smooth(HILL0, HILL1, u))  # darker far hills
        layer.data[i].color = c


def _link(obj, coll, mat):
    coll.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def _cylinder(name, x, y, z0, z1, r, seg=16):
    verts, faces = [], []
    for k in range(seg):
        a = 2 * math.pi * k / seg
        verts += [(x + r * math.cos(a), y + r * math.sin(a), z0), (x + r * math.cos(a), y + r * math.sin(a), z1)]
    for k in range(seg):
        j = (k + 1) % seg
        faces.append((2 * k, 2 * j, 2 * j + 1, 2 * k + 1))
    faces.append(tuple(2 * k for k in range(seg))[::-1])
    faces.append(tuple(2 * k + 1 for k in range(seg)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return bpy.data.objects.new(name, mesh)


def _merge(name, objs):
    """Joins many small meshes into one object (fewer draw calls)."""
    verts, faces = [], []
    for obj in objs:
        base = len(verts)
        verts += [tuple(v.co) for v in obj.data.vertices]
        faces += [tuple(base + i for i in p.vertices) for p in obj.data.polygons]
        mesh = obj.data
        bpy.data.objects.remove(obj)
        bpy.data.meshes.remove(mesh)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return bpy.data.objects.new(name, mesh)


def _ground_z(level, shore, x, y):
    return level + height(x - shore - shore_offset(y), y)


def _x_at(shore, u, y):
    return shore + shore_offset(y) + u


def _road(level, shore, coll, tokens):
    ys = _axis(-SPAN, SPAN, 120, power=1.0)
    xs = [-ROAD_W / 2, 0.0, ROAD_W / 2]

    def z_of(x, y):
        return _ground_z(level, shore, _x_at(shore, ROAD_U, y), y) + 0.02

    obj = _grid("coast-road", xs, ys, z_of)
    for v in obj.data.vertices:
        v.co.x += _x_at(shore, ROAD_U, v.co.y)
    _link(obj, coll, _plain("coast-road", "road", tokens, roughness=0.6))


def _fence_and_lamps(level, shore, coll, tokens):
    posts = []
    n = int(2 * SPAN / FENCE_STEP)
    for k in range(n + 1):
        y = -SPAN + k * FENCE_STEP
        x = _x_at(shore, FENCE_U, y)
        z = _ground_z(level, shore, x, y)
        posts.append(_cylinder("post", x, y, z - 0.05, z + 0.22, 0.018, seg=8))
    rails = []
    for h in (0.1, 0.19):
        for k in range(n):
            y0, y1 = -SPAN + k * FENCE_STEP, -SPAN + (k + 1) * FENCE_STEP
            x0, x1 = _x_at(shore, FENCE_U, y0), _x_at(shore, FENCE_U, y1)
            z0, z1 = _ground_z(level, shore, x0, y0) + h, _ground_z(level, shore, x1, y1) + h
            verts = [(x0, y0, z0 - 0.006), (x1, y1, z1 - 0.006), (x1, y1, z1 + 0.006), (x0, y0, z0 + 0.006)]
            mesh = bpy.data.meshes.new("rail")
            mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
            rails.append(bpy.data.objects.new("rail", mesh))
    _link(_merge("coast-fence", posts + rails), coll, _plain("coast-fence", "structure", tokens))

    poles, heads = [], []
    m = int(2 * SPAN / LAMP_STEP)
    for k in range(m + 1):
        y = -SPAN + k * LAMP_STEP
        x = _x_at(shore, LAMP_U, y)
        z = _ground_z(level, shore, x, y)
        poles.append(_cylinder("lamp", x, y, z - 0.05, z + 0.9, 0.02, seg=10))
        heads.append(_cylinder("lamphead", x, y, z + 0.9, z + 0.95, 0.05, seg=12))
    _link(_merge("coast-lamps", poles), coll, _plain("coast-lamps", "structure", tokens))
    glow = _plain("coast-lamphead", "light", tokens, fade=True)
    bsdf = sea_world._principled(glow)
    bsdf.inputs["Emission Color"].default_value = color(tokens["colors"]["env"]["light"])
    bsdf.inputs["Emission Strength"].default_value = 2.5
    _link(_merge("coast-lampheads", heads), coll, glow)


def _power_lines(level, shore, coll, tokens):
    parts = []
    n = int(2 * SPAN / POLE_STEP)
    tops = []
    for k in range(n + 1):
        y = -SPAN + k * POLE_STEP
        x = _x_at(shore, POLE_U, y)
        z = _ground_z(level, shore, x, y)
        parts.append(_cylinder("pole", x, y, z - 0.1, z + POLE_H, 0.035, seg=10))
        # cross arm
        # cross arm, across the line's direction (the line runs along y)
        lo, hi = z + POLE_H - 0.15, z + POLE_H - 0.1
        verts = [(x - 0.45, y - 0.03, lo), (x + 0.45, y - 0.03, lo), (x + 0.45, y + 0.03, lo), (x - 0.45, y + 0.03, lo),
                 (x - 0.45, y - 0.03, hi), (x + 0.45, y - 0.03, hi), (x + 0.45, y + 0.03, hi), (x - 0.45, y + 0.03, hi)]
        mesh = bpy.data.meshes.new("arm")
        mesh.from_pydata(verts, [], [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)])
        parts.append(bpy.data.objects.new("arm", mesh))
        tops.append((x, y, z + POLE_H - 0.1))
    # sagging wires: thin vertical ribbons, three per span
    for (xa, ya, za), (xb, yb, zb) in zip(tops, tops[1:]):
        for off in (-0.4, 0.0, 0.4):
            verts, faces = [], []
            steps = 16
            for s in range(steps + 1):
                t = s / steps
                x = xa + (xb - xa) * t
                y = ya + (yb - ya) * t
                z = za + (zb - za) * t - 0.35 * 4 * t * (1 - t)
                verts += [(x + off, y, z - 0.005), (x + off, y, z + 0.005)]
            for s in range(steps):
                faces.append((2 * s, 2 * s + 2, 2 * s + 3, 2 * s + 1))
            mesh = bpy.data.meshes.new("wire")
            mesh.from_pydata(verts, [], faces)
            parts.append(bpy.data.objects.new("wire", mesh))
    _link(_merge("coast-power", parts), coll, _plain("coast-power", "structure", tokens))


def _footprint(parts):
    """Plan half sizes and center of the skirt (or the whole model), in world space."""
    names = ["skirt"] if "skirt" in parts else list(parts)
    pts = [o.matrix_world @ Vector(c) for n in names for o in parts[n]["objects"] for c in o.bound_box]
    lo = Vector((min(p[i] for p in pts) for i in range(3)))
    hi = Vector((max(p[i] for p in pts) for i in range(3)))
    return (lo + hi) / 2, (hi - lo) / 2


def _lowest(parts):
    zs = [(o.matrix_world @ v.co).z for info in parts.values() for o in info["objects"] for v in o.data.vertices]
    return min(zs)


def _water(scene, level, shore, center, half, over_water, coll, tokens):
    xs = sorted(set(_axis(X0, shore + 6.0, NX, dense=min(0.0, shore + 5.0))))
    ys = _axis(Y0, Y1, NY, dense=0.0)
    obj = _grid("coast-water", xs, ys, lambda x, y: level)
    coll.objects.link(obj)
    mat = sea_world._water_material(tokens)
    tree = mat.node_tree
    span = next(n for n in tree.nodes if n.type == "MAP_RANGE")
    span.inputs["From Min"].default_value = FADE_NEAR
    span.inputs["From Max"].default_value = FADE_FAR
    span.interpolation_type = "SMOOTHSTEP"
    # The sea world fades its water to transparent (only sky behind it); here land sits behind.
    clear = next(n for n in tree.nodes if n.type == "BSDF_TRANSPARENT")
    mix = next(n for n in tree.nodes if n.type == "MIX_SHADER")
    tree.links.new(_fog_shader(tree, tokens).outputs[0], mix.inputs[2])
    tree.nodes.remove(clear)
    obj.data.materials.append(mat)

    def dip(x, y):
        if not over_water:
            return 0.0
        dx = abs(x - center.x) / (half.x * 0.95)
        dy = abs(y - center.y) / (half.y * 0.95)
        r = (dx**4 + dy**4) ** 0.25  # the skirt's rounded-rectangle plan
        return -DIP * (1 - _smooth(0.6, 1.25, r))

    uv = [(v.co.x, v.co.y) for v in obj.data.vertices]
    sea_world._add_keys(obj, uv, level, {"dip": dip, **sea_world._swell_keys()})
    obj.data.shape_keys.key_blocks["dip"].value = 1.0
    return obj, mat


def _spray(level, center, half, coll, tokens):
    """A ring of mist around the skirt: a flared band, its alpha a drifting noise."""
    seg, rows = 96, 6
    verts, faces = [], []
    for j in range(rows + 1):
        t = j / rows
        grow = 1.0 + SPRAY_FLARE * t / max(half.x, half.y) + 0.06
        z = level + SPRAY_H * t
        for k in range(seg):
            a = 2 * math.pi * k / seg
            c, s = math.cos(a), math.sin(a)
            x = center.x + half.x * grow * math.copysign(abs(c) ** 0.5, c)
            y = center.y + half.y * grow * math.copysign(abs(s) ** 0.5, s)
            verts.append((x, y, z))
    for j in range(rows):
        for k in range(seg):
            n = (k + 1) % seg
            faces.append((j * seg + k, j * seg + n, (j + 1) * seg + n, (j + 1) * seg + k))
    mesh = bpy.data.meshes.new("coast-spray")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    mesh.shade_smooth()
    obj = bpy.data.objects.new("coast-spray", mesh)
    coll.objects.link(obj)

    mat = bpy.data.materials.new("coast-spray")
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    # Mostly self-lit: spray catches the light all round, it never sits in the hull's shadow.
    lit = tree.nodes.new("ShaderNodeBsdfDiffuse")
    lit.inputs["Color"].default_value = color(tokens["colors"]["env"]["horizon"])
    glow = tree.nodes.new("ShaderNodeEmission")
    glow.inputs["Color"].default_value = color(tokens["colors"]["env"]["horizon"])
    glow.inputs["Strength"].default_value = 0.9
    mist = tree.nodes.new("ShaderNodeAddShader")
    tree.links.new(lit.outputs[0], mist.inputs[0])
    tree.links.new(glow.outputs[0], mist.inputs[1])
    clear = tree.nodes.new("ShaderNodeBsdfTransparent")
    mix = tree.nodes.new("ShaderNodeMixShader")
    coord = tree.nodes.new("ShaderNodeTexCoord")
    drift = tree.nodes.new("ShaderNodeMapping")
    drift.name = "spray-drift"
    noise = tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 9.0
    noise.inputs["Detail"].default_value = 6.0
    shape = tree.nodes.new("ShaderNodeMapRange")
    shape.inputs["From Min"].default_value = 0.38
    shape.inputs["From Max"].default_value = 0.62
    # thinner toward the top of the band
    split = tree.nodes.new("ShaderNodeSeparateXYZ")
    rise = tree.nodes.new("ShaderNodeMapRange")
    rise.inputs["From Min"].default_value = level
    rise.inputs["From Max"].default_value = level + SPRAY_H
    rise.inputs["To Min"].default_value = 0.85
    rise.inputs["To Max"].default_value = 0.0
    dense = tree.nodes.new("ShaderNodeMath")
    dense.operation = "MULTIPLY"
    geometry = tree.nodes.new("ShaderNodeNewGeometry")
    tree.links.new(coord.outputs["Object"], drift.inputs["Vector"])
    tree.links.new(drift.outputs["Vector"], noise.inputs["Vector"])
    tree.links.new(noise.outputs["Fac"], shape.inputs["Value"])
    tree.links.new(geometry.outputs["Position"], split.inputs[0])
    tree.links.new(split.outputs["Z"], rise.inputs["Value"])
    tree.links.new(shape.outputs["Result"], dense.inputs[0])
    tree.links.new(rise.outputs["Result"], dense.inputs[1])
    tree.links.new(dense.outputs[0], mix.inputs[0])
    tree.links.new(clear.outputs[0], mix.inputs[1])
    tree.links.new(mist.outputs[0], mix.inputs[2])
    tree.links.new(mix.outputs[0], out.inputs["Surface"])
    obj.data.materials.append(mat)
    return mat


def build_coast(scene, tokens, parts, placement="sea", show_model=True, hover=0.0):
    """Builds the world around the model. Returns the world state (`c.sea` in build.py).
    `hover` (the catalog's, model units) lifts the model that far off the surface: a
    helicopter hovering."""
    shore = SHORE[placement]
    lowest = _lowest(parts)
    center, half = _footprint(parts)
    over_water = shore > center.x + half.x * 0.5
    ground = lowest - HOVER - hover
    # The model rests at the surface: on water that's the water level; on land the ground
    # under it, so the water sits lower by the terrain height there.
    level = ground if over_water else ground - height(-shore, 0.0)

    scene.render.film_transparent = False
    sea_world._sky(scene, tokens)
    sea_world._sun(tokens)
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = True

    coll = bpy.data.collections.new("world-coast")
    scene.collection.children.link(coll)
    xs = sorted(set(_axis(X0, X1, NX, dense=0.0) + [shore + d for d in (-0.6, -0.3, 0.0, 0.15, 0.3, 0.6, 1.0)]))
    ys = _axis(Y0, Y1, NY, dense=0.0)
    terrain = _grid("coast-terrain", xs, ys, lambda x, y: _ground_z(level, shore, x, y))
    _paint_ground(terrain, level, shore, tokens)
    _link(terrain, coll, _terrain_material(tokens))
    water, water_mat = _water(scene, level, shore, center, half, over_water and show_model, coll, tokens)
    _road(level, shore, coll, tokens)
    _fence_and_lamps(level, shore, coll, tokens)
    _power_lines(level, shore, coll, tokens)
    spray = _spray(level, center, half, coll, tokens) if (over_water and show_model and "skirt" in parts) else None
    spray_obj = bpy.data.objects.get("coast-spray") if spray else None
    if spray_obj:
        with interpolation("CONSTANT"):
            spray_obj.hide_render = False
            spray_obj.keyframe_insert("hide_render", frame=0)

    world = {
        "level": level,
        "meshes": [water],
        "material": water_mat,
        "spray": spray,
        "spray_obj": spray_obj,
        # Away parts (a hovercraft's skirt) drop and shrink out of view as usual, so the air
        # cushion underneath shows; the sea world flattens them into its water instead.
        "flatAway": False,
        "module": sys.modules[__name__],
    }
    sea_world.set_swell(world, 0.0)
    return world


def _animate(world, frames, fps):
    with interpolation("LINEAR"):
        for f in range(frames + 1):
            sea_world.set_swell(world, f / fps, frame=f)
        socket = world["material"].node_tree.nodes["ripple-drift"].inputs["Location"]
        for f in (0, frames):
            socket.default_value = (sea_world.BUMP_DRIFT * f, sea_world.BUMP_DRIFT * f * 0.5, 0.0)
            socket.keyframe_insert("default_value", frame=f)
        if world["spray"]:
            socket = world["spray"].node_tree.nodes["spray-drift"].inputs["Location"]
            for f in (0, frames):
                socket.default_value = (0.0, 0.0, -SPRAY_DRIFT * f)  # the mist streams upward
                socket.keyframe_insert("default_value", frame=f)
        sky = bpy.context.scene.world.node_tree
        stretch = next((n for n in sky.nodes if n.type == "MAPPING"), None)
        if stretch:  # the clouds drift slowly
            for f in (0, frames):
                stretch.inputs["Location"].default_value = (0.0006 * f, 0.0, 0.0)
                stretch.inputs["Location"].keyframe_insert("default_value", frame=f)


# Called by build.py's Clip on explode / collapse (the sea world moves its waves there).
def settle(world, start, end):
    pass


def show_edge(world, exploded, frame):
    """Called with the explode state as an away part leaves or returns: the spray ring hides
    while a hovercraft's skirt is away, so the cushion under the hull shows."""
    spray = world.get("spray_obj")
    if spray is None:
        return
    with interpolation("CONSTANT"):
        spray.hide_render = exploded
        spray.keyframe_insert("hide_render", frame=frame)


def build_clip_world(scene, tokens, parts, camera_object, clip, fps):
    """The whole world for one clip: coast, placement, lens and framing."""
    start = clip["start"]
    backdrop = clip["id"] == "backdrop"
    placement = "shore" if backdrop else start.get("coast", "sea")
    world = build_coast(scene, tokens, parts, placement, show_model=not backdrop, hover=clip.get("hover", 0.0))
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
