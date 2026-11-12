"""Procedural light helicopter (our own model, license "own").

A generic two-seat, two-blade piston light helicopter (no maker's livery), sized like the
real class: a 7.7 m main rotor, a 1.2 m wide cabin, a 1.9 m skid track, about 2.7 m to the
top of the rotor head and 8.5 m from the front blade tip to the tail skid.

- Cabin: a lofted pod with a flat floor, a rounded bubble nose and a high roof, tapering
  back into the boom. The canopy is split from the cabin along a slanted windscreen line
  (far back on the roof, forward at the chin), with a center post. Door frames with a window
  line on both sides, engine access panels behind them, and a transmission fairing on the
  roof under the rotor head.
- Rotor head: mast, a two-plate swashplate (a lower plate that doesn't turn, with three
  control rods under it, and an upper plate that turns), two pitch links up to the pitch
  horns, and a teetering hub (yoke, teeter bolt, blade grips, mast nut).
- Blades: real airfoil sections (rounded leading edge, thin trailing edge) with a thicker,
  narrower root and 6 degrees of twist.
- Tail: a tapered boom, a swept upper and lower fin with a tail skid, a horizontal
  stabilizer, a tail gearbox and a two-blade tail rotor on the left (+Y) side.
- Skids: two tubes with upturned ends on two splayed, arched cross tubes, clamped on.

Axis: X forward (the nose points to +X), Y to the left, Z up, the ground at Z = 0, sizes
in meters (the build normalizes the longest side, front blade tip to tail skid, to 2).
Parts:

- mast:        the rotor mast (the root: every other part rides on it, catalog `attach`)
- body:        cabin shell behind the windscreen line, door frames, access panels, fairing
- canopy:      the bubble nose ahead of the windscreen line, with its center post
- boom:        the tapered tail boom and the tail gearbox
- fin:         swept upper and lower fin, tail skid and horizontal stabilizer
- skids:       two skid tubes on two cross tubes, with clamps
- rods:        three control rods from the fairing up to the lower plate (stretch, `flex`)
- swashLower:  the lower plate, which doesn't turn (rises and tilts with the controls)
- swashUpper:  the upper plate, which turns with the rotor (rides on the lower plate)
- links:       the two pitch links from the upper plate to the pitch horns (ride on the hub)
- hub:         yoke, grips and pitch horns on top of the mast (spins about Z)
- bladeA:      the blade along +X (rides on the hub; tilts about X for pitch)
- bladeB:      the blade along -X
- tailRotor:   hub and two blades on the left of the boom end (spins about Y)
- lift:        an arrow pointing up above the hub (appear-only)
- arc:         an arc over the rear of the blade circle, where the blades rise (appear-only)

Parts never cross: each sits off the next with a small gap (blender/qc.py). Curves step
under 25 degrees (airfoils are sampled by normal angle, 15 degrees a step); the fin is a
`hardEdges` part.

  blender -b --factory-startup --python blender/models/helicopter.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

GAP = 0.012
AROUND = 72  # points around the cabin sections

X, Y, Z = (1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0)

# ---------- cabin ----------
X_TAIL = -1.75  # cabin tail end, where the boom starts
X_CAP = 0.3  # the nose cap starts here (the widest, tallest station)
X_TIP = 1.62  # nose tip
Z_TIP = 0.98  # nose tip height (low, like a real bubble)
TOP0, BOT0, W0 = 1.86, 0.55, 0.59  # roof, floor and half-width at the widest station
# (x, value) keys from the tail end to the widest station; flat at both ends
TOP_KEYS = [(-1.75, 1.57), (-1.3, 1.69), (-0.8, 1.80), (-0.3, 1.85), (X_CAP, TOP0)]
BOT_KEYS = [(-1.75, 1.19), (-1.3, 0.93), (-0.8, 0.63), (-0.3, 0.55), (X_CAP, BOT0)]
WID_KEYS = [(-1.75, 0.19), (-1.3, 0.335), (-0.8, 0.5), (-0.3, 0.58), (X_CAP, W0)]
N_TOP, N_BOT = 2.6, 3.2  # superellipse exponents: rounder roof, flatter floor


def cut_x(th):
    """Windscreen line: far back on the roof, forward at the chin."""
    return 0.65 - 0.52 * math.sin(th)


# ---------- tail ----------
ZB = 1.38  # boom axis height
XB0 = X_TAIL - GAP  # boom start
XE = -4.75  # boom end
RB0, RB1 = 0.165, 0.07  # boom radius at the cabin and at the end
XTR = -4.6  # tail rotor axis station
TR_R = 0.535  # tail rotor radius (1.07 m)

# ---------- rotor head ----------
XM = -0.25  # mast station
HZ = 2.62  # blade plane height
SPAN = 3.85  # blade tip radius (7.7 m rotor)
GRIP_END = 0.44  # the grips end and the blades start here (from the mast)
CHORD, THICK = 0.18, 0.022  # blade chord and thickness (12 %)
LINK_AT = (0.30, 0.15)  # blade A's pitch link (blade B's is mirrored through the mast)
MAST_R = 0.055
SL0, SL1 = 2.20, 2.24  # lower plate
SU0, SU1 = SL1 + GAP, SL1 + GAP + 0.03  # upper plate
ROD_AT = [(0.0, 0.25), (0.0, -0.25), (-0.25, 0.0)]  # control rods (from the mast)

# ---------- roof fairing ----------
XF0, XF1 = -0.95, 0.05  # fairing ends
FW, FH, NF = 0.36, 0.21, 2.6  # its half-width, height above the roof, section exponent


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


# ---------- small vector helpers ----------

def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def mul(a, k):
    return tuple(x * k for x in a)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(a):
    n = math.sqrt(dot(a, a)) or 1.0
    return mul(a, 1 / n)


def spow(v, p):
    return math.copysign(abs(v) ** p, v)


def smooth(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def pchip(keys, x):
    """Monotone cubic through (x, y) keys, flat at both ends: no overshoot, no bumps."""
    xs = [k[0] for k in keys]
    ys = [k[1] for k in keys]
    n = len(keys)
    d = [(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(n - 1)]
    m = [0.0] * n
    for i in range(1, n - 1):
        if d[i - 1] * d[i] > 0:
            w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1])
            w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1])
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    x = min(max(x, xs[0]), xs[-1])
    for i in range(n - 1):
        if x <= xs[i + 1]:
            h = xs[i + 1] - xs[i]
            t = (x - xs[i]) / h
            h00, h10 = 2 * t**3 - 3 * t**2 + 1, t**3 - 2 * t**2 + t
            h01, h11 = -2 * t**3 + 3 * t**2, t**3 - t**2
            return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1]
    return ys[-1]


# ---------- cabin surface ----------

def section(x):
    """(top, bottom, half-width, roof exponent, floor exponent) of the cabin at x."""
    if x <= X_CAP:
        top, bot, w = pchip(TOP_KEYS, x), pchip(BOT_KEYS, x), pchip(WID_KEYS, x)
        k = smooth((x - X_TAIL) / (-0.8 - X_TAIL))  # round at the tail, squarer forward
        return top, bot, w, 2.0 + (N_TOP - 2.0) * k, 2.0 + (N_BOT - 2.0) * k
    f = min((x - X_CAP) / (X_TIP - X_CAP), 1.0)
    top = Z_TIP + (TOP0 - Z_TIP) * (1 - f**2) ** 0.5
    bot = Z_TIP - (Z_TIP - BOT0) * (1 - f**2.6) ** (1 / 2.6)
    w = W0 * (1 - f**2.3) ** (1 / 2.3)
    return top, bot, w, N_TOP, N_BOT


def cabin_point(x, th):
    """Point on the cabin at station x, angle th around it (0 = left side, 90 = roof)."""
    top, bot, w, nt, nb = section(x)
    zc, h = (top + bot) / 2, (top - bot) / 2
    c, s = math.cos(th), math.sin(th)
    n = nt if s >= 0 else nb
    return (x, w * spow(c, 2 / n), zc + h * spow(s, 2 / n))


def cabin_normal(x, th):
    e = 1e-4
    dx = sub(cabin_point(x + e, th), cabin_point(x - e, th))
    dt = sub(cabin_point(x, th + e), cabin_point(x, th - e))
    nrm = unit(cross(dx, dt))
    out = (0.0, math.cos(th), math.sin(th))
    return nrm if dot(nrm, out) >= 0 else mul(nrm, -1)


def roof_z(x, y):
    """Height of the cabin's upper surface at (x, y)."""
    top, bot, w, nt, _ = section(x)
    zc, h = (top + bot) / 2, (top - bot) / 2
    q = min(abs(y) / w, 1.0)
    return zc + h * (1 - q**nt) ** (1 / nt)


def _angle(s):
    return 2 * math.pi * s / AROUND


def build_cabin():
    """The pod split along the windscreen line: body behind (closed at the tail end),
    canopy ahead (ending in the rounded nose tip)."""
    bm = bmesh.new()
    rows = 70
    grid = []
    for r in range(rows + 1):
        u = r / rows
        ring = []
        for s in range(AROUND):
            th = _angle(s)
            x = X_TAIL + u * (cut_x(th) - GAP / 2 - X_TAIL)
            ring.append(bm.verts.new(cabin_point(x, th)))
        grid.append(ring)
    _skin(bm, grid)
    bm.faces.new(grid[0][::-1])  # flat tail end, where the boom starts
    door_frames(bm)
    access_panels(bm)
    fairing(bm)
    new_object("body", bm)

    bm = bmesh.new()
    rows = 44
    grid = []
    for r in range(rows):
        p = r / rows
        ring = []
        for s in range(AROUND):
            x0 = cut_x(_angle(s)) + GAP / 2
            x = X_TIP - (X_TIP - x0) * (1 - p) ** 2  # rows bunch up toward the tip
            ring.append(bm.verts.new(cabin_point(x, _angle(s))))
        grid.append(ring)
    _skin(bm, grid)
    tip = bm.verts.new(cabin_point(X_TIP, 0.0))
    last = grid[-1]
    for s in range(AROUND):
        bm.faces.new((last[s], last[(s + 1) % AROUND], tip))
    center_post(bm)
    new_object("canopy", bm)


def _skin(bm, rings, closed=True):
    count = len(rings[0])
    for ra, rb in zip(rings, rings[1:]):
        for s in range(count if closed else count - 1):
            j = (s + 1) % count
            bm.faces.new((ra[s], ra[j], rb[j], rb[s]))


# ---------- tubes ----------

def fillet(points, radius, step_deg=10.0):
    """Rounds every inner corner of a polyline with an arc (steps under step_deg)."""
    out = [points[0]]
    for k in range(1, len(points) - 1):
        p, a_pt, b_pt = points[k], points[k - 1], points[k + 1]
        la, lb = math.dist(p, a_pt), math.dist(p, b_pt)
        a, b = unit(sub(p, a_pt)), unit(sub(b_pt, p))
        delta = math.acos(max(-1.0, min(1.0, dot(a, b))))
        if delta < 1e-3:
            out.append(p)
            continue
        r = min(radius, 0.45 * min(la, lb) / math.tan(delta / 2))
        d = r * math.tan(delta / 2)
        start, end = sub(p, mul(a, d)), add(p, mul(b, d))
        center = add(p, mul(unit(sub(b, a)), r / math.cos(delta / 2)))
        vs, ve = sub(start, center), sub(end, center)
        steps = max(1, math.ceil(math.degrees(delta) / step_deg))
        for i in range(steps + 1):
            t = i / steps
            w1 = math.sin((1 - t) * delta) / math.sin(delta)
            w2 = math.sin(t * delta) / math.sin(delta)
            out.append(add(center, add(mul(vs, w1), mul(ve, w2))))
    out.append(points[-1])
    return out


def tube(bm, points, radius, sides=16, normal=None, normals=None, closed=False, caps=True):
    """Round tube through points. `normal` (one vector) or `normals` (one per point) sets
    the ring orientation; it is made square to the path at each point."""
    rings = []
    count = len(points)
    for k, p in enumerate(points):
        if closed:
            q, o = points[(k + 1) % count], points[(k - 1) % count]
        else:
            q, o = points[min(k + 1, count - 1)], points[max(k - 1, 0)]
        t = unit(sub(q, o))
        if normals:
            u = normals[k]
        elif normal:
            u = normal
        else:
            u = (0.0, 0.0, 1.0) if abs(t[2]) < 0.9 else (0.0, 1.0, 0.0)
            u = cross(t, u)
        u = unit(sub(u, mul(t, dot(u, t))))
        v = cross(t, u)
        rings.append([
            bm.verts.new(add(p, mul(add(mul(u, math.cos(a)), mul(v, math.sin(a))), radius)))
            for a in (2 * math.pi * s / sides for s in range(sides))
        ])
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if closed else [])
    for a, b in pairs:
        for s in range(sides):
            j = (s + 1) % sides
            bm.faces.new((a[s], a[j], b[j], b[s]))
    if caps and not closed:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])


def chaikin(points, rounds=4, closed=True):
    """Corner cutting: rounds a polyline's corners into smooth curves."""
    for _ in range(rounds):
        out = []
        n = len(points)
        for k in range(n if closed else n - 1):
            a, b = points[k], points[(k + 1) % n]
            out.append(tuple(0.75 * p + 0.25 * q for p, q in zip(a, b)))
            out.append(tuple(0.25 * p + 0.75 * q for p, q in zip(a, b)))
        if not closed:
            out = [points[0]] + out + [points[-1]]
        points = out
    return points


def densify(points, step, closed=True):
    """Extra points so no segment is longer than `step` (param-space units)."""
    out = []
    n = len(points)
    for k in range(n if closed else n - 1):
        a, b = points[k], points[(k + 1) % n]
        m = max(1, math.ceil(math.dist(a, b) / step))
        out.extend(tuple(p + (q - p) * i / m for p, q in zip(a, b)) for i in range(m))
    if not closed:
        out.append(points[-1])
    return out


def surface_tube(bm, uv, radius, side=1, closed=True):
    """A tube lying on the cabin along a path of (x, angle) points, `side` -1 mirrors it
    to the right."""
    pts, nrms = [], []
    for x, th in uv:
        n = cabin_normal(x, th)
        p = add(cabin_point(x, th), mul(n, radius + 0.006))
        if side < 0:
            p, n = (p[0], -p[1], p[2]), (n[0], -n[1], n[2])
        pts.append(p)
        nrms.append(n)
    tube(bm, pts, radius, sides=16, normals=nrms, closed=closed)


def _loop(x0, x1_of, th0, th1):
    """Rounded loop in (x, angle) space: rear edge at x0, front edge x1_of(angle)."""
    k = 8
    corners = []
    corners += [(x0, th0 + (th1 - th0) * i / k) for i in range(k)]
    corners += [(x0 + (x1_of(th1) - x0) * i / k, th1) for i in range(k)]
    corners += [(x1_of(th1 - (th1 - th0) * i / k), th1 - (th1 - th0) * i / k) for i in range(k)]
    corners += [(x1_of(th0) + (x0 - x1_of(th0)) * i / k, th0) for i in range(k)]
    # Round the corners in (x, arc length) space, so a corner turns the same in both.
    arc = 0.6  # meters per radian round the cabin side
    pts = chaikin([(x, th * arc) for x, th in corners], rounds=5)
    return [(x, a / arc) for x, a in densify(pts, 0.008)]


def door_frames(bm):
    """Door outline on both sides (its front edge follows the windscreen line) and the
    window line across it."""
    th0, th1 = math.radians(-45), math.radians(45)
    x0 = -0.55
    front = lambda th: cut_x(th) - 0.06  # noqa: E731
    for side in (1, -1):
        surface_tube(bm, _loop(x0, front, th0, th1), 0.011, side)
        th = math.radians(-4)
        line = [(x0 + 0.02 + (front(th) - 0.02 - x0 - 0.02) * i / 30, th) for i in range(31)]
        surface_tube(bm, line, 0.008, side, closed=False)


def access_panels(bm):
    """Engine access panel outlines on both sides of the aft cabin."""
    th0, th1 = math.radians(-32), math.radians(30)
    for side in (1, -1):
        surface_tube(bm, _loop(-1.38, lambda th: -0.78, th0, th1), 0.008, side)


def center_post(bm):
    """Windscreen center post down the canopy."""
    th = math.pi / 2
    x0 = cut_x(th) + GAP / 2 + 0.04
    x1 = 1.5
    uv = [(x1 - (x1 - x0) * (1 - i / 50) ** 1.5, th) for i in range(51)]
    pts, nrms = [], []
    for x, t in uv:
        n = cabin_normal(x, t)
        pts.append(add(cabin_point(x, t), mul(n, 0.014 + 0.006)))
        nrms.append(n)
    tube(bm, pts, 0.014, normals=nrms)


# ---------- roof fairing ----------

def fairing_shape(x):
    """(half-width, height) of the transmission fairing at x: an ellipse in plan."""
    f = (x - (XF0 + XF1) / 2) / ((XF1 - XF0) / 2)
    k = max(0.0, 1 - f * f) ** 0.5
    return FW * k, FH * k**0.8


def fairing_z(x, y):
    """Height of the fairing's top surface at (x, y) (the roof outside it)."""
    if not XF0 < x < XF1:
        return roof_z(x, y)
    w, h = fairing_shape(x)
    q = min(abs(y) / max(w, 1e-9), 1.0)
    return roof_z(x, y) + 0.01 + h * (1 - q**NF) ** (1 / NF)


def fairing(bm):
    """A rounded hump on the roof under the rotor head, a centimeter off the roof (its
    bottom edge draws the seam)."""
    cols = 36
    rows = []
    stations = 40
    for i in range(1, stations):
        phi = math.pi * i / stations
        x = (XF0 + XF1) / 2 - math.cos(phi) * (XF1 - XF0) / 2
        w, h = fairing_shape(x)
        row = []
        for c in range(cols + 1):
            a = math.pi * c / cols
            y = w * spow(math.cos(a), 2 / NF)
            z = roof_z(x, y) + 0.01 + h * abs(math.sin(a)) ** (2 / NF)
            row.append(bm.verts.new((x, y, z)))
        rows.append(row)
    _skin(bm, rows, closed=False)
    for end, x in ((rows[0], XF0), (rows[-1], XF1)):
        tip = bm.verts.new((x, 0.0, roof_z(x, 0.0) + 0.01))
        for c in range(cols):
            bm.faces.new((end[c], end[c + 1], tip))


# ---------- lathe and boxes ----------

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


def rounded_disc(length, r, fillet_r, steps=6):
    """Closed lathe profile of a short cylinder with both outer edges rounded."""
    prof = [(0.0, 0.0)]
    for k in range(steps + 1):
        a = math.pi / 2 * k / steps
        prof.append((fillet_r - fillet_r * math.cos(a), r - fillet_r + fillet_r * math.sin(a)))
    for k in range(steps + 1):
        a = math.pi / 2 * k / steps
        prof.append((length - fillet_r + fillet_r * math.sin(a), r - fillet_r + fillet_r * math.cos(a)))
    prof.append((length, 0.0))
    return prof


def obox(bm, center, axes, half):
    vs = []
    for d in [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]:
        vs.append(bm.verts.new(tuple(center[i] + sum(d[k] * half[k] * axes[k][i] for k in range(3)) for i in range(3))))
    for f in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]:
        bm.faces.new([vs[i] for i in f])


# ---------- airfoils ----------

def airfoil(chord, thick, step_deg=15):
    """Closed airfoil section as (along-chord, thickness) points: two half-ellipses, the
    leading edge at +chord/4 and the trailing edge at -3 chord/4, sampled by normal angle
    so every step turns the surface by the same 15 degrees."""
    b = thick / 2
    pts = []
    for k in range(int(360 / step_deg)):
        psi = math.radians(k * step_deg)
        c, s = math.cos(psi), math.sin(psi)
        a = 0.25 * chord if c >= 0 else 0.75 * chord
        d = math.sqrt(a * a * c * c + b * b * s * s)
        pts.append((a * a * c / d, b * b * s / d))
    return pts


def loft(bm, sections, cap=True):
    rings = [[bm.verts.new(p) for p in sec] for sec in sections]
    _skin(bm, rings)
    if cap:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])


# ---------- parts ----------

def boom_radius(x):
    return RB0 + (RB1 - RB0) * (x - XB0) / (XE - XB0)


GEAR_Y0 = None  # set in build_boom: the tail gearbox's outer face


def build_boom():
    global GEAR_Y0
    bm = bmesh.new()
    lathe(bm, [(0.0, 0.0), (0.0, RB0), (XE - XB0, RB1), (XE - XB0, 0.0)], (XB0, 0.0, ZB), "x", seg=48)
    # Tail gearbox: a rounded drum on the left of the boom end, a gap off the boom.
    y0 = boom_radius(XTR + 0.06) + 0.008
    lathe(bm, rounded_disc(0.075, 0.06, 0.02), (XTR, y0, ZB), "y", seg=48)
    GEAR_Y0 = y0 + 0.075
    new_object("boom", bm)


def build_fin():
    """Swept upper fin, short lower fin with a tail skid, and a horizontal stabilizer on
    both sides, all clear of the boom."""
    bm = bmesh.new()

    def vertical(x_le0, x_le1, chord0, chord1, z0, z1, thick):
        secs = []
        for i in range(9):
            t = i / 8
            z = z0 + (z1 - z0) * t
            x_le = x_le0 + (x_le1 - x_le0) * t
            c = chord0 + (chord1 - chord0) * t
            secs.append([(x_le - c / 4 + a, y, z) for a, y in airfoil(c, thick * c)])
        loft(bm, secs)

    top_root = ZB + boom_radius(-4.28) + GAP
    vertical(-4.28, -4.64, 0.52, 0.3, top_root, ZB + 0.8, 0.1)
    bot_root = ZB - boom_radius(-4.42) - GAP
    vertical(-4.42, -4.52, 0.34, 0.24, bot_root, ZB - 0.42, 0.1)
    # Tail skid: a bent tube from under the lower fin, back and down, guarding the rotor.
    z0 = ZB - 0.42 - 0.012 - 0.006
    pts = fillet([(-4.56, 0.0, z0), (-4.6, 0.0, z0 - 0.12), (-4.98, 0.0, z0 - 0.2)], 0.12)
    tube(bm, pts, 0.012, normal=Y)
    # Horizontal stabilizer, both sides.
    for side in (1, -1):
        secs = []
        y0 = boom_radius(-3.55) + GAP
        for i in range(7):
            t = i / 6
            y = side * (y0 + (0.56 - y0) * t)
            c = 0.3 - 0.08 * t
            x_le = -3.55 - 0.06 * t
            secs.append([(x_le - c / 4 + a, y, ZB + zz) for a, zz in airfoil(c, 0.1 * c)])
        loft(bm, secs)
    new_object("fin", bm, smooth=True)


def build_skids():
    bm = bmesh.new()
    r, track = 0.032, 0.95
    for side in (-1, 1):
        y = track * side
        pts = fillet([(-1.42, y, 0.11), (-1.12, y, r), (1.0, y, r), (1.3, y, 0.3)], 0.28, step_deg=8)
        tube(bm, pts, r, normal=Y)
    for xs in (-0.42, 0.7):
        z_top = BOT0 - GAP - 0.028
        leg = []
        for side in (1, -1):
            # saddle clamp on top of the skid, the leg standing on it
            obox(bm, (xs, side * track, 2 * r + 0.004), (X, Y, Z), (0.045, 0.026, 0.008))
            foot = 2 * r + 0.012 + 0.006
            pts = [(xs, side * track, foot), (xs, side * track, 0.16), (xs, side * 0.74, 0.42), (xs, side * 0.5, z_top)]
            leg.append(pts)
        path = leg[0] + [(xs, 0.0, z_top)] + leg[1][::-1]
        tube(bm, fillet(path, 0.14, step_deg=9), 0.028, normal=X)
    new_object("skids", bm)


def _max_over(fn, cx, cy, r):
    return max(fn(cx + r * math.cos(a) * k, cy + r * math.sin(a) * k) for a in (i * math.pi / 8 for i in range(16)) for k in (0.0, 0.5, 1.0))


def build_mast():
    bm = bmesh.new()
    z0 = _max_over(fairing_z, XM, 0.0, MAST_R) + GAP
    z1 = HZ - 0.14 - GAP
    lathe(bm, [(0.0, 0.0), (0.0, MAST_R), (z1 - z0, MAST_R), (z1 - z0, 0.0)], (XM, 0.0, z0), "z")
    new_object("mast", bm)


def build_rods():
    bm = bmesh.new()
    for dx, dy in ROD_AT:
        x, y = XM + dx, dy
        z0 = _max_over(fairing_z, x, y, 0.014) + GAP
        tube(bm, [(x, y, z0), (x, y, SL0 - GAP)], 0.012)
    new_object("rods", bm)


def ring_plate(bm, z0, z1, r_in, r_out):
    lathe(bm, [(0.0, r_in), (0.0, r_out), (z1 - z0, r_out), (z1 - z0, r_in)], (XM, 0.0, z0), "z", seg=64)


def build_swash():
    bm = bmesh.new()
    ring_plate(bm, SL0, SL1, 0.072, 0.2)
    for a in (0, 90, 180, 270):  # arms out to the control rods (one spare at the front)
        u = (math.cos(math.radians(a)), math.sin(math.radians(a)), 0.0)
        w = (-u[1], u[0], 0.0)
        obox(bm, (XM + u[0] * 0.235, u[1] * 0.235, SL0 + 0.015), (u, w, Z), (0.04, 0.022, 0.015))
    new_object("swashLower", bm)

    bm = bmesh.new()
    ring_plate(bm, SU0, SU1, 0.072, 0.16)
    for sx, sy in (LINK_AT, (-LINK_AT[0], -LINK_AT[1])):  # lugs out to each pitch link
        d = math.hypot(sx, sy)
        u = (sx / d, sy / d, 0.0)
        w = (-u[1], u[0], 0.0)
        lo, hi = 0.15, d + 0.03
        obox(bm, (XM + u[0] * (lo + hi) / 2, u[1] * (lo + hi) / 2, (SU0 + SU1) / 2), (u, w, Z), ((hi - lo) / 2, 0.03, (SU1 - SU0) / 2))
    new_object("swashUpper", bm)

    bm = bmesh.new()
    top = HORN_Z0 - 0.006
    for sx, sy in (LINK_AT, (-LINK_AT[0], -LINK_AT[1])):
        x, y = XM + sx, sy
        # rod ends: a ball joint at each end, the rod between
        tube(bm, [(x, y, SU1 + GAP), (x, y, top)], 0.011)
        for z in (SU1 + GAP + 0.03, top - 0.03):
            lathe(bm, rounded_disc(0.034, 0.017, 0.008, steps=4), (x, y, z - 0.017), "z", seg=32)
    new_object("links", bm)


HUB_HALF_Z = 0.035  # yoke half-height
GRIP_HALF_Z = 0.042
HORN_Z0 = HZ - GRIP_HALF_Z  # pitch horn bottom


def build_hub():
    bm = bmesh.new()
    # barrel round the mast top, under the yoke
    lathe(bm, rounded_disc(0.1, 0.08, 0.02), (XM, 0.0, HZ - HUB_HALF_Z - 0.1), "z", seg=48)
    # yoke and the teeter bolt heads on both sides
    obox(bm, (XM, 0.0, HZ), (X, Y, Z), (0.2, 0.045, HUB_HALF_Z))
    for side in (1, -1):
        lathe(bm, rounded_disc(0.022, 0.028, 0.008, steps=4), (XM, side * 0.045 + (0.0 if side > 0 else -0.022), HZ), "y", seg=32)
    # mast nut on top
    lathe(bm, rounded_disc(0.04, 0.045, 0.012, steps=4), (XM, 0.0, HZ + HUB_HALF_Z), "z", seg=48)
    for side in (1, -1):
        # blade grip
        obox(bm, (XM + side * (0.2 + GRIP_END) / 2, 0.0, HZ), (X, Y, Z), ((GRIP_END - 0.2) / 2, 0.065, GRIP_HALF_Z))
        # pitch horn out to the leading edge side, the link under its tip
        hx, hy = XM + side * LINK_AT[0], side * LINK_AT[1]
        y_in = side * 0.065
        obox(bm, (hx, (y_in + hy + side * 0.03) / 2, HORN_Z0 + 0.012), (X, Y, Z), (0.03, abs(hy + side * 0.03 - y_in) / 2, 0.012))
    new_object("hub", bm, smooth=True)


def build_blades():
    """Airfoil blades: a narrow, thick root fitting into the grip, widening to the full
    chord by 0.85 m, 6 degrees of washout to the tip, square tip."""
    r0 = GRIP_END + GAP
    radii = [r0 + (0.85 - r0) * i / 10 for i in range(10)] + [0.85 + (SPAN - 0.85) * i / 20 for i in range(21)]
    secA = []
    for r in radii:
        t = smooth((r - r0) / (0.85 - r0))
        chord = 0.12 + (CHORD - 0.12) * t
        thick = 0.042 + (THICK - 0.042) * t
        twist = math.radians(4.0 - 6.0 * max(0.0, (r - 0.85) / (SPAN - 0.85)))
        ring = []
        for a, b in airfoil(chord, thick):
            y = a * math.cos(twist) - b * math.sin(twist)
            z = a * math.sin(twist) + b * math.cos(twist)
            ring.append((XM + r, y, HZ + z))
        secA.append(ring)
    for name, side in (("bladeA", 1), ("bladeB", -1)):
        bm = bmesh.new()
        secs = secA if side > 0 else [[(2 * XM - x, -y, z) for x, y, z in ring] for ring in secA]
        loft(bm, secs)
        new_object(name, bm)


def build_tail_rotor():
    bm = bmesh.new()
    y0 = GEAR_Y0 + GAP
    lathe(bm, [(0.0, 0.0), (0.0, 0.025), (0.05, 0.025), (0.05, 0.0)], (XTR, y0, ZB), "y", seg=32)
    yh = y0 + 0.05 + 0.02
    obox(bm, (XTR, yh, ZB), (X, Y, Z), (0.04, 0.02, 0.085))
    for side in (1, -1):
        secs = []
        for i in range(9):
            r = 0.085 + (TR_R - 0.085) * i / 8
            c = 0.075 + 0.025 * smooth(i / 3)
            secs.append([(XTR + side * a, yh + b, ZB + side * r) for a, b in airfoil(c, 0.12 * c)])
        loft(bm, secs)
    new_object("tailRotor", bm)


def arrow(bm, base, tip_z, r=0.035, head_r=0.09, head_len=0.22):
    """Vertical arrow from base (x, y, z) up to tip_z."""
    x, y, z0 = base
    shaft_top = tip_z - head_len - 0.006
    lathe(bm, [(0.0, 0.0), (0.0, r), (shaft_top - z0, r), (shaft_top - z0, 0.0)], (x, y, z0), "z", seg=32)
    lathe(bm, [(tip_z - head_len - z0, 0.0), (tip_z - head_len - z0, head_r), (tip_z - z0, 0.0)], (x, y, z0), "z", seg=32)


def build_lift():
    bm = bmesh.new()
    arrow(bm, (XM, 0.0, HZ + 0.22), HZ + 1.9, r=0.06, head_r=0.16, head_len=0.36)
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


def report():
    objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    lo = [min(v.co[i] for o in objs for v in o.data.vertices) for i in range(3)]
    hi = [max(v.co[i] for o in objs for v in o.data.vertices) for i in range(3)]
    print("[helicopter] extent " + " ".join(f"{a}: {l:.3f}..{h:.3f} ({h - l:.3f})" for a, l, h in zip("xyz", lo, hi)))


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "helicopter.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_cabin()
    build_boom()
    build_fin()
    build_skids()
    build_mast()
    build_rods()
    build_swash()
    build_hub()
    build_blades()
    build_tail_rotor()
    build_lift()
    build_arc()
    report()
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[helicopter] wrote {out}")


main()
