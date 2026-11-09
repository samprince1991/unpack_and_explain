"""The `sea` world: sky, a low warm sun, and a sea cut in section along the ship's side,
so one picture shows the surface above the cut edge and the hull and bulb below it, with no
transparent water to render. The wave shapes are sampled from the model's own wave tubes
and stored as shape keys, which add linearly: the surface is the literal sum of the waves.
A schematic illustration, not a fluid simulation."""

import bisect
import math
import sys

import bpy
from mathutils import Vector

from build import interpolation

from common import color, color_srgb

NEAR_X = (-2.2, 1.6)  # fine grid around the bow
FAR_X = 70.0
FAR_Y = 90.0
NX_NEAR, NX_FAR, NY = 260, 28, 200
CUT_GAP = 0.02
LENS = 30  # wider than the band clips' 50 mm: closer camera, a more monumental ship
PUSH = 1.1  # slow push-in, as in build.py
FRAME_Y = 0.42  # default screen height of the focus: above the captions
WAKE_SLANT = 0.55  # the waves trail aft with distance from the hull (a V-shaped wake)
WAKE_DECAY = 1.1
FADE_NEAR, FADE_FAR = 7.0, 38.0  # the water dissolves into the sky toward the horizon
EDGE_OFFSET = 0.004  # the drawn edge sits just in front of the water, so it never fights it
TUBE_SIDES, TUBE_THIN = 16, 0.4  # the wave tubes thin down until their outlines merge into one line
# Travelling swell: amplitude, x and y wave numbers, phase, radians per second.
SWELLS = [(0.010, 2.1, 1.3, 0.0, 0.9), (0.007, 3.7, -2.3, 1.0, 1.3), (0.004, 7.1, 4.9, 2.0, 2.0)]
BUMP_DRIFT = 0.012  # ripple texture drift per frame
SUN_DIR = (0.2, 0.95, 0.13)  # toward the sun: low, ahead of the camera, off the bow


def _principled(mat):
    return next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def _swell_keys():
    """Each swell is two shape keys in quadrature, so keying them cos / sin makes it travel."""
    keys = {}
    for i, (amp, kx, ky, phase, _rate) in enumerate(SWELLS):
        keys[f"swell{i}s"] = lambda x, y, a=amp, u=kx, v=ky, p=phase: a * math.sin(u * x + v * y + p)
        keys[f"swell{i}c"] = lambda x, y, a=amp, u=kx, v=ky, p=phase: a * math.cos(u * x + v * y + p)
    return keys


def _cut_profile(hull, level):
    """The cut follows the hull's waterline, so no water band crosses the hull. Returns cut(x)."""
    bins = {}
    for v in hull.data.vertices:
        co = hull.matrix_world @ v.co
        if abs(co.z - level) < 0.06:
            k = round(co.x / 0.03)
            bins[k] = max(bins.get(k, 0.0), abs(co.y))
    keys = sorted(bins)
    xs = [k * 0.03 for k in keys]
    beams = [
        sum(bins[n] for n in keys[max(i - 2, 0) : i + 3]) / len(keys[max(i - 2, 0) : i + 3])
        for i in range(len(keys))
    ]

    def cut(x):
        if x <= xs[0]:
            beam = beams[0]
        elif x >= xs[-1]:
            beam = 0.0
        else:
            i = bisect.bisect_right(xs, x)
            f = (x - xs[i - 1]) / (xs[i] - xs[i - 1])
            beam = beams[i - 1] * (1 - f) + beams[i] * f
        return -(beam + CUT_GAP)

    return cut


class Profile:
    """Wave height over world x, read from a wave tube's ring centers (relative to the sea level)."""

    def __init__(self, objects, level):
        points = []
        for obj in objects:
            verts = obj.data.vertices
            for start in range(0, len(verts), TUBE_SIDES):
                ring = [obj.matrix_world @ v.co for v in verts[start : start + TUBE_SIDES]]
                center = sum(ring, Vector()) / len(ring)
                points.append((center.x, center.z - level))
        points.sort()
        self.xs = [p[0] for p in points]
        self.zs = [p[1] for p in points]

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


def _grid_mesh(name, xs, rows, cut, level):
    """A quad grid starting at the cut; `rows` are y offsets from it. Returns (object, [(x, y)])."""
    verts, uv = [], []
    for row in rows:
        for x in xs:
            y = cut(x) + row
            verts.append((x, y, level))
            uv.append((x, y))
    nx = len(xs)
    faces = [
        (j * nx + i, j * nx + i + 1, (j + 1) * nx + i + 1, (j + 1) * nx + i)
        for j in range(len(rows) - 1)
        for i in range(nx - 1)
    ]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    mesh.shade_smooth()
    return bpy.data.objects.new(name, mesh), uv


def _add_keys(obj, uv, level, fns):
    obj.shape_key_add(name="Basis", from_mix=False)
    for name, fn in fns.items():
        key = obj.shape_key_add(name=name, from_mix=False)
        key.slider_min = -1.0
        for i, (x, y) in enumerate(uv):
            key.data[i].co.z = level + fn(x, y)


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
    drift = tree.nodes.new("ShaderNodeMapping")
    drift.name = "ripple-drift"
    tree.links.new(coord.outputs["Object"], drift.inputs["Vector"])
    tree.links.new(drift.outputs["Vector"], noise.inputs["Vector"])
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
    data.specular_factor = 0.06  # a soft glint road: the amber stays the brightest thing
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


def _rounded_glow(mat, tokens):
    """Emission falls off toward the silhouette, so the amber part reads as round and not flat."""
    tree = mat.node_tree
    bsdf = _principled(mat)
    amber = color(tokens["colors"]["amber"])
    weight = tree.nodes.new("ShaderNodeLayerWeight")
    weight.inputs["Blend"].default_value = 0.35
    mix = tree.nodes.new("ShaderNodeMixRGB")
    mix.inputs["Color1"].default_value = amber
    mix.inputs["Color2"].default_value = (amber[0] * 0.5, amber[1] * 0.5, amber[2] * 0.5, 1.0)
    tree.links.new(weight.outputs["Facing"], mix.inputs["Fac"])
    tree.links.new(mix.outputs[0], bsdf.inputs["Emission Color"])


def _thin_tubes(parts):
    """Thins each wave tube ring by ring, about its own center."""
    for name in ("bowwave", "bulbwave"):
        for obj in parts[name]["objects"]:
            verts = obj.data.vertices
            if len(verts) % TUBE_SIDES:
                print(f"[sea] {name}: unexpected vertex count {len(verts)}, not thinned")
                continue
            for start in range(0, len(verts), TUBE_SIDES):
                ring = verts[start : start + TUBE_SIDES]
                center = sum((v.co for v in ring), Vector()) / TUBE_SIDES
                for v in ring:
                    v.co = center + (v.co - center) * TUBE_THIN
            obj.data.update()


def build_sea(scene, tokens, parts, flat_cut=False):
    """Builds the world around the model. Call after the Clip exists (it adds a lineset)."""
    level = parts["waterline"]["base"].z
    hull_cut = _cut_profile(parts["hull"]["objects"][0], level)
    cut = (lambda _x: hull_cut(0.0)) if flat_cut else hull_cut

    scene.render.film_transparent = False
    _sky(scene, tokens)
    _sun(tokens)
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = True

    bow = Profile(parts["bowwave"]["objects"], level)
    bulb = Profile(parts["bulbwave"]["objects"], level)

    def wave(profile):
        def fn(x, y):
            d = max(abs(y) - abs(cut(x)), 0.0)
            return profile.at(x + WAKE_SLANT * d) * math.exp(-d / WAKE_DECAY)

        return fn

    keys = {"bow": wave(bow), "bulb": wave(bulb), **_swell_keys()}

    xs = _axis_x()
    rows = [FAR_Y * (j / NY) ** 2.4 for j in range(NY + 1)]
    coll = bpy.data.collections.new("world-sea")
    scene.collection.children.link(coll)

    water, uv = _grid_mesh("sea", xs, rows, cut, level)
    coll.objects.link(water)
    material = _water_material(tokens)
    water.data.materials.append(material)
    _add_keys(water, uv, level, keys)

    # A one-row strip along the cut, with the same keys, whose border is the drawn edge.
    near_xs = [x for x in xs if abs(x) < FAR_X * 0.4]
    edge_coll = bpy.data.collections.new("world-seaedge")
    scene.collection.children.link(edge_coll)
    edge, edge_uv = _grid_mesh("sea-edge", near_xs, [-EDGE_OFFSET, -EDGE_OFFSET + 0.0005], cut, level)
    edge_coll.objects.link(edge)
    hidden = bpy.data.materials.new("sea-edge")
    hidden.use_nodes = True
    tree = hidden.node_tree
    tree.nodes.clear()
    clear = tree.nodes.new("ShaderNodeBsdfTransparent")
    output = tree.nodes.new("ShaderNodeOutputMaterial")
    tree.links.new(clear.outputs[0], output.inputs["Surface"])
    edge.data.materials.append(hidden)
    _add_keys(edge, edge_uv, level, keys)
    _edge_lineset(scene, edge_coll, tokens)

    for part in ("hull", "bulb"):
        _submerge(parts[part]["mat"], level, tokens)
    _plating(parts["hull"]["mat"])
    _rounded_glow(parts["bulb"]["mat"], tokens)
    _thin_tubes(parts)
    for part in parts["waterline"]["objects"]:
        part.hide_render = True  # the real water surface replaces the drawn waterline

    sea = {"level": level, "meshes": [water, edge], "material": material, "module": sys.modules[__name__]}
    set_swell(sea, 0.0)
    return sea


def set_waves(sea, bow, bulb, frame=None):
    for obj in sea["meshes"]:
        blocks = obj.data.shape_keys.key_blocks
        blocks["bow"].value = bow
        blocks["bulb"].value = bulb
        if frame is not None:
            blocks["bow"].keyframe_insert("value", frame=frame)
            blocks["bulb"].keyframe_insert("value", frame=frame)


def set_swell(sea, seconds, frame=None):
    for obj in sea["meshes"]:
        blocks = obj.data.shape_keys.key_blocks
        for i, (_amp, _kx, _ky, _phase, rate) in enumerate(SWELLS):
            blocks[f"swell{i}s"].value = math.cos(rate * seconds)
            blocks[f"swell{i}c"].value = math.sin(rate * seconds)
            if frame is not None:
                blocks[f"swell{i}s"].keyframe_insert("value", frame=frame)
                blocks[f"swell{i}c"].keyframe_insert("value", frame=frame)


def animate_ambient(sea, frames, fps):
    """The swell travels and the ripples drift for the whole clip."""
    with interpolation("LINEAR"):
        for f in range(frames + 1):
            set_swell(sea, f / fps, frame=f)
        socket = sea["material"].node_tree.nodes["ripple-drift"].inputs["Location"]
        for f in (0, frames):
            socket.default_value = (BUMP_DRIFT * f, BUMP_DRIFT * f * 0.5, 0.0)
            socket.keyframe_insert("default_value", frame=f)


def show_edge(sea, visible, frame):
    """The drawn cut edge steps aside while the wave lines are up: it would double the bow wave."""
    edge = sea["meshes"][1]
    with interpolation("CONSTANT"):
        edge.hide_render = not visible
        edge.keyframe_insert("hide_render", frame=frame)


def settle(sea, start, end):
    """The bulb's wave adds to the bow wave and the surface flattens (partly: they don't fully cancel)."""
    set_waves(sea, 1.0, 0.0, frame=start)
    set_waves(sea, 1.0, 1.0, frame=end)


def build_clip_world(scene, tokens, parts, camera_object, clip, fps):
    """The whole world for one clip: sea, water state, lens and framing. Returns the sea."""
    start = clip["start"]
    backdrop = clip["id"] == "backdrop"
    sea = build_sea(scene, tokens, parts, flat_cut=backdrop)
    set_waves(sea, 1.0, 0.0 if start.get("sea") == "bowWave" else 1.0, frame=0)
    if clip["frames"] > 1:
        animate_ambient(sea, clip["frames"], fps)

    camera = camera_object.data
    camera.animation_data_clear()  # the band clips' 50 mm push-in
    with interpolation("LINEAR"):
        camera.lens = LENS
        camera.keyframe_insert("lens", frame=0)
        camera.lens = LENS * (PUSH if clip["frames"] > 1 else 1)
        camera.keyframe_insert("lens", frame=max(clip["frames"], 1))
    # Shift is a fraction of the (horizontal) sensor width: negative lifts the focus up the frame.
    camera.shift_y = (start.get("frameY", FRAME_Y) - 0.5) * clip["height"] / clip["width"]

    # Nothing sits in front of the wave lines, and Freestyle's occlusion hides long stretches
    # of a line near where the two cross.
    settings = scene.view_layers[0].freestyle_settings
    for name in ("bowwave", "bulbwave"):
        settings.linesets[f"lines-{name}"].select_by_visibility = False

    show_edge(sea, not backdrop, 0)  # the backdrop sits behind 2D drawings with their own water line
    if backdrop:
        for info in parts.values():
            for obj in info["objects"]:
                obj.hide_render = True
    return sea
