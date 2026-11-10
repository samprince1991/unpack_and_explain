"""Procedural lost-wax casting set for a gold ring (our own model, license "own"). Z is up,
the bench is z = 0, the camera looks from -y. Objects are named after the catalog parts in
video/src/brand/models.ts.

  blender -b --factory-startup --python blender/models/gold_casting.py -- <out.glb>

Left to right along X:
  crucible + grains (gold, copper and silver beads) + melt (the molten pool, appearOnly)
  ring: the finished gold ring, standing face-on to the camera, front and center
  waxring (the wax copy, standing on the bench, with a wax stick on top), buried by a
  plaster block in two halves (plasterback, plasterfront); hollow (the ring-shaped hole and
  its channel on the back half's face) and cast (the gold ring and stick that fill it).
  melt, plasterback, plasterfront, hollow and cast are appearOnly.

`melt` scales in over the grains and swallows them; `cast` sits exactly where `waxring` is
(the wax and the front plaster half leave as explode `away` parts before the gold appears).
Neither pair is ever seen crossing, so both are listed in the catalog's `contacts`.

Curves step well under 25 degrees (blender/qc.py): rings and lathes use 96 segments, round
corners 6+ steps. Every part stands a small gap clear of its neighbours.
"""

import math
import os
import sys

import bmesh
import bpy

SEG = 96
TIP = 0.0005  # lathe profiles end almost on the axis, never exactly on it
GAP = 0.005

# Ring band (shared by ring, waxring and cast): radii in the ring's plane, width along y.
RING_IN, RING_OUT, RING_W, RING_CORNER = 0.13, 0.165, 0.075, 0.012

CRUCIBLE_X = -1.05
CAST_X = 1.05
PLASTER_R, PLASTER_TOP = 0.3, 0.56
SPRUE_TOP = PLASTER_TOP - 0.006  # the wax stick ends just under the plaster's top
PLASTER_FACE_Y = RING_W / 2 + 0.01  # each plaster half's flat face, just clear of the ring


def args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def new_object(name, bm, smooth=True):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = smooth
    return obj


def arc(cx, cy, r, a0, a1, steps):
    """Points on an arc, angles in degrees, both ends included."""
    return [
        (cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / steps)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / steps)))
        for i in range(steps + 1)
    ]


def lathe_z(bm, profile, center=(0.0, 0.0), seg=SEG, closed=False):
    """Revolves (r, z) points around a vertical axis at `center`. `closed` joins the last
    profile point back to the first (a loop that never reaches the axis)."""
    rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        rings.append([bm.verts.new((center[0] + r * math.cos(a), center[1] + r * math.sin(a), z)) for r, z in profile])
    n = len(profile)
    edges = n if closed else n - 1
    for s in range(seg):
        ra, rb = rings[s], rings[(s + 1) % seg]
        for i in range(edges):
            j = (i + 1) % n
            bm.faces.new((ra[i], rb[i], rb[j], ra[j]))
    if not closed:
        bm.faces.new([ring[0] for ring in rings][::-1])
        bm.faces.new([ring[-1] for ring in rings])


def band_profile():
    """Closed cross-section of the ring band, (radius, y): a rounded rectangle, no repeated
    end point."""
    c = RING_CORNER
    h = RING_W / 2
    pts = []
    pts += arc(RING_OUT - c, -h + c, c, -90, 0, 6)
    pts += arc(RING_OUT - c, h - c, c, 0, 90, 6)
    pts += arc(RING_IN + c, h - c, c, 90, 180, 6)
    pts += arc(RING_IN + c, -h + c, c, 180, 270, 6)
    # The arcs meet across straight sides, so every point is distinct.
    return pts


def ring_object(name, cx, cy):
    """A ring standing in the XZ plane (axis along y), its lowest point a gap above z = 0.
    Returns the bmesh and the ring's center height."""
    bm = bmesh.new()
    profile = band_profile()
    cz = RING_OUT + GAP
    rings = []
    for s in range(SEG):
        a = 2 * math.pi * s / SEG
        ca, sa = math.cos(a), math.sin(a)
        rings.append([bm.verts.new((cx + r * ca, cy + y, cz + r * sa)) for r, y in profile])
    n = len(profile)
    for s in range(SEG):
        ra, rb = rings[s], rings[(s + 1) % SEG]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
    return bm, cz


def sphere(bm, cx, cy, cz, r, seg=32, rings=16):
    made = bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    # Move only this sphere's verts (the bmesh holds the earlier grains too).
    for v in made["verts"]:
        v.co.x += cx
        v.co.y += cy
        v.co.z += cz


def half_cylinder(bm, cx, r, face_y, z0, z1, steps=96):
    """Plaster: the part of a cylinder behind the plane y = face_y, as a closed prism."""
    a0 = math.asin(face_y / r)
    pts = [(cx + r * math.cos(a0 + (math.pi - 2 * a0) * i / steps), r * math.sin(a0 + (math.pi - 2 * a0) * i / steps)) for i in range(steps + 1)]
    lo = [bm.verts.new((x, y, z0)) for x, y in pts]
    hi = [bm.verts.new((x, y, z1)) for x, y in pts]
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
    bm.faces.new(lo[::-1])
    bm.faces.new(hi)


def annulus_y(bm, cx, y, cz, r_in, r_out, depth):
    """A flat ring-shaped plate facing -y (the imprint on the plaster face)."""
    front, back = [], []
    for s in range(SEG):
        a = 2 * math.pi * s / SEG
        ca, sa = math.cos(a), math.sin(a)
        front.append((bm.verts.new((cx + r_in * ca, y, cz + r_in * sa)), bm.verts.new((cx + r_out * ca, y, cz + r_out * sa))))
        back.append((bm.verts.new((cx + r_in * ca, y + depth, cz + r_in * sa)), bm.verts.new((cx + r_out * ca, y + depth, cz + r_out * sa))))
    for s in range(SEG):
        t = (s + 1) % SEG
        fi, fo = front[s]
        gi, go = front[t]
        bi, bo = back[s]
        ci, co = back[t]
        bm.faces.new((fi, gi, go, fo))  # front face
        bm.faces.new((bo, co, ci, bi))  # back face
        bm.faces.new((fo, go, co, bo))  # outer rim
        bm.faces.new((bi, ci, gi, fi))  # inner rim


def sprue_bm(cx, z0, z1, r=0.02):
    """A round stick standing on the axis (cx, 0), rounded ends."""
    bm = bmesh.new()
    prof = [(TIP, z0)]
    prof += arc(r - 0.006, z0 + 0.006, 0.006, -90, 0, 8)
    prof += arc(r - 0.006, z1 - 0.006, 0.006, 0, 90, 8)
    prof.append((TIP, z1))
    lathe_z(bm, prof, (cx, 0.0), seg=32)
    return bm


def channel(bm, cx, y, z0, z1, half_w, depth):
    """A flat strip facing -y from z0 up to z1 (the sprue's channel in the plaster)."""
    verts = [bm.verts.new((cx + sx * half_w, y + dy, z)) for dy in (0.0, depth) for z in (z0, z1) for sx in (-1, 1)]
    for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
        bm.faces.new([verts[i] for i in f])


def build():
    # The finished gold ring, front and center.
    bm, _ = ring_object("ring", 0.0, -0.45)
    new_object("ring", bm)

    # Crucible: a shallow melting dish (what a jeweller melts gold in with a torch). The inner
    # wall slopes at about 50 degrees, so from the close-up's 50-degree pitch the whole inside
    # faces the camera and no contour line ends halfway up the wall (steep walls drew one).
    # Profile: up the outside, over a round rim, down the inside to a flat floor; every
    # join tangent.
    floor = 0.04
    profile = [(TIP, GAP)]
    profile += arc(0.15, GAP + 0.03, 0.03, -90, -43, 4)
    profile += arc(0.29, 0.16, 0.02, -43, 130, 14)
    profile += arc(0.15, floor + 0.03, 0.03, -50, -90, 4)
    profile.append((TIP, floor))
    bm = bmesh.new()
    lathe_z(bm, profile, (CRUCIBLE_X, 0.0))
    new_object("crucible", bm)

    # Grains on the crucible floor: gold, copper and silver beads (all neutral; the key part
    # shows amber).
    bm = bmesh.new()
    # Spaced apart (gaps between beads), so each draws its own full outline.
    r = 0.035
    for dx, dy in ((0.03, 0.0), (-0.06, 0.05), (0.09, 0.06), (-0.05, -0.06), (0.06, -0.07)):
        sphere(bm, CRUCIBLE_X + dx, dy, floor + r + GAP, r)
    new_object("grains", bm)

    # Melt: a shallow pool filling the crucible floor, clear of the walls.
    bm = bmesh.new()
    # Deep enough to swallow the grains (it scales in over them as they melt), and clear of
    # the walls all the way up: a rounded bottom edge, a side leaning out with the wall, and
    # a rounded top edge.
    top = floor + 0.095
    pool = [(TIP, floor + GAP)]
    pool += arc(0.14, floor + GAP + 0.02, 0.02, -90, -50, 4)
    pool += arc(0.215, top - 0.01, 0.01, -50, 90, 10)
    pool.append((TIP, top))
    lathe_z(bm, pool, (CRUCIBLE_X, 0.0))
    new_object("melt", bm)

    # Wax copy of the ring, standing on the bench like the gold one, with a wax stick (the
    # sprue) on top: it becomes the channel the gold is poured down.
    bm, ring_cz = ring_object("waxring", CAST_X, 0.0)
    new_object("waxring", bm)
    sprue_z0 = ring_cz + RING_OUT + GAP
    new_object("sprue", sprue_bm(CAST_X, sprue_z0, SPRUE_TOP))

    # Gold cast: the same ring and stick in the same place (appear after the wax is gone).
    bm, _ = ring_object("cast", CAST_X, 0.0)
    new_object("cast", bm)
    new_object("castsprue", sprue_bm(CAST_X, sprue_z0, SPRUE_TOP))

    # Plaster block, in two halves split along the ring's plane: both rise around the wax
    # ring and bury it; then the front half lifts away (explode, away) so the inside shows.
    bm = bmesh.new()
    half_cylinder(bm, CAST_X, PLASTER_R, PLASTER_FACE_Y, GAP, PLASTER_TOP)
    new_object("plasterback", bm, smooth=False)
    bm = bmesh.new()
    half_cylinder(bm, CAST_X, PLASTER_R, PLASTER_FACE_Y, GAP, PLASTER_TOP)
    for v in bm.verts:
        v.co.y = -v.co.y
    new_object("plasterfront", bm, smooth=False)

    # Hole: the ring-shaped imprint and its channel up to the top, on the back half's face.
    bm = bmesh.new()
    face = PLASTER_FACE_Y - 0.004
    annulus_y(bm, CAST_X, face, ring_cz, RING_IN, RING_OUT, 0.002)
    channel(bm, CAST_X, face, ring_cz + RING_OUT, PLASTER_TOP - 0.004, 0.02, 0.002)
    new_object("hollow", bm, smooth=False)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "gold-casting.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[gold_casting] wrote {out}")


main()
