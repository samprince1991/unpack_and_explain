"""Procedural set of calibration weights on a rack, with a dial behind them (our own model,
license "own"). Five weights in a row along X, biggest on the left, sized by how much each
part of a credit score counts. Z is up. Objects are named after the catalog parts in
video/src/brand/models.ts.

  blender -b --factory-startup --python blender/models/credit_weights.py -- <out.glb>

Curves step well under 25 degrees (blender/qc.py); box corners are 90 degrees and read as
single lines. The weights stand just clear of the rack, so each one draws its own outline.
"""

import math
import os
import sys

import bmesh
import bpy

SEG = 64
TIP = 0.0005  # lathe profiles end almost on the axis, never exactly on it (no collapsed quads)
SEAT_GAP = 0.012  # weights hover this far over the rack
RACK_TOP = 0.0


def args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def new_object(name, bm, smooth=True):
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


def lathe_z(bm, profile, center=(0.0, 0.0), seg=SEG):
    """Revolves (r, z) points around a vertical axis at `center`."""
    rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        rings.append([bm.verts.new((center[0] + r * math.cos(a), center[1] + r * math.sin(a), z)) for r, z in profile])
    for s in range(seg):
        ra, rb = rings[s], rings[(s + 1) % seg]
        for i in range(len(profile) - 1):
            bm.faces.new((ra[i], rb[i], rb[i + 1], ra[i + 1]))
    # Close both pinholes: an open rim is a border, and Freestyle draws borders as a white dash.
    bm.faces.new([ring[0] for ring in rings][::-1])
    bm.faces.new([ring[-1] for ring in rings])


def box(bm, x0, x1, y0, y1, z0, z1):
    v = [bm.verts.new((x, y, z)) for z in (z0, z1) for y in (y0, y1) for x in (x0, x1)]
    for f in ((0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (1, 3, 7, 5), (3, 2, 6, 7), (2, 0, 4, 6)):
        bm.faces.new([v[i] for i in f])


def weight_profile(r, h):
    """Bottom to top: rounded base, straight body, rounded shoulder, neck, ball knob."""
    corner = r * 0.14
    neck = r * 0.3
    knob = r * 0.36
    body_top = h - knob * 2.2
    shoulder = r * 0.3
    profile = [(TIP, 0.0)]
    profile += arc(r - corner, corner, corner, -90, 0, 6)
    # Shoulder: a quarter circle from the body wall in towards the neck.
    profile += arc(r - shoulder, body_top - shoulder, shoulder, 0, 90, 8)
    # A concave sweep into the neck, so the shoulder doesn't meet it at a sharp angle.
    sweep = (r - shoulder - neck) * 0.5
    profile += arc(neck + sweep, body_top + sweep, sweep, 270, 180, 6)
    # Ball knob: joins the neck low on the sphere and closes on the axis.
    ball_z = body_top + sweep + knob * 0.75
    knob_start = -math.degrees(math.acos(min(neck / knob, 0.999)))
    profile += arc(0.0, ball_z, knob, knob_start, 90, 14)[1:-1]
    profile.append((TIP, ball_z + knob))
    return profile


def build():
    # (name, radius, height): sized by how much each part of the score counts.
    weights = (
        ("payment", 0.40, 1.18),
        ("owed", 0.37, 1.06),
        ("history", 0.27, 0.76),
        ("newcredit", 0.22, 0.62),
        ("mix", 0.22, 0.62),
    )
    gap = 0.13
    span = sum(2 * r for _, r, _ in weights) + gap * (len(weights) - 1)
    x = -span / 2
    y_row = -0.2
    for name, r, h in weights:
        cx = x + r
        bm = bmesh.new()
        lathe_z(bm, [(pr, pz + RACK_TOP + SEAT_GAP) for pr, pz in weight_profile(r, h)], (cx, y_row))
        new_object(name, bm)
        x += 2 * r + gap

    # Rack: one flat slab. Its corners are real 90-degree edges.
    half = span / 2 + 0.16
    bm = bmesh.new()
    box(bm, -half, half, -0.72, 0.78, RACK_TOP - 0.1, RACK_TOP)
    new_object("rack", bm, smooth=False)

    # Dial: a half-ring gauge on a post, behind the row. Built in the XZ plane.
    bm = bmesh.new()
    y0, y1 = 0.42, 0.5
    dial_z = 1.3
    outer, inner = 0.74, 0.62
    steps = 48
    cols = []
    for i in range(steps + 1):
        a = math.pi * i / steps
        ca, sa = math.cos(a), math.sin(a)
        cols.append(
            [
                bm.verts.new((outer * ca, y0, dial_z + outer * sa)),
                bm.verts.new((inner * ca, y0, dial_z + inner * sa)),
                bm.verts.new((inner * ca, y1, dial_z + inner * sa)),
                bm.verts.new((outer * ca, y1, dial_z + outer * sa)),
            ]
        )
    for a_col, b_col in zip(cols, cols[1:]):
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((a_col[i], a_col[j], b_col[j], b_col[i]))
    bm.faces.new(cols[0])
    bm.faces.new(cols[-1][::-1])
    # Ticks stand just proud of the ring's front face.
    for k in range(9):
        a = math.pi * k / 8
        ca, sa = math.cos(a), math.sin(a)
        mx, mz = 0.68 * ca, dial_z + 0.68 * sa
        length, width = 0.05, 0.012
        corners = [(-width, -length), (width, -length), (width, length), (-width, length)]
        lo = [bm.verts.new((mx + u * sa + v * ca, y0 - 0.03, mz - u * ca + v * sa)) for u, v in corners]
        hi = [bm.verts.new((mx + u * sa + v * ca, y0 - 0.008, mz - u * ca + v * sa)) for u, v in corners]
        bm.faces.new(lo)
        bm.faces.new(hi[::-1])
        for i in range(4):
            j = (i + 1) % 4
            bm.faces.new((lo[j], lo[i], hi[i], hi[j]))
    # Needle, pointing high on the scale.
    needle_a = math.radians(48)
    ca, sa = math.cos(needle_a), math.sin(needle_a)
    needle_len, needle_w = 0.56, 0.018
    corners = [(-needle_w, 0.0), (needle_w, 0.0), (needle_w, needle_len), (-needle_w, needle_len)]
    lo = [bm.verts.new((u * sa + v * ca, y0 - 0.05, dial_z - u * ca + v * sa)) for u, v in corners]
    hi = [bm.verts.new((u * sa + v * ca, y0 - 0.02, dial_z - u * ca + v * sa)) for u, v in corners]
    bm.faces.new(lo)
    bm.faces.new(hi[::-1])
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((lo[j], lo[i], hi[i], hi[j]))
    new_object("dial", bm)

    # Post: a rounded flange just clear of the rack, a column, and a domed top behind the
    # needle's pivot. Every join is tangent, so the profile has no creases. It stands behind
    # the needle (a small gap) and inside the half-ring, touching neither.
    bm = bmesh.new()
    z0 = RACK_TOP + SEAT_GAP
    r_post = 0.07
    profile = [(TIP, z0)]
    profile += arc(0.15, z0 + 0.03, 0.03, -90, 90, 12)
    profile += arc(r_post + 0.02, z0 + 0.08, 0.02, 270, 180, 6)
    profile += arc(0.0, dial_z, r_post, 0, 90, 10)[:-1]
    profile.append((TIP, dial_z + r_post))
    lathe_z(bm, profile, (0.0, 0.5), seg=48)
    new_object("post", bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "credit-weights.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[credit_weights] wrote {out}")


main()
