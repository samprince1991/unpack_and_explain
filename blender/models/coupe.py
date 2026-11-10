"""Procedural low two-seat sports coupe with cold-gas thrusters (our own model, license "own").

A generic wedge coupe, not a copy of any real car and with no badges: one smooth body shell
(lower body and greenhouse in one loft, wheel arches pressed up into it), four wheels, a
floor pan, a stack of compressed-air tanks behind the seats, and ten small thruster nozzles
under the sills and the tail, angled down and out.

Axis: X forward (the nose points to +X), Z up, the ground at Z = 0. Parts:

- body:    the shell (an `away` part: explode removes it so the inside shows)
- glass:   windshield, side windows and rear window, panels just proud of the shell (away)
- lights:  headlights and the tail-light bar (away)
- trim:    side skirts and the side intakes behind the doors (away)
- wing:    the rear wing on two struts (away)
- floor:   the floor pan inside the shell
- cabin:   two seats and the steering wheel
- tanks:   five air tanks lying across the car, stacked behind the seats
- pipes:   air lines from the tanks to the nozzles
- wheels:  four tires with multi-spoke rims
- nozzle:  the key nozzle, under the right-hand sill (-Y side), the one the close-up shows
- nozzles: seven more sill nozzles
- rear:    the two nozzles under the tail
- jet:     the air cone out of the key nozzle (appear-only)
- jets:    the cones out of the other nine (appear-only)
- push:    a big arrow up over the roof: the car pushed the other way (appear-only)

Glass, lights and trim are thin panels laid over the shell a few millimetres out along its
normal, sampled from the same surface maths, so their open edges draw the window, lamp and
skirt outlines without cutting into the shell.

Parts never cross: each sits clear of the next with a small gap (blender/qc.py). Curves are
finely segmented so no edge bends 28-80 degrees.

  blender -b --factory-startup --python blender/models/coupe.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

GAP = 0.012

# body plan and height
LX = 2.1  # half length
W = 0.95  # half width
ZB = 0.13  # body bottom
N_FRONT, N_REAR = 5.0, 6.0  # plan superellipse exponents: rounder nose, squarer tail
SEC = 256  # points around a section

# wheels
R = 0.27
AXLE_Z = R
AXLES = (1.32, -1.32)
TIRE_OUT, TIRE_W = 0.9, 0.24  # outer face y and tire width
ARCH_GAP = 0.045
ARCH_A, ARCH_B = 0.22, 0.56  # arch top is flat to A from the axle, back down by B
POCKET_Y0, POCKET_Y1 = 0.3, 0.64  # the arch pocket's inner wall ramps up between these

# cabin hump (greenhouse) on top of the belt line
CAB_H = 0.33
CAB_FRONT0, CAB_FRONT1 = 0.8, -0.05  # windshield: rises from x0 to x1
CAB_REAR0, CAB_REAR1 = -1.3, -0.5  # rear window: rises from x0 to x1
CAB_TAPER = 0.36  # greenhouse narrower than the body

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


def smooth(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def spow(v, p):
    return math.copysign(abs(v) ** p, v)


# ---------- body ----------

def plan(x):
    """0-1 plan factor along the car: 1 in the middle, 0 at the nose and the tail."""
    u = x / LX
    n = N_FRONT if u > 0 else N_REAR
    return max(1 - abs(u) ** n, 0.0) ** (1 / n)


def belt(x):
    """Belt-line height: a wedge, low at the nose, the tail just a little lower."""
    return 0.8 - 0.13 * smooth(0.25, 1.0, x / LX) - 0.03 * smooth(-0.55, -1.0, x / LX)


def cabin(x):
    return CAB_H * smooth(CAB_FRONT0, CAB_FRONT1, x) * smooth(CAB_REAR0, CAB_REAR1, x)


def arch_lift(x):
    """How far the arch pocket presses the body bottom up at x (0 away from the wheels)."""
    lift = AXLE_Z + R + ARCH_GAP - ZB
    out = 0.0
    for ax in AXLES:
        out = max(out, lift * (1 - smooth(ARCH_A, ARCH_B, abs(x - ax))))
    return out


def _shape(x):
    """The section's unlifted shape at x as a function of the angle a around it."""
    g = plan(x)
    top0 = belt(x)
    zc = (ZB + top0) / 2
    hh = (top0 - ZB) / 2 * g**0.6
    w = W * g
    cab = cabin(x) * g
    w_top = w * (1 - CAB_TAPER * cab / CAB_H)
    h_top = hh + cab
    n = 4.0

    def at(a):
        c, s = math.cos(a), math.sin(a)
        if s >= 0:
            # Upper half: the greenhouse, its width eased in from the body's at the shoulder.
            f = smooth(0.0, 0.5, s)
            return (w + (w_top - w) * f) * spow(c, 2 / n), zc + h_top * spow(s, 2 / n)
        return w * spow(c, 2 / n), zc + hh * spow(s, 2 / n)

    return at, zc, hh, h_top


def _angles(count=SEC):
    """One list of angles used by every section, so point i is the same place around every
    section and the loft never twists. Spaced by arc length on the section over a front
    wheel, with points bunched where the arch pocket's inner wall ramps up."""
    at, zc, _, _ = _shape(AXLES[0])
    dense = [2 * math.pi * k / 8000 for k in range(8001)]
    pts = [at(a) for a in dense]
    run = [0.0]
    for p, q in zip(pts, pts[1:]):
        my, mz = (p[0] + q[0]) / 2, (p[1] + q[1]) / 2
        weight = 1.0
        if mz < zc and POCKET_Y0 - 0.06 <= abs(my) <= POCKET_Y1 + 0.06:
            weight = 7.0  # the pocket's inner wall
        elif mz < zc + 0.1 and abs(my) > POCKET_Y1 + 0.06:
            weight = 3.0  # the lower side, squeezed into the fender lip over the wheels
        run.append(run[-1] + math.dist(p, q) * weight)
    out, j = [], 0
    for i in range(count):
        target = run[-1] * i / count
        while run[j + 1] < target:
            j += 1
        f = (target - run[j]) / max(run[j + 1] - run[j], 1e-12)
        out.append(dense[j] + (dense[j + 1] - dense[j]) * f)
    return out


ANGLES = _angles()


def section(x):
    """Closed section at x: lower half a superellipse of the body, upper half the narrower,
    taller greenhouse; the arch pocket then lifts the bottom near the sides."""
    at, zc, hh, h_top = _shape(x)
    pts = [at(a) for a in ANGLES]
    # Arch pocket: lift the bottom near the sides, squeezing the side up toward the belt.
    lift = arch_lift(x)
    top = zc + h_top
    bot = zc - hh
    out = []
    span = (zc + hh) - bot
    for yy, zz in pts:
        if lift > 0 and zz < zc + hh:
            ramp = smooth(POCKET_Y0, POCKET_Y1, abs(yy))
            zz = zz + lift * ramp * _falloff((zz - bot) / span)
        out.append((x, yy, zz))
    return out, top


FALL_T1 = 0.7


def _falloff(t):
    """1 at the body bottom, 0 at the belt, with no kink at the belt: a straight fall to
    FALL_T1, then a slope easing to zero (so the side doesn't crease where the lift ends)."""
    t = min(max(t, 0.0), 1.0)
    c = 2 / (1 + FALL_T1)
    if t <= FALL_T1:
        return 1 - c * t
    r = (1 - t) / (1 - FALL_T1)
    return c * (1 - FALL_T1) / 2 * r * r


def body_xs():
    """Section positions: dense through the arches and toward the ends."""
    end_u = 0.86
    xs = set()
    x = -LX * end_u
    while x < LX * end_u:
        xs.add(round(x, 6))
        near_arch = any(abs(x - ax) < ARCH_B + 0.08 for ax in AXLES)
        x += 0.008 if near_arch else 0.025
    # The ends follow the plan superellipse by angle (u = cos^(2/n), g = sin^(2/n)), so
    # the nose and tail round off in even steps right down to the tip.
    for sign, n in ((1, N_FRONT), (-1, N_REAR)):
        phi0 = math.acos(end_u ** (n / 2))
        steps = 60
        for k in range(1, steps + 1):
            phi = phi0 * k / steps
            xs.add(round(sign * LX * math.cos(phi) ** (2 / n), 6))
    return sorted(v for v in xs if -LX < v < LX)


def build_body():
    bm = bmesh.new()
    rings = []
    for x in body_xs():
        pts, _ = section(x)
        rings.append([bm.verts.new(p) for p in pts])
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    for ring, x in ((rings[0], -LX), (rings[-1], LX)):
        zs = [v.co.z for v in ring]
        tip = bm.verts.new((x, 0.0, sum(zs) / len(zs)))
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ring[i], ring[j], tip))
    new_object("body", bm)


def body_bottom(x, y):
    """Height of the body's underside at (x, y)."""
    pts, _ = section(x)
    best = None
    lower = [(p[1], p[2]) for p in pts if p[2] < (ZB + belt(x)) / 2]
    for (ya, za), (yb, zb) in zip(lower, lower[1:]):
        if min(ya, yb) <= y <= max(ya, yb) and ya != yb:
            z = za + (zb - za) * (y - ya) / (yb - ya)
            best = z if best is None else min(best, z)
    if best is None:
        raise SystemExit(f"[coupe] no underside at x={x}, y={y}")
    return best


# ---------- lathes and helpers ----------

def lathe(bm, profile, origin, axis, seg=96, closed=False):
    """Revolve an open (along, radius) profile around `axis` through `origin`, or a closed
    one (a ring) with `closed`. Points with radius 0 become poles."""
    ax = axis
    up = (0.0, 0.0, 1.0) if abs(ax[2]) < 0.9 else (1.0, 0.0, 0.0)
    u = (ax[1] * up[2] - ax[2] * up[1], ax[2] * up[0] - ax[0] * up[2], ax[0] * up[1] - ax[1] * up[0])
    un = math.sqrt(sum(c * c for c in u))
    u = tuple(c / un for c in u)
    v = (ax[1] * u[2] - ax[2] * u[1], ax[2] * u[0] - ax[0] * u[2], ax[0] * u[1] - ax[1] * u[0])
    poles = {}
    rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        ca, sa = math.cos(a), math.sin(a)
        ring = []
        for i, (t, r) in enumerate(profile):
            if r == 0:
                if i not in poles:
                    poles[i] = bm.verts.new(tuple(origin[k] + ax[k] * t for k in range(3)))
                ring.append(poles[i])
            else:
                ring.append(bm.verts.new(tuple(origin[k] + ax[k] * t + r * (ca * u[k] + sa * v[k]) for k in range(3))))
        rings.append(ring)
    n = len(profile)
    for s in range(seg):
        ra, rb = rings[s], rings[(s + 1) % seg]
        for i in range(n if closed else n - 1):
            i1 = (i + 1) % n
            quad = [ra[i], ra[i1], rb[i1], rb[i]]
            uniq = []
            for q in quad:
                if q not in uniq:
                    uniq.append(q)
            if len(uniq) >= 3:
                bm.faces.new(uniq)


def rounded_profile(t0, t1, r_in, r_out, fillet, steps=8):
    """Closed (along, radius) profile of a solid rounded cylinder from t0 to t1, open in the
    middle down to r_in (0 = solid, with poles on the axis)."""
    pts = [(t0, r_in)]
    for k in range(steps + 1):  # t0 face rounds onto the rim
        a = math.radians(90 * k / steps)
        pts.append((t0 + fillet - fillet * math.cos(a), r_out - fillet + fillet * math.sin(a)))
    for k in range(steps + 1):
        a = math.radians(90 * k / steps)
        pts.append((t1 - fillet + fillet * math.sin(a), r_out - fillet + fillet * math.cos(a)))
    pts.append((t1, r_in))
    return pts


def norm(v):
    n = math.sqrt(sum(c * c for c in v))
    return tuple(c / n for c in v)


# ---------- parts ----------

RIM_IN, RIM_OUT = 0.15, 0.2
SPOKES = 5


def build_wheels():
    """Tires, then just outside each outer face a rim ring, ten spokes in five pairs and a cap."""
    bm = bmesh.new()
    for ax in AXLES:
        for side in (1, -1):
            y_out = side * TIRE_OUT
            y_in = side * (TIRE_OUT - TIRE_W)
            t0, t1 = sorted((y_in, y_out))
            lathe(bm, rounded_profile(0.0, t1 - t0, 0.0, R, 0.06, steps=8), (ax, t0, AXLE_Z), Y, seg=96)
            # Outward from the tire face, standing off by a gap: rim ring, spokes, cap.
            out = (0.0, float(side), 0.0)
            face = y_out + side * 0.008
            ring = rounded_profile(0.0, 0.022, RIM_IN, RIM_OUT, 0.008, steps=6)
            lathe(bm, ring, (ax, face, AXLE_Z), out, seg=96, closed=True)
            cap = rounded_profile(0.0, 0.03, 0.0, 0.05, 0.01, steps=6)
            lathe(bm, cap, (ax, face, AXLE_Z), out, seg=48)
            for k in range(SPOKES):
                for d in (-0.13, 0.13):
                    a = 2 * math.pi * k / SPOKES + d
                    radial = (math.cos(a), 0.0, math.sin(a))
                    tangent = (-math.sin(a), 0.0, math.cos(a))
                    mid = (0.05 + RIM_IN) / 2 + 0.004
                    half = (RIM_IN - 0.05) / 2 + 0.006
                    center = (ax + radial[0] * mid, face + side * 0.011, AXLE_Z + radial[2] * mid)
                    obox(bm, center, (radial, tangent, out), (half, 0.011, 0.009))
    new_object("wheels", bm)


FLOOR_X0, FLOOR_X1, FLOOR_Y = -1.55, 1.55, 0.27
FLOOR_Z0, FLOOR_Z1 = ZB + 0.025, ZB + 0.055


def build_floor():
    """A thin slab with rounded corners in plan and rounded edges."""
    bm = bmesh.new()
    cx = (FLOOR_X0 + FLOOR_X1) / 2
    a, b = (FLOOR_X1 - FLOOR_X0) / 2, FLOOR_Y
    rings = []
    edge = (FLOOR_Z1 - FLOOR_Z0) / 2
    steps = 8
    for k in range(steps + 1):
        ang = math.radians(-90 + 180 * k / steps)
        inset = edge - edge * math.cos(ang)
        z = FLOOR_Z0 + edge + edge * math.sin(ang)
        ring = []
        for s in range(160):
            t = 2 * math.pi * s / 160
            c, si = math.cos(t), math.sin(t)
            ring.append(bm.verts.new((cx + (a - inset) * spow(c, 0.25), (b - inset) * spow(si, 0.25), z)))
        rings.append(ring)
    n = len(rings[0])
    for p, q in zip(rings, rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((p[i], p[j], q[j], q[i]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    new_object("floor", bm)


TANK_R, TANK_HALF = 0.115, 0.58
TANKS = [(-0.68, 0.0), (-0.44, 0.0), (-0.2, 0.0), (-0.56, 1.0), (-0.32, 1.0)]  # (x, row)


def build_tanks():
    """Capsules lying across the car: three on the floor, two on top."""
    bm = bmesh.new()
    z0 = FLOOR_Z1 + GAP + TANK_R
    for x, row in TANKS:
        z = z0 + row * (2 * TANK_R * 0.87 + 0.006)
        lathe(bm, _clean_capsule(TANK_HALF, TANK_R), (x, 0.0, z), Y, seg=64)
    new_object("tanks", bm)


def _clean_capsule(half, r, steps=12):
    """(along, radius) profile of a capsule from pole to pole."""
    pts = []
    for k in range(steps + 1):
        a = math.radians(90 * k / steps)
        pts.append((-half + r - r * math.cos(a), r * math.sin(a)))
    for k in range(steps, -1, -1):
        a = math.radians(90 * k / steps)
        pts.append((half - r + r * math.cos(a), r * math.sin(a)))
    # drop the repeated rim point where the two ends meet the straight middle
    out = []
    for p in pts:
        if not out or math.dist(out[-1], p) > 1e-9:
            out.append(p)
    return out


SILL_Y = 0.7
SILL_XS = (-0.62, -0.2, 0.22, 0.64)
KEY_NOZZLE = (0.22, -1)  # x, side: the -Y side faces the camera's default yaw
REAR_XS, REAR_Y = -1.86, 0.34
NOZZLE_LEN = 0.075
NOZZLE_R0, NOZZLE_R1 = 0.028, 0.05
SILL_TILT = math.radians(28)  # down and outward
REAR_TILT = math.radians(40)  # down and back
JET_GAP = 0.015
JET_LEN, JET_R = 0.5, 0.12


def nozzle_mounts():
    """(name, top point, axis) for each nozzle: the axis points out of the bell."""
    mounts = []
    for x in SILL_XS:
        for side in (1, -1):
            axis = norm((0.0, side * math.sin(SILL_TILT), -math.cos(SILL_TILT)))
            top = (x, side * SILL_Y, body_bottom(x, side * SILL_Y) - GAP)
            name = "nozzle" if (x, side) == KEY_NOZZLE else "nozzles"
            mounts.append((name, top, axis))
    for side in (1, -1):
        axis = norm((-math.sin(REAR_TILT), 0.0, -math.cos(REAR_TILT)))
        top = (REAR_XS, side * REAR_Y, body_bottom(REAR_XS, side * REAR_Y) - GAP)
        mounts.append(("rear", top, axis))
    return mounts


def _bell(bm, top, axis):
    """A small bell: a short round collar, then a flare that eases out to the exit."""
    # Start a little below the body so the tilted collar's top edge stays clear of it.
    start = tuple(top[k] + axis[k] * 0.03 for k in range(3))
    collar = 0.018
    prof = [(0.0, 0.0), (0.0, NOZZLE_R0), (collar, NOZZLE_R0)]
    for k in range(1, 13):
        f = k / 12
        prof.append((collar + (NOZZLE_LEN - collar) * f, NOZZLE_R0 + (NOZZLE_R1 - NOZZLE_R0) * f * f))
    prof.append((NOZZLE_LEN, 0.0))
    lathe(bm, prof, start, axis, seg=48)
    return tuple(start[k] + axis[k] * NOZZLE_LEN for k in range(3))


def build_nozzles():
    groups = {"nozzle": bmesh.new(), "nozzles": bmesh.new(), "rear": bmesh.new()}
    exits = []
    for name, top, axis in nozzle_mounts():
        exits.append((name, _bell(groups[name], top, axis), axis))
    for name, bm in groups.items():
        new_object(name, bm)
    return exits


def build_jets(exits):
    """Air cones: a point at the nozzle exit, widening out, flat-capped."""
    key, rest = bmesh.new(), bmesh.new()
    for name, exit_pt, axis in exits:
        start = tuple(exit_pt[k] + axis[k] * JET_GAP for k in range(3))
        prof = [(0.0, 0.0)]
        for k in range(1, 13):
            f = k / 12
            prof.append((JET_LEN * f, JET_R * f))
        prof.append((JET_LEN, 0.0))
        lathe(key if name == "nozzle" else rest, prof, start, axis, seg=48)
    new_object("jet", key)
    new_object("jets", rest)


def build_push():
    """A big arrow pointing straight up over the roof."""
    bm = bmesh.new()
    _, roof = section(-0.35)
    z0 = roof + 0.12
    shaft_r, shaft_len = 0.045, 0.34
    head_r, head_len = 0.12, 0.2
    lathe(bm, [(0.0, 0.0), (0.0, shaft_r), (shaft_len, shaft_r), (shaft_len, 0.0)], (-0.35, 0.0, z0), Z, seg=48)
    hz = z0 + shaft_len + 0.008
    lathe(bm, [(0.0, 0.0), (0.0, head_r), (head_len, 0.0)], (-0.35, 0.0, hz), Z, seg=48)
    new_object("push", bm)


# ---------- boxes, tubes and slabs ----------

def obox(bm, center, axes, half):
    vs = []
    for d in [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]:
        vs.append(bm.verts.new(tuple(center[i] + sum(d[k] * half[k] * axes[k][i] for k in range(3)) for i in range(3))))
    for f in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]:
        bm.faces.new([vs[i] for i in f])


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def tube(bm, points, radius, sides=16, closed=False):
    """Round tube through points with a parallel-transported frame (it never twists);
    open tubes get flat caps."""
    count = len(points)
    tangents = []
    for k in range(count):
        q = points[(k + 1) % count] if closed else points[min(k + 1, count - 1)]
        o = points[k - 1] if closed else points[max(k - 1, 0)]
        tangents.append(norm(tuple(q[i] - o[i] for i in range(3))))
    ref = (0.0, 0.0, 1.0) if abs(tangents[0][2]) < 0.9 else (1.0, 0.0, 0.0)
    u = norm(cross(tangents[0], ref))
    rings = []
    for k, p in enumerate(points):
        t = tangents[k]
        d = sum(u[i] * t[i] for i in range(3))
        u = norm(tuple(u[i] - d * t[i] for i in range(3)))
        v = cross(t, u)
        rings.append([
            bm.verts.new(tuple(p[i] + radius * (math.cos(a) * u[i] + math.sin(a) * v[i]) for i in range(3)))
            for a in (2 * math.pi * s / sides for s in range(sides))
        ])
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if closed else [])
    for a, b in pairs:
        for s in range(sides):
            j = (s + 1) % sides
            bm.faces.new((a[s], a[j], b[j], b[s]))
    if not closed:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])


def spline(points, per=24):
    """Catmull-Rom through the points, densely sampled, so pipe bends are smooth."""
    pts = [points[0]] + list(points) + [points[-1]]
    out = []
    for k in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[k - 1], pts[k], pts[k + 1], pts[k + 2]
        for j in range(per):
            t = j / per
            out.append(tuple(
                0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t * t
                       + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t ** 3)
                for i in range(3)
            ))
    out.append(tuple(points[-1]))
    return out


def slab(bm, origin, U, V, W, a, b, t, n=4.0, steps=8, seg=128):
    """Rounded slab: plan a superellipse (half sizes a along U, b along V), thickness t along
    W from `origin`, every edge rounded with radius t / 2."""
    edge = t / 2
    rings = []
    for k in range(steps + 1):
        ang = math.radians(-90 + 180 * k / steps)
        inset = edge - edge * math.cos(ang)
        w = edge + edge * math.sin(ang)
        ring = []
        for j in range(seg):
            q = 2 * math.pi * j / seg
            pu = (a - inset) * spow(math.cos(q), 2 / n)
            pv = (b - inset) * spow(math.sin(q), 2 / n)
            ring.append(bm.verts.new(tuple(origin[i] + U[i] * pu + V[i] * pv + W[i] * w for i in range(3))))
        rings.append(ring)
    for p, q in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            bm.faces.new((p[i], p[j], q[j], q[i]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])


# ---------- panels on the shell ----------

def body_point(x, a):
    """The shell's surface at x and angle a (same maths as `section`), and the section center."""
    at, zc, hh, _ = _shape(x)
    y, z = at(a)
    lift = arch_lift(x)
    bot = zc - hh
    if lift > 0 and z < zc + hh:
        z += lift * smooth(POCKET_Y0, POCKET_Y1, abs(y)) * _falloff((z - bot) / ((zc + hh) - bot))
    return (x, y, z), zc


def surface_out(x, a, off):
    """Shell point at (x, a) moved `off` out along the surface normal."""
    (px, py, pz), zc = body_point(x, a)
    h = 1e-4
    dx = [body_point(x + h, a)[0][i] - body_point(x - h, a)[0][i] for i in range(3)]
    da = [body_point(x, a + h)[0][i] - body_point(x, a - h)[0][i] for i in range(3)]
    n = norm(cross(dx, da))
    if n[0] * px * 0.3 + n[1] * py + n[2] * (pz - zc) < 0:
        n = tuple(-c for c in n)
    return (px + n[0] * off, py + n[1] * off, pz + n[2] * off)


def panel(bm, x0, x1, a0, a1, nx=48, na=24, off=0.006):
    """A panel over the shell from x0 to x1, between angles a0(x) and a1(x) (numbers or functions)."""
    f0 = a0 if callable(a0) else (lambda x, v=a0: v)
    f1 = a1 if callable(a1) else (lambda x, v=a1: v)
    rows = []
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        lo, hi = f0(x), f1(x)
        rows.append([bm.verts.new(surface_out(x, lo + (hi - lo) * j / na, off)) for j in range(na + 1)])
    for r0, r1 in zip(rows, rows[1:]):
        for j in range(na):
            bm.faces.new((r0[j], r1[j], r1[j + 1], r0[j + 1]))


def angle_at(x, z, lo=0.0, hi=math.pi / 2):
    """Angle in the upper (+y) quarter where the shell at x reaches height z."""
    for _ in range(40):
        mid = (lo + hi) / 2
        if body_point(x, mid)[0][2] < z:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def mirror(a):
    """The same place on the other (-y) side."""
    return math.pi - a


def build_glass():
    bm = bmesh.new()

    # Side windows: from just above the belt to just under the roof edge, between the pillars.
    def lo(x):
        return angle_at(x, belt(x) + 0.05)

    def hi(x):
        _, zc, _, h_top = _shape(x)
        return angle_at(x, zc + h_top - 0.08)

    panel(bm, -0.7, 0.18, lo, hi, nx=60, na=16)
    panel(bm, -0.7, 0.18, lambda x: mirror(hi(x)), lambda x: mirror(lo(x)), nx=60, na=16)
    # Windshield and rear window across the top, inside the pillars.
    panel(bm, 0.28, 0.7, 0.62, math.pi - 0.62, nx=40, na=40)
    panel(bm, -1.12, -0.82, 0.62, math.pi - 0.62, nx=30, na=40)
    new_object("glass", bm)


def build_lights():
    bm = bmesh.new()
    panel(bm, 1.86, 2.03, 0.1, 0.5, nx=30, na=16)  # headlights on the top corners of the nose
    panel(bm, 1.86, 2.03, mirror(0.5), mirror(0.1), nx=30, na=16)
    panel(bm, -2.06, -1.97, 0.18, math.pi - 0.18, nx=16, na=60)  # tail-light bar
    new_object("lights", bm)


def build_trim():
    bm = bmesh.new()
    # Side skirts along the lower sill between the arches (the lower quarters).
    panel(bm, -0.66, 0.66, -0.5, -0.14, nx=60, na=12)
    panel(bm, -0.66, 0.66, math.pi + 0.14, math.pi + 0.5, nx=60, na=12)
    # Side intakes behind the doors, at mid height.
    panel(bm, -0.74, -0.52, -0.06, 0.12, nx=16, na=10)
    panel(bm, -0.74, -0.52, mirror(0.12), mirror(-0.06), nx=16, na=10)
    new_object("trim", bm)


def body_top(x, y):
    """Height of the shell's top at (x, y)."""
    pts, _ = section(x)
    best = None
    for (_, ya, za), (_, yb, zb) in zip(pts, pts[1:]):
        if min(ya, yb) <= y <= max(ya, yb) and ya != yb:
            z = za + (zb - za) * (y - ya) / (yb - ya)
            best = z if best is None else max(best, z)
    return best


WING_X, WING_HALF_X, WING_HALF_Y = -1.84, 0.15, 0.74
WING_LIFT = 0.17


def build_wing():
    """A flat rear wing on two struts standing on the tail deck."""
    bm = bmesh.new()
    top = max(body_top(WING_X + d, y) for d in (-WING_HALF_X, 0, WING_HALF_X) for y in (-0.7, 0, 0.7))
    z = top + WING_LIFT
    slab(bm, (WING_X, 0.0, z), X, Y, Z, WING_HALF_X, WING_HALF_Y, 0.03, n=5.0)
    for y in (-0.42, 0.42):
        z0 = max(body_top(WING_X + d, y + e) for d in (-0.05, 0.0, 0.05) for e in (-0.012, 0.012)) + GAP
        obox(bm, (WING_X, y, (z0 + z) / 2), (X, Y, Z), (0.05, 0.012, (z - z0) / 2))
    new_object("wing", bm)


SEAT_Y = 0.32
SEAT_TILT = math.radians(15)


def build_cabin():
    """Two seats, and a steering wheel in front of the left (+y) one."""
    bm = bmesh.new()
    z0 = FLOOR_Z1 + GAP
    up = (-math.sin(SEAT_TILT), 0.0, math.cos(SEAT_TILT))
    back = (-math.cos(SEAT_TILT), 0.0, -math.sin(SEAT_TILT))
    for y in (-SEAT_Y, SEAT_Y):
        slab(bm, (0.32, y, z0), X, Y, Z, 0.2, 0.19, 0.1)  # cushion
        h = 0.5
        origin = (0.1 + up[0] * h / 2, y, z0 + 0.03 + up[2] * h / 2)
        slab(bm, origin, up, Y, back, h / 2, 0.19, 0.08)  # backrest, leaning back
    c = (0.66, SEAT_Y, 0.58)
    e1 = (0.0, 1.0, 0.0)
    e2 = norm((0.55, 0.0, 0.83))
    ring = [tuple(c[i] + 0.14 * (math.cos(t) * e1[i] + math.sin(t) * e2[i]) for i in range(3)) for t in (2 * math.pi * k / 72 for k in range(72))]
    tube(bm, ring, 0.016, closed=True)
    axis = norm(cross(e1, e2))  # the column runs from the wheel's hub forward and down
    if axis[0] < 0:
        axis = tuple(-v for v in axis)
    start = tuple(c[i] + axis[i] * 0.03 for i in range(3))
    tube(bm, [start, tuple(start[i] + axis[i] * 0.2 for i in range(3))], 0.02)
    new_object("cabin", bm)


def build_pipes(mounts):
    """Air lines: from each end of the front lower tank along the floor edge to the sill
    nozzles, and from the back top tank down to the two tail nozzles."""
    bm = bmesh.new()
    r = 0.014
    zc = FLOOR_Z1 + GAP + TANK_R  # lower row center
    zt = zc + 2 * TANK_R * 0.87 + 0.006  # upper row center
    my, mz = 0.6, FLOOR_Z1 + 0.012
    for side in (1, -1):
        y_end = side * (TANK_HALF + 0.02)
        tube(bm, spline([(-0.2, y_end, zc), (-0.2, side * 0.62, zc - 0.07), (-0.05, side * my, mz)]), r)
        sill = [m for m in mounts if m[0] in ("nozzle", "nozzles") and m[1][1] * side > 0]
        xs = sorted(m[1][0] for m in sill)
        a, b = xs[0] - 0.04, xs[-1] + 0.04
        tube(bm, [(a + (b - a) * k / 40, side * my, mz) for k in range(41)], r)
        for _, top, _ in sill:  # stubs out toward each nozzle, stopping clear of the shell
            tube(bm, [(top[0], side * (my + r + 0.006), mz), (top[0], side * 0.68, mz)], r * 0.8)
        rear = next(m for m in mounts if m[0] == "rear" and m[1][1] * side > 0)
        rx, ry, rz = rear[1]
        tube(bm, spline([(-0.56, y_end, zt), (-0.57, side * 0.66, zt - 0.02), (-0.72, side * 0.62, zt - 0.08), (-1.0, side * 0.42, 0.42), (-1.6, side * 0.36, 0.34), (rx + 0.05, ry, rz + 0.1)]), r)
    new_object("pipes", bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "coupe.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_body()
    build_glass()
    build_lights()
    build_trim()
    build_wing()
    build_floor()
    build_cabin()
    build_tanks()
    build_wheels()
    build_pipes(nozzle_mounts())
    exits = build_nozzles()
    build_jets(exits)
    build_push()
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[coupe] wrote {out}")


main()
