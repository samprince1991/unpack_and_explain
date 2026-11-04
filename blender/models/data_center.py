"""Procedural data-center campus (our own model, license "own"), Z up, ground at z=0.

Three buildings on open ground: the main hall at the front with its roof and most of its front wall cut away (rows
of server racks inside, one key rack with a drive sled pulled out of its front), and two
closed sites further back, left and right ("copies in at least 3 buildings, kilometers
apart"). A fiber feed cable runs in from the front to the hall, and two link cables run
from the hall to the other sites. Objects are named after the catalog parts in
video/src/brand/models.ts.

Everything is boxes (90-degree edges) and 16-sided cables, so no edge falls in the
28-80 degree crease band (blender/qc.py). Parts never touch: racks float a hair above the
floor, cables stop short of the walls, roof units sit just above the roofs.

  blender -b --factory-startup --python blender/models/data_center.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

TUBE_SIDES = 16  # cables: 22.5 degrees a step
GAP = 0.004  # between parts that would otherwise touch

# main hall (open top)
HALL_X, HALL_Y, HALL_H = 0.7, 0.45, 0.42  # half width, half depth, wall height
WALL_T, FLOOR_T = 0.035, 0.03
FRONT_H = 0.1  # the cutaway front wall

# racks inside the hall
RACK_W, RACK_D, RACK_H = 0.13, 0.1, 0.28
RACK_COLS = [-0.5, -0.3, -0.1, 0.1, 0.3, 0.5]
RACK_ROWS = [-0.24, 0.0, 0.24]  # front row first (faces -Y, toward the feed)
KEY = (0.1, -0.24)  # the key rack: front row, right of center

# drive sled pulled out of the key rack's front face
DRIVE_W, DRIVE_D, DRIVE_H = 0.09, 0.075, 0.022
DRIVE_Z = FLOOR_T + GAP + 0.16

# the other two sites (closed buildings), centers and half sizes
SITES = {"site2": (1.6, 1.35), "site3": (-1.6, 1.35)}
SITE_X, SITE_Y, SITE_H = 0.42, 0.32, 0.36

CABLE_R, CABLE_Z = 0.022, 0.03
FEED_FROM = -1.7


def args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def new_object(name, bm):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def box(bm, x0, x1, y0, y1, z0, z1):
    """Axis-aligned box (all edges 90 degrees)."""
    v = [bm.verts.new((x, y, z)) for z in (z0, z1) for y in (y0, y1) for x in (x0, x1)]
    for f in ((0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)):
        bm.faces.new([v[i] for i in f])


def hall(bm):
    """Floor slab with walls and no roof. The front wall is cut low (a cutaway) so the
    racks and the drive read from the front; back and side walls are full height."""
    x, y, h, t, f = HALL_X, HALL_Y, HALL_H, WALL_T, FLOOR_T
    box(bm, -x, x, -y, y, 0.0, f)
    box(bm, -x, x, y - t, y, f, h)  # back
    for sx in (-1, 1):  # sides
        box(bm, min(sx * x, sx * (x - t)), max(sx * x, sx * (x - t)), -y, y - t, f, h)
    box(bm, -x + t, x - t, -y, -y + t, f, FRONT_H)  # front, cut low


def cable(bm, a, b, radius=CABLE_R, sides=TUBE_SIDES):
    """Straight round cable from a to b (x, y, z), flat-capped (the cap rim is a 90-degree edge)."""
    t = [b[i] - a[i] for i in range(3)]
    n = math.sqrt(sum(c * c for c in t))
    t = [c / n for c in t]
    up = (0.0, 0.0, 1.0)
    u = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]
    un = math.sqrt(sum(c * c for c in u))
    u = [c / un for c in u]
    v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]
    rings = []
    for p in (a, b):
        ring = []
        for s in range(sides):
            ang = 2 * math.pi * s / sides
            ring.append(bm.verts.new(tuple(p[i] + radius * (math.cos(ang) * u[i] + math.sin(ang) * v[i]) for i in range(3))))
        rings.append(ring)
    for s in range(sides):
        j = (s + 1) % sides
        bm.faces.new((rings[0][s], rings[0][j], rings[1][j], rings[1][s]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)


def rack_box(bm, cx, cy):
    z0 = FLOOR_T + GAP
    box(bm, cx - RACK_W / 2, cx + RACK_W / 2, cy - RACK_D / 2, cy + RACK_D / 2, z0, z0 + RACK_H)


def build():
    bm = bmesh.new()
    hall(bm)
    new_object("hall", bm)

    bm = bmesh.new()
    for cy in RACK_ROWS:
        for cx in RACK_COLS:
            if (cx, cy) != KEY:
                rack_box(bm, cx, cy)
    new_object("racks", bm)

    bm = bmesh.new()
    rack_box(bm, *KEY)
    new_object("rack", bm)

    # the drive sled sits just in front of the key rack, as if pulled out of a bay
    bm = bmesh.new()
    kx, ky = KEY
    front = ky - RACK_D / 2 - GAP
    box(bm, kx - DRIVE_W / 2, kx + DRIVE_W / 2, front - DRIVE_D, front, DRIVE_Z, DRIVE_Z + DRIVE_H)
    new_object("drive", bm)

    for name, (cx, cy) in SITES.items():
        bm = bmesh.new()
        box(bm, cx - SITE_X, cx + SITE_X, cy - SITE_Y, cy + SITE_Y, 0.0, SITE_H)
        # cooling units on the roof, a hair above it
        for dx in (-0.22, 0.0, 0.22):
            box(bm, cx + dx - 0.07, cx + dx + 0.07, cy - 0.1, cy + 0.1, SITE_H + GAP, SITE_H + GAP + 0.06)
        new_object(name, bm)

    # feed: the fiber cable coming in from the front, stopping short of the hall wall
    bm = bmesh.new()
    cable(bm, (kx, FEED_FROM, CABLE_Z), (kx, -HALL_Y - 0.02, CABLE_Z))
    new_object("feed", bm)

    # links: hall to each of the other sites, stopping short of both walls
    bm = bmesh.new()
    for cx, cy in SITES.values():
        sx = 1 if cx > 0 else -1
        a = (sx * (HALL_X + 0.02), 0.25, CABLE_Z)
        b = (cx - sx * (SITE_X + 0.02), cy - 0.15, CABLE_Z)
        cable(bm, a, b)
    new_object("links", bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "data-center.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[data_center] wrote {out}")


main()
