"""Look A, "lit line art": dark navy shaded surfaces, soft key + rim light, neutral
Freestyle lines on top, the one key part amber with a slight glow, light depth of
field, transparent background (Remotion draws the brand background behind)."""

import math

import bpy

from common import color, color_srgb, eevee_engine

EMISSION_ON = 0.22  # amber tint on the key part's surface; also the glow source
GLOW_STRENGTH = 2.5


def setup_render(scene, width, height, fps, frames, preview):
    scene.render.engine = eevee_engine()
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 25 if preview else 100
    scene.render.fps = fps
    scene.frame_start = 0
    scene.frame_end = max(0, frames - 1)
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    # Standard view transform keeps token colors exact (Filmic/AgX would shift them).
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    eevee = scene.eevee
    if hasattr(eevee, "taa_render_samples"):
        eevee.taa_render_samples = 8 if preview else 48
    scene.render.use_freestyle = True
    scene.render.line_thickness_mode = "ABSOLUTE"
    scene.render.line_thickness = 1.0


def setup_world(scene, tokens):
    world = bpy.data.worlds.new("brand-world")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = color(tokens["colors"]["bgRaised"])
    bg.inputs["Strength"].default_value = 0.6
    scene.world = world


def _light(name, kind, energy, location, rotation, size):
    data = bpy.data.lights.new(name, kind)
    data.energy = energy
    if kind == "AREA":
        data.size = size
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    obj.rotation_euler = rotation
    bpy.context.scene.collection.objects.link(obj)
    return obj


def setup_lights(radius):
    """Neutral white light only (no colored light: the token colors are the palette)."""
    r = max(radius, 0.5)
    _light("key", "AREA", 420 * r * r, (-2.5 * r, -3.5 * r, 3.5 * r), (math.radians(50), 0, math.radians(-35)), 3 * r)
    _light("rim", "AREA", 420 * r * r, (2.5 * r, 4 * r, 2.5 * r), (math.radians(-60), 0, math.radians(150)), 2 * r)
    _light("fill", "AREA", 60 * r * r, (3.5 * r, -2.5 * r, -1 * r), (math.radians(100), 0, math.radians(50)), 4 * r)


def part_material(name, tokens):
    """Per-part surface so the amber emission can be keyed per part."""
    mat = bpy.data.materials.new(f"surface-{name}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color(tokens["colors"]["fill"])
    bsdf.inputs["Roughness"].default_value = 0.55
    bsdf.inputs["Metallic"].default_value = 0.35
    emission_color = bsdf.inputs.get("Emission Color") or bsdf.inputs.get("Emission")
    emission_color.default_value = color(tokens["colors"]["amber"])
    bsdf.inputs["Emission Strength"].default_value = 0.0
    return mat


def emission_socket(mat):
    return mat.node_tree.nodes.get("Principled BSDF").inputs["Emission Strength"]


# Freestyle draws a crease line where the dihedral angle is below this (i.e. the two
# face normals differ by more than 180 - CREASE_DEG degrees). qc.py checks models against it.
CREASE_DEG = 140


def setup_freestyle(scene, collections, tokens):
    """One lineset per part collection, so each part's line color can be keyed amber.
    Returns {part: linestyle}."""
    settings = scene.view_layers[0].freestyle_settings
    settings.crease_angle = math.radians(CREASE_DEG)
    for ls in list(settings.linesets):
        settings.linesets.remove(ls)
    styles = {}
    for part, coll in collections.items():
        lineset = settings.linesets.new(f"lines-{part}")
        lineset.select_by_visibility = True
        lineset.visibility = "VISIBLE"
        lineset.select_by_edge_types = True
        lineset.select_silhouette = True
        lineset.select_border = True
        lineset.select_crease = True
        lineset.select_by_collection = True
        lineset.collection = coll
        style = lineset.linestyle
        style.name = f"style-{part}"
        role = "soft" if part == "rest" else "stroke"
        style.color = color_srgb(tokens["colors"][role])
        style.thickness = tokens["lines"][role]
        style.thickness_position = "CENTER"
        style.caps = "ROUND"
        styles[part] = style
    return styles


def setup_glow(scene):
    """Bloom from the emission pass only (the amber key part), added over the image and
    into alpha so it survives the transparent film. White lines never bloom.
    Skipped (with a note) if the compositor API differs."""
    try:
        scene.view_layers[0].use_pass_emit = True
        if hasattr(scene, "compositing_node_group"):
            try:
                _glow_tree_5x(scene)
            except Exception:
                scene.compositing_node_group = None  # a half-built tree would blank the image
                raise
        else:
            _glow_tree_4x(scene)
    except Exception as err:  # noqa: BLE001 - keep rendering without glow
        print(f"[look] glow skipped: {err}")


def _glow_tree_5x(scene):
    """Blender 5.0+: the compositor is a node group whose output is the final image;
    Mix/Math are shader nodes and many node options are input sockets."""
    tree = bpy.data.node_groups.new("brand-glow", "CompositorNodeTree")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    scene.compositing_node_group = tree
    layers = tree.nodes.new("CompositorNodeRLayers")
    glare = tree.nodes.new("CompositorNodeGlare")
    glare.inputs["Type"].default_value = "Bloom"
    glare.inputs["Threshold"].default_value = 0.0
    glare.inputs["Strength"].default_value = GLOW_STRENGTH
    glare.inputs["Size"].default_value = 0.6
    tree.links.new(layers.outputs["Emission"], glare.inputs["Image"])  # 5.0 renamed "Emit"
    glow = glare.outputs["Glare"]

    add = tree.nodes.new("ShaderNodeMix")
    add.data_type = "RGBA"
    add.blend_type = "ADD"
    add.inputs["Factor"].default_value = 1.0
    tree.links.new(layers.outputs["Image"], add.inputs["A"])
    tree.links.new(glow, add.inputs["B"])
    add_out = next(o for o in add.outputs if o.enabled and o.type == "RGBA")

    bw = tree.nodes.new("CompositorNodeRGBToBW")
    tree.links.new(glow, bw.inputs[0])
    alpha = tree.nodes.new("ShaderNodeMath")
    alpha.operation = "MAXIMUM"
    alpha.use_clamp = True
    tree.links.new(layers.outputs["Alpha"], alpha.inputs[0])
    tree.links.new(bw.outputs[0], alpha.inputs[1])

    set_alpha = tree.nodes.new("CompositorNodeSetAlpha")
    set_alpha.inputs["Type"].default_value = "Replace Alpha"
    tree.links.new(add_out, set_alpha.inputs["Image"])
    tree.links.new(alpha.outputs[0], set_alpha.inputs["Alpha"])
    out = tree.nodes.new("NodeGroupOutput")
    tree.links.new(set_alpha.outputs[0], out.inputs[0])


def _glow_tree_4x(scene):
    scene.use_nodes = True
    tree = scene.node_tree
    tree.nodes.clear()
    layers = tree.nodes.new("CompositorNodeRLayers")
    glare = tree.nodes.new("CompositorNodeGlare")
    glare.glare_type = "BLOOM"
    glare.inputs["Threshold"].default_value = 0.0
    glare.inputs["Strength"].default_value = GLOW_STRENGTH
    glare.inputs["Size"].default_value = 0.6
    tree.links.new(layers.outputs["Emit"], glare.inputs["Image"])
    glow = glare.outputs["Glare"]

    add = tree.nodes.new("CompositorNodeMixRGB")
    add.blend_type = "ADD"
    add.inputs["Fac"].default_value = 1.0
    tree.links.new(layers.outputs["Image"], add.inputs[1])
    tree.links.new(glow, add.inputs[2])

    bw = tree.nodes.new("CompositorNodeRGBToBW")
    tree.links.new(glow, bw.inputs[0])
    alpha = tree.nodes.new("CompositorNodeMath")
    alpha.operation = "MAXIMUM"
    alpha.use_clamp = True
    tree.links.new(layers.outputs["Alpha"], alpha.inputs[0])
    tree.links.new(bw.outputs[0], alpha.inputs[1])

    set_alpha = tree.nodes.new("CompositorNodeSetAlpha")
    set_alpha.mode = "REPLACE_ALPHA"
    tree.links.new(add.outputs[0], set_alpha.inputs["Image"])
    tree.links.new(alpha.outputs[0], set_alpha.inputs["Alpha"])
    out = tree.nodes.new("CompositorNodeComposite")
    tree.links.new(set_alpha.outputs[0], out.inputs["Image"])


def setup_dof(camera, target, fstop=5.6):
    camera.data.dof.use_dof = True
    camera.data.dof.focus_object = target
    camera.data.dof.aperture_fstop = fstop
