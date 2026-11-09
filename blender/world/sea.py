"""The `sea` world: sky, a low warm sun, and a sea cut in section just in front of the ship,
so one picture shows the surface above the cut edge and the hull and bulb below it, with no
transparent water to render. The wave shapes are sampled from the model's own wave tubes
and stored as shape keys, which add linearly: the surface is the literal sum of the waves.
A schematic illustration, not a fluid simulation."""

import bisect
import math
import random

import bpy
from mathutils import Vector

from common import color, color_srgb

NEAR_X = (-2.2, 1.6)  # fine grid around the bow
FAR_X = 70.0
FAR_Y = 90.0
NX_NEAR, NX_FAR, NY = 260, 28, 200
CUT_GAP = 0.02
WAKE_SLANT = 0.55  # the waves trail aft with distance from the hull (a V-shaped wake)
WAKE_DECAY = 1.1
FADE_NEAR, FADE_FAR = 7.0, 38.0  # the water dissolves into the sky toward the horizon
SECTION_GAP = 0.05  # wave lines sit in front of the cut, clear of the water mesh
SUN_DIR = (0.2, 0.95, 0.13)  # toward the sun: low, ahead of the camera, off the bow
GLOW_THRESHOLD = 0.1  # only the amber key blooms, not the faint world light


def _principled(mat):
    return next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def _swell(x, y):
    return (
        0.010 * math.sin(2.1 * x + 1.3 * y)
        + 0.007 * math.sin(3.7 * x - 2.3 * y + 1.0)
        + 0.004 * math.sin(7.1 * x + 4.9 * y + 2.0)
    )


class Profile:
    """Wave height over world x, read from a wave tube's vertices (relative to the sea level)."""

    def __init__(self, objects, level):
        buckets = {}
        for obj in objects:
            for v in obj.data.vertices:
                co = obj.matrix_world @ v.co
                buckets.setdefault(round(co.x, 4), []).append(co.z)
        self.xs = sorted(buckets)
        self.zs = [sum(buckets[x]) / len(buckets[x]) - level for x in self.xs]

    def at(self, x):
        if x <= self.xs[0] or x >= self.xs[-1]:
            return 0.0
        i = bisect.bisect_right(self.xs, x)
        x0, x1 = self.xs[i - 1], self.xs[i]
        f = (x - x0) / max(x1 - x0, 1e-9)
        return self.zs[i - 1] * (1 - f) + self.zs[i] * f


def _axis_x():
    near = [NEAR_X[0] + (NEAR_X[1] - NEAR_X[0]) * i / NX_NEAR for i in range(NX_NEAR + 1)]
    left = [NEAR_X[0] - (FAR_X + NEAR_X[0]) * (i / NX_FAR) ** 2 for i in range(NX_FAR, 0, -1)]
    right = [NEAR_X[1] + (FAR_X - NEAR_X[1]) * (i / NX_FAR) ** 2 for i in range(1, NX_FAR + 1)]
    return left + near + right


def _grid_mesh(name, xs, ys, height):
    """A quad grid; height(x, y) gives z. Returns (object, list of (x, y) per vertex)."""
    verts, uv = [], []
    for y in ys:
        for x in xs:
            verts.append((x, y, height(x, y)))
            uv.append((x, y))
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
    return bpy.data.objects.new(name, mesh), uv


def _add_keys(obj, uv, base, wave_fns):
    obj.shape_key_add(name="Basis", from_mix=False)
    for name, fn in wave_fns.items():
        key = obj.shape_key_add(name=name, from_mix=False)
        for i, (x, y) in enumerate(uv):
            key.data[i].co.z = base(x, y) + fn(x, y)


def _water_material(tokens):
    env = tokens["colors"]["env"]
    mat = bpy.data.materials.new("sea-surface")
    mat.use_nodes = True
    tree = mat.node_tree
    bsdf = _principled(mat)
    bsdf.inputs["Base Color"].default_value = color(env["surface"])
    bsdf.inputs["Roughness"].default_value = 0.34
    bsdf.inputs["Metallic"].default_value = 0.0

    coord = tree.nodes.new("ShaderNodeTexCoord")
    noise = tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 26.0
    noise.inputs["Detail"].default_value = 6.0
    bump = tree.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.22
    bump.inputs["Distance"].default_value = 0.05
    tree.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    # Fog without volumes: the water dissolves to the sky behind it with distance.
    camera = tree.nodes.new("ShaderNodeCameraData")
    fade = tree.nodes.new("ShaderNodeMapRange")
    fade.inputs["From Min"].default_value = FADE_NEAR
    fade.inputs["From Max"].default_value = FADE_FAR
    clear = tree.nodes.new("ShaderNodeBsdfTransparent")
    mix = tree.nodes.new("ShaderNodeMixShader")
    output = next(n for n in tree.nodes if n.type == "OUTPUT_MATERIAL")
    tree.links.new(camera.outputs["View Z Depth"], fade.inputs["Value"])
    tree.links.new(fade.outputs["Result"], mix.inputs[0])
    tree.links.new(bsdf.outputs[0], mix.inputs[1])
    tree.links.new(clear.outputs[0], mix.inputs[2])
    tree.links.new(mix.outputs[0], output.inputs["Surface"])
    return mat


def _sky(scene, tokens):
    """Sky above the horizon and murky sea below it, as one gradient on the view direction."""
    env = tokens["colors"]["env"]
    world = bpy.data.worlds.new("sea-sky")
    world.use_nodes = True
    tree = world.node_tree
    background = next(n for n in tree.nodes if n.type == "BACKGROUND")
    coord = tree.nodes.new("ShaderNodeTexCoord")
    split = tree.nodes.new("ShaderNodeSeparateXYZ")
    span = tree.nodes.new("ShaderNodeMapRange")
    low, high = -0.85, 0.6
    span.inputs["From Min"].default_value = low
    span.inputs["From Max"].default_value = high
    ramp = tree.nodes.new("ShaderNodeValToRGB")
    stops = [
        (-0.85, env["seaDeep"]),
        (-0.08, env["seaShallow"]),
        (0.0, env["horizon"]),
        (0.05, env["horizon"]),
        (0.6, env["skyTop"]),
    ]
    elements = ramp.color_ramp.elements
    while len(elements) < len(stops):
        elements.new(0.5)
    for element, (z, token) in zip(elements, stops):
        element.position = (z - low) / (high - low)
        element.color = color(token)
    tree.links.new(coord.outputs["Generated"], split.inputs[0])
    tree.links.new(split.outputs["Z"], span.inputs["Value"])
    tree.links.new(span.outputs["Result"], ramp.inputs["Fac"])
    # Soft stretched cloud banks, above the horizon only.
    stretch = tree.nodes.new("ShaderNodeMapping")
    stretch.inputs["Scale"].default_value = (2.2, 2.2, 13.0)
    noise = tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.0
    noise.inputs["Detail"].default_value = 7.0
    noise.inputs["Roughness"].default_value = 0.55
    shape = tree.nodes.new("ShaderNodeMapRange")
    shape.inputs["From Min"].default_value = 0.46
    shape.inputs["From Max"].default_value = 0.72
    shape.inputs["To Max"].default_value = 0.3
    above = tree.nodes.new("ShaderNodeMapRange")
    above.inputs["From Min"].default_value = 0.0
    above.inputs["From Max"].default_value = 0.06
    only_sky = tree.nodes.new("ShaderNodeMath")
    only_sky.operation = "MULTIPLY"
    clouds = tree.nodes.new("ShaderNodeMixRGB")
    clouds.inputs["Color2"].default_value = color(env["horizon"])
    tree.links.new(coord.outputs["Generated"], stretch.inputs["Vector"])
    tree.links.new(stretch.outputs["Vector"], noise.inputs["Vector"])
    tree.links.new(noise.outputs["Fac"], shape.inputs["Value"])
    tree.links.new(split.outputs["Z"], above.inputs["Value"])
    tree.links.new(shape.outputs["Result"], only_sky.inputs[0])
    tree.links.new(above.outputs["Result"], only_sky.inputs[1])
    tree.links.new(only_sky.outputs[0], clouds.inputs["Fac"])
    tree.links.new(ramp.outputs[0], clouds.inputs["Color1"])

    # A soft warm glow around the low sun.
    dot = tree.nodes.new("ShaderNodeVectorMath")
    dot.operation = "DOT_PRODUCT"
    length = math.sqrt(sum(c * c for c in SUN_DIR))
    dot.inputs[1].default_value = [c / length for c in SUN_DIR]
    clamp = tree.nodes.new("ShaderNodeMath")
    clamp.operation = "MAXIMUM"
    clamp.inputs[1].default_value = 0.0
    power = tree.nodes.new("ShaderNodeMath")
    power.operation = "POWER"
    power.inputs[1].default_value = 40.0
    scale = tree.nodes.new("ShaderNodeMath")
    scale.operation = "MULTIPLY"
    scale.inputs[1].default_value = 0.42
    glow = tree.nodes.new("ShaderNodeMixRGB")
    glow.blend_type = "SCREEN"
    glow.inputs["Color2"].default_value = color(env["light"])
    tree.links.new(coord.outputs["Generated"], dot.inputs[0])
    tree.links.new(dot.outputs["Value"], clamp.inputs[0])
    tree.links.new(clamp.outputs[0], power.inputs[0])
    tree.links.new(power.outputs[0], scale.inputs[0])
    tree.links.new(scale.outputs[0], glow.inputs["Fac"])
    tree.links.new(clouds.outputs[0], glow.inputs["Color1"])
    tree.links.new(glow.outputs[0], background.inputs["Color"])
    background.inputs["Strength"].default_value = 1.0
    scene.world = world


def _sun(tokens):
    data = bpy.data.lights.new("sun", "SUN")
    data.energy = 1.4
    data.angle = math.radians(4)
    data.color = color_srgb(tokens["colors"]["env"]["light"])
    obj = bpy.data.objects.new("sun", data)
    # Low, ahead of the camera and off the bow side: a glint road on the water and a rim on the hull.
    obj.rotation_euler = Vector(SUN_DIR).to_track_quat("Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(obj)


def _submerge(mat, level, tokens):
    """Tints a part toward the water color with depth below the surface."""
    tree = mat.node_tree
    bsdf = _principled(mat)
    base = bsdf.inputs["Base Color"].default_value[:]
    geometry = tree.nodes.new("ShaderNodeNewGeometry")
    split = tree.nodes.new("ShaderNodeSeparateXYZ")
    depth = tree.nodes.new("ShaderNodeMapRange")
    depth.inputs["From Min"].default_value = level
    depth.inputs["From Max"].default_value = level - 0.45
    depth.inputs["To Max"].default_value = 0.75
    mix = tree.nodes.new("ShaderNodeMixRGB")
    mix.inputs["Color1"].default_value = base
    mix.inputs["Color2"].default_value = color(tokens["colors"]["env"]["seaShallow"])
    tree.links.new(geometry.outputs["Position"], split.inputs[0])
    tree.links.new(split.outputs["Z"], depth.inputs["Value"])
    tree.links.new(depth.outputs["Result"], mix.inputs["Fac"])
    tree.links.new(mix.outputs[0], bsdf.inputs["Base Color"])


def _plating(mat):
    """Faint welded plate seams and weathering, so the hull reads as steel and not a flat slab."""
    tree = mat.node_tree
    bsdf = _principled(mat)
    coord = tree.nodes.new("ShaderNodeTexCoord")
    bricks = tree.nodes.new("ShaderNodeTexBrick")
    bricks.inputs["Scale"].default_value = 1.0
    bricks.inputs["Mortar Size"].default_value = 0.006
    bricks.inputs["Brick Width"].default_value = 0.42
    bricks.inputs["Row Height"].default_value = 0.17
    bricks.inputs["Color1"].default_value = (0, 0, 0, 1)
    bricks.inputs["Color2"].default_value = (0, 0, 0, 1)
    bricks.inputs["Mortar"].default_value = (1, 1, 1, 1)
    swizzle = tree.nodes.new("ShaderNodeMapping")
    swizzle.inputs["Rotation"].default_value = (math.radians(90), 0, 0)
    noise = tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 9.0
    noise.inputs["Detail"].default_value = 8.0
    worn = tree.nodes.new("ShaderNodeMapRange")
    worn.inputs["From Min"].default_value = 0.35
    worn.inputs["From Max"].default_value = 0.65
    worn.inputs["To Min"].default_value = 0.35
    worn.inputs["To Max"].default_value = 0.8
    bump = tree.nodes.new("ShaderNodeBump")
    bump.invert = True
    bump.inputs["Strength"].default_value = 0.5
    bump.inputs["Distance"].default_value = 0.01
    tree.links.new(coord.outputs["Object"], swizzle.inputs["Vector"])
    tree.links.new(swizzle.outputs["Vector"], bricks.inputs["Vector"])
    tree.links.new(bricks.outputs["Fac"], bump.inputs["Height"])
    tree.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    tree.links.new(coord.outputs["Object"], noise.inputs["Vector"])
    tree.links.new(noise.outputs["Fac"], worn.inputs["Value"])
    tree.links.new(worn.outputs["Result"], bsdf.inputs["Roughness"])


def _faint_light_material(name, tokens, strength, top, bottom):
    """Faint unlit light that fades out with depth (shafts, specks)."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    tree.nodes.clear()
    geometry = tree.nodes.new("ShaderNodeNewGeometry")
    split = tree.nodes.new("ShaderNodeSeparateXYZ")
    fade = tree.nodes.new("ShaderNodeMapRange")
    fade.inputs["From Min"].default_value = top
    fade.inputs["From Max"].default_value = bottom
    emit = tree.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = color(tokens["colors"]["env"]["light"])
    emit.inputs["Strength"].default_value = strength
    clear = tree.nodes.new("ShaderNodeBsdfTransparent")
    add = tree.nodes.new("ShaderNodeAddShader")
    mix = tree.nodes.new("ShaderNodeMixShader")
    output = tree.nodes.new("ShaderNodeOutputMaterial")
    tree.links.new(geometry.outputs["Position"], split.inputs[0])
    tree.links.new(split.outputs["Z"], fade.inputs["Value"])
    tree.links.new(emit.outputs[0], add.inputs[0])
    tree.links.new(clear.outputs[0], add.inputs[1])
    tree.links.new(fade.outputs["Result"], mix.inputs[0])
    tree.links.new(add.outputs[0], mix.inputs[1])
    tree.links.new(clear.outputs[0], mix.inputs[2])
    tree.links.new(mix.outputs[0], output.inputs["Surface"])
    return mat


def _underwater(scene, tokens, level, cut):
    """Slanted light shafts and drifting specks, so the water below the cut has depth."""
    coll = bpy.data.collections.new("world-underwater")
    scene.collection.children.link(coll)
    rng = random.Random(26)

    verts, faces = [], []
    for x, width in ((-1.9, 0.5), (-1.0, 0.28), (-0.3, 0.42), (0.55, 0.3), (1.3, 0.55), (2.1, 0.35)):
        y = rng.uniform(1.5, 4.0)
        lean, depth = 0.55, 3.2
        i = len(verts)
        verts += [
            (x, y, level - 0.02),
            (x + width, y, level - 0.02),
            (x + width * 1.5 - lean * depth, y, level - depth),
            (x - lean * depth, y, level - depth),
        ]
        faces.append((i, i + 1, i + 2, i + 3))
    mesh = bpy.data.meshes.new("shafts")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    shafts = bpy.data.objects.new("shafts", mesh)
    coll.objects.link(shafts)
    mesh.materials.append(_faint_light_material("shafts", tokens, 0.22, level, level - 2.4))

    verts, faces = [], []
    for _ in range(420):
        x, y = rng.uniform(-3.5, 3.5), rng.uniform(cut + 0.1, 5.0)
        z = level - rng.uniform(0.06, 2.6)
        r = rng.uniform(0.002, 0.007)
        i = len(verts)
        verts += [(x - r, y, z), (x + r, y, z), (x, y, z + r * 1.7)]
        faces.append((i, i + 1, i + 2))
    mesh = bpy.data.meshes.new("specks")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    specks = bpy.data.objects.new("specks", mesh)
    coll.objects.link(specks)
    mesh.materials.append(_faint_light_material("specks", tokens, 1.6, level, level - 2.6))


def _soften_glow(scene):
    node = next((n for n in scene.node_tree.nodes if n.type == "GLARE"), None) if scene.node_tree else None
    if node:
        node.inputs["Threshold"].default_value = GLOW_THRESHOLD


def _edge_lineset(scene, coll, tokens):
    """The cut edge is drawn as one soft Freestyle line: it traces the wave profile."""
    settings = scene.view_layers[0].freestyle_settings
    lineset = settings.linesets.new("lines-seaedge")
    lineset.select_by_visibility = True
    lineset.visibility = "VISIBLE"
    lineset.select_by_edge_types = True
    lineset.select_silhouette = False
    lineset.select_crease = False
    lineset.select_border = True
    lineset.select_by_collection = True
    lineset.collection = coll
    style = lineset.linestyle
    style.color = color_srgb(tokens["colors"]["soft"])
    style.thickness = tokens["lines"]["soft"]
    style.caps = "ROUND"


def build_sea(scene, tokens, parts):
    """Builds the world around the model. Call after the Clip exists (it adds a lineset).
    Returns {"level", "cut", "keys": [water key blocks' owners]}."""
    level = parts["waterline"]["base"].z
    # Just in front of the hull, so the water band crossing the hull stays thin.
    hull = parts["hull"]["objects"][0]
    cut = min((hull.matrix_world @ v.co).y for v in hull.data.vertices) - CUT_GAP

    scene.render.film_transparent = False
    _sky(scene, tokens)
    _sun(tokens)
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = True

    bow = Profile(parts["bowwave"]["objects"], level)
    bulb = Profile(parts["bulbwave"]["objects"], level)

    def wave(profile):
        def fn(x, y):
            d = max(abs(y) - abs(cut), 0.0)
            return profile.at(x + WAKE_SLANT * d) * math.exp(-d / WAKE_DECAY)

        return fn

    keys = {"bow": wave(bow), "bulb": wave(bulb)}

    def base(x, y):
        return level + _swell(x, y)

    xs = _axis_x()
    ys = [cut + FAR_Y * (j / NY) ** 2.4 for j in range(NY + 1)]
    coll = bpy.data.collections.new("world-sea")
    scene.collection.children.link(coll)

    water, uv = _grid_mesh("sea", xs, ys, base)
    coll.objects.link(water)
    water.data.materials.append(_water_material(tokens))
    _add_keys(water, uv, base, keys)

    # A one-row strip along the cut, with the same keys, whose border is the drawn edge.
    near_xs = [x for x in xs if -FAR_X * 0.4 < x < FAR_X * 0.4]
    edge_coll = bpy.data.collections.new("world-seaedge")
    scene.collection.children.link(edge_coll)
    edge, edge_uv = _grid_mesh("sea-edge", near_xs, [cut, cut + 0.0005], base)
    edge_coll.objects.link(edge)
    hidden = bpy.data.materials.new("sea-edge")
    hidden.use_nodes = True
    tree = hidden.node_tree
    tree.nodes.clear()
    clear = tree.nodes.new("ShaderNodeBsdfTransparent")
    output = tree.nodes.new("ShaderNodeOutputMaterial")
    tree.links.new(clear.outputs[0], output.inputs["Surface"])
    edge.data.materials.append(hidden)
    _add_keys(edge, edge_uv, base, keys)
    _edge_lineset(scene, edge_coll, tokens)

    for part in ("hull", "bulb"):
        _submerge(parts[part]["mat"], level, tokens)
    _plating(parts["hull"]["mat"])
    _underwater(scene, tokens, level, cut)
    _soften_glow(scene)
    for obj in parts["waterline"]["objects"]:
        obj.hide_render = True  # the real water surface replaces the drawn waterline

    return {"level": level, "cut": cut, "meshes": [water, edge]}


def set_waves(sea, bow, bulb):
    for obj in sea["meshes"]:
        blocks = obj.data.shape_keys.key_blocks
        blocks["bow"].value = bow
        blocks["bulb"].value = bulb


def wave_lines_to_cut(parts, sea):
    """Moves the wave tubes onto the section, so both profiles read in front of the water."""
    for name in ("bowwave", "bulbwave"):
        pivot = parts[name]["pivot"]
        # Flatten onto one plane: the tubes curve with the hull and would cross the cut.
        pivot.scale.y = 0.001
        pivot.location.y = sea["cut"] - SECTION_GAP
