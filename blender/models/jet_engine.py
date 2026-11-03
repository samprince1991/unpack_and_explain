"""Procedural turbofan (our own model, license "own"), axis along X, intake at -X.
Cutaway casing (the top is open) so the inside reads. Objects are named after the
catalog parts in video/src/brand/models.ts.

  blender -b --factory-startup --python blender/models/jet_engine.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

SEG = 48


def args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def new_object(name, bm):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def lathe(bm, profile, a0=0.0, a1=2 * math.pi, seg=SEG, closed=False):
    """Revolve (x, r) points around the X axis between angles a0..a1. `closed` joins the
    last profile point back to the first (a ring section with no seam)."""
    full = abs((a1 - a0) - 2 * math.pi) < 1e-6
    steps = seg if full else max(2, int(seg * (a1 - a0) / (2 * math.pi)))
    rings = []
    for s in range(steps + (0 if full else 1)):
        a = a0 + (a1 - a0) * s / steps
        rings.append([bm.verts.new((x, r * math.cos(a), r * math.sin(a))) for x, r in profile])
    count = len(rings) if full else len(rings) - 1
    n = len(profile)
    for s in range(count):
        ra, rb = rings[s], rings[(s + 1) % len(rings)]
        for i in range(n if closed else n - 1):
            j = (i + 1) % n
            bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
    return rings


BLADE_SECTIONS = 8  # along the span, so twisted faces stay flat (no stray crease lines)


def blade_ring(bm, x, r0, r1, count, chord, thick, twist):
    """Flat twisted blades between radii r0..r1 at axial position x, built in sections
    along the span: one quad per side over the whole span would be bent, and its edge
    angles drift into the band where Freestyle draws broken lines (blender/qc.py)."""
    for k in range(count):
        a = 2 * math.pi * k / count
        ca, sa = math.cos(a), math.sin(a)
        sections = []
        for n in range(BLADE_SECTIONS + 1):
            r = r0 + (r1 - r0) * n / BLADE_SECTIONS
            t = math.radians(twist) * n / BLADE_SECTIONS + math.radians(30)
            ring = []
            for dx, dt in ((-chord / 2, -thick / 2), (chord / 2, -thick / 2), (chord / 2, thick / 2), (-chord / 2, thick / 2)):
                # rotate the blade section by t around the radial direction (a true
                # rotation: corners stay square, so blade edges draw as single lines)
                bx = x + dx * math.cos(t) - dt * math.sin(t)
                tangential = dx * math.sin(t) + dt * math.cos(t)
                y = r * ca - tangential * sa
                z = r * sa + tangential * ca
                ring.append(bm.verts.new((bx, y, z)))
            sections.append(ring)
        bm.faces.new(sections[0][::-1])
        bm.faces.new(sections[-1])
        for lo, hi in zip(sections, sections[1:]):
            for i in range(4):
                j = (i + 1) % 4
                bm.faces.new((lo[i], lo[j], hi[j], hi[i]))


def build():
    # spinner: nose cone
    bm = bmesh.new()
    lathe(bm, [(-2.05, 0.0), (-1.95, 0.12), (-1.8, 0.24), (-1.624, 0.3)])  # stops short of the fan hub
    new_object("spinner", bm)

    # fan: hub + 18 wide blades
    bm = bmesh.new()
    lathe(bm, [(-1.62, 0.3), (-1.45, 0.32)])
    blade_ring(bm, -1.53, 0.3, 1.02, 12, 0.24, 0.02, 35)
    new_object("fan", bm)

    # compressor: stepped drum + 5 smaller blade rows, narrowing
    bm = bmesh.new()
    lathe(bm, [(-1.35, 0.34), (-0.5, 0.4)])
    for i, x in enumerate((-1.2, -0.99, -0.78)):  # last row clear of the combustor
        blade_ring(bm, x, 0.36, 0.62 - i * 0.05, 12, 0.1, 0.015, 20)
    new_object("compressor", bm)

    # combustor: annular chamber (a fat ring)
    bm = bmesh.new()
    # 72 points (no repeated end point): fine enough that the tight ends of the ellipse
    # don't facet, and closed so there is no seam line.
    prof = [(-0.4 + 0.35 * math.cos(t) * 0.9, 0.5 + 0.1 * math.sin(t))
            for t in [2 * math.pi * k / 72 for k in range(72)]]
    lathe(bm, prof, closed=True)
    new_object("combustor", bm)

    # turbine: 3 rows
    bm = bmesh.new()
    lathe(bm, [(0.05, 0.36), (0.55, 0.34)])
    for i, x in enumerate((0.15, 0.42)):
        blade_ring(bm, x, 0.36, 0.58 + i * 0.05, 14, 0.1, 0.015, -25)
    new_object("turbine", bm)

    # nozzle: exhaust cone + tail cone
    bm = bmesh.new()
    lathe(bm, [(0.6, 0.66), (1.2, 0.5), (1.5, 0.44)])
    lathe(bm, [(0.6, 0.3), (1.1, 0.16), (1.35, 0.0)])
    new_object("nozzle", bm)

    # casing: nacelle shell with the top 120 degrees cut away
    bm = bmesh.new()
    lathe(bm, [(-1.75, 1.12), (-1.5, 1.16), (-0.6, 1.1), (0.2, 0.86), (0.6, 0.72)],
          a0=math.radians(150), a1=math.radians(390), seg=64)
    new_object("casing", bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "jet-engine.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[jet_engine] wrote {out}")


main()
