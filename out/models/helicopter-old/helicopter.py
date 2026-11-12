"""Procedural light helicopter (our own model, license "own").

A generic two-seat, two-blade light helicopter (no maker's livery): a rounded cabin with a
bubble nose, a thin tapered tail boom with a swept fin, a two-blade tail rotor on the right
side, skids on two arched cross tubes, and a mast topped by a teetering hub. Between the
cabin and the hub sits the swashplate: a wide lower plate that doesn't turn and a smaller
upper plate that turns with the rotor, joined to each blade by a pitch link.

Axis: X forward (the nose points to +X), Z up, the ground at Z = 0, sizes in meters (the
build normalizes the longest side, the main rotor, to 2). Parts:

- mast:        the rotor mast (the root: every other part rides on it, catalog `attach`)
- body:        the cabin behind the nose, closed at the back where the boom starts
- canopy:      the bubble nose, split from the cabin by a thin gap (the windscreen line)
- boom:        the tapered tail boom
- fin:         the swept fin above and below the boom end
- skids:       two skid tubes, upturned at the front, on two arched cross tubes
- swashLower:  the lower plate, which doesn't turn (rises and tilts with the controls)
- swashUpper:  the upper plate, which turns with the rotor (rides on the lower plate)
- links:       the two pitch links from the upper plate to the blades (ride on the upper plate)
- hub:         the hub on top of the mast (spins about Z)
- bladeA:      the blade along +X (rides on the hub; tilts about X for pitch)
- bladeB:      the blade along -X
- tailRotor:   hub and two blades on the right of the boom end (spins about Y)
- lift:        an arrow pointing up above the hub (appear-only)
- arc:         an arc over the rear of the blade circle, where the blades rise (appear-only)

Parts never cross: each sits off the next with a small gap (blender/qc.py). Curves step
under 25 degrees; the flat fin is a `hardEdges` part.

  blender -b --factory-startup --python blender/models/helicopter.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

GAP = 0.012
AROUND = 48  # points around the cabin and boom sections

# cabin: an egg along X with an elliptical section (narrower than tall)
XC, R, A_NOSE = 0.3, 0.72, 1.1  # widest station, its radius, nose length ahead of it
XT, RT = -1.0, 0.2  # cabin tail end and its radius
ZC, ZB = 1.15, 1.35  # cabin center height, and the boom's (the tail end rises to meet it)
WIDTH = 0.88  # section half-width over half-height
XS = 0.62  # windscreen station: the canopy is ahead of it

# tail
XE = -4.6  # boom end
RB0, RB1 = 0.15, 0.065  # boom radius at the cabin and at the end
XTR = -4.42  # tail rotor axis station

# rotor head
XM = 0.15  # mast station
HZ = 2.45  # hub (and blade) height
SPAN = 3.85  # blade tip radius
CHORD, THICK = 0.18, 0.03
ROOT = 0.16  # blade root radius
LINK_AT = (0.22, 0.14)  # pitch link of blade A (blade B's is mirrored through the mast)

X, Y, Z = (1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0)


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


def _smooth(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


# ---------- cabin profile ----------

def cabin_stations():
    """(x, r, zc) from the tail end to the nose tip; the nose ends in a point."""
    out = []
    for k in range(25):  # tail end -> widest: a smooth taper, flat at both ends
        f = k / 24
        x = XT + (XC - XT) * f
        out.append((x, RT + (R - RT) * _smooth(f), ZB + (ZC - ZB) * _smooth(f)))
    for k in range(1, 31):  # widest -> nose: a quarter ellipse in 3-degree steps
        th = math.radians(3 * k)
        out.append((XC + A_NOSE * math.sin(th), R * math.cos(th), ZC))
    return out


def _station_at(x):
    pts = cabin_stations()
    for a, b in zip(pts, pts[1:]):
        if a[0] <= x <= b[0]:
            f = (x - a[0]) / max(b[0] - a[0], 1e-9)
            return a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f
    raise ValueError(x)


def cabin_top(x):
    r, zc = _station_at(x)
    return zc + r


def cabin_bottom(x):
    r, zc = _station_at(x)
    return zc - r


def _ring(bm, x, r, zc):
    return [
        bm.verts.new((x, WIDTH * r * math.cos(a), zc + r * math.sin(a)))
        for a in (2 * math.pi * s / AROUND for s in range(AROUND))
    ]


def _skin(bm, rings):
    for ra, rb in zip(rings, rings[1:]):
        for s in range(AROUND):
            j = (s + 1) % AROUND
            bm.faces.new((ra[s], ra[j], rb[j], rb[s]))


def build_cabin():
    """The egg split at the windscreen: body behind (closed at the tail), canopy ahead."""
    pts = cabin_stations()
    back = [p for p in pts if p[0] < XS - GAP / 2]
    front = [p for p in pts if p[0] > XS + GAP / 2]
    r_cut, z_cut = _station_at(XS)

    bm = bmesh.new()
    rings = [_ring(bm, *p) for p in back]
    rings.append(_ring(bm, XS - GAP / 2, r_cut, z_cut))
    _skin(bm, rings)
    bm.faces.new(rings[0][::-1])  # flat tail end, where the boom starts
    new_object("body", bm)

    bm = bmesh.new()
    rings = [_ring(bm, XS + GAP / 2, r_cut, z_cut)] + [_ring(bm, *p) for p in front[:-1]]
    _skin(bm, rings)
    tip = bm.verts.new((front[-1][0], 0.0, front[-1][2]))
    last = rings[-1]
    for s in range(AROUND):
        bm.faces.new((last[s], last[(s + 1) % AROUND], tip))
    new_object("canopy", bm)


# ---------- helpers ----------

def lathe(bm, profile, center, axis, seg=48):
    """Revolve a closed (along, radius) profile around a line through `center` along `axis`
    ("x", "y" or "z")."""
    i = "xyz".index(axis)
    u, v = [k for k in range(3) if k != i]
    rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        ring = []
        for along, r in profile:
            p = list(center)
            p[i] += along
            p[u] += r * math.cos(a)
            p[v] += r * math.sin(a)
            ring.append(bm.verts.new(p))
        rings.append(ring)
    n = len(profile)
    for s in range(seg):
        ra, rb = rings[s], rings[(s + 1) % seg]
        for k in range(n):
            j = (k + 1) % n
            bm.faces.new((ra[k], ra[j], rb[j], rb[k]))


def obox(bm, center, axes, half):
    vs = []
    for d in [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]:
        vs.append(bm.verts.new(tuple(center[i] + sum(d[k] * half[k] * axes[k][i] for k in range(3)) for i in range(3))))
    for f in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]:
        bm.faces.new([vs[i] for i in f])


def tube(bm, points, radius, sides=16, normal=None):
    """Open round tube through points with flat caps."""
    rings = []
    count = len(points)
    for k, p in enumerate(points):
        q = points[min(k + 1, count - 1)]
        o = points[max(k - 1, 0)]
        t = [q[i] - o[i] for i in range(3)]
        n = math.sqrt(sum(c * c for c in t)) or 1.0
        t = [c / n for c in t]
        if normal:
            u = list(normal)
        else:
            up = (0.0, 0.0, 1.0) if abs(t[2]) < 0.9 else (0.0, 1.0, 0.0)
            u = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]
            un = math.sqrt(sum(c * c for c in u)) or 1.0
            u = [c / un for c in u]
        v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]
        rings.append([
            bm.verts.new(tuple(p[i] + radius * (math.cos(a) * u[i] + math.sin(a) * v[i]) for i in range(3)))
            for a in (2 * math.pi * s / sides for s in range(sides))
        ])
    for a, b in zip(rings, rings[1:]):
        for s in range(sides):
            j = (s + 1) % sides
            bm.faces.new((a[s], a[j], b[j], b[s]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])


def arrow(bm, base, tip_z, r=0.035, head_r=0.09, head_len=0.22):
    """Vertical arrow from base (x, y, z) up to tip_z."""
    x, y, z0 = base
    shaft_top = tip_z - head_len - 0.006
    lathe(bm, [(0.0, 0.0), (0.0, r), (shaft_top - z0, r), (shaft_top - z0, 0.0)], (x, y, z0), "z", seg=32)
    lathe(bm, [(tip_z - head_len - z0, 0.0), (tip_z - head_len - z0, head_r), (tip_z - z0, 0.0)], (x, y, z0), "z", seg=32)


# ---------- parts ----------

def build_boom():
    bm = bmesh.new()
    x0 = XT - GAP
    lathe(bm, [(0.0, 0.0), (0.0, RB0), (XE - x0, RB1), (XE - x0, 0.0)], (x0, 0.0, ZB), "x")
    new_object("boom", bm)


def boom_radius(x):
    x0 = XT - GAP
    return RB0 + (RB1 - RB0) * (x - x0) / (XE - x0)


def build_fin():
    """A swept plate above the boom end and a short one below, clear of the boom."""
    bm = bmesh.new()
    t = 0.015

    def plate(x_lo, x_hi, z_lo, z_hi, sweep):
        quad = [(x_lo, z_lo), (x_hi, z_lo), (x_hi - sweep, z_hi), (x_lo - sweep * 0.6, z_hi)]
        vs = [bm.verts.new((x, y, z)) for y in (-t, t) for x, z in quad]
        bm.faces.new(vs[0:4][::-1])
        bm.faces.new(vs[4:8])
        for k in range(4):
            j = (k + 1) % 4
            bm.faces.new((vs[k], vs[j], vs[4 + j], vs[4 + k]))

    rb = boom_radius(-4.45)
    plate(-4.56, -4.2, ZB + rb + GAP, ZB + 0.75, 0.32)
    plate(-4.56, -4.32, ZB - 0.38, ZB - rb - GAP, -0.12)
    new_object("fin", bm, smooth=False)


def build_skids():
    bm = bmesh.new()
    r, z = 0.035, 0.05
    for side in (-1, 1):
        y = 0.85 * side
        pts = [(x, y, z) for x in (-1.0 + 0.1 * k for k in range(21))]  # -1.0 .. 1.0
        rc = 0.25
        for k in range(1, 10):  # the front turns up in 10-degree steps
            a = math.radians(10 * k)
            pts.append((1.0 + rc * math.sin(a), y, z + rc * (1 - math.cos(a))))
        tube(bm, pts, r, normal=Y)
    for xs in (-0.45, 0.75):
        top = cabin_bottom(xs) - r - 0.02
        rc = 0.28
        path = []
        for side in (-1, 1):
            leg = [(xs, 0.85 * side, z + 0.0)]
            leg.append((xs, 0.85 * side, top - rc))
            for k in range(1, 9):  # rounds over toward the middle in 11.25-degree steps
                a = math.radians(11.25 * k)
                leg.append((xs, side * (0.85 - rc + rc * math.cos(a)), top - rc + rc * math.sin(a)))
            leg.append((xs, side * 0.0, top))
            path.append(leg)
        left, right = path
        tube(bm, left + right[::-1][1:], r * 0.9, normal=X)
    new_object("skids", bm)


def build_mast():
    bm = bmesh.new()
    z0 = cabin_top(XM) + GAP
    z1 = HZ - 0.06 - GAP
    lathe(bm, [(0.0, 0.0), (0.0, 0.065), (z1 - z0, 0.065), (z1 - z0, 0.0)], (XM, 0.0, z0), "z")
    new_object("mast", bm)


SL0, SL1 = 2.06, 2.11  # lower plate
SU0, SU1 = SL1 + GAP, SL1 + GAP + 0.04  # upper plate


def ring_plate(bm, z0, z1, r_in, r_out):
    lathe(bm, [(0.0, r_in), (0.0, r_out), (z1 - z0, r_out), (z1 - z0, r_in)], (XM, 0.0, z0), "z", seg=64)


def build_swash():
    bm = bmesh.new()
    ring_plate(bm, SL0, SL1, 0.085, 0.32)
    new_object("swashLower", bm)

    bm = bmesh.new()
    ring_plate(bm, SU0, SU1, 0.085, 0.22)
    for sx, sy in (LINK_AT, (-LINK_AT[0], -LINK_AT[1])):  # lugs out to each pitch link
        d = math.hypot(sx, sy)
        u = (sx / d, sy / d, 0.0)
        w = (-u[1], u[0], 0.0)
        mid = 0.5 * (0.2 + d + 0.03)
        obox(bm, (XM + u[0] * mid, u[1] * mid, (SU0 + SU1) / 2), (u, w, Z), ((d + 0.03 - 0.2) / 2, 0.035, (SU1 - SU0) / 2))
    new_object("swashUpper", bm)

    bm = bmesh.new()
    top = HZ - THICK / 2 - 0.012
    for sx, sy in (LINK_AT, (-LINK_AT[0], -LINK_AT[1])):
        tube(bm, [(XM + sx, sy, SU1 + GAP), (XM + sx, sy, top)], 0.018)
    new_object("links", bm)


def build_hub():
    bm = bmesh.new()
    lathe(bm, [(0.0, 0.0), (0.0, 0.1), (0.12, 0.1), (0.12, 0.0)], (XM, 0.0, HZ - 0.06), "z")
    obox(bm, (XM, 0.0, HZ), (X, Y, Z), (0.15, 0.05, 0.035))  # the grips the blades bolt to
    new_object("hub", bm, smooth=True)


def build_blades():
    for name, side in (("bladeA", 1), ("bladeB", -1)):
        bm = bmesh.new()
        mid = (ROOT + SPAN) / 2
        obox(bm, (XM + side * mid, 0.0, HZ), (X, Y, Z), ((SPAN - ROOT) / 2, CHORD / 2, THICK / 2))
        new_object(name, bm, smooth=False)


def build_tail_rotor():
    bm = bmesh.new()
    y0 = boom_radius(XTR) + 0.02
    lathe(bm, [(0.0, 0.0), (0.0, 0.05), (0.075, 0.05), (0.075, 0.0)], (XTR, y0, ZB), "y", seg=32)
    yb = y0 + 0.04
    for side in (-1, 1):
        obox(bm, (XTR, yb, ZB + side * (0.06 + 0.27)), (Z, X, Y), (0.27, 0.035, 0.006))
    new_object("tailRotor", bm)


def build_lift():
    bm = bmesh.new()
    arrow(bm, (XM, 0.0, HZ + 0.2), HZ + 1.9, r=0.06, head_r=0.16, head_len=0.36)
    new_object("lift", bm)


def build_arc():
    """A band over the rear of the blade circle (the side that rises on forward cyclic)."""
    bm = bmesh.new()
    rad, z = 3.2, HZ + 0.12
    pts = [
        (XM + rad * math.cos(a), rad * math.sin(a), z)
        for a in (math.radians(180 - 70 + 140 * k / 56) for k in range(57))
    ]
    tube(bm, pts, 0.04, normal=Z)
    new_object("arc", bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "helicopter.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_cabin()
    build_boom()
    build_fin()
    build_skids()
    build_mast()
    build_swash()
    build_hub()
    build_blades()
    build_tail_rotor()
    build_lift()
    build_arc()
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[helicopter] wrote {out}")


main()
