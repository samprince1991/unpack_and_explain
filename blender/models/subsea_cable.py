"""Procedural deep-sea fiber cable (our own model, license "own"), axis along X.

Stepped cutaway at +X: each inner layer sticks out further than the one around it, so
the layers read from outside in (jacket > steel armour > copper > tube > fibers). The
layers are hollow tubes nested with small gaps (no part crosses another, see
blender/qc.py). A repeater housing sits on the cable, and the cable runs into a sea wall
at -X through a flange collar. Objects are named after the catalog parts in
video/src/brand/models.ts.

Every curve is segmented finely enough that no edge bends 28-80 degrees (Freestyle would
draw facets or broken lines there); corners that should read as lines are 90 degrees.

  blender -b --factory-startup --python blender/models/subsea_cable.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

SEG = 48  # around the cable: 7.5 degrees a step
TUBE_SIDES = 16  # wires and fibers: 22.5 degrees a step

WALL = -1.75  # sea wall face; the cable starts just in front of it
START = WALL + 0.003
JACKET_END = 0.35
ARMOUR_END = 0.7
COPPER_END = 1.0
TUBE_END = 1.28
FIBER_END = 1.62

# radii (outer, inner), nested with gaps so layers never touch
JACKET = (0.2, 0.192)
ARMOUR_R, WIRE_R = 0.16, 0.028  # wires span 0.132-0.188
COPPER = (0.12, 0.09)
TUBE = (0.075, 0.058)
FIBER_R, FIBER_SPREAD = 0.009, 0.03  # inside the tube: up to 0.039


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


def revolve(bm, profile, closed, seg=SEG):
    """Revolve (x, r) points around the X axis. `closed` joins the last point back to
    the first (a solid ring section); otherwise the ends stay open."""
    rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        rings.append([bm.verts.new((x, r * math.cos(a), r * math.sin(a))) for x, r in profile])
    n = len(profile)
    spans = n if closed else n - 1
    for s in range(seg):
        ra, rb = rings[s], rings[(s + 1) % seg]
        for i in range(spans):
            j = (i + 1) % n
            bm.faces.new((ra[i], ra[j], rb[j], rb[i]))


def hollow_tube(bm, x0, x1, outer, inner):
    """A tube wall with square-cut ends (the cut rims draw as clean lines)."""
    revolve(bm, [(x0, inner), (x0, outer), (x1, outer), (x1, inner)], closed=True)


def tube_along(bm, points, radius, sides=TUBE_SIDES):
    """Round tube through (x, y, z) points, flat-capped (the cap rim is a 90-degree edge)."""
    rings = []
    for k, p in enumerate(points):
        q = points[min(k + 1, len(points) - 1)]
        o = points[max(k - 1, 0)]
        t = [q[i] - o[i] for i in range(3)]
        n = math.sqrt(sum(c * c for c in t)) or 1.0
        t = [c / n for c in t]
        up = (0.0, 0.0, 1.0) if abs(t[2]) < 0.9 else (0.0, 1.0, 0.0)
        u = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]
        un = math.sqrt(sum(c * c for c in u)) or 1.0
        u = [c / un for c in u]
        v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]
        ring = []
        for s in range(sides):
            a = 2 * math.pi * s / sides
            ring.append(bm.verts.new(tuple(p[i] + radius * (math.cos(a) * u[i] + math.sin(a) * v[i]) for i in range(3))))
        rings.append(ring)
    for k in range(len(rings) - 1):
        for s in range(sides):
            j = (s + 1) % sides
            bm.faces.new((rings[k][s], rings[k][j], rings[k + 1][j], rings[k + 1][s]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])


def s_curve(x0, r0, x1, r1, steps=12):
    """Smooth (cosine) transition from radius r0 at x0 to r1 at x1, endpoints included."""
    return [
        (x0 + (x1 - x0) * k / steps, r0 + (r1 - r0) * (1 - math.cos(math.pi * k / steps)) / 2)
        for k in range(steps + 1)
    ]


def build():
    bm = bmesh.new()
    hollow_tube(bm, START, JACKET_END, *JACKET)
    new_object("jacket", bm)

    # armour: steel wires wound around the copper (helix)
    bm = bmesh.new()
    wires, turns_per_unit = 14, 0.45
    for w in range(wires):
        a0 = 2 * math.pi * w / wires
        pts = []
        steps = 80
        for s in range(steps + 1):
            # wire ends are cut square to the helix, so they tilt: start clear of the wall
            x = START + 0.04 + (ARMOUR_END - START - 0.04) * s / steps
            a = a0 + 2 * math.pi * turns_per_unit * (x - START)
            pts.append((x, ARMOUR_R * math.cos(a), ARMOUR_R * math.sin(a)))
        tube_along(bm, pts, WIRE_R)
    new_object("armour", bm)

    bm = bmesh.new()
    hollow_tube(bm, START, COPPER_END, *COPPER)
    new_object("copper", bm)

    bm = bmesh.new()
    hollow_tube(bm, START, TUBE_END, *TUBE)
    new_object("tube", bm)

    # fibers: 8 hair-thin glass fibers, splaying gently where they leave the tube
    bm = bmesh.new()
    for k in range(8):
        a = 2 * math.pi * k / 8
        pts = []
        steps = 24
        x0 = TUBE_END - 0.25
        for s in range(steps + 1):
            x = x0 + (FIBER_END - x0) * s / steps
            spread = FIBER_SPREAD + 0.06 * max(0.0, (x - TUBE_END) / (FIBER_END - TUBE_END)) ** 2
            pts.append((x, spread * math.cos(a), spread * math.sin(a)))
        tube_along(bm, pts, FIBER_R)
    new_object("fibers", bm)

    # repeater: open housing shell, its ends taper smoothly onto the cable (a hair off the
    # jacket, so they never touch); a square-stepped band in the middle reads as one line.
    bm = bmesh.new()
    lip, body = JACKET[0] + 0.003, 0.34
    band = [(-0.72, body), (-0.72, body + 0.015), (-0.66, body + 0.015), (-0.66, body)]
    profile = s_curve(-1.15, lip, -0.97, body) + band + s_curve(-0.43, body, -0.25, lip)
    revolve(bm, profile, closed=False)
    new_object("repeater", bm)

    # shore: a sea wall (profile in X-Z, extruded along Y) with a rounded top edge, and a
    # flange collar where the cable meets it, so the junction draws its own outline.
    bm = bmesh.new()
    back, floor, width = -2.45, -0.32, 0.6
    top_corner, arc_r = 0.32, 0.1
    pts = [(WALL, floor), (WALL, top_corner)]
    for k in range(1, 9):  # rounded top edge, 11.25 degrees a step
        t = (math.pi / 2) * k / 8
        pts.append((WALL - arc_r + arc_r * math.cos(t), top_corner + arc_r * math.sin(t)))
    rise_from = pts[-1]
    for k in range(1, 7):  # gentle rise inland
        f = k / 6
        pts.append((rise_from[0] + (back - rise_from[0]) * f, rise_from[1] + 0.2 * math.sin(f * math.pi / 2)))
    pts.append((back, floor))
    front = [bm.verts.new((x, -width, z)) for x, z in pts]
    rear = [bm.verts.new((x, width, z)) for x, z in pts]
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((front[i], front[j], rear[j], rear[i]))
    bm.faces.new(front[::-1])
    bm.faces.new(rear)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    flange = [(START, lip), (START, 0.27), (START + 0.035, 0.27), (START + 0.035, lip)]
    revolve(bm, flange, closed=True)
    new_object("shore", bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "subsea-cable.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[subsea_cable] wrote {out}")


main()
