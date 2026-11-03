"""Geometry QC for catalog models: catches the shapes that render as broken or stray
lines in look A before anything is rendered. Runs inside `npm run blender` (every clip)
and `npm run model:add` / `npm run model:qc`.

  blender -b --factory-startup --python blender/qc.py -- <model.glb> [<model.json>]

Checks (look A draws Freestyle silhouettes, borders and creases):

1. CREASE BAND (error). Freestyle draws a crease where face normals differ by more than
   40 degrees (look.CREASE_DEG = 140). On connected surfaces:
   - 28-52 degrees, NEAR THE THRESHOLD: some edges of a ring draw and some don't, which
     reads as a dashed, broken line (single 45-degree chamfers, coarse curves).
   - 52-80 degrees, FACETED: every facet draws a line, so round things (wires, rings)
     look like stacked sticks. Allowed only for parts listed in the model's `hardEdges`
     (flat blades, boxes: edges that really are sharp).
   Fix: more segments on curves (each step under ~25 degrees), real rounding instead of
   chamfers. 80 degrees or more is an intended hard edge (a cut end) and passes.
2. PART CONTACT (error when rendering, warning in model:add). Freestyle draws no line
   where two surfaces cross or touch, so an outline just stops (a cable running into a
   ramp, a part sunk into another). Fix: make the junction draw its own line (a collar,
   a flange, a visible gap) and list the pair in the model's `contacts` in
   video/src/brand/models.ts, or move the parts apart.

Prints a report and exits 1 on errors.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils.bvhtree import BVHTree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BAND_LO = 28  # degrees between face normals: below this a curve reads smooth
BAND_MID = 52  # 28-52: near the 40-degree crease threshold, lines break up
BAND_HI = 80  # 52-80: faceted; at or above: an intended hard edge
MIN_AREA = 1e-8


def _crease_band(obj):
    """Edges on connected surfaces: (near-threshold count, faceted count, worst angle)."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.normal_update()
    near, faceted, worst = 0, 0, 0.0
    for edge in bm.edges:
        faces = edge.link_faces
        if len(faces) != 2 or faces[0].calc_area() < MIN_AREA or faces[1].calc_area() < MIN_AREA:
            continue
        angle = math.degrees(faces[0].normal.angle(faces[1].normal, 0.0))
        if BAND_LO <= angle < BAND_MID:
            near += 1
        elif BAND_MID <= angle < BAND_HI:
            faceted += 1
        else:
            continue
        worst = max(worst, angle)
    bm.free()
    return near, faceted, worst


def _bvh(objs):
    verts, polys = [], []
    for obj in objs:
        mw = obj.matrix_world
        base = len(verts)
        verts.extend(mw @ v.co for v in obj.data.vertices)
        polys.extend([base + i for i in p.vertices] for p in obj.data.polygons)
    return BVHTree.FromPolygons(verts, polys, epsilon=0.0)


def _part_of(model):
    lookup = {}
    for part, names in (model or {}).get("parts", {}).items():
        for name in names:
            lookup[name] = part
    return lambda obj: lookup.get(obj.name) or lookup.get(obj.name.split(".")[0]) or obj.name


def check(meshes, model=None):
    """Returns (errors, warnings) as lists of strings. `model` is the catalog entry
    (parts, contacts, hardEdges); without one each object is its own part and contacts
    only warn (model:add, before the catalog entry exists)."""
    errors, warnings = [], []
    part_of = _part_of(model)

    hard = set((model or {}).get("hardEdges", []))
    for obj in meshes:
        part = part_of(obj)
        near, faceted, worst = _crease_band(obj)
        if near:
            errors.append(
                f"crease band: {obj.name} ({part}) has {near} edges bending {BAND_LO}-{BAND_MID} deg, "
                "near the crease threshold: they draw as broken, dashed lines. Round the profile "
                "or add segments (steps under ~25 deg)."
            )
        if faceted and part not in hard:
            errors.append(
                f"crease band: {obj.name} ({part}) has {faceted} edges bending {BAND_MID}-{BAND_HI} deg "
                f"(worst {worst:.0f}): every facet draws a line, so it looks faceted. Add segments, "
                f'or list "{part}" in the model\'s `hardEdges` if those edges really are sharp.'
            )

    groups = {}
    for obj in meshes:
        groups.setdefault(part_of(obj), []).append(obj)
    allowed = {frozenset(pair) for pair in (model or {}).get("contacts", [])}
    trees = {part: _bvh(objs) for part, objs in groups.items()}
    names = sorted(trees)
    for i, a in enumerate(names):
        for b in names[i + 1 :]:
            if frozenset((a, b)) in allowed:
                continue
            if trees[a].overlap(trees[b]):
                msg = (
                    f"part contact: {a} and {b} touch or cross. Freestyle draws no line there, so "
                    "the outline stops. Give the junction its own line (collar, flange, gap) and "
                    f'list ["{a}", "{b}"] in the model\'s `contacts`, or move them apart.'
                )
                (errors if model and model.get("parts") else warnings).append(msg)
    return errors, warnings


def report(errors, warnings, label):
    for w in warnings:
        print(f"[qc] WARN  {label}: {w}")
    for e in errors:
        print(f"[qc] ERROR {label}: {e}")
    if not errors and not warnings:
        print(f"[qc] {label}: geometry OK")


def main():
    import json

    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if not args:
        raise SystemExit("Usage: blender -b --python blender/qc.py -- <model.glb> [<model.json>]")
    model = None
    if len(args) > 1:
        with open(args[1], encoding="utf-8") as f:
            model = json.load(f)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=args[0])
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    errors, warnings = check(meshes, model)
    report(errors, warnings, os.path.basename(args[0]))
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
